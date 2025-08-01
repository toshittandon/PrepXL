/**
 * Error monitoring and analytics utilities
 */

// Sentry configuration for error monitoring
export const initSentry = async () => {
  // Only initialize Sentry if explicitly enabled and DSN is provided
  if (import.meta.env.VITE_ENABLE_ERROR_REPORTING !== 'true' || !import.meta.env.VITE_SENTRY_DSN) {
    console.log('Sentry monitoring disabled or not configured');
    return;
  }

  // Skip Sentry initialization in development to avoid import issues
  if (import.meta.env.VITE_APP_ENVIRONMENT === 'development') {
    console.log('Sentry skipped in development mode');
    return;
  }

  // For now, skip Sentry initialization to avoid build issues
  console.log('Sentry initialization skipped - not configured for this build');
  return;
};

// Google Analytics configuration
export const initGoogleAnalytics = () => {
  if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true' && import.meta.env.VITE_GA_TRACKING_ID) {
    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${import.meta.env.VITE_GA_TRACKING_ID}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', import.meta.env.VITE_GA_TRACKING_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }
};

// Hotjar configuration
export const initHotjar = () => {
  if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true' && import.meta.env.VITE_HOTJAR_ID) {
    (function(h,o,t,j,a,r){
      h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
      h._hjSettings={hjid:import.meta.env.VITE_HOTJAR_ID,hjsv:6};
      a=o.getElementsByTagName('head')[0];
      r=o.createElement('script');r.async=1;
      r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
      a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
  }
};

// Custom event tracking
export const trackEvent = (eventName, properties = {}) => {
  // Google Analytics event tracking
  if (window.gtag && import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
    window.gtag('event', eventName, {
      ...properties,
      app_version: import.meta.env.VITE_APP_VERSION,
      environment: import.meta.env.VITE_APP_ENVIRONMENT,
    });
  }

  // Console logging for development
  if (import.meta.env.VITE_APP_ENVIRONMENT === 'development') {
    console.log('Analytics Event:', eventName, properties);
  }
};

// Error reporting utility
export const reportError = (error, context = {}) => {
  // Log to console in development
  if (import.meta.env.VITE_APP_ENVIRONMENT === 'development') {
    console.error('Error reported:', error, context);
  }

  // Send to Sentry if available
  if (window.Sentry && import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true') {
    window.Sentry.withScope((scope) => {
      Object.keys(context).forEach(key => {
        scope.setTag(key, context[key]);
      });
      window.Sentry.captureException(error);
    });
  }

  // Track error event
  trackEvent('error_occurred', {
    error_message: error.message,
    error_stack: error.stack,
    ...context,
  });
};

// Performance monitoring
export const trackPerformance = (metricName, value, unit = 'ms') => {
  // Google Analytics custom metric
  if (window.gtag && import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
    window.gtag('event', 'timing_complete', {
      name: metricName,
      value: Math.round(value),
      event_category: 'Performance',
    });
  }

  // Console logging for development
  if (import.meta.env.VITE_APP_ENVIRONMENT === 'development') {
    console.log(`Performance: ${metricName} = ${value}${unit}`);
  }
};

// Initialize all monitoring services
export const initMonitoring = async () => {
  await initSentry();
  initGoogleAnalytics();
  initHotjar();

  // Track page load performance
  if (window.performance && window.performance.timing) {
    const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
    trackPerformance('page_load_time', loadTime);
  }
};