/**
 * Main entry point for the Admission Note Builder
 * Initializes the application and sets up event handlers
 */

import { CONFIG } from './config';
import { FormDataManager, ApiKeyManager, ModelManager, BackgroundManager } from './storage';
import { parseWithAI, ImageManager } from './api';
import { voiceManager } from './voice';
import {
  StatusManager,
  ToastManager,
  ProgressManager,
  copyToClipboard,
} from './ui';
import { generateNotePreview, assembleHistoryBlock } from './note-generator';
import { populateForm } from './form-populator';
import { debounce } from './utils';
import { getErrorMessage } from './errors';
import type { FormElement } from './types';

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  // Get container elements
  const _sectionsContainer = document.getElementById('sectionsContainer');
  const _blockContainer = document.getElementById('blockContainer');

  if (!_sectionsContainer || !_blockContainer) {
    console.error('Required container elements not found');
    return;
  }

  // Re-assign for closure type narrowing
  const sectionsContainer = _sectionsContainer;
  const blockContainer = _blockContainer;

  // Get all form elements and sections
  const allFormElements = Array.from(
    sectionsContainer.querySelectorAll('input, textarea')
  ) as FormElement[];
  const allSections = Array.from(sectionsContainer.querySelectorAll('section'));
  const blocks: Record<string, HTMLElement> = {};

  // Modal elements (with non-null assertion after guard)
  const _modalOverlay = document.getElementById('modalOverlay');
  const _modalBody = document.getElementById('modalBody');
  const _modalClose = document.getElementById('modalClose');
  const _noteOutputEl = document.getElementById('noteOutput');

  if (!_modalOverlay || !_modalBody || !_modalClose || !_noteOutputEl) {
    console.error('Required modal elements not found');
    return;
  }

  // Re-assign to const for closure type narrowing
  const modalOverlay = _modalOverlay;
  const modalBody = _modalBody;
  const modalClose = _modalClose;
  const noteOutputEl = _noteOutputEl;

  // Initialize UI managers
  const aiStatusEl = document.getElementById('aiStatus');
  const copyToastEl = document.getElementById('copy-toast');
  if (aiStatusEl) StatusManager.init(aiStatusEl);
  if (copyToastEl) ToastManager.init(copyToastEl);

  // Build section blocks
  allSections.forEach((section) => {
    const block = document.createElement('div');
    block.className = 'block';
    block.dataset.sectionId = section.id;
    block.innerHTML = `<h2>${section.dataset.title || 'Section'}</h2>`;
    blockContainer.appendChild(block);
    blocks[section.id] = block;
  });

  // Check if a section has any filled content
  function isSectionFilled(section: HTMLElement): boolean {
    for (const input of section.querySelectorAll('input[type="text"], textarea')) {
      if ((input as HTMLInputElement).value.trim()) return true;
    }
    for (const cb of section.querySelectorAll('input[type="checkbox"]')) {
      if ((cb as HTMLInputElement).checked) return true;
    }
    return false;
  }

  // Update UI state based on form content
  function updateUIState(): void {
    let allFilled = true;
    allSections.forEach((section) => {
      const filled = isSectionFilled(section);
      blocks[section.id]?.classList.toggle('completed', filled);
      if (!filled) allFilled = false;
    });
    document.getElementById('copyFullNoteBtn')?.classList.toggle('ready', allFilled);
    generateNotePreview(noteOutputEl);
  }

  // Debounced save function
  const debouncedSave = debounce(() => {
    FormDataManager.save(allFormElements);
    updateUIState();
  }, CONFIG.UI.DEBOUNCE_DELAY_MS);

  // Modal functions
  function openModal(sectionId: string): void {
    const section = document.getElementById(sectionId);
    if (section) {
      modalBody.appendChild(section);
      modalOverlay.style.display = 'flex';
      requestAnimationFrame(() => modalOverlay.classList.add('active'));
    }
  }

  function closeModal(): void {
    modalOverlay.classList.remove('active');
    setTimeout(() => {
      modalOverlay.style.display = 'none';
      const s = modalBody.querySelector('section');
      if (s) {
        sectionsContainer.appendChild(s);
        debouncedSave();
      }
    }, CONFIG.UI.MODAL_ANIMATION_MS);
  }

  // Block click handlers
  blockContainer.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('.block') as HTMLElement | null;
    if (b?.dataset.sectionId) openModal(b.dataset.sectionId);
  });

  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // API Key handling
  const apiKeySetup = document.getElementById('apiKeySetup');
  const parseBtn = document.getElementById('parseBtn') as HTMLButtonElement | null;

  function checkApiKey(): boolean {
    if (ApiKeyManager.exists()) {
      if (apiKeySetup) apiKeySetup.style.display = 'none';
      if (parseBtn) parseBtn.disabled = false;
      return true;
    }
    if (parseBtn) parseBtn.disabled = true;
    return false;
  }

  document.getElementById('saveApiKey')?.addEventListener('click', () => {
    const keyInput = document.getElementById('apiKeyInput') as HTMLInputElement | null;
    const key = keyInput?.value.trim();
    if (key) {
      ApiKeyManager.save(key);
      const statusEl = document.getElementById('apiKeyStatus');
      if (statusEl) statusEl.textContent = ' ✓ Saved!';
      setTimeout(() => {
        if (apiKeySetup) apiKeySetup.style.display = 'none';
        if (parseBtn) parseBtn.disabled = false;
      }, 1000);
    }
  });

  document.getElementById('clear-api-key')?.addEventListener('click', () => {
    ApiKeyManager.clear();
    if (apiKeySetup) apiKeySetup.style.display = 'block';
    const keyInput = document.getElementById('apiKeyInput') as HTMLInputElement | null;
    if (keyInput) keyInput.value = '';
    const statusEl = document.getElementById('apiKeyStatus');
    if (statusEl) statusEl.textContent = '';
    if (parseBtn) parseBtn.disabled = true;
    const settingsMenu = document.getElementById('settings-menu');
    if (settingsMenu) settingsMenu.style.display = 'none';
  });

  // AI Parsing
  parseBtn?.addEventListener('click', async () => {
    parseBtn.disabled = true;
    ProgressManager.start();

    const aiInput = document.getElementById('aiInputArea') as HTMLTextAreaElement | null;
    await parseWithAI(aiInput?.value.trim() || '', {
      onStatus: (msg, type) => StatusManager.show(msg, type),
      onSuccess: (data) => {
        ProgressManager.complete();
        populateForm(data);
        debouncedSave();
        setTimeout(() => StatusManager.hide(), CONFIG.UI.STATUS_HIDE_DELAY_MS);
      },
      onError: (error) => {
        ProgressManager.error(getErrorMessage(error));
      },
    });

    parseBtn.disabled = !ApiKeyManager.exists();
  });

  // Clear AI input
  document.getElementById('clearAiBtn')?.addEventListener('click', () => {
    const aiInput = document.getElementById('aiInputArea') as HTMLTextAreaElement | null;
    if (aiInput) aiInput.value = '';
    clearUploadedImage();
    StatusManager.hide();
  });

  // Image upload handling
  const imageInput = document.getElementById('imageInput') as HTMLInputElement | null;
  const imageFileName = document.getElementById('imageFileName');
  const clearImageBtn = document.getElementById('clearImageBtn');
  const imagePreview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg') as HTMLImageElement | null;

  function clearUploadedImage(): void {
    ImageManager.clear();
    if (imageInput) imageInput.value = '';
    if (imageFileName) imageFileName.textContent = '';
    if (clearImageBtn) clearImageBtn.style.display = 'none';
    if (imagePreview) imagePreview.style.display = 'none';
    if (previewImg) previewImg.src = '';
  }

  imageInput?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      StatusManager.show('Please select an image file.', 'error');
      return;
    }

    // Validate file size (max 10MB for Gemini)
    if (file.size > 10 * 1024 * 1024) {
      StatusManager.show('Image too large. Please use an image under 10MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const base64Data = dataUrl.split(',')[1];
      const mimeType = file.type;

      ImageManager.setImage(base64Data ?? '', mimeType, file.name);

      // Update UI
      if (imageFileName) imageFileName.textContent = file.name;
      if (clearImageBtn) clearImageBtn.style.display = 'inline-flex';
      if (previewImg) previewImg.src = dataUrl;
      if (imagePreview) imagePreview.style.display = 'block';

      StatusManager.show('Image uploaded. Click "Parse with AI" to process.', 'success');
      setTimeout(() => StatusManager.hide(), 2000);
    };

    reader.onerror = () => {
      StatusManager.show('Failed to read image file.', 'error');
    };

    reader.readAsDataURL(file);
  });

  clearImageBtn?.addEventListener('click', clearUploadedImage);

  // Voice recognition
  const voiceBtn = document.getElementById('voiceBtn');
  const voiceIcon = document.getElementById('voiceIcon');
  const voiceText = document.getElementById('voiceText');
  const voiceLang = document.getElementById('voiceLang') as HTMLSelectElement | null;

  function updateVoiceUI(recording: boolean): void {
    voiceBtn?.classList.toggle('recording', recording);
    if (voiceIcon) voiceIcon.textContent = recording ? '⏹️' : '🎤';
    if (voiceText) voiceText.textContent = voiceManager.getButtonText(recording);
  }

  voiceLang?.addEventListener('change', () => {
    voiceManager.setLanguage(voiceLang.value);
    updateVoiceUI(voiceManager.getIsRecording());
  });

  voiceManager.setCallbacks({
    onResult: (t) => {
      const aiInput = document.getElementById('aiInputArea') as HTMLTextAreaElement | null;
      if (aiInput) aiInput.value += t;
    },
    onError: (msg) => {
      StatusManager.show(msg, 'error');
      updateVoiceUI(false);
    },
    onStart: () => StatusManager.show(voiceManager.getListeningText(), 'loading'),
    onEnd: () => StatusManager.hide(),
  });

  voiceBtn?.addEventListener('click', () => {
    const r = voiceManager.toggle();
    updateVoiceUI(r);
    if (!r) StatusManager.hide();
  });

  // Copy buttons
  document.getElementById('copyFullNoteBtn')?.addEventListener('click', async () => {
    if (await copyToClipboard(noteOutputEl.innerText)) {
      ToastManager.show('Full Note Copied!');
    }
  });

  document.getElementById('copyHistoryBtn')?.addEventListener('click', async () => {
    if (await copyToClipboard(assembleHistoryBlock())) {
      ToastManager.show('History Block Copied!');
    }
  });

  document.getElementById('noteOutputContainer')?.addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement).closest('.copy-section-btn') as HTMLButtonElement | null;
    if (btn) {
      const content = btn.closest('.output-section')?.querySelector('.output-content')?.textContent;
      if (content && (await copyToClipboard(content))) {
        btn.textContent = '✔️';
        setTimeout(() => (btn.textContent = '📋'), 1500);
      }
    }
  });

  // Settings menu
  const settingsGear = document.getElementById('settings-gear');
  const settingsMenu = document.getElementById('settings-menu');
  const settingsContainer = document.getElementById('settings-container');

  settingsGear?.addEventListener('click', () => {
    if (settingsMenu) {
      settingsMenu.style.display = settingsMenu.style.display === 'block' ? 'none' : 'block';
    }
  });

  document.addEventListener('click', (e) => {
    if (
      settingsContainer &&
      !settingsContainer.contains(e.target as Node) &&
      settingsMenu?.style.display === 'block'
    ) {
      settingsMenu.style.display = 'none';
    }
  });

  // Clear data for new patient
  document.getElementById('clear-data')?.addEventListener('click', () => {
    if (confirm('Clear all data for new patient?')) {
      FormDataManager.clear();
      location.reload();
    }
  });

  // Background customization
  document.getElementById('background-input')?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      document.body.style.backgroundImage = `url(${result})`;
      BackgroundManager.save(result);
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('reset-background')?.addEventListener('click', () => {
    document.body.style.backgroundImage = '';
    BackgroundManager.clear();
  });

  // Auto-save on form changes
  sectionsContainer.addEventListener('input', () => debouncedSave());

  // Model selector
  const modelSelect = document.getElementById('modelSelect') as HTMLSelectElement | null;
  ModelManager.init();
  if (modelSelect) {
    modelSelect.value = ModelManager.get();
    modelSelect.addEventListener('change', () => {
      ModelManager.save(modelSelect.value);
      console.log('[Model changed]', modelSelect.value);
    });
  }

  // Initialize application
  FormDataManager.load(allFormElements);
  BackgroundManager.apply(document.body);
  checkApiKey();
  updateUIState();

  console.log('Admission Note Builder initialized with model:', ModelManager.get());
});
