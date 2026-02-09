'use client';

import React from 'react';
import { Box, Maximize2 } from 'lucide-react';

interface ViewToggleProps {
  is3D: boolean;
  onToggle: (val: boolean) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ is3D, onToggle }) => {
  return (
    <div className="absolute top-6 left-6 z-30 flex gap-2">
      <button 
        onClick={() => onToggle(false)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
          !is3D ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:text-slate-200'
        }`}
      >
        <Maximize2 size={12} /> 2D
      </button>
      <button 
        onClick={() => onToggle(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
          is3D ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:text-slate-200'
        }`}
      >
        <Box size={12} /> 3D
      </button>
    </div>
  );
};