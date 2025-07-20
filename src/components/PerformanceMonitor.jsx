/**
 * PerformanceMonitor - Real-time performance tracking for LibFlix
 * Monitors image loading, rendering performance, and memory usage
 */

import React, { useState, useEffect, useRef } from 'react';
import { imageCache } from '../utils/imageCache';
import { reliableImageSources } from '../utils/reliableImageSources';

const PerformanceMonitor = ({ isVisible = false }) => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    imagesLoaded: 0,
    imagesFailed: 0,
    imagesLoading: 0,
    memoryUsage: 0,
    fps: 0,
    scrollPerformance: 'Good',
    corsErrors: 0,
    networkErrors: 0,
    timeoutErrors: 0,
    topFailingDomain: 'None'
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const renderStartRef = useRef(performance.now());

  // Monitor FPS
  useEffect(() => {
    let animationId;
    
    const measureFPS = () => {
      frameCountRef.current++;
      const now = performance.now();
      
      if (now - lastTimeRef.current >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
        
        setMetrics(prev => ({
          ...prev,
          fps,
          scrollPerformance: fps >= 55 ? 'Excellent' : fps >= 45 ? 'Good' : fps >= 30 ? 'Fair' : 'Poor'
        }));
        
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };
    
    if (isVisible) {
      animationId = requestAnimationFrame(measureFPS);
    }
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isVisible]);

  // Monitor image cache and memory
  useEffect(() => {
    const interval = setInterval(() => {
      const cacheStats = imageCache.getStats();
      const debugReport = imageDebugger.generateReport();
      
      // Estimate memory usage (rough calculation)
      const estimatedMemory = cacheStats.cached * 0.5; // ~0.5MB per cached image
      
      // Get top failing domain
      const topFailingDomain = debugReport.failures.byDomain.length > 0 
        ? debugReport.failures.byDomain[0][0] 
        : 'None';
      
      setMetrics(prev => ({
        ...prev,
        imagesLoaded: cacheStats.cached,
        imagesFailed: cacheStats.failed,
        imagesLoading: cacheStats.loading,
        memoryUsage: estimatedMemory,
        renderTime: performance.now() - renderStartRef.current,
        corsErrors: debugReport.failures.corsErrors.length,
        networkErrors: debugReport.failures.networkErrors.length,
        timeoutErrors: debugReport.failures.byError.find(([error]) => error === 'Timeout')?.[1] || 0,
        topFailingDomain
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Track render performance
  useEffect(() => {
    renderStartRef.current = performance.now();
  });

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '16px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '16px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      minWidth: '200px',
      zIndex: 1000,
      border: '1px solid #333'
    }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#60a5fa' }}>
        Performance Monitor
      </h3>
      
      <div style={{ display: 'grid', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>FPS:</span>
          <span style={{ 
            color: metrics.fps >= 55 ? '#10b981' : metrics.fps >= 30 ? '#f59e0b' : '#ef4444'
          }}>
            {metrics.fps}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Performance:</span>
          <span style={{ 
            color: metrics.scrollPerformance === 'Excellent' ? '#10b981' : 
                  metrics.scrollPerformance === 'Good' ? '#3b82f6' :
                  metrics.scrollPerformance === 'Fair' ? '#f59e0b' : '#ef4444'
          }}>
            {metrics.scrollPerformance}
          </span>
        </div>
        
        <div style={{ height: '1px', background: '#333', margin: '6px 0' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Images Cached:</span>
          <span style={{ color: '#10b981' }}>{metrics.imagesLoaded}</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Loading:</span>
          <span style={{ color: '#f59e0b' }}>{metrics.imagesLoading}</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Failed:</span>
          <span style={{ color: '#ef4444' }}>{metrics.imagesFailed}</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>CORS Errors:</span>
          <span style={{ color: '#f97316' }}>{metrics.corsErrors}</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Timeouts:</span>
          <span style={{ color: '#dc2626' }}>{metrics.timeoutErrors}</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Top Failing:</span>
          <span style={{ 
            color: '#ef4444', 
            fontSize: '10px',
            maxWidth: '80px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {metrics.topFailingDomain}
          </span>
        </div>
        
        <div style={{ height: '1px', background: '#333', margin: '6px 0' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Memory Est:</span>
          <span>{metrics.memoryUsage.toFixed(1)}MB</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Render Time:</span>
          <span>{metrics.renderTime.toFixed(0)}ms</span>
        </div>
      </div>
      
      <div style={{ 
        marginTop: '12px', 
        padding: '8px', 
        background: '#1f2937', 
        borderRadius: '4px',
        fontSize: '10px'
      }}>
        <div style={{ color: '#9ca3af', marginBottom: '4px' }}>Optimizations Active:</div>
        <div>✅ Virtual Scrolling</div>
        <div>✅ Intersection Observer</div>
        <div>✅ Reliable Image Sources</div>
        <div>✅ URL Prioritization</div>
        <div>✅ Smart Fallbacks</div>
        <div>✅ GPU Acceleration</div>
      </div>
      
      <button
        onClick={() => {
          imageCache.resetFailedUrls();
          console.log('Reset failed URLs - retrying image loads');
        }}
        style={{
          marginTop: '8px',
          width: '100%',
          padding: '6px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '10px',
          cursor: 'pointer'
        }}
      >
        Retry Failed Images
      </button>
    </div>
  );
};

export default PerformanceMonitor;