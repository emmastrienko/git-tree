import { useCallback } from 'react';
import { GitBranch, GitPullRequest, VisualizerNode } from '@/types';
import { storage } from '@/utils/storage';

interface CachedData {
  items: unknown[];
  tree: VisualizerNode;
  lastAccessed: number;
}

export const useCache = () => {
  const pruneCache = useCallback(() => {
    try {
      const keys = storage.getCacheKeys();
      
      // Get all cached items with their timestamps
      const entries = keys.map(key => {
        try {
          const raw = sessionStorage.getItem(key); // We use raw here as keys already have prefix
          const data = raw ? JSON.parse(raw) : null;
          return { key, lastAccessed: data?.lastAccessed || 0 };
        } catch {
          return { key, lastAccessed: 0 };
        }
      });

      // Sort by lastAccessed (oldest first)
      entries.sort((a, b) => a.lastAccessed - b.lastAccessed);

      // Remove the oldest 50% of entries to create a buffer
      const toRemove = entries.slice(0, Math.ceil(entries.length / 2));
      toRemove.forEach(entry => storage.removeRawKey(entry.key));
      
      console.log(`[Cache] LRU Pruning: Removed ${toRemove.length} oldest items.`);
    } catch {
      storage.clearAll();
    }
  }, []);

  const setCache = useCallback((key: string, value: { items: (GitBranch | GitPullRequest)[], tree: VisualizerNode }) => {
    if (typeof window === 'undefined') return;
    
    const minimizedValue: CachedData = {
      ...value,
      lastAccessed: Date.now(),
      items: value.items.map((item: GitBranch | GitPullRequest) => {
        const b = item as any;
        return {
          id: b.id,
          number: b.number,
          title: b.title,
          name: b.name,
          state: b.state,
          draft: b.draft,
          html_url: b.html_url,
          ahead: b.ahead,
          behind: b.behind,
          history: b.history,
          review_status: b.review_status,
          lastUpdated: b.lastUpdated,
          author: b.author,
          user: b.user ? { login: b.user.login, avatar_url: b.user.avatar_url } : undefined,
          head: b.head ? { ref: b.head.ref, sha: b.head.sha } : undefined
        };
      })
    };

    try {
      storage.setCacheItem(key, JSON.stringify(minimizedValue));
    } catch (e: unknown) {
      if (e instanceof Error && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        pruneCache();
        try {
          storage.setCacheItem(key, JSON.stringify(minimizedValue));
        } catch {
          console.error('[Cache] Failed to save even after pruning.');
        }
      }
    }
  }, [pruneCache]);

  const getCache = useCallback((key: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = storage.getCacheItem(key);
      if (!raw) return null;

      const data: CachedData = JSON.parse(raw);
      
      // Update lastAccessed timestamp on read (LRU)
      data.lastAccessed = Date.now();
      try {
        storage.setCacheItem(key, JSON.stringify(data));
      } catch {
        // If we can't update the timestamp due to quota, just return the data
      }
      
      return data;
    } catch { return null; }
  }, []);

  const removeCache = useCallback((key: string) => {
    storage.removeCacheItem(key);
  }, []);

  return { setCache, getCache, removeCache };
};
