import React from 'react';
import { GitBranch, GitPullRequest, ViewMode } from '@/types';

interface Props {
  viewMode: ViewMode;
  items: any[];
}

export const Sidebar: React.FC<Props> = ({ viewMode, items }) => (
  <aside className="w-80 border-r border-border bg-panel-bg flex flex-col shrink-0 z-10">
    <div className="p-4 flex flex-col gap-4 overflow-y-auto">
      <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        {viewMode === 'branches' ? 'Branches' : 'Pull Requests'}
      </h2>
      <div className="flex flex-col gap-1">
        {items.map((item, i) => (
          <div key={i} className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-xs flex flex-col gap-1">
            <div className="font-medium text-slate-200 truncate">
              {viewMode === 'branches' ? (item as GitBranch).name : (item as GitPullRequest).title}
            </div>
            {viewMode === 'branches' && (
              <div className="flex gap-2 text-[10px] text-slate-500">
                <span className="text-emerald-500">↑ {(item as GitBranch).ahead}</span>
                <span className="text-rose-500">↓ {(item as GitBranch).behind}</span>
              </div>
            )}
          </div>
        ))}
        {!items.length && <div className="text-xs text-slate-600 italic p-2">Empty state</div>}
      </div>
    </div>
  </aside>
);