import { GitBranch, GitPullRequest } from '@/types';

const fetcher = async <T>(endpoint: string): Promise<T> => {
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`GitHub API Error: ${res.statusText}`);
  return res.json();
};

export const githubService = {
  getRepo: (owner: string, repo: string) => 
    fetcher<any>(`/api/github/repos/${owner}/${repo}`),

  getBranches: (owner: string, repo: string) => 
    fetcher<GitBranch[]>(`/api/github/repos/${owner}/${repo}/branches?per_page=50`),

  getPullRequests: (owner: string, repo: string) => 
    fetcher<GitPullRequest[]>(`/api/github/repos/${owner}/${repo}/pulls?state=open&per_page=20`),

  compare: (owner: string, repo: string, base: string, head: string) => 
    fetcher<any>(`/api/github/repos/${owner}/${repo}/compare/${base}...${head}`),
};
