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
const text = fs.existsSync(src('text.json')) ? JSON.parse(fs.readFileSync(src('text.json'), 'utf8')) : {};
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
        images: Array.isArray(fm.images) ? fm.images.map(String) : [],
        order: fm.order != null && fm.order !== '' && !Number.isNaN(Number(fm.order)) ? Number(fm.order) : 999
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

const ICON_GO = '<svg class="ico" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg>';
const ICON_INFO = '<svg class="ico" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="7" r="1.2" fill="currentColor" stroke="none"/><path d="M12 11.5V18"/></svg>';

function imageSize(file) {
  try {
    const b = fs.readFileSync(file);
    if (b[0] === 0x89 && b.toString('latin1', 1, 4) === 'PNG') return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        if (m === 0xff) { i++; continue; }
        if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
        i += 2 + b.readUInt16BE(i + 2);
      }
    }
  } catch {
    return null;
  }
  return null;
}

function projectRows(projects) {
  const sorted = [...projects].sort((a, b) => a.order - b.order || (a.date < b.date ? 1 : a.date > b.date ? -1 : 0) || (a.slug < b.slug ? -1 : 1));
  return sorted.map((p, i) => {
    const link = p.url || `/projects/${p.slug}.html`;
    const img = p.images[0];
    const dims = img && imageSize(path.join(ROOT, 'content', 'media', img.replace(/^\//, '')));
    const preview = img
      ? `\n            <span class="project-preview"><img src="${esc(img)}" alt=""${dims ? ` width="${dims.w}" height="${dims.h}"` : ''} loading="lazy" decoding="async"></span></span>`
      : '</span>';
    return `      <div class="project">
        <span class="project-idx">${String(i + 1).padStart(2, '0')}</span>
        <span class="project-body"><a class="project-name" href="${esc(link)}">${esc(p.title)}</a><span class="project-desc">${esc(p.description)}</span></span>
        <span class="project-side">
          <a class="project-go" href="${esc(link)}" aria-label="Visit ${esc(p.title)}">${ICON_GO}</a>
          <span class="project-info"><a href="/projects/${p.slug}.html" aria-label="About ${esc(p.title)}: how it works and how it was made" title="About this project">${ICON_INFO}</a>${preview}
        </span>
      </div>`;
  }).join('\n');
}

function fillTokens(html, file, projects) {
  return html.replace(/\{\{(!?)([\w.-]+)\}\}/g, (m, plain, key) => {
    if (key === 'projects') return projectRows(projects);
    const value = key.split('.').reduce((o, k) => (o == null ? o : o[k]), text);
    if (typeof value !== 'string') throw new Error(`no text for {{${key}}}; add it to content/text.json`);
    if (plain) return esc(value);
    return /\n\s*\n/.test(value) ? marked.parse(value).trim() : marked.parseInline(value);
  });
}

function buildPages(projects) {
  const pages = [];
  for (const file of files(src('pages'), '.html')) {
    guard(`content/pages/${file}`, () => {
      const { data: fm, content } = matter(fs.readFileSync(src('pages', file), 'utf8'));
      if (!fm.title) throw new Error('missing "title" in front matter');
      if (!fm.path || !fm.path.startsWith('/')) throw new Error('missing "path" (e.g. /uses.html or /now/)');
      emit(outFile(fm.path), renderPage(fm, fillTokens(content, file, projects)));
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
const dated = [];
const built = {};
for (const [name, type] of Object.entries(TYPES)) { built[name] = buildType(name, type); dated.push(...built[name]); }
buildNow();
const pages = buildPages(built.project || []);

emit('style.css', fs.readFileSync(theme('style.css')));
for (const f of files(theme('js'), '.js')) emit(f, fs.readFileSync(theme('js', f), 'utf8').replace(/__EMAIL__/g, site.email || ''));
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
