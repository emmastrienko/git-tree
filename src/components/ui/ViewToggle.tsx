'use client';

import React from 'react';
import { Box, Maximize2 } from 'lucide-react';

interface ViewToggleProps {
  is3D: boolean;
  onToggle: (val: boolean) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ is3D, onToggle }) => {
  return (
    <div className="absolute top-4 left-4 md:left-6 z-30">
      <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 p-1 rounded-lg shadow-2xl flex gap-1">
        <button 
          onClick={() => onToggle(false)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
            !is3D ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Maximize2 size={12} /> 2D
        </button>
        <button 
          onClick={() => onToggle(true)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
            is3D ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Box size={12} /> 3D
        </button>
      </div>
    </div>
  );
};