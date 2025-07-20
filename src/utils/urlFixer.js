/**
 * Simple URL Fixer - Fixes known problematic image URLs
 * Based on DEBUG_REPORT.md analysis
 */

export class URLFixer {
  constructor() {
    // Known problematic patterns and their fixes
    this.fixes = {
      // Mark ALL Amazon domains for removal - they all block CORS
      'images-na.ssl-images-amazon.com': null,
      'ssl-images-amazon.com': null,
      'ecx.images-amazon.com': null,
      'm.media-amazon.com': null,
      
      // CloudFront issues - mark for removal
      'd2arxad8u2l0g7.cloudfront.net': null
    };
    
    // Domains to completely avoid (move to end of fallback list)
    this.problematicDomains = [
      'amazon.com',
      'cloudfront.net',
      'ssl-images-amazon.com',
      'm.media-amazon.com',
      'd2arxad8u2l0g7.cloudfront.net'
    ];
  }

  /**
   * Fix a single URL by applying known transformations
   */
  fixUrl(url) {
    if (!url || typeof url !== 'string') return null;
    
    // Check if URL should be removed entirely
    for (const [badDomain, goodDomain] of Object.entries(this.fixes)) {
      if (goodDomain === null && url.includes(badDomain)) {
        console.log(`🚫 Blocking problematic URL: ${badDomain}`);
        return null; // Remove this URL entirely
      }
    }
    
    let fixedUrl = url;
    
    // Apply domain fixes (only if goodDomain is not null)
    for (const [badDomain, goodDomain] of Object.entries(this.fixes)) {
      if (goodDomain && fixedUrl.includes(badDomain)) {
        fixedUrl = fixedUrl.replace(badDomain, goodDomain);
        console.log(`🔧 Fixed URL: ${badDomain} → ${goodDomain}`);
      }
    }
    
    // Ensure HTTPS
    if (fixedUrl.startsWith('http://')) {
      fixedUrl = fixedUrl.replace('http://', 'https://');
    }
    
    return fixedUrl;
  }

  /**
   * Check if URL is from a problematic domain
   */
  isProblematicUrl(url) {
    if (!url) return false;
    return this.problematicDomains.some(domain => url.includes(domain));
  }

  /**
   * Process an array of URLs, fixing and prioritizing them
   */
  processUrls(urls) {
    if (!Array.isArray(urls)) return [];
    
    const processed = urls
      .map(url => this.fixUrl(url))
      .filter(Boolean) // Remove null/undefined
      .filter(url => url.length < 2000) // Remove suspiciously long URLs
      .filter(url => !url.includes('undefined') && !url.includes('null'));
    
    // Separate good and problematic URLs
    const goodUrls = processed.filter(url => !this.isProblematicUrl(url));
    const problematicUrls = processed.filter(url => this.isProblematicUrl(url));
    
    // Return good URLs first, problematic URLs last
    return [...goodUrls, ...problematicUrls];
  }

  /**
   * Generate additional reliable URLs for a book based on ISBN
   */
  generateReliableUrls(book) {
    const urls = [];
    const isbn = this.cleanISBN(book.isbn || book.metadata?.isbn);
    
    if (isbn) {
      // Top reliable sources based on DEBUG_REPORT.md
      urls.push(`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`);
      urls.push(`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`);
      
      // Archive.org (reliable)
      urls.push(`https://archive.org/services/img/${isbn}`);
      
      // Convert ISBN-13 to ISBN-10 if needed
      const isbn10 = this.convertToISBN10(isbn);
      if (isbn10 && isbn10 !== isbn) {
        urls.push(`https://covers.openlibrary.org/b/isbn/${isbn10}-L.jpg`);
      }
    }
    
    return urls;
  }

  /**
   * Clean and validate ISBN
   */
  cleanISBN(isbn) {
    if (!isbn) return null;
    const cleaned = isbn.replace(/[^\dX]/gi, '').toUpperCase();
    return (cleaned.length === 10 || cleaned.length === 13) ? cleaned : null;
  }

  /**
   * Convert ISBN-13 to ISBN-10
   */
  convertToISBN10(isbn) {
    if (!isbn || isbn.length !== 13 || !isbn.startsWith('978')) return null;
    
    const isbn9 = isbn.slice(3, 12);
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(isbn9[i]) * (10 - i);
    }
    const remainder = sum % 11;
    const checkDigit = remainder === 0 ? '0' : remainder === 1 ? 'X' : (11 - remainder).toString();
    
    return isbn9 + checkDigit;
  }
}

export const urlFixer = new URLFixer();