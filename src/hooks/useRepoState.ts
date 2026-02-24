import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Initialize state from URL or SessionStorage
  const [repoUrl, setRepoUrl] = useState(() => {
    if (typeof window === 'undefined') return 'facebook/react';
    return searchParams.get('repo') || sessionStorage.getItem('last_repo_url') || 'facebook/react';
  });

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'branches';
    return (searchParams.get('mode') as ViewMode) || (sessionStorage.getItem('last_view_mode') as ViewMode) || 'branches';
  });

  const isInitialized = useRef(false);

  // Initial fetch
  useEffect(() => {
    if (isInitialized.current) return;
    
    fetchTree(repoUrl, viewMode);
    isInitialized.current = true;
  }, [fetchTree, repoUrl, viewMode]);

  // Sync state back to URL and Storage
  useEffect(() => {
    if (!isInitialized.current) return;
    
    const urlMode = searchParams.get('mode');
    const urlRepo = searchParams.get('repo');
    
    // Always sync mode to the tree hook
    setActiveMode(viewMode);
    
    if (urlMode !== viewMode || urlRepo !== repoUrl) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('repo', repoUrl);
      params.set('mode', viewMode);
      
      router.replace(`${pathname}?${params.toString()}`);
      
      sessionStorage.setItem('last_repo_url', repoUrl);
      sessionStorage.setItem('last_view_mode', viewMode);
      
      // Auto-fetch if switching to a mode that doesn't have data yet
      if (urlRepo === repoUrl && urlMode !== viewMode && !hasDataForMode(viewMode)) {
        fetchTree(repoUrl, viewMode);
      }
    }
  }, [viewMode, repoUrl, fetchTree, setActiveMode, hasDataForMode, pathname, router, searchParams]);

  const handleFetch = useCallback(() => {
    resetSelection();
    clearCache(repoUrl, viewMode);
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('repo', repoUrl);
    params.set('mode', viewMode);
    router.replace(`${pathname}?${params.toString()}`);
    
    sessionStorage.setItem('last_repo_url', repoUrl);
    sessionStorage.setItem('last_view_mode', viewMode);
    
    fetchTree(repoUrl, viewMode, true);
  }, [repoUrl, viewMode, clearCache, fetchTree, resetSelection, pathname, router, searchParams]);

  return {
    repoUrl,
    setRepoUrl,
    viewMode,
    setViewMode,
    handleFetch
  };
};
