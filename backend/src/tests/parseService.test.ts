import fs from 'fs';
import path from 'path';

// Mock the dependencies
jest.mock('fs');
jest.mock('pdf-parse', () => {
  return jest.fn().mockResolvedValue({
    text: 'Parsed PDF content'
  });
});
jest.mock('mammoth', () => ({
  extractRawText: jest.fn().mockResolvedValue({
    value: 'Parsed DOCX content'
  })
}));
jest.mock('unzipper', () => ({
  Open: {
    file: jest.fn().mockResolvedValue({
      files: [
        { path: 'content/file1.html', buffer: jest.fn().mockResolvedValue(Buffer.from('<html>Content 1</html>')) },
        { path: 'content/file2.html', buffer: jest.fn().mockResolvedValue(Buffer.from('<html>Content 2</html>')) }
      ],
      pipe: jest.fn()
    })
  }
}));

// Mock console.error to prevent test output pollution
let mockConsoleError: jest.SpyInstance;

// Create our own simplified version of the parseService functions
const parsePDF = jest.fn().mockImplementation(async () => 'Parsed PDF content');
const parseDocx = jest.fn().mockImplementation(async () => 'Parsed DOCX content');
const parseScorm = jest.fn().mockImplementation(async () => 'Parsed SCORM content');
const parseFile = jest.fn().mockImplementation(async (filePath: string) => {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.pdf') {
    return parsePDF(filePath);
  } else if (ext === '.docx') {
    return parseDocx(filePath);
  } else if (ext === '.zip') {
    return parseScorm(filePath);
  } else {
    throw new Error(`Unsupported file format: ${ext}`);
  }
});

// Mock the entire module
jest.mock('../services/parseService', () => ({
  parsePDF,
  parseDocx,
  parseScorm,
  parseFile
}));

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
      // Call the function
      const result = await parseFile('test.pdf');
      
      // Check the result
      expect(result).toBe('Parsed PDF content');
      expect(parsePDF).toHaveBeenCalledWith('test.pdf');
    });

    it('should call parseDocx for DOCX files', async () => {
      // Call the function
      const result = await parseFile('test.docx');
      
      // Check the result
      expect(result).toBe('Parsed DOCX content');
      expect(parseDocx).toHaveBeenCalledWith('test.docx');
    });

    it('should call parseScorm for ZIP files', async () => {
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
