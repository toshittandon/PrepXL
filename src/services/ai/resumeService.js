/**
 * AI Resume Analysis Service
 */

import { makeApiRequest, AI_ENDPOINTS } from './config.js';
import { getMockResumeAnalysis, simulateApiDelay, simulateApiError } from './mockResponses.js';
import { executeWithErrorHandling } from './errorHandling.js';
import { getConfig } from '../../utils/envConfig.js';
import { handleAppwriteError, logError } from '../../utils/errorHandling.js';

const config = getConfig();

/**
 * Validate resume analysis request parameters
 * @param {string} resumeText - Resume text content
 * @param {string} jobDescriptionText - Job description text
 * @returns {Object} Validation result
 */
const validateResumeAnalysisRequest = (resumeText, jobDescriptionText) => {
  const errors = [];
  
  if (!resumeText || typeof resumeText !== 'string') {
    errors.push('Resume text is required and must be a string');
  } else if (resumeText.trim().length < 50) {
    errors.push('Resume text is too short (minimum 50 characters)');
  } else if (resumeText.length > 50000) {
    errors.push('Resume text is too long (maximum 50,000 characters)');
  }
  
  if (!jobDescriptionText || typeof jobDescriptionText !== 'string') {
    errors.push('Job description is required and must be a string');
  } else if (jobDescriptionText.trim().length < 20) {
    errors.push('Job description is too short (minimum 20 characters)');
  } else if (jobDescriptionText.length > 10000) {
    errors.push('Job description is too long (maximum 10,000 characters)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Transform and sanitize resume analysis request data
 * @param {string} resumeText - Resume text content
 * @param {string} jobDescriptionText - Job description text
 * @returns {Object} Formatted request data
 */
const formatResumeAnalysisRequest = (resumeText, jobDescriptionText) => {
  return {
    resumeText: resumeText.trim(),
    jobDescriptionText: jobDescriptionText.trim(),
    analysisType: 'comprehensive',
    includeKeywords: true,
    includeActionVerbs: true,
    includeFormatSuggestions: true,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Validate and transform resume analysis response
 * @param {Object} response - Raw API response
 * @returns {Object} Validated and transformed response
 */
const validateResumeAnalysisResponse = (response) => {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid response format from AI service');
  }
  
  // Validate required fields
  const requiredFields = ['matchScore', 'missingKeywords', 'actionVerbAnalysis', 'formatSuggestions'];
  const missingFields = requiredFields.filter(field => !(field in response));
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields in response: ${missingFields.join(', ')}`);
  }
  
  // Validate and sanitize match score
  let matchScore = response.matchScore;
  if (typeof matchScore !== 'number' || isNaN(matchScore)) {
    matchScore = 0;
  }
  matchScore = Math.max(0, Math.min(100, Math.round(matchScore)));
  
  // Validate and sanitize missing keywords
  let missingKeywords = response.missingKeywords;
  if (!Array.isArray(missingKeywords)) {
    missingKeywords = [];
  }
  missingKeywords = missingKeywords
    .filter(keyword => typeof keyword === 'string' && keyword.trim().length > 0)
    .map(keyword => keyword.trim())
    .slice(0, 20); // Limit to 20 keywords
  
  // Validate and sanitize action verb analysis
  let actionVerbAnalysis = response.actionVerbAnalysis;
  if (typeof actionVerbAnalysis !== 'string') {
    actionVerbAnalysis = 'No action verb analysis available.';
  }
  actionVerbAnalysis = actionVerbAnalysis.trim().slice(0, 1000); // Limit length
  
  // Validate and sanitize format suggestions
  let formatSuggestions = response.formatSuggestions;
  if (!Array.isArray(formatSuggestions)) {
    formatSuggestions = [];
  }
  formatSuggestions = formatSuggestions
    .filter(suggestion => typeof suggestion === 'string' && suggestion.trim().length > 0)
    .map(suggestion => suggestion.trim())
    .slice(0, 10); // Limit to 10 suggestions
  
  return {
    matchScore,
    missingKeywords,
    actionVerbAnalysis,
    formatSuggestions,
    analysisId: response.analysisId || `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: response.timestamp || new Date().toISOString(),
    metadata: {
      processingTime: response.processingTime,
      modelVersion: response.modelVersion,
      confidence: response.confidence,
    }
  };
};

/**
 * Analyze resume against job description using AI service with graceful degradation
 * @param {string} resumeText - Resume text content
 * @param {string} jobDescriptionText - Job description text
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Analysis results
 */
export const analyzeResume = async (resumeText, jobDescriptionText, options = {}) => {
  // Validate input parameters first
  const validation = validateResumeAnalysisRequest(resumeText, jobDescriptionText);
  if (!validation.valid) {
    const error = new Error(`Invalid request parameters: ${validation.errors.join(', ')}`);
    error.code = 400;
    error.type = 'validation_error';
    error.details = validation.errors;
    throw error;
  }

  // Define fallback function for graceful degradation
  const fallbackFn = async () => {
    console.log('Using fallback mock response for resume analysis');
    await simulateApiDelay(500, 1000); // Shorter delay for fallback
    const mockResponse = getMockResumeAnalysis(resumeText, jobDescriptionText);
    const result = validateResumeAnalysisResponse(mockResponse);
    result._degradedService = true;
    result._fallbackReason = 'AI service unavailable';
    return result;
  };

  // Main analysis function
  const analysisFunction = async () => {
    // Use mock responses only when explicitly configured
    if (config.mockAiResponses) {
      console.log('Using mock AI response for resume analysis');
      
      // Simulate API error for testing (5% chance)
      const mockError = simulateApiError(0.05, ['network', 'server', 'rate_limit'], { testMode: true });
      if (mockError) {
        throw mockError;
      }
      
      // Simulate API delay
      await simulateApiDelay(1500, 3000);
      
      const mockResponse = getMockResumeAnalysis(resumeText, jobDescriptionText);
      return validateResumeAnalysisResponse(mockResponse);
    }
    
    // Format request data
    const requestData = formatResumeAnalysisRequest(resumeText, jobDescriptionText);
    
    // Add any additional options
    if (options.priority) {
      requestData.priority = options.priority;
    }
    if (options.analysisDepth) {
      requestData.analysisDepth = options.analysisDepth;
    }
    
    // Make API request
    const response = await makeApiRequest(AI_ENDPOINTS.RATE_RESUME, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
    
    // Validate and transform response
    const validatedResponse = validateResumeAnalysisResponse(response);
    
    // Log successful analysis in development
    if (config.debug) {
      console.log('Resume analysis completed successfully:', {
        matchScore: validatedResponse.matchScore,
        keywordCount: validatedResponse.missingKeywords.length,
        suggestionCount: validatedResponse.formatSuggestions.length,
      });
    }
    
    return validatedResponse;
  };

  // Execute with enhanced error handling and graceful degradation
  return executeWithErrorHandling(analysisFunction, {
    useCircuitBreaker: true,
    retryOptions: {
      maxRetries: 2,
      baseDelay: 1000,
      backoffFactor: 2,
    },
    context: {
      service: 'resumeAnalysis',
      resumeLength: resumeText?.length,
      jobDescriptionLength: jobDescriptionText?.length,
      options,
    },
    fallbackFn: options.disableFallback ? null : fallbackFn,
    gracefulDegradation: !options.disableFallback,
  });
};

/**
 * Get resume analysis history for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Analysis history
 */
export const getResumeAnalysisHistory = async (userId, options = {}) => {
  try {
    const {
      limit = 10,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;
    
    // This would typically fetch from Appwrite database
    // For now, return empty array as this is handled by Appwrite service
    return [];
    
  } catch (error) {
    logError(error, {
      service: 'resumeAnalysisHistory',
      userId,
      options,
    });
    
    throw handleAppwriteError(error, 'Failed to fetch resume analysis history');
  }
};

/**
 * Delete a resume analysis record
 * @param {string} analysisId - Analysis ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<boolean>} Success status
 */
export const deleteResumeAnalysis = async (analysisId, userId) => {
  try {
    if (!analysisId || !userId) {
      throw new Error('Analysis ID and User ID are required');
    }
    
    // This would typically delete from Appwrite database
    // For now, return true as this is handled by Appwrite service
    return true;
    
  } catch (error) {
    logError(error, {
      service: 'deleteResumeAnalysis',
      analysisId,
      userId,
    });
    
    throw handleAppwriteError(error, 'Failed to delete resume analysis');
  }
};

/**
 * Get resume analysis statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Analysis statistics
 */
export const getResumeAnalysisStats = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // This would typically aggregate from Appwrite database
    // For now, return mock stats
    return {
      totalAnalyses: 0,
      averageMatchScore: 0,
      bestMatchScore: 0,
      recentAnalyses: 0,
      improvementTrend: 0,
    };
    
  } catch (error) {
    logError(error, {
      service: 'resumeAnalysisStats',
      userId,
    });
    
    throw handleAppwriteError(error, 'Failed to fetch resume analysis statistics');
  }
};

/**
 * Batch analyze multiple resumes (for admin or bulk operations)
 * @param {Array} analyses - Array of {resumeText, jobDescriptionText} objects
 * @param {Object} options - Batch options
 * @returns {Promise<Array>} Array of analysis results
 */
export const batchAnalyzeResumes = async (analyses, options = {}) => {
  try {
    const {
      concurrency = 3,
      failFast = false,
    } = options;
    
    if (!Array.isArray(analyses) || analyses.length === 0) {
      throw new Error('Analyses array is required and must not be empty');
    }
    
    if (analyses.length > 10) {
      throw new Error('Maximum 10 analyses allowed per batch');
    }
    
    // Process analyses in batches with limited concurrency
    const results = [];
    const errors = [];
    
    for (let i = 0; i < analyses.length; i += concurrency) {
      const batch = analyses.slice(i, i + concurrency);
      const batchPromises = batch.map(async (analysis, index) => {
        try {
          const result = await analyzeResume(analysis.resumeText, analysis.jobDescriptionText);
          return { index: i + index, result, error: null };
        } catch (error) {
          const errorResult = { index: i + index, result: null, error };
          if (failFast) {
            throw error;
          }
          return errorResult;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(({ index, result, error }) => {
        if (error) {
          errors.push({ index, error });
        } else {
          results.push({ index, result });
        }
      });
    }
    
    return {
      results: results.sort((a, b) => a.index - b.index).map(r => r.result),
      errors: errors.sort((a, b) => a.index - b.index),
      summary: {
        total: analyses.length,
        successful: results.length,
        failed: errors.length,
      }
    };
    
  } catch (error) {
    logError(error, {
      service: 'batchAnalyzeResumes',
      batchSize: analyses?.length,
      options,
    });
    
    throw handleAppwriteError(error, 'Failed to process batch resume analysis');
  }
};