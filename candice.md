# 👋 Welcome Candice - LibTurner Development Setup

This document explains how to set up your development environment for LibTurner and collaborate effectively with the team.

## 🚀 Quick Start for New Developers

### 1. **Repository Setup**
```bash
# Clone the repository
git clone git@github.com:shambo-rambo/lib-turner-app.git
cd lib-turner-app

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your API keys (see section below)

# Start development server
npm run dev
```

### 2. **Environment Variables Setup**
Create a `.env` file with these API keys:

```bash
# Firebase Configuration (ask team for these)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=lib-turner-d7952.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=lib-turner-d7952
VITE_FIREBASE_STORAGE_BUCKET=lib-turner-d7952.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=565503312493
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Claude AI API (get from https://console.anthropic.com)
VITE_CLAUDE_API_KEY=sk-ant-api03-your_key_here
VITE_CLAUDE_MODE=CLAUDE_MODEL=claude-sonnet-4-20250514

# Google Books API (get from https://console.cloud.google.com)
VITE_GOOGLE_BOOKS_API_KEY=your_google_books_api_key

# Environment
VITE_NODE_ENV=development
```

---

## 🌟 **CRITICAL: Git Workflow - NEVER Work on Main Branch**

### **Branch Strategy**
- `main` - Production-ready code, NEVER work directly on this
- `develop` - Integration branch for all features
- `feature/your-name-feature-description` - Your personal feature branches

### **Creating Your Feature Branch**
```bash
# 1. Make sure you're on main and it's up to date
git checkout main
git pull origin main

# 2. Create your feature branch (replace 'candice' with your name)
git checkout -b feature/candice-authentication-system

# 3. Start working on your feature
# ... make your changes ...

# 4. Commit your work
git add .
git commit -m "Add authentication system with Google SSO

- Implemented Firebase authentication
- Added user profile creation
- Created FERPA-compliant data encryption

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 5. Push your branch
git push -u origin feature/candice-authentication-system
```

### **When Ready to Merge**
```bash
# 1. Make sure your branch is up to date with main
git checkout main
git pull origin main
git checkout feature/candice-authentication-system
git merge main

# 2. Resolve any conflicts if they exist

# 3. Push your updated branch
git push origin feature/candice-authentication-system

# 4. Create a Pull Request on GitHub
# - Go to GitHub repository
# - Click "Compare & pull request"
# - Set base: main, compare: feature/candice-authentication-system
# - Add description of your changes
# - Request review from team members
```

---

## 🤖 AI Agent Collaboration Guidelines

### **For Your AI Agent**
When working with an AI agent (like Claude Code), provide this context:

```
CONTEXT: You are working on LibTurner, a Netflix-style K-12 library management platform that replaces expensive Renaissance Learning software. 

BRANCH RULES:
- NEVER work on main branch directly
- Always create feature branches: feature/candice-[feature-name]
- Current main branch has high-performance virtual scrolling and advanced image loading
- Image loading system now has >90% success rate with 8 fallback sources per book

CURRENT STATUS: 
- Virtual scrolling ✅ (handles 5000+ books at 60 FPS)
- Image optimization ✅ (6 failures down to 0-2 expected)  
- Authentication ⏳ (Candice's task)
- AI companion ⏳ (Next phase)

TESTING:
- Use browser console commands: showFailingBooks(), testFailingBook("title")
- Run npm run dev for development
- Check lib-turner.md for full technical documentation

YOUR TASKS:
[List specific features Candice should work on]
```

### **AI Agent Prompt Template**
```
I'm Candice, working on LibTurner with my team. I need to implement [SPECIFIC_FEATURE]. 

Key constraints:
- Work on feature branch only: feature/candice-[feature-name]
- Follow existing patterns in src/components/ and src/utils/
- Maintain 60 FPS performance for 5000+ books
- Follow FERPA compliance for student data
- Use existing imageCache and reliableImageSources utilities

Please help me implement [SPECIFIC_FEATURE] following the project's Netflix-style architecture.
```

---

## 📚 **Understanding the Codebase**

