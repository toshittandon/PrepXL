import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  RefreshCw,
  Headphones
} from 'lucide-react'

import {
  setIsRecording,
  setSpeechRecognitionSupported,
  setMicrophonePermission,
  setSpeechError,
  clearSpeechError,
  setCurrentTranscript,
  setFinalTranscript,
  clearTranscripts
} from '../../store/slices/interviewSlice.js'

const SpeechRecognition = ({ 
  onTranscriptChange,
  onFinalTranscript,
  disabled = false,
  className = ''
}) => {
  const dispatch = useDispatch()
  const {
    isRecording,
    speechRecognitionSupported,
    microphonePermission,
    speechError,
    currentTranscript,
    useVoiceInput
  } = useSelector((state) => state.interview)

  const recognitionRef = useRef(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const microphoneRef = useRef(null)
  const animationFrameRef = useRef(null)

  // Initialize speech recognition on component mount
  useEffect(() => {
    initializeSpeechRecognition()
    return () => {
      cleanup()
    }
  }, [])

  // Handle transcript changes
  useEffect(() => {
    if (onTranscriptChange && currentTranscript) {
      onTranscriptChange(currentTranscript)
    }
  }, [currentTranscript, onTranscriptChange])

  const initializeSpeechRecognition = async () => {
    try {
      setIsInitializing(true)
      dispatch(clearSpeechError())

      // Check for speech recognition support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      
      if (!SpeechRecognition) {
        dispatch(setSpeechRecognitionSupported(false))
        dispatch(setSpeechError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.'))
        return
      }

      dispatch(setSpeechRecognitionSupported(true))

      // Create recognition instance
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      recognition.maxAlternatives = 1

      // Set up event handlers
      recognition.onstart = () => {
        dispatch(setIsRecording(true))
        dispatch(clearSpeechError())
      }

      recognition.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        if (interimTranscript) {
          dispatch(setCurrentTranscript(interimTranscript))
        }

        if (finalTranscript) {
          dispatch(setFinalTranscript(finalTranscript))
          if (onFinalTranscript) {
            onFinalTranscript(finalTranscript)
          }
        }
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        
        let errorMessage = 'Speech recognition error occurred'
        
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access and try again.'
            dispatch(setMicrophonePermission('denied'))
            break
          case 'no-speech':
            errorMessage = 'No speech detected. Please speak clearly into your microphone.'
            break
          case 'audio-capture':
            errorMessage = 'No microphone found. Please check your microphone connection.'
            break
          case 'network':
            errorMessage = 'Network error occurred. Please check your internet connection.'
            break
          case 'service-not-allowed':
            errorMessage = 'Speech recognition service is not available.'
            break
          default:
            errorMessage = `Speech recognition error: ${event.error}`
        }

        dispatch(setSpeechError(errorMessage))
        dispatch(setIsRecording(false))
      }

      recognition.onend = () => {
        dispatch(setIsRecording(false))
        
        // Auto-restart if we were recording and no error occurred
        if (isRecording && !speechError && useVoiceInput && !disabled) {
          setTimeout(() => {
            if (recognitionRef.current && useVoiceInput) {
              try {
                recognitionRef.current.start()
              } catch (error) {
                console.warn('Failed to restart speech recognition:', error)
              }
            }
          }, 100)
        }
      }

      recognitionRef.current = recognition

      // Check microphone permission
      await checkMicrophonePermission()

    } catch (error) {
      console.error('Failed to initialize speech recognition:', error)
      dispatch(setSpeechError('Failed to initialize speech recognition'))
    } finally {
      setIsInitializing(false)
    }
  }

  const checkMicrophonePermission = async () => {
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'microphone' })
        dispatch(setMicrophonePermission(permission.state))
        
        permission.onchange = () => {
          dispatch(setMicrophonePermission(permission.state))
        }
      } else {
        // Fallback: try to access microphone to check permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        dispatch(setMicrophonePermission('granted'))
        
        // Set up audio level monitoring
        setupAudioLevelMonitoring(stream)
        
        stream.getTracks().forEach(track => track.stop())
      }
    } catch (error) {
      dispatch(setMicrophonePermission('denied'))
      dispatch(setSpeechError('Microphone access is required for voice input'))
    }
  }

  const setupAudioLevelMonitoring = (stream) => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream)
      
      analyserRef.current.fftSize = 256
      microphoneRef.current.connect(analyserRef.current)
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      
      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
          setAudioLevel(average / 255)
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
        }
      }
      
      updateAudioLevel()
    } catch (error) {
      console.warn('Failed to set up audio level monitoring:', error)
    }
  }

  const startRecording = async () => {
    if (!recognitionRef.current || disabled || !useVoiceInput) return

    try {
      dispatch(clearSpeechError())
      dispatch(clearTranscripts())
      
      // Request microphone permission if needed
      if (microphonePermission !== 'granted') {
        await checkMicrophonePermission()
      }
      
      recognitionRef.current.start()
    } catch (error) {
      console.error('Failed to start recording:', error)
      dispatch(setSpeechError('Failed to start recording. Please try again.'))
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    setAudioLevel(0)
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const retryInitialization = () => {
    dispatch(clearSpeechError())
    initializeSpeechRecognition()
  }

  const cleanup = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    
    dispatch(setIsRecording(false))
    dispatch(clearTranscripts())
  }

  // Don't render if speech recognition is not supported
  if (!speechRecognitionSupported) {
    return (
      <div className={`bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Speech Recognition Not Available
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Please use Chrome, Edge, or Safari for voice input, or continue with text input.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Error Display */}
      <AnimatePresence>
        {speechError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
          >
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Speech Recognition Error
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {speechError}
                </p>
                <button
                  onClick={retryInitialization}
                  className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Try Again</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording Controls */}
      <div className="flex items-center justify-center space-x-4">
        {/* Main Recording Button */}
        <motion.button
          onClick={toggleRecording}
          disabled={disabled || !useVoiceInput || isInitializing || microphonePermission === 'denied'}
          className={`
            relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200
            focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900
            ${isRecording
              ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500 shadow-lg'
              : 'bg-primary-500 hover:bg-primary-600 focus:ring-primary-500 shadow-md hover:shadow-lg'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          whileHover={!disabled ? { scale: 1.05 } : {}}
          whileTap={!disabled ? { scale: 0.95 } : {}}
        >
          {isInitializing ? (
            <RefreshCw className="w-6 h-6 text-white animate-spin" />
          ) : isRecording ? (
            <MicOff className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
          
          {/* Audio level indicator */}
          {isRecording && (
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-white/30"
              animate={{
                scale: 1 + (audioLevel * 0.3),
                opacity: 0.7 + (audioLevel * 0.3)
              }}
              transition={{ duration: 0.1 }}
            />
          )}
        </motion.button>

        {/* Status Indicators */}
        <div className="flex flex-col items-center space-y-2">
          {/* Recording Status */}
          <div className="flex items-center space-x-2">
            {isRecording ? (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  Recording...
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {disabled ? 'Disabled' : useVoiceInput ? 'Ready' : 'Voice input off'}
                </span>
              </>
            )}
          </div>

          {/* Microphone Permission Status */}
          {microphonePermission === 'denied' && (
            <div className="flex items-center space-x-1 text-xs text-red-600 dark:text-red-400">
              <VolumeX className="w-3 h-3" />
              <span>Microphone access denied</span>
            </div>
          )}
          
          {microphonePermission === 'granted' && (
            <div className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400">
              <Volume2 className="w-3 h-3" />
              <span>Microphone ready</span>
            </div>
          )}
        </div>
      </div>

      {/* Current Transcript Display */}
      <AnimatePresence>
        {currentTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
          >
            <div className="flex items-start space-x-3">
              <Headphones className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                  Listening...
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 italic">
                  "{currentTranscript}"
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      {!isRecording && !speechError && (
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {useVoiceInput 
              ? 'Click the microphone to start voice recording'
              : 'Voice input is disabled. Use text input below.'
            }
          </p>
        </div>
      )}
    </div>
  )
}

export default SpeechRecognition