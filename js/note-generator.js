/**
 * Note Generator Module
 * Handles generating and formatting admission notes for output
 */

import { getVal, plusMinus, sanitizeHTML } from './utils.js';

/**
 * Add a section to the output container
 * @param {string} title - Section title
 * @param {string} content - Section content
 * @param {HTMLElement} container - Container to append to
 */
export function addSectionToOutput(title, content, container) {
  if (!content || content.trim() === '' || content.trim() === 'N/A') return;

  const sectionDiv = document.createElement('div');
  sectionDiv.className = 'output-section';

  const sanitizedContent = sanitizeHTML(content);
  sectionDiv.innerHTML = `
    <h3>${title}<button class="copy-section-btn" title="Copy this section">📋</button></h3>
    <div class="output-content">${sanitizedContent}</div>
  `;

  container.appendChild(sectionDiv);
}

/**
 * Compile Review of Systems section
 * @returns {string} Formatted ROS text
 */
export function compileROS() {
  let rosOutput = '系統性回顧(Review of Systems)\n(■: positive, □:negative)';
  const INDENT = '    ';
  const ITEMS_PER_LINE = 3;

  const rosDetails = getVal('ros_details', '');
  if (rosDetails) rosOutput += `\n${rosDetails}\n`;

  document.querySelectorAll('#rosSection details').forEach(det => {
    const sysTitle = det.querySelector('summary').textContent.trim();
    const items = det.querySelectorAll('input[type="checkbox"]');
    const formattedParts = Array.from(items).map(cb =>
      `${plusMinus(cb.id)} ${cb.parentElement.textContent.trim()}`
    );

    let systemItemsString = '';
    for (let i = 0; i < formattedParts.length; i++) {
      systemItemsString += formattedParts[i];
      if (i < formattedParts.length - 1) {
        systemItemsString += ', ';
        if ((i + 1) % ITEMS_PER_LINE === 0) systemItemsString += '\n' + INDENT;
      }
    }
    rosOutput += `\n- ${sysTitle}:\n${INDENT}${systemItemsString}`;
  });

  return rosOutput.trim();
}

/**
 * Assemble the history block
 * @returns {string} Formatted history text
 */
export function assembleHistoryBlock() {
  // Medication Allergy
  const medAllergyDenied = document.getElementById('hist_med_allergy_denied')?.checked;
  const medAllergyDetails = getVal('hist_med_allergy_details', '');
  const medAllergyDate = getVal('hist_med_allergy_date', '');
  let medAllergyStr = medAllergyDenied ? 'No known' : (medAllergyDetails || 'unknown');
  if (!medAllergyDenied && medAllergyDate) medAllergyStr += ` (${medAllergyDate})`;

  // Device Allergy
  const deviceAllergyDenied = document.getElementById('hist_device_allergy_denied')?.checked;
  const deviceAllergyDetails = getVal('hist_device_allergy_details', '');
  const deviceAllergyDate = getVal('hist_device_allergy_date', '');
  let deviceAllergyStr = deviceAllergyDenied ? 'No known' : (deviceAllergyDetails || 'unknown');
  if (!deviceAllergyDenied && deviceAllergyDate) deviceAllergyStr += ` (${deviceAllergyDate})`;

  // Family History
  const fhArr = [
    `HTN ${plusMinus('fh_HTN')}`,
    `DM ${plusMinus('fh_DM')}`,
    `DLP ${plusMinus('fh_DLP')}`,
    `Cancer ${plusMinus('fh_CA')}`,
    `CAD ${plusMinus('fh_CAD')}`
  ];
  let fhStr = fhArr.join(', ');
  const fhDetails = getVal('fh_details', '');
  if (fhDetails) fhStr += `\n${fhDetails}`;

  // Build sections
  const historyContent = `病史(Patient History)\n${getVal('patientHistoryNarrative', 'Not specified')}`;
  const pmhContent = `[Past medical history]\n${getVal('hist_pmh', 'Not specified')}`;
  const pshContent = `[Past surgical history]\n${getVal('hist_surgical_history_detailed', 'denied')}`;
  const hospContent = `[Hospitalization]\n${getVal('hist_hospitalization_history', 'denied')}`;

  const medsContent = `Current Medication:\n台大醫院: ${getVal('hist_current_med_ntuh', 'nil')}\nOther: ${getVal('hist_current_med_other', 'denied')}\n中草藥: ${getVal('hist_current_med_tcm', 'denied')}\n保健食品: ${getVal('hist_current_med_supplements', 'denied')}`;

  const allergyContent = `Allergy:\n- Medication Allergy: ${medAllergyStr}\n- Medication ADR: ${getVal('hist_med_adr', 'unknown')}\n- Allergy to Medical Device and Materials: ${deviceAllergyStr}`;

  const familyHistoryContent = `Family History:\n${fhStr}`;

  const toccContent = `TOCC:\n- Travel history: ${getVal('hist_tocc_travel', 'denied')}\n- Occupation: ${getVal('hist_tocc_occupation', 'N/A')}\n- Cluster and contact: ${getVal('hist_tocc_cluster', 'denied')}`;

  const socialContent = `Social History:\n- Alcohol: ${getVal('hist_abc_alcohol', 'denied')}\n- Betel nuts: ${getVal('hist_abc_betel', 'denied')}\n- Smoking: ${getVal('hist_abc_smoking', 'denied')}`;

  return [
    historyContent,
    pmhContent,
    pshContent,
    hospContent,
    medsContent,
    allergyContent,
    familyHistoryContent,
    toccContent,
    socialContent
  ].join('\n\n');
}

