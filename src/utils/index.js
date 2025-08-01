// Utility functions

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Validate file type and size
 * @param {File} file - File to validate
 * @param {Object} constraints - File constraints
 * @returns {Object} Validation result
 */
export const validateFile = (file, constraints) => {
  const errors = [];
  
  if (file.size > constraints.MAX_SIZE) {
    errors.push(`File size must be less than ${constraints.MAX_SIZE / (1024 * 1024)}MB`);
  }
  
  if (!constraints.ALLOWED_TYPES.includes(file.type)) {
    errors.push('File type not supported. Please upload PDF or Word documents.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};