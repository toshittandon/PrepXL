import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { questionSchema } from '../../utils/validationSchemas.js'
import Button from '../common/Button.jsx'
import FormField from '../forms/FormField.jsx'

const QuestionForm = ({
  question = null,
  onSubmit,
  onCancel,
  isLoading = false,
  categories = [],
  roles = []
}) => {
  const isEditing = Boolean(question)
  
  // Form setup with validation
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
    setValue
  } = useForm({
    resolver: yupResolver(questionSchema),
    mode: 'onChange',
    defaultValues: {
      questionText: question?.questionText || '',
      category: question?.category || '',
      role: question?.role || '',
      suggestedAnswer: question?.suggestedAnswer || ''
    }
  })

  // Watch form values for character counts
  const questionText = watch('questionText', '')
  const suggestedAnswer = watch('suggestedAnswer', '')

  // Reset form when question changes
  useEffect(() => {
    if (question) {
      reset({
        questionText: question.questionText || '',
        category: question.category || '',
        role: question.role || '',
        suggestedAnswer: question.suggestedAnswer || ''
      })
    }
  }, [question, reset])

  // Handle form submission
  const onFormSubmit = async (data) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  // Predefined categories and roles
  const predefinedCategories = ['Behavioral', 'Technical', 'Case Study']
  const predefinedRoles = [
    'Software Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Data Scientist',
    'Product Manager',
    'UX Designer',
    'DevOps Engineer',
    'QA Engineer',
    'Business Analyst',
    'Project Manager',
    'Marketing Manager',
    'Sales Representative',
    'Customer Success Manager',
    'HR Manager'
  ]

  // Combine predefined and existing roles
  const allRoles = [...new Set([...predefinedRoles, ...roles])].sort()

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit(onFormSubmit)}
      className="space-y-6"
    >
      {/* Question Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Question Text *
        </label>
        <div className="relative">
          <textarea
            {...register('questionText')}
            rows={4}
            className={`
              w-full px-4 py-3 border rounded-xl resize-none
              focus:ring-2 focus:ring-primary-500 focus:border-transparent
              transition-colors duration-200
              ${errors.questionText 
                ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/10' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
              }
              text-gray-900 dark:text-white
              placeholder-gray-500 dark:placeholder-gray-400
            `}
            placeholder="Enter the interview question..."
          />
          <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400">
            {questionText.length}/1000
          </div>
        </div>
        {errors.questionText && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-600 dark:text-red-400"
          >
            {errors.questionText.message}
          </motion.p>
        )}
      </div>

      {/* Category and Role */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category *
          </label>
          <select
            {...register('category')}
            className={`
              w-full px-4 py-3 border rounded-xl
              focus:ring-2 focus:ring-primary-500 focus:border-transparent
              transition-colors duration-200
              ${errors.category 
                ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/10' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
              }
              text-gray-900 dark:text-white
            `}
          >
            <option value="">Select a category</option>
            {predefinedCategories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-sm text-red-600 dark:text-red-400"
            >
              {errors.category.message}
            </motion.p>
          )}
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Role *
          </label>
          <div className="relative">
            <input
              {...register('role')}
              list="roles-list"
              className={`
                w-full px-4 py-3 border rounded-xl
                focus:ring-2 focus:ring-primary-500 focus:border-transparent
                transition-colors duration-200
                ${errors.role 
                  ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/10' 
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                }
                text-gray-900 dark:text-white
                placeholder-gray-500 dark:placeholder-gray-400
              `}
              placeholder="Enter or select a role"
            />
            <datalist id="roles-list">
              {allRoles.map(role => (
                <option key={role} value={role} />
              ))}
            </datalist>
          </div>
          {errors.role && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-sm text-red-600 dark:text-red-400"
            >
              {errors.role.message}
            </motion.p>
          )}
        </div>
      </div>

      {/* Suggested Answer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Suggested Answer *
        </label>
        <div className="relative">
          <textarea
            {...register('suggestedAnswer')}
            rows={8}
            className={`
              w-full px-4 py-3 border rounded-xl resize-none
              focus:ring-2 focus:ring-primary-500 focus:border-transparent
              transition-colors duration-200
              ${errors.suggestedAnswer 
                ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/10' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
              }
              text-gray-900 dark:text-white
              placeholder-gray-500 dark:placeholder-gray-400
            `}
            placeholder="Provide a comprehensive suggested answer or talking points..."
          />
          <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400">
            {suggestedAnswer.length}/5000
          </div>
        </div>
        {errors.suggestedAnswer && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-600 dark:text-red-400"
          >
            {errors.suggestedAnswer.message}
          </motion.p>
        )}
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Provide key points, frameworks, or example responses that would help candidates answer this question effectively.
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          onClick={onCancel}
          variant="secondary"
          size="md"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={isLoading}
          disabled={!isValid}
        >
          {isEditing ? 'Update Question' : 'Create Question'}
        </Button>
      </div>
    </motion.form>
  )
}

export default QuestionForm