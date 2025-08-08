import { motion } from 'framer-motion'
import { Search, Filter, X } from 'lucide-react'
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
import Input from '../common/Input.jsx'
import Select from '../common/Select.jsx'
import Button from '../common/Button.jsx'

const SearchFilters = () => {
  const dispatch = useDispatch()
  const searchTerm = useSelector(selectSearchTerm)
  const selectedCategory = useSelector(selectSelectedCategory)
  const selectedRole = useSelector(selectSelectedRole)
  const categories = useSelector(selectCategories)
  const roles = useSelector(selectRoles)
  const hasActiveFilters = useSelector(selectHasActiveFilters)

  // Convert categories and roles to select options
  const categoryOptions = categories.map(category => ({
    value: category,
    label: category
  }))

  const roleOptions = roles.map(role => ({
    value: role,
    label: role
  }))

  const handleSearchChange = (e) => {
    dispatch(setSearchTerm(e.target.value))
  }

  const handleCategoryChange = (value) => {
    dispatch(setSelectedCategory(value))
  }

  const handleRoleChange = (value) => {
    dispatch(setSelectedRole(value))
  }

  const handleClearFilters = () => {
    dispatch(clearFilters())
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-4 sm:mb-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Search & Filter Questions
          </h3>
        </div>
        
        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="self-start sm:self-auto"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Clear Filters</span>
              <span className="sm:hidden">Clear</span>
            </Button>
          </motion.div>
        )}
      </div>

      {/* Search and Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Search Input */}
        <div className="sm:col-span-2 lg:col-span-1">
          <Input
            placeholder="Search questions..."
            value={searchTerm}
            onChange={handleSearchChange}
            leftIcon={<Search className="w-4 h-4" />}
            className="w-full"
          />
        </div>

        {/* Category Filter */}
        <div className="sm:col-span-1 lg:col-span-1">
          <Select
            placeholder="All Categories"
            value={selectedCategory}
            onChange={handleCategoryChange}
            options={categoryOptions}
            className="w-full"
          />
        </div>

        {/* Role Filter */}
        <div className="sm:col-span-1 lg:col-span-1">
          <Select
            placeholder="All Roles"
            value={selectedRole}
            onChange={handleRoleChange}
            options={roleOptions}
            className="w-full"
          />
        </div>
      </div>

      {/* Active Filters Indicator */}
      {hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Active filters:
            </span>
            
            {searchTerm && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-200"
              >
                Search: "{searchTerm.length > 20 ? searchTerm.substring(0, 20) + '...' : searchTerm}"
              </motion.span>
            )}
            
            {selectedCategory && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200"
              >
                Category: {selectedCategory}
              </motion.span>
            )}
            
            {selectedRole && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200"
              >
                Role: {selectedRole}
              </motion.span>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default SearchFilters