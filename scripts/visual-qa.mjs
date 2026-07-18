import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';
import { chromium } from 'playwright';

const root = process.cwd();
const host = '127.0.0.1';
const port = Number(process.env.VISUAL_QA_PORT || 4339);
const base = `http://${host}:${port}`;
const screenshotDir = path.join(root, 'local-only', 'qa-screenshots');
const failures = [];
const checks = [];

fs.mkdirSync(screenshotDir, { recursive: true });

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

async function waitForSettledPage(page) {
  await page.waitForLoadState('load');
  await page
    .locator('#skeleton')
    .waitFor({ state: 'detached', timeout: 2000 })
    .catch(() => {});
  await page.waitForTimeout(150);
}

function fail(message) {
  failures.push(message);
}

async function checkDarkRoute(page, route, options = {}) {
  await page.setViewportSize({ width: options.width || 1440, height: options.height || 1000 });
  await page.goto(`${base}${route}`, { waitUntil: 'load' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await waitForSettledPage(page);
  const check = await page.evaluate(() => {
    const rootStyle = getComputedStyle(document.documentElement);
    const h1 = document.querySelector('h1');
    const cards = [...document.querySelectorAll('.card, .material-card, .blog-card, .legend-item')];
    const lightCards = cards
      .map((card) => getComputedStyle(card).backgroundColor)
      .filter((color) => color === 'rgb(255, 255, 255)');
    const bodyText = document.body.innerText;
    return {
      route: location.pathname,
      theme: document.documentElement.getAttribute('data-theme'),
      h1: h1?.textContent?.trim() || '',
      paper: rootStyle.getPropertyValue('--paper').trim(),
      cardCount: cards.length,
      lightCardCount: lightCards.length,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      skeletonVisible: !!document.querySelector('#skeleton'),
      forbiddenText: /\b(?:lorem ipsum|todo|debug|placeholder|undefined|null|NaN)\b/i.test(bodyText),
    };
  });
  if (check.theme !== 'dark') fail(`${route} did not keep dark theme`);
  if (!check.h1) fail(`${route} rendered without H1`);
  if (check.paper === '#ffffff') fail(`${route} kept a light paper token in dark mode`);
  if (check.lightCardCount) fail(`${route} has ${check.lightCardCount} light cards in dark mode`);
  if (check.overflow) fail(`${route} has horizontal overflow`);
  if (check.skeletonVisible) fail(`${route} skeleton remained visible`);
  if (check.forbiddenText) fail(`${route} includes forbidden placeholder/debug text`);
  checks.push(check);
}

async function checkBrandHomeBounds(page) {
  const viewports = [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 1000 },
    { width: 1440, height: 1100 },
  ];
  const expectedSceneWidths = new Map([
    [360, 280.8],
    [390, 304.2],
    [768, 384],
    [1024, 430.08],
    [1440, 560],
  ]);
  const homeRoutes = ['/', '/en/'];
  const intersects = (a, b) =>
    a.left < b.right - 2 && a.right > b.left + 2 && a.top < b.bottom - 2 && a.bottom > b.top + 2;

  for (const route of homeRoutes) {
    for (const { width, height } of viewports) {
      await page.setViewportSize({ width, height });
      await page.goto(`${base}${route}`, { waitUntil: 'load' });
      await waitForSettledPage(page);
      const geometry = await page.evaluate(() => {
        const readRect = (selector) => {
          const rect = document.querySelector(selector)?.getBoundingClientRect();
          return (
            rect && {
              left: rect.left,
              right: rect.right,
              top: rect.top,
              bottom: rect.bottom,
              width: rect.width,
            }
          );
        };
        return {
          viewport: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          hero: readRect('.ember-hero'),
          stage: readRect('.ember-stage'),
          scene: readRect('.black-hole-scene'),
          primary: readRect('.hero-primary'),
          secondary: readRect('.hero-secondary'),
          photonRing: readRect('.photon-ring'),
          accretionDisc: readRect('.disc-front'),
        };
      });
      if (!geometry.hero || !geometry.stage || !geometry.scene || !geometry.primary || !geometry.secondary) {
        fail(`${route} ${width}px is missing home-stage geometry`);
        continue;
      }
      if (geometry.scrollWidth > geometry.viewport + 1) fail(`${route} ${width}px has horizontal overflow`);
      if (geometry.stage.left < geometry.hero.left - 1 || geometry.stage.right > geometry.hero.right + 1) {
        fail(`${route} ${width}px gravity stage leaves the hero`);
      }
      if (geometry.scene.left < geometry.hero.left - 1 || geometry.scene.right > geometry.hero.right + 1) {
        fail(`${route} ${width}px black-hole scene leaves the hero`);
      }
      const heroCenterX = (geometry.hero.left + geometry.hero.right) / 2;
      const heroCenterY = (geometry.hero.top + geometry.hero.bottom) / 2;
      const sceneCenterX = (geometry.scene.left + geometry.scene.right) / 2;
      const sceneCenterY = (geometry.scene.top + geometry.scene.bottom) / 2;
      if (Math.abs(heroCenterX - sceneCenterX) > 2 || Math.abs(heroCenterY - sceneCenterY) > 2) {
        fail(`${route} ${width}px black hole is not centered`);
      }
      const minimumSceneWidth = width >= 1200 ? 540 : width === 390 ? 285 : 0;
      if (minimumSceneWidth && geometry.scene.width < minimumSceneWidth) {
        fail(`${route} ${width}px black hole is too small`);
      }
      const expectedSceneWidth = expectedSceneWidths.get(width);
      if (expectedSceneWidth && Math.abs(geometry.scene.width - expectedSceneWidth) > 2) {
        fail(`${route} ${width}px changed the black-hole scene width to ${geometry.scene.width.toFixed(1)}px`);
      }
      if (Math.abs(geometry.hero.bottom - height) > 4) {
        fail(`${route} ${width}px hero does not end at the first viewport`);
      }
      if (
        geometry.photonRing &&
        (intersects(geometry.primary, geometry.photonRing) || intersects(geometry.secondary, geometry.photonRing))
      ) {
        fail(`${route} ${width}px hero copy overlaps the photon ring`);
      }
      if (geometry.accretionDisc) {
        const visibleDiscWidth =
          Math.min(geometry.accretionDisc.right, geometry.hero.right) -
          Math.max(geometry.accretionDisc.left, geometry.hero.left);
        if (visibleDiscWidth / geometry.accretionDisc.width < 0.96) {
          fail(`${route} ${width}px accretion disc is visibly clipped`);
        }
      }
      checks.push({
        route,
        width,
        height,
        sceneWidth: geometry.scene.width,
        gravityBounds: 'ok',
        gravityCenter: 'ok',
        copyClearance: 'ok',
      });
    }
  }
}

async function checkEmberAnimationHotPath(browser) {
  const probePage = await browser.newPage({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });

  try {
    await probePage.addInitScript(() => {
      const sample = { rectReads: 0, clearRectFrames: 0 };
      const getBoundingClientRect = Element.prototype.getBoundingClientRect;
      const clearRect = CanvasRenderingContext2D.prototype.clearRect;

      Element.prototype.getBoundingClientRect = function (...args) {
        if (this.matches('.ember-stage, .black-hole-scene')) sample.rectReads += 1;
        return Reflect.apply(getBoundingClientRect, this, args);
      };

      CanvasRenderingContext2D.prototype.clearRect = function (...args) {
        if (this.canvas.matches('[data-ember-canvas]')) sample.clearRectFrames += 1;
        return Reflect.apply(clearRect, this, args);
      };

      Object.defineProperty(window, '__emberPerformanceProbe', {
        value: {
          reset() {
            sample.rectReads = 0;
            sample.clearRectFrames = 0;
          },
          snapshot() {
            return { ...sample };
          },
        },
      });
    });
    await probePage.route('https://cloud.umami.is/**', (route) => route.fulfill({ status: 204, body: '' }));
    await probePage.route('https://gateway.umami.is/**', (route) => route.fulfill({ status: 204, body: '' }));
    await probePage.goto(`${base}/`, { waitUntil: 'load' });
    await waitForSettledPage(probePage);
    await probePage.waitForFunction(
      () => document.querySelector('[data-ember-canvas]')?.getAttribute('data-ember-ready') === 'true',
    );
    await probePage.bringToFront();

    await probePage.evaluate(() => window.__emberPerformanceProbe.reset());
    await probePage.waitForTimeout(800);
    const sample = await probePage.evaluate(() => window.__emberPerformanceProbe.snapshot());

    if (sample.clearRectFrames < 5) {
      fail(`ember canvas rendered only ${sample.clearRectFrames} frames during the 800ms hot-path sample`);
    }
    if (sample.rectReads !== 0) {
      fail(`ember animation performed ${sample.rectReads} stage/scene layout reads during the 800ms hot-path sample`);
    }
    checks.push({ route: '/', emberHotPath: sample, sampleDurationMs: 800 });

    const sampleFrameCount = async (duration = 350) => {
      await probePage.evaluate(() => window.__emberPerformanceProbe.reset());
      await probePage.waitForTimeout(duration);
      return probePage.evaluate(() => window.__emberPerformanceProbe.snapshot().clearRectFrames);
    };
    const waitForCanvasIdle = async () => {
      let previous = await probePage.evaluate(() => window.__emberPerformanceProbe.snapshot().clearRectFrames);
      for (let attempt = 0; attempt < 6; attempt += 1) {
        await probePage.waitForTimeout(225);
        const current = await probePage.evaluate(() => window.__emberPerformanceProbe.snapshot().clearRectFrames);
        if (current === previous) return true;
        previous = current;
      }
      return false;
    };

    const visibleFrames = await sampleFrameCount();
    if (visibleFrames < 2) fail('ember canvas does not animate while visible');

    await probePage.evaluate(() => {
      const spacer = document.createElement('div');
      spacer.dataset.emberTestSpacer = '';
      spacer.style.height = '120vh';
      document.body.append(spacer);
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await probePage.waitForFunction(() => document.querySelector('.ember-stage')?.getBoundingClientRect().bottom <= 0);
    if (!(await waitForCanvasIdle())) fail('ember canvas did not become idle after leaving the viewport');
    const offscreenFrames = await sampleFrameCount();
    if (offscreenFrames !== 0) fail(`ember canvas drew ${offscreenFrames} frames while offscreen`);

    await probePage.evaluate(() => window.scrollTo(0, 0));
    await probePage.waitForFunction(() => {
      const rect = document.querySelector('.ember-stage')?.getBoundingClientRect();
      return rect && rect.top < innerHeight && rect.bottom > 0;
    });
    const resumedFrames = await sampleFrameCount();
    if (resumedFrames < 2) fail('ember canvas does not resume after returning onscreen');

    await probePage.emulateMedia({ reducedMotion: 'reduce' });
    if (!(await waitForCanvasIdle())) fail('reduced-motion ember canvas did not become idle');
    const reducedMotionFrames = await sampleFrameCount();
    if (reducedMotionFrames !== 0) fail(`reduced-motion ember canvas drew ${reducedMotionFrames} continuing frames`);

    await probePage.emulateMedia({ reducedMotion: 'no-preference' });
    const restoredFrames = await sampleFrameCount();
    if (restoredFrames < 2) fail('ember canvas does not resume after reduced motion is disabled');

    await probePage.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    if (!(await waitForCanvasIdle())) fail('pagehide ember canvas did not become idle');
    const pagehideFrames = await sampleFrameCount();
    if (pagehideFrames !== 0) fail(`pagehide ember canvas drew ${pagehideFrames} continuing frames`);
    if ((await probePage.locator('[data-ember-ready]').count()) !== 0) {
      fail('pagehide did not clear ember canvas readiness');
    }
    checks.push({
      route: '/',
      emberLifecycle: {
        visibleFrames,
        offscreenFrames,
        resumedFrames,
        reducedMotionFrames,
        restoredFrames,
        pagehideFrames,
      },
    });
  } finally {
    await probePage.close();
  }
}

async function checkEmberParticlePresence(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const particlePage = await context.newPage();

  try {
    await particlePage.route('https://cloud.umami.is/**', (route) => route.fulfill({ status: 204, body: '' }));
    await particlePage.route('https://gateway.umami.is/**', (route) => route.fulfill({ status: 204, body: '' }));

    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await particlePage.setViewportSize(viewport);
      await particlePage.goto(`${base}/`, { waitUntil: 'load' });
      await waitForSettledPage(particlePage);
      await particlePage.waitForFunction(
        () => document.querySelector('[data-ember-canvas]')?.getAttribute('data-ember-ready') === 'true',
      );

      const metrics = await particlePage.locator('[data-ember-canvas]').evaluate((canvas) => {
        const context = canvas.getContext('2d');
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let alphaEnergy = 0;
        let vividPixels = 0;
        let maxAlpha = 0;

        for (let index = 3; index < pixels.length; index += 4) {
          const alpha = pixels[index];
          alphaEnergy += alpha;
          if (alpha >= 24) vividPixels += 1;
          maxAlpha = Math.max(maxAlpha, alpha);
        }

        return { alphaEnergy, vividPixels, maxAlpha };
      });

      if (metrics.alphaEnergy < 9000 || metrics.alphaEnergy > 18000) {
        fail(`${viewport.width}px ember particle alpha energy is ${metrics.alphaEnergy.toFixed(1)}`);
      }
      if (metrics.vividPixels < 120 || metrics.vividPixels > 300) {
        fail(`${viewport.width}px ember particle vivid pixel count is ${metrics.vividPixels}`);
      }
      if (metrics.maxAlpha < 145 || metrics.maxAlpha > 210) {
        fail(`${viewport.width}px ember particle max alpha is ${metrics.maxAlpha}`);
      }
      checks.push({ route: '/', viewport: `${viewport.width}x${viewport.height}`, emberParticles: metrics });
    }
  } finally {
    await context.close();
  }
}

async function checkEmberFrameBudget(browser) {
  const sampleCount = 120;
  const sample = async (reducedMotion) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion,
      serviceWorkers: 'block',
    });
    await context.addInitScript(() => {
      const originalClear = CanvasRenderingContext2D.prototype.clearRect;
      const originalRestore = CanvasRenderingContext2D.prototype.restore;
      window.__emberFrameBudgetProbe = { canvasFrames: 0, drawStartedAt: 0, drawDurations: [] };
      CanvasRenderingContext2D.prototype.clearRect = function (...args) {
        if (this.canvas?.matches?.('[data-ember-canvas]')) {
          window.__emberFrameBudgetProbe.canvasFrames += 1;
          window.__emberFrameBudgetProbe.drawStartedAt = performance.now();
        }
        return originalClear.apply(this, args);
      };
      CanvasRenderingContext2D.prototype.restore = function (...args) {
        const result = originalRestore.apply(this, args);
        if (this.canvas?.matches?.('[data-ember-canvas]') && window.__emberFrameBudgetProbe.drawStartedAt) {
          window.__emberFrameBudgetProbe.drawDurations.push(
            performance.now() - window.__emberFrameBudgetProbe.drawStartedAt,
          );
          window.__emberFrameBudgetProbe.drawStartedAt = 0;
        }
        return result;
      };
    });
    const samplePage = await context.newPage();

    try {
      await samplePage.route('https://cloud.umami.is/**', (route) => route.fulfill({ status: 204, body: '' }));
      await samplePage.route('https://gateway.umami.is/**', (route) => route.fulfill({ status: 204, body: '' }));
      await samplePage.goto(`${base}/`, { waitUntil: 'load' });
      await waitForSettledPage(samplePage);
      await samplePage.bringToFront();
      await samplePage.locator('[data-ember-ready]').waitFor();
      await samplePage.evaluate(() => document.fonts.ready);

      const sampleResult = await samplePage.evaluate(
        (targetCount) =>
          new Promise((resolve) => {
            const samples = [];
            let previous;
            let warmupFrames = 45;
            const record = (time) => {
              if (warmupFrames > 0) {
                warmupFrames -= 1;
                requestAnimationFrame(record);
                return;
              }
              if (previous === undefined) {
                window.__emberFrameBudgetProbe.canvasFrames = 0;
                window.__emberFrameBudgetProbe.drawDurations = [];
              }
              if (previous !== undefined) samples.push(time - previous);
              previous = time;
              if (samples.length >= targetCount) {
                resolve({
                  intervals: samples,
                  canvasFrames: window.__emberFrameBudgetProbe.canvasFrames,
                  drawDurations: window.__emberFrameBudgetProbe.drawDurations,
                });
              } else requestAnimationFrame(record);
            };
            requestAnimationFrame(record);
          }),
        sampleCount,
      );
      const sorted = [...sampleResult.intervals].sort((left, right) => left - right);
      const drawSorted = [...sampleResult.drawDurations].sort((left, right) => left - right);
      return {
        rafP50: sorted[Math.floor(sorted.length * 0.5)],
        rafP95: sorted[Math.floor(sorted.length * 0.95)],
        intervals: sampleResult.intervals,
        canvasFrames: sampleResult.canvasFrames,
        drawP50: drawSorted[Math.floor(drawSorted.length * 0.5)] ?? 0,
        drawP95: drawSorted[Math.floor(drawSorted.length * 0.95)] ?? 0,
      };
    } finally {
      await context.close();
    }
  };

  const staticFrames = await sample('reduce');
  const animatedFrames = await sample('no-preference');
  if (staticFrames.rafP50 > 20 || staticFrames.rafP95 > 20) {
    fail(
      `ember frame runner cannot validate 60fps (${staticFrames.rafP50.toFixed(1)}/${staticFrames.rafP95.toFixed(1)}ms)`,
    );
  }
  if (animatedFrames.canvasFrames < sampleCount * 0.9) {
    fail(`ember canvas rendered only ${animatedFrames.canvasFrames}/${sampleCount} sampled frames`);
  }
  if (animatedFrames.drawP50 > 1) {
    fail(`ember canvas draw p50 ${animatedFrames.drawP50.toFixed(2)}ms exceeds 1ms`);
  }
  if (animatedFrames.drawP95 > 2) {
    fail(`ember canvas draw p95 ${animatedFrames.drawP95.toFixed(2)}ms exceeds 2ms`);
  }
  // Headless Chromium software-composites the full CSS scene and may throttle rAF;
  // keep pacing as a diagnostic while gating the application-owned Canvas work.
  const pacingBudget = Math.max(20, staticFrames.rafP95 * 1.25);
  const missedVsyncRatio =
    animatedFrames.intervals.filter((interval) => interval > pacingBudget).length / animatedFrames.intervals.length;
  delete staticFrames.intervals;
  delete animatedFrames.intervals;
  checks.push({
    route: '/',
    emberFrameBudget: { staticFrames, animatedFrames, pacingBudget, missedVsyncRatio },
  });
}

