

import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageSquare, Play, Briefcase, Users, Target, Clock, AlertCircle } from 'lucide-react'

import Button from '../../components/common/Button.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import SuccessMessage from '../../components/common/SuccessMessage.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import { useCreateInterviewSessionMutation } from '../../store/api/appwriteApi.js'
import { setCurrentSession, setError, clearError } from '../../store/slices/interviewSlice.js'
import { useFormValidation } from '../../hooks/useFormValidation.js'
import { interviewSetupSchema } from '../../utils/validationSchemas.js'

const InterviewSetup = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const { error } = useSelector((state) => state.interview)
  
  const [createInterviewSession, { isLoading: isCreating }] = useCreateInterviewSessionMutation()
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    isSubmitting,
    submitError,
    submitSuccess,
    clearAllErrors,
    resetForm,
    isValid
  } = useFormValidation({
    schema: interviewSetupSchema,
    mode: 'onChange',
    defaultValues: {
      sessionType: '',
      role: '',
      experienceLevel: user?.experienceLevel || '',
      targetIndustry: user?.targetIndustry || ''
    },
    onSubmit: async (data) => {
      dispatch(clearError())
      
      const sessionData = {
        userId: user.$id,
        sessionType: data.sessionType,
        role: data.role,
        experienceLevel: data.experienceLevel,
        targetIndustry: data.targetIndustry || null
      }

      try {
        const result = await createInterviewSession(sessionData).unwrap()
        
        dispatch(setCurrentSession(result))
        
        // Navigate to live interview after a brief delay
        setTimeout(() => {
          navigate(`/interview/live/${result.$id}`)
        }, 1000)
      } catch (error) {
        dispatch(setError(error.message || 'Failed to create interview session'))
        throw error // Re-throw to be handled by useFormValidation
      }
    },
    onError: (error) => {
      dispatch(setError(error.message || 'Failed to create interview session'))
    }
  })

  const watchedValues = watch()

  const sessionTypes = [
    {
      value: 'Behavioral',
      label: 'Behavioral Interview',
      description: 'Questions about your past experiences, teamwork, and problem-solving',
      icon: Users,
      duration: '30-45 minutes'
    },
    {
      value: 'Technical',
      label: 'Technical Interview',
      description: 'Role-specific technical questions and problem-solving scenarios',
      icon: Target,
      duration: '45-60 minutes'
    },
    {
      value: 'Case Study',
      label: 'Case Study',
      description: 'Business scenarios and analytical thinking challenges',
      icon: Briefcase,
      duration: '60-90 minutes'
    }
  ]

  const experienceLevels = [
    { value: 'Entry', label: 'Entry Level (0-2 years)' },
    { value: 'Mid', label: 'Mid Level (3-5 years)' },
    { value: 'Senior', label: 'Senior Level (6-10 years)' },
    { value: 'Executive', label: 'Executive Level (10+ years)' }
  ]

  const commonRoles = [
    'Software Engineer',
    'Product Manager',
    'Data Scientist',
    'Marketing Manager',
    'Sales Representative',
    'Business Analyst',
    'UX Designer',
    'Project Manager',
    'Financial Analyst',
    'Operations Manager'
  ]



  const selectedSessionType = sessionTypes.find(type => type.value === watchedValues.sessionType)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Interview Practice Setup
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Configure your AI-powered interview session. Choose your interview type, role, and experience level for personalized questions.
          </p>
        </div>

        {/* Success Message */}
        {submitSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <SuccessMessage 
              message="Interview session created successfully! Redirecting to live interview..."
              autoHide
              autoHideDelay={2000}
            />
          </motion.div>
        )}

        {/* Error Display */}
        {(submitError || error) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <ErrorMessage 
              message={submitError || error}
              onClose={() => {
                clearAllErrors()
                dispatch(clearError())
              }}
              actions={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    resetForm()
                    dispatch(clearError())
                  }}
                >
                  Reset Form
                </Button>
              }
            />
          </motion.div>
        )}

        {/* Setup Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            
            {/* Session Type Selection */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Interview Type
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sessionTypes.map((type) => {
                  const Icon = type.icon
                  const isSelected = watchedValues.sessionType === type.value
                  
                  return (
                    <motion.label
                      key={type.value}
                      className={`
                        relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-200
                        ${isSelected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }
                      `}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <input
                        type="radio"
                        value={type.value}
                        className="sr-only"
                        {...register('sessionType')}
                      />
                      
                      <div className="flex flex-col items-center text-center">
                        <div className={`
                          w-12 h-12 rounded-full flex items-center justify-center mb-3
                          ${isSelected
                            ? 'bg-primary-100 dark:bg-primary-800'
                            : 'bg-gray-100 dark:bg-gray-700'
                          }
                        `}>
                          <Icon className={`
                            w-6 h-6
                            ${isSelected
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'text-gray-500 dark:text-gray-400'
                            }
                          `} />
                        </div>
                        
                        <h3 className={`
                          font-semibold mb-2
                          ${isSelected
                            ? 'text-primary-900 dark:text-primary-100'
                            : 'text-gray-900 dark:text-white'
                          }
                        `}>
                          {type.label}
                        </h3>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {type.description}
                        </p>
                        
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {type.duration}
                        </div>
                      </div>
                      
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 right-3 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center"
                        >
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </motion.div>
                      )}
                    </motion.label>
                  )
                })}
              </div>
              {errors.sessionType && (
                <ErrorMessage message={errors.sessionType.message} variant="inline" className="mt-2" />
              )}
            </div>

            {/* Role Input */}
            <div>
              <label htmlFor="role" className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Target Role
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="space-y-3">
                <input
                  id="role"
                  type="text"
                  placeholder="e.g., Software Engineer, Product Manager, Data Scientist"
                  className={`
                    w-full px-4 py-3 border rounded-xl shadow-sm transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                    placeholder-gray-400 dark:placeholder-gray-500
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    ${errors.role 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                    }
                  `}
                  {...register('role')}
                />
                
                {/* Common roles suggestions */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Common roles:</span>
                  {commonRoles.slice(0, 5).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        const event = { target: { name: 'role', value: role } }
                        register('role').onChange(event)
                      }}
                      className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              {errors.role && (
                <ErrorMessage message={errors.role.message} variant="inline" className="mt-2" />
              )}
            </div>

            {/* Experience Level */}
            <div>
              <label htmlFor="experienceLevel" className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Experience Level
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                id="experienceLevel"
                className={`
                  w-full px-4 py-3 border rounded-xl shadow-sm transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  ${errors.experienceLevel 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                  }
                `}
                {...register('experienceLevel')}
              >
                <option value="">Select your experience level</option>
                {experienceLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
              {errors.experienceLevel && (
                <ErrorMessage message={errors.experienceLevel.message} variant="inline" className="mt-2" />
              )}
            </div>

            {/* Target Industry (Optional) */}
            <div>
              <label htmlFor="targetIndustry" className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Target Industry
                <span className="text-gray-500 text-sm font-normal ml-2">(Optional)</span>
              </label>
              <input
                id="targetIndustry"
                type="text"
                placeholder="e.g., Technology, Healthcare, Finance, E-commerce"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                {...register('targetIndustry')}
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Helps generate more relevant industry-specific questions
              </p>
            </div>

            {/* Session Preview */}
            {selectedSessionType && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-primary-500" />
                  Session Preview
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Interview Type:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedSessionType.label}</span>
                  </div>
                  {watchedValues.role && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Role:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{watchedValues.role}</span>
                    </div>
                  )}
                  {watchedValues.experienceLevel && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Experience:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {experienceLevels.find(level => level.value === watchedValues.experienceLevel)?.label}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedSessionType.duration}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-600">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isCreating}
                disabled={!isValid || isCreating}
                className="min-w-[200px]"
              >
                {isCreating ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating Session...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Start Interview
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default InterviewSetup