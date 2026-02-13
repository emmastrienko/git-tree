import { GitBranch, GitPullRequest } from '@/types';

const fetcher = async <T>(url: string): Promise<T> => {
  console.log(`[GitHub API] Fetching: ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`[GitHub API] Error ${res.status} for ${url}`);
    throw new Error(`GitHub API: ${res.status}`);
  }
  const data = await res.json();
  console.log(`[GitHub API] Success: ${url}`, data);
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
    // Slashes in branch names must be encoded for the Compare API
    const encodedBase = encodeURIComponent(base);
    const encodedHead = encodeURIComponent(head);
    return fetcher<any>(`/api/github/repos/${owner}/${repo}/compare/${encodedBase}...${encodedHead}`);
  },
};
