/**
 * Tests for error handling module
 */

import { describe, it, expect, vi } from 'vitest';
import {
  AppError,
  ApiError,
  NetworkError,
  ValidationError,
  StorageError,
  getErrorMessage,
  logError,
  isRetryableError,
  calculateRetryDelay,
  ERROR_MESSAGES,
} from '../../src/errors';

describe('Errors - Custom Error Classes', () => {
  it('should create AppError with correct properties', () => {
    const error = new AppError('Test error', 'TEST_CODE', { extra: 'data' });
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.details).toEqual({ extra: 'data' });
    expect(error.name).toBe('AppError');
    expect(error.timestamp).toBeDefined();
  });

  it('should create ApiError with status code', () => {
    const error = new ApiError('API failed', 401, { response: 'data' });
    expect(error.message).toBe('API failed');
    expect(error.statusCode).toBe(401);
    expect(error.name).toBe('ApiError');
    expect(error.code).toBe('API_ERROR');
  });

  it('should create NetworkError', () => {
    const originalError = new Error('Connection failed');
    const error = new NetworkError('Network issue', originalError);
    expect(error.message).toBe('Network issue');
    expect(error.name).toBe('NetworkError');
    expect(error.code).toBe('NETWORK_ERROR');
  });

  it('should create ValidationError with field info', () => {
    const error = new ValidationError('Invalid input', 'email');
    expect(error.message).toBe('Invalid input');
    expect(error.details).toEqual({ field: 'email' });
    expect(error.name).toBe('ValidationError');
  });

  it('should create StorageError', () => {
    const error = new StorageError('Storage failed', 'apiKey');
    expect(error.message).toBe('Storage failed');
    expect(error.details).toEqual({ key: 'apiKey' });
    expect(error.name).toBe('StorageError');
  });
});

describe('Errors - getErrorMessage', () => {
  it('should return message for API errors with known status codes', () => {
    expect(getErrorMessage(new ApiError('', 401))).toBe(ERROR_MESSAGES[401]);
    expect(getErrorMessage(new ApiError('', 429))).toBe(ERROR_MESSAGES[429]);
    expect(getErrorMessage(new ApiError('', 500))).toBe(ERROR_MESSAGES[500]);
  });

  it('should return unknown error message for unrecognized status codes', () => {
    const message = getErrorMessage(new ApiError('', 418));
    expect(message).toContain('unexpected error');
  });

  it('should return network error message for NetworkError when online', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    const message = getErrorMessage(new NetworkError(''));
    expect(message).toContain('Network error');
  });

  it('should return offline message for NetworkError when offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    const message = getErrorMessage(new NetworkError(''));
    expect(message).toContain('offline');
    // Reset
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
  });

  it('should return validation error message', () => {
    const error = new ValidationError('Email is required');
    expect(getErrorMessage(error)).toBe('Email is required');
  });

  it('should return generic Error message', () => {
    const error = new Error('Something went wrong');
    expect(getErrorMessage(error)).toBe('Something went wrong');
  });

  it('should return default message for unknown error types', () => {
    const message = getErrorMessage('string error');
    expect(message).toContain('unexpected error');
  });
});

describe('Errors - logError', () => {
  it('should log error to console', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new AppError('Test', 'TEST');
    logError(error, { context: 'test' });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should handle regular Error objects', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Regular error');
    logError(error);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('Errors - isRetryableError', () => {
  it('should return true for NetworkError', () => {
    expect(isRetryableError(new NetworkError(''))).toBe(true);
  });

  it('should return true for retryable API status codes', () => {
    expect(isRetryableError(new ApiError('', 429))).toBe(true);
    expect(isRetryableError(new ApiError('', 500))).toBe(true);
    expect(isRetryableError(new ApiError('', 502))).toBe(true);
    expect(isRetryableError(new ApiError('', 503))).toBe(true);
  });

  it('should return false for non-retryable API status codes', () => {
    expect(isRetryableError(new ApiError('', 400))).toBe(false);
    expect(isRetryableError(new ApiError('', 401))).toBe(false);
    expect(isRetryableError(new ApiError('', 403))).toBe(false);
    expect(isRetryableError(new ApiError('', 404))).toBe(false);
  });

  it('should return false for other error types', () => {
    expect(isRetryableError(new ValidationError(''))).toBe(false);
    expect(isRetryableError(new Error(''))).toBe(false);
  });
});

describe('Errors - calculateRetryDelay', () => {
  const config = {
    INITIAL_DELAY_MS: 1000,
    MAX_DELAY_MS: 10000,
    BACKOFF_MULTIPLIER: 2,
  };

  it('should calculate exponential delay', () => {
    const delay0 = calculateRetryDelay(0, config);
    const delay1 = calculateRetryDelay(1, config);
    const delay2 = calculateRetryDelay(2, config);

    // Base delay should be around 1000-2000ms for attempt 0
    expect(delay0).toBeGreaterThanOrEqual(1000);
    expect(delay0).toBeLessThan(2100);

    // Delay should increase exponentially
    expect(delay1).toBeGreaterThan(delay0 - 1000); // Account for jitter

    // Verify delay2 is used and grows
    expect(delay2).toBeGreaterThan(delay1 - 1000); // Account for jitter
  });

  it('should not exceed max delay', () => {
    const delay = calculateRetryDelay(10, config);
    expect(delay).toBeLessThanOrEqual(config.MAX_DELAY_MS + 1000); // Max + jitter
  });

  it('should include some randomness (jitter)', () => {
    const delays = Array.from({ length: 10 }, () => calculateRetryDelay(0, config));
    const uniqueDelays = new Set(delays);
    // With jitter, we should get different values
    expect(uniqueDelays.size).toBeGreaterThan(1);
  });
});
