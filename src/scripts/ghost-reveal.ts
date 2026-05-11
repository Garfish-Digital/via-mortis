/**
 * ghost-reveal.ts
 *
 * Per-element ghost reveal system. Each target element's real content is
 * temporarily replaced by a filtered clone (the "ghost"). The ghost shimmers,
 * then dissolves with a deliberate overlap as the real content fades in.
 *
 * Attribute contract:
 *   [data-ghost-hero]   — time-triggered (hero section, above fold)
 *   [data-ghost-reveal] — scroll-triggered (cards and sections, below fold)
 *
 * DOM structure written by this script (inside each target element):
 *   .ghost-real-content   — real content wrapper, starts at opacity 0
 *   .ghost-overlay        — filtered clone, starts visible, then dissolves
 */

// ── Visual config ──────────────────────────────────────────────────────────────

const GHOST_OPACITY = 0.30;

// Applied to the entire ghost overlay container.
// Tinted toward $wrong-bruised-purple (#3E2F44) via sepia + hue-rotate.
// Tuned: blur reduced 6→3, saturate eased 0.06→0.1, sepia 0.6→0.5 — same
// character at lower compositor cost so first-paint doesn't eat scroll input.
const GHOST_FILTER =
  'blur(3px) saturate(0.1) brightness(0.55) sepia(0.5) hue-rotate(225deg)';

// Applied additionally to <img> elements within the ghost
const GHOST_IMAGE_FILTER = 'invert(1) grayscale(1) blur(3px)';

// Filter applied to real content as it first appears — visually matches the ghost
// so the handoff is seamless. Transitions to 'none' over the reveal duration.
// Blur matches the ghost (3px) so we're not animating a heavy filter on every reveal.
const REAL_ENTRY_FILTER =
  'blur(3px) saturate(0.15) brightness(0.55)';

// ── Timing config (ms) ────────────────────────────────────────────────────────

const HERO_APPEAR_DURATION   = 2000;  // hero ghost fade-in (slow burn)
const SCROLL_APPEAR_DURATION = 500;   // below-fold ghost fade-in
const HERO_HOLD_DURATION     = 400;   // hero: brief linger at peak before crossfade
const SCROLL_HOLD_DURATION   = 200;   // scroll: brief linger at peak before crossfade
const HERO_CROSSFADE_DURATION   = 2000;  // hero ghost-out and real-in duration
const SCROLL_CROSSFADE_DURATION = 750;  // below-fold crossfade (half of hero)

// ── Scroll trigger ────────────────────────────────────────────────────────────

// Fires when element is ~25vh from the bottom viewport edge (just entering view)
const SCROLL_ROOT_MARGIN = '0px 0px -25% 0px';

// ── Suppression styles ─────────────────────────────────────────────────────────
// Prevents BloodDrip / GlitchTransition / DisplacementMap component scripts from
// activating inside ghost clones. Phase 3 will add code-level guards in each
// component script; this CSS layer covers the interim.

function injectSuppressionStyles(): void {
  if (document.getElementById('ghost-suppression-styles')) return;

  const style = document.createElement('style');
  style.id = 'ghost-suppression-styles';
  style.textContent = `
    [data-ghost-clone],
    [data-ghost-clone] * {
      pointer-events: none !important;
      animation: none !important;
    }
    [data-ghost-clone] .displacement-wrapper:hover {
      filter: none !important;
    }
  `;
  document.head.appendChild(style);
}

// ── DOM preparation ───────────────────────────────────────────────────────────

interface GhostElements {
  realWrapper: HTMLDivElement;
  ghostOverlay: HTMLDivElement;
}

