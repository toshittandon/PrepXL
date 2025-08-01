# Design Document

## Overview

InterviewPrep AI is a modern single-page application built with React 19 that provides comprehensive interview preparation tools. The application leverages Appwrite as a Backend-as-a-Service for authentication, data storage, and file management, while integrating with custom AI APIs for resume analysis and interview question generation. The architecture follows modern React patterns with Redux Toolkit for state management and emphasizes responsive design and user experience.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React SPA     │    │    Appwrite      │    │   AI Backend    │
│                 │    │                  │    │                 │
│ - Components    │◄──►│ - Authentication │    │ - Resume        │
│ - Redux Store   │    │ - Database       │    │   Analysis      │
│ - Routing       │    │ - File Storage   │    │ - Question      │
│ - API Calls     │    │ - Real-time      │    │   Generation    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Technology Stack

- **Frontend Framework**: React 19 with Vite
- **Language**: JavaScript (ES2024)
- **Styling**: Tailwind CSS with responsive design
- **State Management**: Redux Toolkit with RTK Query
- **Routing**: React Router v6
- **Form Handling**: React Hook Form with validation
- **Backend Services**: Appwrite (Auth, Database, Storage)
- **AI Integration**: Custom REST API endpoints
- **Speech Recognition**: Web Speech API
- **Build Tool**: Vite for fast development and optimized builds

### Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components (Button, Modal, etc.)
│   ├── forms/           # Form-specific components
│   └── layout/          # Layout components (Header, Sidebar)
├── pages/               # Page components for routing
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Dashboard page
│   ├── interview/      # Interview-related pages
│   └── resume/         # Resume-related pages
├── store/              # Redux store configuration
│   ├── slices/         # Redux slices
│   └── api/            # RTK Query API definitions
├── services/           # External service integrations
│   ├── appwrite/       # Appwrite service functions
│   └── ai/             # AI API service functions
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── constants/          # Application constants
└── styles/             # Global styles and Tailwind config
```

## Components and Interfaces

### Core Components

#### Authentication Components
- **LoginForm**: Email/password login with OAuth buttons
- **SignupForm**: User registration with validation
- **AuthGuard**: Route protection component
- **OAuthButtons**: Google and LinkedIn authentication

#### Dashboard Components
- **DashboardLayout**: Main dashboard container
- **SessionHistory**: List of past interview sessions
- **QuickActions**: Resume upload and interview start buttons
- **UserProfile**: User information display

#### Resume Components
- **ResumeUpload**: File upload interface with drag-and-drop
- **ResumeAnalysis**: Display analysis results in cards
- **AnalysisCard**: Individual analysis result component

#### Interview Components
- **InterviewSetup**: Role and session type selection
- **LiveInterview**: Real-time interview interface
- **SpeechRecognition**: Voice input component
- **QuestionDisplay**: Current question presentation
- **InterviewControls**: Start, pause, end interview buttons

#### Report Components
- **FeedbackReport**: Complete interview report
- **InteractionItem**: Individual Q&A display
- **ScoreDisplay**: Interview score visualization

### Data Models

#### User Model
```javascript
{
  id: string,
  name: string,
  email: string,
  experienceLevel: string,
  targetRole: string,
  targetIndustry: string,
  createdAt: string,
  updatedAt: string
}
```

#### Resume Model
```javascript
{
  id: string,
  userId: string,
  fileId: string,
  fileName: string,
  analysisResults: {
    atsKeywords: string[],
    actionVerbs: string[],
    quantificationSuggestions: string[]
  },
  uploadedAt: string
}
```

#### Interview Session Model
```javascript
{
  id: string,
  userId: string,
  sessionType: string, // 'Behavioral', 'Technical', 'Case Study'
  role: string,
  status: string, // 'active', 'completed', 'abandoned'
  finalScore: number,
  startedAt: string,
  completedAt: string
}
```

#### Interaction Model
```javascript
{
  id: string,
  sessionId: string,
  questionText: string,
  userAnswerText: string,
  timestamp: string,
  order: number
}
```

### API Interfaces

#### Appwrite Collections
- **Users**: User profile information
- **Resumes**: Resume metadata and analysis results
- **InterviewSessions**: Interview session data
- **Interactions**: Question-answer pairs

#### AI API Endpoints
```javascript
// Resume Analysis
POST /api/analyze-resume
Request: { resumeText: string }
Response: { analysisResults: AnalysisResults }

