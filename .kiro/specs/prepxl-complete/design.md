# Design Document

## Overview

PrepXL is a sophisticated, production-ready single-page application built with React 19 that provides comprehensive interview preparation tools. The application integrates AI-powered interview practice, advanced ATS resume rating with job description matching, a searchable Q&A library, and a secure admin dashboard. The architecture emphasizes modern React patterns, professional UI/UX design with dual theming, and seamless user experience across all devices.

## Architecture

### High-Level Architecture

```
┌─────────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React 19 SPA      │    │    Appwrite      │    │   AI Backend    │
│                     │    │                  │    │                 │
│ - Components        │◄──►│ - Authentication │    │ - Resume        │
│ - Redux Toolkit     │    │ - Database       │    │   Analysis      │
│ - React Router      │    │ - File Storage   │    │ - Interview     │
│ - Theme System      │    │ - Permissions    │    │   Questions     │
│ - Framer Motion     │    │ - Real-time      │    │                 │
└─────────────────────┘    └──────────────────┘    └─────────────────┘
```

### Technology Stack

- **Frontend Framework**: React 19 with Vite
- **Language**: JavaScript (ES2024) - Strictly no TypeScript
- **Styling**: Tailwind CSS with custom configuration
- **State Management**: Redux Toolkit with RTK Query
- **Routing**: React Router v6
- **Form Handling**: React Hook Form with validation
- **Animations**: Framer Motion for UI micro-interactions
- **Icons**: Lucide Icons (lucide-react)
- **Charts**: Recharts for dashboard visualizations
- **Backend Services**: Appwrite (Auth, Database, Storage)
- **AI Integration**: Custom REST API endpoints
- **Speech Recognition**: Web Speech API
- **Typography**: Inter font from Google Fonts
- **Build Tool**: Vite for fast development and optimized builds

### Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components (Button, Modal, LoadingSpinner)
│   ├── forms/           # Form-specific components
│   ├── layout/          # Layout components (Header, Sidebar, Footer)
│   ├── charts/          # Recharts visualization components
│   └── animations/      # Framer Motion animation wrappers
├── pages/               # Page components for routing
│   ├── auth/           # Authentication pages (Login, Signup)
│   ├── dashboard/      # User dashboard
│   ├── interview/      # Interview-related pages (Setup, Live, Report)
│   ├── resume/         # Resume upload and analysis pages
│   ├── library/        # Q&A library page
│   └── admin/          # Admin dashboard pages
├── store/              # Redux store configuration
│   ├── slices/         # Redux slices (auth, interview, resume, ui, admin)
│   └── api/            # RTK Query API definitions
├── services/           # External service integrations
│   ├── appwrite/       # Appwrite service functions
│   └── ai/             # AI API service functions
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── constants/          # Application constants
├── contexts/           # React contexts (ThemeProvider)
└── styles/             # Global styles and Tailwind config
```

## Components and Interfaces

### Core Components

#### Theme System Components
- **ThemeProvider**: React Context provider for theme state management
- **ThemeToggle**: Sun/moon icon toggle button for theme switching
- **ThemeWrapper**: HOC for applying theme-aware styling

#### Authentication Components
- **LoginForm**: Email/password login with OAuth buttons
- **SignupForm**: User registration with validation
- **AuthGuard**: Route protection component
- **OAuthButtons**: Google and LinkedIn authentication
- **ProfileSetup**: Initial user profile configuration

#### Dashboard Components
- **DashboardLayout**: Main dashboard container with responsive design
- **SessionHistory**: List of past interview sessions with filtering
- **QuickActions**: Resume upload, interview start, and library access buttons
- **UserProfile**: User information display with edit capabilities
- **AnalyticsCards**: Summary statistics using Recharts
- **ProgressChart**: User progress visualization

#### Resume Components
- **ResumeUpload**: File upload interface with drag-and-drop
- **JobDescriptionInput**: Textarea for job description input
- **ResumeAnalysis**: Comprehensive analysis results display
- **AnalysisCard**: Individual analysis result component with gauges
- **MatchScoreDisplay**: Visual match score representation
- **KeywordAnalysis**: Missing keywords and suggestions display

#### Interview Components
- **InterviewSetup**: Role and session type selection with validation
- **LiveInterview**: Real-time interview interface with speech recognition
- **SpeechRecognition**: Voice input component with Web Speech API
- **QuestionDisplay**: Current question presentation with animations
- **InterviewControls**: Start, pause, end interview buttons
- **AnswerCapture**: Text and voice input handling

#### Q&A Library Components
- **QuestionLibrary**: Main library interface with search and filters
- **QuestionAccordion**: Accordion-style question/answer display
- **SearchFilters**: Category and role-based filtering
- **QuestionCard**: Individual question display component

#### Report Components
- **FeedbackReport**: Complete interview report with scoring
- **InteractionItem**: Individual Q&A display with timestamps
- **ScoreDisplay**: Interview score visualization with charts
- **ExportOptions**: Report export functionality (JSON, CSV, TXT)

#### Admin Components
- **AdminLayout**: Protected admin dashboard layout
- **AdminDashboard**: Application-wide analytics and metrics
- **UserManagement**: User table with search and management tools
- **QuestionManagement**: CRUD interface for Q&A library
- **AdminAnalytics**: Comprehensive application statistics

#### Common UI Components
- **Button**: Variants (primary, secondary, danger) with loading states
- **Modal**: Dialog component with backdrop and animations
- **LoadingSpinner**: Various spinner variants for different contexts
- **ErrorMessage**: Consistent error display with recovery options
- **SuccessMessage**: Success feedback with animations
- **ProgressBar**: File upload and process progress indication
- **Card**: Consistent card component with theme support
- **Input**: Form input with validation states
- **Select**: Dropdown component with search capabilities

### Data Models

#### User Model
```javascript
{
  id: string,
  name: string,
  email: string,
  experienceLevel: string, // 'Entry', 'Mid', 'Senior', 'Executive'
  targetRole: string,
  targetIndustry: string,
  isAdmin: boolean, // defaults to false
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
  jobDescription: string,
  analysisResults: {
    matchScore: number,
    missingKeywords: string[],
    actionVerbAnalysis: string,
    formatSuggestions: string[]
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

#### Question Model
```javascript
{
  id: string,
  questionText: string,
  category: string, // 'Behavioral', 'Technical', 'Case Study'
  role: string,
  suggestedAnswer: string,
  createdAt: string,
  updatedAt: string
}
```

### API Interfaces

#### Appwrite Collections
- **Users**: User profile information with isAdmin attribute
- **Resumes**: Resume metadata and analysis results
- **InterviewSessions**: Interview session data
- **Interactions**: Question-answer pairs
- **Questions**: Q&A library content

#### Appwrite Storage Buckets
- **resumes**: Secure file storage with user-level permissions

#### AI API Endpoints
```javascript
// Enhanced Resume Analysis
POST /api/rate-resume
Request: { 
  resumeText: string,
  jobDescriptionText: string 
}
Response: { 
  matchScore: number,
  missingKeywords: string[],
  actionVerbAnalysis: string,
  formatSuggestions: string[]
}

// Interview Questions with Context
POST /api/get-interview-question
Request: { 
  role: string, 
  sessionType: string, 
  history: Array<{q: string, a: string}> 
}
Response: { 
  questionText: string 
}
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
  library: {
    questions: Question[],
    filteredQuestions: Question[],
    searchTerm: string,
    selectedCategory: string,
    selectedRole: string,
    loading: boolean,
    error: string | null
  },
  admin: {
    users: User[],
    analytics: AdminAnalytics,
    loading: boolean,
    error: string | null
  },
  ui: {
    sidebarOpen: boolean,
    currentModal: string | null,
    notifications: Notification[],
    theme: 'light' | 'dark'
  }
}
```

### State Management Patterns

#### Redux Slices
- **authSlice**: Authentication state and user management
- **interviewSlice**: Interview session management
- **resumeSlice**: Resume and analysis data
- **librarySlice**: Q&A library state and filtering
- **adminSlice**: Admin dashboard data and operations
- **uiSlice**: UI state including theme management

#### RTK Query APIs
- **appwriteApi**: Appwrite database operations
- **aiApi**: AI service endpoints
- **storageApi**: File upload/download operations
- **adminApi**: Admin-specific database operations

## Theme System Design

### Theme Architecture

#### ThemeProvider Implementation
```javascript
// Context-based theme management
const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: (theme) => {}
});

// Theme persistence in localStorage
// Automatic dark class application to <html> element
// System preference detection on first load
```

#### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      },
      colors: {
        // Custom color palette for professional appearance
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a'
        },
        dark: {
          50: '#f8fafc',
          900: '#0f172a'
        }
      }
    }
  }
}
```

#### Theme-Aware Components
- All components support both light and dark variants
- Consistent color application across the application
- Smooth transitions between theme changes
- Professional dark palette (slate-900, slate-200)

## Animation and Interaction Design

### Framer Motion Integration

#### Page Transitions
```javascript
// Fade-in and slide-up animations for page content
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};
```

#### List Animations
```javascript
// Staggered animations for list items
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};
```

#### Interactive Elements
- Smooth transition-colors on hover and focus
- Button hover effects with subtle scaling
- Card hover elevations
- Loading state animations

### UI/UX Design Philosophy

#### Typography
- Inter font as default application font
- Clear typographic hierarchy
- Consistent font weights and sizes
- Proper line heights for readability

#### Layout and Spacing
- Rounded-xl corners on all cards and containers
- Soft shadow-md for depth and elevation
- Ample whitespace and consistent padding
- Clean, uncluttered layouts

#### Visual Elements
- Subtle gradients on primary buttons
- Professional color palette
- Consistent iconography with Lucide Icons
- Visual feedback for all user interactions

## Error Handling

### Error Categories

#### Authentication Errors
- Invalid credentials with clear messaging
- OAuth provider failures with fallback options
- Session expiration with automatic refresh
- Account creation conflicts with guidance

#### File Upload Errors
- File size/type validation with clear limits
- Storage quota exceeded notifications
- Network interruption recovery
- Corrupted upload detection and retry

#### AI Service Errors
- API rate limiting with user notification
- Service unavailability with graceful degradation
- Invalid request format with user guidance
- Processing timeouts with retry mechanisms

#### Speech Recognition Errors
- Microphone access denied with instructions
- Browser compatibility warnings
- Network connectivity issues with fallbacks
- Audio processing failures with text alternatives

### Error Handling Strategy

#### Global Error Boundary
```javascript
// React Error Boundary for unhandled errors
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

