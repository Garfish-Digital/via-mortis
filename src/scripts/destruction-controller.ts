import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { audioController } from "./audio-controller";

gsap.registerPlugin(ScrollToPlugin);

/**
 * destruction-controller.ts — "The Hollowing"
 *
 * Timeline (ms):
 *   0      — Click. Interaction disabled, audio rumble starts
 *   0      — 24s scroll to top begins (power1.in — imperceptible during seizure,
 *            accelerates through decay, arrives at top for "Via Mortis remembers.")
 *   0–3000 — Seizure I: extreme shaking, skew, scale, blur, contrast,
 *            channel split, independent element tremor with scale jolts
 *   3000   — Tremor stops, elements ease back
 *   3200   — Seizure CSS ends. Page is monochrome, dimmed to 55%
 *   3200–4000 — Stillness. Brightness breath (0.55→0.45→0.53→0.45, spans into decay)
 *   4000   — Vignette starts closing from edges
 *   7500   — Seizure II: violent 1.5s aftershock on the dying page
 *   8000   — Ghost skeletons start fading IN (staggered 1.4s each)
 *   10000  — Real content falls: contact section time-based; others viewport-triggered
 *   16000  — Vignette at 45%
 *   20000  — Vignette at 30%
 *   24000  — Scroll reaches top. Vignette at 15%. Content visibility hidden.
 *   25000  — "Via Mortis remembers." fades in
 *   26000  — Fade to black (1.5s), ghosts out, audio silences
 *   35000  — Reload
 */

// ── Ghost recreation ──────────────────────────────────────────────────────

const GHOST_FILTER =
  "blur(2.5px) saturate(0.08) brightness(0.65) sepia(0.5) hue-rotate(155deg)";
const GHOST_IMAGE_FILTER = "invert(1) grayscale(1) blur(2px)";
const GHOST_OPACITY = 0.35;

// ── Palette ───────────────────────────────────────────────────────────────

const VOID_PRIMARY = "#0E1614";
const COLD_PALE_FOG = "#98AEB8";

// ── Timing constants (ms from t=0) ───────────────────────────────────────

const T_SEIZURE_END = 3000;
const T_SEIZURE_CSS_END = 3200;
const T_DECAY_START = 4000;
const T_GHOSTS_IN = 8000;
const T_CONTENT_OUT = 10000;
const T_SEIZURE_II = 7500; // aftershock
const T_SEIZURE_II_DUR = 1500; // aftershock duration
const T_VIG_45 = 16000;
const T_VIG_30 = 20000;
const T_VIG_15 = 24000;
const T_REMAINS = 24000;
const T_TEXT = 24500;
const T_FADE_BLACK = 26000;
const T_RELOAD = 28000;

const SEIZURE_CSS_MS = T_SEIZURE_CSS_END;

// ── Keyframe CSS ──────────────────────────────────────────────────────────
// Extracted as functions so they can be injected for both seizures.
// Hue-rotate removed — desaturation + contrast/brightness creates the horror
// without the campy color cycling.

