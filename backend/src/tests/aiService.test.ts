import axios from 'axios';
import { generateQuestions } from '../services/aiService';
import { QuestionType, TestMode, Difficulty } from '../models/types';

// Mock the dependencies
jest.mock('axios');

// Mock environment variables
const originalEnv = process.env;

describe('AI Service', () => {
  let mockConsoleError: jest.SpyInstance;
  let mockConsoleLog: jest.SpyInstance;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods to prevent test output pollution
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    // Mock environment variables
    process.env = { ...originalEnv, CLAUDE_API_KEY: 'mock-api-key' };
    
    // Mock axios.post to return a successful response
    (axios.post as jest.Mock).mockResolvedValue({
      data: {
        content: [
          {
            type: 'text',
            text: JSON.stringify([
              {
                text: 'What is the capital of France?',
                answers: [
                  { text: 'Paris', isCorrect: true },
                  { text: 'London', isCorrect: false },
                  { text: 'Berlin', isCorrect: false },
                  { text: 'Madrid', isCorrect: false }
                ]
              },
              {
                text: 'What is the largest planet in our solar system?',
                answers: [
                  { text: 'Earth', isCorrect: false },
                  { text: 'Jupiter', isCorrect: true },
                  { text: 'Saturn', isCorrect: false },
                  { text: 'Mars', isCorrect: false }
                ]
              }
            ])
          }
        ]
      }
    });
  });

  afterEach(() => {
    // Restore console functions
    mockConsoleError.mockRestore();
    mockConsoleLog.mockRestore();
    
    // Restore environment variables
    process.env = originalEnv;
  });

  describe('generateQuestions', () => {
    it('should generate questions using Claude API', async () => {
      // Call the function
      const questions = await generateQuestions(
        'doc-123',
        'Sample document content for testing',
        'qcm_simple' as QuestionType,
        'admission' as TestMode,
        'debutant' as Difficulty
      );
      
      // Check the result
      expect(questions).toHaveLength(2);
      expect(questions[0].text).toBe('What is the capital of France?');
      expect(questions[0].answers).toHaveLength(4);
      expect(questions[0].answers.find(a => a.isCorrect)?.text).toBe('Paris');
      
      // Check the API call
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-api-key': 'mock-api-key'
          })
        })
      );
    });

    it('should throw an error if Claude API key is not configured', async () => {
      // Remove the API key from environment variables
      delete process.env.CLAUDE_API_KEY;
      
      // Call the function and expect it to throw
      await expect(generateQuestions(
        'doc-123',
        'Sample document content for testing',
        'qcm_simple' as QuestionType,
        'admission' as TestMode,
        'debutant' as Difficulty
      )).rejects.toThrow('Claude API key is not configured');
    });

    it('should throw an error if Claude API call fails', async () => {
      // Mock axios.post to throw an error
      (axios.post as jest.Mock).mockRejectedValue(new Error('API call failed'));
      
      // Call the function and expect it to throw
      await expect(generateQuestions(
        'doc-123',
        'Sample document content for testing',
        'qcm_simple' as QuestionType,
        'admission' as TestMode,
        'debutant' as Difficulty
      )).rejects.toThrow('Failed to generate questions after 3 attempts: API call failed');
    });

    it('should throw an error if Claude response is not valid JSON', async () => {
      // Mock axios.post to return an invalid JSON response
      (axios.post as jest.Mock).mockResolvedValue({
        data: {
          content: [
            {
              type: 'text',
              text: 'This is not valid JSON'
            }
          ]
        }
      });
      
      // Call the function and expect it to throw
      await expect(generateQuestions(
        'doc-123',
        'Sample document content for testing',
        'qcm_simple' as QuestionType,
        'admission' as TestMode,
        'debutant' as Difficulty
      )).rejects.toThrow('Failed to parse Claude response: Unexpected token');
    });
  });
});
