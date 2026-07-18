import fs from 'node:fs';
import path from 'node:path';
import {
  containsEncodingCorruption,
  courseRoutes,
  distFileForPath,
  readJson,
  readText,
  root,
  walkFiles,
} from './lib/contracts.mjs';

const failures = [];
const checks = [];

function fail(message) {
  failures.push(message);
}

function relative(filePath) {
  return path.relative(root, filePath).replaceAll(path.sep, '/');
}

function runHeaderChecks() {
  const headersPath = path.join(root, 'public', '_headers');
  if (!fs.existsSync(headersPath)) {
    fail('public/_headers is missing');
    return;
  }
  const headers = fs.readFileSync(headersPath, 'utf8');
  for (const header of [
    'Content-Security-Policy',
    'Referrer-Policy',
    'Permissions-Policy',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'frame-ancestors',
  ]) {
    if (!headers.includes(header)) fail(`public/_headers is missing ${header}`);
  }
  for (const route of ['/admin/*', '/write/*']) {
    const block =
      headers.match(new RegExp(`${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)(?=\\n\\S|$)`))?.[1] || '';
    if (!/Cache-Control:\s*no-store/i.test(block)) fail(`${route} must declare Cache-Control: no-store`);
  }
  checks.push({ headers: true });
}

function runSecurityMetaChecks() {
  const source = readText('src/components/SecurityMeta.astro');
  for (const directive of ['script-src-attr', 'frame-src', 'media-src', 'object-src']) {
    if (!source.includes(directive)) fail(`SecurityMeta.astro is missing ${directive}`);
  }
  if (/cdnjs\.cloudflare|cdn\.jsdelivr|unpkg\.com/i.test(source)) fail('SecurityMeta.astro allows an unnecessary CDN');
  const imagePolicy = source.match(/["']img-src ([^"']+)/i)?.[1] || '';
  if (/https?:/i.test(imagePolicy)) fail('SecurityMeta.astro image policy is wider than same-origin assets need');

  const sourceFiles = walkFiles(path.join(root, 'src'), ['.astro', '.ts', '.js', '.mdx']);
  for (const filePath of sourceFiles) {
    const sourceText = fs.readFileSync(filePath, 'utf8');
    if (/\bset:html\b|\.innerHTML\s*=|insertAdjacentHTML\s*\(/.test(sourceText)) {
      fail(`${relative(filePath)} uses an unsafe HTML injection surface`);
    }
  }
  checks.push({ securityMeta: true, injectionSurfaces: sourceFiles.length });
}

function runCourseChecks() {
  const courseSourceFiles = [
    ...walkFiles(path.join(root, 'src', 'content', 'course'), ['.mdx']),
    ...walkFiles(path.join(root, 'src', 'components', 'course'), ['.astro', '.ts']),
    ...walkFiles(path.join(root, 'src', 'pages', 'silicon-ashes', 'courses'), ['.astro', '.ts']),
    path.join(root, 'src', 'layouts', 'CourseLayout.astro'),
    path.join(root, 'src', 'styles', 'course.css'),
  ];
  const forbiddenDependency = /fonts\.(?:googleapis|gstatic)|cdnjs\.cloudflare|cdn\.jsdelivr|unpkg\.com/i;
  for (const filePath of courseSourceFiles) {
    if (!fs.existsSync(filePath)) {
      fail(`course source is missing: ${relative(filePath)}`);
      continue;
    }
    const source = fs.readFileSync(filePath, 'utf8');
    if (forbiddenDependency.test(source)) fail(`${relative(filePath)} loads a forbidden course CDN dependency`);
    if (containsEncodingCorruption(source)) fail(`${relative(filePath)} contains an encoding corruption marker`);
  }

  for (const route of courseRoutes) {
    const file = distFileForPath(route);
    if (!fs.existsSync(file)) {
      fail(`${route}: built course page is missing`);
      continue;
    }
    const html = fs.readFileSync(file, 'utf8');
    if (!/http-equiv="Content-Security-Policy"/i.test(html)) fail(`${route}: built page is missing CSP metadata`);
    if (forbiddenDependency.test(html)) fail(`${route}: built page loads a forbidden CDN dependency`);
    if (/\son[a-z]+=["']/i.test(html)) fail(`${route}: built page contains an inline event handler`);
  }

  const retiredPackage = path.join(root, 'public', 'silicon-ashes', 'courses', 'ai-research-efficiency');
  if (fs.existsSync(retiredPackage)) fail('retired static course package still exists under public/');
  checks.push({ coursePages: courseRoutes.length, courseSourceFiles: courseSourceFiles.length });
}

function runCacheChecks() {
  const sw = readText('public/sw.js');
  for (const snippet of [
    "const BYPASS_PREFIXES = ['/admin/', '/write/']",
    'if (url.search) return false',
    "request.method !== 'GET'",
    "cache: 'no-store'",
    "'/silicon-ashes/courses/ai-research-efficiency/'",
  ]) {
    if (!sw.includes(snippet)) fail(`service worker is missing cache safeguard: ${snippet}`);
  }
  if (fs.existsSync(path.join(root, 'dist', 'write'))) fail('private write route was generated into dist/');
  checks.push({ serviceWorkerCachePolicy: true });
}

function runSecretAndEncodingChecks() {
  const files = walkFiles(path.join(root, 'dist'), ['.html', '.xml', '.json', '.js', '.css', '.txt']);
  const secretPatterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /\bghp_[A-Za-z0-9]{30,}\b/,
    /\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
    /\bsk-[A-Za-z0-9_-]{24,}\b/,
    /\bAKIA[A-Z0-9]{16}\b/,
  ];
  for (const filePath of files) {
    const source = fs.readFileSync(filePath, 'utf8');
    if (secretPatterns.some((pattern) => pattern.test(source)))
      fail(`${relative(filePath)} contains a secret-like value`);
    if (containsEncodingCorruption(source)) fail(`${relative(filePath)} contains an encoding corruption marker`);
    if (/\son[a-z]+=["']/i.test(source) && filePath.endsWith('.html')) {
      fail(`${relative(filePath)} contains an inline event handler blocked by CSP`);
    }
  }
  checks.push({ publicFilesScanned: files.length });
}

function runAssetBudgetChecks() {
  const assets = walkFiles(path.join(root, 'dist'), ['.js', '.css']);
  const budgets = { '.js': 80_000, '.css': 120_000 };
  for (const filePath of assets) {
    const extension = path.extname(filePath);
    const size = fs.statSync(filePath).size;
    if (size > budgets[extension])
      fail(`${relative(filePath)} exceeds the ${budgets[extension]} byte ${extension} budget (${size})`);
  }

  const evidence = readJson('src/data/evidence.json');
  const thumbDir = path.join(root, 'public', 'assets', 'evidence', 'thumbs');
  for (const item of evidence.items) {
    const thumbnail = path.join(thumbDir, item.file.replace(/\.[^.]+$/, '.webp'));
    if (!fs.existsSync(thumbnail)) fail(`evidence thumbnail is missing: ${path.basename(thumbnail)}`);
    else if (fs.statSync(thumbnail).size > 90_000) fail(`evidence thumbnail is too large: ${path.basename(thumbnail)}`);
  }
  checks.push({ assetBudgets: assets.length, evidenceThumbnails: evidence.items.length });
}

function runEmberChecks() {
  const source = readText('src/components/silicon-embers/emberFieldCanvas.ts');
  for (const behavior of [
    'prefers-reduced-motion',
    'visibilitychange',
    'IntersectionObserver',
    'ResizeObserver',
    'cancelAnimationFrame(resizeFrame)',
    'resizeObserver?.disconnect()',
  ]) {
    if (!source.includes(behavior)) fail(`Ember canvas is missing ${behavior} lifecycle handling`);
  }
  checks.push({ emberLifecycle: true });
}

runHeaderChecks();
runSecurityMetaChecks();
runCourseChecks();
runCacheChecks();
runSecretAndEncodingChecks();
runAssetBudgetChecks();
runEmberChecks();

if (failures.length) {
  console.error(JSON.stringify({ failures, checks }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ performanceSecurity: 'ok', checks }, null, 2));
