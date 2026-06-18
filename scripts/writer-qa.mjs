import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';
import { chromium } from 'playwright';

const root = process.cwd();
const host = '127.0.0.1';
const port = Number(process.env.WRITER_QA_PORT || 4351);
const base = `http://${host}:${port}`;
const publicWriteRoute = path.join(root, 'src', 'pages', 'write.astro');
const failures = [];
const checks = [];

function fail(message) {
  failures.push(message);
}

function runNodeScript(script, action) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [script, action], { cwd: root, stdio: 'ignore', windowsHide: true });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} ${action} exited with ${code}`));
    });
  });
}

function startDevServer() {
  return spawn(`npm run dev -- --host ${host} --port ${port}`, [], {
    cwd: root,
    stdio: 'ignore',
    shell: true,
    windowsHide: true,
  });
}

function stopProcess(child) {
  if (child.exitCode !== null) return;
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore', windowsHide: true });
  } else {
    child.kill('SIGTERM');
  }
}

async function waitForRoute(child, route) {
  let lastError = '';
  for (let i = 0; i < 80; i += 1) {
    if (child.exitCode !== null) throw new Error(`Dev server exited early with code ${child.exitCode}`);
    try {
      const res = await fetch(`${base}${route}`);
      if (res.ok) return;
      lastError = `HTTP ${res.status}`;
    } catch (error) {
      lastError = error.message;
    }
    await wait(250);
  }
  throw new Error(`Dev server did not serve ${route}: ${lastError}`);
}

await runNodeScript('scripts/write-route.mjs', 'enable');
const child = startDevServer();

try {
  await waitForRoute(child, '/write');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleMessages = [];

  page.on('console', (msg) => {
    if (['error', 'warning'].includes(msg.type())) consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });
  page.on('pageerror', (error) => consoleMessages.push(`pageerror: ${error.message}`));

  await page.goto(`${base}/write`, { waitUntil: 'networkidle' });
  const h1 = await page.getByRole('heading', { name: 'Local Blog Composer' }).textContent();
  await page.locator('#post-lang').selectOption('en');
  await page.locator('#post-title').fill('Local Publish Flow');
  await page.locator('#post-desc').fill('Generated without browser tokens');
  await page.locator('#post-tags').fill('QA,Security');
  await page.locator('#post-body').fill('This post stays local until git commit.');
  await page.locator('#generate-btn').click();

  const output = await page.locator('#post-output').inputValue();
  const pathText = await page.locator('#post-path').textContent();
  const status = await page.locator('#status').textContent();
  const bodyText = await page.locator('body').innerText();
  const tokenFieldCount = await page.locator('#gh-token').count();
  const forbiddenBrowserPublishText = /api\.github\.com|GitHub Token|Authorization|public_repo/.test(bodyText);

  if (h1 !== 'Local Blog Composer') fail('/write rendered unexpected heading');
  if (pathText !== 'src/content/blog/local-publish-flow.md') fail('/write generated unexpected post path');
  if (!status?.includes('src/content/blog/local-publish-flow.md')) fail('/write did not report generated path');
  if (tokenFieldCount !== 0) fail('/write rendered a token input');
  if (forbiddenBrowserPublishText) fail('/write exposes browser-side publish wording');
  if (!output.includes('title: "Local Publish Flow"')) fail('/write output is missing title frontmatter');
  if (!output.includes('lang: en')) fail('/write output is missing language frontmatter');
  if (!output.includes('This post stays local until git commit.')) fail('/write output is missing body');
  consoleMessages.forEach((message) => fail(`console issue: ${message}`));

  checks.push({ route: '/write', h1, pathText, tokenFieldCount, generated: failures.length === 0 });
  await browser.close();
} finally {
  stopProcess(child);
  await runNodeScript('scripts/write-route.mjs', 'disable').catch((error) => fail(error.message));
}

if (fs.existsSync(publicWriteRoute)) fail('writer QA left src/pages/write.astro enabled');

const result = { failures, checks };
if (failures.length) {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(result, null, 2));
