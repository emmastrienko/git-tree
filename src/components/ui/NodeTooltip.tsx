'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import { VisualizerNode } from '@/types';
import { GitCommit, AlertCircle, CheckCircle2, X, Activity, ExternalLink, ChevronRight, Copy, Check } from 'lucide-react';

interface NodeTooltipProps {
  node: VisualizerNode;
  position: { x: number; y: number };
  repoUrl: string;
  onClose: () => void;
}

export const NodeTooltip: React.FC<NodeTooltipProps> = ({ node, position, repoUrl, onClose }) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState({ x: position.x + 24, y: position.y - 80 });
  const [tailPos, setTailPos] = useState({ x: -6, y: 80 });
  const [copied, setCopied] = useState(false);
  
  const githubLink = `https://github.com/${repoUrl}/tree/${node.name}`;

  const copySha = (e: React.MouseEvent) => {
    e.preventDefault();
    if (node.sha) {
      navigator.clipboard.writeText(node.sha);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useLayoutEffect(() => {
    if (!tooltipRef.current) return;

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
  }, [position]);

  return (
    <div 
      ref={tooltipRef}
      className="absolute z-50 pointer-events-auto animate-in zoom-in-95 fade-in duration-200"
      style={{ 
        left: adjustedPos.x, 
        top: adjustedPos.y,
        minWidth: '300px'
      }}
    >
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden shadow-black/50">
        {/* Header Section */}
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
            </div>
            <h2 className="text-sm font-semibold text-slate-100 truncate tracking-tight">
              {node.name}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Stats Bar */}
          <div className="flex gap-1.5 h-8">
            <div className="flex-1 flex items-center justify-between px-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
              <span className="text-[10px] text-emerald-500/60 font-medium">Ahead</span>
              <span className="text-xs font-mono font-bold text-emerald-400">{node.ahead}</span>
            </div>
            <div className="flex-1 flex items-center justify-between px-3 bg-rose-500/5 border border-rose-500/10 rounded-lg">
              <span className="text-[10px] text-rose-500/60 font-medium">Behind</span>
              <span className="text-xs font-mono font-bold text-rose-400">{node.behind}</span>
            </div>
          </div>

          {/* SHA Section */}
          {node.sha && (
            <div className="space-y-1.5">
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