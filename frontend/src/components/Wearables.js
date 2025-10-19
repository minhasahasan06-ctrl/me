import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Wearables({ username, onLogout }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState({ connected: false, provider: null, status: 'disconnected' });
  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [days, setDays] = useState(7);
  const [metric, setMetric] = useState('steps');
  const [recs, setRecs] = useState('');

  const loadAll = async (selectedDays = days, selectedMetric = metric) => {
    setLoading(true);
    setError('');
    try {
      const [st, sm, ts] = await Promise.all([
        axios.get('/api/wearables/status'),
        axios.get('/api/wearables/summary', { params: { days: selectedDays } }),
        axios.get('/api/wearables/timeseries', { params: { metric: selectedMetric, days: selectedDays } }),
      ]);
      setStatus(st.data);
      setSummary(sm.data.summary);
      setSeries(ts.data.series);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load wearable data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/wearables/connect', { provider: 'demo' });
      // Seed with demo data on first connect
      await axios.post('/api/wearables/demo-data', { days: 14 });
      await loadAll();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to connect wearable');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/wearables/disconnect');
      await loadAll();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to disconnect wearable');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadAll();
  };

  const handleChangeDays = async (e) => {
    const newDays = Number(e.target.value);
    setDays(newDays);
    await loadAll(newDays, metric);
  };

  const handleChangeMetric = async (e) => {
    const newMetric = e.target.value;
    setMetric(newMetric);
    await loadAll(days, newMetric);
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/wearables/recommendations', { params: { days } });
      setRecs(res.data.recommendations);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wearables-container">
      <div className="header">
        <h1>🏥 MedLM Health Assistant</h1>
        <div className="header-actions">
          <span>Welcome, {username}!</span>
          <button className="btn btn-secondary" onClick={() => navigate('/chat')}>Chat</button>
          <button className="btn btn-secondary" onClick={() => navigate('/documents')}>Documents</button>
          <button className="btn btn-secondary" onClick={() => navigate('/followups')}>Follow-ups</button>
          <button className="btn btn-secondary" onClick={() => navigate('/profile')}>Profile</button>
          <button className="btn btn-secondary" onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div className="wearables-content">
        {error && <div className="error-message">{error}</div>}

        <div className="status-card">
          <div className="status-row">
            <h2>⌚ Wearable</h2>
            <div>
              {status.connected ? (
                <span className="badge badge-success">Connected ({status.provider})</span>
              ) : (
                <span className="badge badge-muted">Disconnected</span>
              )}
            </div>
          </div>
          <div className="status-actions">
            {!status.connected ? (
              <button className="btn btn-primary" onClick={handleConnect} disabled={loading}>
                {loading ? 'Connecting…' : 'Connect Demo Wearable'}
              </button>
            ) : (
              <button className="btn btn-danger" onClick={handleDisconnect} disabled={loading}>
                Disconnect
              </button>
            )}
            <button className="btn btn-secondary" onClick={handleRefresh} disabled={loading}>
              Refresh
            </button>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-header">
            <h2>📊 Summary</h2>
            <div className="controls">
              <label>
                Range
                <select value={days} onChange={handleChangeDays}>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={28}>28 days</option>
                </select>
              </label>
            </div>
          </div>

          {summary ? (
            <div className="summary-grid">
              <div className="summary-item">
                <div className="label">Steps avg/day</div>
                <div className="value">{summary.steps?.average_per_day ?? '—'}</div>
              </div>
              <div className="summary-item">
                <div className="label">Sleep avg/night (h)</div>
                <div className="value">{summary.sleep?.average_hours_per_night ?? '—'}</div>
              </div>
              <div className="summary-item">
                <div className="label">Resting HR avg</div>
                <div className="value">{summary.heart_rate?.resting_average ?? '—'}</div>
              </div>
              <div className="summary-item">
                <div className="label">SpO2 avg (%)</div>
                <div className="value">{summary.spo2?.average_percent ?? '—'}</div>
              </div>
              <div className="summary-item">
                <div className="label">Active minutes total</div>
                <div className="value">{summary.activity?.active_minutes_total ?? '—'}</div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📈</div>
              <p>No summary yet</p>
            </div>
          )}
        </div>

        <div className="timeseries-card">
          <div className="summary-header">
            <h2>📈 Time Series</h2>
            <div className="controls">
              <label>
                Metric
                <select value={metric} onChange={handleChangeMetric}>
                  <option value="steps">Steps</option>
                  <option value="sleep_hours">Sleep hours</option>
                  <option value="resting_heart_rate">Resting HR</option>
                  <option value="spo2">SpO2</option>
                  <option value="active_minutes">Active minutes</option>
                </select>
              </label>
            </div>
          </div>
          {series && series.length > 0 ? (
            <div className="series-list">
              {series.map((pt) => (
                <div className="series-row" key={pt.date}>
                  <div className="series-date">{pt.date}</div>
                  <div className="series-bar">
                    <div
                      className="series-bar-fill"
                      style={{ width: `${Math.min(100, (pt.value / (metric === 'steps' ? 12000 : metric === 'active_minutes' ? 120 : metric === 'sleep_hours' ? 10 : metric === 'spo2' ? 100 : 120)) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="series-value">{pt.value}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🗓️</div>
              <p>No data for selected range</p>
            </div>
          )}
        </div>

        <div className="coach-card">
          <div className="coach-header">
            <h2>🧠 AI Coach Suggestions</h2>
            <button className="btn btn-primary" onClick={fetchRecommendations} disabled={loading}>
              {loading ? 'Generating…' : 'Generate Suggestions'}
            </button>
          </div>
          {recs ? (
            <pre className="recs-box">{recs}</pre>
          ) : (
            <p style={{ color: '#666' }}>Click to generate personalized suggestions from your data.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Wearables;
