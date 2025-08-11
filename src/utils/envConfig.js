/**
 * Environment Configuration Utilities
 * Centralized configuration management for different environments
 */

// Environment detection
export const getEnvironment = () => {
  return import.meta.env.VITE_APP_ENVIRONMENT || 'development';
};

export const isDevelopment = () => getEnvironment() === 'development';
export const isStaging = () => getEnvironment() === 'staging';
export const isProduction = () => getEnvironment() === 'production';

// Application configuration
export const appConfig = {
  name: import.meta.env.VITE_APP_NAME || 'PrepXL',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  environment: getEnvironment(),
  debug: import.meta.env.VITE_APP_DEBUG === 'true',
  buildTime: import.meta.env.__BUILD_TIME__ || new Date().toISOString(),
};

// Appwrite configuration
export const appwriteConfig = {
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
    bucketId: import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID,
  },
};

// AI API configuration
export const aiConfig = {
  baseUrl: import.meta.env.VITE_AI_API_BASE_URL,
  apiKey: import.meta.env.VITE_AI_API_KEY,
  mockResponses: import.meta.env.VITE_MOCK_AI_RESPONSES === 'true',
};

// OAuth configuration
export const oauthConfig = {
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  },
  linkedin: {
    clientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID,
  },
};

// Feature flags
export const featureFlags = {
  speechRecognition: import.meta.env.VITE_ENABLE_SPEECH_RECOGNITION === 'true',
  oauthLogin: import.meta.env.VITE_ENABLE_OAUTH_LOGIN === 'true',
  analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  debugTools: import.meta.env.VITE_ENABLE_DEBUG_TOOLS === 'true',
  errorReporting: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
};

// Monitoring configuration
export const monitoringConfig = {
  sentry: {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    enabled: featureFlags.errorReporting && !!import.meta.env.VITE_SENTRY_DSN,
    environment: getEnvironment(),
    release: appConfig.version,
  },
  analytics: {
    googleAnalytics: {
      trackingId: import.meta.env.VITE_GA_TRACKING_ID,
      enabled: featureFlags.analytics && !!import.meta.env.VITE_GA_TRACKING_ID,
    },
    hotjar: {
      id: import.meta.env.VITE_HOTJAR_ID,
      enabled: featureFlags.analytics && !!import.meta.env.VITE_HOTJAR_ID,
    },
  },
};

// Logging configuration
export const loggingConfig = {
  level: import.meta.env.VITE_LOG_LEVEL || 'info',
  enableConsole: isDevelopment() || import.meta.env.VITE_APP_DEBUG === 'true',
};

// Validation function to check required environment variables
export const validateEnvironment = () => {
  const requiredVars = [
    'VITE_APPWRITE_ENDPOINT',
    'VITE_APPWRITE_PROJECT_ID',
    'VITE_APPWRITE_DATABASE_ID',
  ];

  const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);

  if (missingVars.length > 0) {
    const error = `Missing required environment variables: ${missingVars.join(', ')}`;
    console.error('❌ Environment Configuration Error:', error);
    
    if (isProduction()) {
      throw new Error(error);
    } else {
      console.warn('⚠️ Continuing in development mode with missing variables');
    }
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
};

// Export all configurations as a single object
export const config = {
  app: appConfig,
  appwrite: appwriteConfig,
  ai: aiConfig,
  oauth: oauthConfig,
  features: featureFlags,
  monitoring: monitoringConfig,
  logging: loggingConfig,
  environment: {
    current: getEnvironment(),
    isDevelopment: isDevelopment(),
    isStaging: isStaging(),
    isProduction: isProduction(),
  },
};

// Alias for backward compatibility
export const getConfig = () => config;

// Initialize configuration (for main.jsx compatibility)
export const initConfig = () => {
  // Configuration is already initialized when this module loads
  if (isDevelopment()) {
    console.log('🔧 Configuration initialized');
  }
  return config;
};

// Development helper to log configuration (only in development)
if (isDevelopment() && loggingConfig.enableConsole) {
  console.group('🔧 Environment Configuration');
  console.log('Environment:', getEnvironment());
  console.log('App Version:', appConfig.version);
  console.log('Debug Mode:', appConfig.debug);
  console.log('Feature Flags:', featureFlags);
  console.groupEnd();
}

export default config;