function seizureKeyframes(name: string, durationMs: number): string {
  return `
    @keyframes ${name} {
      0%   { transform: translate(0, 0) skew(0deg, 0deg) scale(1, 1);
             filter: saturate(1) blur(0px) contrast(1) brightness(1); }
      2%   { transform: translate(-12px, 6px) skew(-2deg, 1deg) scale(1.02, 0.97);
             filter: saturate(0.8) blur(2px) contrast(1.6) brightness(0.7); }
      4%   { transform: translate(-3px, -15px) skew(2deg, -3deg) scale(0.96, 1.05);
             filter: saturate(0.65) blur(0px) contrast(0.5) brightness(1.5); }
      6%   { transform: translate(20px, -8px) skew(-4deg, 2deg) scale(1.05, 0.93);
             filter: saturate(0.5) blur(4px) contrast(2.0) brightness(0.5); }
      8%   { transform: translate(8px, 18px) skew(3deg, 4deg) scale(0.94, 1.07);
             filter: saturate(0.35) blur(0px) contrast(0.4) brightness(1.6); }
      10%  { transform: translate(-22px, -4px) skew(-5deg, -3deg) scale(1.07, 0.91);
             filter: saturate(0.25) blur(6px) contrast(2.3) brightness(0.4); }
      12%  { transform: translate(-15px, -12px) skew(4deg, 2deg) scale(0.92, 1.04);
             filter: saturate(0.2) blur(1px) contrast(1.4) brightness(1.3); }
      14%  { transform: translate(18px, 14px) skew(-3deg, -5deg) scale(1.04, 0.96);
             filter: saturate(0.15) blur(0px) contrast(0.3) brightness(1.7); }
      16%  { transform: translate(-4px, -22px) skew(5deg, 3deg) scale(0.97, 1.08);
             filter: saturate(0.12) blur(8px) contrast(2.5) brightness(0.35); }
      18%  { transform: translate(-18px, 9px) skew(-4deg, 4deg) scale(1.07, 0.93);
             filter: saturate(0.1) blur(2px) contrast(1.2) brightness(1.1); }
      20%  { transform: translate(15px, -3px) skew(2deg, -3deg) scale(0.93, 1.06);
             filter: saturate(0.08) blur(0px) contrast(2.4) brightness(0.5); }
      22%  { transform: translate(-2px, 16px) skew(-5deg, 3deg) scale(1.05, 0.94);
             filter: saturate(0.06) blur(7px) contrast(0.6) brightness(1.4); }
      25%  { transform: translate(-12px, -9px) skew(3deg, -2deg) scale(0.94, 1.02);
             filter: saturate(0.05) blur(3px) contrast(1.8) brightness(0.6); }
      28%  { transform: translate(14px, 4px) skew(-2deg, 4deg) scale(1.03, 0.96);
             filter: saturate(0.04) blur(1px) contrast(1.1) brightness(0.85); }
      31%  { transform: translate(-9px, -14px) skew(4deg, -2deg) scale(0.96, 1.05);
             filter: saturate(0.03) blur(5px) contrast(2.0) brightness(0.45); }
      34%  { transform: translate(11px, 8px) skew(-3deg, 3deg) scale(1.04, 0.94);
             filter: saturate(0.02) blur(0px) contrast(0.8) brightness(1.2); }
      38%  { transform: translate(-5px, -6px) skew(2deg, -1deg) scale(0.98, 1.03);
             filter: saturate(0.02) blur(3px) contrast(1.5) brightness(0.7); }
      42%  { transform: translate(7px, 3px) skew(-1.5deg, 2deg) scale(1.02, 0.98);
             filter: saturate(0.015) blur(1px) contrast(0.7) brightness(0.9); }
      46%  { transform: translate(-9px, -7px) skew(2deg, -1deg) scale(0.97, 1.02);
             filter: saturate(0.01) blur(4px) contrast(1.3) brightness(0.65); }
      50%  { transform: translate(4px, 5px) skew(-1deg, 1deg) scale(1.01, 0.99);
             filter: saturate(0.01) blur(2px) contrast(1.0) brightness(0.8); }
      55%  { transform: translate(-5px, -3px) skew(1deg, -1deg) scale(0.99, 1.01);
             filter: saturate(0.008) blur(1px) contrast(1.6) brightness(0.6); }
      60%  { transform: translate(2px, -1px) skew(-1.5deg, 0.5deg) scale(1, 1);
             filter: saturate(0.005) blur(0px) contrast(0.9) brightness(0.75); }
      65%  { transform: translate(-2px, 2px) skew(0.5deg, -0.5deg) scale(1, 1);
             filter: saturate(0.003) blur(2px) contrast(1.1) brightness(0.7); }
      70%  { transform: translate(1px, -1px) skew(-0.3deg, 0.2deg);
             filter: saturate(0.001) blur(0.5px) contrast(1.0) brightness(0.65); }
      75%  { transform: translate(-1px, 1px) skew(0.2deg, -0.1deg);
             filter: saturate(0) blur(0.3px) contrast(1.0) brightness(0.63); }
      80%  { transform: translate(0.5px, -0.5px) skew(-0.1deg, 0deg);
             filter: saturate(0) blur(0.2px) contrast(1.0) brightness(0.60); }
      85%  { transform: translate(-0.3px, 0.2px) skew(0deg, 0deg);
             filter: saturate(0) blur(0.1px) contrast(1.0) brightness(0.58); }
      90%  { transform: translate(0, 0);
             filter: saturate(0) blur(0.05px) contrast(1.0) brightness(0.57); }
      95%  { transform: translate(0, 0);
             filter: saturate(0) blur(0px) contrast(1.0) brightness(0.56); }
      100% { transform: translate(0, 0) skew(0deg, 0deg) scale(1, 1);
             filter: saturate(0) blur(0px) contrast(1.0) brightness(0.55); }
    }

    @keyframes ${name}-channel-split {
      0%   { text-shadow: 0 0 0 transparent; }
      3%   { text-shadow: -8px 0 rgba(90, 46, 46, 0.9), 8px 0 rgba(62, 47, 68, 0.9); }
      6%   { text-shadow: 14px 0 rgba(90, 46, 46, 0.7), -14px 0 rgba(62, 47, 68, 0.7); }
      9%   { text-shadow: -18px 0 rgba(90, 46, 46, 1.0), 18px 0 rgba(62, 47, 68, 1.0); }
      12%  { text-shadow: 10px 0 rgba(90, 46, 46, 0.6), -10px 0 rgba(62, 47, 68, 0.6); }
      16%  { text-shadow: -16px 0 rgba(90, 46, 46, 1.0), 16px 0 rgba(62, 47, 68, 1.0); }
      20%  { text-shadow: 6px 0 rgba(90, 46, 46, 0.8), -6px 0 rgba(62, 47, 68, 0.8); }
      25%  { text-shadow: -12px 0 rgba(90, 46, 46, 0.9), 12px 0 rgba(62, 47, 68, 0.9); }
      30%  { text-shadow: 4px 0 rgba(90, 46, 46, 0.5), -4px 0 rgba(62, 47, 68, 0.5); }
      40%  { text-shadow: -8px 0 rgba(90, 46, 46, 0.6), 8px 0 rgba(62, 47, 68, 0.6); }
      50%  { text-shadow: 6px 0 rgba(90, 46, 46, 0.4), -6px 0 rgba(62, 47, 68, 0.4); }
      60%  { text-shadow: -3px 0 rgba(90, 46, 46, 0.3), 3px 0 rgba(62, 47, 68, 0.3); }
      70%  { text-shadow: 2px 0 rgba(90, 46, 46, 0.2), -2px 0 rgba(62, 47, 68, 0.2); }
      80%  { text-shadow: -1px 0 rgba(90, 46, 46, 0.1), 1px 0 rgba(62, 47, 68, 0.1); }
      100% { text-shadow: 0 0 0 transparent; }
    }

    #main-content.${name} {
      animation: ${name} ${durationMs}ms cubic-bezier(0.25, 0.1, 0.25, 1) forwards !important;
      transition: none !important;
    }

    #main-content.${name} * {
      animation-play-state: paused !important;
    }

    #main-content.${name} h1,
    #main-content.${name} h2,
    #main-content.${name} h3,
    #main-content.${name} p {
      animation: ${name}-channel-split ${durationMs}ms ease-out forwards !important;
    }
  `;
}

