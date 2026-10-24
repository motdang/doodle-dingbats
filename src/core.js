/* Doodle dingbats: animated hand-drawn glyphs that sit in a line of text like a character of a font.
   Nan, 2026-10-12: "a set of awesome-doodle animated dingbats, ready for any random thing that would be
   made better with an animated dingbat. Be expansive and curious."

   On a page
     <doodle-dingbat name="lantern"></doodle-dingbat>      or      <i data-dingbat="lantern"></i>
       look   ink (default) · paper · riso · neon · mono
       play   loop (default) · hover · once · still
       size   any CSS length; 1em by default, so it takes the size of the words around it
       a b c skin   colours; the line is the text colour
       weight line weight, 1 by default · speed 1 by default · label words for a screen reader
   In code
     Dingbats.draw(ctx, name, {x, y, size, t, look …})   one frame inside any canvas
     Dingbats.svg(name, o) / Dingbats.svgLoop(name, o)   a frame, or the whole loop, as SVG
     Dingbats.burst(x, y, {names, n})                     a spray of small dingbats from a point
     Dingbats.favicon(name)                               the tab's icon, moving
     Dingbats.bullets(list, name)                         a dingbat before every item of a list
     Dingbats.add(name, def)                              a new one; src/README.txt has the pen

   A frame is a pure function of (t, tap, taps, boil, seed): no clock reaches a drawing, so a page,
   an export and a test draw the same marks. */
