import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';
import { chromium } from 'playwright';

const root = process.cwd();
const host = '127.0.0.1';
const port = Number(process.env.PWA_QA_PORT || 4340);
const base = `http://${host}:${port}`;
const failures = [];
const checks = [];
const routes = readJson('src/data/routes.json');
const expectedAppShell = [
  ...routes
    .filter((route) => route.kind === 'static' && route.pwa === true)
    .flatMap((route) => [route.zh.path, route.en.path]),
  '/styles/site.css',
  '/manifest.json',
  '/route-contract.json',
]
  .filter((route, index, all) => all.indexOf(route) === index)
  .sort();

function fail(message) {
  failures.push(message);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
}

function readText(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function runStaticChecks() {
  const manifest = readJson('public/manifest.json');
  const requiredManifestFields = ['name', 'short_name', 'description', 'start_url', 'scope', 'display', 'theme_color'];
  for (const field of requiredManifestFields) {
    if (!manifest[field]) fail(`manifest.json is missing ${field}`);
  }
  if (manifest.start_url !== '/') fail(`manifest start_url must be "/": ${manifest.start_url}`);
  if (manifest.scope !== '/') fail(`manifest scope must be "/": ${manifest.scope}`);
  if (!['standalone', 'fullscreen', 'minimal-ui'].includes(manifest.display)) {
    fail(`manifest display should be installable, got ${manifest.display}`);
  }
  if (!/^#[0-9a-f]{6}$/i.test(manifest.theme_color || '')) {
    fail(`manifest theme_color must be a 6-digit hex color: ${manifest.theme_color}`);
  }
  if (!Array.isArray(manifest.icons) || manifest.icons.length < 2) {
    fail('manifest must define at least two icons');
  }
  for (const icon of manifest.icons || []) {
    if (!icon.src?.startsWith('/')) fail(`manifest icon src must be root-relative: ${icon.src}`);
    if (!icon.sizes || !icon.type) fail(`manifest icon is missing sizes/type: ${JSON.stringify(icon)}`);
    const iconPath = path.join(root, 'public', icon.src || '');
    if (!fs.existsSync(iconPath)) fail(`manifest icon file does not exist: ${icon.src}`);
  }

  const sw = readText('public/sw.js');
  if (!/const\s+CACHE\s*=\s*['"]resume-v\d+['"]/.test(sw)) fail('service worker cache name must be versioned');
  if (!/self\.addEventListener\(['"]install['"]/.test(sw)) fail('service worker must handle install');
  if (!/self\.addEventListener\(['"]activate['"]/.test(sw)) fail('service worker must handle activate');
  if (!/self\.addEventListener\(['"]fetch['"]/.test(sw)) fail('service worker must handle fetch');
  if (/const\s+APP_SHELL\s*=\s*\[/.test(sw)) fail('service worker must not hard-code an APP_SHELL route array');

  const builtContractPath = path.join(root, 'dist', 'route-contract.json');
  if (!fs.existsSync(builtContractPath)) {
    fail('build output is missing /route-contract.json');
  } else {
    const contract = JSON.parse(fs.readFileSync(builtContractPath, 'utf8'));
    if (contract.version !== 1) fail(`route contract version must be 1: ${contract.version}`);
    if (!Array.isArray(contract.appShell)) {
      fail('route contract appShell must be an array');
    } else if (JSON.stringify(contract.appShell) !== JSON.stringify(expectedAppShell)) {
      fail(`route contract appShell does not match routes.json: ${JSON.stringify(contract.appShell)}`);
    }
  }

  checks.push({ staticManifest: true, staticServiceWorker: true });
}

function startPreview() {
  return spawn(`npm run preview -- --host ${host} --port ${port}`, [], {
    cwd: root,
    stdio: 'ignore',
    shell: true,
    windowsHide: true,
  });
}

function stopPreview(child) {
  if (child.exitCode !== null) return;
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore', windowsHide: true });
  } else {
    child.kill('SIGTERM');
  }
}

async function waitForPreview(child) {
  let lastError = '';
  for (let i = 0; i < 60; i += 1) {
    if (child.exitCode !== null) throw new Error(`Preview exited early with code ${child.exitCode}`);
    try {
      const res = await fetch(base);
      if (res.ok) return;
      lastError = `HTTP ${res.status}`;
    } catch (error) {
      lastError = error.message;
    }
    await wait(250);
  }
  throw new Error(`Preview server did not become ready: ${lastError}`);
}

async function runBrowserChecks() {
  const child = startPreview();
  try {
    await waitForPreview(child);
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ baseURL: base, serviceWorkers: 'allow' });
    const page = await context.newPage();
    let offlineProbe = false;
    page.setDefaultTimeout(10000);
    page.on('console', (msg) => {
      const text = msg.text();
      if (offlineProbe && /net::ERR_(INTERNET_DISCONNECTED|CONNECTION_CLOSED)/.test(text)) return;
      if (msg.type() === 'error') fail(`console error: ${text}`);
    });
    page.on('pageerror', (error) => fail(`page error: ${error.message}`));

    await page.goto('/', { waitUntil: 'load' });
    const manifestResponse = await page.request.get(`${base}/manifest.json`);
    if (!manifestResponse.ok()) fail(`manifest request failed with ${manifestResponse.status()}`);
    const swResponse = await page.request.get(`${base}/sw.js`);
    if (!swResponse.ok()) fail(`service worker request failed with ${swResponse.status()}`);
    const contractResponse = await page.request.get(`${base}/route-contract.json`);
    if (!contractResponse.ok()) fail(`route contract request failed with ${contractResponse.status()}`);
    const onlineContract = contractResponse.ok() ? await contractResponse.json() : null;
    if (JSON.stringify(onlineContract?.appShell) !== JSON.stringify(expectedAppShell)) {
      fail(`online route contract appShell does not match routes.json: ${JSON.stringify(onlineContract?.appShell)}`);
    }

    const registration = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return { supported: false };
      let readyTimeout = 0;
      try {
        const reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((_, reject) => {
            readyTimeout = window.setTimeout(
              () => reject(new Error('service worker did not become ready within 10000ms')),
              10000,
            );
          }),
        ]);
        await new Promise((resolve) => setTimeout(resolve, 100));
        return {
          supported: true,
          scope: reg.scope,
          scriptURL: reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL || '',
          controller: !!navigator.serviceWorker.controller,
        };
      } finally {
        window.clearTimeout(readyTimeout);
      }
    });
    if (!registration.supported) fail('service worker is not supported in browser context');
    if (!registration.scope?.endsWith('/')) fail(`service worker scope is unexpected: ${registration.scope}`);
    if (!registration.scriptURL?.endsWith('/sw.js'))
      fail(`service worker script URL is unexpected: ${registration.scriptURL}`);

    await page.waitForFunction(async () => (await caches.keys()).some((key) => /^resume-v\d+$/.test(key)));
    const cacheState = await page.evaluate(async (shellRoutes) => {
      const cacheNames = await caches.keys();
      const routeState = {};
      for (const route of shellRoutes) {
        routeState[route] = !!(await caches.match(route));
      }
      return { cacheNames, routeState };
    }, expectedAppShell);
    for (const [route, cached] of Object.entries(cacheState.routeState)) {
      if (!cached) fail(`service worker cache is missing ${route}`);
    }

    offlineProbe = true;
    await context.setOffline(true);
    await page.goto('/profile', { waitUntil: 'domcontentloaded' });
    const offlineH1 = await page
      .locator('h1')
      .first()
      .textContent()
      .catch(() => '');
    if (offlineH1?.trim() !== '方绪杰') fail(`offline /profile rendered unexpected h1: ${offlineH1}`);
    await context.setOffline(false);
    await wait(100);
    offlineProbe = false;

    checks.push({ registration, cacheState, offlineRoute: '/profile', offlineH1: offlineH1?.trim() });
    await browser.close();
  } finally {
    stopPreview(child);
  }
}

runStaticChecks();
await runBrowserChecks();

const result = { failures, checks };
if (failures.length) {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(result, null, 2));
