import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { uploadResumeFile } from '../../services/appwrite/storage.js'
import { createResumeRecord, updateResumeAnalysis } from '../../services/appwrite/database.js'
import { analyzeResume } from '../../services/ai/resumeAnalysis.js'
import { processResumeFile } from '../../utils/textExtraction.js'
import { getConfig } from '../../utils/envConfig.js'

const config = getConfig()

// Check if user ID indicates development mode
const isDevUser = (userId) => {
  return userId && userId.startsWith('dev-')
}

// Mock implementations for development mode
const createMockResumeRecord = (resumeData) => {
  return {
    id: `mock-resume-${Date.now()}`,
    $id: `mock-resume-${Date.now()}`,
    ...resumeData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

const updateMockResumeAnalysis = (resumeId, analysisResults) => {
  return {
    id: resumeId,
    $id: resumeId,
    analysisResults,
    updatedAt: new Date().toISOString()
  }
}

const uploadMockResumeFile = (file, userId) => {
  return {
    fileId: `mock-file-${Date.now()}`,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    uploadedAt: new Date().toISOString(),
    bucketId: 'mock-bucket'
  }
}

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
  async ({ file, jobDescription, userId }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setUploadProgress(10))
      
      let uploadResult, resumeRecord, analysisResult, updatedResume
      
      if (isDevUser(userId)) {
        // Mock upload process for development/testing
        console.log('🔧 Using mock upload process for development')
        
        // Step 1: Mock file upload
        uploadResult = uploadMockResumeFile(file, userId)
        dispatch(setUploadProgress(40))
        
        // Step 2: Mock resume record creation
        const resumeData = {
          userId,
          fileId: uploadResult.fileId,
          fileName: uploadResult.fileName,
          jobDescription,
          uploadedAt: uploadResult.uploadedAt
        }
        resumeRecord = createMockResumeRecord(resumeData)
        dispatch(setUploadProgress(50))
        
        // Step 3: Real text extraction (this should work with mock data)
        dispatch(setUploadProgress(60))
        const resumeText = await processResumeFile(file)
        
        // Step 4: Real AI analysis (this should work with mock data)
        dispatch(setUploadProgress(70))
        analysisResult = await analyzeResume({
          resumeText,
          jobDescriptionText: jobDescription
        })
        dispatch(setUploadProgress(80))
        
        // Step 5: Mock updated resume with analysis
        updatedResume = updateMockResumeAnalysis(resumeRecord.id, analysisResult)
        dispatch(setUploadProgress(100))
        
      } else {
        // Real upload process for production
        // Step 1: Upload file to storage
        uploadResult = await uploadResumeFile(file, userId, (progress) => {
          // Update progress for file upload (10-40%)
          const uploadProgress = 10 + (progress.percentage * 0.3)
          dispatch(setUploadProgress(uploadProgress))
        })
        
        dispatch(setUploadProgress(40))
        
        // Step 2: Create resume record in database
        const resumeData = {
          userId,
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
      }
      
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
  async (resumeId, { getState, rejectWithValue }) => {
    try {
      // Check if this is a mock resume
      if (resumeId && resumeId.startsWith('mock-resume-')) {
        // For mock resumes, check if we already have the data in the store
        const state = getState()
        const currentAnalysis = state.resume.currentAnalysis
        
        if (currentAnalysis && (currentAnalysis.id === resumeId || currentAnalysis.$id === resumeId)) {
          // Return the existing mock data
          return currentAnalysis
        } else {
          // Mock resume not found in store
          throw new Error('Mock resume analysis not found. Please upload the resume again.')
        }
      }
      
      // For real resumes, fetch from database
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