import { h, slugify, today, isDate, debounce, pool } from '../util.js';
import { FIELDS } from '../schema.js';
import * as fm from '../frontmatter.js';
import { uploadImage } from './media.js';

const render = md => {
  const m = window.marked;
  return (m.parse ? m : m.marked).parse(md, { gfm: true, breaks: false });
};

export async function list(ctx, sec) {
  const files = (await ctx.gh.list(sec.dir)).filter(f => f.type === 'file' && f.name.endsWith('.md') && !f.name.startsWith('_'));
  const rows = await pool(files, 6, async f => {
    const { text } = await ctx.read(f);
    const { lines, body } = fm.split(text);
    const v = fm.read(lines);
    const slug = f.name.replace(/\.md$/, '');
    const first = body.trim().split(/\n/)[0].replace(/[*_`#>\[\]]/g, '');
    return { slug, title: v.title || (first.length > 90 ? first.slice(0, 90) + '…' : first) || slug, date: v.date || slug, desc: v.title ? v.description || '' : '' };
  });
  rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const el = h('section', { class: 'view' },
    h('div', { class: 'view-head' },
      h('h1', {}, sec.label),
      h('a', { class: 'btn primary', href: `#/${sec.id}/+new` }, `New ${sec.noun}`)),
    rows.length
      ? h('ul', { class: 'rows' }, rows.map(r => h('li', {},
          h('a', { href: `#/${sec.id}/${encodeURIComponent(r.slug)}` },
            h('span', { class: 'row-title' }, r.title),
            r.desc ? h('span', { class: 'row-sub' }, r.desc) : null),
          h('time', {}, r.date))))
      : h('p', { class: 'muted' }, 'Nothing here yet.'));
  return { el };
}

function fieldInput(def, value, onInput) {
  const common = { id: `f-${def.key}`, onInput };
  if (def.type === 'textarea' || def.type === 'lines') return h('textarea', { ...common, rows: def.rows || 3, spellcheck: 'true', value: value || '' });
  return h('input', { ...common, type: 'text', placeholder: def.type === 'date' ? 'YYYY-MM-DD' : '', value: value || '', autocomplete: 'off' });
}

const toForm = (def, v) => def.type === 'tags' ? (Array.isArray(v) ? v.join(', ') : v || '')
  : def.type === 'lines' ? (Array.isArray(v) ? v.join('\n') : v || '') : v || '';
const fromForm = (def, s) => def.type === 'tags' ? s.split(',').map(x => x.trim()).filter(Boolean)
  : def.type === 'lines' ? s.split(/\n/).map(x => x.trim()).filter(Boolean) : s.trim();

export async function edit(ctx, sec, slug) {
  const isNew = slug == null;
  const defs = sec.fields.map(k => FIELDS[k]);
  let sha = null, parts, original = {};
  if (!isNew) {
    const f = await ctx.gh.read(`${sec.dir}/${slug}.md`);
    sha = f.sha;
    parts = fm.split(f.text);
    original = fm.read(parts.lines);
  } else {
    parts = { lines: [], body: '', had: false, eol: '\n' };
    original = { date: today() };
  }

  const inputs = {};
  const dirtyCheck = () => {
    const changed = defs.some(d => !fm.unchanged(fromForm(d, inputs[d.key].value), fromForm(d, toForm(d, original[d.key]))))
      || body.value !== parts.body || (isNew && !!slugInput && slugInput.value !== '');
    ctx.setDirty(changed);
    saveBtn.disabled = busy || !changed;
  };
  const preview = h('iframe', { class: 'preview', sandbox: '', title: 'Preview' });
  const refresh = debounce(() => { preview.srcdoc = ctx.previewDoc(render(body.value)); }, 200);
  const onAny = () => { dirtyCheck(); refresh(); };

  const body = h('textarea', { class: 'body mono', id: 'f-body', spellcheck: 'true', onInput: onAny });
  body.value = parts.body;

  const fieldRows = defs.map(d => {
    inputs[d.key] = fieldInput(d, toForm(d, original[d.key]), onAny);
    return h('div', { class: 'field' }, h('label', { htmlFor: `f-${d.key}` }, d.label, d.required ? ' *' : ''), inputs[d.key], d.hint ? h('small', {}, d.hint) : null);
  });

  let slugInput = null, dateSlug = null, slugTouched = false;
  let nameRow = null;
  if (isNew && sec.slugBy === 'date') {
    dateSlug = h('input', { id: 'f-date-name', type: 'text', value: today(), onInput: onAny, autocomplete: 'off' });
    nameRow = h('div', { class: 'field' }, h('label', { htmlFor: 'f-date-name' }, 'Date *'), dateSlug);
  } else if (isNew) {
    slugInput = h('input', { id: 'f-slug', type: 'text', autocomplete: 'off', onInput: () => { slugTouched = true; onAny(); } });
    inputs.title.addEventListener('input', () => { if (!slugTouched) { slugInput.value = slugify(inputs.title.value); dirtyCheck(); } });
    nameRow = h('div', { class: 'field' }, h('label', { htmlFor: 'f-slug' }, 'URL name *'), slugInput, h('small', {}, 'Can\'t change this later.'));
  }

  const wrap = (a, b, ph) => {
    const s = body.selectionStart, e = body.selectionEnd, sel = body.value.slice(s, e) || ph;
    body.setRangeText(a + sel + b, s, e, 'select');
    body.focus(); onAny();
  };
  const fileInput = h('input', { type: 'file', accept: 'image/*', class: 'hidden', onChange: async () => {
    const f = fileInput.files[0]; fileInput.value = '';
    if (!f) return;
    try {
      const url = await uploadImage(ctx, f);
      const s = body.selectionStart;
      body.setRangeText(`![](${url})`, s, body.selectionEnd, 'end');
      onAny();
    } catch (err) { ctx.toast(err.message, 'err'); }
  } });
  const toolbar = h('div', { class: 'toolbar' },
    h('button', { type: 'button', class: 'btn small', title: 'Bold', onClick: () => wrap('**', '**', 'bold') }, 'B'),
    h('button', { type: 'button', class: 'btn small', title: 'Italic', onClick: () => wrap('*', '*', 'italic') }, 'I'),
    h('button', { type: 'button', class: 'btn small', title: 'Link', onClick: () => wrap('[', '](https://)', 'link text') }, 'Link'),
    h('button', { type: 'button', class: 'btn small', title: 'Upload and insert an image', onClick: () => fileInput.click() }, 'Image'),
    fileInput);

  let busy = false;
  const status = h('span', { class: 'status' });
  const saveBtn = h('button', { type: 'button', class: 'btn primary', disabled: true, onClick: save }, 'Save & publish');
  const delBtn = isNew ? null : h('button', { type: 'button', class: 'btn danger', onClick: del }, 'Delete');

  async function save() {
    for (const d of defs) {
      const v = inputs[d.key].value.trim();
      if (d.required && !v) return ctx.toast(`${d.label} is required.`, 'err');
      if (d.type === 'date' && v && !(isDate(v) || /^\d{4}-\d{2}$/.test(v))) return ctx.toast('Date must look like 2026-10-28.', 'err');
    }
    if (!body.value.trim()) return ctx.toast('Write something first.', 'err');
    let name = slug;
    if (isNew) {
      name = sec.slugBy === 'date' ? dateSlug.value.trim() : slugInput.value.trim();
      if (sec.slugBy === 'date' ? !(isDate(name) || /^\d{4}-\d{2}$/.test(name)) : !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
        return ctx.toast(sec.slugBy === 'date' ? 'Date must look like 2026-10-28.' : 'URL name can only use a-z, 0-9 and dashes.', 'err');
      }
    }
    let lines = parts.lines;
    for (const d of defs) {
      const next = fromForm(d, inputs[d.key].value);
      if (isNew || !fm.unchanged(next, fromForm(d, toForm(d, original[d.key])))) lines = fm.setKey(lines, d.key, next);
    }
    const text = fm.join({ lines, body: body.value, had: parts.had || lines.length > 0, eol: parts.eol });
    busy = true; saveBtn.disabled = true; status.textContent = 'Saving…';
    try {
      const path = `${sec.dir}/${name}.md`;
      const r = await ctx.gh.write(path, { text }, `admin: ${isNew ? 'add' : 'update'} ${sec.id}/${name}`, sha);
      ctx.cacheSet(path, r.sha, text);
      ctx.setDirty(false);
      ctx.published(`Saved ${sec.noun} “${name}”.`);
      if (isNew) { ctx.go(`#/${sec.id}/${encodeURIComponent(name)}`); return; }
      sha = r.sha; parts = fm.split(text); original = fm.read(parts.lines);
      status.textContent = 'Saved';
    } catch (e) {
      ctx.toast(isNew && e.status === 422 ? 'That name already exists.' : e.message, 'err');
      status.textContent = '';
    } finally { busy = false; dirtyCheck(); }
  }

  async function del() {
    if (!confirm(`Delete this ${sec.noun}?`)) return;
    busy = true; delBtn.disabled = true;
    try {
      await ctx.gh.remove(`${sec.dir}/${slug}.md`, sha, `admin: delete ${sec.id}/${slug}`);
      ctx.setDirty(false);
      ctx.published(`Deleted ${sec.noun} “${slug}”.`);
      ctx.go(`#/${sec.id}`);
    } catch (e) { ctx.toast(e.message, 'err'); busy = false; delBtn.disabled = false; }
  }

  const el = h('section', { class: 'view editor' },
    h('div', { class: 'view-head' },
      h('div', {}, h('a', { class: 'crumb', href: `#/${sec.id}` }, `← ${sec.label}`), h('h1', {}, isNew ? `New ${sec.noun}` : (original.title || slug))),
      h('div', { class: 'actions' }, status, delBtn, saveBtn)),
    h('div', { class: 'split' },
      h('div', { class: 'pane' }, nameRow, fieldRows, h('div', { class: 'field' }, h('label', { htmlFor: 'f-body' }, 'Text (markdown)'), toolbar, body)),
      h('div', { class: 'pane' }, h('div', { class: 'label' }, 'Preview'), preview)));

  refresh();
  dirtyCheck();
  return { el, save };
}
