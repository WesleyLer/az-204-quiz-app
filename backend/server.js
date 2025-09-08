const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let questions = [];

try {
  const questionsData = fs.readFileSync(path.join(__dirname, 'questions.json'), 'utf8');
  questions = JSON.parse(questionsData);
  console.log(`Loaded ${questions.length} questions`);
} catch (error) {
  console.error('Error loading questions:', error);
}

app.get('/api/questions', (req, res) => {
  try {
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

app.get('/api/questions/random', (req, res) => {
  try {
    if (questions.length === 0) {
      return res.status(404).json({ error: 'No questions available' });
    }
    
    const randomIndex = Math.floor(Math.random() * questions.length);
    const randomQuestion = questions[randomIndex];
    
    res.json(randomQuestion);
  } catch (error) {
    console.error('Error fetching random question:', error);
    res.status(500).json({ error: 'Failed to fetch random question' });
  }
});

app.get('/api/questions/topic/:topic', (req, res) => {
  try {
    const { topic } = req.params;
    const filteredQuestions = questions.filter(
      q => q.topic.toLowerCase() === topic.toLowerCase()
    );
    
    if (filteredQuestions.length === 0) {
      return res.status(404).json({ error: `No questions found for topic: ${topic}` });
    }
    
    res.json(filteredQuestions);
  } catch (error) {
    console.error('Error fetching questions by topic:', error);
    res.status(500).json({ error: 'Failed to fetch questions by topic' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    questionsCount: questions.length 
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'AZ-204 Quiz API',
    version: '1.0.0',
    endpoints: {
      questions: '/api/questions',
      randomQuestion: '/api/questions/random',
      questionsByTopic: '/api/questions/topic/:topic',
      health: '/api/health'
    }
  });
});

app.listen(PORT, () => {
  console.log(`AZ-204 Quiz API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Questions endpoint: http://localhost:${PORT}/api/questions`);
});