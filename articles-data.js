// Single source of truth for the Articles list on the homepage (and for
// site search). Add a new object to the TOP when you publish an article —
// nothing else needs manual updating except the file itself and sitemap.xml.
//
// slug: matches the filename in /articles/ (without .html)
// file: exact link text shown in the homepage list (kept as the filename,
//       matching the site's existing convention)
// dateLabel: exact text shown after the dash on the homepage list
// tags: an array of short free-text labels — as many as you want. Each
//       renders as a clickable chip that links to /tags.html?t=<tag>,
//       showing every post/article sharing that tag.
const ARTICLES = [
  { slug: 'treatise-on-health', title: 'Treatise on Health', file: 'treatise-on-health.html', date: '2026-08', dateLabel: 'Aug, 2026 (in progress)', tags: ['health', 'in progress'] },
  { slug: 'productivity-and-coercion', title: 'Productivity and Coercion', file: 'productivity-and-coercion.html', date: '2026-07', dateLabel: 'Jul, 2026', tags: [] },
];
