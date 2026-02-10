'use client';

import React from 'react';
import { GitBranch as GitBranchIcon, GitPullRequest as GitPRIcon } from 'lucide-react';
import { GitBranch, GitPullRequest, ViewMode } from '@/types';

interface Props {
  viewMode: ViewMode;
  items: any[];
}

export const Sidebar: React.FC<Props> = ({ viewMode, items }) => (
  <aside className="w-full h-full border-r border-border bg-slate-900 lg:bg-slate-950/50 flex flex-col shrink-0 z-10 shadow-2xl lg:shadow-none">
    <div className="p-4 border-b border-border bg-white/[0.01]">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {viewMode === 'branches' ? 'Branches' : 'Pull Requests'}
        </h2>
        <span className="text-[10px] font-mono text-slate-600">{items.length}</span>
      </div>
    </div>
    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
      <div className="flex flex-col gap-0.5">
        {items.map((item, i) => (
          <button 
            key={i} 
            className="w-full text-left px-3 py-2 rounded-md hover:bg-white/[0.03] active:bg-white/[0.06] group transition-all flex items-start gap-3"
          >
            <div className="mt-1 text-slate-600 group-hover:text-indigo-400 transition-colors">
              {viewMode === 'branches' ? <GitBranchIcon size={12} /> : <GitPRIcon size={12} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-slate-300 truncate group-hover:text-slate-100 transition-colors">
                {viewMode === 'branches' ? (item as GitBranch).name : (item as GitPullRequest).title}
              </div>
              {viewMode === 'branches' && (
                <div className="flex items-center gap-3 mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                    <span className="text-[9px] font-mono text-slate-400">{(item as GitBranch).ahead}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-rose-500" />
                    <span className="text-[9px] font-mono text-slate-400">{(item as GitBranch).behind}</span>
                  </div>
                </div>
              )}
            </div>
          </button>
        ))}
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