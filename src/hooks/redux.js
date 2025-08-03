import { useDispatch, useSelector } from 'react-redux'

// Typed hooks for Redux usage
export const useAppDispatch = () => useDispatch()
export const useAppSelector = useSelector

// Selector hooks for specific slices
export const useAuth = () => useAppSelector(state => state.auth)
export const useInterview = () => useAppSelector(state => state.interview)
export const useResume = () => useAppSelector(state => state.resume)
export const useLibrary = () => useAppSelector(state => state.library)
export const useAdmin = () => useAppSelector(state => state.admin)
export const useUI = () => useAppSelector(state => state.ui)

// Specific selector hooks for commonly used values
export const useCurrentUser = () => useAppSelector(state => state.auth.user)
export const useIsAuthenticated = () => useAppSelector(state => !!state.auth.user)
export const useIsAdmin = () => useAppSelector(state => state.auth.user?.isAdmin || false)
export const useTheme = () => useAppSelector(state => state.ui.theme)
export const useCurrentSession = () => useAppSelector(state => state.interview.currentSession)
export const useIsRecording = () => useAppSelector(state => state.interview.isRecording)
export const useNotifications = () => useAppSelector(state => state.ui.notifications)
export const useSidebarOpen = () => useAppSelector(state => state.ui.sidebarOpen)
export const useCurrentModal = () => useAppSelector(state => state.ui.currentModal)