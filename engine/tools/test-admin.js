#!/usr/bin/env node
'use strict';

const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { chromium } = require('playwright-core');

const REPO = path.resolve(__dirname, '..', '..');
const DIST = path.join(REPO, 'dist');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TOKEN = 'github_pat_TEST_ONLY_not_a_real_token';
const PASS = 'correct horse battery';
const SHOTS = process.argv.includes('--shots');

const sha1 = buf => crypto.createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
const files = new Map();
const commits = [];
const put = (p, buf) => files.set(p, { buf, sha: sha1(buf) });
(function seed(dir) {
  for (const e of fs.readdirSync(path.join(REPO, dir), { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) seed(rel); else put(rel, fs.readFileSync(path.join(REPO, rel)));
  }
})('content');
const text = p => files.get(p).buf.toString('utf8');

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization,content-type,accept,x-github-api-version',
  'access-control-allow-methods': 'GET,PUT,DELETE,OPTIONS'
};

async function fakeGithub(route, request) {
  const json = (status, obj) => route.fulfill({ status, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(obj) });
  if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
  if (request.headers().authorization !== `Bearer ${TOKEN}`) return json(401, { message: 'Bad credentials' });
  const url = new URL(request.url());
  const m = url.pathname.match(/^\/repos\/([^/]+\/[^/]+)(?:\/contents\/(.*))?$/);
  if (!m) return json(404, { message: 'Not Found' });
  if (m[2] === undefined) return json(200, { full_name: m[1], permissions: { push: true } });
  const p = decodeURIComponent(m[2]);
  const method = request.method();

  if (method === 'GET') {
    const f = files.get(p);
    if (f) return json(200, { type: 'file', name: path.basename(p), path: p, sha: f.sha, size: f.buf.length, encoding: 'base64', content: f.buf.toString('base64').replace(/(.{60})/g, '$1\n') });
    const kids = new Map();
    for (const [fp, v] of files) {
      if (!fp.startsWith(p + '/')) continue;
      const rest = fp.slice(p.length + 1), name = rest.split('/')[0];
      kids.set(name, rest.includes('/') ? { name, path: `${p}/${name}`, type: 'dir', sha: 'dir' } : { name, path: fp, type: 'file', sha: v.sha, size: v.buf.length });
    }
    return kids.size ? json(200, [...kids.values()]) : json(404, { message: 'Not Found' });
  }

  const body = JSON.parse(request.postData() || '{}');
  const cur = files.get(p);
  if (method === 'PUT') {
    if (cur && !body.sha) return json(422, { message: 'Invalid request.\n\n"sha" wasn\'t supplied.' });
    if (cur && body.sha !== cur.sha) return json(409, { message: `${p} does not match ${body.sha}` });
    put(p, Buffer.from(body.content, 'base64'));
    commits.push({ op: 'put', path: p, message: body.message });
    return json(cur ? 200 : 201, { content: { sha: files.get(p).sha }, commit: { sha: crypto.randomBytes(20).toString('hex') } });
  }
  if (method === 'DELETE') {
    if (!cur) return json(404, { message: 'Not Found' });
    if (body.sha !== cur.sha) return json(409, { message: `${p} does not match ${body.sha}` });
    files.delete(p);
    commits.push({ op: 'delete', path: p, message: body.message });
    return json(200, { commit: { sha: crypto.randomBytes(20).toString('hex') } });
  }
  return json(405, { message: 'Method not allowed' });
}

