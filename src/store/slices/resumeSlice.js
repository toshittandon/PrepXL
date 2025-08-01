import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { databaseService } from '../../services/appwrite/database.js';
import { storageService } from '../../services/appwrite/storage.js';
import { resumeAnalysisService } from '../../services/ai/resumeAnalysis.js';

const initialState = {
  resumes: [],
  currentAnalysis: null,
  uploading: false,
  analyzing: false,
  loading: false,
  error: null,
  uploadProgress: 0,
};

// Async thunks for resume operations
export const uploadResumeThunk = createAsyncThunk(
  'resume/uploadResume',
  async ({ file, userId }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setUploading(true));
      dispatch(setUploadProgress(0));
      dispatch(clearError());

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        dispatch(setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        }));
      }, 200);

      const uploadResult = await storageService.uploadResume(file, userId);
      
      clearInterval(progressInterval);
      dispatch(setUploadProgress(100));

      if (!uploadResult.success) {
        return rejectWithValue(uploadResult.error);
      }

      // Create resume record in database
      const resumeData = {
        userId,
        fileId: uploadResult.data.id,
        fileName: uploadResult.data.name,
        status: 'uploaded'
      };

      const dbResult = await databaseService.createResume(resumeData);
      
      if (!dbResult.success) {
        // Clean up uploaded file if database creation fails
        await storageService.deleteFile(uploadResult.data.id);
        return rejectWithValue(dbResult.error);
      }

      return {
        ...dbResult.data,
        downloadUrl: uploadResult.data.downloadUrl
      };
    } catch (error) {
      return rejectWithValue({ message: error.message || 'Upload failed' });
    }
  }
);

export const analyzeResumeThunk = createAsyncThunk(
  'resume/analyzeResume',
  async ({ resumeId, file }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setAnalyzing(true));
      dispatch(clearError());

      // Extract text from file
      let resumeText;
      try {
        resumeText = await resumeAnalysisService.extractTextFromFile(file);
      } catch (textError) {
        // Update resume status to failed
        await databaseService.updateResume(resumeId, {
          status: 'failed'
        });
        return rejectWithValue({ message: 'Failed to extract text from file' });
      }

      // Validate resume text
      resumeAnalysisService.validateResumeContent(resumeText);

      // Perform AI analysis
      const analysisResult = await resumeAnalysisService.analyzeResume(resumeText);
      
      if (!analysisResult.success) {
        await databaseService.updateResume(resumeId, {
          status: 'failed'
        });
        return rejectWithValue(analysisResult.error);
      }

      // Update resume record with analysis results
      const updateData = {
        status: 'analyzed'
      };

      const dbResult = await databaseService.updateResume(resumeId, updateData);
      
      if (!dbResult.success) {
        return rejectWithValue(dbResult.error);
      }

      return {
        resumeId,
        analysisResults: analysisResult.data.analysisResults
      };
    } catch (error) {
      // Update resume status to failed
      await databaseService.updateResume(resumeId, {
        status: 'failed'
      });
      return rejectWithValue({ message: error.message || 'Analysis failed' });
    }
  }
);

