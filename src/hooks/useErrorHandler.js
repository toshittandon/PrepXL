import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { handleError, retryWithBackoff, showSuccess, showWarning, showInfo } from '../utils/errorUtils'

const useErrorHandler = () => {
  const dispatch = useDispatch()

  // Main error handler
  const handleErrorWithNotification = useCallback((error, context = '', options = {}) => {
    return handleError(error, dispatch, context, options)
  }, [dispatch])

  // Retry wrapper with error handling
  const withRetry = useCallback(async (operation, options = {}) => {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      context = 'Operation',
      showRetryNotification = false,
      onRetryAttempt = null
    } = options

    try {
      return await retryWithBackoff(
        operation,
        maxRetries,
        baseDelay,
        onRetryAttempt
      )
    } catch (error) {
      handleErrorWithNotification(error, context, {
        showNotification: true,
        actions: showRetryNotification ? [
          {
            label: 'Retry',
            onClick: () => withRetry(operation, options),
            variant: 'primary'
          }
        ] : null
      })
      throw error
    }
  }, [handleErrorWithNotification])

  // Success notification
  const notifySuccess = useCallback((message, options = {}) => {
    showSuccess(message, dispatch, options)
  }, [dispatch])

  // Warning notification
  const notifyWarning = useCallback((message, options = {}) => {
    showWarning(message, dispatch, options)
  }, [dispatch])

  // Info notification
  const notifyInfo = useCallback((message, options = {}) => {
    showInfo(message, dispatch, options)
  }, [dispatch])

  // Create error handler for specific contexts
  const createContextHandler = useCallback((context) => {
    return (error, options = {}) => {
      return handleErrorWithNotification(error, context, options)
    }
  }, [handleErrorWithNotification])

  // Handle async operations with loading states
  const handleAsyncOperation = useCallback(async (
    operation,
    {
      context = 'Operation',
      successMessage = null,
      errorMessage = null,
      showLoading = false,
      onStart = null,
      onSuccess = null,
      onError = null,
      onFinally = null
    } = {}
  ) => {
    try {
      if (onStart) onStart()
      
      if (showLoading) {
        notifyInfo(`${context} in progress...`, { duration: 2000 })
      }

      const result = await operation()

      if (onSuccess) onSuccess(result)
      
      if (successMessage) {
        notifySuccess(successMessage)
      }

      return result
    } catch (error) {
      if (onError) onError(error)
      
      const errorMsg = errorMessage || `${context} failed`
      handleErrorWithNotification(error, errorMsg)
      
      throw error
    } finally {
      if (onFinally) onFinally()
    }
  }, [handleErrorWithNotification, notifySuccess, notifyInfo])

  return {
    handleError: handleErrorWithNotification,
    withRetry,
    notifySuccess,
    notifyWarning,
    notifyInfo,
    createContextHandler,
    handleAsyncOperation
  }
}

export default useErrorHandler