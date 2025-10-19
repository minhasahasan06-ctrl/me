import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Followups({ username, onLogout }) {
  const [followups, setFollowups] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    frequency: 'weekly',
    notes: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [completingId, setCompletingId] = useState(null);
  const [completeNotes, setCompleteNotes] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadFollowups();
  }, []);

  const loadFollowups = async () => {
    try {
      const response = await axios.get('/api/followups');
      setFollowups(response.data.followups);
    } catch (error) {
      console.error('Error loading follow-ups:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      await axios.post('/api/followups', formData);
      setMessage({ type: 'success', text: 'Follow-up created successfully!' });
      setFormData({ title: '', frequency: 'weekly', notes: '' });
      setShowCreateForm(false);
      loadFollowups();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to create follow-up' 
      });
    }
  };

  const handleComplete = async (followupId) => {
    try {
      const response = await axios.post(`/api/followups/${followupId}/complete`, {
        notes: completeNotes
      });
      
      setAiResponse(response.data.ai_response);
      setCompletingId(null);
      setCompleteNotes('');
      loadFollowups();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to complete follow-up' });
    }
  };

  const handleDelete = async (followupId) => {
    if (!window.confirm('Are you sure you want to delete this follow-up?')) return;

    try {
      await axios.delete(`/api/followups/${followupId}`);
      setMessage({ type: 'success', text: 'Follow-up deleted successfully' });
      loadFollowups();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete follow-up' });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays <= 7) return `In ${diffDays} days`;
    
    return date.toLocaleDateString();
  };

  const getFrequencyEmoji = (frequency) => {
    switch (frequency) {
      case 'daily': return '📅';
      case 'weekly': return '📆';
      case 'biweekly': return '🗓️';
      case 'monthly': return '📊';
      default: return '⏰';
    }
  };

  return (
    <div className="followups-container">
      <div className="header">
        <h1>🏥 MedLM Health Assistant</h1>
        <div className="header-actions">
          <span>Welcome, {username}!</span>
          <button className="btn btn-secondary" onClick={() => navigate('/chat')}>
            Chat
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/wearables')}>
            ⌚ Wearables
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/documents')}>
            Documents
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/profile')}>
            Profile
          </button>
          <button className="btn btn-secondary" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="followups-content">
        <div className="followups-header">
          <h2>⏰ Regular Follow-ups</h2>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? '✕ Cancel' : '➕ Create Follow-up'}
          </button>
        </div>

        <p style={{ color: '#666', marginBottom: '20px' }}>
          Set up regular check-ins for medication reminders, symptom tracking, exercise goals, or any health-related routines.
        </p>

        {message.text && (
          <div className={`${message.type}-message`}>
            {message.text}
          </div>
        )}

        {showCreateForm && (
          <div className="create-followup-form">
            <h3>Create New Follow-up</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Take blood pressure medication"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="frequency">Frequency *</label>
                <select
                  id="frequency"
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                  required
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every 2 Weeks</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes (Optional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional information or reminders"
                  rows="3"
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Create Follow-up
              </button>
            </form>
          </div>
        )}

        <div className="followups-list">
          {followups.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⏰</div>
              <h3>No Follow-ups Yet</h3>
              <p>Create your first follow-up to stay on track with your health goals!</p>
            </div>
          ) : (
            <div className="followups-grid">
              {followups.map((followup) => (
                <div 
                  key={followup.id} 
                  className={`followup-card ${followup.is_overdue ? 'overdue' : ''}`}
                >
                  <div className="followup-header">
                    <span className="frequency-badge">
                      {getFrequencyEmoji(followup.frequency)} {followup.frequency}
                    </span>
                    {followup.is_overdue && <span className="overdue-badge">⚠️ Overdue</span>}
                  </div>
                  
                  <h3>{followup.title}</h3>
                  
                  {followup.notes && (
                    <p className="followup-notes">{followup.notes}</p>
                  )}
                  
                  <div className="followup-dates">
                    <div className="date-info">
                      <span className="label">Next Check-in:</span>
                      <span className="date">{formatDate(followup.next_date)}</span>
                    </div>
                    {followup.last_completed && (
                      <div className="date-info">
                        <span className="label">Last Completed:</span>
                        <span className="date">
                          {new Date(followup.last_completed).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="followup-actions">
                    <button
                      className="btn btn-primary btn-small"
                      onClick={() => setCompletingId(followup.id)}
                    >
                      ✓ Complete Check-in
                    </button>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => handleDelete(followup.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {completingId && (
          <div className="modal-overlay" onClick={() => setCompletingId(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>✓ Complete Check-in</h2>
                <button className="close-btn" onClick={() => setCompletingId(null)}>✕</button>
              </div>
              
              <div className="form-group">
                <label>How are you feeling? Any updates? (Optional)</label>
                <textarea
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  placeholder="Share any symptoms, progress, or concerns..."
                  rows="4"
                />
              </div>

              <div className="modal-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => handleComplete(completingId)}
                >
                  Complete Check-in
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setCompletingId(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {aiResponse && (
          <div className="modal-overlay" onClick={() => setAiResponse(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🎉 Check-in Complete!</h2>
                <button className="close-btn" onClick={() => setAiResponse(null)}>✕</button>
              </div>
              
              <div className="ai-response-box">
                {aiResponse}
              </div>

              <button
                className="btn btn-primary"
                onClick={() => setAiResponse(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Followups;
