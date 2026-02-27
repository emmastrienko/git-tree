import { GitBranch, VisualizerNode } from '@/types';
import { THIRTY_DAYS_MS } from '@/constants';

export const parseBranchTree = (branches: GitBranch[], defaultBranch: string): VisualizerNode => {
  const nodes = new Map<string, VisualizerNode>();
  const branchToNodeName = new Map<string, string>();
  
  branches.forEach(b => {
    nodes.set(b.name, {
      ...b,
      type: b.name === defaultBranch ? 'trunk' : 'branch',
      children: []
    });
    // For PRs, metadata.headBranch is the actual branch name
    if (b.metadata?.headBranch) {
      branchToNodeName.set(b.metadata.headBranch, b.name);
    } else {
      branchToNodeName.set(b.name, b.name);
    }
  });

  if (!nodes.has(defaultBranch)) {
    nodes.set(defaultBranch, { name: defaultBranch, type: 'trunk', sha: '', ahead: 0, behind: 0, children: [] });
    branchToNodeName.set(defaultBranch, defaultBranch);
  }

  const trunk = nodes.get(defaultBranch)!;
  
  // Calculate age range for dynamic coloring
  const timestamps = branches
    .map(b => b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0)
    .filter(t => t > 0);
    
  // We make the bounds 'sticky' by checking if we already had extreme values in the trunk metadata
  const prevMeta = trunk.metadata || {};
  const currentNewest = timestamps.length ? Math.max(...timestamps) : Date.now();
  const currentOldest = timestamps.length ? Math.min(...timestamps) : Date.now() - THIRTY_DAYS_MS;

  trunk.metadata = {
    maxBehind: Math.max(...branches.map(b => b.behind), 1),
    maxAhead: Math.max(...branches.map(b => b.ahead), 1),
    newestTimestamp: prevMeta.newestTimestamp ? Math.max(prevMeta.newestTimestamp, currentNewest) : currentNewest,
    oldestTimestamp: prevMeta.oldestTimestamp ? Math.min(prevMeta.oldestTimestamp, currentOldest) : currentOldest
  };

  branches.forEach(b => {
    if (b.name === defaultBranch) return;

    const node = nodes.get(b.name)!;
    const bHistory = new Set(b.history || []);
    let bestParent = trunk;
    let maxScore = -1;

    // Check explicit base branch (from PR metadata)
    if (b.metadata?.baseBranch) {
      if (b.metadata.baseBranch === defaultBranch) {
        bestParent = trunk;
        maxScore = Infinity; // Explicitly target default branch
      } else {
        const parentNodeName = branchToNodeName.get(b.metadata.baseBranch);
        if (parentNodeName && nodes.has(parentNodeName)) {
          bestParent = nodes.get(parentNodeName)!;
          maxScore = bestParent.ahead || 0;
        }
      }
    }

    // Search for the best ancestor among all other branches
    // Only search if we haven't already found an explicit parent that is the trunk
    if (maxScore !== Infinity) {
      for (const p of branches) {
        if (p.name === b.name || p.name === defaultBranch) continue;
        
        const isAncestor = (p.sha && bHistory.has(p.sha)) || (b.metadata?.baseBranch === (p.metadata?.headBranch || p.name));
        
        if (isAncestor && p.ahead > maxScore) {
          maxScore = p.ahead;
          bestParent = nodes.get(p.name)!;
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