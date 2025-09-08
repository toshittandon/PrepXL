/**
 * Test setup file for Vitest
 */

import '@testing-library/jest-dom'

// Mock environment variables for testing
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_APPWRITE_ENDPOINT: 'https://fra.cloud.appwrite.io/v1',
    VITE_APPWRITE_PROJECT_ID: '68989b9a002cd7dd5c63',
    VITE_APPWRITE_DATABASE_ID: '68989eb20006e65fe65f',
    VITE_APPWRITE_USERS_COLLECTION_ID: '68989f1c0017e47f8bec',
    VITE_APPWRITE_RESUMES_COLLECTION_ID: '687fe7c10007c51a7c90',
    VITE_APPWRITE_SESSIONS_COLLECTION_ID: '68989f450005eb99ff08',
    VITE_APPWRITE_INTERACTIONS_COLLECTION_ID: '68989f3c000b7f44ca7b',
    VITE_APPWRITE_QUESTIONS_COLLECTION_ID: '68989f35003b4c609313',
    VITE_APPWRITE_STORAGE_BUCKET_ID: '68989f680031b3cdab2d',
    VITE_APP_NAME: 'PrepXL',
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

// Mock window.dispatchEvent for error handling
Object.defineProperty(window, 'dispatchEvent', {
  value: vi.fn(),
  writable: true
})

// Mock navigator
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Test Environment)',
  writable: true
})

// Mock matchMedia for theme system
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Setup cleanup after each test
afterEach(() => {
  vi.clearAllMocks()
})