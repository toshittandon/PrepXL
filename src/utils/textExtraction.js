/**
 * Text extraction utilities for resume files
 */

import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'

// Configure PDF.js worker properly
if (typeof window !== 'undefined') {
  try {
    // Set the worker source to the public directory
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
  } catch (error) {
    console.warn('PDF.js worker configuration warning:', error)
  }
}

/**
 * Extract text from PDF file with robust error handling
 * @param {File} file - PDF file
 * @returns {Promise<string>} Extracted text
 */
const extractTextFromPDF = async (file) => {
  try {
    console.log('Starting PDF text extraction for:', file.name)
    
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    })
    
    const pdf = await loadingTask.promise
    console.log(`PDF loaded successfully. Pages: ${pdf.numPages}`)
    
    let fullText = ''
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        
        // Combine text items from the page
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ')
        
        fullText += pageText + '\n'
        console.log(`Extracted text from page ${pageNum}: ${pageText.length} characters`)
        
      } catch (pageError) {
        console.warn(`Error extracting text from page ${pageNum}:`, pageError)
        // Continue with other pages even if one fails
      }
    }
    
    if (!fullText.trim()) {
      throw new Error('No text could be extracted from the PDF. The file may be image-based or corrupted.')
    }
    
    console.log(`Successfully extracted ${fullText.length} characters from PDF`)
    return fullText.trim()
    
  } catch (error) {
    console.error('PDF text extraction error:', error)
    
    // Provide helpful error messages based on the error type
    if (error.message.includes('Invalid PDF')) {
      throw new Error('The uploaded file appears to be corrupted or is not a valid PDF. Please try uploading a different file.')
    }
    
    if (error.message.includes('password')) {
      throw new Error('This PDF is password protected. Please remove the password protection and try again.')
    }
    
    if (error.message.includes('worker')) {
      throw new Error('PDF processing is experiencing technical difficulties. Please try converting your resume to DOC or DOCX format for the best results.')
    }
    
    // Generic fallback error with helpful suggestions
    throw new Error(`Failed to extract text from CV.pdf. Please ensure the file is valid and not corrupted.

For the best experience, we recommend:
✅ Using DOC or DOCX format (most reliable)
✅ Ensuring your PDF is text-based (not scanned images)
✅ Checking that the file isn't password protected
✅ Trying a different PDF if the issue persists

DOC and DOCX files provide the most accurate text extraction for resume analysis.`)
  }
}

/**
 * Extract text from DOC/DOCX file
 * @param {File} file - DOC/DOCX file
 * @returns {Promise<string>} Extracted text
 */
const extractTextFromDOC = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value
  } catch (error) {
    console.error('Error extracting text from DOC/DOCX:', error)
    throw new Error('Failed to extract text from DOC/DOCX file. Please ensure the file is not corrupted.')
  }
}

/**
 * Extract text from various file types
 * @param {File} file - File to extract text from
 * @returns {Promise<string>} Extracted text
 */
export const extractTextFromFile = async (file) => {
  if (!file) {
    throw new Error('No file provided for text extraction')
  }

  const fileType = file.type.toLowerCase()
  const fileName = file.name.toLowerCase()

  try {
    // Handle PDF files
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      try {
        return await extractTextFromPDF(file)
      } catch (pdfError) {
        console.warn('PDF extraction failed, suggesting alternatives:', pdfError.message)
        // Re-throw with user-friendly message
        throw new Error(`Failed to extract text from CV.pdf. Please ensure the file is valid and not corrupted.

For the best experience and most reliable text extraction, we recommend:
✅ Converting your resume to Microsoft Word format (.docx or .doc)
✅ Ensuring your PDF is text-based (not scanned images)
✅ Checking that the file isn't password protected

DOC and DOCX files provide the most accurate text extraction for resume analysis.`)
      }
    }

    // Handle DOC files
    if (fileType === 'application/msword' || fileName.endsWith('.doc')) {
      return await extractTextFromDOC(file)
    }

    // Handle DOCX files
    if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      return await extractTextFromDOC(file)
    }

    // Handle plain text files (fallback)
    if (fileType.startsWith('text/') || fileName.endsWith('.txt')) {
      return await file.text()
    }

    // Unsupported file type
    throw new Error(`Unsupported file type: ${fileType}. Please upload a PDF, DOC, or DOCX file.`)

  } catch (error) {
    // Re-throw with more context if it's already our error
    if (error.message.includes('Failed to extract') || 
        error.message.includes('Unsupported file type') ||
        error.message.includes('For the best experience')) {
      throw error
    }

    // Generic error handling
    console.error('Unexpected error during text extraction:', error)
    throw new Error(`Failed to extract text from ${file.name}. Please ensure the file is valid and not corrupted.`)
  }
}

