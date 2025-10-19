# 🏥 AI Personalized Health Chatbot with Wearable Integration

A comprehensive AI-powered health chatbot application that integrates with wearable devices to provide personalized health insights and recommendations. Built with Google's Gemini API and supporting multiple fitness trackers.

## ✨ Features

### 🤖 AI Health Assistant
- **Intelligent Conversations**: Powered by Google's Gemini API for medical-focused responses
- **Personalized Advice**: Tailored recommendations based on user profiles and wearable data
- **Health Insights**: AI-generated insights from your activity, sleep, and health patterns
- **Real-time Analysis**: Instant analysis of health trends and patterns

### ⌚ Wearable Device Integration
- **Fitbit Integration**: Connect your Fitbit device for automatic data sync
- **Multiple Device Support**: Framework for Garmin, Apple Health, and other devices
- **Automatic Data Sync**: Real-time synchronization of activity, sleep, and health metrics
- **Manual Data Entry**: Option to manually input health data if no wearable device

### 📊 Advanced Health Analytics
- **Comprehensive Dashboard**: Visual overview of your health metrics and trends
- **Health Score**: AI-calculated overall health score based on multiple factors
- **Trend Analysis**: Interactive charts showing activity, sleep, and health patterns
- **Goal Tracking**: Monitor progress towards your health and fitness goals

### 🔐 Security & Privacy
- **Secure Authentication**: User registration and login with session management
- **Data Encryption**: All health data is securely stored and encrypted
- **Privacy Controls**: Full control over data sharing and device connections
- **HIPAA Considerations**: Built with healthcare privacy standards in mind

### 📱 Modern Interface
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Intuitive Navigation**: Easy-to-use interface with clear navigation
- **Real-time Updates**: Live data synchronization and instant feedback
- **Beautiful Visualizations**: Interactive charts and health metrics display

## 🏗️ Architecture

### Backend (Flask)
- **RESTful API**: Comprehensive Flask-based API with health-focused endpoints
- **Database**: SQLite with tables for users, health metrics, wearable devices, and analytics
- **AI Integration**: Google Gemini API for intelligent health conversations and insights
- **Wearable APIs**: OAuth integration with Fitbit, Garmin, and Apple Health
- **Health Analytics**: Advanced data processing and trend analysis
- **Security**: Session-based authentication with secure token management

### Frontend (React)
- **Modern React 18**: Functional components with hooks for state management
- **Multi-page Application**: React Router with dedicated pages for different features
- **Real-time Updates**: Live data synchronization with backend APIs
- **Interactive Charts**: Health data visualizations and trend analysis
- **Responsive Design**: Mobile-first design with beautiful gradient UI
- **OAuth Flows**: Seamless wearable device connection process

## 📋 Prerequisites

