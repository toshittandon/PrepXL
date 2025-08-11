#!/usr/bin/env node

/**
 * Final Validation Script for PrepXL Appwrite Configuration Update
 * This script validates all requirements from the spec are met
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Expected Appwrite IDs from requirements
const EXPECTED_CONFIG = {
  VITE_APPWRITE_PROJECT_ID: "68989b9a002cd7dd5c63",
  VITE_APPWRITE_DATABASE_ID: "68989eb20006e65fe65f",
  VITE_APPWRITE_USERS_COLLECTION_ID: "68989f1c0017e47f8bec",
  VITE_APPWRITE_RESUMES_COLLECTION_ID: "687fe7c10007c51a7c90",
  VITE_APPWRITE_SESSIONS_COLLECTION_ID: "68989f450005eb99ff08",
  VITE_APPWRITE_INTERACTIONS_COLLECTION_ID: "68989f3c000b7f44ca7b",
  VITE_APPWRITE_QUESTIONS_COLLECTION_ID: "68989f35003b4c609313",
  VITE_APPWRITE_STORAGE_BUCKET_ID: "68989f680031b3cdab2d",
  VITE_APP_NAME: "PrepXL"
};

class ValidationResults {
  constructor() {
    this.results = [];
    this.errors = [];
    this.warnings = [];
  }

  addResult(category, test, passed, message) {
    this.results.push({ category, test, passed, message });
    if (!passed) {
      this.errors.push(`${category}: ${test} - ${message}`);
    }
  }

  addWarning(message) {
    this.warnings.push(message);
  }

  printSummary() {
    console.log('\n=== VALIDATION SUMMARY ===');
    console.log(`Total tests: ${this.results.length}`);
    console.log(`Passed: ${this.results.filter(r => r.passed).length}`);
    console.log(`Failed: ${this.errors.length}`);
    console.log(`Warnings: ${this.warnings.length}`);

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => console.log(`  - ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    if (this.errors.length === 0) {
      console.log('\n✅ All validation tests passed!');
    }

    return this.errors.length === 0;
  }
}

const validator = new ValidationResults();

// Helper function to read file safely
function readFileSafe(filePath) {
  try {
    return fs.readFileSync(path.join(rootDir, filePath), 'utf8');
  } catch (error) {
    return null;
  }
}

// Helper function to parse env file
function parseEnvFile(content) {
  const env = {};
  if (!content) return env;
  
  content.split('\n').forEach(line => {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || !line.trim()) return;
    
    const equalIndex = line.indexOf('=');
    if (equalIndex > 0) {
      const key = line.substring(0, equalIndex).trim();
      let value = line.substring(equalIndex + 1).trim();
      
      // Remove surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      env[key] = value;
    }
  });
  return env;
}

// Requirement 1: Validate Appwrite Configuration IDs
function validateAppwriteConfig() {
  console.log('\n🔍 Validating Appwrite Configuration...');
  
  const envFiles = ['.env', '.env.development', '.env.staging', '.env.production', '.env.example'];
  
  envFiles.forEach(envFile => {
    const content = readFileSafe(envFile);
    if (!content) {
      validator.addWarning(`Environment file ${envFile} not found`);
      return;
    }

    const env = parseEnvFile(content);
    
    Object.entries(EXPECTED_CONFIG).forEach(([key, expectedValue]) => {
      if (key === 'VITE_APP_NAME') return; // Handle separately
      
      const actualValue = env[key];
      const passed = actualValue === expectedValue;
      validator.addResult(
        'Appwrite Config',
        `${envFile}:${key}`,
        passed,
        passed ? 'Correct ID' : `Expected ${expectedValue}, got ${actualValue}`
      );
    });
  });
}

// Requirement 2: Validate PrepXL Branding
function validateBranding() {
  console.log('\n🎨 Validating PrepXL Branding...');
  
  // Check environment files
  const envFiles = ['.env', '.env.development', '.env.staging', '.env.production', '.env.example'];
  envFiles.forEach(envFile => {
    const content = readFileSafe(envFile);
    if (content) {
      const env = parseEnvFile(content);
      // Allow environment-specific variations like "PrepXL (Dev)" or "PrepXL (Staging)"
      const appName = env.VITE_APP_NAME;
      const passed = appName && (appName === 'PrepXL' || appName.startsWith('PrepXL'));
      validator.addResult(
        'Branding',
        `${envFile}:VITE_APP_NAME`,
        passed,
        passed ? 'Correct app name' : `Expected PrepXL or PrepXL variant, got ${appName}`
      );
    }
  });

  // Check package.json
  const packageContent = readFileSafe('package.json');
  if (packageContent) {
    try {
      const pkg = JSON.parse(packageContent);
      const passed = pkg.name === 'prepxl';
      validator.addResult(
        'Branding',
        'package.json:name',
        passed,
        passed ? 'Correct package name' : `Expected prepxl, got ${pkg.name}`
      );
    } catch (error) {
      validator.addResult('Branding', 'package.json:parse', false, 'Failed to parse package.json');
    }
  }

  // Check index.html
  const indexContent = readFileSafe('index.html');
  if (indexContent) {
    const hasPrepXL = indexContent.includes('PrepXL');
    validator.addResult(
      'Branding',
      'index.html:title',
      hasPrepXL,
      hasPrepXL ? 'Contains PrepXL branding' : 'Missing PrepXL branding'
    );
  }
}

// Requirement 3: Check for old Appwrite ID references
function validateNoOldReferences() {
  console.log('\n🔍 Checking for old Appwrite ID references...');
  
  // Common old IDs that might exist (these are examples, adjust as needed)
  const oldPatterns = [
    /interview-prep-ai/gi,
    /InterviewPrep AI/g,
    /INTERVIEW_PREP/g
  ];

  const filesToCheck = [
    'src/**/*.js',
    'src/**/*.jsx',
    'src/**/*.ts',
    'src/**/*.tsx',
    '*.md',
    'package.json',
    'index.html'
  ];

  // This is a simplified check - in a real scenario you'd use glob patterns
  const sourceFiles = [
    'src/constants/index.js',
    'src/utils/envConfig.js',
    'README.md',
    'USER_GUIDE.md',
    'ADMIN_GUIDE.md'
  ];

  sourceFiles.forEach(file => {
    const content = readFileSafe(file);
    if (content) {
      let hasOldReferences = false;
      oldPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          hasOldReferences = true;
        }
      });
      
      validator.addResult(
        'Old References',
        file,
        !hasOldReferences,
        hasOldReferences ? 'Contains old references' : 'No old references found'
      );
    }
  });
}

// Requirement 4: Validate environment consistency
function validateEnvironmentConsistency() {
  console.log('\n⚖️  Validating environment consistency...');
  
  const envFiles = ['.env', '.env.development', '.env.staging', '.env.production'];
  const envConfigs = {};
  
  envFiles.forEach(envFile => {
    const content = readFileSafe(envFile);
    if (content) {
      envConfigs[envFile] = parseEnvFile(content);
    }
  });

  // Check that all environments have the required variables
  Object.keys(EXPECTED_CONFIG).forEach(key => {
    Object.keys(envConfigs).forEach(envFile => {
      const hasKey = envConfigs[envFile][key] !== undefined;
      validator.addResult(
        'Environment Consistency',
        `${envFile}:${key}`,
        hasKey,
        hasKey ? 'Variable present' : 'Variable missing'
      );
    });
  });
}

// Main validation function
async function runValidation() {
  console.log('🚀 Starting PrepXL Configuration Validation...');
  
  validateAppwriteConfig();
  validateBranding();
  validateNoOldReferences();
  validateEnvironmentConsistency();
  
  const success = validator.printSummary();
  process.exit(success ? 0 : 1);
}

// Run validation
runValidation().catch(error => {
  console.error('Validation failed with error:', error);
  process.exit(1);
});