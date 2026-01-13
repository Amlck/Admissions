/**
 * Utility Functions
 * Common helper functions used throughout the application
 */

/**
 * Get value from form element by ID with fallback
 * @param {string} id - Element ID
 * @param {string} defaultVal - Default value if element is empty
 * @returns {string} Element value or default
 */
export function getVal(id, defaultVal = 'N/A') {
  const el = document.getElementById(id);
  return el && el.value.trim() ? el.value.trim() : defaultVal;
}

/**
 * Get checkbox state as symbol (filled/empty square)
 * @param {string} cbId - Checkbox element ID
 * @returns {string} '■' if checked, '□' if not
 */
export function plusMinus(cbId) {
  const el = document.getElementById(cbId);
  return el && el.checked ? '■' : '□';
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between calls
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Sanitize text for HTML display (prevent XSS)
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
export function sanitizeHTML(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate unique ID
 * @returns {string} Unique identifier
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if browser is online
 * @returns {boolean} True if online
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @param {string} format - Format string (default: YYYY/MM/DD)
 * @returns {string} Formatted date
 */
export function formatDate(date, format = 'YYYY/MM/DD') {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day);
}

/**
 * Parse JSON safely with error handling
 * @param {string} jsonString - JSON string to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed value or default
 */
export function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.warn('JSON parse error:', e);
    return defaultValue;
  }
}

/**
 * Extract JSON from text that may contain markdown code blocks
 * @param {string} text - Text containing JSON
 * @returns {string} Extracted JSON string
 */
export function extractJsonFromText(text) {
  let jsonStr = text;

  // Handle ```json code blocks
  if (text.includes('```json')) {
    jsonStr = text.split('```json')[1].split('```')[0];
  } else if (text.includes('```')) {
    jsonStr = text.split('```')[1].split('```')[0];
  }

  return jsonStr.trim();
}

/**
 * Check if value is empty (null, undefined, empty string, empty array)
 * @param {*} value - Value to check
 * @returns {boolean} True if empty
 */
export function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Deep clone an object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (Array.isArray(obj)) return obj.map(item => deepClone(item));

  const cloned = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}
