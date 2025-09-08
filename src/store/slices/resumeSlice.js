import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { uploadResumeFile } from '../../services/appwrite/storage.js'
import { createResumeRecord, updateResumeAnalysis } from '../../services/appwrite/database.js'
import { analyzeResume } from '../../services/ai/resumeAnalysis.js'
import { processResumeFile } from '../../utils/textExtraction.js'
import { getConfig } from '../../utils/envConfig.js'

const config = getConfig()

// Mock implementations removed for production

const initialState = {
  resumes: [],
  currentAnalysis: null,
  uploading: false,
  uploadProgress: 0,
  analyzing: false,
  error: null
}

// Text extraction is now handled by the processResumeFile utility

// Async thunk for uploading and analyzing resume
export const uploadResume = createAsyncThunk(
  'resume/uploadResume',
  async ({ file, jobDescription, userId }, { dispatch, rejectWithValue, getState }) => {
    try {
      // Check current auth state first
      const state = getState()
      const currentUser = state.auth.user
      const currentSession = state.auth.session
      
      console.log('Current auth state:', { 
        hasUser: !!currentUser, 
        hasSession: !!currentSession,
        userId: currentUser?.id || currentUser?.$id,
        sessionId: currentSession?.$id
      })
      
      // Always validate session before upload, regardless of Redux state
      const { checkSessionValidity } = await import('../../utils/sessionValidator.js')
      
      try {
        console.log('Validating current session with Appwrite...')
        const sessionData = await checkSessionValidity()
        
        if (!sessionData.valid) {
          throw new Error('No valid session found')
        }
        
        console.log('Session validation result:', {
          hasValidSession: !!sessionData.session,
          hasValidUser: !!sessionData.user,
          validUserId: sessionData.userId
        })
        
        // Use validated session data
        const validSession = sessionData.session
        const validUser = sessionData.user
      } catch (sessionError) {
        console.error('Session validation failed:', sessionError)
        
        // Dispatch auth error event for the AuthErrorBoundary to handle
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            const authErrorEvent = new CustomEvent('authError', {
              detail: {
                code: 401,
                message: 'Authentication required. Please log in again.',
                type: 'session_expired',
                originalError: sessionError,
                context: 'resume_upload_validation'
              }
            })
            window.dispatchEvent(authErrorEvent)
          }, 0)
        }
        
        throw new Error('Authentication required. Please log in again.')
      }
      
      if (!validSession || !validUser) {
        console.error('No valid session or user found')
        
        // Dispatch auth error event for the AuthErrorBoundary to handle
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            const authErrorEvent = new CustomEvent('authError', {
              detail: {
                code: 401,
                message: 'Authentication required. Please log in again.',
                type: 'session_expired',
                context: 'resume_upload_no_valid_session'
              }
            })
            window.dispatchEvent(authErrorEvent)
          }, 0)
        }
        
        throw new Error('Authentication required. Please log in again.')
      }
      
      // Use the validated user ID
      const finalUserId = validUser.id || validUser.$id
      
      if (!finalUserId) {
        throw new Error('User ID not found in validated session.')
      }
      
      console.log('Using validated user ID:', finalUserId)
      
      dispatch(setUploadProgress(10))
      
      let uploadResult, resumeRecord, analysisResult, updatedResume
      
      // Production upload process
      // Step 1: Upload file to storage
      uploadResult = await uploadResumeFile(file, finalUserId, (progress) => {
        // Update progress for file upload (10-40%)
        const uploadProgress = 10 + (progress.percentage * 0.3)
        dispatch(setUploadProgress(uploadProgress))
      })
      
      dispatch(setUploadProgress(40))
      
      // Step 2: Create resume record in database
      const resumeData = {
        userId: finalUserId,
        fileId: uploadResult.fileId,
        fileName: uploadResult.fileName,
        jobDescription,
        uploadedAt: uploadResult.uploadedAt
      }
      
      resumeRecord = await createResumeRecord(resumeData)
      dispatch(setUploadProgress(50))
      
      // Step 3: Extract text from uploaded file
      dispatch(setUploadProgress(60))
      const resumeText = await processResumeFile(file)
      
      // Step 4: Analyze resume with AI
      dispatch(setUploadProgress(70))
      analysisResult = await analyzeResume({
        resumeText,
        jobDescriptionText: jobDescription
      })
      
      dispatch(setUploadProgress(80))
      
      // Step 5: Update resume record with analysis results
      updatedResume = await updateResumeAnalysis(resumeRecord.id, analysisResult)
      
      dispatch(setUploadProgress(100))
      
      return {
        resumeId: updatedResume.id || updatedResume.$id,
        resume: updatedResume
      }
    } catch (error) {
      console.error('Upload error:', error)
      return rejectWithValue(error.message || 'Failed to upload and analyze resume')
    }
  }
)

