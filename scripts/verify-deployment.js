#!/usr/bin/env node

/**
 * Deployment verification script
 * Checks if the build is ready for deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const checkFile = (filePath, description) => {
  const fullPath = path.join(rootDir, filePath);
  if (fs.existsSync(fullPath)) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} - Missing: ${filePath}`, 'red');
    return false;
  }
};

const checkDirectory = (dirPath, description) => {
  const fullPath = path.join(rootDir, dirPath);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} - Missing: ${dirPath}`, 'red');
    return false;
  }
};

const checkPackageScript = (scriptName, description) => {
  const packageJsonPath = path.join(rootDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.scripts && packageJson.scripts[scriptName]) {
      log(`✅ ${description}`, 'green');
      return true;
    }
  }
  log(`❌ ${description} - Missing script: ${scriptName}`, 'red');
  return false;
};

const checkEnvironmentFile = (envFile, description) => {
  const envPath = path.join(rootDir, envFile);
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const hasRequiredVars = content.includes('VITE_APPWRITE_ENDPOINT') && 
                           content.includes('VITE_APPWRITE_PROJECT_ID');
    if (hasRequiredVars) {
      log(`✅ ${description}`, 'green');
      return true;
    } else {
      log(`⚠️  ${description} - Missing required variables`, 'yellow');
      return false;
    }
  } else {
    log(`❌ ${description} - Missing: ${envFile}`, 'red');
    return false;
  }
};

async function verifyDeployment() {
  log('\n🚀 Deployment Verification Checklist\n', 'blue');

  let allChecks = true;

  // Configuration Files
  log('📋 Configuration Files:', 'blue');
  allChecks &= checkFile('vite.config.js', 'Vite configuration');
  allChecks &= checkFile('package.json', 'Package configuration');
  allChecks &= checkFile('tailwind.config.js', 'Tailwind configuration');

  // Environment Files
  log('\n🌍 Environment Configuration:', 'blue');
  allChecks &= checkEnvironmentFile('.env.example', 'Environment template');
  allChecks &= checkEnvironmentFile('.env.development', 'Development environment');
  allChecks &= checkEnvironmentFile('.env.staging', 'Staging environment');
  allChecks &= checkEnvironmentFile('.env.production', 'Production environment');

  // Deployment Configuration
  log('\n🚀 Deployment Configuration:', 'blue');
  allChecks &= checkFile('vercel.json', 'Vercel configuration');
  allChecks &= checkFile('netlify.toml', 'Netlify configuration');
  allChecks &= checkFile('DEPLOYMENT.md', 'Deployment documentation');

  // CI/CD Configuration
  log('\n⚙️  CI/CD Configuration:', 'blue');
  allChecks &= checkDirectory('.github/workflows', 'GitHub Actions directory');
  allChecks &= checkFile('.github/workflows/ci.yml', 'CI workflow');
  allChecks &= checkFile('.github/workflows/deploy-production.yml', 'Production deployment workflow');
  allChecks &= checkFile('.github/workflows/deploy-staging.yml', 'Staging deployment workflow');

  // Build Scripts
  log('\n📦 Build Scripts:', 'blue');
  allChecks &= checkPackageScript('build', 'Production build script');
  allChecks &= checkPackageScript('build:staging', 'Staging build script');
  allChecks &= checkPackageScript('build:production', 'Production build script');
  allChecks &= checkPackageScript('preview', 'Preview script');

  // Monitoring and Analytics
  log('\n📊 Monitoring Configuration:', 'blue');
  allChecks &= checkFile('src/utils/monitoring.js', 'Monitoring utilities');
  allChecks &= checkFile('src/utils/envConfig.js', 'Environment configuration utilities');

  // Test Configuration
  log('\n🧪 Test Configuration:', 'blue');
  allChecks &= checkPackageScript('test:run', 'Unit test script');
  allChecks &= checkPackageScript('test:e2e', 'E2E test script');
  allChecks &= checkFile('cypress.config.js', 'Cypress configuration');

  // Build Verification
  log('\n🔨 Build Verification:', 'blue');
  try {
    const distPath = path.join(rootDir, 'dist');
    if (fs.existsSync(distPath)) {
      log('✅ Build directory exists', 'green');
      
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        log('✅ Build index.html exists', 'green');
      } else {
        log('⚠️  Build index.html missing - Run build first', 'yellow');
      }
    } else {
      log('⚠️  Build directory missing - Run build first', 'yellow');
    }
  } catch (error) {
    log('❌ Error checking build directory', 'red');
  }

  // Final Result
  log('\n' + '='.repeat(50), 'blue');
  if (allChecks) {
    log('🎉 All deployment checks passed! Ready for deployment.', 'green');
    process.exit(0);
  } else {
    log('⚠️  Some deployment checks failed. Please review and fix issues.', 'yellow');
    log('📖 See DEPLOYMENT.md for detailed instructions.', 'blue');
    process.exit(1);
  }
}

// Run verification
verifyDeployment().catch((error) => {
  log(`❌ Verification failed: ${error.message}`, 'red');
  process.exit(1);
});