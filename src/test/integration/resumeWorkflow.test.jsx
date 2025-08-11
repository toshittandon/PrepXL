import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { ThemeProvider } from '../../contexts/ThemeContext.jsx'
import resumeSlice from '../../store/slices/resumeSlice.js'
import authSlice from '../../store/slices/authSlice.js'

// Mock file upload and AI services
vi.mock('../../services/appwrite/storage.js', () => ({
  uploadFile: vi.fn(),
  getFileUrl: vi.fn()
}))

vi.mock('../../services/ai/resumeService.js', () => ({
  analyzeResume: vi.fn()
}))

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      resume: resumeSlice
    },
    preloadedState: {
      auth: {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        session: { token: 'test-token' },
        loading: false,
        error: null
      },
      resume: {
        resumes: [],
        currentAnalysis: null,
        uploading: false,
        analyzing: false,
        error: null,
        ...initialState.resume
      }
    }
  })
}

const TestWrapper = ({ store, children }) => (
  <Provider store={store}>
    <BrowserRouter>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </BrowserRouter>
  </Provider>
)

describe('Resume Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Resume Upload and Analysis Flow', () => {
    it('should complete full resume upload and analysis workflow', async () => {
      const store = createTestStore()
      
      // Mock services
      const mockUploadFile = vi.fn().mockResolvedValue({
        $id: 'file-123',
        name: 'resume.pdf'
      })
      
      const mockAnalyzeResume = vi.fn().mockResolvedValue({
        matchScore: 85,
        missingKeywords: ['React', 'Node.js'],
        actionVerbAnalysis: 'Good use of action verbs',
        formatSuggestions: ['Use bullet points', 'Add metrics']
      })

      // Mock component that handles the workflow
      const ResumeWorkflow = () => {
        const handleUpload = async (file, jobDescription) => {
          // Set uploading state
          store.dispatch(resumeSlice.actions.setUploading(true))
          
          try {
            // Upload file
            const uploadedFile = await mockUploadFile(file)
            
            // Set analyzing state
            store.dispatch(resumeSlice.actions.setUploading(false))
            store.dispatch(resumeSlice.actions.setAnalyzing(true))
            
            // Analyze resume
            const analysis = await mockAnalyzeResume(file, jobDescription)
            
            // Create resume record
            const resume = {
              id: 'resume-123',
              userId: '1',
              fileId: uploadedFile.$id,
              fileName: uploadedFile.name,
              jobDescription,
              analysisResults: analysis,
              uploadedAt: new Date().toISOString()
            }
            
            // Update store
            store.dispatch(resumeSlice.actions.addResume(resume))
            store.dispatch(resumeSlice.actions.setCurrentAnalysis(analysis))
            store.dispatch(resumeSlice.actions.setAnalyzing(false))
            
          } catch (error) {
            store.dispatch(resumeSlice.actions.setError(error.message))
            store.dispatch(resumeSlice.actions.setUploading(false))
            store.dispatch(resumeSlice.actions.setAnalyzing(false))
          }
        }

        const state = store.getState()
        
        return (
          <div>
            <div data-testid="upload-section">
              <input
                type="file"
                data-testid="file-input"
                onChange={(e) => {
                  const file = e.target.files[0]
                  const jobDescription = 'Software Engineer position requiring React and Node.js experience...'
                  handleUpload(file, jobDescription)
                }}
              />
              {state.resume.uploading && <div>Uploading...</div>}
              {state.resume.analyzing && <div>Analyzing...</div>}
            </div>
            
            {state.resume.currentAnalysis && (
              <div data-testid="analysis-results">
                <div>Match Score: {state.resume.currentAnalysis.matchScore}%</div>
                <div>Missing Keywords: {state.resume.currentAnalysis.missingKeywords.join(', ')}</div>
                <div>Action Verb Analysis: {state.resume.currentAnalysis.actionVerbAnalysis}</div>
                <div>Format Suggestions: {state.resume.currentAnalysis.formatSuggestions.join(', ')}</div>
              </div>
            )}
            
            {state.resume.error && (
              <div data-testid="error-message">{state.resume.error}</div>
            )}
          </div>
        )
      }

      render(
        <TestWrapper store={store}>
          <ResumeWorkflow />
        </TestWrapper>
      )

      // Create a mock file
      const mockFile = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' })
      
      // Upload file
      const fileInput = screen.getByTestId('file-input')
      fireEvent.change(fileInput, { target: { files: [mockFile] } })

      // Should show uploading state
      await waitFor(() => {
        expect(screen.getByText('Uploading...')).toBeInTheDocument()
      })

      // Should show analyzing state
      await waitFor(() => {
        expect(screen.getByText('Analyzing...')).toBeInTheDocument()
      })

      // Should show analysis results
      await waitFor(() => {
        expect(screen.getByTestId('analysis-results')).toBeInTheDocument()
        expect(screen.getByText('Match Score: 85%')).toBeInTheDocument()
        expect(screen.getByText('Missing Keywords: React, Node.js')).toBeInTheDocument()
        expect(screen.getByText('Action Verb Analysis: Good use of action verbs')).toBeInTheDocument()
        expect(screen.getByText('Format Suggestions: Use bullet points, Add metrics')).toBeInTheDocument()
      })

      // Verify services were called
      expect(mockUploadFile).toHaveBeenCalledWith(mockFile)
      expect(mockAnalyzeResume).toHaveBeenCalledWith(
        mockFile,
        'Software Engineer position requiring React and Node.js experience...'
      )

      // Verify store state
      const finalState = store.getState()
      expect(finalState.resume.resumes).toHaveLength(1)
      expect(finalState.resume.currentAnalysis.matchScore).toBe(85)
      expect(finalState.resume.uploading).toBe(false)
      expect(finalState.resume.analyzing).toBe(false)
      expect(finalState.resume.error).toBe(null)
    })

    it('should handle upload errors gracefully', async () => {
      const store = createTestStore()
      
      const mockUploadFile = vi.fn().mockRejectedValue(new Error('Upload failed'))

      const ResumeWorkflow = () => {
        const handleUpload = async (file, jobDescription) => {
          store.dispatch(resumeSlice.actions.setUploading(true))
          
          try {
            await mockUploadFile(file)
          } catch (error) {
            store.dispatch(resumeSlice.actions.setError(error.message))
            store.dispatch(resumeSlice.actions.setUploading(false))
          }
        }

        const state = store.getState()
        
        return (
          <div>
            <input
              type="file"
              data-testid="file-input"
              onChange={(e) => {
                const file = e.target.files[0]
                handleUpload(file, 'Job description')
              }}
            />
            {state.resume.uploading && <div>Uploading...</div>}
            {state.resume.error && <div data-testid="error-message">{state.resume.error}</div>}
          </div>
        )
      }

      render(
        <TestWrapper store={store}>
          <ResumeWorkflow />
        </TestWrapper>
      )

      const mockFile = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' })
      const fileInput = screen.getByTestId('file-input')
      
      fireEvent.change(fileInput, { target: { files: [mockFile] } })

      // Should show error message
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
        expect(screen.getByText('Upload failed')).toBeInTheDocument()
      })

      // Should not be uploading anymore
      expect(screen.queryByText('Uploading...')).not.toBeInTheDocument()

      // Verify store state
      const state = store.getState()
      expect(state.resume.error).toBe('Upload failed')
      expect(state.resume.uploading).toBe(false)
    })

    it('should handle analysis errors gracefully', async () => {
      const store = createTestStore()
      
      const mockUploadFile = vi.fn().mockResolvedValue({
        $id: 'file-123',
        name: 'resume.pdf'
      })
      
      const mockAnalyzeResume = vi.fn().mockRejectedValue(new Error('Analysis failed'))

      const ResumeWorkflow = () => {
        const handleUpload = async (file, jobDescription) => {
          store.dispatch(resumeSlice.actions.setUploading(true))
          
          try {
            const uploadedFile = await mockUploadFile(file)
            store.dispatch(resumeSlice.actions.setUploading(false))
            store.dispatch(resumeSlice.actions.setAnalyzing(true))
            
            await mockAnalyzeResume(file, jobDescription)
            
          } catch (error) {
            store.dispatch(resumeSlice.actions.setError(error.message))
            store.dispatch(resumeSlice.actions.setUploading(false))
            store.dispatch(resumeSlice.actions.setAnalyzing(false))
          }
        }

        const state = store.getState()
        
        return (
          <div>
            <input
              type="file"
              data-testid="file-input"
              onChange={(e) => {
                const file = e.target.files[0]
                handleUpload(file, 'Job description')
              }}
            />
            {state.resume.uploading && <div>Uploading...</div>}
            {state.resume.analyzing && <div>Analyzing...</div>}
            {state.resume.error && <div data-testid="error-message">{state.resume.error}</div>}
          </div>
        )
      }

      render(
        <TestWrapper store={store}>
          <ResumeWorkflow />
        </TestWrapper>
      )

      const mockFile = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' })
      const fileInput = screen.getByTestId('file-input')
      
      fireEvent.change(fileInput, { target: { files: [mockFile] } })

      // Should show error message after analysis fails
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
        expect(screen.getByText('Analysis failed')).toBeInTheDocument()
      })

      // Should not be analyzing anymore
      expect(screen.queryByText('Analyzing...')).not.toBeInTheDocument()

      // Verify store state
      const state = store.getState()
      expect(state.resume.error).toBe('Analysis failed')
      expect(state.resume.analyzing).toBe(false)
    })
  })

  describe('Resume History Management', () => {
    it('should manage multiple resume analyses', async () => {
      const store = createTestStore({
        resume: {
          resumes: [
            {
              id: 'resume-1',
              fileName: 'resume1.pdf',
              jobDescription: 'Frontend Developer',
              analysisResults: { matchScore: 80 },
              uploadedAt: '2024-01-01T10:00:00Z'
            },
            {
              id: 'resume-2',
              fileName: 'resume2.pdf',
              jobDescription: 'Backend Developer',
              analysisResults: { matchScore: 75 },
              uploadedAt: '2024-01-02T10:00:00Z'
            }
          ]
        }
      })

      const ResumeHistory = () => {
        const state = store.getState()
        
        return (
          <div>
            <h2>Resume History</h2>
            {state.resume.resumes.map(resume => (
              <div key={resume.id} data-testid={`resume-${resume.id}`}>
                <div>{resume.fileName}</div>
                <div>{resume.jobDescription}</div>
                <div>Score: {resume.analysisResults.matchScore}%</div>
              </div>
            ))}
          </div>
        )
      }

      render(
        <TestWrapper store={store}>
          <ResumeHistory />
        </TestWrapper>
      )

      // Should display both resumes
      expect(screen.getByTestId('resume-resume-1')).toBeInTheDocument()
      expect(screen.getByTestId('resume-resume-2')).toBeInTheDocument()
      expect(screen.getByText('resume1.pdf')).toBeInTheDocument()
      expect(screen.getByText('resume2.pdf')).toBeInTheDocument()
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
      expect(screen.getByText('Backend Developer')).toBeInTheDocument()
      expect(screen.getByText('Score: 80%')).toBeInTheDocument()
      expect(screen.getByText('Score: 75%')).toBeInTheDocument()
    })

    it('should handle resume deletion', () => {
      const store = createTestStore({
        resume: {
          resumes: [
            { id: 'resume-1', fileName: 'resume1.pdf' },
            { id: 'resume-2', fileName: 'resume2.pdf' }
          ]
        }
      })

      const ResumeManager = () => {
        const state = store.getState()
        
        const handleDelete = (resumeId) => {
          store.dispatch(resumeSlice.actions.removeResume(resumeId))
        }
        
        return (
          <div>
            {state.resume.resumes.map(resume => (
              <div key={resume.id} data-testid={`resume-${resume.id}`}>
                <span>{resume.fileName}</span>
                <button onClick={() => handleDelete(resume.id)}>Delete</button>
              </div>
            ))}
          </div>
        )
      }

      render(
        <TestWrapper store={store}>
          <ResumeManager />
        </TestWrapper>
      )

      // Initially should have both resumes
      expect(screen.getByTestId('resume-resume-1')).toBeInTheDocument()
      expect(screen.getByTestId('resume-resume-2')).toBeInTheDocument()

      // Delete first resume
      const deleteButtons = screen.getAllByText('Delete')
      fireEvent.click(deleteButtons[0])

      // Should only have second resume
      expect(screen.queryByTestId('resume-resume-1')).not.toBeInTheDocument()
      expect(screen.getByTestId('resume-resume-2')).toBeInTheDocument()

      // Verify store state
      const state = store.getState()
      expect(state.resume.resumes).toHaveLength(1)
      expect(state.resume.resumes[0].id).toBe('resume-2')
    })
  })

  describe('Error Recovery and State Management', () => {
    it('should clear errors when starting new upload', () => {
      const store = createTestStore({
        resume: {
          error: 'Previous error'
        }
      })

      const ResumeUploader = () => {
        const handleClearError = () => {
          store.dispatch(resumeSlice.actions.clearError())
        }

        const state = store.getState()
        
        return (
          <div>
            {state.resume.error && (
              <div data-testid="error-message">{state.resume.error}</div>
            )}
            <button onClick={handleClearError}>Clear Error</button>
          </div>
        )
      }

      render(
        <TestWrapper store={store}>
          <ResumeUploader />
        </TestWrapper>
      )

      // Should show error initially
      expect(screen.getByTestId('error-message')).toBeInTheDocument()
      expect(screen.getByText('Previous error')).toBeInTheDocument()

      // Clear error
      fireEvent.click(screen.getByText('Clear Error'))

      // Error should be gone
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument()

      // Verify store state
      const state = store.getState()
      expect(state.resume.error).toBe(null)
    })
  })
})