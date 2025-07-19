/**
 * Reading Level Assessment Utilities
 * Implements Flesch-Kincaid and other readability algorithms
 * MVP implementation with plan for comprehensive ATOS replacement
 */

/**
 * Common English syllable patterns for syllable counting
 */
const VOWELS = 'aeiouy';
const SILENT_E_ENDINGS = ['le', 'ed', 'es', 'er', 'ing'];

/**
 * Count syllables in a word (simplified algorithm)
 * This is a basic implementation - production would need more sophisticated rules
 */
export const countSyllables = (word) => {
  if (!word || word.length === 0) return 0;
  
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length === 0) return 0;
  
  let syllables = 0;
  let previousWasVowel = false;
  
  for (let i = 0; i < word.length; i++) {
    const isVowel = VOWELS.includes(word[i]);
    
    if (isVowel && !previousWasVowel) {
      syllables++;
    }
    
    previousWasVowel = isVowel;
  }
  
  // Handle silent 'e' at the end
  if (word.endsWith('e') && syllables > 1) {
    syllables--;
  }
  
  // Every word has at least one syllable
  return Math.max(1, syllables);
};

/**
 * Count sentences in text
 */
export const countSentences = (text) => {
  if (!text) return 0;
  
  // Split by sentence endings, filter out empty strings
  const sentences = text
    .split(/[.!?]+/)
    .filter(sentence => sentence.trim().length > 0);
  
  return Math.max(1, sentences.length);
};

/**
 * Count words in text
 */
export const countWords = (text) => {
  if (!text) return 0;
  
  return text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0).length;
};

/**
 * Calculate Flesch-Kincaid Grade Level
 * Formula: 0.39 × (total words ÷ total sentences) + 11.8 × (total syllables ÷ total words) - 15.59
 */
export const calculateFleschKincaidGradeLevel = (text) => {
  if (!text || text.trim().length === 0) return 0;
  
  const words = countWords(text);
  const sentences = countSentences(text);
  const syllables = text
    .split(/\s+/)
    .reduce((total, word) => total + countSyllables(word), 0);
  
  if (words === 0 || sentences === 0) return 0;
  
  const avgWordsPerSentence = words / sentences;
  const avgSyllablesPerWord = syllables / words;
  
  const gradeLevel = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
  
  return Math.max(0, Math.round(gradeLevel * 10) / 10);
};

/**
 * Calculate Flesch Reading Ease Score
 * Formula: 206.835 - 1.015 × (total words ÷ total sentences) - 84.6 × (total syllables ÷ total words)
 */
export const calculateFleschReadingEase = (text) => {
  if (!text || text.trim().length === 0) return 0;
  
  const words = countWords(text);
  const sentences = countSentences(text);
  const syllables = text
    .split(/\s+/)
    .reduce((total, word) => total + countSyllables(word), 0);
  
  if (words === 0 || sentences === 0) return 0;
  
  const avgWordsPerSentence = words / sentences;
  const avgSyllablesPerWord = syllables / words;
  
  const readingEase = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
  
  return Math.max(0, Math.min(100, Math.round(readingEase * 10) / 10));
};

/**
 * Convert Flesch Reading Ease to interpretation
 */
export const interpretFleschReadingEase = (score) => {
  if (score >= 90) return 'Very Easy';
  if (score >= 80) return 'Easy';
  if (score >= 70) return 'Fairly Easy';
  if (score >= 60) return 'Standard';
  if (score >= 50) return 'Fairly Difficult';
  if (score >= 30) return 'Difficult';
  return 'Very Difficult';
};

/**
 * Calculate SMOG (Simple Measure of Gobbledygook) Grade Level
 * More accurate for materials above 4th grade level
 */
export const calculateSMOGGradeLevel = (text) => {
  if (!text || text.trim().length === 0) return 0;
  
  const sentences = countSentences(text);
  if (sentences < 30) {
    // SMOG requires at least 30 sentences for accuracy
    // Fall back to Flesch-Kincaid for shorter texts
    return calculateFleschKincaidGradeLevel(text);
  }
  
  // Count polysyllabic words (3+ syllables)
  const words = text.split(/\s+/);
  const polysyllabicWords = words.filter(word => countSyllables(word) >= 3).length;
  
  // SMOG formula: 1.0430 × √(polysyllabic words × 30/sentences) + 3.1291
  const smogGrade = 1.0430 * Math.sqrt((polysyllabicWords * 30) / sentences) + 3.1291;
  
  return Math.max(0, Math.round(smogGrade * 10) / 10);
};

/**
 * Calculate Automated Readability Index (ARI)
 * Uses characters instead of syllables
 */
export const calculateARI = (text) => {
  if (!text || text.trim().length === 0) return 0;
  
  const characters = text.replace(/\s/g, '').length;
  const words = countWords(text);
  const sentences = countSentences(text);
  
  if (words === 0 || sentences === 0) return 0;
  
  // ARI formula: 4.71 × (characters/words) + 0.5 × (words/sentences) - 21.43
  const ari = 4.71 * (characters / words) + 0.5 * (words / sentences) - 21.43;
  
  return Math.max(0, Math.round(ari * 10) / 10);
};

