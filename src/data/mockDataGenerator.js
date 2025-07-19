/**
 * Mock Data Generator
 * Combines Google Books API and Project Gutenberg to create the complete LibFlix dataset
 * Target: 70 Google Books + 25 Project Gutenberg + 5 Custom = 100 books total
 */

import { generateDiverseBookCollection, fetchBooksByPopularAuthors } from '../services/googleBooks.js';
import { generateClassicBooks } from '../services/projectGutenberg.js';
import { generateSampleStudent, generateSampleBook } from './schemas.js';

/**
 * Custom curated books for testing and demo purposes
 */
const CUSTOM_DEMO_BOOKS = [
  {
    id: 'custom_demo_1',
    isbn: '978-0-000-00001-1',
    title: 'The LibFlix Adventure',
    author: 'Demo Author',
    series: { name: '', book: 0, total: 0 },
    readingLevel: { atos: 4.5, lexile: '650L', ai_assessed: 4.5, confidence: 1.0 },
    metadata: {
      pages: 120,
      publisher: 'LibFlix Press',
      publication_date: '2024',
      genres: ['Adventure', 'Technology'],
      subjects: ['Reading', 'Technology', 'Education'],
      description: 'A young student discovers the magic of reading through an innovative library system that transforms books into adventures.',
      cover_url: 'https://via.placeholder.com/400x600/4F46E5/white?text=LibFlix+Adventure',
      preview_url: '',
    },
    availability: { physical_copies: 5, digital_copies: 'unlimited', checkout_status: 'available' },
    engagement_data: {
      student_ratings: [5, 5, 4, 5, 4, 5],
      completion_rate: 0.95,
      reading_time_avg: '2.5 hours',
      total_checkouts: 45,
      total_reviews: 8,
    },
  },
  {
    id: 'custom_demo_2',
    isbn: '978-0-000-00002-2',
    title: 'Dragons in the Cloud',
    author: 'Tech Fantasy Writer',
    series: { name: 'Digital Realms', book: 1, total: 3 },
    readingLevel: { atos: 6.8, lexile: '840L', ai_assessed: 6.8, confidence: 1.0 },
    metadata: {
      pages: 280,
      publisher: 'Future Books',
      publication_date: '2024',
      genres: ['Fantasy', 'Science Fiction'],
      subjects: ['Dragons', 'Technology', 'Virtual Reality'],
      description: 'When virtual reality meets ancient magic, a teenage programmer must save both digital and mystical worlds.',
      cover_url: 'https://via.placeholder.com/400x600/7C3AED/white?text=Dragons+Cloud',
      preview_url: '',
    },
    availability: { physical_copies: 3, digital_copies: 'unlimited', checkout_status: 'available' },
    engagement_data: {
      student_ratings: [5, 4, 5, 5, 4, 4, 5],
      completion_rate: 0.87,
      reading_time_avg: '5.2 hours',
      total_checkouts: 32,
      total_reviews: 12,
    },
  },
  {
    id: 'custom_demo_3',
    isbn: '978-0-000-00003-3',
    title: 'The Social Network Mystery',
    author: 'Mystery Tech Author',
    series: { name: '', book: 0, total: 0 },
    readingLevel: { atos: 7.5, lexile: '920L', ai_assessed: 7.5, confidence: 1.0 },
    metadata: {
      pages: 200,
      publisher: 'Digital Mysteries',
      publication_date: '2024',
      genres: ['Mystery', 'Contemporary'],
      subjects: ['Social Media', 'Friendship', 'Technology'],
      description: 'A high school student investigates mysterious messages appearing in their social media feeds, uncovering a conspiracy.',
      cover_url: 'https://via.placeholder.com/400x600/059669/white?text=Social+Mystery',
      preview_url: '',
    },
    availability: { physical_copies: 2, digital_copies: 'unlimited', checkout_status: 'available' },
    engagement_data: {
      student_ratings: [4, 5, 4, 4, 5, 4],
      completion_rate: 0.78,
      reading_time_avg: '4.1 hours',
      total_checkouts: 28,
      total_reviews: 7,
    },
  },
  {
    id: 'custom_demo_4',
    isbn: '978-0-000-00004-4',
    title: 'AI and Me: A Friendship Story',
    author: 'Future Friend',
    series: { name: '', book: 0, total: 0 },
    readingLevel: { atos: 5.2, lexile: '720L', ai_assessed: 5.2, confidence: 1.0 },
    metadata: {
      pages: 150,
      publisher: 'Tomorrow Tales',
      publication_date: '2024',
      genres: ['Science Fiction', 'Friendship'],
      subjects: ['Artificial Intelligence', 'Friendship', 'Technology'],
      description: 'A heartwarming story about a student who befriends an AI companion and learns about empathy, technology, and what makes us human.',
      cover_url: 'https://via.placeholder.com/400x600/DC2626/white?text=AI+Friendship',
      preview_url: '',
    },
    availability: { physical_copies: 4, digital_copies: 'unlimited', checkout_status: 'available' },
    engagement_data: {
      student_ratings: [5, 5, 4, 5, 5, 4, 5, 4],
      completion_rate: 0.92,
      reading_time_avg: '3.2 hours',
      total_checkouts: 38,
      total_reviews: 15,
    },
  },
  {
    id: 'custom_demo_5',
    isbn: '978-0-000-00005-5',
    title: 'The Reading Revolution',
    author: 'Education Innovator',
    series: { name: '', book: 0, total: 0 },
    readingLevel: { atos: 8.2, lexile: '980L', ai_assessed: 8.2, confidence: 1.0 },
    metadata: {
      pages: 240,
      publisher: 'Learning Press',
      publication_date: '2024',
      genres: ['Non-fiction', 'Education'],
      subjects: ['Education', 'Technology', 'Social Change'],
      description: 'How technology is transforming education and making reading accessible to every student, regardless of their background.',
      cover_url: 'https://via.placeholder.com/400x600/F59E0B/white?text=Reading+Revolution',
      preview_url: '',
    },
    availability: { physical_copies: 2, digital_copies: 'unlimited', checkout_status: 'available' },
    engagement_data: {
      student_ratings: [4, 4, 5, 4, 3, 4, 5],
      completion_rate: 0.65,
      reading_time_avg: '4.8 hours',
      total_checkouts: 15,
      total_reviews: 6,
    },
  },
];

