import { useState, useCallback, useRef, useEffect } from 'react';
import { githubService } from '@/services/github';
import { parseBranchTree } from '@/utils/tree-parser';
import { GitBranch, ViewMode, VisualizerNode } from '@/types';

const cache = new Map<string, { items: any[], tree: VisualizerNode | null }>();

export const useGitTree = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tree, setTree] = useState<VisualizerNode | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [growth, setGrowth] = useState(0);
  const frameRef = useRef<number>(0);

  const animate = useCallback(() => {
    setGrowth(prev => {
      if (prev >= 1) return 1;
      frameRef.current = requestAnimationFrame(animate);
      return prev + 0.02;
    });
  }, []);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  const fetchTree = useCallback(async (repoUrl: string, mode: ViewMode) => {
    const cleanPath = repoUrl.toLowerCase().replace(/\/$/, '').trim();
    const [owner, repo] = cleanPath.split('/');
    if (!owner || !repo) return;

    const cacheKey = `${cleanPath}/${mode}`;
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)!;
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

        for (let i = 0; i < branchList.length; i += 15) {
          const chunk = branchList.slice(i, i + 15);
          const results = await Promise.all(chunk.map(async (b): Promise<GitBranch | null> => {
            if (b.name === base) return { 
              name: b.name, 
              sha: b.commit.sha, 
              ahead: 0, 
              behind: 0, 
              isBase: true,
              children: []
            } as GitBranch;
            
            try {
              const comp = await githubService.compare(owner, repo, base, b.name);
              const pr = openPRs.find(p => p.head.ref === b.name);
              
              // Extract change magnitude and files
              const additions = comp.files?.reduce((acc: number, f: any) => acc + f.additions, 0) || 0;
              const deletions = comp.files?.reduce((acc: number, f: any) => acc + f.deletions, 0) || 0;
              const filesChanged = comp.files?.length || 0;
              const lastUpdated = comp.commits?.length > 0 
                ? comp.commits[comp.commits.length - 1].commit.author.date 
                : undefined;

              return {
                name: b.name,
                sha: b.commit.sha,
                mergeBaseSha: comp.merge_base_commit?.sha,
                history: comp.commits?.map((c: any) => c.sha) || [],
                ahead: comp.ahead_by,
                behind: comp.behind_by,
                isMerged: comp.status === 'identical' || comp.status === 'behind',
                hasConflicts: pr?.mergeable_state === 'dirty',
                additions,
                deletions,
                filesChanged,
                lastUpdated
              } as GitBranch;
            } catch (e: any) { 
              if (e.message?.includes('403')) throw e; // Bubble up rate limit
              return null; 
            }
          }));

          const valid = results.filter((res): res is GitBranch => res !== null);
          comparedBranches.push(...valid);
          
          // Re-parse tree with NEW batch of branches
          const currentTree = parseBranchTree([...comparedBranches], base);
          
          setItems([...comparedBranches]);
          setTree(currentTree);
          
          if (i === 0) animate();
        }

        // Final Cache Save
        cache.set(cacheKey, { 
          items: comparedBranches, 
          tree: parseBranchTree(comparedBranches, base) 
        });
      } else {
        setItems(openPRs);
        cache.set(cacheKey, { items: openPRs, tree: null });
      }
    } catch (err: any) {
      console.error('GitTree Error:', err);
      if (err.message?.includes('403')) {
        setError('RATE_LIMIT');
      } else {
        setError('FETCH_ERROR');
      }
    } finally {
      setLoading(false);
    }
  }, [animate]);

  return { loading, error, tree, items, growth, fetchTree };
};