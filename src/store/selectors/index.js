import { createSelector } from '@reduxjs/toolkit';

// Auth selectors
export const selectAuthState = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;

// Memoized auth selectors
export const selectUserProfile = createSelector(
  [selectUser],
  (user) => user ? {
    id: user.id,
    name: user.name,
    email: user.email,
    experienceLevel: user.experienceLevel,
    targetRole: user.targetRole,
    targetIndustry: user.targetIndustry
  } : null
);

export const selectAuthStatus = createSelector(
  [selectIsAuthenticated, selectAuthLoading, selectAuthError],
  (isAuthenticated, loading, error) => ({
    isAuthenticated,
    loading,
    error,
    status: loading ? 'loading' : error ? 'error' : isAuthenticated ? 'authenticated' : 'unauthenticated'
  })
);

// Interview selectors
export const selectInterviewState = (state) => state.interview;
export const selectCurrentSession = (state) => state.interview.currentSession;
export const selectInteractions = (state) => state.interview.interactions;
export const selectSessionHistory = (state) => state.interview.sessionHistory;
export const selectIsRecording = (state) => state.interview.isRecording;

// Memoized interview selectors
export const selectInterviewProgress = createSelector(
  [selectCurrentSession, selectInteractions],
  (session, interactions) => {
    if (!session) return null;
    
    const totalQuestions = session.expectedQuestions || 10; // Default to 10 if not set
    const answeredQuestions = interactions.length;
    const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    
    return {
      totalQuestions,
      answeredQuestions,
      progress: Math.min(progress, 100),
      isComplete: progress >= 100
    };
  }
);

export const selectSessionStats = createSelector(
  [selectSessionHistory],
  (sessions) => {
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const averageScore = completedSessions > 0 
      ? sessions
          .filter(s => s.status === 'completed' && s.finalScore)
          .reduce((sum, s) => sum + s.finalScore, 0) / completedSessions
      : 0;
    
    const recentSessions = sessions
      .filter(s => s.status === 'completed')
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 5);
    
    return {
      totalSessions,
      completedSessions,
      averageScore: Math.round(averageScore),
      recentSessions,
      completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0
    };
  }
);

export const selectCurrentInteractionData = createSelector(
  [selectInteractions, selectCurrentSession],
  (interactions, session) => {
    if (!session) return null;
    
    const sortedInteractions = [...interactions].sort((a, b) => a.order - b.order);
    const lastInteraction = sortedInteractions[sortedInteractions.length - 1];
    const nextQuestionNumber = sortedInteractions.length + 1;
    
    return {
      interactions: sortedInteractions,
      lastInteraction,
      nextQuestionNumber,
      totalAnswered: sortedInteractions.length
    };
  }
);

// Resume selectors
export const selectResumeState = (state) => state.resume;
export const selectResumes = (state) => state.resume.resumes;
export const selectCurrentAnalysis = (state) => state.resume.currentAnalysis;
export const selectResumeLoading = (state) => state.resume.loading;
export const selectUploading = (state) => state.resume.uploading;

// Memoized resume selectors
export const selectResumeStats = createSelector(
  [selectResumes],
  (resumes) => {
    const totalResumes = resumes.length;
    const analyzedResumes = resumes.filter(r => r.status === 'analyzed').length;
    const recentResumes = [...resumes]
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
      .slice(0, 3);
    
    return {
      totalResumes,
      analyzedResumes,
      recentResumes,
      analysisRate: totalResumes > 0 ? (analyzedResumes / totalResumes) * 100 : 0
    };
  }
);

export const selectResumeById = createSelector(
  [selectResumes, (state, resumeId) => resumeId],
  (resumes, resumeId) => resumes.find(resume => resume.id === resumeId) || null
);

export const selectAnalysisResults = createSelector(
  [selectCurrentAnalysis],
  (analysis) => {
    if (!analysis) return null;
    
    return {
      atsKeywords: analysis.atsKeywords || [],
      actionVerbs: analysis.actionVerbs || [],
      quantificationSuggestions: analysis.quantificationSuggestions || [],
      overallScore: analysis.overallScore || 0,
      strengths: analysis.strengths || [],
      improvements: analysis.improvements || []
    };
  }
);

// UI selectors
export const selectUIState = (state) => state.ui;
export const selectSidebarOpen = (state) => state.ui?.sidebarOpen || false;
export const selectCurrentModal = (state) => state.ui?.currentModal || null;
export const selectNotifications = (state) => state.ui?.notifications || [];

// Memoized UI selectors
export const selectActiveNotifications = createSelector(
  [selectNotifications],
  (notifications) => notifications.filter(n => !n.dismissed && !n.expired)
);

export const selectModalState = createSelector(
  [selectCurrentModal, selectUIState],
  (currentModal, uiState) => ({
    isOpen: !!currentModal,
    modalType: currentModal,
    modalData: uiState?.modalData || null
  })
);

// Combined selectors for dashboard
export const selectDashboardData = createSelector(
  [selectUserProfile, selectSessionStats, selectResumeStats, selectAuthStatus],
  (user, sessionStats, resumeStats, authStatus) => ({
    user,
    sessionStats,
    resumeStats,
    authStatus,
    isLoading: authStatus.loading
  })
);

// Performance monitoring selectors
export const selectLoadingStates = createSelector(
  [selectAuthLoading, selectResumeLoading, (state) => state.interview.loading],
  (authLoading, resumeLoading, interviewLoading) => ({
    auth: authLoading,
    resume: resumeLoading,
    interview: interviewLoading,
    anyLoading: authLoading || resumeLoading || interviewLoading
  })
);

export const selectErrorStates = createSelector(
  [selectAuthError, (state) => state.resume.error, (state) => state.interview.error],
  (authError, resumeError, interviewError) => ({
    auth: authError,
    resume: resumeError,
    interview: interviewError,
    hasErrors: !!(authError || resumeError || interviewError)
  })
);