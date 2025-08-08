/**
 * Appwrite database service functions for all collections
 */

import { ID, Query, Permission, Role } from 'appwrite'
import { databases, appwriteConfig } from './client.js'
import { handleAppwriteError } from '../../utils/errorHandling.js'
import { validateUserData, validateResumeData, validateInterviewSessionData, validateInteractionData, validateQuestionData } from '../../utils/validationSchemas.js'

const { databaseId, collections } = appwriteConfig

// ============================================================================
// USER COLLECTION FUNCTIONS
// ============================================================================

/**
 * Create a new user profile
 * @param {Object} userData - User profile data
 * @returns {Promise<Object>} Created user document
 */
export const createUser = async (userData) => {
  try {
    // Validate user data
    const validatedData = await validateUserData(userData)
    
    const user = await databases.createDocument(
      databaseId,
      collections.users,
      userData.id || ID.unique(),
      {
        ...validatedData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      [
        Permission.read(Role.user(userData.id)),
        Permission.update(Role.user(userData.id)),
        Permission.delete(Role.user(userData.id)),
      ]
    )
    
    return user
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to create user profile')
  }
}

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User document
 */
export const getUserById = async (userId) => {
  try {
    const user = await databases.getDocument(
      databaseId,
      collections.users,
      userId
    )
    return user
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to get user')
  }
}

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated user document
 */
export const updateUser = async (userId, updateData) => {
  try {
    // Validate update data
    const validatedData = await validateUserData(updateData, true)
    
    const user = await databases.updateDocument(
      databaseId,
      collections.users,
      userId,
      {
        ...validatedData,
        updatedAt: new Date().toISOString(),
      }
    )
    
    return user
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to update user profile')
  }
}

/**
 * Get all users (admin only)
 * @param {number} limit - Number of users to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Object>} Users list with pagination
 */
export const getAllUsers = async (limit = 25, offset = 0) => {
  try {
    const users = await databases.listDocuments(
      databaseId,
      collections.users,
      [
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc('createdAt')
      ]
    )
    
    return users
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to get all users')
  }
}

/**
 * Search users by name or email (admin only)
 * @param {string} searchTerm - Search term
 * @param {number} limit - Number of results to return
 * @returns {Promise<Object>} Search results
 */
export const searchUsers = async (searchTerm, limit = 25) => {
  try {
    const users = await databases.listDocuments(
      databaseId,
      collections.users,
      [
        Query.or([
          Query.search('name', searchTerm),
          Query.search('email', searchTerm)
        ]),
        Query.limit(limit),
        Query.orderDesc('createdAt')
      ]
    )
    
    return users
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to search users')
  }
}

// ============================================================================
// RESUME COLLECTION FUNCTIONS
// ============================================================================

/**
 * Create a new resume record
 * @param {Object} resumeData - Resume data
 * @returns {Promise<Object>} Created resume document
 */
export const createResume = async (resumeData) => {
  try {
    // Validate resume data
    const validatedData = await validateResumeData(resumeData)
    
    const resume = await databases.createDocument(
      databaseId,
      collections.resumes,
      ID.unique(),
      {
        ...validatedData,
        uploadedAt: new Date().toISOString(),
      },
      [
        Permission.read(Role.user(resumeData.userId)),
        Permission.update(Role.user(resumeData.userId)),
        Permission.delete(Role.user(resumeData.userId)),
      ]
    )
    
    return resume
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to create resume record')
  }
}

/**
 * Get resumes by user ID
 * @param {string} userId - User ID
 * @param {number} limit - Number of resumes to fetch
 * @returns {Promise<Object>} User's resumes
 */
export const getResumesByUserId = async (userId, limit = 25) => {
  try {
    const resumes = await databases.listDocuments(
      databaseId,
      collections.resumes,
      [
        Query.equal('userId', userId),
        Query.limit(limit),
        Query.orderDesc('uploadedAt')
      ]
    )
    
    return resumes
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to get user resumes')
  }
}

/**
 * Get resume by ID
 * @param {string} resumeId - Resume ID
 * @returns {Promise<Object>} Resume document
 */
export const getResumeById = async (resumeId) => {
  try {
    const resume = await databases.getDocument(
      databaseId,
      collections.resumes,
      resumeId
    )
    return resume
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to get resume')
  }
}

/**
 * Update resume analysis results
 * @param {string} resumeId - Resume ID
 * @param {Object} analysisResults - Analysis results
 * @returns {Promise<Object>} Updated resume document
 */
export const updateResumeAnalysis = async (resumeId, analysisResults) => {
  try {
    const resume = await databases.updateDocument(
      databaseId,
      collections.resumes,
      resumeId,
      {
        analysisResults,
        updatedAt: new Date().toISOString(),
      }
    )
    
    return resume
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to update resume analysis')
  }
}

/**
 * Delete resume
 * @param {string} resumeId - Resume ID
 * @returns {Promise<void>}
 */
export const deleteResume = async (resumeId) => {
  try {
    await databases.deleteDocument(
      databaseId,
      collections.resumes,
      resumeId
    )
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to delete resume')
  }
}

// ============================================================================
// INTERVIEW SESSION COLLECTION FUNCTIONS
// ============================================================================

/**
 * Create a new interview session
 * @param {Object} sessionData - Interview session data
 * @returns {Promise<Object>} Created session document
 */
export const createInterviewSession = async (sessionData) => {
  try {
    // Validate session data
    const validatedData = await validateInterviewSessionData(sessionData)
    
    const session = await databases.createDocument(
      databaseId,
      collections.sessions,
      ID.unique(),
      {
        ...validatedData,
        status: 'active',
        finalScore: 0,
        startedAt: new Date().toISOString(),
        completedAt: null,
      },
      [
        Permission.read(Role.user(sessionData.userId)),
        Permission.update(Role.user(sessionData.userId)),
        Permission.delete(Role.user(sessionData.userId)),
      ]
    )
    
    return session
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to create interview session')
  }
}

/**
 * Get interview sessions by user ID
 * @param {string} userId - User ID
 * @param {number} limit - Number of sessions to fetch
 * @returns {Promise<Object>} User's interview sessions
 */
export const getInterviewSessionsByUserId = async (userId, limit = 25) => {
  try {
    const sessions = await databases.listDocuments(
      databaseId,
      collections.sessions,
      [
        Query.equal('userId', userId),
        Query.limit(limit),
        Query.orderDesc('startedAt')
      ]
    )
    
    return sessions
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to get user interview sessions')
  }
}

/**
 * Get interview session by ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Session document
 */
export const getInterviewSessionById = async (sessionId) => {
  try {
    const session = await databases.getDocument(
      databaseId,
      collections.sessions,
      sessionId
    )
    return session
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to get interview session')
  }
}

/**
 * Update interview session
 * @param {string} sessionId - Session ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated session document
 */
export const updateInterviewSession = async (sessionId, updateData) => {
  try {
    const session = await databases.updateDocument(
      databaseId,
      collections.sessions,
      sessionId,
      {
        ...updateData,
        updatedAt: new Date().toISOString(),
      }
    )
    
    return session
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to update interview session')
  }
}

/**
 * Complete interview session
 * @param {string} sessionId - Session ID
 * @param {number} finalScore - Final interview score
 * @returns {Promise<Object>} Updated session document
 */
export const completeInterviewSession = async (sessionId, finalScore) => {
  try {
    const session = await databases.updateDocument(
      databaseId,
      collections.sessions,
      sessionId,
      {
        status: 'completed',
        finalScore,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    )
    
    return session
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to complete interview session')
  }
}

// ============================================================================
// INTERACTION COLLECTION FUNCTIONS
// ============================================================================

/**
 * Create a new interaction
 * @param {Object} interactionData - Interaction data
 * @returns {Promise<Object>} Created interaction document
 */
export const createInteraction = async (interactionData) => {
  try {
    // Validate interaction data
    const validatedData = await validateInteractionData(interactionData)
    
    const interaction = await databases.createDocument(
      databaseId,
      collections.interactions,
      ID.unique(),
      {
        ...validatedData,
        timestamp: new Date().toISOString(),
      },
      [
        Permission.read(Role.user(interactionData.userId)),
        Permission.update(Role.user(interactionData.userId)),
        Permission.delete(Role.user(interactionData.userId)),
      ]
    )
    
    return interaction
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to create interaction')
  }
}

/**
 * Get interactions by session ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Session interactions
 */
export const getInteractionsBySessionId = async (sessionId) => {
  try {
    const interactions = await databases.listDocuments(
      databaseId,
      collections.interactions,
      [
        Query.equal('sessionId', sessionId),
        Query.orderAsc('order')
      ]
    )
    
    return interactions
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to get session interactions')
  }
}

/**
 * Get interaction by ID
 * @param {string} interactionId - Interaction ID
 * @returns {Promise<Object>} Interaction document
 */
export const getInteractionById = async (interactionId) => {
  try {
    const interaction = await databases.getDocument(
      databaseId,
      collections.interactions,
      interactionId
    )
    return interaction
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to get interaction')
  }
}

/**
 * Update interaction
 * @param {string} interactionId - Interaction ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated interaction document
 */
export const updateInteraction = async (interactionId, updateData) => {
  try {
    const interaction = await databases.updateDocument(
      databaseId,
      collections.interactions,
      interactionId,
      updateData
    )
    
    return interaction
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to update interaction')
  }
}

// ============================================================================
// QUESTION COLLECTION FUNCTIONS
// ============================================================================

/**
 * Create a new question
 * @param {Object} questionData - Question data
 * @returns {Promise<Object>} Created question document
 */
export const createQuestion = async (questionData) => {
  try {
    // Validate question data
    const validatedData = await validateQuestionData(questionData)
    
    const question = await databases.createDocument(
      databaseId,
      collections.questions,
      ID.unique(),
      {
        ...validatedData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      [
        Permission.read(Role.any()),
        Permission.update(Role.team('admin')),
        Permission.delete(Role.team('admin')),
      ]
    )
    
    return question
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to create question')
  }
}

/**
 * Get all questions with optional filtering
 * @param {Object} filters - Filter options
 * @param {string} filters.category - Question category
 * @param {string} filters.role - Target role
 * @param {string} filters.search - Search term
 * @param {number} limit - Number of questions to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Object>} Questions list
 */
export const getQuestions = async (filters = {}, limit = 100, offset = 0) => {
  try {
    const queries = [
      Query.limit(limit),
      Query.offset(offset),
      Query.orderDesc('createdAt')
    ]
    
    // Add category filter
    if (filters.category) {
      queries.push(Query.equal('category', filters.category))
    }
    
    // Add role filter
    if (filters.role) {
      queries.push(Query.equal('role', filters.role))
    }
    
    // Add search filter
    if (filters.search) {
      queries.push(Query.search('questionText', filters.search))
    }
    
    const questions = await databases.listDocuments(
      databaseId,
      collections.questions,
      queries
    )
    
    return questions
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to get questions')
  }
}

/**
 * Get question by ID
 * @param {string} questionId - Question ID
 * @returns {Promise<Object>} Question document
 */
export const getQuestionById = async (questionId) => {
  try {
    const question = await databases.getDocument(
      databaseId,
      collections.questions,
      questionId
    )
    return question
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to get question')
  }
}

/**
 * Update question
 * @param {string} questionId - Question ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated question document
 */
export const updateQuestion = async (questionId, updateData) => {
  try {
    // Validate update data
    const validatedData = await validateQuestionData(updateData, true)
    
    const question = await databases.updateDocument(
      databaseId,
      collections.questions,
      questionId,
      {
        ...validatedData,
        updatedAt: new Date().toISOString(),
      }
    )
    
    return question
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to update question')
  }
}

/**
 * Delete question
 * @param {string} questionId - Question ID
 * @returns {Promise<void>}
 */
export const deleteQuestion = async (questionId) => {
  try {
    await databases.deleteDocument(
      databaseId,
      collections.questions,
      questionId
    )
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to delete question')
  }
}

/**
 * Get questions by category
 * @param {string} category - Question category
 * @param {number} limit - Number of questions to fetch
 * @returns {Promise<Object>} Questions in category
 */
export const getQuestionsByCategory = async (category, limit = 50) => {
  try {
    const questions = await databases.listDocuments(
      databaseId,
      collections.questions,
      [
        Query.equal('category', category),
        Query.limit(limit),
        Query.orderDesc('createdAt')
      ]
    )
    
    return questions
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to get questions by category')
  }
}

/**
 * Get questions by role
 * @param {string} role - Target role
 * @param {number} limit - Number of questions to fetch
 * @returns {Promise<Object>} Questions for role
 */
export const getQuestionsByRole = async (role, limit = 50) => {
  try {
    const questions = await databases.listDocuments(
      databaseId,
      collections.questions,
      [
        Query.equal('role', role),
        Query.limit(limit),
        Query.orderDesc('createdAt')
      ]
    )
    
    return questions
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to get questions by role')
  }
}

// ============================================================================
// ANALYTICS AND ADMIN FUNCTIONS
// ============================================================================

/**
 * Get user analytics data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User analytics
 */
export const getUserAnalytics = async (userId) => {
  try {
    // Get user's sessions
    const sessions = await getInterviewSessionsByUserId(userId, 100)
    
    // Get user's resumes
    const resumes = await getResumesByUserId(userId, 100)
    
    // Calculate analytics
    const totalSessions = sessions.total
    const completedSessions = sessions.documents.filter(s => s.status === 'completed').length
    const averageScore = sessions.documents
      .filter(s => s.status === 'completed' && s.finalScore > 0)
      .reduce((sum, s) => sum + s.finalScore, 0) / completedSessions || 0
    
    return {
      totalSessions,
      completedSessions,
      averageScore: Math.round(averageScore * 100) / 100,
      totalResumes: resumes.total,
      lastActivity: sessions.documents[0]?.startedAt || null,
    }
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to get user analytics')
  }
}

/**
 * Get application-wide analytics (admin only)
 * @returns {Promise<Object>} Application analytics
 */
export const getApplicationAnalytics = async () => {
  try {
    // Get all users count
    const users = await getAllUsers(1, 0)
    const totalUsers = users.total
    
    // Get all sessions
    const allSessions = await databases.listDocuments(
      databaseId,
      collections.sessions,
      [Query.limit(1000)]
    )
    
    // Get all questions
    const allQuestions = await databases.listDocuments(
      databaseId,
      collections.questions,
      [Query.limit(1000)]
    )
    
    // Calculate metrics
    const totalSessions = allSessions.total
    const completedSessions = allSessions.documents.filter(s => s.status === 'completed').length
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0
    
    // Get session types breakdown
    const sessionTypes = allSessions.documents.reduce((acc, session) => {
      acc[session.sessionType] = (acc[session.sessionType] || 0) + 1
      return acc
    }, {})
    
    return {
      totalUsers,
      totalSessions,
      completedSessions,
      completionRate: Math.round(completionRate * 100) / 100,
      totalQuestions: allQuestions.total,
      sessionTypes,
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to get application analytics')
  }
}

// ============================================================================
// ALIAS FUNCTIONS FOR RESUME SLICE COMPATIBILITY
// ============================================================================

/**
 * Alias for createResume - used by resumeSlice
 */
export const createResumeRecord = createResume

/**
 * Alias for getResumesByUserId - used by resumeSlice
 */
export const getUserResumes = getResumesByUserId