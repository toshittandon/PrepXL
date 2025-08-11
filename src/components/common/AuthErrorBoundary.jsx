import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import SessionRecovery from './SessionRecovery.jsx'
import { checkSessionValidity } from '../../utils/sessionValidator.js'

const AuthErrorBoundary = ({ children }) => {
  const [showSessionRecovery, setShowSessionRecovery] = useState(false)
  const [authError, setAuthError] = useState(null)
  const { user } = useSelector(state => state.auth)

  // Listen for authentication errors globally
  useEffect(() => {
    const handleAuthError = (event) => {
      if (event.detail && (
        event.detail.code === 401 || 
        event.detail.message?.includes('Authentication required') ||
        event.detail.message?.includes('User not authenticated')
      )) {
        setAuthError(event.detail)
        setShowSessionRecovery(true)
      }
    }

    // Listen for custom auth error events
    window.addEventListener('authError', handleAuthError)
    
    // Listen for unhandled promise rejections that might be auth errors
    const handleUnhandledRejection = (event) => {
      if (event.reason && (
        event.reason.code === 401 ||
        event.reason.message?.includes('Authentication required') ||
        event.reason.message?.includes('User not authenticated')
      )) {
        setAuthError(event.reason)
        setShowSessionRecovery(true)
        event.preventDefault() // Prevent the error from being logged to console
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('authError', handleAuthError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  // Periodically check session validity if user is logged in
  useEffect(() => {
    if (!user) return

    const checkSession = async () => {
      try {
        const sessionCheck = await checkSessionValidity()
        if (!sessionCheck.valid && sessionCheck.code === 401) {
          setAuthError(sessionCheck)
          setShowSessionRecovery(true)
        }
      } catch (error) {
        // Ignore errors in background session checks
      }
    }

    // Check session every 5 minutes
    const interval = setInterval(checkSession, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [user])

  const handleSessionRecovered = (sessionData) => {
    setAuthError(null)
    setShowSessionRecovery(false)
  }

  const handleCloseSessionRecovery = () => {
    setShowSessionRecovery(false)
    setAuthError(null)
  }

  return (
    <>
      {children}
      <SessionRecovery
        isVisible={showSessionRecovery}
        onClose={handleCloseSessionRecovery}
        onRecovered={handleSessionRecovered}
        autoRetry={true}
        showManualOptions={true}
      />
    </>
  )
}

// Utility function to dispatch auth errors globally
export const dispatchAuthError = (error) => {
  const authErrorEvent = new CustomEvent('authError', {
    detail: error
  })
  window.dispatchEvent(authErrorEvent)
}

export default AuthErrorBoundary