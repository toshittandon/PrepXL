import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  signupSchema,
  resumeUploadSchema,
  interviewSetupSchema,
  profileSetupSchema,
  questionSchema
} from '../../utils/validationSchemas.js'

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('validates correct login data', async () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      }
      
      const result = await loginSchema.isValid(validData)
      expect(result).toBe(true)
    })

    it('rejects invalid email', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      }
      
      try {
        await loginSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toContain('email')
      }
    })

    it('rejects missing email', async () => {
      const invalidData = {
        password: 'password123'
      }
      
      try {
        await loginSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toContain('required')
      }
    })

    it('rejects missing password', async () => {
      const invalidData = {
        email: 'test@example.com'
      }
      
      try {
        await loginSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toContain('required')
      }
    })

    it('rejects short password', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123'
      }
      
      try {
        await loginSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toContain('6')
      }
    })
  })

  describe('signupSchema', () => {
    it('validates correct signup data', async () => {
      const validData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      }
      
      const result = await signupSchema.isValid(validData)
      expect(result).toBe(true)
    })

    it('rejects missing name', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      }
      
      try {
        await signupSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toContain('name')
      }
    })

    it('rejects password mismatch', async () => {
      const invalidData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'different123'
      }
      
      try {
        await signupSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toContain('match')
      }
    })

    it('requires minimum password length', async () => {
      const invalidData = {
        name: 'Test User',
        email: 'test@example.com',
        password: '1234567',
        confirmPassword: '1234567'
      }
      
      try {
        await signupSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toContain('8')
      }
    })
  })

  describe('resumeUploadSchema', () => {
    it('validates correct resume upload data', async () => {
      const validData = {
        jobDescription: 'Software Engineer position requiring React and Node.js experience...'
      }
      
      const result = await resumeUploadSchema.isValid(validData)
      expect(result).toBe(true)
    })

    it('rejects missing job description', async () => {
      const invalidData = {}
      
      try {
        await resumeUploadSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toContain('required')
      }
    })

    it('rejects short job description', async () => {
      const invalidData = {
        jobDescription: 'Too short'
      }
      
      try {
        await resumeUploadSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toContain('50')
      }
    })
  })

  describe('interviewSetupSchema', () => {
    it('validates correct interview setup data', async () => {
      const validData = {
        role: 'Software Engineer',
        sessionType: 'Behavioral',
        experienceLevel: 'Mid'
      }
      
      const result = await interviewSetupSchema.isValid(validData)
      expect(result).toBe(true)
    })

    it('rejects missing role', async () => {
      const invalidData = {
        sessionType: 'Behavioral',
        experienceLevel: 'Mid'
      }
      
      try {
        await interviewSetupSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toContain('role')
      }
    })

    it('rejects invalid session type', async () => {
      const invalidData = {
        role: 'Software Engineer',
        sessionType: 'InvalidType',
        experienceLevel: 'Mid'
      }
      
      try {
        await interviewSetupSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toContain('valid')
      }
    })

    it('accepts valid session types', async () => {
      const validTypes = ['Behavioral', 'Technical', 'Case Study']
      
      for (const sessionType of validTypes) {
        const validData = {
          role: 'Software Engineer',
          sessionType,
          experienceLevel: 'Mid'
        }
        
        const result = await interviewSetupSchema.isValid(validData)
        expect(result).toBe(true)
      }
    })
  })

  describe('profileSetupSchema', () => {
    it('validates correct profile setup data', async () => {
      const validData = {
        experienceLevel: 'Senior',
        targetRole: 'Software Engineer',
        targetIndustry: 'Technology'
      }
      
      const result = await profileSetupSchema.isValid(validData)
      expect(result).toBe(true)
    })

    it('rejects missing experience level', async () => {
      const invalidData = {
        targetRole: 'Software Engineer',
        targetIndustry: 'Technology'
      }
      
      try {
        await profileSetupSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toContain('experience')
      }
    })

    it('accepts valid experience levels', async () => {
      const validLevels = ['Entry', 'Mid', 'Senior', 'Executive']
      
      for (const experienceLevel of validLevels) {
        const validData = {
          experienceLevel,
          targetRole: 'Software Engineer',
          targetIndustry: 'Technology'
        }
        
        const result = await profileSetupSchema.isValid(validData)
        expect(result).toBe(true)
      }
    })
  })

  describe('questionSchema', () => {
    it('validates correct question data', async () => {
      const validData = {
        questionText: 'Tell me about a challenging project you worked on',
        category: 'Behavioral',
        role: 'Software Engineer',
        suggestedAnswer: 'This is a sample answer that provides guidance...'
      }
      
      const result = await questionSchema.isValid(validData)
      expect(result).toBe(true)
    })

    it('rejects missing question text', async () => {
      const invalidData = {
        category: 'Behavioral',
        role: 'Software Engineer',
        suggestedAnswer: 'Sample answer'
      }
      
      try {
        await questionSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toContain('question')
      }
    })

    it('rejects short question text', async () => {
      const invalidData = {
        questionText: 'Short',
        category: 'Behavioral',
        role: 'Software Engineer',
        suggestedAnswer: 'Sample answer'
      }
      
      try {
        await questionSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toContain('10')
      }
    })

    it('accepts valid categories', async () => {
      const validCategories = ['Behavioral', 'Technical', 'Case Study']
      
      for (const category of validCategories) {
        const validData = {
          questionText: 'Tell me about a challenging project you worked on',
          category,
          role: 'Software Engineer',
          suggestedAnswer: 'Sample answer'
        }
        
        const result = await questionSchema.isValid(validData)
        expect(result).toBe(true)
      }
    })

    it('rejects invalid category', async () => {
      const invalidData = {
        questionText: 'Tell me about a challenging project you worked on',
        category: 'InvalidCategory',
        role: 'Software Engineer',
        suggestedAnswer: 'Sample answer'
      }
      
      try {
        await questionSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toContain('valid')
      }
    })
  })

  describe('Edge Cases', () => {
    it('handles null values gracefully', async () => {
      try {
        await loginSchema.validate(null)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toBeDefined()
      }
    })

    it('handles undefined values gracefully', async () => {
      try {
        await loginSchema.validate(undefined)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toBeDefined()
      }
    })

    it('handles empty objects', async () => {
      try {
        await loginSchema.validate({})
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toBeDefined()
      }
    })

    it('trims whitespace from string fields', async () => {
      const dataWithWhitespace = {
        email: '  test@example.com  ',
        password: '  password123  '
      }
      
      const validatedData = await loginSchema.validate(dataWithWhitespace)
      expect(validatedData.email).toBe('test@example.com')
      expect(validatedData.password).toBe('password123')
    })

    it('converts email to lowercase', async () => {
      const dataWithUppercase = {
        email: 'TEST@EXAMPLE.COM',
        password: 'password123'
      }
      
      const validatedData = await loginSchema.validate(dataWithUppercase)
      expect(validatedData.email).toBe('test@example.com')
    })
  })
})