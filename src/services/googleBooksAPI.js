/**
 * Google Books API Service
 * Official API for book data and cover images
 */

const API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

class GoogleBooksAPI {
  constructor() {
    this.cache = new Map();
    this.rateLimitDelay = 100; // 100ms between requests
    this.lastRequestTime = 0;
  }

  /**
   * Rate limiting to respect API quotas
   */
  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => 
        setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Search books by ISBN (most reliable)
   */
  async getBookByISBN(isbn) {
    if (!API_KEY) {
      console.warn('Google Books API key not found, using fallback');
      return null;
    }

    // Clean ISBN (remove hyphens)
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    
    // Check cache first
    if (this.cache.has(cleanISBN)) {
      return this.cache.get(cleanISBN);
    }

    try {
      await this.rateLimit();
      
      const url = `${BASE_URL}?q=isbn:${cleanISBN}&key=${API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const book = this.processBookData(data.items[0]);
        this.cache.set(cleanISBN, book);
        return book;
      }

      return null;
    } catch (error) {
      console.error(`Failed to fetch book with ISBN ${isbn}:`, error);
      return null;
    }
  }

  /**
   * Search books by title and author
   */
  async searchBooks(title, author = '') {
    if (!API_KEY) {
      console.warn('Google Books API key not found, using fallback');
      return [];
    }

    const cacheKey = `${title}_${author}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      await this.rateLimit();
      
      let query = `intitle:"${title}"`;
      if (author) {
        query += `+inauthor:"${author}"`;
      }
      
      const url = `${BASE_URL}?q=${encodeURIComponent(query)}&maxResults=5&key=${API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.items) {
        const books = data.items.map(item => this.processBookData(item));
        this.cache.set(cacheKey, books);
        return books;
      }

      return [];
    } catch (error) {
      console.error(`Failed to search for "${title}" by ${author}:`, error);
      return [];
    }
  }

  /**
   * Process raw Google Books API data into our format
   */
  processBookData(item) {
    const volumeInfo = item.volumeInfo || {};
    const saleInfo = item.saleInfo || {};
    
    // Extract image URLs with different sizes
    const imageLinks = volumeInfo.imageLinks || {};
    const coverImages = {
      thumbnail: imageLinks.thumbnail?.replace('http:', 'https:'),
      small: imageLinks.small?.replace('http:', 'https:'),
      medium: imageLinks.medium?.replace('http:', 'https:'),
      large: imageLinks.large?.replace('http:', 'https:'),
      extraLarge: imageLinks.extraLarge?.replace('http:', 'https:'),
    };

    // Get the best available image (prefer larger sizes)
    const bestImage = coverImages.extraLarge || 
                     coverImages.large || 
                     coverImages.medium || 
                     coverImages.small || 
                     coverImages.thumbnail;

    // Extract ISBN
    const isbn = volumeInfo.industryIdentifiers?.find(
      id => id.type === 'ISBN_13' || id.type === 'ISBN_10'
    )?.identifier || '';

    return {
      googleBooksId: item.id,
      isbn: isbn,
      title: volumeInfo.title || 'Unknown Title',
      subtitle: volumeInfo.subtitle || '',
      authors: volumeInfo.authors || ['Unknown Author'],
      publisher: volumeInfo.publisher || '',
      publishedDate: volumeInfo.publishedDate || '',
      description: volumeInfo.description || '',
      pageCount: volumeInfo.pageCount || 0,
      categories: volumeInfo.categories || [],
      averageRating: volumeInfo.averageRating || 0,
      ratingsCount: volumeInfo.ratingsCount || 0,
      language: volumeInfo.language || 'en',
      
      // Image URLs
      coverImages: coverImages,
      primaryCoverUrl: bestImage,
      
      // Additional metadata
      maturityRating: volumeInfo.maturityRating || 'NOT_MATURE',
      previewLink: volumeInfo.previewLink || '',
      infoLink: volumeInfo.infoLink || '',
      canonicalVolumeLink: volumeInfo.canonicalVolumeLink || '',
      
      // Sales info
      saleability: saleInfo.saleability || 'NOT_FOR_SALE',
      listPrice: saleInfo.listPrice || null,
      retailPrice: saleInfo.retailPrice || null,
      buyLink: saleInfo.buyLink || '',
      
      // Metadata
      fetchedAt: new Date().toISOString(),
      source: 'google_books_api'
    };
  }

  /**
   * Get multiple books efficiently (batch processing)
   */
  async getBooksFromLibrary(libraryBooks) {
    const results = [];
    
    for (const book of libraryBooks) {
      try {
        // Try ISBN first (most accurate)
        let googleBook = null;
        if (book.isbn) {
          googleBook = await this.getBookByISBN(book.isbn);
        }
        
        // Fallback to title/author search
        if (!googleBook && book.title) {
          const searchResults = await this.searchBooks(book.title, book.author);
          googleBook = searchResults[0] || null;
        }
        
        if (googleBook) {
          // Merge with our existing data
          const enhancedBook = {
            ...book,
            metadata: {
              ...book.metadata,
              ...googleBook,
              // Prefer Google Books cover if available
              cover_url: googleBook.primaryCoverUrl || book.metadata.cover_url,
              fallback_urls: [
                googleBook.primaryCoverUrl,
                googleBook.coverImages.large,
                googleBook.coverImages.medium,
                googleBook.coverImages.small,
                // Open Library (most reliable external source)
                googleBook.isbn ? `https://covers.openlibrary.org/b/isbn/${googleBook.isbn}-L.jpg` : null,
                googleBook.isbn ? `https://covers.openlibrary.org/b/isbn/${googleBook.isbn.replace(/[-\s]/g, '')}-L.jpg` : null,
                googleBook.isbn ? `https://covers.openlibrary.org/b/isbn/${googleBook.isbn}-M.jpg` : null,
                // WorldCat covers
                googleBook.isbn ? `https://www.worldcat.org/wcpa/coveredart?isbn=${googleBook.isbn}&size=L` : null,
                book.metadata.cover_url,
                ...(book.metadata.fallback_urls || [])
              ].filter(Boolean)
            }
          };
          results.push(enhancedBook);
        } else {
          // Keep original if no Google Books data found
          results.push(book);
        }
        
        // Small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error(`Error processing book ${book.title}:`, error);
        results.push(book); // Keep original on error
      }
    }
    
    return results;
  }

  /**
   * Get API usage stats
   */
  getStats() {
    return {
      cachedItems: this.cache.size,
      hasApiKey: !!API_KEY,
      rateLimitDelay: this.rateLimitDelay
    };
  }
}

// Create singleton instance
export const googleBooksAPI = new GoogleBooksAPI();

/**
 * Utility function to enhance existing book data with Google Books API
 */
export const enhanceBookWithGoogleAPI = async (book) => {
  return await googleBooksAPI.getBooksFromLibrary([book]).then(results => results[0]);
};

/**
 * Test function to verify API is working
 */
export const testGoogleBooksAPI = async () => {
  console.log('Testing Google Books API...');
  console.log('API Stats:', googleBooksAPI.getStats());
  
  if (!API_KEY) {
    console.warn('No API key found. Add VITE_GOOGLE_BOOKS_API_KEY to .env.local');
    return false;
  }
  
  try {
    // Test with Harry Potter ISBN
    const testBook = await googleBooksAPI.getBookByISBN('9780439708180');
    console.log('Test result:', testBook ? 'SUCCESS' : 'NO_RESULTS');
    if (testBook) {
      console.log('Cover URL:', testBook.primaryCoverUrl);
    }
    return !!testBook;
  } catch (error) {
    console.error('API test failed:', error);
    return false;
  }
};