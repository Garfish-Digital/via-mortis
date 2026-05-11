import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ── Config ─────────────────────────────────────────────────────────────────

const SIGIL_PATHS = [
  '/assets/images/cursor-sigils/Cursor-1-Bael.svg',
  '/assets/images/cursor-sigils/Cursor-2-Paimon.svg',
  '/assets/images/cursor-sigils/Cursor-3-Belial.svg',
  '/assets/images/cursor-sigils/Cursor-4-Astaroth.svg',
];
const SIGIL_DESTRUCTION = '/assets/images/cursor-sigils/Cursor-5-Lucifuge.svg';

// Cursor sizes grow subtly as the ritual deepens
const SIGIL_SIZES = [24, 26, 28, 32];

// Colors
const COLOR_DEFAULT = '#E2DED6';  // cold-biological warm
const COLOR_HOVER = '#5A2E2E';    // wrong-dried-blood

// ── SVG loader — recolors strokes and sets cursor dimensions ───────────────

async function loadSigilDataUrl(path: string, size: number, color: string): Promise<string> {
  try {
    const response = await fetch(path);
    const svgText = await response.text();
    const processed = svgText
      .replace(/stroke="black"/g, `stroke="${color}"`)
      .replace(/stroke="#000000"/g, `stroke="${color}"`)
      .replace(/stroke="#000"/g, `stroke="${color}"`)
      .replace(/width="900"/, `width="${size}"`)
      .replace(/height="900"/, `height="${size}"`);
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(processed);
  } catch {
    return '';
  }
}

// ── Module state ───────────────────────────────────────────────────────────

let loadedSigils: string[] = [];        // Default color
let loadedSigilsHover: string[] = [];   // Hover color (dried blood)
let loadedDestruction = '';
let deepestSigil = 0; // Ritual is irreversible — only advances

// ── Cursor application ─────────────────────────────────────────────────────

function buildCursorValue(dataUrl: string, size: number): string {
  const hotspot = Math.floor(size / 2);
  return `url('${dataUrl}') ${hotspot} ${hotspot}, crosshair`;
}

function applySigil(index: number): void {
  const dataUrl = loadedSigils[index];
  if (!dataUrl) return;
  document.body.style.cursor = buildCursorValue(dataUrl, SIGIL_SIZES[index]);
}

function applyDestructionSigil(): void {
  if (!loadedDestruction) return;
  document.body.style.cursor = buildCursorValue(loadedDestruction, 32);
}

// ── Hover tracking ─────────────────────────────────────────────────────────

// Inject a <style> element that sets cursor on all interactive elements to the hover sigil.
// Toggling the style on/off is more reliable than setting body.style.cursor,
// because CSS inheritance from body can lose to UA-stylesheet specificity on <a>.
let hoverStyleEl: HTMLStyleElement | null = null;

function injectHoverCursorStyle(): void {
  if (hoverStyleEl) return;
  hoverStyleEl = document.createElement('style');
  hoverStyleEl.id = 'sigil-hover-cursor';
  document.head.appendChild(hoverStyleEl);
}

function updateHoverCursorRule(): void {
  if (!hoverStyleEl) return;
  const dataUrl = loadedSigilsHover[deepestSigil];
  if (!dataUrl) return;
  const size = SIGIL_SIZES[deepestSigil];
  const hotspot = Math.floor(size / 2);
  hoverStyleEl.textContent = `
    a:hover, button:hover, [role="button"]:hover, img:hover,
    a:hover *, button:hover *, [role="button"]:hover * {
      cursor: url('${dataUrl}') ${hotspot} ${hotspot}, crosshair !important;
    }
  `;
}

function setupHoverTracking(): void {
  injectHoverCursorStyle();
  updateHoverCursorRule();
}

// ── Transition ─────────────────────────────────────────────────────────────

function transitionSigil(targetIndex: number): void {
  // Brief cursor blackout — the ritual demands a pause
  document.body.style.cursor = 'none';

  const isViolent = targetIndex === 3;
  const delay = isViolent ? 200 : 100;

  if (isViolent) {
    document.body.classList.add('sigil-transition-violent');
    setTimeout(() => document.body.classList.remove('sigil-transition-violent'), 600);
  }

  setTimeout(() => {
    applySigil(targetIndex);
    updateHoverCursorRule();

    // Signal the ritual progression to the audio layer
    if (typeof (window as any).__playSignalTone === 'function') {
      (window as any).__playSignalTone();
    }

    // Flash bruised purple glow on all interactive elements
    document.querySelectorAll<HTMLElement>('button, a').forEach(el => {
      el.style.transition = 'filter 300ms ease';
      el.style.filter = 'drop-shadow(0 0 4px #3E2F44)';
      setTimeout(() => {
        el.style.filter = '';
        el.style.transition = '';
      }, 300);
    });
  }, delay);
}

// ── Entry point ────────────────────────────────────────────────────────────

export async function initCursorController(): Promise<void> {
  // Skip on touch-only devices (no cursor)
  if (window.matchMedia('(hover: none)').matches) return;

  // Preload all sigils in both color variants
  const [defaultSigils, hoverSigils, destruction] = await Promise.all([
    Promise.all(SIGIL_PATHS.map((path, i) => loadSigilDataUrl(path, SIGIL_SIZES[i], COLOR_DEFAULT))),
    Promise.all(SIGIL_PATHS.map((path, i) => loadSigilDataUrl(path, SIGIL_SIZES[i], COLOR_HOVER))),
    loadSigilDataUrl(SIGIL_DESTRUCTION, 32, COLOR_HOVER),
  ]);

  loadedSigils = defaultSigils;
  loadedSigilsHover = hoverSigils;
  loadedDestruction = destruction;

  // Set initial sigil
  applySigil(0);

  // Track hover on interactive elements
  setupHoverTracking();

  // Scroll thresholds — 25%, 50%, 75% of page height
  [0.25, 0.5, 0.75].forEach((threshold, index) => {
    ScrollTrigger.create({
      trigger: document.body,
      start: () => `top+=${document.body.scrollHeight * threshold} top`,
      onEnter: () => {
        const targetSigil = index + 1;
        if (targetSigil > deepestSigil) {
          deepestSigil = targetSigil;
          transitionSigil(targetSigil);
        }
      },
      // No onLeaveBack — the ritual is irreversible
    });
  });

  // Destruction button hover → sigil 5 (Lucifuge) in dried-blood color
  const destructionBtn = document.querySelector('[data-destruction-trigger]');
  if (destructionBtn) {
    destructionBtn.addEventListener('mouseenter', applyDestructionSigil);
    destructionBtn.addEventListener('mouseleave', () => applySigil(deepestSigil));
  }
}
