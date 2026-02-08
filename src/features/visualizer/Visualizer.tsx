'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { VisualizerNode } from '@/types';

interface VisualizerProps {
  tree: VisualizerNode;
  growth?: number;
}

export const Visualizer: React.FC<VisualizerProps> = ({ tree, growth = 1 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getSide = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash % 2 === 0 ? 1 : -1;
  };

  const drawNode = useCallback((
    ctx: CanvasRenderingContext2D,
    node: VisualizerNode,
    time: number,
    progress: number,
    depth: number,
    currentAngle: number,
    metadata: any
  ) => {
    if (progress <= 0) return;

    const isTrunk = node.type === 'trunk';
    const val = node.relativeAhead ?? node.ahead;
    
    const maxBehind = metadata?.maxBehind || 1;
    const branches = tree.children || [];
    const minBehind = branches.length > 0 ? Math.min(...branches.map(c => c.behind)) : 0;
    const highestSplitRatio = 1 - (minBehind / maxBehind) || 1;

    const length = isTrunk 
      ? 650 * highestSplitRatio * progress 
      : (Math.log10(val + 1) * 100 + 80) * progress * Math.pow(0.92, depth);

    ctx.save();

    let color = '#6366f1'; 
    if (node.hasConflicts) color = '#f43f5e'; 
    if (node.isMerged) {
      color = '#334155';
      ctx.globalAlpha = 0.4;
    }

    const trunkWidth = 18;
    const branchWidth = Math.max(3, 10 - depth * 2.5);
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    if (isTrunk) {
      ctx.lineTo(0, -length);
    } else {
      const cp1x = Math.sin(time * 0.0005 + depth) * 10;
      const cp1y = -length / 2;
      ctx.quadraticCurveTo(cp1x, cp1y, 0, -length);
    }
    
    ctx.strokeStyle = isTrunk ? '#1e293b' : color;
    ctx.lineWidth = isTrunk ? trunkWidth : branchWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    if (isTrunk) {
      branches.forEach((child, i) => {
        ctx.save();
        const side = getSide(child.name);
        const spread = 1.8;
        let angle = branches.length === 1 
          ? 0.5 * side 
          : (Math.abs(((i / (branches.length - 1)) - 0.5) * spread)) * side;

        const ratio = (1 - (child.behind / maxBehind)) / highestSplitRatio;
        ctx.translate(0, -length * ratio);
        
        const edgeOffset = (trunkWidth / 2) - 1; 
        ctx.translate(side * edgeOffset, 0);

        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fillStyle = child.hasConflicts ? '#f43f5e' : '#818cf8';
        ctx.fill();

        const nextGlobalAngle = currentAngle + angle;
        const clampedAngle = Math.max(-1.4, Math.min(1.4, nextGlobalAngle));
        ctx.rotate(clampedAngle);
        
        drawNode(ctx, child, time, progress, depth + 1, clampedAngle, metadata);
        ctx.restore();
      });
    } else {
      ctx.translate(0, -length);
      
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      if (!node.isMerged) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.save();
      ctx.rotate(-currentAngle);
      const label = node.name.length > 25 ? node.name.substring(0, 22) + '...' : node.name;
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = node.isMerged ? '#475569' : '#f1f5f9';
      ctx.fillText(label, 14, 4);
      ctx.restore();

      node.children?.forEach((child, i) => {
        ctx.save();
        const spread = 0.7 * Math.pow(0.8, depth);
        const angle = ((i / (node.children.length - 1)) - 0.5) * spread || 0.3;
        
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#818cf8';
        ctx.fill();

        ctx.rotate(angle);
        drawNode(ctx, child, time, progress, depth + 1, currentAngle + angle, metadata);
        ctx.restore();
      });
    }

    ctx.restore();
  }, [tree.children]); 

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    const render = (time: number) => {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height - 100);
      drawNode(ctx, tree, time, growth, 0, 0, tree.metadata);
      ctx.restore();
      frameId = requestAnimationFrame(render);
    };
    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [tree, growth, drawNode]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#020617] overflow-hidden">
      <canvas ref={canvasRef} width={1400} height={1000} className="max-w-full max-h-full object-contain pointer-events-none" />
    </div>
  );
};