/**
 * Enhanced Image Cache with Better Error Handling and URL Optimization
 * Fixes the major issues identified in the debug analysis
 */

class EnhancedImageCache {
  constructor() {
    this.cache = new Map();
    this.failedUrls = new Set();
    this.domainStats = new Map();
    this.debugMode = process.env.NODE_ENV === 'development';
  }

  /**
   * Optimize and prioritize URLs based on known reliability patterns
   */
  optimizeUrls(urls) {
    if (!Array.isArray(urls)) return [];
    
    const optimizedUrls = urls
      .filter(Boolean)
      .map(url => this.optimizeUrl(url))
      .filter(Boolean);

    // Sort by reliability (most reliable first)
    return optimizedUrls.sort((a, b) => {
      const scoreA = this.getReliabilityScore(a);
      const scoreB = this.getReliabilityScore(b);
      return scoreB - scoreA; // Higher score first
    });
  }

  /**
   * Optimize individual URLs by fixing known problems
   */
  optimizeUrl(url) {
    if (!url || typeof url !== 'string') return null;

    // Fix Amazon SSL-images URLs (major reliability issue)
    if (url.includes('ssl-images-amazon.com')) {
      // Try to extract the image ID and use direct Amazon media URL
      const amazonMatch = url.match(/\/([A-Z0-9]{10,})\.jpg/);
      if (amazonMatch) {
        return `https://m.media-amazon.com/images/I/${amazonMatch[1]}.jpg`;
      }
      // If we can't extract ID, mark as low priority but keep
      return url;
    }

    // Optimize Google Books URLs
    if (url.includes('books.google.com') && !url.includes('&img=1')) {
      return url + (url.includes('?') ? '&' : '?') + 'img=1&zoom=1';
    }

    // Ensure HTTPS
    if (url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }

    return url;
  }

