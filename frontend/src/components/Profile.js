import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Profile({ username, onLogout }) {
  const [profile, setProfile] = useState({
    full_name: '',
    age: '',
    gender: '',
    medical_history: '',
    allergies: '',
    current_medications: '',
    health_goals: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await axios.get('/api/profile');
      setProfile({
        full_name: response.data.full_name || '',
        age: response.data.age || '',
        gender: response.data.gender || '',
        medical_history: response.data.medical_history || '',
        allergies: response.data.allergies || '',
        current_medications: response.data.current_medications || '',
        health_goals: response.data.health_goals || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.put('/api/profile', profile);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="header">
        <h1>🏥 MedLM Health Assistant</h1>
        <div className="header-actions">
          <span>Welcome, {username}!</span>
          <button className="btn btn-secondary" onClick={() => navigate('/chat')}>
            Chat
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/documents')}>
            Documents
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/followups')}>
            Follow-ups
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/wearables')}>
            Wearables
          </button>
          <button className="btn btn-secondary" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="profile-card">
        <h2>Your Health Profile</h2>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Personalize your experience by sharing your health information. This helps the AI provide more relevant advice.
        </p>

        {message.text && (
          <div className={`${message.type}-message`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="profile-grid">
            <div className="form-group">
              <label htmlFor="full_name">Full Name</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={profile.full_name}
                onChange={handleChange}
                placeholder="John Doe"
              />
            </div>

            <div className="form-group">
              <label htmlFor="age">Age</label>
              <input
                type="number"
                id="age"
                name="age"
                value={profile.age}
                onChange={handleChange}
                placeholder="30"
                min="0"
                max="150"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="gender">Gender</label>
            <select
              id="gender"
              name="gender"
              value={profile.gender}
              onChange={handleChange}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="medical_history">Medical History</label>
            <textarea
              id="medical_history"
              name="medical_history"
              value={profile.medical_history}
              onChange={handleChange}
              placeholder="List any past or current medical conditions (e.g., diabetes, hypertension, asthma)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="allergies">Allergies</label>
            <textarea
              id="allergies"
              name="allergies"
              value={profile.allergies}
              onChange={handleChange}
              placeholder="List any allergies (e.g., penicillin, peanuts, pollen)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="current_medications">Current Medications</label>
            <textarea
              id="current_medications"
              name="current_medications"
              value={profile.current_medications}
              onChange={handleChange}
              placeholder="List any medications you're currently taking"
            />
          </div>

          <div className="form-group">
            <label htmlFor="health_goals">Health Goals</label>
            <textarea
              id="health_goals"
              name="health_goals"
              value={profile.health_goals}
              onChange={handleChange}
              placeholder="What are your health and wellness goals? (e.g., lose weight, manage stress, improve sleep)"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;
