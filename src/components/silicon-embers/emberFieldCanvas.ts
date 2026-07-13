interface GravityField {
  x: number;
  y: number;
  innerRadius: number;
  outerRadius: number;
}

interface OrbitParticle {
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
const rand = (minimum: number, maximum: number) => minimum + Math.random() * (maximum - minimum);

const project = (field: GravityField, radius: number, angle: number) => {
  const rotation = -0.2;
  const planeX = Math.cos(angle) * radius;
  const planeY = Math.sin(angle) * radius * 0.38;
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);

  return {
    x: field.x + planeX * cosine - planeY * sine,
    y: field.y + planeX * sine + planeY * cosine,
  };
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
  let width = 0;
  let height = 0;
  let frame = 0;
  let lastTime = performance.now();
  let emissionCarry = 0;
  let isIntersecting = true;
  let destroyed = false;

  const field = (): GravityField => {
    const hostRect = host.getBoundingClientRect();
    const sceneRect = scene?.getBoundingClientRect();
    const size = sceneRect?.width ?? Math.min(width * 0.48, 680);

    return {
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
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const createParticle = (): OrbitParticle => {
    const gravity = field();
    const radius = rand(gravity.outerRadius * 0.55, gravity.outerRadius * 1.02);
    const angle = rand(0, TAU);
    const point = project(gravity, radius, angle);

    return {
      radius,
      spawnRadius: radius,
      angle,
      angularVelocity: rand(0.00013, 0.00034),
      radialVelocity: rand(0.004, 0.011),
      size: rand(0.45, 1.35),
      alpha: rand(0.22, 0.68),
      life: 0,
      maxLife: rand(13000, 24000),
      previousX: point.x,
      previousY: point.y,
      x: point.x,
      y: point.y,
    };
  };

  const emit = (count: number) => {
    for (let index = 0; index < count && particles.length < PARTICLE_LIMIT; index += 1) {
      particles.push(createParticle());
    }
  };

  const drawParticle = (particle: OrbitParticle, opacity: number, pull: number) => {
    const warm = particle.angle % 1.8 > 0.46;
    const trailAlpha = opacity * (warm ? 0.28 : 0.16);
    context.strokeStyle = warm ? `rgba(211, 125, 60, ${trailAlpha})` : `rgba(232, 215, 186, ${trailAlpha})`;
    context.lineWidth = Math.max(0.45, particle.size * (0.6 + pull * 0.45));
    context.beginPath();
    context.moveTo(particle.previousX, particle.previousY);
    context.lineTo(particle.x, particle.y);
    context.stroke();

    const radius = particle.size * (1 + pull * 0.65);
    context.fillStyle = warm ? `rgba(239, 169, 91, ${opacity})` : `rgba(239, 224, 197, ${opacity * 0.72})`;
    context.beginPath();
    context.arc(particle.x, particle.y, radius, 0, TAU);
    context.fill();
  };

  const draw = (time: number, delta: number, shouldEmit: boolean) => {
    const gravity = field();
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
      const point = project(gravity, particle.radius, particle.angle);
      particle.x = point.x;
      particle.y = point.y;

      const fadeIn = Math.min(1, particle.life / 800);
      const fadeOut = Math.min(1, (1 - progress) * 3.2);
      const inwardFade = Math.pow(remaining, 0.34);
      const flicker = 0.82 + Math.sin(time * 0.002 + particle.angle * 3) * 0.12;
      drawParticle(particle, particle.alpha * fadeIn * fadeOut * inwardFade * flicker, pull);
    }

    context.restore();
  };

  const renderStatic = () => {
    particles.length = 0;
    emit(28);
    const gravity = field();
    for (const particle of particles) {
      particle.radius = rand(gravity.innerRadius * 1.7, particle.spawnRadius);
      particle.angle += rand(0, TAU);
      particle.life = particle.maxLife * rand(0.16, 0.66);
      const point = project(gravity, particle.radius, particle.angle);
      particle.x = point.x;
      particle.y = point.y;
      particle.previousX = point.x - rand(-4, 4);
      particle.previousY = point.y - rand(-2, 2);
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

  const handleVisibilityChange = () => syncAnimation();
  const intersectionObserver =
    'IntersectionObserver' in window
      ? new IntersectionObserver(([entry]) => {
          isIntersecting = entry?.isIntersecting ?? false;
          syncAnimation();
        })
      : undefined;

  const cleanup = () => {
    if (destroyed) return;
    destroyed = true;
    window.cancelAnimationFrame(frame);
    window.removeEventListener('resize', resizeAndSync);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    reducedMotion.removeEventListener('change', syncAnimation);
    intersectionObserver?.disconnect();
    canvas.removeAttribute('data-ember-ready');
  };

  intersectionObserver?.observe(host);
  window.addEventListener('resize', resizeAndSync, { passive: true });
  document.addEventListener('visibilitychange', handleVisibilityChange);
  reducedMotion.addEventListener('change', syncAnimation);
  window.addEventListener('pagehide', cleanup, { once: true });
  document.addEventListener('astro:before-swap', cleanup, { once: true });
  resizeAndSync();
};

document.querySelectorAll('[data-ember-canvas]').forEach((canvas) => {
  if (canvas instanceof HTMLCanvasElement) mountEmberField(canvas);
});
