/**
 * Test session conflict detection in signInWithEmail function
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the client module
vi.mock('../../services/appwrite/client.js', () => ({
  account: {
    createEmailPasswordSession: vi.fn(),
    deleteSession: vi.fn(),
    deleteSessions: vi.fn()
  }
}))

// Mock the error handling utility
vi.mock('../../utils/errorHandling.js', () => ({
  handleAppwriteError: vi.fn((error, message) => {
    const enhancedError = new Error(message)
    enhancedError.code = error.code
    enhancedError.type = error.type
    enhancedError.originalError = error
    return enhancedError
  }),
  logSessionConflictError: vi.fn(),
  SESSION_CONFLICT_TYPES: {
    EXISTING_SESSION: 'EXISTING_SESSION',
    CURRENT_SESSION_CLEAR_FAILED: 'CURRENT_SESSION_CLEAR_FAILED',
    ALL_SESSIONS_CLEAR_FAILED: 'ALL_SESSIONS_CLEAR_FAILED',
    RESOLUTION_IN_PROGRESS: 'RESOLUTION_IN_PROGRESS',
    RESOLUTION_SUCCESS: 'RESOLUTION_SUCCESS'
  }
}))

// Mock the config utility
vi.mock('../../utils/envConfig.js', () => ({
  getConfig: vi.fn(() => ({}))
}))

import { signInWithEmail } from '../../services/appwrite/auth.js'
import { account } from '../../services/appwrite/client.js'

describe('Session Conflict Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully sign in when no session conflict exists', async () => {
    const mockSession = { $id: 'session-123', userId: 'user-123' }
    account.createEmailPasswordSession.mockResolvedValue(mockSession)

    const result = await signInWithEmail({
      email: 'test@example.com',
      password: 'password123'
    })

    expect(result).toEqual(mockSession)
    expect(account.createEmailPasswordSession).toHaveBeenCalledWith(
      'test@example.com',
      'password123'
    )
  })

  it('should detect session conflict and resolve it automatically', async () => {
    const sessionConflictError = {
      code: 401,
      type: 'user_session_already_exists',
      message: 'Creation of a session is prohibited when a session is active'
    }
    const mockSession = { $id: 'session-123', userId: 'user-123' }
    
    // First call fails with session conflict, second call succeeds after clearing session
    account.createEmailPasswordSession
      .mockRejectedValueOnce(sessionConflictError)
      .mockResolvedValueOnce(mockSession)
    account.deleteSession.mockResolvedValueOnce()

    const result = await signInWithEmail({
      email: 'test@example.com',
      password: 'password123'
    })

    expect(result).toEqual(mockSession)
    expect(account.createEmailPasswordSession).toHaveBeenCalledTimes(2)
    expect(account.deleteSession).toHaveBeenCalledWith('current')
  })

  it('should handle other authentication errors normally', async () => {
    const invalidCredentialsError = {
      code: 401,
      type: 'user_invalid_credentials',
      message: 'Invalid credentials'
    }
    
    account.createEmailPasswordSession.mockRejectedValue(invalidCredentialsError)

    await expect(signInWithEmail({
      email: 'test@example.com',
      password: 'wrongpassword'
    })).rejects.toThrow('Failed to sign in')

    expect(account.createEmailPasswordSession).toHaveBeenCalledWith(
      'test@example.com',
      'wrongpassword'
    )
  })

  it('should handle network errors normally', async () => {
    const networkError = {
      code: 500,
      type: 'general_unknown',
      message: 'Network error'
    }
    
    account.createEmailPasswordSession.mockRejectedValue(networkError)

    await expect(signInWithEmail({
      email: 'test@example.com',
      password: 'password123'
    })).rejects.toThrow('Failed to sign in')

    expect(account.createEmailPasswordSession).toHaveBeenCalledWith(
      'test@example.com',
      'password123'
    )
  })
})