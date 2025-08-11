#!/usr/bin/env node

/**
 * Appwrite Connectivity Test Script
 * Tests all major Appwrite features with the new configuration
 */

import { Client, Account, Databases, Storage } from 'appwrite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables manually
function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      if (line.trim().startsWith('#') || !line.trim()) return;
      
      const equalIndex = line.indexOf('=');
      if (equalIndex > 0) {
        const key = line.substring(0, equalIndex).trim();
        let value = line.substring(equalIndex + 1).trim();
        
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        process.env[key] = value;
      }
    });
  } catch (error) {
    console.warn(`Could not load env file ${filePath}:`, error.message);
  }
}

// Load .env file
loadEnvFile(path.join(__dirname, '..', '.env'));

// Appwrite configuration
const config = {
  endpoint: process.env.VITE_APPWRITE_ENDPOINT,
  projectId: process.env.VITE_APPWRITE_PROJECT_ID,
  databaseId: process.env.VITE_APPWRITE_DATABASE_ID,
  collections: {
    users: process.env.VITE_APPWRITE_USERS_COLLECTION_ID,
    resumes: process.env.VITE_APPWRITE_RESUMES_COLLECTION_ID,
    sessions: process.env.VITE_APPWRITE_SESSIONS_COLLECTION_ID,
    interactions: process.env.VITE_APPWRITE_INTERACTIONS_COLLECTION_ID,
    questions: process.env.VITE_APPWRITE_QUESTIONS_COLLECTION_ID
  },
  storage: {
    bucketId: process.env.VITE_APPWRITE_STORAGE_BUCKET_ID
  }
};

class ConnectivityTester {
  constructor() {
    this.client = new Client();
    this.client
      .setEndpoint(config.endpoint)
      .setProject(config.projectId);
    
    this.account = new Account(this.client);
    this.databases = new Databases(this.client);
    this.storage = new Storage(this.client);
    
    this.results = [];
  }

  log(test, status, message) {
    const result = { test, status, message, timestamp: new Date().toISOString() };
    this.results.push(result);
    
    const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${statusIcon} ${test}: ${message}`);
  }

  async testProjectConnection() {
    try {
      // Test basic project connectivity by trying to get account info
      // This will fail if not authenticated, but should not fail due to connection issues
      await this.account.get();
      this.log('Project Connection', 'PASS', 'Successfully connected to Appwrite project');
    } catch (error) {
      if (error.code === 401) {
        // Unauthorized is expected when not logged in - this means connection works
        this.log('Project Connection', 'PASS', 'Project connection verified (not authenticated, but reachable)');
      } else {
        this.log('Project Connection', 'FAIL', `Connection failed: ${error.message}`);
      }
    }
  }

  async testDatabaseConnection() {
    try {
      // Test database connectivity by trying to list documents from a collection
      // We'll try the users collection as it's likely to exist
      await this.databases.listDocuments(config.databaseId, config.collections.users, []);
      this.log('Database Connection', 'PASS', 'Database accessible and collections reachable');
      
      // Test each collection individually
      for (const [name, id] of Object.entries(config.collections)) {
        try {
          await this.databases.listDocuments(config.databaseId, id, []);
          this.log(`Collection ${name}`, 'PASS', `Collection ${id} accessible`);
        } catch (error) {
          if (error.code === 401) {
            this.log(`Collection ${name}`, 'PASS', `Collection ${id} exists (auth required)`);
          } else {
            this.log(`Collection ${name}`, 'FAIL', `Collection ${id} error: ${error.message}`);
          }
        }
      }
      
    } catch (error) {
      if (error.code === 401) {
        this.log('Database Connection', 'PASS', 'Database accessible (authentication required)');
      } else {
        this.log('Database Connection', 'FAIL', `Database connection failed: ${error.message}`);
      }
    }
  }

  async testStorageConnection() {
    try {
      // Test storage connectivity by trying to list files
      await this.storage.listFiles(config.storage.bucketId);
      this.log('Storage Connection', 'PASS', 'Storage bucket accessible');
    } catch (error) {
      if (error.code === 401) {
        this.log('Storage Connection', 'PASS', 'Storage bucket exists (authentication required)');
      } else {
        this.log('Storage Connection', 'FAIL', `Storage connection failed: ${error.message}`);
      }
    }
  }

  async testEnvironmentVariables() {
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

    requiredVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        this.log(`Environment Variable ${varName}`, 'PASS', `Set to: ${value}`);
      } else {
        this.log(`Environment Variable ${varName}`, 'FAIL', 'Not set or empty');
      }
    });
  }

  async runAllTests() {
    console.log('🧪 Starting Appwrite Connectivity Tests...\n');
    
    console.log('📋 Testing Environment Variables...');
    await this.testEnvironmentVariables();
    
    console.log('\n🔗 Testing Project Connection...');
    await this.testProjectConnection();
    
    console.log('\n🗄️  Testing Database Connection...');
    await this.testDatabaseConnection();
    
    console.log('\n📁 Testing Storage Connection...');
    await this.testStorageConnection();
    
    this.printSummary();
  }

  printSummary() {
    console.log('\n=== CONNECTIVITY TEST SUMMARY ===');
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARN').length;
    
    console.log(`Total tests: ${this.results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Warnings: ${warnings}`);
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`  - ${r.test}: ${r.message}`));
    }
    
    if (failed === 0) {
      console.log('\n✅ All connectivity tests passed!');
    }
    
    return failed === 0;
  }
}

// Run the tests
async function main() {
  const tester = new ConnectivityTester();
  const success = await tester.runAllTests();
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});