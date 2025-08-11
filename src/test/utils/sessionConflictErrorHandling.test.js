/**
 * Test enhanced session conflict error handling functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  SESSION_CONFLICT_TYPES,
  getSessionConflictMessage,
  logSessionConflictError,
  createSessionConflictError,
  getSessionConflictUserMessage,
  getSessionConflictSuggestion,
  createSessionConflictNotification
} from '../../utils/errorHandling.js'

// Mock console methods
const originalConsole = console
beforeEach(() => {
  console.error = vi.fn()
  console.warn = vi.fn()
  console.info = vi.fn()
})

afterEach(() => {
  console.error = originalConsole.error
  console.warn = originalConsole.warn
  console.info = originalConsole.info
})

describe('Session Conflict Error Handling', () => {
  describe('getSessionConflictMessage', () => {
    it('should return correct message for existing session conflict', () => {
      const result = getSessionConflictMessage(SESSION_CONFLICT_TYPES.EXISTING_SESSION)
      
      expect(result.title).toBe('Session Conflict Detected')
      expect(result.userMessage).toBe('Resolving session conflict...')
      expect(result.recoverable).toBe(true)
      expect(result.severity).toBe('MEDIUM')
    })

    it('should return correct message for resolution success', () => {
      const result = getSessionConflictMessage(SESSION_CONFLICT_TYPES.RESOLUTION_SUCCESS)
      
      expect(result.title).toBe('Session Resolved')
      expect(result.userMessage).toBe('You have been logged in successfully.')
      expect(result.recoverable).toBe(true)
      expect(result.severity).toBe('LOW')
    })

    it('should return correct message for all sessions clear failed', () => {
      const result = getSessionConflictMessage(SESSION_CONFLICT_TYPES.ALL_SESSIONS_CLEAR_FAILED)
      
      expect(result.title).toBe('Session Resolution Failed')
      expect(result.recoverable).toBe(false)
      expect(result.severity).toBe('HIGH')
    })
  })

  describe('logSessionConflictError', () => {
    it('should log high severity errors to console.error', () => {
      const error = new Error('Test error')
      const context = { test: 'context' }
      
      logSessionConflictError(SESSION_CONFLICT_TYPES.ALL_SESSIONS_CLEAR_FAILED, error, context)
      
      expect(console.error).toHaveBeenCalledWith('Session Conflict Error:', expect.objectContaining({
        type: 'SESSION_CONFLICT',
        conflictType: SESSION_CONFLICT_TYPES.ALL_SESSIONS_CLEAR_FAILED,
        severity: 'HIGH'
      }))
    })

    it('should log medium severity errors to console.warn', () => {
      const error = new Error('Test error')
      
      logSessionConflictError(SESSION_CONFLICT_TYPES.EXISTING_SESSION, error)
      
      expect(console.warn).toHaveBeenCalledWith('Session Conflict Warning:', expect.objectContaining({
        type: 'SESSION_CONFLICT',
        conflictType: SESSION_CONFLICT_TYPES.EXISTING_SESSION,
        severity: 'MEDIUM'
      }))
    })

    it('should log low severity errors to console.info', () => {
      const error = new Error('Test error')
      
      logSessionConflictError(SESSION_CONFLICT_TYPES.RESOLUTION_SUCCESS, error)
      
      expect(console.info).toHaveBeenCalledWith('Session Conflict Info:', expect.objectContaining({
        type: 'SESSION_CONFLICT',
        conflictType: SESSION_CONFLICT_TYPES.RESOLUTION_SUCCESS,
        severity: 'LOW'
      }))
    })
  })

  describe('createSessionConflictError', () => {
    it('should create enhanced error object with session conflict properties', () => {
      const originalError = new Error('Original error')
      const context = { test: 'context' }
      
      const result = createSessionConflictError(
        SESSION_CONFLICT_TYPES.EXISTING_SESSION, 
        originalError, 
        context
      )
      
      expect(result).toBeInstanceOf(Error)
      expect(result.type).toBe('SESSION_CONFLICT')
      expect(result.conflictType).toBe(SESSION_CONFLICT_TYPES.EXISTING_SESSION)
      expect(result.isSessionConflict).toBe(true)
      expect(result.originalError).toBe(originalError)
      expect(result.context).toBe(context)
      expect(result.recoverable).toBe(true)
    })
  })

  describe('getSessionConflictUserMessage', () => {
    it('should return user-friendly message for session conflict error', () => {
      const error = createSessionConflictError(SESSION_CONFLICT_TYPES.EXISTING_SESSION)
      
      const result = getSessionConflictUserMessage(error)
      
      expect(result.title).toBe('Session Conflict Detected')
      expect(result.type).toBe('SESSION_CONFLICT')
      expect(result.recoverable).toBe(true)
    })

    it('should handle non-session-conflict errors normally', () => {
      const error = new Error('Regular error')
      
      const result = getSessionConflictUserMessage(error)
      
      expect(result.type).toBe('UNKNOWN')
    })
  })

  describe('getSessionConflictSuggestion', () => {
    it('should return appropriate suggestions for different conflict types', () => {
      expect(getSessionConflictSuggestion(SESSION_CONFLICT_TYPES.EXISTING_SESSION))
        .toBe('We\'re automatically resolving this for you.')
      
      expect(getSessionConflictSuggestion(SESSION_CONFLICT_TYPES.ALL_SESSIONS_CLEAR_FAILED))
        .toBe('Please try manually clearing all sessions or contact support.')
      
      expect(getSessionConflictSuggestion(SESSION_CONFLICT_TYPES.RESOLUTION_SUCCESS))
        .toBe('Session conflict resolved successfully.')
    })
  })

  describe('createSessionConflictNotification', () => {
    it('should create notification for recoverable session conflicts', () => {
      const result = createSessionConflictNotification(SESSION_CONFLICT_TYPES.EXISTING_SESSION)
      
      expect(result.type).toBe('info')
      expect(result.title).toBe('Session Conflict Detected')
      expect(result.duration).toBe(5000)
      expect(result.persistent).toBe(false)
    })

    it('should create error notification for non-recoverable conflicts', () => {
      const result = createSessionConflictNotification(SESSION_CONFLICT_TYPES.ALL_SESSIONS_CLEAR_FAILED)
      
      expect(result.type).toBe('error')
      expect(result.duration).toBe(null)
      expect(result.persistent).toBe(true)
    })

    it('should include manual clear action for failed resolution', () => {
      const manualClearAction = vi.fn()
      const result = createSessionConflictNotification(
        SESSION_CONFLICT_TYPES.ALL_SESSIONS_CLEAR_FAILED,
        { manualClearAction }
      )
      
      expect(result.actions).toHaveLength(1)
      expect(result.actions[0].label).toBe('Clear All Sessions')
      expect(result.actions[0].handler).toBe(manualClearAction)
    })
  })
})