# Git Tree Visualizer

A Next.js application for visualizing GitHub repository topologies through 2D Canvas and 3D Three.js rendering.

## The Problem
Parsing complex Git logs and multi-branch relationships in a text-based format is often inefficient. Git Tree Visualizer provides a visual mental model of a repository's state, allowing developers to understand branch divergence and merging patterns at a glance.

## Core Logic
The engine processes GitHub repository data through a multi-stage pipeline:
1. **Fetch**: Retrieves branch metadata and comparison data via the GitHub REST API (proxied through Next.js API routes).
2. **Transform**: A heuristic-based parser in `src/utils/tree-parser.ts` converts flat branch comparisons into a nested JSON tree structure.
3. **Render**: Maps the hierarchical data onto either a 2D Canvas coordinate system or a 3D Three.js scene graph.

## Features
* **Dual-Engine Rendering**: Switch between an optimized 2D Canvas engine and a 3D Three.js environment.
* **Camera Controls**: Native support for panning and zooming in both visualization modes.
* **Adaptive Distribution**: Uses wide-fan layouts in 2D and Golden Angle distribution in 3D to ensure branch separation.
* **Incremental Synchronization**: Batched API requests (15 branches per chunk) for responsive UI updates during data fetching.

## Tech Stack
* **Framework**: Next.js 16 (App Router), TypeScript, Tailwind CSS
* **Graphics**: Three.js, HTML5 Canvas API
* **Testing**: Vitest for tree-parsing and stress testing

## Development

### Setup
```bash
npm install
npm run dev
```

### Commands
* `npm run dev`: Start development server
* `npm run test`: Run Vitest suite
* `npm run build`: Production build

## Planned Features
* **Code Churn Heat-maps**: Scaling nodes based on total additions and deletions in Pull Requests.
* **PR Target Visualization**: Explicitly mapping open PRs relative to their target branches.
* **Review State Tracking**: Visual indicators for inspected vs. uninspected parts of the tree.

---
&copy; 2026 Emma Strienko