- **Python 3.11+**: For backend development
- **Node.js 18+**: For frontend development
- **Google API Key**: For Gemini API access ([Get one here](https://makersuite.google.com/app/apikey))
- **Fitbit Developer Account**: For Fitbit integration (optional)
- **Wearable Device**: Fitbit, Garmin, or Apple Watch (optional - manual entry available)

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

### 4. Configure API Keys

#### Google API Key (Required)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to `backend/.env`

#### Fitbit Integration (Optional)
1. Create a Fitbit developer account at [dev.fitbit.com](https://dev.fitbit.com)
2. Register a new application
3. Set redirect URI to `http://localhost:3000/wearables/callback`
4. Add credentials to `backend/.env`

#### Environment Configuration
```bash
# Copy example environment file
cp backend/.env.example backend/.env

# Edit with your API keys
GOOGLE_API_KEY=your_google_api_key_here
SECRET_KEY=your_secret_key_here
FITBIT_CLIENT_ID=your_fitbit_client_id
FITBIT_CLIENT_SECRET=your_fitbit_client_secret
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

## 📱 Usage Guide

### 1. Getting Started
- **Register/Login**: Create a new account with secure authentication
- **Profile Setup**: Complete your health profile for personalized recommendations
- **Device Connection**: Connect your wearable devices or use manual data entry

### 2. Connect Wearable Devices
- **Navigate to Wearables**: Go to the Wearables page
- **Choose Your Device**: Currently supports Fitbit (more coming soon)
- **OAuth Connection**: Securely connect through official device APIs
- **Automatic Sync**: Data syncs automatically in the background
- **Manual Entry**: Alternative option for users without wearable devices

### 3. Health Analytics Dashboard
- **Health Score**: AI-calculated overall health score (0-100)
- **Activity Metrics**: Steps, calories, distance, and active minutes
- **Sleep Analysis**: Sleep duration, efficiency, and quality patterns
- **Trend Visualization**: Interactive charts showing progress over time
- **AI Insights**: Personalized recommendations based on your data

### 4. AI Health Assistant
- **Smart Conversations**: Chat with AI that understands your health context
- **Wearable Data Integration**: AI considers your recent activity and sleep data
- **Personalized Advice**: Recommendations based on your profile and metrics
- **Health Goals**: Track progress and get motivation from AI

### 5. Advanced Features
- **Document Analysis**: Upload and analyze medical documents with AI
- **Follow-up Reminders**: Schedule regular health check-ins
- **Trend Analysis**: Identify patterns in your health data
- **Goal Setting**: Set and track personalized health objectives

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

### Profile Management
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### AI Chat System
- `POST /api/chat` - Send message and get AI response (includes wearable data context)
- `GET /api/chat/history` - Get chat history

### Wearable Device Integration
- `GET /api/wearables/devices` - Get connected wearable devices
- `GET /api/wearables/connect/fitbit` - Initiate Fitbit OAuth flow
- `POST /api/wearables/callback/fitbit` - Handle Fitbit OAuth callback
- `POST /api/wearables/sync/<device_id>` - Manually sync device data
- `DELETE /api/wearables/disconnect/<device_id>` - Disconnect wearable device

### Health Analytics
- `GET /api/analytics/dashboard` - Get comprehensive health dashboard data
- `GET /api/analytics/insights` - Get AI-powered health insights
- `GET /api/analytics/trends` - Get health trend analysis with visualizations
- `POST /api/health/manual-entry` - Add manual health data entry

### Document Analysis
- `POST /api/files/upload` - Upload medical document
- `GET /api/files` - Get list of uploaded files
- `DELETE /api/files/<file_id>` - Delete a file
- `POST /api/files/analyze/<file_id>` - Analyze document with AI

### Follow-up System
- `POST /api/followups` - Create new follow-up schedule
- `GET /api/followups` - Get all active follow-ups
- `POST /api/followups/<id>/complete` - Mark follow-up as complete
- `DELETE /api/followups/<id>` - Delete a follow-up
- `GET /api/followups/<id>/history` - Get completion history

### System Health
- `GET /api/health` - Service health check

## 📊 Database Schema

### Core User Tables
- **Users**: User authentication and basic info
- **User Profiles**: Comprehensive health profiles for personalization
- **Chat History**: AI conversation history with health context

### Wearable Device Tables
- **Wearable Devices**: Connected device information and OAuth tokens
- **Health Metrics**: General health metrics from various sources
- **Activity Data**: Daily activity data (steps, calories, distance, etc.)
- **Sleep Data**: Sleep patterns, duration, and quality metrics

### Health Management Tables
- **Uploaded Files**: Medical documents and analysis results
- **Follow-ups**: Scheduled health check-ins and reminders
- **Follow-up History**: Completion history and AI responses

### Key Features
- **Relational Design**: Proper foreign key relationships for data integrity
- **Flexible Metrics**: Support for various health data types and units
- **Device Agnostic**: Schema supports multiple wearable device types
- **Temporal Data**: Time-series data for trend analysis and insights
- **Privacy Focused**: Secure storage with proper access controls

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
- **Flask 3.0.0**: Web framework
- **flask-cors 4.0.0**: Cross-origin resource sharing
- **flask-session 0.5.0**: Session management
- **google-generativeai 0.3.2**: AI integration
- **requests 2.31.0**: HTTP client for API calls
- **pandas 2.0.3**: Data analysis and processing
- **numpy 1.24.3**: Numerical computing
- **plotly 5.17.0**: Data visualization
- **fitbit 0.3.1**: Fitbit API integration
- **requests-oauthlib 1.3.1**: OAuth authentication

### Frontend
- **React 18.2.0**: UI framework
- **react-router-dom 6.20.0**: Client-side routing
- **axios 1.6.2**: HTTP client
- **chart.js 4.4.0**: Chart library
- **react-chartjs-2 5.2.0**: React Chart.js wrapper

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