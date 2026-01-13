/**
 * Form Populator Module
 * Handles populating form fields with AI-parsed data
 */

/**
 * Set a form field value and mark it as AI-populated
 * @param {string} id - Element ID
 * @param {*} value - Value to set
 */
function setField(id, value) {
  if (value === null || value === undefined) return;

  const el = document.getElementById(id);
  if (el) {
    el.value = value;
    el.classList.add('ai-populated');
    // Trigger input event for auto-save
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

/**
 * Set a checkbox state
 * @param {string} id - Element ID
 * @param {boolean} checked - Checked state
 */
function setCheckbox(id, checked) {
  if (checked === null || checked === undefined) return;

  const el = document.getElementById(id);
  if (el) {
    el.checked = checked;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

/**
 * Populate form fields from AI-parsed data
 * @param {Object} data - Parsed clinical data
 */
export function populateForm(data) {
  if (!data) return;

  // Chief Complaint
  if (data.chief_complaint) setField('ccpi', data.chief_complaint);
  if (data.present_illness) setField('ccpi', data.present_illness);

  // Age/Sex for SOAP
  if (data.age_sex) setField('plan_age_sex', data.age_sex);

  // Patient Narrative
  if (data.patient_narrative) setField('patientHistoryNarrative', data.patient_narrative);

  // Past Medical History
  if (data.past_medical_history) setField('hist_pmh', data.past_medical_history);

  // Past Surgical History
  if (data.past_surgical_history) setField('hist_surgical_history_detailed', data.past_surgical_history);

  // Medication Allergy
  if (data.medication_allergy) {
    if (data.medication_allergy.denied) {
      setCheckbox('hist_med_allergy_denied', true);
    } else if (data.medication_allergy.details) {
      setField('hist_med_allergy_details', data.medication_allergy.details);
    }
  }

  // Device Allergy
  if (data.device_allergy) {
    if (data.device_allergy.denied) {
      setCheckbox('hist_device_allergy_denied', true);
    } else if (data.device_allergy.details) {
      setField('hist_device_allergy_details', data.device_allergy.details);
    }
  }

  // Current Medications
  if (data.current_medications) setField('hist_current_med_other', data.current_medications);

  // Family History
  if (data.family_history) {
    setCheckbox('fh_HTN', data.family_history.HTN);
    setCheckbox('fh_DM', data.family_history.DM);
    setCheckbox('fh_DLP', data.family_history.DLP);
    setCheckbox('fh_CA', data.family_history.Cancer);
    setCheckbox('fh_CAD', data.family_history.CAD);
    if (data.family_history.details) setField('fh_details', data.family_history.details);
  }

  // Social History
  if (data.social_history) {
    if (data.social_history.alcohol) setField('hist_abc_alcohol', data.social_history.alcohol);
    if (data.social_history.smoking) setField('hist_abc_smoking', data.social_history.smoking);
    if (data.social_history.betel) setField('hist_abc_betel', data.social_history.betel);
  }

  // Vitals
  if (data.vitals) {
    if (data.vitals.temperature) setField('vitals_t', data.vitals.temperature);
    if (data.vitals.pulse) setField('vitals_p', data.vitals.pulse);
    if (data.vitals.respiration) setField('vitals_r', data.vitals.respiration);
    if (data.vitals.bp) setField('vitals_bp', data.vitals.bp);
    if (data.vitals.height) setField('vitals_bh', data.vitals.height);
    if (data.vitals.weight) setField('vitals_bw', data.vitals.weight);
  }

  // Physical Exam
  if (data.physical_exam) {
    const peNarrative = [];
    if (data.physical_exam.general) peNarrative.push(`General: ${data.physical_exam.general}`);
    if (data.physical_exam.heent) peNarrative.push(`HEENT: ${data.physical_exam.heent}`);
    if (data.physical_exam.neck) peNarrative.push(`Neck: ${data.physical_exam.neck}`);
    if (data.physical_exam.chest) peNarrative.push(`Chest: ${data.physical_exam.chest}`);
    if (data.physical_exam.heart) peNarrative.push(`Heart: ${data.physical_exam.heart}`);
    if (data.physical_exam.abdomen) peNarrative.push(`Abdomen: ${data.physical_exam.abdomen}`);
    if (data.physical_exam.extremities) peNarrative.push(`Extremities: ${data.physical_exam.extremities}`);
    if (data.physical_exam.skin) peNarrative.push(`Skin: ${data.physical_exam.skin}`);

    if (peNarrative.length > 0) setField('pe_details', peNarrative.join('\n'));
    if (data.physical_exam.consciousness) setField('pe_neuro_conscious', data.physical_exam.consciousness);
  }

  // PE Checkboxes
  if (data.pe_checkboxes) {
    Object.keys(data.pe_checkboxes).forEach(key => {
      setCheckbox(key, data.pe_checkboxes[key]);
    });
  }

  // ROS Checkboxes
  if (data.ros_checkboxes) {
    Object.keys(data.ros_checkboxes).forEach(key => {
      setCheckbox(key, data.ros_checkboxes[key]);
    });
  }

  // ROS Details
  if (data.ros_positive && data.ros_positive.length > 0) {
    setField('ros_details', data.ros_positive.join(', '));
  }

  // TOCC
  if (data.tocc) {
    if (data.tocc.travel) setField('hist_tocc_travel', data.tocc.travel);
    if (data.tocc.occupation) setField('hist_tocc_occupation', data.tocc.occupation);
    if (data.tocc.contact) setField('hist_tocc_cluster', data.tocc.contact);
    if (data.tocc.cluster) setField('hist_tocc_cluster', data.tocc.cluster);
  }

  // Hospitalization History
  if (data.hospitalization_history) setField('hist_hospitalization_history', data.hospitalization_history);

  // Tentative Diagnosis
  if (data.diagnosis_active) {
    const activeText = data.diagnosis_active.replace('[Active]\n', '').replace('[Active]', '');
    setField('diagnosis_active', activeText);
  }
  if (data.diagnosis_underlying) {
    const underlyingText = data.diagnosis_underlying.replace('[Underlying]\n', '').replace('[Underlying]', '');
    setField('diagnosis_underlying', underlyingText);
  }

  // SOAP Section - O (Objective)
  if (data.soap_pe_findings) setField('plan_pe_findings', data.soap_pe_findings);
  if (data.soap_o_general) setField('plan_pe_findings', data.soap_o_general);
  if (data.soap_o_lab) {
    setField('plan_lab_data', data.soap_o_lab.replace('[lab]\n', '').replace('[lab]', ''));
  }

  // SOAP Section - A (Assessment)
  if (data.soap_a_active) {
    const activeText = data.soap_a_active.replace('[Active]\n', '').replace('[Active]', '');
    setField('plan_assessment_active', activeText);
  } else if (data.soap_active) {
    setField('plan_assessment_active', data.soap_active);
  }

  if (data.soap_a_underlying) {
    const underlyingText = data.soap_a_underlying.replace('[Underlying]\n', '').replace('[Underlying]', '');
    setField('plan_assessment_underlying', underlyingText);
  } else if (data.soap_underlying) {
    setField('plan_assessment_underlying', data.soap_underlying);
  }

  // SOAP Section - P (Plan)
  if (data.soap_plan) setField('plan_plan', data.soap_plan);
  if (data.treatment_goal) setField('plan_treatment_goal', data.treatment_goal.replace('- ', ''));

  // Legacy fields (fallback)
  if (data.assessment && !data.soap_active && !data.soap_a_active) {
    setField('plan_assessment_active', data.assessment);
  }
  if (data.plan && !data.soap_plan) {
    setField('plan_plan', data.plan);
  }
}

/**
 * Clear AI-populated highlighting from all fields
 */
export function clearAiHighlighting() {
  document.querySelectorAll('.ai-populated').forEach(el => {
    el.classList.remove('ai-populated');
  });
}
