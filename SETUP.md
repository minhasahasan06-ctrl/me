# 🚀 Quick Setup Guide

## Prerequisites Check

Before you begin, ensure you have:
- [ ] Python 3.11 or higher installed
- [ ] Node.js 18 or higher installed
- [ ] Git installed
- [ ] A Google account to get API key

## Step-by-Step Setup

### Step 1: Get Your Google API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Keep it safe - you'll need it in Step 3

### Step 2: Clone and Navigate

```bash
git clone <your-repo-url>
cd <project-directory>
```

### Step 3: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Edit .env file and add your Google API key
# On macOS/Linux:
nano .env
# On Windows, you can use Notepad:
# notepad .env

# Add these lines to .env:
# GOOGLE_API_KEY=your_actual_api_key_here
# SECRET_KEY=any_random_string_for_sessions
```

### Step 4: Frontend Setup

```bash
# Open a new terminal window/tab
cd frontend

# Install Node.js dependencies
npm install
```

### Step 5: Start the Application

**Terminal 1 (Backend):**
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python app.py
```

You should see:
```
 * Running on http://0.0.0.0:5000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm start
```

Your browser should automatically open to http://localhost:3000

### Step 6: Create Your First Account

1. Click "Sign up" on the login page
2. Create a username and password
3. You'll be redirected to set up your health profile
4. Fill in your information (optional but recommended for better personalization)
5. Click "Save Profile"
6. Start chatting!

## Verification Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Can register a new account
- [ ] Can login successfully
- [ ] Can update profile
- [ ] Can send messages and receive AI responses

## Troubleshooting

### "Module not found" Error (Backend)
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # or venv\Scripts\activate
pip install -r requirements.txt
```

### "Cannot find module" Error (Frontend)
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### "Invalid API Key" Error
1. Check that your `.env` file exists in the backend directory
2. Verify the API key is correct (no extra spaces)
3. Ensure the API key is enabled in Google AI Studio

### Port Already in Use
```bash
# If port 5000 is busy (Backend)
# Edit backend/app.py and change the port number

# If port 3000 is busy (Frontend)
# When prompted, press 'y' to run on a different port
```

### CORS Errors
- Ensure backend is running before starting frontend
- Check that `axios.defaults.baseURL` in `frontend/src/App.js` matches your backend URL

## Alternative: Docker Setup

If you prefer using Docker:

```bash
# Create .env file in root directory
echo "GOOGLE_API_KEY=your_api_key_here" > .env

# Start services
docker-compose up --build
```

Access:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Next Steps

1. ✅ Complete your health profile for personalized responses
2. ✅ Try asking health-related questions
3. ✅ Explore the chat history
4. ✅ Update your profile as needed

## Common First Questions to Try

- "What are some healthy breakfast options for someone with my profile?"
- "How can I improve my sleep quality?"
- "What exercises would you recommend for me?"
- "Can you explain what causes headaches?"
- "What are good stress management techniques?"

## Need Help?

- Check the main README.md for detailed documentation
- Review the troubleshooting section above
- Check the console for error messages
- Ensure all prerequisites are met

---

**Congratulations! Your AI Health Chatbot is now running! 🎉**