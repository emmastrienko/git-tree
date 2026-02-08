'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { VisualizerNode } from '@/types';

interface VisualizerProps {
  tree: VisualizerNode;
  growth?: number;
  isFetching?: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ tree, growth = 1, isFetching }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [smoothLimit, setSmoothLimit] = useState(0);

  useEffect(() => {
    if (tree.children?.length === 0) {
      setSmoothLimit(0);
    }
  }, [tree.name]);

  useEffect(() => {
    let frame: number;
    const target = (tree.children?.length || 0);
    
    const update = () => {
      setSmoothLimit(prev => {
        if (prev < target) return prev + 0.2;
        return prev;
      });
      frame = requestAnimationFrame(update);
    };
    
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [tree.children?.length]);

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
    metadata: any,
    revealedLimit: number
  ) => {
    if (node.discoveryIndex !== undefined && node.discoveryIndex > revealedLimit) return;

    const nodeArrivalProgress = node.discoveryIndex !== undefined 
      ? Math.max(0, Math.min(1, revealedLimit - node.discoveryIndex))
      : 1;

    const isTrunk = node.type === 'trunk';
    const val = node.relativeAhead ?? node.ahead;
    
    const length = isTrunk 
      ? 250 * progress 
      : (Math.log10(val + 1) * 100 + 80) * progress * nodeArrivalProgress * Math.pow(0.92, depth);

    ctx.save();

    let color = '#6366f1'; 
    if (node.hasConflicts) color = '#f43f5e'; 
    if (node.isMerged) {
      color = '#334155';
      ctx.globalAlpha = 0.4;
    }

    const trunkWidth = 18;
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
    ctx.lineWidth = isTrunk ? trunkWidth : Math.max(3, 10 - depth * 2.5);
    ctx.lineCap = 'round';
    ctx.stroke();

    if (isTrunk && isFetching) {
      const breathe = (Math.sin(time * 0.003) + 1) / 2;
      ctx.strokeStyle = `rgba(99, 102, 241, ${0.1 + breathe * 0.3})`;
      ctx.lineWidth = trunkWidth + 10;
      ctx.stroke();
    }

    if (isTrunk) {
      const branches = tree.children || [];
      branches.forEach((child, i) => {
        ctx.save();
        const side = getSide(child.name);
        const ratio = 1 - (child.behind / (metadata?.maxBehind || 1));
        ctx.translate(0, -length * (0.2 + ratio * 0.75));
        ctx.translate(side * ((trunkWidth / 2) - 1), 0);

        const spread = 1.8;
        let angle = branches.length === 1 ? 0.5 * side : (Math.abs(((i / (branches.length - 1)) - 0.5) * spread)) * side;
        const nextGlobalAngle = currentAngle + angle;
        const clampedAngle = Math.max(-1.4, Math.min(1.4, nextGlobalAngle));
        
        ctx.rotate(clampedAngle);
        drawNode(ctx, child, time, progress, depth + 1, clampedAngle, metadata, revealedLimit);
        ctx.restore();
      });
    } else {
      ctx.translate(0, -length);
      
      if (nodeArrivalProgress > 0.8) {
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
        ctx.fillStyle = node.isMerged ? '#475569' : '#f1f5f9';
        ctx.font = 'bold 10px monospace';
        ctx.globalAlpha = (nodeArrivalProgress - 0.8) * 5;
        ctx.fillText(node.name, 14, 4);
        ctx.restore();
      }

      node.children?.forEach((child, i) => {
        ctx.save();
        const spread = 0.7 * Math.pow(0.8, depth);
        const angle = ((i / (node.children.length - 1)) - 0.5) * spread || 0.3;
        ctx.rotate(angle);
        drawNode(ctx, child, time, progress, depth + 1, currentAngle + angle, metadata, revealedLimit);
        ctx.restore();
      });
    }

    ctx.restore();
  }, [isFetching, tree.children]);

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
      ctx.scale(0.9, 0.9);
      drawNode(ctx, tree, time, growth, 0, 0, tree.metadata, smoothLimit);
      ctx.restore();
      frameId = requestAnimationFrame(render);
    };
    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [tree, growth, drawNode, smoothLimit]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#020617] overflow-hidden">
      <canvas ref={canvasRef} width={1400} height={1000} className="max-w-full max-h-full object-contain pointer-events-none" />
    </div>
  );
};
