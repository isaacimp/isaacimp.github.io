// Site-wide theme toggle: cycles Light -> Dark -> System (Auto), remembers
// the choice in localStorage, and applies it via a data-theme attribute on
// <html>. "System" just removes the attribute entirely, which falls back
// to the prefers-color-scheme media query already in style.css.
//
// The actual attribute is set as early as possible by a tiny inline
// script in <head> (before <link rel="stylesheet">) to avoid a flash of
// the wrong theme on load — this file only builds the button UI and
// handles clicks; see the inline snippet at the top of every page's head.
(function () {
  'use strict';

  var STORAGE_KEY = 'theme';
  var root = document.documentElement;
  var ORDER = ['light', 'dark', 'system'];
  var LABELS = { light: 'Light', dark: 'Dark', system: 'Auto' };
  var ICONS = {
    light:
      '<svg class="site-search-icon" viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">' +
        '<circle cx="10" cy="10" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
        '<g stroke="currentColor" stroke-width="1.5" stroke-linecap="round">' +
          '<line x1="10" y1="1.5" x2="10" y2="3.4"/><line x1="10" y1="16.6" x2="10" y2="18.5"/>' +
          '<line x1="1.5" y1="10" x2="3.4" y2="10"/><line x1="16.6" y1="10" x2="18.5" y2="10"/>' +
          '<line x1="4.2" y1="4.2" x2="5.5" y2="5.5"/><line x1="14.5" y1="14.5" x2="15.8" y2="15.8"/>' +
          '<line x1="4.2" y1="15.8" x2="5.5" y2="14.5"/><line x1="14.5" y1="5.5" x2="15.8" y2="4.2"/>' +
        '</g>' +
      '</svg>',
    dark:
      '<svg class="site-search-icon" viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">' +
        '<path d="M17.2 12.3A7.5 7.5 0 1 1 8.7 2.9a6.1 6.1 0 0 0 8.5 9.4Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
      '</svg>',
    system:
      '<svg class="site-search-icon" viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">' +
        '<rect x="2" y="3.5" width="16" height="10.5" rx="1.3" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
        '<line x1="7" y1="17.3" x2="13" y2="17.3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
        '<line x1="10" y1="14" x2="10" y2="17.3" stroke="currentColor" stroke-width="1.5"/>' +
      '</svg>'
  };

  function getStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function setStored(mode) {
    try { localStorage.setItem(STORAGE_KEY, mode); } catch (e) {}
  }

  function systemPrefersDark() {
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  function apply(mode) {
    if (mode === 'light' || mode === 'dark') root.setAttribute('data-theme', mode);
    else root.removeAttribute('data-theme');

    var isDark = mode === 'dark' || (mode === 'system' && systemPrefersDark());
    var color = isDark ? '#17171A' : '#F5F2EA';
    // Only the plain (non media-qualified) theme-color tag needs updating —
    // the one with media="(prefers-color-scheme: dark)" already tracks the
    // OS on its own, which is exactly right for "system" mode.
    var meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (meta) meta.setAttribute('content', color);
  }

  var mode = getStored() || 'system';
  if (ORDER.indexOf(mode) === -1) mode = 'system';
  apply(mode); // the inline head snippet already set data-theme; this just syncs theme-color

  function injectUI() {
    var button = document.createElement('button');
    button.type = 'button';
    button.id = 'theme-toggle';

    function render() {
      button.innerHTML = ICONS[mode] + '<span class="theme-toggle-label">' + LABELS[mode] + '</span>';
      button.setAttribute('aria-label', 'Theme: ' + LABELS[mode] + '. Click to switch.');
    }
    render();

    button.addEventListener('click', function () {
      mode = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
      apply(mode);
      setStored(mode);
      render();
    });

    // Sit right next to the search trigger: reuse its slot/row if present,
    // otherwise create the same "after the back link" row search.js would
    // (script load order between the two doesn't matter either way).
    var slot = document.getElementById('search-trigger-slot') || document.getElementById('search-trigger-row');
    if (!slot) {
      var back = document.querySelector('main > a.back');
      if (back) {
        slot = document.createElement('div');
        slot.id = 'search-trigger-row';
        back.insertAdjacentElement('afterend', slot);
      }
    }
    if (slot) {
      button.classList.add('inline');
      slot.appendChild(button);
    } else {
      document.body.appendChild(button);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectUI);
  } else {
    injectUI();
  }

  // Keep the address-bar color in sync if the OS theme changes live while
  // in "system" mode.
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if (mode === 'system') apply('system');
    });
  }
})();
