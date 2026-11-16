"use client";

import React, { useState } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Layers, 
  Dna, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Trash2,
  PlayCircle,
  HelpCircle,
  ShieldCheck,
  Cpu,
  Package,
  ArrowRight
} from 'lucide-react';
import { runMultimodalAnalysis } from '@/services/api';

export default function UnifiedAnalysisSection({
  onNavigateToResults,
  mriResults,
  setMriResults,
  genomicResults,
  setGenomicResults,
  multimodalReport,
  setMultimodalReport
}) {
  // Staged files
  const [mriFile, setMriFile] = useState(null);
  const [genomicFile, setGenomicFile] = useState(null);
  const [mriPreview, setMriPreview] = useState(null);
  const [patientRefId, setPatientRefId] = useState('PATIENT-01');

  // Status flags
  const [isUsingSampleMri, setIsUsingSampleMri] = useState(false);
  const [isUsingSampleGenomic, setIsUsingSampleGenomic] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({ mri: null, genomic: null });

  // Handle manual MRI selection
  const handleMriSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png)$/i)) {
        setValidationErrors(prev => ({ ...prev, mri: 'Please upload a valid MRI image (JPG or PNG).' }));
        return;
      }
      setMriFile(file);
      setIsUsingSampleMri(false);
      setValidationErrors(prev => ({ ...prev, mri: null }));
      const reader = new FileReader();
      reader.onload = (ev) => setMriPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Handle manual Genomic CSV selection
  const handleGenomicSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setValidationErrors(prev => ({ ...prev, genomic: 'Please upload a valid genomic expression CSV file.' }));
        return;
      }
      setGenomicFile(file);
      setIsUsingSampleGenomic(false);
      setValidationErrors(prev => ({ ...prev, genomic: null }));
    }
  };

  // Workflow 4: Stage Specific Sample Patient Data
  const handleStageSamplePatient = async (patientId) => {
    try {
      setAnalysisError(null);
      setPatientRefId(patientId);

      const mriFilename = `${patientId}_cranial_mri.jpg`;
      const genFilename = `${patientId}_genomic_expression.csv`;

      // Fetch sample MRI from backend/public
      const mriRes = await fetch('/sample_brain_mri.jpg');
      if (!mriRes.ok) throw new Error('Could not load sample MRI file');
      const mriBlob = await mriRes.blob();
      const sampleMriFile = new File([mriBlob], mriFilename, { type: 'image/jpeg' });
      setMriFile(sampleMriFile);
      setIsUsingSampleMri(true);
      setMriPreview('/sample_brain_mri.jpg');
      setValidationErrors(prev => ({ ...prev, mri: null }));

      // Fetch sample Genomic CSV from backend/public
      const genRes = await fetch('/sample_genomic_3patients.csv');
      if (!genRes.ok) throw new Error('Could not load sample genomic CSV');
      const genBlob = await genRes.blob();
      const sampleGenFile = new File([genBlob], genFilename, { type: 'text/csv' });
      setGenomicFile(sampleGenFile);
      setIsUsingSampleGenomic(true);
      setValidationErrors(prev => ({ ...prev, genomic: null }));
    } catch (err) {
      setAnalysisError(`Failed to load sample data: ${err.message}`);
    }
  };

  // Workflow 2: Run Unified Multimodal Analysis
  const handleRunUnifiedAnalysis = async () => {
    if (!mriFile && !genomicFile) {
      setAnalysisError('Please upload at least one modality (MRI image or Genomic CSV) to run analysis.');
      return;
    }

    setIsRunning(true);
    setAnalysisError(null);

    try {
      // Execute multimodal endpoint directly
      const report = await runMultimodalAnalysis(mriFile, genomicFile, patientRefId);
      
      if (setMultimodalReport) {
        setMultimodalReport(report);
      }

      // Also mirror to legacy single modality hooks if provided
      if (setMriResults && report.mri_analysis?.evaluated) {
        setMriResults(report.mri_analysis);
      }
      if (setGenomicResults && report.genomic_analysis?.evaluated) {
        setGenomicResults({
          success: true,
          detailed_predictions: [{
            predicted_class: report.genomic_analysis.predicted_class,
            probabilities: report.genomic_analysis.probabilities,
            confidence: report.genomic_analysis.confidence
          }],
          number_of_samples: report.genomic_analysis.number_of_samples
        });
      }

      // Transition to unified results
      if (onNavigateToResults) {
        onNavigateToResults();
      }
    } catch (err) {
      setAnalysisError(err.message || 'Unified analysis failed during execution');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Multimodal Clinical Investigation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Multimodal Patient Analysis
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Execute independent inference on Model 1 (Neuroimaging ResNet50) and Model 2 (TCGA-LGG Genomic Transcriptome) with automated guardrails.
          </p>
        </div>

        {/* Quick Action: Use Sample Data */}
        <button
          onClick={() => handleStageSamplePatient('PATIENT-01')}
          disabled={isRunning}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600/30 to-indigo-600/30 hover:from-cyan-600/40 hover:to-indigo-600/40 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-cyan-950/40 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Stage Sample Patient 01</span>
        </button>
      </div>

      {/* Patient Reference ID Input */}
      <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-mono font-bold">
            ID
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-0.5">Patient Reference ID</label>
            <p className="text-slate-400 text-[11px]">Identifies patient specimen record in combined report</p>
          </div>
        </div>
        <input
          type="text"
          value={patientRefId}
          onChange={(e) => setPatientRefId(e.target.value)}
          placeholder="e.g. PATIENT-01 or TCGA-CS-4938"
          className="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Error Alert if any */}
      {analysisError && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 text-red-200 text-xs flex items-start space-x-3">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold text-white">Analysis Notice: </span>
            {analysisError}
          </div>
        </div>
      )}

      {/* Patient Data Upload Component: Dual Staging Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Modality 1: MRI Image Staging */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                <Layers className="w-4 h-4" />
                <span>Modality A: MRI Neuroimaging</span>
              </div>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-mono">
                Model 1 (ResNet50)
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Upload cranial MRI slice (JPG or PNG). Preprocessed to 224×224 RGB.
            </p>

            {/* Drop / Preview Area */}
            {mriFile ? (
              <div className="relative rounded-xl border border-cyan-500/40 bg-slate-950 p-4 flex items-center space-x-4">
                {mriPreview && (
                  <img 
                    src={mriPreview} 
                    alt="MRI Preview" 
                    className="w-16 h-16 rounded-lg object-cover border border-slate-700 bg-black shrink-0"
                  />
                )}
                <div className="overflow-hidden flex-1 text-xs">
                  <p className="font-semibold text-white truncate">{mriFile.name}</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    {(mriFile.size / 1024).toFixed(1)} KB • {isUsingSampleMri ? 'Sample MRI Staged' : 'Uploaded File'}
                  </p>
                  <span className="inline-block mt-1 text-[10px] text-cyan-400 font-mono">
                    [Ready for /api/multimodal/analyze]
                  </span>
                </div>
                <button
                  onClick={() => { setMriFile(null); setMriPreview(null); setIsUsingSampleMri(false); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 cursor-pointer"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-slate-800 hover:border-cyan-500/50 bg-slate-950/40 hover:bg-slate-950 cursor-pointer transition-all">
                <UploadCloud className="w-8 h-8 text-cyan-400 mb-2" />
                <span className="text-xs font-medium text-slate-200">Upload Cranial MRI Slice</span>
                <span className="text-[11px] text-slate-400 mt-1">Accepts JPG or PNG (224×224)</span>
                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/jpg" 
                  onChange={handleMriSelect} 
                  className="hidden" 
                />
              </label>
            )}

            {validationErrors.mri && (
              <p className="text-[11px] text-red-400 mt-2">{validationErrors.mri}</p>
            )}
          </div>
        </div>

        {/* Modality 2: Genomic CSV Staging */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
                <Dna className="w-4 h-4" />
                <span>Modality B: TCGA-LGG Transcriptome</span>
              </div>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-indigo-950/80 border border-indigo-800 text-indigo-300 font-mono">
                Model 2 (SVC Pipeline)
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Upload patient gene-expression matrix (CSV with 20,086 TCGA-LGG features).
            </p>

            {/* Drop / Preview Area */}
            {genomicFile ? (
              <div className="relative rounded-xl border border-indigo-500/40 bg-slate-950 p-4 flex items-center space-x-4">
                <div className="w-16 h-16 rounded-lg bg-indigo-950/50 border border-indigo-800 flex items-center justify-center shrink-0 text-indigo-400 font-mono text-xs">
                  <FileText className="w-7 h-7" />
                </div>
                <div className="overflow-hidden flex-1 text-xs">
                  <p className="font-semibold text-white truncate">{genomicFile.name}</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    {(genomicFile.size / 1024).toFixed(1)} KB • {isUsingSampleGenomic ? 'Sample CSV Staged' : 'Uploaded CSV'}
                  </p>
                  <span className="inline-block mt-1 text-[10px] text-indigo-400 font-mono">
                    [Ready for /api/multimodal/analyze]
                  </span>
                </div>
                <button
                  onClick={() => { setGenomicFile(null); setIsUsingSampleGenomic(false); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 cursor-pointer"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950/40 hover:bg-slate-950 cursor-pointer transition-all">
                <UploadCloud className="w-8 h-8 text-indigo-400 mb-2" />
                <span className="text-xs font-medium text-slate-200">Upload Gene Expression CSV</span>
                <span className="text-[11px] text-slate-400 mt-1">Accepts CSV with TCGA gene features</span>
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleGenomicSelect} 
                  className="hidden" 
                />
              </label>
            )}

            {validationErrors.genomic && (
              <p className="text-[11px] text-red-400 mt-2">{validationErrors.genomic}</p>
            )}
          </div>
        </div>

      </div>

      {/* Primary Action Button: RUN MULTIMODAL ANALYSIS */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-300">
          <p className="font-semibold text-white">Execution Protocol: Decoupled Independent Inference</p>
          <p className="text-slate-400 mt-0.5">
            Model 1 and Model 2 will run independently. If only one modality is uploaded, the other is designated as <code className="text-amber-300 font-mono">Not evaluated</code>.
          </p>
        </div>

        <button
          onClick={handleRunUnifiedAnalysis}
          disabled={isRunning || (!mriFile && !genomicFile)}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 disabled:opacity-40 text-white font-bold text-sm tracking-wide uppercase flex items-center justify-center space-x-2.5 transition-all shadow-xl shadow-indigo-950/60 cursor-pointer disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>RUNNING MULTIMODAL ANALYSIS...</span>
            </>
          ) : (
            <>
              <PlayCircle className="w-5 h-5" />
              <span>RUN MULTIMODAL ANALYSIS</span>
            </>
          )}
        </button>
      </div>

      {/* ============================================================== */}
      {/* SECTION 1: DOWNLOAD SAMPLE PATIENT DATASET */}
      {/* ============================================================== */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Download Sample Patient Dataset
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Download pre-configured patient demonstration packages containing matched cranial MRI, 20,086-gene expression CSV, and provenance metadata in ZIP format.
            </p>
          </div>

          <a
            href="/sample_packages/COMPLETE_TEST_DATASET.zip"
            download="COMPLETE_TEST_DATASET.zip"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600/40 to-purple-600/40 hover:from-indigo-600/60 hover:to-purple-600/60 border border-indigo-500/50 text-indigo-200 text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shrink-0"
          >
            <Package className="w-4 h-4 text-indigo-400" />
            <span>Download Complete Test Dataset</span>
          </a>
        </div>

        {/* 3 Patient Package Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Patient 01 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Patient 01</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Concordant Glioma
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">TCGA-LGG-DEMO-01</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Contains axial brain MRI slice (glioma mass) paired with genuine 20,086-gene expression profile (TCGA.CS.5390).
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-900">
              <a
                href="/sample_packages/PATIENT-01.zip"
                download="PATIENT-01.zip"
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-800/60 text-xs font-medium text-cyan-300 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Download Sample Patient 01</span>
              </a>
              <button
                type="button"
                onClick={() => handleStageSamplePatient('PATIENT-01')}
                className="w-full py-1.5 px-3 rounded-lg text-[11px] text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Stage Patient 01 for Analysis →
              </button>
            </div>
          </div>

          {/* Patient 02 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Patient 02</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800">
                  Discordant Review
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">TCGA-LGG-DEMO-02</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Contains axial brain MRI slice (meningioma mass) paired with TCGA LGG expression profile (TCGA.CS.5395) for review testing.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-900">
              <a
                href="/sample_packages/PATIENT-02.zip"
                download="PATIENT-02.zip"
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-purple-800/60 text-xs font-medium text-purple-300 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
                <span>Download Sample Patient 02</span>
              </a>
              <button
                type="button"
                onClick={() => handleStageSamplePatient('PATIENT-02')}
                className="w-full py-1.5 px-3 rounded-lg text-[11px] text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Stage Patient 02 for Analysis →
              </button>
            </div>
          </div>

          {/* Patient 03 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Patient 03</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
                  Safety Guardrail
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">TCGA-LGG-DEMO-03</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Contains axial brain MRI slice (negative / no tumor) paired with TCGA expression profile (TCGA.CS.4938) testing negative MRI override safety.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-900">
              <a
                href="/sample_packages/PATIENT-03.zip"
                download="PATIENT-03.zip"
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-800/60 text-xs font-medium text-amber-300 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Download Sample Patient 03</span>
              </a>
              <button
                type="button"
                onClick={() => handleStageSamplePatient('PATIENT-03')}
                className="w-full py-1.5 px-3 rounded-lg text-[11px] text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Stage Patient 03 for Analysis →
              </button>
            </div>
          </div>

        </div>

        {/* Provenance Notice */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 text-[11px] text-slate-400 flex items-start space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-300">Dataset Provenance & Pairing Transparency: </strong>
            Sample packages bundle held-out axial cranial MRI test slices and genuine TCGA-LGG 20,086-gene transcriptomes to facilitate multimodal system evaluation. In strict adherence to scientific truth, these demonstration packages do not fabricate biological patient matches across unrelated clinical repositories.
          </div>
        </div>
      </div>

      {/* Prominent Research Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-center font-mono">
        Research prototype only — not intended for clinical diagnosis.
      </div>
    </div>
  );
}
