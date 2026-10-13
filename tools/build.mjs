#!/usr/bin/env node
/* core + every family → dingbats.js (and dingbats.min.js when esbuild is at hand) */
import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url'; import { execFileSync } from 'node:child_process';
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const ORDER = ['classic', 'signals', 'faces', 'nature', 'lanna', 'kitchen', 'curious', 'ornament'];
const all = fs.readdirSync(path.join(ROOT, 'src/fam')).filter(f => f.endsWith('.js')).map(f => f.slice(0, -3));
const fams = ORDER.filter(f => all.includes(f)).concat(all.filter(f => !ORDER.includes(f)).sort());
const parts = [fs.readFileSync(path.join(ROOT, 'src/core.js'), 'utf8')].concat(fams.map(f => fs.readFileSync(path.join(ROOT, 'src/fam', f + '.js'), 'utf8')));
const out = path.join(ROOT, 'dingbats.js');
fs.writeFileSync(out, parts.join('\n'));
const esb = '/Users/annikapeacock/Developer/claude code projects/anidoodle-motdang/node_modules/.bin/esbuild';
if (fs.existsSync(esb)) execFileSync(esb, [out, '--minify', '--outfile=' + path.join(ROOT, 'dingbats.min.js'), '--log-level=warning']);
/* the gallery as the artifact host serves it (doctype, charset, viewport around the page), for looking at it here */
const g = fs.readFileSync(path.join(ROOT, 'gallery.html'), 'utf8').replace('<script src="dingbats.min.js">', '<script src="../dingbats.' + (fs.existsSync(path.join(ROOT, 'dingbats.min.js')) ? 'min.' : '') + 'js">');
fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'out/gallery-local.html'), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>\n' + g + '\n</body></html>');
const D = (await import('node:module')).createRequire(import.meta.url)(out);
console.log('dingbats.js', (fs.statSync(out).size / 1024).toFixed(0) + ' KB', fs.existsSync(path.join(ROOT, 'dingbats.min.js')) ? '· min ' + (fs.statSync(path.join(ROOT, 'dingbats.min.js')).size / 1024).toFixed(0) + ' KB' : '', '·', D.names().length, 'dingbats in', fams.join(', '));