(function (G) {
'use strict';
if (G.Dingbats) return;
var TAU = Math.PI * 2, REG = {}, ORDER = [], D = { version: 1, dups: [] };
var DOC = typeof document !== 'undefined' ? document : null;

/* ---------------------------------------------------------------- numbers */
function rng(seed) { var s = (seed >>> 0) || 1; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
function hash(str) { var h = 2166136261; str = String(str); for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, u) { return a + (b - a) * u; }
function ease(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }
function easeOut(u) { u = clamp(u, 0, 1); return 1 - (1 - u) * (1 - u) * (1 - u); }
function easeIn(u) { u = clamp(u, 0, 1); return u * u * u; }
function bump(u) { return u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u); }
function spring(u) { u = clamp(u, 0, 1); return 1 - Math.exp(-6 * u) * Math.cos(9 * u); }   /* 0 → overshoot → 1 */
function wave(t, n, ph) { return Math.sin(TAU * (t * (n || 1) + (ph || 0))); }
function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
function frac(v) { return v - Math.floor(v); }
D.math = { TAU: TAU, rng: rng, hash: hash, clamp: clamp, lerp: lerp, ease: ease, easeOut: easeOut, easeIn: easeIn, bump: bump, spring: spring, wave: wave, seg: seg, frac: frac };

/* ---------------------------------------------------------------- SVG path data → points */
function flat(d) {
  var T = String(d).match(/[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) || [];
  var out = [], cur = null, i = 0, c = '', x = 0, y = 0, sx = 0, sy = 0, px = 0, py = 0, pc = '';
  function n() { return +T[i++]; }
  function mv(a, b) { cur = { p: [[a, b]], z: false }; out.push(cur); x = sx = a; y = sy = b; }
  function ln(a, b) { if (!cur) mv(x, y); cur.p.push([a, b]); x = a; y = b; }
  function cub(x1, y1, x2, y2, x3, y3) {
    var x0 = x, y0 = y, L = Math.hypot(x1 - x0, y1 - y0) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x3 - x2, y3 - y2), m = Math.max(3, Math.ceil(L / 2.5));
    for (var k = 1; k <= m; k++) { var u = k / m, v = 1 - u; ln(v * v * v * x0 + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * x3, v * v * v * y0 + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y3); }
  }
  function quad(x1, y1, x2, y2) { cub(x + 2 / 3 * (x1 - x), y + 2 / 3 * (y1 - y), x2 + 2 / 3 * (x1 - x2), y2 + 2 / 3 * (y1 - y2), x2, y2); }
  function arc(rx, ry, phi, fa, fs, x2, y2) {
    var x1 = x, y1 = y; if (!rx || !ry) return ln(x2, y2);
    rx = Math.abs(rx); ry = Math.abs(ry); phi = phi * Math.PI / 180;
    var cs = Math.cos(phi), sn = Math.sin(phi), dx = (x1 - x2) / 2, dy = (y1 - y2) / 2, xp = cs * dx + sn * dy, yp = -sn * dx + cs * dy,
      lam = xp * xp / (rx * rx) + yp * yp / (ry * ry);
    if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
    var num = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp, den = rx * rx * yp * yp + ry * ry * xp * xp,
      co = (!fa === !fs ? -1 : 1) * Math.sqrt(Math.max(0, num / (den || 1))), cxp = co * rx * yp / ry, cyp = -co * ry * xp / rx,
      cx = cs * cxp - sn * cyp + (x1 + x2) / 2, cy = sn * cxp + cs * cyp + (y1 + y2) / 2;
    function ang(ux, uy, vx, vy) { return Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy); }
    var t1 = ang(1, 0, (xp - cxp) / rx, (yp - cyp) / ry), dt = ang((xp - cxp) / rx, (yp - cyp) / ry, (-xp - cxp) / rx, (-yp - cyp) / ry);
    if (!fs && dt > 0) dt -= TAU; else if (fs && dt < 0) dt += TAU;
    var m = Math.max(4, Math.ceil(Math.abs(dt) * Math.max(rx, ry) / 2.5));
    for (var k = 1; k <= m; k++) { var a = t1 + dt * k / m, ca = Math.cos(a), sa = Math.sin(a); ln(cx + rx * ca * cs - ry * sa * sn, cy + rx * ca * sn + ry * sa * cs); }
  }
  while (i < T.length) {
    if (/[a-z]/i.test(T[i])) c = T[i++]; else if (!c) { i++; continue; }
    var C = c.toUpperCase(), r = c !== C, ox = r ? x : 0, oy = r ? y : 0, a, b, e, f, g, h;
    if (C === 'Z') { if (cur) cur.z = true; cur = null; x = sx; y = sy; pc = 'Z'; c = ''; continue; }
    if (C === 'M') { mv(ox + n(), oy + n()); c = r ? 'l' : 'L'; }
    else if (C === 'L') ln(ox + n(), oy + n());
    else if (C === 'H') ln(ox + n(), y);
    else if (C === 'V') ln(x, oy + n());
    else if (C === 'C') { a = ox + n(); b = oy + n(); e = ox + n(); f = oy + n(); g = ox + n(); h = oy + n(); cub(a, b, e, f, g, h); px = e; py = f; }
    else if (C === 'S') { a = pc === 'C' || pc === 'S' ? 2 * x - px : x; b = pc === 'C' || pc === 'S' ? 2 * y - py : y; e = ox + n(); f = oy + n(); g = ox + n(); h = oy + n(); cub(a, b, e, f, g, h); px = e; py = f; }
    else if (C === 'Q') { a = ox + n(); b = oy + n(); g = ox + n(); h = oy + n(); quad(a, b, g, h); px = a; py = b; }
    else if (C === 'T') { a = pc === 'Q' || pc === 'T' ? 2 * x - px : x; b = pc === 'Q' || pc === 'T' ? 2 * y - py : y; g = ox + n(); h = oy + n(); quad(a, b, g, h); px = a; py = b; }
    else if (C === 'A') { a = n(); b = n(); e = n(); f = n(); g = n(); h = ox + n(); var v2 = oy + n(); arc(a, b, e, f, g, h, v2); }
    pc = C;
  }
  return out.filter(function (s) { return s.p.length > 1; });
}
/* Catmull-Rom through hand-placed points */
function spline(pts, closed) {
  var n = pts.length, out = []; if (n < 3) return pts.map(function (q) { return [q[0], q[1]]; });
  for (var i = 0; i < (closed ? n : n - 1); i++) {
    var p0 = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[closed ? (i + 2) % n : Math.min(n - 1, i + 2)];
    var m = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 2.5));
    for (var k = 0; k < m; k++) {
      var u = k / m, u2 = u * u, u3 = u2 * u;
      out.push([0.5 * (2 * p1[0] + (p2[0] - p0[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (3 * p1[0] - p0[0] - 3 * p2[0] + p3[0]) * u3),
                0.5 * (2 * p1[1] + (p2[1] - p0[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (3 * p1[1] - p0[1] - 3 * p2[1] + p3[1]) * u3)]);
    }
  }
  if (!closed) out.push([pts[n - 1][0], pts[n - 1][1]]);
  return out;
}

/* ---------------------------------------------------------------- the pen
   A dingbat draws in a box 100 high and 100 × ratio wide, y down. Every call records a mark:
   a line (the ink, thick-thin and wobbling), a fill (colour under the line, a hair off register),
   or both. The look decides how a mark becomes pixels. */
function opt(o) { return o == null ? {} : typeof o === 'string' ? { fill: o } : o; }
function Pen(W, env) { this.W = W; this.H = 100; this.m = [1, 0, 0, 1, 0, 0]; this.S = []; this.marks = []; this.env = env; this.small = env.px < 30; this.look = env.look; this.t = env.t; this.tap = env.tap; this.taps = env.taps; }
var PP = Pen.prototype;
function mul(m, a, b, c, d, e, f) { return [m[0] * a + m[2] * b, m[1] * a + m[3] * b, m[0] * c + m[2] * d, m[1] * c + m[3] * d, m[0] * e + m[2] * f + m[4], m[1] * e + m[3] * f + m[5]]; }
PP.push = function () { this.S.push(this.m.slice()); return this; };
PP.pop = function () { this.m = this.S.pop() || [1, 0, 0, 1, 0, 0]; return this; };
PP.move = function (x, y) { this.m = mul(this.m, 1, 0, 0, 1, x, y); return this; };
PP.turn = function (a) { var c = Math.cos(a), s = Math.sin(a); this.m = mul(this.m, c, s, -s, c, 0, 0); return this; };
PP.size = function (sx, sy) { this.m = mul(this.m, sx, 0, 0, sy == null ? sx : sy, 0, 0); return this; };
PP.skew = function (kx, ky) { this.m = mul(this.m, 1, ky || 0, kx || 0, 1, 0, 0); return this; };
/* draw fn about the point (x, y): turned by a, scaled by s (a number or [sx, sy]) */
PP.at = function (x, y, a, s, fn) {
  this.push(); this.move(x, y); if (a) this.turn(a);
  if (s != null && s !== 1) { if (typeof s === 'number') this.size(s); else this.size(s[0], s[1]); }
  fn.call(this, this); return this.pop();
};
/* about a pivot: the thing stays drawn in box coordinates, only turned/scaled around (px, py) */
PP.pivot = function (px, py, a, s, fn) {
  this.push(); this.move(px, py); if (a) this.turn(a);
  if (s != null && s !== 1) { if (typeof s === 'number') this.size(s); else this.size(s[0], s[1]); }
  this.move(-px, -py); fn.call(this, this); return this.pop();
};
PP.mark = function (subs, o) {
  o = opt(o);
  if (o.detail && this.small) return this;
  var m = this.m, close = !!o.close;
  var T = subs.map(function (s) { return { p: s.p.map(function (q) { return [m[0] * q[0] + m[2] * q[1] + m[4], m[1] * q[0] + m[3] * q[1] + m[5]]; }), z: s.z || close }; });
  this.marks.push({ s: T, fill: o.fill || null, ink: o.line === false ? null : (o.ink || 'ink'), w: o.w == null ? 1 : o.w, alpha: o.alpha == null ? 1 : o.alpha,
    hatch: o.hatch == null ? null : o.hatch, wob: o.wob == null ? 1 : o.wob, cap: o.cap || 'taper', dash: o.dash || null, dashOff: o.dashOff || 0, holes: !!o.holes, over: o.over !== false, glow: o.glow || 0, id: this.marks.length });
  return this;
};
/* p.clip(shape, fn): what fn draws shows only inside what shape draws (a shine on a fill, the liquid in a glass).
   shape is a function drawing closed shapes with the pen, or path data, or points */
PP.clip = function (shape, fn) {
  var n0 = this.marks.length, subs;
  if (typeof shape === 'function') { shape.call(this, this); subs = []; this.marks.splice(n0).forEach(function (m) { subs = subs.concat(m.s); }); }
  else { var m = this.m; subs = subsOf(shape, true).map(function (s) { return { p: s.p.map(function (q) { return [m[0] * q[0] + m[2] * q[1] + m[4], m[1] * q[0] + m[3] * q[1] + m[5]]; }), z: true }; }); }
  this.marks.push({ clip: subs, id: this.marks.length });
  fn.call(this, this);
  this.marks.push({ unclip: true, id: this.marks.length });
  return this;
};
function subsOf(d, close) {
  if (typeof d === 'string') return flat(d).map(function (s) { if (close) s.z = true; return s; });
  if (!d.length) return [];
  return (typeof d[0][0] === 'number' ? [d] : d).map(function (p) { return { p: p, z: !!close }; });
}
PP.path = function (d, o) { o = opt(o); return this.mark(subsOf(d, o.close), o); };
PP.line = function (x1, y1, x2, y2, o) { return this.mark([{ p: [[x1, y1], [x2, y2]] }], o); };
PP.poly = function (pts, o) { o = Object.assign({}, opt(o), { close: true }); return this.mark([{ p: pts, z: true }], o); };
PP.curve = function (pts, o) { o = opt(o); return this.mark([{ p: spline(pts, !!o.close), z: !!o.close }], o); };
function ell(x, y, rx, ry, rot, a0, a1) {
  var span = a1 - a0, n = Math.max(8, Math.ceil(Math.abs(span) * Math.max(rx, ry) / 2.2)), out = [], c = Math.cos(rot || 0), s = Math.sin(rot || 0);
  for (var i = 0; i <= n; i++) { var a = a0 + span * i / n, ex = Math.cos(a) * rx, ey = Math.sin(a) * ry; out.push([x + ex * c - ey * s, y + ex * s + ey * c]); }
  return out;
}
PP.circle = function (x, y, r, o) { var p = ell(x, y, r, r, 0, 0, TAU); p.pop(); return this.mark([{ p: p, z: true }], o); };
PP.ellipse = function (x, y, rx, ry, o) { o = opt(o); var p = ell(x, y, rx, ry, o.rot, 0, TAU); p.pop(); return this.mark([{ p: p, z: true }], o); };
PP.arc = function (x, y, r, a0, a1, o) { o = opt(o); var p = ell(x, y, r, o.ry || r, o.rot, a0, a1); if (o.pie) p.push([x, y]); return this.mark([{ p: p, z: !!(o.pie || o.close) }], o); };
PP.rect = function (x, y, w, h, o) {
  o = opt(o); var r = Math.min(o.r || 0, w / 2, h / 2);
  if (!r) return this.mark([{ p: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], z: true }], o);
  var p = [].concat(ell(x + w - r, y + r, r, r, 0, -Math.PI / 2, 0), ell(x + w - r, y + h - r, r, r, 0, 0, Math.PI / 2), ell(x + r, y + h - r, r, r, 0, Math.PI / 2, Math.PI), ell(x + r, y + r, r, r, 0, Math.PI, Math.PI * 1.5));
  return this.mark([{ p: p, z: true }], o);
};
PP.dot = function (x, y, r, c) { var p = ell(x, y, r, r, 0, 0, TAU); p.pop(); return this.mark([{ p: p, z: true }], { fill: c || 'ink', line: false, wob: 0.4 }); };
PP.star = function (x, y, r1, r2, n, o) { var p = []; o = opt(o); var a0 = o.rot == null ? -Math.PI / 2 : o.rot; for (var i = 0; i < n * 2; i++) { var a = a0 + i * Math.PI / n, r = i % 2 ? r2 : r1; p.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } return this.mark([{ p: p, z: true }], o); };
/* an organic closed shape: a circle whose radius breathes (clouds, bushes, puddles, splats) */
PP.blob = function (x, y, r, o) {
  o = opt(o); var R = rng(o.seed || 7), n = Math.max(10, o.n || 9), pts = [], amp = o.lumpy == null ? 0.18 : o.lumpy;
  for (var i = 0; i < n; i++) { var a = i / n * TAU, rr = r * (1 + (R() - 0.5) * 2 * amp); pts.push([x + Math.cos(a) * rr * (o.sx || 1), y + Math.sin(a) * rr * (o.sy || 1)]); }
  return this.mark([{ p: spline(pts, true), z: true }], o);
};
/* a partial stroke: the first u (0..1) of a path, for marks being MADE (writing, steam, a vine growing) */
PP.draw = function (d, u, o) {
  o = opt(o); if (u <= 0) return this;
  var subs = subsOf(d, false); if (o.smooth) subs = subs.map(function (s) { return { p: spline(s.p, false), z: false }; });
  var tot = 0; subs.forEach(function (s) { s.L = plen(s.p); tot += s.L; });
  var want = tot * clamp(u, 0, 1), out = [];
  for (var i = 0; i < subs.length && want > 0; i++) { var s = subs[i]; if (want >= s.L) { out.push({ p: s.p }); want -= s.L; } else { out.push({ p: cut(s.p, want) }); want = 0; } }
  return this.mark(out, o);
};
/* the part of a path between u0 and u1 (a travelling stroke: steam that rises and leaves) */
PP.span = function (d, u0, u1, o) {
  o = opt(o); u0 = clamp(u0, 0, 1); u1 = clamp(u1, 0, 1); if (u1 - u0 <= 0.002) return this;
  var subs = subsOf(d, false); if (o.smooth) subs = subs.map(function (s) { return { p: spline(s.p, false), z: false }; });
  var all = []; subs.forEach(function (s) { all = all.concat(s.p); });
  var L = plen(all), a = cut(all, L * u1), b = cutFrom(a, L * u0);
  return this.mark([{ p: b }], o);
};
function plen(p) { var L = 0; for (var i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return L; }
function cut(p, want) {
  var out = [p[0]], acc = 0;
  for (var i = 1; i < p.length; i++) { var d = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (acc + d >= want) { var u = d ? (want - acc) / d : 0; out.push([lerp(p[i - 1][0], p[i][0], u), lerp(p[i - 1][1], p[i][1], u)]); return out; } acc += d; out.push(p[i]); }
  return out;
}
function cutFrom(p, skip) {
  var acc = 0;
  for (var i = 1; i < p.length; i++) { var d = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (acc + d >= skip) { var u = d ? (skip - acc) / d : 0; return [[lerp(p[i - 1][0], p[i][0], u), lerp(p[i - 1][1], p[i][1], u)]].concat(p.slice(i)); } acc += d; }
  return p.slice(-2);
}
/* helpers a drawing reaches through the pen */
['ease', 'easeOut', 'easeIn', 'bump', 'spring', 'wave', 'seg', 'lerp', 'clamp', 'frac'].forEach(function (k) { PP[k] = D.math[k]; });
PP.rng = function (s) { return rng(hash(this.env.name) ^ (s || 0)); };
PP.TAU = TAU;

/* ---------------------------------------------------------------- colour */
var PAL = {
  a: '#F2B134', b: '#EF5B5B', c: '#2EA8A0',
  red: '#E2412E', orange: '#F28C28', flame: '#FF9E2C', yellow: '#F7D046', gold: '#E9B43B', leaf: '#62B04A', green: '#2E8B57',
  mint: '#9ADBC0', sky: '#8ACEF2', blue: '#3A7BD5', navy: '#22386B', sea: '#1F9AA6', plum: '#8E4FA8', lilac: '#C3A6E8', pink: '#F49AC1', rose: '#E85A8B',
  cream: '#FFF1D0', white: '#FFFFFF', black: '#1E1E1E', brown: '#8B5A2B', wood: '#C98A4B', sand: '#E8CF9A', grey: '#A3A8AE', stone: '#CFC8BC',
  skin: '#E8B07A', smoke: '#D9D6D0', night: '#1B2340'
};
D.palette = PAL;
function hex2rgb(h) {
  h = String(h).trim();
  if (h[0] === '#') { if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]; var v = parseInt(h.slice(1, 7), 16); return [v >> 16 & 255, v >> 8 & 255, v & 255]; }
  var m = h.match(/rgba?\(([^)]+)\)/); if (m) { var q = m[1].split(/[ ,/]+/).map(parseFloat); return [q[0], q[1], q[2]]; }
  return [0, 0, 0];
}
function rgb2hex(c) { return '#' + c.map(function (v) { return ('0' + Math.round(clamp(v, 0, 255)).toString(16)).slice(-2); }).join(''); }
function hsl(c) {
  var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
  if (d) { s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [h, s, l];
}
function lum(c) { return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; }
var RISO = { pink: '#FF48B0', blue: '#0078BF', yellow: '#FFE800', teal: '#00838A', ink: '#3255A4' };
/* a page printing in its own inks can hand them over: Dingbats.riso({ pink, blue, yellow, teal, ink }) */
D.riso = function (o) { Object.keys(o || {}).forEach(function (k) { if (k in RISO && o[k]) RISO[k] = o[k]; }); if (D.refresh) D.refresh(); };
function risoOf(hex) {
  var c = hex2rgb(hex), q = hsl(c);
  if (q[2] > 0.9) return null;                       /* paper */
  if (q[2] < 0.22 || q[1] < 0.12) return RISO.ink;
  var h = q[0];
  if (h < 38 || h >= 320) return RISO.pink;
  if (h < 72) return RISO.yellow;
  if (h < 190) return RISO.teal;
  return RISO.blue;
}
function neonOf(hex) {
  var c = hex2rgb(hex), q = hsl(c);
  if (q[1] < 0.15) return q[2] > 0.5 ? '#F4F1FF' : '#B9C2FF';
  var h = q[0] / 360, s = 1, l = 0.62;
  function f(n) { var k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }
  return rgb2hex([f(0) * 255, f(8) * 255, f(4) * 255]);
}
function colour(name, env) {
  if (name == null) return null;
  if (name === 'ink') return env.ink || '#1E1E1E';
  if (name === 'bg') return env.bg || '#FFFFFF';
  if (env.cols && env.cols[name]) return env.cols[name];
  return PAL[name] || name;
}

/* ---------------------------------------------------------------- marks → geometry
   Uniform points along each path, a slow wobble seeded per mark and per boil (three boils
   cycle, as a hand-drawn cel line does), then ribbons of varying width for the ink. */
function resample(src, h) {
  var out = [[src[0][0], src[0][1]]], need = h;
  for (var i = 1; i < src.length; i++) {
    var ax = src[i - 1][0], ay = src[i - 1][1], bx = src[i][0], by = src[i][1], L = Math.hypot(bx - ax, by - ay), at = 0;
    while (L - at >= need) { at += need; var u = at / L; out.push([ax + (bx - ax) * u, ay + (by - ay) * u]); need = h; }
    need -= L - at;
  }
  var last = src[src.length - 1], q = out[out.length - 1];
  if (Math.hypot(last[0] - q[0], last[1] - q[1]) > h * 0.3) out.push([last[0], last[1]]);
  return out;
}
function normals(p, z) {
  var n = p.length, out = new Array(n);
  for (var i = 0; i < n; i++) {
    var a = p[z ? (i - 1 + n) % n : Math.max(0, i - 1)], b = p[z ? (i + 1) % n : Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    out[i] = [-dy / d, dx / d];
  }
  return out;
}
function wobble(p, z, amp, R) {
  var n = p.length; if (n < 2 || !amp) return p;
  var s = [0], L = 0, i; for (i = 1; i < n; i++) { L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); s.push(L); }
  if (z) L += Math.hypot(p[0][0] - p[n - 1][0], p[0][1] - p[n - 1][1]);
  var f1 = 0.05 + R() * 0.05, f2 = 0.16 + R() * 0.1, f3 = 0.5 + R() * 0.3, p1 = R() * TAU, p2 = R() * TAU, p3 = R() * TAU, gx = (R() - 0.5) * amp * 0.7, gy = (R() - 0.5) * amp * 0.7;
  if (z && L > 1) { f1 = Math.max(1, Math.round(L * f1 / TAU)) * TAU / L; f2 = Math.max(2, Math.round(L * f2 / TAU)) * TAU / L; f3 = Math.max(3, Math.round(L * f3 / TAU)) * TAU / L; }
  var N = normals(p, z), out = new Array(n);
  for (i = 0; i < n; i++) { var o = amp * (0.72 * Math.sin(s[i] * f1 + p1) + 0.34 * Math.sin(s[i] * f2 + p2) + 0.1 * Math.sin(s[i] * f3 + p3)); out[i] = [p[i][0] + N[i][0] * o + gx, p[i][1] + N[i][1] * o + gy]; }
  return out;
}
function ribbon(p, z, wf) {
  var n = p.length, N = normals(p, z), L = new Array(n), Rr = new Array(n);
  for (var i = 0; i < n; i++) { var w = wf(n > 1 ? i / (n - 1) : 0) / 2; L[i] = [p[i][0] + N[i][0] * w, p[i][1] + N[i][1] * w]; Rr[n - 1 - i] = [p[i][0] - N[i][0] * w, p[i][1] - N[i][1] * w]; }
  if (z) return [L, Rr];
  /* round the two ends */
  var out = L.slice(), e = p[n - 1], s0 = p[0], k, a0, we = wf(1) / 2, ws = wf(0) / 2;
  a0 = Math.atan2(N[n - 1][1], N[n - 1][0]);
  for (k = 1; k < 6; k++) { var a = a0 - Math.PI * k / 6; out.push([e[0] + Math.cos(a) * we, e[1] + Math.sin(a) * we]); }
  out = out.concat(Rr);
  a0 = Math.atan2(-N[0][1], -N[0][0]);
  for (k = 1; k < 6; k++) { var b = a0 - Math.PI * k / 6; out.push([s0[0] + Math.cos(b) * ws, s0[1] + Math.sin(b) * ws]); }
  return [out];
}
function dashes(p, on, off, ph) {
  var per = on + off, k = ((ph || 0) % per + per) % per, drawing = k < on, acc = drawing ? k : k - on, out = [], cur = [p[0]];   /* ph slides the pattern along the path */
  for (var i = 1; i < p.length; i++) {
    var d = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); acc += d;
    if (drawing) cur.push(p[i]);
    if (drawing && acc >= on) { if (cur.length > 1) out.push(cur); drawing = false; acc = 0; }
    else if (!drawing && acc >= off) { drawing = true; acc = 0; cur = [p[i]]; }
  }
  if (drawing && cur.length > 1) out.push(cur);
  return out;
}
function bbox(subs) { var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; subs.forEach(function (s) { s.forEach(function (q) { if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1]; }); }); return [x0, y0, x1, y1]; }
function hatchLines(box, ang, gap, R, amp, h) {
  if (!(box[2] > box[0]) || !(gap > 0)) return [];
  var cx = (box[0] + box[2]) / 2, cy = (box[1] + box[3]) / 2, rad = Math.hypot(box[2] - box[0], box[3] - box[1]) / 2 + 2, c = Math.cos(ang), s = Math.sin(ang), out = [];
  for (var d = -rad + (R() * gap); d <= rad; d += gap) {
    var a = [cx + c * -rad - s * d, cy + s * -rad + c * d], b = [cx + c * rad - s * d, cy + s * rad + c * d];
    out.push(wobble(resample([a, b], h * 2), false, amp * 0.6, R));
  }
  return out;
}
/* weight and wobble in box units, from the size on screen: small glyphs get bolder, steadier lines */
function units(px, weight) {
  var u = px / 100, W = (1.15 + px * 0.021) / u * (weight || 1), A = (0.18 + px * 0.0085) / u;
  return { u: u, W: W, A: A, h: Math.max(1.4, 1.6 / u) };
}
function geometry(marks, env) {
  var look = env.look, U = units(env.px, env.weight); U.h *= env.coarse || 1; var ops = [], base = hash(env.name) ^ (env.seed || 0), boil = env.boil || 0;
  var Rr = rng(base ^ 0x9e37), regx = (Rr() - 0.5) * U.A * 2.2, regy = (Rr() - 0.4) * U.A * 2.2;   /* colour sits a hair off the line, the same way every frame */
  var wobK = look === 'neon' ? 0.45 : look === 'paper' ? 0.7 : 1;
  marks.forEach(function (mk) {
    if (mk.unclip) { ops.push({ k: 'unclip' }); return; }
    if (mk.clip) {
      var Rc = rng(base ^ Math.imul(mk.id + 1, 2654435761) ^ Math.imul(boil + 1, 40503));
      ops.push({ k: 'clip', subs: mk.clip.map(function (s) { var src = s.p.concat([s.p[0]]), q = resample(src, Math.max(0.05, Math.min(U.h, plen(src) / 12))); q.pop(); return wobble(q, true, U.A * 0.5 * wobK, Rc).map(function (v) { return [v[0] + regx, v[1] + regy]; }); }) });
      return;
    }
    var R = rng(base ^ Math.imul(mk.id + 1, 2654435761) ^ Math.imul(boil + 1, 40503)), amp = U.A * mk.wob * wobK;
    var subs = mk.s.map(function (s) { var src = s.z ? s.p.concat([s.p[0]]) : s.p, L = plen(src), q = resample(src, Math.max(0.05, Math.min(U.h, L / (s.z ? 12 : 4)))); if (s.z && q.length > 2) { var a = q[0], b = q[q.length - 1]; if (Math.hypot(a[0] - b[0], a[1] - b[1]) < U.h * 0.6) q.pop(); } return { p: q, z: s.z }; });
    var fillC = mk.fill, hatch = mk.hatch;
    if (look === 'mono' && fillC && fillC !== 'bg') { var Lm = lum(hex2rgb(colour(fillC, env))); if (Lm < 0.86) hatch = hatch == null ? (Lm < 0.35 ? 'x' : 0.8) : hatch; fillC = 'bg'; }
    if (fillC && subs.some(function (s) { return s.z; })) {
      var fs = subs.filter(function (s) { return s.z && s.p.length > 2; }).map(function (s) { return wobble(s.p, true, amp * 0.55, R); });
      var off = look === 'neon' || fillC === 'bg' ? [0, 0] : [regx * mk.wob, regy * mk.wob];
      if (look === 'paper') fs = fs.map(function (s) { var J = rng(base ^ mk.id * 31 ^ 77); return s.map(function (q) { return [q[0] + (J() - 0.5) * U.A * 0.5, q[1] + (J() - 0.5) * U.A * 0.5]; }); });
      ops.push({ k: 'fill', subs: fs.map(function (s) { return s.map(function (q) { return [q[0] + off[0], q[1] + off[1]]; }); }), c: colour(fillC, env), name: fillC, a: mk.alpha, glow: mk.glow, rule: mk.holes ? 'evenodd' : 'nonzero' });
      if (hatch != null && hatch !== false && fs.length) {
        var ang = hatch === 'x' || hatch === true ? 0.8 : +hatch, gap = Math.max(U.W * 1.6, 2.4 / U.u);
        var lines = hatchLines(bbox(fs), ang, gap, R, amp, U.h);
        if (hatch === 'x') lines = lines.concat(hatchLines(bbox(fs), ang + 1.45, gap * 1.1, R, amp, U.h));
        ops.push({ k: 'hatch', clip: fs, lines: lines.map(function (l) { return ribbon(l, false, function () { return U.W * 0.42; })[0]; }), c: colour('ink', env), a: mk.alpha });
      }
    }
    if (!mk.ink) return;
    var W = U.W * mk.w * (look === 'paper' ? 0.8 : 1), polys = [], cores = [], ph = R() * TAU;
    subs.forEach(function (s) {
      if (s.p.length < 2) return;
      var q = wobble(s.p, s.z, amp, R), runs;
      if (mk.dash) runs = dashes(s.z ? q.concat([q[0]]) : q, mk.dash[0], mk.dash[1], mk.dashOff).map(function (r) { return { p: r, z: false }; });
      else if (s.z && mk.over && env.px >= 28 && look !== 'neon' && q.length > 8) {
        /* a hand closes a loop by running past where it started, a little outside */
        var n = q.length, k0 = Math.floor(R() * n), ext = Math.max(2, Math.round(n * 0.07)), N = normals(q, true), seq = [], sg = R() < 0.5 ? -1 : 1;
        for (var j = 0; j <= n + ext; j++) { var i = (k0 + j) % n, dr = j > n ? (j - n) / ext * W * 0.9 * sg : 0; seq.push([q[i][0] + N[i][0] * dr, q[i][1] + N[i][1] * dr]); }
        runs = [{ p: seq, z: false }];
      } else runs = [{ p: q, z: s.z }];
      runs.forEach(function (r) {
        var taper = mk.cap === 'taper' && !r.z, len = plen(r.p), tl = Math.min(0.2, 6 / Math.max(len, 1));
        var wf = function (u) { var e = taper ? Math.min(1, u / tl, (1 - u) / tl) : 1; return W * (0.42 + 0.58 * Math.pow(Math.max(0, e), 0.6)) * (1 + 0.13 * Math.sin(u * 6.3 + ph)); };
        ribbon(r.p, r.z, wf).forEach(function (pp) { polys.push(pp); });
        if (look === 'neon') ribbon(r.p, r.z, function (u) { return wf(u) * 0.34; }).forEach(function (pp) { cores.push(pp); });   /* the bright wire inside the glass */
      });
    });
    var lname = mk.ink; if (look === 'mono' && lname !== 'ink') lname = /^(white|cream|bg|paper)$/.test(lname) ? 'bg' : 'ink';   /* mono: one ink, the paper for highlights */
    if (polys.length) ops.push({ k: 'line', polys: polys, c: colour(lname, env), name: lname, fc: mk.fill && mk.fill !== 'bg' ? colour(mk.fill, env) : null, a: mk.alpha, w: W, glow: mk.glow, core: look === 'neon' ? cores : null });
  });
  return ops;
}

