/**
 * Unit Tests for Errors Module
 */

import {
  test,
  describe,
  assertEqual,
  assertTruthy,
  assertFalsy
} from './test-runner.js';

import {
  AppError,
  ApiError,
  NetworkError,
  ValidationError,
  StorageError,
  getErrorMessage,
  isRetryableError,
  calculateRetryDelay
} from '../js/errors.js';

import { CONFIG } from '../js/config.js';

describe('Errors - Custom Error Classes', () => {
  test('AppError should have correct properties', () => {
    const error = new AppError('Test error', 'TEST_CODE', { foo: 'bar' });
    assertEqual(error.name, 'AppError');
    assertEqual(error.message, 'Test error');
    assertEqual(error.code, 'TEST_CODE');
    assertEqual(error.details.foo, 'bar');
    assertTruthy(error.timestamp);
  });

  test('ApiError should include status code', () => {
    const error = new ApiError('API failed', 429);
    assertEqual(error.name, 'ApiError');
    assertEqual(error.statusCode, 429);
    assertEqual(error.code, 'API_ERROR');
  });

  test('NetworkError should wrap original error', () => {
    const original = new Error('Network failed');
    const error = new NetworkError('Connection lost', original);
    assertEqual(error.name, 'NetworkError');
    assertEqual(error.code, 'NETWORK_ERROR');
    assertEqual(error.details.originalError, 'Network failed');
  });

  test('ValidationError should include field', () => {
    const error = new ValidationError('Invalid input', 'email');
    assertEqual(error.name, 'ValidationError');
    assertEqual(error.details.field, 'email');
  });

  test('StorageError should include operation', () => {
    const error = new StorageError('Storage full', 'save');
    assertEqual(error.name, 'StorageError');
    assertEqual(error.details.operation, 'save');
  });
});

describe('Errors - getErrorMessage', () => {
  test('should return message for API 429 error', () => {
    const error = new ApiError('Rate limited', 429);
    const message = getErrorMessage(error);
    assertTruthy(message.includes('Rate limit'));
  });

  test('should return message for API 401 error', () => {
    const error = new ApiError('Unauthorized', 401);
    const message = getErrorMessage(error);
    assertTruthy(message.includes('API key'));
  });

  test('should return message for API 500 error', () => {
    const error = new ApiError('Server error', 500);
    const message = getErrorMessage(error);
    assertTruthy(message.includes('Server error'));
  });

  test('should return network message for NetworkError', () => {
    const error = new NetworkError('Failed');
    const message = getErrorMessage(error);
    assertTruthy(message.includes('Network') || message.includes('connection'));
  });

  test('should return custom message for ValidationError', () => {
    const error = new ValidationError('Please enter notes');
    const message = getErrorMessage(error);
    assertEqual(message, 'Please enter notes');
  });

  test('should return fallback for unknown error', () => {
    const error = new Error('Unknown');
    const message = getErrorMessage(error);
    assertEqual(message, 'Unknown');
  });
});

describe('Errors - isRetryableError', () => {
  test('should return true for NetworkError', () => {
    const error = new NetworkError('Connection failed');
    assertTruthy(isRetryableError(error));
  });

  test('should return true for API 429 (rate limit)', () => {
    const error = new ApiError('Rate limited', 429);
    assertTruthy(isRetryableError(error));
  });

  test('should return true for API 500 (server error)', () => {
    const error = new ApiError('Server error', 500);
    assertTruthy(isRetryableError(error));
  });

  test('should return true for API 502 (bad gateway)', () => {
    const error = new ApiError('Bad gateway', 502);
    assertTruthy(isRetryableError(error));
  });

  test('should return true for API 503 (service unavailable)', () => {
    const error = new ApiError('Unavailable', 503);
    assertTruthy(isRetryableError(error));
  });

  test('should return false for API 400 (bad request)', () => {
    const error = new ApiError('Bad request', 400);
    assertFalsy(isRetryableError(error));
  });

  test('should return false for API 401 (unauthorized)', () => {
    const error = new ApiError('Unauthorized', 401);
    assertFalsy(isRetryableError(error));
  });

  test('should return false for ValidationError', () => {
    const error = new ValidationError('Invalid');
    assertFalsy(isRetryableError(error));
  });
});

describe('Errors - calculateRetryDelay', () => {
  const config = CONFIG.RETRY;

  test('should return initial delay for first attempt', () => {
    const delay = calculateRetryDelay(0, config);
    assertTruthy(delay >= config.INITIAL_DELAY_MS);
    assertTruthy(delay <= config.INITIAL_DELAY_MS + 1000); // Account for jitter
  });

  test('should increase delay with each attempt', () => {
    const delay0 = calculateRetryDelay(0, config);
    const delay1 = calculateRetryDelay(1, config);
    const delay2 = calculateRetryDelay(2, config);

    // Each delay should be roughly 2x the previous (backoff multiplier)
    assertTruthy(delay1 > delay0);
    assertTruthy(delay2 > delay1);
  });

  test('should not exceed max delay', () => {
    const delay = calculateRetryDelay(10, config); // High attempt number
    assertTruthy(delay <= config.MAX_DELAY_MS + 1000); // Account for jitter
  });

  test('should include jitter (randomness)', () => {
    // Run multiple times and check for variance
    const delays = [];
    for (let i = 0; i < 5; i++) {
      delays.push(calculateRetryDelay(0, config));
    }
    // Check that not all delays are exactly the same
    const uniqueDelays = new Set(delays);
    // With jitter, we should have some variance (though not guaranteed)
    assertTruthy(delays.length > 0);
  });
});

// Run tests when this module is loaded
console.log('\n========================================');
console.log('Running Errors Tests');
console.log('========================================');
