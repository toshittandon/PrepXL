import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: false,
  currentModal: null,
  notifications: [],
  theme: 'light',
  loading: {
    global: false,
    components: {},
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Toggle sidebar
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    
    // Set sidebar state
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    
    // Open modal
    openModal: (state, action) => {
      state.currentModal = action.payload;
    },
    
    // Close modal
    closeModal: (state) => {
      state.currentModal = null;
    },
    
    // Add notification
    addNotification: (state, action) => {
      const notification = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        type: 'info',
        duration: 5000,
        persistent: false,
        ...action.payload,
      };
      
      // Prevent duplicate notifications
      const isDuplicate = state.notifications.some(existing => 
        existing.type === notification.type &&
        existing.title === notification.title &&
        existing.message === notification.message &&
        Date.now() - new Date(existing.timestamp).getTime() < 5000
      );
      
      if (!isDuplicate) {
        state.notifications.push(notification);
        
        // Limit total notifications to prevent memory issues
        if (state.notifications.length > 10) {
          state.notifications = state.notifications.slice(-10);
        }
      }
    },
    
    // Remove notification
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    
    // Clear all notifications
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // Set theme
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    
    // Set global loading
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload;
    },
    
    // Set component loading
    setComponentLoading: (state, action) => {
      const { component, loading } = action.payload;
      state.loading.components[component] = loading;
    },
    
    // Clear component loading
    clearComponentLoading: (state, action) => {
      delete state.loading.components[action.payload];
    },
    
    // Clear all loading states
    clearAllLoading: (state) => {
      state.loading.global = false;
      state.loading.components = {};
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  openModal,
  closeModal,
  addNotification,
  removeNotification,
  clearNotifications,
  setTheme,
  setGlobalLoading,
  setComponentLoading,
  clearComponentLoading,
  clearAllLoading,
} = uiSlice.actions;

// Add compatibility functions for tests
export const setLoading = (payload) => {
  if (typeof payload === 'boolean') {
    return setGlobalLoading(payload);
  } else if (typeof payload === 'object' && payload.operation) {
    return setComponentLoading({ component: payload.operation, loading: payload.loading });
  }
  return setGlobalLoading(payload);
};

// Selectors
export const selectUI = (state) => state.ui;
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectCurrentModal = (state) => state.ui.currentModal;
export const selectNotifications = (state) => state.ui.notifications;
export const selectTheme = (state) => state.ui.theme;
export const selectGlobalLoading = (state) => state.ui.loading.global;
export const selectComponentLoading = (component) => (state) => 
  state.ui.loading.components[component] || false;

// Add compatibility selector for tests
export const selectIsLoading = (state) => state.ui.loading.global;

export default uiSlice.reducer;