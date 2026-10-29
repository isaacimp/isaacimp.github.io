import { h, pool } from '../util.js';
import * as fm from '../frontmatter.js';

const FIELDS = [
  { key: 'title', label: 'Page title', required: true, hint: 'Shown in the browser tab and in search results.' },
  { key: 'description', label: 'Description', long: true, hint: 'Shown in search results and link previews.' },
  { key: 'ogDescription', label: 'Link preview text', hint: 'Optional: the text shown when the page is shared.' }
];

export async function list(ctx, sec) {
  const files = (await ctx.gh.list(sec.dir)).filter(f => f.type === 'file' && f.name.endsWith(sec.ext) && !f.name.startsWith('_'));
  const rows = await pool(files, 6, async f => {
    const { text } = await ctx.read(f);
    const v = fm.read(fm.split(text).lines);
    return { name: f.name.slice(0, -sec.ext.length), title: v.title || f.name, path: v.path || '' };
  });
  return { el: h('section', { class: 'view' },
    h('div', { class: 'view-head' }, h('h1', {}, sec.label)),
    h('p', { class: 'muted' }, 'Page titles, descriptions and layout. The words on each page are under Home & text; the HTML is for changing structure, so edit it carefully.'),
    h('ul', { class: 'rows' }, rows.map(r => h('li', {},
      h('a', { href: `#/${sec.id}/${encodeURIComponent(r.name)}` }, h('span', { class: 'row-title' }, r.title), h('span', { class: 'row-sub' }, r.path)),
      h('time', {}, r.name))))) };
}

export async function edit(ctx, sec, name) {
  const path = `${sec.dir}/${name}${sec.ext}`;
  const f = await ctx.gh.read(path);
  let sha = f.sha, busy = false;
  let parts = fm.split(f.text);
  let original = fm.read(parts.lines);
  if (!parts.had || !original.path) throw new Error('This page has no title/path block at the top, so it cannot be edited here.');

  const inputs = {};
  const body = h('textarea', { class: 'body mono raw', spellcheck: 'false', onInput: () => dirty() });
  body.value = parts.body;
  const status = h('span', { class: 'status' });
  const saveBtn = h('button', { type: 'button', class: 'btn primary', disabled: true, onClick: save }, 'Save & publish');

  const dirty = () => {
    const d = body.value !== parts.body || FIELDS.some(x => !fm.unchanged(inputs[x.key].value.trim(), original[x.key] || ''));
    ctx.setDirty(d); saveBtn.disabled = busy || !d;
  };

  const rows = FIELDS.map(x => {
    const id = `p-${x.key}`;
    const input = x.long ? h('textarea', { id, rows: 2, spellcheck: 'true', onInput: () => dirty() }) : h('input', { id, type: 'text', autocomplete: 'off', onInput: () => dirty() });
    input.value = original[x.key] || '';
    inputs[x.key] = input;
    return h('div', { class: 'field' }, h('label', { htmlFor: id }, x.label, x.required ? ' *' : ''), input, h('small', {}, x.hint));
  });

  async function save() {
    if (!inputs.title.value.trim()) return ctx.toast('The page needs a title.', 'err');
    let lines = parts.lines;
    for (const x of FIELDS) {
      const next = inputs[x.key].value.trim();
      if (!fm.unchanged(next, original[x.key] || '')) lines = fm.setKey(lines, x.key, next);
    }
    const text = fm.join({ ...parts, lines, body: body.value });
    busy = true; saveBtn.disabled = true; status.textContent = 'Saving…';
    try {
      const r = await ctx.gh.write(path, { text }, `admin: update page ${name}`, sha);
      sha = r.sha; parts = fm.split(text); original = fm.read(parts.lines); ctx.setDirty(false);
      ctx.published(`Saved page “${name}”.`);
      status.textContent = 'Saved';
    } catch (e) { ctx.toast(e.message, 'err'); status.textContent = ''; } finally { busy = false; dirty(); }
  }

  const el = h('section', { class: 'view editor' },
    h('div', { class: 'view-head' },
      h('div', {}, h('a', { class: 'crumb', href: `#/${sec.id}` }, `← ${sec.label}`), h('h1', {}, original.title || name)),
      h('div', { class: 'actions' }, status, saveBtn)),
    h('p', { class: 'muted' }, `Address: ${original.path} (set in the code). The words on this page are edited under Home & text.`),
    rows,
    h('div', { class: 'field' }, h('label', { htmlFor: 'p-body' }, 'Page HTML (advanced)'), body,
      h('small', {}, 'Parts like {{home.lead}} are filled in from Home & text. A mistake here can break the page; git history can undo it.')));
  body.id = 'p-body';
  return { el, save };
}
