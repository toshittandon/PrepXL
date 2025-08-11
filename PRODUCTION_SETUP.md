# Production Setup Guide

This document outlines the changes made to remove development tools and mock environments, and how to connect the application to a real Appwrite backend.

## Changes Made

### 🗑️ Removed Development Tools

1. **Debug Components Removed:**
   - `src/components/debug/AuthStatus.jsx`
   - `src/components/debug/MockAuthControls.jsx`
   - `src/components/debug/UploadDebug.jsx`
   - `src/components/debug/ErrorHandlingTest.jsx`
   - Entire `src/components/debug/` directory

2. **Mock Authentication Removed:**
   - `src/utils/mockAuth.js` - Complete mock authentication system
   - Development mode fallbacks in `src/services/appwrite/auth.js`
   - Mock user creation and session management

3. **Development UI Removed:**
   - Development mode quick login buttons from Login page
   - Debug panels and auth status displays
   - Mock authentication controls

### ⚙️ Environment Configuration Updated

1. **Production Environment:**
   - `VITE_APP_ENVIRONMENT=production`
   - `VITE_ENABLE_DEBUG_TOOLS=false`
   - `VITE_MOCK_AI_RESPONSES=false`
   - `VITE_MOCK_AUTH=false`
   - `VITE_LOG_LEVEL=warn`

2. **Appwrite Configuration:**
   - Updated to use placeholder values that need to be replaced
   - Removed hardcoded development project IDs
   - Clean collection and bucket ID structure

### 🔧 Code Cleanup

1. **Authentication Service:**
   - Removed all development mode checks
   - Direct connection to Appwrite only
   - No more mock user creation or session management

2. **App.jsx:**
   - Removed debug component imports and rendering
   - Clean production-ready routing

3. **Login Component:**
   - Removed development mode UI helpers
   - Clean authentication form only

## Next Steps

### 1. Set Up Appwrite Project

Follow the detailed instructions in `APPWRITE_SETUP.md` to:
- Create an Appwrite project
- Set up database and collections
- Configure storage bucket
- Set up authentication providers

### 2. Update Environment Variables

Replace the placeholder values in `.env` with your actual Appwrite project details:

```env
# Replace these with your actual values
VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=68989b9a002cd7dd5c63
VITE_APPWRITE_DATABASE_ID=68989eb20006e65fe65f
```

### 3. Test the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Try to register a new user
3. Test login functionality
4. Verify data is being saved to Appwrite
5. Test file upload functionality

### 4. Create Admin User

1. Register through the application
2. In Appwrite Console, find your user in the Users collection
3. Set `isAdmin: true` for admin access

## Verification

The application includes a system verification utility that will check:
- Mock environments are disabled
- Required environment variables are set
- AI API configuration
- File upload system functionality

Run verification in the browser console:
```javascript
// Import and run verification
import { runSystemVerification } from './src/utils/systemVerification.js'
runSystemVerification()
```

## Production Deployment

When ready for production:

1. **Environment Setup:**
   - Create production Appwrite project
   - Update environment variables
   - Enable error reporting and analytics

2. **Security:**
   - Review collection permissions
   - Enable file security
   - Set up proper CORS settings

3. **Monitoring:**
   - Configure error logging
   - Set up performance monitoring
   - Enable analytics if desired

## Troubleshooting

### Common Issues:

1. **"Project not found" errors:**
   - Verify `VITE_APPWRITE_PROJECT_ID` is correct
   - Check Appwrite endpoint URL

2. **Permission denied errors:**
   - Review collection permissions in Appwrite Console
   - Ensure user authentication is working

3. **File upload failures:**
   - Check storage bucket permissions
   - Verify file size and type restrictions

### Debug Steps:

1. Check browser console for detailed errors
2. Verify environment variables are loaded: `console.log(import.meta.env)`
3. Check Appwrite Console logs
4. Run system verification utility

## Support

- See `APPWRITE_SETUP.md` for detailed Appwrite configuration
- Check `ERROR_HANDLING.md` for error troubleshooting
- Review `DEPLOYMENT.md` for production deployment guide

## Rollback (If Needed)

If you need to temporarily rollback to development mode:

1. Set `VITE_APP_ENVIRONMENT=development` in `.env`
2. Set `VITE_ENABLE_DEBUG_TOOLS=true`
3. The application will show helpful development messages

However, the mock authentication system has been completely removed and cannot be restored without reverting the code changes.