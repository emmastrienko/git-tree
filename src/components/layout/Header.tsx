import React from 'react';
import { GitGraph } from 'lucide-react';
import { ViewMode } from '@/types';

interface Props {
  repoUrl: string;
  setRepoUrl: (url: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onFetch: () => void;
  loading: boolean;
}

export const Header: React.FC<Props> = ({ repoUrl, setRepoUrl, viewMode, setViewMode, onFetch, loading }) => (
  <header className="h-16 border-b border-border flex items-center justify-between px-6 shrink-0 z-20 bg-app-bg">
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <GitGraph className="text-indigo-500" size={22} />
        <h1 className="font-bold tracking-tight text-lg">Git Tree</h1>
      </div>
      
      <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
        {(['branches', 'pr'] as ViewMode[]).map(mode => (
          <button 
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              viewMode === mode ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {mode === 'branches' ? 'Branches' : 'Pull Requests'}
          </button>
        ))}
      </div>
    </div>
    
    <div className="flex items-center gap-3">
      <input 
        value={repoUrl}
        onChange={e => setRepoUrl(e.target.value)}
        placeholder="owner/repo"
        className="bg-white/5 border border-white/10 rounded-lg px-4 py-1.5 text-sm focus:outline-none focus:border-indigo-500/50 w-64"
      />
      <button 
        onClick={onFetch}
        disabled={loading}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
      >
        {loading ? 'Fetching...' : 'Fetch'}
      </button>
    </div>
  </header>
);