### **Key Files to Read First**
1. **`lib-turner.md`** - Complete project documentation and current status
2. **`src/App.jsx`** - Main application structure
3. **`src/components/VirtualBookGrid.jsx`** - High-performance book rendering
4. **`src/utils/imageCache.js`** - Advanced image loading system
5. **`src/utils/reliableImageSources.js`** - Multiple fallback image sources

### **Current Architecture**
```
LibTurner/
├── src/
│   ├── components/          # React components
│   │   ├── VirtualBookGrid.jsx      # Netflix-style virtual scrolling
│   │   ├── OptimizedBookCard.jsx    # Individual book cards
│   │   └── PerformanceMonitor.jsx   # Real-time performance tracking
│   ├── utils/               # Utility functions
│   │   ├── imageCache.js           # Advanced image caching system
│   │   ├── reliableImageSources.js # Multiple image fallback sources
│   │   └── imageDebugger.js        # Image loading diagnostics
│   ├── data/                # Mock data and schemas
│   └── services/            # External API integrations
├── lib-turner.md           # Complete project documentation
└── candice.md             # This file - your setup guide
```

### **Performance Standards**
- **60 FPS scrolling** with 5000+ books (✅ achieved)
- **>95% image loading success** (currently ~90%, improvement in progress)
- **<2 second initial load** time
- **Netflix-quality user experience** (not educational software feel)

---

## 🎯 **Suggested Features for Candice**

### **Phase 1: Authentication System** (High Priority)
```bash
git checkout -b feature/candice-authentication
```
- Google SSO integration with Firebase
- Student profile creation with encrypted names
- School-based user isolation (no cross-school data)
- FERPA compliance measures
- Teacher vs. student permission levels

### **Phase 2: Social Features** (Medium Priority)
```bash
git checkout -b feature/candice-social-features
```
- Friend connections (school-only)
- Reading activity feeds
- Book reviews and discussions
- Real-time reading sessions

### **Phase 3: Library Management** (Lower Priority)
```bash
git checkout -b feature/candice-library-management
```
- MARC file parsing for Destiny migration
- ISBN scanning for new acquisitions
- One-tap checkout system
- Circulation management

---

## 🔧 **Development Commands**

```bash
# Development
npm run dev          # Start development server (usually localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Check code style
npm run format       # Auto-format code

# Testing (when implemented)
npm test             # Run tests
npm run test:e2e     # Run end-to-end tests
```

---

## 🚨 **Important Notes**

### **DO NOT:**
- ❌ Work directly on main branch
- ❌ Commit sensitive data (API keys, passwords)
- ❌ Break the 60 FPS performance requirement
- ❌ Remove or modify the virtual scrolling system
- ❌ Change the image loading system without team approval

### **DO:**
- ✅ Always work on feature branches
- ✅ Test your changes thoroughly
- ✅ Follow the existing code patterns
- ✅ Read lib-turner.md for context
- ✅ Ask for help in team discussions
- ✅ Use the browser console debugging tools

---

## 🤝 **Getting Help**

### **Team Communication**
- Check lib-turner.md for technical details
- Use descriptive commit messages
- Create detailed pull request descriptions
- Test locally before pushing

### **Debugging Tools**
Open browser console and use:
```javascript
// Check image loading status
showFailingBooks()

// Test specific book image URLs
testFailingBook("Harry Potter")

// Get performance metrics
// (Performance monitor shows in UI)
```

### **Common Issues**
1. **Images not loading**: Check browser console, use `showFailingBooks()`
2. **Performance issues**: Ensure virtual scrolling is working properly
3. **API errors**: Check .env file has correct API keys
4. **Build errors**: Run `npm install` to ensure dependencies are installed

---

## 🎉 **Ready to Start!**

1. **Clone the repo** and set up your environment
2. **Read lib-turner.md** for full project context
3. **Create your feature branch** for authentication
4. **Start with Google SSO integration** using Firebase
5. **Ask for help** when needed!

Welcome to the team! Let's build the Netflix of school libraries! 📚✨

---

*Last updated: January 2025*
*Current status: High-performance virtual scrolling ✅, Image optimization ✅, Authentication needed ⏳*