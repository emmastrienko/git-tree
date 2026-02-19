import { useCallback } from 'react';

const CACHE_PREFIX = 'git_viz_';

export const useCache = () => {
  const pruneCache = useCallback(() => {
    try {
      const keys = Object.keys(sessionStorage).filter(k => k.startsWith(CACHE_PREFIX));
      keys.slice(0, Math.ceil(keys.length / 2)).forEach(k => sessionStorage.removeItem(k));
    } catch (e) {
      sessionStorage.clear();
    }
  }, []);

  const setCache = useCallback((key: string, value: any) => {
    if (typeof window === 'undefined') return;
    
    const minimizedValue = {
      ...value,
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
      sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(minimizedValue));
    } catch (e) {
      if (e instanceof Error && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        pruneCache();
        try {
          sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(minimizedValue));
        } catch {
          console.error('[Cache] Failed to save even after pruning.');
        }
      }
    }
  }, [pruneCache]);

  const getCache = useCallback((key: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const data = sessionStorage.getItem(CACHE_PREFIX + key);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  }, []);

  const removeCache = useCallback((key: string) => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(CACHE_PREFIX + key);
  }, []);

  return { setCache, getCache, removeCache };
};
