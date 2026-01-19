/**
 * API Module
 * Handles all communication with the Gemini AI API
 */

import { CONFIG, AI_PROMPT_TEMPLATE } from './config.js';
import { ApiKeyManager } from './storage.js';
import {
  ApiError,
  NetworkError,
  ValidationError,
  logError,
  getErrorMessage,
  isRetryableError,
  calculateRetryDelay
} from './errors.js';
import { sleep, extractJsonFromText, isOnline } from './utils.js';

/**
 * Build the API endpoint URL
 * @param {string} apiKey - The API key
 * @returns {string} Full API URL
 */
function buildApiUrl(apiKey) {
  const { BASE_URL, MODEL } = CONFIG.API;
  return `${BASE_URL}/${MODEL}:generateContent?key=${apiKey}`;
}

/**
 * Build the request body for the API
 * @param {string} clinicalNotes - The clinical notes to parse
 * @returns {Object} Request body
 */
function buildRequestBody(clinicalNotes) {
  const prompt = AI_PROMPT_TEMPLATE.replace('{{CLINICAL_NOTES}}', clinicalNotes);

  return {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: CONFIG.API.TEMPERATURE,
      maxOutputTokens: CONFIG.API.MAX_OUTPUT_TOKENS
    }
  };
}

/**
 * Validate inputs before making API call
 * @param {string} apiKey - API key
 * @param {string} inputText - Input text
 * @throws {ValidationError} If validation fails
 */
function validateInputs(apiKey, inputText) {
  if (!apiKey) {
    throw new ValidationError('Please enter your Gemini API key first.', 'apiKey');
  }
  if (!inputText || !inputText.trim()) {
    throw new ValidationError('Please enter some notes to parse.', 'inputText');
  }
}

/**
 * Detect specific network error type from fetch error
 * @param {Error} error - The caught error
 * @returns {string} Specific error message
 */
function getSpecificNetworkError(error) {
  const message = error.message?.toLowerCase() || '';

  // Connection refused / server unreachable
  if (message.includes('failed to fetch') || message.includes('networkerror')) {
    if (!navigator.onLine) {
      return 'Connection lost. Please check your internet connection.';
    }
    return 'Unable to reach the AI service. The server may be down or blocked.';
  }

  // DNS resolution failed
  if (message.includes('dns') || message.includes('getaddrinfo') || message.includes('nodename nor servname')) {
    return 'DNS lookup failed. Please check your internet connection.';
  }

  // Connection timeout
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'Connection timed out. The server took too long to respond.';
  }

  // SSL/TLS errors
  if (message.includes('ssl') || message.includes('certificate') || message.includes('cert')) {
    return 'Secure connection failed. There may be a network security issue.';
  }

  // Connection reset
  if (message.includes('econnreset') || message.includes('connection reset')) {
    return 'Connection was reset. Please try again.';
  }

  // Connection aborted
  if (message.includes('aborted') || message.includes('abort')) {
    return 'Request was aborted. Please try again.';
  }

  // CORS errors (typically manifest as TypeErrors)
  if (message.includes('cors') || message.includes('cross-origin')) {
    return 'Cross-origin request blocked. This may be a configuration issue.';
  }

  // Generic offline
  if (!navigator.onLine) {
    return 'Connection lost. Please check your internet connection.';
  }

  return 'Network request failed. Please check your connection and try again.';
}

/**
 * Make API request with error handling
 * @param {string} url - API URL
 * @param {Object} body - Request body
 * @returns {Promise<Object>} API response data
 * @throws {ApiError|NetworkError} On failure
 */
