import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { getCurrentUserWithProfile, getCurrentSession } from '../../services/appwrite/auth.js'
import { setUser, setSession, setError, setLoading } from '../../store/slices/authSlice.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import { useTheme } from '../../contexts/ThemeContext'

const OAuthCallback = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { theme } = useTheme()

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        dispatch(setLoading(true))
        dispatch(setError(null))

        // Get the current session after OAuth redirect
        const session = await getCurrentSession()
        if (!session) {
          throw new Error('No session found after OAuth authentication')
        }

        dispatch(setSession(session))

        // Get user with profile data
        const userWithProfile = await getCurrentUserWithProfile()
        if (!userWithProfile) {
          throw new Error('Failed to get user profile after OAuth authentication')
        }

        dispatch(setUser(userWithProfile))

        // Check if user needs to complete profile setup
        if (!userWithProfile.profile?.targetRole || !userWithProfile.profile?.targetIndustry) {
          navigate('/profile/setup')
        } else {
          navigate('/dashboard')
        }
      } catch (error) {
        console.error('OAuth callback error:', error)
        dispatch(setError('Authentication failed. Please try again.'))
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } finally {
        dispatch(setLoading(false))
      }
    }

    handleOAuthCallback()
  }, [dispatch, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="mb-8">
          <img 
            src={theme === 'dark' ? "/logo/logolight.png" : "/logo/logodark.png"} 
            alt="PrepXL Logo" 
            className="h-12 w-auto mx-auto mb-4"
          />
        </div>
        <LoadingSpinner size="xl" color="primary" />
        <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
          Completing Authentication
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Please wait while we set up your PrepXL account...
        </p>
      </div>
    </div>
  )
}

export default OAuthCallback