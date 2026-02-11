import { GitBranch, VisualizerNode } from '@/types';

export const parseBranchTree = (branches: GitBranch[], defaultBranch: string): VisualizerNode => {
  const nodes = new Map<string, VisualizerNode>();
  
  branches.forEach(b => nodes.set(b.name, {
    ...b,
    type: b.name === defaultBranch ? 'trunk' : 'branch',
    children: []
  }));

  if (!nodes.has(defaultBranch)) {
    nodes.set(defaultBranch, { name: defaultBranch, type: 'trunk', sha: '', ahead: 0, behind: 0, children: [] });
  }

  const trunk = nodes.get(defaultBranch)!;
  
  // Calculate age range for dynamic coloring
  const timestamps = branches
    .map(b => b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0)
    .filter(t => t > 0);
    
  trunk.metadata = {
    maxBehind: Math.max(...branches.map(b => b.behind), 1),
    maxAhead: Math.max(...branches.map(b => b.ahead), 1),
    newestTimestamp: timestamps.length ? Math.max(...timestamps) : Date.now(),
    oldestTimestamp: timestamps.length ? Math.min(...timestamps) : Date.now() - (30 * 24 * 60 * 60 * 1000)
  };

  branches.forEach(b => {
    if (b.name === defaultBranch) return;

    const node = nodes.get(b.name)!;
    const bHistory = new Set(b.history || []);
    let bestParent = trunk;
    let maxScore = -1;

    for (const p of branches) {
      if (p.name === b.name || p.isBase) continue;

      const isAncestor = bHistory.has(p.sha) || 
                        (b.mergeBaseSha === p.mergeBaseSha && b.ahead > p.ahead) ||
                        (b.behind === p.behind && b.ahead > p.ahead);

      if (isAncestor && p.ahead > maxScore) {
        maxScore = p.ahead;
        bestParent = nodes.get(p.name)!;
      }
    }

    if (bestParent.type === 'branch') {
      node.relativeAhead = Math.max(2, b.ahead - bestParent.ahead);
    } else {
      node.relativeAhead = Math.max(2, b.ahead);
    }
    bestParent.children.push(node);
  });

  return trunk;
};