'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';
import { Visualizer } from '@/features/visualizer/Visualizer';
import { ThreeVisualizer } from '@/features/visualizer/ThreeVisualizer';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { SyncStatus } from '@/components/ui/SyncStatus';
import { EmptyState } from '@/components/ui/EmptyState';
import { NodeTooltip } from '@/components/ui/NodeTooltip';
import { useGitTree } from '@/hooks/useGitTree';
import { ViewMode, VisualizerNode } from '@/types';

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('facebook/react');
  const [viewMode, setViewMode] = useState<ViewMode>('branches');
  const [is3D, setIs3D] = useState(false);
  const [selectedNode, setSelectedNode] = useState<VisualizerNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const { loading, tree, items, growth, fetchTree } = useGitTree();

  const handleFetch = () => {
    setSelectedNode(null);
    fetchTree(repoUrl, viewMode);
  };

  const handleSelect = (node: VisualizerNode, pos: { x: number; y: number }) => {
    setSelectedNode(node);
    setTooltipPos(pos);
  };

  return (
    <MainLayout
      header={
        <Header 
          repoUrl={repoUrl} 
          setRepoUrl={setRepoUrl} 
          viewMode={viewMode}
          setViewMode={setViewMode}
          onFetch={handleFetch}
          loading={loading}
        />
      }
      sidebar={<Sidebar viewMode={viewMode} items={items} />}
      footer={<Footer />}
    >
      <div className="w-full h-full relative group">
        <ViewToggle is3D={is3D} onToggle={setIs3D} />

        {loading && tree && <SyncStatus itemCount={items.length} />}

        {selectedNode && (
          <NodeTooltip 
            node={selectedNode} 
            position={tooltipPos} 
            repoUrl={repoUrl}
            onClose={() => setSelectedNode(null)} 
          />
        )}

        {tree ? (
          is3D ? (
            <ThreeVisualizer 
              tree={tree} 
              isFetching={loading} 
              onSelect={handleSelect}
            />
          ) : (
            <Visualizer 
              tree={tree} 
              growth={growth} 
              isFetching={loading} 
              onSelect={handleSelect}
            />
          )
        ) : (
          <EmptyState loading={loading} />
        )}
      </div>
    </MainLayout>
  );
}
