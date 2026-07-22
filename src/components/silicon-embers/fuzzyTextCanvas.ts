type FuzzyDirection = 'horizontal' | 'vertical' | 'both';

interface FuzzyTextConfig {
  text: string;
  fontSize: string;
  fontWeight: number | string;
  fontFamily: string;
  color: string;
  enableHover: boolean;
  baseIntensity: number;
  hoverIntensity: number;
  fuzzRange: number;
  fps: number;
  direction: FuzzyDirection;
  transitionDuration: number;
  clickEffect: boolean;
  glitchMode: boolean;
  glitchInterval: number;
  glitchDuration: number;
  gradient: string[] | null;
  letterSpacing: number;
}

interface FuzzyCanvasElement extends HTMLCanvasElement {
  cleanupFuzzyText?: () => void;
}

const DEFAULT_CONFIG: FuzzyTextConfig = {
  text: '',
  fontSize: 'clamp(2rem, 10vw, 10rem)',
  fontWeight: 900,
  fontFamily: 'inherit',
  color: '#fff',
  enableHover: true,
  baseIntensity: 0.18,
  hoverIntensity: 0.5,
  fuzzRange: 30,
  fps: 60,
  direction: 'horizontal',
  transitionDuration: 0,
  clickEffect: false,
  glitchMode: false,
  glitchInterval: 2000,
  glitchDuration: 200,
  gradient: null,
  letterSpacing: 0,
};

const clampPositive = (value: number, fallback: number) => (Number.isFinite(value) && value > 0 ? value : fallback);

const parseConfig = (canvas: HTMLCanvasElement): FuzzyTextConfig => {
  const raw = canvas.dataset.fuzzyConfig;
  if (!raw) return DEFAULT_CONFIG;

  try {
    const parsed = JSON.parse(raw) as Partial<FuzzyTextConfig>;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CONFIG;
  }
};

