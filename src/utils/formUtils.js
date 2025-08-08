/**
 * Form utility functions for handling common form operations
 */

/**
 * Reset form with optional confirmation
 * @param {Function} resetForm - Form reset function
 * @param {Object} options - Reset options
 * @returns {Promise<boolean>} - Whether the reset was confirmed
 */
export const resetFormWithConfirmation = async (resetForm, options = {}) => {
  const {
    confirmMessage = 'Are you sure you want to reset the form? All unsaved changes will be lost.',
    skipConfirmation = false,
    newDefaultValues = null
  } = options

  if (!skipConfirmation) {
    const confirmed = window.confirm(confirmMessage)
    if (!confirmed) {
      return false
    }
  }

  resetForm(newDefaultValues)
  return true
}

/**
 * Handle form errors and provide user-friendly messages
 * @param {Error} error - The error object
 * @param {Function} setFieldErrors - Function to set field-specific errors
 * @returns {string} - User-friendly error message
 */
export const handleFormError = (error, setFieldErrors) => {
  // Handle validation errors
  if (error.name === 'ValidationError') {
    const fieldErrors = {}
    error.inner?.forEach((err) => {
      fieldErrors[err.path] = err.message
    })
    
    if (setFieldErrors && Object.keys(fieldErrors).length > 0) {
      setFieldErrors(fieldErrors)
    }
    
    return 'Please correct the highlighted fields and try again.'
  }

  // Handle network errors
  if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
    return 'Network error. Please check your connection and try again.'
  }

  // Handle authentication errors
  if (error.status === 401 || error.message?.includes('unauthorized')) {
    return 'Your session has expired. Please log in again.'
  }

  // Handle server errors
  if (error.status >= 500) {
    return 'Server error. Please try again later.'
  }

  // Handle rate limiting
  if (error.status === 429) {
    return 'Too many requests. Please wait a moment and try again.'
  }

  // Handle specific Appwrite errors
  if (error.type) {
    switch (error.type) {
      case 'user_already_exists':
        return 'An account with this email already exists. Please try logging in instead.'
      case 'user_invalid_credentials':
        return 'Invalid email or password. Please check your credentials and try again.'
      case 'user_blocked':
        return 'Your account has been temporarily blocked. Please contact support.'
      case 'document_not_found':
        return 'The requested information could not be found.'
      case 'storage_file_not_found':
        return 'The uploaded file could not be found. Please try uploading again.'
      case 'storage_invalid_file':
        return 'The uploaded file is invalid or corrupted. Please try a different file.'
      default:
        return error.message || 'An unexpected error occurred. Please try again.'
    }
  }

  // Return the original error message or a generic fallback
  return error.message || 'An unexpected error occurred. Please try again.'
}

/**
 * Debounce function for form inputs
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

/**
 * Validate file upload
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result
 */
export const validateFileUpload = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxFiles = 1
  } = options

  const errors = []

  if (!file) {
    errors.push('Please select a file')
    return { isValid: false, errors }
  }

  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`)
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    const allowedExtensions = allowedTypes.map(type => {
      switch (type) {
        case 'application/pdf': return 'PDF'
        case 'application/msword': return 'DOC'
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': return 'DOCX'
        default: return type
      }
    }).join(', ')
    errors.push(`File type not supported. Allowed types: ${allowedExtensions}`)
  }

  // Check file name
  if (file.name.length > 255) {
    errors.push('File name is too long')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Generate form field props for consistent styling
 * @param {Object} options - Field options
 * @returns {Object} - Field props
 */
export const getFieldProps = (options = {}) => {
  const {
    name,
    label,
    type = 'text',
    required = false,
    placeholder,
    helpText,
    icon,
    autoComplete
  } = options

  return {
    name,
    label,
    type,
    required,
    placeholder: placeholder || `Enter ${label?.toLowerCase() || name}`,
    helpText,
    icon,
    autoComplete: autoComplete || (type === 'email' ? 'email' : type === 'password' ? 'current-password' : undefined)
  }
}

/**
 * Create form submission handler with loading and error states
 * @param {Function} onSubmit - Submit handler
 * @param {Object} options - Handler options
 * @returns {Function} - Enhanced submit handler
 */
export const createSubmitHandler = (onSubmit, options = {}) => {
  const {
    onSuccess,
    onError,
    resetOnSuccess = false,
    showSuccessMessage = true,
    successMessage = 'Operation completed successfully!'
  } = options

  return async (data, { reset, setError, clearErrors }) => {
    try {
      clearErrors()
      const result = await onSubmit(data)
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      if (resetOnSuccess) {
        reset()
      }
      
      if (showSuccessMessage) {
        // This would integrate with a toast notification system
        console.log(successMessage)
      }
      
      return result
    } catch (error) {
      const errorMessage = handleFormError(error, setError)
      
      if (onError) {
        onError(error, errorMessage)
      }
      
      throw error
    }
  }
}

/**
 * Sanitize form data before submission
 * @param {Object} data - Form data
 * @param {Array} fieldsToTrim - Fields to trim whitespace
 * @returns {Object} - Sanitized data
 */
export const sanitizeFormData = (data, fieldsToTrim = []) => {
  const sanitized = { ...data }
  
  // Trim specified fields
  fieldsToTrim.forEach(field => {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitized[field].trim()
    }
  })
  
  // Remove empty strings and convert to null
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === '') {
      sanitized[key] = null
    }
  })
  
  return sanitized
}

export default {
  resetFormWithConfirmation,
  handleFormError,
  debounce,
  validateFileUpload,
  formatFileSize,
  getFieldProps,
  createSubmitHandler,
  sanitizeFormData
}