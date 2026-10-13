#!/usr/bin/env node
/* Files for places a script cannot go: chat apps, email, slides, video editors, print.
     node tools/export.mjs <name,name | --fam lanna | --all> [--size 160] [--look ink] [--ink #1E1E1E]
                          [--formats apng,webp,gif,svg,png] [--matte #FFFFFF] [--fps 24] [--line] [--tap]
   Each lands in out/export/<name>/:
     <name>.apng   the loop with a clear background (browsers, LINE, Telegram)
     <name>.webp   the same, smaller (WhatsApp stickers, web)
     <name>.gif    flattened onto --matte, since GIF edges cannot fade (email, old apps)
     <name>.svg    the loop as an animated SVG (img tags, READMEs, slides) · <name>-still.svg a vector frame for print
     <name>.png    the still frame
   --tap appends the tap reaction to the loop. --line fits LINE's animated sticker frame as I know it
   (320×270, 5–20 frames, up to 4 s, under 300 KB); check LINE's current guide before submitting. */
import { chromium } from '/Users/annikapeacock/Developer/claude code projects/anidoodle-motdang/node_modules/playwright-core/index.mjs';
import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url'; import { execFileSync } from 'node:child_process'; import { createRequire } from 'node:module';
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..'), require = createRequire(import.meta.url);
const A = process.argv.slice(2), arg = (k, d) => { const i = A.indexOf('--' + k); return i < 0 ? d : (A[i + 1] && !A[i + 1].startsWith('--') ? A[i + 1] : true); };
const bundle = path.join(ROOT, 'dingbats.js');
if (!fs.existsSync(bundle)) execFileSync('node', [path.join(ROOT, 'tools/build.mjs')], { stdio: 'inherit' });
const D = require(bundle);
const line = !!arg('line', false), tapToo = !!arg('tap', false);
const o = { size: +arg('size', line ? 230 : 160), look: arg('look', 'ink'), ink: arg('ink', '#1E1E1E'), matte: arg('matte', '#FFFFFF'), fps: +arg('fps', 24),
  formats: String(arg('formats', line ? 'apng' : 'apng,webp,gif,svg,png')).split(',') };
let names = A[0] && !A[0].startsWith('--') ? A[0].split(',') : arg('all', false) ? D.names() : arg('fam', '') ? D.names(i => i.fam === arg('fam')) : [];
if (!names.length) { console.error('which ones? a list of names, --fam <family>, or --all'); process.exit(1); }
const SHELL = fs.readdirSync(path.join(process.env.HOME, 'Library/Caches/ms-playwright')).filter(d => d.startsWith('chromium_headless_shell-')).sort().pop();
const browser = await chromium.launch({ executablePath: path.join(process.env.HOME, 'Library/Caches/ms-playwright', SHELL, 'chrome-headless-shell-mac-arm64/chrome-headless-shell') });
const page = await browser.newPage();
await page.setContent('<!doctype html><body></body>'); await page.addScriptTag({ path: bundle });
const ff = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args]);
for (const n of names) {
  const inf = D.info(n); if (!inf) { console.log('✗ ' + n + ': no such dingbat'); continue; }
  const dir = path.join(ROOT, 'out/export', n), tmp = path.join(dir, '.frames'); fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
  /* frame plan: the loop (and the tap). LINE wants at most 20 frames in at most 4 s */
  let fps = o.fps, loopN = Math.max(2, Math.round(inf.loop * fps));
  if (line) { const total = inf.loop + (tapToo ? 1.5 : 0); fps = Math.max(5, Math.min(20 / Math.min(4, total), 12)); loopN = Math.max(2, Math.round(Math.min(inf.loop, 4) * fps)); }
  const plan = []; for (let f = 0; f < loopN; f++) plan.push({ t: f / loopN, tap: -1 });
  if (tapToo) { const tl = 1.4, tn = Math.round(tl * fps); for (let f = 0; f < tn; f++) plan.push({ t: 0, tap: f / tn, taps: 1 }); }
  const mg = 0.22, W = line ? 320 : Math.round(o.size * (inf.ratio + 2 * mg)), H = line ? 270 : Math.round(o.size * (1 + 2 * mg));
  const size = line ? Math.min(230 / Math.max(1, inf.ratio) * 1, 230) / (1 + 0.1) : o.size;
  const pngs = await page.evaluate(({ n, plan, W, H, size, look, ink, fps }) => {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d'), out = [];
    const w = Dingbats.info(n).ratio * size;
    plan.forEach((p, i) => { ctx.clearRect(0, 0, W, H); Dingbats.draw(ctx, n, { x: (W - w) / 2, y: (H - size) / 2, size, t: p.t, tap: p.tap, taps: p.taps || 0, boil: Math.floor(i * 8 / fps) % 3, look, ink, dpr: 1 }); out.push(cv.toDataURL('image/png').split(',')[1]); });
    return out;
  }, { n, plan, W, H, size, look: o.look, ink: o.ink, fps });
  pngs.forEach((b, i) => fs.writeFileSync(path.join(tmp, String(i).padStart(4, '0') + '.png'), Buffer.from(b, 'base64')));
  const inp = ['-framerate', String(fps), '-i', path.join(tmp, '%04d.png')], made = [];
  if (o.formats.includes('apng')) { ff([...inp, '-plays', line ? '4' : '0', '-f', 'apng', path.join(dir, n + '.apng')]); made.push('apng'); }
  if (o.formats.includes('webp')) { ff([...inp, '-c:v', 'libwebp_anim', '-lossless', '0', '-q:v', '82', '-loop', '0', path.join(dir, n + '.webp')]); made.push('webp'); }
  if (o.formats.includes('gif')) { ff([...inp, '-filter_complex', `color=c=${o.matte}:s=${W}x${H}:r=${fps}[bg];[bg][0:v]overlay=shortest=1,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`, '-loop', '0', path.join(dir, n + '.gif')]); made.push('gif'); }
  if (o.formats.includes('png')) { fs.copyFileSync(path.join(tmp, '0000.png'), path.join(dir, n + '.png')); made.push('png'); }
  if (o.formats.includes('svg')) { fs.writeFileSync(path.join(dir, n + '.svg'), D.svgLoop(n, { look: o.look, ink: o.ink, size: o.size, fps: 12 })); fs.writeFileSync(path.join(dir, n + '-still.svg'), D.svg(n, { look: o.look, ink: o.ink, size: o.size })); made.push('svg'); }
  fs.rmSync(tmp, { recursive: true, force: true });
  const sizes = fs.readdirSync(dir).map(f => f + ' ' + Math.round(fs.statSync(path.join(dir, f)).size / 1024) + 'K').join(' · ');
  const warn = line && fs.existsSync(path.join(dir, n + '.apng')) && fs.statSync(path.join(dir, n + '.apng')).size > 300 * 1024 ? '  (over 300 KB: try --look ink or fewer frames)' : '';
  console.log('✓ ' + n + ' · ' + plan.length + ' frames at ' + fps.toFixed(1) + ' fps · ' + sizes + warn);
}
await browser.close();
