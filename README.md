# 🏥 Personalized AI Health Chatbot with Google MedLM

A sophisticated health chatbot application powered by Google's Gemini API (MedLM) that provides personalized health advice based on user profiles.

## ✨ Features

- **🤖 AI-Powered Health Assistant**: Leverages Google's Gemini API for intelligent health conversations
- **👤 Personalized Responses**: Uses user profile data (age, medical history, allergies, medications) to provide tailored advice
- **🔐 Secure Authentication**: User registration and login with session management
- **💬 Chat History**: Persistent conversation history saved to database
- **📊 Health Profile Management**: Comprehensive user profile system for personalization
- **📁 Document Upload & Analysis**: Upload medical documents (PDFs, images, reports) and get AI-powered analysis using Gemini Vision
- **⏰ Regular Follow-ups**: Schedule and track regular health check-ins (daily, weekly, biweekly, monthly) with AI-generated feedback
- **🎨 Modern UI**: Beautiful, responsive React interface with gradient design
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices

## 🏗️ Architecture

### Backend (Flask)
- RESTful API with Flask
- SQLite database for user data and chat history
- Google Generative AI integration (Gemini Pro)
- Session-based authentication
- CORS support for cross-origin requests

### Frontend (React)
- Modern React 18 with functional components
- React Router for navigation
- Axios for API communication
- Beautiful gradient UI with animations
- Real-time chat interface

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+
- Google API Key (for Gemini API access)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <project-directory>
```

### 2. Set Up Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your Google API key
```

### 3. Set Up Frontend

```bash
cd frontend

# Install dependencies
npm install
```

### 4. Get Google API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to `backend/.env`:

```
GOOGLE_API_KEY=your_api_key_here
SECRET_KEY=your_secret_key_here
```

### 5. Run the Application

#### Option A: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python app.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

#### Option B: Docker Compose

```bash
# Set environment variables
export GOOGLE_API_KEY=your_api_key_here

# Start services
docker-compose up --build
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📱 Usage

### 1. Register/Login
- Create a new account or sign in with existing credentials
- Secure password hashing with bcrypt

### 2. Set Up Your Health Profile
- Navigate to the Profile page
- Fill in your health information:
  - Personal details (name, age, gender)
  - Medical history
  - Allergies
  - Current medications
  - Health goals
- This information personalizes the AI's responses

### 3. Chat with the AI
- Ask health-related questions
- Get personalized advice based on your profile
- View chat history
- All conversations are saved

### 4. Upload Medical Documents
- Navigate to the Documents page
- Upload lab results, prescriptions, medical reports
- Supported formats: PDF, PNG, JPG, TXT, DOC, DOCX
- Click "Analyze with AI" to get instant insights using Gemini Vision
- AI can extract text, interpret charts, and highlight key findings

### 5. Set Up Regular Follow-ups
- Go to the Follow-ups page
- Create check-ins for:
  - Medication reminders
  - Symptom tracking
  - Exercise goals
  - Health monitoring
- Choose frequency (daily, weekly, biweekly, monthly)
- Complete check-ins and receive AI-generated encouragement and advice
- Track your consistency over time

## 🔒 Security Features

- Password hashing with werkzeug
- Session-based authentication
- CORS protection
- Input validation
- Secure API key management

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/status` - Check authentication status

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Chat
- `POST /api/chat` - Send message and get AI response
- `GET /api/chat/history` - Get chat history

### Documents
- `POST /api/files/upload` - Upload medical document
- `GET /api/files` - Get list of uploaded files
- `DELETE /api/files/<file_id>` - Delete a file
- `POST /api/files/analyze/<file_id>` - Analyze document with AI

### Follow-ups
- `POST /api/followups` - Create new follow-up schedule
- `GET /api/followups` - Get all active follow-ups
- `POST /api/followups/<id>/complete` - Mark follow-up as complete
- `DELETE /api/followups/<id>` - Delete a follow-up
- `GET /api/followups/<id>/history` - Get completion history

### Health Check
- `GET /api/health` - Service health check

## 📊 Database Schema

### Users Table
- id (Primary Key)
- username (Unique)
- password_hash
- created_at

### User Profiles Table
- user_id (Foreign Key)
- full_name
- age
- gender
- medical_history
- allergies
- current_medications
- health_goals
- updated_at

### Chat History Table
- id (Primary Key)
- user_id (Foreign Key)
- message
- response
- timestamp

### Uploaded Files Table
- id (Primary Key)
- user_id (Foreign Key)
- filename
- original_filename
- file_type
- file_size
- description
- upload_date

### Follow-ups Table
- id (Primary Key)
- user_id (Foreign Key)
- title
- frequency (daily, weekly, biweekly, monthly)
- next_date
- last_completed
- notes
- is_active
- created_at

### Follow-up History Table
- id (Primary Key)
- followup_id (Foreign Key)
- completed_date
- notes
- ai_response

## 🎨 UI Features

- **Gradient Background**: Beautiful purple gradient design
- **Smooth Animations**: Fade-in effects for messages and cards
- **Responsive Layout**: Mobile-friendly design
- **Real-time Updates**: Instant message display
- **Loading States**: Visual feedback for async operations
- **Error Handling**: User-friendly error messages
- **File Upload Interface**: Drag-and-drop support and file previews
- **Modal Dialogs**: For document analysis and follow-up completion
- **Visual Badges**: Frequency indicators and overdue alerts
- **Interactive Cards**: Hover effects and smooth transitions

## ⚠️ Important Disclaimers

This chatbot provides **general health information only** and:
- Does NOT diagnose medical conditions
- Does NOT prescribe medications
- Should NOT replace professional medical advice
- Recommends consulting healthcare professionals for serious concerns

Always consult with qualified healthcare providers for medical decisions.

## 🔧 Configuration

### Backend Configuration
- `GOOGLE_API_KEY`: Your Google API key for Gemini
- `SECRET_KEY`: Flask session secret key
- Database: SQLite (health_chatbot.db)

### Frontend Configuration
- API URL: http://localhost:5000 (default)
- Port: 3000 (default)

## 📦 Dependencies

### Backend
- Flask 3.0.0
- flask-cors 4.0.0
- flask-session 0.5.0
- google-generativeai 0.3.2
- werkzeug 3.0.1

### Frontend
- React 18.2.0
- react-router-dom 6.20.0
- axios 1.6.2

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Google Generative AI for the Gemini API
- Flask and React communities
- All contributors and users

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact the development team

---

**Note**: This is an educational project. Always consult healthcare professionals for medical advice.