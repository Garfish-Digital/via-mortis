import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ── Asset paths ────────────────────────────────────────────────────────────

const PATHS = {
  primaryDrone:    '/assets/audio/drones/primary-drone.wav',
//   primaryDrone:    '/assets/audio/drones/796019__evanboyerman__uneasy-suspensful-horror-drone-atmosphere-loop.wav',
  secondaryDrone:  '/assets/audio/drones/492807__siyamahlobo__cold-breeze-ambience.wav',
  cursorChime:     '/assets/audio/cursor-chime/669008__department64__squeaky-scrape-10.flac',
  flash1:          '/assets/audio/flash/193818__geoneo0__four_voices_whispering_6_wecho.wav',
  flash2:          '/assets/audio/flash/846789__hotpin7__stingjumpscare.wav',
  destructionRumble: '/assets/audio/destruction-rumble/117129__juskiddink__low-tension-buildup.wav',
};

// ── Controller ─────────────────────────────────────────────────────────────

class AudioController {
  private primaryDrone:   HTMLAudioElement | null = null;
  private secondaryDrone: HTMLAudioElement | null = null;
  private isActive = false;

  init(): void {
    // Audio requires a prior user gesture — activate on first scroll or click
    const activate = () => {
      if (this.isActive) return;
      this.isActive = true;
      // Defer heavy work (audio pipeline + new ScrollTrigger instances) off the
      // scroll handler so the first scroll event isn't blocked by synchronous
      // ScrollTrigger.refresh() calls and browser audio-context setup.
      requestAnimationFrame(() => {
        this.startAmbient();
        this.setupScrollTriggers();
      });
    };

    window.addEventListener('scroll', activate, { once: true, passive: true });
    window.addEventListener('click',  activate, { once: true });
  }

  // ── Ambient ──────────────────────────────────────────────────────────────

  private startAmbient(): void {
    // Primary drone — fades in very slowly over 8s so the listener doesn't
    // consciously register its arrival
    this.primaryDrone = this.createLooping(PATHS.primaryDrone);
    this.primaryDrone.volume = 0;
    this.primaryDrone.play().catch(() => {});
    gsap.to(this.primaryDrone, { volume: 0.08, duration: 8, ease: 'power2.in' });

    // Secondary drone (breeze/atmosphere) — starts silent, raised near louvers
    this.secondaryDrone = this.createLooping(PATHS.secondaryDrone);
    this.secondaryDrone.volume = 0;
    this.secondaryDrone.play().catch(() => {});
  }

  // ── Scroll triggers ───────────────────────────────────────────────────────

  private setupScrollTriggers(): void {
    // Secondary drone swells in when any louver field is in view,
    // fades back out when the user leaves — ties audio to the visual texture
    document.querySelectorAll('.louver-field').forEach(field => {
      ScrollTrigger.create({
        trigger: field,
        start: 'top 80%',
        end: 'bottom 20%',
        onEnter:     () => gsap.to(this.secondaryDrone!, { volume: 0.06, duration: 2 }),
        onLeave:     () => gsap.to(this.secondaryDrone!, { volume: 0,    duration: 3 }),
        onEnterBack: () => gsap.to(this.secondaryDrone!, { volume: 0.06, duration: 2 }),
        onLeaveBack: () => gsap.to(this.secondaryDrone!, { volume: 0,    duration: 3 }),
      });
    });

    // Primary drone creeps slightly louder as the user descends —
    // barely perceptible but cumulative
    ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        if (this.primaryDrone && this.primaryDrone.volume > 0) {
          this.primaryDrone.volume = 0.08 + self.progress * 0.06;
        }
      },
    });

    // Expose sigil tone globally so cursor-controller can call it
    // without a direct import dependency
    (window as any).__playSignalTone = () => {
      this.oneShot(PATHS.cursorChime, 0.12);
    };
  }

  // ── Flash audio ──────────────────────────────────────────────────────────

  playFlash1(): void {
    // Whispering voices — unsettling but deniable
    this.oneShot(PATHS.flash1, 0.25);
  }

  playFlash2(): void {
    // Jump-scare sting — unmistakable
    this.oneShot(PATHS.flash2, 0.45);
  }

  // ── Destruction ──────────────────────────────────────────────────────────

  playDestructionRumble(): HTMLAudioElement | null {
    if (!this.isActive) return null;
    const rumble = new Audio(PATHS.destructionRumble);
    rumble.volume = 0;
    rumble.play().catch(() => {});
    gsap.to(rumble, { volume: 0.20, duration: 1.5, ease: 'power2.in' });
    gsap.to(rumble, { volume: 0.40, duration: 3,   delay: 1.5, ease: 'power2.in' });
    return rumble;
  }

  silenceAll(): void {
    if (this.primaryDrone)   gsap.to(this.primaryDrone,   { volume: 0, duration: 0.5 });
    if (this.secondaryDrone) gsap.to(this.secondaryDrone, { volume: 0, duration: 0.5 });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private createLooping(src: string): HTMLAudioElement {
    const audio = new Audio(src);
    audio.loop = true;
    audio.preload = 'auto';
    return audio;
  }

  private oneShot(src: string, volume: number): void {
    const audio = new Audio(src);
    audio.volume = volume;
    audio.play().catch(() => {});
  }
}

export const audioController = new AudioController();
