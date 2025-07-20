/**
 * ReliableBookCard - Book card with guaranteed display
 * Uses high-quality styled placeholders when images fail
 */

import React, { useState, useEffect } from 'react';

const ReliableBookCard = ({ book, onBookClick }) => {
  const [imageStatus, setImageStatus] = useState('loading');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // All possible image sources
  const imageSources = [
    book.metadata.cover_url,
    ...(book.metadata.fallback_urls || [])
  ].filter(Boolean);

  // Calculate average rating
  const avgRating = book.engagement_data.student_ratings.length > 0
    ? book.engagement_data.student_ratings.reduce((a, b) => a + b, 0) / book.engagement_data.student_ratings.length
    : 0;

  const handleClick = () => {
    onBookClick?.(book);
  };

  const handleImageLoad = () => {
    setImageStatus('loaded');
  };

  const handleImageError = () => {
    const nextIndex = currentImageIndex + 1;
    if (nextIndex < imageSources.length) {
      setCurrentImageIndex(nextIndex);
    } else {
      setImageStatus('failed');
    }
  };

  // Reset when book changes
  useEffect(() => {
    setCurrentImageIndex(0);
    setImageStatus('loading');
  }, [book.id]);

  // Generate a color based on book title for consistent styling
  const getBookColor = (title) => {
    const colors = [
      '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', 
      '#EF4444', '#8B5A2B', '#6366F1', '#EC4899',
      '#14B8A6', '#F97316', '#84CC16', '#6B7280'
    ];
    const index = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const bookColor = getBookColor(book.title);

  return (
    <div className="book-card" onClick={handleClick}>
      <div className="book-cover-container">
        {/* Try to load actual image */}
        {imageStatus !== 'failed' && imageSources[currentImageIndex] && (
          <img
            key={`${book.id}-${currentImageIndex}`}
            src={imageSources[currentImageIndex]}
            alt={`Cover of ${book.title}`}
            className="book-cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              display: imageStatus === 'loaded' ? 'block' : 'none'
            }}
          />
        )}

        {/* Loading state */}
        {imageStatus === 'loading' && (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: '#9ca3af'
          }}>
            <div style={{
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}>
              Loading...
            </div>
          </div>
        )}

        {/* High-quality styled placeholder when all images fail */}
        {imageStatus === 'failed' && (
          <div style={{
            width: '100%',
            height: '100%',
            background: `linear-gradient(135deg, ${bookColor}20 0%, ${bookColor}40 100%)`,
            border: `2px solid ${bookColor}30`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative background pattern */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `radial-gradient(circle at 20% 30%, ${bookColor}15 0%, transparent 50%), radial-gradient(circle at 80% 70%, ${bookColor}10 0%, transparent 50%)`,
              opacity: 0.6
            }} />
            
            {/* Book icon */}
            <div style={{
              fontSize: '24px',
              marginBottom: '8px',
              color: bookColor,
              zIndex: 1
            }}>
              📖
            </div>
            
            {/* Title */}
            <div style={{
              fontSize: '9px',
              fontWeight: '600',
              color: bookColor,
              lineHeight: '1.2',
              marginBottom: '4px',
              zIndex: 1,
              textShadow: '0 1px 2px rgba(255,255,255,0.8)'
            }}>
              {book.title.length > 35 ? book.title.substring(0, 32) + '...' : book.title}
            </div>
            
            {/* Author */}
            <div style={{
              fontSize: '7px',
              color: `${bookColor}CC`,
              fontWeight: '500',
              zIndex: 1,
              textShadow: '0 1px 2px rgba(255,255,255,0.6)'
            }}>
              {book.author}
            </div>

            {/* Genre badge */}
            <div style={{
              position: 'absolute',
              bottom: '6px',
              right: '6px',
              background: bookColor,
              color: 'white',
              padding: '2px 6px',
              borderRadius: '6px',
              fontSize: '6px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {book.metadata.genres[0]}
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
          fontWeight: 'bold',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
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

export default ReliableBookCard;