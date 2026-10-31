const { escapeHtml: esc, stripTags, tagId, formatDate } = require('./lib');

module.exports = function createTemplates({ site, css }) {
  const host = url => new URL(url).host;

  const navLink = (label, path, current) =>
    `<a href="${path}"${path === current ? ' aria-current="page"' : ''}>${esc(label)}</a>`;

  const nav = current =>
    `<nav>${navLink(site.name, '/', current)}${site.nav.map(item => navLink(item.label, item.path, current)).join('')}</nav>`;

  const tagLinks = tags => tags.map(tag => `<a href="/tags/#${tagId(tag)}">${esc(tag)}</a>`).join(', ');

  const shell = ({ title, description, path, robots, section, landing, body }) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
${description ? `<meta name="description" content="${esc(description)}">\n` : ''}<link rel="canonical" href="${site.url}${path}">
${robots ? `<meta name="robots" content="${esc(robots)}">\n` : ''}<meta property="og:title" content="${esc(title)}">
${description ? `<meta property="og:description" content="${esc(description)}">\n` : ''}<meta property="og:url" content="${site.url}${path}">
<meta name="theme-color" content="#f7f7f5">
<meta name="theme-color" content="#17171a" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/win95fa-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<style>${css}</style>
<script type="speculationrules">{"prerender":[{"where":{"href_matches":"/*"},"eagerness":"moderate"}]}</script>
</head>
<body>
${landing ? '' : nav(section)}
${body}
</body>
</html>
`;

  const home = doc => shell({
    title: doc.title,
    description: doc.description,
    path: '/',
    landing: true,
    body: `<main class="landing">
<h1>${esc(doc.title)}</h1>
${doc.html.replace(/<p>/g, '<p class="lead">')}
</main>`
  });

  const page = doc => shell({
    title: `${doc.title} — ${site.name}`,
    description: doc.description,
    path: doc.path,
    robots: doc.robots,
    section: doc.path,
    body: `<main>
<h1>${esc(doc.title)}</h1>
${doc.html}
</main>`
  });

  const itemMeta = (doc, collection) => {
    if (collection.dir === 'projects') {
      return `${doc.url ? `<p class="meta"><a href="${esc(doc.url)}">Visit ${esc(host(doc.url))} ↗</a></p>\n` : ''}${doc.description ? `<p class="sub">${esc(doc.description)}</p>\n` : ''}`;
    }
    const parts = [`<time datetime="${doc.date}">${formatDate(doc.date)}</time>`];
    if (doc.tags.length) parts.push(tagLinks(doc.tags));
    return `<p class="meta">${parts.join(' · ')}</p>\n`;
  };

  const item = (doc, collection) => shell({
    title: `${doc.title} — ${site.name}`,
    description: doc.description,
    path: doc.path,
    robots: doc.robots,
    section: collection.index,
    body: `<main>
<h1>${esc(doc.title)}</h1>
${itemMeta(doc, collection)}${doc.html}
</main>`
  });

  const row = (doc, collection) => `<li><a href="${doc.path}">${esc(doc.title)}</a>${
    collection.dir === 'projects' && doc.url ? `<a class="visit" href="${esc(doc.url)}">${esc(host(doc.url))} ↗</a>` : ''
  }${collection.showDate ? `<time datetime="${doc.date}">${formatDate(doc.date)}</time>` : ''}${
    doc.description ? `<span>${esc(doc.description)}</span>` : ''
  }</li>`;

  const list = (collection, intro, docs) => shell({
    title: `${collection.title} — ${site.name}`,
    description: stripTags(intro.html) || undefined,
    path: collection.index,
    section: collection.index,
    body: `<main>
<h1>${esc(collection.title)}</h1>
${intro.html}<ul class="list">
${docs.map(doc => row(doc, collection)).join('\n')}
</ul>
</main>`
  });

  const now = (collection, intro, entries) => shell({
    title: `${collection.title} — ${site.name}`,
    description: stripTags(intro.html) || undefined,
    path: collection.index,
    section: collection.index,
    body: `<main>
<h1>${esc(collection.title)}</h1>
${intro.html}${entries.map(entry => `<section class="entry" id="${entry.slug}">
<h2><a href="#${entry.slug}">${formatDate(entry.date)}</a></h2>
${entry.html}</section>`).join('\n')}
</main>`
  });

  const links = items => `<ul>\n${items.map(([label, path]) => `<li><a href="${esc(path)}">${esc(label)}</a></li>`).join('\n')}\n</ul>`;

  const everything = ({ pages, collections }) => shell({
    title: `Site — ${site.name}`,
    description: `Every page on ${site.name}.`,
    path: '/site.html',
    section: '/site.html',
    body: `<main class="site">
<h1>Site</h1>
<h2>Pages</h2>
${links([['Home', '/'], ...pages.map(doc => [doc.title, doc.path]), ['Tags', '/tags/']])}
${collections.map(({ collection, docs }) => `<h2><a href="${collection.index}">${esc(collection.title)}</a></h2>
${collection.dir === 'now'
    ? `<ul class="inline">\n${docs.map(doc => `<li><a href="${collection.index}#${doc.slug}">${formatDate(doc.date)}</a></li>`).join('\n')}\n</ul>`
    : links(docs.map(doc => [doc.title, doc.path]))}`).join('\n')}
<h2>Elsewhere</h2>
${links([...site.links.map(link => [link.label, link.url]), ['Email', `mailto:${site.email}`]])}
</main>`
  });

  const tags = groups => shell({
    title: `Tags — ${site.name}`,
    path: '/tags/',
    section: '/site.html',
    body: `<main class="site">
<h1>Tags</h1>
${groups.map(group => `<h2 id="${tagId(group.tag)}">${esc(group.tag)}</h2>
${links(group.docs.map(doc => [doc.title, doc.path]))}`).join('\n')}
</main>`
  });

  const notFound = () => shell({
    title: `Not found — ${site.name}`,
    path: '/404.html',
    robots: 'noindex',
    section: '',
    body: `<main>
<h1>Not found</h1>
<p>There is nothing at this address. <a href="/site.html">Everything on the site</a> is listed on one page.</p>
</main>`
  });

  return { home, page, item, list, now, everything, tags, notFound };
};
