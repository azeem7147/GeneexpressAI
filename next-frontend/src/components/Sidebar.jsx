"use client";

import React from 'react';
import { 
  Home, 
  Layers, 
  Dna, 
  BarChart3, 
  Activity, 
  ShieldCheck, 
  Cpu, 
  ChevronRight,
  X,
  CheckCircle2,
  Sparkles,
  TrendingUp
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, mobileOpen, setMobileOpen, modelsStatus }) {
  const navItems = [
    { id: 'home', label: 'Overview & Mission', icon: Home, badge: 'Info' },
    { id: 'unified', label: 'Multimodal Analysis', icon: Sparkles, badge: 'Unified' },
    { id: 'evaluation', label: 'Performance Evaluation', icon: TrendingUp, badge: 'Benchmarks' },
    { id: 'mri', label: 'MRI Radiomics Suite', icon: Layers, badge: 'Model 1 (Live)' },
    { id: 'genomics', label: 'Genomic Profiling', icon: Dna, badge: 'Model 2 (Live)' },
    { id: 'results', label: 'Analysis Report', icon: BarChart3, badge: 'Dashboard' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  GeneExpress
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded">
                  AI
                </span>
              </div>
              <p className="text-xs text-slate-400 tracking-wide">Next.js Radiogenomics</p>
            </div>
          </div>
          <button 
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clinical Environment Badge */}
        <div className="px-6 py-3.5 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Next.js + React 19</span>
          </div>
          <span className="text-[11px] font-mono font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
            All Models Live
          </span>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Clinical Workflows
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-300'
                  }`} />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isActive 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                      : 'bg-slate-800/60 text-slate-400 border border-slate-700/40'
                  }`}>
                    {item.badge}
                  </span>
                  {isActive && <ChevronRight className="w-4 h-4 text-cyan-400" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Model Architecture Footer */}
        <div className="p-4 m-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-slate-200">
              <Cpu className="w-4 h-4 text-cyan-400" /> Active Weights
            </span>
            <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Loaded
            </span>
          </div>

          <div className="space-y-1 text-[11px] font-mono text-slate-400">
            <div className="flex items-center justify-between">
              <span className="text-cyan-300">M1 MRI:</span>
              <span className="text-slate-300 truncate max-w-[140px]" title="best_brain_tumor_model.keras">
                best_brain_tumor_model.keras
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-indigo-300">M2 Gene:</span>
              <span className="text-slate-300 truncate max-w-[140px]" title="tcga_lgg_improved_gridsearch.pkl">
                gridsearch_svc.pkl
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Zero Mock Policy
            </span>
            <span className="text-slate-400 font-mono">224x224 / 20k</span>
          </div>
        </div>
      </aside>
    </>
  );
}
