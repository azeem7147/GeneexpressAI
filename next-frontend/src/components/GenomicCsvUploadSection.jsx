"use client";

import React, { useState } from 'react';
import { 
  Dna, 
  UploadCloud, 
  FileSpreadsheet, 
  Trash2, 
  Filter, 
  ArrowRight, 
  Database, 
  Loader2, 
  AlertTriangle, 
  BarChart2,
  Cpu,
  CheckCircle2,
  Download
} from 'lucide-react';
import { predictGenomics } from '@/services/api';

export default function GenomicCsvUploadSection({ onNavigateToResults, setGenomicResults }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [rawFile, setRawFile] = useState(null);
  const [geneTargetPanel, setGeneTargetPanel] = useState('glioma_core');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [predictionData, setPredictionData] = useState(null);

  // 1. Send it to /api/model2/predict on file select/drop (or explicit trigger)
  const handleFile = async (file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a CSV file (.csv).");
      return;
    }

    setRawFile(file);
    setSelectedFile({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    setError(null);
    setPredictionData(null);

    // 2. Display a loading state & Send to /api/model2/predict
    setLoading(true);

    try {
      const data = await predictGenomics(file);

      // 4. Display an error if the file does not match the required gene schema
      if (data.validation && data.validation.matched_features_count === 0) {
        throw new Error(
          "Schema Mismatch: The uploaded CSV does not contain any of the expected TCGA-LGG gene features."
        );
      }

      // 3. Display the returned prediction
      setPredictionData(data);

      // 5. Keep the MRI results unchanged (only update genomicResults in parent state)
      if (setGenomicResults) {
        setGenomicResults(data);
      }
    } catch (err) {
      setError(err.message || "Genomic prediction failed");
      setPredictionData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setRawFile(null);
    setError(null);
    setPredictionData(null);
  };

  const sampleList = predictionData?.detailed_predictions || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Dna className="w-4 h-4" />
            <span>Modality 2: Transcriptomics & Molecular Markers</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Model 2 Genomic Classification</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Upload expression matrices to run automated inference via <strong>/api/model2/predict</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-mono">
            Pipeline Active: SVC (RBF, C=1, γ=0.01)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Configuration */}
        <div className="lg:col-span-7 space-y-6">
          {/* Target Panel Information */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-400" />
                Model 2 Pipeline Configuration
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">5-Stage Pipeline</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">Target Panel</label>
                <select
                  value={geneTargetPanel}
                  onChange={(e) => setGeneTargetPanel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="glioma_core">TCGA Lower-Grade Glioma (20,086 Genes Matrix)</option>
                  <option value="custom_matrix">Custom Patient Gene Expression Table</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">Pipeline Transformers</label>
                <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px]">
                  Imputer → Variance(0.01) → SelectK(500) → Scaler → SVC
                </div>
              </div>
            </div>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all flex flex-col items-center justify-center min-h-[240px] ${
              isDragging
                ? 'border-indigo-400 bg-indigo-950/20'
                : loading
                ? 'border-indigo-500/50 bg-indigo-950/20 animate-pulse'
                : selectedFile
                ? 'border-emerald-500/40 bg-emerald-950/10'
                : 'border-slate-800 hover:border-slate-700 bg-slate-900/50'
            }`}
          >
            <input
              type="file"
              id="genomic-file-upload"
              accept=".csv"
              onChange={handleFileChange}
              disabled={loading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />

            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
              {loading ? (
                <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
              ) : (
                <UploadCloud className="w-7 h-7" />
              )}
            </div>

            <h4 className="text-base font-semibold text-white">
              {loading
                ? 'Running Model 2 Inference via /api/model2/predict...'
                : selectedFile
                ? 'Replace selected Genomic CSV'
                : 'Drag & drop genomic expression CSV or click to browse'}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
              Accepts CSV format with patient rows and gene columns (e.g. TCGA RSEM or custom expression).
            </p>

            <div className="flex items-center space-x-3 mt-4">
              {!loading && (
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 pointer-events-none"
                >
                  Browse CSV Files
                </button>
              )}
              <a
                href="/sample_gene_expression_test.csv"
                download="gene_expression_test.csv"
                onClick={(e) => e.stopPropagation()}
                className="relative z-10 px-3.5 py-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-700/60 text-xs font-medium text-indigo-300 flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Download Sample Test CSV</span>
              </a>
            </div>
          </div>

          {/* Staged File Info & Loading State */}
          {selectedFile && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                  ) : (
                    <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                  )}
                </div>
                <div className="truncate text-left">
                  <p className="text-xs font-semibold text-white truncate">{selectedFile.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {selectedFile.size} • {loading ? 'Processing inference on /api/model2/predict...' : 'Prediction Loaded'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleFile(rawFile)}
                  disabled={loading}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-indigo-950 transition-all cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Classifying...</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Re-run</span>
                    </>
                  )}
                </button>
                <button
                  onClick={removeFile}
                  disabled={loading}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* 4. Display an error if the file does not match the required gene schema or fails */}
          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start space-x-3 text-xs text-red-200">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-300">Gene Schema / Prediction Error</p>
                <p className="mt-0.5 text-slate-300 leading-relaxed">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: 3. Display the returned prediction */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-indigo-400" />
                Returned Prediction (/api/model2/predict)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {loading ? 'Evaluating...' : predictionData ? 'Inference Complete' : 'Empty State'}
              </span>
            </div>

            {loading ? (
              <div className="py-14 text-center rounded-xl bg-slate-950 border border-slate-800 p-6 space-y-3">
                <Loader2 className="w-9 h-9 animate-spin mx-auto text-indigo-400" />
                <div>
                  <h5 className="text-sm font-semibold text-slate-200">Processing Expression Matrix</h5>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Sending CSV to <code className="text-indigo-300 font-mono">/api/model2/predict</code> for imputation, scaling, and SVC inference...
                  </p>
                </div>
              </div>
            ) : predictionData ? (
              <div className="space-y-4">
                {/* 3. Returned Raw Predictions Header */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-300 font-semibold">
                    <span className="flex items-center gap-1.5 text-indigo-300 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Returned Predictions: {JSON.stringify(predictionData.predictions)}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {predictionData.number_of_samples} Sample(s)
                    </span>
                  </div>
                  {predictionData.validation && (
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-850">
                      <div>Matched: <span className="text-emerald-400 font-mono">{predictionData.validation.matched_features_count}</span></div>
                      <div>Imputed: <span className="text-amber-400 font-mono">{predictionData.validation.missing_features_count}</span></div>
                    </div>
                  )}
                </div>

                {/* Samples Classification List */}
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {sampleList.map((p, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-slate-400 truncate max-w-[180px]">
                          Sample: {p.sample_id} (Class index: {p.predicted_index})
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">
                          {p.predicted_class}
                        </span>
                      </div>

                      {/* Probabilities breakdown */}
                      {p.probabilities && (
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                            Class Probabilities:
                          </div>
                          {Object.entries(p.probabilities).map(([cls, prob]) => (
                            <div key={cls} className="space-y-0.5">
                              <div className="flex justify-between text-[11px]">
                                <span className={cls === p.predicted_class ? 'text-indigo-300 font-semibold' : 'text-slate-400'}>
                                  {cls}
                                </span>
                                <span className="font-mono text-slate-300">
                                  {(prob * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${cls === p.predicted_class ? 'bg-indigo-500' : 'bg-slate-700'}`}
                                  style={{ width: `${Math.max(prob * 100, 2)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={onNavigateToResults}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-indigo-950 cursor-pointer"
                >
                  <span>View Multimodal Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 rounded-xl bg-slate-950 border border-slate-800 p-6">
                <Database className="w-10 h-10 mx-auto mb-3 opacity-30 text-indigo-400" />
                <h5 className="text-sm font-semibold text-slate-300">Awaiting Genomic Matrix Ingestion</h5>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  Upload an expression CSV to automatically trigger <code className="text-indigo-300 font-mono">/api/model2/predict</code> and inspect predicted subtypes.
                </p>
                <div className="mt-4 inline-block text-[10px] font-mono text-slate-400 border border-slate-800 px-2.5 py-1 rounded bg-slate-900">
                  [Empty State: Pipeline Idle]
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
