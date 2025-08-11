import { useState, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { manualSessionClear } from '../services/appwrite/auth.js'

/**
 * Custom hook for manual session clearing with UI integration
 * Provides state management and callbacks for session clearing operations
 */
export const useManualSessionClear = () => {
  const dispatch = useDispatch()
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [result, setResult] = useState(null)

  /**
   * Show the confirmation dialog
   */
  const showConfirmation = useCallback(() => {
    setIsConfirmationOpen(true)
    setResult(null)
  }, [])

  /**
   * Hide the confirmation dialog
   */
  const hideConfirmation = useCallback(() => {
    if (!isClearing) {
      setIsConfirmationOpen(false)
    }
  }, [isClearing])

  /**
   * Perform the manual session clearing with confirmation
   */
  const clearAllSessions = useCallback(async () => {
    setIsClearing(true)
    
    try {
      const clearResult = await manualSessionClear({
        dispatch,
        requireConfirmation: false, // We handle confirmation in the UI
        onSuccess: (successResult) => {
          setResult({
            type: 'success',
            message: successResult.userMessage,
            details: successResult
          })
        },
        onError: (errorResult) => {
          setResult({
            type: 'error',
            message: errorResult.userMessage,
            details: errorResult
          })
        }
      })

      // Close confirmation dialog on success
      if (clearResult.success) {
        setIsConfirmationOpen(false)
      }

      return clearResult
    } catch (error) {
      const errorResult = {
        type: 'error',
        message: 'An unexpected error occurred while clearing sessions',
        details: { error }
      }
      setResult(errorResult)
      return { success: false, error }
    } finally {
      setIsClearing(false)
    }
  }, [dispatch])

  /**
   * Clear the result state
   */
  const clearResult = useCallback(() => {
    setResult(null)
  }, [])

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setIsConfirmationOpen(false)
    setIsClearing(false)
    setResult(null)
  }, [])

  return {
    // State
    isConfirmationOpen,
    isClearing,
    result,
    
    // Actions
    showConfirmation,
    hideConfirmation,
    clearAllSessions,
    clearResult,
    reset,
    
    // Computed state
    hasError: result?.type === 'error',
    hasSuccess: result?.type === 'success',
    isProcessing: isClearing
  }
}

/**
 * Simplified hook for programmatic session clearing without UI
 * Useful for automated session clearing scenarios
 */
export const useSessionClear = () => {
  const dispatch = useDispatch()
  const [isClearing, setIsClearing] = useState(false)
  const [lastResult, setLastResult] = useState(null)

  const clearSessions = useCallback(async (options = {}) => {
    setIsClearing(true)
    
    try {
      const result = await manualSessionClear({
        dispatch,
        requireConfirmation: false,
        ...options
      })
      
      setLastResult(result)
      return result
    } catch (error) {
      const errorResult = { success: false, error }
      setLastResult(errorResult)
      return errorResult
    } finally {
      setIsClearing(false)
    }
  }, [dispatch])

  return {
    clearSessions,
    isClearing,
    lastResult,
    clearResult: () => setLastResult(null)
  }
}

export default useManualSessionClear