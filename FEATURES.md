# 🌟 Feature Documentation

## Overview of New Features

This document provides detailed information about the document upload and regular follow-up features.

---

## 📁 Document Upload & Analysis

### What It Does
Upload and store medical documents, then use AI to analyze and extract insights from them.

### Supported File Types
- **PDF**: Medical reports, lab results, prescriptions
- **Images** (PNG, JPG, JPEG, GIF): X-rays, charts, scanned documents
- **Text Files** (TXT): Medical notes, instructions
- **Word Documents** (DOC, DOCX): Health records, reports

### Maximum File Size
- 16 MB per file

### How to Use

#### 1. Upload a Document
1. Navigate to the **Documents** page from the main navigation
2. Click "Select File" and choose your document
3. (Optional) Add a description to help organize your files
4. Click "Upload File"
5. Your document is securely stored and associated with your account

#### 2. Analyze with AI
1. Find your uploaded document in the list
2. Click "🔍 Analyze with AI"
3. Wait for the analysis (typically 5-15 seconds)
4. View detailed insights:
   - **For Images**: Text extraction, chart interpretation, visual analysis
   - **For PDFs/Text**: Key findings, important values, health insights

#### 3. Manage Documents
- **View**: See all your uploaded documents with metadata
- **Delete**: Remove documents you no longer need
- **Track**: Monitor upload dates and file sizes

### Use Cases

#### Lab Results
Upload blood test results and get AI analysis of:
- Key biomarkers
- Values outside normal range
- Trends over time (if you upload multiple reports)

#### Prescriptions
- Extract medication names and dosages
- Get reminders about important instructions
- Track medication changes

#### Medical Reports
- Summarize complex medical reports
- Highlight important findings
- Clarify medical terminology

#### Health Charts
- Interpret graphs and charts
- Extract data points
- Understand trends

### Technical Details

**Backend**:
- Files stored in `backend/uploads/` directory
- Unique filenames using UUID to prevent conflicts
- Database records track metadata
- Uses Gemini 1.5 Flash for vision analysis
- Secure file access (users can only access their own files)

**Frontend**:
- React component with file upload interface
- Progress indicators for uploads and analysis
- Modal dialogs for viewing analysis results
- Grid layout for document organization

### Security & Privacy
- Files are stored locally on the server
- Only authenticated users can upload/view files
- Users can only access their own documents
- Files are permanently deleted when removed

---

## ⏰ Regular Follow-ups

### What It Does
Schedule recurring health check-ins to help you stay consistent with health goals, medication, exercise, and symptom tracking.

### Frequency Options
- **Daily**: For daily medications, exercises, or tracking
- **Weekly**: Weekly check-ins, therapy sessions, weigh-ins
- **Biweekly**: Every 2 weeks for routine monitoring
- **Monthly**: Monthly health assessments, blood pressure checks

### How to Use

#### 1. Create a Follow-up
1. Go to the **Follow-ups** page
2. Click "➕ Create Follow-up"
3. Fill in the details:
   - **Title**: What you're tracking (e.g., "Take blood pressure medication")
   - **Frequency**: How often (daily, weekly, biweekly, monthly)
   - **Notes**: Additional reminders or instructions (optional)
4. Click "Create Follow-up"
5. Your next check-in date is automatically scheduled

#### 2. Complete Check-ins
1. When it's time for a check-in, click "✓ Complete Check-in"
2. (Optional) Add notes about how you're feeling or any concerns
3. Submit the check-in
4. Receive AI-generated encouragement and personalized advice
5. Next check-in is automatically scheduled based on your frequency

#### 3. Track Progress
- See all active follow-ups on one page
- View next scheduled dates
- See when you last completed each follow-up
- Visual indicators for overdue check-ins

#### 4. Manage Follow-ups
- **Edit**: Update frequency or notes
- **Delete**: Remove follow-ups you no longer need
- **History**: View past completions and AI responses

### Visual Indicators

**Status Badges**:
- 📅 Daily
- 📆 Weekly
- 🗓️ Biweekly
- 📊 Monthly

**Date Indicators**:
- "Today" - Due today
- "Tomorrow" - Due tomorrow
- "In X days" - Upcoming
- "X days overdue" ⚠️ - Past due (red highlighting)

### Use Cases

#### Medication Reminders
```
Title: "Take morning blood pressure medication"
Frequency: Daily
Notes: "Take with breakfast, 10mg Lisinopril"
```

#### Exercise Goals
```
Title: "Cardio workout"
Frequency: Weekly
Notes: "30 minutes minimum, track heart rate"
```

#### Symptom Tracking
```
Title: "Log migraine symptoms"
Frequency: Daily
Notes: "Record triggers, severity, duration"
```

#### Routine Check-ins
```
Title: "Weigh-in and measurements"
Frequency: Weekly
Notes: "Before breakfast, track weight and waist measurement"
```

