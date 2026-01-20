/**
 * Voice recognition module for the Admission Note Builder
 * Handles speech-to-text input using the Web Speech API
 */

import { CONFIG } from './config';
import type { VoiceCallbacks } from './types';

// Extend Window interface for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

/**
 * Voice recognition manager class
 * Handles speech recognition with language switching support
 */
export class VoiceRecognitionManager {
  private recognition: SpeechRecognition | null = null;
  private isRecording = false;
  private language: string = CONFIG.VOICE.DEFAULT_LANGUAGE;
  private callbacks: VoiceCallbacks = {};

  /**
   * Initialize the speech recognition API
   */
  init(): boolean {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return false;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return false;

    this.recognition = new SpeechRecognitionAPI();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.language;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result?.[0] && result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        this.callbacks.onResult?.(finalTranscript);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.stop();
      const isChinese = this.language === CONFIG.VOICE.LANGUAGES.CHINESE;
      this.callbacks.onError?.(
        isChinese ? `語音錯誤: ${event.error}` : `Voice error: ${event.error}`
      );
    };

    this.recognition.onend = () => {
      if (this.isRecording) {
        try {
          this.recognition?.start();
        } catch {
          // Ignore restart errors
        }
      }
    };

    return true;
  }

  /**
   * Set callback functions
   */
  setCallbacks(callbacks: VoiceCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Set the recognition language
   */
  setLanguage(lang: string): void {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  /**
   * Check if current language is Chinese
   */
  isChinese(): boolean {
    return this.language === CONFIG.VOICE.LANGUAGES.CHINESE;
  }

  /**
   * Start voice recognition
   */
  start(): boolean {
    if (!this.recognition && !this.init()) {
      this.callbacks.onError?.(
        this.isChinese() ? '此瀏覽器不支援語音辨識。' : 'Voice recognition not supported.'
      );
      return false;
    }

    if (this.recognition) {
      this.recognition.lang = this.language;
    }

    try {
      this.isRecording = true;
      this.recognition?.start();
      this.callbacks.onStart?.();
      return true;
    } catch {
      this.isRecording = false;
      return false;
    }
  }

  /**
   * Stop voice recognition
   */
  stop(): void {
    this.isRecording = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore stop errors
      }
    }
    this.callbacks.onEnd?.();
  }

  /**
   * Toggle voice recognition on/off
   */
  toggle(): boolean {
    if (this.isRecording) {
      this.stop();
    } else {
      this.start();
    }
    return this.isRecording;
  }

  /**
   * Get current recording state
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Get button text based on recording state
   */
  getButtonText(recording = this.isRecording): string {
    if (recording) {
      return this.isChinese() ? '停止錄音' : 'Stop';
    }
    return this.isChinese() ? '開始錄音' : 'Start';
  }

  /**
   * Get listening status text
   */
  getListeningText(): string {
    return this.isChinese() ? '正在聆聽...' : 'Listening...';
  }
}

// Export a singleton instance
export const voiceManager = new VoiceRecognitionManager();
