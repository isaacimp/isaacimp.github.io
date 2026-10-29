import { h } from '../util.js';

const HEX = /^#[0-9a-fA-F]{6}$/;
const COLOR_LABELS = { paper: 'Background', ink: 'Text', 'ink-soft': 'Soft text', line: 'Lines', link: 'Links', hl: 'Highlight' };
const GENERAL = [
  ['name', 'Site name'], ['author', 'Author'], ['url', 'Site address'],
  ['titleSuffix', 'Title suffix'], ['backLabel', 'Back-link text'], ['email', 'Contact email']
];

export async function view(ctx, sec) {
  const f = await ctx.gh.read(sec.file);
  let sha = f.sha;
  let site = JSON.parse(f.text);
  const draft = JSON.parse(f.text);
  let saved = JSON.stringify(draft), busy = false;

  const saveBtn = h('button', { type: 'button', class: 'btn primary', disabled: true, onClick: save }, 'Save & publish');
  const status = h('span', { class: 'status' });
  const swatches = {};

  const refresh = () => {
    for (const mode of ['light', 'dark']) {
      const t = draft.theme[mode], s = swatches[mode];
      s.style.background = t.paper; s.style.color = t.ink; s.style.borderColor = t.line;
      s.querySelector('.s-soft').style.color = t['ink-soft'];
      s.querySelector('.s-link').style.color = t.link;
      s.querySelector('.s-hl').style.background = t.hl;
    }
    const d = JSON.stringify(draft) !== saved;
    ctx.setDirty(d); saveBtn.disabled = busy || !d;
  };

  const text = (label, get, set, hint) => {
    const id = 'f' + Math.random().toString(36).slice(2);
    return h('div', { class: 'field' }, h('label', { htmlFor: id }, label),
      h('input', { id, type: 'text', value: get(), autocomplete: 'off', onInput: e => { set(e.target.value); refresh(); } }), hint ? h('small', {}, hint) : null);
  };

  const colorRow = (mode, key) => {
    const id = `c-${mode}-${key}`;
    const hex = h('input', { id, type: 'text', class: 'hex', value: draft.theme[mode][key], autocomplete: 'off' });
    const pick = h('input', { type: 'color', value: HEX.test(draft.theme[mode][key]) ? draft.theme[mode][key] : '#000000', 'aria-label': `${COLOR_LABELS[key]} colour picker` });
    hex.addEventListener('input', () => { draft.theme[mode][key] = hex.value.trim(); if (HEX.test(hex.value.trim())) pick.value = hex.value.trim(); refresh(); });
    pick.addEventListener('input', () => { hex.value = pick.value; draft.theme[mode][key] = pick.value; refresh(); });
    return h('div', { class: 'color-row' }, h('label', { htmlFor: id }, COLOR_LABELS[key] || key), pick, hex);
  };

  const swatch = mode => {
    swatches[mode] = h('div', { class: 'swatch' }, h('strong', {}, 'The quick brown fox'), h('p', {}, 'Body text ', h('span', { class: 's-soft' }, 'soft text '), h('span', { class: 's-link' }, 'a link '), h('mark', { class: 's-hl' }, ' highlight ')));
    return swatches[mode];
  };

  async function save() {
    for (const mode of ['light', 'dark']) for (const [k, v] of Object.entries(draft.theme[mode])) {
      if (!HEX.test(v)) return ctx.toast(`${mode} ${COLOR_LABELS[k] || k}: use a colour like #1A1A18.`, 'err');
    }
    if (!draft.name.trim() || !/^https?:\/\//.test(draft.url)) return ctx.toast('Site name and a full site address (https://…) are required.', 'err');
    busy = true; saveBtn.disabled = true; status.textContent = 'Saving…';
    try {
      const next = JSON.stringify(draft, null, 2) + '\n';
      const r = await ctx.gh.write(sec.file, { text: next }, 'admin: update site settings', sha);
      sha = r.sha; saved = JSON.stringify(draft); site = JSON.parse(saved); ctx.site = site;
      ctx.setDirty(false);
      ctx.published('Saved settings. The whole site will restyle once it publishes.');
      status.textContent = 'Saved';
    } catch (e) { ctx.toast(e.message, 'err'); status.textContent = ''; } finally { busy = false; refresh(); }
  }

  draft.preload = draft.preload || [];
  const preload = h('textarea', { id: 'f-preload', rows: 2, spellcheck: 'false', onInput: e => { draft.preload = e.target.value.split('\n').map(s => s.trim()).filter(Boolean); refresh(); } });
  preload.value = draft.preload.join('\n');

  const el = h('section', { class: 'view settings' },
    h('div', { class: 'view-head' }, h('h1', {}, sec.label), h('div', { class: 'actions' }, status, saveBtn)),
    h('h2', {}, 'General'),
    h('div', { class: 'grid2' }, GENERAL.map(([k, label]) => text(label, () => draft[k] || '', v => { draft[k] = v; }))),
    h('h2', {}, 'Colours'),
    h('div', { class: 'grid2' },
      ['light', 'dark'].map(mode => h('div', { class: 'panel' }, h('h3', {}, mode === 'light' ? 'Light mode' : 'Dark mode'),
        swatch(mode), Object.keys(draft.theme[mode]).map(k => colorRow(mode, k))))),
    h('h2', {}, 'Fonts'),
    h('div', { class: 'grid2' }, Object.keys(draft.theme.fonts).map(k => text(k, () => draft.theme.fonts[k], v => { draft.theme.fonts[k] = v; }))),
    h('div', { class: 'field' }, h('label', { htmlFor: 'f-preload' }, 'Fonts to preload'), preload));
  refresh();
  return { el, save };
}
