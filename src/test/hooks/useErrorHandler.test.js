import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useErrorHandler } from '../../hooks/useErrorHandler.jsx';
import uiSlice from '../../store/slices/uiSlice';

// Mock the network status hook
vi.mock('../../hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({ isOnline: true })
}));

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

describe('useErrorHandler', () => {
  it('should handle errors and dispatch notifications', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useErrorHandler(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });

    const error = new Error('Test error');
    
    act(() => {
      result.current.handleError(error);
    });

    const state = store.getState();
    expect(state.ui.notifications).toHaveLength(1);
    expect(state.ui.notifications[0].type).toBe('error');
    expect(state.ui.notifications[0].message).toBe('Test error');
  });

  it('should create retry handlers', async () => {
    const { result } = renderHook(() => useErrorHandler({ enableRetry: true }), {
      wrapper
    });

    const mockOperation = vi.fn().mockResolvedValue('success');
    const retryHandler = result.current.createRetryHandler(mockOperation);

    expect(retryHandler).toBeInstanceOf(Function);

    await act(async () => {
      await retryHandler();
    });

    expect(mockOperation).toHaveBeenCalled();
  });

  it('should wrap operations with error handling', async () => {
    const store = createTestStore();
    const { result } = renderHook(() => useErrorHandler(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    });

    const mockOperation = vi.fn().mockRejectedValue(new Error('Operation failed'));
    const wrappedOperation = result.current.withErrorHandling(mockOperation);

    await act(async () => {
      try {
        await wrappedOperation();
      } catch (error) {
        // Expected to throw
      }
    });

    const state = store.getState();
    expect(state.ui.notifications).toHaveLength(1);
    expect(state.ui.notifications[0].type).toBe('error');
  });

  it('should create error fallback components', () => {
    const { result } = renderHook(() => useErrorHandler(), { wrapper });

    const fallback = result.current.createErrorFallback({
      title: 'Custom Error',
      message: 'Custom message'
    });

    expect(fallback).toBeInstanceOf(Function);

    const error = new Error('Test error');
    const retryFn = vi.fn();
    const component = fallback(error, retryFn);

    expect(component).toBeDefined();
  });

  it('should handle form errors', () => {
    const { result } = renderHook(() => useErrorHandler(), { wrapper });

    const mockSetError = vi.fn();
    const validationError = {
      status: 400,
      details: {
        email: 'Invalid email',
        password: 'Password too short'
      }
    };

    act(() => {
      result.current.handleFormError(validationError, mockSetError);
    });

    expect(mockSetError).toHaveBeenCalledWith('email', {
      type: 'server',
      message: 'Invalid email'
    });
    expect(mockSetError).toHaveBeenCalledWith('password', {
      type: 'server',
      message: 'Password too short'
    });
  });

  it('should disable features when configured', () => {
    const { result } = renderHook(() => useErrorHandler({
      enableRetry: false,
      enableNotifications: false
    }), { wrapper });

    const mockOperation = vi.fn();
    const retryHandler = result.current.createRetryHandler(mockOperation);

    expect(retryHandler).toBeNull();
  });
});