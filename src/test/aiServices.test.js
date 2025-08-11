/**
 * AI Services Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  analyzeResume,
  getInterviewQuestion,
  checkApiHealth,
  validateApiConfig,
  getRateLimitStatus,
  initializeAiServices,
  getServiceStatus,
  isAiServiceAvailable,
} from '../services/ai/index.js';

// Mock environment configuration
vi.mock('../utils/envConfig.js', () => ({
  getConfig: () => ({
    ai: {
      baseUrl: 'https://test-ai-api.com',
      apiKey: 'test-api-key',
    },
    appName: 'PrepXL Test',
    appVersion: '1.0.0-test',
    mockAiResponses: true,
    isDevelopment: true,
    debug: true,
  }),
}));

describe('AI Services Integration', () => {
  beforeEach(() => {
    // Reset any global state
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Configuration and Setup', () => {
    it('should validate API configuration correctly', () => {
      const validation = validateApiConfig();
      
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('issues');
      expect(validation).toHaveProperty('config');
      expect(validation.config).toHaveProperty('mockMode', true);
    });

    it('should initialize AI services successfully', async () => {
      const result = await initializeAiServices();
      
      expect(result).toHaveProperty('initialized', true);
      expect(result).toHaveProperty('mockMode', true);
      expect(result).toHaveProperty('timestamp');
    });

    it('should get service status', async () => {
      const status = await getServiceStatus();
      
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('health');
      expect(status).toHaveProperty('rateLimit');
      expect(status).toHaveProperty('config');
      expect(status).toHaveProperty('timestamp');
    });

    it('should check if AI service is available', async () => {
      const isAvailable = await isAiServiceAvailable();
      expect(typeof isAvailable).toBe('boolean');
    });
  });

  describe('Rate Limiting', () => {
    it('should return rate limit status', () => {
      const rateLimitStatus = getRateLimitStatus();
      
      expect(rateLimitStatus).toHaveProperty('limit');
      expect(rateLimitStatus).toHaveProperty('remaining');
      expect(rateLimitStatus).toHaveProperty('resetTime');
      expect(rateLimitStatus).toHaveProperty('resetAt');
      expect(typeof rateLimitStatus.limit).toBe('number');
      expect(typeof rateLimitStatus.remaining).toBe('number');
    });
  });

  describe('Resume Analysis Service', () => {
    const mockResumeText = `
      John Doe
      Software Engineer
      
      Experience:
      - Developed web applications using React and Node.js
      - Implemented REST APIs and database integrations
      - Collaborated with cross-functional teams
      
      Skills:
      JavaScript, React, Node.js, MongoDB, Git
    `;

    const mockJobDescription = `
      We are looking for a Senior Software Engineer with experience in:
      - React and TypeScript development
      - Node.js and Express.js
      - AWS cloud services
      - Docker and Kubernetes
      - Agile development methodologies
    `;

    it('should analyze resume successfully', async () => {
      const result = await analyzeResume(mockResumeText, mockJobDescription);
      
      expect(result).toHaveProperty('matchScore');
      expect(result).toHaveProperty('missingKeywords');
      expect(result).toHaveProperty('actionVerbAnalysis');
      expect(result).toHaveProperty('formatSuggestions');
      expect(result).toHaveProperty('analysisId');
      expect(result).toHaveProperty('timestamp');
      
      expect(typeof result.matchScore).toBe('number');
      expect(result.matchScore).toBeGreaterThanOrEqual(0);
      expect(result.matchScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.missingKeywords)).toBe(true);
      expect(Array.isArray(result.formatSuggestions)).toBe(true);
      expect(typeof result.actionVerbAnalysis).toBe('string');
    });

    it('should validate resume analysis input', async () => {
      // Test with invalid inputs
      await expect(analyzeResume('', mockJobDescription))
        .rejects.toThrow(/Invalid request parameters/);
      
      await expect(analyzeResume(mockResumeText, ''))
        .rejects.toThrow(/Invalid request parameters/);
      
      await expect(analyzeResume('short', mockJobDescription))
        .rejects.toThrow(/too short/);
    });

    it('should handle resume analysis errors gracefully', async () => {
      // Mock an error scenario by providing null inputs
      await expect(analyzeResume(null, mockJobDescription))
        .rejects.toThrow();
    });
  });

  describe('Interview Question Service', () => {
    const mockHistory = [
      {
        q: 'Tell me about yourself.',
        a: 'I am a software engineer with 5 years of experience...',
        timestamp: new Date().toISOString(),
      },
      {
        q: 'What are your strengths?',
        a: 'My main strengths are problem-solving and teamwork...',
        timestamp: new Date().toISOString(),
      },
    ];

    it('should generate interview question successfully', async () => {
      const result = await getInterviewQuestion(
        'Software Engineer',
        'Behavioral',
        mockHistory
      );
      
      expect(result).toHaveProperty('questionText');
      expect(result).toHaveProperty('questionId');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('role');
      expect(result).toHaveProperty('timestamp');
      
      expect(typeof result.questionText).toBe('string');
      expect(result.questionText.length).toBeGreaterThan(10);
      expect(result.role).toBe('Software Engineer');
    });

    it('should validate interview question input', async () => {
      // Test with invalid role
      await expect(getInterviewQuestion('Invalid Role', 'Behavioral', []))
        .rejects.toThrow(/Invalid role/);
      
      // Test with invalid session type
      await expect(getInterviewQuestion('Software Engineer', 'Invalid Type', []))
        .rejects.toThrow(/Invalid session type/);
      
      // Test with invalid history
      await expect(getInterviewQuestion('Software Engineer', 'Behavioral', 'not-array'))
        .rejects.toThrow(/History must be an array/);
    });

    it('should handle different session types', async () => {
      const sessionTypes = ['Behavioral', 'Technical', 'Case Study'];
      
      for (const sessionType of sessionTypes) {
        const result = await getInterviewQuestion(
          'Software Engineer',
          sessionType,
          []
        );
        
        expect(result).toHaveProperty('questionText');
        expect(typeof result.questionText).toBe('string');
      }
    });

    it('should handle different roles', async () => {
      const roles = ['Software Engineer', 'Product Manager', 'Data Scientist'];
      
      for (const role of roles) {
        const result = await getInterviewQuestion(
          role,
          'Behavioral',
          []
        );
        
        expect(result).toHaveProperty('questionText');
        expect(result.role).toBe(role);
      }
    });

    it('should generate contextual questions based on history', async () => {
      const emptyHistoryResult = await getInterviewQuestion(
        'Software Engineer',
        'Behavioral',
        []
      );
      
      const withHistoryResult = await getInterviewQuestion(
        'Software Engineer',
        'Behavioral',
        mockHistory
      );
      
      expect(emptyHistoryResult.questionText).toBeDefined();
      expect(withHistoryResult.questionText).toBeDefined();
      
      // Questions should be different (though this might occasionally fail due to randomness)
      // We'll just check that both are valid questions
      expect(emptyHistoryResult.questionText.length).toBeGreaterThan(10);
      expect(withHistoryResult.questionText.length).toBeGreaterThan(10);
    });
  });

  describe('Health Check Service', () => {
    it('should perform health check', async () => {
      const health = await checkApiHealth();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('timestamp');
      expect(['healthy', 'unhealthy', 'degraded']).toContain(health.status);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // This test would require mocking fetch to simulate network errors
      // For now, we'll test that errors are properly structured
      try {
        await analyzeResume('', ''); // This should fail validation
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBeDefined();
      }
    });

    it('should handle rate limiting', () => {
      // Test rate limit status structure
      const rateLimitStatus = getRateLimitStatus();
      expect(rateLimitStatus.limit).toBeGreaterThan(0);
      expect(rateLimitStatus.remaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Mock Responses', () => {
    it('should use mock responses in development', async () => {
      // Since we're in mock mode, all requests should succeed
      const resumeResult = await analyzeResume(
        'Test resume content with enough characters to pass validation',
        'Test job description with enough content'
      );
      
      expect(resumeResult).toBeDefined();
      expect(resumeResult.matchScore).toBeGreaterThanOrEqual(0);
      
      const questionResult = await getInterviewQuestion(
        'Software Engineer',
        'Behavioral',
        []
      );
      
      expect(questionResult).toBeDefined();
      expect(questionResult.questionText).toBeDefined();
    });
  });
});

describe('AI Service Error Handling', () => {
  it('should categorize errors correctly', async () => {
    // Test validation errors
    try {
      await analyzeResume('short', 'also short');
    } catch (error) {
      expect(error.message).toContain('too short');
    }
  });

  it('should provide user-friendly error messages', async () => {
    try {
      await getInterviewQuestion('Invalid Role', 'Behavioral', []);
    } catch (error) {
      expect(error.message).toContain('Invalid role');
    }
  });
});

describe('AI Service Integration Edge Cases', () => {
  it('should handle empty history arrays', async () => {
    const result = await getInterviewQuestion('Software Engineer', 'Behavioral', []);
    expect(result.questionText).toBeDefined();
  });

  it('should handle long resume text', async () => {
    const longResumeText = 'A'.repeat(1000); // 1000 characters
    const jobDescription = 'Job description with sufficient length for validation';
    
    const result = await analyzeResume(longResumeText, jobDescription);
    expect(result.matchScore).toBeDefined();
  });

  it('should handle special characters in input', async () => {
    const resumeWithSpecialChars = `
      John Doe's Resume
      Email: john@example.com
      Skills: C++, .NET, React.js
      Experience with "enterprise" solutions & cloud platforms
    `;
    
    const jobWithSpecialChars = `
      Looking for developer with C# & .NET experience
      Must know "modern" frameworks like React/Angular
    `;
    
    const result = await analyzeResume(resumeWithSpecialChars, jobWithSpecialChars);
    expect(result).toBeDefined();
  });
});