async function checkFooterVariants(page) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const cases = [
    { route: '/', expected: 'contact' },
    { route: '/en/', expected: 'contact' },
    { route: '/silicon-ashes/writing/', expected: 'default' },
    { route: '/silicon-ashes/courses/ai-research-efficiency/', expected: 'default' },
  ];

  for (const { route, expected } of cases) {
    await page.goto(`${base}${route}`, { waitUntil: 'load' });
    await waitForSettledPage(page);
    const state = await page.evaluate(() => {
      const footer = document.querySelector('.sa-footer');
      const heading = document.querySelector('.contact-heading');
      return {
        className: footer?.className || '',
        height: footer?.getBoundingClientRect().height || 0,
        viewportHeight: innerHeight,
        headingVisible: !!heading && getComputedStyle(heading).display !== 'none',
        linkCount: footer?.querySelectorAll('a').length || 0,
      };
    });
    if (!state.className.split(/\s+/).includes(expected)) fail(`${route} footer must use the ${expected} variant`);
    if (expected === 'contact') {
      if (!state.headingVisible) fail(`${route} contact footer heading is not visible`);
      if (state.height < state.viewportHeight * 0.47) fail(`${route} contact footer is shorter than the contact stage`);
      if (state.linkCount < 5) fail(`${route} contact footer is missing public contact links`);
    } else {
      if (state.headingVisible) fail(`${route} default footer exposes the contact-stage heading`);
      if (state.height >= state.viewportHeight * 0.4)
        fail(`${route} default footer inherited the contact-stage height`);
    }
    checks.push({ route, footerVariant: expected });
  }
}

