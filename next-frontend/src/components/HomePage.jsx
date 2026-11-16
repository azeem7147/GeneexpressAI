"use client";

import React from 'react';
import { 
  Dna, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  Cpu, 
  BarChart2, 
  Sparkles 
} from 'lucide-react';

export default function HomePage({ setActiveTab }) {
  const steps = [
    {
      num: '01',
      title: 'MRI Radiomics Ingestion',
      desc: 'Upload multi-parametric MRI sequences (T1, T2, FLAIR) in DICOM, NIfTI, or PNG format. ResNet50 analyzes morphological and deep tumor features.',
      tab: 'mri',
      action: 'Launch MRI Suite',
      icon: Layers,
      color: 'from-blue-500/20 to-cyan-500/10',
      border: 'border-cyan-500/30'
    },
    {
      num: '02',
      title: 'Genomic Expression Matrix',
      desc: 'Ingest normalized transcriptomic RNA-Seq (log2 RSEM/TPM) tables across 20,086 features with automated median imputation and variance filtering.',
      tab: 'genomics',
      action: 'Import Genomics',
      icon: Dna,
      color: 'from-indigo-500/20 to-purple-500/10',
      border: 'border-indigo-500/30'
    },
    {
      num: '03',
      title: 'Decoupled Analytics Engine',
      desc: 'Inspect independent inference evaluations across neuroimaging and transcriptomic domains with calibrated class probabilities and zero-fabrication guarantees.',
      tab: 'results',
      action: 'View Analytics Engine',
      icon: Cpu,
      color: 'from-emerald-500/20 to-teal-500/10',
      border: 'border-emerald-500/30'
    }
  ];

  const highlights = [
    { label: 'Diagnostic Framework', value: 'Decoupled Radiogenomics', sub: 'Independent evaluation without synthetic merging' },
    { label: 'Supported Modalities', value: 'Brain MRI & TCGA-LGG', sub: '224x224 slices & 20,086 whole-transcriptome genes' },
    { label: 'Analytical Engine', value: 'Pre-Trained Pipeline', sub: 'GridSearchCV SVC & ResNet50 architecture' },
    { label: 'Security & Integrity', value: 'Zero Mock Policy', sub: 'Deterministic true inference & clinical disclaimers' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-8 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Next-Generation Multimodal Precision Oncology (Next.js App)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            GeneExpress<span className="text-cyan-400">AI</span>: Deep Radiogenomics Platform
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-normal">
            Bridging clinical macroscopic MRI neuroimaging phenotypes with microscopic genomic transcriptomic profiles. 
            Accelerating glioma characterization through non-invasive artificial intelligence.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => setActiveTab('mri')}
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-cyan-600/25 transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Begin MRI Upload</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('genomics')}
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-medium text-sm transition-all cursor-pointer"
            >
              <Dna className="w-4 h-4 text-indigo-400" />
              <span>Genomic CSV Portal</span>
            </button>

            <button
              onClick={() => setActiveTab('results')}
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/60 text-slate-300 font-medium text-sm transition-all cursor-pointer"
            >
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              <span>Results Console</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {highlights.map((item, idx) => (
          <div 
            key={idx}
            className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all backdrop-blur-sm"
          >
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.label}</p>
            <h4 className="text-base font-bold text-white mt-1.5">{item.value}</h4>
            <p className="text-xs text-slate-400 mt-1 leading-snug">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Workflow Architecture Steps */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Clinical Diagnostic Workflow</h3>
            <p className="text-xs text-slate-400">Sequential multi-source ingestion & independent analytical evaluation</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
            3-Stage Protocol
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div 
                key={step.num}
                className={`relative rounded-2xl bg-gradient-to-b ${step.color} to-slate-900/70 border ${step.border} p-6 flex flex-col justify-between hover:scale-[1.01] transition-transform`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-slate-400 font-mono opacity-80">{step.num}</span>
                    <div className="w-10 h-10 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-cyan-300" />
                    </div>
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">{step.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{step.desc}</p>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-800/60">
                  <button
                    onClick={() => setActiveTab(step.tab)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-cyan-300 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                  >
                    <span>{step.action}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* System Status / Notice */}
      <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-start space-x-3.5">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-emerald-200">Next.js + FastAPI Radiogenomics Fullstack Active</p>
          <p className="text-slate-400 leading-relaxed">
            GeneExpressAI is running on modern Next.js App Router with connected FastAPI endpoints. 
            All analytical pipelines preserve strict empty-state indicators and verified non-refitted ML estimators.
          </p>
        </div>
      </div>
    </div>
  );
}
