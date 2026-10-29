import { h, slugify, toB64 } from '../util.js';

const MAX_BYTES = 20 * 1024 * 1024;
const MAX_WIDTH = 2000;

function cleanName(name) {
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot).toLowerCase() : '';
  return (slugify(stem) || 'image') + ext;
}

async function downscale(file) {
  if (file.type !== 'image/jpeg') return file;
  try {
    const bmp = await createImageBitmap(file);
    if (bmp.width <= MAX_WIDTH) return file;
    const c = document.createElement('canvas');
    c.width = MAX_WIDTH; c.height = Math.round(bmp.height * (MAX_WIDTH / bmp.width));
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise(r => c.toBlob(r, 'image/jpeg', 0.86)) || file;
  } catch { return file; }
}

export async function uploadImage(ctx, file) {
  if (!/^image\//.test(file.type)) throw new Error('That is not an image file.');
  const blob = await downscale(file);
  if (blob.size > MAX_BYTES) throw new Error('That image is over 20 MB. Shrink it first.');
  const taken = new Set((await ctx.gh.list(ctx.mediaDir)).map(f => f.name));
  let name = cleanName(file.name);
  for (let n = 2; taken.has(name); n++) name = cleanName(file.name).replace(/(\.[^.]+)?$/, `-${n}$1`);
  await ctx.gh.write(`${ctx.mediaDir}/${name}`, { base64: toB64(new Uint8Array(await blob.arrayBuffer())) }, `admin: add image ${name}`);
  const url = `${ctx.mediaUrl}${name}`;
  ctx.pendingImages.set(url, URL.createObjectURL(blob));
  ctx.published(`Uploaded ${name}.`);
  return url;
}

export async function view(ctx, sec) {
  const files = (await ctx.gh.list(sec.dir)).filter(f => f.type === 'file' && /\.(jpe?g|png|gif|webp|svg|avif)$/i.test(f.name));
  const fileInput = h('input', { type: 'file', accept: 'image/*', multiple: true, class: 'hidden', onChange: async () => {
    const picked = [...fileInput.files]; fileInput.value = '';
    for (const f of picked) {
      try { await uploadImage(ctx, f); } catch (e) { ctx.toast(e.message, 'err'); }
    }
    ctx.reload();
  } });

  const card = f => {
    const url = `${sec.urlPrefix}${f.name}`;
    return h('figure', { class: 'tile' },
      h('img', { src: ctx.pendingImages.get(url) || url, alt: '', loading: 'lazy' }),
      h('figcaption', {}, h('span', { class: 'row-title' }, f.name), h('small', {}, `${Math.max(1, Math.round(f.size / 1024))} KB`)),
      h('div', { class: 'actions' },
        h('button', { type: 'button', class: 'btn small', onClick: async () => {
          try { await navigator.clipboard.writeText(`![](${url})`); ctx.toast('Copied markdown for the image.'); } catch { ctx.toast(`![](${url})`); }
        } }, 'Copy markdown'),
        h('button', { type: 'button', class: 'btn small danger', onClick: async () => {
          if (!confirm(`Delete ${f.name}?`)) return;
          try { await ctx.gh.remove(`${sec.dir}/${f.name}`, f.sha, `admin: delete image ${f.name}`); ctx.published(`Deleted ${f.name}.`); ctx.reload(); } catch (e) { ctx.toast(e.message, 'err'); }
        } }, 'Delete')));
  };

  const el = h('section', { class: 'view' },
    h('div', { class: 'view-head' }, h('h1', {}, sec.label),
      h('button', { type: 'button', class: 'btn primary', onClick: () => fileInput.click() }, 'Upload images'), fileInput),
    files.length ? h('div', { class: 'tiles' }, files.map(card)) : h('p', { class: 'muted' }, 'No images yet.'));
  return { el };
}
