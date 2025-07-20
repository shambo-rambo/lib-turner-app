/**
 * URL Analyzer for LibFlix Image URLs
 * Analyzes book image URLs for potential issues without making HTTP requests
 */

import { ULTRA_RELIABLE_BOOKS } from '../data/ultraReliableBooks';
import { RELIABLE_BOOKS } from '../data/reliableBooks';

export const analyzeBookUrls = (books = ULTRA_RELIABLE_BOOKS) => {
  const analysis = {
    totalBooks: books.length,
    totalUrls: 0,
    urlsByDomain: new Map(),
    urlsByProtocol: new Map(),
    potentialIssues: [],
    domainStats: new Map(),
    urlPatterns: new Map(),
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

        // Analyze domain characteristics
        if (!analysis.domainStats.has(domain)) {
          analysis.domainStats.set(domain, {
            count: 0,
            hasHttps: false,
            hasHttp: false,
            avgUrlLength: 0,
            totalLength: 0,
            patterns: new Set()
          });
        }

        const domainStats = analysis.domainStats.get(domain);
        domainStats.count++;
        domainStats.totalLength += url.length;
        domainStats.avgUrlLength = domainStats.totalLength / domainStats.count;

        if (protocol === 'https:') domainStats.hasHttps = true;
        if (protocol === 'http:') domainStats.hasHttp = true;

        // Identify URL patterns
        const pathPattern = parsed.pathname.replace(/\/[^\/]+\.(jpg|jpeg|png|gif|webp)/i, '/IMAGE.$1');
        domainStats.patterns.add(pathPattern);

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

        // 5. Suspicious domains
        const suspiciousDomains = [
          'localhost', '127.0.0.1', 'example.com', 'test.com'
        ];
        if (suspiciousDomains.some(suspicious => domain.includes(suspicious))) {
          issues.push('Suspicious or test domain');
        }

        // 6. Potential CORS issues
        const corsProblematicDomains = [
          'ssl-images-amazon.com',
          'books.google.com'
        ];
        if (corsProblematicDomains.some(cors => domain.includes(cors))) {
          issues.push('Potential CORS issues');
        }

        // 7. Rate limiting concerns
        const rateLimitedDomains = [
          'googleapis.com',
          'amazon.com'
        ];
        if (rateLimitedDomains.some(rl => domain.includes(rl))) {
          issues.push('May have rate limiting');
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

  // Generate recommendations
  analysis.recommendations = generateRecommendations(analysis);

  return analysis;
};

const generateRecommendations = (analysis) => {
  const recommendations = [];

  // Check for HTTP usage
  if (analysis.urlsByProtocol.get('http:') > 0) {
    recommendations.push({
      priority: 'high',
      issue: 'HTTP URLs detected',
      suggestion: 'Convert all HTTP URLs to HTTPS for better security and compatibility',
      affected: analysis.urlsByProtocol.get('http:')
    });
  }

  // Check for domain concentration
  const domainEntries = Array.from(analysis.urlsByDomain.entries()).sort((a, b) => b[1] - a[1]);
  const topDomain = domainEntries[0];
  if (topDomain && topDomain[1] > analysis.totalUrls * 0.7) {
    recommendations.push({
      priority: 'medium',
      issue: 'Heavy reliance on single domain',
      suggestion: `Over 70% of images from ${topDomain[0]}. Consider diversifying sources for better reliability`,
      affected: topDomain[1]
    });
  }

  // Check for potential CORS issues
  const corsIssues = analysis.potentialIssues.filter(issue => 
    issue.issues.some(i => i.includes('CORS'))
  );
  if (corsIssues.length > 0) {
    recommendations.push({
      priority: 'high',
      issue: 'Potential CORS problems',
      suggestion: 'Set crossOrigin="anonymous" and consider using image proxy for problematic domains',
      affected: corsIssues.length
    });
  }

  // Check for malformed URLs
  const malformedUrls = analysis.potentialIssues.filter(issue => 
    issue.issues.some(i => i.includes('Malformed'))
  );
  if (malformedUrls.length > 0) {
    recommendations.push({
      priority: 'critical',
      issue: 'Malformed URLs',
      suggestion: 'Fix malformed URLs immediately as they will always fail to load',
      affected: malformedUrls.length
    });
  }

  // Check for missing extensions
  const missingExtensions = analysis.potentialIssues.filter(issue => 
    issue.issues.some(i => i.includes('extension'))
  );
  if (missingExtensions.length > 0) {
    recommendations.push({
      priority: 'medium',
      issue: 'URLs missing clear image extensions',
      suggestion: 'Ensure all image URLs have clear file extensions (.jpg, .png, etc.)',
      affected: missingExtensions.length
    });
  }

  return recommendations;
};

export const compareDatasets = () => {
  const ultraAnalysis = analyzeBookUrls(ULTRA_RELIABLE_BOOKS);
  const reliableAnalysis = analyzeBookUrls(RELIABLE_BOOKS);

  return {
    ultra: ultraAnalysis,
    reliable: reliableAnalysis,
    comparison: {
      totalUrlsUltra: ultraAnalysis.totalUrls,
      totalUrlsReliable: reliableAnalysis.totalUrls,
      issuesUltra: ultraAnalysis.potentialIssues.length,
      issuesReliable: reliableAnalysis.potentialIssues.length,
      uniqueDomainsUltra: ultraAnalysis.urlsByDomain.size,
      uniqueDomainsReliable: reliableAnalysis.urlsByDomain.size
    }
  };
};

export const printAnalysisReport = (analysis) => {
  console.group('📊 LibFlix URL Analysis Report');
  
  console.log(`📈 Overview:
  • Total books: ${analysis.totalBooks}
  • Total URLs: ${analysis.totalUrls}
  • Unique domains: ${analysis.urlsByDomain.size}
  • Potential issues found: ${analysis.potentialIssues.length}`);

  // Top domains
  const topDomains = Array.from(analysis.urlsByDomain.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  console.group('🌐 Top 5 domains:');
  topDomains.forEach(([domain, count]) => {
    const percentage = ((count / analysis.totalUrls) * 100).toFixed(1);
    console.log(`  • ${domain}: ${count} URLs (${percentage}%)`);
  });
  console.groupEnd();

  // Protocol breakdown
  console.group('🔒 Protocol usage:');
  Array.from(analysis.urlsByProtocol.entries()).forEach(([protocol, count]) => {
    const percentage = ((count / analysis.totalUrls) * 100).toFixed(1);
    console.log(`  • ${protocol} ${count} URLs (${percentage}%)`);
  });
  console.groupEnd();

  // Issues by type
  if (analysis.potentialIssues.length > 0) {
    const issueTypes = new Map();
    analysis.potentialIssues.forEach(issue => {
      issue.issues.forEach(issueText => {
        issueTypes.set(issueText, (issueTypes.get(issueText) || 0) + 1);
      });
    });

    console.group('⚠️ Issues by type:');
    Array.from(issueTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([issue, count]) => {
        console.log(`  • ${issue}: ${count} occurrences`);
      });
    console.groupEnd();

    // Books with most issues
    const bookIssues = new Map();
    analysis.potentialIssues.forEach(issue => {
      bookIssues.set(issue.book, (bookIssues.get(issue.book) || 0) + 1);
    });

    console.group('📚 Books with most URL issues:');
    Array.from(bookIssues.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([book, count]) => {
        console.log(`  • "${book}": ${count} issues`);
      });
    console.groupEnd();
  }

  // Recommendations
  if (analysis.recommendations.length > 0) {
    console.group('💡 Recommendations:');
    analysis.recommendations.forEach(rec => {
      const priorityEmoji = rec.priority === 'critical' ? '🚨' : 
                           rec.priority === 'high' ? '⚠️' : 
                           rec.priority === 'medium' ? '⚡' : 'ℹ️';
      console.log(`  ${priorityEmoji} ${rec.issue}: ${rec.suggestion} (${rec.affected} affected)`);
    });
    console.groupEnd();
  }

  console.groupEnd();
  return analysis;
};

// Default export for convenience
export default {
  analyzeBookUrls,
  compareDatasets,
  printAnalysisReport
};