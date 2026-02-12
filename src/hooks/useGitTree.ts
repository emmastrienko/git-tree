import { useState, useCallback, useRef, useEffect } from 'react';
import { githubService } from '@/services/github';
import { parseBranchTree } from '@/utils/tree-parser';
import { GitBranch, ViewMode, VisualizerNode } from '@/types';

const CACHE_PREFIX = 'git_viz_';

const getCache = (key: string) => {
  if (typeof window === 'undefined') return null;
  const data = sessionStorage.getItem(CACHE_PREFIX + key);
  return data ? JSON.parse(data) : null;
};

const setCache = (key: string, value: any) => {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
};

export const useGitTree = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tree, setTree] = useState<VisualizerNode | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [growth, setGrowth] = useState(0);
  const frameRef = useRef<number>(0);
  const fetchingNodes = useRef<Set<string>>(new Set());

  const animate = useCallback(() => {
    setGrowth(prev => {
      if (prev >= 1) return 1;
      frameRef.current = requestAnimationFrame(animate);
      return prev + 0.02;
    });
  }, []);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  const clearCache = useCallback((repoUrl: string, mode: ViewMode) => {
    const cleanPath = repoUrl.toLowerCase().replace(/\/$/, '').trim();
    sessionStorage.removeItem(CACHE_PREFIX + `${cleanPath}/${mode}`);
  }, []);

  const fetchNodeDetails = useCallback(async (repoUrl: string, node: VisualizerNode) => {
    if (node.additions !== undefined || node.type === 'trunk' || fetchingNodes.current.has(node.name)) return;
    
    fetchingNodes.current.add(node.name);
    const [owner, repo] = repoUrl.split('/');
    const cleanPath = repoUrl.toLowerCase().replace(/\/$/, '').trim();
    
    try {
      const baseBranch = tree?.name || 'main';
      const comp = await githubService.compare(owner, repo, baseBranch, node.name);
      const latestCommit = comp.commits?.length > 0 ? comp.commits[comp.commits.length - 1] : null;
      
      const details = {
        additions: comp.files?.reduce((acc: number, f: any) => acc + f.additions, 0) || 0,
        deletions: comp.files?.reduce((acc: number, f: any) => acc + f.deletions, 0) || 0,
        filesChanged: comp.files?.length || 0,
        lastUpdated: latestCommit?.commit.author.date,
        author: latestCommit ? {
          login: latestCommit.author?.login || latestCommit.commit.author.name,
          avatarUrl: latestCommit.author?.avatar_url
        } : undefined
      };

      let newItems: any[] = [];
      let newTree: VisualizerNode | null = null;

      // Update local items list
      setItems(prev => {
        newItems = prev.map(item => item.name === node.name ? { ...item, ...details } : item);
        return newItems;
      });
      
      // Update tree deeply
      setTree(prev => {
        if (!prev) return null;
        const updateNodeDeep = (curr: VisualizerNode): VisualizerNode => {
          if (curr.name === node.name) return { ...curr, ...details };
          if (curr.children && curr.children.length > 0) return { ...curr, children: curr.children.map(updateNodeDeep) };
          return curr;
        };
        newTree = updateNodeDeep(prev);
        return newTree;
      });

      // Update Session Cache with the new enriched data
      // We wait a tick to ensure newItems/newTree are populated from the state updates above
      setTimeout(() => {
        if (newItems.length > 0 && newTree) {
          const mode = sessionStorage.getItem('last_view_mode') || 'branches';
          setCache(`${cleanPath}/${mode}`, { items: newItems, tree: newTree });
        }
      }, 0);

    } catch (e) {
      console.error('Failed to fetch node details', e);
    } finally {
      fetchingNodes.current.delete(node.name);
    }
  }, [tree?.name]);

  const fetchTree = useCallback(async (repoUrl: string, mode: ViewMode) => {
    const cleanPath = repoUrl.toLowerCase().replace(/\/$/, '').trim();
    const [owner, repo] = cleanPath.split('/');
    if (!owner || !repo) return;

    const cacheKey = `${cleanPath}/${mode}`;
    const cached = getCache(cacheKey);
    if (cached) {
      setItems(cached.items);
      setTree(cached.tree);
      setGrowth(1);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setTree(null);
    setGrowth(0);
    cancelAnimationFrame(frameRef.current);

    try {
      const [repoData, openPRs] = await Promise.all([
        githubService.getRepo(owner, repo),
        githubService.getPullRequests(owner, repo)
      ]);
      const base = repoData.default_branch;

      if (mode === 'branches') {
        const branchList = await githubService.getBranches(owner, repo);
        const comparedBranches: GitBranch[] = [];

        // Chunk size increased to 50 for fewer, larger updates
        for (let i = 0; i < branchList.length; i += 50) {
          const chunk = branchList.slice(i, i + 50);
          const results = await Promise.all(chunk.map(async (b): Promise<GitBranch | null> => {
            if (b.name === base) return { name: b.name, sha: b.commit.sha, ahead: 0, behind: 0, isBase: true } as GitBranch;
            
            try {
              const comp = await githubService.compare(owner, repo, base, b.name);
              const pr = openPRs.find(p => p.head.ref === b.name);
              const latestCommit = comp.commits?.length > 0 ? comp.commits[comp.commits.length - 1] : null;
              
              return {
                name: b.name,
                sha: b.commit.sha,
                mergeBaseSha: comp.merge_base_commit?.sha,
                history: comp.commits?.map((c: any) => c.sha) || [],
                ahead: comp.ahead_by,
                behind: comp.behind_by,
                isMerged: comp.status === 'identical' || comp.status === 'behind',
                hasConflicts: pr?.mergeable_state === 'dirty',
                lastUpdated: latestCommit?.commit.author.date,
                author: latestCommit ? {
                  login: latestCommit.author?.login || latestCommit.commit.author.name,
                  avatarUrl: latestCommit.author?.avatar_url
                } : undefined
              } as GitBranch;
            } catch (e: any) { 
              if (e.message?.includes('403')) throw e;
              return null; 
            }
          }));

          const valid = results.filter((res): res is GitBranch => res !== null);
          comparedBranches.push(...valid);
          const currentTree = parseBranchTree([...comparedBranches], base);
          
          setItems([...comparedBranches]);
          setTree(currentTree);
          
          // Save partial data to cache for resilience
          setCache(cacheKey, { items: [...comparedBranches], tree: currentTree });

          if (i === 0) animate();
        }
      } else {
        setItems(openPRs);
        setCache(cacheKey, { items: openPRs, tree: null });
      }
    } catch (err: any) {
      if (err.message?.includes('403')) setError('RATE_LIMIT');
      else setError('FETCH_ERROR');
    } finally {
      setLoading(false);
    }
  }, [animate]);

  return { loading, error, tree, items, growth, fetchTree, fetchNodeDetails, clearCache };
};