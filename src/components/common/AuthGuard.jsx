import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { getCurrentUserWithProfile } from '../../services/appwrite/auth.js'
import { checkSessionValidity } from '../../utils/sessionValidator.js'
import { setUser, setSession, setLoading } from '../../store/slices/authSlice.js'
import LoadingSpinner from './LoadingSpinner.jsx'

const AuthGuard = ({ 
  children, 
  requireAuth = true, 
  requireAdmin = false,
  redirectTo = '/login'
}) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const { user, loading } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const location = useLocation()

  useEffect(() => {
    const initializeAuth = async () => {
      if (user || !requireAuth) {
        setIsInitialized(true)
        return
      }

      try {
        dispatch(setLoading(true))
        
        // Use session validation instead of direct auth calls
        const sessionData = await checkSessionValidity()
        
        if (sessionData.valid) {
          dispatch(setUser(sessionData.user))
          dispatch(setSession(sessionData.session))
        }
      } catch (error) {
        // Clear any stale user data on authentication errors
        if (error.code === 401 || error.message?.includes('Authentication required')) {
          dispatch(setUser(null))
          dispatch(setSession(null))
        } else {
          console.error('Auth initialization error:', error)
        }
      } finally {
        dispatch(setLoading(false))
        setIsInitialized(true)
      }
    }

    initializeAuth()
  }, [user, requireAuth, dispatch])

  // Show loading spinner while initializing
  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading...
          </p>
        </div>
      </div>
    )
  }

  // Check authentication requirement
  if (requireAuth && !user) {
    // Save the attempted location for redirect after login
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location.pathname }} 
        replace 
      />
    )
  }

  // Check admin requirement
  if (requireAdmin && (!user || !user.profile?.isAdmin)) {
    // Redirect non-admin users to dashboard
    return <Navigate to="/dashboard" replace />
  }

  // If user is authenticated but trying to access auth pages, redirect to dashboard
  if (!requireAuth && user && (location.pathname === '/login' || location.pathname === '/signup')) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default AuthGuard