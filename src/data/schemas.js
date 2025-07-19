/**
 * LibFlix Database Schemas
 * Defines the data structures for books, students, and other entities
 */

/**
 * Book Document Schema
 * Matches the PRD specification exactly
 */
export const createBookSchema = () => ({
  id: '', // Unique identifier
  isbn: '', // ISBN-13 format
  title: '',
  author: '',
  series: {
    name: '',
    book: 0,
    total: 0,
  },
  readingLevel: {
    atos: 0, // ATOS reading level
    lexile: '', // Lexile measure (e.g., "HL880L")
    ai_assessed: 0, // AI-enhanced reading level
    confidence: 0, // Confidence score (0-1)
  },
  metadata: {
    pages: 0,
    publisher: '',
    publication_date: '',
    genres: [], // Array of genre strings
    subjects: [], // Array of subject strings
    description: '',
    cover_url: '',
    preview_url: '', // For in-browser reading
  },
  availability: {
    physical_copies: 0,
    digital_copies: 'unlimited', // or number
    checkout_status: 'available', // 'available', 'checked_out', 'reserved'
  },
  engagement_data: {
    student_ratings: [], // Array of rating numbers
    completion_rate: 0, // 0-1
    reading_time_avg: '', // e.g., "8.5 hours"
    total_checkouts: 0,
    total_reviews: 0,
  },
});

/**
 * Student Profile Schema
 * Includes privacy considerations and reading analytics
 */
export const createStudentSchema = () => ({
  id: '', // UUID
  encrypted_name: '', // AES-256-GCM encrypted
  school_id: '', // e.g., "cranbrook_senior"
  grade_level: 0, // 1-12
  reading_profile: {
    current_level: 0, // Current reading level
    growth_rate: 0, // Reading level growth per month
    preferred_genres: [], // Array of favorite genres
    reading_speed: 'average', // 'slow', 'average', 'fast'
    comprehension_score: 0, // 0-1
  },
  ai_context: {
    personality_match: '', // e.g., "curious_explorer"
    interaction_history: [], // Array of past AI interactions
    learning_patterns: {}, // Learning style preferences
    mood_preferences: {}, // Preferred AI tone/style
  },
  social: {
    friends: [], // Array of friend student IDs
    reading_activity: [], // Recent reading activities
    reviews_written: 0,
    books_shared: 0,
  },
  curriculum_progress: {
    // Dynamic based on grade/curriculum
    // Example: year_10_english: { war_literature: "in_progress" }
  },
  created_at: null, // Date
  updated_at: null, // Date
});

/**
 * School Schema
 * For multi-school support and data isolation
 */
export const createSchoolSchema = () => ({
  id: '', // Unique school identifier
  name: '',
  district: '',
  country: '',
  settings: {
    reading_goals: {
      books_per_year: 12,
      minutes_per_day: 30,
    },
    privacy_settings: {
      cross_school_data: false,
      parent_notifications: true,
    },
    curriculum_standards: [], // Array of curriculum standards
  },
  subscription: {
    tier: 'free', // 'free', 'premium'
    features_enabled: [],
    ar_migration_status: 'pending', // 'pending', 'in_progress', 'completed'
  },
});

/**
 * Reading Session Schema
 * For tracking individual reading sessions
 */
export const createReadingSessionSchema = () => ({
  id: '',
  student_id: '',
  book_id: '',
  started_at: null, // Date
  ended_at: null, // Date
  duration_minutes: 0,
  pages_read: 0,
  progress_percentage: 0, // 0-100
  annotations: [], // Array of highlights/notes
  comprehension_data: {
    quiz_taken: false,
    quiz_score: 0,
    difficulty_rating: 0, // Student's perceived difficulty
  },
});

/**
 * Review Schema
 * For student book reviews and ratings
 */
export const createReviewSchema = () => ({
  id: '',
  student_id: '',
  book_id: '',
  rating: 0, // 1-5 stars
  review_text: '',
  spoiler_warning: false,
  created_at: null,
  moderation_status: 'approved', // 'pending', 'approved', 'rejected'
  likes: 0,
  helpful_votes: 0,
});

/**
 * AI Interaction Schema
 * For storing AI companion conversations
 */
export const createAIInteractionSchema = () => ({
  id: '',
  student_id: '',
  book_id: '', // Optional - if discussing specific book
  conversation_type: 'recommendation', // 'recommendation', 'discussion', 'assessment'
  ai_message: '',
  student_response: '',
  context: {
    student_mood: '',
    reading_goal: '',
    curriculum_alignment: '',
  },
  created_at: null,
});

/**
 * Utility functions for schema validation
 */
export const validateBook = (book) => {
  const required = ['id', 'title', 'author', 'isbn'];
  return required.every(field => book[field]);
};

export const validateStudent = (student) => {
  const required = ['id', 'school_id', 'grade_level'];
  return required.every(field => student[field]);
};

/**
 * Sample data generators
 */
export const generateSampleBook = (overrides = {}) => ({
  ...createBookSchema(),
  id: `book_${Date.now()}`,
  ...overrides,
});

export const generateSampleStudent = (overrides = {}) => ({
  ...createStudentSchema(),
  id: `student_${Date.now()}`,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});