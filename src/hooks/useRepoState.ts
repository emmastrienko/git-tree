import { useState, useEffect, useCallback, useRef } from 'react';
import { ViewMode } from '@/types';

interface UseRepoStateProps {
  fetchTree: (repoUrl: string, mode: ViewMode, forceRefresh?: boolean) => Promise<void>;
  clearCache: (repoUrl: string, mode: ViewMode) => void;
  resetSelection: () => void;
  setActiveMode: (mode: ViewMode) => void;
  hasDataForMode: (mode: ViewMode) => boolean;
}

export const useRepoState = ({ 
  fetchTree, 
  clearCache, 
  resetSelection, 
  setActiveMode,
  hasDataForMode
}: UseRepoStateProps) => {
  const [repoUrl, setRepoUrl] = useState('facebook/react');
  const [viewMode, setViewMode] = useState<ViewMode>('branches');
  const isInitialized = useRef(false);

  // Initial sync from URL or SessionStorage
  useEffect(() => {
    if (isInitialized.current) return;

    const params = new URLSearchParams(window.location.search);
    const urlRepo = params.get('repo');
    const urlMode = params.get('mode') as ViewMode;
    const lastRepo = sessionStorage.getItem('last_repo_url');
    const lastMode = sessionStorage.getItem('last_view_mode') as ViewMode;
    
    const finalRepo = urlRepo || lastRepo;
    const finalMode = urlMode || lastMode || 'branches';

    if (finalRepo) {
      setRepoUrl(finalRepo);
      setViewMode(finalMode);
      fetchTree(finalRepo, finalMode);
    } else {
      setRepoUrl('facebook/react');
      setViewMode('branches');
    }

    isInitialized.current = true;
  }, [fetchTree]);

  // Sync state back to URL and Storage
  useEffect(() => {
    if (!isInitialized.current) return;
    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get('mode');
    const urlRepo = params.get('repo');
    
    // Always sync mode to the tree hook
    setActiveMode(viewMode);
    
    if (urlMode !== viewMode || urlRepo !== repoUrl) {
      const newParams = new URLSearchParams();
      newParams.set('repo', repoUrl);
      newParams.set('mode', viewMode);
      window.history.pushState(null, '', `?${newParams.toString()}`);
      sessionStorage.setItem('last_repo_url', repoUrl);
      sessionStorage.setItem('last_view_mode', viewMode);
      
      // Auto-fetch if switching to a mode that doesn't have data yet
      if (urlRepo === repoUrl && urlMode !== viewMode && !hasDataForMode(viewMode)) {
        console.log(`[useRepoState] Mode switched to ${viewMode}, triggering auto-fetch...`);
        fetchTree(repoUrl, viewMode);
      }
    }
  }, [viewMode, repoUrl, fetchTree, setActiveMode, hasDataForMode]);

  const handleFetch = useCallback(() => {
    resetSelection();
    clearCache(repoUrl, viewMode);
    
    const params = new URLSearchParams();
    params.set('repo', repoUrl);
    params.set('mode', viewMode);
    window.history.pushState(null, '', `?${params.toString()}`);
    sessionStorage.setItem('last_repo_url', repoUrl);
    sessionStorage.setItem('last_view_mode', viewMode);
    
    fetchTree(repoUrl, viewMode, true);
  }, [repoUrl, viewMode, clearCache, fetchTree, resetSelection]);

  return {
    repoUrl,
    setRepoUrl,
    viewMode,
    setViewMode,
    handleFetch
  };
};
