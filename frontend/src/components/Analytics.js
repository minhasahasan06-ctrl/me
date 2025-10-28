import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Analytics = ({ username, onLogout }) => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('7');
  const [selectedMetric, setSelectedMetric] = useState('all');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, selectedMetric]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsRes, metricsRes, goalsRes] = await Promise.all([
        axios.get(`/api/wearables/analytics?days=${timeRange}`),
        axios.get(`/api/wearables/metrics?days=${timeRange}${selectedMetric !== 'all' ? `&type=${selectedMetric}` : ''}`),
        axios.get('/api/wearables/goals')
      ]);
      
      setAnalytics(analyticsRes.data.analytics);
      setMetrics(metricsRes.data.metrics);
      setGoals(goalsRes.data.goals);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricIcon = (metricType) => {
    const icons = {
      steps: '👟',
      heart_rate: '❤️',
      heart_rate_avg: '❤️',
      calories: '🔥',
      calories_burned: '🔥',
      sleep: '😴',
      sleep_duration: '😴',
      active_minutes: '🏃',
      weight: '⚖️',
      blood_pressure: '🩸'
    };
    return icons[metricType] || '📊';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const getGoalProgress = (goal) => {
    if (goal.current_value === null) return 0;
    return Math.min((goal.current_value / goal.target_value) * 100, 100);
  };

  const getMetricTrend = (metricType) => {
    const metricData = metrics.filter(m => m.metric_type === metricType);
    if (metricData.length < 2) return 'stable';
    
    const recent = metricData.slice(0, 3).reduce((sum, m) => sum + m.value, 0) / 3;
    const older = metricData.slice(-3).reduce((sum, m) => sum + m.value, 0) / 3;
    
    const change = ((recent - older) / older) * 100;
    
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return '#4caf50';
      case 'down': return '#f44336';
      default: return '#ff9800';
    }
  };

  const groupMetricsByDate = (metrics) => {
    const grouped = {};
    metrics.forEach(metric => {
      const date = metric.recorded_at.split('T')[0];
      if (!grouped[date]) {
        grouped[date] = {};
      }
      if (!grouped[date][metric.metric_type]) {
        grouped[date][metric.metric_type] = [];
      }
      grouped[date][metric.metric_type].push(metric);
    });
    return grouped;
  };

  const getDailySummary = (date, metrics) => {
    const summary = {};
    Object.keys(metrics).forEach(metricType => {
      const values = metrics[metricType].map(m => m.value);
      summary[metricType] = {
        avg: values.reduce((sum, val) => sum + val, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      };
    });
    return summary;
  };

  const groupedMetrics = groupMetricsByDate(metrics);
  const sortedDates = Object.keys(groupedMetrics).sort().reverse();

  return (
    <div className="analytics-container">
      <div className="header">
        <h1>📊 Health Analytics Dashboard</h1>
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
          <button className="btn btn-secondary" onClick={() => navigate('/wearables')}>
            Wearables
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/profile')}>
            Profile
          </button>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="controls">
        <div className="control-group">
          <label>Time Range:</label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>
        <div className="control-group">
          <label>Metric Type:</label>
          <select value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value)}>
            <option value="all">All Metrics</option>
            <option value="steps">Steps</option>
            <option value="heart_rate_avg">Heart Rate</option>
            <option value="calories_burned">Calories</option>
            <option value="sleep_duration">Sleep</option>
            <option value="active_minutes">Active Minutes</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Summary Cards */}
          <div className="summary-grid">
            {analytics.map(analytic => {
              const trend = getMetricTrend(analytic.metric_type);
              return (
                <div key={analytic.metric_type} className="summary-card">
                  <div className="summary-header">
                    <span className="summary-icon">{getMetricIcon(analytic.metric_type)}</span>
                    <h3>{analytic.metric_type.replace('_', ' ').toUpperCase()}</h3>
                    <span 
                      className="trend-icon"
                      style={{ color: getTrendColor(trend) }}
                    >
                      {getTrendIcon(trend)}
                    </span>
                  </div>
                  <div className="summary-stats">
                    <div className="stat-row">
                      <span className="stat-label">Average</span>
                      <span className="stat-value">{analytic.average} {analytic.unit}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Range</span>
                      <span className="stat-value">{analytic.minimum} - {analytic.maximum}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Readings</span>
                      <span className="stat-value">{analytic.count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Goals Progress */}
          {goals.length > 0 && (
            <div className="goals-section">
              <h2>Health Goals Progress</h2>
              <div className="goals-grid">
                {goals.map(goal => (
                  <div key={goal.id} className="goal-card">
                    <div className="goal-header">
                      <span className="goal-icon">{getMetricIcon(goal.goal_type)}</span>
                      <h3>{goal.goal_type.replace('_', ' ').toUpperCase()}</h3>
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

          {/* Daily Timeline */}
          <div className="timeline-section">
            <h2>Daily Health Timeline</h2>
            <div className="timeline">
              {sortedDates.slice(0, 7).map(date => {
                const dailySummary = getDailySummary(date, groupedMetrics[date]);
                return (
                  <div key={date} className="timeline-day">
                    <div className="timeline-date">
                      <h4>{formatDate(date)}</h4>
                    </div>
                    <div className="timeline-metrics">
                      {Object.keys(dailySummary).map(metricType => {
                        const summary = dailySummary[metricType];
                        return (
                          <div key={metricType} className="timeline-metric">
                            <div className="metric-header">
                              <span className="metric-icon">{getMetricIcon(metricType)}</span>
                              <span className="metric-name">{metricType.replace('_', ' ').toUpperCase()}</span>
                            </div>
                            <div className="metric-values">
                              <span className="metric-avg">{summary.avg.toFixed(1)} {metrics.find(m => m.metric_type === metricType)?.unit || ''}</span>
                              <span className="metric-range">({summary.min}-{summary.max})</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Metrics */}
          <div className="recent-metrics-section">
            <h2>Recent Metrics</h2>
            <div className="metrics-list">
              {metrics.slice(0, 20).map(metric => (
                <div key={metric.id} className="metric-item">
                  <div className="metric-icon">{getMetricIcon(metric.metric_type)}</div>
                  <div className="metric-info">
                    <div className="metric-type">{metric.metric_type.replace('_', ' ').toUpperCase()}</div>
                    <div className="metric-value">{metric.value} {metric.unit}</div>
                    <div className="metric-meta">
                      {metric.device_name && <span className="device">{metric.device_name}</span>}
                      <span className="time">{formatTime(metric.recorded_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;