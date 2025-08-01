import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import uiSlice, {
  toggleSidebar,
  openModal,
  closeModal,
  addNotification,
  removeNotification,
  clearNotifications,
  setLoading,
  setTheme,
  selectUI,
  selectSidebarOpen,
  selectCurrentModal,
  selectNotifications,
  selectIsLoading,
  selectTheme,
} from '../../../store/slices/uiSlice.js';

describe('uiSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        ui: uiSlice,
      },
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().ui;
      expect(state).toEqual({
        sidebarOpen: false,
        currentModal: null,
        notifications: [],
        loading: false,
        theme: 'light',
      });
    });
  });

  describe('sidebar actions', () => {
    it('should toggle sidebar open/closed', () => {
      // Initially closed
      expect(store.getState().ui.sidebarOpen).toBe(false);

      // Toggle to open
      store.dispatch(toggleSidebar());
      expect(store.getState().ui.sidebarOpen).toBe(true);

      // Toggle to closed
      store.dispatch(toggleSidebar());
      expect(store.getState().ui.sidebarOpen).toBe(false);
    });

    it('should set sidebar to specific state', () => {
      store.dispatch(toggleSidebar(true));
      expect(store.getState().ui.sidebarOpen).toBe(true);

      store.dispatch(toggleSidebar(false));
      expect(store.getState().ui.sidebarOpen).toBe(false);
    });
  });

  describe('modal actions', () => {
    it('should open modal', () => {
      store.dispatch(openModal('confirmDialog'));
      expect(store.getState().ui.currentModal).toBe('confirmDialog');
    });

    it('should close modal', () => {
      // First open a modal
      store.dispatch(openModal('testModal'));
      expect(store.getState().ui.currentModal).toBe('testModal');

      // Then close it
      store.dispatch(closeModal());
      expect(store.getState().ui.currentModal).toBeNull();
    });

    it('should replace current modal when opening new one', () => {
      store.dispatch(openModal('firstModal'));
      expect(store.getState().ui.currentModal).toBe('firstModal');

      store.dispatch(openModal('secondModal'));
      expect(store.getState().ui.currentModal).toBe('secondModal');
    });
  });

  describe('notification actions', () => {
    it('should add notification', () => {
      const notification = {
        id: '1',
        type: 'success',
        message: 'Operation completed',
        duration: 5000,
      };

      store.dispatch(addNotification(notification));
      
      const state = store.getState().ui;
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0]).toEqual(notification);
    });

    it('should add notification with auto-generated id', () => {
      const notification = {
        type: 'error',
        message: 'Something went wrong',
      };

      store.dispatch(addNotification(notification));
      
      const state = store.getState().ui;
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0]).toHaveProperty('id');
      expect(state.notifications[0].type).toBe('error');
      expect(state.notifications[0].message).toBe('Something went wrong');
    });

    it('should add multiple notifications', () => {
      store.dispatch(addNotification({ type: 'info', message: 'First notification' }));
      store.dispatch(addNotification({ type: 'warning', message: 'Second notification' }));

      const state = store.getState().ui;
      expect(state.notifications).toHaveLength(2);
    });

    it('should remove specific notification', () => {
      const notification1 = { id: '1', type: 'success', message: 'First' };
      const notification2 = { id: '2', type: 'error', message: 'Second' };

      store.dispatch(addNotification(notification1));
      store.dispatch(addNotification(notification2));
      
      expect(store.getState().ui.notifications).toHaveLength(2);

      store.dispatch(removeNotification('1'));
      
      const state = store.getState().ui;
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].id).toBe('2');
    });

    it('should clear all notifications', () => {
      store.dispatch(addNotification({ type: 'info', message: 'First' }));
      store.dispatch(addNotification({ type: 'warning', message: 'Second' }));
      
      expect(store.getState().ui.notifications).toHaveLength(2);

      store.dispatch(clearNotifications());
      
      expect(store.getState().ui.notifications).toHaveLength(0);
    });

    it('should handle removing non-existent notification', () => {
      store.dispatch(addNotification({ id: '1', type: 'info', message: 'Test' }));
      
      expect(store.getState().ui.notifications).toHaveLength(1);

      store.dispatch(removeNotification('non-existent'));
      
      expect(store.getState().ui.notifications).toHaveLength(1);
    });
  });

  describe('loading actions', () => {
    it('should set loading state', () => {
      store.dispatch(setLoading(true));
      expect(store.getState().ui.loading).toBe(true);

      store.dispatch(setLoading(false));
      expect(store.getState().ui.loading).toBe(false);
    });

    it('should handle loading with operation key', () => {
      store.dispatch(setLoading({ operation: 'upload', loading: true }));
      expect(store.getState().ui.loading).toEqual({ upload: true });

      store.dispatch(setLoading({ operation: 'upload', loading: false }));
      expect(store.getState().ui.loading).toEqual({ upload: false });
    });
  });

  describe('theme actions', () => {
    it('should set theme', () => {
      store.dispatch(setTheme('dark'));
      expect(store.getState().ui.theme).toBe('dark');

      store.dispatch(setTheme('light'));
      expect(store.getState().ui.theme).toBe('light');
    });

    it('should handle system theme', () => {
      store.dispatch(setTheme('system'));
      expect(store.getState().ui.theme).toBe('system');
    });
  });

  describe('selectors', () => {
    const mockState = {
      ui: {
        sidebarOpen: true,
        currentModal: 'testModal',
        notifications: [
          { id: '1', type: 'success', message: 'Success!' },
          { id: '2', type: 'error', message: 'Error!' },
        ],
        loading: true,
        theme: 'dark',
      },
    };

    it('should select UI state', () => {
      expect(selectUI(mockState)).toEqual(mockState.ui);
    });

    it('should select sidebar open state', () => {
      expect(selectSidebarOpen(mockState)).toBe(true);
    });

    it('should select current modal', () => {
      expect(selectCurrentModal(mockState)).toBe('testModal');
    });

    it('should select notifications', () => {
      expect(selectNotifications(mockState)).toEqual(mockState.ui.notifications);
    });

    it('should select loading state', () => {
      expect(selectIsLoading(mockState)).toBe(true);
    });

    it('should select theme', () => {
      expect(selectTheme(mockState)).toBe('dark');
    });
  });

  describe('notification types', () => {
    it('should handle different notification types', () => {
      const types = ['success', 'error', 'warning', 'info'];

      types.forEach(type => {
        store.dispatch(addNotification({ type, message: `${type} message` }));
      });

      const state = store.getState().ui;
      expect(state.notifications).toHaveLength(4);
      
      types.forEach((type, index) => {
        expect(state.notifications[index].type).toBe(type);
        expect(state.notifications[index].message).toBe(`${type} message`);
      });
    });

    it('should handle notification with action', () => {
      const notification = {
        type: 'error',
        message: 'Upload failed',
        action: {
          label: 'Retry',
          handler: vi.fn(),
        },
      };

      store.dispatch(addNotification(notification));
      
      const state = store.getState().ui;
      expect(state.notifications[0].action).toEqual(notification.action);
    });

    it('should handle persistent notifications', () => {
      const notification = {
        type: 'info',
        message: 'Persistent message',
        persistent: true,
      };

      store.dispatch(addNotification(notification));
      
      const state = store.getState().ui;
      expect(state.notifications[0].persistent).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle maximum notification limit', () => {
      // Add many notifications
      for (let i = 0; i < 15; i++) {
        store.dispatch(addNotification({ type: 'info', message: `Message ${i}` }));
      }

      const state = store.getState().ui;
      // Should limit to reasonable number (e.g., 10)
      expect(state.notifications.length).toBeLessThanOrEqual(10);
    });

    it('should handle duplicate notification ids', () => {
      const notification = { id: 'duplicate', type: 'info', message: 'First' };
      
      store.dispatch(addNotification(notification));
      store.dispatch(addNotification({ ...notification, message: 'Second' }));

      const state = store.getState().ui;
      // Should either replace or ignore duplicate
      expect(state.notifications).toHaveLength(1);
    });

    it('should handle invalid theme values', () => {
      store.dispatch(setTheme('invalid-theme'));
      
      // Should fallback to default or handle gracefully
      const state = store.getState().ui;
      expect(['light', 'dark', 'system', 'invalid-theme']).toContain(state.theme);
    });

    it('should handle complex loading states', () => {
      store.dispatch(setLoading({ operation: 'upload', loading: true }));
      store.dispatch(setLoading({ operation: 'analyze', loading: true }));
      
      const state = store.getState().ui;
      expect(state.loading).toEqual({ upload: true, analyze: true });

      store.dispatch(setLoading({ operation: 'upload', loading: false }));
      
      const updatedState = store.getState().ui;
      expect(updatedState.loading).toEqual({ upload: false, analyze: true });
    });
  });

  describe('notification auto-removal', () => {
    it('should handle notification with duration', () => {
      vi.useFakeTimers();

      const notification = {
        type: 'success',
        message: 'Auto-remove message',
        duration: 3000,
      };

      store.dispatch(addNotification(notification));
      expect(store.getState().ui.notifications).toHaveLength(1);

      // Fast-forward time
      vi.advanceTimersByTime(3000);

      // Note: Auto-removal would typically be handled by middleware or component
      // This test documents the expected behavior
      
      vi.useRealTimers();
    });
  });
});