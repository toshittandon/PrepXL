import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getInterviewQuestion } from '../../services/ai/interviewService.js'
import { createInterviewSession, updateInterviewSession, createInteraction } from '../../services/appwrite/database.js'

// Async thunks for AI service integration
export const fetchNextQuestion = createAsyncThunk(
  'interview/fetchNextQuestion',
  async ({ role, sessionType, history = [], options = {} }, { rejectWithValue }) => {
    try {
      const question = await getInterviewQuestion(role, sessionType, history, options)
      return question
    } catch (error) {
      return rejectWithValue({
        message: error.userMessage || error.message || 'Failed to fetch interview question',
        type: error.type || 'unknown_error',
        retryAfter: error.retryAfter
      })
    }
  }
)

export const createSession = createAsyncThunk(
  'interview/createSession',
  async (sessionData, { rejectWithValue }) => {
    try {
      const session = await createInterviewSession(sessionData)
      return session
    } catch (error) {
      return rejectWithValue({
        message: error.message || 'Failed to create interview session',
        type: error.type || 'database_error'
      })
    }
  }
)

export const updateSession = createAsyncThunk(
  'interview/updateSession',
  async ({ sessionId, updates }, { rejectWithValue }) => {
    try {
      const updatedSession = await updateInterviewSession(sessionId, updates)
      return updatedSession
    } catch (error) {
      return rejectWithValue({
        message: error.message || 'Failed to update interview session',
        type: error.type || 'database_error'
      })
    }
  }
)

export const saveInteraction = createAsyncThunk(
  'interview/saveInteraction',
  async (interactionData, { rejectWithValue }) => {
    try {
      const interaction = await createInteraction(interactionData)
      return interaction
    } catch (error) {
      return rejectWithValue({
        message: error.message || 'Failed to save interaction',
        type: error.type || 'database_error'
      })
    }
  }
)

