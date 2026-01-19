/**
 * Error Handling Utilities
 * Provides consistent error handling and user-friendly error messages
 */

/**
 * Custom error types for the application
 */
export class AppError extends Error {
  constructor(message, code, details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class ApiError extends AppError {
  constructor(message, statusCode, response = null) {
    super(message, 'API_ERROR', { statusCode, response });
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export class NetworkError extends AppError {
  constructor(message, originalError = null) {
    super(message, 'NETWORK_ERROR', { originalError: originalError?.message });
    this.name = 'NetworkError';
  }
}

export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 'VALIDATION_ERROR', { field });
    this.name = 'ValidationError';
  }
}

export class StorageError extends AppError {
  constructor(message, operation = null) {
    super(message, 'STORAGE_ERROR', { operation });
    this.name = 'StorageError';
  }
}

/**
 * Error code to user-friendly message mapping
 */
const ERROR_MESSAGES = {
  // API Errors
  400: 'Invalid request. Please check your input and try again.',
  401: 'Invalid API key. Please check your Gemini API key.',
  403: 'Access denied. Your API key may not have the required permissions.',
  404: 'API endpoint not found. The service may be temporarily unavailable.',
  429: 'Rate limit exceeded. Please wait a moment before trying again.',
  500: 'Server error. The AI service is experiencing issues.',
  502: 'Bad gateway. The AI service is temporarily unavailable.',
  503: 'Service unavailable. Please try again later.',

  // Network Errors
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  TIMEOUT: 'Request timed out. Please try again.',
  OFFLINE: 'You appear to be offline. Please check your connection.',

  // Validation Errors
  EMPTY_INPUT: 'Please enter some notes to parse.',
  NO_API_KEY: 'Please enter your Gemini API key first.',
  INVALID_JSON: 'Failed to parse AI response. Please try again.',

  // Storage Errors
  STORAGE_FULL: 'Browser storage is full. Please clear some data.',
  STORAGE_UNAVAILABLE: 'Browser storage is unavailable.',

  // Voice Errors
  VOICE_NOT_SUPPORTED: 'Voice recognition is not supported in this browser. Try Chrome.',
  VOICE_NO_PERMISSION: 'Microphone permission denied. Please allow microphone access.',
  VOICE_NETWORK: 'Voice recognition requires an internet connection.',

  // Generic
  UNKNOWN: 'An unexpected error occurred. Please try again.'
};

/**
 * Get user-friendly error message based on error type/code
 */
export function getErrorMessage(error) {
  if (error instanceof ApiError) {
    // Use specific API error messages based on status code
    const statusMessage = ERROR_MESSAGES[error.statusCode];
    if (statusMessage) {
      return statusMessage;
    }
    // For unknown status codes, return the error message if descriptive
    if (error.message && !error.message.includes('API request failed')) {
      return error.message;
    }
    return ERROR_MESSAGES.UNKNOWN;
  }

  if (error instanceof NetworkError) {
    // NetworkError now contains specific messages - use them directly
    if (error.message && error.message !== 'Network error') {
      return error.message;
    }
    // Fallback to generic messages
    if (!navigator.onLine) {
      return ERROR_MESSAGES.OFFLINE;
    }
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  if (error instanceof ValidationError) {
    return error.message || ERROR_MESSAGES.UNKNOWN;
  }

  if (error instanceof StorageError) {
    if (error.message.includes('quota')) {
      return ERROR_MESSAGES.STORAGE_FULL;
    }
    return ERROR_MESSAGES.STORAGE_UNAVAILABLE;
  }

  // Handle standard errors
  if (error.code in ERROR_MESSAGES) {
    return ERROR_MESSAGES[error.code];
  }

  if (typeof error === 'string' && error in ERROR_MESSAGES) {
    return ERROR_MESSAGES[error];
  }

  return error.message || ERROR_MESSAGES.UNKNOWN;
}

/**
 * Log error with context for debugging
 */
export function logError(error, context = {}) {
  const errorInfo = {
    name: error.name || 'Error',
    message: error.message,
    code: error.code,
    details: error.details,
    context,
    timestamp: new Date().toISOString(),
    stack: error.stack
  };

  console.error('[AdmissionNoteBuilder Error]', errorInfo);

  // Could be extended to send to error reporting service
  return errorInfo;
}

/**
 * Wrap async functions with error handling
 */
export function withErrorHandling(fn, errorHandler) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (errorHandler) {
        return errorHandler(error);
      }
      throw error;
    }
  };
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error) {
  if (error instanceof NetworkError) {
    return true;
  }

  if (error instanceof ApiError) {
    // Retry on rate limit, server errors, or gateway errors
    return [429, 500, 502, 503].includes(error.statusCode);
  }

  return false;
}

/**
 * Calculate delay for retry with exponential backoff
 */
export function calculateRetryDelay(attempt, config) {
  const delay = Math.min(
    config.INITIAL_DELAY_MS * Math.pow(config.BACKOFF_MULTIPLIER, attempt),
    config.MAX_DELAY_MS
  );
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}
