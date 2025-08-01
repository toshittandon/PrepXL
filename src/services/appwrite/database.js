import { ID, Query } from 'appwrite';
import { databases, appwriteConfig } from './config.js';
import { asyncHandler, formatDocumentData, formatDocuments, retryRequest } from './utils.js';

/**
 * Database Service
 * Handles all database operations for the application
 */
export class DatabaseService {
  constructor() {
    this.databaseId = appwriteConfig.databaseId;
    this.collections = appwriteConfig.collections;
  }

  // ==================== USERS COLLECTION ====================

  /**
   * Create a new user profile
   */
  async createUser(userData) {
    return asyncHandler(async () => {
      const document = await databases.createDocument(
        this.databaseId,
        this.collections.users,
        ID.unique(),
        userData
      );
      return formatDocumentData(document);
    });
  }

  /**
   * Get user by ID
   */
  async getUser(userId) {
    return asyncHandler(async () => {
      const document = await databases.getDocument(
        this.databaseId,
        this.collections.users,
        userId
      );
      return formatDocumentData(document);
    });
  }

  /**
   * Update user profile
   */
  async updateUser(userId, userData) {
    return asyncHandler(async () => {
      const document = await databases.updateDocument(
        this.databaseId,
        this.collections.users,
        userId,
        userData
      );
      return formatDocumentData(document);
    });
  }

  /**
   * Delete user profile
   */
  async deleteUser(userId) {
    return asyncHandler(async () => {
      await databases.deleteDocument(
        this.databaseId,
        this.collections.users,
        userId
      );
      return { message: 'User deleted successfully' };
    });
  }

  // ==================== RESUMES COLLECTION ====================

  /**
   * Create a new resume record
   */
  async createResume(resumeData) {
    return asyncHandler(async () => {
      const document = await databases.createDocument(
        this.databaseId,
        this.collections.resumes,
        ID.unique(),
        resumeData
      );
      return formatDocumentData(document);
    });
  }

  /**
   * Get resume by ID
   */
  async getResume(resumeId) {
    return asyncHandler(async () => {
      const document = await databases.getDocument(
        this.databaseId,
        this.collections.resumes,
        resumeId
      );
      return formatDocumentData(document);
    });
  }

  /**
   * Get all resumes for a user
   */
  async getUserResumes(userId) {
    return asyncHandler(async () => {
      const documents = await databases.listDocuments(
        this.databaseId,
        this.collections.resumes,
        [
          Query.equal('userId', userId),
          Query.orderDesc('$createdAt')
        ]
      );
      return formatDocuments(documents.documents);
    });
  }

  /**
   * Update resume data
   */
  async updateResume(resumeId, resumeData) {
    return asyncHandler(async () => {
      const document = await databases.updateDocument(
        this.databaseId,
        this.collections.resumes,
        resumeId,
        resumeData
      );
      return formatDocumentData(document);
    });
  }

  /**
   * Delete resume
   */
  async deleteResume(resumeId) {
    return asyncHandler(async () => {
      await databases.deleteDocument(
        this.databaseId,
        this.collections.resumes,
        resumeId
      );
      return { message: 'Resume deleted successfully' };
    });
  }

  // ==================== INTERVIEW SESSIONS COLLECTION ====================

  /**
   * Create a new interview session
   */
  async createInterviewSession(sessionData) {
    return asyncHandler(async () => {
      const document = await databases.createDocument(
        this.databaseId,
        this.collections.sessions,
        ID.unique(),
        sessionData
      );
      return formatDocumentData(document);
    });
  }

  /**
   * Get interview session by ID
   */
  async getInterviewSession(sessionId) {
    return asyncHandler(async () => {
      const document = await databases.getDocument(
        this.databaseId,
        this.collections.sessions,
        sessionId
      );
      return formatDocumentData(document);
    });
  }

  /**
   * Get all interview sessions for a user
   */
  async getUserInterviewSessions(userId) {
    return asyncHandler(async () => {
      const documents = await databases.listDocuments(
        this.databaseId,
        this.collections.sessions,
        [
          Query.equal('userId', userId),
          Query.orderDesc('$createdAt')
        ]
      );
      return formatDocuments(documents.documents);
    });
  }

  /**
   * Update interview session
   */
  async updateInterviewSession(sessionId, sessionData) {
    return asyncHandler(async () => {
      const document = await databases.updateDocument(
        this.databaseId,
        this.collections.sessions,
        sessionId,
        sessionData
      );
      return formatDocumentData(document);
    });
  }

  /**
   * Delete interview session
   */
  async deleteInterviewSession(sessionId) {
    return asyncHandler(async () => {
      await databases.deleteDocument(
        this.databaseId,
        this.collections.sessions,
        sessionId
      );
      return { message: 'Interview session deleted successfully' };
    });
  }

  /**
   * Get active interview sessions for a user
   */
  async getActiveInterviewSessions(userId) {
    return asyncHandler(async () => {
      const documents = await databases.listDocuments(
        this.databaseId,
        this.collections.sessions,
        [
          Query.equal('userId', userId),
          Query.equal('status', 'active'),
          Query.orderDesc('$createdAt')
        ]
      );
      return formatDocuments(documents.documents);
    });
  }

