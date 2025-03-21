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
    
    // Mock environment variables for Azure OpenAI
    process.env = { 
      ...originalEnv, 
      AZURE_OPENAI_KEY: '10073d56dbaf4362a3cec8c914e0b791',
      AZURE_OPENAI_ENDPOINT: 'https://flowise-azure-openai.openai.azure.com',
      AZURE_OPENAI_DEPLOYMENT_NAME: 'azure-gpt4o',
      AZURE_OPENAI_API_VERSION: '2023-05-15',
      NODE_ENV: 'test',
      USE_FALLBACK_QUESTIONS: 'false'
    };
    
    // Mock axios.post to return a successful response in Azure OpenAI format
    (axios.post as jest.Mock).mockResolvedValue({
      data: {
        choices: [
          {
            message: {
              content: `[
                {
                  "text": "What is the capital of France?",
                  "answers": [
                    { "text": "Paris", "isCorrect": true },
                    { "text": "London", "isCorrect": false },
                    { "text": "Berlin", "isCorrect": false },
                    { "text": "Madrid", "isCorrect": false }
                  ]
                },
                {
                  "text": "What is the largest planet in our solar system?",
                  "answers": [
                    { "text": "Earth", "isCorrect": false },
                    { "text": "Jupiter", "isCorrect": true },
                    { "text": "Saturn", "isCorrect": false },
                    { "text": "Mars", "isCorrect": false }
                  ]
                }
              ]`
            }
          }
        ]
      },
      status: 200
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
    it('should generate questions using Azure OpenAI API', async () => {
      // Call the function
      const questions = await generateQuestions(
        'Sample document content for testing',
        'qcm_simple' as QuestionType,
        'admission' as TestMode,
        'debutant' as Difficulty,
        5,
        'doc-123'
      );
      
      // Check the result
      expect(questions).toHaveLength(2);
      expect(questions[0].text).toBe('What is the capital of France?');
      expect(questions[0].answers).toHaveLength(4);
      expect(questions[0].answers.find(a => a.isCorrect)?.text).toBe('Paris');
      
      // Check that axios.post was called (without checking exact parameters)
      expect(axios.post).toHaveBeenCalled();
    });

    it('should use fallback questions if Azure OpenAI configuration is incomplete', async () => {
      // Remove the API key from environment variables
      delete process.env.AZURE_OPENAI_KEY;
      
      // Set environment to use fallback questions
      process.env.NODE_ENV = 'development';
      process.env.USE_FALLBACK_QUESTIONS = 'true';
      
      const questions = await generateQuestions(
        'Sample document content for testing',
        'qcm_simple' as QuestionType,
        'admission' as TestMode,
        'debutant' as Difficulty,
        5,
        'doc-123'
      );
      
      // Verify that we got fallback questions
      expect(questions.length).toBeGreaterThan(0);
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('should use fallback questions if USE_FALLBACK_QUESTIONS is true', async () => {
      // Set environment to use fallback questions
      process.env.NODE_ENV = 'development';
      process.env.USE_FALLBACK_QUESTIONS = 'true';
      
      const questions = await generateQuestions(
        'Sample document content for testing',
        'qcm_simple' as QuestionType,
        'admission' as TestMode,
        'debutant' as Difficulty,
        5,
        'doc-123'
      );
      
      // Verify that we got fallback questions
      expect(questions.length).toBeGreaterThan(0);
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON in Azure OpenAI response', async () => {
      // Mock axios.post to return an invalid JSON response
      (axios.post as jest.Mock).mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content: 'This is not valid JSON'
              }
            }
          ]
        }
      });
      
      // With docId, it should use fallback questions instead of throwing
      const questions = await generateQuestions(
        'Sample document content for testing',
        'qcm_simple' as QuestionType,
        'admission' as TestMode,
        'debutant' as Difficulty,
        5,
        'doc-123'
      );
      
      // Verify that we got fallback questions
      expect(questions.length).toBeGreaterThan(0);
    });
  });
});
