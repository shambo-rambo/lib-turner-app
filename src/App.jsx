/**
 * LibFlix MVP Main App Component
 * Netflix-style book discovery platform
 */

import React, { useState } from 'react';
import FastBookCard from './components/FastBookCard';
import { RELIABLE_BOOKS } from './data/reliableBooks';
import './App.css';

/**
 * Header component with LibFlix branding
 */
const Header = () => (
  <header className="header">
    <div className="header-content">
      <div className="logo">
        <div className="logo-icon">L</div>
        <div className="logo-text">
          <h1>LibFlix</h1>
          <p>Your Netflix for Books</p>
        </div>
      </div>
      
      <div className="controls-actions">
        <span style={{ fontSize: '14px', color: '#6b7280' }}>✨ MVP Demo</span>
        <div style={{
          width: '32px',
          height: '32px',
          background: 'linear-gradient(135deg, #10b981, #3b82f6)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          S
        </div>
      </div>
    </div>
  </header>
);

/**
 * Demo banner component
 */
const DemoBanner = () => (
  <div className="demo-banner">
    🚀 LibFlix MVP Demo - Transforming School Libraries with AI-Powered Discovery 📚
  </div>
);

/**
 * Feed controls component
 */
const FeedControls = () => (
  <div className="feed-controls">
    <div className="controls-content">
      <h2 className="controls-title">Discover Books</h2>
      
      <div className="controls-actions">
        <select className="sort-select">
          <option value="popular">Most Popular</option>
          <option value="rating">Highest Rated</option>
          <option value="recent">Recently Added</option>
          <option value="level">Reading Level</option>
        </select>
        <button className="filter-button">Filters</button>
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
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Demo Banner */}
      <DemoBanner />
      
      {/* Header */}
      <Header />
      
      {/* Feed Controls */}
      <FeedControls />
      
      {/* Main Content */}
      <main>
        <div className="books-grid">
          {RELIABLE_BOOKS.map((book, index) => (
            <FastBookCard
              key={book.id}
              book={book}
              onBookClick={handleBookClick}
              style={{ animationDelay: `${index * 50}ms` }}
            />
          ))}
        </div>
      </main>

      {/* Debug info (development only) */}
      {selectedBook && (
        <div style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
          maxWidth: '300px',
          fontSize: '14px'
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontWeight: '600' }}>Selected Book:</h4>
          <p style={{ margin: '0 0 4px 0' }}>{selectedBook.title}</p>
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#d1d5db' }}>by {selectedBook.author}</p>
          <button
            onClick={() => setSelectedBook(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#60a5fa',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

export default App;