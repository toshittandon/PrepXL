/**
 * Application startup validation and initialization
 */

import { validateAppwriteConfig } from './envValidation.js'
import { debugAuthState } from './authDebugger.js'
import { createConnectionMonitor } from './connectionMonitor.js'

let connectionMonitor = null

export const initializeApp = async () => {
  console.log('🚀 Initializing PrepXL application...')
  
  try {
    // 1. Validate environment configuration
    if (!validateAppwriteConfig()) {
      throw new Error('Environment configuration validation failed')
    }

    // 2. Initialize connection monitoring in development (disabled for now)
    // WebSocket monitoring is disabled in development since there's no WebSocket server
    // This prevents console errors and improves development experience
    if (import.meta.env.DEV && false) { // Disabled
      connectionMonitor = createConnectionMonitor({
        onStatusChange: (status) => {
          console.log('🔗 Connection status changed:', status)
        }
      })
      connectionMonitor.start()
    }

    // 3. Debug authentication state in development (optional)
    if (import.meta.env.DEV) {
      setTimeout(() => {
        // Only run debug if explicitly enabled via localStorage
        if (localStorage.getItem('debug-auth') === 'true') {
          debugAuthState()
        }
      }, 1000)
    }

    console.log('✅ Application initialized successfully')
    return true

  } catch (error) {
    console.error('❌ Application initialization failed:', error)
    return false
  }
}

export const cleanupApp = () => {
  if (connectionMonitor) {
    connectionMonitor.stop()
    connectionMonitor = null
  }
}

// Auto-initialize in development
if (import.meta.env.DEV) {
  initializeApp()
}

export default {
  initializeApp,
  cleanupApp
}