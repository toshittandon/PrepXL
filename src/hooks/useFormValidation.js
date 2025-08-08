import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useState, useCallback } from 'react'

/**
 * Enhanced form hook with Yup validation, error handling, and loading states
 * @param {Object} options - Configuration options
 * @param {Object} options.schema - Yup validation schema
 * @param {Object} options.defaultValues - Default form values
 * @param {string} options.mode - Validation mode ('onChange', 'onBlur', 'onSubmit')
 * @param {Function} options.onSubmit - Form submission handler
 * @param {Function} options.onError - Error handler
 * @param {boolean} options.resetOnSuccess - Reset form on successful submission
 * @returns {Object} Form methods and state
 */
export const useFormValidation = ({
  schema,
  defaultValues = {},
  mode = 'onBlur',
  onSubmit,
  onError,
  resetOnSuccess = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const form = useForm({
    resolver: schema ? yupResolver(schema) : undefined,
    defaultValues,
    mode,
    criteriaMode: 'all' // Show all validation errors
  })

  const {
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isValid, isDirty }
  } = form

  // Enhanced submit handler with error handling and loading states
  const handleFormSubmit = useCallback(
    async (data) => {
      if (!onSubmit) return

      setIsSubmitting(true)
      setSubmitError(null)
      setSubmitSuccess(false)
      clearErrors()

      try {
        await onSubmit(data)
        setSubmitSuccess(true)
        
        if (resetOnSuccess) {
          reset()
        }
      } catch (error) {
        const errorMessage = error.message || 'An unexpected error occurred'
        setSubmitError(errorMessage)
        
        // Handle field-specific errors
        if (error.fieldErrors) {
          Object.entries(error.fieldErrors).forEach(([field, message]) => {
            setError(field, {
              type: 'server',
              message
            })
          })
        }

        if (onError) {
          onError(error)
        }
      } finally {
        setIsSubmitting(false)
      }
    },
    [onSubmit, onError, resetOnSuccess, reset, setError, clearErrors]
  )

  // Clear all errors and success states
  const clearAllErrors = useCallback(() => {
    setSubmitError(null)
    setSubmitSuccess(false)
    clearErrors()
  }, [clearErrors])

  // Reset form with optional new default values
  const resetForm = useCallback((newDefaultValues) => {
    reset(newDefaultValues || defaultValues)
    clearAllErrors()
  }, [reset, defaultValues, clearAllErrors])

  // Set server-side field errors
  const setFieldErrors = useCallback((fieldErrors) => {
    Object.entries(fieldErrors).forEach(([field, message]) => {
      setError(field, {
        type: 'server',
        message
      })
    })
  }, [setError])

  return {
    ...form,
    // Enhanced methods
    handleSubmit: handleSubmit(handleFormSubmit),
    resetForm,
    clearAllErrors,
    setFieldErrors,
    
    // State
    isSubmitting,
    submitError,
    submitSuccess,
    isValid,
    isDirty,
    hasErrors: Object.keys(errors).length > 0,
    
    // Computed properties
    canSubmit: isValid && !isSubmitting,
    shouldShowErrors: isDirty || Object.keys(errors).length > 0
  }
}

/**
 * Hook for handling file upload forms with validation
 * @param {Object} options - Configuration options
 * @param {Function} options.onUpload - File upload handler
 * @param {Array} options.acceptedTypes - Accepted file types
 * @param {number} options.maxSize - Maximum file size in bytes
 * @param {boolean} options.multiple - Allow multiple files
 * @returns {Object} File upload methods and state
 */
export const useFileUpload = ({
  onUpload,
  acceptedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = false
}) => {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  // Validate file
  const validateFile = useCallback((file) => {
    const errors = []

    if (!acceptedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not supported`)
    }

    if (file.size > maxSize) {
      errors.push(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }, [acceptedTypes, maxSize])

  // Handle file selection
  const handleFileSelect = useCallback((selectedFiles) => {
    const fileList = Array.from(selectedFiles)
    const validFiles = []
    const errors = []

    fileList.forEach((file) => {
      const validation = validateFile(file)
      if (validation.isValid) {
        validFiles.push(file)
      } else {
        errors.push(`${file.name}: ${validation.errors.join(', ')}`)
      }
    })

    if (errors.length > 0) {
      setUploadError(errors.join('; '))
      return
    }

    setUploadError(null)
    setFiles(multiple ? [...files, ...validFiles] : validFiles)
  }, [files, multiple, validateFile])

  // Handle file upload
  const handleUpload = useCallback(async (additionalData = {}) => {
    if (files.length === 0 || !onUpload) return

    setUploading(true)
    setUploadProgress(0)
    setUploadError(null)

    try {
      const result = await onUpload(files, additionalData, setUploadProgress)
      setFiles([])
      return result
    } catch (error) {
      setUploadError(error.message || 'Upload failed')
      throw error
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [files, onUpload])

  // Remove file
  const removeFile = useCallback((index) => {
    setFiles(files.filter((_, i) => i !== index))
    setUploadError(null)
  }, [files])

  // Clear all files
  const clearFiles = useCallback(() => {
    setFiles([])
    setUploadError(null)
    setUploadProgress(0)
  }, [])

  // Drag and drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files)
    }
  }, [handleFileSelect])

  return {
    files,
    uploading,
    uploadProgress,
    uploadError,
    dragActive,
    handleFileSelect,
    handleUpload,
    removeFile,
    clearFiles,
    validateFile,
    // Drag and drop handlers
    dragHandlers: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop
    }
  }
}

/**
 * Hook for handling search and filter forms
 * @param {Object} options - Configuration options
 * @param {Function} options.onSearch - Search handler
 * @param {number} options.debounceMs - Debounce delay in milliseconds
 * @param {Object} options.initialFilters - Initial filter values
 * @returns {Object} Search methods and state
 */
export const useSearchForm = ({
  onSearch,
  debounceMs = 300,
  initialFilters = {}
}) => {
  const [filters, setFilters] = useState(initialFilters)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)

  // Debounced search effect
  const [searchTimeout, setSearchTimeout] = useState(null)

  const handleSearch = useCallback(async (newFilters) => {
    if (!onSearch) return

    setIsSearching(true)
    setSearchError(null)

    try {
      await onSearch(newFilters)
    } catch (error) {
      setSearchError(error.message || 'Search failed')
    } finally {
      setIsSearching(false)
    }
  }, [onSearch])

  const updateFilters = useCallback((newFilters) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      handleSearch(updatedFilters)
    }, debounceMs)

    setSearchTimeout(timeout)
  }, [filters, searchTimeout, debounceMs, handleSearch])

  const clearFilters = useCallback(() => {
    setFilters(initialFilters)
    handleSearch(initialFilters)
  }, [initialFilters, handleSearch])

  return {
    filters,
    isSearching,
    searchError,
    updateFilters,
    clearFilters,
    handleSearch: () => handleSearch(filters)
  }
}

export default useFormValidation