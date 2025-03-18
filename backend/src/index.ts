import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import quizRoutes from './routes/quizRoutes';
import { initializeDatabase } from './utils/db';

// Load environment variables
dotenv.config();

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
