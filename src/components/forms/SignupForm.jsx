import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { createAccount } from '../../services/appwrite/auth.js'
import { setUser, setSession, setError, setLoading } from '../../store/slices/authSlice.js'
import Button from '../common/Button.jsx'
import ErrorMessage from '../common/ErrorMessage.jsx'
import SuccessMessage from '../common/SuccessMessage.jsx'
import { useFormValidation } from '../../hooks/useFormValidation.js'
import { signupSchema } from '../../utils/validationSchemas.js'

const SignupForm = ({ onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const dispatch = useDispatch()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    isSubmitting,
    submitError,
    submitSuccess,
    clearAllErrors,
    resetForm
  } = useFormValidation({
    schema: signupSchema,
    mode: 'onBlur',
    onSubmit: async (data) => {
      dispatch(setLoading(true))
      dispatch(setError(null))
      
      try {
        const result = await createAccount({
          email: data.email,
          password: data.password,
          name: data.name
        })
        
        // Sign in the user after successful registration
        const { signInWithEmail } = await import('../../services/appwrite/auth.js')
        const session = await signInWithEmail({
          email: data.email,
          password: data.password
        })
        
        dispatch(setSession(session))
        dispatch(setUser({
          ...result.account,
          profile: result.profile
        }))
        
        if (onSuccess) {
          onSuccess({
            ...result.account,
            profile: result.profile
          })
        }
      } catch (error) {
        dispatch(setError(error.message))
        throw error // Re-throw to be handled by useFormValidation
      } finally {
        dispatch(setLoading(false))
      }
    },
    onError: (error) => {
      // Handle specific signup errors
      if (error.message?.includes('already exists')) {
        dispatch(setError('An account with this email already exists. Please try logging in instead.'))
      } else if (error.message?.includes('password')) {
        dispatch(setError('Password does not meet requirements. Please try a stronger password.'))
      } else {
        dispatch(setError(error.message || 'Account creation failed. Please try again.'))
      }
    }
  })

  const password = watch('password')

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
          message="Account created successfully! Redirecting..."
          autoHide
          autoHideDelay={2000}
        />
      )}

      {/* Error Message */}
      {submitError && (
        <ErrorMessage 
          message={submitError}
          onClose={clearAllErrors}
          actions={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetForm}
            >
              Try Again
            </Button>
          }
        />
      )}

      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Full Name
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="name"
            type="text"
            autoComplete="name"
            className={`
              block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm
              placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
              transition-colors duration-200
              ${errors.name 
                ? 'border-red-300 dark:border-red-600' 
                : 'border-gray-300 dark:border-gray-600'
              }
              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            `}
            placeholder="Enter your full name"
            {...register('name')}
          />
        </div>
        {errors.name && (
          <ErrorMessage message={errors.name.message} variant="inline" className="mt-1" />
        )}
      </div>

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
            autoComplete="new-password"
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
            placeholder="Create a password"
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

      {/* Confirm Password Field */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className={`
              block w-full pl-10 pr-12 py-3 border rounded-xl shadow-sm
              placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
              transition-colors duration-200
              ${errors.confirmPassword 
                ? 'border-red-300 dark:border-red-600' 
                : 'border-gray-300 dark:border-gray-600'
              }
              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            `}
            placeholder="Confirm your password"
            {...register('confirmPassword')}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <ErrorMessage message={errors.confirmPassword.message} variant="inline" className="mt-1" />
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
        {isSubmitting ? 'Creating Account...' : 'Create Account'}
      </Button>
    </motion.form>
  )
}

export default SignupForm