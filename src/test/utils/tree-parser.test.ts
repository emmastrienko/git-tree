import { describe, it, expect } from 'vitest';
import { parseBranchTree } from '../../utils/tree-parser';
import { GitBranch } from '@/types';

describe('tree-parser (Comprehensive)', () => {
  const defaultBranch = 'main';

  describe('Core Functionality', () => {
    it('should create a trunk node for the default branch', () => {
      const branches: GitBranch[] = [
        { name: 'main', sha: 'sha1', ahead: 0, behind: 0, isBase: true }
      ];
      const tree = parseBranchTree(branches, defaultBranch);
      expect(tree.name).toBe('main');
      expect(tree.type).toBe('trunk');
    });

    it('should correctly nest a sub-branch under its nearest ancestor', () => {
      const branches: GitBranch[] = [
        { name: 'main', sha: 'sha1', ahead: 0, behind: 0, isBase: true },
        { name: 'v1', sha: 'sha2', ahead: 10, behind: 0, history: ['sha1'] },
        { name: 'v2', sha: 'sha3', ahead: 20, behind: 0, history: ['sha1', 'sha2'] }
      ];
      const tree = parseBranchTree(branches, defaultBranch);
      const v1 = tree.children.find(c => c.name === 'v1');
      const v2 = v1?.children.find(c => c.name === 'v2');

      expect(v1).toBeDefined();
      expect(v2).toBeDefined();
      expect(v2?.relativeAhead).toBe(10); // 20 - 10
    });
  });

  describe('Edge Cases (Honest Testing)', () => {
    it('should handle missing default branch by creating a fallback trunk', () => {
      // Scenario: API didn't return 'main', but we know 'main' is the default
      const branches: GitBranch[] = [
        { name: 'feature', sha: 'sha2', ahead: 5, behind: 2 }
      ];
      const tree = parseBranchTree(branches, 'main');
      
      expect(tree.name).toBe('main');
      expect(tree.type).toBe('trunk');
      expect(tree.children[0].name).toBe('feature');
    });

    it('should NOT nest siblings under each other when history is missing', () => {
      // Scenario: history array is empty, counts show they might be related but they are actually siblings
      const branches: GitBranch[] = [
        { name: 'main', sha: 'sha1', ahead: 0, behind: 0, isBase: true },
        { name: 'feature-a', sha: 'sha2', ahead: 10, behind: 0, history: [] },
        { name: 'feature-b', sha: 'sha3', ahead: 15, behind: 0, history: [] }
      ];
      const tree = parseBranchTree(branches, defaultBranch);
      const a = tree.children.find(c => c.name === 'feature-a');
      const b = tree.children.find(c => c.name === 'feature-b');

      expect(a).toBeDefined();
      expect(b).toBeDefined();
      expect(a?.children.find(c => c.name === 'feature-b')).toBeUndefined();
      expect(tree.children).toContain(a);
      expect(tree.children).toContain(b);
    });

    it('should handle empty branch list gracefully', () => {
      const tree = parseBranchTree([], 'master');
      expect(tree.name).toBe('master');
      expect(tree.children).toHaveLength(0);
    });

    it('should correctly calculate global metadata for empty/small trees', () => {
      const branches: GitBranch[] = [{ name: 'main', sha: 'sha1', ahead: 0, behind: 0, isBase: true }];
      const tree = parseBranchTree(branches, 'main');
      
      // Should fallback to 1 to avoid division by zero in UI
      expect(tree.metadata?.maxAhead).toBe(1);
      expect(tree.metadata?.maxBehind).toBe(1);
    });
  });
});
