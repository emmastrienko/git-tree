'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';
import { Visualizer } from '@/features/visualizer/Visualizer';
import { useGitTree } from '@/hooks/useGitTree';
import { ViewMode } from '@/types';

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('facebook/react');
  const [viewMode, setViewMode] = useState<ViewMode>('branches');
  const { loading, tree, items, growth, fetchTree } = useGitTree();

  return (
    <MainLayout
      header={
        <Header 
          repoUrl={repoUrl} 
          setRepoUrl={setRepoUrl} 
          viewMode={viewMode}
          setViewMode={setViewMode}
          onFetch={() => fetchTree(repoUrl, viewMode)}
          loading={loading}
        />
      }
      sidebar={<Sidebar viewMode={viewMode} items={items} />}
      footer={<Footer />}
    >
      <div className="w-full h-full relative">
        {tree ? <Visualizer tree={tree} growth={growth} /> : (
          <div className="w-full h-full flex items-center justify-center text-slate-700 font-medium italic">
            {loading ? 'Analyzing Git graph...' : 'Enter a repository path to begin'}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
