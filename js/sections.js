/* ============================================================
   sections.js — Scroll Master + Section Animations
   - Hero fade on scroll
   - Bloom progress (0→1) for the rose
   - Dedication text reveal
   - Nav background on scroll
   - Stanza-by-stanza reveal in section 3
   - Scroll-to-top button
   ============================================================ */

export function initSections() {
  const hero = document.getElementById('hero');
  const nav = document.querySelector('nav');
  const sectionThreeInner = document.getElementById('section-three-inner');
  const scrollTopBtn = document.getElementById('scroll-top');
  const dedication = document.getElementById('dedication');

  // Null guards
  if (!hero || !nav || !scrollTopBtn) return () => {};

  let ticking = false;
  let currentBloom = 0;

  // ---- Bloom progress (0 = bud, 1 = fully open) ----
  function getBloomProgress() {
    const vh = window.innerHeight;
    const maxScroll = document.documentElement.scrollHeight - vh;
    if (maxScroll <= 0) return 0;
    // Rose blooms over the first 30% of total scroll
    const bloomRange = maxScroll * 0.30;
    return Math.max(0, Math.min(1, window.scrollY / bloomRange));
  }

  // ---- Dedication reveal (when bloom > 55%) ----
  function getDedicationProgress() {
    const bloom = currentBloom;
    // Reveal starts at bloom 0.55, ends at 0.75
    return Math.max(0, Math.min(1, (bloom - 0.55) / 0.20));
  }

  // ---- Stanza progress (last 40% of scroll) ----
  function getStanzaProgress() {
    const vh = window.innerHeight;
    const maxScroll = document.documentElement.scrollHeight - vh;
    if (maxScroll <= 0) return 0;
    const stanzaStart = maxScroll * 0.60;
    const stanzaRange = maxScroll * 0.40;
    return Math.max(0, Math.min(1, (window.scrollY - stanzaStart) / stanzaRange));
  }

  // ---- Hero fade ----
  function updateHeroOpacity() {
    const fade = Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.40));
    hero.style.opacity = fade;
  }

  // ---- Nav background ----
  function updateNav() {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  // ---- Scroll-to-top button ----
  function updateScrollTop() {
    if (window.scrollY > window.innerHeight * 0.8) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  }

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ---- Dedication text reveal ----
  function updateDedication() {
    if (!dedication) return;
    const dp = getDedicationProgress();
    if (dp > 0) {
      dedication.classList.add('visible');
      dedication.style.opacity = dp;
      dedication.style.transform = `translateY(${(1 - dp) * 20}px)`;
    } else {
      dedication.classList.remove('visible');
      dedication.style.opacity = 0;
      dedication.style.transform = 'translateY(30px)';
    }
  }

  // ---- Stanza reveal ----
  function updateStanzas() {
    if (!sectionThreeInner) return;
    const stanzas = sectionThreeInner.querySelectorAll('.stanza, .closing');
    const sp = getStanzaProgress();

    stanzas.forEach((stanza, i) => {
      const total = stanzas.length;
      const threshold = i / total;
      const range = 1 / total;
      const localP = Math.max(0, Math.min(1, (sp - threshold) / range));
      if (localP > 0) {
        stanza.classList.add('visible');
      } else {
        stanza.classList.remove('visible');
      }
    });
  }

  // ---- Unified scroll handler (throttled via rAF) ----
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        currentBloom = getBloomProgress();
        updateHeroOpacity();
        updateNav();
        updateScrollTop();
        updateDedication();
        updateStanzas();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // ---- Initial calls ----
  currentBloom = getBloomProgress();
  updateHeroOpacity();
  updateNav();
  updateScrollTop();
  updateDedication();
  updateStanzas();

  // ---- Expose bloom getter globally for rose.js ----
  // We return it so main.js can wire it up
  return {
    getBloomProgress,
    cleanup() {
      window.removeEventListener('scroll', onScroll);
    }
  };
}
