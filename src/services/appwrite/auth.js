import { ID, OAuthProvider } from 'appwrite';
import { account } from './config.js';
import { asyncHandler, formatUserData, retryRequest } from './utils.js';

/**
 * Authentication Service
 * Handles user authentication, registration, and session management
 */
export class AuthService {
  /**
   * Create a new user account
   */
  async createAccount(email, password, name) {
    return asyncHandler(async () => {
      const user = await account.create(ID.unique(), email, password, name);
      return formatUserData(user);
    });
  }

  /**
   * Sign in with email and password
   */
  async login(email, password) {
    return asyncHandler(async () => {
      console.log('AuthService.login - account object:', account);
      console.log('AuthService.login - available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(account)));

      // Try different method names based on Appwrite version
      let session;
      if (typeof account.createEmailPasswordSession === 'function') {
        // Newer Appwrite versions
        session = await account.createEmailPasswordSession(email, password);
      } else if (typeof account.createEmailSession === 'function') {
        // Older Appwrite versions
        session = await account.createEmailSession(email, password);
      } else {
        throw new Error('No suitable login method found. Available methods: ' + Object.getOwnPropertyNames(Object.getPrototypeOf(account)).join(', '));
      }

      return session;
    });
  }

  /**
   * Sign out current user
   */
  async logout() {
    return asyncHandler(async () => {
      await account.deleteSession('current');
      return { message: 'Logged out successfully' };
    });
  }

  /**
   * Get current user account
   */
  async getCurrentUser() {
    return asyncHandler(async () => {
      const user = await account.get();
      return formatUserData(user);
    });
  }

  /**
   * Get current session
   */
  async getCurrentSession() {
    return asyncHandler(async () => {
      const session = await account.getSession('current');
      return session;
    });
  }

  /**
   * Update user preferences
   */
  async updatePreferences(prefs) {
    return asyncHandler(async () => {
      const user = await account.updatePrefs(prefs);
      return formatUserData(user);
    });
  }

  /**
   * Update user name
   */
  async updateName(name) {
    return asyncHandler(async () => {
      const user = await account.updateName(name);
      return formatUserData(user);
    });
  }

  /**
   * Update user email
   */
  async updateEmail(email, password) {
    return asyncHandler(async () => {
      const user = await account.updateEmail(email, password);
      return formatUserData(user);
    });
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword, oldPassword) {
    return asyncHandler(async () => {
      const user = await account.updatePassword(newPassword, oldPassword);
      return formatUserData(user);
    });
  }

  /**
   * Send password recovery email
   */
  async createRecovery(email, url) {
    return asyncHandler(async () => {
      const recovery = await account.createRecovery(email, url);
      return recovery;
    });
  }

  /**
   * Complete password recovery
   */
  async updateRecovery(userId, secret, password, passwordAgain) {
    return asyncHandler(async () => {
      const recovery = await account.updateRecovery(userId, secret, password, passwordAgain);
      return recovery;
    });
  }

  /**
   * Send email verification
   */
  async createVerification(url) {
    return asyncHandler(async () => {
      const verification = await account.createVerification(url);
      return verification;
    });
  }

  /**
   * Confirm email verification
   */
  async updateVerification(userId, secret) {
    return asyncHandler(async () => {
      const verification = await account.updateVerification(userId, secret);
      return verification;
    });
  }

  /**
   * OAuth login with Google
   */
  async loginWithGoogle(successUrl, failureUrl) {
    return asyncHandler(async () => {
      // This will redirect to Google OAuth
      account.createOAuth2Session(
        OAuthProvider.Google,
        successUrl,
        failureUrl
      );
      return { message: 'Redirecting to Google OAuth...' };
    });
  }

  /**
   * OAuth login with LinkedIn
   */
  async loginWithLinkedIn(successUrl, failureUrl) {
    return asyncHandler(async () => {
      // This will redirect to LinkedIn OAuth
      account.createOAuth2Session(
        OAuthProvider.Linkedin,
        successUrl,
        failureUrl
      );
      return { message: 'Redirecting to LinkedIn OAuth...' };
    });
  }

  /**
   * OAuth login with Apple
   */
  async loginWithApple(successUrl, failureUrl) {
    return asyncHandler(async () => {
      // This will redirect to Apple OAuth
      account.createOAuth2Session(
        OAuthProvider.Apple,
        successUrl,
        failureUrl
      );
      return { message: 'Redirecting to Apple OAuth...' };
    });
  }

  /**
   * OAuth login with GitHub
   */
  async loginWithGitHub(successUrl, failureUrl) {
    return asyncHandler(async () => {
      // This will redirect to GitHub OAuth
      account.createOAuth2Session(
        OAuthProvider.Github,
        successUrl,
        failureUrl
      );
      return { message: 'Redirecting to GitHub OAuth...' };
    });
  }

  /**
   * Get all active sessions
   */
  async getSessions() {
    return asyncHandler(async () => {
      const sessions = await account.listSessions();
      return sessions;
    });
  }

  /**
   * Delete a specific session
   */
  async deleteSession(sessionId) {
    return asyncHandler(async () => {
      await account.deleteSession(sessionId);
      return { message: 'Session deleted successfully' };
    });
  }

  /**
   * Delete all sessions (logout from all devices)
   */
  async deleteAllSessions() {
    return asyncHandler(async () => {
      await account.deleteSessions();
      return { message: 'All sessions deleted successfully' };
    });
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    try {
      const session = await this.getCurrentSession();
      return session.success && session.data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh session with retry mechanism
   */
  async refreshSession() {
    return asyncHandler(async () => {
      return await retryRequest(async () => {
        const session = await account.getSession('current');
        return session;
      });
    });
  }
}

// Export singleton instance
export const authService = new AuthService();