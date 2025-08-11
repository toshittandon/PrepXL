/**
 * Test session conflict error handling in errorHandling utility
 */

import { describe, it, expect } from 'vitest'
import { handleAppwriteError } from '../../utils/errorHandling.js'

describe('Error Handling - Session Conflict', () => {
  it('should handle user_session_already_exists error correctly', () => {
    const sessionConflictError = {
      code: 401,
      type: 'user_session_already_exists',
      message: 'Creation of a session is prohibited when a session is active'
    }

    const result = handleAppwriteError(sessionConflictError, 'Session conflict detected')

    expect(result).toBeInstanceOf(Error)
    expect(result.message).toBe('A session is already active. Attempting to resolve session conflict.')
    expect(result.code).toBe(401)
    expect(result.type).toBe('user_session_already_exists')
    expect(result.originalError).toEqual(sessionConflictError)
  })

  it('should use fallback message when provided for session conflict', () => {
    const sessionConflictError = {
      code: 401,
      type: 'user_session_already_exists',
      message: 'Creation of a session is prohibited when a session is active'
    }

    const result = handleAppwriteError(sessionConflictError, 'Custom session conflict message')

    // Should still use the specific message for user_session_already_exists
    expect(result.message).toBe('A session is already active. Attempting to resolve session conflict.')
  })
})