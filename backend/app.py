from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_session import Session
import google.generativeai as genai
import os
from datetime import datetime
import json
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import uuid

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SESSION_TYPE'] = 'filesystem'
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

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'MedLM Health Chatbot'}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
