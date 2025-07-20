/**
 * Image Loading Debugger - Diagnose image loading issues
 */

export class ImageDebugger {
  constructor() {
    this.debugLog = [];
    this.urlTests = new Map();
    this.failingBooks = [];
  }

  /**
   * Record a failing book for analysis
   */
  recordFailingBook(book, attemptedUrls = []) {
    const failureRecord = {
      title: book.title,
      author: book.author,
      isbn: book.isbn || book.metadata?.isbn,
      googleId: book.metadata?.google_books_id || book.metadata?.googleBooksId,
      attemptedUrls: attemptedUrls,
      timestamp: Date.now(),
      bookData: book
    };
    
    // Avoid duplicates
    const exists = this.failingBooks.some(existing => 
      existing.title === book.title && existing.author === book.author
    );
    
    if (!exists) {
      this.failingBooks.push(failureRecord);
      console.log(`🔍 DEBUG: Recorded failing book #${this.failingBooks.length} - "${book.title}" by ${book.author}`);
    }
  }

  /**
   * Test a single URL and log the result
   */
  async testUrl(url, bookTitle = 'Unknown') {
    const startTime = Date.now();
    
    try {
      // Test with fetch first
      const response = await fetch(url, { 
        method: 'HEAD', 
        mode: 'no-cors',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      
      const fetchTime = Date.now() - startTime;
      
      // Test with Image element
      const imgStartTime = Date.now();
      const imgResult = await this.testImageElement(url);
      const imgTime = Date.now() - imgStartTime;
      
      const result = {
        url,
        bookTitle,
        fetchStatus: response.status || 'no-cors',
        fetchTime,
        imageLoads: imgResult.success,
        imageTime: imgTime,
        error: imgResult.error,
        timestamp: new Date().toISOString()
      };
      
      this.debugLog.push(result);
      this.urlTests.set(url, result);
      
      return result;
      
    } catch (error) {
      const result = {
        url,
        bookTitle,
        fetchStatus: 'error',
        fetchTime: Date.now() - startTime,
        imageLoads: false,
        imageTime: 0,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      this.debugLog.push(result);
      this.urlTests.set(url, result);
      
      return result;
    }
  }

  /**
   * Test image loading with Image element
   */
  async testImageElement(url) {
    return new Promise((resolve) => {
      const img = new Image();
      // FIXED: Remove crossOrigin - it causes CORS failures
      // img.crossOrigin = 'anonymous'; // REMOVED
      img.decoding = 'async'; // Keep this for performance
      
      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'timeout' });
      }, 8000); // Increased to 8 seconds to match imageCache
      
      img.onload = () => {
        clearTimeout(timeout);
        resolve({ 
          success: true, 
          error: null,
          dimensions: { width: img.naturalWidth, height: img.naturalHeight }
        });
      };
      
      img.onerror = (error) => {
        clearTimeout(timeout);
        resolve({ success: false, error: 'load_failed' });
      };
      
      img.src = url;
    });
  }

  /**
   * Test all URLs for a book
   */
  async testBookUrls(book) {
    const urls = [
      book.metadata?.cover_url,
      ...(book.metadata?.fallback_urls || [])
    ].filter(Boolean);

    console.log(`🔍 Testing ${urls.length} URLs for "${book.title}"...`);
    
    const results = [];
    for (const url of urls) {
      const result = await this.testUrl(url, book.title);
      results.push(result);
      
      // Log result immediately
      const status = result.imageLoads ? '✅' : '❌';
      console.log(`${status} ${url.slice(0, 60)}... (${result.fetchTime}ms)`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
    
    return results;
  }

  /**
   * Get summary of all tests
   */
  getSummary() {
    const total = this.debugLog.length;
    const successful = this.debugLog.filter(r => r.imageLoads).length;
    const failed = total - successful;
    
    // Group by error type
    const errorTypes = {};
    this.debugLog.filter(r => !r.imageLoads).forEach(r => {
      errorTypes[r.error] = (errorTypes[r.error] || 0) + 1;
    });
    
    // Group by domain
    const domainStats = {};
    this.debugLog.forEach(r => {
      try {
        const domain = new URL(r.url).hostname;
        if (!domainStats[domain]) {
          domainStats[domain] = { total: 0, successful: 0 };
        }
        domainStats[domain].total++;
        if (r.imageLoads) {
          domainStats[domain].successful++;
        }
      } catch {
        // Invalid URL
      }
    });
    
    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total * 100).toFixed(1) : 0,
      errorTypes,
      domainStats,
      averageLoadTime: this.debugLog.reduce((sum, r) => sum + r.imageTime, 0) / total
    };
  }

  /**
   * Print detailed report
   */
  printReport() {
    const summary = this.getSummary();
    
    console.log('\n📊 IMAGE LOADING DIAGNOSTIC REPORT');
    console.log('=====================================');
    console.log(`Total URLs tested: ${summary.total}`);
    console.log(`Successful: ${summary.successful} (${summary.successRate}%)`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Average load time: ${summary.averageLoadTime.toFixed(0)}ms`);
    
    console.log('\n🌐 DOMAIN RELIABILITY:');
    Object.entries(summary.domainStats).forEach(([domain, stats]) => {
      const rate = (stats.successful / stats.total * 100).toFixed(0);
      console.log(`  ${domain}: ${stats.successful}/${stats.total} (${rate}%)`);
    });
    
    console.log('\n❌ ERROR BREAKDOWN:');
    Object.entries(summary.errorTypes).forEach(([error, count]) => {
      console.log(`  ${error}: ${count} occurrences`);
    });
    
    console.log('\n🔧 RECOMMENDATIONS:');
    
    // Find best and worst domains
    const sortedDomains = Object.entries(summary.domainStats)
      .map(([domain, stats]) => ({
        domain,
        rate: stats.successful / stats.total,
        count: stats.total
      }))
      .sort((a, b) => b.rate - a.rate);
    
    if (sortedDomains.length > 0) {
      console.log(`  ✅ Most reliable: ${sortedDomains[0].domain} (${(sortedDomains[0].rate * 100).toFixed(0)}%)`);
      if (sortedDomains.length > 1) {
        const worst = sortedDomains[sortedDomains.length - 1];
        console.log(`  ❌ Least reliable: ${worst.domain} (${(worst.rate * 100).toFixed(0)}%)`);
      }
    }
    
    return summary;
  }

  /**
   * Export results as CSV
   */
  exportCSV() {
    const headers = ['URL', 'Book Title', 'Fetch Status', 'Fetch Time', 'Image Loads', 'Image Time', 'Error', 'Timestamp'];
    const rows = this.debugLog.map(r => [
      r.url,
      r.bookTitle,
      r.fetchStatus,
      r.fetchTime,
      r.imageLoads,
      r.imageTime,
      r.error || '',
      r.timestamp
    ]);
    
    const csv = [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    return csv;
  }
}

// Global instance
export const imageDebugger = new ImageDebugger();

// Console helper functions
window.debugImages = async (books) => {
  console.log('🚀 Starting image debug for', books.length, 'books...');
  
  for (let i = 0; i < Math.min(books.length, 5); i++) {
    await imageDebugger.testBookUrls(books[i]);
  }
  
  return imageDebugger.printReport();
};

window.showFailingBooks = () => {
  console.log('\n🔍 === FAILING BOOKS ANALYSIS ===');
  console.log(`Total failing books captured: ${imageDebugger.failingBooks.length}`);
  
  if (imageDebugger.failingBooks.length === 0) {
    console.log('✅ No failing books recorded yet. This is good!');
    return;
  }
  
  imageDebugger.failingBooks.forEach((book, index) => {
    console.log(`\n${index + 1}. "${book.title}" by ${book.author}`);
    console.log(`   ISBN: ${book.isbn || 'MISSING'}`);
    console.log(`   Google ID: ${book.googleId || 'MISSING'}`);
    console.log(`   URLs attempted: ${book.attemptedUrls.length}`);
    
    if (book.attemptedUrls.length > 0) {
      console.log('   Top 3 URLs tried:');
      book.attemptedUrls.slice(0, 3).forEach((url, i) => {
        console.log(`   ${i + 1}: ${url.substring(0, 70)}...`);
      });
    }
  });
  
  // Pattern analysis
  const patterns = {
    missingISBN: imageDebugger.failingBooks.filter(b => !b.isbn).length,
    missingGoogleId: imageDebugger.failingBooks.filter(b => !b.googleId).length,
    hasISBN: imageDebugger.failingBooks.filter(b => b.isbn).length,
    hasGoogleId: imageDebugger.failingBooks.filter(b => b.googleId).length
  };
  
  console.log('\n📊 Failure Patterns:');
  console.log(`- Missing ISBN: ${patterns.missingISBN}`);
  console.log(`- Missing Google ID: ${patterns.missingGoogleId}`);
  console.log(`- Has ISBN but still failing: ${patterns.hasISBN}`);
  console.log(`- Has Google ID but still failing: ${patterns.hasGoogleId}`);
  
  return imageDebugger.failingBooks;
};

window.testFailingBook = async (bookTitle) => {
  const book = imageDebugger.failingBooks.find(b => 
    b.title.toLowerCase().includes(bookTitle.toLowerCase())
  );
  
  if (!book) {
    console.log(`❌ Book "${bookTitle}" not found in failing books.`);
    console.log('Available failing books:');
    imageDebugger.failingBooks.forEach((b, i) => {
      console.log(`${i + 1}. "${b.title}"`);
    });
    return null;
  }
  
  console.log(`\n🔧 TESTING: "${book.title}" by ${book.author}`);
  return await imageDebugger.testBookUrls(book.bookData);
};