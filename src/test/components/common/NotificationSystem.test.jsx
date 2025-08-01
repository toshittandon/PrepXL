import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import NotificationSystem from '../../../components/common/NotificationSystem';
import uiSlice, { addNotification, removeNotification } from '../../../store/slices/uiSlice';

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      ui: uiSlice
    },
    preloadedState: {
      ui: {
        sidebarOpen: false,
        currentModal: null,
        notifications: [],
        theme: 'light',
        loading: { global: false, components: {} },
        ...initialState
      }
    }
  });
};

describe('NotificationSystem', () => {
  it('should render nothing when there are no notifications', () => {
    const store = createTestStore();
    const { container } = render(
      <Provider store={store}>
        <NotificationSystem />
      </Provider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render success notification', () => {
    const store = createTestStore({
      notifications: [{
        id: 1,
        type: 'success',
        title: 'Success',
        message: 'Operation completed successfully',
        timestamp: new Date().toISOString()
      }]
    });

    render(
      <Provider store={store}>
        <NotificationSystem />
      </Provider>
    );

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
  });

  it('should render error notification', () => {
    const store = createTestStore({
      notifications: [{
        id: 1,
        type: 'error',
        title: 'Error',
        message: 'Something went wrong',
        timestamp: new Date().toISOString()
      }]
    });

    render(
      <Provider store={store}>
        <NotificationSystem />
      </Provider>
    );

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should render warning notification', () => {
    const store = createTestStore({
      notifications: [{
        id: 1,
        type: 'warning',
        title: 'Warning',
        message: 'Please be careful',
        timestamp: new Date().toISOString()
      }]
    });

    render(
      <Provider store={store}>
        <NotificationSystem />
      </Provider>
    );

    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Please be careful')).toBeInTheDocument();
  });

  it('should render info notification', () => {
    const store = createTestStore({
      notifications: [{
        id: 1,
        type: 'info',
        title: 'Info',
        message: 'Here is some information',
        timestamp: new Date().toISOString()
      }]
    });

    render(
      <Provider store={store}>
        <NotificationSystem />
      </Provider>
    );

    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText('Here is some information')).toBeInTheDocument();
  });

  it('should dismiss notification when close button is clicked', () => {
    const store = createTestStore({
      notifications: [{
        id: 1,
        type: 'info',
        title: 'Test',
        message: 'Test message',
        timestamp: new Date().toISOString()
      }]
    });

    render(
      <Provider store={store}>
        <NotificationSystem />
      </Provider>
    );

    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);

    const state = store.getState();
    expect(state.ui.notifications).toHaveLength(0);
  });

  it('should auto-dismiss notification after duration', async () => {
    jest.useFakeTimers();

    const store = createTestStore({
      notifications: [{
        id: 1,
        type: 'info',
        title: 'Test',
        message: 'Test message',
        duration: 1000,
        timestamp: new Date().toISOString()
      }]
    });

    render(
      <Provider store={store}>
        <NotificationSystem />
      </Provider>
    );

    expect(screen.getByText('Test')).toBeInTheDocument();

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      const state = store.getState();
      expect(state.ui.notifications).toHaveLength(0);
    });

    jest.useRealTimers();
  });

  it('should not auto-dismiss persistent notifications', async () => {
    jest.useFakeTimers();

    const store = createTestStore({
      notifications: [{
        id: 1,
        type: 'error',
        title: 'Critical Error',
        message: 'This is persistent',
        persistent: true,
        timestamp: new Date().toISOString()
      }]
    });

    render(
      <Provider store={store}>
        <NotificationSystem />
      </Provider>
    );

    expect(screen.getByText('Critical Error')).toBeInTheDocument();

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(screen.getByText('Critical Error')).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('should render action buttons', () => {
    const mockAction = jest.fn();
    const store = createTestStore({
      notifications: [{
        id: 1,
        type: 'error',
        title: 'Error',
        message: 'Something went wrong',
        actions: [{
          label: 'Retry',
          handler: mockAction,
          primary: true
        }],
        timestamp: new Date().toISOString()
      }]
    });

    render(
      <Provider store={store}>
        <NotificationSystem />
      </Provider>
    );

    const retryButton = screen.getByRole('button', { name: 'Retry' });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(mockAction).toHaveBeenCalled();
  });

  it('should show clear all button for multiple notifications', () => {
    const store = createTestStore({
      notifications: [
        {
          id: 1,
          type: 'info',
          title: 'First',
          message: 'First message',
          timestamp: new Date().toISOString()
        },
        {
          id: 2,
          type: 'info',
          title: 'Second',
          message: 'Second message',
          timestamp: new Date().toISOString()
        }
      ]
    });

    render(
      <Provider store={store}>
        <NotificationSystem />
      </Provider>
    );

    const clearAllButton = screen.getByRole('button', { name: 'Clear All (2)' });
    expect(clearAllButton).toBeInTheDocument();

    fireEvent.click(clearAllButton);

    const state = store.getState();
    expect(state.ui.notifications).toHaveLength(0);
  });

  it('should not show clear all button for single notification', () => {
    const store = createTestStore({
      notifications: [{
        id: 1,
        type: 'info',
        title: 'Single',
        message: 'Single message',
        timestamp: new Date().toISOString()
      }]
    });

    render(
      <Provider store={store}>
        <NotificationSystem />
      </Provider>
    );

    expect(screen.queryByText(/Clear All/)).not.toBeInTheDocument();
  });
});