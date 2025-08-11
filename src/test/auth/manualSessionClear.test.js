import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the client module first
vi.mock('../../services/appwrite/client.js', () => ({
  account: {
    deleteSessions: vi.fn()
  }
}))

// Mock the error handling utilities
vi.mock('../../utils/errorHandling.js', () => ({
  handleAppwriteError: vi.fn((error, message) => {
    const err = new Error(message)
    err.originalError = error
    return err
  }),
  logSessionConflictError: vi.fn(),
  SESSION_CONFLICT_TYPES: {
    RESOLUTION_IN_PROGRESS: 'RESOLUTION_IN_PROGRESS',
    RESOLUTION_SUCCESS: 'RESOLUTION_SUCCESS',
    ALL_SESSIONS_CLEAR_FAILED: 'ALL_SESSIONS_CLEAR_FAILED'
  },
  createSessionConflictError: vi.fn((type, error, context) => {
    const err = new Error('Session conflict error')
    err.conflictType = type
    err.originalError = error
    err.context = context
    return err
  })
}))

// Mock the Redux auth slice
vi.mock('../../store/slices/authSlice.js', () => ({
  sessionConflictStart: vi.fn((payload) => ({ type: 'sessionConflictStart', payload })),
  sessionConflictResolved: vi.fn((payload) => ({ type: 'sessionConflictResolved', payload })),
  sessionConflictFailed: vi.fn(() => ({ type: 'sessionConflictFailed' })),
  logout: vi.fn(() => ({ type: 'logout' }))
}))

// Import the function after mocking
import { manualSessionClear } from '../../services/appwrite/auth.js'
import { account } from '../../services/appwrite/client.js'

describe('manualSessionClear', () => {
  let mockDispatch
  let mockOnConfirm
  let mockOnSuccess
  let mockOnError

  beforeEach(() => {
    mockDispatch = vi.fn()
    mockOnConfirm = vi.fn()
    mockOnSuccess = vi.fn()
    mockOnError = vi.fn()
    
    // Reset all mocks
    vi.clearAllMocks()
    
    // Mock window.confirm for browser confirmation
    global.window = { confirm: vi.fn() }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('successful session clearing', () => {
    it('should clear all sessions successfully with confirmation', async () => {
      // Setup
      account.deleteSessions.mockResolvedValue()
      mockOnConfirm.mockResolvedValue(true)

      // Execute
      const result = await manualSessionClear({
        dispatch: mockDispatch,
        onConfirm: mockOnConfirm,
        onSuccess: mockOnSuccess,
        requireConfirmation: true
      })

      // Verify
      expect(mockOnConfirm).toHaveBeenCalledWith(
        expect.stringContaining('This will sign you out from all devices')
      )
      expect(account.deleteSessions).toHaveBeenCalled()
      expect(mockDispatch).toHaveBeenCalledTimes(3) // sessionConflictStart, sessionConflictResolved, and logout
      expect(mockOnSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'All sessions cleared successfully'
        })
      )
      expect(result.success).toBe(true)
      expect(result.cancelled).toBe(false)
    })

    it('should clear all sessions successfully without confirmation', async () => {
      // Setup
      account.deleteSessions.mockResolvedValue()

      // Execute
      const result = await manualSessionClear({
        dispatch: mockDispatch,
        onSuccess: mockOnSuccess,
        requireConfirmation: false
      })

      // Verify
      expect(mockOnConfirm).not.toHaveBeenCalled()
      expect(account.deleteSessions).toHaveBeenCalled()
      expect(mockOnSuccess).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })

    it('should work without dispatch function', async () => {
      // Setup
      account.deleteSessions.mockResolvedValue()

      // Execute
      const result = await manualSessionClear({
        requireConfirmation: false
      })

      // Verify
      expect(account.deleteSessions).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })
  })

  describe('user cancellation', () => {
    it('should return cancelled result when user cancels confirmation', async () => {
      // Setup
      mockOnConfirm.mockResolvedValue(false)

      // Execute
      const result = await manualSessionClear({
        onConfirm: mockOnConfirm,
        requireConfirmation: true
      })

      // Verify
      expect(mockOnConfirm).toHaveBeenCalled()
      expect(account.deleteSessions).not.toHaveBeenCalled()
      expect(result.success).toBe(false)
      expect(result.cancelled).toBe(true)
      expect(result.message).toContain('cancelled')
    })

    it('should use browser confirm as fallback', async () => {
      // Setup
      global.window.confirm.mockReturnValue(false)

      // Execute
      const result = await manualSessionClear({
        requireConfirmation: true
      })

      // Verify
      expect(global.window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('This will sign you out from all devices')
      )
      expect(result.cancelled).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should handle session clearing errors gracefully', async () => {
      // Setup
      const mockError = new Error('Network error')
      account.deleteSessions.mockRejectedValue(mockError)
      mockOnConfirm.mockResolvedValue(true)

      // Execute
      const result = await manualSessionClear({
        onConfirm: mockOnConfirm,
        onError: mockOnError,
        requireConfirmation: true
      })

      // Verify
      expect(account.deleteSessions).toHaveBeenCalled()
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String)
        })
      )
      expect(result.success).toBe(false)
      expect(result.cancelled).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should dispatch failure action on error', async () => {
      // Setup
      const mockError = new Error('Network error')
      account.deleteSessions.mockRejectedValue(mockError)

      // Execute
      await manualSessionClear({
        dispatch: mockDispatch,
        requireConfirmation: false
      })

      // Verify
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'sessionConflictFailed' })
      )
    })
  })

  describe('callback handling', () => {
    it('should call all provided callbacks in correct order', async () => {
      // Setup
      account.deleteSessions.mockResolvedValue()
      mockOnConfirm.mockResolvedValue(true)

      // Execute
      await manualSessionClear({
        dispatch: mockDispatch,
        onConfirm: mockOnConfirm,
        onSuccess: mockOnSuccess,
        requireConfirmation: true
      })

      // Verify call order
      expect(mockOnConfirm).toHaveBeenCalledBefore(account.deleteSessions)
      expect(account.deleteSessions).toHaveBeenCalledBefore(mockOnSuccess)
    })

    it('should handle async callbacks properly', async () => {
      // Setup
      account.deleteSessions.mockResolvedValue()
      mockOnConfirm.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(true), 10))
      )
      mockOnSuccess.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(), 10))
      )

      // Execute
      const result = await manualSessionClear({
        onConfirm: mockOnConfirm,
        onSuccess: mockOnSuccess,
        requireConfirmation: true
      })

      // Verify
      expect(result.success).toBe(true)
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle missing window object gracefully', async () => {
      // Setup
      const originalWindow = global.window
      delete global.window
      account.deleteSessions.mockResolvedValue()

      // Execute
      const result = await manualSessionClear({
        requireConfirmation: true
      })

      // Verify - should assume confirmed when no confirmation method available
      expect(result.success).toBe(true)

      // Cleanup
      global.window = originalWindow
    })

    it('should handle null/undefined callbacks gracefully', async () => {
      // Setup
      account.deleteSessions.mockResolvedValue()

      // Execute
      const result = await manualSessionClear({
        onConfirm: null,
        onSuccess: undefined,
        onError: null,
        requireConfirmation: false
      })

      // Verify
      expect(result.success).toBe(true)
    })
  })
})