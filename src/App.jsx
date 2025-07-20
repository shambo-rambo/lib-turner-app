/**
 * LibFlix MVP Main App Component
 * Netflix-style book discovery platform
 */

import React, { useState, useEffect } from 'react';
import VirtualBookGrid from './components/VirtualBookGrid';
import PerformanceMonitor from './components/PerformanceMonitor';
import { enhancedBooksManager } from './data/enhancedBooks';
import { imageCache } from './utils/imageCache';
import { testGoogleBooksAPI } from './services/googleBooksAPI';
import { imageDebugger } from './utils/imageDebugger';
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
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [libraryStats, setLibraryStats] = useState(null);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(process.env.NODE_ENV === 'development');
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugTestRunning, setDebugTestRunning] = useState(false);
  const [debugResults, setDebugResults] = useState(null);

  // Load enhanced books on app start
  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true);
        
        // Test Google Books API first
        await testGoogleBooksAPI();
        
        // Get enhanced books
        const enhancedBooks = await enhancedBooksManager.getEnhancedBooks();
        setBooks(enhancedBooks);
        
        // Get library stats
        const stats = await enhancedBooksManager.getLibraryStats();
        setLibraryStats(stats);
        
        // Preload first 12 book covers immediately
        imageCache.preloadVisibleBooks(enhancedBooks, 0, 12);
        
        // Preload remaining covers after a short delay
        setTimeout(() => {
          imageCache.preloadVisibleBooks(enhancedBooks, 12);
        }, 1000);
        
      } catch (error) {
        console.error('Failed to load books:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, []);

  // Mock event handlers for demonstration
  const handleBookClick = (book) => {
    console.log('Book clicked:', book.title);
    setSelectedBook(book);
  };

  // Debug functions
  const runImageDebugTest = async () => {
    if (debugTestRunning || books.length === 0) return;
    
    setDebugTestRunning(true);
    setDebugResults(null);
    
    try {
      console.log('🔍 Starting comprehensive image debug test...');
      const results = await testAllBookImages(books, (processed, total, result) => {
        console.log(`Progress: ${processed}/${total} - ${result.success ? '✅' : '❌'} ${result.url}`);
      });
      
      setDebugResults(results);
      console.log('🎯 Debug test completed!', results);
    } catch (error) {
      console.error('❌ Debug test failed:', error);
    } finally {
      setDebugTestRunning(false);
    }
  };

  const clearDebugData = () => {
    imageDebugger.reset();
    setDebugResults(null);
    console.log('🧹 Debug data cleared');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Demo Banner */}
      <DemoBanner />
      
      {/* API Status Info */}
      {libraryStats && (
        <div style={{
          background: libraryStats.hasApiKey ? '#10b981' : '#f59e0b',
          color: 'white',
          padding: '8px 16px',
          textAlign: 'center',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {libraryStats.hasApiKey ? (
            `✅ Google Books API Active - ${libraryStats.enhancedWithGoogle}/${libraryStats.totalBooks} books enhanced, ${libraryStats.withCovers} with covers`
          ) : (
            '⚠️ Using fallback data - Add VITE_GOOGLE_BOOKS_API_KEY to .env.local for enhanced book data'
          )}
        </div>
      )}
      
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
              itemHeight={280}
              itemWidth={180}
              gap={16}
              overscan={2}
            />
          </div>
        )}
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

      {/* Performance Monitor */}
      <PerformanceMonitor isVisible={showPerformanceMonitor} />
      
      {/* Debug Panel */}
      {showDebugPanel && process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '16px',
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
          fontSize: '12px',
          minWidth: '300px',
          maxWidth: '400px',
          zIndex: 1000,
          border: '1px solid #333'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#60a5fa' }}>
            🔍 Image Debug Panel
          </h3>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              onClick={runImageDebugTest}
              disabled={debugTestRunning || books.length === 0}
              style={{
                background: debugTestRunning ? '#6b7280' : '#10b981',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: debugTestRunning ? 'not-allowed' : 'pointer'
              }}
            >
              {debugTestRunning ? '🔄 Testing...' : '🧪 Test All Images'}
            </button>
            
            <button
              onClick={clearDebugData}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              🧹 Clear Data
            </button>
          </div>

          {debugResults && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
                Test Results:
              </div>
              <div style={{ fontSize: '10px', background: '#1f2937', padding: '8px', borderRadius: '4px' }}>
                <div>✅ Success: {debugResults.report.summary.totalSuccess}</div>
                <div>❌ Failed: {debugResults.report.summary.totalFailed}</div>
                <div>📊 Success Rate: {debugResults.report.summary.successRate}</div>
                {debugResults.report.failures.byDomain.length > 0 && (
                  <div style={{ marginTop: '6px' }}>
                    <div style={{ color: '#f59e0b' }}>Top Failing Domains:</div>
                    {debugResults.report.failures.byDomain.slice(0, 3).map(([domain, count]) => (
                      <div key={domain} style={{ fontSize: '9px', paddingLeft: '8px' }}>
                        • {domain}: {count}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div style={{ 
            marginTop: '12px', 
            fontSize: '10px', 
            color: '#9ca3af',
            lineHeight: '1.4'
          }}>
            📝 Check browser console for detailed reports
          </div>
        </div>
      )}

      {/* Toggle Controls (Development) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          bottom: '16px',
          left: '16px',
          display: 'flex',
          gap: '8px',
          zIndex: 1000
        }}>
          <button
            onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {showPerformanceMonitor ? 'Hide' : 'Show'} Performance
          </button>
          
          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {showDebugPanel ? 'Hide' : 'Show'} Debug
          </button>
        </div>
      )}
    </div>
  );
}

export default App;