# Rickshaw Deployment Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Firebase Project Configuration](#firebase-project-configuration)
5. [Deployment Environments](#deployment-environments)
6. [Continuous Integration/Deployment](#continuous-integrationdeployment)
7. [Manual Deployment](#manual-deployment)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Rollback Procedures](#rollback-procedures)
10. [Monitoring and Alerts](#monitoring-and-alerts)
11. [Troubleshooting](#troubleshooting)

## Introduction

This guide provides detailed instructions for deploying the Rickshaw ride-sharing application to different environments. It covers both automated deployments using CI/CD pipelines and manual deployments.

Rickshaw uses Firebase Hosting for the frontend, Firebase Functions for the backend, Firestore for the database, and Firebase Storage for file storage. The deployment process ensures that all these components are properly configured and deployed.

## Prerequisites

Before deploying Rickshaw, ensure you have the following:

- **Firebase Account**: Access to the Firebase console with appropriate permissions
- **Firebase CLI**: Installed and configured on your local machine
- **Node.js**: Version 16 or later
- **npm**: Version 7 or later
- **Git**: For accessing the repository
- **GitHub Account**: For CI/CD access (if using GitHub Actions)

## Environment Setup

### Local Development Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/rickshaw.git
   cd rickshaw
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.development` file with your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your-dev-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-dev-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-dev-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-dev-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-dev-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-dev-app-id
   VITE_FIREBASE_MEASUREMENT_ID=your-dev-measurement-id
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Staging Environment

1. Create a `.env.staging` file with your staging Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your-staging-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-staging-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-staging-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-staging-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-staging-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-staging-app-id
   VITE_FIREBASE_MEASUREMENT_ID=your-staging-measurement-id
   ```

2. Build the application for staging:
   ```bash
   npm run build:staging
   ```

### Production Environment

1. Create a `.env.production` file with your production Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your-prod-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-prod-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-prod-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-prod-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-prod-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-prod-app-id
   VITE_FIREBASE_MEASUREMENT_ID=your-prod-measurement-id
   ```

2. Build the application for production:
   ```bash
   npm run build
   ```

## Firebase Project Configuration

### Creating Firebase Projects

1. **Development Project**:
   - Go to the [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project"
   - Name it "Rickshaw-Dev"
   - Follow the setup wizard
   - Enable Google Analytics (recommended)

2. **Staging Project**:
   - Go to the Firebase Console
   - Click "Add project"
   - Name it "Rickshaw-Staging"
   - Follow the setup wizard
   - Enable Google Analytics (recommended)

3. **Production Project**:
   - Go to the Firebase Console
   - Click "Add project"
   - Name it "Rickshaw-Prod"
   - Follow the setup wizard
   - Enable Google Analytics (recommended)

### Configuring Firebase Services

For each project (Development, Staging, Production), configure the following services:

1. **Authentication**:
   - Go to Authentication > Sign-in method
   - Enable Email/Password authentication
   - Enable Google authentication (optional)
   - Configure authorized domains

2. **Firestore**:
   - Go to Firestore Database
   - Create database in production mode
   - Select a location close to your target users
   - Set up security rules (use the rules from `firestore.rules`)

3. **Storage**:
   - Go to Storage
   - Initialize storage
   - Select a location close to your target users
   - Set up security rules (use the rules from `storage.rules`)

4. **Functions**:
   - Go to Functions
   - Initialize functions (if not already done)
   - Select a location close to your target users
   - Set up appropriate billing plan (Blaze plan required for external API access)

5. **Hosting**:
   - Go to Hosting
   - Set up hosting
   - Follow the setup wizard

### Setting Up Firebase CLI

1. Install Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```

2. Log in to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project (if not already done):
   ```bash
   firebase init
   ```
   - Select the services you want to use (Firestore, Functions, Hosting, Storage)
   - Select your Firebase project
   - Follow the prompts to configure each service

4. Add multiple projects to your Firebase configuration:
   ```bash
   firebase use --add
   ```
   - Select your development project and give it an alias (e.g., "dev")
   - Repeat for staging and production projects

## Deployment Environments

### Development Environment

The development environment is used for testing new features during development. It's typically deployed automatically when changes are pushed to the `develop` branch.

**Firebase Project**: Rickshaw-Dev

**Configuration**:
- Use `.env.development` for environment variables
- Less restrictive security rules for easier testing
- Debug logging enabled
- Analytics in debug mode

**Deployment Target**:
- URL: https://rickshaw-dev.web.app

### Staging Environment

The staging environment is used for testing before production deployment. It should mirror the production environment as closely as possible.

**Firebase Project**: Rickshaw-Staging

**Configuration**:
- Use `.env.staging` for environment variables
- Production-like security rules
- Minimal debug logging
- Analytics in production mode

**Deployment Target**:
- URL: https://rickshaw-staging.web.app

### Production Environment

The production environment is the live application used by end users. It should be stable and optimized for performance.

**Firebase Project**: Rickshaw-Prod

**Configuration**:
- Use `.env.production` for environment variables
- Strict security rules
- No debug logging
- Analytics in production mode
- Performance monitoring enabled

**Deployment Target**:
- URL: https://rickshaw.app (custom domain)
- Fallback URL: https://rickshaw-prod.web.app

## Continuous Integration/Deployment

Rickshaw uses GitHub Actions for CI/CD. The workflow is defined in `.github/workflows/ci-cd.yml`.

### CI/CD Pipeline

1. **Trigger**:
   - Push to `develop` branch: Deploys to development environment
   - Push to `main` branch: Deploys to production environment
   - Pull request to `develop` or `main`: Runs tests only

2. **Build Process**:
   - Install dependencies
   - Run linting
   - Run tests
   - Build the application
   - Deploy to Firebase

### Setting Up GitHub Secrets

For the CI/CD pipeline to work, you need to set up the following secrets in your GitHub repository:

1. Go to your GitHub repository
2. Navigate to Settings > Secrets > Actions
3. Add the following secrets:
   - `FIREBASE_SERVICE_ACCOUNT_DEV`: Service account key for development project
   - `FIREBASE_SERVICE_ACCOUNT_PROD`: Service account key for production project
   - `SLACK_WEBHOOK`: Webhook URL for Slack notifications (optional)

### Generating Service Account Keys

1. Go to the Firebase Console
2. Navigate to Project Settings > Service accounts
3. Click "Generate new private key"
4. Save the JSON file
5. Add the contents of the JSON file as a GitHub secret

## Manual Deployment

In case you need to deploy manually, follow these steps:

### Deploying to Development

1. Switch to the development Firebase project:
   ```bash
   firebase use dev
   ```

2. Build the application:
   ```bash
   npm run build:dev
   ```

3. Deploy to Firebase:
   ```bash
   firebase deploy
   ```

### Deploying to Staging

1. Switch to the staging Firebase project:
   ```bash
   firebase use staging
   ```

2. Build the application:
   ```bash
   npm run build:staging
   ```

3. Deploy to Firebase:
   ```bash
   firebase deploy
   ```

### Deploying to Production

1. Switch to the production Firebase project:
   ```bash
   firebase use prod
   ```

2. Build the application:
   ```bash
   npm run build
   ```

3. Deploy to Firebase:
   ```bash
   firebase deploy
   ```

### Deploying Specific Firebase Services

If you only need to deploy specific services, you can use the `--only` flag:

- Deploy only hosting:
  ```bash
  firebase deploy --only hosting
  ```

- Deploy only functions:
  ```bash
  firebase deploy --only functions
  ```

- Deploy only firestore rules:
  ```bash
  firebase deploy --only firestore:rules
  ```

- Deploy only storage rules:
  ```bash
  firebase deploy --only storage:rules
  ```

## Post-Deployment Verification

After deploying, verify that the application is working correctly:

1. **Basic Functionality Check**:
   - Visit the deployed URL
   - Sign in with a test account
   - Request a ride
   - Complete a ride
   - Check ride history

2. **Performance Check**:
   - Check page load times
   - Verify that real-time updates work
   - Test offline functionality

3. **Security Check**:
   - Verify that unauthenticated users cannot access protected resources
   - Verify that users cannot access other users' data

4. **Analytics Check**:
   - Verify that analytics events are being recorded
   - Check that custom events are working

## Rollback Procedures

If a deployment causes issues, you can roll back to a previous version:

### Rolling Back Hosting

1. List hosting deployments:
   ```bash
   firebase hosting:versions:list
   ```

2. Roll back to a specific version:
   ```bash
   firebase hosting:clone <version> <target>
   ```
   Replace `<version>` with the version ID and `<target>` with the hosting target.

### Rolling Back Functions

1. If you have the previous code:
   ```bash
   git checkout <previous-commit>
   cd functions
   npm install
   firebase deploy --only functions
   ```

2. If you don't have the previous code, you'll need to rewrite the functions to match the previous behavior.

### Rolling Back Firestore Rules

1. If you have the previous rules:
   ```bash
   git checkout <previous-commit> firestore.rules
   firebase deploy --only firestore:rules
   ```

2. If you don't have the previous rules, you can edit the rules in the Firebase Console.

## Monitoring and Alerts

### Firebase Console Monitoring

1. **Crashlytics**:
   - Go to the Firebase Console > Crashlytics
   - Monitor for crashes and errors
   - Set up email alerts for critical issues

2. **Performance Monitoring**:
   - Go to the Firebase Console > Performance
   - Monitor page load times, network requests, etc.
   - Set up performance thresholds and alerts

3. **Analytics**:
   - Go to the Firebase Console > Analytics
   - Monitor user behavior, conversion rates, etc.
   - Create custom reports for specific metrics

### Custom Monitoring

1. **Error Logging**:
   - Use the custom logger (`logger.js`) to log errors
   - Set up alerts for critical errors

2. **Performance Metrics**:
   - Use the performance monitoring utilities (`performanceMonitoring.js`) to track custom metrics
   - Set up alerts for performance degradation

3. **User Feedback**:
   - Monitor user feedback through the app
   - Address issues promptly

## Troubleshooting

### Common Deployment Issues

1. **Build Failures**:
   - Check the build logs for errors
   - Verify that all dependencies are installed
   - Check for syntax errors or linting issues

2. **Firebase Deployment Failures**:
   - Check the Firebase CLI output for errors
   - Verify that you have the correct permissions
   - Check that your Firebase project is properly configured

3. **Environment Variable Issues**:
   - Verify that all required environment variables are set
   - Check for typos in environment variable names
   - Ensure that environment variables are properly loaded

4. **Function Deployment Issues**:
   - Check for syntax errors in functions
   - Verify that functions have the correct dependencies
   - Check for issues with function triggers

### Getting Help

If you encounter issues that you cannot resolve, try the following:

1. **Firebase Support**:
   - Check the [Firebase documentation](https://firebase.google.com/docs)
   - Ask questions on [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)
   - Contact Firebase support if you have a paid plan

2. **Team Support**:
   - Reach out to the development team
   - Check the project's issue tracker
   - Consult with DevOps or infrastructure teams

---

This deployment guide is a living document. If you find any issues or have suggestions for improvements, please submit a pull request or open an issue.