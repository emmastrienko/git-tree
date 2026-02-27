import { VisualizerNode } from '@/types';

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

export const MOCK_TREE_DATA: VisualizerNode = {
  name: 'main',
  type: 'trunk',
  ahead: 0,
  behind: 0,
  children: [
    {
      name: 'feature/engine-v2',
      type: 'branch',
      ahead: 124,
      behind: 12,
      relativeAhead: 124,
      lastUpdated: new Date(now - 2 * day).toISOString(),
      author: { login: 'emmastrienko', avatarUrl: 'https://github.com/github.png' },
      children: [
        {
          name: 'research/webgl-instancing',
          type: 'branch',
          ahead: 145,
          behind: 0,
          relativeAhead: 21,
          children: [
            { name: 'poc/matrix-transforms', type: 'branch', ahead: 152, behind: 2, relativeAhead: 7, children: [] },
            { name: 'poc/shader-atlasing', type: 'branch', ahead: 158, behind: 4, relativeAhead: 13, children: [] }
          ]
        },
        {
          name: 'feat/worker-threads',
          type: 'branch',
          ahead: 138,
          behind: 5,
          relativeAhead: 14,
          children: [
            { name: 'fix/worker-serialization', type: 'branch', ahead: 142, behind: 0, relativeAhead: 4, children: [] }
          ]
        }
      ]
    },
    {
      name: 'refactor/core-types',
      type: 'branch',
      ahead: 42,
      behind: 0,
      relativeAhead: 42,
      children: [
        { name: 'fix/type-inference', type: 'branch', ahead: 48, behind: 0, relativeAhead: 6, children: [] },
        { name: 'docs/api-reference', type: 'branch', ahead: 45, behind: 0, relativeAhead: 3, children: [] },
        { name: 'feat/type-guards', type: 'branch', ahead: 55, behind: 1, relativeAhead: 13, children: [] }
      ]
    },
    {
      name: 'feat/ui-overhaul #442',
      type: 'branch',
      ahead: 89,
      behind: 4,
      relativeAhead: 89,
      metadata: { prNumber: 442, status: 'APPROVED' },
      lastUpdated: new Date(now - day).toISOString(),
      author: { login: 'octocat', avatarUrl: 'https://github.com/octocat.png' },
      children: [
        { name: 'design/dark-mode-refinement', type: 'branch', ahead: 94, behind: 0, relativeAhead: 5, children: [] },
        { name: 'feat/accessibility-audit', type: 'branch', ahead: 102, behind: 2, relativeAhead: 13, children: [] },
        { name: 'ui/glassmorphism-utils', type: 'branch', ahead: 98, behind: 0, relativeAhead: 9, children: [] }
      ]
    },
    {
      name: 'hotfix/memory-leak',
      type: 'branch',
      ahead: 15,
      behind: 0,
      relativeAhead: 15,
      hasConflicts: true,
      lastUpdated: new Date(now - 3600000).toISOString(),
      children: []
    },
    {
      name: 'release/v1.2.0',
      type: 'branch',
      ahead: 0,
      behind: 0,
      isMerged: true,
      children: [
        { name: 'patch/security-update', type: 'branch', ahead: 5, behind: 0, isMerged: true, children: [] },
        { name: 'patch/dependency-bump', type: 'branch', ahead: 2, behind: 0, isMerged: true, children: [] }
      ]
    },
    {
      name: 'experimental/ai-clustering',
      type: 'branch',
      ahead: 210,
      behind: 45,
      relativeAhead: 210,
      lastUpdated: new Date(now - 10 * day).toISOString(),
      children: [
        { name: 'ai/k-means-implementation', type: 'branch', ahead: 225, behind: 5, relativeAhead: 15, children: [] },
        { name: 'ai/vector-embeddings', type: 'branch', ahead: 240, behind: 10, relativeAhead: 30, children: [] }
      ]
    },
    {
      name: 'feat/data-persistence',
      type: 'branch',
      ahead: 65,
      behind: 2,
      relativeAhead: 65,
      metadata: { prNumber: 445, status: 'CHANGES_REQUESTED' },
      children: []
    }
  ],
  metadata: {
    maxAhead: 240,
    maxBehind: 45,
    newestTimestamp: now,
    oldestTimestamp: now - (30 * day)
  }
};