#### Health Monitoring
```
Title: "Check blood sugar levels"
Frequency: Daily
Notes: "Fasting and post-meal readings"
```

### AI-Generated Feedback

When you complete a check-in, the AI provides:
- Personalized encouragement based on your profile
- Relevant health tips
- Acknowledgment of your progress
- Advice if you mentioned concerns
- Reminders about your health goals

**Example AI Response**:
```
"Great job completing your daily check-in! I see you're staying 
consistent with your blood pressure medication. This is excellent 
for managing your hypertension. Keep up the fantastic work! 
Remember to stay hydrated and maintain that low-sodium diet 
you've been working on. See you tomorrow for your next check-in!"
```

### Technical Details

**Backend**:
- Automatic date calculation based on frequency
- Tracks completion history
- Generates contextual AI responses using Gemini
- Soft delete (is_active flag) to preserve history

**Frontend**:
- Visual calendar-like interface
- Color-coded cards (overdue items in red)
- Modal dialogs for check-in completion
- Real-time updates after completion

**Date Calculation**:
- Daily: +1 day
- Weekly: +7 days
- Biweekly: +14 days
- Monthly: +30 days

### Tips for Success

1. **Be Specific**: Use clear, descriptive titles
2. **Add Context**: Include relevant notes for better AI responses
3. **Start Small**: Begin with 1-2 follow-ups, then expand
4. **Be Consistent**: Try to complete check-ins on time
5. **Track Concerns**: Use the notes field to mention any issues
6. **Review History**: Look back at past check-ins to see progress

### Benefits

- **Accountability**: Visual reminders help you stay on track
- **Consistency**: Automated scheduling removes mental load
- **Insights**: AI feedback provides personalized guidance
- **Progress Tracking**: See how well you're maintaining routines
- **Health Integration**: Works with your existing health profile
- **Flexibility**: Adjust frequency as your needs change

---

## 🔄 Integration Between Features

### How They Work Together

#### Profile → Chat → Documents → Follow-ups

1. **Profile** provides personalization context
2. **Chat** lets you ask questions about your documents
3. **Documents** store your medical information
4. **Follow-ups** help you act on recommendations

#### Example Workflow

```
1. Upload lab results (Documents)
2. Ask AI about results in Chat
3. Set up follow-up for medication (Follow-ups)
4. Complete daily check-ins
5. Upload new results after a month
6. Compare and track improvement
```

### Contextual AI Responses

The AI considers:
- Your health profile (age, conditions, medications)
- Uploaded documents (recent lab results, prescriptions)
- Follow-up patterns (consistency, concerns mentioned)
- Chat history (previous questions and advice)

This creates a comprehensive, personalized health management experience.

---

## 📱 Mobile Experience

Both features are fully responsive:
- **Documents**: Single-column grid on mobile
- **Follow-ups**: Stacked cards with full-width buttons
- **Navigation**: Compact header with wrapped buttons
- **Modals**: Full-screen on small devices

---

## 🛡️ Privacy & Security

### Data Storage
- Documents stored locally on server
- Database records encrypted at rest
- Secure file system permissions

### Access Control
- User authentication required
- Users can only access their own data
- Session-based security

### Data Retention
- Files deleted permanently when removed
- Follow-up history preserved for insights
- User controls all their data

---

## 🔮 Future Enhancements

Potential improvements:
1. **Documents**:
   - OCR for handwritten notes
   - Multi-file analysis
   - Download analyzed reports
   - Share with healthcare providers

2. **Follow-ups**:
   - Email/SMS reminders
   - Calendar integration
   - Detailed analytics dashboard
   - Streak tracking
   - Custom frequency intervals

3. **Integration**:
   - Link documents to specific follow-ups
   - Mention documents in chat
   - Automated insights from patterns
   - Health score calculation

---

## 💡 Tips & Best Practices

### Documents
1. Rename files descriptively before uploading
2. Add descriptions for easier searching
3. Upload regularly after doctor visits
4. Organize chronologically
5. Delete outdated information

### Follow-ups
1. Set realistic frequencies
2. Complete check-ins honestly
3. Use notes to track patterns
4. Review AI feedback carefully
5. Adjust as needed

---

## 🆘 Troubleshooting

### Documents
- **Upload fails**: Check file size (<16MB) and format
- **Analysis slow**: Large files take longer
- **Can't see file**: Refresh page or check upload confirmation

### Follow-ups
- **Wrong next date**: Delete and recreate with correct frequency
- **Missing check-ins**: Check "overdue" items at top of list
- **AI response generic**: Add more details in check-in notes

---

## 📞 Support

For issues or questions:
- Check error messages for specific guidance
- Review the main README.md
- Ensure backend is running with valid API key
- Check browser console for errors