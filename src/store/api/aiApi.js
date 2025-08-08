import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import { analyzeResume } from '../../services/ai/resumeService.js'
import { getInterviewQuestion, generateInterviewQuestions } from '../../services/ai/interviewService.js'
import { handleAiServiceError } from '../../services/ai/index.js'

// AI API slice using our AI service functions instead of HTTP calls
export const aiApi = createApi({
  reducerPath: 'aiApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['AIResponse', 'InterviewQuestion', 'ResumeAnalysis'],
  endpoints: (builder) => ({
    // Resume analysis endpoint using AI service
    analyzeResume: builder.mutation({
      queryFn: async ({ resumeText, jobDescriptionText }) => {
        try {
          const result = await analyzeResume(resumeText, jobDescriptionText)
          return { data: result }
        } catch (error) {
          const friendlyError = handleAiServiceError(error, {
            service: 'resume_analysis',
            resumeLength: resumeText?.length,
            jobDescriptionLength: jobDescriptionText?.length
          })
          return { error: friendlyError }
        }
      },
      invalidatesTags: ['ResumeAnalysis']
    }),
    
    // Interview question generation using AI service
    getInterviewQuestion: builder.mutation({
      queryFn: async ({ role, sessionType, history = [], options = {} }) => {
        try {
          const result = await getInterviewQuestion(role, sessionType, history, options)
          return { data: result }
        } catch (error) {
          const friendlyError = handleAiServiceError(error, {
            service: 'interview_question',
            role,
            sessionType,
            historyLength: history?.length
          })
          return { error: friendlyError }
        }
      },
      invalidatesTags: ['InterviewQuestion']
    }),
    
    // Batch question generation for practice or library seeding
    generateQuestions: builder.mutation({
      queryFn: async ({ role, sessionType, count = 5, options = {} }) => {
        try {
          const result = await generateInterviewQuestions(role, sessionType, count, options)
          return { data: result }
        } catch (error) {
          const friendlyError = handleAiServiceError(error, {
            service: 'generate_questions',
            role,
            sessionType,
            count
          })
          return { error: friendlyError }
        }
      },
      invalidatesTags: ['InterviewQuestion']
    }),
    
    // Interview feedback generation (placeholder for future implementation)
    generateFeedback: builder.mutation({
      queryFn: async ({ interactions, sessionType, role }) => {
        try {
          // This is a placeholder implementation
          // In the future, this could use an AI service for feedback generation
          const mockFeedback = {
            overallScore: Math.floor(Math.random() * 40) + 60, // 60-100 range
            feedback: 'Feedback generation is not yet implemented. This is a placeholder response.',
            strengths: [
              'Good communication skills demonstrated',
              'Technical knowledge appears solid',
              'Structured approach to problem-solving'
            ],
            improvements: [
              'Consider providing more specific examples',
              'Practice explaining complex concepts more clearly',
              'Work on conciseness in responses'
            ],
            timestamp: new Date().toISOString()
          }
          
          return { data: mockFeedback }
        } catch (error) {
          const friendlyError = handleAiServiceError(error, {
            service: 'generate_feedback',
            sessionType,
            role,
            interactionCount: interactions?.length
          })
          return { error: friendlyError }
        }
      }
    })
  })
})

// Export hooks for usage in components
export const {
  useAnalyzeResumeMutation,
  useGetInterviewQuestionMutation,
  useGenerateQuestionsMutation,
  useGenerateFeedbackMutation
} = aiApi