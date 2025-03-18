import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import quizRoutes from './routes/quizRoutes';
import { initializeDatabase } from './utils/db';

// Load environment variables from .env file in the backend directory
// This needs to be at the very top before any other code executes
const envPath = path.resolve(__dirname, '../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log(`Loaded environment variables from: ${envPath}`);
}

// Set default values for development
if (process.env.NODE_ENV === undefined) {
  process.env.NODE_ENV = 'development';
}

if (process.env.USE_FALLBACK_QUESTIONS === undefined) {
  process.env.USE_FALLBACK_QUESTIONS = 'false';
}

// Log loaded environment variables (without sensitive values)
console.log('Environment configuration:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('USE_FALLBACK_QUESTIONS:', process.env.USE_FALLBACK_QUESTIONS);
console.log('AZURE_OPENAI_ENDPOINT is set:', !!process.env.AZURE_OPENAI_ENDPOINT);
console.log('AZURE_OPENAI_DEPLOYMENT_NAME is set:', !!process.env.AZURE_OPENAI_DEPLOYMENT_NAME);
console.log('AZURE_OPENAI_KEY is set:', !!process.env.AZURE_OPENAI_KEY);

// Initialize the database
initializeDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', quizRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API endpoints: http://localhost:${PORT}/api/...`);
});

export default app;
