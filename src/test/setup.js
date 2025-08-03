/**
 * Test setup file for Vitest
 */

import '@testing-library/jest-dom'

// Mock environment variables for testing
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_APPWRITE_ENDPOINT: 'https://cloud.appwrite.io/v1',
    VITE_APPWRITE_PROJECT_ID: 'test-project-id',
    VITE_APPWRITE_DATABASE_ID: 'test-database-id',
    VITE_APPWRITE_USERS_COLLECTION_ID: 'users',
    VITE_APPWRITE_RESUMES_COLLECTION_ID: 'resumes',
    VITE_APPWRITE_SESSIONS_COLLECTION_ID: 'sessions',
    VITE_APPWRITE_INTERACTIONS_COLLECTION_ID: 'interactions',
    VITE_APPWRITE_QUESTIONS_COLLECTION_ID: 'questions',
    VITE_APPWRITE_STORAGE_BUCKET_ID: 'storage',
    VITE_APP_ENVIRONMENT: 'test',
    MODE: 'test'
  },
  writable: true
})

// Mock global build time
global.__BUILD_TIME__ = new Date().toISOString()

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

console.error = (...args) => {
  // Only show errors that are not expected test errors
  if (!args[0]?.includes?.('Warning:') && !args[0]?.includes?.('Appwrite client health check failed')) {
    originalConsoleError(...args)
  }
}

console.warn = (...args) => {
  // Only show warnings that are not expected test warnings
  if (!args[0]?.includes?.('Missing required environment variables')) {
    originalConsoleWarn(...args)
  }
}

// Mock fetch for testing
global.fetch = vi.fn()

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    reload: vi.fn()
  },
  writable: true
})

// Mock navigator
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Test Environment)',
  writable: true
})

// Setup cleanup after each test
afterEach(() => {
  vi.clearAllMocks()
})