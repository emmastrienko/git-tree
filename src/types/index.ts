export type ViewMode = 'branches' | 'pr';

export interface GitHubUser {
  login: string;
  avatar_url?: string;
}

export interface GitBranch {
  name: string;
  sha: string;            // The current tip of the branch
  mergeBaseSha?: string;  // The commit where it diverged from the base
  isBase?: boolean;
  ahead: number;
  behind: number;
}

export interface VisualizerNode {
  name: string;
  type: 'trunk' | 'branch' | 'folder' | 'file';
  children: VisualizerNode[];
  sha?: string;
  ahead: number;
  behind: number;
  relativeAhead?: number;
}
