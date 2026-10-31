const fs = require('fs');
const path = require('path');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const escapeHtml = value => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const stripTags = html => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const tagId = tag => tag.toLowerCase().replace(/[^a-z0-9]+/g, '-');

function formatDate(iso) {
  const [year, month, day] = iso.split('-');
  return day ? `${MONTHS[month - 1]} ${Number(day)}, ${year}` : `${MONTHS[month - 1]} ${year}`;
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

module.exports = { escapeHtml, stripTags, tagId, formatDate, readFile, readFolder, writeFile };
