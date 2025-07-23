/**
 * Book Loader Service
 * Loads books from Firestore and merges with static data, prioritizing custom covers
 */

import { collection, getDocs, doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { enhancedBooksManager } from '../data/enhancedBooks.js';
import { getEffectiveCoverUrl } from './books.js';

/**
 * Loads all books from Firestore for a specific school
 * @param {string} schoolId - The school ID to filter by
 * @returns {Promise<Array>} Array of book data from Firestore
 */
const loadBooksFromFirestore = async (schoolId = 'default_school') => {
  try {
    const booksRef = collection(db, 'books');
    const snapshot = await getDocs(booksRef);
    
    const firestoreBooks = [];
    snapshot.forEach(doc => {
      const bookData = doc.data();
      // Only include books for the specified school or default school
      if (!bookData.school_id || bookData.school_id === schoolId || bookData.school_id === 'default_school') {
        firestoreBooks.push({
          id: doc.id,
          ...bookData
        });
      }
    });
    
    return firestoreBooks;
  } catch (error) {
    console.warn('Failed to load books from Firestore:', error);
    return [];
  }
};

/**
 * Merges static book data with Firestore data, prioritizing custom covers
 * @param {Array} staticBooks - Books from static data/API
 * @param {Array} firestoreBooks - Books from Firestore
 * @returns {Array} Merged book data with custom covers applied
 */
const mergeBooksWithCustomCovers = (staticBooks, firestoreBooks) => {
  // Create a map of Firestore books by ID for quick lookup
  const firestoreBookMap = new Map();
  firestoreBooks.forEach(book => {
    firestoreBookMap.set(book.id, book);
  });

  // Merge static books with Firestore data
  const mergedBooks = staticBooks.map(staticBook => {
    const firestoreBook = firestoreBookMap.get(staticBook.id);
    
    if (firestoreBook) {
      // If book exists in Firestore, merge the data
      const merged = {
        ...staticBook,
        ...firestoreBook,
        // Preserve important static data while allowing Firestore overrides
        metadata: {
          ...staticBook.metadata,
          ...firestoreBook.metadata,
          // Keep original cover_url from static data as fallback
          cover_url: staticBook.metadata?.cover_url || firestoreBook.metadata?.cover_url
        }
      };
      
      // Remove from map so we don't duplicate later
      firestoreBookMap.delete(staticBook.id);
      
      return merged;
    }
    
    return staticBook;
  });

  // Add any Firestore books that don't exist in static data
  firestoreBookMap.forEach(firestoreBook => {
    mergedBooks.push(firestoreBook);
  });

  return mergedBooks;
};

/**
 * Applies effective cover URLs to books (custom covers take priority)
 * @param {Array} books - Array of book data
 * @returns {Array} Books with effective cover URLs applied
 */
const applyEffectiveCovers = (books) => {
  return books.map(book => ({
    ...book,
    // Add effective cover URL for easy access in components
    effectiveCoverUrl: getEffectiveCoverUrl(book),
    // Also update the display metadata
    metadata: {
      ...book.metadata,
      displayCoverUrl: getEffectiveCoverUrl(book)
    }
  }));
};

/**
 * Main function to load books with custom covers applied
 * @param {string} schoolId - School ID to filter by
 * @returns {Promise<Array>} Complete book data with custom covers
 */
export const loadBooksWithCustomCovers = async (schoolId = 'default_school') => {
  try {
    // Load books from Firestore first
    const firestoreBooks = await loadBooksFromFirestore(schoolId);
    
    // If we have all books in Firestore, use them
    if (firestoreBooks.length > 0) {
      console.log(`📚 Loading ${firestoreBooks.length} books from database`);
      return applyEffectiveCovers(firestoreBooks);
    }
    
    // Otherwise, load from API and save to database
    console.log(`📡 Loading books from API and saving to database...`);
    const staticBooks = await enhancedBooksManager.getEnhancedBooks();
    
    // Save API books to Firestore for future use
    await saveBooksToFirestore(staticBooks, schoolId);
    
    // Apply effective cover URLs
    const booksWithCovers = applyEffectiveCovers(staticBooks);
    
    return booksWithCovers;
  } catch (error) {
    console.error('Error loading books with custom covers:', error);
    
    // Fallback to static books only
    try {
      const staticBooks = await enhancedBooksManager.getEnhancedBooks();
      return applyEffectiveCovers(staticBooks);
    } catch (fallbackError) {
      console.error('Fallback to static books also failed:', fallbackError);
      return [];
    }
  }
};

/**
 * Saves multiple books to Firestore using batch writes
 * @param {Array} books - Array of book data to save
 * @param {string} schoolId - School ID
 * @returns {Promise<void>}
 */
export const saveBooksToFirestore = async (books, schoolId = 'default_school') => {
  try {
    if (!books || books.length === 0) return;
    
    const batch = writeBatch(db);
    const timestamp = new Date();
    
    books.forEach(bookData => {
      const bookWithSchool = {
        ...bookData,
        school_id: schoolId,
        created_at: timestamp,
        updated_at: timestamp,
        // Ensure cover source is marked as API
        metadata: {
          ...bookData.metadata,
          cover_source: bookData.metadata?.cover_source || 'api'
        }
      };
      
      const bookRef = doc(db, 'books', bookData.id);
      batch.set(bookRef, bookWithSchool, { merge: true });
    });
    
    await batch.commit();
    console.log(`💾 Saved ${books.length} books to database for future loads`);
  } catch (error) {
    console.error('Error saving books to Firestore:', error);
    // Don't throw - this is not critical for app functionality
  }
};

/**
 * Saves/updates a single book in Firestore
 * @param {Object} bookData - Book data to save
 * @param {string} schoolId - School ID
 * @returns {Promise<void>}
 */
export const saveBookToFirestore = async (bookData, schoolId = 'default_school') => {
  try {
    const bookWithSchool = {
      ...bookData,
      school_id: schoolId,
      updated_at: new Date()
    };
    
    const bookRef = doc(db, 'books', bookData.id);
    await setDoc(bookRef, bookWithSchool, { merge: true });
    
    console.log('Book saved to Firestore:', bookData.id);
  } catch (error) {
    console.error('Error saving book to Firestore:', error);
    throw error;
  }
};

/**
 * Checks if Firebase is available and configured
 * @returns {boolean} Whether Firebase is available
 */
export const isFirebaseAvailable = () => {
  try {
    return !!db;
  } catch (error) {
    return false;
  }
};