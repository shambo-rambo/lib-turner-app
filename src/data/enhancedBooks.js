/**
 * Enhanced Book Data using Google Books API
 * Falls back to manual data when API is unavailable
 */

import { googleBooksAPI } from '../services/googleBooksAPI';
import { ULTRA_RELIABLE_BOOKS } from './ultraReliableBooks';

// Base book data with ISBNs for Google Books API lookup
export const BASE_LIBRARY_BOOKS = [
  {
    id: 'book_1',
    isbn: '9780439708180',
    title: 'Harry Potter and the Sorcerer\'s Stone',
    author: 'J.K. Rowling',
    readingLevel: { atos: 5.5, lexile: '880L' }
  },
  {
    id: 'book_2',
    isbn: '9780375869020',
    title: 'Wonder',
    author: 'R.J. Palacio',
    readingLevel: { atos: 4.8, lexile: '790L' }
  },
  {
    id: 'book_3',
    isbn: '9780439023481',
    title: 'The Hunger Games',
    author: 'Suzanne Collins',
    readingLevel: { atos: 5.3, lexile: '810L' }
  },
  {
    id: 'book_4',
    isbn: '9780810970205',
    title: 'Diary of a Wimpy Kid',
    author: 'Jeff Kinney',
    readingLevel: { atos: 5.2, lexile: '950L' }
  },
  {
    id: 'book_5',
    isbn: '9780786856299',
    title: 'Percy Jackson: The Lightning Thief',
    author: 'Rick Riordan',
    readingLevel: { atos: 4.7, lexile: '740L' }
  },
  {
    id: 'book_6',
    isbn: '9780525478812',
    title: 'The Fault in Our Stars',
    author: 'John Green',
    readingLevel: { atos: 7.0, lexile: '850L' }
  },
  {
    id: 'book_7',
    isbn: '9780062024039',
    title: 'Divergent',
    author: 'Veronica Roth',
    readingLevel: { atos: 4.8, lexile: '700L' }
  },
  {
    id: 'book_8',
    isbn: '9781416918721',
    title: 'Dork Diaries',
    author: 'Rachel Renée Russell',
    readingLevel: { atos: 4.5, lexile: '600L' }
  },
  {
    id: 'book_9',
    isbn: '9780545349260',
    title: 'Wings of Fire: The Dragonet Prophecy',
    author: 'Tui T. Sutherland',
    readingLevel: { atos: 6.2, lexile: '870L' }
  },
  {
    id: 'book_10',
    isbn: '9780545581329',
    title: 'Dog Man',
    author: 'Dav Pilkey',
    readingLevel: { atos: 2.8, lexile: '450L' }
  },
  {
    id: 'book_11',
    isbn: '9780439135955',
    title: 'Hatchet',
    author: 'Gary Paulsen',
    readingLevel: { atos: 5.7, lexile: '1020L' }
  },
  {
    id: 'book_12',
    isbn: '9780439350211',
    title: 'The Outsiders',
    author: 'S.E. Hinton',
    readingLevel: { atos: 4.7, lexile: '750L' }
  }
];

class EnhancedBooksManager {
  constructor() {
    this.enhancedBooks = null;
    this.loading = false;
    this.lastFetch = null;
    this.fallbackBooks = ULTRA_RELIABLE_BOOKS;
  }

