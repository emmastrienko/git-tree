import { GitBranch, GitPullRequest } from '@/types';

const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`[GitHub API] Error ${res.status} for ${url}`);
    throw new Error(`GitHub API: ${res.status}`);
  }
  const data = await res.json();
  return data;
};

export const githubService = {
  getRepo: (owner: string, repo: string) => 
    fetcher<any>(`/api/github/repos/${owner}/${repo}`),

  getBranches: async (owner: string, repo: string) => {
    let all: any[] = [];
    let page = 1;
    const MAX_PAGES = 10; 
    
    try {
      while (page <= MAX_PAGES) {
        const url = `/api/github/repos/${owner}/${repo}/branches?per_page=100&page=${page}`;
        const pageData = await fetcher<any[]>(url);
        
        if (!pageData || pageData.length === 0) break;
        
        all = [...all, ...pageData];
        if (pageData.length < 100) break;
        page++;
      }
    } catch (e) {
      console.warn(`[GitHub Service] Partial branches fetch: ${all.length} items. Error:`, e);
      if (all.length === 0) throw e;
    }
    return all;
  },

  getPullRequests: async (owner: string, repo: string) => {
    let all: any[] = [];
    let page = 1;
    const MAX_PAGES = 5; 
    
    try {
      while (page <= MAX_PAGES) {
        const url = `/api/github/repos/${owner}/${repo}/pulls?state=open&per_page=100&page=${page}`;
        const pageData = await fetcher<any[]>(url);
        
        if (!pageData || pageData.length === 0) break;
        
        all = [...all, ...pageData];
        if (pageData.length < 100) break;
        page++;
      }
    } catch (e) {
      console.warn(`[GitHub Service] Partial PRs fetch: ${all.length} items. Error:`, e);
      if (all.length === 0) throw e;
    }
    return all;
  },

  getPullRequestReviews: (owner: string, repo: string, pullNumber: number) =>
    fetcher<any[]>(`/api/github/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`),

  getPullRequestFiles: (owner: string, repo: string, pullNumber: number) =>
    fetcher<any[]>(`/api/github/repos/${owner}/${repo}/pulls/${pullNumber}/files?per_page=100`),

  compare: (owner: string, repo: string, base: string, head: string) => {
    const encodedBase = encodeURIComponent(base);
    const encodedHead = encodeURIComponent(head);
    return fetcher<any>(`/api/github/repos/${owner}/${repo}/compare/${encodedBase}...${encodedHead}`);
  },

  compareBatch: (owner: string, repo: string, base: string, heads: string[]) => {
    return fetch('/api/github/compare-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner, repo, base, heads })
    }).then(res => res.json());
  },

  graphql: (query: string, variables: any = {}) => {
    return fetch('/api/github/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    }).then(res => res.json());
  },

  getBulkData: async (owner: string, repo: string, cursor: string | null = null) => {
    const query = `
      query($owner: String!, $repo: String!, $cursor: String) {
        repository(owner: $owner, name: $repo) {
          defaultBranchRef { 
            name 
            target { ... on Commit { oid } }
          }
          refs(refPrefix: "refs/heads/", first: 100, after: $cursor) {
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
          pullRequests(first: 100, states: OPEN) {
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
            }
          }
        }
      }
    `;
    return githubService.graphql(query, { owner, repo, cursor });
  }
};
