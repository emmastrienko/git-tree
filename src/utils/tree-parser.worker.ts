import { GitBranch, VisualizerNode } from '../types';

const parseBranchTree = (branches: GitBranch[], defaultBranch: string): VisualizerNode => {
  const nodes: Record<string, VisualizerNode> = {};
  const branchToNodeName: Record<string, string> = {};
  
  branches.forEach(b => {
    nodes[b.name] = {
      ...b,
      type: b.name === defaultBranch ? 'trunk' : 'branch',
      children: []
    };
    
    if (b.metadata?.headBranch) {
      branchToNodeName[b.metadata.headBranch] = b.name;
    } else {
      branchToNodeName[b.name] = b.name;
    }
  });

  if (!nodes[defaultBranch]) {
    nodes[defaultBranch] = { name: defaultBranch, type: 'trunk', sha: '', ahead: 0, behind: 0, children: [] };
    branchToNodeName[defaultBranch] = defaultBranch;
  }

  const trunk = nodes[defaultBranch];
  
  const timestamps = branches
    .map(b => b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0)
    .filter(t => t > 0);
    
  const newest = timestamps.length ? Math.max(...timestamps) : Date.now();
  const oldest = timestamps.length ? Math.min(...timestamps) : Date.now() - (30 * 24 * 60 * 60 * 1000);

  trunk.metadata = {
    maxBehind: Math.max(...branches.map(b => b.behind || 0), 1),
    maxAhead: Math.max(...branches.map(b => b.ahead || 0), 1),
    newestTimestamp: newest,
    oldestTimestamp: oldest
  };

  branches.forEach(b => {
    if (b.name === defaultBranch) return;

    const node = nodes[b.name];
    const history = new Set(b.history || []);
    let bestParent = trunk;
    let maxScore = -1;

    // PR target branch takes precedence
    if (b.metadata?.baseBranch) {
      if (b.metadata.baseBranch === defaultBranch) {
        bestParent = trunk;
        maxScore = Infinity; // Explicitly target default branch
      } else {
        const parentNodeName = branchToNodeName[b.metadata.baseBranch];
        if (parentNodeName && nodes[parentNodeName]) {
          bestParent = nodes[parentNodeName];
          maxScore = bestParent.ahead || 0;
        }
      }
    }

    if (maxScore !== Infinity) {
      for (const p of branches) {
        if (p.name === b.name || p.name === defaultBranch) continue;
        
        const isAncestor = (p.sha && history.has(p.sha)) || (b.metadata?.baseBranch === (p.metadata?.headBranch || p.name));
        if (isAncestor && (p.ahead || 0) > maxScore) {
          maxScore = p.ahead || 0;
          bestParent = nodes[p.name];
        }
      }
    }

    node.relativeAhead = bestParent.type === 'branch' 
      ? Math.max(2, (b.ahead || 0) - (bestParent.ahead || 0))
      : Math.max(2, b.ahead || 0);

    bestParent.children.push(node);
  });

  return trunk;
};

self.onmessage = (e: MessageEvent) => {
  const { branches, defaultBranch, requestId } = e.data;
  try {
    const tree = parseBranchTree(branches, defaultBranch);
    self.postMessage({ tree, requestId });
  } catch (err) {
    self.postMessage({ error: (err as Error).message, requestId });
  }
};