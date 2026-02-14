import { useState, useCallback, useRef, useEffect } from 'react';
import { githubService } from '@/services/github';
import { parseBranchTree, parseFileTree } from '@/utils/tree-parser';
import { GitBranch, ViewMode, VisualizerNode } from '@/types';

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
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [growth, setGrowth] = useState(0);
  
  const [branchData, setBranchData] = useState<{tree: VisualizerNode | null, items: any[]}>({tree: null, items: []});
  const [prData, setPrData] = useState<{tree: VisualizerNode | null, items: any[]}>({tree: null, items: []});
  
  const frameRef = useRef<number>(0);
  const fetchingNodes = useRef<Set<string>>(new Set());
  const lastFetchId = useRef<number>(0);
  const currentModeRef = useRef<ViewMode>('branches');
  const [activeMode, setActiveMode] = useState<ViewMode>('branches');
  
  const stateTracker = useRef<{
    repo: string | null,
    hasBranches: boolean,
    hasPrs: boolean,
    enrichedModes: Set<ViewMode>
  }>({ repo: null, hasBranches: false, hasPrs: false, enrichedModes: new Set() });

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
    stateTracker.current.enrichedModes.delete(mode);
  }, []);

  const fetchNodeDetails = useCallback(async (repoUrl: string, node: VisualizerNode) => {
    const mode = currentModeRef.current;
    if (node.fileTree || node.type === 'trunk' || fetchingNodes.current.has(node.name)) return;
    
    fetchingNodes.current.add(node.name);
    const [owner, repo] = repoUrl.split('/');
    
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
      stateTracker.current.enrichedModes.clear();
    }

    const [owner, repo] = cleanPath.split('/');
    if (!owner || !repo) return;

    const cacheKey = `${cleanPath}/${mode}`;
    if (!forceRefresh) {
      const cached = getCache(cacheKey);
      if (cached) {
        if (mode === 'branches') { setBranchData(cached); stateTracker.current.hasBranches = true; }
        else { setPrData(cached); stateTracker.current.hasPrs = true; }
        stateTracker.current.enrichedModes.add(mode);
        setGrowth(1); setError(null); setLoading(false);
        return;
      }
    }

    if (!forceRefresh && stateTracker.current.enrichedModes.has(mode)) {
      if (mode === 'branches' && stateTracker.current.hasBranches) return;
      if (mode === 'pr' && stateTracker.current.hasPrs) return;
    }

    setLoading(true); setError(null); setGrowth(0);
    cancelAnimationFrame(frameRef.current);

    if (!stateTracker.current.hasBranches && mode === 'branches') setBranchData({ tree: null, items: [] });
    if (!stateTracker.current.hasPrs && mode === 'pr') setPrData({ tree: null, items: [] });

    try {
      let base = 'main';
      let baseSha = '';
      let branchCursor: string | null = null;
      let prCursor: string | null = null;
      let hasMoreBranches = !stateTracker.current.hasBranches;
      let hasMorePrs = !stateTracker.current.hasPrs;
      let pageCount = 0;

      const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      const enrichItems = async (itemsToEnrich: any[], currentBase: string, currentBaseSha: string, isPrMode: boolean) => {
        setSyncing(true);
        try {
          for (let i = 0; i < itemsToEnrich.length; i += 20) {
            if (fetchId !== lastFetchId.current) return;
            const chunk = itemsToEnrich.slice(i, i + 20);
            
            let headShas: string[] = [];
            if (!isPrMode) {
              headShas = chunk
                .filter(item => {
                  if (item.name === currentBase || !item.sha) return false;
                  const lastUpdate = item.lastUpdated ? new Date(item.lastUpdated).getTime() : 0;
                  return !lastUpdate || (now - lastUpdate <= TWO_YEARS_MS);
                })
                .map(item => item.sha);
            } else {
              headShas = chunk.filter(p => p.head?.sha).map(p => p.head.sha);
            }

            if (headShas.length > 0) {
              const { results } = await githubService.compareBatch(owner, repo, currentBaseSha, headShas);
              if (fetchId !== lastFetchId.current) return;

              const updateFn = (prev: {tree: VisualizerNode | null, items: any[]}) => {
                const newItems = [...prev.items];
                results?.forEach((res: any) => {
                  if (res.success) {
                    const idx = newItems.findIndex(item => (isPrMode ? item.head?.sha : item.sha) === res.head);
                    if (idx !== -1) {
                      newItems[idx] = { 
                        ...newItems[idx], 
                        ahead: res.data.ahead_by, behind: res.data.behind_by, 
                        history: res.data.commits?.map((c: any) => c.sha) || [],
                        isMerged: res.data.status === 'identical' || res.data.status === 'behind'
                      };
                    }
                  }
                });

                const nodesToParse = isPrMode 
                  ? newItems.map(pr => ({ 
                      name: `${pr.headRefName} #${pr.number}`, sha: pr.head?.sha || '', ahead: pr.ahead, behind: pr.behind, 
                      history: pr.history, lastUpdated: pr.lastUpdated, author: pr.author, 
                      mergeBaseSha: pr.baseRefName === currentBase ? undefined : pr.baseRefName, 
                      metadata: { prNumber: pr.number, status: pr.review_status, displayTitle: pr.title, isDraft: pr.isDraft, baseBranch: pr.baseRefName } 
                    } as any))
                  : newItems;

                const newTree = parseBranchTree(nodesToParse, currentBase);
                if (newItems.length > 0 && newTree) setCache(`${cleanPath}/${isPrMode ? 'pr' : 'branches'}`, { items: newItems, tree: newTree });
                return { items: newItems, tree: newTree };
              };

              if (!isPrMode) setBranchData(updateFn);
              else setPrData(updateFn);
              
              stateTracker.current.enrichedModes.add(isPrMode ? 'pr' : 'branches');
            }
          }
        } finally {
          if (fetchId === lastFetchId.current) setSyncing(false);
        }
      };

      while ((hasMoreBranches || hasMorePrs) && pageCount < 10) {
        const { data, errors } = await githubService.getBulkData(owner, repo, branchCursor, prCursor);
        if (errors) console.warn('[useGitTree] GraphQL partial errors:', errors);
        if (!data?.repository) throw new Error(errors?.[0]?.message || 'Repository not found');

        const repoData = data.repository;
        if (pageCount === 0) {
          base = repoData.defaultBranchRef?.name || 'main';
          baseSha = repoData.defaultBranchRef?.target?.oid || '';
        }

        let newBranches: any[] = [];
        let newPRs: any[] = [];

        if (hasMoreBranches) {
          const nodes = repoData.refs?.nodes || [];
          newBranches = nodes.map((b: any) => ({ 
            name: b.name, sha: b.target?.oid || '', ahead: 0, behind: 0, isBase: b.name === base,
            lastUpdated: b.target?.authoredDate,
            author: b.target?.author?.user ? { login: b.target.author.user.login, avatarUrl: b.target.author.user.avatarUrl } : undefined
          }));
          
          setBranchData(prev => {
            const allItems = [...prev.items, ...newBranches];
            const mappedItems: GitBranch[] = allItems.map(b => ({ ...b, history: b.history || [] }));
            return { items: allItems, tree: parseBranchTree(mappedItems, base) };
          });
          
          branchCursor = repoData.refs?.pageInfo?.endCursor || null;
          hasMoreBranches = repoData.refs?.pageInfo?.hasNextPage || false;
          stateTracker.current.hasBranches = true;
        }

        if (hasMorePrs) {
          const nodes = repoData.pullRequests?.nodes || [];
          newPRs = nodes.map((pr: any) => ({ 
            ...pr, html_url: pr.url, draft: pr.isDraft, 
            head: { ref: pr.headRefName, sha: pr.headRef?.target?.oid || '' },
            user: { login: pr.author?.login, avatar_url: pr.author?.avatarUrl },
            ahead: 0, behind: 0, review_status: pr.reviews?.nodes[0]?.state || 'PENDING', lastUpdated: pr.updatedAt, 
            author: pr.author ? { login: pr.author.login, avatarUrl: pr.author.avatarUrl } : undefined
          }));

          setPrData(prev => {
            const allPRs = [...prev.items, ...newPRs];
            const prNodes: GitBranch[] = allPRs.map((pr: any) => ({ 
              name: `${pr.headRefName} #${pr.number}`, sha: pr.head?.sha || '', ahead: pr.ahead || 0, behind: pr.behind || 0, 
              history: pr.history || [], lastUpdated: pr.lastUpdated, author: pr.author, 
              mergeBaseSha: pr.baseRefName === base ? undefined : pr.baseRefName, 
              metadata: { prNumber: pr.number, status: pr.review_status, displayTitle: pr.title, isDraft: pr.draft, baseBranch: pr.baseRefName } 
            } as any));
            return { items: allPRs, tree: parseBranchTree(prNodes, base) };
          });

          prCursor = repoData.pullRequests?.pageInfo?.endCursor || null;
          hasMorePrs = repoData.pullRequests?.pageInfo?.hasNextPage || false;
          stateTracker.current.hasPrs = true;
        }
        
        animate();
        pageCount++;

        if (mode === 'branches' && newBranches.length > 0) {
          enrichItems(newBranches, base, baseSha, false);
        } else if (mode === 'pr' && newPRs.length > 0) {
          enrichItems(newPRs, base, baseSha, true);
        }
      }

      if (fetchId === lastFetchId.current && !stateTracker.current.enrichedModes.has(mode)) {
        if (mode === 'branches' && branchData.items.length > 0) {
          enrichItems(branchData.items, base, baseSha, false);
        } else if (mode === 'pr' && prData.items.length > 0) {
          enrichItems(prData.items, base, baseSha, true);
        }
      }

    } catch (err: any) {
      console.error('[useGitTree] Fatal error during fetchTree:', err);
      if (fetchId !== lastFetchId.current) return;
      if (err.message?.includes('403')) setError('RATE_LIMIT');
      else if (err.message?.includes('404')) setError('REPO_NOT_FOUND');
      else setError('FETCH_ERROR');
    } finally {
      if (fetchId === lastFetchId.current) setLoading(false);
    }
  }, [animate, branchData.items, prData.items]);

  return { loading, syncing, error, tree, items, growth, fetchTree, fetchNodeDetails, clearCache };
};