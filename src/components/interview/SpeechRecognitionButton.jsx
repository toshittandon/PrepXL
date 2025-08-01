import { useState, useEffect } from 'react';
import { MicrophoneIcon, StopIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import useSpeechRecognition from './SpeechRecognition.jsx';

const SpeechRecognitionButton = ({ 
  onTranscript, 
  onStart, 
  onStop, 
  onError,
  disabled = false,
  size = 'large',
  showTranscript = true,
  className = ''
}) => {
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const {
    isRecording,
    transcript,
    interimTranscript,
    error,
    browserSupported,
    permissionGranted,
    startRecording,
    stopRecording,
    clearTranscript,
    requestMicrophonePermission,
    status,
    isSupported
  } = useSpeechRecognition({
    onTranscript: (text, isInterim) => {
      if (!isInterim) {
        setCurrentTranscript(prev => prev + text + ' ');
        onTranscript?.(text, false);
      } else {
        onTranscript?.(text, true);
      }
    },
    onStart: () => {
      onStart?.();
    },
    onEnd: () => {
      onStop?.();
    },
    onError: (errorMessage, errorType) => {
      onError?.(errorMessage, errorType);
    },
    continuous: true,
    interimResults: true
  });

  // Handle button click
  const handleButtonClick = async () => {
    if (disabled) return;

    if (!isSupported) {
      onError?.('Speech recognition is not supported in this browser', 'not-supported');
      return;
    }

    if (permissionGranted === false) {
      setShowPermissionModal(true);
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      const success = await startRecording();
      if (!success && permissionGranted === false) {
        setShowPermissionModal(true);
      }
    }
  };

  // Handle permission request
  const handlePermissionRequest = async () => {
    const granted = await requestMicrophonePermission();
    setShowPermissionModal(false);
    
    if (granted) {
      // Auto-start recording after permission is granted
      setTimeout(() => {
        startRecording();
      }, 100);
    }
  };

  // Button size classes
  const sizeClasses = {
    small: 'w-10 h-10',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  // Icon size classes
  const iconSizeClasses = {
    small: 'w-5 h-5',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  // Get button appearance based on status
  const getButtonClasses = () => {
    const baseClasses = `${sizeClasses[size]} rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-4 ${className}`;
    
    if (disabled) {
      return `${baseClasses} bg-gray-300 cursor-not-allowed`;
    }

    switch (status) {
      case 'recording':
        return `${baseClasses} bg-red-500 hover:bg-red-600 text-white shadow-lg animate-pulse focus:ring-red-200`;
      case 'error':
        return `${baseClasses} bg-red-100 hover:bg-red-200 text-red-600 border-2 border-red-300 focus:ring-red-200`;
      case 'permission-denied':
        return `${baseClasses} bg-yellow-100 hover:bg-yellow-200 text-yellow-600 border-2 border-yellow-300 focus:ring-yellow-200`;
      case 'unsupported':
        return `${baseClasses} bg-gray-100 text-gray-400 cursor-not-allowed`;
      default:
        return `${baseClasses} bg-blue-500 hover:bg-blue-600 text-white shadow-md focus:ring-blue-200`;
    }
  };

  // Get button icon
  const getButtonIcon = () => {
    const iconClasses = iconSizeClasses[size];
    
    if (status === 'error' || status === 'permission-denied' || status === 'unsupported') {
      return <ExclamationTriangleIcon className={iconClasses} />;
    }
    
    if (isRecording) {
      return <StopIcon className={iconClasses} />;
    }
    
    return <MicrophoneIcon className={iconClasses} />;
  };

  // Get status message
  const getStatusMessage = () => {
    switch (status) {
      case 'recording':
        return 'Recording... Click to stop';
      case 'error':
        return error || 'Error occurred';
      case 'permission-denied':
        return 'Microphone access required';
      case 'unsupported':
        return 'Speech recognition not supported';
      default:
        return 'Click to start recording';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Recording Button */}
      <div className="relative">
        <button
          onClick={handleButtonClick}
          disabled={disabled || status === 'unsupported'}
          className={getButtonClasses()}
          title={getStatusMessage()}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {getButtonIcon()}
        </button>
        
        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
        )}
      </div>

      {/* Status Text */}
      <div className="text-center">
        <p className={`text-sm font-medium ${
          status === 'error' ? 'text-red-600' : 
          status === 'recording' ? 'text-blue-600' : 
          status === 'permission-denied' ? 'text-yellow-600' :
          'text-gray-600'
        }`}>
          {getStatusMessage()}
        </p>
        
        {/* Browser compatibility warning */}
        {!browserSupported && (
          <p className="text-xs text-gray-500 mt-1">
            Please use Chrome, Edge, or Safari for speech recognition
          </p>
        )}
      </div>

      {/* Live Transcript Display */}
      {showTranscript && (isRecording || currentTranscript || interimTranscript) && (
        <div className="w-full max-w-md">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700">Live Transcript</h4>
              {currentTranscript && (
                <button
                  onClick={() => {
                    setCurrentTranscript('');
                    clearTranscript();
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="text-sm text-gray-900 min-h-[2rem] max-h-32 overflow-y-auto">
              {currentTranscript && (
                <span className="text-gray-900">{currentTranscript}</span>
              )}
              {interimTranscript && (
                <span className="text-gray-500 italic">{interimTranscript}</span>
              )}
              {!currentTranscript && !interimTranscript && isRecording && (
                <span className="text-gray-400 italic">Listening...</span>
              )}
              {!currentTranscript && !interimTranscript && !isRecording && (
                <span className="text-gray-400 italic">No speech detected</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Permission Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <MicrophoneIcon className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Microphone Access Required
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              To use speech recognition, we need access to your microphone. 
              Your audio is processed locally and not stored or transmitted.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handlePermissionRequest}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Allow Access
              </button>
              <button
                onClick={() => setShowPermissionModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeechRecognitionButton;