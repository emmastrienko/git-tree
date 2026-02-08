import { GitBranch, GitPullRequest } from '@/types';

const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
  return res.json();
};

export const githubService = {
  getRepo: (owner: string, repo: string) => 
    fetcher<any>(`/api/github/repos/${owner}/${repo}`),

  // Fetches all branches using a simple pagination loop
  getBranches: async (owner: string, repo: string) => {
    let all: any[] = [];
    let page = 1;
    while (true) {
      const pageData = await fetcher<any[]>(`/api/github/repos/${owner}/${repo}/branches?per_page=100&page=${page}`);
      all = [...all, ...pageData];
      if (pageData.length < 100 || all.length >= 300) break; // Cap at 300 for stability
      page++;
    }
    return all;
  },

  getPullRequests: (owner: string, repo: string) => 
    fetcher<GitPullRequest[]>(`/api/github/repos/${owner}/${repo}/pulls?state=open&per_page=50`),

  compare: (owner: string, repo: string, base: string, head: string) => 
    fetcher<any>(`/api/github/repos/${owner}/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`),
};