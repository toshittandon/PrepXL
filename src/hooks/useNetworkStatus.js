import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/uiSlice';

/**
 * Custom hook for monitoring network status and connectivity
 * @returns {Object} Network status information
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState('unknown');
  const [effectiveType, setEffectiveType] = useState('unknown');
  const [downlink, setDownlink] = useState(null);
  const [rtt, setRtt] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    // Update connection info if Network Information API is available
    const updateConnectionInfo = () => {
      if ('connection' in navigator) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
          setConnectionType(connection.type || 'unknown');
          setEffectiveType(connection.effectiveType || 'unknown');
          setDownlink(connection.downlink || null);
          setRtt(connection.rtt || null);
        }
      }
    };

    // Initial connection info
    updateConnectionInfo();

    // Online/offline event handlers
    const handleOnline = () => {
      setIsOnline(true);
      updateConnectionInfo();
      
      dispatch(addNotification({
        type: 'success',
        title: 'Back Online',
        message: 'Your internet connection has been restored.',
        duration: 3000
      }));
    };

    const handleOffline = () => {
      setIsOnline(false);
      
      dispatch(addNotification({
        type: 'warning',
        title: 'Connection Lost',
        message: 'You are currently offline. Some features may not work properly.',
        persistent: true
      }));
    };

    // Connection change handler
    const handleConnectionChange = () => {
      updateConnectionInfo();
      
      // Notify about slow connections
      if ('connection' in navigator) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection && connection.effectiveType === 'slow-2g') {
          dispatch(addNotification({
            type: 'warning',
            title: 'Slow Connection',
            message: 'Your connection appears to be slow. Some features may take longer to load.',
            duration: 5000
          }));
        }
      }
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        connection.addEventListener('change', handleConnectionChange);
      }
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('connection' in navigator) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
          connection.removeEventListener('change', handleConnectionChange);
        }
      }
    };
  }, [dispatch]);

  // Ping test to verify actual connectivity
  const testConnectivity = async () => {
    if (!isOnline) return false;
    
    try {
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  // Get connection quality assessment
  const getConnectionQuality = () => {
    if (!isOnline) return 'offline';
    
    if (effectiveType === 'slow-2g') return 'poor';
    if (effectiveType === '2g') return 'poor';
    if (effectiveType === '3g') return 'good';
    if (effectiveType === '4g') return 'excellent';
    
    // Fallback based on downlink speed
    if (downlink !== null) {
      if (downlink < 0.5) return 'poor';
      if (downlink < 2) return 'good';
      return 'excellent';
    }
    
    return 'unknown';
  };

  return {
    isOnline,
    connectionType,
    effectiveType,
    downlink,
    rtt,
    quality: getConnectionQuality(),
    testConnectivity
  };
};

/**
 * Hook for handling offline-first functionality
 * @param {Object} options - Configuration options
 * @returns {Object} Offline handling utilities
 */
export const useOfflineSupport = (options = {}) => {
  const { 
    storageKey = 'offline_data',
    syncOnReconnect = true 
  } = options;
  
  const { isOnline } = useNetworkStatus();
  const [pendingActions, setPendingActions] = useState([]);
  const dispatch = useDispatch();

  // Load pending actions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setPendingActions(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to load offline data:', error);
    }
  }, [storageKey]);

  // Save pending actions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(pendingActions));
    } catch (error) {
      console.warn('Failed to save offline data:', error);
    }
  }, [pendingActions, storageKey]);

  // Sync pending actions when coming back online
  useEffect(() => {
    if (isOnline && syncOnReconnect && pendingActions.length > 0) {
      dispatch(addNotification({
        type: 'info',
        title: 'Syncing Data',
        message: `Syncing ${pendingActions.length} pending actions...`,
        duration: 3000
      }));
      
      // Process pending actions
      processPendingActions();
    }
  }, [isOnline, syncOnReconnect, pendingActions.length]);

  // Add action to pending queue
  const queueAction = (action) => {
    const queuedAction = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      ...action
    };
    
    setPendingActions(prev => [...prev, queuedAction]);
    
    dispatch(addNotification({
      type: 'info',
      title: 'Action Queued',
      message: 'Your action will be processed when you\'re back online.',
      duration: 3000
    }));
  };

  // Process pending actions
  const processPendingActions = async () => {
    if (!isOnline || pendingActions.length === 0) return;

    const results = [];
    
    for (const action of pendingActions) {
      try {
        if (action.handler) {
          await action.handler();
          results.push({ id: action.id, success: true });
        }
      } catch (error) {
        console.error('Failed to process pending action:', error);
        results.push({ id: action.id, success: false, error });
      }
    }

    // Remove successfully processed actions
    const successfulIds = results.filter(r => r.success).map(r => r.id);
    setPendingActions(prev => prev.filter(action => !successfulIds.includes(action.id)));

    // Notify about results
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    if (successCount > 0) {
      dispatch(addNotification({
        type: 'success',
        title: 'Sync Complete',
        message: `${successCount} actions synced successfully.`,
        duration: 3000
      }));
    }

    if (failCount > 0) {
      dispatch(addNotification({
        type: 'error',
        title: 'Sync Issues',
        message: `${failCount} actions failed to sync. They will be retried later.`,
        duration: 5000
      }));
    }
  };

  // Clear all pending actions
  const clearPendingActions = () => {
    setPendingActions([]);
    localStorage.removeItem(storageKey);
  };

  return {
    isOnline,
    pendingActions,
    queueAction,
    processPendingActions,
    clearPendingActions,
    hasPendingActions: pendingActions.length > 0
  };
};