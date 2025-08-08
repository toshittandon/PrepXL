import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { addNotification, removeNotification } from '../store/slices/uiSlice'

const useOfflineDetection = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)
  const dispatch = useDispatch()

  useEffect(() => {
    let offlineNotificationId = null

    const handleOnline = () => {
      setIsOnline(true)
      
      // Remove offline notification if it exists
      if (offlineNotificationId) {
        dispatch(removeNotification(offlineNotificationId))
        offlineNotificationId = null
      }

      // Show reconnected notification if user was offline
      if (wasOffline) {
        dispatch(addNotification({
          type: 'success',
          title: 'Connection Restored',
          message: 'You are back online. All features are now available.',
          duration: 4000
        }))
        setWasOffline(false)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)

      // Show persistent offline notification
      const notification = {
        type: 'warning',
        title: 'No Internet Connection',
        message: 'Some features may not work properly while offline. Please check your connection.',
        persistent: true,
        actions: [
          {
            label: 'Retry',
            onClick: () => {
              // Force a connection check
              if (navigator.onLine) {
                handleOnline()
              }
            },
            variant: 'secondary'
          }
        ]
      }

      dispatch(addNotification(notification))
      offlineNotificationId = notification.id
    }

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Periodic connection check (every 30 seconds when offline)
    let connectionCheckInterval = null
    if (!isOnline) {
      connectionCheckInterval = setInterval(() => {
        // Try to fetch a small resource to check connectivity
        fetch('/favicon.ico', { 
          method: 'HEAD',
          cache: 'no-cache',
          mode: 'no-cors'
        })
        .then(() => {
          if (!navigator.onLine) {
            // Browser thinks we're offline but we can actually fetch
            handleOnline()
          }
        })
        .catch(() => {
          // Still offline
        })
      }, 30000)
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      
      if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval)
      }

      if (offlineNotificationId) {
        dispatch(removeNotification(offlineNotificationId))
      }
    }
  }, [dispatch, wasOffline])

  return {
    isOnline,
    wasOffline
  }
}

export default useOfflineDetection