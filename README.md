# AI Counsellor - Study Abroad Platform

A MERN stack application that helps students make informed study-abroad decisions through AI-powered guidance.

## 🚀 Features

- **User Authentication** - Signup/Login with JWT
- **Mandatory Onboarding** - Collect academic background, goals, budget, and exam readiness
- **Dashboard** - Stage indicators, profile strength, and to-do list
- **AI Counsellor** - Powered by Google Gemini for personalized guidance
- **University Discovery** - Dream/Target/Safe recommendations
- **University Locking** - Commitment step before application guidance
- **Application Guidance** - AI-generated to-do tasks

## 📁 Project Structure

```
hkton2/
├── backend/
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes
│   ├── middleware/       # Auth middleware
│   ├── server.js         # Express server
│   └── .env.example      # Environment variables template
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── context/      # React context (Auth)
│   │   ├── pages/        # Page components
│   │   └── services/     # API service
│   └── package.json
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Google Gemini API key

### 1. Clone and Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment Variables

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/ai-counsellor?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Get API Keys

#### MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Get connection string and replace in `.env`

#### Google Gemini API
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add to `.env` as `GEMINI_API_KEY`

### 4. Run the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

- Backend: http://localhost:5000
- Frontend: http://localhost:3000

### 5. Seed University Data

The universities will be automatically seeded when you first visit the Universities page.

## 📱 User Flow

1. **Landing Page** → Sign up or login
2. **Onboarding** → Complete 4-step profile setup
3. **Dashboard** → View profile summary and current stage
4. **AI Counsellor** → Chat for personalized guidance
5. **Universities** → Browse and shortlist universities
6. **Lock University** → Commit to target universities
7. **Application Guide** → Track application tasks

## 🧠 AI Counsellor Capabilities

The AI Counsellor can:
- Analyze your profile strengths and gaps
- Recommend universities (Dream/Target/Safe)
- Explain why universities fit or have risks
- Shortlist universities via chat commands
- Lock universities and create tasks
- Suggest next steps based on current stage

## 🔧 API Endpoints

### Auth
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login

### User
- `GET /api/user/profile` - Get profile
- `POST /api/user/onboarding` - Complete onboarding
- `PUT /api/user/profile` - Update profile
- `POST /api/user/shortlist/:id` - Shortlist university
- `POST /api/user/lock/:id` - Lock university

### Universities
- `GET /api/universities` - Get all universities
- `GET /api/universities/recommended/for-me` - Get recommendations
- `POST /api/universities/seed` - Seed data

### AI
- `POST /api/ai/chat` - Chat with AI Counsellor
- `GET /api/ai/history` - Get chat history

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `POST /api/tasks/generate/:universityId` - Generate tasks

## 🎨 Tech Stack

- **Frontend**: React, React Router, Axios, React Icons
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **AI**: Google Gemini API
- **Auth**: JWT, bcryptjs

## 📝 Notes

- This is a hackathon prototype
- University data is simplified/dummy data
- AI responses may vary based on Gemini API

## 🤝 Team

Built for Hackathon 2024
