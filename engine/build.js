const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { readFile, readFolder, writeFile } = require('./lib');
const createTemplates = require('./templates');

const root = path.resolve(__dirname, '..');
const contentDir = path.join(root, 'content');
const distDir = path.join(root, 'dist');

const site = JSON.parse(fs.readFileSync(path.join(contentDir, 'site.json'), 'utf8'));
const css = fs.readFileSync(path.join(root, 'theme', 'style.css'), 'utf8').replace(/\n\s*/g, '');
const templates = createTemplates({ site, css });

const byDate = (a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug);
const byOrder = (a, b) => a.order - b.order || byDate(a, b);

const collections = [
  { dir: 'articles', title: 'Articles', index: '/articles/', url: slug => `/${slug}.html`, showDate: true, sort: byDate },
  { dir: 'posts', title: 'Posts', index: '/posts/', url: slug => `/posts/${slug}.html`, showDate: true, sort: byDate },
  { dir: 'projects', title: 'Projects', index: '/projects/', url: slug => `/projects/${slug}.html`, sort: byOrder },
  { dir: 'now', title: 'Now', index: '/now/', sort: byDate }
];

const errors = [];
const output = new Map();
const listed = [];

const render = markdown => marked.parse(markdown, { gfm: true });

function add(urlPath, html, robots) {
  const file = urlPath.endsWith('/') ? `${urlPath.slice(1)}index.html` : urlPath.slice(1);
  if (output.has(file)) throw new Error(`two pages write ${file}`);
  output.set(file, html);
  if (!robots && urlPath !== '/404.html') listed.push(urlPath);
}

function toDoc({ slug, data, body }, collection) {
  const isNow = collection.dir === 'now';
  const date = data.date || (isNow ? slug : '');
  if (!isNow && !data.title) throw new Error('missing title');
  if (collection.showDate || isNow) {
    if (!/^\d{4}-\d{2}(-\d{2})?$/.test(date)) throw new Error(`date "${date}" is not like 2026-10-28`);
  }
  return {
    slug,
    title: data.title,
    date,
    description: data.description,
    tags: data.tags || [],
    robots: data.robots,
    url: data.url,
    order: data.order === undefined ? 999 : Number(data.order),
    path: collection.url ? collection.url(slug) : null,
    html: render(body)
  };
}

function load(collection) {
  const intro = readFile(path.join(contentDir, collection.dir, 'index.md'));
  const docs = [];
  for (const source of readFolder(path.join(contentDir, collection.dir))) {
    try {
      docs.push(toDoc(source, collection));
    } catch (error) {
      errors.push(`${path.relative(root, source.file)}: ${error.message}`);
    }
  }
  docs.sort(collection.sort);
  return { collection, intro: { html: render(intro.body) }, docs };
}

function loadPages() {
  return readFolder(contentDir).map(({ slug, data, body }) => ({
    title: data.title,
    description: data.description,
    robots: data.robots,
    path: `/${slug}.html`,
    html: render(body)
  }));
}

function tagGroups(loaded) {
  const groups = new Map();
  for (const { collection, docs } of loaded) {
    if (collection.dir === 'now') continue;
    for (const doc of docs) {
      for (const tag of doc.tags) groups.set(tag, [...(groups.get(tag) || []), doc]);
    }
  }
  return [...groups.keys()].sort().map(tag => ({ tag, docs: groups.get(tag) }));
}

function sitemap() {
  const urls = listed.map(urlPath => `  <url><loc>${site.url}${urlPath}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function copyStatic() {
  const copies = [['theme/favicon.svg', 'favicon.svg'], ['theme/fonts', 'fonts'], ['content/img', 'img'], ['content/pdfs', 'pdfs']];
  for (const [from, to] of copies) {
    if (fs.existsSync(path.join(root, from))) fs.cpSync(path.join(root, from), path.join(distDir, to), { recursive: true });
  }
  const publicDir = path.join(root, 'public');
  if (fs.existsSync(publicDir)) {
    for (const name of fs.readdirSync(publicDir)) fs.cpSync(path.join(publicDir, name), path.join(distDir, name), { recursive: true });
  }
}

const home = readFile(path.join(contentDir, 'index.md'));
const pages = loadPages();
const loaded = collections.map(load);

add('/', templates.home({ ...home.data, html: render(home.body) }));
for (const page of pages) add(page.path, templates.page(page), page.robots);
for (const { collection, intro, docs } of loaded) {
  if (collection.dir === 'now') {
    add(collection.index, templates.now(collection, intro, docs));
    continue;
  }
  add(collection.index, templates.list(collection, intro, docs));
  for (const doc of docs) add(doc.path, templates.item(doc, collection), doc.robots);
}
add('/site.html', templates.everything({ pages, collections: loaded }));
add('/tags/', templates.tags(tagGroups(loaded)));
add('/404.html', templates.notFound());
output.set('sitemap.xml', sitemap());

fs.rmSync(distDir, { recursive: true, force: true });
for (const [file, content] of output) writeFile(path.join(distDir, file), content);
copyStatic();

console.log(`${output.size} files written to dist/`);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
}
