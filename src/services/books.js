/**
 * Book Management Service
 * Handles book CRUD operations and cover updates
 */

import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { uploadBookCover, deleteBookCover } from './imageUpload.js';
import { hasPermission } from './auth.js';

/**
 * Updates a book's cover image
 * @param {string} bookId - The book ID to update
 * @param {File} imageFile - The new cover image file
 * @param {string} adminId - The admin user ID performing the update
 * @returns {Promise<string>} The new cover image URL
 */
export const updateBookCover = async (bookId, imageFile, adminId) => {
  try {
    // Check admin permissions
    const canUpload = await hasPermission('upload_covers');
    if (!canUpload) {
      throw new Error('Insufficient permissions to upload covers');
    }
    
    // Get current book data or create new document
    const bookRef = doc(db, 'books', bookId);
    const bookDoc = await getDoc(bookRef);
    
    let bookData = {};
    if (bookDoc.exists()) {
      bookData = bookDoc.data();
    } else {
      // Create basic book structure if it doesn't exist
      bookData = {
        id: bookId,
        metadata: {
          cover_source: 'api'
        },
        created_at: new Date()
      };
    }
    
    // Delete old custom cover if it exists
    if (bookData.metadata?.custom_cover_url) {
      try {
        await deleteBookCover(bookData.metadata.custom_cover_url);
      } catch (error) {
        console.warn('Could not delete old cover:', error);
      }
    }
    
    // Upload new cover
    const newCoverUrl = await uploadBookCover(imageFile, bookId, adminId);
    
    // Update book document
    const updatedBook = {
      ...bookData,
      metadata: {
        ...bookData.metadata,
        custom_cover_url: newCoverUrl,
        cover_source: 'custom'
      },
      updated_at: new Date(),
      updated_by: adminId
    };
    
    await setDoc(bookRef, updatedBook, { merge: true });
    
    return newCoverUrl;
  } catch (error) {
    console.error('Error updating book cover:', error);
    throw new Error(`Cover update failed: ${error.message}`);
  }
};

/**
 * Reverts a book's cover to the original API cover
 * @param {string} bookId - The book ID to revert
 * @param {string} adminId - The admin user ID performing the revert
 * @returns {Promise<void>}
 */
export const revertBookCover = async (bookId, adminId) => {
  try {
    // Check admin permissions
    const canUpload = await hasPermission('upload_covers');
    if (!canUpload) {
      throw new Error('Insufficient permissions to modify covers');
    }
    
    // Get current book data
    const bookRef = doc(db, 'books', bookId);
    const bookDoc = await getDoc(bookRef);
    
    if (!bookDoc.exists()) {
      // If book doesn't exist in Firestore, nothing to revert
      return;
    }
    
    const bookData = bookDoc.data();
    
    // Delete custom cover if it exists
    if (bookData.metadata?.custom_cover_url) {
      try {
        await deleteBookCover(bookData.metadata.custom_cover_url);
      } catch (error) {
        console.warn('Could not delete custom cover:', error);
      }
    }
    
    // Update book document to use API cover
    const updatedBook = {
      ...bookData,
      metadata: {
        ...bookData.metadata,
        custom_cover_url: '',
        cover_source: 'api'
      },
      updated_at: new Date(),
      updated_by: adminId
    };
    
    await setDoc(bookRef, updatedBook, { merge: true });
  } catch (error) {
    console.error('Error reverting book cover:', error);
    throw new Error(`Cover revert failed: ${error.message}`);
  }
};

/**
 * Gets a book by ID
 * @param {string} bookId - The book ID to retrieve
 * @returns {Promise<Object>} Book data
 */
export const getBook = async (bookId) => {
  try {
    const bookDoc = await getDoc(doc(db, 'books', bookId));
    
    if (!bookDoc.exists()) {
      throw new Error('Book not found');
    }
    
    return {
      id: bookDoc.id,
      ...bookDoc.data()
    };
  } catch (error) {
    console.error('Error getting book:', error);
    throw new Error(`Failed to get book: ${error.message}`);
  }
};

/**
 * Gets all books for a school
 * @param {string} schoolId - The school ID
 * @returns {Promise<Array>} Array of book data
 */
export const getBooksBySchool = async (schoolId) => {
  try {
    const booksQuery = query(
      collection(db, 'books'),
      where('school_id', '==', schoolId)
    );
    
    const querySnapshot = await getDocs(booksQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting books by school:', error);
    throw new Error(`Failed to get books: ${error.message}`);
  }
};

/**
 * Gets the effective cover URL for a book (custom or API)
 * @param {Object} book - Book data
 * @returns {string} The cover URL to use
 */
export const getEffectiveCoverUrl = (book) => {
  if (book.metadata?.cover_source === 'custom' && book.metadata?.custom_cover_url) {
    return book.metadata.custom_cover_url;
  }
  return book.metadata?.cover_url || '';
};

/**
 * Searches books by title, author, or ISBN
 * @param {string} searchTerm - The search term
 * @param {string} schoolId - The school ID to filter by
 * @returns {Promise<Array>} Array of matching books
 */
export const searchBooks = async (searchTerm, schoolId) => {
  try {
    // Get all books for the school first
    const books = await getBooksBySchool(schoolId);
    
    // Filter by search term
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return books.filter(book => 
      book.title?.toLowerCase().includes(lowerSearchTerm) ||
      book.author?.toLowerCase().includes(lowerSearchTerm) ||
      book.isbn?.toLowerCase().includes(lowerSearchTerm)
    );
  } catch (error) {
    console.error('Error searching books:', error);
    throw new Error(`Search failed: ${error.message}`);
  }
};