import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward, 
  Settings,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

import Button from '../common/Button.jsx'
import Modal from '../common/Modal.jsx'

const InterviewControls = ({
  isStarted = false,
  isPaused = false,
  isCompleted = false,
  canStart = true,
  canPause = true,
  canEnd = true,
  canSkip = true,
  onStart,
  onPause,
  onResume,
  onEnd,
  onSkip,
  onSettingsChange,
  settings = {},
  loading = false,
  className = ''
}) => {
  const [showEndConfirmation, setShowEndConfirmation] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [localSettings, setLocalSettings] = useState({
    useVoiceInput: true,
    autoAdvanceQuestions: false,
    showHints: true,
    ...settings
  })

  const handleStart = () => {
    if (onStart && canStart) {
      onStart()
    }
  }

  const handlePause = () => {
    if (onPause && canPause) {
      onPause()
    }
  }

  const handleResume = () => {
    if (onResume) {
      onResume()
    }
  }

  const handleEnd = () => {
    setShowEndConfirmation(true)
  }

  const confirmEnd = () => {
    if (onEnd && canEnd) {
      onEnd()
    }
    setShowEndConfirmation(false)
  }

  const handleSkip = () => {
    if (onSkip && canSkip) {
      onSkip()
    }
  }

  const handleSettingsChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value }
    setLocalSettings(newSettings)
    
    if (onSettingsChange) {
      onSettingsChange(newSettings)
    }
  }

  const getMainButtonConfig = () => {
    if (isCompleted) {
      return {
        icon: CheckCircle,
        text: 'Interview Complete',
        variant: 'secondary',
        disabled: true
      }
    }
    
    if (!isStarted) {
      return {
        icon: Play,
        text: 'Start Interview',
        variant: 'primary',
        disabled: !canStart || loading,
        onClick: handleStart
      }
    }
    
    if (isPaused) {
      return {
        icon: Play,
        text: 'Resume',
        variant: 'primary',
        disabled: loading,
        onClick: handleResume
      }
    }
    
    return {
      icon: Pause,
      text: 'Pause',
      variant: 'secondary',
      disabled: !canPause || loading,
      onClick: handlePause
    }
  }

  const mainButton = getMainButtonConfig()
  const MainIcon = mainButton.icon

  return (
    <>
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="flex items-center justify-between">
          {/* Main Control */}
          <div className="flex items-center space-x-4">
            <Button
              onClick={mainButton.onClick}
              variant={mainButton.variant}
              size="lg"
              disabled={mainButton.disabled}
              loading={loading}
              className="min-w-[140px]"
            >
              <MainIcon className="w-5 h-5 mr-2" />
              {mainButton.text}
            </Button>

            {/* Secondary Controls */}
            {isStarted && !isCompleted && (
              <div className="flex items-center space-x-2">
                {/* Skip Question */}
                <Button
                  onClick={handleSkip}
                  variant="ghost"
                  size="md"
                  disabled={!canSkip || loading}
                  title="Skip to next question"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>

                {/* End Interview */}
                <Button
                  onClick={handleEnd}
                  variant="danger"
                  size="md"
                  disabled={!canEnd || loading}
                >
                  <Square className="w-4 h-4 mr-2" />
                  End Interview
                </Button>
              </div>
            )}
          </div>

          {/* Settings and Status */}
          <div className="flex items-center space-x-4">
            {/* Voice Input Status */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              {localSettings.useVoiceInput ? (
                <>
                  <Volume2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span>Voice On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-gray-400" />
                  <span>Text Only</span>
                </>
              )}
            </div>

            {/* Settings Button */}
            <Button
              onClick={() => setShowSettings(true)}
              variant="ghost"
              size="md"
              disabled={loading}
              title="Interview settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Status Messages */}
        <AnimatePresence>
          {isPaused && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center space-x-2 text-sm text-yellow-600 dark:text-yellow-400">
                <Pause className="w-4 h-4" />
                <span>Interview is paused. Click Resume to continue.</span>
              </div>
            </motion.div>
          )}

          {isCompleted && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span>Interview completed successfully! You can now view your feedback report.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* End Interview Confirmation Modal */}
      <Modal
        isOpen={showEndConfirmation}
        onClose={() => setShowEndConfirmation(false)}
        title="End Interview"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-gray-900 dark:text-white font-medium mb-2">
                Are you sure you want to end this interview?
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                This action cannot be undone. Your current progress will be saved, and you'll be taken to the feedback report.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              onClick={() => setShowEndConfirmation(false)}
              variant="secondary"
              size="md"
            >
              Continue Interview
            </Button>
            <Button
              onClick={confirmEnd}
              variant="danger"
              size="md"
            >
              End Interview
            </Button>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Interview Settings"
        size="md"
      >
        <div className="space-y-6">
          {/* Voice Input Setting */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Voice Input
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enable microphone for voice responses
              </p>
            </div>
            <button
              onClick={() => handleSettingsChange('useVoiceInput', !localSettings.useVoiceInput)}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${localSettings.useVoiceInput 
                  ? 'bg-primary-600' 
                  : 'bg-gray-200 dark:bg-gray-700'
                }
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${localSettings.useVoiceInput ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* Auto Advance Setting */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Auto Advance Questions
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically move to next question after answering
              </p>
            </div>
            <button
              onClick={() => handleSettingsChange('autoAdvanceQuestions', !localSettings.autoAdvanceQuestions)}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${localSettings.autoAdvanceQuestions 
                  ? 'bg-primary-600' 
                  : 'bg-gray-200 dark:bg-gray-700'
                }
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${localSettings.autoAdvanceQuestions ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* Show Hints Setting */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Show Question Hints
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Display helpful tips for answering questions
              </p>
            </div>
            <button
              onClick={() => handleSettingsChange('showHints', !localSettings.showHints)}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${localSettings.showHints 
                  ? 'bg-primary-600' 
                  : 'bg-gray-200 dark:bg-gray-700'
                }
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${localSettings.showHints ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          <div className="flex items-center justify-end pt-4">
            <Button
              onClick={() => setShowSettings(false)}
              variant="primary"
              size="md"
            >
              Save Settings
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default InterviewControls