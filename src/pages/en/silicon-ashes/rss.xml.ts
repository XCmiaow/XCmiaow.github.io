import { getCollection } from 'astro:content';

const SITE = 'https://XCmiaow.github.io';

const xmlEscape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const toUrl = (pathname: string) => new URL(pathname, SITE).toString();

export async function GET() {
  const posts = (await getCollection('blog', ({ data }) => data.lang === 'en' && !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Silicon Ashes Writing</title>
    <link>${toUrl('/en/silicon-ashes/writing/')}</link>
    <description>Writing about AI, education, research methods, and chemistry.</description>
    <language>en</language>
    ${posts
      .map((post) => {
        const link = toUrl(`/en/silicon-ashes/writing/${post.id}/`);
        return `<item>
      <title>${xmlEscape(post.data.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${post.data.date.toUTCString()}</pubDate>
      <description>${xmlEscape(post.data.description ?? post.data.title)}</description>
    </item>`;
      })
      .join('\n    ')}
  </channel>
</rss>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}
