#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const src = (...p) => path.join(ROOT, 'content', ...p);
const theme = (...p) => path.join(ROOT, 'theme', ...p);

marked.setOptions({ gfm: true, breaks: false });

const site = JSON.parse(fs.readFileSync(src('site.json'), 'utf8'));
const errors = [];
const out = new Map();

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const byDateDesc = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug < b.slug ? -1 : 1);

const normDate = v => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v == null ? '' : v).trim());

function longDate(iso) {
  const [y, m, d] = iso.split('-');
  const mon = MONTHS[parseInt(m, 10) - 1];
  if (!mon) return iso;
  return d ? `${mon} ${parseInt(d, 10)}, ${y}` : `${mon}, ${y}`;
}
const monthLabel = iso => longDate(iso.split('-').slice(0, 2).join('-'));

function emit(rel, content) {
  if (out.has(rel)) throw new Error(`two sources both write ${rel}`);
  out.set(rel, content);
}

function files(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith(ext) && !f.startsWith('_')).sort();
}

function guard(label, fn) {
  try { fn(); } catch (err) { errors.push(`${label}: ${err.message}`); console.error(`  ✗ ${label}: ${err.message}`); }
}

const outFile = urlPath => urlPath.replace(/^\//, '') + (urlPath.endsWith('/') ? 'index.html' : '');

function themeCss() {
  const t = site.theme;
  const vars = o => Object.entries(o).map(([k, v]) => `--${k}:${v};`).join('');
  return `:root{${vars(t.fonts)}${vars(t.light)}}@media (prefers-color-scheme: dark){:root{${vars(t.dark)}}}`;
}

function renderPage(p, body) {
  const url = site.url + p.path;
  const depth = outFile(p.path).split('/').length - 1;
  const prefix = '../'.repeat(depth);
  const desc = p.description ? esc(p.description) : '';
  const ogTitle = esc(p.ogTitle || p.title);
  const ogDesc = esc(p.ogDescription || p.description || '');
  const schema = p.schema ? `\n<script type="application/ld+json">\n${JSON.stringify({ '@context': 'https://schema.org', ...p.schema }, null, 2)}\n</script>\n` : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>${esc(p.title)}</title>
${desc ? `<meta name="description" content="${desc}">\n` : ''}<link rel="canonical" href="${url}">
<meta name="robots" content="${esc(p.robots || 'index, follow')}">

<meta property="og:type" content="${p.ogType || 'website'}">
<meta property="og:title" content="${ogTitle}">
${ogDesc ? `<meta property="og:description" content="${ogDesc}">\n` : ''}<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${ogTitle}">
${ogDesc ? `<meta name="twitter:description" content="${ogDesc}">\n` : ''}
<meta name="theme-color" content="${site.theme.light.paper}">
<meta name="theme-color" content="${site.theme.dark.paper}" media="(prefers-color-scheme: dark)">

<link rel="icon" href="${prefix}favicon.svg" type="image/svg+xml">

${(site.preload || []).map(f => `<link rel="preload" href="${f}" as="font" type="font/woff2" crossorigin>`).join('\n')}
<style>${themeCss()}</style>
<link rel="stylesheet" href="${prefix}style.css">
${schema}</head>
<body>
${body}</body>
</html>
`;
}

const tagChips = tags => !tags.length ? '' :
  `<span class="tags">${tags.map(t => `<a class="tag" href="/tags.html?t=${encodeURIComponent(t)}">${esc(t)}</a>`).join('')}</span>`;

const indent = html => html.replace(/\n$/, '').split('\n').map(l => (l ? `    ${l}` : l)).join('\n');

function withContents(html) {
  const heads = [];
  const body = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (m, inner) => {
    const text = inner.replace(/<[^>]+>/g, '');
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    heads.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  const toc = heads.length >= 3
    ? `<nav class="wiki-toc" aria-label="Contents"><span class="wiki-toc-label">Contents</span>${heads.map(h => `<a href="#${h.id}">${esc(h.text)}</a>`).join('')}</nav>`
    : '';
  return { body, toc };
}

const TYPES = {
  article: {
    dir: 'articles', registry: 'ARTICLES', registryFile: 'articles-data.js',
    url: slug => `/${slug}.html`, back: 'site.html#articles',
    fields: m => ({ slug: m.slug, title: m.title, file: `${m.slug}.html`, date: m.date, dateLabel: m.dateLabel, tags: m.tags, description: m.description }),
    header: m => `<header class="article-header">
      <h3>${esc(m.title)}</h3>
      <p class="article-meta"><time datetime="${m.date}">${longDate(m.date)}</time> ${tagChips(m.tags)}</p>
    </header>`
  },
  post: {
    dir: 'posts', registry: 'POSTS', registryFile: 'posts-data.js',
    url: slug => `/posts/${slug}.html`, back: '../site.html#posts', articleAttr: ' id="post-body"',
    footer: '\n\n  <p><a href="index.html">&larr; all posts</a></p>',
    fields: m => ({ slug: m.slug, title: m.title, date: m.date, tags: m.tags, description: m.description }),
    header: m => `<header class="article-header">
      <h3>${esc(m.title)}</h3>
      <p class="article-meta"><time datetime="${m.date}">${longDate(m.date)}</time> ${tagChips(m.tags)}</p>
    </header>`
  },
  project: {
    dir: 'projects', registry: 'PROJECTS', registryFile: 'projects-data.js',
    url: slug => `/projects/${slug}.html`, back: '../site.html#projects', contents: true,
    fields: m => ({ slug: m.slug, title: m.title, date: m.date, tags: m.tags, description: m.description, url: m.url, images: m.images }),
    header: (m, toc) => {
      const img = s => esc(s.startsWith('/') ? s : '../' + s);
      return `<header class="article-header wiki-header">
      <h3>${esc(m.title)}</h3>
      <p class="article-meta">${m.url ? `<a class="wiki-visit" href="${esc(m.url)}">Visit ${esc(m.url.replace(/^https?:\/\//, '').replace(/\/$/, ''))} ↗</a>` : ''} ${tagChips(m.tags)}</p>
      ${m.description ? `<p class="wiki-tagline">${esc(m.description)}</p>` : ''}
    </header>
${m.images.length ? `    <div class="wiki-images">${m.images.map(s => `<a href="${img(s)}"><img src="${img(s)}" alt="" loading="lazy"></a>`).join('')}</div>\n` : ''}${toc ? `    ${toc}\n` : ''}`;
    }
  }
};

const registryJs = (name, entries) =>
  `const ${name} = [\n${entries.map(e => '  ' + JSON.stringify(e) + ',').join('\n')}\n];\n`;

function buildType(name, type) {
  const entries = [];
  for (const file of files(src(type.dir), '.md')) {
    const slug = file.replace(/\.md$/, '');
    guard(`content/${type.dir}/${file}`, () => {
      const { data: fm, content } = matter(fs.readFileSync(src(type.dir, file), 'utf8'));
      if (!fm.title || !String(fm.title).trim()) throw new Error('missing "title" in front matter');
      if (!fm.date) throw new Error('missing "date" in front matter');
      const date = normDate(fm.date);
      const m = {
        slug, date,
        title: String(fm.title).trim(),
        dateLabel: fm.dateLabel ? String(fm.dateLabel) : monthLabel(date),
        tags: Array.isArray(fm.tags) ? fm.tags.map(String) : [],
        description: fm.description ? String(fm.description) : '',
        url: fm.url ? String(fm.url) : '',
        images: Array.isArray(fm.images) ? fm.images.map(String) : []
      };
      let html = marked.parse(content || '');
      let toc = '';
      if (type.contents) ({ body: html, toc } = withContents(html));
      const body = `
<main>
  <a href="${type.back}" class="back">&larr; ${esc(site.backLabel)}</a>

  <article class="article-content"${type.articleAttr || ''}>
    ${type.header(m, toc)}

${indent(html)}
  </article>${type.footer || ''}
</main>

${site.articleScripts.map(s => `<script src="${s.src}"${s.defer ? ' defer' : ''}></script>`).join('\n')}
`;
      const urlPath = type.url(slug);
      emit(outFile(urlPath), renderPage({
        title: `${m.title}${site.titleSuffix}`, ogTitle: m.title, description: m.description,
        path: urlPath, robots: fm.robots, ogType: 'article',
        schema: { '@type': 'BlogPosting', headline: m.title, datePublished: m.date, author: { '@type': 'Person', name: site.author, url: site.url + '/' } }
      }, body));
      entries.push({ ...m, urlPath });
    });
  }
  entries.sort(byDateDesc);
  emit(type.registryFile, registryJs(type.registry, entries.map(type.fields)));
  console.log(`  ${name}s: ${entries.length}`);
  return entries;
}

function buildNow() {
  const entries = [];
  for (const file of files(src('now'), '.md')) {
    guard(`content/now/${file}`, () => {
      const { data: fm, content } = matter(fs.readFileSync(src('now', file), 'utf8'));
      const date = normDate(fm.date || file.replace(/\.md$/, ''));
      if (!/^\d{4}-\d{2}(-\d{2})?$/.test(date)) throw new Error(`"${date}" is not YYYY-MM-DD — name the file e.g. 2026-09-17.md`);
      const html = marked.parse(content || '').trim();
      if (!html) throw new Error('empty entry');
      entries.push({ slug: date, date, html });
    });
  }
  entries.sort(byDateDesc);
  emit('now-data.js', registryJs('NOW_ENTRIES', entries.map(e => ({ date: e.date, html: e.html }))));
  console.log(`  now entries: ${entries.length}`);
  return entries;
}

function buildPages() {
  const pages = [];
  for (const file of files(src('pages'), '.html')) {
    guard(`content/pages/${file}`, () => {
      const { data: fm, content } = matter(fs.readFileSync(src('pages', file), 'utf8'));
      if (!fm.title) throw new Error('missing "title" in front matter');
      if (!fm.path || !fm.path.startsWith('/')) throw new Error('missing "path" (e.g. /uses.html or /now/)');
      emit(outFile(fm.path), renderPage(fm, content));
      pages.push(fm);
    });
  }
  console.log(`  pages: ${pages.length}`);
  return pages;
}

function copyDir(from, toRel) {
  if (fs.existsSync(from)) fs.cpSync(from, path.join(DIST, toRel), { recursive: true });
}

function versionLinks(versioned) {
  const hash = {};
  for (const name of versioned) hash[name] = crypto.createHash('md5').update(out.get(name)).digest('hex').slice(0, 8);
  const re = new RegExp('((?:href|src)="(?:/|\\.\\./|\\./)?)(' + versioned.map(n => n.replace(/\./g, '\\.')).join('|') + ')(?:\\?v=[0-9a-f]+)?"', 'g');
  for (const [rel, content] of out) {
    if (!rel.endsWith('.html')) continue;
    out.set(rel, content.replace(re, (m, pre, name) => `${pre}${name}?v=${hash[name]}"`));
  }
}

