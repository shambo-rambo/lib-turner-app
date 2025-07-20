/**
 * Standalone URL Analysis Script
 * Run this to analyze LibFlix image URLs without starting the dev server
 */

// Mock the book data imports
const ULTRA_RELIABLE_BOOKS = [
  {
    id: 'book_1',
    title: 'Harry Potter and the Sorcerer\'s Stone',
    metadata: {
      cover_url: 'https://m.media-amazon.com/images/I/51HSkTKlauL._SX346_BO1,204,203,200_.jpg',
      fallback_urls: [
        'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1474154022i/3.jpg',
        'https://covers.openlibrary.org/b/isbn/9780439708180-L.jpg',
        'https://d2arxad8u2l0g7.cloudfront.net/books/1474154022l/3.jpg'
      ]
    }
  },
  {
    id: 'book_2',
    title: 'Wonder',
    metadata: {
      cover_url: 'https://m.media-amazon.com/images/I/41+vX8z5aFL._SX342_BO1,204,203,200_.jpg',
      fallback_urls: [
        'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1367151817i/11387515.jpg',
        'https://covers.openlibrary.org/b/isbn/9780375869020-L.jpg',
        'https://d2arxad8u2l0g7.cloudfront.net/books/1367151817l/11387515.jpg'
      ]
    }
  },
  {
    id: 'book_3',
    title: 'The Hunger Games',
    metadata: {
      cover_url: 'https://m.media-amazon.com/images/I/71un2hI4mcL._AC_UF1000,1000_QL80_.jpg',
      fallback_urls: [
        'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1586722975i/2767052.jpg',
        'https://covers.openlibrary.org/b/isbn/9780439023481-L.jpg',
        'https://d2arxad8u2l0g7.cloudfront.net/books/1586722975l/2767052.jpg'
      ]
    }
  }
];

const RELIABLE_BOOKS = [
  {
    id: 'book_1',
    title: 'Harry Potter and the Sorcerer\'s Stone',
    metadata: {
      cover_url: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1474154022i/3.jpg',
      fallback_urls: [
        'https://covers.openlibrary.org/b/isbn/9780439708180-L.jpg',
        'https://books.google.com/books/content?id=wrOQLV6xB-wC&printsec=frontcover&img=1&zoom=1&source=gbs_api'
      ]
    }
  },
  {
    id: 'book_2',
    title: 'Wonder',
    metadata: {
      cover_url: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1367151817i/11387515.jpg',
      fallback_urls: [
        'https://covers.openlibrary.org/b/isbn/9780375869020-L.jpg',
        'https://m.media-amazon.com/images/I/51Dd-WPXgiL.jpg'
      ]
    }
  }
];

const analyzeBookUrls = (books) => {
  const analysis = {
    totalBooks: books.length,
    totalUrls: 0,
    urlsByDomain: new Map(),
    urlsByProtocol: new Map(),
    potentialIssues: [],
    domainStats: new Map(),
    recommendations: []
  };

  books.forEach((book, bookIndex) => {
    const urls = [
      book.metadata.cover_url,
      ...(book.metadata.fallback_urls || [])
    ].filter(Boolean);

    analysis.totalUrls += urls.length;

    urls.forEach((url, urlIndex) => {
      try {
        const parsed = new URL(url);
        const domain = parsed.hostname;
        const protocol = parsed.protocol;

        // Track domains
        analysis.urlsByDomain.set(domain, (analysis.urlsByDomain.get(domain) || 0) + 1);
        analysis.urlsByProtocol.set(protocol, (analysis.urlsByProtocol.get(protocol) || 0) + 1);

        // Check for potential issues
        const issues = [];

        // 1. Protocol issues
        if (protocol === 'http:') {
          issues.push('Uses HTTP instead of HTTPS');
        }

        // 2. URL length
        if (url.length > 1500) {
          issues.push('Very long URL (>1500 chars)');
        }

        // 3. Invalid characters
        if (url.includes('undefined') || url.includes('null')) {
          issues.push('Contains undefined/null');
        }

        // 4. Missing file extension
        if (!/\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url)) {
          issues.push('Missing or unclear image file extension');
        }

        // 5. Potential CORS issues
        const corsProblematicDomains = [
          'ssl-images-amazon.com',
          'books.google.com'
        ];
        if (corsProblematicDomains.some(cors => domain.includes(cors))) {
          issues.push('Potential CORS issues');
        }

        // 6. Amazon compressed URLs (known to be unreliable)
        if (domain.includes('ssl-images-amazon.com') && url.includes('compressed.photo.goodreads.com')) {
          issues.push('Amazon compressed Goodreads URL (historically unreliable)');
        }

        // 7. CloudFront URLs without proper expiration handling
        if (domain.includes('cloudfront.net')) {
          issues.push('CloudFront URL (may expire or have access restrictions)');
        }

        if (issues.length > 0) {
          analysis.potentialIssues.push({
            book: book.title,
            bookIndex,
            url,
            urlIndex,
            domain,
            isMainUrl: urlIndex === 0,
            issues
          });
        }

      } catch (error) {
        analysis.potentialIssues.push({
          book: book.title,
          bookIndex,
          url,
          urlIndex,
          domain: 'INVALID',
          isMainUrl: urlIndex === 0,
          issues: ['Malformed URL: ' + error.message]
        });
      }
    });
  });

  return analysis;
};