function prepareElement(element: HTMLElement): GhostElements {
  // Snapshot HTML before any DOM manipulation
  const originalHTML = element.innerHTML;
  const originalOverflow = element.style.overflow;

  // Ensure host element is a positioning context
  if (getComputedStyle(element).position === 'static') {
    element.style.position = 'relative';
  }

  // Clip ghost overlay to element bounds (restored after reveal completes)
  element.style.overflow = 'hidden';
  element.dataset.ghostOriginalOverflow = originalOverflow;

  // Clear original content
  element.innerHTML = '';

  // ── Real content wrapper (hidden) ────────────────────────────────────────
  const realWrapper = document.createElement('div');
  realWrapper.className = 'ghost-real-content';
  // <article> cards use height: 100% in their CSS chain — preserve it
  const needsFullHeight = element.tagName === 'ARTICLE';
  realWrapper.style.cssText = needsFullHeight
    ? 'width: 100%; height: 100%; opacity: 0;'
    : 'width: 100%; opacity: 0;';
  realWrapper.innerHTML = originalHTML;
  element.appendChild(realWrapper);

  // Force any elements hidden by FOUC-guard CSS rules (e.g. .hero-content { opacity:0 })
  // to be visible inside the real wrapper — mirrors the same pass done for ghostOverlay.
  realWrapper.querySelectorAll<HTMLElement>('*').forEach(child => {
    if (getComputedStyle(child).opacity === '0') {
      child.style.opacity = '1';
    }
  });

  // ── Ghost overlay (filtered clone) ────────────────────────────────────────
  const ghostOverlay = document.createElement('div');
  ghostOverlay.className = 'ghost-overlay';
  ghostOverlay.setAttribute('aria-hidden', 'true');
  ghostOverlay.setAttribute('data-ghost-clone', 'true');
  ghostOverlay.innerHTML = originalHTML;

  // Duplicate SVG filter IDs would break CSS url() references — strip them all
  ghostOverlay.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));

  // Inline scripts must not re-execute in the clone
  ghostOverlay.querySelectorAll('script').forEach(s => s.remove());

  // Component <style> tags would produce duplicate CSS rules — strip them
  ghostOverlay.querySelectorAll('style').forEach(s => s.remove());

  // Images get their own override: inverted + desaturated + blurred
  ghostOverlay.querySelectorAll('img').forEach(img => {
    (img as HTMLImageElement).style.filter = GHOST_IMAGE_FILTER;
  });

  // Inherit the host element's layout so the clone positions identically.
  // Critical for flex/grid containers (e.g. the hero section uses flex centering).
  // Padding must be copied so absolutely-positioned ghost content aligns with the
  // real content that lives inside the host's padding box.
  const hostStyle = getComputedStyle(element);
  ghostOverlay.style.cssText = `
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    box-sizing: border-box;
    pointer-events: none;
    z-index: 10;
    opacity: 0;
    filter: ${GHOST_FILTER};
    will-change: opacity, filter;
    overflow: hidden;
    display: ${hostStyle.display};
    flex-direction: ${hostStyle.flexDirection};
    align-items: ${hostStyle.alignItems};
    justify-content: ${hostStyle.justifyContent};
    gap: ${hostStyle.gap};
    padding: ${hostStyle.padding};
  `;
  element.appendChild(ghostOverlay);

  // Scan all ghost descendants for computed opacity: 0.
  // Some elements (e.g. .hero-subtitle p) use opacity:0 as the CSS initial state
  // for an animation (subtitle-fade). With animations disabled in the ghost,
  // those elements stay invisible. Force them to opacity:1 so the ghost filter
  // provides the dimming instead.
  ghostOverlay.querySelectorAll<HTMLElement>('*').forEach(child => {
    if (getComputedStyle(child).opacity === '0') {
      child.style.opacity = '1';
    }
  });

  return { realWrapper, ghostOverlay };
}

// ── Cleanup ──────────────────────────────────────────────────────────────────

function restoreOverflow(element: HTMLElement): void {
  if (element.dataset.ghostOriginalOverflow !== undefined) {
    element.style.overflow = element.dataset.ghostOriginalOverflow;
    delete element.dataset.ghostOriginalOverflow;
  }
}

// ── Crossfade ─────────────────────────────────────────────────────────────────

function crossfade(ghostOverlay: HTMLDivElement, realWrapper: HTMLDivElement, duration: number): void {
  // Real content starts filtered to visually match the ghost, then clears.
  realWrapper.style.filter = REAL_ENTRY_FILTER;

  // Ghost fades out with ease-out (quick initial drop, last wisps linger).
  ghostOverlay.style.transition = `opacity ${duration}ms ease-out`;
  ghostOverlay.style.opacity = '0';

  // Real content uses ease-in (crawls from nothing, accelerates late).
  const REVEAL_EASE = 'cubic-bezier(0.55, 0, 0.85, 0.35)';
  realWrapper.style.transition =
    `opacity ${duration}ms ${REVEAL_EASE}, filter ${duration}ms ${REVEAL_EASE}`;
  realWrapper.style.opacity = '1';
  realWrapper.style.filter = 'none';

  // Remove ghost DOM and restore host overflow once transitions complete
  window.setTimeout(() => {
    const host = ghostOverlay.parentElement;
    ghostOverlay.remove();
    realWrapper.style.filter = '';
    realWrapper.style.transition = '';
    if (host) restoreOverflow(host);
  }, duration + 150);
}

