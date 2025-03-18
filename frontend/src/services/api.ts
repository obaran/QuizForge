import axios from 'axios';
import { 
  ApiResponse, 
  UploadResponse, 
  GenerateQuestionsRequest, 
  GenerateQuestionsResponse, 
  Question,
  UpdateQuestionRequest,
  ExportFormat
} from '../types';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Upload document
export const uploadDocument = async (file: File): Promise<ApiResponse<UploadResponse>> => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await api.post<ApiResponse<UploadResponse>>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data as ApiResponse<UploadResponse>;
    }
    return {
      success: false,
      error: 'Network error or server unavailable',
    };
  }
};

// Generate questions
export const generateQuestions = async (
  params: GenerateQuestionsRequest
): Promise<ApiResponse<GenerateQuestionsResponse>> => {
  try {
    const response = await api.post<ApiResponse<GenerateQuestionsResponse>>(
      '/generate-questions',
      params
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data as ApiResponse<GenerateQuestionsResponse>;
    }
    return {
      success: false,
      error: 'Network error or server unavailable',
    };
  }
};

// Get questions by document ID
export const getQuestionsByDocId = async (
  docId: string
): Promise<ApiResponse<{ questions: Question[] }>> => {
  try {
    const response = await api.get<ApiResponse<{ questions: Question[] }>>(
      `/questions/${docId}`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data as ApiResponse<{ questions: Question[] }>;
    }
    return {
      success: false,
      error: 'Network error or server unavailable',
    };
  }
};

// Update question
export const updateQuestion = async (
  questionId: string,
  updateData: UpdateQuestionRequest
): Promise<ApiResponse<{ question: Question }>> => {
  try {
    const response = await api.put<ApiResponse<{ question: Question }>>(
      `/questions/${questionId}`,
      updateData
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data as ApiResponse<{ question: Question }>;
    }
    return {
      success: false,
      error: 'Network error or server unavailable',
    };
  }
};

// Export questions in specified format
export const exportQuestions = (format: ExportFormat): string => {
  return `${api.defaults.baseURL}/export/${format}`;
};

export default api;
