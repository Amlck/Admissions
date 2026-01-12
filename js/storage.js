/**
 * Storage Module
 * Handles all localStorage operations with error handling
 */

import { CONFIG } from './config.js';
import { StorageError, logError } from './errors.js';
import { safeJsonParse } from './utils.js';

/**
 * Check if localStorage is available
 * @returns {boolean} True if localStorage is available
 */
export function isStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Save data to localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store (will be JSON stringified if object)
 * @throws {StorageError} If storage fails
 */
export function saveToStorage(key, value) {
  try {
    const serialized = typeof value === 'object' ? JSON.stringify(value) : value;
    localStorage.setItem(key, serialized);
  } catch (error) {
    const storageError = new StorageError(
      `Failed to save to storage: ${error.message}`,
      'save'
    );
    logError(storageError, { key });
    throw storageError;
  }
}

/**
 * Load data from localStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} Stored value or default
 */
export function loadFromStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;

    // Try to parse as JSON, return raw value if not JSON
    const parsed = safeJsonParse(item, null);
    return parsed !== null ? parsed : item;
  } catch (error) {
    logError(new StorageError(`Failed to load from storage: ${error.message}`, 'load'), { key });
    return defaultValue;
  }
}

/**
 * Remove item from localStorage
 * @param {string} key - Storage key
 */
export function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    logError(new StorageError(`Failed to remove from storage: ${error.message}`, 'remove'), { key });
  }
}

/**
 * Clear all app data from localStorage
 */
export function clearAllAppData() {
  const { STORAGE_KEYS } = CONFIG;
  removeFromStorage(STORAGE_KEYS.DATA);
  // Note: We don't clear API key or background by default
}

/**
 * Form Data Manager
 * Handles saving and loading form data
 */
export const FormDataManager = {
  /**
   * Save all form elements to storage
   * @param {HTMLElement[]} formElements - Array of form elements
   */
  save(formElements) {
    const data = {};
    formElements.forEach(el => {
      if (el.id) {
        data[el.id] = el.type === 'checkbox' ? el.checked : el.value;
      }
    });
    saveToStorage(CONFIG.STORAGE_KEYS.DATA, data);
  },

  /**
   * Load form data from storage and populate elements
   * @param {HTMLElement[]} formElements - Array of form elements
   * @returns {boolean} True if data was loaded
   */
  load(formElements) {
    const data = loadFromStorage(CONFIG.STORAGE_KEYS.DATA);
    if (!data) return false;

    formElements.forEach(el => {
      if (el.id && data[el.id] !== undefined) {
        if (el.type === 'checkbox') {
          el.checked = data[el.id];
        } else {
          el.value = data[el.id];
        }
      }
    });
    return true;
  },

  /**
   * Clear all form data
   */
  clear() {
    removeFromStorage(CONFIG.STORAGE_KEYS.DATA);
  }
};

/**
 * API Key Manager
 * Handles API key storage operations
 */
export const ApiKeyManager = {
  /**
   * Save API key to storage
   * @param {string} key - API key
   */
  save(key) {
    saveToStorage(CONFIG.STORAGE_KEYS.API_KEY, key);
  },

  /**
   * Get stored API key
   * @returns {string|null} API key or null
   */
  get() {
    return loadFromStorage(CONFIG.STORAGE_KEYS.API_KEY);
  },

  /**
   * Remove API key from storage
   */
  clear() {
    removeFromStorage(CONFIG.STORAGE_KEYS.API_KEY);
  },

  /**
   * Check if API key exists
   * @returns {boolean} True if key exists
   */
  exists() {
    return !!this.get();
  }
};

/**
 * Background Manager
 * Handles custom background image storage
 */
export const BackgroundManager = {
  /**
   * Save background image data URL
   * @param {string} dataUrl - Base64 data URL
   */
  save(dataUrl) {
    saveToStorage(CONFIG.STORAGE_KEYS.BACKGROUND, dataUrl);
  },

  /**
   * Get stored background
   * @returns {string|null} Background data URL or null
   */
  get() {
    return loadFromStorage(CONFIG.STORAGE_KEYS.BACKGROUND);
  },

  /**
   * Remove custom background
   */
  clear() {
    removeFromStorage(CONFIG.STORAGE_KEYS.BACKGROUND);
  },

  /**
   * Apply stored background to element
   * @param {HTMLElement} element - Element to apply background to
   */
  apply(element) {
    const bg = this.get();
    if (bg) {
      element.style.backgroundImage = `url(${bg})`;
    }
  }
};
