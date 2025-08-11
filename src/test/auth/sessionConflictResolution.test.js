/**
 * Tests for session conflict resolution handlers
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

// Mock error handling
vi.mock('../../utils/errorHandling.js', () => ({
  handleAppwriteError: vi.fn((error, message) => {
    const err = new Error(message)
    err.originalError = error
    return err
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

// Mock env config
vi.mock('../../utils/envConfig.js', () => ({
  getConfig: vi.fn(() => ({}))
}))

import { signInWithEmail } from '../../services/appwrite/auth.js'
import { account } from '../../services/appwrite/client.js'

describe('Session Conflict Resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully login on first attempt when no session conflict', async () => {
    const mockSession = { $id: 'session123', userId: 'user123' }
    account.createEmailPasswordSession.mockResolvedValueOnce(mockSession)

    const result = await signInWithEmail({ email: 'test@example.com', password: 'password123' })

    expect(result).toEqual(mockSession)
    expect(account.createEmailPasswordSession).toHaveBeenCalledTimes(1)
    expect(account.deleteSession).not.toHaveBeenCalled()
    expect(account.deleteSessions).not.toHaveBeenCalled()
  })

  it('should handle session conflict by clearing current session and retrying', async () => {
    const mockSession = { $id: 'session123', userId: 'user123' }
    const sessionConflictError = {
      code: 401,
      type: 'user_session_already_exists',
      message: 'Session already exists'
    }

    // First call fails with session conflict, second call succeeds
    account.createEmailPasswordSession
      .mockRejectedValueOnce(sessionConflictError)
      .mockResolvedValueOnce(mockSession)
    
    account.deleteSession.mockResolvedValueOnce()

    const result = await signInWithEmail({ email: 'test@example.com', password: 'password123' })

    expect(result).toEqual(mockSession)
    expect(account.createEmailPasswordSession).toHaveBeenCalledTimes(2)
    expect(account.deleteSession).toHaveBeenCalledWith('current')
    expect(account.deleteSessions).not.toHaveBeenCalled()
  })

  it('should fallback to clearing all sessions when current session clear fails', async () => {
    const mockSession = { $id: 'session123', userId: 'user123' }
    const sessionConflictError = {
      code: 401,
      type: 'user_session_already_exists',
      message: 'Session already exists'
    }
    const clearCurrentError = {
      code: 401,
      message: 'Cannot clear current session'
    }

    // First call fails with session conflict
    // Second call (after clearing current) fails
    // Third call (after clearing all) succeeds
    account.createEmailPasswordSession
      .mockRejectedValueOnce(sessionConflictError)
      .mockResolvedValueOnce(mockSession)
    
    account.deleteSession.mockRejectedValueOnce(clearCurrentError)
    account.deleteSessions.mockResolvedValueOnce()

    const result = await signInWithEmail({ email: 'test@example.com', password: 'password123' })

    expect(result).toEqual(mockSession)
    expect(account.createEmailPasswordSession).toHaveBeenCalledTimes(2)
    expect(account.deleteSession).toHaveBeenCalledWith('current')
    expect(account.deleteSessions).toHaveBeenCalledTimes(1)
  })

  it('should throw error when all session clearing attempts fail', async () => {
    const sessionConflictError = {
      code: 401,
      type: 'user_session_already_exists',
      message: 'Session already exists'
    }
    const clearCurrentError = {
      code: 401,
      message: 'Cannot clear current session'
    }
    const clearAllError = {
      code: 500,
      message: 'Cannot clear all sessions'
    }

    account.createEmailPasswordSession.mockRejectedValueOnce(sessionConflictError)
    account.deleteSession.mockRejectedValueOnce(clearCurrentError)
    account.deleteSessions.mockRejectedValueOnce(clearAllError)

    await expect(signInWithEmail({ email: 'test@example.com', password: 'password123' }))
      .rejects.toThrow('Failed to resolve session conflict')

    expect(account.createEmailPasswordSession).toHaveBeenCalledTimes(1)
    expect(account.deleteSession).toHaveBeenCalledWith('current')
    expect(account.deleteSessions).toHaveBeenCalledTimes(1)
  })

  it('should throw error for non-session-conflict authentication errors', async () => {
    const authError = {
      code: 401,
      type: 'user_invalid_credentials',
      message: 'Invalid credentials'
    }

    account.createEmailPasswordSession.mockRejectedValueOnce(authError)

    await expect(signInWithEmail({ email: 'test@example.com', password: 'wrongpassword' }))
      .rejects.toThrow('Failed to sign in')

    expect(account.createEmailPasswordSession).toHaveBeenCalledTimes(1)
    expect(account.deleteSession).not.toHaveBeenCalled()
    expect(account.deleteSessions).not.toHaveBeenCalled()
  })
})