  /**
   * Get books with Google Books API enhancement
   */
  async getEnhancedBooks(forceRefresh = false) {
    // Return cached data if available and recent
    if (this.enhancedBooks && !forceRefresh && 
        this.lastFetch && (Date.now() - this.lastFetch < 5 * 60 * 1000)) {
      return this.enhancedBooks;
    }

    // Return fallback if already loading
    if (this.loading) {
      return this.fallbackBooks;
    }

    this.loading = true;

    try {
      console.log('🔍 Enhancing books with Google Books API...');
      
      // Check if API is available
      const apiStats = googleBooksAPI.getStats();
      if (!apiStats.hasApiKey) {
        console.warn('📚 No Google Books API key found, using fallback data');
        this.loading = false;
        return this.fallbackBooks;
      }

      // Convert base books to full format
      const baseBooks = BASE_LIBRARY_BOOKS.map((book, index) => ({
        ...book,
        series: { name: '', book: 0, total: 0 },
        readingLevel: { 
          ...book.readingLevel, 
          ai_assessed: book.readingLevel.atos, 
          confidence: 0.9 
        },
        metadata: {
          pages: 0,
          publisher: '',
          publication_date: '',
          genres: ['Fiction'],
          subjects: [],
          description: '',
          cover_url: '',
          fallback_urls: [],
          preview_url: '',
        },
        availability: { 
          physical_copies: Math.floor(Math.random() * 5) + 2, 
          digital_copies: 'unlimited', 
          checkout_status: 'available' 
        },
        engagement_data: {
          student_ratings: [4, 5, 4, 5, 5, 4, 5, 4, 5, 4],
          completion_rate: 0.85 + Math.random() * 0.15,
          reading_time_avg: `${(Math.random() * 5 + 2).toFixed(1)} hours`,
          total_checkouts: Math.floor(Math.random() * 200) + 50,
          total_reviews: Math.floor(Math.random() * 40) + 10,
        },
      }));

      // Enhance with Google Books API
      const enhancedBooks = await googleBooksAPI.getBooksFromLibrary(baseBooks);
      
      // Process the enhanced data
      this.enhancedBooks = enhancedBooks.map(book => {
        const googleData = book.metadata;
        
        return {
          ...book,
          title: googleData.title || book.title,
          author: googleData.authors?.[0] || book.author,
          series: this.extractSeries(googleData.title),
          metadata: {
            pages: googleData.pageCount || Math.floor(Math.random() * 300) + 150,
            publisher: googleData.publisher || 'Unknown Publisher',
            publication_date: googleData.publishedDate || '2000',
            genres: googleData.categories?.slice(0, 2) || ['Fiction'],
            subjects: googleData.categories?.slice(0, 3) || ['Adventure'],
            description: googleData.description || `A captivating story about ${book.title.toLowerCase()}.`,
            cover_url: googleData.primaryCoverUrl || '',
            fallback_urls: googleData.fallback_urls || [],
            preview_url: googleData.previewLink || googleData.infoLink || '',
            google_books_id: googleData.googleBooksId,
            rating: googleData.averageRating || 0,
            ratings_count: googleData.ratingsCount || 0,
          }
        };
      });

      this.lastFetch = Date.now();
      console.log(`✅ Enhanced ${this.enhancedBooks.length} books with Google Books API`);
      
      // Log some stats
      const withCovers = this.enhancedBooks.filter(book => book.metadata.cover_url).length;
      console.log(`📸 ${withCovers}/${this.enhancedBooks.length} books have Google Books covers`);

      this.loading = false;
      return this.enhancedBooks;

    } catch (error) {
      console.error('❌ Failed to enhance books with Google Books API:', error);
      this.loading = false;
      return this.fallbackBooks;
    }
  }

  /**
   * Extract series information from title
   */
  extractSeries(title) {
    // Common series patterns
    const seriesPatterns = [
      { pattern: /Harry Potter/i, name: 'Harry Potter', total: 7 },
      { pattern: /Hunger Games/i, name: 'The Hunger Games', total: 3 },
      { pattern: /Percy Jackson/i, name: 'Percy Jackson', total: 5 },
      { pattern: /Divergent/i, name: 'Divergent', total: 3 },
      { pattern: /Diary of a Wimpy Kid/i, name: 'Diary of a Wimpy Kid', total: 17 },
      { pattern: /Dork Diaries/i, name: 'Dork Diaries', total: 15 },
      { pattern: /Wings of Fire/i, name: 'Wings of Fire', total: 15 },
      { pattern: /Dog Man/i, name: 'Dog Man', total: 12 },
    ];

    for (const series of seriesPatterns) {
      if (series.pattern.test(title)) {
        return {
          name: series.name,
          book: 1,
          total: series.total
        };
      }
    }

    return { name: '', book: 0, total: 0 };
  }

  /**
   * Get a single book by ID
   */
  async getBookById(id) {
    const books = await this.getEnhancedBooks();
    return books.find(book => book.id === id);
  }

  /**
   * Search books
   */
  async searchBooks(query) {
    const books = await this.getEnhancedBooks();
    const lowerQuery = query.toLowerCase();
    
    return books.filter(book => 
      book.title.toLowerCase().includes(lowerQuery) ||
      book.author.toLowerCase().includes(lowerQuery) ||
      book.metadata.genres.some(genre => genre.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get stats about the enhanced library
   */
  async getLibraryStats() {
    const books = await this.getEnhancedBooks();
    const withGoogleData = books.filter(book => book.metadata.google_books_id).length;
    const withCovers = books.filter(book => book.metadata.cover_url).length;
    const apiStats = googleBooksAPI.getStats();
    
    return {
      totalBooks: books.length,
      enhancedWithGoogle: withGoogleData,
      withCovers: withCovers,
      apiCacheSize: apiStats.cachedItems,
      hasApiKey: apiStats.hasApiKey,
      lastFetch: this.lastFetch
    };
  }
}

// Create singleton instance
export const enhancedBooksManager = new EnhancedBooksManager();

// Default export for easy import
export default enhancedBooksManager;