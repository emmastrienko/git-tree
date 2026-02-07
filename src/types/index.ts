export type ViewMode = 'branches' | 'pr';

export interface GitHubUser {
  login: string;
  avatar_url?: string;
}

export interface GitBranch {
  name: string;
  isBase?: boolean;
  ahead: number;
  behind: number;
  relativeAhead?: number;
  authors?: string[];
}

export interface GitPullRequest {
  number: number;
  title: string;
  user: GitHubUser;
  state: 'open' | 'closed';
  created_at: string;
}

export interface GitFile {
  filename: string;
  additions: number;
  deletions: number;
  status: 'added' | 'removed' | 'modified' | 'renamed';
  blob_url: string;
}

/**
 * The core recursive node for the visualizer.
 * Supports both Branch nesting and File System nesting.
 */
export interface VisualizerNode {
  name: string;
  type: 'trunk' | 'branch' | 'folder' | 'file';
  children: VisualizerNode[];
  
  // Metrics for branch mode
  ahead?: number;
  behind?: number;
  relativeAhead?: number;
  
  // Metadata for PR/File mode
  metadata?: any;
}
