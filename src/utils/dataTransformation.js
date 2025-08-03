/**
 * Data transformation utilities for Appwrite data models
 */

/**
 * Transform user data for display
 * @param {Object} user - Raw user data from Appwrite
 * @returns {Object} Transformed user data
 */
export const transformUserData = (user) => {
  if (!user) return null;

  return {
    id: user.$id || user.id,
    name: user.name || '',
    email: user.email || '',
    experienceLevel: user.experienceLevel || 'Entry',
    targetRole: user.targetRole || '',
    targetIndustry: user.targetIndustry || '',
    isAdmin: user.isAdmin || false,
    createdAt: user.$createdAt || user.createdAt,
    updatedAt: user.$updatedAt || user.updatedAt,
    // Computed properties
    displayName: user.name || user.email?.split('@')[0] || 'User',
    initials: getInitials(user.name || user.email || 'U'),
    experienceLevelDisplay: getExperienceLevelDisplay(user.experienceLevel),
  };
};

/**
 * Transform resume data for display
 * @param {Object} resume - Raw resume data from Appwrite
 * @returns {Object} Transformed resume data
 */
export const transformResumeData = (resume) => {
  if (!resume) return null;

  return {
    id: resume.$id || resume.id,
    userId: resume.userId,
    fileId: resume.fileId,
    fileName: resume.fileName || 'Untitled Resume',
    jobDescription: resume.jobDescription || '',
    analysisResults: resume.analysisResults || null,
    uploadedAt: resume.$createdAt || resume.uploadedAt,
    updatedAt: resume.$updatedAt || resume.updatedAt,
    // Computed properties
    fileExtension: getFileExtension(resume.fileName),
    hasAnalysis: !!(resume.analysisResults && resume.analysisResults.matchScore !== undefined),
    matchScore: resume.analysisResults?.matchScore || 0,
    matchScoreDisplay: getMatchScoreDisplay(resume.analysisResults?.matchScore),
    uploadedAtDisplay: formatDate(resume.$createdAt || resume.uploadedAt),
  };
};

/**
 * Transform interview session data for display
 * @param {Object} session - Raw session data from Appwrite
 * @returns {Object} Transformed session data
 */
export const transformInterviewSessionData = (session) => {
  if (!session) return null;

  return {
    id: session.$id || session.id,
    userId: session.userId,
    sessionType: session.sessionType || 'Behavioral',
    role: session.role || '',
    status: session.status || 'active',
    finalScore: session.finalScore || 0,
    startedAt: session.$createdAt || session.startedAt,
    completedAt: session.completedAt,
    updatedAt: session.$updatedAt || session.updatedAt,
    // Computed properties
    statusDisplay: getStatusDisplay(session.status),
    sessionTypeDisplay: getSessionTypeDisplay(session.sessionType),
    finalScoreDisplay: getScoreDisplay(session.finalScore),
    duration: calculateSessionDuration(session.startedAt || session.$createdAt, session.completedAt),
    durationDisplay: formatDuration(calculateSessionDuration(session.startedAt || session.$createdAt, session.completedAt)),
    startedAtDisplay: formatDate(session.$createdAt || session.startedAt),
    completedAtDisplay: session.completedAt ? formatDate(session.completedAt) : null,
  };
};

/**
 * Transform interaction data for display
 * @param {Object} interaction - Raw interaction data from Appwrite
 * @returns {Object} Transformed interaction data
 */
export const transformInteractionData = (interaction) => {
  if (!interaction) return null;

  return {
    id: interaction.$id || interaction.id,
    sessionId: interaction.sessionId,
    userId: interaction.userId,
    questionText: interaction.questionText || '',
    userAnswerText: interaction.userAnswerText || '',
    order: interaction.order || 1,
    timestamp: interaction.$createdAt || interaction.timestamp,
    // Computed properties
    timestampDisplay: formatTime(interaction.$createdAt || interaction.timestamp),
    questionPreview: truncateText(interaction.questionText, 100),
    answerPreview: truncateText(interaction.userAnswerText, 150),
    answerWordCount: countWords(interaction.userAnswerText),
  };
};

/**
 * Transform question data for display
 * @param {Object} question - Raw question data from Appwrite
 * @returns {Object} Transformed question data
 */
export const transformQuestionData = (question) => {
  if (!question) return null;

  return {
    id: question.$id || question.id,
    questionText: question.questionText || '',
    category: question.category || 'Behavioral',
    role: question.role || '',
    suggestedAnswer: question.suggestedAnswer || '',
    createdAt: question.$createdAt || question.createdAt,
    updatedAt: question.$updatedAt || question.updatedAt,
    // Computed properties
    categoryDisplay: getCategoryDisplay(question.category),
    questionPreview: truncateText(question.questionText, 100),
    answerPreview: truncateText(question.suggestedAnswer, 150),
    createdAtDisplay: formatDate(question.$createdAt || question.createdAt),
  };
};

/**
 * Transform analytics data for display
 * @param {Object} analytics - Raw analytics data
 * @returns {Object} Transformed analytics data
 */
export const transformAnalyticsData = (analytics) => {
  if (!analytics) return null;

  return {
    ...analytics,
    // Computed properties
    completionRateDisplay: `${analytics.completionRate || 0}%`,
    averageScoreDisplay: getScoreDisplay(analytics.averageScore),
    lastActivityDisplay: analytics.lastActivity ? formatDate(analytics.lastActivity) : 'Never',
    totalSessionsDisplay: formatNumber(analytics.totalSessions || 0),
    totalUsersDisplay: formatNumber(analytics.totalUsers || 0),
  };
};