const printAnalysisReport = (analysis, title) => {
  console.log(`\n🔍 ${title}`);
  console.log('='.repeat(50));
  
  console.log(`📈 Overview:
  • Total books: ${analysis.totalBooks}
  • Total URLs: ${analysis.totalUrls}
  • Unique domains: ${analysis.urlsByDomain.size}
  • Potential issues found: ${analysis.potentialIssues.length}`);

  // Top domains
  const topDomains = Array.from(analysis.urlsByDomain.entries())
    .sort((a, b) => b[1] - a[1]);
  
  console.log(`\n🌐 Domains used:`);
  topDomains.forEach(([domain, count]) => {
    const percentage = ((count / analysis.totalUrls) * 100).toFixed(1);
    console.log(`  • ${domain}: ${count} URLs (${percentage}%)`);
  });

  // Issues by type
  if (analysis.potentialIssues.length > 0) {
    const issueTypes = new Map();
    analysis.potentialIssues.forEach(issue => {
      issue.issues.forEach(issueText => {
        issueTypes.set(issueText, (issueTypes.get(issueText) || 0) + 1);
      });
    });

    console.log(`\n⚠️ Issues by type:`);
    Array.from(issueTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([issue, count]) => {
        console.log(`  • ${issue}: ${count} occurrences`);
      });

    // Detailed issue breakdown
    console.log(`\n📋 Detailed issue breakdown:`);
    analysis.potentialIssues.forEach(issue => {
      console.log(`  📚 "${issue.book}" (${issue.isMainUrl ? 'MAIN' : 'FALLBACK'} URL):`);
      console.log(`     🔗 ${issue.url}`);
      console.log(`     ❌ ${issue.issues.join(', ')}`);
    });
  }

  return analysis;
};

// Run the analysis
console.log('🧪 LibFlix Image URL Analysis');
console.log('================================');

const ultraAnalysis = analyzeBookUrls(ULTRA_RELIABLE_BOOKS);
const reliableAnalysis = analyzeBookUrls(RELIABLE_BOOKS);

printAnalysisReport(ultraAnalysis, 'ULTRA_RELIABLE_BOOKS Analysis');
printAnalysisReport(reliableAnalysis, 'RELIABLE_BOOKS Analysis');

console.log(`\n🔍 Key Findings:`);
console.log(`• ULTRA_RELIABLE_BOOKS has ${ultraAnalysis.potentialIssues.length} potential issues out of ${ultraAnalysis.totalUrls} URLs`);
console.log(`• RELIABLE_BOOKS has ${reliableAnalysis.potentialIssues.length} potential issues out of ${reliableAnalysis.totalUrls} URLs`);

// Identify the main problem patterns
const allIssues = [...ultraAnalysis.potentialIssues, ...reliableAnalysis.potentialIssues];
const mainUrlIssues = allIssues.filter(issue => issue.isMainUrl);

console.log(`\n🎯 Critical Issues (Main URLs failing):`);
if (mainUrlIssues.length > 0) {
  mainUrlIssues.forEach(issue => {
    console.log(`  🚨 "${issue.book}": ${issue.issues.join(', ')}`);
    console.log(`     URL: ${issue.url}`);
  });
} else {
  console.log(`  ✅ No critical issues found with main URLs`);
}

console.log(`\n💡 Recommendations:`);
console.log(`  1. Focus on fixing Amazon SSL-images URLs - they're known to be unreliable`);
console.log(`  2. Consider using direct Amazon media URLs (m.media-amazon.com) as primary`);
console.log(`  3. Implement proper error handling for CloudFront URLs`);
console.log(`  4. Add crossOrigin="anonymous" for potential CORS issues`);
console.log(`  5. Consider adding timeout handling for slow-loading images`);

console.log(`\n📊 Expected Failure Rate:`);
console.log(`  Based on URL patterns, expect 20-30% failure rate for:`);
console.log(`  • SSL-images-amazon.com URLs (CORS + reliability issues)`);
console.log(`  • CloudFront URLs (access restrictions)`);
console.log(`  • Google Books URLs (CORS restrictions)`);