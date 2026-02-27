import { useState, useCallback, useMemo, useEffect } from 'react';
import { VisualizerNode } from '@/types';

export const useVisualizerState = (tree: VisualizerNode | null) => {
  const [is3D, setIs3D] = useState(false);
  const [selectedNodeName, setSelectedNodeName] = useState<string | null>(null);
  const [hoveredNodeName, setHoveredNodeName] = useState<string | null>(null);
  const [filterAuthor, setFilterAuthor] = useState<string | null>(null);
  const [isSidebarHover, setIsSidebarHover] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const selectedNode = useMemo(() => {
    if (!tree || !selectedNodeName) return null;
    const findNode = (curr: VisualizerNode): VisualizerNode | null => {
      if (curr.name === selectedNodeName) return curr;
      if (curr.children) {
        for (const child of curr.children) {
          const found = findNode(child);
          if (found) return found;
        }
      }
      return null;
    };
    return findNode(tree);
  }, [tree, selectedNodeName]);

  const handleSelect = useCallback((node: VisualizerNode, pos: { x: number; y: number }) => {
    setSelectedNodeName(node.name);
    setTooltipPos(pos);
  }, []);

  const handleSidebarSelect = useCallback((name: string) => {
    const findAndSelect = (curr: VisualizerNode) => {
      if (curr.name === name) handleSelect(curr, { x: 400, y: 400 });
      curr.children?.forEach(findAndSelect);
    };
    if (tree) findAndSelect(tree);
  }, [tree, handleSelect]);

  const handleSidebarHover = useCallback((name: string | null) => {
    setHoveredNodeName(name);
    setIsSidebarHover(!!name);
  }, []);

  const resetSelection = useCallback(() => {
    setSelectedNodeName(null);
    setHoveredNodeName(null);
    setFilterAuthor(null);
    setIsSidebarHover(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedNodeName(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    is3D, setIs3D,
    selectedNodeName, setSelectedNodeName,
    hoveredNodeName, setHoveredNodeName,
    filterAuthor, setFilterAuthor,
    isSidebarHover, setIsSidebarHover,
    tooltipPos, setTooltipPos,
    selectedNode,
    handleSelect,
    handleSidebarSelect,
    handleSidebarHover,
    resetSelection
  };
};
