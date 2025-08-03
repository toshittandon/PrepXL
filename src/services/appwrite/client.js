/**
 * Appwrite client configuration and initialization
 */

import { Client, Account, Databases, Storage, Teams } from 'appwrite'
import { getConfig } from '../../utils/envConfig.js'

// Get configuration
const config = getConfig()

// Initialize Appwrite client
export const client = new Client()

// Configure client
client
  .setEndpoint(config.appwrite.endpoint)
  .setProject(config.appwrite.projectId)

// Initialize services
export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)
export const teams = new Teams(client)

// Export configuration for use in services
export const appwriteConfig = {
  databaseId: config.appwrite.databaseId,
  collections: config.appwrite.collections,
  storage: config.appwrite.storage,
}

// Client health check
export const checkClientHealth = async () => {
  try {
    const health = await client.call('get', '/health')
    return { status: 'healthy', data: health }
  } catch (error) {
    console.error('Appwrite client health check failed:', error)
    return { status: 'unhealthy', error: error.message }
  }
}

// Initialize client with error handling
export const initializeClient = async () => {
  try {
    // Validate configuration
    if (!config.appwrite.endpoint || !config.appwrite.projectId) {
      throw new Error('Missing required Appwrite configuration')
    }

    // Check client health
    const health = await checkClientHealth()
    
    if (health.status === 'healthy') {
      console.log('✅ Appwrite client initialized successfully')
      return true
    } else {
      console.error('❌ Appwrite client health check failed:', health.error)
      return false
    }
  } catch (error) {
    console.error('❌ Failed to initialize Appwrite client:', error)
    return false
  }
}

export default client