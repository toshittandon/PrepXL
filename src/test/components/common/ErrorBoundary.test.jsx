import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ErrorBoundary from '../../../components/common/ErrorBoundary';
import uiSlice from '../../../store/slices/uiSlice';

const createTestStore = () => {
  return configureStore({
    reducer: {
      ui: uiSlice
    }
  });
};

// Component that throws an error
const ThrowError = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  let store;
  let consoleError;

  beforeEach(() => {
    store = createTestStore();
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('should render children when there is no error', () => {
    render(
      <Provider store={store}>
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      </Provider>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should render error UI when child component throws', () => {
    render(
      <Provider store={store}>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </Provider>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload Page' })).toBeInTheDocument();
  });

  it('should show error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <Provider store={store}>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </Provider>
    );

    expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should hide error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <Provider store={store}>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </Provider>
    );

    expect(screen.queryByText('Error Details (Development)')).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should reset error state when Try Again is clicked', () => {
    const { rerender } = render(
      <Provider store={store}>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </Provider>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

    rerender(
      <Provider store={store}>
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      </Provider>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should reload page when Reload Page is clicked', () => {
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    });

    render(
      <Provider store={store}>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reload Page' }));

    expect(mockReload).toHaveBeenCalled();
  });

  it('should use custom fallback when provided', () => {
    const customFallback = (error, retry) => (
      <div>
        <h1>Custom Error UI</h1>
        <button onClick={retry}>Custom Retry</button>
      </div>
    );

    render(
      <Provider store={store}>
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </Provider>
    );

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Custom Retry' })).toBeInTheDocument();
  });

  it('should dispatch error notification', () => {
    render(
      <Provider store={store}>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </Provider>
    );

    const state = store.getState();
    expect(state.ui.notifications).toHaveLength(1);
    expect(state.ui.notifications[0].type).toBe('error');
    expect(state.ui.notifications[0].title).toBe('Application Error');
  });

  it('should display error ID', () => {
    render(
      <Provider store={store}>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </Provider>
    );

    expect(screen.getByText(/Error ID:/)).toBeInTheDocument();
  });
});