/**
 * Note generation module for the Admission Note Builder
 * Compiles form data into formatted clinical notes
 */

import { getVal, plusMinus, sanitizeHTML } from './utils';

/**
 * Add a section to the output container
 */
export function addSectionToOutput(
  title: string,
  content: string,
  container: HTMLElement
): void {
  if (!content || content.trim() === '' || content.trim() === 'N/A') return;

  const sectionDiv = document.createElement('div');
  sectionDiv.className = 'output-section';
  sectionDiv.innerHTML = `
    <h3>${title}<button class="copy-section-btn" title="Copy">📋</button></h3>
    <div class="output-content">${sanitizeHTML(content)}</div>
  `;
  container.appendChild(sectionDiv);
}

/**
 * Compile Review of Systems (ROS) from checkboxes
 */
export function compileROS(): string {
  let rosOutput = '系統性回顧(Review of Systems)\n(■: positive, □:negative)';
  const rosDetails = getVal('ros_details', '');
  if (rosDetails) rosOutput += `\n${rosDetails}\n`;

  document.querySelectorAll('#rosSection details').forEach((det) => {
    const sysTitle = det.querySelector('summary')?.textContent?.trim() || '';
    const items = det.querySelectorAll('input[type="checkbox"]');
    const parts = Array.from(items).map((cb) => {
      const checkbox = cb as HTMLInputElement;
      return `${plusMinus(checkbox.id)} ${checkbox.parentElement?.textContent?.trim() || ''}`;
    });
    rosOutput += `\n- ${sysTitle}:\n    ${parts.join(', ')}`;
  });

  return rosOutput.trim();
}

/**
 * Assemble the history block for the clinical note
 */
export function assembleHistoryBlock(): string {
  const medAllergyDenied = (document.getElementById('hist_med_allergy_denied') as HTMLInputElement)
    ?.checked;
  let medAllergyStr = medAllergyDenied
    ? 'No known'
    : getVal('hist_med_allergy_details', '') || 'unknown';
  if (!medAllergyDenied && getVal('hist_med_allergy_date', '')) {
    medAllergyStr += ` (${getVal('hist_med_allergy_date', '')})`;
  }

  const deviceAllergyDenied = (
    document.getElementById('hist_device_allergy_denied') as HTMLInputElement
  )?.checked;
  const deviceAllergyStr = deviceAllergyDenied
    ? 'No known'
    : getVal('hist_device_allergy_details', '') || 'unknown';

  const fhArr = [
    `HTN ${plusMinus('fh_HTN')}`,
    `DM ${plusMinus('fh_DM')}`,
    `DLP ${plusMinus('fh_DLP')}`,
    `Cancer ${plusMinus('fh_CA')}`,
    `CAD ${plusMinus('fh_CAD')}`,
  ];
  let fhStr = fhArr.join(', ');
  if (getVal('fh_details', '')) fhStr += `\n${getVal('fh_details', '')}`;

  return [
    `病史(Patient History)\n${getVal('patientHistoryNarrative', 'Not specified')}`,
    `[Past medical history]\n${getVal('hist_pmh', 'Not specified')}`,
    `[Past surgical history]\n${getVal('hist_surgical_history_detailed', 'denied')}`,
    `[Hospitalization]\n${getVal('hist_hospitalization_history', 'denied')}`,
    `Current Medication:\n台大醫院: ${getVal('hist_current_med_ntuh', 'nil')}\nOther: ${getVal('hist_current_med_other', 'denied')}\n中草藥: ${getVal('hist_current_med_tcm', 'denied')}\n保健食品: ${getVal('hist_current_med_supplements', 'denied')}`,
    `Allergy:\n- Medication Allergy: ${medAllergyStr}\n- Medication ADR: ${getVal('hist_med_adr', 'unknown')}\n- Device/Material Allergy: ${deviceAllergyStr}`,
    `Family History:\n${fhStr}`,
    `TOCC:\n- Travel: ${getVal('hist_tocc_travel', 'denied')}\n- Occupation: ${getVal('hist_tocc_occupation', 'N/A')}\n- Cluster/Contact: ${getVal('hist_tocc_cluster', 'denied')}`,
    `Social History:\n- Alcohol: ${getVal('hist_abc_alcohol', 'denied')}\n- Betel: ${getVal('hist_abc_betel', 'denied')}\n- Smoking: ${getVal('hist_abc_smoking', 'denied')}`,
  ].join('\n\n');
}

