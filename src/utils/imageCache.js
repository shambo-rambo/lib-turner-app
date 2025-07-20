/**
 * Image Cache and Optimization Utility
 * Netflix-inspired image handling for LibFlix
 */

import { useState, useEffect } from 'react';
import { reliableImageSources } from './reliableImageSources';

class ImageCache {
  constructor() {
    this.cache = new Map();
    this.preloadQueue = new Set();
    this.failedUrls = new Set();
  }

  /**
   * Preload and cache an image with optimization
   */
  async preloadImage(url, priority = 'normal') {
    if (this.cache.has(url) || this.failedUrls.has(url)) {
      return this.cache.get(url) || null;
    }

    if (this.preloadQueue.has(url)) {
      // Already being loaded, wait for it
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.cache.has(url) || this.failedUrls.has(url)) {
            clearInterval(checkInterval);
            resolve(this.cache.get(url) || null);
          }
        }, 10);
      });
    }

    this.preloadQueue.add(url);

    return new Promise((resolve) => {
      const img = new Image();
      
      // FIXED: Remove problematic CORS and loading attributes
      // These cause failures on many book cover APIs
      // img.crossOrigin = 'anonymous'; // REMOVED - causes CORS failures
      // img.loading = priority === 'high' ? 'eager' : 'lazy'; // REMOVED - causes issues
      img.decoding = 'async'; // Keep this - helps performance
      
      // Shorter timeout for better UX
      const timeout = setTimeout(() => {
        this.failedUrls.add(url);
        this.preloadQueue.delete(url);
        resolve(null);
      }, 8000); // Increased to 8 seconds for slow book servers

      img.onload = () => {
        clearTimeout(timeout);
        
        // Skip canvas conversion for faster loading - just cache the URL
        this.cache.set(url, {
          url: url,
          originalUrl: url,
          element: img,
          loaded: true,
          timestamp: Date.now(),
          size: { width: img.naturalWidth, height: img.naturalHeight }
        });
        this.preloadQueue.delete(url);
        resolve(this.cache.get(url));
      };

      img.onerror = () => {
        clearTimeout(timeout);
        this.failedUrls.add(url);
        this.preloadQueue.delete(url);
        resolve(null);
      };

      img.src = url;
    });
  }

  /**
   * Enhanced URL validation
   */
  validateImageUrl(url) {
    try {
      const parsed = new URL(url);
      
      // More strict validation
      const isValidProtocol = ['http:', 'https:'].includes(parsed.protocol);
      const hasValidExtension = /\.(jpg|jpeg|png|gif|webp)(\?|$|&)/i.test(url);
      const isNotEmpty = !url.includes('undefined') && !url.includes('null');
      const isReasonableLength = url.length < 2000;
      
      // Check for known problematic domains
      const problematicDomains = [
        'images-na.ssl-images-amazon.com', // High CORS failure
        'd2arxad8u2l0g7.cloudfront.net'    // Access restrictions
      ];
      
      const isDomainOk = !problematicDomains.some(domain => url.includes(domain));
      
      return isValidProtocol && hasValidExtension && isNotEmpty && isReasonableLength && isDomainOk;
    } catch {
      return false;
    }
  }

  /**
   * Enhanced image loading with better error handling and retry logic
   */
  async loadImageWithFallbacks(urls, priority = 'normal', bookData = null, retryCount = 0) {
    // Get optimized URLs
    let prioritizedUrls = urls;
    if (bookData) {
      prioritizedUrls = reliableImageSources.getOptimizedUrls(bookData);
    } else {
      prioritizedUrls = reliableImageSources.prioritizeUrls(urls);
    }
    
    // Enhanced filtering
    const validUrls = prioritizedUrls
      .filter(url => url && this.validateImageUrl(url))
      .slice(0, 8); // Increased to 8 URLs with new sources
    
    console.log(`Trying ${validUrls.length} URLs for book:`, bookData?.title || 'Unknown');
    
    for (let i = 0; i < validUrls.length; i++) {
      const url = validUrls[i];
      try {
        // Skip permanently failed URLs, but allow retry for timeouts
        if (this.failedUrls.has(url) && retryCount === 0) {
          console.log(`Skipping known failed URL: ${url}`);
          continue;
        }

        console.log(`Attempting URL ${i + 1}/${validUrls.length}: ${url}`);
        const result = await this.preloadImage(url, priority);
        if (result) {
          console.log(`✅ Success with URL ${i + 1}: ${url}`);
          // Remove from failed URLs if it succeeded on retry
          this.failedUrls.delete(url);
          return result;
        } else {
          console.log(`❌ Failed URL ${i + 1}: ${url}`);
        }
      } catch (error) {
        console.warn(`Error loading ${url}:`, error);
      }
    }
    
    // Retry logic for temporary failures
    if (retryCount === 0 && bookData) {
      console.log(`🔄 Retrying with fresh URLs for: ${bookData.title}`);
      // Wait 2 seconds before retry to handle temporary network issues
      await new Promise(resolve => setTimeout(resolve, 2000));
      return this.loadImageWithFallbacks(urls, priority, bookData, 1);
    }
    
    console.log(`❌ All URLs failed for book: ${bookData?.title || 'Unknown'} (after ${retryCount + 1} attempts)`);
    
    // Record the failing book for analysis
    if (bookData && typeof window !== 'undefined') {
      try {
        const { imageDebugger } = await import('./imageDebugger.js');
        imageDebugger.recordFailingBook?.(bookData, validUrls);
      } catch (error) {
        console.warn('Could not record failing book:', error);
      }
    }
    
    return null;
  }

  /**
   * Get cached image or return null
   */
  getCachedImage(url) {
    return this.cache.get(url) || null;
  }

  /**
   * Check if image loading failed
   */
  hasFailed(url) {
    return this.failedUrls.has(url);
  }

  /**
   * Batch preload multiple images for better performance
   */
  async batchPreload(urls, priority = 'normal', maxConcurrent = 6) {
    const chunks = [];
    for (let i = 0; i < urls.length; i += maxConcurrent) {
      chunks.push(urls.slice(i, i + maxConcurrent));
    }

    const results = [];
    for (const chunk of chunks) {
      const chunkResults = await Promise.allSettled(
        chunk.map(url => this.preloadImage(url, priority))
      );
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Clear old cache entries (run periodically)
   */
  cleanup(maxAge = 30 * 60 * 1000) { // 30 minutes
    const now = Date.now();
    for (const [url, data] of this.cache.entries()) {
      if (now - data.timestamp > maxAge) {
        this.cache.delete(url);
      }
    }
    
    // Clear failed URLs periodically to allow retries for temporary issues
    // Clear failed URLs every 10 minutes to allow retry of temporary failures
    if (this.lastFailedCleanup && (now - this.lastFailedCleanup) > 10 * 60 * 1000) {
      const beforeCount = this.failedUrls.size;
      this.failedUrls.clear();
      this.lastFailedCleanup = now;
      console.log(`🔄 Cleared ${beforeCount} failed URLs to allow retries`);
    } else if (!this.lastFailedCleanup) {
      this.lastFailedCleanup = now;
    }
  }

  /**
   * Preload visible book covers (Netflix-style viewport optimization)
   */
  preloadVisibleBooks(books, startIndex = 0, count = 12) {
    const visibleBooks = books.slice(startIndex, startIndex + count);
    
    visibleBooks.forEach((book, index) => {
      const urls = [
        book.metadata.cover_url,
        ...(book.metadata.fallback_urls || [])
      ].filter(Boolean);

      // High priority for first 6 books, normal for rest
      const priority = index < 6 ? 'high' : 'normal';
      
      this.loadImageWithFallbacks(urls, priority);
    });
  }

  /**
   * Reset failed URLs to allow retry
   */
  resetFailedUrls() {
    this.failedUrls.clear();
  }

  /**
   * Get cache stats for debugging
   */
  getStats() {
    return {
      cached: this.cache.size,
      failed: this.failedUrls.size,
      loading: this.preloadQueue.size
    };
  }
}

// Create global instance
export const imageCache = new ImageCache();

// Cleanup every 10 minutes
setInterval(() => {
  imageCache.cleanup();
}, 10 * 60 * 1000);

/**
 * Hook for optimized image loading
 */
export const useImageOptimization = (book) => {
  const [imageState, setImageState] = useState('loading');
  const [cachedImage, setCachedImage] = useState(null);

  useEffect(() => {
    if (book?.metadata?.cover_url) {
      const urls = [
        book.metadata.cover_url,
        ...(book.metadata.fallback_urls || [])
      ].filter(Boolean);
      
      const loadImage = async () => {
        setImageState('loading');
        const result = await imageCache.loadImageWithFallbacks(urls, 'high');
        if (result) {
          setCachedImage(result);
          setImageState('loaded');
        } else {
          setImageState('failed');
        }
      };

      loadImage();
    }
  }, [book?.id]);

  return { imageState, cachedImage };
};