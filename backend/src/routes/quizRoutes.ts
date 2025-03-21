import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { 
  getDocumentById, 
  insertDocument, 
  insertQuestion, 
  getQuestionsByDocId,
  updateQuestion,
  getValidatedQuestions,
  getValidatedQuestionsByDocId,
  getAllQuestions,
  insertReferentiel,
  getAllReferentiels,
  getReferentielById,
  getAllDocuments,
  removeDuplicateDocuments,
  resetValidatedQuestions,
  db
} from '../utils/db';
import { generateQuestions } from '../services/aiService';
import { exportGift, exportMoodleXml, exportAiken, exportPdf } from '../services/exportService';
import { parseFile } from '../services/parseService';
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
    const allowedExtensions = ['.pdf', '.docx', '.zip', '.txt', '.html'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, ZIP (SCORM), TXT, and HTML files are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const referentielUpload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Check file types for referentiels
    const allowedExtensions = ['.pdf', '.docx', '.xls', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type for referentiel. Only PDF, DOCX, XLS, and XLSX files are allowed.'));
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

// POST /api/upload-referentiel - Upload a referentiel
router.post('/upload-referentiel', referentielUpload.single('file'), async (req, res) => {
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
    
    // Generate a unique ID for the referentiel
    const refId = uuidv4();
    
    // Store the referentiel in the database
    insertReferentiel(refId, fileName, content);
    
    return res.status(201).json({ 
      success: true, 
      data: { 
        refId, 
        fileName 
      } 
    });
  } catch (error) {
    console.error('Error uploading referentiel:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to upload referentiel: ${(error as Error).message}` 
    });
  }
});

// GET /api/referentiels - Get all referentiels
router.get('/referentiels', async (req, res) => {
  try {
    // Get all referentiels from the database
    const referentiels = getAllReferentiels();
    
    // Map to a simpler format for the frontend
    const simplifiedReferentiels = referentiels.map(ref => ({
      id: ref.id,
      filename: ref.filename,
      createdAt: ref.createdAt
    }));
    
    return res.status(200).json({ 
      success: true, 
      data: { referentiels: simplifiedReferentiels } 
    });
  } catch (error) {
    console.error('Error getting referentiels:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to get referentiels: ${(error as Error).message}` 
    });
  }
});

// GET /api/documents - Get all documents
router.get('/documents', async (req, res) => {
  try {
    // Get all documents from the database
    const documents = getAllDocuments();
    
    // Map to a simpler format for the frontend
    const simplifiedDocuments = documents.map(doc => ({
      docId: doc.id,
      filename: doc.filename,
      createdAt: doc.createdAt
    }));
    
    return res.status(200).json({ 
      success: true, 
      data: { documents: simplifiedDocuments } 
    });
  } catch (error) {
    console.error('Error getting documents:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to get documents: ${(error as Error).message}` 
    });
  }
});

// GET /api/cleanup-duplicates - Remove duplicate documents
router.get('/cleanup-duplicates', async (req, res) => {
  try {
    const removedCount = removeDuplicateDocuments();
    
    return res.status(200).json({ 
      success: true, 
      data: { removedCount } 
    });
  } catch (error) {
    console.error('Error cleaning up duplicates:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to clean up duplicates: ${(error as Error).message}` 
    });
  }
});

