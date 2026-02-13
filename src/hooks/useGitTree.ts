import { useState, useCallback, useRef, useEffect } from 'react';
import { githubService } from '@/services/github';
import { parseBranchTree, parseFileTree } from '@/utils/tree-parser';
import { GitBranch, ViewMode, VisualizerNode, GitPullRequest } from '@/types';

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
  const lastFetchId = useRef<number>(0);
  const currentModeRef = useRef<ViewMode>('branches');

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
    const currentMode = currentModeRef.current;
    if (node.fileTree || node.type === 'trunk' || fetchingNodes.current.has(node.name)) return;
    
    fetchingNodes.current.add(node.name);
    const [owner, repo] = repoUrl.split('/');
    const cleanPath = repoUrl.toLowerCase().replace(/\/$/, '').trim();
    
    try {
      const baseBranch = tree?.name || 'main';
      const prNumber = node.metadata?.prNumber;

      let additions = 0;
      let deletions = 0;
      let filesChanged = 0;
      let lastUpdated = node.lastUpdated;
      let prFiles = null;

      if (currentMode === 'pr' && prNumber) {
        prFiles = await githubService.getPullRequestFiles(owner, repo, prNumber);
        additions = prFiles.reduce((acc: number, f: any) => acc + f.additions, 0) || 0;
        deletions = prFiles.reduce((acc: number, f: any) => acc + f.deletions, 0) || 0;
        filesChanged = prFiles.length || 0;
      } else {
        const comp = await githubService.compare(owner, repo, baseBranch, node.name);
        additions = comp.files?.reduce((acc: number, f: any) => acc + f.additions, 0) || 0;
        deletions = comp.files?.reduce((acc: number, f: any) => acc + f.deletions, 0) || 0;
        filesChanged = comp.files?.length || 0;
        const latestCommit = comp.commits?.length > 0 ? comp.commits[comp.commits.length - 1] : null;
        if (latestCommit) lastUpdated = latestCommit.commit.author.date;
      }

      const details = {
        additions,
        deletions,
        filesChanged,
        lastUpdated,
        fileTree: prFiles ? parseFileTree(prFiles) : undefined
      };

      let finalTree: VisualizerNode | null = null;
      let finalItems: any[] = [];

      setItems(prev => {
        finalItems = prev.map(item => {
          const isMatch = currentMode === 'branches' ? item.name === node.name : item.number === prNumber;
          return isMatch ? { ...item, ...details } : item;
        });
        return [...finalItems];
      });
      
      setTree(prev => {
        if (!prev) return null;
        const updateNodeDeep = (curr: VisualizerNode): VisualizerNode => {
          const isMatch = currentMode === 'branches' 
            ? curr.name === node.name 
            : curr.metadata?.prNumber === prNumber;

          if (isMatch) {
            return { 
              ...curr, 
              ...details, 
              metadata: { ...curr.metadata, ...details.fileTree?.metadata } 
            };
          }
          if (curr.children) return { ...curr, children: curr.children.map(updateNodeDeep) };
          return curr;
        };
        finalTree = updateNodeDeep(prev);
        return { ...finalTree };
      });

      setTimeout(() => {
        if (finalItems.length > 0 && finalTree) {
          setCache(`${cleanPath}/${currentMode}`, { items: finalItems, tree: finalTree });
        }
      }, 100);
    } catch (e) {
      console.error('Failed to fetch node details', e);
    } finally {
      fetchingNodes.current.delete(node.name);
    }
  }, [tree?.name]);

  const fetchTree = useCallback(async (repoUrl: string, mode: ViewMode) => {
    const fetchId = ++lastFetchId.current;
    currentModeRef.current = mode;
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
    setItems([]); 
    setGrowth(0);
    cancelAnimationFrame(frameRef.current);

    try {
      const [repoData, openPRs] = await Promise.all([
        githubService.getRepo(owner, repo),
        githubService.getPullRequests(owner, repo)
      ]);
      if (fetchId !== lastFetchId.current) return;
      
      const base = repoData.default_branch;

      if (mode === 'branches') {
        const branchList = await githubService.getBranches(owner, repo);
        const comparedBranches: GitBranch[] = [];

        for (let i = 0; i < branchList.length; i += 50) {
          if (fetchId !== lastFetchId.current) return;
          const chunk = branchList.slice(i, i + 50);
          const results = await Promise.all(chunk.map(async (b): Promise<GitBranch | null> => {
            if (b.name === base) return { name: b.name, sha: b.commit.sha, ahead: 0, behind: 0, isBase: true } as GitBranch;
            try {
              const comp = await githubService.compare(owner, repo, base, b.name);
              const pr = openPRs.find(p => p.head.ref === b.name);
              const latestCommit = comp.commits?.length > 0 ? comp.commits[comp.commits.length - 1] : null;
              
              return {
                name: b.name, sha: b.commit.sha, mergeBaseSha: comp.merge_base_commit?.sha,
                history: comp.commits?.map((c: any) => c.sha) || [], ahead: comp.ahead_by, behind: comp.behind_by,
                isMerged: comp.status === 'identical' || comp.status === 'behind', hasConflicts: pr?.mergeable_state === 'dirty',
                lastUpdated: latestCommit?.commit.author.date || pr?.updated_at,
                author: latestCommit ? { login: latestCommit.author?.login || latestCommit.commit.author.name, avatarUrl: latestCommit.author?.avatar_url } 
                : (pr ? { login: pr.user.login, avatarUrl: pr.user.avatar_url } : undefined)
              } as GitBranch;
            } catch (e: any) { 
              if (e.message?.includes('403')) throw e;
              return null;
            }
          }));

          if (fetchId !== lastFetchId.current) return;
          const valid = results.filter((res): res is GitBranch => res !== null);
          comparedBranches.push(...valid);
          const currentTree = parseBranchTree([...comparedBranches], base);
          setItems([...comparedBranches]);
          setTree(currentTree);
          setCache(cacheKey, { items: [...comparedBranches], tree: currentTree });
          if (i === 0) animate();
        }
      } else {
        const comparedPRs: any[] = [];
        for (let i = 0; i < openPRs.length; i += 15) {
          if (fetchId !== lastFetchId.current) return;
          const chunk = openPRs.slice(i, i + 15);
          const results = await Promise.all(chunk.map(async (pr): Promise<any | null> => {
            try {
              // Use SHA instead of ref to support cross-repo (fork) PRs
              const [comp, reviews] = await Promise.all([
                githubService.compare(owner, repo, base, pr.head.sha).catch(() => null),
                githubService.getPullRequestReviews(owner, repo, pr.number).catch(() => [])
              ]);
              
              const latestReview = reviews && reviews.length > 0 ? reviews[reviews.length - 1].state : 'PENDING';
              const latestCommit = comp?.commits?.length > 0 ? comp.commits[comp.commits.length - 1] : null;
              
              return {
                ...pr, 
                ahead: comp?.ahead_by || 0, 
                behind: comp?.behind_by || 0, 
                review_status: latestReview,
                lastUpdated: latestCommit?.commit.author.date || pr.updated_at,
                author: latestCommit ? { login: latestCommit.author?.login || latestCommit.commit.author.name, avatarUrl: latestCommit.author?.avatar_url } 
                : { login: pr.user.login, avatarUrl: pr.user.avatar_url }
              };
            } catch (err) { 
              console.warn(`[useGitTree] Failed to fetch details for PR #${pr.number}`, err);
              return {
                ...pr,
                ahead: 0, behind: 0, review_status: 'PENDING',
                lastUpdated: pr.updated_at,
                author: { login: pr.user.login, avatarUrl: pr.user.avatar_url }
              };
            }
          }));

          if (fetchId !== lastFetchId.current) return;
          const valid = results.filter(res => res !== null);
          comparedPRs.push(...valid);
          const prBranches: GitBranch[] = comparedPRs.map(pr => ({
            name: `${pr.head.ref} #${pr.number}`, // Ensure uniqueness
            sha: pr.head.sha, ahead: pr.ahead, behind: pr.behind,
            lastUpdated: pr.lastUpdated, author: pr.author,
            mergeBaseSha: pr.base.ref === base ? undefined : pr.base.ref, 
            metadata: { prNumber: pr.number, status: pr.review_status, displayTitle: pr.title || 'Untitled PR', isDraft: pr.draft, baseBranch: pr.base.ref }
          } as any));
          const currentTree = parseBranchTree(prBranches, base);
          setItems([...comparedPRs]);
          setTree(currentTree);
          setCache(cacheKey, { items: [...comparedPRs], tree: currentTree });
          if (i === 0) animate();
        }
      }
    } catch (err: any) {
      if (fetchId !== lastFetchId.current) return;
      if (err.message?.includes('403')) setError('RATE_LIMIT');
      else setError('FETCH_ERROR');
    } finally {
      if (fetchId === lastFetchId.current) setLoading(false);
    }
  }, [animate]);

  return { loading, error, tree, items, growth, fetchTree, fetchNodeDetails, clearCache };
};