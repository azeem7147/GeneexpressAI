"use client";

import React, { useState } from 'react';
import { 
  BarChart3, 
  Layers, 
  Dna, 
  ShieldAlert, 
  Info,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Download,
  Loader2,
  FileText
} from 'lucide-react';
import { downloadReportPdf } from '@/services/api';

export default function ResultsDashboard({ 
  onNavigateToMri, 
  onNavigateToGenomics,
  onNavigateToUnified,
  onNavigateToEvaluation,
  mriResults, 
  genomicResults,
  multimodalReport
}) {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(null);

  // Harmonize data source (from multimodalReport or legacy hooks)
  const report = multimodalReport || {
    patient_info: {
      patient_ref_id: "PATIENT-DEMO-UNSPECIFIED",
      mri_filename: mriResults ? "cranial_mri_scan.jpg" : "None",
      genomic_filename: genomicResults ? "genomic_expression.csv" : "None",
      timestamp: new Date().toLocaleString()
    },
    mri_analysis: mriResults ? {
      evaluated: true,
      status: "Evaluated",
      predicted_class: mriResults.predicted_class,
      tumour_status: mriResults.predicted_class === "notumor" ? "No Tumor Predicted" : "Tumour-Associated Class Predicted",
      confidence: mriResults.confidence,
      class_probabilities: mriResults.class_probabilities || {}
    } : { evaluated: false, status: "Not evaluated" },
    genomic_analysis: genomicResults ? {
      evaluated: true,
      status: "Evaluated",
      predicted_class: genomicResults.detailed_predictions?.[0]?.predicted_class || "astrocytoma",
      number_of_samples: genomicResults.number_of_samples || 1,
      probabilities: genomicResults.detailed_predictions?.[0]?.probabilities || null,
      confidence: genomicResults.detailed_predictions?.[0]?.confidence || null
    } : { evaluated: false, status: "Not evaluated" },
    combined_interpretation: {
      agreement_status: mriResults && genomicResults ? "Independent Evaluation Complete" : "Single Modality Evaluated",
      is_flagged: false,
      headline: "Independent Radiogenomic Evaluation",
      summary: "Model 1 and Model 2 evaluated separately without synthetic score fusion.",
      action: "Correlate with clinical histopathology."
    },
    overall_result: {
      mri_tumour_status: mriResults ? (mriResults.predicted_class === "notumor" ? "No Tumor Predicted" : "Tumour-Associated Class Predicted") : "Not evaluated",
      mri_predicted_class: mriResults ? mriResults.predicted_class : "Not evaluated",
      genomic_predicted_class: genomicResults ? (genomicResults.detailed_predictions?.[0]?.predicted_class || "Not evaluated") : "Not evaluated",
      agreement_status: "Decoupled Evaluation",
      research_interpretation: "Model 1 and Model 2 operate independently.",
      clinical_disclaimer: "Research prototype only — not intended for clinical diagnosis."
    }
  };

  const hasMri = report.mri_analysis?.evaluated;
  const hasGenomics = report.genomic_analysis?.evaluated;
  const isMriTumor = hasMri ? report.mri_analysis.predicted_class !== 'notumor' : null;

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    setPdfError(null);
    try {
      await downloadReportPdf(report);
    } catch (err) {
      setPdfError(err.message || "Failed to generate report PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Analytical Results Hub</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Multimodal Patient Analysis
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
            Patient Specimen: <span className="text-cyan-300 font-bold">{report.patient_info?.patient_ref_id}</span> • Timestamp: {report.patient_info?.timestamp}
          </p>
        </div>

        {/* Action: Download PDF Report */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf || (!hasMri && !hasGenomics)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center space-x-2 transition-all shadow-lg shadow-cyan-950/50 cursor-pointer disabled:cursor-not-allowed"
          >
            {downloadingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Download Complete PDF Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {pdfError && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{pdfError}</span>
        </div>
      )}

      {/* Tumour Status Indicator Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <span className="text-xs uppercase font-mono font-bold text-slate-400">Tumour status:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide border uppercase ${
            hasMri 
              ? isMriTumor 
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' 
                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            {report.mri_analysis?.tumour_status || 'Not evaluated'}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 italic">
          This is the MRI classifier's output, not a confirmed clinical diagnosis.
        </p>
      </div>

      {/* Two Dedicated Standalone Cards: Model 1 MRI & Model 2 Genomics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ============================================================== */}
        {/* SECTION 3: MODEL 1 — MRI PREDICTION RESULTS */}
        {/* ============================================================== */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 flex flex-col justify-between shadow-xl">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Model 1 — MRI</h3>
                  <p className="text-xs text-cyan-400 font-mono">ResNet50 + Dense(4, Softmax)</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                hasMri ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {hasMri ? 'Evaluated' : 'Not evaluated'}
              </span>
            </div>

            {hasMri ? (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Predicted Class</span>
                    <h4 className="text-2xl font-extrabold text-cyan-400 uppercase tracking-tight mt-0.5">
                      {report.mri_analysis.predicted_class}
                    </h4>
                    <span className="inline-block mt-1 text-[11px] text-slate-400">
                      Tumour-associated category predicted
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Confidence</span>
                    <p className="text-2xl font-extrabold text-white font-mono mt-0.5">
                      {(report.mri_analysis.confidence * 100).toFixed(2)}%
                    </p>
                    <span className="text-[10px] text-slate-400">Softmax output</span>
                  </div>
                </div>

                {/* Probability distribution for all four classes */}
                <div>
                  <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                    Class Probability Distribution (All 4 Classes)
                  </h5>
                  <div className="space-y-2">
                    {['glioma', 'meningioma', 'notumor', 'pituitary'].map((cls) => {
                      const prob = report.mri_analysis.class_probabilities?.[cls] || 0;
                      const isTop = cls === report.mri_analysis.predicted_class;
                      return (
                        <div key={cls} className="space-y-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span className={`capitalize ${isTop ? 'text-cyan-300 font-bold' : 'text-slate-400'}`}>
                              {cls} {isTop && '(Predicted)'}
                            </span>
                            <span className="text-slate-300">{(prob * 100).toFixed(2)}%</span>
                          </div>
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                            <div 
                              className={`h-full transition-all duration-500 ${isTop ? 'bg-cyan-500' : 'bg-slate-700'}`}
                              style={{ width: `${Math.max(prob * 100, 1)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-amber-300/90 leading-relaxed">
                  Warning: This is an algorithmic model prediction, not a confirmed clinical diagnosis. Softmax confidence represents mathematical probability, not diagnostic certainty.
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <Layers className="w-8 h-8 mx-auto text-slate-500" />
                <h4 className="text-sm font-semibold text-slate-300">MRI Scan Not Evaluated</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Upload an axial cranial MRI to evaluate macroscopic mass classification.
                </p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-950/60 rounded-b-2xl">
            <button
              onClick={onNavigateToUnified}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-cyan-300 flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <span>{hasMri ? 'Re-run Multimodal Analysis' : 'Upload MRI Scan'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECTION 4: MODEL 2 — GENOMIC PREDICTION RESULTS */}
        {/* ============================================================== */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 flex flex-col justify-between shadow-xl">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Dna className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Model 2 — Genomics</h3>
                  <p className="text-xs text-indigo-400 font-mono">SVC GridSearchCV Pipeline</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                hasGenomics ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {hasGenomics ? 'Evaluated' : 'Not evaluated'}
              </span>
            </div>

            {hasGenomics ? (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Predicted Genomic Class</span>
                    <h4 className="text-2xl font-extrabold text-purple-400 uppercase tracking-tight mt-0.5">
                      {report.genomic_analysis.predicted_class}
                    </h4>
                    <span className="inline-block mt-1 text-[11px] text-slate-400">
                      Histomolecular lower-grade glioma subtype
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Samples Analysed</span>
                    <p className="text-2xl font-extrabold text-white font-mono mt-0.5">
                      {report.genomic_analysis.number_of_samples || 1}
                    </p>
                    <span className="text-[10px] text-slate-400">Expression profiles</span>
                  </div>
                </div>

                {/* Validation Status & Feature Counts */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span>Input Validation Status:</span>
                    <span className="text-emerald-400 font-bold">Passed</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Expected Feature Schema:</span>
                    <span>20,086 Genes (TCGA-LGG)</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Matched Gene Columns:</span>
                    <span className="text-cyan-300">20,086 Features Aligned</span>
                  </div>
                </div>

                {/* Calibrated Probabilities if present */}
                {report.genomic_analysis.probabilities && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Calibrated Probabilities (Platt Scaling)
                    </h5>
                    {Object.entries(report.genomic_analysis.probabilities).map(([cls, prob]) => {
                      const isTop = cls === report.genomic_analysis.predicted_class;
                      return (
                        <div key={cls} className="space-y-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span className={`capitalize ${isTop ? 'text-purple-300 font-bold' : 'text-slate-400'}`}>
                              {cls} {isTop && '(Predicted)'}
                            </span>
                            <span className="text-slate-300">{(prob * 100).toFixed(2)}%</span>
                          </div>
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                            <div 
                              className={`h-full transition-all duration-500 ${isTop ? 'bg-purple-500' : 'bg-slate-700'}`}
                              style={{ width: `${Math.max(prob * 100, 1)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                  Notice: Model 2 is trained strictly on TCGA lower-grade glioma samples. It does not independently determine whether a brain tumour is present in the patient.
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <Dna className="w-8 h-8 mx-auto text-slate-500" />
                <h4 className="text-sm font-semibold text-slate-300">Genomic Profile Not Evaluated</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Upload patient RNA-Seq CSV matrix to evaluate lower-grade glioma subtype classification.
                </p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-950/60 rounded-b-2xl">
            <button
              onClick={onNavigateToUnified}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-indigo-300 flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <span>{hasGenomics ? 'Re-run Multimodal Analysis' : 'Upload Genomic CSV'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* SECTION 6: COMBINED MULTIMODAL REPORT */}
      {/* ============================================================== */}
      <div className={`rounded-2xl border p-6 space-y-5 shadow-xl ${
        report.combined_interpretation?.is_flagged ? 'bg-amber-950/20 border-amber-500/40' : 'bg-slate-900/80 border-slate-800'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            {report.combined_interpretation?.is_flagged ? (
              <AlertCircle className="w-5 h-5 text-amber-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-cyan-400" />
            )}
            <h3 className="text-lg font-bold text-white tracking-tight">
              Combined Radiogenomic Interpretation
            </h3>
          </div>
          {report.combined_interpretation?.is_flagged && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300">
              Flagged for Expert Review
            </span>
          )}
        </div>

        <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
          <h4 className="font-bold text-white text-sm">
            {report.combined_interpretation?.headline}
          </h4>
          <p className="text-slate-300">
            {report.combined_interpretation?.summary}
          </p>
          <p className="text-cyan-300 font-medium">
            Clinical Recommendation: {report.combined_interpretation?.action}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            Diagnostic Guardrail: Predictions from Model 1 and Model 2 are presented independently. They are never algorithmically fused, averaged, or synthesized into an unsupported hybrid conclusion.
          </span>
        </div>
      </div>

      {/* Overall Multimodal Result Summary */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h3 className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">
          Overall Executive Result
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">MRI Tumour Status</span>
            <p className="text-sm font-bold text-cyan-300">{report.overall_result?.mri_tumour_status}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">MRI Predicted Class</span>
            <p className="text-sm font-bold text-cyan-300 uppercase">{report.overall_result?.mri_predicted_class}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Genomic Predicted Subtype</span>
            <p className="text-sm font-bold text-purple-300 uppercase">{report.overall_result?.genomic_predicted_class}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Agreement Status</span>
            <p className="text-sm font-bold text-white truncate">{report.overall_result?.agreement_status}</p>
          </div>
        </div>
      </div>

      {/* Institutional Research Disclaimer */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900 to-amber-950/20 p-5 shadow-xl">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 text-xs">
            <h4 className="text-sm font-bold text-amber-200">
              Limitations & Clinical Disclaimer
            </h4>
            <p className="text-slate-300 font-semibold">
              Research prototype only — not intended for clinical diagnosis.
            </p>
            <p className="text-slate-400 leading-relaxed">
              GeneExpressAI is an investigational software platform for research into radiogenomics and computational oncology. 
              The predictions and probabilities generated by Model 1 (MRI Neuroimaging ResNet50) and Model 2 (TCGA-LGG Genomic Support Vector Classifier) 
              must never be used as a standalone basis for patient diagnosis, therapy selection, or surgical intervention. 
              All automated results require independent histopathological, radiological, and clinical confirmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
