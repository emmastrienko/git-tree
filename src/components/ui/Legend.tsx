'use client';

import React, { useState } from 'react';
import { Info, X, Clock, GitPullRequest, AlertTriangle } from 'lucide-react';

export const Legend = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute bottom-6 left-6 z-30 flex flex-col items-start gap-2">
      {isOpen && (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl mb-2 animate-in slide-in-from-bottom-4 fade-in duration-300 w-64">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Map Legend</h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white">
              <X size={14} />
            </button>
          </div>

          <div className="space-y-5">
            {/* Activity Scale */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                <Clock size={10} /> Branch Activity (Age)
              </div>
              <div className="flex items-center gap-1">
                <div className="h-1.5 flex-1 rounded-sm bg-[#60a5fa]" title="Fresh" />
                <div className="h-1.5 flex-1 rounded-sm bg-[#3b82f6]" title="Active" />
                <div className="h-1.5 flex-1 rounded-sm bg-[#2563eb]" title="Recent" />
                <div className="h-1.5 flex-1 rounded-sm bg-[#1d4ed8]" title="Aging" />
                <div className="h-1.5 flex-1 rounded-sm bg-[#172554]" title="Historical" />
              </div>
              <div className="flex justify-between text-[8px] text-slate-600 font-medium">
                <span>Newest</span>
                <span>Oldest</span>
              </div>
            </div>

            {/* PR Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                <GitPullRequest size={10} /> PR Status
              </div>
              <div className="grid grid-cols-2 gap-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                  <span className="text-[9px] text-slate-400">Approved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#eab308]" />
                  <span className="text-[9px] text-slate-400">Reviewing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#f43f5e]" />
                  <span className="text-[9px] text-slate-400">Changes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#1e293b]" />
                  <span className="text-[9px] text-slate-400">Merged</span>
                </div>
              </div>
            </div>

            {/* Health */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                <AlertTriangle size={10} /> Health
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#f43f5e] shadow-[0_0_8px_#f43f5e]" />
                <span className="text-[9px] text-slate-400 font-semibold">Merge Conflict</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg border transition-all shadow-xl flex items-center gap-2 ${
          isOpen 
            ? 'bg-indigo-600 border-indigo-400 text-white' 
            : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
      >
        <Info size={18} />
        {!isOpen && <span className="text-[10px] font-bold uppercase tracking-tight pr-1">Legend</span>}
      </button>
    </div>
  );
};