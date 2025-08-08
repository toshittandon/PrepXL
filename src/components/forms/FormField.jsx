import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import ErrorMessage from '../common/ErrorMessage.jsx'

/**
 * Reusable form field component with validation, animations, and accessibility
 */
const FormField = ({
  label,
  name,
  type = 'text',
  placeholder,
  register,
  error,
  required = false,
  disabled = false,
  className = '',
  icon: Icon,
  helpText,
  showValidation = true,
  autoComplete,
  children,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const hasError = !!error
  const isPasswordField = type === 'password'
  const inputType = isPasswordField && showPassword ? 'text' : type

  const fieldId = `field-${name}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`w-full ${className}`}
    >
      {/* Label */}
      {label && (
        <label 
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Icon */}
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}

        {/* Input Field */}
        {children || (
          <input
            id={fieldId}
            type={inputType}
            autoComplete={autoComplete}
            disabled={disabled}
            placeholder={placeholder}
            className={`
              block w-full px-3 py-3 border rounded-xl shadow-sm
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
              transition-colors duration-200
              ${Icon ? 'pl-10' : ''}
              ${isPasswordField ? 'pr-12' : ''}
              ${hasError 
                ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300 dark:border-gray-600'
              }
              ${disabled 
                ? 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              }
            `}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...register(name)}
            {...props}
          />
        )}

        {/* Password Toggle */}
        {isPasswordField && (
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
        )}

        {/* Validation Icon */}
        {showValidation && !isPasswordField && isFocused && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {hasError ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-1">
          <ErrorMessage message={error.message} variant="inline" />
        </div>
      )}

      {/* Help Text */}
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}
    </motion.div>
  )
}

/**
 * Select field component with validation
 */
export const SelectField = ({
  label,
  name,
  options = [],
  placeholder = 'Select an option',
  register,
  error,
  required = false,
  disabled = false,
  className = '',
  helpText,
  ...props
}) => {
  const fieldId = `select-${name}`
  const hasError = !!error

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`w-full ${className}`}
    >
      {/* Label */}
      {label && (
        <label 
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Select Field */}
      <select
        id={fieldId}
        disabled={disabled}
        className={`
          block w-full px-3 py-3 border rounded-xl shadow-sm
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          transition-colors duration-200
          ${hasError 
            ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
            : 'border-gray-300 dark:border-gray-600'
          }
          ${disabled 
            ? 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
          }
        `}
        {...register(name)}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Error Message */}
      {error && (
        <div className="mt-1">
          <ErrorMessage message={error.message} variant="inline" />
        </div>
      )}

      {/* Help Text */}
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}
    </motion.div>
  )
}

/**
 * Textarea field component with validation
 */
export const TextareaField = ({
  label,
  name,
  placeholder,
  register,
  error,
  required = false,
  disabled = false,
  className = '',
  helpText,
  rows = 4,
  maxLength,
  showCharacterCount = false,
  ...props
}) => {
  const [value, setValue] = useState('')
  const fieldId = `textarea-${name}`
  const hasError = !!error

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`w-full ${className}`}
    >
      {/* Label */}
      {label && (
        <label 
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Textarea Container */}
      <div className="relative">
        <textarea
          id={fieldId}
          rows={rows}
          disabled={disabled}
          placeholder={placeholder}
          className={`
            block w-full px-3 py-3 border rounded-xl shadow-sm resize-none
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            transition-colors duration-200
            ${hasError 
              ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 dark:border-gray-600'
            }
            ${disabled 
              ? 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            }
          `}
          onChange={(e) => setValue(e.target.value)}
          {...register(name)}
          {...props}
        />

        {/* Character Count */}
        {showCharacterCount && maxLength && (
          <div className="absolute bottom-3 right-3">
            <span className={`text-xs font-medium ${
              value.length > maxLength * 0.9 
                ? 'text-yellow-600 dark:text-yellow-400' 
                : 'text-gray-400 dark:text-gray-500'
            }`}>
              {value.length}/{maxLength}
            </span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-1">
          <ErrorMessage message={error.message} variant="inline" />
        </div>
      )}

      {/* Help Text */}
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}
    </motion.div>
  )
}

export default FormField