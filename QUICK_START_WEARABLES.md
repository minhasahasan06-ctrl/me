# ⚡ Quick Start: Wearable Integration

Get your wearable device integration running in 5 minutes!

## Prerequisites
- Backend running (Python Flask with Google API key)
- Frontend running (React on port 3000)
- User account created

## Step-by-Step Guide

### 1. Start the Application (30 seconds)

**Terminal 1 - Backend:**
```bash
cd backend
python3 app.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### 2. Login/Register (30 seconds)
- Open http://localhost:3000
- Create account or login
- You'll be redirected to the Chat page

### 3. Navigate to Wearables (10 seconds)
- Click "⌚ Wearables" in the navigation bar
- You'll see the Wearables dashboard

### 4. Connect Your First Device (1 minute)

1. Click "**+ Connect Device**" button
2. Fill in the form:
   - **Device Name**: "My Smartwatch" (or any name)
   - **Device Type**: Select from dropdown
     - Smartwatch
     - Fitness Band
     - Smart Scale
     - Other
3. Click "**Connect Device**"
4. Success! Your device is now connected

### 5. Sync Health Data (30 seconds)

1. Find your newly connected device card
2. Click "**🔄 Sync Now**" button
3. Wait 2-3 seconds
4. Data synced! (Demo generates realistic health data)

### 6. View Your Metrics (1 minute)

You'll now see three sections:

#### **Today's Health Metrics**
- Heart Rate: ~70-80 bpm
- Steps: ~8,000-10,000 steps
- Sleep: ~7-8 hours
- Calories: ~2,000-2,500 kcal
- SpO2: ~95-100%

#### **Health Trends (7 Days)**
- Mini bar charts for each metric
- Hover to see exact values
- Visual trend spotting

#### **AI Health Insights**
- Personalized analysis
- Key observations
- Recommendations
- Encouragement

### 7. Try the AI Chat Integration (1 minute)

1. Navigate to "💬 Chat" page
2. Ask questions like:
   - "How has my sleep been this week?"
   - "Is my heart rate healthy?"
   - "Am I exercising enough based on my steps?"
   - "What should I know about my health metrics?"

The AI now uses your wearable data to provide personalized answers!

## Quick Test Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Logged in successfully
- [ ] Connected a wearable device
- [ ] Synced data successfully
- [ ] See metrics on dashboard
- [ ] See AI insights
- [ ] Chat references wearable data

## Common Issues & Quick Fixes

### "Not authenticated" error
**Fix**: Make sure you're logged in. Go to /login if needed.

### Device won't connect
**Fix**: 
- Check device name is filled in
- Select a device type
- Try refreshing the page

### No data after sync
**Fix**:
- Refresh the page
- Try syncing again
- Check browser console for errors

### AI insights not showing
**Fix**:
- Ensure you synced data at least once
- Refresh the insights section
- Check Google API key is configured in backend

### Chat doesn't use wearable data
**Fix**:
- Sync your device first
- Ask specific questions about metrics
- Give the AI a moment to process

## Demo Data Details

When you sync in demo mode, the system generates:
- **24 heart rate readings** (one per hour, 60-95 bpm)
- **24 step counts** (cumulative throughout day)
- **1 sleep record** (6-9 hours)
- **1 calorie record** (1,800-2,800 kcal)
- **1 SpO2 reading** (95-100%)

This simulates a full day of wearable device data.

## Next Steps

### Explore More Features
1. **Set up health profile** (Profile page)
   - Add age, medical history, medications
   - AI uses this for even more personalized advice

2. **Upload medical documents** (Documents page)
   - Lab results, prescriptions
   - AI analyzes alongside wearable data

3. **Create follow-ups** (Follow-ups page)
   - Daily medication reminders
   - Exercise goals
   - Track consistency

### Connect Multiple Devices
- Add a fitness band
- Add a smart scale
- Compare data from different sources

### Build Historical Data
- Sync daily for 7 days
- See more meaningful trends
- Get better AI insights

## API Endpoints for Testing

### Test with cURL:

**Get Devices:**
```bash
curl http://localhost:5000/api/wearables/devices \
  --cookie-jar cookies.txt \
  --cookie cookies.txt
```

**Connect Device:**
```bash
curl -X POST http://localhost:5000/api/wearables/devices \
  -H "Content-Type: application/json" \
  -d '{"device_name":"Test Watch","device_type":"smartwatch"}' \
  --cookie-jar cookies.txt \
  --cookie cookies.txt
```

**Sync Data:**
```bash
curl -X POST http://localhost:5000/api/wearables/sync \
  -H "Content-Type: application/json" \
  -d '{"device_id":"YOUR_DEVICE_ID"}' \
  --cookie-jar cookies.txt \
  --cookie cookies.txt
```

**Get Metrics:**
```bash
curl http://localhost:5000/api/wearables/metrics?days=7 \
  --cookie-jar cookies.txt \
  --cookie cookies.txt
```

**Get Summary:**
```bash
curl http://localhost:5000/api/wearables/metrics/summary \
  --cookie-jar cookies.txt \
  --cookie cookies.txt
```

**Get AI Insights:**
```bash
curl http://localhost:5000/api/wearables/insights \
  --cookie-jar cookies.txt \
  --cookie cookies.txt
```

## Production Deployment

### For Real Device Integration

1. **Apple HealthKit**:
   - Implement OAuth flow
   - Request health data permissions
   - Use HealthKit API to fetch metrics

2. **Google Fit**:
   - Set up Google Fit API credentials
   - Implement OAuth 2.0
   - Query fitness data API

3. **Fitbit**:
   - Register app on Fitbit Dev Portal
   - Get OAuth credentials
   - Use Fitbit Web API

4. **Replace sync simulation** in `backend/app.py`:
```python
# Current (demo):
def sync_wearable_data():
    # Generates simulated data
    
# Production:
def sync_wearable_data():
    device_type = get_device_type(device_id)
    if device_type == 'apple_watch':
        return sync_apple_health(device_id)
    elif device_type == 'fitbit':
        return sync_fitbit(device_id)
    # etc.
```

## Support

Need help?
1. Check the main README.md
2. Read WEARABLES_GUIDE.md for detailed docs
3. Review FEATURES.md for integration info
4. Open an issue on GitHub

## Congratulations! 🎉

You now have a working AI health chatbot with wearable device integration!

**What you can do:**
- ✅ Track heart rate, steps, sleep, calories, SpO2
- ✅ View real-time metrics dashboard
- ✅ See 7-day health trends
- ✅ Get AI-powered health insights
- ✅ Chat with AI about your health data
- ✅ Combine with medical documents and follow-ups

**Keep exploring and stay healthy!** 💪
