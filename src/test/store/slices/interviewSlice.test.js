import { configureStore } from '@reduxjs/toolkit';
import interviewReducer, {
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
  createInterviewSession,
  fetchInterviewQuestion,
  saveInteraction,
  updateInterviewSession,
  calculateFinalScore,
  fetchSessionHistory,
  fetchSessionInteractions,
} from '../../../store/slices/interviewSlice.js';

import { vi } from 'vitest';

// Mock the services
vi.mock('../../../services/appwrite/database.js', () => ({
  databaseService: {
    createInterviewSession: vi.fn(),
    updateInterviewSession: vi.fn(),
    getUserInterviewSessions: vi.fn(),
    getSessionInteractions: vi.fn(),
    createInteraction: vi.fn(),
  },
}));

vi.mock('../../../services/ai/interviewService.js', () => ({
  interviewService: {
    getInterviewQuestion: vi.fn(),
    calculateInterviewScore: vi.fn(),
  },
}));

import { databaseService } from '../../../services/appwrite/database.js';
import { interviewService } from '../../../services/ai/interviewService.js';

describe('interviewSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        interview: interviewReducer,
      },
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().interview;
      expect(state).toEqual({
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
      });
    });
  });

  describe('synchronous actions', () => {
    it('should handle setLoading', () => {
      store.dispatch(setLoading(true));
      expect(store.getState().interview.loading).toBe(true);
    });

    it('should handle setError', () => {
      const errorMessage = 'Test error';
      store.dispatch(setError(errorMessage));
      const state = store.getState().interview;
      expect(state.error).toBe(errorMessage);
      expect(state.loading).toBe(false);
    });

    it('should handle clearError', () => {
      store.dispatch(setError('Test error'));
      store.dispatch(clearError());
      expect(store.getState().interview.error).toBe(null);
    });

    it('should handle startSession', () => {
      const sessionData = {
        id: '123',
        role: 'Software Engineer',
        sessionType: 'Technical',
        status: 'active',
      };
      
      store.dispatch(startSession(sessionData));
      const state = store.getState().interview;
      
      expect(state.currentSession).toEqual(sessionData);
      expect(state.interactions).toEqual([]);
      expect(state.currentQuestion).toBe(null);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle endSession', () => {
      const sessionData = {
        id: '123',
        role: 'Software Engineer',
        sessionType: 'Technical',
      };
      const interactions = [
        { id: '1', questionText: 'Question 1', userAnswerText: 'Answer 1' },
      ];

      // Set up initial state
      store.dispatch(startSession(sessionData));
      store.dispatch(addInteraction(interactions[0]));
      
      // End session
      store.dispatch(endSession());
      
      const state = store.getState().interview;
      expect(state.currentSession).toBe(null);
      expect(state.currentQuestion).toBe(null);
      expect(state.interactions).toEqual([]);
      expect(state.isRecording).toBe(false);
      expect(state.sessionHistory).toHaveLength(1);
      expect(state.sessionHistory[0]).toEqual({
        ...sessionData,
        interactions: interactions,
      });
    });

    it('should handle setCurrentQuestion', () => {
      const question = 'Tell me about yourself';
      store.dispatch(setCurrentQuestion(question));
      expect(store.getState().interview.currentQuestion).toBe(question);
    });

    it('should handle addInteraction', () => {
      const interaction = {
        id: '1',
        questionText: 'Question 1',
        userAnswerText: 'Answer 1',
        order: 1,
      };
      
      store.dispatch(addInteraction(interaction));
      expect(store.getState().interview.interactions).toEqual([interaction]);
    });

    it('should handle updateInteraction', () => {
      const interaction = {
        id: '1',
        questionText: 'Question 1',
        userAnswerText: 'Answer 1',
        order: 1,
      };
      
      store.dispatch(addInteraction(interaction));
      store.dispatch(updateInteraction({
        id: '1',
        updates: { userAnswerText: 'Updated Answer 1' },
      }));
      
      const updatedInteraction = store.getState().interview.interactions[0];
      expect(updatedInteraction.userAnswerText).toBe('Updated Answer 1');
    });

    it('should handle setRecording', () => {
      store.dispatch(setRecording(true));
      expect(store.getState().interview.isRecording).toBe(true);
    });

    it('should handle setSessionHistory', () => {
      const history = [
        { id: '1', role: 'Engineer', sessionType: 'Technical' },
        { id: '2', role: 'Manager', sessionType: 'Behavioral' },
      ];
      
      store.dispatch(setSessionHistory(history));
      expect(store.getState().interview.sessionHistory).toEqual(history);
    });

    it('should handle updateCurrentSession', () => {
      const sessionData = {
        id: '123',
        role: 'Software Engineer',
        sessionType: 'Technical',
      };
      
      store.dispatch(startSession(sessionData));
      store.dispatch(updateCurrentSession({ finalScore: 85 }));
      
      const updatedSession = store.getState().interview.currentSession;
      expect(updatedSession.finalScore).toBe(85);
    });

    it('should handle setSpeechRecognitionSupported', () => {
      store.dispatch(setSpeechRecognitionSupported(true));
      expect(store.getState().interview.speechRecognitionSupported).toBe(true);
    });

    it('should handle clearCurrentInterview', () => {
      // Set up some state
      store.dispatch(startSession({ id: '123' }));
      store.dispatch(setCurrentQuestion('Test question'));
      store.dispatch(addInteraction({ id: '1', questionText: 'Q1' }));
      store.dispatch(setRecording(true));
      store.dispatch(setError('Test error'));
      
      // Clear everything
      store.dispatch(clearCurrentInterview());
      
      const state = store.getState().interview;
      expect(state.currentSession).toBe(null);
      expect(state.currentQuestion).toBe(null);
      expect(state.interactions).toEqual([]);
      expect(state.isRecording).toBe(false);
      expect(state.error).toBe(null);
    });
  });

  describe('async thunks', () => {
    describe('createInterviewSession', () => {
      it('should handle successful session creation', async () => {
        const sessionData = {
          role: 'Software Engineer',
          sessionType: 'Technical',
          userId: 'user123',
        };
        
        const createdSession = {
          id: 'session123',
          ...sessionData,
          status: 'active',
        };

        databaseService.createInterviewSession.mockResolvedValue({
          success: true,
          data: createdSession,
        });

        await store.dispatch(createInterviewSession(sessionData));
        
        const state = store.getState().interview;
        expect(state.loading).toBe(false);
        expect(state.currentSession).toEqual(createdSession);
        expect(state.interactions).toEqual([]);
        expect(state.currentQuestion).toBe(null);
      });

      it('should handle failed session creation', async () => {
        const sessionData = { role: 'Engineer' };
        const errorMessage = 'Database error';

        databaseService.createInterviewSession.mockResolvedValue({
          success: false,
          error: errorMessage,
        });

        await store.dispatch(createInterviewSession(sessionData));
        
        const state = store.getState().interview;
        expect(state.loading).toBe(false);
        expect(state.error).toBe(errorMessage);
      });
    });

    describe('fetchInterviewQuestion', () => {
      it('should handle successful question fetch', async () => {
        const questionParams = {
          role: 'Software Engineer',
          sessionType: 'Technical',
        };
        
        const questionText = 'What is your experience with React?';

        interviewService.getInterviewQuestion.mockResolvedValue({
          success: true,
          data: { questionText },
        });

        await store.dispatch(fetchInterviewQuestion(questionParams));
        
        const state = store.getState().interview;
        expect(state.questionLoading).toBe(false);
        expect(state.currentQuestion).toBe(questionText);
      });

      it('should handle failed question fetch', async () => {
        const questionParams = { role: 'Engineer' };
        const errorMessage = 'AI service error';

        interviewService.getInterviewQuestion.mockResolvedValue({
          success: false,
          error: errorMessage,
        });

        await store.dispatch(fetchInterviewQuestion(questionParams));
        
        const state = store.getState().interview;
        expect(state.questionLoading).toBe(false);
        expect(state.error).toBe(errorMessage);
      });
    });

    describe('saveInteraction', () => {
      it('should handle successful interaction save', async () => {
        const interactionData = {
          sessionId: 'session123',
          questionText: 'Question 1',
          userAnswerText: 'Answer 1',
          order: 1,
        };
        
        const savedInteraction = {
          id: 'interaction123',
          ...interactionData,
        };

        databaseService.createInteraction.mockResolvedValue({
          success: true,
          data: savedInteraction,
        });

        await store.dispatch(saveInteraction(interactionData));
        
        const state = store.getState().interview;
        expect(state.savingInteraction).toBe(false);
        expect(state.interactions).toContain(savedInteraction);
      });

      it('should handle failed interaction save', async () => {
        const interactionData = { sessionId: 'session123' };
        const errorMessage = 'Save failed';

        databaseService.createInteraction.mockResolvedValue({
          success: false,
          error: errorMessage,
        });

        await store.dispatch(saveInteraction(interactionData));
        
        const state = store.getState().interview;
        expect(state.savingInteraction).toBe(false);
        expect(state.error).toBe(errorMessage);
      });
    });

    describe('calculateFinalScore', () => {
      it('should handle successful score calculation', async () => {
        const interactions = [
          { questionText: 'Q1', userAnswerText: 'A1' },
          { questionText: 'Q2', userAnswerText: 'A2' },
        ];
        
        const scoreData = {
          score: 85,
          feedback: 'Good performance',
        };

        // Set up current session
        store.dispatch(startSession({ id: 'session123' }));

        interviewService.calculateInterviewScore.mockResolvedValue({
          success: true,
          data: scoreData,
        });

        await store.dispatch(calculateFinalScore(interactions));
        
        const state = store.getState().interview;
        expect(state.calculatingScore).toBe(false);
        expect(state.currentSession.finalScore).toBe(85);
        expect(state.currentSession.feedback).toBe('Good performance');
      });

      it('should handle failed score calculation', async () => {
        const interactions = [];
        const errorMessage = 'Score calculation failed';

        interviewService.calculateInterviewScore.mockResolvedValue({
          success: false,
          error: errorMessage,
        });

        await store.dispatch(calculateFinalScore(interactions));
        
        const state = store.getState().interview;
        expect(state.calculatingScore).toBe(false);
        expect(state.error).toBe(errorMessage);
      });
    });

    describe('fetchSessionHistory', () => {
      it('should handle successful history fetch', async () => {
        const userId = 'user123';
        const sessionHistory = [
          { id: 'session1', role: 'Engineer', status: 'completed' },
          { id: 'session2', role: 'Manager', status: 'active' },
        ];

        databaseService.getUserInterviewSessions.mockResolvedValue({
          success: true,
          data: sessionHistory,
        });

        await store.dispatch(fetchSessionHistory(userId));
        
        const state = store.getState().interview;
        expect(state.loading).toBe(false);
        expect(state.sessionHistory).toEqual(sessionHistory);
      });

      it('should handle failed history fetch', async () => {
        const userId = 'user123';
        const errorMessage = 'Fetch failed';

        databaseService.getUserInterviewSessions.mockResolvedValue({
          success: false,
          error: errorMessage,
        });

        await store.dispatch(fetchSessionHistory(userId));
        
        const state = store.getState().interview;
        expect(state.loading).toBe(false);
        expect(state.error).toBe(errorMessage);
      });
    });

    describe('fetchSessionInteractions', () => {
      it('should handle successful interactions fetch', async () => {
        const sessionId = 'session123';
        const interactions = [
          { id: 'int1', questionText: 'Q1', userAnswerText: 'A1' },
          { id: 'int2', questionText: 'Q2', userAnswerText: 'A2' },
        ];

        databaseService.getSessionInteractions.mockResolvedValue({
          success: true,
          data: interactions,
        });

        await store.dispatch(fetchSessionInteractions(sessionId));
        
        const state = store.getState().interview;
        expect(state.loading).toBe(false);
        expect(state.interactions).toEqual(interactions);
      });

      it('should handle failed interactions fetch', async () => {
        const sessionId = 'session123';
        const errorMessage = 'Fetch failed';

        databaseService.getSessionInteractions.mockResolvedValue({
          success: false,
          error: errorMessage,
        });

        await store.dispatch(fetchSessionInteractions(sessionId));
        
        const state = store.getState().interview;
        expect(state.loading).toBe(false);
        expect(state.error).toBe(errorMessage);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle updateInteraction with non-existent interaction', () => {
      store.dispatch(updateInteraction({
        id: 'non-existent',
        updates: { userAnswerText: 'Updated' },
      }));
      
      expect(store.getState().interview.interactions).toEqual([]);
    });

    it('should handle updateCurrentSession with no current session', () => {
      store.dispatch(updateCurrentSession({ finalScore: 85 }));
      
      expect(store.getState().interview.currentSession).toBe(null);
    });

    it('should handle endSession with no current session', () => {
      store.dispatch(endSession());
      
      const state = store.getState().interview;
      expect(state.currentSession).toBe(null);
      expect(state.sessionHistory).toEqual([]);
    });
  });
});