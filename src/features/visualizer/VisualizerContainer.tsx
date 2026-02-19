'use client';

import React from 'react';
import { VisualizerNode } from '@/types';
import { Visualizer } from './Visualizer';
import { ThreeVisualizer } from './ThreeVisualizer';
import { EmptyState } from '@/components/ui/EmptyState';

interface VisualizerContainerProps {
  tree: VisualizerNode | null;
  error: string | null;
  is3D: boolean;
  loading: boolean;
  growth: number;
  hoveredNodeName: string | null;
  filterAuthor: string | null;
  isSidebarHover: boolean;
  onHover: (name: string | null) => void;
  onSelect: (node: VisualizerNode, pos: { x: number; y: number }) => void;
}

export const VisualizerContainer: React.FC<VisualizerContainerProps> = ({
  tree,
  error,
  is3D,
  loading,
  growth,
  hoveredNodeName,
  filterAuthor,
  isSidebarHover,
  onHover,
  onSelect,
}) => {
  if (!tree || error) {
    return <EmptyState loading={loading} error={error} />;
  }

  const isDimmed = isSidebarHover || !!filterAuthor;

  if (is3D) {
    return (
      <ThreeVisualizer
        tree={tree}
        hoveredNodeName={hoveredNodeName}
        filterAuthor={filterAuthor}
        isDimmed={isDimmed}
        onHover={onHover}
        isFetching={loading}
        onSelect={onSelect}
      />
    );
  }

  return (
    <Visualizer
      tree={tree}
      hoveredNodeName={hoveredNodeName}
      filterAuthor={filterAuthor}
      isDimmed={isDimmed}
      onHover={onHover}
      growth={growth}
      isFetching={loading}
      onSelect={onSelect}
    />
  );
};
