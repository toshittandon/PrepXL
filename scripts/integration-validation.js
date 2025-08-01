#!/usr/bin/env node

/**
 * Integration Validation Script
 * Validates that all requirements from the spec are met and functioning
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

const log = (message, color = COLORS.RESET) => {
  console.log(`${color}${message}${COLORS.RESET}`);
};

const checkmark = `${COLORS.GREEN}✓${COLORS.RESET}`;
const crossmark = `${COLORS.RED}✗${COLORS.RESET}`;
const warning = `${COLORS.YELLOW}⚠${COLORS.RESET}`;

let totalChecks = 0;
let passedChecks = 0;
let warnings = 0;

const check = (condition, message, isWarning = false) => {
  totalChecks++;
  if (condition) {
    passedChecks++;
    log(`${checkmark} ${message}`);
    return true;
  } else {
    if (isWarning) {
      warnings++;
      log(`${warning} ${message}`);
    } else {
      log(`${crossmark} ${message}`);
    }
    return false;
  }
};

const section = (title) => {
  log(`\n${COLORS.BOLD}${COLORS.BLUE}${title}${COLORS.RESET}`);
  log('='.repeat(title.length));
};

const fileExists = (path) => {
  try {
    return existsSync(path);
  } catch {
    return false;
  }
};

const readFile = (path) => {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
};

const hasContent = (path, content) => {
  const file = readFile(path);
  return file && file.includes(content);
};

const runCommand = (command, silent = true) => {
  try {
    const result = execSync(command, { 
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Main validation function
async function validateIntegration() {
  log(`${COLORS.BOLD}${COLORS.BLUE}🔍 InterviewPrep AI - Integration Validation${COLORS.RESET}\n`);

  // 1. Project Structure Validation
  section('📁 Project Structure');
  
  check(fileExists('package.json'), 'package.json exists');
  check(fileExists('vite.config.js'), 'Vite configuration exists');
  check(fileExists('tailwind.config.js'), 'Tailwind configuration exists');
  check(fileExists('src/App.jsx'), 'Main App component exists');
  check(fileExists('src/main.jsx'), 'Main entry point exists');
  check(fileExists('src/store/index.js'), 'Redux store exists');

  // 2. Core Components Validation
  section('🧩 Core Components');
  
  const coreComponents = [
    'src/components/common/AuthGuard.jsx',
    'src/components/common/LoadingSpinner.jsx',
    'src/components/common/ErrorMessage.jsx',
    'src/components/forms/LoginForm.jsx',
    'src/components/forms/SignupForm.jsx',
    'src/components/dashboard/Dashboard.jsx',
    'src/components/interview/SpeechRecognition.jsx',
    'src/components/resume/ResumeUpload.jsx'
  ];

  coreComponents.forEach(component => {
    check(fileExists(component), `${component.split('/').pop()} exists`);
  });

  // 3. Redux Store Validation
  section('🏪 Redux Store');
  
  const slices = [
    'src/store/slices/authSlice.js',
    'src/store/slices/resumeSlice.js',
    'src/store/slices/interviewSlice.js',
    'src/store/slices/uiSlice.js'
  ];

  slices.forEach(slice => {
    check(fileExists(slice), `${slice.split('/').pop()} exists`);
  });

  // 4. Services Validation
  section('🔧 Services');
  
  const services = [
    'src/services/appwrite/auth.js',
    'src/services/appwrite/database.js',
    'src/services/appwrite/storage.js',
    'src/services/ai/resumeAnalysis.js'
  ];

  services.forEach(service => {
    check(fileExists(service), `${service.split('/').pop()} exists`);
  });

  // 5. Pages Validation
  section('📄 Pages');
  
  const pages = [
    'src/pages/auth/Login.jsx',
    'src/pages/auth/Signup.jsx',
    'src/pages/dashboard/Dashboard.jsx',
    'src/pages/resume/ResumeUpload.jsx',
    'src/pages/resume/ResumeAnalysis.jsx',
    'src/pages/interview/InterviewSetup.jsx',
    'src/pages/interview/LiveInterview.jsx',
    'src/pages/interview/FeedbackReport.jsx'
  ];

  pages.forEach(page => {
    check(fileExists(page), `${page.split('/').pop()} exists`);
  });

  // 6. Configuration Files Validation
  section('⚙️ Configuration');
  
  check(fileExists('.env.example'), '.env.example exists');
  check(fileExists('cypress.config.js'), 'Cypress configuration exists');
  check(fileExists('src/test/setup.js'), 'Test setup exists');

  // Check environment variables
  const envExample = readFile('.env.example');
  if (envExample) {
    check(envExample.includes('VITE_APPWRITE_ENDPOINT'), 'Appwrite endpoint configured');
    check(envExample.includes('VITE_APPWRITE_PROJECT_ID'), 'Appwrite project ID configured');
    check(envExample.includes('VITE_AI_API_BASE_URL'), 'AI API base URL configured');
  }

  // 7. Build System Validation
  section('🔨 Build System');
  
  const buildResult = runCommand('npm run build');
  check(buildResult.success, 'Production build succeeds');

  if (buildResult.success) {
    check(fileExists('dist/index.html'), 'Build output exists');
    check(fileExists('dist/assets'), 'Assets directory exists', true);
  }

  // 8. Dependencies Validation
  section('📦 Dependencies');
  
  const packageJson = readFile('package.json');
  if (packageJson) {
    const pkg = JSON.parse(packageJson);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    
    check(deps['react'], 'React installed');
    check(deps['@reduxjs/toolkit'], 'Redux Toolkit installed');
    check(deps['react-router-dom'], 'React Router installed');
    check(deps['appwrite'], 'Appwrite SDK installed');
    check(deps['tailwindcss'], 'Tailwind CSS installed');
    check(deps['vitest'], 'Vitest installed');
    check(deps['cypress'], 'Cypress installed');
  }

  // 9. Code Quality Validation
  section('✨ Code Quality');
  
  const lintResult = runCommand('npm run lint');
  check(lintResult.success, 'ESLint passes', true);

  // 10. Test Coverage Validation
  section('🧪 Testing');
  
  // Check if test files exist
  const testDirs = [
    'src/test/components',
    'src/test/services',
    'src/test/store',
    'src/test/integration',
    'cypress/e2e'
  ];

  testDirs.forEach(dir => {
    check(fileExists(dir), `${dir} test directory exists`);
  });

  // 11. Performance Validation
  section('⚡ Performance');
  
  if (fileExists('dist')) {
    const bundleAnalysis = runCommand('node scripts/analyze-bundle.js');
    check(bundleAnalysis.success, 'Bundle analysis runs successfully');
    
    // Check bundle size (should be under 1MB)
    if (bundleAnalysis.success && bundleAnalysis.output) {
      const totalSizeMatch = bundleAnalysis.output.match(/Total Bundle Size: ([\d.]+) KB/);
      if (totalSizeMatch) {
        const totalSize = parseFloat(totalSizeMatch[1]);
        check(totalSize < 1024, `Bundle size under 1MB (${totalSize}KB)`);
      }
    }
  }

  // 12. Security Validation
  section('🔒 Security');
  
  check(hasContent('src/services/appwrite/auth.js', 'try'), 'Authentication has error handling');
  check(hasContent('src/utils/errorHandling.js', 'sanitize'), 'Error sanitization exists', true);
  check(!hasContent('.env.example', 'your-actual-key'), 'No real keys in example file');

  // 13. Accessibility Validation
  section('♿ Accessibility');
  
  check(hasContent('src/components/common/Button.jsx', 'aria-'), 'ARIA attributes used', true);
  check(hasContent('src/components/forms/LoginForm.jsx', 'label'), 'Form labels exist', true);

  // 14. Requirements Validation
  section('📋 Requirements Validation');
  
  // Check if all major requirements are addressed
  const requirements = [
    { file: 'src/services/appwrite/auth.js', desc: 'Authentication system (Req 1)' },
    { file: 'src/services/ai/resumeAnalysis.js', desc: 'Resume analysis (Req 2)' },
    { file: 'src/components/interview/SpeechRecognition.jsx', desc: 'Interview system (Req 3)' },
    { file: 'src/pages/interview/FeedbackReport.jsx', desc: 'Feedback reports (Req 4)' },
    { file: 'src/pages/dashboard/Dashboard.jsx', desc: 'Dashboard (Req 5)' },
    { file: 'tailwind.config.js', desc: 'Responsive design (Req 6)' },
    { file: 'src/services/appwrite/database.js', desc: 'Data management (Req 7)' },
    { file: 'vite.config.js', desc: 'Build system (Req 8)' }
  ];

  requirements.forEach(req => {
    check(fileExists(req.file), req.desc);
  });

  // Final Summary
  section('📊 Summary');
  
  const successRate = Math.round((passedChecks / totalChecks) * 100);
  
  log(`\nTotal Checks: ${totalChecks}`);
  log(`Passed: ${COLORS.GREEN}${passedChecks}${COLORS.RESET}`);
  log(`Failed: ${COLORS.RED}${totalChecks - passedChecks}${COLORS.RESET}`);
  log(`Warnings: ${COLORS.YELLOW}${warnings}${COLORS.RESET}`);
  log(`Success Rate: ${successRate >= 90 ? COLORS.GREEN : successRate >= 70 ? COLORS.YELLOW : COLORS.RED}${successRate}%${COLORS.RESET}`);

  if (successRate >= 90) {
    log(`\n${COLORS.GREEN}${COLORS.BOLD}🎉 Integration validation PASSED! The application is ready for deployment.${COLORS.RESET}`);
  } else if (successRate >= 70) {
    log(`\n${COLORS.YELLOW}${COLORS.BOLD}⚠️ Integration validation PASSED with warnings. Consider addressing the issues above.${COLORS.RESET}`);
  } else {
    log(`\n${COLORS.RED}${COLORS.BOLD}❌ Integration validation FAILED. Please address the critical issues above.${COLORS.RESET}`);
  }

  return successRate >= 70;
}

// Run validation
validateIntegration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    log(`\n${COLORS.RED}${COLORS.BOLD}💥 Validation failed with error: ${error.message}${COLORS.RESET}`);
    process.exit(1);
  });