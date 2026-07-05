/* ============================================================
   rose.js — Scroll-Driven Blooming Rose
   La rosa florece cuadro por cuadro según el progreso del scroll.
   bloom = 0 (capullo cerrado) → bloom = 1 (flor abierta)
   ============================================================ */

export function initRose(getBloomProgress) {
  const canvas = document.getElementById('rose-canvas');
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  // ---- STATE (declaradas ANTES de cualquier uso - fix TDZ) ----
  let roseParticles = [];
  let rafId = null;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  // ---- Resize ----
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    roseParticles = []; // re-init on next frame
  }

  resize();
  window.addEventListener('resize', resize);

  // ---- Easing ----
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // ---- Petal path ----
  function petalPath(ctx, cx, cy, w, h) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - h);
    ctx.bezierCurveTo(
      cx + w * 0.85, cy - h * 0.55,
      cx + w * 0.9, cy + h * 0.15,
      cx, cy + h * 0.35
    );
    ctx.bezierCurveTo(
      cx - w * 0.9, cy + h * 0.15,
      cx - w * 0.85, cy - h * 0.55,
      cx, cy - h
    );
    ctx.closePath();
  }

  // ---- Main rose draw with bloom parameter ----
  function drawRose(ctx, time, cx, cy, size, bloom) {
    // bloom: 0 = closed bud, 1 = fully open
    const sway = Math.sin(time * 0.0005) * 0.025 * (0.3 + bloom * 0.7);
    const breathe = 1 + Math.sin(time * 0.001) * 0.015;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(sway);
    ctx.scale(breathe, breathe);

    const s = size;

    // ----- GLOW (intensifies with bloom) -----
    const glowAlpha = 0.04 + bloom * 0.1;
    const glow = ctx.createRadialGradient(0, -s * 0.15, 0, 0, -s * 0.15, s * 1.6);
    glow.addColorStop(0, `rgba(220, 80, 110, ${glowAlpha})`);
    glow.addColorStop(0.5, `rgba(180, 50, 80, ${glowAlpha * 0.3})`);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -s * 0.1, s * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // ----- STEM (stage 0: grows from 0 to full height) -----
    const stemBloom = clamp((bloom - 0.00) / 0.20, 0, 1);
    const stemH = easeOutCubic(stemBloom) * s * 1.05;

    if (stemBloom > 0) {
      const stemGrad = ctx.createLinearGradient(-s * 0.04, 0, s * 0.04, 0);
      stemGrad.addColorStop(0, '#2d5a1e');
      stemGrad.addColorStop(0.4, '#4a8c35');
      stemGrad.addColorStop(0.6, '#4a8c35');
      stemGrad.addColorStop(1, '#2d5a1e');
      ctx.strokeStyle = stemGrad;
      ctx.lineWidth = s * 0.06;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, s * 0.08);
      ctx.bezierCurveTo(s * 0.06, s * 0.38, -s * 0.04, s * 0.65, 0, stemH);
      ctx.stroke();

      // Thorns (appear with stem)
      if (stemBloom > 0.15) {
        ctx.fillStyle = '#3d2817';
        const thornPositions = [0.28, 0.52, 0.68];
        for (const tp of thornPositions) {
          const thornBloom = clamp((stemBloom - tp * 0.8) / 0.3, 0, 1);
          if (thornBloom <= 0) continue;
          const side = tp < 0.5 ? 1 : -1;
          ctx.save();
          ctx.globalAlpha = thornBloom;
          ctx.beginPath();
          const ty = s * tp;
          ctx.moveTo(side * s * 0.02, ty);
          ctx.lineTo(side * s * 0.13 * thornBloom, ty - s * 0.07);
          ctx.lineTo(side * s * 0.03, ty - s * 0.01);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // ----- LEAVES (stage 1: appear and unfurl) -----
    const leafBloom = clamp((bloom - 0.10) / 0.18, 0, 1);
    if (leafBloom > 0) {
      const leafScale = easeOutCubic(leafBloom);
      const leafAlpha = leafBloom;

      function drawLeaf(lx, ly, angle, flipH) {
        ctx.save();
        ctx.globalAlpha = leafAlpha;
        ctx.translate(0, ly);
        ctx.rotate(angle + sway * 1.5);
        ctx.scale(flipH ? -1 : 1, 1);
        ctx.scale(leafScale, leafScale);

        const leafGrad = ctx.createLinearGradient(-s * 0.22, 0, s * 0.22, 0);
        leafGrad.addColorStop(0, '#1a4a0e');
        leafGrad.addColorStop(0.5, '#3d7a28');
        leafGrad.addColorStop(1, '#1a4a0e');
        ctx.fillStyle = leafGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-s * 0.22, -s * 0.08, -s * 0.24, -s * 0.22, 0, -s * 0.28);
        ctx.bezierCurveTo(s * 0.1, -s * 0.22, s * 0.08, -s * 0.08, 0, 0);
        ctx.fill();

        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = s * 0.008;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.02);
        ctx.lineTo(-s * 0.08, -s * 0.18);
        ctx.stroke();
        ctx.restore();
      }

      drawLeaf(0, s * 0.42, -0.55, false);  // left leaf
      drawLeaf(0, s * 0.56, 0.5, true);      // right leaf
    }

    // ----- SEPALS (stage 2: open outward) -----
    const sepalBloom = clamp((bloom - 0.18) / 0.14, 0, 1);
    if (sepalBloom > 0) {
      ctx.fillStyle = '#2d5a1e';
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + 0.3;
        const sepAngle = lerp(0, 0.35, easeOutCubic(sepalBloom));
        const sx = Math.cos(angle) * s * 0.08;
        const sy = -s * 0.06 + Math.sin(angle) * s * 0.06;
        ctx.save();
        ctx.globalAlpha = sepalBloom;
        ctx.translate(sx, sy);
        ctx.rotate(angle + Math.PI * 0.5 + sepAngle * (i < 2 ? 1 : -1));
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.12);
        ctx.bezierCurveTo(s * 0.04, -s * 0.06, s * 0.05, s * 0.03, 0, s * 0.06);
        ctx.bezierCurveTo(-s * 0.05, s * 0.03, -s * 0.04, -s * 0.06, 0, -s * 0.12);
        ctx.fill();
        ctx.restore();
      }
    }

    // ----- PETALS (stages 3-8: 6 layers unfold from outer to inner) -----
    const layers = [
      { count: 6, r: 0.92, colors: ['#6B0F1E', '#8B1A2B', '#A02030'], stageStart: 0.20, stageRange: 0.16 },
      { count: 6, r: 0.78, colors: ['#8B1A2B', '#A8223B', '#B83048'], stageStart: 0.28, stageRange: 0.16 },
      { count: 5, r: 0.64, colors: ['#A8223B', '#C9405A', '#D05065'], stageStart: 0.35, stageRange: 0.16 },
      { count: 5, r: 0.50, colors: ['#C9405A', '#D86075', '#E07080'], stageStart: 0.42, stageRange: 0.16 },
      { count: 4, r: 0.36, colors: ['#D86075', '#E8728A', '#F0909A'], stageStart: 0.50, stageRange: 0.15 },
      { count: 3, r: 0.22, colors: ['#E8728A', '#F5A0B4', '#FAB8C5'], stageStart: 0.57, stageRange: 0.15 },
    ];

    for (let l = 0; l < layers.length; l++) {
      const layer = layers[l];
      const petalBloom = clamp((bloom - layer.stageStart) / layer.stageRange, 0, 1);
      if (petalBloom <= 0) continue;

      const count = layer.count;
      const layerR = s * layer.r;
      const angleOffset = l * 0.35 + sway * (l + 1) * 0.5;
      const scale = easeOutCubic(petalBloom);

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + angleOffset;
        const spreadAngle = lerp(0.05, 1, easeOutCubic(petalBloom));
        const px = Math.cos(angle) * layerR * 0.25 * spreadAngle;
        const py = -s * 0.10 + Math.sin(angle) * layerR * 0.2 * spreadAngle;

        ctx.save();
        ctx.globalAlpha = petalBloom;
        ctx.translate(px, py);
        ctx.rotate(angle + Math.PI * 0.5);

        const pw = layerR * 0.42 * (0.3 + scale * 0.7);
        const ph = layerR * 0.72 * (0.3 + scale * 0.7);

        const grad = ctx.createLinearGradient(0, -ph, 0, ph);
        grad.addColorStop(0, layer.colors[2]);
        grad.addColorStop(0.5, layer.colors[1]);
        grad.addColorStop(1, layer.colors[0]);
        ctx.fillStyle = grad;

        petalPath(ctx, 0, 0, pw, ph);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 200, 210, 0.15)';
        ctx.lineWidth = s * 0.01 * scale;
        ctx.stroke();

        ctx.restore();
      }
    }

    // ----- CENTER SPIRAL (stage 9: tight spiral) -----
    const spiralBloom = clamp((bloom - 0.65) / 0.15, 0, 1);
    if (spiralBloom > 0) {
      ctx.save();
      ctx.translate(0, -s * 0.10);
      ctx.globalAlpha = spiralBloom;

      for (let i = 0; i < 3; i++) {
        const angle = i * 2.1 + sway * 3 + time * 0.0003;
        const dist = s * 0.06 * i * spiralBloom;
        const sx = Math.cos(angle) * dist;
        const sy = Math.sin(angle) * dist;

        const innerGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, s * 0.07);
        innerGrad.addColorStop(0, '#FDD5DC');
        innerGrad.addColorStop(0.5, '#F5A0B4');
        innerGrad.addColorStop(1, '#C9405A');
        ctx.fillStyle = innerGrad;
        ctx.beginPath();
        ctx.arc(sx, sy, s * 0.06, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore(); // main transform
  }

  // ---- Rose Particles ----
  function initRoseParticles(cx, cy, size) {
    roseParticles = [];
    for (let i = 0; i < 30; i++) {
      roseParticles.push({
        x: cx + (Math.random() - 0.5) * size * 0.5,
        y: cy + (Math.random() - 0.5) * size * 0.8,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.6 - 0.1,
        life: Math.random(),
        maxLife: 0.6 + Math.random() * 0.6,
        size: 0.5 + Math.random() * 2.5,
        hue: 340 + Math.random() * 25,
        saturation: 60 + Math.random() * 40,
      });
    }
  }

  function updateRoseParticles(cx, cy, s, bloom) {
    const intensity = clamp((bloom - 0.30) / 0.40, 0, 1);
    for (const p of roseParticles) {
      p.life += 0.003;
      if (p.life >= p.maxLife) {
        p.life = 0;
        p.x = cx + (Math.random() - 0.5) * s * 0.5;
        p.y = cy + (Math.random() - 0.5) * s * 0.5;
        p.vy = -Math.random() * 0.5 - 0.15;
      }
      p.x += p.vx;
      p.y += p.vy * (1 - p.life / p.maxLife);
      p.vy -= 0.001;
    }
  }

  function drawRoseParticles(ctx) {
    for (const p of roseParticles) {
      const alpha = p.life < 0.1
        ? p.life / 0.1
        : p.life > p.maxLife - 0.2
          ? (p.maxLife - p.life) / 0.2
          : 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, ${p.saturation}%, 70%, ${alpha * 0.7})`;
      ctx.fill();
    }
  }

  // ---- Render Loop ----
  function render(timestamp) {
    const cw = canvas.width;
    const ch = canvas.height;
    if (cw === 0 || ch === 0) {
      rafId = requestAnimationFrame(render);
      return;
    }

    ctx.clearRect(0, 0, cw, ch);

    const cx = cw / 2;
    const cy = ch * 0.45;
    const size = Math.min(cw, ch) * 0.48;
    const time = timestamp;

    // Get bloom progress from scroll (0-1)
    const bloom = typeof getBloomProgress === 'function' ? getBloomProgress() : 0;

    // Init particles once
    if (roseParticles.length === 0) {
      initRoseParticles(cx, cy, size);
    }

    updateRoseParticles(cx, cy, size, bloom);

    // Semi-transparent rose — el video de fondo se ve a través
    ctx.globalAlpha = 0.82;
    drawRose(ctx, time, cx, cy, size, bloom);
    ctx.globalAlpha = 1;

    drawRoseParticles(ctx);

    rafId = requestAnimationFrame(render);
  }

  rafId = requestAnimationFrame(render);

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
  };
}
