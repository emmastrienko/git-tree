import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import https from 'https';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = 'facebook/react';

// Load Env
const envFile = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').catch(() => '');
const token = envFile.match(/^GITHUB_TOKEN=(.*)$/m)?.[1]?.trim();

const api = axios.create({
  baseURL: `https://api.github.com/repos/${REPO}`,
  timeout: 15000,
  headers: {
    'Accept': 'application/vnd.github.v3+json',
    ...(token && { 'Authorization': `token ${token}` })
  },
  httpsAgent: new https.Agent({ family: 4 })
});

const main = async () => {
  console.log(`\x1b[36m⚡ Analyzing ${REPO}...\x1b[0m`);

  try {
    const { default_branch: base } = (await api.get('/')).data;
    const branches = (await api.get('/branches?per_page=20')).data;

    console.log(`   Base: \x1b[33m${base}\x1b[0m | Branches: \x1b[33m${branches.length}\x1b[0m`);

    const comparisons = await Promise.all(branches.map(async (b) => {
      if (b.name === base) return { name: b.name, isBase: true, ahead: 0, behind: 0 };
      
      const { data } = await api.get(`/compare/${base}...${b.name}`);
      return {
        name: b.name,
        ahead: data.ahead_by,
        behind: data.behind_by,
        isBase: false
      };
    }));

    // Nesting Heuristic
    const groups = {};
    comparisons.forEach(b => {
      if (b.isBase) return;
      if (!groups[b.behind]) groups[b.behind] = [];
      groups[b.behind].push({ ...b, children: [] });
    });

    const tree = Object.keys(groups).map(key => {
      const sorted = groups[key].sort((a, b) => a.ahead - b.ahead);
      const root = sorted[0];
      let curr = root;
      
      for (let i = 1; i < sorted.length; i++) {
        curr.children.push(sorted[i]);
        sorted[i].relativeAhead = sorted[i].ahead - curr.ahead;
        curr = sorted[i];
      }
      return root;
    });

    const outPath = path.join(ROOT, 'test-data.json');
    fs.writeFileSync(outPath, JSON.stringify({ repo: REPO, base, tree }, null, 2));
    console.log(`\x1b[32m✔ Snapshot saved to ${path.relative(process.cwd(), outPath)}\x1b[0m\n`);

  } catch (err) {
    console.error(`\x1b[31m✖ Failed:\x1b[0m ${err.message}`);
    if (err.response) console.error(err.response.data);
  }
};

main();
