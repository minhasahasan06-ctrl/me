import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Wearables = ({ username, onLogout }) => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [goals, setGoals] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('devices');
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newDevice, setNewDevice] = useState({ device_name: '', device_type: '', device_model: '' });
  const [newGoal, setNewGoal] = useState({ goal_type: '', target_value: '', unit: '', target_date: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [devicesRes, metricsRes, goalsRes, analyticsRes] = await Promise.all([
        axios.get('/api/wearables/devices'),
        axios.get('/api/wearables/metrics?days=7'),
        axios.get('/api/wearables/goals'),
        axios.get('/api/wearables/analytics?days=7')
      ]);
      
      setDevices(devicesRes.data.devices);
      setMetrics(metricsRes.data.metrics);
      setGoals(goalsRes.data.goals);
      setAnalytics(analyticsRes.data.analytics);
    } catch (error) {
      console.error('Error loading wearable data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addDevice = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/wearables/devices', newDevice);
      setNewDevice({ device_name: '', device_type: '', device_model: '' });
      setShowAddDevice(false);
      loadData();
    } catch (error) {
      console.error('Error adding device:', error);
    }
  };

  const addGoal = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/wearables/goals', {
        ...newGoal,
        target_value: parseFloat(newGoal.target_value)
      });
      setNewGoal({ goal_type: '', target_value: '', unit: '', target_date: '' });
      setShowAddGoal(false);
      loadData();
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const syncDevice = async (deviceId) => {
    try {
      await axios.post('/api/wearables/sync', { device_id: deviceId });
      loadData();
    } catch (error) {
      console.error('Error syncing device:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const getMetricIcon = (metricType) => {
    const icons = {
      steps: '👟',
      heart_rate: '❤️',
      calories: '🔥',
      sleep: '😴',
      active_minutes: '🏃'
    };
    return icons[metricType] || '📊';
  };

  const getGoalProgress = (goal) => {
    if (goal.current_value === null) return 0;
    return Math.min((goal.current_value / goal.target_value) * 100, 100);
  };

  return (
    <div className="wearables-container">
      <div className="header">
        <h1>🏥 Wearable Health Dashboard</h1>
        <div className="header-actions">
          <span className="username">Welcome, {username}</span>
          <button className="btn btn-secondary" onClick={() => navigate('/chat')}>
            Chat
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/documents')}>
            Documents
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/followups')}>
            Follow-ups
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/analytics')}>
            Analytics
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/profile')}>
            Profile
          </button>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={activeTab === 'devices' ? 'active' : ''} 
          onClick={() => setActiveTab('devices')}
        >
          📱 Devices
        </button>
        <button 
          className={activeTab === 'metrics' ? 'active' : ''} 
          onClick={() => setActiveTab('metrics')}
        >
          📊 Metrics
        </button>
        <button 
          className={activeTab === 'goals' ? 'active' : ''} 
          onClick={() => setActiveTab('goals')}
        >
          🎯 Goals
        </button>
        <button 
          className={activeTab === 'analytics' ? 'active' : ''} 
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading wearable data...</p>
        </div>
      )}

      {activeTab === 'devices' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>My Wearable Devices</h2>
            <button 
              className="add-btn"
              onClick={() => setShowAddDevice(true)}
            >
              + Add Device
            </button>
          </div>

          {showAddDevice && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Add New Device</h3>
                <form onSubmit={addDevice}>
                  <div className="form-group">
                    <label>Device Name</label>
                    <input
                      type="text"
                      value={newDevice.device_name}
                      onChange={(e) => setNewDevice({...newDevice, device_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Device Type</label>
                    <select
                      value={newDevice.device_type}
                      onChange={(e) => setNewDevice({...newDevice, device_type: e.target.value})}
                      required
                    >
                      <option value="">Select type</option>
                      <option value="fitness_tracker">Fitness Tracker</option>
                      <option value="smartwatch">Smartwatch</option>
                      <option value="heart_monitor">Heart Rate Monitor</option>
                      <option value="sleep_tracker">Sleep Tracker</option>
                      <option value="scale">Smart Scale</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Model (Optional)</label>
                    <input
                      type="text"
                      value={newDevice.device_model}
                      onChange={(e) => setNewDevice({...newDevice, device_model: e.target.value})}
                    />
                  </div>
                  <div className="form-actions">
                    <button type="button" onClick={() => setShowAddDevice(false)}>Cancel</button>
                    <button type="submit">Add Device</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="devices-grid">
            {devices.map(device => (
              <div key={device.id} className="device-card">
                <div className="device-header">
                  <h3>{device.device_name}</h3>
                  <span className={`status ${device.is_active ? 'active' : 'inactive'}`}>
                    {device.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="device-type">{device.device_type.replace('_', ' ').toUpperCase()}</p>
                {device.device_model && <p className="device-model">{device.device_model}</p>}
                <p className="last-sync">
                  Last sync: {device.last_sync ? formatTime(device.last_sync) : 'Never'}
                </p>
                <button 
                  className="sync-btn"
                  onClick={() => syncDevice(device.id)}
                >
                  🔄 Sync Data
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="tab-content">
          <h2>Recent Health Metrics</h2>
          <div className="metrics-grid">
            {metrics.slice(0, 20).map(metric => (
              <div key={metric.id} className="metric-card">
                <div className="metric-header">
                  <span className="metric-icon">{getMetricIcon(metric.metric_type)}</span>
                  <span className="metric-type">{metric.metric_type.replace('_', ' ').toUpperCase()}</span>
                </div>
                <div className="metric-value">
                  {metric.value} {metric.unit}
                </div>
                <div className="metric-meta">
                  <span className="device">{metric.device_name || 'Manual Entry'}</span>
                  <span className="time">{formatTime(metric.recorded_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'goals' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Health Goals</h2>
            <button 
              className="add-btn"
              onClick={() => setShowAddGoal(true)}
            >
              + Add Goal
            </button>
          </div>

          {showAddGoal && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Create Health Goal</h3>
                <form onSubmit={addGoal}>
                  <div className="form-group">
                    <label>Goal Type</label>
                    <select
                      value={newGoal.goal_type}
                      onChange={(e) => setNewGoal({...newGoal, goal_type: e.target.value})}
                      required
                    >
                      <option value="">Select goal type</option>
                      <option value="daily_steps">Daily Steps</option>
                      <option value="heart_rate_zone">Heart Rate Zone</option>
                      <option value="sleep_hours">Sleep Hours</option>
                      <option value="calories_burned">Calories Burned</option>
                      <option value="active_minutes">Active Minutes</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Target Value</label>
                    <input
                      type="number"
                      value={newGoal.target_value}
                      onChange={(e) => setNewGoal({...newGoal, target_value: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Unit</label>
                    <input
                      type="text"
                      value={newGoal.unit}
                      onChange={(e) => setNewGoal({...newGoal, unit: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Target Date (Optional)</label>
                    <input
                      type="date"
                      value={newGoal.target_date}
                      onChange={(e) => setNewGoal({...newGoal, target_date: e.target.value})}
                    />
                  </div>
                  <div className="form-actions">
                    <button type="button" onClick={() => setShowAddGoal(false)}>Cancel</button>
                    <button type="submit">Create Goal</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="goals-grid">
            {goals.map(goal => (
              <div key={goal.id} className="goal-card">
                <div className="goal-header">
                  <h3>{goal.goal_type.replace('_', ' ').toUpperCase()}</h3>
                  <span className="goal-status">Active</span>
                </div>
                <div className="goal-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${getGoalProgress(goal)}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    {goal.current_value || 0} / {goal.target_value} {goal.unit}
                    ({getGoalProgress(goal).toFixed(1)}%)
                  </div>
                </div>
                {goal.target_date && (
                  <p className="goal-date">Target: {formatDate(goal.target_date)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="tab-content">
          <h2>Health Analytics (Last 7 Days)</h2>
          <div className="analytics-grid">
            {analytics.map(analytic => (
              <div key={analytic.metric_type} className="analytic-card">
                <div className="analytic-header">
                  <span className="analytic-icon">{getMetricIcon(analytic.metric_type)}</span>
                  <h3>{analytic.metric_type.replace('_', ' ').toUpperCase()}</h3>
                </div>
                <div className="analytic-stats">
                  <div className="stat">
                    <span className="stat-label">Average</span>
                    <span className="stat-value">{analytic.average} {analytic.unit}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Min</span>
                    <span className="stat-value">{analytic.minimum} {analytic.unit}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Max</span>
                    <span className="stat-value">{analytic.maximum} {analytic.unit}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Readings</span>
                    <span className="stat-value">{analytic.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Wearables;