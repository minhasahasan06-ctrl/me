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
import random
from collections import defaultdict
from statistics import mean

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

    # Wearable device connection status (mock integration)
    c.execute('''CREATE TABLE IF NOT EXISTS wearable_connections
                 (user_id TEXT PRIMARY KEY,
                  provider TEXT,
                  status TEXT,
                  connected_at TEXT,
                  updated_at TEXT,
                  FOREIGN KEY (user_id) REFERENCES users(id))''')

    # Wearable samples (generic schema)
    c.execute('''CREATE TABLE IF NOT EXISTS wearable_samples
                 (id TEXT PRIMARY KEY,
                  user_id TEXT NOT NULL,
                  metric TEXT NOT NULL,
                  value REAL NOT NULL,
                  unit TEXT,
                  timestamp TEXT NOT NULL,
                  source TEXT,
                  metadata TEXT,
                  FOREIGN KEY (user_id) REFERENCES users(id))''')

    # Helpful indexes for queries
    c.execute('CREATE INDEX IF NOT EXISTS idx_wearable_samples_user_metric_time ON wearable_samples(user_id, metric, timestamp)')
    
    conn.commit()
    conn.close()

init_db()

def get_db():
    conn = sqlite3.connect('health_chatbot.db')
    conn.row_factory = sqlite3.Row
    return conn

# ----------------------
# Wearables helpers
# ----------------------
def _dt_to_date_str(dt: datetime) -> str:
    return dt.date().isoformat()

def _parse_iso_dt(iso_str: str) -> datetime:
    try:
        return datetime.fromisoformat(iso_str)
    except Exception:
        # Fallback: treat as now if unparseable
        return datetime.now()

def get_wearable_connection(user_id: str):
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT provider, status, connected_at, updated_at FROM wearable_connections WHERE user_id = ?', (user_id,))
    row = c.fetchone()
    conn.close()
    if not row:
        return {'connected': False, 'provider': None, 'status': 'disconnected', 'connected_at': None}
    return {
        'connected': row['status'] == 'connected',
        'provider': row['provider'],
        'status': row['status'],
        'connected_at': row['connected_at']
    }

def get_wearable_summary(user_id: str, days: int = 7):
    """Aggregate last N days of wearable samples into a compact summary dict."""
    end_dt = datetime.now()
    start_dt = end_dt - timedelta(days=days)
    conn = get_db()
    c = conn.cursor()
    c.execute('''SELECT metric, value, unit, timestamp FROM wearable_samples
                 WHERE user_id = ? AND timestamp BETWEEN ? AND ?''',
              (user_id, start_dt.isoformat(), end_dt.isoformat()))
    rows = c.fetchall()
    conn.close()

    # Bucket by metric
    metric_to_values = defaultdict(list)
    daily_steps = defaultdict(float)  # date_str -> steps
    daily_sleep = defaultdict(float)  # date_str -> hours

    for r in rows:
        metric = r['metric']
        value = float(r['value'])
        unit = (r['unit'] or '').lower()
        ts = _parse_iso_dt(r['timestamp'])

        metric_to_values[metric].append(value)

        if metric == 'steps':
            daily_steps[_dt_to_date_str(ts)] += value
        elif metric in ('sleep_hours', 'sleep'):  # support either
            # store in hours
            hours = value if unit in ('h', 'hour', 'hours', '') else (value / 60.0 if unit in ('m', 'min', 'mins', 'minutes') else value)
            daily_sleep[_dt_to_date_str(ts)] += hours

    # Compute aggregates
    def safe_mean(values):
        return round(mean(values), 2) if values else None

    def safe_sum(values):
        return round(sum(values), 2) if values else None

    # Steps
    steps_days = list(daily_steps.values())
    steps_total = safe_sum(steps_days) or 0
    steps_avg = round(steps_total / max(1, len(daily_steps)), 0) if daily_steps else 0

    # Sleep
    sleep_days = list(daily_sleep.values())
    sleep_avg = safe_mean(sleep_days)

    # Heart rate
    hr_values = metric_to_values.get('heart_rate', [])
    resting_values = metric_to_values.get('resting_heart_rate', [])
    hr_avg = safe_mean(hr_values)
    hr_min = round(min(hr_values), 1) if hr_values else None
    hr_max = round(max(hr_values), 1) if hr_values else None
    resting_hr = safe_mean(resting_values)

    # SpO2
    spo2_values = metric_to_values.get('spo2', [])
    spo2_avg = safe_mean(spo2_values)

    # Active minutes
    active_min_values = metric_to_values.get('active_minutes', [])
    active_min_total = safe_sum(active_min_values)

    summary = {
        'range_days': days,
        'steps': {
            'average_per_day': steps_avg,
            'total': steps_total,
            'days_counted': len(daily_steps)
        },
        'sleep': {
            'average_hours_per_night': sleep_avg,
            'nights_counted': len(daily_sleep)
        },
        'heart_rate': {
            'average': hr_avg,
            'min': hr_min,
            'max': hr_max,
            'resting_average': resting_hr
        },
        'spo2': {
            'average_percent': spo2_avg
        },
        'activity': {
            'active_minutes_total': active_min_total
        }
    }

    return summary

