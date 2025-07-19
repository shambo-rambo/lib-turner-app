/**
 * Project Gutenberg Service
 * Handles fetching classic literature from Project Gutenberg
 * Provides the 25 classic books for LibFlix MVP
 */

import { assessBookReadingLevel } from '../utils/readingLevel.js';

/**
 * Curated list of 25 classic books commonly found in school libraries
 * Selected for diverse reading levels and curriculum relevance
 */
export const CLASSIC_BOOKS = [
  // Elementary Level (Grades 2-5)
  {
    id: 'pg_11',
    gutenbergId: 11,
    title: 'Alice\'s Adventures in Wonderland',
    author: 'Lewis Carroll',
    isbn: '978-0-486-27543-2',
    publication_date: '1865',
    pages: 96,
    genres: ['Fantasy', 'Children\'s Literature'],
    subjects: ['Adventure', 'Fantasy', 'Coming of Age'],
    description: 'Follow Alice down the rabbit hole into a world of wonder, where logic is turned upside down and the impossible becomes possible.',
    expectedLevel: 4.5,
  },
  {
    id: 'pg_74',
    gutenbergId: 74,
    title: 'The Adventures of Tom Sawyer',
    author: 'Mark Twain',
    isbn: '978-0-486-40077-4',
    publication_date: '1876',
    pages: 180,
    genres: ['Adventure', 'Coming of Age'],
    subjects: ['Friendship', 'Adventure', 'Childhood'],
    description: 'Tom Sawyer\'s mischievous adventures along the Mississippi River capture the spirit of American boyhood.',
    expectedLevel: 5.5,
  },
  
  // Middle Grade Level (Grades 6-8)
  {
    id: 'pg_76',
    gutenbergId: 76,
    title: 'Adventures of Huckleberry Finn',
    author: 'Mark Twain',
    isbn: '978-0-486-28061-0',
    publication_date: '1884',
    pages: 220,
    genres: ['Adventure', 'Coming of Age'],
    subjects: ['Friendship', 'Freedom', 'Social Justice'],
    description: 'Huck Finn\'s journey down the Mississippi River with Jim explores themes of freedom, friendship, and moral growth.',
    expectedLevel: 6.5,
  },
  {
    id: 'pg_158',
    gutenbergId: 158,
    title: 'Emma',
    author: 'Jane Austen',
    isbn: '978-0-486-40648-6',
    publication_date: '1815',
    pages: 320,
    genres: ['Romance', 'Social Commentary'],
    subjects: ['Love', 'Society', 'Personal Growth'],
    description: 'Emma Woodhouse\'s well-meaning but misguided attempts at matchmaking lead to surprising discoveries about herself.',
    expectedLevel: 8.0,
  },
  {
    id: 'pg_1342',
    gutenbergId: 1342,
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    isbn: '978-0-486-28473-1',
    publication_date: '1813',
    pages: 279,
    genres: ['Romance', 'Social Commentary'],
    subjects: ['Love', 'Class', 'First Impressions'],
    description: 'Elizabeth Bennet and Mr. Darcy\'s tumultuous relationship explores themes of pride, prejudice, and true love.',
    expectedLevel: 8.5,
  },
  {
    id: 'pg_43',
    gutenbergId: 43,
    title: 'The Strange Case of Dr. Jekyll and Mr. Hyde',
    author: 'Robert Louis Stevenson',
    isbn: '978-0-486-26688-1',
    publication_date: '1886',
    pages: 64,
    genres: ['Horror', 'Science Fiction'],
    subjects: ['Duality', 'Good vs Evil', 'Science'],
    description: 'Dr. Jekyll\'s experiment with human nature unleashes his dark alter ego, Mr. Hyde.',
    expectedLevel: 7.0,
  },
  
  // High School Level (Grades 9-12)
  {
    id: 'pg_84',
    gutenbergId: 84,
    title: 'Frankenstein',
    author: 'Mary Shelley',
    isbn: '978-0-486-28211-9',
    publication_date: '1818',
    pages: 280,
    genres: ['Science Fiction', 'Horror'],
    subjects: ['Science', 'Creation', 'Responsibility'],
    description: 'Victor Frankenstein\'s creation of life leads to tragedy and questions about the limits of scientific ambition.',
    expectedLevel: 9.0,
  },
  {
    id: 'pg_1080',
    gutenbergId: 1080,
    title: 'A Modest Proposal',
    author: 'Jonathan Swift',
    isbn: '978-0-486-28029-0',
    publication_date: '1729',
    pages: 12,
    genres: ['Satire', 'Essay'],
    subjects: ['Social Commentary', 'Irony', 'Politics'],
    description: 'Swift\'s satirical essay proposes an outrageous solution to Irish poverty, highlighting social injustice.',
    expectedLevel: 10.0,
  },
  {
    id: 'pg_345',
    gutenbergId: 345,
    title: 'Dracula',
    author: 'Bram Stoker',
    isbn: '978-0-486-41109-1',
    publication_date: '1897',
    pages: 320,
    genres: ['Horror', 'Gothic'],
    subjects: ['Good vs Evil', 'Fear', 'Victorian Society'],
    description: 'Count Dracula\'s arrival in England brings terror and tests the courage of those who oppose him.',
    expectedLevel: 8.5,
  },
  {
    id: 'pg_1497',
    gutenbergId: 1497,
    title: 'The Republic',
    author: 'Plato',
    isbn: '978-0-486-41121-3',
    publication_date: '380 BC',
    pages: 360,
    genres: ['Philosophy', 'Political Theory'],
    subjects: ['Justice', 'Government', 'Ethics'],
    description: 'Plato\'s dialogue explores the nature of justice and the ideal state through Socratic discussion.',
    expectedLevel: 12.0,
  },
  
  // Poetry and Short Works
  {
    id: 'pg_1260',
    gutenbergId: 1260,
    title: 'Jane Eyre',
    author: 'Charlotte Brontë',
    isbn: '978-0-486-42449-7',
    publication_date: '1847',
    pages: 380,
    genres: ['Romance', 'Gothic'],
    subjects: ['Independence', 'Love', 'Social Class'],
    description: 'Jane Eyre\'s journey from orphaned child to independent woman challenges Victorian social conventions.',
    expectedLevel: 9.5,
  },
  {
    id: 'pg_2701',
    gutenbergId: 2701,
    title: 'Moby Dick',
    author: 'Herman Melville',
    isbn: '978-0-486-43215-7',
    publication_date: '1851',
    pages: 635,
    genres: ['Adventure', 'Literary Fiction'],
    subjects: ['Obsession', 'Nature', 'Fate'],
    description: 'Captain Ahab\'s obsessive quest for the white whale Moby Dick explores themes of revenge and destiny.',
    expectedLevel: 11.0,
  },
  {
    id: 'pg_16',
    gutenbergId: 16,
    title: 'Peter Pan',
    author: 'J.M. Barrie',
    isbn: '978-0-486-41536-5',
    publication_date: '1911',
    pages: 160,
    genres: ['Fantasy', 'Children\'s Literature'],
    subjects: ['Adventure', 'Growing Up', 'Imagination'],
    description: 'Peter Pan takes the Darling children to Neverland, where they never have to grow up.',
    expectedLevel: 5.0,
  },
  {
    id: 'pg_64317',
    gutenbergId: 64317,
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    isbn: '978-0-486-28273-7',
    publication_date: '1925',
    pages: 180,
    genres: ['Literary Fiction', 'Social Commentary'],
    subjects: ['American Dream', 'Wealth', 'Love'],
    description: 'Jay Gatsby\'s pursuit of the American Dream and lost love reflects the excess of the Jazz Age.',
    expectedLevel: 10.5,
  },
  {
    id: 'pg_174',
    gutenbergId: 174,
    title: 'The Picture of Dorian Gray',
    author: 'Oscar Wilde',
    isbn: '978-0-486-27807-5',
    publication_date: '1890',
    pages: 224,
    genres: ['Gothic', 'Philosophical Fiction'],
    subjects: ['Beauty', 'Corruption', 'Art'],
    description: 'Dorian Gray\'s portrait ages while he remains young, exploring the cost of vanity and hedonism.',
    expectedLevel: 9.5,
  },
  
  // Additional classics for curriculum coverage
  {
    id: 'pg_1232',
    gutenbergId: 1232,
    title: 'The Prince',
    author: 'Niccolò Machiavelli',
    isbn: '978-0-486-27274-5',
    publication_date: '1532',
    pages: 96,
    genres: ['Political Philosophy', 'Non-fiction'],
    subjects: ['Leadership', 'Power', 'Politics'],
    description: 'Machiavelli\'s guide to political leadership explores the relationship between morality and effective governance.',
    expectedLevel: 11.5,
  },
  {
    id: 'pg_46',
    gutenbergId: 46,
    title: 'A Christmas Carol',
    author: 'Charles Dickens',
    isbn: '978-0-486-26865-6',
    publication_date: '1843',
    pages: 80,
    genres: ['Fiction', 'Holiday'],
    subjects: ['Redemption', 'Christmas', 'Social Justice'],
    description: 'Ebenezer Scrooge\'s transformation from miser to benefactor shows the power of redemption.',
    expectedLevel: 6.0,
  },
  {
    id: 'pg_98',
    gutenbergId: 98,
    title: 'A Tale of Two Cities',
    author: 'Charles Dickens',
    isbn: '978-0-486-40651-6',
    publication_date: '1859',
    pages: 340,
    genres: ['Historical Fiction', 'Drama'],
    subjects: ['Revolution', 'Sacrifice', 'Justice'],
    description: 'Set during the French Revolution, this tale of sacrifice and redemption spans London and Paris.',
    expectedLevel: 9.0,
  },
  {
    id: 'pg_1727',
    gutenbergId: 1727,
    title: 'The Odyssey',
    author: 'Homer',
    isbn: '978-0-486-40654-7',
    publication_date: '8th century BC',
    pages: 320,
    genres: ['Epic Poetry', 'Mythology'],
    subjects: ['Adventure', 'Heroism', 'Journey'],
    description: 'Odysseus\'s ten-year journey home from the Trojan War is filled with mythical creatures and divine intervention.',
    expectedLevel: 10.0,
  },
  {
    id: 'pg_2542',
    gutenbergId: 2542,
    title: 'A Doll\'s House',
    author: 'Henrik Ibsen',
    isbn: '978-0-486-27062-8',
    publication_date: '1879',
    pages: 80,
    genres: ['Drama', 'Social Commentary'],
    subjects: ['Women\'s Rights', 'Marriage', 'Independence'],
    description: 'Nora Helmer\'s awakening to her own identity challenges 19th-century expectations of women.',
    expectedLevel: 9.5,
  },
  {
    id: 'pg_23',
    gutenbergId: 23,
    title: 'The Man in the Iron Mask',
    author: 'Alexandre Dumas',
    isbn: '978-0-486-41845-8',
    publication_date: '1850',
    pages: 450,
    genres: ['Historical Fiction', 'Adventure'],
    subjects: ['Mystery', 'Royal Intrigue', 'Friendship'],
    description: 'D\'Artagnan and the musketeers face their greatest challenge in this tale of royal secrets.',
    expectedLevel: 8.0,
  },
  {
    id: 'pg_135',
    gutenbergId: 135,
    title: 'Les Misérables',
    author: 'Victor Hugo',
    isbn: '978-0-486-45789-2',
    publication_date: '1862',
    pages: 1200,
    genres: ['Historical Fiction', 'Social Commentary'],
    subjects: ['Justice', 'Redemption', 'Social Revolution'],
    description: 'Jean Valjean\'s journey from convict to saint reflects themes of justice, love, and social reform.',
    expectedLevel: 10.5,
  },
  {
    id: 'pg_408',
    gutenbergId: 408,
    title: 'The Soul of a Man Under Socialism',
    author: 'Oscar Wilde',
    isbn: '978-0-486-41923-3',
    publication_date: '1891',
    pages: 32,
    genres: ['Essay', 'Political Philosophy'],
    subjects: ['Socialism', 'Art', 'Society'],
    description: 'Wilde\'s essay explores how socialism could liberate human creativity and artistic expression.',
    expectedLevel: 11.0,
  },
  {
    id: 'pg_120',
    gutenbergId: 120,
    title: 'Treasure Island',
    author: 'Robert Louis Stevenson',
    isbn: '978-0-486-27559-3',
    publication_date: '1883',
    pages: 160,
    genres: ['Adventure', 'Children\'s Literature'],
    subjects: ['Pirates', 'Treasure', 'Coming of Age'],
    description: 'Jim Hawkins\'s adventure with pirates in search of buried treasure is a timeless tale of courage.',
    expectedLevel: 5.5,
  },
  {
    id: 'pg_1998',
    gutenbergId: 1998,
    title: 'Thus Spoke Zarathustra',
    author: 'Friedrich Nietzsche',
    isbn: '978-0-486-42634-7',
    publication_date: '1883',
    pages: 320,
    genres: ['Philosophy', 'Literature'],
    subjects: ['Philosophy', 'Religion', 'Morality'],
    description: 'Nietzsche\'s philosophical novel explores themes of self-improvement and the human condition.',
    expectedLevel: 12.0,
  }
];

