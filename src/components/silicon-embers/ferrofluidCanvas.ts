import { Mesh, Program, Renderer, Triangle } from 'ogl';

type FerrofluidFlowDirection = 'up' | 'down' | 'left' | 'right';
type RGB = [number, number, number];
type Vec2 = [number, number];
type Vec3 = [number, number, number];

interface FerrofluidConfig {
  colors: string[];
  speed: number;
  scale: number;
  turbulence: number;
  fluidity: number;
  rimWidth: number;
  sharpness: number;
  shimmer: number;
  glow: number;
  flowDirection: FerrofluidFlowDirection;
  opacity: number;
  mouseInteraction: boolean;
  mouseStrength: number;
  mouseRadius: number;
  mouseDampening: number;
  paused: boolean;
  dpr: number;
}

interface PreparedColors {
  arr: RGB[];
  count: number;
  avg: RGB;
}

interface FerrofluidRootElement extends HTMLDivElement {
  cleanupFerrofluid?: () => void;
}

const MAX_COLORS = 8;
const FALLBACK_COLOR = '#d79a52';
const FALLBACK_RGB: RGB = [0.843, 0.604, 0.322];
const DEFAULT_CONFIG: FerrofluidConfig = {
  colors: ['#d79a52', '#c9793f', '#9b5630', '#4f2c1d'],
  speed: 0.58,
  scale: 1.28,
  turbulence: 1.12,
  fluidity: 0.08,
  rimWidth: 0.12,
  sharpness: 3.2,
  shimmer: 0.72,
  glow: 1.56,
  flowDirection: 'down',
  opacity: 0.24,
  mouseInteraction: true,
  mouseStrength: 0.38,
  mouseRadius: 0.28,
  mouseDampening: 0.24,
  paused: false,
  dpr: 1,
};

