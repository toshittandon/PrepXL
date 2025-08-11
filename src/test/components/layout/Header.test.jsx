import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { ThemeProvider } from '../../../contexts/ThemeContext.jsx'
import Header from '../../../components/layout/Header.jsx'
import authSlice from '../../../store/slices/authSlice.js'

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice
    },
    preloadedState: {
      auth: {
        user: null,
        session: null,
        loading: false,
        error: null,
        ...initialState
      }
    }
  })
}

const TestWrapper = ({ store, children }) => (
  <Provider store={store}>
    <BrowserRouter>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </BrowserRouter>
  </Provider>
)

describe('Header Component', () => {
  it('renders header with logo', () => {
    const store = createTestStore()
    
    render(
      <TestWrapper store={store}>
        <Header />
      </TestWrapper>
    )
    
    expect(screen.getByText(/prepxl/i)).toBeInTheDocument()
  })

  it('shows theme toggle button', () => {
    const store = createTestStore()
    
    render(
      <TestWrapper store={store}>
        <Header />
      </TestWrapper>
    )
    
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
  })

  it('shows login/signup buttons when not authenticated', () => {
    const store = createTestStore({ user: null, session: null })
    
    render(
      <TestWrapper store={store}>
        <Header />
      </TestWrapper>
    )
    
    expect(screen.getByText(/sign in/i)).toBeInTheDocument()
    expect(screen.getByText(/sign up/i)).toBeInTheDocument()
  })

  it('shows user menu when authenticated', () => {
    const store = createTestStore({
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
      session: { token: 'test-token' }
    })
    
    render(
      <TestWrapper store={store}>
        <Header />
      </TestWrapper>
    )
    
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument()
  })

  it('shows navigation links when authenticated', () => {
    const store = createTestStore({
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
      session: { token: 'test-token' }
    })
    
    render(
      <TestWrapper store={store}>
        <Header />
      </TestWrapper>
    )
    
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    expect(screen.getByText(/resume/i)).toBeInTheDocument()
    expect(screen.getByText(/interview/i)).toBeInTheDocument()
    expect(screen.getByText(/library/i)).toBeInTheDocument()
  })

  it('shows admin link for admin users', () => {
    const store = createTestStore({
      user: { id: '1', name: 'Admin User', email: 'admin@example.com', isAdmin: true },
      session: { token: 'test-token' }
    })
    
    render(
      <TestWrapper store={store}>
        <Header />
      </TestWrapper>
    )
    
    expect(screen.getByText(/admin/i)).toBeInTheDocument()
  })

  it('does not show admin link for regular users', () => {
    const store = createTestStore({
      user: { id: '1', name: 'Regular User', email: 'user@example.com', isAdmin: false },
      session: { token: 'test-token' }
    })
    
    render(
      <TestWrapper store={store}>
        <Header />
      </TestWrapper>
    )
    
    expect(screen.queryByText(/admin/i)).not.toBeInTheDocument()
  })

  it('opens user menu when clicked', () => {
    const store = createTestStore({
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
      session: { token: 'test-token' }
    })
    
    render(
      <TestWrapper store={store}>
        <Header />
      </TestWrapper>
    )
    
    const userButton = screen.getByText('Test User')
    fireEvent.click(userButton)
    
    expect(screen.getByText(/profile/i)).toBeInTheDocument()
    expect(screen.getByText(/settings/i)).toBeInTheDocument()
    expect(screen.getByText(/logout/i)).toBeInTheDocument()
  })

  it('handles logout when clicked', () => {
    const store = createTestStore({
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
      session: { token: 'test-token' }
    })
    
    const mockLogout = vi.fn()
    
    render(
      <TestWrapper store={store}>
        <Header onLogout={mockLogout} />
      </TestWrapper>
    )
    
    const userButton = screen.getByText('Test User')
    fireEvent.click(userButton)
    
    const logoutButton = screen.getByText(/logout/i)
    fireEvent.click(logoutButton)
    
    expect(mockLogout).toHaveBeenCalled()
  })

  it('shows mobile menu toggle on small screens', () => {
    const store = createTestStore()
    
    render(
      <TestWrapper store={store}>
        <Header />
      </TestWrapper>
    )
    
    const mobileMenuButton = screen.getByRole('button', { name: /menu/i })
    expect(mobileMenuButton).toBeInTheDocument()
  })

  it('toggles mobile menu when clicked', () => {
    const store = createTestStore({
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
      session: { token: 'test-token' }
    })
    
    render(
      <TestWrapper store={store}>
        <Header />
      </TestWrapper>
    )
    
    const mobileMenuButton = screen.getByRole('button', { name: /menu/i })
    fireEvent.click(mobileMenuButton)
    
    // Mobile menu should be visible
    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument()
  })

  it('applies proper accessibility attributes', () => {
    const store = createTestStore({
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
      session: { token: 'test-token' }
    })
    
    render(
      <TestWrapper store={store}>
        <Header />
      </TestWrapper>
    )
    
    const nav = screen.getByRole('navigation')
    expect(nav).toBeInTheDocument()
    
    const userButton = screen.getByText('Test User')
    expect(userButton).toHaveAttribute('aria-expanded', 'false')
  })

  it('handles keyboard navigation', () => {
    const store = createTestStore({
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
      session: { token: 'test-token' }
    })
    
    render(
      <TestWrapper store={store}>
        <Header />
      </TestWrapper>
    )
    
    const userButton = screen.getByText('Test User')
    fireEvent.keyDown(userButton, { key: 'Enter', code: 'Enter' })
    
    expect(screen.getByText(/profile/i)).toBeInTheDocument()
  })
})