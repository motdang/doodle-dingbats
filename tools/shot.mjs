#!/usr/bin/env node
/* A screenshot of a page in headless Chromium, with its console errors: the gallery by default.
     node tools/shot.mjs [page.html] [--w 1280] [--h 900] [--dark] [--full] [--click "selector"] [--wait 1200] [--out out/shot.png] */
import { chromium } from '/Users/annikapeacock/Developer/claude code projects/anidoodle-motdang/node_modules/playwright-core/index.mjs';
import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url';
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const A = process.argv.slice(2), arg = (k, d) => { const i = A.indexOf('--' + k); return i < 0 ? d : (A[i + 1] && !A[i + 1].startsWith('--') ? A[i + 1] : true); };
const file = A[0] && !A[0].startsWith('--') ? path.resolve(A[0]) : path.join(ROOT, 'out/gallery-local.html');
const SHELL = fs.readdirSync(path.join(process.env.HOME, 'Library/Caches/ms-playwright')).filter(d => d.startsWith('chromium_headless_shell-')).sort().pop();
const browser = await chromium.launch({ executablePath: path.join(process.env.HOME, 'Library/Caches/ms-playwright', SHELL, 'chrome-headless-shell-mac-arm64/chrome-headless-shell') });
const page = await browser.newPage({ viewport: { width: +arg('w', 1280), height: +arg('h', 900) }, deviceScaleFactor: 1, colorScheme: arg('dark', false) ? 'dark' : 'light', reducedMotion: arg('calm', false) ? 'reduce' : 'no-preference' });
const errs = []; page.on('pageerror', e => errs.push('pageerror: ' + e.message)); page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
page.on('requestfailed', r => errs.push('failed: ' + r.url()));
await page.goto(url.pathToFileURL(file).href);
await page.waitForTimeout(+arg('wait', 1200));
for (const sel of [].concat(arg('click', []))) { if (sel === true) continue; await page.click(sel); await page.waitForTimeout(400); }
const info = await page.evaluate(() => ({ live: window.Dingbats && Dingbats.live && Dingbats.live(), names: window.Dingbats && Dingbats.names().length, overflowX: document.documentElement.scrollWidth > innerWidth }));
const out = path.resolve(arg('out', 'out/shot.png'));
await page.screenshot({ path: out, fullPage: !!arg('full', false) });
await browser.close();
console.log(out, JSON.stringify(info)); if (errs.length) console.log(errs.slice(0, 20).join('\n'));
