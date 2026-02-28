import { GitHubRepoResponse, GitHubCompareResponse, GitHubFileResponse, GitHubBulkResponse, CompareBatchResult } from '@/types';
import { GITHUB_PER_PAGE, MAX_BRANCH_PAGES, MAX_PR_PAGES } from '@/constants';

export const fetcher = async <T>(url: string, signal?: AbortSignal): Promise<T> => {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    console.error(`[GitHub API] Error ${res.status} for ${url}`);
    throw new Error(`GitHub API: ${res.status}`);
  }
  const data = await res.json();
  return data;
};

export const githubService = {
  getRepo: (owner: string, repo: string, signal?: AbortSignal) => 
    fetcher<GitHubRepoResponse>(`/api/github/repos/${owner}/${repo}`, signal),

  getBranches: async (owner: string, repo: string, signal?: AbortSignal) => {
    let all: { name: string; commit: { sha: string } }[] = [];
    let page = 1;
    
    try {
      while (page <= MAX_BRANCH_PAGES) {
        const url = `/api/github/repos/${owner}/${repo}/branches?per_page=${GITHUB_PER_PAGE}&page=${page}`;
        const pageData = await fetcher<{ name: string; commit: { sha: string } }[]>(url, signal);
        
        if (!pageData || pageData.length === 0) break;
        
        all = [...all, ...pageData];
        if (pageData.length < GITHUB_PER_PAGE) break;
        page++;
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') throw e;
      console.warn(`[GitHub Service] Partial branches fetch: ${all.length} items. Error:`, e);
      if (all.length === 0) throw e;
    }
    return all;
  },

  getPullRequests: async (owner: string, repo: string, signal?: AbortSignal) => {
    let all: unknown[] = [];
    let page = 1;
    
    try {
      while (page <= MAX_PR_PAGES) {
        const url = `/api/github/repos/${owner}/${repo}/pulls?state=open&per_page=${GITHUB_PER_PAGE}&page=${page}`;
        const pageData = await fetcher<unknown[]>(url, signal);
        
        if (!pageData || pageData.length === 0) break;
        
        all = [...all, ...pageData];
        if (pageData.length < GITHUB_PER_PAGE) break;
        page++;
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') throw e;
      console.warn(`[GitHub Service] Partial PRs fetch: ${all.length} items. Error:`, e);
      if (all.length === 0) throw e;
    }
    return all;
  },

  getPullRequestReviews: (owner: string, repo: string, pullNumber: number, signal?: AbortSignal) =>
    fetcher<unknown[]>(`/api/github/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`, signal),

  getPullRequestFiles: (owner: string, repo: string, pullNumber: number, signal?: AbortSignal) =>
    fetcher<GitHubFileResponse[]>(`/api/github/repos/${owner}/${repo}/pulls/${pullNumber}/files?per_page=${GITHUB_PER_PAGE}`, signal),

  compare: (owner: string, repo: string, base: string, head: string, signal?: AbortSignal) => {
    const encodedBase = encodeURIComponent(base);
    const encodedHead = encodeURIComponent(head);
    return fetcher<GitHubCompareResponse>(`/api/github/repos/${owner}/${repo}/compare/${encodedBase}...${encodedHead}`, signal);
  },

  compareBatch: (owner: string, repo: string, base: string, heads: string[], signal?: AbortSignal) => {
    return fetch('/api/github/compare-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner, repo, base, heads }),
      signal
    }).then(res => res.json() as Promise<{ results: CompareBatchResult[] }>);
  },

  graphql: (query: string, variables: Record<string, unknown> = {}, signal?: AbortSignal) => {
    return fetch('/api/github/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
      signal
    }).then(res => res.json());
  },

  getBulkData: async (owner: string, repo: string, branchCursor: string | null = null, prCursor: string | null = null, includeBranches = true, includePrs = true, signal?: AbortSignal) => {
    const query = `
      query($owner: String!, $repo: String!, $branchCursor: String, $prCursor: String, $includeBranches: Boolean!, $includePrs: Boolean!) {
        repository(owner: $owner, name: $repo) {
          defaultBranchRef { 
            name 
            target { ... on Commit { oid } }
          }
          refs(refPrefix: "refs/heads/", first: 100, after: $branchCursor) @include(if: $includeBranches) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              name
              target {
                ... on Commit {
                  oid
                  authoredDate
                  author {
                    user { login avatarUrl }
                  }
                }
              }
            }
          }
          pullRequests(first: 100, states: OPEN, after: $prCursor) @include(if: $includePrs) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              number
              title
              state
              url
              isDraft
              baseRefName
              headRefName
              headRef {
                target { ... on Commit { oid } }
              }
              author { login avatarUrl }
              updatedAt
              reviews(last: 1) {
                nodes { state }
              }
              labels(first: 5) {
                nodes { name color }
              }
            }
          }
        }
      }
    `;
    return githubService.graphql(query, { owner, repo, branchCursor, prCursor, includeBranches, includePrs }, signal) as Promise<GitHubBulkResponse>;
  }
};
