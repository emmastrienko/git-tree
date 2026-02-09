'use client';

import React from 'react';
import { Activity, Loader2 } from 'lucide-react';

interface SyncStatusProps {
  itemCount: number;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ itemCount }) => {
  return (
    <div className="absolute top-6 right-6 z-30 flex items-center gap-3 px-4 py-2 bg-slate-900/80 border border-indigo-500/20 rounded-full backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
      <Activity className="text-indigo-500 animate-pulse" size={14} />
      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
        Syncing: <span className="text-indigo-400 font-mono">{itemCount}</span> branches
      </span>
      <Loader2 className="animate-spin text-indigo-500/50" size={12} />
    </div>
  );
};