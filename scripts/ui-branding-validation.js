#!/usr/bin/env node

/**
 * UI Branding Validation Script
 * Validates that PrepXL branding is consistently displayed across UI components
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

class UIBrandingValidator {
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

  readFileSafe(filePath) {
    try {
      return fs.readFileSync(path.join(rootDir, filePath), 'utf8');
    } catch (error) {
      return null;
    }
  }

  validateComponentBranding() {
    console.log('🎨 Validating UI Component Branding...');
    
    const componentFiles = [
      'src/components/layout/Header.jsx',
      'src/components/layout/Sidebar.jsx', 
      'src/components/layout/Footer.jsx',
      'src/pages/auth/Login.jsx',
      'src/pages/auth/Signup.jsx'
    ];

    componentFiles.forEach(file => {
      const content = this.readFileSafe(file);
      if (content) {
        // Check for PrepXL references
        const hasPrepXL = content.includes('PrepXL');
        const hasOldBranding = content.includes('InterviewPrep AI') || content.includes('Interview Prep AI');
        
        this.addResult(
          'UI Branding',
          `${file}:PrepXL`,
          hasPrepXL,
          hasPrepXL ? 'Contains PrepXL branding' : 'Missing PrepXL branding'
        );

        this.addResult(
          'UI Branding',
          `${file}:OldBranding`,
          !hasOldBranding,
          hasOldBranding ? 'Contains old branding references' : 'No old branding found'
        );
      } else {
        this.addWarning(`Could not read component file: ${file}`);
      }
    });
  }

  validateHTMLMetadata() {
    console.log('📄 Validating HTML Metadata...');
    
    const indexContent = this.readFileSafe('index.html');
    if (indexContent) {
      const hasPrepXLTitle = indexContent.includes('PrepXL');
      const hasOldTitle = indexContent.includes('InterviewPrep AI') || indexContent.includes('Interview Prep AI');
      
      this.addResult(
        'HTML Metadata',
        'index.html:title',
        hasPrepXLTitle,
        hasPrepXLTitle ? 'Title contains PrepXL' : 'Title missing PrepXL'
      );

      this.addResult(
        'HTML Metadata',
        'index.html:oldTitle',
        !hasOldTitle,
        hasOldTitle ? 'Contains old title references' : 'No old title references'
      );
    }
  }

  validatePackageMetadata() {
    console.log('📦 Validating Package Metadata...');
    
    const packageContent = this.readFileSafe('package.json');
    if (packageContent) {
      try {
        const pkg = JSON.parse(packageContent);
        
        const correctName = pkg.name === 'prepxl';
        this.addResult(
          'Package Metadata',
          'package.json:name',
          correctName,
          correctName ? 'Package name is prepxl' : `Package name is ${pkg.name}, expected prepxl`
        );

        // Check description if it exists
        if (pkg.description) {
          const hasCorrectDescription = pkg.description.toLowerCase().includes('prepxl');
          this.addResult(
            'Package Metadata',
            'package.json:description',
            hasCorrectDescription,
            hasCorrectDescription ? 'Description references PrepXL' : 'Description missing PrepXL reference'
          );
        }
      } catch (error) {
        this.addResult('Package Metadata', 'package.json:parse', false, 'Failed to parse package.json');
      }
    }
  }

  validateDocumentationBranding() {
    console.log('📚 Validating Documentation Branding...');
    
    const docFiles = [
      'README.md',
      'USER_GUIDE.md',
      'ADMIN_GUIDE.md',
      'DEPLOYMENT.md',
      'APPWRITE_SETUP.md'
    ];

    docFiles.forEach(file => {
      const content = this.readFileSafe(file);
      if (content) {
        const hasPrepXL = content.includes('PrepXL');
        const hasOldBranding = content.includes('InterviewPrep AI') || content.includes('Interview Prep AI');
        
        this.addResult(
          'Documentation',
          `${file}:PrepXL`,
          hasPrepXL,
          hasPrepXL ? 'Contains PrepXL references' : 'Missing PrepXL references'
        );

        this.addResult(
          'Documentation',
          `${file}:OldBranding`,
          !hasOldBranding,
          hasOldBranding ? 'Contains old branding' : 'No old branding found'
        );
      } else {
        this.addWarning(`Documentation file not found: ${file}`);
      }
    });
  }

  validateConfigurationFiles() {
    console.log('⚙️  Validating Configuration Files...');
    
    const configFiles = [
      'netlify.toml',
      'vercel.json'
    ];

    configFiles.forEach(file => {
      const content = this.readFileSafe(file);
      if (content) {
        // Check for any branding references
        const hasPrepXL = content.includes('PrepXL') || content.includes('prepxl');
        const hasOldBranding = content.includes('InterviewPrep AI') || content.includes('interview-prep-ai');
        
        if (hasPrepXL || hasOldBranding) {
          this.addResult(
            'Configuration',
            `${file}:PrepXL`,
            hasPrepXL,
            hasPrepXL ? 'Uses PrepXL branding' : 'Missing PrepXL branding'
          );

          this.addResult(
            'Configuration',
            `${file}:OldBranding`,
            !hasOldBranding,
            hasOldBranding ? 'Contains old branding' : 'No old branding found'
          );
        }
      }
    });
  }

  async runValidation() {
    console.log('🔍 Starting UI Branding Validation...\n');
    
    this.validateComponentBranding();
    this.validateHTMLMetadata();
    this.validatePackageMetadata();
    this.validateDocumentationBranding();
    this.validateConfigurationFiles();
    
    this.printSummary();
  }

  printSummary() {
    console.log('\n=== UI BRANDING VALIDATION SUMMARY ===');
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.errors.length;
    const warnings = this.warnings.length;
    
    console.log(`Total tests: ${this.results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Warnings: ${warnings}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    if (this.errors.length === 0) {
      console.log('\n✅ All UI branding validation tests passed!');
    }
    
    return this.errors.length === 0;
  }
}

// Run validation
async function main() {
  const validator = new UIBrandingValidator();
  const success = await validator.runValidation();
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error('UI validation failed:', error);
  process.exit(1);
});