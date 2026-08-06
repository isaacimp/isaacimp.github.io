// Site-wide search. Self-contained: injects its own trigger button and
// overlay into whatever page includes it, and pulls in whichever data
// files (articles-data.js, posts-data.js, now-data.js, bookmarks-data.js)
// aren't already loaded on that page. Add <script src="/search.js"></script>
// near the end of <body> on any page to get it — nothing else required.
//
// The index is built from the same metadata files that drive the
// Articles/Posts/Now/Bookmarks lists elsewhere on the site, so a new
// entry in any of those automatically becomes searchable too. Articles
// and posts don't carry their own body text in those metadata files, so
// their standalone pages are fetched once (in the background, same-origin)
// to pull in the full text — this only works when served over http(s), not
// opened via file://. Title matches are ranked above tag/body matches.
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

  function fetchBodyText(url, selector) {
    return fetch(url)
      .then(function (res) { return res.ok ? res.text() : ''; })
      .catch(function () { return ''; })
      .then(function (html) {
        if (!html) return '';
        var temp = document.createElement('div');
        temp.innerHTML = html;
        var el = temp.querySelector(selector);
        return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '';
      });
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

  // Builds the index and, for articles/posts, kicks off a background fetch
  // of each standalone page's full text — returns a promise that resolves
  // once everything (including those fetches) is ready.
  function buildIndex() {
    var items = STATIC_PAGES.slice();
    var textFetches = [];

    if (typeof ARTICLES !== 'undefined') {
      ARTICLES.forEach(function (a) {
        var item = {
          title: a.title || a.file,
          type: 'article',
          date: a.date,
          url: '/articles/' + a.slug + '.html',
          excerpt: (a.tags || []).join(', '),
          body: ''
        };
        items.push(item);
        textFetches.push(fetchBodyText(item.url, '.article-content').then(function (text) { item.body = text; }));
      });
    }

    if (typeof POSTS !== 'undefined') {
      POSTS.forEach(function (p) {
        var item = {
          title: p.title,
          type: 'post',
          date: p.date,
          url: '/posts/' + p.slug + '.html',
          excerpt: (p.tags || []).join(', '),
          body: ''
        };
        items.push(item);
        textFetches.push(fetchBodyText(item.url, '#post-body').then(function (text) { item.body = text; }));
      });
    }

    if (typeof NOW_ENTRIES !== 'undefined') {
      NOW_ENTRIES.forEach(function (n) {
        items.push({
          title: 'Now — ' + n.date,
          type: 'now',
          date: n.date,
          url: '/now/#now-' + n.date,
          excerpt: '',
          body: stripHtml(n.html)
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
          excerpt: b.note || '',
          body: ''
        });
      });
    }

    return Promise.all(textFetches).then(function () { return items; });
  }

  // Title matches rank highest, then tag/excerpt, then a match found only
  // in the full body text. Returns null for no match at all.
  function scoreItem(item, q) {
    var title = (item.title || '').toLowerCase();
    var excerpt = (item.excerpt || '').toLowerCase();
    var body = (item.body || '').toLowerCase();

    var score = 0;
    if (title === q) score += 200;
    else if (title.indexOf(q) === 0) score += 120;
    else if (title.indexOf(q) !== -1) score += 80;
    if (excerpt.indexOf(q) !== -1) score += 20;
    if (item.type && item.type.toLowerCase() === q) score += 15;
    if (body.indexOf(q) !== -1) score += 5;

    return score > 0 ? score : null;
  }

  function snippetFor(item, q) {
    var title = (item.title || '').toLowerCase();
    if (title.indexOf(q) !== -1) return '';
    if (item.excerpt && item.excerpt.toLowerCase().indexOf(q) !== -1) return item.excerpt;
    var body = item.body || '';
    var idx = body.toLowerCase().indexOf(q);
    if (idx === -1) return '';
    var radius = 50;
    var start = Math.max(0, idx - radius);
    var end = Math.min(body.length, idx + q.length + radius);
    return (start > 0 ? '…' : '') + body.slice(start, end).trim() + (end < body.length ? '…' : '');
  }

  function runSearch(items, query) {
    var q = query.trim().toLowerCase();
    if (!q) return [];
    return items
      .map(function (item) {
        var score = scoreItem(item, q);
        return score === null ? null : { item: item, score: score, snippet: snippetFor(item, q) };
      })
      .filter(Boolean)
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 20);
  }

  function injectUI() {
    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.id = 'site-search-trigger';
    trigger.setAttribute('aria-label', 'Search this site (press / )');
    trigger.innerHTML =
      '<span class="site-search-icon">&#9906;</span>' +
      '<span class="site-search-label">Search</span>' +
      '<span class="site-search-kbd">/</span>';

    // Prefer sitting in-flow near the page's own navigation: the homepage
    // has a dedicated slot under the header; other pages just have a
    // "back to home" link at the top of <main>. Only fall back to a fixed
    // floating button if neither exists.
    var slot = document.getElementById('search-trigger-slot');
    var back = document.querySelector('main > a.back');
    if (slot) {
      trigger.classList.add('inline');
      slot.appendChild(trigger);
    } else if (back) {
      trigger.classList.add('inline');
      back.insertAdjacentElement('afterend', trigger);
    } else {
      document.body.appendChild(trigger);
    }

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

    // Kick off eagerly (not on first open) so the full-text fetches for
    // articles/posts have a head start by the time someone actually types.
    var itemsReady = dataReady.then(buildIndex);

    function renderMatches(matches) {
      if (!input.value.trim()) {
        results.innerHTML = '';
        return;
      }
      if (!matches.length) {
        results.innerHTML = '<p class="site-search-empty">No matches.</p>';
        return;
      }
      results.innerHTML = matches.map(function (m) {
        var meta = [m.item.type, m.item.date].filter(Boolean).join(' · ');
        var snippet = m.snippet ? '<span class="site-search-result-snippet">' + m.snippet + '</span>' : '';
        return '<a class="site-search-result" href="' + m.item.url + '">' +
          '<span class="site-search-result-head">' +
            '<span class="site-search-result-title">' + m.item.title + '</span>' +
            '<span class="site-search-result-meta">' + meta + '</span>' +
          '</span>' +
          snippet +
        '</a>';
      }).join('');
    }

    function runAndRender() {
      var query = input.value;
      itemsReady.then(function (items) {
        // Bail if the query changed while we were waiting on fetches.
        if (input.value !== query) return;
        renderMatches(runSearch(items, query));
      });
    }

    function open() {
      overlay.classList.add('active');
      input.value = '';
      results.innerHTML = '';
      setTimeout(function () { input.focus(); }, 0);
    }

    function close() {
      overlay.classList.remove('active');
    }

    trigger.addEventListener('click', open);
    input.addEventListener('input', runAndRender);

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