// Async thunk for fetching user resumes
export const fetchUserResumes = createAsyncThunk(
  'resume/fetchUserResumes',
  async (userId, { rejectWithValue }) => {
    try {
      const { getUserResumes } = await import('../../services/appwrite/database.js')
      const resumes = await getUserResumes(userId)
      return resumes
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch resumes')
    }
  }
)

// Async thunk for fetching specific resume analysis
export const fetchResumeAnalysis = createAsyncThunk(
  'resume/fetchResumeAnalysis',
  async (resumeId, { rejectWithValue }) => {
    try {
      // Fetch resume from database
      const { getResumeById } = await import('../../services/appwrite/database.js')
      const resume = await getResumeById(resumeId)
      return resume
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch resume analysis')
    }
  }
)

const resumeSlice = createSlice({
  name: 'resume',
  initialState,
  reducers: {
    setUploading: (state, action) => {
      state.uploading = action.payload
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload
    },
    setAnalyzing: (state, action) => {
      state.analyzing = action.payload
    },
    addResume: (state, action) => {
      state.resumes.push(action.payload)
    },
    setResumes: (state, action) => {
      state.resumes = action.payload
    },
    setCurrentAnalysis: (state, action) => {
      state.currentAnalysis = action.payload
    },
    updateResume: (state, action) => {
      const index = state.resumes.findIndex(resume => resume.id === action.payload.id)
      if (index !== -1) {
        state.resumes[index] = action.payload
      }
    },
    removeResume: (state, action) => {
      state.resumes = state.resumes.filter(resume => resume.id !== action.payload)
    },
    setError: (state, action) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    clearUploadState: (state) => {
      state.uploading = false
      state.uploadProgress = 0
      state.error = null
    },
    reset: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // Upload resume cases
      .addCase(uploadResume.pending, (state) => {
        state.uploading = true
        state.uploadProgress = 0
        state.error = null
      })
      .addCase(uploadResume.fulfilled, (state, action) => {
        state.uploading = false
        state.uploadProgress = 100
        state.resumes.push(action.payload.resume)
        state.currentAnalysis = action.payload.resume
        state.error = null
      })
      .addCase(uploadResume.rejected, (state, action) => {
        state.uploading = false
        state.uploadProgress = 0
        state.error = action.payload
      })
      
      // Fetch user resumes cases
      .addCase(fetchUserResumes.pending, (state) => {
        state.error = null
      })
      .addCase(fetchUserResumes.fulfilled, (state, action) => {
        state.resumes = action.payload
        state.error = null
      })
      .addCase(fetchUserResumes.rejected, (state, action) => {
        state.error = action.payload
      })
      
      // Fetch resume analysis cases
      .addCase(fetchResumeAnalysis.pending, (state) => {
        state.analyzing = true
        state.error = null
      })
      .addCase(fetchResumeAnalysis.fulfilled, (state, action) => {
        state.analyzing = false
        state.currentAnalysis = action.payload
        state.error = null
      })
      .addCase(fetchResumeAnalysis.rejected, (state, action) => {
        state.analyzing = false
        state.error = action.payload
      })
  }
})

export const {
  setUploading,
  setUploadProgress,
  setAnalyzing,
  addResume,
  setResumes,
  setCurrentAnalysis,
  updateResume,
  removeResume,
  setError,
  clearError,
  clearUploadState,
  reset
} = resumeSlice.actions

export default resumeSlice.reducer