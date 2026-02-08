import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8')
    .split('\n')
    .filter(line => line.includes('='))
    .map(line => line.split('=').map(s => s.trim()))
);

const REPO = env.TEST_REPO || 'facebook/react';
const api = axios.create({
  baseURL: 'https://api.github.com',
  headers: { 
    Accept: 'application/vnd.github.v3+json',
    ...(env.GITHUB_TOKEN && { Authorization: `token ${env.GITHUB_TOKEN}` })
  },
  httpsAgent: new https.Agent({ family: 4 })
});

(async () => {
  try {
    console.log(`> Fetching ${REPO}...`);
    const { data: repo } = await api.get(`/repos/${REPO}`);
    const { data: branchList } = await api.get(`/repos/${REPO}/branches?per_page=50`);

    const branches = (await Promise.all(branchList.map(async (b) => {
      if (b.name === repo.default_branch) {
        return { name: b.name, sha: b.commit.sha, ahead: 0, behind: 0, isBase: true };
      }
      try {
        const { data: c } = await api.get(`/repos/${REPO}/compare/${repo.default_branch}...${encodeURIComponent(b.name)}`);
        return {
          name: b.name,
          sha: b.commit.sha,
          mergeBaseSha: c.merge_base_commit?.sha,
          history: c.commits?.map(commit => commit.sha) || [],
          ahead: c.ahead_by,
          behind: c.behind_by,
          isMerged: ['identical', 'behind'].includes(c.status),
          isBase: false
        };
      } catch (e) { return null; }
    }))).filter(Boolean);

    const name = REPO.replace(/\//g, '-');
    const out = path.join(ROOT, 'src/test/fixtures', `${name}.json`);
    fs.writeFileSync(out, JSON.stringify({ repository: REPO, base_branch: repo.default_branch, branches }, null, 2));

    console.log(`Done. Saved to ${name}.json (${branches.length} branches)`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();