// POST /api/generate-questions - Generate questions using Azure OpenAI
router.post('/generate-questions', async (req, res) => {
  try {
    const { docId, questionType, testMode, difficulty, numberOfQuestions, refId } = req.body as GenerateQuestionsRequest;
    
    console.log(`Generating questions for document ${docId} with type ${questionType}, mode ${testMode}, difficulty ${difficulty}`);
    console.log(`Number of questions requested: ${numberOfQuestions || 5}`);
    console.log(`Referentiel ID: ${refId || 'None'}`);
    
    if (!docId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Document ID is required' 
      });
    }
    
    // Get the document by ID or filename
    let document = getDocumentById(docId);
    
    // If document not found by ID, try to find it by filename
    if (!document) {
      const allDocuments = getAllDocuments();
      document = allDocuments.find(doc => doc.filename === docId);
    }
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        error: `Document with ID ${docId} not found` 
      });
    }

    // Récupérer le contenu du référentiel si un ID est fourni
    let referentielContent: string | undefined;
    if (refId) {
      const referentiel = getReferentielById(refId);
      if (referentiel) {
        console.log(`Utilisation du référentiel ${refId} comme guide`);
        referentielContent = referentiel.content;
      } else {
        console.log(`Référentiel ${refId} non trouvé, génération sans référentiel`);
      }
    }
    
    // Réinitialiser les questions validées pour ce document
    console.log(`Réinitialisation des questions validées pour le document ${document.id}`);
    const resetCount = resetValidatedQuestions(document.id);
    console.log(`${resetCount} questions ont été réinitialisées`);
    
    // Use the document content to generate questions
    const content = document.content;
    
    // Définir le nombre de questions à générer (par défaut: 5)
    const questionsToGenerate = numberOfQuestions ? parseInt(String(numberOfQuestions), 10) : 5;
    console.log(`Génération de ${questionsToGenerate} questions`);
    
    // Generate questions using the AI service
    const questions = await generateQuestions(content, questionType, testMode, difficulty, questionsToGenerate, document.id, referentielContent);
    
    // Insert questions into the database
    const insertedQuestions = [];
    for (const question of questions) {
      const questionId = uuidv4();
      const questionContent = JSON.stringify({
        ...question,
        id: questionId,
        docId: document.id
      });
      
      insertQuestion({
        id: questionId,
        docId: document.id,
        content: questionContent,
        validated: false,
        createdAt: new Date().toISOString()
      });
      
      insertedQuestions.push({
        ...question,
        id: questionId,
        docId: document.id
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      data: { 
        questions: insertedQuestions,
        docId: document.id,
        resetCount // Inclure le nombre de questions réinitialisées dans la réponse
      } 
    });
  } catch (error) {
    console.error('Error generating questions:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to generate questions: ${(error as Error).message}` 
    });
  }
});

// POST /api/generate-questions-temp - Generate questions without storing in database
router.post('/generate-questions-temp', async (req, res) => {
  try {
    const { docId, questionType, testMode, difficulty, numberOfQuestions, refId } = req.body as GenerateQuestionsRequest;
    
    console.log(`Generating temporary questions for document ${docId} with type ${questionType}, mode ${testMode}, difficulty ${difficulty}`);
    console.log(`Number of questions requested: ${numberOfQuestions || 5}`);
    console.log(`Referentiel ID: ${refId || 'None'}`);
    
    if (!docId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Document ID is required' 
      });
    }
    
    // Get the document by ID or filename
    let document = getDocumentById(docId);
    
    // If document not found by ID, try to find it by filename
    if (!document) {
      const allDocuments = getAllDocuments();
      document = allDocuments.find(doc => doc.filename === docId);
    }
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        error: `Document with ID ${docId} not found` 
      });
    }

    // Récupérer le contenu du référentiel si un ID est fourni
    let referentielContent: string | undefined;
    if (refId) {
      const referentiel = getReferentielById(refId);
      if (referentiel) {
        console.log(`Utilisation du référentiel ${refId} comme guide`);
        referentielContent = referentiel.content;
      } else {
        console.log(`Référentiel ${refId} non trouvé, génération sans référentiel`);
      }
    }
    
    // Use the document content to generate questions
    const content = document.content;
    
    // Définir le nombre de questions à générer (par défaut: 5)
    const questionsToGenerate = numberOfQuestions ? parseInt(String(numberOfQuestions), 10) : 5;
    console.log(`Génération de ${questionsToGenerate} questions temporaires`);
    
    // Generate questions using the AI service
    const questions = await generateQuestions(content, questionType, testMode, difficulty, questionsToGenerate, document.id, referentielContent);
    
    // Ajouter des IDs temporaires aux questions sans les stocker en base de données
    const tempQuestions = questions.map(question => ({
      ...question,
      id: uuidv4(),
      docId: document.id,
      validated: false,
      createdAt: new Date().toISOString()
    }));
    
    return res.status(200).json({ 
      success: true, 
      data: { 
        questions: tempQuestions,
        docId: document.id
      } 
    });
  } catch (error) {
    console.error('Error generating temporary questions:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to generate questions: ${(error as Error).message}` 
    });
  }
});

