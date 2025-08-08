/**
 * AI Services - Main Export File
 */

import {
  AI_API_CONFIG,
  AI_ENDPOINTS,
  makeApiRequest,
  checkApiHealth,
  getRateLimitStatus,
  validateApiConfig,
  resetRateLimitState,
  getDetailedConfig,
} from './config.js';

// Re-export configuration and utilities
export {
  AI_API_CONFIG,
  AI_ENDPOINTS,
  makeApiRequest,
  checkApiHealth,
  getRateLimitStatus,
  validateApiConfig,
  resetRateLimitState,
  getDetailedConfig,
};

// Resume analysis services
export {
  analyzeResume,
  getResumeAnalysisHistory,
  deleteResumeAnalysis,
  getResumeAnalysisStats,
  batchAnalyzeResumes,
} from './resumeService.js';

// Interview question services
export {
  getInterviewQuestion,
  generateInterviewQuestions,
  evaluateAnswer,
  getQuestionSuggestions,
  getSessionStats,
  VALID_SESSION_TYPES,
  VALID_ROLES,
} from './interviewService.js';

// Mock responses (for development and testing)
export {
  getMockResumeAnalysis,
  getMockInterviewQuestion,
  simulateApiDelay,
  simulateApiError,
  getMockHealthCheck,
} from './mockResponses.js';

