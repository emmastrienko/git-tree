import { describe, it, expect } from 'vitest';
import { parseBranchTree } from '../../utils/tree-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { VisualizerNode, GitBranch } from '@/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixturesDir = path.resolve(__dirname, '../fixtures');
const fixtures = fs.readdirSync(fixturesDir).filter(f => f.endsWith('.json'));

describe('tree-parser stress tests', () => {
  fixtures.forEach(file => {
    const data = JSON.parse(fs.readFileSync(path.join(fixturesDir, file), 'utf8'));
    
    describe(data.repository, () => {
      const tree = parseBranchTree(data.branches as GitBranch[], data.base_branch);

      it('parses without crashing', () => {
        expect(tree).toBeDefined();
        expect(tree.name).toBe(data.base_branch);
      });

      it('maintains tree integrity', () => {
        const nodes = new Set<string>();
        const walk = (n: VisualizerNode) => {
          expect(nodes.has(n.name)).toBe(false);
          nodes.add(n.name);
          n.children.forEach(walk);
        };
        walk(tree);
        const expected = new Set([...(data.branches as GitBranch[]).map(b => b.name), data.base_branch]).size;
        expect(nodes.size).toBe(expected);
      });

      it('has no cycles', () => {
        const check = (n: VisualizerNode, ancestors: Set<string>) => {
          expect(ancestors.has(n.name)).toBe(false);
          n.children.forEach(c => check(c, new Set([...ancestors, n.name])));
        };
        check(tree, new Set<string>());
      });

      it('calculates valid scores', () => {
        const walk = (n: VisualizerNode) => n.children.forEach(c => {
          expect(c.relativeAhead).toBeGreaterThanOrEqual(1);
          walk(c);
        });
        walk(tree);
      });

      it('ensures single trunk at root', () => {
        expect(tree.type).toBe('trunk');
        const walk = (n: VisualizerNode) => n.children.forEach(c => {
          expect(c.type).toBe('branch');
          walk(c);
        });
        walk(tree);
      });
    });
  });
});
