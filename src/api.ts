/**
 * API module for the Admission Note Builder
 * Handles communication with the Gemini AI API
 */

import { CONFIG, AI_PROMPT_TEMPLATE } from './config';
import { ApiKeyManager, ModelManager } from './storage';
import {
  ApiError,
  NetworkError,
  logError,
  getErrorMessage,
  isRetryableError,
  calculateRetryDelay,
} from './errors';
import { sleep, extractJsonFromText, isOnline } from './utils';
import type { ImageData, ParseCallbacks, ClinicalData, GeminiResponse, GeminiPart } from './types';

/**
 * Image manager for multimodal parsing
 */
export const ImageManager = {
  currentImage: null as ImageData | null,

  setImage(base64: string, mimeType: string, fileName: string): void {
    this.currentImage = { base64, mimeType, fileName };
  },

  clear(): void {
    this.currentImage = null;
  },

  hasImage(): boolean {
    return this.currentImage !== null;
  },

  getImage(): ImageData | null {
    return this.currentImage;
  },
};

/**
 * Parse clinical notes with the Gemini AI
 * Supports both text and image inputs (multimodal)
 */
export async function parseWithAI(
  inputText: string,
  callbacks: ParseCallbacks = {}
): Promise<ClinicalData | null> {
  const { onStatus, onSuccess, onError } = callbacks;
  const apiKey = ApiKeyManager.get();
  const hasImage = ImageManager.hasImage();
  const hasText = inputText?.trim();

  if (!apiKey) {
    onStatus?.('Please enter your Gemini API key first.', 'error');
    return null;
  }

  if (!hasText && !hasImage) {
    onStatus?.('Please enter some notes or upload an image to parse.', 'error');
    return null;
  }

  const model = ModelManager.get();
  const url = `${CONFIG.API.BASE_URL}/${model}:generateContent?key=${apiKey}`;

  // Build parts array for multimodal request
  const parts: GeminiPart[] = [];

  // Add text prompt
  const textContent = hasText ? inputText : '(See attached image for clinical notes)';
  parts.push({ text: AI_PROMPT_TEMPLATE.replace('{{CLINICAL_NOTES}}', textContent) });

  // Add image if present (Gemini multimodal format)
  if (hasImage) {
    const img = ImageManager.getImage();
    if (img) {
      parts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.base64,
        },
      });
    }
  }

  const body = {
    contents: [{ parts }],
    generationConfig: {
      temperature: CONFIG.API.TEMPERATURE,
      maxOutputTokens: CONFIG.API.MAX_OUTPUT_TOKENS,
    },
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < CONFIG.RETRY.MAX_ATTEMPTS; attempt++) {
    try {
      const statusMsg = hasImage
        ? attempt === 0
          ? 'Parsing image and notes with AI... This may take a few seconds.'
          : `Retrying... (attempt ${attempt + 1}/${CONFIG.RETRY.MAX_ATTEMPTS})`
        : attempt === 0
          ? 'Parsing with AI... This may take a few seconds.'
          : `Retrying... (attempt ${attempt + 1}/${CONFIG.RETRY.MAX_ATTEMPTS})`;
      onStatus?.(statusMsg, 'loading');

      if (!isOnline()) {
        throw new NetworkError('You appear to be offline.');
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorDetails: { error?: { message?: string } } | null = null;
        try {
          errorDetails = (await response.json()) as { error?: { message?: string } };
        } catch {
          // Ignore JSON parse errors
        }
        throw new ApiError(
          errorDetails?.error?.message || `API request failed: ${response.status}`,
          response.status,
          errorDetails
        );
      }

      const data = (await response.json()) as GeminiResponse;
      console.log('[Gemini Response]', JSON.stringify(data, null, 2));

      // Check for finish reason issues
      const candidate = data?.candidates?.[0];
      const finishReason = candidate?.finishReason;
      if (finishReason && finishReason !== 'STOP') {
        console.warn('[Gemini] Finish reason:', finishReason);
        if (finishReason === 'MAX_TOKENS') {
          console.warn('[Gemini] Response was truncated due to max tokens limit');
        }
      }

      // Handle different response formats (Gemini 2.x vs 3.x)
      let text: string | null = null;
      if (candidate?.content?.parts) {
        const responseParts = candidate.content.parts;
        console.log('[Gemini] Number of parts:', responseParts.length);

        // Strategy 1: Find the part that looks most like JSON output
        for (const part of responseParts) {
          if (part.text) {
            const trimmed = part.text.trim();
            if (trimmed.startsWith('{') || trimmed.startsWith('```json')) {
              text = part.text;
              console.log('[Gemini] Found JSON-like part');
              break;
            }
          }
        }

        // Strategy 2: If no JSON-like part, look for any part containing { and }
        if (!text) {
          for (const part of responseParts) {
            if (part.text && part.text.includes('{') && part.text.includes('}')) {
              text = part.text;
              console.log('[Gemini] Found part containing JSON object');
              break;
            }
          }
        }

        // Strategy 3: Fallback to last non-empty text part
        if (!text) {
          for (let i = responseParts.length - 1; i >= 0; i--) {
            const part = responseParts[i];
            if (part?.text?.trim()) {
              text = part.text;
              console.log('[Gemini] Using last text part as fallback');
              break;
            }
          }
        }
      }

      if (!text) {
        console.error('[Gemini] No text found in response. Full response:', data);
        throw new Error(
          'Empty response from AI. The model returned no text content. Try using Gemini 2.0 Flash.'
        );
      }

      const parsed = JSON.parse(extractJsonFromText(text)) as ClinicalData;
      onStatus?.('Successfully parsed and populated form fields!', 'success');
      onSuccess?.(parsed);
      return parsed;
    } catch (error) {
      lastError = error as Error;
      logError(error, { attempt, hasImage });

      if (isRetryableError(error) && attempt < CONFIG.RETRY.MAX_ATTEMPTS - 1) {
        const delay = calculateRetryDelay(attempt, CONFIG.RETRY);
        onStatus?.(`Rate limited. Retrying in ${Math.round(delay / 1000)} seconds...`, 'loading');
        await sleep(delay);
        continue;
      }
      break;
    }
  }

  onStatus?.(getErrorMessage(lastError), 'error');
  onError?.(lastError as Error);
  return null;
}
