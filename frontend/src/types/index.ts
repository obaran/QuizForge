// Document types
export interface Document {
  id: string;
  filename: string;
  content: string;
  createdAt: string;
}

// Referentiel types
export interface Referentiel {
  id: string;
  filename: string;
  content: string;
  createdAt: string;
}

// Question types
export type QuestionType = 'qcm_simple' | 'qcm_multiple' | 'association';
export type TestMode = 'admission' | 'niveau' | 'final';
export type Difficulty = 'debutant' | 'intermediaire' | 'avance';

export interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  docId: string;
  text: string;
  questionType: QuestionType;
  testMode: TestMode;
  difficulty: Difficulty;
  answers: Answer[];
  validated: boolean;
  createdAt: string;
}

// Request types
export interface GenerateQuestionsRequest {
  docId: string;
  questionType: QuestionType;
  testMode: TestMode;
  difficulty: Difficulty;
  numberOfQuestions?: number;
  refId?: string; // ID du référentiel à utiliser comme guide (optionnel)
}

export interface SaveValidatedQuestionsRequest {
  docId: string;
  questions: Question[];
}

export interface UpdateQuestionRequest {
  text?: string;
  answers?: Answer[];
  validated?: boolean;
}

// Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UploadResponse {
  docId: string;
  filename: string;
  createdAt: string;
}

export interface ReferentielResponse {
  refId: string;
  filename: string;
  createdAt: string;
}

export interface GenerateQuestionsResponse {
  questions: Question[];
}

// Export formats
export type ExportFormat = 'gift' | 'moodlexml' | 'aiken' | 'pdf';
