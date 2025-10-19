# 🏗️ Architecture Documentation

## System Overview

The MedLM Health Chatbot is a full-stack web application that provides personalized health advice using Google's Gemini AI.

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│                      (React 18)                             │
│  ┌───────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐ │
│  │   Login   │  │  Register │  │   Chat   │  │  Profile │ │
│  └───────────┘  └───────────┘  └──────────┘  └──────────┘ │
│                         ↓                                    │
│                   React Router                               │
│                         ↓                                    │
│                    Axios Client                              │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST API
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                      Backend (Flask)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   API Endpoints                        │ │
│  │  /api/auth/*  /api/profile  /api/chat  /api/health   │ │
│  └───────────┬────────────────────────┬───────────────────┘ │
│              │                        │                      │
│  ┌───────────┴──────────┐  ┌─────────┴────────────┐        │
│  │  Authentication      │  │   Chat Service       │        │
│  │  & Session Mgmt      │  │                      │        │
│  └──────────┬───────────┘  └──────────┬───────────┘        │
│             │                          │                     │
│  ┌──────────┴──────────────────────────┴───────────┐       │
│  │            SQLite Database                       │       │
│  │  - users  - user_profiles  - chat_history       │       │
│  └──────────────────────────────────────────────────┘       │
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │         Google Generative AI (Gemini)            │       │
│  │              MedLM Integration                   │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **React 18.2.0**: UI framework
- **React Router 6.20.0**: Client-side routing
- **Axios 1.6.2**: HTTP client for API calls
- **CSS3**: Custom styling with gradients and animations

### Backend
- **Flask 3.0.0**: Python web framework
- **Flask-CORS 4.0.0**: Cross-origin resource sharing
- **Flask-Session 0.5.0**: Server-side session management
- **Google Generative AI 0.3.2**: AI integration
- **Werkzeug 3.0.1**: Password hashing and security

### Database
- **SQLite**: Lightweight relational database
- **Schema**: Users, Profiles, Chat History

### External Services
- **Google Gemini API**: AI-powered chat responses

## Data Flow

### 1. User Registration Flow
```
User Input → Frontend Validation → POST /api/auth/register
→ Backend Validation → Password Hashing → Database Insert
→ Session Creation → Success Response → Redirect to Profile
```

### 2. Chat Message Flow
```
User Message → Frontend → POST /api/chat
→ Backend receives message
→ Fetch user profile from database
→ Build personalized context
→ Call Gemini API with context + message
→ Receive AI response
→ Save to chat history
→ Return response to frontend
→ Display in chat interface
```

### 3. Profile Update Flow
```
Profile Form → Frontend → PUT /api/profile
→ Backend Validation → Database Update
→ Success Response → UI Update
```

## Component Architecture

### Frontend Components

#### 1. App.js (Main Container)
- Manages global authentication state
- Handles routing logic
- Provides authentication context to child components

#### 2. Login.js
- User authentication form
- Credentials validation
- Session establishment

#### 3. Register.js
- New user registration
- Password confirmation
- Automatic login after registration

#### 4. Chat.js
- Real-time chat interface
- Message history display
- Auto-scrolling to new messages
- Loading states

#### 5. Profile.js
- User profile management
- Health information form
- Profile update functionality

### Backend Modules

#### 1. Authentication System
```python
/api/auth/register  # User registration
/api/auth/login     # User authentication
/api/auth/logout    # Session termination
/api/auth/status    # Check auth status
```

#### 2. Profile Management
```python
/api/profile (GET)  # Retrieve user profile
/api/profile (PUT)  # Update user profile
```

#### 3. Chat System
```python
/api/chat (POST)         # Send message, get AI response
/api/chat/history (GET)  # Retrieve conversation history
```

#### 4. AI Integration
```python
get_user_context()  # Build personalized context
model.generate_content()  # Call Gemini API
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
);
```

### User Profiles Table
```sql
CREATE TABLE user_profiles (
    user_id TEXT PRIMARY KEY,
    full_name TEXT,
    age INTEGER,
    gender TEXT,
    medical_history TEXT,
    allergies TEXT,
    current_medications TEXT,
    health_goals TEXT,
    updated_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Chat History Table
```sql
CREATE TABLE chat_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Security Considerations

### 1. Authentication
- **Password Hashing**: Werkzeug's generate_password_hash
- **Session Management**: Flask-Session with server-side storage
- **CSRF Protection**: Session-based authentication

### 2. API Security
- **CORS Configuration**: Restricted to specific origins
- **Credentials Support**: Secure cookie handling
- **Input Validation**: All user inputs are validated

### 3. Data Privacy
- **Sensitive Data**: Medical information stored securely
- **API Keys**: Environment variable storage
- **Session Security**: Secret key for session encryption

## Personalization Strategy

The chatbot provides personalized responses by:

1. **Context Building**: Retrieves user profile from database
2. **Prompt Engineering**: Includes user data in AI prompt
3. **Relevant Advice**: AI considers age, medical history, allergies, medications
4. **Goal Alignment**: Responses aligned with user's health goals

### Example Context Injection
```
System Prompt:
"You are a health assistant.

User Profile:
Name: John Doe
Age: 35
Medical History: Diabetes Type 2
Allergies: Penicillin
Current Medications: Metformin
Health Goals: Lose weight, improve blood sugar

User Question: What should I eat for breakfast?"
```

## Scalability Considerations

### Current Architecture
- Single-server deployment
- SQLite database
- Session-based authentication

### Future Enhancements
1. **Database**: Migrate to PostgreSQL for production
2. **Caching**: Redis for session storage
3. **Authentication**: JWT tokens for stateless auth
4. **Load Balancing**: Multiple backend instances
5. **CDN**: Static asset delivery
6. **Monitoring**: Application performance monitoring
7. **Rate Limiting**: API request throttling

## Error Handling

### Frontend
- User-friendly error messages
- Network error handling
- Validation feedback
- Loading states

### Backend
- Try-catch blocks for API calls
- Database transaction management
- Graceful degradation
- Detailed error logging

## Performance Optimizations

1. **Frontend**:
   - React component optimization
   - Lazy loading for routes
   - Efficient re-rendering
   - Message batching

2. **Backend**:
   - Database connection pooling
   - Query optimization
   - Response caching potential
   - Async processing for AI calls

## Deployment Architecture

### Development
```
localhost:3000 (Frontend) → localhost:5000 (Backend) → Gemini API
```

### Production (Recommended)
```
CDN → Frontend (Static) → Load Balancer → Backend Cluster → Database
                                               ↓
                                          Gemini API
```

## API Design Principles

1. **RESTful**: Standard HTTP methods (GET, POST, PUT)
2. **JSON**: All data exchange in JSON format
3. **Stateful**: Session-based authentication
4. **Versioned**: /api/ prefix for future versioning
5. **Consistent**: Standard response formats

## Monitoring and Logging

### Current Implementation
- Console logging for errors
- Basic request/response logging

### Recommended Additions
1. Application logs (Winston, Loguru)
2. Error tracking (Sentry)
3. Performance monitoring (New Relic)
4. User analytics (Google Analytics)
5. Health checks and uptime monitoring

## Testing Strategy

### Frontend Testing
- Component unit tests (Jest)
- Integration tests (React Testing Library)
- E2E tests (Cypress)

### Backend Testing
- Unit tests (pytest)
- API tests (pytest + requests)
- Database tests (pytest-sqlite)
- AI integration mocks

## Maintenance

### Regular Tasks
1. Update dependencies
2. Review security advisories
3. Monitor API usage and costs
4. Backup database regularly
5. Review and optimize queries
6. Update AI prompts based on feedback

---

This architecture provides a solid foundation for a production-ready health chatbot application with room for future enhancements.