// Service status and health check utilities
export const getServiceStatus = async () => {
  try {
    const rateLimitStatus = getRateLimitStatus();
    const configValidation = validateApiConfig();
    
    // Only check health if not in mock mode
    let healthCheck;
    if (configValidation.config.mockMode) {
      healthCheck = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        mockMode: true,
      };
    } else {
      try {
        healthCheck = await checkApiHealth();
      } catch (error) {
        healthCheck = {
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString(),
        };
      }
    }
    
    return {
      status: healthCheck.status === 'healthy' ? 'operational' : 'degraded',
      health: healthCheck,
      rateLimit: rateLimitStatus,
      config: configValidation,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

// Service initialization and validation
export const initializeAiServices = async () => {
  try {
    console.log('🤖 Initializing AI services...');
    
    // Validate configuration
    const configValidation = validateApiConfig();
    if (!configValidation.valid) {
      console.warn('⚠️ AI service configuration issues:', configValidation.issues);
      
      // In development, continue with mock responses
      if (configValidation.config.mockMode) {
        console.log('📝 Using mock AI responses for development');
      } else {
        throw new Error(`AI service configuration invalid: ${configValidation.issues.join(', ')}`);
      }
    }
    
    // Check service health (only if not in mock mode)
    if (!configValidation.config.mockMode) {
      try {
        const healthCheck = await checkApiHealth();
        if (healthCheck.status !== 'healthy') {
          console.warn('⚠️ AI service health check failed:', healthCheck.error);
        } else {
          console.log('✅ AI services initialized successfully');
        }
      } catch (healthError) {
        console.warn('⚠️ AI service health check failed:', healthError.message);
        // Continue initialization even if health check fails
      }
    } else {
      console.log('✅ AI services initialized in mock mode');
    }
    
    return {
      initialized: true,
      mockMode: configValidation.config.mockMode,
      config: configValidation.config,
      timestamp: new Date().toISOString(),
    };
    
  } catch (error) {
    console.error('❌ Failed to initialize AI services:', error);
    
    return {
      initialized: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

// Error handling utilities specific to AI services
export const handleAiServiceError = (error, context = {}) => {
  const errorInfo = {
    message: error.message,
    code: error.code,
    type: error.type,
    service: error.service || 'ai_service',
    timestamp: new Date().toISOString(),
    context,
  };
  
  // Log error for monitoring
  console.error('AI Service Error:', errorInfo);
  
  // Return user-friendly error message
  let userMessage = 'An error occurred with the AI service.';
  
  switch (error.type) {
    case 'rate_limit_exceeded':
      userMessage = 'Too many requests. Please wait a moment and try again.';
      break;
    case 'timeout':
      userMessage = 'The AI service is taking too long to respond. Please try again.';
      break;
    case 'network_error':
      userMessage = 'Unable to connect to the AI service. Please check your internet connection.';
      break;
    case 'validation_error':
      userMessage = 'Invalid input provided. Please check your data and try again.';
      break;
    case 'server_error':
      userMessage = 'The AI service is temporarily unavailable. Please try again later.';
      break;
  }
  
  return {
    ...errorInfo,
    userMessage,
  };
};

// Service metrics and monitoring
export const getServiceMetrics = () => {
  const rateLimitStatus = getRateLimitStatus();
  
  return {
    rateLimit: {
      limit: rateLimitStatus.limit,
      remaining: rateLimitStatus.remaining,
      resetTime: rateLimitStatus.resetTime,
      utilizationPercent: Math.round(
        ((rateLimitStatus.limit - rateLimitStatus.remaining) / rateLimitStatus.limit) * 100
      ),
    },
    timestamp: new Date().toISOString(),
  };
};

// Utility function to check if AI services are available
export const isAiServiceAvailable = async () => {
  try {
    const status = await getServiceStatus();
    return status.status === 'operational';
  } catch (error) {
    return false;
  }
};

// Utility function to get service capabilities
export const getServiceCapabilities = () => {
  const config = validateApiConfig();
  const rateLimitStatus = getRateLimitStatus();
  
  return {
    resumeAnalysis: {
      available: true,
      mockMode: config.config.mockMode,
      features: [
        'ATS score calculation',
        'Missing keywords detection',
        'Action verb analysis',
        'Format suggestions',
        'Job description matching',
        'Graceful degradation',
        'Fallback responses',
      ],
      limits: {
        resumeMaxLength: 50000,
        jobDescriptionMaxLength: 10000,
        minResumeLength: 50,
        minJobDescriptionLength: 20,
      },
    },
    interviewQuestions: {
      available: true,
      mockMode: config.config.mockMode,
      sessionTypes: ['Behavioral', 'Technical', 'Case Study'],
      roles: [
        'Software Engineer',
        'Product Manager',
        'Data Scientist',
        'Designer',
        'Marketing Manager',
        'Sales Representative',
        'Business Analyst',
        'DevOps Engineer',
        'QA Engineer',
        'Project Manager',
      ],
      features: [
        'Context-aware questions',
        'Progressive difficulty',
        'Role-specific content',
        'Session history tracking',
        'Graceful degradation',
        'Fallback responses',
      ],
      limits: {
        maxHistoryLength: 50,
        maxBatchSize: 20,
        questionMinLength: 10,
        questionMaxLength: 1000,
      },
    },
    errorHandling: {
      circuitBreaker: true,
      retryLogic: true,
      adaptiveThrottling: true,
      gracefulDegradation: true,
      fallbackResponses: true,
    },
    rateLimit: {
      enabled: !config.config.mockMode,
      limit: rateLimitStatus.limit,
      remaining: rateLimitStatus.remaining,
      window: '1 minute',
      adaptiveThrottling: rateLimitStatus.adaptiveThrottling.enabled,
      blocked: rateLimitStatus.blocked,
    },
    general: {
      timeout: `${config.config.timeout / 1000} seconds`,
      retries: config.config.maxRetries,
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
    },
  };
};

// Enhanced service diagnostics
export const runServiceDiagnostics = async () => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    overall: 'unknown',
    tests: {},
  };

  try {
    // Test 1: Configuration validation
    diagnostics.tests.configuration = {
      name: 'Configuration Validation',
      status: 'running',
    };
    
    const configValidation = validateApiConfig();
    diagnostics.tests.configuration = {
      name: 'Configuration Validation',
      status: configValidation.valid ? 'passed' : 'failed',
      details: configValidation,
      duration: 0,
    };

    // Test 2: Rate limiting status
    diagnostics.tests.rateLimit = {
      name: 'Rate Limiting Status',
      status: 'running',
    };
    
    const rateLimitStatus = getRateLimitStatus();
    diagnostics.tests.rateLimit = {
      name: 'Rate Limiting Status',
      status: rateLimitStatus.blocked ? 'warning' : 'passed',
      details: rateLimitStatus,
      duration: 0,
    };

    // Test 3: Health check (only if not in mock mode)
    if (!configValidation.config.mockMode) {
      diagnostics.tests.healthCheck = {
        name: 'API Health Check',
        status: 'running',
      };
      
      const startTime = Date.now();
      try {
        const health = await checkApiHealth();
        diagnostics.tests.healthCheck = {
          name: 'API Health Check',
          status: health.status === 'healthy' ? 'passed' : 'failed',
          details: health,
          duration: Date.now() - startTime,
        };
      } catch (error) {
        diagnostics.tests.healthCheck = {
          name: 'API Health Check',
          status: 'failed',
          error: error.message,
          duration: Date.now() - startTime,
        };
      }
    } else {
      diagnostics.tests.healthCheck = {
        name: 'API Health Check',
        status: 'skipped',
        reason: 'Mock mode enabled',
        duration: 0,
      };
    }

    // Test 4: Resume analysis test
    diagnostics.tests.resumeAnalysis = {
      name: 'Resume Analysis Test',
      status: 'running',
    };
    
    const resumeStartTime = Date.now();
    try {
      const testResume = 'Test resume content with sufficient length for validation purposes and proper formatting.';
      const testJob = 'Test job description with requirements and qualifications.';
      
      const resumeResult = await analyzeResume(testResume, testJob, { disableFallback: false });
      diagnostics.tests.resumeAnalysis = {
        name: 'Resume Analysis Test',
        status: 'passed',
        details: {
          matchScore: resumeResult.matchScore,
          keywordCount: resumeResult.missingKeywords?.length || 0,
          fallback: resumeResult._degradedService || false,
        },
        duration: Date.now() - resumeStartTime,
      };
    } catch (error) {
      diagnostics.tests.resumeAnalysis = {
        name: 'Resume Analysis Test',
        status: 'failed',
        error: error.message,
        duration: Date.now() - resumeStartTime,
      };
    }

    // Test 5: Interview question test
    diagnostics.tests.interviewQuestion = {
      name: 'Interview Question Test',
      status: 'running',
    };
    
    const questionStartTime = Date.now();
    try {
      const questionResult = await getInterviewQuestion('Software Engineer', 'Behavioral', [], { disableFallback: false });
      diagnostics.tests.interviewQuestion = {
        name: 'Interview Question Test',
        status: 'passed',
        details: {
          questionLength: questionResult.questionText?.length || 0,
          role: questionResult.role,
          fallback: questionResult._degradedService || false,
        },
        duration: Date.now() - questionStartTime,
      };
    } catch (error) {
      diagnostics.tests.interviewQuestion = {
        name: 'Interview Question Test',
        status: 'failed',
        error: error.message,
        duration: Date.now() - questionStartTime,
      };
    }

    // Determine overall status
    const testResults = Object.values(diagnostics.tests);
    const failedTests = testResults.filter(test => test.status === 'failed');
    const warningTests = testResults.filter(test => test.status === 'warning');
    
    if (failedTests.length === 0 && warningTests.length === 0) {
      diagnostics.overall = 'healthy';
    } else if (failedTests.length === 0) {
      diagnostics.overall = 'warning';
    } else if (failedTests.length < testResults.length) {
      diagnostics.overall = 'degraded';
    } else {
      diagnostics.overall = 'unhealthy';
    }

    diagnostics.summary = {
      total: testResults.length,
      passed: testResults.filter(test => test.status === 'passed').length,
      failed: failedTests.length,
      warnings: warningTests.length,
      skipped: testResults.filter(test => test.status === 'skipped').length,
    };

  } catch (error) {
    diagnostics.overall = 'error';
    diagnostics.error = error.message;
  }

  return diagnostics;
};

// Service performance monitoring
export const getPerformanceMetrics = () => {
  const rateLimitStatus = getRateLimitStatus();
  
  return {
    rateLimit: {
      utilization: rateLimitStatus.limit > 0 
        ? Math.round(((rateLimitStatus.limit - rateLimitStatus.remaining) / rateLimitStatus.limit) * 100)
        : 0,
      remaining: rateLimitStatus.remaining,
      resetTime: rateLimitStatus.resetTime,
      blocked: rateLimitStatus.blocked,
      consecutiveFailures: rateLimitStatus.adaptiveThrottling.failureCount,
    },
    circuitBreaker: {
      state: 'CLOSED', // This would come from the circuit breaker
      failureRate: 0,
      requestCount: 0,
      successCount: 0,
    },
    timestamp: new Date().toISOString(),
  };
};

// Service reset and recovery utilities
export const resetServiceState = () => {
  try {
    console.log('Resetting AI service state...');
    
    // Reset rate limiting state
    const resetResult = resetRateLimitState();
    
    if (!resetResult.success) {
      throw new Error(`Failed to reset rate limiting: ${resetResult.error}`);
    }
    
    console.log('✅ AI service state reset successfully');
    
    return {
      success: true,
      message: 'Service state reset successfully',
      details: {
        rateLimitReset: resetResult.success,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Failed to reset AI service state:', error);
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};