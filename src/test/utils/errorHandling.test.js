import { describe, it, expect, vi } from 'vitest';
import {
  categorizeError,
  getErrorSeverity,
  getUserFriendlyError,
  retryWithBackoff,
  withRetry,
  getRecoveryStrategy,
  createErrorNotification,
  ERROR_TYPES,
  ERROR_SEVERITY,
  RECOVERY_STRATEGIES
} from '../../utils/errorHandling';

describe('Error Handling Utils', () => {
  describe('categorizeError', () => {
    it('should categorize network errors', () => {
      const networkError = new Error('fetch failed');
      networkError.name = 'NetworkError';
      expect(categorizeError(networkError)).toBe(ERROR_TYPES.NETWORK);
    });

    it('should categorize authentication errors by status code', () => {
      const authError = { status: 401, message: 'Unauthorized' };
      expect(categorizeError(authError)).toBe(ERROR_TYPES.AUTHENTICATION);
    });

    it('should categorize validation errors', () => {
      const validationError = { status: 400, message: 'Bad request' };
      expect(categorizeError(validationError)).toBe(ERROR_TYPES.VALIDATION);
    });

    it('should categorize server errors', () => {
      const serverError = { status: 500, message: 'Internal server error' };
      expect(categorizeError(serverError)).toBe(ERROR_TYPES.SERVER);
    });

    it('should categorize Appwrite errors', () => {
      const appwriteError = { type: 'user_invalid_credentials' };
      expect(categorizeError(appwriteError)).toBe(ERROR_TYPES.AUTHENTICATION);
    });

    it('should return UNKNOWN for unrecognized errors', () => {
      const unknownError = { message: 'Something went wrong' };
      expect(categorizeError(unknownError)).toBe(ERROR_TYPES.UNKNOWN);
    });
  });

  describe('getErrorSeverity', () => {
    it('should return HIGH severity for authentication errors outside login page', () => {
      expect(getErrorSeverity(ERROR_TYPES.AUTHENTICATION, { isLoginPage: false }))
        .toBe(ERROR_SEVERITY.HIGH);
    });

    it('should return MEDIUM severity for authentication errors on login page', () => {
      expect(getErrorSeverity(ERROR_TYPES.AUTHENTICATION, { isLoginPage: true }))
        .toBe(ERROR_SEVERITY.MEDIUM);
    });

    it('should return HIGH severity for server errors', () => {
      expect(getErrorSeverity(ERROR_TYPES.SERVER)).toBe(ERROR_SEVERITY.HIGH);
    });

    it('should return LOW severity for validation errors', () => {
      expect(getErrorSeverity(ERROR_TYPES.VALIDATION)).toBe(ERROR_SEVERITY.LOW);
    });
  });

  describe('getUserFriendlyError', () => {
    it('should return user-friendly message for network errors', () => {
      const networkError = new Error('fetch failed');
      networkError.name = 'NetworkError';
      
      const result = getUserFriendlyError(networkError);
      
      expect(result.title).toBe('Connection Problem');
      expect(result.message).toContain('internet connection');
      expect(result.type).toBe(ERROR_TYPES.NETWORK);
    });

    it('should preserve specific error messages when appropriate', () => {
      const specificError = new Error('Custom error message');
      const result = getUserFriendlyError(specificError);
      
      expect(result.message).toBe('Custom error message');
    });

    it('should not show fetch-related messages to users', () => {
      const fetchError = new Error('fetch is not defined');
      const result = getUserFriendlyError(fetchError);
      
      expect(result.message).not.toContain('fetch');
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      
      const result = await retryWithBackoff(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on network errors', async () => {
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      
      const mockFn = vi.fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue('success');
      
      const result = await retryWithBackoff(mockFn, { maxRetries: 2 });
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should not retry validation errors', async () => {
      const validationError = { status: 400, message: 'Bad request' };
      const mockFn = vi.fn().mockRejectedValue(validationError);
      
      await expect(retryWithBackoff(mockFn)).rejects.toEqual(validationError);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should respect maxRetries limit', async () => {
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      
      const mockFn = vi.fn().mockRejectedValue(networkError);
      
      await expect(retryWithBackoff(mockFn, { maxRetries: 2 }))
        .rejects.toEqual(networkError);
      expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('withRetry', () => {
    it('should create a retry wrapper function', async () => {
      const originalFn = vi.fn().mockResolvedValue('success');
      const wrappedFn = withRetry(originalFn);
      
      const result = await wrappedFn('arg1', 'arg2');
      
      expect(result).toBe('success');
      expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('getRecoveryStrategy', () => {
    it('should recommend RETRY for network errors', () => {
      expect(getRecoveryStrategy(ERROR_TYPES.NETWORK))
        .toBe(RECOVERY_STRATEGIES.RETRY);
    });

    it('should recommend REDIRECT for authentication errors on public pages', () => {
      expect(getRecoveryStrategy(ERROR_TYPES.AUTHENTICATION, { isPublicPage: true }))
        .toBe(RECOVERY_STRATEGIES.REDIRECT);
    });

    it('should recommend REFRESH for authentication errors on private pages', () => {
      expect(getRecoveryStrategy(ERROR_TYPES.AUTHENTICATION, { isPublicPage: false }))
        .toBe(RECOVERY_STRATEGIES.REFRESH);
    });

    it('should recommend IGNORE for validation errors', () => {
      expect(getRecoveryStrategy(ERROR_TYPES.VALIDATION))
        .toBe(RECOVERY_STRATEGIES.IGNORE);
    });
  });

  describe('createErrorNotification', () => {
    it('should create error notification with retry action for network errors', () => {
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      
      const retryAction = vi.fn();
      const notification = createErrorNotification(networkError, { retryAction });
      
      expect(notification.type).toBe('error');
      expect(notification.title).toBe('Connection Problem');
      expect(notification.actions).toHaveLength(1);
      expect(notification.actions[0].label).toBe('Try Again');
    });

    it('should create non-persistent notification for server errors', () => {
      const serverError = { status: 500, message: 'Server error' };
      const notification = createErrorNotification(serverError);
      
      expect(notification.persistent).toBe(false);
      expect(notification.duration).toBe(8000);
    });

    it('should create temporary notification for non-critical errors', () => {
      const validationError = { status: 400, message: 'Validation error' };
      const notification = createErrorNotification(validationError);
      
      expect(notification.persistent).toBe(false);
      expect(notification.duration).toBe(8000);
    });
  });
});