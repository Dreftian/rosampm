/* ============================================================
   video-scroll.js — Scroll-driven video background
   Extracts frames from the existing <video> element (no double fetch)
   Maps frames to scroll position with reduced memory footprint
   ============================================================ */

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
      // Wait for video metadata
      await new Promise((resolve, reject) => {
        if (videoEl.readyState >= 1) {
          resolve();
          return;
        }
        const onMeta = () => { videoEl.removeEventListener('loadedmetadata', onMeta); resolve(); };
        videoEl.addEventListener('loadedmetadata', onMeta);
        setTimeout(() => { videoEl.removeEventListener('loadedmetadata', onMeta); reject(new Error('Video metadata timeout')); }, 15000);
      });

      const video = videoEl; // Use existing video element — no double fetch!
      const scale = Math.min(1, 960 / video.videoWidth); // More aggressive scaling for mobile
      const scaledWidth = Math.round(video.videoWidth * scale);
      const scaledHeight = Math.round(video.videoHeight * scale);

      // Reduced frame count: max 80 instead of 150
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
        videoEl.style.display = 'none'; // hide video — canvas has the frames now
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
      const target = progress * videoEl.duration;
      if (!videoSeeking && Math.abs(videoEl.currentTime - target) > 0.05) {
        videoSeeking = true;
        videoEl.currentTime = target;
      }
    }

    rafId = requestAnimationFrame(videoTick);
  }

  // Event handlers
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
  };
}
