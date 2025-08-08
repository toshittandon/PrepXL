import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Type, 
  Mic, 
  Send, 
  RotateCcw, 
  Save,
  Clock,
  AlertCircle
} from 'lucide-react'

import Button from '../common/Button.jsx'
import SpeechRecognition from './SpeechRecognition.jsx'
import {
  setUseVoiceInput,
  setFinalTranscript,
  clearTranscripts,
  setSavingInteraction
} from '../../store/slices/interviewSlice.js'

const AnswerCapture = ({
  onAnswerSubmit,
  onAnswerSave,
  disabled = false,
  placeholder = "Type your answer here or use voice input...",
  maxLength = 2000,
  showTimer = true,
  className = ''
}) => {
  const dispatch = useDispatch()
  const {
    useVoiceInput,
    finalTranscript,
    savingInteraction,
    currentQuestion
  } = useSelector((state) => state.interview)

  const [textAnswer, setTextAnswer] = useState('')
  const [startTime, setStartTime] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [inputMode, setInputMode] = useState(useVoiceInput ? 'voice' : 'text')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  const textareaRef = useRef(null)
  const timerRef = useRef(null)

  // Start timer when component mounts or question changes
  useEffect(() => {
    if (currentQuestion && !disabled) {
      setStartTime(Date.now())
      setElapsedTime(0)
      
      timerRef.current = setInterval(() => {
        if (startTime) {
          setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
        }
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [currentQuestion, disabled])

  // Handle final transcript from speech recognition
  useEffect(() => {
    if (finalTranscript && inputMode === 'voice') {
      const newAnswer = textAnswer + (textAnswer ? ' ' : '') + finalTranscript
      setTextAnswer(newAnswer)
      setHasUnsavedChanges(true)
      dispatch(clearTranscripts())
    }
  }, [finalTranscript, textAnswer, inputMode, dispatch])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [textAnswer])

  const handleTextChange = (e) => {
    const value = e.target.value
    if (value.length <= maxLength) {
      setTextAnswer(value)
      setHasUnsavedChanges(true)
    }
  }

  const handleInputModeChange = (mode) => {
    setInputMode(mode)
    dispatch(setUseVoiceInput(mode === 'voice'))
    
    if (mode === 'text' && textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const handleTranscriptChange = (transcript) => {
    // Real-time transcript display is handled in SpeechRecognition component
    // This is for any additional processing if needed
  }

  const handleFinalTranscript = (transcript) => {
    // This is handled in the useEffect above
  }

  const handleSubmit = async () => {
    if (!textAnswer.trim() || disabled) return

    const answerData = {
      text: textAnswer.trim(),
      timeSpent: elapsedTime,
      inputMethod: inputMode,
      timestamp: new Date().toISOString()
    }

    try {
      if (onAnswerSubmit) {
        await onAnswerSubmit(answerData)
      }
      
      // Reset form
      setTextAnswer('')
      setHasUnsavedChanges(false)
      setStartTime(Date.now())
      setElapsedTime(0)
      dispatch(clearTranscripts())
      
    } catch (error) {
      console.error('Failed to submit answer:', error)
    }
  }

  const handleSave = async () => {
    if (!textAnswer.trim() || disabled) return

    const answerData = {
      text: textAnswer.trim(),
      timeSpent: elapsedTime,
      inputMethod: inputMode,
      timestamp: new Date().toISOString(),
      isDraft: true
    }

    try {
      dispatch(setSavingInteraction(true))
      
      if (onAnswerSave) {
        await onAnswerSave(answerData)
      }
      
      setHasUnsavedChanges(false)
      
    } catch (error) {
      console.error('Failed to save answer:', error)
    } finally {
      dispatch(setSavingInteraction(false))
    }
  }

  const handleClear = () => {
    setTextAnswer('')
    setHasUnsavedChanges(false)
    dispatch(clearTranscripts())
    
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getCharacterCountColor = () => {
    const percentage = (textAnswer.length / maxLength) * 100
    if (percentage >= 95) return 'text-red-600 dark:text-red-400'
    if (percentage >= 80) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-gray-500 dark:text-gray-400'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Input Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => handleInputModeChange('voice')}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
              ${inputMode === 'voice'
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }
            `}
          >
            <Mic className="w-4 h-4" />
            <span>Voice</span>
          </button>
          <button
            onClick={() => handleInputModeChange('text')}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
              ${inputMode === 'text'
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }
            `}
          >
            <Type className="w-4 h-4" />
            <span>Text</span>
          </button>
        </div>

        {/* Timer */}
        {showTimer && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>{formatTime(elapsedTime)}</span>
          </div>
        )}
      </div>

      {/* Speech Recognition (shown when voice mode is active) */}
      <AnimatePresence>
        {inputMode === 'voice' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <SpeechRecognition
              onTranscriptChange={handleTranscriptChange}
              onFinalTranscript={handleFinalTranscript}
              disabled={disabled}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text Input Area */}
      <div className="space-y-3">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={textAnswer}
            onChange={handleTextChange}
            placeholder={placeholder}
            disabled={disabled}
            rows={4}
            className={`
              w-full px-4 py-3 border rounded-xl resize-none transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
              placeholder-gray-400 dark:placeholder-gray-500
              bg-white dark:bg-gray-800 text-gray-900 dark:text-white
              ${disabled 
                ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900' 
                : 'border-gray-300 dark:border-gray-600'
              }
            `}
            style={{ minHeight: '120px', maxHeight: '300px' }}
          />
          
          {/* Character count */}
          <div className="absolute bottom-3 right-3">
            <span className={`text-xs font-medium ${getCharacterCountColor()}`}>
              {textAnswer.length}/{maxLength}
            </span>
          </div>
        </div>

        {/* Unsaved changes indicator */}
        <AnimatePresence>
          {hasUnsavedChanges && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center space-x-2 text-sm text-yellow-600 dark:text-yellow-400"
            >
              <AlertCircle className="w-4 h-4" />
              <span>You have unsaved changes</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          {/* Clear Button */}
          <Button
            onClick={handleClear}
            variant="ghost"
            size="sm"
            disabled={disabled || !textAnswer.trim()}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear
          </Button>

          {/* Save Draft Button */}
          <Button
            onClick={handleSave}
            variant="secondary"
            size="sm"
            loading={savingInteraction}
            disabled={disabled || !textAnswer.trim() || !hasUnsavedChanges}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          variant="primary"
          size="md"
          disabled={disabled || !textAnswer.trim()}
        >
          <Send className="w-4 h-4 mr-2" />
          Submit Answer
        </Button>
      </div>

      {/* Help Text */}
      <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
        <p>
          {inputMode === 'voice' 
            ? 'Use the microphone to record your answer, or type in the text area above.'
            : 'Type your answer in the text area above, or switch to voice mode.'
          }
        </p>
        <p>
          Your answer will be automatically saved as you speak or type.
        </p>
      </div>
    </div>
  )
}

export default AnswerCapture