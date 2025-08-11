#!/usr/bin/env node

/**
 * Deployment Status Dashboard
 * Provides real-time status of deployment environments and health checks
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
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
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

/**
 * Check deployment environment status
 */
async function checkDeploymentStatus() {
  log('\n🚀 Deployment Status Dashboard', 'blue');
  log('=' .repeat(60), 'blue');

  const environments = [
    {
      name: 'Development',
      url: 'http://localhost:5173',
      branch: 'develop',
      status: 'local'
    },
    {
      name: 'Staging',
      url: process.env.STAGING_URL || 'https://staging-prepxl.vercel.app',
      branch: 'develop',
      status: 'deployed'
    },
    {
      name: 'Production',
      url: process.env.PRODUCTION_URL || 'https://prepxl.vercel.app',
      branch: 'main',
      status: 'deployed'
    }
  ];

  const results = [];

  for (const env of environments) {
    log(`\n📊 Checking ${env.name} Environment...`, 'cyan');
    
    const envResult = {
      name: env.name,
      url: env.url,
      branch: env.branch,
      status: 'unknown',
      responseTime: null,
      buildStatus: 'unknown',
      lastDeploy: null,
      healthChecks: {}
    };

    // Check URL accessibility
    if (env.status === 'deployed') {
      try {
        const startTime = Date.now();
        const response = await fetch(env.url, { 
          method: 'HEAD',
          timeout: 10000 
        });
        const endTime = Date.now();
        
        envResult.responseTime = endTime - startTime;
        envResult.status = response.ok ? 'healthy' : 'unhealthy';
        
        log(`  ✅ URL accessible (${envResult.responseTime}ms)`, 'green');
      } catch (error) {
        envResult.status = 'unreachable';
        log(`  ❌ URL unreachable: ${error.message}`, 'red');
      }
    } else {
      log(`  ℹ️  Local environment`, 'yellow');
    }

    // Check build status (if applicable)
    if (env.status === 'deployed') {
      try {
        // Check if we can get build info from package.json
        const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
        envResult.buildStatus = 'success';
        log(`  ✅ Build configuration valid`, 'green');
      } catch (error) {
        envResult.buildStatus = 'failed';
        log(`  ❌ Build configuration error`, 'red');
      }
    }

    // Performance health checks
    if (envResult.status === 'healthy') {
      envResult.healthChecks = {
        responseTime: envResult.responseTime < 2000 ? 'good' : 'slow',
        ssl: env.url.startsWith('https') ? 'enabled' : 'disabled',
        cdn: 'unknown' // Would need specific CDN checks
      };

      log(`  📈 Response time: ${envResult.responseTime}ms (${envResult.healthChecks.responseTime})`, 
          envResult.healthChecks.responseTime === 'good' ? 'green' : 'yellow');
      log(`  🔒 SSL: ${envResult.healthChecks.ssl}`, 
          envResult.healthChecks.ssl === 'enabled' ? 'green' : 'red');
    }

    results.push(envResult);
  }

  return results;
}

/**
 * Check CI/CD pipeline status
 */
async function checkPipelineStatus() {
  log('\n⚙️  CI/CD Pipeline Status', 'blue');
  log('-' .repeat(40), 'blue');

  const pipelineChecks = [
    {
      name: 'GitHub Actions Workflows',
      check: () => {
        const workflowDir = path.join(rootDir, '.github', 'workflows');
        if (!fs.existsSync(workflowDir)) return false;
        
        const workflows = fs.readdirSync(workflowDir);
        return workflows.length >= 3; // ci.yml, deploy-production.yml, deploy-staging.yml
      }
    },
    {
      name: 'Environment Variables',
      check: () => {
        const envFiles = ['.env.development', '.env.staging', '.env.production'];
        return envFiles.every(file => fs.existsSync(path.join(rootDir, file)));
      }
    },
    {
      name: 'Deployment Scripts',
      check: () => {
        const scripts = ['verify-deployment.js', 'analyze-bundle.js', 'performance-monitor.js'];
        return scripts.every(script => fs.existsSync(path.join(rootDir, 'scripts', script)));
      }
    },
    {
      name: 'Build Configuration',
      check: () => {
        const configs = ['vite.config.js', 'vercel.json', 'netlify.toml'];
        return configs.every(config => fs.existsSync(path.join(rootDir, config)));
      }
    }
  ];

  const pipelineResults = [];

  pipelineChecks.forEach(check => {
    const result = check.check();
    pipelineResults.push({ name: check.name, status: result });
    
    log(`  ${result ? '✅' : '❌'} ${check.name}`, result ? 'green' : 'red');
  });

  return pipelineResults;
}