let failed = 0;
async function step(name, fn) {
  try { await fn(); console.log(`  ✓ ${name}`); } catch (e) { failed++; console.log(`  ✗ ${name}\n      ${String(e.message).split('\n').slice(0, 4).join('\n      ')}`); }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
const eq = (a, b, msg) => assert(a === b, `${msg || 'mismatch'}\n   expected: ${JSON.stringify(b)}\n   actual:   ${JSON.stringify(a)}`);

(async () => {
  const b = spawnSync(process.execPath, [path.join(REPO, 'engine', 'build.js')], { encoding: 'utf8' });
  if (b.status !== 0) { console.error(b.stdout, b.stderr); process.exit(1); }

  const server = http.createServer((req, rsp) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(DIST, p);
    if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
    const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }[path.extname(f)] || 'application/octet-stream';
    rsp.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
    fs.createReadStream(f).pipe(rsp);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const BASE = `http://127.0.0.1:${server.address().port}`;

  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await context.route('https://api.github.com/**', fakeGithub);

  const requests = [], problems = [];
  let dialogAnswer = true;
  page.on('request', r => requests.push(r.url()));
  page.on('console', m => { if (['error', 'warning'].includes(m.type()) && !/Failed to load resource.*(401|409|422)/.test(m.text())) problems.push(m.text()); });
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
  page.on('dialog', d => (dialogAnswer ? d.accept() : d.dismiss()));

  const clearToasts = () => page.evaluate(() => document.querySelectorAll('#toasts .toast').forEach(t => t.remove()));
  const loaded = id => page.waitForFunction(i => { const a = document.querySelector('.tabs a.on'); return a && a.dataset.id === i && !document.querySelector('#main > .muted.pad'); }, id);
  const tab = async id => { await page.click(`.tabs a[data-id="${id}"]`); await loaded(id); };
  const save = async () => {
    await clearToasts();
    await page.getByRole('button', { name: 'Save & publish' }).click();
    await page.locator('#toasts .toast').first().waitFor();
    await page.waitForFunction(() => !/Saving/.test((document.querySelector('.status') || {}).textContent || ''));
  };
  const lastToast = async () => (await page.locator('#toasts .toast').last().innerText());

  const shot = async name => {
    if (!SHOTS) return;
    fs.mkdirSync(path.join(REPO, 'layout-shots'), { recursive: true });
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(REPO, 'layout-shots', `admin-${name}.png`) });
  };
  console.log('Admin end-to-end test');

  await page.goto(`${BASE}/admin/`);
  await page.waitForSelector('#tok');
  await step('front matter: untouched files round-trip exactly; written values read back exactly', async () => {
    const texts = [];
    for (const d of ['posts', 'articles', 'projects', 'now']) for (const f of fs.readdirSync(path.join(REPO, 'content', d))) texts.push(fs.readFileSync(path.join(REPO, 'content', d, f), 'utf8'));
    const cases = ['Plain title', 'Hello: World', 'It\'s "quoted"', 'yes', 'null', '2026', '1e3', '0x1F', '2026-08-07', '2026-08-07 is a date', '# not a comment', '- not a list', '[x]', '{y}',
      'trailing space ', ' leading space', 'has #hash inside', 'colon: inside', 'unicode — dash and é', 'a, b', '*star', '&amp', '!bang', '%pct', '@at', '`tick`', 'multi\nline', 'back\\slash', 'tab\tchar', "single ' quote", '>', '|', '?', 'a'.repeat(300)];
    const r = await page.evaluate(async ({ texts, cases }) => {
      const fm = await import('/admin/js/frontmatter.js');
      const y = window.jsyaml, out = { notRoundTrip: 0, badScalar: [], badList: [] };
      for (const t of texts) if (fm.join(fm.split(t)) !== t) out.notRoundTrip++;
      for (const s of cases) {
        const v = y.safeLoad('k: ' + fm.scalar(s)).k;
        if (v !== s) out.badScalar.push([s, fm.scalar(s), v]);
      }
      const list = y.safeLoad('k: ' + `[${cases.map(c => fm.scalar(c, true)).join(', ')}]`).k;
      if (JSON.stringify(list) !== JSON.stringify(cases)) out.badList.push('list differs');
      const proj = fm.split('---\ntitle: A\ndate: 2026-10-14\ndescription: Old\nurl: https://x.y\ntags: [project]\nimages: [img/a.jpg]   # screenshots\nrobots: "noindex, follow"   # stub: remove\n# dateLabel: "x"\n---\nBody\n');
      out.edit = fm.join({ ...proj, lines: fm.setKey(proj.lines, 'description', 'New: text') });
      out.rm = fm.join({ ...proj, lines: fm.setKey(proj.lines, 'robots', '') });
      out.add = fm.join({ ...proj, lines: fm.setKey(proj.lines, 'extra', 'v') });
      return out;
    }, { texts, cases });
    eq(r.notRoundTrip, 0, 'files that changed on a no-op round trip');
    assert(!r.badScalar.length, `values that did not read back exactly:\n${JSON.stringify(r.badScalar)}`);
    assert(!r.badList.length, 'quoted list did not read back exactly');
    assert(r.edit.includes('description: "New: text"\nurl: https://x.y') && r.edit.includes('images: [img/a.jpg]   # screenshots\nrobots: "noindex, follow"   # stub: remove\n# dateLabel: "x"\n---'), `edit disturbed neighbours:\n${r.edit}`);
    assert(!r.rm.includes('robots') && r.rm.includes('images: [img/a.jpg]   # screenshots\n# dateLabel: "x"'), `remove disturbed neighbours:\n${r.rm}`);
    assert(r.add.includes('# stub: remove\nextra: v\n# dateLabel: "x"\n---'), `add placed badly:\n${r.add}`);
  });

  await step('sign-in: wrong token is rejected with a clear message', async () => {
    await page.goto(`${BASE}/admin/`);
    await page.waitForSelector('#tok');
    await page.fill('#tok', 'github_pat_wrong'); await page.fill('#pw', PASS); await page.fill('#pw2', PASS);
    await page.click('button[type=submit]');
    await page.waitForSelector('.error:not(:empty)');
    assert(/rejected the token/i.test(await page.locator('.error').innerText()), 'expected a token-rejected message');
  });

  await step('sign-in: valid token connects, and is stored only encrypted', async () => {
    await shot('1-connect');
    await page.fill('#tok', TOKEN); await page.fill('#pw', PASS); await page.fill('#pw2', PASS);
    await page.click('button[type=submit]');
    await page.waitForSelector('.tabs');
    const stored = await page.evaluate(() => localStorage.getItem('admin.vault.v1'));
    assert(stored && !stored.includes('TEST_ONLY') && !stored.includes(PASS), 'vault must not contain the token or passphrase');
    const all = await page.evaluate(() => JSON.stringify([localStorage, sessionStorage]));
    assert(!all.includes('TEST_ONLY'), 'token must not be in web storage');
  });

  await step('lock: reload asks for the passphrase; wrong one fails, right one unlocks', async () => {
    await page.reload();
    await page.waitForSelector('#pw');
    await page.fill('#pw', 'not the passphrase'); await page.click('button[type=submit]');
    await page.waitForSelector('.error:not(:empty)');
    assert(/wrong passphrase/i.test(await page.locator('.error').innerText()), 'expected wrong passphrase message');
    await page.fill('#pw', PASS); await page.click('button[type=submit]');
    await page.waitForSelector('.tabs');
  });

  await step('posts: list shows the 4 posts (not the template)', async () => {
    await tab('posts');
    eq(await page.locator('.rows li').count(), 4, 'post count');
    await shot('2-posts-list');
  });

  const originalDust = text('content/posts/dust-mites.md');
  await step('edit post: description with colon + quotes, body append, live preview', async () => {
    await page.click('text=Dust mites');
    await page.waitForSelector('#f-body');
    await page.fill('#f-description', 'A: "quoted" thing it\'s');
    await page.fill('#f-body', (await page.inputValue('#f-body')) + '\n\nAppended **bold** line with it\'s apostrophe.\n');
    const frame = page.frameLocator('iframe.preview');
    await frame.locator('strong', { hasText: 'bold' }).waitFor();
    await shot('3-post-editor');
    const bg = await frame.locator('body').evaluate(el => getComputedStyle(el).backgroundColor);
    assert(bg !== 'rgba(0, 0, 0, 0)', 'preview should carry the site theme');
    await save();
    const t = text('content/posts/dust-mites.md');
    assert(t.startsWith('---\ntitle: Dust mites\ndate: 2026-08-19\ndescription: "A: \\"quoted\\" thing it\'s"\ntags: [health]\n---\n'), `front matter wrong:\n${t.slice(0, 200)}`);
    assert(t.includes('Appended **bold** line'), 'body not saved');
    assert(t.includes(originalDust.split('---\n')[2].slice(0, 200)), 'original body must be preserved');
  });

  await step('conflict: saving a file changed elsewhere is refused, not overwritten', async () => {
    await clearToasts();
    const f = files.get('content/posts/dust-mites.md'); put('content/posts/dust-mites.md', Buffer.concat([f.buf, Buffer.from('\nedited elsewhere\n')]));
    await page.fill('#f-body', (await page.inputValue('#f-body')) + '\nmine');
    await save();
    assert(/changed on GitHub/i.test(await lastToast()), 'expected a conflict message');
    assert(text('content/posts/dust-mites.md').includes('edited elsewhere') && !text('content/posts/dust-mites.md').includes('\nmine'), 'remote edit must survive');
    dialogAnswer = true;
  });

  await step('leaving with unsaved changes asks first (and cancel stays put)', async () => {
    dialogAnswer = false;
    await page.click('.tabs a[data-id="now"]');
    await page.waitForTimeout(300);
    assert(page.url().endsWith('/posts/dust-mites'), `should still be on the post, got ${page.url()}`);
    dialogAnswer = true;
  });

  await step('new post: slug from title, quoted title, tags, date', async () => {
    dialogAnswer = true;
    await page.goto(`${BASE}/admin/#/posts/+new`);
    await page.reload();
    await page.fill('#pw', PASS); await page.click('button[type=submit]');
    await page.waitForSelector('#f-title');
    await page.fill('#f-title', 'Hello: World');
    eq(await page.inputValue('#f-slug'), 'hello-world', 'auto slug');
    await page.fill('#f-description', 'First post');
    await page.fill('#f-tags', 'one, two words');
    await page.fill('#f-body', 'Hi there.\n\nIt\'s "fine".');
    await save();
    await page.waitForURL(/#\/posts\/hello-world$/);
    const t = text('content/posts/hello-world.md');
    assert(/^---\ntitle: "Hello: World"\ndate: \d{4}-\d\d-\d\d\ndescription: First post\ntags: \[one, two words\]\n---\nHi there\./.test(t), `bad new file:\n${t}`);
  });

  await step('new post: duplicate name is refused', async () => {
    await clearToasts();
    await page.goto(`${BASE}/admin/#/posts/+new`); await page.reload();
    await page.fill('#pw', PASS); await page.click('button[type=submit]');
    await page.waitForSelector('#f-title');
    await page.fill('#f-title', 'Hello World'); await page.fill('#f-slug', 'hello-world'); await page.fill('#f-body', 'dup');
    await save();
    assert(/already exists/i.test(await lastToast()), 'expected duplicate message');
  });

  await step('now: new entry keeps apostrophes, quotes and backticks exactly', async () => {
    await page.goto(`${BASE}/admin/#/now/+new`); await page.reload();
    await page.fill('#pw', PASS); await page.click('button[type=submit]');
    await page.waitForSelector('#f-date-name');
    await page.fill('#f-date-name', '2026-11-01');
    const body = 'It\'s "fine" and `code` ${x} [link](https://example.com).\n\nSecond paragraph.\n';
    await page.fill('#f-body', body);
    await save();
    eq(text('content/now/2026-11-01.md'), body, 'now entry text');
  });

  await step('bookmarks: add an entry at the top, valid JSON, others untouched', async () => {
    await tab('bookmarks');
    await page.waitForSelector('.card');
    const before = JSON.parse(text('content/data/bookmarks.json'));
    await page.getByRole('button', { name: 'Add bookmark' }).click();
    await shot('4-bookmarks');
    await page.fill('#c0-title', 'Test link'); await page.fill('#c0-url', 'https://example.com/x'); await page.fill('#c0-note', 'note: "ok"');
    await save();
    const after = JSON.parse(text('content/data/bookmarks.json'));
    eq(after.length, before.length + 1, 'count');
    eq(after[0].title, 'Test link'); eq(after[0].note, 'note: "ok"');
    eq(JSON.stringify(after.slice(1)), JSON.stringify(before), 'existing bookmarks must be unchanged');
    assert(!('enhancedUrl' in after[0]), 'empty optional fields should be omitted');
  });

  await step('bookmarks: required field blocks saving', async () => {
    await clearToasts();
    await page.getByRole('button', { name: 'Add bookmark' }).click();
    await save();
    assert(/required/i.test(await lastToast()), 'expected a required-field message');
    dialogAnswer = true;
  });

  await step('uses: edit a blurb', async () => {
    await page.goto(`${BASE}/admin/#/uses`); await page.reload();
    await page.fill('#pw', PASS); await page.click('button[type=submit]');
    await page.waitForSelector('.card');
    await page.fill('#c0-blurb', 'Edited blurb');
    await save();
    eq(JSON.parse(text('content/data/uses.json'))[0].blurb, 'Edited blurb');
  });

  await step('settings: change a colour, rest of site.json preserved', async () => {
    await tab('settings');
    await page.waitForSelector('#c-light-link');
    await shot('5-settings');
    const before = JSON.parse(text('content/site.json'));
    await page.fill('#c-light-link', '#112233');
    await save();
    const after = JSON.parse(text('content/site.json'));
    eq(after.theme.light.link, '#112233');
    after.theme.light.link = before.theme.light.link;
    eq(JSON.stringify(after), JSON.stringify(before), 'everything else must be identical (incl. admin block)');
  });

  await step('settings: invalid colour is refused', async () => {
    await clearToasts();
    await page.fill('#c-light-link', 'blue');
    await save();
    assert(/colour like/i.test(await lastToast()), 'expected a colour message');
    await page.fill('#c-light-link', '#112233');
  });

  await step('images: upload is cleaned + byte-identical; delete removes it', async () => {
    dialogAnswer = true;
    await tab('media');
    await page.waitForSelector('.tile');
    await shot('6-images');
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    await page.locator('input[type=file]').setInputFiles({ name: 'My Cool Pic.PNG', mimeType: 'image/png', buffer: png });
    await page.waitForSelector('text=my-cool-pic.png');
    assert(files.get('content/media/img/my-cool-pic.png').buf.equals(png), 'uploaded bytes differ');
    await page.locator('.tile', { hasText: 'my-cool-pic.png' }).getByRole('button', { name: 'Delete' }).click();
    await page.waitForFunction(() => !document.body.innerText.includes('my-cool-pic.png'));
    assert(!files.has('content/media/img/my-cool-pic.png'), 'file should be deleted');
  });

  await step('pages: raw edit saves; a page without title/path is refused', async () => {
    await clearToasts();
    await tab('pages');
    await page.waitForSelector('.rows li');
    eq(await page.locator('.rows li').count(), 10, 'page count');
    await page.click('text=Tags — Isaac');
    await page.waitForSelector('textarea.raw');
    await page.fill('textarea.raw', 'no front matter');
    await save();
    assert(/title: and path:/i.test(await lastToast()), 'expected front matter warning');
    await page.reload(); await page.fill('#pw', PASS); await page.click('button[type=submit]');
    await page.waitForSelector('textarea.raw');
    await clearToasts();
    await page.fill('textarea.raw', (await page.inputValue('textarea.raw')) + '\n<!-- edited via admin -->\n');
    await save();
    assert(text('content/pages/tags.html').endsWith('<!-- edited via admin -->\n'), 'page not saved');
  });

  await step('delete: removes the post and returns to the list', async () => {
    await page.goto(`${BASE}/admin/#/posts/hello-world`); await page.reload();
    await page.fill('#pw', PASS); await page.click('button[type=submit]');
    await page.waitForSelector('#f-body');
    await page.getByRole('button', { name: 'Delete' }).click();
    await page.waitForURL(/#\/posts$/);
    assert(!files.has('content/posts/hello-world.md'), 'post should be deleted');
    put('content/posts/hello-world.md', Buffer.from('---\ntitle: "Hello: World"\ndate: 2026-11-02\ntags: [one]\n---\nKept for the build check.\n'));
  });

  if (SHOTS) {
    await page.setViewportSize({ width: 390, height: 844 });
    await tab('posts');
    await page.click('text=Dust mites'); await page.waitForSelector('#f-body');
    await shot('7-mobile-editor');
    await tab('bookmarks'); await shot('8-mobile-bookmarks');
    await tab('settings'); await shot('9-mobile-settings');
    await page.setViewportSize({ width: 1280, height: 900 });
  }

  await step('security: only this site and api.github.com were contacted, no console errors, CSP intact', async () => {
    const hosts = new Set(requests.map(u => new URL(u).host).filter(h => h));
    const allowed = new Set([new URL(BASE).host, 'api.github.com']);
    const stray = [...hosts].filter(h => !allowed.has(h));
    assert(!stray.length, `unexpected hosts contacted: ${stray}`);
    assert(!problems.length, `console problems:\n${problems.join('\n')}`);
    assert(requests.some(u => u.endsWith('/style.css')), 'preview should have loaded the site stylesheet');
    const html = fs.readFileSync(path.join(DIST, 'admin', 'index.html'), 'utf8');
    assert(/Content-Security-Policy/.test(html) && /script-src 'self'/.test(html) && /noindex/.test(html), 'CSP / noindex missing');
    assert(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(html), 'admin page must have no inline scripts');
  });

  await step('build: the admin\'s commits produce a valid site', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'admin-build-'));
    for (const d of ['engine', 'theme', 'public', 'admin', 'package.json']) fs.cpSync(path.join(REPO, d), path.join(tmp, d), { recursive: true });
    fs.symlinkSync(path.join(REPO, 'node_modules'), path.join(tmp, 'node_modules'));
    for (const [p, v] of files) { const dest = path.join(tmp, p); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, v.buf); }
    const r = spawnSync(process.execPath, [path.join(tmp, 'engine', 'build.js')], { cwd: tmp, encoding: 'utf8' });
    assert(r.status === 0, `build failed:\n${r.stdout}\n${r.stderr}`);
    const rd = p => fs.readFileSync(path.join(tmp, 'dist', p), 'utf8');
    assert(fs.existsSync(path.join(tmp, 'dist/posts/hello-world.html')), 'new post page missing');
    assert(rd('posts/hello-world.html').includes('Kept for the build check.'), 'new post body missing');
    assert(rd('posts/dust-mites.html').includes('content="A: &quot;quoted&quot; thing it\'s"'), 'edited description missing');
    assert(rd('now-data.js').includes('2026-11-01') && rd('now-data.js').includes('Second paragraph'), 'now entry missing');
    assert(rd('bookmarks-data.js').includes('Test link'), 'bookmark missing');
    assert(rd('index.html').includes('--link:#112233'), 'new colour missing from page head');
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  console.log(`\n${commits.length} commits made by the admin during the test:`);
  for (const c of commits) console.log(`  ${c.op.padEnd(6)} ${c.path}   "${c.message}"`);

  await browser.close(); server.close();
  console.log(failed ? `\n${failed} step(s) FAILED` : '\nAll steps passed');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
