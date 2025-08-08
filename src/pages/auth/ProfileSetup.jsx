import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Briefcase, Building, CheckCircle } from 'lucide-react'
import { updateUser } from '../../services/appwrite/database.js'
import { setUser, setError, setLoading } from '../../store/slices/authSlice.js'
import Button from '../../components/common/Button.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import SuccessMessage from '../../components/common/SuccessMessage.jsx'
import Card from '../../components/common/Card.jsx'
import { useFormValidation } from '../../hooks/useFormValidation.js'
import { profileSetupSchema } from '../../utils/validationSchemas.js'

const ProfileSetup = () => {
  const { user, error, loading } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    isSubmitting,
    submitError,
    submitSuccess,
    clearAllErrors,
    resetForm
  } = useFormValidation({
    schema: profileSetupSchema,
    mode: 'onBlur',
    defaultValues: {
      experienceLevel: user?.profile?.experienceLevel || 'Entry',
      targetRole: user?.profile?.targetRole || '',
      targetIndustry: user?.profile?.targetIndustry || ''
    },
    onSubmit: async (data) => {
      dispatch(setLoading(true))
      dispatch(setError(null))

      try {
        // Update user profile in database
        const updatedProfile = await updateUser(user.$id, {
          experienceLevel: data.experienceLevel,
          targetRole: data.targetRole,
          targetIndustry: data.targetIndustry
        })

        // Update Redux state
        dispatch(setUser({
          ...user,
          profile: updatedProfile
        }))

        // Navigate to dashboard after a brief delay
        setTimeout(() => {
          navigate('/dashboard')
        }, 1500)
      } catch (error) {
        dispatch(setError(error.message))
        throw error // Re-throw to be handled by useFormValidation
      } finally {
        dispatch(setLoading(false))
      }
    },
    onError: (error) => {
      dispatch(setError(error.message || 'Profile setup failed. Please try again.'))
    }
  })

  const watchedValues = watch()

  const experienceLevels = [
    { value: 'Entry', label: 'Entry Level', description: '0-2 years of experience' },
    { value: 'Mid', label: 'Mid Level', description: '3-5 years of experience' },
    { value: 'Senior', label: 'Senior Level', description: '6-10 years of experience' },
    { value: 'Executive', label: 'Executive Level', description: '10+ years of experience' }
  ]

  const commonRoles = [
    'Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer',
    'Marketing Manager', 'Sales Representative', 'Business Analyst', 'DevOps Engineer',
    'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Mobile Developer',
    'Project Manager', 'Consultant', 'Other'
  ]

  const commonIndustries = [
    'Technology', 'Finance', 'Healthcare', 'Education', 'Retail',
    'Manufacturing', 'Consulting', 'Media & Entertainment', 'Real Estate',
    'Non-profit', 'Government', 'Automotive', 'Energy', 'Other'
  ]



  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return watchedValues.experienceLevel
      case 2:
        return watchedValues.targetRole && watchedValues.targetRole.trim()
      case 3:
        return watchedValues.targetIndustry && watchedValues.targetIndustry.trim()
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Help us personalize your interview preparation experience
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className="flex items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${i + 1 <= currentStep
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }
                  `}
                >
                  {i + 1 < currentStep ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < totalSteps - 1 && (
                  <div
                    className={`
                      w-16 h-1 mx-2
                      ${i + 1 < currentStep
                        ? 'bg-primary-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                      }
                    `}
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="py-8 px-4 shadow-xl sm:px-10">
            {/* Success Message */}
            {submitSuccess && (
              <div className="mb-6">
                <SuccessMessage 
                  message="Profile setup completed successfully! Redirecting to dashboard..."
                  autoHide
                  autoHideDelay={3000}
                />
              </div>
            )}

            {/* Error Messages */}
            {(submitError || error) && (
              <div className="mb-6">
                <ErrorMessage 
                  message={submitError || error}
                  onClose={clearAllErrors}
                  actions={
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        clearAllErrors()
                        dispatch(setError(null))
                      }}
                    >
                      Dismiss
                    </Button>
                  }
                />
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Step 1: Experience Level */}
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-6">
                    <User className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      What's your experience level?
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      This helps us tailor interview questions to your level
                    </p>
                  </div>

                  <div className="space-y-3">
                    {experienceLevels.map((level) => (
                      <label
                        key={level.value}
                        className={`
                          block p-4 border rounded-xl cursor-pointer transition-all duration-200
                          ${watchedValues.experienceLevel === level.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-700'
                          }
                        `}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            value={level.value}
                            className="sr-only"
                            {...register('experienceLevel')}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {level.label}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {level.description}
                            </div>
                          </div>
                          {watchedValues.experienceLevel === level.value && (
                            <CheckCircle className="w-5 h-5 text-primary-600" />
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.experienceLevel && (
                    <ErrorMessage message={errors.experienceLevel.message} variant="inline" className="mt-2" />
                  )}
                </motion.div>
              )}

              {/* Step 2: Target Role */}
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-6">
                    <Briefcase className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      What role are you targeting?
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      We'll focus on role-specific interview questions
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="targetRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Target Role
                      </label>
                      <input
                        id="targetRole"
                        type="text"
                        list="roles"
                        className={`
                          block w-full px-3 py-3 border rounded-xl shadow-sm
                          placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                          transition-colors duration-200
                          ${errors.targetRole 
                            ? 'border-red-300 dark:border-red-600' 
                            : 'border-gray-300 dark:border-gray-600'
                          }
                          bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                        `}
                        placeholder="e.g., Software Engineer, Product Manager"
                        {...register('targetRole')}
                      />
                      <datalist id="roles">
                        {commonRoles.map((role) => (
                          <option key={role} value={role} />
                        ))}
                      </datalist>
                    </div>
                    {errors.targetRole && (
                      <ErrorMessage message={errors.targetRole.message} variant="inline" />
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Target Industry */}
              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-6">
                    <Building className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Which industry interests you?
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Industry context helps us provide relevant scenarios
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="targetIndustry" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Target Industry
                      </label>
                      <input
                        id="targetIndustry"
                        type="text"
                        list="industries"
                        className={`
                          block w-full px-3 py-3 border rounded-xl shadow-sm
                          placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                          transition-colors duration-200
                          ${errors.targetIndustry 
                            ? 'border-red-300 dark:border-red-600' 
                            : 'border-gray-300 dark:border-gray-600'
                          }
                          bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                        `}
                        placeholder="e.g., Technology, Finance, Healthcare"
                        {...register('targetIndustry')}
                      />
                      <datalist id="industries">
                        {commonIndustries.map((industry) => (
                          <option key={industry} value={industry} />
                        ))}
                      </datalist>
                    </div>
                    {errors.targetIndustry && (
                      <ErrorMessage message={errors.targetIndustry.message} variant="inline" />
                    )}
                  </div>
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={currentStep === 1 ? 'invisible' : ''}
                >
                  Previous
                </Button>

                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={nextStep}
                    disabled={!canProceedToNext()}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    loading={isSubmitting || loading}
                    disabled={isSubmitting || loading || !canProceedToNext()}
                  >
                    {isSubmitting || loading ? 'Completing Setup...' : 'Complete Setup'}
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default ProfileSetup