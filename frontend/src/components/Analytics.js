import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Analytics = ({ username, onLogout }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [insights, setInsights] = useState('');
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  useEffect(() => {
    fetchDashboardData();
    fetchTrends();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/analytics/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async () => {
    setInsightsLoading(true);
    try {
      const response = await axios.get('/api/analytics/insights');
      setInsights(response.data.insights);
    } catch (error) {
      console.error('Error fetching insights:', error);
      setInsights('Unable to generate insights at this time. Please try again later.');
    } finally {
      setInsightsLoading(false);
    }
  };

  const fetchTrends = async () => {
    try {
      const response = await axios.get(`/api/analytics/trends?period=${selectedPeriod}`);
      setTrends(response.data.trends);
    } catch (error) {
      console.error('Error fetching trends:', error);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num?.toLocaleString() || 0;
  };

  const getHealthScore = () => {
    if (!dashboardData?.summary) return 0;
    
    const { avg_steps, avg_sleep_hours, avg_sleep_efficiency } = dashboardData.summary;
    
    // Simple health score calculation (0-100)
    let score = 0;
    
    // Steps component (0-30 points)
    if (avg_steps >= 10000) score += 30;
    else if (avg_steps >= 8000) score += 25;
    else if (avg_steps >= 5000) score += 20;
    else if (avg_steps >= 3000) score += 15;
    else score += 10;
    
    // Sleep duration component (0-35 points)
    if (avg_sleep_hours >= 7 && avg_sleep_hours <= 9) score += 35;
    else if (avg_sleep_hours >= 6 && avg_sleep_hours <= 10) score += 25;
    else if (avg_sleep_hours >= 5) score += 15;
    else score += 5;
    
    // Sleep efficiency component (0-35 points)
    if (avg_sleep_efficiency >= 85) score += 35;
    else if (avg_sleep_efficiency >= 75) score += 25;
    else if (avg_sleep_efficiency >= 65) score += 15;
    else score += 5;
    
    return Math.round(score);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#f44336';
  };

  const SimpleChart = ({ data, label, color = '#2196F3' }) => {
    if (!data || data.length === 0) return <div>No data available</div>;
    
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;
    
    return (
      <div className="simple-chart">
        <h4>{label}</h4>
        <div className="chart-container">
          {data.map((value, index) => {
            const height = ((value - minValue) / range) * 100;
            return (
              <div key={index} className="chart-bar">
                <div 
                  className="bar"
                  style={{ 
                    height: `${height}%`,
                    backgroundColor: color
                  }}
                  title={`${value} (Day ${index + 1})`}
                />
              </div>
            );
          })}
        </div>
        <div className="chart-stats">
          <span>Min: {minValue}</span>
          <span>Max: {maxValue}</span>
          <span>Avg: {Math.round(data.reduce((a, b) => a + b, 0) / data.length)}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading health analytics...</p>
      </div>
    );
  }

  const healthScore = getHealthScore();

  return (
    <div className="analytics-container">
      <nav className="navbar">
        <div className="nav-brand">
          <h1>🏥 Health Chatbot</h1>
        </div>
        <div className="nav-menu">
          <a href="/chat" className="nav-link">💬 Chat</a>
          <a href="/profile" className="nav-link">👤 Profile</a>
          <a href="/documents" className="nav-link">📄 Documents</a>
          <a href="/followups" className="nav-link">⏰ Follow-ups</a>
          <a href="/wearables" className="nav-link">⌚ Wearables</a>
          <a href="/analytics" className="nav-link active">📊 Analytics</a>
          <div className="nav-user">
            <span>👋 {username}</span>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </nav>

      <div className="main-content">
        <div className="page-header">
          <h2>📊 Health Analytics</h2>
          <p>Comprehensive insights from your health data</p>
        </div>

        {/* Period Selector */}
        <div className="period-selector">
          <label>Time Period:</label>
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        {dashboardData ? (
          <div className="analytics-grid">
            {/* Health Score Card */}
            <div className="health-score-card">
              <h3>🎯 Health Score</h3>
              <div className="score-display">
                <div 
                  className="score-circle"
                  style={{ borderColor: getScoreColor(healthScore) }}
                >
                  <span 
                    className="score-number"
                    style={{ color: getScoreColor(healthScore) }}
                  >
                    {healthScore}
                  </span>
                  <span className="score-label">/ 100</span>
                </div>
              </div>
              <p className="score-description">
                {healthScore >= 80 ? 'Excellent! Keep up the great work!' :
                 healthScore >= 60 ? 'Good progress! Room for improvement.' :
                 'Let\'s work on improving your health habits!'}
              </p>
            </div>

            {/* Summary Stats */}
            <div className="summary-stats">
              <h3>📈 Summary Statistics</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-icon">👟</span>
                  <div className="stat-info">
                    <span className="stat-value">{formatNumber(dashboardData.summary.avg_steps)}</span>
                    <span className="stat-label">Avg Daily Steps</span>
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">🔥</span>
                  <div className="stat-info">
                    <span className="stat-value">{formatNumber(dashboardData.summary.avg_calories)}</span>
                    <span className="stat-label">Avg Daily Calories</span>
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">🏃</span>
                  <div className="stat-info">
                    <span className="stat-value">{dashboardData.summary.total_distance_km}</span>
                    <span className="stat-label">Total Distance (km)</span>
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">😴</span>
                  <div className="stat-info">
                    <span className="stat-value">{dashboardData.summary.avg_sleep_hours}h</span>
                    <span className="stat-label">Avg Sleep Duration</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Trends */}
            {trends?.activity && (
              <div className="trends-section">
                <h3>📊 Activity Trends</h3>
                <div className="charts-grid">
                  <SimpleChart 
                    data={trends.activity.steps} 
                    label="Daily Steps" 
                    color="#4CAF50"
                  />
                  <SimpleChart 
                    data={trends.activity.calories} 
                    label="Daily Calories" 
                    color="#FF9800"
                  />
                </div>
              </div>
            )}

            {/* Sleep Trends */}
            {trends?.sleep && (
              <div className="trends-section">
                <h3>😴 Sleep Trends</h3>
                <div className="charts-grid">
                  <SimpleChart 
                    data={trends.sleep.sleep_hours} 
                    label="Sleep Duration (hours)" 
                    color="#9C27B0"
                  />
                  <SimpleChart 
                    data={trends.sleep.efficiency} 
                    label="Sleep Efficiency (%)" 
                    color="#3F51B5"
                  />
                </div>
              </div>
            )}

            {/* AI Insights */}
            <div className="insights-section">
              <div className="insights-header">
                <h3>🤖 AI Health Insights</h3>
                <button 
                  onClick={fetchInsights}
                  disabled={insightsLoading}
                  className="insights-btn"
                >
                  {insightsLoading ? '🔄 Generating...' : '✨ Generate Insights'}
                </button>
              </div>
              {insights && (
                <div className="insights-content">
                  <pre>{insights}</pre>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="no-data">
            <h3>📊 No Health Data Available</h3>
            <p>Connect a wearable device or add manual health data to see your analytics.</p>
            <div className="action-buttons">
              <a href="/wearables" className="action-btn">⌚ Connect Wearable</a>
              <a href="/wearables" className="action-btn">📝 Add Manual Data</a>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .analytics-container {
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
          margin-bottom: 2rem;
          color: white;
        }

        .page-header h2 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .period-selector {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 15px;
          padding: 1rem;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .period-selector label {
          color: white;
          font-weight: bold;
        }

        .period-selector select {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          padding: 0.5rem;
          font-size: 1rem;
        }

        .analytics-grid {
          display: grid;
          gap: 2rem;
        }

        .health-score-card, .summary-stats, .trends-section, .insights-section {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .health-score-card h3, .summary-stats h3, .trends-section h3, .insights-section h3 {
          color: white;
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
        }

        .score-display {
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .score-circle {
          width: 120px;
          height: 120px;
          border: 8px solid;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
        }

        .score-number {
          font-size: 2rem;
          font-weight: bold;
        }

        .score-label {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
        }

        .score-description {
          color: rgba(255, 255, 255, 0.9);
          text-align: center;
          margin: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .stat-icon {
          font-size: 2rem;
        }

        .stat-info {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          color: white;
          font-size: 1.5rem;
          font-weight: bold;
        }

        .stat-label {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .simple-chart {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .simple-chart h4 {
          color: white;
          margin-bottom: 1rem;
          text-align: center;
        }

        .chart-container {
          display: flex;
          align-items: end;
          height: 150px;
          gap: 2px;
          margin-bottom: 1rem;
        }

        .chart-bar {
          flex: 1;
          height: 100%;
          display: flex;
          align-items: end;
        }

        .bar {
          width: 100%;
          min-height: 5px;
          border-radius: 2px 2px 0 0;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .bar:hover {
          opacity: 0.8;
        }

        .chart-stats {
          display: flex;
          justify-content: space-between;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.8rem;
        }

        .insights-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .insights-btn {
          background: #2196F3;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s ease;
        }

        .insights-btn:hover:not(:disabled) {
          background: #1976D2;
        }

        .insights-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .insights-content {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .insights-content pre {
          color: white;
          white-space: pre-wrap;
          word-wrap: break-word;
          margin: 0;
          font-family: inherit;
          line-height: 1.6;
        }

        .no-data {
          text-align: center;
          color: white;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 3rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .no-data h3 {
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        .no-data p {
          font-size: 1.1rem;
          margin-bottom: 2rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .action-btn {
          background: #2196F3;
          color: white;
          text-decoration: none;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-weight: bold;
          transition: all 0.3s ease;
        }

        .action-btn:hover {
          background: #1976D2;
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

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .charts-grid {
            grid-template-columns: 1fr;
          }

          .insights-header {
            flex-direction: column;
            gap: 1rem;
          }

          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default Analytics;