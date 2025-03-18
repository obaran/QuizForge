import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Interfaces pour les types de données
export interface DbDocument {
  id: string;
  filename: string;
  content: string;
  createdAt: string;
}

export interface DbQuestion {
  id: string;
  docId: string;
  content: string;
  validated: boolean;
  createdAt: string;
}

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');

// Initialize the database connection
export const db = new Database(dbPath);

// Initialize the database schema
export function initializeDatabase(): void {
  console.log(`Initializing database at ${dbPath}`);
  
  // Create documents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);

  // Create questions table
  db.exec(`
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
export function getDocumentById(id: string): DbDocument | undefined {
  const result = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  return result as DbDocument | undefined;
}

// Helper function to get questions by document ID
export function getQuestionsByDocId(docId: string): DbQuestion[] {
  try {
    const result = db.prepare('SELECT * FROM questions WHERE docId = ?').all(docId);
    return result as DbQuestion[];
  } catch (error) {
    console.error('Error in getQuestionsByDocId:', error);
    return [];
  }
}

// Helper function to insert a document
export function insertDocument(id: string, filename: string, content: string): void {
  const createdAt = new Date().toISOString();
  db.prepare('INSERT INTO documents (id, filename, content, createdAt) VALUES (?, ?, ?, ?)').run(id, filename, content, createdAt);
}

// Helper function to insert a question
export function insertQuestion(id: string, docId: string, content: string | object): void {
  try {
    const createdAt = new Date().toISOString();
    // Ensure content is a string
    const contentString = typeof content === 'string' ? content : JSON.stringify(content);
    
    // Log the content string for debugging
    console.log('Inserting question with content:', contentString.substring(0, 100) + '...');
    
    db.prepare('INSERT INTO questions (id, docId, content, validated, createdAt) VALUES (?, ?, ?, ?, ?)').run(id, docId, contentString, 0, createdAt);
  } catch (error) {
    console.error('Error in insertQuestion:', error);
    throw error;
  }
}

// Helper function to update a question
export function updateQuestion(id: string, content: string | object, validated: boolean): void {
  try {
    // Ensure content is a string
    const contentString = typeof content === 'string' ? content : JSON.stringify(content);
    
    // Convert boolean to integer for SQLite
    const validatedValue = validated ? 1 : 0;
    
    db.prepare('UPDATE questions SET content = ?, validated = ? WHERE id = ?').run(contentString, validatedValue, id);
  } catch (error) {
    console.error('Error in updateQuestion:', error);
    throw error;
  }
}

// Helper function to get validated questions
export function getValidatedQuestions(): DbQuestion[] {
  try {
    const result = db.prepare('SELECT * FROM questions WHERE validated = 1').all();
    return result as DbQuestion[];
  } catch (error) {
    console.error('Error in getValidatedQuestions:', error);
    return [];
  }
}

// Helper function to get all questions
export function getAllQuestions(): DbQuestion[] {
  try {
    const result = db.prepare('SELECT * FROM questions').all();
    return result as DbQuestion[];
  } catch (error) {
    console.error('Error in getAllQuestions:', error);
    return [];
  }
}
