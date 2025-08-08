import { addNotification } from '../store/slices/uiSlice'

// Error types for categorization
export const ERROR_TYPES = {
  NETWORK: 'network',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  VALIDATION: 'validation',
  SERVER: 'server',
  CLIENT: 'client',
  UNKNOWN: 'unknown'
}

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
}

// Categorize error based on status code or error type
export const categorizeError = (error) => {
  if (!error) return ERROR_TYPES.UNKNOWN

  // Network errors
  if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
    return ERROR_TYPES.NETWORK
  }

  // HTTP status code based categorization
  if (error.status || error.response?.status) {
    const status = error.status || error.response.status
    
    if (status === 401) return ERROR_TYPES.AUTHENTICATION
    if (status === 403) return ERROR_TYPES.AUTHORIZATION
    if (status >= 400 && status < 500) return ERROR_TYPES.CLIENT
    if (status >= 500) return ERROR_TYPES.SERVER
  }

  // Appwrite specific errors
  if (error.type) {
    if (error.type.includes('user_unauthorized')) return ERROR_TYPES.AUTHENTICATION
    if (error.type.includes('user_blocked')) return ERROR_TYPES.AUTHORIZATION
    if (error.type.includes('document_invalid')) return ERROR_TYPES.VALIDATION
  }

  return ERROR_TYPES.UNKNOWN
}

// Get user-friendly error message
export const getUserFriendlyMessage = (error, context = '') => {
  const errorType = categorizeError(error)
  const contextPrefix = context ? `${context}: ` : ''

  switch (errorType) {
    case ERROR_TYPES.NETWORK:
      return `${contextPrefix}Please check your internet connection and try again.`
    
    case ERROR_TYPES.AUTHENTICATION:
      return `${contextPrefix}Please log in again to continue.`
    
    case ERROR_TYPES.AUTHORIZATION:
      return `${contextPrefix}You don't have permission to perform this action.`
    
    case ERROR_TYPES.VALIDATION:
      return `${contextPrefix}Please check your input and try again.`
    
    case ERROR_TYPES.SERVER:
      return `${contextPrefix}Our servers are experiencing issues. Please try again later.`
    
    case ERROR_TYPES.CLIENT:
      return error.message || `${contextPrefix}Something went wrong. Please try again.`
    
    default:
      return error.message || `${contextPrefix}An unexpected error occurred. Please try again.`
  }
}

// Determine error severity
export const getErrorSeverity = (error) => {
  const errorType = categorizeError(error)
  
  switch (errorType) {
    case ERROR_TYPES.AUTHENTICATION:
    case ERROR_TYPES.AUTHORIZATION:
      return ERROR_SEVERITY.HIGH
    
    case ERROR_TYPES.SERVER:
      return ERROR_SEVERITY.CRITICAL
    
    case ERROR_TYPES.NETWORK:
      return ERROR_SEVERITY.MEDIUM
    
    case ERROR_TYPES.VALIDATION:
    case ERROR_TYPES.CLIENT:
      return ERROR_SEVERITY.LOW
    
    default:
      return ERROR_SEVERITY.MEDIUM
  }
}

// Check if error is retryable
export const isRetryableError = (error) => {
  const errorType = categorizeError(error)
  
  // Don't retry authentication, authorization, or validation errors
  if ([ERROR_TYPES.AUTHENTICATION, ERROR_TYPES.AUTHORIZATION, ERROR_TYPES.VALIDATION].includes(errorType)) {
    return false
  }

  // Retry network and server errors
  if ([ERROR_TYPES.NETWORK, ERROR_TYPES.SERVER].includes(errorType)) {
    return true
  }

  // Check specific status codes
  if (error.status || error.response?.status) {
    const status = error.status || error.response.status
    // Retry on 5xx errors and some 4xx errors
    return status >= 500 || status === 408 || status === 429
  }

  return false
}

// Retry function with exponential backoff
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // Don't retry if it's not a retryable error
      if (!isRetryableError(error)) {
        throw error
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break
      }

      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

// Enhanced error handler that dispatches notifications
export const handleError = (error, dispatch, context = '', options = {}) => {
  const {
    showNotification = true,
    logError = true,
    severity,
    persistent = false,
    actions = null
  } = options

  // Log error
  if (logError) {
    console.error(`Error in ${context}:`, error)
  }

  // Get user-friendly message
  const message = getUserFriendlyMessage(error, context)
  const errorSeverity = severity || getErrorSeverity(error)

  // Show notification if requested
  if (showNotification && dispatch) {
    dispatch(addNotification({
      type: 'error',
      message,
      title: context || 'Error',
      severity: 'error',
      persistent,
      actions,
      errorType: categorizeError(error),
      errorSeverity
    }))
  }

  return {
    message,
    type: categorizeError(error),
    severity: errorSeverity,
    retryable: isRetryableError(error)
  }
}

// Success notification helper
export const showSuccess = (message, dispatch, options = {}) => {
  const {
    title = 'Success',
    duration = 5000,
    actions = null
  } = options

  if (dispatch) {
    dispatch(addNotification({
      type: 'success',
      message,
      title,
      duration,
      actions
    }))
  }
}

// Info notification helper
export const showInfo = (message, dispatch, options = {}) => {
  const {
    title = 'Information',
    duration = 5000,
    persistent = false,
    actions = null
  } = options

  if (dispatch) {
    dispatch(addNotification({
      type: 'info',
      message,
      title,
      duration,
      persistent,
      actions
    }))
  }
}

// Warning notification helper
export const showWarning = (message, dispatch, options = {}) => {
  const {
    title = 'Warning',
    duration = 6000,
    persistent = false,
    actions = null
  } = options

  if (dispatch) {
    dispatch(addNotification({
      type: 'warning',
      message,
      title,
      duration,
      persistent,
      actions
    }))
  }
}

// Create retry action for notifications
export const createRetryAction = (retryFn, label = 'Retry') => {
  return {
    label,
    onClick: retryFn,
    variant: 'primary'
  }
}

// Error boundary error handler
export const handleBoundaryError = (error, errorInfo) => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  // In production, you would send this to an error monitoring service
  const errorData = {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  }

  // Example: Send to error monitoring service
  // errorMonitoringService.captureException(error, {
  //   extra: errorData,
  //   tags: { component: 'ErrorBoundary' }
  // })

  return errorData
}