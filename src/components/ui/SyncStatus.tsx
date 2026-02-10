'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface SyncStatusProps {
  itemCount: number;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ itemCount }) => {
  return (
    <div className="absolute top-6 right-6 z-30 flex items-center gap-3 px-4 py-2.5 bg-slate-900/90 border border-white/10 rounded-lg backdrop-blur-md shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
      <Loader2 className="animate-spin text-indigo-400" size={14} />
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-slate-100 uppercase tracking-tight">Syncing Repository</span>
        <span className="text-[9px] text-slate-400 font-medium">
          Processing <span className="text-indigo-300 font-mono">{itemCount}</span> branches...
        </span>
      </div>
    </div>
  );
};