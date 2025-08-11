import { describe, it, expect } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import resumeSlice, {
  addResume,
  updateResume,
  removeResume,
  setCurrentAnalysis,
  setUploading,
  setAnalyzing,
  setError,
  clearError,
  clearCurrentAnalysis,
  selectResumes,
  selectCurrentAnalysis,
  selectIsUploading,
  selectIsAnalyzing,
  selectResumeError,
  selectResumeById,
  selectRecentResumes,
  selectAnalysisHistory
} from '../../store/slices/resumeSlice.js'

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      resume: resumeSlice
    },
    preloadedState: {
      resume: {
        resumes: [],
        currentAnalysis: null,
        uploading: false,
        analyzing: false,
        error: null,
        ...initialState
      }
    }
  })
}

const mockResume = {
  id: 'resume-1',
  userId: 'user-1',
  fileId: 'file-1',
  fileName: 'resume.pdf',
  jobDescription: 'Software Engineer position...',
  analysisResults: {
    matchScore: 85,
    missingKeywords: ['React', 'Node.js'],
    actionVerbAnalysis: 'Good use of action verbs',
    formatSuggestions: ['Use bullet points', 'Add metrics']
  },
  uploadedAt: '2024-01-01T10:00:00Z'
}

describe('Resume Slice', () => {
  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const store = createTestStore()
      const state = store.getState().resume
      
      expect(state.resumes).toEqual([])
      expect(state.currentAnalysis).toBe(null)
      expect(state.uploading).toBe(false)
      expect(state.analyzing).toBe(false)
      expect(state.error).toBe(null)
    })
  })

  describe('Resume Management', () => {
    it('should add resume', () => {
      const store = createTestStore()
      
      store.dispatch(addResume(mockResume))
      
      const state = store.getState().resume
      expect(state.resumes).toHaveLength(1)
      expect(state.resumes[0]).toEqual(mockResume)
    })

    it('should add multiple resumes', () => {
      const store = createTestStore()
      
      const resume2 = { ...mockResume, id: 'resume-2', fileName: 'resume2.pdf' }
      
      store.dispatch(addResume(mockResume))
      store.dispatch(addResume(resume2))
      
      const state = store.getState().resume
      expect(state.resumes).toHaveLength(2)
      expect(state.resumes[0]).toEqual(mockResume)
      expect(state.resumes[1]).toEqual(resume2)
    })

    it('should update existing resume', () => {
      const store = createTestStore({
        resumes: [mockResume]
      })
      
      const updates = {
        id: 'resume-1',
        analysisResults: {
          ...mockResume.analysisResults,
          matchScore: 90
        }
      }
      
      store.dispatch(updateResume(updates))
      
      const state = store.getState().resume
      expect(state.resumes[0].analysisResults.matchScore).toBe(90)
      expect(state.resumes[0].fileName).toBe(mockResume.fileName) // Should preserve other fields
    })

    it('should not update non-existent resume', () => {
      const store = createTestStore({
        resumes: [mockResume]
      })
      
      const updates = {
        id: 'non-existent-id',
        fileName: 'updated.pdf'
      }
      
      store.dispatch(updateResume(updates))
      
      const state = store.getState().resume
      expect(state.resumes).toHaveLength(1)
      expect(state.resumes[0]).toEqual(mockResume) // Should remain unchanged
    })

    it('should remove resume', () => {
      const store = createTestStore({
        resumes: [
          mockResume,
          { ...mockResume, id: 'resume-2', fileName: 'resume2.pdf' }
        ]
      })
      
      store.dispatch(removeResume('resume-1'))
      
      const state = store.getState().resume
      expect(state.resumes).toHaveLength(1)
      expect(state.resumes[0].id).toBe('resume-2')
    })

    it('should not remove non-existent resume', () => {
      const store = createTestStore({
        resumes: [mockResume]
      })
      
      store.dispatch(removeResume('non-existent-id'))
      
      const state = store.getState().resume
      expect(state.resumes).toHaveLength(1)
      expect(state.resumes[0]).toEqual(mockResume)
    })
  })

  describe('Analysis Management', () => {
    it('should set current analysis', () => {
      const store = createTestStore()
      const analysis = {
        matchScore: 75,
        missingKeywords: ['Python', 'AWS'],
        actionVerbAnalysis: 'Needs more action verbs',
        formatSuggestions: ['Improve formatting']
      }
      
      store.dispatch(setCurrentAnalysis(analysis))
      
      const state = store.getState().resume
      expect(state.currentAnalysis).toEqual(analysis)
    })

    it('should clear current analysis', () => {
      const store = createTestStore({
        currentAnalysis: { matchScore: 80 }
      })
      
      store.dispatch(clearCurrentAnalysis())
      
      const state = store.getState().resume
      expect(state.currentAnalysis).toBe(null)
    })
  })

  describe('Loading States', () => {
    it('should set uploading state', () => {
      const store = createTestStore()
      
      store.dispatch(setUploading(true))
      expect(store.getState().resume.uploading).toBe(true)
      
      store.dispatch(setUploading(false))
      expect(store.getState().resume.uploading).toBe(false)
    })

    it('should set analyzing state', () => {
      const store = createTestStore()
      
      store.dispatch(setAnalyzing(true))
      expect(store.getState().resume.analyzing).toBe(true)
      
      store.dispatch(setAnalyzing(false))
      expect(store.getState().resume.analyzing).toBe(false)
    })

    it('should clear error when starting upload', () => {
      const store = createTestStore({ error: 'Previous error' })
      
      store.dispatch(setUploading(true))
      
      const state = store.getState().resume
      expect(state.error).toBe(null)
      expect(state.uploading).toBe(true)
    })

    it('should clear error when starting analysis', () => {
      const store = createTestStore({ error: 'Previous error' })
      
      store.dispatch(setAnalyzing(true))
      
      const state = store.getState().resume
      expect(state.error).toBe(null)
      expect(state.analyzing).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should set error', () => {
      const store = createTestStore()
      const error = 'Upload failed'
      
      store.dispatch(setError(error))
      
      const state = store.getState().resume
      expect(state.error).toBe(error)
    })

    it('should clear error', () => {
      const store = createTestStore({ error: 'Some error' })
      
      store.dispatch(clearError())
      
      const state = store.getState().resume
      expect(state.error).toBe(null)
    })
  })

  describe('Selectors', () => {
    it('should select resumes', () => {
      const resumes = [mockResume]
      const store = createTestStore({ resumes })
      
      const state = store.getState()
      expect(selectResumes(state)).toEqual(resumes)
    })

    it('should select current analysis', () => {
      const analysis = { matchScore: 80 }
      const store = createTestStore({ currentAnalysis: analysis })
      
      const state = store.getState()
      expect(selectCurrentAnalysis(state)).toEqual(analysis)
    })

    it('should select uploading state', () => {
      const store = createTestStore({ uploading: true })
      
      const state = store.getState()
      expect(selectIsUploading(state)).toBe(true)
    })

    it('should select analyzing state', () => {
      const store = createTestStore({ analyzing: true })
      
      const state = store.getState()
      expect(selectIsAnalyzing(state)).toBe(true)
    })

    it('should select error state', () => {
      const error = 'Test error'
      const store = createTestStore({ error })
      
      const state = store.getState()
      expect(selectResumeError(state)).toBe(error)
    })

    it('should select resume by ID', () => {
      const store = createTestStore({
        resumes: [
          mockResume,
          { ...mockResume, id: 'resume-2', fileName: 'resume2.pdf' }
        ]
      })
      
      const state = store.getState()
      expect(selectResumeById(state, 'resume-1')).toEqual(mockResume)
      expect(selectResumeById(state, 'resume-2').fileName).toBe('resume2.pdf')
      expect(selectResumeById(state, 'non-existent')).toBeUndefined()
    })

    it('should select recent resumes', () => {
      const now = new Date()
      const recent = new Date(now.getTime() - 1000 * 60 * 60) // 1 hour ago
      const old = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 8) // 8 days ago
      
      const store = createTestStore({
        resumes: [
          { ...mockResume, id: 'recent-1', uploadedAt: recent.toISOString() },
          { ...mockResume, id: 'old-1', uploadedAt: old.toISOString() },
          { ...mockResume, id: 'recent-2', uploadedAt: now.toISOString() }
        ]
      })
      
      const state = store.getState()
      const recentResumes = selectRecentResumes(state)
      
      expect(recentResumes).toHaveLength(2)
      expect(recentResumes.map(r => r.id)).toEqual(['recent-2', 'recent-1']) // Sorted by date desc
    })

    it('should select analysis history', () => {
      const store = createTestStore({
        resumes: [
          {
            ...mockResume,
            id: 'resume-1',
            analysisResults: { matchScore: 85 }
          },
          {
            ...mockResume,
            id: 'resume-2',
            analysisResults: { matchScore: 75 }
          },
          {
            ...mockResume,
            id: 'resume-3',
            analysisResults: null // No analysis
          }
        ]
      })
      
      const state = store.getState()
      const history = selectAnalysisHistory(state)
      
      expect(history).toHaveLength(2) // Only resumes with analysis
      expect(history[0].analysisResults.matchScore).toBe(85)
      expect(history[1].analysisResults.matchScore).toBe(75)
    })
  })

  describe('Edge Cases', () => {
    it('should handle null resume in addResume', () => {
      const store = createTestStore()
      
      store.dispatch(addResume(null))
      
      const state = store.getState().resume
      expect(state.resumes).toHaveLength(1)
      expect(state.resumes[0]).toBe(null)
    })

    it('should handle updating resume with partial data', () => {
      const store = createTestStore({
        resumes: [mockResume]
      })
      
      const partialUpdate = {
        id: 'resume-1',
        fileName: 'updated-resume.pdf'
        // Missing other fields
      }
      
      store.dispatch(updateResume(partialUpdate))
      
      const state = store.getState().resume
      expect(state.resumes[0].fileName).toBe('updated-resume.pdf')
      expect(state.resumes[0].jobDescription).toBe(mockResume.jobDescription) // Should preserve
    })

    it('should handle empty resumes array in selectors', () => {
      const store = createTestStore({ resumes: [] })
      
      const state = store.getState()
      expect(selectRecentResumes(state)).toEqual([])
      expect(selectAnalysisHistory(state)).toEqual([])
      expect(selectResumeById(state, 'any-id')).toBeUndefined()
    })

    it('should handle resumes with invalid dates', () => {
      const store = createTestStore({
        resumes: [
          { ...mockResume, id: 'invalid-date', uploadedAt: 'invalid-date' },
          { ...mockResume, id: 'null-date', uploadedAt: null },
          { ...mockResume, id: 'valid-date', uploadedAt: '2024-01-01T10:00:00Z' }
        ]
      })
      
      const state = store.getState()
      const recentResumes = selectRecentResumes(state)
      
      // Should handle invalid dates gracefully
      expect(recentResumes).toHaveLength(1) // Only valid date
      expect(recentResumes[0].id).toBe('valid-date')
    })
  })
})