import { h, debounce } from '../util.js';

const inline = md => {
  const m = window.marked;
  return (m.parseInline ? m : m.marked).parseInline(md || '');
};

const GROUPS = {
  home: {
    label: 'Home page', note: 'The first page people see when they visit the site.', preview: true,
    fields: {
      heading: { label: 'Heading' },
      lead: { label: 'Main text', long: true, hint: 'Make a link with [words](https://address). Link to your own pages like [articles](/site.html#articles). For email use [email me](mailto:you@example.com).' }
    }
  },
  site: {
    label: 'Full site page', note: 'The longer page at /site.html: your name, links and section headings.',
    fields: {
      name: { label: 'Name' },
      nameHover: { label: 'Name shown on hover', hint: 'For example your name in another language.' },
      role: { label: 'Line under your name' },
      links: { label: 'Social links', long: true, hint: 'Example: [@handle](https://x.com/handle) · [@channel](https://youtube.com/@channel)' },
      projectsHeading: { label: 'Projects heading' },
      articlesHeading: { label: 'Articles heading' },
      articlesIntro: { label: 'Articles intro' },
      postsHeading: { label: 'Posts heading' },
      postsIntro: { label: 'Posts intro', long: true }
    }
  },
  writing: { label: 'Writing page' },
  uses: { label: 'Uses page' },
  bookmarks: { label: 'Bookmarks page' },
  now: { label: 'Now archive page' },
  posts: { label: 'Posts page' }
};

const humanize = k => k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());

export async function view(ctx, sec) {
  const f = await ctx.gh.read(sec.file);
  let sha = f.sha, busy = false;
  const draft = JSON.parse(f.text);
  let saved = JSON.stringify(draft);

  const saveBtn = h('button', { type: 'button', class: 'btn primary', disabled: true, onClick: save }, 'Save & publish');
  const status = h('span', { class: 'status' });
  const preview = h('iframe', { class: 'preview short', sandbox: '', title: 'Home page preview' });

  const homePreview = () => {
    const t = draft.home || {};
    preview.srcdoc = ctx.previewDoc(`<main class="landing"><h1>${inline(t.heading)}</h1><p class="lead">${inline(t.lead)}</p></main>`, true);
  };
  const refreshPreview = debounce(homePreview, 200);

  const dirty = () => {
    const d = JSON.stringify(draft) !== saved;
    ctx.setDirty(d); saveBtn.disabled = busy || !d;
  };

  const field = (group, key, meta) => {
    const id = `t-${group}-${key}`;
    const value = draft[group][key] || '';
    const long = meta.long || value.length > 90 || value.includes('\n');
    const onInput = e => { draft[group][key] = e.target.value; dirty(); if (group === 'home') refreshPreview(); };
    const input = long
      ? h('textarea', { id, rows: Math.min(10, Math.max(3, Math.ceil(value.length / 70))), spellcheck: 'true', onInput })
      : h('input', { id, type: 'text', autocomplete: 'off', onInput });
    input.value = value;
    return h('div', { class: 'field' }, h('label', { htmlFor: id }, meta.label || humanize(key)), input, meta.hint ? h('small', {}, meta.hint) : null);
  };

  const blocks = Object.keys(draft).map(group => {
    const g = GROUPS[group] || {};
    return h('div', { class: group === 'home' ? 'panel split-panel' : 'panel' },
      h('h2', {}, g.label || humanize(group)),
      g.note ? h('p', { class: 'muted' }, g.note) : null,
      group === 'home'
        ? h('div', { class: 'split' },
            h('div', { class: 'pane' }, Object.keys(draft[group]).map(k => field(group, k, (g.fields || {})[k] || {}))),
            h('div', { class: 'pane' }, h('div', { class: 'label' }, 'Preview'), preview))
        : Object.keys(draft[group]).map(k => field(group, k, (g.fields || {})[k] || {})));
  });

  async function save() {
    busy = true; saveBtn.disabled = true; status.textContent = 'Saving…';
    try {
      const r = await ctx.gh.write(sec.file, { text: JSON.stringify(draft, null, 2) + '\n' }, 'admin: update page text', sha);
      sha = r.sha; saved = JSON.stringify(draft);
      ctx.setDirty(false);
      ctx.published('Saved page text.');
      status.textContent = 'Saved';
    } catch (e) { ctx.toast(e.message, 'err'); status.textContent = ''; } finally { busy = false; dirty(); }
  }

  const el = h('section', { class: 'view texts' },
    h('div', { class: 'view-head' }, h('h1', {}, sec.label), h('div', { class: 'actions' }, status, saveBtn)),
    h('p', { class: 'muted' }, 'The words on your pages. Links are written as [words](address). Projects on the full site page come from the Projects tab.'),
    blocks);
  if (draft.home) homePreview();
  dirty();
  return { el, save };
}
