import { describe, it, expect, vi, beforeEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import interviewSlice, {
  startSession,
  endSession,
  setCurrentQuestion,
  addInteraction,
  setRecordingState,
  setLoading,
  setError,
  clearError,
  updateSessionScore,
  selectCurrentSession,
  selectCurrentQuestion,
  selectInteractions,
  selectIsRecording,
  selectInterviewLoading,
  selectInterviewError,
  selectSessionDuration
} from '../../../store/slices/interviewSlice.js'

// Mock data
const mockSession = {
  $id: 'session-123',
  userId: 'user-123',
  sessionType: 'Behavioral',
  role: 'Software Engineer',
  status: 'active',
  finalScore: null,
  startedAt: '2024-01-15T10:00:00.000Z',
  completedAt: null
}

const mockCompletedSession = {
  ...mockSession,
  status: 'completed',
  finalScore: 85,
  completedAt: '2024-01-15T11:00:00.000Z'
}

const mockInteraction = {
  $id: 'interaction-123',
  sessionId: 'session-123',
  questionText: 'Tell me about yourself',
  userAnswerText: 'I am a software engineer with 5 years of experience...',
  timestamp: '2024-01-15T10:05:00.000Z',
  order: 1
}

// Helper function to create test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      interview: interviewSlice
    },
    preloadedState: {
      interview: {
        currentSession: null,
        currentQuestion: null,
        interactions: [],
        isRecording: false,
        loading: false,
        error: null,
        ...initialState
      }
    }
  })
}

