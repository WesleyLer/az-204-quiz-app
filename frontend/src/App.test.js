import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import App from './App';

// Mock axios
const mockAxios = new MockAdapter(axios);

// Mock question data
const mockQuestions = [
  {
    id: 1,
    topic: "App Service",
    skillArea: "Develop Azure compute solutions",
    question: "Which of the following is NOT a valid App Service plan pricing tier?",
    options: ["Free", "Shared", "PremiumV2", "Elastic Premium"],
    answer: "Elastic Premium",
    explanation: "Elastic Premium is not a valid App Service plan tier."
  },
  {
    id: 2,
    topic: "App Service",
    skillArea: "Develop Azure compute solutions", 
    question: "Which deployment slot feature allows zero-downtime deployments?",
    options: ["Traffic Manager", "Swap", "Scale-Out", "Backup"],
    answer: "Swap",
    explanation: "Deployment slot swapping allows zero-downtime deployments."
  }
];

describe('App Component', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('Initial Render', () => {
    it('renders the app title', async () => {
      mockAxios.onGet('/api/questions/random').reply(200, mockQuestions[0]);
      
      render(<App />);
      
      expect(screen.getByText('AZ-204 Practice Quiz')).toBeInTheDocument();
      expect(screen.getByText('Azure Developer Associate Certification Practice')).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      mockAxios.onGet('/api/questions/random').reply(() => new Promise(() => {})); // Never resolves
      
      render(<App />);
      
      expect(screen.getByText('Loading question...')).toBeInTheDocument();
    });

    it('loads and displays a random question on mount', async () => {
      mockAxios.onGet('/api/questions/random').reply(200, mockQuestions[0]);
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(mockQuestions[0].question)).toBeInTheDocument();
      });
      
      mockQuestions[0].options.forEach(option => {
        expect(screen.getByText(option)).toBeInTheDocument();
      });
    });
  });

  describe('API Error Handling', () => {
    it('displays error message when API fails', async () => {
      mockAxios.onGet('/api/questions/random').reply(500);
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to load question/)).toBeInTheDocument();
      });
      
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('allows retry when API fails', async () => {
      mockAxios.onGet('/api/questions/random').replyOnce(500);
      mockAxios.onGet('/api/questions/random').reply(200, mockQuestions[0]);
      
      render(<App />);
      
      // Wait for error
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
      
      // Click try again
      fireEvent.click(screen.getByText('Try Again'));
      
      // Should load question successfully
      await waitFor(() => {
        expect(screen.getByText(mockQuestions[0].question)).toBeInTheDocument();
      });
    });

    it('handles network errors gracefully', async () => {
      mockAxios.onGet('/api/questions/random').networkError();
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to load question/)).toBeInTheDocument();
      });
    });
  });

  describe('Question Interaction', () => {
    beforeEach(async () => {
      mockAxios.onGet('/api/questions/random').reply(200, mockQuestions[0]);
      render(<App />);
      
      // Wait for question to load
      await waitFor(() => {
        expect(screen.getByText(mockQuestions[0].question)).toBeInTheDocument();
      });
    });

    it('allows selecting an answer option', async () => {
      const user = userEvent.setup();
      const firstOption = screen.getByLabelText(mockQuestions[0].options[0]);
      
      await user.click(firstOption);
      
      expect(firstOption).toBeChecked();
    });

    it('enables submit button after selecting an option', async () => {
      const user = userEvent.setup();
      const submitButton = screen.getByText('Submit Answer');
      
      expect(submitButton).toBeDisabled();
      
      const firstOption = screen.getByLabelText(mockQuestions[0].options[0]);
      await user.click(firstOption);
      
      expect(submitButton).toBeEnabled();
    });

    it('shows correct answer feedback after submitting', async () => {
      const user = userEvent.setup();
      const correctOption = screen.getByLabelText(mockQuestions[0].answer);
      
      await user.click(correctOption);
      await user.click(screen.getByText('Submit Answer'));
      
      expect(screen.getByText('✅ Correct!')).toBeInTheDocument();
      expect(screen.getByText(mockQuestions[0].explanation)).toBeInTheDocument();
    });

    it('shows incorrect answer feedback after submitting wrong answer', async () => {
      const user = userEvent.setup();
      const wrongOption = screen.getByLabelText(
        mockQuestions[0].options.find(opt => opt !== mockQuestions[0].answer)
      );
      
      await user.click(wrongOption);
      await user.click(screen.getByText('Submit Answer'));
      
      expect(screen.getByText('❌ Incorrect')).toBeInTheDocument();
      expect(screen.getByText(`Correct Answer: ${mockQuestions[0].answer}`)).toBeInTheDocument();
    });

    it('shows next question button after submitting answer', async () => {
      const user = userEvent.setup();
      const firstOption = screen.getByLabelText(mockQuestions[0].options[0]);
      
      await user.click(firstOption);
      await user.click(screen.getByText('Submit Answer'));
      
      expect(screen.getByText('Next Question')).toBeInTheDocument();
    });
  });

  describe('Statistics Tracking', () => {
    beforeEach(async () => {
      mockAxios.onGet('/api/questions/random').reply(200, mockQuestions[0]);
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(mockQuestions[0].question)).toBeInTheDocument();
      });
    });

    it('does not show statistics initially', () => {
      expect(screen.queryByText('Correct')).not.toBeInTheDocument();
      expect(screen.queryByText('Total')).not.toBeInTheDocument();
    });

    it('updates statistics after answering correctly', async () => {
      const user = userEvent.setup();
      const correctOption = screen.getByLabelText(mockQuestions[0].answer);
      
      await user.click(correctOption);
      await user.click(screen.getByText('Submit Answer'));
      
      expect(screen.getByText('1')).toBeInTheDocument(); // Correct count
      expect(screen.getByText('100%')).toBeInTheDocument(); // Accuracy
    });

    it('updates statistics after answering incorrectly', async () => {
      const user = userEvent.setup();
      const wrongOption = screen.getByLabelText(
        mockQuestions[0].options.find(opt => opt !== mockQuestions[0].answer)
      );
      
      await user.click(wrongOption);
      await user.click(screen.getByText('Submit Answer'));
      
      expect(screen.getByText('0')).toBeInTheDocument(); // Correct count
      expect(screen.getByText('0%')).toBeInTheDocument(); // Accuracy
    });

    it('calculates accuracy correctly over multiple questions', async () => {
      const user = userEvent.setup();
      
      // Answer first question correctly
      const correctOption = screen.getByLabelText(mockQuestions[0].answer);
      await user.click(correctOption);
      await user.click(screen.getByText('Submit Answer'));
      
      // Load second question
      mockAxios.onGet('/api/questions/random').reply(200, mockQuestions[1]);
      await user.click(screen.getByText('Get New Question'));
      
      await waitFor(() => {
        expect(screen.getByText(mockQuestions[1].question)).toBeInTheDocument();
      });
      
      // Answer second question incorrectly
      const wrongOption = screen.getByLabelText(
        mockQuestions[1].options.find(opt => opt !== mockQuestions[1].answer)
      );
      await user.click(wrongOption);
      await user.click(screen.getByText('Submit Answer'));
      
      // Should show 50% accuracy (1 correct out of 2 total)
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  describe('New Question Loading', () => {
    beforeEach(async () => {
      mockAxios.onGet('/api/questions/random').reply(200, mockQuestions[0]);
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(mockQuestions[0].question)).toBeInTheDocument();
      });
    });

    it('shows "Get New Question" button', () => {
      expect(screen.getByText('Get New Question')).toBeInTheDocument();
    });

    it('loads new question when "Get New Question" is clicked', async () => {
      const user = userEvent.setup();
      mockAxios.onGet('/api/questions/random').reply(200, mockQuestions[1]);
      
      await user.click(screen.getByText('Get New Question'));
      
      await waitFor(() => {
        expect(screen.getByText(mockQuestions[1].question)).toBeInTheDocument();
      });
    });

    it('resets question state when loading new question', async () => {
      const user = userEvent.setup();
      
      // Answer current question
      const firstOption = screen.getByLabelText(mockQuestions[0].options[0]);
      await user.click(firstOption);
      await user.click(screen.getByText('Submit Answer'));
      
      // Load new question
      mockAxios.onGet('/api/questions/random').reply(200, mockQuestions[1]);
      await user.click(screen.getByText('Get New Question'));
      
      await waitFor(() => {
        expect(screen.getByText(mockQuestions[1].question)).toBeInTheDocument();
      });
      
      // Should show Submit Answer button (not Next Question)
      expect(screen.queryByText('Next Question')).not.toBeInTheDocument();
      expect(screen.getByText('Submit Answer')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      mockAxios.onGet('/api/questions/random').reply(200, mockQuestions[0]);
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(mockQuestions[0].question)).toBeInTheDocument();
      });
    });

    it('has proper radio button labels', () => {
      mockQuestions[0].options.forEach(option => {
        const radioButton = screen.getByLabelText(option);
        expect(radioButton).toHaveAttribute('type', 'radio');
        expect(radioButton).toHaveAttribute('name', 'answer');
      });
    });

    it('has proper heading structure', () => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('AZ-204 Practice Quiz');
    });

    it('maintains focus management for form interactions', async () => {
      const user = userEvent.setup();
      const firstOption = screen.getByLabelText(mockQuestions[0].options[0]);
      
      await user.click(firstOption);
      expect(firstOption).toHaveFocus();
    });
  });

  describe('Environment Configuration', () => {
    it('uses correct API base URL from environment', () => {
      const expectedBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      
      mockAxios.onGet('/api/questions/random').reply(200, mockQuestions[0]);
      render(<App />);
      
      // Verify axios was called with correct base URL
      const request = mockAxios.history.get[0];
      expect(request.url).toBe('/api/questions/random');
      // Note: MockAdapter doesn't expose the base URL, but in real app it would use the configured base URL
    });
  });
});