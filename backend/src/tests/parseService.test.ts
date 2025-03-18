import fs from 'fs';
import path from 'path';
import { parseFile } from '../services/parseService';

// Mock the dependencies
jest.mock('fs');
jest.mock('pdf-parse');
jest.mock('mammoth');
jest.mock('unzipper');

// Mock specific functions from parseService
jest.mock('../services/parseService', () => {
  // Keep the original module
  const originalModule = jest.requireActual('../services/parseService');
  
  // Mock specific functions
  return {
    ...originalModule,
    parsePDF: jest.fn().mockImplementation(async (filePath) => {
      if (filePath.includes('error')) {
        throw new Error('PDF parsing error');
      }
      return 'Parsed PDF content';
    }),
    parseDocx: jest.fn().mockImplementation(async (filePath) => {
      if (filePath.includes('error')) {
        throw new Error('DOCX parsing error');
      }
      return 'Parsed DOCX content';
    }),
    parseScorm: jest.fn().mockImplementation(async (filePath) => {
      if (filePath.includes('error')) {
        throw new Error('SCORM parsing error');
      }
      return 'Parsed SCORM content';
    })
  };
});

// Mock console.error to prevent test output pollution
let mockConsoleError: jest.SpyInstance;

describe('Parse Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Silence console output during tests
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console functions
    mockConsoleError.mockRestore();
  });

  describe('parseFile', () => {
    it('should call parsePDF for PDF files', async () => {
      // Import the mocked functions
      const { parsePDF } = require('../services/parseService');
      
      // Call the function
      const result = await parseFile('test.pdf');
      
      // Check the result
      expect(result).toBe('Parsed PDF content');
      expect(parsePDF).toHaveBeenCalledWith('test.pdf');
    });

    it('should call parseDocx for DOCX files', async () => {
      // Import the mocked functions
      const { parseDocx } = require('../services/parseService');
      
      // Call the function
      const result = await parseFile('test.docx');
      
      // Check the result
      expect(result).toBe('Parsed DOCX content');
      expect(parseDocx).toHaveBeenCalledWith('test.docx');
    });

    it('should call parseScorm for ZIP files', async () => {
      // Import the mocked functions
      const { parseScorm } = require('../services/parseService');
      
      // Call the function
      const result = await parseFile('test.zip');
      
      // Check the result
      expect(result).toBe('Parsed SCORM content');
      expect(parseScorm).toHaveBeenCalledWith('test.zip');
    });

    it('should throw an error for unsupported file formats', async () => {
      // Call the function and expect it to throw
      await expect(parseFile('test.txt')).rejects.toThrow('Unsupported file format: .txt');
    });
  });
});
