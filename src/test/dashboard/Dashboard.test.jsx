import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import Dashboard from '../../pages/dashboard/Dashboard'
import authSlice from '../../store/slices/authSlice'
import { appwriteApi } from '../../store/api/appwriteApi'

// Mock the API
vi.mock('../../store/api/appwriteApi', () => ({
  appwriteApi: {
    reducer: vi.fn(),
    middleware: vi.fn(() => (next) => (action) => next(action)),
    reducerPath: 'appwriteApi',
    endpoints: {
      getInterviewSessions: {
        useQuery: vi.fn(() => ({
          data: [],
          isLoading: false,
          error: null
        }))
      },
      getResumes: {
        useQuery: vi.fn(() => ({
          data: [],
          isLoading: false,
          error: null
        }))
      }
    }
  },
  useGetInterviewSessionsQuery: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null
  })),
  useGetResumesQuery: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null
  })),
  useUpdateUserMutation: vi.fn(() => [
    vi.fn(),
    { isLoading: false }
  ])
}))

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      [appwriteApi.reducerPath]: () => ({})
    },
    preloadedState: {
      auth: {
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          experienceLevel: 'Mid',
          targetRole: 'Software Engineer',
          targetIndustry: 'Technology',
          isAdmin: false,
          createdAt: '2024-01-01T00:00:00.000Z'
        },
        session: { token: 'test-token' },
        loading: false,
        error: null
      },
      ...initialState
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false
      })
  })
}

const renderWithProviders = (component, { store = createTestStore() } = {}) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  )
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders welcome message with user name', () => {
    renderWithProviders(<Dashboard />)
    
    expect(screen.getByText(/Welcome back, Test User!/)).toBeInTheDocument()
  })

  it('renders analytics cards section', () => {
    renderWithProviders(<Dashboard />)
    
    expect(screen.getByText('Interviews Completed')).toBeInTheDocument()
    expect(screen.getByText('Resume Analyses')).toBeInTheDocument()
    expect(screen.getByText('Average Score')).toBeInTheDocument()
    expect(screen.getByText('Study Time')).toBeInTheDocument()
  })

  it('renders quick actions section', () => {
    renderWithProviders(<Dashboard />)
    
    expect(screen.getByText('Quick Actions')).toBeInTheDocument()
    expect(screen.getByText('Upload Resume')).toBeInTheDocument()
    expect(screen.getByText('Practice Interview')).toBeInTheDocument()
    expect(screen.getByText('Browse Q&A Library')).toBeInTheDocument()
  })

  it('renders session history section', () => {
    renderWithProviders(<Dashboard />)
    
    expect(screen.getByText('Interview History')).toBeInTheDocument()
  })

  it('renders user profile section', () => {
    renderWithProviders(<Dashboard />)
    
    expect(screen.getByText('Profile Information')).toBeInTheDocument()
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('renders progress overview section', () => {
    renderWithProviders(<Dashboard />)
    
    expect(screen.getByText('Progress Overview')).toBeInTheDocument()
  })

  it('handles user without data gracefully', () => {
    const storeWithoutUser = createTestStore({
      auth: {
        user: null,
        session: null,
        loading: false,
        error: null
      }
    })

    renderWithProviders(<Dashboard />, { store: storeWithoutUser })
    
    expect(screen.getByText(/Welcome back, User!/)).toBeInTheDocument()
  })
})