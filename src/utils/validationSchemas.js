import * as yup from 'yup';

// Common validation patterns
const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

// Authentication schemas
export const loginSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .matches(emailPattern, 'Please enter a valid email address'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters long')
});

export const signupSchema = yup.object({
  name: yup
    .string()
    .required('Full name is required')
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name must be less than 50 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: yup
    .string()
    .required('Email is required')
    .matches(emailPattern, 'Please enter a valid email address'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters long')
    .matches(
      passwordPattern,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords do not match')
});

// Interview setup schema
export const interviewSetupSchema = yup.object({
  role: yup
    .string()
    .required('Please select a role'),
  customRole: yup
    .string()
    .when('role', {
      is: 'Other',
      then: (schema) => schema
        .required('Please specify the role')
        .min(2, 'Role must be at least 2 characters')
        .max(100, 'Role must be less than 100 characters'),
      otherwise: (schema) => schema.notRequired()
    }),
  experienceLevel: yup
    .string()
    .required('Please select experience level')
    .oneOf(['entry', 'mid', 'senior', 'lead'], 'Invalid experience level'),
  industry: yup
    .string()
    .optional(),
  sessionType: yup
    .string()
    .required('Please select an interview type')
    .oneOf(['Behavioral', 'Technical', 'Case Study'], 'Invalid session type')
});

// Resume upload schema
export const resumeUploadSchema = yup.object({
  file: yup
    .mixed()
    .required('Please select a file')
    .test('fileSize', 'File size must be less than 5MB', (value) => {
      if (!value || !value[0]) return false;
      return value[0].size <= 5 * 1024 * 1024; // 5MB
    })
    .test('fileType', 'Only PDF, DOC, DOCX, and TXT files are allowed', (value) => {
      if (!value || !value[0]) return false;
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      return allowedTypes.includes(value[0].type);
    })
});

// User profile schema
export const userProfileSchema = yup.object({
  name: yup
    .string()
    .required('Full name is required')
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name must be less than 50 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: yup
    .string()
    .required('Email is required')
    .matches(emailPattern, 'Please enter a valid email address'),
  experienceLevel: yup
    .string()
    .optional()
    .oneOf(['entry', 'mid', 'senior', 'lead'], 'Invalid experience level'),
  targetRole: yup
    .string()
    .optional()
    .max(100, 'Target role must be less than 100 characters'),
  targetIndustry: yup
    .string()
    .optional()
    .max(100, 'Target industry must be less than 100 characters')
});

// Password change schema
export const passwordChangeSchema = yup.object({
  currentPassword: yup
    .string()
    .required('Current password is required'),
  newPassword: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters long')
    .matches(
      passwordPattern,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmNewPassword: yup
    .string()
    .required('Please confirm your new password')
    .oneOf([yup.ref('newPassword')], 'Passwords do not match')
});

// Contact/feedback schema
export const contactSchema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name must be less than 50 characters'),
  email: yup
    .string()
    .required('Email is required')
    .matches(emailPattern, 'Please enter a valid email address'),
  subject: yup
    .string()
    .required('Subject is required')
    .min(5, 'Subject must be at least 5 characters long')
    .max(100, 'Subject must be less than 100 characters'),
  message: yup
    .string()
    .required('Message is required')
    .min(10, 'Message must be at least 10 characters long')
    .max(1000, 'Message must be less than 1000 characters')
});

// Appwrite data model validation schemas
export const userDataSchema = yup.object({
  id: yup.string().optional(),
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: yup
    .string()
    .required('Email is required')
    .matches(emailPattern, 'Please enter a valid email address'),
  experienceLevel: yup
    .string()
    .required('Experience level is required')
    .oneOf(['Entry', 'Mid', 'Senior', 'Executive'], 'Invalid experience level'),
  targetRole: yup
    .string()
    .max(100, 'Target role must be less than 100 characters')
    .default(''),
  targetIndustry: yup
    .string()
    .max(100, 'Target industry must be less than 100 characters')
    .default(''),
  isAdmin: yup
    .boolean()
    .default(false)
});

export const resumeDataSchema = yup.object({
  userId: yup
    .string()
    .required('User ID is required'),
  fileId: yup
    .string()
    .required('File ID is required'),
  fileName: yup
    .string()
    .required('File name is required')
    .max(255, 'File name must be less than 255 characters'),
  jobDescription: yup
    .string()
    .required('Job description is required')
    .min(50, 'Job description must be at least 50 characters')
    .max(5000, 'Job description must be less than 5000 characters'),
  analysisResults: yup
    .object({
      matchScore: yup.number().min(0).max(100),
      missingKeywords: yup.array().of(yup.string()),
      actionVerbAnalysis: yup.string(),
      formatSuggestions: yup.array().of(yup.string())
    })
    .nullable()
    .default(null)
});

export const interviewSessionDataSchema = yup.object({
  userId: yup
    .string()
    .required('User ID is required'),
  sessionType: yup
    .string()
    .required('Session type is required')
    .oneOf(['Behavioral', 'Technical', 'Case Study'], 'Invalid session type'),
  role: yup
    .string()
    .required('Role is required')
    .max(100, 'Role must be less than 100 characters'),
  status: yup
    .string()
    .oneOf(['active', 'completed', 'abandoned'], 'Invalid status')
    .default('active'),
  finalScore: yup
    .number()
    .min(0)
    .max(100)
    .default(0)
});

export const interactionDataSchema = yup.object({
  sessionId: yup
    .string()
    .required('Session ID is required'),
  userId: yup
    .string()
    .required('User ID is required'),
  questionText: yup
    .string()
    .required('Question text is required')
    .max(1000, 'Question text must be less than 1000 characters'),
  userAnswerText: yup
    .string()
    .required('User answer is required')
    .max(5000, 'Answer must be less than 5000 characters'),
  order: yup
    .number()
    .required('Order is required')
    .min(1, 'Order must be at least 1')
});

export const questionDataSchema = yup.object({
  questionText: yup
    .string()
    .required('Question text is required')
    .min(10, 'Question must be at least 10 characters')
    .max(1000, 'Question must be less than 1000 characters'),
  category: yup
    .string()
    .required('Category is required')
    .oneOf(['Behavioral', 'Technical', 'Case Study'], 'Invalid category'),
  role: yup
    .string()
    .required('Role is required')
    .max(100, 'Role must be less than 100 characters'),
  suggestedAnswer: yup
    .string()
    .required('Suggested answer is required')
    .min(20, 'Suggested answer must be at least 20 characters')
    .max(2000, 'Suggested answer must be less than 2000 characters')
});

// Admin question management schema
export const adminQuestionSchema = yup.object({
  questionText: yup
    .string()
    .required('Question text is required')
    .min(10, 'Question must be at least 10 characters')
    .max(1000, 'Question must be less than 1000 characters'),
  category: yup
    .string()
    .required('Category is required')
    .oneOf(['Behavioral', 'Technical', 'Case Study'], 'Invalid category'),
  role: yup
    .string()
    .required('Role is required')
    .max(100, 'Role must be less than 100 characters'),
  suggestedAnswer: yup
    .string()
    .required('Suggested answer is required')
    .min(20, 'Suggested answer must be at least 20 characters')
    .max(2000, 'Suggested answer must be less than 2000 characters')
});

// Job description input schema
export const jobDescriptionSchema = yup.object({
  jobDescription: yup
    .string()
    .required('Job description is required')
    .min(50, 'Job description must be at least 50 characters')
    .max(5000, 'Job description must be less than 5000 characters')
});

// Validation functions for Appwrite data models
export const validateUserData = async (data, isUpdate = false) => {
  try {
    const schema = isUpdate ? userDataSchema.partial() : userDataSchema;
    return await schema.validate(data, { abortEarly: false, stripUnknown: true });
  } catch (error) {
    throw new Error(`User data validation failed: ${error.errors.join(', ')}`);
  }
};

export const validateResumeData = async (data, isUpdate = false) => {
  try {
    const schema = isUpdate ? resumeDataSchema.partial() : resumeDataSchema;
    return await schema.validate(data, { abortEarly: false, stripUnknown: true });
  } catch (error) {
    throw new Error(`Resume data validation failed: ${error.errors.join(', ')}`);
  }
};

export const validateInterviewSessionData = async (data, isUpdate = false) => {
  try {
    const schema = isUpdate ? interviewSessionDataSchema.partial() : interviewSessionDataSchema;
    return await schema.validate(data, { abortEarly: false, stripUnknown: true });
  } catch (error) {
    throw new Error(`Interview session data validation failed: ${error.errors.join(', ')}`);
  }
};

export const validateInteractionData = async (data, isUpdate = false) => {
  try {
    const schema = isUpdate ? interactionDataSchema.partial() : interactionDataSchema;
    return await schema.validate(data, { abortEarly: false, stripUnknown: true });
  } catch (error) {
    throw new Error(`Interaction data validation failed: ${error.errors.join(', ')}`);
  }
};

export const validateQuestionData = async (data, isUpdate = false) => {
  try {
    const schema = isUpdate ? questionDataSchema.partial() : questionDataSchema;
    return await schema.validate(data, { abortEarly: false, stripUnknown: true });
  } catch (error) {
    throw new Error(`Question data validation failed: ${error.errors.join(', ')}`);
  }
};

// Export validation patterns for reuse
export const validationPatterns = {
  email: emailPattern,
  password: passwordPattern,
  name: /^[a-zA-Z\s\-']+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/
};

// Common validation messages
export const validationMessages = {
  required: (field) => `${field} is required`,
  email: 'Please enter a valid email address',
  password: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  passwordLength: 'Password must be at least 8 characters long',
  passwordMatch: 'Passwords do not match',
  nameFormat: 'Name can only contain letters, spaces, hyphens, and apostrophes',
  minLength: (field, length) => `${field} must be at least ${length} characters long`,
  maxLength: (field, length) => `${field} must be less than ${length} characters`,
  fileSize: 'File size must be less than 5MB',
  fileType: 'Invalid file type'
};