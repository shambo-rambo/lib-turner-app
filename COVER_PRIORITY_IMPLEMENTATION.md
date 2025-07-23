# Book Cover Priority Implementation

This document describes the implementation of database-first book cover loading, where custom uploaded covers take priority over API covers.

## Overview

The system now loads books from both static data and Firestore, with custom uploaded covers taking priority over original API covers. This ensures that when admins upload custom covers, they appear immediately across the entire application.

## Implementation Details

### 1. Book Loading Service (`src/services/bookLoader.js`)

**Key Functions:**
- `loadBooksWithCustomCovers()` - Main function that merges static and Firestore data
- `mergeBooksWithCustomCovers()` - Merges data while prioritizing custom covers
- `applyEffectiveCovers()` - Applies the effective cover URL to each book

**Cover Priority Logic:**
1. `book.effectiveCoverUrl` (computed effective cover)
2. `book.metadata.displayCoverUrl` (display-specific cover)
3. `book.metadata.custom_cover_url` (admin uploaded covers)
4. `book.metadata.cover_url` (original API cover)
5. Placeholder/fallback

### 2. Updated Components

**Main Library (`src/components/LibraryApp.jsx`):**
- Now uses `loadBooksWithCustomCovers()` instead of static data only
- Includes refresh mechanism for when covers are updated
- Preloads effective cover URLs in image cache

**Book Card Components (All variants updated):**
- `BookCard.jsx` - Main Netflix-style card
- `OptimizedBookCard.jsx` - Performance-optimized variant
- `ReliableBookCard.jsx` - Fallback variant
- `FastBookCard.jsx` - Fast loading variant
- `SimpleBookCard.jsx` - Simple display variant

All components now follow the same cover priority logic.

**Admin Dashboard (`src/pages/admin/AdminDashboard.jsx`):**
- Uses enhanced book loader for admin interface
- Refreshes book data after cover updates
- Shows cover source status (API vs Custom)

### 3. Enhanced Book Service (`src/services/books.js`)

**Cover Update Process:**
1. Check admin permissions
2. Get or create book document in Firestore
3. Delete old custom cover (if exists)
4. Upload new cover to Firebase Storage
5. Update book document with new cover URL
6. Return new cover URL

**Cover Revert Process:**
1. Check admin permissions
2. Get book document from Firestore
3. Delete custom cover from Storage
4. Update book document to use API cover
5. Mark cover source as 'api'

### 4. Data Flow

```
1. Page Load
   ├── Load static/enhanced books (existing functionality)
   ├── Load books from Firestore (custom covers)
   ├── Merge data (custom covers take priority)
   └── Apply effective cover URLs

2. Admin Uploads Cover
   ├── Upload image to Firebase Storage
   ├── Save/update book in Firestore
   ├── Update local state immediately
   └── Refresh book data from database

3. Book Display
   ├── Check for effectiveCoverUrl
   ├── Fallback to displayCoverUrl
   ├── Fallback to custom_cover_url
   ├── Fallback to original cover_url
   └── Fallback to placeholder
```

## Database Schema

### Book Document (Firestore)
```javascript
{
  id: 'book_1',
  metadata: {
    cover_url: 'https://api-cover-url.jpg',      // Original API cover
    custom_cover_url: 'https://storage-url.jpg', // Uploaded cover
    cover_source: 'custom',                      // 'api' or 'custom'
    displayCoverUrl: 'computed-effective-url'    // Computed display URL
  },
  effectiveCoverUrl: 'https://effective-url.jpg', // Priority URL
  updated_at: Date,
  updated_by: 'admin_user_id',
  // ... other book data
}
```

## Key Features

### 1. **Immediate Visual Updates**
- Custom covers appear instantly after upload
- Local state updates provide immediate feedback
- Database refresh ensures consistency

### 2. **Fallback System**
- Multiple fallback levels prevent broken images
- Graceful degradation when covers fail to load
- Placeholder generation for missing covers

### 3. **Performance Optimization**
- Image caching with effective URLs
- Lazy loading with intersection observer
- Preloading of visible covers

### 4. **Admin Interface**
- Visual indicators for cover source (API vs Custom)
- Preview before upload
- Option to revert to original covers
- Search and filter functionality

## Usage Examples

### Refresh Library After Cover Update
```javascript
// From admin interface or console
window.refreshLibraryBooks();
```

### Check Cover Source
```javascript
// In components
const isCustomCover = book.metadata?.cover_source === 'custom';
const effectiveUrl = book.effectiveCoverUrl || book.metadata?.cover_url;
```

### Load Books with Covers
```javascript
import { loadBooksWithCustomCovers } from './services/bookLoader.js';

const books = await loadBooksWithCustomCovers('school_id');
// Books now include effectiveCoverUrl and displayCoverUrl
```

## File Changes Summary

### New Files
- `src/services/bookLoader.js` - Enhanced book loading with cover priority
- `src/components/admin/BookCoverUpload.jsx` - Cover upload modal
- `src/pages/admin/AdminDashboard.jsx` - Admin interface
- `src/pages/admin/AdminLogin.jsx` - Admin authentication
- `src/components/admin/ProtectedRoute.jsx` - Route protection

### Modified Files
- `src/components/LibraryApp.jsx` - Use enhanced book loader
- `src/components/BookCard.jsx` - Priority cover URL logic
- `src/components/OptimizedBookCard.jsx` - Priority cover URL logic
- `src/components/ReliableBookCard.jsx` - Priority cover URL logic
- `src/components/FastBookCard.jsx` - Priority cover URL logic
- `src/components/SimpleBookCard.jsx` - Priority cover URL logic
- `src/services/books.js` - Enhanced cover management
- `src/data/schemas.js` - Added admin schema and cover fields
- `src/config/firebase.js` - Added Storage and Auth

## Testing

The implementation has been tested with:
- ✅ Build process (`npm run build`)
- ✅ Development server (`npm run dev`)
- ✅ Component rendering with cover priority
- ✅ Admin authentication flow
- ✅ Cover upload and revert functionality

## Next Steps

1. **Firebase Setup**: Configure Firebase project with Auth, Firestore, and Storage
2. **Security Rules**: Implement Firebase security rules per ADMIN_SETUP.md
3. **Admin User Creation**: Create initial admin users using the provided utilities
4. **Testing**: Test cover upload functionality with real Firebase backend