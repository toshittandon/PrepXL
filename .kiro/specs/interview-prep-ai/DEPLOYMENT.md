# Deployment Guide

## Overview

This guide covers the deployment process for InterviewPrep AI across different environments and platforms.

## Environment Configuration

### Development
- Environment: `development`
- Build command: `npm run build:dev`
- Features: Debug tools enabled, mock responses, detailed logging

### Staging
- Environment: `staging`
- Build command: `npm run build:staging`
- Features: Production-like environment for testing, analytics enabled

### Production
- Environment: `production`
- Build command: `npm run build:production`
- Features: Optimized build, error monitoring, analytics

## Platform Deployment

### Vercel Deployment

#### Prerequisites
1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`
3. Link project: `vercel link`

#### Environment Variables
Set the following environment variables in Vercel dashboard:

**Production:**
- `VITE_APPWRITE_ENDPOINT`
- `VITE_APPWRITE_PROJECT_ID`
- `VITE_APPWRITE_DATABASE_ID`
- `VITE_APPWRITE_USERS_COLLECTION_ID`
- `VITE_APPWRITE_RESUMES_COLLECTION_ID`
- `VITE_APPWRITE_SESSIONS_COLLECTION_ID`
- `VITE_APPWRITE_INTERACTIONS_COLLECTION_ID`
- `VITE_APPWRITE_STORAGE_BUCKET_ID`
- `VITE_AI_API_BASE_URL`
- `VITE_AI_API_KEY`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_LINKEDIN_CLIENT_ID`
- `VITE_SENTRY_DSN`
- `VITE_GA_TRACKING_ID`
- `VITE_HOTJAR_ID`

#### Manual Deployment
```bash
# Deploy to production
npm run deploy:vercel

# Deploy preview
vercel
```

#### Automatic Deployment
- Production: Triggered on push to `main` branch
- Preview: Triggered on pull requests

### Netlify Deployment

#### Prerequisites
1. Install Netlify CLI: `npm i -g netlify-cli`
2. Login to Netlify: `netlify login`
3. Link project: `netlify link`

#### Environment Variables
Set the same environment variables as Vercel in Netlify dashboard.

#### Manual Deployment
```bash
# Deploy to production
npm run deploy:netlify

# Deploy preview
netlify deploy --dir=dist
```

#### Automatic Deployment
- Production: Triggered on push to `main` branch
- Preview: Triggered on pull requests

## CI/CD Pipeline

### GitHub Actions Workflows

#### 1. Continuous Integration (`ci.yml`)
- Runs on: Push to `main`/`develop`, Pull requests
- Jobs:
  - Unit tests (Node.js 18.x, 20.x)
  - E2E tests with Cypress
  - Security audit
  - Build verification

#### 2. Production Deployment (`deploy-production.yml`)
- Runs on: Push to `main` branch
- Jobs:
  - Build and test
  - Deploy to Vercel production
  - Optional Netlify deployment

#### 3. Staging Deployment (`deploy-staging.yml`)
- Runs on: Push to `develop` branch
- Jobs:
  - Build and test
  - Deploy to Vercel preview
  - Comment on PR with preview URL

### Required GitHub Secrets

#### Vercel Secrets
- `VERCEL_TOKEN`: Vercel authentication token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID

#### Netlify Secrets (if using Netlify)
- `NETLIFY_AUTH_TOKEN`: Netlify authentication token
- `NETLIFY_SITE_ID`: Netlify site ID

#### Application Secrets
All environment variables listed above should be added as GitHub secrets.

## Pre-deployment Checklist

### Code Quality
- [ ] All tests passing (`npm run test:all`)
- [ ] No linting errors (`npm run lint`)
- [ ] Security audit clean (`npm audit`)
- [ ] Bundle size optimized (`npm run build:analyze`)

### Environment Configuration
- [ ] Environment variables configured
- [ ] API endpoints accessible
- [ ] Database collections created
- [ ] Storage buckets configured
- [ ] OAuth providers configured

### Monitoring Setup
- [ ] Sentry project created and DSN configured
- [ ] Google Analytics property created
- [ ] Hotjar site configured (optional)
- [ ] Error reporting tested

### Performance
- [ ] Build size under limits
- [ ] Core Web Vitals optimized
- [ ] Images optimized
- [ ] Caching headers configured

## Post-deployment Verification

### Functional Testing
- [ ] Authentication flow works
- [ ] Resume upload and analysis
- [ ] Interview session creation
- [ ] Speech recognition functionality
- [ ] Report generation and viewing

### Performance Testing
- [ ] Page load times acceptable
- [ ] Bundle sizes optimized
- [ ] API response times good
- [ ] Mobile responsiveness

### Monitoring Verification
- [ ] Error reporting working
- [ ] Analytics tracking events
- [ ] Performance metrics collected
- [ ] Alerts configured

## Rollback Procedure

### Vercel Rollback
1. Go to Vercel dashboard
2. Select the project
3. Navigate to deployments
4. Click on previous successful deployment
5. Click "Promote to Production"

### Netlify Rollback
1. Go to Netlify dashboard
2. Select the site
3. Navigate to deploys
4. Click on previous successful deploy
5. Click "Publish deploy"

### GitHub Rollback
1. Revert the problematic commit
2. Push to main branch
3. Wait for automatic deployment

## Troubleshooting

### Common Issues

#### Build Failures
- Check environment variables are set
- Verify Node.js version compatibility
- Check for dependency conflicts

#### Runtime Errors
- Check browser console for errors
- Verify API endpoints are accessible
- Check Sentry for error reports

#### Performance Issues
- Analyze bundle size with `npm run build:analyze`
- Check network tab for slow requests
- Verify caching headers are working

### Support Contacts
- DevOps: [Your DevOps team contact]
- Backend API: [API team contact]
- Monitoring: [Monitoring team contact]

## Maintenance

### Regular Tasks
- [ ] Update dependencies monthly
- [ ] Review error reports weekly
- [ ] Monitor performance metrics
- [ ] Update security configurations
- [ ] Backup environment configurations

### Quarterly Reviews
- [ ] Review and update deployment procedures
- [ ] Audit security configurations
- [ ] Performance optimization review
- [ ] Cost optimization review