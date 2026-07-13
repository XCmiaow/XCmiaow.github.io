import { getCollection } from 'astro:content';
import { absoluteUrl } from '../../data/siteConfig';

const xmlEscape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function GET() {
  const posts = (await getCollection('blog', ({ data }) => data.lang === 'zh' && !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>硅基余烬博客</title>
    <link>${absoluteUrl('/silicon-ashes/writing/')}</link>
    <description>关于 AI、教育、科研方法与化工专业的博客。</description>
    <language>zh-CN</language>
    ${posts
      .map((post) => {
        const link = absoluteUrl(`/silicon-ashes/writing/${post.id}/`);
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
