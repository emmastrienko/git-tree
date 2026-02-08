'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';
import { Visualizer } from '@/features/visualizer/Visualizer';
import { useGitTree } from '@/hooks/useGitTree';
import { ViewMode } from '@/types';
import { Loader2, Activity } from 'lucide-react';

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
      <div className="w-full h-full relative group">
        {/* Incremental Progress Indicator */}
        {loading && tree && (
          <div className="absolute top-6 right-6 z-30 flex items-center gap-3 px-4 py-2 bg-slate-900/80 border border-indigo-500/20 rounded-full backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
            <Activity className="text-indigo-500 animate-pulse" size={14} />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
              Syncing: <span className="text-indigo-400 font-mono">{items.length}</span> branches
            </span>
            <Loader2 className="animate-spin text-indigo-500/50" size={12} />
          </div>
        )}

        {tree ? (
          <Visualizer tree={tree} growth={growth} isFetching={loading} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-700">
            {loading ? (
              <>
                <Loader2 className="animate-spin text-indigo-500/50" size={32} />
                <span className="text-xs font-bold uppercase tracking-[0.2em] animate-pulse">
                  Initializing Graph Engine
                </span>
              </>
            ) : (
              <div className="font-medium italic">
                Enter a repository path to begin
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