/* ---------------------------------------------------------------- burst bits: what a tap throws */
var BITS = {
  spark: function (p, c) { p.line(-6, 0, 6, 0, { ink: c || 'a', w: 0.9, cap: 'round' }); p.line(0, -6, 0, 6, { ink: c || 'a', w: 0.9, cap: 'round' }); },
  heart: function (p, c) { p.path('M0 6 C-9 0 -7 -8 0 -3 C7 -8 9 0 0 6Z', { fill: c || 'b', w: 0.7 }); },
  star: function (p, c) { p.star(0, 0, 7, 3, 5, { fill: c || 'a', w: 0.7 }); },
  note: function (p, c) { p.ellipse(-2, 4, 3.4, 2.6, { fill: c || 'ink', w: 0.6, rot: -0.4 }); p.line(1.2, 3, 1.2, -7, { w: 0.7 }); p.path('M1.2 -7 Q5 -6 5 -2', { w: 0.7 }); },
  drop: function (p, c) { p.path('M0 -7 C4 -1 5 2 0 6 C-5 2 -4 -1 0 -7Z', { fill: c || 'sky', w: 0.6 }); },
  leaf: function (p, c) { p.path('M-6 4 C-5 -4 2 -7 7 -6 C6 0 0 6 -6 4Z', { fill: c || 'leaf', w: 0.6 }); p.line(-6, 4, 3, -3, { w: 0.4 }); },
  petal: function (p, c) { p.path('M0 -6 C5 -3 4 4 0 6 C-4 4 -5 -3 0 -6Z', { fill: c || 'pink', w: 0.6 }); },
  confetti: function (p, c, i) { p.rect(-3, -1.6, 6, 3.2, { fill: c || ['a', 'b', 'c'][i % 3], line: false }); },
  bubble: function (p) { p.circle(0, 0, 5, { w: 0.6 }); p.arc(0, 0, 3, -2.6, -1.6, { w: 0.5 }); },
  ember: function (p, c) { p.dot(0, 0, 2.2, c || 'flame'); },
  zzz: function (p) { p.path('M-4 -4 L4 -4 L-4 4 L4 4', { w: 0.8 }); },
  ring: function (p, c) { p.circle(0, 0, 6, { ink: c || 'a', w: 0.8 }); }
};
D.bits = BITS;
function burst(pen, def, env) {
  if (env.tap < 0 || env.calm || def.burst === false) return;
  var dl = def.burstDelay || 0; if (env.tap < dl) return;   /* burstDelay: the part of the tap before the burst, so it lands on the wink or the pop */
  var kind = def.burst || 'spark', kinds = kind.split ? kind.split(' ') : kind, at = def.burstAt || [pen.W / 2, 42], n = def.burstN || 7, R = rng(hash(env.name) ^ (env.taps * 7919)), tl = (def.tapLen || 1) * (1 - dl), tau = (env.tap - dl) * (def.tapLen || 1);
  var tp = (env.tap - dl) / (1 - dl);
  var bs = Math.max(1, 0.55 / units(env.px, 1).u);
  for (var i = 0; i < n; i++) {
    var a = -Math.PI / 2 + (R() - 0.5) * (def.burstSpread || 2.6), v = 70 + R() * 70, x = at[0] + Math.cos(a) * v * tau, y = at[1] + Math.sin(a) * v * tau + (def.burstGravity == null ? 90 : def.burstGravity) * tau * tau, rot = (R() - 0.5) * 6 * tau, sc = bs * (0.7 + R() * 0.5) * (1 - easeIn(seg(tp, 0.55, 1))) * easeOut(seg(tp, 0, 0.12));
    if (sc <= 0.02) continue;
    var k = kinds[i % kinds.length];
    var bc = def.burstColor ? [].concat(def.burstColor)[i % [].concat(def.burstColor).length] : null;
    pen.at(x, y, rot, sc, function (p) { (BITS[k] || BITS.spark)(p, bc, i); });
  }
}

