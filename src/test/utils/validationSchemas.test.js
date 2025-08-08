import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  signupSchema,
  profileSetupSchema,
  interviewSetupSchema,
  resumeUploadSchema,
  questionSchema
} from '../../utils/validationSchemas.js'

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', async () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      }
      
      const result = await loginSchema.isValid(validData)
      expect(result).toBe(true)
    })

    it('should reject invalid email', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      }
      
      try {
        await loginSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toMatch(/invalid email/i)
      }
    })

    it('should reject missing email', async () => {
      const invalidData = {
        password: 'password123'
      }
      
      try {
        await loginSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toMatch(/email is required/i)
      }
    })

    it('should reject missing password', async () => {
      const invalidData = {
        email: 'test@example.com'
      }
      
      try {
        await loginSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toMatch(/password is required/i)
      }
    })

    it('should reject short password', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123'
      }
      
      try {
        await loginSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toMatch(/password must be at least/i)
      }
    })
  })

  describe('signupSchema', () => {
    it('should validate correct signup data', async () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        acceptTerms: true
      }
      
      const result = await signupSchema.isValid(validData)
      expect(result).toBe(true)
    })

    it('should reject short name', async () => {
      const invalidData = {
        name: 'J',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        acceptTerms: true
      }
      
      try {
        await signupSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toMatch(/name must be at least/i)
      }
    })

    it('should reject password mismatch', async () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'different123',
        acceptTerms: true
      }
      
      try {
        await signupSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toMatch(/passwords must match/i)
      }
    })

    it('should reject when terms not accepted', async () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        acceptTerms: false
      }
      
      try {
        await signupSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toMatch(/must accept.*terms/i)
      }
    })

    it('should reject weak password', async () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '1234567', // 7 characters, too short
        confirmPassword: '1234567',
        acceptTerms: true
      }
      
      try {
        await signupSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toMatch(/password must be at least 8 characters/i)
      }
    })
  })

  describe('profileSetupSchema', () => {
    it('should validate correct profile data', async () => {
      const validData = {
        experienceLevel: 'Mid',
        targetRole: 'Software Engineer',
        targetIndustry: 'Technology'
      }
      
      const result = await profileSetupSchema.isValid(validData)
      expect(result).toBe(true)
    })

    it('should reject invalid experience level', async () => {
      const invalidData = {
        experienceLevel: 'Invalid',
        targetRole: 'Software Engineer',
        targetIndustry: 'Technology'
      }
      
      try {
        await profileSetupSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toMatch(/experience level must be one of/i)
      }
    })

    it('should reject missing required fields', async () => {
      const invalidData = {
        experienceLevel: 'Mid'
        // Missing targetRole and targetIndustry
      }
      
      try {
        await profileSetupSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toMatch(/target role is required/i)
      }
    })

    it('should accept all valid experience levels', async () => {
      const experienceLevels = ['Entry', 'Mid', 'Senior', 'Executive']
      
      for (const level of experienceLevels) {
        const validData = {
          experienceLevel: level,
          targetRole: 'Software Engineer',
          targetIndustry: 'Technology'
        }
        
        const result = await profileSetupSchema.isValid(validData)
        expect(result).toBe(true)
      }
    })
  })

  describe('interviewSetupSchema', () => {
    it('should validate correct interview setup data', async () => {
      const validData = {
        sessionType: 'Behavioral',
        role: 'Software Engineer'
      }
      
      const result = await interviewSetupSchema.isValid(validData)
      expect(result).toBe(true)
    })

    it('should reject invalid session type', async () => {
      const invalidData = {
        sessionType: 'Invalid',
        role: 'Software Engineer'
      }
      
      try {
        await interviewSetupSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toMatch(/session type must be one of/i)
      }
    })

    it('should reject missing role', async () => {
      const invalidData = {
        sessionType: 'Behavioral'
        // Missing role
      }
      
      try {
        await interviewSetupSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toMatch(/role is required/i)
      }
    })

    it('should accept all valid session types', async () => {
      const sessionTypes = ['Behavioral', 'Technical', 'Case Study']
      
      for (const type of sessionTypes) {
        const validData = {
          sessionType: type,
          role: 'Software Engineer'
        }
        
        const result = await interviewSetupSchema.isValid(validData)
        expect(result).toBe(true)
      }
    })
  })

  describe('resumeUploadSchema', () => {
    it('should validate correct resume upload data', async () => {
      const validData = {
        jobDescription: 'We are looking for a software engineer with React experience...'
      }
      
      const result = await resumeUploadSchema.isValid(validData)
      expect(result).toBe(true)
    })

    it('should reject missing job description', async () => {
      const invalidData = {}
      
      try {
        await resumeUploadSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toMatch(/job description is required/i)
      }
    })

    it('should reject short job description', async () => {
      const invalidData = {
        jobDescription: 'Short'
      }
      
      try {
        await resumeUploadSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toMatch(/job description must be at least/i)
      }
    })

    it('should reject overly long job description', async () => {
      const invalidData = {
        jobDescription: 'A'.repeat(5001) // Over 5000 characters
      }
      
      try {
        await resumeUploadSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toMatch(/job description must be at most/i)
      }
    })
  })

  describe('questionSchema', () => {
    it('should validate correct question data', async () => {
      const validData = {
        questionText: 'Tell me about a challenging project you worked on',
        category: 'Behavioral',
        role: 'Software Engineer',
        suggestedAnswer: 'I worked on a project where...'
      }
      
      const result = await questionSchema.isValid(validData)
      expect(result).toBe(true)
    })

    it('should reject missing question text', async () => {
      const invalidData = {
        category: 'Behavioral',
        role: 'Software Engineer',
        suggestedAnswer: 'Answer...'
      }
      
      try {
        await questionSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toMatch(/question text is required/i)
      }
    })

    it('should reject invalid category', async () => {
      const invalidData = {
        questionText: 'Test question',
        category: 'Invalid',
        role: 'Software Engineer',
        suggestedAnswer: 'Answer...'
      }
      
      try {
        await questionSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toMatch(/category must be one of/i)
      }
    })

    it('should reject short question text', async () => {
      const invalidData = {
        questionText: 'Hi?',
        category: 'Behavioral',
        role: 'Software Engineer',
        suggestedAnswer: 'Answer...'
      }
      
      try {
        await questionSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toMatch(/question text must be at least/i)
      }
    })

    it('should reject short suggested answer', async () => {
      const invalidData = {
        questionText: 'Tell me about yourself',
        category: 'Behavioral',
        role: 'Software Engineer',
        suggestedAnswer: 'Hi'
      }
      
      try {
        await questionSchema.validate(invalidData)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toMatch(/suggested answer must be at least/i)
      }
    })

    it('should accept all valid categories', async () => {
      const categories = ['Behavioral', 'Technical', 'Case Study']
      
      for (const category of categories) {
        const validData = {
          questionText: 'Test question for validation',
          category: category,
          role: 'Software Engineer',
          suggestedAnswer: 'This is a suggested answer for the test question.'
        }
        
        const result = await questionSchema.isValid(validData)
        expect(result).toBe(true)
      }
    })
  })

  describe('Schema Edge Cases', () => {
    it('should handle null values', async () => {
      try {
        await loginSchema.validate(null)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toBeDefined()
      }
    })

    it('should handle undefined values', async () => {
      try {
        await loginSchema.validate(undefined)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toBeDefined()
      }
    })

    it('should handle empty objects', async () => {
      try {
        await loginSchema.validate({})
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toMatch(/email is required/i)
      }
    })

    it('should trim whitespace from strings', async () => {
      const dataWithWhitespace = {
        email: '  test@example.com  ',
        password: '  password123  '
      }
      
      const validatedData = await loginSchema.validate(dataWithWhitespace)
      expect(validatedData.email).toBe('test@example.com')
      expect(validatedData.password).toBe('password123')
    })
  })
})