async function makeApiRequest(url, body) {
  // Check network connectivity first
  if (!isOnline()) {
    throw new NetworkError('Connection lost. Please check your internet connection.');
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      let errorDetails = null;

      try {
        errorDetails = await response.json();
        if (errorDetails.error?.message) {
          errorMessage = errorDetails.error.message;
        }
      } catch (e) {
        // Couldn't parse error response, use default message
      }

      throw new ApiError(errorMessage, response.status, errorDetails);
    }

    return await response.json();
  } catch (error) {
    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }

    // Wrap fetch errors as NetworkError with specific message
    if (error.name === 'TypeError' || error.message.includes('fetch')) {
      const specificMessage = getSpecificNetworkError(error);
      throw new NetworkError(specificMessage, error);
    }

    throw error;
  }
}

/**
 * Parse API response to extract structured data
 * @param {Object} response - API response
 * @returns {Object} Parsed clinical data
 * @throws {Error} If parsing fails
 */
function parseApiResponse(response) {
  // Extract text from response
  const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Empty response from AI. Please try again.');
  }

  // Extract JSON from potentially markdown-wrapped response
  const jsonStr = extractJsonFromText(text);

  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    logError(error, { responseText: text.substring(0, 500) });
    throw new Error('Failed to parse AI response. The response was not valid JSON.');
  }
}

/**
 * Parse clinical notes using AI with retry logic
 * @param {string} inputText - Clinical notes to parse
 * @param {Object} callbacks - Callback functions
 * @param {Function} callbacks.onStatus - Status update callback (message, type)
 * @param {Function} callbacks.onSuccess - Success callback (parsedData)
 * @param {Function} callbacks.onError - Error callback (error)
 * @returns {Promise<Object|null>} Parsed data or null on failure
 */
export async function parseWithAI(inputText, callbacks = {}) {
  const { onStatus, onSuccess, onError } = callbacks;
  const apiKey = ApiKeyManager.get();

  // Validate inputs
  try {
    validateInputs(apiKey, inputText);
  } catch (error) {
    onStatus?.(error.message, 'error');
    onError?.(error);
    return null;
  }

  const url = buildApiUrl(apiKey);
  const body = buildRequestBody(inputText);

  let lastError = null;

  // Retry loop
  for (let attempt = 0; attempt < CONFIG.RETRY.MAX_ATTEMPTS; attempt++) {
    try {
      // Show status
      if (attempt === 0) {
        onStatus?.('Sending to AI...', 'loading');
      } else {
        onStatus?.(`Retrying... (attempt ${attempt + 1}/${CONFIG.RETRY.MAX_ATTEMPTS})`, 'loading');
      }

      const response = await makeApiRequest(url, body);

      onStatus?.('Parsing response...', 'loading');
      const parsed = parseApiResponse(response);

      onStatus?.('Populating form...', 'loading');
      onSuccess?.(parsed);

      onStatus?.('Done!', 'success');
      return parsed;

    } catch (error) {
      lastError = error;
      logError(error, { attempt, inputTextLength: inputText.length });

      // Check if we should retry
      if (isRetryableError(error) && attempt < CONFIG.RETRY.MAX_ATTEMPTS - 1) {
        const delay = calculateRetryDelay(attempt, CONFIG.RETRY);
        const errorType = error instanceof NetworkError ? 'Connection issue' : 'Rate limited';
        onStatus?.(`${errorType}. Retrying in ${Math.round(delay / 1000)} seconds...`, 'loading');
        await sleep(delay);
        continue;
      }

      // No more retries, report error
      break;
    }
  }

  // All retries exhausted
  const errorMessage = getErrorMessage(lastError);
  onStatus?.(errorMessage, 'error');
  onError?.(lastError);
  return null;
}

/**
 * Validate API key by making a minimal request
 * @param {string} apiKey - API key to validate
 * @returns {Promise<boolean>} True if valid
 */
export async function validateApiKey(apiKey) {
  if (!apiKey || !apiKey.trim()) {
    return false;
  }

  try {
    const url = buildApiUrl(apiKey);
    const body = {
      contents: [{
        parts: [{ text: 'Say "ok"' }]
      }],
      generationConfig: {
        maxOutputTokens: 10
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    return response.ok;
  } catch (error) {
    logError(error, { context: 'API key validation' });
    return false;
  }
}