/**
 * Generate physical examination text
 * @returns {string} Formatted PE text
 */
export function generatePEText() {
  let peText = '';

  // Vitals
  const vitalsText = `BH: ${getVal('vitals_bh', '--')} cm,  BW: ${getVal('vitals_bw', '--')} kg,
T: ${getVal('vitals_t', '--')} °C,  P: ${getVal('vitals_p', '--')} bpm,  R: ${getVal('vitals_r', '--')} /min,
BP: ${getVal('vitals_bp', '--/--')} mmHg,
Pain score: ${getVal('vitals_pain', '0')}`;

  peText = vitalsText + '\n\n';

  // PE Details
  const peDetails = getVal('pe_details', '');
  if (peDetails) peText += peDetails + '\n\n';

  // Neurological section
  peText += `[Neurological Examination]
- Consciousness: ${getVal('pe_neuro_conscious', 'alert and oriented, E4V5M6')}
- Muscle power: ${getVal('pe_neuro_power', 'intact and symmetric')}
- Gait: ${getVal('pe_neuro_gait', 'steady')}\n\n`;

  // Other PE sections with checkboxes
  document.querySelectorAll('#peSection details:not(:first-of-type)').forEach(det => {
    const title = det.querySelector('summary').textContent.trim();
    if (title === 'Neurological Examination') return;

    const items = det.querySelectorAll('input[type="checkbox"]');
    const positiveItems = Array.from(items)
      .filter(cb => cb.checked)
      .map(cb => cb.parentElement.textContent.trim());

    if (positiveItems.length > 0) {
      peText += `[${title}]\n- ${positiveItems.join(', ')}\n\n`;
    }
  });

  return peText.trim();
}

/**
 * Generate SOAP note content
 * @returns {string} Formatted SOAP text
 */
export function generateSOAPContent() {
  return `${getVal('plan_age_sex', '*--')}

S:
- ${getVal('ccpi', 'Not specified')}

O:
[General]
- vital signs: stable
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
 * @param {HTMLElement} outputEl - Output element to populate
 */
export function generateNotePreview(outputEl) {
  outputEl.innerHTML = '';

  // Chief Complaint
  const chiefComplaintContent = `Informant: ${getVal('informant', 'patient and EMR')}\n${getVal('ccpi', 'Not specified')}`;
  addSectionToOutput('主訴(Chief Complaint)', chiefComplaintContent, outputEl);

  // Patient History
  const historyBlockContent = assembleHistoryBlock();
  addSectionToOutput('病史(Patient History)', historyBlockContent, outputEl);

  // Psychosocial Assessment
  const psychosocialContent = getVal('psychosocial_assessment', 'pending');
  addSectionToOutput('社會心理相關評估(Psychosocial Assessment)', psychosocialContent, outputEl);

  // Review of Systems
  const rosContent = compileROS();
  addSectionToOutput('系統性回顧(Review of Systems)', rosContent, outputEl);

  // Physical Examination
  const peText = generatePEText();
  addSectionToOutput('身體診察(Physical Examination)', peText, outputEl);

  // Imaging Report
  const imagingContent = getVal('imaging_report', 'nil');
  addSectionToOutput('影像報告(Imaging Report)', imagingContent, outputEl);

  // Pathology Report
  const pathologyContent = getVal('pathology_report', 'nil');
  addSectionToOutput('病理報告(Pathology Report)', pathologyContent, outputEl);

  // Tentative Diagnosis
  const diagnosisContent = `[Active]\n${getVal('diagnosis_active', 'Not specified')}\n\n[Underlying]\n${getVal('diagnosis_underlying', 'Not specified')}`;
  addSectionToOutput('臆斷(Tentative Diagnosis)', diagnosisContent, outputEl);

  // SOAP (Medical Needs and Care Plan)
  const soapContent = generateSOAPContent();
  addSectionToOutput('醫療需求與治療計畫(Medical Needs and Care Plan)', soapContent, outputEl);

  // Discharge Planning
  const dischargePlanContent = `管路留置狀況：${getVal('dp_catheter', 'Nil')}
日常生活功能分數：${getVal('dp_adl', '100')}
預期出院後居住場所：${getVal('dp_residence', '與家人同住')}
預期出院後主要照顧者：${getVal('dp_caregiver', '自己')}
出院規劃收案篩檢：${getVal('dp_screening', '一般病患')}`;
  addSectionToOutput('出院規劃(Discharge Planning)', dischargePlanContent, outputEl);
}

/**
 * Get full note as plain text
 * @param {HTMLElement} outputEl - Output element
 * @returns {string} Full note text
 */
export function getFullNoteText(outputEl) {
  return outputEl.innerText;
}