// POST /api/save-validated-questions - Save only validated questions to database
router.post('/save-validated-questions', async (req, res) => {
  try {
    const { docId, questions } = req.body;
    
    if (!docId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Document ID is required' 
      });
    }
    
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No questions provided to save' 
      });
    }
    
    console.log(`Sauvegarde de ${questions.length} questions validées pour le document ${docId}`);
    
    // Réinitialiser les questions validées pour ce document
    console.log(`Réinitialisation des questions validées pour le document ${docId}`);
    const resetCount = resetValidatedQuestions(docId);
    console.log(`${resetCount} questions ont été réinitialisées`);
    
    // Insert validated questions into the database
    const insertedQuestions = [];
    for (const question of questions) {
      const questionId = question.id || uuidv4();
      const questionContent = JSON.stringify({
        ...question,
        id: questionId,
        docId: docId,
        validated: true
      });
      
      insertQuestion({
        id: questionId,
        docId: docId,
        content: questionContent,
        validated: true,
        createdAt: question.createdAt || new Date().toISOString()
      });
      
      insertedQuestions.push({
        ...question,
        id: questionId,
        docId: docId,
        validated: true
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      data: { 
        questions: insertedQuestions,
        docId: docId
      } 
    });
  } catch (error) {
    console.error('Error saving validated questions:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to save questions: ${(error as Error).message}` 
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

// POST /api/questions/reset/:docId - Reset all validated questions for a specific document
router.post('/questions/reset/:docId', (req, res) => {
  try {
    console.log('Resetting validated questions for docId:', req.params.docId);
    const { docId } = req.params;
    
    // Décodage de l'ID pour gérer les caractères spéciaux
    const decodedDocId = decodeURIComponent(docId);
    console.log('Decoded docId:', decodedDocId);
    
    // Get the document to verify it exists
    const document = getDocumentById(decodedDocId);
    if (!document) {
      console.error(`Document with ID ${decodedDocId} not found`);
      return res.status(404).json({ 
        success: false, 
        error: `Document with ID ${decodedDocId} not found` 
      });
    }
    
    // Reset all validated questions for this document
    const resetCount = resetValidatedQuestions(decodedDocId);
    console.log(`Reset ${resetCount} validated questions for document: ${document.filename}`);
    
    res.json({ 
      success: true, 
      message: `${resetCount} questions ont été réinitialisées.`,
      resetCount
    });
  } catch (error) {
    console.error('Error resetting validated questions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Échec de la réinitialisation des questions validées' 
    });
  }
});

// GET /api/export/gift/:docId - Export questions in GIFT format for a specific document
router.get('/export/gift/:docId', async (req, res) => {
  try {
    const { docId } = req.params;
    
    // Décodage de l'ID pour gérer les caractères spéciaux
    const decodedDocId = decodeURIComponent(docId);
    
    // Get the document to use its name for the export file
    const document = getDocumentById(decodedDocId);
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        error: `Document with ID ${decodedDocId} not found` 
      });
    }
    
    // Get all validated questions for this document
    const questionRecords = getValidatedQuestionsByDocId(decodedDocId);
    
    // Si aucune question validée, retourner un message d'erreur mais avec un code 200
    // pour que le frontend puisse afficher le message approprié
    if (questionRecords.length === 0) {
      return res.status(200).json({ 
        success: false, 
        error: `Vous n'avez validé aucune question. Veuillez valider au moins une question avant d'exporter.` 
      });
    }
    
    const questions = questionRecords.map(q => JSON.parse(q.content));
    
    // Generate GIFT format
    const giftContent = exportGift(questions);
    
    // Create a clean filename based on the document name
    const cleanFilename = document.filename
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace special chars with underscore
      .substring(0, 50); // Limit length
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=${cleanFilename}_gift.txt`);
    
    // Send the GIFT content
    res.send(giftContent);
  } catch (error) {
    console.error('Error exporting to GIFT:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export questions in GIFT format' 
    });
  }
});

// GET /api/export/xml/:docId - Export questions in Moodle XML format for a specific document
router.get('/export/xml/:docId', async (req, res) => {
  try {
    const { docId } = req.params;
    
    // Décodage de l'ID pour gérer les caractères spéciaux
    const decodedDocId = decodeURIComponent(docId);
    
    // Get the document to use its name for the export file
    const document = getDocumentById(decodedDocId);
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        error: `Document with ID ${decodedDocId} not found` 
      });
    }
    
    // Get all validated questions for this document
    const questionRecords = getValidatedQuestionsByDocId(decodedDocId);
    
    // Si aucune question validée, retourner un message d'erreur mais avec un code 200
    // pour que le frontend puisse afficher le message approprié
    if (questionRecords.length === 0) {
      return res.status(200).json({ 
        success: false, 
        error: `Vous n'avez validé aucune question. Veuillez valider au moins une question avant d'exporter.` 
      });
    }
    
    const questions = questionRecords.map(q => JSON.parse(q.content));
    
    // Generate Moodle XML format
    const xmlContent = exportMoodleXml(questions);
    
    // Create a clean filename based on the document name
    const cleanFilename = document.filename
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace special chars with underscore
      .substring(0, 50); // Limit length
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename=${cleanFilename}_moodle.xml`);
    
    // Send the XML content
    res.send(xmlContent);
  } catch (error) {
    console.error('Error exporting to Moodle XML:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export questions in Moodle XML format' 
    });
  }
});

