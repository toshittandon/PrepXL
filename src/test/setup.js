import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Appwrite
global.fetch = vi.fn();

// Mock import.meta.env for tests
Object.defineProperty(import.meta, 'env', {
  value: {
    DEV: false,
    PROD: true,
    VITE_AI_API_BASE_URL: 'https://api.test.com',
    VITE_APPWRITE_ENDPOINT: 'https://test.appwrite.io/v1',
    VITE_APPWRITE_PROJECT_ID: 'test-project-id',
    VITE_APPWRITE_DATABASE_ID: 'test-database-id',
    VITE_APPWRITE_USERS_COLLECTION_ID: 'test-users-collection',
    VITE_APPWRITE_RESUMES_COLLECTION_ID: 'test-resumes-collection',
    VITE_APPWRITE_SESSIONS_COLLECTION_ID: 'test-sessions-collection',
    VITE_APPWRITE_INTERACTIONS_COLLECTION_ID: 'test-interactions-collection',
    VITE_APPWRITE_STORAGE_BUCKET_ID: 'test-storage-bucket',
    VITE_AI_API_KEY: 'test-api-key',
    VITE_GOOGLE_CLIENT_ID: 'test-google-client-id',
    VITE_LINKEDIN_CLIENT_ID: 'test-linkedin-client-id',
    VITE_SENTRY_DSN: 'test-sentry-dsn',
    VITE_GA_TRACKING_ID: 'test-ga-tracking-id'
  },
  writable: true,
  configurable: true
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock Web Speech API
global.SpeechRecognition = vi.fn(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  continuous: false,
  interimResults: false,
  lang: 'en-US',
}));

global.webkitSpeechRecognition = global.SpeechRecognition;

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn(() => Promise.resolve({
      getTracks: () => [{ stop: vi.fn() }]
    })),
  },
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock window.location
delete window.location;
window.location = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  reload: vi.fn(),
  assign: vi.fn(),
  replace: vi.fn(),
};

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));