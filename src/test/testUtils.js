import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';

// Import slices
import authSlice from '../store/slices/authSlice';
import interviewSlice from '../store/slices/interviewSlice';
import resumeSlice from '../store/slices/resumeSlice';
import reportSlice from '../store/slices/reportSlice';
import uiSlice from '../store/slices/uiSlice';

// Create a test store
export const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      interview: interviewSlice,
      resume: resumeSlice,
      report: reportSlice,
      ui: uiSlice,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

// Custom render function that includes providers
export const renderWithProviders = (
  ui,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    ...renderOptions
  } = {}
) => {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
};

// Mock user data
export const mockUser = {
  $id: 'user123',
  name: 'John Doe',
  email: 'john@example.com',
  experienceLevel: 'Mid-level',
  targetRole: 'Software Engineer',
  targetIndustry: 'Technology',
  $createdAt: '2024-01-01T00:00:00.000Z',
  $updatedAt: '2024-01-01T00:00:00.000Z',
};

// Mock resume data
export const mockResume = {
  $id: 'resume123',
  userId: 'user123',
  fileId: 'file123',
  fileName: 'resume.pdf',
  analysisResults: {
    atsKeywords: ['JavaScript', 'React', 'Node.js'],
    actionVerbs: ['Developed', 'Implemented', 'Optimized'],
    quantificationSuggestions: ['Add metrics to achievements', 'Include percentage improvements'],
  },
  $createdAt: '2024-01-01T00:00:00.000Z',
};

// Mock interview session data
export const mockInterviewSession = {
  $id: 'session123',
  userId: 'user123',
  sessionType: 'Behavioral',
  role: 'Software Engineer',
  status: 'completed',
  finalScore: 85,
  $createdAt: '2024-01-01T00:00:00.000Z',
  $updatedAt: '2024-01-01T00:00:00.000Z',
};

// Mock interaction data
export const mockInteraction = {
  $id: 'interaction123',
  sessionId: 'session123',
  questionText: 'Tell me about yourself',
  userAnswerText: 'I am a software engineer with 5 years of experience...',
  timestamp: '2024-01-01T00:00:00.000Z',
  order: 1,
};

// Mock API responses
export const mockApiResponses = {
  auth: {
    login: { user: mockUser, session: { $id: 'session123' } },
    signup: { user: mockUser },
    logout: {},
  },
  resume: {
    upload: mockResume,
    analyze: {
      analysisResults: mockResume.analysisResults,
    },
  },
  interview: {
    createSession: mockInterviewSession,
    getQuestion: { questionText: 'What are your strengths?' },
    saveInteraction: mockInteraction,
  },
  report: {
    getReport: {
      session: mockInterviewSession,
      interactions: [mockInteraction],
    },
  },
};

// Mock Appwrite services
export const mockAppwriteServices = {
  auth: {
    login: vi.fn(() => Promise.resolve(mockApiResponses.auth.login)),
    signup: vi.fn(() => Promise.resolve(mockApiResponses.auth.signup)),
    logout: vi.fn(() => Promise.resolve(mockApiResponses.auth.logout)),
    getCurrentUser: vi.fn(() => Promise.resolve(mockUser)),
    getCurrentSession: vi.fn(() => Promise.resolve({ $id: 'session123' })),
  },
  database: {
    createDocument: vi.fn((databaseId, collectionId, documentId, data) => 
      Promise.resolve({ $id: documentId || 'doc123', ...data })
    ),
    getDocument: vi.fn(() => Promise.resolve(mockInterviewSession)),
    listDocuments: vi.fn(() => Promise.resolve({
      documents: [mockInterviewSession],
      total: 1,
    })),
    updateDocument: vi.fn((databaseId, collectionId, documentId, data) =>
      Promise.resolve({ $id: documentId, ...data })
    ),
    deleteDocument: vi.fn(() => Promise.resolve()),
  },
  storage: {
    createFile: vi.fn(() => Promise.resolve({ $id: 'file123' })),
    getFilePreview: vi.fn(() => 'blob:preview-url'),
    deleteFile: vi.fn(() => Promise.resolve()),
  },
};

// Mock AI services
export const mockAiServices = {
  analyzeResume: vi.fn(() => Promise.resolve(mockApiResponses.resume.analyze)),
  getInterviewQuestion: vi.fn(() => Promise.resolve(mockApiResponses.interview.getQuestion)),
};

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Helper to create mock file
export const createMockFile = (name = 'test.pdf', type = 'application/pdf', size = 1024) => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Helper to mock form submission
export const mockFormSubmission = (formData) => {
  const mockEvent = {
    preventDefault: vi.fn(),
    target: {
      elements: Object.keys(formData).reduce((acc, key) => {
        acc[key] = { value: formData[key] };
        return acc;
      }, {}),
    },
  };
  return mockEvent;
};

// Helper to create mock speech recognition event
export const createMockSpeechEvent = (transcript, isFinal = true) => ({
  results: [{
    0: { transcript },
    isFinal,
  }],
  resultIndex: 0,
});

// Re-export everything from testing library
export * from '@testing-library/react';
export { vi } from 'vitest';