// Interview Questions
POST /api/get-interview-question
Request: { 
  role: string, 
  sessionType: string, 
  history: Array<{q: string, a: string}> 
}
Response: { questionText: string }
```

## Data Models

### Redux Store Structure

```javascript
{
  auth: {
    user: User | null,
    session: Session | null,
    loading: boolean,
    error: string | null
  },
  interview: {
    currentSession: InterviewSession | null,
    currentQuestion: string | null,
    interactions: Interaction[],
    isRecording: boolean,
    loading: boolean,
    error: string | null
  },
  resume: {
    resumes: Resume[],
    currentAnalysis: AnalysisResults | null,
    uploading: boolean,
    analyzing: boolean,
    error: string | null
  },
  ui: {
    sidebarOpen: boolean,
    currentModal: string | null,
    notifications: Notification[]
  }
}
```

### State Management Patterns

#### Redux Slices
- **authSlice**: Authentication state and actions
- **interviewSlice**: Interview session management
- **resumeSlice**: Resume and analysis data
- **uiSlice**: UI state management

#### RTK Query APIs
- **appwriteApi**: Appwrite database operations
- **aiApi**: AI service endpoints
- **storageApi**: File upload/download operations

## Error Handling

### Error Categories

#### Authentication Errors
- Invalid credentials
- OAuth provider failures
- Session expiration
- Account creation conflicts

#### File Upload Errors
- File size/type validation
- Storage quota exceeded
- Network interruptions
- Corrupted uploads

#### AI Service Errors
- API rate limiting
- Service unavailability
- Invalid request format
- Processing timeouts

#### Speech Recognition Errors
- Microphone access denied
- Browser compatibility issues
- Network connectivity problems
- Audio processing failures

### Error Handling Strategy

#### Global Error Boundary
```javascript
// Catches unhandled React errors
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

#### Redux Error State
- Each slice maintains error state
- Standardized error action creators
- User-friendly error messages
- Automatic error clearing

#### API Error Handling
- Retry mechanisms for transient failures
- Graceful degradation for service outages
- User notification system
- Offline capability indicators

## Testing Strategy

### Testing Pyramid

#### Unit Tests (70%)
- Component rendering and behavior
- Redux slice logic and reducers
- Utility functions and helpers
- Custom hooks functionality

#### Integration Tests (20%)
- Component interaction flows
- API service integration
- Redux store integration
- Form submission workflows

#### End-to-End Tests (10%)
- Complete user journeys
- Authentication flows
- Interview session completion
- Resume upload and analysis

### Testing Tools

#### Core Testing Framework
- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **MSW**: API mocking for tests
- **Cypress**: End-to-end testing

#### Testing Patterns
- **Arrange-Act-Assert**: Standard test structure
- **Page Object Model**: E2E test organization
- **Test Data Builders**: Consistent test data creation
- **Mock Service Worker**: API response mocking

### Test Coverage Requirements
- Minimum 80% code coverage
- 100% coverage for critical paths
- All Redux actions and reducers tested
- Key user flows covered by E2E tests

## Performance Considerations

### Code Splitting
- Route-based code splitting with React.lazy
- Component-level splitting for heavy features
- Dynamic imports for AI service integration
- Vendor bundle optimization

### State Management Optimization
- Normalized state structure
- Memoized selectors with Reselect
- RTK Query caching strategies
- Optimistic updates for better UX

### Asset Optimization
- Image compression and lazy loading
- Font optimization and preloading
- Bundle size monitoring
- Tree shaking for unused code

### Runtime Performance
- React.memo for expensive components
- useMemo and useCallback optimization
- Virtual scrolling for large lists
- Debounced search and input handling

## Security Considerations

### Authentication Security
- Secure token storage
- Automatic session refresh
- OAuth provider validation
- CSRF protection

### Data Protection
- Input sanitization and validation
- XSS prevention measures
- Secure file upload handling
- PII data encryption

### API Security
- Request authentication headers
- Rate limiting implementation
- CORS configuration
- Error message sanitization

## Deployment Configuration

### Environment Variables
```
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_DATABASE_ID=interview-prep-db
VITE_APPWRITE_USERS_COLLECTION_ID=users
VITE_APPWRITE_RESUMES_COLLECTION_ID=resumes
VITE_APPWRITE_SESSIONS_COLLECTION_ID=interview-sessions
VITE_APPWRITE_INTERACTIONS_COLLECTION_ID=interactions
VITE_APPWRITE_STORAGE_BUCKET_ID=resumes
VITE_AI_API_BASE_URL=https://your-ai-api.com
```

### Build Configuration
- Vite production build optimization
- Static asset handling
- Environment-specific configurations
- Source map generation for debugging

### Deployment Targets
- **Vercel**: Optimized for React SPAs
- **Netlify**: Static site deployment
- **CDN Integration**: Global content delivery
- **CI/CD Pipeline**: Automated deployment workflow