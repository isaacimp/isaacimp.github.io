import { h } from './util.js';
import * as vault from './vault.js';
import { createClient } from './github.js';
import { SECTIONS } from './schema.js';
import * as md from './views/md.js';
import * as list from './views/list.js';
import * as raw from './views/raw.js';
import * as media from './views/media.js';
import * as settings from './views/settings.js';
import * as pageText from './views/text.js';

if (window.top !== window.self) throw new Error('The admin cannot be embedded.');

const root = document.getElementById('app');
let cfg, ctx, current, dirty = false, lastHash = '', skipHash = false, routeId = 0;

function screen(...kids) {
  root.replaceChildren(h('div', { class: 'gate' }, ...kids));
}

function showConnect(note) {
  const token = h('input', { id: 'tok', type: 'password', autocomplete: 'off', spellcheck: 'false', placeholder: 'github_pat_…' });
  const pass = h('input', { id: 'pw', type: 'password', autocomplete: 'new-password' });
  const pass2 = h('input', { id: 'pw2', type: 'password', autocomplete: 'new-password' });
  const err = h('p', { class: 'error', role: 'alert' }, note || '');
  const form = h('form', { onSubmit: async e => {
    e.preventDefault();
    err.textContent = '';
    const t = token.value.trim();
    if (!t) return (err.textContent = 'Paste your GitHub token.');
    if (pass.value.length < 10) return (err.textContent = 'Passphrase needs at least 10 characters.');
    if (pass.value !== pass2.value) return (err.textContent = 'The passphrases do not match.');
    btn.disabled = true; btn.textContent = 'Checking…';
    try {
      await verify(t);
      await vault.save(t, pass.value);
      await start(t);
    } catch (ex) { err.textContent = ex.message; btn.disabled = false; btn.textContent = 'Connect'; }
  } });
  const btn = h('button', { class: 'btn primary', type: 'submit' }, 'Connect');
  form.append(
    h('div', { class: 'field' }, h('label', { htmlFor: 'tok' }, 'GitHub token'), token),
    h('div', { class: 'field' }, h('label', { htmlFor: 'pw' }, 'Choose a passphrase'), pass, h('small', {}, 'Locks the token on this device.')),
    h('div', { class: 'field' }, h('label', { htmlFor: 'pw2' }, 'Repeat passphrase'), pass2), err, btn);
  screen(
    h('h1', {}, `${cfg.name} admin`),
    h('details', {}, h('summary', {}, 'Make a token'), h('p', {}, 'GitHub → Settings → Developer settings → Fine-grained tokens. Only ', h('code', {}, cfg.repo), ', Contents read and write.')),
    form);
  token.focus();
}

function showUnlock(note) {
  const pass = h('input', { id: 'pw', type: 'password', autocomplete: 'current-password' });
  const err = h('p', { class: 'error', role: 'alert' }, note || '');
  const btn = h('button', { class: 'btn primary', type: 'submit' }, 'Unlock');
  const form = h('form', { onSubmit: async e => {
    e.preventDefault(); err.textContent = ''; btn.disabled = true;
    try { const t = await vault.unlock(pass.value); await verify(t); await start(t); } catch (ex) { err.textContent = ex.message; btn.disabled = false; pass.select(); }
  } }, h('div', { class: 'field' }, h('label', { htmlFor: 'pw' }, 'Passphrase'), pass), err, btn);
  screen(h('h1', {}, `${cfg.name} admin`), form,
    h('p', { class: 'muted' }, h('button', { class: 'link', type: 'button', onClick: () => { if (confirm('Forget the saved token on this device?')) { vault.forget(); showConnect(); } } }, 'Use a different token')));
  pass.focus();
}

async function verify(token) {
  const gh = createClient({ repo: cfg.repo, branch: cfg.branch, token });
  const info = await gh.repoInfo();
  if (info.permissions && info.permissions.push === false) throw new Error('This token can\'t edit the repo. It needs Contents read and write.');
}

