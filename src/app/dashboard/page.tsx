'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';
import { VisualizerContainer } from '@/features/visualizer/VisualizerContainer';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { SyncStatus } from '@/components/ui/SyncStatus';
import { NodeTooltip } from '@/components/ui/NodeTooltip';
import { Legend } from '@/components/ui/Legend';
import { useGitTree } from '@/hooks/useGitTree';
import { useVisualizerState } from '@/hooks/useVisualizerState';
import { useRepoState } from '@/hooks/useRepoState';

export default function Home() {
  const { 
    loading, syncing, error, tree, items, growth, 
    fetchTree, fetchNodeDetails, clearCache,
    setActiveMode, hasDataForMode
  } = useGitTree();

  const {
    is3D, setIs3D,
    selectedNodeName, setSelectedNodeName,
    hoveredNodeName, setHoveredNodeName,
    filterAuthor, setFilterAuthor,
    isSidebarHover,
    tooltipPos,
    selectedNode,
    handleSelect,
    handleSidebarSelect,
    handleSidebarHover,
    resetSelection
  } = useVisualizerState(tree);

  const {
    repoUrl, setRepoUrl,
    viewMode, setViewMode,
    handleFetch
  } = useRepoState({
    fetchTree,
    clearCache,
    resetSelection,
    setActiveMode,
    hasDataForMode
  });

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
          minimal={false}
        />
      )}
      sidebar={
        <Sidebar 
          viewMode={viewMode} 
          items={items} 
          onHover={handleSidebarHover}
          onSelect={handleSidebarSelect}
          filterAuthor={filterAuthor}
          onFilterAuthor={setFilterAuthor}
          selectedNodeName={selectedNodeName}
        />
      }
      footer={<Footer />}
    >
      <div className="w-full h-full relative group">
        <ViewToggle is3D={is3D} onToggle={setIs3D} />
        <Legend />

        {(loading || syncing) && tree && <SyncStatus itemCount={items.length} syncing={syncing} />}

        {selectedNode && (
          <NodeTooltip 
            node={selectedNode} 
            position={tooltipPos} 
            repoUrl={repoUrl}
            onClose={() => setSelectedNodeName(null)} 
            fetchDetails={() => fetchNodeDetails(repoUrl, selectedNode)}
          />
        )}

        <VisualizerContainer
          tree={tree}
          error={error}
          is3D={is3D}
          loading={loading}
          growth={growth}
          hoveredNodeName={hoveredNodeName}
          filterAuthor={filterAuthor}
          isSidebarHover={isSidebarHover}
          onHover={setHoveredNodeName}
          onSelect={handleSelect}
        />
      </div>
    </MainLayout>
  );
}
