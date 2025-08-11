import { describe, it, expect } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import interviewSlice, {
  setCurrentSession,
  setCurrentQuestion,
  addInteraction,
  setIsRecording,
  setLoading,
  setError,
  clearError,
  endSession,
  reset,
  selectCurrentSession,
  selectCurrentQuestion,
  selectInteractions,
  selectIsRecording
} from '../../store/slices/interviewSlice.js'

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
  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const store = createTestStore()
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
    it('should set current session', () => {
      const store = createTestStore()
      const session = {
        id: 'session-1',
        userId: 'user-1',
        sessionType: 'Behavioral',
        role: 'Software Engineer',
        status: 'active',
        startedAt: '2024-01-01T10:00:00Z'
      }
      
      store.dispatch(setCurrentSession(session))
      
      const state = store.getState().interview
      expect(state.currentSession).toEqual(session)
    })

    it('should end session and clear data', () => {
      const store = createTestStore({
        currentSession: { id: 'session-1', status: 'active' },
        currentQuestion: 'Test question',
        interactions: [{ id: 'interaction-1' }],
        isRecording: true
      })
      
      store.dispatch(endSession())
      
      const state = store.getState().interview
      expect(state.currentSession).toBe(null)
      expect(state.currentQuestion).toBe(null)
      expect(state.interactions).toEqual([])
      expect(state.isRecording).toBe(false)
    })
  })

  describe('Question Management', () => {
    it('should set current question', () => {
      const store = createTestStore()
      const question = 'Tell me about yourself'
      
      store.dispatch(setCurrentQuestion(question))
      
      const state = store.getState().interview
      expect(state.currentQuestion).toBe(question)
    })

    it('should clear current question', () => {
      const store = createTestStore({
        currentQuestion: 'Previous question'
      })
      
      store.dispatch(setCurrentQuestion(null))
      
      const state = store.getState().interview
      expect(state.currentQuestion).toBe(null)
    })
  })

  describe('Interaction Management', () => {
    it('should add interaction', () => {
      const store = createTestStore()
      const interaction = {
        id: 'interaction-1',
        sessionId: 'session-1',
        questionText: 'Tell me about yourself',
        userAnswerText: 'I am a software engineer...'
      }
      
      store.dispatch(addInteraction(interaction))
      
      const state = store.getState().interview
      expect(state.interactions).toHaveLength(1)
      expect(state.interactions[0].id).toBe('interaction-1')
      expect(state.interactions[0].questionText).toBe('Tell me about yourself')
      expect(state.interactions[0].order).toBe(1) // Auto-generated
      expect(state.interactions[0].timestamp).toBeDefined() // Auto-generated
    })

    it('should add multiple interactions in order', () => {
      const store = createTestStore()
      
      const interaction1 = {
        id: 'interaction-1',
        questionText: 'Question 1',
        userAnswerText: 'Answer 1',
        order: 1
      }
      
      const interaction2 = {
        id: 'interaction-2',
        questionText: 'Question 2',
        userAnswerText: 'Answer 2',
        order: 2
      }
      
      store.dispatch(addInteraction(interaction1))
      store.dispatch(addInteraction(interaction2))
      
      const state = store.getState().interview
      expect(state.interactions).toHaveLength(2)
      expect(state.interactions[0]).toEqual(interaction1)
      expect(state.interactions[1]).toEqual(interaction2)
    })


  })

  describe('Recording State', () => {
    it('should set recording state', () => {
      const store = createTestStore()
      
      store.dispatch(setIsRecording(true))
      expect(store.getState().interview.isRecording).toBe(true)
      
      store.dispatch(setIsRecording(false))
      expect(store.getState().interview.isRecording).toBe(false)
    })
  })

  describe('Loading and Error States', () => {
    it('should set loading state', () => {
      const store = createTestStore()
      
      store.dispatch(setLoading(true))
      expect(store.getState().interview.loading).toBe(true)
      
      store.dispatch(setLoading(false))
      expect(store.getState().interview.loading).toBe(false)
    })

    it('should set error state', () => {
      const store = createTestStore()
      const error = 'Failed to load question'
      
      store.dispatch(setError(error))
      
      const state = store.getState().interview
      expect(state.error).toBe(error)
    })

    it('should clear error when setting loading to true', () => {
      const store = createTestStore({ error: 'Previous error' })
      
      store.dispatch(setLoading(true))
      
      const state = store.getState().interview
      expect(state.error).toBe(null)
      expect(state.loading).toBe(true)
    })
  })

  describe('Reset Interview', () => {
    it('should reset all interview data', () => {
      const store = createTestStore({
        currentSession: { id: 'session-1' },
        currentQuestion: 'Test question',
        interactions: [{ id: 'interaction-1' }],
        isRecording: true,
        error: 'Some error'
      })
      
      store.dispatch(reset())
      
      const state = store.getState().interview
      expect(state.currentSession).toBe(null)
      expect(state.currentQuestion).toBe(null)
      expect(state.interactions).toEqual([])
      expect(state.isRecording).toBe(false)
      expect(state.error).toBe(null)
      expect(state.loading).toBe(false)
    })
  })

  describe('Selectors', () => {
    it('should select current session', () => {
      const session = { id: 'session-1', status: 'active' }
      const store = createTestStore({ currentSession: session })
      
      const state = store.getState()
      expect(selectCurrentSession(state)).toEqual(session)
    })

    it('should select current question', () => {
      const question = 'Test question'
      const store = createTestStore({ currentQuestion: question })
      
      const state = store.getState()
      expect(selectCurrentQuestion(state)).toBe(question)
    })

    it('should select interactions', () => {
      const interactions = [
        { id: 'interaction-1', order: 1 },
        { id: 'interaction-2', order: 2 }
      ]
      const store = createTestStore({ interactions })
      
      const state = store.getState()
      expect(selectInteractions(state)).toEqual(interactions)
    })

    it('should select recording state', () => {
      const store = createTestStore({ isRecording: true })
      
      const state = store.getState()
      expect(selectIsRecording(state)).toBe(true)
    })


  })

  describe('Edge Cases', () => {
    it('should handle duplicate interaction IDs', () => {
      const store = createTestStore()
      
      const interaction1 = { id: 'same-id', questionText: 'Question 1' }
      const interaction2 = { id: 'same-id', questionText: 'Question 2' }
      
      store.dispatch(addInteraction(interaction1))
      store.dispatch(addInteraction(interaction2))
      
      const state = store.getState().interview
      expect(state.interactions).toHaveLength(2) // Should allow duplicates
    })

    it('should handle clearing error', () => {
      const store = createTestStore({ error: 'Some error' })
      
      store.dispatch(clearError())
      
      const state = store.getState().interview
      expect(state.error).toBe(null)
    })

    it('should handle null/undefined values gracefully', () => {
      const store = createTestStore()
      
      store.dispatch(setCurrentSession(null))
      store.dispatch(setCurrentQuestion(undefined))
      store.dispatch(addInteraction(null))
      
      const state = store.getState().interview
      expect(state.currentSession).toBe(null)
      expect(state.currentQuestion).toBe(null)
      expect(state.interactions).toHaveLength(1) // null interaction added
    })
  })
})