def format_wearable_summary_for_prompt(summary: dict) -> str:
    if not summary:
        return ''
    lines = [f"Range: last {summary.get('range_days', 7)} days"]
    steps = summary.get('steps', {})
    if steps.get('average_per_day') is not None:
        lines.append(f"Steps avg/day: {int(steps['average_per_day'])} (total {int(steps.get('total') or 0)})")
    sleep = summary.get('sleep', {})
    if sleep.get('average_hours_per_night') is not None:
        lines.append(f"Sleep avg/night: {sleep['average_hours_per_night']} h")
    hr = summary.get('heart_rate', {})
    if hr.get('resting_average') is not None:
        lines.append(f"Resting HR avg: {hr['resting_average']} bpm")
    elif hr.get('average') is not None:
        lines.append(f"HR avg: {hr['average']} bpm (min {hr.get('min')}, max {hr.get('max')})")
    spo2 = summary.get('spo2', {})
    if spo2.get('average_percent') is not None:
        lines.append(f"SpO2 avg: {spo2['average_percent']}%")
    act = summary.get('activity', {})
    if act.get('active_minutes_total') is not None:
        lines.append(f"Active minutes total: {act['active_minutes_total']}")
    return "\n".join(lines)

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

def get_wearable_context(user_id: str, days: int = 7) -> str:
    summary = get_wearable_summary(user_id, days)
    if not summary:
        return ""
    formatted = format_wearable_summary_for_prompt(summary)
    if not formatted:
        return ""
    return f"Recent Wearable Data (last {days} days):\n{formatted}\n"

def _fallback_health_response(user_message: str, profile_context: str, wearable_context: str) -> str:
    """Generate a simple, safe, rule-based fallback response without external LLMs."""
    lines = []
    lines.append("I'm a supportive AI assistant. I can't diagnose or prescribe.")
    lines.append("For urgent or serious symptoms, please contact a healthcare professional.")
    if wearable_context:
        lines.append("")
        lines.append("Here's a brief summary from your recent wearable data:")
        for ln in wearable_context.strip().splitlines():
            if ln.strip() and not ln.lower().startswith('recent wearable data'):
                lines.append(f"- {ln.strip()}")
    lines.append("")
    lines.append("Based on healthy habits, you might consider:")
    lines.append("- Aim for 7–9 hours of consistent sleep if possible.")
    lines.append("- Add light activity on low-step days (e.g., a 15–20 minute walk).")
    lines.append("- Stay hydrated and keep a balanced diet.")
    lines.append("- Practice short breathing or stretching breaks to manage stress.")
    lines.append("")
    if user_message := (user_message or '').strip():
        lines.append(f"You asked: \"{user_message}\". If you can share more details, I can tailor general guidance.")
    return "\n".join(lines)

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

        wearable_ctx = get_wearable_context(session['user_id'], days=7)
        if wearable_ctx:
            system_prompt += f"\n{wearable_ctx}\n"
        
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
        # Fallback to a safe, rule-based response when LLM is unavailable
        try:
            user_context = get_user_context(session['user_id'])
            wearable_ctx = get_wearable_context(session['user_id'], days=7)
            fallback_text = _fallback_health_response(user_message, user_context, wearable_ctx)

            # Save to chat history
            conn = get_db()
            c = conn.cursor()
            chat_id = str(uuid.uuid4())
            c.execute('INSERT INTO chat_history (id, user_id, message, response, timestamp) VALUES (?, ?, ?, ?, ?)',
                      (chat_id, session['user_id'], user_message, fallback_text, datetime.now().isoformat()))
            conn.commit()
            conn.close()

            return jsonify({'response': fallback_text, 'timestamp': datetime.now().isoformat(), 'fallback': True}), 200
        except Exception as inner:
            return jsonify({'error': f'Error generating response: {str(e)}; Fallback failed: {str(inner)}'}), 500

