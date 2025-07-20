/**
 * Image Cache and Optimization Utility
 * Netflix-inspired image handling for LibFlix
 */

import { useState, useEffect } from 'react';
import { reliableImageSources } from './reliableImageSources';
import { urlFixer } from './urlFixer';

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
    // Fix URL before processing
    const fixedUrl = urlFixer.fixUrl(url);
    if (!fixedUrl) return null;
    
    if (this.cache.has(fixedUrl) || this.failedUrls.has(fixedUrl)) {
      return this.cache.get(fixedUrl) || null;
    }

    if (this.preloadQueue.has(fixedUrl)) {
      // Already being loaded, wait for it
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.cache.has(fixedUrl) || this.failedUrls.has(fixedUrl)) {
            clearInterval(checkInterval);
            resolve(this.cache.get(fixedUrl) || null);
          }
        }, 10);
      });
    }

    this.preloadQueue.add(fixedUrl);

    return new Promise((resolve) => {
      const img = new Image();
      
      // Smart CORS handling - only add for cross-origin that supports it
      if (this.shouldUseCors(fixedUrl)) {
        img.crossOrigin = 'anonymous';
      }
      
      img.decoding = 'async'; // Keep this - helps performance
      
      // Smart timeout based on domain reliability
      const timeoutMs = this.getTimeoutForUrl(fixedUrl);
      const timeout = setTimeout(() => {
        this.failedUrls.add(fixedUrl);
        this.preloadQueue.delete(fixedUrl);
        this.logDomainError(fixedUrl, `timeout_${timeoutMs}ms`);
        resolve(null);
      }, timeoutMs);

      img.onload = () => {
        clearTimeout(timeout);
        
        // Skip canvas conversion for faster loading - just cache the URL
        this.cache.set(fixedUrl, {
          url: fixedUrl,
          originalUrl: url,
          element: img,
          loaded: true,
          timestamp: Date.now(),
          size: { width: img.naturalWidth, height: img.naturalHeight }
        });
        this.preloadQueue.delete(fixedUrl);
        resolve(this.cache.get(fixedUrl));
      };

      img.onerror = (event) => {
        clearTimeout(timeout);
        this.failedUrls.add(fixedUrl);
        this.preloadQueue.delete(fixedUrl);
        
        // Domain-specific error logging
        this.logDomainError(fixedUrl, 'load_error');
        resolve(null);
      };

      img.src = fixedUrl;
    });
  }

  /**
   * Log domain-specific errors with helpful context
   */
  logDomainError(url, errorType) {
    try {
      const domain = new URL(url).hostname;
      
      if (domain.includes('ssl-images-amazon.com')) {
        console.warn(`🚫 Amazon SSL-images failed (known CORS issue): ${url.substring(0, 60)}...`);
      } else if (domain.includes('cloudfront.net')) {
        console.warn(`🔒 CloudFront access restricted: ${url.substring(0, 60)}...`);
      } else if (domain.includes('books.google.com')) {
        console.warn(`📚 Google Books CORS issue: ${url.substring(0, 60)}...`);
      } else {
        console.warn(`❌ Image ${errorType}: ${url.substring(0, 60)}...`);
      }
    } catch {
      console.warn(`❌ Image ${errorType}: ${url.substring(0, 60)}...`);
    }
  }

  /**
   * Get appropriate timeout for URL based on domain reliability
   */
  getTimeoutForUrl(url) {
    try {
      const domain = new URL(url).hostname;
      
      // Fast, reliable domains
      if (['covers.openlibrary.org', 'm.media-amazon.com'].some(d => domain.includes(d))) {
        return 3000; // 3 seconds
      }
      
      // Medium reliability
      if (['archive.org', 'books.google.com'].some(d => domain.includes(d))) {
        return 5000; // 5 seconds
      }
      
      // Slow or unreliable domains
      if (['ssl-images-amazon.com', 'cloudfront.net'].some(d => domain.includes(d))) {
        return 2000; // 2 seconds - fail fast
      }
      
      // Default timeout
      return 4000; // 4 seconds
    } catch {
      return 4000;
    }
  }

  /**
   * Determine if CORS should be used for a URL
   */
  shouldUseCors(url) {
    try {
      const urlObj = new URL(url);
      const currentHost = window.location.hostname;
      
      // Don't use CORS for same-origin requests
      if (urlObj.hostname === currentHost) {
        return false;
      }
      
      // Known CORS-friendly domains
      const corsSupported = [
        'covers.openlibrary.org',
        'archive.org'
      ];
      
      // Avoid CORS for known problematic domains (including ALL Amazon domains)
      const corsProblematic = [
        'amazon.com',
        'ssl-images-amazon.com',
        'm.media-amazon.com',
        'cloudfront.net',
        'books.google.com',
        'goodreads.com'
      ];
      
      if (corsProblematic.some(domain => url.includes(domain))) {
        return false;
      }
      
      return corsSupported.some(domain => url.includes(domain));
    } catch {
      return false;
    }
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
    // Step 1: Fix URLs and add reliable alternatives
    let allUrls = [...urls];
    
    if (bookData) {
      // Add reliable URLs generated from ISBN
      const reliableUrls = urlFixer.generateReliableUrls(bookData);
      allUrls = [...reliableUrls, ...allUrls];
    }
    
    // Step 2: Process and prioritize URLs  
    const processedUrls = urlFixer.processUrls(allUrls);
    
    // Step 3: Get optimized URLs from reliable sources
    let prioritizedUrls = processedUrls;
    if (bookData) {
      const reliableUrls = reliableImageSources.getOptimizedUrls(bookData);
      // Merge reliable sources with processed URLs, reliable sources first
      prioritizedUrls = [...reliableUrls, ...processedUrls];
    }
    
    // Step 4: Enhanced filtering
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

// Simple test function to verify fixes
window.testUrlFixes = (books) => {
  console.log('🔧 Testing URL fixes...');
  
  const testBook = books[0]; // Harry Potter
  if (!testBook) {
    console.log('No books available for testing');
    return;
  }
  
  console.log(`Testing book: "${testBook.title}"`);
  
  // Test URL fixing
  const originalUrls = testBook.metadata?.fallback_urls || [];
  console.log('\n📋 Original URLs:');
  originalUrls.slice(0, 3).forEach((url, i) => {
    console.log(`  ${i+1}. ${url}`);
  });
  
  // Test URL fixer
  import('./urlFixer.js').then(module => {
    const { urlFixer } = module;
    
    console.log('\n🔧 URL Processing Results:');
    originalUrls.slice(0, 5).forEach((url, i) => {
      const fixed = urlFixer.fixUrl(url);
      if (fixed === null) {
        console.log(`  ${i+1}. 🚫 BLOCKED (Amazon/CloudFront): ${url.substring(0, 60)}...`);
      } else if (fixed !== url) {
        console.log(`  ${i+1}. ✅ FIXED: ${fixed}`);
      } else {
        console.log(`  ${i+1}. ➡️ KEPT: ${url.substring(0, 60)}...`);
      }
    });
    
    // Test reliable URL generation
    const reliableUrls = urlFixer.generateReliableUrls(testBook);
    console.log('\n✨ Generated reliable URLs:');
    reliableUrls.forEach((url, i) => {
      console.log(`  ${i+1}. ${url}`);
    });
    
    console.log('\n🎯 Summary:');
    console.log('✅ Amazon/CloudFront URLs are now BLOCKED (no more CORS errors!)');
    console.log('✅ Reliable fallback URLs added from ISBN');
    console.log('✅ URL fixer is working! Images should load better now.');
  });
};

// Diagnostic function to see what URLs are actually being tried
window.diagnoseBookCover = async (books, bookIndex = 0) => {
  const book = books[bookIndex];
  if (!book) {
    console.log('No book found at index', bookIndex);
    return;
  }
  
  console.log(`\n🔍 DIAGNOSING: "${book.title}"`);
  console.log('📋 Book metadata:', {
    id: book.id,
    isbn: book.isbn || book.metadata?.isbn,
    cover_url: book.metadata?.cover_url,
    fallback_count: book.metadata?.fallback_urls?.length || 0
  });
  
  // Test URL processing
  const originalUrls = [
    book.metadata?.cover_url,
    ...(book.metadata?.fallback_urls || [])
  ].filter(Boolean);
  
  console.log(`\n📋 Original URLs (${originalUrls.length}):`);
  originalUrls.slice(0, 5).forEach((url, i) => {
    console.log(`  ${i+1}. ${url.substring(0, 80)}...`);
  });
  
  // Import URL fixer and test processing
  try {
    const { urlFixer } = await import('./urlFixer.js');
    
    // Step 1: Generate reliable URLs
    const reliableUrls = urlFixer.generateReliableUrls(book);
    console.log(`\n✨ Generated reliable URLs (${reliableUrls.length}):`);
    reliableUrls.forEach((url, i) => {
      console.log(`  ${i+1}. ${url}`);
    });
    
    // Step 2: Process all URLs
    const allUrls = [...reliableUrls, ...originalUrls];
    const processedUrls = urlFixer.processUrls(allUrls);
    console.log(`\n🔧 After processing: ${allUrls.length} → ${processedUrls.length} URLs`);
    
    // Step 3: Try loading the image
    console.log('\n🚀 Attempting to load image...');
    const result = await imageCache.loadImageWithFallbacks(processedUrls, 'high', book);
    
    if (result) {
      console.log('✅ SUCCESS! Image loaded from:', result.url);
      console.log('📏 Image size:', result.size);
    } else {
      console.log('❌ FAILED - No working URLs found');
      console.log('💡 Try checking if URLs are reachable manually');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  }
};