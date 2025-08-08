import * as yup from 'yup'

// Common validation patterns
const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/

// Authentication schemas
export const loginSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .matches(emailRegex, 'Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
})

export const signupSchema = yup.object({
  name: yup
    .string()
    .required('Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: yup
    .string()
    .required('Email is required')
    .matches(emailRegex, 'Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .matches(
      passwordRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords do not match')
})

// Profile setup schema
export const profileSetupSchema = yup.object({
  experienceLevel: yup
    .string()
    .required('Please select your experience level')
    .oneOf(['Entry', 'Mid', 'Senior', 'Executive'], 'Invalid experience level'),
  targetRole: yup
    .string()
    .required('Please enter your target role')
    .min(2, 'Role must be at least 2 characters')
    .max(100, 'Role must be less than 100 characters')
    .trim(),
  targetIndustry: yup
    .string()
    .required('Please enter your target industry')
    .min(2, 'Industry must be at least 2 characters')
    .max(100, 'Industry must be less than 100 characters')
    .trim()
})

// Interview setup schema
export const interviewSetupSchema = yup.object({
  sessionType: yup
    .string()
    .required('Please select an interview type')
    .oneOf(['Behavioral', 'Technical', 'Case Study'], 'Invalid interview type'),
  role: yup
    .string()
    .required('Please enter the target role')
    .min(2, 'Role must be at least 2 characters')
    .max(100, 'Role must be less than 100 characters')
    .trim(),
  experienceLevel: yup
    .string()
    .required('Please select your experience level')
    .oneOf(['Entry', 'Mid', 'Senior', 'Executive'], 'Invalid experience level'),
  targetIndustry: yup
    .string()
    .nullable()
    .max(100, 'Industry must be less than 100 characters')
    .trim()
})

// Resume upload schema
export const resumeUploadSchema = yup.object({
  file: yup
    .mixed()
    .required('Please select a resume file')
    .test('fileSize', 'File size must be less than 10MB', (value) => {
      if (!value) return false
      return value.size <= 10 * 1024 * 1024 // 10MB
    })
    .test('fileType', 'Only PDF, DOC, and DOCX files are allowed', (value) => {
      if (!value) return false
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
      return allowedTypes.includes(value.type)
    }),
  jobDescription: yup
    .string()
    .required('Please provide a job description')
    .min(50, 'Job description must be at least 50 characters')
    .max(10000, 'Job description must be less than 10,000 characters')
    .trim()
})

// Question management schema (for admin)
export const questionSchema = yup.object({
  questionText: yup
    .string()
    .required('Question text is required')
    .min(10, 'Question must be at least 10 characters')
    .max(1000, 'Question must be less than 1,000 characters')
    .trim(),
  category: yup
    .string()
    .required('Please select a category')
    .oneOf(['Behavioral', 'Technical', 'Case Study'], 'Invalid category'),
  role: yup
    .string()
    .required('Please specify the role')
    .min(2, 'Role must be at least 2 characters')
    .max(100, 'Role must be less than 100 characters')
    .trim(),
  suggestedAnswer: yup
    .string()
    .required('Suggested answer is required')
    .min(20, 'Suggested answer must be at least 20 characters')
    .max(5000, 'Suggested answer must be less than 5,000 characters')
    .trim()
})

// User profile update schema
export const userProfileUpdateSchema = yup.object({
  name: yup
    .string()
    .required('Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  experienceLevel: yup
    .string()
    .required('Please select your experience level')
    .oneOf(['Entry', 'Mid', 'Senior', 'Executive'], 'Invalid experience level'),
  targetRole: yup
    .string()
    .required('Please enter your target role')
    .min(2, 'Role must be at least 2 characters')
    .max(100, 'Role must be less than 100 characters')
    .trim(),
  targetIndustry: yup
    .string()
    .required('Please enter your target industry')
    .min(2, 'Industry must be at least 2 characters')
    .max(100, 'Industry must be less than 100 characters')
    .trim()
})

// Search and filter schema
export const searchFilterSchema = yup.object({
  searchTerm: yup
    .string()
    .max(100, 'Search term must be less than 100 characters')
    .trim(),
  category: yup
    .string()
    .nullable()
    .oneOf(['', 'Behavioral', 'Technical', 'Case Study'], 'Invalid category'),
  role: yup
    .string()
    .nullable()
    .max(100, 'Role must be less than 100 characters')
    .trim()
})

// Password reset schema
export const passwordResetSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .matches(emailRegex, 'Invalid email address')
    .max(255, 'Email must be less than 255 characters')
})

// Change password schema
export const changePasswordSchema = yup.object({
  currentPassword: yup
    .string()
    .required('Current password is required'),
  newPassword: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .matches(
      passwordRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmNewPassword: yup
    .string()
    .required('Please confirm your new password')
    .oneOf([yup.ref('newPassword')], 'Passwords do not match')
})

// Export all schemas as a collection for easy access
export const validationSchemas = {
  login: loginSchema,
  signup: signupSchema,
  profileSetup: profileSetupSchema,
  interviewSetup: interviewSetupSchema,
  resumeUpload: resumeUploadSchema,
  question: questionSchema,
  userProfileUpdate: userProfileUpdateSchema,
  searchFilter: searchFilterSchema,
  passwordReset: passwordResetSchema,
  changePassword: changePasswordSchema
}

// Data validation functions for database operations
export const validateUserData = async (userData, isUpdate = false) => {
  const schema = isUpdate ? userProfileUpdateSchema : signupSchema.omit(['password', 'confirmPassword'])
  return await schema.validate(userData, { abortEarly: false, stripUnknown: true })
}

export const validateResumeData = async (resumeData) => {
  const schema = yup.object({
    userId: yup.string().required('User ID is required'),
    fileId: yup.string().required('File ID is required'),
    fileName: yup.string().required('File name is required').max(255, 'File name too long'),
    jobDescription: yup.string().required('Job description is required').min(50).max(10000),
    analysisResults: yup.object({
      matchScore: yup.number().min(0).max(100),
      missingKeywords: yup.array().of(yup.string()),
      actionVerbAnalysis: yup.string(),
      formatSuggestions: yup.array().of(yup.string())
    }).nullable()
  })
  
  return await schema.validate(resumeData, { abortEarly: false, stripUnknown: true })
}

export const validateInterviewSessionData = async (sessionData) => {
  const schema = yup.object({
    userId: yup.string().required('User ID is required'),
    sessionType: yup.string().required().oneOf(['Behavioral', 'Technical', 'Case Study']),
    role: yup.string().required().min(2).max(100),
    experienceLevel: yup.string().required().oneOf(['Entry', 'Mid', 'Senior', 'Executive']),
    targetIndustry: yup.string().nullable().max(100),
    status: yup.string().oneOf(['active', 'completed', 'abandoned']).default('active'),
    finalScore: yup.number().min(0).max(100).nullable()
  })
  
  return await schema.validate(sessionData, { abortEarly: false, stripUnknown: true })
}

export const validateInteractionData = async (interactionData) => {
  const schema = yup.object({
    sessionId: yup.string().required('Session ID is required'),
    questionText: yup.string().required('Question text is required').max(1000),
    userAnswerText: yup.string().required('User answer is required').max(5000),
    order: yup.number().required().min(1)
  })
  
  return await schema.validate(interactionData, { abortEarly: false, stripUnknown: true })
}

export const validateQuestionData = async (questionData) => {
  return await questionSchema.validate(questionData, { abortEarly: false, stripUnknown: true })
}

export default validationSchemas