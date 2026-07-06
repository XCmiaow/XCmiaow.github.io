import { getCollection } from 'astro:content';
import { resourceTemplates } from '../data/siliconAshesResources';

const SITE = 'https://XCmiaow.github.io';
const staticRoutes = [
  '/',
  '/en/',
  '/blog/',
  '/en/blog/',
  '/silicon-ashes/',
  '/en/silicon-ashes/',
  '/silicon-ashes/writing/',
  '/en/silicon-ashes/writing/',
  '/silicon-ashes/courses/',
  '/en/silicon-ashes/courses/',
  '/silicon-ashes/resources/',
  '/en/silicon-ashes/resources/',
  '/silicon-ashes/about/',
  '/en/silicon-ashes/about/',
  '/modeling/',
  '/en/modeling/',
  '/ai-km/',
  '/en/ai-km/',
  '/chem-ai-lab/',
  '/en/chem-ai-lab/',
  '/evidence/',
  '/en/evidence/',
  '/materials/',
  '/en/materials/',
];

const xmlEscape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const toUrl = (pathname: string) => new URL(pathname, SITE).toString();

export async function GET() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const latestPostDate = posts.map((post) => post.data.date).sort((a, b) => b.valueOf() - a.valueOf())[0];
  const fallbackDate = latestPostDate ?? new Date('2026-07-06T00:00:00Z');

  const postRoutes = posts.flatMap((post) => {
    const base = post.data.lang === 'zh' ? '/silicon-ashes/writing/' : '/en/silicon-ashes/writing/';
    const blogBase = post.data.lang === 'zh' ? '/blog/' : '/en/blog/';
    return [
      { path: `${base}${post.id}/`, lastmod: post.data.date, priority: '0.72' },
      { path: `${blogBase}${post.id}/`, lastmod: post.data.date, priority: '0.52' },
    ];
  });

  const templateRoutes = resourceTemplates.flatMap((template) => [
    { path: `/silicon-ashes/resources/${template.slug}/`, lastmod: fallbackDate, priority: '0.68' },
    { path: `/en/silicon-ashes/resources/${template.slug}/`, lastmod: fallbackDate, priority: '0.68' },
  ]);

  const entries = [
    ...staticRoutes.map((path) => ({
      path,
      lastmod: fallbackDate,
      priority: path.includes('silicon-ashes') ? '0.8' : '0.55',
    })),
    ...postRoutes,
    ...templateRoutes,
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${xmlEscape(toUrl(entry.path))}</loc>
    <lastmod>${entry.lastmod.toISOString().slice(0, 10)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
