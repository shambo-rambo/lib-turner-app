/**
 * LibTurner MVP Main App Component
 * Netflix-style book discovery platform with admin functionality
 */

import React from 'react';
import LibraryApp from './components/LibraryApp';
import './utils/adminSetup.js'; // Auto-loads admin setup in development
import './utils/mockAdmin.js'; // Auto-loads mock admin helpers in development
import './App.css';

/**
 * Main App component - single page with inline admin functionality
 */
function App() {
  return <LibraryApp />;
}

export default App;