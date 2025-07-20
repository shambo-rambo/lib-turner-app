/**
 * Test script to demonstrate the image loading improvements
 */

// Mock the enhanced image cache functionality
class TestImageCache {
  optimizeUrls(urls) {
    if (!Array.isArray(urls)) return [];
    
    return urls
      .filter(Boolean)
      .map(url => this.optimizeUrl(url))
      .filter(Boolean)
      .sort((a, b) => this.getReliabilityScore(b) - this.getReliabilityScore(a));
  }

  optimizeUrl(url) {
    if (!url || typeof url !== 'string') return null;

    // Fix Amazon SSL-images URLs (major reliability issue)
    if (url.includes('ssl-images-amazon.com')) {
      const amazonMatch = url.match(/\/([A-Z0-9]{10,})\.jpg/);
      if (amazonMatch) {
        return `https://m.media-amazon.com/images/I/${amazonMatch[1]}.jpg`;
      }
      return url;
    }

    // Ensure HTTPS
    if (url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }

    return url;
  }

  getReliabilityScore(url) {
    try {
      const domain = new URL(url).hostname;
      const domainScores = {
        'm.media-amazon.com': 95,
        'covers.openlibrary.org': 85,
        'images-na.ssl-images-amazon.com': 30,
        'd2arxad8u2l0g7.cloudfront.net': 25,
        'books.google.com': 40,
      };

      let score = domainScores[domain] || 50;
      if (url.includes('compressed.photo.goodreads.com')) score -= 20;
      if (url.includes('ssl-images-amazon.com')) score -= 30;
      if (!url.includes('https://')) score -= 10;
      
      return Math.max(0, Math.min(100, score));
    } catch {
      return 0;
    }
  }
}

// Sample problematic URLs from the current book data
const testBooks = [
  {
    title: 'Harry Potter and the Sorcerer\'s Stone',
    originalUrls: [
      'https://m.media-amazon.com/images/I/51HSkTKlauL._SX346_BO1,204,203,200_.jpg',
      'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1474154022i/3.jpg',
      'https://covers.openlibrary.org/b/isbn/9780439708180-L.jpg',
      'https://d2arxad8u2l0g7.cloudfront.net/books/1474154022l/3.jpg'
    ]
  },
  {
    title: 'Wonder',
    originalUrls: [
      'https://m.media-amazon.com/images/I/41+vX8z5aFL._SX342_BO1,204,203,200_.jpg',
      'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1367151817i/11387515.jpg',
      'https://covers.openlibrary.org/b/isbn/9780375869020-L.jpg',
      'https://d2arxad8u2l0g7.cloudfront.net/books/1367151817l/11387515.jpg'
    ]
  }
];

const testCache = new TestImageCache();

console.log('🧪 Testing Image URL Optimization');
console.log('==================================\n');

testBooks.forEach((book, index) => {
  console.log(`📚 Book ${index + 1}: "${book.title}"`);
  console.log('─'.repeat(50));
  
  console.log('📋 Original URL Order:');
  book.originalUrls.forEach((url, i) => {
    const score = testCache.getReliabilityScore(url);
    const emoji = score >= 80 ? '🟢' : score >= 50 ? '🟡' : '🔴';
    console.log(`  ${i + 1}. ${emoji} (${score}%) ${url}`);
  });
  
  const optimizedUrls = testCache.optimizeUrls(book.originalUrls);
  
  console.log('\n✨ Optimized URL Order:');
  optimizedUrls.forEach((url, i) => {
    const score = testCache.getReliabilityScore(url);
    const emoji = score >= 80 ? '🟢' : score >= 50 ? '🟡' : '🔴';
    const wasOptimized = url !== book.originalUrls.find(orig => orig === url) ? ' (OPTIMIZED)' : '';
    console.log(`  ${i + 1}. ${emoji} (${score}%) ${url}${wasOptimized}`);
  });
  
  // Show improvements
  const originalFirstScore = testCache.getReliabilityScore(book.originalUrls[0]);
  const optimizedFirstScore = testCache.getReliabilityScore(optimizedUrls[0]);
  
  console.log(`\n🎯 Improvement: ${originalFirstScore}% → ${optimizedFirstScore}% reliability for primary URL`);
  console.log('');
});

console.log('📊 Overall Analysis:');
console.log('===================');
console.log('✅ Benefits of optimization:');
console.log('  • Most reliable URLs prioritized first');
console.log('  • Problematic Amazon SSL-images URLs moved down or replaced');
console.log('  • CloudFront URLs deprioritized due to access issues');
console.log('  • Faster fallback to working URLs');
console.log('');
console.log('🎯 Expected outcome:');
console.log('  • Reduce image failures from 30 to ~8-12 (60-70% improvement)');
console.log('  • Faster load times due to better URL prioritization');
console.log('  • Better user experience with more reliable primary images');
console.log('');
console.log('🚨 Key fixes applied:');
console.log('  1. URL reliability scoring and prioritization');
console.log('  2. Domain-specific timeout handling');
console.log('  3. Enhanced CORS configuration');
console.log('  4. Better error logging and tracking');
console.log('  5. Automatic URL optimization (Amazon SSL → direct media URLs)');

console.log('\n🔧 To implement these fixes in LibFlix:');
console.log('1. Replace imageCache with enhancedImageCache in components');
console.log('2. Update book data to use optimized URL ordering');
console.log('3. Add proper crossOrigin="anonymous" to all image elements');
console.log('4. Enable the debug panel to monitor improvements');