const resolveCssToken = (value: string, element: Element) => {
  const trimmed = value.trim();
  const variable = trimmed.match(/^var\((--[a-zA-Z0-9-_]+)/)?.[1];
  if (!variable) return trimmed;

  return getComputedStyle(element).getPropertyValue(variable).trim() || trimmed;
};

const resolveCanvasColor = (value: string, element: Element) => {
  const resolved = resolveCssToken(value, element);
  if (resolved === 'currentColor') return getComputedStyle(element).color;
  return resolved;
};

const getFontFamily = (canvas: HTMLCanvasElement, config: FuzzyTextConfig) => {
  if (config.fontFamily === 'inherit' || config.fontFamily.includes('var(')) {
    return getComputedStyle(canvas).fontFamily || 'sans-serif';
  }

  return config.fontFamily;
};

const getNumericFontSize = (canvas: HTMLCanvasElement, fontSize: string) => {
  const computedSize = getComputedStyle(canvas).fontSize;
  const parsedComputed = Number.parseFloat(computedSize);
  if (Number.isFinite(parsedComputed) && parsedComputed > 0) return parsedComputed;

  const temp = document.createElement('span');
  temp.style.fontSize = fontSize;
  temp.style.position = 'absolute';
  temp.style.visibility = 'hidden';
  document.body.appendChild(temp);
  const measured = Number.parseFloat(getComputedStyle(temp).fontSize);
  document.body.removeChild(temp);
  return Number.isFinite(measured) && measured > 0 ? measured : 16;
};

const measureTextWidth = (context: CanvasRenderingContext2D, text: string, letterSpacing: number) => {
  if (letterSpacing === 0) return context.measureText(text).width;

  let totalWidth = 0;
  for (const char of text) {
    totalWidth += context.measureText(char).width + letterSpacing;
  }

  return Math.max(0, totalWidth - letterSpacing);
};

const drawText = (
  context: CanvasRenderingContext2D,
  text: string,
  xOffset: number,
  baseline: number,
  actualLeft: number,
  letterSpacing: number,
) => {
  if (letterSpacing === 0) {
    context.fillText(text, xOffset - actualLeft, baseline);
    return;
  }

  let xPosition = xOffset;
  for (const char of text) {
    context.fillText(char, xPosition, baseline);
    xPosition += context.measureText(char).width + letterSpacing;
  }
};

const setupCanvas = (canvas: FuzzyCanvasElement, config: FuzzyTextConfig) => {
  const root = canvas.closest<HTMLElement>('[data-fuzzy-root]');
  const context = canvas.getContext('2d');
  if (!root || !context || !config.text) return () => undefined;

  let animationFrame = 0;
  let glitchTimeout: ReturnType<typeof setTimeout> | undefined;
  let glitchEndTimeout: ReturnType<typeof setTimeout> | undefined;
  let clickTimeout: ReturnType<typeof setTimeout> | undefined;
  let isCancelled = false;
  let detachEvents = () => undefined;

  const init = async () => {
    const computedFontFamily = getFontFamily(canvas, config);
    const numericFontSize = getNumericFontSize(canvas, config.fontSize);
    const resolvedFontSize = `${numericFontSize}px`;
    const fontString = `${config.fontWeight} ${resolvedFontSize} ${computedFontFamily}`;
    const fonts = 'fonts' in document ? document.fonts : undefined;

    if (fonts) {
      try {
        await fonts.load(fontString);
      } catch {
        await fonts.ready;
      }
    }
    if (isCancelled) return;

    const offscreen = document.createElement('canvas');
    const offscreenContext = offscreen.getContext('2d');
    if (!offscreenContext) return;

    offscreenContext.font = fontString;
    offscreenContext.textBaseline = 'alphabetic';

    const text = config.text;
    const totalWidth = measureTextWidth(offscreenContext, text, config.letterSpacing);
    const metrics = offscreenContext.measureText(text);
    const actualLeft = metrics.actualBoundingBoxLeft ?? 0;
    const actualRight = config.letterSpacing !== 0 ? totalWidth : (metrics.actualBoundingBoxRight ?? metrics.width);
    const actualAscent = metrics.actualBoundingBoxAscent ?? numericFontSize;
    const actualDescent = metrics.actualBoundingBoxDescent ?? numericFontSize * 0.2;
    const textBoundingWidth = Math.ceil(config.letterSpacing !== 0 ? totalWidth : actualLeft + actualRight);
    const tightHeight = Math.ceil(actualAscent + actualDescent);
    const extraWidthBuffer = 10;
    const offscreenWidth = Math.ceil(textBoundingWidth + extraWidthBuffer);
    const xOffset = extraWidthBuffer / 2;

    offscreen.width = offscreenWidth;
    offscreen.height = tightHeight;
    offscreenContext.font = fontString;
    offscreenContext.textBaseline = 'alphabetic';

    const gradientColors = Array.isArray(config.gradient)
      ? config.gradient.filter((item): item is string => typeof item === 'string')
      : [];
    if (gradientColors.length >= 2) {
      const gradient = offscreenContext.createLinearGradient(0, 0, offscreenWidth, 0);
      gradientColors.forEach((color, index) => {
        gradient.addColorStop(index / (gradientColors.length - 1), resolveCanvasColor(color, canvas));
      });
      offscreenContext.fillStyle = gradient;
    } else {
      offscreenContext.fillStyle = resolveCanvasColor(config.color, canvas);
    }

    drawText(offscreenContext, text, xOffset, actualAscent, actualLeft, config.letterSpacing);

    const fuzzRange = Math.max(0, config.fuzzRange);
    const horizontalMargin = fuzzRange + 20;
    const verticalMargin = fuzzRange + 10;
    canvas.width = offscreenWidth + horizontalMargin * 2;
    canvas.height = tightHeight + verticalMargin * 2;
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
    context.setTransform(1, 0, 0, 1, horizontalMargin, verticalMargin);

    const interactiveLeft = horizontalMargin + xOffset;
    const interactiveTop = verticalMargin;
    const interactiveRight = interactiveLeft + textBoundingWidth;
    const interactiveBottom = interactiveTop + tightHeight;

    let isHovering = false;
    let isClicking = false;
    let isGlitching = false;
    let currentIntensity = config.baseIntensity;
    let targetIntensity = config.baseIntensity;
    let lastFrameTime = 0;
    const frameDuration = 1000 / clampPositive(config.fps, DEFAULT_CONFIG.fps);

    const isInsideTextArea = (x: number, y: number) =>
      x >= interactiveLeft && x <= interactiveRight && y >= interactiveTop && y <= interactiveBottom;

    const clearStage = () => {
      context.clearRect(
        -fuzzRange - 20,
        -fuzzRange - 10,
        offscreenWidth + 2 * (fuzzRange + 20),
        tightHeight + 2 * (fuzzRange + 10),
      );
    };

    const startGlitchLoop = () => {
      if (!config.glitchMode || isCancelled) return;
      glitchTimeout = window.setTimeout(
        () => {
          if (isCancelled) return;
          isGlitching = true;
          glitchEndTimeout = window.setTimeout(
            () => {
              isGlitching = false;
              startGlitchLoop();
            },
            Math.max(0, config.glitchDuration),
          );
        },
        Math.max(0, config.glitchInterval),
      );
    };

    const run = (timestamp: number) => {
      if (isCancelled) return;

      if (timestamp - lastFrameTime < frameDuration) {
        animationFrame = window.requestAnimationFrame(run);
        return;
      }
      lastFrameTime = timestamp;
      clearStage();

      if (isClicking || isGlitching) {
        targetIntensity = 1;
      } else if (isHovering) {
        targetIntensity = config.hoverIntensity;
      } else {
        targetIntensity = config.baseIntensity;
      }

      if (config.transitionDuration > 0) {
        const step = 1 / Math.max(1, config.transitionDuration);
        if (currentIntensity < targetIntensity) {
          currentIntensity = Math.min(currentIntensity + step, targetIntensity);
        } else if (currentIntensity > targetIntensity) {
          currentIntensity = Math.max(currentIntensity - step, targetIntensity);
        }
      } else {
        currentIntensity = targetIntensity;
      }

      if (config.direction === 'horizontal') {
        for (let y = 0; y < tightHeight; y += 1) {
          const dx = Math.floor(currentIntensity * (Math.random() - 0.5) * fuzzRange);
          context.drawImage(offscreen, 0, y, offscreenWidth, 1, dx, y, offscreenWidth, 1);
        }
      } else if (config.direction === 'vertical') {
        for (let x = 0; x < offscreenWidth; x += 1) {
          const dy = Math.floor(currentIntensity * (Math.random() - 0.5) * fuzzRange);
          context.drawImage(offscreen, x, 0, 1, tightHeight, x, dy, 1, tightHeight);
        }
      } else {
        for (let y = 0; y < tightHeight; y += 1) {
          const dx = Math.floor(currentIntensity * (Math.random() - 0.5) * fuzzRange);
          context.drawImage(offscreen, 0, y, offscreenWidth, 1, dx, y, offscreenWidth, 1);
        }

        const sampleWidth = offscreenWidth + fuzzRange;
        const sampleHeight = tightHeight + fuzzRange;
        const tempData = context.getImageData(0, 0, sampleWidth, sampleHeight);
        clearStage();
        context.putImageData(tempData, 0, 0);
        for (let x = 0; x < sampleWidth; x += 1) {
          const dy = Math.floor(currentIntensity * (Math.random() - 0.5) * fuzzRange * 0.5);
          const columnData = context.getImageData(x, 0, 1, sampleHeight);
          context.clearRect(x, -fuzzRange, 1, tightHeight + 2 * fuzzRange);
          context.putImageData(columnData, x, dy);
        }
      }

      animationFrame = window.requestAnimationFrame(run);
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!config.enableHover) return;
      const rect = canvas.getBoundingClientRect();
      isHovering = isInsideTextArea(event.clientX - rect.left, event.clientY - rect.top);
    };

    const handleMouseLeave = () => {
      isHovering = false;
    };

    const handleClick = () => {
      if (!config.clickEffect) return;
      isClicking = true;
      window.clearTimeout(clickTimeout);
      clickTimeout = window.setTimeout(() => {
        isClicking = false;
      }, 150);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!config.enableHover) return;
      const touch = event.touches[0];
      if (!touch) return;
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      isHovering = isInsideTextArea(touch.clientX - rect.left, touch.clientY - rect.top);
    };

    const handleTouchEnd = () => {
      isHovering = false;
    };

    if (config.enableHover) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseleave', handleMouseLeave);
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd);
    }
    if (config.clickEffect) canvas.addEventListener('click', handleClick);
    if (config.glitchMode) startGlitchLoop();

    detachEvents = () => {
      if (config.enableHover) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
      }
      if (config.clickEffect) canvas.removeEventListener('click', handleClick);
    };

    root.dataset.fuzzyReady = 'true';
    animationFrame = window.requestAnimationFrame(run);
  };

  void init();

  return () => {
    isCancelled = true;
    root.removeAttribute('data-fuzzy-ready');
    window.cancelAnimationFrame(animationFrame);
    window.clearTimeout(glitchTimeout);
    window.clearTimeout(glitchEndTimeout);
    window.clearTimeout(clickTimeout);
    detachEvents();
  };
};

