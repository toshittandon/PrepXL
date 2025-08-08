import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Button, 
  Card, 
  ErrorMessage, 
  Input, 
  LoadingSpinner, 
  Modal, 
  ProgressBar, 
  Select, 
  SuccessMessage 
} from '../components/common/index.js'
import { Search, User, Mail } from 'lucide-react'

const ComponentDemo = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [selectValue, setSelectValue] = useState('')
  const [showError, setShowError] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [progress, setProgress] = useState(45)

  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
    { value: 'option4', label: 'Option 4' }
  ]

  const handleProgressIncrease = () => {
    setProgress(prev => Math.min(prev + 10, 100))
  }

  const handleProgressDecrease = () => {
    setProgress(prev => Math.max(prev - 10, 0))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Common UI Components Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Showcase of all common UI components with theme support
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Buttons Section */}
          <Card className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Buttons</h2>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button loading>Loading</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
          </Card>

          {/* Form Components Section */}
          <Card className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Form Components</h2>
            <div className="space-y-4">
              <Input
                label="Text Input"
                placeholder="Enter some text..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
              />
              
              <Input
                label="Email Input"
                type="email"
                placeholder="Enter your email..."
                leftIcon={<Mail className="w-4 h-4" />}
                success={inputValue.includes('@') ? 'Valid email format' : undefined}
                error={inputValue && !inputValue.includes('@') ? 'Please enter a valid email' : undefined}
              />

              <Input
                label="Password Input"
                type="password"
                placeholder="Enter password..."
                showPasswordToggle
                helperText="Password should be at least 8 characters"
              />

              <Select
                label="Select Option"
                options={selectOptions}
                value={selectValue}
                onChange={setSelectValue}
                placeholder="Choose an option..."
                searchable
              />
            </div>
          </Card>

          {/* Messages Section */}
          <Card className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Messages</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="danger"
                  onClick={() => setShowError(!showError)}
                >
                  Toggle Error
                </Button>
                <Button 
                  size="sm" 
                  variant="primary"
                  onClick={() => setShowSuccess(!showSuccess)}
                >
                  Toggle Success
                </Button>
              </div>
              
              {showError && (
                <ErrorMessage message="This is an error message with icon" />
              )}
              
              {showSuccess && (
                <SuccessMessage message="This is a success message with icon" />
              )}
              
              <ErrorMessage 
                message="Inline error message" 
                variant="inline" 
              />
              
              <SuccessMessage 
                message="Inline success message" 
                variant="inline" 
              />
            </div>
          </Card>

          {/* Progress and Loading Section */}
          <Card className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Progress & Loading</h2>
            <div className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button size="sm" onClick={handleProgressDecrease}>-10%</Button>
                <Button size="sm" onClick={handleProgressIncrease}>+10%</Button>
              </div>
              
              <ProgressBar
                value={progress}
                max={100}
                label="Upload Progress"
                showLabel
                showPercentage
                variant="primary"
              />
              
              <ProgressBar
                value={75}
                max={100}
                variant="success"
                size="sm"
                striped
              />
              
              <ProgressBar
                indeterminate
                variant="info"
                label="Loading..."
                showLabel
              />
              
              <div className="flex items-center gap-4">
                <LoadingSpinner size="sm" />
                <LoadingSpinner size="md" />
                <LoadingSpinner size="lg" />
                <LoadingSpinner size="xl" />
              </div>
            </div>
          </Card>

          {/* Modal Section */}
          <Card className="space-y-4 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Modal</h2>
            <div className="flex gap-3">
              <Button onClick={() => setIsModalOpen(true)}>
                Open Modal
              </Button>
            </div>
          </Card>
        </div>

        {/* Modal Component */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Demo Modal"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              This is a demo modal with theme support and smooth animations.
            </p>
            
            <Input
              label="Modal Input"
              placeholder="Type something..."
              leftIcon={<Search className="w-4 h-4" />}
            />
            
            <div className="flex justify-end gap-3">
              <Button 
                variant="secondary" 
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="primary"
                onClick={() => setIsModalOpen(false)}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default ComponentDemo