// GET /api/export/gift - Export all validated questions in GIFT format
router.get('/export/gift', async (req, res) => {
  try {
    // Get all validated questions
    const questionRecords = getValidatedQuestions();
    
    if (questionRecords.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'No validated questions found' 
      });
    }
    
    const questions = questionRecords.map(q => JSON.parse(q.content));
    
    // Generate GIFT format
    const giftContent = exportGift(questions);
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="quiz_complet.gift"');
    
    return res.status(200).send(giftContent);
  } catch (error) {
    console.error('Error exporting GIFT:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to export GIFT: ${(error as Error).message}` 
    });
  }
});

// GET /api/export/xml - Export all validated questions in Moodle XML format
router.get('/export/xml', async (req, res) => {
  try {
    // Get all validated questions
    const questionRecords = getValidatedQuestions();
    
    if (questionRecords.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'No validated questions found' 
      });
    }
    
    const questions = questionRecords.map(q => JSON.parse(q.content));
    
    // Generate Moodle XML format
    const xmlContent = exportMoodleXml(questions);
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', 'attachment; filename="quiz_complet.xml"');
    
    return res.status(200).send(xmlContent);
  } catch (error) {
    console.error('Error exporting XML:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to export XML: ${(error as Error).message}` 
    });
  }
});

// GET /api/export/aiken/:docId - Export questions in Aiken format for a specific document
router.get('/export/aiken/:docId', async (req, res) => {
  try {
    const { docId } = req.params;
    
    // Décodage de l'ID pour gérer les caractères spéciaux
    const decodedDocId = decodeURIComponent(docId);
    
    // Get the document to use its name for the export file
    const document = getDocumentById(decodedDocId);
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        error: `Document with ID ${decodedDocId} not found` 
      });
    }
    
    // Get all validated questions for this document
    const questionRecords = getValidatedQuestionsByDocId(decodedDocId);
    
    // Si aucune question validée, retourner un message d'erreur mais avec un code 200
    // pour que le frontend puisse afficher le message approprié
    if (questionRecords.length === 0) {
      return res.status(200).json({ 
        success: false, 
        error: `Vous n'avez validé aucune question. Veuillez valider au moins une question avant d'exporter.` 
      });
    }
    
    const questions = questionRecords.map(q => JSON.parse(q.content));
    
    // Generate Aiken format
    const aikenContent = exportAiken(questions);
    
    // Create a clean filename based on the document name
    const cleanFilename = document.filename
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace special chars with underscore
      .substring(0, 50); // Limit length
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=${cleanFilename}_aiken.txt`);
    
    // Send the Aiken content
    res.send(aikenContent);
  } catch (error) {
    console.error('Error exporting to Aiken:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export questions in Aiken format' 
    });
  }
});

// GET /api/export/pdf/:docId - Export questions in PDF format for a specific document
router.get('/export/pdf/:docId', async (req, res) => {
  try {
    console.log('PDF export request received for docId:', req.params.docId);
    const { docId } = req.params;
    
    // Décodage de l'ID pour gérer les caractères spéciaux
    const decodedDocId = decodeURIComponent(docId);
    console.log('Decoded docId:', decodedDocId);
    
    // Get the document to use its name for the export file
    const document = getDocumentById(decodedDocId);
    if (!document) {
      console.error(`Document with ID ${decodedDocId} not found`);
      return res.status(404).json({ 
        success: false, 
        error: `Document with ID ${decodedDocId} not found` 
      });
    }
    console.log('Document found:', document.filename);
    
    // Get all validated questions for this document
    const questionRecords = getValidatedQuestionsByDocId(decodedDocId);
    console.log('Number of validated questions found:', questionRecords.length);
    
    // Si aucune question validée, retourner un message d'erreur mais avec un code 200
    // pour que le frontend puisse afficher le message approprié
    if (questionRecords.length === 0) {
      console.log('No validated questions found for this document');
      return res.status(200).json({ 
        success: false, 
        error: `Vous n'avez validé aucune question. Veuillez valider au moins une question avant d'exporter.` 
      });
    }
    
    try {
      console.log('Parsing question content');
      const questions = questionRecords.map(q => {
        try {
          return JSON.parse(q.content);
        } catch (parseError: any) {
          console.error('Error parsing question content:', parseError, 'Content:', q.content);
          throw new Error(`Failed to parse question content: ${parseError.message}`);
        }
      });
      
      console.log('Generating PDF');
      // Generate PDF format
      const pdfContent = await exportPdf(questions);
      console.log('PDF generated successfully, size:', pdfContent.length, 'bytes');
      
      // Create a clean filename based on the document name
      const cleanFilename = document.filename
        .replace(/\.[^/.]+$/, '') // Remove extension
        .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace special chars with underscore
        .substring(0, 50); // Limit length
      
      console.log('Setting response headers for file download');
      // Set response headers for file download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${cleanFilename}_questions.pdf`);
      
      console.log('Sending PDF content');
      // Send the PDF content
      res.send(pdfContent);
      console.log('PDF sent successfully');
    } catch (innerError: any) {
      console.error('Inner error during PDF export:', innerError);
      res.status(500).json({ 
        success: false, 
        error: `Error generating PDF: ${innerError.message}` 
      });
    }
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export questions in PDF format' 
    });
  }
});

