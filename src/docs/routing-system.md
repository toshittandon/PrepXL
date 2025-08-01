# Routing and Navigation System

## Overview

The routing system has been implemented using React Router v6 with the following key features:

- **Protected Routes**: Routes that require authentication
- **Public Routes**: Routes that redirect authenticated users away (auth pages)
- **Code Splitting**: Lazy loading for better performance
- **Navigation Guards**: Automatic redirects based on authentication status
- **Loading States**: Loading spinners during route transitions and auth checks

## Architecture

### Core Components

1. **App.jsx**: Main application component with router setup
2. **RouteRenderer.jsx**: Centralized route rendering component
3. **AuthGuard.jsx**: Authentication guard with ProtectedRoute and PublicRoute HOCs
4. **LoadingSpinner.jsx**: Reusable loading component

### Configuration Files

1. **routes.js**: Centralized route configuration
2. **navigation.js**: Navigation utilities and route constants

## Route Structure

```
/                           → Redirects to /dashboard
/auth                       → Redirects to /auth/login
/auth/login                 → Login page (public)
/auth/signup                → Signup page (public)
/dashboard                  → Dashboard page (protected)
/resume                     → Redirects to /resume/upload
/resume/upload              → Resume upload page (protected, lazy)
/resume/analysis/:resumeId  → Resume analysis page (protected, lazy)
/interview                  → Redirects to /interview/setup
/interview/setup            → Interview setup page (protected, lazy)
/interview/live/:sessionId  → Live interview page (protected, lazy)
/interview/report/:sessionId → Feedback report page (protected, lazy)
*                           → Catch-all redirects to /auth/login
```

## Authentication Flow

### Unauthenticated Users
- Accessing protected routes → Redirected to `/auth/login`
- Can access public routes (login, signup)
- Intended destination saved for post-login redirect

### Authenticated Users
- Accessing public routes → Redirected to `/dashboard` or intended destination
- Can access all protected routes
- Session maintained across browser refreshes

## Loading States

1. **Authentication Check**: Shows loading spinner while verifying auth status
2. **Route Transitions**: Suspense boundary with loading spinner for lazy-loaded components
3. **Component Loading**: Individual components can show their own loading states

## Navigation Utilities

### Route Constants (ROUTES)
- Centralized route path definitions
- Dynamic route generators for parameterized routes
- Organized by feature sections

### Navigation Helpers
- `isCurrentRoute()`: Check if current path matches target route
- `isInSection()`: Check if current path is within a route section
- `getBreadcrumbs()`: Generate breadcrumb navigation data
- `isProtectedRoute()`: Identify if route requires authentication
- `getAuthenticatedRedirect()`: Get redirect path for authenticated users
- `getUnauthenticatedRedirect()`: Get redirect path for unauthenticated users

## Code Splitting

Lazy-loaded components:
- ResumeUpload
- ResumeAnalysis
- InterviewSetup
- LiveInterview
- FeedbackReport

Immediately loaded components:
- Login
- Signup
- Dashboard
- AuthGuard
- LoadingSpinner

## Error Handling

- Invalid routes redirect to login page
- Authentication errors show loading state until resolved
- Lazy loading failures handled by Suspense boundary

## Future Enhancements

1. Route-based breadcrumb navigation component
2. Route transition animations
3. Route-level error boundaries
4. Advanced route guards (role-based permissions)
5. Route analytics and tracking
6. Deep linking support for complex application states

## Testing

- Navigation utilities have comprehensive unit tests
- Route configuration is testable and maintainable
- Authentication flow can be tested with mocked auth state

## Dependencies

- react-router-dom: ^6.x (installed)
- react: ^18.x
- react-redux: ^9.x (for auth state)
- @reduxjs/toolkit: ^2.x (for auth actions)