// Ghost-only dissolve — used when the real content reveal was started early (hero).
function crossfadeGhostOnly(ghostOverlay: HTMLDivElement, realWrapper: HTMLDivElement, duration: number): void {
  ghostOverlay.style.transition = `opacity ${duration}ms ease-out`;
  ghostOverlay.style.opacity = '0';

  window.setTimeout(() => {
    const host = ghostOverlay.parentElement;
    ghostOverlay.remove();
    realWrapper.style.filter = '';
    realWrapper.style.transition = '';
    if (host) restoreOverflow(host);
  }, duration + 150);
}

// ── Trigger: time (hero, above fold) ─────────────────────────────────────────

function setupHeroGhost(element: HTMLElement): void {
  const { realWrapper, ghostOverlay } = prepareElement(element);

  // Delay so the user's eyes settle on the page before the ghost begins.
  // Too short (80ms) and the fade-in starts during browser paint — feels instant.
  window.setTimeout(() => {
    ghostOverlay.style.transition = `opacity ${HERO_APPEAR_DURATION}ms ease-out`;
    ghostOverlay.style.opacity = String(GHOST_OPACITY);

    // Real content begins its slow filtered reveal 1000ms before the ghost
    // starts dissolving, so it's already a whisper when the crossfade fires.
    const HERO_REAL_HEAD_START = 1000;
    window.setTimeout(() => {
      realWrapper.style.filter = REAL_ENTRY_FILTER;
      const REVEAL_EASE = 'cubic-bezier(0.55, 0, 0.85, 0.35)';
      const totalReveal = HERO_CROSSFADE_DURATION + HERO_REAL_HEAD_START;
      realWrapper.style.transition =
        `opacity ${totalReveal}ms ${REVEAL_EASE}, filter ${totalReveal}ms ${REVEAL_EASE}`;
      realWrapper.style.opacity = '1';
      realWrapper.style.filter = 'none';
    }, HERO_APPEAR_DURATION + HERO_HOLD_DURATION - HERO_REAL_HEAD_START);

    // Ghost crossfade still fires at the original time
    window.setTimeout(() => {
      crossfadeGhostOnly(ghostOverlay, realWrapper, HERO_CROSSFADE_DURATION);
    }, HERO_APPEAR_DURATION + HERO_HOLD_DURATION);
  }, 400);
}

// ── Trigger: scroll (below fold) ─────────────────────────────────────────────

function setupScrollGhost(element: HTMLElement): void {
  const { realWrapper, ghostOverlay } = prepareElement(element);

  let triggered = false;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !triggered) {
          triggered = true;
          observer.disconnect();

          // Ghost appears as the element enters the trigger zone
          ghostOverlay.style.transition = `opacity ${SCROLL_APPEAR_DURATION}ms ease-out`;
          ghostOverlay.style.opacity = String(GHOST_OPACITY);

          // After appear + hold: begin crossfade
          window.setTimeout(() => {
            crossfade(ghostOverlay, realWrapper, SCROLL_CROSSFADE_DURATION);
          }, SCROLL_APPEAR_DURATION + SCROLL_HOLD_DURATION);
        }
      });
    },
    { rootMargin: SCROLL_ROOT_MARGIN, threshold: 0 }
  );

  observer.observe(element);
}

// ── Idle scheduling ───────────────────────────────────────────────────────────
// requestIdleCallback shipped in Safari 17 (Sept 2023). Older Safari falls back
// to a near-zero setTimeout, which still yields to scroll between iterations.

function ric(cb: () => void, timeout = 200): void {
  const r = (window as any).requestIdleCallback;
  if (typeof r === 'function') {
    r(cb, { timeout });
  } else {
    setTimeout(cb, 1);
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

export function initGhostReveal(): void {
  injectSuppressionStyles();

  // Hero — time-triggered, runs immediately (single element, above fold)
  const heroEl = document.querySelector<HTMLElement>('[data-ghost-hero]');
  if (heroEl) setupHeroGhost(heroEl);

  // Below-fold elements — process one per idle frame. Each setupScrollGhost call
  // does synchronous DOM cloning + computed-style queries; doing them all in one
  // sweep at init blocks the browser long enough that the first scroll input
  // gets dropped. Spreading across idle frames yields scroll between each.
  const elements = Array.from(
    document.querySelectorAll<HTMLElement>('[data-ghost-reveal]')
  );

  function processNext(i: number): void {
    if (i >= elements.length) return;
    setupScrollGhost(elements[i]);
    ric(() => processNext(i + 1), 100);
  }
  processNext(0);
}
