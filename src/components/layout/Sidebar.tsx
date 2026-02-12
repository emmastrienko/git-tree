'use client';

import React, { useState } from 'react';
import { GitBranch as GitBranchIcon, GitPullRequest as GitPRIcon, Search, X } from 'lucide-react';
import { GitBranch, GitPullRequest, ViewMode } from '@/types';

interface Props {
  viewMode: ViewMode;
  items: any[];
  onHover?: (name: string | null) => void;
  onSelect?: (name: string) => void;
}

const formatShortDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const Sidebar: React.FC<Props> = ({ viewMode, items, onHover, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items.filter(item => {
    const name = viewMode === 'branches' 
      ? (item as GitBranch).name 
      : (item as GitPullRequest).title;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <aside className="w-full h-full border-r border-border bg-slate-900 lg:bg-slate-950/50 flex flex-col shrink-0 z-10 shadow-2xl lg:shadow-none">
      <div className="p-4 border-b border-border bg-white/[0.01] space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {viewMode === 'branches' ? 'Branches' : 'Pull Requests'}
          </h2>
          <span className="text-[10px] font-mono text-slate-600">
            {searchQuery ? `${filteredItems.length} / ${items.length}` : items.length}
          </span>
        </div>

        {/* Search Input */}
        <div className="relative group">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" size={13} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Filter ${viewMode}...`}
            className="w-full bg-white/5 border border-white/5 rounded-md pl-8 pr-8 py-1.5 text-[11px] focus:outline-none focus:border-indigo-500/30 focus:bg-white/[0.07] transition-all text-slate-200"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-white/10 rounded-sm text-slate-500 hover:text-slate-300 transition-all"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        <div className="flex flex-col gap-0.5" onMouseLeave={() => onHover?.(null)}>
          {filteredItems.map((item, i) => {
            const b = item as GitBranch;
            const name = viewMode === 'branches' ? b.name : (item as GitPullRequest).title;
            return (
              <button 
                key={i} 
                onMouseEnter={() => onHover?.(name)}
                onClick={() => onSelect?.(name)}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-white/[0.03] active:bg-white/[0.06] group transition-all flex items-start gap-3"
              >
                <div className="mt-1 text-slate-600 group-hover:text-indigo-400 transition-colors">
                  {viewMode === 'branches' ? <GitBranchIcon size={12} /> : <GitPRIcon size={12} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[12px] font-medium text-slate-300 truncate group-hover:text-slate-100 transition-colors">
                      {name}
                    </div>
                    {b.lastUpdated && (
                      <span className="text-[9px] text-slate-600 whitespace-nowrap">{formatShortDate(b.lastUpdated)}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    {viewMode === 'branches' && (
                      <div className="flex items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-1 rounded-full bg-emerald-500" />
                          <span className="text-[9px] font-mono text-slate-400">{b.ahead}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-1 rounded-full bg-rose-500" />
                          <span className="text-[9px] font-mono text-slate-400">{b.behind}</span>
                        </div>
                      </div>
                    )}
                    
                    {b.author && (
                      <div className="flex items-center gap-1.5 ml-auto">
                        <span className="text-[9px] text-slate-600 hidden group-hover:inline">{b.author.login}</span>
                        {b.author.avatarUrl ? (
                          <img src={b.author.avatarUrl} className="w-3.5 h-3.5 rounded-full border border-white/10" alt="" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full bg-white/5 border border-white/10" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
          
          {items.length > 0 && filteredItems.length === 0 && (
            <div className="py-8 px-4 text-center">
              <div className="text-[11px] text-slate-600 font-medium">No results for "{searchQuery}"</div>
              <button 
                onClick={() => setSearchQuery('')}
                className="text-[9px] text-indigo-400 mt-1 hover:underline"
              >
                Clear filter
              </button>
            </div>
          )}

          {!items.length && (
            <div className="py-8 px-4 text-center">
              <div className="text-[11px] text-slate-600 font-medium">No active {viewMode === 'branches' ? 'branches' : 'pull requests'}</div>
              <div className="text-[9px] text-slate-700 mt-1">Fetch a repository to see data</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};