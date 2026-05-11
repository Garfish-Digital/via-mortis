import { audioController } from './audio-controller.ts';

export function initSubliminalFlash(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const overlay = document.getElementById('subliminal-flash');
  const frame1  = document.getElementById('flash-frame-1') as HTMLElement | null;
  const frame2  = document.getElementById('flash-frame-2') as HTMLElement | null;
  if (!overlay || !frame1 || !frame2) return;

  let flash1Fired = false;
  let flash2Fired = false;
  let scrollStopTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Scroll handler ──────────────────────────────────────────────────────
  const STOP_DELAY = 2000;

  window.addEventListener('scroll', () => {
    if (scrollStopTimer !== null) clearTimeout(scrollStopTimer);

    const scrollable =
      document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? window.scrollY / scrollable : 0;

    scrollStopTimer = setTimeout(() => {
      // Flash 1 — 1 frame, 30% opacity
      // Widened zone: 25%–70% for easier testing
      if (!flash1Fired && pct >= 0.25 && pct <= 0.70) {
        flash1Fired = true;
        fireFlash(overlay, frame1, { frames: 1, opacity: 0.3 });
        audioController.playFlash1();
      }

      // Flash 2 — 2 frames, 80% opacity
      // Widened zone: 65%–95%
      if (flash1Fired && !flash2Fired && pct >= 0.65 && pct <= 0.95) {
        flash2Fired = true;
        fireFlash(overlay, frame2, { frames: 2, opacity: 0.8 });
        audioController.playFlash2();
      }
    }, STOP_DELAY);
  }, { passive: true });
}

function fireFlash(
  overlay: HTMLElement,
  frame: HTMLElement,
  config: { frames: number; opacity: number }
): void {
  frame.style.display = 'block';

  requestAnimationFrame(() => {
    overlay.style.opacity = String(config.opacity);

    const holdMs = config.frames * 16;

    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => {
        frame.style.display = 'none';
      }, 50);
    }, holdMs);
  });
}
