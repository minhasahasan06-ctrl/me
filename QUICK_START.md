# 🚀 Quick Start Guide

Get your AI Health Chatbot with Wearable Integration running in minutes!

## ⚡ One-Command Setup

```bash
# Clone and setup everything
git clone <your-repo-url>
cd ai-health-chatbot
./setup.sh
```

## 🔑 Required Configuration

### 1. Google API Key (Required)
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to `backend/.env`:
   ```
   GOOGLE_API_KEY=your_api_key_here
   ```

### 2. Fitbit Integration (Optional)
1. Create account at [dev.fitbit.com](https://dev.fitbit.com)
2. Register new app with redirect URI: `http://localhost:3000/wearables/callback`
3. Add to `backend/.env`:
   ```
   FITBIT_CLIENT_ID=your_client_id
   FITBIT_CLIENT_SECRET=your_client_secret
   ```

## 🏃‍♂️ Running the Application

### Terminal 1 - Backend
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python app.py
```

### Terminal 2 - Frontend
```bash
cd frontend
npm start
```

### Access the App
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 🎯 First Steps

1. **Register**: Create your account
2. **Profile**: Complete your health profile
3. **Connect Device**: Link your Fitbit (or add manual data)
4. **Chat**: Start talking to your AI health assistant
5. **Analytics**: View your health dashboard

## 🔧 Troubleshooting

### Backend Issues
- **Port 5000 in use**: Change port in `app.py`
- **API key error**: Check your Google API key in `.env`
- **Database error**: Delete `health_chatbot.db` to reset

### Frontend Issues
- **Port 3000 in use**: React will offer alternative port
- **API connection error**: Ensure backend is running on port 5000
- **OAuth redirect error**: Check Fitbit app redirect URI

### Wearable Connection Issues
- **Fitbit not connecting**: Verify client ID/secret and redirect URI
- **Data not syncing**: Check device permissions and try manual sync
- **No data showing**: Use manual entry option in Wearables page

## 📱 Features Overview

### 🤖 AI Chat
- Personalized health conversations
- Context-aware responses using your wearable data
- Medical document analysis

### ⌚ Wearable Integration
- **Fitbit**: Steps, sleep, heart rate, calories
- **Manual Entry**: Alternative for users without devices
- **Real-time Sync**: Automatic data updates

### 📊 Health Analytics
- **Health Score**: AI-calculated overall wellness score
- **Trends**: Interactive charts and insights
- **Goals**: Track progress towards health objectives

### 🔐 Privacy & Security
- **Local Data**: All data stored locally in SQLite
- **Secure Auth**: Session-based authentication
- **OAuth**: Official device APIs for secure connections

## 🆘 Need Help?

1. **Check logs**: Backend terminal shows detailed error messages
2. **Reset database**: Delete `backend/health_chatbot.db` for fresh start
3. **Update dependencies**: Run `pip install -r requirements.txt` and `npm install`
4. **Check configuration**: Verify all API keys in `backend/.env`

## 🎉 You're Ready!

Your AI Health Chatbot is now running! Start by creating an account and connecting your wearable device for the full experience.

---

**Note**: This is an educational project. Always consult healthcare professionals for medical advice.