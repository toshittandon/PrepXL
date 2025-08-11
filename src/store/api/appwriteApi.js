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
      queryFn: async (userId) => {
        try {
          // Validate session before making API call
          const { validateAndGetUserId } = await import('../../utils/sessionValidator.js')
          const validatedUserId = await validateAndGetUserId()
          
          const { getUserResumes } = await import('../../services/appwrite/database.js')
          const result = await getUserResumes(validatedUserId || userId)
          return { data: result.documents || [] }
        } catch (error) {
          // Handle authentication errors specifically
          if (error.code === 401 || error.message?.includes('Authentication required')) {
            return { error: { status: 401, error: 'Authentication required' } }
          }
          return { error: { status: 'FETCH_ERROR', error: error.message } }
        }
      },
      providesTags: ['Resume']
    }),
    
    getResumeById: builder.query({
      queryFn: async (resumeId) => {
        try {
          const { getResumeById } = await import('../../services/appwrite/database.js')
          const result = await getResumeById(resumeId)
          return { data: result }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error.message } }
        }
      },
      providesTags: (result, error, resumeId) => [{ type: 'Resume', id: resumeId }]
    }),
    
    createResume: builder.mutation({
      queryFn: async (resumeData) => {
        try {
          const { createResumeRecord } = await import('../../services/appwrite/database.js')
          const result = await createResumeRecord(resumeData)
          return { data: result }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } }
        }
      },
      invalidatesTags: ['Resume']
    }),
    
    updateResumeAnalysis: builder.mutation({
      queryFn: async ({ resumeId, analysisResults }) => {
        try {
          const { updateResumeAnalysis } = await import('../../services/appwrite/database.js')
          const result = await updateResumeAnalysis(resumeId, analysisResults)
          return { data: result }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } }
        }
      },
      invalidatesTags: (result, error, { resumeId }) => [
        'Resume',
        { type: 'Resume', id: resumeId }
      ]
    }),
    
    // Interview session endpoints
    getInterviewSessions: builder.query({
      queryFn: async (userId) => {
        try {
          // Validate session before making API call
          const { validateAndGetUserId } = await import('../../utils/sessionValidator.js')
          const validatedUserId = await validateAndGetUserId()
          
          const { getInterviewSessionsByUserId } = await import('../../services/appwrite/database.js')
          const result = await getInterviewSessionsByUserId(validatedUserId || userId)
          return { data: result.documents || [] }
        } catch (error) {
          // Handle authentication errors specifically
          if (error.code === 401 || error.message?.includes('Authentication required')) {
            return { error: { status: 401, error: 'Authentication required' } }
          }
          return { error: { status: 'FETCH_ERROR', error: error.message } }
        }
      },
      providesTags: ['InterviewSession']
    }),
    
    createInterviewSession: builder.mutation({
      queryFn: async (sessionData) => {
        try {
          const { createInterviewSession } = await import('../../services/appwrite/database.js')
          const result = await createInterviewSession(sessionData)
          return { data: result }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } }
        }
      },
      invalidatesTags: ['InterviewSession']
    }),
    
    updateInterviewSession: builder.mutation({
      queryFn: async ({ sessionId, ...sessionData }) => {
        try {
          const { updateInterviewSession } = await import('../../services/appwrite/database.js')
          const result = await updateInterviewSession(sessionId, sessionData)
          return { data: result }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } }
        }
      },
      invalidatesTags: ['InterviewSession']
    }),
    
    // Interaction endpoints
    getInteractions: builder.query({
      queryFn: async (sessionId) => {
        try {
          const { getInteractionsBySessionId } = await import('../../services/appwrite/database.js')
          const result = await getInteractionsBySessionId(sessionId)
          return { data: result.documents || [] }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error.message } }
        }
      },
      providesTags: ['Interaction']
    }),
    
    createInteraction: builder.mutation({
      queryFn: async (interactionData) => {
        try {
          const { createInteraction } = await import('../../services/appwrite/database.js')
          const result = await createInteraction(interactionData)
          return { data: result }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } }
        }
      },
      invalidatesTags: ['Interaction']
    }),
    
    // Batch create interactions for better performance
    createInteractionBatch: builder.mutation({
      queryFn: async (interactions) => {
        try {
          const { createInteraction } = await import('../../services/appwrite/database.js')
          const results = await Promise.all(
            interactions.map(interaction => createInteraction(interaction))
          )
          return { data: results }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } }
        }
      },
      invalidatesTags: ['Interaction']
    }),
    
    // Question endpoints
    getQuestions: builder.query({
      queryFn: async (filters = {}) => {
        try {
          const { getQuestions } = await import('../../services/appwrite/database.js')
          const result = await getQuestions(filters, filters.limit || 100, filters.offset || 0)
          return { data: result.documents || [] }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error.message } }
        }
      },
      providesTags: ['Question']
    }),
    
    getQuestionsByCategory: builder.query({
      queryFn: async ({ category, limit = 50 }) => {
        try {
          const { getQuestionsByCategory } = await import('../../services/appwrite/database.js')
          const result = await getQuestionsByCategory(category, limit)
          return { data: result.documents || [] }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error.message } }
        }
      },
      providesTags: (result, error, { category }) => [
        'Question',
        { type: 'Question', id: `category-${category}` }
      ]
    }),
    
    getQuestionsByRole: builder.query({
      queryFn: async ({ role, limit = 50 }) => {
        try {
          const { getQuestionsByRole } = await import('../../services/appwrite/database.js')
          const result = await getQuestionsByRole(role, limit)
          return { data: result.documents || [] }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error.message } }
        }
      },
      providesTags: (result, error, { role }) => [
        'Question',
        { type: 'Question', id: `role-${role}` }
      ]
    }),
    
    createQuestion: builder.mutation({
      queryFn: async (questionData) => {
        try {
          const { createQuestion } = await import('../../services/appwrite/database.js')
          const result = await createQuestion(questionData)
          return { data: result }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } }
        }
      },
      invalidatesTags: ['Question']
    }),
    
    updateQuestion: builder.mutation({
      queryFn: async ({ questionId, ...questionData }) => {
        try {
          const { updateQuestion } = await import('../../services/appwrite/database.js')
          const result = await updateQuestion(questionId, questionData)
          return { data: result }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } }
        }
      },
      invalidatesTags: ['Question']
    }),
    
    deleteQuestion: builder.mutation({
      queryFn: async (questionId) => {
        try {
          const { deleteQuestion } = await import('../../services/appwrite/database.js')
          await deleteQuestion(questionId)
          return { data: { success: true } }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } }
        }
      },
      invalidatesTags: ['Question']
    }),
    
    // Admin endpoints
    getAllUsers: builder.query({
      queryFn: async ({ limit = 100, offset = 0 } = {}) => {
        try {
          const { getAllUsers } = await import('../../services/appwrite/database.js')
          const result = await getAllUsers(limit, offset)
          return { data: result }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error.message } }
        }
      },
      providesTags: ['User']
    }),
    
    searchUsers: builder.query({
      queryFn: async ({ searchTerm, limit = 25 }) => {
        try {
          const { searchUsers } = await import('../../services/appwrite/database.js')
          const result = await searchUsers(searchTerm, limit)
          return { data: result }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error.message } }
        }
      },
      providesTags: ['User']
    }),
    
    updateUserRole: builder.mutation({
      queryFn: async ({ userId, isAdmin }) => {
        try {
          const { updateUser } = await import('../../services/appwrite/database.js')
          const result = await updateUser(userId, { isAdmin })
          return { data: result }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } }
        }
      },
      invalidatesTags: ['User']
    }),
    
    getUserAnalytics: builder.query({
      queryFn: async (userId) => {
        try {
          const { getUserAnalytics } = await import('../../services/appwrite/database.js')
          const result = await getUserAnalytics(userId)
          return { data: result }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error.message } }
        }
      },
      providesTags: (result, error, userId) => [
        'Analytics',
        { type: 'Analytics', id: userId }
      ]
    }),
    
    getApplicationAnalytics: builder.query({
      queryFn: async () => {
        try {
          const { getApplicationAnalytics } = await import('../../services/appwrite/database.js')
          const result = await getApplicationAnalytics()
          return { data: result }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error.message } }
        }
      },
      providesTags: ['Analytics']
    })
  })
})

// Export hooks for usage in components
export const {
  useGetUserQuery,
  useUpdateUserMutation,
  useGetResumesQuery,
  useGetResumeByIdQuery,
  useCreateResumeMutation,
  useUpdateResumeAnalysisMutation,
  useGetInterviewSessionsQuery,
  useCreateInterviewSessionMutation,
  useUpdateInterviewSessionMutation,
  useGetInteractionsQuery,
  useCreateInteractionMutation,
  useCreateInteractionBatchMutation,
  useGetQuestionsQuery,
  useGetQuestionsByCategoryQuery,
  useGetQuestionsByRoleQuery,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useGetAllUsersQuery,
  useSearchUsersQuery,
  useUpdateUserRoleMutation,
  useGetUserAnalyticsQuery,
  useGetApplicationAnalyticsQuery
} = appwriteApi