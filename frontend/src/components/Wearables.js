import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

function Wearables({ username, onLogout }) {
  const [devices, setDevices] = useState([]);
  const [metricsSummary, setMetricsSummary] = useState({});
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [newDevice, setNewDevice] = useState({ device_name: '', device_type: 'smartwatch' });
  const [syncing, setSyncing] = useState(false);
  const [metricsData, setMetricsData] = useState({});

  useEffect(() => {
    loadWearableData();
  }, []);

  const loadWearableData = async () => {
    setLoading(true);
    try {
      // Load devices
      const devicesRes = await axios.get('/api/wearables/devices');
      setDevices(devicesRes.data.devices);

      // Load metrics summary
      const summaryRes = await axios.get('/api/wearables/metrics/summary');
      setMetricsSummary(summaryRes.data.summary);

      // Load detailed metrics
      const metricsRes = await axios.get('/api/wearables/metrics?days=7');
      setMetricsData(metricsRes.data.metrics);

      // Load insights
      const insightsRes = await axios.get('/api/wearables/insights');
      setInsights(insightsRes.data.insights);
    } catch (error) {
      console.error('Error loading wearable data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectDevice = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/wearables/devices', newDevice);
      setShowConnectModal(false);
      setNewDevice({ device_name: '', device_type: 'smartwatch' });
      loadWearableData();
      alert('Device connected successfully!');
    } catch (error) {
      alert('Error connecting device: ' + error.response?.data?.error);
    }
  };

  const handleSyncData = async (deviceId) => {
    setSyncing(true);
    try {
      await axios.post('/api/wearables/sync', { device_id: deviceId });
      await loadWearableData();
      alert('Data synced successfully!');
    } catch (error) {
      alert('Error syncing data: ' + error.response?.data?.error);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnectDevice = async (deviceId) => {
    if (window.confirm('Are you sure you want to disconnect this device?')) {
      try {
        await axios.delete(`/api/wearables/devices/${deviceId}`);
        loadWearableData();
      } catch (error) {
        alert('Error disconnecting device: ' + error.response?.data?.error);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getMetricIcon = (type) => {
    const icons = {
      heart_rate: '❤️',
      steps: '👟',
      sleep: '😴',
      calories: '🔥',
      spo2: '🫁'
    };
    return icons[type] || '📊';
  };

  const getMetricColor = (type) => {
    const colors = {
      heart_rate: '#ff6b6b',
      steps: '#4ecdc4',
      sleep: '#9b59b6',
      calories: '#f39c12',
      spo2: '#3498db'
    };
    return colors[type] || '#95a5a6';
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading wearable data...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <nav className="nav-bar">
        <div className="nav-left">
          <h2>🏥 Health Assistant</h2>
          <span className="username">👤 {username}</span>
        </div>
        <div className="nav-links">
          <Link to="/chat">💬 Chat</Link>
          <Link to="/profile">👤 Profile</Link>
          <Link to="/documents">📁 Documents</Link>
          <Link to="/followups">⏰ Follow-ups</Link>
          <Link to="/wearables" className="active">⌚ Wearables</Link>
          <button onClick={onLogout} className="logout-btn">🚪 Logout</button>
        </div>
      </nav>

      <div className="main-content">
        <div className="page-header">
          <h1>⌚ Wearable Devices & Health Metrics</h1>
          <p>Connect your wearable devices and track your health data</p>
        </div>

        {/* Connected Devices Section */}
        <div className="wearables-section">
          <div className="section-header">
            <h2>📱 Connected Devices</h2>
            <button 
              className="btn-primary"
              onClick={() => setShowConnectModal(true)}
            >
              + Connect Device
            </button>
          </div>

          {devices.length === 0 ? (
            <div className="empty-state">
              <p>No devices connected yet</p>
              <button 
                className="btn-primary"
                onClick={() => setShowConnectModal(true)}
              >
                Connect Your First Device
              </button>
            </div>
          ) : (
            <div className="devices-grid">
              {devices.map(device => (
                <div key={device.id} className="device-card">
                  <div className="device-icon">
                    {device.device_type === 'smartwatch' && '⌚'}
                    {device.device_type === 'fitness_band' && '📿'}
                    {device.device_type === 'smart_scale' && '⚖️'}
                    {device.device_type === 'other' && '📱'}
                  </div>
                  <h3>{device.device_name}</h3>
                  <p className="device-type">{device.device_type.replace('_', ' ')}</p>
                  <p className="device-sync">
                    Last synced: {formatDate(device.last_sync)}
                  </p>
                  <div className="device-actions">
                    <button 
                      className="btn-sync"
                      onClick={() => handleSyncData(device.id)}
                      disabled={syncing}
                    >
                      {syncing ? '⏳ Syncing...' : '🔄 Sync Now'}
                    </button>
                    <button 
                      className="btn-danger-small"
                      onClick={() => handleDisconnectDevice(device.id)}
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Health Metrics Dashboard */}
        {Object.keys(metricsSummary).length > 0 && (
          <div className="wearables-section">
            <h2>📊 Today's Health Metrics</h2>
            <div className="metrics-grid">
              {Object.entries(metricsSummary).map(([type, data]) => (
                <div 
                  key={type} 
                  className="metric-card"
                  style={{ borderLeft: `4px solid ${getMetricColor(type)}` }}
                >
                  <div className="metric-icon">{getMetricIcon(type)}</div>
                  <div className="metric-info">
                    <h3>{type.replace('_', ' ').toUpperCase()}</h3>
                    <p className="metric-value">
                      {data.value} <span className="metric-unit">{data.unit}</span>
                    </p>
                    {data.avg_7days && (
                      <p className="metric-avg">
                        7-day avg: {data.avg_7days} {data.unit}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Health Trends */}
        {Object.keys(metricsData).length > 0 && (
          <div className="wearables-section">
            <h2>📈 Health Trends (Last 7 Days)</h2>
            <div className="trends-container">
              {Object.entries(metricsData).map(([type, dataPoints]) => {
                // Get last 7 data points for mini chart
                const recentData = dataPoints.slice(0, 7).reverse();
                const values = recentData.map(d => d.value);
                const max = Math.max(...values);
                const min = Math.min(...values);
                const range = max - min || 1;

                return (
                  <div key={type} className="trend-card">
                    <div className="trend-header">
                      <span className="trend-icon">{getMetricIcon(type)}</span>
                      <h3>{type.replace('_', ' ')}</h3>
                    </div>
                    <div className="mini-chart">
                      {recentData.map((point, idx) => {
                        const height = ((point.value - min) / range) * 80 + 20;
                        return (
                          <div 
                            key={idx}
                            className="chart-bar"
                            style={{ 
                              height: `${height}%`,
                              backgroundColor: getMetricColor(type)
                            }}
                            title={`${point.value} ${point.unit}`}
                          />
                        );
                      })}
                    </div>
                    <p className="trend-summary">
                      Recent: {recentData[recentData.length - 1]?.value} {recentData[0]?.unit}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Insights */}
        {insights && (
          <div className="wearables-section">
            <h2>🤖 AI Health Insights</h2>
            <div className="insights-card">
              <div className="insights-content">
                {insights.split('\n').map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
              <button 
                className="btn-secondary"
                onClick={loadWearableData}
              >
                🔄 Refresh Insights
              </button>
            </div>
          </div>
        )}

        {/* Connect Device Modal */}
        {showConnectModal && (
          <div className="modal-overlay" onClick={() => setShowConnectModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2>Connect Wearable Device</h2>
              <form onSubmit={handleConnectDevice}>
                <div className="form-group">
                  <label>Device Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Apple Watch, Fitbit Charge 5"
                    value={newDevice.device_name}
                    onChange={e => setNewDevice({...newDevice, device_name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Device Type</label>
                  <select
                    value={newDevice.device_type}
                    onChange={e => setNewDevice({...newDevice, device_type: e.target.value})}
                  >
                    <option value="smartwatch">Smartwatch</option>
                    <option value="fitness_band">Fitness Band</option>
                    <option value="smart_scale">Smart Scale</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="submit" className="btn-primary">
                    Connect Device
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setShowConnectModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
              <div className="modal-note">
                <p><strong>Note:</strong> This is a demo environment. In production, this would connect to real wearable device APIs (Apple Health, Google Fit, Fitbit, etc.)</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Wearables;