/**
 * Generate student profiles for testing
 */
const generateMockStudents = (count = 50) => {
  const students = [];
  const firstNames = [
    'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
    'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia',
    'Jacob', 'Harper', 'Michael', 'Evelyn', 'Elijah', 'Abigail', 'Owen',
  ];
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
    'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
    'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  ];

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${firstName} ${lastName}`;
    const gradeLevel = Math.floor(Math.random() * 12) + 1; // Grades 1-12
    
    const student = generateSampleStudent({
      id: `student_${i + 1}`,
      encrypted_name: `encrypted_${fullName.replace(' ', '_').toLowerCase()}`, // Mock encryption
      school_id: 'cranbrook_senior',
      grade_level: gradeLevel,
      reading_profile: {
        current_level: Math.max(1, gradeLevel + (Math.random() - 0.5) * 2),
        growth_rate: Math.random() * 0.5 + 0.1, // 0.1 to 0.6 levels per month
        preferred_genres: generateRandomGenres(),
        reading_speed: ['slow', 'average', 'fast'][Math.floor(Math.random() * 3)],
        comprehension_score: Math.random() * 0.3 + 0.7, // 0.7 to 1.0
      },
      ai_context: {
        personality_match: generatePersonalityMatch(gradeLevel),
        interaction_history: [],
        learning_patterns: generateLearningPatterns(),
        mood_preferences: generateMoodPreferences(),
      },
      social: {
        friends: [], // Will be populated separately
        reading_activity: [],
        reviews_written: Math.floor(Math.random() * 10),
        books_shared: Math.floor(Math.random() * 5),
      },
    });

    students.push(student);
  }

  // Create friendships
  students.forEach(student => {
    const numFriends = Math.floor(Math.random() * 8) + 2; // 2-9 friends
    const potentialFriends = students
      .filter(s => s.id !== student.id && Math.abs(s.grade_level - student.grade_level) <= 2)
      .sort(() => Math.random() - 0.5)
      .slice(0, numFriends);
    
    student.social.friends = potentialFriends.map(f => f.id);
  });

  return students;
};

const generateRandomGenres = () => {
  const allGenres = [
    'Fantasy', 'Science Fiction', 'Mystery', 'Adventure', 'Romance',
    'Historical Fiction', 'Contemporary', 'Horror', 'Comedy', 'Biography',
    'Non-fiction', 'Poetry', 'Drama', 'Graphic Novels'
  ];
  
  const numGenres = Math.floor(Math.random() * 4) + 1; // 1-4 preferred genres
  return allGenres.sort(() => Math.random() - 0.5).slice(0, numGenres);
};

const generatePersonalityMatch = (gradeLevel) => {
  const personalities = {
    elementary: ['curious_explorer', 'imaginative_dreamer', 'adventure_seeker', 'gentle_reader'],
    middle: ['social_connector', 'mystery_solver', 'fantasy_lover', 'science_enthusiast'],
    high: ['deep_thinker', 'realistic_analyst', 'creative_writer', 'social_activist']
  };

  if (gradeLevel <= 5) return personalities.elementary[Math.floor(Math.random() * personalities.elementary.length)];
  if (gradeLevel <= 8) return personalities.middle[Math.floor(Math.random() * personalities.middle.length)];
  return personalities.high[Math.floor(Math.random() * personalities.high.length)];
};

const generateLearningPatterns = () => ({
  prefers_visual: Math.random() > 0.5,
  prefers_audio: Math.random() > 0.7,
  likes_discussion: Math.random() > 0.6,
  needs_encouragement: Math.random() > 0.8,
  works_better_in_groups: Math.random() > 0.6,
});

const generateMoodPreferences = () => ({
  formal_tone: Math.random() > 0.7,
  casual_tone: Math.random() > 0.3,
  encouraging_tone: Math.random() > 0.2,
  challenging_tone: Math.random() > 0.8,
});

/**
 * Generate school data
 */
const generateMockSchool = () => ({
  id: 'cranbrook_senior',
  name: 'Cranbrook Senior School',
  district: 'Eastern Suburbs District',
  country: 'Australia',
  settings: {
    reading_goals: {
      books_per_year: 12,
      minutes_per_day: 30,
    },
    privacy_settings: {
      cross_school_data: false,
      parent_notifications: true,
    },
    curriculum_standards: ['Australian Curriculum', 'NSW English Syllabus'],
  },
  subscription: {
    tier: 'premium',
    features_enabled: ['ai_companion', 'social_features', 'analytics_dashboard'],
    ar_migration_status: 'completed',
  },
});

/**
 * Main function to generate complete mock dataset
 */
export const generateCompleteDataset = async () => {
  console.log('🚀 Starting LibFlix MVP dataset generation...');
  console.log('Target: 70 Google Books + 25 Project Gutenberg + 5 Custom = 100 books');
  
  const startTime = Date.now();
  const dataset = {
    books: [],
    students: [],
    school: null,
    metadata: {
      generated_at: new Date().toISOString(),
      total_books: 0,
      books_by_source: {},
      reading_level_distribution: {},
    }
  };

  try {
    // 1. Generate Google Books (70 books)
    console.log('\n📚 Phase 1: Fetching diverse books from Google Books API...');
    const googleBooks = await generateDiverseBookCollection(70);
    dataset.books.push(...googleBooks);
    console.log(`✅ Added ${googleBooks.length} books from Google Books API`);

    // 2. Generate Project Gutenberg classics (25 books)
    console.log('\n📖 Phase 2: Adding classic literature from Project Gutenberg...');
    const classicBooks = await generateClassicBooks(false); // Skip full text analysis for speed
    dataset.books.push(...classicBooks);
    console.log(`✅ Added ${classicBooks.length} classic books from Project Gutenberg`);

    // 3. Add custom demo books (5 books)
    console.log('\n🎨 Phase 3: Adding custom demo books...');
    dataset.books.push(...CUSTOM_DEMO_BOOKS);
    console.log(`✅ Added ${CUSTOM_DEMO_BOOKS.length} custom demo books`);

    // 4. Generate student profiles
    console.log('\n👥 Phase 4: Generating student profiles...');
    const students = generateMockStudents(50);
    dataset.students = students;
    console.log(`✅ Generated ${students.length} student profiles with social connections`);

    // 5. Generate school data
    console.log('\n🏫 Phase 5: Creating school configuration...');
    dataset.school = generateMockSchool();
    console.log('✅ Generated school configuration');

    // 6. Calculate metadata
    dataset.metadata.total_books = dataset.books.length;
    dataset.metadata.books_by_source = {
      google_books: googleBooks.length,
      project_gutenberg: classicBooks.length,
      custom_demo: CUSTOM_DEMO_BOOKS.length,
    };

    // Calculate reading level distribution
    const levelDistribution = {};
    dataset.books.forEach(book => {
      const level = Math.floor(book.readingLevel.atos);
      levelDistribution[level] = (levelDistribution[level] || 0) + 1;
    });
    dataset.metadata.reading_level_distribution = levelDistribution;

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n🎉 Dataset generation complete!');
    console.log(`📊 Final Statistics:`);
    console.log(`   • Total books: ${dataset.metadata.total_books}`);
    console.log(`   • Google Books: ${dataset.metadata.books_by_source.google_books}`);
    console.log(`   • Project Gutenberg: ${dataset.metadata.books_by_source.project_gutenberg}`);
    console.log(`   • Custom demos: ${dataset.metadata.books_by_source.custom_demo}`);
    console.log(`   • Students: ${dataset.students.length}`);
    console.log(`   • Generation time: ${duration} seconds`);
    console.log('\n📈 Reading Level Distribution:');
    Object.entries(levelDistribution)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([level, count]) => {
        console.log(`   • Grade ${level}: ${count} books`);
      });

    return dataset;

  } catch (error) {
    console.error('❌ Error generating dataset:', error);
    throw error;
  }
};

/**
 * Save dataset to files for development
 */
export const saveDatasetToFiles = async (dataset) => {
  // This would save to JSON files or initialize Firebase in a real implementation
  console.log('💾 Dataset ready for Firebase import');
  
  // For now, just return the dataset
  return {
    books: dataset.books,
    students: dataset.students,
    school: dataset.school,
    metadata: dataset.metadata,
  };
};

/**
 * Quick dataset for development (smaller, faster)
 */
export const generateQuickDataset = async () => {
  console.log('⚡ Generating quick dataset for development...');
  
  const dataset = {
    books: [...CUSTOM_DEMO_BOOKS],
    students: generateMockStudents(10),
    school: generateMockSchool(),
    metadata: {
      generated_at: new Date().toISOString(),
      total_books: CUSTOM_DEMO_BOOKS.length,
      books_by_source: { custom_demo: CUSTOM_DEMO_BOOKS.length },
      note: 'Quick dataset for development - contains only custom demo books'
    }
  };

  console.log(`✅ Quick dataset generated: ${dataset.books.length} books, ${dataset.students.length} students`);
  return dataset;
};