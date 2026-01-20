/**
 * Clinical data types for the Admission Note Builder
 * These interfaces represent the structured data parsed from clinical notes by the AI
 */

export interface Vitals {
  temperature?: string;
  pulse?: string;
  respiration?: string;
  bp?: string;
  height?: string;
  weight?: string;
  pain?: string;
}

export interface PhysicalExam {
  general?: string;
  consciousness?: string;
  chest?: string;
  heart?: string;
  abdomen?: string;
  extremities?: string;
  neurological?: string;
  local_findings?: string;
}

export interface FamilyHistory {
  HTN?: boolean;
  DM?: boolean;
  DLP?: boolean;
  Cancer?: boolean;
  CAD?: boolean;
  details?: string;
}

export interface SocialHistory {
  alcohol?: string;
  smoking?: string;
  betel?: string;
}

export interface TOCC {
  travel?: string;
  occupation?: string;
  contact?: string;
  cluster?: string;
}

export interface MedicationAllergy {
  denied: boolean;
  details?: string;
  date?: string;
}

export interface DeviceAllergy {
  denied: boolean;
  details?: string;
  date?: string;
}

/**
 * Complete clinical data structure returned by the Gemini AI
 * All fields are optional as the AI may not extract all information
 */
export interface ClinicalData {
  // Chief complaint and history
  chief_complaint?: string;
  age_sex?: string;
  patient_narrative?: string;

  // Medical history
  past_medical_history?: string;
  past_surgical_history?: string;
  hospitalization_history?: string;

  // Allergies and medications
  medication_allergy?: MedicationAllergy;
  device_allergy?: DeviceAllergy;
  current_medications?: string;

  // Family and social history
  family_history?: FamilyHistory;
  social_history?: SocialHistory;
  tocc?: TOCC;

  // Physical examination
  vitals?: Vitals;
  physical_exam?: PhysicalExam;

  // Diagnosis
  diagnosis_active?: string;
  diagnosis_underlying?: string;

  // SOAP note fields
  soap_s?: string;
  soap_o_general?: string;
  soap_o_local?: string;
  soap_o_lab?: string;
  soap_o_image?: string;
  soap_a_active?: string;
  soap_a_underlying?: string;
  soap_plan?: string;
  treatment_goal?: string;
}
