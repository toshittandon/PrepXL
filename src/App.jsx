import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

// Layout Components
import { Layout, AdminLayout } from './components/layout'
import AuthGuard from './components/common/AuthGuard'

// Auth Pages
import { Login, Signup, ProfileSetup } from './pages/auth'

// Main Pages
import { Dashboard } from './pages/dashboard'
import { ResumeUpload } from './pages/resume'
import { InterviewSetup } from './pages/interview'
import { QuestionLibrary } from './pages/library'

// Admin Pages
import { AdminDashboard } from './pages/admin'

function App() {
  return (
    <Router>
      <AnimatePresence mode="wait">
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
            <Route path="interview/setup" element={<InterviewSetup />} />
            <Route path="library" element={<QuestionLibrary />} />
          </Route>

          {/* Admin Routes with Admin Layout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<div>User Management - Coming Soon</div>} />
            <Route path="questions" element={<div>Question Management - Coming Soon</div>} />
            <Route path="settings" element={<div>Admin Settings - Coming Soon</div>} />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AnimatePresence>
    </Router>
  )
}

export default App