// API 응답/요청 타입
export interface RecommendRequest {
  word: string;
  context: string[];
}

export interface RecommendResponse {
  recommendations: string[];
}

export interface GenerateRequest {
  words: string[];
}

export interface GenerateResponse {
  sentence: string;
}

export interface TTSRequest {
  text: string;
}

export interface InitialWordsResponse {
  words: string[];
}

export interface APIError {
  detail: string;
}

// Error types for better error handling
export const ErrorType = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  FAISS_ERROR: 'FAISS_ERROR',
  OLLAMA_ERROR: 'OLLAMA_ERROR',
  TTS_ERROR: 'TTS_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorType = typeof ErrorType[keyof typeof ErrorType];

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: unknown;
}
