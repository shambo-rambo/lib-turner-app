# LibFlix Admin Setup Guide

This guide explains how to set up and use the admin functionality for book cover uploads in LibFlix.

## Features Added

- **Admin Authentication**: Secure login system for administrators
- **Book Cover Upload**: Upload custom book covers to replace API-sourced covers  
- **Firebase Integration**: Uses Firebase Auth, Firestore, and Storage
- **Permission System**: Role-based access control for admin features
- **Responsive UI**: Admin dashboard with book management interface

## Database Schema Changes

### New Admin Schema
```javascript
{
  id: '', // UUID
  email: '', // Admin email
  name: '', // Full name  
  school_id: '', // Associated school
  user_type: 'admin', // Always 'admin'
  permissions: {
    manage_books: true,
    manage_students: true, 
    view_analytics: true,
    upload_covers: true,
    moderate_reviews: true
  },
  created_at: Date,
  updated_at: Date,
  last_login: Date
}
```

### Updated Book Schema
```javascript
{
  // ... existing fields
  metadata: {
    // ... existing fields
    cover_url: '', // Default/API cover URL
    custom_cover_url: '', // Admin uploaded cover URL  
    cover_source: 'api', // 'api' or 'custom'
    // ... other fields
  }
}
```

### Updated Student Schema
```javascript
{
  // ... existing fields
  user_type: 'student', // 'student' or 'admin'
  // ... other fields
}
```

## Setup Instructions

### 1. Firebase Configuration

Ensure your Firebase project has the following services enabled:
- **Authentication**: For admin login
- **Firestore**: For storing user and book data
- **Storage**: For uploading book cover images

Update your `.env` file with Firebase config:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 2. Create Initial Admin User

#### Option A: Browser Console (Development)
1. Start the dev server: `npm run dev`
2. Open browser console at `http://localhost:5174`
3. Run: `createAdminUser('admin@example.com', 'your-password', 'school-id')`

#### Option B: Programmatically
```javascript
import { createDefaultAdmin } from './src/utils/adminSetup.js';

await createDefaultAdmin('admin@example.com', 'password123', 'school_id');
```

### 3. Firebase Security Rules

#### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin users collection
    match /admins/{adminId} {
      allow read, write: if request.auth != null && request.auth.uid == adminId;
    }
    
    // Books collection - admins can write, everyone can read
    match /books/{bookId} {
      allow read: if true;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/admins/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.permissions.upload_covers == true;
    }
  }
}
```

#### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Book covers can be uploaded by admins only
    match /book-covers/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        firestore.exists(/databases/(default)/documents/admins/$(request.auth.uid)) &&
        firestore.get(/databases/(default)/documents/admins/$(request.auth.uid)).data.permissions.upload_covers == true;
    }
  }
}
```

## Usage

### Accessing Admin Panel
1. Navigate to `/admin/login` 
2. Sign in with admin credentials
3. Access dashboard at `/admin/dashboard`

### Uploading Book Covers
1. In the admin dashboard, search for a book
2. Click "Update Cover" button
3. Select an image file (JPEG, PNG, WebP - max 5MB)
4. Preview and upload
5. Option to revert to original API cover

### Admin Features
- **Book Search**: Search by title, author, or ISBN
- **Cover Management**: Upload custom covers or revert to originals
- **Image Optimization**: Automatic compression and resizing
- **Audit Trail**: Track who uploaded covers and when
- **Permission Checks**: Role-based access control

## API Reference

### Authentication Service
```javascript
import { signInAdmin, signOutUser, getCurrentUser, hasPermission } from './services/auth.js';

// Sign in admin
const admin = await signInAdmin('email', 'password');

// Check permissions  
const canUpload = await hasPermission('upload_covers');

// Get current user
const user = await getCurrentUser();
```

### Book Management Service
```javascript
import { updateBookCover, revertBookCover, getBook, searchBooks } from './services/books.js';

// Update book cover
const newUrl = await updateBookCover(bookId, imageFile, adminId);

// Revert to original cover
await revertBookCover(bookId, adminId);

// Search books
const books = await searchBooks('search term', schoolId);
```

### Image Upload Service  
```javascript
import { uploadBookCover, validateImageFile, deleteBookCover } from './services/imageUpload.js';

// Validate image file
const validation = validateImageFile(file);

// Upload cover
const url = await uploadBookCover(file, bookId, adminId);
```

## File Structure

```
src/
├── components/
│   ├── admin/
│   │   ├── ProtectedRoute.jsx      # Auth guard for admin routes
│   │   └── BookCoverUpload.jsx     # Cover upload modal
│   └── LibraryApp.jsx              # Main public library interface
├── pages/
│   └── admin/
│       ├── AdminLogin.jsx          # Admin login page
│       └── AdminDashboard.jsx      # Admin dashboard
├── services/
│   ├── auth.js                     # Authentication service
│   ├── books.js                    # Book management service
│   └── imageUpload.js              # Image upload service
├── data/
│   └── schemas.js                  # Updated with admin schema
└── utils/
    └── adminSetup.js               # Admin user creation helpers
```

## Troubleshooting

### Common Issues

1. **Build Errors**: Ensure all dependencies are installed with `npm install`
2. **Firebase Errors**: Check that all Firebase services are enabled
3. **Permission Denied**: Verify Firestore and Storage security rules
4. **Image Upload Fails**: Check file size (max 5MB) and format (JPEG/PNG/WebP)

### Development Commands

```bash
# Start development server
npm run dev

# Build for production  
npm run build

# Run linting
npm run lint
```