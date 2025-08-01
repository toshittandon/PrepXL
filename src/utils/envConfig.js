/**
 * Environment configuration validation and utilities
 */

// Required environment variables for each environment
const REQUIRED_ENV_VARS = {
  development: [
    'VITE_APPWRITE_ENDPOINT',
    'VITE_APPWRITE_PROJECT_ID',
    'VITE_APPWRITE_DATABASE_ID',
    'VITE_APPWRITE_USERS_COLLECTION_ID',
    'VITE_APPWRITE_RESUMES_COLLECTION_ID',
    'VITE_APPWRITE_SESSIONS_COLLECTION_ID',
    'VITE_APPWRITE_INTERACTIONS_COLLECTION_ID',
    'VITE_APPWRITE_STORAGE_BUCKET_ID',
  ],
  staging: [
    'VITE_APPWRITE_ENDPOINT',
    'VITE_APPWRITE_PROJECT_ID',
    'VITE_APPWRITE_DATABASE_ID',
    'VITE_APPWRITE_USERS_COLLECTION_ID',
    'VITE_APPWRITE_RESUMES_COLLECTION_ID',
    'VITE_APPWRITE_SESSIONS_COLLECTION_ID',
    'VITE_APPWRITE_INTERACTIONS_COLLECTION_ID',
    'VITE_APPWRITE_STORAGE_BUCKET_ID',
    'VITE_AI_API_BASE_URL',
    'VITE_AI_API_KEY',
  ],
  production: [
    'VITE_APPWRITE_ENDPOINT',
    'VITE_APPWRITE_PROJECT_ID',
    'VITE_APPWRITE_DATABASE_ID',
    'VITE_APPWRITE_USERS_COLLECTION_ID',
    'VITE_APPWRITE_RESUMES_COLLECTION_ID',
    'VITE_APPWRITE_SESSIONS_COLLECTION_ID',
    'VITE_APPWRITE_INTERACTIONS_COLLECTION_ID',
    'VITE_APPWRITE_STORAGE_BUCKET_ID',
    'VITE_AI_API_BASE_URL',
    'VITE_AI_API_KEY',
    'VITE_SENTRY_DSN',
    'VITE_GA_TRACKING_ID',
  ],
};

// Get current environment
export const getEnvironment = () => {
  return import.meta.env.VITE_APP_ENVIRONMENT || 'development';
};

// Check if running in production
export const isProduction = () => {
  return getEnvironment() === 'production';
};

// Check if running in development
export const isDevelopment = () => {
  return getEnvironment() === 'development';
};

// Check if running in staging
export const isStaging = () => {
  return getEnvironment() === 'staging';
};

// Validate environment variables
export const validateEnvironment = () => {
  const environment = getEnvironment();
  const requiredVars = REQUIRED_ENV_VARS[environment] || REQUIRED_ENV_VARS.development;
  const missingVars = [];

  requiredVars.forEach(varName => {
    if (!import.meta.env[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables for ${environment}:\n${missingVars.join('\n')}`;
    
    if (isProduction()) {
      throw new Error(errorMessage);
    } else {
      console.warn(errorMessage);
    }
  }

  return missingVars.length === 0;
};

// Get configuration object
export const getConfig = () => {
  return {
    // Environment
    environment: getEnvironment(),
    isProduction: isProduction(),
    isDevelopment: isDevelopment(),
    isStaging: isStaging(),
    
    // App info
    appName: import.meta.env.VITE_APP_NAME || 'InterviewPrep AI',
    appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
    buildTime: __BUILD_TIME__ || new Date().toISOString(),
    
    // Appwrite
    appwrite: {
      endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
      projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
      databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
      collections: {
        users: import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID,
        resumes: import.meta.env.VITE_APPWRITE_RESUMES_COLLECTION_ID,
        sessions: import.meta.env.VITE_APPWRITE_SESSIONS_COLLECTION_ID,
        interactions: import.meta.env.VITE_APPWRITE_INTERACTIONS_COLLECTION_ID,
      },
      storage: {
        bucketId: import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID,
      },
    },
    
    // AI API
    ai: {
      baseUrl: import.meta.env.VITE_AI_API_BASE_URL,
      apiKey: import.meta.env.VITE_AI_API_KEY,
    },
    
    // OAuth
    oauth: {
      google: {
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      },
      linkedin: {
        clientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID,
      },
    },
    
    // Feature flags
    features: {
      speechRecognition: import.meta.env.VITE_ENABLE_SPEECH_RECOGNITION === 'true',
      oauthLogin: import.meta.env.VITE_ENABLE_OAUTH_LOGIN === 'true',
      analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
      debugTools: import.meta.env.VITE_ENABLE_DEBUG_TOOLS === 'true',
      errorReporting: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
    },
    
    // Development
    debug: import.meta.env.VITE_APP_DEBUG === 'true',
    mockAiResponses: import.meta.env.VITE_MOCK_AI_RESPONSES === 'true',
    logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
    
    // Monitoring
    monitoring: {
      sentryDsn: import.meta.env.VITE_SENTRY_DSN,
      gaTrackingId: import.meta.env.VITE_GA_TRACKING_ID,
      hotjarId: import.meta.env.VITE_HOTJAR_ID,
    },
  };
};

// Log configuration (development only)
export const logConfig = () => {
  if (isDevelopment()) {
    const config = getConfig();
    console.group('🔧 Application Configuration');
    console.log('Environment:', config.environment);
    console.log('Version:', config.appVersion);
    console.log('Build Time:', config.buildTime);
    console.log('Features:', config.features);
    console.log('Debug Mode:', config.debug);
    console.groupEnd();
  }
};

// Initialize configuration
export const initConfig = () => {
  validateEnvironment();
  logConfig();
  return getConfig();
};