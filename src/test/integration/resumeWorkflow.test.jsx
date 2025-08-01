import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockUser, createMockFile, mockAppwriteServices, mockAiServices } from '../testUtils';
import ResumeUpload from '../../pages/resume/ResumeUpload';
import ResumeAnalysis from '../../pages/resume/ResumeAnalysis';

// Mock the services
vi.mock('../../services/appwrite/storage.js', () => ({
  storageService: mockAppwriteServices.storage,
}));

vi.mock('../../services/appwrite/database.js', () => ({
  databaseService: mockAppwriteServices.database,
}));

vi.mock('../../services/ai/resumeAnalysis.js', () => ({
  resumeAnalysisService: mockAiServices,
}));

// Mock React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ resumeId: 'resume123' }),
  };
});

// Mock file reading
global.FileReader = class {
  constructor() {
    this.readAsText = vi.fn();
    this.result = '';
  }
  
  readAsText(file) {
    setTimeout(() => {
      this.result = 'Mock resume content: John Doe, Software Engineer with 5 years experience...';
      this.onload?.();
    }, 0);
  }
};

describe('Resume Workflow Integration', () => {
  const authenticatedState = {
    auth: {
      user: mockUser,
      session: { $id: 'session123' },
      isAuthenticated: true,
      isInitialized: true,
      loading: false,
      error: null,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Resume Upload Flow', () => {
    it('should complete full resume upload and analysis workflow', async () => {
      const mockFile = createMockFile('resume.pdf', 'application/pdf', 1024 * 1024); // 1MB
      const mockFileResponse = { $id: 'file123', name: 'resume.pdf' };
      const mockResumeResponse = {
        $id: 'resume123',
        userId: mockUser.$id,
        fileId: 'file123',
        fileName: 'resume.pdf',
        analysisResults: null,
        $createdAt: new Date().toISOString(),
      };
      const mockAnalysisResults = {
        atsKeywords: ['JavaScript', 'React', 'Node.js', 'Python'],
        actionVerbs: ['Developed', 'Implemented', 'Led', 'Optimized'],
        quantificationSuggestions: [
          'Add specific metrics to "Led development team"',
          'Include percentage improvements for "Optimized application performance"',
        ],
        overallScore: 78,
      };

      // Mock successful upload
      mockAppwriteServices.storage.uploadFile.mockResolvedValue({
        success: true,
        data: mockFileResponse,
      });

      // Mock database creation
      mockAppwriteServices.database.createDocument.mockResolvedValue({
        success: true,
        data: mockResumeResponse,
      });

      // Mock AI analysis
      mockAiServices.analyzeResume.mockResolvedValue({
        success: true,
        data: mockAnalysisResults,
      });

      // Mock database update with analysis
      mockAppwriteServices.database.updateDocument.mockResolvedValue({
        success: true,
        data: { ...mockResumeResponse, analysisResults: mockAnalysisResults },
      });

      const { store } = renderWithProviders(<ResumeUpload />, { preloadedState: authenticatedState });

      // Should show upload interface
      expect(screen.getByText(/upload your resume/i)).toBeInTheDocument();
      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();

      // Upload file via file input
      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      // Should show file preview
      await waitFor(() => {
        expect(screen.getByText('resume.pdf')).toBeInTheDocument();
        expect(screen.getByText(/1.0 MB/)).toBeInTheDocument();
      });

      // Click upload button
      const uploadButton = screen.getByRole('button', { name: /upload resume/i });
      fireEvent.click(uploadButton);

      // Should show upload progress
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        expect(screen.getByText(/uploading/i)).toBeInTheDocument();
      });

      // Should show analysis progress
      await waitFor(() => {
        expect(screen.getByText(/analyzing/i)).toBeInTheDocument();
      });

      // Should complete and navigate to analysis
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/resume/analysis/resume123');
      });

      // Verify all services were called correctly
      expect(mockAppwriteServices.storage.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          file: mockFile,
          bucketId: expect.any(String),
        })
      );

      expect(mockAppwriteServices.database.createDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          collectionId: expect.any(String),
          data: expect.objectContaining({
            userId: mockUser.$id,
            fileId: 'file123',
            fileName: 'resume.pdf',
          }),
        })
      );

      expect(mockAiServices.analyzeResume).toHaveBeenCalledWith(
        'Mock resume content: John Doe, Software Engineer with 5 years experience...'
      );

      // Check Redux state
      const finalState = store.getState();
      expect(finalState.resume.resumes).toHaveLength(1);
      expect(finalState.resume.currentAnalysis).toEqual(mockAnalysisResults);
      expect(finalState.resume.uploading).toBe(false);
      expect(finalState.resume.analyzing).toBe(false);
    });

    it('should handle file validation errors', async () => {
      const invalidFile = createMockFile('document.txt', 'text/plain', 1024);

      renderWithProviders(<ResumeUpload />, { preloadedState: authenticatedState });

      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
        expect(screen.getByText(/please upload a PDF/i)).toBeInTheDocument();
      });

      // Upload button should be disabled
      const uploadButton = screen.getByRole('button', { name: /upload resume/i });
      expect(uploadButton).toBeDisabled();
    });

    it('should handle file size validation', async () => {
      const largeFile = createMockFile('large-resume.pdf', 'application/pdf', 10 * 1024 * 1024); // 10MB

      renderWithProviders(<ResumeUpload />, { preloadedState: authenticatedState });

      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      // Should show size error
      await waitFor(() => {
        expect(screen.getByText(/file too large/i)).toBeInTheDocument();
        expect(screen.getByText(/maximum size is 5MB/i)).toBeInTheDocument();
      });
    });

    it('should handle drag and drop upload', async () => {
      const mockFile = createMockFile('resume.pdf', 'application/pdf', 1024 * 1024);

      renderWithProviders(<ResumeUpload />, { preloadedState: authenticatedState });

      const dropZone = screen.getByTestId('drop-zone');

      // Simulate drag enter
      fireEvent.dragEnter(dropZone, {
        dataTransfer: { files: [mockFile] },
      });

      await waitFor(() => {
        expect(dropZone).toHaveClass('border-blue-500');
      });

      // Simulate drop
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [mockFile] },
      });

      // Should show file preview
      await waitFor(() => {
        expect(screen.getByText('resume.pdf')).toBeInTheDocument();
      });
    });

    it('should handle upload errors gracefully', async () => {
      const mockFile = createMockFile('resume.pdf', 'application/pdf', 1024 * 1024);

      mockAppwriteServices.storage.uploadFile.mockResolvedValue({
        success: false,
        error: 'Storage quota exceeded',
      });

      renderWithProviders(<ResumeUpload />, { preloadedState: authenticatedState });

      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      const uploadButton = screen.getByRole('button', { name: /upload resume/i });
      fireEvent.click(uploadButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/storage quota exceeded/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });

      // Should reset upload state
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('should handle analysis errors and allow retry', async () => {
      const mockFile = createMockFile('resume.pdf', 'application/pdf', 1024 * 1024);
      const mockFileResponse = { $id: 'file123', name: 'resume.pdf' };
      const mockResumeResponse = {
        $id: 'resume123',
        userId: mockUser.$id,
        fileId: 'file123',
        fileName: 'resume.pdf',
        analysisResults: null,
      };

      // Mock successful upload but failed analysis
      mockAppwriteServices.storage.uploadFile.mockResolvedValue({
        success: true,
        data: mockFileResponse,
      });

      mockAppwriteServices.database.createDocument.mockResolvedValue({
        success: true,
        data: mockResumeResponse,
      });

      mockAiServices.analyzeResume.mockResolvedValue({
        success: false,
        error: 'Analysis service temporarily unavailable',
      });

      renderWithProviders(<ResumeUpload />, { preloadedState: authenticatedState });

      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      const uploadButton = screen.getByRole('button', { name: /upload resume/i });
      fireEvent.click(uploadButton);

      // Should show analysis error
      await waitFor(() => {
        expect(screen.getByText(/analysis service temporarily unavailable/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry analysis/i })).toBeInTheDocument();
      });

      // Should still navigate to analysis page (with error state)
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/resume/analysis/resume123');
      });
    });
  });

  describe('Resume Analysis Display', () => {
    it('should display comprehensive analysis results', async () => {
      const mockAnalysisResults = {
        atsKeywords: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
        actionVerbs: ['Developed', 'Implemented', 'Led', 'Optimized', 'Designed'],
        quantificationSuggestions: [
          'Add specific metrics to "Led development team"',
          'Include percentage improvements for "Optimized application performance"',
          'Specify number of users for "Designed user interface"',
        ],
        overallScore: 82,
        recommendations: [
          'Include more quantifiable achievements',
          'Add specific technologies and frameworks',
          'Mention project outcomes and impact',
        ],
      };

      const mockResume = {
        $id: 'resume123',
        userId: mockUser.$id,
        fileName: 'resume.pdf',
        analysisResults: mockAnalysisResults,
        $createdAt: new Date().toISOString(),
      };

      mockAppwriteServices.database.getDocument.mockResolvedValue({
        success: true,
        data: mockResume,
      });

      const preloadedState = {
        ...authenticatedState,
        resume: {
          resumes: [mockResume],
          currentAnalysis: mockAnalysisResults,
          uploading: false,
          analyzing: false,
          loading: false,
          error: null,
        },
      };

      renderWithProviders(<ResumeAnalysis />, { preloadedState });

      // Should display overall score
      await waitFor(() => {
        expect(screen.getByText('82')).toBeInTheDocument();
        expect(screen.getByText(/overall score/i)).toBeInTheDocument();
      });

      // Should display ATS keywords
      expect(screen.getByText(/ats keywords/i)).toBeInTheDocument();
      mockAnalysisResults.atsKeywords.forEach(keyword => {
        expect(screen.getByText(keyword)).toBeInTheDocument();
      });

      // Should display action verbs
      expect(screen.getByText(/action verbs/i)).toBeInTheDocument();
      mockAnalysisResults.actionVerbs.forEach(verb => {
        expect(screen.getByText(verb)).toBeInTheDocument();
      });

      // Should display suggestions
      expect(screen.getByText(/suggestions/i)).toBeInTheDocument();
      mockAnalysisResults.quantificationSuggestions.forEach(suggestion => {
        expect(screen.getByText(suggestion)).toBeInTheDocument();
      });

      // Should display recommendations
      expect(screen.getByText(/recommendations/i)).toBeInTheDocument();
      mockAnalysisResults.recommendations.forEach(recommendation => {
        expect(screen.getByText(recommendation)).toBeInTheDocument();
      });
    });

    it('should handle loading state while fetching analysis', async () => {
      mockAppwriteServices.database.getDocument.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const preloadedState = {
        ...authenticatedState,
        resume: {
          resumes: [],
          currentAnalysis: null,
          uploading: false,
          analyzing: false,
          loading: true,
          error: null,
        },
      };

      renderWithProviders(<ResumeAnalysis />, { preloadedState });

      // Should show loading state
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/loading analysis/i)).toBeInTheDocument();
    });

    it('should handle missing analysis results', async () => {
      const mockResume = {
        $id: 'resume123',
        userId: mockUser.$id,
        fileName: 'resume.pdf',
        analysisResults: null, // No analysis yet
        $createdAt: new Date().toISOString(),
      };

      mockAppwriteServices.database.getDocument.mockResolvedValue({
        success: true,
        data: mockResume,
      });

      const preloadedState = {
        ...authenticatedState,
        resume: {
          resumes: [mockResume],
          currentAnalysis: null,
          uploading: false,
          analyzing: false,
          loading: false,
          error: null,
        },
      };

      renderWithProviders(<ResumeAnalysis />, { preloadedState });

      // Should show analysis pending state
      await waitFor(() => {
        expect(screen.getByText(/analysis pending/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /start analysis/i })).toBeInTheDocument();
      });
    });

    it('should allow re-analysis of existing resume', async () => {
      const mockResume = {
        $id: 'resume123',
        userId: mockUser.$id,
        fileName: 'resume.pdf',
        analysisResults: {
          atsKeywords: ['JavaScript'],
          actionVerbs: ['Developed'],
          quantificationSuggestions: [],
          overallScore: 65,
        },
        $createdAt: new Date().toISOString(),
      };

      const newAnalysisResults = {
        atsKeywords: ['JavaScript', 'React', 'TypeScript'],
        actionVerbs: ['Developed', 'Implemented', 'Led'],
        quantificationSuggestions: ['Add metrics to achievements'],
        overallScore: 78,
      };

      mockAppwriteServices.database.getDocument.mockResolvedValue({
        success: true,
        data: mockResume,
      });

      mockAiServices.analyzeResume.mockResolvedValue({
        success: true,
        data: newAnalysisResults,
      });

      mockAppwriteServices.database.updateDocument.mockResolvedValue({
        success: true,
        data: { ...mockResume, analysisResults: newAnalysisResults },
      });

      const preloadedState = {
        ...authenticatedState,
        resume: {
          resumes: [mockResume],
          currentAnalysis: mockResume.analysisResults,
          uploading: false,
          analyzing: false,
          loading: false,
          error: null,
        },
      };

      const { store } = renderWithProviders(<ResumeAnalysis />, { preloadedState });

      // Should show current analysis
      await waitFor(() => {
        expect(screen.getByText('65')).toBeInTheDocument();
      });

      // Click re-analyze button
      const reAnalyzeButton = screen.getByRole('button', { name: /re-analyze/i });
      fireEvent.click(reAnalyzeButton);

      // Should show analyzing state
      await waitFor(() => {
        expect(screen.getByText(/analyzing/i)).toBeInTheDocument();
        expect(screen.getByRole('status')).toBeInTheDocument();
      });

      // Should update with new results
      await waitFor(() => {
        expect(screen.getByText('78')).toBeInTheDocument();
        expect(screen.getByText('TypeScript')).toBeInTheDocument();
      });

      // Check Redux state was updated
      const finalState = store.getState();
      expect(finalState.resume.currentAnalysis).toEqual(newAnalysisResults);
    });
  });

  describe('Resume Management', () => {
    it('should display list of user resumes', async () => {
      const mockResumes = [
        {
          $id: 'resume1',
          fileName: 'software-engineer-resume.pdf',
          analysisResults: { overallScore: 85 },
          $createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          $id: 'resume2',
          fileName: 'product-manager-resume.pdf',
          analysisResults: { overallScore: 78 },
          $createdAt: '2024-01-10T10:00:00.000Z',
        },
      ];

      const preloadedState = {
        ...authenticatedState,
        resume: {
          resumes: mockResumes,
          currentAnalysis: null,
          uploading: false,
          analyzing: false,
          loading: false,
          error: null,
        },
      };

      renderWithProviders(<ResumeUpload />, { preloadedState });

      // Should show existing resumes
      expect(screen.getByText('software-engineer-resume.pdf')).toBeInTheDocument();
      expect(screen.getByText('product-manager-resume.pdf')).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('78')).toBeInTheDocument();
    });

    it('should allow deleting resumes', async () => {
      const mockResume = {
        $id: 'resume123',
        fileId: 'file123',
        fileName: 'old-resume.pdf',
        analysisResults: { overallScore: 70 },
        $createdAt: new Date().toISOString(),
      };

      mockAppwriteServices.database.deleteDocument.mockResolvedValue({
        success: true,
        data: {},
      });

      mockAppwriteServices.storage.deleteFile.mockResolvedValue({
        success: true,
        data: {},
      });

      const preloadedState = {
        ...authenticatedState,
        resume: {
          resumes: [mockResume],
          currentAnalysis: null,
          uploading: false,
          analyzing: false,
          loading: false,
          error: null,
        },
      };

      const { store } = renderWithProviders(<ResumeUpload />, { preloadedState });

      // Should show resume
      expect(screen.getByText('old-resume.pdf')).toBeInTheDocument();

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      fireEvent.click(deleteButton);

      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      });

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);

      // Should delete from services
      await waitFor(() => {
        expect(mockAppwriteServices.database.deleteDocument).toHaveBeenCalledWith({
          collectionId: expect.any(String),
          documentId: 'resume123',
        });
        expect(mockAppwriteServices.storage.deleteFile).toHaveBeenCalledWith({
          bucketId: expect.any(String),
          fileId: 'file123',
        });
      });

      // Should remove from Redux state
      const finalState = store.getState();
      expect(finalState.resume.resumes).toHaveLength(0);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network errors during upload', async () => {
      const mockFile = createMockFile('resume.pdf', 'application/pdf', 1024 * 1024);

      mockAppwriteServices.storage.uploadFile.mockRejectedValue(
        new Error('Network connection failed')
      );

      renderWithProviders(<ResumeUpload />, { preloadedState: authenticatedState });

      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      const uploadButton = screen.getByRole('button', { name: /upload resume/i });
      fireEvent.click(uploadButton);

      // Should show network error
      await waitFor(() => {
        expect(screen.getByText(/network connection failed/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });

    it('should handle partial upload failures', async () => {
      const mockFile = createMockFile('resume.pdf', 'application/pdf', 1024 * 1024);
      const mockFileResponse = { $id: 'file123', name: 'resume.pdf' };

      // Upload succeeds but database creation fails
      mockAppwriteServices.storage.uploadFile.mockResolvedValue({
        success: true,
        data: mockFileResponse,
      });

      mockAppwriteServices.database.createDocument.mockResolvedValue({
        success: false,
        error: 'Database connection timeout',
      });

      renderWithProviders(<ResumeUpload />, { preloadedState: authenticatedState });

      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      const uploadButton = screen.getByRole('button', { name: /upload resume/i });
      fireEvent.click(uploadButton);

      // Should show database error and cleanup option
      await waitFor(() => {
        expect(screen.getByText(/database connection timeout/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cleanup and retry/i })).toBeInTheDocument();
      });
    });

    it('should handle concurrent upload attempts', async () => {
      const mockFile1 = createMockFile('resume1.pdf', 'application/pdf', 1024 * 1024);
      const mockFile2 = createMockFile('resume2.pdf', 'application/pdf', 1024 * 1024);

      renderWithProviders(<ResumeUpload />, { preloadedState: authenticatedState });

      // Start first upload
      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [mockFile1] } });

      const uploadButton = screen.getByRole('button', { name: /upload resume/i });
      fireEvent.click(uploadButton);

      // Try to start second upload while first is in progress
      fireEvent.change(fileInput, { target: { files: [mockFile2] } });

      // Upload button should be disabled
      expect(uploadButton).toBeDisabled();
      expect(screen.getByText(/upload in progress/i)).toBeInTheDocument();
    });
  });
});