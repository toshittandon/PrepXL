import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { createAccount } from '../../services/appwrite/auth.js'
import { setUser, setSession, setError, setLoading } from '../../store/slices/authSlice.js'
import Button from '../common/Button.jsx'
import ErrorMessage from '../common/ErrorMessage.jsx'

const SignupForm = ({ onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const dispatch = useDispatch()
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    mode: 'onBlur'
  })

  const password = watch('password')

  const onSubmit = async (data) => {
    try {
      dispatch(setLoading(true))
      dispatch(setError(null))
      
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
    } finally {
      dispatch(setLoading(false))
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
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
            {...register('name', {
              required: 'Full name is required',
              minLength: {
                value: 2,
                message: 'Name must be at least 2 characters'
              },
              maxLength: {
                value: 50,
                message: 'Name must be less than 50 characters'
              }
            })}
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
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
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
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters'
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
              }
            })}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
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
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: value => value === password || 'Passwords do not match'
            })}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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