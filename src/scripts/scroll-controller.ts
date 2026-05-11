import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initScrollController() {
  // Section fade-ins: each .section fades in once on scroll
  gsap.utils.toArray<HTMLElement>('.section').forEach(section => {
    gsap.from(section, {
      opacity: 0,
      y: 30,
      duration: 1.2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 85%',
        once: true,
      }
    });
  });

  // GlitchTransition elements: trigger once on scroll-in
  gsap.utils.toArray<HTMLElement>('.glitch-container[data-trigger="scroll"]').forEach(el => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        el.classList.add('active');
        setTimeout(
          () => el.classList.remove('active'),
          parseInt(el.dataset.duration || '300')
        );
      }
    });
  });
}