// DELETE /api/documents/:docId - Delete a document
router.delete('/documents/:docId', async (req, res) => {
  try {
    const { docId } = req.params;
    
    // Get the document to check if it exists
    const document = getDocumentById(docId);
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        error: `Document with ID ${docId} not found` 
      });
    }
    
    // Delete the document and its associated questions from the database
    db.prepare('DELETE FROM questions WHERE docId = ?').run(docId);
    db.prepare('DELETE FROM documents WHERE id = ?').run(docId);
    
    return res.status(200).json({ 
      success: true, 
      data: { success: true } 
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to delete document: ${(error as Error).message}` 
    });
  }
});

// DELETE /api/referentiels/:refId - Delete a referentiel
router.delete('/referentiels/:refId', async (req, res) => {
  try {
    const { refId } = req.params;
    
    // Get the referentiel to check if it exists
    const referentiel = getReferentielById(refId);
    if (!referentiel) {
      return res.status(404).json({ 
        success: false, 
        error: `Referentiel with ID ${refId} not found` 
      });
    }
    
    // Delete the referentiel from the database
    db.prepare('DELETE FROM referentiels WHERE id = ?').run(refId);
    
    return res.status(200).json({ 
      success: true, 
      data: { success: true } 
    });
  } catch (error) {
    console.error('Error deleting referentiel:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to delete referentiel: ${(error as Error).message}` 
    });
  }
});

