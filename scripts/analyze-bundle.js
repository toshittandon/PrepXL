#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Simple bundle analyzer to check file sizes and provide recommendations
 */
function analyzeBundleSize() {
  const distPath = path.join(process.cwd(), 'dist');
  
  if (!fs.existsSync(distPath)) {
    console.error('❌ Build directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  console.log('📊 Bundle Analysis Report\n');

  // Analyze JavaScript files
  const jsPath = path.join(distPath, 'js');
  const assetsPath = path.join(distPath, 'assets');
  
  let totalJSSize = 0;
  let totalCSSSize = 0;
  let chunkCount = 0;

  // Check JS directory
  if (fs.existsSync(jsPath)) {
    const jsFiles = fs.readdirSync(jsPath).filter(file => file.endsWith('.js'));
    
    console.log('🟨 JavaScript Chunks:');
    jsFiles.forEach(file => {
      const filePath = path.join(jsPath, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      totalJSSize += stats.size;
      chunkCount++;
      
      let status = '✅';
      if (stats.size > 100 * 1024) status = '⚠️'; // > 100KB
      if (stats.size > 250 * 1024) status = '❌'; // > 250KB
      
      console.log(`  ${status} ${file}: ${sizeKB} KB`);
    });
  }

  // Check assets directory for main bundle
  if (fs.existsSync(assetsPath)) {
    const assetFiles = fs.readdirSync(assetsPath);
    
    const jsAssets = assetFiles.filter(file => file.endsWith('.js'));
    const cssAssets = assetFiles.filter(file => file.endsWith('.css'));
    
    if (jsAssets.length > 0) {
      console.log('\n🟦 Main Assets:');
      jsAssets.forEach(file => {
        const filePath = path.join(assetsPath, file);
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        totalJSSize += stats.size;
        
        let status = '✅';
        if (stats.size > 200 * 1024) status = '⚠️'; // > 200KB
        if (stats.size > 500 * 1024) status = '❌'; // > 500KB
        
        console.log(`  ${status} ${file}: ${sizeKB} KB`);
      });
    }

    if (cssAssets.length > 0) {
      console.log('\n🟩 CSS Assets:');
      cssAssets.forEach(file => {
        const filePath = path.join(assetsPath, file);
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        totalCSSSize += stats.size;
        
        let status = '✅';
        if (stats.size > 50 * 1024) status = '⚠️'; // > 50KB
        if (stats.size > 100 * 1024) status = '❌'; // > 100KB
        
        console.log(`  ${status} ${file}: ${sizeKB} KB`);
      });
    }
  }

  // Summary
  console.log('\n📈 Summary:');
  console.log(`  Total JS Size: ${(totalJSSize / 1024).toFixed(2)} KB`);
  console.log(`  Total CSS Size: ${(totalCSSSize / 1024).toFixed(2)} KB`);
  console.log(`  Total Chunks: ${chunkCount}`);
  console.log(`  Total Bundle Size: ${((totalJSSize + totalCSSSize) / 1024).toFixed(2)} KB`);

  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (totalJSSize > 500 * 1024) {
    console.log('  ⚠️  Large JS bundle detected. Consider:');
    console.log('     - More aggressive code splitting');
    console.log('     - Lazy loading more components');
    console.log('     - Tree shaking unused dependencies');
  } else {
    console.log('  ✅ JS bundle size is reasonable');
  }

  if (totalCSSSize > 100 * 1024) {
    console.log('  ⚠️  Large CSS bundle detected. Consider:');
    console.log('     - Purging unused CSS');
    console.log('     - CSS code splitting');
  } else {
    console.log('  ✅ CSS bundle size is reasonable');
  }

  if (chunkCount > 20) {
    console.log('  ⚠️  Many chunks detected. Consider consolidating some chunks');
  } else if (chunkCount < 5) {
    console.log('  ⚠️  Few chunks detected. Consider more code splitting for better caching');
  } else {
    console.log('  ✅ Good chunk distribution');
  }

  // Performance thresholds
  const totalSize = totalJSSize + totalCSSSize;
  console.log('\n🎯 Performance Thresholds:');
  
  if (totalSize < 200 * 1024) {
    console.log('  🚀 Excellent: < 200KB total');
  } else if (totalSize < 500 * 1024) {
    console.log('  ✅ Good: < 500KB total');
  } else if (totalSize < 1000 * 1024) {
    console.log('  ⚠️  Acceptable: < 1MB total');
  } else {
    console.log('  ❌ Poor: > 1MB total - optimization needed');
  }

  console.log('\n🔍 For detailed analysis, run: npm run build:report');
}

// Run the analysis
analyzeBundleSize();

export { analyzeBundleSize };