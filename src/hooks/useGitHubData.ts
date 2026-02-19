import { useState, useCallback, useRef, useEffect } from 'react';
import { githubService } from '@/services/github';
import { parseBranchTree } from '@/utils/tree-parser';
import { GitBranch, ViewMode, VisualizerNode } from '@/types';
import { ENRICH_CHUNK_SIZE, MAX_FETCH_PAGES, TWO_YEARS_MS } from '@/constants';

// Singleton worker for tree parsing
let treeWorker: Worker | null = null;
const getWorker = () => {
  if (typeof window === 'undefined') return null;
  if (!treeWorker) {
    treeWorker = new Worker(new URL('../utils/tree-parser.worker.ts', import.meta.url));
  }
  return treeWorker;
};

export const useGitHubData = () => {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const parsingRequestId = useRef<number>(0);

  const getNewAbortSignal = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current.signal;
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const parseTreeAsync = useCallback((branches: GitBranch[], defaultBranch: string) => {
    return new Promise<VisualizerNode>((resolve, reject) => {
      const worker = getWorker();
      if (!worker) {
        resolve(parseBranchTree(branches, defaultBranch));
        return;
      }

      const requestId = ++parsingRequestId.current;
      const handleMessage = (e: MessageEvent) => {
        if (e.data.requestId === requestId) {
          worker.removeEventListener('message', handleMessage);
          if (e.data.error) reject(new Error(e.data.error));
          else resolve(e.data.tree);
        }
      };

      worker.addEventListener('message', handleMessage);
      worker.postMessage({ branches, defaultBranch, requestId });
    });
  }, []);

  const fetchRepoData = useCallback(async (owner: string, repo: string, options: {
    branchCursor: string | null;
    prCursor: string | null;
    hasMoreBranches: boolean;
    hasMorePrs: boolean;
    signal: AbortSignal;
  }) => {
    try {
      const { data, errors } = await githubService.getBulkData(
        owner, repo, 
        options.branchCursor, options.prCursor, 
        options.hasMoreBranches, options.hasMorePrs,
        options.signal
      );
      if (errors) console.warn('[useGitHubData] GraphQL partial errors:', errors);
      if (!data?.repository) throw new Error(errors?.[0]?.message || 'Repository not found');
      return data.repository;
    } catch (err) {
      if ((err as any).name === 'AbortError') throw err;
      console.error('[useGitHubData] Fatal error during fetch:', err);
      throw err;
    }
  }, []);

  return {
    loading, setLoading,
    syncing, setSyncing,
    error, setError,
    getNewAbortSignal,
    parseTreeAsync,
    fetchRepoData
  };
};
