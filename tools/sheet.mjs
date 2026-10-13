#!/usr/bin/env node
/* Contact sheets: every dingbat asked for, frame by frame across its loop, then its tap, then its
   small sizes, drawn by the same code a page runs.
     node tools/sheet.mjs [--fam lanna | --names a,b] [--look ink|paper|riso|neon|mono|all]
                          [--size 96] [--frames 8] [--taps 4] [--dark] [--out out/sheet.png] */
import { chromium } from '/Users/annikapeacock/Developer/claude code projects/anidoodle-motdang/node_modules/playwright-core/index.mjs';
import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url';
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const A = process.argv.slice(2), arg = (k, d) => { const i = A.indexOf('--' + k); return i < 0 ? d : (A[i + 1] && !A[i + 1].startsWith('--') ? A[i + 1] : true); };
const fams = fs.readdirSync(path.join(ROOT, 'src/fam')).filter(f => f.endsWith('.js')).sort();
const opts = { fam: arg('fam', ''), names: arg('names', ''), look: arg('look', 'ink'), size: +arg('size', 96), frames: +arg('frames', 8), taps: +arg('taps', 4), dark: !!arg('dark', false) };
const out = path.resolve(arg('out', `out/sheet-${opts.fam || 'all'}-${opts.look}.png`));
const SHELL = fs.readdirSync(path.join(process.env.HOME, 'Library/Caches/ms-playwright')).filter(d => d.startsWith('chromium_headless_shell-')).sort().pop();
const browser = await chromium.launch({ executablePath: path.join(process.env.HOME, 'Library/Caches/ms-playwright', SHELL, 'chrome-headless-shell-mac-arm64/chrome-headless-shell') });
const page = await browser.newPage({ deviceScaleFactor: 1 });
const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await page.setContent('<!doctype html><body style="margin:0"></body>');
await page.addScriptTag({ path: path.join(ROOT, 'src/core.js') });
/* --fam loads only that family's file, so a half-written file elsewhere cannot break this sheet */
for (const f of fams) if (!opts.fam || f === opts.fam + '.js') await page.addScriptTag({ path: path.join(ROOT, 'src/fam', f) });
const dims = await page.evaluate((o) => {
  const D = window.Dingbats;
  let names = o.names ? o.names.split(',') : D.names(o.fam ? (i => i.fam === o.fam) : null);
  const looks = o.look === 'all' ? ['ink', 'paper', 'riso', 'neon', 'mono'] : [o.look];
  const S = o.size, pad = Math.round(S * 0.3), lab = 150, smalls = [16, 24, 40];
  const rows = [];
  names.forEach(n => looks.forEach(l => rows.push([n, l])));
  const colW = S * 1, maxRatio = Math.max(1, ...names.map(n => D.info(n).ratio));
  const anyWide = maxRatio > 1.5;
  const cellW = (r) => S * r + pad;
  const cols = o.frames + o.taps;
  const isWide = (n) => D.info(n).ratio > 1.5, perRow = (n) => Math.max(1, Math.floor((Math.max(cols * (S + pad), 2 * (S * maxRatio + pad))) / (S * D.info(n).ratio + pad)));
  const W = Math.max(lab + cols * (S + pad) + 140, anyWide ? lab + 2 * (S * maxRatio + pad) : 0);
  const rowH = (n) => isWide(n) ? (S + pad) * Math.ceil(cols / perRow(n)) : S + pad;
  const H = rows.reduce((a, r) => a + rowH(r[0]), 0) + 30;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; document.body.appendChild(cv);
  const ctx = cv.getContext('2d'); const bg = o.dark || looks[0] === 'neon' ? '#141821' : '#FBF8F1', ink = o.dark || looks[0] === 'neon' ? '#F4EFE6' : '#1E1E1E';
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  let y = 10;
  rows.forEach(([n, l]) => {
    const inf = D.info(n), r = inf.ratio, wide = isWide(n), pr = perRow(n);
    ctx.fillStyle = ink; ctx.font = '600 14px system-ui'; ctx.fillText(n, 8, y + 18); ctx.font = '11px system-ui'; ctx.fillStyle = '#888'; ctx.fillText(l + ' · ' + inf.loop + 's', 8, y + 34);
    const cells = [];
    for (let f = 0; f < o.frames; f++) cells.push({ t: f / o.frames, tap: -1, label: 't ' + (f / o.frames).toFixed(2) });
    for (let k = 0; k < o.taps; k++) { const tp = (k + 0.5) / o.taps; cells.push({ t: 0.25, tap: tp, taps: 1, label: 'tap ' + tp.toFixed(2) }); }
    cells.forEach((c, i) => {
      let x, yy;
      if (wide) { x = lab + (i % pr) * (S * r + pad); yy = y + Math.floor(i / pr) * (S + pad); } else { x = lab + i * (S + pad); yy = y; }
      ctx.fillStyle = '#999'; ctx.font = '10px system-ui'; ctx.fillText(c.label, x, yy + S + pad * 0.7);
      ctx.save(); ctx.strokeStyle = 'rgba(128,128,128,.25)'; ctx.setLineDash([2, 3]); ctx.strokeRect(x + 0.5, yy + pad * 0.25 + 0.5, S * r, S); ctx.restore();
      D.draw(ctx, n, { x, y: yy + pad * 0.25, size: S, t: c.t, tap: c.tap, taps: c.taps || 0, boil: i % 3, look: l, ink, bg, dpr: 1 });
    });
    if (!wide) {
      let x = lab + cols * (S + pad);
      smalls.forEach(sz => { D.draw(ctx, n, { x, y: y + pad * 0.25 + (S - sz) / 2, size: sz, t: inf.still, look: l, ink, bg, dpr: 1 }); x += sz * r + 10; });
    }
    y += rowH(n);
  });
  return { W, H, n: rows.length };
}, opts);
fs.mkdirSync(path.dirname(out), { recursive: true });
await page.setViewportSize({ width: dims.W, height: Math.min(dims.H, 16000) });
await (await page.$('canvas')).screenshot({ path: out });
await browser.close();
if (errs.length) { console.error('page errors:\n' + errs.join('\n')); process.exitCode = 1; }
console.log(out, dims.n + ' rows', dims.W + 'x' + dims.H);
