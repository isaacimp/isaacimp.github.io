const fs = require('fs');
const path = require('path');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WORDS_PER_MINUTE = 230;

const escapeHtml = value => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const stripTags = html => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const slugify = text => text.toLowerCase().replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const readingMinutes = html => Math.max(1, Math.round(stripTags(html).split(' ').length / WORDS_PER_MINUTE));

function formatDate(iso) {
  const [year, month, day] = iso.split('-');
  return day ? `${MONTHS[month - 1]} ${Number(day)}, ${year}` : `${MONTHS[month - 1]} ${year}`;
}

function addHeadingIds(html) {
  const headings = [];
  const used = new Set();
  const result = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (match, inner) => {
    const text = stripTags(inner);
    let id = slugify(text) || 'section';
    while (used.has(id)) id += '-';
    used.add(id);
    headings.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { html: result, headings };
}

function unquote(text) {
  if (/^".*"$/.test(text)) return JSON.parse(text);
  return text.replace(/^'(.*)'$/, '$1');
}

function parseValue(text) {
  if (!text.startsWith('[')) return unquote(text);
  return text.slice(1, -1).split(',').map(item => unquote(item.trim())).filter(Boolean);
}

function parseFile(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: source };
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colon = line.indexOf(':');
    if (colon > 0) data[line.slice(0, colon).trim()] = parseValue(line.slice(colon + 1).trim());
  }
  return { data, body: match[2] };
}

function readFile(file) {
  return fs.existsSync(file) ? parseFile(fs.readFileSync(file, 'utf8')) : { data: {}, body: '' };
}

function readFolder(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(name => name.endsWith('.md') && !name.startsWith('_') && name !== 'index.md')
    .sort()
    .map(name => ({ slug: name.replace(/\.md$/, ''), file: path.join(dir, name), ...readFile(path.join(dir, name)) }));
}

function writeFile(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

module.exports = { escapeHtml, stripTags, slugify, readingMinutes, formatDate, addHeadingIds, readFile, readFolder, writeFile };
