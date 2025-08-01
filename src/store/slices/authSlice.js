import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/appwrite/auth.js';

// Initial state
const initialState = {
  user: null,
  session: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  isInitialized: false,
};

// Async thunks for authentication actions
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      // In development mode, check if we should use mock authentication
      if (import.meta.env.VITE_APP_ENVIRONMENT === 'development' && import.meta.env.VITE_MOCK_AUTH === 'true') {
        console.log('Using mock login for development');
        // Simulate a small delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
          user: {
            id: 'mock-user-id',
            email: email,
            name: email.split('@')[0] || 'Developer User'
          },
          session: {
            userId: 'mock-user-id',
            sessionId: 'mock-session-id'
          },
        };
      }

      const sessionResult = await authService.login(email, password);
      if (!sessionResult.success) {
        return rejectWithValue(sessionResult.error);
      }

      // Try to get user details, but don't fail if it doesn't work
      let userData = null;
      try {
        const userResult = await authService.getCurrentUser();
        if (userResult.success) {
          userData = userResult.data;
        }
      } catch (userError) {
        console.warn('Could not get user details after login, but session is valid:', userError);
        // Create a basic user object from session data if available
        userData = {
          id: sessionResult.data.userId || 'unknown',
          email: email, // Use the email from login
          name: 'User'
        };
      }

      return {
        user: userData,
        session: sessionResult.data,
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const signupUser = createAsyncThunk(
  'auth/signupUser',
  async ({ email, password, name }, { rejectWithValue }) => {
    try {
      // In development mode, check if we should use mock authentication
      if (import.meta.env.VITE_APP_ENVIRONMENT === 'development' && import.meta.env.VITE_MOCK_AUTH === 'true') {
        console.log('Using mock signup for development');
        // Simulate a small delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        return {
          user: {
            id: 'mock-user-id',
            email: email,
            name: name || email.split('@')[0] || 'Developer User'
          },
          session: {
            userId: 'mock-user-id',
            sessionId: 'mock-session-id'
          },
        };
      }

      const createResult = await authService.createAccount(email, password, name);
      if (!createResult.success) {
        return rejectWithValue(createResult.error);
      }

      // After creating account, log them in
      const sessionResult = await authService.login(email, password);
      if (!sessionResult.success) {
        return rejectWithValue(sessionResult.error);
      }

      const userResult = await authService.getCurrentUser();
      if (!userResult.success) {
        return rejectWithValue(userResult.error);
      }

      return {
        user: userResult.data,
        session: sessionResult.data,
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Signup failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      // In development mode, check if we should use mock authentication
      if (import.meta.env.VITE_APP_ENVIRONMENT === 'development' && import.meta.env.VITE_MOCK_AUTH === 'true') {
        console.log('Using mock logout for development');
        // Simulate a small delay
        await new Promise(resolve => setTimeout(resolve, 300));
        return { message: 'Logged out successfully' };
      }

      const result = await authService.logout();
      if (!result.success) {
        return rejectWithValue(result.error);
      }
      return result.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      // In development mode, check if we should use mock authentication
      if (import.meta.env.VITE_APP_ENVIRONMENT === 'development' && import.meta.env.VITE_MOCK_AUTH === 'true') {
        console.log('Using mock authentication for development');
        return {
          user: {
            id: 'mock-user-id',
            email: 'developer@example.com',
            name: 'Developer User'
          },
          session: {
            userId: 'mock-user-id',
            sessionId: 'mock-session-id'
          },
          isAuthenticated: true,
        };
      }

      const sessionResult = await authService.getCurrentSession();
      if (!sessionResult.success) {
        return { user: null, session: null, isAuthenticated: false };
      }

      // Try to get user details, but don't fail if it doesn't work
      let userData = null;
      try {
        const userResult = await authService.getCurrentUser();
        if (userResult.success) {
          userData = userResult.data;
        }
      } catch (userError) {
        console.warn('Could not get user details, but session is valid:', userError);
        // Create a basic user object from session data if available
        userData = {
          id: sessionResult.data.userId || 'unknown',
          email: sessionResult.data.providerUid || 'user@example.com',
          name: 'User'
        };
      }

      return {
        user: userData,
        session: sessionResult.data,
        isAuthenticated: true,
      };
    } catch (error) {
      return { user: null, session: null, isAuthenticated: false };
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (userData, { rejectWithValue }) => {
    try {
      const result = await authService.updatePreferences(userData);
      if (!result.success) {
        return rejectWithValue(result.error);
      }
      return result.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Profile update failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Reset auth state
    resetAuth: (state) => {
      state.user = null;
      state.session = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.isInitialized = false;
    },
    
    // Set session manually (for OAuth callbacks)
    setSession: (state, action) => {
      state.session = action.payload;
      state.isAuthenticated = !!action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login user
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.session = action.payload.session;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      
      // Signup user
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.session = action.payload.session;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      
      // Logout user
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.session = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Check auth status
      .addCase(checkAuthStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.session = action.payload.session;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.session = null;
        state.isAuthenticated = false;
        state.isInitialized = true;
        state.error = null;
      })
      
      // Update user profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = { ...state.user, ...action.payload };
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  resetAuth,
  setSession,
} = authSlice.actions;

// Basic selectors (kept for backward compatibility)
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectSession = (state) => state.auth.session;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectIsInitialized = (state) => state.auth.isInitialized;

// Note: Memoized selectors are available in src/store/selectors/index.js

export default authSlice.reducer;