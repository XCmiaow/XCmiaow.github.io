import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const base = '/silicon-ashes/courses/ai-research-efficiency';
const routes = [
  `${base}/`,
  ...[
    '01-ai-history',
    '02-llm-mental-model',
    '03-task-design',
    '04-tool-systems',
    '05-controlled-agents',
    '06-research-workflow-studio',
    'schedule',
    'instructor',
    'reference',
    'handout',
  ].map((slug) => `${base}/${slug}/`),
  '/en/silicon-ashes/courses/ai-research-efficiency/',
];

for (const route of routes) {
  const file = resolve('dist', route.replace(/^\//, ''), 'index.html');
  assert(existsSync(file), `${route}: built page is missing`);
  const html = readFileSync(file, 'utf8');
  assert(html.includes('<h1'), `${route}: h1 is missing`);
  assert(html.includes('course-program'), `${route}: unified Astro course shell is missing`);
  assert(!html.includes('�'), `${route}: encoding corruption detected`);
}

const sitemap = readFileSync(resolve('dist/sitemap.xml'), 'utf8');
for (const route of routes) {
  assert(sitemap.includes(route), `${route}: sitemap entry is missing`);
}

const home = readFileSync(resolve('dist', base.replace(/^\//, ''), 'index.html'), 'utf8');
assert(
  home.includes(`hreflang="en" href="https://xcmiaow.github.io/en${base}/"`),
  'course home must link to the reciprocal English overview',
);
for (const slug of [
  '01-ai-history',
  '02-llm-mental-model',
  '03-task-design',
  '04-tool-systems',
  '05-controlled-agents',
  '06-research-workflow-studio',
]) {
  assert(home.includes(`${base}/${slug}/`), `course home does not link to ${slug}`);
}

const firstUnit = readFileSync(resolve('dist', base.replace(/^\//, ''), '01-ai-history/index.html'), 'utf8');
assert(!firstUnit.includes('hreflang="en"'), 'Chinese-only units must not claim a non-equivalent English alternate');

console.log(JSON.stringify({ courseRoutes: 'ok', routes: routes.length }));
