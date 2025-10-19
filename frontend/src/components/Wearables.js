import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Wearables = ({ username, onLogout }) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState({});
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualData, setManualData] = useState({
    date: new Date().toISOString().split('T')[0],
    steps: '',
    calories: '',
    active_minutes: '',
    sleep_hours: '',
    sleep_quality: ''
  });

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await axios.get('/api/wearables/devices');
      setDevices(response.data.devices);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectFitbit = async () => {
    try {
      const response = await axios.get('/api/wearables/connect/fitbit');
      // Redirect to Fitbit authorization
      window.location.href = response.data.authorization_url;
    } catch (error) {
      console.error('Error connecting Fitbit:', error);
      alert('Failed to connect Fitbit. Please check your configuration.');
    }
  };

  const syncDevice = async (deviceId) => {
    setSyncing(prev => ({ ...prev, [deviceId]: true }));
    try {
      await axios.post(`/api/wearables/sync/${deviceId}`);
      alert('Data synced successfully!');
      fetchDevices(); // Refresh device list
    } catch (error) {
      console.error('Error syncing device:', error);
      alert('Failed to sync device data.');
    } finally {
      setSyncing(prev => ({ ...prev, [deviceId]: false }));
    }
  };

  const disconnectDevice = async (deviceId) => {
    if (window.confirm('Are you sure you want to disconnect this device?')) {
      try {
        await axios.delete(`/api/wearables/disconnect/${deviceId}`);
        fetchDevices(); // Refresh device list
      } catch (error) {
        console.error('Error disconnecting device:', error);
        alert('Failed to disconnect device.');
      }
    }
  };

  const handleManualEntry = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/health/manual-entry', manualData);
      alert('Health data saved successfully!');
      setShowManualEntry(false);
      setManualData({
        date: new Date().toISOString().split('T')[0],
        steps: '',
        calories: '',
        active_minutes: '',
        sleep_hours: '',
        sleep_quality: ''
      });
    } catch (error) {
      console.error('Error saving manual data:', error);
      alert('Failed to save health data.');
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'fitbit':
        return '⌚';
      case 'garmin':
        return '🏃';
      case 'apple':
        return '📱';
      default:
        return '📊';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading wearable devices...</p>
      </div>
    );
  }

  return (
    <div className="wearables-container">
      <nav className="navbar">
        <div className="nav-brand">
          <h1>🏥 Health Chatbot</h1>
        </div>
        <div className="nav-menu">
          <a href="/chat" className="nav-link">💬 Chat</a>
          <a href="/profile" className="nav-link">👤 Profile</a>
          <a href="/documents" className="nav-link">📄 Documents</a>
          <a href="/followups" className="nav-link">⏰ Follow-ups</a>
          <a href="/wearables" className="nav-link active">⌚ Wearables</a>
          <a href="/analytics" className="nav-link">📊 Analytics</a>
          <div className="nav-user">
            <span>👋 {username}</span>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </nav>

      <div className="main-content">
        <div className="page-header">
          <h2>⌚ Wearable Devices</h2>
          <p>Connect your fitness trackers and health devices for personalized insights</p>
        </div>

        <div className="wearables-grid">
          {/* Connected Devices */}
          <div className="devices-section">
            <h3>Connected Devices</h3>
            {devices.length === 0 ? (
              <div className="empty-state">
                <p>No devices connected yet</p>
                <p>Connect your wearable devices to get personalized health insights</p>
              </div>
            ) : (
              <div className="devices-list">
                {devices.map(device => (
                  <div key={device.id} className="device-card">
                    <div className="device-info">
                      <span className="device-icon">{getDeviceIcon(device.device_type)}</span>
                      <div className="device-details">
                        <h4>{device.device_name}</h4>
                        <p className="device-type">{device.device_type.charAt(0).toUpperCase() + device.device_type.slice(1)}</p>
                        <p className="last-sync">
                          Last sync: {device.last_sync ? new Date(device.last_sync).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                    </div>
                    <div className="device-actions">
                      <button 
                        onClick={() => syncDevice(device.id)}
                        disabled={syncing[device.id]}
                        className="sync-btn"
                      >
                        {syncing[device.id] ? '🔄 Syncing...' : '🔄 Sync Now'}
                      </button>
                      <button 
                        onClick={() => disconnectDevice(device.id)}
                        className="disconnect-btn"
                      >
                        🔌 Disconnect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Connections */}
          <div className="connect-section">
            <h3>Connect New Device</h3>
            <div className="connection-options">
              <div className="connection-card">
                <div className="connection-info">
                  <span className="connection-icon">⌚</span>
                  <div>
                    <h4>Fitbit</h4>
                    <p>Track steps, heart rate, sleep, and more</p>
                  </div>
                </div>
                <button onClick={connectFitbit} className="connect-btn">
                  Connect Fitbit
                </button>
              </div>

              <div className="connection-card">
                <div className="connection-info">
                  <span className="connection-icon">🏃</span>
                  <div>
                    <h4>Garmin</h4>
                    <p>Advanced fitness and health tracking</p>
                  </div>
                </div>
                <button className="connect-btn disabled" disabled>
                  Coming Soon
                </button>
              </div>

              <div className="connection-card">
                <div className="connection-info">
                  <span className="connection-icon">📱</span>
                  <div>
                    <h4>Apple Health</h4>
                    <p>Comprehensive health data from iOS</p>
                  </div>
                </div>
                <button className="connect-btn disabled" disabled>
                  Coming Soon
                </button>
              </div>
            </div>
          </div>

          {/* Manual Data Entry */}
          <div className="manual-entry-section">
            <h3>Manual Data Entry</h3>
            <p>Don't have a wearable device? Enter your health data manually.</p>
            
            {!showManualEntry ? (
              <button 
                onClick={() => setShowManualEntry(true)}
                className="manual-entry-btn"
              >
                📝 Add Health Data
              </button>
            ) : (
              <form onSubmit={handleManualEntry} className="manual-entry-form">
                <div className="form-group">
                  <label>Date:</label>
                  <input
                    type="date"
                    value={manualData.date}
                    onChange={(e) => setManualData({...manualData, date: e.target.value})}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Steps:</label>
                    <input
                      type="number"
                      placeholder="e.g., 8000"
                      value={manualData.steps}
                      onChange={(e) => setManualData({...manualData, steps: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Calories Burned:</label>
                    <input
                      type="number"
                      placeholder="e.g., 2000"
                      value={manualData.calories}
                      onChange={(e) => setManualData({...manualData, calories: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Active Minutes:</label>
                    <input
                      type="number"
                      placeholder="e.g., 30"
                      value={manualData.active_minutes}
                      onChange={(e) => setManualData({...manualData, active_minutes: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Sleep Hours:</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g., 7.5"
                      value={manualData.sleep_hours}
                      onChange={(e) => setManualData({...manualData, sleep_hours: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Sleep Quality (1-10):</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="e.g., 8"
                    value={manualData.sleep_quality}
                    onChange={(e) => setManualData({...manualData, sleep_quality: e.target.value})}
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="save-btn">💾 Save Data</button>
                  <button 
                    type="button" 
                    onClick={() => setShowManualEntry(false)}
                    className="cancel-btn"
                  >
                    ❌ Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .wearables-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .navbar {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .nav-brand h1 {
          color: white;
          margin: 0;
          font-size: 1.5rem;
        }

        .nav-menu {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .nav-link {
          color: white;
          text-decoration: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .nav-link:hover, .nav-link.active {
          background: rgba(255, 255, 255, 0.2);
        }

        .nav-user {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: white;
        }

        .logout-btn {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .logout-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .main-content {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          text-align: center;
          margin-bottom: 3rem;
          color: white;
        }

        .page-header h2 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .wearables-grid {
          display: grid;
          gap: 2rem;
        }

        .devices-section, .connect-section, .manual-entry-section {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .devices-section h3, .connect-section h3, .manual-entry-section h3 {
          color: white;
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
        }

        .empty-state {
          text-align: center;
          color: rgba(255, 255, 255, 0.8);
          padding: 2rem;
        }

        .devices-list {
          display: grid;
          gap: 1rem;
        }

        .device-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .device-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .device-icon {
          font-size: 2rem;
        }

        .device-details h4 {
          color: white;
          margin: 0 0 0.5rem 0;
        }

        .device-type, .last-sync {
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          font-size: 0.9rem;
        }

        .device-actions {
          display: flex;
          gap: 0.5rem;
        }

        .sync-btn, .disconnect-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .sync-btn {
          background: #4CAF50;
          color: white;
        }

        .sync-btn:hover:not(:disabled) {
          background: #45a049;
        }

        .sync-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .disconnect-btn {
          background: #f44336;
          color: white;
        }

        .disconnect-btn:hover {
          background: #da190b;
        }

        .connection-options {
          display: grid;
          gap: 1rem;
        }

        .connection-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .connection-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .connection-icon {
          font-size: 2rem;
        }

        .connection-info h4 {
          color: white;
          margin: 0 0 0.5rem 0;
        }

        .connection-info p {
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          font-size: 0.9rem;
        }

        .connect-btn {
          background: #2196F3;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s ease;
        }

        .connect-btn:hover:not(:disabled) {
          background: #1976D2;
        }

        .connect-btn.disabled {
          background: rgba(255, 255, 255, 0.3);
          cursor: not-allowed;
        }

        .manual-entry-section p {
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 1.5rem;
        }

        .manual-entry-btn {
          background: #FF9800;
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: bold;
          transition: all 0.3s ease;
        }

        .manual-entry-btn:hover {
          background: #F57C00;
        }

        .manual-entry-form {
          display: grid;
          gap: 1rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          color: white;
          margin-bottom: 0.5rem;
          font-weight: bold;
        }

        .form-group input {
          padding: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 1rem;
        }

        .form-group input::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .save-btn {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s ease;
        }

        .save-btn:hover {
          background: #45a049;
        }

        .cancel-btn {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s ease;
        }

        .cancel-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .nav-menu {
            flex-direction: column;
            gap: 1rem;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .device-card, .connection-card {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Wearables;