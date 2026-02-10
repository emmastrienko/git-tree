'use client';

import { useState, useEffect } from 'react';
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
  const [selectedNodeName, setSelectedNodeName] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const { loading, error, tree, items, growth, fetchTree, fetchNodeDetails } = useGitTree();

  // Find the selected node in the current tree
  const selectedNode = tree ? (() => {
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
  })() : null;

  // Auto-load last session on mount
  useEffect(() => {
    const lastRepo = sessionStorage.getItem('last_repo_url');
    const lastMode = sessionStorage.getItem('last_view_mode') as ViewMode;
    
    if (lastRepo) {
      setRepoUrl(lastRepo);
      if (lastMode) setViewMode(lastMode);
      fetchTree(lastRepo, lastMode || 'branches');
    }
  }, [fetchTree]);

  const handleFetch = () => {
    setSelectedNodeName(null);
    sessionStorage.setItem('last_repo_url', repoUrl);
    sessionStorage.setItem('last_view_mode', viewMode);
    fetchTree(repoUrl, viewMode);
  };

  const handleSelect = (node: VisualizerNode, pos: { x: number; y: number }) => {
    setSelectedNodeName(node.name);
    setTooltipPos(pos);
  };

  return (
    <MainLayout
      header={({ onMenuClick }) => (
        <Header 
          repoUrl={repoUrl} 
          setRepoUrl={setRepoUrl} 
          viewMode={viewMode}
          setViewMode={setViewMode}
          onFetch={handleFetch}
          loading={loading}
          onMenuClick={onMenuClick}
        />
      )}
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
            onClose={() => setSelectedNodeName(null)} 
            fetchDetails={() => fetchNodeDetails(repoUrl, selectedNode)}
          />
        )}

        {tree && !error ? (
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
          <EmptyState loading={loading} error={error} />
        )}
      </div>
    </MainLayout>
  );
}
