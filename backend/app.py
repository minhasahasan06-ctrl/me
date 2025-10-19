from flask import Flask, request, jsonify, session, send_file
from flask_cors import CORS
from flask_session import Session
import google.generativeai as genai
import os
from datetime import datetime, timedelta
import json
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import sqlite3
import uuid
import base64

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'txt', 'doc', 'docx'}

# Create upload directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

Session(app)
CORS(app, supports_credentials=True)

# Initialize Google MedLM (Gemini with medical focus)
# Configure with your Google API key
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY', '')
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

# Database initialization
def init_db():
    conn = sqlite3.connect('health_chatbot.db')
    c = conn.cursor()
    
    # Users table
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id TEXT PRIMARY KEY,
                  username TEXT UNIQUE NOT NULL,
                  password_hash TEXT NOT NULL,
                  created_at TEXT NOT NULL)''')
    
    # User profiles table
    c.execute('''CREATE TABLE IF NOT EXISTS user_profiles
                 (user_id TEXT PRIMARY KEY,
                  full_name TEXT,
                  age INTEGER,
                  gender TEXT,
                  medical_history TEXT,
                  allergies TEXT,
                  current_medications TEXT,
                  health_goals TEXT,
                  updated_at TEXT,
                  FOREIGN KEY (user_id) REFERENCES users(id))''')
    
    # Chat history table
    c.execute('''CREATE TABLE IF NOT EXISTS chat_history
                 (id TEXT PRIMARY KEY,
                  user_id TEXT NOT NULL,
                  message TEXT NOT NULL,
                  response TEXT NOT NULL,
                  timestamp TEXT NOT NULL,
                  FOREIGN KEY (user_id) REFERENCES users(id))''')
    
    # Uploaded files table
    c.execute('''CREATE TABLE IF NOT EXISTS uploaded_files
                 (id TEXT PRIMARY KEY,
                  user_id TEXT NOT NULL,
                  filename TEXT NOT NULL,
                  original_filename TEXT NOT NULL,
                  file_type TEXT NOT NULL,
                  file_size INTEGER NOT NULL,
                  description TEXT,
                  upload_date TEXT NOT NULL,
                  FOREIGN KEY (user_id) REFERENCES users(id))''')
    
    # Follow-ups table
    c.execute('''CREATE TABLE IF NOT EXISTS followups
                 (id TEXT PRIMARY KEY,
                  user_id TEXT NOT NULL,
                  title TEXT NOT NULL,
                  frequency TEXT NOT NULL,
                  next_date TEXT NOT NULL,
                  last_completed TEXT,
                  notes TEXT,
                  is_active INTEGER DEFAULT 1,
                  created_at TEXT NOT NULL,
                  FOREIGN KEY (user_id) REFERENCES users(id))''')
    
    # Follow-up history table
    c.execute('''CREATE TABLE IF NOT EXISTS followup_history
                 (id TEXT PRIMARY KEY,
                  followup_id TEXT NOT NULL,
                  completed_date TEXT NOT NULL,
                  notes TEXT,
                  ai_response TEXT,
                  FOREIGN KEY (followup_id) REFERENCES followups(id))''')
    
    conn.commit()
    conn.close()

init_db()

def get_db():
    conn = sqlite3.connect('health_chatbot.db')
    conn.row_factory = sqlite3.Row
    return conn

# User authentication endpoints
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    conn = get_db()
    c = conn.cursor()
    
    try:
        user_id = str(uuid.uuid4())
        password_hash = generate_password_hash(password)
        c.execute('INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)',
                  (user_id, username, password_hash, datetime.now().isoformat()))
        
        # Create empty profile
        c.execute('INSERT INTO user_profiles (user_id, updated_at) VALUES (?, ?)',
                  (user_id, datetime.now().isoformat()))
        
        conn.commit()
        session['user_id'] = user_id
        session['username'] = username
        
        return jsonify({'message': 'User registered successfully', 'username': username}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username already exists'}), 400
    finally:
        conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT id, password_hash FROM users WHERE username = ?', (username,))
    user = c.fetchone()
    conn.close()
    
    if user and check_password_hash(user['password_hash'], password):
        session['user_id'] = user['id']
        session['username'] = username
        return jsonify({'message': 'Login successful', 'username': username}), 200
    
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/api/auth/status', methods=['GET'])
def auth_status():
    if 'user_id' in session:
        return jsonify({'authenticated': True, 'username': session.get('username')}), 200
    return jsonify({'authenticated': False}), 200

# Profile management endpoints
@app.route('/api/profile', methods=['GET'])
def get_profile():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM user_profiles WHERE user_id = ?', (session['user_id'],))
    profile = c.fetchone()
    conn.close()
    
    if profile:
        return jsonify({
            'full_name': profile['full_name'],
            'age': profile['age'],
            'gender': profile['gender'],
            'medical_history': profile['medical_history'],
            'allergies': profile['allergies'],
            'current_medications': profile['current_medications'],
            'health_goals': profile['health_goals']
        }), 200
    
    return jsonify({'error': 'Profile not found'}), 404

@app.route('/api/profile', methods=['PUT'])
def update_profile():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    conn = get_db()
    c = conn.cursor()
    
    c.execute('''UPDATE user_profiles 
                 SET full_name = ?, age = ?, gender = ?, medical_history = ?,
                     allergies = ?, current_medications = ?, health_goals = ?, updated_at = ?
                 WHERE user_id = ?''',
              (data.get('full_name'), data.get('age'), data.get('gender'),
               data.get('medical_history'), data.get('allergies'),
               data.get('current_medications'), data.get('health_goals'),
               datetime.now().isoformat(), session['user_id']))
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Profile updated successfully'}), 200

# Chat endpoints
def get_user_context(user_id):
    """Get user profile context for personalized responses"""
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM user_profiles WHERE user_id = ?', (user_id,))
    profile = c.fetchone()
    conn.close()
    
    if not profile:
        return ""
    
    context = "User Profile:\n"
    if profile['full_name']:
        context += f"Name: {profile['full_name']}\n"
    if profile['age']:
        context += f"Age: {profile['age']}\n"
    if profile['gender']:
        context += f"Gender: {profile['gender']}\n"
    if profile['medical_history']:
        context += f"Medical History: {profile['medical_history']}\n"
    if profile['allergies']:
        context += f"Allergies: {profile['allergies']}\n"
    if profile['current_medications']:
        context += f"Current Medications: {profile['current_medications']}\n"
    if profile['health_goals']:
        context += f"Health Goals: {profile['health_goals']}\n"
    
    return context

@app.route('/api/chat', methods=['POST'])
def chat():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    user_message = data.get('message', '')
    
    if not user_message:
        return jsonify({'error': 'Message is required'}), 400
    
    try:
        # Get user context for personalization
        user_context = get_user_context(session['user_id'])
        
        # Configure the model for medical/health conversations
        model = genai.GenerativeModel('gemini-pro')
        
        # Create a comprehensive system prompt for health advice
        system_prompt = """You are a compassionate and knowledgeable AI health assistant. 
You provide evidence-based health information and support while being personalized to the user's profile.

Important guidelines:
- Always be empathetic and supportive
- Provide accurate, evidence-based health information
- Consider the user's profile (age, gender, medical history, allergies, medications, goals) when responding
- NEVER diagnose conditions or prescribe medications
- Always recommend consulting healthcare professionals for serious concerns
- Be clear about the limitations of AI health advice
- Prioritize user safety and well-being

"""
        if user_context:
            system_prompt += f"\n{user_context}\n"
        
        system_prompt += f"\nUser Question: {user_message}\n\nPlease provide a helpful, personalized response:"
        
        # Generate response
        response = model.generate_content(system_prompt)
        ai_response = response.text
        
        # Save to chat history
        conn = get_db()
        c = conn.cursor()
        chat_id = str(uuid.uuid4())
        c.execute('INSERT INTO chat_history (id, user_id, message, response, timestamp) VALUES (?, ?, ?, ?, ?)',
                  (chat_id, session['user_id'], user_message, ai_response, datetime.now().isoformat()))
        conn.commit()
        conn.close()
        
        return jsonify({
            'response': ai_response,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error generating response: {str(e)}'}), 500

@app.route('/api/chat/history', methods=['GET'])
def get_chat_history():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT message, response, timestamp FROM chat_history WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50',
              (session['user_id'],))
    history = c.fetchall()
    conn.close()
    
    return jsonify({
        'history': [{'message': h['message'], 'response': h['response'], 'timestamp': h['timestamp']} 
                    for h in history]
    }), 200

# File upload endpoints
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/files/upload', methods=['POST'])
def upload_file():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    description = request.form.get('description', '')
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400
    
    try:
        # Generate unique filename
        original_filename = secure_filename(file.filename)
        file_ext = original_filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        # Save file
        file.save(filepath)
        file_size = os.path.getsize(filepath)
        
        # Save to database
        conn = get_db()
        c = conn.cursor()
        file_id = str(uuid.uuid4())
        c.execute('''INSERT INTO uploaded_files 
                     (id, user_id, filename, original_filename, file_type, file_size, description, upload_date)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                  (file_id, session['user_id'], unique_filename, original_filename, 
                   file_ext, file_size, description, datetime.now().isoformat()))
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': 'File uploaded successfully',
            'file_id': file_id,
            'filename': original_filename
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@app.route('/api/files', methods=['GET'])
def get_files():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    conn = get_db()
    c = conn.cursor()
    c.execute('''SELECT id, original_filename, file_type, file_size, description, upload_date 
                 FROM uploaded_files WHERE user_id = ? ORDER BY upload_date DESC''',
              (session['user_id'],))
    files = c.fetchall()
    conn.close()
    
    return jsonify({
        'files': [{
            'id': f['id'],
            'filename': f['original_filename'],
            'file_type': f['file_type'],
            'file_size': f['file_size'],
            'description': f['description'],
            'upload_date': f['upload_date']
        } for f in files]
    }), 200

