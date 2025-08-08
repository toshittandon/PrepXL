/**
 * File upload utilities with progress tracking
 */

import { uploadResumeFile } from '../services/appwrite/storage.js'

/**
 * Upload file with progress tracking
 * @param {File} file - File to upload
 * @param {string} userId - User ID for permissions
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<Object>} Upload result
 */
export const uploadFileWithProgress = async (file, userId, onProgress = null) => {
  try {
    // Validate inputs
    if (!file || !userId) {
      throw new Error('File and user ID are required')
    }

    // Create progress tracker
    let uploadProgress = 0
    const progressCallback = (progress) => {
      uploadProgress = progress.percentage
      if (onProgress && typeof onProgress === 'function') {
        onProgress({
          loaded: progress.loaded,
          total: progress.total,
          percentage: progress.percentage,
          stage: 'uploading'
        })
      }
    }

    // Upload file
    const result = await uploadResumeFile(file, userId, progressCallback)
    
    // Final progress update
    if (onProgress && typeof onProgress === 'function') {
      onProgress({
        loaded: file.size,
        total: file.size,
        percentage: 100,
        stage: 'completed'
      })
    }

    return result
  } catch (error) {
    // Error progress update
    if (onProgress && typeof onProgress === 'function') {
      onProgress({
        loaded: 0,
        total: file?.size || 0,
        percentage: 0,
        stage: 'error',
        error: error.message
      })
    }
    throw error
  }
}

/**
 * Create a progress tracking wrapper for any async operation
 * @param {Function} operation - Async operation to track
 * @param {Function} onProgress - Progress callback
 * @param {Array} progressStages - Array of progress stages with percentages
 * @returns {Function} Wrapped operation
 */
export const createProgressTracker = (operation, onProgress, progressStages = []) => {
  return async (...args) => {
    try {
      let currentStage = 0
      
      const updateProgress = (percentage, stage = 'processing') => {
        if (onProgress && typeof onProgress === 'function') {
          onProgress({
            percentage: Math.min(Math.max(percentage, 0), 100),
            stage,
            currentStage: currentStage + 1,
            totalStages: progressStages.length
          })
        }
      }

      // Initial progress
      updateProgress(0, 'starting')

      // Execute operation with stage tracking
      const result = await operation(...args, {
        onStageComplete: (stageIndex) => {
          if (stageIndex < progressStages.length) {
            currentStage = stageIndex
            updateProgress(progressStages[stageIndex].percentage, progressStages[stageIndex].name)
          }
        }
      })

      // Final progress
      updateProgress(100, 'completed')
      
      return result
    } catch (error) {
      if (onProgress && typeof onProgress === 'function') {
        onProgress({
          percentage: 0,
          stage: 'error',
          error: error.message
        })
      }
      throw error
    }
  }
}

/**
 * Batch upload multiple files with progress tracking
 * @param {File[]} files - Array of files to upload
 * @param {string} userId - User ID for permissions
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<Object[]>} Array of upload results
 */
export const batchUploadFiles = async (files, userId, onProgress = null) => {
  try {
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('Files array is required and must not be empty')
    }

    const results = []
    const totalFiles = files.length
    let completedFiles = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Individual file progress callback
      const fileProgress = (progress) => {
        const overallProgress = {
          currentFile: i + 1,
          totalFiles,
          currentFileProgress: progress,
          overallPercentage: Math.round(((completedFiles + progress.percentage / 100) / totalFiles) * 100),
          stage: 'uploading'
        }
        
        if (onProgress && typeof onProgress === 'function') {
          onProgress(overallProgress)
        }
      }
      
      try {
        const result = await uploadFileWithProgress(file, userId, fileProgress)
        results.push({ success: true, result, file: file.name })
        completedFiles++
      } catch (error) {
        results.push({ success: false, error: error.message, file: file.name })
        completedFiles++
      }
    }

    // Final progress update
    if (onProgress && typeof onProgress === 'function') {
      onProgress({
        currentFile: totalFiles,
        totalFiles,
        overallPercentage: 100,
        stage: 'completed',
        summary: {
          total: totalFiles,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      })
    }

    return results
  } catch (error) {
    if (onProgress && typeof onProgress === 'function') {
      onProgress({
        overallPercentage: 0,
        stage: 'error',
        error: error.message
      })
    }
    throw error
  }
}

/**
 * Create a debounced progress callback to avoid too frequent updates
 * @param {Function} callback - Original callback function
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Function} Debounced callback
 */
export const debounceProgress = (callback, delay = 100) => {
  let timeoutId = null
  let lastProgress = null

  return (progress) => {
    lastProgress = progress
    
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      if (callback && typeof callback === 'function') {
        callback(lastProgress)
      }
      timeoutId = null
    }, delay)
  }
}

/**
 * Format upload progress for display
 * @param {Object} progress - Progress object
 * @returns {Object} Formatted progress
 */
export const formatProgress = (progress) => {
  const {
    loaded = 0,
    total = 0,
    percentage = 0,
    stage = 'idle'
  } = progress

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStageMessage = (stage) => {
    const messages = {
      idle: 'Ready to upload',
      starting: 'Preparing upload...',
      uploading: 'Uploading file...',
      processing: 'Processing file...',
      analyzing: 'Analyzing content...',
      completed: 'Upload completed',
      error: 'Upload failed'
    }
    return messages[stage] || 'Processing...'
  }

  return {
    percentage: Math.round(percentage),
    loaded: formatBytes(loaded),
    total: formatBytes(total),
    stage,
    message: getStageMessage(stage),
    isComplete: percentage >= 100,
    isError: stage === 'error'
  }
}

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateFileForUpload = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    minSize = 1024 // 1KB minimum
  } = options

  const errors = []
  const warnings = []

  // Check if file exists
  if (!file) {
    errors.push('No file selected')
    return { isValid: false, errors, warnings }
  }

  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size (${formatProgress({ loaded: file.size }).loaded}) exceeds maximum allowed size (${formatProgress({ loaded: maxSize }).loaded})`)
  }

  if (file.size < minSize) {
    errors.push(`File size is too small (minimum ${formatProgress({ loaded: minSize }).loaded})`)
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type "${file.type}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`)
  }

  // Check file name
  if (!file.name || file.name.trim() === '') {
    errors.push('File must have a valid name')
  }

  // Warnings for large files
  if (file.size > 5 * 1024 * 1024) { // 5MB
    warnings.push('Large file detected. Upload may take longer.')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fileInfo: {
      name: file.name,
      size: formatProgress({ loaded: file.size }).loaded,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    }
  }
}

/**
 * Create a file reader with progress tracking
 * @param {File} file - File to read
 * @param {string} readAs - Read method ('text', 'dataURL', 'arrayBuffer')
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<string|ArrayBuffer>} File content
 */
export const readFileWithProgress = (file, readAs = 'text', onProgress = null) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onloadstart = () => {
      if (onProgress) onProgress({ percentage: 0, stage: 'starting' })
    }
    
    reader.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percentage = (event.loaded / event.total) * 100
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage,
          stage: 'reading'
        })
      }
    }
    
    reader.onload = () => {
      if (onProgress) onProgress({ percentage: 100, stage: 'completed' })
      resolve(reader.result)
    }
    
    reader.onerror = () => {
      if (onProgress) onProgress({ percentage: 0, stage: 'error' })
      reject(new Error('Failed to read file'))
    }
    
    // Choose read method
    switch (readAs) {
      case 'dataURL':
        reader.readAsDataURL(file)
        break
      case 'arrayBuffer':
        reader.readAsArrayBuffer(file)
        break
      case 'text':
      default:
        reader.readAsText(file)
        break
    }
  })
}