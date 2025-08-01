import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setRecording, 
  setSpeechRecognitionSupported,
  selectIsRecording,
  selectSpeechRecognitionSupported 
} from '../../store/slices/interviewSlice.js';

const useSpeechRecognition = ({ 
  onTranscript, 
  onError, 
  onStart, 
  onEnd,
  continuous = true,
  interimResults = true,
  language = 'en-US'
}) => {
  const dispatch = useDispatch();
  const isRecording = useSelector(selectIsRecording);
  const speechSupported = useSelector(selectSpeechRecognitionSupported);
  
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [browserSupported, setBrowserSupported] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(null);
  
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);

  // Check browser compatibility
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const supported = !!SpeechRecognition;
    
    setBrowserSupported(supported);
    dispatch(setSpeechRecognitionSupported(supported));
    
    if (!supported) {
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    // Event handlers
    recognition.onstart = () => {
      console.log('Speech recognition started');
      isListeningRef.current = true;
      setError(null);
      onStart?.();
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptText = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcriptText;
        } else {
          interimTranscript += transcriptText;
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
        onTranscript?.(finalTranscript, false); // false = final result
      }

      if (interimTranscript) {
        setInterimTranscript(interimTranscript);
        onTranscript?.(interimTranscript, true); // true = interim result
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      let errorMessage = 'Speech recognition error occurred.';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try speaking again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found. Please check your microphone connection.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access and try again.';
          setPermissionGranted(false);
          break;
        case 'network':
          errorMessage = 'Network error occurred. Please check your internet connection.';
          break;
        case 'service-not-allowed':
          errorMessage = 'Speech recognition service not allowed. Please try again.';
          break;
        case 'bad-grammar':
          errorMessage = 'Grammar error in speech recognition.';
          break;
        case 'language-not-supported':
          errorMessage = 'Language not supported for speech recognition.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }
      
      setError(errorMessage);
      onError?.(errorMessage, event.error);
      
      // Stop recording on error
      if (isListeningRef.current) {
        dispatch(setRecording(false));
        isListeningRef.current = false;
      }
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      isListeningRef.current = false;
      dispatch(setRecording(false));
      onEnd?.();
      
      // Auto-restart if we're supposed to be recording (for continuous mode)
      if (isRecording && continuous && !error) {
        setTimeout(() => {
          if (isRecording && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (err) {
              console.warn('Failed to restart recognition:', err);
            }
          }
        }, 100);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, [continuous, interimResults, language, dispatch, onStart, onTranscript, onError, onEnd, isRecording, error]);

  // Check microphone permissions
  const checkMicrophonePermission = useCallback(async () => {
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'microphone' });
        setPermissionGranted(permission.state === 'granted');
        
        permission.onchange = () => {
          setPermissionGranted(permission.state === 'granted');
        };
      } else {
        // Fallback: try to access microphone directly
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          setPermissionGranted(true);
        } catch (err) {
          setPermissionGranted(false);
        }
      }
    } catch (err) {
      console.warn('Could not check microphone permission:', err);
      setPermissionGranted(null);
    }
  }, []);

  useEffect(() => {
    checkMicrophonePermission();
  }, [checkMicrophonePermission]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!browserSupported) {
      setError('Speech recognition is not supported in this browser.');
      return false;
    }

    if (!recognitionRef.current) {
      setError('Speech recognition not initialized.');
      return false;
    }

    if (isListeningRef.current) {
      console.warn('Already recording');
      return true;
    }

    // Check microphone permission before starting
    if (permissionGranted === false) {
      setError('Microphone access is required. Please allow microphone access and try again.');
      return false;
    }

    try {
      // Clear previous transcripts
      setTranscript('');
      setInterimTranscript('');
      setError(null);
      
      // Start recognition
      recognitionRef.current.start();
      dispatch(setRecording(true));
      return true;
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError('Failed to start speech recognition. Please try again.');
      return false;
    }
  }, [browserSupported, permissionGranted, dispatch]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (!recognitionRef.current || !isListeningRef.current) {
      return;
    }

    try {
      recognitionRef.current.stop();
      dispatch(setRecording(false));
    } catch (err) {
      console.error('Failed to stop speech recognition:', err);
    }
  }, [dispatch]);

  // Pause recording (stop without clearing state)
  const pauseRecording = useCallback(() => {
    if (!recognitionRef.current || !isListeningRef.current) {
      return;
    }

    try {
      recognitionRef.current.abort();
      dispatch(setRecording(false));
    } catch (err) {
      console.error('Failed to pause speech recognition:', err);
    }
  }, [dispatch]);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Request microphone permission
  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
      setError(null);
      return true;
    } catch (err) {
      console.error('Microphone permission denied:', err);
      setPermissionGranted(false);
      setError('Microphone access denied. Please allow microphone access in your browser settings.');
      return false;
    }
  }, []);

  // Get current status
  const getStatus = useCallback(() => {
    if (!browserSupported) return 'unsupported';
    if (permissionGranted === false) return 'permission-denied';
    if (error) return 'error';
    if (isRecording) return 'recording';
    return 'ready';
  }, [browserSupported, permissionGranted, error, isRecording]);

  return {
    // State
    isRecording,
    transcript,
    interimTranscript,
    error,
    browserSupported,
    permissionGranted,
    
    // Actions
    startRecording,
    stopRecording,
    pauseRecording,
    clearTranscript,
    requestMicrophonePermission,
    
    // Status
    status: getStatus(),
    isSupported: browserSupported && speechSupported,
  };
};

export default useSpeechRecognition;