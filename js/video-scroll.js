/* ============================================================
   video-scroll.js — Scroll-driven video background
   Uses fetch() + blob URL (same-origin) to avoid CORS tainting.
   Extracts frames and maps them to scroll position.
   ============================================================ */

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260616_212935_bbf608da-62d1-4f25-9be4-c346e4d09cc8.mp4';

export function initVideoScroll() {
  const canvas = document.getElementById('video-canvas');
  const videoEl = document.getElementById('video-fallback');
  if (!canvas || !videoEl) return () => {};

  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const loadingIndicator = document.getElementById('loading-indicator');

  let frames = [];
  let framesReady = false;
  let lastFrameIndex = -1;
  let videoSeeking = false;
  let rafId = null;
  let objectUrl = null;

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    lastFrameIndex = -1;
  }

  async function extractFrames() {
    try {
      // Download video via fetch (respects CORS) → blob → blob URL (same-origin, no tainting)
      const response = await fetch(VIDEO_URL, { mode: 'cors' });
      if (!response.ok) throw new Error('Video fetch failed: ' + response.status);
      const blob = await response.blob();
      objectUrl = URL.createObjectURL(blob);

      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      video.preload = 'auto';
      video.src = objectUrl;

      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('Video load error'));
        setTimeout(() => reject(new Error('Video metadata timeout')), 15000);
      });

      // Memory-optimized scaling and frame count
      const scale = Math.min(1, 960 / video.videoWidth);
      const scaledWidth = Math.round(video.videoWidth * scale);
      const scaledHeight = Math.round(video.videoHeight * scale);
      const frameCount = Math.max(30, Math.min(80, Math.round(video.duration * 16)));

      for (let i = 0; i < frameCount; i++) {
        const time = (i / (frameCount - 1)) * (video.duration - 0.05);
        video.currentTime = time;
        await new Promise((resolve, reject) => {
          const onSeeked = () => {
            video.removeEventListener('seeked', onSeeked);
            resolve();
          };
          video.addEventListener('seeked', onSeeked);
          setTimeout(() => {
            video.removeEventListener('seeked', onSeeked);
            reject(new Error('Seek timeout'));
          }, 4000);
        });
        const bitmap = await createImageBitmap(video, {
          resizeWidth: scaledWidth,
          resizeHeight: scaledHeight
        });
        frames.push(bitmap);
      }

      if (frames.length > 0) {
        framesReady = true;
        canvas.style.visibility = 'visible';
        videoEl.style.display = 'none'; // Hide DOM video — canvas has the frames
      }
    } catch (e) {
      console.warn('Frame extraction failed, falling back to video seeking:', e.message);
    } finally {
      if (loadingIndicator) {
        loadingIndicator.classList.add('hidden');
      }
    }
  }

  function getScrollBounds() {
    const vh = window.innerHeight;
    return {
      start: vh * 0.5,
      end: document.documentElement.scrollHeight - vh
    };
  }

  function getProgress() {
    const { start, end } = getScrollBounds();
    const range = end - start;
    if (range <= 0) return 0;
    return Math.max(0, Math.min(1, (window.scrollY - start) / range));
  }

  function drawFrame(frame) {
    const cw = canvas.width;
    const ch = canvas.height;
    const s = Math.max(cw / frame.width, ch / frame.height);
    const dw = frame.width * s;
    const dh = frame.height * s;
    ctx.drawImage(frame, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  function videoTick() {
    const progress = getProgress();

    if (framesReady && frames.length > 0) {
      const idx = Math.round(progress * (frames.length - 1));
      if (idx !== lastFrameIndex && frames[idx]) {
        lastFrameIndex = idx;
        drawFrame(frames[idx]);
      }
    } else if (
      videoEl.duration &&
      isFinite(videoEl.duration) &&
      videoEl.readyState >= 1
    ) {
      // Fallback: seek the DOM video directly while frames aren't ready
      const target = progress * videoEl.duration;
      if (!videoSeeking && Math.abs(videoEl.currentTime - target) > 0.05) {
        videoSeeking = true;
        videoEl.currentTime = target;
      }
    }

    rafId = requestAnimationFrame(videoTick);
  }

  // Event handlers for fallback video seeking
  videoEl.addEventListener('seeked', () => { videoSeeking = false; });
  videoEl.addEventListener('stalled', () => { videoSeeking = false; });
  videoEl.addEventListener('loadeddata', () => { videoEl.currentTime = 0; });

  // Init
  canvas.style.visibility = 'hidden';
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  rafId = requestAnimationFrame(videoTick);
  extractFrames();

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resizeCanvas);
    frames.forEach(f => { try { f.close(); } catch (e) { /* ignore */ } });
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  };
}
