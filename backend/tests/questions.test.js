const fs = require('fs');
const path = require('path');

describe('Questions Data Validation', () => {
  let questions;

  beforeAll(() => {
    const questionsData = fs.readFileSync(path.join(__dirname, '../questions.json'), 'utf8');
    questions = JSON.parse(questionsData);
  });

  describe('Question Structure', () => {
    it('should load questions from JSON file', () => {
      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThan(0);
    });

    it('should have all required properties for each question', () => {
      const requiredProperties = ['id', 'topic', 'skillArea', 'question', 'options', 'answer', 'explanation'];
      
      questions.forEach((question, index) => {
        requiredProperties.forEach(prop => {
          expect(question).toHaveProperty(prop);
        });
      });
    });

    it('should have valid data types for each property', () => {
      questions.forEach((question, index) => {
        expect(typeof question.id).toBe('number', `Question ${index + 1}: id should be number`);
        expect(typeof question.topic).toBe('string', `Question ${index + 1}: topic should be string`);
        expect(typeof question.skillArea).toBe('string', `Question ${index + 1}: skillArea should be string`);
        expect(typeof question.question).toBe('string', `Question ${index + 1}: question should be string`);
        expect(Array.isArray(question.options)).toBe(true, `Question ${index + 1}: options should be array`);
        expect(typeof question.answer).toBe('string', `Question ${index + 1}: answer should be string`);
        expect(typeof question.explanation).toBe('string', `Question ${index + 1}: explanation should be string`);
      });
    });

    it('should have exactly 4 options for each question', () => {
      questions.forEach((question, index) => {
        expect(question.options).toHaveLength(4, `Question ${index + 1} should have exactly 4 options`);
      });
    });

    it('should have answer that exists in options', () => {
      questions.forEach((question, index) => {
        expect(question.options).toContain(question.answer, 
          `Question ${index + 1}: answer "${question.answer}" should be in options: ${question.options.join(', ')}`);
      });
    });

    it('should have unique question IDs', () => {
      const ids = questions.map(q => q.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length, 'All question IDs should be unique');
    });

    it('should have non-empty strings for text fields', () => {
      questions.forEach((question, index) => {
        expect(question.topic.trim()).not.toBe('', `Question ${index + 1}: topic should not be empty`);
        expect(question.skillArea.trim()).not.toBe('', `Question ${index + 1}: skillArea should not be empty`);
        expect(question.question.trim()).not.toBe('', `Question ${index + 1}: question should not be empty`);
        expect(question.answer.trim()).not.toBe('', `Question ${index + 1}: answer should not be empty`);
        expect(question.explanation.trim()).not.toBe('', `Question ${index + 1}: explanation should not be empty`);
      });
    });
  });

  describe('AZ-204 Certification Alignment', () => {
    it('should have questions covering multiple AZ-204 skill areas', () => {
      const skillAreas = [...new Set(questions.map(q => q.skillArea))];
      expect(skillAreas.length).toBeGreaterThan(2, 'Should cover multiple skill areas');
    });

    it('should only include valid AZ-204 skill areas', () => {
      const validSkillAreas = [
        'Develop Azure compute solutions',
        'Develop for Azure storage', 
        'Implement Azure security',
        'Connect to and consume Azure services',
        'Monitor, troubleshoot, and optimize Azure solutions'
      ];

      questions.forEach((question, index) => {
        expect(validSkillAreas).toContain(question.skillArea, 
          `Question ${index + 1}: "${question.skillArea}" is not a valid AZ-204 skill area`);
      });
    });

    it('should include App Service questions (Phase 1 focus)', () => {
      const appServiceQuestions = questions.filter(q => q.topic === 'App Service');
      expect(appServiceQuestions.length).toBeGreaterThan(0, 'Should have App Service questions for Phase 1');
    });

    it('should cover multiple Azure service topics', () => {
      const topics = [...new Set(questions.map(q => q.topic))];
      expect(topics.length).toBeGreaterThan(1, 'Should cover multiple Azure service topics');
    });

    it('should have questions with sufficient detail in explanations', () => {
      questions.forEach((question, index) => {
        expect(question.explanation.length).toBeGreaterThan(20, 
          `Question ${index + 1}: explanation should be detailed (>20 characters)`);
      });
    });
  });

  describe('Question Quality', () => {
    it('should have meaningful question text', () => {
      questions.forEach((question, index) => {
        expect(question.question.length).toBeGreaterThan(20, 
          `Question ${index + 1}: question should be detailed (>20 characters)`);
        expect(question.question).toMatch(/\?$/, 
          `Question ${index + 1}: question should end with question mark`);
      });
    });

    it('should have all options as non-empty strings', () => {
      questions.forEach((question, index) => {
        question.options.forEach((option, optionIndex) => {
          expect(typeof option).toBe('string', 
            `Question ${index + 1}, option ${optionIndex + 1} should be string`);
          expect(option.trim()).not.toBe('', 
            `Question ${index + 1}, option ${optionIndex + 1} should not be empty`);
        });
      });
    });

    it('should have unique options for each question', () => {
      questions.forEach((question, index) => {
        const uniqueOptions = new Set(question.options);
        expect(uniqueOptions.size).toBe(4, 
          `Question ${index + 1} should have 4 unique options`);
      });
    });

    it('should have realistic distractors (wrong answers)', () => {
      questions.forEach((question, index) => {
        const wrongAnswers = question.options.filter(opt => opt !== question.answer);
        expect(wrongAnswers.length).toBe(3, 
          `Question ${index + 1} should have exactly 3 wrong answers`);
        
        wrongAnswers.forEach(wrongAnswer => {
          expect(wrongAnswer.trim()).not.toBe('', 
            `Question ${index + 1}: all wrong answers should be meaningful`);
        });
      });
    });
  });

  describe('Data Consistency', () => {
    it('should have consistent topic naming', () => {
      const topics = questions.map(q => q.topic);
      topics.forEach(topic => {
        expect(topic).not.toMatch(/^\s|\s$/, 'Topics should not have leading/trailing spaces');
        expect(topic).toMatch(/^[A-Z]/, 'Topics should start with capital letter');
      });
    });

    it('should have consistent skill area formatting', () => {
      const skillAreas = questions.map(q => q.skillArea);
      skillAreas.forEach(skillArea => {
        expect(skillArea).not.toMatch(/^\s|\s$/, 'Skill areas should not have leading/trailing spaces');
        expect(skillArea).toMatch(/^[A-Z]/, 'Skill areas should start with capital letter');
      });
    });

    it('should have sequential or logical ID ordering', () => {
      const ids = questions.map(q => q.id);
      const sortedIds = [...ids].sort((a, b) => a - b);
      expect(ids).toEqual(sortedIds, 'Question IDs should be in ascending order');
    });
  });

  describe('Minimum Content Requirements', () => {
    it('should have at least 10 questions for meaningful practice', () => {
      expect(questions.length).toBeGreaterThanOrEqual(10, 
        'Should have at least 10 questions for meaningful practice');
    });

    it('should have App Service questions as primary focus', () => {
      const appServiceQuestions = questions.filter(q => q.topic === 'App Service');
      expect(appServiceQuestions.length).toBeGreaterThanOrEqual(4, 
        'Should have at least 4 App Service questions for Phase 1 focus');
    });

    it('should include compute-focused questions', () => {
      const computeQuestions = questions.filter(q => 
        q.skillArea === 'Develop Azure compute solutions'
      );
      expect(computeQuestions.length).toBeGreaterThanOrEqual(6, 
        'Should have substantial compute solutions coverage');
    });
  });
});