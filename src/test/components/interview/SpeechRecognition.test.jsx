import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import interviewReducer from '../../../store/slices/interviewSlice.js';
import SpeechRecognitionButton from '../../../components/interview/SpeechRecognitionButton.jsx';

// Mock the Web Speech API
const mockSpeechRecognition = {
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  maxAlternatives: 1,
  onstart: null,
  onresult: null,
  onerror: null,
  onend: null,
};

const mockMediaDevices = {
  getUserMedia: vi.fn(),
};

const mockPermissions = {
  query: vi.fn(),
};

// Setup global mocks
beforeEach(() => {
  // Mock SpeechRecognition
  global.SpeechRecognition = vi.fn(() => mockSpeechRecognition);
  global.webkitSpeechRecognition = vi.fn(() => mockSpeechRecognition);
  
  // Mock navigator APIs
  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: mockMediaDevices,
    writable: true,
  });
  
  Object.defineProperty(global.navigator, 'permissions', {
    value: mockPermissions,
    writable: true,
  });

  // Reset all mocks
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Helper function to create store
const createTestStore = () => {
  return configureStore({
    reducer: {
      interview: interviewReducer,
    },
  });
};

// Helper function to render component with store
const renderWithStore = (component, store = createTestStore()) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('SpeechRecognitionButton', () => {
  describe('Browser Support', () => {
    it('should render when speech recognition is supported', () => {
      renderWithStore(<SpeechRecognitionButton />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it('should show unsupported state when speech recognition is not available', () => {
      // Remove speech recognition support
      delete global.SpeechRecognition;
      delete global.webkitSpeechRecognition;
      
      renderWithStore(<SpeechRecognitionButton />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByText(/speech recognition not supported/i)).toBeInTheDocument();
    });

    it('should show browser compatibility warning when not supported', () => {
      delete global.SpeechRecognition;
      delete global.webkitSpeechRecognition;
      
      renderWithStore(<SpeechRecognitionButton />);
      
      expect(screen.getByText(/please use chrome, edge, or safari/i)).toBeInTheDocument();
    });
  });

  describe('Microphone Permissions', () => {
    it('should check microphone permissions on mount', async () => {
      mockPermissions.query.mockResolvedValue({
        state: 'granted',
        onchange: null,
      });

      renderWithStore(<SpeechRecognitionButton />);

      await waitFor(() => {
        expect(mockPermissions.query).toHaveBeenCalledWith({ name: 'microphone' });
      });
    });

    it('should show permission modal when microphone access is denied', async () => {
      mockPermissions.query.mockResolvedValue({
        state: 'denied',
        onchange: null,
      });

      renderWithStore(<SpeechRecognitionButton />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        fireEvent.click(button);
      });

      expect(screen.getByText(/microphone access required/i)).toBeInTheDocument();
      expect(screen.getByText(/allow access/i)).toBeInTheDocument();
    });

    it('should request microphone permission when allow access is clicked', async () => {
      mockPermissions.query.mockResolvedValue({
        state: 'denied',
        onchange: null,
      });

      mockMediaDevices.getUserMedia.mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      });

      renderWithStore(<SpeechRecognitionButton />);

      // Click main button to show modal
      await waitFor(() => {
        const button = screen.getByRole('button');
        fireEvent.click(button);
      });

      // Click allow access
      const allowButton = screen.getByText(/allow access/i);
      fireEvent.click(allowButton);

      await waitFor(() => {
        expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
      });
    });
  });

  describe('Recording Functionality', () => {
    beforeEach(() => {
      mockPermissions.query.mockResolvedValue({
        state: 'granted',
        onchange: null,
      });
    });

    it('should start recording when button is clicked', async () => {
      const onStart = vi.fn();
      renderWithStore(<SpeechRecognitionButton onStart={onStart} />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        fireEvent.click(button);
      });

      expect(mockSpeechRecognition.start).toHaveBeenCalled();
    });

    it('should stop recording when button is clicked while recording', async () => {
      const store = createTestStore();
      renderWithStore(<SpeechRecognitionButton />, store);

      // Start recording first
      await waitFor(() => {
        const button = screen.getByRole('button');
        fireEvent.click(button);
      });

      // Simulate recording state
      store.dispatch({ type: 'interview/setRecording', payload: true });

      // Click again to stop
      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockSpeechRecognition.stop).toHaveBeenCalled();
    });

    it('should show recording indicator when recording', () => {
      const store = createTestStore();
      store.dispatch({ type: 'interview/setRecording', payload: true });
      
      renderWithStore(<SpeechRecognitionButton />, store);

      expect(screen.getByText(/recording/i)).toBeInTheDocument();
      expect(screen.getByText(/click to stop/i)).toBeInTheDocument();
    });

    it('should call onTranscript when speech is recognized', async () => {
      const onTranscript = vi.fn();
      renderWithStore(<SpeechRecognitionButton onTranscript={onTranscript} />);

      // Simulate speech recognition result
      const mockEvent = {
        resultIndex: 0,
        results: [
          {
            0: { transcript: 'Hello world' },
            isFinal: true,
          },
        ],
      };

      // Trigger the onresult callback
      if (mockSpeechRecognition.onresult) {
        mockSpeechRecognition.onresult(mockEvent);
      }

      expect(onTranscript).toHaveBeenCalledWith('Hello world', false);
    });

    it('should handle interim results', async () => {
      const onTranscript = vi.fn();
      renderWithStore(<SpeechRecognitionButton onTranscript={onTranscript} />);

      // Simulate interim speech recognition result
      const mockEvent = {
        resultIndex: 0,
        results: [
          {
            0: { transcript: 'Hello' },
            isFinal: false,
          },
        ],
      };

      // Trigger the onresult callback
      if (mockSpeechRecognition.onresult) {
        mockSpeechRecognition.onresult(mockEvent);
      }

      expect(onTranscript).toHaveBeenCalledWith('Hello', true);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockPermissions.query.mockResolvedValue({
        state: 'granted',
        onchange: null,
      });
    });

    it('should handle speech recognition errors', async () => {
      const onError = vi.fn();
      renderWithStore(<SpeechRecognitionButton onError={onError} />);

      // Simulate error
      const mockError = {
        error: 'no-speech',
      };

      if (mockSpeechRecognition.onerror) {
        mockSpeechRecognition.onerror(mockError);
      }

      expect(onError).toHaveBeenCalledWith(
        'No speech detected. Please try speaking again.',
        'no-speech'
      );
    });

    it('should show error state in UI', () => {
      const store = createTestStore();
      renderWithStore(<SpeechRecognitionButton />, store);

      // Simulate error by calling onerror
      const mockError = { error: 'network' };
      if (mockSpeechRecognition.onerror) {
        mockSpeechRecognition.onerror(mockError);
      }

      expect(screen.getByText(/network error occurred/i)).toBeInTheDocument();
    });

    it('should handle microphone access denied error', () => {
      const onError = vi.fn();
      renderWithStore(<SpeechRecognitionButton onError={onError} />);

      const mockError = { error: 'not-allowed' };
      if (mockSpeechRecognition.onerror) {
        mockSpeechRecognition.onerror(mockError);
      }

      expect(onError).toHaveBeenCalledWith(
        'Microphone access denied. Please allow microphone access and try again.',
        'not-allowed'
      );
    });
  });

  describe('Transcript Display', () => {
    it('should show transcript when showTranscript is true', () => {
      const store = createTestStore();
      store.dispatch({ type: 'interview/setRecording', payload: true });
      
      renderWithStore(<SpeechRecognitionButton showTranscript={true} />, store);

      expect(screen.getByText(/live transcript/i)).toBeInTheDocument();
    });

    it('should hide transcript when showTranscript is false', () => {
      const store = createTestStore();
      store.dispatch({ type: 'interview/setRecording', payload: true });
      
      renderWithStore(<SpeechRecognitionButton showTranscript={false} />, store);

      expect(screen.queryByText(/live transcript/i)).not.toBeInTheDocument();
    });

    it('should clear transcript when clear button is clicked', async () => {
      const store = createTestStore();
      store.dispatch({ type: 'interview/setRecording', payload: true });
      
      renderWithStore(<SpeechRecognitionButton showTranscript={true} />, store);

      // Add some transcript content first
      const mockEvent = {
        resultIndex: 0,
        results: [
          {
            0: { transcript: 'Test transcript' },
            isFinal: true,
          },
        ],
      };

      if (mockSpeechRecognition.onresult) {
        mockSpeechRecognition.onresult(mockEvent);
      }

      await waitFor(() => {
        const clearButton = screen.getByText(/clear/i);
        fireEvent.click(clearButton);
      });

      // Transcript should be cleared
      expect(screen.queryByText('Test transcript')).not.toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    it('should be disabled when disabled prop is true', () => {
      renderWithStore(<SpeechRecognitionButton disabled={true} />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should apply custom className', () => {
      renderWithStore(<SpeechRecognitionButton className="custom-class" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should render different sizes correctly', () => {
      const { rerender } = renderWithStore(<SpeechRecognitionButton size="small" />);
      
      let button = screen.getByRole('button');
      expect(button).toHaveClass('w-10', 'h-10');

      rerender(
        <Provider store={createTestStore()}>
          <SpeechRecognitionButton size="large" />
        </Provider>
      );
      
      button = screen.getByRole('button');
      expect(button).toHaveClass('w-16', 'h-16');
    });
  });
});