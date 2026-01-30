# AI Counsellor - Study Abroad Platform

A comprehensive MERN stack application that helps students make informed study-abroad decisions through AI-powered guidance, live university data, and personalized recommendations.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [How It Works](#how-it-works)
7. [API Documentation](#api-documentation)
8. [AI System](#ai-system)
9. [External APIs](#external-apis)
10. [Database Schema](#database-schema)
11. [Setup Instructions](#setup-instructions)
12. [Environment Variables](#environment-variables)
13. [User Flow](#user-flow)

---

## 🌟 Overview

AI Counsellor is an intelligent study abroad guidance platform that combines:
- **AI-powered conversational counselling** using Google Gemini
- **Live university data** from global university APIs
- **Personalized recommendations** based on user profile, budget, and goals
- **Application tracking** with AI-generated task lists

The platform guides students through their entire study abroad journey - from profile building to university shortlisting to application preparation.

---

## ✨ Features

### Core Features
| Feature | Description |
|---------|-------------|
| **User Authentication** | Secure signup/login with JWT tokens (7-day expiry) |
| **Mandatory Onboarding** | 4-step profile collection (academic, goals, budget, exams) |
| **Dashboard** | Stage indicators, profile strength analysis, to-do list |
| **AI Counsellor** | Natural language chat powered by Google Gemini |
| **Live University Search** | Real-time university data from global API |
| **University Shortlisting** | Categorize as Dream/Target/Safe schools |
| **University Locking** | Commit to universities before application guidance |
| **Application Guide** | AI-generated tasks with deadlines |
| **Profile Management** | Edit academic info, exams, budget anytime |

### AI Capabilities
- Profile strength analysis and gap identification
- Personalized university recommendations
- Risk assessment for each university
- Chat-based shortlisting ("Shortlist Stanford as a dream")
- Chat-based locking ("Lock MIT")
- Application timeline and deadline guidance
- SOP writing tips
- Budget and funding advice

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │Dashboard │ │AI Chat   │ │University│ │Profile   │            │
│  │Page      │ │Page      │ │Search    │ │Page      │            │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘            │
│       │            │            │            │                   │
│       └────────────┴────────────┴────────────┘                   │
│                          │                                       │
│                    ┌─────┴─────┐                                 │
│                    │ API Layer │ (Axios)                         │
│                    └─────┬─────┘                                 │
└──────────────────────────┼───────────────────────────────────────┘
                           │ HTTP/REST
┌──────────────────────────┼───────────────────────────────────────┐
│                    BACKEND (Express.js)                          │
│                    ┌─────┴─────┐                                 │
│                    │  Router   │                                 │
│                    └─────┬─────┘                                 │
│       ┌──────────────────┼──────────────────┐                    │
│       │                  │                  │                    │
│  ┌────┴────┐       ┌─────┴─────┐      ┌─────┴─────┐             │
│  │Auth     │       │User       │      │AI         │             │
│  │Routes   │       │Routes     │      │Routes     │             │
│  └────┬────┘       └─────┬─────┘      └─────┬─────┘             │
│       │                  │                  │                    │
│       │            ┌─────┴─────┐      ┌─────┴─────┐             │
│       │            │University │      │Google     │             │
│       │            │API Service│      │Gemini API │             │
│       │            └─────┬─────┘      └───────────┘             │
│       │                  │                                       │
│       └──────────────────┼───────────────────────────────────────│
│                    ┌─────┴─────┐                                 │
│                    │ MongoDB   │                                 │
│                    │ (Atlas)   │                                 │
│                    └───────────┘                                 │
└──────────────────────────────────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │   EXTERNAL SERVICES     │
              │  ┌──────────────────┐   │
              │  │Hipo Labs API     │   │
              │  │(University Data) │   │
              │  └──────────────────┘   │
              │  ┌──────────────────┐   │
              │  │Google Gemini API │   │
              │  │(AI Responses)    │   │
              │  └──────────────────┘   │
              └─────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| React Router v6 | Client-side routing |
| Axios | HTTP client for API calls |
| React Icons | Icon library |
| React Hot Toast | Toast notifications |
| CSS3 | Styling (no CSS framework) |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express.js | Web framework |
| MongoDB | Database |
| Mongoose | MongoDB ODM |
| JWT | Authentication tokens |
| bcryptjs | Password hashing |
| @google/generative-ai | Gemini AI integration |
| Axios | External API calls |

### External Services
| Service | Purpose |
|---------|---------|
| MongoDB Atlas | Cloud database |
| Google Gemini API | AI chat responses |
| Hipo Labs Universities API | Live university data |

---

## 📁 Project Structure

```
study-abroad-platform/
├── backend/
│   ├── middleware/
│   │   └── auth.js              # JWT authentication middleware
│   ├── models/
│   │   ├── User.js              # User schema with profile & selections
│   │   ├── University.js        # University schema (fallback data)
│   │   ├── Task.js              # Application tasks schema
│   │   └── ChatHistory.js       # AI conversation history
│   ├── routes/
│   │   ├── auth.js              # Signup/Login endpoints
│   │   ├── user.js              # Profile & onboarding endpoints
│   │   ├── university.js        # Static university endpoints
│   │   ├── liveUniversity.js    # Live API university endpoints
│   │   ├── ai.js                # AI chat endpoints
│   │   └── task.js              # Task management endpoints
│   ├── services/
│   │   ├── universityApi.js     # Hipo Labs API integration
│   │   └── liveUniversityApi.js # Enhanced live university service
│   ├── scripts/
│   │   └── seedUniversities.js  # Database seeding script
│   ├── server.js                # Express app entry point
│   ├── .env.example             # Environment variables template
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── assets/
│   │   │   └── logo.png         # Application logo
│   │   ├── components/
│   │   │   ├── Layout.js        # Main layout with sidebar
│   │   │   ├── Layout.css
│   │   │   ├── ProtectedRoute.js # Auth route wrapper
│   │   │   ├── UniversityCard.js # University display card
│   │   │   └── UniversityCard.css
│   │   ├── context/
│   │   │   └── AuthContext.js   # Authentication state management
│   │   ├── pages/
│   │   │   ├── Landing.js       # Public landing page
│   │   │   ├── Login.js         # Login page
│   │   │   ├── Signup.js        # Signup page
│   │   │   ├── Onboarding.js    # 4-step onboarding wizard
│   │   │   ├── Dashboard.js     # Main dashboard
│   │   │   ├── AICounsellor.js  # AI chat interface
│   │   │   ├── LiveUniversities.js # University search
│   │   │   ├── Shortlisted.js   # Shortlist management
│   │   │   ├── ApplicationGuide.js # Task tracking
│   │   │   ├── Profile.js       # Profile settings
│   │   │   └── *.css            # Page-specific styles
│   │   ├── services/
│   │   │   ├── api.js           # Axios instance with interceptors
│   │   │   └── liveUniversityApi.js # University API functions
│   │   ├── App.js               # Main app with routing
│   │   ├── index.js             # React entry point
│   │   └── index.css            # Global styles
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## ⚙️ How It Works

### 1. Authentication Flow
```
User Signup/Login → JWT Token Generated → Token Stored in LocalStorage
                                               ↓
                    All API Requests Include → Authorization: Bearer <token>
                                               ↓
                    Backend Middleware Verifies → User ID Extracted from Token
```

### 2. Onboarding Process
The 4-step onboarding collects:
1. **Academic Background**: Education level, degree, major, GPA
2. **Study Goals**: Intended degree, field, target countries, intake year
3. **Budget**: Min/max budget, funding plan (self-funded/scholarship/loan)
4. **Exams**: Status of IELTS, TOEFL, GRE, GMAT, SOP

### 3. University Discovery
```
User selects country → Frontend calls /api/live-universities/by-country
                            ↓
Backend calls Hipo Labs API → Fetches real university list
                            ↓
Data transformed with generated → Tuition, ranking, acceptance rates
realistic values                  (based on country averages)
                            ↓
Universities displayed with → Filter, search, sort options
profile match scoring
```

### 4. AI Chat System
```
User sends message → POST /api/ai/chat
                        ↓
Backend analyzes intent → Shortlist? Lock? Question? Recommendation?
                        ↓
If action detected → Process action (add to shortlist, lock, etc.)
                        ↓
Context built with → User profile, shortlist, locked unis, chat history
                        ↓
Google Gemini API called → With system prompt + context + user message
                        ↓
AI response returned → With any action results embedded
```

### 5. Profile Strength Calculation
```javascript
// Academics (30 points)
- GPA provided: +15 points
- Education level: +15 points

// Exams (40 points)
- IELTS/TOEFL completed: +20 points
- GRE/GMAT completed: +20 points

// Documents (30 points)
- SOP ready: +30 points
- SOP draft: +15 points
```

### 6. University Categorization
```
DREAM Schools (High Risk):
- Acceptance rate < 15% OR
- Ranking < 30

TARGET Schools (Medium Risk):
- Acceptance rate 15-40% OR
- Ranking 30-80

SAFE Schools (Low Risk):
- Acceptance rate > 40% AND
- Ranking > 80
```

---

## 📡 API Documentation

### Authentication Endpoints

#### POST /api/auth/signup
Create a new user account.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "fullName": "John Doe",
    "email": "john@example.com",
    "onboardingCompleted": false
  }
}
```

#### POST /api/auth/login
Authenticate existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

---

### User Endpoints

#### GET /api/user/profile
Get current user's profile (requires auth).

#### POST /api/user/onboarding
Complete onboarding with profile data.

#### PUT /api/user/profile
Update user profile fields.

#### GET /api/user/profile-strength
Get profile completion percentage and strength analysis.

---

### Live University Endpoints

#### GET /api/live-universities/search?q={query}
Search universities by name globally.

#### GET /api/live-universities/by-country/{country}
Get all universities for a specific country.

#### GET /api/live-universities/for-me
Get personalized recommendations based on user profile.

#### GET /api/live-universities/my-selections
Get user's shortlisted and locked universities.

#### POST /api/live-universities/shortlist
Add university to shortlist.

**Request Body:**
```json
{
  "universityId": "...",
  "universityName": "Stanford University",
  "country": "United States",
  "category": "dream",
  "tuitionFee": 55000,
  "livingCostPerYear": 20000
}
```

#### DELETE /api/live-universities/shortlist/{universityId}
Remove from shortlist.

#### POST /api/live-universities/lock
Lock a university (commit to applying).

#### DELETE /api/live-universities/lock/{universityId}
Unlock a university.

---

### AI Endpoints

#### POST /api/ai/chat
Send message to AI counsellor.

**Request Body:**
```json
{
  "message": "Recommend universities for MS in Computer Science"
}
```

**Response:**
```json
{
  "response": "Based on your profile...",
  "actions": [],
  "universityCards": [...],
  "user": {...}
}
```

#### GET /api/ai/history
Get chat history for current user.

#### DELETE /api/ai/history
Clear chat history.

---

### Task Endpoints

#### GET /api/tasks
Get all tasks for current user.

#### POST /api/tasks
Create a new task.

#### PUT /api/tasks/{id}
Update task (mark complete, change priority).

#### DELETE /api/tasks/{id}
Delete a task.

#### POST /api/tasks/generate/{universityId}
Generate AI tasks for a locked university.

---

## 🤖 AI System

### Google Gemini Integration

The AI system uses **Google Gemini 1.5 Flash** model for fast, intelligent responses.

**File:** `backend/routes/ai.js`

### System Prompt Structure
```
You are an AI Study Abroad Counsellor helping students...

USER PROFILE:
- Name: {fullName}
- Education: {educationLevel} in {major}
- Target: {intendedDegree} in {fieldOfStudy}
- Countries: {preferredCountries}
- Budget: ${budgetMin} - ${budgetMax}/year
- Exams: IELTS ({status}), GRE ({status})...

CURRENT STATUS:
- Shortlisted: {count} universities
- Locked: {count} universities
- Profile Gaps: {gaps}

CONVERSATION HISTORY:
{last 10 messages}
```

### Intent Detection
The AI routes handle specific intents:

| Intent | Trigger Words | Action |
|--------|--------------|--------|
| Shortlist | "shortlist", "add to my list" | Add university to shortlist |
| Lock | "lock", "finalize", "commit" | Lock university |
| Recommendations | "recommend", "suggest", "show universities" | Return university cards |
| Show Shortlist | "show my shortlist", "view shortlist" | Display shortlisted unis |
| Profile Help | "profile", "improve my chances" | Profile analysis |
| SOP Help | "sop", "statement of purpose" | SOP writing tips |
| Budget | "budget", "cost", "afford" | Cost breakdown |

### AI Response Features
1. **Structured Responses**: Markdown formatting with headers, lists, bold text
2. **Action Confirmation**: Clear feedback when shortlisting/locking
3. **University Cards**: Rich card data returned for UI rendering
4. **Contextual Suggestions**: Next steps based on current stage

---

## 🌐 External APIs

### 1. Hipo Labs Universities API

**Base URL:** `http://universities.hipolabs.com/search`

**Purpose:** Provides real university names and basic info globally.

**Endpoints Used:**
- `GET /search?country={country}` - Get universities by country
- `GET /search?name={query}` - Search universities by name

**Response Example:**
```json
[
  {
    "name": "Stanford University",
    "country": "United States",
    "state-province": "California",
    "web_pages": ["https://www.stanford.edu"],
    "domains": ["stanford.edu"]
  }
]
```

**Data Enhancement:**
Since the API only provides basic info, we generate realistic additional data:

```javascript
// Generated based on country averages + hash of university name
{
  ranking: countryDefaults.baseRanking + (nameHash % 200),
  acceptanceRate: 30 + (nameHash % 40),
  tuitionFee: countryDefaults.avgTuition + variation,
  livingCostPerYear: countryDefaults.avgLivingCost + variation,
  scholarshipsAvailable: nameHash % 3 !== 0,
  programs: generatePrograms(...)
}
```

### 2. Google Gemini API

**Package:** `@google/generative-ai`

**Model:** `gemini-1.5-flash`

**Purpose:** Powers the AI Counsellor chat system.

**Configuration:**
```javascript
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 1024
  }
});
```

**Usage:**
```javascript
const result = await model.generateContent(fullPrompt);
const response = result.response.text();
```

---

## 🗄️ Database Schema

### User Model
```javascript
{
  // Authentication
  fullName: String,
  email: String (unique),
  password: String (hashed),
  
  // Onboarding
  onboardingCompleted: Boolean,
  
  // Academic Background
  educationLevel: String, // "high-school", "bachelors", "masters"
  degree: String,
  major: String,
  graduationYear: Number,
  gpa: String,
  
  // Study Goals
  intendedDegree: String, // "bachelors", "masters", "mba", "phd"
  fieldOfStudy: String,
  targetIntakeYear: Number,
  preferredCountries: [String],
  
  // Budget
  budgetMin: Number,
  budgetMax: Number,
  fundingPlan: String, // "self-funded", "scholarship", "loan", "mixed"
  
  // Exams
  ieltsStatus: String, // "not-started", "in-progress", "completed"
  ieltsScore: String,
  toeflStatus: String,
  greStatus: String,
  gmatStatus: String,
  sopStatus: String, // "not-started", "draft", "ready"
  
  // Progress
  currentStage: Number, // 1-4
  
  // Live University Selections (stored with full details)
  liveShortlistedUniversities: [{
    universityId: String,
    universityName: String,
    country: String,
    category: String, // "dream", "target", "safe"
    tuitionFee: Number,
    ranking: Number,
    shortlistedAt: Date
  }],
  
  liveLockedUniversities: [{
    universityId: String,
    universityName: String,
    country: String,
    lockedAt: Date
  }]
}
```

### Task Model
```javascript
{
  userId: ObjectId,
  universityId: String,
  universityName: String,
  title: String,
  description: String,
  category: String, // "document", "exam", "application", "other"
  priority: String, // "high", "medium", "low"
  dueDate: Date,
  completed: Boolean,
  completedAt: Date
}
```

### ChatHistory Model
```javascript
{
  userId: ObjectId,
  messages: [{
    role: String, // "user" or "assistant"
    content: String,
    timestamp: Date
  }]
}
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Google Gemini API key

### 1. Clone Repository
```bash
git clone https://github.com/your-username/study-abroad-platform.git
cd study-abroad-platform
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 4. Configure Environment Variables
Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/ai-counsellor
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
GEMINI_API_KEY=your-gemini-api-key
FRONTEND_URL=http://localhost:3000
```

### 5. Get API Keys

#### MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create database user with password
4. Get connection string (replace `<password>`)

#### Google Gemini API
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy key to `.env`

### 6. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### 7. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

---

## 🔐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | `your-super-secret-key` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

---

## 👤 User Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Landing    │────▶│   Signup    │────▶│ Onboarding  │
│    Page     │     │   /Login    │     │ (4 Steps)   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┘
                    ▼
        ┌─────────────────────┐
        │     Dashboard       │
        │  - Profile Summary  │
        │  - Stage Indicator  │
        │  - Profile Strength │
        └──────────┬──────────┘
                   │
     ┌─────────────┼─────────────┐
     ▼             ▼             ▼
┌─────────┐  ┌───────────┐  ┌─────────┐
│   AI    │  │ University│  │Shortlist│
│Counselor│  │  Search   │  │   Page  │
└────┬────┘  └─────┬─────┘  └────┬────┘
     │             │             │
     │   ┌─────────┴─────────┐   │
     │   ▼                   ▼   │
     │ Shortlist ◀──────────────┘│
     │ Universities              │
     │   │                       │
     │   ▼                       │
     │ Lock Universities ◀───────┘
     │   │
     │   ▼
     └──▶ Application Guide
           - AI-generated tasks
           - Deadline tracking
           - Progress monitoring
```

---

## 📝 Development Notes

### Adding New Features
1. Create route in `backend/routes/`
2. Add to `server.js` router
3. Create frontend API function in `services/`
4. Build UI component/page

### Modifying AI Behavior
Edit `backend/routes/ai.js`:
- `buildContext()` - Change what info AI receives
- `processUserActions()` - Add new chat commands
- `generateSmartResponse()` - Modify intent detection

### Styling
- Each page has its own CSS file
- No CSS framework - pure CSS with flexbox/grid
- Mobile-first responsive design
- CSS variables for theming (if needed)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Team

Built for Hackathon 2024

---

## 🐛 Known Issues

- University data is enhanced/generated (not all real statistics)
- AI responses may vary based on Gemini API
- Large country datasets (USA) fetched in batches to avoid timeouts

---

## 🔮 Future Improvements

- [ ] Real university rankings integration
- [ ] Document upload for profile
- [ ] Email notifications for deadlines
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] University comparison tool
- [ ] Scholarship database integration
