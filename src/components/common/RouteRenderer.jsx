import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './AuthGuard';
import { routeConfig, redirectRoutes, catchAllRedirect } from '../../config/routes';

const RouteRenderer = () => {
  return (
    <Routes>
      {/* Configured routes */}
      {routeConfig.map((route, index) => {
        const { path, component: Component, isPublic, isProtected } = route;
        
        if (isPublic) {
          return (
            <Route
              key={index}
              path={path}
              element={
                <PublicRoute>
                  <Component />
                </PublicRoute>
              }
            />
          );
        }
        
        if (isProtected) {
          return (
            <Route
              key={index}
              path={path}
              element={
                <ProtectedRoute>
                  <Component />
                </ProtectedRoute>
              }
            />
          );
        }
        
        // Default route (no auth guard)
        return (
          <Route
            key={index}
            path={path}
            element={<Component />}
          />
        );
      })}
      
      {/* Redirect routes */}
      {redirectRoutes.map((redirect, index) => (
        <Route
          key={`redirect-${index}`}
          path={redirect.from}
          element={<Navigate to={redirect.to} replace />}
        />
      ))}
      
      {/* Catch all - redirect to login */}
      <Route
        path="*"
        element={<Navigate to={catchAllRedirect.to} replace />}
      />
    </Routes>
  );
};

export default RouteRenderer;