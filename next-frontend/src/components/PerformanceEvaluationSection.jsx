"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  Layers, 
  Dna, 
  ShieldCheck, 
  AlertCircle, 
  HelpCircle, 
  TrendingUp, 
  CheckCircle2, 
  Database,
  Calendar,
  FileSpreadsheet,
  Award
} from 'lucide-react';
import { getEvaluationSummary } from '@/services/api';

export default function PerformanceEvaluationSection() {
  const [evalData, setEvalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getEvaluationSummary()
      .then(data => {
        setEvalData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || "Failed to load model evaluation data");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center text-slate-400">
        <div className="w-8 h-8 mx-auto border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm">Loading scikit-learn held-out test evaluation benchmarks...</p>
      </div>
    );
  }

  if (error || !evalData) {
    return (
      <div className="max-w-6xl mx-auto p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center">
        <AlertCircle className="w-8 h-8 mx-auto text-amber-400 mb-2" />
        <h4 className="text-sm font-semibold text-white">Evaluation data unavailable</h4>
        <p className="text-xs text-slate-400 mt-1">{error || "Could not retrieve held-out benchmark datasets."}</p>
      </div>
    );
  }

  const m1 = evalData.model_1_mri;
  const m2 = evalData.model_2_genomics;
  const comb = evalData.combined_evaluation;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Empirical Benchmark Standards</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Model Performance & Evaluation
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Rigorous classification metrics evaluated strictly on labelled, held-out test datasets using scikit-learn.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono flex items-center space-x-2">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span>Benchmark Suite Active</span>
        </div>
      </div>

      {/* Evaluation Rules Guardrail Banner */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start space-x-3 text-xs leading-relaxed text-slate-300">
        <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Scientific Evaluation Integrity: </span>
          Metrics are computed strictly from held-out test splits (never from individual uploaded samples, training cohorts, or synthetic demonstration data). Averaging accuracies across different modalities is prohibited.
        </div>
      </div>

      {/* Side-by-Side Model Evaluation Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Model 1: MRI Neuroimaging */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Model 1: MRI Neuroimaging</h3>
                <p className="text-xs text-cyan-400 font-mono">ResNet50 Architecture (4 Classes)</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded text-[11px] font-mono bg-cyan-950/80 border border-cyan-800 text-cyan-300">
              {m1.test_samples} Test Scans
            </span>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Accuracy</span>
              <p className="text-lg font-bold text-cyan-300 mt-0.5">{(m1.accuracy * 100).toFixed(2)}%</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Precision</span>
              <p className="text-lg font-bold text-cyan-300 mt-0.5">{(m1.precision * 100).toFixed(2)}%</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Recall</span>
              <p className="text-lg font-bold text-cyan-300 mt-0.5">{(m1.recall * 100).toFixed(2)}%</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono">F1-Score</span>
              <p className="text-lg font-bold text-cyan-300 mt-0.5">{(m1.f1_score * 100).toFixed(2)}%</p>
            </div>
          </div>

          {/* Confusion Matrix Visualization */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Confusion Matrix (Held-out Test Cohort)</span>
              <span className="text-[10px] font-mono text-slate-400">Rows: True | Cols: Pred</span>
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="p-2 text-left">Class</th>
                    {m1.classes.map(c => (
                      <th key={c} className="p-2 capitalize text-cyan-400">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {m1.confusion_matrix.map((row, rIdx) => (
                    <tr key={rIdx} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="p-2 text-left font-semibold text-slate-300 capitalize">{m1.classes[rIdx]}</td>
                      {row.map((cell, cIdx) => {
                        const isDiag = rIdx === cIdx;
                        return (
                          <td 
                            key={cIdx} 
                            className={`p-2 ${isDiag ? 'bg-cyan-500/15 font-bold text-cyan-300' : 'text-slate-400'}`}
                          >
                            {cell}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p><strong className="text-slate-300">Dataset Source:</strong> {m1.source}</p>
            <p><strong className="text-slate-300">Evaluation Mode:</strong> Multiclass weighted macro-average across 4 test subsets.</p>
          </div>
        </div>

        {/* Model 2: Genomic Transcriptome */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Dna className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Model 2: Genomic Transcriptome</h3>
                <p className="text-xs text-indigo-400 font-mono">GridSearchCV SVC Pipeline (3 Classes)</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded text-[11px] font-mono bg-indigo-950/80 border border-indigo-800 text-indigo-300">
              {m2.test_samples} Held-out Samples
            </span>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Accuracy</span>
              <p className="text-lg font-bold text-indigo-300 mt-0.5">{(m2.accuracy * 100).toFixed(2)}%</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Precision</span>
              <p className="text-lg font-bold text-indigo-300 mt-0.5">{(m2.precision * 100).toFixed(2)}%</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Recall</span>
              <p className="text-lg font-bold text-indigo-300 mt-0.5">{(m2.recall * 100).toFixed(2)}%</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono">F1-Score</span>
              <p className="text-lg font-bold text-indigo-300 mt-0.5">{(m2.f1_score * 100).toFixed(2)}%</p>
            </div>
          </div>

          {/* Confusion Matrix Visualization */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Confusion Matrix (Held-out Test Cohort)</span>
              <span className="text-[10px] font-mono text-slate-400">Rows: True | Cols: Pred</span>
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="p-2 text-left">Class</th>
                    {m2.classes.map(c => (
                      <th key={c} className="p-2 capitalize text-indigo-400">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {m2.confusion_matrix.map((row, rIdx) => (
                    <tr key={rIdx} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="p-2 text-left font-semibold text-slate-300 capitalize">{m2.classes[rIdx]}</td>
                      {row.map((cell, cIdx) => {
                        const isDiag = rIdx === cIdx;
                        return (
                          <td 
                            key={cIdx} 
                            className={`p-2 ${isDiag ? 'bg-indigo-500/15 font-bold text-indigo-300' : 'text-slate-400'}`}
                          >
                            {cell}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p><strong className="text-slate-300">Dataset Source:</strong> {m2.source}</p>
            <p><strong className="text-slate-300">Gene Pipeline:</strong> Median Imputer → Variance(0.01) → SelectK(500) → Scaler → SVC.</p>
          </div>
        </div>

      </div>

      {/* Combined Performance Evaluation Guardrail (Section 7) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
        <div className="flex items-center space-x-2.5">
          <Award className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white tracking-tight">
            Combined System Evaluation Status
          </h3>
        </div>
        <p className="text-sm font-semibold text-amber-300">
          {comb.message}
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          {comb.explanation}
        </p>
      </div>
    </div>
  );
}
