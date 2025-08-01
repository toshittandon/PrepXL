import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import resumeSlice, {
  uploadResume,
  analyzeResume,
  getResumeAnalysis,
  deleteResume,
  clearError,
  resetResume,
  selectResume,
  selectResumes,
  selectCurrentAnalysis,
  selectResumeLoading,
  selectResumeError,
  selectIsUploading,
  selectIsAnalyzing,
} from '../../../store/slices/resumeSlice.js';

// Mock the resume services
vi.mock('../../../services/appwrite/storage.js', () => ({
  storageService: {
    uploadFile: vi.fn(),
    deleteFile: vi.fn(),
  },
}));

vi.mock('../../../services/appwrite/database.js', () => ({
  databaseService: {
    createDocument: vi.fn(),
    getDocument: vi.fn(),
    listDocuments: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
  },
}));

vi.mock('../../../services/ai/resumeAnalysis.js', () => ({
  resumeAnalysisService: {
    analyzeResume: vi.fn(),
  },
}));

import { storageService } from '../../../services/appwrite/storage.js';
import { databaseService } from '../../../services/appwrite/database.js';
import { resumeAnalysisService } from '../../../services/ai/resumeAnalysis.js';

describe('resumeSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        resume: resumeSlice,
      },
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().resume;
      expect(state).toEqual({
        resumes: [],
        currentAnalysis: null,
        uploading: false,
        analyzing: false,
        loading: false,
        error: null,
      });
    });
  });

  describe('reducers', () => {
    it('should clear error', () => {
      // Set initial error state
      store.dispatch({ type: 'resume/uploadResume/rejected', payload: 'Upload failed' });
      expect(store.getState().resume.error).toBe('Upload failed');

      // Clear error
      store.dispatch(clearError());
      expect(store.getState().resume.error).toBeNull();
    });

    it('should reset resume state', () => {
      // Set some state
      store.dispatch({
        type: 'resume/uploadResume/fulfilled',
        payload: {
          $id: 'resume123',
          fileName: 'test.pdf',
          analysisResults: { atsKeywords: ['React'] },
        },
      });

      // Reset resume
      store.dispatch(resetResume());
      const state = store.getState().resume;
      expect(state).toEqual({
        resumes: [],
        currentAnalysis: null,
        uploading: false,
        analyzing: false,
        loading: false,
        error: null,
      });
    });
  });

  describe('uploadResume async thunk', () => {
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const mockFileResponse = { $id: 'file123' };
    const mockResumeResponse = {
      $id: 'resume123',
      userId: 'user123',
      fileId: 'file123',
      fileName: 'test.pdf',
      analysisResults: null,
    };

    it('should handle successful resume upload', async () => {
      storageService.uploadFile.mockResolvedValue({ success: true, data: mockFileResponse });
      databaseService.createDocument.mockResolvedValue({ success: true, data: mockResumeResponse });

      await store.dispatch(uploadResume({ file: mockFile, userId: 'user123' }));

      const state = store.getState().resume;
      expect(state.uploading).toBe(false);
      expect(state.resumes).toContainEqual(mockResumeResponse);
      expect(state.error).toBeNull();
    });

    it('should handle upload failure', async () => {
      const errorMessage = 'File upload failed';
      storageService.uploadFile.mockResolvedValue({ success: false, error: errorMessage });

      await store.dispatch(uploadResume({ file: mockFile, userId: 'user123' }));

      const state = store.getState().resume;
      expect(state.uploading).toBe(false);
      expect(state.error).toBe(errorMessage);
      expect(state.resumes).toHaveLength(0);
    });

    it('should handle upload exception', async () => {
      storageService.uploadFile.mockRejectedValue(new Error('Network error'));

      await store.dispatch(uploadResume({ file: mockFile, userId: 'user123' }));

      const state = store.getState().resume;
      expect(state.uploading).toBe(false);
      expect(state.error).toBe('Network error');
    });

    it('should set uploading state during upload', () => {
      storageService.uploadFile.mockImplementation(() => new Promise(() => {})); // Never resolves

      store.dispatch(uploadResume({ file: mockFile, userId: 'user123' }));

      const state = store.getState().resume;
      expect(state.uploading).toBe(true);
      expect(state.error).toBeNull();
    });
  });

  describe('analyzeResume async thunk', () => {
    const mockAnalysisResults = {
      atsKeywords: ['JavaScript', 'React', 'Node.js'],
      actionVerbs: ['Developed', 'Implemented', 'Optimized'],
      quantificationSuggestions: ['Add metrics to achievements'],
    };

    it('should handle successful resume analysis', async () => {
      resumeAnalysisService.analyzeResume.mockResolvedValue({
        success: true,
        data: mockAnalysisResults,
      });
      databaseService.updateDocument.mockResolvedValue({
        success: true,
        data: { $id: 'resume123', analysisResults: mockAnalysisResults },
      });

      await store.dispatch(analyzeResume({ resumeId: 'resume123', resumeText: 'test content' }));

      const state = store.getState().resume;
      expect(state.analyzing).toBe(false);
      expect(state.currentAnalysis).toEqual(mockAnalysisResults);
      expect(state.error).toBeNull();
    });

    it('should handle analysis failure', async () => {
      const errorMessage = 'Analysis service unavailable';
      resumeAnalysisService.analyzeResume.mockResolvedValue({
        success: false,
        error: errorMessage,
      });

      await store.dispatch(analyzeResume({ resumeId: 'resume123', resumeText: 'test content' }));

      const state = store.getState().resume;
      expect(state.analyzing).toBe(false);
      expect(state.error).toBe(errorMessage);
      expect(state.currentAnalysis).toBeNull();
    });

    it('should set analyzing state during analysis', () => {
      resumeAnalysisService.analyzeResume.mockImplementation(() => new Promise(() => {})); // Never resolves

      store.dispatch(analyzeResume({ resumeId: 'resume123', resumeText: 'test content' }));

      const state = store.getState().resume;
      expect(state.analyzing).toBe(true);
      expect(state.error).toBeNull();
    });
  });

  describe('getResumeAnalysis async thunk', () => {
    const mockResume = {
      $id: 'resume123',
      analysisResults: {
        atsKeywords: ['Python', 'Django'],
        actionVerbs: ['Created', 'Managed'],
        quantificationSuggestions: ['Include specific numbers'],
      },
    };

    it('should handle successful analysis retrieval', async () => {
      databaseService.getDocument.mockResolvedValue({ success: true, data: mockResume });

      await store.dispatch(getResumeAnalysis('resume123'));

      const state = store.getState().resume;
      expect(state.loading).toBe(false);
      expect(state.currentAnalysis).toEqual(mockResume.analysisResults);
      expect(state.error).toBeNull();
    });

    it('should handle retrieval failure', async () => {
      const errorMessage = 'Resume not found';
      databaseService.getDocument.mockResolvedValue({ success: false, error: errorMessage });

      await store.dispatch(getResumeAnalysis('resume123'));

      const state = store.getState().resume;
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
      expect(state.currentAnalysis).toBeNull();
    });
  });

  describe('deleteResume async thunk', () => {
    it('should handle successful resume deletion', async () => {
      // Set initial state with a resume
      store.dispatch({
        type: 'resume/uploadResume/fulfilled',
        payload: { $id: 'resume123', fileId: 'file123', fileName: 'test.pdf' },
      });

      databaseService.deleteDocument.mockResolvedValue({ success: true, data: {} });
      storageService.deleteFile.mockResolvedValue({ success: true, data: {} });

      await store.dispatch(deleteResume({ resumeId: 'resume123', fileId: 'file123' }));

      const state = store.getState().resume;
      expect(state.loading).toBe(false);
      expect(state.resumes).not.toContainEqual(
        expect.objectContaining({ $id: 'resume123' })
      );
      expect(state.error).toBeNull();
    });

    it('should handle deletion failure', async () => {
      const errorMessage = 'Failed to delete resume';
      databaseService.deleteDocument.mockResolvedValue({ success: false, error: errorMessage });

      await store.dispatch(deleteResume({ resumeId: 'resume123', fileId: 'file123' }));

      const state = store.getState().resume;
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('selectors', () => {
    const mockState = {
      resume: {
        resumes: [
          { $id: 'resume1', fileName: 'resume1.pdf' },
          { $id: 'resume2', fileName: 'resume2.pdf' },
        ],
        currentAnalysis: {
          atsKeywords: ['React', 'JavaScript'],
          actionVerbs: ['Developed', 'Implemented'],
          quantificationSuggestions: ['Add metrics'],
        },
        uploading: false,
        analyzing: true,
        loading: false,
        error: null,
      },
    };

    it('should select resume state', () => {
      expect(selectResume(mockState)).toEqual(mockState.resume);
    });

    it('should select resumes list', () => {
      expect(selectResumes(mockState)).toEqual(mockState.resume.resumes);
    });

    it('should select current analysis', () => {
      expect(selectCurrentAnalysis(mockState)).toEqual(mockState.resume.currentAnalysis);
    });

    it('should select loading state', () => {
      expect(selectResumeLoading(mockState)).toBe(false);
    });

    it('should select error', () => {
      expect(selectResumeError(mockState)).toBeNull();
    });

    it('should select uploading state', () => {
      expect(selectIsUploading(mockState)).toBe(false);
    });

    it('should select analyzing state', () => {
      expect(selectIsAnalyzing(mockState)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty file upload', async () => {
      const emptyFile = new File([''], 'empty.pdf', { type: 'application/pdf' });

      await store.dispatch(uploadResume({ file: emptyFile, userId: 'user123' }));

      const state = store.getState().resume;
      expect(state.error).toBeTruthy();
    });

    it('should handle invalid file type', async () => {
      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });

      await store.dispatch(uploadResume({ file: invalidFile, userId: 'user123' }));

      const state = store.getState().resume;
      expect(state.error).toBeTruthy();
    });

    it('should handle concurrent operations', async () => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      
      storageService.uploadFile.mockResolvedValue({ success: true, data: { $id: 'file123' } });
      databaseService.createDocument.mockResolvedValue({
        success: true,
        data: { $id: 'resume123', fileName: 'test.pdf' },
      });
      resumeAnalysisService.analyzeResume.mockResolvedValue({
        success: true,
        data: { atsKeywords: ['React'] },
      });

      // Start upload and analysis simultaneously
      const uploadPromise = store.dispatch(uploadResume({ file: mockFile, userId: 'user123' }));
      const analysisPromise = store.dispatch(analyzeResume({ resumeId: 'resume123', resumeText: 'test' }));

      await Promise.all([uploadPromise, analysisPromise]);

      const state = store.getState().resume;
      expect(state.uploading).toBe(false);
      expect(state.analyzing).toBe(false);
    });
  });
});