/* ---------------------------------------------------------------- one frame */
function record(name, env) {
  var def = REG[name] || REG['?'], W = 100 * (def.ratio || 1), pen = new Pen(W, env);
  def.draw.call(def, pen, env.t, { tap: env.tap, taps: env.taps || 0, seed: env.seed || 0, calm: !!env.calm, px: env.px, look: env.look });
  burst(pen, def, env);
  return { def: def, W: W, marks: pen.marks };
}
function envOf(name, o) {
  o = o || {};
  var def = REG[name] || REG['?'];
  return { name: name, t: o.t == null ? (def.still == null ? 0.25 : def.still) : frac(o.t), tap: o.tap == null ? -1 : o.tap, taps: o.taps || 0, boil: o.boil || 0, seed: o.seed || 0,
    px: o.px || o.size || 96, look: o.look || 'ink', ink: o.ink, bg: o.bg, weight: o.weight, calm: o.calm, coarse: o.coarse,
    cols: { a: o.a, b: o.b, c: o.c, skin: o.skin } };
}
D.ops = function (name, o) { var env = envOf(name, o), r = record(name, env); return { W: r.W, H: 100, ops: geometry(r.marks, env), env: env }; };

/* ---------------------------------------------------------------- pixels */
var PATS = {};
function grain(ctx, key, col, holes) {
  var k = key + col; if (PATS[k]) return PATS[k];
  if (!DOC) return null;
  var c = DOC.createElement('canvas'), N = 96; c.width = c.height = N; var x = c.getContext('2d'), im = x.createImageData(N, N), R = rng(hash(k)), rgb = hex2rgb(col);
  for (var i = 0; i < N * N; i++) {
    var v = R(), j = i * 4;
    if (holes) { im.data[j] = rgb[0]; im.data[j + 1] = rgb[1]; im.data[j + 2] = rgb[2]; im.data[j + 3] = v < 0.16 ? 0 : v < 0.3 ? 150 : 255; }
    else { var g = v < 0.5 ? 0 : 255; im.data[j] = im.data[j + 1] = im.data[j + 2] = g; im.data[j + 3] = Math.round(R() * 26); }
  }
  x.putImageData(im, 0, 0);
  return (PATS[k] = ctx.createPattern(c, 'repeat'));
}
function trace(ctx, subs) { ctx.beginPath(); subs.forEach(function (s) { if (!s.length) return; ctx.moveTo(s[0][0], s[0][1]); for (var i = 1; i < s.length; i++) ctx.lineTo(s[i][0], s[i][1]); ctx.closePath(); }); }
function patScale(pat, k) { if (pat && pat.setTransform && typeof DOMMatrix !== 'undefined') pat.setTransform(new DOMMatrix().scaleSelf(k, k)); return pat; }
/* ops drawn into ctx, whose transform already maps box units; dev = device pixels per unit */
function paint(ctx, ops, env, dev) {
  var look = env.look, inv = 1 / dev, clips = 0;
  ops.forEach(function (op) {
    if (op.k === 'clip') { ctx.save(); clips++; trace(ctx, op.subs); ctx.clip('nonzero'); return; }
    if (op.k === 'unclip') { if (clips) { ctx.restore(); clips--; } return; }
    ctx.save();
    ctx.globalAlpha = op.a == null ? 1 : op.a;
    if (op.k === 'fill') {
      var c = op.c;
      if (look === 'riso' && !risoOf(c)) { ctx.fillStyle = env.bg || '#FFFFFF'; trace(ctx, op.subs); ctx.fill(op.rule || 'nonzero'); }   /* white in riso is the paper showing: it knocks out ink below */
      else if (look === 'riso') { c = risoOf(c); ctx.globalCompositeOperation = 'multiply'; var rr = rng(hash(c)); ctx.translate((rr() - 0.5) * 1.6, (rr() - 0.5) * 1.6); ctx.fillStyle = patScale(grain(ctx, 'riso', c, true), inv) || c; trace(ctx, op.subs); ctx.fill(op.rule || 'nonzero'); }
      else if (look === 'neon') { c = op.name === 'bg' ? c : neonOf(c); ctx.globalAlpha *= op.name === 'bg' ? 1 : 0.2; ctx.fillStyle = c; trace(ctx, op.subs); ctx.fill(op.rule || 'nonzero'); }
      else if (look === 'paper') {
        ctx.shadowColor = 'rgba(0,0,0,.38)'; ctx.shadowBlur = Math.max(1.5, dev * 2.2); ctx.shadowOffsetX = Math.max(0.6, dev * 0.8); ctx.shadowOffsetY = Math.max(1, dev * 1.4);
        ctx.fillStyle = c; trace(ctx, op.subs); ctx.fill(op.rule || 'nonzero');
        ctx.shadowColor = 'transparent'; var g = patScale(grain(ctx, 'paper', '#000', false), inv); if (g) { ctx.fillStyle = g; ctx.fill(op.rule || 'nonzero'); }
        ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = Math.max(0.5, 0.9 / dev); ctx.stroke();
      }
      else { if (op.glow && look !== 'mono') { ctx.shadowColor = c; ctx.shadowBlur = op.glow * dev * 8; } ctx.fillStyle = c; trace(ctx, op.subs); ctx.fill(op.rule || 'nonzero'); }
    } else if (op.k === 'hatch') {
      trace(ctx, op.clip); ctx.clip('nonzero');
      ctx.fillStyle = look === 'riso' ? RISO.ink : look === 'neon' ? neonOf(op.c) : op.c;
      if (look === 'riso') ctx.globalCompositeOperation = 'multiply';
      trace(ctx, op.lines); ctx.fill('nonzero');
    } else if (op.k === 'line') {
      var lc = op.c;
      if (look === 'riso') { lc = risoOf(lc) || RISO.ink; ctx.globalCompositeOperation = 'multiply'; var r2 = rng(hash(lc)); ctx.translate((r2() - 0.5) * 1.6, (r2() - 0.5) * 1.6); }
      if (look === 'neon') {
        lc = neonOf(op.name === 'ink' && op.fc ? op.fc : lc); ctx.shadowColor = lc;   /* a neon tube takes the colour of what it draws */ ctx.shadowBlur = Math.max(3, dev * 5);
        ctx.fillStyle = lc; trace(ctx, op.polys); ctx.fill('nonzero'); ctx.fill('nonzero');
        if (op.core) { ctx.shadowBlur = 0; ctx.globalAlpha *= 0.8; ctx.fillStyle = '#FFFFFF'; trace(ctx, op.core); ctx.fill('nonzero'); }
      } else if (look === 'paper') {
        ctx.shadowColor = 'rgba(0,0,0,.34)'; ctx.shadowBlur = Math.max(1, dev * 1.2); ctx.shadowOffsetX = Math.max(0.4, dev * 0.5); ctx.shadowOffsetY = Math.max(0.6, dev * 0.8);
        ctx.fillStyle = lc; trace(ctx, op.polys); ctx.fill('nonzero');
      } else { if (op.glow && !op.fc && look !== 'mono') { ctx.shadowColor = lc; ctx.shadowBlur = op.glow * dev * 8; }   /* a filled mark glows from its fill, not its outline */ ctx.fillStyle = lc; trace(ctx, op.polys); ctx.fill('nonzero'); }
    }
    ctx.restore();
  });
  while (clips--) ctx.restore();
}
/* Dingbats.draw(ctx, name, {x, y, size, t, tap, taps, boil, look, ink, bg, a, b, c, skin, weight, dpr})
   size is the height in the ctx's own units; dpr says how many device pixels one of those is */
