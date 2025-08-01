import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { databaseService } from '../../services/appwrite/database.js';
import { interviewService } from '../../services/ai/interviewService.js';

// Async thunks for interview operations
export const createInterviewSession = createAsyncThunk(
  'interview/createSession',
  async (sessionData, { rejectWithValue }) => {
    try {
      const result = await databaseService.createInterviewSession(sessionData);
      if (result.success) {
        return result.data;
      } else {
        return rejectWithValue(result.error || 'Failed to create session');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchInterviewQuestion = createAsyncThunk(
  'interview/fetchQuestion',
  async (params, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const interactions = state.interview.interactions;
      
      const questionParams = {
        ...params,
        history: interactions
      };
      
      const result = await interviewService.getInterviewQuestion(questionParams);
      if (result.success) {
        return result.data.questionText;
      } else {
        return rejectWithValue(result.error || 'Failed to fetch question');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const saveInteraction = createAsyncThunk(
  'interview/saveInteraction',
  async (interactionData, { rejectWithValue }) => {
    try {
      const result = await databaseService.createInteraction(interactionData);
      if (result.success) {
        return result.data;
      } else {
        return rejectWithValue(result.error || 'Failed to save interaction');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateInterviewSession = createAsyncThunk(
  'interview/updateSession',
  async ({ sessionId, updates }, { rejectWithValue }) => {
    try {
      const result = await databaseService.updateInterviewSession(sessionId, updates);
      if (result.success) {
        return result.data;
      } else {
        return rejectWithValue(result.error || 'Failed to update session');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const calculateFinalScore = createAsyncThunk(
  'interview/calculateScore',
  async (interactions, { rejectWithValue }) => {
    try {
      const result = await interviewService.calculateInterviewScore(interactions);
      if (result.success) {
        return result.data;
      } else {
        return rejectWithValue(result.error || 'Failed to calculate score');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchSessionHistory = createAsyncThunk(
  'interview/fetchHistory',
  async (userId, { rejectWithValue }) => {
    try {
      const result = await databaseService.getUserInterviewSessions(userId);
      if (result.success) {
        return result.data;
      } else {
        return rejectWithValue(result.error || 'Failed to fetch session history');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchSessionInteractions = createAsyncThunk(
  'interview/fetchInteractions',
  async (sessionId, { rejectWithValue }) => {
    try {
      const result = await databaseService.getSessionInteractions(sessionId);
      if (result.success) {
        return result.data;
      } else {
        return rejectWithValue(result.error || 'Failed to fetch interactions');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  currentSession: null,
  currentQuestion: null,
  interactions: [],
  isRecording: false,
  loading: false,
  error: null,
  sessionHistory: [],
  speechRecognitionSupported: false,
  questionLoading: false,
  savingInteraction: false,
  calculatingScore: false,
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    // Set loading state
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    
    // Set error state
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Start new interview session
    startSession: (state, action) => {
      state.currentSession = action.payload;
      state.interactions = [];
      state.currentQuestion = null;
      state.loading = false;
      state.error = null;
    },
    
    // End current session
    endSession: (state) => {
      if (state.currentSession) {
        state.sessionHistory.push({
          ...state.currentSession,
          interactions: [...state.interactions],
        });
      }
      state.currentSession = null;
      state.currentQuestion = null;
      state.interactions = [];
      state.isRecording = false;
    },
    
    // Set current question
    setCurrentQuestion: (state, action) => {
      state.currentQuestion = action.payload;
    },
    
    // Add interaction
    addInteraction: (state, action) => {
      state.interactions.push(action.payload);
    },
    
    // Update interaction
    updateInteraction: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.interactions.findIndex(interaction => interaction.id === id);
      if (index !== -1) {
        state.interactions[index] = { ...state.interactions[index], ...updates };
      }
    },
    
    // Set recording state
    setRecording: (state, action) => {
      state.isRecording = action.payload;
    },
    
    // Set session history
    setSessionHistory: (state, action) => {
      state.sessionHistory = action.payload;
    },
    
    // Update current session
    updateCurrentSession: (state, action) => {
      if (state.currentSession) {
        state.currentSession = { ...state.currentSession, ...action.payload };
      }
    },
    
    // Set speech recognition support
    setSpeechRecognitionSupported: (state, action) => {
      state.speechRecognitionSupported = action.payload;
    },
    
    // Clear current interview data
    clearCurrentInterview: (state) => {
      state.currentSession = null;
      state.currentQuestion = null;
      state.interactions = [];
      state.isRecording = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Interview Session
      .addCase(createInterviewSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createInterviewSession.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSession = action.payload;
        state.interactions = [];
        state.currentQuestion = null;
      })
      .addCase(createInterviewSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Interview Question
      .addCase(fetchInterviewQuestion.pending, (state) => {
        state.questionLoading = true;
        state.error = null;
      })
      .addCase(fetchInterviewQuestion.fulfilled, (state, action) => {
        state.questionLoading = false;
        state.currentQuestion = action.payload;
      })
      .addCase(fetchInterviewQuestion.rejected, (state, action) => {
        state.questionLoading = false;
        state.error = action.payload;
      })
      
      // Save Interaction
      .addCase(saveInteraction.pending, (state) => {
        state.savingInteraction = true;
        state.error = null;
      })
      .addCase(saveInteraction.fulfilled, (state, action) => {
        state.savingInteraction = false;
        // Add the saved interaction to local state
        const existingIndex = state.interactions.findIndex(
          interaction => interaction.order === action.payload.order
        );
        if (existingIndex >= 0) {
          state.interactions[existingIndex] = action.payload;
        } else {
          state.interactions.push(action.payload);
        }
      })
      .addCase(saveInteraction.rejected, (state, action) => {
        state.savingInteraction = false;
        state.error = action.payload;
      })
      
      // Update Interview Session
      .addCase(updateInterviewSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateInterviewSession.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSession = action.payload;
      })
      .addCase(updateInterviewSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Calculate Final Score
      .addCase(calculateFinalScore.pending, (state) => {
        state.calculatingScore = true;
        state.error = null;
      })
      .addCase(calculateFinalScore.fulfilled, (state, action) => {
        state.calculatingScore = false;
        if (state.currentSession) {
          state.currentSession.finalScore = action.payload.score;
          state.currentSession.feedback = action.payload.feedback;
        }
      })
      .addCase(calculateFinalScore.rejected, (state, action) => {
        state.calculatingScore = false;
        state.error = action.payload;
      })
      
      // Fetch Session History
      .addCase(fetchSessionHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSessionHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.sessionHistory = action.payload;
      })
      .addCase(fetchSessionHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Session Interactions
      .addCase(fetchSessionInteractions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSessionInteractions.fulfilled, (state, action) => {
        state.loading = false;
        state.interactions = action.payload;
      })
      .addCase(fetchSessionInteractions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setLoading,
  setError,
  clearError,
  startSession,
  endSession,
  setCurrentQuestion,
  addInteraction,
  updateInteraction,
  setRecording,
  setSessionHistory,
  updateCurrentSession,
  setSpeechRecognitionSupported,
  clearCurrentInterview,
} = interviewSlice.actions;

// Selectors
export const selectInterview = (state) => state.interview;
export const selectCurrentSession = (state) => state.interview.currentSession;
export const selectCurrentQuestion = (state) => state.interview.currentQuestion;
export const selectInteractions = (state) => state.interview.interactions;
export const selectIsRecording = (state) => state.interview.isRecording;
export const selectInterviewLoading = (state) => state.interview.loading;
export const selectInterviewError = (state) => state.interview.error;
export const selectSessionHistory = (state) => state.interview.sessionHistory;
export const selectSpeechRecognitionSupported = (state) => state.interview.speechRecognitionSupported;
export const selectQuestionLoading = (state) => state.interview.questionLoading;
export const selectSavingInteraction = (state) => state.interview.savingInteraction;
export const selectCalculatingScore = (state) => state.interview.calculatingScore;

export default interviewSlice.reducer;