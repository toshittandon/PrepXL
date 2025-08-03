import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { signInWithOAuth } from '../../services/appwrite/auth.js'
import { setError, setLoading } from '../../store/slices/authSlice.js'
import Button from '../common/Button.jsx'

// OAuth provider icons as SVG components
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

const LinkedInIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

const OAuthButtons = ({ mode = 'signin' }) => {
  const [loadingProvider, setLoadingProvider] = useState(null)
  const dispatch = useDispatch()

  const handleOAuthSignIn = async (provider) => {
    try {
      setLoadingProvider(provider)
      dispatch(setError(null))
      
      const currentUrl = window.location.origin
      const successUrl = `${currentUrl}/auth/callback`
      const failureUrl = `${currentUrl}/auth/error`
      
      await signInWithOAuth(provider, successUrl, failureUrl)
      
      // The OAuth flow will redirect the user, so we don't need to handle success here
    } catch (error) {
      dispatch(setError(error.message))
      setLoadingProvider(null)
    }
  }

  const buttonText = mode === 'signin' ? 'Sign in with' : 'Sign up with'

  return (
    <div className="space-y-3">
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
            Or continue with
          </span>
        </div>
      </div>

      {/* OAuth Buttons */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Google OAuth Button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full flex items-center justify-center space-x-2"
            onClick={() => handleOAuthSignIn('google')}
            loading={loadingProvider === 'google'}
            disabled={loadingProvider !== null}
          >
            {loadingProvider === 'google' ? (
              <span>Connecting...</span>
            ) : (
              <>
                <GoogleIcon />
                <span className="hidden sm:inline">{buttonText} Google</span>
                <span className="sm:hidden">Google</span>
              </>
            )}
          </Button>
        </motion.div>

        {/* LinkedIn OAuth Button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full flex items-center justify-center space-x-2"
            onClick={() => handleOAuthSignIn('linkedin')}
            loading={loadingProvider === 'linkedin'}
            disabled={loadingProvider !== null}
          >
            {loadingProvider === 'linkedin' ? (
              <span>Connecting...</span>
            ) : (
              <>
                <LinkedInIcon />
                <span className="hidden sm:inline">{buttonText} LinkedIn</span>
                <span className="sm:hidden">LinkedIn</span>
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

export default OAuthButtons