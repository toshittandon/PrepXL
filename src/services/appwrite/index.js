// Export all Appwrite services and utilities
export { authService, AuthService } from './auth.js';
export { databaseService, DatabaseService } from './database.js';
export { storageService, StorageService } from './storage.js';
export { 
  account, 
  databases, 
  storage, 
  appwriteConfig 
} from './config.js';
export {
  createResponse,
  successResponse,
  errorResponse,
  handleAppwriteError,
  asyncHandler,
  validateConfig,
  formatUserData,
  formatDocumentData,
  formatDocuments,
  generateId,
  retryRequest
} from './utils.js';

// Validate configuration on import
import { validateConfig } from './utils.js';

try {
  validateConfig();
} catch (error) {
  console.warn('Appwrite configuration validation failed:', error.message);
  console.warn('Please ensure all required environment variables are set in your .env file');
}