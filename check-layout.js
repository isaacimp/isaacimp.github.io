#!/usr/bin/env node
// Layout guard: opens the site in Chrome AND Safari's engine (WebKit) at phone,
// tablet and desktop sizes and fails
// if anything overflows sideways, two things overlap that shouldn't, or the
// page throws a script error. Run before every push:
//   node check-layout.js            (starts its own static server)
//   node check-layout.js --shots    (also saves screenshots to ./layout-shots)
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium, webkit } = require('playwright-core');

const ROOT = __dirname;
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SHOTS = process.argv.includes('--shots');
const PAGES = ['/', '/posts/dust-mites.html', '/coercion.html', '/projects/transferfil.html', '/writing.html', '/now/', '/uses.html', '/bookmarks.html'];
const DEVICES = [
  { name: 'iphone-se', width: 320, height: 568, mobile: true },
  { name: 'phone', width: 360, height: 740, mobile: true },
  { name: 'iphone', width: 390, height: 844, mobile: true },
  { name: 'tablet', width: 768, height: 1024, mobile: true },
  { name: 'laptop', width: 1280, height: 800, mobile: false },
  { name: 'wide', width: 1600, height: 900, mobile: false }
];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };

function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(rsp);
    }).listen(0, () => res(srv));
  });
}

// runs inside the page
function inspect() {
  const out = [];
  const vw = document.documentElement.clientWidth;
  const sw = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
  if (sw > vw + 1) out.push(`horizontal overflow: content is ${sw}px wide in a ${vw}px viewport`);

  // anything poking past the right edge (ignore things clipped on purpose)
  const offenders = [];
  document.querySelectorAll('body *').forEach(n => {
    const cs = getComputedStyle(n);
    if (cs.display === 'none' || cs.visibility === 'hidden' || n.closest('[hidden]')) return;
    const r = n.getBoundingClientRect();
    if (!r.width || !r.height) return;
    if (r.right > vw + 1 && cs.position !== 'fixed' && !n.closest('.dock')) offenders.push(`${n.tagName.toLowerCase()}${n.className && typeof n.className === 'string' ? '.' + n.className.trim().split(/\s+/)[0] : ''} right=${Math.round(r.right)}`);
  });
  if (offenders.length) out.push('past right edge: ' + [...new Set(offenders)].slice(0, 5).join(', '));

  // fixed UI that must not sit on top of itself or off-screen
  const fixed = [...document.querySelectorAll('body *')].filter(n => {
    const cs = getComputedStyle(n);
    const r = n.getBoundingClientRect();
    return cs.position === 'fixed' && cs.display !== 'none' && r.width > 0 && r.height > 0 && !n.closest('[hidden]') && !n.parentElement.closest('.dock');
  });
  fixed.forEach(n => {
    const r = n.getBoundingClientRect();
    if (r.left < -1 || r.right > vw + 1) out.push(`fixed element off-screen: .${(n.className || n.id || n.tagName).toString().split(' ')[0]} (${Math.round(r.left)}..${Math.round(r.right)} of ${vw})`);
  });
  for (let i = 0; i < fixed.length; i++) for (let j = i + 1; j < fixed.length; j++) {
    const a = fixed[i].getBoundingClientRect(), b = fixed[j].getBoundingClientRect();
    if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom && !fixed[i].contains(fixed[j]) && !fixed[j].contains(fixed[i])) {
      out.push(`fixed elements overlap: .${fixed[i].className} / .${fixed[j].className}`);
    }
  }

  // text blocks colliding in normal flow: siblings whose boxes overlap vertically AND horizontally
  const blocks = [...document.querySelectorAll('main > *, main section > *, .project > *, .post > *, .dock-bar > *')];
  blocks.forEach((a, i) => {
    const cs = getComputedStyle(a);
    if (cs.position === 'absolute' || cs.position === 'fixed' || cs.display === 'none') return;
    const ra = a.getBoundingClientRect();
    if (!ra.width || !ra.height) return;
    const next = a.nextElementSibling;
    if (!next || next.parentElement !== a.parentElement) return;
    const cn = getComputedStyle(next);
    if (cn.position === 'absolute' || cn.position === 'fixed' || cn.display === 'none') return;
    const rb = next.getBoundingClientRect();
    if (!rb.width || !rb.height) return;
    const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
    const oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    if (ox > 4 && oy > 4) out.push(`overlap: ${a.tagName.toLowerCase()}.${(a.className || '').toString().split(' ')[0]} over ${next.tagName.toLowerCase()}.${(next.className || '').toString().split(' ')[0]} (${Math.round(ox)}x${Math.round(oy)}px)`);
  });
  return out;
}

(async () => {
  const srv = await serve();
  const base = `http://localhost:${srv.address().port}`;
  const engines = [
    ['chrome', () => chromium.launch({ executablePath: CHROME })],
    ['safari', () => webkit.launch()]
  ];
  if (SHOTS) fs.mkdirSync(path.join(ROOT, 'layout-shots'), { recursive: true });
  let failures = 0;

  for (const [engine, launch] of engines) {
    let browser;
    try { browser = await launch(); } catch (e) { console.log(`(skipping ${engine}: ${e.message.split('\n')[0]})`); continue; }
    for (const d of DEVICES) {
      const ctx = await browser.newContext({
        viewport: { width: d.width, height: d.height },
        deviceScaleFactor: 2,
        isMobile: d.mobile,
        hasTouch: d.mobile
      });
      for (const url of PAGES) {
        const page = await ctx.newPage();
        const errs = [];
        page.on('pageerror', e => errs.push('script error: ' + e.message));
        try {
          await page.goto(base + url, { waitUntil: 'networkidle', timeout: 20000 });
          await page.waitForTimeout(400);
          const problems = errs.concat(await page.evaluate(inspect));
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
          await page.waitForTimeout(200);
          (await page.evaluate(inspect)).forEach(p => { if (!problems.includes(p)) problems.push(p + ' (scrolled)'); });
          if (SHOTS) await page.screenshot({ path: path.join(ROOT, 'layout-shots', `${engine}-${d.name}-${url.replace(/[^a-z0-9]+/gi, '_')}.png`) });
          if (problems.length) {
            failures++;
            console.log(`✗ ${engine} ${d.name} ${d.width}px  ${url}`);
            problems.forEach(p => console.log('    - ' + p));
          }
        } catch (e) {
          failures++;
          console.log(`✗ ${engine} ${d.name} ${url}: ${e.message.split('\n')[0]}`);
        }
        await page.close();
      }
      await ctx.close();
    }
    await browser.close();
  }
  srv.close();
  console.log(failures ? `\n${failures} page/device combination(s) have problems.` : `\n✓ no layout or script problems (${engines.length} engines × ${DEVICES.length} devices × ${PAGES.length} pages)`);
  process.exit(failures ? 1 : 0);
})();
