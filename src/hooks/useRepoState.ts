import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ViewMode } from '@/types';
import { storage } from '@/utils/storage';

interface UseRepoStateProps {
  fetchTree: (repoUrl: string, mode: ViewMode, forceRefresh?: boolean) => Promise<void>;
  clearCache: (repoUrl: string, mode: ViewMode) => void;
  resetSelection: () => void;
  setActiveMode: (mode: ViewMode) => void;
  hasDataForMode: (mode: ViewMode) => boolean;
}

const isValidMode = (mode: string | null): mode is ViewMode => {
  return mode === 'branches' || mode === 'pr';
};

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

  // Initialize state from searchParams OR storage to ensure server/client match and avoid set-state-in-effect
  const [repoUrl, setRepoUrl] = useState(() => {
    const urlRepo = searchParams.get('repo');
    if (urlRepo) return urlRepo;
    if (typeof window !== 'undefined') {
      return storage.getRepoUrl() || 'facebook/react';
    }
    return 'facebook/react';
  });

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const urlMode = searchParams.get('mode');
    if (isValidMode(urlMode)) return urlMode;
    if (typeof window !== 'undefined') {
      const lastMode = storage.getViewMode();
      if (isValidMode(lastMode)) return lastMode;
    }
    return 'branches';
  });

  const isInitialized = useRef(false);

  // Initial fetch/sync
  useEffect(() => {
    if (isInitialized.current) return;
    fetchTree(repoUrl, viewMode);
    isInitialized.current = true;
  }, [fetchTree, repoUrl, viewMode]);

  // Separate effect for syncing mode - only triggers when viewMode changes
  useEffect(() => {
    setActiveMode(viewMode);
  }, [viewMode, setActiveMode]);

  // Sync state back to URL and Storage
  useEffect(() => {
    if (!isInitialized.current) return;
    
    const urlMode = searchParams.get('mode');
    const urlRepo = searchParams.get('repo');
    
    if (urlMode !== viewMode || urlRepo !== repoUrl) {
      // Only sync to URL if we are on the dashboard page
      if (pathname === '/dashboard') {
        const params = new URLSearchParams(searchParams.toString());
        params.set('repo', repoUrl);
        params.set('mode', viewMode);
        
        router.replace(`${pathname}?${params.toString()}`);
      }
      
      storage.setRepoUrl(repoUrl);
      storage.setViewMode(viewMode);
      
      // Auto-fetch if switching to a mode that doesn't have data yet
      if (urlRepo === repoUrl && urlMode !== viewMode && !hasDataForMode(viewMode)) {
        fetchTree(repoUrl, viewMode);
      }
    }
  }, [viewMode, repoUrl, fetchTree, hasDataForMode, pathname, router, searchParams]);

  const handleFetch = useCallback(() => {
    resetSelection();
    clearCache(repoUrl, viewMode);
    
    if (pathname === '/dashboard') {
      const params = new URLSearchParams(searchParams.toString());
      params.set('repo', repoUrl);
      params.set('mode', viewMode);
      router.replace(`${pathname}?${params.toString()}`);
    }
    
    storage.setRepoUrl(repoUrl);
    storage.setViewMode(viewMode);
    
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
