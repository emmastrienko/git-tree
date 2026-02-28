export interface GitHubRepoResponse {
  name: string;
  default_branch: string;
  description: string;
  stargazers_count: number;
}

export type AnyRecord = Record<string, unknown>;

export interface GitHubCompareResponse {
  status: string;
  ahead_by: number;
  behind_by: number;
  total_commits: number;
  commits: { sha: string; [key: string]: unknown }[];
  files: GitHubFileResponse[];
}

export interface GitHubFileResponse {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
}

export interface GitHubRefNode {
  name: string;
  target: {
    oid: string;
    authoredDate: string;
    author: {
      user: {
        login: string;
        avatarUrl: string;
      } | null;
    };
  };
}

export interface GitHubPRNode {
  number: number;
  title: string;
  state: string;
  url: string;
  isDraft: boolean;
  baseRefName: string;
  headRefName: string;
  headRef: {
    target: {
      oid: string;
    };
  } | null;
  author: {
    login: string;
    avatarUrl: string;
  } | null;
  updatedAt: string;
  reviews: {
    nodes: { state: string }[];
  };
  labels: {
    nodes: GitHubLabel[];
  };
}

export interface GitHubBulkResponse {
  data: {
    repository: {
      defaultBranchRef: {
        name: string;
        target: { oid: string };
      } | null;
      refs?: {
        pageInfo: { hasNextPage: boolean; endCursor: string };
        nodes: GitHubRefNode[];
      };
      pullRequests?: {
        pageInfo: { hasNextPage: boolean; endCursor: string };
        nodes: GitHubPRNode[];
      };
    };
  };
  errors?: { message: string }[];
}

export interface CompareBatchResult {
  head: string;
  success: boolean;
  status?: number;
  error?: string;
  data?: {
    ahead_by: number;
    behind_by: number;
    status: string;
    commits: { sha: string }[];
  };
}

export type ViewMode = 'branches' | 'pr';

export interface GitHubUser {
  login: string;
  avatar_url?: string;
}

export interface GitPullRequest {
  title: string;
  number: number;
  html_url: string;
  state: string;
  draft?: boolean;
  mergeable_state?: string;
  review_status?: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'PENDING';
  headRefName?: string;
  baseRefName?: string;
  isDraft?: boolean;
  labels?: { nodes: GitHubLabel[] };
  head: {
    ref: string;
    sha: string;
  };
  user: GitHubUser;
  author?: GitHubAuthor;
  id?: string | number;
  // Metadata for tree-parsing
  ahead: number;
  behind: number;
  lastUpdated?: string;
  history?: string[];
  isMerged?: boolean;
}

export interface GitHubAuthor {
  login: string;
  avatarUrl?: string;
}

export interface GitHubLabel {
  name: string;
  color: string;
}

export interface NodeMetadata {
  prNumber?: number;
  status?: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'PENDING';
  displayTitle?: string;
  isDraft?: boolean;
  baseBranch?: string;
  headBranch?: string;
  newestTimestamp?: number;
  oldestTimestamp?: number;
  maxBehind?: number;
  labels?: GitHubLabel[];
  [key: string]: string | number | boolean | GitHubLabel[] | undefined | unknown;
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
  author?: GitHubAuthor;
  fileTree?: VisualizerNode;
  metadata?: NodeMetadata;
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
  metadata?: NodeMetadata;
  discoveryIndex?: number;
  additions?: number;
  deletions?: number;
  filesChanged?: number;
  lastUpdated?: string;
  author?: GitHubAuthor;
  fileTree?: VisualizerNode;
}
