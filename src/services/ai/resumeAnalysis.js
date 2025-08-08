/**
 * Resume Analysis Service - Alias for resumeSlice compatibility
 */

import { analyzeResume as analyzeResumeService } from './resumeService.js'

/**
 * Analyze resume against job description - alias for resumeSlice
 * @param {Object} params - Analysis parameters
 * @param {string} params.resumeText - Resume text content
 * @param {string} params.jobDescriptionText - Job description text
 * @returns {Promise<Object>} Analysis results
 */
export const analyzeResume = async ({ resumeText, jobDescriptionText }) => {
  return await analyzeResumeService(resumeText, jobDescriptionText)
}

// Re-export other functions for completeness
export {
  getResumeAnalysisHistory,
  deleteResumeAnalysis,
  getResumeAnalysisStats,
  batchAnalyzeResumes
} from './resumeService.js'