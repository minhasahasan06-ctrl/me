import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const WearableCallback = () => {
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing connection...');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage(`Connection failed: ${error}`);
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setMessage('Invalid callback parameters');
      return;
    }

    try {
      // Handle Fitbit callback (can be extended for other providers)
      const response = await axios.post('/api/wearables/callback/fitbit', {
        code,
        state
      });

      setStatus('success');
      setMessage('Device connected successfully!');
      
      // Redirect to wearables page after 2 seconds
      setTimeout(() => {
        navigate('/wearables');
      }, 2000);

    } catch (error) {
      console.error('Callback error:', error);
      setStatus('error');
      setMessage(error.response?.data?.error || 'Failed to connect device');
    }
  };

  return (
    <div className="callback-container">
      <div className="callback-card">
        {status === 'processing' && (
          <>
            <div className="spinner"></div>
            <h2>Connecting Device...</h2>
            <p>{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="success-icon">✅</div>
            <h2>Connection Successful!</h2>
            <p>{message}</p>
            <p>Redirecting to wearables page...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="error-icon">❌</div>
            <h2>Connection Failed</h2>
            <p>{message}</p>
            <button 
              onClick={() => navigate('/wearables')}
              className="retry-btn"
            >
              Back to Wearables
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        .callback-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .callback-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 3rem;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.2);
          max-width: 400px;
          width: 100%;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 2rem;
        }

        .success-icon, .error-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .callback-card h2 {
          color: white;
          margin-bottom: 1rem;
          font-size: 1.8rem;
        }

        .callback-card p {
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 1rem;
          line-height: 1.6;
        }

        .retry-btn {
          background: #2196F3;
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: bold;
          transition: all 0.3s ease;
          margin-top: 1rem;
        }

        .retry-btn:hover {
          background: #1976D2;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default WearableCallback;