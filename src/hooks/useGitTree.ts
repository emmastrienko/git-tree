import { useCallback, useState } from 'react';
import { githubService } from '@/services/github';
import { parseFileTree } from '@/utils/tree-parser';
import { GitBranch, ViewMode, VisualizerNode, AnyRecord, GitHubCompareResponse } from '@/types';
import { 
  ENRICH_CHUNK_SIZE, 
  MAX_FETCH_PAGES, 
  TWO_YEARS_MS 
} from '@/constants';

import { useCache } from './useCache';
import { useTreeAnimation } from './useTreeAnimation';
import { useGitHubData } from './useGitHubData';
import { useTreeState } from './useTreeState';

export const useGitTree = () => {
  const [dataVersion, setDataVersion] = useState(0);
  const { setCache, getCache, removeCache } = useCache();
  const { growth, animate, resetGrowth } = useTreeAnimation();
  const { 
    loading, setLoading, 
    syncing, setSyncing, 
    error, setError, 
    getNewAbortSignal,
    parseTreeAsync, 
    fetchRepoData 
  } = useGitHubData();

  const {
    branchData, setBranchData,
    prData, setPrData,
    branchItemsRef, prItemsRef,
    fetchingNodes,
    activeMode, setActiveMode: internalSetActiveMode,
    currentModeRef,
    stateTracker,
    resetState,
    clearModeState
  } = useTreeState();

  const setActiveMode = useCallback((mode: ViewMode) => {
    internalSetActiveMode(mode);
    setDataVersion(v => v + 1);
  }, [internalSetActiveMode]);

  const tree = activeMode === 'branches' ? branchData.tree : prData.tree;
  const items = activeMode === 'branches' ? branchData.items : prData.items;

  const clearCache = useCallback((repoUrl: string, mode: ViewMode) => {
    const cleanPath = repoUrl.toLowerCase().replace(/\/$/, '').trim();
    removeCache(`${cleanPath}/${mode}`);
    if (mode === 'branches') stateTracker.current.hasBranches = false;
    else stateTracker.current.hasPrs = false;
    stateTracker.current.enrichedModes.delete(mode);
  }, [removeCache, stateTracker]);

  const hasDataForMode = useCallback((mode: ViewMode) => {
    return mode === 'branches' ? branchData.items.length > 0 : prData.items.length > 0;
  }, [branchData.items.length, prData.items.length]);

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
        additions = prFiles.reduce((acc: number, f: GitHubCompareResponse['files'][0]) => acc + f.additions, 0) || 0;
        deletions = prFiles.reduce((acc: number, f: GitHubCompareResponse['files'][0]) => acc + f.deletions, 0) || 0;
        filesChanged = prFiles.length || 0;
      } else {
        const comp = await githubService.compare(owner, repo, baseBranch, node.name);
        additions = comp.files?.reduce((acc: number, f: GitHubCompareResponse['files'][0]) => acc + f.additions, 0) || 0;
        deletions = comp.files?.reduce((acc: number, f: GitHubCompareResponse['files'][0]) => acc + f.deletions, 0) || 0;
        filesChanged = comp.files?.length || 0;
        const latestCommit = comp.commits?.length > 0 ? comp.commits[comp.commits.length - 1] : null;
        if (latestCommit) lastUpdated = latestCommit.commit.author.date;
      }

      const details = { additions, deletions, filesChanged, lastUpdated, fileTree: prFiles ? parseFileTree(prFiles) : undefined };

      const updateFn = (prev: {tree: VisualizerNode | null, items: AnyRecord[]}) => {
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
  }, [branchData.tree, prData.tree, setBranchData, setPrData, currentModeRef, fetchingNodes]);

  const fetchTree = useCallback(async (repoUrl: string, mode: ViewMode, forceRefresh = false) => {
    const signal = getNewAbortSignal();
    currentModeRef.current = mode;
    setActiveMode(mode);
    setDataVersion(v => v + 1);
    
    const cleanPath = repoUrl.toLowerCase().replace(/\/$/, '').trim();
    const isNewRepo = stateTracker.current.repo !== cleanPath;
    
    if (isNewRepo) {
      resetState(true);
      stateTracker.current.repo = cleanPath;
    }

    const [owner, repo] = cleanPath.split('/');
    if (!owner || !repo) return;

    const cacheKey = `${cleanPath}/${mode}`;
    if (!forceRefresh) {
      const cached = getCache(cacheKey);
      if (cached && cached.items?.length > 0) {
        if (mode === 'branches') { setBranchData(cached); stateTracker.current.hasBranches = true; }
        else { setPrData(cached); stateTracker.current.hasPrs = true; }
        stateTracker.current.enrichedModes.add(mode);
        resetGrowth(1); setError(null); setLoading(false);
        return;
      }
    }

    const hasItems = mode === 'branches' ? branchData.items.length > 0 : prData.items.length > 0;
    const isFullyFetched = mode === 'branches' ? stateTracker.current.hasBranches : stateTracker.current.hasPrs;
    const isEnriched = stateTracker.current.enrichedModes.has(mode);

    if (!forceRefresh && hasItems && isFullyFetched && isEnriched) {
      return;
    }

    setLoading(true); setError(null); resetGrowth(0);

    const needsBranches = mode === 'branches' && (forceRefresh || branchData.items.length === 0);
    const needsPrs = mode === 'pr' && (forceRefresh || prData.items.length === 0);

    if (needsBranches) clearModeState('branches');
    if (needsPrs) clearModeState('pr');

    try {
      let base = stateTracker.current.base || 'main';
      let baseSha = stateTracker.current.baseSha || '';
      const now = Date.now();

      const enrichData = async (itemsToEnrich: AnyRecord[], currentBase: string, currentBaseSha: string, isPrMode: boolean) => {
        setSyncing(true);
        try {
          if (!currentBaseSha) return;
          
          for (let i = 0; i < itemsToEnrich.length; i += ENRICH_CHUNK_SIZE) {
            if (signal.aborted) return;
            const chunk = itemsToEnrich.slice(i, i + ENRICH_CHUNK_SIZE);
            
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
              const { results } = await githubService.compareBatch(owner, repo, currentBaseSha, headShas, signal);
              if (signal.aborted) return;

              const currentItems = isPrMode ? prItemsRef.current : branchItemsRef.current;
              const newItems = [...currentItems];
              
              results?.forEach((res: AnyRecord) => {
                if (res.success) {
                  const idx = newItems.findIndex(item => (isPrMode ? item.head?.sha : item.sha) === res.head);
                  if (idx !== -1) {
                    newItems[idx] = { 
                      ...newItems[idx], 
                      ahead: res.data.ahead_by, behind: res.data.behind_by, 
                      history: res.data.commits?.map((c: AnyRecord) => c.sha) || [],
                      isMerged: res.data.status === 'identical' || res.data.status === 'behind'
                    };
                  }
                }
              });

              const nodesToParse = isPrMode 
                ? newItems.map(pr => ({ 
                    name: `${pr.headRefName} #${pr.number}`, sha: pr.head?.sha || '', ahead: pr.ahead, behind: pr.behind, 
                    history: pr.history, lastUpdated: pr.lastUpdated, author: pr.author, 
                    isMerged: pr.isMerged,
                    mergeBaseSha: pr.baseRefName === currentBase ? undefined : pr.baseRefName, 
                    metadata: { 
                      prNumber: pr.number, 
                      status: pr.review_status, 
                      displayTitle: pr.title, 
                      isDraft: pr.isDraft, 
                      baseBranch: pr.baseRefName, 
                      headBranch: pr.headRefName,
                      labels: pr.labels?.nodes || []
                    } 
                  }))
                : (newItems as unknown as GitBranch[]);

              const newTree = await parseTreeAsync(nodesToParse, currentBase);
              if (newItems.length > 0 && newTree) setCache(`${cleanPath}/${isPrMode ? 'pr' : 'branches'}`, { items: newItems, tree: newTree });
              
              if (isPrMode) {
                setPrData({ items: newItems, tree: newTree });
              } else {
                setBranchData({ items: newItems, tree: newTree });
              }
              
              stateTracker.current.enrichedModes.add(isPrMode ? 'pr' : 'branches');
            }
          }
        } finally {
          if (!signal.aborted) setSyncing(false);
        }
      };

      const fetchAndProcessPages = async () => {
        let branchCursor: string | null = null;
        let prCursor: string | null = null;
        let pageCount = 0;
        let hasMoreBranches = needsBranches || (!stateTracker.current.hasBranches && mode === 'branches');
        let hasMorePrs = needsPrs || (!stateTracker.current.hasPrs && mode === 'pr');

        while ((hasMoreBranches || hasMorePrs) && pageCount < MAX_FETCH_PAGES) {
          if (signal.aborted) return;
          const repoData = await fetchRepoData(owner, repo, { branchCursor, prCursor, hasMoreBranches, hasMorePrs, signal });
          
          if (pageCount === 0) {
            base = repoData.defaultBranchRef?.name || 'main';
            baseSha = repoData.defaultBranchRef?.target?.oid || '';
            stateTracker.current.base = base;
            stateTracker.current.baseSha = baseSha;
          }

          let newBranches: AnyRecord[] = [];
          let newPRs: AnyRecord[] = [];

          if (hasMoreBranches && repoData.refs) {
            const nodes = repoData.refs.nodes || [];
            newBranches = nodes.map((b: AnyRecord) => ({ 
              name: b.name, sha: b.target?.oid || '', ahead: 0, behind: 0, isBase: b.name === base,
              isMerged: false,
              lastUpdated: b.target?.authoredDate,
              author: b.target?.author?.user ? { login: b.target.author.user.login, avatarUrl: b.target.author.user.avatarUrl } : undefined
            }));
            
            const allItems = [...branchItemsRef.current, ...newBranches];
            const mappedItems: GitBranch[] = allItems.map(b => ({ ...b, history: b.history || [], isMerged: b.isMerged }));
            const newTree = await parseTreeAsync(mappedItems, base);
            setBranchData({ items: allItems, tree: newTree });
            
            branchCursor = repoData.refs.pageInfo?.endCursor || null;
            hasMoreBranches = repoData.refs.pageInfo?.hasNextPage || false;
            if (!hasMoreBranches) stateTracker.current.hasBranches = true;
            setDataVersion(v => v + 1);
          }

          if (hasMorePrs && repoData.pullRequests) {
            const nodes = repoData.pullRequests.nodes || [];
            newPRs = nodes.map((pr: AnyRecord) => ({ 
              ...pr, html_url: pr.url, draft: pr.isDraft, 
              head: { ref: pr.headRefName, sha: pr.headRef?.target?.oid || '' },
              user: { login: pr.author?.login, avatar_url: pr.author?.avatarUrl },
              ahead: 0, behind: 0, isMerged: pr.state === 'MERGED', review_status: pr.reviews?.nodes[0]?.state || 'PENDING', lastUpdated: pr.updatedAt, 
              author: pr.author ? { login: pr.author.login, avatarUrl: pr.author.avatarUrl } : undefined
            }));

            const allPRs = [...prItemsRef.current, ...newPRs];
            const prNodes: GitBranch[] = allPRs.map((pr: AnyRecord) => ({ 
              name: `${pr.headRefName} #${pr.number}`, sha: pr.head?.sha || '', ahead: pr.ahead || 0, behind: pr.behind || 0, 
              history: pr.history || [], lastUpdated: pr.lastUpdated, author: pr.author, 
              isMerged: pr.isMerged,
              mergeBaseSha: pr.baseRefName === base ? undefined : pr.baseRefName, 
              metadata: { 
                prNumber: pr.number, 
                status: pr.review_status, 
                displayTitle: pr.title, 
                isDraft: pr.isDraft, 
                baseBranch: pr.baseRefName, 
                headBranch: pr.headRefName,
                labels: pr.labels?.nodes || []
              } 
            }));
            
            const newTree = await parseTreeAsync(prNodes, base);
            setPrData({ items: allPRs, tree: newTree });

            prCursor = repoData.pullRequests.pageInfo?.endCursor || null;
            hasMorePrs = repoData.pullRequests.pageInfo?.hasNextPage || false;
            if (!hasMorePrs) stateTracker.current.hasPrs = true;
            setDataVersion(v => v + 1);
          }

          animate();
          pageCount++;

          if (mode === 'branches' && newBranches.length > 0) {
            await enrichData(newBranches, base, baseSha, false);
          } else if (mode === 'pr' && newPRs.length > 0) {
            await enrichData(newPRs, base, baseSha, true);
          }

          if (!hasMoreBranches && !hasMorePrs) break;
        }
      };

      await fetchAndProcessPages();

      if (!signal.aborted && !stateTracker.current.enrichedModes.has(mode)) {
        const currentItems = mode === 'branches' ? branchItemsRef.current : prItemsRef.current;
        if (currentItems.length > 0) {
          await enrichData(currentItems, base, baseSha, mode === 'pr');
        }
      }

    } catch (err: any) {
      if (err.name === 'AbortError') return;
      if (err.message?.includes('403')) setError('RATE_LIMIT');
      else if (err.message?.includes('404')) setError('REPO_NOT_FOUND');
      else setError('FETCH_ERROR');
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [animate, getCache, setCache, resetGrowth, setLoading, setError, fetchRepoData, getNewAbortSignal, parseTreeAsync, branchData.items.length, prData.items.length, setBranchData, setPrData, resetState, clearModeState, branchItemsRef, prItemsRef, currentModeRef, setActiveMode, setSyncing, stateTracker, setDataVersion]);

  return { loading, syncing, error, tree, items, growth, fetchTree, fetchNodeDetails, clearCache, setActiveMode, hasDataForMode, dataVersion };
};
