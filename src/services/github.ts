import { GitBranch, GitPullRequest } from '@/types';

const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
  return res.json();
};

export const githubService = {
  getRepo: (owner: string, repo: string) => 
    fetcher<any>(`/api/github/repos/${owner}/${repo}`),

  getBranches: async (owner: string, repo: string) => {
    let all: any[] = [];
    let page = 1;
    const MAX_PAGES = 10; // 1000 branches limit for UI stability
    
    while (page <= MAX_PAGES) {
      const url = `/api/github/repos/${owner}/${repo}/branches?per_page=100&page=${page}`;
      const pageData = await fetcher<any[]>(url);
      
      if (!pageData || pageData.length === 0) break;
      
      all = [...all, ...pageData];
      if (pageData.length < 100) break;
      page++;
    }
    return all;
  },

  getPullRequests: (owner: string, repo: string) => 
    fetcher<GitPullRequest[]>(`/api/github/repos/${owner}/${repo}/pulls?state=open&per_page=50`),

  compare: (owner: string, repo: string, base: string, head: string) => 
    fetcher<any>(`/api/github/repos/${owner}/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`),
};
