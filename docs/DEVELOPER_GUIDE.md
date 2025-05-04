# Rickshaw Developer Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Architecture](#architecture)
4. [Development Environment Setup](#development-environment-setup)
5. [Key Components](#key-components)
6. [State Management](#state-management)
7. [Firebase Integration](#firebase-integration)
8. [Testing](#testing)
9. [Performance Optimization](#performance-optimization)
10. [Deployment](#deployment)
11. [Contributing Guidelines](#contributing-guidelines)
12. [Troubleshooting](#troubleshooting)

## Introduction

This developer guide provides comprehensive information about the Rickshaw ride-sharing application's codebase, architecture, and development workflows. It's designed to help new developers get up to speed quickly and serve as a reference for experienced team members.

Rickshaw is a modern ride-sharing application built with React, Firebase, and various other technologies. It connects passengers with drivers, provides real-time location tracking, handles payments, and includes rating systems for both passengers and drivers.

## Project Structure

The project follows a feature-based structure with shared components, utilities, and hooks:

```
rickshaw/
├── .github/                # GitHub Actions workflows
├── docs/                   # Documentation
├── functions/              # Firebase Cloud Functions
├── public/                 # Static assets
│   ├── icons/              # App icons
│   ├── manifest.json       # PWA manifest
│   ├── offline.html        # Offline fallback page
│   └── service-worker.js   # Service worker for offline support
├── src/                    # Source code
│   ├── components/         # Reusable components
│   ├── context/            # React context providers
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   ├── styles/             # CSS files
│   ├── utils/              # Utility functions
│   ├── App.jsx             # Main App component
│   ├── firebase.js         # Firebase initialization
│   └── main.jsx            # Entry point
├── .eslintrc.js            # ESLint configuration
├── .gitignore              # Git ignore file
├── firebase.json           # Firebase configuration
├── firestore.rules         # Firestore security rules
├── storage.rules           # Storage security rules
├── package.json            # NPM package configuration
└── README.md               # Project overview
```

## Architecture

Rickshaw follows a component-based architecture with React as the UI library and Firebase as the backend service:

### Frontend
- **React**: UI library for building the user interface
- **React Router**: For navigation and routing
- **Context API**: For state management
- **Custom Hooks**: For reusable logic

### Backend
- **Firebase Authentication**: For user authentication
- **Firestore**: For database storage
- **Firebase Storage**: For file storage
- **Firebase Functions**: For serverless backend logic
- **Firebase Hosting**: For deployment

### Key Architectural Patterns
- **Component Composition**: Building complex UIs from simple components
- **Container/Presentational Pattern**: Separating logic from presentation
- **Custom Hooks**: Extracting reusable logic
- **Context Providers**: Managing global state
- **Error Boundaries**: Handling errors gracefully

## Development Environment Setup

### Prerequisites
- Node.js (v16 or later)
- npm (v7 or later)
- Git

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/rickshaw.git
   cd rickshaw
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase:
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com)
   - Enable Authentication, Firestore, Storage, and Functions
   - Add a web app to your Firebase project
   - Copy the Firebase configuration

4. Create environment files:
   - Create `.env.development` and `.env.production` files
   - Add your Firebase configuration:
     ```
     VITE_FIREBASE_API_KEY=your-api-key
     VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
     VITE_FIREBASE_PROJECT_ID=your-project-id
     VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
     VITE_FIREBASE_APP_ID=your-app-id
     VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
     ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Firebase Emulator Setup
For local development, you can use the Firebase Emulator Suite:

1. Install the Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Log in to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase Emulator Suite:
   ```bash
   firebase init emulators
   ```

4. Start the emulators:
   ```bash
   firebase emulators:start
   ```

## Key Components

### Authentication Components
- **AuthProvider**: Context provider for authentication state
- **LoginForm**: Component for user login
- **RegisterForm**: Component for user registration
- **PrivateRoute**: Route component that requires authentication

### Ride Components
- **RideRequest**: Component for requesting a ride
- **RideMap**: Component for displaying the ride map
- **RideDetails**: Component for displaying ride details
- **RideHistory**: Component for displaying past rides

### User Components
- **UserProfile**: Component for displaying and editing user profile
- **RatingSystem**: Component for rating drivers/passengers
- **PaymentService**: Component for handling payments

### Admin Components
- **AdminPanel**: Component for admin dashboard
- **UserManagement**: Component for managing users
- **RideAnalytics**: Component for analyzing ride data

### Utility Components
- **ErrorBoundary**: Component for handling errors
- **LoadingIndicator**: Component for displaying loading states
- **PaginatedList**: Component for displaying paginated lists

## State Management

Rickshaw uses React's Context API for state management:

### Authentication Context
- **AuthContext**: Manages user authentication state
- **useAuth**: Hook for accessing authentication state and methods

### Firestore Context
- **FirestoreContext**: Provides access to Firestore operations
- **useFirestore**: Hook for Firestore CRUD operations
- **useCollection**: Hook for accessing Firestore collections
- **useDocument**: Hook for accessing Firestore documents

### UI Context
- **UIContext**: Manages UI state (modals, notifications, etc.)
- **useUI**: Hook for accessing UI state and methods

## Firebase Integration

### Authentication
- **firebase.js**: Initializes Firebase and exports auth instance
- **AuthContext.jsx**: Provides authentication state and methods
- **useAuth.js**: Hook for accessing authentication functionality

### Firestore
- **useFirestore.js**: Hooks for Firestore operations
- **firestoreOptimizer.js**: Utilities for optimizing Firestore queries

### Storage
- **useStorage.js**: Hook for Firebase Storage operations

### Cloud Functions
- **functions/index.js**: Firebase Cloud Functions
- **functions/rides.js**: Functions for ride management
- **functions/users.js**: Functions for user management
- **functions/payments.js**: Functions for payment processing

## Testing

### Unit Testing
- **Jest**: Testing framework
- **React Testing Library**: For testing React components
- **testUtils.js**: Utilities for testing Firebase components

### Integration Testing
- **Cypress**: End-to-end testing framework
- **Firebase Emulator**: For testing Firebase integration

### Running Tests
- Unit tests: `npm test`
- Integration tests: `npm run test:integration`
- Coverage report: `npm run test:coverage`

## Performance Optimization

### Code Splitting
- **lazyLoad.js**: Utilities for lazy loading components
- **React.lazy()**: For code splitting

### Firebase Optimization
- **firestoreOptimizer.js**: Utilities for optimizing Firestore queries
- **Query caching**: Caching Firestore queries to reduce reads
- **Field selection**: Selecting only needed fields from documents

### React Optimization
- **Memoization**: Using React.memo, useMemo, and useCallback
- **Virtual lists**: For rendering large lists efficiently
- **Pagination**: For loading data in chunks

### Monitoring
- **performanceMonitoring.js**: Utilities for Firebase Performance Monitoring
- **analytics.js**: Utilities for Firebase Analytics
- **crashlytics.js**: Utilities for Firebase Crashlytics
- **logger.js**: Custom logging utilities

## Deployment

### Continuous Integration/Deployment
- **GitHub Actions**: Automated testing and deployment
- **.github/workflows/ci-cd.yml**: CI/CD workflow configuration

### Environment Configuration
- **firebaseConfig.js**: Environment-specific Firebase configuration
- **.env.development**: Development environment variables
- **.env.production**: Production environment variables

### Deployment Process
1. Merge changes to the `develop` branch for staging deployment
2. Merge changes to the `main` branch for production deployment
3. GitHub Actions will automatically:
   - Run tests
   - Build the application
   - Deploy to Firebase Hosting

### Manual Deployment
```bash
# Build the application
npm run build

# Deploy to Firebase
firebase deploy
```

## Contributing Guidelines

### Code Style
- Follow the ESLint configuration
- Use Prettier for code formatting
- Follow the component structure guidelines

### Git Workflow
1. Create a feature branch from `develop`
2. Make your changes
3. Write tests for your changes
4. Submit a pull request to `develop`
5. Wait for code review and approval
6. Merge to `develop`

### Pull Request Process
1. Ensure all tests pass
2. Update documentation if necessary
3. Get at least one code review approval
4. Squash and merge to the target branch

### Commit Message Format
Follow the conventional commits format:
```
type(scope): subject

body

footer
```

Types:
- feat: A new feature
- fix: A bug fix
- docs: Documentation changes
- style: Code style changes (formatting, etc.)
- refactor: Code changes that neither fix bugs nor add features
- perf: Performance improvements
- test: Adding or updating tests
- chore: Changes to the build process or auxiliary tools

## Troubleshooting

### Common Issues

#### Firebase Connection Issues
- Check your Firebase configuration
- Ensure you have the correct permissions
- Verify your Firebase project is properly set up

#### Build Errors
- Clear the cache: `npm run clean`
- Reinstall dependencies: `npm ci`
- Check for conflicting dependencies

#### Testing Issues
- Ensure Firebase Emulator is running for integration tests
- Mock Firebase services for unit tests
- Use the test utilities provided in `testUtils.js`

### Debugging

#### React DevTools
- Install the React DevTools browser extension
- Use the Components tab to inspect component state
- Use the Profiler tab to identify performance issues

#### Firebase Console
- Use the Firebase Console to inspect database data
- Check the Authentication tab for user issues
- View logs in the Functions tab

#### Performance Monitoring
- Use the Firebase Performance dashboard
- Check the Network tab in browser DevTools
- Use the performance utilities in `performanceMonitoring.js`

---

This developer guide is a living document. If you find any issues or have suggestions for improvements, please submit a pull request or open an issue.