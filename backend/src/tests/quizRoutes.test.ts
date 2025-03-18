import request from 'supertest';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import quizRoutes from '../routes/quizRoutes';
import { parseFile } from '../services/parseService';
import { generateQuestions } from '../services/aiService';
import { exportGift, exportMoodleXml } from '../services/exportService';
import * as db from '../utils/db';

// Mock the dependencies
jest.mock('../services/parseService');
jest.mock('../services/aiService');
jest.mock('../services/exportService');
jest.mock('../utils/db');
jest.mock('fs');
jest.mock('path');
jest.mock('multer');
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid')
}));

// Mock console.error to prevent test output pollution
let mockConsoleError: jest.SpyInstance;

describe('Quiz Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Silence console output during tests
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Create a new Express app for each test
    app = express();
    app.use(express.json());
    app.use('/api', quizRoutes);
    
    // Mock multer
    (multer as unknown as jest.Mock).mockReturnValue({
      single: jest.fn().mockReturnValue((req: any, res: any, next: any) => {
        req.file = {
          path: '/tmp/mock-file.pdf',
          originalname: 'mock-file.pdf'
        };
        next();
      })
    });
  });

  afterEach(() => {
    // Restore console functions
    mockConsoleError.mockRestore();
  });

  describe('POST /api/upload', () => {
    it('should upload a file and return a document ID', async () => {
      // Mock parseFile to return some content
      (parseFile as jest.Mock).mockResolvedValue('Extracted text from file');
      
      // Mock insertDocument
      (db.insertDocument as jest.Mock).mockReturnValue({ changes: 1 });
      
      // Make the request
      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('mock file content'), 'test.pdf');
      
      // Check the response
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: {
          docId: 'mock-uuid',
          fileName: 'mock-file.pdf'
        }
      });
      
      // Check that the services were called
      expect(parseFile).toHaveBeenCalledWith('/tmp/mock-file.pdf');
      expect(db.insertDocument).toHaveBeenCalledWith('mock-uuid', 'mock-file.pdf', 'Extracted text from file');
    });

    it('should return an error if no file is uploaded', async () => {
      // Override the multer mock for this test
      (multer as unknown as jest.Mock).mockReturnValue({
        single: jest.fn().mockReturnValue((req: any, res: any, next: any) => {
          // Don't add req.file
          next();
        })
      });
      
      // Make the request
      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from(''), '');
      
      // Check the response
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'No file uploaded'
      });
    });
  });

  describe('POST /api/generate-questions', () => {
    it('should generate questions and return them', async () => {
      // Mock getDocumentById to return a document
      (db.getDocumentById as jest.Mock).mockReturnValue({
        id: 'doc-123',
        content: 'Document content'
      });
      
      // Mock generateQuestions to return some questions
      const mockQuestions = [
        {
          id: 'q1',
          docId: 'doc-123',
          text: 'Question 1',
          answers: [
            { id: 'a1', text: 'Answer 1', isCorrect: true },
            { id: 'a2', text: 'Answer 2', isCorrect: false }
          ]
        }
      ];
      (generateQuestions as jest.Mock).mockResolvedValue(mockQuestions);
      
      // Mock insertQuestion
      (db.insertQuestion as jest.Mock).mockReturnValue({ changes: 1 });
      
      // Make the request
      const response = await request(app)
        .post('/api/generate-questions')
        .send({
          docId: 'doc-123',
          questionType: 'qcm_simple',
          testMode: 'admission',
          difficulty: 'debutant'
        });
      
      // Check the response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          questions: mockQuestions
        }
      });
      
      // Check that the services were called
      expect(db.getDocumentById).toHaveBeenCalledWith('doc-123');
      expect(generateQuestions).toHaveBeenCalledWith(
        'doc-123',
        'Document content',
        'qcm_simple',
        'admission',
        'debutant'
      );
      expect(db.insertQuestion).toHaveBeenCalledWith('q1', 'doc-123', expect.any(String));
    });

    it('should return an error if document is not found', async () => {
      // Mock getDocumentById to return null
      (db.getDocumentById as jest.Mock).mockReturnValue(null);
      
      // Make the request
      const response = await request(app)
        .post('/api/generate-questions')
        .send({
          docId: 'doc-123',
          questionType: 'qcm_simple',
          testMode: 'admission',
          difficulty: 'debutant'
        });
      
      // Check the response
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: 'Document with ID doc-123 not found'
      });
    });
  });

  describe('GET /api/export/gift', () => {
    it('should export questions in GIFT format', async () => {
      // Mock getValidatedQuestions to return some questions
      const mockQuestionRecords = [
        {
          id: 'q1',
          docId: 'doc-123',
          content: JSON.stringify({
            id: 'q1',
            text: 'Question 1',
            answers: [
              { id: 'a1', text: 'Answer 1', isCorrect: true },
              { id: 'a2', text: 'Answer 2', isCorrect: false }
            ]
          })
        }
      ];
      (db.getValidatedQuestions as jest.Mock).mockReturnValue(mockQuestionRecords);
      
      // Mock exportGift to return some content
      (exportGift as jest.Mock).mockReturnValue('GIFT format content');
      
      // Make the request
      const response = await request(app)
        .get('/api/export/gift');
      
      // Check the response
      expect(response.status).toBe(200);
      expect(response.text).toBe('GIFT format content');
      expect(response.header['content-type']).toBe('text/plain');
      expect(response.header['content-disposition']).toBe('attachment; filename="quiz.gift"');
      
      // Check that the services were called
      expect(db.getValidatedQuestions).toHaveBeenCalled();
      expect(exportGift).toHaveBeenCalledWith([
        {
          id: 'q1',
          text: 'Question 1',
          answers: [
            { id: 'a1', text: 'Answer 1', isCorrect: true },
            { id: 'a2', text: 'Answer 2', isCorrect: false }
          ]
        }
      ]);
    });
  });

  describe('GET /api/export/xml', () => {
    it('should export questions in Moodle XML format', async () => {
      // Mock getValidatedQuestions to return some questions
      const mockQuestionRecords = [
        {
          id: 'q1',
          docId: 'doc-123',
          content: JSON.stringify({
            id: 'q1',
            text: 'Question 1',
            answers: [
              { id: 'a1', text: 'Answer 1', isCorrect: true },
              { id: 'a2', text: 'Answer 2', isCorrect: false }
            ]
          })
        }
      ];
      (db.getValidatedQuestions as jest.Mock).mockReturnValue(mockQuestionRecords);
      
      // Mock exportMoodleXml to return some content
      (exportMoodleXml as jest.Mock).mockReturnValue('<?xml version="1.0"?><quiz>...</quiz>');
      
      // Make the request
      const response = await request(app)
        .get('/api/export/xml');
      
      // Check the response
      expect(response.status).toBe(200);
      expect(response.text).toBe('<?xml version="1.0"?><quiz>...</quiz>');
      expect(response.header['content-type']).toBe('application/xml');
      expect(response.header['content-disposition']).toBe('attachment; filename="quiz.xml"');
      
      // Check that the services were called
      expect(db.getValidatedQuestions).toHaveBeenCalled();
      expect(exportMoodleXml).toHaveBeenCalledWith([
        {
          id: 'q1',
          text: 'Question 1',
          answers: [
            { id: 'a1', text: 'Answer 1', isCorrect: true },
            { id: 'a2', text: 'Answer 2', isCorrect: false }
          ]
        }
      ]);
    });
  });
});