// GET /api/documents/:docId/content - Get document content
router.get('/documents/:docId/content', async (req, res) => {
  try {
    const { docId } = req.params;
    
    // Décodage de l'ID pour gérer les caractères spéciaux
    const decodedDocId = decodeURIComponent(docId);
    
    console.log(`Trying to get document with ID: ${decodedDocId}`);
    
    // Get the document
    const document = getDocumentById(decodedDocId);
    if (!document) {
      console.error(`Document with ID ${decodedDocId} not found`);
      
      // Récupérer tous les documents pour le débogage
      const allDocuments = getAllDocuments();
      console.log(`Available documents: ${allDocuments.map(doc => doc.id).join(', ')}`);
      
      return res.status(404).json({ 
        success: false, 
        error: `Document with ID ${decodedDocId} not found` 
      });
    }
    
    console.log(`Found document: ${document.filename}, content length: ${document.content ? document.content.length : 0}`);
    
    return res.status(200).json({ 
      success: true, 
      data: { content: document.content || 'Contenu non disponible' } 
    });
  } catch (error) {
    console.error('Error getting document content:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to get document content: ${(error as Error).message}` 
    });
  }
});

// GET /api/referentiels/:refId/content - Get referentiel content
router.get('/referentiels/:refId/content', async (req, res) => {
  try {
    const { refId } = req.params;
    
    // Décodage de l'ID pour gérer les caractères spéciaux
    const decodedRefId = decodeURIComponent(refId);
    
    console.log(`Trying to get referentiel with ID: ${decodedRefId}`);
    
    // Get the referentiel
    const referentiel = getReferentielById(decodedRefId);
    if (!referentiel) {
      console.error(`Referentiel with ID ${decodedRefId} not found`);
      
      // Récupérer tous les référentiels pour le débogage
      const allReferentiels = getAllReferentiels();
      console.log(`Available referentiels: ${allReferentiels.map(ref => ref.id).join(', ')}`);
      
      return res.status(404).json({ 
        success: false, 
        error: `Referentiel with ID ${decodedRefId} not found` 
      });
    }
    
    console.log(`Found referentiel: ${referentiel.filename}, content length: ${referentiel.content ? referentiel.content.length : 0}`);
    
    return res.status(200).json({ 
      success: true, 
      data: { content: referentiel.content || 'Contenu non disponible' } 
    });
  } catch (error) {
    console.error('Error getting referentiel content:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to get referentiel content: ${(error as Error).message}` 
    });
  }
});