/**
 * Enhanced reading level assessment combining multiple algorithms
 * This is the MVP version - will be replaced with ML-based ATOS equivalent
 */
export const calculateEnhancedReadingLevel = (text, bookMetadata = {}) => {
  if (!text || text.trim().length === 0) return null;
  
  const fleschKincaid = calculateFleschKincaidGradeLevel(text);
  const fleschEase = calculateFleschReadingEase(text);
  const smog = calculateSMOGGradeLevel(text);
  const ari = calculateARI(text);
  
  // Weighted average (adjustable based on testing)
  const weights = {
    fleschKincaid: 0.4,
    smog: 0.3,
    ari: 0.3,
  };
  
  const weightedAverage = 
    fleschKincaid * weights.fleschKincaid +
    smog * weights.smog +
    ari * weights.ari;
  
  // Adjust based on book metadata if available
  let adjustment = 0;
  
  if (bookMetadata.genre) {
    // Genre-based adjustments
    const genreAdjustments = {
      'Picture Book': -2,
      'Early Reader': -1,
      'Fantasy': 0.5,
      'Science Fiction': 0.5,
      'Non-fiction': 0.3,
      'Poetry': -0.5,
    };
    adjustment += genreAdjustments[bookMetadata.genre] || 0;
  }
  
  if (bookMetadata.pages) {
    // Length-based adjustments
    if (bookMetadata.pages < 50) adjustment -= 0.5;
    if (bookMetadata.pages > 300) adjustment += 0.5;
  }
  
  const finalLevel = Math.max(0, weightedAverage + adjustment);
  
  return {
    level: Math.round(finalLevel * 10) / 10,
    confidence: 0.75, // MVP confidence - will improve with ML
    components: {
      fleschKincaid,
      fleschEase,
      smog,
      ari,
    },
    interpretation: interpretFleschReadingEase(fleschEase),
  };
};

/**
 * Convert reading level to ATOS-equivalent score
 * This is a rough approximation - needs calibration with actual ATOS data
 */
export const convertToATOSEquivalent = (enhancedLevel) => {
  if (!enhancedLevel) return 0;
  
  // Basic linear conversion (will be replaced with trained model)
  // ATOS typically ranges from 0.5 to 12+
  const atosScore = Math.max(0.5, Math.min(12, enhancedLevel.level * 0.9 + 0.3));
  
  return Math.round(atosScore * 10) / 10;
};

/**
 * Generate Lexile-equivalent measure
 * Rough approximation for MVP
 */
export const generateLexileMeasure = (readingLevel) => {
  if (!readingLevel) return '';
  
  // Basic conversion: Grade Level * 50 + 200 (very rough approximation)
  const lexileScore = Math.round(readingLevel * 50 + 200);
  
  // Add appropriate suffix
  if (lexileScore > 1400) return `${lexileScore}L`;
  if (lexileScore < 200) return `BR${Math.abs(lexileScore - 200)}L`;
  
  return `${lexileScore}L`;
};

/**
 * Main function to assess book reading level
 * This will be called when processing books
 */
export const assessBookReadingLevel = (bookText, bookMetadata = {}) => {
  const enhanced = calculateEnhancedReadingLevel(bookText, bookMetadata);
  
  if (!enhanced) {
    return {
      atos: 0,
      lexile: 'BR100L',
      ai_assessed: 0,
      confidence: 0,
    };
  }
  
  const atosEquivalent = convertToATOSEquivalent(enhanced);
  const lexileMeasure = generateLexileMeasure(enhanced.level);
  
  return {
    atos: atosEquivalent,
    lexile: lexileMeasure,
    ai_assessed: enhanced.level,
    confidence: enhanced.confidence,
    raw_analysis: enhanced.components,
  };
};

/**
 * TODO: Post-MVP Implementation Plan
 * 
 * 1. Data Collection Phase:
 *    - Collect 10,000+ books with known ATOS scores
 *    - Gather Renaissance Learning AR database samples
 *    - Build comprehensive training dataset
 * 
 * 2. Machine Learning Phase:
 *    - Train neural network on book text → ATOS score
 *    - Implement ensemble methods (Random Forest, XGBoost, Neural Net)
 *    - Add contextual features (publication year, genre, series)
 *    - Validate against holdout AR data
 * 
 * 3. Enhancement Phase:
 *    - Add student-specific adjustments
 *    - Implement reading interest correlation
 *    - Build curriculum alignment scoring
 *    - Add real-time adaptation based on student performance
 * 
 * 4. Competitive Advantage:
 *    - Exceed ATOS accuracy with modern AI
 *    - Add features ATOS can't provide (personalization, real-time updates)
 *    - Provide transparent scoring (unlike Renaissance's black box)
 *    - Free vs. $4,800+ AR subscription
 */