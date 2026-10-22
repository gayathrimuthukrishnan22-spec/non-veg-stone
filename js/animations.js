/**
 * animations.js
 * ---------------------------------------------------------------------
 * All GSAP-driven motion: the loader's 5-second sequence, scroll
 * reveals for [data-reveal] elements, and desktop-only card tilt.
 * Three.js handles the 3D layer; this file handles DOM/CSS motion.
 */
(function () {
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HAS_GSAP = typeof gsap !== 'undefined';

  if (HAS_GSAP && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  if (REDUCED_MOTION) {
    document.documentElement.classList.add('reduced-motion');
  }

  /**
   * Runs the 5-second cinematic loader sequence described in the brief:
   *   0–1s  logo fades in
   *   1–2s  3D objects appear (handled by three-scene.js scaleIn)
   *   2–4s  objects rotate/float (already running in three-scene.js)
   *   4–5s  logo + scene scale smoothly
   *   5s    loader fades into homepage
   *
   * @param {object} loaderScene - the object returned by NonVegThree.initLoaderScene()
   * @param {function} onComplete - called once the loader has fully faded out
   */
  function runLoaderSequence(loaderScene, onComplete) {
    const loaderEl = document.getElementById('loader');
    const content = document.querySelector('.loader-content');
    const barFill = document.getElementById('loader-bar-fill');

    // Reduced-motion users get an instant, calm 1-second fade instead
    // of the full 5-second cinematic sequence.
    if (REDUCED_MOTION || !HAS_GSAP) {
      if (content) content.style.opacity = 1;
      setTimeout(() => finishLoader(), 900);
      return;
    }

    const tl = gsap.timeline();

    tl.to(content, { opacity: 1, duration: 1, ease: 'power2.out' }, 0);
    tl.to(barFill, { width: '20%', duration: 1, ease: 'power2.out' }, 0);

    tl.call(() => { if (loaderScene && loaderScene.scaleIn) loaderScene.scaleIn(); }, null, 1);
    tl.to(barFill, { width: '55%', duration: 1, ease: 'power2.inOut' }, 1);

    tl.to(barFill, { width: '90%', duration: 2, ease: 'power1.inOut' }, 2);

    tl.to(content, { scale: 1.06, duration: 1, ease: 'power2.inOut' }, 4);
    tl.to(barFill, { width: '100%', duration: 1, ease: 'power2.out' }, 4);

    tl.call(() => finishLoader(), null, 5);

    function finishLoader() {
      if (loaderEl) {
        loaderEl.classList.add('loader-hidden');
        setTimeout(() => {
          loaderEl.style.display = 'none';
          if (onComplete) onComplete();
        }, 800); // matches the CSS opacity/visibility transition duration
      } else if (onComplete) {
        onComplete();
      }
    }
  }

  /**
   * Scroll reveal: fades + rises any [data-reveal] element into place.
   * Uses IntersectionObserver (spec-preferred over scroll listeners)
   * so it works even without GSAP's ScrollTrigger, and stacks with it
   * when available for stagger support within a shared container.
   */
  function initScrollReveals() {
    const items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;

    if (REDUCED_MOTION) {
      items.forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (HAS_GSAP) {
          gsap.to(el, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
        } else {
          el.style.transition = 'opacity .6s ease, transform .6s ease';
          el.style.opacity = 1;
          el.style.transform = 'none';
        }
        observer.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px 10% 0px' });

    items.forEach(el => observer.observe(el));
  }

  /**
   * Desktop-only 3D tilt on product/category cards. Mobile relies on
   * the CSS :active / touch styles instead, per the spec's requirement
   * to avoid hover-only interactions on touch devices.
   */
  function initCardTilt() {
    if (window.matchMedia('(hover: none)').matches || REDUCED_MOTION) return;

    const cards = document.querySelectorAll('.product-card, .category-card, .contact-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        const rotateX = (-py * 6).toFixed(2);
        const rotateY = (px * 6).toFixed(2);
        card.style.transform = `translateY(-8px) perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  window.NonVegAnimations = { runLoaderSequence, initScrollReveals, initCardTilt };
})();