D.draw = function (ctx, name, o) {
  o = o || {};
  var size = o.size || 48, env = envOf(name, Object.assign({}, o, { px: o.px || size })), r = record(name, env), ops = geometry(r.marks, env);
  ctx.save(); ctx.translate(o.x || 0, o.y || 0); ctx.scale(size / 100, size / 100);
  paint(ctx, ops, env, size / 100 * (o.dpr || 1));
  ctx.restore();
  return r.W / 100 * size;
};

/* ---------------------------------------------------------------- SVG */
function svgPath(subs) { var d = ''; subs.forEach(function (s) { if (!s.length) return; d += 'M' + s.map(function (q) { return (Math.round(q[0] * 10) / 10) + ' ' + (Math.round(q[1] * 10) / 10); }).join('L') + 'Z'; }); return d; }
var CLIPN = 0;
function svgOps(ops, env) {
  var out = '', look = env.look, open = 0;
  ops.forEach(function (op) {
    if (op.k === 'clip') { var cid = 'c' + (++CLIPN).toString(36); out += '<clipPath id="' + cid + '"><path d="' + svgPath(op.subs) + '"/></clipPath><g clip-path="url(#' + cid + ')">'; open++; return; }
    if (op.k === 'unclip') { if (open) { out += '</g>'; open--; } return; }
    var a = op.a != null && op.a < 1 ? ' fill-opacity="' + op.a + '"' : '', c;
    if (op.k === 'fill') { c = look === 'riso' ? risoOf(op.c) || env.bg || '#FFFFFF' : look === 'neon' && op.name !== 'bg' ? neonOf(op.c) : op.c; out += '<path d="' + svgPath(op.subs) + '" fill="' + c + '"' + (op.rule === 'evenodd' ? ' fill-rule="evenodd"' : '') + a + (look === 'riso' ? ' style="mix-blend-mode:multiply"' : '') + '/>'; }
    else if (op.k === 'hatch') { var id = 'h' + (++CLIPN).toString(36); out += '<clipPath id="' + id + '"><path d="' + svgPath(op.clip) + '"/></clipPath><path clip-path="url(#' + id + ')" d="' + svgPath(op.lines) + '" fill="' + (look === 'riso' ? RISO.ink : op.c) + '"' + a + '/>'; }
    else { c = look === 'riso' ? risoOf(op.c) || RISO.ink : look === 'neon' ? neonOf(op.name === 'ink' && op.fc ? op.fc : op.c) : op.c; out += '<path d="' + svgPath(op.polys) + '" fill="' + c + '"' + a + (look === 'riso' ? ' style="mix-blend-mode:multiply"' : '') + '/>'; }
  });
  while (open--) out += '</g>';
  return out;
}
function svgBox(r, o) { var m = o.margin == null ? 12 : o.margin; return [-m, -m, r.W + 2 * m, 100 + 2 * m]; }
/* one frame; o.ink defaults to currentColor so an inline SVG follows the text */
D.svg = function (name, o) {
  o = Object.assign({ ink: 'currentColor', size: 96 }, o || {});
  var r = D.ops(name, o), vb = svgBox(r, o), h = o.height || o.size;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb.join(' ') + '" width="' + Math.round(h * vb[2] / vb[3]) + '" height="' + h + '" role="img" aria-label="' + name + '">' + svgOps(r.ops, r.env) + '</svg>';
};
/* the whole loop as one SVG that plays wherever an image does (img tags, READMEs, docs): frames
   shown in turn by a CSS step animation */
