#!/usr/bin/env node

/**
 * Configuration Validation Script
 * This script validates that all Appwrite configuration and branding has been properly updated
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import path from 'path';

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Expected Appwrite configuration
const EXPECTED_CONFIG = {
  projectId: '68989b9a002cd7dd5c63',
  databaseId: '68989eb20006e65fe65f',
  collections: {
    users: '68989f1c0017e47f8bec',
    resumes: '687fe7c10007c51a7c90',
    sessions: '68989f450005eb99ff08',
    interactions: '68989f3c000b7f44ca7b',
    questions: '68989f35003b4c609313'
  },
  storageId: '68989f680031b3cdab2d'
};

// Old Appwrite IDs that should not exist
const OLD_APPWRITE_IDS = [
  '687fe297003367d2ee4e', // old project ID
  '687fe5e0002557f887a2', // old database ID
  '687fe5e0002557f887a3', // old users collection
  '687fe8b8001a486ba6aa', // old sessions collection
  '687fe8c5003655f25249', // old interactions collection
  '6890a98f001ab0a7e66d', // old questions collection
  '687fe89800141b0620d3'  // old storage bucket
];

// Old branding terms that should not exist
const OLD_BRANDING = [
  'InterviewPrep AI',
  'interview-prep-ai',
  'InterviewPrep',
  'interviewprep.ai'
];

let errors = [];
let warnings = [];
let passed = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  errors.push(message);
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  warnings.push(message);
  log(`⚠️  ${message}`, 'yellow');
}

function logSuccess(message) {
  passed++;
  log(`✅ ${message}`, 'green');
}

function validateEnvironmentFiles() {
  log('\n📋 Validating Environment Files...', 'blue');
  
  const envFiles = ['.env', '.env.development', '.env.staging', '.env.production', '.env.example'];
  
  envFiles.forEach(file => {
    if (!existsSync(file)) {
      logWarning(`Environment file ${file} does not exist`);
      return;
    }
    
    try {
      const content = readFileSync(file, 'utf8');
      
      // Check for correct Appwrite IDs (with or without quotes)
      if (content.includes(`VITE_APPWRITE_PROJECT_ID="${EXPECTED_CONFIG.projectId}"`) || 
          content.includes(`VITE_APPWRITE_PROJECT_ID=${EXPECTED_CONFIG.projectId}`)) {
        logSuccess(`${file} has correct project ID`);
      } else {
        logError(`${file} missing or incorrect project ID`);
      }
      
      if (content.includes(`VITE_APPWRITE_DATABASE_ID="${EXPECTED_CONFIG.databaseId}"`) || 
          content.includes(`VITE_APPWRITE_DATABASE_ID=${EXPECTED_CONFIG.databaseId}`)) {
        logSuccess(`${file} has correct database ID`);
      } else {
        logError(`${file} missing or incorrect database ID`);
      }
      
      // Check for PrepXL branding (with or without quotes)
      if (content.includes('VITE_APP_NAME="PrepXL"') || content.includes('VITE_APP_NAME=PrepXL')) {
        logSuccess(`${file} has correct app name`);
      } else {
        logError(`${file} missing or incorrect app name`);
      }
      
      // Check for old IDs
      OLD_APPWRITE_IDS.forEach(oldId => {
        if (content.includes(oldId)) {
          logError(`${file} contains old Appwrite ID: ${oldId}`);
        }
      });
      
      // Check for old branding
      OLD_BRANDING.forEach(oldBrand => {
        if (content.includes(oldBrand)) {
          logError(`${file} contains old branding: ${oldBrand}`);
        }
      });
      
    } catch (error) {
      logError(`Failed to read ${file}: ${error.message}`);
    }
  });
}

function getAllFiles(dir, extensions = ['.js', '.jsx', '.ts', '.tsx']) {
  const files = [];
  
  function walkDir(currentPath) {
    try {
      const items = readdirSync(currentPath);
      
      for (const item of items) {
        const fullPath = path.join(currentPath, item);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  walkDir(dir);
  return files;
}

function validateSourceCode() {
  log('\n🔍 Validating Source Code...', 'blue');
  
  try {
    const files = getAllFiles('src');
    
    files.forEach(file => {
      try {
        const content = readFileSync(file, 'utf8');
        
        // Check for old Appwrite IDs
        OLD_APPWRITE_IDS.forEach(oldId => {
          if (content.includes(oldId)) {
            logError(`${file} contains old Appwrite ID: ${oldId}`);
          }
        });
        
        // Check for old branding
        OLD_BRANDING.forEach(oldBrand => {
          if (content.includes(oldBrand)) {
            logError(`${file} contains old branding: ${oldBrand}`);
          }
        });
        
      } catch (error) {
        logWarning(`Could not read ${file}: ${error.message}`);
      }
    });
    
    logSuccess(`Scanned ${files.length} source files`);
    
  } catch (error) {
    logError(`Failed to scan source files: ${error.message}`);
  }
}

function validateConfigFiles() {
  log('\n⚙️  Validating Configuration Files...', 'blue');
  
  // Check package.json
  if (existsSync('package.json')) {
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      
      if (packageJson.name === 'prepxl') {
        logSuccess('package.json has correct name');
      } else {
        logError(`package.json has incorrect name: ${packageJson.name}`);
      }
      
      if (packageJson.description && packageJson.description.includes('PrepXL')) {
        logSuccess('package.json description mentions PrepXL');
      } else {
        logWarning('package.json description should mention PrepXL');
      }
      
    } catch (error) {
      logError(`Failed to parse package.json: ${error.message}`);
    }
  } else {
    logError('package.json not found');
  }
  
  // Check appwrite.json
  if (existsSync('appwrite.json')) {
    try {
      const appwriteJson = JSON.parse(readFileSync('appwrite.json', 'utf8'));
      
      if (appwriteJson.projectId === EXPECTED_CONFIG.projectId) {
        logSuccess('appwrite.json has correct project ID');
      } else {
        logError(`appwrite.json has incorrect project ID: ${appwriteJson.projectId}`);
      }
      
    } catch (error) {
      logError(`Failed to parse appwrite.json: ${error.message}`);
    }
  }
  
  // Check index.html
  if (existsSync('index.html')) {
    try {
      const content = readFileSync('index.html', 'utf8');
      
      if (content.includes('<title>PrepXL')) {
        logSuccess('index.html has correct title');
      } else {
        logError('index.html missing or incorrect title');
      }
      
      // Check for old branding
      OLD_BRANDING.forEach(oldBrand => {
        if (content.includes(oldBrand)) {
          logError(`index.html contains old branding: ${oldBrand}`);
        }
      });
      
    } catch (error) {
      logError(`Failed to read index.html: ${error.message}`);
    }
  }
}

function validateDocumentation() {
  log('\n📚 Validating Documentation...', 'blue');
  
  const docFiles = ['README.md', 'USER_GUIDE.md', 'ADMIN_GUIDE.md', 'DEPLOYMENT.md', 'APPWRITE_SETUP.md'];
  
  docFiles.forEach(file => {
    if (!existsSync(file)) {
      logWarning(`Documentation file ${file} does not exist`);
      return;
    }
    
    try {
      const content = readFileSync(file, 'utf8');
      
      // Check for PrepXL branding
      if (content.includes('PrepXL')) {
        logSuccess(`${file} mentions PrepXL`);
      } else {
        logWarning(`${file} should mention PrepXL`);
      }
      
      // Check for old branding
      OLD_BRANDING.forEach(oldBrand => {
        if (content.includes(oldBrand)) {
          logError(`${file} contains old branding: ${oldBrand}`);
        }
      });
      
      // Check for old Appwrite IDs
      OLD_APPWRITE_IDS.forEach(oldId => {
        if (content.includes(oldId)) {
          logError(`${file} contains old Appwrite ID: ${oldId}`);
        }
      });
      
    } catch (error) {
      logError(`Failed to read ${file}: ${error.message}`);
    }
  });
}

function validateEnvironmentVariableUsage() {
  log('\n🔧 Validating Environment Variable Usage...', 'blue');
  
  const requiredVars = [
    'VITE_APPWRITE_ENDPOINT',
    'VITE_APPWRITE_PROJECT_ID',
    'VITE_APPWRITE_DATABASE_ID',
    'VITE_APPWRITE_USERS_COLLECTION_ID',
    'VITE_APPWRITE_RESUMES_COLLECTION_ID',
    'VITE_APPWRITE_SESSIONS_COLLECTION_ID',
    'VITE_APPWRITE_INTERACTIONS_COLLECTION_ID',
    'VITE_APPWRITE_QUESTIONS_COLLECTION_ID',
    'VITE_APPWRITE_STORAGE_BUCKET_ID',
    'VITE_APP_NAME'
  ];
  
  try {
    const files = getAllFiles('src');
    const usedVars = new Set();
    
    files.forEach(file => {
      try {
        const content = readFileSync(file, 'utf8');
        
        requiredVars.forEach(varName => {
          if (content.includes(varName)) {
            usedVars.add(varName);
          }
        });
        
      } catch (error) {
        // Skip files that can't be read
      }
    });
    
    requiredVars.forEach(varName => {
      if (usedVars.has(varName)) {
        logSuccess(`Environment variable ${varName} is used in source code`);
      } else {
        logWarning(`Environment variable ${varName} is not used in source code`);
      }
    });
    
  } catch (error) {
    logError(`Failed to validate environment variable usage: ${error.message}`);
  }
}

function printSummary() {
  log('\n📊 Validation Summary', 'bold');
  log('='.repeat(50), 'blue');
  
  if (errors.length === 0) {
    log(`🎉 All validations passed! (${passed} checks)`, 'green');
  } else {
    log(`❌ ${errors.length} error(s) found:`, 'red');
    errors.forEach(error => log(`   • ${error}`, 'red'));
  }
  
  if (warnings.length > 0) {
    log(`⚠️  ${warnings.length} warning(s):`, 'yellow');
    warnings.forEach(warning => log(`   • ${warning}`, 'yellow'));
  }
  
  log(`✅ ${passed} checks passed`, 'green');
  
  if (errors.length === 0) {
    log('\n🚀 Configuration validation complete! Your app is ready to use the new Appwrite setup.', 'green');
  } else {
    log('\n🔧 Please fix the errors above before proceeding.', 'red');
    process.exit(1);
  }
}

// Main execution
async function main() {
  log('🔍 PrepXL Configuration Validation', 'bold');
  log('='.repeat(50), 'blue');
  
  validateEnvironmentFiles();
  validateSourceCode();
  validateConfigFiles();
  validateDocumentation();
  validateEnvironmentVariableUsage();
  
  printSummary();
}

main().catch(error => {
  logError(`Validation script failed: ${error.message}`);
  process.exit(1);
});