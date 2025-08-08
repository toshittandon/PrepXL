import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import { Suspense, lazy } from 'react'

// Error Handling Components
import ErrorBoundary from './components/common/ErrorBoundary'
import NotificationSystem from './components/common/NotificationSystem'
import LoadingSpinner from './components/common/LoadingSpinner'

// Layout Components (Keep these as regular imports since they're used on every page)
import { Layout, AdminLayout } from './components/layout'
import AuthGuard from './components/common/AuthGuard'

// Hooks
import useOfflineDetection from './hooks/useOfflineDetection'

// Debug Components (Development Only)
import AuthStatus from './components/debug/AuthStatus.jsx'
import MockAuthControls from './components/debug/MockAuthControls.jsx'

// Lazy-loaded components for code splitting
// Auth Pages
const Login = lazy(() => import('./pages/auth/Login'))
const Signup = lazy(() => import('./pages/auth/Signup'))
const ProfileSetup = lazy(() => import('./pages/auth/ProfileSetup'))

// Main Pages
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'))
const ResumeUpload = lazy(() => import('./pages/resume/ResumeUpload'))
const ResumeAnalysis = lazy(() => import('./pages/resume/ResumeAnalysis'))
const InterviewSetup = lazy(() => import('./pages/interview/InterviewSetup'))
const LiveInterview = lazy(() => import('./pages/interview/LiveInterview'))
const FeedbackReport = lazy(() => import('./pages/interview/FeedbackReport'))
const QuestionLibrary = lazy(() => import('./pages/library/QuestionLibrary'))

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const UserManagement = lazy(() => import('./pages/admin/UserManagement'))
const QuestionManagement = lazy(() => import('./pages/admin/QuestionManagement'))

// Error Pages
const NotFound = lazy(() => import('./pages/NotFound'))

// Loading component for Suspense fallback
const PageLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <LoadingSpinner size="xl" color="primary" />
      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
)

function App() {
  const dispatch = useDispatch()
  const user = useSelector(state => state.auth.user)
  
  // Initialize offline detection
  useOfflineDetection()
  
  return (
    <ErrorBoundary userId={user?.id}>
      <Router>
        {/* Debug Components - Only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <AuthStatus />
            <MockAuthControls dispatch={dispatch} />
          </>
        )}
        
        <AnimatePresence mode="wait">
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={
                <AuthGuard requireAuth={false}>
                  <Login />
                </AuthGuard>
              } />
              <Route path="/signup" element={
                <AuthGuard requireAuth={false}>
                  <Signup />
                </AuthGuard>
              } />

              {/* Protected Routes with Main Layout */}
              <Route path="/" element={
                <AuthGuard requireAuth={true}>
                  <Layout />
                </AuthGuard>
              }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="profile/setup" element={<ProfileSetup />} />
                <Route path="resume-upload" element={<ResumeUpload />} />
                <Route path="resume-analysis/:resumeId" element={<ResumeAnalysis />} />
                <Route path="interview/setup" element={<InterviewSetup />} />
                <Route path="interview/live/:sessionId" element={<LiveInterview />} />
                <Route path="interview/report/:sessionId" element={<FeedbackReport />} />
                <Route path="library" element={<QuestionLibrary />} />
              </Route>

              {/* Admin Routes with Admin Layout */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="questions" element={<QuestionManagement />} />
                <Route path="settings" element={<div>Admin Settings - Coming Soon</div>} />
              </Route>

              {/* 404 Page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AnimatePresence>
        
        {/* Global Notification System */}
        <NotificationSystem />
      </Router>
    </ErrorBoundary>
  )
}

export default App