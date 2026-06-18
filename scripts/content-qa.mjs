import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const blogDir = path.join(root, 'src', 'content', 'blog');
const distDir = path.join(root, 'dist');
const failures = [];
const posts = [];

function fail(message) {
  failures.push(message);
}

function parseFrontmatter(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) {
    fail(`${file} is missing frontmatter`);
    return null;
  }

  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!pair) continue;
    const [, key, rawValue] = pair;
    let value = rawValue.trim();
    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
      value = value.slice(1, -1);
    }
    if (value === 'true') value = true;
    if (value === 'false') value = false;
    data[key] = value;
  }

  return { raw, data };
}

function routeForPost(post) {
  return post.lang === 'en' ? `/en/blog/${post.slug}` : `/blog/${post.slug}`;
}

function distPathForRoute(route) {
  return path.join(distDir, route.replace(/^\/+/, ''), 'index.html');
}

function assertNoPublicWriteEntry() {
  const layoutPath = path.join(root, 'src', 'layouts', 'BaseLayout.astro');
  const layout = fs.readFileSync(layoutPath, 'utf8');
  const publicWritePage = path.join(root, 'src', 'pages', 'write.astro');
  const publicWriteDistRoute = path.join(distDir, 'write');
  if (/href=["'`{][^"'`}]*(?:\/write\/?)/.test(layout)) {
    fail('BaseLayout must not expose /write from public navigation or footer');
  }
  if (fs.existsSync(publicWritePage)) {
    fail('/write source must not live under src/pages in the default public build');
  }
  if (fs.existsSync(publicWriteDistRoute)) {
    fail('/write route must not be generated in the default public build');
  }
}

function assertNoTokenPersistence() {
  const writePath = path.join(root, 'src', 'tools', 'write.astro');
  const writePage = fs.readFileSync(writePath, 'utf8');
  if (/gh-blog-token/.test(writePage)) fail('/write must not use a persistent token storage key');
  if (/localStorage\.setItem\([^)]*token/i.test(writePage)) fail('/write must not persist GitHub tokens');
  if (/localStorage\.getItem\([^)]*token/i.test(writePage)) fail('/write must not restore GitHub tokens');
}

for (const entry of fs.readdirSync(blogDir)) {
  if (!entry.endsWith('.md')) continue;
  const file = path.join(blogDir, entry);
  const parsed = parseFrontmatter(file);
  if (!parsed) continue;

  const slug = entry.replace(/\.md$/, '');
  const { data } = parsed;
  const post = {
    file,
    slug,
    title: data.title,
    lang: data.lang,
    draft: data.draft === true,
    date: data.date,
  };
  posts.push(post);

  if (!post.title) fail(`${entry} is missing title`);
  if (!['zh', 'en'].includes(post.lang)) fail(`${entry} has invalid lang: ${post.lang}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date || '')) fail(`${entry} must use YYYY-MM-DD date`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) fail(`${entry} slug must be lowercase kebab-case`);
}

const seenRoutes = new Set();
for (const post of posts) {
  const route = routeForPost(post);
  if (seenRoutes.has(route)) fail(`duplicate blog route: ${route}`);
  seenRoutes.add(route);

  const built = fs.existsSync(distPathForRoute(route));
  if (post.draft && built) fail(`draft post was generated publicly: ${route}`);
  if (!post.draft && !built) fail(`published post route was not generated: ${route}`);
}

const publishedCountByLang = posts.reduce(
  (counts, post) => {
    if (!post.draft && post.lang) counts[post.lang] += 1;
    return counts;
  },
  { zh: 0, en: 0 },
);

assertNoPublicWriteEntry();
assertNoTokenPersistence();

console.log(JSON.stringify({ failures, posts: posts.length, publishedCountByLang }, null, 2));
if (failures.length) process.exit(1);