function sitemap(pages, entries) {
  const urls = [];
  for (const p of pages) if (!/noindex/.test(p.robots || '')) urls.push({ loc: p.path });
  for (const e of entries) urls.push({ loc: e.urlPath, lastmod: /^\d{4}-\d{2}-\d{2}$/.test(e.date) ? e.date : '' });
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${site.url}${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`;
}

function buildAdmin() {
  if (!site.admin || !fs.existsSync(path.join(ROOT, 'admin'))) return;
  const dest = path.join(DIST, 'admin');
  fs.cpSync(path.join(ROOT, 'admin'), dest, { recursive: true });
  for (const [from, to] of [['marked/lib/marked.umd.js', 'marked.umd.js'], ['js-yaml/dist/js-yaml.min.js', 'js-yaml.min.js']]) {
    const f = path.join(ROOT, 'node_modules', from);
    if (!fs.existsSync(f)) { errors.push(`admin: ${from} not found (run npm install)`); continue; }
    fs.mkdirSync(path.join(dest, 'vendor'), { recursive: true });
    fs.copyFileSync(f, path.join(dest, 'vendor', to));
  }
  fs.writeFileSync(path.join(dest, 'config.json'), JSON.stringify({ name: site.name, url: site.url, repo: site.admin.repo, branch: site.admin.branch || 'main' }, null, 2) + '\n');
}

console.log('Building...');
const pages = buildPages();
const dated = [];
for (const [name, type] of Object.entries(TYPES)) dated.push(...buildType(name, type));
buildNow();

emit('style.css', fs.readFileSync(theme('style.css')));
for (const f of files(theme('js'), '.js')) emit(f, fs.readFileSync(theme('js', f)));
for (const f of files(src('data'), '.json')) {
  const name = f.replace(/\.json$/, '');
  guard(`content/data/${f}`, () => emit(`${name}-data.js`, registryJs(name.toUpperCase(), JSON.parse(fs.readFileSync(src('data', f), 'utf8')))));
}
emit('sitemap.xml', sitemap(pages, dated));
emit('.nojekyll', '');

const versioned = [...out.keys()].filter(k => !k.includes('/') && /\.(js|css)$/.test(k));
versionLinks(versioned);

fs.rmSync(DIST, { recursive: true, force: true });
for (const [rel, content] of out) {
  const dest = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content);
}
fs.copyFileSync(theme('favicon.svg'), path.join(DIST, 'favicon.svg'));
buildAdmin();
copyDir(theme('fonts'), 'fonts');
if (fs.existsSync(src('media'))) for (const d of fs.readdirSync(src('media'))) copyDir(src('media', d), d);
if (fs.existsSync(path.join(ROOT, 'public'))) for (const f of fs.readdirSync(path.join(ROOT, 'public'))) fs.cpSync(path.join(ROOT, 'public', f), path.join(DIST, f), { recursive: true });

console.log(`\n${out.size} generated files -> dist/` + (errors.length ? `\n${errors.length} error(s):\n  ` + errors.join('\n  ') : ''));
if (errors.length) process.exitCode = 1;
