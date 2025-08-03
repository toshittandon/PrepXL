import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { signInWithEmail } from '../../services/appwrite/auth.js'
import { setUser, setSession, setError, setLoading } from '../../store/slices/authSlice.js'
import Button from '../common/Button.jsx'
import ErrorMessage from '../common/ErrorMessage.jsx'

const LoginForm = ({ onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false)
  const dispatch = useDispatch()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    mode: 'onBlur'
  })

  const onSubmit = async (data) => {
    try {
      dispatch(setLoading(true))
      dispatch(setError(null))
      
      const session = await signInWithEmail({
        email: data.email,
        password: data.password
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
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters'
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