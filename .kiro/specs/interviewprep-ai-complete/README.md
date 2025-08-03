# InterviewPrep AI Complete

A sophisticated, production-ready web application designed for students and professionals to prepare for interviews. Built with React 19, featuring AI-powered interview practice, advanced ATS resume rating, searchable Q&A library, and secure admin dashboard.

## ✨ Features

### 🎯 Core Features
- **AI-Powered Interview Practice** - Interactive interview sessions with speech recognition
- **Advanced ATS Resume Rater** - Compare resumes against job descriptions with detailed analysis
- **Searchable Q&A Library** - Comprehensive interview question database with filtering
- **Admin Dashboard** - User management and content administration
- **Dual Theme Support** - Professional light and dark modes with smooth transitions

### 🎨 UI/UX Features
- **Modern Design** - Professional styling with Inter font and consistent design system
- **Responsive Layout** - Optimized for desktop, tablet, and mobile devices
- **Smooth Animations** - Framer Motion powered transitions and micro-interactions
- **Accessibility** - WCAG compliant with keyboard navigation support

## 🛠 Technology Stack

- **Frontend**: React 19 with Vite
- **Language**: JavaScript (ES2024)
- **Styling**: Tailwind CSS with custom configuration
- **State Management**: Redux Toolkit with RTK Query
- **Routing**: React Router v6
- **Forms**: React Hook Form with validation
- **Animations**: Framer Motion
- **Icons**: Lucide Icons
- **Charts**: Recharts for analytics
- **Backend**: Appwrite (Authentication, Database, Storage)
- **AI Integration**: Custom REST API endpoints
- **Testing**: Jest, React Testing Library, Cypress

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Appwrite account and project setup

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd interview-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your Appwrite and AI API credentials.

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components (Button, Modal, etc.)
│   ├── forms/           # Form-specific components
│   ├── layout/          # Layout components (Header, Sidebar)
│   ├── charts/          # Recharts visualization components
│   └── animations/      # Framer Motion animation wrappers
├── pages/               # Page components for routing
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # User dashboard
│   ├── interview/      # Interview-related pages
│   ├── resume/         # Resume upload and analysis
│   ├── library/        # Q&A library
│   └── admin/          # Admin dashboard
├── store/              # Redux store configuration
│   ├── slices/         # Redux slices
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

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Run ESLint
- `npm run analyze` - Analyze bundle size

## 🎯 Implementation Status

This project follows a comprehensive spec-driven development approach. Check the implementation progress in:

- **Requirements**: `.kiro/specs/interviewprep-ai-complete/requirements.md`
- **Design**: `.kiro/specs/interviewprep-ai-complete/design.md`
- **Tasks**: `.kiro/specs/interviewprep-ai-complete/tasks.md`

## 🔐 Environment Variables

```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_DATABASE_ID=interview-prep-complete-db
VITE_APPWRITE_USERS_COLLECTION_ID=users
VITE_APPWRITE_RESUMES_COLLECTION_ID=resumes
VITE_APPWRITE_SESSIONS_COLLECTION_ID=interview-sessions
VITE_APPWRITE_INTERACTIONS_COLLECTION_ID=interactions
VITE_APPWRITE_QUESTIONS_COLLECTION_ID=questions
VITE_APPWRITE_STORAGE_BUCKET_ID=resumes
VITE_AI_API_BASE_URL=https://your-ai-api.com
```

## 🚀 Deployment

The application is configured for deployment on:

- **Vercel** (Recommended)
- **Netlify**
- **Any static hosting service**

Build the project and deploy the `dist` folder:

```bash
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern React 19 and Vite
- Powered by Appwrite for backend services
- UI components inspired by modern design systems
- Icons provided by Lucide Icons
- Charts powered by Recharts

---

**Ready to start building?** Check out the tasks in `.kiro/specs/interviewprep-ai-complete/tasks.md` and begin with Task 1!