import React from 'react';
import { GitGraph, Menu, Search } from 'lucide-react';
import { ViewMode } from '@/types';

interface Props {
  repoUrl: string;
  setRepoUrl: (url: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onFetch: () => void;
  loading: boolean;
  onMenuClick: () => void;
}

export const Header: React.FC<Props> = ({ repoUrl, setRepoUrl, viewMode, setViewMode, onFetch, loading, onMenuClick }) => (
  <header className="h-auto min-h-[4rem] border-b border-border flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-3 md:py-0 shrink-0 z-20 bg-app-bg gap-4">
    <div className="flex items-center justify-between w-full md:w-auto gap-4">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-1.5 hover:bg-white/5 rounded-md lg:hidden text-slate-400 hover:text-white transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <GitGraph className="text-indigo-500" size={20} />
          <h1 className="font-bold tracking-tight text-base md:text-lg whitespace-nowrap">Git Tree</h1>
        </div>
      </div>
      
      <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 scale-90 md:scale-100 origin-right md:origin-center">
        {(['branches', 'pr'] as ViewMode[]).map(mode => (
          <button 
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1 rounded-md text-[10px] md:text-xs font-medium transition-all ${
              viewMode === mode ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {mode === 'branches' ? 'Branches' : 'PRs'}
          </button>
        ))}
      </div>
    </div>
    
    <div className="flex items-center gap-2 w-full md:w-auto">
      <div className="relative flex-1 md:flex-none group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={14} />
        <input 
          value={repoUrl}
          onChange={e => setRepoUrl(e.target.value)}
          placeholder="owner/repo"
          className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-indigo-500/50 w-full md:w-64 transition-all"
        />
      </div>
      <button 
        onClick={onFetch}
        disabled={loading}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] min-w-[70px]"
      >
        {loading ? '...' : 'Fetch'}
      </button>
    </div>
  </header>
);