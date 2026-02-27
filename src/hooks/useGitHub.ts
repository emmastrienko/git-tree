import useSWR from 'swr';
import { githubService, fetcher } from '@/services/github';

export const useRepo = (owner: string, repo: string) => {
  const { data, error, isLoading } = useSWR(
    owner && repo ? `/api/github/repos/${owner}/${repo}` : null,
    fetcher
  );

  return {
    repo: data,
    isLoading,
    isError: error
  };
};

export const useNodeDetails = (repoUrl: string, nodeName: string, mode: 'branches' | 'pr', prNumber?: number, baseBranch?: string) => {
  const [owner, repo] = (repoUrl || '').split('/');
  
  const key = owner && repo && nodeName ? {
    url: mode === 'pr' && prNumber 
      ? `/api/github/repos/${owner}/${repo}/pulls/${prNumber}/files`
      : `/api/github/repos/${owner}/${repo}/compare/${baseBranch}...${nodeName}`,
    type: 'nodeDetails',
    mode,
    nodeName
  } : null;

  const { data, error, isLoading } = useSWR(
    key,
    async (k) => {
      if (k.mode === 'pr') {
        const prFiles = await githubService.getPullRequestFiles(owner, repo, prNumber!);
        const additions = prFiles.reduce((acc: number, f: any) => acc + f.additions, 0) || 0;
        const deletions = prFiles.reduce((acc: number, f: any) => acc + f.deletions, 0) || 0;
        return { additions, deletions, filesChanged: prFiles.length, files: prFiles };
      } else {
        const comp = await githubService.compare(owner, repo, baseBranch || 'main', nodeName);
        const additions = comp.files?.reduce((acc: number, f: any) => acc + f.additions, 0) || 0;
        const deletions = comp.files?.reduce((acc: number, f: any) => acc + f.deletions, 0) || 0;
        const lastUpdated = comp.commits?.length > 0 ? comp.commits[comp.commits.length - 1].commit.author.date : undefined;
        return { additions, deletions, filesChanged: comp.files?.length || 0, files: comp.files, lastUpdated };
      }
    }
  );

  return {
    details: data,
    isLoading,
    isError: error
  };
};