const child = startPreview();

try {
  await waitForPreview(child);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
  page.setDefaultTimeout(10000);
  await page.addInitScript(() => localStorage.setItem('resume-theme', 'dark'));
  await page.route('https://cloud.umami.is/**', (route) => route.fulfill({ status: 204, body: '' }));
  await page.route('https://gateway.umami.is/**', (route) => route.fulfill({ status: 204, body: '' }));
  await page.route('https://api.github.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
  page.on('console', (msg) => {
    if (msg.type() === 'error') fail(`console error on ${page.url()}: ${msg.text()}`);
  });
  page.on('pageerror', (error) => fail(`page error on ${page.url()}: ${error.message}`));

  for (const route of ['/ai-km', '/en/ai-km']) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${base}${route}`, { waitUntil: 'load' });
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await waitForSettledPage(page);
    const check = await page.evaluate(() => {
      const rootStyle = getComputedStyle(document.documentElement);
      const card = document.querySelector('.claim-card');
      const h1 = document.querySelector('h1');
      const linkHeights = [...document.querySelectorAll('.claim-links a')].map((a) =>
        Math.round(a.getBoundingClientRect().height),
      );
      const bodyText = document.body.innerText;
      return {
        route: location.pathname,
        theme: document.documentElement.getAttribute('data-theme'),
        h1: h1?.textContent?.trim() || '',
        h1Color: h1 ? getComputedStyle(h1).color : '',
        paper: rootStyle.getPropertyValue('--paper').trim(),
        cardBg: card ? getComputedStyle(card).backgroundColor : '',
        minLinkHeight: Math.min(...linkHeights),
        overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        skeletonVisible: !!document.querySelector('#skeleton'),
        forbiddenText: /\b(?:lorem ipsum|todo|debug|placeholder|undefined|null|NaN)\b/i.test(bodyText),
      };
    });
    if (check.theme !== 'dark') fail(`${route} did not keep dark theme`);
    if (!check.h1) fail(`${route} rendered without H1`);
    if (check.paper === '#ffffff' || check.cardBg === 'rgb(255, 255, 255)') fail(`${route} has light card background`);
    if (check.minLinkHeight < 36) fail(`${route} claim links are below 36px`);
    if (check.overflow) fail(`${route} has horizontal overflow`);
    if (check.skeletonVisible) fail(`${route} skeleton remained visible`);
    if (check.forbiddenText) fail(`${route} includes forbidden placeholder/debug text`);
    checks.push(check);
  }

  for (const route of ['/materials', '/en/materials', '/chem-ai-lab', '/en/chem-ai-lab', '/blog', '/en/blog']) {
    await checkDarkRoute(page, route);
  }

  await checkEmberAnimationHotPath(browser);
  await checkEmberParticlePresence(browser);
  await checkEmberFrameBudget(browser);
  await checkBrandHomeBounds(page);
  await checkFooterVariants(page);

  await page.screenshot({ path: path.join(screenshotDir, 'ai-km-dark-desktop.png'), fullPage: false });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/en/ai-km`, { waitUntil: 'load' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await waitForSettledPage(page);
  await page.locator('#menuToggle').click();
  const mobileMenuOpen = await page.locator('#navLinks').evaluate((el) => getComputedStyle(el).display === 'flex');
  if (!mobileMenuOpen) fail('/en/ai-km mobile menu did not open in dark mode');
  checks.push({ route: '/en/ai-km', viewport: '390x844', mobileMenuOpen });
  await page.screenshot({ path: path.join(screenshotDir, 'en-ai-km-dark-mobile-menu.png'), fullPage: false });

  await page.goto(`${base}/evidence`, { waitUntil: 'load' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await waitForSettledPage(page);
  await page.locator('a.cert-card').first().click();
  await page.waitForSelector('#lightbox[open]');
  await page.waitForFunction(
    () => {
      const lb = document.querySelector('#lightbox');
      const img = document.querySelector('#lb-img');
      return lb instanceof HTMLDialogElement && lb.open && !!img && img.complete && img.naturalWidth > 1;
    },
    { timeout: 10000 },
  );
  checks.push({ route: '/evidence', lightboxReady: true });
  await page.screenshot({ path: path.join(screenshotDir, 'evidence-dark-lightbox.png'), fullPage: false });

  await browser.close();
} finally {
  stopPreview(child);
}

const result = { failures, checks, screenshotDir };
if (failures.length) {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(result, null, 2));
