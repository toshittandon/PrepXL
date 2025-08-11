# Authentication & Connection Troubleshooting Guide

## Common Issues and Solutions

### 1. 401 Unauthorized Errors

**Symptoms:**
- "Authentication required. Please log in again." errors
- Resume upload fails with 401 status
- User gets logged out unexpectedly

**Solutions:**
1. **Clear browser storage:**
   ```javascript
   // In browser console
   clearAuthStorage()
   ```

2. **Check authentication state:**
   ```javascript
   // In browser console
   debugAuth()
   ```

3. **Verify environment variables:**
   - Check that all VITE_APPWRITE_* variables are set in .env
   - Ensure VITE_APPWRITE_ENDPOINT is correct
   - Verify VITE_APPWRITE_PROJECT_ID matches your Appwrite project

### 2. WebSocket Connection Errors

**Symptoms:**
- "WebSocket connection to 'ws://localhost:3001/' failed" errors
- Hot module replacement not working
- Development server connection issues

**Solutions:**
1. **Restart development server:**
   ```bash
   npm run dev
   ```

2. **Check port availability:**
   ```bash
   netstat -an | grep 3001
   ```

3. **Clear browser cache and reload**

### 3. Session Conflicts

**Symptoms:**
- "Session already exists" errors
- Unable to log in after logout
- Multiple session warnings

**Solutions:**
1. **Use session recovery:**
   - The app will automatically show a session recovery dialog
   - Click "Try Recovery Again" or "Go to Login Page"

2. **Manual session clear:**
   - Log out from all devices in user settings
   - Clear browser storage
   - Log in again

### 4. Development Environment Issues

**Debug Commands:**
```bash
# Check authentication state
npm run debug:auth

# Check storage state  
npm run debug:storage

# Clear authentication storage
npm run clear:auth
```

**Browser Console Commands:**
```javascript
// Debug authentication
debugAuth()

// Debug storage
debugStorage()

// Clear auth storage
clearAuthStorage()
```

### 5. Environment Configuration

**Required Environment Variables:**
```env
VITE_APPWRITE_ENDPOINT=https://your-appwrite-endpoint
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_DATABASE_ID=your-database-id
VITE_APPWRITE_COLLECTION_USERS=your-users-collection-id
VITE_APPWRITE_COLLECTION_RESUMES=your-resumes-collection-id
VITE_APPWRITE_BUCKET_ID=your-storage-bucket-id
```

### 6. Network Issues

**Check connectivity:**
1. Verify internet connection
2. Check if Appwrite server is accessible
3. Verify firewall settings
4. Check proxy configuration

### 7. Browser-Specific Issues

**Chrome/Edge:**
- Clear site data: Settings > Privacy > Site Settings > View permissions and data stored across sites
- Disable extensions temporarily
- Try incognito mode

**Firefox:**
- Clear cookies and site data
- Check tracking protection settings
- Try private browsing

### 8. Getting Help

If issues persist:
1. Check browser console for detailed error messages
2. Run the debug commands listed above
3. Check network tab for failed requests
4. Verify Appwrite server status
5. Contact support with debug information

## Prevention Tips

1. **Regular maintenance:**
   - Clear browser cache weekly
   - Update dependencies regularly
   - Monitor error logs

2. **Development best practices:**
   - Use environment variables properly
   - Handle authentication errors gracefully
   - Implement proper session management

3. **Testing:**
   - Test authentication flows regularly
   - Verify file upload functionality
   - Check session persistence
