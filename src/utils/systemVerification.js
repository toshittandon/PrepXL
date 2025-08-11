/**
 * System verification utilities to ensure production readiness
 */

import { getConfig } from './envConfig.js'
import { validateFile } from '../services/appwrite/storage.js'
import { isFileTypeSupported, getSupportedFileTypes } from './textExtraction.js'

/**
 * Verify that mock environments are disabled
 * @returns {Object} Verification result
 */
export const verifyMockDisabled = () => {
  const config = getConfig()
  
  const mockSettings = {
    mockAiResponses: config.mockAiResponses,
    mockAuth: import.meta.env.VITE_MOCK_AUTH === 'true'
  }
  
  const issues = []
  
  if (mockSettings.mockAiResponses) {
    issues.push('Mock AI responses are still enabled (VITE_MOCK_AI_RESPONSES=true)')
  }
  
  if (mockSettings.mockAuth) {
    issues.push('Mock authentication is still enabled (VITE_MOCK_AUTH=true)')
  }
  
  return {
    passed: issues.length === 0,
    issues,
    mockSettings,
    message: issues.length === 0 
      ? 'All mock environments are properly disabled' 
      : 'Some mock environments are still enabled'
  }
}

/**
 * Verify that required environment variables are set
 * @returns {Object} Verification result
 */
export const verifyEnvironmentVariables = () => {
  const requiredVars = [
    'VITE_APPWRITE_ENDPOINT',
    'VITE_APPWRITE_PROJECT_ID',
    'VITE_APPWRITE_DATABASE_ID',
    'VITE_APPWRITE_USERS_COLLECTION_ID',
    'VITE_APPWRITE_RESUMES_COLLECTION_ID',
    'VITE_APPWRITE_SESSIONS_COLLECTION_ID',
    'VITE_APPWRITE_INTERACTIONS_COLLECTION_ID',
    'VITE_APPWRITE_QUESTIONS_COLLECTION_ID',
    'VITE_APPWRITE_STORAGE_BUCKET_ID'
  ]
  
  const missing = []
  const present = []
  
  requiredVars.forEach(varName => {
    const value = import.meta.env[varName]
    if (!value) {
      missing.push(varName)
    } else {
      present.push({ name: varName, value })
    }
  })
  
  return {
    passed: missing.length === 0,
    missing,
    present,
    message: missing.length === 0 
      ? 'All required environment variables are set' 
      : `Missing required environment variables: ${missing.join(', ')}`
  }
}

/**
 * Verify that AI API configuration is ready
 * @returns {Object} Verification result
 */
export const verifyAIConfiguration = () => {
  const config = getConfig()
  const issues = []
  
  if (!config.ai.baseUrl) {
    issues.push('AI API base URL is not configured (VITE_AI_API_BASE_URL)')
  }
  
  if (!config.ai.apiKey) {
    issues.push('AI API key is not configured (VITE_AI_API_KEY)')
  }
  
  // Check if still using mock responses when API is not configured
  if (config.mockAiResponses && (!config.ai.baseUrl || !config.ai.apiKey)) {
    issues.push('Mock AI responses are enabled but real API is not configured')
  }
  
  return {
    passed: issues.length === 0,
    issues,
    configuration: {
      baseUrl: config.ai.baseUrl || 'Not set',
      hasApiKey: !!config.ai.apiKey,
      mockMode: config.mockAiResponses
    },
    message: issues.length === 0 
      ? 'AI API configuration is ready' 
      : 'AI API configuration needs attention'
  }
}

/**
 * Verify that file upload system is working
 * @returns {Object} Verification result
 */
export const verifyFileUploadSystem = () => {
  const issues = []
  
  try {
    // Test file type validation
    const supportedTypes = getSupportedFileTypes()
    if (supportedTypes.length === 0) {
      issues.push('No supported file types configured')
    }
    
    // Test file validation with mock files
    const testFiles = [
      new File(['test'], 'test.pdf', { type: 'application/pdf' }),
      new File(['test'], 'test.doc', { type: 'application/msword' }),
      new File(['test'], 'test.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      })
    ]
    
    testFiles.forEach(file => {
      const validation = validateFile(file)
      if (!validation.isValid) {
        issues.push(`File validation failed for ${file.name}: ${validation.errors.join(', ')}`)
      }
      
      const typeSupported = isFileTypeSupported(file)
      if (!typeSupported) {
        issues.push(`File type not supported for ${file.name}`)
      }
    })
    
  } catch (error) {
    issues.push(`File upload system error: ${error.message}`)
  }
  
  return {
    passed: issues.length === 0,
    issues,
    supportedTypes: getSupportedFileTypes(),
    message: issues.length === 0 
      ? 'File upload system is working correctly' 
      : 'File upload system has issues'
  }
}

/**
 * Run comprehensive system verification
 * @returns {Object} Complete verification result
 */
export const runSystemVerification = () => {
  console.log('🔍 Running system verification...')
  
  const results = {
    mockDisabled: verifyMockDisabled(),
    environmentVariables: verifyEnvironmentVariables(),
    aiConfiguration: verifyAIConfiguration(),
    fileUploadSystem: verifyFileUploadSystem()
  }
  
  const allPassed = Object.values(results).every(result => result.passed)
  const totalIssues = Object.values(results).reduce((sum, result) => sum + (result.issues?.length || 0), 0)
  
  const summary = {
    passed: allPassed,
    totalIssues,
    results,
    message: allPassed 
      ? '✅ All system verifications passed - ready for production!' 
      : `❌ ${totalIssues} issues found - please review before production deployment`
  }
  
  // Log results
  console.log('\n📋 System Verification Results:')
  Object.entries(results).forEach(([key, result]) => {
    const status = result.passed ? '✅' : '❌'
    console.log(`${status} ${key}: ${result.message}`)
    
    if (!result.passed && result.issues) {
      result.issues.forEach(issue => {
        console.log(`   - ${issue}`)
      })
    }
  })
  
  console.log(`\n${summary.message}`)
  
  return summary
}

/**
 * Quick verification for development
 * @returns {boolean} True if system is ready
 */
export const quickVerification = () => {
  const mockCheck = verifyMockDisabled()
  const envCheck = verifyEnvironmentVariables()
  
  if (!mockCheck.passed) {
    console.warn('⚠️ Mock environments still enabled:', mockCheck.issues)
    return false
  }
  
  if (!envCheck.passed) {
    console.warn('⚠️ Missing environment variables:', envCheck.missing)
    return false
  }
  
  console.log('✅ Quick verification passed')
  return true
}

// Auto-run quick verification in development
if (import.meta.env.DEV) {
  setTimeout(() => {
    console.log('🔧 Running quick system verification...')
    quickVerification()
  }, 1000)
}