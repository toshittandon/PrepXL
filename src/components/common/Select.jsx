import { forwardRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, AlertCircle, CheckCircle, Search } from 'lucide-react'

const Select = forwardRef(({
  label,
  placeholder = 'Select an option...',
  value,
  onChange,
  onBlur,
  onFocus,
  options = [],
  error,
  success,
  helperText,
  required = false,
  disabled = false,
  searchable = false,
  multiple = false,
  className = '',
  size = 'md',
  variant = 'default',
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFocused, setIsFocused] = useState(false)

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
    `,
    filled: `
      border-0 bg-gray-100 dark:bg-gray-700
      text-gray-900 dark:text-white
    `
  }

  const getStateClasses = () => {
    if (error) {
      return 'border-red-500 dark:border-red-400 focus:border-red-500 focus:ring-red-500'
    }
    if (success) {
      return 'border-green-500 dark:border-green-400 focus:border-green-500 focus:ring-green-500'
    }
    if (isFocused || isOpen) {
      return 'border-primary-500 focus:border-primary-500 focus:ring-primary-500'
    }
    return 'focus:border-primary-500 focus:ring-primary-500'
  }

  // Filter options based on search term
  const filteredOptions = searchable && searchTerm
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options

  // Get display value
  const getDisplayValue = () => {
    if (multiple && Array.isArray(value)) {
      if (value.length === 0) return placeholder
      if (value.length === 1) {
        const option = options.find(opt => opt.value === value[0])
        return option?.label || value[0]
      }
      return `${value.length} items selected`
    }
    
    if (value) {
      const option = options.find(opt => opt.value === value)
      return option?.label || value
    }
    
    return placeholder
  }

  const handleToggle = () => {
    if (disabled) return
    setIsOpen(!isOpen)
    setIsFocused(!isOpen)
  }

  const handleOptionClick = (optionValue) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : []
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue]
      onChange?.(newValues)
    } else {
      onChange?.(optionValue)
      setIsOpen(false)
      setIsFocused(false)
    }
    setSearchTerm('')
  }

  const handleBlur = (e) => {
    // Delay to allow option clicks to register
    setTimeout(() => {
      setIsOpen(false)
      setIsFocused(false)
      onBlur?.(e)
    }, 150)
  }

  const handleFocus = (e) => {
    setIsFocused(true)
    onFocus?.(e)
  }

  const isSelected = (optionValue) => {
    if (multiple && Array.isArray(value)) {
      return value.includes(optionValue)
    }
    return value === optionValue
  }

  return (
    <div className={`relative w-full ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Select Button */}
      <button
        ref={ref}
        type="button"
        onClick={handleToggle}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        className={`
          w-full text-left rounded-xl transition-all duration-200 cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-between
          ${variants[variant]}
          ${sizes[size]}
          ${getStateClasses()}
        `}
        {...props}
      >
        <span className={`block truncate ${!value ? 'text-gray-500 dark:text-gray-400' : ''}`}>
          {getDisplayValue()}
        </span>
        
        <div className="flex items-center space-x-2">
          {/* State Icons */}
          {error && <AlertCircle className="w-4 h-4 text-red-500" />}
          {success && !error && <CheckCircle className="w-4 h-4 text-green-500" />}
          
          {/* Chevron */}
          <ChevronDown 
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg max-h-60 overflow-auto"
          >
            {/* Search Input */}
            {searchable && (
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search options..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}

            {/* Options */}
            <div className="py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No options found' : 'No options available'}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleOptionClick(option.value)}
                    className={`
                      w-full text-left px-4 py-2 text-sm transition-colors duration-150
                      hover:bg-gray-100 dark:hover:bg-gray-700
                      focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700
                      ${isSelected(option.value) 
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                        : 'text-gray-900 dark:text-white'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      {isSelected(option.value) && (
                        <CheckCircle className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

Select.displayName = 'Select'

export default Select