/**
 * Main Application Module
 * Initializes and coordinates all application components
 */

import { CONFIG } from './config.js';
import { FormDataManager, ApiKeyManager, BackgroundManager } from './storage.js';
import { parseWithAI } from './api.js';
import { voiceManager } from './voice.js';
import {
  StatusManager,
  ToastManager,
  ModalManager,
  BlockManager,
  SettingsManager,
  copyToClipboard
} from './ui.js';
import { generateNotePreview, assembleHistoryBlock, getFullNoteText } from './note-generator.js';
import { populateForm } from './form-populator.js';
import { debounce } from './utils.js';

/**
 * Application state
 */
const state = {
  allFormElements: [],
  allSections: [],
  modalManager: null,
  blockManager: null,
  settingsManager: null
};

/**
 * Initialize DOM element references
 */
function initElements() {
  return {
    // Containers
    blockContainer: document.getElementById('blockContainer'),
    sectionsContainer: document.getElementById('sectionsContainer'),
    noteOutputEl: document.getElementById('noteOutput'),
    outputContainer: document.getElementById('noteOutputContainer'),

    // Modal
    modalOverlay: document.getElementById('modalOverlay'),
    modalBody: document.getElementById('modalBody'),
    modalClose: document.getElementById('modalClose'),

    // Buttons
    copyFullNoteBtn: document.getElementById('copyFullNoteBtn'),
    copyHistoryBtn: document.getElementById('copyHistoryBtn'),
    parseBtn: document.getElementById('parseBtn'),
    voiceBtn: document.getElementById('voiceBtn'),
    clearAiBtn: document.getElementById('clearAiBtn'),
    saveApiKeyBtn: document.getElementById('saveApiKey'),
    clearApiKeyBtn: document.getElementById('clear-api-key'),
    clearDataBtn: document.getElementById('clear-data'),
    resetBackgroundBtn: document.getElementById('reset-background'),

    // AI Panel
    aiInputArea: document.getElementById('aiInputArea'),
    aiStatus: document.getElementById('aiStatus'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    apiKeyStatus: document.getElementById('apiKeyStatus'),
    apiKeySetup: document.getElementById('apiKeySetup'),
    voiceLangSelect: document.getElementById('voiceLang'),
    voiceIcon: document.getElementById('voiceIcon'),
    voiceText: document.getElementById('voiceText'),

    // Settings
    settingsContainer: document.getElementById('settings-container'),
    settingsGear: document.getElementById('settings-gear'),
    settingsMenu: document.getElementById('settings-menu'),
    backgroundInput: document.getElementById('background-input'),

    // Toast
    copyToast: document.getElementById('copy-toast')
  };
}

/**
 * Update UI state based on form content
 */
function updateUIState(elements) {
  const allFilled = state.blockManager.updateAll(state.allSections);
  elements.copyFullNoteBtn.classList.toggle('ready', allFilled);
  generateNotePreview(elements.noteOutputEl);
}

/**
 * Save data with debouncing
 */
const debouncedSave = debounce(() => {
  FormDataManager.save(state.allFormElements);
}, CONFIG.UI.DEBOUNCE_DELAY_MS);

/**
 * Handle save and UI update
 */
function saveAndUpdate(elements) {
  debouncedSave();
  updateUIState(elements);
}

/**
 * Check and display API key status
 */
function checkApiKey(elements) {
  if (ApiKeyManager.exists()) {
    elements.apiKeySetup.style.display = 'none';
    elements.parseBtn.disabled = false;
    return true;
  }
  elements.parseBtn.disabled = true;
  return false;
}

/**
 * Set up API key management
 */
function setupApiKeyManagement(elements) {
  elements.saveApiKeyBtn.addEventListener('click', () => {
    const key = elements.apiKeyInput.value.trim();
    if (key) {
      ApiKeyManager.save(key);
      elements.apiKeyStatus.textContent = ' ✓ Saved!';
      elements.apiKeyStatus.className = 'api-key-saved';
      setTimeout(() => {
        elements.apiKeySetup.style.display = 'none';
        elements.parseBtn.disabled = false;
      }, 1000);
    }
  });

  elements.clearApiKeyBtn.addEventListener('click', () => {
    ApiKeyManager.clear();
    elements.apiKeySetup.style.display = 'block';
    elements.apiKeyInput.value = '';
    elements.apiKeyStatus.textContent = '';
    elements.parseBtn.disabled = true;
    state.settingsManager.close();
  });
}

/**
 * Set up AI parsing
 */
function setupAIParsing(elements) {
  elements.parseBtn.addEventListener('click', async () => {
    elements.parseBtn.disabled = true;

    await parseWithAI(elements.aiInputArea.value.trim(), {
      onStatus: (message, type) => {
        StatusManager.show(message, type);
      },
      onSuccess: (data) => {
        populateForm(data);
        saveAndUpdate(elements);
        setTimeout(() => StatusManager.hide(), CONFIG.UI.STATUS_HIDE_DELAY_MS);
      },
      onError: () => {
        // Error already displayed via onStatus
      }
    });

    elements.parseBtn.disabled = !ApiKeyManager.exists();
  });

  elements.clearAiBtn.addEventListener('click', () => {
    elements.aiInputArea.value = '';
    StatusManager.hide();
  });
}

/**
 * Set up voice recognition
 */
function setupVoiceRecognition(elements) {
  const updateVoiceUI = (recording) => {
    elements.voiceBtn.classList.toggle('recording', recording);
    elements.voiceIcon.textContent = recording ? '⏹️' : '🎤';
    elements.voiceText.textContent = voiceManager.getButtonText(recording);
  };

  // Language change
  elements.voiceLangSelect.addEventListener('change', () => {
    voiceManager.setLanguage(elements.voiceLangSelect.value);
    updateVoiceUI(voiceManager.getIsRecording());
  });

  // Set up voice callbacks
  voiceManager.setCallbacks({
    onResult: (transcript) => {
      elements.aiInputArea.value += transcript;
    },
    onError: (message) => {
      StatusManager.show(message, 'error');
      updateVoiceUI(false);
    },
    onStart: () => {
      StatusManager.show(voiceManager.getListeningText(), 'loading');
    },
    onEnd: () => {
      StatusManager.hide();
    }
  });

  // Toggle recording
  elements.voiceBtn.addEventListener('click', () => {
    const recording = voiceManager.toggle();
    updateVoiceUI(recording);

    if (!recording) {
      StatusManager.hide();
    }
  });
}

/**
 * Set up copy buttons
 */
function setupCopyButtons(elements) {
  elements.copyFullNoteBtn.addEventListener('click', async () => {
    const fullText = getFullNoteText(elements.noteOutputEl);
    const success = await copyToClipboard(fullText);
    if (success) {
      ToastManager.show('Full Note Copied!');
    }
  });

  elements.copyHistoryBtn.addEventListener('click', async () => {
    const historyText = assembleHistoryBlock();
    const success = await copyToClipboard(historyText);
    if (success) {
      ToastManager.show('History Block Copied!');
    }
  });

  // Section copy buttons (delegated)
  elements.outputContainer.addEventListener('click', async (e) => {
    const btn = e.target.closest('.copy-section-btn');
    if (btn) {
      const content = btn.closest('.output-section').querySelector('.output-content').innerText;
      const success = await copyToClipboard(content);
      if (success) {
        const originalText = btn.textContent;
        btn.textContent = '✔️';
        setTimeout(() => { btn.textContent = originalText; }, 1500);
      }
    }
  });
}

/**
 * Set up settings menu
 */
function setupSettings(elements) {
  state.settingsManager = new SettingsManager(
    elements.settingsContainer,
    elements.settingsGear,
    elements.settingsMenu
  );

  // Clear data
  elements.clearDataBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all data for a new patient? This cannot be undone.')) {
      FormDataManager.clear();
      location.reload();
    }
  });

  // Background image
  elements.backgroundInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const bgDataUrl = event.target.result;
      document.body.style.backgroundImage = `url(${bgDataUrl})`;
      BackgroundManager.save(bgDataUrl);
    };
    reader.readAsDataURL(file);
  });

  elements.resetBackgroundBtn.addEventListener('click', () => {
    document.body.style.backgroundImage = '';
    BackgroundManager.clear();
  });
}

