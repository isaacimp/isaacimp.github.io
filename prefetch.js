// Prefetch internal pages the moment the pointer lands on a link (or a touch
// starts), so the click that follows is near-instant. One <link> per URL,
// same-origin only, skipped on data-saver connections.
(function () {
  var c = navigator.connection;
  if (c && (c.saveData || /2g/.test(c.effectiveType || ''))) return;
  var seen = {};
  function prefetch(e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.origin !== location.origin || a.hash && a.pathname === location.pathname) return;
    if (a.target === '_blank' || /^(mailto|tel):/.test(a.getAttribute('href'))) return;
    if (seen[a.href]) return;
    seen[a.href] = 1;
    var l = document.createElement('link');
    l.rel = 'prefetch';
    l.href = a.href;
    document.head.appendChild(l);
  }
  document.addEventListener('mouseover', prefetch, { passive: true });
  document.addEventListener('touchstart', prefetch, { passive: true });
})();
