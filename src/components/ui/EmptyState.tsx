'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface EmptyStateProps {
  loading: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ loading }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-700">
      {loading ? (
        <>
          <Loader2 className="animate-spin text-indigo-500/50" size={32} />
          <span className="text-xs font-bold uppercase tracking-[0.2em] animate-pulse">
            Initializing Graph Engine
          </span>
        </>
      ) : (
        <div className="font-medium italic">
          Enter a repository path to begin
        </div>
      )}
    </div>
  );
};