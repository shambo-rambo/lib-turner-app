/**
 * FastBookCard Component with Multiple Image Fallbacks
 * Uses Goodreads images (faster CDN) with multiple fallbacks
 */

import React, { useState, useEffect } from 'react';

const FastBookCard = ({ book, onBookClick }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [allImagesFailed, setAllImagesFailed] = useState(false);

  // Create array of all possible image URLs
  const imageUrls = [
    book.metadata.cover_url,
    ...(book.metadata.fallback_urls || []),
    `https://via.placeholder.com/300x450/6366F1/white?text=${encodeURIComponent(book.title.substring(0, 15))}`
  ].filter(Boolean);

  // Calculate average rating
  const avgRating = book.engagement_data.student_ratings.length > 0
    ? book.engagement_data.student_ratings.reduce((a, b) => a + b, 0) / book.engagement_data.student_ratings.length
    : 0;

  const handleClick = () => {
    onBookClick?.(book);
  };

  const handleImageError = () => {
    setImageLoaded(false);
    const nextIndex = currentImageIndex + 1;
    
    if (nextIndex < imageUrls.length) {
      // Try next image
      setCurrentImageIndex(nextIndex);
    } else {
      // All images failed
      setAllImagesFailed(true);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setAllImagesFailed(false);
  };

  // Reset when book changes
  useEffect(() => {
    setCurrentImageIndex(0);
    setImageLoaded(false);
    setAllImagesFailed(false);
  }, [book.id]);

  const currentImageUrl = imageUrls[currentImageIndex];

  return (
    <div className="book-card" onClick={handleClick}>
      <div className="book-cover-container">
        {!allImagesFailed && currentImageUrl && (
          <img
            key={`${book.id}-${currentImageIndex}`}
            src={currentImageUrl}
            alt={`Cover of ${book.title}`}
            className="book-cover"
            onError={handleImageError}
            onLoad={handleImageLoad}
            style={{
              display: imageLoaded ? 'block' : 'none'
            }}
          />
        )}
        
        {(!imageLoaded && !allImagesFailed) && (
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: '#9ca3af',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}>
            Loading...
          </div>
        )}

        {allImagesFailed && (
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '24px',
              marginBottom: '4px'
            }}>
              📚
            </div>
            <div style={{
              fontSize: '8px',
              color: '#6b7280',
              lineHeight: '1.2'
            }}>
              {book.title.substring(0, 30)}...
            </div>
          </div>
        )}

        {/* Reading level badge */}
        <div style={{
          position: 'absolute',
          top: '4px',
          left: '4px',
          backgroundColor: book.readingLevel.atos < 3 ? '#10b981' : 
                          book.readingLevel.atos < 6 ? '#f59e0b' : 
                          book.readingLevel.atos < 9 ? '#f97316' : '#ef4444',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '8px',
          fontWeight: 'bold'
        }}>
          {book.readingLevel.atos.toFixed(1)}
        </div>
      </div>

      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        
        <div className="book-rating">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className={`star ${i < Math.round(avgRating) ? 'filled' : ''}`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className="rating-text">
            {avgRating > 0 ? avgRating.toFixed(1) : 'New'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FastBookCard;