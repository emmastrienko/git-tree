import { useState, useCallback, useRef, useEffect } from 'react';
import { githubService } from '@/services/github';
import { parseBranchTree, parseFileTree } from '@/utils/tree-parser';
import { GitBranch, ViewMode, VisualizerNode, GitPullRequest } from '@/types';

const CACHE_PREFIX = 'git_viz_';

const pruneCache = () => {
  try {
    const keys = Object.keys(sessionStorage).filter(k => k.startsWith(CACHE_PREFIX));
    keys.slice(0, Math.ceil(keys.length / 2)).forEach(k => sessionStorage.removeItem(k));
  } catch (e) {
    sessionStorage.clear();
  }
};

const setCache = (key: string, value: any) => {
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
};

const getCache = (key: string) => {
  if (typeof window === 'undefined') return null;
  try {
    const data = sessionStorage.getItem(CACHE_PREFIX + key);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
};

export const useGitTree = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [growth, setGrowth] = useState(0);
  
  const [branchData, setBranchData] = useState<{tree: VisualizerNode | null, items: any[]}>({tree: null, items: []});
  const [prData, setPrData] = useState<{tree: VisualizerNode | null, items: any[]}>({tree: null, items: []});
  
  const frameRef = useRef<number>(0);
  const fetchingNodes = useRef<Set<string>>(new Set());
  const lastFetchId = useRef<number>(0);
  const currentModeRef = useRef<ViewMode>('branches');
  const [activeMode, setActiveMode] = useState<ViewMode>('branches');
  
  // High-fidelity tracking of what's in state
  const stateTracker = useRef<{
    repo: string | null,
    hasBranches: boolean,
    hasPrs: boolean
  }>({ repo: null, hasBranches: false, hasPrs: false });

  const tree = activeMode === 'branches' ? branchData.tree : prData.tree;
  const items = activeMode === 'branches' ? branchData.items : prData.items;

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
    if (mode === 'branches') stateTracker.current.hasBranches = false;
    else stateTracker.current.hasPrs = false;
  }, []);

  const fetchNodeDetails = useCallback(async (repoUrl: string, node: VisualizerNode) => {
    const mode = currentModeRef.current;
    if (node.fileTree || node.type === 'trunk' || fetchingNodes.current.has(node.name)) return;
    
    fetchingNodes.current.add(node.name);
    const [owner, repo] = repoUrl.split('/');
    const cleanPath = repoUrl.toLowerCase().replace(/\/$/, '').trim();
    
    try {
      const activeTree = mode === 'branches' ? branchData.tree : prData.tree;
      const baseBranch = activeTree?.name || 'main';
      const prNumber = node.metadata?.prNumber;

      let additions = 0, deletions = 0, filesChanged = 0;
      let lastUpdated = node.lastUpdated;
      let prFiles = null;

      if (mode === 'pr' && prNumber) {
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

      const details = { additions, deletions, filesChanged, lastUpdated, fileTree: prFiles ? parseFileTree(prFiles) : undefined };

      const updateFn = (prev: {tree: VisualizerNode | null, items: any[]}) => {
        const newItems = prev.items.map(item => {
          const isMatch = mode === 'branches' ? item.name === node.name : item.number === prNumber;
          return isMatch ? { ...item, ...details } : item;
        });
        const updateNodeDeep = (curr: VisualizerNode): VisualizerNode => {
          const isMatch = mode === 'branches' ? curr.name === node.name : curr.metadata?.prNumber === prNumber;
          if (isMatch) return { ...curr, ...details, metadata: { ...curr.metadata, ...details.fileTree?.metadata } };
          if (curr.children) return { ...curr, children: curr.children.map(updateNodeDeep) };
          return curr;
        };
        const newTree = prev.tree ? updateNodeDeep(prev.tree) : null;
        if (newItems.length > 0 && newTree) setCache(`${cleanPath}/${mode}`, { items: newItems, tree: newTree });
        return { items: newItems, tree: newTree };
      };

      if (mode === 'branches') setBranchData(updateFn);
      else setPrData(updateFn);
    } catch (e) {
      console.error('Failed to fetch node details', e);
    } finally {
      fetchingNodes.current.delete(node.name);
    }
  }, [branchData.tree, prData.tree]);

  const fetchTree = useCallback(async (repoUrl: string, mode: ViewMode, forceRefresh = false) => {
    const fetchId = ++lastFetchId.current;
    currentModeRef.current = mode;
    setActiveMode(mode);
    
    const cleanPath = repoUrl.toLowerCase().replace(/\/$/, '').trim();
    const isNewRepo = stateTracker.current.repo !== cleanPath;
    
    if (isNewRepo) {
      stateTracker.current.repo = cleanPath;
      stateTracker.current.hasBranches = false;
      stateTracker.current.hasPrs = false;
    }

    // Immediate return if already in state
    if (!forceRefresh) {
      if (mode === 'branches' && stateTracker.current.hasBranches) return;
      if (mode === 'pr' && stateTracker.current.hasPrs) return;
    }

    const [owner, repo] = cleanPath.split('/');
    if (!owner || !repo) return;

    const cacheKey = `${cleanPath}/${mode}`;
    if (!forceRefresh) {
      const cached = getCache(cacheKey);
      if (cached) {
        if (mode === 'branches') { setBranchData(cached); stateTracker.current.hasBranches = true; }
        else { setPrData(cached); stateTracker.current.hasPrs = true; }
        setGrowth(1); setError(null); setLoading(false);
        return;
      }
    }

    setLoading(true); setError(null); setGrowth(0);
    cancelAnimationFrame(frameRef.current);

    if (mode === 'branches') { setBranchData({ tree: null, items: [] }); stateTracker.current.hasBranches = false; }
    else { setPrData({ tree: null, items: [] }); stateTracker.current.hasPrs = false; }

    try {
      const [repoData, openPRs] = await Promise.all([
        githubService.getRepo(owner, repo),
        githubService.getPullRequests(owner, repo)
      ]);
      if (fetchId !== lastFetchId.current) return;
      const base = repoData.default_branch;

      if (mode === 'branches') {
        const branchList = await githubService.getBranches(owner, repo);
        const initial = branchList.map(b => ({ name: b.name, sha: b.commit.sha, ahead: 0, behind: 0, isBase: b.name === base }));
        setBranchData({ items: initial, tree: parseBranchTree(initial, base) });
        stateTracker.current.hasBranches = true;
        animate();

        let enriched = [...initial];
        for (let i = 0; i < branchList.length; i += 50) {
          if (fetchId !== lastFetchId.current) return;
          const chunk = branchList.slice(i, i + 50);
          const results = await Promise.all(chunk.map(async (b): Promise<GitBranch | null> => {
            if (b.name === base) return { name: b.name, sha: b.commit.sha, ahead: 0, behind: 0, isBase: true } as GitBranch;
            try {
              const comp = await githubService.compare(owner, repo, base, b.name);
              const pr = openPRs.find(p => p.head.ref === b.name);
              const latest = comp.commits?.length > 0 ? comp.commits[comp.commits.length - 1] : null;
              return {
                name: b.name, sha: b.commit.sha, mergeBaseSha: comp.merge_base_commit?.sha,
                history: comp.commits?.map((c: any) => c.sha) || [], ahead: comp.ahead_by, behind: comp.behind_by,
                isMerged: comp.status === 'identical' || comp.status === 'behind', hasConflicts: pr?.mergeable_state === 'dirty',
                lastUpdated: latest?.commit.author.date || pr?.updated_at,
                author: latest ? { login: latest.author?.login || latest.commit.author.name, avatarUrl: latest.author?.avatar_url } : (pr ? { login: pr.user.login, avatarUrl: pr.user.avatar_url } : undefined)
              } as GitBranch;
            } catch (e: any) { if (e.message?.includes('403')) throw e; return null; }
          }));

          if (fetchId !== lastFetchId.current) return;
          results.forEach(res => { if (res) { const idx = enriched.findIndex(b => b.name === res.name); if (idx !== -1) enriched[idx] = { ...enriched[idx], ...res }; } });
          const currentTree = parseBranchTree([...enriched], base);
          setBranchData({ items: [...enriched], tree: currentTree });
          setCache(cacheKey, { items: [...enriched], tree: currentTree });
        }
      } else {
        const initialPRs = openPRs.map(pr => ({ ...pr, ahead: 0, behind: 0, review_status: 'PENDING', lastUpdated: pr.updated_at, author: { login: pr.user.login, avatarUrl: pr.user.avatar_url } }));
        const initialNodes: GitBranch[] = initialPRs.map(pr => ({ name: `${pr.head.ref} #${pr.number}`, sha: pr.head.sha, ahead: 0, behind: 0, lastUpdated: pr.lastUpdated, author: pr.author, mergeBaseSha: pr.base.ref === base ? undefined : pr.base.ref, metadata: { prNumber: pr.number, status: pr.review_status, displayTitle: pr.title, isDraft: pr.draft, baseBranch: pr.base.ref } } as any));
        setPrData({ items: initialPRs, tree: parseBranchTree(initialNodes, base) });
        stateTracker.current.hasPrs = true;
        animate();

        let enriched = [...initialPRs];
        for (let i = 0; i < openPRs.length; i += 15) {
          if (fetchId !== lastFetchId.current) return;
          const chunk = openPRs.slice(i, i + 15);
          const results = await Promise.all(chunk.map(async (pr): Promise<any | null> => {
            try {
              const [comp, reviews] = await Promise.all([ githubService.compare(owner, repo, base, pr.head.sha).catch(() => null), githubService.getPullRequestReviews(owner, repo, pr.number).catch(() => []) ]);
              const latestReview = reviews && reviews.length > 0 ? reviews[reviews.length - 1].state : 'PENDING';
              const latestCommit = comp?.commits?.length > 0 ? comp.commits[comp.commits.length - 1] : null;
              return { id: pr.id, ahead: comp?.ahead_by || 0, behind: comp?.behind_by || 0, review_status: latestReview, lastUpdated: latestCommit?.commit.author.date || pr.updated_at, author: latestCommit ? { login: latestCommit.author?.login || latestCommit.commit.author.name, avatarUrl: latestCommit.author?.avatar_url } : { login: pr.user.login, avatarUrl: pr.user.avatar_url } };
            } catch { return null; }
          }));

          if (fetchId !== lastFetchId.current) return;
          results.forEach(res => { if (res) { const idx = enriched.findIndex(p => p.id === res.id); if (idx !== -1) enriched[idx] = { ...enriched[idx], ...res }; } });
          const prNodes: GitBranch[] = enriched.map(pr => ({ name: `${pr.head.ref} #${pr.number}`, sha: pr.head.sha, ahead: pr.ahead, behind: pr.behind, lastUpdated: pr.lastUpdated, author: pr.author, mergeBaseSha: pr.base.ref === base ? undefined : pr.base.ref, metadata: { prNumber: pr.number, status: pr.review_status, displayTitle: pr.title, isDraft: pr.draft, baseBranch: pr.base.ref } } as any));
          const currentTree = parseBranchTree(prNodes, base);
          setPrData({ items: [...enriched], tree: currentTree });
          setCache(cacheKey, { items: [...enriched], tree: currentTree });
        }
      }
    } catch (err: any) {
      if (fetchId !== lastFetchId.current) return;
      setError(err.message?.includes('403') ? 'RATE_LIMIT' : 'FETCH_ERROR');
    } finally {
      if (fetchId === lastFetchId.current) setLoading(false);
    }
  }, [animate]);

  return { loading, error, tree, items, growth, fetchTree, fetchNodeDetails, clearCache };
};