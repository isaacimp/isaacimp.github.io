// Adds a "Back" link that goes to wherever the visitor actually came
// from, alongside each page's existing home link — <script src="/back.js">
// near the end of <body> on any page with an <a class="back"> to get it.
//
// Progressive enhancement only: if there's no referrer, it's off-site, or
// it's the same page reloaded, nothing changes and the existing home link
// is all that shows.

(function () {
  'use strict';

  var homeLinks = document.querySelectorAll('a.back');
  if (!homeLinks.length) return;

  var ref = document.referrer;
  if (!ref) return;

  var refUrl;
  try {
    refUrl = new URL(ref);
  } catch (e) {
    return;
  }
  if (refUrl.hostname !== location.hostname) return;
  if (ref === location.href) return;

  homeLinks.forEach(function (homeLink) {
    var backLink = document.createElement('a');
    backLink.href = ref;
    backLink.className = 'back back-prev';
    backLink.textContent = '← Back';
    backLink.addEventListener('click', function (e) {
      if (history.length > 1) {
        e.preventDefault();
        history.back();
      }
    });

    var sep = document.createElement('span');
    sep.className = 'back-sep';
    sep.textContent = '·';

    homeLink.textContent = homeLink.textContent.replace(/^←\s*/, '');
    homeLink.parentNode.insertBefore(backLink, homeLink);
    homeLink.parentNode.insertBefore(sep, homeLink);
  });
})();
