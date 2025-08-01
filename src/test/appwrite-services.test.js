import { describe, it, expect, beforeAll } from 'vitest';

// Mock environment variables for testing
beforeAll(() => {
  // Set required environment variables for testing
  import.meta.env.VITE_APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1';
  import.meta.env.VITE_APPWRITE_PROJECT_ID = 'test-project-id';
  import.meta.env.VITE_APPWRITE_DATABASE_ID = 'test-database-id';
  import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID = 'test-users-collection';
  import.meta.env.VITE_APPWRITE_RESUMES_COLLECTION_ID = 'test-resumes-collection';
  import.meta.env.VITE_APPWRITE_SESSIONS_COLLECTION_ID = 'test-sessions-collection';
  import.meta.env.VITE_APPWRITE_INTERACTIONS_COLLECTION_ID = 'test-interactions-collection';
  import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID = 'test-storage-bucket';
});

describe('Appwrite Services', () => {
  it('should import auth service without errors', async () => {
    const { authService, AuthService } = await import('../services/appwrite/auth.js');
    
    expect(authService).toBeDefined();
    expect(AuthService).toBeDefined();
    expect(authService).toBeInstanceOf(AuthService);
  });

  it('should import database service without errors', async () => {
    const { databaseService, DatabaseService } = await import('../services/appwrite/database.js');
    
    expect(databaseService).toBeDefined();
    expect(DatabaseService).toBeDefined();
    expect(databaseService).toBeInstanceOf(DatabaseService);
  });

  it('should import storage service without errors', async () => {
    const { storageService, StorageService } = await import('../services/appwrite/storage.js');
    
    expect(storageService).toBeDefined();
    expect(StorageService).toBeDefined();
    expect(storageService).toBeInstanceOf(StorageService);
  });

  it('should import all services from index without errors', async () => {
    const services = await import('../services/appwrite/index.js');
    
    expect(services.authService).toBeDefined();
    expect(services.databaseService).toBeDefined();
    expect(services.storageService).toBeDefined();
    expect(services.appwriteConfig).toBeDefined();
    expect(services.asyncHandler).toBeDefined();
    expect(services.formatDocumentData).toBeDefined();
  });

  it('should have correct configuration structure', async () => {
    const { appwriteConfig } = await import('../services/appwrite/config.js');
    
    expect(appwriteConfig).toHaveProperty('endpoint');
    expect(appwriteConfig).toHaveProperty('projectId');
    expect(appwriteConfig).toHaveProperty('databaseId');
    expect(appwriteConfig).toHaveProperty('collections');
    expect(appwriteConfig).toHaveProperty('storage');
    
    expect(appwriteConfig.collections).toHaveProperty('users');
    expect(appwriteConfig.collections).toHaveProperty('resumes');
    expect(appwriteConfig.collections).toHaveProperty('sessions');
    expect(appwriteConfig.collections).toHaveProperty('interactions');
    
    expect(appwriteConfig.storage).toHaveProperty('resumesBucket');
  });

  it('should have database service methods', async () => {
    const { databaseService } = await import('../services/appwrite/database.js');
    
    // User methods
    expect(typeof databaseService.createUser).toBe('function');
    expect(typeof databaseService.getUser).toBe('function');
    expect(typeof databaseService.updateUser).toBe('function');
    expect(typeof databaseService.deleteUser).toBe('function');
    
    // Resume methods
    expect(typeof databaseService.createResume).toBe('function');
    expect(typeof databaseService.getResume).toBe('function');
    expect(typeof databaseService.getUserResumes).toBe('function');
    expect(typeof databaseService.updateResume).toBe('function');
    expect(typeof databaseService.deleteResume).toBe('function');
    
    // Interview session methods
    expect(typeof databaseService.createInterviewSession).toBe('function');
    expect(typeof databaseService.getInterviewSession).toBe('function');
    expect(typeof databaseService.getUserInterviewSessions).toBe('function');
    expect(typeof databaseService.updateInterviewSession).toBe('function');
    expect(typeof databaseService.deleteInterviewSession).toBe('function');
    
    // Interaction methods
    expect(typeof databaseService.createInteraction).toBe('function');
    expect(typeof databaseService.getInteraction).toBe('function');
    expect(typeof databaseService.getSessionInteractions).toBe('function');
    expect(typeof databaseService.updateInteraction).toBe('function');
    expect(typeof databaseService.deleteInteraction).toBe('function');
  });

  it('should have storage service methods', async () => {
    const { storageService } = await import('../services/appwrite/storage.js');
    
    expect(typeof storageService.uploadFile).toBe('function');
    expect(typeof storageService.uploadFiles).toBe('function');
    expect(typeof storageService.getFile).toBe('function');
    expect(typeof storageService.getFileDownload).toBe('function');
    expect(typeof storageService.getFilePreview).toBe('function');
    expect(typeof storageService.deleteFile).toBe('function');
    expect(typeof storageService.listFiles).toBe('function');
    expect(typeof storageService.uploadResume).toBe('function');
    expect(typeof storageService.getUserResumes).toBe('function');
    expect(typeof storageService.extractTextFromFile).toBe('function');
  });

  it('should have auth service methods', async () => {
    const { authService } = await import('../services/appwrite/auth.js');
    
    expect(typeof authService.createAccount).toBe('function');
    expect(typeof authService.login).toBe('function');
    expect(typeof authService.logout).toBe('function');
    expect(typeof authService.getCurrentUser).toBe('function');
    expect(typeof authService.getCurrentSession).toBe('function');
    expect(typeof authService.loginWithGoogle).toBe('function');
    expect(typeof authService.loginWithLinkedIn).toBe('function');
    expect(typeof authService.isAuthenticated).toBe('function');
  });
});