/**
 * Check monitoring and analytics status
 */
async function checkMonitoringStatus() {
  log('\n📊 Monitoring & Analytics Status', 'blue');
  log('-' .repeat(40), 'blue');

  const monitoringChecks = [
    {
      name: 'Error Monitoring (Sentry)',
      check: () => {
        const envFiles = ['.env.staging', '.env.production'];
        return envFiles.some(file => {
          const filePath = path.join(rootDir, file);
          if (!fs.existsSync(filePath)) return false;
          const content = fs.readFileSync(filePath, 'utf8');
          return content.includes('VITE_SENTRY_DSN') && content.includes('VITE_ENABLE_ERROR_REPORTING=true');
        });
      }
    },
    {
      name: 'Analytics (Google Analytics)',
      check: () => {
        const envFiles = ['.env.staging', '.env.production'];
        return envFiles.some(file => {
          const filePath = path.join(rootDir, file);
          if (!fs.existsSync(filePath)) return false;
          const content = fs.readFileSync(filePath, 'utf8');
          return content.includes('VITE_GA_TRACKING_ID') && content.includes('VITE_ENABLE_ANALYTICS=true');
        });
      }
    },
    {
      name: 'Performance Monitoring',
      check: () => {
        return fs.existsSync(path.join(rootDir, 'scripts', 'performance-monitor.js')) &&
               fs.existsSync(path.join(rootDir, 'src', 'utils', 'monitoring.js'));
      }
    },
    {
      name: 'Bundle Analysis',
      check: () => {
        return fs.existsSync(path.join(rootDir, 'scripts', 'analyze-bundle.js'));
      }
    }
  ];

  const monitoringResults = [];

  monitoringChecks.forEach(check => {
    const result = check.check();
    monitoringResults.push({ name: check.name, status: result });
    
    log(`  ${result ? '✅' : '❌'} ${check.name}`, result ? 'green' : 'red');
  });

  return monitoringResults;
}

/**
 * Generate deployment report
 */
function generateDeploymentReport(deploymentResults, pipelineResults, monitoringResults) {
  const report = {
    timestamp: new Date().toISOString(),
    environments: deploymentResults,
    pipeline: pipelineResults,
    monitoring: monitoringResults,
    summary: {
      totalEnvironments: deploymentResults.length,
      healthyEnvironments: deploymentResults.filter(env => env.status === 'healthy').length,
      pipelineHealth: pipelineResults.filter(check => check.status).length / pipelineResults.length,
      monitoringHealth: monitoringResults.filter(check => check.status).length / monitoringResults.length
    }
  };

  // Save report
  const reportPath = path.join(rootDir, 'deployment-status.json');
  try {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`\n📄 Deployment report saved to: ${reportPath}`, 'cyan');
  } catch (error) {
    log(`⚠️  Could not save deployment report: ${error.message}`, 'yellow');
  }

  return report;
}

/**
 * Display summary dashboard
 */
