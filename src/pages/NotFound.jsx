import { motion } from 'framer-motion'
import { Home, ArrowLeft, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button'

const NotFound = () => {
  const navigate = useNavigate()

  const handleGoHome = () => {
    navigate('/dashboard')
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        {/* 404 Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-8"
        >
          <div className="text-8xl font-bold text-gray-300 dark:text-gray-600 mb-4">
            404
          </div>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto"
          >
            <Search className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </motion.div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Page Not Found
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleGoHome}
              variant="primary"
              className="w-full"
              icon={Home}
            >
              Go to Dashboard
            </Button>

            <Button
              onClick={handleGoBack}
              variant="secondary"
              className="w-full"
              icon={ArrowLeft}
            >
              Go Back
            </Button>
          </div>

          {/* Helpful Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Looking for something specific?
            </p>
            
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <button
                onClick={() => navigate('/resume-upload')}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Upload Resume
              </button>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <button
                onClick={() => navigate('/interview/setup')}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Start Interview
              </button>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <button
                onClick={() => navigate('/library')}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Q&A Library
              </button>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default NotFound