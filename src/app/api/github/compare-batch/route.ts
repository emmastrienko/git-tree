import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

export async function POST(req: NextRequest) {
  try {
    const { owner, repo, base, heads } = await req.json();
    
    if (!owner || !repo || !base || !Array.isArray(heads)) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const results = await Promise.all(heads.map(async (head: string) => {
      return new Promise((resolve) => {
        const options: https.RequestOptions = {
          hostname: 'api.github.com',
          port: 443,
          path: `/repos/${owner}/${repo}/compare/${base}...${head}`,
          method: 'GET',
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Git-Tree-Visualizer',
            ...(process.env.GITHUB_TOKEN && { 'Authorization': `token ${process.env.GITHUB_TOKEN}` })
          },
          timeout: 10000,
          family: 4 
        };

        const proxyReq = https.request(options, (proxyRes) => {
          let data = '';
          proxyRes.on('data', chunk => data += chunk);
          proxyRes.on('end', () => {
            try {
              if (proxyRes.statusCode === 200) {
                const json = JSON.parse(data);
                resolve({ 
                  head, 
                  success: true,
                  data: {
                    ahead_by: json.ahead_by,
                    behind_by: json.behind_by,
                    status: json.status,
                    commits: json.commits?.map((c: { sha: string }) => ({ sha: c.sha }))
                  }
                });
              } else {
                resolve({ head, success: false, status: proxyRes.statusCode });
              }
            } catch {
              resolve({ head, success: false, error: 'Parse Error' });
            }
          });
        });

        proxyReq.on('error', (err) => resolve({ head, success: false, error: err.message }));
        proxyReq.on('timeout', () => { proxyReq.destroy(); resolve({ head, success: false, error: 'Timeout' }); });
        proxyReq.end();
      });
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: 'Invalid Request' }, { status: 400 });
  }
}