export const uploadAndAnalyzeResumeThunk = createAsyncThunk(
  'resume/uploadAndAnalyzeResume',
  async ({ file, userId }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setUploading(true));
      dispatch(setUploadProgress(0));
      dispatch(clearError());

      // Step 1: Upload file (30% progress)
      dispatch(setUploadProgress(10));
      const uploadResult = await storageService.uploadResume(file, userId);
      
      if (!uploadResult.success) {
        return rejectWithValue(uploadResult.error);
      }
      dispatch(setUploadProgress(30));

      // Step 2: Create resume record (50% progress)
      const resumeData = {
        userId,
        fileId: uploadResult.data.id,
        fileName: uploadResult.data.name,
        status: 'uploaded'
      };

      const dbResult = await databaseService.createResume(resumeData);
      
      if (!dbResult.success) {
        await storageService.deleteFile(uploadResult.data.id);
        return rejectWithValue(dbResult.error);
      }
      dispatch(setUploadProgress(50));

      // Step 3: Extract text and analyze (70% progress)
      dispatch(setAnalyzing(true));
      let resumeText;
      try {
        resumeText = await resumeAnalysisService.extractTextFromFile(file);
      } catch (textError) {
        await databaseService.updateResume(dbResult.data.id, {
          status: 'failed'
        });
        return rejectWithValue({ message: 'Failed to extract text from file' });
      }
      dispatch(setUploadProgress(70));

      // Step 4: Perform analysis (90% progress)
      const analysisResult = await resumeAnalysisService.analyzeResume(resumeText);
      
      if (!analysisResult.success) {
        await databaseService.updateResume(dbResult.data.id, {
          status: 'failed'
        });
        return rejectWithValue(analysisResult.error);
      }
      dispatch(setUploadProgress(90));

      // Step 5: Update resume with analysis results (100% progress)
      const finalUpdateData = {
        status: 'analyzed'
      };

      const finalDbResult = await databaseService.updateResume(dbResult.data.id, finalUpdateData);
      
      if (!finalDbResult.success) {
        return rejectWithValue(finalDbResult.error);
      }
      dispatch(setUploadProgress(100));

      return {
        ...finalDbResult.data,
        downloadUrl: uploadResult.data.downloadUrl,
        analysisResults: analysisResult.data.analysisResults
      };
    } catch (error) {
      return rejectWithValue({ message: error.message || 'Upload and analysis failed' });
    }
  }
);

export const fetchUserResumesThunk = createAsyncThunk(
  'resume/fetchUserResumes',
  async (userId, { rejectWithValue }) => {
    try {
      const result = await databaseService.getUserResumes(userId);
      
      if (!result.success) {
        return rejectWithValue(result.error);
      }

      return result.data;
    } catch (error) {
      return rejectWithValue({ message: error.message || 'Failed to fetch resumes' });
    }
  }
);

export const deleteResumeThunk = createAsyncThunk(
  'resume/deleteResume',
  async ({ resumeId, fileId }, { rejectWithValue }) => {
    try {
      // Delete from database first
      const dbResult = await databaseService.deleteResume(resumeId);
      
      if (!dbResult.success) {
        return rejectWithValue(dbResult.error);
      }

      // Delete file from storage
      if (fileId) {
        const storageResult = await storageService.deleteFile(fileId);
        if (!storageResult.success) {
          console.warn('Failed to delete file from storage:', storageResult.error);
          // Don't fail the entire operation if storage deletion fails
        }
      }

      return { resumeId };
    } catch (error) {
      return rejectWithValue({ message: error.message || 'Failed to delete resume' });
    }
  }
);

