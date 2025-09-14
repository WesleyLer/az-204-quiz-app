const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const sql = require('mssql')
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
}

let poolPromise = sql.Connect(dbConfig)
  .then (pool => {
    console.log('Connected to Azure SQL Database');
    return pool
  })
  .catch (err => {
    console.error('Database connection failed: ', err);
    process.exit(1);
  })
// let questions = [];

// try {
//   const questionsData = fs.readFileSync(path.join(__dirname, 'questions.json'), 'utf8');
//   questions = JSON.parse(questionsData);
//   console.log(`Loaded ${questions.length} questions`);
// } catch (error) {
//   console.error('Error loading questions:', error);
// }

app.get('/api/questions', (req, res) => {
  try {
    res.json(questions);
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT id, topic, skillArea, question, options, correctAnswer, explanation FROM dbo.QUESTIONS');
    const rows = result.recordset.map(row => ({
      ...row,
      options: JSON.parse(row.options) // Parse JSON string to JS array
    }))
    res.json(rows)
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

app.get('/api/questions/random', (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT TOP 1 id, topic, skillArea, question, options, correctAnswer, explanation FROM dbo.QUESTIONS ORDER BY NEWID()')
    if (result.recordset.length === 0 {
      return res.status(404).json({
        error: 'No questions found'
      })
    }

    const randomQuestions = result.recordset[0];
    randomQuestion.options = JSON.parse(randomQuestion.options);
    res.json(randomQuestion);
  } catch (error) {
    console.error('Error fetching random question:', error);
    res.status(500).json({ error: 'Failed to fetch random question' });
  }
});

app.get('/api/questions/topic/:topic', (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('topic', sql.NVarChar, req.params.topic)
      .query(`
        SELECT id, topic, skillArea, question, options, answer, explanation
        FROM dbo.QUESTIONS
        WHERE LOWER(topic) = LOWER(@topic)
      `);

    if (result.recordset.length === 0)
      return res.status(404).json({ error: `No questions found for topic: ${req.params.topic}` });

    const rows = result.recordset.map(row => ({
      ...row,
      options: JSON.parse(row.options)
    }));
    res.json(rows);
  } catch (error) {
    console.error('Error fetching questions by topic:', error);
    res.status(500).json({ error: 'Failed to fetch questions by topic' });
  }
});

app.get('/api/health', (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT COUNT(*) AS count FROM dbo.QUESTIONS');
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      questionsCount: result.recordset[0].count
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
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
