import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Base query configuration for AI API
const baseQuery = fetchBaseQuery({
  baseUrl: '/',
  prepareHeaders: (headers, { getState }) => {
    // Add authentication headers if user is logged in
    const token = getState().auth.session?.token
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    headers.set('content-type', 'application/json')
    return headers
  },
})

// AI API slice for AI service endpoints
export const aiApi = createApi({
  reducerPath: 'aiApi',
  baseQuery,
  tagTypes: ['AIResponse'],
  endpoints: (builder) => ({
    // Resume analysis endpoint
    analyzeResume: builder.mutation({
      query: ({ resumeText, jobDescriptionText }) => ({
        url: '/api/rate-resume',
        method: 'POST',
        body: {
          resumeText,
          jobDescriptionText
        }
      }),
      transformResponse: (response) => ({
        matchScore: response.matchScore || 0,
        missingKeywords: response.missingKeywords || [],
        actionVerbAnalysis: response.actionVerbAnalysis || '',
        formatSuggestions: response.formatSuggestions || []
      })
    }),
    
    // Interview question generation endpoint
    getInterviewQuestion: builder.mutation({
      query: ({ role, sessionType, history = [] }) => ({
        url: '/api/get-interview-question',
        method: 'POST',
        body: {
          role,
          sessionType,
          history
        }
      }),
      transformResponse: (response) => ({
        questionText: response.questionText || ''
      })
    }),
    
    // Batch question generation for library seeding
    generateQuestions: builder.mutation({
      query: ({ category, role, count = 10 }) => ({
        url: '/api/generate-questions',
        method: 'POST',
        body: {
          category,
          role,
          count
        }
      }),
      transformResponse: (response) => response.questions || []
    }),
    
    // Interview feedback generation
    generateFeedback: builder.mutation({
      query: ({ interactions, sessionType, role }) => ({
        url: '/api/generate-feedback',
        method: 'POST',
        body: {
          interactions,
          sessionType,
          role
        }
      }),
      transformResponse: (response) => ({
        overallScore: response.overallScore || 0,
        feedback: response.feedback || '',
        strengths: response.strengths || [],
        improvements: response.improvements || []
      })
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