// Helper functions

/**
 * Get user initials from name
 * @param {string} name - User name
 * @returns {string} User initials
 */
export const getInitials = (name) => {
  if (!name) return 'U';
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

/**
 * Get display text for experience level
 * @param {string} level - Experience level
 * @returns {string} Display text
 */
export const getExperienceLevelDisplay = (level) => {
  const levels = {
    'Entry': 'Entry Level',
    'Mid': 'Mid Level',
    'Senior': 'Senior Level',
    'Executive': 'Executive Level'
  };
  
  return levels[level] || level || 'Entry Level';
};

/**
 * Get file extension from filename
 * @param {string} filename - File name
 * @returns {string} File extension
 */
export const getFileExtension = (filename) => {
  if (!filename) return '';
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
};

/**
 * Get match score display with color coding
 * @param {number} score - Match score (0-100)
 * @returns {Object} Score display object
 */
export const getMatchScoreDisplay = (score) => {
  if (score === undefined || score === null) {
    return { text: 'Not analyzed', color: 'gray', level: 'none' };
  }
  
  if (score >= 80) {
    return { text: `${score}% - Excellent`, color: 'green', level: 'excellent' };
  } else if (score >= 60) {
    return { text: `${score}% - Good`, color: 'blue', level: 'good' };
  } else if (score >= 40) {
    return { text: `${score}% - Fair`, color: 'yellow', level: 'fair' };
  } else {
    return { text: `${score}% - Needs Improvement`, color: 'red', level: 'poor' };
  }
};

/**
 * Get status display with styling
 * @param {string} status - Session status
 * @returns {Object} Status display object
 */
export const getStatusDisplay = (status) => {
  const statuses = {
    'active': { text: 'In Progress', color: 'blue', icon: 'play' },
    'completed': { text: 'Completed', color: 'green', icon: 'check' },
    'abandoned': { text: 'Abandoned', color: 'red', icon: 'x' }
  };
  
  return statuses[status] || { text: status, color: 'gray', icon: 'help' };
};

/**
 * Get session type display
 * @param {string} type - Session type
 * @returns {string} Display text
 */
export const getSessionTypeDisplay = (type) => {
  const types = {
    'Behavioral': 'Behavioral Interview',
    'Technical': 'Technical Interview',
    'Case Study': 'Case Study Interview'
  };
  
  return types[type] || type || 'Interview';
};

/**
 * Get category display
 * @param {string} category - Question category
 * @returns {string} Display text
 */
export const getCategoryDisplay = (category) => {
  const categories = {
    'Behavioral': 'Behavioral',
    'Technical': 'Technical',
    'Case Study': 'Case Study'
  };
  
  return categories[category] || category || 'General';
};

/**
 * Get score display with formatting
 * @param {number} score - Score (0-100)
 * @returns {string} Formatted score
 */
export const getScoreDisplay = (score) => {
  if (score === undefined || score === null || score === 0) {
    return 'Not scored';
  }
  
  return `${Math.round(score)}%`;
};

/**
 * Calculate session duration in minutes
 * @param {string} startTime - Start timestamp
 * @param {string} endTime - End timestamp
 * @returns {number} Duration in minutes
 */
export const calculateSessionDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  return Math.round((end - start) / (1000 * 60));
};

/**
 * Format duration in minutes to human-readable format
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
export const formatDuration = (minutes) => {
  if (!minutes || minutes === 0) return '0 min';
  
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Format date to human-readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  
  // If less than 24 hours ago, show relative time
  if (diffInHours < 24) {
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return minutes <= 1 ? 'Just now' : `${minutes} minutes ago`;
    }
    const hours = Math.floor(diffInHours);
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  
  // If less than 7 days ago, show days
  if (diffInHours < 24 * 7) {
    const days = Math.floor(diffInHours / 24);
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }
  
  // Otherwise show formatted date
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format time to human-readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted time
 */
export const formatTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Count words in text
 * @param {string} text - Text to count words in
 * @returns {number} Word count
 */
export const countWords = (text) => {
  if (!text) return 0;
  
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  
  return num.toLocaleString();
};

/**
 * Transform array of data using specified transformer
 * @param {Array} data - Array of data to transform
 * @param {Function} transformer - Transformer function
 * @returns {Array} Transformed array
 */
export const transformArray = (data, transformer) => {
  if (!Array.isArray(data)) return [];
  
  return data.map(transformer).filter(Boolean);
};

/**
 * Sort data by specified field and direction
 * @param {Array} data - Data to sort
 * @param {string} field - Field to sort by
 * @param {string} direction - Sort direction ('asc' or 'desc')
 * @returns {Array} Sorted data
 */
export const sortData = (data, field, direction = 'asc') => {
  if (!Array.isArray(data)) return [];
  
  return [...data].sort((a, b) => {
    const aValue = a[field];
    const bValue = b[field];
    
    if (aValue === bValue) return 0;
    
    const comparison = aValue < bValue ? -1 : 1;
    return direction === 'asc' ? comparison : -comparison;
  });
};

/**
 * Filter data by search term across multiple fields
 * @param {Array} data - Data to filter
 * @param {string} searchTerm - Search term
 * @param {Array} fields - Fields to search in
 * @returns {Array} Filtered data
 */
export const filterData = (data, searchTerm, fields = []) => {
  if (!Array.isArray(data) || !searchTerm) return data;
  
  const term = searchTerm.toLowerCase();
  
  return data.filter(item => {
    return fields.some(field => {
      const value = item[field];
      return value && value.toString().toLowerCase().includes(term);
    });
  });
};