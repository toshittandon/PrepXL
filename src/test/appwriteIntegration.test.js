/**
 * Integration test for Appwrite services
 */

import { describe, it, expect } from 'vitest'

describe('Appwrite Integration', () => {
  it('should import client configuration correctly', async () => {
    const { client, appwriteConfig } = await import('../services/appwrite/client.js')
    
    expect(client).toBeDefined()
    expect(appwriteConfig).toBeDefined()
    expect(appwriteConfig.databaseId).toBeDefined()
    expect(appwriteConfig.collections).toBeDefined()
    expect(appwriteConfig.storage).toBeDefined()
  })

  it('should import authentication services correctly', async () => {
    const authModule = await import('../services/appwrite/auth.js')
    
    expect(authModule.createAccount).toBeDefined()
    expect(authModule.signInWithEmail).toBeDefined()
    expect(authModule.getCurrentUser).toBeDefined()
    expect(authModule.signOut).toBeDefined()
  })

  it('should import database services correctly', async () => {
    const dbModule = await import('../services/appwrite/database.js')
    
    expect(dbModule.createUser).toBeDefined()
    expect(dbModule.getUserById).toBeDefined()
    expect(dbModule.createResume).toBeDefined()
    expect(dbModule.createInterviewSession).toBeDefined()
    expect(dbModule.createQuestion).toBeDefined()
  })

  it('should import storage services correctly', async () => {
    const storageModule = await import('../services/appwrite/storage.js')
    
    expect(storageModule.uploadResumeFile).toBeDefined()
    expect(storageModule.validateFile).toBeDefined()
    expect(storageModule.getFileDownloadUrl).toBeDefined()
    expect(storageModule.deleteFile).toBeDefined()
  })

  it('should import main index correctly', async () => {
    const indexModule = await import('../services/appwrite/index.js')
    
    expect(indexModule.client).toBeDefined()
    expect(indexModule.appwriteConfig).toBeDefined()
    expect(indexModule.appwriteUtils).toBeDefined()
  })
})