import { useState, useCallback, useRef, useEffect } from 'react';
import { githubService } from '@/services/github';
import { parseBranchTree } from '@/utils/tree-parser';
import { GitBranch, ViewMode, VisualizerNode } from '@/types';

// Simple in-memory cache to prevent redundant heavy comparisons
const cache = new Map<string, GitBranch[]>();

export const useGitTree = () => {
  const [loading, setLoading] = useState(false);
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
    const [owner, repo] = repoUrl.split('/');
    if (!owner || !repo) return;

    const cacheKey = `${owner}/${repo}/${mode}`;
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)!;
      setItems(cached);
      setTree(parseBranchTree(cached, cached.find(b => b.isBase)?.name || 'main'));
      setGrowth(1);
      return;
    }

    setLoading(true);
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

        // Optimized Batching: 15 at a time for high-speed retrieval
        for (let i = 0; i < branchList.length; i += 15) {
          const chunk = branchList.slice(i, i + 15);
          const results = await Promise.all(chunk.map(async (b) => {
            if (b.name === base) return { name: b.name, sha: b.commit.sha, ahead: 0, behind: 0, isBase: true };
            try {
              const comp = await githubService.compare(owner, repo, base, b.name);
              const pr = openPRs.find(p => p.head.ref === b.name);
              return {
                name: b.name,
                sha: b.commit.sha,
                mergeBaseSha: comp.merge_base_commit?.sha,
                history: comp.commits?.map((c: any) => c.sha) || [],
                ahead: comp.ahead_by,
                behind: comp.behind_by,
                isMerged: comp.status === 'identical' || comp.status === 'behind',
                hasConflicts: pr?.mergeable_state === 'dirty'
              };
            } catch { return null; }
          }));

          const valid = results.filter((res): res is GitBranch => res !== null);
          comparedBranches.push(...valid);
          
          // INCREMENTAL UPDATE: Update UI as batches arrive
          const currentValid = [...comparedBranches];
          setItems(currentValid);
          setTree(parseBranchTree(currentValid, base));
          if (i === 0) animate(); // Start growth animation on first batch
        }

        cache.set(cacheKey, comparedBranches);
      } else {
        setItems(openPRs);
      }
    } catch (err) {
      console.error('GitTree Error:', err);
    } finally {
      setLoading(false);
    }
  }, [animate]);

  return { loading, tree, items, growth, fetchTree };
};