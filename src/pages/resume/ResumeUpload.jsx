
import { useState, useCallback, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle,
  Eye,
  ArrowLeft
} from 'lucide-react'

import Button from '../../components/common/Button.jsx'
import ProgressBar from '../../components/common/ProgressBar.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import SuccessMessage from '../../components/common/SuccessMessage.jsx'
import JobDescriptionInput from '../../components/forms/JobDescriptionInput.jsx'
// Debug component removed for production

import { validateFile, formatFileSize } from '../../services/appwrite/storage.js'
import { uploadResume, clearUploadState } from '../../store/slices/resumeSlice.js'
import { useFormValidation, useFileUpload } from '../../hooks/useFormValidation.js'
import { resumeUploadSchema } from '../../utils/validationSchemas.js'
import useErrorHandler from '../../hooks/useErrorHandler.js'
import { handleFileUploadError } from '../../utils/apiErrorHandler.js'

const ResumeUpload = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const { uploading, uploadProgress, error } = useSelector(state => state.resume)
  const { user } = useSelector(state => state.auth)

  const [jobDescription, setJobDescription] = useState('')
  const [filePreview, setFilePreview] = useState(null)
  
  const fileInputRef = useRef(null)

  // Error handling hook
  const { handleAsyncOperation, notifySuccess, notifyWarning } = useErrorHandler()

  // File upload hook
  const {
    files,
    uploadError,
    dragActive,
    handleFileSelect,
    removeFile,
    clearFiles,
    dragHandlers
  } = useFileUpload({
    acceptedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  })

  // Form validation hook
  const {
    handleSubmit,
    setValue,
    formState: { errors },
    isSubmitting,
    submitError,
    submitSuccess,
    clearAllErrors,
    resetForm
  } = useFormValidation({
    schema: resumeUploadSchema,
    onSubmit: async (data) => {
      // Enhanced user authentication check
      if (!user) {
        const authError = new Error('User not authenticated. Please log in again.')
        authError.code = 401
        authError.type = 'session_expired'
        
        // Dispatch auth error event for the AuthErrorBoundary to handle
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            const authErrorEvent = new CustomEvent('authError', {
              detail: {
                code: 401,
                message: 'Authentication required. Please log in again.',
                type: 'session_expired',
                context: 'resume_upload'
              }
            })
            window.dispatchEvent(authErrorEvent)
          }, 100)
        }
        
        throw authError
      }

      // Check for user ID in different possible locations
      const userId = user.id || user.$id || user.userId
      if (!userId) {
        const authError = new Error('User ID not found. Please log in again.')
        authError.code = 401
        authError.type = 'invalid_user_data'
        
        // Dispatch auth error event for the AuthErrorBoundary to handle
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            const authErrorEvent = new CustomEvent('authError', {
              detail: {
                code: 401,
                message: 'User authentication data is invalid. Please log in again.',
                type: 'invalid_user_data',
                context: 'resume_upload'
              }
            })
            window.dispatchEvent(authErrorEvent)
          }, 100)
        }
        
        throw authError
      }

      dispatch(clearUploadState())
      
      const result = await dispatch(uploadResume({
        file: data.file,
        jobDescription: data.jobDescription.trim(),
        userId: userId
      })).unwrap()

      // Navigate to analysis page with the resume ID after a brief delay
      setTimeout(() => {
        navigate(`/resume-analysis/${result.resumeId}`)
      }, 1000)
    },
    onError: (error) => {
      console.error('Upload failed:', error)
      
      // Handle authentication errors specifically
      if (error.includes('Authentication required') || 
          error.includes('User not authenticated') ||
          error.includes('session has expired') ||
          error.code === 401) {
        
        // Don't navigate immediately - let the AuthErrorBoundary handle it
        // The SessionRecovery component will provide better UX
        console.log('Authentication error detected, AuthErrorBoundary should handle this')
        return
      }
      
      // For other errors, show them normally
      console.error('Non-auth error:', error)
    }
  })

  // Handle file selection with form integration
  const handleFileSelectWithForm = useCallback((selectedFiles) => {
    const file = selectedFiles[0]
    if (!file) return

    // Create file preview for supported types
    if (file.type === 'application/pdf') {
      const fileUrl = URL.createObjectURL(file)
      setFilePreview({
        type: 'pdf',
        url: fileUrl,
        name: file.name,
        size: formatFileSize(file.size)
      })
    } else {
      setFilePreview({
        type: 'document',
        name: file.name,
        size: formatFileSize(file.size)
      })
    }

    // Update form value
    setValue('file', file)
  }, [setValue])

  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelectWithForm([e.target.files[0]])
    }
  }

  // Remove selected file
  const removeSelectedFile = () => {
    setFilePreview(null)
    setValue('file', null)
    clearAllErrors()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (filePreview?.url) {
      URL.revokeObjectURL(filePreview.url)
    }
  }

  // Handle job description change
  const handleJobDescriptionChange = (value) => {
    setJobDescription(value)
    setValue('jobDescription', value)
  }

  // Handle back navigation
  const handleBack = () => {
    navigate('/dashboard')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Debug components removed for production */}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Resume Upload & Analysis
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Upload your resume and provide a job description to get comprehensive ATS-powered feedback 
              with match scores and improvement suggestions.
            </p>
          </div>
        </div>

        {/* Success Message */}
        {submitSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <SuccessMessage 
              message="Resume uploaded and analysis started! Redirecting to results..."
              autoHide
              autoHideDelay={2000}
            />
          </motion.div>
        )}

        {/* Error Messages */}
        {(submitError || uploadError || error) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <ErrorMessage 
              message={submitError || uploadError || error}
              onClose={clearAllErrors}
              actions={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    resetForm()
                    clearFiles()
                    setFilePreview(null)
                    setJobDescription('')
                  }}
                >
                  Reset Form
                </Button>
              }
            />
          </motion.div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* File Upload Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              1. Upload Your Resume
            </h2>
            
            {!filePreview ? (
              <div
                className={`
                  relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
                  ${dragActive 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
                  }
                  ${errors.file ? 'border-red-300 dark:border-red-600' : ''}
                `}
                {...dragHandlers}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileInputChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <Upload className={`w-12 h-12 mx-auto mb-4 ${
                  dragActive ? 'text-primary-600' : 'text-gray-400'
                }`} />
                
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {dragActive ? 'Drop your resume here' : 'Upload your resume'}
                </h3>
                
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Drag and drop your file here, or click to browse
                </p>
                
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Supported formats: PDF, DOC, DOCX (Max 10MB)
                </p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border border-gray-200 dark:border-gray-600 rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {filePreview?.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {filePreview?.size}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {filePreview?.type === 'pdf' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(filePreview.url, '_blank')}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeSelectedFile}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* File validation error */}
            {errors.file && (
              <ErrorMessage message={errors.file.message} variant="inline" className="mt-2" />
            )}
          </div>

          {/* Job Description Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              2. Job Description
            </h2>
            <JobDescriptionInput
              value={jobDescription}
              onChange={handleJobDescriptionChange}
              placeholder="Paste the job description here to get targeted analysis and match scoring..."
              error={errors.jobDescription?.message}
            />
            
            {/* Job description validation error */}
            {errors.jobDescription && (
              <ErrorMessage message={errors.jobDescription.message} variant="inline" className="mt-2" />
            )}
          </div>

          {/* Upload Progress */}
          <AnimatePresence>
            {uploading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6"
              >
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Processing Your Resume...
                </h3>
                <ProgressBar
                  value={uploadProgress}
                  max={100}
                  showPercentage
                  label="Upload and Analysis Progress"
                  variant="primary"
                  animated
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Please wait while we upload your resume and analyze it against the job description.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting || uploading}
              disabled={isSubmitting || uploading || !filePreview || !jobDescription.trim()}
              className="px-8"
            >
              {isSubmitting || uploading ? 'Processing...' : 'Analyze Resume'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default ResumeUpload