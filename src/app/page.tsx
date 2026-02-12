'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { Legend } from '@/components/ui/Legend';
import { useGitTree } from '@/hooks/useGitTree';
import { ViewMode, VisualizerNode } from '@/types';

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('facebook/react');
  const [viewMode, setViewMode] = useState<ViewMode>('branches');
  const [is3D, setIs3D] = useState(false);
  const [selectedNodeName, setSelectedNodeName] = useState<string | null>(null);
  const [hoveredNodeName, setHoveredNodeName] = useState<string | null>(null);
  const [isSidebarHover, setIsSidebarHover] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [treeKey, setTreeKey] = useState(0); 
  const { loading, error, tree, items, growth, fetchTree, fetchNodeDetails, clearCache } = useGitTree();
  const isInitialized = useRef(false);

  // Derive selectedNode from tree and selectedNodeName
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

  // Force re-render when tree content updates
  useEffect(() => {
    if (tree) setTreeKey(prev => prev + 1);
  }, [tree]);

  // Initial Load only
  useEffect(() => {
    if (isInitialized.current) return;
    
    const params = new URLSearchParams(window.location.search);
    const urlRepo = params.get('repo');
    const urlMode = params.get('mode') as ViewMode;
    
    const lastRepo = sessionStorage.getItem('last_repo_url');
    const lastMode = sessionStorage.getItem('last_view_mode') as ViewMode;

    const targetRepo = urlRepo || lastRepo;
    const targetMode = urlMode || lastMode || 'branches';

    if (targetRepo) {
      setRepoUrl(targetRepo);
      setViewMode(targetMode);
      fetchTree(targetRepo, targetMode);
      isInitialized.current = true;
    }
  }, [fetchTree]);

  // React to mode changes AFTER initialization
  useEffect(() => {
    if (!isInitialized.current) return;
    
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') !== viewMode || params.get('repo') !== repoUrl) {
      params.set('repo', repoUrl);
      params.set('mode', viewMode);
      window.history.pushState(null, '', `?${params.toString()}`);
      sessionStorage.setItem('last_view_mode', viewMode);
      fetchTree(repoUrl, viewMode);
    }
  }, [viewMode, repoUrl, fetchTree]);

  const handleFetch = useCallback(() => {
    setSelectedNodeName(null);
    setHoveredNodeName(null);
    setIsSidebarHover(false);
    
    clearCache(repoUrl, viewMode);
    
    sessionStorage.setItem('last_repo_url', repoUrl);
    sessionStorage.setItem('last_view_mode', viewMode);
    
    const params = new URLSearchParams();
    params.set('repo', repoUrl);
    params.set('mode', viewMode);
    window.history.pushState(null, '', `?${params.toString()}`);
    
    fetchTree(repoUrl, viewMode);
    isInitialized.current = true;
  }, [repoUrl, viewMode, clearCache, fetchTree]);

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
      sidebar={
        <Sidebar 
          viewMode={viewMode} 
          items={items} 
          onHover={handleSidebarHover}
          onSelect={handleSidebarSelect}
        />
      }
      footer={<Footer />}
    >
      <div className="w-full h-full relative group">
        <ViewToggle is3D={is3D} onToggle={setIs3D} />
        <Legend />

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
              key={`3d-${treeKey}`}
              tree={tree} 
              hoveredNodeName={hoveredNodeName}
              isDimmed={isSidebarHover}
              onHover={setHoveredNodeName}
              isFetching={loading} 
              onSelect={handleSelect}
            />
          ) : (
            <Visualizer 
              key={`2d-${treeKey}`}
              tree={tree} 
              hoveredNodeName={hoveredNodeName}
              isDimmed={isSidebarHover}
              onHover={setHoveredNodeName}
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