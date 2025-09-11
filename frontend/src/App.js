import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QuestionCard from './components/QuestionCard';

const API_BASE_URL = 'https://az204-quiz-api-gwg4byf3a6d6gdcp.australiasoutheast-01.azurewebsites.net' || 'http://localhost:3001';

function App() {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    correct: 0,
    total: 0
  });

  const fetchRandomQuestion = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/questions/random`);
      setCurrentQuestion(response.data);
    } catch (err) {
      console.error('Error fetching question:', err);
      setError('Failed to load question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = (isCorrect, selectedAnswer) => {
    setStats(prevStats => ({
      correct: prevStats.correct + (isCorrect ? 1 : 0),
      total: prevStats.total + 1
    }));
  };

  const handleNextQuestion = () => {
    fetchRandomQuestion();
  };

  useEffect(() => {
    fetchRandomQuestion();
  }, []);

  const appStyle = {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px 0'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '30px',
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '12px',
    margin: '0 20px 30px 20px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    maxWidth: '800px',
    marginLeft: 'auto',
    marginRight: 'auto'
  };

  const titleStyle = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '8px'
  };

  const subtitleStyle = {
    fontSize: '18px',
    color: '#6b7280',
    marginBottom: '20px'
  };

  const statsStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '30px',
    marginTop: '16px'
  };

  const statItemStyle = {
    textAlign: 'center'
  };

  const statNumberStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#3b82f6',
    display: 'block'
  };

  const statLabelStyle = {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500'
  };

  const errorStyle = {
    backgroundColor: '#fecaca',
    color: '#991b1b',
    padding: '16px',
    borderRadius: '8px',
    margin: '20px',
    textAlign: 'center',
    border: '1px solid #f87171'
  };

  const loadingStyle = {
    textAlign: 'center',
    fontSize: '18px',
    color: '#6b7280',
    padding: '40px'
  };

  const buttonStyle = {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'background-color 0.2s ease',
    marginTop: '16px'
  };

  const accuracyPercentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  return (
    <div style={appStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>AZ-204 Practice Quiz</h1>
        <p style={subtitleStyle}>
          Azure Developer Associate Certification Practice
        </p>
        
        {stats.total > 0 && (
          <div style={statsStyle}>
            <div style={statItemStyle}>
              <span style={statNumberStyle}>{stats.correct}</span>
              <span style={statLabelStyle}>Correct</span>
            </div>
            <div style={statItemStyle}>
              <span style={statNumberStyle}>{stats.total}</span>
              <span style={statLabelStyle}>Total</span>
            </div>
            <div style={statItemStyle}>
              <span style={statNumberStyle}>{accuracyPercentage}%</span>
              <span style={statLabelStyle}>Accuracy</span>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div style={loadingStyle}>
          Loading question...
        </div>
      )}

      {error && (
        <div style={errorStyle}>
          {error}
          <br />
          <button onClick={fetchRandomQuestion} style={buttonStyle}>
            Try Again
          </button>
        </div>
      )}

      {currentQuestion && !loading && (
        <QuestionCard 
          question={currentQuestion}
          onAnswerSubmit={handleAnswerSubmit}
        />
      )}

      {currentQuestion && !loading && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button onClick={handleNextQuestion} style={buttonStyle}>
            Get New Question
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