// Aftershock keyframes — starts at full violence on an already-dead page,
// no wind-down, snaps back to the decayed state. No hue-rotate.
function aftershockKeyframes(name: string, durationMs: number): string {
  return `
    @keyframes ${name} {
      0%   { transform: translate(0, 0) skew(0deg, 0deg) scale(1, 1);
             filter: saturate(0) blur(0px) contrast(1.0) brightness(0.45); }
      3%   { transform: translate(-20px, 10px) skew(-5deg, 3deg) scale(0.92, 0.90);
             filter: saturate(0) blur(6px) contrast(2.5) brightness(0.3); }
      6%   { transform: translate(-8px, -22px) skew(4deg, -4deg) scale(1.08, 1.10);
             filter: saturate(0) blur(0px) contrast(0.3) brightness(1.8); }
      10%  { transform: translate(20px, 18px) skew(-5deg, 4deg) scale(0.90, 0.88);
             filter: saturate(0) blur(8px) contrast(2.5) brightness(0.25); }
      14%  { transform: translate(-22px, -6px) skew(5deg, -3deg) scale(1.10, 1.12);
             filter: saturate(0) blur(1px) contrast(0.4) brightness(1.6); }
      18%  { transform: translate(8px, -16px) skew(-4deg, -2deg) scale(0.93, 0.92);
             filter: saturate(0) blur(5px) contrast(2.2) brightness(0.35); }
      24%  { transform: translate(18px, 18px) skew(3deg, 4deg) scale(1.06, 1.06);
             filter: saturate(0) blur(3px) contrast(1.8) brightness(0.5); }
      30%  { transform: translate(-14px, 10px) skew(-3deg, 2deg) scale(0.95, 0.95);
             filter: saturate(0) blur(7px) contrast(0.6) brightness(1.3); }
      38%  { transform: translate(10px, -8px) skew(2deg, -3deg) scale(1.04, 1.03);
             filter: saturate(0) blur(2px) contrast(2.0) brightness(0.4); }
      48%  { transform: translate(-8px, 6px) skew(-2deg, 1deg) scale(0.97, 0.97);
             filter: saturate(0) blur(4px) contrast(1.4) brightness(0.55); }
      58%  { transform: translate(6px, -4px) skew(1deg, -1deg) scale(1.02, 1.01);
             filter: saturate(0) blur(1px) contrast(1.1) brightness(0.5); }
      70%  { transform: translate(-3px, 2px) skew(-0.5deg, 0.3deg) scale(0.99, 0.99);
             filter: saturate(0) blur(0.5px) contrast(1.0) brightness(0.47); }
      85%  { transform: translate(1px, -1px) skew(0deg, 0deg) scale(1, 1);
             filter: saturate(0) blur(0.2px) contrast(1.0) brightness(0.46); }
      100% { transform: translate(0, 0) skew(0deg, 0deg) scale(1, 1);
             filter: saturate(0) blur(0px) contrast(1.0) brightness(0.45); }
    }

    @keyframes ${name}-channel-split {
      0%   { text-shadow: 0 0 0 transparent; }
      5%   { text-shadow: -16px 0 rgba(90, 46, 46, 1.0), 16px 0 rgba(62, 47, 68, 1.0); }
      10%  { text-shadow: 20px 0 rgba(90, 46, 46, 0.8), -20px 0 rgba(62, 47, 68, 0.8); }
      18%  { text-shadow: -14px 0 rgba(90, 46, 46, 0.9), 14px 0 rgba(62, 47, 68, 0.9); }
      28%  { text-shadow: 8px 0 rgba(90, 46, 46, 0.6), -8px 0 rgba(62, 47, 68, 0.6); }
      40%  { text-shadow: -6px 0 rgba(90, 46, 46, 0.4), 6px 0 rgba(62, 47, 68, 0.4); }
      55%  { text-shadow: 3px 0 rgba(90, 46, 46, 0.2), -3px 0 rgba(62, 47, 68, 0.2); }
      75%  { text-shadow: -1px 0 rgba(90, 46, 46, 0.1), 1px 0 rgba(62, 47, 68, 0.1); }
      100% { text-shadow: 0 0 0 transparent; }
    }

    #main-content.${name} {
      animation: ${name} ${durationMs}ms cubic-bezier(0.15, 0.0, 0.35, 1) forwards !important;
      transition: none !important;
    }

    #main-content.${name} * {
      animation-play-state: paused !important;
    }

    #main-content.${name} h1,
    #main-content.${name} h2,
    #main-content.${name} h3,
    #main-content.${name} p {
      animation: ${name}-channel-split ${durationMs}ms ease-out forwards !important;
    }
  `;
}

// ── Sequence ──────────────────────────────────────────────────────────────

class TheHollowing {
  private btn: HTMLElement;
  private main: HTMLElement | null;
  private overlay: HTMLDivElement;
  private glitchStyle: HTMLStyleElement;
  private ghostElements: HTMLDivElement[] = [];
  private t0 = 0;

  constructor(btn: HTMLElement) {
    this.btn = btn;
    this.main = document.querySelector("#main-content");

    this.overlay = document.createElement("div");
    this.overlay.style.cssText =
      "position:fixed;top:0;left:0;width:100%;height:100%;" +
      "z-index:99998;pointer-events:none;opacity:0;";
    this.overlay.id = "hollowing-overlay";

    this.glitchStyle = document.createElement("style");
    this.glitchStyle.id = "hollowing-glitch";
  }

