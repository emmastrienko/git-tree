'use client';

import React from 'react';
import { Loader2, GitGraph } from 'lucide-react';

interface EmptyStateProps {
  loading: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ loading }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-500">
      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-500" size={24} />
          <div className="flex flex-col items-center gap-1">
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