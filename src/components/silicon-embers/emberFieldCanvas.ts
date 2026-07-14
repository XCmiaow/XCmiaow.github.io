interface GravityField {
  x: number;
  y: number;
  innerRadius: number;
  outerRadius: number;
}

type ParticleBand = 'far' | 'mid' | 'near';
type RandomSource = () => number;
type NumberRange = readonly [number, number];

interface ParticleProfile {
  angularVelocity: NumberRange;
  radialVelocity: NumberRange;
  size: NumberRange;
  alpha: NumberRange;
}

interface OrbitParticle {
  band: ParticleBand;
  radius: number;
  spawnRadius: number;
  angle: number;
  angularVelocity: number;
  radialVelocity: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  previousX: number;
  previousY: number;
  x: number;
  y: number;
}

const TAU = Math.PI * 2;
const PARTICLE_LIMIT = 64;
const PARTICLE_GAIN = 1.2;
const GLOW_SIZE = 32;
const ORBIT_COSINE = Math.cos(-0.2);
const ORBIT_SINE = Math.sin(-0.2);
const PARTICLE_PROFILES: Record<ParticleBand, ParticleProfile> = {
  far: {
    angularVelocity: [0.00008, 0.00017],
    radialVelocity: [0.002, 0.006],
    size: [0.3, 0.72],
    alpha: [0.12, 0.32],
  },
  mid: {
    angularVelocity: [0.00013, 0.0003],
    radialVelocity: [0.004, 0.01],
    size: [0.48, 1.15],
    alpha: [0.2, 0.56],
  },
  near: {
    angularVelocity: [0.00018, 0.00038],
    radialVelocity: [0.006, 0.013],
    size: [0.82, 1.62],
    alpha: [0.3, 0.7],
  },
};
const rand = (minimum: number, maximum: number, random: RandomSource = Math.random) =>
  minimum + random() * (maximum - minimum);

const createSeededRandom =
  (seed: number): RandomSource =>
  () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

const bandFor = (value: number): ParticleBand => (value < 0.46 ? 'far' : value < 0.86 ? 'mid' : 'near');

const createGlowSprite = (core: string, edge: string) => {
  const sprite = document.createElement('canvas');
  sprite.width = GLOW_SIZE;
  sprite.height = GLOW_SIZE;
  const spriteContext = sprite.getContext('2d');
  if (!spriteContext) return sprite;

  const center = GLOW_SIZE / 2;
  const gradient = spriteContext.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, core);
  gradient.addColorStop(0.18, core);
  gradient.addColorStop(0.5, edge);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  spriteContext.fillStyle = gradient;
  spriteContext.fillRect(0, 0, GLOW_SIZE, GLOW_SIZE);
  return sprite;
};

const projectParticle = (particle: OrbitParticle, field: GravityField) => {
  const planeX = Math.cos(particle.angle) * particle.radius;
  const planeY = Math.sin(particle.angle) * particle.radius * 0.38;
  particle.x = field.x + planeX * ORBIT_COSINE - planeY * ORBIT_SINE;
  particle.y = field.y + planeX * ORBIT_SINE + planeY * ORBIT_COSINE;
};

