import { useSelector } from 'react-redux';
import { MicrophoneIcon } from '@heroicons/react/24/outline';
import { selectIsRecording, selectSpeechRecognitionSupported } from '../../store/slices/interviewSlice.js';

const SpeechRecognitionIndicator = ({ 
  showText = true, 
  size = 'small',
  className = '' 
}) => {
  const isRecording = useSelector(selectIsRecording);
  const speechSupported = useSelector(selectSpeechRecognitionSupported);

  if (!speechSupported) {
    return null;
  }

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        <MicrophoneIcon 
          className={`${sizeClasses[size]} ${
            isRecording ? 'text-red-500' : 'text-gray-400'
          } transition-colors`}
        />
        {isRecording && (
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
        )}
      </div>
      
      {showText && (
        <span className={`${textSizeClasses[size]} font-medium ${
          isRecording ? 'text-red-600' : 'text-gray-500'
        } transition-colors`}>
          {isRecording ? 'Recording' : 'Ready'}
        </span>
      )}
    </div>
  );
};

export default SpeechRecognitionIndicator;