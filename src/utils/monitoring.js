/**
 * Monitoring and Analytics Utilities
 * Centralized error monitoring, performance tracking, and analytics
 */

import { monitoringConfig, loggingConfig, isDevelopment, isProduction } from './envConfig.js';

// Sentry integration (lazy loaded)
let Sentry = null;

/**
 * Initialize error monitoring
 */
export const initializeErrorMonitoring = async () => {
  if (!monitoringConfig.sentry.enabled) {
    console.log('📊 Error monitoring disabled');
    return;
  }

  try {
    // Dynamically import Sentry only when needed
    const { init, captureException, setUser, setTag, setContext } = await import('@sentry/react');
    
    Sentry = { init, captureException, setUser, setTag, setContext };

    Sentry.init({
      dsn: monitoringConfig.sentry.dsn,
      environment: monitoringConfig.sentry.environment,
      release: monitoringConfig.sentry.release,
      integrations: [
        // Add performance monitoring in production
        ...(isProduction() ? [
          // Performance monitoring
        ] : []),
      ],
      tracesSampleRate: isProduction() ? 0.1 : 1.0, // 10% in production, 100% in dev
      beforeSend(event) {
        // Filter out development errors
        if (isDevelopment() && event.exception) {
          console.error('Sentry Event:', event);
        }
        return event;
      },
    });

    console.log('✅ Error monitoring initialized');
  } catch (error) {
    console.error('❌ Failed to initialize error monitoring:', error);
  }
};

/**
 * Log error to monitoring service
 */
export const logError = (error, context = {}) => {
  // Always log to console in development
  if (isDevelopment() || loggingConfig.enableConsole) {
    console.error('Error:', error, context);
  }

  // Send to Sentry if available
  if (Sentry && monitoringConfig.sentry.enabled) {
    if (context) {
      Sentry.setContext('errorContext', context);
    }
    Sentry.captureException(error);
  }
};

/**
 * Set user context for error monitoring
 */
export const setUserContext = (user) => {
  if (Sentry && monitoringConfig.sentry.enabled) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
    });
  }
};

/**
 * Add tags to error context
 */
export const setErrorTags = (tags) => {
  if (Sentry && monitoringConfig.sentry.enabled) {
    Object.entries(tags).forEach(([key, value]) => {
      Sentry.setTag(key, value);
    });
  }
};

// Google Analytics integration
let gtag = null;

/**
 * Initialize Google Analytics
 */
export const initializeAnalytics = () => {
  if (!monitoringConfig.analytics.googleAnalytics.enabled) {
    console.log('📈 Analytics disabled');
    return;
  }

  const trackingId = monitoringConfig.analytics.googleAnalytics.trackingId;

  try {
    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    gtag = function() {
      window.dataLayer.push(arguments);
    };
    gtag('js', new Date());
    gtag('config', trackingId, {
      page_title: document.title,
      page_location: window.location.href,
    });

    console.log('✅ Google Analytics initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Google Analytics:', error);
  }
};

/**
 * Track page view
 */
export const trackPageView = (path, title) => {
  if (gtag && monitoringConfig.analytics.googleAnalytics.enabled) {
    gtag('config', monitoringConfig.analytics.googleAnalytics.trackingId, {
      page_path: path,
      page_title: title,
    });
  }

  // Log in development
  if (isDevelopment()) {
    console.log('📊 Page View:', { path, title });
  }
};

/**
 * Track custom event
 */
export const trackEvent = (eventName, parameters = {}) => {
  if (gtag && monitoringConfig.analytics.googleAnalytics.enabled) {
    gtag('event', eventName, parameters);
  }

  // Log in development
  if (isDevelopment()) {
    console.log('📊 Event:', eventName, parameters);
  }
};

/**
 * Track user interaction
 */
export const trackUserInteraction = (action, category = 'User', label = '') => {
  trackEvent('user_interaction', {
    event_category: category,
    event_label: label,
    value: action,
  });
};

// Hotjar integration
/**
 * Initialize Hotjar
 */
export const initializeHotjar = () => {
  if (!monitoringConfig.analytics.hotjar.enabled) {
    return;
  }

  const hotjarId = monitoringConfig.analytics.hotjar.id;

  try {
    (function(h,o,t,j,a,r){
      h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
      h._hjSettings={hjid:hotjarId,hjsv:6};
      a=o.getElementsByTagName('head')[0];
      r=o.createElement('script');r.async=1;
      r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
      a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');

    console.log('✅ Hotjar initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Hotjar:', error);
  }
};

// Performance monitoring
/**
 * Track performance metrics
 */
export const trackPerformance = (metricName, value, unit = 'ms') => {
  // Send to analytics
  trackEvent('performance_metric', {
    metric_name: metricName,
    metric_value: value,
    metric_unit: unit,
  });

  // Log in development
  if (isDevelopment()) {
    console.log(`⚡ Performance: ${metricName} = ${value}${unit}`);
  }
};

/**
 * Track page load performance
 */
export const trackPageLoadPerformance = () => {
  if (typeof window !== 'undefined' && window.performance) {
    const navigation = performance.getEntriesByType('navigation')[0];
    
    if (navigation) {
      trackPerformance('page_load_time', Math.round(navigation.loadEventEnd - navigation.fetchStart));
      trackPerformance('dom_content_loaded', Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart));
      trackPerformance('first_paint', Math.round(navigation.responseEnd - navigation.fetchStart));
    }
  }
};

/**
 * Track bundle size and loading performance
 */
export const trackBundlePerformance = () => {
  if (typeof window !== 'undefined' && window.performance) {
    const resources = performance.getEntriesByType('resource');
    
    let totalJSSize = 0;
    let totalCSSSize = 0;
    
    resources.forEach(resource => {
      if (resource.name.includes('.js')) {
        totalJSSize += resource.transferSize || 0;
      } else if (resource.name.includes('.css')) {
        totalCSSSize += resource.transferSize || 0;
      }
    });

    trackPerformance('total_js_size', Math.round(totalJSSize / 1024), 'KB');
    trackPerformance('total_css_size', Math.round(totalCSSSize / 1024), 'KB');
  }
};

// Error boundary integration
/**
 * Handle React error boundary errors
 */
export const handleErrorBoundary = (error, errorInfo) => {
  logError(error, {
    errorBoundary: true,
    componentStack: errorInfo.componentStack,
  });

  // Track error event
  trackEvent('error_boundary', {
    error_message: error.message,
    error_stack: error.stack,
  });
};

// Initialize all monitoring services
/**
 * Initialize all monitoring and analytics services
 */
export const initializeMonitoring = async () => {
  console.log('🚀 Initializing monitoring services...');

  try {
    await initializeErrorMonitoring();
    initializeAnalytics();
    initializeHotjar();

    // Track initial page load performance
    setTimeout(() => {
      trackPageLoadPerformance();
      trackBundlePerformance();
    }, 1000);

    console.log('✅ All monitoring services initialized');
  } catch (error) {
    console.error('❌ Failed to initialize monitoring services:', error);
  }
};

// Alias for backward compatibility
export const initMonitoring = initializeMonitoring;

// Export monitoring utilities
export const monitoring = {
  initializeMonitoring,
  logError,
  setUserContext,
  setErrorTags,
  trackPageView,
  trackEvent,
  trackUserInteraction,
  trackPerformance,
  handleErrorBoundary,
};

export default monitoring;