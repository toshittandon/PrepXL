import { createSelector } from 'reselect'

// Base selectors
const selectInterviewState = (state) => state.interview

// Memoized selectors
export const selectCurrentSession = createSelector(
  [selectInterviewState],
  (interview) => interview.currentSession
)

export const selectCurrentQuestion = createSelector(
  [selectInterviewState],
  (interview) => interview.currentQuestion
)

export const selectInteractions = createSelector(
  [selectInterviewState],
  (interview) => interview.interactions || []
)

export const selectIsRecording = createSelector(
  [selectInterviewState],
  (interview) => interview.isRecording
)

export const selectInterviewLoading = createSelector(
  [selectInterviewState],
  (interview) => interview.loading
)

export const selectInterviewError = createSelector(
  [selectInterviewState],
  (interview) => interview.error
)

export const selectInteractionCount = createSelector(
  [selectInteractions],
  (interactions) => interactions.length
)

export const selectSessionProgress = createSelector(
  [selectCurrentSession, selectInteractions],
  (session, interactions) => {
    if (!session) return 0
    // Calculate progress based on interactions vs expected questions
    const expectedQuestions = 10 // Default expected questions
    return Math.min((interactions.length / expectedQuestions) * 100, 100)
  }
)

export const selectInterviewStatus = createSelector(
  [selectCurrentSession, selectIsRecording, selectInterviewLoading],
  (session, isRecording, loading) => ({
    hasActiveSession: !!session,
    isRecording,
    loading,
    sessionId: session?.id
  })
)

export const selectSortedInteractions = createSelector(
  [selectInteractions],
  (interactions) => [...interactions].sort((a, b) => a.order - b.order)
)