D.svgLoop = function (name, o) {
  o = Object.assign({ ink: '#1E1E1E', size: 96 }, o || {});
  var def = REG[name] || REG['?'], loop = (def.loop || 2) / (o.speed || 1), fps = o.fps || Math.min(12, 48 / loop), n = Math.max(2, Math.round(loop * fps)), frames = '', vb, h = o.height || o.size;
  for (var f = 0; f < n; f++) {
    var r = D.ops(name, Object.assign({ coarse: 1.8 }, o, { t: f / n, boil: Math.floor(f * 8 / fps) % 3 })); vb = vb || svgBox(r, o);   /* coarser points: a loop is many frames */
    frames += '<g style="animation-delay:' + (-(n - f) * loop / n).toFixed(3) + 's">' + svgOps(r.ops, r.env) + '</g>';
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb.join(' ') + '" width="' + Math.round(h * vb[2] / vb[3]) + '" height="' + h + '" role="img" aria-label="' + name + '">' +
    '<style>g{visibility:hidden;animation:f ' + loop.toFixed(3) + 's step-end infinite}@keyframes f{0%{visibility:visible}' + (100 / n).toFixed(3) + '%{visibility:hidden}}' +
    '@media (prefers-reduced-motion:reduce){g{animation:none}g:first-of-type{visibility:visible}}</style>' + frames + '</svg>';
};

/* ---------------------------------------------------------------- the registry */
D.add = function (name, def) {
  if (!def || typeof def.draw !== 'function') throw new Error('dingbat ' + name + ': draw(p, t, s) is missing');
  if (REG[name] && name !== '?') D.dups.push(name + ' (' + (def.fam || '') + ' over ' + (REG[name].fam || '') + ')');
  def.name = name; if (!REG[name]) ORDER.push(name); REG[name] = def;
  if (DOC) wake();
  return D;
};
D.has = function (name) { return !!REG[name]; };
D.info = function (name) { var d = REG[name]; return d && { name: name, fam: d.fam || '', tags: d.tags || [], loop: d.loop || 2, ratio: d.ratio || 1, still: d.still == null ? 0.25 : d.still, tapRest: d.tapRest == null ? 0.5 : d.tapRest, about: d.about || '', tap: d.tapAbout || '' }; };
D.names = function (q) {
  var all = ORDER.filter(function (n) { return n !== '?'; });
  if (!q) return all;
  if (typeof q === 'function') return all.filter(function (n) { return q(D.info(n)); });
  q = String(q).toLowerCase();
  return all.filter(function (n) { var i = D.info(n); return n.indexOf(q) >= 0 || i.fam === q || i.tags.some(function (t) { return t.indexOf(q) >= 0; }); });
};
D.families = function () { var f = []; ORDER.forEach(function (n) { var x = REG[n].fam; if (x && f.indexOf(x) < 0) f.push(x); }); return f; };
/* a misspelt name draws this, so the page shows where it went wrong */
D.add('?', { fam: '', loop: 2, draw: function (p, t) { p.at(50, 50, 0.12 * Math.sin(t * TAU), 1, function () { p.path('M32 34 C32 14 68 14 68 34 C68 48 50 48 50 62', { w: 1.2 }); p.dot(50, 80, 4); }); } });

/* ---------------------------------------------------------------- the page */
if (DOC) (function () {
  var LIVE = [], RM = G.matchMedia ? G.matchMedia('(prefers-reduced-motion: reduce)') : null, RAF = 0, IO = null, PEND = [], RO = null, cursor = 0;
  function now() { return G.performance ? G.performance.now() : Date.now(); }
  function calm() { return D.calm || (RM && RM.matches); }
  function attr(el, k) { var v = el.getAttribute(k); if (v == null) v = el.getAttribute('data-' + k); return v; }
  function bgOf(el) {
    for (var e = el; e && e.nodeType === 1; e = e.parentElement) { var c = G.getComputedStyle(e).backgroundColor; if (c && !/rgba\(.*,\s*0\)$|transparent/.test(c)) return c; }
    return '#FFFFFF';
  }
  function cssVar(cs, k) { var v = cs.getPropertyValue('--db-' + k); return v && v.trim() || null; }
  function colours(I) {
    var el = I.host, cs = G.getComputedStyle(el);
    I.env.ink = attr(el, 'ink') || cs.color; I.env.bg = attr(el, 'bg') || bgOf(el);
    ['a', 'b', 'c', 'skin'].forEach(function (k) { I.env.cols[k] = attr(el, k) || cssVar(cs, k) || undefined; });
    I.env.look = attr(el, 'look') || cssVar(cs, 'look') || 'ink';
    I.env.weight = +(attr(el, 'weight') || cssVar(cs, 'weight') || 1);
  }
  function size(I) {
    var r = I.host.getBoundingClientRect(), h = r.height || 16, def = REG[I.name] || REG['?'], dpr = Math.min(3, G.devicePixelRatio || 1), mg = def.margin == null ? 18 : def.margin;
    if (typeof mg === 'number') mg = [mg, mg, mg, mg];
    if (I.burstM) { var tm = def.tapMargin == null ? [75, 55, 40, 55] : typeof def.tapMargin === 'number' ? [def.tapMargin, def.tapMargin, def.tapMargin, def.tapMargin] : def.tapMargin; mg = [Math.max(mg[0], tm[0]), Math.max(mg[1], tm[1]), Math.max(mg[2], tm[2]), Math.max(mg[3], tm[3])]; }
    var u = h / 100, W = (def.ratio || 1) * 100, cw = (W + mg[1] + mg[3]) * u, ch = (100 + mg[0] + mg[2]) * u;
    I.u = u; I.dpr = dpr; I.mg = mg; I.env.px = h;
    var cv = I.cv; cv.width = Math.max(1, Math.round(cw * dpr)); cv.height = Math.max(1, Math.round(ch * dpr));
    cv.style.width = cw + 'px'; cv.style.height = ch + 'px'; cv.style.left = -mg[3] * u + 'px'; cv.style.top = -mg[0] * u + 'px';
    I.last = -1;
  }
  function setup(el) {
    var name = attr(el, 'name') || attr(el, 'dingbat') || '?';
    if (!REG[name]) { if (PEND.indexOf(el) < 0) PEND.push(el); }
    if (el.__db) { el.__db.stop(); }
    var def = REG[name] || REG['?'], sz = attr(el, 'size') || '1em', ratio = def.ratio || 1, label = attr(el, 'label');
    el.style.display = 'inline-block'; el.style.position = 'relative'; el.style.height = sz; el.style.width = 'calc(' + sz + ' * ' + ratio + ')';
    el.style.verticalAlign = /em$/.test(sz) && !attr(el, 'size') ? '-0.18em' : el.style.verticalAlign || 'middle';
    el.style.lineHeight = '0';
    if (label) { el.setAttribute('role', 'img'); el.setAttribute('aria-label', label); } else el.setAttribute('aria-hidden', 'true');
    var cv = el.querySelector('canvas.db-cv');
    if (!cv) { cv = DOC.createElement('canvas'); cv.className = 'db-cv'; cv.style.position = 'absolute'; cv.style.pointerEvents = 'none'; el.appendChild(cv); }
    var idx = LIVE.length, I = {
      host: el, name: name, cv: cv, ctx: cv.getContext('2d'), play: attr(el, 'play') || 'loop', speed: +(attr(el, 'speed') || 1),
      clock: (attr(el, 'play') || 'loop') === 'loop' && attr(el, 'sync') == null ? (hash(name + (attr(el, 'seed') || idx)) % 1000) / 1000 * (def.loop || 2) : 0, seed: +(attr(el, 'seed') || 0),
      t0: now(), prev: now(), tap0: -1, taps: 0, vis: true, hot: false, ran: 0, last: -1, env: { name: name, cols: {}, look: 'ink' }
    };
    I.stop = function () { var k = LIVE.indexOf(I); if (k >= 0) LIVE.splice(k, 1); if (IO) IO.unobserve(el); if (RO) RO.unobserve(el); el.removeEventListener('click', I.onTap); el.removeEventListener('pointerenter', I.on); el.removeEventListener('pointerleave', I.off); el.removeEventListener('focusin', I.on); el.removeEventListener('focusout', I.off); el.__db = null; };
    I.onTap = function () { I.tap0 = now(); I.taps++; var dd = REG[I.name] || {}; if (!calm() && !I.burstM && (dd.burst !== false || dd.tapMargin != null)) { I.burstM = 1; size(I); } kick(); };
    I.on = function () { I.hot = true; kick(); }; I.off = function () { I.hot = false; };
    el.addEventListener('click', I.onTap); el.addEventListener('pointerenter', I.on); el.addEventListener('pointerleave', I.off); el.addEventListener('focusin', I.on); el.addEventListener('focusout', I.off);
    el.__db = I; LIVE.push(I);
    colours(I); size(I);
    if (IO) IO.observe(el); if (RO) RO.observe(el);
    draw(I, now(), true); kick();
    return I;
  }
  function running(I) {
    if (calm()) return false;
    if (I.play === 'still') return false;
    if (I.play === 'hover') return I.hot;
    if (I.play === 'once') return I.ran < 1;
    return true;
  }
  function draw(I, tn, force) {
    var def = REG[I.name] || REG['?'], loop = (def.loop || 2) / (I.speed || 1), dt = Math.min(0.1, (tn - I.prev) / 1000); I.prev = tn;
    var run = running(I);
    if (run) { I.clock += dt; if (I.play === 'once') I.ran += dt / loop; }
    var tap = -1, tl = (def.tapLen || 1);
    if (I.tap0 >= 0) { tap = (tn - I.tap0) / 1000 / tl; if (tap >= 1) { tap = -1; I.tap0 = -1; if (I.burstM) { I.burstM = 0; size(I); } } }
    var st = def.still == null ? 0.25 : def.still, c = calm(), t = c || (I.play === 'once' && I.ran >= 1) || (!run && I.clock === 0) ? st : frac(I.clock / loop + st);
    if (c && tap >= 0) tap = def.tapRest == null ? 0.5 : def.tapRest;
    var fi = Math.floor((tn / 1000) * 24), boil = (run || tap >= 0) && !c ? Math.floor(tn / 125) % 3 : 0;
    if (!force && fi === I.last) return;
    I.last = fi;
    var env = I.env; env.t = t; env.tap = tap; env.taps = I.taps; env.boil = boil; env.seed = I.seed; env.calm = c;
    var r = record(I.name, env), ops = geometry(r.marks, env), ctx = I.ctx, dev = I.u * I.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, I.cv.width, I.cv.height);
    ctx.setTransform(dev, 0, 0, dev, I.mg[3] * dev, I.mg[0] * dev);
    paint(ctx, ops, env, dev);
  }
  function tick() {
    RAF = 0; if (DOC.hidden) return;
    var tn = now(), t0 = tn, n = LIVE.length, any = false;
    for (var k = 0; k < n; k++) {
      var I = LIVE[(cursor + k) % n]; if (!I) continue;
      var act = I.vis && (running(I) || I.tap0 >= 0);
      if (!act) { I.prev = tn; continue; }
      any = true;
      try { draw(I, tn, false); } catch (e) { I.play = 'still'; I.tap0 = -1; if (G.console) console.warn('dingbat ' + I.name + ':', e); }   /* one broken drawing stops itself, not the page */
      if (now() - t0 > 10) { cursor = (cursor + k + 1) % n; break; }   /* the rest wait for the next frame */
    }
    if (any) RAF = G.requestAnimationFrame(tick);
  }
  function kick() { if (!RAF) RAF = G.requestAnimationFrame(tick); }
  var woke = 0;
  function wake() {
    if (woke) return; woke = 1;
    Promise.resolve().then(function () { woke = 0; var p = PEND; PEND = []; p.forEach(function (el) { if (el.isConnected) setup(el); }); });
  }
  D._wake = wake;
  function scan(root) { (root.querySelectorAll ? root.querySelectorAll('[data-dingbat]') : []).forEach(function (el) { if (!el.__db) setup(el); }); }
  if (G.IntersectionObserver) IO = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.target.__db) { e.target.__db.vis = e.isIntersecting; if (e.isIntersecting) kick(); } }); }, { rootMargin: '60px' });
  if (G.ResizeObserver) RO = new ResizeObserver(function (es) { es.forEach(function (e) { var I = e.target.__db; if (I) { var h = e.contentRect.height; if (Math.abs(h - I.env.px) > 0.5) { size(I); draw(I, now(), true); } } }); });
  if (RM && RM.addEventListener) RM.addEventListener('change', function () { LIVE.forEach(function (I) { draw(I, now(), true); }); kick(); });
  DOC.addEventListener('visibilitychange', kick);
  D.mount = function (el, name, o) { if (name) el.setAttribute('data-dingbat', name); Object.keys(o || {}).forEach(function (k) { el.setAttribute('data-' + k, o[k]); }); return setup(el); };
  D.refresh = function () { LIVE.forEach(function (I) { colours(I); size(I); draw(I, now(), true); }); kick(); };
  D.live = function () { return LIVE.length; };
  if (G.customElements && !G.customElements.get('doodle-dingbat')) {
    G.customElements.define('doodle-dingbat', class extends HTMLElement {
      static get observedAttributes() { return ['name', 'look', 'play', 'size', 'a', 'b', 'c', 'skin', 'ink', 'label', 'speed', 'seed', 'weight']; }
      connectedCallback() { setup(this); }
      disconnectedCallback() { if (this.__db) this.__db.stop(); }
      attributeChangedCallback() { if (this.__db) setup(this); }
    });
  }
  function boot() { scan(DOC); if (G.MutationObserver) new MutationObserver(function (ms) { ms.forEach(function (m) { m.addedNodes.forEach(function (nd) { if (nd.nodeType !== 1) return; if (nd.hasAttribute('data-dingbat') && !nd.__db) setup(nd); scan(nd); }); }); }).observe(DOC.documentElement, { childList: true, subtree: true }); }
  if (DOC.readyState === 'loading') DOC.addEventListener('DOMContentLoaded', boot); else Promise.resolve().then(boot);

  /* a spray of small dingbats from a point on the page (a sent form, a saved thing, a win) */
  D.burst = function (x, y, o) {
    if (x && x.getBoundingClientRect) { var b = x.getBoundingClientRect(); o = y; x = b.left + b.width / 2; y = b.top + b.height / 2; }
    o = o || {}; if (calm()) return;
    var names = o.names || ['star', 'heart', 'sparkle'], n = o.n || 14, sz = o.size || 26, life = o.life || 1.6, R = rng(hash(names.join()) ^ Math.floor(now())), dpr = Math.min(2, G.devicePixelRatio || 1);
    var cv = DOC.createElement('canvas'), W = G.innerWidth, H = G.innerHeight; cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'position:fixed;left:0;top:0;width:' + W + 'px;height:' + H + 'px;pointer-events:none;z-index:2147483000';
    DOC.body.appendChild(cv); var ctx = cv.getContext('2d'), t0 = now(), ink = o.ink || G.getComputedStyle(DOC.body).color;
    var ps = []; for (var i = 0; i < n; i++) { var a = -Math.PI / 2 + (R() - 0.5) * (o.spread || 2.4), v = 260 + R() * 340; ps.push({ nm: names[i % names.length], vx: Math.cos(a) * v, vy: Math.sin(a) * v, sp: (R() - 0.5) * 8, s: sz * (0.7 + R() * 0.6), ph: R() }); }
    (function step() {
      var tt = (now() - t0) / 1000; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      if (tt > life) { cv.remove(); return; }
      ps.forEach(function (p) {
        var px = x + p.vx * tt, py = y + p.vy * tt + 700 * tt * tt, k = 1 - easeIn(seg(tt, life * 0.6, life));
        ctx.save(); ctx.translate(px, py); ctx.rotate(p.sp * tt); ctx.scale(k, k);
        D.draw(ctx, p.nm, { x: -p.s / 2, y: -p.s / 2, size: p.s, t: p.ph + tt / 1.2, ink: ink, look: o.look, dpr: dpr, boil: Math.floor(tt * 8) % 3 });
        ctx.restore();
      });
      G.requestAnimationFrame(step);
    })();
  };
  /* the tab's icon, moving; returns a function that stops it */
  D.favicon = function (name, o) {
    o = o || {}; var cv = DOC.createElement('canvas'); cv.width = cv.height = 64; var ctx = cv.getContext('2d'), link = DOC.querySelector('link[rel~="icon"]'), f = 0, def = REG[name] || REG['?'];
    if (!link) { link = DOC.createElement('link'); link.rel = 'icon'; DOC.head.appendChild(link); }
    var fps = o.fps || 6, n = Math.max(1, Math.round((def.loop || 2) * fps));
    function one() { ctx.clearRect(0, 0, 64, 64); var w = (def.ratio || 1); D.draw(ctx, name, { x: (64 - 54 * w) / 2, y: 5, size: 54 / Math.max(1, w), t: calm() ? null : f / n, boil: f % 3, look: o.look, ink: o.ink || '#1E1E1E', a: o.a, b: o.b, c: o.c }); link.href = cv.toDataURL('image/png'); f = (f + 1) % n; }
    one(); if (calm()) return function () {};
    var id = setInterval(one, 1000 / fps); return function () { clearInterval(id); };
  };
  /* a dingbat in front of every item of a list; names may be a list to take turns */
  D.bullets = function (list, names, o) {
    o = o || {}; names = [].concat(names); var k = 0;
    list.style.listStyle = 'none'; if (!list.style.paddingLeft) list.style.paddingLeft = '0.4em';
    Array.prototype.forEach.call(list.children, function (li) {
      if (li.querySelector(':scope > .db-bullet')) return;
      var s = DOC.createElement('i'); s.className = 'db-bullet'; s.setAttribute('data-dingbat', names[k++ % names.length]); s.setAttribute('data-play', o.play || 'hover');
      s.style.marginRight = '0.45em'; li.insertBefore(s, li.firstChild);
    });
    return k;
  };
})();
else { D.burst = D.favicon = D.bullets = D.mount = function () {}; }
function wake() { if (D._wake) D._wake(); }

G.Dingbats = D;
if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(typeof globalThis !== 'undefined' ? globalThis : this);
