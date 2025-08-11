/**
 * Authentication debugging utilities
 */

import { getCurrentSession, getCurrentUserWithProfile } from '../services/appwrite/auth.js'

export const debugAuthState = async () => {
  console.group('🔍 Authentication Debug Information')
  
  try {
    // Check session
    console.log('Checking current session...')
    const session = await getCurrentSession()
    
    if (session) {
      console.log('✅ Session found:', {
        id: session.$id,
        userId: session.userId,
        expire: session.expire,
        provider: session.provider
      })
    } else {
      console.log('❌ No active session found')
    }

    // Check user
    console.log('Checking current user...')
    const user = await getCurrentUserWithProfile()
    
    if (user) {
      console.log('✅ User found:', {
        id: user.$id,
        name: user.name,
        email: user.email,
        emailVerification: user.emailVerification,
        hasProfile: !!user.profile
      })
    } else {
      console.log('❌ No user data found')
    }

  } catch (error) {
    console.error('❌ Authentication debug error:', {
      message: error.message,
      code: error.code,
      type: error.type
    })
  }
  
  console.groupEnd()
}

export const debugStorageState = () => {
  console.group('🔍 Storage Debug Information')
  
  // Check localStorage
  const authStorage = localStorage.getItem('auth-storage')
  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage)
      console.log('✅ Auth storage found:', parsed)
    } catch (e) {
      console.log('❌ Invalid auth storage data')
    }
  } else {
    console.log('ℹ️  No auth storage found')
  }

  // Check sessionStorage
  const sessionAuth = sessionStorage.getItem('auth-storage')
  if (sessionAuth) {
    try {
      const parsed = JSON.parse(sessionAuth)
      console.log('✅ Session auth storage found:', parsed)
    } catch (e) {
      console.log('❌ Invalid session auth storage data')
    }
  } else {
    console.log('ℹ️  No session auth storage found')
  }
  
  console.groupEnd()
}

export const clearAuthStorage = () => {
  localStorage.removeItem('auth-storage')
  sessionStorage.removeItem('auth-storage')
  console.log('✅ Cleared all auth storage')
}

// Add to window for easy debugging in console
if (typeof window !== 'undefined') {
  window.debugAuth = debugAuthState
  window.debugStorage = debugStorageState
  window.clearAuthStorage = clearAuthStorage
  
  // Add a function to trigger auth errors for testing
  window.triggerAuthError = () => {
    const authErrorEvent = new CustomEvent('authError', {
      detail: {
        code: 401,
        message: 'Authentication required. Please log in again.',
        type: 'authentication_required',
        originalError: new Error('Test authentication error')
      }
    });
    window.dispatchEvent(authErrorEvent);
    console.log('🔧 Triggered authentication error for testing session recovery')
  }
  
  // Add a function to test session recovery
  window.testSessionRecovery = () => {
    console.log('🔧 Testing session recovery...')
    window.triggerAuthError()
  }
}

export default {
  debugAuthState,
  debugStorageState,
  clearAuthStorage
}