/**
 * Generate the physical examination text
 */
export function generatePEText(): string {
  let peText = `BH: ${getVal('vitals_bh', '--')} cm, BW: ${getVal('vitals_bw', '--')} kg\n`;
  peText += `T: ${getVal('vitals_t', '--')}°C, P: ${getVal('vitals_p', '--')} bpm, R: ${getVal('vitals_r', '--')}/min\n`;
  peText += `BP: ${getVal('vitals_bp', '--/--')} mmHg, Pain: ${getVal('vitals_pain', '0')}\n\n`;

  if (getVal('pe_details', '')) peText += getVal('pe_details', '') + '\n\n';

  peText += `[Neurological]\n`;
  peText += `- Consciousness: ${getVal('pe_neuro_conscious', 'E4V5M6')}\n`;
  peText += `- Muscle power: ${getVal('pe_neuro_power', 'intact')}\n`;
  peText += `- Gait: ${getVal('pe_neuro_gait', 'steady')}`;

  return peText;
}

/**
 * Generate the SOAP content for medical needs and care plan
 */
export function generateSOAPContent(): string {
  return `${getVal('plan_age_sex', '*--')}

S:
- ${getVal('ccpi', 'Not specified')}

O:
[General]
- Consciousness: ${getVal('pe_neuro_conscious', 'E4V5M6')}

[PE]
${getVal('plan_pe_findings', 'See PE section')}

[lab]
${getVal('plan_lab_data', '- pending')}

[image]
- CXR ${getVal('plan_cxr_date', '')}: ${getVal('plan_cxr_interp', '(-)')}
- ECG ${getVal('plan_ekg_date', '')}: ${getVal('plan_ekg_interp', 'NSR')}

A:
[Active]
${getVal('plan_assessment_active', getVal('diagnosis_active', 'Not specified'))}

[Underlying]
${getVal('plan_assessment_underlying', getVal('diagnosis_underlying', 'Not specified'))}

P:
${getVal('plan_plan', '- symptomatic treatment')}

Treatment goal:
- ${getVal('plan_treatment_goal', 'clinical stability')}`;
}

/**
 * Generate the full note preview
 */
export function generateNotePreview(outputEl: HTMLElement): void {
  outputEl.innerHTML = '';

  addSectionToOutput(
    '主訴(Chief Complaint)',
    `Informant: ${getVal('informant', 'patient and EMR')}\n${getVal('ccpi', 'Not specified')}`,
    outputEl
  );

  addSectionToOutput('病史(Patient History)', assembleHistoryBlock(), outputEl);

  addSectionToOutput(
    '社會心理相關評估(Psychosocial Assessment)',
    getVal('psychosocial_assessment', 'pending'),
    outputEl
  );

  addSectionToOutput('系統性回顧(Review of Systems)', compileROS(), outputEl);

  addSectionToOutput('身體診察(Physical Examination)', generatePEText(), outputEl);

  addSectionToOutput('影像報告(Imaging Report)', getVal('imaging_report', 'nil'), outputEl);

  addSectionToOutput('病理報告(Pathology Report)', getVal('pathology_report', 'nil'), outputEl);

  addSectionToOutput(
    '臆斷(Tentative Diagnosis)',
    `[Active]\n${getVal('diagnosis_active', 'Not specified')}\n\n[Underlying]\n${getVal('diagnosis_underlying', 'Not specified')}`,
    outputEl
  );

  addSectionToOutput(
    '醫療需求與治療計畫(Medical Needs and Care Plan)',
    generateSOAPContent(),
    outputEl
  );

  addSectionToOutput(
    '出院規劃(Discharge Planning)',
    `管路留置狀況：${getVal('dp_catheter', 'Nil')}\n日常生活功能分數：${getVal('dp_adl', '100')}\n預期出院後居住場所：${getVal('dp_residence', '與家人同住')}\n預期出院後主要照顧者：${getVal('dp_caregiver', '自己')}\n出院規劃收案篩檢：${getVal('dp_screening', '一般病患')}`,
    outputEl
  );
}

/**
 * Get the full note as plain text
 */
export function getFullNoteText(): string {
  const noteOutput = document.getElementById('noteOutput');
  return noteOutput?.innerText || '';
}
