import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import Button from '../../components/common/Button.jsx'
import Card from '../../components/common/Card.jsx'

const OAuthError = () => {
  const navigate = useNavigate()

  useEffect(() => {
    // Auto-redirect to login after 10 seconds
    const timer = setTimeout(() => {
      navigate('/login')
    }, 10000)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="py-8 px-4 shadow-xl sm:px-10 text-center">
            <div className="mb-6">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Authentication Failed
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                We couldn't complete your sign-in with the selected provider.
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This could happen if:
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 text-left space-y-1">
                <li>• You cancelled the authentication process</li>
                <li>• The provider denied access</li>
                <li>• There was a temporary network issue</li>
              </ul>
            </div>

            <div className="mt-8 space-y-4">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                Try Again
              </Button>

              <Link
                to="/"
                className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </div>

            <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
              You will be automatically redirected to the login page in 10 seconds.
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default OAuthError