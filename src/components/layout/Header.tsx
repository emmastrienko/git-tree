'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, Search, Share2, Check, Info, LayoutDashboard } from 'lucide-react';
import { ViewMode } from '@/types';

interface Props {
  repoUrl?: string;
  setRepoUrl?: (url: string) => void;
  viewMode?: ViewMode;
  setViewMode?: (mode: ViewMode) => void;
  onFetch?: () => void;
  loading?: boolean;
  onMenuClick?: () => void;
  minimal?: boolean;
}

export const Header: React.FC<Props> = ({ 
  repoUrl = '', 
  setRepoUrl, 
  viewMode, 
  setViewMode, 
  onFetch, 
  loading = false, 
  onMenuClick,
  minimal = false
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="h-auto min-h-[4rem] border-b border-white/5 flex flex-col md:flex-row items-center justify-between px-4 md:px-8 py-3 md:py-0 shrink-0 z-20 bg-[#020617]/80 backdrop-blur-md sticky top-0 gap-4">
      <div className="flex items-center justify-between w-full md:w-auto gap-8">
        <div className="flex items-center gap-4">
          {!minimal && onMenuClick && (
            <button 
              onClick={onMenuClick}
              className="p-1.5 hover:bg-white/5 rounded-md lg:hidden text-slate-400 hover:text-white transition-colors"
            >
              <Menu size={20} />
            </button>
          )}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-1 bg-indigo-600/10 rounded-lg group-hover:bg-indigo-600/20 transition-colors">
              <img src="/logo.svg" alt="Git Tree Logo" className="w-6 h-6" />
            </div>
            <h1 className="font-bold tracking-tight text-base md:text-lg whitespace-nowrap bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Git Tree</h1>
          </Link>
        </div>
        
        {minimal && (
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/about" className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2">
              <Info size={14} /> About
            </Link>
            <Link href="/dashboard" className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2">
              <LayoutDashboard size={14} /> App
            </Link>
          </nav>
        )}

        {!minimal && setViewMode && (
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
        )}
      </div>
      
      {!minimal ? (
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={14} />
            <input 
              value={repoUrl}
              onChange={e => setRepoUrl?.(e.target.value)}
              placeholder="owner/repo"
              className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-indigo-500/50 w-full md:w-64 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-1.5">
            <button 
              onClick={onFetch}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] min-w-[70px]"
            >
              {loading ? 'Fetching...' : 'Fetch'}
            </button>

            <button 
              onClick={handleShare}
              className={`p-2 rounded-lg border transition-all flex items-center gap-2 min-w-[40px] justify-center ${
                copied 
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              title="Share repository link"
            >
              {copied ? <Check size={14} /> : <Share2 size={14} />}
              {copied && <span className="text-[10px] font-bold uppercase tracking-tight hidden sm:inline">Copied</span>}
            </button>
          </div>
        </div>
      ) : (
        <Link 
          href="/dashboard"
          className="bg-indigo-600 hover:bg-indigo-500 px-6 py-2 rounded-full text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.95] hidden md:block"
        >
          Launch Visualizer
        </Link>
      )}
    </header>
  );
};