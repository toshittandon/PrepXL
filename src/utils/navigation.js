// Navigation utilities and route constants

export const ROUTES = {
  // Auth routes
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    BASE: '/auth'
  },
  
  // Dashboard
  DASHBOARD: '/dashboard',
  
  // Resume routes
  RESUME: {
    UPLOAD: '/resume/upload',
    ANALYSIS: (resumeId) => `/resume/analysis/${resumeId}`,
    BASE: '/resume'
  },
  
  // Interview routes
  INTERVIEW: {
    SETUP: '/interview/setup',
    LIVE: (sessionId) => `/interview/live/${sessionId}`,
    REPORT: (sessionId) => `/interview/report/${sessionId}`,
    BASE: '/interview'
  },
  
  // Root
  ROOT: '/'
};

// Navigation helpers
export const navigationHelpers = {
  // Check if current path matches route
  isCurrentRoute: (currentPath, targetRoute) => {
    return currentPath === targetRoute;
  },
  
  // Check if current path is within a route section
  isInSection: (currentPath, section) => {
    return currentPath.startsWith(section);
  },
  
  // Get breadcrumb data for current route
  getBreadcrumbs: (currentPath) => {
    const breadcrumbs = [{ label: 'Dashboard', path: ROUTES.DASHBOARD }];
    
    if (currentPath.startsWith('/resume')) {
      breadcrumbs.push({ label: 'Resume', path: ROUTES.RESUME.BASE });
      
      if (currentPath.includes('/upload')) {
        breadcrumbs.push({ label: 'Upload', path: ROUTES.RESUME.UPLOAD });
      } else if (currentPath.includes('/analysis')) {
        breadcrumbs.push({ label: 'Analysis', path: currentPath });
      }
    } else if (currentPath.startsWith('/interview')) {
      breadcrumbs.push({ label: 'Interview', path: ROUTES.INTERVIEW.BASE });
      
      if (currentPath.includes('/setup')) {
        breadcrumbs.push({ label: 'Setup', path: ROUTES.INTERVIEW.SETUP });
      } else if (currentPath.includes('/live')) {
        breadcrumbs.push({ label: 'Live Session', path: currentPath });
      } else if (currentPath.includes('/report')) {
        breadcrumbs.push({ label: 'Report', path: currentPath });
      }
    }
    
    return breadcrumbs;
  },
  
  // Check if route requires authentication
  isProtectedRoute: (path) => {
    const publicRoutes = [ROUTES.AUTH.LOGIN, ROUTES.AUTH.SIGNUP];
    return !publicRoutes.includes(path);
  },
  
  // Get default redirect for authenticated users
  getAuthenticatedRedirect: (intendedPath = null) => {
    return intendedPath && navigationHelpers.isProtectedRoute(intendedPath) 
      ? intendedPath 
      : ROUTES.DASHBOARD;
  },
  
  // Get default redirect for unauthenticated users
  getUnauthenticatedRedirect: () => {
    return ROUTES.AUTH.LOGIN;
  }
};

export default navigationHelpers;