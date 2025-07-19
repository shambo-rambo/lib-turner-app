/**
 * LibFlix MVP Main App Component
 * Netflix-style book discovery platform
 */

import React, { useState } from 'react';
import BookFeed from './components/BookFeed';
import './App.css';

/**
 * Header component with LibFlix branding
 */
const Header = () => (
  <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              LibFlix
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your Netflix for Books
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <span>✨ MVP Demo</span>
          </div>
          
          {/* Profile placeholder */}
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">S</span>
          </div>
        </div>
      </div>
    </div>
  </header>
);

/**
 * Demo banner component
 */
const DemoBanner = () => (
  <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
    <div className="max-w-7xl mx-auto px-4 py-3">
      <div className="flex items-center justify-center space-x-2 text-sm">
        <span>🚀</span>
        <span>LibFlix MVP Demo - Transforming School Libraries with AI-Powered Discovery</span>
        <span>📚</span>
      </div>
    </div>
  </div>
);

/**
 * Main App component
 */
function App() {
  const [selectedBook, setSelectedBook] = useState(null);

  // Mock event handlers for demonstration
  const handleBookClick = (book) => {
    console.log('Book clicked:', book.title);
    setSelectedBook(book);
    // In real app: navigate to book detail page
  };

  const handleBookSave = (book) => {
    console.log('Book saved:', book.title);
    // In real app: add to user's saved books
  };

  const handleBookRate = (book, rating) => {
    console.log('Book rated:', book.title, 'Rating:', rating);
    // In real app: submit rating to backend
  };

  const handleBookCheckout = (book) => {
    console.log('Book checkout:', book.title);
    // In real app: initiate checkout process
  };

  const handleBookShare = (book) => {
    console.log('Book shared:', book.title);
    // In real app: open share dialog
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Demo Banner */}
      <DemoBanner />
      
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main>
        <BookFeed
          onBookClick={handleBookClick}
          onBookSave={handleBookSave}
          onBookRate={handleBookRate}
          onBookCheckout={handleBookCheckout}
          onBookShare={handleBookShare}
        />
      </main>

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && selectedBook && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg max-w-sm">
          <h4 className="font-semibold mb-2">Selected Book:</h4>
          <p className="text-sm">{selectedBook.title}</p>
          <p className="text-xs text-gray-300">by {selectedBook.author}</p>
          <button
            onClick={() => setSelectedBook(null)}
            className="mt-2 text-xs text-blue-400 hover:text-blue-300"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

export default App;