const vertex = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `
precision highp float;

uniform vec3  iResolution;
uniform vec2  iMouse;
uniform float iTime;

uniform vec3  uColor0;
uniform vec3  uColor1;
uniform vec3  uColor2;
uniform vec3  uColor3;
uniform vec3  uColor4;
uniform vec3  uColor5;
uniform vec3  uColor6;
uniform vec3  uColor7;
uniform int   uColorCount;

uniform vec3  uMouseColor;
uniform vec2  uFlow;
uniform float uSpeed;
uniform float uScale;
uniform float uTurbulence;
uniform float uFluidity;
uniform float uRimWidth;
uniform float uSharpness;
uniform float uShimmer;
uniform float uGlow;
uniform float uOpacity;
uniform float uMouseEnabled;
uniform float uMouseStrength;
uniform float uMouseRadius;

varying vec2 vUv;

#define PI 3.14159265

vec3 palette(float h) {
  int count = uColorCount;
  if (count < 1) count = 1;
  int idx = int(floor(clamp(h, 0.0, 0.999999) * float(count)));
  if (idx <= 0) return uColor0;
  if (idx == 1) return uColor1;
  if (idx == 2) return uColor2;
  if (idx == 3) return uColor3;
  if (idx == 4) return uColor4;
  if (idx == 5) return uColor5;
  if (idx == 6) return uColor6;
  return uColor7;
}

float hash(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float smin(float a, float b, float k) {
  float r = exp2(-a / k) + exp2(-b / k);
  return -k * log2(r);
}

float sinlerp(float a, float b, float w) {
  return mix(a, b, (sin(w * PI - PI / 2.0) + 1.0) / 2.0);
}

float vn(vec2 p, float s, float seed) {
  vec2 cellp = floor(p / s);
  vec2 relp = mod(p, s);
  float g1 = hash(vec3(cellp, seed));
  float g2 = hash(vec3(cellp.x + 1.0, cellp.y, seed));
  float g3 = hash(vec3(cellp.x + 1.0, cellp.y + 1.0, seed));
  float g4 = hash(vec3(cellp.x, cellp.y + 1.0, seed));
  float bx = sinlerp(g1, g2, relp.x / s);
  float tx = sinlerp(g4, g3, relp.x / s);
  return sinlerp(bx, tx, relp.y / s);
}

float dbn(vec2 p, float s, float seed) {
  float o = s / 2.0;
  float n0 = vn(p, s, seed);
  float n1 = vn(p + vec2(o, o), s, seed + 0.1);
  float n2 = vn(p + vec2(-o, o), s, seed + 0.2);
  float n3 = vn(p + vec2(o, -o), s, seed + 0.3);
  float n4 = vn(p + vec2(-o, -o), s, seed + 0.4);
  return (2.0 * n0 + 1.5 * n1 + 1.25 * n2 + 1.125 * n3 + n4) / 7.0;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  float ref = 700.0 / max(uScale, 0.05);
  vec2 p = fragCoord / iResolution.y * ref;
  float spd = 200.0 * uSpeed;
  float t = iTime;

  vec2 dir = uFlow;
  vec2 perp = vec2(-dir.y, dir.x);
  float waveShear = sin(dot(p, dir) * 0.046 + dot(p, perp) * 0.017 + t * spd * 1.55);
  p += perp * waveShear * 9.0 * uTurbulence;

  float distort1 = vn(p + perp * (t * spd), 60.0, 10.0) * 50.0 * uTurbulence;
  float distort2 = vn(p - perp * (t * spd), 120.0, 15.0) * 100.0 * uTurbulence;

  float peaks = dbn(p + distort1 + dir * (t * spd * 0.5), 40.0, 1.0);
  float peaks2 = dbn(p + distort2 - dir * (t * spd * 0.5), 40.0, 0.0);

  float mapeaks = smin(peaks, peaks2, max(uFluidity, 0.001));

  float mGlow = 0.0;
  if (uMouseEnabled > 0.5) {
    vec2 mp = iMouse / iResolution.y * ref;
    float md = length(p - mp) / ref;
    float rr = max(uMouseRadius, 0.02);
    mGlow = exp(-md * md / (rr * rr)) * uMouseStrength;
  }

  float band = (uRimWidth - abs((mapeaks - 0.4) * 2.0)) * 5.0;
  float ltn = clamp(band - vn(p + dir * (t * spd * 0.5), 60.0, 12.0) * uShimmer, 0.0, 1.0);
  float stream = dot(p, dir) * 0.052 + dot(p, perp) * 0.018;
  float counterStream = dot(p, dir) * 0.031 - dot(p, perp) * 0.026;
  float waveA = 0.5 + 0.5 * sin(stream - t * spd * 1.8);
  float waveB = 0.5 + 0.5 * sin(counterStream + t * spd * 1.15);
  float flowPulse = smoothstep(0.48, 0.98, max(waveA, waveB));
  ltn = pow(ltn, uSharpness) * uGlow;
  ltn *= mix(0.62, 1.78, flowPulse);

  ltn *= clamp(1.0 - mGlow, 0.0, 1.0);

  float h = clamp(0.5 + (peaks - peaks2) * 0.8 + (flowPulse - 0.5) * 0.12, 0.0, 1.0);
  vec3 col = palette(h);

  vec3 outc = col * ltn;
  float signal = clamp(max(outc.r, max(outc.g, outc.b)), 0.0, 1.0);
  float veil = smoothstep(0.18, 0.78, signal);
  fragColor = vec4(outc * veil, veil * signal * uOpacity);
}

void main() {
  vec4 color;
  mainImage(color, vUv * iResolution.xy);
  gl_FragColor = color;
}
`;

const finiteOr = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const hexToRgb = (hex: string): RGB => {
  const trimmed = hex.trim().replace('#', '');
  const value =
    trimmed.length === 3
      ? trimmed
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : trimmed.padEnd(6, '0').slice(0, 6);

  if (!/^[0-9a-fA-F]{6}$/.test(value)) return FALLBACK_RGB;

  return [
    Number.parseInt(value.slice(0, 2), 16) / 255,
    Number.parseInt(value.slice(2, 4), 16) / 255,
    Number.parseInt(value.slice(4, 6), 16) / 255,
  ];
};

const colorAt = (colors: RGB[], index: number): RGB => colors[index] ?? colors[0] ?? FALLBACK_RGB;

const prepColors = (input: string[]): PreparedColors => {
  const source = (input.length > 0 ? input : DEFAULT_CONFIG.colors).slice(0, MAX_COLORS);
  const base = source.length > 0 ? source : [FALLBACK_COLOR];
  const arr: RGB[] = [];

  for (let index = 0; index < MAX_COLORS; index += 1) {
    arr.push(hexToRgb(base[Math.min(index, base.length - 1)] ?? FALLBACK_COLOR));
  }

  const count = Math.max(1, base.length);
  const avg: RGB = [0, 0, 0];
  for (let index = 0; index < count; index += 1) {
    const color = colorAt(arr, index);
    avg[0] += color[0];
    avg[1] += color[1];
    avg[2] += color[2];
  }
  avg[0] /= count;
  avg[1] /= count;
  avg[2] /= count;

  return { arr, count, avg };
};

const flowVec = (direction: FerrofluidFlowDirection): Vec2 => {
  switch (direction) {
    case 'up':
      return [0, 1];
    case 'left':
      return [-1, 0];
    case 'right':
      return [1, 0];
    case 'down':
    default:
      return [0, -1];
  }
};

