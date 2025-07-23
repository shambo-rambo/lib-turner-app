/**
 * LibraryApp Component
 * The main public library interface (original App component functionality)
 */

import React, { useState, useEffect } from 'react';
import VirtualBookGrid from './VirtualBookGrid';
import { loadBooksWithCustomCovers, isFirebaseAvailable } from '../services/bookLoader';
import { imageCache } from '../utils/imageCache';
import { testGoogleBooksAPI } from '../services/googleBooksAPI';

/**
 * Header component with LibTurner branding
 */
const Header = () => (
  <header className="header">
    <div className="header-content">
      <div className="logo">
        <div className="logo-icon">L</div>
        <div className="logo-text">
          <h1>LibTurner</h1>
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
 * Main Library App component
 */
function LibraryApp() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load books with custom covers from database
  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true);
        
        // Test Google Books API first (optional - won't block app loading)
        try {
          await testGoogleBooksAPI();
        } catch (error) {
          console.warn('Google Books API test failed, but app will continue:', error.message);
        }
        
        // Load books with custom covers from Firestore + static data
        const booksWithCovers = await loadBooksWithCustomCovers();
        setBooks(booksWithCovers);
        
        // Preload first 12 book covers immediately (using effective cover URLs)
        const coversToPreload = booksWithCovers.map(book => ({
          ...book,
          cover_url: book.effectiveCoverUrl || book.metadata?.displayCoverUrl || book.metadata?.cover_url
        }));
        
        imageCache.preloadVisibleBooks(coversToPreload, 0, 12);
        
        // Preload remaining covers after a short delay
        setTimeout(() => {
          imageCache.preloadVisibleBooks(coversToPreload, 12);
        }, 1000);
        
      } catch (error) {
        console.error('Failed to load books:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
    
    // Run a test of the Google Books API
    testGoogleBooksAPI();
  }, [refreshKey]); // Re-run when refreshKey changes

  // Add refresh function for external use
  window.refreshLibraryBooks = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Mock event handlers for demonstration
  const handleBookClick = (book) => {
    console.log('Book clicked:', book.title);
  };

  // Handle cover updates from admin interface
  const handleCoverUpdated = async (bookId, newCoverUrl) => {
    console.log('Cover updated for book:', bookId, 'New URL:', newCoverUrl);
    
    // Update the local state immediately for quick feedback
    setBooks(prevBooks =>
      prevBooks.map(book =>
        book.id === bookId
          ? {
              ...book,
              metadata: {
                ...book.metadata,
                custom_cover_url: newCoverUrl,
                cover_source: newCoverUrl ? 'custom' : 'api'
              },
              effectiveCoverUrl: newCoverUrl || book.metadata?.cover_url
            }
          : book
      )
    );

    // Refresh from database after a short delay to ensure consistency
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 1000);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <Header />
      
      {/* Feed Controls */}
      <FeedControls />
      
      {/* Main Content */}
      <main>
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{ color: '#6b7280', fontSize: '14px' }}>
              Loading books with Google Books API...
            </div>
          </div>
        ) : (
          <div style={{ height: 'calc(100vh - 200px)', padding: '0 16px' }}>
            <VirtualBookGrid
              books={books}
              onBookClick={handleBookClick}
              onCoverUpdated={handleCoverUpdated}
              itemHeight={280}
              itemWidth={180}
              gap={16}
              overscan={2}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default LibraryApp;