  async run(): Promise<void> {
    this.t0 = performance.now();

    this.disableInteraction();
    document.body.appendChild(this.overlay);
    document.head.appendChild(this.glitchStyle);

    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    audioController.playDestructionRumble();

    // 24s scroll to top with power1.in ease:
    // barely perceptible during seizure, accelerates through decay,
    // arrives at the top precisely for "Via Mortis remembers."
    gsap.to(window, {
      scrollTo: { y: 0 },
      duration: 24,
      ease: "power1.in",
    });

    // ── Movement I — The Seizure (0–3200ms) ─────────────────────────────
    await this.seizure();

    // ── Stillness gap (3200–4000ms) ─────────────────────────────────────
    await this.stillness();

    // ── Movement II — The Decay (4000–24000ms) ──────────────────────────
    await this.decay();

    // ── Movement III — The Remains (24000–35000ms) ──────────────────────
    await this.remains();
  }

  // ── Movement I — The Seizure (0–3200ms) ───────────────────────────────

  private async seizure(): Promise<void> {
    if (!this.main) return;

    this.glitchStyle.textContent = seizureKeyframes(
      "hollowing-seizure",
      SEIZURE_CSS_MS,
    );
    this.main.classList.add("hollowing-seizure");

    const targets = this.getTargets();
    let intensity = 2;
    const tremorId = setInterval(() => {
      //   intensity = Math.min(intensity + 1.6, 20);
      const progress = (performance.now() - this.t0) / T_SEIZURE_END;

      if (progress < 0.55) {
        intensity = 4 + progress * 22;
      } else {
        intensity = 8 - ((progress - 0.55) / 0.45) * 6;
      }

      targets.forEach((el) => {
        //   const dx = (Math.random() - 0.5) * intensity * 2;
        //   const dy = (Math.random() - 0.5) * intensity * 2;
        const dx = (Math.random() - 0.5) * intensity;
        const dy = (Math.random() - 0.5) * intensity;
        // const sx = 1 + (Math.random() - 0.5) * 0.04 * (intensity / 20);
        // const sy = 1 + (Math.random() - 0.5) * 0.06 * (intensity / 20);
        const sx = 1 + (Math.random() - 0.5) * 0.02 * (intensity / 20);
        const sy = 1 + (Math.random() - 0.5) * 0.03 * (intensity / 20);
        el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
      });
    }, 35);

    await sleep(T_SEIZURE_END);

    clearInterval(tremorId);
    targets.forEach((el) => {
      el.style.transition = "transform 0.4s ease-out";
      el.style.transform = "translate(0, 0) scale(1, 1)";
    });

    await sleep(T_SEIZURE_CSS_END - T_SEIZURE_END);
  }

  // ── Stillness (3200–4000ms) ───────────────────────────────────────────

  private async stillness(): Promise<void> {
    if (!this.main) return;

    this.main.classList.remove("hollowing-seizure");
    this.main.style.transition = "none";
    this.glitchStyle.textContent = "";

    // Drop to monochrome. GSAP owns filter from here — no CSS transitions.
    gsap.set(this.main, { filter: "saturate(0) brightness(0.55)" });

    // Breath: drop to 0.45, swell faintly to 0.53, settle back to 0.45.
    // Total 2.8s — spans stillness into early decay, imperceptible under the
    // accumulating vignette.
    gsap
      .timeline()
      .to(this.main, {
        filter: "saturate(0) brightness(0.45)",
        duration: 0.3,
        ease: "power2.in",
      })
      .to(this.main, {
        filter: "saturate(0) brightness(0.53)",
        duration: 1.25,
        ease: "sine.inOut",
      })
      .to(this.main, {
        filter: "saturate(0) brightness(0.45)",
        duration: 1.25,
        ease: "sine.inOut",
      });

    await sleep(T_DECAY_START - T_SEIZURE_CSS_END);
  }

  // ── Movement II — The Decay (4000–24000ms) ────────────────────────────

  private async decay(): Promise<void> {
    if (!this.main) return;

    // Show vignette overlay
    this.overlay.style.transition = "none";
    this.overlay.style.opacity = "1";
    this.overlay.style.background = `radial-gradient(
      ellipse at center,
      transparent 60%,
      ${VOID_PRIMARY} 100%
    )`;

    this.scheduleVignette();

    // Create ghost overlays (opacity 0 until T_GHOSTS_IN)
    const ghostHosts = this.getGhostHosts();
    for (const host of ghostHosts) {
      this.createDeathGhost(host);
    }

    const ghostDelay = T_GHOSTS_IN - T_DECAY_START;
    this.ghostElements.forEach((ghost, i) => {
      gsap.to(ghost, {
        opacity: GHOST_OPACITY,
        duration: 2.5,
        ease: "power2.out",
        delay: ghostDelay / 1000 + i * 1.4,
      });
    });

    const targets = this.getTargets();
    const contentDelay = T_CONTENT_OUT - T_DECAY_START;

    // ── Contact section: time-based fall at T_CONTENT_OUT ────────────────
    // These elements are visible on load (bottom of page). They fall immediately
    // when the fall window opens, before the scroll has moved far.
    const contactTargets = targets.filter(
      (el) => el.closest(".contact-section") !== null,
    );
    setTimeout(() => {
      contactTargets.forEach((el, i) => {
        setTimeout(() => this.executeFall(el), i * 280);
      });
    }, contentDelay);

    // Button dissolves with contact section
    gsap.to(this.btn, {
      opacity: 0,
      duration: 2,
      ease: "power1.in",
      delay: contentDelay / 1000,
    });

    // ── All other targets: viewport-triggered physics falls ───────────────
    // Hero elements are excluded — they persist into the "remains" phase,
    // holding the page as a monument while ghosts breathe around them.
    const fallTargets = targets.filter(
      (el) =>
        el.closest(".contact-section") === null &&
        el.closest("[data-ghost-hero]") === null,
    );

    // Ticker starts at T_CONTENT_OUT. As the slow-then-accelerating scroll
    // brings each section into view, its elements detach and fall.
    setTimeout(() => {
      this.startFallTicker(fallTargets, T_VIG_15 - T_CONTENT_OUT);
    }, contentDelay);

    // ── Seizure II — Aftershock ──────────────────────────────────────────
    const aftershockDelay = T_SEIZURE_II - T_DECAY_START;
    setTimeout(() => this.aftershock(), aftershockDelay);


    await sleep(T_VIG_15 - T_DECAY_START);

    if (this.main) this.main.style.visibility = "hidden";
    this.btn.style.visibility = "hidden";
  }

