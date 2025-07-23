/**
 * Admin User Setup Utility
 * Helper functions for creating initial admin users
 */

import { createAdmin } from '../services/auth.js';
import { generateSampleAdmin } from '../data/schemas.js';

/**
 * Creates a default admin user for development/testing
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @param {string} schoolId - School ID
 * @returns {Promise<Object>} Created admin user
 */
export const createDefaultAdmin = async (email, password, schoolId = 'default_school') => {
  try {
    const adminData = generateSampleAdmin({
      email: email,
      name: 'Admin User',
      school_id: schoolId
    });

    const newAdmin = await createAdmin(adminData, password);
    console.log('Admin user created successfully:', newAdmin.email);
    return newAdmin;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
};

/**
 * Console helper to create admin users
 * Can be run in browser console for quick setup
 */
export const setupAdminConsole = () => {
  window.createAdminUser = async (email, password, schoolId = 'default_school') => {
    try {
      const admin = await createDefaultAdmin(email, password, schoolId);
      console.log('✅ Admin user created:', admin);
      return admin;
    } catch (error) {
      console.error('❌ Failed to create admin user:', error.message);
      throw error;
    }
  };

  console.log(`
🔧 Admin Setup Helper Loaded!

To create an admin user, run:
createAdminUser('admin@example.com', 'your-password', 'school-id')

Example:
createAdminUser('admin@libflix.com', 'admin123', 'cranbrook_senior')
  `);
};

// Auto-setup in development
if (import.meta.env.DEV) {
  setupAdminConsole();
}