# Appwrite Setup Guide

This guide will help you set up Appwrite for the PrepXL application.

## Prerequisites

- An Appwrite Cloud account (https://cloud.appwrite.io) or self-hosted Appwrite instance
- Admin access to create projects, databases, and collections

## Step 1: Create Appwrite Project

1. Go to [Appwrite Cloud Console](https://cloud.appwrite.io)
2. Sign in or create an account
3. Click "Create Project"
4. Enter project name: "PrepXL"
5. Copy your **Project ID** - you'll need this for the `.env` file

## Step 2: Create Database

1. In your project dashboard, go to "Databases"
2. Click "Create Database"
3. Name: "prepxl-db"
4. Copy the **Database ID** - you'll need this for the `.env` file

## Step 3: Create Collections

Create the following collections in your database:

### 3.1 Users Collection
- **Collection ID**: `users`
- **Permissions**: 
  - Create: Users
  - Read: Users (own documents)
  - Update: Users (own documents)
  - Delete: Users (own documents)

**Attributes:**
```
- name (string, required, size: 255)
- email (string, required, size: 255)
- experienceLevel (string, required, size: 50)
- targetRole (string, size: 255)
- targetIndustry (string, size: 255)
- isAdmin (boolean, default: false)
- createdAt (datetime, required)
- updatedAt (datetime, required)
```

### 3.2 Resumes Collection
- **Collection ID**: `resumes`
- **Permissions**: 
  - Create: Users
  - Read: Users (own documents)
  - Update: Users (own documents)
  - Delete: Users (own documents)

**Attributes:**
```
- userId (string, required, size: 255)
- fileId (string, required, size: 255)
- fileName (string, required, size: 255)
- jobDescription (string, required, size: 10000)
- analysisResults (string, required, size: 50000) // JSON string
- uploadedAt (datetime, required)
```

### 3.3 Interview Sessions Collection
- **Collection ID**: `interview-sessions`
- **Permissions**: 
  - Create: Users
  - Read: Users (own documents)
  - Update: Users (own documents)
  - Delete: Users (own documents)

**Attributes:**
```
- userId (string, required, size: 255)
- sessionType (string, required, size: 50)
- role (string, required, size: 255)
- status (string, required, size: 50)
- finalScore (integer, default: 0)
- startedAt (datetime, required)
- completedAt (datetime)
```

### 3.4 Interactions Collection
- **Collection ID**: `interactions`
- **Permissions**: 
  - Create: Users
  - Read: Users (own documents)
  - Update: Users (own documents)
  - Delete: Users (own documents)

**Attributes:**
```
- sessionId (string, required, size: 255)
- questionText (string, required, size: 5000)
- userAnswerText (string, required, size: 10000)
- timestamp (datetime, required)
- order (integer, required)
```

### 3.5 Questions Collection
- **Collection ID**: `questions`
- **Permissions**: 
  - Create: Admin users only
  - Read: Any authenticated user
  - Update: Admin users only
  - Delete: Admin users only

**Attributes:**
```
- questionText (string, required, size: 5000)
- category (string, required, size: 100)
- role (string, required, size: 255)
- suggestedAnswer (string, size: 10000)
- createdAt (datetime, required)
- updatedAt (datetime, required)
```

## Step 4: Create Storage Bucket

1. Go to "Storage" in your project dashboard
2. Click "Create Bucket"
3. **Bucket ID**: `resumes`
4. **Name**: "Resume Files"
5. **Permissions**:
   - Create: Users
   - Read: Users (own files)
   - Update: Users (own files)
   - Delete: Users (own files)
6. **File Security**: Enabled
7. **Maximum File Size**: 10MB
8. **Allowed File Extensions**: pdf, doc, docx

## Step 5: Configure Authentication

1. Go to "Auth" in your project dashboard
2. Enable the following providers:
   - **Email/Password**: Enable
   - **Google OAuth** (optional): Configure with your Google Client ID
   - **LinkedIn OAuth** (optional): Configure with your LinkedIn Client ID

### Google OAuth Setup (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins
6. Copy the Client ID to your `.env` file

## Step 6: Update Environment Variables

Update your `.env` file with the actual values:

```env
# Appwrite Configuration
VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=68989b9a002cd7dd5c63

# Appwrite Database Configuration
VITE_APPWRITE_DATABASE_ID=68989eb20006e65fe65f

# Appwrite Collection IDs
VITE_APPWRITE_USERS_COLLECTION_ID=68989f1c0017e47f8bec
VITE_APPWRITE_RESUMES_COLLECTION_ID=687fe7c10007c51a7c90
VITE_APPWRITE_SESSIONS_COLLECTION_ID=68989f450005eb99ff08
VITE_APPWRITE_INTERACTIONS_COLLECTION_ID=68989f3c000b7f44ca7b
VITE_APPWRITE_QUESTIONS_COLLECTION_ID=68989f35003b4c609313

# Appwrite Storage Configuration
VITE_APPWRITE_STORAGE_BUCKET_ID=68989f680031b3cdab2d

# Application Configuration
VITE_APP_NAME=PrepXL

# OAuth Configuration (optional)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_LINKEDIN_CLIENT_ID=your-linkedin-client-id
```

## Step 7: Create Admin User

1. Register a new user through your application
2. In Appwrite Console, go to "Auth" > "Users"
3. Find your user and edit their document in the Users collection
4. Set `isAdmin` to `true`

## Step 8: Seed Initial Data (Optional)

You can add some initial questions to the Questions collection:

```json
[
  {
    "questionText": "Tell me about yourself and your background.",
    "category": "Behavioral",
    "role": "General",
    "suggestedAnswer": "Focus on your professional experience, key achievements, and what makes you a good fit for the role.",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "questionText": "What is your experience with React and modern JavaScript?",
    "category": "Technical",
    "role": "Frontend Developer",
    "suggestedAnswer": "Discuss your experience with React hooks, state management, component architecture, and modern ES6+ features.",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

## Step 9: Test Connection

1. Start your application: `npm run dev`
2. Try to register a new user
3. Try to log in
4. Check that data is being saved to Appwrite

## Troubleshooting

### Common Issues:

1. **401 Unauthorized**: Check your project ID and endpoint URL
2. **403 Forbidden**: Check collection permissions
3. **404 Not Found**: Verify collection IDs match exactly
4. **CORS Errors**: Add your domain to Appwrite project settings

### Debugging:

1. Check browser console for detailed error messages
2. Verify environment variables are loaded correctly
3. Check Appwrite Console logs for server-side errors
4. Ensure all required collections and attributes are created

## Security Considerations

1. **Never expose your Appwrite API key** in client-side code
2. Use proper **collection permissions** to restrict access
3. Enable **file security** for storage buckets
4. Regularly **review user permissions** and access logs
5. Use **HTTPS** for all connections

## Production Deployment

When deploying to production:

1. Create a separate Appwrite project for production
2. Update environment variables for production
3. Configure proper domain settings in Appwrite
4. Enable error monitoring and logging
5. Set up regular backups of your database

## Support

- [Appwrite Documentation](https://appwrite.io/docs)
- [Appwrite Discord Community](https://discord.gg/GSeTUeA)
- [Appwrite GitHub Issues](https://github.com/appwrite/appwrite/issues)