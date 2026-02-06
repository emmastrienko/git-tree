# Git Tree Visualizer

An interactive visualization engine that transforms GitHub repository data into hierarchical structures using HTML5 Canvas.

## The Problem
Parsing complex Git logs and multi-file Pull Requests in a text-based format is inefficient. Git Tree provides a visual mental model of a codebase's state.

## Core Logic
The application fetches data via the **GitHub REST API** and processes it through a recursive building algorithm:
1. **Fetch**: Retrieves flat file trees or branch commit histories.
2. **Transform**: Converts flat paths into a nested JSON tree structure.
3. **Render**: Maps the nested data onto a Canvas coordinate system with dynamic node scaling.

## Planned Features
- **PR Heat-maps**: Nodes (files) scale based on "Code Churn" (total additions and deletions).
- **Branch Topology**: Visualizing merge relationships and branch divergence.
- **Review State**: Tracking which parts of the tree have been inspected in real-time.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Graphics**: HTML5 Canvas API
- **Styling**: Tailwind CSS 4

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open the application**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

