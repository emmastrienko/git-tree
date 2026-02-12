'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { VisualizerNode } from '@/types';

interface VisualizerProps {
  tree: VisualizerNode;
  growth?: number;
  isFetching?: boolean;
  hoveredNodeName?: string | null;
  isDimmed?: boolean; // New prop to control background dimming
  onHover?: (name: string | null) => void;
  onSelect?: (node: VisualizerNode, pos: { x: number; y: number }) => void;
}

interface InteractableRegion {
  x: number;
  y: number;
  radius: number;
  node: VisualizerNode;
}

export const Visualizer: React.FC<VisualizerProps> = ({ 
  tree, 
  growth = 1, 
  isFetching, 
  hoveredNodeName,
  isDimmed,
  onHover,
  onSelect 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const interactableRegions = useRef<InteractableRegion[]>([]);
  const [smoothLimit, setSmoothLimit] = useState(0);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.8 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (tree.children?.length === 0) {
      setSmoothLimit(0);
      setTransform({ x: 0, y: 0, scale: 0.8 });
    }
  }, [tree.name]);

  const handleWheel = (e: React.WheelEvent) => {
    const zoomSpeed = 0.001;
    const delta = -e.deltaY * zoomSpeed;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(5, prev.scale + delta))
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setTransform(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      let hoveredNode: VisualizerNode | null = null;
      for (const region of interactableRegions.current) {
        const dist = Math.sqrt(Math.pow(mouseX - region.x, 2) + Math.pow(mouseY - region.y, 2));
        if (dist < region.radius + 15) {
          hoveredNode = region.node;
          break;
        }
      }
      
      const container = canvas.parentElement;
      if (container) {
        if (hoveredNode) {
          container.style.cursor = 'pointer';
          if (hoveredNode.name !== hoveredNodeName && !isDimmed) {
            onHover?.(hoveredNode.name);
          }
        } else {
          container.style.cursor = 'grab';
          if (hoveredNodeName && !isDimmed) {
            onHover?.(null);
          }
        }
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = Math.abs(e.clientX - lastMousePos.x);
      const dy = Math.abs(e.clientY - lastMousePos.y);
      if (dx < 5 && dy < 5) handleCanvasClick(e);
    }
    setIsDragging(false);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    for (let i = interactableRegions.current.length - 1; i >= 0; i--) {
      const region = interactableRegions.current[i];
      const dist = Math.sqrt(Math.pow(mouseX - region.x, 2) + Math.pow(mouseY - region.y, 2));
      
      if (dist < (region.radius + 15)) { 
        onSelect?.(region.node, { x: e.clientX - rect.left, y: e.clientY - rect.top });
        return;
      }
    }
  };

  useEffect(() => {
    let frame: number;
    const target = (tree.children?.length || 0);
    const update = () => {
      setSmoothLimit(prev => (prev < target ? prev + 0.2 : prev));
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [tree.children?.length]);

  const getSide = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return hash % 2 === 0 ? 1 : -1;
  };

  const drawNode = useCallback((
    ctx: CanvasRenderingContext2D,
    node: VisualizerNode,
    time: number,
    progress: number,
    depth: number,
    currentAngle: number,
    revealedLimit: number,
    rootMetadata: any,
    index: number = 0
  ) => {
    if (node.discoveryIndex !== undefined && node.discoveryIndex > revealedLimit) return;

    const nodeArrivalProgress = node.discoveryIndex !== undefined 
      ? Math.max(0, Math.min(1, revealedLimit - node.discoveryIndex))
      : 1;

    const isTrunk = node.type === 'trunk';
    const isHovered = hoveredNodeName === node.name;
    const isOtherHovered = hoveredNodeName && !isHovered;
    const val = node.relativeAhead ?? node.ahead;
    
    const length = isTrunk 
      ? 250 * progress 
      : (Math.log10(val + 1) * 100 + 80) * progress * nodeArrivalProgress * Math.pow(0.92, depth);

    ctx.save();

    // Dim effect - ONLY IF explicitly requested via isDimmed (from Sidebar)
    if (isOtherHovered && isDimmed) ctx.globalAlpha = 0.1;

    // Dynamic Blue Scale
    let color = '#3b82f6'; 
    if (node.hasConflicts) {
      color = '#f43f5e';
    } else if (node.lastUpdated && rootMetadata?.newestTimestamp) {
      const current = new Date(node.lastUpdated).getTime();
      const newest = rootMetadata.newestTimestamp;
      const oldest = rootMetadata.oldestTimestamp;
      const range = Math.max(newest - oldest, 1);
      const ratio = Math.max(0, Math.min(1, (current - oldest) / range));
      
      if (ratio > 0.8) color = '#60a5fa';
      else if (ratio > 0.6) color = '#3b82f6';
      else if (ratio > 0.4) color = '#2563eb';
      else if (ratio > 0.2) color = '#1d4ed8';
      else color = '#172554';
    }

    if (node.isMerged) {
      color = '#1e293b';
      if (!isOtherHovered) ctx.globalAlpha = isHovered ? 0.6 : 0.25;
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

    if (isHovered) {
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#fff';
      ctx.lineWidth = isTrunk ? trunkWidth + 4 : Math.max(6, 14 - depth * 2.5);
      ctx.globalAlpha = 1;
    } else {
      ctx.lineWidth = isTrunk ? trunkWidth : Math.max(3, 10 - depth * 2.5);
    }

    ctx.strokeStyle = isTrunk ? '#1e293b' : color;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.shadowBlur = 0;

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
        const ratio = 1 - (child.behind / (rootMetadata?.maxBehind || 1));
        ctx.translate(0, -length * (0.2 + ratio * 0.75));
        ctx.translate(side * ((trunkWidth / 2) - 1), 0);
        const spread = 1.8;
        let angle = branches.length === 1 ? 0.5 * side : (Math.abs(((i / (branches.length - 1)) - 0.5) * spread)) * side;
        const clampedAngle = Math.max(-1.4, Math.min(1.4, currentAngle + angle));
        ctx.rotate(clampedAngle);
        drawNode(ctx, child, time, progress, depth + 1, clampedAngle, revealedLimit, rootMetadata, i);
        ctx.restore();
      });
    } else {
      ctx.translate(0, -length);
      const dotRadius = isHovered ? 10 : 6;
      if (nodeArrivalProgress > 0.8) {
        ctx.beginPath();
        ctx.arc(0, 0, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        if (isHovered) {
          ctx.shadowBlur = 30;
          ctx.shadowColor = '#fff';
          ctx.globalAlpha = 1;
        } else if (node.lastUpdated && (new Date().getTime() - new Date(node.lastUpdated).getTime()) < 1000 * 60 * 60 * 24) {
          if (!isOtherHovered || !isDimmed) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#818cf8';
          }
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        const matrix = ctx.getTransform();
        interactableRegions.current.push({ x: matrix.e, y: matrix.f, radius: dotRadius, node });

        ctx.save();
        ctx.rotate(-currentAngle);
        ctx.fillStyle = isHovered ? '#fff' : (node.isMerged ? '#475569' : '#f1f5f9');
        ctx.font = isHovered ? 'bold 12px monospace' : 'bold 10px monospace';
        
        if (isOtherHovered && isDimmed) ctx.globalAlpha = 0;
        else ctx.globalAlpha = isHovered ? 1 : (nodeArrivalProgress - 0.8) * 5;

        const side = getSide(node.name);
        ctx.textAlign = side > 0 ? 'left' : 'right';
        ctx.fillText(node.name, side * (isHovered ? 18 : 14), (index % 2 === 0 ? -4 : 8));
        ctx.restore();
      }

      node.children?.forEach((child, i) => {
        ctx.save();
        const spread = 0.7 * Math.pow(0.8, depth);
        const angle = ((i / (node.children.length - 1)) - 0.5) * spread || 0.3;
        ctx.rotate(angle);
        drawNode(ctx, child, time, progress, depth + 1, currentAngle + angle, revealedLimit, rootMetadata, i);
        ctx.restore();
      });
    }
    ctx.restore();
  }, [isFetching, tree.children, hoveredNodeName, isDimmed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    const render = (time: number) => {
      interactableRegions.current = [];
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2 + transform.x, canvas.height - 100 + transform.y);
      ctx.scale(transform.scale, transform.scale);
      drawNode(ctx, tree, time, growth, 0, 0, smoothLimit, tree.metadata, 0);
      ctx.restore();
      frameId = requestAnimationFrame(render);
    };
    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [tree, growth, drawNode, smoothLimit, transform]);

  return (
    <div 
      className="w-full h-full flex items-center justify-center bg-[#020617] overflow-hidden cursor-grab active:cursor-grabbing"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setIsDragging(false)}
    >
      <canvas ref={canvasRef} width={1400} height={1000} className="max-w-full max-h-full object-contain pointer-events-none" />
    </div>
  );
};