// POST /api/export-temp/gift - Export temporary questions in GIFT format
router.post('/export-temp/gift', async (req, res) => {
  try {
    const { docId, questions } = req.body;
    
    if (!docId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Document ID is required' 
      });
    }
    
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(200).json({ 
        success: false, 
        error: `Aucune question à exporter. Veuillez générer des questions avant d'exporter.` 
      });
    }
    
    // Get the document to use its name for the export file
    const document = getDocumentById(docId);
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        error: `Document with ID ${docId} not found` 
      });
    }
    
    // Generate GIFT format
    const giftContent = exportGift(questions);
    
    // Create a clean filename based on the document name
    const cleanFilename = document.filename
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace special chars with underscore
      .substring(0, 50); // Limit length
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=${cleanFilename}_gift.txt`);
    
    // Send the GIFT content
    res.send(giftContent);
  } catch (error) {
    console.error('Error exporting temporary questions to GIFT:', error);
    res.status(500).json({ 
      success: false, 
      error: `Failed to export questions: ${(error as Error).message}` 
    });
  }
});

// POST /api/export-temp/moodlexml - Export temporary questions in Moodle XML format
router.post('/export-temp/moodlexml', async (req, res) => {
  try {
    const { docId, questions } = req.body;
    
    if (!docId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Document ID is required' 
      });
    }
    
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(200).json({ 
        success: false, 
        error: `Aucune question à exporter. Veuillez générer des questions avant d'exporter.` 
      });
    }
    
    // Get the document to use its name for the export file
    const document = getDocumentById(docId);
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        error: `Document with ID ${docId} not found` 
      });
    }
    
    // Generate Moodle XML format
    const xmlContent = exportMoodleXml(questions);
    
    // Create a clean filename based on the document name
    const cleanFilename = document.filename
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace special chars with underscore
      .substring(0, 50); // Limit length
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename=${cleanFilename}_moodle.xml`);
    
    // Send the XML content
    res.send(xmlContent);
  } catch (error) {
    console.error('Error exporting temporary questions to Moodle XML:', error);
    res.status(500).json({ 
      success: false, 
      error: `Failed to export questions: ${(error as Error).message}` 
    });
  }
});

// POST /api/export-temp/aiken - Export temporary questions in Aiken format
router.post('/export-temp/aiken', async (req, res) => {
  try {
    const { docId, questions } = req.body;
    
    if (!docId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Document ID is required' 
      });
    }
    
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(200).json({ 
        success: false, 
        error: `Aucune question à exporter. Veuillez générer des questions avant d'exporter.` 
      });
    }
    
    // Get the document to use its name for the export file
    const document = getDocumentById(docId);
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        error: `Document with ID ${docId} not found` 
      });
    }
    
    // Generate Aiken format
    const aikenContent = exportAiken(questions);
    
    // Create a clean filename based on the document name
    const cleanFilename = document.filename
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace special chars with underscore
      .substring(0, 50); // Limit length
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=${cleanFilename}_aiken.txt`);
    
    // Send the Aiken content
    res.send(aikenContent);
  } catch (error) {
    console.error('Error exporting temporary questions to Aiken:', error);
    res.status(500).json({ 
      success: false, 
      error: `Failed to export questions: ${(error as Error).message}` 
    });
  }
});

// POST /api/export-temp/pdf - Export temporary questions in PDF format
router.post('/export-temp/pdf', async (req, res) => {
  try {
    const { docId, questions } = req.body;
    
    if (!docId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Document ID is required' 
      });
    }
    
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(200).json({ 
        success: false, 
        error: `Aucune question à exporter. Veuillez générer des questions avant d'exporter.` 
      });
    }
    
    // Get the document to use its name for the export file
    const document = getDocumentById(docId);
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        error: `Document with ID ${docId} not found` 
      });
    }
    
    // Generate PDF
    const pdfBuffer = await exportPdf(questions);
    
    // Create a clean filename based on the document name
    const cleanFilename = document.filename
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace special chars with underscore
      .substring(0, 50); // Limit length
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${cleanFilename}_questions.pdf`);
    
    // Send the PDF content
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error exporting temporary questions to PDF:', error);
    res.status(500).json({ 
      success: false, 
      error: `Failed to export questions: ${(error as Error).message}` 
    });
  }
});

// POST /api/clear-questions - Clear all questions from the database
router.post('/clear-questions', async (req, res) => {
  try {
    // Clear all questions from the database
    db.prepare('DELETE FROM questions').run();
    
    console.log('All questions have been cleared from the database');
    
    return res.status(200).json({ 
      success: true, 
      message: 'All questions have been cleared from the database' 
    });
  } catch (error) {
    console.error('Error clearing questions:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to clear questions: ${(error as Error).message}` 
    });
  }
});

export default router;
