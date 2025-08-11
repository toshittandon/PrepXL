#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Enhanced bundle analyzer with detailed reporting and optimization suggestions
 */
function analyzeBundleSize() {
  const distPath = path.join(process.cwd(), 'dist');
  
  if (!fs.existsSync(distPath)) {
    console.error('❌ Build directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  console.log('📊 Enhanced Bundle Analysis Report\n');
  console.log('=' .repeat(60));

  // Analyze all files recursively
  const allFiles = getAllFiles(distPath);
  const analysis = analyzeFiles(allFiles, distPath);

  // Display results
  displayJavaScriptAnalysis(analysis.js);
  displayCSSAnalysis(analysis.css);
  displayAssetAnalysis(analysis.assets);
  displaySummary(analysis);
  displayRecommendations(analysis);
  displayPerformanceScore(analysis);
  
  // Generate JSON report
  generateJSONReport(analysis);
}

/**
 * Get all files recursively from directory
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

/**
 * Analyze files by type
 */
function analyzeFiles(files, basePath) {
  const analysis = {
    js: [],
    css: [],
    assets: [],
    total: {
      jsSize: 0,
      cssSize: 0,
      assetSize: 0,
      fileCount: 0
    }
  };

  files.forEach(filePath => {
    const stats = fs.statSync(filePath);
    const relativePath = path.relative(basePath, filePath);
    const ext = path.extname(filePath).toLowerCase();
    const size = stats.size;
    
    const fileInfo = {
      path: relativePath,
      size: size,
      sizeKB: (size / 1024).toFixed(2),
      sizeMB: (size / (1024 * 1024)).toFixed(3),
      gzipEstimate: Math.round(size * 0.3), // Rough gzip estimate
    };

    if (ext === '.js') {
      analysis.js.push({
        ...fileInfo,
        type: getJSFileType(relativePath),
        isVendor: relativePath.includes('vendor'),
        isChunk: relativePath.includes('chunk') || relativePath.includes('-'),
      });
      analysis.total.jsSize += size;
    } else if (ext === '.css') {
      analysis.css.push(fileInfo);
      analysis.total.cssSize += size;
    } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'].includes(ext)) {
      analysis.assets.push({
        ...fileInfo,
        type: ext.substring(1),
      });
      analysis.total.assetSize += size;
    }
    
    analysis.total.fileCount++;
  });

  // Sort by size (largest first)
  analysis.js.sort((a, b) => b.size - a.size);
  analysis.css.sort((a, b) => b.size - a.size);
  analysis.assets.sort((a, b) => b.size - a.size);

  return analysis;
}

/**
 * Determine JavaScript file type
 */
function getJSFileType(filePath) {
  if (filePath.includes('vendor')) return 'vendor';
  if (filePath.includes('react')) return 'react';
  if (filePath.includes('redux')) return 'redux';
  if (filePath.includes('router')) return 'router';
  if (filePath.includes('admin')) return 'admin';
  if (filePath.includes('interview')) return 'interview';
  if (filePath.includes('resume')) return 'resume';
  if (filePath.includes('library')) return 'library';
  if (filePath.includes('auth')) return 'auth';
  if (filePath.includes('chunk')) return 'chunk';
  return 'main';
}

/**
 * Display JavaScript analysis
 */
function displayJavaScriptAnalysis(jsFiles) {
  console.log('\n🟨 JavaScript Files Analysis:');
  console.log('-'.repeat(60));
  
  if (jsFiles.length === 0) {
    console.log('  No JavaScript files found');
    return;
  }

  jsFiles.forEach(file => {
    let status = '✅';
    if (file.size > 100 * 1024) status = '⚠️ '; // > 100KB
    if (file.size > 250 * 1024) status = '❌'; // > 250KB
    
    console.log(`  ${status} ${file.path}`);
    console.log(`      Size: ${file.sizeKB} KB (${file.sizeMB} MB)`);
    console.log(`      Type: ${file.type}`);
    console.log(`      Gzip Est: ~${(file.gzipEstimate / 1024).toFixed(2)} KB`);
    console.log('');
  });
}

/**
 * Display CSS analysis
 */
function displayCSSAnalysis(cssFiles) {
  console.log('\n🟩 CSS Files Analysis:');
  console.log('-'.repeat(60));
  
  if (cssFiles.length === 0) {
    console.log('  No CSS files found');
    return;
  }

  cssFiles.forEach(file => {
    let status = '✅';
    if (file.size > 50 * 1024) status = '⚠️ '; // > 50KB
    if (file.size > 100 * 1024) status = '❌'; // > 100KB
    
    console.log(`  ${status} ${file.path}`);
    console.log(`      Size: ${file.sizeKB} KB`);
    console.log(`      Gzip Est: ~${(file.gzipEstimate / 1024).toFixed(2)} KB`);
    console.log('');
  });
}

/**
 * Display asset analysis
 */
function displayAssetAnalysis(assetFiles) {
  console.log('\n🖼️  Asset Files Analysis:');
  console.log('-'.repeat(60));
  
  if (assetFiles.length === 0) {
    console.log('  No asset files found');
    return;
  }

  const assetsByType = assetFiles.reduce((acc, file) => {
    if (!acc[file.type]) acc[file.type] = [];
    acc[file.type].push(file);
    return acc;
  }, {});

  Object.entries(assetsByType).forEach(([type, files]) => {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    console.log(`  📁 ${type.toUpperCase()} files (${files.length}): ${(totalSize / 1024).toFixed(2)} KB`);
    
    files.slice(0, 5).forEach(file => { // Show top 5 largest
      console.log(`      ${file.path}: ${file.sizeKB} KB`);
    });
    
    if (files.length > 5) {
      console.log(`      ... and ${files.length - 5} more files`);
    }
    console.log('');
  });
}

/**
 * Display summary
 */
function displaySummary(analysis) {
  console.log('\n📈 Bundle Summary:');
  console.log('-'.repeat(60));
  
  const total = analysis.total;
  const totalSize = total.jsSize + total.cssSize + total.assetSize;
  
  console.log(`  📦 Total Files: ${total.fileCount}`);
  console.log(`  🟨 JavaScript: ${(total.jsSize / 1024).toFixed(2)} KB (${analysis.js.length} files)`);
  console.log(`  🟩 CSS: ${(total.cssSize / 1024).toFixed(2)} KB (${analysis.css.length} files)`);
  console.log(`  🖼️  Assets: ${(total.assetSize / 1024).toFixed(2)} KB (${analysis.assets.length} files)`);
  console.log(`  📊 Total Bundle: ${(totalSize / 1024).toFixed(2)} KB (${(totalSize / (1024 * 1024)).toFixed(3)} MB)`);
  
  // Gzip estimates
  const gzipEstimate = totalSize * 0.3;
  console.log(`  🗜️  Estimated Gzipped: ~${(gzipEstimate / 1024).toFixed(2)} KB`);
}

/**
 * Display recommendations
 */
function displayRecommendations(analysis) {
  console.log('\n💡 Optimization Recommendations:');
  console.log('-'.repeat(60));
  
  const recommendations = [];
  const total = analysis.total;
  
  // JavaScript recommendations
  if (total.jsSize > 500 * 1024) {
    recommendations.push('🟨 Large JavaScript bundle detected (> 500KB):');
    recommendations.push('   • Implement more aggressive code splitting');
    recommendations.push('   • Use dynamic imports for heavy components');
    recommendations.push('   • Consider lazy loading admin and less-used features');
  }
  
  // Check for large individual JS files
  const largeJSFiles = analysis.js.filter(file => file.size > 200 * 1024);
  if (largeJSFiles.length > 0) {
    recommendations.push('🟨 Large individual JavaScript files detected:');
    largeJSFiles.forEach(file => {
      recommendations.push(`   • ${file.path} (${file.sizeKB} KB) - Consider splitting`);
    });
  }
  
  // CSS recommendations
  if (total.cssSize > 100 * 1024) {
    recommendations.push('🟩 Large CSS bundle detected (> 100KB):');
    recommendations.push('   • Enable CSS purging in production');
    recommendations.push('   • Consider CSS-in-JS for component-specific styles');
    recommendations.push('   • Implement CSS code splitting');
  }
  
  // Asset recommendations
  const largeAssets = analysis.assets.filter(file => file.size > 100 * 1024);
  if (largeAssets.length > 0) {
    recommendations.push('🖼️  Large asset files detected:');
    largeAssets.forEach(file => {
      recommendations.push(`   • ${file.path} (${file.sizeKB} KB) - Consider optimization`);
    });
  }
  
  // Chunk recommendations
  const jsChunkCount = analysis.js.length;
  if (jsChunkCount > 15) {
    recommendations.push('📦 Many JavaScript chunks detected:');
    recommendations.push('   • Consider consolidating smaller chunks');
    recommendations.push('   • Review chunk splitting strategy');
  } else if (jsChunkCount < 3) {
    recommendations.push('📦 Few JavaScript chunks detected:');
    recommendations.push('   • Consider more code splitting for better caching');
    recommendations.push('   • Separate vendor and application code');
  }
  
  if (recommendations.length === 0) {
    console.log('  ✅ Bundle is well optimized! No major issues detected.');
  } else {
    recommendations.forEach(rec => console.log(`  ${rec}`));
  }
}

/**
 * Display performance score
 */
function displayPerformanceScore(analysis) {
  console.log('\n🎯 Performance Score:');
  console.log('-'.repeat(60));
  
  const total = analysis.total;
  const totalSize = total.jsSize + total.cssSize;
  let score = 100;
  let grade = 'A+';
  
  // Deduct points for large bundles
  if (totalSize > 200 * 1024) score -= 10; // > 200KB
  if (totalSize > 500 * 1024) score -= 20; // > 500KB
  if (totalSize > 1000 * 1024) score -= 30; // > 1MB
  
  // Deduct points for large individual files
  const largeFiles = [...analysis.js, ...analysis.css].filter(file => file.size > 200 * 1024);
  score -= largeFiles.length * 5;
  
  // Deduct points for too many chunks
  if (analysis.js.length > 15) score -= 10;
  if (analysis.js.length < 3) score -= 5;
  
  // Determine grade
  if (score >= 90) grade = 'A+';
  else if (score >= 80) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 60) grade = 'C';
  else grade = 'D';
  
  console.log(`  📊 Score: ${Math.max(0, score)}/100 (${grade})`);
  
  // Performance thresholds
  if (totalSize < 200 * 1024) {
    console.log('  🚀 Excellent: Bundle size < 200KB');
  } else if (totalSize < 500 * 1024) {
    console.log('  ✅ Good: Bundle size < 500KB');
  } else if (totalSize < 1000 * 1024) {
    console.log('  ⚠️  Acceptable: Bundle size < 1MB');
  } else {
    console.log('  ❌ Poor: Bundle size > 1MB - optimization needed');
  }
  
  console.log('\n🔍 For detailed Vite bundle analysis, run: npm run build:report');
}

