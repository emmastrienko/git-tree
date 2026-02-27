import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const options: https.RequestOptions = {
      hostname: 'api.github.com',
      port: 443,
      path: '/graphql',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Git-Tree-Visualizer',
        ...(process.env.GITHUB_TOKEN && { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` })
      },
      timeout: 15000,
      family: 4 
    };

    return new Promise<NextResponse>((resolve) => {
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
      proxyReq.write(JSON.stringify(body));
      proxyReq.end();
    });
  } catch {
    return NextResponse.json({ error: 'Invalid Request Body' }, { status: 400 });
  }
}
