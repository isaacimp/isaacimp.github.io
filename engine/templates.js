const { escapeHtml: esc, slugify, formatDate } = require('./lib');

module.exports = function createTemplates({ site, css }) {
  const host = url => new URL(url).host;
  const isHere = (path, here) => (path === here ? ' aria-current="page"' : '');
  const motion = (collection, doc) => ` style="view-transition-name:${collection.dir}-${doc.slug}"`;
  const tagLinks = tags => tags.map(tag => `<a href="/tags/#${slugify(tag)}">${esc(tag)}</a>`).join(', ');

  const header = here => `<a class="skip" href="#main">Skip to content</a>
<header class="bar">
<a class="name" href="/">${esc(site.name)}</a>
<nav aria-label="Site">
${site.nav.map(item => `<a href="${item.path}"${isHere(item.path, here)}>${esc(item.label)}</a>`).join('\n')}
</nav>
</header>`;

  const footer = `<footer class="bar">
<a href="#top">↑ Top</a>
<a href="/site.html">Index</a>
<a href="/feed.xml">Feed</a>
<a href="mailto:${esc(site.email)}">Email</a>
</footer>`;

  const shell = ({ title, description, path, robots, here, landing, body }) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
${description ? `<meta name="description" content="${esc(description)}">\n` : ''}<link rel="canonical" href="${site.url}${path}">
${robots ? `<meta name="robots" content="${esc(robots)}">\n` : ''}<meta property="og:title" content="${esc(title)}">
${description ? `<meta property="og:description" content="${esc(description)}">\n` : ''}<meta property="og:url" content="${site.url}${path}">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/atom+xml" title="${esc(site.name)}" href="/feed.xml">
<style>${css}</style>
<script type="speculationrules">{"prerender":[{"where":{"href_matches":"/*"},"eagerness":"moderate"}]}</script>
</head>
<body id="top">
${landing ? body : `${header(here)}\n<main id="main">\n${body}\n</main>\n${footer}`}
</body>
</html>
`;

  const fitToScreen = `<script>
const landing = document.querySelector('.landing');
const nameRow = landing.querySelector('.top');
landing.classList.add('fit');
function largest(element, fits) {
  let low = 8;
  let high = 400;
  while (high - low > 0.5) {
    const size = (low + high) / 2;
    element.style.fontSize = size + 'px';
    if (fits(size)) low = size;
    else high = size;
  }
  return low;
}
function fit() {
  const widest = largest(nameRow, () => nameRow.scrollWidth <= nameRow.clientWidth);
  const rowSize = size => Math.min(widest, size * 1.4) + 'px';
  const size = largest(landing, size => {
    nameRow.style.fontSize = rowSize(size);
    return landing.scrollHeight <= landing.clientHeight && landing.scrollWidth <= landing.clientWidth;
  });
  landing.style.fontSize = size + 'px';
  nameRow.style.fontSize = rowSize(size);
}
fit();
addEventListener('resize', () => requestAnimationFrame(fit));
</script>`;

  const home = doc => shell({
    title: doc.title,
    description: doc.description,
    path: '/',
    landing: true,
    body: `<main class="landing" id="main">
<div class="top">
<h1>${esc(doc.title)}</h1>
<span class="leader"></span>
<a class="index" href="/site.html">Index</a>
</div>
${doc.html.replace(/<p>/g, '<p class="lead">')}</main>
${fitToScreen}`
  });

  const page = doc => shell({
    title: `${doc.title} — ${site.name}`,
    description: doc.description,
    path: doc.path,
    robots: doc.robots,
    here: doc.path,
    body: `<h1>${esc(doc.title)}</h1>
<div class="prose">
${doc.html}</div>`
  });

  const intro = html => (html ? `<div class="intro">\n${html}</div>\n` : '');

  const row = (doc, collection) => {
    const when = collection.showDate ? `<time datetime="${doc.date}">${doc.date}</time>` : '';
    const side = collection.showDate
      ? `<span class="size">${doc.minutes} min</span>`
      : doc.url ? `<a class="out" href="${esc(doc.url)}">${esc(host(doc.url))}</a>` : '';
    const about = doc.description ? `<p>${esc(doc.description)}</p>` : '';
    return `<li>${when}<a class="title" href="${doc.path}"${motion(collection, doc)}>${esc(doc.title)}</a>${side}${about}</li>`;
  };

  const list = (collection, introHtml, introText, docs) => shell({
    title: `${collection.title} — ${site.name}`,
    description: introText,
    path: collection.index,
    here: collection.index,
    body: `<h1>${esc(collection.title)} <span class="count">${docs.length}</span></h1>
${intro(introHtml)}<ul class="rows${collection.showDate ? ' dated' : ''}">
${docs.map(doc => row(doc, collection)).join('\n')}
</ul>`
  });

  const contents = headings => (headings.length < 3 ? '' : `<nav class="toc" aria-label="Contents">
<p>Contents</p>
<ol>
${headings.map(heading => `<li><a href="#${heading.id}">${esc(heading.text)}</a></li>`).join('\n')}
</ol>
</nav>
`);

  const meta = (doc, collection) => {
    const parts = collection.showDate
      ? [`<time datetime="${doc.date}">${formatDate(doc.date)}</time>`, `${doc.minutes} min read`, doc.tags.length && tagLinks(doc.tags)]
      : [doc.url && `<a class="out" href="${esc(doc.url)}">${esc(host(doc.url))}</a>`, doc.description && esc(doc.description)];
    return parts.filter(Boolean).join(' · ');
  };

  const pager = (collection, before, after) => {
    const [first, second] = collection.showDate ? ['Newer', 'Older'] : ['Previous', 'Next'];
    const link = (doc, label, rel) => (doc ? `<a href="${doc.path}" rel="${rel}"><span>${label}</span>${esc(doc.title)}</a>` : '<span></span>');
    return `<nav class="pager" aria-label="More ${collection.title.toLowerCase()}">
${link(before, first, 'prev')}
<a href="${collection.index}">All ${collection.title.toLowerCase()}</a>
${link(after, second, 'next')}
</nav>`;
  };

  const item = (doc, collection, before, after) => shell({
    title: `${doc.title} — ${site.name}`,
    description: doc.description,
    path: doc.path,
    robots: doc.robots,
    here: collection.index,
    body: `<article>
<h1${motion(collection, doc)}>${esc(doc.title)}</h1>
<p class="meta">${meta(doc, collection)}</p>
${contents(doc.headings)}<div class="prose">
${doc.html}</div>
</article>
${pager(collection, before, after)}`
  });

  const now = (collection, introHtml, introText, entries) => shell({
    title: `${collection.title} — ${site.name}`,
    description: introText,
    path: collection.index,
    here: collection.index,
    body: `<h1>${esc(collection.title)}</h1>
${intro(introHtml)}${entries.map(entry => `<section class="entry" id="${entry.slug}">
<h2><a href="#${entry.slug}">${formatDate(entry.date)}</a></h2>
<div class="prose">
${entry.html}</div>
</section>`).join('\n')}`
  });

  const branch = (label, path, children = [], style = '') => {
    const name = path ? `<a href="${esc(path)}">${esc(label)}</a>` : esc(label);
    if (!children.length) return `<li>${name}</li>`;
    return `<li>${name} <span class="count">${children.length}</span>
<ul${style ? ` class="${style}"` : ''}>
${children.map(([childLabel, childPath]) => `<li><a href="${esc(childPath)}">${esc(childLabel)}</a></li>`).join('\n')}
</ul></li>`;
  };

  const everything = ({ pages, collections, tags }) => shell({
    title: `Index — ${site.name}`,
    description: `Index page for ${site.name}.`,
    path: '/site.html',
    here: '/site.html',
    body: `<h1>Index</h1>
<ul class="tree">
${branch('Home', '/')}
${collections.map(({ collection, docs }) => collection.dir === 'now'
    ? branch(collection.title, collection.index, docs.map(doc => [formatDate(doc.date), `${collection.index}#${doc.slug}`]), 'inline')
    : branch(collection.title, collection.index, docs.map(doc => [doc.title, doc.path]))).join('\n')}
${pages.map(doc => branch(doc.title, doc.path)).join('\n')}
${branch('Tags', '/tags/', tags.map(group => [group.tag, `/tags/#${slugify(group.tag)}`]), 'inline')}
${branch('Feed', '/feed.xml')}
${branch('Elsewhere', '', [...site.links.map(link => [link.label, link.url]), ['Email', `mailto:${site.email}`]])}
</ul>`
  });

  const tags = groups => shell({
    title: `Tags — ${site.name}`,
    description: `Everything on ${site.name} by tag.`,
    path: '/tags/',
    here: '/site.html',
    body: `<h1>Tags</h1>
${groups.map(group => `<section class="tag" id="${slugify(group.tag)}">
<h2>${esc(group.tag)} <span class="count">${group.docs.length}</span></h2>
<ul class="rows dated">
${group.docs.map(doc => `<li><time datetime="${doc.date}">${doc.date}</time><a class="title" href="${doc.path}">${esc(doc.title)}</a><span class="size">${doc.minutes} min</span></li>`).join('\n')}
</ul>
</section>`).join('\n')}`
  });

  const notFound = () => shell({
    title: `Not found — ${site.name}`,
    path: '/404.html',
    robots: 'noindex',
    here: '',
    body: `<h1>Not found</h1>
<p>Nothing lives at this address. <a href="/site.html">Index</a> for all links.</p>`
  });

  const feed = docs => `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
<title>${esc(site.name)}</title>
<link href="${site.url}/"/>
<link rel="self" href="${site.url}/feed.xml"/>
<id>${site.url}/</id>
<updated>${docs[0].date}T00:00:00Z</updated>
<author><name>${esc(site.author)}</name></author>
${docs.map(doc => `<entry>
<title>${esc(doc.title)}</title>
<link href="${site.url}${doc.path}"/>
<id>${site.url}${doc.path}</id>
<updated>${doc.date}T00:00:00Z</updated>
${doc.description ? `<summary>${esc(doc.description)}</summary>\n` : ''}<content type="html">${esc(doc.html)}</content>
</entry>`).join('\n')}
</feed>
`;

  return { home, page, list, item, now, everything, tags, notFound, feed };
};
