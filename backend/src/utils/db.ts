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

export interface DbReferentiel {
  id: string;
  filename: string;
  content: string;
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

  // Create referentiels table
  db.exec(`
    CREATE TABLE IF NOT EXISTS referentiels (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL
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
export function insertQuestion(question: {
  id: string;
  docId: string;
  content: string;
  validated: boolean;
  createdAt: string;
}): void {
  try {
    // Ensure content is a string
    const contentString = typeof question.content === 'string' ? question.content : JSON.stringify(question.content);
    
    // Convert boolean to integer for SQLite
    const validatedValue = question.validated ? 1 : 0;
    
    // Log the content string for debugging
    console.log('Inserting question with content:', contentString.substring(0, 100) + '...');
    
    db.prepare('INSERT INTO questions (id, docId, content, validated, createdAt) VALUES (?, ?, ?, ?, ?)').run(
      question.id, 
      question.docId, 
      contentString, 
      validatedValue, 
      question.createdAt
    );
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

// Helper function to get validated questions for a specific document
export function getValidatedQuestionsByDocId(docId: string): DbQuestion[] {
  try {
    console.log(`Recherche des questions validées pour le document ID: ${docId}`);
    
    // Décodage de l'ID pour gérer les caractères spéciaux
    const decodedDocId = decodeURIComponent(docId);
    console.log(`ID décodé: ${decodedDocId}`);
    
    // Ne retourner que les questions validées pour ce document
    const result = db.prepare('SELECT * FROM questions WHERE docId = ? AND validated = TRUE').all(decodedDocId);
    console.log(`Nombre de questions validées trouvées: ${result.length}`);
    
    if (result.length === 0) {
      // Si aucune question validée n'est trouvée, vérifier si le document existe
      const document = db.prepare('SELECT id FROM documents WHERE id = ?').get(decodedDocId);
      console.log(`Document trouvé: ${document ? 'Oui' : 'Non'}`);
      
      // Vérifier si des questions non validées existent pour ce document
      const nonValidatedQuestions = db.prepare('SELECT COUNT(*) as count FROM questions WHERE docId = ?').get(decodedDocId);
      console.log(`Nombre de questions non validées pour ce document: ${nonValidatedQuestions ? (nonValidatedQuestions as { count: number }).count : 0}`);
    }
    
    return result as DbQuestion[];
  } catch (error) {
    console.error('Error in getValidatedQuestionsByDocId:', error);
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

// Helper function to insert a referentiel
export function insertReferentiel(id: string, filename: string, content: string): void {
  const createdAt = new Date().toISOString();
  db.prepare('INSERT INTO referentiels (id, filename, content, createdAt) VALUES (?, ?, ?, ?)').run(id, filename, content, createdAt);
}

// Helper function to get all referentiels
export function getAllReferentiels(): DbReferentiel[] {
  try {
    const result = db.prepare('SELECT * FROM referentiels').all();
    return result as DbReferentiel[];
  } catch (error) {
    console.error('Error in getAllReferentiels:', error);
    return [];
  }
}

// Helper function to get a referentiel by ID
export function getReferentielById(id: string): DbReferentiel | undefined {
  const result = db.prepare('SELECT * FROM referentiels WHERE id = ?').get(id);
  return result as DbReferentiel | undefined;
}

/**
 * Get all documents from the database
 * @returns Array of documents
 */
export function getAllDocuments(): DbDocument[] {
  try {
    const stmt = db.prepare('SELECT * FROM documents ORDER BY createdAt DESC');
    return stmt.all() as DbDocument[];
  } catch (error) {
    console.error('Error getting all documents:', error);
    return [];
  }
}

/**
 * Remove duplicate documents from the database
 * Documents are considered duplicates if they have the same filename
 * Keep only the most recent version of each document
 * @returns Number of duplicates removed
 */
export function removeDuplicateDocuments(): number {
  try {
    // Start a transaction
    db.prepare('BEGIN').run();
    
    // Find all duplicate filenames
    const duplicates = db.prepare(`
      SELECT filename, COUNT(*) as count
      FROM documents
      GROUP BY filename
      HAVING count > 1
    `).all() as { filename: string; count: number }[];
    
    let removedCount = 0;
    
    // For each duplicate filename
    for (const dup of duplicates) {
      // Get all documents with this filename, ordered by creation date (newest first)
      const docs = db.prepare(`
        SELECT id, filename, createdAt
        FROM documents
        WHERE filename = ?
        ORDER BY createdAt DESC
      `).all(dup.filename) as { id: string; filename: string; createdAt: string }[];
      
      // Keep the first one (newest), delete the rest
      for (let i = 1; i < docs.length; i++) {
        db.prepare('DELETE FROM documents WHERE id = ?').run(docs[i].id);
        removedCount++;
      }
    }
    
    // Commit the transaction
    db.prepare('COMMIT').run();
    
    console.log(`Removed ${removedCount} duplicate documents`);
    return removedCount;
  } catch (error) {
    // Rollback in case of error
    db.prepare('ROLLBACK').run();
    console.error('Error removing duplicate documents:', error);
    return 0;
  }
}
