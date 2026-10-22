/**
 * sound.js
 * ---------------------------------------------------------------------
 * Subtle UI sound effects for NonVeg.Store.
 *
 * Browsers block audio until a user gesture, and autoplay of any kind
 * is explicitly disallowed by the brief, so the AudioContext is only
 * constructed lazily on the first user interaction (first click/tap
 * anywhere), never on page load.
 *
 * Sounds are synthesized with the Web Audio API (short sine/triangle
 * blips) rather than shipped as audio files, keeping the project
 * dependency-free and matching the client's established preference
 * for synthesized sound over external audio assets.
 */
(function () {
  const STORAGE_KEY = 'nonveg-store-sound';
  let audioCtx = null;
  let soundEnabled = localStorage.getItem(STORAGE_KEY) !== 'off'; // default ON, user can mute

  function ensureContext() {
    if (!audioCtx) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return null;
      audioCtx = new AudioCtor();
    }
    // Some browsers create contexts in a suspended state until resumed
    // inside a user gesture — resume defensively every time we use it.
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  /**
   * Plays a very short, quiet blip.
   * @param {number} freq - base frequency in Hz
   * @param {number} durationMs - how long the tone rings for
   */
  function tone(freq, durationMs) {
    if (!soundEnabled) return;
    const ctx = ensureContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    // Fast attack, fast exponential decay keeps every sound "tap"-like
    // and unobtrusive rather than a lingering beep.
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationMs / 1000 + 0.02);
  }

  function playClick() { tone(720, 90); }
  function playSelect() { tone(920, 110); }
  function playCta() { tone(540, 140); }

  function setEnabled(enabled) {
    soundEnabled = enabled;
    localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
    updateToggleUI();
  }

  function updateToggleUI() {
    const btn = document.getElementById('sound-toggle');
    if (!btn) return;
    btn.classList.toggle('sound-on', soundEnabled);
    btn.innerHTML = soundEnabled
      ? '<i class="bi bi-volume-up-fill"></i>'
      : '<i class="bi bi-volume-mute-fill"></i>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    updateToggleUI();
    const toggleBtn = document.getElementById('sound-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        ensureContext(); // first gesture on this control also unlocks audio
        setEnabled(!soundEnabled);
        if (soundEnabled) playSelect();
      });
    }

    // Attach a light click sound to primary interactive elements.
    // Delegated at the document level so it also covers elements
    // injected later (e.g. offcanvas links).
    document.addEventListener('click', function (e) {
      const target = e.target.closest('.btn-call, .btn-whatsapp, .category-card, .bottom-nav-item, .nav-link-custom, .theme-toggle-btn');
      if (target) playClick();
    });
  });

  window.NonVegSound = { playClick, playSelect, playCta, setEnabled };
})();
