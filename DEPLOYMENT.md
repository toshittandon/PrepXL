# PrepXL - Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Build Configuration](#build-configuration)
4. [Deployment Options](#deployment-options)
5. [Production Optimization](#production-optimization)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- Node.js 18+ and npm 9+
- Git for version control
- Modern web browser for testing
- Access to deployment platform (Vercel, Netlify, etc.)

### Required Services
- **Appwrite Instance**: Backend services (database, auth, storage)
- **AI API Service**: For resume analysis and interview questions
- **Domain Name**: For production deployment (optional)
- **SSL Certificate**: Automatically provided by most platforms

## Environment Setup

### Environment Variables
Create environment files for different deployment stages:

#### `.env.production`
```env
# Appwrite Configuration
VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=68989b9a002cd7dd5c63
VITE_APPWRITE_DATABASE_ID=68989eb20006e65fe65f
VITE_APPWRITE_USERS_COLLECTION_ID=68989f1c0017e47f8bec
VITE_APPWRITE_RESUMES_COLLECTION_ID=687fe7c10007c51a7c90
VITE_APPWRITE_SESSIONS_COLLECTION_ID=68989f450005eb99ff08
VITE_APPWRITE_INTERACTIONS_COLLECTION_ID=68989f3c000b7f44ca7b
VITE_APPWRITE_QUESTIONS_COLLECTION_ID=68989f35003b4c609313
VITE_APPWRITE_STORAGE_BUCKET_ID=68989f680031b3cdab2d

# AI Service Configuration
VITE_AI_API_BASE_URL=https://your-ai-api.com
VITE_AI_API_KEY=your-production-api-key

# Application Configuration
VITE_APP_NAME=PrepXL
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production

# Analytics and Monitoring (Optional)
VITE_SENTRY_DSN=your-sentry-dsn
VITE_GOOGLE_ANALYTICS_ID=your-ga-id
```

#### `.env.staging`
```env
# Similar to production but with staging endpoints
VITE_APPWRITE_PROJECT_ID=68989b9a002cd7dd5c63-staging
VITE_AI_API_BASE_URL=https://staging-ai-api.com
VITE_APP_ENVIRONMENT=staging
```

### Appwrite Setup

#### Database Collections
Create the following collections in Appwrite:

1. **Users Collection**
   - Attributes: name, email, profile (JSON), isAdmin (boolean)
   - Permissions: User-level read/write, Admin read all

2. **Resumes Collection**
   - Attributes: userId, fileId, fileName, jobDescription, analysisResults (JSON)
   - Permissions: User-level read/write own documents

3. **Interview Sessions Collection**
   - Attributes: userId, sessionType, role, status, finalScore, startedAt, completedAt
   - Permissions: User-level read/write own documents

4. **Interactions Collection**
   - Attributes: sessionId, questionText, userAnswerText, timestamp, order
   - Permissions: User-level read/write own documents

5. **Questions Collection**
   - Attributes: questionText, category, role, suggestedAnswer
   - Permissions: Read all, Admin write

#### Storage Buckets
1. **Resumes Bucket**
   - File size limit: 10MB
   - Allowed file types: PDF, DOC, DOCX
   - Permissions: User-level read/write own files

#### Authentication
- Enable email/password authentication
- Configure OAuth providers (Google, LinkedIn)
- Set up password requirements and session limits

## Build Configuration

### Production Build
```bash
# Install dependencies
npm install

# Run tests
npm run test:run

# Build for production
npm run build:production

# Verify build
npm run preview
```

### Build Optimization
The build process includes:
- Code splitting and lazy loading
- Asset optimization and compression
- CSS purging and minification
- Bundle analysis and size optimization

### Build Scripts
```json
{
  "scripts": {
    "build:production": "vite build --mode production",
    "build:staging": "vite build --mode staging",
    "build:analyze": "vite build --mode production && node scripts/analyze-bundle.js",
    "preview": "vite preview",
    "validate:full": "npm run validate && npm run test:run && npm run build:monitor"
  }
}
```

## Deployment Options

### Option 1: Vercel Deployment

#### Automatic Deployment
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Set build command: `npm run build:production`
4. Set output directory: `dist`
5. Deploy automatically on git push

#### Manual Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
npm run deploy:vercel
```

#### Vercel Configuration (`vercel.json`)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_APPWRITE_ENDPOINT": "@appwrite-endpoint",
    "VITE_APPWRITE_PROJECT_ID": "@appwrite-project-id"
  }
}
```

### Option 2: Netlify Deployment

#### Automatic Deployment
1. Connect repository to Netlify
2. Set build command: `npm run build:production`
3. Set publish directory: `dist`
4. Configure environment variables
5. Enable automatic deployments

#### Manual Deployment
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
npm run deploy:netlify
```

#### Netlify Configuration (`netlify.toml`)
```toml
[build]
  command = "npm run build:production"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production.environment]
  VITE_APP_ENVIRONMENT = "production"

[context.deploy-preview.environment]
  VITE_APP_ENVIRONMENT = "staging"
```

### Option 3: Custom Server Deployment

#### Using Docker
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build:production

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

## Production Optimization

### Performance Optimization
1. **Code Splitting**: Implemented via React.lazy and dynamic imports
2. **Asset Optimization**: Images compressed, fonts optimized
3. **Bundle Analysis**: Regular monitoring of bundle size
4. **Caching Strategy**: Proper cache headers for static assets

### Security Hardening
1. **Environment Variables**: Sensitive data in environment variables only
2. **HTTPS**: SSL/TLS encryption for all traffic
3. **Security Headers**: CSP, HSTS, and other security headers
4. **Input Validation**: Client and server-side validation

### SEO Optimization
1. **Meta Tags**: Proper title, description, and Open Graph tags
2. **Structured Data**: JSON-LD for better search engine understanding
3. **Sitemap**: XML sitemap for search engines
4. **Robots.txt**: Proper crawling instructions

### Monitoring Setup
1. **Error Tracking**: Sentry or similar service
2. **Performance Monitoring**: Web Vitals tracking
3. **Analytics**: Google Analytics or similar
4. **Uptime Monitoring**: Service availability tracking

## Monitoring and Maintenance

### Health Checks
Implement health check endpoints:
- `/health`: Basic application health
- `/api/health`: Backend service health
- `/api/status`: Detailed system status

### Performance Monitoring
Track key metrics:
- **Page Load Times**: First Contentful Paint, Largest Contentful Paint
- **User Interactions**: Time to Interactive, First Input Delay
- **Error Rates**: JavaScript errors, API failures
- **User Engagement**: Session duration, bounce rate

### Automated Monitoring
```bash
# Performance monitoring script
npm run monitor:performance

# Bundle size monitoring
npm run build:analyze

# Integration validation
npm run validate:full
```

### Backup Strategy
1. **Database Backups**: Regular Appwrite database exports
2. **File Storage**: Resume files backup
3. **Configuration**: Environment variables and settings backup
4. **Code Repository**: Git repository with proper branching

### Update Process
1. **Staging Deployment**: Test changes in staging environment
2. **Integration Testing**: Run full test suite
3. **Performance Testing**: Verify no performance regression
4. **Production Deployment**: Deploy to production
5. **Post-deployment Verification**: Confirm all features working

## Troubleshooting

### Common Deployment Issues

#### Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for dependency conflicts
npm audit

# Verify environment variables
npm run validate
```

#### Runtime Errors
1. **Check Environment Variables**: Ensure all required variables are set
2. **Verify API Endpoints**: Confirm Appwrite and AI service connectivity
3. **Review Error Logs**: Check browser console and server logs
4. **Test in Staging**: Reproduce issues in staging environment

#### Performance Issues
1. **Bundle Analysis**: Check for large dependencies
2. **Network Analysis**: Verify API response times
3. **Browser Performance**: Use DevTools performance tab
4. **CDN Configuration**: Ensure proper caching

### Rollback Procedures
1. **Immediate Rollback**: Revert to previous deployment
2. **Database Rollback**: Restore from backup if needed
3. **DNS Changes**: Update DNS if domain changes required
4. **User Communication**: Notify users of any service interruption

### Support Escalation
1. **Level 1**: Basic deployment and configuration issues
2. **Level 2**: Performance and integration problems
3. **Level 3**: Critical system failures and security issues
4. **Emergency Contact**: 24/7 support for critical issues

## Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Appwrite services configured
- [ ] AI API endpoints tested
- [ ] Build process verified
- [ ] Performance benchmarks met

### Deployment
- [ ] Staging deployment successful
- [ ] Production build created
- [ ] DNS configuration updated
- [ ] SSL certificate installed
- [ ] CDN configuration verified
- [ ] Monitoring tools configured

### Post-deployment
- [ ] Application loads correctly
- [ ] Authentication working
- [ ] All features functional
- [ ] Performance metrics acceptable
- [ ] Error monitoring active
- [ ] Backup systems verified

### Go-live
- [ ] User acceptance testing complete
- [ ] Documentation updated
- [ ] Support team notified
- [ ] Monitoring alerts configured
- [ ] Success metrics defined
- [ ] Rollback plan ready

---

For deployment support or issues, contact the development team with detailed information about the deployment environment, error messages, and steps taken.