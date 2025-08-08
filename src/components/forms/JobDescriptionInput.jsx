import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Clipboard, AlertCircle } from 'lucide-react'

const JobDescriptionInput = ({
  value = '',
  onChange,
  placeholder = 'Paste the job description here...',
  minLength = 50,
  maxLength = 5000,
  required = true,
  className = '',
  error: externalError = ''
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const [internalError, setInternalError] = useState('')
  
  // Use external error if provided, otherwise use internal error
  const error = externalError || internalError

  const characterCount = value.length
  const isValid = characterCount >= minLength && characterCount <= maxLength
  const isNearLimit = characterCount > maxLength * 0.9

  const handleChange = (e) => {
    const newValue = e.target.value
    
    // Clear previous internal errors
    setInternalError('')
    
    // Validate length
    if (newValue.length > maxLength) {
      setInternalError(`Job description cannot exceed ${maxLength} characters`)
      return
    }
    
    onChange(newValue)
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        if (text.length > maxLength) {
          setInternalError(`Pasted content exceeds ${maxLength} character limit`)
          return
        }
        onChange(text)
        setInternalError('')
      }
    } catch (err) {
      setInternalError('Unable to access clipboard. Please paste manually.')
    }
  }

  const getCharacterCountColor = () => {
    if (characterCount < minLength) {
      return 'text-gray-400 dark:text-gray-500'
    }
    if (isNearLimit) {
      return 'text-yellow-600 dark:text-yellow-400'
    }
    if (characterCount >= maxLength) {
      return 'text-red-600 dark:text-red-400'
    }
    return 'text-green-600 dark:text-green-400'
  }

  const getValidationMessage = () => {
    if (characterCount === 0) {
      return `Please enter a job description (minimum ${minLength} characters)`
    }
    if (characterCount < minLength) {
      return `Please add ${minLength - characterCount} more characters for better analysis`
    }
    if (characterCount >= maxLength) {
      return 'Character limit reached'
    }
    return ''
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Header with paste button */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Job Description
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        </div>
        
        <button
          type="button"
          onClick={handlePaste}
          className="flex items-center space-x-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
        >
          <Clipboard className="w-3 h-3" />
          <span>Paste</span>
        </button>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          rows={8}
          className={`
            w-full px-4 py-3 border rounded-xl resize-none transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900
            placeholder-gray-400 dark:placeholder-gray-500
            bg-white dark:bg-gray-800 text-gray-900 dark:text-white
            ${error 
              ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
              : isFocused
                ? 'border-primary-500 focus:border-primary-500 focus:ring-primary-500'
                : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500'
            }
          `}
        />
        
        {/* Character count overlay */}
        <div className="absolute bottom-3 right-3">
          <span className={`text-xs font-medium ${getCharacterCountColor()}`}>
            {characterCount}/{maxLength}
          </span>
        </div>
      </div>

      {/* Validation messages and helper text */}
      <div className="mt-2 space-y-1">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-1 text-sm text-red-600 dark:text-red-400"
          >
            <AlertCircle className="w-3 h-3" />
            <span>{error}</span>
          </motion.div>
        )}
        
        {!error && getValidationMessage() && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-sm ${
              characterCount < minLength 
                ? 'text-gray-500 dark:text-gray-400' 
                : 'text-green-600 dark:text-green-400'
            }`}
          >
            {getValidationMessage()}
          </motion.div>
        )}
        
        {!error && !getValidationMessage() && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Provide a detailed job description for more accurate resume analysis and keyword matching.
          </p>
        )}
      </div>

      {/* Progress indicator for minimum length */}
      {characterCount > 0 && characterCount < minLength && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Minimum length for analysis</span>
            <span>{Math.round((characterCount / minLength) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
            <motion.div
              className="bg-primary-600 h-1 rounded-full transition-all duration-300"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((characterCount / minLength) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default JobDescriptionInput