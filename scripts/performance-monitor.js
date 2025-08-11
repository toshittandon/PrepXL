#!/usr/bin/env node

/**
 * Performance Monitoring Script
 * Monitors build performance, bundle sizes, and deployment metrics
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

/**
 * Performance thresholds
 */
const THRESHOLDS = {
  bundleSize: {
    excellent: 200 * 1024, // 200KB
    good: 500 * 1024,      // 500KB
    acceptable: 1024 * 1024, // 1MB
  },
  buildTime: {
    excellent: 30000, // 30 seconds
    good: 60000,      // 1 minute
    acceptable: 120000, // 2 minutes
  },
  chunkCount: {
    min: 3,
    max: 15,
  },
  fileSize: {
    jsWarning: 200 * 1024,  // 200KB
    jsError: 500 * 1024,    // 500KB
    cssWarning: 50 * 1024,  // 50KB
    cssError: 100 * 1024,   // 100KB
  }
};

/**
 * Monitor build performance
 */
async function monitorBuildPerformance() {
  log('\n🚀 Performance Monitoring Report', 'blue');
  log('=' .repeat(60), 'blue');

  const startTime = performance.now();
  
  // Check if build exists
  const distPath = path.join(rootDir, 'dist');
  if (!fs.existsSync(distPath)) {
    log('❌ Build directory not found. Run build first.', 'red');
    return false;
  }

  // Analyze bundle
  const bundleAnalysis = await analyzeBundlePerformance();
  
  // Check build artifacts
  const artifactAnalysis = checkBuildArtifacts();
  
  // Generate performance report
  const report = generatePerformanceReport(bundleAnalysis, artifactAnalysis);
  
  // Display results
  displayPerformanceResults(report);
  
  // Save report
  savePerformanceReport(report);
  
  const endTime = performance.now();
  log(`\n⏱️  Analysis completed in ${((endTime - startTime) / 1000).toFixed(2)}s`, 'cyan');
  
  return report.score >= 70; // Pass if score is 70 or above
}

/**
 * Analyze bundle performance
 */
async function analyzeBundlePerformance() {
  const distPath = path.join(rootDir, 'dist');
  const files = getAllFiles(distPath);
  
  const analysis = {
    totalSize: 0,
    jsSize: 0,
    cssSize: 0,
    assetSize: 0,
    fileCount: 0,
    jsFiles: [],
    cssFiles: [],
    assetFiles: [],
    chunkCount: 0,
  };

  files.forEach(filePath => {
    const stats = fs.statSync(filePath);
    const relativePath = path.relative(distPath, filePath);
    const ext = path.extname(filePath).toLowerCase();
    const size = stats.size;
    
    analysis.totalSize += size;
    analysis.fileCount++;
    
    const fileInfo = {
      path: relativePath,
      size: size,
      sizeKB: (size / 1024).toFixed(2),
    };

    if (ext === '.js') {
      analysis.jsSize += size;
      analysis.jsFiles.push(fileInfo);
      if (relativePath.includes('chunk') || relativePath.includes('-')) {
        analysis.chunkCount++;
      }
    } else if (ext === '.css') {
      analysis.cssSize += size;
      analysis.cssFiles.push(fileInfo);
    } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'].includes(ext)) {
      analysis.assetSize += size;
      analysis.assetFiles.push(fileInfo);
    }
  });

  // Sort by size
  analysis.jsFiles.sort((a, b) => b.size - a.size);
  analysis.cssFiles.sort((a, b) => b.size - a.size);
  analysis.assetFiles.sort((a, b) => b.size - a.size);

  return analysis;
}

/**
 * Check build artifacts
 */
function checkBuildArtifacts() {
  const distPath = path.join(rootDir, 'dist');
  const analysis = {
    hasIndex: false,
    hasAssets: false,
    hasSourceMaps: false,
    hasManifest: false,
    structure: {},
  };

  // Check for index.html
  analysis.hasIndex = fs.existsSync(path.join(distPath, 'index.html'));
  
  // Check for assets directory
  analysis.hasAssets = fs.existsSync(path.join(distPath, 'assets'));
  
  // Check for source maps
  const files = getAllFiles(distPath);
  analysis.hasSourceMaps = files.some(file => file.endsWith('.map'));
  
  // Check for manifest
  analysis.hasManifest = files.some(file => file.includes('manifest'));
  
  // Analyze directory structure
  try {
    const items = fs.readdirSync(distPath);
    items.forEach(item => {
      const itemPath = path.join(distPath, item);
      const stats = fs.statSync(itemPath);
      analysis.structure[item] = {
        isDirectory: stats.isDirectory(),
        size: stats.isDirectory() ? getDirSize(itemPath) : stats.size,
      };
    });
  } catch (error) {
    log(`⚠️  Could not analyze directory structure: ${error.message}`, 'yellow');
  }

  return analysis;
}