const parseConfig = (root: HTMLElement): FerrofluidConfig => {
  const raw = root.dataset.ferrofluidConfig;
  if (!raw) return DEFAULT_CONFIG;

  try {
    const parsed = JSON.parse(raw) as Partial<FerrofluidConfig>;
    const colors = Array.isArray(parsed.colors)
      ? parsed.colors.filter((color): color is string => typeof color === 'string')
      : DEFAULT_CONFIG.colors;

    return {
      colors,
      speed: finiteOr(parsed.speed, DEFAULT_CONFIG.speed),
      scale: finiteOr(parsed.scale, DEFAULT_CONFIG.scale),
      turbulence: finiteOr(parsed.turbulence, DEFAULT_CONFIG.turbulence),
      fluidity: finiteOr(parsed.fluidity, DEFAULT_CONFIG.fluidity),
      rimWidth: finiteOr(parsed.rimWidth, DEFAULT_CONFIG.rimWidth),
      sharpness: finiteOr(parsed.sharpness, DEFAULT_CONFIG.sharpness),
      shimmer: finiteOr(parsed.shimmer, DEFAULT_CONFIG.shimmer),
      glow: finiteOr(parsed.glow, DEFAULT_CONFIG.glow),
      flowDirection: parsed.flowDirection ?? DEFAULT_CONFIG.flowDirection,
      opacity: finiteOr(parsed.opacity, DEFAULT_CONFIG.opacity),
      mouseInteraction: parsed.mouseInteraction ?? DEFAULT_CONFIG.mouseInteraction,
      mouseStrength: finiteOr(parsed.mouseStrength, DEFAULT_CONFIG.mouseStrength),
      mouseRadius: finiteOr(parsed.mouseRadius, DEFAULT_CONFIG.mouseRadius),
      mouseDampening: finiteOr(parsed.mouseDampening, DEFAULT_CONFIG.mouseDampening),
      paused: parsed.paused ?? DEFAULT_CONFIG.paused,
      dpr: finiteOr(parsed.dpr, DEFAULT_CONFIG.dpr),
    };
  } catch {
    return DEFAULT_CONFIG;
  }
};