/**
 * Set up modal and blocks
 */
function setupModalAndBlocks(elements) {
  // Modal
  state.modalManager = new ModalManager(
    elements.modalOverlay,
    elements.modalBody,
    elements.modalClose,
    elements.sectionsContainer
  );

  state.modalManager.setOnClose(() => {
    saveAndUpdate(elements);
  });

  // Blocks
  state.blockManager = new BlockManager(
    elements.blockContainer,
    elements.sectionsContainer
  );

  state.blockManager.init(state.allSections);
  state.blockManager.setOnClick((sectionId) => {
    state.modalManager.open(sectionId);
  });
}

/**
 * Main initialization
 */
function init() {
  const elements = initElements();

  // Get all form elements and sections
  state.allFormElements = Array.from(
    elements.sectionsContainer.querySelectorAll('input, textarea')
  );
  state.allSections = Array.from(
    elements.sectionsContainer.querySelectorAll('section')
  );

  // Initialize UI managers
  StatusManager.init(elements.aiStatus);
  ToastManager.init(elements.copyToast);

  // Set up all features
  setupModalAndBlocks(elements);
  setupApiKeyManagement(elements);
  setupAIParsing(elements);
  setupVoiceRecognition(elements);
  setupCopyButtons(elements);
  setupSettings(elements);

  // Auto-save on input
  elements.sectionsContainer.addEventListener('input', () => saveAndUpdate(elements));

  // Load saved data
  FormDataManager.load(state.allFormElements);
  BackgroundManager.apply(document.body);
  checkApiKey(elements);

  // Initial UI update
  updateUIState(elements);

  console.log('Admission Note Builder initialized');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
