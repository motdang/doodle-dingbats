#!/usr/bin/env node
/* The gate, in node, no browser: every dingbat draws at every frame of its loop and its tap
   without throwing or making NaN; its loop closes (the last frame steps to the first no further
   than frames step mid-loop); something moves in every second; it stays inside its margin.
     node tools/check.mjs [--fam lanna] [--names a,b] [--quiet] */
import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url'; import { createRequire } from 'node:module';
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..'), require = createRequire(import.meta.url);
const A = process.argv.slice(2), arg = (k, d) => { const i = A.indexOf('--' + k); return i < 0 ? d : (A[i + 1] && !A[i + 1].startsWith('--') ? A[i + 1] : true); };
const fam = arg('fam', ''), only = arg('names', ''), quiet = arg('quiet', false);
require(path.join(ROOT, 'src/core.js'));
for (const f of fs.readdirSync(path.join(ROOT, 'src/fam')).filter(f => f.endsWith('.js')).sort()) if (!fam || f === fam + '.js') require(path.join(ROOT, 'src/fam', f));
const D = globalThis.Dingbats, FPS = 24;
const names = only ? only.split(',') : D.names(fam ? (i => i.fam === fam) : null);
function pts(o) { const a = []; o.ops.forEach(op => { if (op.k === 'clip' || op.k === 'unclip') return; (op.subs || op.polys || op.clip || []).forEach(s => s.forEach(q => a.push(q[0], q[1]))); }); return a; }
function diff(a, b) { if (a.length !== b.length) return 99; let m = 0; for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i] - b[i])); return m; }
let fails = 0, warns = 0;
const seen = new Set();
for (const n of names) {
  const inf = D.info(n), probs = [], notes = [];
  if (!inf) { console.log('✗ ' + n + ': not registered'); fails++; continue; }
  if (seen.has(n)) probs.push('name used twice'); seen.add(n);
  if (!inf.fam) probs.push('no fam'); if (!inf.tags.length) notes.push('no tags'); if (!inf.about) notes.push('no about'); if (!inf.tap) notes.push('no tapAbout');
  const def = { loop: inf.loop, ratio: inf.ratio }, N = Math.max(8, Math.round(inf.loop * FPS)), frames = [];
  let ms = 0, bad = 0, out = 0;
  const mg = 70;   /* far outside the box, even for things that rise or fly */
  try {
    for (let f = 0; f < N; f++) {
      const t0 = process.hrtime.bigint(); const o = D.ops(n, { t: f / N, size: 48 }); ms += Number(process.hrtime.bigint() - t0) / 1e6;
      const p = pts(o); if (p.some(v => !Number.isFinite(v))) bad++;
      for (let i = 0; i < p.length; i += 2) if (p[i] < -mg || p[i] > 100 * def.ratio + mg || p[i + 1] < -mg || p[i + 1] > 100 + mg) { out++; break; }
      frames.push(p);
    }
    for (let k = 0; k <= 12; k++) { const o = D.ops(n, { t: 0.25, tap: k / 12.001, taps: 1 + (k % 3), size: 48 }); if (pts(o).some(v => !Number.isFinite(v))) bad++; }
    for (const look of ['paper', 'riso', 'neon', 'mono']) D.ops(n, { t: 0.4, size: 48, look });
    for (const sz of [14, 20, 300]) D.ops(n, { t: 0.4, size: sz });
  } catch (e) { probs.push('throws: ' + (e.stack || e).toString().split('\n').slice(0, 3).join(' | ')); }
  if (bad) probs.push(bad + ' frames with NaN/Infinity');
  if (out) notes.push(out + ' frames reach more than ' + mg + ' units outside the box');
  if (frames.length === N) {
    const steps = []; for (let f = 1; f < N; f++) steps.push(diff(frames[f - 1], frames[f]));
    const seam = diff(frames[N - 1], frames[0]), typ = steps.slice().sort((a, b) => a - b)[Math.floor(steps.length * 0.9)];
    if (seam > Math.max(typ * 2.5, 1.5)) probs.push(`loop seam jumps ${seam.toFixed(1)} units (mid-loop steps ≤ ${typ.toFixed(1)})`);
    for (let s = 0; s < Math.floor(inf.loop); s++) {
      const a = s * FPS, b = Math.min(N - 1, (s + 1) * FPS); let mv = 0;
      for (let f = a; f < b; f++) mv = Math.max(mv, diff(frames[a], frames[f + 1]));
      if (mv < 0.6) probs.push(`dead air in second ${s + 1} (moves ${mv.toFixed(2)} units)`);
    }
    const still = D.ops(n, { size: 48 }), tapd = D.ops(n, { t: inf.loop ? 0.25 : 0.25, tap: 0.4, taps: 1, size: 48 });
    if (diff(pts(still), pts(tapd)) < 0.5 && !inf.tap) probs.push('a tap changes nothing');
  }
  const per = ms / Math.max(1, frames.length);
  if (per > 4) notes.push(`slow: ${per.toFixed(1)} ms a frame at 48px`);
  if (probs.length) { fails++; console.log('✗ ' + n + ': ' + probs.join('; ') + (notes.length ? ' · ' + notes.join('; ') : '')); }
  else if (notes.length) { warns++; console.log('~ ' + n + ': ' + notes.join('; ')); }
  else if (!quiet) console.log('✓ ' + n + `  ${per.toFixed(2)} ms/frame`);
}
if (D.dups.length) { fails++; console.log('✗ the same name added twice: ' + D.dups.join(', ')); }
console.log(`${names.length} dingbats · ${fails} fail · ${warns} notes`);
process.exitCode = fails ? 1 : 0;
