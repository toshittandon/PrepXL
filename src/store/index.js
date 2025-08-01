import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from './api/baseApi';
import './api/dashboardApi'; // Import to register endpoints
import './api/reportApi'; // Import to register endpoints
import authSlice from './slices/authSlice';
import interviewSlice from './slices/interviewSlice';
import resumeSlice from './slices/resumeSlice';
import reportSlice from './slices/reportSlice';
import uiSlice from './slices/uiSlice';
import { 
  errorMiddleware, 
  networkStatusMiddleware, 
  performanceMiddleware,
  sanitizationMiddleware 
} from './middleware/errorMiddleware';

export const store = configureStore({
  reducer: {
    // API slice
    [baseApi.reducerPath]: baseApi.reducer,
    
    // Feature slices
    auth: authSlice,
    interview: interviewSlice,
    resume: resumeSlice,
    report: reportSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [baseApi.util.resetApiState.type],
      },
    })
    .concat(baseApi.middleware)
    .concat(errorMiddleware)
    .concat(networkStatusMiddleware)
    .concat(performanceMiddleware)
    .concat(sanitizationMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Setup listeners for RTK Query
setupListeners(store.dispatch);

// Export types for TypeScript usage (if needed later)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;