const resumeSlice = createSlice({
  name: 'resume',
  initialState,
  reducers: {
    // Set loading state
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    
    // Set error state
    setError: (state, action) => {
      state.error = action.payload;
      state.uploading = false;
      state.analyzing = false;
      state.loading = false;
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Set uploading state
    setUploading: (state, action) => {
      state.uploading = action.payload;
      if (!action.payload) {
        state.uploadProgress = 0;
      }
    },
    
    // Set analyzing state
    setAnalyzing: (state, action) => {
      state.analyzing = action.payload;
    },
    
    // Set upload progress
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    
    // Add resume
    addResume: (state, action) => {
      state.resumes.push(action.payload);
      state.uploading = false;
      state.uploadProgress = 0;
    },
    
    // Update resume
    updateResume: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.resumes.findIndex(resume => resume.id === id);
      if (index !== -1) {
        state.resumes[index] = { ...state.resumes[index], ...updates };
      }
    },
    
    // Remove resume
    removeResume: (state, action) => {
      state.resumes = state.resumes.filter(resume => resume.id !== action.payload);
    },
    
    // Set resumes list
    setResumes: (state, action) => {
      state.resumes = action.payload;
    },
    
    // Set current analysis
    setCurrentAnalysis: (state, action) => {
      state.currentAnalysis = action.payload;
      state.analyzing = false;
    },
    
    // Clear current analysis
    clearCurrentAnalysis: (state) => {
      state.currentAnalysis = null;
    },
    
    // Update analysis results for a resume
    updateResumeAnalysis: (state, action) => {
      const { resumeId, analysisResults } = action.payload;
      const index = state.resumes.findIndex(resume => resume.id === resumeId);
      if (index !== -1) {
        // Don't save analysisResults to database, just keep in local state
        state.resumes[index].status = 'analyzed';
      }
      state.currentAnalysis = analysisResults;
      state.analyzing = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload resume thunk
      .addCase(uploadResumeThunk.pending, (state) => {
        state.uploading = true;
        state.uploadProgress = 0;
        state.error = null;
      })
      .addCase(uploadResumeThunk.fulfilled, (state, action) => {
        state.uploading = false;
        state.uploadProgress = 0;
        state.resumes.push(action.payload);
        state.error = null;
      })
      .addCase(uploadResumeThunk.rejected, (state, action) => {
        state.uploading = false;
        state.uploadProgress = 0;
        state.error = action.payload?.message || 'Upload failed';
      })
      
      // Analyze resume thunk
      .addCase(analyzeResumeThunk.pending, (state) => {
        state.analyzing = true;
        state.error = null;
      })
      .addCase(analyzeResumeThunk.fulfilled, (state, action) => {
        state.analyzing = false;
        const { resumeId, analysisResults } = action.payload;
        const index = state.resumes.findIndex(resume => resume.id === resumeId);
        if (index !== -1) {
          // Don't save analysisResults to database, just keep in local state
          state.resumes[index].status = 'analyzed';
        }
        state.currentAnalysis = analysisResults;
        state.error = null;
      })
      .addCase(analyzeResumeThunk.rejected, (state, action) => {
        state.analyzing = false;
        state.error = action.payload?.message || 'Analysis failed';
      })
      
      // Upload and analyze resume thunk
      .addCase(uploadAndAnalyzeResumeThunk.pending, (state) => {
        state.uploading = true;
        state.analyzing = false;
        state.uploadProgress = 0;
        state.error = null;
      })
      .addCase(uploadAndAnalyzeResumeThunk.fulfilled, (state, action) => {
        state.uploading = false;
        state.analyzing = false;
        state.uploadProgress = 0;
        state.resumes.push(action.payload);
        state.currentAnalysis = action.payload.analysisResults;
        state.error = null;
      })
      .addCase(uploadAndAnalyzeResumeThunk.rejected, (state, action) => {
        state.uploading = false;
        state.analyzing = false;
        state.uploadProgress = 0;
        state.error = action.payload?.message || 'Upload and analysis failed';
      })
      
      // Fetch user resumes thunk
      .addCase(fetchUserResumesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserResumesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.resumes = action.payload;
        state.error = null;
      })
      .addCase(fetchUserResumesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch resumes';
      })
      
      // Delete resume thunk
      .addCase(deleteResumeThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteResumeThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.resumes = state.resumes.filter(resume => resume.id !== action.payload.resumeId);
        state.error = null;
      })
      .addCase(deleteResumeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to delete resume';
      });
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setUploading,
  setAnalyzing,
  setUploadProgress,
  addResume,
  updateResume,
  removeResume,
  setResumes,
  setCurrentAnalysis,
  clearCurrentAnalysis,
  updateResumeAnalysis,
} = resumeSlice.actions;

// Export thunks with expected names for tests
export const uploadResume = uploadResumeThunk;
export const analyzeResume = analyzeResumeThunk;
export const deleteResume = deleteResumeThunk;
export const getResumeAnalysis = fetchUserResumesThunk;

// Add missing reset action
export const resetResume = () => (dispatch) => {
  dispatch(setResumes([]));
  dispatch(clearCurrentAnalysis());
  dispatch(clearError());
  dispatch(setUploading(false));
  dispatch(setAnalyzing(false));
  dispatch(setUploadProgress(0));
};

// Selectors
export const selectResume = (state) => state.resume;
export const selectResumes = (state) => state.resume.resumes;
export const selectCurrentAnalysis = (state) => state.resume.currentAnalysis;
export const selectUploading = (state) => state.resume.uploading;
export const selectAnalyzing = (state) => state.resume.analyzing;
export const selectResumeLoading = (state) => state.resume.loading;
export const selectResumeError = (state) => state.resume.error;
export const selectUploadProgress = (state) => state.resume.uploadProgress;

// Additional selectors expected by tests
export const selectIsUploading = (state) => state.resume.uploading;
export const selectIsAnalyzing = (state) => state.resume.analyzing;

export default resumeSlice.reducer;