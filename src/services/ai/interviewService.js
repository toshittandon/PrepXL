/**
 * AI Interview Question Service
 */

import { makeApiRequest, AI_ENDPOINTS } from './config.js';
import { getMockInterviewQuestion, simulateApiDelay, simulateApiError } from './mockResponses.js';
import { executeWithErrorHandling } from './errorHandling.js';
import { getConfig } from '../../utils/envConfig.js';
import { handleAppwriteError, logError } from '../../utils/errorHandling.js';

const config = getConfig();

// Valid session types and roles
const VALID_SESSION_TYPES = ['Behavioral', 'Technical', 'Case Study'];
const VALID_ROLES = [
  'Software Engineer',
  'Product Manager',
  'Data Scientist',
  'Designer',
  'Marketing Manager',
  'Sales Representative',
  'Business Analyst',
  'DevOps Engineer',
  'QA Engineer',
  'Project Manager'
];

/**
 * Validate interview question request parameters
 * @param {string} role - Job role
 * @param {string} sessionType - Interview session type
 * @param {Array} history - Previous questions and answers
 * @returns {Object} Validation result
 */
const validateInterviewQuestionRequest = (role, sessionType, history = []) => {
  const errors = [];
  
  if (!role || typeof role !== 'string') {
    errors.push('Role is required and must be a string');
  } else if (!VALID_ROLES.includes(role)) {
    errors.push(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
  }
  
  if (!sessionType || typeof sessionType !== 'string') {
    errors.push('Session type is required and must be a string');
  } else if (!VALID_SESSION_TYPES.includes(sessionType)) {
    errors.push(`Invalid session type. Must be one of: ${VALID_SESSION_TYPES.join(', ')}`);
  }
  
  if (!Array.isArray(history)) {
    errors.push('History must be an array');
  } else if (history.length > 50) {
    errors.push('History is too long (maximum 50 interactions)');
  } else {
    // Validate history items
    history.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        errors.push(`History item ${index} must be an object`);
      } else {
        if (!item.q && !item.question) {
          errors.push(`History item ${index} must have a question (q or question field)`);
        }
        if (!item.a && !item.answer) {
          errors.push(`History item ${index} must have an answer (a or answer field)`);
        }
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Transform and sanitize interview question request data
 * @param {string} role - Job role
 * @param {string} sessionType - Interview session type
 * @param {Array} history - Previous questions and answers
 * @returns {Object} Formatted request data
 */
const formatInterviewQuestionRequest = (role, sessionType, history = []) => {
  // Normalize history format
  const normalizedHistory = history.map(item => ({
    question: item.q || item.question,
    answer: item.a || item.answer,
    timestamp: item.timestamp || new Date().toISOString(),
  }));
  
  return {
    role: role.trim(),
    sessionType: sessionType.trim(),
    history: normalizedHistory,
    context: {
      totalQuestions: normalizedHistory.length,
      sessionStartTime: normalizedHistory[0]?.timestamp || new Date().toISOString(),
      difficulty: calculateDifficulty(normalizedHistory.length),
    },
    preferences: {
      avoidRepetition: true,
      progressiveDifficulty: true,
      contextAware: true,
    },
    timestamp: new Date().toISOString(),
  };
};

/**
 * Calculate question difficulty based on session progress
 * @param {number} questionCount - Number of questions asked
 * @returns {string} Difficulty level
 */
const calculateDifficulty = (questionCount) => {
  if (questionCount < 3) return 'easy';
  if (questionCount < 7) return 'medium';
  return 'hard';
};

/**
 * Validate and transform interview question response
 * @param {Object} response - Raw API response
 * @returns {Object} Validated and transformed response
 */
const validateInterviewQuestionResponse = (response) => {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid response format from AI service');
  }
  
  // Validate required fields
  if (!response.questionText || typeof response.questionText !== 'string') {
    throw new Error('Missing or invalid questionText in response');
  }
  
  const questionText = response.questionText.trim();
  if (questionText.length < 10) {
    throw new Error('Question text is too short');
  }
  
  if (questionText.length > 1000) {
    throw new Error('Question text is too long');
  }
  
  return {
    questionText,
    questionId: response.questionId || `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    category: response.category || 'General',
    role: response.role || 'General',
    difficulty: response.difficulty || 'medium',
    tags: Array.isArray(response.tags) ? response.tags.slice(0, 5) : [],
    estimatedTime: response.estimatedTime || 300, // 5 minutes default
    followUpSuggestions: Array.isArray(response.followUpSuggestions) 
      ? response.followUpSuggestions.slice(0, 3) 
      : [],
    timestamp: response.timestamp || new Date().toISOString(),
    metadata: {
      modelVersion: response.modelVersion,
      confidence: response.confidence,
      processingTime: response.processingTime,
    }
  };
};

/**
 * Get next interview question based on context and history with graceful degradation
 * @param {string} role - Job role
 * @param {string} sessionType - Interview session type
 * @param {Array} history - Previous questions and answers
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Next interview question
 */
export const getInterviewQuestion = async (role, sessionType, history = [], options = {}) => {
  // Validate input parameters first
  const validation = validateInterviewQuestionRequest(role, sessionType, history);
  if (!validation.valid) {
    const error = new Error(`Invalid request parameters: ${validation.errors.join(', ')}`);
    error.code = 400;
    error.type = 'validation_error';
    error.details = validation.errors;
    throw error;
  }

  // Define fallback function for graceful degradation
  const fallbackFn = async () => {
    console.log('Using fallback mock response for interview question');
    await simulateApiDelay(300, 800); // Shorter delay for fallback
    const mockResponse = getMockInterviewQuestion(role, sessionType, history);
    const result = validateInterviewQuestionResponse(mockResponse);
    result._degradedService = true;
    result._fallbackReason = 'AI service unavailable';
    return result;
  };

  // Main question generation function
  const questionFunction = async () => {
    // Use mock responses only when explicitly configured
    if (config.mockAiResponses) {
      console.log('Using mock AI response for interview question');
      
      // Simulate API error for testing (3% chance)
      const mockError = simulateApiError(0.03, ['network', 'server', 'rate_limit'], { testMode: true });
      if (mockError) {
        throw mockError;
      }
      
      // Simulate API delay
      await simulateApiDelay(800, 2000);
      
      const mockResponse = getMockInterviewQuestion(role, sessionType, history);
      return validateInterviewQuestionResponse(mockResponse);
    }
    
    // Format request data
    const requestData = formatInterviewQuestionRequest(role, sessionType, history);
    
    // Add any additional options
    if (options.difficulty) {
      requestData.context.difficulty = options.difficulty;
    }
    if (options.focusAreas) {
      requestData.focusAreas = options.focusAreas;
    }
    if (options.timeLimit) {
      requestData.timeLimit = options.timeLimit;
    }
    
    // Make API request
    const response = await makeApiRequest(AI_ENDPOINTS.GET_INTERVIEW_QUESTION, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
    
    // Validate and transform response
    const validatedResponse = validateInterviewQuestionResponse(response);
    
    // Log successful question generation in development
    if (config.debug) {
      console.log('Interview question generated successfully:', {
        role,
        sessionType,
        questionLength: validatedResponse.questionText.length,
        difficulty: validatedResponse.difficulty,
        historyLength: history.length,
      });
    }
    
    return validatedResponse;
  };

  // Execute with enhanced error handling and graceful degradation
  return executeWithErrorHandling(questionFunction, {
    useCircuitBreaker: true,
    retryOptions: {
      maxRetries: 2,
      baseDelay: 800,
      backoffFactor: 2,
    },
    context: {
      service: 'interviewQuestion',
      role,
      sessionType,
      historyLength: history?.length,
      options,
    },
    fallbackFn: options.disableFallback ? null : fallbackFn,
    gracefulDegradation: !options.disableFallback,
  });
};

/**
 * Generate multiple interview questions for preparation
 * @param {string} role - Job role
 * @param {string} sessionType - Interview session type
 * @param {number} count - Number of questions to generate
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of interview questions
 */
export const generateInterviewQuestions = async (role, sessionType, count = 5, options = {}) => {
  try {
    if (!Number.isInteger(count) || count < 1 || count > 20) {
      throw new Error('Count must be an integer between 1 and 20');
    }
    
    const questions = [];
    const history = [];
    
    // Generate questions sequentially to maintain context
    for (let i = 0; i < count; i++) {
      try {
        const question = await getInterviewQuestion(role, sessionType, history, {
          ...options,
          difficulty: options.difficulty || calculateDifficulty(i),
        });
        
        questions.push(question);
        
        // Add to history for context (with placeholder answer)
        history.push({
          q: question.questionText,
          a: '[Placeholder answer for context]',
          timestamp: question.timestamp,
        });
        
        // Add small delay between requests to avoid rate limiting
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
      } catch (error) {
        // If individual question fails, log but continue
        console.warn(`Failed to generate question ${i + 1}:`, error.message);
        
        // If we have at least one question, continue
        if (questions.length === 0) {
          throw error;
        }
      }
    }
    
    if (questions.length === 0) {
      throw new Error('Failed to generate any questions');
    }
    
    return {
      questions,
      metadata: {
        requested: count,
        generated: questions.length,
        role,
        sessionType,
        timestamp: new Date().toISOString(),
      }
    };
    
  } catch (error) {
    logError(error, {
      service: 'generateInterviewQuestions',
      role,
      sessionType,
      count,
      options,
    });
    
    throw handleAppwriteError(error, 'Failed to generate interview questions');
  }
};

/**
 * Evaluate interview answer quality (future feature)
 * @param {string} question - Interview question
 * @param {string} answer - User's answer
 * @param {Object} context - Additional context
 * @returns {Promise<Object>} Answer evaluation
 */
export const evaluateAnswer = async (question, answer, context = {}) => {
  try {
    // Validate inputs
    if (!question || typeof question !== 'string') {
      throw new Error('Question is required and must be a string');
    }
    
    if (!answer || typeof answer !== 'string') {
      throw new Error('Answer is required and must be a string');
    }
    
    if (answer.trim().length < 10) {
      throw new Error('Answer is too short (minimum 10 characters)');
    }
    
    // This feature is not implemented yet
    // Return a placeholder response
    return {
      score: Math.floor(Math.random() * 40) + 60, // 60-100 range
      feedback: 'Answer evaluation is not yet implemented.',
      strengths: [],
      improvements: [],
      timestamp: new Date().toISOString(),
    };
    
  } catch (error) {
    logError(error, {
      service: 'evaluateAnswer',
      questionLength: question?.length,
      answerLength: answer?.length,
      context,
    });
    
    throw handleAppwriteError(error, 'Failed to evaluate answer');
  }
};

/**
 * Get interview question suggestions based on user profile
 * @param {Object} userProfile - User profile information
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Suggested questions
 */
export const getQuestionSuggestions = async (userProfile, options = {}) => {
  try {
    const {
      limit = 10,
      sessionTypes = VALID_SESSION_TYPES,
      difficulty = 'medium',
    } = options;
    
    if (!userProfile || typeof userProfile !== 'object') {
      throw new Error('User profile is required');
    }
    
    const role = userProfile.targetRole || 'Software Engineer';
    const suggestions = [];
    
    // Generate suggestions for each session type
    for (const sessionType of sessionTypes) {
      try {
        const questions = await generateInterviewQuestions(
          role,
          sessionType,
          Math.ceil(limit / sessionTypes.length),
          { difficulty }
        );
        
        suggestions.push({
          sessionType,
          questions: questions.questions,
        });
        
      } catch (error) {
        console.warn(`Failed to generate suggestions for ${sessionType}:`, error.message);
      }
    }
    
    return {
      suggestions,
      userProfile: {
        role,
        experienceLevel: userProfile.experienceLevel,
        targetIndustry: userProfile.targetIndustry,
      },
      timestamp: new Date().toISOString(),
    };
    
  } catch (error) {
    logError(error, {
      service: 'getQuestionSuggestions',
      userProfile,
      options,
    });
    
    throw handleAppwriteError(error, 'Failed to get question suggestions');
  }
};

/**
 * Get interview session statistics
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Session statistics
 */
export const getSessionStats = async (sessionId) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    
    // This would typically fetch from Appwrite database
    // For now, return mock stats
    return {
      sessionId,
      totalQuestions: 0,
      averageResponseTime: 0,
      completionRate: 0,
      difficultyDistribution: {
        easy: 0,
        medium: 0,
        hard: 0,
      },
      categoryDistribution: {},
      timestamp: new Date().toISOString(),
    };
    
  } catch (error) {
    logError(error, {
      service: 'getSessionStats',
      sessionId,
    });
    
    throw handleAppwriteError(error, 'Failed to get session statistics');
  }
};

/**
 * Export valid session types and roles for use in components
 */
export { VALID_SESSION_TYPES, VALID_ROLES };