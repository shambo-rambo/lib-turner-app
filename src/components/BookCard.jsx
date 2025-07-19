/**
 * BookCard Component
 * Netflix-style book card with TikTok-style quick actions
 * Features 2:3 aspect ratio, hover effects, and genre themes
 */

import React, { useState } from 'react';
import * as Avatar from '@radix-ui/react-avatar';
import { 
  HeartIcon, 
  StarIcon, 
  BookOpenIcon, 
  ShareIcon,
  PlayIcon 
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartSolid, 
  StarIcon as StarSolid 
} from '@heroicons/react/24/solid';

/**
 * Genre theme configurations for visual appeal
 */
const GENRE_THEMES = {
  Fantasy: {
    gradient: 'from-purple-500/20 to-pink-500/20',
    accent: 'text-purple-400',
    border: 'border-purple-400/30',
    glow: 'shadow-purple-500/25',
  },
  'Science Fiction': {
    gradient: 'from-cyan-500/20 to-blue-500/20',
    accent: 'text-cyan-400',
    border: 'border-cyan-400/30',
    glow: 'shadow-cyan-500/25',
  },
  Mystery: {
    gradient: 'from-gray-600/20 to-gray-800/20',
    accent: 'text-gray-300',
    border: 'border-gray-400/30',
    glow: 'shadow-gray-500/25',
  },
  Romance: {
    gradient: 'from-rose-500/20 to-pink-500/20',
    accent: 'text-rose-400',
    border: 'border-rose-400/30',
    glow: 'shadow-rose-500/25',
  },
  Adventure: {
    gradient: 'from-orange-500/20 to-red-500/20',
    accent: 'text-orange-400',
    border: 'border-orange-400/30',
    glow: 'shadow-orange-500/25',
  },
  default: {
    gradient: 'from-blue-500/20 to-indigo-500/20',
    accent: 'text-blue-400',
    border: 'border-blue-400/30',
    glow: 'shadow-blue-500/25',
  },
};

/**
 * Quick action button component
 */
const QuickActionButton = ({ icon: Icon, label, onClick, active = false, count }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick?.();
    }}
    className={`
      flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
      transition-all duration-200 backdrop-blur-sm
      ${active 
        ? 'bg-white/90 text-gray-800 shadow-lg' 
        : 'bg-black/40 text-white/90 hover:bg-black/60'
      }
    `}
    title={label}
  >
    <Icon className="w-3 h-3" />
    {count !== undefined && <span>{count}</span>}
  </button>
);

/**
 * Reading level badge component
 */
const ReadingLevelBadge = ({ level, confidence }) => {
  const levelColor = level < 3 ? 'bg-green-500' : 
                    level < 6 ? 'bg-yellow-500' : 
                    level < 9 ? 'bg-orange-500' : 'bg-red-500';
  
  return (
    <div className={`
      absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-bold text-white
      ${levelColor} backdrop-blur-sm shadow-lg
    `}>
      {level.toFixed(1)}
    </div>
  );
};

/**
 * AI Comment bubble component
 */
const AIComment = ({ comment, visible }) => (
  <div className={`
    absolute bottom-16 left-2 right-2 p-3 rounded-lg
    bg-gradient-to-r from-violet-600/90 to-purple-600/90 
    backdrop-blur-sm text-white text-sm shadow-xl
    transform transition-all duration-300 ease-out
    ${visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
  `}>
    <div className="flex items-start gap-2">
      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
        <PlayIcon className="w-3 h-3" />
      </div>
      <p className="text-xs leading-relaxed">{comment}</p>
    </div>
    <div className="absolute -bottom-1 left-4 w-2 h-2 bg-violet-600 rotate-45" />
  </div>
);

/**
 * Main BookCard component
 */