/**
 * Generate performance report
 */
function generatePerformanceReport(bundleAnalysis, artifactAnalysis) {
  let score = 100;
  const issues = [];
  const recommendations = [];

  // Bundle size scoring
  const bundleSize = bundleAnalysis.jsSize + bundleAnalysis.cssSize;
  if (bundleSize > THRESHOLDS.bundleSize.acceptable) {
    score -= 30;
    issues.push({ type: 'bundle-size', severity: 'high', message: 'Bundle size exceeds 1MB' });
    recommendations.push('Implement aggressive code splitting and lazy loading');
  } else if (bundleSize > THRESHOLDS.bundleSize.good) {
    score -= 15;
    issues.push({ type: 'bundle-size', severity: 'medium', message: 'Bundle size exceeds 500KB' });
    recommendations.push('Consider additional code splitting');
  } else if (bundleSize > THRESHOLDS.bundleSize.excellent) {
    score -= 5;
    issues.push({ type: 'bundle-size', severity: 'low', message: 'Bundle size exceeds 200KB' });
  }

  // Individual file size scoring
  const largeJSFiles = bundleAnalysis.jsFiles.filter(file => file.size > THRESHOLDS.fileSize.jsError);
  const largeCSS = bundleAnalysis.cssFiles.filter(file => file.size > THRESHOLDS.fileSize.cssError);
  
  if (largeJSFiles.length > 0) {
    score -= largeJSFiles.length * 10;
    issues.push({ 
      type: 'large-files', 
      severity: 'high', 
      message: `${largeJSFiles.length} JavaScript files exceed 500KB` 
    });
    recommendations.push('Split large JavaScript files into smaller chunks');
  }

  if (largeCSS.length > 0) {
    score -= largeCSS.length * 5;
    issues.push({ 
      type: 'large-files', 
      severity: 'medium', 
      message: `${largeCSS.length} CSS files exceed 100KB` 
    });
    recommendations.push('Enable CSS purging and consider CSS-in-JS');
  }

  // Chunk count scoring
  if (bundleAnalysis.chunkCount > THRESHOLDS.chunkCount.max) {
    score -= 10;
    issues.push({ type: 'chunk-count', severity: 'medium', message: 'Too many chunks detected' });
    recommendations.push('Consolidate smaller chunks for better performance');
  } else if (bundleAnalysis.chunkCount < THRESHOLDS.chunkCount.min) {
    score -= 5;
    issues.push({ type: 'chunk-count', severity: 'low', message: 'Too few chunks detected' });
    recommendations.push('Consider more code splitting for better caching');
  }

  // Build artifacts scoring
  if (!artifactAnalysis.hasIndex) {
    score -= 20;
    issues.push({ type: 'build-artifacts', severity: 'high', message: 'Missing index.html' });
  }

  if (!artifactAnalysis.hasAssets) {
    score -= 10;
    issues.push({ type: 'build-artifacts', severity: 'medium', message: 'Missing assets directory' });
  }

  // Determine grade
  let grade = 'A+';
  if (score < 90) grade = 'A';
  if (score < 80) grade = 'B';
  if (score < 70) grade = 'C';
  if (score < 60) grade = 'D';
  if (score < 50) grade = 'F';

  return {
    score: Math.max(0, score),
    grade,
    bundleAnalysis,
    artifactAnalysis,
    issues,
    recommendations,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Display performance results
 */
function displayPerformanceResults(report) {
  const { score, grade, bundleAnalysis, issues, recommendations } = report;

  // Overall score
  log(`\n🎯 Performance Score: ${score}/100 (${grade})`, score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red');

  // Bundle summary
  log('\n📦 Bundle Summary:', 'blue');
  log(`  Total Size: ${(bundleAnalysis.totalSize / 1024).toFixed(2)} KB`, 'cyan');
  log(`  JavaScript: ${(bundleAnalysis.jsSize / 1024).toFixed(2)} KB (${bundleAnalysis.jsFiles.length} files)`, 'cyan');
  log(`  CSS: ${(bundleAnalysis.cssSize / 1024).toFixed(2)} KB (${bundleAnalysis.cssFiles.length} files)`, 'cyan');
  log(`  Assets: ${(bundleAnalysis.assetSize / 1024).toFixed(2)} KB (${bundleAnalysis.assetFiles.length} files)`, 'cyan');
  log(`  Chunks: ${bundleAnalysis.chunkCount}`, 'cyan');

  // Performance thresholds
  const bundleSize = bundleAnalysis.jsSize + bundleAnalysis.cssSize;
  log('\n🚦 Performance Thresholds:', 'blue');
  if (bundleSize < THRESHOLDS.bundleSize.excellent) {
    log('  🚀 Excellent: Bundle size < 200KB', 'green');
  } else if (bundleSize < THRESHOLDS.bundleSize.good) {
    log('  ✅ Good: Bundle size < 500KB', 'green');
  } else if (bundleSize < THRESHOLDS.bundleSize.acceptable) {
    log('  ⚠️  Acceptable: Bundle size < 1MB', 'yellow');
  } else {
    log('  ❌ Poor: Bundle size > 1MB', 'red');
  }

  // Issues
  if (issues.length > 0) {
    log('\n⚠️  Issues Detected:', 'yellow');
    issues.forEach(issue => {
      const color = issue.severity === 'high' ? 'red' : issue.severity === 'medium' ? 'yellow' : 'cyan';
      log(`  ${issue.severity.toUpperCase()}: ${issue.message}`, color);
    });
  } else {
    log('\n✅ No performance issues detected!', 'green');
  }

  // Recommendations
  if (recommendations.length > 0) {
    log('\n💡 Recommendations:', 'blue');
    recommendations.forEach(rec => {
      log(`  • ${rec}`, 'cyan');
    });
  }

  // Top largest files
  if (bundleAnalysis.jsFiles.length > 0) {
    log('\n📊 Largest JavaScript Files:', 'blue');
    bundleAnalysis.jsFiles.slice(0, 5).forEach(file => {
      const color = file.size > THRESHOLDS.fileSize.jsError ? 'red' : 
                   file.size > THRESHOLDS.fileSize.jsWarning ? 'yellow' : 'green';
      log(`  ${file.path}: ${file.sizeKB} KB`, color);
    });
  }
}

/**
 * Save performance report
 */
function savePerformanceReport(report) {
  const reportPath = path.join(rootDir, 'performance-report.json');
  
  try {
    // Load existing reports
    let reports = [];
    if (fs.existsSync(reportPath)) {
      const existingData = fs.readFileSync(reportPath, 'utf8');
      reports = JSON.parse(existingData);
    }
    
    // Add new report
    reports.push(report);
    
    // Keep only last 10 reports
    if (reports.length > 10) {
      reports = reports.slice(-10);
    }
    
    // Save updated reports
    fs.writeFileSync(reportPath, JSON.stringify(reports, null, 2));
    log(`\n📄 Performance report saved to: ${reportPath}`, 'cyan');
  } catch (error) {
    log(`⚠️  Could not save performance report: ${error.message}`, 'yellow');
  }
}

/**
 * Utility functions
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function getDirSize(dirPath) {
  let totalSize = 0;
  try {
    const files = getAllFiles(dirPath);
    files.forEach(file => {
      totalSize += fs.statSync(file).size;
    });
  } catch (error) {
    // Ignore errors
  }
  return totalSize;
}

/**
 * Compare with previous reports
 */
function compareWithPrevious() {
  const reportPath = path.join(rootDir, 'performance-report.json');
  
  if (!fs.existsSync(reportPath)) {
    return null;
  }

  try {
    const reports = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    if (reports.length < 2) {
      return null;
    }

    const current = reports[reports.length - 1];
    const previous = reports[reports.length - 2];

    const comparison = {
      scoreDiff: current.score - previous.score,
      sizeDiff: current.bundleAnalysis.totalSize - previous.bundleAnalysis.totalSize,
      jsSizeDiff: current.bundleAnalysis.jsSize - previous.bundleAnalysis.jsSize,
      cssSizeDiff: current.bundleAnalysis.cssSize - previous.bundleAnalysis.cssSize,
    };

    log('\n📈 Comparison with Previous Build:', 'blue');
    log(`  Score: ${comparison.scoreDiff >= 0 ? '+' : ''}${comparison.scoreDiff}`, 
        comparison.scoreDiff >= 0 ? 'green' : 'red');
    log(`  Total Size: ${comparison.sizeDiff >= 0 ? '+' : ''}${(comparison.sizeDiff / 1024).toFixed(2)} KB`, 
        comparison.sizeDiff <= 0 ? 'green' : 'red');
    log(`  JS Size: ${comparison.jsSizeDiff >= 0 ? '+' : ''}${(comparison.jsSizeDiff / 1024).toFixed(2)} KB`, 
        comparison.jsSizeDiff <= 0 ? 'green' : 'red');
    log(`  CSS Size: ${comparison.cssSizeDiff >= 0 ? '+' : ''}${(comparison.cssSizeDiff / 1024).toFixed(2)} KB`, 
        comparison.cssSizeDiff <= 0 ? 'green' : 'red');

    return comparison;
  } catch (error) {
    log(`⚠️  Could not compare with previous report: ${error.message}`, 'yellow');
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const success = await monitorBuildPerformance();
    compareWithPrevious();
    
    if (success) {
      log('\n✅ Performance monitoring completed successfully!', 'green');
      process.exit(0);
    } else {
      log('\n❌ Performance monitoring detected issues!', 'red');
      process.exit(1);
    }
  } catch (error) {
    log(`❌ Performance monitoring failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { monitorBuildPerformance, THRESHOLDS };