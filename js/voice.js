/**
 * Voice Recognition Module
 * Handles speech-to-text functionality
 */

import { CONFIG } from './config.js';
import { logError } from './errors.js';

/**
 * Check if voice recognition is supported
 * @returns {boolean} True if supported
 */
export function isVoiceSupported() {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

/**
 * Get user-friendly error message for voice errors
 * @param {string} errorType - Error type from SpeechRecognition
 * @param {boolean} isChinese - Whether to return Chinese message
 * @returns {string} Error message
 */
function getVoiceErrorMessage(errorType, isChinese) {
  const messages = {
    'not-allowed': {
      zh: '麥克風權限被拒絕。請允許麥克風訪問。',
      en: 'Microphone permission denied. Please allow microphone access.'
    },
    'no-speech': {
      zh: '沒有偵測到語音。請再試一次。',
      en: 'No speech detected. Please try again.'
    },
    'network': {
      zh: '網路錯誤。語音辨識需要網路連線。',
      en: 'Network error. Voice recognition requires an internet connection.'
    },
    'audio-capture': {
      zh: '無法存取麥克風。請檢查麥克風設定。',
      en: 'Could not access microphone. Please check your microphone settings.'
    },
    'aborted': {
      zh: '語音辨識已取消。',
      en: 'Voice recognition was aborted.'
    },
    'default': {
      zh: '語音辨識錯誤',
      en: 'Voice recognition error'
    }
  };

  const msg = messages[errorType] || messages['default'];
  return isChinese ? msg.zh : msg.en;
}

/**
 * Voice Recognition Manager
 * Provides a clean interface for voice recognition
 */
export class VoiceRecognitionManager {
  constructor() {
    this.recognition = null;
    this.isRecording = false;
    this.language = CONFIG.VOICE.DEFAULT_LANGUAGE;
    this.callbacks = {
      onResult: null,
      onError: null,
      onStart: null,
      onEnd: null,
      onInterim: null
    };
  }

  /**
   * Initialize speech recognition
   * @returns {boolean} True if successful
   */
  init() {
    if (!isVoiceSupported()) {
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.language;

    this._setupEventListeners();
    return true;
  }

  /**
   * Set up event listeners for recognition
   * @private
   */
  _setupEventListeners() {
    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        this.callbacks.onResult?.(finalTranscript);
      }

      if (interimTranscript) {
        this.callbacks.onInterim?.(interimTranscript);
      }
    };

    this.recognition.onerror = (event) => {
      const isChinese = this.language === CONFIG.VOICE.LANGUAGES.CHINESE;
      const errorMessage = getVoiceErrorMessage(event.error, isChinese);

      logError(new Error(`Voice recognition error: ${event.error}`), {
        errorType: event.error,
        language: this.language
      });

      // Auto-stop on error
      this.stop();

      this.callbacks.onError?.(errorMessage, event.error);
    };

    this.recognition.onend = () => {
      // Auto-restart if still supposed to be recording
      // (browser sometimes stops recognition automatically)
      if (this.isRecording) {
        try {
          this.recognition.start();
        } catch (e) {
          // Recognition was already started, ignore
        }
      } else {
        this.callbacks.onEnd?.();
      }
    };

    this.recognition.onstart = () => {
      this.callbacks.onStart?.();
    };
  }

  /**
   * Set callbacks for recognition events
   * @param {Object} callbacks - Callback functions
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Set recognition language
   * @param {string} lang - Language code (e.g., 'zh-TW', 'en-US')
   */
  setLanguage(lang) {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  /**
   * Check if currently using Chinese language
   * @returns {boolean} True if Chinese
   */
  isChinese() {
    return this.language === CONFIG.VOICE.LANGUAGES.CHINESE;
  }

  /**
   * Start voice recognition
   * @returns {boolean} True if started successfully
   */
  start() {
    if (!this.recognition) {
      if (!this.init()) {
        this.callbacks.onError?.(
          this.isChinese()
            ? '此瀏覽器不支援語音辨識。請使用 Chrome。'
            : 'Voice recognition not supported in this browser. Try Chrome.',
          'not-supported'
        );
        return false;
      }
    }

    // Re-init to use current language setting
    this.recognition.lang = this.language;

    try {
      this.isRecording = true;
      this.recognition.start();
      return true;
    } catch (error) {
      // Handle case where recognition is already started
      if (error.message.includes('already started')) {
        return true;
      }
      logError(error, { context: 'Voice recognition start' });
      this.isRecording = false;
      return false;
    }
  }

  /**
   * Stop voice recognition
   */
  stop() {
    this.isRecording = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
    }
  }

  /**
   * Toggle recording state
   * @returns {boolean} New recording state
   */
  toggle() {
    if (this.isRecording) {
      this.stop();
    } else {
      this.start();
    }
    return this.isRecording;
  }

  /**
   * Get current recording state
   * @returns {boolean} True if recording
   */
  getIsRecording() {
    return this.isRecording;
  }

  /**
   * Get localized button text
   * @param {boolean} recording - Current recording state
   * @returns {string} Button text
   */
  getButtonText(recording = this.isRecording) {
    if (recording) {
      return this.isChinese() ? '停止錄音' : 'Stop Recording';
    }
    return this.isChinese() ? '開始錄音' : 'Start Recording';
  }

  /**
   * Get localized status text
   * @returns {string} Status text
   */
  getListeningText() {
    return this.isChinese()
      ? '正在聆聽... 請清楚說話'
      : 'Listening... Speak clearly.';
  }
}

// Export singleton instance
export const voiceManager = new VoiceRecognitionManager();
