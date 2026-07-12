interface GravityField {
  x: number;
  y: number;
  eventRadius: number;
  outerRadius: number;
}

interface EmberParticle {
  type: 'ember' | 'ash';
  radius: number;
  spawnRadius: number;
  angle: number;
  angularVelocity: number;
  radialVelocity: number;
  size: number;
  life: number;
  maxLife: number;
  seed: number;
  x: number;
  y: number;
  previousX: number;
  previousY: number;
}

const TAU = Math.PI * 2;
const PARTICLE_LIMIT = 118;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

const cssMetric = (value: string, basis: number, fallback: number) => {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (trimmed.endsWith('%')) return (Number.parseFloat(trimmed) / 100) * basis;
  if (trimmed.endsWith('px')) return Number.parseFloat(trimmed);
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const projectParticle = (field: GravityField, radius: number, angle: number, seed: number) => {
  const orbitalTilt = field.outerRadius > 520 ? 0.48 : 0.58;
  return {
    x: field.x + Math.cos(angle) * radius,
    y: field.y + Math.sin(angle) * radius * orbitalTilt + Math.sin(angle * 2 + seed) * radius * 0.035,
  };
};

const mountEmberField = (canvas: HTMLCanvasElement) => {
  if (canvas.dataset.emberReady === 'true') return;
  canvas.dataset.emberReady = 'true';

  const context = canvas.getContext('2d', { alpha: true });
  const host = canvas.parentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!context || !host) return;
  const blackHoleScene = host.querySelector('.black-hole-scene');

  let width = 0;
  let height = 0;
  let frame = 0;
  let lastTime = performance.now();
  let emissionCarry = 0;
  const particles: EmberParticle[] = [];

  const gravityField = (): GravityField => {
    const shortSide = Math.min(width, height);
    const hostRect = host.getBoundingClientRect();
    const sceneRect = blackHoleScene?.getBoundingClientRect();
    const styles = window.getComputedStyle(host);
    const fallbackSize = Math.min(width * 0.42, 560);
    const holeX = sceneRect
      ? sceneRect.left - hostRect.left + sceneRect.width / 2
      : cssMetric(styles.getPropertyValue('--hole-x'), width, width * 0.72);
    const holeY = sceneRect
      ? sceneRect.top - hostRect.top + sceneRect.height / 2
      : cssMetric(styles.getPropertyValue('--hole-y'), height, height * 0.5);
    const holeSize = sceneRect?.width || cssMetric(styles.getPropertyValue('--hole-size'), width, fallbackSize);

    return {
      x: holeX,
      y: holeY,
      eventRadius: Math.max(24, Math.min(shortSide * 0.09, holeSize * 0.14)),
      outerRadius: Math.max(150, holeSize * (width < 620 ? 0.76 : 0.82)),
    };
  };

  const particlePosition = (particle: EmberParticle) =>
    projectParticle(gravityField(), particle.radius, particle.angle, particle.seed);

  const resize = () => {
    const rect = host.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const createParticle = (): EmberParticle => {
    const field = gravityField();
    const type = Math.random() < 0.82 ? 'ember' : 'ash';
    const radius = rand(field.outerRadius * 0.5, field.outerRadius);
    const angle = rand(-Math.PI * 0.34, Math.PI * 1.34);
    const seed = rand(0, 1000);
    const position = projectParticle(field, radius, angle, seed);
    const spinDirection = Math.random() < 0.16 ? -1 : 1;

    return {
      type,
      radius,
      spawnRadius: radius,
      angle,
      angularVelocity: rand(0.00018, 0.00042) * spinDirection,
      radialVelocity: type === 'ember' ? rand(0.0075, 0.017) : rand(0.005, 0.012),
      size: type === 'ember' ? rand(0.65, 1.9) : rand(6, 18),
      life: 0,
      maxLife: type === 'ember' ? rand(15000, 25000) : rand(17000, 29000),
      seed,
      x: position.x,
      y: position.y,
      previousX: position.x,
      previousY: position.y,
    };
  };

  const emit = (count: number) => {
    for (let i = 0; i < count && particles.length < PARTICLE_LIMIT; i += 1) {
      particles.push(createParticle());
    }
  };

  const emitQuietly = (delta: number) => {
    const particlesPerMs = width < 540 ? 0.0028 : 0.005;
    emissionCarry += delta * particlesPerMs;
    const count = Math.min(2, Math.floor(emissionCarry));
    if (count > 0) {
      emissionCarry -= count;
      emit(count);
    }
  };

  const drawWarpStrands = (field: GravityField, time: number) => {
    const span = field.outerRadius * 0.82;
    const core = field.eventRadius;
    const strands = [
      { y: -core * 1.24, side: -1, alpha: 0.12, width: 1.45, phase: 0.2, cool: 0.052 },
      { y: core * 0.88, side: 1, alpha: 0.14, width: 1.7, phase: 1.9, cool: 0.038 },
      { y: -core * 0.12, side: -1, alpha: 0.076, width: 1.1, phase: 3.3, cool: 0.06 },
    ];

    context.save();
    context.translate(field.x, field.y);
    context.rotate(-0.18);

    context.globalCompositeOperation = 'multiply';
    context.strokeStyle = 'rgba(0, 0, 0, 0.13)';
    context.lineWidth = core * 0.28;
    context.beginPath();
    context.moveTo(-span * 0.8, core * 0.38);
    context.bezierCurveTo(-span * 0.34, core * 0.54, -core * 0.9, core * 1.18, core * 0.08, core * 0.78);
    context.bezierCurveTo(core * 0.92, core * 0.45, span * 0.34, core * 0.36, span * 0.8, core * 0.5);
    context.stroke();

    context.globalCompositeOperation = 'screen';
    for (const strand of strands) {
      const pulse = 0.82 + Math.sin(time * 0.00032 + strand.phase) * 0.18;
      const y = strand.y + Math.sin(time * 0.00021 + strand.phase) * core * 0.12;
      const side = strand.side;
      const gradient = context.createLinearGradient(-span, 0, span, 0);

      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(0.18, `rgba(104, 132, 123, ${strand.cool * pulse})`);
      gradient.addColorStop(0.36, `rgba(199, 141, 76, ${strand.alpha * 0.6 * pulse})`);
      gradient.addColorStop(0.5, `rgba(246, 201, 126, ${strand.alpha * 0.88 * pulse})`);
      gradient.addColorStop(0.66, `rgba(23, 14, 9, ${strand.alpha * 0.5 * pulse})`);
      gradient.addColorStop(0.82, `rgba(92, 116, 108, ${strand.cool * 0.9 * pulse})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      context.strokeStyle = gradient;
      context.lineWidth = strand.width;
      context.shadowBlur = 16 + strand.width * 5;
      context.shadowColor = `rgba(212, 151, 86, ${strand.alpha * 0.58 * pulse})`;
      context.beginPath();
      context.moveTo(-span, y);
      context.bezierCurveTo(
        -span * 0.52,
        y + side * core * 0.24,
        -core * 2.08,
        side * core * 1.88,
        -core * 0.34,
        side * core * 1.46,
      );
      context.bezierCurveTo(
        core * 0.68,
        side * core * 0.52,
        span * 0.45,
        y - side * core * 0.16,
        span,
        y + side * core * 0.1,
      );
      context.stroke();
    }

    context.restore();
  };

  const drawGravityLens = (time: number) => {
    const field = gravityField();
    context.save();
    context.globalCompositeOperation = 'source-over';
    context.clearRect(0, 0, width, height);

    context.save();
    context.translate(field.x, field.y);
    context.rotate(-0.18 + Math.sin(time * 0.00018) * 0.025);
    context.scale(1.2, 0.46);
    const well = context.createRadialGradient(0, 0, field.eventRadius * 1.15, 0, 0, field.outerRadius * 0.54);
    well.addColorStop(0, 'rgba(0, 0, 0, 0.36)');
    well.addColorStop(0.34, 'rgba(0, 0, 0, 0.13)');
    well.addColorStop(0.58, 'rgba(132, 84, 43, 0.105)');
    well.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = well;
    context.beginPath();
    context.arc(0, 0, field.outerRadius * 0.54, 0, TAU);
    context.fill();
    context.restore();

    const pullGlow = context.createRadialGradient(field.x, field.y, 0, field.x, field.y, field.outerRadius * 0.62);
    pullGlow.addColorStop(0, 'rgba(0, 0, 0, 0)');
    pullGlow.addColorStop(0.2, 'rgba(0, 0, 0, 0.09)');
    pullGlow.addColorStop(0.42, 'rgba(126, 79, 40, 0.12)');
    pullGlow.addColorStop(0.72, 'rgba(37, 26, 18, 0.062)');
    pullGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = pullGlow;
    context.fillRect(0, 0, width, height);

    drawWarpStrands(field, time);

    context.lineWidth = 1;
    for (let i = 0; i < 2; i += 1) {
      const radius = field.eventRadius * (2.35 + i * 2.1);
      const alpha = 0.058 - i * 0.014;
      context.strokeStyle = `rgba(176, 142, 94, ${alpha})`;
      context.beginPath();
      context.ellipse(
        field.x,
        field.y,
        radius * (1 + i * 0.12),
        radius * 0.38,
        -0.18 + Math.sin(time * 0.00022 + i) * 0.04,
        0,
        TAU,
      );
      context.stroke();
    }

    context.save();
    context.translate(field.x, field.y);
    context.rotate(-0.19);
    context.scale(1.72, 0.5);
    const foregroundRim = context.createLinearGradient(-field.eventRadius * 3, 0, field.eventRadius * 3, 0);
    foregroundRim.addColorStop(0, 'rgba(0, 0, 0, 0)');
    foregroundRim.addColorStop(0.18, 'rgba(116, 79, 44, 0.12)');
    foregroundRim.addColorStop(0.5, 'rgba(224, 169, 98, 0.17)');
    foregroundRim.addColorStop(0.84, 'rgba(18, 10, 6, 0.08)');
    foregroundRim.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.strokeStyle = foregroundRim;
    context.lineWidth = 1.9;
    context.beginPath();
    context.arc(0, 0, field.eventRadius * 2.25, 0.06 * Math.PI, 0.94 * Math.PI);
    context.stroke();
    context.restore();

    context.restore();
  };

  const drawEmber = (particle: EmberParticle, alpha: number, pull: number) => {
    const sparkSize = particle.size * (1 + pull * 1.4);
    const gradient = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, sparkSize * 7.5);
    gradient.addColorStop(0, `rgba(255, 232, 166, ${alpha * 0.95})`);
    gradient.addColorStop(0.24, `rgba(210, 118, 56, ${alpha * 0.34})`);
    gradient.addColorStop(1, 'rgba(92, 22, 8, 0)');

    context.strokeStyle = `rgba(218, 120, 56, ${alpha * 0.32})`;
    context.lineWidth = Math.max(0.6, sparkSize * 0.7);
    context.beginPath();
    context.moveTo(particle.previousX, particle.previousY);
    context.lineTo(particle.x, particle.y);
    context.stroke();

    context.fillStyle = gradient;
    context.beginPath();
    context.arc(particle.x, particle.y, sparkSize * 7.5, 0, TAU);
    context.fill();
  };

  const drawAsh = (particle: EmberParticle, alpha: number, pull: number) => {
    context.globalAlpha = alpha * 0.16;
    context.fillStyle = 'rgba(224, 207, 181, 0.5)';
    context.beginPath();
    context.ellipse(
      particle.x,
      particle.y,
      particle.size * (0.5 + pull * 0.18),
      particle.size * 0.16,
      particle.angle * 0.35,
      0,
      TAU,
    );
    context.fill();
    context.globalAlpha = 1;
  };

  const drawEventHorizon = (time: number) => {
    const field = gravityField();
    const coreRadius = field.eventRadius * 1.24;
    const rimRadius = field.eventRadius * 1.9;

    context.save();
    context.globalCompositeOperation = 'source-over';

    const core = context.createRadialGradient(field.x, field.y, 0, field.x, field.y, rimRadius);
    core.addColorStop(0, 'rgba(0, 0, 0, 1)');
    core.addColorStop(0.54, 'rgba(0, 0, 0, 0.98)');
    core.addColorStop(0.72, 'rgba(5, 4, 3, 0.96)');
    core.addColorStop(0.88, 'rgba(74, 41, 20, 0.26)');
    core.addColorStop(1, 'rgba(74, 41, 20, 0)');
    context.fillStyle = core;
    context.beginPath();
    context.arc(field.x, field.y, rimRadius, 0, TAU);
    context.fill();

    const bevel = context.createRadialGradient(
      field.x - coreRadius * 0.28,
      field.y - coreRadius * 0.32,
      0,
      field.x,
      field.y,
      rimRadius * 1.05,
    );
    bevel.addColorStop(0, 'rgba(164, 119, 69, 0.075)');
    bevel.addColorStop(0.34, 'rgba(0, 0, 0, 0)');
    bevel.addColorStop(0.7, 'rgba(0, 0, 0, 0.32)');
    bevel.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = bevel;
    context.beginPath();
    context.arc(field.x, field.y, rimRadius * 1.04, 0, TAU);
    context.fill();

    context.strokeStyle = `rgba(176, 138, 87, ${0.11 + Math.sin(time * 0.004) * 0.035})`;
    context.lineWidth = 1;
    context.beginPath();
    context.ellipse(field.x, field.y, coreRadius * 1.55, coreRadius * 0.56, -0.18, 0, TAU);
    context.stroke();

    context.save();
    context.translate(field.x, field.y);
    context.rotate(-0.18);
    context.scale(1.58, 0.52);
    const lowerArc = context.createLinearGradient(-coreRadius * 1.5, 0, coreRadius * 1.5, 0);
    lowerArc.addColorStop(0, 'rgba(0, 0, 0, 0)');
    lowerArc.addColorStop(0.28, 'rgba(112, 66, 32, 0.14)');
    lowerArc.addColorStop(0.52, 'rgba(198, 146, 80, 0.18)');
    lowerArc.addColorStop(0.78, 'rgba(0, 0, 0, 0.11)');
    lowerArc.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.strokeStyle = lowerArc;
    context.lineWidth = 1.4;
    context.beginPath();
    context.arc(0, 0, coreRadius, 0.03 * Math.PI, 0.97 * Math.PI);
    context.stroke();
    context.restore();

    context.restore();
  };

  const drawParticles = (time: number, delta: number, shouldEmit = true) => {
    const field = gravityField();
    context.save();
    context.globalCompositeOperation = 'lighter';
    context.lineCap = 'round';

    if (shouldEmit) emitQuietly(delta);

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const particle = particles[i];
      if (!particle) continue;
      particle.life += delta;

      const distanceRange = Math.max(1, particle.spawnRadius - field.eventRadius);
      const remaining = Math.max(0, (particle.radius - field.eventRadius) / distanceRange);
      const pull = 1 - remaining;
      const progress = particle.life / particle.maxLife;

      if (progress >= 1 || particle.radius <= field.eventRadius * 1.08) {
        particles.splice(i, 1);
        continue;
      }

      particle.previousX = particle.x;
      particle.previousY = particle.y;
      particle.radius -= particle.radialVelocity * delta * (1 + pull * 1.05);
      particle.angle += particle.angularVelocity * delta * (1 + pull * 1.75);

      const position = particlePosition(particle);
      particle.x = position.x;
      particle.y = position.y;

      const fadeIn = Math.min(1, particle.life / 900);
      const innerFade = Math.pow(remaining, particle.type === 'ember' ? 0.32 : 0.6);
      const flicker = 0.78 + Math.sin(time * 0.0028 + particle.seed) * 0.12;
      const alpha = fadeIn * innerFade * flicker;

      if (particle.type === 'ember') {
        drawEmber(particle, alpha, pull);
      } else {
        drawAsh(particle, alpha, pull);
      }
    }

    context.restore();
  };

  const renderStatic = () => {
    const time = performance.now();
    particles.length = 0;

    for (let i = 0; i < 42; i += 1) {
      const particle = createParticle();
      const field = gravityField();
      particle.radius = rand(field.eventRadius * 1.8, particle.spawnRadius);
      particle.angle += rand(0, TAU);
      particle.life = particle.maxLife * rand(0.12, 0.72);
      const position = particlePosition(particle);
      particle.x = position.x;
      particle.y = position.y;
      particle.previousX = position.x - Math.cos(particle.angle) * rand(2, 16);
      particle.previousY = position.y - Math.sin(particle.angle) * rand(1, 9);
      particles.push(particle);
    }

    drawGravityLens(time);
    drawParticles(time, 0, false);
    drawEventHorizon(time);
  };

  const tick = (time: number) => {
    const delta = Math.min(40, time - lastTime);
    lastTime = time;
    drawGravityLens(time);
    drawParticles(time, delta);
    drawEventHorizon(time);
    if (particles.length > PARTICLE_LIMIT) particles.splice(0, particles.length - PARTICLE_LIMIT);
    frame = window.requestAnimationFrame(tick);
  };

  const start = () => {
    window.cancelAnimationFrame(frame);
    resize();
    particles.length = 0;
    emissionCarry = 0;
    if (reducedMotion.matches) {
      renderStatic();
    } else {
      lastTime = performance.now();
      frame = window.requestAnimationFrame(tick);
    }
  };

  start();
  window.addEventListener('resize', start, { passive: true });
  reducedMotion.addEventListener('change', start);
};

document.querySelectorAll('[data-ember-canvas]').forEach((canvas) => {
  if (canvas instanceof HTMLCanvasElement) mountEmberField(canvas);
});
