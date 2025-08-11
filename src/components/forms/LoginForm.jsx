import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, RefreshCw, AlertTriangle } from 'lucide-react'
import { signInWithEmail, signOutFromAllSessions } from '../../services/appwrite/auth.js'
import { 
  setUser, 
  setSession, 
  setError, 
  setLoading,
  sessionConflictStart,
  sessionConflictResolved,
  sessionConflictFailed,
  clearSessionConflictResolution,
  selectSessionConflictResolution,
  selectIsSessionConflictInProgress,
  selectSessionConflictMethod
} from '../../store/slices/authSlice.js'
import Button from '../common/Button.jsx'
import ErrorMessage from '../common/ErrorMessage.jsx'
import SuccessMessage from '../common/SuccessMessage.jsx'
import { useFormValidation } from '../../hooks/useFormValidation.js'
import { loginSchema } from '../../utils/validationSchemas.js'
import { 
  getSessionConflictUserMessage, 
  SESSION_CONFLICT_TYPES,
  createSessionConflictError 
} from '../../utils/errorHandling.js'

const LoginForm = ({ onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false)
  const [manualClearAttempted, setManualClearAttempted] = useState(false)
  const dispatch = useDispatch()
  
  // Session conflict resolution state
  const sessionConflictResolution = useSelector(selectSessionConflictResolution)
  const isSessionConflictInProgress = useSelector(selectIsSessionConflictInProgress)
  const sessionConflictMethod = useSelector(selectSessionConflictMethod)

  // Manual session clearing handler
  const handleManualSessionClear = async () => {
    try {
      setManualClearAttempted(true)
      dispatch(setLoading(true))
      dispatch(setError(null))
      dispatch(sessionConflictStart({ method: 'ALL' }))
      
      await signOutFromAllSessions()
      
      dispatch(sessionConflictResolved({ method: 'ALL' }))
      dispatch(setError(null))
      
      // Clear the manual clear flag after successful clearing
      setTimeout(() => {
        setManualClearAttempted(false)
        dispatch(clearSessionConflictResolution())
      }, 2000)
      
    } catch (error) {
      dispatch(sessionConflictFailed())
      dispatch(setError('Failed to clear all sessions. Please try again or contact support.'))
      setManualClearAttempted(false)
    } finally {
      dispatch(setLoading(false))
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    isSubmitting,
    submitError,
    submitSuccess,
    clearAllErrors,
    resetForm
  } = useFormValidation({
    schema: loginSchema,
    mode: 'onBlur',
    onSubmit: async (data) => {
      dispatch(setLoading(true))
      dispatch(setError(null))
      dispatch(clearSessionConflictResolution())
      
      try {
        const session = await signInWithEmail({
          email: data.email,
          password: data.password,
          dispatch: dispatch
        })
        
        dispatch(setSession(session))
        
        // Get user profile data
        const { getCurrentUserWithProfile } = await import('../../services/appwrite/auth.js')
        const userWithProfile = await getCurrentUserWithProfile()
        dispatch(setUser(userWithProfile))
        
        if (onSuccess) {
          onSuccess(userWithProfile)
        }
      } catch (error) {
        // Handle session conflict errors specifically
        if (error.isSessionConflict) {
          const conflictMessage = getSessionConflictUserMessage(error)
          dispatch(setError(conflictMessage.message))
          
          // Set appropriate session conflict state
          if (error.conflictType === SESSION_CONFLICT_TYPES.ALL_SESSIONS_CLEAR_FAILED) {
            dispatch(sessionConflictFailed())
          }
        } else {
          dispatch(setError(error.message))
        }
        throw error // Re-throw to be handled by useFormValidation
      } finally {
        dispatch(setLoading(false))
      }
    },
    onError: (error) => {
      // Handle specific authentication errors
      if (error.isSessionConflict) {
        const conflictMessage = getSessionConflictUserMessage(error)
        dispatch(setError(conflictMessage.message))
      } else if (error.message?.includes('Invalid credentials')) {
        dispatch(setError('Invalid email or password. Please try again.'))
      } else if (error.message?.includes('Too many requests')) {
        dispatch(setError('Too many login attempts. Please try again later.'))
      } else {
        dispatch(setError(error.message || 'Login failed. Please try again.'))
      }
    }
  })

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Success Message */}
      {submitSuccess && (
        <SuccessMessage 
          message="Login successful! Redirecting..."
          autoHide
          autoHideDelay={2000}
        />
      )}

      {/* Session Conflict Resolution Status */}
      {isSessionConflictInProgress && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
        >
          <div className="flex items-center space-x-3">
            <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Resolving Session Conflict
              </h4>
              <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                {sessionConflictMethod === 'CURRENT' 
                  ? 'Clearing current session and logging you in...'
                  : sessionConflictMethod === 'ALL'
                  ? 'Clearing all sessions for security and logging you in...'
                  : 'Detecting session conflict and resolving...'
                }
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Session Conflict Resolution Success */}
      {sessionConflictResolution.resolved && !isSessionConflictInProgress && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4"
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                Session Conflict Resolved
              </h4>
              <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                {sessionConflictMethod === 'ALL' 
                  ? 'All sessions cleared successfully. You can now log in.'
                  : 'Previous session cleared successfully. You can now log in.'
                }
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Error Message with Session Conflict Recovery Options */}
      {submitError && (
        <ErrorMessage 
          message={submitError}
          onClose={clearAllErrors}
          actions={
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetForm}
              >
                Try Again
              </Button>
              {/* Show manual session clear option for session conflict failures */}
              {submitError.includes('session conflict') || submitError.includes('Session conflict') ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleManualSessionClear}
                  loading={manualClearAttempted}
                  disabled={manualClearAttempted}
                  className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-600 dark:hover:bg-orange-900/20"
                >
                  {manualClearAttempted ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Clearing Sessions...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Clear All Sessions
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          }
        />
      )}

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={`
              block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm
              placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
              transition-colors duration-200
              ${errors.email 
                ? 'border-red-300 dark:border-red-600' 
                : 'border-gray-300 dark:border-gray-600'
              }
              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            `}
            placeholder="Enter your email"
            {...register('email')}
          />
        </div>
        {errors.email && (
          <ErrorMessage message={errors.email.message} variant="inline" className="mt-1" />
        )}
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className={`
              block w-full pl-10 pr-12 py-3 border rounded-xl shadow-sm
              placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
              transition-colors duration-200
              ${errors.password 
                ? 'border-red-300 dark:border-red-600' 
                : 'border-gray-300 dark:border-gray-600'
              }
              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            `}
            placeholder="Enter your password"
            {...register('password')}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
            )}
          </button>
        </div>
        {errors.password && (
          <ErrorMessage message={errors.password.message} variant="inline" className="mt-1" />
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        loading={isSubmitting}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Signing In...' : 'Sign In'}
      </Button>
    </motion.form>
  )
}

export default LoginForm