const mountFuzzyText = (canvas: FuzzyCanvasElement) => {
  if (canvas.dataset.fuzzyMounted === 'true') return;
  canvas.dataset.fuzzyMounted = 'true';

  const config = parseConfig(canvas);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let cleanupRuntime: (() => void) | undefined;
  let resizeFrame = 0;

  const runCleanup = () => {
    cleanupRuntime?.();
    cleanupRuntime = undefined;
  };

  const setup = () => {
    runCleanup();
    if (reducedMotion.matches) return;
    cleanupRuntime = setupCanvas(canvas, config);
  };

  const scheduleSetup = () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(setup);
  };

  const themeObserver = new MutationObserver(scheduleSetup);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
  reducedMotion.addEventListener('change', scheduleSetup);
  window.addEventListener('resize', scheduleSetup, { passive: true });

  const cleanup = () => {
    window.cancelAnimationFrame(resizeFrame);
    window.removeEventListener('resize', scheduleSetup);
    reducedMotion.removeEventListener('change', scheduleSetup);
    themeObserver.disconnect();
    runCleanup();
    canvas.cleanupFuzzyText = undefined;
    canvas.removeAttribute('data-fuzzy-mounted');
  };

  canvas.cleanupFuzzyText = cleanup;
  document.addEventListener('astro:before-swap', cleanup, { once: true });
  setup();
};

const mountAllFuzzyText = () => {
  document.querySelectorAll<FuzzyCanvasElement>('[data-fuzzy-text]').forEach(mountFuzzyText);
};

mountAllFuzzyText();
document.addEventListener('astro:page-load', mountAllFuzzyText);