/**
 * Validate extracted text content
 * @param {string} text - Extracted text
 * @param {string} fileName - Original file name
 * @returns {string} Validated and cleaned text
 */
export const validateExtractedText = (text, fileName) => {
  if (!text || typeof text !== 'string') {
    throw new Error(`No text could be extracted from ${fileName}. The file may be empty or corrupted.`)
  }

  // Clean up the text
  const cleanedText = text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Reduce excessive line breaks
    .replace(/\s{2,}/g, ' ') // Reduce excessive spaces
    .trim()

  // Validate minimum content
  if (cleanedText.length < 50) {
    throw new Error(`The extracted text from ${fileName} is too short (${cleanedText.length} characters). Please ensure your resume contains sufficient content.`)
  }

  // Validate maximum content (prevent abuse)
  if (cleanedText.length > 50000) {
    console.warn(`Text extracted from ${fileName} is very long (${cleanedText.length} characters). Truncating to 50,000 characters.`)
    return cleanedText.substring(0, 50000) + '...'
  }

  return cleanedText
}

/**
 * Extract and validate text from file (combined function)
 * @param {File} file - File to process
 * @returns {Promise<string>} Extracted and validated text
 */
export const processResumeFile = async (file) => {
  try {
    console.log(`Starting text extraction for: ${file.name} (${file.type}, ${formatFileSize(file.size)})`)
    
    const extractedText = await extractTextFromFile(file)
    const validatedText = validateExtractedText(extractedText, file.name)
    
    console.log(`Successfully extracted ${validatedText.length} characters from ${file.name}`)
    return validatedText
    
  } catch (error) {
    console.error('Error processing resume file:', error)
    
    // Add more context to the error for debugging
    const enhancedError = new Error(error.message)
    enhancedError.fileName = file.name
    enhancedError.fileType = file.type
    enhancedError.fileSize = file.size
    enhancedError.originalError = error
    
    throw enhancedError
  }
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get supported file types for resume upload
 * @returns {Array<string>} Array of supported MIME types
 */
export const getSupportedFileTypes = () => {
  return [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
}

/**
 * Get supported file extensions for resume upload
 * @returns {Array<string>} Array of supported file extensions
 */
export const getSupportedFileExtensions = () => {
  return ['.pdf', '.doc', '.docx', '.txt']
}

/**
 * Check if file type is supported
 * @param {File} file - File to check
 * @returns {boolean} True if file type is supported
 */
export const isFileTypeSupported = (file) => {
  if (!file) return false
  
  const supportedTypes = getSupportedFileTypes()
  const supportedExtensions = getSupportedFileExtensions()
  
  const fileType = file.type.toLowerCase()
  const fileName = file.name.toLowerCase()
  
  // Check MIME type
  if (supportedTypes.includes(fileType)) {
    return true
  }
  
  // Check file extension as fallback
  return supportedExtensions.some(ext => fileName.endsWith(ext))
}

/**
 * Get file type display name
 * @param {File} file - File to get display name for
 * @returns {string} Human-readable file type name
 */
export const getFileTypeDisplayName = (file) => {
  if (!file) return 'Unknown'
  
  const fileType = file.type.toLowerCase()
  const fileName = file.name.toLowerCase()
  
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return 'PDF Document'
  }
  
  if (fileType === 'application/msword' || fileName.endsWith('.doc')) {
    return 'Microsoft Word Document (DOC)'
  }
  
  if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
    return 'Microsoft Word Document (DOCX)'
  }
  
  if (fileType.startsWith('text/') || fileName.endsWith('.txt')) {
    return 'Plain Text Document'
  }
  
  return 'Unknown File Type'
}