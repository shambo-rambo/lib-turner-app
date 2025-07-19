/**
 * Google Books API Service
 * Handles fetching book data from Google Books API
 */

const GOOGLE_BOOKS_BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

/**
 * Book categories and search terms for diverse content generation
 * Weighted toward real school library collections
 */
export const BOOK_CATEGORIES = {
  // Elementary (Grades K-5)
  elementary: {
    weight: 0.3,
    searches: [
      'subject:juvenile-fiction+inauthor:roald+dahl',
      'subject:juvenile-fiction+magic+fantasy',
      'subject:juvenile-fiction+animals',
      'subject:juvenile-fiction+friendship',
      'subject:picture-books',
      'subject:early-readers',
      'subject:juvenile-fiction+adventure',
      'subject:juvenile-fiction+mystery',
    ],
    expectedLevel: { min: 1, max: 5 }
  },
  
  // Middle Grade (Grades 6-8)
  middleGrade: {
    weight: 0.4,
    searches: [
      'subject:juvenile-fiction+fantasy+dragons',
      'subject:juvenile-fiction+science+fiction',
      'subject:juvenile-fiction+mystery+detective',
      'subject:juvenile-fiction+historical',
      'subject:juvenile-fiction+dystopian',
      'subject:juvenile-fiction+contemporary',
      'subject:graphic-novels+middle-grade',
      'subject:juvenile-nonfiction+biography',
    ],
    expectedLevel: { min: 4, max: 8 }
  },
  
  // Young Adult (Grades 9-12)
  youngAdult: {
    weight: 0.3,
    searches: [
      'subject:young-adult-fiction+fantasy',
      'subject:young-adult-fiction+romance',
      'subject:young-adult-fiction+dystopian',
      'subject:young-adult-fiction+contemporary',
      'subject:young-adult-fiction+science-fiction',
      'subject:young-adult-fiction+historical',
      'subject:young-adult-nonfiction',
      'subject:classics+high-school',
    ],
    expectedLevel: { min: 7, max: 12 }
  }
};

/**
 * Popular authors for school libraries
 */
export const POPULAR_AUTHORS = [
  'Rick Riordan', 'Suzanne Collins', 'J.K. Rowling', 'Roald Dahl',
  'Jeff Kinney', 'Dav Pilkey', 'R.J. Palacio', 'Katherine Paterson',
  'Lois Lowry', 'Gary Paulsen', 'S.E. Hinton', 'John Green',
  'Veronica Roth', 'Cassandra Clare', 'Sarah J. Maas', 'Brandon Sanderson'
];

/**
 * Fetch books from Google Books API
 */
export const fetchGoogleBooks = async (query, maxResults = 10, startIndex = 0) => {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
    const url = new URL(GOOGLE_BOOKS_BASE_URL);
    
    url.searchParams.append('q', query);
    url.searchParams.append('maxResults', maxResults.toString());
    url.searchParams.append('startIndex', startIndex.toString());
    url.searchParams.append('printType', 'books');
    url.searchParams.append('orderBy', 'relevance');
    
    if (apiKey) {
      url.searchParams.append('key', apiKey);
    }

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching from Google Books:', error);
    return [];
  }
};

/**
 * Transform Google Books API response to LibFlix book schema
 */
