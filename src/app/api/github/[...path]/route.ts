import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

export async function GET(req: NextRequest) {
  const urlString = req.url;
  const apiUrlPart = '/api/github';
  const apiIndex = urlString.indexOf(apiUrlPart);
  const endpoint = urlString.substring(apiIndex + apiUrlPart.length);
  
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
    timeout: 30000,
    // CRITICAL: Forces IPv4 to bypass Windows Node.js connection issues
    family: 4 
  };

  return new Promise<NextResponse>((resolve) => {
    const proxyReq = https.request(options, (proxyRes) => {
      let data = '';
      proxyRes.on('data', chunk => data += chunk);
      proxyRes.on('end', () => {
        try {
          if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
            console.warn(`[Proxy] GitHub returned ${proxyRes.statusCode} for ${endpoint}`);
          }
          resolve(NextResponse.json(JSON.parse(data), { status: proxyRes.statusCode }));
        } catch {
          resolve(NextResponse.json({ error: 'Upstream Parse Error', details: data.substring(0, 200) }, { status: 502 }));
        }
      });
    });

    proxyReq.on('error', err => {
      console.error(`[Proxy] Request Error for ${endpoint}:`, err.message);
      resolve(NextResponse.json({ error: err.message }, { status: 500 }));
    });
    proxyReq.on('timeout', () => { 
      proxyReq.destroy(); 
      resolve(NextResponse.json({ error: 'Timeout' }, { status: 504 })); 
    });
    proxyReq.end();
  });
}
