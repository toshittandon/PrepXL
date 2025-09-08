import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown,
  RefreshCw
} from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { 
  selectSearchTerm,
  selectSelectedCategory,
  selectSelectedRole,
  selectCategories,
  selectRoles,
  selectHasActiveFilters,
  setSearchTerm,
  setSelectedCategory,
  setSelectedRole,
  clearFilters
} from '../../store/slices/librarySlice.js'
import Button from '../common/Button.jsx'

const QuestionFilters = () => {
  const dispatch = useDispatch()
  const [showFilters, setShowFilters] = useState(false)
  
  // Redux state
  const searchTerm = useSelector(selectSearchTerm)
  const selectedCategory = useSelector(selectSelectedCategory)
  const selectedRole = useSelector(selectSelectedRole)
  const roles = useSelector(selectRoles)
  const hasActiveFilters = useSelector(selectHasActiveFilters)

  // Handle search input
  const handleSearchChange = (e) => {
    dispatch(setSearchTerm(e.target.value))
  }

  // Handle category filter
  const handleCategoryChange = (e) => {
    dispatch(setSelectedCategory(e.target.value))
  }

  // Handle role filter
  const handleRoleChange = (e) => {
    dispatch(setSelectedRole(e.target.value))
  }

  // Handle clear filters
  const handleClearFilters = () => {
    dispatch(clearFilters())
    setShowFilters(false)
  }

  // Predefined categories for consistency
  const predefinedCategories = ['Behavioral', 'Technical', 'Case Study']
  
  // Combine predefined and existing roles
  const allRoles = [...new Set([
    'Software Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Data Scientist',
    'Product Manager',
    'UX Designer',
    'DevOps Engineer',
    'QA Engineer',
    'Business Analyst',
    'Project Manager',
    'Marketing Manager',
    'Sales Representative',
    'Customer Success Manager',
    'HR Manager',
    ...roles
  ])].sort()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      {/* Search Bar */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            className="
              w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 
              rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white
              placeholder-gray-500 dark:placeholder-gray-400
              focus:ring-2 focus:ring-primary-500 focus:border-transparent
              transition-colors duration-200
            "
            placeholder="Search questions by text, category, or role..."
          />
          {searchTerm && (
            <button
              onClick={() => dispatch(setSearchTerm(''))}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant={showFilters || hasActiveFilters ? 'primary' : 'secondary'}
          size="md"
          className="inline-flex items-center relative"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          {hasActiveFilters && !showFilters && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          )}
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            onClick={handleClearFilters}
            variant="ghost"
            size="md"
            className="inline-flex items-center text-gray-600 dark:text-gray-400"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Filter Options */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-gray-200 dark:border-gray-700 pt-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="
                  w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 
                  rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-primary-500 focus:border-transparent
                  transition-colors duration-200
                "
              >
                <option value="">All Categories</option>
                {predefinedCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role
              </label>
              <select
                value={selectedRole}
                onChange={handleRoleChange}
                className="
                  w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 
                  rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-primary-500 focus:border-transparent
                  transition-colors duration-200
                "
              >
                <option value="">All Roles</option>
                {allRoles.map(role => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Active filters:
                  </span>
                  <div className="flex items-center space-x-2">
                    {searchTerm && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400">
                        Search: "{searchTerm}"
                        <button
                          onClick={() => dispatch(setSearchTerm(''))}
                          className="ml-1 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {selectedCategory && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                        Category: {selectedCategory}
                        <button
                          onClick={() => dispatch(setSelectedCategory(''))}
                          className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {selectedRole && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        Role: {selectedRole}
                        <button
                          onClick={() => dispatch(setSelectedRole(''))}
                          className="ml-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleClearFilters}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Clear all
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

export default QuestionFilters