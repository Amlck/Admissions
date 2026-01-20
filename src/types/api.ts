/**
 * Gemini API types for the Admission Note Builder
 */

export interface GenerationConfig {
  temperature: number;
  maxOutputTokens: number;
}

export interface GeminiTextPart {
  text: string;
}

export interface GeminiImagePart {
  inlineData: {
    mimeType: string;
    data: string;
  };
}

export type GeminiPart = GeminiTextPart | GeminiImagePart;

export interface GeminiContent {
  parts: GeminiPart[];
}

export interface GeminiRequest {
  contents: GeminiContent[];
  generationConfig: GenerationConfig;
}

export interface GeminiCandidate {
  content: {
    parts: { text?: string }[];
  };
  finishReason?: string;
}

export interface GeminiResponse {
  candidates?: GeminiCandidate[];
  error?: {
    message: string;
    code?: number;
  };
}

export interface ImageData {
  base64: string;
  mimeType: string;
  fileName: string;
}

export interface ParseCallbacks {
  onStatus?: (message: string, type: StatusType) => void;
  onSuccess?: (data: import('./clinical').ClinicalData) => void;
  onError?: (error: Error) => void;
}

export type StatusType = 'loading' | 'success' | 'error';
