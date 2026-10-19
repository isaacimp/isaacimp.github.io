// The bottom dock: one slim bar on every page.
//
//   left   what's useful HERE
//            site.html: section jumps (Projects · Articles · Posts), current one marked
//            read page: ← Back · reading % · ‹ older / newer ›
//            other:     Home · Writing
//   right  Search · ⋯ (time, copy email, top) · hide
//
// Popovers stay closed until opened, so the resting bar is small. "Hide"
// collapses the whole dock to a single small button (remembered in
// localStorage). No libraries; reads the same data files the site already
// builds (posts-data.js, articles-data.js).

(function () {
  'use strict';

  var EMAIL = 'mail@isaacmp.xyz';
  var HIDE_KEY = 'dockHidden';

  var path = location.pathname.replace(/\/index\.html$/, '/');
  var isHome = path === '/site.html';
  var isLanding = path === '/';

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  // shared with search.js: each data file is injected at most once per page
  function loadScript(src) {
    var m = (window.__loaded = window.__loaded || {});
    if (m[src]) return m[src];
    return (m[src] = new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = s.onerror = function () { resolve(); };
      document.head.appendChild(s);
    }));
  }

  // ---- what kind of page is this? ---------------------------------------
  var postMatch = path.match(/^\/posts\/([^/]+)\.html$/);
  var projectMatch = path.match(/^\/projects\/([^/]+)\.html$/);
  var rootMatch = path.match(/^\/([^/]+)\.html$/);
  var isRead = !!document.querySelector('article.article-content') &&
    (postMatch || projectMatch || (rootMatch && !/^(writing|bookmarks|uses|tags)$/.test(rootMatch[1])));
  if (postMatch && postMatch[1] === 'index') isRead = false;

  // ---- DOM ----------------------------------------------------------------
  var dock = el('div', 'dock');
  dock.id = 'dock';
  dock.setAttribute('role', 'navigation');
  dock.setAttribute('aria-label', 'Quick links');

  var bar = el('div', 'dock-bar');
  var progress = el('div', 'dock-progress');
  progress.appendChild(el('div', 'dock-progress-fill'));
  var ctx = el('div', 'dock-ctx');
  var tools = el('div', 'dock-tools');

  var btnSearch = el('button', 'dock-btn dock-icon', '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>');
  btnSearch.type = 'button';
  btnSearch.setAttribute('aria-label', 'Search (or press /)');
  btnSearch.title = 'Search  ( / )';
  var btnMore = el('button', 'dock-btn dock-icon', '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>');
  btnMore.type = 'button';
  btnMore.setAttribute('aria-label', 'More');
  btnMore.setAttribute('aria-expanded', 'false');
  // password-style eye: open = bar is showing (click to hide), slashed = hidden (click to show)
  var EYE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  var EYE_OFF = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/></svg>';
  var btnHide = el('button', 'dock-btn dock-icon', EYE);
  btnHide.type = 'button';
  btnHide.setAttribute('aria-label', 'Hide this bar');
  btnHide.title = 'Hide bar';

  tools.append(btnSearch, btnMore, btnHide);
  bar.append(progress, ctx, tools);

  var panelMore = el('div', 'dock-panel dock-panel-more');
  panelMore.hidden = true;
  panelMore.innerHTML =
    '<div class="dock-row"><span class="dock-label">Melbourne</span><span class="dock-time" id="dock-time">—</span></div>' +
    '<button type="button" class="dock-row dock-action" id="dock-copy"><span class="dock-label">Email</span><span id="dock-copy-text">' + EMAIL + ' · copy</span></button>' +
    '<button type="button" class="dock-row dock-action" id="dock-top"><span class="dock-label">Page</span><span class="dock-go">Back to top <svg class="ico" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg></span></button>' +
    '<button type="button" class="dock-row dock-action" id="dock-hide"><span class="dock-label">Bar</span><span>Hide this bar</span></button>';

  dock.append(panelMore, bar);

  var restore = el('button', 'dock-restore', EYE_OFF);
  restore.type = 'button';
  restore.setAttribute('aria-label', 'Show the quick-links bar');
  restore.title = 'Show bar';

  // ---- hide / show --------------------------------------------------------
  function setHidden(h) {
    dock.hidden = h;
    restore.hidden = !h;
    document.documentElement.classList.toggle('dock-off', h);
    try { localStorage.setItem(HIDE_KEY, h ? '1' : '0'); } catch (e) {}
    if (h) closePanels();
  }
  btnHide.addEventListener('click', function () { setHidden(true); });
  restore.addEventListener('click', function () { setHidden(false); });

  // ---- popovers -----------------------------------------------------------
  function closePanels() {
    panelMore.hidden = true;
    btnMore.setAttribute('aria-expanded', 'false');
  }
  function toggle(panel, btn, other, otherBtn, onOpen) {
    var open = panel.hidden;
    closePanels();
    if (open) {
      panel.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      if (onOpen) onOpen();
    }
  }
  document.addEventListener('click', function (e) {
    if (!dock.contains(e.target)) closePanels();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closePanels();
  });

  // More: live Melbourne time while open
  var timer = null;
  function tick() {
    var t = document.getElementById('dock-time');
    if (!t) return;
    t.textContent = new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Melbourne', hour: '2-digit', minute: '2-digit', hour12: false
    }).format(new Date());
  }
  btnMore.addEventListener('click', function () {
    toggle(panelMore, btnMore, null, null, function () { tick(); });
    clearInterval(timer);
    timer = setInterval(function () { if (panelMore.hidden) clearInterval(timer); else tick(); }, 15000);
  });
  panelMore.addEventListener('click', function (e) {
    if (e.target.closest('#dock-hide')) {
      setHidden(true);
    } else if (e.target.closest('#dock-top')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      closePanels();
    } else if (e.target.closest('#dock-copy')) {
      var label = document.getElementById('dock-copy-text');
      var done = function () { label.textContent = 'Copied ✓'; setTimeout(function () { label.textContent = EMAIL + ' · copy'; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(EMAIL).then(done, function () { location.href = 'mailto:' + EMAIL; });
      else location.href = 'mailto:' + EMAIL;
    }
  });

  // Search: use the page's own search box (search.js)
  btnSearch.addEventListener('click', function () {
    closePanels();
    var input = document.getElementById('site-search-input');
    if (!input) { location.href = '/writing.html'; return; }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(function () { input.focus(); }, 150);
  });

  // ---- context (left side) --------------------------------------------------
  var fill = progress.firstChild;
  function pct() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    return h > 0 ? Math.min(100, Math.max(0, Math.round((window.scrollY / h) * 100))) : 0;
  }

  if (isHome) {
    var ids = ['projects', 'articles', 'posts'];
    var labels = { projects: 'Projects', articles: 'Articles', posts: 'Posts' };
    ids.forEach(function (id) {
      var a = el('a', 'dock-link', labels[id]);
      a.href = '#' + id;
      a.dataset.sec = id;
      ctx.appendChild(a);
    });
    var links = ctx.querySelectorAll('.dock-link');
    var onScroll = function () {
      var current = '';
      ids.forEach(function (id) {
        var s = document.getElementById(id);
        if (s && s.getBoundingClientRect().top <= window.innerHeight * 0.4) current = id;
      });
      links.forEach(function (a) { a.classList.toggle('on', a.dataset.sec === current); });
      fill.style.width = pct() + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  } else if (isRead) {
    var back = el('a', 'dock-link dock-ico', '<svg class="ico" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg><span class="trim">Back</span>');
    back.href = '/';
    // go to wherever they came from on this site, like back.js does
    try {
      if (document.referrer && new URL(document.referrer).origin === location.origin && document.referrer !== location.href) {
        back.href = document.referrer;
      }
    } catch (e) {}
    var pc = el('span', 'dock-pct', '0%');
    ctx.append(back, pc);
    var onRead = function () { var v = pct(); pc.textContent = v + '%'; fill.style.width = v + '%'; };
    window.addEventListener('scroll', onRead, { passive: true });
    onRead();

    // older / newer neighbours, within posts or within articles
    var kind = postMatch ? 'post' : (projectMatch ? null : 'article');
    var slug = postMatch ? postMatch[1] : (rootMatch ? rootMatch[1] : null);
    if (kind && slug) {
      var src = kind === 'post' ? '/posts-data.js' : '/articles-data.js';
      var varName = kind === 'post' ? 'POSTS' : 'ARTICLES';
      var have = typeof window[varName] !== 'undefined' ? Promise.resolve() : loadScript(src);
      have.then(function () {
        var list;
        try { list = (kind === 'post' ? POSTS : ARTICLES).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }); } catch (e) { return; }
        var i = list.findIndex(function (x) { return x.slug === slug; });
        if (i < 0) return;
        var url = function (x) { return kind === 'post' ? '/posts/' + x.slug + '.html' : '/' + x.slug + '.html'; };
        var older = list[i + 1], newer = list[i - 1];
        if (older) { var o = el('a', 'dock-link dock-ico dock-nav', '<svg class="ico" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg><span class="dock-nav-t">' + older.title + '</span>'); o.href = url(older); o.title = 'Older: ' + older.title; o.setAttribute('aria-label', 'Older: ' + older.title); ctx.appendChild(o); }
        if (newer) { var n = el('a', 'dock-link dock-ico dock-nav', '<span class="dock-nav-t">' + newer.title + '</span><svg class="ico" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>'); n.href = url(newer); n.title = 'Newer: ' + newer.title; n.setAttribute('aria-label', 'Newer: ' + newer.title); ctx.appendChild(n); }
      });
    }
  } else if (isLanding) {
    var lw = el('a', 'dock-link', 'Writing'); lw.href = '/writing.html';
    var ln = el('a', 'dock-link', 'Now'); ln.href = '/now/';
    var ls = el('a', 'dock-link', 'Site'); ls.href = '/site.html';
    ctx.append(lw, ln, ls);
  } else {
    var h = el('a', 'dock-link', 'Home'); h.href = '/';
    var w = el('a', 'dock-link', 'Writing'); w.href = '/writing.html';
    ctx.append(h, w);
  }

  // ---- mount --------------------------------------------------------------
  function mount() {
    document.body.append(dock, restore);
    var hidden = false;
    try { hidden = localStorage.getItem(HIDE_KEY) === '1'; } catch (e) {}
    setHidden(hidden);
    if (!hidden) { /* nothing else — popovers load on demand */ }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
