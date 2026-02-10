export type ViewMode = 'branches' | 'pr';

export interface GitHubUser {
  login: string;
  avatar_url?: string;
}

export interface GitBranch {
  name: string;
  sha: string;
  mergeBaseSha?: string;
  history?: string[];
  isBase?: boolean;
  ahead: number;
  behind: number;
  status?: 'ahead' | 'behind' | 'diverged' | 'identical';
  hasConflicts?: boolean;
  isMerged?: boolean;
  additions?: number;
  deletions?: number;
  filesChanged?: number;
  lastUpdated?: string;
}

export interface VisualizerNode {
  name: string;
  type: 'trunk' | 'branch' | 'folder' | 'file';
  children: VisualizerNode[];
  sha?: string;
  ahead: number;
  behind: number;
  relativeAhead?: number;
  hasConflicts?: boolean;
  isMerged?: boolean;
  metadata?: any;
  discoveryIndex?: number;
  additions?: number;
  deletions?: number;
  filesChanged?: number;
  lastUpdated?: string;
}