#### User-Friendly Error Messages
- Clear, actionable error descriptions
- Recovery suggestions and next steps
- Consistent error styling and animations
- Automatic error clearing mechanisms

## Performance Considerations

### Code Splitting Strategy
- Route-based code splitting with React.lazy
- Component-level splitting for heavy features
- Dynamic imports for AI service integration
- Admin dashboard lazy loading
- Vendor bundle optimization

### State Management Optimization
- Normalized state structure for efficient updates
- Memoized selectors with Reselect
- RTK Query caching strategies
- Optimistic updates for better UX

### Asset Optimization
- Image compression and lazy loading
- Font optimization and preloading
- Bundle size monitoring and tree shaking
- Critical CSS inlining

### Runtime Performance
- React.memo for expensive components
- useMemo and useCallback optimization
- Virtual scrolling for large question lists
- Debounced search and input handling

## Security Considerations

### Authentication Security
- Secure token storage in httpOnly cookies
- Automatic session refresh mechanisms
- OAuth provider validation
- CSRF protection implementation

### Data Protection
- Input sanitization and validation
- XSS prevention measures
- Secure file upload handling
- PII data encryption at rest

### Admin Security
- Role-based access control
- Admin route protection
- Audit logging for admin actions
- Secure admin session management

### API Security
- Request authentication headers
- Rate limiting implementation
- CORS configuration
- Error message sanitization

## Testing Strategy

### Testing Pyramid

#### Unit Tests (70%)
- Component rendering and behavior
- Redux slice logic and reducers
- Utility functions and custom hooks
- Theme system functionality
- Form validation logic

#### Integration Tests (20%)
- Component interaction flows
- API service integration
- Redux store integration
- Theme switching functionality
- Admin permission enforcement

#### End-to-End Tests (10%)
- Complete user journeys
- Authentication flows
- Interview session completion
- Resume upload and analysis
- Admin dashboard functionality

### Testing Tools
- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **MSW**: API mocking for tests
- **Cypress**: End-to-end testing

## Deployment Configuration

### Environment Variables
```
VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=68989b9a002cd7dd5c63
VITE_APPWRITE_DATABASE_ID=68989eb20006e65fe65f
VITE_APPWRITE_USERS_COLLECTION_ID=68989f1c0017e47f8bec
VITE_APPWRITE_RESUMES_COLLECTION_ID=687fe7c10007c51a7c90
VITE_APPWRITE_SESSIONS_COLLECTION_ID=68989f450005eb99ff08
VITE_APPWRITE_INTERACTIONS_COLLECTION_ID=68989f3c000b7f44ca7b
VITE_APPWRITE_QUESTIONS_COLLECTION_ID=68989f35003b4c609313
VITE_APPWRITE_STORAGE_BUCKET_ID=68989f680031b3cdab2d
VITE_APP_NAME=PrepXL
```

### Build Configuration
- Vite production build optimization
- Static asset handling and compression
- Environment-specific configurations
- Source map generation for debugging
- Bundle analysis and optimization

### Deployment Targets
- **Vercel**: Optimized for React SPAs with automatic deployments
- **Netlify**: Static site deployment with form handling
- **CDN Integration**: Global content delivery
- **CI/CD Pipeline**: Automated testing and deployment workflow