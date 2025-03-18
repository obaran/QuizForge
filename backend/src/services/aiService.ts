import axios from 'axios';
import { Question, QuestionType, TestMode, Difficulty, Answer } from '../models/types';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'path';

// Reload environment variables directly in this file to ensure they are available
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Azure OpenAI Configuration
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const AZURE_OPENAI_API_VERSION = '2023-05-15'; // Azure OpenAI API version

// Log environment variables (without sensitive values)
console.log('aiService - Environment variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('USE_FALLBACK_QUESTIONS:', process.env.USE_FALLBACK_QUESTIONS);
console.log('AZURE_OPENAI_ENDPOINT:', AZURE_OPENAI_ENDPOINT);
console.log('AZURE_OPENAI_DEPLOYMENT_NAME:', AZURE_OPENAI_DEPLOYMENT_NAME);
console.log('AZURE_OPENAI_KEY is set:', !!AZURE_OPENAI_KEY);

/**
 * Generate a prompt for the AI based on document content and question parameters
 */
function generatePrompt(
  documentContent: string,
  questionType: QuestionType,
  testMode: TestMode,
  difficulty: Difficulty
): string {
  // Truncate document content if it's too long
  const maxContentLength = 20000;
  const truncatedContent = documentContent.length > maxContentLength
    ? documentContent.substring(0, maxContentLength) + '...'
    : documentContent;

  // Add a note about potential missing image content
  const imageNote = "Note: Le document original peut contenir des images qui n'ont pas été incluses dans ce texte. Les questions doivent être basées uniquement sur le contenu textuel fourni.";

  // Create a prompt for the AI based on the parameters
  return `
You are an expert quiz creator. Your task is to create quiz questions based on the following document content.

Document content:
"""
${truncatedContent}
"""

${imageNote}

Please create quiz questions with the following parameters:
- Question type: ${questionType} (${getQuestionTypeDescription(questionType)})
- Test mode: ${testMode} (${getTestModeDescription(testMode)})
- Difficulty level: ${difficulty} (${getDifficultyDescription(difficulty)})

For each question:
1. Create a clear and concise question text
2. Provide multiple answer options (at least 4 for QCM)
3. Indicate which answer(s) is/are correct
4. Ensure the questions are appropriate for the specified difficulty level

Format your response as a JSON array of questions, with each question having the following structure:
[
  {
    "text": "Question text here",
    "answers": [
      { "text": "Answer option 1", "isCorrect": true/false },
      { "text": "Answer option 2", "isCorrect": true/false },
      ...
    ]
  },
  ...
]

Generate 5 questions that are diverse and cover different aspects of the document content.
`;
}

/**
 * Get a description of the question type
 */
function getQuestionTypeDescription(questionType: QuestionType): string {
  switch (questionType) {
    case 'qcm_simple':
      return 'Multiple choice question with a single correct answer';
    case 'qcm_multiple':
      return 'Multiple choice question with multiple correct answers';
    case 'association':
      return 'Matching items from two columns';
    default:
      return 'Unknown question type';
  }
}

/**
 * Get a description of the test mode
 */
function getTestModeDescription(testMode: TestMode): string {
  switch (testMode) {
    case 'admission':
      return 'Entry-level assessment to determine basic knowledge';
    case 'niveau':
      return 'Assessment to determine current knowledge level';
    case 'final':
      return 'Final assessment to evaluate comprehensive understanding';
    default:
      return 'Unknown test mode';
  }
}

/**
 * Get a description of the difficulty level
 */
function getDifficultyDescription(difficulty: Difficulty): string {
  switch (difficulty) {
    case 'debutant':
      return 'Basic concepts and fundamental knowledge';
    case 'intermediaire':
      return 'Intermediate concepts requiring deeper understanding';
    case 'avance':
      return 'Advanced concepts requiring comprehensive knowledge';
    default:
      return 'Unknown difficulty level';
  }
}

/**
 * Generate fallback questions for testing purposes
 */
function generateFallbackQuestions(
  docId: string,
  questionType: QuestionType,
  testMode: TestMode,
  difficulty: Difficulty
): Question[] {
  console.log('Using fallback questions for testing');
  
  // Create a set of fallback questions for testing
  const questions: Question[] = [];
  
  for (let i = 1; i <= 5; i++) {
    const questionId = uuidv4();
    const answers: Answer[] = [];
    
    // Generate 4 answers, making the first one correct
    for (let j = 1; j <= 4; j++) {
      answers.push({
        id: uuidv4(),
        text: `Réponse ${j} pour la question ${i}`,
        isCorrect: j === 1 // First answer is correct
      });
    }
    
    questions.push({
      id: questionId,
      docId,
      text: `Question de test ${i} pour le document ${docId}`,
      questionType,
      testMode,
      difficulty,
      answers,
      validated: false,
      createdAt: new Date().toISOString()
    });
  }
  
  return questions;
}

/**
 * Call the Azure OpenAI API to generate questions
 */
export async function generateQuestions(
  docId: string,
  documentContent: string,
  questionType: QuestionType,
  testMode: TestMode,
  difficulty: Difficulty
): Promise<Question[]> {
  try {
    // Check if we're in development mode and should use fallback questions
    console.log('Checking if fallback questions should be used:');
    console.log('NODE_ENV === development:', process.env.NODE_ENV === 'development');
    console.log('USE_FALLBACK_QUESTIONS === true:', process.env.USE_FALLBACK_QUESTIONS === 'true');
    console.log('Combined condition:', process.env.NODE_ENV === 'development' && process.env.USE_FALLBACK_QUESTIONS === 'true');
    
    if (process.env.NODE_ENV === 'development' && process.env.USE_FALLBACK_QUESTIONS === 'true') {
      console.log('Using fallback questions due to environment configuration');
      return generateFallbackQuestions(docId, questionType, testMode, difficulty);
    }
    
    if (!AZURE_OPENAI_KEY || !AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_DEPLOYMENT_NAME) {
      console.error('Azure OpenAI configuration is not complete');
      console.error('AZURE_OPENAI_KEY is set:', !!AZURE_OPENAI_KEY);
      console.error('AZURE_OPENAI_ENDPOINT is set:', !!AZURE_OPENAI_ENDPOINT);
      console.error('AZURE_OPENAI_DEPLOYMENT_NAME is set:', !!AZURE_OPENAI_DEPLOYMENT_NAME);
      throw new Error('Azure OpenAI configuration is not complete');
    }

    console.log(`Generating questions for document ${docId} with type ${questionType}, mode ${testMode}, difficulty ${difficulty}`);
    console.log('Using Azure OpenAI API with the following configuration:');
    console.log('AZURE_OPENAI_ENDPOINT:', AZURE_OPENAI_ENDPOINT);
    console.log('AZURE_OPENAI_DEPLOYMENT_NAME:', AZURE_OPENAI_DEPLOYMENT_NAME);
    console.log('AZURE_OPENAI_API_VERSION:', AZURE_OPENAI_API_VERSION);
    
    const prompt = generatePrompt(documentContent, questionType, testMode, difficulty);

    // Add retry logic for Azure OpenAI API
    let retries = 0;
    const maxRetries = 3;
    let lastError: Error | null = null;

    while (retries < maxRetries) {
      try {
        console.log(`Calling Azure OpenAI API (attempt ${retries + 1}/${maxRetries})...`);
        
        // Construct the Azure OpenAI API URL
        const apiUrl = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;
        
        // Call the Azure OpenAI API
        const response = await axios.post(
          apiUrl,
          {
            messages: [
              {
                role: 'system',
                content: 'You are an expert quiz creator that generates questions based on document content.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 4000
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'api-key': AZURE_OPENAI_KEY
            },
            timeout: 60000 // 60 seconds timeout
          }
        );

        console.log('Azure OpenAI API response received');
        console.log('Response status:', response.status);
        console.log('Response data structure:', Object.keys(response.data));
        
        // Extract the generated questions from the response
        if (!response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
          console.error('Unexpected Azure OpenAI API response structure:', JSON.stringify(response.data, null, 2));
          // Use fallback questions instead of throwing an error
          return generateFallbackQuestions(docId, questionType, testMode, difficulty);
        }
        
        const assistantMessage = response.data.choices[0].message.content;
        console.log('Assistant message:', assistantMessage);
        
        // Extract JSON from the response (it might be wrapped in markdown code blocks)
        const jsonMatch = assistantMessage.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          console.error('Failed to extract valid JSON from Azure OpenAI response');
          // Use fallback questions instead of throwing an error
          return generateFallbackQuestions(docId, questionType, testMode, difficulty);
        }
        
        const jsonString = jsonMatch[0];
        console.log('Extracted JSON string:', jsonString);
        
        let rawQuestions;
        try {
          rawQuestions = JSON.parse(jsonString);
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
          // Use fallback questions instead of throwing an error
          return generateFallbackQuestions(docId, questionType, testMode, difficulty);
        }
        
        console.log('Parsed questions:', rawQuestions);

        // Format the questions according to our model
        const questions: Question[] = rawQuestions.map((q: any) => ({
          id: uuidv4(),
          docId,
          text: q.text,
          questionType,
          testMode,
          difficulty,
          answers: q.answers.map((a: any) => ({
            id: uuidv4(),
            text: a.text,
            isCorrect: Boolean(a.isCorrect) // Ensure isCorrect is a boolean
          })),
          validated: false,
          createdAt: new Date().toISOString()
        }));

        console.log(`Generated ${questions.length} questions successfully`);
        return questions;
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${retries + 1}/${maxRetries} failed:`, error);
        
        // If we get a rate limit error (429) or server error (5xx), wait and retry
        if (axios.isAxiosError(error) && error.response) {
          console.error('API error details:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          });
          
          if (error.response.status === 429 || error.response.status >= 500) {
            retries++;
            if (retries < maxRetries) {
              // Exponential backoff: wait longer between each retry
              const waitTime = Math.pow(2, retries) * 1000; // 2s, 4s, 8s, ...
              console.log(`Waiting ${waitTime}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          } else {
            // For other errors, don't retry
            break;
          }
        } else {
          // For non-Axios errors, don't retry
          break;
        }
      }
    }

    // If we've exhausted all retries or encountered a non-retryable error
    console.error('Failed to generate questions after multiple attempts, using fallback questions');
    return generateFallbackQuestions(docId, questionType, testMode, difficulty);
  } catch (error) {
    console.error('Error generating questions:', error);
    // Use fallback questions instead of throwing an error
    return generateFallbackQuestions(docId, questionType, testMode, difficulty);
  }
}
