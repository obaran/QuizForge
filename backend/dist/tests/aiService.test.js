"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const aiService_1 = require("../services/aiService");
// Mock the dependencies
jest.mock('axios');
// Mock environment variables
const originalEnv = process.env;
describe('AI Service', () => {
    let mockConsoleError;
    let mockConsoleLog;
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock console methods to prevent test output pollution
        mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => { });
        mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => { });
        // Mock environment variables
        process.env = { ...originalEnv, CLAUDE_API_KEY: 'mock-api-key' };
        // Mock axios.post to return a successful response
        axios_1.default.post.mockResolvedValue({
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
            const questions = await (0, aiService_1.generateQuestions)('doc-123', 'Sample document content for testing', 'qcm_simple', 'admission', 'debutant');
            // Check the result
            expect(questions).toHaveLength(2);
            expect(questions[0].text).toBe('What is the capital of France?');
            expect(questions[0].answers).toHaveLength(4);
            expect(questions[0].answers.find(a => a.isCorrect)?.text).toBe('Paris');
            // Check the API call
            expect(axios_1.default.post).toHaveBeenCalledWith('https://api.anthropic.com/v1/messages', expect.any(Object), expect.objectContaining({
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                    'x-api-key': 'mock-api-key'
                })
            }));
        });
        it('should throw an error if Claude API key is not configured', async () => {
            // Remove the API key from environment variables
            delete process.env.CLAUDE_API_KEY;
            // Call the function and expect it to throw
            await expect((0, aiService_1.generateQuestions)('doc-123', 'Sample document content for testing', 'qcm_simple', 'admission', 'debutant')).rejects.toThrow('Claude API key is not configured');
        });
        it('should throw an error if Claude API call fails', async () => {
            // Mock axios.post to throw an error
            axios_1.default.post.mockRejectedValue(new Error('API call failed'));
            // Call the function and expect it to throw
            await expect((0, aiService_1.generateQuestions)('doc-123', 'Sample document content for testing', 'qcm_simple', 'admission', 'debutant')).rejects.toThrow('Failed to generate questions after 3 attempts: API call failed');
        });
        it('should throw an error if Claude response is not valid JSON', async () => {
            // Mock axios.post to return an invalid JSON response
            axios_1.default.post.mockResolvedValue({
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
            await expect((0, aiService_1.generateQuestions)('doc-123', 'Sample document content for testing', 'qcm_simple', 'admission', 'debutant')).rejects.toThrow('Failed to parse Claude response: Unexpected token');
        });
    });
});
//# sourceMappingURL=aiService.test.js.map