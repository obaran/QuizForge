"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.initializeDatabase = initializeDatabase;
exports.getDocumentById = getDocumentById;
exports.getQuestionsByDocId = getQuestionsByDocId;
exports.insertDocument = insertDocument;
exports.insertQuestion = insertQuestion;
exports.updateQuestion = updateQuestion;
exports.getValidatedQuestions = getValidatedQuestions;
exports.getAllQuestions = getAllQuestions;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const dbPath = process.env.DB_PATH || path_1.default.join(__dirname, '../../database.sqlite');
// Initialize the database connection
exports.db = new better_sqlite3_1.default(dbPath);
// Initialize the database schema
function initializeDatabase() {
    console.log(`Initializing database at ${dbPath}`);
    // Create documents table
    exports.db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);
    // Create questions table
    exports.db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      docId TEXT NOT NULL,
      content TEXT NOT NULL,
      validated BOOLEAN DEFAULT FALSE,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (docId) REFERENCES documents(id)
    )
  `);
    console.log('Database initialized successfully');
}
// Helper function to get a document by ID
function getDocumentById(id) {
    const result = exports.db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    return result;
}
// Helper function to get questions by document ID
function getQuestionsByDocId(docId) {
    try {
        const result = exports.db.prepare('SELECT * FROM questions WHERE docId = ?').all(docId);
        return result;
    }
    catch (error) {
        console.error('Error in getQuestionsByDocId:', error);
        return [];
    }
}
// Helper function to insert a document
function insertDocument(id, filename, content) {
    const createdAt = new Date().toISOString();
    exports.db.prepare('INSERT INTO documents (id, filename, content, createdAt) VALUES (?, ?, ?, ?)').run(id, filename, content, createdAt);
}
// Helper function to insert a question
function insertQuestion(id, docId, content) {
    try {
        const createdAt = new Date().toISOString();
        // Ensure content is a string
        const contentString = typeof content === 'string' ? content : JSON.stringify(content);
        // Log the content string for debugging
        console.log('Inserting question with content:', contentString.substring(0, 100) + '...');
        exports.db.prepare('INSERT INTO questions (id, docId, content, validated, createdAt) VALUES (?, ?, ?, ?, ?)').run(id, docId, contentString, 0, createdAt);
    }
    catch (error) {
        console.error('Error in insertQuestion:', error);
        throw error;
    }
}
// Helper function to update a question
function updateQuestion(id, content, validated) {
    try {
        // Ensure content is a string
        const contentString = typeof content === 'string' ? content : JSON.stringify(content);
        // Convert boolean to integer for SQLite
        const validatedValue = validated ? 1 : 0;
        exports.db.prepare('UPDATE questions SET content = ?, validated = ? WHERE id = ?').run(contentString, validatedValue, id);
    }
    catch (error) {
        console.error('Error in updateQuestion:', error);
        throw error;
    }
}
// Helper function to get validated questions
function getValidatedQuestions() {
    try {
        const result = exports.db.prepare('SELECT * FROM questions WHERE validated = 1').all();
        return result;
    }
    catch (error) {
        console.error('Error in getValidatedQuestions:', error);
        return [];
    }
}
// Helper function to get all questions
function getAllQuestions() {
    try {
        const result = exports.db.prepare('SELECT * FROM questions').all();
        return result;
    }
    catch (error) {
        console.error('Error in getAllQuestions:', error);
        return [];
    }
}
//# sourceMappingURL=db.js.map