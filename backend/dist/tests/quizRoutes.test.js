"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const quizRoutes_1 = __importDefault(require("../routes/quizRoutes"));
const parseService_1 = require("../services/parseService");
const aiService_1 = require("../services/aiService");
const exportService_1 = require("../services/exportService");
const db = __importStar(require("../utils/db"));
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
let mockConsoleError;
describe('Quiz Routes', () => {
    let app;
    beforeEach(() => {
        jest.clearAllMocks();
        // Silence console output during tests
        mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => { });
        // Create a new Express app for each test
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.use('/api', quizRoutes_1.default);
        // Mock multer
        multer_1.default.mockReturnValue({
            single: jest.fn().mockReturnValue((req, res, next) => {
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
            parseService_1.parseFile.mockResolvedValue('Extracted text from file');
            // Mock insertDocument
            db.insertDocument.mockReturnValue({ changes: 1 });
            // Make the request
            const response = await (0, supertest_1.default)(app)
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
            expect(parseService_1.parseFile).toHaveBeenCalledWith('/tmp/mock-file.pdf');
            expect(db.insertDocument).toHaveBeenCalledWith('mock-uuid', 'mock-file.pdf', 'Extracted text from file');
        });
        it('should return an error if no file is uploaded', async () => {
            // Override the multer mock for this test
            multer_1.default.mockReturnValue({
                single: jest.fn().mockReturnValue((req, res, next) => {
                    // Don't add req.file
                    next();
                })
            });
            // Make the request
            const response = await (0, supertest_1.default)(app)
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
            db.getDocumentById.mockReturnValue({
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
            aiService_1.generateQuestions.mockResolvedValue(mockQuestions);
            // Mock insertQuestion
            db.insertQuestion.mockReturnValue({ changes: 1 });
            // Make the request
            const response = await (0, supertest_1.default)(app)
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
            expect(aiService_1.generateQuestions).toHaveBeenCalledWith('doc-123', 'Document content', 'qcm_simple', 'admission', 'debutant');
            expect(db.insertQuestion).toHaveBeenCalledWith('q1', 'doc-123', expect.any(String));
        });
        it('should return an error if document is not found', async () => {
            // Mock getDocumentById to return null
            db.getDocumentById.mockReturnValue(null);
            // Make the request
            const response = await (0, supertest_1.default)(app)
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
            db.getValidatedQuestions.mockReturnValue(mockQuestionRecords);
            // Mock exportGift to return some content
            exportService_1.exportGift.mockReturnValue('GIFT format content');
            // Make the request
            const response = await (0, supertest_1.default)(app)
                .get('/api/export/gift');
            // Check the response
            expect(response.status).toBe(200);
            expect(response.text).toBe('GIFT format content');
            expect(response.header['content-type']).toBe('text/plain');
            expect(response.header['content-disposition']).toBe('attachment; filename="quiz.gift"');
            // Check that the services were called
            expect(db.getValidatedQuestions).toHaveBeenCalled();
            expect(exportService_1.exportGift).toHaveBeenCalledWith([
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
            db.getValidatedQuestions.mockReturnValue(mockQuestionRecords);
            // Mock exportMoodleXml to return some content
            exportService_1.exportMoodleXml.mockReturnValue('<?xml version="1.0"?><quiz>...</quiz>');
            // Make the request
            const response = await (0, supertest_1.default)(app)
                .get('/api/export/xml');
            // Check the response
            expect(response.status).toBe(200);
            expect(response.text).toBe('<?xml version="1.0"?><quiz>...</quiz>');
            expect(response.header['content-type']).toBe('application/xml');
            expect(response.header['content-disposition']).toBe('attachment; filename="quiz.xml"');
            // Check that the services were called
            expect(db.getValidatedQuestions).toHaveBeenCalled();
            expect(exportService_1.exportMoodleXml).toHaveBeenCalledWith([
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
//# sourceMappingURL=quizRoutes.test.js.map