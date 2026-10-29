import { h, pool } from '../util.js';
import * as fm from '../frontmatter.js';

export async function list(ctx, sec) {
  const files = (await ctx.gh.list(sec.dir)).filter(f => f.type === 'file' && f.name.endsWith(sec.ext) && !f.name.startsWith('_'));
  const rows = await pool(files, 6, async f => {
    const { text } = await ctx.read(f);
    const v = fm.read(fm.split(text).lines);
    return { name: f.name.slice(0, -sec.ext.length), title: v.title || f.name, path: v.path || '' };
  });
  return { el: h('section', { class: 'view' },
    h('div', { class: 'view-head' }, h('h1', {}, sec.label)),
    h('p', { class: 'muted' }, 'These pages are written by hand (HTML). Edit carefully: the text between the --- lines sets the title, address and search description.'),
    h('ul', { class: 'rows' }, rows.map(r => h('li', {},
      h('a', { href: `#/${sec.id}/${encodeURIComponent(r.name)}` }, h('span', { class: 'row-title' }, r.title), h('span', { class: 'row-sub' }, r.path)),
      h('time', {}, r.name))))) };
}

export async function edit(ctx, sec, name) {
  const path = `${sec.dir}/${name}${sec.ext}`;
  const f = await ctx.gh.read(path);
  let sha = f.sha, saved = f.text, busy = false;
  const area = h('textarea', { class: 'body mono raw', spellcheck: 'false', onInput: () => dirty() });
  area.value = f.text;
  const status = h('span', { class: 'status' });
  const saveBtn = h('button', { type: 'button', class: 'btn primary', disabled: true, onClick: save }, 'Save & publish');
  const dirty = () => { const d = area.value !== saved; ctx.setDirty(d); saveBtn.disabled = busy || !d; };

  async function save() {
    const t = area.value;
    const v = fm.read(fm.split(t).lines);
    if (!v.title || !v.path) return ctx.toast('The top of the page needs a title: and path: between --- lines.', 'err');
    busy = true; saveBtn.disabled = true; status.textContent = 'Saving…';
    try {
      const r = await ctx.gh.write(path, { text: t }, `admin: update page ${name}`, sha);
      sha = r.sha; saved = t; ctx.setDirty(false);
      ctx.published(`Saved page “${name}”.`);
      status.textContent = 'Saved';
    } catch (e) { ctx.toast(e.message, 'err'); status.textContent = ''; } finally { busy = false; dirty(); }
  }

  const el = h('section', { class: 'view editor' },
    h('div', { class: 'view-head' },
      h('div', {}, h('a', { class: 'crumb', href: `#/${sec.id}` }, `← ${sec.label}`), h('h1', {}, fm.read(fm.split(f.text).lines).title || name)),
      h('div', { class: 'actions' }, status, saveBtn)),
    h('p', { class: 'muted' }, 'Raw page source. A mistake here can break the page, so check the live site after publishing (git history can undo anything).'),
    area);
  return { el, save };
}