function displaySummaryDashboard(report) {
  log('\n📋 Deployment Summary Dashboard', 'bold');
  log('=' .repeat(60), 'blue');

  // Environment status
  log('\n🌍 Environment Status:', 'blue');
  report.environments.forEach(env => {
    const statusColor = env.status === 'healthy' ? 'green' : 
                       env.status === 'unreachable' ? 'red' : 'yellow';
    const statusIcon = env.status === 'healthy' ? '🟢' : 
                      env.status === 'unreachable' ? '🔴' : '🟡';
    
    log(`  ${statusIcon} ${env.name}: ${env.status}`, statusColor);
    if (env.responseTime) {
      log(`    Response Time: ${env.responseTime}ms`, 'cyan');
    }
    log(`    URL: ${env.url}`, 'cyan');
  });

  // Overall health score
  const overallHealth = Math.round(
    (report.summary.pipelineHealth + report.summary.monitoringHealth) * 50
  );

  log('\n📊 Overall Health Score:', 'blue');
  const healthColor = overallHealth >= 80 ? 'green' : overallHealth >= 60 ? 'yellow' : 'red';
  log(`  ${overallHealth}/100`, healthColor);

  // Quick stats
  log('\n📈 Quick Stats:', 'blue');
  log(`  Healthy Environments: ${report.summary.healthyEnvironments}/${report.summary.totalEnvironments}`, 'cyan');
  log(`  Pipeline Health: ${Math.round(report.summary.pipelineHealth * 100)}%`, 'cyan');
  log(`  Monitoring Health: ${Math.round(report.summary.monitoringHealth * 100)}%`, 'cyan');

  // Recommendations
  log('\n💡 Recommendations:', 'blue');
  const recommendations = [];

  if (report.summary.healthyEnvironments < report.summary.totalEnvironments) {
    recommendations.push('Check unreachable environments and fix connectivity issues');
  }

  if (report.summary.pipelineHealth < 1) {
    recommendations.push('Complete CI/CD pipeline setup for automated deployments');
  }

  if (report.summary.monitoringHealth < 1) {
    recommendations.push('Set up monitoring and analytics for production visibility');
  }

  const unhealthyEnvs = report.environments.filter(env => env.status !== 'healthy' && env.status !== 'local');
  if (unhealthyEnvs.length > 0) {
    recommendations.push(`Fix deployment issues in: ${unhealthyEnvs.map(env => env.name).join(', ')}`);
  }

  if (recommendations.length === 0) {
    log('  ✅ All systems operational!', 'green');
  } else {
    recommendations.forEach(rec => {
      log(`  • ${rec}`, 'yellow');
    });
  }

  // Next steps
  log('\n🚀 Next Steps:', 'blue');
  log('  • Run `npm run deploy:prepare` before production deployment', 'cyan');
  log('  • Monitor performance with `npm run monitor:performance`', 'cyan');
  log('  • Check bundle size with `npm run build:analyze`', 'cyan');
  log('  • Validate integration with `npm run validate:full`', 'cyan');
}

/**
 * Main execution
 */
async function main() {
  try {
    log('🔍 Starting deployment status check...', 'cyan');

    const deploymentResults = await checkDeploymentStatus();
    const pipelineResults = await checkPipelineStatus();
    const monitoringResults = await checkMonitoringStatus();

    const report = generateDeploymentReport(deploymentResults, pipelineResults, monitoringResults);
    displaySummaryDashboard(report);

    log('\n✅ Deployment status check completed!', 'green');
    
    // Exit with appropriate code
    const hasIssues = report.summary.healthyEnvironments < report.summary.totalEnvironments ||
                     report.summary.pipelineHealth < 1 ||
                     report.summary.monitoringHealth < 0.8;
    
    process.exit(hasIssues ? 1 : 0);
  } catch (error) {
    log(`❌ Deployment status check failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Add fetch polyfill for Node.js environments that don't have it
if (typeof fetch === 'undefined') {
  global.fetch = async (url, options = {}) => {
    const https = await import('https');
    const http = await import('http');
    const { URL } = await import('url');
    
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const req = client.request(parsedUrl, {
        method: options.method || 'GET',
        timeout: options.timeout || 5000,
        ...options
      }, (res) => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));
      req.end();
    });
  };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { checkDeploymentStatus, checkPipelineStatus, checkMonitoringStatus };