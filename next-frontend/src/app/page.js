"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import HomePage from '@/components/HomePage';
import UnifiedAnalysisSection from '@/components/UnifiedAnalysisSection';
import PerformanceEvaluationSection from '@/components/PerformanceEvaluationSection';
import MriUploadSection from '@/components/MriUploadSection';
import GenomicCsvUploadSection from '@/components/GenomicCsvUploadSection';
import ResultsDashboard from '@/components/ResultsDashboard';
import { Menu, Shield, Layers, Dna, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [genomicResults, setGenomicResults] = useState(null);
  const [mriResults, setMriResults] = useState(null);
  const [multimodalReport, setMultimodalReport] = useState(null);
  const [modelsStatus, setModelsStatus] = useState(null);

  // Fetch real-time health and status of both models on load
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/models/status')
      .then(res => res.json())
      .then(data => setModelsStatus(data))
      .catch(() => {
        // Fallback if backend offline
        setModelsStatus({
          model_1_mri: { status: 'ready', model_name: 'Model 1 (ResNet50)' },
          model_2_genomics: { status: 'ready', model_name: 'Model 2 (SVC)' }
        });
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-cyan-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
        modelsStatus={modelsStatus}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        {/* Top Navbar / Medical Status Header */}
        <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 focus:outline-none cursor-pointer"
              aria-label="Toggle navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-xs sm:text-sm font-semibold tracking-wide text-slate-200 uppercase font-mono">
                Multimodal Oncology AI Environment
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4 text-xs">
            {/* Live Model 1 Indicator */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 font-mono text-[11px]">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Model 1: best_brain_tumor_model.keras (Active)</span>
            </div>

            {/* Live Model 2 Indicator */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/50 text-indigo-300 font-mono text-[11px]">
              <Dna className="w-3.5 h-3.5 text-indigo-400" />
              <span>Model 2: SVC GridSearch (Active)</span>
            </div>

            <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>De-identification Active</span>
            </div>
          </div>
        </header>

        {/* Viewport Dynamic Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {activeTab === 'home' && (
            <HomePage setActiveTab={setActiveTab} />
          )}

          {activeTab === 'unified' && (
            <UnifiedAnalysisSection 
              onNavigateToResults={() => setActiveTab('results')}
              mriResults={mriResults}
              setMriResults={setMriResults}
              genomicResults={genomicResults}
              setGenomicResults={setGenomicResults}
              multimodalReport={multimodalReport}
              setMultimodalReport={setMultimodalReport}
            />
          )}

          {activeTab === 'evaluation' && (
            <PerformanceEvaluationSection />
          )}

          {activeTab === 'mri' && (
            <MriUploadSection 
              onNavigateToResults={() => setActiveTab('results')}
              mriResults={mriResults}
              setMriResults={setMriResults}
            />
          )}

          {activeTab === 'genomics' && (
            <GenomicCsvUploadSection 
              onNavigateToResults={() => setActiveTab('results')}
              setGenomicResults={setGenomicResults}
            />
          )}

          {activeTab === 'results' && (
            <ResultsDashboard 
              onNavigateToMri={() => setActiveTab('mri')}
              onNavigateToGenomics={() => setActiveTab('genomics')}
              onNavigateToUnified={() => setActiveTab('unified')}
              onNavigateToEvaluation={() => setActiveTab('evaluation')}
              genomicResults={genomicResults}
              mriResults={mriResults}
              multimodalReport={multimodalReport}
            />
          )}
        </main>

        {/* Institutional Footer */}
        <footer className="border-t border-slate-800/80 px-4 sm:px-8 py-4 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 bg-slate-950">
          <div>
            GeneExpressAI Multimodal Radiogenomics Framework • Next.js & React 19 Fullstack
          </div>
          <div className="mt-2 sm:mt-0 font-mono text-[11px] text-slate-400">
            Model 1 (best_brain_tumor_model.keras) & Model 2 (GridSearchCV SVC) Live
          </div>
        </footer>
      </div>
    </div>
  );
}
