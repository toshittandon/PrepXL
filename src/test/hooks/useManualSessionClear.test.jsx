import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'

// Mock the auth service
vi.mock('../../services/appwrite/auth.js', () => ({
  manualSessionClear: vi.fn()
}))

// Import after mocking
import { useManualSessionClear, useSessionClear } from '../../hooks/useManualSessionClear.js'
import { manualSessionClear as mockManualSessionClear } from '../../services/appwrite/auth.js'

// Create a mock Redux store
const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: (state = { user: null, session: null }, action) => state
    }
  })
}

// Wrapper component for Redux Provider
const createWrapper = (store) => {
  return ({ children }) => (
    <Provider store={store}>{children}</Provider>
  )
}

describe('useManualSessionClear', () => {
  let mockStore

  beforeEach(() => {
    mockStore = createMockStore()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useManualSessionClear(), {
        wrapper: createWrapper(mockStore)
      })

      expect(result.current.isConfirmationOpen).toBe(false)
      expect(result.current.isClearing).toBe(false)
      expect(result.current.result).toBe(null)
      expect(result.current.hasError).toBe(false)
      expect(result.current.hasSuccess).toBe(false)
      expect(result.current.isProcessing).toBe(false)
    })
  })

  describe('confirmation dialog management', () => {
    it('should show and hide confirmation dialog', () => {
      const { result } = renderHook(() => useManualSessionClear(), {
        wrapper: createWrapper(mockStore)
      })

      // Show confirmation
      act(() => {
        result.current.showConfirmation()
      })

      expect(result.current.isConfirmationOpen).toBe(true)

      // Hide confirmation
      act(() => {
        result.current.hideConfirmation()
      })

      expect(result.current.isConfirmationOpen).toBe(false)
    })

    it('should not hide confirmation when clearing is in progress', () => {
      const { result } = renderHook(() => useManualSessionClear(), {
        wrapper: createWrapper(mockStore)
      })

      // Show confirmation and start clearing
      act(() => {
        result.current.showConfirmation()
      })

      // Simulate clearing in progress
      mockManualSessionClear.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      )

      act(() => {
        result.current.clearAllSessions()
      })

      // Try to hide confirmation while clearing
      act(() => {
        result.current.hideConfirmation()
      })

      expect(result.current.isConfirmationOpen).toBe(true)
      expect(result.current.isClearing).toBe(true)
    })
  })

  describe('session clearing', () => {
    it('should clear sessions successfully', async () => {
      const mockResult = {
        success: true,
        userMessage: 'Sessions cleared successfully'
      }
      mockManualSessionClear.mockResolvedValue(mockResult)

      const { result } = renderHook(() => useManualSessionClear(), {
        wrapper: createWrapper(mockStore)
      })

      let clearResult
      await act(async () => {
        clearResult = await result.current.clearAllSessions()
      })

      expect(mockManualSessionClear).toHaveBeenCalledWith({
        dispatch: expect.any(Function),
        requireConfirmation: false,
        onSuccess: expect.any(Function),
        onError: expect.any(Function)
      })
      expect(clearResult).toEqual(mockResult)
      expect(result.current.isClearing).toBe(false)
      expect(result.current.isConfirmationOpen).toBe(false)
    })

    it('should handle clearing errors', async () => {
      const mockError = {
        success: false,
        userMessage: 'Failed to clear sessions'
      }
      mockManualSessionClear.mockResolvedValue(mockError)

      const { result } = renderHook(() => useManualSessionClear(), {
        wrapper: createWrapper(mockStore)
      })

      // First open the confirmation dialog
      act(() => {
        result.current.showConfirmation()
      })

      await act(async () => {
        await result.current.clearAllSessions()
      })

      expect(result.current.isConfirmationOpen).toBe(true) // Should stay open on error
    })

    it('should handle unexpected errors', async () => {
      mockManualSessionClear.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useManualSessionClear(), {
        wrapper: createWrapper(mockStore)
      })

      let clearResult
      await act(async () => {
        clearResult = await result.current.clearAllSessions()
      })

      expect(clearResult.success).toBe(false)
      expect(result.current.hasError).toBe(true)
      expect(result.current.result.message).toContain('unexpected error')
    })
  })

  describe('state management', () => {
    it('should clear result state', () => {
      const { result } = renderHook(() => useManualSessionClear(), {
        wrapper: createWrapper(mockStore)
      })

      // Set some result
      act(() => {
        result.current.showConfirmation()
      })

      // Clear result
      act(() => {
        result.current.clearResult()
      })

      expect(result.current.result).toBe(null)
    })

    it('should reset all state', () => {
      const { result } = renderHook(() => useManualSessionClear(), {
        wrapper: createWrapper(mockStore)
      })

      // Set some state
      act(() => {
        result.current.showConfirmation()
      })

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.isConfirmationOpen).toBe(false)
      expect(result.current.isClearing).toBe(false)
      expect(result.current.result).toBe(null)
    })
  })
})

describe('useSessionClear', () => {
  let mockStore

  beforeEach(() => {
    mockStore = createMockStore()
    vi.clearAllMocks()
  })

  describe('programmatic session clearing', () => {
    it('should clear sessions programmatically', async () => {
      const mockResult = { success: true }
      mockManualSessionClear.mockResolvedValue(mockResult)

      const { result } = renderHook(() => useSessionClear(), {
        wrapper: createWrapper(mockStore)
      })

      let clearResult
      await act(async () => {
        clearResult = await result.current.clearSessions()
      })

      expect(mockManualSessionClear).toHaveBeenCalledWith({
        dispatch: expect.any(Function),
        requireConfirmation: false
      })
      expect(clearResult).toEqual(mockResult)
      expect(result.current.lastResult).toEqual(mockResult)
    })

    it('should pass custom options', async () => {
      const mockResult = { success: true }
      mockManualSessionClear.mockResolvedValue(mockResult)

      const { result } = renderHook(() => useSessionClear(), {
        wrapper: createWrapper(mockStore)
      })

      const customOptions = {
        onSuccess: vi.fn(),
        onError: vi.fn()
      }

      await act(async () => {
        await result.current.clearSessions(customOptions)
      })

      expect(mockManualSessionClear).toHaveBeenCalledWith({
        dispatch: expect.any(Function),
        requireConfirmation: false,
        ...customOptions
      })
    })

    it('should handle errors gracefully', async () => {
      mockManualSessionClear.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useSessionClear(), {
        wrapper: createWrapper(mockStore)
      })

      let clearResult
      await act(async () => {
        clearResult = await result.current.clearSessions()
      })

      expect(clearResult.success).toBe(false)
      expect(clearResult.error).toBeInstanceOf(Error)
      expect(result.current.lastResult.success).toBe(false)
    })

    it('should clear result state', () => {
      const { result } = renderHook(() => useSessionClear(), {
        wrapper: createWrapper(mockStore)
      })

      // Set some result
      act(() => {
        result.current.clearResult()
      })

      expect(result.current.lastResult).toBe(null)
    })
  })
})