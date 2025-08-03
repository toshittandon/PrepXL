
import { motion } from 'framer-motion'
import { MessageSquare, Play } from 'lucide-react'

const InterviewSetup = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageSquare className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Interview Practice Setup
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          This feature will be implemented in a future task. Set up AI-powered interview sessions.
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-200 dark:border-gray-700">
          <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Coming soon: AI-powered interview practice with speech recognition
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default InterviewSetup