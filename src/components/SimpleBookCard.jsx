/**
 * Simplified BookCard Component
 * Uses explicit CSS classes instead of Tailwind for reliability
 */

import React, { useState } from 'react';

const SimpleBookCard = ({ book, onBookClick }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Calculate average rating
  const avgRating = book.engagement_data.student_ratings.length > 0
    ? book.engagement_data.student_ratings.reduce((a, b) => a + b, 0) / book.engagement_data.student_ratings.length
    : 0;

  // Use book cover with fallback
  const coverUrl = book.metadata.cover_url || `https://via.placeholder.com/300x450/6366F1/white?text=${encodeURIComponent(book.title.substring(0, 20))}`;

  const handleClick = () => {
    onBookClick?.(book);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div className="book-card" onClick={handleClick}>
      <div className="book-cover-container">
        <img
          src={coverUrl}
          alt={`Cover of ${book.title}`}
          className="book-cover"
          onError={handleImageError}
          onLoad={handleImageLoad}
          style={{
            display: imageLoaded ? 'block' : 'none'
          }}
        />
        {!imageLoaded && (
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            Loading...
          </div>
        )}
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

export default SimpleBookCard;