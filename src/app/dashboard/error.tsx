'use client';

import { useEffect } from 'react';
import { RefreshCcw, Github, AlertCircle } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div className="h-full w-full flex items-center justify-center p-6 bg-[#020617]">
      <div className="max-w-lg w-full bg-slate-900/40 border border-white/5 rounded-3xl p-10 backdrop-blur-md shadow-2xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-8 rotate-3 border border-indigo-500/20">
            <AlertCircle className="w-10 h-10 text-indigo-400 -rotate-3" />
          </div>

          <h2 className="text-3xl font-bold text-slate-50 mb-4 tracking-tight">Visualizer crashed</h2>
          <p className="text-slate-400 mb-10 leading-relaxed">
            The git tree visualizer encountered a rendering error. This usually happens with extremely complex tree structures or unexpected API responses.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <button
              onClick={() => reset()}
              className="flex items-center justify-center gap-3 py-4 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-xl shadow-indigo-600/25"
            >
              <RefreshCcw className="w-5 h-5" />
              Reset Visualizer
            </button>
            
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 py-4 px-6 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-2xl font-bold transition-all active:scale-95 border border-white/5"
            >
              <Github className="w-5 h-5" />
              Check Token
            </a>
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 w-full">
            <p className="text-xs text-slate-500 font-mono uppercase tracking-[0.2em]">
              Error Log Details
            </p>
            <div className="mt-4 p-4 bg-black/40 rounded-xl border border-white/5 text-left max-h-32 overflow-y-auto">
              <p className="text-[11px] font-mono text-rose-400/80 break-all leading-relaxed">
                {error.message || 'Unknown error occurred in visualizer engine.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
