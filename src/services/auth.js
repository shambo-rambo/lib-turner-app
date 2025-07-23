/**
 * Authentication Service
 * Handles Firebase Auth and user management
 */

import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase.js';
import { createAdminSchema, validateAdmin } from '../data/schemas.js';
import { isMockModeEnabled, getMockAdmin, mockSignIn } from '../utils/mockAdmin.js';

/**
 * Signs in an admin user with email and password
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @returns {Promise<Object>} User data with admin permissions
 */
export const signInAdmin = async (email, password) => {
  // Check if mock mode is enabled
  if (isMockModeEnabled()) {
    console.log('🔧 Using mock admin mode for sign in');
    return await mockSignIn(email, password);
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get admin data from Firestore
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    
    if (!adminDoc.exists()) {
      throw new Error('Admin account not found');
    }
    
    const adminData = adminDoc.data();
    
    if (adminData.user_type !== 'admin') {
      throw new Error('Insufficient permissions');
    }
    
    // Update last login
    await updateDoc(doc(db, 'admins', user.uid), {
      last_login: new Date(),
      updated_at: new Date()
    });
    
    return {
      uid: user.uid,
      email: user.email,
      ...adminData
    };
  } catch (error) {
    console.error('Admin sign in error:', error);
    throw new Error(`Sign in failed: ${error.message}`);
  }
};

/**
 * Creates a new admin user
 * @param {Object} adminData - Admin user data
 * @param {string} password - Initial password
 * @returns {Promise<Object>} Created admin user data
 */
export const createAdmin = async (adminData, password) => {
  try {
    // Validate admin data
    if (!validateAdmin(adminData)) {
      throw new Error('Invalid admin data');
    }
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, adminData.email, password);
    const user = userCredential.user;
    
    // Create admin document in Firestore
    const adminDoc = {
      ...createAdminSchema(),
      ...adminData,
      id: user.uid,
      created_at: new Date(),
      updated_at: new Date(),
      last_login: new Date()
    };
    
    await setDoc(doc(db, 'admins', user.uid), adminDoc);
    
    return {
      uid: user.uid,
      email: user.email,
      ...adminDoc
    };
  } catch (error) {
    console.error('Admin creation error:', error);
    throw new Error(`Admin creation failed: ${error.message}`);
  }
};

/**
 * Signs out the current user
 * @returns {Promise<void>}
 */
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw new Error(`Sign out failed: ${error.message}`);
  }
};

/**
 * Gets the current authenticated user with admin data
 * @returns {Promise<Object|null>} Current user data or null
 */
export const getCurrentUser = async () => {
  // Check if mock mode is enabled
  if (isMockModeEnabled()) {
    return getMockAdmin();
  }

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      
      if (!user) {
        resolve(null);
        return;
      }
      
      try {
        // Get admin data from Firestore
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        
        if (!adminDoc.exists()) {
          resolve(null);
          return;
        }
        
        const adminData = adminDoc.data();
        
        resolve({
          uid: user.uid,
          email: user.email,
          ...adminData
        });
      } catch (error) {
        console.error('Error getting current user:', error);
        resolve(null);
      }
    });
  });
};

/**
 * Checks if current user has admin permissions
 * @param {string} permission - Specific permission to check
 * @returns {Promise<boolean>} Whether user has the permission
 */
export const hasPermission = async (permission) => {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.user_type !== 'admin') {
      return false;
    }
    
    return user.permissions[permission] === true;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
};

/**
 * Sets up an auth state listener
 * @param {Function} callback - Callback function to handle auth state changes
 * @returns {Function} Unsubscribe function
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
      return;
    }
    
    try {
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      
      if (!adminDoc.exists()) {
        callback(null);
        return;
      }
      
      const adminData = adminDoc.data();
      
      callback({
        uid: user.uid,
        email: user.email,
        ...adminData
      });
    } catch (error) {
      console.error('Auth state change error:', error);
      callback(null);
    }
  });
};