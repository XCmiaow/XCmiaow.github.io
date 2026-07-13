import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';

export const root = process.cwd();
export const previewHost = '127.0.0.1';
export const previewPort = Number(process.env.QA_PORT || 4322);
export const previewBase = `http://${previewHost}:${previewPort}`;

export const courseRoutes = [
  '/silicon-ashes/courses/ai-research-efficiency/',
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
  ].map((slug) => `/silicon-ashes/courses/ai-research-efficiency/${slug}/`),
  '/en/silicon-ashes/courses/ai-research-efficiency/',
];

export const printRoutes = [
  '/resume-onepage',
  '/en/resume-onepage',
  '/resume-academic',
  '/en/resume-academic',
  '/resume-career',
  '/en/resume-career',
];

export const accessibilityRoutes = [
  '/',
  '/en/',
  '/profile',
  '/en/profile',
  '/materials',
  '/evidence',
  '/silicon-ashes/writing/',
  '/silicon-ashes/resources/',
  '/silicon-ashes/courses/',
  courseRoutes[0],
  courseRoutes[1],
  courseRoutes[10],
  ...printRoutes,
];

export const accessibilityViewports = [
  { name: 'mobile-320', width: 320, height: 720 },
  { name: 'mobile-360', width: 360, height: 800 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 1000 },
];

export function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

export function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

export function walkFiles(directory, extensions, results = []) {
  if (!fs.existsSync(directory)) return results;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) walkFiles(filePath, extensions, results);
    else if (entry.isFile() && extensions.some((extension) => entry.name.endsWith(extension))) results.push(filePath);
  }
  return results;
}

export function loadRouteContract() {
  return readJson('src/data/routes.json');
}

export function staticRouteLocales() {
  return loadRouteContract()
    .filter(({ kind }) => kind === 'static')
    .flatMap((entry) =>
      ['zh', 'en'].map((lang) => ({
        ...entry[lang],
        id: entry.id,
        lang,
        alternateLang: lang === 'zh' ? 'en' : 'zh',
        alternatePath: entry[lang === 'zh' ? 'en' : 'zh'].path,
        domain: entry.domain,
        canonical: entry.canonical,
      })),
    );
}

export function normalizePathname(value) {
  let pathname = new URL(value, previewBase).pathname;
  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    // Keep the encoded path when a malformed link is under test.
  }
  return pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
}

export function localUrl(value) {
  try {
    const url = new URL(value, previewBase);
    return url.origin === previewBase && url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

export function distFileForPath(pathname) {
  const normalized = normalizePathname(pathname).replace(/^\//, '');
  return path.join(root, 'dist', normalized, normalized.endsWith('.html') ? '' : 'index.html');
}

export function hasFragmentTarget(url) {
  const fragment = decodeURIComponent(url.hash.slice(1));
  if (!fragment) return true;
  const file = distFileForPath(url.pathname);
  if (!fs.existsSync(file)) return false;
  const html = fs.readFileSync(file, 'utf8');
  const escaped = fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:id|name)=["']${escaped}["']`).test(html);
}

export function pdfPageCount(buffer) {
  return (buffer.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length;
}

export function containsEncodingCorruption(value) {
  return /\uFFFD|锟斤拷|锟\?|Ã[\x80-\xBF]|Â[\x80-\xBF]|â(?:€|€™|€œ|€˜)/.test(value);
}

async function waitForPreview(child) {
  let lastError = 'not started';
  for (let attempt = 0; attempt < 48; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Preview server exited with code ${child.exitCode}`);
    try {
      const response = await fetch(previewBase);
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error.message;
    }
    await wait(250);
  }
  throw new Error(`Preview server did not become ready: ${lastError}`);
}

async function stopPreview(child) {
  if (child.exitCode !== null) return;
  if (process.platform === 'win32') {
    const killer = spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    await new Promise((resolve) => killer.once('exit', resolve));
  } else {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      child.kill('SIGTERM');
    }
    await Promise.race([
      new Promise((resolve) => child.once('exit', resolve)),
      wait(3000).then(() => {
        if (child.exitCode === null) {
          try {
            process.kill(-child.pid, 'SIGKILL');
          } catch {
            child.kill('SIGKILL');
          }
        }
      }),
    ]);
  }
}

async function assertPreviewPortAvailable() {
  try {
    await fetch(previewBase, { signal: AbortSignal.timeout(750) });
  } catch {
    return;
  }
  throw new Error(`Preview port is already in use: ${previewBase}`);
}

export async function withPreview(run) {
  await assertPreviewPortAvailable();
  const windows = process.platform === 'win32';
  const command = windows ? process.env.ComSpec || 'cmd.exe' : 'npm';
  const args = windows
    ? ['/d', '/s', '/c', `npm run preview -- --host ${previewHost} --port ${previewPort}`]
    : ['run', 'preview', '--', '--host', previewHost, '--port', String(previewPort)];
  const child = spawn(command, args, {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    detached: !windows,
  });
  let output = '';
  child.stdout.on('data', (chunk) => (output += chunk));
  child.stderr.on('data', (chunk) => (output += chunk));
  try {
    await waitForPreview(child);
    return await run();
  } catch (error) {
    const tail = output.trim().split(/\r?\n/).slice(-8).join('\n');
    if (tail) error.message += `\nPreview output:\n${tail}`;
    throw error;
  } finally {
    await stopPreview(child);
  }
}
