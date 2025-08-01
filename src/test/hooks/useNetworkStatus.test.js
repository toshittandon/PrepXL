import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useNetworkStatus, useOfflineSupport } from '../../hooks/useNetworkStatus';
import uiSlice from '../../store/slices/uiSlice';

const createTestStore = () => {
  return configureStore({
    reducer: {
      ui: uiSlice
    }
  });
};

const wrapper = ({ children }) => {
  const store = createTestStore();
  return <Provider store={store}>{children}</Provider>;
};

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

// Mock navigator.connection
Object.defineProperty(navigator, 'connection', {
  writable: true,
  value: {
    effectiveType: '4g',
    type: 'wifi',
    downlink: 10,
    rtt: 50,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }
});

describe('useNetworkStatus', () => {
  beforeEach(() => {
    navigator.onLine = true;
    jest.clearAllMocks();
  });

  it('should return initial network status', () => {
    const { result } = renderHook(() => useNetworkStatus(), { wrapper });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.effectiveType).toBe('4g');
    expect(result.current.quality).toBe('excellent');
  });

  it('should handle offline events', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useNetworkStatus(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });

    act(() => {
      navigator.onLine = false;
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);

    const state = store.getState();
    expect(state.ui.notifications.some(n => n.type === 'warning')).toBe(true);
  });

  it('should handle online events', () => {
    const store = createTestStore();
    navigator.onLine = false;
    
    const { result } = renderHook(() => useNetworkStatus(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });

    act(() => {
      navigator.onLine = true;
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);

    const state = store.getState();
    expect(state.ui.notifications.some(n => n.type === 'success')).toBe(true);
  });

  it('should assess connection quality correctly', () => {
    const { result } = renderHook(() => useNetworkStatus(), { wrapper });

    // Mock different connection types
    navigator.connection.effectiveType = 'slow-2g';
    act(() => {
      navigator.connection.dispatchEvent?.(new Event('change'));
    });

    expect(result.current.quality).toBe('poor');
  });

  it('should test connectivity', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useNetworkStatus(), { wrapper });

    const isConnected = await result.current.testConnectivity();

    expect(isConnected).toBe(true);
    expect(fetch).toHaveBeenCalledWith('/favicon.ico', {
      method: 'HEAD',
      cache: 'no-cache'
    });
  });
});

describe('useOfflineSupport', () => {
  beforeEach(() => {
    localStorage.clear();
    navigator.onLine = true;
  });

  it('should queue actions when offline', () => {
    const { result } = renderHook(() => useOfflineSupport(), { wrapper });

    const action = {
      type: 'TEST_ACTION',
      handler: jest.fn()
    };

    act(() => {
      result.current.queueAction(action);
    });

    expect(result.current.pendingActions).toHaveLength(1);
    expect(result.current.hasPendingActions).toBe(true);
  });

  it('should process pending actions when coming online', async () => {
    const store = createTestStore();
    navigator.onLine = false;

    const { result } = renderHook(() => useOfflineSupport({ syncOnReconnect: true }), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });

    const mockHandler = jest.fn().mockResolvedValue('success');
    const action = {
      type: 'TEST_ACTION',
      handler: mockHandler
    };

    act(() => {
      result.current.queueAction(action);
    });

    // Simulate coming back online
    act(() => {
      navigator.onLine = true;
    });

    // Wait for processing
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockHandler).toHaveBeenCalled();
  });

  it('should persist pending actions to localStorage', () => {
    const { result } = renderHook(() => useOfflineSupport({
      storageKey: 'test_offline_data'
    }), { wrapper });

    const action = {
      type: 'TEST_ACTION',
      handler: jest.fn()
    };

    act(() => {
      result.current.queueAction(action);
    });

    const stored = JSON.parse(localStorage.getItem('test_offline_data'));
    expect(stored).toHaveLength(1);
    expect(stored[0].type).toBe('TEST_ACTION');
  });

  it('should clear pending actions', () => {
    const { result } = renderHook(() => useOfflineSupport(), { wrapper });

    const action = {
      type: 'TEST_ACTION',
      handler: jest.fn()
    };

    act(() => {
      result.current.queueAction(action);
    });

    expect(result.current.pendingActions).toHaveLength(1);

    act(() => {
      result.current.clearPendingActions();
    });

    expect(result.current.pendingActions).toHaveLength(0);
    expect(result.current.hasPendingActions).toBe(false);
  });
});