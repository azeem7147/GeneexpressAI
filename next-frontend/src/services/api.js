/**
 * API Service for GeneExpressAI
 * Provides decoupled, non-destructive calls to Model 1, Model 2,
 * Multimodal Analysis, Model Evaluation, Sample Packages, and PDF Report Generation.
 */

const BASE_URL = "http://127.0.0.1:8000";

/**
 * Model 1: Brain Tumor MRI Classification API Service
 */
export async function predictMri(file, sequence = "T1ce") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("sequence", sequence);

  const response = await fetch(`${BASE_URL}/api/model1/predict`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.detail?.message || result.message || result.detail || "MRI prediction failed");
  }
  return result;
}

/**
 * Model 2: TCGA-LGG Genomic Classification API Service
 */
export async function predictGenomics(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE_URL}/api/model2/predict`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.detail?.message || result.detail || "Genomic prediction failed");
  }
  return result;
}

/**
 * Multimodal Unified Patient Analysis: POST /api/multimodal/analyze
 */
export async function runMultimodalAnalysis(mriFile, genomicFile, patientRefId) {
  const formData = new FormData();
  if (mriFile) formData.append("mri_file", mriFile);
  if (genomicFile) formData.append("genomic_file", genomicFile);
  if (patientRefId) formData.append("patient_ref_id", patientRefId);

  const response = await fetch(`${BASE_URL}/api/multimodal/analyze`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.detail?.message || result.detail || result.message || "Multimodal analysis failed");
  }
  return result;
}

/**
 * Fetch Model Evaluation Summary & Metrics: GET /api/evaluation/summary
 */
export async function getEvaluationSummary() {
  const response = await fetch(`${BASE_URL}/api/evaluation/summary`);
  if (!response.ok) {
    throw new Error("Failed to load model evaluation summary");
  }
  return await response.json();
}

/**
 * Fetch List of Paired Sample Patients: GET /api/sample-patients
 */
export async function getSamplePatients() {
  const response = await fetch(`${BASE_URL}/api/sample-patients`);
  if (!response.ok) {
    throw new Error("Failed to load sample patients list");
  }
  return await response.json();
}

/**
 * Generate & Download Analysis PDF Report: POST /api/report/generate
 */
export async function downloadReportPdf(analysisPayload) {
  const response = await fetch(`${BASE_URL}/api/report/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(analysisPayload),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.detail || "Failed to generate PDF analysis report");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const refId = analysisPayload.patient_info?.patient_ref_id || "Patient";
  a.download = `GeneExpressAI_Report_${refId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