const mountFerrofluid = (root: FerrofluidRootElement) => {
  if (root.dataset.ferrofluidMounted === 'true') return;
  root.dataset.ferrofluidMounted = 'true';

  const config = parseConfig(root);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const { arr, count, avg } = prepColors(config.colors);
  let frame = 0;
  let destroyed = false;
  let isIntersecting = true;
  let lastTime = 0;
  let hasPointer = false;
  let mouseTarget: Vec2 = [0, 0];

  let renderer: Renderer | undefined;
  let program: Program | undefined;
  let geometry: Triangle | undefined;
  let mesh: Mesh | undefined;
  let canvas: HTMLCanvasElement | undefined;

  const uniforms = {
    iResolution: { value: [1, 1, 1] as Vec3 },
    iMouse: { value: [0, 0] as Vec2 },
    iTime: { value: 0 },
    uColor0: { value: colorAt(arr, 0) },
    uColor1: { value: colorAt(arr, 1) },
    uColor2: { value: colorAt(arr, 2) },
    uColor3: { value: colorAt(arr, 3) },
    uColor4: { value: colorAt(arr, 4) },
    uColor5: { value: colorAt(arr, 5) },
    uColor6: { value: colorAt(arr, 6) },
    uColor7: { value: colorAt(arr, 7) },
    uColorCount: { value: count },
    uMouseColor: { value: avg },
    uFlow: { value: flowVec(config.flowDirection) },
    uSpeed: { value: Math.max(0, config.speed) },
    uScale: { value: Math.max(0.05, config.scale) },
    uTurbulence: { value: Math.max(0, config.turbulence) },
    uFluidity: { value: Math.max(0.001, config.fluidity) },
    uRimWidth: { value: Math.max(0, config.rimWidth) },
    uSharpness: { value: Math.max(0.001, config.sharpness) },
    uShimmer: { value: Math.max(0, config.shimmer) },
    uGlow: { value: Math.max(0, config.glow) },
    uOpacity: { value: Math.min(1, Math.max(0, config.opacity)) },
    uMouseEnabled: { value: config.mouseInteraction ? 1 : 0 },
    uMouseStrength: { value: Math.max(0, config.mouseStrength) },
    uMouseRadius: { value: Math.max(0.02, config.mouseRadius) },
  };

  try {
    renderer = new Renderer({
      dpr: Math.min(1.5, Math.max(0.5, config.dpr || window.devicePixelRatio || 1)),
      alpha: true,
      depth: false,
      stencil: false,
      antialias: true,
      premultipliedAlpha: false,
    });
    const gl = renderer.gl;
    canvas = gl.canvas;
    gl.clearColor(0, 0, 0, 0);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.pointerEvents = 'none';
    root.appendChild(canvas);

    program = new Program(gl, {
      vertex,
      fragment,
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    geometry = new Triangle(gl);
    mesh = new Mesh(gl, { geometry, program });
  } catch {
    root.dataset.ferrofluidError = 'true';
    root.removeAttribute('data-ferrofluid-mounted');
    return;
  }

  const setMouseCenter = () => {
    if (!renderer) return;
    const x = renderer.gl.drawingBufferWidth / 2;
    const y = renderer.gl.drawingBufferHeight / 2;
    mouseTarget = [x, y];
    uniforms.iMouse.value = [x, y];
  };

  const resize = () => {
    if (!renderer) return;
    const rect = root.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    renderer.setSize(width, height);
    uniforms.iResolution.value = [renderer.gl.drawingBufferWidth, renderer.gl.drawingBufferHeight, 1];
    if (!hasPointer) setMouseCenter();
  };

  const shouldAnimate = () => !config.paused && !reducedMotion.matches && !document.hidden && isIntersecting;

  const renderFrame = (time: number) => {
    if (!renderer || !mesh) return;

    uniforms.iTime.value = reducedMotion.matches ? 0 : time * 0.001;

    if (config.mouseDampening > 0) {
      const delta = lastTime > 0 ? (time - lastTime) / 1000 : 1 / 60;
      const factor = Math.min(1, 1 - Math.exp(-delta / Math.max(0.0001, config.mouseDampening)));
      uniforms.iMouse.value[0] += (mouseTarget[0] - uniforms.iMouse.value[0]) * factor;
      uniforms.iMouse.value[1] += (mouseTarget[1] - uniforms.iMouse.value[1]) * factor;
    } else {
      uniforms.iMouse.value = [...mouseTarget];
    }
    lastTime = time;

    renderer.render({ scene: mesh });
  };

  const syncLoop = () => {
    window.cancelAnimationFrame(frame);
    frame = 0;
    if (destroyed) return;

    if (!shouldAnimate()) {
      renderFrame(performance.now());
      return;
    }

    lastTime = performance.now();
    const tick = (time: number) => {
      frame = 0;
      if (destroyed) return;
      renderFrame(time);
      if (shouldAnimate()) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!canvas || !renderer || !config.mouseInteraction) return;
    const rect = canvas.getBoundingClientRect();
    const scale = renderer.dpr || 1;
    hasPointer = true;
    mouseTarget = [(event.clientX - rect.left) * scale, (rect.height - (event.clientY - rect.top)) * scale];
    if (config.mouseDampening <= 0) uniforms.iMouse.value = [...mouseTarget];
  };

  const onVisibilityChange = () => syncLoop();
  const resizeObserver = new ResizeObserver(() => {
    resize();
    syncLoop();
  });
  const intersectionObserver =
    'IntersectionObserver' in window
      ? new IntersectionObserver(([entry]) => {
          isIntersecting = entry?.isIntersecting ?? false;
          syncLoop();
        })
      : undefined;

  const cleanup = () => {
    if (destroyed) return;
    destroyed = true;
    window.cancelAnimationFrame(frame);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('resize', syncLoop);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    reducedMotion.removeEventListener('change', syncLoop);
    resizeObserver.disconnect();
    intersectionObserver?.disconnect();
    program?.remove();
    geometry?.remove();
    canvas?.remove();
    root.removeAttribute('data-ferrofluid-ready');
    root.removeAttribute('data-ferrofluid-mounted');
    root.cleanupFerrofluid = undefined;
  };

  root.cleanupFerrofluid = cleanup;
  resizeObserver.observe(root);
  intersectionObserver?.observe(root);
  if (config.mouseInteraction) window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('resize', syncLoop, { passive: true });
  document.addEventListener('visibilitychange', onVisibilityChange);
  reducedMotion.addEventListener('change', syncLoop);
  document.addEventListener('astro:before-swap', cleanup, { once: true });
  window.addEventListener('pagehide', cleanup, { once: true });

  resize();
  root.dataset.ferrofluidReady = 'true';
  syncLoop();
};

const mountAllFerrofluid = () => {
  document.querySelectorAll<FerrofluidRootElement>('[data-ferrofluid-root]').forEach(mountFerrofluid);
};

mountAllFerrofluid();
document.addEventListener('astro:page-load', mountAllFerrofluid);
