import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

const Input = forwardRef(({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  success,
  helperText,
  required = false,
  disabled = false,
  className = '',
  inputClassName = '',
  size = 'md',
  variant = 'default',
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const inputType = type === 'password' && showPassword ? 'text' : type

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  const variants = {
    default: `
      border border-gray-300 dark:border-gray-600
      bg-white dark:bg-gray-800
      text-gray-900 dark:text-white
      placeholder-gray-500 dark:placeholder-gray-400
    `,
    filled: `
      border-0 bg-gray-100 dark:bg-gray-700
      text-gray-900 dark:text-white
      placeholder-gray-500 dark:placeholder-gray-400
    `
  }

  const getStateClasses = () => {
    if (error) {
      return 'border-red-500 dark:border-red-400 focus:border-red-500 focus:ring-red-500'
    }
    if (success) {
      return 'border-green-500 dark:border-green-400 focus:border-green-500 focus:ring-green-500'
    }
    if (isFocused) {
      return 'border-primary-500 focus:border-primary-500 focus:ring-primary-500'
    }
    return 'focus:border-primary-500 focus:ring-primary-500'
  }

  const handleFocus = (e) => {
    setIsFocused(true)
    onFocus?.(e)
  }

  const handleBlur = (e) => {
    setIsFocused(false)
    onBlur?.(e)
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400 dark:text-gray-500">
              {leftIcon}
            </div>
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full rounded-xl transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900
            disabled:opacity-50 disabled:cursor-not-allowed
            ${variants[variant]}
            ${sizes[size]}
            ${getStateClasses()}
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon || showPasswordToggle || error || success ? 'pr-10' : ''}
            ${inputClassName}
          `}
          {...props}
        />

        {/* Right Icons */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {/* Password Toggle */}
          {type === 'password' && showPasswordToggle && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}

          {/* State Icons */}
          {!showPasswordToggle && (
            <>
              {error && (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              {success && !error && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              {rightIcon && !error && !success && (
                <div className="text-gray-400 dark:text-gray-500">
                  {rightIcon}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Helper Text / Error / Success Message */}
      {(helperText || error || success) && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2"
        >
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {error}
            </p>
          )}
          {success && !error && (
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" />
              {success}
            </p>
          )}
          {helperText && !error && !success && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {helperText}
            </p>
          )}
        </motion.div>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input