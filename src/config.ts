/**
 * Configuration constants for the Admission Note Builder
 */

export const CONFIG = {
  STORAGE_KEYS: {
    DATA: 'admissionNoteData_AI',
    BACKGROUND: 'admissionNoteBackground',
    API_KEY: 'geminiApiKey',
    MODEL: 'geminiModel',
  },
  API: {
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models',
    MODEL: 'gemini-3-pro-preview',
    MAX_OUTPUT_TOKENS: 8192,
    TEMPERATURE: 0.1,
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY_MS: 1000,
    MAX_DELAY_MS: 10000,
    BACKOFF_MULTIPLIER: 2,
  },
  VOICE: {
    LANGUAGES: { CHINESE: 'zh-TW', ENGLISH: 'en-US' },
    DEFAULT_LANGUAGE: 'zh-TW',
  },
  UI: {
    TOAST_DURATION_MS: 2000,
    STATUS_HIDE_DELAY_MS: 3000,
    MODAL_ANIMATION_MS: 300,
    DEBOUNCE_DELAY_MS: 500,
  },
} as const;

export type Config = typeof CONFIG;

export const AI_PROMPT_TEMPLATE = `Parse clinical notes to JSON for NTUH EMR. Output in ENGLISH only (translate Chinese if needed). Use null for missing info.

IMPORTANT - NO ABBREVIATIONS: Always expand medical abbreviations to full terms. Examples:
- HTN → Hypertension
- DM → Diabetes Mellitus
- CAD → Coronary Artery Disease
- N/V → Nausea/Vomiting
- ABx → Antibiotics
- Rx → Treatment/Prescription
- Hx → History
- Dx → Diagnosis


IMPORTANT: If an image is provided, first extract ALL text from the image (including handwritten notes). The image may contain handwritten clinical notes - carefully read and transcribe everything visible. Then parse the combined text content.

Extract these fields:
- chief_complaint: brief chief complaint for admission
- age_sex: format as "*49M" or "*65F" (asterisk + age + sex)
- patient_narrative: format as "This is a XX-year-old male/female with underlying disease of\\n#. Disease 1\\n#. Disease 2\\n\\nThe patient was..."
- past_medical_history: numbered list with #. prefix
- past_surgical_history: format as "YYYY_MM_DD  Procedure name"
- hospitalization_history: format as "入院日期:YYYY_MM_DD 出院日期:YYYY_MM_DD 診斷:..."
- medication_allergy: {denied: boolean, details: string}
- current_medications: string
- family_history: {HTN, DM, DLP, Cancer, CAD, details}
- social_history: {alcohol, smoking, betel} - use "denied" or describe
- tocc: {travel, occupation, contact, cluster}
- vitals: {temperature, pulse, respiration, bp, height, weight, pain}
- physical_exam: {general, consciousness, chest, heart, abdomen, extremities, neurological, local_findings}

Generate Tentative Diagnosis (臆斷):
- diagnosis_active: format as "[Active]\\n#. Main problem for admission\\n- status post treatment if any"
- diagnosis_underlying: format as "[Underlying]\\n#. Condition 1\\n#. Condition 2"

Generate SOAP for Medical Needs and Care Plan (醫療需求與治療計畫):
- soap_s: chief complaint in bullet format "- symptom noted during..."
- soap_o_general: format as "[General]\\n- code : full/aggressive\\n- vital signs: stable/unstable\\n- Consciousness: E4V5M6"
- soap_o_local: "[Local findings]\\n- describe relevant findings"
- soap_o_lab: "[lab]\\n- Hemogram: ...\\n- BCS: ..."
- soap_o_image: "[image]\\n- CXR (-)\\n- ECG : NSR"
- soap_a_active: same as diagnosis_active
- soap_a_underlying: same as diagnosis_underlying
- soap_plan: format as "- treatment step 1\\n- treatment step 2\\n- monitoring plan"
- treatment_goal: "- goal description"

Notes:
{{CLINICAL_NOTES}}

Return only valid JSON.`;
