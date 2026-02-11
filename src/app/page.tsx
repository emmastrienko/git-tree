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
  const { loading, error, tree, items, growth, fetchTree, fetchNodeDetails, clearCache } = useGitTree();

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

  // Sync selectedNode when tree updates (for on-demand data)
  useEffect(() => {
    if (selectedNodeName && tree) {
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
      const updated = findNode(tree);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedNode)) {
        // Just trigger a re-render if data has changed
        setSelectedNodeName(updated.name);
      }
    }
  }, [tree, selectedNodeName, selectedNode]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRepo = params.get('repo');
    const urlMode = params.get('mode') as ViewMode;
    
    const lastRepo = sessionStorage.getItem('last_repo_url');
    const lastMode = sessionStorage.getItem('last_view_mode') as ViewMode;

    // Only load automatically if we have a specific target from URL or Last Session
    if (urlRepo || lastRepo) {
      const targetRepo = urlRepo || lastRepo!;
      const targetMode = urlMode || lastMode || 'branches';

      setRepoUrl(targetRepo);
      setViewMode(targetMode);
      fetchTree(targetRepo, targetMode);
      
      if (!urlRepo) {
        const newParams = new URLSearchParams();
        newParams.set('repo', targetRepo);
        newParams.set('mode', targetMode);
        window.history.replaceState(null, '', `?${newParams.toString()}`);
      }
    }
  }, [fetchTree]);

  const handleFetch = () => {
    setSelectedNodeName(null);
    
    // Force Refresh: Clear the cache for this specific repo/mode before fetching
    clearCache(repoUrl, viewMode);
    
    sessionStorage.setItem('last_repo_url', repoUrl);
    sessionStorage.setItem('last_view_mode', viewMode);
    
    const params = new URLSearchParams();
    params.set('repo', repoUrl);
    params.set('mode', viewMode);
    window.history.pushState(null, '', `?${params.toString()}`);
    
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
