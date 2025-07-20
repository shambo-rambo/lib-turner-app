/**
 * VirtualBookGrid - Netflix-style virtual scrolling for 5000+ books
 * High-performance rendering with intersection observer and intelligent preloading
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { imageCache } from '../utils/imageCache';
import OptimizedBookCard from './OptimizedBookCard';

const VirtualBookGrid = ({ 
  books = [], 
  onBookClick,
  itemHeight = 280,
  itemWidth = 180,
  gap = 16,
  overscan = 3 // Number of extra rows to render outside viewport
}) => {
  const containerRef = useRef(null);
  const scrollRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });

  // Calculate grid dimensions
  const gridMetrics = useMemo(() => {
    if (containerSize.width === 0) return { columns: 0, rows: 0, totalHeight: 0 };
    
    const columns = Math.floor((containerSize.width + gap) / (itemWidth + gap));
    const rows = Math.ceil(books.length / columns);
    const totalHeight = rows * (itemHeight + gap) - gap;
    
    return { columns, rows, totalHeight };
  }, [containerSize.width, books.length, itemWidth, itemHeight, gap]);

  // Calculate visible items based on scroll position
  const visibleItems = useMemo(() => {
    if (gridMetrics.columns === 0) return [];
    
    const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - overscan);
    const endRow = Math.min(
      gridMetrics.rows - 1,
      Math.ceil((scrollTop + containerSize.height) / (itemHeight + gap)) + overscan
    );
    
    const items = [];
    for (let row = startRow; row <= endRow; row++) {
      for (let col = 0; col < gridMetrics.columns; col++) {
        const index = row * gridMetrics.columns + col;
        if (index < books.length) {
          items.push({
            index,
            book: books[index],
            row,
            col,
            x: col * (itemWidth + gap),
            y: row * (itemHeight + gap)
          });
        }
      }
    }
    
    return items;
  }, [books, gridMetrics, scrollTop, containerSize.height, itemHeight, itemWidth, gap, overscan]);

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Handle scroll with throttling
  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setScrollTop(scrollRef.current.scrollTop);
    }
  }, []);

  // Throttled scroll handler
  useEffect(() => {
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', throttledScroll, { passive: true });
      return () => scrollElement.removeEventListener('scroll', throttledScroll);
    }
  }, [handleScroll]);

  // Intelligent preloading - load images just before they come into view
  useEffect(() => {
    if (visibleItems.length === 0) return;

    // Get indices of items that will be visible soon
    const preloadBuffer = overscan + 2;
    const currentStartRow = Math.floor(scrollTop / (itemHeight + gap));
    const preloadStartRow = Math.max(0, currentStartRow - preloadBuffer);
    const preloadEndRow = Math.min(
      gridMetrics.rows - 1,
      currentStartRow + Math.ceil(containerSize.height / (itemHeight + gap)) + preloadBuffer
    );

    const preloadItems = [];
    for (let row = preloadStartRow; row <= preloadEndRow; row++) {
      for (let col = 0; col < gridMetrics.columns; col++) {
        const index = row * gridMetrics.columns + col;
        if (index < books.length) {
          preloadItems.push(books[index]);
        }
      }
    }

    // Preload images with priority based on distance from viewport
    preloadItems.forEach((book, idx) => {
      const urls = [
        book.metadata.cover_url,
        ...(book.metadata.fallback_urls || [])
      ].filter(Boolean);

      // Higher priority for items closer to current viewport
      const priority = idx < 20 ? 'high' : 'normal';
      imageCache.loadImageWithFallbacks(urls, priority);
    });

  }, [visibleItems, scrollTop, gridMetrics, containerSize.height, itemHeight, gap, books, overscan]);

  // Update visible range for external components
  useEffect(() => {
    if (visibleItems.length > 0) {
      const start = visibleItems[0].index;
      const end = visibleItems[visibleItems.length - 1].index;
      setVisibleRange({ start, end });
    }
  }, [visibleItems]);

  if (books.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No books available
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
      style={{ minHeight: '400px' }}
    >
      <div
        ref={scrollRef}
        className="w-full h-full overflow-auto"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#888 transparent'
        }}
      >
        {/* Virtual container with total height */}
        <div
          style={{
            height: gridMetrics.totalHeight,
            position: 'relative',
            width: '100%'
          }}
        >
          {/* Render only visible items */}
          {visibleItems.map(({ index, book, x, y }) => (
            <div
              key={`${book.id}-${index}`}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: itemWidth,
                height: itemHeight,
                transform: 'translateZ(0)', // Force GPU acceleration
                willChange: 'transform'
              }}
            >
              <OptimizedBookCard
                book={book}
                onBookClick={onBookClick}
                isVisible={true}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          className="absolute top-2 right-2 bg-black bg-opacity-75 text-white p-2 rounded text-xs font-mono"
          style={{ zIndex: 1000 }}
        >
          <div>Books: {books.length}</div>
          <div>Visible: {visibleItems.length}</div>
          <div>Range: {visibleRange.start}-{visibleRange.end}</div>
          <div>Columns: {gridMetrics.columns}</div>
          <div>Cache: {imageCache.getStats().cached}</div>
        </div>
      )}
    </div>
  );
};

export default VirtualBookGrid;