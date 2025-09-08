import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuestionCard from './QuestionCard';

const mockQuestion = {
  id: 1,
  topic: "App Service",
  skillArea: "Develop Azure compute solutions",
  question: "Which of the following is NOT a valid App Service plan pricing tier?",
  options: ["Free", "Shared", "PremiumV2", "Elastic Premium"],
  answer: "Elastic Premium",
  explanation: "Elastic Premium is not a valid App Service plan tier. Valid tiers include Free, Shared, Basic, Standard, PremiumV2, PremiumV3, and Isolated."
};

describe('QuestionCard Component', () => {
  const mockOnAnswerSubmit = jest.fn();

  beforeEach(() => {
    mockOnAnswerSubmit.mockClear();
  });

  describe('Initial Render', () => {
    it('renders question content correctly', () => {
      render(<QuestionCard question={mockQuestion} onAnswerSubmit={mockOnAnswerSubmit} />);
      
      expect(screen.getByText(mockQuestion.question)).toBeInTheDocument();
      expect(screen.getByText(mockQuestion.topic)).toBeInTheDocument();
      expect(screen.getByText(mockQuestion.skillArea)).toBeInTheDocument();
      
      mockQuestion.options.forEach(option => {
        expect(screen.getByText(option)).toBeInTheDocument();
      });
    });

    it('renders all answer options as radio buttons', () => {
      render(<QuestionCard question={mockQuestion} onAnswerSubmit={mockOnAnswerSubmit} />);
      
      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons).toHaveLength(4);
      
      radioButtons.forEach((radio, index) => {
        expect(radio).toHaveAttribute('name', 'answer');
        expect(radio).toHaveAttribute('value', mockQuestion.options[index]);
        expect(radio).not.toBeChecked();
      });
    });

    it('has submit button disabled initially', () => {
      render(<QuestionCard question={mockQuestion} onAnswerSubmit={mockOnAnswerSubmit} />);
      
      const submitButton = screen.getByText('Submit Answer');
      expect(submitButton).toBeDisabled();
    });

    it('does not show feedback initially', () => {
      render(<QuestionCard question={mockQuestion} onAnswerSubmit={mockOnAnswerSubmit} />);
      
      expect(screen.queryByText('✅ Correct!')).not.toBeInTheDocument();
      expect(screen.queryByText('❌ Incorrect')).not.toBeInTheDocument();
      expect(screen.queryByText(mockQuestion.explanation)).not.toBeInTheDocument();
    });
  });

  describe('Answer Selection', () => {
    it('allows selecting an answer option', async () => {
      const user = userEvent.setup();
      render(<QuestionCard question={mockQuestion} onAnswerSubmit={mockOnAnswerSubmit} />);
      
      const firstOption = screen.getByLabelText(mockQuestion.options[0]);
      await user.click(firstOption);
      
      expect(firstOption).toBeChecked();
    });

    it('enables submit button after selecting an option', async () => {
      const user = userEvent.setup();
      render(<QuestionCard question={mockQuestion} onAnswerSubmit={mockOnAnswerSubmit} />);
      
      const submitButton = screen.getByText('Submit Answer');
      expect(submitButton).toBeDisabled();
      
      const firstOption = screen.getByLabelText(mockQuestion.options[0]);
      await user.click(firstOption);
      
      expect(submitButton).toBeEnabled();
    });

    it('allows changing answer selection before submitting', async () => {
      const user = userEvent.setup();
      render(<QuestionCard question={mockQuestion} onAnswerSubmit={mockOnAnswerSubmit} />);
      
      const firstOption = screen.getByLabelText(mockQuestion.options[0]);
      const secondOption = screen.getByLabelText(mockQuestion.options[1]);
      
      await user.click(firstOption);
      expect(firstOption).toBeChecked();
      expect(secondOption).not.toBeChecked();
      
      await user.click(secondOption);
      expect(firstOption).not.toBeChecked();
      expect(secondOption).toBeChecked();
    });

    it('prevents option selection after submitting', async () => {
      const user = userEvent.setup();
      render(<QuestionCard question={mockQuestion} onAnswerSubmit={mockOnAnswerSubmit} />);
      
      const firstOption = screen.getByLabelText(mockQuestion.options[0]);
      const secondOption = screen.getByLabelText(mockQuestion.options[1]);
      
      // Select and submit
      await user.click(firstOption);
      await user.click(screen.getByText('Submit Answer'));
      
      // Try to select different option
      await user.click(secondOption);
      
      // Should still have first option selected
      expect(firstOption).toBeChecked();
      expect(secondOption).not.toBeChecked();
    });
  });

  describe('Answer Submission', () => {
    it('calls onAnswerSubmit with correct parameters for correct answer', async () => {
      const user = userEvent.setup();
      render(<QuestionCard question={mockQuestion} onAnswerSubmit={mockOnAnswerSubmit} />);
      
      const correctOption = screen.getByLabelText(mockQuestion.answer);
      await user.click(correctOption);
      await user.click(screen.getByText('Submit Answer'));
      
      expect(mockOnAnswerSubmit).toHaveBeenCalledWith(true, mockQuestion.answer);
    });

    it('calls onAnswerSubmit with correct parameters for incorrect answer', async () => {
      const user = userEvent.setup();
      render(<QuestionCard question={mockQuestion} onAnswerSubmit={mockOnAnswerSubmit} />);
      
      const wrongAnswer = mockQuestion.options.find(opt => opt !== mockQuestion.answer);
      const wrongOption = screen.getByLabelText(wrongAnswer);
      
      await user.click(wrongOption);
      await user.click(screen.getByText('Submit Answer'));
      
      expect(mockOnAnswerSubmit).toHaveBeenCalledWith(false, wrongAnswer);
    });

    it('does not call onAnswerSubmit if no answer selected', async () => {
      const user = userEvent.setup();
      render(<QuestionCard question={mockQuestion} onAnswerSubmit={mockOnAnswerSubmit} />);
      
      const submitButton = screen.getByText('Submit Answer');
      
      // Button should be disabled, but try clicking anyway
      fireEvent.click(submitButton);
      
      expect(mockOnAnswerSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Feedback Display', () => {
    it('shows correct answer feedback', async () => {
      const user = userEvent.setup();
      render(<QuestionCard question={mockQuestion} onAnswerSubmit={mockOnAnswerSubmit} />);
      
      const correctOption = screen.getByLabelText(mockQuestion.answer);
      await user.click(correctOption);
      await user.click(screen.getByText('Submit Answer'));
      
      expect(screen.getByText('✅ Correct!')).toBeInTheDocument();
      expect(screen.getByText(mockQuestion.explanation)).toBeInTheDocument();
      expect(screen.queryByText(/Correct Answer:/)).not.toBeInTheDocument();
    });

    it('shows incorrect answer feedback', async () => {
      const user = userEvent.setup();
      render(<QuestionCard question={mockQuestion} onAnswerSubmit={mockOnAnswerSubmit} />);
      
      const wrongAnswer = mockQuestion.options.find(opt => opt !== mockQuestion.answer);
      const wrongOption = screen.getByLabelText(wrongAnswer);
      
      await user.click(wrongOption);
      await user.click(screen.getByText('Submit Answer'));
      
      expect(screen.getByText('❌ Incorrect')).toBeInTheDocument();
      expect(screen.getByText(mockQuestion.explanation)).toBeInTheDocument();
      expect(screen.getByText(`Correct Answer: ${mockQuestion.answer}`)).toBeInTheDocument();
    });

    it('shows Next Question button after submitting', async () => {
      const user = userEvent.setup();
      render(<QuestionCard question={mockQuestion} onAnswerSubmit={mockOnAnswerSubmit} />);
      
      const firstOption = screen.getByLabelText(mockQuestion.options[0]);
      await user.click(firstOption);
      await user.click(screen.getByText('Submit Answer'));
      
      expect(screen.getByText('Next Question')).toBeInTheDocument();
      expect(screen.queryByText('Submit Answer')).not.toBeInTheDocument();
    });
  });

  describe('Visual Feedback', () => {
    it('highlights correct answer in green after submission', async () => {
      const user = userEvent.setup();
      render(<QuestionCard question={mockQuestion} onAnswerSubmit={mockOnAnswerSubmit} />);
      
      const correctOption = screen.getByLabelText(mockQuestion.answer);
      await user.click(correctOption);
      await user.click(screen.getByText('Submit Answer'));
      
      const correctOptionContainer = correctOption.closest('div');
      const computedStyles = window.getComputedStyle(correctOptionContainer);
      
      // The component should apply green background styling
      expect(correctOptionContainer).toHaveStyle('background-color: rgb(220, 252, 231)');
    });

    it('highlights incorrect selected answer in red after submission', async () => {
      const user = userEvent.setup();
      render(<QuestionCard question={mockQuestion} onAnswerSubmit={mockOnAnswerSubmit} />);
      
      const wrongAnswer = mockQuestion.options.find(opt => opt !== mockQuestion.answer);
      const wrongOption = screen.getByLabelText(wrongAnswer);
      
      await user.click(wrongOption);
      await user.click(screen.getByText('Submit Answer'));
      
      const wrongOptionContainer = wrongOption.closest('div');
      
      // Should highlight selected wrong answer in red
      expect(wrongOptionContainer).toHaveStyle('background-color: rgb(254, 202, 202)');
    });
  });

  describe('Next Question Functionality', () => {
    it('resets component state when Next Question is clicked', async () => {
      const user = userEvent.setup();
      render(<QuestionCard question={mockQuestion} onAnswerSubmit={mockOnAnswerSubmit} />);
      
      // Submit an answer
      const firstOption = screen.getByLabelText(mockQuestion.options[0]);
      await user.click(firstOption);
      await user.click(screen.getByText('Submit Answer'));
      
      // Click Next Question
      await user.click(screen.getByText('Next Question'));
      
      // Should reset to initial state
      expect(screen.getByText('Submit Answer')).toBeInTheDocument();
      expect(screen.getByText('Submit Answer')).toBeDisabled();
      expect(screen.queryByText('Next Question')).not.toBeInTheDocument();
      expect(screen.queryByText('✅ Correct!')).not.toBeInTheDocument();
      expect(screen.queryByText('❌ Incorrect')).not.toBeInTheDocument();
      
      // All options should be unchecked
      const radioButtons = screen.getAllByRole('radio');
      radioButtons.forEach(radio => {
        expect(radio).not.toBeChecked();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper radio button grouping', () => {
      render(<QuestionCard question={mockQuestion} onAnswerSubmit={mockOnAnswerSubmit} />);
      
      const radioButtons = screen.getAllByRole('radio');
      radioButtons.forEach(radio => {
        expect(radio).toHaveAttribute('name', 'answer');
      });
    });

    it('has proper labels for all interactive elements', () => {
      render(<QuestionCard question={mockQuestion} onAnswerSubmit={mockOnAnswerSubmit} />);
      
      mockQuestion.options.forEach(option => {
        expect(screen.getByLabelText(option)).toBeInTheDocument();
      });
      
      expect(screen.getByRole('button', { name: 'Submit Answer' })).toBeInTheDocument();
    });

    it('maintains proper focus management', async () => {
      const user = userEvent.setup();
      render(<QuestionCard question={mockQuestion} onAnswerSubmit={mockOnAnswerSubmit} />);
      
      const firstOption = screen.getByLabelText(mockQuestion.options[0]);
      await user.click(firstOption);
      
      expect(firstOption).toHaveFocus();
    });

    it('has appropriate ARIA attributes for disabled states', () => {
      render(<QuestionCard question={mockQuestion} onAnswerSubmit={mockOnAnswerSubmit} />);
      
      const submitButton = screen.getByText('Submit Answer');
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveAttribute('disabled');
    });
  });

  describe('Error Handling', () => {
    it('handles missing question gracefully', () => {
      const incompleteQuestion = {
        id: 1,
        topic: "App Service",
        // Missing some required fields
      };
      
      // Should not crash when rendering incomplete question
      expect(() => {
        render(<QuestionCard question={incompleteQuestion} onAnswerSubmit={mockOnAnswerSubmit} />);
      }).not.toThrow();
    });

    it('handles missing onAnswerSubmit callback gracefully', async () => {
      const user = userEvent.setup();
      render(<QuestionCard question={mockQuestion} />);
      
      const firstOption = screen.getByLabelText(mockQuestion.options[0]);
      await user.click(firstOption);
      
      // Should not crash when clicking submit without callback
      expect(() => {
        fireEvent.click(screen.getByText('Submit Answer'));
      }).not.toThrow();
    });
  });

  describe('Component Props', () => {
    it('renders different questions correctly', () => {
      const differentQuestion = {
        ...mockQuestion,
        id: 2,
        question: "What is Azure Functions?",
        options: ["Serverless", "Container", "Virtual Machine", "Database"],
        answer: "Serverless"
      };
      
      const { rerender } = render(<QuestionCard question={mockQuestion} onAnswerSubmit={mockOnAnswerSubmit} />);
      expect(screen.getByText(mockQuestion.question)).toBeInTheDocument();
      
      rerender(<QuestionCard question={differentQuestion} onAnswerSubmit={mockOnAnswerSubmit} />);
      expect(screen.getByText(differentQuestion.question)).toBeInTheDocument();
      expect(screen.queryByText(mockQuestion.question)).not.toBeInTheDocument();
    });

    it('handles questions without explanations', async () => {
      const questionWithoutExplanation = {
        ...mockQuestion,
        explanation: undefined
      };
      
      const user = userEvent.setup();
      render(<QuestionCard question={questionWithoutExplanation} onAnswerSubmit={mockOnAnswerSubmit} />);
      
      const firstOption = screen.getByLabelText(mockQuestion.options[0]);
      await user.click(firstOption);
      await user.click(screen.getByText('Submit Answer'));
      
      // Should not show explanation section if no explanation
      expect(screen.queryByText('Explanation:')).not.toBeInTheDocument();
    });
  });
});