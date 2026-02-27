'use client';

import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { VisualizerNode, GitHubLabel } from '@/types';
import { GitCommit, AlertCircle, X, Activity, ExternalLink, ChevronRight, Copy, Check, Clock, FileText, Plus, Minus, Loader2 } from 'lucide-react';

interface NodeTooltipProps {
  node: VisualizerNode;
  position: { x: number; y: number };
  repoUrl: string;
  onClose: () => void;
  fetchDetails?: () => void;
}

const formatRelativeTime = (dateStr?: string) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    if (diffInHours === 0) return 'Just now';
    return `${diffInHours}h ago`;
  }
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const NodeTooltip: React.FC<NodeTooltipProps> = ({ node, position, repoUrl, onClose, fetchDetails }) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState({ x: position.x + 24, y: position.y - 80 });
  const [tailPos, setTailPos] = useState({ x: -6, y: 80 });
  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  
  const githubLink = `https://github.com/${repoUrl}/tree/${node.name}`;
  const relativeTime = formatRelativeTime(node.lastUpdated);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useLayoutEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Only fetch if we don't have data AND it's not a trunk node
    if (fetchDetails && node.additions === undefined && node.type !== 'trunk') {
      fetchDetails();
    }
    // We intentionally only want this to run when the node name changes
    // to avoid re-triggering during the actual fetch/state update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.name]);

  const copySha = (e: React.MouseEvent) => {
    e.preventDefault();
    if (node.sha) {
      navigator.clipboard.writeText(node.sha);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useLayoutEffect(() => {
    if (!tooltipRef.current || isMobile) return;

    const tooltip = tooltipRef.current;
    const rect = tooltip.getBoundingClientRect();
    const parentRect = tooltip.parentElement?.getBoundingClientRect() || { width: window.innerWidth, height: window.innerHeight, left: 0, top: 0 };

    let newX = position.x + 24;
    let newY = position.y - 80;
    let newTailY = 80;
    let newTailX = -6;

    // Boundary check - Right edge
    if (newX + rect.width > parentRect.width) {
      newX = position.x - rect.width - 24;
      newTailX = rect.width - 10;
    }

    // Boundary check - Bottom edge
    if (newY + rect.height > parentRect.height) {
      const overflow = (newY + rect.height) - parentRect.height;
      newY -= (overflow + 20);
      newTailY += (overflow + 20);
    }

    // Boundary check - Top edge
    if (newY < 0) {
      newY = 20;
      newTailY = position.y - 20;
    }

    setAdjustedPos({ x: newX, y: newY });
    setTailPos({ x: newTailX, y: newTailY });
  }, [position, isMobile]);

  const statsContent = (
    <div className="p-4 space-y-4">
      {/* Main Stats Row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center justify-between px-3 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
          <span className="text-[10px] text-emerald-500/60 font-medium">Ahead</span>
          <span className="text-xs font-mono font-bold text-emerald-400">{node.ahead}</span>
        </div>
        <div className="flex items-center justify-between px-3 py-2 bg-rose-500/5 border border-rose-500/10 rounded-lg">
          <span className="text-[10px] text-rose-500/60 font-medium">Behind</span>
          <span className="text-xs font-mono font-bold text-rose-400">{node.behind}</span>
        </div>
      </div>

      {/* Change Magnitude Bar */}
      {node.additions !== undefined ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-medium px-1">
            <span className="text-slate-500 flex items-center gap-1.5">
              <FileText size={12} /> {node.filesChanged} files changed
            </span>
            <div className="flex gap-2">
              <span className="text-emerald-500 flex items-center gap-0.5"><Plus size={10} />{node.additions}</span>
              <span className="text-rose-500 flex items-center gap-0.5"><Minus size={10} />{node.deletions}</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-emerald-500/60" 
              style={{ width: `${(node.additions! / (node.additions! + node.deletions! || 1)) * 100}%` }} 
            />
            <div 
              className="h-full bg-rose-500/60" 
              style={{ width: `${(node.deletions! / (node.additions! + node.deletions! || 1)) * 100}%` }} 
            />
          </div>
        </div>
      ) : node.type !== 'trunk' ? (
        <div className="flex items-center justify-center gap-2 py-2 text-[10px] text-slate-500 italic">
          <Loader2 size={10} className="animate-spin" /> Fetching detailed diff...
        </div>
      ) : null}

      {/* SHA Section */}
      {node.sha && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <GitCommit size={12} /> Latest SHA
            </span>
            <button 
              onClick={copySha}
              className="text-[10px] text-slate-500 hover:text-indigo-400 flex items-center gap-1 transition-colors"
            >
              {copied ? <Check size={10} /> : <Copy size={10} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="bg-black/40 px-3 py-2 rounded-lg font-mono text-[11px] text-slate-300 border border-white/5 break-all">
            {node.sha}
          </div>
        </div>
      )}

      {/* Status Indicators */}
      {(node.hasConflicts || !node.isMerged) && (
        <div className="pt-1">
          {node.hasConflicts ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[11px] text-rose-300 font-medium">
              <AlertCircle size={14} className="text-rose-500" />
              Merge conflicts detected
            </div>
          ) : !node.isMerged ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[11px] text-indigo-300 font-medium">
              <Activity size={14} className="text-indigo-500" />
              Active development
            </div>
          ) : null}
        </div>
      )}

      {/* Action Button */}
      <a 
        href={githubLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-[11px] font-semibold rounded-lg transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/20"
      >
        <ExternalLink size={12} />
        View on GitHub
        <ChevronRight size={12} />
      </a>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] animate-in fade-in duration-200" onClick={onClose} />
        <div className="fixed bottom-4 left-4 right-4 z-[60] animate-in slide-in-from-bottom-8 duration-300">
          <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-start justify-between bg-white/[0.02]">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/10 text-slate-300 uppercase tracking-tight">
                    {node.type}
                  </span>
                  {node.isMerged && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 uppercase tracking-tight">
                      Merged
                    </span>
                  )}
                  {relativeTime && hasMounted && (
                    <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium ml-1">
                      <Clock size={10} /> {relativeTime}
                    </span>
                  )}
                </div>
                <h2 className="text-sm font-semibold text-slate-100 truncate tracking-tight">
                  {node.name}
                </h2>
              </div>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto text-slate-100">
              {node.metadata?.labels && node.metadata.labels.length > 0 && (
                <div className="px-4 py-3 bg-white/[0.03] border-b border-white/5 flex flex-wrap gap-1.5">
                  {node.metadata.labels.map((label: GitHubLabel) => (
                    <span 
                      key={label.name}
                      className="text-[9px] px-2 py-0.5 rounded-full border font-medium"
                      style={{ 
                        backgroundColor: `#${label.color}20`, 
                        borderColor: `#${label.color}40`,
                        color: `#${label.color}` 
                      }}
                    >
                      {label.name}
                    </span>
                  ))}
                </div>
              )}
              {statsContent}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div 
      ref={tooltipRef}
      className="absolute z-50 pointer-events-auto animate-in zoom-in-95 fade-in duration-200"
      style={{ 
        left: adjustedPos.x, 
        top: adjustedPos.y,
        minWidth: '320px'
      }}
    >
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden shadow-black/50">
        <div className="px-4 py-3 border-b border-white/5 flex items-start justify-between bg-white/[0.02]">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/10 text-slate-300 uppercase tracking-tight">
                {node.type}
              </span>
              {node.isMerged && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 uppercase tracking-tight">
                  Merged
                </span>
              )}
              {relativeTime && hasMounted && (
                <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium ml-1">
                  <Clock size={10} /> {relativeTime}
                </span>
              )}
            </div>
            <h2 className="text-sm font-semibold text-slate-100 truncate tracking-tight">
              {node.metadata?.displayTitle || node.name}
              {node.metadata?.prNumber && <span className="ml-2 text-slate-500 font-mono">#{node.metadata.prNumber}</span>}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        
        {/* Author Section */}
        {node.author && (
          <div className="px-4 py-2 bg-white/[0.03] border-b border-white/5 flex items-center gap-2">
            {node.author.avatarUrl ? (
              <Image src={node.author.avatarUrl} width={20} height={20} className="rounded-full border border-white/10" alt={node.author.login} />
            ) : (
              <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10" />
            )}
            <span className="text-[11px] text-slate-400">
              Last committed by <span className="font-bold text-slate-200">{node.author.login}</span>
            </span>
          </div>
        )}

        {/* Labels Section */}
        {node.metadata?.labels && node.metadata.labels.length > 0 && (
          <div className="px-4 py-2 bg-white/[0.01] border-b border-white/5 flex flex-wrap gap-1.5">
            {node.metadata.labels.map((label: GitHubLabel) => (
              <span 
                key={label.name}
                className="text-[9px] px-2 py-0.5 rounded-full border font-medium transition-colors"
                style={{ 
                  backgroundColor: `#${label.color}20`, 
                  borderColor: `#${label.color}40`,
                  color: `#${label.color}` 
                }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}

        {statsContent}
      </div>
      
      {/* Connector Tail */}
      <div 
        className="absolute w-2.5 h-2.5 bg-slate-900 border-l border-b border-white/10 rotate-45 -z-10 transition-all duration-300 shadow-xl" 
        style={{ 
          left: tailPos.x, 
          top: tailPos.y 
        }}
      />
    </div>
  );
};