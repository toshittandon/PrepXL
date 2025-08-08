/**
 * Simple test for text extraction functionality
 * This can be run manually in the browser console for testing
 */

import { 
  isFileTypeSupported, 
  getSupportedFileTypes, 
  getSupportedFileExtensions,
  getFileTypeDisplayName 
} from '../utils/textExtraction.js'

// Test file type validation
export const testFileTypeValidation = () => {
  console.log('🧪 Testing file type validation...')
  
  // Create mock files for testing
  const pdfFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })
  const docFile = new File(['test'], 'test.doc', { type: 'application/msword' })
  const docxFile = new File(['test'], 'test.docx', { 
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
  })
  const txtFile = new File(['test'], 'test.txt', { type: 'text/plain' })
  const invalidFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
  
  const testCases = [
    { file: pdfFile, expected: true, name: 'PDF file' },
    { file: docFile, expected: true, name: 'DOC file' },
    { file: docxFile, expected: true, name: 'DOCX file' },
    { file: txtFile, expected: true, name: 'TXT file' },
    { file: invalidFile, expected: false, name: 'Invalid file (JPG)' }
  ]
  
  testCases.forEach(({ file, expected, name }) => {
    const result = isFileTypeSupported(file)
    const displayName = getFileTypeDisplayName(file)
    
    console.log(`${result === expected ? '✅' : '❌'} ${name}: ${result} (${displayName})`)
  })
  
  console.log('📋 Supported types:', getSupportedFileTypes())
  console.log('📋 Supported extensions:', getSupportedFileExtensions())
}

// Test configuration
export const testConfiguration = () => {
  console.log('🔧 Testing configuration...')
  
  // Check environment variables
  const envVars = [
    'VITE_APPWRITE_ENDPOINT',
    'VITE_APPWRITE_PROJECT_ID',
    'VITE_APPWRITE_DATABASE_ID',
    'VITE_APPWRITE_RESUMES_COLLECTION_ID',
    'VITE_APPWRITE_STORAGE_BUCKET_ID',
    'VITE_MOCK_AI_RESPONSES',
    'VITE_MOCK_AUTH'
  ]
  
  envVars.forEach(varName => {
    const value = import.meta.env[varName]
    console.log(`${value ? '✅' : '❌'} ${varName}: ${value || 'Not set'}`)
  })
}

// Run all tests
export const runAllTests = () => {
  console.log('🚀 Running text extraction tests...')
  testFileTypeValidation()
  testConfiguration()
  console.log('✨ Tests completed!')
}

// Auto-run tests in development
if (import.meta.env.DEV) {
  console.log('🔧 Development mode detected - text extraction utilities loaded')
}