const request = require('supertest');
const sql = require('mssql');
require('dotenv').config();

let app;
let dbQuestions = [];

beforeAll(async () => {
  // Connect once for all tests
  await sql.connect({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,   // e.g. myserver.database.windows.net
    database: process.env.DB_NAME,
    options: { encrypt: true, trustServerCertificate: false }
  });

  ({ app } = require('../server.js'));

  // Pull DB snapshot for reference
  const result = await sql.query`SELECT * FROM dbo.Questions`;
  dbQuestions = result.recordset;
  expect(dbQuestions.length).toBeGreaterThan(0);
});

afterAll(async () => {
  await sql.close();
});

describe('AZ-204 Quiz API (SQL)', () => {

  /* ---------------------- Root & Health ---------------------- */
  describe('GET /', () => {
    it('returns API info and endpoints', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        message: 'AZ-204 Quiz API',
        version: '1.0.0'
      });
      expect(res.body.endpoints).toHaveProperty('questions');
      expect(res.body.endpoints).toHaveProperty('randomQuestion');
      expect(res.body.endpoints).toHaveProperty('questionsByTopic');
      expect(res.body.endpoints).toHaveProperty('health');
    });
  });

  describe('GET /api/health', () => {
    it('reports OK and correct question count', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(typeof res.body.timestamp).toBe('string');
      expect(res.body.questionsCount).toBe(dbQuestions.length);
    });
  });

  /* ---------------------- All Questions ---------------------- */
  describe('GET /api/questions', () => {
    it('returns all DB questions', async () => {
      const res = await request(app).get('/api/questions');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(dbQuestions.length);
    });

    it('ensures valid question structure', async () => {
      const res = await request(app).get('/api/questions');
      res.body.forEach(q => {
        expect(typeof q.id).toBe('number');
        expect(typeof q.topic).toBe('string');
        expect(typeof q.skillArea).toBe('string');
        expect(typeof q.question).toBe('string');
        expect(typeof q.answer).toBe('string');
        expect(typeof q.explanation).toBe('string');
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options.length).toBeGreaterThan(0);
        expect(q.options.includes(q.answer)).toBe(true);
      });
    });

    it('contains multiple AZ-204 topics', async () => {
      const res = await request(app).get('/api/questions');
      const uniqueTopics = [...new Set(res.body.map(q => q.topic))];
      expect(uniqueTopics.length).toBeGreaterThan(1);
    });
  });

  /* ---------------------- Random Question ---------------------- */
  describe('GET /api/questions/random', () => {
    it('returns a single random question', async () => {
      const res = await request(app).get('/api/questions/random');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(Array.isArray(res.body.options)).toBe(true);
    });

    it('returns different questions across calls', async () => {
      const calls = await Promise.all(
        Array.from({ length: 5 }, () => request(app).get('/api/questions/random'))
      );
      const ids = calls.map(r => r.body.id);
      expect(new Set(ids).size).toBeGreaterThan(1);
    });
  });

  /* ---------------------- Topic Filter ---------------------- */
  describe('GET /api/questions/topic/:topic', () => {
    const sampleTopic = dbQuestions[0].topic;

    it('returns questions for a valid topic', async () => {
      const res = await request(app).get(`/api/questions/topic/${encodeURIComponent(sampleTopic)}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach(q => expect(q.topic).toBe(sampleTopic));
    });

    it('is case-insensitive', async () => {
      const lower = await request(app).get(`/api/questions/topic/${sampleTopic.toLowerCase()}`);
      const upper = await request(app).get(`/api/questions/topic/${sampleTopic.toUpperCase()}`);
      expect(lower.status).toBe(200);
      expect(upper.status).toBe(200);
      expect(lower.body.length).toBe(upper.body.length);
    });

    it('returns 404 for missing topic', async () => {
      const res = await request(app).get('/api/questions/topic/NonExistentTopic');
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/No questions/i);
    });
  });

  /* ---------------------- Error & CORS ---------------------- */
  describe('Error Handling', () => {
    it('returns 404 for unknown endpoints', async () => {
      const res = await request(app).get('/api/does-not-exist');
      expect(res.status).toBe(404);
    });

    it('handles invalid parameters gracefully', async () => {
      const res = await request(app).get('/api/questions/topic/');
      expect(res.status).toBe(404);
    });
  });

  describe('CORS', () => {
    it('includes CORS headers', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000');
      expect(res.headers['access-control-allow-origin']).toBe('*');
    });
  });

  /* ---------------------- Data Integrity ---------------------- */
  describe('Database Validation', () => {
    it('all questions have explanations', () => {
      dbQuestions.forEach(q => {
        expect(typeof q.explanation).toBe('string');
        expect(q.explanation.length).toBeGreaterThan(0);
      });
    });

    it('skill areas match AZ-204 objectives', () => {
      const valid = [
        'Develop Azure compute solutions',
        'Develop for Azure storage',
        'Implement Azure security',
        'Connect to and consume Azure services',
        'Monitor, troubleshoot, and optimize Azure solutions'
      ];
      dbQuestions.forEach(q => expect(valid).toContain(q.skillArea));
    });

    it('question IDs are unique', () => {
      const ids = dbQuestions.map(q => q.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
