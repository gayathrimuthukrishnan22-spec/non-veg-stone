/**
 * three-scene.js
 * ---------------------------------------------------------------------
 * All Three.js visuals for NonVeg.Store live here:
 *   1. Loader scene    — floating meat/seafood-inspired shapes + embers
 *   2. Hero scene       — ambient floating geometry behind the headline
 *   3. Seafood scene    — rising bubble particles for the seafood band
 *
 * Performance notes (mobile):
 *   - Pixel ratio is capped at 1.5 regardless of device DPI.
 *   - Object/particle counts are halved (or more) under 768px width.
 *   - Every scene checks prefers-reduced-motion and, if set, renders a
 *     single static frame instead of an animation loop.
 *   - All three canvases share one shared clock via requestAnimationFrame
 *     but are otherwise independent so a section that scrolls off-screen
 *     can be skipped cheaply.
 */
(function () {
  const HAS_THREE = typeof THREE !== 'undefined';
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IS_MOBILE = window.innerWidth < 768;
  const PIXEL_RATIO = Math.min(window.devicePixelRatio || 1, 1.5);

  if (!HAS_THREE) return; // graceful no-op if the CDN failed to load

  /* =====================================================================
     Shared helper: builds a low-poly "food-inspired" mesh set.
     We intentionally avoid literal photorealistic meat models (out of
     scope for procedural geometry) and instead use warm, rounded
     primitives — an icosahedron cluster reads as "seared/charred cut",
     a torus reads as a ring/wing shape, a capsule reads as a drumstick
     silhouette. This keeps the scene abstract, fast, and brand-colored
     rather than literal.
  ===================================================================== */
  function createFoodMesh(type, color, size) {
    let geometry;
    switch (type) {
      case 'sear':
        geometry = new THREE.IcosahedronGeometry(size, 0);
        break;
      case 'ring':
        geometry = new THREE.TorusGeometry(size, size * 0.35, 8, 16);
        break;
      case 'drumstick':
        geometry = new THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(size * 0.4, size, 4, 8) : new THREE.CylinderGeometry(size * 0.4, size * 0.6, size * 1.6, 8);
        break;
      default:
        geometry = new THREE.SphereGeometry(size, 10, 10);
    }
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.45,
      metalness: 0.15,
      flatShading: true
    });
    return new THREE.Mesh(geometry, material);
  }

  /* =====================================================================
     1. LOADER SCENE
  ===================================================================== */
  function initLoaderScene() {
    const canvas = document.getElementById('loader-canvas');
    if (!canvas) return { destroy() {} };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !IS_MOBILE });
    renderer.setPixelRatio(PIXEL_RATIO);
    renderer.setSize(window.innerWidth, window.innerHeight);

    scene.add(new THREE.AmbientLight(0xffe3c2, 0.6));
    const warmLight = new THREE.PointLight(0xff7a2e, 2.2, 30);
    warmLight.position.set(4, 3, 6);
    scene.add(warmLight);
    const coolFill = new THREE.PointLight(0xffcf8a, 0.8, 30);
    coolFill.position.set(-5, -2, 4);
    scene.add(coolFill);

    // Three hero shapes: chicken-esque (drumstick capsule), steak-esque
    // (charred icosahedron), seafood-esque (smooth ring = shell curl).
    const objectCount = IS_MOBILE ? 3 : 3;
    const meshes = [
      createFoodMesh('drumstick', 0xD9A441, 0.9),
      createFoodMesh('sear', 0xC83B22, 1.1),
      createFoodMesh('ring', 0xF0782B, 0.8)
    ].slice(0, objectCount);

    meshes[0] && meshes[0].position.set(-2.4, 0.4, 0);
    meshes[1] && meshes[1].position.set(0, -0.6, 0);
    meshes[2] && meshes[2].position.set(2.3, 0.6, 0);
    meshes.forEach(m => { m.scale.setScalar(0.001); scene.add(m); }); // start hidden, scaled in

    // Ambient ember/particle field.
    const particleCount = IS_MOBILE ? 60 : 160;
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0xffb066, size: 0.045, transparent: true, opacity: 0.7 });
    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    let raf = null;
    const clock = new THREE.Clock();

    function frame() {
      const t = clock.getElapsedTime();
      meshes.forEach((m, i) => {
        m.rotation.x = t * 0.3 + i;
        m.rotation.y = t * 0.4 + i;
        m.position.y += Math.sin(t * 0.8 + i) * 0.0015;
      });
      particles.rotation.y = t * 0.02;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }

    if (!REDUCED_MOTION) {
      raf = requestAnimationFrame(frame);
    } else {
      meshes.forEach(m => m.scale.setScalar(1));
      renderer.render(scene, camera);
    }

    let lastWidth = window.innerWidth;
    function onResize() {
      // Mobile browsers fire 'resize' when the address bar hides/shows
      // on scroll — that only changes height, not width. Reacting to it
      // was snapping the camera/aspect ratio every time and made the
      // floating shapes look like they were jumping/glitching mid-scroll.
      // Only react to genuine width changes (real orientation/resize).
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onResize);

    return {
      meshes,
      scaleIn() {
        if (REDUCED_MOTION) return;
        meshes.forEach((m, i) => {
          gsapTweenScale(m, 1, 600 + i * 120);
        });
      },
      destroy() {
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener('resize', onResize);
        renderer.dispose();
      }
    };
  }

  // Tiny scale-in easing helper — avoids a hard GSAP dependency for the
  // loader in case GSAP hasn't finished loading yet.
  function gsapTweenScale(mesh, target, durationMs) {
    const start = performance.now();
    const from = mesh.scale.x;
    function step(now) {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = from + (target - from) * eased;
      mesh.scale.setScalar(val);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* =====================================================================
     2. HERO SCENE — ambient floating geometry, mouse + scroll reactive
  ===================================================================== */
  function initHeroScene() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return { destroy() {} };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !IS_MOBILE });
    renderer.setPixelRatio(PIXEL_RATIO);
    renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight);

    scene.add(new THREE.AmbientLight(0xffe8cf, 0.7));
    const key = new THREE.PointLight(0xff7a2e, 1.6, 40);
    key.position.set(6, 4, 8);
    scene.add(key);

    const count = IS_MOBILE ? 4 : 8;
    const palette = [0xC83B22, 0xF0782B, 0xD9A441];
    const types = ['sear', 'ring', 'drumstick'];
    const meshes = [];
    for (let i = 0; i < count; i++) {
      const mesh = createFoodMesh(types[i % types.length], palette[i % palette.length], 0.35 + Math.random() * 0.4);
      mesh.position.set(
        (Math.random() - 0.5) * 10 + 3, // biased right, away from headline text on the left
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 4 - 2
      );
      mesh.userData.speed = 0.2 + Math.random() * 0.3;
      mesh.userData.offset = Math.random() * Math.PI * 2;
      scene.add(mesh);
      meshes.push(mesh);
    }

    let mouseX = 0, mouseY = 0, scrollFactor = 0;
    function onMouseMove(e) {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    }
    function onScroll() {
      scrollFactor = Math.min(1, window.scrollY / window.innerHeight);
    }
    if (!IS_MOBILE) window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    const clock = new THREE.Clock();
    let raf = null;
    function frame() {
      const t = clock.getElapsedTime();
      meshes.forEach(m => {
        m.rotation.x = t * 0.25 * m.userData.speed;
        m.rotation.y = t * 0.35 * m.userData.speed;
        m.position.y += Math.sin(t * m.userData.speed + m.userData.offset) * 0.001;
      });
      camera.position.x += (mouseX * 0.6 - camera.position.x) * 0.03;
      camera.position.y += (-mouseY * 0.4 - camera.position.y) * 0.03;
      camera.position.z = 10 + scrollFactor * 2;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    if (!REDUCED_MOTION) raf = requestAnimationFrame(frame);
    else renderer.render(scene, camera);

    let lastWidthHero = window.innerWidth;
    function onResize() {
      if (window.innerWidth === lastWidthHero) return;
      lastWidthHero = window.innerWidth;
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResize);

    return {
      destroy() {
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
        renderer.dispose();
      }
    };
  }

  /* =====================================================================
     3. SEAFOOD SCENE — rising bubble particles, lightweight
  ===================================================================== */
  function initSeafoodScene() {
    const canvas = document.getElementById('seafood-canvas');
    if (!canvas) return { destroy() {} };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 50);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(PIXEL_RATIO);
    renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight);

    const count = IS_MOBILE ? 35 : 90;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      speeds[i] = 0.3 + Math.random() * 0.6;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0xCFEDE8, size: 0.08, transparent: true, opacity: 0.55 });
    const bubbles = new THREE.Points(geometry, material);
    scene.add(bubbles);

    let raf = null;
    let visible = false;

    // Only animate while the seafood section is actually in view —
    // this is the cheapest of the three scenes but there's no reason
    // to spend a rAF loop on it while it's scrolled far away.
    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible && !raf && !REDUCED_MOTION) frame();
    }, { threshold: 0.05 });
    observer.observe(canvas);

    function frame() {
      const pos = geometry.attributes.position;
      for (let i = 0; i < count; i++) {
        let y = pos.getY(i) + speeds[i] * 0.01;
        if (y > 6) y = -6;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
      renderer.render(scene, camera);
      if (visible) raf = requestAnimationFrame(frame);
      else raf = null;
    }
    if (REDUCED_MOTION) renderer.render(scene, camera);

    let lastWidthSea = window.innerWidth;
    function onResizeSea() {
      if (window.innerWidth === lastWidthSea) return;
      lastWidthSea = window.innerWidth;
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResizeSea);

    return {
      destroy() {
        if (raf) cancelAnimationFrame(raf);
        observer.disconnect();
        window.removeEventListener('resize', onResizeSea);
        renderer.dispose();
      }
    };
  }

  // Expose an init namespace; main.js decides *when* to boot each scene
  // (loader immediately, hero/seafood once the loader finishes) so we
  // never pay for two heavy WebGL contexts animating simultaneously
  // during the loader sequence.
  window.NonVegThree = {
    initLoaderScene,
    initHeroScene,
    initSeafoodScene
  };
})();
