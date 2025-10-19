# 📖 Quick Reference Guide

## 🚀 Quick Start Commands

### Start Backend
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python app.py
```

### Start Frontend
```bash
cd frontend
npm start
```

### Docker
```bash
docker-compose up --build
```

---

## 📍 URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

---

## 🔑 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/status` | Check auth status |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get user profile |
| PUT | `/api/profile` | Update profile |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message |
| GET | `/api/chat/history` | Get chat history |

### Documents 📁
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/files/upload` | Upload document |
| GET | `/api/files` | List files |
| DELETE | `/api/files/<id>` | Delete file |
| POST | `/api/files/analyze/<id>` | Analyze with AI |

### Follow-ups ⏰
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/followups` | Create follow-up |
| GET | `/api/followups` | List follow-ups |
| POST | `/api/followups/<id>/complete` | Complete check-in |
| DELETE | `/api/followups/<id>` | Delete follow-up |
| GET | `/api/followups/<id>/history` | View history |

---

## 🗂️ File Structure

```
project/
├── backend/
│   ├── app.py              # Main backend
│   ├── requirements.txt    # Python deps
│   ├── .env               # Config (create from .env.example)
│   └── uploads/           # User files (auto-created)
│
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   └── components/
│   │       ├── Login.js
│   │       ├── Register.js
│   │       ├── Chat.js
│   │       ├── Profile.js
│   │       ├── Documents.js    # 📁 NEW
│   │       └── Followups.js    # ⏰ NEW
│   └── package.json
│
└── Documentation/
    ├── README.md              # Main docs
    ├── SETUP.md               # Setup guide
    ├── FEATURES.md            # Feature details
    ├── WHATS_NEW.md           # New features
    ├── ARCHITECTURE.md        # Technical docs
    ├── PROJECT_STRUCTURE.md   # File structure
    ├── CHANGELOG.md           # Version history
    └── QUICK_REFERENCE.md     # This file
```

---

## 🎯 Common Tasks

### Add New User
1. Go to http://localhost:3000
2. Click "Sign up"
3. Enter username and password
4. Fill profile (optional)

### Upload Document
1. Login → Documents
2. Click "Select File"
3. Choose file (PDF, image, etc.)
4. Add description (optional)
5. Click "Upload File"

### Analyze Document
1. Find file in list
2. Click "🔍 Analyze with AI"
3. Wait for results
4. View in modal

### Create Follow-up
1. Login → Follow-ups
2. Click "➕ Create Follow-up"
3. Enter:
   - Title (e.g., "Take medication")
   - Frequency (daily/weekly/etc.)
   - Notes (optional)
4. Click "Create Follow-up"

### Complete Check-in
1. Go to Follow-ups
2. Find due/overdue item
3. Click "✓ Complete Check-in"
4. Add notes (optional)
5. Submit
6. View AI feedback

### Ask Health Question
1. Login → Chat
2. Type question
3. Send
4. Receive personalized response

---

## 🔧 Configuration

### Backend (.env)
```bash
GOOGLE_API_KEY=your_api_key_here
SECRET_KEY=your_secret_key_here
```

### Get Google API Key
1. Visit https://makersuite.google.com/app/apikey
2. Create new API key
3. Copy to `.env` file

---

## 📦 Dependencies

### Backend (Python)
```
flask==3.0.0
flask-cors==4.0.0
flask-session==0.5.0
google-generativeai==0.3.2
werkzeug==3.0.1
```

### Frontend (Node.js)
```
react==18.2.0
react-dom==18.2.0
react-router-dom==6.20.0
axios==1.6.2
react-scripts==5.0.1
```

---

## 🎨 File Types Supported

### Documents
- **PDF**: `.pdf`
- **Images**: `.png`, `.jpg`, `.jpeg`, `.gif`
- **Text**: `.txt`
- **Word**: `.doc`, `.docx`

**Max Size**: 16 MB

---

## ⏰ Follow-up Frequencies

| Frequency | Interval | Use For |
|-----------|----------|---------|
| Daily | Every day | Medications, symptoms |
| Weekly | 7 days | Exercise, weigh-ins |
| Biweekly | 14 days | Progress checks |
| Monthly | 30 days | Measurements, reviews |

---

## 🗄️ Database Tables

1. **users** - User accounts
2. **user_profiles** - Health profiles
3. **chat_history** - Conversation history
4. **uploaded_files** - Document metadata
5. **followups** - Check-in schedules
6. **followup_history** - Completion records

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check Python version
python --version  # Should be 3.11+

# Reinstall dependencies
pip install -r requirements.txt

# Check .env file exists
ls -la .env
```

### Frontend won't start
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

### Can't upload files
- Check file size < 16MB
- Check file format is allowed
- Ensure backend is running
- Check uploads/ directory exists

### AI responses fail
- Verify Google API key in .env
- Check API key is valid
- Test with: `curl http://localhost:5000/api/health`

---

## 🔒 Security Notes

- Change `SECRET_KEY` in production
- Never commit `.env` file
- Use strong passwords
- Keep API keys secure
- Regular database backups

---

## 📱 Pages & Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | Login | User login |
| `/register` | Register | New user signup |
| `/chat` | Chat | AI conversations |
| `/profile` | Profile | Health profile |
| `/documents` | Documents | File management |
| `/followups` | Followups | Check-in scheduler |

---

## 🎓 Learning Path

### For New Users
1. **Day 1**: Register, complete profile, chat
2. **Day 2**: Upload first document, analyze
3. **Day 3**: Create first follow-up
4. **Week 1**: Complete check-ins consistently
5. **Month 1**: Review patterns and adjust

### For Developers
1. Read `ARCHITECTURE.md`
2. Review `backend/app.py`
3. Study `frontend/src/components/`
4. Check API endpoints
5. Understand database schema

---

## 💡 Tips

### Best Practices
- ✅ Complete profile for better AI responses
- ✅ Upload documents regularly
- ✅ Be consistent with check-ins
- ✅ Add notes to track patterns
- ✅ Delete old/outdated files

### Avoid
- ❌ Uploading files > 16MB
- ❌ Missing consecutive check-ins
- ❌ Leaving profile empty
- ❌ Ignoring AI feedback
- ❌ Sharing login credentials

---

## 📞 Getting Help

1. **Error Messages**: Read carefully
2. **Documentation**: Check relevant .md files
3. **Console**: Check browser/terminal logs
4. **Health Check**: Test `/api/health`
5. **Issue Tracker**: Report bugs on GitHub

---

## ⚡ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Send chat message | Enter |
| Cancel modal | Esc |
| Focus input | Tab |

---

## 🎯 Success Metrics

Track your progress:
- 📊 Follow-up completion rate
- 📁 Documents uploaded
- 💬 Chat interactions
- ✅ Health goals progress
- 📈 Consistency streak

---

## 🔄 Update Workflow

### Pull Updates
```bash
git pull origin main
cd backend && pip install -r requirements.txt
cd frontend && npm install
```

### Database Migration
```bash
# Backup first
cp health_chatbot.db health_chatbot.db.backup

# Run app (auto-migrates)
python app.py
```

---

## 📚 Documentation Index

- **README.md** - Project overview
- **SETUP.md** - Installation guide  
- **FEATURES.md** - Feature details
- **WHATS_NEW.md** - New features intro
- **CHANGELOG.md** - Version history
- **ARCHITECTURE.md** - Technical design
- **PROJECT_STRUCTURE.md** - File organization
- **QUICK_REFERENCE.md** - This file

---

**Need more help? Check the full documentation files above!** 📖