// TEMPORARY: lets you flip between font pairings on any page to compare
// them. Choice is remembered. Delete this file (and its <script> tags)
// once a pairing is chosen.
(function () {
  var KEY = 'fontPairing', opts = {
    a: 'A · Source Serif 4',
    b: 'B · Literata + Inter',
    c: 'C · Newsreader + Plex',
    d: 'D · Inter (all sans)'
  };
  var q = (location.search.match(/[?&]font=([a-d])/) || [])[1];
  if (q) localStorage.setItem(KEY, q);
  var cur = localStorage.getItem(KEY) || 'a';
  document.documentElement.setAttribute('data-font', cur);
  var bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:99999;display:flex;gap:4px;padding:5px;background:#17171A;border-radius:8px;font:12px/1 system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.3)';
  Object.keys(opts).forEach(function (k) {
    var b = document.createElement('button');
    b.textContent = opts[k];
    b.style.cssText = 'border:0;border-radius:5px;padding:7px 10px;cursor:pointer;font:inherit;color:#EDECE6;background:' + (k === cur ? '#2C5AA0' : 'transparent');
    b.onclick = function () { localStorage.setItem(KEY, k); location.reload(); };
    bar.appendChild(b);
  });
  document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(bar); });
})();