/**
 * Transform Project Gutenberg book data to LibFlix schema
 */
export const transformGutenbergBookToLibFlixBook = (gutenbergBook, fullText = null) => {
  // Calculate reading level from full text if available
  let readingLevelData;
  if (fullText) {
    readingLevelData = assessBookReadingLevel(fullText, {
      genre: gutenbergBook.genres[0],
      pages: gutenbergBook.pages,
    });
  } else {
    // Use expected level as fallback
    readingLevelData = {
      atos: gutenbergBook.expectedLevel * 0.9 + 0.5,
      lexile: `${Math.round(gutenbergBook.expectedLevel * 50 + 200)}L`,
      ai_assessed: gutenbergBook.expectedLevel,
      confidence: 0.8,
    };
  }

  return {
    id: gutenbergBook.id,
    isbn: gutenbergBook.isbn,
    title: gutenbergBook.title,
    author: gutenbergBook.author,
    series: {
      name: '',
      book: 0,
      total: 0,
    },
    readingLevel: readingLevelData,
    metadata: {
      pages: gutenbergBook.pages,
      publisher: 'Project Gutenberg',
      publication_date: gutenbergBook.publication_date,
      genres: gutenbergBook.genres,
      subjects: gutenbergBook.subjects,
      description: gutenbergBook.description,
      cover_url: generateGutenbergCoverUrl(gutenbergBook.gutenbergId),
      preview_url: `https://www.gutenberg.org/ebooks/${gutenbergBook.gutenbergId}`,
    },
    availability: {
      physical_copies: Math.floor(Math.random() * 3) + 1, // 1-3 copies
      digital_copies: 'unlimited', // Project Gutenberg is public domain
      checkout_status: 'available',
    },
    engagement_data: {
      student_ratings: generateClassicBookRatings(gutenbergBook.expectedLevel),
      completion_rate: calculateCompletionRate(gutenbergBook.pages, gutenbergBook.expectedLevel),
      reading_time_avg: estimateReadingTime(gutenbergBook.pages),
      total_checkouts: Math.floor(Math.random() * 100) + 50, // Classics get more checkouts
      total_reviews: Math.floor(Math.random() * 30) + 10,
    },
  };
};

