"use client";

import React, { useState } from 'react';
import { 
  Layers, 
  UploadCloud, 
  FileCheck2, 
  Trash2, 
  Eye, 
  Sliders, 
  Activity, 
  ArrowRight,
  Loader2,
  AlertTriangle
} from 'lucide-react';

export default function MriUploadSection({ onNavigateToResults, mriResults, setMriResults }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [rawFile, setRawFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mriSequence, setMriSequence] = useState('T1ce');
  const [slicePlane, setSlicePlane] = useState('axial');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = (file) => {
    setRawFile(file);
    const isImage = file.type.startsWith('image/');
    if (isImage) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }

    setSelectedFile({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: file.name.endsWith('.nii') || file.name.endsWith('.nii.gz') ? 'NIfTI 3D Volume' : 'DICOM / Slice Image',
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    setError(null);
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
    setPreviewUrl(null);
    setError(null);
  };

  const runPrediction = async () => {
    if (!rawFile) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', rawFile);
    formData.append('sequence', mriSequence);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/model1/predict', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.detail || 'Inference failed on MRI scan.');
      }

      const resultPayload = {
        ...data,
        previewUrl,
        filename: selectedFile.name,
        filesize: selectedFile.size,
        sequence: mriSequence,
        slicePlane,
        timestamp: new Date().toLocaleString()
      };

      if (setMriResults) {
        setMriResults(resultPayload);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Modality 1: Neuroimaging</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Model 1 MRI Radiomics Ingestion</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Upload structural brain MR imaging for ResNet50 deep classification into glioma, meningioma, notumor, or pituitary.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-mono">
            Model 1 Endpoint: POST /api/model1/predict
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload & Sequence Selection (Left Column) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Scan Parameters Configuration */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Scan Acquisition Parameters
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Image Size: 224x224 RGB</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">MRI Pulse Sequence</label>
                <select
                  value={mriSequence}
                  onChange={(e) => setMriSequence(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="T1ce">T1-weighted Contrast Enhanced (T1ce)</option>
                  <option value="T2">T2-weighted Standard</option>
                  <option value="FLAIR">T2-FLAIR (Fluid Attenuated Inversion)</option>
                  <option value="T1">T1-weighted Pre-contrast</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">Reconstruction Orientation</label>
                <select
                  value={slicePlane}
                  onChange={(e) => setSlicePlane(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="axial">Axial (Transverse View)</option>
                  <option value="coronal">Coronal (Frontal View)</option>
                  <option value="sagittal">Sagittal (Lateral View)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all flex flex-col items-center justify-center min-h-[250px] ${
              isDragging
                ? 'border-cyan-400 bg-cyan-950/20'
                : selectedFile
                ? 'border-emerald-500/40 bg-emerald-950/10'
                : 'border-slate-800 hover:border-slate-700 bg-slate-900/50'
            }`}
          >
            <input
              type="file"
              id="mri-file-upload"
              accept=".jpg,.jpeg,.png,.dcm,.nii,.gz"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-inner">
              <UploadCloud className="w-7 h-7" />
            </div>

            <h4 className="text-base font-semibold text-white">
              {selectedFile ? 'Replace selected MRI file' : 'Drag & drop MRI scans or click to browse'}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
              Upload patient brain MRI slice (JPG, PNG) or volumetric DICOM/NIfTI scans.
            </p>

            <button
              type="button"
              className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 pointer-events-none"
            >
              Browse Local Files
            </button>
          </div>

          {/* Staged File Action Card */}
          {selectedFile && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="truncate text-left">
                  <p className="text-xs font-semibold text-white truncate">{selectedFile.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {selectedFile.size} • Sequence: <span className="text-cyan-400 font-mono">{mriSequence}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={runPrediction}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-cyan-950 transition-all cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Inference Running...</span>
                    </>
                  ) : (
                    <>
                      <Activity className="w-3.5 h-3.5" />
                      <span>Classify MRI</span>
                    </>
                  )}
                </button>
                <button
                  onClick={removeFile}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start space-x-3 text-xs text-red-200">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-300">Model 1 Service Notice</p>
                <p className="mt-0.5 text-slate-300">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* MRI Preview (Right Column) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-cyan-400" />
                Original Uploaded Scan Preview
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {previewUrl ? 'Visualized' : 'Empty State'}
              </span>
            </div>

            {/* Medical Image Display Canvas */}
            <div className="relative aspect-square w-full rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-4 text-center overflow-hidden">
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Uploaded MRI Slice" 
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : selectedFile ? (
                <div className="relative z-10 flex flex-col items-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <FileCheck2 className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{selectedFile.name}</p>
                    <p className="text-[11px] text-slate-400 mt-1">DICOM/NIfTI File Staged</p>
                  </div>
                </div>
              ) : (
                <div className="relative z-10 space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                    <Layers className="w-7 h-7" />
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-slate-300">No Image Rendered</h5>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Viewer will render uploaded MRI scan slice with scan acquisition specs.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Proceed Action */}
            <button
              onClick={onNavigateToResults}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors border border-slate-700 cursor-pointer"
            >
              <span>Go to Multimodal Results Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
