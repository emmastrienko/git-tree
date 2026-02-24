'use client';

import React from 'react';
import { Loader2, GitGraph, AlertTriangle } from 'lucide-react';

interface EmptyStateProps {
  loading: boolean;
  error?: string | null;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ loading, error }) => {
  if (error === 'REPO_NOT_FOUND') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-400 p-8 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-2">
          <GitGraph size={32} strokeWidth={1.5} className="text-slate-500" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-100">Repository Not Found</h3>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            We couldn&apos;t find that repository. Please check the spelling or ensure the repository is public.
          </p>
          <p className="text-[10px] text-slate-600 mt-2 italic">
            Format: owner/repository (e.g., facebook/react)
          </p>
        </div>
      </div>
    );
  }

  if (error === 'RATE_LIMIT') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-rose-400 p-8 text-center animate-in fade-in zoom-in-95 duration-300">
        <AlertTriangle size={48} strokeWidth={1.5} className="mb-2" />
        <div className="flex flex-col items-center gap-2">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-100">Rate Limit Exceeded</h3>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            GitHub API limit reached. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  if (error === 'FETCH_ERROR') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-rose-400 p-8 text-center animate-in fade-in zoom-in-95 duration-300">
        <AlertTriangle size={48} strokeWidth={1.5} className="mb-2" />
        <div className="flex flex-col items-center gap-2">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-100">Fetch Error</h3>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            An error occurred while fetching repository data. Please check your connection and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-500">
      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-500" size={24} />
          <div className="flex flex-col items-center gap-1 text-center px-4">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Fetching repository data...
            </span>
            <span className="text-[10px] text-slate-600">
              This may take a few minutes for large repositories
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 opacity-50">
          <GitGraph size={48} strokeWidth={1} />
          <div className="text-sm font-medium">
            Enter a repository path above to visualize its structure
          </div>
        </div>
      )}
    </div>
  );
};