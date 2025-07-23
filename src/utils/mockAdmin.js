/**
 * Mock Admin Mode for Testing
 * Bypasses Firebase Authentication for development/testing
 */

// Mock admin user data
const MOCK_ADMIN = {
  uid: 'mock_admin_123',
  email: 'admin@libflix.com',
  name: 'Test Admin',
  school_id: 'default_school',
  user_type: 'admin',
  permissions: {
    manage_books: true,
    manage_students: true,
    view_analytics: true,
    upload_covers: true,
    moderate_reviews: true
  },
  created_at: new Date(),
  updated_at: new Date(),
  last_login: new Date()
};

// Enable mock mode flag
let mockModeEnabled = false;

/**
 * Enable mock admin mode (for development only)
 */
export const enableMockAdminMode = () => {
  mockModeEnabled = true;
  console.log('🔧 Mock Admin Mode ENABLED - Admin functions will work without Firebase Auth');
  
  // Store mock admin in localStorage for persistence
  localStorage.setItem('mockAdmin', JSON.stringify(MOCK_ADMIN));
  
  return MOCK_ADMIN;
};

/**
 * Disable mock admin mode
 */
export const disableMockAdminMode = () => {
  mockModeEnabled = false;
  localStorage.removeItem('mockAdmin');
  console.log('🔒 Mock Admin Mode DISABLED - Firebase Auth required');
};

/**
 * Check if mock mode is enabled
 */
export const isMockModeEnabled = () => {
  return mockModeEnabled || localStorage.getItem('mockAdmin') !== null;
};

/**
 * Get mock admin user
 */
export const getMockAdmin = () => {
  if (!isMockModeEnabled()) return null;
  
  const stored = localStorage.getItem('mockAdmin');
  return stored ? JSON.parse(stored) : MOCK_ADMIN;
};

/**
 * Mock sign in function
 */
export const mockSignIn = (email, password) => {
  if (!isMockModeEnabled()) {
    throw new Error('Mock mode not enabled');
  }
  
  console.log('🔧 Mock sign in for:', email);
  return Promise.resolve(MOCK_ADMIN);
};

// Auto-enable in development if Firebase is not configured
if (import.meta.env.DEV) {
  // Add console helper
  window.enableMockAdmin = enableMockAdminMode;
  window.disableMockAdmin = disableMockAdminMode;
  
  // Auto-enable mock mode in development for easier testing
  enableMockAdminMode();
  
  console.log(`
🔧 Mock Admin Mode AUTO-ENABLED for development!

Mock admin credentials:
Email: admin@libflix.com
Password: any password works in mock mode

To disable mock mode:
disableMockAdmin()

To re-enable:
enableMockAdmin()
  `);
}