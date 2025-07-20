/**
 * OptimizedBookCard - Netflix-style image loading with caching
 * Implements progressive loading, caching, and instant fallbacks
 */

import React, { useState, useEffect, useRef } from 'react';
import { imageCache } from '../utils/imageCache';

const OptimizedBookCard = ({ book, onBookClick, isVisible = true }) => {
  const [imageState, setImageState] = useState('loading');
  const [cachedImage, setCachedImage] = useState(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const cardRef = useRef(null);

  // Calculate average rating
  const avgRating = book.engagement_data.student_ratings.length > 0
    ? book.engagement_data.student_ratings.reduce((a, b) => a + b, 0) / book.engagement_data.student_ratings.length
    : 0;

  const handleClick = () => {
    onBookClick?.(book);
  };

  // Image sources with fallbacks
  const imageSources = [
    book.metadata.cover_url,
    ...(book.metadata.fallback_urls || [])
  ].filter(Boolean);

  // Intersection observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsIntersecting(entry.isIntersecting);
        });
      },
      {
        rootMargin: '200px', // Increased to 200px for better preloading
        threshold: 0.1
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Create loadImage function outside useEffect so it can be reused
  const loadImage = async () => {
    // Check if ANY of the URLs are already cached
    let cached = null;
    for (const url of imageSources) {
      cached = imageCache.getCachedImage(url);
      if (cached) break;
    }
    
    if (cached) {
      setCachedImage(cached);
      setImageState('loaded');
      console.log(`📦 Using cached image for: ${book.title}`);
      return;
    }

    setImageState('loading');
    console.log(`Loading image for: ${book.title}`);

    // Try to load with enhanced fallbacks - let the system generate optimized URLs
    const result = await imageCache.loadImageWithFallbacks(imageSources, 'high', book);
    if (result) {
      setCachedImage(result);
      setImageState('loaded');
      console.log(`✅ Successfully loaded image for: ${book.title} from ${result.url}`);
    } else {
      setImageState('failed');
      console.log(`❌ Failed to load any image for: ${book.title}`);
    }
  };

  // Load image with caching
  useEffect(() => {
    if (!isVisible || !imageSources.length || (!isIntersecting && imageState === 'loading')) {
      return;
    }

    loadImage();
  }, [book.id, isVisible, isIntersecting]);

  // Generate consistent color for book
  const getBookColor = (title) => {
    const colors = [
      '#1e40af', '#7c2d12', '#166534', '#a16207', 
      '#be185d', '#7c3aed', '#0f766e', '#dc2626'
    ];
    const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const bookColor = getBookColor(book.title);

  return (
    <div 
      ref={cardRef}
      className="book-card" 
      onClick={handleClick}
      style={{
        transform: 'translateZ(0)', // Force GPU acceleration
        willChange: 'transform'
      }}
    >
      <div className="book-cover-container">
        {/* Cached/Loaded Image - FIXED: Removed CORS attributes */}
        {imageState === 'loaded' && cachedImage && (
          <img
            src={cachedImage.url}
            alt={`Cover of ${book.title}`}
            className="book-cover"
            style={{
              display: 'block',
              objectFit: 'cover',
              width: '100%',
              height: '100%'
            }}
            // FIXED: Removed crossOrigin and loading attributes that cause failures
            // crossOrigin="anonymous"  // REMOVED - causes CORS failures
            // loading="lazy"           // REMOVED - causes issues with some browsers
            decoding="async"           // Keep this - helps performance
            onError={(e) => {
              console.warn('Image rendering issue:', e.target.src);
              // Don't immediately set to failed - the image might load on retry
              // Only set to failed if this is a persistent issue
              setTimeout(() => {
                if (imageState === 'loaded') {
                  console.log('Retrying image load due to rendering issue');
                  setImageState('loading');
                  // Trigger a reload
                  loadImage();
                }
              }, 1000);
            }}
          />
        )}

        {/* Loading State with Skeleton */}
        {imageState === 'loading' && (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        )}

        {/* Premium Styled Fallback */}
        {imageState === 'failed' && (
          <div style={{
            width: '100%',
            height: '100%',
            background: `linear-gradient(135deg, ${bookColor}15 0%, ${bookColor}25 50%, ${bookColor}15 100%)`,
            border: `1px solid ${bookColor}30`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background Pattern */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                radial-gradient(circle at 25% 25%, ${bookColor}08 0%, transparent 50%),
                radial-gradient(circle at 75% 75%, ${bookColor}08 0%, transparent 50%),
                linear-gradient(45deg, transparent 40%, ${bookColor}05 50%, transparent 60%)
              `,
              opacity: 0.7
            }} />
            
            {/* Main Content */}
            <div style={{
              position: 'relative',
              zIndex: 1,
              width: '100%'
            }}>
              {/* Book Icon */}
              <div style={{
                fontSize: '32px',
                marginBottom: '12px',
                filter: `hue-rotate(${Math.abs(book.title.charCodeAt(0) * 10)}deg)`
              }}>
                📚
              </div>
              
              {/* Title */}
              <div style={{
                fontSize: '11px',
                fontWeight: '700',
                color: bookColor,
                lineHeight: '1.3',
                marginBottom: '6px',
                textShadow: '0 1px 2px rgba(255,255,255,0.9)',
                wordWrap: 'break-word'
              }}>
                {book.title.length > 30 ? book.title.substring(0, 28) + '...' : book.title}
              </div>
              
              {/* Author */}
              <div style={{
                fontSize: '8px',
                color: `${bookColor}DD`,
                fontWeight: '500',
                marginBottom: '8px',
                textShadow: '0 1px 1px rgba(255,255,255,0.7)'
              }}>
                by {book.author}
              </div>

              {/* Rating Stars */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '2px'
              }}>
                {[...Array(5)].map((_, i) => (
                  <span 
                    key={i}
                    style={{
                      color: i < Math.round(avgRating) ? '#fbbf24' : '#d1d5db',
                      fontSize: '10px'
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            {/* Genre Badge */}
            <div style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              background: bookColor,
              color: 'white',
              padding: '3px 8px',
              borderRadius: '8px',
              fontSize: '7px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              {book.metadata.genres[0]?.substring(0, 8)}
            </div>
          </div>
        )}

        {/* Reading Level Badge */}
        <div style={{
          position: 'absolute',
          top: '6px',
          left: '6px',
          backgroundColor: book.readingLevel.atos < 3 ? '#10b981' : 
                          book.readingLevel.atos < 6 ? '#f59e0b' : 
                          book.readingLevel.atos < 9 ? '#f97316' : '#ef4444',
          color: 'white',
          padding: '3px 8px',
          borderRadius: '6px',
          fontSize: '9px',
          fontWeight: 'bold',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(4px)'
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

// Add required CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

export default OptimizedBookCard;