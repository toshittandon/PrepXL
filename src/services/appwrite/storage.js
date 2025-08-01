import { ID } from 'appwrite';
import { storage, appwriteConfig } from './config.js';
import { asyncHandler, retryRequest } from './utils.js';

/**
 * Storage Service
 * Handles file upload, download, and management operations
 */
export class StorageService {
  constructor() {
    this.bucketId = appwriteConfig.storage.resumesBucket;
  }

  /**
   * Upload a file to storage
   */
  async uploadFile(file, fileId = null, permissions = null) {
    return asyncHandler(async () => {
      const uploadId = fileId || ID.unique();
      
      const uploadedFile = permissions 
        ? await storage.createFile(this.bucketId, uploadId, file, permissions)
        : await storage.createFile(this.bucketId, uploadId, file);

      return {
        id: uploadedFile.$id,
        name: uploadedFile.name,
        size: uploadedFile.sizeOriginal,
        mimeType: uploadedFile.mimeType,
        createdAt: uploadedFile.$createdAt,
        updatedAt: uploadedFile.$updatedAt,
      };
    });
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(files, permissions = null) {
    return asyncHandler(async () => {
      const uploadPromises = files.map(file =>
        retryRequest(() =>
          permissions 
            ? storage.createFile(this.bucketId, ID.unique(), file, permissions)
            : storage.createFile(this.bucketId, ID.unique(), file)
        )
      );

      const results = await Promise.allSettled(uploadPromises);
      const successful = results
        .filter(result => result.status === 'fulfilled')
        .map(result => ({
          id: result.value.$id,
          name: result.value.name,
          size: result.value.sizeOriginal,
          mimeType: result.value.mimeType,
          createdAt: result.value.$createdAt,
          updatedAt: result.value.$updatedAt,
        }));
      
      const failed = results
        .filter(result => result.status === 'rejected')
        .map(result => result.reason);

      return {
        successful,
        failed,
        totalUploaded: successful.length,
        totalFailed: failed.length,
      };
    });
  }

  /**
   * Get file information
   */
  async getFile(fileId) {
    return asyncHandler(async () => {
      const file = await storage.getFile(this.bucketId, fileId);
      
      return {
        id: file.$id,
        name: file.name,
        size: file.sizeOriginal,
        mimeType: file.mimeType,
        createdAt: file.$createdAt,
        updatedAt: file.$updatedAt,
        permissions: file.$permissions,
      };
    });
  }

  /**
   * Get file download URL
   */
  getFileDownload(fileId) {
    try {
      const url = storage.getFileDownload(this.bucketId, fileId);
      return {
        success: true,
        data: { url },
        error: null,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: { message: error.message || 'Failed to generate download URL' },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get file preview URL
   */
  getFilePreview(fileId, width = null, height = null, gravity = 'center', quality = 100, borderWidth = 0, borderColor = '', borderRadius = 0, opacity = 1, rotation = 0, background = '', output = '') {
    try {
      const url = storage.getFilePreview(
        this.bucketId,
        fileId,
        width,
        height,
        gravity,
        quality,
        borderWidth,
        borderColor,
        borderRadius,
        opacity,
        rotation,
        background,
        output
      );
      
      return {
        success: true,
        data: { url },
        error: null,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: { message: error.message || 'Failed to generate preview URL' },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get file view URL
   */
  getFileView(fileId) {
    try {
      const url = storage.getFileView(this.bucketId, fileId);
      return {
        success: true,
        data: { url },
        error: null,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: { message: error.message || 'Failed to generate view URL' },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Update file permissions
   */
  async updateFile(fileId, permissions) {
    return asyncHandler(async () => {
      const file = await storage.updateFile(this.bucketId, fileId, permissions);
      
      return {
        id: file.$id,
        name: file.name,
        size: file.sizeOriginal,
        mimeType: file.mimeType,
        createdAt: file.$createdAt,
        updatedAt: file.$updatedAt,
        permissions: file.$permissions,
      };
    });
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId) {
    return asyncHandler(async () => {
      await storage.deleteFile(this.bucketId, fileId);
      return { message: 'File deleted successfully', fileId };
    });
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(fileIds) {
    return asyncHandler(async () => {
      const deletePromises = fileIds.map(fileId =>
        retryRequest(() => storage.deleteFile(this.bucketId, fileId))
      );

      const results = await Promise.allSettled(deletePromises);
      const successful = results
        .filter((result, index) => result.status === 'fulfilled')
        .map((result, index) => fileIds[index]);
      
      const failed = results
        .filter((result, index) => result.status === 'rejected')
        .map((result, index) => ({ fileId: fileIds[index], error: result.reason }));

      return {
        successful,
        failed,
        totalDeleted: successful.length,
        totalFailed: failed.length,
      };
    });
  }

  /**
   * List files in the bucket
   */
  async listFiles(queries = [], search = '') {
    return asyncHandler(async () => {
      const files = await storage.listFiles(this.bucketId, queries, search);
      
      const formattedFiles = files.files.map(file => ({
        id: file.$id,
        name: file.name,
        size: file.sizeOriginal,
        mimeType: file.mimeType,
        createdAt: file.$createdAt,
        updatedAt: file.$updatedAt,
        permissions: file.$permissions,
      }));

      return {
        files: formattedFiles,
        total: files.total,
      };
    });
  }

  /**
   * Upload resume file with validation
   */
  async uploadResume(file, userId, permissions = null) {
    return asyncHandler(async () => {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a PDF, DOC, DOCX, or TXT file.');
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        throw new Error('File size too large. Please upload a file smaller than 5MB.');
      }

      // Generate unique file ID with user prefix
      const fileId = `resume_${userId}_${Date.now()}`;
      
      // Create file with proper permissions
      const uploadedFile = permissions 
        ? await storage.createFile(this.bucketId, fileId, file, permissions)
        : await storage.createFile(this.bucketId, fileId, file);

      return {
        id: uploadedFile.$id,
        name: uploadedFile.name,
        size: uploadedFile.sizeOriginal,
        mimeType: uploadedFile.mimeType,
        createdAt: uploadedFile.$createdAt,
        updatedAt: uploadedFile.$updatedAt,
        downloadUrl: this.getFileDownload(uploadedFile.$id).data?.url,
      };
    });
  }

  /**
   * Get user's resume files
   */
  async getUserResumes(userId) {
    return asyncHandler(async () => {
      const files = await storage.listFiles(
        this.bucketId,
        [],
        `resume_${userId}`
      );
      
      const formattedFiles = files.files.map(file => ({
        id: file.$id,
        name: file.name,
        size: file.sizeOriginal,
        mimeType: file.mimeType,
        createdAt: file.$createdAt,
        updatedAt: file.$updatedAt,
        downloadUrl: this.getFileDownload(file.$id).data?.url,
        previewUrl: this.getFilePreview(file.$id).data?.url,
      }));

      return {
        files: formattedFiles,
        total: files.total,
      };
    });
  }

  /**
   * Download file as blob
   */
  async downloadFileAsBlob(fileId) {
    return asyncHandler(async () => {
      const downloadUrl = this.getFileDownload(fileId);
      if (!downloadUrl.success) {
        throw new Error('Failed to get download URL');
      }

      const response = await fetch(downloadUrl.data.url);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const file = await this.getFile(fileId);
      
      return {
        blob,
        fileName: file.success ? file.data.name : 'download',
        mimeType: file.success ? file.data.mimeType : 'application/octet-stream',
      };
    });
  }

  /**
   * Extract text content from uploaded file
   */
  async extractTextFromFile(fileId) {
    return asyncHandler(async () => {
      const fileInfo = await this.getFile(fileId);
      if (!fileInfo.success) {
        throw new Error('File not found');
      }

      const downloadResult = await this.downloadFileAsBlob(fileId);
      if (!downloadResult.success) {
        throw new Error('Failed to download file for text extraction');
      }

      const { blob, mimeType } = downloadResult.data;

      // Handle different file types
      switch (mimeType) {
        case 'text/plain':
          return await blob.text();
        
        case 'application/pdf':
          // For PDF files, you would typically use a PDF parsing library
          // For now, return a placeholder message
          return 'PDF text extraction requires additional PDF parsing library implementation';
        
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          // For Word documents, you would typically use a document parsing library
          // For now, return a placeholder message
          return 'Word document text extraction requires additional document parsing library implementation';
        
        default:
          throw new Error(`Unsupported file type for text extraction: ${mimeType}`);
      }
    });
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(userId = null) {
    return asyncHandler(async () => {
      const searchQuery = userId ? `resume_${userId}` : '';
      const files = await storage.listFiles(this.bucketId, [], searchQuery);
      
      const totalFiles = files.total;
      const totalSize = files.files.reduce((sum, file) => sum + file.sizeOriginal, 0);
      
      const fileTypes = files.files.reduce((acc, file) => {
        acc[file.mimeType] = (acc[file.mimeType] || 0) + 1;
        return acc;
      }, {});

      return {
        totalFiles,
        totalSize,
        totalSizeFormatted: this.formatFileSize(totalSize),
        fileTypes,
        files: files.files.map(file => ({
          id: file.$id,
          name: file.name,
          size: file.sizeOriginal,
          sizeFormatted: this.formatFileSize(file.sizeOriginal),
          mimeType: file.mimeType,
          createdAt: file.$createdAt,
        })),
      };
    });
  }

  /**
   * Format file size in human readable format
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Health check for storage service
   */
  async healthCheck() {
    return asyncHandler(async () => {
      // Try to list files with limit 1
      await storage.listFiles(this.bucketId, [], '', 1);
      return { status: 'healthy', timestamp: new Date().toISOString() };
    });
  }
}

// Export singleton instance
export const storageService = new StorageService();