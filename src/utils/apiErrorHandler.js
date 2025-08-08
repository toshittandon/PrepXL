import { isRejectedWithValue } from '@reduxjs/toolkit'
import { addNotification } from '../store/slices/uiSlice'
import { handleError, retryWithBackoff, isRetryableError } from './errorUtils'

// RTK Query error handling middleware
export const rtkQueryErrorLogger = (api) => (next) => (action) => {
  // RTK Query uses `createAsyncThunk` from redux-toolkit under the hood, so we're able to utilize these matchers!
  if (isRejectedWithValue(action)) {
    const error = action.payload
    const endpointName = action.meta?.arg?.endpointName
    const context = endpointName ? `API Error (${endpointName})` : 'API Error'

    // Handle the error using our error utility
    handleError(error, api.dispatch, context, {
      showNotification: true,
      logError: true
    })
  }

  return next(action)
}

// Enhanced fetch base query with retry logic
export const createEnhancedBaseQuery = (baseQuery) => {
  return async (args, api, extraOptions) => {
    // Add retry logic for retryable errors
    const executeQuery = () => baseQuery(args, api, extraOptions)

    try {
      const result = await retryWithBackoff(executeQuery, 3, 1000)
      return result
    } catch (error) {
      // If retry failed, return the error
      return {
        error: {
          status: error.status || 'FETCH_ERROR',
          data: error.data || error.message || 'Network request failed',
          originalError: error
        }
      }
    }
  }
}

// Specific error handlers for different API operations
export const handleAuthError = (error, dispatch) => {
  const context = 'Authentication'
  
  if (error.status === 401) {
    dispatch(addNotification({
      type: 'error',
      title: 'Session Expired',
      message: 'Your session has expired. Please log in again.',
      persistent: true,
      actions: [
        {
          label: 'Login',
          onClick: () => {
            window.location.href = '/login'
          },
          variant: 'primary'
        }
      ]
    }))
    return
  }

  handleError(error, dispatch, context)
}

export const handleFileUploadError = (error, dispatch) => {
  const context = 'File Upload'
  
  // Handle specific file upload errors
  if (error.message?.includes('file size')) {
    dispatch(addNotification({
      type: 'error',
      title: 'File Too Large',
      message: 'Please select a file smaller than 10MB.',
      duration: 6000
    }))
    return
  }

  if (error.message?.includes('file type')) {
    dispatch(addNotification({
      type: 'error',
      title: 'Invalid File Type',
      message: 'Please select a PDF, DOC, or DOCX file.',
      duration: 6000
    }))
    return
  }

  handleError(error, dispatch, context)
}

export const handleInterviewError = (error, dispatch) => {
  const context = 'Interview Session'
  
  // Handle speech recognition errors
  if (error.message?.includes('speech')) {
    dispatch(addNotification({
      type: 'warning',
      title: 'Speech Recognition Issue',
      message: 'Having trouble with voice input? You can type your answers instead.',
      duration: 8000,
      actions: [
        {
          label: 'Switch to Text',
          onClick: () => {
            // This would be handled by the component
            window.dispatchEvent(new CustomEvent('switchToTextInput'))
          },
          variant: 'secondary'
        }
      ]
    }))
    return
  }

  handleError(error, dispatch, context)
}

export const handleResumeAnalysisError = (error, dispatch) => {
  const context = 'Resume Analysis'
  
  // Handle AI service specific errors
  if (error.status === 429) {
    dispatch(addNotification({
      type: 'warning',
      title: 'Rate Limit Reached',
      message: 'Too many analysis requests. Please wait a moment before trying again.',
      duration: 10000
    }))
    return
  }

  if (error.message?.includes('AI service')) {
    dispatch(addNotification({
      type: 'error',
      title: 'Analysis Service Unavailable',
      message: 'Our AI analysis service is temporarily unavailable. Please try again later.',
      persistent: true,
      actions: [
        {
          label: 'Retry',
          onClick: () => {
            // This would trigger a retry in the component
            window.dispatchEvent(new CustomEvent('retryAnalysis'))
          },
          variant: 'primary'
        }
      ]
    }))
    return
  }

  handleError(error, dispatch, context)
}

// Generic API operation wrapper with error handling
export const withErrorHandling = (operation, errorHandler) => {
  return async (...args) => {
    try {
      return await operation(...args)
    } catch (error) {
      if (errorHandler) {
        errorHandler(error)
      } else {
        console.error('Unhandled API error:', error)
      }
      throw error
    }
  }
}

// Create error handler function for components
export const createApiErrorHandler = (dispatch) => {
  return (error, context = 'API Operation') => {
    handleError(error, dispatch, context)
  }
}

// Graceful degradation helpers
export const createFallbackData = (dataType) => {
  switch (dataType) {
    case 'questions':
      return {
        questions: [],
        message: 'Questions are temporarily unavailable. Please try again later.'
      }
    
    case 'analytics':
      return {
        stats: { totalSessions: 0, averageScore: 0, completionRate: 0 },
        message: 'Analytics data is temporarily unavailable.'
      }
    
    case 'userProfile':
      return {
        name: 'User',
        email: '',
        message: 'Profile data is temporarily unavailable.'
      }
    
    default:
      return {
        data: null,
        message: 'Data is temporarily unavailable. Please try again later.'
      }
  }
}

export const shouldShowFallback = (error) => {
  // Show fallback for network errors and server errors
  const retryable = isRetryableError(error)
  return retryable || error.status >= 500
}