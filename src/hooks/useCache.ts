import { useCallback } from 'react';
import { storage } from '@/utils/storage';

interface CachedData {
  items: any[];
  tree: any;
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
    } catch (e) {
      storage.clearAll();
    }
  }, []);

  const setCache = useCallback((key: string, value: any) => {
    if (typeof window === 'undefined') return;
    
    const minimizedValue: CachedData = {
      ...value,
      lastAccessed: Date.now(),
      items: value.items.map((item: any) => ({
        id: item.id,
        number: item.number,
        title: item.title,
        name: item.name,
        state: item.state,
        draft: item.draft,
        html_url: item.html_url,
        ahead: item.ahead,
        behind: item.behind,
        history: item.history,
        review_status: item.review_status,
        lastUpdated: item.lastUpdated,
        author: item.author,
        user: item.user ? { login: item.user.login, avatar_url: item.user.avatar_url } : undefined,
        head: item.head ? { ref: item.head.ref, sha: item.head.sha } : undefined
      }))
    };

    try {
      storage.setCacheItem(key, JSON.stringify(minimizedValue));
    } catch (e) {
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
      } catch (e) {
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
