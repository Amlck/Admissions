/**
 * UI management module for the Admission Note Builder
 * Handles status messages, toasts, progress bars, and clipboard operations
 */

import { CONFIG } from './config';
import type { StatusType } from './types';

/**
 * Status message manager
 */
export const StatusManager = {
  element: null as HTMLElement | null,

  init(el: HTMLElement): void {
    this.element = el;
  },

  show(message: string, type: StatusType): void {
    if (this.element) {
      this.element.textContent = message;
      this.element.className = type;
      this.element.style.display = 'block';
    }
  },

  hide(): void {
    if (this.element) {
      this.element.className = '';
      this.element.style.display = 'none';
    }
  },

  showTimed(message: string, type: StatusType, duration = CONFIG.UI.STATUS_HIDE_DELAY_MS): void {
    this.show(message, type);
    setTimeout(() => this.hide(), duration);
  },
};

/**
 * Progress bar manager for AI parsing visual feedback
 */
export const ProgressManager = {
  container: null as HTMLElement | null,
  fill: null as HTMLElement | null,
  text: null as HTMLElement | null,
  intervalId: null as ReturnType<typeof setInterval> | null,
  currentProgress: 0,

  init(): void {
    this.container = document.getElementById('aiProgressContainer');
    this.fill = document.getElementById('aiProgressFill');
    this.text = document.getElementById('aiProgressText');
  },

  start(): void {
    if (!this.container) this.init();
    this.currentProgress = 0;

    if (this.fill) this.fill.style.width = '0%';
    if (this.container) this.container.style.display = 'block';
    if (this.text) this.text.textContent = 'Sending to AI...';

    // Animate progress: fast at start, slower as it approaches 90%
    let speed = 2;
    this.intervalId = setInterval(() => {
      if (this.currentProgress < 30) {
        speed = 3;
        if (this.text) this.text.textContent = 'Sending to AI...';
      } else if (this.currentProgress < 60) {
        speed = 1.5;
        if (this.text) this.text.textContent = 'AI is processing...';
      } else if (this.currentProgress < 85) {
        speed = 0.5;
        if (this.text) this.text.textContent = 'Parsing response...';
      } else {
        speed = 0.1;
        if (this.text) this.text.textContent = 'Almost done...';
      }
      this.currentProgress = Math.min(90, this.currentProgress + speed);
      if (this.fill) this.fill.style.width = this.currentProgress + '%';
    }, 100);
  },

  complete(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.currentProgress = 100;
    if (this.fill) this.fill.style.width = '100%';
    if (this.text) this.text.textContent = 'Done!';
    setTimeout(() => this.hide(), 1500);
  },

  error(message?: string): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.fill) this.fill.style.background = '#dc3545';
    if (this.text) this.text.textContent = message || 'Error occurred';
    setTimeout(() => {
      this.hide();
      if (this.fill) this.fill.style.background = 'linear-gradient(90deg, #4285f4, #34a853)';
    }, 3000);
  },

  hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
      if (this.fill) this.fill.style.width = '0%';
      this.currentProgress = 0;
    }
  },
};

/**
 * Toast notification manager
 */
export const ToastManager = {
  element: null as HTMLElement | null,

  init(el: HTMLElement): void {
    this.element = el;
  },

  show(message: string, duration = CONFIG.UI.TOAST_DURATION_MS): void {
    if (this.element) {
      this.element.textContent = message;
      this.element.classList.add('show');
      setTimeout(() => {
        this.element?.classList.remove('show');
      }, duration);
    }
  },
};

/**
 * Copy text to clipboard with fallback for older browsers
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const success = document.execCommand('copy');
    document.body.removeChild(ta);
    return success;
  } catch {
    return false;
  }
}
