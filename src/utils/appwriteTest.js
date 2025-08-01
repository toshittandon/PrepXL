/**
 * Simple Appwrite connection test utility
 */
import { account } from '../services/appwrite/config.js';

export const testAppwriteConnection = async () => {
  try {
    console.log('Testing Appwrite connection...');
    console.log('Endpoint:', import.meta.env.VITE_APPWRITE_ENDPOINT);
    console.log('Project ID:', import.meta.env.VITE_APPWRITE_PROJECT_ID);
    
    // Try to get current session (this will fail if not authenticated, but won't throw network errors)
    try {
      const session = await account.getSession('current');
      console.log('✅ Already authenticated:', session);
      return { success: true, authenticated: true, session };
    } catch (sessionError) {
      console.log('ℹ️ Not authenticated (expected):', sessionError.message);
      
      // Try to get account info (this should work even without authentication for connection test)
      try {
        await account.get();
        console.log('✅ Connection successful, but not authenticated');
        return { success: true, authenticated: false };
      } catch (accountError) {
        if (accountError.code === 401) {
          console.log('✅ Connection successful, authentication required (expected)');
          return { success: true, authenticated: false };
        } else {
          throw accountError;
        }
      }
    }
  } catch (error) {
    console.error('❌ Appwrite connection failed:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code,
      type: error.type 
    };
  }
};

export const testAppwriteAuth = async (email = 'test@example.com', password = 'testpassword123') => {
  try {
    console.log('Testing Appwrite authentication...');
    
    // Try to create a test account first
    try {
      const user = await account.create('unique()', email, password, 'Test User');
      console.log('✅ Test account created:', user);
    } catch (createError) {
      if (createError.code === 409) {
        console.log('ℹ️ Test account already exists (expected)');
      } else {
        console.warn('⚠️ Could not create test account:', createError.message);
      }
    }
    
    // Try to login
    try {
      const session = await account.createEmailPasswordSession(email, password);
      console.log('✅ Login successful:', session);
      
      // Try to get user info
      const user = await account.get();
      console.log('✅ User info retrieved:', user);
      
      // Logout
      await account.deleteSession('current');
      console.log('✅ Logout successful');
      
      return { success: true, message: 'Authentication test passed' };
    } catch (loginError) {
      console.error('❌ Login failed:', loginError);
      return { 
        success: false, 
        error: loginError.message,
        code: loginError.code,
        type: loginError.type 
      };
    }
  } catch (error) {
    console.error('❌ Authentication test failed:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code,
      type: error.type 
    };
  }
};