const mountEmberField = (canvas: HTMLCanvasElement) => {
  if (canvas.dataset.emberReady === 'true') return;
  canvas.dataset.emberReady = 'true';

  const context = canvas.getContext('2d', { alpha: true });
  const host = canvas.parentElement;
  if (!context || !host) return;

  const scene = host.querySelector<HTMLElement>('.black-hole-scene');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const particles: OrbitParticle[] = [];
  const glowSprites = {
    warm: createGlowSprite('rgba(255, 220, 160, 0.34)', 'rgba(224, 139, 66, 0.1)'),
    cool: createGlowSprite('rgba(255, 244, 220, 0.28)', 'rgba(238, 219, 187, 0.08)'),
  };
  let width = 0;
  let height = 0;
  let frame = 0;
  let lastTime = performance.now();
  let emissionCarry = 0;
  let isIntersecting = true;
  let destroyed = false;
  let resizeFrame = 0;
  let gravityField: GravityField = {
    x: 0,
    y: 0,
    innerRadius: 22,
    outerRadius: 138,
  };

  const updateGravityField = (hostRect: DOMRect) => {
    const sceneRect = scene?.getBoundingClientRect();
    const size = sceneRect?.width ?? Math.min(width * 0.48, 680);

    gravityField = {
      x: sceneRect ? sceneRect.left - hostRect.left + sceneRect.width / 2 : width * 0.72,
      y: sceneRect ? sceneRect.top - hostRect.top + sceneRect.height / 2 : height * 0.5,
      innerRadius: Math.max(22, size * 0.15),
      outerRadius: Math.max(138, size * 0.68),
    };
  };

  const resize = () => {
    const rect = host.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    updateGravityField(rect);
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const createParticle = (random: RandomSource = Math.random): OrbitParticle => {
    const gravity = gravityField;
    const band = bandFor(random());
    const radius = rand(gravity.outerRadius * 0.55, gravity.outerRadius * 1.02, random);
    const angle = rand(0, TAU, random);
    const profile = PARTICLE_PROFILES[band];
    const particle: OrbitParticle = {
      band,
      radius,
      spawnRadius: radius,
      angle,
      angularVelocity: rand(profile.angularVelocity[0], profile.angularVelocity[1], random),
      radialVelocity: rand(profile.radialVelocity[0], profile.radialVelocity[1], random),
      size: rand(profile.size[0], profile.size[1], random),
      alpha: rand(profile.alpha[0], profile.alpha[1], random),
      life: 0,
      maxLife: rand(13000, 24000, random),
      previousX: 0,
      previousY: 0,
      x: 0,
      y: 0,
    };
    projectParticle(particle, gravity);
    particle.previousX = particle.x;
    particle.previousY = particle.y;
    return particle;
  };

  const emit = (count: number, random: RandomSource = Math.random) => {
    for (let index = 0; index < count && particles.length < PARTICLE_LIMIT; index += 1) {
      particles.push(createParticle(random));
    }
  };

  const drawParticle = (particle: OrbitParticle, opacity: number, pull: number) => {
    const warm = particle.angle % 1.8 > 0.46;
    const depth = particle.band === 'far' ? 0.7 : particle.band === 'near' ? 1.18 : 1;
    const trailAlpha = opacity * (warm ? 0.28 : 0.16) * depth;
    const trailColor = warm ? 'rgb(211, 125, 60)' : 'rgb(232, 215, 186)';
    const trailWidth = Math.max(0.4, particle.size * (0.58 + pull * 0.42));
    context.strokeStyle = trailColor;
    context.globalAlpha = trailAlpha * 0.42;
    context.lineWidth = trailWidth * 2.4;
    context.beginPath();
    context.moveTo(particle.previousX, particle.previousY);
    context.lineTo(particle.x, particle.y);
    context.stroke();

    context.globalAlpha = trailAlpha;
    context.lineWidth = trailWidth;
    context.beginPath();
    context.moveTo(particle.previousX, particle.previousY);
    context.lineTo(particle.x, particle.y);
    context.stroke();

    const radius = particle.size * (1 + pull * 0.65);
    const glowRadius = radius * (particle.band === 'near' ? 3.35 : particle.band === 'mid' ? 2.95 : 2.55);
    context.globalAlpha = opacity * depth * (warm ? 0.7 : 0.58);
    context.drawImage(
      warm ? glowSprites.warm : glowSprites.cool,
      particle.x - glowRadius,
      particle.y - glowRadius,
      glowRadius * 2,
      glowRadius * 2,
    );

    context.globalAlpha = opacity * (warm ? 1 : 0.72);
    context.fillStyle = warm ? 'rgb(239, 169, 91)' : 'rgb(239, 224, 197)';
    context.beginPath();
    context.arc(particle.x, particle.y, radius, 0, TAU);
    context.fill();
    context.globalAlpha = 1;
  };

  const draw = (time: number, delta: number, shouldEmit: boolean) => {
    const gravity = gravityField;
    context.clearRect(0, 0, width, height);
    context.save();
    context.globalCompositeOperation = 'lighter';
    context.lineCap = 'round';

    if (shouldEmit) {
      emissionCarry += delta * (width < 640 ? 0.0015 : 0.0024);
      const count = Math.min(2, Math.floor(emissionCarry));
      if (count > 0) {
        emissionCarry -= count;
        emit(count);
      }
    }

    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      if (!particle) continue;

      particle.life += delta;
      const range = Math.max(1, particle.spawnRadius - gravity.innerRadius);
      const remaining = Math.max(0, (particle.radius - gravity.innerRadius) / range);
      const pull = 1 - remaining;
      const progress = particle.life / particle.maxLife;

      if (progress >= 1 || particle.radius <= gravity.innerRadius * 1.05) {
        particles.splice(index, 1);
        continue;
      }

      particle.previousX = particle.x;
      particle.previousY = particle.y;
      particle.radius -= particle.radialVelocity * delta * (1 + pull * 1.4);
      particle.angle += particle.angularVelocity * delta * (1 + pull * 2.15);
      projectParticle(particle, gravity);

      const fadeIn = Math.min(1, particle.life / 800);
      const fadeOut = Math.min(1, (1 - progress) * 3.2);
      const inwardFade = Math.pow(remaining, 0.34);
      const flicker = 0.82 + Math.sin(time * 0.002 + particle.angle * 3) * 0.12;
      const opacity = Math.min(1, particle.alpha * fadeIn * fadeOut * inwardFade * flicker * PARTICLE_GAIN);
      drawParticle(particle, opacity, pull);
    }

    context.restore();
  };

  const renderStatic = () => {
    const random = createSeededRandom(240713);
    particles.length = 0;
    emit(28, random);
    const gravity = gravityField;
    for (const particle of particles) {
      particle.radius = rand(gravity.innerRadius * 1.7, particle.spawnRadius, random);
      particle.angle += rand(0, TAU, random);
      particle.life = particle.maxLife * rand(0.16, 0.66, random);
      projectParticle(particle, gravity);
      particle.previousX = particle.x - rand(-4, 4, random);
      particle.previousY = particle.y - rand(-2, 2, random);
    }
    draw(performance.now(), 0, false);
  };

  const tick = (time: number) => {
    if (destroyed || document.hidden || !isIntersecting || reducedMotion.matches) {
      frame = 0;
      return;
    }

    const delta = Math.min(40, time - lastTime);
    lastTime = time;
    draw(time, delta, true);
    frame = window.requestAnimationFrame(tick);
  };

  const syncAnimation = () => {
    window.cancelAnimationFrame(frame);
    frame = 0;
    if (destroyed) return;

    if (reducedMotion.matches) {
      renderStatic();
    } else if (!document.hidden && isIntersecting) {
      lastTime = performance.now();
      frame = window.requestAnimationFrame(tick);
    }
  };

  const resizeAndSync = () => {
    resize();
    particles.length = 0;
    emissionCarry = 0;
    emit(width < 640 ? 18 : 30);
    syncAnimation();
  };

  const scheduleResize = () => {
    if (destroyed || resizeFrame) return;
    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = 0;
      resizeAndSync();
    });
  };

  const handleVisibilityChange = () => syncAnimation();
  const intersectionObserver =
    'IntersectionObserver' in window
      ? new IntersectionObserver(([entry]) => {
          isIntersecting = entry?.isIntersecting ?? false;
          syncAnimation();
        })
      : undefined;
  const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(scheduleResize) : undefined;

  const cleanup = () => {
    if (destroyed) return;
    destroyed = true;
    window.cancelAnimationFrame(frame);
    window.cancelAnimationFrame(resizeFrame);
    window.removeEventListener('resize', scheduleResize);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    reducedMotion.removeEventListener('change', syncAnimation);
    intersectionObserver?.disconnect();
    resizeObserver?.disconnect();
    canvas.removeAttribute('data-ember-ready');
  };

  intersectionObserver?.observe(host);
  resizeObserver?.observe(host);
  window.addEventListener('resize', scheduleResize, { passive: true });
  document.addEventListener('visibilitychange', handleVisibilityChange);
  reducedMotion.addEventListener('change', syncAnimation);
  window.addEventListener('pagehide', cleanup, { once: true });
  document.addEventListener('astro:before-swap', cleanup, { once: true });
  resizeAndSync();
};

document.querySelectorAll('[data-ember-canvas]').forEach((canvas) => {
  if (canvas instanceof HTMLCanvasElement) mountEmberField(canvas);
});
