// Site-wide search. Self-contained: injects its own trigger button and
// overlay into whatever page includes it, and pulls in whichever data
// files (articles-data.js, posts-data.js, now-data.js, bookmarks-data.js)
// aren't already loaded on that page. Add <script src="/search.js"></script>
// near the end of <body> on any page to get it — nothing else required.
//
// The index is built from the same metadata files that drive the
// Articles/Posts/Now/Bookmarks lists elsewhere on the site, so a new
// entry in any of those automatically becomes searchable too. It searches
// titles/tags/excerpts, not full article bodies.
(function () {
  'use strict';

  function loadScript(src) {
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = function () { resolve(); };
      s.onerror = function () { resolve(); };
      document.head.appendChild(s);
    });
  }

  function loadData() {
    var loaders = [];
    if (typeof ARTICLES === 'undefined') loaders.push(loadScript('/articles-data.js'));
    if (typeof POSTS === 'undefined') loaders.push(loadScript('/posts-data.js'));
    if (typeof NOW_ENTRIES === 'undefined') loaders.push(loadScript('/now-data.js'));
    if (typeof BOOKMARKS === 'undefined') loaders.push(loadScript('/bookmarks-data.js'));
    return Promise.all(loaders);
  }

  var dataReady = loadData();

  function stripHtml(html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || '').replace(/\s+/g, ' ').trim();
  }

  // Hand-maintained entries for pages/sections with no data file of their own.
  var STATIC_PAGES = [
    { title: 'About', type: 'page', url: '/#about', excerpt: 'Isaac — about.' },
    { title: 'Projects', type: 'page', url: '/#projects', excerpt: 'bioenergetic.live, fourpots.com.' },
    { title: 'Now', type: 'page', url: '/now/', excerpt: 'What I am doing right now, archived.' },
    { title: 'Posts', type: 'page', url: '/posts/index.html', excerpt: 'Short ideas, longer thoughts, book reviews.' },
    { title: 'Articles', type: 'page', url: '/#articles', excerpt: 'Long-form writing.' },
    { title: 'Bookmarks', type: 'page', url: '/bookmarks.html', excerpt: 'Things I have read, watched, and saved.' }
  ];

  function buildIndex() {
    var items = STATIC_PAGES.slice();

    if (typeof ARTICLES !== 'undefined') {
      ARTICLES.forEach(function (a) {
        items.push({
          title: a.title || a.file,
          type: 'article',
          date: a.date,
          url: '/articles/' + a.slug + '.html',
          excerpt: (a.tags || []).join(', ')
        });
      });
    }

    if (typeof POSTS !== 'undefined') {
      POSTS.forEach(function (p) {
        items.push({
          title: p.title,
          type: 'post',
          date: p.date,
          url: '/posts/' + p.slug + '.html',
          excerpt: (p.tags || []).join(', ')
        });
      });
    }

    if (typeof NOW_ENTRIES !== 'undefined') {
      NOW_ENTRIES.forEach(function (n) {
        items.push({
          title: 'Now — ' + n.date,
          type: 'now',
          date: n.date,
          url: '/now/#now-' + n.date,
          excerpt: stripHtml(n.html).slice(0, 200)
        });
      });
    }

    if (typeof BOOKMARKS !== 'undefined') {
      BOOKMARKS.forEach(function (b) {
        items.push({
          title: b.title,
          type: b.type || 'bookmark',
          date: b.date,
          url: '/bookmarks.html',
          excerpt: b.note || ''
        });
      });
    }

    return items;
  }

  function haystack(item) {
    return [item.title, item.excerpt, item.type].join(' ').toLowerCase();
  }

  function runSearch(items, query) {
    var q = query.trim().toLowerCase();
    if (!q) return [];
    return items.filter(function (item) { return haystack(item).indexOf(q) !== -1; }).slice(0, 20);
  }

  function injectUI() {
    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.id = 'site-search-trigger';
    trigger.setAttribute('aria-label', 'Search this site');
    trigger.innerHTML = '&#9906;';
    document.body.appendChild(trigger);

    var overlay = document.createElement('div');
    overlay.id = 'site-search-overlay';
    overlay.innerHTML =
      '<div id="site-search-panel" role="dialog" aria-label="Site search">' +
        '<input id="site-search-input" type="text" placeholder="Search articles, posts, now, bookmarks…" autocomplete="off" spellcheck="false">' +
        '<div id="site-search-results"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    var input = overlay.querySelector('#site-search-input');
    var results = overlay.querySelector('#site-search-results');
    var items = null;
    dataReady.then(function () { items = buildIndex(); });

    function render(list) {
      if (!input.value.trim()) {
        results.innerHTML = '';
        return;
      }
      if (!list.length) {
        results.innerHTML = '<p class="site-search-empty">No matches.</p>';
        return;
      }
      results.innerHTML = list.map(function (item) {
        var meta = [item.type, item.date].filter(Boolean).join(' · ');
        return '<a class="site-search-result" href="' + item.url + '">' +
          '<span class="site-search-result-title">' + item.title + '</span>' +
          '<span class="site-search-result-meta">' + meta + '</span>' +
        '</a>';
      }).join('');
    }

    function open() {
      overlay.classList.add('active');
      input.value = '';
      results.innerHTML = '';
      if (!items) { dataReady.then(function () { items = buildIndex(); }); }
      setTimeout(function () { input.focus(); }, 0);
    }

    function close() {
      overlay.classList.remove('active');
    }

    trigger.addEventListener('click', open);

    input.addEventListener('input', function () {
      render(runSearch(items || [], input.value));
    });

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    document.addEventListener('keydown', function (e) {
      if (overlay.classList.contains('active')) {
        if (e.key === 'Escape') close();
        return;
      }
      var active = document.activeElement;
      var typing = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
      var isShortcut = (e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k');
      if (isShortcut) {
        e.preventDefault();
        open();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectUI);
  } else {
    injectUI();
  }
})();
