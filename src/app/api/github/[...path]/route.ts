import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const query = req.nextUrl.searchParams.toString();
  const endpoint = `/${path.join('/')}${query ? `?${query}` : ''}`;
  
  const options: https.RequestOptions = {
    hostname: 'api.github.com',
    port: 443,
    path: endpoint,
    method: 'GET',
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Git-Tree-Visualizer',
      ...(process.env.GITHUB_TOKEN && { 'Authorization': `token ${process.env.GITHUB_TOKEN}` })
    },
    timeout: 15000,
    // CRITICAL: Forces IPv4 to bypass Windows Node.js connection issues
    family: 4 
  };

  return new Promise((resolve) => {
    const proxyReq = https.request(options, (proxyRes) => {
      let data = '';
      proxyRes.on('data', chunk => data += chunk);
      proxyRes.on('end', () => {
        try {
          resolve(NextResponse.json(JSON.parse(data), { status: proxyRes.statusCode }));
        } catch {
          resolve(NextResponse.json({ error: 'Upstream Parse Error' }, { status: 502 }));
        }
      });
    });

    proxyReq.on('error', err => resolve(NextResponse.json({ error: err.message }, { status: 500 })));
    proxyReq.on('timeout', () => { 
      proxyReq.destroy(); 
      resolve(NextResponse.json({ error: 'Timeout' }, { status: 504 })); 
    });
    proxyReq.end();
  });
}