/**
 * Generate JSON report
 */
function generateJSONReport(analysis) {
  const reportPath = path.join(process.cwd(), 'bundle-analysis.json');
  const report = {
    timestamp: new Date().toISOString(),
    summary: analysis.total,
    files: {
      javascript: analysis.js,
      css: analysis.css,
      assets: analysis.assets
    },
    recommendations: generateRecommendationsList(analysis)
  };
  
  try {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed JSON report saved to: ${reportPath}`);
  } catch (error) {
    console.warn(`⚠️  Could not save JSON report: ${error.message}`);
  }
}

/**
 * Generate recommendations list
 */
function generateRecommendationsList(analysis) {
  const recommendations = [];
  const total = analysis.total;
  
  if (total.jsSize > 500 * 1024) {
    recommendations.push({
      type: 'javascript',
      severity: 'high',
      message: 'Large JavaScript bundle detected',
      suggestion: 'Implement code splitting and lazy loading'
    });
  }
  
  if (total.cssSize > 100 * 1024) {
    recommendations.push({
      type: 'css',
      severity: 'medium',
      message: 'Large CSS bundle detected',
      suggestion: 'Enable CSS purging and consider CSS-in-JS'
    });
  }
  
  const largeFiles = [...analysis.js, ...analysis.css].filter(file => file.size > 200 * 1024);
  largeFiles.forEach(file => {
    recommendations.push({
      type: 'file',
      severity: 'medium',
      message: `Large file: ${file.path}`,
      suggestion: 'Consider splitting or optimizing this file'
    });
  });
  
  return recommendations;
}

// Run the analysis
analyzeBundleSize();

export { analyzeBundleSize };