const BookCard = ({ 
  book, 
  onBookClick, 
  onSave, 
  onRate, 
  onCheckout, 
  onShare,
  isSaved = false,
  userRating = 0,
  aiComment,
  className = '' 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get theme for primary genre
  const primaryGenre = book.metadata.genres[0] || 'default';
  const theme = GENRE_THEMES[primaryGenre] || GENRE_THEMES.default;

  // Calculate average rating
  const avgRating = book.engagement_data.student_ratings.length > 0
    ? book.engagement_data.student_ratings.reduce((a, b) => a + b, 0) / book.engagement_data.student_ratings.length
    : 0;

  // Generate fallback cover URL with better quality
  const fallbackUrl = book.metadata.cover_url 
    ? book.metadata.cover_url.replace('http://', 'https://').replace('zoom=1', 'zoom=2')
    : `https://via.placeholder.com/300x450/${primaryGenre === 'Fantasy' ? '7C3AED' : '3B82F6'}/white?text=${encodeURIComponent(book.title.substring(0, 20))}`;
  
  const coverUrl = imageError ? `https://via.placeholder.com/300x450/6366F1/white?text=${encodeURIComponent(book.title.substring(0, 15))}` : fallbackUrl;

  const handleBookClick = () => {
    onBookClick?.(book);
  };

  return (
    <div 
      className={`
        group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden
        shadow-md hover:shadow-2xl ${theme.glow}
        transform transition-all duration-300 ease-out cursor-pointer
        hover:scale-105 hover:-translate-y-2
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleBookClick}
    >
      {/* Book Cover Container */}
      <div className="relative aspect-[2/3] overflow-hidden">
        {/* Cover Image */}
        <img
          src={coverUrl}
          alt={`Cover of ${book.title}`}
          className={`
            w-full h-full object-cover transition-all duration-500
            ${imageLoaded ? 'opacity-100' : 'opacity-0'}
            group-hover:scale-110
          `}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          loading="lazy"
        />
        
        {/* Loading placeholder */}
        {!imageLoaded && (
          <div className={`
            absolute inset-0 bg-gradient-to-br ${theme.gradient}
            flex items-center justify-center
          `}>
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className={`
          absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent
          opacity-0 group-hover:opacity-100 transition-opacity duration-300
        `} />

        {/* Reading Level Badge */}
        <ReadingLevelBadge 
          level={book.readingLevel.atos} 
          confidence={book.readingLevel.confidence} 
        />

        {/* Availability indicator */}
        {book.availability.checkout_status !== 'available' && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-md">
            {book.availability.checkout_status === 'checked_out' ? 'Checked Out' : 'Reserved'}
          </div>
        )}

        {/* Quick Actions - TikTok style */}
        <div className={`
          absolute bottom-4 right-3 flex flex-col gap-2
          transform transition-all duration-300 ease-out
          ${isHovered ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}
        `}>
          <QuickActionButton
            icon={isSaved ? HeartSolid : HeartIcon}
            label="Save"
            onClick={() => onSave?.(book)}
            active={isSaved}
          />
          <QuickActionButton
            icon={userRating > 0 ? StarSolid : StarIcon}
            label="Rate"
            onClick={() => onRate?.(book)}
            active={userRating > 0}
            count={userRating > 0 ? userRating : undefined}
          />
          <QuickActionButton
            icon={BookOpenIcon}
            label="Read"
            onClick={() => onCheckout?.(book)}
          />
          <QuickActionButton
            icon={ShareIcon}
            label="Share"
            onClick={() => onShare?.(book)}
          />
        </div>

        {/* AI Comment */}
        {aiComment && (
          <AIComment comment={aiComment} visible={isHovered} />
        )}
      </div>

      {/* Book Info - Netflix style compact */}
      <div className="p-2 space-y-1">
        {/* Title */}
        <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 text-xs leading-tight">
          {book.title}
        </h3>

        {/* Author */}
        <p className="text-gray-500 dark:text-gray-400 text-xs truncate">
          {book.author}
        </p>

        {/* Rating only */}
        <div className="flex items-center gap-1">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                className={`w-2.5 h-2.5 ${
                  i < Math.round(avgRating) 
                    ? 'text-yellow-400 fill-current' 
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">
            {avgRating > 0 ? avgRating.toFixed(1) : 'New'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BookCard;