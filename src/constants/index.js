// Application constants
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'PrepXL';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

// API endpoints
export const AI_API_BASE_URL = import.meta.env.VITE_AI_API_BASE_URL;

// Appwrite configuration
export const APPWRITE_CONFIG = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
  collections: {
    users: import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID,
    resumes: import.meta.env.VITE_APPWRITE_RESUMES_COLLECTION_ID,
    sessions: import.meta.env.VITE_APPWRITE_SESSIONS_COLLECTION_ID,
    interactions: import.meta.env.VITE_APPWRITE_INTERACTIONS_COLLECTION_ID,
    questions: import.meta.env.VITE_APPWRITE_QUESTIONS_COLLECTION_ID,
  },
  storage: {
    resumesBucket: import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID,
  }
};

// Interview session types
export const SESSION_TYPES = {
  BEHAVIORAL: 'Behavioral',
  TECHNICAL: 'Technical',
  CASE_STUDY: 'Case Study'
};

// Session status
export const SESSION_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned'
};

// File upload constraints
export const FILE_CONSTRAINTS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

// Feature flags
export const FEATURES = {
  SPEECH_RECOGNITION: import.meta.env.VITE_ENABLE_SPEECH_RECOGNITION === 'true',
  OAUTH_LOGIN: import.meta.env.VITE_ENABLE_OAUTH_LOGIN === 'true',
  ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
};