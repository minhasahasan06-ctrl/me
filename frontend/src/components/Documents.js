import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Documents({ username, onLogout }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [analyzing, setAnalyzing] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const response = await axios.get('/api/files');
      setFiles(response.data.files);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
    setMessage({ type: '', text: '' });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a file' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('description', description);

    try {
      await axios.post('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage({ type: 'success', text: 'File uploaded successfully!' });
      setSelectedFile(null);
      setDescription('');
      document.getElementById('fileInput').value = '';
      loadFiles();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Upload failed. Please try again.' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      await axios.delete(`/api/files/${fileId}`);
      setMessage({ type: 'success', text: 'File deleted successfully' });
      loadFiles();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete file' });
    }
  };

  const handleAnalyze = async (fileId) => {
    setAnalyzing(fileId);
    setAnalysisResult(null);

    try {
      const response = await axios.post(`/api/files/analyze/${fileId}`);
      setAnalysisResult({
        filename: response.data.filename,
        analysis: response.data.analysis
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Analysis failed. Please try again.' 
      });
    } finally {
      setAnalyzing(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="documents-container">
      <div className="header">
        <h1>🏥 MedLM Health Assistant</h1>
        <div className="header-actions">
          <span>Welcome, {username}!</span>
          <button className="btn btn-secondary" onClick={() => navigate('/wearables')}>
            Wearables
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/chat')}>
            Chat
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

      <div className="documents-content">
        <div className="upload-section">
          <h2>📁 Upload Medical Documents</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Upload lab results, prescriptions, medical reports, or any health-related documents.
            Supported formats: PDF, Images (PNG, JPG), Text files, Word documents.
          </p>

          {message.text && (
            <div className={`${message.type}-message`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleUpload} className="upload-form">
            <div className="form-group">
              <label htmlFor="fileInput">Select File</label>
              <input
                type="file"
                id="fileInput"
                onChange={handleFileSelect}
                accept=".pdf,.png,.jpg,.jpeg,.gif,.txt,.doc,.docx"
                className="file-input"
              />
              {selectedFile && (
                <div className="selected-file">
                  📄 {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="description">Description (Optional)</label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Blood test results from Jan 2024"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={uploading || !selectedFile}>
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </form>
        </div>

        <div className="files-list-section">
          <h2>📋 Your Documents</h2>
          
          {files.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📂</div>
              <p>No documents uploaded yet</p>
            </div>
          ) : (
            <div className="files-grid">
              {files.map((file) => (
                <div key={file.id} className="file-card">
                  <div className="file-icon">
                    {file.file_type === 'pdf' && '📄'}
                    {['png', 'jpg', 'jpeg', 'gif'].includes(file.file_type) && '🖼️'}
                    {['txt', 'doc', 'docx'].includes(file.file_type) && '📝'}
                  </div>
                  <div className="file-info">
                    <h3>{file.filename}</h3>
                    {file.description && <p className="file-description">{file.description}</p>}
                    <div className="file-meta">
                      <span>{formatFileSize(file.file_size)}</span>
                      <span>•</span>
                      <span>{formatDate(file.upload_date)}</span>
                    </div>
                  </div>
                  <div className="file-actions">
                    <button
                      className="btn btn-small btn-secondary"
                      onClick={() => handleAnalyze(file.id)}
                      disabled={analyzing === file.id}
                    >
                      {analyzing === file.id ? '⏳ Analyzing...' : '🔍 Analyze with AI'}
                    </button>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => handleDelete(file.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {analysisResult && (
          <div className="analysis-modal" onClick={() => setAnalysisResult(null)}>
            <div className="analysis-content" onClick={(e) => e.stopPropagation()}>
              <div className="analysis-header">
                <h2>🔍 AI Analysis Results</h2>
                <button className="close-btn" onClick={() => setAnalysisResult(null)}>✕</button>
              </div>
              <h3>{analysisResult.filename}</h3>
              <div className="analysis-text">
                {analysisResult.analysis}
              </div>
              <button className="btn btn-primary" onClick={() => setAnalysisResult(null)}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Documents;
