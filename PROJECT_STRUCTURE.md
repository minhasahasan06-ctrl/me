# 📁 Project Structure

```
.
├── README.md                      # Main documentation
├── SETUP.md                       # Quick setup guide
├── ARCHITECTURE.md                # Detailed architecture documentation
├── PROJECT_STRUCTURE.md           # This file
├── .gitignore                     # Git ignore rules
├── docker-compose.yml             # Docker orchestration
│
├── backend/                       # Flask Backend
│   ├── app.py                     # Main Flask application
│   ├── requirements.txt           # Python dependencies
│   ├── Dockerfile                 # Backend Docker configuration
│   ├── .env.example               # Environment variables template
│   ├── run.sh                     # Backend startup script
│   └── health_chatbot.db          # SQLite database (created on first run)
│
└── frontend/                      # React Frontend
    ├── package.json               # Node.js dependencies
    ├── Dockerfile                 # Frontend Docker configuration
    ├── .env.example               # Frontend environment template
    │
    ├── public/
    │   └── index.html             # HTML template
    │
    └── src/
        ├── index.js               # React entry point
        ├── index.css              # Global styles
        ├── App.js                 # Main App component
        ├── App.css                # App styles
        │
        └── components/
            ├── Login.js           # Login component
            ├── Register.js        # Registration component
            ├── Chat.js            # Chat interface component
            └── Profile.js         # Profile management component
```

## Key Files Description

### Root Level

- **README.md**: Comprehensive project documentation with features, setup, and usage instructions
- **SETUP.md**: Step-by-step setup guide for beginners
- **ARCHITECTURE.md**: Detailed technical architecture and design decisions
- **docker-compose.yml**: Docker orchestration for easy deployment
- **.gitignore**: Files and directories to exclude from version control

### Backend (`/backend`)

- **app.py**: 
  - Main Flask application
  - API endpoints for auth, profile, and chat
  - Google Gemini AI integration
  - Database initialization and management
  - Session handling

- **requirements.txt**: Python package dependencies
  - Flask and extensions
  - Google Generative AI library
  - Security utilities

- **Dockerfile**: Containerization configuration for backend
- **.env.example**: Template for environment variables (API keys)
- **run.sh**: Convenient startup script with environment checks
- **health_chatbot.db**: SQLite database (auto-created)

### Frontend (`/frontend`)

- **package.json**: Node.js dependencies and scripts
  - React 18
  - React Router for navigation
  - Axios for API calls

- **Dockerfile**: Containerization configuration for frontend

#### Public Assets (`/public`)
- **index.html**: Single-page application HTML template

#### Source Code (`/src`)

- **index.js**: React application entry point
- **index.css**: Global CSS styles (gradients, base styles)
- **App.js**: Main application component
  - Route management
  - Authentication state
  - Protected routes
- **App.css**: Application-wide styling

#### Components (`/src/components`)

- **Login.js**: User login interface
  - Form validation
  - Error handling
  - Session establishment

- **Register.js**: New user registration
  - Password confirmation
  - Input validation
  - Auto-redirect to profile

- **Chat.js**: Main chat interface
  - Message display
  - Real-time chat
  - History loading
  - Auto-scrolling

- **Profile.js**: User profile management
  - Health information form
  - Profile updates
  - Personalization settings

## File Sizes (Approximate)

```
Backend:
- app.py:              ~10 KB
- requirements.txt:    ~150 B

Frontend:
- App.js:              ~2 KB
- Chat.js:             ~4 KB
- Profile.js:          ~4 KB
- Login.js:            ~2 KB
- Register.js:         ~2 KB
- App.css:             ~6 KB

Documentation:
- README.md:           ~8 KB
- SETUP.md:            ~5 KB
- ARCHITECTURE.md:     ~10 KB
```

## Technology Mapping

### Backend Technologies
```
Flask              → app.py
SQLite             → health_chatbot.db (auto-generated)
Google Gemini AI   → app.py (genai integration)
Session Management → app.py (Flask-Session)
Authentication     → app.py (werkzeug)
```

### Frontend Technologies
```
React              → All .js files in src/
React Router       → App.js (routing)
Axios              → App.js (API client)
CSS3               → All .css files
```

## Data Flow Through Files

### Authentication Flow
```
Login.js → axios → app.py (/api/auth/login) → SQLite → Session → Response
```

### Chat Flow
```
Chat.js → axios → app.py (/api/chat) 
                    ↓
            Fetch profile from SQLite
                    ↓
            Build context + call Gemini API
                    ↓
            Save to chat_history table
                    ↓
            Return response → Display in Chat.js
```

### Profile Flow
```
Profile.js → axios → app.py (/api/profile) → SQLite (user_profiles) → Response
```

## Development Workflow

1. **Backend Development**: Edit `backend/app.py`
2. **Frontend Development**: Edit files in `frontend/src/`
3. **Styling**: Edit CSS files
4. **Dependencies**: Update `requirements.txt` or `package.json`
5. **Documentation**: Update `.md` files

## Build Artifacts (Not in Git)

```
backend/
├── venv/                 # Python virtual environment
├── __pycache__/          # Python bytecode
├── flask_session/        # Session files
└── health_chatbot.db     # Database file

frontend/
├── node_modules/         # Node dependencies
├── build/                # Production build
└── .env.local            # Local environment vars
```

## Production Deployment Files

- **Dockerfile** (backend): Python 3.11 slim image
- **Dockerfile** (frontend): Node 18 alpine image  
- **docker-compose.yml**: Orchestrates both services

## Configuration Files

- **backend/.env**: Backend environment variables (API keys)
- **frontend/.env**: Frontend environment variables (API URL)
- **.gitignore**: Prevents sensitive files from being committed

---

This structure follows modern web application best practices with clear separation of concerns between frontend and backend.