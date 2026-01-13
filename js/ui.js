/**
 * UI Module
 * Handles all UI state management, modals, and user interactions
 */

import { CONFIG } from './config.js';

/**
 * Status display manager
 */
export const StatusManager = {
  element: null,

  /**
   * Initialize with status element
   * @param {HTMLElement} el - Status element
   */
  init(el) {
    this.element = el;
  },

  /**
   * Show status message
   * @param {string} message - Message to display
   * @param {string} type - Status type (loading, success, error)
   */
  show(message, type) {
    if (!this.element) return;
    this.element.textContent = message;
    this.element.className = type;
    this.element.style.display = 'block';
  },

  /**
   * Hide status message
   */
  hide() {
    if (!this.element) return;
    this.element.className = '';
    this.element.style.display = 'none';
  },

  /**
   * Show status and auto-hide after delay
   * @param {string} message - Message to display
   * @param {string} type - Status type
   * @param {number} delay - Delay in ms before hiding
   */
  showTimed(message, type, delay = CONFIG.UI.STATUS_HIDE_DELAY_MS) {
    this.show(message, type);
    setTimeout(() => this.hide(), delay);
  }
};

/**
 * Toast notification manager
 */
export const ToastManager = {
  element: null,

  /**
   * Initialize with toast element
   * @param {HTMLElement} el - Toast element
   */
  init(el) {
    this.element = el;
  },

  /**
   * Show toast notification
   * @param {string} message - Message to display
   * @param {number} duration - Duration in ms
   */
  show(message, duration = CONFIG.UI.TOAST_DURATION_MS) {
    if (!this.element) return;
    this.element.textContent = message;
    this.element.classList.add('show');
    setTimeout(() => this.element.classList.remove('show'), duration);
  }
};

/**
 * Modal manager
 */
export class ModalManager {
  constructor(overlay, body, closeBtn, sectionsContainer) {
    this.overlay = overlay;
    this.body = body;
    this.closeBtn = closeBtn;
    this.sectionsContainer = sectionsContainer;
    this.onClose = null;

    this._setupListeners();
  }

  /**
   * Set up event listeners
   * @private
   */
  _setupListeners() {
    this.closeBtn?.addEventListener('click', () => this.close());
    this.overlay?.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  /**
   * Open modal with specified section
   * @param {string} sectionId - ID of section to show
   */
  open(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    this.body.appendChild(section);
    this.overlay.style.display = 'flex';

    // Trigger animation after display is set
    requestAnimationFrame(() => {
      this.overlay.classList.add('active');
    });

    // Trap focus in modal
    this._trapFocus();
  }

  /**
   * Close modal
   */
  close() {
    this.overlay.classList.remove('active');

    setTimeout(() => {
      this.overlay.style.display = 'none';
      const section = this.body.querySelector('section');
      if (section && this.sectionsContainer) {
        this.sectionsContainer.appendChild(section);
      }
      this.onClose?.();
    }, CONFIG.UI.MODAL_ANIMATION_MS);
  }

  /**
   * Check if modal is open
   * @returns {boolean} True if open
   */
  isOpen() {
    return this.overlay.classList.contains('active');
  }

  /**
   * Set callback for when modal closes
   * @param {Function} callback - Callback function
   */
  setOnClose(callback) {
    this.onClose = callback;
  }

  /**
   * Trap focus within modal for accessibility
   * @private
   */
  _trapFocus() {
    const focusableElements = this.overlay.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }
}

/**
 * Block container manager for form sections
 */
export class BlockManager {
  constructor(container, sectionsContainer) {
    this.container = container;
    this.sectionsContainer = sectionsContainer;
    this.blocks = {};
    this.onClick = null;
  }

  /**
   * Initialize blocks from sections
   * @param {HTMLElement[]} sections - Array of section elements
   */
  init(sections) {
    sections.forEach(section => {
      const block = document.createElement('div');
      block.className = 'block';
      block.dataset.sectionId = section.id;
      block.innerHTML = `<h2>${section.dataset.title || 'Section'}</h2>`;

      block.addEventListener('click', () => {
        this.onClick?.(section.id);
      });

      this.container.appendChild(block);
      this.blocks[section.id] = block;
    });
  }

  /**
   * Set click handler for blocks
   * @param {Function} handler - Click handler (sectionId) => void
   */
  setOnClick(handler) {
    this.onClick = handler;
  }

  /**
   * Update block state based on section content
   * @param {HTMLElement} section - Section element
   * @returns {boolean} True if section is filled
   */
  updateBlockState(section) {
    const block = this.blocks[section.id];
    if (!block) return false;

    const isFilled = this._isSectionFilled(section);

    if (isFilled) {
      block.classList.add('completed');
    } else {
      block.classList.remove('completed');
    }

    return isFilled;
  }

  /**
   * Update all blocks
   * @param {HTMLElement[]} sections - Array of section elements
   * @returns {boolean} True if all sections are filled
   */
  updateAll(sections) {
    let allFilled = true;
    sections.forEach(section => {
      if (!this.updateBlockState(section)) {
        allFilled = false;
      }
    });
    return allFilled;
  }

  /**
   * Check if a section has content
   * @param {HTMLElement} section - Section element
   * @returns {boolean} True if has content
   * @private
   */
  _isSectionFilled(section) {
    // Check text inputs and textareas
    const inputs = section.querySelectorAll('input[type="text"], textarea');
    for (const input of inputs) {
      if (input.value.trim() !== '') return true;
    }

    // Check checkboxes
    const checkboxes = section.querySelectorAll('input[type="checkbox"]');
    for (const checkbox of checkboxes) {
      if (checkbox.checked) return true;
    }

    return false;
  }

  /**
   * Mark block as AI-filled
   * @param {string} sectionId - Section ID
   */
  markAsAiFilled(sectionId) {
    const block = this.blocks[sectionId];
    if (block) {
      block.classList.add('ai-filled');
    }
  }
}

/**
 * Settings menu manager
 */
export class SettingsManager {
  constructor(container, gear, menu) {
    this.container = container;
    this.gear = gear;
    this.menu = menu;

    this._setupListeners();
  }

  /**
   * Set up event listeners
   * @private
   */
  _setupListeners() {
    this.gear?.addEventListener('click', () => this.toggle());

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.container?.contains(e.target) && this.isOpen()) {
        this.close();
      }
    });
  }

  /**
   * Toggle menu visibility
   */
  toggle() {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Open settings menu
   */
  open() {
    if (this.menu) {
      this.menu.style.display = 'block';
    }
  }

  /**
   * Close settings menu
   */
  close() {
    if (this.menu) {
      this.menu.style.display = 'none';
    }
  }

  /**
   * Check if menu is open
   * @returns {boolean} True if open
   */
  isOpen() {
    return this.menu?.style.display === 'block';
  }
}

/**
 * Copy to clipboard utility
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} True if successful
 */
export async function copyToClipboard(text) {
  try {
    // Modern clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    return false;
  }
}
