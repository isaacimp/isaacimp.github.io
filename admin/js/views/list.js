import { h, isDate } from '../util.js';

export async function view(ctx, sec) {
  const f = await ctx.gh.read(sec.file);
  let sha = f.sha;
  let items = JSON.parse(f.text);
  let saved = JSON.stringify(items);
  let busy = false;

  const lists = document.createElement('div');
  const listFor = def => {
    const id = `dl-${sec.id}-${def.key}`;
    const opts = new Set(def.options || []);
    if (def.optionsFrom) items.forEach(it => it[def.optionsFrom] && opts.add(it[def.optionsFrom]));
    return { id, el: h('datalist', { id }, [...opts].map(o => h('option', { value: o }))) };
  };

  const saveBtn = h('button', { type: 'button', class: 'btn primary', disabled: true, onClick: save }, 'Save & publish');
  const status = h('span', { class: 'status' });
  const cards = h('div', { class: 'cards' });

  const dirty = () => {
    const d = JSON.stringify(items) !== saved;
    ctx.setDirty(d);
    saveBtn.disabled = busy || !d;
  };

  const draw = (focusIndex) => {
    lists.replaceChildren(...sec.fields.filter(d => d.type === 'combo').map(d => listFor(d).el));
    cards.replaceChildren(...items.map((it, i) => card(it, i)));
    if (focusIndex != null) cards.children[focusIndex]?.querySelector('input,textarea')?.focus();
    dirty();
  };

  const card = (it, i) => {
    const title = h('span', { class: 'row-title' }, it[sec.titleKey] || `(new ${sec.noun})`);
    const set = (def, v) => {
      if (v === '' && !def.required) delete it[def.key]; else it[def.key] = v;
      if (def.key === sec.titleKey) title.textContent = v || `(new ${sec.noun})`;
      dirty();
    };
    const move = d => () => { const j = i + d; if (j < 0 || j >= items.length) return; [items[i], items[j]] = [items[j], items[i]]; draw(j); };
    return h('div', { class: 'card' },
      h('div', { class: 'card-head' }, title, h('span', { class: 'actions' },
        h('button', { type: 'button', class: 'btn small', title: 'Move up', onClick: move(-1), disabled: i === 0 }, '↑'),
        h('button', { type: 'button', class: 'btn small', title: 'Move down', onClick: move(1), disabled: i === items.length - 1 }, '↓'),
        h('button', { type: 'button', class: 'btn small danger', title: 'Remove', onClick: () => { items.splice(i, 1); draw(); } }, 'Remove'))),
      sec.fields.map(def => {
        const id = `c${i}-${def.key}`;
        const common = { id, value: it[def.key] || '', autocomplete: 'off', onInput: e => set(def, e.target.value) };
        const input = def.type === 'textarea'
          ? h('textarea', { ...common, rows: def.rows || 2, spellcheck: 'true' })
          : h('input', { ...common, type: 'text', list: def.type === 'combo' ? `dl-${sec.id}-${def.key}` : null, placeholder: def.type === 'date' ? 'YYYY-MM-DD' : '' });
        return h('div', { class: 'field' }, h('label', { htmlFor: id }, def.label, def.required ? ' *' : ''), input, def.hint ? h('small', {}, def.hint) : null);
      }));
  };

  async function save() {
    for (const [n, it] of items.entries()) {
      for (const def of sec.fields) {
        const v = (it[def.key] || '').trim();
        if (def.required && !v) return ctx.toast(`${sec.noun} #${n + 1}: ${def.label} is required.`, 'err');
        if (def.type === 'date' && v && !isDate(v)) return ctx.toast(`${sec.noun} #${n + 1}: date must look like 2026-10-28.`, 'err');
      }
    }
    busy = true; saveBtn.disabled = true; status.textContent = 'Saving…';
    try {
      const text = JSON.stringify(items, null, 2) + '\n';
      const r = await ctx.gh.write(sec.file, { text }, `admin: update ${sec.id}`, sha);
      sha = r.sha; saved = JSON.stringify(items);
      ctx.setDirty(false);
      ctx.published(`Saved ${sec.label.toLowerCase()}.`);
      status.textContent = 'Saved';
    } catch (e) { ctx.toast(e.message, 'err'); status.textContent = ''; } finally { busy = false; dirty(); }
  }

  const add = () => {
    const blank = {};
    for (const d of sec.fields) if (d.required) blank[d.key] = d.type === 'date' ? new Date().toISOString().slice(0, 10) : '';
    sec.addAtTop ? items.unshift(blank) : items.push(blank);
    draw(sec.addAtTop ? 0 : items.length - 1);
    cards.children[sec.addAtTop ? 0 : items.length - 1]?.scrollIntoView({ block: 'center' });
  };

  const el = h('section', { class: 'view' },
    h('div', { class: 'view-head' }, h('h1', {}, sec.label),
      h('div', { class: 'actions' }, status, h('button', { type: 'button', class: 'btn', onClick: add }, `Add ${sec.noun}`), saveBtn)),
    lists, cards);
  draw();
  return { el, save };
}
