# InterviewPrep AI

AI-powered interview preparation platform that helps job seekers practice interviews and analyze resumes.

## Features

- 🤖 AI-powered resume analysis with ATS optimization suggestions
- 🎤 Interactive interview practice with speech recognition
- 📊 Comprehensive feedback reports and scoring
- 🔐 Secure authentication with OAuth support
- 📱 Responsive design for all devices

## Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Backend**: Appwrite (BaaS)
- **AI Integration**: Custom REST API
- **Speech Recognition**: Web Speech API

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration values

5. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components
│   ├── forms/          # Form-specific components
│   └── layout/         # Layout components
├── pages/              # Page components
├── store/              # Redux store configuration
├── services/           # External service integrations
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── constants/          # Application constants
└── styles/             # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

See `.env.example` for all required environment variables.

## License

MIT License