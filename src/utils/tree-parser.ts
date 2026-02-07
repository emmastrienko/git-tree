import { GitBranch, VisualizerNode } from '@/types';

/**
 * Builds a recursive tree by linking branches whose merge-base matches 
 * the tip of another branch.
 */
export const parseBranchTree = (branches: GitBranch[], defaultBranch: string): VisualizerNode => {
  const nodes = new Map<string, VisualizerNode>();
  
  // Initialize nodes
  branches.forEach(b => {
    nodes.set(b.name, {
      name: b.name,
      type: b.name === defaultBranch ? 'trunk' : 'branch',
      sha: b.sha,
      ahead: b.ahead,
      behind: b.behind,
      children: []
    });
  });

  const trunk = nodes.get(defaultBranch);
  if (!trunk) throw new Error('Trunk node missing');

  // Link relationships
  branches.forEach(b => {
    if (b.name === defaultBranch) return;

    const node = nodes.get(b.name)!;
    let parent = trunk;

    // Find direct parent by SHA anchor
    for (const [name, p] of nodes) {
      if (name !== b.name && b.mergeBaseSha === p.sha) {
        parent = p;
        node.relativeAhead = Math.max(0, b.ahead - p.ahead);
        break;
      }
    }

    parent.children.push(node);
  });

  return trunk;
};