@app.route('/api/files/<file_id>', methods=['DELETE'])
def delete_file(file_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT filename FROM uploaded_files WHERE id = ? AND user_id = ?',
              (file_id, session['user_id']))
    file_record = c.fetchone()
    
    if not file_record:
        conn.close()
        return jsonify({'error': 'File not found'}), 404
    
    # Delete physical file
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], file_record['filename'])
    if os.path.exists(filepath):
        os.remove(filepath)
    
    # Delete database record
    c.execute('DELETE FROM uploaded_files WHERE id = ?', (file_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'File deleted successfully'}), 200

@app.route('/api/files/analyze/<file_id>', methods=['POST'])
def analyze_file(file_id):
    """Analyze an uploaded file using Gemini Vision API for images or text extraction"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT filename, file_type, original_filename FROM uploaded_files WHERE id = ? AND user_id = ?',
              (file_id, session['user_id']))
    file_record = c.fetchone()
    conn.close()
    
    if not file_record:
        return jsonify({'error': 'File not found'}), 404
    
    try:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file_record['filename'])
        
        # For images, use Gemini Vision
        if file_record['file_type'] in ['png', 'jpg', 'jpeg', 'gif']:
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            # Read and encode image
            with open(filepath, 'rb') as f:
                image_data = f.read()
            
            prompt = """Analyze this medical document or health-related image. 
            Provide a detailed summary of what you see, including any text, charts, values, or medical information.
            If this appears to be a medical report or lab result, highlight key findings.
            Be thorough but clear in your analysis."""
            
            response = model.generate_content([prompt, {'mime_type': f'image/{file_record["file_type"]}', 'data': image_data}])
            analysis = response.text
            
        else:
            # For text files, read and analyze
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            model = genai.GenerativeModel('gemini-pro')
            prompt = f"""Analyze this medical document content and provide a summary:
            
            {content[:5000]}  # Limit to first 5000 characters
            
            Provide key findings, important values, and any health-related insights."""
            
            response = model.generate_content(prompt)
            analysis = response.text
        
        return jsonify({
            'filename': file_record['original_filename'],
            'analysis': analysis
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

# Follow-up management endpoints
@app.route('/api/followups', methods=['POST'])
def create_followup():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    title = data.get('title')
    frequency = data.get('frequency')  # daily, weekly, biweekly, monthly
    notes = data.get('notes', '')
    
    if not title or not frequency:
        return jsonify({'error': 'Title and frequency are required'}), 400
    
    # Calculate next date based on frequency
    now = datetime.now()
    if frequency == 'daily':
        next_date = now + timedelta(days=1)
    elif frequency == 'weekly':
        next_date = now + timedelta(weeks=1)
    elif frequency == 'biweekly':
        next_date = now + timedelta(weeks=2)
    elif frequency == 'monthly':
        next_date = now + timedelta(days=30)
    else:
        return jsonify({'error': 'Invalid frequency'}), 400
    
    conn = get_db()
    c = conn.cursor()
    followup_id = str(uuid.uuid4())
    c.execute('''INSERT INTO followups 
                 (id, user_id, title, frequency, next_date, notes, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)''',
              (followup_id, session['user_id'], title, frequency, 
               next_date.isoformat(), notes, now.isoformat()))
    conn.commit()
    conn.close()
    
    return jsonify({
        'message': 'Follow-up created successfully',
        'followup_id': followup_id,
        'next_date': next_date.isoformat()
    }), 201

@app.route('/api/followups', methods=['GET'])
def get_followups():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    conn = get_db()
    c = conn.cursor()
    c.execute('''SELECT id, title, frequency, next_date, last_completed, notes, is_active
                 FROM followups WHERE user_id = ? AND is_active = 1 ORDER BY next_date ASC''',
              (session['user_id'],))
    followups = c.fetchall()
    conn.close()
    
    return jsonify({
        'followups': [{
            'id': f['id'],
            'title': f['title'],
            'frequency': f['frequency'],
            'next_date': f['next_date'],
            'last_completed': f['last_completed'],
            'notes': f['notes'],
            'is_overdue': datetime.fromisoformat(f['next_date']) < datetime.now()
        } for f in followups]
    }), 200

@app.route('/api/followups/<followup_id>/complete', methods=['POST'])
def complete_followup(followup_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    notes = data.get('notes', '')
    
    conn = get_db()
    c = conn.cursor()
    
    # Get followup details
    c.execute('SELECT frequency FROM followups WHERE id = ? AND user_id = ?',
              (followup_id, session['user_id']))
    followup = c.fetchone()
    
    if not followup:
        conn.close()
        return jsonify({'error': 'Follow-up not found'}), 404
    
    now = datetime.now()
    
    # Calculate next date
    frequency = followup['frequency']
    if frequency == 'daily':
        next_date = now + timedelta(days=1)
    elif frequency == 'weekly':
        next_date = now + timedelta(weeks=1)
    elif frequency == 'biweekly':
        next_date = now + timedelta(weeks=2)
    elif frequency == 'monthly':
        next_date = now + timedelta(days=30)
    
    # Generate AI response for the follow-up
    try:
        user_context = get_user_context(session['user_id'])
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""This is a health follow-up check-in.
        
{user_context}

Follow-up Type: {frequency} check-in
User Notes: {notes if notes else 'No specific concerns mentioned'}

Provide a brief, encouraging health update message. If the user mentioned any concerns, address them. 
Keep it friendly, supportive, and remind them of their health goals."""
        
        response = model.generate_content(prompt)
        ai_response = response.text
    except:
        ai_response = "Great job completing your check-in! Keep up the good work with your health journey."
    
    # Save to history
    history_id = str(uuid.uuid4())
    c.execute('''INSERT INTO followup_history 
                 (id, followup_id, completed_date, notes, ai_response)
                 VALUES (?, ?, ?, ?, ?)''',
              (history_id, followup_id, now.isoformat(), notes, ai_response))
    
    # Update followup
    c.execute('''UPDATE followups 
                 SET last_completed = ?, next_date = ?
                 WHERE id = ?''',
              (now.isoformat(), next_date.isoformat(), followup_id))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'message': 'Follow-up completed',
        'next_date': next_date.isoformat(),
        'ai_response': ai_response
    }), 200

@app.route('/api/followups/<followup_id>', methods=['DELETE'])
def delete_followup(followup_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    conn = get_db()
    c = conn.cursor()
    c.execute('UPDATE followups SET is_active = 0 WHERE id = ? AND user_id = ?',
              (followup_id, session['user_id']))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Follow-up deleted successfully'}), 200

@app.route('/api/followups/<followup_id>/history', methods=['GET'])
def get_followup_history(followup_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    conn = get_db()
    c = conn.cursor()
    
    # Verify user owns this followup
    c.execute('SELECT id FROM followups WHERE id = ? AND user_id = ?',
              (followup_id, session['user_id']))
    if not c.fetchone():
        conn.close()
        return jsonify({'error': 'Follow-up not found'}), 404
    
    c.execute('''SELECT id, completed_date, notes, ai_response
                 FROM followup_history WHERE followup_id = ? 
                 ORDER BY completed_date DESC LIMIT 20''',
              (followup_id,))
    history = c.fetchall()
    conn.close()
    
    return jsonify({
        'history': [{
            'id': h['id'],
            'completed_date': h['completed_date'],
            'notes': h['notes'],
            'ai_response': h['ai_response']
        } for h in history]
    }), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'MedLM Health Chatbot'}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
