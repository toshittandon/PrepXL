import { useDispatch, useSelector } from 'react-redux';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

// Custom hooks for auth state
export const useAuth = () => {
  return useAppSelector((state) => state.auth);
};

export const useAuthUser = () => {
  return useAppSelector((state) => state.auth.user);
};

export const useAuthStatus = () => {
  return useAppSelector((state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    isInitialized: state.auth.isInitialized,
    loading: state.auth.loading,
  }));
};