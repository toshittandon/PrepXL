import { configureStore } from '@reduxjs/toolkit'

// Import slices
import authSlice from './slices/authSlice'
import interviewSlice from './slices/interviewSlice'
import resumeSlice from './slices/resumeSlice'
import librarySlice from './slices/librarySlice'
import adminSlice from './slices/adminSlice'
import uiSlice from './slices/uiSlice'

// Import API slices
import { appwriteApi } from './api/appwriteApi'
import { aiApi } from './api/aiApi'

export const store = configureStore({
  reducer: {
    // Add slices
    auth: authSlice,
    interview: interviewSlice,
    resume: resumeSlice,
    library: librarySlice,
    admin: adminSlice,
    ui: uiSlice,
    // Add API reducers
    [appwriteApi.reducerPath]: appwriteApi.reducer,
    [aiApi.reducerPath]: aiApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST', 
          'persist/REHYDRATE',
          // Ignore RTK Query action types
          'api/executeQuery/pending',
          'api/executeQuery/fulfilled',
          'api/executeQuery/rejected',
          'api/executeMutation/pending',
          'api/executeMutation/fulfilled',
          'api/executeMutation/rejected',
        ],
      },
    })
    // Add API middleware
    .concat(appwriteApi.middleware)
    .concat(aiApi.middleware),
})

// Export store for use in components
export default store