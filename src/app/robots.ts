import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/', // Disallow API routes from indexing
    },
    sitemap: 'https://git-tree-visualizer.vercel.app/sitemap.xml',
  };
}
