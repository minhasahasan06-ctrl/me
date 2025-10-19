import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import Profile from './components/Profile';
import Documents from './components/Documents';
import Followups from './components/Followups';
import Wearables from './components/Wearables';
import Analytics from './components/Analytics';
import WearableCallback from './components/WearableCallback';

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:5000';
axios.defaults.withCredentials = true;

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('/api/auth/status');
      setAuthenticated(response.data.authenticated);
      setUsername(response.data.username || '');
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (username) => {
    setAuthenticated(true);
    setUsername(username);
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      setAuthenticated(false);
      setUsername('');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={
              !authenticated ? 
                <Login onLogin={handleLogin} /> : 
                <Navigate to="/chat" />
            } 
          />
          <Route 
            path="/register" 
            element={
              !authenticated ? 
                <Register onRegister={handleLogin} /> : 
                <Navigate to="/chat" />
            } 
          />
          <Route 
            path="/chat" 
            element={
              authenticated ? 
                <Chat username={username} onLogout={handleLogout} /> : 
                <Navigate to="/login" />
            } 
          />
          <Route 
            path="/profile" 
            element={
              authenticated ? 
                <Profile username={username} onLogout={handleLogout} /> : 
                <Navigate to="/login" />
            } 
          />
          <Route 
            path="/documents" 
            element={
              authenticated ? 
                <Documents username={username} onLogout={handleLogout} /> : 
                <Navigate to="/login" />
            } 
          />
          <Route 
            path="/followups" 
            element={
              authenticated ? 
                <Followups username={username} onLogout={handleLogout} /> : 
                <Navigate to="/login" />
            } 
          />
          <Route 
            path="/wearables" 
            element={
              authenticated ? 
                <Wearables username={username} onLogout={handleLogout} /> : 
                <Navigate to="/login" />
            } 
          />
          <Route 
            path="/analytics" 
            element={
              authenticated ? 
                <Analytics username={username} onLogout={handleLogout} /> : 
                <Navigate to="/login" />
            } 
          />
          <Route 
            path="/wearables/callback" 
            element={
              authenticated ? 
                <WearableCallback /> : 
                <Navigate to="/login" />
            } 
          />
          <Route 
            path="/" 
            element={<Navigate to={authenticated ? "/chat" : "/login"} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
