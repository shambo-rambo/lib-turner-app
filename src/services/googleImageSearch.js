/**
 * Google Custom Search API Integration for Book Covers
 * Uses Google Custom Search API to find high-quality book cover images
 */

class GoogleImageSearch {
  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_CUSTOM_SEARCH_API_KEY;
    this.searchEngineId = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;
    this.cache = new Map();
    
    // Validate API keys to prevent using placeholder values
    this.apiEnabled = this.validateApiKeys();
    if (!this.apiEnabled) {
      console.warn('⚠️ Google Custom Search API disabled: Invalid or missing API keys');
    }
  }

  /**
   * Validate that API keys are not placeholder values
   */
  validateApiKeys() {
    if (!this.apiKey || !this.searchEngineId) {
      return false;
    }
    
    // Check for common placeholder patterns
    const placeholders = [
      'your_api_key_here',
      'your_search_engine_id_here',
      'placeholder',
      'xxx',
      'replace_me'
    ];
    
    const keyLower = this.apiKey.toLowerCase();
    const engineIdLower = this.searchEngineId.toLowerCase();
    
    for (const placeholder of placeholders) {
      if (keyLower.includes(placeholder) || engineIdLower.includes(placeholder)) {
        return false;
      }
    }
    
    // Basic format validation (Google API keys are typically 39 chars, engine IDs are shorter)
    if (this.apiKey.length < 20 || this.searchEngineId.length < 5) {
      return false;
    }
    
    return true;
  }

  /**
   * Find book cover using multiple fallback sources
   * @param {Object} bookData - Book information
   * @returns {Promise<string|null>} - Image URL or null
   */
  async findBookCover(bookData) {
    try {
      console.log('🔍 Google Image Search called with:', {
        title: bookData?.title,
        apiEnabled: this.apiEnabled,
        hasApiKey: !!this.apiKey,
        hasSearchEngineId: !!this.searchEngineId,
        bookDataKeys: Object.keys(bookData || {})
      });

      // Skip API calls if keys are invalid
      if (!this.apiEnabled) {
        console.log(`⚠️ Google Custom Search disabled for: ${bookData?.title}`);
        return null;
      }

      const cacheKey = this.generateCacheKey(bookData);
      console.log(`🔑 Cache key for ${bookData?.title}: "${cacheKey}" (cache size: ${this.cache.size})`);
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (cached.timestamp > Date.now() - 24 * 60 * 60 * 1000) { // 24 hour cache
          console.log(`📦 Using cached search for: ${bookData.title} -> ${cached.imageUrl}`);
          return cached.imageUrl;
        } else {
          console.log(`⏰ Cache expired for: ${bookData.title}`);
        }
      } else {
        console.log(`❌ No cache found for: ${bookData.title}`);
      }

      console.log(`🔍 Searching additional sources for: ${bookData.title}`);

      // Try multiple approaches
      const sources = [
        () => this.tryGoogleCustomSearch(bookData),
        () => this.tryISBNSources(bookData),
        () => this.tryAlternativeISBNFormats(bookData)
      ];

      for (const source of sources) {
        try {
          const imageUrl = await source();
          if (imageUrl) {
            // Cache the result
            this.cache.set(cacheKey, {
              imageUrl,
              timestamp: Date.now()
            });
            
            console.log(`✅ Found cover from additional source: ${bookData.title} - URL: ${imageUrl}`);
            console.log(`💾 Cached result for key: "${cacheKey}"`);
            return imageUrl;
          }
        } catch (error) {
          console.warn(`Source failed for ${bookData.title}:`, error.message);
        }
      }

      console.log(`❌ No additional sources found for: ${bookData.title}`);
      return null;

    } catch (error) {
      console.error(`❌ Additional search error for ${bookData.title}:`, error);
      return null;
    }
  }

  /**
   * Create optimized search query for book covers
   */
  createSearchQuery(bookData) {
    const title = bookData?.title || '';
    const author = bookData?.author;
    
    // Simpler search query like your working manual search
    let query = `${title} book cover`;
    if (author && author !== 'undefined' && author.trim()) {
      query += ` ${author}`;
    }
    
    return query;
  }

  /**
   * Build Google Custom Search API URL
   */
  buildSearchUrl(query) {
    const params = new URLSearchParams({
      key: this.apiKey,
      cx: this.searchEngineId,
      q: query,
      searchType: 'image',
      num: 10, // Get multiple results to choose from
      safe: 'active', // Safe search for school use
      fileType: 'jpg,png'
      // Removed Creative Commons restrictions to find more book covers
    });

    return `https://www.googleapis.com/customsearch/v1?${params.toString()}`;
  }

  /**
   * Select the best image from search results
   */
  selectBestImage(items, bookData) {
    if (!items || items.length === 0) return null;

    // Filter out problematic domains that we know cause CORS issues
    const filteredItems = items.filter(item => {
      const url = item.link;
      const problematicDomains = [
        'm.media-amazon.com',
        'images-na.ssl-images-amazon.com',
        'ssl-images-amazon.com',
        'ecx.images-amazon.com',
        'd2arxad8u2l0g7.cloudfront.net'
      ];
      
      return !problematicDomains.some(domain => url.includes(domain));
    });
    
    console.log(`🔍 Filtered ${items.length - filteredItems.length} problematic URLs, ${filteredItems.length} remaining`);

    if (filteredItems.length === 0) return null;

    // Score images based on various criteria
    const scoredImages = filteredItems.map(item => ({
      url: item.link,
      score: this.scoreImage(item, bookData),
      item
    }));

    // Sort by score (highest first)
    scoredImages.sort((a, b) => b.score - a.score);

    // Return the highest scored image
    return scoredImages[0]?.url || null;
  }

  /**
   * Score an image based on relevance and quality criteria
   */
  scoreImage(item, bookData) {
    let score = 0;
    const title = (bookData?.title || '').toLowerCase();
    const author = (bookData?.author || '').toLowerCase();
    
    // Check image metadata
    const imageTitle = (item.title || '').toLowerCase();
    const imageSnippet = (item.snippet || '').toLowerCase();
    const imageContext = (item.image?.contextLink || '').toLowerCase();

    // Title match in image title/snippet
    if (imageTitle.includes(title) || imageSnippet.includes(title)) {
      score += 50;
    }

    // Author match
    if (imageTitle.includes(author) || imageSnippet.includes(author)) {
      score += 30;
    }

    // Book-related terms
    if (imageTitle.includes('book cover') || imageSnippet.includes('book cover')) {
      score += 20;
    }

    // Prefer certain domains
    const goodDomains = ['amazon.com', 'goodreads.com', 'barnesandnoble.com', 'bookdepository.com'];
    if (goodDomains.some(domain => imageContext.includes(domain))) {
      score += 15;
    }

    // Image size preference (larger is better for book covers)
    const width = parseInt(item.image?.width) || 0;
    const height = parseInt(item.image?.height) || 0;
    
    if (width > 300 && height > 400) {
      score += 10;
    }

    // Aspect ratio preference (book covers are typically tall rectangles)
    if (height > width * 1.2) {
      score += 10;
    }

    return score;
  }

  /**
   * Try Google Custom Search API for book covers
   */
  async tryGoogleCustomSearch(bookData) {
    if (!this.apiKey || !this.searchEngineId) {
      console.warn('❌ Google Custom Search API key or search engine ID not configured');
      return null;
    }

    try {
      const query = this.createSearchQuery(bookData);
      const searchUrl = this.buildSearchUrl(query);
      
      console.log(`🔍 Searching Google for: ${query}`);
      console.log(`🌐 API Request URL: ${searchUrl}`);
      
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        if (response.status === 403) {
          console.error('❌ Google Custom Search API: 403 Forbidden - Check API key and quotas');
        } else {
          console.error(`❌ Google Custom Search API error: ${response.status}`);
        }
        return null;
      }
      
      const data = await response.json();
      console.log(`📊 API Response:`, { 
        totalResults: data.searchInformation?.totalResults,
        itemCount: data.items?.length || 0,
        hasError: !!data.error 
      });
      
      if (data.error) {
        console.error(`❌ Google API Error:`, data.error);
        return null;
      }
      
      if (!data.items || data.items.length === 0) {
        console.log(`ℹ️ No Google search results for: ${bookData.title}`);
        return null;
      }
      
      const bestImage = this.selectBestImage(data.items, bookData);
      if (bestImage) {
        console.log(`✅ Found Google image for: ${bookData.title} - ${bestImage}`);
        return bestImage;
      }
      
      return null;
      
    } catch (error) {
      console.error(`❌ Google Custom Search error for ${bookData.title}:`, error.message);
      return null;
    }
  }

  /**
   * Try alternative ISBN formats and sources
   */
  async tryAlternativeISBNFormats(bookData) {
    const isbn = bookData.isbn || bookData.metadata?.isbn;
    if (!isbn) return null;
    
    console.log(`📚 Trying alternative ISBN formats for: ${isbn}`);
    
    // Convert between ISBN-10 and ISBN-13 formats
    const alternativeISBN = this.convertISBN(isbn);
    
    if (alternativeISBN && alternativeISBN !== isbn) {
      // Try with converted ISBN
      const alternativeUrls = [
        `https://covers.openlibrary.org/b/isbn/${alternativeISBN}-L.jpg`,
        `https://covers.openlibrary.org/b/isbn/${alternativeISBN}-M.jpg`,
        `https://books.google.com/books/content?id=&printsec=frontcover&img=1&zoom=1&imgtk=${alternativeISBN}`,
      ];
      
      return alternativeUrls[0];
    }
    
    return null;
  }

  /**
   * Convert between ISBN-10 and ISBN-13 formats
   */
  convertISBN(isbn) {
    if (!isbn) return null;
    
    // Remove any hyphens or spaces
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    
    if (cleanISBN.length === 10) {
      // Convert ISBN-10 to ISBN-13
      const isbn13 = '978' + cleanISBN.slice(0, -1);
      let checksum = 0;
      for (let i = 0; i < 12; i++) {
        checksum += parseInt(isbn13[i]) * (i % 2 === 0 ? 1 : 3);
      }
      const checkDigit = (10 - (checksum % 10)) % 10;
      return isbn13 + checkDigit;
    } else if (cleanISBN.length === 13 && cleanISBN.startsWith('978')) {
      // Convert ISBN-13 to ISBN-10
      const isbn10Base = cleanISBN.slice(3, -1);
      let checksum = 0;
      for (let i = 0; i < 9; i++) {
        checksum += parseInt(isbn10Base[i]) * (10 - i);
      }
      const checkDigit = (11 - (checksum % 11)) % 11;
      const checkChar = checkDigit === 10 ? 'X' : checkDigit.toString();
      return isbn10Base + checkChar;
    }
    
    return null;
  }

  /**
   * Try direct ISBN-based sources as fallback
   */
  async tryISBNSources(bookData) {
    const isbn = bookData.isbn || bookData.metadata?.isbn;
    if (!isbn) return null;
    
    console.log(`📚 Trying primary ISBN sources for: ${isbn}`);
    
    // Try multiple reliable ISBN-based sources (avoiding blocked Amazon URLs)
    const isbnUrls = [
      `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
      `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
      `https://covers.oclc.org/ImageWebSvc/oclc/+-+${isbn}_140.jpg`,
      `https://books.google.com/books/content?id=${isbn}&printsec=frontcover&img=1&zoom=1`,
      `https://images.isbndb.com/covers/${isbn.slice(-2)}/${isbn.slice(-4)}/${isbn}.jpg`,
    ];
    
    // Return first URL (will be validated by image loading system)
    return isbnUrls[0];
  }

  /**
   * Generate cache key for book
   */
  generateCacheKey(bookData) {
    const title = (bookData?.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const author = (bookData?.author || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const isbn = bookData?.isbn || bookData?.metadata?.isbn || '';
    return `${title}_${author}_${isbn}`;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Create and export singleton instance
export const googleImageSearch = new GoogleImageSearch();