'use client';

import React from 'react';
import { GitBranch as GitBranchIcon, GitPullRequest as GitPRIcon } from 'lucide-react';
import { GitBranch, GitPullRequest, ViewMode } from '@/types';

interface Props {
  viewMode: ViewMode;
  items: any[];
}

export const Sidebar: React.FC<Props> = ({ viewMode, items }) => (
  <aside className="w-80 border-r border-border bg-slate-950/50 flex flex-col shrink-0 z-10">
    <div className="p-4 border-b border-border">
      <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        {viewMode === 'branches' ? 'Branches' : 'Pull Requests'} ({items.length})
      </h2>
    </div>
    <div className="flex-1 overflow-y-auto p-2">
      <div className="flex flex-col">
        {items.map((item, i) => (
          <button 
            key={i} 
            className="w-full text-left px-3 py-2 rounded-md hover:bg-white/5 group transition-colors flex items-start gap-3"
          >
            <div className="mt-0.5 text-slate-500 group-hover:text-indigo-400 transition-colors">
              {viewMode === 'branches' ? <GitBranchIcon size={14} /> : <GitPRIcon size={14} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-slate-300 truncate group-hover:text-white transition-colors">
                {viewMode === 'branches' ? (item as GitBranch).name : (item as GitPullRequest).title}
              </div>
              {viewMode === 'branches' && (
                <div className="flex gap-2 text-[10px] font-mono mt-0.5">
                  <span className="text-emerald-500/80">{(item as GitBranch).ahead} ahead</span>
                  <span className="text-rose-500/80">{(item as GitBranch).behind} behind</span>
                </div>
              )}
            </div>
          </button>
        ))}
        {!items.length && (
          <div className="text-[11px] text-slate-600 italic px-3 py-4 text-center">
            No {viewMode === 'branches' ? 'branches' : 'pull requests'} found
          </div>
        )}
      </div>
    </div>
  </aside>
);