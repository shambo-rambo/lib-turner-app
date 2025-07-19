/**
 * BookFeed Component
 * Netflix-style infinite scroll feed with responsive grid
 * Features lazy loading, performance optimization, and engaging animations
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import BookCard from './BookCard';
import { REAL_BOOKS_DATA } from '../data/realBooks';

/**
 * Custom hook for infinite scroll
 */
const useInfiniteScroll = (callback, hasMore) => {
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!isFetching) return;
    fetchMoreData();
  }, [isFetching]);

  const fetchMoreData = useCallback(async () => {
    await callback();
    setIsFetching(false);
  }, [callback]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || isFetching || !hasMore) {
        return;
      }
      setIsFetching(true);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isFetching, hasMore]);

  return [isFetching, setIsFetching];
};

/**
 * Custom hook for intersection observer (alternative to scroll-based loading)
 */
const useIntersectionObserver = (callback, threshold = 0.1) => {
  const targetRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callback();
        }
      },
      { threshold }
    );

    const currentTarget = targetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [callback, threshold]);

  return targetRef;
};

/**
 * Loading skeleton component
 */
const BookCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md animate-pulse">
    <div className="aspect-[2/3] bg-gray-300 dark:bg-gray-700" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
      <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
      <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/4" />
    </div>
  </div>
);

/**
 * Empty state component
 */
const EmptyState = ({ message = "No books found", subtitle }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
      <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{message}</h3>
    {subtitle && (
      <p className="text-gray-500 dark:text-gray-400 max-w-md">{subtitle}</p>
    )}
  </div>
);

/**
 * Filter/Sort controls component
 */