  /**
   * Get completed interview sessions for a user
   */
  async getCompletedInterviewSessions(userId) {
    return asyncHandler(async () => {
      const documents = await databases.listDocuments(
        this.databaseId,
        this.collections.sessions,
        [
          Query.equal('userId', userId),
          Query.equal('status', 'completed'),
          Query.orderDesc('$createdAt')
        ]
      );
      return formatDocuments(documents.documents);
    });
  }

  // ==================== INTERACTIONS COLLECTION ====================

  /**
   * Create a new interaction
   */
  async createInteraction(interactionData) {
    return asyncHandler(async () => {
      const document = await databases.createDocument(
        this.databaseId,
        this.collections.interactions,
        ID.unique(),
        interactionData
      );
      return formatDocumentData(document);
    });
  }

  /**
   * Get interaction by ID
   */
  async getInteraction(interactionId) {
    return asyncHandler(async () => {
      const document = await databases.getDocument(
        this.databaseId,
        this.collections.interactions,
        interactionId
      );
      return formatDocumentData(document);
    });
  }

  /**
   * Get all interactions for a session
   */
  async getSessionInteractions(sessionId) {
    return asyncHandler(async () => {
      const documents = await databases.listDocuments(
        this.databaseId,
        this.collections.interactions,
        [
          Query.equal('sessionId', sessionId),
          Query.orderAsc('order')
        ]
      );
      return formatDocuments(documents.documents);
    });
  }

  /**
   * Update interaction
   */
  async updateInteraction(interactionId, interactionData) {
    return asyncHandler(async () => {
      const document = await databases.updateDocument(
        this.databaseId,
        this.collections.interactions,
        interactionId,
        interactionData
      );
      return formatDocumentData(document);
    });
  }

  /**
   * Delete interaction
   */
  async deleteInteraction(interactionId) {
    return asyncHandler(async () => {
      await databases.deleteDocument(
        this.databaseId,
        this.collections.interactions,
        interactionId
      );
      return { message: 'Interaction deleted successfully' };
    });
  }

  /**
   * Delete all interactions for a session
   */
  async deleteSessionInteractions(sessionId) {
    return asyncHandler(async () => {
      const interactions = await this.getSessionInteractions(sessionId);
      if (interactions.success && interactions.data.length > 0) {
        const deletePromises = interactions.data.map(interaction =>
          databases.deleteDocument(
            this.databaseId,
            this.collections.interactions,
            interaction.id
          )
        );
        await Promise.all(deletePromises);
      }
      return { message: 'All session interactions deleted successfully' };
    });
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get dashboard data for a user
   */
  async getDashboardData(userId) {
    return asyncHandler(async () => {
      const [userResult, sessionsResult, resumesResult] = await Promise.all([
        this.getUser(userId),
        this.getUserInterviewSessions(userId),
        this.getUserResumes(userId)
      ]);

      return {
        user: userResult.success ? userResult.data : null,
        sessions: sessionsResult.success ? sessionsResult.data : [],
        resumes: resumesResult.success ? resumesResult.data : [],
      };
    });
  }

  /**
   * Search documents with text query
   */
  async searchDocuments(collectionId, searchQuery, userId = null) {
    return asyncHandler(async () => {
      const queries = [Query.search('title', searchQuery)];
      
      if (userId) {
        queries.push(Query.equal('userId', userId));
      }

      const documents = await databases.listDocuments(
        this.databaseId,
        collectionId,
        queries
      );
      return formatDocuments(documents.documents);
    });
  }

  /**
   * Get documents with pagination
   */
  async getDocumentsPaginated(collectionId, queries = [], limit = 25, offset = 0) {
    return asyncHandler(async () => {
      const allQueries = [
        Query.limit(limit),
        Query.offset(offset),
        ...queries
      ];

      const documents = await databases.listDocuments(
        this.databaseId,
        collectionId,
        allQueries
      );

      return {
        documents: formatDocuments(documents.documents),
        total: documents.total,
        limit,
        offset,
      };
    });
  }

  /**
   * Batch create documents
   */
  async batchCreateDocuments(collectionId, documentsData) {
    return asyncHandler(async () => {
      const createPromises = documentsData.map(data =>
        retryRequest(() =>
          databases.createDocument(
            this.databaseId,
            collectionId,
            ID.unique(),
            data
          )
        )
      );

      const results = await Promise.allSettled(createPromises);
      const successful = results
        .filter(result => result.status === 'fulfilled')
        .map(result => formatDocumentData(result.value));
      
      const failed = results
        .filter(result => result.status === 'rejected')
        .map(result => result.reason);

      return {
        successful,
        failed,
        totalCreated: successful.length,
        totalFailed: failed.length,
      };
    });
  }

  /**
   * Health check for database connection
   */
  async healthCheck() {
    return asyncHandler(async () => {
      // Try to list documents from users collection with limit 1
      await databases.listDocuments(
        this.databaseId,
        this.collections.users,
        [Query.limit(1)]
      );
      return { status: 'healthy', timestamp: new Date().toISOString() };
    });
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();