import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import SignupForm from '../../components/forms/SignupForm.jsx'
import OAuthButtons from '../../components/forms/OAuthButtons.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import Card from '../../components/common/Card.jsx'

const Signup = () => {
  const { error } = useSelector((state) => state.auth)
  const navigate = useNavigate()

  const handleSignupSuccess = (user) => {
    // Always redirect new users to profile setup
    navigate('/profile/setup')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back to Home Link */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create Your Account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Join InterviewPrep AI and start your interview preparation journey
          </p>
        </motion.div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="py-8 px-4 shadow-xl sm:px-10">
            {/* Global Error Message */}
            {error && (
              <div className="mb-6">
                <ErrorMessage message={error} />
              </div>
            )}

            {/* Signup Form */}
            <SignupForm onSuccess={handleSignupSuccess} />

            {/* OAuth Buttons */}
            <div className="mt-6">
              <OAuthButtons mode="signup" />
            </div>

            {/* Sign In Link */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    Already have an account?
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                >
                  Sign in to your account
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400"
      >
        <p>
          By creating an account, you agree to our{' '}
          <Link to="/terms" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

export default Signup