# ----------------------
# Wearables API
# ----------------------
@app.route('/api/wearables/status', methods=['GET'])
def wearable_status():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    return jsonify(get_wearable_connection(session['user_id'])), 200

@app.route('/api/wearables/connect', methods=['POST'])
def wearable_connect():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    data = request.json or {}
    provider = data.get('provider', 'demo')
    now = datetime.now().isoformat()
    conn = get_db()
    c = conn.cursor()
    # Upsert behavior
    c.execute('SELECT user_id FROM wearable_connections WHERE user_id = ?', (session['user_id'],))
    exists = c.fetchone()
    if exists:
        c.execute('''UPDATE wearable_connections
                     SET provider = ?, status = ?, updated_at = ?
                     WHERE user_id = ?''', (provider, 'connected', now, session['user_id']))
    else:
        c.execute('''INSERT INTO wearable_connections (user_id, provider, status, connected_at, updated_at)
                     VALUES (?, ?, ?, ?, ?)''', (session['user_id'], provider, 'connected', now, now))
    conn.commit()
    conn.close()
    return jsonify({'message': f'Connected to {provider}', 'provider': provider}), 200

@app.route('/api/wearables/disconnect', methods=['POST'])
def wearable_disconnect():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    conn = get_db()
    c = conn.cursor()
    c.execute('UPDATE wearable_connections SET status = ?, updated_at = ? WHERE user_id = ?',
              ('disconnected', datetime.now().isoformat(), session['user_id']))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Wearable disconnected'}), 200

