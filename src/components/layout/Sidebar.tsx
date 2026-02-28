'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import { GitBranch as GitBranchIcon, GitPullRequest as GitPRIcon, Search, X, ArrowUpDown, Filter, User } from 'lucide-react';
import { GitBranch, GitPullRequest, ViewMode, GitHubLabel } from '@/types';

interface Props {
  viewMode: ViewMode;
  items: (GitBranch | GitPullRequest)[];
  onHover?: (name: string | null) => void;
  onSelect?: (name: string) => void;
  filterAuthor?: string | null;
  onFilterAuthor?: (login: string | null) => void;
  selectedNodeName?: string | null;
}

type SortOption = 'recent' | 'name';

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

export const Sidebar: React.FC<Props> = ({ 
  viewMode, 
  items, 
  onHover, 
  onSelect,
  filterAuthor,
  onFilterAuthor,
  selectedNodeName
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Extract unique authors for filtering
  const authors = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach(item => {
      let author = null;
      if ('author' in item && item.author) {
        author = item.author;
      } else if ('user' in item && item.user) {
        author = { login: item.user.login, avatarUrl: item.user.avatar_url };
      }
      
      if (author?.login) {
        map.set(author.login, author.avatarUrl || '');
      }
    });
    return Array.from(map.entries()).map(([login, avatarUrl]) => ({ login, avatarUrl }));
  }, [items]);

  const handleSortChange = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDirection('asc');
    }
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      let result = 0;
      if (sortBy === 'recent') {
        const timeA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
        const timeB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
        result = timeB - timeA;
      } else {
        const nameA = (viewMode === 'branches' ? (a as GitBranch).name : (a as GitPullRequest).title) || '';
        const nameB = (viewMode === 'branches' ? (b as GitBranch).name : (b as GitPullRequest).title) || '';
        result = nameA.localeCompare(nameB);
      }
      return sortDirection === 'asc' ? result : -result;
    });
  }, [items, sortBy, sortDirection, viewMode]);

  const filteredItems = sortedItems.filter(item => {
    let login = null;
    if ('author' in item && item.author) {
      login = item.author.login;
    } else if ('user' in item && item.user) {
      login = item.user.login;
    }
    
    const matchesAuthor = !filterAuthor || login === filterAuthor;
    
    const name = (viewMode === 'branches' 
      ? (item as GitBranch).name 
      : (item as GitPullRequest).title) || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesAuthor && matchesSearch;
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedNodeName && scrollRef.current) {
      const selectedEl = scrollRef.current.querySelector('[data-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedNodeName]);

  return (
    <aside className="w-full h-full border-r border-border bg-slate-900 lg:bg-slate-950/50 flex flex-col shrink-0 z-10 shadow-2xl lg:shadow-none">
      <div className="p-4 border-b border-border bg-white/[0.01] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {viewMode === 'branches' ? 'Branches' : 'Pull Requests'}
          </h2>
          <span className="text-[10px] font-mono text-slate-600">
            {filteredItems.length} / {items.length}
          </span>
        </div>

        {/* Author Quick Filter */}
        {authors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
              <Filter size={10} /> Focus by Author
            </div>
            <div className="flex flex-wrap gap-1.5">
              {authors.slice(0, 8).map(author => (
                <button
                  key={author.login}
                  onClick={() => onFilterAuthor?.(filterAuthor === author.login ? null : author.login)}
                  className={`group relative flex items-center transition-all ${
                    filterAuthor === author.login ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 rounded-full' : 'opacity-60 hover:opacity-100'
                  }`}
                  title={author.login}
                >
                  {author.avatarUrl ? (
                    <Image src={author.avatarUrl} width={20} height={20} className="rounded-full border border-white/10" alt={author.login} />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center border border-white/5 text-[8px] text-slate-400">
                      <User size={8} />
                    </div>
                  )}
                </button>
              ))}
              {filterAuthor && (
                <button 
                  onClick={() => onFilterAuthor?.(null)}
                  className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-500/20 transition-colors"
                  title="Clear filter"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex bg-black/20 p-0.5 rounded-md border border-white/5">
          {(['recent', 'name'] as SortOption[]).map((option) => (
            <button
              key={option}
              onClick={() => handleSortChange(option)}
              className={`flex-1 py-1 text-[9px] font-bold uppercase tracking-tight rounded transition-all flex items-center justify-center gap-1 ${
                sortBy === option 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {option === 'recent' ? (sortDirection === 'asc' ? 'Newest' : 'Oldest') : (sortDirection === 'asc' ? 'A-Z' : 'Z-A')}
              {sortBy === option && <ArrowUpDown size={8} />}
            </button>
          ))}
        </div>

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
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-white/10 rounded-sm text-slate-500 hover:text-slate-300 transition-all">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        <div className="flex flex-col gap-0.5" onMouseLeave={() => onHover?.(null)}>
          {filteredItems.map((item, i) => {
            const b = item as GitBranch & GitPullRequest;
            const name = viewMode === 'branches' ? b.name : (b.title || b.metadata?.displayTitle || 'Untitled PR');
            const hoverKey = viewMode === 'branches' ? b.name : `${b.head?.ref} #${b.number}`;
            const login = ('author' in b && b.author?.login) || ('user' in b && b.user?.login);
            const avatarUrl = ('author' in b && b.author?.avatarUrl) || ('user' in b && b.user?.avatar_url) || '';
            const isSelected = selectedNodeName === hoverKey;

            return (
              <button 
                key={i} 
                onMouseEnter={() => onHover?.(hoverKey)}
                onClick={() => onSelect?.(hoverKey)}
                data-selected={isSelected}
                className={`w-full text-left px-3 py-2 rounded-md transition-all flex items-start gap-3 group ${
                  isSelected ? 'bg-indigo-500/20 border-l-2 border-indigo-500' : 
                  filterAuthor === login ? 'bg-indigo-500/10' : 'hover:bg-white/[0.03]'
                }`}
              >
                <div className={`mt-1 transition-colors ${isSelected ? 'text-indigo-400' : 'text-slate-600 group-hover:text-indigo-400'}`}>
                  {viewMode === 'branches' ? <GitBranchIcon size={12} /> : <GitPRIcon size={12} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className={`text-[12px] font-medium truncate transition-colors ${isSelected ? 'text-white' : 'text-slate-300 group-hover:text-slate-100'}`}>
                      {name}
                    </div>
                    {b.lastUpdated && (
                      <span className={`text-[9px] whitespace-nowrap ${isSelected ? 'text-indigo-300' : 'text-slate-600'}`}>{formatShortDate(b.lastUpdated)}</span>
                    )}
                  </div>

                  {viewMode === 'pr' && b.metadata?.labels && b.metadata.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 mb-1">
                      {b.metadata.labels.map((label: GitHubLabel) => (
                        <span 
                          key={label.name}
                          className="text-[8px] px-1 py-0.5 rounded-sm border leading-none font-medium"
                          style={{ 
                            backgroundColor: `#${label.color}15`, 
                            borderColor: `#${label.color}40`,
                            color: `#${label.color}` 
                          }}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-1">
                    {viewMode === 'branches' && (
                      <div className={`flex items-center gap-3 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-1 rounded-full bg-emerald-500" />
                          <span className={`text-[9px] font-mono ${isSelected ? 'text-emerald-300' : 'text-slate-400'}`}>{b.ahead}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-1 rounded-full bg-rose-500" />
                          <span className={`text-[9px] font-mono ${isSelected ? 'text-rose-300' : 'text-slate-400'}`}>{b.behind}</span>
                        </div>
                      </div>
                    )}
                    
                    {login && (
                      <div className="flex items-center gap-1.5 ml-auto">
                        <span className={`text-[9px] hidden group-hover:inline ${isSelected ? 'text-indigo-300' : 'text-slate-600'}`}>{login}</span>
                        <Image 
                          src={avatarUrl} 
                          width={14}
                          height={14}
                          className={`rounded-full border ${isSelected || filterAuthor === login ? 'border-indigo-500' : 'border-white/10'}`} 
                          alt="" 
                        />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
          
          {items.length > 0 && filteredItems.length === 0 && (
            <div className="py-8 px-4 text-center">
              <div className="text-[11px] text-slate-600 font-medium">No results found</div>
              <button onClick={() => { setSearchQuery(''); onFilterAuthor?.(null); }} className="text-[9px] text-indigo-400 mt-1 hover:underline">
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};