/**
 * main.js
 * ---------------------------------------------------------------------
 * Global configuration + orchestration for NonVeg.Store.
 * Keeps all client-specific information (phone, WhatsApp, hours,
 * socials) in one place so this template can be reused for a
 * different business by editing BUSINESS_CONFIG only — no HTML edits
 * required for contact details.
 */

/**
 * Business configuration.
 * Replace these placeholder values with the real business details
 * before deploying. See README.md → "How to change phone number" etc.
 */
const BUSINESS_CONFIG = {
  name: 'NonVeg.Store',
  // E.164 format with country code, used for the tel: link.
  phone: '+91XXXXXXXXXX',
  // WhatsApp number WITHOUT the leading "+", used to build the wa.me link.
  whatsapp: '91XXXXXXXXXX',
  whatsappDefaultMessage: "Hi NonVeg.Store, I'd like to know more about your non-veg options.",
  location: 'Your City, Tamil Nadu, India',
  hours: '7:00 AM – 9:00 PM, all days',
  email: 'hello@nonveg.store',
  social: {
    instagram: 'https://instagram.com/',
    facebook: 'https://facebook.com/'
  }
};

(function () {
  /* -------------------------------------------------------------------
     Wire up all call / WhatsApp / social / location / hours elements
     from the single BUSINESS_CONFIG source of truth.
  ------------------------------------------------------------------- */
  function applyBusinessConfig() {
    if (BUSINESS_CONFIG.phone.includes('X') || BUSINESS_CONFIG.whatsapp.includes('X')) {
      console.warn(
        '[NonVeg.Store] BUSINESS_CONFIG.phone / BUSINESS_CONFIG.whatsapp in js/main.js still ' +
        'contain the placeholder "XXXXXXXXXX". Call and WhatsApp buttons will not work correctly ' +
        'until you replace them with the real numbers.'
      );
    }
    const telHref = `tel:${BUSINESS_CONFIG.phone}`;
    document.querySelectorAll('.js-call-link').forEach(el => { el.href = telHref; });

    const waHref = `https://wa.me/${BUSINESS_CONFIG.whatsapp}?text=${encodeURIComponent(BUSINESS_CONFIG.whatsappDefaultMessage)}`;
    // Every WhatsApp link/button on the site (header, offcanvas, hero,
    // floating button, contact card, footer) should behave identically:
    // open WhatsApp in a new tab and keep NonVeg.Store open behind it.
    // Previously only the floating button had target="_blank", so the
    // other WhatsApp links navigated away in the same tab — that
    // inconsistency is what made WhatsApp "load differently" depending
    // on which button was tapped.
    document.querySelectorAll('.js-whatsapp-link').forEach(el => {
      el.href = waHref;
      el.target = '_blank';
      el.rel = 'noopener';
    });

    document.querySelectorAll('.js-location-text').forEach(el => { el.textContent = BUSINESS_CONFIG.location; });
    document.querySelectorAll('.js-hours-text').forEach(el => { el.textContent = BUSINESS_CONFIG.hours; });

    const igLink = document.querySelector('.js-social-instagram');
    if (igLink) igLink.href = BUSINESS_CONFIG.social.instagram;
    const fbLink = document.querySelector('.js-social-facebook');
    if (fbLink) fbLink.href = BUSINESS_CONFIG.social.facebook;
  }

  /* -------------------------------------------------------------------
     Sticky header: adds a blurred/bordered state once the page has
     scrolled past the hero, so it stays legible over any content.
  ------------------------------------------------------------------- */
  function initHeaderScrollState() {
    const header = document.getElementById('site-header');
    if (!header) return;
    function update() {
      header.classList.toggle('scrolled', window.scrollY > 40);
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* -------------------------------------------------------------------
     Mobile hamburger menu: relies on Bootstrap's offcanvas JS via the
     data-bs-toggle attribute in the HTML. This adds a manual fallback
     so the menu still opens/closes even if the Bootstrap bundle from
     the CDN fails to load, loads late, or errors out — the toggler
     button should never be a dead click.
  ------------------------------------------------------------------- */
  function initMobileNavFallback() {
    const togglers = document.querySelectorAll('[data-bs-toggle="offcanvas"][data-bs-target="#navOffcanvas"]');
    const offcanvasEl = document.getElementById('navOffcanvas');
    if (!togglers.length || !offcanvasEl) return;

    function hasWorkingBootstrapOffcanvas() {
      return !!(window.bootstrap && window.bootstrap.Offcanvas);
    }

    function closeFallback() {
      offcanvasEl.classList.remove('show');
      document.body.classList.remove('offcanvas-open-fallback');
      setTimeout(() => { offcanvasEl.style.visibility = ''; }, 300);
    }

    function openFallback() {
      offcanvasEl.style.visibility = 'visible';
      // Force a reflow so the transform transition actually plays.
      void offcanvasEl.offsetWidth;
      offcanvasEl.classList.add('show');
      document.body.classList.add('offcanvas-open-fallback');
    }

    togglers.forEach(toggler => {
      toggler.addEventListener('click', (e) => {
        // If the real Bootstrap offcanvas JS is present, its own
        // document-level listener already handles this click — don't
        // interfere with it.
        if (hasWorkingBootstrapOffcanvas()) return;
        e.preventDefault();
        offcanvasEl.classList.contains('show') ? closeFallback() : openFallback();
      });
    });

    offcanvasEl.querySelectorAll('[data-bs-dismiss="offcanvas"], .offcanvas-link').forEach(el => {
      el.addEventListener('click', () => {
        if (hasWorkingBootstrapOffcanvas()) return;
        closeFallback();
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !hasWorkingBootstrapOffcanvas() && offcanvasEl.classList.contains('show')) {
        closeFallback();
      }
    });
  }

  /* -------------------------------------------------------------------
     Bottom nav active-state: highlights whichever section anchor the
     user is closest to, using IntersectionObserver for performance
     (no scroll-position math on every scroll tick).
  ------------------------------------------------------------------- */
  function initBottomNavActiveState() {
    const navItems = document.querySelectorAll('.bottom-nav-item[data-target]');
    if (!navItems.length) return;
    const scrollTrack = document.getElementById('bottomNavScroll');
    const indicator = document.getElementById('bottomNavIndicator');
    const sections = ['home', 'meat', 'seafood', 'explore', 'about', 'contact']
      .map(id => document.getElementById(id))
      .filter(Boolean);

    /* Slides the orange indicator pill under whichever item is active.
       Reads live layout (offsetLeft/offsetWidth) rather than hardcoded
       positions so it stays correct at any font size / viewport width,
       and re-centers the scroll track so the active item is in view. */
    function moveIndicatorTo(item) {
      if (!indicator || !scrollTrack || !item) return;
      indicator.style.width = item.offsetWidth + 'px';
      indicator.style.transform = `translateX(${item.offsetLeft}px)`;
      indicator.classList.add('is-visible');

      const trackWidth = scrollTrack.clientWidth;
      const itemCenter = item.offsetLeft + item.offsetWidth / 2;
      const targetScroll = itemCenter - trackWidth / 2;
      scrollTrack.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
    }

    function setActive(id) {
      let activeItem = null;
      navItems.forEach(item => {
        if (item.classList.contains('bottom-nav-item--call')) return; // never "active" via scroll
        const isMatch = item.dataset.target === id;
        item.classList.toggle('active', isMatch);
        if (isMatch) activeItem = item;
      });
      if (activeItem) moveIndicatorTo(activeItem);
    }

    // Tapping an item moves the indicator immediately, instead of waiting
    // on the scroll-driven IntersectionObserver to catch up.
    navItems.forEach(item => {
      if (item.classList.contains('bottom-nav-item--call')) return;
      item.addEventListener('click', () => setActive(item.dataset.target));
    });

    window.addEventListener('resize', () => {
      const current = document.querySelector('.bottom-nav-item.active:not(.bottom-nav-item--call)');
      if (current) moveIndicatorTo(current);
    });

    const initial = document.querySelector('.bottom-nav-item.active:not(.bottom-nav-item--call)');
    if (initial) requestAnimationFrame(() => moveIndicatorTo(initial));

    if (!sections.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        setActive(entry.target.id);
      });
    }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });

    sections.forEach(s => observer.observe(s));
  }

  /* -------------------------------------------------------------------
     Back-to-top button: fades in once the user has scrolled a bit,
     sits stacked right above the WhatsApp float button.
  ------------------------------------------------------------------- */
  function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    let ticking = false;
    function update() {
      btn.classList.toggle('is-visible', window.scrollY > 480);
      ticking = false;
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      smoothScrollToTop();
    });
  }

  /* Manually-eased scroll-to-top. More reliably smooth across browsers
     (esp. Safari/iOS) than relying on native scrollTo({behavior:'smooth'}). */
  function smoothScrollToTop(duration = 600) {
    const startY = window.scrollY;
    if (startY <= 0) return;
    const startTime = performance.now();
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      window.scrollTo(0, Math.round(startY * (1 - eased)));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  /* -------------------------------------------------------------------
     Custom cursor (desktop only). Disabled entirely on touch devices
     via the (hover: none) media check, matching the spec.
  ------------------------------------------------------------------- */
  function initCustomCursor() {
    if (window.matchMedia('(hover: none)').matches) return;

    document.body.classList.add('has-custom-cursor');
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    let dotX = 0, dotY = 0, ringX = 0, ringY = 0;
    window.addEventListener('mousemove', (e) => {
      dotX = e.clientX; dotY = e.clientY;
    });

    function raf() {
      // Dot tracks instantly, ring eases behind it for a "follower" feel.
      ringX += (dotX - ringX) * 0.18;
      ringY += (dotY - ringY) * 0.18;
      dot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('cursor-expand'));
      el.addEventListener('mouseleave', () => ring.classList.remove('cursor-expand'));
    });
  }

  /* -------------------------------------------------------------------
     Boot sequence
     Only the loader's Three.js scene runs during the 5-second intro to
     avoid animating two heavy WebGL contexts (loader + hero) at once.
     The hero and seafood scenes boot right after the loader hands off.
  ------------------------------------------------------------------- */
  function boot() {
    applyBusinessConfig();
    initHeaderScrollState();
    initMobileNavFallback();
    initBottomNavActiveState();
    initBackToTop();
    initCustomCursor();
    if (window.NonVegAnimations) window.NonVegAnimations.initScrollReveals();

    const loaderScene = window.NonVegThree ? window.NonVegThree.initLoaderScene() : null;

    function afterLoader() {
      if (window.NonVegThree) {
        window.NonVegThree.initHeroScene();
        window.NonVegThree.initSeafoodScene();
      }
      if (window.NonVegAnimations) window.NonVegAnimations.initCardTilt();
      if (loaderScene && loaderScene.destroy) loaderScene.destroy();
      document.getElementById('year') && (document.getElementById('year').textContent = new Date().getFullYear());
    }

    if (window.NonVegAnimations) {
      window.NonVegAnimations.runLoaderSequence(loaderScene, afterLoader);
    } else {
      // Animation module failed to load — fail safe by skipping straight
      // to the homepage rather than leaving the user stuck behind a loader.
      const loaderEl = document.getElementById('loader');
      if (loaderEl) loaderEl.style.display = 'none';
      afterLoader();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
