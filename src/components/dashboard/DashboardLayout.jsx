import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'

const DashboardLayout = ({ children }) => {
  const { user } = useSelector((state) => state.auth)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.name || 'User'}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ready to ace your next interview? Let's get started with your preparation.
          </p>
        </motion.div>

        {/* Dashboard Content */}
        <div className="space-y-8">
          {children}
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout