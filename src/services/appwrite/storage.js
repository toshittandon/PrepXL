/**
 * Appwrite storage service functions for resume file upload/download
 */

import { ID, Permission, Role } from 'appwrite'
import { storage, appwriteConfig } from './client.js'
import { handleAppwriteError } from '../../utils/errorHandling.js'

const { storage: storageConfig } = appwriteConfig

// File size limits (in bytes)
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @returns {Object} Validation result
 */
export const validateFile = (file) => {
  const errors = []
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
  }
  
  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    errors.push('File must be PDF, DOC, or DOCX format')
  }
  
  // Check file name
  if (!file.name || file.name.trim() === '') {
    errors.push('File must have a valid name')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Upload resume file to storage
 * @param {File} file - File to upload
 * @param {string} userId - User ID for permissions
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<Object>} Upload result with file metadata
 */
export const uploadResumeFile = async (file, userId, onProgress = null) => {
  try {
    // Validate file
    const validation = validateFile(file)
    if (!validation.isValid) {
      throw new Error(`File validation failed: ${validation.errors.join(', ')}`)
    }
    
    // Generate unique file ID
    const fileId = ID.unique()
    
    // Create file upload promise
    const uploadPromise = storage.createFile(
      storageConfig.bucketId,
      fileId,
      file,
      [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ]
    )
    
    // Handle progress tracking if callback provided
    if (onProgress && typeof onProgress === 'function') {
      // Note: Appwrite doesn't provide built-in progress tracking
      // This is a placeholder for potential future implementation
      onProgress({ loaded: 0, total: file.size, percentage: 0 })
    }
    
    const uploadedFile = await uploadPromise
    
    // Final progress update
    if (onProgress && typeof onProgress === 'function') {
      onProgress({ loaded: file.size, total: file.size, percentage: 100 })
    }
    
    return {
      fileId: uploadedFile.$id,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadedAt: new Date().toISOString(),
      bucketId: storageConfig.bucketId,
    }
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to upload resume file')
  }
}

/**
 * Get file metadata
 * @param {string} fileId - File ID
 * @returns {Promise<Object>} File metadata
 */
export const getFileMetadata = async (fileId) => {
  try {
    const file = await storage.getFile(storageConfig.bucketId, fileId)
    return file
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to get file metadata')
  }
}

/**
 * Get file download URL
 * @param {string} fileId - File ID
 * @returns {string} File download URL
 */
export const getFileDownloadUrl = (fileId) => {
  try {
    const url = storage.getFileDownload(storageConfig.bucketId, fileId)
    return url.href
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to get file download URL')
  }
}

/**
 * Get file preview URL (for supported file types)
 * @param {string} fileId - File ID
 * @param {number} width - Preview width (optional)
 * @param {number} height - Preview height (optional)
 * @returns {string} File preview URL
 */
export const getFilePreviewUrl = (fileId, width = 400, height = 400) => {
  try {
    const url = storage.getFilePreview(
      storageConfig.bucketId,
      fileId,
      width,
      height
    )
    return url.href
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to get file preview URL')
  }
}

/**
 * Download file as blob
 * @param {string} fileId - File ID
 * @returns {Promise<Blob>} File blob
 */
export const downloadFileAsBlob = async (fileId) => {
  try {
    const response = await fetch(getFileDownloadUrl(fileId))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const blob = await response.blob()
    return blob
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to download file')
  }
}

/**
 * Read file content as text (for text-based files)
 * @param {string} fileId - File ID
 * @returns {Promise<string>} File content as text
 */
export const readFileAsText = async (fileId) => {
  try {
    const blob = await downloadFileAsBlob(fileId)
    const text = await blob.text()
    return text
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to read file as text')
  }
}

/**
 * Delete file from storage
 * @param {string} fileId - File ID
 * @returns {Promise<void>}
 */
export const deleteFile = async (fileId) => {
  try {
    await storage.deleteFile(storageConfig.bucketId, fileId)
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to delete file')
  }
}

/**
 * Get user's uploaded files
 * @param {string} userId - User ID
 * @param {number} limit - Number of files to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Object>} User's files list
 */
export const getUserFiles = async (userId, limit = 25, offset = 0) => {
  try {
    // Note: Appwrite doesn't provide direct file listing by user
    // This would typically be handled by maintaining file metadata in the database
    // For now, we'll return a placeholder structure
    
    console.warn('getUserFiles: Direct file listing by user not supported by Appwrite storage API')
    
    return {
      files: [],
      total: 0,
      message: 'File listing should be handled through database records'
    }
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to get user files')
  }
}

/**
 * Get storage bucket information
 * @returns {Promise<Object>} Bucket information
 */
export const getBucketInfo = async () => {
  try {
    const bucket = await storage.getBucket(storageConfig.bucketId)
    return bucket
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to get bucket information')
  }
}

/**
 * Check if file exists
 * @param {string} fileId - File ID
 * @returns {Promise<boolean>} True if file exists
 */
export const fileExists = async (fileId) => {
  try {
    await getFileMetadata(fileId)
    return true
  } catch (error) {
    // If error is 404 (not found), file doesn't exist
    if (error.code === 404) {
      return false
    }
    // Re-throw other errors
    throw error
  }
}

/**
 * Get file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Human-readable file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get file extension from filename
 * @param {string} filename - File name
 * @returns {string} File extension
 */
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

/**
 * Generate secure filename
 * @param {string} originalName - Original filename
 * @param {string} userId - User ID
 * @returns {string} Secure filename
 */
export const generateSecureFilename = (originalName, userId) => {
  const timestamp = Date.now()
  const extension = getFileExtension(originalName)
  const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_')
  
  return `${userId}_${timestamp}_${baseName}.${extension}`
}

/**
 * Batch upload multiple files
 * @param {File[]} files - Array of files to upload
 * @param {string} userId - User ID for permissions
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<Object[]>} Array of upload results
 */
export const batchUploadFiles = async (files, userId, onProgress = null) => {
  try {
    const results = []
    const totalFiles = files.length
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Individual file progress callback
      const fileProgress = (progress) => {
        if (onProgress && typeof onProgress === 'function') {
          const overallProgress = {
            currentFile: i + 1,
            totalFiles,
            currentFileProgress: progress,
            overallPercentage: Math.round(((i + progress.percentage / 100) / totalFiles) * 100)
          }
          onProgress(overallProgress)
        }
      }
      
      const result = await uploadResumeFile(file, userId, fileProgress)
      results.push(result)
    }
    
    return results
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to batch upload files')
  }
}

/**
 * Clean up orphaned files (admin function)
 * @param {string[]} activeFileIds - Array of file IDs that should be kept
 * @returns {Promise<Object>} Cleanup results
 */
export const cleanupOrphanedFiles = async (activeFileIds = []) => {
  try {
    // Note: This would require admin permissions and careful implementation
    // For now, return a placeholder
    
    console.warn('cleanupOrphanedFiles: This function requires careful implementation with admin permissions')
    
    return {
      message: 'Orphaned file cleanup not implemented',
      deletedCount: 0,
      errors: []
    }
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to cleanup orphaned files')
  }
}