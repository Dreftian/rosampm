/* ============================================================
   cards.js — Fixed cards that reveal on scroll
   Cards with mask-image reveal animation tied to scroll position
   ============================================================ */

export function initCards() {
  const fixedCards = document.getElementById('fixed-cards');
  if (!fixedCards) return () => {};

  const cardsGrid = fixedCards.querySelector('.grid');
  if (!cardsGrid) return () => {};

  const trigger = document.getElementById('cards-trigger');
  if (!trigger) return () => {};

  let rafId = null;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function tickCards() {
    const rect = trigger.getBoundingClientRect();
    const triggerTop = rect.top + window.scrollY;
    const triggerHeight = rect.height;
    const scrollY = window.scrollY;
    const vh = window.innerHeight;

    const start = triggerTop - vh * 0.5;
    const end = triggerTop + triggerHeight - vh * 0.3;
    const range = end - start;

    let progress = range > 0 ? (scrollY - start) / range : 0;
    progress = Math.max(0, Math.min(1, progress));

    const isActive = scrollY >= start - vh * 0.2 && scrollY <= end + vh * 0.3;
    const fadeIn = Math.min(1, Math.max(0, (scrollY - (start - vh * 0.2)) / (vh * 0.2)));
    const fadeOut = Math.min(1, Math.max(0, (end + vh * 0.3 - scrollY) / (vh * 0.3)));
    const containerOpacity = isActive ? Math.min(fadeIn, fadeOut) : 0;

    fixedCards.style.opacity = containerOpacity;
    fixedCards.style.pointerEvents = containerOpacity > 0.1 ? 'auto' : 'none';

    const isMobile = window.innerWidth < 769;
    const easedProgress = easeOutCubic(progress);
    const revealPct = easedProgress * 130;

    if (isMobile) {
      const mask = `linear-gradient(to bottom, black ${revealPct}%, transparent ${revealPct + 15}%)`;
      cardsGrid.style.maskImage = mask;
      cardsGrid.style.webkitMaskImage = mask;
    } else {
      const mask = `linear-gradient(to right, black ${revealPct}%, transparent ${revealPct + 12}%)`;
      cardsGrid.style.maskImage = mask;
      cardsGrid.style.webkitMaskImage = mask;
    }

    rafId = requestAnimationFrame(tickCards);
  }

  rafId = requestAnimationFrame(tickCards);

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
  };
}