  /**
   * Get reliability score for URL prioritization
   */
  getReliabilityScore(url) {
    const domain = this.extractDomain(url);
    
    // Reliability scores based on analysis
    const domainScores = {
      'm.media-amazon.com': 95,           // Most reliable
      'covers.openlibrary.org': 85,       // Generally reliable
      'images-na.ssl-images-amazon.com': 30, // Known problems
      'd2arxad8u2l0g7.cloudfront.net': 25,   // Access issues
      'books.google.com': 40,             // CORS issues
    };

    let score = domainScores[domain] || 50; // Default score

    // Penalty for known problematic patterns
    if (url.includes('compressed.photo.goodreads.com')) score -= 20;
    if (url.includes('ssl-images-amazon.com')) score -= 30;
    if (!url.includes('https://')) score -= 10;
    
    // Bonus for good patterns
    if (url.includes('.jpg') || url.includes('.png')) score += 5;
    if (url.length < 200) score += 5; // Shorter URLs tend to be more reliable

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Extract domain from URL safely
   */
  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return 'invalid';
    }
  }

  /**
   * Enhanced image loading with optimized error handling
   */
  async loadImageWithFallbacks(urls, priority = 'normal') {
    const optimizedUrls = this.optimizeUrls(urls);
    
    if (optimizedUrls.length === 0) {
      return null;
    }

    // Track domain statistics
    optimizedUrls.forEach(url => {
      const domain = this.extractDomain(url);
      if (!this.domainStats.has(domain)) {
        this.domainStats.set(domain, { attempts: 0, failures: 0 });
      }
    });

    for (let i = 0; i < optimizedUrls.length; i++) {
      const url = optimizedUrls[i];
      
      // Skip if we know this URL failed recently
      if (this.failedUrls.has(url)) {
        continue;
      }

      try {
        const result = await this.loadSingleImage(url, priority);
        if (result) {
          this.logSuccess(url);
          return result;
        }
      } catch (error) {
        this.logFailure(url, error);
        
        // For SSL-images URLs, skip remaining SSL-images URLs
        if (url.includes('ssl-images-amazon.com')) {
          this.debugLog(`Skipping remaining SSL-images URLs due to failure: ${error.message}`);
          // Skip any remaining ssl-images URLs in the array
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Load a single image with enhanced error handling
   */
  async loadSingleImage(url, priority = 'normal') {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // Enhanced timeout based on domain
      const timeout = this.getTimeoutForDomain(url);
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout after ${timeout}ms`));
      }, timeout);

      // Enhanced image configuration
      img.loading = priority === 'high' ? 'eager' : 'lazy';
      img.decoding = 'async';
      img.crossOrigin = 'anonymous';
      img.referrerPolicy = 'no-referrer';

      const domain = this.extractDomain(url);
      this.domainStats.get(domain).attempts++;

      img.onload = () => {
        clearTimeout(timeoutId);
        
        // Additional validation
        if (img.naturalWidth === 0 || img.naturalHeight === 0) {
          reject(new Error('Invalid image dimensions'));
          return;
        }

        const result = {
          url: url,
          originalUrl: url,
          element: img,
          loaded: true,
          timestamp: Date.now(),
          size: { width: img.naturalWidth, height: img.naturalHeight },
          domain: domain
        };

        this.cache.set(url, result);
        resolve(result);
      };

      img.onerror = (event) => {
        clearTimeout(timeoutId);
        const error = new Error(`Image load failed: ${event.type}`);
        error.url = url;
        error.domain = domain;
        reject(error);
      };

      img.src = url;
    });
  }

  /**
   * Get appropriate timeout based on domain reliability
   */
  getTimeoutForDomain(url) {
    const domain = this.extractDomain(url);
    
    const timeouts = {
      'm.media-amazon.com': 3000,           // Fast timeout for reliable domains
      'covers.openlibrary.org': 4000,       
      'images-na.ssl-images-amazon.com': 2000, // Very fast timeout for unreliable
      'd2arxad8u2l0g7.cloudfront.net': 2000,   // Quick fail for problematic
      'books.google.com': 3000,
    };

    return timeouts[domain] || 3500; // Default timeout
  }

  /**
   * Log successful load
   */
  logSuccess(url) {
    if (this.debugMode) {
      console.log(`✅ Image loaded successfully: ${url}`);
    }
  }

  /**
   * Log and track failures
   */
  logFailure(url, error) {
    this.failedUrls.add(url);
    
    const domain = this.extractDomain(url);
    if (this.domainStats.has(domain)) {
      this.domainStats.get(domain).failures++;
    }

    if (this.debugMode) {
      console.warn(`❌ Image load failed: ${url}`, error.message);
      
      // Special logging for known problematic URLs
      if (url.includes('ssl-images-amazon.com')) {
        console.warn(`🚨 SSL-images Amazon URL failed (expected): ${url}`);
      } else if (url.includes('cloudfront.net')) {
        console.warn(`🔒 CloudFront access restricted: ${url}`);
      }
    }
  }

  /**
   * Debug logging
   */
  debugLog(message) {
    if (this.debugMode) {
      console.log(`🔍 EnhancedImageCache: ${message}`);
    }
  }

  /**
   * Get enhanced statistics including domain performance
   */
  getEnhancedStats() {
    const stats = {
      cached: this.cache.size,
      failed: this.failedUrls.size,
      domainStats: Object.fromEntries(this.domainStats.entries())
    };

    // Calculate success rates by domain
    Object.entries(stats.domainStats).forEach(([domain, data]) => {
      data.successRate = data.attempts > 0 
        ? ((data.attempts - data.failures) / data.attempts * 100).toFixed(1) + '%'
        : '0%';
    });

    return stats;
  }

  /**
   * Clear failed URLs to allow retry
   */
  clearFailedUrls() {
    this.failedUrls.clear();
    this.debugLog('Cleared failed URLs cache');
  }

  /**
   * Get cached image
   */
  getCachedImage(url) {
    return this.cache.get(url) || null;
  }

  /**
   * Print enhanced debug report
   */
  printDebugReport() {
    const stats = this.getEnhancedStats();
    
    console.group('📊 Enhanced Image Cache Report');
    console.log(`Total cached: ${stats.cached}`);
    console.log(`Total failed: ${stats.failed}`);
    
    console.group('🌐 Domain Performance:');
    Object.entries(stats.domainStats).forEach(([domain, data]) => {
      const emoji = data.successRate.startsWith('100') ? '✅' : 
                   parseFloat(data.successRate) > 80 ? '🟢' :
                   parseFloat(data.successRate) > 50 ? '🟡' : '🔴';
      console.log(`${emoji} ${domain}: ${data.successRate} success (${data.attempts} attempts, ${data.failures} failures)`);
    });
    console.groupEnd();
    
    console.groupEnd();
  }
}

// Create enhanced instance
export const enhancedImageCache = new EnhancedImageCache();

// Export for backward compatibility
export const imageCache = enhancedImageCache;

export default enhancedImageCache;