import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authSlice, {
  loginUser,
  signupUser,
  logoutUser,
  checkAuthStatus,
  updateUserProfile,
  clearError,
  resetAuth,
  setSession,
  selectAuth,
  selectUser,
  selectSession,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectIsInitialized,
} from '../authSlice.js';

// Mock the auth service
vi.mock('../../../services/appwrite/auth.js', () => ({
  authService: {
    login: vi.fn(),
    createAccount: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    getCurrentSession: vi.fn(),
    updatePreferences: vi.fn(),
  },
}));

import { authService } from '../../../services/appwrite/auth.js';

describe('authSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authSlice,
      },
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().auth;
      expect(state).toEqual({
        user: null,
        session: null,
        loading: false,
        error: null,
        isAuthenticated: false,
        isInitialized: false,
      });
    });
  });

  describe('reducers', () => {
    it('should clear error', () => {
      // Set initial error state
      store.dispatch({ type: 'auth/loginUser/rejected', payload: 'Test error' });
      expect(store.getState().auth.error).toBe('Test error');

      // Clear error
      store.dispatch(clearError());
      expect(store.getState().auth.error).toBeNull();
    });

    it('should reset auth state', () => {
      // Set some state
      store.dispatch({
        type: 'auth/loginUser/fulfilled',
        payload: {
          user: { id: '1', name: 'Test User' },
          session: { id: 'session1' },
        },
      });

      // Reset auth
      store.dispatch(resetAuth());
      const state = store.getState().auth;
      expect(state).toEqual({
        user: null,
        session: null,
        loading: false,
        error: null,
        isAuthenticated: false,
        isInitialized: false,
      });
    });

    it('should set session', () => {
      const session = { id: 'session1', userId: 'user1' };
      store.dispatch(setSession(session));
      
      const state = store.getState().auth;
      expect(state.session).toEqual(session);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should set isAuthenticated to false when session is null', () => {
      store.dispatch(setSession(null));
      
      const state = store.getState().auth;
      expect(state.session).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('loginUser async thunk', () => {
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
    const mockSession = { id: 'session1', userId: '1' };

    it('should handle successful login', async () => {
      authService.login.mockResolvedValue({ success: true, data: mockSession });
      authService.getCurrentUser.mockResolvedValue({ success: true, data: mockUser });

      await store.dispatch(loginUser({ email: 'test@example.com', password: 'password' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.user).toEqual(mockUser);
      expect(state.session).toEqual(mockSession);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle login failure', async () => {
      const errorMessage = 'Invalid credentials';
      authService.login.mockResolvedValue({ success: false, error: errorMessage });

      await store.dispatch(loginUser({ email: 'test@example.com', password: 'wrong' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it('should handle login exception', async () => {
      authService.login.mockRejectedValue(new Error('Network error'));

      await store.dispatch(loginUser({ email: 'test@example.com', password: 'password' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Network error');
      expect(state.isAuthenticated).toBe(false);
    });

    it('should set loading state during login', () => {
      authService.login.mockImplementation(() => new Promise(() => {})); // Never resolves

      store.dispatch(loginUser({ email: 'test@example.com', password: 'password' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });
  });

  describe('signupUser async thunk', () => {
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
    const mockSession = { id: 'session1', userId: '1' };

    it('should handle successful signup', async () => {
      authService.createAccount.mockResolvedValue({ success: true, data: mockUser });
      authService.login.mockResolvedValue({ success: true, data: mockSession });
      authService.getCurrentUser.mockResolvedValue({ success: true, data: mockUser });

      await store.dispatch(signupUser({ 
        email: 'test@example.com', 
        password: 'password', 
        name: 'Test User' 
      }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.user).toEqual(mockUser);
      expect(state.session).toEqual(mockSession);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle signup failure', async () => {
      const errorMessage = 'Email already exists';
      authService.createAccount.mockResolvedValue({ success: false, error: errorMessage });

      await store.dispatch(signupUser({ 
        email: 'test@example.com', 
        password: 'password', 
        name: 'Test User' 
      }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('logoutUser async thunk', () => {
    it('should handle successful logout', async () => {
      // Set initial authenticated state
      store.dispatch({
        type: 'auth/loginUser/fulfilled',
        payload: {
          user: { id: '1', name: 'Test User' },
          session: { id: 'session1' },
        },
      });

      authService.logout.mockResolvedValue({ success: true, data: { message: 'Logged out' } });

      await store.dispatch(logoutUser());

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle logout failure', async () => {
      const errorMessage = 'Logout failed';
      authService.logout.mockResolvedValue({ success: false, error: errorMessage });

      await store.dispatch(logoutUser());

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('checkAuthStatus async thunk', () => {
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
    const mockSession = { id: 'session1', userId: '1' };

    it('should handle valid session', async () => {
      authService.getCurrentSession.mockResolvedValue({ success: true, data: mockSession });
      authService.getCurrentUser.mockResolvedValue({ success: true, data: mockUser });

      await store.dispatch(checkAuthStatus());

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.user).toEqual(mockUser);
      expect(state.session).toEqual(mockSession);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isInitialized).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle invalid session', async () => {
      authService.getCurrentSession.mockResolvedValue({ success: false, error: 'No session' });

      await store.dispatch(checkAuthStatus());

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isInitialized).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle exception gracefully', async () => {
      authService.getCurrentSession.mockRejectedValue(new Error('Network error'));

      await store.dispatch(checkAuthStatus());

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isInitialized).toBe(true);
      expect(state.error).toBeNull();
    });
  });

  describe('updateUserProfile async thunk', () => {
    it('should handle successful profile update', async () => {
      const updatedUser = { id: '1', name: 'Updated User', email: 'test@example.com' };
      const updateData = { name: 'Updated User' };

      // Set initial user state
      store.dispatch({
        type: 'auth/loginUser/fulfilled',
        payload: {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
          session: { id: 'session1' },
        },
      });

      authService.updatePreferences.mockResolvedValue({ success: true, data: updatedUser });

      await store.dispatch(updateUserProfile(updateData));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.user).toEqual(updatedUser);
      expect(state.error).toBeNull();
    });

    it('should handle profile update failure', async () => {
      const errorMessage = 'Update failed';
      authService.updatePreferences.mockResolvedValue({ success: false, error: errorMessage });

      await store.dispatch(updateUserProfile({ name: 'Updated User' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('selectors', () => {
    const mockState = {
      auth: {
        user: { id: '1', name: 'Test User' },
        session: { id: 'session1' },
        loading: false,
        error: null,
        isAuthenticated: true,
        isInitialized: true,
      },
    };

    it('should select auth state', () => {
      expect(selectAuth(mockState)).toEqual(mockState.auth);
    });

    it('should select user', () => {
      expect(selectUser(mockState)).toEqual(mockState.auth.user);
    });

    it('should select session', () => {
      expect(selectSession(mockState)).toEqual(mockState.auth.session);
    });

    it('should select isAuthenticated', () => {
      expect(selectIsAuthenticated(mockState)).toBe(true);
    });

    it('should select loading state', () => {
      expect(selectAuthLoading(mockState)).toBe(false);
    });

    it('should select error', () => {
      expect(selectAuthError(mockState)).toBeNull();
    });

    it('should select isInitialized', () => {
      expect(selectIsInitialized(mockState)).toBe(true);
    });
  });
});