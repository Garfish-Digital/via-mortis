import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initLouverParallax(): void {
  const louverFields = document.querySelectorAll<HTMLElement>('.louver-field');

  louverFields.forEach(field => {
    const imageLayer = field.querySelector<HTMLElement>('.louver-image-layer');
    if (!imageLayer) return;

    const direction = field.dataset.parallaxDirection ?? 'diagonal-right';

    let xPercent = 0;
    let yPercent = 0;

    switch (direction) {
      case 'diagonal-right':
        xPercent =  8;
        yPercent = 15;
        break;
      case 'diagonal-left':
        xPercent = -8;
        yPercent = 15;
        break;
      case 'horizontal':
        xPercent = 12;
        yPercent =  0;
        break;
    }

    // Single shared image layer — moves diagonally as the user scrolls past
    gsap.fromTo(
      imageLayer,
      { xPercent: -xPercent / 2, yPercent: -yPercent / 2 },
      {
        xPercent:  xPercent / 2,
        yPercent:  yPercent / 2,
        ease: 'none',
        scrollTrigger: {
          trigger: field,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );

    // Multi-speed variant: each slit's dedicated image layer moves at its own rate.
    // Only active when the component is marked data-multi-speed="true".
    if (field.dataset.multiSpeed === 'true') {
      const slitImages = field.querySelectorAll<HTMLElement>('.slit-image-layer');
      slitImages.forEach((img, i) => {
        const speed = 0.6 + i * 0.2; // each slit progressively faster
        gsap.fromTo(
          img,
          { xPercent: (-xPercent * speed) / 2, yPercent: (-yPercent * speed) / 2 },
          {
            xPercent:  (xPercent * speed) / 2,
            yPercent:  (yPercent * speed) / 2,
            ease: 'none',
            scrollTrigger: {
              trigger: field,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.5,
            },
          }
        );
      });
    }
  });
}
