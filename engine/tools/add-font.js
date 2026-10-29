#!/usr/bin/env node
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ids = process.argv.slice(2);
if (!ids.length) {
  console.error('usage: node engine/tools/add-font.js <fontsource-id> [more ids]   e.g. node engine/tools/add-font.js newsreader');
  process.exit(1);
}
const FONTS_DIR = path.join(__dirname, '..', '..', 'theme', 'fonts');
fs.mkdirSync(FONTS_DIR, { recursive: true });

for (const id of ids) {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'font-'));
  let pkg = null;
  for (const name of [`@fontsource-variable/${id}`, `@fontsource/${id}`]) {
    try {
      const tgz = execFileSync('npm', ['pack', '--silent', name], { cwd: work, encoding: 'utf8' }).trim().split('\n').pop();
      execFileSync('tar', ['-xzf', tgz], { cwd: work });
      pkg = name;
      break;
    } catch (e) { }
  }
  if (!pkg) { console.error(`\n✗ ${id}: not found on fontsource (check the id at fontsource.org)`); continue; }

  const filesDir = path.join(work, 'package', 'files');
  const wanted = fs.readdirSync(filesDir).filter(f => /-latin-(wght|400|600)-(normal|italic)\.woff2$/.test(f));
  const meta = JSON.parse(fs.readFileSync(path.join(work, 'package', 'package.json'), 'utf8'));
  console.log(`\n/* ${id} (${pkg}@${meta.version}) */`);
  for (const f of wanted) {
    fs.copyFileSync(path.join(filesDir, f), path.join(FONTS_DIR, f));
    const style = f.includes('italic') ? 'italic' : 'normal';
    const weight = f.includes('-wght-') ? '100 900' : (f.match(/-latin-(\d+)-/) || [])[1];
    const family = id.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    console.log(`@font-face{font-family:'${family}';src:url('/fonts/${f}') format('woff2');font-weight:${weight};font-style:${style};font-display:swap;}`);
  }
  fs.rmSync(work, { recursive: true, force: true });
}
console.log('\nPaste the lines above into the FONTS block in theme/style.css, then set the family name under theme.fonts in content/site.json.');
