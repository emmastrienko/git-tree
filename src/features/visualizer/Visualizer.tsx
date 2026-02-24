'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { VisualizerNode } from '@/types';
import { 
  INITIAL_SCALE, ZOOM_SPEED, MIN_SCALE, MAX_SCALE, 
  SMOOTH_LIMIT_STEP, CANVAS_WIDTH, CANVAS_HEIGHT, TRUNK_WIDTH,
  SHADOW_BLUR_NORMAL, SHADOW_BLUR_HIGHLIGHT, ONE_DAY_MS,
  COLOR_RATIO_LEVELS, TREE_NODE_PROGRESS_THRESHOLD,
  TREE_LAYOUT
} from '@/constants';

interface VisualizerProps {
  tree: VisualizerNode;
  growth?: number;
  isFetching?: boolean;
  hoveredNodeName?: string | null;
  filterAuthor?: string | null;
  isDimmed?: boolean;
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
  hoveredNodeName,
  filterAuthor,
  isDimmed,
  onHover,
  onSelect 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const interactableRegions = useRef<InteractableRegion[]>([]);
  const [smoothLimit, setSmoothLimit] = useState(0);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: INITIAL_SCALE });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (tree.children?.length === 0) {
      setSmoothLimit(0);
      setTransform({ x: 0, y: 0, scale: INITIAL_SCALE });
    }
  }, [tree.name]);

  const handleWheel = (e: React.WheelEvent) => {
    const delta = -e.deltaY * ZOOM_SPEED;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale + delta))
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
        if (hoveredNode && !isDragging) {
          container.style.cursor = 'pointer';
          if (hoveredNode.name !== hoveredNodeName && !isDimmed) {
            onHover?.(hoveredNode.name);
          }
        } else {
          container.style.cursor = isDragging ? 'grabbing' : 'grab';
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
      setSmoothLimit(prev => (prev < target ? prev + SMOOTH_LIMIT_STEP : prev));
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

  const drawFileGarden = useCallback(function drawGarden(
    ctx: CanvasRenderingContext2D,
    node: VisualizerNode,
    len: number,
    depth: number,
    time: number,
    progress: number
  ) {
    if (!node || depth > 6) return;
    const currentLen = len * progress;
    ctx.save();
    ctx.rotate(Math.sin(time * 0.001 + depth * 0.5) * (0.02 * depth));
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(Math.sin(time * 0.0005 + depth) * 5, -currentLen/2, 0, -currentLen);
    ctx.strokeStyle = `hsla(215, 20%, ${40 + depth * 8}%, ${0.8 - depth * 0.1})`;
    ctx.lineWidth = Math.max(0.5, 6 - depth * 1);
    ctx.stroke();
    ctx.translate(0, -currentLen);
    if (node.type === 'file') {
      const size = (Math.log10((node.metadata?.additions || 0) + 1) * 4 + 2) * progress;
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fillStyle = '#60a5fa';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#60a5fa';
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.save();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px monospace';
      ctx.fillText(node.name, size + 4, 3);
      ctx.restore();
    }
    node.children?.forEach((child, i) => {
      ctx.save();
      const angle = node.children.length === 1 ? 0.3 : ((i / (node.children.length - 1)) - 0.5) * 1.2;
      ctx.rotate(angle);
      drawGarden(ctx, child, len * 0.75, depth + 1, time, progress);
      ctx.restore();
    });
    ctx.restore();
  }, []);

  const drawNode = useCallback(function draw(
    ctx: CanvasRenderingContext2D,
    node: VisualizerNode,
    time: number,
    progress: number,
    depth: number,
    currentAngle: number,
    revealedLimit: number,
    rootMetadata: any,
    index: number = 0
  ) {
    if (node.discoveryIndex !== undefined && node.discoveryIndex > revealedLimit) return;

    const nodeArrivalProgress = node.discoveryIndex !== undefined 
      ? Math.max(0, Math.min(1, revealedLimit - node.discoveryIndex))
      : 1;

    const isTrunk = node.type === 'trunk';
    const isHighlighted = hoveredNodeName === node.name || (filterAuthor && node.author?.login === filterAuthor);
    const isOtherHighlighted = (hoveredNodeName && hoveredNodeName !== node.name) || (filterAuthor && node.author?.login !== filterAuthor);
    const val = node.relativeAhead ?? node.ahead;
    
    const length = isTrunk 
      ? TREE_LAYOUT.trunkLength * progress 
      : (Math.log10(val + 1) * TREE_LAYOUT.branchLengthFactor + TREE_LAYOUT.branchLengthBase) * progress * nodeArrivalProgress * Math.pow(TREE_LAYOUT.branchShrinkage, depth);

    ctx.save();

    // Dim effect
    if (isOtherHighlighted && isDimmed) ctx.globalAlpha = 0.1;

    // Color selection: Priority = PR Status > Conflicts > Activity Gradient
    let color = '#3b82f6'; 
    const isPR = node.metadata?.prNumber;

    if (isPR) {
      const status = node.metadata?.status;
      if (status === 'APPROVED') color = '#22c55e'; // Success Green
      else if (status === 'CHANGES_REQUESTED') color = '#f43f5e'; // Error Rose
      else color = '#eab308'; // Pending Yellow
    } else if (node.hasConflicts) {
      color = '#f43f5e';
    } else if (node.lastUpdated && rootMetadata?.newestTimestamp) {
      const current = new Date(node.lastUpdated).getTime();
      const newest = rootMetadata.newestTimestamp;
      const oldest = rootMetadata.oldestTimestamp;
      const range = Math.max(newest - oldest, 1);
      const ratio = Math.max(0, Math.min(1, (current - oldest) / range));
      
      if (ratio > COLOR_RATIO_LEVELS.VERY_HIGH) color = '#60a5fa';
      else if (ratio > COLOR_RATIO_LEVELS.HIGH) color = '#3b82f6';
      else if (ratio > COLOR_RATIO_LEVELS.MEDIUM) color = '#2563eb';
      else if (ratio > COLOR_RATIO_LEVELS.LOW) color = '#1d4ed8';
      else color = '#172554';
    }

    if (node.isMerged) {
      color = '#1e293b';
      if (!isOtherHighlighted) ctx.globalAlpha = isHighlighted ? 0.6 : 0.25;
    }

    ctx.beginPath();
    ctx.moveTo(0, 0);
    if (isTrunk) {
      ctx.lineTo(0, -length);
    } else {
      const cp1x = Math.sin(time * 0.0005 + depth) * 10;
      const cp1y = -length / 2;
      ctx.quadraticCurveTo(cp1x, cp1y, 0, -length);
    }

    if (isHighlighted) {
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#fff';
      ctx.lineWidth = isTrunk ? TRUNK_WIDTH + 4 : Math.max(6, 14 - depth * 2.5);
      ctx.globalAlpha = 1;
    } else {
      ctx.lineWidth = isTrunk ? TRUNK_WIDTH : Math.max(3, 10 - depth * 2.5);
    }

    ctx.strokeStyle = isTrunk ? '#1e293b' : color;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (isTrunk) {
      const branches = tree.children || [];
      branches.forEach((child, i) => {
        ctx.save();
        const side = getSide(child.name);
        const ratio = 1 - (child.behind / (rootMetadata?.maxBehind || 1));
        ctx.translate(0, -length * (0.2 + ratio * 0.75));
        ctx.translate(side * ((TRUNK_WIDTH / 2) - 1), 0);
        const spread = TREE_LAYOUT.branchSpread;
        const angle = branches.length === 1 ? 0.5 * side : (Math.abs(((i / (branches.length - 1)) - 0.5) * spread)) * side;
        const clampedAngle = Math.max(-1.4, Math.min(1.4, currentAngle + angle));
        ctx.rotate(clampedAngle);
        draw(ctx, child, time, progress, depth + 1, clampedAngle, revealedLimit, rootMetadata, i);
        ctx.restore();
      });
    } else {
      ctx.translate(0, -length);
      const dotRadius = isHighlighted ? 10 : 6;
      if (nodeArrivalProgress > TREE_NODE_PROGRESS_THRESHOLD) {
        ctx.beginPath();
        ctx.arc(0, 0, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        if (isHighlighted) {
          ctx.shadowBlur = SHADOW_BLUR_HIGHLIGHT;
          ctx.shadowColor = '#fff';
          ctx.globalAlpha = 1;
        } else if (node.lastUpdated && (new Date().getTime() - new Date(node.lastUpdated).getTime()) < ONE_DAY_MS) {
          if (!isOtherHighlighted || !isDimmed) {
            ctx.shadowBlur = SHADOW_BLUR_NORMAL;
            ctx.shadowColor = '#818cf8';
          }
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        const matrix = ctx.getTransform();
        interactableRegions.current.push({ x: matrix.e, y: matrix.f, radius: dotRadius, node });

        if (node.fileTree && (isHighlighted || node.type !== 'trunk')) {
          ctx.save();
          drawFileGarden(ctx, node.fileTree, 40, 0, time, 1);
          ctx.restore();
        }

        ctx.save();
        ctx.rotate(-currentAngle);
        ctx.fillStyle = isHighlighted ? '#fff' : (node.isMerged ? '#475569' : '#f1f5f9');
        ctx.font = isHighlighted ? 'bold 12px monospace' : 'bold 10px monospace';
        
        if (isOtherHighlighted && isDimmed) ctx.globalAlpha = 0;
        else ctx.globalAlpha = isHighlighted ? 1 : (nodeArrivalProgress - TREE_NODE_PROGRESS_THRESHOLD) * 5;

        const side = getSide(node.name);
        ctx.textAlign = side > 0 ? 'left' : 'right';
        ctx.fillText(node.name, side * (isHighlighted ? 18 : 14), (index % 2 === 0 ? -4 : 8));
        ctx.restore();
      }

      node.children?.forEach((child, i) => {
        ctx.save();
        const spread = TREE_LAYOUT.leafSpread * Math.pow(TREE_LAYOUT.leafShrinkage, depth);
        const angle = ((i / (node.children.length - 1)) - 0.5) * spread || 0.3;
        ctx.rotate(angle);
        draw(ctx, child, time, progress, depth + 1, currentAngle + angle, revealedLimit, rootMetadata, i);
        ctx.restore();
      });
    }
    ctx.restore();
  }, [tree.children, hoveredNodeName, isDimmed, filterAuthor, drawFileGarden]);

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
      ctx.translate(canvas.width / 2 + transform.x, canvas.height - TREE_LAYOUT.trunkBaseY + transform.y);
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
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="max-w-full max-h-full object-contain pointer-events-none" />
    </div>
  );
};