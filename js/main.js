/* ============================================================
   main.js — Entry point
   Initializes all modules and wires up the bloom callback
   ============================================================ */

import { initVideoScroll } from './video-scroll.js';
import { initParticles } from './particles.js';
import { initCards } from './cards.js';
import { initSections } from './sections.js';
import { initRose } from './rose.js';

(function () {
  'use strict';

  function boot() {
    // 1. Scroll-driven video background (uses existing <video> element)
    initVideoScroll();

    // 2. Particle system
    initParticles();

    // 3. Section animations & scroll effects
    //    sections returns { getBloomProgress, cleanup }
    const sections = initSections();

    // 4. Fixed cards reveal
    initCards();

    // 5. Animated rose — wired to scroll-driven bloom progress
    if (sections && typeof sections.getBloomProgress === 'function') {
      initRose(sections.getBloomProgress);
    } else {
      initRose(() => 0);
    }
  }

  // Modules are deferred, so DOM is always ready
  boot();
})();