async function start(token) {
  const gh = createClient({ repo: cfg.repo, branch: cfg.branch, token });
  const mediaSec = SECTIONS.find(s => s.kind === 'media');
  const cache = new Map();
  ctx = {
    gh, cfg, site: JSON.parse((await gh.read('content/site.json')).text),
    mediaDir: mediaSec.dir, mediaUrl: mediaSec.urlPrefix, pendingImages: new Map(),
    async read(f) {
      const k = `${f.path}@${f.sha}`;
      if (!cache.has(k)) cache.set(k, await gh.read(f.path));
      return cache.get(k);
    },
    cacheSet(path, sha, text) { cache.set(`${path}@${sha}`, { text, sha, path }); },
    setDirty(d) { dirty = d; },
    go(hash) { location.hash = hash; },
    reload() { route(); },
    toast,
    published(msg) { toast(`${msg} Live in about a minute.`, 'ok', { href: `https://github.com/${cfg.repo}/actions`, label: 'Watch deploy' }); },
    previewDoc(html, full) {
      const t = ctx.site.theme, vars = o => Object.entries(o).map(([k, v]) => `--${k}:${v};`).join('');
      let body = html;
      for (const [p, blob] of ctx.pendingImages) body = body.split(`src="${p}"`).join(`src="${blob}"`);
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><base href="${location.origin}/"><style>:root{${vars(t.fonts)}${vars(t.light)}}@media (prefers-color-scheme: dark){:root{${vars(t.dark)}}}</style><link rel="stylesheet" href="/style.css"></head><body>${full ? body : `<main><article class="article-content">${body}</article></main>`}</body></html>`;
    }
  };

  const tabs = h('nav', { class: 'tabs', 'aria-label': 'Sections' }, SECTIONS.map(s => h('a', { href: `#/${s.id}`, dataset: undefined, 'data-id': s.id }, s.label)));
  root.replaceChildren(
    h('header', { class: 'top' },
      h('a', { class: 'brand', href: '#/now' }, cfg.name, h('span', {}, ' admin')),
      h('div', { class: 'top-actions' },
        h('a', { href: '/', target: '_blank', rel: 'noopener' }, 'View site'),
        h('a', { href: `https://github.com/${cfg.repo}/actions`, target: '_blank', rel: 'noopener' }, 'Deploys'),
        h('button', { class: 'link', type: 'button', onClick: () => { if (!dirty || confirm('Discard unsaved changes?')) { dirty = false; location.hash = ''; location.reload(); } } }, 'Lock'))),
    tabs,
    h('main', { id: 'main' }),
    h('div', { id: 'toasts', 'aria-live': 'polite' }));
  if (!location.hash) location.hash = '#/now';
  lastHash = location.hash;
  route();
}

async function route() {
  const id = ++routeId;
  const main = document.getElementById('main');
  const m = location.hash.match(/^#\/([^/]+)(?:\/(.*))?$/);
  const sec = SECTIONS.find(s => m && s.id === m[1]) || SECTIONS[0];
  const slug = m && m[2] !== undefined && m[2] !== '' ? decodeURIComponent(m[2]) : undefined;
  document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('on', a.dataset.id === sec.id));
  dirty = false; current = null;
  main.replaceChildren(h('p', { class: 'muted pad' }, 'Loading…'));
  try {
    let v;
    if (sec.kind === 'md') v = slug === undefined ? await md.list(ctx, sec) : await md.edit(ctx, sec, slug === '+new' ? null : slug);
    else if (sec.kind === 'list') v = await list.view(ctx, sec);
    else if (sec.kind === 'raw') v = slug === undefined ? await raw.list(ctx, sec) : await raw.edit(ctx, sec, slug);
    else if (sec.kind === 'media') v = await media.view(ctx, sec);
    else if (sec.kind === 'text') v = await pageText.view(ctx, sec);
    else v = await settings.view(ctx, sec);
    if (id !== routeId) return;
    current = v;
    main.replaceChildren(v.el);
    window.scrollTo(0, 0);
  } catch (e) {
    if (id !== routeId) return;
    main.replaceChildren(h('div', { class: 'pad' }, h('p', { class: 'error', role: 'alert' }, e.message),
      e.status === 401 ? h('button', { class: 'btn', type: 'button', onClick: () => location.reload() }, 'Lock and reconnect') : h('button', { class: 'btn', type: 'button', onClick: route }, 'Try again')));
  }
}

function toast(msg, kind = 'ok', link) {
  const box = document.getElementById('toasts');
  if (!box) return;
  const t = h('div', { class: `toast ${kind}`, role: kind === 'err' ? 'alert' : 'status' },
    h('span', {}, msg), link ? h('a', { href: link.href, target: '_blank', rel: 'noopener' }, link.label) : null,
    h('button', { class: 'link', type: 'button', 'aria-label': 'Dismiss', onClick: () => t.remove() }, '×'));
  box.append(t);
  if (kind !== 'err') setTimeout(() => t.remove(), 8000);
}

window.addEventListener('hashchange', () => {
  if (!ctx) return;
  if (skipHash) { skipHash = false; return; }
  if (dirty && !confirm('You have unsaved changes. Leave without saving?')) { skipHash = true; location.hash = lastHash; return; }
  lastHash = location.hash;
  route();
});
window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
window.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); current && current.save && current.save(); }
});

(async function boot() {
  try {
    const r = await fetch('config.json', { cache: 'no-store' });
    if (!r.ok) throw new Error();
    cfg = await r.json();
  } catch {
    return root.replaceChildren(h('p', { class: 'error pad' }, 'Admin isn\'t set up (config.json missing).'));
  }
  document.title = `${cfg.name} admin`;
  vault.exists() ? showUnlock() : showConnect();
})();