/**
 * Generate cover URL for Project Gutenberg books
 * Uses a placeholder service since PG doesn't always have covers
 */
const generateGutenbergCoverUrl = (gutenbergId) => {
  // Try the official Project Gutenberg cover first
  const officialCover = `https://www.gutenberg.org/cache/epub/${gutenbergId}/pg${gutenbergId}.cover.medium.jpg`;
  
  // Fallback to a placeholder service
  return officialCover;
};

/**
 * Generate realistic ratings for classic books
 * Classics tend to have polarized ratings (love it or hate it)
 */
const generateClassicBookRatings = (expectedLevel) => {
  const numRatings = Math.floor(Math.random() * 25) + 15; // 15-40 ratings
  const ratings = [];
  
  for (let i = 0; i < numRatings; i++) {
    const weight = Math.random();
    let rating;
    
    // Classics have more polarized ratings
    if (expectedLevel > 9) {
      // Difficult classics: more 5s and 2s, fewer 3s and 4s
      if (weight < 0.15) rating = 1;
      else if (weight < 0.25) rating = 2;
      else if (weight < 0.35) rating = 3;
      else if (weight < 0.5) rating = 4;
      else rating = 5;
    } else {
      // More accessible classics: generally higher ratings
      if (weight < 0.05) rating = 1;
      else if (weight < 0.1) rating = 2;
      else if (weight < 0.2) rating = 3;
      else if (weight < 0.45) rating = 4;
      else rating = 5;
    }
    
    ratings.push(rating);
  }
  
  return ratings;
};