@app.route('/api/wearables/samples', methods=['POST'])
def wearable_samples_ingest():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    data = request.json or {}
    samples = data.get('samples', [])
    if not isinstance(samples, list) or not samples:
        return jsonify({'error': 'samples must be a non-empty list'}), 400
    conn = get_db()
    c = conn.cursor()
    inserted = 0
    now_iso = datetime.now().isoformat()
    for s in samples:
        metric = (s.get('metric') or '').strip()
        value = s.get('value')
        unit = s.get('unit')
        ts = s.get('timestamp') or now_iso
        source = s.get('source') or 'manual'
        metadata = s.get('metadata') or {}
        if not metric or value is None:
            continue
        try:
            sample_id = str(uuid.uuid4())
            c.execute('''INSERT INTO wearable_samples (id, user_id, metric, value, unit, timestamp, source, metadata)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                      (sample_id, session['user_id'], metric, float(value), unit, ts, source, json.dumps(metadata)))
            inserted += 1
        except Exception:
            continue
    conn.commit()
    conn.close()
    return jsonify({'inserted': inserted}), 201

@app.route('/api/wearables/demo-data', methods=['POST'])
def wearable_demo_data():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    data = request.json or {}
    days = int(data.get('days', 14))
    end_dt = datetime.now()
    start_dt = end_dt - timedelta(days=days)
    conn = get_db()
    c = conn.cursor()
    # Generate per-day aggregates
    for i in range(days):
        day = start_dt + timedelta(days=i)
        day_iso = day.replace(hour=8, minute=0, second=0, microsecond=0).isoformat()
        # Steps
        steps = int(random.gauss(8500, 2000))
        steps = max(0, steps)
        c.execute('''INSERT INTO wearable_samples (id, user_id, metric, value, unit, timestamp, source, metadata)
                     VALUES (?, ?, 'steps', ?, 'count', ?, 'demo', '{}')''',
                  (str(uuid.uuid4()), session['user_id'], steps, day_iso))
        # Sleep hours
        sleep_h = round(min(max(random.gauss(7.0, 1.0), 4.0), 10.0), 2)
        c.execute('''INSERT INTO wearable_samples (id, user_id, metric, value, unit, timestamp, source, metadata)
                     VALUES (?, ?, 'sleep_hours', ?, 'hours', ?, 'demo', '{}')''',
                  (str(uuid.uuid4()), session['user_id'], sleep_h, day_iso))
        # Resting HR
        rhr = round(random.gauss(65, 5), 1)
        c.execute('''INSERT INTO wearable_samples (id, user_id, metric, value, unit, timestamp, source, metadata)
                     VALUES (?, ?, 'resting_heart_rate', ?, 'bpm', ?, 'demo', '{}')''',
                  (str(uuid.uuid4()), session['user_id'], rhr, day_iso))
        # SpO2
        spo2 = round(min(max(random.gauss(97.0, 1.0), 93.0), 100.0), 1)
        c.execute('''INSERT INTO wearable_samples (id, user_id, metric, value, unit, timestamp, source, metadata)
                     VALUES (?, ?, 'spo2', ?, 'percent', ?, 'demo', '{}')''',
                  (str(uuid.uuid4()), session['user_id'], spo2, day_iso))
        # Active minutes
        active_m = int(min(max(random.gauss(45, 25), 0), 180))
        c.execute('''INSERT INTO wearable_samples (id, user_id, metric, value, unit, timestamp, source, metadata)
                     VALUES (?, ?, 'active_minutes', ?, 'minutes', ?, 'demo', '{}')''',
                  (str(uuid.uuid4()), session['user_id'], active_m, day_iso))
    conn.commit()
    conn.close()
    return jsonify({'message': f'Inserted demo data for last {days} days'}), 201

@app.route('/api/wearables/summary', methods=['GET'])
def wearable_summary_endpoint():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    try:
        days = int(request.args.get('days', '7'))
    except Exception:
        days = 7
    summary = get_wearable_summary(session['user_id'], days)
    return jsonify({'summary': summary}), 200

@app.route('/api/wearables/timeseries', methods=['GET'])
def wearable_timeseries():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    metric = request.args.get('metric', 'steps')
    try:
        days = int(request.args.get('days', '14'))
    except Exception:
        days = 14
    end_dt = datetime.now()
    start_dt = end_dt - timedelta(days=days)
    conn = get_db()
    c = conn.cursor()
    c.execute('''SELECT value, unit, timestamp FROM wearable_samples
                 WHERE user_id = ? AND metric = ? AND timestamp BETWEEN ? AND ?
                 ORDER BY timestamp ASC''',
              (session['user_id'], metric, start_dt.isoformat(), end_dt.isoformat()))
    rows = c.fetchall()
    conn.close()
    # Aggregate per-day bucket
    per_day = defaultdict(float)
    for r in rows:
        ts = _parse_iso_dt(r['timestamp'])
        day = _dt_to_date_str(ts)
        per_day[day] += float(r['value'])
    series = [{'date': d, 'value': round(v, 2)} for d, v in sorted(per_day.items())]
    return jsonify({'metric': metric, 'series': series}), 200

@app.route('/api/wearables/recommendations', methods=['GET'])
def wearable_recommendations():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    try:
        days = int(request.args.get('days', '7'))
    except Exception:
        days = 7
    user_context = get_user_context(session['user_id'])
    summary = get_wearable_summary(session['user_id'], days)
    formatted = format_wearable_summary_for_prompt(summary)
    try:
        model = genai.GenerativeModel('gemini-pro')
        prompt = f"""You are a supportive AI health coach. Based on the user's profile and their recent wearable data, provide 3-5 personalized, actionable suggestions. Be encouraging, specific, and safe.

{user_context}

Recent Wearable Data (last {days} days):
{formatted}

Guidelines:
- Focus on sleep, activity, recovery, and overall wellness
- Avoid diagnosis or prescribing
- Include gentle reminders and achievable next steps
"""
        response = model.generate_content(prompt)
        text = response.text
    except Exception:
        text = (
            "1) Aim for 7–9 hours of sleep by setting a consistent bedtime.\n"
            "2) Add a 15–20 minute walk on low-activity days to boost steps.\n"
            "3) Practice 5 minutes of breathing exercises if resting HR trends high.\n"
            "4) Stay hydrated and consider light stretching on recovery days."
        )
    return jsonify({'recommendations': text, 'summary': summary}), 200

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
