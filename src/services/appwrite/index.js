/**
 * Appwrite services main export file
 * Provides a centralized interface for all Appwrite operations
 */

// Export client and configuration
export { 
  client, 
  account, 
  databases, 
  storage, 
  teams,
  appwriteConfig,
  checkClientHealth,
  initializeClient 
} from './client.js'

// Export authentication services
export {
  createAccount,
  signInWithEmail,
  signInWithOAuth,
  getCurrentSession,
  getCurrentUser,
  getCurrentUserWithProfile,
  signOut,
  signOutFromAllSessions,
  updatePassword,
  updateEmail,
  updateName,
  sendPasswordRecovery,
  completePasswordRecovery,
  sendEmailVerification,
  completeEmailVerification,
  isUserAdmin,
  validateUserSession
} from './auth.js'

// Export database services
export {
  // User functions
  createUser,
  getUserById,
  updateUser,
  getAllUsers,
  searchUsers,
  
  // Resume functions
  createResume,
  getResumesByUserId,
  getResumeById,
  updateResumeAnalysis,
  deleteResume,
  
  // Interview session functions
  createInterviewSession,
  getInterviewSessionsByUserId,
  getInterviewSessionById,
  updateInterviewSession,
  completeInterviewSession,
  
  // Interaction functions
  createInteraction,
  getInteractionsBySessionId,
  getInteractionById,
  updateInteraction,
  
  // Question functions
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getQuestionsByCategory,
  getQuestionsByRole,
  
  // Analytics functions
  getUserAnalytics,
  getApplicationAnalytics
} from './database.js'

// Export storage services
export {
  validateFile,
  uploadResumeFile,
  getFileMetadata,
  getFileDownloadUrl,
  getFilePreviewUrl,
  downloadFileAsBlob,
  readFileAsText,
  deleteFile,
  getUserFiles,
  getBucketInfo,
  fileExists,
  formatFileSize,
  getFileExtension,
  generateSecureFilename,
  batchUploadFiles,
  cleanupOrphanedFiles
} from './storage.js'

// Export utility functions for common operations
export const appwriteUtils = {
  /**
   * Initialize Appwrite services
   * @returns {Promise<boolean>} Success status
   */
  initialize: async () => {
    try {
      const clientReady = await initializeClient()
      if (clientReady) {
        console.log('🚀 Appwrite services initialized successfully')
        return true
      } else {
        console.error('❌ Failed to initialize Appwrite services')
        return false
      }
    } catch (error) {
      console.error('❌ Error initializing Appwrite services:', error)
      return false
    }
  },

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>} Authentication status
   */
  isAuthenticated: async () => {
    try {
      const session = await getCurrentSession()
      return !!session
    } catch (error) {
      return false
    }
  },

  /**
   * Get user with full profile data
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User with profile or null
   */
  getUserWithProfile: async (userId) => {
    try {
      const user = await getUserById(userId)
      return user
    } catch (error) {
      console.error('Failed to get user with profile:', error)
      return null
    }
  },

  /**
   * Create complete user session data
   * @param {Object} credentials - Login credentials
   * @returns {Promise<Object>} Complete session data
   */
  createUserSession: async (credentials) => {
    try {
      const session = await signInWithEmail(credentials)
      const user = await getCurrentUserWithProfile()
      
      return {
        session,
        user,
        isAuthenticated: true,
        isAdmin: user?.profile?.isAdmin || false
      }
    } catch (error) {
      throw error
    }
  },

  /**
   * Get user dashboard data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Dashboard data
   */
  getDashboardData: async (userId) => {
    try {
      const [analytics, sessions, resumes] = await Promise.all([
        getUserAnalytics(userId),
        getInterviewSessionsByUserId(userId, 10),
        getResumesByUserId(userId, 5)
      ])

      return {
        analytics,
        recentSessions: sessions.documents,
        recentResumes: resumes.documents,
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      throw error
    }
  },

  /**
   * Get admin dashboard data
   * @returns {Promise<Object>} Admin dashboard data
   */
  getAdminDashboardData: async () => {
    try {
      const [analytics, users, questions] = await Promise.all([
        getApplicationAnalytics(),
        getAllUsers(10, 0),
        getQuestions({}, 10, 0)
      ])

      return {
        analytics,
        recentUsers: users.documents,
        recentQuestions: questions.documents,
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      throw error
    }
  },

  /**
   * Complete interview workflow
   * @param {string} sessionId - Session ID
   * @param {Array} interactions - Session interactions
   * @returns {Promise<Object>} Completed session data
   */
  completeInterviewWorkflow: async (sessionId, interactions) => {
    try {
      // Calculate final score based on interactions
      const finalScore = interactions.length > 0 
        ? Math.round((interactions.length / 10) * 100) // Simple scoring logic
        : 0

      // Complete the session
      const completedSession = await completeInterviewSession(sessionId, finalScore)
      
      // Get all interactions for the session
      const sessionInteractions = await getInteractionsBySessionId(sessionId)
      
      return {
        session: completedSession,
        interactions: sessionInteractions.documents,
        finalScore
      }
    } catch (error) {
      throw error
    }
  },

  /**
   * Process resume upload workflow
   * @param {File} file - Resume file
   * @param {string} userId - User ID
   * @param {string} jobDescription - Job description text
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Complete resume data
   */
  processResumeUpload: async (file, userId, jobDescription, onProgress) => {
    try {
      // Upload file to storage
      const fileData = await uploadResumeFile(file, userId, onProgress)
      
      // Create resume record in database
      const resumeData = await createResume({
        userId,
        fileId: fileData.fileId,
        fileName: fileData.fileName,
        jobDescription,
        analysisResults: null // Will be updated after AI analysis
      })

      return {
        resume: resumeData,
        file: fileData
      }
    } catch (error) {
      throw error
    }
  }
}

// Note: Default export removed to avoid circular dependency issues
// All functions are available as named exports