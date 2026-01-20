/**
 * Utility functions for the Admission Note Builder
 */

/**
 * Get value from a form element by ID
 */
export function getVal(id: string, defaultVal = 'N/A'): string {
  const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
  return el && el.value.trim() ? el.value.trim() : defaultVal;
}

/**
 * Get checkbox state as a visual indicator
 */
export function plusMinus(cbId: string): string {
  const el = document.getElementById(cbId) as HTMLInputElement | null;
  return el && el.checked ? '■' : '□';
}

/**
 * Debounce a function call
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function (this: unknown, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHTML(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Safely parse JSON with a default value
 */
export function safeJsonParse<T>(jsonString: string, defaultValue: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Check if JSON string is valid
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Repair truncated JSON (for Gemini 3 models that may truncate)
 */
export function repairTruncatedJson(jsonStr: string): string {
  let result = jsonStr;

  // Count open/close braces and brackets
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < result.length; i++) {
    const c = result[i];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (c === '\\') {
      escapeNext = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (c === '{') braceCount++;
    else if (c === '}') braceCount--;
    else if (c === '[') bracketCount++;
    else if (c === ']') bracketCount--;
  }

  // If we're in a string, try to close it
  if (inString) {
    const lastQuote = result.lastIndexOf('"');
    if (lastQuote > 0) {
      const beforeQuote = result.substring(0, lastQuote).trim();
      if (beforeQuote.endsWith(':') || beforeQuote.endsWith(',') || beforeQuote.endsWith('[')) {
        result = result.substring(0, lastQuote) + 'null';
      } else {
        result = result.substring(0, lastQuote + 1);
      }
    }
  }

  // Recount after string fix
  braceCount = 0;
  bracketCount = 0;
  inString = false;
  escapeNext = false;

  for (let i = 0; i < result.length; i++) {
    const c = result[i];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (c === '\\') {
      escapeNext = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (c === '{') braceCount++;
    else if (c === '}') braceCount--;
    else if (c === '[') bracketCount++;
    else if (c === ']') bracketCount--;
  }

  // Close unclosed brackets and braces
  while (bracketCount > 0) {
    result += ']';
    bracketCount--;
  }
  while (braceCount > 0) {
    result += '}';
    braceCount--;
  }

  if (result !== jsonStr) {
    console.log('[JSON Repair] Applied truncation repair');
  }

  return result;
}

/**
 * Extract JSON from text that may include markdown code blocks
 */
export function extractJsonFromText(text: string): string {
  let jsonStr = text;

  if (text.includes('```json')) {
    jsonStr = text.split('```json')[1]?.split('```')[0] ?? text;
  } else if (text.includes('```')) {
    jsonStr = text.split('```')[1]?.split('```')[0] ?? text;
  }

  jsonStr = jsonStr.trim();

  // Try to repair truncated JSON
  if (!isValidJson(jsonStr)) {
    jsonStr = repairTruncatedJson(jsonStr);
  }

  return jsonStr;
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  return JSON.parse(JSON.stringify(obj)) as T;
}

/**
 * Format a date to YYYY/MM/DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
