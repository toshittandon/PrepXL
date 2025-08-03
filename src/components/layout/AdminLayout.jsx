import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import AuthGuard from '../common/AuthGuard'
import Header from './Header'
import Sidebar from './Sidebar'
import Footer from './Footer'

const AdminLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut'
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: {
        duration: 0.3,
        ease: 'easeIn'
      }
    }
  }

  return (
    <AuthGuard requireAuth={true} requireAdmin={true}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        {/* Header */}
        <Header 
          onMobileMenuToggle={handleMobileMenuToggle}
          isMobileMenuOpen={isMobileMenuOpen}
        />

        {/* Mobile Sidebar */}
        <Sidebar 
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Admin Banner */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white py-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span className="text-sm font-medium">
                Administrator Dashboard
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1">
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
          >
            <Outlet />
          </motion.div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </AuthGuard>
  )
}

export default AdminLayout