const FeedControls = ({ 
  sortBy, 
  setSortBy, 
  filterGenre, 
  setFilterGenre, 
  availableGenres,
  showFilters,
  toggleFilters 
}) => (
  <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
    <div className="max-w-7xl mx-auto px-4 py-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Discover Books
        </h2>
        
        <div className="flex items-center gap-3">
          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm"
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="recent">Recently Added</option>
            <option value="level">Reading Level</option>
          </select>

          {/* Filter button */}
          <button
            onClick={toggleFilters}
            className="px-3 py-1 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600 transition-colors"
          >
            Filters
          </button>
        </div>
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterGenre('')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filterGenre === '' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All Genres
            </button>
            {availableGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => setFilterGenre(genre)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filterGenre === genre 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

/**
 * Main BookFeed component
 */
const BookFeed = ({
  initialBooks = [],
  onBookClick,
  onBookSave,
  onBookRate,
  onBookCheckout,
  onBookShare,
  className = ''
}) => {
  // State management
  const [books, setBooks] = useState(initialBooks);
  const [displayedBooks, setDisplayedBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  
  // Filter and sort state
  const [sortBy, setSortBy] = useState('popular');
  const [filterGenre, setFilterGenre] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // User interaction state
  const [savedBooks, setSavedBooks] = useState(new Set());
  const [userRatings, setUserRatings] = useState(new Map());

  // Performance: Items per load
  const ITEMS_PER_LOAD = 12;

  // Load initial data
  useEffect(() => {
    const loadInitialData = () => {
      if (books.length === 0) {
        setLoading(true);
        try {
          // Use real books data immediately
          setBooks(REAL_BOOKS_DATA);
          setDisplayedBooks(REAL_BOOKS_DATA.slice(0, ITEMS_PER_LOAD));
        } catch (err) {
          setError('Failed to load books. Please try again.');
          console.error('Error loading books:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setDisplayedBooks(books.slice(0, ITEMS_PER_LOAD));
      }
    };

    loadInitialData();
  }, [books]);

  // Get available genres for filtering
  const availableGenres = useMemo(() => {
    const genres = new Set();
    books.forEach(book => {
      book.metadata.genres.forEach(genre => genres.add(genre));
    });
    return Array.from(genres).sort();
  }, [books]);

  // Filter and sort books
  const filteredAndSortedBooks = useMemo(() => {
    let filtered = books;

    // Apply genre filter
    if (filterGenre) {
      filtered = filtered.filter(book => 
        book.metadata.genres.includes(filterGenre)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          const avgA = a.engagement_data.student_ratings.reduce((sum, r) => sum + r, 0) / a.engagement_data.student_ratings.length || 0;
          const avgB = b.engagement_data.student_ratings.reduce((sum, r) => sum + r, 0) / b.engagement_data.student_ratings.length || 0;
          return avgB - avgA;
        case 'recent':
          return new Date(b.metadata.publication_date) - new Date(a.metadata.publication_date);
        case 'level':
          return a.readingLevel.atos - b.readingLevel.atos;
        case 'popular':
        default:
          return b.engagement_data.total_checkouts - a.engagement_data.total_checkouts;
      }
    });

    return sorted;
  }, [books, filterGenre, sortBy]);

  // Update displayed books when filters change
  useEffect(() => {
    setDisplayedBooks(filteredAndSortedBooks.slice(0, ITEMS_PER_LOAD));
    setHasMore(filteredAndSortedBooks.length > ITEMS_PER_LOAD);
  }, [filteredAndSortedBooks]);

  // Infinite scroll callback
  const loadMoreBooks = useCallback(() => {
    const currentLength = displayedBooks.length;
    const nextBatch = filteredAndSortedBooks.slice(currentLength, currentLength + ITEMS_PER_LOAD);
    
    if (nextBatch.length > 0) {
      setDisplayedBooks(prev => [...prev, ...nextBatch]);
      setHasMore(currentLength + nextBatch.length < filteredAndSortedBooks.length);
    } else {
      setHasMore(false);
    }
  }, [displayedBooks.length, filteredAndSortedBooks]);

  // Setup infinite scroll
  const [isFetching] = useInfiniteScroll(loadMoreBooks, hasMore);
  const loadMoreRef = useIntersectionObserver(loadMoreBooks);

  // Generate AI comments for books (mock implementation)
  const generateAIComment = useCallback((book) => {
    const comments = [
      `You loved fantasy books before - this one has even cooler magic systems! ✨`,
      `Perfect reading level for you! Other students your age rated this 5 stars ⭐`,
      `This author writes amazing characters you'll relate to 📚`,
      `Short and exciting - perfect for a weekend read! 🚀`,
      `Part of a series - you'll want to read them all! 📖`,
    ];
    return comments[Math.floor(Math.random() * comments.length)];
  }, []);

  // Event handlers
  const handleBookClick = useCallback((book) => {
    onBookClick?.(book);
  }, [onBookClick]);

  const handleBookSave = useCallback((book) => {
    setSavedBooks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(book.id)) {
        newSet.delete(book.id);
      } else {
        newSet.add(book.id);
      }
      return newSet;
    });
    onBookSave?.(book);
  }, [onBookSave]);

  const handleBookRate = useCallback((book) => {
    // Mock rating - in real app would show rating dialog
    const rating = Math.floor(Math.random() * 5) + 1;
    setUserRatings(prev => new Map(prev).set(book.id, rating));
    onBookRate?.(book, rating);
  }, [onBookRate]);

  const handleBookCheckout = useCallback((book) => {
    onBookCheckout?.(book);
  }, [onBookCheckout]);

  const handleBookShare = useCallback((book) => {
    onBookShare?.(book);
  }, [onBookShare]);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Feed Controls */}
      <FeedControls
        sortBy={sortBy}
        setSortBy={setSortBy}
        filterGenre={filterGenre}
        setFilterGenre={setFilterGenre}
        availableGenres={availableGenres}
        showFilters={showFilters}
        toggleFilters={() => setShowFilters(!showFilters)}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          /* Loading state */
          <div className="books-grid">
            {[...Array(12)].map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : displayedBooks.length === 0 ? (
          /* Empty state */
          <EmptyState 
            message="No books found" 
            subtitle="Try adjusting your filters or search terms"
          />
        ) : (
          /* Books grid */
          <div className="books-grid">
            {displayedBooks.map((book, index) => (
              <BookCard
                key={book.id}
                book={book}
                onBookClick={handleBookClick}
                onSave={handleBookSave}
                onRate={handleBookRate}
                onCheckout={handleBookCheckout}
                onShare={handleBookShare}
                isSaved={savedBooks.has(book.id)}
                userRating={userRatings.get(book.id) || 0}
                aiComment={generateAIComment(book)}
                className="animate-fadeIn"
                style={{ animationDelay: `${(index % ITEMS_PER_LOAD) * 50}ms` }}
              />
            ))}
          </div>
        )}

        {/* Load more trigger */}
        {hasMore && !loading && (
          <div 
            ref={loadMoreRef}
            className="flex justify-center items-center py-8"
          >
            {isFetching ? (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading more books...</span>
              </div>
            ) : (
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                Scroll to load more
              </div>
            )}
          </div>
        )}

        {/* End indicator */}
        {!hasMore && displayedBooks.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              You've seen all {displayedBooks.length} books! 🎉
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookFeed;