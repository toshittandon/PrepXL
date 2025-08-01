import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  signupSchema,
  interviewSetupSchema,
  resumeUploadSchema,
  userProfileSchema,
  passwordChangeSchema,
  contactSchema,
  validationPatterns,
  validationMessages
} from '../../utils/validationSchemas.js';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', async () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123'
      };

      const result = await loginSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should reject invalid email format', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Password123'
      };

      try {
        await loginSchema.validate(invalidData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('valid email address');
      }
    });

    it('should reject short password', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123'
      };

      try {
        await loginSchema.validate(invalidData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('at least 8 characters');
      }
    });

    it('should reject missing required fields', async () => {
      const invalidData = {};

      try {
        await loginSchema.validate(invalidData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('required');
      }
    });
  });

  describe('signupSchema', () => {
    it('should validate correct signup data', async () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        confirmPassword: 'Password123'
      };

      const result = await signupSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should reject invalid name format', async () => {
      const invalidData = {
        name: 'John123',
        email: 'john@example.com',
        password: 'Password123',
        confirmPassword: 'Password123'
      };

      try {
        await signupSchema.validate(invalidData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('letters and spaces');
      }
    });

    it('should reject password without required complexity', async () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password',
        confirmPassword: 'password'
      };

      try {
        await signupSchema.validate(invalidData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('uppercase letter');
      }
    });

    it('should reject mismatched passwords', async () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        confirmPassword: 'Password456'
      };

      try {
        await signupSchema.validate(invalidData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('do not match');
      }
    });

    it('should reject name that is too short', async () => {
      const invalidData = {
        name: 'J',
        email: 'john@example.com',
        password: 'Password123',
        confirmPassword: 'Password123'
      };

      try {
        await signupSchema.validate(invalidData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('at least 2 characters');
      }
    });

    it('should reject name that is too long', async () => {
      const invalidData = {
        name: 'A'.repeat(51),
        email: 'john@example.com',
        password: 'Password123',
        confirmPassword: 'Password123'
      };

      try {
        await signupSchema.validate(invalidData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('less than 50 characters');
      }
    });
  });

  describe('interviewSetupSchema', () => {
    it('should validate correct interview setup data', async () => {
      const validData = {
        role: 'Software Engineer',
        experienceLevel: 'mid',
        industry: 'Technology',
        sessionType: 'Behavioral'
      };

      const result = await interviewSetupSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should validate custom role when role is Other', async () => {
      const validData = {
        role: 'Other',
        customRole: 'Machine Learning Engineer',
        experienceLevel: 'senior',
        sessionType: 'Technical'
      };

      const result = await interviewSetupSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should reject missing custom role when role is Other', async () => {
      const invalidData = {
        role: 'Other',
        experienceLevel: 'mid',
        sessionType: 'Behavioral'
      };

      try {
        await interviewSetupSchema.validate(invalidData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('specify the role');
      }
    });

    it('should reject invalid experience level', async () => {
      const invalidData = {
        role: 'Software Engineer',
        experienceLevel: 'invalid',
        sessionType: 'Behavioral'
      };

      try {
        await interviewSetupSchema.validate(invalidData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('Invalid experience level');
      }
    });

    it('should reject invalid session type', async () => {
      const invalidData = {
        role: 'Software Engineer',
        experienceLevel: 'mid',
        sessionType: 'Invalid Type'
      };

      try {
        await interviewSetupSchema.validate(invalidData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('Invalid session type');
      }
    });
  });

  describe('resumeUploadSchema', () => {
    it('should validate correct file', async () => {
      const mockFile = {
        size: 1024 * 1024, // 1MB
        type: 'application/pdf'
      };

      const validData = {
        file: [mockFile]
      };

      const result = await resumeUploadSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should reject file that is too large', async () => {
      const mockFile = {
        size: 6 * 1024 * 1024, // 6MB
        type: 'application/pdf'
      };

      const invalidData = {
        file: [mockFile]
      };

      try {
        await resumeUploadSchema.validate(invalidData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('less than 5MB');
      }
    });

    it('should reject invalid file type', async () => {
      const mockFile = {
        size: 1024 * 1024,
        type: 'image/jpeg'
      };

      const invalidData = {
        file: [mockFile]
      };

      try {
        await resumeUploadSchema.validate(invalidData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('PDF, DOC, DOCX, and TXT');
      }
    });
  });

  describe('userProfileSchema', () => {
    it('should validate correct profile data', async () => {
      const validData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        experienceLevel: 'senior',
        targetRole: 'Product Manager',
        targetIndustry: 'Technology'
      };

      const result = await userProfileSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should validate with optional fields missing', async () => {
      const validData = {
        name: 'Jane Smith',
        email: 'jane@example.com'
      };

      const result = await userProfileSchema.isValid(validData);
      expect(result).toBe(true);
    });
  });

  describe('passwordChangeSchema', () => {
    it('should validate correct password change data', async () => {
      const validData = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword456',
        confirmNewPassword: 'NewPassword456'
      };

      const result = await passwordChangeSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should reject mismatched new passwords', async () => {
      const invalidData = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword456',
        confirmNewPassword: 'DifferentPassword789'
      };

      try {
        await passwordChangeSchema.validate(invalidData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('do not match');
      }
    });
  });

  describe('contactSchema', () => {
    it('should validate correct contact data', async () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Question about the service',
        message: 'I have a question about how the interview preparation works.'
      };

      const result = await contactSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should reject message that is too short', async () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Question',
        message: 'Short'
      };

      try {
        await contactSchema.validate(invalidData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('at least 10 characters');
      }
    });

    it('should reject subject that is too short', async () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Hi',
        message: 'This is a longer message that meets the minimum requirements.'
      };

      try {
        await contactSchema.validate(invalidData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('at least 5 characters');
      }
    });
  });

  describe('validationPatterns', () => {
    it('should validate email pattern', () => {
      expect(validationPatterns.email.test('test@example.com')).toBe(true);
      expect(validationPatterns.email.test('invalid-email')).toBe(false);
    });

    it('should validate password pattern', () => {
      expect(validationPatterns.password.test('Password123')).toBe(true);
      expect(validationPatterns.password.test('password')).toBe(false);
      expect(validationPatterns.password.test('PASSWORD123')).toBe(false);
      expect(validationPatterns.password.test('Password')).toBe(false);
    });

    it('should validate name pattern', () => {
      expect(validationPatterns.name.test('John Doe')).toBe(true);
      expect(validationPatterns.name.test('John123')).toBe(false);
    });

    it('should validate alphanumeric pattern', () => {
      expect(validationPatterns.alphanumeric.test('abc123')).toBe(true);
      expect(validationPatterns.alphanumeric.test('abc-123')).toBe(false);
    });

    it('should validate phone pattern', () => {
      expect(validationPatterns.phone.test('+1234567890')).toBe(true);
      expect(validationPatterns.phone.test('1234567890')).toBe(true);
      expect(validationPatterns.phone.test('abc')).toBe(false);
    });
  });

  describe('validationMessages', () => {
    it('should generate required field message', () => {
      expect(validationMessages.required('Email')).toBe('Email is required');
    });

    it('should generate min length message', () => {
      expect(validationMessages.minLength('Password', 8)).toBe('Password must be at least 8 characters long');
    });

    it('should generate max length message', () => {
      expect(validationMessages.maxLength('Name', 50)).toBe('Name must be less than 50 characters');
    });
  });
});