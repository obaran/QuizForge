import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { parseFile } from '../services/parseService';
import { generateQuestions } from '../services/aiService';
import { exportGift, exportMoodleXml } from '../services/exportService';
import { 
  insertDocument, 
  getDocumentById, 
  insertQuestion, 
  updateQuestion, 
  getAllQuestions, 
  getValidatedQuestions 
} from '../utils/db';
import { Question, GenerateQuestionsRequest, UpdateQuestionRequest } from '../models/types';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    // Create the uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Check file types
    const allowedExtensions = ['.pdf', '.docx', '.zip'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
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
    const content = await parseFile(filePath);
    
    // Generate a unique ID for the document
    const docId = uuidv4();
    
    // Store the document in the database
    insertDocument(docId, fileName, content);
    
    return res.status(201).json({ 
      success: true, 
      data: { 
        docId, 
        fileName 
      } 
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to upload file: ${(error as Error).message}` 
    });
  }
});

// POST /api/generate-questions - Generate questions using Claude
router.post('/generate-questions', async (req, res) => {
  try {
    const { docId, questionType, testMode, difficulty } = req.body as GenerateQuestionsRequest;
    
    // Validate request parameters
    if (!docId || !questionType || !testMode || !difficulty) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters: docId, questionType, testMode, difficulty' 
      });
    }
    
    // Get the document from the database
    const document = getDocumentById(docId);
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        error: `Document with ID ${docId} not found` 
      });
    }
    
    // Generate questions using Claude
    const questions = await generateQuestions(
      docId,
      document.content,
      questionType,
      testMode,
      difficulty
    );
    
    // Store the generated questions in the database
    for (const question of questions) {
      try {
        // Passer directement l'objet question, la conversion en JSON se fait dans insertQuestion
        insertQuestion(question.id, docId, question);
      } catch (error) {
        console.error('Error inserting question:', error);
        console.error('Question object:', question);
      }
    }
    
    return res.status(200).json({ 
      success: true, 
      data: { questions } 
    });
  } catch (error) {
    console.error('Error generating questions:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to generate questions: ${(error as Error).message}` 
    });
  }
});

// PUT /api/questions/:id - Update a question
router.put('/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body as UpdateQuestionRequest;
    
    // Get the existing question - get all questions and filter by ID
    const allQuestions = getAllQuestions();
    const questions = allQuestions.filter(q => {
      try {
        const questionData = JSON.parse(q.content);
        return questionData.id === id;
      } catch (error) {
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
    const question = JSON.parse(questions[0].content) as Question;
    
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
    updateQuestion(id, JSON.stringify(question), question.validated);
    
    return res.status(200).json({ 
      success: true, 
      data: { question } 
    });
  } catch (error) {
    console.error('Error updating question:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to update question: ${(error as Error).message}` 
    });
  }
});

// GET /api/questions/:docId - Get all questions for a document
router.get('/questions/:docId', async (req, res) => {
  try {
    const { docId } = req.params;
    
    // Get the document from the database
    const document = getDocumentById(docId);
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        error: `Document with ID ${docId} not found` 
      });
    }
    
    // Get all questions for the document
    const questionRecords = getAllQuestions().filter(q => q.docId === docId);
    const questions = questionRecords.map(q => JSON.parse(q.content));
    
    return res.status(200).json({ 
      success: true, 
      data: { questions } 
    });
  } catch (error) {
    console.error('Error getting questions:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to get questions: ${(error as Error).message}` 
    });
  }
});

// GET /api/export/gift - Export questions in GIFT format
router.get('/export/gift', async (req, res) => {
  try {
    // Get all validated questions
    const questionRecords = getValidatedQuestions();
    const questions = questionRecords.map(q => JSON.parse(q.content));
    
    // Generate GIFT format
    const giftContent = exportGift(questions);
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="quiz.gift"');
    
    return res.status(200).send(giftContent);
  } catch (error) {
    console.error('Error exporting GIFT:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to export GIFT: ${(error as Error).message}` 
    });
  }
});

// GET /api/export/xml - Export questions in Moodle XML format
router.get('/export/xml', async (req, res) => {
  try {
    // Get all validated questions
    const questionRecords = getValidatedQuestions();
    const questions = questionRecords.map(q => JSON.parse(q.content));
    
    // Generate Moodle XML format
    const xmlContent = exportMoodleXml(questions);
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', 'attachment; filename="quiz.xml"');
    
    return res.status(200).send(xmlContent);
  } catch (error) {
    console.error('Error exporting XML:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to export XML: ${(error as Error).message}` 
    });
  }
});

export default router;
