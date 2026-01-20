/**
 * Error handling module for the Admission Note Builder
 * Custom error classes and error message utilities
 */

export class AppError extends Error {
  code: string;
  details: Record<string, unknown> | null;
  timestamp: string;

  constructor(message: string, code: string, details: Record<string, unknown> | null = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class ApiError extends AppError {
  statusCode: number;

  constructor(message: string, statusCode: number, response: unknown = null) {
    super(message, 'API_ERROR', { statusCode, response });
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export class NetworkError extends AppError {
  constructor(message: string, originalError: Error | null = null) {
    super(message, 'NETWORK_ERROR', { originalError: originalError?.message });
    this.name = 'NetworkError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field: string | null = null) {
    super(message, 'VALIDATION_ERROR', { field });
    this.name = 'ValidationError';
  }
}

export class StorageError extends AppError {
  constructor(message: string, key: string | null = null) {
    super(message, 'STORAGE_ERROR', { key });
    this.name = 'StorageError';
  }
}

export const ERROR_MESSAGES: Record<number | string, string> = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'Invalid API key. Please check your Gemini API key.',
  403: 'Access denied. Your API key may not have the required permissions.',
  404: 'API endpoint not found. The service may be temporarily unavailable.',
  429: 'Rate limit exceeded. Please wait a moment before trying again.',
  500: 'Server error. The AI service is experiencing issues.',
  502: 'Bad gateway. The AI service is temporarily unavailable.',
  503: 'Service unavailable. Please try again later.',
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  OFFLINE: 'You appear to be offline. Please check your connection.',
  UNKNOWN: 'An unexpected error occurred. Please try again.',
};

const DEFAULT_ERROR = 'An unexpected error occurred. Please try again.';

/**
 * Get a user-friendly error message based on the error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return ERROR_MESSAGES[error.statusCode] ?? ERROR_MESSAGES['UNKNOWN'] ?? DEFAULT_ERROR;
  }
  if (error instanceof NetworkError) {
    return !navigator.onLine
      ? (ERROR_MESSAGES['OFFLINE'] ?? DEFAULT_ERROR)
      : (ERROR_MESSAGES['NETWORK_ERROR'] ?? DEFAULT_ERROR);
  }
  if (error instanceof ValidationError) {
    return error.message || (ERROR_MESSAGES['UNKNOWN'] ?? DEFAULT_ERROR);
  }
  if (error instanceof Error) {
    return error.message || (ERROR_MESSAGES['UNKNOWN'] ?? DEFAULT_ERROR);
  }
  return ERROR_MESSAGES['UNKNOWN'] ?? DEFAULT_ERROR;
}

/**
 * Log error with context for debugging
 */
export function logError(error: unknown, context: Record<string, unknown> = {}): void {
  const errorInfo = error instanceof AppError
    ? { name: error.name, message: error.message, code: error.code }
    : { name: (error as Error).name, message: (error as Error).message };

  console.error('[AdmissionNoteBuilder Error]', {
    ...errorInfo,
    context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Check if an error is retryable (network issues or temporary server errors)
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof NetworkError) return true;
  if (error instanceof ApiError) {
    return [429, 500, 502, 503].includes(error.statusCode);
  }
  return false;
}

/**
 * Calculate retry delay with exponential backoff and jitter
 */
export function calculateRetryDelay(
  attempt: number,
  config: { INITIAL_DELAY_MS: number; MAX_DELAY_MS: number; BACKOFF_MULTIPLIER: number }
): number {
  const delay = Math.min(
    config.INITIAL_DELAY_MS * Math.pow(config.BACKOFF_MULTIPLIER, attempt),
    config.MAX_DELAY_MS
  );
  return delay + Math.random() * 1000;
}
