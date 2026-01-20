/**
 * Form population module for the Admission Note Builder
 * Maps AI-parsed clinical data to HTML form fields
 */

import type { ClinicalData } from './types';

/**
 * Set a text field value and trigger events
 */
function setField(id: string, value: string | null | undefined): void {
  if (value == null) return;

  const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
  if (el) {
    el.value = value;
    el.classList.add('ai-populated');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

/**
 * Set a checkbox state
 */
function setCheckbox(id: string, checked: boolean | null | undefined): void {
  if (checked == null) return;

  const el = document.getElementById(id) as HTMLInputElement | null;
  if (el) {
    el.checked = checked;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

/**
 * Populate the form with AI-parsed clinical data
 */
export function populateForm(data: ClinicalData | null): void {
  if (!data) return;

  // Chief complaint and demographics
  if (data.chief_complaint) setField('ccpi', data.chief_complaint);
  if (data.age_sex) setField('plan_age_sex', data.age_sex);

  // Patient history
  if (data.patient_narrative) setField('patientHistoryNarrative', data.patient_narrative);
  if (data.past_medical_history) setField('hist_pmh', data.past_medical_history);
  if (data.past_surgical_history) setField('hist_surgical_history_detailed', data.past_surgical_history);
  if (data.hospitalization_history) setField('hist_hospitalization_history', data.hospitalization_history);

  // Medication allergy
  if (data.medication_allergy?.denied) {
    setCheckbox('hist_med_allergy_denied', true);
  } else if (data.medication_allergy?.details) {
    setField('hist_med_allergy_details', data.medication_allergy.details);
  }

  // Device allergy
  if (data.device_allergy?.denied) {
    setCheckbox('hist_device_allergy_denied', true);
  } else if (data.device_allergy?.details) {
    setField('hist_device_allergy_details', data.device_allergy.details);
  }

  // Current medications
  if (data.current_medications) setField('hist_current_med_other', data.current_medications);

  // Family history
  if (data.family_history) {
    setCheckbox('fh_HTN', data.family_history.HTN);
    setCheckbox('fh_DM', data.family_history.DM);
    setCheckbox('fh_DLP', data.family_history.DLP);
    setCheckbox('fh_CA', data.family_history.Cancer);
    setCheckbox('fh_CAD', data.family_history.CAD);
    if (data.family_history.details) setField('fh_details', data.family_history.details);
  }

  // Social history
  if (data.social_history) {
    if (data.social_history.alcohol) setField('hist_abc_alcohol', data.social_history.alcohol);
    if (data.social_history.smoking) setField('hist_abc_smoking', data.social_history.smoking);
    if (data.social_history.betel) setField('hist_abc_betel', data.social_history.betel);
  }

  // TOCC
  if (data.tocc) {
    if (data.tocc.travel) setField('hist_tocc_travel', data.tocc.travel);
    if (data.tocc.occupation) setField('hist_tocc_occupation', data.tocc.occupation);
    if (data.tocc.cluster) setField('hist_tocc_cluster', data.tocc.cluster);
    if (data.tocc.contact) setField('hist_tocc_cluster', data.tocc.contact);
  }

  // Vitals
  if (data.vitals) {
    if (data.vitals.temperature) setField('vitals_t', data.vitals.temperature);
    if (data.vitals.pulse) setField('vitals_p', data.vitals.pulse);
    if (data.vitals.respiration) setField('vitals_r', data.vitals.respiration);
    if (data.vitals.bp) setField('vitals_bp', data.vitals.bp);
    if (data.vitals.height) setField('vitals_bh', data.vitals.height);
    if (data.vitals.weight) setField('vitals_bw', data.vitals.weight);
    if (data.vitals.pain) setField('vitals_pain', data.vitals.pain);
  }

  // Physical exam
  if (data.physical_exam) {
    const pe: string[] = [];
    if (data.physical_exam.general) pe.push(`General: ${data.physical_exam.general}`);
    if (data.physical_exam.chest) pe.push(`Chest: ${data.physical_exam.chest}`);
    if (data.physical_exam.heart) pe.push(`Heart: ${data.physical_exam.heart}`);
    if (data.physical_exam.abdomen) pe.push(`Abdomen: ${data.physical_exam.abdomen}`);
    if (data.physical_exam.extremities) pe.push(`Extremities: ${data.physical_exam.extremities}`);
    if (data.physical_exam.local_findings) pe.push(`Local findings: ${data.physical_exam.local_findings}`);
    if (pe.length > 0) setField('pe_details', pe.join('\n'));
    if (data.physical_exam.consciousness) setField('pe_neuro_conscious', data.physical_exam.consciousness);
  }

  // Diagnosis
  if (data.diagnosis_active) {
    setField('diagnosis_active', data.diagnosis_active.replace(/\[Active\]\n?/g, ''));
  }
  if (data.diagnosis_underlying) {
    setField('diagnosis_underlying', data.diagnosis_underlying.replace(/\[Underlying\]\n?/g, ''));
  }

  // SOAP fields
  if (data.soap_o_lab) {
    setField('plan_lab_data', data.soap_o_lab.replace(/\[lab\]\n?/g, ''));
  }
  if (data.soap_a_active) {
    setField('plan_assessment_active', data.soap_a_active.replace(/\[Active\]\n?/g, ''));
  }
  if (data.soap_a_underlying) {
    setField('plan_assessment_underlying', data.soap_a_underlying.replace(/\[Underlying\]\n?/g, ''));
  }
  if (data.soap_plan) {
    setField('plan_plan', data.soap_plan);
  }
  if (data.treatment_goal) {
    setField('plan_treatment_goal', data.treatment_goal.replace(/^- /, ''));
  }
}