  // ── Element fall physics ──────────────────────────────────────────────

  private classifyElement(el: HTMLElement): "hinge" | "shear" | "drift" {
    const hasImage =
      el.querySelector("img") !== null || el.tagName.toLowerCase() === "img";
    const cls = el.className || "";

    // Large blocky / image-bearing elements: structurally hinge-eligible.
    // But uniformly hinging every card reads as repetitive choreography rather
    // than chaotic destruction. Most fall under gravity (drift); a minority
    // hinge for visual variety.
    const isHingeEligible =
      hasImage ||
      cls.includes("post-card") ||
      cls.includes("event-card") ||
      cls.includes("story-image") ||
      cls.includes("events-image-item") ||
      el.offsetHeight > 150;

    if (isHingeEligible) {
      const HINGE_PROBABILITY = 0.33; // ~1 in 3 hinges; rest drift
      return Math.random() < HINGE_PROBABILITY ? "hinge" : "drift";
    }

    // Text elements shear diagonally — they have no structural integrity
    const tag = el.tagName.toLowerCase();
    if (tag === "h1" || tag === "h2" || tag === "h3" || tag === "p") {
      return "shear";
    }

    return "drift";
  }

  private executeFall(el: HTMLElement): void {
    const rect = el.getBoundingClientRect();

    if (rect.width < 10 || rect.height < 10) {
      gsap.set(el, { opacity: 0 });
      return;
    }

    // Clone to a fixed position matching the element's current viewport location
    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      margin: 0;
      pointer-events: none;
      z-index: 9000;
      box-sizing: border-box;
      overflow: hidden;
    `;
    document.body.appendChild(clone);

    // Hide original immediately; clone carries the animation
    gsap.set(el, { opacity: 0 });

    const type = this.classifyElement(el);
    let fallPromise: Promise<void>;

    if (type === "hinge") {
      fallPromise = this.hingeFall(clone, rect);
    } else if (type === "shear") {
      fallPromise = this.shearFall(clone);
    } else {
      fallPromise = this.driftFall(clone);
    }

    fallPromise.then(() => clone.remove());
  }

  private hingeFall(clone: HTMLElement, rect: DOMRect): Promise<void> {
    return new Promise(resolve => {
      const leftBias = Math.random() > 0.5;
      const sign = leftBias ? 1 : -1;

      const xPivot = leftBias
        ? `${Math.random() * 16}%`
        : `${84 + Math.random() * 16}%`;
      const pivot = `${xPivot} 0%`;

      const releaseY = window.innerHeight - rect.top + 160;

      // Pendulum dynamics: initial swing → overshoot → rebound → damped second swing → release.
      // Peak intentionally restrained so there's room for overshoot and rebound
      // before the hinge gives way — this is what reads as "weighted" rather than
      // "rotated to target."
      const peakAngle    = sign * (38 + Math.random() * 14);                  // 38–52° first peak (mp ~45°)
      const reboundAngle = peakAngle * (0.45 + Math.random() * 0.15);         // settles back to 45–60% of peak
      const secondPeak   = peakAngle * (0.85 + Math.random() * 0.10);         // damped second swing
      const releaseAngle = peakAngle + sign * (45 + Math.random() * 30);      // continued angular momentum during fall

      const holdDelay = Math.random() * 0.28;

      const tl = gsap.timeline({ onComplete: resolve });

      tl.set(clone, { transformOrigin: pivot });

      // 1. Micro-sag — element's weight settles on the hinge, slight back-tip
      tl.to(clone, {
        y: 2 + Math.random() * 2,
        rotation: sign * -2,
        duration: holdDelay + 0.10,
        ease: "power1.out"
      });

      // 2. First heavy swing — gravity wins, accelerates through equilibrium
      tl.to(clone, {
        rotation: peakAngle,
        duration: 0.34 + Math.random() * 0.10,
        ease: "power2.in"
      });

      // 3. Rebound — kinetic energy decelerates the swing, pulls it partway back
      tl.to(clone, {
        rotation: reboundAngle,
        duration: 0.26 + Math.random() * 0.08,
        ease: "power2.out"
      });

      // 4. Damped second swing — smaller amplitude, smooth in-out
      tl.to(clone, {
        rotation: secondPeak,
        duration: 0.22 + Math.random() * 0.06,
        ease: "power1.inOut"
      });

      // 5. Hinge fails — element falls with continuing angular momentum
      tl.to(clone, {
        y: releaseY,
        x: (Math.random() - 0.5) * 90,
        rotation: releaseAngle,
        opacity: 0,
        duration: 0.85 + Math.random() * 0.25,
        ease: "power3.in"
      });
    });
  }



//   private hingeFall(clone: HTMLElement, rect: DOMRect): Promise<void> {
//     return new Promise((resolve) => {
//       const leftBias = Math.random() > 0.5;

//       const xPivot = leftBias
//         ? `${Math.random() * 18}%`
//         : `${82 + Math.random() * 18}%`;

//       const pivot = `${xPivot} 0%`;
//       const sign = leftBias ? 1 : -1;

//       const finalY = window.innerHeight - rect.top + 160;

//       const releaseAngle = sign * (70 + Math.random() * 20);
//       const tumbleAngle = sign * (110 + Math.random() * 80);

//       const hesitation = 0.05 + Math.random() * 0.28; // huge realism gain
//       const swing1Dur = 0.22 + Math.random() * 0.16;
//       const swing2Dur = 0.18 + Math.random() * 0.14;
//       const releaseDur = 0.75 + Math.random() * 0.45;

//       const overswing = sign * (42 + Math.random() * 18);
//       const recoil = sign * (18 + Math.random() * 14);

//       const tl = gsap.timeline({ onComplete: resolve });

//       tl.set(clone, {
//         transformOrigin: pivot,
//       });

//       // subtle structural sag
//       tl.to(clone, {
//         rotation: -sign * (2 + Math.random() * 3),
//         x: (Math.random() - 0.5) * 2,
//         y: 2 + Math.random() * 3,
//         duration: hesitation,
//         ease: "power1.out",
//       });

//       // first heavy swing
//       tl.to(clone, {
//         rotation: overswing,
//         y: 6,
//         duration: swing1Dur,
//         ease: "power2.in",
//       });

//       // recoil / catches briefly
//       tl.to(clone, {
//         rotation: recoil,
//         duration: swing2Dur,
//         ease: "power1.out",
//       });

//       // final failure — rips free
//       tl.to(clone, {
//         rotation: releaseAngle,
//         duration: 0.16 + Math.random() * 0.12,
//         ease: "power3.in",
//       });

//       // detached fall
//       tl.to(clone, {
//         y: finalY,
//         rotation: tumbleAngle,
//         x: (Math.random() - 0.5) * 120,
//         opacity: 0,
//         duration: releaseDur,
//         ease: "power4.in",
//       });
//     });
//   }

  //   private hingeFall(clone: HTMLElement, rect: DOMRect): Promise<void> {
  //     return new Promise((resolve) => {
  //       const leftBias = Math.random() > 0.5;

  //       const xPivot = leftBias
  //         ? `${Math.random() * 18}%`
  //         : `${82 + Math.random() * 18}%`;

  //       const pivot = `${xPivot} 0%`;

  //       const sign = leftBias ? 1 : -1;

  //       const finalY = window.innerHeight - rect.top + 140;
  //       const finalRot = sign * (88 + Math.random() * 18);

  //       const tl = gsap.timeline({ onComplete: resolve });

  //       tl.set(clone, {
  //         transformOrigin: pivot,
  //       });

  //       // slight tension opposite direction
  //       tl.to(clone, {
  //         rotation: -sign * (4 + Math.random() * 3),
  //         duration: 0.12,
  //         ease: "power2.out",
  //       });

  //       // heavy swing downward
  //       tl.to(clone, {
  //         rotation: sign * (52 + Math.random() * 12),
  //         duration: 0.38,
  //         ease: "power2.in",
  //       });

  //       // recoil
  //       tl.to(clone, {
  //         rotation: sign * (36 + Math.random() * 10),
  //         duration: 0.18,
  //         ease: "power1.out",
  //       });

  //       // collapse / detach
  //       tl.to(clone, {
  //         rotation: finalRot,
  //         y: finalY,
  //         opacity: 0,
  //         duration: 0.95,
  //         ease: "power3.in",
  //       });
  //     });
  //   }

  //   private hingeFall(clone: HTMLElement, rect: DOMRect): Promise<void> {
  //     return new Promise(resolve => {
  //       // Pivot from a randomly chosen corner — structural failure has no logic
  //       const pivotSide = Math.random() > 0.5 ? 'top left' : 'top right';
  //       const sign = pivotSide === 'top left' ? 1 : -1;
  //       const finalRotation = sign * (80 + Math.random() * 20);
  //       const finalY = window.innerHeight - rect.top + 100;

  //       const tl = gsap.timeline({ onComplete: resolve });

  //       // Phase 1: micro-resistance — the hinge holds for a moment
  //       tl.to(clone, {
  //         rotation: -sign * (3 + Math.random() * 5),
  //         transformOrigin: pivotSide,
  //         duration: 0.12,
  //         ease: 'power2.out',
  //       });

  //       // Phase 2: hinge opening — structural failure begins
  //       tl.to(clone, {
  //         rotation: finalRotation * 0.55,
  //         transformOrigin: pivotSide,
  //         duration: 0.5,
  //         ease: 'power1.in',
  //       });

  //       // Phase 3: gravity wins — dissolves as it falls
  //       tl.to(clone, {
  //         rotation: finalRotation,
  //         y: finalY,
  //         opacity: 0,
  //         transformOrigin: pivotSide,
  //         duration: 0.85,
  //         ease: 'power3.in',
  //       });
  //     });
  //   }

  private shearFall(clone: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      const dir = Math.random() > 0.5 ? 1 : -1;
      const skewAmt = 8 + Math.random() * 8;
      const xDrift = dir * (80 + Math.random() * 120);
      const yFall =
        window.innerHeight * 0.5 + Math.random() * window.innerHeight * 0.5;

      gsap.to(clone, {
        skewX: skewAmt * dir,
        x: xDrift,
        y: yFall,
        opacity: 0,
        duration: 0.9 + Math.random() * 0.4,
        ease: "power2.in",
        onComplete: resolve,
      });
    });
  }

  private driftFall(clone: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      const xDrift = (Math.random() - 0.5) * 180;
      const yFall =
        window.innerHeight * 0.4 + Math.random() * window.innerHeight * 0.6;
      const rotation = (Math.random() - 0.5) * 35;

      gsap.to(clone, {
        x: xDrift,
        y: yFall,
        rotation,
        opacity: 0,
        duration: 1.2 + Math.random() * 0.8,
        ease: "power1.in",
        delay: 0.15 + Math.random() * 0.1,
        onComplete: resolve,
      });
    });
  }

  private startFallTicker(
    fallTargets: HTMLElement[],
    killAfterMs: number,
  ): void {
    const pending = new Set(fallTargets);
    let killed = false;

    const tick = () => {
      if (killed || pending.size === 0) return;

      pending.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // Trigger when element enters viewport (with a small threshold buffer)
        const inViewport =
          rect.top < window.innerHeight * 0.92 && rect.bottom > 0;

        if (inViewport) {
          pending.delete(el);
          //   this.executeFall(el);
          setTimeout(() => {
            this.executeFall(el);
          }, Math.random() * 280);
        }
      });
    };

    gsap.ticker.add(tick);

    // Safety cleanup: fade out any elements the scroll never reached
    setTimeout(() => {
      killed = true;
      gsap.ticker.remove(tick);
      pending.forEach((el) => gsap.to(el, { opacity: 0, duration: 0.6 }));
    }, killAfterMs);
  }

  // ── Seizure II — Aftershock (1.5s at 7500ms) ─────────────────────────
  // The page convulses mid-death. No wind-down — full violence on the
  // already-desaturated page, snaps back to decaying state.

  private aftershock(): void {
    if (!this.main) return;

    this.glitchStyle.textContent = aftershockKeyframes(
      "hollowing-aftershock",
      T_SEIZURE_II_DUR,
    );
    this.main.classList.add("hollowing-aftershock");

    const targets = this.getTargets();
    const tremorId = setInterval(() => {
      targets.forEach((el) => {
        const dx = (Math.random() - 0.5) * 36;
        const dy = (Math.random() - 0.5) * 36;
        const sx = 1 + (Math.random() - 0.5) * 0.08;
        const sy = 1 + (Math.random() - 0.5) * 0.1;
        el.style.transition = "none";
        el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
      });
    }, 30);

    setTimeout(() => {
      clearInterval(tremorId);
      if (this.main) {
        this.main.classList.remove("hollowing-aftershock");
        this.main.style.filter = "saturate(0) brightness(0.45)";
      }
      targets.forEach((el) => {
        el.style.transition = "transform 0.3s ease-out";
        el.style.transform = "translate(0, 0) scale(1, 1)";
      });
      this.glitchStyle.textContent = "";
    }, T_SEIZURE_II_DUR);
  }

  // ── Movement III — The Remains (24000–35000ms) ────────────────────────

  private async remains(): Promise<void> {
    this.ghostElements.forEach((ghost) => {
      gsap.to(ghost, {
        opacity: GHOST_OPACITY * 0.4,
        duration: 3,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    });

    await sleep(T_TEXT - T_REMAINS);
    this.showFinalText();

    await sleep(T_FADE_BLACK - T_TEXT);
    this.fadeToBlack();
    audioController.silenceAll();

    await sleep(T_RELOAD - T_FADE_BLACK);
    window.scrollTo(0, 0);
    window.location.reload();
  }

  // ── Ghost creation ────────────────────────────────────────────────────

  private getGhostHosts(): HTMLElement[] {
    const hosts: HTMLElement[] = [];
    const hero = document.querySelector<HTMLElement>("[data-ghost-hero]");
    if (hero) hosts.push(hero);
    document
      .querySelectorAll<HTMLElement>("[data-ghost-reveal]")
      .forEach((el) => {
        hosts.push(el);
      });
    return hosts;
  }

  private createDeathGhost(host: HTMLElement): void {
    const realContent = host.querySelector(".ghost-real-content");
    if (!realContent) return;

    const ghost = document.createElement("div");
    ghost.className = "hollowing-ghost";
    ghost.setAttribute("aria-hidden", "true");
    ghost.innerHTML = realContent.innerHTML;

    ghost.querySelectorAll("script, style").forEach((s) => s.remove());
    ghost.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    ghost.querySelectorAll("img").forEach((img) => {
      (img as HTMLImageElement).style.filter = GHOST_IMAGE_FILTER;
    });
    ghost.querySelectorAll<HTMLElement>("*").forEach((child) => {
      if (getComputedStyle(child).opacity === "0") {
        child.style.opacity = "1";
      }
    });

    const hostStyle = getComputedStyle(host);
    ghost.style.cssText = `
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      z-index: 10;
      opacity: 0;
      filter: ${GHOST_FILTER};
      overflow: hidden;
      display: ${hostStyle.display};
      flex-direction: ${hostStyle.flexDirection};
      align-items: ${hostStyle.alignItems};
      justify-content: ${hostStyle.justifyContent};
      gap: ${hostStyle.gap};
    `;

    if (getComputedStyle(host).position === "static") {
      host.style.position = "relative";
    }

    host.appendChild(ghost);
    this.ghostElements.push(ghost);
  }

  // ── Vignette ──────────────────────────────────────────────────────────

  private scheduleVignette(): void {
    const steps = [
      { at: 0, transparent: "60%", dark: "100%" },
      { at: T_VIG_45 - T_DECAY_START, transparent: "45%", dark: "90%" },
      { at: T_VIG_30 - T_DECAY_START, transparent: "30%", dark: "80%" },
      { at: T_VIG_15 - T_DECAY_START, transparent: "15%", dark: "70%" },
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        this.overlay.style.transition = "background 4s ease";
        this.overlay.style.background = `radial-gradient(
          ellipse at center,
          transparent ${step.transparent},
          ${VOID_PRIMARY} ${step.dark}
        )`;
      }, step.at);
    });
  }

  // ── Final text — stone inscription ────────────────────────────────────
  // Directional text-shadow simulates letters carved into stone:
  // a highlight catches the upper lip of each groove, a deep shadow
  // pools at its base.

  private showFinalText(): void {
    const text = document.createElement("div");
    text.textContent = "Via Mortis remembers";
    text.style.cssText =
      "position:fixed;top:55%;left:50%;transform:translate(-50%,-50%);" +
      `font-family:'IM Fell English',serif;font-style:italic;font-size:2.1rem;` +
      `color:#8FA4AD;opacity:0;z-index:100000;pointer-events:none;white-space:nowrap;` +
      "text-shadow:" +
      "0 -1px 1px rgba(180,200,210,0.25)," + // highlight: light catches the carved lip
      "0 2px 3px rgba(0,0,0,0.7)," + // deep shadow: base of groove
      "0 1px 8px rgba(0,0,0,0.4);" + // ambient: letter depth
      "transition:opacity 1.5s ease;";
    document.body.appendChild(text);

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        text.style.opacity = ".9";
      }),
    );
  }

  // ── Fade to black ─────────────────────────────────────────────────────

  private fadeToBlack(): void {
    this.overlay.style.transition = "background 1.5s ease";
    this.overlay.style.background = VOID_PRIMARY;

    this.ghostElements.forEach((ghost) => {
      gsap.killTweensOf(ghost);
      gsap.to(ghost, { opacity: 0, duration: 1.5, ease: "power1.in" });
    });
  }

  // ── Utilities ─────────────────────────────────────────────────────────

  private getTargets(): HTMLElement[] {
    return Array.from(
      document.querySelectorAll<HTMLElement>("[data-destructible]"),
    ).filter(
      (el) =>
        !el.hasAttribute("data-destruction-trigger") &&
        !el.closest("[data-destruction-trigger]"),
    );
  }

  private disableInteraction(): void {
    document.body.style.overflow = "hidden";
    document
      .querySelectorAll<HTMLElement>(
        "a, button:not([data-destruction-trigger])",
      )
      .forEach((el) => {
        el.style.pointerEvents = "none";
      });
  }
}

