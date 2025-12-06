import axios, { AxiosError } from 'axios';
import type {
  RecommendRequest,
  RecommendResponse,
  GenerateRequest,
  GenerateResponse,
  TTSRequest,
  InitialWordsResponse,
  APIError,
  AppError,
} from '../types/api';
import { ErrorType } from '../types/api';

// 개발환경: localhost:8000, 프로덕션(도커): 상대경로 (nginx 프록시)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Error handling utility functions
export const handleAPIError = (error: unknown): AppError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<APIError>;
    
    // Network error (server unreachable)
    if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ERR_NETWORK') {
      return {
        type: ErrorType.NETWORK_ERROR,
        message: '서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.',
        originalError: error,
      };
    }
    
    // Timeout error
    if (axiosError.code === 'ECONNABORTED') {
      return {
        type: ErrorType.NETWORK_ERROR,
        message: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
        originalError: error,
      };
    }
    
    // Server responded with error
    if (axiosError.response) {
      const status = axiosError.response.status;
      const detail = axiosError.response.data?.detail || '알 수 없는 오류가 발생했습니다.';
      
      // Determine error type based on endpoint and status
      if (status === 500) {
        // Check error message to determine specific service error
        if (detail.includes('FAISS') || detail.includes('recommend')) {
          return {
            type: ErrorType.FAISS_ERROR,
            message: '단어 추천 중 오류가 발생했습니다.',
            originalError: error,
          };
        } else if (detail.includes('Ollama') || detail.includes('generate')) {
          return {
            type: ErrorType.OLLAMA_ERROR,
            message: 'Ollama 서비스에 연결할 수 없습니다. localhost:11434에서 Ollama가 실행 중인지 확인해주세요.',
            originalError: error,
          };
        } else if (detail.includes('TTS') || detail.includes('audio')) {
          return {
            type: ErrorType.TTS_ERROR,
            message: '음성 생성 중 오류가 발생했습니다.',
            originalError: error,
          };
        }
        
        return {
          type: ErrorType.SERVER_ERROR,
          message: `서버 오류: ${detail}`,
          originalError: error,
        };
      }
      
      return {
        type: ErrorType.SERVER_ERROR,
        message: detail,
        originalError: error,
      };
    }
  }
  
  // Unknown error
  return {
    type: ErrorType.UNKNOWN_ERROR,
    message: '알 수 없는 오류가 발생했습니다.',
    originalError: error,
  };
};

// Retry utility function
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 2,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx) or last attempt
      if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }
  
  throw lastError;
};

// API client functions with error handling
export const getInitialWords = async (): Promise<string[]> => {
  try {
    const response = await apiClient.get<InitialWordsResponse>('/api/initial-words');
    return response.data.words;
  } catch (error) {
    throw handleAPIError(error);
  }
};

export const recommendWords = async (
  word: string,
  context: string[] = []
): Promise<string[]> => {
  try {
    const response = await apiClient.post<RecommendResponse>('/api/recommend', {
      word,
      context,
    } as RecommendRequest);
    return response.data.recommendations;
  } catch (error) {
    throw handleAPIError(error);
  }
};

export const recommendDiverseWords = async (
  context: string[] = [],
  excludeWords: string[] = []
): Promise<string[]> => {
  try {
    const response = await apiClient.post<RecommendResponse>('/api/recommend-diverse', {
      context,
      exclude_words: excludeWords,
    });
    return response.data.recommendations;
  } catch (error) {
    throw handleAPIError(error);
  }
};

export const generateSentence = async (words: string[]): Promise<string> => {
  try {
    const response = await apiClient.post<GenerateResponse>('/api/generate', {
      words,
    } as GenerateRequest);
    return response.data.sentence;
  } catch (error) {
    throw handleAPIError(error);
  }
};

export const textToSpeech = async (text: string): Promise<Blob> => {
  try {
    const response = await apiClient.post<Blob>(
      '/api/tts',
      { text } as TTSRequest,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  } catch (error) {
    throw handleAPIError(error);
  }
};

// Helper function to play audio from blob
export const playAudioBlob = (blob: Blob): void => {
  const audioUrl = URL.createObjectURL(blob);
  const audio = new Audio(audioUrl);
  
  audio.play().catch((error) => {
    console.error('Audio playback failed:', error);
    throw handleAPIError(error);
  });
  
  // Clean up the URL after playback
  audio.addEventListener('ended', () => {
    URL.revokeObjectURL(audioUrl);
  });
};
