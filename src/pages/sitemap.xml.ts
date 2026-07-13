import { getCollection } from 'astro:content';
import { coursePaths } from '../data/courseCatalog';
import { resourceTemplates } from '../data/siliconAshesResources';
import { absoluteUrl } from '../data/siteConfig';
import { canonicalRoutes } from '../lib/siteRoutes';

const staticRoutes = [
  ...new Set(
    canonicalRoutes
      .filter((route) => route.kind === 'static' && route.sitemap)
      .flatMap((route) => [route.zh.path, route.en.path]),
  ),
];

function dynamicPath(source: 'blog' | 'resources', lang: 'zh' | 'en', slug: string) {
  const route = canonicalRoutes.find(
    (candidate) => candidate.kind === 'pattern' && candidate.sitemap && candidate.source === source,
  );
  if (!route) throw new Error(`Missing canonical ${source} route pattern`);
  return route[lang].path.replace(':slug', slug);
}

const xmlEscape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function GET() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const course = await getCollection('course');
  const latestPostDate = posts.map((post) => post.data.date).sort((a, b) => b.valueOf() - a.valueOf())[0];
  const fallbackDate = latestPostDate ?? new Date('2026-07-06T00:00:00Z');

  const postRoutes = posts.flatMap((post) => {
    const lang = post.data.lang === 'zh' ? 'zh' : 'en';
    return [{ path: dynamicPath('blog', lang, post.id), lastmod: post.data.date, priority: '0.72' }];
  });

  const templateRoutes = resourceTemplates.flatMap((template) => [
    { path: dynamicPath('resources', 'zh', template.slug), lastmod: fallbackDate, priority: '0.68' },
    { path: dynamicPath('resources', 'en', template.slug), lastmod: fallbackDate, priority: '0.68' },
  ]);

  const courseDates = course.flatMap((entry) => entry.data.sources.map((source) => source.reviewedAt));
  const courseLastmod = courseDates.sort((a, b) => b.valueOf() - a.valueOf())[0] ?? fallbackDate;
  const courseRoutes = [
    { path: `${coursePaths.zh}/`, lastmod: courseLastmod, priority: '0.86' },
    ...course.map((entry) => ({
      path: `${coursePaths.zh}/${entry.id}/`,
      lastmod: courseLastmod,
      priority: '0.78',
    })),
    ...['schedule', 'instructor', 'reference', 'handout'].map((slug) => ({
      path: `${coursePaths.zh}/${slug}/`,
      lastmod: courseLastmod,
      priority: '0.7',
    })),
    { path: `${coursePaths.en}/`, lastmod: courseLastmod, priority: '0.72' },
  ];

  const seenPaths = new Set<string>();
  const entries = [
    ...staticRoutes.map((path) => ({
      path,
      lastmod: fallbackDate,
      priority: path === '/' || path === '/en/' ? '1.0' : path.includes('silicon-ashes') ? '0.8' : '0.55',
    })),
    ...postRoutes,
    ...templateRoutes,
    ...courseRoutes,
  ].filter((entry) => {
    if (seenPaths.has(entry.path)) return false;
    seenPaths.add(entry.path);
    return true;
  });

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${xmlEscape(absoluteUrl(entry.path))}</loc>
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
