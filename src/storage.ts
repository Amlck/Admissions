/**
 * Storage management module for the Admission Note Builder
 * Handles localStorage persistence for form data, API keys, and settings
 */

import { CONFIG } from './config';
import { logError } from './errors';
import { safeJsonParse } from './utils';
import type { FormElementData, FormElement } from './types';

/**
 * Save a value to localStorage
 */
export function saveToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
  } catch (error) {
    logError(error, { key });
  }
}

/**
 * Load a value from localStorage
 */
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    const parsed = safeJsonParse<T | null>(item, null);
    return parsed !== null ? parsed : (item as unknown as T);
  } catch {
    return defaultValue;
  }
}

/**
 * Remove a value from localStorage
 */
export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Silently fail
  }
}

/**
 * Form data manager - saves and loads form field values
 */
export const FormDataManager = {
  save(formElements: FormElement[]): void {
    const data: FormElementData = {};
    formElements.forEach((el) => {
      if (el.id) {
        data[el.id] = el.type === 'checkbox' ? (el as HTMLInputElement).checked : el.value;
      }
    });
    saveToStorage(CONFIG.STORAGE_KEYS.DATA, data);
  },

  load(formElements: FormElement[]): boolean {
    const data = loadFromStorage<FormElementData | null>(CONFIG.STORAGE_KEYS.DATA, null);
    if (!data) return false;

    formElements.forEach((el) => {
      if (el.id && data[el.id] !== undefined) {
        if (el.type === 'checkbox') {
          (el as HTMLInputElement).checked = data[el.id] as boolean;
        } else {
          el.value = data[el.id] as string;
        }
      }
    });
    return true;
  },

  clear(): void {
    removeFromStorage(CONFIG.STORAGE_KEYS.DATA);
  },
};

/**
 * API key manager - securely stores the Gemini API key in localStorage
 */
export const ApiKeyManager = {
  save(key: string): void {
    saveToStorage(CONFIG.STORAGE_KEYS.API_KEY, key);
  },

  get(): string | null {
    return loadFromStorage<string | null>(CONFIG.STORAGE_KEYS.API_KEY, null);
  },

  clear(): void {
    removeFromStorage(CONFIG.STORAGE_KEYS.API_KEY);
  },

  exists(): boolean {
    return !!this.get();
  },
};

/**
 * Model manager - stores the selected Gemini model
 */
export const ModelManager = {
  save(model: string): void {
    saveToStorage(CONFIG.STORAGE_KEYS.MODEL, model);
  },

  get(): string {
    return loadFromStorage<string>(CONFIG.STORAGE_KEYS.MODEL, CONFIG.API.MODEL);
  },

  init(): void {
    // Set the current model from storage or default
    const model = this.get();
    // Note: CONFIG.API.MODEL is readonly, so we track the selected model separately
    return model ? undefined : undefined;
  },
};

/**
 * Background manager - stores custom background images
 */
export const BackgroundManager = {
  save(dataUrl: string): void {
    saveToStorage(CONFIG.STORAGE_KEYS.BACKGROUND, dataUrl);
  },

  get(): string | null {
    return loadFromStorage<string | null>(CONFIG.STORAGE_KEYS.BACKGROUND, null);
  },

  clear(): void {
    removeFromStorage(CONFIG.STORAGE_KEYS.BACKGROUND);
  },

  apply(element: HTMLElement): void {
    const bg = this.get();
    if (bg) {
      element.style.backgroundImage = `url(${bg})`;
    }
  },
};