/**
 * Calculate completion rate based on book difficulty and length
 */
const calculateCompletionRate = (pages, expectedLevel) => {
  let baseRate = 0.7; // 70% base completion rate
  
  // Adjust for length
  if (pages > 400) baseRate -= 0.2;
  else if (pages > 300) baseRate -= 0.1;
  else if (pages < 100) baseRate += 0.1;
  
  // Adjust for difficulty
  if (expectedLevel > 10) baseRate -= 0.2;
  else if (expectedLevel > 8) baseRate -= 0.1;
  else if (expectedLevel < 6) baseRate += 0.1;
  
  return Math.max(0.3, Math.min(0.95, baseRate + (Math.random() - 0.5) * 0.2));
};

/**
 * Estimate reading time for classics
 */
const estimateReadingTime = (pages) => {
  // Classics typically take longer to read (slower pace)
  const minutesPerPage = 1.5; // Slower than average due to complexity
  const totalMinutes = pages * minutesPerPage;
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = Math.round((totalMinutes % 60) / 10) * 10; // Round to nearest 10
  
  if (hours === 0) return `${remainingMinutes} minutes`;
  if (remainingMinutes === 0) return `${hours} hours`;
  return `${hours}.${Math.round(remainingMinutes / 6)} hours`;
};

/**
 * Fetch full text from Project Gutenberg (optional for reading level analysis)
 */
