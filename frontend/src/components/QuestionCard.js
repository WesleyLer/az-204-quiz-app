import React, { useState } from 'react';

const QuestionCard = ({ question, onAnswerSubmit }) => {
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    if (!selectedAnswer) return;
    
    const correct = selectedAnswer === question.answer;
    setIsCorrect(correct);
    setIsSubmitted(true);
    
    if (onAnswerSubmit) {
      onAnswerSubmit(correct, selectedAnswer);
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswer('');
    setIsSubmitted(false);
    setIsCorrect(false);
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    margin: '20px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxWidth: '800px',
    marginLeft: 'auto',
    marginRight: 'auto'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '2px solid #e5e7eb'
  };

  const topicBadgeStyle = {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600'
  };

  const skillAreaStyle = {
    color: '#6b7280',
    fontSize: '14px',
    fontStyle: 'italic'
  };

  const questionStyle = {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '20px',
    lineHeight: '1.6',
    color: '#1f2937'
  };

  const optionsStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px'
  };

  const optionStyle = (option) => ({
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: isSubmitted ? 'default' : 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: getOptionBackgroundColor(option),
    borderColor: getOptionBorderColor(option)
  });

  const getOptionBackgroundColor = (option) => {
    if (!isSubmitted) {
      return selectedAnswer === option ? '#dbeafe' : 'white';
    }
    
    if (option === question.answer) {
      return '#dcfce7';
    }
    
    if (option === selectedAnswer && option !== question.answer) {
      return '#fecaca';
    }
    
    return 'white';
  };

  const getOptionBorderColor = (option) => {
    if (!isSubmitted) {
      return selectedAnswer === option ? '#3b82f6' : '#e5e7eb';
    }
    
    if (option === question.answer) {
      return '#16a34a';
    }
    
    if (option === selectedAnswer && option !== question.answer) {
      return '#dc2626';
    }
    
    return '#e5e7eb';
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
    transition: 'background-color 0.2s ease'
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed'
  };

  const resultStyle = {
    marginTop: '20px',
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: isCorrect ? '#dcfce7' : '#fecaca',
    borderLeft: `4px solid ${isCorrect ? '#16a34a' : '#dc2626'}`
  };

  const resultTextStyle = {
    fontWeight: '600',
    color: isCorrect ? '#166534' : '#991b1b',
    marginBottom: '8px'
  };

  const explanationStyle = {
    color: '#374151',
    lineHeight: '1.5'
  };

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <div style={topicBadgeStyle}>{question.topic}</div>
        </div>
        <div style={skillAreaStyle}>{question.skillArea}</div>
      </div>
      
      <div style={questionStyle}>
        {question.question}
      </div>
      
      <div style={optionsStyle}>
        {question.options.map((option, index) => (
          <div
            key={index}
            style={optionStyle(option)}
            onClick={() => !isSubmitted && setSelectedAnswer(option)}
          >
            <label style={{ cursor: isSubmitted ? 'default' : 'pointer' }}>
              <input
                type="radio"
                name="answer"
                value={option}
                checked={selectedAnswer === option}
                onChange={(e) => !isSubmitted && setSelectedAnswer(e.target.value)}
                style={{ marginRight: '12px' }}
                disabled={isSubmitted}
              />
              {option}
            </label>
          </div>
        ))}
      </div>
      
      <div style={{ display: 'flex', gap: '12px' }}>
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={!selectedAnswer}
            style={!selectedAnswer ? disabledButtonStyle : buttonStyle}
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            style={buttonStyle}
          >
            Next Question
          </button>
        )}
      </div>
      
      {isSubmitted && (
        <div style={resultStyle}>
          <div style={resultTextStyle}>
            {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
          </div>
          {question.explanation && (
            <div style={explanationStyle}>
              <strong>Explanation:</strong> {question.explanation}
            </div>
          )}
          {!isCorrect && (
            <div style={explanationStyle}>
              <strong>Correct Answer:</strong> {question.answer}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionCard;