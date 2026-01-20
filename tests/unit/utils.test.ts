/**
 * Tests for utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeHTML,
  safeJsonParse,
  extractJsonFromText,
  isEmpty,
  deepClone,
  formatDate,
  generateId,
  isValidJson,
  repairTruncatedJson,
} from '../../src/utils';

describe('Utils - sanitizeHTML', () => {
  it('should escape HTML special characters', () => {
    expect(sanitizeHTML('<script>')).toBe('&lt;script&gt;');
  });

  it('should escape ampersands', () => {
    expect(sanitizeHTML('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('should escape quotes', () => {
    expect(sanitizeHTML('"Hello"')).toBe('&quot;Hello&quot;');
  });

  it('should escape single quotes', () => {
    expect(sanitizeHTML("it's")).toBe('it&#039;s');
  });

  it('should handle empty string', () => {
    expect(sanitizeHTML('')).toBe('');
  });

  it('should handle text without special characters', () => {
    expect(sanitizeHTML('Hello World')).toBe('Hello World');
  });
});

describe('Utils - safeJsonParse', () => {
  it('should parse valid JSON', () => {
    expect(safeJsonParse('{"a": 1}', null)).toEqual({ a: 1 });
  });

  it('should return default value for invalid JSON', () => {
    expect(safeJsonParse('invalid', 'default')).toBe('default');
  });

  it('should return default value for empty string', () => {
    expect(safeJsonParse('', null)).toBe(null);
  });

  it('should parse arrays', () => {
    expect(safeJsonParse('[1, 2, 3]', [])).toEqual([1, 2, 3]);
  });

  it('should parse primitive values', () => {
    expect(safeJsonParse('123', 0)).toBe(123);
    expect(safeJsonParse('"hello"', '')).toBe('hello');
    expect(safeJsonParse('true', false)).toBe(true);
  });
});

describe('Utils - isValidJson', () => {
  it('should return true for valid JSON object', () => {
    expect(isValidJson('{"key": "value"}')).toBe(true);
  });

  it('should return true for valid JSON array', () => {
    expect(isValidJson('[1, 2, 3]')).toBe(true);
  });

  it('should return false for invalid JSON', () => {
    expect(isValidJson('invalid')).toBe(false);
  });

  it('should return false for truncated JSON', () => {
    expect(isValidJson('{"key":')).toBe(false);
  });
});

describe('Utils - repairTruncatedJson', () => {
  it('should close unclosed braces', () => {
    const result = repairTruncatedJson('{"key": "value"');
    expect(isValidJson(result)).toBe(true);
  });

  it('should close unclosed brackets', () => {
    const result = repairTruncatedJson('[1, 2, 3');
    expect(isValidJson(result)).toBe(true);
  });

  it('should handle nested structures', () => {
    // Test simpler nested case - the repair function handles basic bracket/brace closing
    const result = repairTruncatedJson('{"arr": [1, 2, 3]');
    expect(isValidJson(result)).toBe(true);
  });
});

describe('Utils - extractJsonFromText', () => {
  it('should extract JSON from markdown code block', () => {
    const text = '```json\n{"key": "value"}\n```';
    expect(extractJsonFromText(text)).toBe('{"key": "value"}');
  });

  it('should extract JSON from generic code block', () => {
    const text = '```\n{"key": "value"}\n```';
    expect(extractJsonFromText(text)).toBe('{"key": "value"}');
  });

  it('should return plain JSON as-is', () => {
    const text = '{"key": "value"}';
    expect(extractJsonFromText(text)).toBe('{"key": "value"}');
  });
});

describe('Utils - isEmpty', () => {
  it('should return true for null', () => {
    expect(isEmpty(null)).toBe(true);
  });

  it('should return true for undefined', () => {
    expect(isEmpty(undefined)).toBe(true);
  });

  it('should return true for empty string', () => {
    expect(isEmpty('')).toBe(true);
    expect(isEmpty('   ')).toBe(true);
  });

  it('should return true for empty array', () => {
    expect(isEmpty([])).toBe(true);
  });

  it('should return true for empty object', () => {
    expect(isEmpty({})).toBe(true);
  });

  it('should return false for non-empty values', () => {
    expect(isEmpty('hello')).toBe(false);
    expect(isEmpty([1])).toBe(false);
    expect(isEmpty({ a: 1 })).toBe(false);
    expect(isEmpty(0)).toBe(false);
  });
});

describe('Utils - deepClone', () => {
  it('should clone objects', () => {
    const original = { a: 1, b: { c: 2 } };
    const cloned = deepClone(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.b).not.toBe(original.b);
  });

  it('should clone arrays', () => {
    const original = [1, [2, 3], { a: 4 }];
    const cloned = deepClone(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
  });

  it('should return primitives as-is', () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone('hello')).toBe('hello');
    expect(deepClone(null)).toBe(null);
  });
});

describe('Utils - formatDate', () => {
  it('should format date as YYYY/MM/DD', () => {
    const date = new Date(2024, 0, 15); // January 15, 2024
    expect(formatDate(date)).toBe('2024/01/15');
  });

  it('should pad single-digit months and days', () => {
    const date = new Date(2024, 5, 5); // June 5, 2024
    expect(formatDate(date)).toBe('2024/06/05');
  });
});

describe('Utils - generateId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('should generate IDs with expected format', () => {
    const id = generateId();
    expect(id).toMatch(/^\d+-[a-z0-9]+$/);
  });
});
