// Performance monitoring utilities

// Bundle size tracking
export const trackBundleSize = () => {
  if (typeof window !== 'undefined' && window.performance) {
    const navigation = performance.getEntriesByType('navigation')[0]
    const resources = performance.getEntriesByType('resource')
    
    const bundleInfo = {
      totalSize: 0,
      jsSize: 0,
      cssSize: 0,
      imageSize: 0,
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
    }

    resources.forEach(resource => {
      const size = resource.transferSize || 0
      bundleInfo.totalSize += size

      if (resource.name.includes('.js')) {
        bundleInfo.jsSize += size
      } else if (resource.name.includes('.css')) {
        bundleInfo.cssSize += size
      } else if (resource.name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
        bundleInfo.imageSize += size
      }
    })

    console.group('📊 Bundle Performance')
    console.log('Total Size:', formatBytes(bundleInfo.totalSize))
    console.log('JavaScript:', formatBytes(bundleInfo.jsSize))
    console.log('CSS:', formatBytes(bundleInfo.cssSize))
    console.log('Images:', formatBytes(bundleInfo.imageSize))
    console.log('Load Time:', `${bundleInfo.loadTime.toFixed(2)}ms`)
    console.log('DOM Content Loaded:', `${bundleInfo.domContentLoaded.toFixed(2)}ms`)
    console.groupEnd()

    return bundleInfo
  }
}

// Format bytes to human readable format
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// Component render tracking
export const trackComponentRender = (componentName) => {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now()
    
    return () => {
      const end = performance.now()
      const renderTime = end - start
      
      if (renderTime > 16) { // Warn if render takes longer than 16ms (60fps)
        console.warn(`⚠️ Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`)
      }
    }
  }
  
  return () => {} // No-op in production
}

// Memory usage tracking
export const trackMemoryUsage = () => {
  if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
    const memory = window.performance.memory
    
    const memoryInfo = {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit
    }

    console.group('🧠 Memory Usage')
    console.log('Used:', formatBytes(memoryInfo.used))
    console.log('Total:', formatBytes(memoryInfo.total))
    console.log('Limit:', formatBytes(memoryInfo.limit))
    console.log('Usage:', `${((memoryInfo.used / memoryInfo.total) * 100).toFixed(2)}%`)
    console.groupEnd()

    return memoryInfo
  }
}

// Core Web Vitals tracking
export const trackCoreWebVitals = () => {
  if (typeof window !== 'undefined') {
    // Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const lastEntry = entries[entries.length - 1]
      console.log('🎯 LCP:', `${lastEntry.startTime.toFixed(2)}ms`)
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // First Input Delay
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      entries.forEach((entry) => {
        console.log('⚡ FID:', `${entry.processingStart - entry.startTime}ms`)
      })
    }).observe({ entryTypes: ['first-input'] })

    // Cumulative Layout Shift
    let clsValue = 0
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      console.log('📐 CLS:', clsValue.toFixed(4))
    }).observe({ entryTypes: ['layout-shift'] })
  }
}

// Lazy loading performance
export const trackLazyLoading = (elementName) => {
  const start = performance.now()
  
  return () => {
    const end = performance.now()
    const loadTime = end - start
    console.log(`🔄 Lazy Load: ${elementName} loaded in ${loadTime.toFixed(2)}ms`)
  }
}

// Route change performance
export const trackRouteChange = (routeName) => {
  const start = performance.now()
  
  return () => {
    const end = performance.now()
    const navigationTime = end - start
    console.log(`🛣️ Route: ${routeName} loaded in ${navigationTime.toFixed(2)}ms`)
  }
}

// Redux action performance
export const trackReduxAction = (actionType) => {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now()
    
    return () => {
      const end = performance.now()
      const actionTime = end - start
      
      if (actionTime > 5) { // Warn if action takes longer than 5ms
        console.warn(`🔄 Slow Redux Action: ${actionType} took ${actionTime.toFixed(2)}ms`)
      }
    }
  }
  
  return () => {} // No-op in production
}

// Initialize performance monitoring
export const initPerformanceMonitoring = () => {
  if (process.env.NODE_ENV === 'development') {
    // Track initial bundle size and load time
    window.addEventListener('load', () => {
      setTimeout(() => {
        trackBundleSize()
        trackMemoryUsage()
        trackCoreWebVitals()
      }, 1000)
    })

    // Track memory usage periodically
    setInterval(() => {
      trackMemoryUsage()
    }, 30000) // Every 30 seconds
  }
}

// Performance HOC for components
export const withPerformanceTracking = (WrappedComponent, componentName) => {
  return function PerformanceTrackedComponent(props) {
    const trackRender = trackComponentRender(componentName)
    
    React.useEffect(() => {
      trackRender()
    })

    return React.createElement(WrappedComponent, props)
  }
}