export const transformGoogleBookToLibFlixBook = (googleBook, readingLevelData = null) => {
  const volumeInfo = googleBook.volumeInfo || {};
  const saleInfo = googleBook.saleInfo || {};
  
  // Extract ISBN (prefer ISBN-13, fallback to ISBN-10)
  const industryIdentifiers = volumeInfo.industryIdentifiers || [];
  const isbn13 = industryIdentifiers.find(id => id.type === 'ISBN_13')?.identifier;
  const isbn10 = industryIdentifiers.find(id => id.type === 'ISBN_10')?.identifier;
  const isbn = isbn13 || isbn10 || '';

  // Extract series information from title
  const title = volumeInfo.title || 'Unknown Title';
  const seriesMatch = title.match(/^(.+?)\s*(?:\(.*?\))?\s*(?:#(\d+)|\s+(\d+))?$/);
  const seriesInfo = extractSeriesInfo(title, volumeInfo.subtitle);

  // Generate reading level if not provided
  const description = volumeInfo.description || '';
  const estimatedReadingLevel = readingLevelData || estimateReadingLevelFromMetadata(volumeInfo);

  return {
    id: `gbook_${googleBook.id}`,
    isbn: isbn,
    title: title,
    author: (volumeInfo.authors || ['Unknown Author']).join(', '),
    series: seriesInfo,
    readingLevel: {
      atos: estimatedReadingLevel.atos,
      lexile: estimatedReadingLevel.lexile,
      ai_assessed: estimatedReadingLevel.ai_assessed,
      confidence: estimatedReadingLevel.confidence,
    },
    metadata: {
      pages: volumeInfo.pageCount || 0,
      publisher: volumeInfo.publisher || '',
      publication_date: volumeInfo.publishedDate || '',
      genres: volumeInfo.categories || [],
      subjects: extractSubjects(volumeInfo),
      description: description.length > 500 ? description.substring(0, 500) + '...' : description,
      cover_url: extractBestCoverImage(volumeInfo.imageLinks),
      preview_url: volumeInfo.previewLink || '',
    },
    availability: {
      physical_copies: Math.floor(Math.random() * 5) + 1, // Random for mock data
      digital_copies: saleInfo.saleability === 'FOR_SALE' ? 'unlimited' : 0,
      checkout_status: 'available',
    },
    engagement_data: {
      student_ratings: generateMockRatings(),
      completion_rate: Math.random() * 0.4 + 0.6, // 60-100%
      reading_time_avg: estimateReadingTime(volumeInfo.pageCount),
      total_checkouts: Math.floor(Math.random() * 50),
      total_reviews: Math.floor(Math.random() * 20),
    },
  };
};

/**
 * Extract series information from title and subtitle
 */
const extractSeriesInfo = (title, subtitle) => {
  // Common series patterns
  const patterns = [
    /^(.+?)\s*(?:#|Book\s+|Volume\s+)(\d+)/i,
    /^(.+?)\s*:\s*(.+?)\s*(?:#|Book\s+)(\d+)/i,
    /^(.+?)\s*\((.+?)\s*(?:#|Book\s+)(\d+)\)/i,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      return {
        name: match[1].trim(),
        book: parseInt(match[2] || match[3]),
        total: 0, // Will need to be populated separately
      };
    }
  }

  // Check if it's part of a known series
  const knownSeries = {
    'Harry Potter': 7,
    'Percy Jackson': 5,
    'Hunger Games': 3,
    'Divergent': 3,
    'Maze Runner': 3,
  };

  for (const [seriesName, totalBooks] of Object.entries(knownSeries)) {
    if (title.includes(seriesName)) {
      return {
        name: seriesName,
        book: 1, // Would need better detection
        total: totalBooks,
      };
    }
  }

  return {
    name: '',
    book: 0,
    total: 0,
  };
};

/**
 * Extract subjects from volume info
 */
const extractSubjects = (volumeInfo) => {
  const subjects = new Set();
  
  // Add categories as subjects
  if (volumeInfo.categories) {
    volumeInfo.categories.forEach(cat => {
      subjects.add(cat.split(' / ').pop()); // Take the most specific category
    });
  }

  // Extract subjects from description
  const description = (volumeInfo.description || '').toLowerCase();
  const commonSubjects = [
    'friendship', 'family', 'adventure', 'mystery', 'magic', 'fantasy',
    'school', 'coming of age', 'love', 'war', 'history', 'science',
    'animals', 'nature', 'sports', 'music', 'art', 'technology'
  ];

  commonSubjects.forEach(subject => {
    if (description.includes(subject)) {
      subjects.add(subject);
    }
  });

  return Array.from(subjects).slice(0, 5); // Limit to 5 subjects
};

/**
 * Extract the best quality cover image
 */
const extractBestCoverImage = (imageLinks) => {
  if (!imageLinks) return '';
  
  // Prefer higher quality images and ensure HTTPS
  const baseUrl = imageLinks.extraLarge || 
                  imageLinks.large || 
                  imageLinks.medium || 
                  imageLinks.thumbnail || 
                  imageLinks.smallThumbnail || 
                  '';
  
  // Convert HTTP to HTTPS and increase size parameters
  return baseUrl
    .replace('http://', 'https://')
    .replace('&edge=curl', '')
    .replace('zoom=1', 'zoom=2')
    .replace('img=1', 'img=1')
    + '&fife=w400-h600';
};

/**
 * Estimate reading level from Google Books metadata
 * This is a fallback when we don't have full text analysis
 */
const estimateReadingLevelFromMetadata = (volumeInfo) => {
  let estimatedLevel = 5; // Default middle grade
  
  // Adjust based on categories
  const categories = (volumeInfo.categories || []).join(' ').toLowerCase();
  
  if (categories.includes('picture book') || categories.includes('early reader')) {
    estimatedLevel = 2;
  } else if (categories.includes('juvenile') && !categories.includes('young adult')) {
    estimatedLevel = 4;
  } else if (categories.includes('young adult')) {
    estimatedLevel = 8;
  } else if (categories.includes('adult') || categories.includes('literary')) {
    estimatedLevel = 10;
  }

  // Adjust based on page count
  const pages = volumeInfo.pageCount || 0;
  if (pages < 50) estimatedLevel -= 1;
  if (pages > 300) estimatedLevel += 1;
  if (pages > 500) estimatedLevel += 1;

  // Adjust based on publication date (older books tend to be more complex)
  const year = parseInt(volumeInfo.publishedDate?.substring(0, 4)) || 2000;
  if (year < 1950) estimatedLevel += 1;

  return {
    atos: Math.max(0.5, Math.min(12, estimatedLevel * 0.9 + 0.5)),
    lexile: `${Math.round(estimatedLevel * 50 + 200)}L`,
    ai_assessed: estimatedLevel,
    confidence: 0.6, // Lower confidence for metadata-based estimation
  };
};

/**
 * Generate mock student ratings for engagement data
 */
const generateMockRatings = () => {
  const numRatings = Math.floor(Math.random() * 15) + 1;
  const ratings = [];
  
  for (let i = 0; i < numRatings; i++) {
    // Weighted toward higher ratings (more realistic)
    const weight = Math.random();
    let rating;
    if (weight < 0.1) rating = 1;
    else if (weight < 0.2) rating = 2;
    else if (weight < 0.3) rating = 3;
    else if (weight < 0.6) rating = 4;
    else rating = 5;
    
    ratings.push(rating);
  }
  
  return ratings;
};

/**
 * Estimate reading time based on page count
 */
const estimateReadingTime = (pages) => {
  if (!pages) return '2 hours';
  
  // Assume 1 page per minute for average reader
  const minutes = pages;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) return `${remainingMinutes} minutes`;
  if (remainingMinutes === 0) return `${hours} hours`;
  return `${hours}.${Math.round(remainingMinutes / 6)} hours`;
};

/**
 * Generate diverse book collection from Google Books
 */
export const generateDiverseBookCollection = async (targetCount = 70) => {
  const books = [];
  const usedBookIds = new Set();
  
  console.log(`Starting generation of ${targetCount} diverse books...`);
  
  for (const [categoryName, categoryData] of Object.entries(BOOK_CATEGORIES)) {
    const booksForCategory = Math.ceil(targetCount * categoryData.weight);
    console.log(`Generating ${booksForCategory} books for ${categoryName}...`);
    
    for (const searchTerm of categoryData.searches) {
      if (books.length >= targetCount) break;
      
      try {
        const googleBooks = await fetchGoogleBooks(searchTerm, 10);
        
        for (const googleBook of googleBooks) {
          if (books.length >= targetCount) break;
          if (usedBookIds.has(googleBook.id)) continue;
          
          const libFlixBook = transformGoogleBookToLibFlixBook(googleBook);
          
          // Validate book has essential data
          if (libFlixBook.title && libFlixBook.author && !libFlixBook.title.includes('Unknown')) {
            books.push(libFlixBook);
            usedBookIds.add(googleBook.id);
            console.log(`Added: ${libFlixBook.title} by ${libFlixBook.author}`);
          }
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error fetching books for search term "${searchTerm}":`, error);
      }
    }
  }
  
  console.log(`Generated ${books.length} books from Google Books API`);
  return books;
};

/**
 * Fetch books by popular authors
 */
export const fetchBooksByPopularAuthors = async (maxBooksPerAuthor = 3) => {
  const books = [];
  
  for (const author of POPULAR_AUTHORS) {
    try {
      const searchQuery = `inauthor:"${author}"`;
      const googleBooks = await fetchGoogleBooks(searchQuery, maxBooksPerAuthor);
      
      for (const googleBook of googleBooks) {
        const libFlixBook = transformGoogleBookToLibFlixBook(googleBook);
        if (libFlixBook.title && !libFlixBook.title.includes('Unknown')) {
          books.push(libFlixBook);
        }
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Error fetching books by ${author}:`, error);
    }
  }
  
  return books;
};