// Site-wide search. Self-contained: injects a plain search input (no
// <script src="/search.js"></script> near end of <body> on any page to get search for it

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
          bookmark: true, // bookmark "type" values (article/video/paper/…) can collide
          date: b.date,   // with content types, so this flag — not the type string — is
          url: '/bookmarks.html', // what the sort uses to push bookmarks last.
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
      .sort(function (a, b) {
        // Bookmarks are still fully searchable, just always shown last —
        // they're saved links, not your own writing, so your own content
        // should surface first.
        if (!!a.item.bookmark !== !!b.item.bookmark) return a.item.bookmark ? 1 : -1;
        return b.score - a.score;
      })
      .slice(0, 20);
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Escapes text and wraps the first case-insensitive match of q in <mark>,
  // so the matched word is visually obvious inside a body-text snippet
  // instead of just showing the surrounding context.
  function highlight(text, q) {
    text = text || '';
    if (!q) return escapeHtml(text);
    var idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return escapeHtml(text);
    return escapeHtml(text.slice(0, idx)) +
      '<mark>' + escapeHtml(text.slice(idx, idx + q.length)) + '</mark>' +
      escapeHtml(text.slice(idx + q.length));
  }

  function injectUI() {
    var wrap = document.createElement('div');
    wrap.id = 'site-search';
    wrap.innerHTML =
      '<input id="site-search-input" type="text" placeholder="Search…" autocomplete="off" spellcheck="false" aria-label="Search this site">' +
      '<div id="site-search-results"></div>';

    var input = wrap.querySelector('#site-search-input');
    var results = wrap.querySelector('#site-search-results');

    // Prefer sitting in-flow near the page's own navigation: the homepage
    // has a dedicated slot under the header; other pages just have a
    // "back to home" link at the top of <main>, so a matching slot is
    // created right after it (never inserted as an inline sibling — that
    // left it jammed against the link text with no proper spacing).
    var slot = document.getElementById('search-trigger-slot');
    if (!slot) {
      var back = document.querySelector('main > a.back');
      if (back) {
        slot = document.createElement('div');
        slot.id = 'search-trigger-row';
        back.insertAdjacentElement('afterend', slot);
      }
    }
    if (slot) {
      wrap.classList.add('inline');
      slot.appendChild(wrap);
    } else {
      document.body.appendChild(wrap);
    }

    // Kick off eagerly (not on first keystroke) so the full-text fetches
    // for articles/posts have a head start by the time someone types.
    var itemsReady = dataReady.then(buildIndex);

    function renderMatches(matches, q) {
      if (!input.value.trim()) {
        results.classList.remove('active');
        results.innerHTML = '';
        return;
      }
      if (!matches.length) {
        results.innerHTML = '<p class="site-search-empty">No matches.</p>';
        results.classList.add('active');
        return;
      }
      results.innerHTML = matches.map(function (m) {
        var meta = [m.item.type, m.item.date].filter(Boolean).join(' · ');
        // Snippets come from body/tag text, not the title, so that's where
        // the match is easy to lose in context — highlight it there.
        var snippet = m.snippet ? '<span class="site-search-result-snippet">' + highlight(m.snippet, q) + '</span>' : '';
        return '<a class="site-search-result" href="' + m.item.url + '">' +
          '<span class="site-search-result-head">' +
            '<span class="site-search-result-title">' + highlight(m.item.title, q) + '</span>' +
            '<span class="site-search-result-meta">' + escapeHtml(meta) + '</span>' +
          '</span>' +
          snippet +
        '</a>';
      }).join('');
      results.classList.add('active');
    }

    function runAndRender() {
      var query = input.value;
      var q = query.trim().toLowerCase();
      itemsReady.then(function (items) {
        // Bail if the query changed while we were waiting on fetches.
        if (input.value !== query) return;
        renderMatches(runSearch(items, query), q);
      });
    }

    input.addEventListener('input', runAndRender);

    // Re-show the dropdown if you click back into an input that already
    // has a query, and hide it when clicking anywhere outside the widget.
    input.addEventListener('focus', function () {
      if (input.value.trim()) results.classList.add('active');
    });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) results.classList.remove('active');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.activeElement === input) {
        input.value = '';
        results.classList.remove('active');
        results.innerHTML = '';
        input.blur();
        return;
      }
      var active = document.activeElement;
      var typing = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
      if (e.key === '/' && !typing) {
        e.preventDefault();
        input.focus();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectUI);
  } else {
    injectUI();
  }
})();
