'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface SyncStatusProps {
  itemCount: number;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ itemCount }) => {
  return (
    <div className="absolute bottom-6 right-4 md:right-6 z-30 flex items-center gap-3 px-4 py-2.5 bg-slate-900/95 border border-white/10 rounded-lg backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Loader2 className="animate-spin text-indigo-400" size={14} />
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-100 uppercase tracking-tight">Syncing Repository</span>
          <span className="text-[9px] text-slate-500 font-medium">(May take a few minutes)</span>
        </div>
        <span className="text-[9px] text-slate-400 font-medium">
          Processing <span className="text-indigo-300 font-mono">{itemCount}</span> branches...
        </span>
      </div>
    </div>
  );
};