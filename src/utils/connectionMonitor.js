/**
 * Connection monitoring utilities for WebSocket and API connectivity
 */

/**
 * Monitor WebSocket connection health
 * @param {string} wsUrl - WebSocket URL to monitor
 * @param {Object} options - Monitoring options
 * @returns {Object} Connection monitor instance
 */
export const createWebSocketMonitor = (wsUrl = 'ws://localhost:3001/', options = {}) => {
  const {
    reconnectInterval = 5000,
    maxReconnectAttempts = 3, // Reduced from 5 to avoid spam
    onConnectionChange = null,
    onError = null,
    enableLogging = false // Disable logging by default to reduce console noise
  } = options

  let ws = null
  let reconnectAttempts = 0
  let reconnectTimer = null
  let isConnected = false
  let isDestroyed = false
  let hasLoggedInitialError = false

  const connect = () => {
    if (isDestroyed) return

    try {
      ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        isConnected = true
        reconnectAttempts = 0
        hasLoggedInitialError = false
        
        if (enableLogging) {
          console.log('✅ WebSocket connected successfully')
        }
        
        if (onConnectionChange) {
          onConnectionChange({ connected: true, attempts: reconnectAttempts })
        }
      }

      ws.onclose = (event) => {
        isConnected = false
        
        // Only log if logging is enabled and it's not a normal close
        if (enableLogging && event.code !== 1000) {
          console.log('❌ WebSocket connection closed:', event.code, event.reason)
        }
        
        if (onConnectionChange) {
          onConnectionChange({ connected: false, attempts: reconnectAttempts })
        }

        // Attempt to reconnect if not manually closed and haven't exceeded max attempts
        if (!isDestroyed && event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          scheduleReconnect()
        }
      }

      ws.onerror = (error) => {
        // Only log the first error to avoid spam
        if (enableLogging && !hasLoggedInitialError) {
          console.warn('⚠️ WebSocket connection unavailable (this is normal in development)')
          hasLoggedInitialError = true
        }
        
        if (onError) {
          onError(error)
        }
      }

    } catch (error) {
      if (enableLogging && !hasLoggedInitialError) {
        console.warn('⚠️ WebSocket service unavailable (this is normal in development)')
        hasLoggedInitialError = true
      }
      
      if (onError) {
        onError(error)
      }
      
      // Only schedule reconnect if we haven't exceeded max attempts
      if (reconnectAttempts < maxReconnectAttempts) {
        scheduleReconnect()
      }
    }
  }

  const scheduleReconnect = () => {
    if (isDestroyed || reconnectAttempts >= maxReconnectAttempts) {
      if (enableLogging) {
        console.log('❌ Max reconnection attempts reached or monitor destroyed')
      }
      return
    }

    reconnectAttempts++
    
    if (enableLogging) {
      console.log(`🔄 Scheduling WebSocket reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts} in ${reconnectInterval}ms`)
    }

    reconnectTimer = setTimeout(() => {
      connect()
    }, reconnectInterval)
  }

  const disconnect = () => {
    isDestroyed = true
    
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    if (ws) {
      ws.close(1000, 'Manual disconnect')
      ws = null
    }
  }

  const getStatus = () => ({
    connected: isConnected,
    reconnectAttempts,
    maxReconnectAttempts,
    destroyed: isDestroyed
  })

  // Start initial connection
  connect()

  return {
    disconnect,
    getStatus,
    reconnect: () => {
      if (!isDestroyed) {
        reconnectAttempts = 0
        connect()
      }
    }
  }
}

/**
 * Check API connectivity
 * @param {string} apiUrl - API endpoint to check
 * @returns {Promise<Object>} Connection status
 */
export const checkApiConnectivity = async (apiUrl = '/api/health') => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(apiUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    clearTimeout(timeoutId)

    return {
      connected: response.ok,
      status: response.status,
      statusText: response.statusText,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      connected: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Monitor overall application connectivity
 * @param {Object} options - Monitoring options
 * @returns {Object} Connection monitor instance
 */
export const createConnectionMonitor = (options = {}) => {
  const {
    wsUrl = 'ws://localhost:3001/',
    apiUrl = '/api/health',
    checkInterval = 30000,
    onStatusChange = null
  } = options

  let wsMonitor = null
  let checkTimer = null
  let currentStatus = {
    websocket: { connected: false },
    api: { connected: false },
    overall: false
  }

  const updateStatus = (newStatus) => {
    const prevOverall = currentStatus.overall
    currentStatus = {
      ...currentStatus,
      ...newStatus,
      overall: newStatus.websocket?.connected || newStatus.api?.connected || false
    }

    // Only notify if overall status changed
    if (prevOverall !== currentStatus.overall && onStatusChange) {
      onStatusChange(currentStatus)
    }
  }

  const checkConnectivity = async () => {
    try {
      const apiStatus = await checkApiConnectivity(apiUrl)
      const wsStatus = wsMonitor ? wsMonitor.getStatus() : { connected: false }

      updateStatus({
        websocket: wsStatus,
        api: apiStatus
      })
    } catch (error) {
      console.error('Connection check failed:', error)
    }
  }

  const start = () => {
    // Start WebSocket monitoring with reduced logging
    wsMonitor = createWebSocketMonitor(wsUrl, {
      enableLogging: false, // Disable logging to reduce console noise
      maxReconnectAttempts: 1, // Reduce attempts in development
      onConnectionChange: (wsStatus) => {
        updateStatus({ websocket: wsStatus })
      },
      onError: (error) => {
        // Silently handle WebSocket errors in development
        // This is normal when no WebSocket server is running
      }
    })

    // Start periodic API checks
    checkTimer = setInterval(checkConnectivity, checkInterval)
    
    // Initial connectivity check
    checkConnectivity()
  }

  const stop = () => {
    if (wsMonitor) {
      wsMonitor.disconnect()
      wsMonitor = null
    }

    if (checkTimer) {
      clearInterval(checkTimer)
      checkTimer = null
    }
  }

  const getStatus = () => currentStatus

  return {
    start,
    stop,
    getStatus,
    checkNow: checkConnectivity
  }
}

/**
 * Simple connection status component for debugging
 * @returns {HTMLElement} Status indicator element
 */
export const createConnectionStatusIndicator = () => {
  const indicator = document.createElement('div')
  indicator.id = 'connection-status-indicator'
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    color: white;
    z-index: 9999;
    transition: all 0.3s ease;
    pointer-events: none;
  `

  const updateIndicator = (status) => {
    if (status.overall) {
      indicator.style.backgroundColor = '#10b981'
      indicator.textContent = '🟢 Connected'
    } else {
      indicator.style.backgroundColor = '#ef4444'
      indicator.textContent = '🔴 Disconnected'
    }
  }

  // Initial state
  updateIndicator({ overall: false })

  return {
    element: indicator,
    update: updateIndicator
  }
}

export default {
  createWebSocketMonitor,
  checkApiConnectivity,
  createConnectionMonitor,
  createConnectionStatusIndicator
}