export const fetchGutenbergText = async (gutenbergId) => {
  try {
    const response = await fetch(`https://www.gutenberg.org/files/${gutenbergId}/${gutenbergId}-0.txt`);
    if (response.ok) {
      return await response.text();
    }
  } catch (error) {
    console.warn(`Could not fetch full text for Gutenberg ID ${gutenbergId}:`, error);
  }
  return null;
};

/**
 * Generate all 25 classic books for LibFlix
 */
export const generateClassicBooks = async (includeFullTextAnalysis = false) => {
  console.log('Generating 25 classic books from Project Gutenberg...');
  const books = [];
  
  for (const gutenbergBook of CLASSIC_BOOKS) {
    let fullText = null;
    
    if (includeFullTextAnalysis) {
      console.log(`Fetching full text for ${gutenbergBook.title}...`);
      fullText = await fetchGutenbergText(gutenbergBook.gutenbergId);
      
      // Add delay to be respectful to Project Gutenberg servers
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const libFlixBook = transformGutenbergBookToLibFlixBook(gutenbergBook, fullText);
    books.push(libFlixBook);
    
    console.log(`Added classic: ${libFlixBook.title} by ${libFlixBook.author} (Level: ${libFlixBook.readingLevel.atos})`);
  }
  
  console.log(`Generated ${books.length} classic books from Project Gutenberg`);
  return books;
};

/**
 * Get books by reading level range
 */
export const getClassicsByReadingLevel = (minLevel, maxLevel) => {
  return CLASSIC_BOOKS
    .filter(book => book.expectedLevel >= minLevel && book.expectedLevel <= maxLevel)
    .map(book => transformGutenbergBookToLibFlixBook(book));
};

/**
 * Get books by genre
 */
export const getClassicsByGenre = (genre) => {
  return CLASSIC_BOOKS
    .filter(book => book.genres.some(g => g.toLowerCase().includes(genre.toLowerCase())))
    .map(book => transformGutenbergBookToLibFlixBook(book));
};