// ── Entry point ───────────────────────────────────────────────────────────

let running = false;

export function initDestruction(): void {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  window.addEventListener("beforeunload", () => {
    window.scrollTo(0, 0);
  });

  document.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>(
      "[data-destruction-trigger]",
    );
    if (!btn || running) return;
    running = true;
    e.preventDefault();
    e.stopPropagation();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reducedMotion(btn);
      return;
    }

    new TheHollowing(btn).run();
  });
}

// ── Reduced motion fallback ───────────────────────────────────────────────

function reducedMotion(btn: HTMLElement): void {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  gsap.to(btn, { opacity: 0, duration: 1.5 });

  const overlay = document.createElement("div");
  overlay.style.cssText =
    `position:fixed;top:0;left:0;width:100%;height:100%;background:${VOID_PRIMARY};` +
    "z-index:99998;opacity:0;transition:opacity 1.5s ease;pointer-events:none;";
  document.body.appendChild(overlay);

  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
    }),
  );

  const text = document.createElement("div");
  text.textContent = "Via Mortis remembers.";
  text.style.cssText =
    "position:fixed;top:55%;left:50%;transform:translate(-50%,-50%);" +
    `font-family:'IM Fell English',serif;font-style:italic;font-size:2.1rem;` +
    `color:#8FA4AD;opacity:0;z-index:100000;pointer-events:none;white-space:nowrap;` +
    "text-shadow:" +
    "0 -1px 1px rgba(180,200,210,0.25)," +
    "0 2px 3px rgba(0,0,0,0.7)," +
    "0 1px 8px rgba(0,0,0,0.4);" +
    "transition:opacity 1.5s ease;";
  document.body.appendChild(text);
  setTimeout(() => {
    text.style.opacity = "1";
  }, 2200);

  audioController.silenceAll();
  setTimeout(() => {
    window.scrollTo(0, 0);
    window.location.reload();
  }, 5000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const destructionButton = document.querySelector(".destruction-button");
if (destructionButton) {
  destructionButton.addEventListener("click", () => {
    let heroTitle = document.querySelector<HTMLElement>("[data-ghost-hero] h1");
    let heroOpacity = 1;

    function killHeroTitle(): void {
      setTimeout(() => {
        if (heroOpacity > 0) {
          heroOpacity -= 0.05;
          heroTitle?.style.setProperty("opacity", heroOpacity.toString());
          killHeroTitle();
        }
      }, 50);
    }

    setTimeout(() => {
      if (heroTitle) heroTitle.style.transition = 'none';
      killHeroTitle();
    }, 20000);
  });
}
