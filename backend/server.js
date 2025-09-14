const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sql = require('mssql');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ✅ Database config
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

// ✅ Create a single connection pool
const poolPromise = sql.connect(dbConfig)
  .then(pool => {
    console.log('Connected to Azure SQL Database');
    return pool;
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });

/* ------------------ ROUTES ------------------ */

// All questions
app.get('/api/questions', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT id, topic, skillArea, question, options, correctAnswer, explanation
        FROM dbo.QUESTIONS
      `);

    const rows = result.recordset.map(row => ({
      ...row,
      options: JSON.parse(row.options) // convert NVARCHAR JSON → JS array
    }));

    res.json(rows);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Random question
app.get('/api/questions/random', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT TOP 1 id, topic, skillArea, question, options, correctAnswer, explanation
        FROM dbo.QUESTIONS
        ORDER BY NEWID()
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'No questions found' });
    }

    const randomQuestion = result.recordset[0];
    randomQuestion.options = JSON.parse(randomQuestion.options);
    res.json(randomQuestion);
  } catch (error) {
    console.error('Error fetching random question:', error);
    res.status(500).json({ error: 'Failed to fetch random question' });
  }
});

// Topic filter
app.get('/api/questions/topic/:topic', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('topic', sql.NVarChar, req.params.topic)
      .query(`
        SELECT id, topic, skillArea, question, options, correctAnswer, explanation
        FROM dbo.QUESTIONS
        WHERE LOWER(topic) = LOWER(@topic)
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: `No questions found for topic: ${req.params.topic}` });
    }

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

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT COUNT(*) AS count FROM dbo.QUESTIONS');

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

// Root
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
  console.log(`AZ-204 Quiz API running on port ${PORT}`);
});
