import { lazy } from 'react';
import { ROUTES } from '../utils/navigation.js';

// Lazy load ALL components for optimal code splitting
const Login = lazy(() => import('../pages/auth/Login'));
const Signup = lazy(() => import('../pages/auth/Signup'));
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const ResumeUpload = lazy(() => import('../pages/resume/ResumeUpload'));
const ResumeAnalysis = lazy(() => import('../pages/resume/ResumeAnalysis'));
const InterviewSetup = lazy(() => import('../pages/interview/InterviewSetup'));
const LiveInterview = lazy(() => import('../pages/interview/LiveInterview'));
const FeedbackReport = lazy(() => import('../pages/interview/FeedbackReport'));
const ReportsList = lazy(() => import('../pages/interview/ReportsList'));

// Debug components - also lazy loaded
const AppwriteTest = lazy(() => import('../components/debug/AppwriteTest'));

// Route configuration
export const routeConfig = [
  // Public routes (redirect to dashboard if authenticated)
  {
    path: ROUTES.AUTH.LOGIN,
    component: Login,
    isPublic: true,
    exact: true
  },
  {
    path: ROUTES.AUTH.SIGNUP,
    component: Signup,
    isPublic: true,
    exact: true
  },
  
  // Protected routes (require authentication)
  {
    path: ROUTES.DASHBOARD,
    component: Dashboard,
    isProtected: true,
    exact: true
  },
  
  // Resume routes
  {
    path: ROUTES.RESUME.UPLOAD,
    component: ResumeUpload,
    isProtected: true,
    isLazy: true,
    exact: true
  },
  {
    path: '/resume/analysis/:resumeId',
    component: ResumeAnalysis,
    isProtected: true,
    isLazy: true,
    exact: true
  },
  
  // Interview routes
  {
    path: ROUTES.INTERVIEW.SETUP,
    component: InterviewSetup,
    isProtected: true,
    isLazy: true,
    exact: true
  },
  {
    path: '/interview/live/:sessionId',
    component: LiveInterview,
    isProtected: true,
    isLazy: true,
    exact: true
  },
  {
    path: '/interview/reports',
    component: ReportsList,
    isProtected: true,
    isLazy: true,
    exact: true
  },
  {
    path: '/interview/report/:sessionId',
    component: FeedbackReport,
    isProtected: true,
    isLazy: true,
    exact: true
  },
  
  // Debug routes (for development)
  {
    path: '/debug/appwrite',
    component: AppwriteTest,
    isPublic: true,
    exact: true
  }
];

// Redirect routes
export const redirectRoutes = [
  {
    from: ROUTES.AUTH.BASE,
    to: ROUTES.AUTH.LOGIN,
    exact: true
  },
  {
    from: ROUTES.RESUME.BASE,
    to: ROUTES.RESUME.UPLOAD,
    exact: true
  },
  {
    from: ROUTES.INTERVIEW.BASE,
    to: ROUTES.INTERVIEW.SETUP,
    exact: true
  },
  {
    from: ROUTES.ROOT,
    to: ROUTES.DASHBOARD,
    exact: true
  }
];

// Catch-all redirect
export const catchAllRedirect = {
  to: ROUTES.AUTH.LOGIN
};

export default routeConfig;