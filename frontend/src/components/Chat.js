import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Chat({ username, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const response = await axios.get('/api/chat/history');
      const history = response.data.history.reverse();
      
      const formattedMessages = history.flatMap(item => [
        {
          type: 'user',
          content: item.message,
          timestamp: item.timestamp
        },
        {
          type: 'ai',
          content: item.response,
          timestamp: item.timestamp
        }
      ]);
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await axios.post('/api/chat', {
        message: inputMessage
      });

      const aiMessage = {
        type: 'ai',
        content: response.data.response,
        timestamp: response.data.timestamp
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        type: 'ai',
        content: 'Sorry, I encountered an error. Please make sure the backend is running and configured with a valid Google API key.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-container">
      <div className="header">
        <h1>🏥 MedLM Health Assistant</h1>
        <div className="header-actions">
          <span>Welcome, {username}!</span>
          <button className="btn btn-secondary" onClick={() => navigate('/wearables')}>
            Wearables
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/documents')}>
            Documents
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/followups')}>
            Follow-ups
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/profile')}>
            Profile
          </button>
          <button className="btn btn-secondary" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <h2>Start a conversation</h2>
              <p>Ask me anything about your health and wellness!</p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div key={index} className={`message message-${message.type}`}>
                  <div className="message-content">
                    {message.content}
                    <div className="message-timestamp">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="chat-input-container">
          <form className="chat-input-form" onSubmit={handleSubmit}>
            <input
              type="text"
              className="chat-input"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me about your health..."
              disabled={loading}
            />
            <button type="submit" className="send-button" disabled={loading}>
              {loading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Chat;
