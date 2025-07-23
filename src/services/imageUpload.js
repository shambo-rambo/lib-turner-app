/**
 * Image Upload Service for Book Covers
 * Handles Firebase Storage upload and compression
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase.js';

/**
 * Compresses an image file to reduce size while maintaining quality
 * @param {File} file - The image file to compress
 * @param {number} maxWidth - Maximum width for the compressed image
 * @param {number} quality - Compression quality (0-1)
 * @returns {Promise<Blob>} Compressed image blob
 */
const compressImage = (file, maxWidth = 800, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Validates image file type and size
 * @param {File} file - The file to validate
 * @returns {Object} Validation result with isValid and error message
 */
export const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Please upload a valid image file (JPEG, PNG, or WebP)'
    };
  }
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Image file size must be less than 5MB'
    };
  }
  
  return { isValid: true };
};

/**
 * Uploads a book cover image to Firebase Storage
 * @param {File} file - The image file to upload
 * @param {string} bookId - The book ID for naming the file
 * @param {string} adminId - The admin user ID for audit trail
 * @returns {Promise<string>} Download URL of the uploaded image
 */
export const uploadBookCover = async (file, bookId, adminId) => {
  try {
    // Validate the file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    // Compress the image
    const compressedImage = await compressImage(file);
    
    // Create storage reference
    const timestamp = Date.now();
    const fileName = `book-covers/${bookId}-${timestamp}.jpg`;
    const storageRef = ref(storage, fileName);
    
    // Add metadata
    const metadata = {
      contentType: 'image/jpeg',
      customMetadata: {
        uploadedBy: adminId,
        bookId: bookId,
        uploadedAt: new Date().toISOString()
      }
    };
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, compressedImage, metadata);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading book cover:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

/**
 * Deletes a book cover image from Firebase Storage
 * @param {string} imageUrl - The full URL of the image to delete
 * @returns {Promise<void>}
 */
export const deleteBookCover = async (imageUrl) => {
  try {
    // Extract the file path from the URL
    const url = new URL(imageUrl);
    const pathStart = url.pathname.indexOf('/o/') + 3;
    const pathEnd = url.pathname.indexOf('?');
    const filePath = decodeURIComponent(url.pathname.substring(pathStart, pathEnd));
    
    // Create reference and delete
    const imageRef = ref(storage, filePath);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting book cover:', error);
    throw new Error(`Delete failed: ${error.message}`);
  }
};

/**
 * Gets a preview URL for a file without uploading
 * @param {File} file - The file to preview
 * @returns {string} Object URL for preview
 */
export const getPreviewUrl = (file) => {
  return URL.createObjectURL(file);
};

/**
 * Cleans up preview URLs to prevent memory leaks
 * @param {string} previewUrl - The preview URL to clean up
 */
export const cleanupPreviewUrl = (previewUrl) => {
  URL.revokeObjectURL(previewUrl);
};