"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const parseService_1 = require("../services/parseService");
const aiService_1 = require("../services/aiService");
const exportService_1 = require("../services/exportService");
const db_1 = require("../utils/db");
const router = express_1.default.Router();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(__dirname, '../../uploads');
        // Create the uploads directory if it doesn't exist
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueFilename = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueFilename);
    }
});
const upload = (0, multer_1.default)({
    storage,
    fileFilter: (req, file, cb) => {
        // Check file types
        const allowedExtensions = ['.pdf', '.docx', '.zip'];
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(ext)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only PDF, DOCX, and ZIP (SCORM) files are allowed.'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});
// POST /api/upload - Upload a document
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }
        const filePath = req.file.path;
        const fileName = req.file.originalname;
        // Parse the file to extract text content
        const content = await (0, parseService_1.parseFile)(filePath);
        // Generate a unique ID for the document
        const docId = (0, uuid_1.v4)();
        // Store the document in the database
        (0, db_1.insertDocument)(docId, fileName, content);
        return res.status(201).json({
            success: true,
            data: {
                docId,
                fileName
            }
        });
    }
    catch (error) {
        console.error('Error uploading file:', error);
        return res.status(500).json({
            success: false,
            error: `Failed to upload file: ${error.message}`
        });
    }
});
// POST /api/generate-questions - Generate questions using Claude
router.post('/generate-questions', async (req, res) => {
    try {
        const { docId, questionType, testMode, difficulty } = req.body;
        // Validate request parameters
        if (!docId || !questionType || !testMode || !difficulty) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters: docId, questionType, testMode, difficulty'
            });
        }
        // Get the document from the database
        const document = (0, db_1.getDocumentById)(docId);
        if (!document) {
            return res.status(404).json({
                success: false,
                error: `Document with ID ${docId} not found`
            });
        }
        // Generate questions using Claude
        const questions = await (0, aiService_1.generateQuestions)(docId, document.content, questionType, testMode, difficulty);
        // Store the generated questions in the database
        for (const question of questions) {
            try {
                // Passer directement l'objet question, la conversion en JSON se fait dans insertQuestion
                (0, db_1.insertQuestion)(question.id, docId, question);
            }
            catch (error) {
                console.error('Error inserting question:', error);
                console.error('Question object:', question);
            }
        }
        return res.status(200).json({
            success: true,
            data: { questions }
        });
    }
    catch (error) {
        console.error('Error generating questions:', error);
        return res.status(500).json({
            success: false,
            error: `Failed to generate questions: ${error.message}`
        });
    }
});
// PUT /api/questions/:id - Update a question
router.put('/questions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // Get the existing question - get all questions and filter by ID
        const allQuestions = (0, db_1.getAllQuestions)();
        const questions = allQuestions.filter(q => {
            try {
                const questionData = JSON.parse(q.content);
                return questionData.id === id;
            }
            catch (error) {
                console.error('Error parsing question content:', error);
                return false;
            }
        });
        if (questions.length === 0) {
            return res.status(404).json({
                success: false,
                error: `Question with ID ${id} not found`
            });
        }
        // Parse the question content
        const question = JSON.parse(questions[0].content);
        // Update the question with the new data
        if (updateData.text) {
            question.text = updateData.text;
        }
        if (updateData.answers) {
            question.answers = updateData.answers;
        }
        if (updateData.validated !== undefined) {
            question.validated = updateData.validated;
        }
        // Save the updated question
        (0, db_1.updateQuestion)(id, JSON.stringify(question), question.validated);
        return res.status(200).json({
            success: true,
            data: { question }
        });
    }
    catch (error) {
        console.error('Error updating question:', error);
        return res.status(500).json({
            success: false,
            error: `Failed to update question: ${error.message}`
        });
    }
});
// GET /api/questions/:docId - Get all questions for a document
router.get('/questions/:docId', async (req, res) => {
    try {
        const { docId } = req.params;
        // Get the document from the database
        const document = (0, db_1.getDocumentById)(docId);
        if (!document) {
            return res.status(404).json({
                success: false,
                error: `Document with ID ${docId} not found`
            });
        }
        // Get all questions for the document
        const questionRecords = (0, db_1.getAllQuestions)().filter(q => q.docId === docId);
        const questions = questionRecords.map(q => JSON.parse(q.content));
        return res.status(200).json({
            success: true,
            data: { questions }
        });
    }
    catch (error) {
        console.error('Error getting questions:', error);
        return res.status(500).json({
            success: false,
            error: `Failed to get questions: ${error.message}`
        });
    }
});
// GET /api/export/gift - Export questions in GIFT format
router.get('/export/gift', async (req, res) => {
    try {
        // Get all validated questions
        const questionRecords = (0, db_1.getValidatedQuestions)();
        const questions = questionRecords.map(q => JSON.parse(q.content));
        // Generate GIFT format
        const giftContent = (0, exportService_1.exportGift)(questions);
        // Set response headers for file download
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', 'attachment; filename="quiz.gift"');
        return res.status(200).send(giftContent);
    }
    catch (error) {
        console.error('Error exporting GIFT:', error);
        return res.status(500).json({
            success: false,
            error: `Failed to export GIFT: ${error.message}`
        });
    }
});
// GET /api/export/xml - Export questions in Moodle XML format
router.get('/export/xml', async (req, res) => {
    try {
        // Get all validated questions
        const questionRecords = (0, db_1.getValidatedQuestions)();
        const questions = questionRecords.map(q => JSON.parse(q.content));
        // Generate Moodle XML format
        const xmlContent = (0, exportService_1.exportMoodleXml)(questions);
        // Set response headers for file download
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', 'attachment; filename="quiz.xml"');
        return res.status(200).send(xmlContent);
    }
    catch (error) {
        console.error('Error exporting XML:', error);
        return res.status(500).json({
            success: false,
            error: `Failed to export XML: ${error.message}`
        });
    }
});
exports.default = router;
//# sourceMappingURL=quizRoutes.js.map