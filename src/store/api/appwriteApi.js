import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Base query configuration for Appwrite API
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

// Appwrite API slice for database operations
export const appwriteApi = createApi({
  reducerPath: 'appwriteApi',
  baseQuery,
  tagTypes: [
    'User',
    'Resume', 
    'InterviewSession',
    'Interaction',
    'Question',
    'Analytics'
  ],
  endpoints: (builder) => ({
    // User endpoints
    getUser: builder.query({
      query: (userId) => `/api/users/${userId}`,
      providesTags: (result, error, userId) => [{ type: 'User', id: userId }]
    }),
    
    updateUser: builder.mutation({
      query: ({ userId, ...userData }) => ({
        url: `/api/users/${userId}`,
        method: 'PUT',
        body: userData
      }),
      invalidatesTags: (result, error, { userId }) => [{ type: 'User', id: userId }]
    }),
    
    // Resume endpoints
    getResumes: builder.query({
      query: (userId) => `/api/resumes?userId=${userId}`,
      providesTags: ['Resume']
    }),
    
    createResume: builder.mutation({
      query: (resumeData) => ({
        url: '/api/resumes',
        method: 'POST',
        body: resumeData
      }),
      invalidatesTags: ['Resume']
    }),
    
    // Interview session endpoints
    getInterviewSessions: builder.query({
      query: (userId) => `/api/interview-sessions?userId=${userId}`,
      providesTags: ['InterviewSession']
    }),
    
    createInterviewSession: builder.mutation({
      query: (sessionData) => ({
        url: '/api/interview-sessions',
        method: 'POST',
        body: sessionData
      }),
      invalidatesTags: ['InterviewSession']
    }),
    
    updateInterviewSession: builder.mutation({
      query: ({ sessionId, ...sessionData }) => ({
        url: `/api/interview-sessions/${sessionId}`,
        method: 'PUT',
        body: sessionData
      }),
      invalidatesTags: ['InterviewSession']
    }),
    
    // Interaction endpoints
    getInteractions: builder.query({
      query: (sessionId) => `/api/interactions?sessionId=${sessionId}`,
      providesTags: ['Interaction']
    }),
    
    createInteraction: builder.mutation({
      query: (interactionData) => ({
        url: '/api/interactions',
        method: 'POST',
        body: interactionData
      }),
      invalidatesTags: ['Interaction']
    }),
    
    // Question endpoints
    getQuestions: builder.query({
      query: (filters = {}) => {
        const params = new URLSearchParams(filters).toString()
        return `/api/questions${params ? `?${params}` : ''}`
      },
      providesTags: ['Question']
    }),
    
    createQuestion: builder.mutation({
      query: (questionData) => ({
        url: '/api/questions',
        method: 'POST',
        body: questionData
      }),
      invalidatesTags: ['Question']
    }),
    
    updateQuestion: builder.mutation({
      query: ({ questionId, ...questionData }) => ({
        url: `/api/questions/${questionId}`,
        method: 'PUT',
        body: questionData
      }),
      invalidatesTags: ['Question']
    }),
    
    deleteQuestion: builder.mutation({
      query: (questionId) => ({
        url: `/api/questions/${questionId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Question']
    }),
    
    // Admin endpoints
    getAllUsers: builder.query({
      query: () => '/api/admin/users',
      providesTags: ['User']
    }),
    
    getAnalytics: builder.query({
      query: () => '/api/admin/analytics',
      providesTags: ['Analytics']
    })
  })
})

// Export hooks for usage in components
export const {
  useGetUserQuery,
  useUpdateUserMutation,
  useGetResumesQuery,
  useCreateResumeMutation,
  useGetInterviewSessionsQuery,
  useCreateInterviewSessionMutation,
  useUpdateInterviewSessionMutation,
  useGetInteractionsQuery,
  useCreateInteractionMutation,
  useGetQuestionsQuery,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useGetAllUsersQuery,
  useGetAnalyticsQuery
} = appwriteApi