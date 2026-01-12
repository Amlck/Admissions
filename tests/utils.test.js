/**
 * Unit Tests for Utils Module
 */

import {
  test,
  describe,
  assertEqual,
  assertDeepEqual,
  assertTruthy,
  assertFalsy
} from './test-runner.js';

import {
  sanitizeHTML,
  sleep,
  generateId,
  formatDate,
  safeJsonParse,
  extractJsonFromText,
  isEmpty,
  deepClone,
  debounce
} from '../js/utils.js';

describe('Utils - sanitizeHTML', () => {
  test('should escape HTML special characters', () => {
    assertEqual(sanitizeHTML('<script>alert("xss")</script>'),
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  test('should escape ampersands', () => {
    assertEqual(sanitizeHTML('Tom & Jerry'), 'Tom &amp; Jerry');
  });

  test('should escape single quotes', () => {
    assertEqual(sanitizeHTML("it's"), 'it&#039;s');
  });

  test('should handle empty string', () => {
    assertEqual(sanitizeHTML(''), '');
  });

  test('should handle null/undefined', () => {
    assertEqual(sanitizeHTML(null), '');
    assertEqual(sanitizeHTML(undefined), '');
  });

  test('should preserve normal text', () => {
    assertEqual(sanitizeHTML('Hello World'), 'Hello World');
  });
});

describe('Utils - safeJsonParse', () => {
  test('should parse valid JSON', () => {
    assertDeepEqual(safeJsonParse('{"key": "value"}'), { key: 'value' });
  });

  test('should parse JSON arrays', () => {
    assertDeepEqual(safeJsonParse('[1, 2, 3]'), [1, 2, 3]);
  });

  test('should return default for invalid JSON', () => {
    assertEqual(safeJsonParse('not json', 'default'), 'default');
  });

  test('should return null for invalid JSON by default', () => {
    assertEqual(safeJsonParse('not json'), null);
  });

  test('should handle empty string', () => {
    assertEqual(safeJsonParse('', 'default'), 'default');
  });
});

describe('Utils - extractJsonFromText', () => {
  test('should extract JSON from markdown code block', () => {
    const text = 'Here is the response:\n```json\n{"key": "value"}\n```\nDone.';
    assertEqual(extractJsonFromText(text), '{"key": "value"}');
  });

  test('should extract JSON from generic code block', () => {
    const text = 'Result:\n```\n{"data": 123}\n```';
    assertEqual(extractJsonFromText(text), '{"data": 123}');
  });

  test('should return trimmed text if no code block', () => {
    const text = '  {"plain": "json"}  ';
    assertEqual(extractJsonFromText(text), '{"plain": "json"}');
  });
});

describe('Utils - isEmpty', () => {
  test('should return true for null', () => {
    assertTruthy(isEmpty(null));
  });

  test('should return true for undefined', () => {
    assertTruthy(isEmpty(undefined));
  });

  test('should return true for empty string', () => {
    assertTruthy(isEmpty(''));
    assertTruthy(isEmpty('   '));
  });

  test('should return true for empty array', () => {
    assertTruthy(isEmpty([]));
  });

  test('should return true for empty object', () => {
    assertTruthy(isEmpty({}));
  });

  test('should return false for non-empty string', () => {
    assertFalsy(isEmpty('hello'));
  });

  test('should return false for non-empty array', () => {
    assertFalsy(isEmpty([1, 2, 3]));
  });

  test('should return false for non-empty object', () => {
    assertFalsy(isEmpty({ key: 'value' }));
  });

  test('should return false for numbers', () => {
    assertFalsy(isEmpty(0));
    assertFalsy(isEmpty(42));
  });
});

describe('Utils - deepClone', () => {
  test('should clone primitive values', () => {
    assertEqual(deepClone(42), 42);
    assertEqual(deepClone('hello'), 'hello');
    assertEqual(deepClone(null), null);
  });

  test('should clone arrays', () => {
    const arr = [1, 2, [3, 4]];
    const cloned = deepClone(arr);
    assertDeepEqual(cloned, arr);
    cloned[2][0] = 99;
    assertEqual(arr[2][0], 3); // Original unchanged
  });

  test('should clone objects', () => {
    const obj = { a: 1, b: { c: 2 } };
    const cloned = deepClone(obj);
    assertDeepEqual(cloned, obj);
    cloned.b.c = 99;
    assertEqual(obj.b.c, 2); // Original unchanged
  });

  test('should clone Date objects', () => {
    const date = new Date('2024-01-15');
    const cloned = deepClone(date);
    assertEqual(cloned.getTime(), date.getTime());
  });
});

describe('Utils - formatDate', () => {
  test('should format date with default format', () => {
    const date = new Date('2024-03-15');
    assertEqual(formatDate(date), '2024/03/15');
  });

  test('should format date string', () => {
    assertEqual(formatDate('2024-12-25'), '2024/12/25');
  });

  test('should pad single digit months and days', () => {
    const date = new Date('2024-01-05');
    assertEqual(formatDate(date), '2024/01/05');
  });
});

describe('Utils - generateId', () => {
  test('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    assertTruthy(id1 !== id2);
  });

  test('should return a string', () => {
    const id = generateId();
    assertEqual(typeof id, 'string');
  });

  test('should include timestamp', () => {
    const id = generateId();
    const timestamp = id.split('-')[0];
    assertTruthy(parseInt(timestamp) > 0);
  });
});

describe('Utils - sleep', () => {
  test('should return a promise', () => {
    const result = sleep(0);
    assertTruthy(result instanceof Promise);
  });

  test('should resolve after delay', async () => {
    const start = Date.now();
    await sleep(50);
    const elapsed = Date.now() - start;
    assertTruthy(elapsed >= 45); // Allow small variance
  });
});

// Run tests when this module is loaded
console.log('\n========================================');
console.log('Running Utils Tests');
console.log('========================================');
