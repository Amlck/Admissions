/**
 * Form-related types for the Admission Note Builder
 */

export interface FormElementData {
  [id: string]: string | boolean;
}

export type FormElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export interface VoiceCallbacks {
  onResult?: (transcript: string) => void;
  onError?: (message: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface VoiceLanguages {
  CHINESE: string;
  ENGLISH: string;
}
