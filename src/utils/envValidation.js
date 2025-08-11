/**
 * Environment variable validation for Appwrite configuration
 */

export const validateAppwriteConfig = () => {
  const requiredVars = [
    'VITE_APPWRITE_ENDPOINT',
    'VITE_APPWRITE_PROJECT_ID',
    'VITE_APPWRITE_DATABASE_ID'
  ]

  const missing = requiredVars.filter(varName => !import.meta.env[varName])
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing)
    console.error('Please check your .env file and ensure all Appwrite configuration is set')
    return false
  }

  // Validate endpoint format
  const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT
  if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
    console.error('❌ VITE_APPWRITE_ENDPOINT must start with http:// or https://')
    return false
  }

  console.log('✅ Appwrite configuration validated successfully')
  return true
}

export const getValidatedConfig = () => {
  if (!validateAppwriteConfig()) {
    throw new Error('Invalid Appwrite configuration')
  }

  return {
    endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
    projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
    collections: {
      users: import.meta.env.VITE_APPWRITE_COLLECTION_USERS,
      resumes: import.meta.env.VITE_APPWRITE_COLLECTION_RESUMES,
      interviews: import.meta.env.VITE_APPWRITE_COLLECTION_INTERVIEWS,
      questions: import.meta.env.VITE_APPWRITE_COLLECTION_QUESTIONS
    },
    storage: {
      bucketId: import.meta.env.VITE_APPWRITE_BUCKET_ID
    }
  }
}

export default {
  validateAppwriteConfig,
  getValidatedConfig
}