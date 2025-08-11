/**
 * Enhanced AI Service Integration Tests
 * Tests for the enhanced features implemented in task 9
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  analyzeResume,
  getInterviewQuestion,
  getServiceCapabilities,
  runServiceDiagnostics,
  getPerformanceMetrics,
  resetServiceState,
  getRateLimitStatus,
  getDetailedConfig,
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
    environment: 'test',
  }),
}));

describe('Enhanced AI Service Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Enhanced Rate Limiting', () => {
    it('should provide detailed rate limit status', () => {
      const status = getRateLimitStatus();
      
      expect(status).toHaveProperty('limit');
      expect(status).toHaveProperty('remaining');
      expect(status).toHaveProperty('resetTime');
      expect(status).toHaveProperty('resetAt');
      expect(status).toHaveProperty('blocked');
      expect(status).toHaveProperty('blockedUntil');
      expect(status).toHaveProperty('consecutiveFailures');
      expect(status).toHaveProperty('adaptiveThrottling');
      
      expect(status.adaptiveThrottling).toHaveProperty('enabled');
      expect(status.adaptiveThrottling).toHaveProperty('failureCount');
      expect(status.adaptiveThrottling).toHaveProperty('lastFailure');
    });

    it('should reset service state successfully', () => {
      const result = resetServiceState();
      
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('details');
      expect(result).toHaveProperty('timestamp');
      expect(result.details).toHaveProperty('rateLimitReset', true);
    });
  });

  describe('Graceful Degradation', () => {
    it('should handle resume analysis with fallback', async () => {
      const resumeText = 'Test resume content with sufficient length for validation purposes and proper formatting.';
      const jobDescription = 'Test job description with requirements and qualifications for testing purposes.';
      
      const result = await analyzeResume(resumeText, jobDescription);
      
      expect(result).toHaveProperty('matchScore');
      expect(result).toHaveProperty('missingKeywords');
      expect(result).toHaveProperty('actionVerbAnalysis');
      expect(result).toHaveProperty('formatSuggestions');
      
      // Check if fallback indicators are present (they might be if service fails)
      if (result._degradedService) {
        expect(result).toHaveProperty('_fallbackReason');
      }
    });

    it('should handle interview questions with fallback', async () => {
      const result = await getInterviewQuestion('Software Engineer', 'Behavioral', []);
      
      expect(result).toHaveProperty('questionText');
      expect(result).toHaveProperty('questionId');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('role');
      
      // Check if fallback indicators are present (they might be if service fails)
      if (result._degradedService) {
        expect(result).toHaveProperty('_fallbackReason');
      }
    });

    it('should disable fallback when requested', async () => {
      const resumeText = 'Test resume content with sufficient length for validation purposes and proper formatting.';
      const jobDescription = 'Test job description with requirements and qualifications for testing purposes.';
      
      // This should work in mock mode even with fallback disabled
      const result = await analyzeResume(resumeText, jobDescription, { disableFallback: true });
      
      expect(result).toHaveProperty('matchScore');
      expect(result).not.toHaveProperty('_degradedService');
    });
  });

  describe('Service Capabilities', () => {
    it('should provide comprehensive service capabilities', () => {
      const capabilities = getServiceCapabilities();
      
      expect(capabilities).toHaveProperty('resumeAnalysis');
      expect(capabilities).toHaveProperty('interviewQuestions');
      expect(capabilities).toHaveProperty('errorHandling');
      expect(capabilities).toHaveProperty('rateLimit');
      expect(capabilities).toHaveProperty('general');
      
      // Resume analysis capabilities
      expect(capabilities.resumeAnalysis).toHaveProperty('available', true);
      expect(capabilities.resumeAnalysis).toHaveProperty('features');
      expect(capabilities.resumeAnalysis).toHaveProperty('limits');
      expect(capabilities.resumeAnalysis.features).toContain('Graceful degradation');
      expect(capabilities.resumeAnalysis.features).toContain('Fallback responses');
      
      // Interview questions capabilities
      expect(capabilities.interviewQuestions).toHaveProperty('available', true);
      expect(capabilities.interviewQuestions).toHaveProperty('sessionTypes');
      expect(capabilities.interviewQuestions).toHaveProperty('roles');
      expect(capabilities.interviewQuestions).toHaveProperty('features');
      expect(capabilities.interviewQuestions.features).toContain('Graceful degradation');
      expect(capabilities.interviewQuestions.features).toContain('Fallback responses');
      
      // Error handling capabilities
      expect(capabilities.errorHandling).toHaveProperty('circuitBreaker', true);
      expect(capabilities.errorHandling).toHaveProperty('retryLogic', true);
      expect(capabilities.errorHandling).toHaveProperty('adaptiveThrottling', true);
      expect(capabilities.errorHandling).toHaveProperty('gracefulDegradation', true);
      expect(capabilities.errorHandling).toHaveProperty('fallbackResponses', true);
      
      // Rate limiting capabilities
      expect(capabilities.rateLimit).toHaveProperty('enabled');
      expect(capabilities.rateLimit).toHaveProperty('limit');
      expect(capabilities.rateLimit).toHaveProperty('remaining');
      expect(capabilities.rateLimit).toHaveProperty('adaptiveThrottling');
    });
  });

  describe('Service Diagnostics', () => {
    it('should run comprehensive service diagnostics', async () => {
      const diagnostics = await runServiceDiagnostics();
      
      expect(diagnostics).toHaveProperty('timestamp');
      expect(diagnostics).toHaveProperty('overall');
      expect(diagnostics).toHaveProperty('tests');
      expect(diagnostics).toHaveProperty('summary');
      
      // Check individual tests
      expect(diagnostics.tests).toHaveProperty('configuration');
      expect(diagnostics.tests).toHaveProperty('rateLimit');
      expect(diagnostics.tests).toHaveProperty('healthCheck');
      expect(diagnostics.tests).toHaveProperty('resumeAnalysis');
      expect(diagnostics.tests).toHaveProperty('interviewQuestion');
      
      // Check test structure
      Object.values(diagnostics.tests).forEach(test => {
        expect(test).toHaveProperty('name');
        expect(test).toHaveProperty('status');
        expect(test).toHaveProperty('duration');
        
        if (test.status === 'passed') {
          expect(test).toHaveProperty('details');
        } else if (test.status === 'failed') {
          expect(test).toHaveProperty('error');
        }
      });
      
      // Check summary
      expect(diagnostics.summary).toHaveProperty('total');
      expect(diagnostics.summary).toHaveProperty('passed');
      expect(diagnostics.summary).toHaveProperty('failed');
      expect(diagnostics.summary).toHaveProperty('warnings');
      expect(diagnostics.summary).toHaveProperty('skipped');
      
      // Overall status should be one of the expected values
      expect(['healthy', 'warning', 'degraded', 'unhealthy', 'error']).toContain(diagnostics.overall);
    }, 30000); // Increase timeout for diagnostics
  });

  describe('Performance Metrics', () => {
    it('should provide performance metrics', () => {
      const metrics = getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('rateLimit');
      expect(metrics).toHaveProperty('circuitBreaker');
      expect(metrics).toHaveProperty('timestamp');
      
      // Rate limit metrics
      expect(metrics.rateLimit).toHaveProperty('utilization');
      expect(metrics.rateLimit).toHaveProperty('remaining');
      expect(metrics.rateLimit).toHaveProperty('resetTime');
      expect(metrics.rateLimit).toHaveProperty('blocked');
      expect(metrics.rateLimit).toHaveProperty('consecutiveFailures');
      
      // Circuit breaker metrics
      expect(metrics.circuitBreaker).toHaveProperty('state');
      expect(metrics.circuitBreaker).toHaveProperty('failureRate');
      expect(metrics.circuitBreaker).toHaveProperty('requestCount');
      expect(metrics.circuitBreaker).toHaveProperty('successCount');
      
      // Validate metric types
      expect(typeof metrics.rateLimit.utilization).toBe('number');
      expect(typeof metrics.rateLimit.remaining).toBe('number');
      expect(typeof metrics.rateLimit.blocked).toBe('boolean');
      expect(typeof metrics.rateLimit.consecutiveFailures).toBe('number');
    });
  });

  describe('Detailed Configuration', () => {
    it('should provide detailed configuration information', () => {
      const config = getDetailedConfig();
      
      expect(config).toHaveProperty('api');
      expect(config).toHaveProperty('rateLimit');
      expect(config).toHaveProperty('environment');
      expect(config).toHaveProperty('timestamp');
      
      // API configuration
      expect(config.api).toHaveProperty('baseUrl');
      expect(config.api).toHaveProperty('hasApiKey');
      expect(config.api).toHaveProperty('timeout');
      expect(config.api).toHaveProperty('maxRetries');
      
      // Rate limit configuration
      expect(config.rateLimit).toHaveProperty('maxRequests');
      expect(config.rateLimit).toHaveProperty('windowMs');
      expect(config.rateLimit).toHaveProperty('currentState');
      
      // Environment configuration
      expect(config.environment).toHaveProperty('mockMode');
      expect(config.environment).toHaveProperty('debug');
      expect(config.environment).toHaveProperty('environment');
    });
  });

  describe('Error Handling Enhancement', () => {
    it('should handle validation errors properly', async () => {
      await expect(analyzeResume('', 'short'))
        .rejects.toThrow(/Invalid request parameters/);
      
      await expect(getInterviewQuestion('Invalid Role', 'Behavioral', []))
        .rejects.toThrow(/Invalid role/);
    });

    it('should provide enhanced error information', async () => {
      try {
        await analyzeResume('short', 'also short');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('too short');
        expect(error).toHaveProperty('code', 400);
        expect(error).toHaveProperty('type', 'validation_error');
      }
    });
  });

  describe('Mock Response Enhancement', () => {
    it('should provide realistic mock responses', async () => {
      const resumeText = 'Experienced software engineer with expertise in React, Node.js, and cloud technologies.';
      const jobDescription = 'Looking for a senior developer with React, TypeScript, AWS, and Docker experience.';
      
      const result = await analyzeResume(resumeText, jobDescription);
      
      expect(result.matchScore).toBeGreaterThanOrEqual(0);
      expect(result.matchScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.missingKeywords)).toBe(true);
      expect(Array.isArray(result.formatSuggestions)).toBe(true);
      expect(typeof result.actionVerbAnalysis).toBe('string');
      expect(result.actionVerbAnalysis.length).toBeGreaterThan(0);
    });

    it('should generate contextual interview questions', async () => {
      const history = [
        { q: 'Tell me about yourself', a: 'I am a software engineer...' },
        { q: 'What are your strengths?', a: 'Problem-solving and teamwork...' },
      ];
      
      const result = await getInterviewQuestion('Software Engineer', 'Behavioral', history);
      
      expect(result.questionText).toBeDefined();
      expect(result.questionText.length).toBeGreaterThan(10);
      expect(result.role).toBe('Software Engineer');
      expect(result.category).toBeDefined();
    });
  });
});