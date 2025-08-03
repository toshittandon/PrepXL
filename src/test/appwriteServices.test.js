/**
 * Test file for Appwrite services
 */

import { describe, it, expect } from 'vitest'

describe('Appwrite Services', () => {
  describe('Client Configuration', () => {
    it('should have proper environment configuration', async () => {
      const { getConfig } = await import('../utils/envConfig.js')
      const config = getConfig()
      
      expect(config.appwrite.endpoint).toBeDefined()
      expect(config.appwrite.projectId).toBeDefined()
      expect(config.appwrite.databaseId).toBeDefined()
    })
  })

  describe('Data Transformation', () => {
    it('should transform user data correctly', async () => {
      const { transformUserData } = await import('../utils/dataTransformation.js')
      
      const mockUser = {
        $id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        experienceLevel: 'Mid',
        isAdmin: false,
        $createdAt: '2024-01-01T00:00:00.000Z'
      }

      const transformed = transformUserData(mockUser)
      
      expect(transformed.id).toBe('user123')
      expect(transformed.displayName).toBe('John Doe')
      expect(transformed.initials).toBe('JD')
      expect(transformed.experienceLevelDisplay).toBe('Mid Level')
    })

    it('should transform resume data correctly', async () => {
      const { transformResumeData } = await import('../utils/dataTransformation.js')
      
      const mockResume = {
        $id: 'resume123',
        userId: 'user123',
        fileName: 'resume.pdf',
        analysisResults: {
          matchScore: 85
        },
        $createdAt: '2024-01-01T00:00:00.000Z'
      }

      const transformed = transformResumeData(mockResume)
      
      expect(transformed.id).toBe('resume123')
      expect(transformed.fileExtension).toBe('pdf')
      expect(transformed.hasAnalysis).toBe(true)
      expect(transformed.matchScore).toBe(85)
      expect(transformed.matchScoreDisplay.level).toBe('excellent')
    })
  })

  describe('Validation Schemas', () => {
    it('should validate user data correctly', async () => {
      const { validateUserData } = await import('../utils/validationSchemas.js')
      
      const validUserData = {
        name: 'John Doe',
        email: 'john@example.com',
        experienceLevel: 'Mid',
        targetRole: 'Software Engineer',
        isAdmin: false
      }

      const result = await validateUserData(validUserData)
      expect(result.name).toBe('John Doe')
      expect(result.email).toBe('john@example.com')
    })

    it('should reject invalid user data', async () => {
      const { validateUserData } = await import('../utils/validationSchemas.js')
      
      const invalidUserData = {
        name: '', // Invalid: empty name
        email: 'invalid-email', // Invalid: bad email format
        experienceLevel: 'Invalid' // Invalid: not in allowed values
      }

      await expect(validateUserData(invalidUserData)).rejects.toThrow()
    })
  })

  describe('Error Handling', () => {
    it('should handle Appwrite errors correctly', async () => {
      const { handleAppwriteError } = await import('../utils/errorHandling.js')
      
      const mockAppwriteError = {
        code: 401,
        type: 'user_invalid_credentials',
        message: 'Invalid credentials'
      }

      const handledError = handleAppwriteError(mockAppwriteError)
      
      expect(handledError).toBeInstanceOf(Error)
      expect(handledError.message).toContain('Invalid email or password')
      expect(handledError.code).toBe(401)
    })

    it('should categorize errors correctly', async () => {
      const { categorizeError, ERROR_TYPES } = await import('../utils/errorHandling.js')
      
      const authError = { code: 401 }
      const networkError = { name: 'NetworkError' }
      const validationError = { code: 400 }

      expect(categorizeError(authError)).toBe(ERROR_TYPES.AUTHENTICATION)
      expect(categorizeError(networkError)).toBe(ERROR_TYPES.NETWORK)
      expect(categorizeError(validationError)).toBe(ERROR_TYPES.VALIDATION)
    })
  })
})