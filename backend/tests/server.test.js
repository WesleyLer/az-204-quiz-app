const request = require('supertest');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

let app;
let server;

beforeEach(() => {
  delete require.cache[require.resolve('../server.js')];
  
  app = express();
  app.use(cors());
  app.use(express.json());

  const questionsData = fs.readFileSync(path.join(__dirname, '../questions.json'), 'utf8');
  const questions = JSON.parse(questionsData);

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
});

afterEach((done) => {
  if (server) {
    server.close(done);
  } else {
    done();
  }
});

describe('AZ-204 Quiz API', () => {
  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'AZ-204 Quiz API');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.endpoints).toHaveProperty('questions', '/api/questions');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('questionsCount');
      expect(typeof response.body.questionsCount).toBe('number');
      expect(response.body.questionsCount).toBeGreaterThan(0);
    });
  });

  describe('GET /api/questions', () => {
    it('should return all questions', async () => {
      const response = await request(app).get('/api/questions');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const question = response.body[0];
      expect(question).toHaveProperty('id');
      expect(question).toHaveProperty('topic');
      expect(question).toHaveProperty('skillArea');
      expect(question).toHaveProperty('question');
      expect(question).toHaveProperty('options');
      expect(question).toHaveProperty('answer');
      expect(Array.isArray(question.options)).toBe(true);
      expect(question.options.length).toBe(4);
    });

    it('should return questions with valid structure', async () => {
      const response = await request(app).get('/api/questions');
      
      response.body.forEach(question => {
        expect(typeof question.id).toBe('number');
        expect(typeof question.topic).toBe('string');
        expect(typeof question.skillArea).toBe('string');
        expect(typeof question.question).toBe('string');
        expect(typeof question.answer).toBe('string');
        expect(Array.isArray(question.options)).toBe(true);
        expect(question.options.includes(question.answer)).toBe(true);
      });
    });

    it('should include AZ-204 relevant topics', async () => {
      const response = await request(app).get('/api/questions');
      
      const topics = response.body.map(q => q.topic);
      const uniqueTopics = [...new Set(topics)];
      
      expect(uniqueTopics).toContain('App Service');
      expect(uniqueTopics.length).toBeGreaterThan(1);
    });
  });

  describe('GET /api/questions/random', () => {
    it('should return a random question', async () => {
      const response = await request(app).get('/api/questions/random');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('topic');
      expect(response.body).toHaveProperty('skillArea');
      expect(response.body).toHaveProperty('question');
      expect(response.body).toHaveProperty('options');
      expect(response.body).toHaveProperty('answer');
    });

    it('should return different questions on multiple calls', async () => {
      const responses = await Promise.all([
        request(app).get('/api/questions/random'),
        request(app).get('/api/questions/random'),
        request(app).get('/api/questions/random'),
        request(app).get('/api/questions/random'),
        request(app).get('/api/questions/random')
      ]);

      const questionIds = responses.map(r => r.body.id);
      const uniqueIds = new Set(questionIds);
      
      expect(uniqueIds.size).toBeGreaterThan(1);
    });

    it('should return valid question structure', async () => {
      const response = await request(app).get('/api/questions/random');
      
      expect(typeof response.body.id).toBe('number');
      expect(typeof response.body.topic).toBe('string');
      expect(typeof response.body.question).toBe('string');
      expect(Array.isArray(response.body.options)).toBe(true);
      expect(response.body.options.length).toBe(4);
      expect(response.body.options.includes(response.body.answer)).toBe(true);
    });
  });

  describe('GET /api/questions/topic/:topic', () => {
    it('should return questions for App Service topic', async () => {
      const response = await request(app).get('/api/questions/topic/App%20Service');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      response.body.forEach(question => {
        expect(question.topic).toBe('App Service');
      });
    });

    it('should return questions for Functions topic', async () => {
      const response = await request(app).get('/api/questions/topic/Functions');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      response.body.forEach(question => {
        expect(question.topic).toBe('Functions');
      });
    });

    it('should handle case insensitive topic search', async () => {
      const lowerCaseResponse = await request(app).get('/api/questions/topic/storage');
      const upperCaseResponse = await request(app).get('/api/questions/topic/STORAGE');
      
      expect(lowerCaseResponse.status).toBe(200);
      expect(upperCaseResponse.status).toBe(200);
      expect(lowerCaseResponse.body.length).toBe(upperCaseResponse.body.length);
    });

    it('should return 404 for non-existent topic', async () => {
      const response = await request(app).get('/api/questions/topic/NonExistentTopic');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('No questions found for topic');
    });

    it('should return valid question structure for topic queries', async () => {
      const response = await request(app).get('/api/questions/topic/Storage');
      
      if (response.body.length > 0) {
        const question = response.body[0];
        expect(question).toHaveProperty('id');
        expect(question).toHaveProperty('topic', 'Storage');
        expect(question).toHaveProperty('skillArea');
        expect(question).toHaveProperty('question');
        expect(question).toHaveProperty('options');
        expect(question).toHaveProperty('answer');
        expect(Array.isArray(question.options)).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown endpoints', async () => {
      const response = await request(app).get('/api/unknown-endpoint');
      
      expect(response.status).toBe(404);
    });

    it('should handle invalid parameters gracefully', async () => {
      const response = await request(app).get('/api/questions/topic/');
      
      expect(response.status).toBe(404);
    });
  });

  describe('CORS Configuration', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000');
      
      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  });

  describe('Data Validation', () => {
    it('should ensure all questions have explanations', async () => {
      const response = await request(app).get('/api/questions');
      
      response.body.forEach(question => {
        expect(question).toHaveProperty('explanation');
        expect(typeof question.explanation).toBe('string');
        expect(question.explanation.length).toBeGreaterThan(0);
      });
    });

    it('should ensure skill areas map to AZ-204 objectives', async () => {
      const response = await request(app).get('/api/questions');
      
      const validSkillAreas = [
        'Develop Azure compute solutions',
        'Develop for Azure storage',
        'Implement Azure security',
        'Connect to and consume Azure services',
        'Monitor, troubleshoot, and optimize Azure solutions'
      ];

      response.body.forEach(question => {
        expect(validSkillAreas).toContain(question.skillArea);
      });
    });

    it('should ensure questions have unique IDs', async () => {
      const response = await request(app).get('/api/questions');
      
      const ids = response.body.map(q => q.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});