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
    // Only fetch if we don't have fileTree data and it's not the trunk
    if (node.fileTree || node.type === 'trunk' || fetchingNodes.current.has(node.name)) return;
    
    fetchingNodes.current.add(node.name);
    const [owner, repo] = repoUrl.split('/');
    const cleanPath = repoUrl.toLowerCase().replace(/\/$/, '').trim();
    
    try {
      const baseBranch = tree?.name || 'main';
      const prNumber = node.metadata?.prNumber;

      const [comp, prFiles] = await Promise.all([
        githubService.compare(owner, repo, baseBranch, node.name),
        prNumber ? githubService.getPullRequestFiles(owner, repo, prNumber) : Promise.resolve(null)
      ]);

      const latestCommit = comp.commits?.length > 0 ? comp.commits[comp.commits.length - 1] : null;
      
      const details = {
        additions: comp.files?.reduce((acc: number, f: any) => acc + f.additions, 0) || 0,
        deletions: comp.files?.reduce((acc: number, f: any) => acc + f.deletions, 0) || 0,
        filesChanged: comp.files?.length || 0,
        lastUpdated: latestCommit?.commit.author.date,
        author: latestCommit ? {
          login: latestCommit.author?.login || latestCommit.commit.author.name,
          avatarUrl: latestCommit.author?.avatar_url
        } : undefined,
        fileTree: prFiles ? parseFileTree(prFiles) : undefined
      };

      let newItems: any[] = [];
      let newTree: VisualizerNode | null = null;

      // Update local items list
      setItems(prev => {
        newItems = prev.map(item => {
          const itemKey = item.name || item.head?.ref;
          return itemKey === node.name ? { ...item, ...details } : item;
        });
        return newItems;
      });
      
      // Update tree deeply
      setTree(prev => {
        if (!prev) return null;
        const updateNodeDeep = (curr: VisualizerNode): VisualizerNode => {
          if (curr.name === node.name) {
            return { 
              ...curr, 
              ...details,
              metadata: { ...curr.metadata, ...details.fileTree?.metadata }
            };
          }
          if (curr.children) {
            return { ...curr, children: curr.children.map(updateNodeDeep) };
          }
          return curr;
        };
        newTree = updateNodeDeep(prev);
        return { ...newTree };
      });

      // Update Session Cache
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
          setCache(cacheKey, { items: [...comparedBranches], tree: currentTree });
          if (i === 0) animate();
        }
      } else {
        // PULL REQUESTS MODE
        const comparedPRs: any[] = [];

        for (let i = 0; i < openPRs.length; i += 15) {
          const chunk = openPRs.slice(i, i + 15);
          const results = await Promise.all(chunk.map(async (pr): Promise<any | null> => {
            try {
              const [comp, reviews] = await Promise.all([
                githubService.compare(owner, repo, base, pr.head.ref),
                githubService.getPullRequestReviews(owner, repo, pr.number)
              ]);

              const latestReview = reviews.length > 0 ? reviews[reviews.length - 1].state : 'PENDING';
              const latestCommit = comp.commits?.length > 0 ? comp.commits[comp.commits.length - 1] : null;

              return {
                ...pr,
                ahead: comp.ahead_by,
                behind: comp.behind_by,
                review_status: latestReview,
                lastUpdated: latestCommit?.commit.author.date,
                author: latestCommit ? {
                  login: latestCommit.author?.login || latestCommit.commit.author.name,
                  avatarUrl: latestCommit.author?.avatar_url
                } : {
                  login: pr.user.login,
                  avatarUrl: pr.user.avatar_url
                }
              };
            } catch { return null; }
          }));

          const valid = results.filter(res => res !== null);
          comparedPRs.push(...valid);

          const prBranches: GitBranch[] = comparedPRs.map(pr => ({
            name: pr.head.ref, 
            sha: pr.head.sha,
            ahead: pr.ahead,
            behind: pr.behind,
            lastUpdated: pr.lastUpdated,
            author: pr.author,
            mergeBaseSha: pr.base.ref === base ? undefined : pr.base.ref, 
            metadata: { 
              prNumber: pr.number, 
              status: pr.review_status,
              displayTitle: pr.title || 'Untitled PR',
              isDraft: pr.draft,
              baseBranch: pr.base.ref
            }
          } as any));

          const currentTree = parseBranchTree(prBranches, base);
          setItems([...comparedPRs]);
          setTree(currentTree);
          setCache(cacheKey, { items: [...comparedPRs], tree: currentTree });
          if (i === 0) animate();
        }
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