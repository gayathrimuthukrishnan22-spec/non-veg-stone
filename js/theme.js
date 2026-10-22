/**
 * theme.js
 * ---------------------------------------------------------------------
 * Handles light/dark theme switching for NonVeg.Store.
 *
 * Design decision: theme state lives on <html data-theme="light|dark">
 * so every CSS custom property in style.css cascades instantly —
 * no page reload, no flash, just a smooth cross-fade handled by the
 * `--transition-theme` variable already applied to body/header/footer.
 *
 * The chosen theme is persisted to localStorage so it survives a
 * refresh, matching the spec requirement.
 */
(function () {
  const STORAGE_KEY = 'nonveg-store-theme';
  const root = document.documentElement;

  /**
   * Resolve the theme to use on first paint:
   * 1. Respect a previously saved preference.
   * 2. Otherwise fall back to the brand default: LIGHT.
   * (We deliberately do NOT default to the OS preference — the brief
   * requires the site to always open in light mode by default.)
   */
  function getInitialTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'dark' || saved === 'light' ? saved : 'light';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  function toggleTheme() {
    const current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    // Small tactile confirmation — sound.js guards against missing AudioContext.
    if (window.NonVegSound) window.NonVegSound.playClick();
  }

  // Apply the resolved theme immediately (this script is loaded in <head>-
  // adjacent position at the bottom of body, but before first paint of
  // content is not guaranteed on slow connections, so we still set it
  // as early as possible here to avoid a visible flash).
  applyTheme(getInitialTheme());

  document.addEventListener('DOMContentLoaded', function () {
    const desktopToggle = document.getElementById('theme-toggle');
    const mobileToggle = document.getElementById('theme-toggle-mobile');
    if (desktopToggle) desktopToggle.addEventListener('click', toggleTheme);
    if (mobileToggle) mobileToggle.addEventListener('click', toggleTheme);
  });

  // Expose minimal API in case other modules need to read the theme
  // (e.g. three-scene.js tints particles differently per theme).
  window.NonVegTheme = {
    get: () => root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light',
    toggle: toggleTheme
  };
})();
