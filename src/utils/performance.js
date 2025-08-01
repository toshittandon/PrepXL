// Performance monitoring utilities

/**
 * Measure and log component render performance
 */
export const measureRenderTime = (componentName, renderFn) => {
  if (process.env.NODE_ENV === 'development') {
    const startTime = performance.now();
    const result = renderFn();
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    if (renderTime > 16) { // Warn if render takes longer than 16ms (60fps threshold)
      console.warn(`🐌 Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
    
    return result;
  }
  return renderFn();
};

/**
 * Debounce function for performance optimization
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Lazy load a module with error handling
 */
export const lazyLoadModule = (importFn, fallback = null) => {
  return async () => {
    try {
      const module = await importFn();
      return module;
    } catch (error) {
      console.error('Failed to lazy load module:', error);
      if (fallback) {
        return fallback;
      }
      throw error;
    }
  };
};

/**
 * Monitor bundle size in development
 */
export const logBundleInfo = () => {
  if (process.env.NODE_ENV === 'development') {
    // Log performance metrics
    if (window.performance && window.performance.getEntriesByType) {
      const navigationEntries = window.performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0];
        console.group('📊 Performance Metrics');
        console.log(`DOM Content Loaded: ${nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart}ms`);
        console.log(`Page Load Complete: ${nav.loadEventEnd - nav.loadEventStart}ms`);
        console.log(`Total Load Time: ${nav.loadEventEnd - nav.fetchStart}ms`);
        console.groupEnd();
      }
    }

    // Log resource sizes
    if (window.performance && window.performance.getEntriesByType) {
      const resources = window.performance.getEntriesByType('resource');
      const jsResources = resources.filter(r => r.name.includes('.js'));
      const cssResources = resources.filter(r => r.name.includes('.css'));
      
      console.group('📦 Bundle Information');
      console.log(`JavaScript files: ${jsResources.length}`);
      console.log(`CSS files: ${cssResources.length}`);
      
      const totalJSSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
      const totalCSSSize = cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
      
      console.log(`Total JS size: ${(totalJSSize / 1024).toFixed(2)} KB`);
      console.log(`Total CSS size: ${(totalCSSSize / 1024).toFixed(2)} KB`);
      console.groupEnd();
    }
  }
};

/**
 * Memory usage monitoring
 */
export const logMemoryUsage = () => {
  if (process.env.NODE_ENV === 'development' && window.performance && window.performance.memory) {
    const memory = window.performance.memory;
    console.group('🧠 Memory Usage');
    console.log(`Used: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Limit: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`);
    console.groupEnd();
  }
};

/**
 * Component performance profiler HOC
 * Note: Import React in components that use this HOC
 */
export const withPerformanceProfiler = (WrappedComponent, componentName) => {
  if (process.env.NODE_ENV === 'production') {
    return WrappedComponent;
  }

  return function ProfiledComponent(props) {
    // This would need React to be imported in the consuming component
    console.log(`🔍 Rendering ${componentName}`);
    return WrappedComponent(props);
  };
};

/**
 * Bundle size analyzer for development
 */
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    // This would typically be used with a build tool
    console.log('📊 Bundle analysis available in build mode');
    console.log('Run: npm run build:analyze');
  }
};

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  // Log bundle info after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      logBundleInfo();
      logMemoryUsage();
    }, 1000);
  });

  // Monitor memory usage periodically in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      logMemoryUsage();
    }, 30000); // Every 30 seconds
  }
}