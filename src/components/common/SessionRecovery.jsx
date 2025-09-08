import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, RefreshCw, LogIn, X } from 'lucide-react'

import Button from './Button.jsx'
import { checkSessionValidity, refreshAndValidateSession } from '../../utils/sessionValidator.js'
import { setUser, setSession, logout } from '../../store/slices/authSlice.js'

const SessionRecovery = ({ 
  isVisible, 
  onClose, 
  onRecovered, 
  autoRetry = true,
  showManualOptions = true 
}) => {
  const [isRecovering, setIsRecovering] = useState(false)
  const [recoveryAttempts, setRecoveryAttempts] = useState(0)
  const [recoveryStatus, setRecoveryStatus] = useState(null)
  const [autoRetryCountdown, setAutoRetryCountdown] = useState(5)
  
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  // Auto-retry logic
  useEffect(() => {
    if (!isVisible || !autoRetry || recoveryAttempts >= 3 || recoveryStatus === 'exhausted') return

    const timer = setInterval(() => {
      setAutoRetryCountdown(prev => {
        if (prev <= 1) {
          handleRecoveryAttempt()
          return 5
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isVisible, autoRetry, recoveryAttempts, recoveryStatus])

  const handleRecoveryAttempt = async () => {
    if (isRecovering) return

    setIsRecovering(true)
    setRecoveryAttempts(prev => prev + 1)
    setRecoveryStatus('attempting')

    try {
      // First check if we already have a valid session without making API calls
      const validityCheck = await checkSessionValidity()
      
      if (validityCheck.valid) {
        // Session is already valid, no need to recover
        setRecoveryStatus('success')
        
        if (onRecovered) {
          onRecovered(validityCheck)
        }
        
        setTimeout(() => {
          onClose()
        }, 1500)
        return
      }

      // Clear any stale auth data first - use setTimeout to avoid React warning
      setTimeout(() => {
        dispatch(logout())
      }, 0)
      
      // Clear browser storage
      localStorage.removeItem('auth-storage')
      sessionStorage.removeItem('auth-storage')
      
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Try to refresh and validate the session
      try {
        const refreshedSession = await refreshAndValidateSession()
        
        if (refreshedSession.valid) {
          // Session recovery successful - use setTimeout to avoid React warning
          setTimeout(() => {
            dispatch(setUser(refreshedSession.user))
            dispatch(setSession(refreshedSession.session))
          }, 0)
          
          setRecoveryStatus('success')
          
          if (onRecovered) {
            onRecovered(refreshedSession)
          }
          
          setTimeout(() => {
            onClose()
          }, 1500)
          return
        }
      } catch (refreshError) {
        // If refresh fails, the session is definitely invalid
        throw new Error('Unable to recover session - please log in again')
      }
      
      throw new Error('No valid session found')

    } catch (error) {
      console.error('Session recovery failed:', error)
      setRecoveryStatus('failed')
      
      // If it's a 401 error or no session, don't retry - redirect to login instead
      if (error.code === 401 || error.message.includes('No valid session found') || recoveryAttempts >= 2) {
        setRecoveryStatus('exhausted')
        // Auto-redirect to login after a short delay if no manual options shown
        if (!showManualOptions) {
          setTimeout(() => {
            handleManualLogin()
          }, 2000)
        }
      }
    } finally {
      setIsRecovering(false)
      setAutoRetryCountdown(5)
    }
  }

  const handleManualLogin = () => {
    // Clear any stale auth data
    dispatch(logout())
    
    // Navigate to login with return path
    navigate('/login', {
      state: {
        from: location.pathname,
        message: 'Your session has expired. Please log in again to continue.'
      }
    })
    
    onClose()
  }

  const handleRefreshPage = () => {
    window.location.reload()
  }

  const getStatusMessage = () => {
    switch (recoveryStatus) {
      case 'attempting':
        return 'Attempting to recover your session...'
      case 'success':
        return 'Session recovered successfully!'
      case 'failed':
        return `Recovery attempt ${recoveryAttempts} failed. ${recoveryAttempts < 3 ? `Retrying in ${autoRetryCountdown}s...` : ''}`
      case 'exhausted':
        return 'Unable to recover your session automatically. Please try the options below.'
      default:
        return 'Your session has expired or is invalid.'
    }
  }

  const getStatusIcon = () => {
    switch (recoveryStatus) {
      case 'attempting':
        return <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
      case 'success':
        return <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
      case 'failed':
      case 'exhausted':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    }
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Session Recovery
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Status Message */}
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400">
              {getStatusMessage()}
            </p>
            
            {recoveryStatus === 'failed' && recoveryAttempts < 3 && (
              <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                Auto-retry in {autoRetryCountdown} seconds...
              </div>
            )}
          </div>

          {/* Progress Indicator */}
          {isRecovering && (
            <div className="mb-6">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          )}

          {/* Manual Options */}
          {showManualOptions && (recoveryStatus === 'exhausted' || recoveryStatus === 'failed') && (
            <div className="space-y-3">
              <Button
                variant="primary"
                size="sm"
                onClick={handleManualLogin}
                className="w-full"
                disabled={isRecovering}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Go to Login Page
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecoveryAttempt}
                className="w-full"
                disabled={isRecovering}
                loading={isRecovering}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Recovery Again
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshPage}
                className="w-full"
                disabled={isRecovering}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
            </div>
          )}

          {/* Success State */}
          {recoveryStatus === 'success' && (
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              </div>
              <p className="text-green-600 dark:text-green-400 font-medium">
                Session recovered! You can continue using the application.
              </p>
            </div>
          )}

          {/* Attempt Counter */}
          {recoveryAttempts > 0 && recoveryStatus !== 'success' && (
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
              Recovery attempts: {recoveryAttempts}/3
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default SessionRecovery