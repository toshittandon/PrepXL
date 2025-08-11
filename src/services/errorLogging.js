/**
 * Error Logging and Monitoring Service
 * Handles error reporting to external monitoring services
 */

import { categorizeError, getErrorSeverity } from '../utils/errorUtils'

// Configuration for error logging
const ERROR_LOGGING_CONFIG = {
  // In production, replace with actual service URLs
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  logRocketAppId: import.meta.env.VITE_LOGROCKET_APP_ID,
  bugsnagApiKey: import.meta.env.VITE_BUGSNAG_API_KEY,
  
  // Local logging configuration
  enableConsoleLogging: import.meta.env.DEV,
  enableRemoteLogging: import.meta.env.PROD,
  
  // Sampling rates (0-1)
  errorSamplingRate: 1.0, // Log all errors
  performanceSamplingRate: 0.1, // Log 10% of performance events
  
  // Rate limiting
  maxErrorsPerMinute: 10,
  maxErrorsPerSession: 50
}

// Error tracking state
let errorCount = {
  perMinute: 0,
  perSession: 0,
  lastReset: Date.now()
}

// Reset error count every minute
setInterval(() => {
  errorCount.perMinute = 0
  errorCount.lastReset = Date.now()
}, 60000)

/**
 * Check if we should log this error (rate limiting)
 */
const shouldLogError = (error) => {
  // Always log critical errors
  if (getErrorSeverity(error) === 'critical') {
    return true
  }

  // Check rate limits
  if (errorCount.perMinute >= ERROR_LOGGING_CONFIG.maxErrorsPerMinute) {
    return false
  }

  if (errorCount.perSession >= ERROR_LOGGING_CONFIG.maxErrorsPerSession) {
    return false
  }

  return true
}

/**
 * Create error context information
 */
const createErrorContext = (error, context = {}) => {
  return {
    // Error details
    message: error.message || 'Unknown error',
    stack: error.stack,
    name: error.name,
    
    // Categorization
    type: categorizeError(error),
    severity: getErrorSeverity(error),
    
    // Context
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    
    // User context
    userId: context.userId || 'anonymous',
    sessionId: context.sessionId || getSessionId(),
    
    // Application context
    component: context.component,
    action: context.action,
    additionalData: context.additionalData,
    
    // Browser context
    online: navigator.onLine,
    cookieEnabled: navigator.cookieEnabled,
    language: navigator.language,
    
    // Performance context
    memory: performance.memory ? {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
    } : null
  }
}

/**
 * Get or create session ID
 */
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('errorLoggingSessionId')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('errorLoggingSessionId', sessionId)
  }
  return sessionId
}

/**
 * Log to console (development)
 */
const logToConsole = (errorContext) => {
  if (!ERROR_LOGGING_CONFIG.enableConsoleLogging) return

  console.group(`🚨 Error Logged: ${errorContext.type}`)
  console.error('Message:', errorContext.message)
  console.error('Stack:', errorContext.stack)
  console.log('Context:', {
    component: errorContext.component,
    action: errorContext.action,
    severity: errorContext.severity,
    timestamp: errorContext.timestamp
  })
  console.log('User Context:', {
    userId: errorContext.userId,
    sessionId: errorContext.sessionId,
    url: errorContext.url
  })
  if (errorContext.additionalData) {
    console.log('Additional Data:', errorContext.additionalData)
  }
  console.groupEnd()
}

/**
 * Log to Sentry (example implementation)
 */
const logToSentry = async (errorContext) => {
  if (!ERROR_LOGGING_CONFIG.sentryDsn || !ERROR_LOGGING_CONFIG.enableRemoteLogging) {
    return
  }

  try {
    // In a real implementation, you would use the Sentry SDK
    // import * as Sentry from '@sentry/browser'
    // 
    // Sentry.captureException(new Error(errorContext.message), {
    //   tags: {
    //     component: errorContext.component,
    //     errorType: errorContext.type,
    //     severity: errorContext.severity
    //   },
    //   extra: errorContext,
    //   user: {
    //     id: errorContext.userId
    //   }
    // })

    console.log('Would log to Sentry:', errorContext)
  } catch (loggingError) {
    console.error('Failed to log to Sentry:', loggingError)
  }
}

