/* ============================================================
   particles.js — Floating particle system
   Subtle background particles with occasional rose-colored ones
   ============================================================ */

export function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return () => {};

  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  let particles = [];
  let rafId = null;

  function resizeParticles() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    createParticles();
  }

  function createParticles() {
    particles = [];
    const area = canvas.width * canvas.height;
    const count = Math.min(Math.floor(area / 10000), 150); // Cap at 150 particles total
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.15,
        hue: Math.random() < 0.12 ? 345 + Math.random() * 15 : 0,
        saturation: Math.random() < 0.12 ? 40 + Math.random() * 30 : 0
      });
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;
      if (p.y < -10) p.y = canvas.height + 10;
      if (p.y > canvas.height + 10) p.y = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

      if (p.hue) {
        ctx.fillStyle = `hsla(${p.hue}, ${p.saturation}%, 70%, ${p.opacity})`;
      } else {
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
      }
      ctx.fill();
    }

    rafId = requestAnimationFrame(animateParticles);
  }

  resizeParticles();
  window.addEventListener('resize', resizeParticles);
  rafId = requestAnimationFrame(animateParticles);

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resizeParticles);
  };
}
