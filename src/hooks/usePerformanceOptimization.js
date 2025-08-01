import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { debounce, throttle } from '../utils/performance';

/**
 * Hook for performance-optimized search/filter functionality
 */
export const useOptimizedSearch = (items, searchFields, delay = 300) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);

  const debouncedSearch = useCallback(
    debounce((term) => {
      if (!term.trim()) {
        setFilteredItems(items);
        return;
      }

      const filtered = items.filter(item => {
        return searchFields.some(field => {
          const value = field.split('.').reduce((obj, key) => obj?.[key], item);
          return value?.toString().toLowerCase().includes(term.toLowerCase());
        });
      });

      setFilteredItems(filtered);
    }, delay),
    [items, searchFields, delay]
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  useEffect(() => {
    setFilteredItems(items);
  }, [items]);

  return {
    searchTerm,
    setSearchTerm,
    filteredItems,
    isSearching: searchTerm.trim().length > 0
  };
};

/**
 * Hook for intersection observer (lazy loading)
 */
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [element, setElement] = useState(null);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element, options]);

  return [setElement, isIntersecting];
};

/**
 * Hook for optimized scroll handling
 */
export const useOptimizedScroll = (callback, deps = []) => {
  const callbackRef = useRef(callback);
  const frameRef = useRef();

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleScroll = () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      
      frameRef.current = requestAnimationFrame(() => {
        callbackRef.current();
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, deps);
};

/**
 * Hook for throttled resize handling
 */
export const useThrottledResize = (callback, delay = 100) => {
  const throttledCallback = useCallback(
    throttle(callback, delay),
    [callback, delay]
  );

  useEffect(() => {
    window.addEventListener('resize', throttledCallback);
    return () => window.removeEventListener('resize', throttledCallback);
  }, [throttledCallback]);
};

/**
 * Hook for memoized expensive calculations
 */
export const useMemoizedCalculation = (calculateFn, dependencies) => {
  return useMemo(() => {
    const startTime = performance.now();
    const result = calculateFn();
    const endTime = performance.now();
    
    if (process.env.NODE_ENV === 'development' && endTime - startTime > 5) {
      console.warn(`🐌 Expensive calculation took ${(endTime - startTime).toFixed(2)}ms`);
    }
    
    return result;
  }, dependencies);
};

/**
 * Hook for virtual scrolling (for large lists)
 */
export const useVirtualScroll = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    visibleItems,
    handleScroll,
    totalHeight: visibleItems.totalHeight
  };
};

/**
 * Hook for performance monitoring
 */
export const usePerformanceMonitor = (componentName) => {
  const renderCount = useRef(0);
  const mountTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    
    if (process.env.NODE_ENV === 'development') {
      const currentTime = performance.now();
      const timeSinceMount = currentTime - mountTime.current;
      
      console.log(`🔍 ${componentName} - Render #${renderCount.current} (${timeSinceMount.toFixed(2)}ms since mount)`);
    }
  });

  useEffect(() => {
    return () => {
      if (process.env.NODE_ENV === 'development') {
        const totalTime = performance.now() - mountTime.current;
        console.log(`🏁 ${componentName} unmounted after ${totalTime.toFixed(2)}ms (${renderCount.current} renders)`);
      }
    };
  }, [componentName]);

  return {
    renderCount: renderCount.current,
    timeSinceMount: performance.now() - mountTime.current
  };
};

/**
 * Hook for image lazy loading
 */
export const useImageLazyLoad = (src, options = {}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [ref, isIntersecting] = useIntersectionObserver(options);

  useEffect(() => {
    if (isIntersecting && src && !imageSrc) {
      setImageSrc(src);
    }
  }, [isIntersecting, src, imageSrc]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setIsError(false);
  }, []);

  const handleError = useCallback(() => {
    setIsError(true);
    setIsLoaded(false);
  }, []);

  return {
    ref,
    imageSrc,
    isLoaded,
    isError,
    handleLoad,
    handleError
  };
};