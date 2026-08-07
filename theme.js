(function () {
  'use strict';

  var STORAGE_KEY = 'theme';
  var root = document.documentElement;
  var ICON = { light: '☀️', dark: '🌙' }; // sun / crescent moon
  var COLOR = { light: '#F7F7F5', dark: '#17171A' };

  function getStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function setStored(mode) {
    try { localStorage.setItem(STORAGE_KEY, mode); } catch (e) {}
  }

  function apply(mode) {
    root.setAttribute('data-theme', mode);
    var meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (meta) meta.setAttribute('content', COLOR[mode]);
  }

  var systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  var mode = getStored() === 'dark' || (!getStored() && systemPrefersDark) ? 'dark' : 'light';
  apply(mode); // inline head snippet already set data-theme if something was stored; this covers the first-ever visit and syncs theme-color either way

  function injectUI() {
    var button = document.createElement('button');
    button.type = 'button';
    button.id = 'theme-toggle';

    function render() {
      button.textContent = ICON[mode];
      button.setAttribute('aria-label', 'Switch to ' + (mode === 'light' ? 'dark' : 'light') + ' mode');
    }
    render();

    button.addEventListener('click', function () {
      mode = mode === 'light' ? 'dark' : 'light';
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
})();
