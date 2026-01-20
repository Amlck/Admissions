/**
 * Tests for storage module
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveToStorage,
  loadFromStorage,
  removeFromStorage,
  ApiKeyManager,
  ModelManager,
  BackgroundManager,
} from '../../src/storage';

describe('Storage - Basic Functions', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('saveToStorage', () => {
    it('should save string values', () => {
      saveToStorage('testKey', 'testValue');
      expect(localStorage.setItem).toHaveBeenCalledWith('testKey', 'testValue');
    });

    it('should stringify object values', () => {
      saveToStorage('testKey', { a: 1 });
      expect(localStorage.setItem).toHaveBeenCalledWith('testKey', '{"a":1}');
    });

    it('should stringify array values', () => {
      saveToStorage('testKey', [1, 2, 3]);
      expect(localStorage.setItem).toHaveBeenCalledWith('testKey', '[1,2,3]');
    });
  });

  describe('loadFromStorage', () => {
    it('should return default value when key does not exist', () => {
      const result = loadFromStorage('nonexistent', 'default');
      expect(result).toBe('default');
    });

    it('should parse JSON values', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('{"a":1}');
      const result = loadFromStorage('testKey', null);
      expect(result).toEqual({ a: 1 });
    });

    it('should return string for non-JSON values', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('plain string');
      const result = loadFromStorage('testKey', '');
      expect(result).toBe('plain string');
    });
  });

  describe('removeFromStorage', () => {
    it('should remove item from storage', () => {
      removeFromStorage('testKey');
      expect(localStorage.removeItem).toHaveBeenCalledWith('testKey');
    });
  });
});

describe('Storage - ApiKeyManager', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should save API key', () => {
    ApiKeyManager.save('test-api-key');
    expect(localStorage.setItem).toHaveBeenCalledWith('geminiApiKey', 'test-api-key');
  });

  it('should get API key', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('stored-key');
    const key = ApiKeyManager.get();
    expect(key).toBe('stored-key');
  });

  it('should return null when no key exists', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    const key = ApiKeyManager.get();
    expect(key).toBe(null);
  });

  it('should clear API key', () => {
    ApiKeyManager.clear();
    expect(localStorage.removeItem).toHaveBeenCalledWith('geminiApiKey');
  });

  it('should check if key exists', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('key');
    expect(ApiKeyManager.exists()).toBe(true);

    vi.mocked(localStorage.getItem).mockReturnValue(null);
    expect(ApiKeyManager.exists()).toBe(false);
  });
});

describe('Storage - ModelManager', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should save model selection', () => {
    ModelManager.save('gemini-2.0-flash');
    expect(localStorage.setItem).toHaveBeenCalledWith('geminiModel', 'gemini-2.0-flash');
  });

  it('should get model selection with default', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    const model = ModelManager.get();
    // Should return default from CONFIG
    expect(model).toBeDefined();
  });

  it('should get stored model selection', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('gemini-1.5-pro');
    const model = ModelManager.get();
    expect(model).toBe('gemini-1.5-pro');
  });
});

describe('Storage - BackgroundManager', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should save background', () => {
    BackgroundManager.save('data:image/png;base64,abc');
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'admissionNoteBackground',
      'data:image/png;base64,abc'
    );
  });

  it('should get background', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('data:image/png;base64,xyz');
    const bg = BackgroundManager.get();
    expect(bg).toBe('data:image/png;base64,xyz');
  });

  it('should clear background', () => {
    BackgroundManager.clear();
    expect(localStorage.removeItem).toHaveBeenCalledWith('admissionNoteBackground');
  });

  it('should apply background to element', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('data:image/png;base64,test');
    const mockElement = { style: { backgroundImage: '' } } as HTMLElement;
    BackgroundManager.apply(mockElement);
    expect(mockElement.style.backgroundImage).toBe('url(data:image/png;base64,test)');
  });

  it('should not apply background when none exists', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    const mockElement = { style: { backgroundImage: '' } } as HTMLElement;
    BackgroundManager.apply(mockElement);
    expect(mockElement.style.backgroundImage).toBe('');
  });
});
