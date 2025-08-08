import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  Shield, 
  ShieldCheck,
  Calendar,
  Activity,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX
} from 'lucide-react'

// RTK Query hooks
import { 
  useGetAllUsersQuery,
  useSearchUsersQuery,
  useUpdateUserRoleMutation,
  useGetUserAnalyticsQuery
} from '../../store/api/appwriteApi'

// Redux actions
import { 
  setError, 
  clearError 
} from '../../store/slices/adminSlice'

// Components
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorMessage from '../../components/common/ErrorMessage'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'

const UserManagement = () => {
  const dispatch = useDispatch()
  const { error } = useSelector(state => state.admin)
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage] = useState(10)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userDetailsModal, setUserDetailsModal] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  
  // RTK Query hooks
  const { 
    data: allUsersData, 
    isLoading: loadingAllUsers, 
    error: allUsersError,
    refetch: refetchAllUsers
  } = useGetAllUsersQuery({ limit: 100, offset: 0 })
  
  const { 
    data: searchResults, 
    isLoading: loadingSearch, 
    error: searchError 
  } = useSearchUsersQuery(
    { searchTerm: searchTerm.trim(), limit: 50 },
    { skip: !isSearching || !searchTerm.trim() }
  )
  
  const [updateUserRole, { isLoading: updatingRole }] = useUpdateUserRoleMutation()
  
  const { 
    data: userAnalytics, 
    isLoading: loadingAnalytics 
  } = useGetUserAnalyticsQuery(
    selectedUser?.$id,
    { skip: !selectedUser }
  )
  
  // Determine which data to use
  const usersData = isSearching && searchTerm.trim() ? searchResults : allUsersData
  const users = usersData?.documents || []
  const totalUsers = usersData?.total || 0
  const loading = loadingAllUsers || loadingSearch

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  }

  // Handle search
  const handleSearch = () => {
    if (searchTerm.trim()) {
      setIsSearching(true)
      setCurrentPage(1)
    } else {
      setIsSearching(false)
      setCurrentPage(1)
    }
  }
  
  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    
    // If search is cleared, stop searching
    if (!value.trim()) {
      setIsSearching(false)
      setCurrentPage(1)
    }
  }
  
  // Handle errors
  useEffect(() => {
    if (allUsersError) {
      dispatch(setError(allUsersError.error || 'Failed to load users'))
    } else if (searchError) {
      dispatch(setError(searchError.error || 'Failed to search users'))
    }
  }, [allUsersError, searchError, dispatch])

  const handleUserDetails = (user) => {
    setSelectedUser(user)
    setUserDetailsModal(true)
  }

  const handleToggleAdminRole = async (user) => {
    try {
      await updateUserRole({
        userId: user.$id,
        isAdmin: !user.isAdmin
      }).unwrap()
      
      // Refetch users to get updated data
      refetchAllUsers()
      
      // Update selected user if it's the same user
      if (selectedUser && selectedUser.$id === user.$id) {
        setSelectedUser({
          ...selectedUser,
          isAdmin: !selectedUser.isAdmin
        })
      }
    } catch (error) {
      dispatch(setError(error.message || 'Failed to update user role'))
    }
  }

  const closeUserDetailsModal = () => {
    setUserDetailsModal(false)
    setSelectedUser(null)
  }

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser)
  const totalPages = Math.ceil(users.length / usersPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center space-x-3 mb-2">
          <Users className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Manage user accounts, roles, and view user activity statistics.
        </p>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Search</span>
          </Button>
        </div>
        
        {/* Stats */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            Showing {currentUsers.length} of {users.length} users
            {isSearching && searchTerm && ` (search results)`}
          </span>
          <span>
            Total registered users: {totalUsers}
          </span>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <ErrorMessage 
            message={error} 
            onClose={() => dispatch(clearError())} 
          />
        </motion.div>
      )}

      {/* Users Table */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Experience
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {currentUsers.map((user) => (
                <motion.tr
                  key={user.$id}
                  variants={itemVariants}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {user.targetRole || 'Not specified'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {user.experienceLevel || 'Not specified'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {user.isAdmin ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          <UserCheck className="w-3 h-3 mr-1" />
                          User
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUserDetails(user)}
                        className="flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </Button>
                      <Button
                        variant={user.isAdmin ? "danger" : "primary"}
                        size="sm"
                        onClick={() => handleToggleAdminRole(user)}
                        disabled={updatingRole}
                        className="flex items-center space-x-1"
                      >
                        {user.isAdmin ? (
                          <>
                            <UserX className="w-4 h-4" />
                            <span>Remove Admin</span>
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4" />
                            <span>Make Admin</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {currentUsers.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No users found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search terms.' : 'No users have registered yet.'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="secondary"
                  size="sm"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  variant="secondary"
                  size="sm"
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing{' '}
                    <span className="font-medium">{indexOfFirstUser + 1}</span>
                    {' '}to{' '}
                    <span className="font-medium">
                      {Math.min(indexOfLastUser, users.length)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{users.length}</span>
                    {' '}results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => paginate(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNumber
                              ? 'z-10 bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* User Details Modal */}
      <Modal
        isOpen={userDetailsModal}
        onClose={closeUserDetailsModal}
        title="User Details"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* User Header */}
            <div className="flex items-center space-x-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {selectedUser.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedUser.name || 'Unknown User'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedUser.email}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  {selectedUser.isAdmin ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Administrator
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                      <UserCheck className="w-3 h-3 mr-1" />
                      Regular User
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* User Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                  Profile Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Target Role
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedUser.targetRole || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Experience Level
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedUser.experienceLevel || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Target Industry
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedUser.targetIndustry || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Member Since
                    </label>
                    <p className="text-gray-900 dark:text-white flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(selectedUser.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                  Activity Statistics
                </h4>
                {loadingAnalytics ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="md" />
                  </div>
                ) : userAnalytics ? (
                  <div className="space-y-3">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Total Sessions
                        </span>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          {userAnalytics.totalSessions}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Completed Sessions
                        </span>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          {userAnalytics.completedSessions}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Average Score
                        </span>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          {userAnalytics.averageScore > 0 ? `${userAnalytics.averageScore}%` : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Resume Analyses
                        </span>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          {userAnalytics.totalResumes}
                        </span>
                      </div>
                    </div>
                    {userAnalytics.lastActivity && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Last Activity
                          </span>
                          <span className="text-sm text-gray-900 dark:text-white flex items-center">
                            <Activity className="w-4 h-4 mr-2" />
                            {formatDate(userAnalytics.lastActivity)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Unable to load user statistics
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                onClick={closeUserDetailsModal}
              >
                Close
              </Button>
              <Button
                variant={selectedUser.isAdmin ? "danger" : "primary"}
                onClick={() => handleToggleAdminRole(selectedUser)}
                disabled={updatingRole}
                className="flex items-center space-x-2"
              >
                {selectedUser.isAdmin ? (
                  <>
                    <UserX className="w-4 h-4" />
                    <span>Remove Admin Role</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Grant Admin Role</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default UserManagement