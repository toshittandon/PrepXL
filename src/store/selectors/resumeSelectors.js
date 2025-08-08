import { createSelector } from 'reselect'

// Base selectors
const selectResumeState = (state) => state.resume

// Memoized selectors
export const selectResumes = createSelector(
  [selectResumeState],
  (resume) => resume.resumes || []
)

export const selectCurrentAnalysis = createSelector(
  [selectResumeState],
  (resume) => resume.currentAnalysis
)

export const selectResumeUploading = createSelector(
  [selectResumeState],
  (resume) => resume.uploading
)

export const selectResumeAnalyzing = createSelector(
  [selectResumeState],
  (resume) => resume.analyzing
)

export const selectResumeError = createSelector(
  [selectResumeState],
  (resume) => resume.error
)

export const selectResumeCount = createSelector(
  [selectResumes],
  (resumes) => resumes.length
)

export const selectLatestResume = createSelector(
  [selectResumes],
  (resumes) => resumes.length > 0 ? resumes[resumes.length - 1] : null
)

export const selectResumesByScore = createSelector(
  [selectResumes],
  (resumes) => [...resumes].sort((a, b) => 
    (b.analysisResults?.matchScore || 0) - (a.analysisResults?.matchScore || 0)
  )
)

export const selectAverageMatchScore = createSelector(
  [selectResumes],
  (resumes) => {
    if (resumes.length === 0) return 0
    const totalScore = resumes.reduce((sum, resume) => 
      sum + (resume.analysisResults?.matchScore || 0), 0
    )
    return Math.round(totalScore / resumes.length)
  }
)

export const selectResumeStatus = createSelector(
  [selectResumeUploading, selectResumeAnalyzing, selectResumeError],
  (uploading, analyzing, error) => ({
    uploading,
    analyzing,
    processing: uploading || analyzing,
    error,
    hasError: !!error
  })
)