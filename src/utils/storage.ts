import { ViewMode } from "@/types";

const KEYS = {
  REPO_URL: 'last_repo_url',
  VIEW_MODE: 'last_view_mode',
  CACHE_PREFIX: 'git_viz_cache_',
} as const;

export const storage = {
  getRepoUrl: (): string | null => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(KEYS.REPO_URL);
  },
  
  setRepoUrl: (url: string): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(KEYS.REPO_URL, url);
  },

  getViewMode: (): ViewMode | null => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(KEYS.VIEW_MODE) as ViewMode | null;
  },

  setViewMode: (mode: ViewMode): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(KEYS.VIEW_MODE, mode);
  },

  // Cache management
  getCacheItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(KEYS.CACHE_PREFIX + key);
  },

  setCacheItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(KEYS.CACHE_PREFIX + key, value);
  },

  removeCacheItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(KEYS.CACHE_PREFIX + key);
  },

  getCacheKeys: (): string[] => {
    if (typeof window === 'undefined') return [];
    return Object.keys(sessionStorage).filter(k => k.startsWith(KEYS.CACHE_PREFIX));
  },

  removeRawKey: (key: string): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(key);
  },

  clearAll: (): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.clear();
  },

  clearState: (): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(KEYS.REPO_URL);
    sessionStorage.removeItem(KEYS.VIEW_MODE);
  }
};
