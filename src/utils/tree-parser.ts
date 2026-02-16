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
    
  // We make the bounds 'sticky' by checking if we already had extreme values in the trunk metadata
  const prevMeta = trunk.metadata || {};
  const currentNewest = timestamps.length ? Math.max(...timestamps) : Date.now();
  const currentOldest = timestamps.length ? Math.min(...timestamps) : Date.now() - (30 * 24 * 60 * 60 * 1000);

  trunk.metadata = {
    maxBehind: Math.max(...branches.map(b => b.behind), 1),
    maxAhead: Math.max(...branches.map(b => b.ahead), 1),
    newestTimestamp: prevMeta.newestTimestamp ? Math.max(prevMeta.newestTimestamp, currentNewest) : currentNewest,
    oldestTimestamp: prevMeta.oldestTimestamp ? Math.min(prevMeta.oldestTimestamp, currentOldest) : currentOldest
  };

  const shaToNode = new Map<string, VisualizerNode>();
  branches.forEach(b => {
    const node = nodes.get(b.name)!;
    if (b.sha) shaToNode.set(b.sha, node);
  });

  branches.forEach(b => {
    if (b.name === defaultBranch) return;

    const node = nodes.get(b.name)!;
    const bHistory = b.history || [];
    let bestParent = trunk;
    let maxScore = -1;

    // 1. Check explicit base branch (from PR metadata)
    if (b.metadata?.baseBranch && nodes.has(b.metadata.baseBranch)) {
      bestParent = nodes.get(b.metadata.baseBranch)!;
      maxScore = bestParent.ahead || 0;
    }

    // 2. Check history for better ancestors (branches that are part of this branch's history)
    for (const sha of bHistory) {
      const pNode = shaToNode.get(sha);
      if (pNode && pNode.name !== b.name && pNode.type !== 'trunk') {
        if (pNode.ahead > maxScore) {
          maxScore = pNode.ahead;
          bestParent = pNode;
        }
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

export const parseFileTree = (files: any[]): VisualizerNode => {
  const root: VisualizerNode = {
    name: 'root',
    type: 'folder',
    children: [],
    ahead: 0,
    behind: 0
  };

  files.forEach(file => {
    const parts = file.filename.split('/');
    let current = root;

    parts.forEach((part: string, i: number) => {
      const isLast = i === parts.length - 1;
      let child = current.children.find(c => c.name === part);

      if (!child) {
        child = {
          name: part,
          type: isLast ? 'file' : 'folder',
          children: [],
          ahead: 0,
          behind: 0,
          metadata: isLast ? { additions: file.additions, deletions: file.deletions } : {}
        };
        current.children.push(child);
      }
      current = child;
    });
  });

  return root;
};