import axios from 'axios';
import { 
  ApiResponse, 
  UploadResponse, 
  GenerateQuestionsRequest, 
  GenerateQuestionsResponse, 
  Question,
  UpdateQuestionRequest,
  ExportFormat,
  ReferentielResponse
} from '../types';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
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

// Upload referentiel
export const uploadReferentiel = async (file: File): Promise<ApiResponse<ReferentielResponse>> => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await api.post<ApiResponse<ReferentielResponse>>('/upload-referentiel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data as ApiResponse<ReferentielResponse>;
    }
    return {
      success: false,
      error: 'Network error or server unavailable',
    };
  }
};

// Get all referentiels
export const getReferentiels = async (): Promise<ApiResponse<{ referentiels: ReferentielResponse[] }>> => {
  try {
    const response = await api.get<ApiResponse<{ referentiels: ReferentielResponse[] }>>(
      '/referentiels'
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data as ApiResponse<{ referentiels: ReferentielResponse[] }>;
    }
    return {
      success: false,
      error: 'Network error or server unavailable',
    };
  }
};

// Get all documents
export const getDocuments = async (): Promise<ApiResponse<{ documents: UploadResponse[] }>> => {
  try {
    const response = await api.get<ApiResponse<{ documents: UploadResponse[] }>>(
      '/documents'
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data as ApiResponse<{ documents: UploadResponse[] }>;
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
      '/generate-questions-temp',
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

// Sauvegarder les questions validées en base de données
export const saveValidatedQuestions = async (
  docId: string,
  questions: Question[]
): Promise<ApiResponse<{ questions: Question[] }>> => {
  try {
    const response = await api.post<ApiResponse<{ questions: Question[] }>>(
      '/save-validated-questions',
      { docId, questions }
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
export const exportQuestions = (format: ExportFormat, docId: string): string => {
  return `${api.defaults.baseURL}/export/${format}/${docId}`;
};

// Export temporary questions in specified format
export const exportTempQuestions = async (
  format: ExportFormat, 
  docId: string, 
  questions: Question[]
): Promise<Blob> => {
  try {
    const response = await api.post(
      `/export-temp/${format}`,
      { docId, questions },
      { responseType: 'blob' }
    );
    return response.data;
  } catch (error) {
    console.error(`Error exporting questions in ${format} format:`, error);
    throw error;
  }
};

// Clear all questions from the database
export const clearAllQuestions = async (): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response = await api.post<ApiResponse<{ success: boolean }>>(
      '/clear-questions'
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data as ApiResponse<{ success: boolean }>;
    }
    return {
      success: false,
      error: 'Network error or server unavailable',
    };
  }
};

// Delete document
export const deleteDocument = async (docId: string): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response = await api.delete<ApiResponse<{ success: boolean }>>(
      `/documents/${docId}`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data as ApiResponse<{ success: boolean }>;
    }
    return {
      success: false,
      error: 'Network error or server unavailable',
    };
  }
};

// Delete referentiel
export const deleteReferentiel = async (refId: string): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response = await api.delete<ApiResponse<{ success: boolean }>>(
      `/referentiels/${refId}`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data as ApiResponse<{ success: boolean }>;
    }
    return {
      success: false,
      error: 'Network error or server unavailable',
    };
  }
};

// Get document content
export const getDocumentContent = async (docId: string): Promise<ApiResponse<{ content: string }>> => {
  try {
    const response = await api.get<ApiResponse<{ content: string }>>(
      `/documents/${docId}/content`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data as ApiResponse<{ content: string }>;
    }
    return {
      success: false,
      error: 'Network error or server unavailable',
    };
  }
};

// Get referentiel content
export const getReferentielContent = async (refId: string): Promise<ApiResponse<{ content: string }>> => {
  try {
    const response = await api.get<ApiResponse<{ content: string }>>(
      `/referentiels/${refId}/content`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data as ApiResponse<{ content: string }>;
    }
    return {
      success: false,
      error: 'Network error or server unavailable',
    };
  }
};

export default api;