describe('Interview Slice', () => {
  let store

  beforeEach(() => {
    store = createTestStore()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().interview
      expect(state.currentSession).toBe(null)
      expect(state.currentQuestion).toBe(null)
      expect(state.interactions).toEqual([])
      expect(state.isRecording).toBe(false)
      expect(state.loading).toBe(false)
      expect(state.error).toBe(null)
    })
  })

  describe('Session Management', () => {
    it('should handle startSession', () => {
      store.dispatch(startSession(mockSession))
      
      const state = store.getState().interview
      expect(state.currentSession).toEqual(mockSession)
      expect(state.interactions).toEqual([])
      expect(state.error).toBe(null)
    })

    it('should handle endSession', () => {
      // Start a session first
      store.dispatch(startSession(mockSession))
      
      // End the session
      store.dispatch(endSession(mockCompletedSession))
      
      const state = store.getState().interview
      expect(state.currentSession).toEqual(mockCompletedSession)
      expect(state.isRecording).toBe(false)
    })

    it('should clear interactions when starting new session', () => {
      // Add some interactions
      store.dispatch(startSession(mockSession))
      store.dispatch(addInteraction(mockInteraction))
      
      // Start new session
      const newSession = { ...mockSession, $id: 'session-456' }
      store.dispatch(startSession(newSession))
      
      const state = store.getState().interview
      expect(state.currentSession).toEqual(newSession)
      expect(state.interactions).toEqual([])
    })
  })

  describe('Question Management', () => {
    it('should handle setCurrentQuestion', () => {
      const question = 'What is your greatest strength?'
      
      store.dispatch(setCurrentQuestion(question))
      
      const state = store.getState().interview
      expect(state.currentQuestion).toBe(question)
    })

    it('should clear current question when null is passed', () => {
      // Set a question first
      store.dispatch(setCurrentQuestion('Test question'))
      expect(store.getState().interview.currentQuestion).toBe('Test question')
      
      // Clear it
      store.dispatch(setCurrentQuestion(null))
      expect(store.getState().interview.currentQuestion).toBe(null)
    })
  })

  describe('Interaction Management', () => {
    it('should handle addInteraction', () => {
      store.dispatch(addInteraction(mockInteraction))
      
      const state = store.getState().interview
      expect(state.interactions).toHaveLength(1)
      expect(state.interactions[0]).toEqual(mockInteraction)
    })

    it('should add multiple interactions in order', () => {
      const interaction1 = { ...mockInteraction, order: 1 }
      const interaction2 = { ...mockInteraction, $id: 'interaction-456', order: 2 }
      
      store.dispatch(addInteraction(interaction1))
      store.dispatch(addInteraction(interaction2))
      
      const state = store.getState().interview
      expect(state.interactions).toHaveLength(2)
      expect(state.interactions[0]).toEqual(interaction1)
      expect(state.interactions[1]).toEqual(interaction2)
    })

    it('should handle interactions with same order', () => {
      const interaction1 = { ...mockInteraction, $id: 'interaction-1', order: 1 }
      const interaction2 = { ...mockInteraction, $id: 'interaction-2', order: 1 }
      
      store.dispatch(addInteraction(interaction1))
      store.dispatch(addInteraction(interaction2))
      
      const state = store.getState().interview
      expect(state.interactions).toHaveLength(2)
    })
  })

  describe('Recording State', () => {
    it('should handle setRecordingState', () => {
      expect(store.getState().interview.isRecording).toBe(false)
      
      store.dispatch(setRecordingState(true))
      expect(store.getState().interview.isRecording).toBe(true)
      
      store.dispatch(setRecordingState(false))
      expect(store.getState().interview.isRecording).toBe(false)
    })
  })

  describe('Loading and Error States', () => {
    it('should handle setLoading', () => {
      expect(store.getState().interview.loading).toBe(false)
      
      store.dispatch(setLoading(true))
      expect(store.getState().interview.loading).toBe(true)
      
      store.dispatch(setLoading(false))
      expect(store.getState().interview.loading).toBe(false)
    })

    it('should handle setError', () => {
      const errorMessage = 'Failed to start interview'
      
      store.dispatch(setError(errorMessage))
      
      const state = store.getState().interview
      expect(state.error).toBe(errorMessage)
    })

    it('should handle clearError', () => {
      // Set an error first
      store.dispatch(setError('Some error'))
      expect(store.getState().interview.error).toBe('Some error')
      
      // Clear the error
      store.dispatch(clearError())
      expect(store.getState().interview.error).toBe(null)
    })
  })

  describe('Session Score Update', () => {
    it('should handle updateSessionScore', () => {
      // Start a session first
      store.dispatch(startSession(mockSession))
      
      const newScore = 92
      store.dispatch(updateSessionScore(newScore))
      
      const state = store.getState().interview
      expect(state.currentSession.finalScore).toBe(newScore)
    })

    it('should not update score when no current session', () => {
      store.dispatch(updateSessionScore(85))
      
      const state = store.getState().interview
      expect(state.currentSession).toBe(null)
    })
  })

  describe('Selectors', () => {
    beforeEach(() => {
      store.dispatch(startSession(mockSession))
      store.dispatch(setCurrentQuestion('Test question'))
      store.dispatch(addInteraction(mockInteraction))
      store.dispatch(setRecordingState(true))
      store.dispatch(setLoading(true))
      store.dispatch(setError('Test error'))
    })

    it('should select current session', () => {
      const state = store.getState()
      const currentSession = selectCurrentSession(state)
      
      expect(currentSession).toEqual(mockSession)
    })

    it('should select current question', () => {
      const state = store.getState()
      const currentQuestion = selectCurrentQuestion(state)
      
      expect(currentQuestion).toBe('Test question')
    })

    it('should select interactions', () => {
      const state = store.getState()
      const interactions = selectInteractions(state)
      
      expect(interactions).toHaveLength(1)
      expect(interactions[0]).toEqual(mockInteraction)
    })

    it('should select recording state', () => {
      const state = store.getState()
      const isRecording = selectIsRecording(state)
      
      expect(isRecording).toBe(true)
    })

    it('should select loading state', () => {
      const state = store.getState()
      const loading = selectInterviewLoading(state)
      
      expect(loading).toBe(true)
    })

    it('should select error state', () => {
      const state = store.getState()
      const error = selectInterviewError(state)
      
      expect(error).toBe('Test error')
    })
  })

  describe('Session Duration Selector', () => {
    it('should calculate session duration for active session', () => {
      const sessionWithStart = {
        ...mockSession,
        startedAt: '2024-01-15T10:00:00.000Z'
      }
      
      store.dispatch(startSession(sessionWithStart))
      
      // Mock current time
      const mockNow = new Date('2024-01-15T10:30:00.000Z')
      vi.spyOn(Date, 'now').mockReturnValue(mockNow.getTime())
      
      const state = store.getState()
      const duration = selectSessionDuration(state)
      
      expect(duration).toBe(30 * 60 * 1000) // 30 minutes in milliseconds
      
      vi.restoreAllMocks()
    })

    it('should calculate session duration for completed session', () => {
      const completedSession = {
        ...mockSession,
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:45:00.000Z'
      }
      
      store.dispatch(startSession(completedSession))
      
      const state = store.getState()
      const duration = selectSessionDuration(state)
      
      expect(duration).toBe(45 * 60 * 1000) // 45 minutes in milliseconds
    })

    it('should return 0 when no current session', () => {
      const state = store.getState()
      const duration = selectSessionDuration(state)
      
      expect(duration).toBe(0)
    })

    it('should return 0 when session has no start time', () => {
      const sessionWithoutStart = {
        ...mockSession,
        startedAt: null
      }
      
      store.dispatch(startSession(sessionWithoutStart))
      
      const state = store.getState()
      const duration = selectSessionDuration(state)
      
      expect(duration).toBe(0)
    })
  })

  describe('Complex Workflows', () => {
    it('should handle complete interview workflow', () => {
      // Start session
      store.dispatch(startSession(mockSession))
      expect(store.getState().interview.currentSession).toEqual(mockSession)
      
      // Set first question
      store.dispatch(setCurrentQuestion('Tell me about yourself'))
      expect(store.getState().interview.currentQuestion).toBe('Tell me about yourself')
      
      // Start recording
      store.dispatch(setRecordingState(true))
      expect(store.getState().interview.isRecording).toBe(true)
      
      // Add interaction
      store.dispatch(addInteraction(mockInteraction))
      expect(store.getState().interview.interactions).toHaveLength(1)
      
      // Stop recording
      store.dispatch(setRecordingState(false))
      expect(store.getState().interview.isRecording).toBe(false)
      
      // Set next question
      store.dispatch(setCurrentQuestion('What is your greatest strength?'))
      expect(store.getState().interview.currentQuestion).toBe('What is your greatest strength?')
      
      // Update score
      store.dispatch(updateSessionScore(88))
      expect(store.getState().interview.currentSession.finalScore).toBe(88)
      
      // End session
      store.dispatch(endSession(mockCompletedSession))
      expect(store.getState().interview.currentSession.status).toBe('completed')
    })

    it('should handle error recovery', () => {
      // Start session
      store.dispatch(startSession(mockSession))
      
      // Encounter error
      store.dispatch(setError('Network error'))
      expect(store.getState().interview.error).toBe('Network error')
      
      // Clear error and continue
      store.dispatch(clearError())
      expect(store.getState().interview.error).toBe(null)
      
      // Session should still be active
      expect(store.getState().interview.currentSession).toEqual(mockSession)
    })
  })
})