/**
 * Log to LogRocket (example implementation)
 */
const logToLogRocket = async (errorContext) => {
  if (!ERROR_LOGGING_CONFIG.logRocketAppId || !ERROR_LOGGING_CONFIG.enableRemoteLogging) {
    return
  }

  try {
    // In a real implementation, you would use the LogRocket SDK
    // import LogRocket from 'logrocket'
    // 
    // LogRocket.captureException(new Error(errorContext.message))
    // LogRocket.track('Error Occurred', {
    //   errorType: errorContext.type,
    //   severity: errorContext.severity,
    //   component: errorContext.component
    // })

    console.log('Would log to LogRocket:', errorContext)
  } catch (loggingError) {
    console.error('Failed to log to LogRocket:', loggingError)
  }
}

/**
 * Log to custom endpoint
 */
const logToCustomEndpoint = async (errorContext) => {
  if (!ERROR_LOGGING_CONFIG.enableRemoteLogging) return

  try {
    // Send to your custom error logging endpoint
    await fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(errorContext)
    })
  } catch (loggingError) {
    console.error('Failed to log to custom endpoint:', loggingError)
  }
}

/**
 * Main error logging function
 */
export const logError = async (error, context = {}) => {
  // Check if we should log this error
  if (!shouldLogError(error)) {
    return
  }

  // Increment error counts
  errorCount.perMinute++
  errorCount.perSession++

  // Create error context
  const errorContext = createErrorContext(error, context)

  // Log to various services
  try {
    // Always log to console in development
    logToConsole(errorContext)

    // Log to external services in parallel
    if (ERROR_LOGGING_CONFIG.enableRemoteLogging) {
      await Promise.allSettled([
        logToSentry(errorContext),
        logToLogRocket(errorContext),
        logToCustomEndpoint(errorContext)
      ])
    }
  } catch (loggingError) {
    console.error('Error in error logging system:', loggingError)
  }

  return errorContext
}

/**
 * Log performance issues
 */
export const logPerformanceIssue = async (metric, context = {}) => {
  if (Math.random() > ERROR_LOGGING_CONFIG.performanceSamplingRate) {
    return // Skip due to sampling
  }

  const performanceContext = {
    type: 'performance',
    metric,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    ...context
  }

  if (ERROR_LOGGING_CONFIG.enableConsoleLogging) {
    console.warn('Performance Issue:', performanceContext)
  }

  if (ERROR_LOGGING_CONFIG.enableRemoteLogging) {
    try {
      await logToCustomEndpoint(performanceContext)
    } catch (error) {
      console.error('Failed to log performance issue:', error)
    }
  }
}

/**
 * Log user actions for debugging
 */
export const logUserAction = (action, context = {}) => {
  if (!ERROR_LOGGING_CONFIG.enableConsoleLogging) return

  console.log('User Action:', {
    action,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    ...context
  })
}

/**
 * Initialize error logging service
 */
export const initializeErrorLogging = () => {
  // Set up global error handlers
  window.addEventListener('error', (event) => {
    logError(event.error || new Error(event.message), {
      component: 'Global',
      action: 'unhandled_error',
      additionalData: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason || new Error('Unhandled Promise Rejection'), {
      component: 'Global',
      action: 'unhandled_promise_rejection'
    })
  })

  // Log initialization
  if (ERROR_LOGGING_CONFIG.enableConsoleLogging) {
    console.log('Error logging service initialized', {
      enableConsoleLogging: ERROR_LOGGING_CONFIG.enableConsoleLogging,
      enableRemoteLogging: ERROR_LOGGING_CONFIG.enableRemoteLogging,
      sessionId: getSessionId()
    })
  }
}

/**
 * Get error logging statistics
 */
export const getErrorStats = () => {
  return {
    errorsThisMinute: errorCount.perMinute,
    errorsThisSession: errorCount.perSession,
    lastReset: errorCount.lastReset,
    sessionId: getSessionId(),
    config: {
      maxErrorsPerMinute: ERROR_LOGGING_CONFIG.maxErrorsPerMinute,
      maxErrorsPerSession: ERROR_LOGGING_CONFIG.maxErrorsPerSession,
      enableRemoteLogging: ERROR_LOGGING_CONFIG.enableRemoteLogging
    }
  }
}