const initialState = {
  // Session management
  currentSession: null,
  sessionHistory: [],
  
  // Question and interaction management
  currentQuestion: null,
  questionHistory: [],
  interactions: [],
  currentInteractionIndex: 0,
  
  // Speech recognition state
  isRecording: false,
  speechRecognitionSupported: false,
  microphonePermission: null, // null, 'granted', 'denied', 'prompt'
  speechError: null,
  currentTranscript: '',
  finalTranscript: '',
  
  // UI state
  loading: false,
  questionLoading: false,
  savingInteraction: false,
  error: null,
  
  // Interview flow state
  interviewStarted: false,
  interviewPaused: false,
  interviewCompleted: false,
  
  // Settings
  useVoiceInput: true,
  autoAdvanceQuestions: false
}

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    // Session management
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setCurrentSession: (state, action) => {
      state.currentSession = action.payload
      if (action.payload) {
        state.interviewStarted = false
        state.interviewCompleted = false
        state.interviewPaused = false
      }
    },
    addToSessionHistory: (state, action) => {
      const existingIndex = state.sessionHistory.findIndex(
        session => session.$id === action.payload.$id
      )
      if (existingIndex >= 0) {
        state.sessionHistory[existingIndex] = action.payload
      } else {
        state.sessionHistory.unshift(action.payload)
      }
    },
    
    // Question management
    setCurrentQuestion: (state, action) => {
      state.currentQuestion = action.payload
      if (action.payload) {
        state.questionHistory.push(action.payload)
      }
    },
    setQuestionLoading: (state, action) => {
      state.questionLoading = action.payload
    },
    clearCurrentQuestion: (state) => {
      state.currentQuestion = null
    },
    
    // Interaction management
    addInteraction: (state, action) => {
      const interaction = {
        ...action.payload,
        timestamp: new Date().toISOString(),
        order: state.interactions.length + 1
      }
      state.interactions.push(interaction)
      state.currentInteractionIndex = state.interactions.length - 1
    },
    updateCurrentInteraction: (state, action) => {
      if (state.interactions.length > 0) {
        const currentIndex = state.interactions.length - 1
        state.interactions[currentIndex] = {
          ...state.interactions[currentIndex],
          ...action.payload
        }
      }
    },
    setInteractions: (state, action) => {
      state.interactions = action.payload
    },
    setSavingInteraction: (state, action) => {
      state.savingInteraction = action.payload
    },
    
    // Speech recognition management
    setIsRecording: (state, action) => {
      state.isRecording = action.payload
      if (!action.payload) {
        state.currentTranscript = ''
      }
    },
    setSpeechRecognitionSupported: (state, action) => {
      state.speechRecognitionSupported = action.payload
    },
    setMicrophonePermission: (state, action) => {
      state.microphonePermission = action.payload
    },
    setSpeechError: (state, action) => {
      state.speechError = action.payload
    },
    clearSpeechError: (state) => {
      state.speechError = null
    },
    setCurrentTranscript: (state, action) => {
      state.currentTranscript = action.payload
    },
    setFinalTranscript: (state, action) => {
      state.finalTranscript = action.payload
      state.currentTranscript = ''
    },
    clearTranscripts: (state) => {
      state.currentTranscript = ''
      state.finalTranscript = ''
    },
    
    // Interview flow control
    startInterview: (state) => {
      state.interviewStarted = true
      state.interviewPaused = false
      state.interviewCompleted = false
    },
    pauseInterview: (state) => {
      state.interviewPaused = true
      state.isRecording = false
    },
    resumeInterview: (state) => {
      state.interviewPaused = false
    },
    completeInterview: (state) => {
      state.interviewCompleted = true
      state.interviewStarted = false
      state.interviewPaused = false
      state.isRecording = false
      state.currentTranscript = ''
      state.finalTranscript = ''
    },
    
    // Settings
    setUseVoiceInput: (state, action) => {
      state.useVoiceInput = action.payload
      if (!action.payload) {
        state.isRecording = false
        state.currentTranscript = ''
      }
    },
    setAutoAdvanceQuestions: (state, action) => {
      state.autoAdvanceQuestions = action.payload
    },
    
    // Error handling
    setError: (state, action) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    
    // Session cleanup
    endSession: (state) => {
      // Preserve session in history
      if (state.currentSession) {
        const existingIndex = state.sessionHistory.findIndex(
          session => session.$id === state.currentSession.$id
        )
        if (existingIndex >= 0) {
          state.sessionHistory[existingIndex] = state.currentSession
        } else {
          state.sessionHistory.unshift(state.currentSession)
        }
      }
      
      // Reset current session state
      state.currentSession = null
      state.currentQuestion = null
      state.questionHistory = []
      state.interactions = []
      state.currentInteractionIndex = 0
      state.isRecording = false
      state.currentTranscript = ''
      state.finalTranscript = ''
      state.interviewStarted = false
      state.interviewPaused = false
      state.interviewCompleted = false
      state.speechError = null
    },
    
    // Complete reset
    reset: () => initialState
  }
})

export const {
  // Session management
  setLoading,
  setCurrentSession,
  addToSessionHistory,
  
  // Question management
  setCurrentQuestion,
  setQuestionLoading,
  clearCurrentQuestion,
  
  // Interaction management
  addInteraction,
  updateCurrentInteraction,
  setInteractions,
  setSavingInteraction,
  
  // Speech recognition
  setIsRecording,
  setSpeechRecognitionSupported,
  setMicrophonePermission,
  setSpeechError,
  clearSpeechError,
  setCurrentTranscript,
  setFinalTranscript,
  clearTranscripts,
  
  // Interview flow
  startInterview,
  pauseInterview,
  resumeInterview,
  completeInterview,
  
  // Settings
  setUseVoiceInput,
  setAutoAdvanceQuestions,
  
  // Error handling
  setError,
  clearError,
  
  // Cleanup
  endSession,
  reset
} = interviewSlice.actions

// Selectors
export const selectCurrentSession = (state) => state.interview.currentSession
export const selectCurrentQuestion = (state) => state.interview.currentQuestion
export const selectInteractions = (state) => state.interview.interactions
export const selectIsRecording = (state) => state.interview.isRecording
export const selectInterviewStarted = (state) => state.interview.interviewStarted
export const selectInterviewPaused = (state) => state.interview.interviewPaused
export const selectInterviewCompleted = (state) => state.interview.interviewCompleted
export const selectSpeechRecognitionSupported = (state) => state.interview.speechRecognitionSupported
export const selectMicrophonePermission = (state) => state.interview.microphonePermission
export const selectCurrentTranscript = (state) => state.interview.currentTranscript
export const selectFinalTranscript = (state) => state.interview.finalTranscript
export const selectUseVoiceInput = (state) => state.interview.useVoiceInput

export default interviewSlice.reducer