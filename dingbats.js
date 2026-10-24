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
     Dingbats.draw(ctx, name, {x, y, size, t, look, rig …})   one frame inside any canvas
     el.__db.puppet(t, rig) / el.__db.release()           the page moves it: frame t, pose rig (s.rig), until released
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
  def.draw.call(def, pen, env.t, { tap: env.tap, taps: env.taps || 0, seed: env.seed || 0, calm: !!env.calm, px: env.px, look: env.look, rig: env.rig || null });
  burst(pen, def, env);
  return { def: def, W: W, marks: pen.marks };
}
function envOf(name, o) {
  o = o || {};
  var def = REG[name] || REG['?'];
  return { name: name, t: o.t == null ? (def.still == null ? 0.25 : def.still) : frac(o.t), tap: o.tap == null ? -1 : o.tap, taps: o.taps || 0, boil: o.boil || 0, seed: o.seed || 0,
    px: o.px || o.size || 96, look: o.look || 'ink', ink: o.ink, bg: o.bg, weight: o.weight, calm: o.calm, coarse: o.coarse, rig: o.rig,
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
    /* a page that moves the thing itself holds its strings: puppet(t, rig) draws frame t with the pose rig now, and the
       clock waits until release() */
    I.puppet = function (t, rig) { I.held = 1; I.ht = t; I.env.rig = rig || null; draw(I, now(), true); };
    I.release = function () { I.held = 0; I.env.rig = null; kick(); };
    el.addEventListener('click', I.onTap); el.addEventListener('pointerenter', I.on); el.addEventListener('pointerleave', I.off); el.addEventListener('focusin', I.on); el.addEventListener('focusout', I.off);
    el.__db = I; LIVE.push(I);
    colours(I); size(I);
    if (IO) IO.observe(el); if (RO) RO.observe(el);
    draw(I, now(), true); kick();
    return I;
  }
  function running(I) {
    if (I.held || calm()) return false;
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
    var st = def.still == null ? 0.25 : def.still, c = calm(), t = I.held ? frac(I.ht) : c || (I.play === 'once' && I.ran >= 1) || (!run && I.clock === 0) ? st : frac(I.clock / loop + st);
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

/* Classic: the printer's dingbats (Zapf's ❤ ✂ ✉ ☞ ✎ ★ ❦ …), drawn by hand and set moving. */
(function (D) {
'use strict';
var M = D.math, TAU = M.TAU;

/* ❤ a heart beating lub-dub; tap: one big beat and a spray of small hearts */
D.add('heart', {
  fam: 'classic', tags: ['love', 'like', 'favourite', 'save', 'valentine', '❤'], loop: 1.2, still: 0.6, burst: 'heart', burstAt: [50, 30], tapLen: 1.1,
  about: 'beats lub-dub, the left lobe a beat ahead', tapAbout: 'one big beat and a spray of hearts',
  draw: function (p, t, s) {
    var lub = M.bump(M.seg(t, 0.0, 0.14)), dub = M.bump(M.seg(t, 0.2, 0.34)), big = s.tap >= 0 ? M.bump(M.seg(s.tap, 0, 0.5)) * 0.28 : 0;
    var sx = 1 + lub * 0.09 + dub * 0.05 + big, sy = 1 + lub * 0.06 + dub * 0.04 + big * 0.85, tilt = -0.05 * lub + 0.035 * dub;
    p.pivot(50, 52, tilt, [sx, sy], function () {
      p.path('M50 86 C35 73 14 59 14 38 C14 24 24 15 36 15 C44 15 49 21 50 28 C51 21 57 15 65 15 C76 15 86 24 86 38 C86 59 65 73 50 86 Z', { fill: 'b' });
      p.path('M23 37 C23 29 28 23 35 22', { ink: 'white', w: 0.7, detail: true });
    });
    /* throb lines: drawn out from the heart on the lub, gone by the dub */
    var u = M.seg(t, 0.02, 0.2);
    if (u > 0 && u < 1) {
      var a = M.easeOut(u), b = M.seg(u, 0.45, 1);
      p.span('M8 30 C4 38 4 46 8 54', b, a, { w: 0.7 });
      p.span('M92 30 C96 38 96 46 92 54', b, a, { w: 0.7 });
    }
  }
});

/* small things several of these share: a four-point sparkle, and a twinkle drawn from two crossed strokes */
var SPARK = 'M0 -10 C1.2 -3.5 3.5 -1.2 10 0 C3.5 1.2 1.2 3.5 0 10 C-1.2 3.5 -3.5 1.2 -10 0 C-3.5 -1.2 -1.2 -3.5 0 -10 Z';
function spark(p, x, y, r, rot, o) { p.at(x, y, rot || 0, r / 10, function () { p.path(SPARK, o); }); }
function glint(p, x, y, r, rot, o) { if (r < 0.8) return; o = o || { w: 0.8, cap: 'round' }; p.at(x, y, rot || 0, 1, function () { p.line(-r, 0, r, 0, o); p.line(0, -r, 0, r, o); }); }

/* ★ a star rocking and breathing, a glint twinkling at each shoulder in turn;
   tap: it streaks off as a shooting star and a new one pops into its place */
D.add('star', {
  fam: 'classic', tags: ['favourite', 'rating', 'win', 'night', 'wish', 'magic', '★'], loop: 2.4, still: 0.15, tapLen: 1.7, tapRest: 0.9, burst: false, margin: [34, 50, 14, 14],
  about: 'rocks and breathes while a glint twinkles at each shoulder', tapAbout: 'streaks off as a shooting star; a new one pops into its place',
  draw: function (p, t, s) {
    var tp = s.tap, rock = 0.07 * M.wave(t, 1), breathe = 1 + 0.05 * M.wave(t, 2);
    function star(x, y, k, rot) {
      p.at(x, y, rot, k, function () {
        p.star(0, 0, 45, 20, 5, { fill: 'yellow' });
        p.path('M-17 -9 C-13 -15 -9 -18 -5 -20', { ink: 'white', w: 0.8, detail: true });
      });
    }
    if (tp < 0) {
      star(50, 54, breathe, rock);
      glint(p, 87, 15, 8 * M.bump(M.seg(M.frac(t), 0, 0.4)), 0);
      glint(p, 13, 24, 7 * M.bump(M.seg(M.frac(t + 0.5), 0, 0.4)), 0);
      return;
    }
    var u = M.seg(tp, 0, 0.5), e = M.easeIn(u), x = 50 + 100 * e, y = 54 - 74 * e;
    if (u < 1) {
      star(x, y, (1 - 0.6 * e) * breathe, rock + TAU * 1.5 * e);
      /* three streaks behind it along the line of flight, the tail catching up as it goes */
      var L = 62 * M.easeOut(M.seg(u, 0, 0.3)) * (1 - M.seg(tp, 0.4, 0.5)), dx = 0.804, dy = -0.595;
      [[-8, 0.6], [0, 1], [8, 0.45]].forEach(function (q) {
        var hx = x - dx * 14 * (1 - e) + dy * q[0], hy = y - dy * 14 * (1 - e) - dx * q[0];
        p.line(hx - dx * L * q[1], hy - dy * L * q[1], hx, hy, { w: 0.8 });
      });
    }
    var k = M.spring(M.seg(tp, 0.42, 0.9));
    if (k > 0.03) star(50, 54, k * breathe, rock - 0.9 * (1 - Math.min(k, 1)));
  }
});

/* ✦ three four-point sparkles twinkling out of phase, the big one leading;
   tap: each flares and turns a quarter in turn, and ticks fly out of the big one */
D.add('sparkle', {
  fam: 'classic', tags: ['magic', 'new', 'shine', 'clean', 'glitter', 'ai', '✦', '✨'], loop: 2.1, still: 0.3, tapLen: 1.2, tapRest: 0.9, burst: false,
  about: 'three sparkles twinkle out of phase, the big one leading', tapAbout: 'each flares and turns a quarter in turn; ticks fly out',
  draw: function (p, t, s) {
    var tp = s.tap;
    [[40, 58, 34, 0, 'yellow'], [75, 25, 19, 0.34, 'white'], [78, 77, 13, 0.67, 'yellow']].forEach(function (c, i) {
      var w = 0.5 + 0.5 * M.wave(t, 1, c[3]), k = 0.55 + 0.45 * w * w, d = i * 0.12;
      var pop = tp >= 0 ? M.bump(M.seg(tp, d, d + 0.55)) : 0, turn = tp >= 0 ? M.easeOut(M.seg(tp, d, d + 0.6)) * TAU / 4 : 0;
      spark(p, c[0], c[1], c[2] * (k + 0.5 * pop), 0.2 * M.wave(t, 1, c[3] + 0.25) + turn, { fill: c[4] });
    });
    if (tp >= 0) {
      var u = M.seg(tp, 0.08, 0.8);
      for (var j = 0; j < 8; j++) {
        var a = j * TAU / 8 + 0.4, head = 41 + 15 * M.easeOut(u), tail = 41 + 15 * M.easeIn(u);
        if (head - tail > 0.8) p.line(40 + Math.cos(a) * tail, 58 + Math.sin(a) * tail, 40 + Math.cos(a) * head, 58 + Math.sin(a) * head, { w: 0.8, cap: 'round' });
      }
    }
  }
});

/* ✓ a tick drawn in one stroke, held, taken back from its tail;
   tap: wiped, then redrawn bold with a looped start and a flare at the tip */
var TICK = 'M16 56 C25 63 33 73 39 87 C50 58 68 30 89 12', FLOURISH = 'M24 40 C12 44 12 60 25 59 C33 58 37 72 41 88 C53 56 70 26 93 8';
D.add('check', {
  fam: 'classic', tags: ['done', 'yes', 'ok', 'correct', 'tick', 'complete', '✓', '✔'], loop: 2.4, still: 0.42, tapLen: 1.3, tapRest: 0.85, burst: false, margin: [24, 24, 14, 14],
  about: 'draws itself in one stroke, holds, then is taken back from its tail', tapAbout: 'wiped, then redrawn bold with a looped start and a flare at the tip',
  draw: function (p, t, s) {
    var tp = s.tap;
    if (tp < 0) {
      p.span(TICK, M.easeIn(M.seg(t, 0.64, 0.9)), M.easeOut(M.seg(t, 0, 0.26)), { ink: 'green', w: 2.3 });
      var g = M.seg(t, 0.26, 0.5); if (g > 0 && g < 1) glint(p, 90, 11, 7 * M.bump(g), 0.5, { ink: 'green', w: 0.8, cap: 'round' });
      return;
    }
    p.span(TICK, M.easeIn(M.seg(tp, 0, 0.12)), 1, { ink: 'green', w: 2.3 });
    p.draw(FLOURISH, M.easeOut(M.seg(tp, 0.12, 0.62)), { ink: 'green', w: 3.4 });
    var f = M.seg(tp, 0.6, 1);
    for (var j = 0; j < 5; j++) {
      var a = -2.35 + j * 0.55, r0 = 9 + 14 * M.easeIn(f), r1 = 9 + 14 * M.easeOut(f) * 1.0;
      if (f > 0 && f < 1) p.line(93 + Math.cos(a) * Math.min(r0, r1), 8 + Math.sin(a) * Math.min(r0, r1), 93 + Math.cos(a) * r1, 8 + Math.sin(a) * r1, { ink: 'green', w: 0.9, cap: 'round' });
    }
  }
});

/* ✗ a ballot cross made in two strokes, the second crossing the first, shimmying, then wiped in order;
   tap: it is lifted and slammed down like a stamp */
D.add('cross', {
  fam: 'classic', tags: ['no', 'close', 'wrong', 'cancel', 'delete', 'x', '✗', '✘'], loop: 2.2, still: 0.45, tapLen: 1.2, tapRest: 0.6, burst: false, margin: [18, 24, 24, 24],
  about: 'two crossing strokes, a shimmy, then wiped in the order they were drawn', tapAbout: 'lifted, slammed down like a stamp, with dust at the corners',
  draw: function (p, t, s) {
    var tp = s.tap, a = 'M22 22 C36 40 56 62 78 84', b = 'M80 18 C62 38 42 62 24 82';
    var u1 = M.easeOut(M.seg(t, 0, 0.16)), u2 = M.easeOut(M.seg(t, 0.14, 0.3)), g1 = M.easeIn(M.seg(t, 0.72, 0.82)), g2 = M.easeIn(M.seg(t, 0.8, 0.92));
    var shim = 0.05 * M.wave(t, 3) * M.bump(M.seg(t, 0.3, 0.72)), lift = 0, sq = 0;
    if (tp >= 0) { u1 = u2 = 1; g1 = g2 = 0; shim = 0; lift = M.easeOut(M.seg(tp, 0, 0.22)) * (1 - M.easeIn(M.seg(tp, 0.22, 0.36))); sq = M.bump(M.seg(tp, 0.34, 0.62)); }
    p.pivot(50, 50, shim, [1 + 0.5 * lift + 0.12 * sq, 1 + 0.5 * lift - 0.14 * sq], function () {
      p.span(a, g1, u1, { ink: 'red', w: 2.6 }); p.span(b, g2, u2, { ink: 'red', w: 2.6 });
    });
    if (tp >= 0.34 && tp < 0.7) {
      var d = M.seg(tp, 0.34, 0.7);
      [[10, 12, -1, -1], [90, 12, 1, -1], [10, 90, -1, 1], [90, 90, 1, 1]].forEach(function (c) { p.line(c[0] + c[2] * 4 * d, c[1] + c[3] * 4 * d, c[0] + c[2] * (4 + 9 * M.easeOut(d)), c[1] + c[3] * (4 + 9 * M.easeOut(d)), { w: 0.8, cap: 'round' }); });
    }
  }
});

/* a six-armed asterisk of club-shaped arms about (x, y), scale k, turned by rot; arms take their colours in turn */
var ARM = 'M-2 -4 C-4 -16 -7 -30 -5.5 -40 C-4.5 -47 7.5 -46 7 -39 C6.5 -30 4.5 -16 2.5 -4 Z';
function asterisk(p, x, y, k, rot, cols, len) {
  for (var j = 0; j < 6; j++) p.at(x, y, rot + j * TAU / 6, [k, k * (len ? len(j) : 1)], function () {
    p.path(ARM, { fill: cols[j % cols.length] });
    if (k > 0.8) p.path('M0.5 -12 C0 -22 0 -32 1 -40', { w: 0.4, detail: true });
  });
  p.circle(x, y, 6 * k, { fill: 'white', w: 0.9 });
}
/* ✱ six club-armed spokes, alternate colours, turning like a pinwheel in pulses with a ripple of length going round;
   tap: it spins up a full turn and flares */
D.add('asterisk', {
  fam: 'classic', tags: ['star', 'note', 'footnote', 'required', 'wildcard', 'pinwheel', '✱', '*'], loop: 3.2, still: 0.1, tapLen: 1.5, burst: 'spark', burstAt: [50, 50], burstN: 6, burstSpread: 6,
  about: 'turns like a pinwheel in pulses, a ripple of length going round the arms', tapAbout: 'spins up one full turn and flares',
  draw: function (p, t, s) {
    var tp = s.tap, extra = tp >= 0 ? TAU * M.easeOut(tp) : 0, flare = tp >= 0 ? 0.3 * M.bump(M.seg(tp, 0, 0.6)) : 0;
    asterisk(p, 50, 50, 1, TAU * t + 0.14 * M.wave(t, 6) + extra, ['b', 'a'], function (j) { return 1 + 0.09 * M.wave(t, 3, -j / 6) + flare; });
  }
});

/* ✿ a five-petal blossom, each petal swaying a beat after the one before, the bloom nodding;
   tap: it squeezes, blooms wide, turns a fifth, and petals drift off */
D.add('flower', {
  fam: 'classic', tags: ['bloom', 'spring', 'garden', 'blossom', 'cherry', 'nature', '✿', '❀'], loop: 3, still: 0.3, tapLen: 1.6, burst: 'petal', burstAt: [50, 50], burstN: 6, burstSpread: 6.28,
  about: 'petals sway one after another as the bloom nods', tapAbout: 'squeezes, blooms wide, turns a fifth; petals drift away',
  draw: function (p, t, s) {
    var tp = s.tap, k = 1 + 0.04 * M.wave(t, 2), turn = 0;
    if (tp >= 0) { k *= 1 - 0.16 * M.bump(M.seg(tp, 0, 0.2)) + 0.22 * M.bump(M.seg(tp, 0.2, 0.7)); turn = M.spring(M.seg(tp, 0.1, 0.8)) * TAU / 5; }
    p.at(50, 50, 0.06 * M.wave(t, 1) + turn, k, function () {
      p.move(-50, -50);
      for (var i = 0; i < 5; i++) {
        p.at(50, 50, i * TAU / 5 + 0.09 * M.wave(t, 1, -i / 5), [1, 1 + 0.05 * M.wave(t, 2, -i / 5)], function () {
          p.path('M0 -5 C-16 -10 -18 -36 -4 -42 C-2 -40 2 -40 4 -42 C18 -36 16 -10 0 -5 Z', { fill: 'pink' });
          p.path('M0 -12 C-1 -20 -1 -28 0 -34', { ink: 'rose', w: 0.5, detail: true });
        });
      }
      p.circle(50, 50, 8, { fill: 'yellow' });
      [[47, 49], [53, 47], [51, 54]].forEach(function (c) { p.dot(c[0], c[1], 1.1, 'brown'); });
    });
  }
});

/* ☀ a sun, twelve rays turning slowly with a pulse going round them;
   tap: the rays flare and the sun slides on a pair of sunglasses, then takes them off */
D.add('sun', {
  fam: 'classic', tags: ['weather', 'day', 'summer', 'bright', 'light', 'sunny', '☀', '☼'], loop: 6, still: 0.1, tapLen: 2, burst: false, margin: [22, 22, 20, 22],
  about: 'twelve rays turn slowly, a pulse of length going round them', tapAbout: 'rays flare; a pair of sunglasses drops on, then lifts away',
  draw: function (p, t, s) {
    var tp = s.tap, flare = tp >= 0 ? M.bump(M.seg(tp, 0, 0.45)) : 0, rot = TAU * t;
    for (var k = 0; k < 12; k++) {
      var br = 1 + 0.09 * M.wave(t, 3, -k / 12) + 0.28 * flare;
      p.at(50, 50, rot + k * TAU / 12, 1, function () {
        if (k % 2 === 0) p.path('M-6.5 -23 L0 ' + (-(24 + 19 * br)).toFixed(1) + ' L6.5 -23 Z', { fill: 'yellow', w: 0.9 });
        else p.line(0, -27, 0, -(27 + 8 * br), { w: 1.3, cap: 'round' });
      });
    }
    p.circle(50, 50, 20, { fill: 'a' });
    p.arc(50, 50, 13, -2.7, -1.7, { w: 0.6, ink: 'white', detail: true });
    if (tp >= 0) {
      var drop = -62 * (1 - M.spring(M.seg(tp, 0.05, 0.3))) - 70 * M.easeIn(M.seg(tp, 0.78, 1));
      p.at(50, 50 + drop, 0, 1, function () {
        p.move(-50, -50);
        p.path('M31 47 L69 47', { w: 1.1 });
        p.path('M33 46 C32 56 39 60 44 59 C49 58 50 52 49 47 Z', { fill: 'black', w: 0.8 });
        p.path('M67 46 C68 56 61 60 56 59 C51 58 50 52 51 47 Z', { fill: 'black', w: 0.8 });
        p.line(36, 50, 40, 47.5, { ink: 'white', w: 0.6, cap: 'round' }); p.line(59, 50, 63, 47.5, { ink: 'white', w: 0.6, cap: 'round' });
        p.path('M43 66 C47 69 54 69 58 65', { w: 0.8, detail: true });
      });
    }
  }
});

/* ♪ an eighth note hopping on a shadow, the flag trailing it, squashing as it lands;
   tap: a high spinning leap and a spray of notes */
D.add('note', {
  fam: 'classic', tags: ['music', 'song', 'sound', 'audio', 'play', 'tune', '♪', '♩'], loop: 1, still: 0.3, tapLen: 1.3, burst: 'note', burstAt: [48, 40], burstN: 8, burstSpread: 3.4, margin: [40, 18, 14, 18],
  about: 'hops on its shadow, the flag trailing, squashing on landing', tapAbout: 'a high spinning leap and a spray of notes',
  draw: function (p, t, s) {
    var tp = s.tap, ua = M.seg(t, 0, 0.62), h = 18 * 4 * ua * (1 - ua), v = ua > 0 && ua < 1 ? 4 * (1 - 2 * ua) : 0;
    var sq = 0.9 * M.bump(M.seg(t, 0.62, 0.86)) + 0.5 * M.bump(M.seg(t, 0.88, 1)), st = h / 18, spin = 0;
    if (tp >= 0) { var ut = M.seg(tp, 0, 0.7); h += 34 * 4 * ut * (1 - ut); sq += 1.1 * M.bump(M.seg(tp, 0.7, 0.95)); st += 0.6 * M.bump(ut); spin = TAU * M.ease(ut); v += ut > 0 && ut < 1 ? 4 * (1 - 2 * ut) : 0; }
    p.ellipse(46, 95, 16 * (1 - 0.3 * Math.min(1, h / 40)), 3.2, { fill: 'smoke', line: false, alpha: 0.8 });
    p.push(); p.move(0, -h);
    p.pivot(50, 90, 0, [1 + 0.16 * sq - 0.04 * st, 1 - 0.2 * sq + 0.08 * st], function () {
      p.pivot(46, 55, spin, 1, function () {
        p.ellipse(36, 76, 13, 9.5, { fill: 'ink', rot: -0.4 });
        p.line(47, 73, 47, 16, { w: 1.5 });
        p.pivot(47, 16, 0.1 * v, 1, function () { p.path('M47 16 C50 36 74 38 70 62 C66 50 56 48 47 44 Z', { fill: 'ink' }); });
      });
    });
    p.pop();
  }
});

/* ☞ the printer's pointing hand: a laced cuff, the back of the hand, three curled fingers, a thumb, and the one finger out.
   It nudges right twice a loop, the finger leading and the hand a beat behind; tap: it draws back and jabs */
D.add('manicule', {
  fam: 'classic', tags: ['point', 'this', 'look', 'next', 'see', 'hand', 'index', '☞', '👉'], loop: 1.6, ratio: 1.3, still: 0.1, tapLen: 1.1, tapRest: 0.42, burst: false, margin: [18, 26, 18, 14],
  about: 'nudges right twice a loop, the finger leading and the hand a beat behind', tapAbout: 'draws back, then jabs forward with a flurry of poke lines',
  draw: function (p, t, s) {
    function kick(q) { q = M.frac(q); return M.easeOut(M.seg(q, 0, 0.22)) * (1 - M.ease(M.seg(q, 0.22, 0.7))); }
    var ph = M.frac(t * 2), tp = s.tap, dx = 6 * kick(ph - 0.07), ext = 4 * kick(ph), j = 0, r = 0;
    if (tp >= 0) {
      var a = M.easeOut(M.seg(tp, 0, 0.2)); j = M.easeIn(M.seg(tp, 0.2, 0.33)); r = M.ease(M.seg(tp, 0.33, 0.8));
      dx += -9 * a * (1 - j) + 12 * j * (1 - r); ext += 5 * j * (1 - r);
    }
    p.push(); p.move(dx, 0);
    p.pivot(46, 36, -0.28, 1, function () { p.rect(44, 26, 27, 11.5, { fill: 'skin', r: 5.7 }); });
    p.path('M24 33 C34 30 45 31 56 35 L58 78 C46 83 34 82 24 78 Z', { fill: 'skin' });
    p.rect(52, 69, 19, 10.5, { fill: 'skin', r: 5.2 }); p.rect(52, 58.5, 23, 11, { fill: 'skin', r: 5.5 }); p.rect(52, 47.5, 27, 11.5, { fill: 'skin', r: 5.7 });
    p.rect(54, 35, 68 + ext, 12, { fill: 'skin', r: 6 });
    p.path('M' + (112 + ext) + ' 38 C' + (117 + ext) + ' 37.5 ' + (119 + ext) + ' 39.5 ' + (119 + ext) + ' 41.5', { w: 0.5, detail: true });
    p.path('M78 36 L78 38 M96 36 L96 38', { w: 0.45, detail: true });
    p.path('M5 30 L26 27 L26 83 L5 80 Z', { fill: 'white' });
    p.path('M20 27.8 L26 27 L26 83 L20 82.2 Z', { fill: 'b', w: 0.6 });
    p.path('M10.5 29.4 L10.5 80.6 M15.5 28.7 L15.5 81.3', { w: 0.45, detail: true });
    p.pop();
    if (tp >= 0.33 && tp < 0.75) {
      var d = M.seg(tp, 0.33, 0.75), tx = 126 + dx + ext;
      [-0.8, 0, 0.8].forEach(function (an) { p.line(tx + Math.cos(an) * (3 + 6 * d), 41 + Math.sin(an) * (3 + 6 * d), tx + Math.cos(an) * (3 + 6 * d + 9 * (1 - d)), 41 + Math.sin(an) * (3 + 6 * d + 9 * (1 - d)), { w: 0.9, cap: 'round' }); });
    }
  }
});

/* ✂ scissors snipping along a dashed cut line, the dashes marching into the blades;
   tap: one hard snip and the cut piece of line drops away, then the line grows back */
D.add('scissors', {
  fam: 'classic', tags: ['cut', 'snip', 'coupon', 'trim', 'edit', 'clip', 'crop', '✂'], loop: 1.4, ratio: 1.4, still: 0.08, tapLen: 1.5, tapRest: 0.9, burst: false, margin: [18, 18, 46, 18],
  about: 'snips twice a loop while the dashed line marches into the blades', tapAbout: 'one hard snip; the cut piece of line falls away and the line grows back',
  draw: function (p, t, s) {
    var ph = M.frac(t * 2), tp = s.tap, th = 0.04 + 0.4 * M.ease(M.seg(ph, 0, 0.5)) * (1 - M.easeIn(M.seg(ph, 0.55, 0.8)));
    function dashes(x0, x1) { for (var i = -1; i < 4; i++) { var xs = 98 + i * 14 - 14 * ph, a = Math.max(xs, x0), b = Math.min(xs + 8, x1); if (b - a > 0.8) p.line(a, 50, b, 50, { w: 1, cap: 'round' }); } }
    function half(sg) {
      p.pivot(34, 50, sg * th, [1, sg], function () {
        p.path('M26 44 C46 45.5 76 48.4 95 50 C76 51.8 46 54.5 26 56 Z', { fill: 'stone' });
        p.path('M31 47.6 C48 48.6 70 49.6 86 50', { ink: 'white', w: 0.5, detail: true });
        p.rect(21, 46, 11, 6, { fill: 'b' });
        p.ellipse(12, 46, 11, 7, { fill: 'b' }); p.ellipse(12, 46, 5.4, 3.4, { fill: 'bg', w: 0.8 });
      });
    }
    var cut = tp >= 0.24, fall = M.easeIn(M.seg(tp, 0.24, 0.72)), clipR = tp < 0 || tp < 0.24 ? 136 : 96 + 40 * M.easeOut(M.seg(tp, 0.55, 0.92));
    if (tp >= 0) { var o = M.ease(M.seg(tp, 0, 0.16)) * (1 - M.easeIn(M.seg(tp, 0.16, 0.26))); th = M.lerp(0.04 + 0.55 * o, th, M.ease(M.seg(tp, 0.7, 1))); }
    dashes(96, clipR);
    if (cut && fall < 1) { p.push(); p.move(0, 80 * fall); p.pivot(116, 50, 1.1 * fall, 1, function () { dashes(96, 136); }); p.pop(); }
    var c = M.seg(ph, 0.62, 1);
    if (tp < 0 && c > 0 && c < 1) p.at(98 + 5 * c, 50 + 24 * M.easeIn(c), 4 * c, 1 - c, function () { p.line(-3, 0, 3, 0, { w: 1, cap: 'round' }); });
    half(1); half(-1);
    p.circle(34, 50, 3.2, { fill: 'grey', w: 0.8 });
  }
});

/* ✎ a pencil writes a looping squiggle, flips over, and rubs it out with the eraser, then flips back;
   tap: it is sharpened: it shudders and curls of wood fall from the point */
function squig(u) { var f = TAU * 3 * u + Math.PI; return [6 + 40 * u - 6 * Math.sin(f), 76 - 8 * Math.cos(f)]; }
var SQUIG = []; for (var i = 0; i <= 90; i++) SQUIG.push(squig(i / 90));
D.add('pencil', {
  fam: 'classic', tags: ['write', 'edit', 'draw', 'note', 'pen', 'compose', '✎', '✏'], loop: 4, still: 0.43, tapLen: 1.3, tapRest: 0.55, burst: false, margin: [20, 24, 24, 12],
  about: 'writes a looping squiggle, flips, rubs it out with the eraser, flips back', tapAbout: 'sharpened: it shudders and curls of wood fall from the point',
  draw: function (p, t, s) {
    var tp = s.tap, w = M.ease(M.seg(t, 0, 0.5)), e = M.ease(M.seg(t, 0.62, 0.9)), m = M.ease(M.seg(t, 0.5, 0.6)) + M.ease(M.seg(t, 0.9, 1)), lift = 12 * M.bump(M.seg(t, 0.5, 0.6)) + 12 * M.bump(M.seg(t, 0.9, 1));
    var u = w * (1 - e), writing = (t < 0.5 || (t > 0.62 && t < 0.9)) ? 1 : 0, P = squig(u), rub = t > 0.62 && t < 0.9 ? 2.2 * M.wave(t, 14) : 0;
    P = [P[0] + rub, P[1]];
    p.span(SQUIG, 0, u, { w: 1.3 });
    var b = Math.pow(Math.sin(Math.PI * m / 2), 2), th = -0.785 + Math.PI * m + 0.03 * M.wave(t, 12) * writing, cx = P[0] + 26.9 - 2.2 * b, cy = P[1] - 26.9 + 2.2 * b - lift;
    if (tp >= 0) th += 0.06 * M.wave(tp, 9) * M.bump(M.seg(tp, 0, 0.7));
    p.at(cx, cy, th, 1, function () {
      p.rect(24, -6.5, 11, 13, { fill: 'pink', r: 3.5 });
      p.rect(18, -6.5, 7, 13, { fill: 'grey', w: 0.9 }); p.path('M20.2 -6.5 L20.2 6.5 M22.8 -6.5 L22.8 6.5', { w: 0.35, detail: true });
      p.rect(-18, -6.5, 36, 13, { fill: 'yellow' });
      p.path('M-17 -2 L17 -2 M-17 3 L17 3', { w: 0.4, detail: true });
      p.path('M-18 -6.5 L-33 -1.6 L-33 1.6 L-18 6.5 Z', { fill: 'sand' });
      p.path('M-33 -1.6 L-39 0 L-33 1.6 Z', { fill: 'black', w: 0.7 });
    });
    if (tp >= 0) {
      var tx = cx - 39 * Math.cos(th), ty = cy - 39 * Math.sin(th);
      for (var k = 0; k < 3; k++) {
        var q = M.seg(tp, 0.04 + k * 0.14, 0.64 + k * 0.14), fall = M.easeIn(M.seg(q, 0.3, 1));
        if (q > 0 && q < 1) p.at(tx + 3 + k * 5, ty + 2 + 38 * fall, 0.5 * k + 2.4 * fall, 1.5 - 1.0 * M.seg(q, 0.7, 1), function () { p.draw('M0 0 C5 -6 13 -3 10 3 C8 8 2 6 5 2', M.easeOut(M.seg(q, 0, 0.35)), { w: 0.8, ink: 'brown' }); });
      }
    }
  }
});

/* ✒ a fountain pen writes a swash, rests, then reels the ink back in as it retraces the line;
   tap: the pen lifts, a drop swells on the nib, falls, and splats into a blot that dries */
function swash(u) { var f = TAU * 2 * u + Math.PI; return [9 + 40 * u - 7 * Math.sin(f), 86 - 6 * Math.cos(f)]; }
var SWASH = []; for (var j = 0; j <= 70; j++) SWASH.push(swash(j / 70));
D.add('nib', {
  fam: 'classic', tags: ['write', 'sign', 'ink', 'author', 'blog', 'pen', 'calligraphy', '✒'], loop: 3.6, still: 0.45, tapLen: 1.9, tapRest: 0.6, burst: false, margin: [18, 20, 14, 14],
  about: 'writes a swash, rests, then reels the ink back as the pen retraces the line', tapAbout: 'the pen lifts, a drop swells and falls, and a blot splats and dries',
  draw: function (p, t, s) {
    var tp = s.tap, u = M.ease(M.seg(t, 0, 0.55)) * (1 - M.ease(M.seg(t, 0.66, 0.92))), lift = 6 * M.bump(M.seg(t, 0.55, 0.66)), writing = t < 0.55 || (t > 0.66 && t < 0.92) ? 1 : 0, T = swash(u);
    if (tp >= 0) lift += 14 * M.ease(M.seg(tp, 0, 0.15)) * (1 - M.ease(M.seg(tp, 0.72, 0.95)));
    p.span(SWASH, 0, u, { w: 1.5 });
    p.at(T[0], T[1] - lift, -1 + 0.03 * M.wave(t, 12) * writing, 1, function () {
      p.rect(48, -7.5, 36, 15, { fill: 'c', r: 5 });
      p.line(54, -3.5, 78, -3.5, { ink: 'white', w: 0.5, detail: true });
      p.rect(44, -7.8, 4.5, 15.6, { fill: 'a', w: 0.8 });
      p.path('M26 -7 L44 -6 L44 6 L26 7 Z', { fill: 'navy' });
      p.path('M0 0 C5 -2 14 -6 26 -7.5 L26 7.5 C14 6 5 2 0 0 Z', { fill: 'a' });
      p.path('M1 0 L13 0', { w: 0.45, detail: true }); p.dot(14, 0, 1.7, 'ink');
    });
    if (tp >= 0) {
      var by = 93, y0 = T[1] - lift, swell = M.easeOut(M.seg(tp, 0.05, 0.2)), fall = M.easeIn(M.seg(tp, 0.2, 0.44)), splat = M.spring(M.seg(tp, 0.44, 0.62)) * (1 - M.easeIn(M.seg(tp, 0.82, 1)));
      if (tp < 0.44) p.at(T[0], y0 + 2 + (by - y0 - 4) * fall, 0, 0.5 + 0.5 * swell, function () { p.path('M0 -5 C4 -1 4.4 3.2 0 4.6 C-4.4 3.2 -4 -1 0 -5 Z', { fill: 'ink' }); });
      if (splat > 0.02) {
        p.blob(T[0], by - 1, 9 * splat, { fill: 'ink', sy: 0.5, lumpy: 0.2, seed: 5 });
        [[-1, -0.7], [1, -0.9], [-0.4, -1.2], [0.5, -1.1]].forEach(function (q, i) { var d = M.seg(tp, 0.44, 0.7); p.dot(T[0] + q[0] * 13 * M.easeOut(d), by + q[1] * 12 * M.bump(d) - 1, 1.5 * splat, 'ink'); });
      }
    }
  }
});

/* ✉ an envelope hopping, the flap lifting a hair each time it lands;
   tap: the flap opens and a letter with a heart slides up, then it slides back and the flap closes */
D.add('envelope', {
  fam: 'classic', tags: ['mail', 'email', 'letter', 'message', 'post', 'contact', 'inbox', '✉', '📧'], loop: 1.6, still: 0.2, tapLen: 2.2, tapRest: 0.45, burst: false, margin: [30, 14, 14, 14],
  about: 'hops twice, the flap lifting a hair when it lands', tapAbout: 'the flap opens and a letter with a heart slides up, then tucks back in',
  draw: function (p, t, s) {
    var tp = s.tap, idle = tp < 0 ? 1 : Math.max(1 - M.ease(M.seg(tp, 0, 0.12)), M.ease(M.seg(tp, 0.88, 1)));
    var ua = M.seg(t, 0, 0.45), ub = M.seg(t, 0.6, 0.88), hop = idle * (11 * 4 * ua * (1 - ua) + 4 * 4 * ub * (1 - ub)), sq = idle * (M.bump(M.seg(t, 0.45, 0.62)) + 0.5 * M.bump(M.seg(t, 0.88, 1)));
    var open = idle * 0.12 * M.bump(M.seg(t, 0.45, 0.7)), lift = 0, tilt = idle * 0.06 * M.wave(t, 1);
    if (tp >= 0) { open += M.ease(M.seg(tp, 0.04, 0.22)) * (1 - M.ease(M.seg(tp, 0.78, 0.95))); lift = M.easeOut(M.seg(tp, 0.16, 0.5)) * (1 - M.easeIn(M.seg(tp, 0.62, 0.8))); }
    var ap = 34 + 32 * Math.cos(Math.PI * Math.min(1, open));
    p.push(); p.move(0, -hop);
    p.pivot(50, 88, tilt, [1 + 0.1 * sq, 1 - 0.12 * sq], function () {
      p.rect(8, 32, 84, 56, { fill: 'cream' });
      if (open > 0.5) p.poly([[8, 32], [92, 32], [50, ap]], { fill: 'sand' });
      if (lift > 0.005) {
        var top = 46 - 54 * lift;
        p.pivot(50, top + 25, 0.07 * lift * M.wave(tp, 2), 1, function () {
          p.rect(20, top, 60, 50, { fill: 'white', w: 0.9 });
          p.path('M50 ' + (top + 26) + ' C38 ' + (top + 17) + ' 40 ' + (top + 7) + ' 50 ' + (top + 12) + ' C60 ' + (top + 7) + ' 62 ' + (top + 17) + ' 50 ' + (top + 26) + ' Z', { fill: 'b', w: 0.8 });
          p.path('M28 ' + (top + 34) + ' L72 ' + (top + 34) + ' M28 ' + (top + 40) + ' L62 ' + (top + 40), { w: 0.4, detail: true });
        });
      }
      p.poly([[8, 34], [50, 66], [92, 34], [92, 88], [8, 88]], { fill: 'cream' });
      p.path('M8 88 L38 57 M92 88 L62 57', { w: 0.5, detail: true });
      if (open <= 0.5) {
        p.poly([[8, 32], [92, 32], [50, ap]], { fill: 'cream' });
        p.at(50, ap - 8, 0, 1, function () { p.path('M0 5 C-8 -1 -6 -8 0 -4 C6 -8 8 -1 0 5 Z', { fill: 'b', w: 0.7, detail: true }); });
      }
    });
    p.pop();
  }
});

/* ☎ a rotary telephone ringing in two bursts, shaking on its base, the handset rattling a beat behind, sound arcs drawn out and taken back;
   tap: the handset lifts off and talk-lines come out of it, then it is hung back up with a bounce */
D.add('telephone', {
  fam: 'classic', tags: ['call', 'phone', 'contact', 'ring', 'support', 'dial', 'voice', '☎', '☏'], loop: 1.6, still: 0.1, tapLen: 1.8, tapRest: 0.45, burst: false, margin: [26, 24, 14, 24],
  about: 'rings in two bursts: the base shakes, the handset rattles, sound arcs come and go', tapAbout: 'answers: the handset lifts off with talk-lines, then is hung back up with a bounce',
  draw: function (p, t, s) {
    var tp = s.tap, w = M.frac(t * 2), env = tp < 0 ? M.bump(M.seg(w, 0, 0.75)) : 0, shake = env * M.wave(t, 12), rat = -2.4 * Math.max(0, M.wave(t, 12, 0.18)) * env, h = 0;
    if (tp >= 0) { h = M.easeOut(M.seg(tp, 0, 0.2)) * (1 - M.easeIn(M.seg(tp, 0.78, 0.92))); rat -= 2.5 * M.bump(M.seg(tp, 0.92, 1)); }
    p.pivot(50, 90, 0.035 * shake, 1, function () {
      p.move(0.8 * shake, 0);
      var ca = 0.3 * h, bx = 50 + 38 * Math.cos(ca) - 8 * Math.sin(ca), by = 40 + 38 * Math.sin(ca) + 8 * Math.cos(ca) + rat - 26 * h, cord = [];
      for (var ci = 0; ci <= 26; ci++) { var cu = ci / 26; cord.push([M.lerp(86, bx, cu) + 12 * Math.sin(Math.PI * cu) * (1 - h) + 2.2 * Math.sin(TAU * 9 * cu), M.lerp(72, by, cu) + 6 * Math.sin(Math.PI * cu) * (1 - h)]); }
      p.curve(cord, { w: 0.7 });
      p.path('M12 90 C12 80 14 64 22 56 C34 62 66 62 78 56 C86 64 88 80 88 90 Z', { fill: 'red' });
      p.circle(50, 76, 13.5, { fill: 'cream' }); p.circle(50, 76, 3.2, { w: 0.5, detail: true });
      for (var k = 0; k < 9; k++) { var a = 0.7 + k * 0.62; p.dot(50 + 8.4 * Math.cos(a), 76 + 8.4 * Math.sin(a), 1.25, 'ink'); }
      p.rect(24, 44, 6, 14, { fill: 'black', w: 0.8 }); p.rect(70, 44, 6, 14, { fill: 'black', w: 0.8 });
      p.pivot(50, 40, 0.3 * h, 1, function () {
        p.move(0, rat - 26 * h);
        p.path('M10 48 C6 36 18 28 32 33 L68 33 C82 28 94 36 90 48 C88 52 80 52 78 47 C76 43 70 43 66 42 L34 42 C30 43 24 43 22 47 C20 52 12 52 10 48 Z', { fill: 'red' });
        p.path('M20 33 C24 31 28 31 32 33', { ink: 'white', w: 0.6, detail: true });
      });
    });
    if (tp < 0) {
      [[0, 0], [0.06, 1]].forEach(function (sd) {
        ['M12 26 C4 32 4 46 12 52', 'M6 20 C-4 28 -4 50 6 58'].forEach(function (d, k) {
          var v = M.seg(w - sd[0], 0, 0.75), u1 = M.easeOut(M.seg(v, k * 0.14, 0.45 + k * 0.14)), u0 = M.easeIn(M.seg(v, 0.5 + k * 0.14, 1));
          if (sd[1]) d = d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, function (m, x, y) { return (100 - x) + ' ' + y; });
          p.span(d, u0, u1, { w: 0.8 });
        });
      });
    } else if (h > 0.05) {
      for (var q = 0; q < 3; q++) {
        var v = M.frac(tp * 2.4 + q / 3), r = 10 + 14 * v, lead = 2.5 + 1.3 * M.easeIn(v) * 0.5; p.arc(14, 33 - 26 * h, r, lead + 0.4 * M.easeIn(v), 3.8 + 0.2 * v, { w: 0.8 });
      }
    }
  }
});

/* ✈ a plane flies a lazy figure eight, banking through the turns, a contrail looping behind it;
   tap: a fast victory lap of the same path with two barrel rolls */
D.add('airplane', {
  fam: 'classic', tags: ['travel', 'flight', 'fly', 'trip', 'send', 'airport', 'holiday', '✈'], loop: 2.8, still: 0, tapLen: 1.4, tapRest: 0.9, burst: false,
  about: 'flies a lazy figure eight, banking through the turns, a contrail looping behind', tapAbout: 'a fast victory lap of the path with two barrel rolls',
  draw: function (p, t, s) {
    var tp = s.tap;
    function lap(q) { return q <= 0 ? 0 : M.ease(Math.min(q, 1)); }
    function pos(tt) { var a = TAU * tt; return [50 + 24 * Math.sin(a), 52 - 17 * Math.sin(2 * a)]; }
    var tt = t + lap(tp), e = 0.012, a = pos(tt - e), b = pos(tt), c = pos(tt + e);
    var h1 = Math.atan2(b[1] - a[1], b[0] - a[0]), h2 = Math.atan2(c[1] - b[1], c[0] - b[0]), bank = M.clamp(Math.atan2(Math.sin(h2 - h1), Math.cos(h2 - h1)) * 5, -1, 1);
    var ws = Math.cos(0.9 * Math.abs(bank)) * (tp >= 0 ? Math.cos(TAU * 2 * M.seg(tp, 0.05, 0.9)) : 1);
    ws = (ws < 0 ? -1 : 1) * Math.max(0.24, Math.abs(ws));
    var trail = []; for (var k = 3; k < 32; k++) trail.push(pos(t - k * 0.011 + lap(tp - k * 0.022)));
    p.curve(trail, { w: 0.7, wob: 0.4 });
    p.at(b[0], b[1], h1 + (h2 - h1) / 2, 1.15, function () {
      p.at(0, 0, 0, [1, ws], function () {
        p.path('M8 -3 L-6 -28 L-13 -28 L-7 -3 Z', { fill: 'sky' }); p.path('M8 3 L-6 28 L-13 28 L-7 3 Z', { fill: 'sky' });
        p.path('M-17 -2 L-24 -11 L-28 -11 L-24 -2 Z', { fill: 'sky', w: 0.8 }); p.path('M-17 2 L-24 11 L-28 11 L-24 2 Z', { fill: 'sky', w: 0.8 });
      });
      p.path('M24 0 C18 -3.8 -8 -4.2 -22 -1.8 L-26 0 L-22 1.8 C-8 4.2 18 3.8 24 0 Z', { fill: 'white' });
      p.path('M13 -1.3 C16 -1.3 19 -0.6 20.5 0 C19 0.6 16 1.3 13 1.3 Z', { fill: 'navy', w: 0.5, detail: true });
    });
  }
});

/* ❄ a six-armed snowflake turning once per loop, the spine growing out, then branches, then the tips, then taken back in reverse, each arm a beat behind the last;
   tap: it grows full, spins up a third of a turn more, and ice glints fly off */
D.add('snowflake', {
  fam: 'classic', tags: ['winter', 'cold', 'snow', 'frost', 'ice', 'christmas', 'freeze', '❄', '❅'], loop: 6, still: 0.45, tapLen: 1.6, tapRest: 0.6, burst: false, margin: [14, 14, 14, 14],
  about: 'turns once a loop while the spines, branches and tips grow out and are taken back in', tapAbout: 'grows full, spins up another third of a turn; ice glints fly off',
  draw: function (p, t, s) {
    var tp = s.tap, rot = TAU * t + (tp >= 0 ? TAU / 3 * M.easeOut(tp) : 0), mx = tp >= 0 ? M.ease(M.seg(tp, 0, 0.25)) * (1 - M.ease(M.seg(tp, 0.75, 1))) : 0, pulse = tp >= 0 ? 0.1 * M.bump(M.seg(tp, 0.1, 0.6)) : 0;
    for (var k = 0; k < 6; k++) {
      var q = M.frac(t - k * 0.012);
      var grow = function (a, b, c, d) { return M.lerp(M.ease(M.seg(q, a, b)) * (1 - M.ease(M.seg(q, c, d))), 1, mx) + pulse; };
      var g0 = M.lerp(0.35 + 0.65 * M.ease(M.seg(q, 0, 0.2)) * (1 - M.ease(M.seg(q, 0.85, 1))), 1, mx) + pulse, g1 = grow(0.12, 0.35, 0.8, 0.92), g2 = grow(0.28, 0.5, 0.74, 0.86), g3 = grow(0.42, 0.6, 0.68, 0.8);
      p.at(50, 50, rot + k * TAU / 6, 1, function () {
        var T = -4 - 38 * g0, y1 = -4 - 38 * g0 * 0.42, y2 = -4 - 38 * g0 * 0.72, l1 = 13 * g1 * 0.72, l2 = 10 * g2 * 0.72, l3 = 5 * g3;
        p.line(0, -4, 0, T, { ink: 'blue', w: 1.3 });
        p.path('M' + (-l1) + ' ' + (y1 - l1) + ' L0 ' + y1 + ' L' + l1 + ' ' + (y1 - l1), { ink: 'blue' });
        p.path('M' + (-l2) + ' ' + (y2 - l2) + ' L0 ' + y2 + ' L' + l2 + ' ' + (y2 - l2), { ink: 'blue' });
        p.path('M' + (-l3) + ' ' + (T + 8 - l3) + ' L0 ' + (T + 8) + ' L' + l3 + ' ' + (T + 8 - l3), { ink: 'blue', w: 0.9 });
      });
    }
    p.poly([[50, 42], [57, 46], [57, 54], [50, 58], [43, 54], [43, 46]], { fill: 'sky', ink: 'blue', w: 0.9 });
    if (tp >= 0) for (var j = 0; j < 6; j++) { var u = M.seg(tp, 0.1, 0.9), a = j * TAU / 6 + 0.52, r = 40 + 12 * M.easeOut(u); glint(p, 50 + Math.cos(a) * r, 50 + Math.sin(a) * r, 5 * M.bump(u), 0.4, { ink: 'blue', w: 0.8, cap: 'round' }); }
  }
});

/* ☂ an umbrella with rain drumming on the canopy, each drop splashing where it lands, the canopy bobbing;
   tap: it snaps shut, then pops open, shaking drops off */
D.add('umbrella', {
  fam: 'classic', tags: ['rain', 'weather', 'wet', 'cover', 'insurance', 'protect', 'shelter', '☂', '☔'], loop: 1.2, still: 0.3, tapLen: 1.6, tapRest: 0.95, burst: 'drop', burstAt: [50, 30], burstN: 8, burstSpread: 3.6,
  about: 'rain drums on the canopy and splashes off it; the canopy bobs', tapAbout: 'snaps shut, then pops open and shakes the water off',
  draw: function (p, t, s) {
    var tp = s.tap, w = tp < 0 ? 1 : tp < 0.45 ? 1 - 0.78 * M.easeIn(M.seg(tp, 0, 0.2)) : 0.22 + 0.78 * M.spring(M.seg(tp, 0.45, 0.85)), tall = 1 + 0.1 * (1 - w);
    p.line(50, 22, 50, 88, { w: 1.4 }); p.path('M50 86 C50 98 36 98 36 88', { w: 1.6 });
    p.pivot(50, 58, 0.03 * M.wave(t, 2), [w, tall], function () {
      for (var j = 0; j < 4; j++) {
        var x0 = 8 + j * 21, x1 = x0 + 21, xm = (x0 + x1) / 2;
        p.path('M50 22 C' + (50 + (x0 - 50) * 0.55) + ' 22 ' + x0 + ' 36 ' + x0 + ' 58 Q' + xm + ' 50 ' + x1 + ' 58 C' + x1 + ' 36 ' + (50 + (x1 - 50) * 0.55) + ' 22 50 22 Z', { fill: j % 2 ? 'cream' : 'b' });
      }
      p.line(50, 22, 50, 15, { w: 1.4, cap: 'round' });
    });
    [[6, 0], [19, 0.37], [31, 0.12], [44, 0.62], [57, 0.25], [69, 0.75], [82, 0.5], [95, 0.87]].forEach(function (d) {
      var ph = M.frac(2 * t + d[1]), dx = (d[0] - 50) / (42 * w), land = Math.abs(dx) < 1 ? 58 - 36 * tall * Math.sqrt(1 - dx * dx) : 108, f = M.seg(ph, 0, 0.8), y = -16 + (land + 16) * f * f;
      if (f < 1) p.line(d[0] - 1.5, y - 8, d[0], y, { ink: 'blue', w: 0.8 });
      else if (land < 100) { var sp = M.seg(ph, 0.8, 1); [-2.3, -0.8].forEach(function (a) { p.line(d[0] + Math.cos(a) * (2 + 5 * sp), land + Math.sin(a) * (2 + 5 * sp), d[0] + Math.cos(a) * (2 + 5 * sp + 4 * (1 - sp)), land + Math.sin(a) * (2 + 5 * sp + 4 * (1 - sp)), { ink: 'blue', w: 0.7, cap: 'round' }); }); }
    });
  }
});

/* ➜ a swoosh of an arrow: a ribbon with a wave running down it into the head, which wags with the wave;
   tap: it shoots off to the right, shrinking into the distance, and comes back from the left */
D.add('arrow', {
  fam: 'classic', tags: ['next', 'go', 'forward', 'right', 'continue', 'direction', 'more', '➜', '→'], loop: 1.4, ratio: 1.4, still: 0.2, tapLen: 1.2, tapRest: 0.95, burst: false, margin: [18, 18, 18, 18],
  about: 'a wave runs down the ribbon into the head, which wags with it', tapAbout: 'shoots off to the right, shrinking, and comes back in from the left',
  draw: function (p, t, s) {
    var tp = s.tap, off = 0, k = 1;
    if (tp >= 0) { if (tp < 0.4) { var e = M.easeIn(M.seg(tp, 0, 0.4)); off = 190 * e; k = 1 - 0.75 * e; } else { var r = M.easeOut(M.seg(tp, 0.4, 0.95)); off = -190 * (1 - r); k = 0.25 + 0.75 * r; } }
    function cy(x) { return 50 + 8 * (1 - (x - 6) / 108) * Math.sin(TAU * (x / 50 - t)); }
    var up = [], dn = [], xe = 104, i, x, y, d, n;
    for (i = 0; i <= 28; i++) {
      x = 6 + (xe - 6) * i / 28; y = cy(x); d = Math.atan2(cy(x + 0.5) - cy(x - 0.5), 1); n = [-Math.sin(d), Math.cos(d)];
      var hw = 1.6 + 5 * i / 28; up.push([x + n[0] * hw, y + n[1] * hw]); dn.push([x - n[0] * hw, y - n[1] * hw]);
    }
    var E = [xe, cy(xe)], psi = Math.atan2(cy(xe + 0.5) - cy(xe - 0.5), 1), dv = [Math.cos(psi), Math.sin(psi)], nv = [-dv[1], dv[0]];
    var head = [[E[0] - nv[0] * 6.6 + dv[0] * 2, E[1] - nv[1] * 6.6 + dv[1] * 2], [E[0] - nv[0] * 16, E[1] - nv[1] * 16], [E[0] + dv[0] * 27, E[1] + dv[1] * 27], [E[0] + nv[0] * 16, E[1] + nv[1] * 16], [E[0] + nv[0] * 6.6 + dv[0] * 2, E[1] + nv[1] * 6.6 + dv[1] * 2]];
    p.pivot(125, 50, 0, k, function () {
      p.move(off, 0);
      p.poly(up.concat(head, dn.slice().reverse()), { fill: 'b' });
      if (tp >= 0 && tp < 0.4) for (var q = 0; q < 3; q++) p.line(-34 - q * 8, 36 + q * 14, -4 - q * 4, 36 + q * 14, { w: 0.8 });
    });
  }
});

/* ❧ the ivy-leaf fleuron: a heart-shaped leaf on a tendril that coils and uncoils (the curl is a curvature, so it unwinds the way a fern does),
   the leaf swaying a beat ahead of the curl; tap: the tendril whips straight and snaps back tighter, a bud leaf pops, leaves fly */
function ivy(p, fill) {
  p.path('M0 0 C-8 -14 -4 -32 12 -30 C28 -28 40 -14 52 0 C40 14 28 28 12 30 C-4 32 -8 14 0 0 Z', { fill: fill || 'leaf' });
  p.path('M0 0 L46 0 M14 0 L26 -12 M14 0 L26 12 M30 0 L38 -7 M30 0 L38 7', { w: 0.45, detail: true });
}
D.add('hedera', {
  fam: 'classic', tags: ['leaf', 'ivy', 'divider', 'ornament', 'garden', 'end', 'nature', '❧', '☙'], loop: 4, ratio: 1.2, still: 0.3, tapLen: 1.5, burst: 'leaf', burstAt: [92, 44], burstN: 5, burstSpread: 3, margin: [14, 22, 14, 14],
  about: 'the tendril coils and uncoils like a fern while the leaf sways a beat ahead', tapAbout: 'the tendril whips straight and snaps back tighter; a bud leaf pops; leaves fly',
  draw: function (p, t, s) {
    var tp = s.tap, c = 0.75 + 0.25 * M.wave(t, 1, 0.25), sway = 0.05 * M.wave(t, 1, 0), bud = 0.3;
    if (tp >= 0) { c = c * (1 - M.bump(M.seg(tp, 0, 0.45))) + 0.3 * M.bump(M.seg(tp, 0.45, 1)); sway += 0.1 * M.wave(tp, 4) * M.bump(tp); bud *= 1 + 0.6 * M.bump(M.seg(tp, 0.1, 0.7)); }
    var x = 64, y = 52, a = Math.PI, n = 40, pts = [[x, y]], ang = [a];
    for (var i = 1; i <= n; i++) { var u = i / n; a += c * 0.22 * u * u * 2.3; x += Math.cos(a) * 2.3; y += Math.sin(a) * 2.3; pts.push([x, y]); ang.push(a); }
    p.pivot(64, 52, sway, 1, function () {
      p.curve(pts, { w: 1.5 });
      p.at(pts[14][0], pts[14][1], ang[14] - 1.0, bud, function () { ivy(p); });
      p.at(64, 52, 0, 0.62, function () { ivy(p); });
    });
  }
});

/* ⁂ three asterisks in a triangle, orbiting the middle and each turning on its own, one colour apiece;
   tap: they fly out wide, spin a full turn about the middle and fall back in */
D.add('asterism', {
  fam: 'classic', tags: ['section', 'break', 'divider', 'stars', 'three', 'footnote', 'group', '⁂'], loop: 4, still: 0, tapLen: 1.4, tapRest: 0.95, burst: false,
  about: 'three asterisks orbit the middle, each turning on its own', tapAbout: 'they fly out wide, swing a full turn round the middle and fall back in',
  draw: function (p, t, s) {
    var tp = s.tap, R = 25 + (tp >= 0 ? 14 * M.bump(M.seg(tp, 0, 0.75)) : 0), orb = TAU * t + (tp >= 0 ? TAU * M.easeOut(tp) : 0);
    ['a', 'b', 'c'].forEach(function (c, k) {
      var an = -Math.PI / 2 + orb + k * TAU / 3;
      asterisk(p, 50 + R * Math.cos(an), 55 + R * Math.sin(an), 0.42 * (1 + 0.1 * M.wave(t, 3, k / 3)), -2 * TAU * t + k * 0.5 + (tp >= 0 ? TAU * M.easeOut(tp) : 0), [c]);
    });
  }
});

/* ¶ the pilcrow inked: the bowl and two stems drawn, the bowl scribbled in, held, then taken back stroke by stroke;
   tap: the bowl floods solid from the stem outward and two drips run off the bottom */
var PIL_BOWL = 'M64 14 L38 14 C22 14 12 24 12 36 C12 48 22 58 38 58 L46 58', ZIG = [];
for (var zi = 0; zi < 17; zi++) { var zy = 17 + zi * 2.3, zl = 38 - 26 * Math.sqrt(Math.max(0, 1 - Math.pow((zy - 36) / 22, 2))) + 2; ZIG.push([zi % 2 ? 44 : zl, zy]); }
D.add('pilcrow', {
  fam: 'classic', tags: ['paragraph', 'text', 'write', 'edit', 'section', 'type', 'format', '¶'], loop: 3.2, still: 0.7, tapLen: 1.4, tapRest: 0.5, burst: false, margin: [14, 18, 22, 18],
  about: 'the bowl and stems are drawn, the bowl scribbled in, then taken back stroke by stroke', tapAbout: 'the bowl floods solid from the stem outward; two drips run off the bottom',
  draw: function (p, t, s) {
    function st(a, b) { return M.ease(M.seg(t, a, b)); }
    p.span(PIL_BOWL, st(0.9, 0.98), st(0, 0.12), { w: 1.8 });
    p.span('M46 14 L46 88', st(0.86, 0.94), st(0.1, 0.2), { w: 1.8 });
    p.span('M64 14 L64 88', st(0.82, 0.9), st(0.18, 0.28), { w: 1.8 });
    p.span(ZIG, st(0.76, 0.86), st(0.26, 0.6), { w: 1 });
    var tp = s.tap;
    if (tp >= 0) {
      var f = M.spring(M.seg(tp, 0, 0.3)) * (1 - M.ease(M.seg(tp, 0.72, 1)));
      if (f > 0.02) p.pivot(46, 36, 0, [f, 1], function () { p.path('M46 14 L38 14 C22 14 12 24 12 36 C12 48 22 58 38 58 L46 58 Z', { fill: 'ink', w: 1.6 }); });
      [[30, 0], [20, 0.12]].forEach(function (d) {
        var q = M.seg(tp, 0.2 + d[1], 0.75 + d[1]);
        if (q > 0 && q < 1) p.at(d[0], 60 + 32 * M.easeIn(q), 0, (0.5 + 0.5 * M.easeOut(M.seg(q, 0, 0.25))) * (1 - 0.8 * M.seg(q, 0.85, 1)), function () { p.path('M0 -5 C4 -1 4.4 3.2 0 4.6 C-4.4 3.2 -4 -1 0 -5 Z', { fill: 'ink' }); });
      });
    }
  }
});

/* ‽ the interrobang, a ? hook and a ! bar drawn together; the hook is taken back to leave !, redrawn, then the bar is taken back to leave ?,
   the dot hopping at each change; tap: a double-take shake with shock lines and a high dot hop */
var HOOK = 'M25 30 C23 6 77 4 75 28 C74 42 56 44 50 52 L50 64', BAR = 'M50 6 L50 64';
D.add('interrobang', {
  fam: 'classic', tags: ['what', 'surprise', 'question', 'really', 'huh', 'wow', 'punctuation', '‽', '?!'], loop: 3.2, still: 0.62, tapLen: 1.3, tapRest: 0.6, burst: false, margin: [20, 22, 14, 22],
  about: 'the hook is taken back to leave !, redrawn, then the bar is taken back to leave ?; the dot hops at each change', tapAbout: 'a double-take shake with shock lines and a high hop of the dot',
  draw: function (p, t, s) {
    function st(a, b) { return M.ease(M.seg(t, a, b)); }
    var tp = s.tap, pop = M.bump(M.seg(t, 0.28, 0.42)) + M.bump(M.seg(t, 0.55, 0.68)) + M.bump(M.seg(t, 0.8, 0.94)) + M.bump(M.seg(t, 0.94, 1.0)) * 0.5, rot = 0.04 * M.wave(t, 2), k = 1;
    if (tp >= 0) { rot += 0.2 * Math.exp(-4 * tp) * Math.sin(TAU * 3 * tp); k += 0.12 * M.bump(M.seg(tp, 0, 0.3)); pop += 2.2 * M.bump(M.seg(tp, 0.1, 0.5)); }
    p.pivot(50, 60, rot, k, function () {
      if (t < 0.45) p.span(HOOK, st(0.18, 0.3), 1, { w: 2.2 }); else p.span(HOOK, 0, st(0.45, 0.57), { w: 2.2 });
      if (t < 0.9) p.span(BAR, st(0.7, 0.82), 1, { w: 2.2 }); else p.span(BAR, 0, st(0.92, 1), { w: 2.2 });
      p.dot(50, 84 - 6 * pop, 4.8, 'ink');
    });
    if (tp >= 0) {
      var u = M.seg(tp, 0.05, 0.7);
      [-2.9, -2.4, -1.9, -1.24, -0.74, -0.24].forEach(function (a) {
        var r0 = 38 + 12 * M.easeIn(u), r1 = 38 + 12 * M.easeOut(u);
        if (r1 - r0 > 0.8) p.line(50 + Math.cos(a) * r0, 40 + Math.sin(a) * r0, 50 + Math.cos(a) * r1, 40 + Math.sin(a) * r1, { w: 0.9, cap: 'round' });
      });
    }
  }
});

/* ⚓ an anchor on its rope swinging from above, the rope bending behind the swing and the anchor a hair late;
   tap: it is let go, plunges, splashes into rings and is hauled back up */
D.add('anchor', {
  fam: 'classic', tags: ['sea', 'ship', 'boat', 'hold', 'stay', 'harbour', 'sailor', 'port', '⚓'], loop: 2.8, still: 0.1, tapLen: 2, tapRest: 0.95, burst: false, margin: [42, 22, 34, 22],
  about: 'swings on its rope, the rope bending behind and the anchor a hair late', tapAbout: 'dropped: it plunges, rings spread out where it hits, and it is hauled back up',
  draw: function (p, t, s) {
    var tp = s.tap, d = 0;
    if (tp >= 0) d = 30 * M.easeIn(M.seg(tp, 0, 0.28)) * (1 - M.ease(M.seg(tp, 0.6, 0.98))) - 5 * M.bump(M.seg(tp, 0.28, 0.46));
    p.pivot(50, -18, 0.2 * M.wave(t, 1), 1, function () {
      p.path('M50 -18 Q' + (50 - 7 * M.wave(t, 1, 0.25)) + ' ' + (-4 + d / 2) + ' 50 ' + (7 + d), { w: 1.2 });
      p.pivot(50, 12 + d, 0.07 * M.wave(t, 1, 0.3), 1, function () {
        p.move(0, d);
        p.circle(50, 13, 5.5, { w: 1.3 });
        p.line(35, 26, 65, 26, { w: 2, cap: 'round' }); p.dot(35, 26, 2.6, 'ink'); p.dot(65, 26, 2.6, 'ink');
        p.line(50, 19, 50, 86, { w: 2 });
        p.path('M17 60 C19 80 34 90 50 90 C66 90 81 80 83 60', { w: 2 });
        p.path('M9 66 L17 51 L25 67 Z', { fill: 'ink', w: 0.8 }); p.path('M91 66 L83 51 L75 67 Z', { fill: 'ink', w: 0.8 });
      });
    });
    if (tp >= 0.2 && tp < 0.8) {
      var u = M.seg(tp, 0.2, 0.8);
      [0, 0.25].forEach(function (o) {
        var v = M.seg(u, o, 0.75 + o), rx = 6 + 30 * M.easeOut(v), ry = rx * 0.3;
        p.span('M' + (50 - rx) + ' 104 A' + rx + ' ' + ry + ' 0 1 1 ' + (50 + rx) + ' 104 A' + rx + ' ' + ry + ' 0 1 1 ' + (50 - rx) + ' 104', M.easeIn(M.seg(v, 0.45, 1)), M.easeOut(M.seg(v, 0, 0.5)), { w: 0.8 });
      });
    }
  }
});

/* ♛ a crown with pearl-tipped points and three jewels, a glint going from point to point;
   tap: it tips jaunty to one side with a hop, three sparkles pop, and it settles back */
D.add('crown', {
  fam: 'classic', tags: ['king', 'queen', 'royal', 'best', 'premium', 'winner', 'vip', 'leader', '♛', '♔'], loop: 2.4, still: 0.3, tapLen: 1.5, tapRest: 0.5, burst: false, margin: [20, 20, 14, 20],
  about: 'a glint travels from point to point and the jewels catch it', tapAbout: 'tips jaunty with a hop, three sparkles pop, then it settles back',
  draw: function (p, t, s) {
    var tp = s.tap, tilt = 0, hop = 0;
    if (tp >= 0) { tilt = 0.26 * M.spring(M.seg(tp, 0, 0.35)) * (1 - M.ease(M.seg(tp, 0.72, 1))); hop = 7 * M.bump(M.seg(tp, 0, 0.25)); }
    p.pivot(20, 88, tilt, 1, function () {
      p.move(0, -hop);
      p.path('M16 86 L10 36 C16 42 26 52 32 58 C38 46 44 34 50 24 C56 34 62 46 68 58 C74 52 84 42 90 36 L84 86 Z', { fill: 'a' });
      p.path('M14 71 L86 71', { w: 0.9 });
      [[10, 32, 4.5, 'white'], [50, 20, 5.5, 'white'], [90, 32, 4.5, 'white'], [28, 79, 4.4, 'b'], [50, 79, 4.8, 'c'], [72, 79, 4.4, 'b']].forEach(function (j, i) {
        p.circle(j[0], j[1], j[2], { fill: j[3], w: 0.9 });
        if (i > 2) p.line(j[0] - 1.8, j[1] - 1.4, j[0] - 0.6, j[1] - 2.4, { ink: 'white', w: 0.4, detail: true, cap: 'round' });
      });
    });
    [[50, 6, 0], [3, 22, 0.33], [97, 22, 0.66]].forEach(function (g) { glint(p, g[0], g[1], 8 * M.bump(M.seg(M.frac(t - g[2]), 0, 0.3)), 0); });
    if (tp >= 0) [[18, 14], [82, 10], [50, 2]].forEach(function (g, i) { var u = M.seg(tp, 0.15 + i * 0.1, 0.7 + i * 0.1); spark(p, g[0], g[1], 8 * M.bump(u), TAU * 0.25 * u, { fill: 'yellow', w: 0.8 }); });
  }
});

/* ♠ a spade swaying on its foot with a shine drawn down its left lobe and taken back;
   tap: it flips like a card, the back showing mid-flip */
var SPADE = 'M50 8 C58 26 86 38 86 60 C86 74 74 80 64 76 C58 74 54 70 52 66 C53 77 56 85 64 91 L36 91 C44 85 47 77 48 66 C46 70 42 74 36 76 C26 80 14 74 14 60 C14 38 42 26 50 8 Z';
D.add('spade', {
  fam: 'classic', tags: ['cards', 'suit', 'game', 'poker', 'luck', 'play', 'casino', '♠', '♤'], loop: 2.2, still: 0.4, tapLen: 1.3, tapRest: 0.9, burst: false, margin: [20, 14, 14, 14],
  about: 'sways on its foot while a shine is drawn down the left lobe and taken back', tapAbout: 'flips like a card; the back shows mid-flip',
  draw: function (p, t, s) {
    var tp = s.tap, fl = tp >= 0 ? M.ease(M.seg(tp, 0, 0.7)) : 0, c = Math.cos(TAU * fl), hop = tp >= 0 ? 7 * M.bump(M.seg(tp, 0, 0.7)) : 0;
    c = c < 0 ? Math.min(c, -0.12) : Math.max(c, 0.12);
    p.push(); p.move(0, -hop);
    p.pivot(50, 91, 0.07 * M.wave(t, 1), [c, 1 + 0.03 * M.wave(t, 2)], function () {
      if (tp >= 0 && fl > 0.25 && fl < 0.75) {
        p.rect(17, 7, 66, 84, { fill: 'b', r: 7 }); p.rect(24, 14, 52, 70, { ink: 'white', w: 0.7, r: 3 });
        p.path('M24 34 L76 66 M24 52 L50 68 M24 70 L36 77 M76 34 L24 66 M76 52 L50 68 M76 70 L64 77 M50 14 L50 84', { ink: 'white', w: 0.4, detail: true });
      } else {
        p.path(SPADE, { fill: 'ink' });
        p.span('M22 56 C20 48 24 42 30 38', M.easeIn(M.seg(t, 0.55, 0.8)), M.easeOut(M.seg(t, 0.1, 0.45)), { ink: 'white', w: 0.8, detail: true });
      }
    });
    p.pop();
  }
});

/* ♣ a club whose three lobes pulse one after another round the ring;
   tap: the lobes spring apart like a trefoil opening, and close again */
D.add('club', {
  fam: 'classic', tags: ['cards', 'suit', 'game', 'poker', 'luck', 'clover', 'play', '♣', '♧'], loop: 1.8, still: 0.3, tapLen: 1.3, tapRest: 0.4, burst: false,
  about: 'the three lobes pulse one after another, round the ring', tapAbout: 'the lobes spring apart like a trefoil opening, then close',
  draw: function (p, t, s) {
    var tp = s.tap;
    p.path('M50 54 C50 72 46 84 38 91 L62 91 C54 84 50 72 50 54 Z', { fill: 'ink' });
    [[50, 30, 0], [27, 58, 0.33], [73, 58, 0.66]].forEach(function (c, i) {
      var pop = M.bump(M.seg(M.frac(t - c[2]), 0, 0.3)), out = tp >= 0 ? 10 * M.spring(M.seg(tp, i * 0.06, i * 0.06 + 0.4)) * (1 - M.ease(M.seg(tp, 0.55, 0.95))) : 0, dx = c[0] - 50, dy = c[1] - 52, d = Math.hypot(dx, dy), r = 19 * (1 + 0.12 * pop);
      var x = c[0] + dx / d * out, y = c[1] + dy / d * out;
      p.circle(x, y, r, { fill: 'ink' });
      p.arc(x, y, r - 5, -2.7, -1.9, { ink: 'white', w: 0.6, detail: true });
    });
    p.circle(50, 52, 11, { fill: 'ink', w: 0.8 });
  }
});

/* ♦ a cut diamond turning on its vertical axis, facets sliding across it, a glint at each corner in turn;
   tap: it spins up two quick turns and throws sparkles */
D.add('diamond', {
  fam: 'classic', tags: ['cards', 'suit', 'gem', 'jewel', 'gift', 'precious', 'rare', '♦', '♢'], loop: 3.2, still: 0.05, tapLen: 1.4, tapRest: 0.9, burst: false, margin: [18, 18, 14, 18],
  about: 'turns on its vertical axis, facets sliding across it, a glint at each corner in turn', tapAbout: 'spins up two quick turns and throws sparkles',
  draw: function (p, t, s) {
    var tp = s.tap, turn = TAU * t + (tp >= 0 ? TAU * 2 * M.easeOut(tp) : 0), c = Math.cos(turn);
    c = c < 0 ? Math.min(c, -0.2) : Math.max(c, 0.2);
    p.pivot(50, 50, 0, [c, 1], function () {
      p.poly([[50, 6], [84, 40], [50, 94], [16, 40]], { fill: 'b' });
      p.path('M16 40 L84 40 M34 40 L50 6 L66 40 M34 40 L50 94 L66 40', { w: 0.5, detail: true });
      p.path('M30 34 L40 24', { ink: 'white', w: 0.7, detail: true, cap: 'round' });
    });
    [[50, 2], [90, 40], [10, 40], [50, 98]].forEach(function (g, i) { glint(p, g[0], g[1], 7 * M.bump(M.seg(M.frac(t - i * 0.25), 0, 0.22)), 0); });
    if (tp >= 0) for (var j = 0; j < 6; j++) { var u = M.seg(tp, 0.1 + j * 0.05, 0.7 + j * 0.05); spark(p, 50 + Math.cos(j * 1.05) * (30 + 22 * M.easeOut(u)), 50 + Math.sin(j * 1.05) * (30 + 22 * M.easeOut(u)), 7 * M.bump(u), TAU * u / 4, { fill: 'yellow', w: 0.7 }); }
  }
});

/* ⚑ a flag on its pole, a wave running along the cloth from the pole to the swallowtail;
   tap: it drops down the pole and is run back up with a bounce at the top */
D.add('flag', {
  fam: 'classic', tags: ['mark', 'report', 'goal', 'country', 'finish', 'milestone', 'banner', '⚑', '⚐'], loop: 1.6, still: 0.2, tapLen: 1.6, tapRest: 0.95, burst: false, margin: [18, 18, 14, 14],
  about: 'a wave runs along the cloth from the pole to the swallowtail', tapAbout: 'drops down the pole, then is run back up with a bounce at the top',
  draw: function (p, t, s) {
    var tp = s.tap, h = tp < 0 ? 1 : tp < 0.2 ? 1 - M.easeIn(M.seg(tp, 0, 0.2)) : M.spring(M.seg(tp, 0.28, 0.85)), dy = (1 - h) * 40, top = [], bot = [], i, x, o;
    p.line(22, 6, 22, 94, { w: 1.8 }); p.circle(22, 6, 3.4, { fill: 'a', w: 0.9 }); p.ellipse(22, 94, 9, 2.6, { fill: 'smoke', line: false });
    for (i = 0; i <= 16; i++) { x = 22 + 62 * i / 16; o = 7 * (i / 16) * Math.sin(TAU * (i / 16 * 1.2 - t)); top.push([x, 14 + dy + o]); bot.push([x, 50 + dy + o]); }
    p.poly(top.concat([[72, 32 + dy + o]], bot.reverse()), { fill: 'b' });
    p.path('M30 26 C45 22 60 30 74 24', { ink: 'white', w: 0.5, detail: true });
  }
});

/* † a dagger hovering, a streak of light running up the blade to a glint at the tip;
   tap: it twirls once about its middle like a juggler's, and lands with a bounce */
D.add('dagger', {
  fam: 'classic', tags: ['obelus', 'footnote', 'blade', 'knife', 'sword', 'cut', 'death', '†', '🗡'], loop: 2.4, still: 0.3, tapLen: 1.3, tapRest: 0.9, burst: false, margin: [18, 24, 18, 24],
  about: 'hovers while a streak of light runs up the blade to a glint at the tip', tapAbout: 'twirls once about its middle and lands with a bounce',
  draw: function (p, t, s) {
    var tp = s.tap, spin = 0, hop = 0, sq = 0;
    if (tp >= 0) { var u = M.seg(tp, 0, 0.75); spin = TAU * M.ease(u); hop = 12 * M.bump(u); sq = M.bump(M.seg(tp, 0.75, 1)); }
    p.push(); p.move(0, 3 * M.wave(t, 1) - hop);
    p.pivot(50, 50, 0.05 * M.wave(t, 1, 0.25) + spin, [1 + 0.06 * sq, 1 - 0.06 * sq], function () {
      p.path('M50 4 C54 14 57 26 57 40 L57 62 L43 62 L43 40 C43 26 46 14 50 4 Z', { fill: 'stone' });
      p.path('M50 14 L50 58', { w: 0.4, detail: true });
      p.rect(24, 62, 52, 8, { fill: 'a', r: 3 }); p.rect(45, 70, 10, 16, { fill: 'brown', r: 2 });
      p.path('M45 75 L55 77 M45 80 L55 82', { w: 0.4, detail: true }); p.circle(50, 90, 5.5, { fill: 'a', w: 0.9 });
      var g = M.seg(t, 0.1, 0.55); if (g > 0 && g < 1) { var y = 58 - 50 * g; p.line(46.5, y + 4, 53.5, y - 3, { ink: 'white', w: 0.8, cap: 'round' }); }
    });
    p.pop();
    glint(p, 50, 4 + 3 * M.wave(t, 1), 8 * M.bump(M.seg(t, 0.5, 0.7)), 0);
  }
});

/* & an ampersand written in one looping stroke, held, and taken back from its tail;
   tap: it is set bold and italic, leaning into the slant with a spring, and straightens again */
var AMP = 'M76 84 C62 70 44 52 36 38 C28 24 36 8 50 8 C64 8 66 24 54 36 C44 46 24 54 24 70 C24 84 36 92 50 92 C66 92 78 78 80 62';
D.add('ampersand', {
  fam: 'classic', tags: ['and', 'type', 'letter', 'together', 'with', 'join', 'text', '&'], loop: 3, still: 0.55, tapLen: 1.3, tapRest: 0.45, burst: false, margin: [14, 22, 14, 22],
  about: 'written in one looping stroke, held, then taken back from its tail', tapAbout: 'set bold and italic: it leans into the slant with a spring and straightens',
  draw: function (p, t, s) {
    var tp = s.tap;
    if (tp < 0) { p.span(AMP, M.easeIn(M.seg(t, 0.74, 0.96)), M.easeOut(M.seg(t, 0, 0.5)), { w: 2 }); return; }
    var lean = M.spring(M.seg(tp, 0, 0.35)) * (1 - M.ease(M.seg(tp, 0.7, 1))), bold = M.bump(M.seg(tp, 0.05, 0.9));
    p.push(); p.move(50, 50); p.skew(-0.32 * lean, 0); p.move(-50, -50);
    p.draw(AMP, 1, { w: 2 + 1.2 * bold });
    p.pop();
  }
});
})(Dingbats);

/* Signals: the small working glyphs of a screen — loading, sent, saved, found, ringing. */
(function (D) {
'use strict';
var M = D.math, TAU = M.TAU, PI = Math.PI, sin = Math.sin, cos = Math.cos;

/* a clockwise arc as path data, for p.draw and p.span */
function arcD(cx, cy, r, a0, a1) {
  return 'M' + (cx + r * cos(a0)) + ' ' + (cy + r * sin(a0)) + ' A' + r + ' ' + r + ' 0 ' + (a1 - a0 > PI ? 1 : 0) + ' 1 ' + (cx + r * cos(a1)) + ' ' + (cy + r * sin(a1));
}
/* a closed oval as path data, from its left edge over the top */
function oval(cx, cy, rx, ry) {
  return 'M' + (cx - rx) + ' ' + cy + ' A' + rx + ' ' + ry + ' 0 1 1 ' + (cx + rx) + ' ' + cy + ' A' + rx + ' ' + ry + ' 0 1 1 ' + (cx - rx) + ' ' + cy;
}
/* a value gliding through keyframes [[t, v], …], each leg eased */
function track(t, k) {
  for (var i = 1; i < k.length; i++) if (t <= k[i][0]) return M.lerp(k[i - 1][1], k[i][1], M.ease(M.seg(t, k[i - 1][0], k[i][0])));
  return k[k.length - 1][1];
}
/* a struck thing: 0 at u = 0, n swings that die away by u = 1 */
function ring(u, n) { return u <= 0 || u >= 1 ? 0 : sin(TAU * n * u) * (1 - u) * (1 - u); }
/* how much of the tap reaction replaces the idle loop: in over the first a, out over the last 1 - b */
function tapw(s, a, b) { return s.tap < 0 ? 0 : M.ease(M.seg(s.tap, 0, a)) * (1 - M.ease(M.seg(s.tap, b, 1))); }
/* a pair of slanted bright bands crossing x0..x1 as u runs 0 → 1; draw it inside p.clip */
function shine(p, u, x0, x1, y0, y1) {
  if (u <= 0 || u >= 1) return;
  var x = M.lerp(x0 - 14, x1 + 4, u), k = (y1 - y0) * 0.35;
  p.poly([[x, y0 - 2], [x + 7, y0 - 2], [x + 7 - k, y1 + 2], [x - k, y1 + 2]], { fill: 'white', line: false, alpha: 0.55 });
  p.poly([[x + 10, y0 - 2], [x + 13, y0 - 2], [x + 13 - k, y1 + 2], [x + 10 - k, y1 + 2]], { fill: 'white', line: false, alpha: 0.4 });
}

/* three ants carry crumbs round a track, the front one a step ahead of the others.
   Tap: each tosses its crumb up toward you and catches it, one after another. */
function ant(p, t, k, toss) {
  p.at(0, 0, 0, p.small ? 1.5 : 0.85, function () {
    [4, -0.5, -5].forEach(function (x, i) {
      var w = 3 * M.wave(t, 9, i / 3 + k * 0.17);
      p.line(x, 2, x + w, 9, { w: 0.45, detail: true }); p.line(x, -2, x - w, -9, { w: 0.45, detail: true });
    });
    p.ellipse(-9, 0, 6.5, 4.6, { fill: 'brown' });
    p.ellipse(-0.5, 0, 4.2, 3.4, { fill: 'brown' });
    p.circle(6.5, 0, 3.8, { fill: 'brown' });
    p.at(15.5, 0, 1.4 * toss, 1 + 0.9 * toss, function () {
      if (toss > 0) p.ellipse(1, 3, 5, 3, { fill: 'smoke', line: false, alpha: 0.6 });
      p.poly([[-5, -3.5], [3, -5], [6, 1], [1, 5], [-6, 3]], { fill: 'sand', w: 0.7 });
    });
  });
}
D.add('loading', {
  fam: 'signals', tags: ['wait', 'busy', 'progress', 'ants', 'working', 'please wait', 'spinner'], loop: 3, still: 0.1, burst: false, tapLen: 1.3,
  about: 'three ants carry crumbs round a track, the front one a step ahead', tapAbout: 'each ant tosses its crumb toward you and catches it',
  draw: function (p, t, s) {
    p.circle(50, 50, 31, { w: 0.35, dash: [2, 5], detail: true, alpha: 0.7 });
    [0, 0.3, 0.64].forEach(function (off, i) {
      var a = TAU * (t + off) - PI / 2, toss = s.tap >= 0 ? M.bump(M.seg(s.tap, 0.06 + i * 0.16, 0.5 + i * 0.16)) : 0;
      p.at(50 + 31 * cos(a), 50 + 31 * sin(a), a + PI / 2, 1, function () { ant(p, t, i, toss); });
    });
  }
});

/* a ring drawn chasing its own tail: the head runs ahead, the tail catches up and runs on.
   Tap: the head catches the tail, the ring closes with a pulse, then lets go. */
D.add('spinner', {
  fam: 'signals', tags: ['wait', 'busy', 'loading', 'ring', 'progress', 'circle'], loop: 1.6, still: 0.3, burst: false, tapLen: 1.1,
  about: 'a ring drawn chasing its own tail', tapAbout: 'the head catches its tail, the ring closes with a pulse, then lets go',
  draw: function (p, t, s) {
    var k = s.tap >= 0 ? M.bump(M.seg(s.tap, 0.05, 0.9)) : 0, e = 0.5 - 0.5 * cos(TAU * t);
    var head = -PI / 2 + TAU * (2 * t + 0.2 * sin(TAU * t)), L = TAU * (0.1 + 0.62 * e), pulse = 1 + 0.08 * M.bump(M.seg(s.tap, 0.3, 0.8));
    L += (TAU * 0.97 - L) * k;
    p.circle(50, 50, 31, { w: 0.3, dash: [1.5, 4], alpha: 0.5, detail: true });
    p.pivot(50, 50, 0, pulse, function () {
      p.arc(50, 50, 31, head - L, head - L * 0.4, { w: 0.5 });
      p.arc(50, 50, 31, head - L * 0.65, head - L * 0.1, { w: 0.85, cap: 'round' });
      p.arc(50, 50, 31, head - L * 0.25, head, { w: 1.3, cap: 'round' });
    });
  }
});

var BELL = 'M50 17 C36 17 31 31 30 46 C29 60 24 68 15 76 C32 82 68 82 85 76 C76 68 71 60 70 46 C69 31 64 17 50 17 Z';
/* a hand bell swinging from its crown, the clapper a beat behind the shell.
   Tap: it is struck, rings hard through a few wide swings, and sound arcs go out either side. */
D.add('bell', {
  fam: 'signals', tags: ['notification', 'alert', 'ring', 'alarm', 'reminder', 'ding', '🔔'], loop: 2.2, still: 0.2, burst: false, tapLen: 1.6, margin: [18, 24, 14, 24],
  about: 'swings gently, the clapper a beat behind', tapAbout: 'rings hard, swinging wide, with sound arcs either side',
  draw: function (p, t, s) {
    var u = s.tap, A = 0.17;
    var sw = A * M.wave(t, 1) + 0.5 * ring(u, 3.5), cl = 1.9 * A * M.wave(t, 1, -0.1) + 0.9 * ring(u - 0.035, 3.5);
    p.pivot(50, 10, sw, 1, function () {
      p.circle(50, 12, 5, { w: 0.9 });
      p.path(BELL, { fill: 'a' });
      p.clip(BELL, function () { shine(p, M.seg(t, 0.55, 0.85), 15, 85, 14, 82); });
      p.path('M39 30 C36 38 35 46 35 54', { ink: 'white', w: 0.6, detail: true });
      p.path('M24 69 C38 74 62 74 76 69', { w: 0.45, detail: true });
      p.pivot(50, 40, cl - sw, 1, function () { p.line(50, 70, 50, 80, { w: 0.7 }); p.circle(50, 86, 6, { fill: 'brown' }); });
    });
    [0, 1].forEach(function (k) {
      var v = M.seg(u, 0.06 + k * 0.14, 0.6 + k * 0.14);
      if (v <= 0 || v >= 1) return;
      [[PI - 0.6, PI + 0.6], [-0.6, 0.6]].forEach(function (a) { p.span(arcD(50, 50, 44 + 11 * k, a[0], a[1]), M.easeIn(M.seg(v, 0.35, 1)), M.easeOut(M.seg(v, 0, 0.45)), { w: 0.7 }); });
    });
  }
});

/* a map pin hops, lands with a squash, and rings the ground with a ripple.
   Tap: it is thrown up out of sight and drops again, a big squash and three ripples. */
D.add('pin', {
  fam: 'signals', tags: ['location', 'map', 'place', 'here', 'address', 'marker', '📍'], loop: 2.4, still: 0.5, burst: false, tapLen: 1.5, margin: [40, 18, 14, 18],
  about: 'hops, lands with a squash, and rings the ground with a ripple', tapAbout: 'thrown up out of sight, drops again with a big squash and three ripples',
  draw: function (p, t, s) {
    var y = -22 * M.bump(M.seg(t, 0.04, 0.3)) - 7 * M.bump(M.seg(t, 0.4, 0.56)), sq = M.bump(M.seg(t, 0.3, 0.42)) * 0.8 + M.bump(M.seg(t, 0.56, 0.64)) * 0.3;
    var rip = [[0.3, 0.9, 1]], u = s.tap, w = tapw(s, 0.1, 0.85);
    if (u >= 0) {
      var up = M.easeOut(M.seg(u, 0, 0.14)), dn = M.easeIn(M.seg(u, 0.14, 0.42)), yt = -62 * up * (1 - dn);
      y = y * (1 - w) + yt * w; sq = sq * (1 - w) + (M.bump(M.seg(u, 0.42, 0.58)) + 0.35 * M.bump(M.seg(u, 0.58, 0.7))) * w * 1.1;
      rip = [[0.42, 1, 1.25], [0.5, 1.08, 1.05], [0.58, 1.16, 0.85]];
    }
    p.ellipse(50, 87, 17 - Math.min(10, -y * 0.2), 3.2, { fill: 'smoke', line: false });
    rip.forEach(function (r) {
      var v = u >= 0 ? M.seg(u, r[0], r[0] + 0.4) : M.seg(t, r[0], r[0] + 0.55);
      if (v <= 0 || v >= 1) return;
      var rx = (8 + 32 * M.easeOut(v)) * r[2];
      p.span(oval(50, 87, rx, rx * 0.3), M.easeIn(M.seg(v, 0.3, 1)), 1, { w: 0.55 });
    });
    p.move(0, y);
    p.pivot(50, 87, 0, [1 + 0.2 * sq, 1 - 0.24 * sq], function () {
      p.path('M50 87 C44 77 24 58 24 40 C24 25 35 14 50 14 C65 14 76 25 76 40 C76 58 56 77 50 87 Z', { fill: 'b' });
      p.circle(50, 40, 11, { fill: 'cream', w: 0.9 });
      p.path('M31 36 C32 29 36 24 42 21', { ink: 'white', w: 0.6, detail: true });
    });
  }
});

/* a magnifier sweeps side to side over some small print, a glint crossing the glass.
   Tap: it finds the thing, a gold sparkle opens in the lens and rays jump from the rim. */
D.add('search', {
  fam: 'signals', tags: ['find', 'look', 'magnifier', 'query', 'zoom', 'lookup', '🔍'], loop: 2.6, still: 0.1, burst: false, tapLen: 1.5, margin: [18, 24, 24, 24],
  about: 'sweeps side to side over small print, a glint crossing the glass', tapAbout: 'finds it: a gold sparkle opens in the lens and rays jump from the rim',
  draw: function (p, t, s) {
    var u = s.tap, w = tapw(s, 0.15, 0.8), found = u >= 0 ? M.spring(M.seg(u, 0.05, 0.5)) * (1 - M.easeIn(M.seg(u, 0.8, 1))) : 0;
    var dx = 8 * M.wave(t, 1) * (1 - w), dy = 3 * M.wave(t, 2, 0.2) * (1 - w), rot = 0.1 * M.wave(t, 1, -0.1) * (1 - w);
    p.push(); p.move(dx, dy);
    p.pivot(80, 80, rot, 1, function () {
      p.pivot(42, 42, 0, 1 + 0.13 * found, function () {
        p.clip(function () { p.circle(42, 42, 22.5); }, function () {
          p.circle(42, 42, 30, { fill: 'sky', line: false, alpha: 0.35 });
          var o = -2.2 * dx;
          [[31, [9, 4]], [41, [6, 5]], [51, [11, 3]]].forEach(function (r, i) { p.line(8 + o + i * 5, r[0], 90 + o, r[0], { w: 0.75, dash: r[1], cap: 'round', detail: true }); });
          shine(p, M.seg(t, 0.55, 0.85), 20, 64, 20, 64);
        });
        p.path('M27 38 A16 16 0 0 1 38 27', { ink: 'white', w: 0.8, cap: 'round' });
        if (found > 0.02) p.star(42, 42, 13 * found, 4.5 * found, 4, { fill: 'gold', w: 0.8 });
        p.circle(42, 42, 23, { w: 1.15 });
      });
      p.at(60, 60, PI / 4, 1, function () {
        p.rect(0, -5, 32, 10, { fill: 'brown', r: 4.5 });
        p.rect(-2, -6.5, 7, 13, { fill: 'grey', r: 2.5, w: 0.8 });
      });
      if (found > 0) [-0.9, -0.45, 0].forEach(function (a, i) {
        var v = M.seg(u, 0.12 + i * 0.05, 0.55);
        p.span('M' + (42 + 30 * cos(a - 0.5)) + ' ' + (42 + 30 * sin(a - 0.5)) + ' L' + (42 + 40 * cos(a - 0.5)) + ' ' + (42 + 40 * sin(a - 0.5)), M.easeIn(M.seg(v, 0.5, 1)), M.easeOut(M.seg(v, 0, 0.5)), { w: 0.7, ink: 'a' });
      });
    });
    p.pop();
  }
});

/* a paper plane flies a figure of eight, a dotted trail behind it.
   Tap: it speeds off to the upper right, shrinking, and the next one swoops in to take its place. */
function plane(p, x, y, a, k) {
  p.at(x, y, a, k, function () {
    p.poly([[36, 0], [-14, -27], [-3, 0]], { fill: 'white' });
    p.poly([[36, 0], [-3, 0], [-14, 27]], { fill: 'sky' });
    p.poly([[-3, 0], [-14, 27], [-12, 8]], { fill: 'cream', w: 0.6 });
    p.line(36, 0, -3, 0, { w: 0.45, detail: true });
  });
}
D.add('send', {
  fam: 'signals', tags: ['sent', 'message', 'submit', 'mail', 'paper plane', 'post', '✈'], loop: 3, still: 0.1, burst: false, tapLen: 1.5, margin: [28, 28, 22, 28],
  about: 'a paper plane flies a figure of eight, a dotted trail behind it', tapAbout: 'it speeds off to the upper right, shrinking, and the next plane swoops in',
  draw: function (p, t, s) {
    var K = p.small ? 0.8 : 1, P = function (th) { return [50 + 34 * K * sin(th), 50 + 19 * K * sin(2 * th), Math.atan2(38 * cos(2 * th), 34 * cos(th))]; };
    p.at(50, 50, -0.28, 1, function () {
      p.move(-50, -50);
      var th = TAU * (t + 0.04 * sin(TAU * t)) + 0.4, q = P(th), n = p.small ? 3 : 6;
      for (var i = n; i >= 1; i--) { var b = P(th - 0.26 * i); p.dot(b[0], b[1], 3.4 - i * 0.42, 'ink'); }
      if (s.tap < 0) { plane(p, q[0], q[1], q[2], 0.8 / K); return; }
      var u = s.tap, go = M.easeIn(M.seg(u, 0, 0.5)), come = M.easeOut(M.seg(u, 0.35, 0.95));
      if (go < 1) {
        var x = M.lerp(q[0], 130, go), y = M.lerp(q[1], -40, go);
        p.line(q[0], q[1], x, y, { w: 0.5, dash: [4, 5], cap: 'round' });
        plane(p, x, y, M.lerp(q[2], Math.atan2(-40 - q[1], 130 - q[0]), M.easeOut(M.seg(u, 0, 0.2))), 0.75 / K * (1 - 0.8 * go));
      }
      if (come > 0) {
        var sx = M.lerp(-30, q[0], come), sy = M.lerp(110, q[1], come) - 24 * M.bump(come);
        plane(p, sx, sy, M.lerp(-0.7, q[2], come), 0.75 / K * (0.25 + 0.75 * come));
      }
    });
  }
});

/* an arrow drops into a tray, the tray taking the weight with a bump; the arrow lifts out and comes again.
   Tap: three quick pecks, the tray bumping each time. */
function arrowDown(p, ay, sq) {
  p.pivot(50, ay + 74, 0, [1 + 0.1 * sq, 1 - 0.12 * sq], function () {
    p.poly([[43.5, ay + 30], [56.5, ay + 30], [56.5, ay + 56], [68, ay + 56], [50, ay + 75], [32, ay + 56], [43.5, ay + 56]], { fill: 'a' });
  });
}
function tray(p, dip, sq) {
  p.pivot(50, 84, 0, [1 + 0.04 * sq, 1 - 0.06 * sq], function () {
    p.move(0, dip);
    p.poly([[15, 58], [85, 58], [78, 84], [22, 84]], { fill: 'sand', line: false });
    p.path('M15 58 L22 84 L78 84 L85 58', { w: 1.15 });
    p.line(26, 77, 74, 77, { w: 0.4, detail: true });
  });
}
D.add('download', {
  fam: 'signals', tags: ['save', 'get', 'arrow', 'receive', 'fetch', 'import', '⬇'], loop: 2, still: 0.5, burst: false, tapLen: 1.2, margin: [20, 18, 14, 18],
  about: 'an arrow drops into a tray, the tray taking the weight with a bump; the arrow lifts out and comes again', tapAbout: 'three quick pecks, the tray bumping each time',
  draw: function (p, t, s) {
    var ay = t < 0.5 ? -22 * (1 - M.easeIn(M.seg(t, 0.1, 0.36))) : -22 * M.ease(M.seg(t, 0.66, 0.92));
    var hit = M.bump(M.seg(t, 0.36, 0.5)), dip = 4 * hit, sq = hit;
    if (s.tap >= 0) {
      var w = tapw(s, 0.08, 0.9), pk = 0;
      [0, 1, 2].forEach(function (i) { pk = Math.max(pk, M.bump(M.seg(s.tap, 0.05 + i * 0.28, 0.3 + i * 0.28))); });
      ay = ay * (1 - w) + (-14 * (1 - pk)) * w;
      hit = hit * (1 - w) + pk * w; dip = dip * (1 - w) + 5 * pk * w; sq = hit;
    }
    tray(p, dip, sq);
    arrowDown(p, ay + dip, sq);
  }
});

/* an arrow rests in its tray, crouches, and launches up, the tray recoiling and speed lines trailing it.
   Tap: it shoots out of sight and the next arrow rises into its place. */
D.add('upload', {
  fam: 'signals', tags: ['send', 'push', 'arrow', 'publish', 'export', 'share', '⬆'], loop: 2.2, still: 0.1, burst: false, tapLen: 1.3, margin: [40, 18, 14, 18],
  about: 'an arrow crouches in its tray and launches up, the tray recoiling, speed lines trailing', tapAbout: 'it shoots out of sight and the next arrow rises into its place',
  draw: function (p, t, s) {
    var ay = track(t, [[0, 0], [0.12, 0], [0.24, 5], [0.4, -26], [0.7, -22], [0.9, 0], [1, 0]]), dip = 5 * M.bump(M.seg(t, 0.22, 0.46)), u = s.tap, out = 0, inn = 0, fast = M.bump(M.seg(t, 0.24, 0.5));
    if (u >= 0) {
      out = M.easeIn(M.seg(u, 0.1, 0.5)); inn = M.easeOut(M.seg(u, 0.4, 0.95));
      dip = Math.max(dip, 6 * M.bump(M.seg(u, 0.1, 0.4))); fast = Math.max(fast, M.bump(M.seg(u, 0.1, 0.5)));
    }
    tray(p, dip, 0);
    var arrow = function (y, k) {
      p.pivot(50, 50, 0, k, function () { p.poly([[43.5, y + 70], [56.5, y + 70], [56.5, y + 44], [68, y + 44], [50, y + 25], [32, y + 44], [43.5, y + 44]], { fill: 'a' }); });
      if (fast > 0.1 && y < -12) [38, 50, 62].forEach(function (x, i) { p.line(x, y + 76 + i % 2 * 5, x, Math.min(56, y + 76 + i % 2 * 5 + 16 * fast), { w: 0.6 }); });
    };
    if (u < 0) arrow(ay + dip * 0.5, 1);
    else {
      var y0 = ay + dip * 0.5;
      if (out < 1) arrow(y0 - 120 * out, 1 - 0.5 * out);
      if (inn > 0) arrow(M.lerp(40, 0, inn), 0.6 + 0.4 * inn);
    }
  }
});

/* two curved arrows chase each other round a ring, the second a few hundredths of a turn behind.
   Tap: both spin a full extra turn and settle with a pulse. */
function arrowArc(p, cx, cy, r, a0, a1, col) {
  p.arc(cx, cy, r, a0, a1, { w: 1.5, cap: 'round' });
  var px = cx + r * cos(a1), py = cy + r * sin(a1), tx = -sin(a1), ty = cos(a1), nx = cos(a1), ny = sin(a1);
  p.poly([[px + tx * 12, py + ty * 12], [px + nx * 10 - tx, py + ny * 10 - ty], [px - nx * 10 - tx, py - ny * 10 - ty]], { fill: col });
}
D.add('refresh', {
  fam: 'signals', tags: ['reload', 'sync', 'update', 'again', 'retry', 'arrows', '🔄'], loop: 1.8, still: 0.1, burst: false, tapLen: 1.2,
  about: 'two curved arrows chase each other round a ring, the second a little behind', tapAbout: 'both spin a full extra turn and settle with a pulse',
  draw: function (p, t, s) {
    var rot = function (x) { return TAU * (x + 0.12 * sin(TAU * x)); };
    var extra = s.tap >= 0 ? TAU * M.easeOut(M.seg(s.tap, 0, 0.8)) : 0, pulse = 1 + 0.07 * M.bump(M.seg(s.tap, 0.5, 1));
    var a = -PI / 2 + rot(t) + extra, b = a + PI + 0.35 + rot(t - 0.05) - rot(t);
    p.pivot(50, 50, 0, pulse, function () {
      arrowArc(p, 50, 50, 29, a, a + 2.3, 'c');
      arrowArc(p, 50, 50, 29, b, b + 2.3, 'a');
    });
  }
});

/* a chain of three links, the middle one seen edge-on, rattles loose in short bursts.
   Tap: the links are pulled apart and snap back together tight, the joints flicking. */
function stadium(p, x, y, hl, hw) {
  p.rect(x - hl, y - hw, hl * 2, hw * 2, { r: hw });
  p.rect(x - hl + 5.5, y - hw + 5.5, hl * 2 - 11, hw * 2 - 11, { r: hw - 5.5, w: 0.5, detail: true });
}
D.add('link', {
  fam: 'signals', tags: ['chain', 'url', 'connect', 'attach', 'hyperlink', 'join', '🔗'], loop: 1.8, still: 0.5, burst: false, tapLen: 1.2,
  about: 'a three-link chain rattles loose in short bursts', tapAbout: 'pulled apart, then snapped together tight, the joints flicking',
  draw: function (p, t, s) {
    var env = M.bump(M.seg(t, 0.04, 0.5)), sh = env * sin(TAU * 5 * t), apart = 0, u = s.tap;
    if (u >= 0) apart = u < 0.3 ? 11 * M.easeOut(u / 0.3) : 11 * (1 - M.easeIn(M.seg(u, 0.3, 0.44))) - 3.5 * M.bump(M.seg(u, 0.44, 0.64));
    p.at(50, 50, -0.6 + 0.02 * M.wave(t, 1), 1, function () {
      var ga = -30 - apart, gc = 30 + apart, gb = 3.5 * env * sin(TAU * 5 * t + 0.8);
      p.pivot(gb, 0, 0.05 * sh, 1, function () {
        p.rect(gb - 16, -6, 32, 12, { fill: 'a', r: 6 });
        p.line(gb - 12, 0, gb + 12, 0, { w: 0.4, detail: true });
      });
      p.pivot(ga, 0, 0.07 * sh, 1, function () { stadium(p, ga, 0, 18, 13); });
      p.pivot(gc, 0, -0.07 * sh, 1, function () { stadium(p, gc, 0, 18, 13); });
      var f = M.seg(u, 0.44, 0.72);
      if (f > 0 && f < 1) [-14, 14].forEach(function (jx) {
        [-1, 1].forEach(function (d) { p.span('M' + jx + ' ' + (d * 17) + ' L' + (jx + d * 4) + ' ' + (d * 26), M.easeIn(M.seg(f, 0.4, 1)), M.easeOut(M.seg(f, 0, 0.5)), { w: 0.7 }); });
      });
    });
  }
});

/* a padlock; taps toggle it. The shackle springs up and swings open, or drops and clicks shut.
   Idle: locked, it sways on its hook and glints; open, the shackle swings free. */
D.add('lock', {
  fam: 'signals', tags: ['secure', 'private', 'unlock', 'password', 'padlock', 'toggle', '🔒'], loop: 2.4, still: 0.2, burst: 'spark', burstAt: [50, 36], burstN: 4, burstSpread: 3.2, tapLen: 1, tapRest: 1,
  about: 'a padlock, sways and glints; open, the shackle swings free', tapAbout: 'toggles: the shackle springs open or drops and clicks shut',
  draw: function (p, t, s) {
    var cur = s.taps % 2, open = cur, hit = 0;
    if (s.tap >= 0) { open = M.lerp(1 - cur, cur, M.spring(M.seg(s.tap, 0.05, 0.55))); hit = M.bump(M.seg(s.tap, 0.28, 0.5)); }
    var sway = 0.045 * M.wave(t, 1) * (1 - open) + 0.1 * M.wave(t, 1, 0.1) * open;
    p.pivot(50, 14, sway * (1 - open), 1, function () {
      p.pivot(67, 48, -0.5 * open + sway * open, 1, function () {
        p.move(0, -5 * open);
        p.path('M33 50 L33 34 C33 14 67 14 67 34 L67 50', { w: 1.7 });
      });
      p.pivot(50, 86, 0, [1 + 0.06 * hit, 1 - 0.08 * hit], function () {
        p.rect(22, 46, 56, 41, { fill: open > 0.5 ? 'leaf' : 'a', r: 9 });
        p.dot(50, 63, 5.5, 'ink'); p.line(50, 65, 50, 75, { w: 1.5, cap: 'round' });
        p.clip(function () { p.rect(22, 46, 56, 41, { r: 9 }); }, function () { shine(p, M.seg(t, 0.5, 0.8), 22, 78, 46, 87); });
      });
    });
  }
});

/* a big cog turns with a small one meshing, tooth in tooth, the small one twice as fast the other way.
   Tap: both whirr through two extra turns and throw a spark where they meet. */
function cog(p, cx, cy, n, rr, ro, rot) {
  var pt = TAU / n, pts = [];
  for (var k = 0; k < n; k++) {
    var c = rot + k * pt;
    [[rr, -0.3], [ro, -0.17], [ro, 0.17], [rr, 0.3]].forEach(function (q) { pts.push([cx + q[0] * cos(c + q[1] * pt), cy + q[0] * sin(c + q[1] * pt)]); });
  }
  return pts;
}
D.add('gear', {
  fam: 'signals', tags: ['settings', 'cog', 'options', 'preferences', 'work', 'machine', '⚙'], loop: 6, still: 0.1, burst: 'spark', burstAt: [59, 42], burstN: 5, burstSpread: 3.2, tapLen: 1.3,
  about: 'a big cog turns with a small one meshing, tooth in tooth', tapAbout: 'both whirr through extra turns and spark where they meet',
  draw: function (p, t, s) {
    var phi = -0.7, th = TAU * 2 * (t + 0.012 * sin(TAU * 6 * t)) + (s.tap >= 0 ? TAU * 2 * M.easeOut(M.seg(s.tap, 0, 0.85)) : 0);
    var th2 = phi + PI - PI / 5 - (th - phi) * 2, c1 = [38, 60], c2 = [38 + 41.25 * cos(phi), 60 + 41.25 * sin(phi)];
    p.poly(cog(p, c1[0], c1[1], 10, 24, 31, th + phi), { fill: 'a' });
    p.circle(c1[0], c1[1], 8, { fill: 'bg' });
    for (var i = 0; i < 3; i++) p.circle(c1[0] + 16 * cos(th + i * TAU / 3), c1[1] + 16 * sin(th + i * TAU / 3), 3.4, { fill: 'bg', w: 0.5, detail: true });
    p.poly(cog(p, c2[0], c2[1], 5, 10.25, 17.25, th2), { fill: 'c' });
    p.circle(c2[0], c2[1], 4.2, { fill: 'bg' });
  }
});

/* three signal arcs light one after another and are taken back in turn, the dot always there.
   Tap: a ping runs up the arcs, each one swelling gold as it passes. */
D.add('wifi', {
  fam: 'signals', tags: ['wireless', 'signal', 'network', 'online', 'connection', 'internet', '📶'], loop: 2.6, still: 0.6, burst: false, tapLen: 1.2,
  about: 'three arcs light in turn and are taken back in turn, the dot staying', tapAbout: 'a ping runs up the arcs, each swelling gold as it passes',
  draw: function (p, t, s) {
    var cx = 50, cy = 78, u = s.tap;
    [0, 1, 2].forEach(function (k) {
      var d = arcD(cx, cy, 17 + 16 * k, -PI / 2 - 0.8, -PI / 2 + 0.8), on = M.easeOut(M.seg(t, 0.1 + 0.11 * k, 0.24 + 0.11 * k)), off = M.easeIn(M.seg(t, 0.78 + 0.05 * (2 - k), 0.92 + 0.05 * (2 - k)));
      p.path(d, { w: 0.9, alpha: 0.16, cap: 'round' });
      var w = tapw(s, 0.15, 0.85), pop = u >= 0 ? M.bump(M.seg(u, 0.1 + 0.16 * k, 0.45 + 0.16 * k)) : 0;
      p.span(d, off * (1 - w), Math.max(on, w), { w: 1.5, cap: 'round' });
      if (pop > 0.05) p.pivot(cx, cy, 0, 1 + 0.1 * pop, function () { p.path(d, { w: 1.7, ink: 'a', cap: 'round' }); });
    });
    p.dot(cx, cy - 6 * M.bump(M.seg(u, 0, 0.3)), 6, 'ink');
  }
});

/* a battery charges, the fill growing from the left with a shine crossing it, full, then drained to start again.
   Tap: a lightning bolt strikes, the cell jolts and fills at once. */
D.add('battery', {
  fam: 'signals', tags: ['charge', 'power', 'energy', 'charging', 'low', 'phone', '🔋'], loop: 3, still: 0.55, burst: 'spark', burstAt: [48, 50], burstN: 5, burstSpread: 3.4, tapLen: 1.3,
  about: 'charges: the fill grows from the left with a shine crossing it, then drains and begins again', tapAbout: 'a lightning bolt strikes, the cell jolts and fills at once',
  draw: function (p, t, s) {
    var L = track(t, [[0, 0.08], [0.72, 1], [0.86, 1], [0.97, 0.08], [1, 0.08]]), u = s.tap, w = tapw(s, 0.12, 0.85), bolt = 0, tilt = 0;
    if (u >= 0) { L = L * (1 - w) + w; bolt = M.spring(M.seg(u, 0.05, 0.3)) * (1 - M.easeIn(M.seg(u, 0.7, 0.95))); tilt = 0.04 * ring(u, 4); }
    p.pivot(50, 50, tilt, 1, function () {
      var fw = 58 * L, xe = 16 + fw;
      if (fw > 3) p.clip(function () { p.rect(14, 34, 62, 34, { r: 6 }); }, function () {
        p.rect(0, 30, xe, 42, { fill: L > 0.3 || u >= 0 ? 'leaf' : 'orange', line: false });
        p.line(xe, 36, xe, 66, { w: 0.6, detail: true });
        p.clip(function () { p.rect(0, 30, xe, 42); }, function () { shine(p, M.seg(t, 0.1, 0.75), 14, xe, 34, 68); });
      });
      p.rect(10, 30, 70, 42, { r: 9 });
      p.rect(80, 43, 8, 16, { fill: 'grey', r: 3, w: 0.9 });
      p.line(35, 36, 35, 66, { w: 0.35, detail: true, alpha: 0.5 }); p.line(55, 36, 55, 66, { w: 0.35, detail: true, alpha: 0.5 });
    });
    if (bolt > 0.02) p.pivot(48, 50, 0, bolt * 1.05, function () { p.poly([[58, 6], [30, 54], [47, 54], [38, 94], [70, 42], [52, 42], [64, 6]], { fill: 'yellow', w: 1.1 }); });
  }
});

/* a clock whose minute hand ticks round in six steps, each with a little overshoot.
   Tap: it is an alarm clock: two bells pop on top, it shakes and the hammer chatters. */
D.add('clock', {
  fam: 'signals', tags: ['time', 'hour', 'wait', 'schedule', 'alarm', 'timer', '🕐'], loop: 3, still: 0.1, burst: false, tapLen: 1.5, margin: [26, 22, 14, 22],
  about: 'the minute hand ticks round in six steps, each with a little overshoot', tapAbout: 'turns alarm clock: bells pop up, it shakes, the hammer chatters, ring arcs flicker',
  draw: function (p, t, s) {
    var u = s.tap, en = u >= 0 ? Math.min(1, M.seg(u, 0, 0.12)) * (1 - M.easeIn(M.seg(u, 0.8, 1))) : 0;
    var shake = 0.07 * en * sin(TAU * 11 * u), tk = 6 * t, hand = -PI / 2 + TAU * (Math.floor(tk) + M.spring(M.frac(tk))) / 6;
    p.pivot(50, 54, shake, 1, function () {
      if (en > 0) {
        var pop = M.spring(M.seg(u, 0, 0.3)), ham = 4 * sin(TAU * 12 * u) * en;
        [[-1, 30], [1, 70]].forEach(function (b) {
          p.at(b[1], 22, b[0] * 0.5, pop, function () { p.path('M-13 6 A13 13 0 0 1 13 6 Z', { fill: 'a' }); });
          p.line(b[1] - b[0] * 8, 40, b[1] - b[0] * 14, 48, { w: 0.9 });
        });
        p.line(50, 20, 50 + ham, 10, { w: 0.7 }); p.circle(50 + ham, 9, 3, { fill: 'brown', w: 0.7 });
        [[-1, 30], [1, 70]].forEach(function (b) { p.line(b[1] + b[0] * 4, 86, b[1] + b[0] * 8, 95, { w: 1.2, cap: 'round' }); });
      }
      p.circle(50, 56, 34, { fill: 'cream' });
      p.circle(50, 56, 29, { w: 0.4, detail: true });
      for (var i = 0; i < 12; i++) { var a = i * PI / 6; p.line(50 + 24 * cos(a), 56 + 24 * sin(a), 50 + (i % 3 ? 27 : 25) * cos(a), 56 + (i % 3 ? 27 : 25) * sin(a), { w: i % 3 ? 0.5 : 0.8, detail: true }); }
      p.line(50, 56, 50 + 14 * cos(2.2), 56 + 14 * sin(2.2), { w: 1.4, cap: 'round' });
      p.line(50, 56, 50 + 25 * cos(hand), 56 + 25 * sin(hand), { w: 1, cap: 'round' });
      p.dot(50, 56, 3, 'ink'); p.dot(50, 56, 1.2, 'red');
    });
    if (en > 0.1) [-1, 1].forEach(function (d) { for (var j = 0; j < 2; j++) if (sin(TAU * 7 * u + j * 2) > -0.2) p.path(arcD(50, 56, 42 + 7 * j, d > 0 ? -0.5 : PI - 0.5, d > 0 ? 0.5 : PI + 0.5), { w: 0.6 }); });
  }
});

/* a calendar page comes away from its pad and flutters down; the next sheet is already there.
   Tap: a copy of the page is torn off at once and spins away to the right. */
function sheet(p, y) {
  p.push(); p.move(0, y);
  p.rect(18, 20, 64, 68, { fill: 'white', r: 7 });
  p.path('M18 38 L18 27 C18 23 21 20 25 20 L75 20 C79 20 82 23 82 27 L82 38 Z', { fill: 'b', w: 0.9 });
  p.line(34, 13, 34, 27, { w: 1.7, cap: 'round' }); p.line(66, 13, 66, 27, { w: 1.7, cap: 'round' });
  p.path('M39 51 L61 51 L49 79', { w: 1.7 });
  p.pop();
}
D.add('calendar', {
  fam: 'signals', tags: ['date', 'day', 'schedule', 'event', 'plan', 'month', 'page', '📅'], loop: 3.4, still: 0.2, burst: false, tapLen: 1.3, margin: [18, 24, 30, 24],
  about: 'a page tears from the pad and flutters away; the next sheet is already there', tapAbout: 'a copy of the page is torn off at once and spins away to the right',
  draw: function (p, t, s) {
    var v = M.seg(t, 0.46, 0.86), yU = t < 0.88 ? 3 * (1 - M.ease(M.seg(t, 0.6, 0.86))) : 3 * M.ease(M.seg(t, 0.88, 1));
    p.rect(20, 23, 60, 68, { fill: 'cream', r: 7, w: 0.8 });
    sheet(p, yU);
    if (t > 0.46 && t < 0.86) {
      var fl = M.seg(v, 0.15, 0.5), k = Math.max(0.02, 1 - M.easeIn(M.seg(v, 0.35, 1)));
      p.push(); p.move(14 * sin(TAU * 1.1 * v) * fl + 8 * v, 64 * M.easeIn(M.seg(v, 0.1, 1)));
      p.pivot(50, 50, 0.3 * M.ease(M.seg(v, 0, 0.2)) + 0.55 * sin(TAU * 1.2 * v) * fl, [k * (1 - 0.4 * (1 - Math.abs(cos(TAU * 1.6 * v))) * fl), k], function () { sheet(p, 0); });
      p.pop();
    } else p.pivot(50, 14, 0.03 * sin(TAU * 2 * t) * (t > 0.86 ? M.ease(M.seg(t, 0.88, 0.98)) : 1 - M.ease(M.seg(t, 0.3, 0.46))), 1, function () { sheet(p, 0); });
    if (s.tap >= 0) {
      var q = M.seg(s.tap, 0.02, 0.8), e = M.easeIn(q);
      p.push(); p.move(60 * e, -22 * M.bump(q));
      p.pivot(50, 54, 2.4 * q, [Math.max(0.02, (1 - M.easeIn(M.seg(q, 0.3, 1)))) * (1 - 0.35 * M.bump(M.seg(q, 0.2, 0.8))), Math.max(0.02, 1 - M.easeIn(M.seg(q, 0.3, 1)))], function () { sheet(p, 0); });
      p.pop();
    }
  }
});

/* an hourglass: sand runs through the neck and heaps below, and at the end of the run the glass turns over.
   Tap: it somersaults, a handful of grains flying. */
function wall(y) { y = y > 50 ? 100 - y : y; return 2.5 + 19.5 * (1 - M.ease(M.seg(y, 26, 50))); }
function bulb(yFlat, yApex, slope, dip) {
  var L = [], R = [], i, y, w;
  for (i = 0; i <= 9; i++) { y = M.lerp(yFlat, yApex, i / 9); w = Math.min(wall(y) - 1.5, slope * Math.abs(y - yApex) + 1); L.push([50 - w, y]); R.push([50 + w, y]); }
  return L.concat(R.reverse(), [[50, yFlat + dip]]);
}
function flip(q) { return [100 - q[0], 100 - q[1]]; }
D.add('hourglass', {
  fam: 'signals', tags: ['time', 'wait', 'timer', 'sand', 'loading', 'patience', '⌛'], loop: 3.4, still: 0.3, burst: 'ember', burstAt: [50, 50], burstN: 7, burstSpread: 6, tapLen: 1.2,
  about: 'sand runs through the neck and heaps below; at the end the glass turns over', tapAbout: 'it somersaults, a handful of grains flying',
  draw: function (p, t, s) {
    var th = PI * M.spring(M.seg(t, 0.88, 1)), up = th < PI / 2, L = 1 - M.seg(t, 0.04, 0.84), F = 1 - L;
    var ph = (up ? th : th - PI) + (s.tap >= 0 ? TAU * M.spring(M.seg(s.tap, 0.04, 0.7)) : 0), hop = s.tap >= 0 ? -9 * M.bump(M.seg(s.tap, 0.04, 0.6)) : 0;
    p.push(); p.move(0, hop);
    p.pivot(50, 50, ph, 1, function () {
      var g = [], y;
      for (y = 18; y <= 82; y += 4) g.push([50 - wall(y), y]);
      for (y = 82; y >= 18; y -= 4) g.push([50 + wall(y), y]);
      p.curve(g, { close: true, fill: 'sky', line: false, alpha: 0.28 });
      if (up) {
        if (L > 0.02) p.poly(bulb(49.5 - 30 * L, 49.5, 99, 14 * L * (1 - L)), { fill: 'gold', line: false });
        if (F > 0.02) p.poly(bulb(19.5, 19.5 + 30 * F, 1.2, 0).map(flip), { fill: 'gold', line: false });
      } else p.poly(bulb(19.5, 19.5 + 30 * F, 1.2, 0), { fill: 'gold', line: false });
      if (up && L > 0.02 && L < 0.98) for (var k = 0; k < 3; k++) p.dot(50, 50 + M.frac(6 * t + k / 3) * (F > 0.02 ? 30.5 - 30 * F : 30.5), 1.4, 'gold');
      p.clip(g, function () { shine(p, M.seg(t, 0.1, 0.45), 28, 72, 18, 82); });
      p.curve(g, { close: true, w: 1.1 });
      p.rect(20, 9, 60, 9, { fill: 'wood', r: 3.5 });
      p.rect(20, 82, 60, 9, { fill: 'wood', r: 3.5 });
    });
    p.pop();
  }
});

/* an eye looks left, right and up, and blinks with lids that close over the eyeball: the upper lid drops fast and lifts slow.
   Tap: it widens, the pupil pinches, the brow shoots up, then it blinks twice. */
function blink(t, a, b) { return M.easeIn(M.seg(t, a, a + (b - a) * 0.4)) - M.ease(M.seg(t, a + (b - a) * 0.4, b)); }
D.add('eye', {
  fam: 'signals', tags: ['look', 'see', 'watch', 'view', 'visible', 'preview', 'show', '👁'], loop: 4, still: 0.1, burst: false, tapLen: 1.4, margin: [24, 18, 18, 18],
  about: 'looks left, right and up, blinking with lids that close over the eyeball', tapAbout: 'widens, the pupil pinches, the brow shoots up, then two quick blinks',
  draw: function (p, t, s) {
    var gx = track(t, [[0, 0], [0.1, 0], [0.2, -15], [0.36, -15], [0.46, 14], [0.62, 14], [0.72, 0], [1, 0]]), gy = track(t, [[0, 0], [0.74, 0], [0.8, -6], [0.92, -6], [1, 0]]);
    var c = Math.max(blink(t, 0.52, 0.64), blink(t, 0.9, 0.99)), o = 1 - c, wide = 0, u = s.tap, w = tapw(s, 0.1, 0.9);
    if (u >= 0) {
      wide = M.bump(M.seg(u, 0, 0.5)); gx *= 1 - w; gy *= 1 - w;
      o = o * (1 - w) + (1 + 0.28 * wide - Math.max(blink(u, 0.55, 0.68), blink(u, 0.72, 0.85))) * w;
    }
    var cy = 52 + 5 * (1 - Math.min(1, o)), hu = 23 * o, hl = 15 * o;
    var fu = function (x) { return cy - hu * (1 - (x - 50) * (x - 50) / 1600); }, fl = function (x) { return cy + hl * (1 - (x - 50) * (x - 50) / 1600); };
    var ix = 50 + gx, iy = cy + gy;
    p.path('M18 ' + (27 - 8 * wide + gy * 0.5) + ' Q50 ' + (11 - 8 * wide + gy * 0.5) + ' 82 ' + (27 - 8 * wide + gy * 0.5), { w: 1.1, detail: true });
    var up = [], lo = [], x;
    for (x = 10; x <= 90; x += 4) { up.push([x, fu(x)]); lo.push([x, fl(x)]); }
    if (o > 0.05) p.poly(up.concat(lo.slice().reverse()), { fill: 'white', line: false });
    if (o > 0.2) p.clip(function () { p.poly(up.concat(lo.slice().reverse())); }, function () {
      p.circle(ix, iy, 15 - 2.5 * wide, { fill: 'sea', w: 0.8 });
      p.circle(ix, iy, 7 - 3 * wide, { fill: 'ink', line: false });
      p.circle(ix - 5, iy - 5, 2.6, { fill: 'white', line: false });
    });
    p.curve(up, { w: 1.4 });
    if (o > 0.1) p.curve(lo, { w: 0.9 });
    [[28, -3], [40, -1], [60, 1], [72, 3]].forEach(function (l) { p.line(l[0], fu(l[0]) - 0.5, l[0] + l[1], fu(l[0]) - 7, { w: 0.5, detail: true }); });
  }
});

/* a starburst badge reading NEW turns slowly on its centre while the word rocks upright.
   Tap: the burst spins up through a full extra turn and the word pops. */
D.add('new', {
  fam: 'signals', tags: ['fresh', 'badge', 'latest', 'release', 'announce', 'label', 'sticker'], loop: 6, still: 0.1, burst: 'star', burstAt: [50, 50], burstN: 6, burstSpread: 6, tapLen: 1.3,
  about: 'a starburst badge reading NEW turns slowly while the word rocks upright', tapAbout: 'the burst spins up through a full extra turn and the word pops',
  draw: function (p, t, s) {
    var u = s.tap, pop = u >= 0 ? M.spring(M.seg(u, 0, 0.5)) * 0.18 : 0, extra = u >= 0 ? TAU * M.easeOut(M.seg(u, 0, 0.85)) : 0;
    p.pivot(50, 50, 0, 1 + 0.03 * M.wave(t, 3) + pop * 0.5, function () {
      p.star(50, 50, 46, 36, 12, { fill: 'yellow', rot: -PI / 2 + TAU * t + extra, w: 1.1 });
      p.circle(50, 50, 29, { w: 0.5, detail: true });
    });
    p.at(50, 50, 0.07 * M.wave(t, 2), 1 + pop, function () {
      if (p.small) { p.dot(0, 0, 8, 'ink'); return; }
      p.move(-1.5, 0.5);
      p.path('M-21 8 L-21 -8 L-11 8 L-11 -8', { w: 1.35, cap: 'round' });
      p.path('M4 -8 L-5 -8 L-5 8 L4 8 M-5 0 L2 0', { w: 1.35, cap: 'round' });
      p.path('M9 -8 L12.5 8 L16.5 -2 L20.5 8 L24 -8', { w: 1.35, cap: 'round' });
    });
  }
});

/* a flame: the tip leans and the left tongue licks, the inner flame breathing, embers leaving by shrinking.
   Tap: it flares, taller and wider, and throws sparks. */
D.add('hot', {
  fam: 'signals', tags: ['fire', 'flame', 'trending', 'popular', 'burning', 'heat', 'spicy', '🔥'], loop: 1.8, still: 0.3, burst: 'ember', burstAt: [50, 24], burstN: 8, burstSpread: 2.4, tapLen: 1.2, margin: [24, 18, 12, 18],
  about: 'the tip leans and the left tongue licks, the inner flame breathing, embers shrinking away', tapAbout: 'flares taller and wider and throws sparks',
  draw: function (p, t, s) {
    var sw = M.wave(t, 1), a = M.wave(t, 2, 0.1), b = M.wave(t, 3, 0.35), fl = s.tap >= 0 ? M.spring(M.seg(s.tap, 0, 0.35)) * (1 - M.easeIn(M.seg(s.tap, 0.6, 1))) : 0;
    p.push(); p.move(50, 90); p.skew(0.07 * sw, 0); p.size(1 + 0.16 * fl, 1 + 0.3 * fl); p.move(-50, -90);
    var tx = 50 + 5 * sw + 2 * a;
    p.path('M' + tx + ' 8 C' + (54 + 4 * sw) + ' 26 ' + (76 + 2 * a) + ' 36 76 60 C76 76 64 90 50 90 C36 90 24 76 24 60 C24 50 29 42 ' + (35 + 3 * b) + ' ' + (33 + 2 * a) + ' C35 44 39 48 43 48 C41 32 ' + (44 + 3 * sw) + ' 18 ' + tx + ' 8 Z', { fill: 'orange' });
    p.pivot(50, 90, 0, [1, 1 + 0.1 * M.wave(t, 3)], function () {
      p.path('M50 46 C55 56 64 62 64 74 C64 82 58 90 50 90 C42 90 36 82 36 74 C36 64 46 58 50 46 Z', { fill: 'yellow', w: 0.7 });
      p.blob(50, 82, 6, { fill: 'cream', line: false, seed: 4 });
    });
    p.pop();
    [[0, 36, 2.2], [0.38, 62, 1.8], [0.7, 44, 2.4]].forEach(function (e) {
      var ph = M.frac(t + e[0]), r = e[2] * (1 - M.easeIn(M.seg(ph, 0.4, 1)));
      if (r > 0.3) p.dot(e[1] + 6 * sin(TAU * (ph + e[0])), 52 - 52 * ph, r, 'flame');
    });
  }
});

/* a triangle road sign on its post sways a little while the dot of the exclamation hops.
   Tap: the sign is kicked and wobbles hard on its post, rays flaring from its top. */
D.add('warning', {   /* stylecheck: allow — the glyph's name */
  fam: 'signals', tags: ['alert', 'careful', 'attention', 'hazard', 'sign', 'problem', 'heads up', '⚠'], loop: 1.6, still: 0.3, burst: false, tapLen: 1.4,
  about: 'a triangle sign sways on its post while the dot of the exclamation hops', tapAbout: 'kicked: wobbles hard on its post, rays flaring from the top',
  draw: function (p, t, s) {
    var u = s.tap, ang = 0.06 * M.wave(t, 1) + 0.45 * ring(u, 2.5), hop = 4 * M.bump(M.seg(M.frac(t * 2), 0.1, 0.5)), pop = u >= 0 ? M.bump(M.seg(u, 0, 0.4)) : 0;
    p.line(38, 94, 62, 94, { w: 0.9 });
    p.pivot(50, 94, ang, 1, function () {
      p.line(50, 64, 50, 94, { w: 1.5 });
      p.path('M44 14 Q50 8 56 14 L86 61 Q90 68 82 68 L18 68 Q10 68 14 61 Z', { fill: pop > 0.3 ? 'orange' : 'yellow' });
      p.line(50, 31 - 3 * pop, 50, 48, { w: 2.1, cap: 'round' });
      p.dot(50, 57 - hop - 5 * pop, 3.4 + pop, 'ink');
    });
    if (u >= 0) [-0.9, 0, 0.9].forEach(function (a, i) {
      var v = M.seg(u, 0.05 + i * 0.04, 0.5), ca = -PI / 2 + a;
      p.span('M' + (50 + 52 * cos(ca)) + ' ' + (44 + 52 * sin(ca)) + ' L' + (50 + 66 * cos(ca)) + ' ' + (44 + 66 * sin(ca)), M.easeIn(M.seg(v, 0.5, 1)), M.easeOut(M.seg(v, 0, 0.5)), { w: 0.8, ink: 'orange' });
    });
  }
});

/* a round "i" badge: the dot of the i hops twice a loop, landing with a squash.
   Tap: the dot leaps clear out of the badge, comes back with a big squash, and a ripple leaves the rim. */
D.add('info', {
  fam: 'signals', tags: ['information', 'about', 'help', 'details', 'note', 'tip', 'hint', 'ℹ'], loop: 1.8, still: 0.3, burst: false, tapLen: 1.3, margin: [34, 18, 18, 18],
  about: 'the dot of the i hops twice a loop, landing with a squash', tapAbout: 'the dot leaps clear out of the badge and lands with a big squash, a ripple leaving the rim',
  draw: function (p, t, s) {
    var f = M.frac(t * 2), hop = 7 * M.bump(M.seg(f, 0, 0.45)), sq = M.bump(M.seg(f, 0.45, 0.6)) * 0.35, u = s.tap, w = tapw(s, 0.08, 0.9), bsq = 0, rp = 0;
    if (u >= 0) {
      var jump = M.bump(M.seg(u, 0.04, 0.5)); hop = hop * (1 - w) + 38 * jump * w; sq = sq * (1 - w) + (M.bump(M.seg(u, 0.5, 0.64)) * 0.7) * w;
      bsq = M.bump(M.seg(u, 0.5, 0.66)); rp = M.seg(u, 0.5, 1);
    }
    p.pivot(50, 88, 0, [1 + 0.05 * bsq, 1 - 0.07 * bsq], function () {
      p.circle(50, 54, 36, { fill: 'sky' });
      p.rect(45, 48, 10, 26, { fill: 'ink', r: 3 });
      p.pivot(50, 42, 0, [1 + sq * 0.8, 1 - sq], function () { p.dot(50, 36 - hop, 5.8, 'ink'); });
    });
    if (rp > 0 && rp < 1) p.span(oval(50, 54, 36 + 18 * M.easeOut(rp), 36 + 18 * M.easeOut(rp)), M.easeIn(M.seg(rp, 0.3, 1)), 1, { w: 0.6, ink: 'sea' });
  }
});

/* a plug that has come out of its socket tries to go back and sparks across the gap, then jerks away.
   Tap: it rams home, sparks fly, and it is thrown out again. */
D.add('error', {
  fam: 'signals', tags: ['unplugged', 'offline', 'disconnected', 'failed', 'broken', 'no connection', 'oops', '⚡'], loop: 1.8, still: 0.4, burst: 'spark', burstAt: [58, 50], burstN: 6, burstSpread: 3.4, tapLen: 1.2, margin: [18, 18, 18, 24],
  about: 'a plug tries to go back into its socket, sparks across the gap, and jerks away', tapAbout: 'it rams home, sparks fly, and it is thrown out again',
  draw: function (p, t, s) {
    var dx = track(t, [[0, -4], [0.16, -4], [0.3, 6], [0.38, 7], [0.5, -8], [0.62, -4], [1, -4]]), sp = M.bump(M.seg(t, 0.26, 0.44)), u = s.tap, w = tapw(s, 0.06, 0.9);
    if (u >= 0) {
      var td = u < 0.25 ? M.lerp(-4, 13, M.easeIn(u / 0.25)) : u < 0.45 ? M.lerp(13, -17, M.easeOut(M.seg(u, 0.25, 0.45))) : -4 - 13 * (1 - M.ease(M.seg(u, 0.45, 0.95)));
      dx = dx * (1 - w) + td * w; sp = sp * (1 - w) + Math.max(M.bump(M.seg(u, 0.14, 0.34)), M.bump(M.seg(u, 0.24, 0.5))) * w;
    }
    p.rect(62, 28, 30, 44, { fill: 'sand', r: 8 });
    p.rect(63, 38, 7, 6, { fill: 'ink', r: 1.5, w: 0.4 }); p.rect(63, 56, 7, 6, { fill: 'ink', r: 1.5, w: 0.4 });
    p.path('M' + (10 + dx) + ' 50 C' + (-2 + dx * 0.5) + ' 50 ' + (4 - dx * 0.2) + ' 78 4 90', { w: 1.1 });
    p.rect(10 + dx, 32, 28, 36, { fill: 'a', r: 9 });
    p.rect(38 + dx, 38, 14, 6, { fill: 'grey', r: 1.5, w: 0.9 }); p.rect(38 + dx, 56, 14, 6, { fill: 'grey', r: 1.5, w: 0.9 });
    p.line(18 + dx, 42, 18 + dx, 58, { w: 0.5, detail: true });
    if (sp > 0.12) [41, 59].forEach(function (y, j) {
      var x0 = 52 + dx, zz = 'M' + x0 + ' ' + y + ' L' + (x0 + 3) + ' ' + (y - 4 + j * 2) + ' L' + (x0 + 6) + ' ' + (y + 3 - j * 2) + ' L62 ' + y;
      p.draw(zz, M.easeOut(sp), { w: 0.9, ink: 'orange', cap: 'round' });
    });
    if (sp > 0.3) p.star(57 + dx * 0.5, 50, 9 * sp, 3 * sp, 6, { fill: 'yellow', w: 0.6 });
  }
});

/* a checkbox is ticked: the tick is drawn in one stroke, the box pops, and later the tick is taken back.
   Tap: the tick is wiped and drawn again bolder, with a ring leaving the box. */
D.add('done', {
  fam: 'signals', tags: ['check', 'complete', 'finished', 'tick', 'task', 'todo', 'ok', 'checkbox', '✅'], loop: 2.6, still: 0.5, burst: 'spark', burstAt: [84, 20], burstN: 4, burstSpread: 3, tapLen: 1.2,
  about: 'a checkbox is ticked in one stroke, the box popping; later the tick is taken back', tapAbout: 'the tick is wiped and drawn again bolder, a ring leaving the box',
  draw: function (p, t, s) {
    var d = 'M26 52 C32 58 37 64 42 74 C50 54 64 36 86 17', a0 = M.easeIn(M.seg(t, 0.78, 0.94)), a1 = M.easeOut(M.seg(t, 0.1, 0.34)), pop = 0.09 * M.bump(M.seg(t, 0.3, 0.44)), u = s.tap, wd = 1.7, rp = 0;
    if (u >= 0) {
      var w = M.ease(M.seg(u, 0.85, 1)), s0 = u < 0.2 ? Math.max(a0, M.easeIn(M.seg(u, 0, 0.2))) : 0, s1 = u < 0.2 ? a1 : M.easeOut(M.seg(u, 0.2, 0.5));
      a0 = M.lerp(s0, a0, w); a1 = M.lerp(s1, a1, w); pop = pop * w + M.spring(M.seg(u, 0.4, 0.7)) * 0.1 * (1 - w); wd = 1.7 + 0.5 * M.bump(M.seg(u, 0.2, 0.9)); rp = M.seg(u, 0.45, 1);
    }
    p.pivot(44, 54, 0, 1 + pop, function () { p.rect(12, 22, 62, 62, { fill: 'white', r: 12 }); });
    p.span(d, a0, a1, { w: wd, ink: 'green', cap: 'round' });
    if (rp > 0 && rp < 1) p.span(oval(43, 53, 31 + 16 * M.easeOut(rp), 31 + 16 * M.easeOut(rp)), M.easeIn(M.seg(rp, 0.3, 1)), 1, { w: 0.55, ink: 'green' });
  }
});

/* a bin whose lid flaps open and shut on its hinge, twice a loop, the second time smaller.
   Tap: the lid lifts and a crumpled ball of paper arcs in and drops inside; the bin takes the weight. */
D.add('trash', {
  fam: 'signals', tags: ['delete', 'bin', 'rubbish', 'remove', 'garbage', 'discard', 'waste', '🗑'], loop: 2.6, still: 0.2, burst: false, tapLen: 1.4, margin: [26, 24, 14, 18],
  about: 'the lid flaps open and shut on its hinge, twice a loop', tapAbout: 'a crumpled ball of paper arcs in and drops inside; the bin takes the weight',
  draw: function (p, t, s) {
    var op = function (a, b, c, d) { return M.easeOut(M.seg(t, a, b)) * (1 - M.easeIn(M.seg(t, c, d))); };
    var o = Math.max(op(0.05, 0.15, 0.34, 0.42), 0.55 * op(0.52, 0.6, 0.7, 0.78)), u = s.tap, sq = 0, e = 0;
    o += 0.1 * o * sin(TAU * 8 * t);
    if (u >= 0) {
      var w = tapw(s, 0.1, 0.85); o = o * (1 - w) + w * M.easeOut(M.seg(u, 0.02, 0.15)) * (1 - M.easeIn(M.seg(u, 0.62, 0.74)));
      sq = M.bump(M.seg(u, 0.5, 0.66)); e = M.seg(u, 0.1, 0.62);
    }
    if (e > 0 && e < 1) {
      var q = M.seg(e, 0, 0.8), bx = M.lerp(98, 52, M.easeOut(q)), by = M.lerp(-8, 38, q * q) - 26 * M.bump(q) + 30 * M.easeIn(M.seg(e, 0.8, 1));
      p.at(bx, by, 6 * e, 1, function () {
        p.blob(0, 0, 9, { fill: 'white', lumpy: 0.22, seed: 5 });
        p.path('M-5 -3 L1 2 L-2 6', { w: 0.4, detail: true }); p.path('M3 -6 L5 -1', { w: 0.4, detail: true });
      });
    }
    p.pivot(50, 88, 0, [1 + 0.05 * sq, 1 - 0.07 * sq], function () {
      p.poly([[24, 40], [76, 40], [70, 88], [30, 88]], { fill: 'smoke' });
      [40, 50, 60].forEach(function (x) { p.line(x + (x - 50) * 0.1, 48, x + (x - 50) * 0.18, 80, { w: 0.45, detail: true }); });
    });
    p.pivot(24, 37, -0.62 * o, 1, function () {
      p.path('M42 29 L44 22 L56 22 L58 29', { w: 0.9 });
      p.rect(20, 29, 60, 9, { fill: 'grey', r: 3.5 });
    });
    if (e > 0.78 && e < 1) [40, 60].forEach(function (x) { p.line(x, 34, x + (x - 50) * 0.3, 26 - 6 * (e - 0.78) * 4, { w: 0.6 }); });
  }
});

/* a bookmark ribbon hangs from a book and flutters, each edge a little behind the other so it twists.
   Tap: it flaps hard and a gold star pops on the ribbon. */
D.add('bookmark', {
  fam: 'signals', tags: ['save', 'favourite', 'ribbon', 'read later', 'book', 'mark', 'saved', '🔖'], loop: 2.4, still: 0.3, burst: false, tapLen: 1.4, margin: [18, 30, 14, 30],
  about: 'a ribbon hangs from a book and flutters, one edge behind the other so it twists', tapAbout: 'it flaps hard and a gold star pops on the ribbon',
  draw: function (p, t, s) {
    var u = s.tap, k = 1 + (u >= 0 ? 1.5 * M.bump(M.seg(u, 0, 0.6)) : 0), edge = function (x0, y, lag) { return x0 + k * 10 * Math.pow((y - 12) / 76, 1.4) * sin(TAU * (t - y / 120 - lag)); };
    var L = [], R = [], C = [], y;
    for (y = 12; y <= 82; y += 7) { L.push([edge(34, y, 0), y]); R.push([edge(66, y, 0.07), y]); C.push([edge(50, y, 0.035), y]); }
    p.poly(L.concat([[edge(34, 90, 0), 90], [edge(50, 76, 0.035), 76], [edge(66, 90, 0.07), 90]], R.reverse()), { fill: 'b' });
    p.curve(C, { w: 0.4, dash: [2.5, 3], detail: true, ink: 'white' });
    p.rect(20, 4, 60, 12, { fill: 'blue', r: 3 });
    p.line(26, 10, 74, 10, { w: 0.4, ink: 'white', detail: true });
    if (u >= 0) {
      var pop = M.spring(M.seg(u, 0.1, 0.45)) * (1 - M.easeIn(M.seg(u, 0.7, 1)));
      if (pop > 0.03) p.at(50, 44, 0.5 * (1 - pop) + 0.2 * sin(TAU * 2 * u), pop, function () { p.star(0, 0, 14, 6, 5, { fill: 'gold', w: 0.9 }); });
    }
  }
});

/* a megaphone shouting: rays leave the bell one after another, the upper ones leading, and the whole thing kicks back a little.
   Tap: it shouts loud: more rays, a hard kick back, and a big exclamation mark thrown out. */
D.add('megaphone', {
  fam: 'signals', tags: ['announce', 'shout', 'broadcast', 'news', 'speak', 'campaign', 'loudspeaker', '📣'], loop: 1.6, still: 0.2, burst: false, tapLen: 1.3, margin: [18, 24, 18, 18],
  about: 'rays leave the bell one after another, the upper ones leading, the whole thing kicking back a little', tapAbout: 'a louder shout: more rays, a hard kick back, a big exclamation mark thrown out',
  draw: function (p, t, s) {
    var u = s.tap, n = u >= 0 ? 7 : 5, kick = -1.5 * M.bump(M.seg(M.frac(t * 2), 0, 0.4)) - (u >= 0 ? 6 * M.bump(M.seg(u, 0, 0.3)) : 0);
    p.push(); p.move(kick, 0.35 * kick);
    p.pivot(30, 56, -0.14, 1, function () {
      p.rect(30, 60, 11, 23, { fill: 'brown', r: 3 });
      p.rect(6, 43, 14, 18, { fill: 'wood', r: 4.5 });
      p.poly([[17, 45], [58, 24], [58, 76], [17, 59]], { fill: 'a' });
      p.path('M36 38 C34 46 34 56 36 64', { w: 0.45, detail: true });
      p.ellipse(58, 50, 7, 26, { fill: 'cream' });
    });
    p.pop();
    for (var i = 0; i < n; i++) {
      var a = (i - (n - 1) / 2) * (n > 5 ? 0.3 : 0.4) - 0.14, ph = M.frac(t * (u >= 0 ? 2 : 1) - i * 0.06), r0 = 20 + 24 * M.easeIn(M.seg(ph, 0.3, 1)), r1 = 20 + 26 * M.easeOut(M.seg(ph, 0, 0.5));
      p.span('M' + (66 + 8 * cos(a)) + ' ' + (50 + 8 * sin(a)) + ' L' + (66 + 50 * cos(a)) + ' ' + (50 + 50 * sin(a)), (r0 - 8) / 42, (r1 - 8) / 42, { w: 0.9, cap: 'round' });
    }
    if (u >= 0) {
      var q = M.spring(M.seg(u, 0.12, 0.5)) * (1 - M.easeIn(M.seg(u, 0.75, 1)));
      if (q > 0.03) p.at(84, 22, 0.35 * sin(TAU * 3 * u), q, function () { p.line(0, -14, 0, 2, { w: 1.9, cap: 'round' }); p.dot(0, 10, 3.2, 'ink'); });
    }
  }
});

/* a little house with a chimney: puffs of smoke rise, swell, and shrink away, each a step behind the one before.
   Tap: the door swings open on a warm room, the window lights, and hearts float from the chimney. */
D.add('home', {
  fam: 'signals', tags: ['house', 'main', 'start', 'index', 'dwelling', 'landing', 'return', '🏠'], loop: 2.4, still: 0.3, burst: 'heart', burstAt: [69, 18], burstN: 3, burstSpread: 1.4, tapLen: 1.5, margin: [34, 18, 14, 18],
  about: 'smoke puffs rise from the chimney, swell, and shrink away', tapAbout: 'the door swings open on a warm room, the window lights, hearts float from the chimney',
  draw: function (p, t, s) {
    var u = s.tap, open = u >= 0 ? M.spring(M.seg(u, 0.05, 0.4)) * (1 - M.easeIn(M.seg(u, 0.75, 1))) : 0, lit = u >= 0 ? M.ease(M.seg(u, 0.05, 0.25)) * (1 - M.ease(M.seg(u, 0.8, 1))) : 0;
    p.rect(64, 22, 11, 26, { fill: 'brown', r: 1.5 });
    p.rect(24, 50, 52, 38, { fill: 'cream' });
    p.poly([[12, 53], [50, 16], [88, 53]], { fill: 'b', w: 1.1 });
    p.rect(30, 58, 12, 12, { fill: lit > 0.5 ? 'yellow' : 'sky', r: 1.5, w: 0.9 });
    p.line(36, 58, 36, 70, { w: 0.4, detail: true }); p.line(30, 64, 42, 64, { w: 0.4, detail: true });
    p.path('M47 88 L47 68 C47 62 60 62 60 68 L60 88', { fill: lit > 0 ? 'yellow' : 'wood', line: false });
    p.pivot(47, 76, 0, [Math.max(0.12, 1 - 0.85 * Math.min(1, open)), 1], function () { p.path('M47 88 L47 68 C47 62 60 62 60 68 L60 88 Z', { fill: 'wood' }); p.dot(57, 78, 1.2, 'ink'); });
    [[0, 0], [0.34, 1], [0.68, 2]].forEach(function (e) {
      var ph = M.frac(t + e[0]), r = (3 + 6 * ph) * (1 - M.easeIn(M.seg(ph, 0.6, 1)));
      if (r > 0.6) p.blob(69 + 13 * ph + 3 * sin(TAU * (ph + e[0])), 16 - 40 * ph, r, { fill: 'white', lumpy: 0.2, seed: e[1] + 2, w: 0.7 });
    });
  }
});

/* a shopping cart rolls on the spot, wheels turning, the ground ticking past beneath.
   Tap: an apple drops into the basket and the cart bounces on its wheels. */
D.add('cart', {
  fam: 'signals', tags: ['shop', 'basket', 'buy', 'store', 'checkout', 'trolley', 'add to cart', '🛒'], loop: 1.6, still: 0.1, burst: false, tapLen: 1.2, margin: [26, 18, 8, 18],
  about: 'rolls on the spot, wheels turning, the ground ticking past', tapAbout: 'an apple drops into the basket and the cart bounces on its wheels',
  draw: function (p, t, s) {
    var u = s.tap, bob = 1.2 * sin(TAU * 3 * t) + (u >= 0 ? 4 * M.bump(M.seg(u, 0.45, 0.7)) : 0), sq = u >= 0 ? M.bump(M.seg(u, 0.4, 0.58)) : 0;
    for (var k = 0; k < 3; k++) { var ph = M.frac(t + k / 3), len = 14 * M.bump(ph); if (len > 1) p.line(92 - 84 * ph, 93, 92 - 84 * ph + len, 93, { w: 0.45, detail: true }); }
    if (u >= 0 && u < 0.5) p.at(58, M.lerp(-16, 36, M.easeIn(M.seg(u, 0.05, 0.5))), 0.5 * u, 1, function () {
      p.circle(0, 0, 8, { fill: 'red' }); p.path('M0 -7 C0 -11 3 -13 5 -12', { w: 0.7 }); p.path('M1 -9 C4 -13 8 -11 8 -9 C5 -8 2 -8 1 -9 Z', { fill: 'leaf', w: 0.5 });
    });
    p.pivot(50, 70, 0.015 * sin(TAU * 3 * t + 1), 1, function () {
      p.move(0, -bob);
      p.pivot(56, 58, 0, [1 + 0.04 * sq, 1 - 0.07 * sq], function () {
        p.poly([[22, 28], [90, 28], [80, 58], [32, 58]], { fill: 'cream' });
        [38, 52, 66, 80].forEach(function (x, i) { p.line(x, 30, x - 1 + i * 0.3 - 2, 56, { w: 0.4, detail: true }); });
        p.line(26, 43, 86, 43, { w: 0.4, detail: true });
      });
      p.path('M6 14 L20 14 L27 33', { w: 1.2 });
      p.path('M34 58 L38 70 L82 70 L80 58', { w: 0.9 });
      [[42, 80], [78, 80]].forEach(function (c) {
        p.circle(c[0], c[1], 7.5, { fill: 'smoke' });
        for (var j = 0; j < 3; j++) { var a = TAU * 2 * t + j * PI / 3; p.line(c[0] + 6 * cos(a), c[1] + 6 * sin(a), c[0] - 6 * cos(a), c[1] - 6 * sin(a), { w: 0.4, detail: true }); }
        p.dot(c[0], c[1], 1.6, 'ink');
      });
    });
  }
});

/* a gift box shakes in short bursts, the bow a beat behind the box.
   Tap: the lid pops off in a spin, confetti flies, and the lid drops back on with a bounce. */
D.add('gift', {
  fam: 'signals', tags: ['present', 'surprise', 'reward', 'birthday', 'bonus', 'offer', 'box', '🎁'], loop: 2.4, still: 0.5, burst: 'confetti', burstAt: [50, 44], burstN: 14, burstSpread: 2.8, tapLen: 1.5, margin: [40, 24, 10, 24],
  about: 'the box shakes in short bursts, the bow a beat behind', tapAbout: 'the lid pops off in a spin, confetti flies, and the lid drops back on with a bounce',
  draw: function (p, t, s) {
    var env = M.bump(M.seg(t, 0.04, 0.34)) + 0.6 * M.bump(M.seg(t, 0.52, 0.78)), sh = 0.05 * env * sin(TAU * 7 * t), bow = 0.1 * env * sin(TAU * 7 * t - 0.9), u = s.tap, lx = 0, ly = 0, lr = 0, sq = 0;
    if (u >= 0) {
      var up = M.easeOut(M.seg(u, 0.05, 0.3)), dn = M.easeIn(M.seg(u, 0.4, 0.62)), bn = M.bump(M.seg(u, 0.62, 0.78));
      ly = -44 * up * (1 - dn) - 4 * bn; lx = 10 * up * (1 - dn); lr = 0.9 * up * (1 - dn); sq = M.bump(M.seg(u, 0.05, 0.2)) * 0.5 + M.bump(M.seg(u, 0.6, 0.72)) * 0.8; sh *= 1 - tapw(s, 0.1, 0.8);
    }
    p.pivot(50, 88, sh, [1 + 0.04 * sq, 1 - 0.06 * sq], function () {
      p.rect(22, 52, 56, 36, { fill: 'b', r: 3 });
      p.rect(45, 52, 10, 36, { fill: 'a' });
      p.line(26, 58, 74, 58, { w: 0.4, detail: true, ink: 'white' });
      p.push(); p.move(lx, ly);
      p.pivot(50, 46, lr, 1, function () {
        p.pivot(50, 38, bow, 1, function () {
          p.path('M50 38 C38 20 22 24 30 34 C34 40 46 39 50 38 Z', { fill: 'a' });
          p.path('M50 38 C62 20 78 24 70 34 C66 40 54 39 50 38 Z', { fill: 'a' });
          p.circle(50, 38, 4.5, { fill: 'gold' });
        });
        p.rect(17, 38, 66, 14, { fill: 'rose', r: 3 });
        p.rect(45, 38, 10, 14, { fill: 'a' });
        p.circle(50, 38, 4.5, { fill: 'gold' });
      });
      p.pop();
    });
  }
});

/* a speech bubble with three typing dots that hop one after another, the left one leading.
   Tap: the dots shrink away and two lines of words are written in their place, then taken back. */
D.add('chat', {
  fam: 'signals', tags: ['message', 'comment', 'talk', 'reply', 'typing', 'conversation', 'bubble', '💬'], loop: 1.6, still: 0.3, burst: false, tapLen: 1.5,
  about: 'three typing dots hop one after another, the left one leading', tapAbout: 'the dots shrink away and two lines of words are written in their place, then taken back',
  draw: function (p, t, s) {
    var u = s.tap, w = tapw(s, 0.12, 0.85), pulse = u >= 0 ? 1 + 0.05 * M.bump(M.seg(u, 0, 0.3)) : 1;
    p.pivot(30, 84, 0, pulse, function () {
      p.path('M22 16 L78 16 Q90 16 90 28 L90 54 Q90 66 78 66 L46 66 L30 84 L32 66 L22 66 Q10 66 10 54 L10 28 Q10 16 22 16 Z', { fill: 'sky' });
    });
    [0, 1, 2].forEach(function (k) {
      var hop = 8 * M.bump(M.seg(M.frac(t - k * 0.12), 0, 0.4));
      p.dot(32 + 18 * k, 41 - hop, 5.2 * (1 - w), 'ink');
    });
    if (u >= 0) [['M24 33 L76 33', 0.12, 0.4], ['M24 48 L60 48', 0.3, 0.55]].forEach(function (l) {
      p.span(l[0], M.easeIn(M.seg(u, 0.72, 0.9)), M.easeOut(M.seg(u, l[1], l[2])), { w: 1.1, cap: 'round' });
    });
  }
});

/* a speaker sends sound waves out from its cone: each wave leaves as a bright arc that widens and is taken back.
   Tap: it turns up: the speaker jolts, four fat waves go out, and notes fly. */
D.add('sound', {
  fam: 'signals', tags: ['audio', 'volume', 'speaker', 'listen', 'music', 'loud', 'unmute', '🔊'], loop: 1.8, still: 0.2, burst: 'note', burstAt: [58, 34], burstN: 5, burstSpread: 2.4, tapLen: 1.3,
  about: 'waves leave the cone as arcs that widen and are taken back, the speaker pulsing', tapAbout: 'turned up: the speaker jolts, four fat waves go out, and notes fly',
  draw: function (p, t, s) {
    var u = s.tap, big = u >= 0 ? tapw(s, 0.1, 0.8) : 0, jolt = u >= 0 ? M.spring(M.seg(u, 0, 0.3)) * 0.1 : 0, n = big > 0.5 ? 4 : 3;
    p.pivot(30, 50, 0, 1 + 0.025 * M.wave(t, 6) + jolt, function () { p.poly([[10, 40], [26, 40], [46, 22], [46, 78], [26, 60], [10, 60]], { fill: 'a' }); });
    for (var k = 0; k < n; k++) {
      var ph = M.frac(t * (u >= 0 ? 1.5 : 1) + k * 0.31), r = 14 + 32 * ph, half = 0.75 - 0.25 * ph;
      p.span(arcD(46, 50, r, -half, half), M.easeIn(M.seg(ph, 0.55, 1)), M.easeOut(M.seg(ph, 0, 0.3)), { w: 0.9 + 0.7 * big, cap: 'round' });
    }
  }
});

/* a camera: the lens glass catches a turning glint and the aperture breathes, a red light blinking by the shutter.
   Tap: the flash fires, a hard white star in the lens, the body clicking shut. */
D.add('camera', {
  fam: 'signals', tags: ['photo', 'picture', 'snap', 'capture', 'image', 'shoot', 'flash', '📷'], loop: 2.4, still: 0.2, burst: false, tapLen: 1.1, margin: [30, 24, 12, 24],
  about: 'the lens glass catches a turning glint, the aperture breathing, a red light blinking', tapAbout: 'the flash fires, a white star in the lens, the body clicking shut',
  draw: function (p, t, s) {
    var u = s.tap, f = u >= 0 ? M.easeOut(M.seg(u, 0, 0.14)) * (1 - M.easeIn(M.seg(u, 0.14, 0.55))) : 0, click = u >= 0 ? M.bump(M.seg(u, 0.1, 0.3)) : 0;
    p.pivot(50, 58, 0.018 * M.wave(t, 1), [1 - 0.03 * click, 1 - 0.05 * click], function () {
      p.path('M30 34 L36 22 L58 22 L64 34 Z', { fill: 'smoke' });
      p.rect(10, 32, 80, 52, { fill: 'sky', r: 9 });
      p.rect(24, 25, 9, 7, { fill: 'b', r: 2, w: 0.8 });
      p.rect(68, 38, 14, 8, { fill: 'cream', r: 2, w: 0.8 });
      p.circle(50, 60, 20, { fill: 'grey' });
      p.circle(50, 60, 12.5 + 1.2 * M.wave(t, 1), { fill: 'navy', w: 0.9 });
      var a = TAU * t - 1; p.arc(50, 60, 8, a, a + 1, { ink: 'white', w: 0.7, cap: 'round' });
      p.clip(function () { p.circle(50, 60, 12.5); }, function () { shine(p, M.seg(t, 0.6, 0.9), 38, 62, 48, 72); });
      p.dot(46, 56, 2, 'white');
      if (M.wave(t, 1, 0.1) > -0.3) p.dot(80, 74, 2.4, 'red');
    });
    if (f > 0.02) {
      p.star(75, 42, 34 * f, 11 * f, 8, { fill: 'yellow', w: 0.9, rot: 0.2 });
      p.star(50, 60, 22 * f, 3 * f, 4, { fill: 'white', w: 0.5 });
    }
  }
});

/* a light bulb flickers on: off, two stutters, then lit with rays drawn out around it; later the rays are taken back.
   Tap: ping, an idea: the bulb pops, rings go out and a gold star jumps from the top. */
D.add('lightbulb', {
  fam: 'signals', tags: ['idea', 'tip', 'light', 'bright', 'insight', 'lamp', 'suggestion', '💡'], loop: 2.8, still: 0.6, burst: 'spark', burstAt: [50, 20], burstN: 5, burstSpread: 3.4, tapLen: 1.3, margin: [34, 24, 10, 24],
  about: 'flickers on with two stutters, rays drawn out around it, and later taken back', tapAbout: 'ping, an idea: the bulb pops, rings go out and a gold star jumps from the top',
  draw: function (p, t, s) {
    var win = function (a, b) { return t > a && t < b ? 1 : 0; }, main = M.easeOut(M.seg(t, 0.38, 0.5)), fl = Math.max(win(0.18, 0.22), win(0.27, 0.3));
    var lit = Math.max(fl, main > 0.05 && t < 0.88 ? 1 : 0), ra = Math.max(main, fl * 0.3), u = s.tap, pop = 0, w = u >= 0 ? tapw(s, 0.1, 0.85) : 0;
    if (u >= 0) { lit = Math.max(lit, w > 0.2 ? 1 : 0); ra = Math.max(ra * (1 - w), w); pop = M.spring(M.seg(u, 0.02, 0.4)) * 0.14 * (1 - M.easeIn(M.seg(u, 0.7, 1))); }
    for (var i = 0; i < 9; i++) {
      var a = -2.7 + i * 0.28, r1 = 46 + (i % 2 ? 0 : 5);
      p.span('M' + (50 + 36 * cos(a)) + ' ' + (40 + 36 * sin(a)) + ' L' + (50 + r1 * cos(a)) + ' ' + (40 + r1 * sin(a)), M.easeIn(M.seg(t, 0.78 + i * 0.012, 0.9)) * (1 - w), M.easeOut(M.seg(ra, i * 0.03, 0.55 + i * 0.03)), { w: 0.9, cap: 'round', ink: 'a' });
    }
    p.pivot(50, 74, 0, 1 + pop, function () {
      p.path('M50 12 C30 12 22 28 22 42 C22 54 30 60 34 68 L34 74 L66 74 L66 68 C70 60 78 54 78 42 C78 28 70 12 50 12 Z', { fill: lit ? 'yellow' : 'cream' });
      p.path('M42 68 L42 52 C42 46 46 46 46 52 C46 58 54 58 54 52 C54 46 58 46 58 52 L58 68', { w: 0.7, ink: lit ? 'orange' : 'grey', detail: true });
      p.path('M30 28 C28 34 28 38 29 42', { ink: 'white', w: 0.6, detail: true });
      p.rect(35, 76, 30, 6, { fill: 'grey', r: 2 }); p.rect(37, 83, 26, 5, { fill: 'grey', r: 2 }); p.rect(44, 89, 12, 5, { fill: 'ink', r: 2.5 });
    });
    if (u >= 0) {
      [0, 1].forEach(function (k) { var v = M.seg(u, 0.1 + k * 0.12, 0.6 + k * 0.12); if (v > 0 && v < 1) p.span(oval(50, 42, 34 + 22 * M.easeOut(v), 34 + 22 * M.easeOut(v)), M.easeIn(M.seg(v, 0.3, 1)), 1, { w: 0.6, ink: 'a' }); });
      var st = M.spring(M.seg(u, 0.12, 0.5)) * (1 - M.easeIn(M.seg(u, 0.75, 1)));
      if (st > 0.03) p.at(50, -2 - 6 * M.bump(M.seg(u, 0.12, 0.5)), 0.3 * sin(TAU * 2 * u), st, function () { p.star(0, 0, 10, 4.2, 5, { fill: 'gold', w: 0.8 }); });
    }
  }
});

/* a switch: the knob teases toward the other side and rocks back. Taps toggle it: the knob slides across,
   stretching, overshoots, and a ring leaves it. */
D.add('toggle', {
  fam: 'signals', tags: ['switch', 'on', 'off', 'setting', 'enable', 'disable', 'slider'], loop: 2.4, still: 0.2, burst: false, tapLen: 1, tapRest: 1,
  about: 'a switch; the knob teases toward the other side and rocks back', tapAbout: 'toggles: the knob slides across stretching, overshoots, and a ring leaves it',
  draw: function (p, t, s) {
    var cur = s.taps % 2, pos = cur, u = s.tap, w = tapw(s, 0.1, 0.9), sq = 0, rp = 0;
    var tease = (cur ? -1 : 1) * 5 * (M.bump(M.seg(t, 0.1, 0.26)) + 0.6 * M.bump(M.seg(t, 0.34, 0.46))) * (1 - w);
    if (u >= 0) { pos = M.lerp(1 - cur, cur, M.spring(M.seg(u, 0.05, 0.55))); sq = M.bump(M.seg(u, 0.05, 0.5)); rp = M.seg(u, 0.4, 1); }
    var x = 32 + 36 * pos + tease, xe = cur ? 68 : 32;
    p.rect(10, 28, 80, 44, { fill: pos > 0.5 ? 'leaf' : 'smoke', r: 22 });
    if (pos > 0.5) p.line(28, 42, 28, 58, { w: 0.9, ink: 'white', cap: 'round', detail: true }); else p.circle(70, 50, 6, { w: 0.8, ink: 'grey', detail: true });
    p.pivot(x, 50, 0, [1 + 0.28 * sq, 1 - 0.1 * sq], function () { p.circle(x, 50, 16, { fill: 'white' }); });
    if (rp > 0 && rp < 1) p.span(oval(xe, 50, 16 + 16 * M.easeOut(rp), 16 + 16 * M.easeOut(rp)), M.easeIn(M.seg(rp, 0.3, 1)), 1, { w: 0.6, ink: pos > 0.5 ? 'leaf' : 'grey' });
  }
});

/* a power symbol standing by in grey, a spark circling its ring. Taps toggle it: the stem is pressed, the ring
   draws itself round in green and rays flare; turned off, it all drains away. */
D.add('power', {
  fam: 'signals', tags: ['on', 'off', 'start', 'shutdown', 'standby', 'switch', 'button', '⏻'], loop: 2, still: 0.3, burst: false, tapLen: 1.2, tapRest: 1,
  about: 'a power symbol standing by in grey with a spark circling the ring; on, it is green with rays shimmering', tapAbout: 'toggles: the stem is pressed, the ring draws round in green and rays flare, or it all drains away',
  draw: function (p, t, s) {
    var cur = s.taps % 2, pr = cur, u = s.tap, press = 0, g = 0.62, half = (TAU - 2 * g) / 2, base = { w: 1.6, ink: 'grey', cap: 'round' }, on = { w: 1.9, ink: 'leaf', cap: 'round' };
    if (u >= 0) { pr = M.lerp(1 - cur, cur, M.ease(M.seg(u, 0.1, 0.65))); press = 5 * M.bump(M.seg(u, 0, 0.3)); }
    p.arc(50, 54, 26, -PI / 2 + g, -PI / 2 + g + 2 * half, base);
    p.line(50, 18 + press, 50, 52, base);
    if (pr > 0.02) {
      p.arc(50, 54, 26, -PI / 2 + g, -PI / 2 + g + half * pr, on);
      p.arc(50, 54, 26, -PI / 2 - g - half * pr, -PI / 2 - g, on);
      p.draw('M50 ' + (18 + press) + ' L50 52', Math.min(1, pr * 1.6), on);
      for (var i = 0; i < 10; i++) {
        var a = i * TAU / 10 + 0.15, l = 38 + 9 * (0.55 + 0.45 * M.wave(t, 2, i * 0.1)) * pr;
        p.line(50 + 37 * cos(a), 54 + 37 * sin(a), 50 + l * cos(a), 54 + l * sin(a), { w: 0.7, ink: 'leaf', cap: 'round', detail: true });
      }
    }
    var a2 = -PI / 2 + g + TAU * t; p.dot(50 + 26 * cos(a2), 54 + 26 * sin(a2), 2.4 + pr * 0.8, pr > 0.5 ? 'leaf' : 'ink');
  }
});

/* a play button: the triangle leans forward and a ring leaves the button each loop; paused, the two bars bob
   one after the other. Taps toggle: the triangle melts into the bars, or back, with a squash and a ripple. */
D.add('play', {
  fam: 'signals', tags: ['media', 'start', 'pause', 'video', 'audio', 'resume', 'button', '▶'], loop: 1.8, still: 0.3, burst: false, tapLen: 1, tapRest: 1,
  about: 'the triangle leans forward and a ring leaves the button; paused, the bars bob one after the other', tapAbout: 'toggles: the triangle melts into two bars, or back, with a squash and a ripple',
  draw: function (p, t, s) {
    var cur = s.taps % 2, pos = cur, u = s.tap, sq = 0, rp = M.seg(t, 0.1, 0.7);
    if (u >= 0) { pos = M.lerp(1 - cur, cur, M.spring(M.seg(u, 0.05, 0.5))); sq = M.bump(M.seg(u, 0.05, 0.4)); rp = M.seg(u, 0.35, 1); }
    var L0 = [[37, 32], [50, 39.55], [50, 60.45], [37, 68]], L1 = [[35, 32], [46, 32], [46, 68], [35, 68]], R0 = [[50, 39.55], [68, 50], [68, 50], [50, 60.45]], R1 = [[54, 32], [65, 32], [65, 68], [54, 68]];
    var mix = function (a, b, dx, dy) { return a.map(function (q, i) { return [M.lerp(q[0], b[i][0], pos) + dx, M.lerp(q[1], b[i][1], pos) + dy]; }); };
    var lean = 2 * M.wave(t, 2) * (1 - pos), bl = 2 * M.wave(t, 2) * pos, br = 2 * M.wave(t, 2, 0.12) * pos;
    if (rp > 0 && rp < 1) p.span(oval(50, 50, 38 + 14 * M.easeOut(rp), 38 + 14 * M.easeOut(rp)), M.easeIn(M.seg(rp, 0.3, 1)), 1, { w: 0.6, ink: 'b' });
    p.pivot(50, 50, 0, [1 - 0.05 * sq, 1 - 0.05 * sq], function () {
      p.circle(50, 50, 38, { fill: 'b' });
      if (pos < 0.04) p.poly([[37 + lean, 32], [68 + lean, 50], [37 + lean, 68]], { fill: 'white', w: 0.9 });
      else { p.poly(mix(L0, L1, lean, bl), { fill: 'white', w: 0.9 }); p.poly(mix(R0, R1, lean, br), { fill: 'white', w: 0.9 }); }
    });
  }
});

/* three bars of a menu slide in turn, the top one leading. Taps toggle: the top and bottom bars swing to a cross
   as the middle one shrinks away, and swing back. */
D.add('menu', {
  fam: 'signals', tags: ['hamburger', 'navigation', 'list', 'close', 'drawer', 'options', 'burger', '☰'], loop: 2, still: 0.3, burst: false, tapLen: 1, tapRest: 1,
  about: 'three bars slide in turn, the top one leading', tapAbout: 'toggles: top and bottom bars swing to a cross as the middle one shrinks away, or back',
  draw: function (p, t, s) {
    var cur = s.taps % 2, e = cur;
    if (s.tap >= 0) e = M.lerp(1 - cur, cur, M.spring(M.seg(s.tap, 0.05, 0.55)));
    var ec = Math.max(0, Math.min(1, e));
    ['a', 'c', 'b'].forEach(function (col, k) {
      var half = k === 1 ? M.lerp(20, 0, ec) : 28, ang = (k === 0 ? 1 : k === 2 ? -1 : 0) * PI / 4 * e + 0.05 * e * M.wave(t, 1), sl = (1 - ec) * 5 * M.wave(t, 1, k * 0.12);
      if (half > 1.5) p.at(50 + sl, M.lerp(26 + 24 * k, 50, e), ang, 1, function () { p.line(-half, 0, half, 0, { w: 1.5, ink: col, cap: 'round' }); });
    });
  }
});

/* a scanner: a green line sweeps up and down a code between four corner brackets.
   Tap: the brackets close in with a click and a tick is drawn on the code, then taken back. */
D.add('scan', {
  fam: 'signals', tags: ['qr', 'code', 'barcode', 'read', 'detect', 'camera', 'check', 'reader'], loop: 2.2, still: 0.25, burst: false, tapLen: 1.3,
  about: 'a green line sweeps up and down a code between four corner brackets', tapAbout: 'the brackets close in with a click and a tick is drawn on the code, then taken back',
  draw: function (p, t, s) {
    var u = s.tap, w = tapw(s, 0.12, 0.85), pop = u >= 0 ? M.spring(M.seg(u, 0.05, 0.4)) * 0.12 : 0, y = 50 + 28 * M.wave(t, 1), k = 1 - pop;
    p.pivot(50, 50, 0, k, function () {
      p.path('M12 32 L12 12 L32 12', { w: 1.5, cap: 'round' }); p.path('M68 12 L88 12 L88 32', { w: 1.5, cap: 'round' });
      p.path('M12 68 L12 88 L32 88', { w: 1.5, cap: 'round' }); p.path('M68 88 L88 88 L88 68', { w: 1.5, cap: 'round' });
      [[28, 28], [56, 28], [28, 56]].forEach(function (c) { p.rect(c[0], c[1], 16, 16, { w: 0.9 }); p.rect(c[0] + 5, c[1] + 5, 6, 6, { fill: 'ink', line: false }); });
      [[56, 56], [66, 60], [58, 66], [68, 70], [48, 50]].forEach(function (c) { p.rect(c[0], c[1], 6, 6, { fill: 'ink', line: false, detail: true }); });
    });
    if (w < 0.5) { p.rect(16, y - 6, 68, 12, { fill: 'leaf', line: false, alpha: 0.22, detail: true }); p.line(14, y, 86, y, { w: 1.1, ink: 'leaf', cap: 'round' }); }
    if (u >= 0) {
      var d = M.spring(M.seg(u, 0.1, 0.4)) * (1 - M.easeIn(M.seg(u, 0.8, 1)));
      p.pivot(50, 50, 0, Math.max(0.01, d), function () { p.circle(50, 50, 24, { fill: 'white' }); });
      p.span('M37 51 L46 60 L64 38', M.easeIn(M.seg(u, 0.72, 0.9)), M.easeOut(M.seg(u, 0.25, 0.5)), { w: 2.1, ink: 'green', cap: 'round' });
    }
  }
});

/* a microphone with a recording light blinking and three level bars bouncing out of step.
   Tap: the mic rocks, the bars shoot to the top and notes fly. */
D.add('mic', {
  fam: 'signals', tags: ['record', 'voice', 'audio', 'speak', 'listen', 'dictate', 'podcast', '🎤'], loop: 1.6, still: 0.3, burst: 'note', burstAt: [34, 20], burstN: 4, burstSpread: 2.4, tapLen: 1.2,
  about: 'a recording light blinks and three level bars bounce out of step', tapAbout: 'the mic rocks, the bars shoot to the top and notes fly',
  draw: function (p, t, s) {
    var u = s.tap, k = tapw(s, 0.1, 0.8), tilt = 0.12 * ring(u, 3);
    p.pivot(34, 86, tilt, 1, function () {
      p.path('M20 42 C20 66 48 66 48 42', { w: 1.2 });
      p.line(34, 62, 34, 84, { w: 1.2 }); p.line(21, 87, 47, 87, { w: 1.4, cap: 'round' });
      p.rect(24, 10, 20, 44, { fill: 'grey', r: 10 });
      [22, 30, 38].forEach(function (y) { p.line(28, y, 40, y, { w: 0.4, detail: true }); });
    });
    [0, 1, 2].forEach(function (i) {
      var lv = Math.min(1, 0.22 + 0.5 * (0.5 + 0.5 * M.wave(t, 2, i * 0.27 + 0.1)) + 0.6 * k);
      p.line(64 + 12 * i, 80, 64 + 12 * i, 80 - 56 * lv, { w: 1.2, ink: lv > 0.85 ? 'red' : 'leaf', cap: 'round' });
    });
    p.dot(80, 14, (2.6 + 1.4 * (0.5 + 0.5 * M.wave(t, 1))) * (1 + 0.5 * k), 'red');
  }
});

/* three nodes joined by lines, small packets running out from the left one to the other two, one line a step behind.
   Tap: the two far nodes pop one after the other and a ring leaves each. */
D.add('share', {
  fam: 'signals', tags: ['send', 'network', 'connect', 'social', 'post', 'forward', 'distribute', 'nodes'], loop: 1.8, still: 0.3, burst: false, tapLen: 1.2,
  about: 'packets run out from the left node to the other two, one line a step behind', tapAbout: 'the two far nodes pop one after the other and a ring leaves each',
  draw: function (p, t, s) {
    var A = [24, 50], N = [[76, 24, 'c'], [76, 76, 'b']], u = s.tap;
    N.forEach(function (n) { p.line(A[0], A[1], n[0], n[1], { w: 1 }); });
    N.forEach(function (n, i) {
      for (var k = 0; k < 2; k++) {
        var ph = M.frac(t + i * 0.13 + k * 0.5), r = 2.9 * M.easeOut(M.seg(ph, 0, 0.15)) * (1 - M.easeIn(M.seg(ph, 0.85, 1)));
        if (r > 0.3) p.dot(M.lerp(A[0], n[0], ph), M.lerp(A[1], n[1], ph), r, 'ink');
      }
    });
    p.circle(A[0], A[1], 11 * (1 + 0.06 * M.wave(t, 2)), { fill: 'a' });
    N.forEach(function (n, i) {
      var pop = u >= 0 ? M.spring(M.seg(u, 0.05 + 0.15 * i, 0.4 + 0.15 * i)) * 0.25 * (1 - M.easeIn(M.seg(u, 0.8, 1))) : 0, v = u >= 0 ? M.seg(u, 0.25 + 0.15 * i, 0.8) : 0;
      p.circle(n[0], n[1], 11 * (1 + pop), { fill: n[2] });
      if (v > 0 && v < 1) p.span(oval(n[0], n[1], 11 + 14 * M.easeOut(v), 11 + 14 * M.easeOut(v)), M.easeIn(M.seg(v, 0.3, 1)), 1, { w: 0.6 });
    });
  }
});

/* two sheets, and a dashed outline of the front one slides out from it and back, a copy being made.
   Tap: the front sheet stamps down and a copy flies off to the upper right, shrinking away. */
D.add('copy', {
  fam: 'signals', tags: ['duplicate', 'clipboard', 'paste', 'clone', 'document', 'sheets', 'copied'], loop: 2.4, still: 0.3, burst: 'spark', burstAt: [60, 50], burstN: 4, burstSpread: 3, tapLen: 1.2, margin: [24, 24, 12, 24],
  about: 'a dashed outline of the front sheet slides out and back, a copy being made', tapAbout: 'the front sheet stamps down and a copy flies off to the upper right, shrinking away',
  draw: function (p, t, s) {
    var g = M.bump(M.seg(t, 0.15, 0.8)), u = s.tap, sq = u >= 0 ? M.bump(M.seg(u, 0.05, 0.3)) : 0, f = u >= 0 ? M.seg(u, 0.12, 0.75) : 0;
    p.rect(14, 10, 46, 58, { fill: 'cream', r: 5 });
    p.line(22, 22, 50, 22, { w: 0.5, detail: true }); p.line(22, 32, 44, 32, { w: 0.5, detail: true });
    p.pivot(59, 61, 0, [1 + 0.03 * sq, 1 - 0.06 * sq], function () {
      p.rect(34, 32, 50, 58, { fill: 'white', r: 5 });
      p.line(42, 46, 76, 46, { w: 0.5, detail: true }); p.line(42, 56, 70, 56, { w: 0.5, detail: true }); p.line(42, 66, 74, 66, { w: 0.5, detail: true });
    });
    if (g > 0.03) p.rect(34 + 13 * g, 32 + 7 * g, 50, 58, { r: 5, dash: [3, 3], w: 0.6, ink: 'b' });
    if (f > 0 && f < 1) {
      var e = M.easeIn(f), k = Math.max(0.02, 1 - M.easeIn(M.seg(f, 0.4, 1)));
      p.push(); p.move(40 * e, -46 * e);
      p.pivot(59, 61, 0.8 * e, k, function () { p.rect(34, 32, 50, 58, { fill: 'white', r: 5 }); p.line(42, 46, 76, 46, { w: 0.5, detail: true }); });
      p.pop();
    }
  }
});

/* a floppy disk whose shutter slides to and fro while lines are written on its label and wiped.
   Tap: the disk nods down and a green tick is drawn across it, then taken back. */
D.add('save', {
  fam: 'signals', tags: ['floppy', 'disk', 'store', 'keep', 'write', 'saved', 'persist'], loop: 2.4, still: 0.5, burst: false, tapLen: 1.3,
  about: 'the shutter slides to and fro while lines are written on the label and wiped', tapAbout: 'the disk nods down and a green tick is drawn across it, then taken back',
  draw: function (p, t, s) {
    var u = s.tap, nod = u >= 0 ? 5 * M.bump(M.seg(u, 0.05, 0.4)) : 0, sq = u >= 0 ? M.bump(M.seg(u, 0.05, 0.4)) : 0;
    p.push(); p.move(0, nod); p.pivot(50, 86, 0, [1 + 0.03 * sq, 1 - 0.05 * sq], function () {
      p.path('M14 14 L70 14 L86 30 L86 86 L14 86 Z', { fill: 'blue' });
      p.rect(24, 50, 52, 36, { fill: 'white', w: 0.9 });
      [0, 1, 2].forEach(function (k) {
        var d = 'M30 ' + (59 + 9 * k) + ' L' + (66 - 8 * k) + ' ' + (59 + 9 * k);
        p.span(d, M.easeIn(M.seg(t, 0.78 + 0.04 * k, 0.94)), M.easeOut(M.seg(t, 0.1 + 0.14 * k, 0.3 + 0.14 * k)), { w: 0.6, detail: true });
      });
      p.rect(30 + 4 * M.wave(t, 1), 14, 32, 20, { fill: 'grey', r: 2, w: 0.9 });
      p.rect(51 + 4 * M.wave(t, 1), 18, 7, 12, { fill: 'ink', r: 1.5, line: false });
    });
    p.pop();
    if (u >= 0) p.span('M32 66 L46 80 L72 50', M.easeIn(M.seg(u, 0.72, 0.9)), M.easeOut(M.seg(u, 0.2, 0.5)), { w: 2.4, ink: 'green', cap: 'round' });
  }
});

/* a roadside mailbox on its post, the little flag popping up and dropping back, teasing.
   Tap: the flag springs up and a letter slides out of the door and back in. */
D.add('mailbox', {
  fam: 'signals', tags: ['mail', 'post', 'letter', 'inbox', 'message', 'delivery', 'new mail', 'you have mail'], loop: 2.4, still: 0.3, burst: false, tapLen: 1.4, margin: [24, 18, 8, 24],
  about: 'the little flag pops up and drops back, teasing', tapAbout: 'the flag springs up and a letter slides out of the door and back in',
  draw: function (p, t, s) {
    var u = s.tap, f = M.spring(M.seg(t, 0.12, 0.32)) * (1 - M.ease(M.seg(t, 0.55, 0.72))), pk = 0;
    if (u >= 0) { var w = tapw(s, 0.1, 0.85); f = f * (1 - w) + w * M.spring(M.seg(u, 0.05, 0.4)); pk = M.easeOut(M.seg(u, 0.1, 0.4)) * (1 - M.easeIn(M.seg(u, 0.65, 0.85))); }
    var lx = 26 - 26 * pk;
    p.line(26, 93, 70, 93, { w: 0.9 });
    p.rect(42, 62, 12, 31, { fill: 'wood' });
    if (pk > 0.02) { p.rect(lx, 42, 24, 16, { fill: 'white', r: 2 }); p.path('M' + lx + ' 43 L' + (lx + 12) + ' 51 L' + (lx + 24) + ' 43', { w: 0.5, detail: true }); }
    p.path('M18 62 L18 46 C18 30 30 24 44 24 L74 24 L74 62 Z', { fill: 'blue' });
    p.line(27, 33, 27, 57, { w: 0.4, detail: true, ink: 'white' });
    p.pivot(78, 48, 1.75 * (1 - f), 1, function () { p.line(78, 48, 78, 28, { w: 1.1 }); p.rect(78, 26, 14, 9, { fill: 'red', w: 0.8 }); });
  }
});
})(Dingbats);

/* Faces & hands: feelings and gestures. Faces are round and yellow, their features drawn in black so
   they read on the yellow in any theme. A hand is one skin-coloured outline built from limbs: a
   finger is a chain of three bones, each one bending the same way, so a lagging finger curls and
   a stiff one stays straight. */
(function (D) {
'use strict';
var M = D.math, TAU = M.TAU, K = 'black', LIP = '#B8322E';

/* ---------------------------------------------------------------- limbs and hands */
/* a limb from (x, y) heading th (clockwise from up): bone lengths, a bend at each bone, width
   at the base and the tip. Returns the left edge, right edge and tip cap (all from the base). */
function limb(x, y, th, lens, bends, w0, w1) {
  var c = [[x, y]], n = lens.length, a = th, i, L = [], R = [], d0;
  for (i = 0; i < n; i++) { a += bends[i] || 0; c.push([c[i][0] + Math.sin(a) * lens[i], c[i][1] - Math.cos(a) * lens[i]]); }
  for (i = 0; i <= n; i++) {
    var p0 = c[Math.max(0, i - 1)], p1 = c[Math.min(n, i + 1)], dx = p1[0] - p0[0], dy = p1[1] - p0[1], d = Math.hypot(dx, dy) || 1, w = (w0 + (w1 - w0) * i / n) / 2;
    if (i === 0) d0 = [dx / d, dy / d];
    L.push([c[i][0] + dy / d * w, c[i][1] - dx / d * w]); R.push([c[i][0] - dy / d * w, c[i][1] + dx / d * w]);
    if (i === n) { var tip = [], k; for (k = 1; k < 4; k++) { var q = k * Math.PI / 4; tip.push([c[i][0] + (dy / d * Math.cos(q) + dx / d * Math.sin(q)) * w, c[i][1] + (-dx / d * Math.cos(q) + dy / d * Math.sin(q)) * w]); } }
  }
  var bs = [], w0h = w0 / 2;
  [3, 2, 1].forEach(function (k) { var q = k * Math.PI / 4; bs.push([x + (d0[1] * Math.cos(q) - d0[0] * Math.sin(q)) * w0h, y + (-d0[0] * Math.cos(q) - d0[1] * Math.sin(q)) * w0h]); });
  return { l: L, r: R, tip: tip, base: bs, c: c, d0: d0 };
}
/* the web between two neighbouring limbs, a little below where they leave the palm */
function web(a, b, dep) {
  return [(a.r[0][0] + b.l[0][0]) / 2 - (a.d0[0] + b.d0[0]) / 2 * dep, (a.r[0][1] + b.l[0][1]) / 2 - (a.d0[1] + b.d0[1]) / 2 * dep];
}
/* items are [x, y] points on the palm or limbs; one closed outline round them all */
function outline(items) {
  var out = [];
  items.forEach(function (it, k) {
    if (!it.l) { out.push(it); return; }
    var pv = items[k - 1], i;
    if (pv && pv.l) out.push(web(pv, it, it.dep == null ? 2.2 : it.dep));
    for (i = 1; i < it.l.length; i++) out.push(it.l[i]);
    it.tip.forEach(function (q) { out.push(q); });
    for (i = it.r.length - 1; i >= 1; i--) out.push(it.r[i]);
  });
  return out;
}
function skin(p, items, o) { return p.curve(outline(items), Object.assign({ close: true, fill: 'skin', w: 1.05 }, o || {})); }
/* a short crease across a limb at joint j */
function crease(p, f, j, k) {
  var a = f.l[j], b = f.r[j], m = k == null ? 0.3 : k;
  p.line(a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m, b[0] + (a[0] - b[0]) * m, b[1] + (a[1] - b[1]) * m, { ink: K, alpha: 0.5, w: 0.4, detail: true, wob: 0.3 });
}
/* the sleeve: a cuff over the wrist */
function cuff(p, x, y, w, h, c) { p.rect(x - w / 2, y, w, h, { fill: c || 'c', r: 3, w: 1.05 }); p.line(x - w / 2 + 3, y + 3.2, x + w / 2 - 3, y + 3.2, { w: 0.4, detail: true, wob: 0.3 }); }

/* a limb drawn alone, over what is under it: filled, and outlined all round (closed) or open at the base */
function bone(p, f, open, o) {
  var pts = f.l.concat(f.tip, f.r.slice().reverse()); o = o || {};
  p.curve(open ? pts : pts.concat(f.base), { close: true, fill: o.fill || 'skin', line: false });
  p.curve(open ? pts : pts.concat(f.base), Object.assign({ close: !open, w: 1.05 }, o.line || {}));
}
/* a left hand, palm to the viewer, wrist at the origin, fingers up. o.bends: four fingers [b0, b1, b2] each;
   o.spread: 0 together .. 1 fanned (or o.fan, a heading each); o.thumb: heading; o.tb: the thumb's bends;
   o.skip: fingers left out of the outline, to be drawn curled by the caller; o.noThumb: the thumb is the caller's too */
var FB = [[-13.2, -33, 24, 9.2], [-4.4, -35.5, 27.5, 9.2], [4.4, -34.5, 24.5, 8.8], [12.6, -31, 19, 7.8]];
function handItems(o) {
  var sp = o.spread == null ? 0.4 : o.spread, b = o.bends || [], it = [[-10.5, 4], [-15.5, -2.5], [-16.5, -8]], fs = [], thumb = null;
  if (!o.noThumb) { thumb = limb(-14, -11, o.thumb == null ? -0.9 : o.thumb, [11.5, 10.5], o.tb || [0, 0.2], 11, 9); thumb.dep = 0; it.push(thumb); }
  it.push([-16.8, -22.5]);
  FB.forEach(function (f, i) {
    if (o.skip && o.skip[i]) { it.push([f[0], f[1] - 5]); fs.push(null); return; }
    var fan = o.fan ? o.fan[i] : (i - 1.5) * 0.22 * sp, bb = b[i] || [0, 0, 0], g = limb(f[0], f[1], fan, [f[2] * (o.len ? o.len[i] : 1) * 0.46, f[2] * (o.len ? o.len[i] : 1) * 0.3, f[2] * (o.len ? o.len[i] : 1) * 0.24], bb, f[3], f[3] * 0.84);
    fs.push(g); it.push(g);
  });
  it.push([17.4, -23], [16, -8], [11, 4]);
  return { items: it, thumb: thumb, fingers: fs };
}
function openHand(p, o) {
  var h = handItems(o); skin(p, h.items);
  p.path('M-8 -11 C-5 -17 -2 -19 2 -22', { ink: K, alpha: 0.45, w: 0.45, detail: true, wob: 0.3 });
  h.fingers.forEach(function (f) { if (f) crease(p, f, 1); });
  return h;
}
/* a hand with some fingers raised and the rest folded over the palm, the thumb across them.
   o.up: which of the four stand; the rest, and the thumb, are drawn over the palm (o.hold: left bare, o.extra: limbs drawn over the outline) */
function foldHand(p, o) {
  var h = handItems({ spread: o.spread, fan: o.fan, bends: o.bends, len: o.len, noThumb: true, skip: o.up.map(function (u) { return !u; }) }), i;
  skin(p, h.items);
  (o.extra || []).forEach(function (e) { bone(p, e, true); });
  for (i = 3; i >= 0; i--) if (!o.up[i] && !(o.hold && o.hold[i])) { var f = FB[i], c = limb(f[0], f[1] - 4.5 + f[3] / 2, Math.PI, [f[2] * 0.6], [0], f[3], f[3] * 0.92); bone(p, c); crease(p, c, 1, 0.26); }
  var th = limb(-14, -12, o.thumb == null ? 1.15 : o.thumb, [13, 11], o.tb || [0, 0.2], 11, 9); bone(p, th, true);
  h.fingers.forEach(function (f) { if (f) crease(p, f, 1); });
  return h;
}

/* ---------------------------------------------------------------- faces */
/* the round face; draw its features after it, inside one p.pivot so the head moves as one */
function head(p, fill, y, r) {
  p.circle(50, y == null ? 50 : y, r || 40, { fill: fill || 'yellow', w: 1.15 });
  p.path('M20 37 C22 30 27 25 33 22', { ink: 'white', w: 0.8, detail: true, wob: 0.3 });
}
/* an eye that closes: open 1 is round, 0 is a lid line (curving up when up is true) */
function eye(p, x, y, open, o) {
  o = o || {}; var k = o.k || 1, rx = 4.3 * k, ry = 5.8 * k * open, lx = o.lx || 0, ly = o.ly || 0;
  if (open < 0.22) { p.path('M' + (x - rx * 1.4) + ' ' + y + ' Q' + x + ' ' + (y + (o.up ? -4 : 3.6) * k) + ' ' + (x + rx * 1.4) + ' ' + y, { ink: K, w: 1.15, cap: 'round' }); return; }
  p.ellipse(x + lx, y + ly, rx, ry, { fill: K, w: 0.6, ink: K });
  if (open > 0.55 && !o.bare) p.line(x + lx - rx * 0.35, y + ly - ry * 0.4, x + lx - rx * 0.3, y + ly - ry * 0.3, { ink: 'white', w: 0.9, cap: 'round', wob: 0 });
}
function brow(p, x, y, a, len, o) { var c = Math.cos(a) * len / 2, s = Math.sin(a) * len / 2; p.path('M' + (x - c) + ' ' + (y - s) + ' Q' + x + ' ' + (y - ((o && o.arch) == null ? 1.6 : o.arch) + (o && o.dy || 0)) + ' ' + (x + c) + ' ' + (y + s), { ink: K, w: 1.2, cap: 'round' }); }
/* the openness of an eye through a blink: 1 open, 0 shut, the blink starting at a and lasting d */
function blink(t, a, d) { return 1 - M.bump(M.seg(M.frac(t), a, a + (d || 0.07))); }
function cheek(p, x, y, k) { p.ellipse(x, y, 6.2 * (k || 1), 4 * (k || 1), { fill: 'pink', line: false, alpha: 0.75 }); }

/* an open mouth: flat top at y, w half-width, h deep; tongue and teeth when asked */
function gape(p, x, y, w, h, o) {
  o = o || {};
  p.path('M' + (x - w) + ' ' + y + ' L' + (x + w) + ' ' + y + ' C' + (x + w * 0.95) + ' ' + (y + h * 1.35) + ' ' + (x - w * 0.95) + ' ' + (y + h * 1.35) + ' ' + (x - w) + ' ' + y + ' Z', { fill: LIP, w: 1.05, ink: K });
  if (o.tongue !== false && h > 5) p.path('M' + (x - w * 0.5) + ' ' + (y + h * 0.92) + ' C' + (x - w * 0.3) + ' ' + (y + h * 0.5) + ' ' + (x + w * 0.3) + ' ' + (y + h * 0.5) + ' ' + (x + w * 0.5) + ' ' + (y + h * 0.92) + ' C' + (x + w * 0.2) + ' ' + (y + h * 1.12) + ' ' + (x - w * 0.2) + ' ' + (y + h * 1.12) + ' ' + (x - w * 0.5) + ' ' + (y + h * 0.92) + ' Z', { fill: 'pink', line: false });
  if (o.teeth) p.path('M' + (x - w + 1.4) + ' ' + (y + 0.7) + ' L' + (x + w - 1.4) + ' ' + (y + 0.7) + ' L' + (x + w - 2.4) + ' ' + (y + Math.min(5, h * 0.4)) + ' L' + (x - w + 2.4) + ' ' + (y + Math.min(5, h * 0.4)) + ' Z', { fill: 'white', line: false });
}
/* a four-point twinkle that grows from nothing and is taken back; u 0..1 */
function twinkle(p, x, y, r, u, c) {
  var g = M.bump(u) * r; if (g <= 0.2) return;
  p.line(x - g, y, x + g, y, { ink: c || 'a', w: 0.9, cap: 'round' }); p.line(x, y - g, x, y + g, { ink: c || 'a', w: 0.9, cap: 'round' });
}
/* a Z drawn on, then carried away */
function zed(p, x, y, k, rot, u) { p.at(x, y, rot, k, function () { p.draw('M-4 -4 L4 -4 L-4 4 L4 4', u, { w: 0.9, cap: 'round' }); }); }
var DROP = 'M0 -7 C4 -1 5 2 0 6 C-5 2 -4 -1 0 -7 Z', HEART = 'M0 5 C-9 -1 -7 -8 0 -3 C7 -8 9 -1 0 5 Z';

/* points along a polyline between fractions u0 and u1 of its length */
function along(pts, u0, u1, k) {
  var cum = [0], i, j, out = [];
  for (i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  for (j = 0; j <= k; j++) {
    var d = (u0 + (u1 - u0) * j / k) * cum[cum.length - 1], m = 1; while (m < cum.length - 1 && cum[m] < d) m++;
    var f = (d - cum[m - 1]) / ((cum[m] - cum[m - 1]) || 1); out.push([pts[m - 1][0] + (pts[m][0] - pts[m - 1][0]) * f, pts[m - 1][1] + (pts[m][1] - pts[m - 1][1]) * f]);
  }
  return out;
}
/* a filled, outlined tube of width w along a centre line, round at both ends */
function tube(p, c, w, o) {
  var n = c.length, L = [], R = [], h = w / 2, i, k;
  for (i = 0; i < n; i++) { var p0 = c[Math.max(0, i - 1)], p1 = c[Math.min(n - 1, i + 1)], dx = p1[0] - p0[0], dy = p1[1] - p0[1], d = Math.hypot(dx, dy) || 1; L.push([c[i][0] + dy / d * h, c[i][1] - dx / d * h]); R.push([c[i][0] - dy / d * h, c[i][1] + dx / d * h]); }
  var out;
  /* tip caps: three points round the end, forward = along the line */
  function cap(i0, i1) { var a0 = c[i0], b0 = c[i1], fx = b0[0] - a0[0], fy = b0[1] - a0[1], fd = Math.hypot(fx, fy) || 1, r = []; fx /= fd; fy /= fd; for (k = 1; k < 4; k++) { var q = k * Math.PI / 4; r.push([b0[0] + (fy * Math.cos(q) + fx * Math.sin(q)) * h, b0[1] + (-fx * Math.cos(q) + fy * Math.sin(q)) * h]); } return r; }
  out = L.concat(cap(n - 2, n - 1), R.slice().reverse(), cap(1, 0));
  return p.curve(out, Object.assign({ close: true, fill: 'sky', w: 0.8 }, o || {}));
}

/* 👋 a hand waving from the wrist; the fingers lag the palm, each a little behind its neighbour.
   Tap: a big two-wave hello with swooshes either side. */
D.add('wave', {
  fam: 'faces', tapRest: 0.3, tags: ['hello', 'hi', 'bye', 'goodbye', 'greeting', 'hand', 'welcome', '👋'], loop: 2.4, still: 0.1, tapLen: 1.5, burst: false, margin: [16, 20, 4, 20],
  about: 'waves from the wrist, the fingers lagging the palm', tapAbout: 'a big two-wave hello, swooshes either side',
  draw: function (p, t, s) {
    var tp = s.tap >= 0, u = tp ? s.tap : 0, env = tp ? M.bump(M.seg(u, 0, 1)) : 0;
    var amp = 0.3 + 0.2 * env, ph = tp ? 2 * u : 3 * t, A = function (lag) { return amp * Math.sin(TAU * (ph - lag * (tp ? 2 : 3))); };
    var a0 = A(0), bends = [], lift = 6 * M.easeOut(M.seg(u, 0, 0.2)) * (tp ? 1 - M.easeIn(M.seg(u, 0.8, 1)) : 0);
    for (var i = 0; i < 4; i++) { var l1 = 0.02 + i * 0.004, l2 = l1 + 0.016, l3 = l2 + 0.014, a1 = A(l1), a2 = A(l2), a3 = A(l3); bends.push([a1 - a0, a2 - a1, a3 - a2]); }
    var tb = [A(0.02) - a0, A(0.04) - A(0.02) + 0.14];
    p.at(50, 84 - lift, a0, 1.12, function () { openHand(p, { spread: 0.5 + 0.2 * Math.abs(a0) / 0.5, bends: bends, tb: tb }); });
    cuff(p, 50, 82 - lift * 0.3, 28, 17);
    if (tp) {                                         /* swooshes: drawn as the hand passes, taken back after */
      var sw = M.seg(u, 0.05, 0.9);
      [[-1, 0], [1, 0.12]].forEach(function (q) {
        var d = 'M' + (50 + q[0] * 40) + ' 26 C' + (50 + q[0] * 47) + ' 34 ' + (50 + q[0] * 47) + ' 46 ' + (50 + q[0] * 40) + ' 54', k = M.seg(sw, q[1], q[1] + 0.6);
        p.span(d, M.easeIn(M.seg(k, 0.5, 1)), M.easeOut(M.seg(k, 0, 0.6)), { w: 0.8 });
      });
    }
  }
});

/* 🙂 a smile that breathes: the head bobs, the brows lift, one blink. Tap: a grin springs open, eyes crinkled, sparkles. */
D.add('smile', {
  fam: 'faces', tapRest: 0.35, tags: ['happy', 'face', 'glad', 'friendly', 'emoji', 'good', 'nice', '🙂'], loop: 2.8, still: 0.3, tapLen: 1.1, burst: 'spark', burstAt: [50, 55], burstN: 6,
  about: 'the head bobs, brows lift, the smile widens and a blink', tapAbout: 'a grin springs open, eyes crinkled, sparkles',
  draw: function (p, t, s) {
    var g = s.tap >= 0 ? M.spring(M.seg(s.tap, 0, 0.35)) * (1 - M.easeIn(M.seg(s.tap, 0.7, 1))) : 0, bob = M.wave(t, 1), sw = M.wave(t, 1, 0.25);
    p.pivot(50, 70, 0.04 * sw, [1 + 0.05 * g, 1 - 0.03 * g], function () {
      p.move(0, -1.5 * bob - 3 * g);
      head(p); cheek(p, 25, 60, 1 + g * 0.4); cheek(p, 75, 60, 1 + g * 0.4);
      var o = Math.min(blink(t, 0.62), 1 - g);
      brow(p, 35, 33 - 2 * g - 1.4 * M.bump(M.seg(t, 0.1, 0.5)), -0.12, 12); brow(p, 65, 33 - 2 * g - 1.4 * M.bump(M.seg(t, 0.1, 0.5)), 0.12, 12);
      eye(p, 36, 44, o, { up: g > 0.5 }); eye(p, 64, 44, o, { up: g > 0.5 });
      var w = 15 + 3 * M.wave(t, 1, 0.1) + 6 * g, drop = 5 + 2 * M.wave(t, 1, 0.1) + 12 * g;
      if (g > 0.25) p.path('M' + (50 - w - 2) + ' 62 C' + (50 - w) + ' ' + (62 + drop * 1.7) + ' ' + (50 + w) + ' ' + (62 + drop * 1.7) + ' ' + (50 + w + 2) + ' 62 Z', { fill: LIP, w: 1 });
      else p.path('M' + (50 - w) + ' 63 C' + (50 - w * 0.5) + ' ' + (63 + drop) + ' ' + (50 + w * 0.5) + ' ' + (63 + drop) + ' ' + (50 + w) + ' 63', { ink: K, w: 1.25, cap: 'round' });
    });
  }
});

/* ✌ peace: the V opens and closes a hair, the middle finger a beat behind the index; the wrist sways.
   Tap: the V snaps wide and stars glint off the fingertips. */
D.add('peace', {
  fam: 'faces', tags: ['victory', 'two', 'hand', 'v', 'cheers', 'photo', 'gesture', '✌'], loop: 2.6, still: 0.2, tapLen: 1.2, burst: 'star', burstAt: [50, 14], burstN: 5, burstSpread: 1.8, margin: [26, 18, 4, 18],
  about: 'the V opens and closes a hair, the wrist sways', tapAbout: 'the V snaps wide and stars glint off the tips',
  draw: function (p, t, s) {
    var f = s.tap >= 0 ? M.spring(M.seg(s.tap, 0, 0.3)) * (1 - M.easeIn(M.seg(s.tap, 0.7, 1))) : 0;
    var v0 = 0.21 + 0.05 * M.wave(t, 2) + 0.2 * f, v1 = 0.21 + 0.05 * M.wave(t, 2, -0.05) + 0.2 * f;
    p.at(50, 87, 0.1 * M.wave(t, 1) + 0.05 * f, 1.1, function () { foldHand(p, { up: [1, 1, 0, 0], fan: [-v0, v1, 0, 0], len: [1.08, 1.08, 1, 1] }); });
    cuff(p, 50, 85, 28, 16);
  }
});

/* ☝ one finger up, the others folded under the thumb: it jabs the air twice, the tip lagging, then holds.
   Tap: it shoots up and an exclamation mark is drawn over it. */
D.add('point-up', {
  fam: 'faces', tags: ['one', 'up', 'attention', 'remember', 'note', 'idea', 'finger', 'hand', '☝'], loop: 2.2, still: 0.1, tapLen: 1.3, burst: false, margin: [34, 18, 4, 18],
  about: 'jabs the air twice, the tip lagging, then rests', tapAbout: 'shoots up and an exclamation mark is drawn over it',
  draw: function (p, t, s) {
    var tp = s.tap >= 0, u = tp ? s.tap : 0, j = M.bump(M.seg(t, 0, 0.16)) + M.bump(M.seg(t, 0.2, 0.36)), lag = M.bump(M.seg(t, 0.04, 0.2)) + M.bump(M.seg(t, 0.24, 0.4));
    var shot = tp ? M.spring(M.seg(u, 0, 0.3)) * (1 - M.ease(M.seg(u, 0.75, 1))) : 0;
    var up = 4.5 * j + 10 * shot, sw = 0.035 * M.wave(t, 1, 0.1);
    p.at(50, 90 - up, sw - 0.04 * lag, 1.1, function () { foldHand(p, { up: [1, 0, 0, 0], fan: [0, 0, 0, 0], len: [1.25, 1, 1, 1], bends: [[0, 0.1 * lag + 0.05 * shot, 0.1 * lag + 0.05 * shot]] }); });
    cuff(p, 50, 87, 28, 14);
    if (tp) {                                                  /* the mark: a stroke drawn down, then its dot, over the fingertip */
      var w = M.seg(u, 0.25, 0.5), gone = M.easeIn(M.seg(u, 0.85, 1)), ty = 27 - up, wig = 1.2 * M.wave(M.seg(u, 0.5, 0.85), 3);
      p.span('M' + (35.5 + wig) + ' ' + (ty - 25) + ' C' + (34.7 + wig) + ' ' + (ty - 20) + ' ' + (35.5 + wig) + ' ' + (ty - 15) + ' ' + (36 + wig) + ' ' + (ty - 11), gone, w, { w: 1.7, ink: 'b' });
      if (w > 0.95 && gone < 0.5) p.dot(36.3 + wig, ty - 4.5, 1.9, 'b');
    }
  }
});

/* 👌 thumb and first finger make the ring, the other three fan: the fan breathes and the ring takes a glint.
   Tap: the fingers spread wide and the ring pops a star. */
D.add('ok-hand', {
  fam: 'faces', tags: ['ok', 'okay', 'perfect', 'fine', 'agree', 'good', 'hand', 'gesture', '👌'], loop: 2.4, still: 0.2, tapLen: 1.2, burst: 'star', burstAt: [26, 34], burstN: 4, burstSpread: 2, margin: [18, 18, 4, 18],
  about: 'the three fingers fan and settle; the ring glints', tapAbout: 'the fingers spread wide and the ring pops a star',
  draw: function (p, t, s) {
    var f = s.tap >= 0 ? M.spring(M.seg(s.tap, 0, 0.3)) * (1 - M.easeIn(M.seg(s.tap, 0.7, 1))) : 0, w = 0.5 + 0.5 * M.wave(t, 1);
    p.at(54, 88, 0.06 * M.wave(t, 1, 0.1), 1.08, function () {
      var h = handItems({ noThumb: true, skip: [1, 0, 0, 0], fan: [0, -0.02 - 0.06 * w - 0.1 * f, 0.1 + 0.07 * w + 0.15 * f, 0.26 + 0.08 * w + 0.2 * f] });
      skin(p, h.items);
      h.fingers.forEach(function (g) { if (g) crease(p, g, 1); });
      var ix = limb(-13.2, -33, -0.65, [11, 7.2, 5.8], [0.2, -1.15, -0.95 + 0.1 * f], 9.2, 8.4), th = limb(-14, -12, -0.95, [12.5, 11.5], [0.1, 0.35 - 0.1 * f], 11, 9);
      bone(p, th, true); bone(p, ix, true);
      twinkle(p, -22.4, -34.4, 4.4, M.seg(t, 0.45, 0.85), 'a');
    });
    cuff(p, 54, 86, 28, 14);
  }
});

/* ✊ a raised fist, shaking with resolve, power marks flickering round the top. Tap: it punches up and out,
   stars fly off the knuckles. */
D.add('fist', {
  fam: 'faces', tags: ['power', 'punch', 'strong', 'solidarity', 'fight', 'resist', 'hand', '✊', '👊'], loop: 1.6, still: 0.2, tapLen: 1.3, burst: 'star', burstAt: [50, 14], burstN: 6, burstSpread: 2.4, margin: [44, 20, 4, 20],
  about: 'shakes with resolve, power marks flicker round the top', tapAbout: 'punches up and out, stars fly off the knuckles',
  draw: function (p, t, s) {
    var tp = s.tap >= 0, u = tp ? s.tap : 0, wind = M.bump(M.seg(u, 0, 0.16)), shot = M.easeOut(M.seg(u, 0.14, 0.3)) * (1 - M.ease(M.seg(u, 0.5, 0.95)));
    var dy = 6 * wind - 40 * shot + (tp ? 0 : 1.1 * M.wave(t, 4)), dx = tp ? 0 : 0.9 * M.wave(t, 5), st = 1 + 0.1 * shot * (1 - shot) * 4;
    if (dy < -1) p.rect(36, 70 + dy, 30, 20 - dy * 0.9, { fill: 'skin', r: 4 });      /* the arm stretches behind the fist */
    p.pivot(50, 80, 0, [1 / st, st], function () {
      p.move(dx, dy);
      p.rect(22, 38, 58, 42, { fill: 'skin', r: 12 });
      [[30.5, 26, 32], [44, 22, 33], [57.5, 23, 33], [70.5, 29, 30]].forEach(function (f) {
        p.rect(f[0] - 6.8, f[1], 13.6, f[2], { fill: 'skin', r: 6.8 });
        p.line(f[0] - 3.5, f[1] + 8, f[0] + 3.5, f[1] + 8, { ink: K, alpha: 0.5, w: 0.4, detail: true, wob: 0.3 });
      });
      p.pivot(40, 62, -0.06, 1, function () { p.rect(21, 53, 46, 16, { fill: 'skin', r: 8 }); p.path('M58 57 C62 59 62 63 58 65', { ink: K, alpha: 0.5, w: 0.45, detail: true, wob: 0.3 }); });
    });
    cuff(p, 51, 80 + Math.max(0, dy) * 0.5, 50, 17);
    for (var i = 0; i < 5; i++) {                              /* power marks, drawn out and taken back, each on its own beat */
      var a = (-160 + i * 35) * Math.PI / 180, k = M.frac(t * 2 + i * 0.21), r0 = 42 + 3 * M.wave(t, 2, i * 0.1), c = Math.cos(a), sn = Math.sin(a);
      p.span('M' + (50 + c * r0) + ' ' + (50 + dy * 0.3 + sn * r0) + ' L' + (50 + c * (r0 + 9)) + ' ' + (50 + dy * 0.3 + sn * (r0 + 9)), M.easeIn(M.seg(k, 0.45, 0.9)), M.easeOut(M.seg(k, 0, 0.5)), { w: 0.8 });
    }
  }
});

/* 👍 thumbs up: the thumb nods, its tip a beat behind the fist; a glint twinkles off it. Tap: a pump, up-down-up, sparkles. */
D.add('thumbs-up', {
  fam: 'faces', tags: ['like', 'yes', 'good', 'approve', 'great', 'agree', 'hand', 'ok', '👍'], loop: 2, still: 0.15, tapLen: 1.2, burst: 'spark star', burstAt: [44, 14], burstN: 6, burstSpread: 2.2, margin: [24, 18, 4, 18],
  about: 'the thumb nods, its tip lagging; a glint twinkles', tapAbout: 'a pump, up-down-up, and sparkles',
  draw: function (p, t, s) {
    var tp = s.tap >= 0, u = tp ? s.tap : 0, pump = tp ? 7 * M.wave(M.seg(u, 0, 0.8), 1.5, 0.25) * M.bump(M.seg(u, 0, 1)) : 0;
    var n0 = 0.1 * M.wave(t, 1), n1 = 0.1 * M.wave(t, 1, -0.07) - n0;
    p.pivot(44, 92, 0.02 * M.wave(t, 1, 0.2), 1, function () {
      p.move(0, -pump + 1.2 * M.wave(t, 1, 0.25));
      var th = limb(40, 52, 0.12 + n0, [17, 14], [0, n1 + 0.2], 16, 13.5);
      p.curve(outline([[24, 94], [23, 66], [26, 54], th, [52, 48], [62, 54], [62, 94]]), { close: true, fill: 'skin', w: 1.05 });
      [[36, 49, 54, 5], [36, 60.5, 54, 5.2], [38, 72, 48, 4.4], [40, 83.5, 40, 3.6]].forEach(function (b) {
        p.rect(b[0], b[1], b[2], 12, { fill: 'skin', r: 6 });
        p.line(b[0] + b[2] - 14, b[1] + 3, b[0] + b[2] - 14, b[1] + 9, { ink: K, alpha: 0.5, w: 0.4, detail: true, wob: 0.3 });
      });
      var tx = th.c[2][0] + 6, ty = th.c[2][1] - 4, g = M.bump(M.seg(t, 0.55, 0.85));
      if (g > 0) { p.line(tx - 7 * g, ty, tx + 7 * g, ty, { ink: 'a', w: 1, cap: 'round' }); p.line(tx, ty - 7 * g, tx, ty + 7 * g, { ink: 'a', w: 1, cap: 'round' }); }
    });
    cuff(p, 17, 52, 20, 44, 'c');
  }
});

/* 🙏 the Thai wai: palms together at the chest, fingers up, a small dip as the head would bow. Tap: a deeper wai
   and a lotus petal drifts down past the hands. */
D.add('wai', {
  fam: 'faces', tags: ['thank', 'thanks', 'please', 'greeting', 'respect', 'pray', 'sawasdee', 'thai', 'namaste', 'สวัสดี', '🙏'], loop: 3, still: 0.1, tapLen: 2.2, burst: false, margin: [20, 18, 6, 18],
  about: 'palms together, a small slow dip', tapAbout: 'a deeper wai, a lotus petal drifting down past the hands',
  draw: function (p, t, s) {
    var tp = s.tap >= 0, u = tp ? s.tap : 0, deep = tp ? M.ease(M.seg(u, 0.05, 0.4)) * (1 - M.ease(M.seg(u, 0.55, 0.9))) : 0, dip = 0.5 - 0.5 * M.wave(t, 1) + 1.6 * deep;
    p.pivot(50, 92, 0, [1, 1 - 0.045 * dip], function () {
      p.move(0, 2.2 * dip);
      [1, -1].forEach(function (sd) {
        p.at(50 - sd * 13.5, 94, sd * (0.17 - 0.03 * dip), [-sd * 1.08, 1.08], function () { openHand(p, { spread: 0, noThumb: true }); });
      });
      [-1, 1].forEach(function (sd) { bone(p, limb(50 + sd * 4.6, 94, -sd * 0.03, [17, 14], [0, 0], 9.4, 8.2), true); });          /* the thumbs, pressed together at the chest */
    });
    cuff(p, 36.5, 89, 25, 11); cuff(p, 63.5, 89, 25, 11);
    if (tp) {                                                  /* the petal: slips off the top, turning, and leaves below */
      var q = M.seg(u, 0.1, 1), px = 60 - 14 * q + 9 * Math.sin(TAU * q * 1.5), py = -14 + 118 * q;
      p.at(px, py, 0.9 * Math.sin(TAU * q * 1.5 + 1) + 0.4, [1, 1.3], function () { p.path('M0 -7 C6 -4 5 4 0 8 C-5 4 -6 -4 0 -7 Z', { fill: 'pink', w: 0.8 }); p.line(0, -5, 0, 5, { w: 0.4, detail: true, alpha: 0.5 }); });
    }
  }
});

/* 👏 two hands meet and part: the left comes in a beat ahead, and the impact marks are drawn then taken back.
   Tap: a run of quick claps. */
D.add('clap', {
  fam: 'faces', tags: ['applause', 'bravo', 'congrats', 'well done', 'hands', 'praise', 'ovation', '👏'], loop: 1.2, still: 0.15, tapLen: 1.4, burst: false, margin: [14, 14, 4, 14],
  about: 'two hands meet and part, the left a beat ahead, marks flash at the hit', tapAbout: 'a run of quick claps',
  draw: function (p, t, s) {
    var tp = s.tap >= 0, u = tp ? s.tap : 0, ph = tp ? 4 * u : t * 2;
    var near = function (lag) { var x = M.frac(ph - lag); return x < 0.6 ? 1 - M.ease(M.seg(x, 0.06, 0.6)) : M.ease(M.seg(x, 0.6, 1)); };
    [1, -1].forEach(function (sd) {                                                  /* the left hand leads by a hair */
      var h = near(sd > 0 ? 0 : 0.03);
      p.at(50 - sd * (27 - 17 * h), 92, sd * (0.12 + 0.22 * h), [-sd * 0.8, 0.8], function () { openHand(p, { spread: 0.15, thumb: -0.5 }); });
    });
    var k = M.frac(ph), mk = M.seg(k, 0.0, 0.45);
    for (var i = 0; i < 3; i++) { var a = -1.57 + (i - 1) * 0.55; p.span('M' + (50 + Math.cos(a) * 8) + ' ' + (30 + Math.sin(a) * 8) + ' L' + (50 + Math.cos(a) * 17) + ' ' + (30 + Math.sin(a) * 17), M.easeIn(M.seg(mk, 0.4, 1)), M.easeOut(M.seg(mk, 0, 0.6)), { w: 0.9 }); }
  }
});

/* 😉 a wink: the right eye shuts into a ^ and the brow comes down, the smile pulls up that side, the head tips into it.
   Tap: a quick double wink and stars flick off the eye. */
D.add('wink', {
  fam: 'faces', tapRest: 0.2, tags: ['flirt', 'joke', 'playful', 'secret', 'cheeky', 'face', 'emoji', '😉'], loop: 2.6, still: 0.2, tapLen: 1.2, burst: 'star', burstAt: [66, 42], burstN: 3, burstSpread: 1.6,
  about: 'the right eye shuts, the smile pulls up that side', tapAbout: 'a quick double wink; stars flick off the eye',
  draw: function (p, t, s) {
    var w = s.tap >= 0 ? Math.max(M.clamp(2 * M.bump(M.seg(s.tap, 0.04, 0.4)), 0, 1), M.clamp(2 * M.bump(M.seg(s.tap, 0.45, 0.8)), 0, 1)) : M.ease(M.seg(t, 0.5, 0.57)) * (1 - M.ease(M.seg(t, 0.7, 0.78)));
    p.pivot(50, 72, 0.03 * M.wave(t, 1) + 0.07 * w, 1, function () {
      p.move(0, -1.3 * M.wave(t, 1, 0.25));
      head(p); cheek(p, 24, 61); cheek(p, 76, 61, 1 + 0.3 * w);
      var o = blink(t, 0.2);
      brow(p, 35, 33 - 1 * M.bump(M.seg(t, 0.4, 0.9)), -0.1, 12); brow(p, 65, 33 + 3.5 * w, 0.12 + 0.2 * w, 12);
      eye(p, 36, 44, o); eye(p, 64, 44, Math.min(o, 1 - w), { up: true });
      var sm = 14 + 2 * w;
      p.path('M' + (50 - sm) + ' 63 C' + (50 - sm * 0.5) + ' ' + (69 + 1.5 * w) + ' ' + (50 + sm * 0.5) + ' ' + (69 + 1.5 * w) + ' ' + (50 + sm + 1) + ' ' + (62 - 3 * w), { ink: K, w: 1.25, cap: 'round' });
    });
  }
});

/* 😂 laughing so hard the eyes squeeze shut: the mouth opens ha-ha-ha, the head rocks, tears jump off both sides.
   Tap: a fit of it, tears flying everywhere. */
D.add('laugh', {
  fam: 'faces', tags: ['lol', 'funny', 'haha', 'joy', 'tears', 'hilarious', 'face', 'emoji', '😂'], loop: 1.2, still: 0.1, tapLen: 1.4, burst: 'drop', burstAt: [50, 46], burstN: 8, burstSpread: 3.4,
  about: 'rocks with laughter, the mouth opening ha-ha-ha, tears jumping', tapAbout: 'a fit of laughter, tears flying everywhere',
  draw: function (p, t, s) {
    var big = s.tap >= 0 ? M.bump(M.seg(s.tap, 0, 1)) : 0, ha = Math.abs(M.wave(t, 3)), amp = 1 + 0.9 * big;
    p.pivot(50, 80, 0.07 * amp * M.wave(t, 3, 0.25), 1, function () {
      p.move(0, -3.2 * amp * ha);
      head(p); cheek(p, 22, 58, 1.2); cheek(p, 78, 58, 1.2);
      eye(p, 34, 43, 0, { up: true, k: 1.1 }); eye(p, 66, 43, 0, { up: true, k: 1.1 });
      brow(p, 33, 31, -0.2, 11); brow(p, 67, 31, 0.2, 11);
      gape(p, 50, 56, 22 + 2 * big, 8 + 10 * ha + 4 * big, { teeth: true });
    });
    [-1, 1].forEach(function (sd, k) {                        /* tears off the eye corners, each pair a beat apart */
      for (var j = 0; j < 2; j++) {
        var q = M.frac(t * 2 + k * 0.08 + j * 0.5), x = 50 + sd * (22 + 28 * q), y = 44 - 20 * q + 52 * q * q, sc = M.easeOut(M.seg(q, 0, 0.15)) * (1 - M.easeIn(M.seg(q, 0.7, 1)));
        if (sc > 0.05) p.at(x, y, sd * (0.4 + 1.2 * q), 0.9 * sc, function () { p.path(DROP, { fill: 'sky', w: 0.8 }); });
      }
    });
  }
});

/* 😊 a bashful smile: eyes shut happily, cheeks flushing, three marks drawn on each; the head sways shyly.
   Tap: it ducks away, cheeks swelling, and a few hearts drift up. */
D.add('blush', {
  fam: 'faces', tags: ['shy', 'bashful', 'flattered', 'embarrassed', 'sweet', 'happy', 'face', 'emoji', '😊'], loop: 3, still: 0.25, tapLen: 1.5, burst: 'heart', burstAt: [50, 20], burstN: 4, burstSpread: 1.8,
  about: 'sways shyly, the cheeks flush and the marks draw on', tapAbout: 'ducks away, cheeks swelling, hearts drift up',
  draw: function (p, t, s) {
    var d = s.tap >= 0 ? M.ease(M.seg(s.tap, 0, 0.3)) * (1 - M.ease(M.seg(s.tap, 0.6, 1))) : 0, fl = 0.5 + 0.5 * M.wave(t, 1, -0.25);
    p.pivot(50, 85, 0.07 * M.wave(t, 1) + 0.2 * d, 1, function () {
      p.move(0, 4 * d);
      head(p);
      var k = 1 + 0.3 * fl + 0.5 * d;
      cheek(p, 25, 57, k); cheek(p, 75, 57, k);
      [25, 75].forEach(function (x) { for (var i = 0; i < 3; i++) p.span('M' + (x - 5 + i * 4.4) + ' 61 L' + (x - 3 + i * 4.4) + ' 54', 0, M.easeOut(M.seg(fl + d, 0.15 + i * 0.15, 0.5 + i * 0.15)), { ink: 'rose', w: 0.7, cap: 'round', detail: true }); });
      eye(p, 35, 43, 0, { up: true }); eye(p, 65, 43, 0, { up: true });
      brow(p, 35, 32, -0.12, 11); brow(p, 65, 32, 0.12, 11);
      p.path('M42 62 C46 66 54 66 58 62', { ink: K, w: 1.2, cap: 'round' });
    });
  }
});

/* 😴 asleep: the head sinks and jerks up, a bubble swells and shrinks at the nose, Z's are written and float off.
   Tap: it startles awake, eyes wide and an exclamation mark, then slides back under. */
D.add('sleepy', {
  fam: 'faces', tags: ['sleep', 'tired', 'zzz', 'night', 'nap', 'bored', 'snooze', 'bed', 'face', 'emoji', '😴'], loop: 3.6, still: 0.3, tapLen: 2, burst: false, margin: [22, 26, 4, 18],
  about: 'sinks and jerks up, a bubble at the nose, Z\'s written and floating off', tapAbout: 'startles awake, wide eyes and a !, then slides back under',
  draw: function (p, t, s) {
    var tp = s.tap >= 0, u = tp ? s.tap : 0, aw = tp ? M.easeOut(M.seg(u, 0, 0.1)) * (1 - M.ease(M.seg(u, 0.5, 0.95))) : 0;
    var droop = 0.13 * M.ease(M.seg(t, 0, 0.72)) * (1 - M.ease(M.seg(t, 0.72, 0.8))), br = 0.5 - 0.5 * Math.cos(TAU * t * 2);
    p.pivot(50, 92, droop * (1 - aw) - 0.05 * aw, 1, function () {
      head(p);
      var o = aw * 1.15;
      brow(p, 35, 32 - 4 * aw, -0.05 - 0.1 * aw, 11); brow(p, 65, 32 - 4 * aw, 0.05 + 0.1 * aw, 11);
      if (aw > 0.2) { eye(p, 35, 45, o, { k: 1.2 }); eye(p, 65, 45, o, { k: 1.2 }); } else { eye(p, 35, 45, 0); eye(p, 65, 45, 0); }
      if (aw > 0.3) gape(p, 50, 62, 6, 5 + 4 * aw, { tongue: false }); else p.ellipse(50, 64, 3.4 + 1.2 * br, 2.4 + 2.6 * br, { fill: LIP, w: 0.8, ink: K });
      if (!tp) { var r = 2 + 9 * br; p.circle(61 + r * 0.5, 61 - r * 0.2, r, { fill: 'white', alpha: 0.8, w: 0.8 }); if (r > 6) p.path('M' + (60 + r * 0.2) + ' ' + (59 - r * 0.2) + ' q ' + (r * 0.3) + ' ' + (-r * 0.4) + ' ' + (r * 0.7) + ' ' + (-r * 0.5), { ink: 'white', w: 0.6, detail: true }); }
    });
    for (var i = 0; i < 3; i++) {                              /* each Z is drawn where it starts, then drifts up and away */
      var q = M.frac(t + i / 3), k = 0.5 + 0.9 * q, x = 72 + 24 * q + 3 * Math.sin(TAU * q * 2), y = 20 - 28 * q;
      if (!tp) zed(p, x, y, k, -0.15 + 0.2 * q, M.easeOut(M.seg(q, 0, 0.3)));
    }
    if (tp && aw > 0.1) {                                       /* the ! over its head */
      var w = M.seg(u, 0.05, 0.25), gone = M.easeIn(M.seg(u, 0.6, 0.85));
      p.span('M78 -4 C77 3 78 8 79 12', gone, w, { w: 1.7, ink: 'b', cap: 'round' }); if (w > 0.95 && gone < 0.4) p.dot(79.5, 18, 1.9, 'b');
    }
  }
});

/* 😍 heart eyes: both hearts throb lub-dub, the left a hair ahead, the grin wide, the head bobbing.
   Tap: the hearts balloon and float away from the eyes. */
D.add('heart-eyes', {
  fam: 'faces', tapRest: 0.25, tags: ['love', 'adore', 'crush', 'wow', 'like', 'favourite', 'face', 'emoji', '😍'], loop: 1.2, still: 0.1, tapLen: 1.4, burst: 'heart', burstAt: [50, 38], burstN: 8, burstSpread: 2.8,
  about: 'hearts throb lub-dub in the eyes, the head bobbing', tapAbout: 'the hearts balloon and float away',
  draw: function (p, t, s) {
    var big = s.tap >= 0 ? M.bump(M.seg(s.tap, 0, 0.5)) : 0;
    var th = function (lag) { return M.bump(M.seg(t, lag, 0.15 + lag)) + 0.6 * M.bump(M.seg(t, 0.2 + lag, 0.34 + lag)); };
    p.pivot(50, 80, 0.04 * M.wave(t, 1), 1, function () {
      p.move(0, -1.5 * M.wave(t, 2, 0.25));
      head(p); cheek(p, 22, 62); cheek(p, 78, 62);
      [[34, 0], [66, 0.03]].forEach(function (e) { var k = 1.4 + 0.35 * th(e[1]) + 0.9 * big; p.at(e[0], 44, 0, k, function () { p.path(HEART, { fill: 'red', w: 0.8 }); p.line(-4.2, -3.2, -2.6, -4.6, { ink: 'white', w: 0.7, cap: 'round', wob: 0 }); }); });
      gape(p, 50, 60, 15, 12 + 2 * M.wave(t, 2), { teeth: true });
    });
  }
});

/* the zigzag where the lid meets the bowl of a head of radius 38 centred (50, 58), cut at y = 42 */
var CUTX = 50 - Math.sqrt(38 * 38 - 16 * 16), JAG = function (up) { var d = '', i; for (i = 1; i <= 6; i++) d += ' L' + (CUTX + i * (100 - 2 * CUTX) / 6) + ' ' + (42 + (i % 2 ? up : 0)); return d; };

/* 🤯 mind blown: the top of the head lifts on a cushion of puffs, the eyes wide and shaking, the mouth an O.
   Tap: the lid blasts off and tumbles back, a cloud blooming where it was. */
D.add('mind-blown', {
  fam: 'faces', tapRest: 0.7, tags: ['wow', 'shock', 'amazed', 'explode', 'whoa', 'surprise', 'brain', 'face', 'emoji', '🤯'], loop: 1.4, still: 0.2, tapLen: 1.8, burst: 'ember star', burstAt: [50, 30], burstN: 8, burstSpread: 3, margin: [50, 20, 4, 20],
  about: 'the top of the head lifts on puffs, eyes wide and shaking', tapAbout: 'the lid blasts off and tumbles back, a cloud blooming',
  draw: function (p, t, s) {
    var tp = s.tap >= 0, u = tp ? s.tap : 0, shot = tp ? M.easeOut(M.seg(u, 0, 0.3)) * (1 - M.easeIn(M.seg(u, 0.3, 0.75))) : 0, land = tp ? M.bump(M.seg(u, 0.72, 0.9)) : 0;
    var lift = 9 + 4 * M.wave(t, 2) + 52 * shot, rot = 0.05 * M.wave(t, 3, 0.1) + 1.8 * shot * (1 - M.seg(u, 0.5, 0.75)), jit = 0.7 * M.wave(t, 6);
    p.pivot(50, 92, 0, [1 + 0.05 * land, 1 - 0.06 * land], function () {
      p.move(jit, 0);
      p.path('M' + CUTX + ' 42' + JAG(-5) + ' A38 38 0 1 1 ' + CUTX + ' 42 Z', { fill: 'yellow', w: 1.15 });
      p.circle(36, 58, 8.5, { fill: 'white', w: 0.9, ink: K }); p.circle(36 + jit * 0.8, 58 + 0.5, 2.6, { fill: K, w: 0.4, ink: K });
      p.circle(64, 58, 8.5, { fill: 'white', w: 0.9, ink: K }); p.circle(64 + jit * 0.8, 58 + 0.5, 2.6, { fill: K, w: 0.4, ink: K });
      p.ellipse(50, 81, 5 + 0.8 * M.wave(t, 2), 7, { fill: LIP, w: 0.9, ink: K });
    });
    var pf = tp ? M.bump(M.seg(u, 0.05, 0.9)) : 0.3 + 0.12 * M.wave(t, 2, 0.3);
    [[24, 42, 7], [41, 37, 9], [59, 37, 8.5], [76, 42, 7]].forEach(function (c, i) { var r = c[2] * (0.75 + 0.8 * pf + 0.1 * M.wave(t, 3, i * 0.2)); p.blob(c[0], c[1] - 3 * pf * (i % 2 ? 1 : -1), r, { fill: 'white', w: 0.8, lumpy: 0.1, seed: 3 + i }); });
    p.pivot(CUTX, 42, -rot, 1, function () {
      p.move(0, -lift);
      p.path('M' + CUTX + ' 42' + JAG(-5) + ' A38 38 0 0 0 ' + CUTX + ' 42 Z', { fill: 'yellow', w: 1.15 });
      p.path('M24 33 C27 28 31 25 36 23', { ink: 'white', w: 0.8, detail: true, wob: 0.3 });
    });
  }
});

/* 😅 relief with a nervous grin: a big drop swells on the brow, slides and falls, the face shivering. Tap: panic, drops fly from both temples. */
D.add('sweat', {
  fam: 'faces', tags: ['nervous', 'phew', 'relief', 'awkward', 'oops', 'close call', 'face', 'emoji', '😅'], loop: 2.2, still: 0.5, tapLen: 1.4, burst: 'drop', burstAt: [50, 36], burstN: 6, burstSpread: 3.2,
  about: 'a drop swells on the brow, slides and falls, the face shivering', tapAbout: 'panic: the face shakes and drops fly from both temples',
  draw: function (p, t, s) {
    var pan = s.tap >= 0 ? M.bump(M.seg(s.tap, 0, 1)) : 0, shv = (0.8 + 1.5 * pan) * M.wave(t, 7);
    p.pivot(50, 80, 0.02 * M.wave(t, 7, 0.2) * (1 + 2 * pan), 1, function () {
      p.move(shv, 0);
      head(p); cheek(p, 23, 60, 0.8);
      brow(p, 35, 30 - 3 * pan, -0.4, 12, { arch: 0 }); brow(p, 65, 30 - 3 * pan, 0.4, 12, { arch: 0 });
      eye(p, 36, 44, blink(t, 0.3), { k: 0.9, lx: 2 * M.wave(t, 1) * pan }); eye(p, 64, 44, blink(t, 0.3), { k: 0.9, lx: 2 * M.wave(t, 1) * pan });
      gape(p, 50, 61, 13, 7 + 1.5 * M.wave(t, 4), { teeth: true });
      var q = M.frac(t), g = M.easeOut(M.seg(q, 0, 0.35)), sl = M.easeIn(M.seg(q, 0.35, 0.95));
      p.at(78 - 3 * sl, 22 + 24 * sl, -0.05, [0.3 + 0.8 * g, 0.3 + 1.0 * g], function () { p.path(DROP, { fill: 'sky', w: 1 }); });
    });
  }
});

/* 😭 wailing: the mouth a big open dome, the head shaking with sobs, and tears stream down both cheeks, run off and fall.
   Tap: a wail, the tears jetting out sideways. */
var STREAM = function (x0, dir, ph, t, wob) {                /* the centre line of a stream running down a cheek */
  var c = [], i; for (i = 0; i <= 12; i++) { var q = i / 12; c.push([x0 + dir * (-10 * Math.sin(q * 1.4) + wob * Math.sin(TAU * (q * 1.5 - t * 2 - ph))), 49 + 52 * q]); } return c;
};
D.add('cry', {
  fam: 'faces', tags: ['sad', 'tears', 'sob', 'upset', 'weep', 'wail', 'face', 'emoji', '😭'], loop: 1.2, still: 0.3, tapLen: 1.5, burst: 'drop', burstAt: [50, 48], burstN: 8, burstSpread: 3.6, margin: [18, 18, 24, 18],
  about: 'sobs, the mouth a wide dome, tears streaming down and falling off', tapAbout: 'a wail, tears jetting out sideways',
  draw: function (p, t, s) {
    var big = s.tap >= 0 ? M.bump(M.seg(s.tap, 0, 1)) : 0, sob = Math.abs(M.wave(t, 4)) , amp = 1 + 1.2 * big;
    p.pivot(50, 85, 0.03 * amp * M.wave(t, 4, 0.1), 1, function () {
      p.move(0, -1.6 * amp * sob);
      head(p); cheek(p, 21, 60, 1.1); cheek(p, 79, 60, 1.1);
      brow(p, 33, 33, -0.38, 13); brow(p, 67, 33, 0.38, 13);
      eye(p, 34, 46, 0, { k: 1.1 }); eye(p, 66, 46, 0, { k: 1.1 });
      var w = 16 + 2 * big, top = 58 + 2 * sob, bot = 80 + 2 * big - 2 * sob;
      p.path('M' + (50 - w) + ' ' + bot + ' C' + (50 - w) + ' ' + (top - 8) + ' ' + (50 + w) + ' ' + (top - 8) + ' ' + (50 + w) + ' ' + bot + ' C' + (50 + w - 5) + ' ' + (bot + 3) + ' ' + (50 - w + 5) + ' ' + (bot + 3) + ' ' + (50 - w) + ' ' + bot + ' Z', { fill: LIP, w: 1.05, ink: K });
      p.path('M' + (50 - w * 0.55) + ' ' + (bot + 0.5) + ' C' + (50 - w * 0.4) + ' ' + (bot - 7) + ' ' + (50 + w * 0.4) + ' ' + (bot - 7) + ' ' + (50 + w * 0.55) + ' ' + (bot + 0.5) + ' Z', { fill: 'pink', line: false });
      [[32, 1, 0], [68, -1, 0.04]].forEach(function (e, i) {
        for (var j = 0; j < 2; j++) {
          var q = M.frac(t + j * 0.5 + e[2]), head = M.easeOut(M.seg(q, 0, 0.55)), tail = M.easeIn(M.seg(q, 0.35, 1)), c = STREAM(e[0], e[1], i * 0.3 + j * 0.2, t, 1.1);
          if (head - tail > 0.04) tube(p, along(c, tail, head, 10), 3.6 + 1.2 * big);
        }
      });
    });
    [28, 72].forEach(function (x, i) {                        /* drops that leave the chin and fall */
      var q = M.frac(t * 2 + i * 0.37), y = 92 + 24 * q * q + 4 * q, sc = M.easeOut(M.seg(q, 0, 0.2)) * (1 - M.easeIn(M.seg(q, 0.75, 1)));
      if (sc > 0.05) p.at(x - 3 * (1 - 2 * i) * q, y, 0, 0.8 * sc, function () { p.path(DROP, { fill: 'sky', w: 0.8 }); });
    });
  }
});

/* 😘 a kiss: one eye winks, the lips purse, and a heart floats off the lips, growing as it goes.
   Tap: a big mwah, the face leaning in and a spray of hearts. */
D.add('kiss', {
  fam: 'faces', tapRest: 0.25, tags: ['love', 'mwah', 'xoxo', 'thanks', 'goodnight', 'affection', 'face', 'emoji', '😘'], loop: 2.4, still: 0.4, tapLen: 1.3, burst: 'heart', burstAt: [58, 64], burstN: 5, burstSpread: 1.7, margin: [24, 30, 6, 18],
  about: 'winks and purses, a heart floats off the lips growing', tapAbout: 'a big mwah, the face leans in, hearts spray',
  draw: function (p, t, s) {
    var tp = s.tap >= 0, u = tp ? s.tap : 0, lean = tp ? M.bump(M.seg(u, 0, 0.5)) : 0, pk = tp ? 1 : M.bump(M.seg(t, 0.12, 0.42));
    p.pivot(50, 85, 0.05 * M.wave(t, 1) + 0.04 * pk - 0.05 * lean, 1 + 0.1 * lean, function () {
      p.move(0, -1.2 * M.wave(t, 1, 0.25));
      head(p); cheek(p, 23, 61, 1.1 + 0.3 * lean); cheek(p, 77, 61, 1.1 + 0.3 * lean);
      brow(p, 35, 33, -0.1, 12); brow(p, 65, 31 + 2 * pk, 0.12, 12);
      eye(p, 36, 44, tp && lean > 0.3 ? 0 : blink(t, 0.72), { up: tp && lean > 0.3 }); eye(p, 64, 44, 0, { up: true });
      var k = 1 + 0.35 * pk;                                   /* pursed lips: a small round pout with its seam */
      p.ellipse(56, 65, 4.4 * k, 4 * k, { fill: LIP, w: 0.9, ink: K }); p.line(52.6, 65, 59.4, 65, { ink: K, w: 0.45, detail: true, wob: 0.2 });
      p.path('M40 63 C42 62 45 62 48 64', { ink: K, w: 1, cap: 'round' });
    });
    var q = tp ? 0 : M.seg(t, 0.32, 0.9);
    if (q > 0 && q < 1) { var e = M.easeOut(q); p.at(M.lerp(60, 98, e), M.lerp(60, 8, e) - 7 * Math.sin(Math.PI * q) + 2 * Math.sin(TAU * q * 2), 0.2 * Math.sin(TAU * q), 1.7 * M.easeOut(M.seg(q, 0, 0.25)) * (1 - M.easeIn(M.seg(q, 0.82, 1))), function () { p.path(HEART, { fill: 'b', w: 0.8 }); }); }
  }
});

/* 😡 furious: the face red, brows slammed down, teeth gritted, steam puffing from both ears, one side ahead of the other.
   Tap: it erupts, the steam jetting and the anger mark pulsing. */
D.add('angry', {
  fam: 'faces', tags: ['mad', 'rage', 'furious', 'cross', 'grumpy', 'steam', 'face', 'emoji', '😡'], loop: 1, still: 0.3, tapLen: 1.3, burst: 'ember', burstAt: [50, 20], burstN: 6, burstSpread: 3, margin: [22, 18, 4, 18],
  about: 'seethes, steam puffing off both ears, the left ear leading', tapAbout: 'erupts, the steam jetting and the anger mark pulsing',
  draw: function (p, t, s) {
    var big = s.tap >= 0 ? M.bump(M.seg(s.tap, 0, 1)) : 0, k = 1 + 1.4 * big;
    [[8, -1, 0], [92, 1, 0.09]].forEach(function (e) {
      for (var j = 0; j < 3; j++) {
        var q = M.frac(t + j / 3 + e[2]), x = e[0] + e[1] * (2 + 7 * q) + 2 * Math.sin(TAU * (q * 1.5 + e[2])), y = 46 - 36 * q * k, r = (2.4 + 4 * q) * (1 - M.easeIn(M.seg(q, 0.8, 1))) * (1 + 0.35 * big);
        if (r > 0.6) p.blob(x, y, r, { fill: 'white', w: 0.8, lumpy: 0.12, seed: 4 + j });
      }
    });
    p.pivot(50, 85, 0.02 * M.wave(t, 3), 1 + 0.02 * M.wave(t, 3) + 0.04 * big, function () {
      p.move(0.9 * k * M.wave(t, 6), 0.5 * k * M.wave(t, 5));
      head(p, 'red');
      brow(p, 34, 36 + 2.5 * big, 0.38, 17, { arch: 0 }); brow(p, 66, 36 + 2.5 * big, -0.38, 17, { arch: 0 });
      p.ellipse(36, 47, 3.3, 3.6, { fill: K, w: 0.4, ink: K }); p.ellipse(64, 47, 3.3, 3.6, { fill: K, w: 0.4, ink: K });
      p.rect(36, 62, 28, 11, { fill: 'white', r: 4, w: 1 });
      for (var i = 1; i < 4; i++) p.line(36 + i * 7, 62.5, 36 + i * 7, 72.5, { w: 0.5, ink: K, detail: true, wob: 0.2 });
      p.line(36.5, 67.5, 63.5, 67.5, { w: 0.5, ink: K, detail: true, wob: 0.2 });
      var m = 1 + 0.35 * M.wave(t, 2) + 0.9 * big;                /* the anger mark: four corners that swell and settle */
      p.at(79, 18, 0, 0.9 * m, function () { for (var j = 0; j < 4; j++) p.at(0, 0, j * Math.PI / 2, 1, function () { p.path('M3 -8 C3 -4 4 -3 8 -3', { ink: 'red', w: 1.1, cap: 'round' }); }); });
    });
  }
});

/* 🤩 star-struck: stars for eyes, turning and swelling a beat apart, twinkles popping round the head, a huge grin.
   Tap: the eye-stars balloon and fly off in a shower. */
D.add('star-struck', {
  fam: 'faces', tapRest: 0.25, tags: ['wow', 'amazing', 'excited', 'celebrity', 'awesome', 'stars', 'face', 'emoji', '🤩'], loop: 1.6, still: 0.3, tapLen: 1.3, burst: 'star', burstAt: [50, 44], burstN: 8, burstSpread: 3.2, margin: [22, 22, 4, 22],
  about: 'star eyes turn and swell, twinkles pop round the head', tapAbout: 'the stars balloon and fly off in a shower',
  draw: function (p, t, s) {
    var big = s.tap >= 0 ? M.bump(M.seg(s.tap, 0, 0.5)) : 0;
    p.pivot(50, 85, 0.04 * M.wave(t, 1), 1, function () {
      p.move(0, -1.5 * M.wave(t, 2, 0.25));
      head(p); cheek(p, 22, 63); cheek(p, 78, 63);
      [[34, 0], [66, 0.06]].forEach(function (e, i) { p.star(e[0], 44, (12 + 2.2 * M.wave(t, 2, e[1])) * (1 + 0.5 * big), (5 + 0.8 * M.wave(t, 2, e[1])) * (1 + 0.5 * big), 5, { fill: 'orange', w: 0.9, rot: -Math.PI / 2 + 0.25 * M.wave(t, 1, e[1] + i * 0.1) }); });
      gape(p, 50, 59, 17, 13 + 2 * M.wave(t, 2), { teeth: true });
    });
    [[10, 22, 0.1], [92, 30, 0.45], [86, 6, 0.75], [14, 78, 0.6]].forEach(function (q) { twinkle(p, q[0], q[1], 7, M.seg(M.frac(t + q[2]), 0, 0.5)); });
  }
});

/* 🤔 thinking: a finger at the chin, one brow raised, the eyes wandering up and about, a question mark drawn over the head.
   Tap: the ? swells and two more are drawn beside it, the brow arching. */
var QMARK = 'M0 0 C0 -6 10 -6 10 0 C10 4 4 5 4 11';
D.add('thinking', {
  fam: 'faces', tags: ['hmm', 'wonder', 'consider', 'question', 'ponder', 'doubt', 'face', 'emoji', '🤔'], loop: 3, still: 0.35, tapLen: 1.6, burst: false, margin: [18, 22, 4, 18],
  about: 'finger tapping the chin, the eyes wandering, a ? drawn and rubbed out', tapAbout: 'the ? swells, two more are drawn beside it',
  draw: function (p, t, s) {
    var tp = s.tap >= 0, u = tp ? s.tap : 0, big = tp ? M.bump(M.seg(u, 0, 0.9)) : 0, look = [[1.8, -2.2], [-1.6, -2.4], [2.2, -0.6]], ph = Math.floor(t * 3) % 3, nx = (ph + 1) % 3, mv = M.ease(M.seg(M.frac(t * 3), 0.7, 1));
    var lx = M.lerp(look[ph][0], look[nx][0], mv) , ly = M.lerp(look[ph][1], look[nx][1], mv) - 1.5 * big;
    p.pivot(46, 85, -0.06 + 0.03 * M.wave(t, 1), 1, function () {
      p.move(-4, 4);
      head(p);
      brow(p, 33, 34 + 1.5 * M.wave(t, 3, 0.2), -0.1, 12); brow(p, 63, 28 - 3 * big, 0.2, 12, { arch: 2.4 });
      eye(p, 34, 45, 1, { lx: lx, ly: ly }); eye(p, 62, 45, 1, { lx: lx, ly: ly });
      p.path('M36 65 C42 66 48 64 54 66', { ink: K, w: 1.2, cap: 'round' });
      var tap = 1.4 * M.wave(t, 3, 0.1), th = limb(63, 92, -1.75, [8], [0], 10, 8.6);
      p.move(0, tap); bone(p, limb(70, 96, -0.1, [26, 9], [0, 0.0], 9.4, 8.4), false);
      p.rect(60, 80, 32, 24, { fill: 'skin', r: 11 });
      p.path('M64 90 C70 91 76 91 82 90', { ink: K, alpha: 0.5, w: 0.45, detail: true, wob: 0.3 }); p.path('M64 96 C70 97 76 97 82 96', { ink: K, alpha: 0.5, w: 0.45, detail: true, wob: 0.3 });
      bone(p, th, false);
    });
    var d = tp ? M.easeOut(M.seg(u, 0, 0.3)) : M.easeOut(M.seg(t, 0.12, 0.3)) * (1 - M.easeIn(M.seg(t, 0.62, 0.84)));
    var gone = tp ? M.easeIn(M.seg(u, 0.7, 1)) : 0, k = 1 + 0.5 * big;
    p.at(80, 8, 0.1, k, function () { p.span(QMARK, gone, d, { w: 1.3, cap: 'round', ink: K }); if (d > 0.97 && gone < 0.3) p.dot(4, 16, 1.4, K); });
    if (tp) [[92, 24, 0.5], [68, 2, 0.8]].forEach(function (q, i) { var dd = M.seg(u, 0.2 + i * 0.12, 0.45 + i * 0.12); p.at(q[0], q[1], -0.2, 0.7, function () { p.span(QMARK, gone, dd, { w: 1.3, cap: 'round' }); if (dd > 0.97 && gone < 0.3) p.dot(4, 16, 1.4, K); }); });
  }
});

/* a toothed wheel: n teeth, outer radius r, turned by rot */
function gear(p, x, y, r, n, rot, fill) {
  var pts = [], h = TAU / n, i;
  for (i = 0; i < n; i++) { var a = rot + i * h; [[0.78, -0.4], [1, -0.2], [1, 0.2], [0.78, 0.4]].forEach(function (q) { pts.push([x + Math.cos(a + q[1] * h) * r * q[0], y + Math.sin(a + q[1] * h) * r * q[0]]); }); }
  p.poly(pts, { fill: fill, w: 0.8 }); p.circle(x, y, r * 0.3, { fill: 'night', w: 0.5 });
}

/* 🥳 a party face: a hat tipped on the head with a pom-pom swinging, a blower that unrolls from the mouth and rolls back,
   confetti tumbling off its end. Tap: the hat pops, the blower goes full length and a cannon of confetti goes off. */
D.add('party', {
  fam: 'faces', tags: ['celebrate', 'birthday', 'hooray', 'confetti', 'congrats', 'new year', 'celebration', 'face', '🥳'], loop: 2.4, still: 0.5, tapLen: 1.5, burst: 'confetti', burstAt: [78, 48], burstN: 14, burstSpread: 3.4, margin: [18, 20, 14, 18],
  about: 'the blower unrolls and rolls back, confetti tumbling off, pom-pom swinging', tapAbout: 'the hat pops, the blower goes full length, a confetti cannon',
  draw: function (p, t, s) {
    var tp = s.tap >= 0, u = tp ? s.tap : 0, pop = tp ? M.spring(M.seg(u, 0, 0.4)) * (1 - M.ease(M.seg(u, 0.6, 1))) : 0;
    var blow = tp ? M.ease(M.seg(u, 0, 0.15)) * (1 - M.ease(M.seg(u, 0.6, 0.85))) : M.ease(M.seg(t, 0.34, 0.46)) * (1 - M.ease(M.seg(t, 0.64, 0.76)));
    p.pivot(46, 98, 0.045 * M.wave(t, 1) + (tp ? 0.03 * M.wave(u, 4) : 0), 1, function () {
      p.move(0, -2 * Math.abs(M.wave(t, 1, 0.25)));
      head(p, 'yellow', 66, 32);
      brow(p, 34, 52 - 2 * blow, -0.1, 11); brow(p, 58, 52 - 2 * blow, 0.1, 11);
      var sq = Math.max(blow, pop) > 0.5;
      eye(p, 34, 62, sq ? 0 : blink(t, 0.8), { up: sq }); eye(p, 58, 62, sq ? 0 : blink(t, 0.8), { up: sq });
      cheek(p, 22, 74, 0.9);
      p.path('M30 79 C34 86 42 86 47 81', { ink: K, w: 1.2, cap: 'round' });
      tube(p, [[47, 81], [53, 80], [58, 79]], 5, { fill: 'a' });
      var len = 3 + 20 * blow, th = 1.05, c = [[58, 79]], x = 58, y = 79, i;
      for (i = 1; i <= 6; i++) c.push([x + Math.sin(th) * len * i / 6, y - Math.cos(th) * len * i / 6]);
      x = c[6][0]; y = c[6][1];
      var rc = 6.5 - 2 * blow, h = th, L = rc * 3.2;
      for (i = 1; i <= 14; i++) { var r = rc * (1 - 0.6 * i / 14); h += (L / 14) / r; x += Math.sin(h) * L / 14; y -= Math.cos(h) * L / 14; c.push([x, y]); }
      tube(p, c, 4.4 - 0.6 * blow, { fill: 'c' });
      p.at(54, 38, 0.3 + 0.06 * M.wave(t, 2, 0.1), 1, function () {          /* the hat and its pom-pom */
        p.move(0, -16 * pop); p.turn(0.5 * pop);
        p.path('M-14 0 L0 -35 L14 0 C7 3.5 -7 3.5 -14 0 Z', { fill: 'b', w: 1 });
        p.line(-9.5, -10, 9.5, -10, { ink: 'a', w: 1.6, cap: 'round' }); p.line(-5.5, -20, 5.5, -20, { ink: 'a', w: 1.6, cap: 'round' });
        p.circle(-4, -4.6, 1.3, { fill: 'white', line: false }); p.circle(5, -14, 1.3, { fill: 'white', line: false });
        p.circle(3 * M.wave(t, 2, 0.15), -37, 4.4, { fill: 'a', w: 0.8 });
      });
      var q = tp ? 1 : M.seg(t, 0.4, 0.98);
      if (q > 0 && q < 1) for (i = 0; i < 6; i++) {                    /* confetti shed by the blower, tumbling down and out */
        var ex = c[6][0], ey = c[6][1], px = ex + (i - 2.5) * 5 * q + 4 * Math.sin(TAU * (q * 1.5 + i * 0.2)), py = ey + 70 * q * q - 4 * q, sc = M.easeOut(M.seg(q, 0, 0.1 + i * 0.02)) * (1 - M.easeIn(M.seg(q, 0.85, 1)));
        p.at(px, py, TAU * (q * 1.2 + i * 0.17), sc * 0.9, function () { p.rect(-3, -1.6, 6, 3.2, { fill: ['a', 'b', 'c'][i % 3], line: false }); });
      }
    });
  }
});

/* 👻 a ghost: it floats and rolls gently on its own breeze, the hem rippling, arms swinging, a blink.
   Tap: BOO! It jumps forward, arms up, mouth and eyes huge, scare lines flaring. */
D.add('ghost', {
  fam: 'faces', tags: ['boo', 'halloween', 'spooky', 'spirit', 'haunt', 'scary', 'cute', 'emoji', '👻'], loop: 2.8, still: 0.1, tapLen: 1.3, burst: false, margin: [20, 22, 10, 22],
  about: 'floats, the hem rippling, arms swinging, a blink', tapAbout: 'BOO! it jumps forward, arms up, scare lines flaring',
  draw: function (p, t, s) {
    var tp = s.tap >= 0, u = tp ? s.tap : 0, boo = tp ? M.spring(M.seg(u, 0, 0.25)) * (1 - M.ease(M.seg(u, 0.55, 1))) : 0, fl = M.wave(t, 1);
    var y0 = 3 * fl - 9 * boo, sc = 1 + 0.22 * boo;
    p.ellipse(50, 97, 20 - 3 * fl - 4 * boo, 2.6, { fill: 'smoke', line: false, alpha: 0.7 });
    p.pivot(50, 90, 0.05 * M.wave(t, 1, 0.25) + 0.06 * boo * M.wave(M.seg(u, 0, 0.6), 4), [sc, sc * (1 - 0.04 * boo)], function () {
      p.move(0, y0);
      [-1, 1].forEach(function (sd, i) {                                         /* arms: swing in the breeze, thrown up on the boo */
        var a = 0.3 * M.wave(t, 1, 0.1 + i * 0.07) + 1.3 * boo;
        p.pivot(50 + sd * 26, 58, sd * a, 1, function () { tube(p, [[50 + sd * 24, 58], [50 + sd * 33, 64], [50 + sd * 37, 74]], 9, { fill: 'white' }); });
      });
      var b = [], i, th;
      for (i = 0; i <= 10; i++) { th = Math.PI - i * Math.PI / 10; b.push([50 + 29 * Math.cos(th), 42 - 32 * Math.sin(th)]); }
      b.push([79, 62], [79, 84]);
      for (i = 0; i <= 6; i++) b.push([79 - i * 58 / 6, 88 + (i % 2 ? 6 : -1) + 2.6 * M.wave(t, 1, -i / 6 * 0.9)]);
      b.push([21, 84], [21, 62]);
      p.curve(b, { close: true, fill: 'white', w: 1.1 });
      p.path('M26 36 C27 28 31 22 37 19', { ink: 'smoke', w: 0.8, detail: true, wob: 0.3 });
      var e = Math.max(blink(t, 0.7), boo > 0.1 ? 1 : 0);
      p.ellipse(38, 41 - 2 * boo, 3.8 * (1 + 0.25 * boo), 5.6 * e * (1 + 0.3 * boo), { fill: K, w: 0.5, ink: K }); p.ellipse(62, 41 - 2 * boo, 3.8 * (1 + 0.25 * boo), 5.6 * e * (1 + 0.3 * boo), { fill: K, w: 0.5, ink: K });
      cheek(p, 28, 55, 0.7); cheek(p, 72, 55, 0.7);
      p.ellipse(50, 58 + 4 * boo, 4 + 4 * boo, 5 + 5.5 * boo + 1 * M.wave(t, 2) * (1 - boo), { fill: K, w: 0.5, ink: K });
    });
    if (boo > 0.15) for (var j = 0; j < 7; j++) {                                  /* scare lines, drawn out and taken back */
      var a = -Math.PI * (0.1 + 0.8 * j / 6), r0 = 52, r1 = 52 + 12 * M.easeOut(M.seg(u, 0.04, 0.3)), k0 = M.easeIn(M.seg(u, 0.4, 0.7));
      p.span('M' + (50 + Math.cos(a) * r0) + ' ' + (48 + Math.sin(a) * r0) + ' L' + (50 + Math.cos(a) * r1) + ' ' + (48 + Math.sin(a) * r1), k0, 1, { w: 0.9 });
    }
  }
});

/* 💀 a cute skull: the jaw chatters on its hinge, blushing cheeks, the sockets glinting, the head shivering.
   Tap: the jaw drops wide, then clatters, clack marks flashing. */
D.add('skull', {
  fam: 'faces', tapRest: 0.1, tags: ['death', 'dead', 'bones', 'halloween', 'spooky', 'pirate', 'poison', 'emoji', '💀'], loop: 1.6, still: 0.2, tapLen: 1.4, burst: false, margin: [18, 20, 6, 20],
  about: 'the jaw chatters on its hinge, the head shivering', tapAbout: 'the jaw drops wide, then clatters, clack marks flashing',
  draw: function (p, t, s) {
    var tp = s.tap >= 0, u = tp ? s.tap : 0, ch = Math.abs(M.wave(t, 4)), drop = tp ? 15 * M.easeOut(M.seg(u, 0, 0.18)) * (1 - M.ease(M.seg(u, 0.3, 0.45))) + 7 * Math.abs(M.wave(M.seg(u, 0.4, 1), 3)) * M.bump(M.seg(u, 0.35, 1.02)) : 5.5 * ch;
    p.pivot(50, 95, 0.03 * M.wave(t, 4, 0.1), 1, function () {
      p.move(0.7 * M.wave(t, 8), 0);
      p.path('M31 66 L69 66 L67 ' + (80 + drop) + ' L33 ' + (80 + drop) + ' Z', { fill: K, w: 0.6, ink: K });             /* the dark inside the mouth */
      p.pivot(50, 66, 0, 1, function () {                                         /* the jaw, dropping and snapping up */
        p.move(0, drop);
        p.path('M31 68 L69 68 L67 82 C65 90 58 92 50 92 C42 92 35 90 33 82 Z', { fill: 'cream', w: 1.05 });
        for (var i = 1; i < 5; i++) p.line(31 + i * 7.6, 69, 31 + i * 7.6 + (i - 2.5) * 0.4, 79, { w: 0.5, detail: true, wob: 0.2 });
      });
      p.path('M17 46 C15 22 30 8 50 8 C70 8 85 22 83 46 C83 56 77 61 70 64 L70 74 L30 74 L30 64 C23 61 17 56 17 46 Z', { fill: 'cream', w: 1.1 });
      p.path('M24 33 C25 24 30 17 37 14', { ink: 'white', w: 0.8, detail: true, wob: 0.3 });
      [[36, 46], [64, 46]].forEach(function (e, i) {
        p.ellipse(e[0], e[1], 9.5, 10.5, { fill: K, w: 0.6, ink: K });
        p.line(e[0] - 3.4, e[1] - 4, e[0] - 2.4, e[1] - 2.6, { ink: 'white', w: 1.3, cap: 'round', wob: 0 });
        twinkle(p, e[0] + 2, e[1] + 1, 3.6, M.seg(M.frac(t + i * 0.2), 0.1, 0.7), 'white');
      });
      p.path('M50 55 L45 63 C48 65 52 65 55 63 Z', { fill: K, w: 0.5, ink: K });
      cheek(p, 22, 62, 0.8); cheek(p, 78, 62, 0.8);
      p.rect(30, 64, 40, 10, { fill: 'white', r: 2, w: 0.9 });
      for (var j = 1; j < 5; j++) p.line(30 + j * 8, 64.5, 30 + j * 8, 73.5, { w: 0.5, detail: true, wob: 0.2 });
    });
    var k = tp ? M.frac(u * 4) : M.frac(t * 4), cl = M.seg(k, 0.0, 0.5);
    if (ch < 0.12 || (tp && drop < 3)) [[-1, 0], [1, 0.1]].forEach(function (q) { p.span('M' + (50 + q[0] * 40) + ' 86 L' + (50 + q[0] * 49) + ' 80', M.easeIn(M.seg(cl, 0.5, 1)), M.easeOut(M.seg(cl, 0, 0.5)), { w: 0.8 }); });
  }
});

/* 👽 an alien: the antennae bob a beat behind the head, their lamps pulsing, the huge eyes blinking, the head swaying.
   Tap: a zap of light jumps between the antenna tips and the eyes flash. */
D.add('alien', {
  fam: 'faces', tags: ['ufo', 'space', 'extraterrestrial', 'weird', 'sci-fi', 'invader', 'martian', 'emoji', '👽'], loop: 2.4, still: 0.3, tapLen: 1.2, burst: 'spark', burstAt: [50, 6], burstN: 5, burstSpread: 3, margin: [22, 18, 4, 18],
  about: 'antennae bob behind the head, lamps pulsing, a blink', tapAbout: 'a zap of light jumps between the antenna tips',
  draw: function (p, t, s) {
    var tp = s.tap >= 0, u = tp ? s.tap : 0, zap = tp ? M.bump(M.seg(u, 0.1, 0.8)) : 0, sw = 0.06 * M.wave(t, 1), bob = 1.5 * M.wave(t, 2, 0.25);
    p.pivot(50, 96, sw, 1, function () {
      p.move(0, bob);
      [-1, 1].forEach(function (sd, i) {
        var lag = 0.2 * M.wave(t, 2, -0.12 - i * 0.05) + 0.1 * M.wave(t, 1, -0.2), bx = 50 + sd * 16;
        p.pivot(bx, 34, lag, 1, function () {
          p.path('M' + bx + ' 34 C' + (bx + sd * 6) + ' 24 ' + (bx + sd * 10) + ' 16 ' + (bx + sd * 14) + ' 9', { w: 1.1, cap: 'round' });
          var r = 4.2 * (1 + 0.18 * M.wave(t, 2, 0.1 + i * 0.2) + 0.5 * zap);
          p.circle(bx + sd * 14, 7, r, { fill: 'a', w: 0.9 }); p.line(bx + sd * 12.4, 5.2, bx + sd * 12.9, 4.6, { ink: 'white', w: 0.8, cap: 'round', wob: 0 });
        });
      });
      p.path('M50 26 C80 24 92 44 86 62 C82 78 66 92 50 94 C34 92 18 78 14 62 C8 44 20 24 50 26 Z', { fill: 'leaf', w: 1.15 });
      p.path('M22 46 C24 38 28 34 34 32', { ink: 'mint', w: 0.9, detail: true, wob: 0.3 });
      var e = blink(t, 0.7);
      [[1, 0], [-1, 0]].forEach(function (q) {
        var sd = q[0];
        p.pivot(50 - sd * 17, 58, 0, [1, e], function () { p.path('M' + (50 - sd * 4) + ' 62 C' + (50 - sd * 4) + ' 51 ' + (50 - sd * 20) + ' 44 ' + (50 - sd * 30) + ' 46 C' + (50 - sd * 31) + ' 56 ' + (50 - sd * 20) + ' 68 ' + (50 - sd * 4) + ' 62 Z', { fill: K, w: 0.7, ink: K }); });
        if (e > 0.5) p.line(50 - sd * 24, 51, 50 - sd * 22.4, 52.4, { ink: zap > 0.1 ? 'a' : 'white', w: 1.5, cap: 'round', wob: 0 });
      });
      p.path('M43 79 C47 81 53 81 57 79', { ink: K, w: 1, cap: 'round' });
      p.dot(47.4, 71, 0.9, K); p.dot(52.6, 71, 0.9, K);
    });
    if (zap > 0.1) {                                                                  /* the arc between the lamps */
      var j = M.frac(u * 6), pts = [[34 + 0.5 * 0, 4]], i; for (i = 1; i < 6; i++) pts.push([34 + i * 6.4, 4 + (i % 2 ? -7 : 5) * (1 + 0.4 * M.wave(j, 1, i * 0.2))]); pts.push([66, 4]);
      p.draw(pts.map(function (q, k) { return (k ? 'L' : 'M') + q[0] + ' ' + q[1]; }).join(' '), M.easeOut(M.seg(u, 0.1, 0.3)), { ink: 'a', w: 1.1, cap: 'round' });
    }
  }
});

/* 🤖 a robot: the antenna lamp blinks, the eyes scan side to side, the head bobs, and the two gears in its chest turn
   against each other. Tap: the head boings up on its spring neck, sparks off the antenna, the mouth lights up and the gears race. */
D.add('robot', {
  fam: 'faces', tags: ['bot', 'ai', 'machine', 'tech', 'automation', 'gears', 'android', 'emoji', '🤖'], loop: 2.4, still: 0.3, tapLen: 1.3, burst: 'spark', burstAt: [50, 4], burstN: 5, burstSpread: 3, margin: [20, 18, 4, 18],
  about: 'the lamp blinks, eyes scan, the chest gears turn together', tapAbout: 'the head boings up on its spring neck, sparks fly, the gears race',
  draw: function (p, t, s) {
    var tp = s.tap >= 0, u = tp ? s.tap : 0, bo = tp ? M.spring(M.seg(u, 0, 0.35)) * (1 - M.ease(M.seg(u, 0.55, 1))) : 0;
    var hy = 12 - 11 * bo + 1.2 * M.wave(t, 2), on = M.bump(M.seg(M.frac(t * 2), 0.0, 0.5));
    var m = 3 * t + (tp ? 12 * (u - Math.sin(TAU * u) / TAU) : 0), ga = TAU / 8 * m, gb = -TAU / 7 * m + Math.PI / 7;      /* teeth passed at the mesh: the second wheel turns the other way */
    p.rect(14, 62, 72, 36, { fill: 'grey', r: 9, w: 1.1 });
    p.rect(24, 68, 52, 24, { fill: 'night', r: 5, w: 0.8 });
    gear(p, 42, 80, 11, 8, ga, 'gold'); gear(p, 62, 80, 9.4, 7, gb + 0.2, 'orange');
    p.circle(20, 66, 1.1, { fill: 'white', line: false }); p.circle(80, 66, 1.1, { fill: 'white', line: false });
    var i;
    for (i = 0; i < 4; i++) { var yy = hy + 40 + (62 - hy - 40) * (i + 0.5) / 4; p.line(43, yy, 57, yy, { w: 0.9, cap: 'round' }); }
    p.pivot(50, 40 + hy, 0.02 * M.wave(t, 1), 1, function () {
      p.move(0, hy);
      p.line(50, 0, 50, -9, { w: 1 }); p.circle(50, -12, 3.8 + 1.2 * on, { fill: on > 0.4 ? 'red' : 'smoke', w: 0.9 });
      if (on > 0.3) { p.arc(50, -12, 8 + 3 * on, -2.5, -0.65, { w: 0.6, cap: 'round' }); p.arc(50, -12, 12 + 3 * on, -2.4, -0.75, { w: 0.5, cap: 'round', detail: true }); }
      p.rect(12, 14, 7, 14, { fill: 'gold', r: 2, w: 0.9 }); p.rect(81, 14, 7, 14, { fill: 'gold', r: 2, w: 0.9 });
      p.rect(18, 0, 64, 42, { fill: 'grey', r: 11, w: 1.1 });
      p.path('M26 8 C34 6 40 6 46 7', { ink: 'white', w: 0.8, detail: true, wob: 0.3 });
      var sc = 3.4 * M.wave(t, 1), bl = blink(t, 0.8);
      [34, 66].forEach(function (x) { p.rect(x - 8, 11, 16, 13, { fill: 'night', r: 4, w: 0.8 }); p.rect(x - 3 + sc, 14.5 + 6 * (1 - bl), 6, 6.5 * bl + 0.6, { fill: 'mint', r: 1.6, line: false }); });
      p.rect(33, 30, 34, 8, { fill: 'white', r: 3, w: 0.9 });
      for (i = 0; i < 5; i++) { var lit = tp && M.frac(u * 3 - i * 0.14) < 0.4; p.rect(35.5 + i * 6.3, 31.5, 4.6, 5, { fill: lit ? 'a' : 'smoke', r: 1, line: false }); }
    });
  }
});

/* 🤷 a shrug: the shoulders rise, the head sinks and tips, the hands open palm-up beside it, the eyes slide sideways, then it all lets go.
   Tap: a bigger shrug and a question mark drawn over the head. */
D.add('shrug', {
  fam: 'faces', tags: ['dunno', 'idk', 'whatever', 'unsure', 'maybe', 'shrug', 'who knows', 'person', '🤷'], loop: 2.4, still: 0.3, tapLen: 1.5, burst: false, margin: [20, 22, 2, 22],
  about: 'shoulders rise, head sinks, hands open palm-up, then it lets go', tapAbout: 'a bigger shrug with a question mark drawn over the head',
  draw: function (p, t, s) {
    var tp = s.tap >= 0, u = tp ? s.tap : 0;
    var sh = tp ? 1.35 * M.spring(M.seg(u, 0, 0.3)) * (1 - M.ease(M.seg(u, 0.62, 0.95))) : M.spring(M.seg(t, 0.1, 0.35)) * (1 - M.ease(M.seg(t, 0.62, 0.85)));
    var side = function (sd) {
      var base = [[31, 74], [23, 81], [17, 85], [12, 82], [10, 73], [9, 66]], c = base.map(function (q, i) { return [q[0] - 2 * sh * i / 5, q[1] - 9 * sh * Math.pow(i / 5, 1.3)]; }), w = c[5];
      p.at(w[0], w[1] + 1, -0.32 - 0.1 * sh, 0.45, function () { openHand(p, { spread: 0.7, thumb: -1.1 }); });
      tube(p, c, 11, { fill: 'c', w: 1.05 });
    };
    p.pivot(50, 100, 0, [1, 1 + 0.07 * sh], function () { side(1); p.pivot(50, 0, 0, [-1, 1], function () { side(1); }); });
    p.pivot(50, 100, 0, [1, 1 + 0.07 * sh], function () { p.path('M26 100 C24 84 24 72 36 66 C44 63 56 63 64 66 C76 72 76 84 74 100 Z', { fill: 'c', w: 1.1 }); p.path('M44 66 C47 71 53 71 56 66', { w: 0.5, detail: true, wob: 0.3 }); });
    p.at(50, 41 + 4 * sh, 0.1 * sh + 0.03 * M.wave(t, 1), 0.62, function () {
      p.move(-50, -50);
      head(p); cheek(p, 22, 62, 0.8); cheek(p, 78, 62, 0.8);
      brow(p, 33, 30 - 3 * sh, -0.35, 14); brow(p, 67, 30 - 3 * sh, 0.35, 14);
      var lx = 3 * sh - 1.5 * (1 - sh) * M.wave(t, 1), ly = -1.5 * sh;
      eye(p, 34, 45, blink(t, 0.88), { lx: lx, ly: ly, k: 1.15 }); eye(p, 66, 45, blink(t, 0.88), { lx: lx, ly: ly, k: 1.15 });
      p.path('M38 68 C44 66 56 66 62 69', { ink: K, w: 1.6, cap: 'round' });
    });
    if (tp) {
      var d = M.easeOut(M.seg(u, 0.15, 0.4)), gone = M.easeIn(M.seg(u, 0.75, 1)), k = 1.1 + 0.3 * M.bump(M.seg(u, 0.15, 0.7));
      p.at(78, 6, 0.12, k, function () { p.span(QMARK, gone, d, { w: 1.3, cap: 'round' }); if (d > 0.97 && gone < 0.3) p.dot(4, 16, 1.4, K); });
    }
  }
});

/* 😎 cool: shades on, a slow confident sway, a smirk, a glint sweeping across the lenses. Tap: the shades flip up
   onto the brow and drop back with a ting. */
D.add('cool', {
  fam: 'faces', tapRest: 0.25, tags: ['sunglasses', 'chill', 'awesome', 'summer', 'swag', 'smooth', 'face', 'emoji', '😎'], loop: 2.8, still: 0.3, tapLen: 1.4, burst: false,
  about: 'a slow sway, a smirk, a glint sweeping across the shades', tapAbout: 'the shades flip up onto the brow and drop back with a ting',
  draw: function (p, t, s) {
    var tp = s.tap >= 0, u = tp ? s.tap : 0, up = tp ? M.easeOut(M.seg(u, 0.05, 0.2)) * (1 - M.spring(M.seg(u, 0.4, 0.7))) : 0, tilt = tp ? 0.06 * M.bump(M.seg(u, 0, 0.9)) : 0;
    p.pivot(50, 85, 0.05 * M.wave(t, 1) - tilt, 1, function () {
      p.move(0, -1.2 * M.wave(t, 2, 0.25));
      head(p); cheek(p, 22, 62, 0.9); cheek(p, 78, 62, 0.9);
      p.path('M34 66 C42 71 56 71 68 62', { ink: K, w: 1.3, cap: 'round' });
      p.path('M66 61 C68 60 69 59 70 57', { ink: K, w: 0.6, cap: 'round', detail: true });
      p.move(0, -26 * up); p.turn(-0.12 * up);
      p.path('M17 36 L10 34', { w: 1, cap: 'round' }); p.path('M83 36 L90 34', { w: 1, cap: 'round' });
      [[0, 1], [100, -1]].forEach(function (e) { var x = e[0], sd = e[1]; p.path('M' + (x + sd * 17) + ' 36 C' + (x + sd * 17) + ' 34 ' + (x + sd * 21) + ' 33 ' + (x + sd * 25) + ' 33 L' + (x + sd * 41) + ' 33 C' + (x + sd * 46) + ' 33 ' + (x + sd * 48) + ' 38 ' + (x + sd * 47) + ' 44 C' + (x + sd * 45) + ' 52 ' + (x + sd * 40) + ' 55 ' + (x + sd * 33) + ' 54 C' + (x + sd * 25) + ' 53 ' + (x + sd * 18) + ' 49 ' + (x + sd * 17) + ' 36 Z', { fill: K, w: 0.8, ink: K }); });
      p.path('M47 39 C49 36.5 51 36.5 53 39', { w: 1.1 });
      [24, 60].forEach(function (x) { p.line(x, 38.5, x + 7, 38.5, { ink: 'white', w: 1.1, cap: 'round', wob: 0 }); });
      var g = M.seg(t, 0.15, 0.55);                                                    /* the glint sweeping across */
      if (g > 0 && g < 1) [0, 36].forEach(function (o) { p.line(24 + o + 18 * g, 52, 29 + o + 18 * g, 35, { ink: 'white', w: 1.5, cap: 'round', wob: 0, alpha: 0.9 }); });
    });
    twinkle(p, 76, 22, 8, tp ? M.seg(u, 0.65, 0.95) : M.seg(t, 0.55, 0.8), 'a');
  }
});

/* 😵‍💫 dizzy: spirals for eyes turning one way, the head wobbling in a slow circle, stars orbiting above and a wavering mouth.
   Tap: it spins right round and the stars scatter. */
D.add('dizzy', {
  fam: 'faces', tapRest: 0.1, tags: ['spin', 'woozy', 'confused', 'drunk', 'faint', 'hypnotised', 'face', 'emoji', '😵'], loop: 2.4, still: 0.2, tapLen: 1.4, burst: 'star', burstAt: [50, 12], burstN: 5, burstSpread: 3.4, margin: [24, 20, 4, 20],
  about: 'spiral eyes turn, the head wobbles round, stars orbit above', tapAbout: 'it spins right round and the stars scatter',
  draw: function (p, t, s) {
    var tp = s.tap >= 0, u = tp ? s.tap : 0, spin = tp ? TAU * M.ease(M.seg(u, 0, 0.8)) : 0, i;
    p.pivot(50, 60, 0.08 * M.wave(t, 1) + spin, 1, function () {
      p.move(3 * M.wave(t, 1, 0.25), 1.6 * M.wave(t, 2));
      head(p);
      [[35, 1], [65, -1]].forEach(function (e) {
        var pts = []; for (i = 0; i <= 28; i++) { var a = i / 28 * 2.7 * TAU, r = 1 + 8.6 * i / 28; pts.push([e[0] + r * Math.cos(a + e[1] * TAU * t), 45 + r * Math.sin(a + e[1] * TAU * t)]); }
        p.curve(pts, { w: 0.9, ink: K });
      });
      var w = ''; for (i = 0; i <= 12; i++) w += (i ? 'L' : 'M') + (38 + i * 2) + ' ' + (68 + 2.6 * Math.sin(TAU * (i / 4.5 - t * 2))) + ' ';
      p.path(w, { ink: K, w: 1.2, cap: 'round' });
    });
    if (!tp) for (i = 0; i < 3; i++) { var a = TAU * (t + i / 3); p.star(50 + 34 * Math.cos(a), 12 + 6 * Math.sin(a), 6, 2.6, 5, { fill: 'a', w: 0.7, rot: a * 2 }); }
  }
});

/* 🤧 a sneeze coming: the head tips back, the nose wrinkles and twitches, then ACHOO into the tissue, spray flying, and a sniffle.
   Tap: the sneeze, right now. */
D.add('sneeze', {
  fam: 'faces', tags: ['achoo', 'sick', 'cold', 'allergy', 'ill', 'flu', 'tissue', 'face', 'emoji', '🤧'], loop: 3, still: 0.2, tapLen: 1.2, burst: false, margin: [18, 22, 4, 22],
  about: 'builds to a sneeze, ACHOO into the tissue, spray, a sniffle', tapAbout: 'the sneeze, right now',
  draw: function (p, t, s) {
    var tt = s.tap >= 0 ? 0.4 + 0.6 * s.tap : t, pre = tt < 0.58 ? M.ease(M.seg(tt, 0.04, 0.55)) : 0, snap = M.spring(M.seg(tt, 0.58, 0.7)) * (1 - M.ease(M.seg(tt, 0.78, 0.95))), shut = tt >= 0.58 && tt < 0.82;
    var open = tt < 0.78 ? (1 + 0.2 * pre) * (1 - M.ease(M.seg(tt, 0.56, 0.6))) : 0.55 * M.ease(M.seg(tt, 0.8, 0.86)) + 0.45 * M.ease(M.seg(tt, 0.88, 1));
    p.pivot(50, 88, -0.1 * pre + 0.13 * snap, 1, function () {
      p.move(0, 2 * snap);
      head(p); cheek(p, 22, 61, 1);
      brow(p, 35, 32 - 3 * pre, -0.1 - 0.25 * snap, 12); brow(p, 65, 32 - 3 * pre, 0.1 + 0.25 * snap, 12);
      eye(p, 36, 44, open, { k: 1 + 0.15 * pre, up: shut }); eye(p, 64, 44, open, { k: 1 + 0.15 * pre, up: shut });
      p.circle(50, 56, 5.2 + 1.2 * pre * M.wave(tt, 6), { fill: 'rose', w: 0.9 });
      if (shut) gape(p, 50, 66, 8, 7, { tongue: false }); else p.path('M42 68 C46 70 54 70 58 68', { ink: K, w: 1.1, cap: 'round' });
    });
    var f = M.ease(M.seg(tt, 0.5, 0.58)) * (1 - M.ease(M.seg(tt, 0.82, 0.94))), hx = M.lerp(78, 54, f), hy = M.lerp(96, 66, f);
    p.rect(hx + 2, hy + 6, 26, 20, { fill: 'skin', r: 9 });                                  /* the fist holding a tissue */
    p.path('M' + (hx - 14) + ' ' + (hy + 6) + ' C' + (hx - 18) + ' ' + (hy - 6) + ' ' + (hx - 2) + ' ' + (hy - 12) + ' ' + (hx + 8) + ' ' + (hy - 6) + ' C' + (hx + 20) + ' ' + (hy - 10) + ' ' + (hx + 26) + ' ' + (hy + 2) + ' ' + (hx + 20) + ' ' + (hy + 10) + ' C' + (hx + 8) + ' ' + (hy + 14) + ' ' + (hx - 6) + ' ' + (hy + 12) + ' ' + (hx - 14) + ' ' + (hy + 6) + ' Z', { fill: 'white', w: 1 });
    p.path('M' + (hx - 8) + ' ' + (hy + 2) + ' C' + (hx - 2) + ' ' + (hy - 2) + ' ' + (hx + 6) + ' ' + (hy - 2) + ' ' + (hx + 14) + ' ' + (hy + 2), { w: 0.45, detail: true, alpha: 0.5 });
    var q = M.seg(tt, 0.6, 0.92);
    if (q > 0 && q < 1) for (var i = 0; i < 7; i++) {                                         /* spray, flung out and shrinking */
      var a = -0.8 + i * 0.4, v = 18 + (i % 3) * 8, x = 50 + Math.cos(a) * v * q * 2.2 - 8, y = 64 + Math.sin(a) * v * q * 1.3 + 40 * q * q, sc = (1 - M.easeIn(M.seg(q, 0.6, 1))) * M.easeOut(M.seg(q, 0, 0.1));
      p.at(x, y, a + 1.57, 0.7 * sc, function () { p.path(DROP, { fill: 'sky', w: 0.8 }); });
    }
  }
});

/* 😜 playful: one eye winking, the other rolling, the mouth wide and the tongue hanging out, wagging side to side.
   Tap: a raspberry, the tongue buzzing and spit flying. */
D.add('tongue', {
  fam: 'faces', tags: ['silly', 'playful', 'joke', 'raspberry', 'goofy', 'crazy', 'cheeky', 'face', 'emoji', '😜'], loop: 1.6, still: 0.2, tapLen: 1.2, burst: 'drop', burstAt: [50, 80], burstN: 5, burstSpread: 3.2,
  about: 'one eye winks, one rolls, the tongue wags', tapAbout: 'a raspberry: the tongue buzzes and spit flies',
  draw: function (p, t, s) {
    var tp = s.tap >= 0, u = tp ? s.tap : 0, buzz = tp ? M.bump(M.seg(u, 0, 0.9)) * M.wave(u, 10) : 0, wag = tp ? 0.1 * M.wave(u, 2) : 0.28 * M.wave(t, 1), ext = tp ? 4 * M.bump(M.seg(u, 0, 0.6)) : 0;
    p.pivot(50, 85, 0.07 * M.wave(t, 1, 0.25), 1, function () {
      p.move(0, -1.2 * Math.abs(M.wave(t, 2, 0.1)));
      head(p); cheek(p, 22, 60, 1); cheek(p, 78, 60, 1);
      brow(p, 35, 30, -0.12, 12); brow(p, 66, 33, 0.2, 12);
      var a = TAU * t;                                                                    /* the left eye circles */
      p.ellipse(36, 44, 6.4, 7, { fill: 'white', w: 0.9, ink: K }); p.circle(36 + 2.8 * Math.cos(a), 44 + 3 * Math.sin(a), 2.8, { fill: K, w: 0.4, ink: K });
      eye(p, 65, 45, 0, { up: true });
      p.path('M28 59 C32 80 68 80 72 59 Z', { fill: LIP, w: 1.05, ink: K });
      p.pivot(50, 66, wag, 1, function () {
        p.move(buzz * 1.2, ext);
        p.path('M41 66 L59 66 C60 82 58 90 50 90 C42 90 40 82 41 66 Z', { fill: 'pink', w: 1 });
        p.line(50, 70, 50, 82, { ink: 'rose', w: 0.7, cap: 'round' });
      });
    });
  }
});

/* 🥺 pleading: huge glossy eyes whose glints shimmer, brows pitched up, the lip quivering, a tear welling.
   Tap: the eyes swell and a tear rolls down the cheek. */
D.add('pleading', {
  fam: 'faces', tags: ['please', 'puppy', 'sad', 'beg', 'cute', 'aww', 'hopeful', 'face', 'emoji', '🥺'], loop: 2.4, still: 0.3, tapLen: 1.6, burst: false, margin: [18, 18, 14, 18],
  about: 'huge glossy eyes shimmer, the lip quivers, a tear wells', tapAbout: 'the eyes swell and a tear rolls down the cheek',
  draw: function (p, t, s) {
    var tp = s.tap >= 0, u = tp ? s.tap : 0, big = tp ? M.bump(M.seg(u, 0, 0.5)) : 0, wel = tp ? 1 : 0.3 + 0.7 * M.bump(M.seg(t, 0.3, 0.9));
    p.pivot(50, 85, 0.05 * M.wave(t, 1), 1, function () {
      p.move(0, -1 * M.wave(t, 1, 0.25));
      head(p); cheek(p, 20, 62, 1.2); cheek(p, 80, 62, 1.2);
      brow(p, 32, 27 - 2 * big, -0.3, 13); brow(p, 68, 27 - 2 * big, 0.3, 13);
      [34, 66].forEach(function (x, i) {
        var k = 1 + 0.12 * big;
        p.ellipse(x, 46, 9.2 * k, 10.4 * k, { fill: K, w: 0.6, ink: K });
        p.circle(x - 3 + 0.8 * M.wave(t, 2, i * 0.1), 41.5, 3.4, { fill: 'white', line: false }); p.circle(x + 3, 51, 1.7, { fill: 'white', line: false });
        p.path('M' + (x - 8.4) + ' 51 C' + (x - 4) + ' ' + (57 + 1.4 * wel) + ' ' + (x + 4) + ' ' + (57 + 1.4 * wel) + ' ' + (x + 8.4) + ' 51', { ink: 'sky', w: 1.3 + 1.1 * wel, cap: 'round', alpha: 0.9 });
      });
      var q = 0.6 * M.wave(t, 4);
      p.path('M42 70 C44 ' + (67 + q) + ' 48 ' + (66 - q) + ' 50 67 C52 ' + (66 - q) + ' 56 ' + (67 + q) + ' 58 70', { ink: K, w: 1.2, cap: 'round' });
      if (tp) { var d = M.easeIn(M.seg(u, 0.25, 0.85)), c = []; for (var i = 0; i <= 8; i++) c.push([26 - 2 * i / 8 + 2 * Math.sin(i / 8 * 3), 56 + 38 * i / 8]);
        if (d > 0.02) tube(p, along(c, Math.max(0, d - 0.35), d, 8), 3.4); }
    });
  }
});

/* 🤘 rock on: index and little finger up, the other two held down by the thumb; the fist headbangs, the wrist snapping to the beat.
   Tap: it rocks out, notes and stars flung off the horns. */
D.add('rock-on', {
  fam: 'faces', tags: ['rock', 'metal', 'horns', 'music', 'concert', 'awesome', 'hand', 'gesture', '🤘'], loop: 1.2, still: 0.1, tapLen: 1.3, burst: 'note star', burstAt: [50, 20], burstN: 7, burstSpread: 3, margin: [26, 20, 4, 20],
  about: 'headbangs to the beat, the wrist snapping', tapAbout: 'rocks out, notes and stars flung off the horns',
  draw: function (p, t, s) {
    var big = s.tap >= 0 ? M.bump(M.seg(s.tap, 0, 1)) : 0, beat = Math.pow(0.5 + 0.5 * M.wave(t, 2, 0.25), 2), amp = 1 + 1.4 * big;
    p.at(50, 87, (0.1 * M.wave(t, 2, 0.1) * amp) - 0.04, 1.1, function () { foldHand(p, { up: [1, 0, 0, 1], fan: [-0.1 - 0.04 * beat * amp, 0, 0, 0.1 + 0.04 * beat * amp] }); });
    cuff(p, 50, 85, 28, 15);
    for (var i = 0; i < 4; i++) {                                                         /* the beat, marks drawn out either side */
      var sd = i % 2 ? 1 : -1, a = M.frac(t * 2 + i * 0.25), r0 = 44;
      p.span('M' + (50 + sd * r0) + ' ' + (50 - (i >> 1) * 8) + ' L' + (50 + sd * (r0 + 8)) + ' ' + (50 - (i >> 1) * 8 - 6), M.easeIn(M.seg(a, 0.5, 1)), M.easeOut(M.seg(a, 0, 0.5)), { w: 0.8 });
    }
  }
});

/* 🤞 fingers crossed: the middle finger over the index, the pair squeezing tighter and loosening, a little lucky glint.
   Tap: it squeezes hard and clover leaves and stars fall from it. */
D.add('crossed-fingers', {
  fam: 'faces', tags: ['luck', 'hope', 'wish', 'please', 'fingers', 'good luck', 'hand', 'gesture', '🤞'], loop: 2.4, still: 0.2, tapLen: 1.4, burst: 'leaf star', burstAt: [48, 22], burstN: 7, burstSpread: 3, margin: [20, 18, 4, 18],
  about: 'the crossed fingers squeeze and loosen, a lucky glint', tapAbout: 'squeezes hard, clover leaves and stars fall off',
  draw: function (p, t, s) {
    var tp = s.tap >= 0, u = tp ? s.tap : 0, sq = tp ? M.spring(M.seg(u, 0, 0.3)) * (1 - M.ease(M.seg(u, 0.6, 1))) : 0.5 + 0.5 * M.wave(t, 1), cr = 0.34 + 0.12 * sq;
    p.at(50, 88, 0.05 * M.wave(t, 1, 0.1), 1.1, function () {
      var mid = limb(FB[1][0], FB[1][1], -cr, [FB[1][2] * 0.46, FB[1][2] * 0.3, FB[1][2] * 0.24], [0, 0.04 * sq, 0.06 * sq], 9.2, 7.8);
      foldHand(p, { up: [1, 0, 0, 0], hold: [0, 1, 0, 0], fan: [cr, 0, 0, 0], extra: [mid] });
    });
    cuff(p, 50, 86, 28, 14);
    twinkle(p, 74, 24, 7, M.seg(t, 0.5, 0.9));
  }
});

/* 💪 a flexed arm: the forearm rises and the bicep swells, held, then relaxes; a glint on the muscle.
   Tap: two hard pumps, stars flying off the fist. */
D.add('muscle', {
  fam: 'faces', tapRest: 0.25, tags: ['strong', 'flex', 'power', 'gym', 'biceps', 'workout', 'arm', 'strength', '💪'], loop: 2.4, still: 0.4, tapLen: 1.4, burst: 'star', burstAt: [58, 20], burstN: 5, burstSpread: 2.6, margin: [22, 18, 4, 18],
  about: 'the forearm rises and the bicep swells, then relaxes', tapAbout: 'two hard pumps, stars flying off the fist',
  draw: function (p, t, s) {
    var tp = s.tap >= 0, u = tp ? s.tap : 0, fl = tp ? Math.max(M.bump(M.seg(u, 0, 0.5)), M.bump(M.seg(u, 0.4, 0.95))) : M.spring(M.seg(t, 0.08, 0.34)) * (1 - M.ease(M.seg(t, 0.62, 0.86)));
    var ang = -0.9 + 0.9 * fl + 0.03 * M.wave(t, 3, 0.2), ex = 66, ey = 82;
    p.curve([[10, 90], [30, 93], [52, 93], [68, 92], [75, 86], [73, 78], [63, 72], [56, 62], [51, 54 - 7 * fl], [44, 49 - 10.5 * fl], [36, 48.5 - 11 * fl], [28, 53 - 6 * fl], [19, 64], [10, 70]], { close: true, fill: 'skin', w: 1.1 });   /* the upper arm, the bicep a rise in its top edge */
    p.pivot(ex, ey, ang * 0.9 + 0.5, 1, function () {                                                                  /* the forearm and fist */
      tube(p, [[ex, ey], [ex + 2, ey - 16], [ex + 2, ey - 32], [ex, ey - 42]], 17, { fill: 'skin', w: 1.1 });
      p.rect(ex - 14, ey - 64, 28, 26, { fill: 'skin', r: 10, w: 1.1 });
      [-6, 0, 6].forEach(function (x) { p.line(ex + x, ey - 62, ex + x, ey - 52, { ink: K, alpha: 0.5, w: 0.45, detail: true, wob: 0.3 }); });
      p.path('M' + (ex - 12) + ' ' + (ey - 48) + ' C' + (ex - 4) + ' ' + (ey - 44) + ' ' + (ex + 4) + ' ' + (ey - 44) + ' ' + (ex + 12) + ' ' + (ey - 48), { ink: K, alpha: 0.5, w: 0.45, detail: true, wob: 0.3 });
    });
    p.path('M31 ' + (60 - 4 * fl) + ' C33 ' + (55 - 6 * fl) + ' 38 ' + (52 - 8 * fl) + ' 43 ' + (52 - 8 * fl), { ink: 'white', w: 0.9, detail: true, wob: 0.3, alpha: 0.8 });
    p.path('M4 56 L22 58 L25 94 L7 96 Z', { fill: 'c', w: 1.1 }); p.line(8, 66, 23, 68, { w: 0.4, detail: true, wob: 0.3 });                   /* the sleeve */
    twinkle(p, 38, 58 - 9 * fl, 5, M.seg(t, 0.3, 0.6), 'white');
  }
});

})(Dingbats);

/* Nature: weather, sky, water, plants and animals. */
(function (D) {
'use strict';
var M = D.math, TAU = M.TAU, W = M.wave, seg = M.seg, eo = M.easeOut, ei = M.easeIn, bump = M.bump, lerp = M.lerp, sp = M.spring;

/* a window of the loop that starts at a and lasts d, wrapping past the seam: 0..1 inside it, -1 outside */
function win(t, a, d) { var u = M.frac(t - a) / d; return u < 1 ? u : -1; }
/* a closed ellipse as path data, so p.span can draw part of it */
function ring(x, y, rx, ry) { return 'M' + (x - rx) + ' ' + y + ' A' + rx + ' ' + ry + ' 0 1 1 ' + (x + rx) + ' ' + y + ' A' + rx + ' ' + ry + ' 0 1 1 ' + (x - rx) + ' ' + y; }
function bz(a, b, c, d, u) { var v = 1 - u; return [v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0], v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1]]; }
/* a filled strip along the curve f(s), s = v..u: width w0 at the start and w1 at the end (or w(s)) */
function tube(p, f, w0, w1, o, u, n, v) {
  n = n || 14; u = u == null ? 1 : u; v = v || 0;
  var L = [], R = [], i, s, a, b, q, nx, ny, d, w;
  for (i = 0; i <= n; i++) {
    s = v + (u - v) * i / n; a = f(Math.max(0, s - 0.01)); b = f(s + 0.01); q = f(s);
    nx = a[1] - b[1]; ny = b[0] - a[0]; d = Math.hypot(nx, ny) || 1;
    w = (typeof w0 === 'function' ? w0(s) : lerp(w0, w1, s)) / 2;
    L.push([q[0] + nx / d * w, q[1] + ny / d * w]); R.push([q[0] - nx / d * w, q[1] - ny / d * w]);
  }
  return p.curve(L.concat(R.reverse()), Object.assign({ close: true }, o));
}
/* the outline of a union of circles [x, y, r]; flat along the bottom when floor is given */
function puff(cs, floor) {
  var cx = 0, cy = 0, pts = [], i, j, k, n, a, x, y, ok;
  cs.forEach(function (c) { cx += c[0] / cs.length; cy += c[1] / cs.length; });
  for (i = 0; i < cs.length; i++) {
    n = Math.max(14, Math.round(cs[i][2] * 2.4));
    for (k = 0; k < n; k++) {
      a = k / n * TAU; x = cs[i][0] + Math.cos(a) * cs[i][2]; y = cs[i][1] + Math.sin(a) * cs[i][2]; ok = true;
      for (j = 0; j < cs.length; j++) if (j !== i && Math.hypot(x - cs[j][0], y - cs[j][1]) < cs[j][2] - 0.3) { ok = false; break; }
      if (!ok) continue;
      if (floor != null && y > floor) y = floor;
      pts.push([x, y, Math.atan2(y - cy, x - cx)]);
    }
  }
  pts.sort(function (a, b) { return a[2] - b[2]; });
  return pts;
}
/* Sutherland–Hodgman: keep the part of a polygon where g(point) >= 0 */
function clip(pts, g) {
  var out = [], i, a, b, ga, gb, u;
  for (i = 0; i < pts.length; i++) {
    a = pts[i]; b = pts[(i + 1) % pts.length]; ga = g(a); gb = g(b);
    if (ga >= 0) out.push(a);
    if ((ga >= 0) !== (gb >= 0)) { u = ga / (ga - gb); out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]); }
  }
  return out;
}
/* a sparkle that grows and goes: 0 at k = 0 and 1 */
function twinkle(p, x, y, r, k, c) { if (k > 0.03 && k < 0.97) p.star(x, y, r * bump(k), r * bump(k) * 0.28, 4, { fill: c || 'yellow', w: 0.6 }); }

/* a lid in the face colour coming down over a circle at (x, y): 0 open, 1 shut */
function lidOf(p, x, y, r, lid, skin) {
  var yc = y - r + 2 * r * Math.min(1, lid), hw = Math.sqrt(Math.max(0, r * r - (yc - y) * (yc - y)));
  p.path('M' + (x - hw) + ' ' + yc + ' A' + r + ' ' + r + ' 0 ' + (lid > 0.5 ? 1 : 0) + ' 1 ' + (x + hw) + ' ' + yc + ' Z', { fill: skin, w: 0.7 });
}
/* an eye: white, a pupil that looks (lx, ly in -1..1), a lid coming down from the top; shut it is a curved line */
function eye(p, x, y, r, lid, skin, lx, ly) {
  if (lid > 0.9) { p.path('M' + (x - r) + ' ' + y + ' Q' + x + ' ' + (y + r * 0.8) + ' ' + (x + r) + ' ' + y, { w: 0.9, cap: 'round' }); return; }
  p.circle(x, y, r, { fill: 'white', w: 0.7 });
  p.dot(x + (lx || 0) * r * 0.3, y + (ly || 0) * r * 0.3, r * 0.58);
  if (lid > 0.04) lidOf(p, x, y, r, lid, skin);
}
/* a blink at time a: a lid that falls and rises over d of the loop */
function blink(t, a, d) { var u = win(t, a, d || 0.06); return u < 0 ? 0 : bump(u); }
/* which way a flyer faces, from its sideways speed: +1 right, −1 left, 0 passing through */
function face(vx) { return Math.tanh(vx * 10); }

/* 💧 a drop swells, falls and stretches, goes into the puddle, and rings spread and are taken back.
   Tap: a big drop lands, the water throws up a jet that pinches off a bead, and it plinks back down. */
var DROP = 'M0 -14 C4 -7 9 -2 9 4 C9 10 5 14 0 14 C-5 14 -9 10 -9 4 C-9 -2 -4 -7 0 -14 Z';
D.add('raindrop', {
  fam: 'nature', tags: ['rain', 'water', 'drop', 'weather', 'puddle', 'wet', 'splash', 'drip', '💧'], loop: 2.2, still: 0.32, tapLen: 1.7, tapRest: 0.4, burst: false, margin: [12, 18, 14, 18],
  about: 'a drop swells, falls stretching, lands in a puddle; two rings spread and are taken back', tapAbout: 'a big drop lands, a jet rises and pinches off a bead that plinks back down',
  draw: function (p, t, s) {
    var WY = 82, K = 1.3;
    function drop(x, y, sx, sy, k) { p.at(x, y, 0, [sx * k, sy * k], function () { p.path(DROP, { fill: 'sky' }); p.path('M-4.5 3 C-5 6.5 -3 9.5 0 10.5', { ink: 'white', w: 0.6, detail: true }); }); }
    function rip(u, k, d) { if (u >= 0) { var e = eo(u); p.span(ring(50, WY, 6 + 31 * e * k, 1.4 + 6.6 * e * k), ei(seg(u, 0.5, 1)), 1, { w: 0.8 }); } }
    p.ellipse(50, WY, 39, 8, { fill: 'sky' });
    p.path('M24 82 C28 79 34 78 40 79', { w: 0.5, detail: true });
    if (s.tap < 0) {
      var u = seg(t, 0.14, 0.5), hit = seg(t, 0.5, 0.6), grow = sp(seg(t, 0, 0.14));
      if (t < 0.14) { if (grow > 0.03) drop(50, 24, 1, 1, grow * K); }
      else if (t < 0.5) drop(50, 24 + 40 * u * u, 1 - 0.07 * u, 1 + 0.22 * u, K);
      else if (hit < 1) p.pivot(50, WY, 0, [1 + 0.5 * hit, 1 - hit], function () { drop(50, WY - 14 * K, 1, 1, K); });
      rip(win(t, 0.52, 0.48), 1); rip(win(t, 0.6, 0.4), 0.7);
      var b = win(t, 0.5, 0.3);
      if (b >= 0) [-1, 1].forEach(function (d, i) { p.circle(50 + d * (10 + 6 * i) * b, WY - 2 - 30 * (1 + 0.2 * i) * 4 * b * (1 - b), 3 * (1 - ei(seg(b, 0.8, 1))), { fill: 'sky', w: 0.6 }); });
    } else {
      var q = s.tap, f = seg(q, 0, 0.2), up = eo(seg(q, 0.2, 0.42)), down = ei(seg(q, 0.62, 0.8)), h = 40 * up * (1 - down);
      if (q < 0.2) drop(50, 10 + 50 * f * f, 1, 1 + 0.25 * f, 1.55);
      else if (q < 0.3) p.pivot(50, WY, 0, [1 + 0.4 * seg(q, 0.2, 0.3), 1 - seg(q, 0.2, 0.3)], function () { drop(50, WY - 14 * 1.55, 1, 1, 1.55); });
      if (h > 2) tube(p, function (v) { return [50, WY - h * v]; }, 15, 6, { fill: 'sky' });
      var bu = seg(q, 0.42, 0.8), top = WY - 40 * up - 6;
      if (q < 0.42 && up > 0.05) drop(50, top, 1, 1, 0.5 + 0.2 * up);
      else if (q >= 0.42 && bu < 1) drop(50, bu < 0.4 ? top - 16 * eo(bu / 0.4) : lerp(top - 16, WY - 6, ei((bu - 0.4) / 0.6)), 1, 1 + 0.15 * bu, 0.7);
      rip(seg(q, 0.2, 0.7) < 1 && q >= 0.2 ? seg(q, 0.2, 0.7) : -1, 1); rip(q >= 0.28 && q < 0.78 ? seg(q, 0.28, 0.78) : -1, 0.75); rip(q >= 0.8 ? seg(q, 0.8, 1) : -1, 0.5);
    }
  }
});

/* ⚡ a storm cloud rumbles; a bolt is drawn down out of it, held, and taken back from the top; rain slants past.
   Tap: thunder — the cloud shakes, a big bolt and a smaller one strike, and a flash flares behind them. */
var BOLT = [[52, 34], [36, 64], [49, 64], [40, 97], [68, 54], [54, 54], [64, 34]];
function bolt(p, dx, k, yh, yt) {
  var q = clip(clip(BOLT, function (v) { return yh - v[1]; }), function (v) { return v[1] - yt; });
  if (q.length > 2 && yh - yt > 0.5) p.at(dx, 0, 0, 1, function () { p.pivot(52, 34, 0, k, function () { p.poly(q, { fill: 'yellow' }); }); });
}
D.add('lightning', {
  fam: 'nature', tags: ['storm', 'thunder', 'bolt', 'weather', 'cloud', 'rain', 'electric', 'power', '⚡'], loop: 2.4, still: 0.45, tapLen: 1.5, tapRest: 0.2, burst: 'spark', burstAt: [52, 70], burstN: 6, margin: [10, 14, 8, 14],
  about: 'the cloud rumbles; a bolt is drawn down, held, and taken back from the top; rain slants by', tapAbout: 'thunder: the cloud shakes, two bolts strike and a flash flares',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, yh, yt, flash, shake, k = 1;
    if (tap) { yh = lerp(34, 99, eo(seg(q, 0, 0.1))); yt = lerp(34, 99, ei(seg(q, 0.4, 0.62))); flash = sp(seg(q, 0, 0.3)) * (1 - ei(seg(q, 0.45, 0.7))); shake = 3.2 * Math.sin(q * 70) * (1 - seg(q, 0, 0.7)); }
    else { yh = lerp(34, 99, eo(seg(t, 0.3, 0.38))); yt = lerp(34, 99, ei(seg(t, 0.56, 0.7))); flash = bump(seg(t, 0.3, 0.55)) * 0.45; shake = 1.1 * W(t, 14) * bump(seg(t, 0.3, 0.58)); }
    [[0, 0.1, 18, 0], [1, 0.45, 28, 3], [2, 0.7, 74, 1], [3, 0.2, 84, 2]].forEach(function (r) {
      var ph = M.frac(t + r[1]), x = r[2], head = seg(ph, 0, 0.7), tail = seg(ph, 0.3, 1);
      p.span('M' + x + ' 46 L' + (x - 6) + ' 90', tail, head, { ink: 'blue', w: 0.7 });
    });
    if (flash > 0.02) p.star(53, 64, 46 * flash, 22 * flash, 10, { fill: 'yellow', alpha: 0.5, line: false, rot: 0.2 * flash });
    bolt(p, 0, 1, yh, yt);
    if (tap) bolt(p, -22, 0.55, lerp(34, 99, eo(seg(q, 0.08, 0.2))), lerp(34, 99, ei(seg(q, 0.45, 0.66))));
    p.at(shake, 2 * W(t, 1), 0, 1, function () {
      p.poly(puff([[26, 28, 13], [42, 20, 15], [61, 21, 14], [76, 29, 11], [50, 31, 17]], 42), { fill: 'grey' });
      p.path('M30 38 C44 42 62 42 74 37', { w: 0.45, detail: true });
    });
  }
});

/* 🌈 five bands are drawn across one after another, held, and wiped away from the left; clouds bob at the feet.
   Tap: the bands lift and settle one after another, and a star pops at the top. */
function band(cx, cy, ro, ri, a0, a1) {
  var P = function (r, a) { return (cx + r * Math.cos(a)).toFixed(2) + ' ' + (cy + r * Math.sin(a)).toFixed(2); };
  return 'M' + P(ro, a0) + ' A' + ro + ' ' + ro + ' 0 0 1 ' + P(ro, a1) + ' L' + P(ri, a1) + ' A' + ri + ' ' + ri + ' 0 0 0 ' + P(ri, a0) + ' Z';
}
D.add('rainbow', {
  fam: 'nature', tags: ['sky', 'colour', 'weather', 'pride', 'arc', 'rain', '🌈'], loop: 3.2, still: 0.55, tapLen: 1.4, tapRest: 0.3, burst: 'star', burstAt: [50, 24], burstN: 5, margin: [10, 14, 10, 14],
  about: 'bands are drawn across one after another, held, then wiped away from the left', tapAbout: 'the bands lift and settle in turn and a star pops at the top',
  draw: function (p, t, s) {
    var small = p.small, n = small ? 3 : 5, th = small ? 8.5 : 5.6, COL = small ? ['red', 'yellow', 'sky'] : ['red', 'orange', 'yellow', 'leaf', 'sky'], i;
    for (i = 0; i < n; i++) {
      var sw = eo(seg(t, i * 0.05, 0.3 + i * 0.05)), out = ei(seg(t, 0.7 + (n - 1 - i) * 0.04, 0.84 + (n - 1 - i) * 0.04)), lift = s.tap >= 0 ? 4 * bump(seg(s.tap, i * 0.09, 0.35 + i * 0.09)) : 0;
      var ro = 42 - i * th + lift, a0 = Math.PI + Math.PI * out, a1 = Math.PI + Math.PI * sw;
      if (a1 - a0 > 0.02) p.path(band(50, 78, ro, ro - th, a0, a1), { fill: COL[i], w: 0.55 });
    }
    [[1, 0], [-1, 0.5]].forEach(function (c) {
      var x = 50 + c[0] * 38 * -1, dy = 1.6 * W(t, 1, c[1]);
      p.at(x, 79 + dy, 0, [-c[0] || 1, 1], function () { p.poly(puff([[-12, 1, 9], [0, -6, 11], [11, 1, 8]], 11), { fill: 'white' }); });
    });
  }
});

/* 🌙 the moon runs through its phases: new, crescent, half, gibbous, full, and back; stars twinkle in turn.
   Tap: the phases sweep round once more, quickly, and stars fall out. */
D.add('moon', {
  fam: 'nature', tags: ['night', 'sky', 'phases', 'crescent', 'lunar', 'sleep', 'dark', '🌙', '🌓'], loop: 5, still: 0.36, tapLen: 1.6, burst: 'star', burstAt: [50, 40], burstN: 5, margin: [8, 14, 8, 14],
  about: 'new, crescent, half, gibbous, full and back; stars twinkle in turn', tapAbout: 'one more quick round of phases, shaking stars loose',
  draw: function (p, t, s) {
    var ph = t + (s.tap >= 0 ? M.ease(seg(s.tap, 0.05, 0.85)) : 0), wax = M.frac(ph) < 0.5, k = Math.cos(TAU * (wax ? M.frac(ph) : 1 - M.frac(ph))), cx = 50, cy = 52, r = 31;
    twinkle(p, 14, 22, 8, M.frac(t * 2 + 0.1), 'yellow'); twinkle(p, 86, 16, 6.5, M.frac(t * 2 + 0.5), 'yellow'); twinkle(p, 82, 86, 7, M.frac(t * 2 + 0.85), 'yellow');
    p.pivot(cx, cy, 0.07 * W(t, 1), 1, function () {
      p.circle(cx, cy, r, { fill: 'night', alpha: 0.13, line: false });
      p.circle(cx, cy, r, { ink: 'ink', alpha: 0.45, w: 0.5, dash: [2.4, 3.2] });
      if (k > 0.97) return;
      p.pivot(cx, cy, 0, [wax ? 1 : -1, 1], function () {
        var lit = 'M' + cx + ' ' + (cy - r) + ' A' + r + ' ' + r + ' 0 0 1 ' + cx + ' ' + (cy + r) + ' A' + Math.abs(k * r).toFixed(2) + ' ' + r + ' 0 0 ' + (k > 0 ? 0 : 1) + ' ' + cx + ' ' + (cy - r) + ' Z';
        p.path(lit, { fill: 'yellow' });
        p.clip(lit, function () { [[16, -10, 4.6], [10, 14, 3.4], [22, 6, 2.4], [-8, -18, 3.6], [-14, 8, 4.4]].forEach(function (c) { p.circle(cx + c[0], cy + c[1], c[2], { w: 0.5, detail: true }); }); });
      });
    });
  }
});

/* ☄ a rock with a glowing head and a forked tail crosses the sky from upper right to lower left; the tail grows
   as it enters and is drawn back into the head as it goes. Tap: a bigger, faster one blazes across, shedding stars. */
function cometAt(u) { return [90 - 78 * u + 6 * u * (1 - u), 10 + 68 * u - 14 * u * (1 - u)]; }
function comet(p, u, k, tl) {
  if (k < 0.03) return;
  var h = cometAt(u), tail = function (sc) { return function (v) { return cometAt(u - v * 0.5 * tl * sc); }; };
  if (tl > 0.04) {
    tube(p, tail(1), 24 * k, 0, { fill: 'flame', alpha: 0.9 }, 1, 12);
    tube(p, tail(0.75), 13 * k, 0, { fill: 'yellow', line: false }, 1, 12);
    [-1, 1].forEach(function (d) { p.span('M' + (h[0] + d * 6) + ' ' + (h[1] - d * 6) + ' L' + (h[0] + d * 6 + 40 * tl) + ' ' + (h[1] - d * 6 - 33 * tl), 0.12, 1, { w: 0.4, detail: true }); });
  }
  p.circle(h[0], h[1], 15 * k, { fill: 'yellow', alpha: 0.55, line: false });
  p.blob(h[0], h[1], 9.5 * k, { fill: 'stone', lumpy: 0.16, seed: 4, n: 8 });
  p.dot(h[0] - 2.6 * k, h[1] - 2 * k, 1.8 * k); p.dot(h[0] + 3 * k, h[1] + 2.6 * k, 1.3 * k);
}
D.add('comet', {
  fam: 'nature', tags: ['space', 'sky', 'star', 'night', 'astronomy', 'shooting star', 'meteor', '☄'], loop: 2.6, still: 0.46, tapLen: 1.2, tapRest: 0.4, burst: 'star', burstAt: [60, 30], burstN: 6, burstSpread: 4, margin: [14, 14, 14, 14],
  about: 'a comet crosses the sky; its tail grows in and is drawn back into the head; stars twinkle', tapAbout: 'a bigger, faster one blazes across, shedding stars',
  draw: function (p, t, s) {
    twinkle(p, 20, 22, 7, M.frac(t * 2), 'yellow'); twinkle(p, 78, 84, 6, M.frac(t * 2 + 0.5), 'yellow'); twinkle(p, 52, 12, 5, M.frac(t * 2 + 0.25), 'yellow');
    if (s.tap >= 0) { var q = s.tap; comet(p, eo(seg(q, 0, 0.8)) * 1.02, 1.3 * (1 - ei(seg(q, 0.75, 1))), 1.35 * (1 - ei(seg(q, 0.7, 1)))); return; }
    var w = seg(t, 0.04, 0.84);
    comet(p, w, sp(seg(w, 0, 0.12)) * (1 - ei(seg(w, 0.86, 1))), seg(w, 0, 0.3) * (1 - ei(seg(w, 0.8, 1))));
  }
});

/* 🌊 a swell rises, curls its lip over, breaks into foam and spray, and sinks back; the front water slides.
   Tap: the wave surges higher and throws spray. */
var WA = [0, 86, 16, 84, 30, 76, 44, 66, 52, 60, 62, 56, 72, 56, 80, 56, 86, 60, 84, 66, 80, 62, 74, 60, 68, 62, 66, 64, 68, 68, 72, 70, 82, 74, 92, 80, 100, 86];
var WB = [0, 86, 16, 84, 28, 66, 40, 44, 48, 28, 60, 12, 76, 12, 90, 12, 100, 26, 92, 44, 88, 34, 76, 28, 66, 34, 58, 38, 56, 52, 68, 62, 80, 70, 92, 78, 100, 86];
D.add('ocean-wave', {
  fam: 'nature', tags: ['sea', 'water', 'surf', 'tide', 'beach', 'ocean', 'wave', 'hokusai', '🌊'], loop: 3.4, still: 0.5, tapLen: 1.5, tapRest: 0.3, burst: 'drop', burstAt: [80, 26], burstN: 8, burstSpread: 3.2, margin: [10, 12, 4, 6],
  about: 'a swell rises and curls its lip, breaks to foam and spray, sinks back; the front water slides', tapAbout: 'the wave surges higher and throws spray',
  draw: function (p, t, s) {
    var c = M.ease(seg(t, 0, 0.55)) * (1 - M.ease(seg(t, 0.72, 0.96))), f = bump(seg(t, 0.5, 0.96));
    if (s.tap >= 0) { c = lerp(c, 1.15, sp(seg(s.tap, 0, 0.45)) * (1 - ei(seg(s.tap, 0.6, 1)))); f = Math.max(f, bump(seg(s.tap, 0.1, 0.9))); }
    var v = WA.map(function (a, i) { return lerp(a, WB[i], c); }), pt = function (i) { return v.slice(i, i + 6).join(' '); };
    var d = 'M0 100 L' + v[0] + ' ' + v[1] + ' C' + pt(2) + ' C' + pt(8) + ' C' + pt(14) + ' C' + pt(20) + ' C' + pt(26) + ' C' + pt(32) + ' L100 100 Z';
    p.path(d, { fill: 'sea' });
    p.clip(d, function () {
      p.path('M10 90 C30 90 40 78 50 66 C56 58 60 56 68 56', { ink: 'white', w: 0.4, detail: true, alpha: 0.8 });
      p.path('M18 96 C40 94 58 86 70 76', { ink: 'white', w: 0.4, detail: true, alpha: 0.8 });
    });
    var tip = [v[18], v[19]], crest = [v[12], v[13]], R = p.rng(3), j;
    if (f > 0.1) p.poly(puff([[tip[0] - 2, tip[1] - 3, 6.5 * f], [tip[0] - 11, tip[1] - 9, 5.5 * f], [tip[0] + 3, tip[1] + 5, 4.5 * f], [tip[0] - 17, tip[1] - 12, 4 * f]]), { fill: 'white', w: 0.6, wob: 0.5 });
    var sprayT = s.tap >= 0 ? 0 : seg(t, 0.62, 0.95);
    if (sprayT > 0 && sprayT < 1) for (j = 0; j < 6; j++) { var vx = 8 + 14 * R(), vy = -22 - 16 * R(); p.circle(tip[0] + vx * sprayT, tip[1] + vy * sprayT + 46 * sprayT * sprayT, 1.8 * (1 - ei(sprayT)), { fill: 'white', w: 0.5 }); }
    var fr = []; for (j = 0; j <= 20; j++) fr.push([j * 5, 91 + 2.4 * W(j / 10 - t, 1)]);
    p.curve(fr.concat([[100, 101], [0, 101]]), { fill: 'blue', close: true });
  }
});

/* 🍁 a leaf unfolds from its bud, hangs and trembles, lets go and falls rocking side to side, lands and is gone.
   Tap: a gust turns the hanging leaf over on its stem, twice. */
var MAPLE = (function () {
  var spec = [[0, 31], [30, 16], [62, 28], [92, 15], [120, 22], [152, 10], [180, 6]], out = [], i, a, r;
  for (i = 0; i < spec.length; i++) { a = spec[i][0] * Math.PI / 180; out.push([spec[i][1] * Math.sin(a), -spec[i][1] * Math.cos(a)]); }
  for (i = spec.length - 2; i > 0; i--) { a = spec[i][0] * Math.PI / 180; out.push([-spec[i][1] * Math.sin(a), -spec[i][1] * Math.cos(a)]); }
  return out;
})();
function leaf(p, x, y, a, k, sx) {
  if (k < 0.03) return;
  p.at(x, y, a, [k * sx, k], function () {
    p.poly(MAPLE, { fill: 'orange' });
    p.path('M0 6 L0 -24 M0 -8 L-12 -16 M0 -8 L12 -16 M0 0 L-14 -6 M0 0 L14 -6', { w: 0.4, detail: true });
    p.line(0, 5, 0, 12, { w: 0.9 });
  });
}
D.add('leaf', {
  fam: 'nature', tags: ['autumn', 'fall', 'maple', 'tree', 'season', 'plant', '🍁', '🍂'], loop: 4.6, still: 0.62, tapLen: 1.4, tapRest: 0.2, burst: 'leaf', burstAt: [50, 40], burstN: 4, margin: [6, 14, 6, 14],
  about: 'a leaf unfolds on its twig, hangs and trembles, lets go, falls rocking, lands and shrinks away', tapAbout: 'a gust turns the hanging leaf over on its stem, twice',
  draw: function (p, t, s) {
    p.curve([[-6, 16], [16, 11], [38, 12], [58, 8]], { w: 1.2 });
    p.path('M58 8 C61 4 65 3 68 4 C66 8 62 10 58 8 Z', { fill: 'leaf', w: 0.7 });
    p.path('M18 14 C20 8 26 6 30 7 C28 12 23 14 18 14 Z M36 12 C37 18 42 21 46 20 C45 15 41 12 36 12 Z', { fill: 'leaf', w: 0.7 });
    p.path('M4 94 C30 92 70 92 96 94', { w: 0.7 });
    p.at(16, 90, -0.5, 0.4, function () { p.poly(MAPLE, { fill: 'orange' }); }); p.at(84, 91, 0.9, 0.34, function () { p.poly(MAPLE, { fill: 'gold' }); });
    var grow = sp(seg(t, 0, 0.2)) * (t < 0.4 ? 1 : 0), fall = seg(t, 0.4, 0.88), rock, tilt, x, y;
    if (s.tap >= 0) { var q = s.tap; leaf(p, 58, 34, Math.PI + 0.16 * Math.sin(q * 20) * (1 - q), 1, Math.cos(TAU * 2 * eo(q))); p.line(58, 8, 58, 22, { w: 0.9 }); return; }
    if (t < 0.4) {
      var tr = seg(t, 0.28, 0.4) * W(t, 9);
      leaf(p, 58 + 2 * tr, 34, Math.PI + 0.1 * W(t, 2) + 0.12 * tr, grow, 1);
      if (grow > 0.03) p.line(58, 8, 58, 22, { w: 0.9 });
    } else if (t < 0.88) {
      rock = Math.sin(1.5 * TAU * fall) * (0.4 + 0.6 * Math.min(1, fall * 5)); x = 58 + 22 * rock - 8 * fall; y = 34 + 38 * fall - 2 * Math.abs(Math.cos(1.5 * TAU * fall));
      tilt = -0.75 * Math.cos(1.5 * TAU * fall) * (0.4 + 0.6 * Math.min(1, fall * 5)); leaf(p, x, y, Math.PI + tilt, 1, 0.8 + 0.2 * Math.cos(1.5 * TAU * fall + 1));
    } else {
      var land = seg(t, 0.88, 0.96), gone = ei(seg(t, 0.93, 1));
      leaf(p, 50 + 2 * land, 72 + 4 * land, Math.PI + 1.4 * land, 1 - gone, 1 - 0.3 * land);
    }
  }
});

/* 🌱 a seed splits, a stem is drawn up out of it, the first leaves unfold, a second pair follows, the sprout sways; then it
   is drawn back down and the seed closes. Tap: a bud at the top opens into a flower. */
D.add('sprout', {
  fam: 'nature', tags: ['seed', 'plant', 'grow', 'garden', 'spring', 'green', 'seedling', 'nature', '🌱'], loop: 4, still: 0.7, tapLen: 1.6, burst: 'petal', burstAt: [50, 30], burstN: 5, margin: [8, 8, 4, 8],
  about: 'the seed splits, a stem is drawn up, leaves unfold in two pairs, it sways, then draws back down', tapAbout: 'a bud at the top opens into a flower',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, split = tap ? 1 : sp(seg(t, 0.06, 0.2)) * (1 - M.ease(seg(t, 0.93, 1))), up = tap ? 1 : eo(seg(t, 0.14, 0.5)), back = tap ? 0 : ei(seg(t, 0.84, 0.96));
    var l1 = tap ? 1 : sp(seg(t, 0.42, 0.62)) * (1 - ei(seg(t, 0.8, 0.88))), l2 = tap ? 1 : sp(seg(t, 0.55, 0.72)) * (1 - ei(seg(t, 0.78, 0.86)));
    var sway = tap ? 0.04 * W(t, 1) : 0.05 * W(t, 1) * seg(t, 0.62, 0.72) * (1 - seg(t, 0.88, 0.94)), A = [50, 77], B = [46, 64], C = [54, 52], E = [50, 30];
    var wob = !tap && t < 0.1 ? 0.12 * W(t, 5) * bump(seg(t, 0, 0.1)) : 0;
    [-1, 1].forEach(function (d) {
      p.pivot(50, 86, d * (0.95 * split + wob), 1, function () { p.path(d < 0 ? 'M50 65 C44 65 42 74 43.5 79 C45 84 48 86 50 86 Z' : 'M50 65 C56 65 58 74 56.5 79 C55 84 52 86 50 86 Z', { fill: 'wood' }); });
    });
    p.pivot(50, 77, sway, 1, function () {
      var d = 'M50 77 C46 64 54 52 50 30';
      p.span(d, back, up, { ink: 'green', w: 1.7, cap: 'round' });
      function pair(u, k, size) {
        if (k < 0.03 || u > up || u < back) return;
        var at = bz(A, B, C, E, u);
        [-1, 1].forEach(function (dd) { p.at(at[0], at[1], 0, [dd * size * k, size * k], function () { p.pivot(0, 0, -1.4 + 1.2 * k, 1, function () { p.path('M0 0 C6 -10 22 -13 33 -6 C27 5 11 7 0 0 Z', { fill: 'leaf' }); p.path('M3 -1 C12 -5 20 -7 28 -6', { w: 0.4, detail: true }); }); }); });
      }
      pair(0.52, l2, 0.7); pair(1, l1, 0.95);
      if (tap) {
        var o = sp(seg(s.tap, 0.12, 0.55)), bud = 1 - seg(s.tap, 0.1, 0.2), away = ei(seg(s.tap, 0.82, 1));
        if (bud > 0.02 && s.tap < 0.2) p.path('M50 29 C46 24 47 18 50 15 C53 18 54 24 50 29 Z', { fill: 'pink' });
        if (o > 0.02) p.at(50, 26, 0.2 * W(s.tap, 1.5), (1 - away) * 1, function () { for (var j = 0; j < 6; j++) p.at(0, 0, j / 6 * TAU, o, function () { p.path('M0 0 C-6 -5 -5 -14 0 -16 C5 -14 6 -5 0 0 Z', { fill: j % 2 ? 'pink' : 'b', w: 0.7 }); }); p.circle(0, 0, 4.4 * o, { fill: 'yellow', w: 0.7 }); });
      }
    });
    p.path('M2 98 C6 84 26 77 50 77 C74 77 94 84 98 98 Z', { fill: 'brown' });
    p.dot(24, 90, 1.5, 'wood'); p.dot(70, 87, 1.8, 'wood'); p.dot(82, 94, 1.3, 'wood'); p.dot(38, 93, 1.2, 'wood');
  }
});

/* 🍄 two fly agarics; the big one breathes and puffs spores out from under its cap, the little one answers a beat behind.
   Tap: the big one squashes flat and throws a cloud of spores, and the little one hops. */
function shroom(p, spots) {
  p.ellipse(0, -36, 36, 7.5, { fill: 'cream' });
  p.path('M-24 -33 L-22 -29 M-13 -32 L-12 -28 M0 -32 L0 -28.5 M13 -32 L12 -28 M24 -33 L22 -29', { w: 0.35, detail: true });
  p.path('M-11 -38 C-9 -24 -13 -10 -17 0 L17 0 C13 -10 9 -24 11 -38 Z', { fill: 'cream' });
  p.path('M-12 -27 C-6 -20 6 -20 12 -27 L10 -23 C5 -15 -5 -15 -10 -23 Z', { fill: 'white', w: 0.7 });
  p.path('M-40 -38 C-40 -62 -22 -82 0 -82 C22 -82 40 -62 40 -38 C28 -34 14 -33 0 -33 C-14 -33 -28 -34 -40 -38 Z', { fill: 'red' });
  spots.forEach(function (c) { p.ellipse(c[0], c[1], c[2], c[3], { fill: 'white', w: 0.6, rot: c[4] || 0 }); });
  p.path('M-31 -62 C-27 -72 -17 -78 -8 -79', { ink: 'white', w: 0.6, detail: true });
}
D.add('mushroom', {
  fam: 'nature', tags: ['fungus', 'toadstool', 'forest', 'spore', 'garden', 'fairy', 'mario', '🍄'], loop: 2.4, still: 0.3, tapLen: 1.5, tapRest: 0.35, burst: false, margin: [14, 18, 6, 18],
  about: 'the big one breathes and puffs spores from under its cap; the small one answers a beat behind', tapAbout: 'the big one squashes flat and throws a cloud of spores; the small one hops',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, sq = tap ? bump(seg(q, 0, 0.22)) * 1.7 + 0.5 * bump(seg(q, 0.22, 0.45)) * -1 : bump(seg(t, 0.04, 0.22)) * 0.9 + bump(seg(t, 0.54, 0.72)) * 0.9;
    var hop = tap ? -16 * bump(seg(q, 0.3, 0.62)) : 0, lead = tap ? 0 : 0.1 * bump(seg(t, 0.12, 0.34)) - 0.1 * bump(seg(t, 0.62, 0.84));
    p.path('M2 92 C30 90 70 91 98 92', { w: 0.7 });
    p.path('M10 92 C10 87 8 85 5 84 M10 92 C11 88 14 86 16 85 M88 92 C88 88 90 86 93 85 M88 92 C87 88 85 87 82 87', { ink: 'green', w: 0.8, cap: 'round' });
    p.at(20, 92 + hop, lead + 0.03 * W(t, 2, 0.3), [0.5, 0.5 - 0.02 * sq], function () { shroom(p, [[-18, -58, 8, 5, -0.4], [10, -68, 9, 6], [28, -50, 7, 5]]); });
    p.at(64, 92, 0.02 * W(t, 1), [0.92 + 0.045 * sq, 0.92 - 0.065 * sq], function () { shroom(p, [[-20, -60, 7, 5, -0.4], [6, -70, 8, 5.5], [26, -52, 6, 4.5], [-4, -46, 5, 3.6], [-30, -47, 3.6, 3]]); });
    var n = tap ? 14 : 8, i, side, u, r, x0, ux;
    for (i = 0; i < n; i++) {
      side = i % 2 ? 1 : -1; u = tap ? (q > 0.1 ? seg(q, 0.1 + 0.012 * i, 0.82) : 0) : win(t, 0.06 + (i % 4) * 0.03 + (i >= 4 ? 0.5 : 0), 0.44);
      if (u <= 0 || u >= 1) continue;
      x0 = 64 + side * 33; ux = (tap ? 22 : 12) + 7 * (i % 3);
      r = (tap ? 3.4 : 2.2 + 0.5 * (i % 3)) * eo(seg(u, 0, 0.2)) * (1 - ei(seg(u, 0.55, 1)));
      if (r > 0.3) p.circle(x0 + side * ux * eo(u) + 3 * Math.sin(TAU * 1.5 * u + i), 60 - (tap ? 46 : 26 + 5 * (i % 4)) * eo(u) - 0 * i, r, { fill: 'cream', w: 0.5 });
    }
  }
});

/* 🐌 a snail crawls: the head stretches out, the foot draws up behind it, the shell rides; grass slides past and a wet trail shines.
   The eye stalks sway one behind the other. Tap: it pulls its head and foot in, the shell settles, zzz; then the stalks come out. */
function tuft(p) { p.path('M0 0 C-1 -6 -4 -8 -6 -10 M0 0 C0 -7 1 -10 2 -13 M0 0 C2 -5 5 -7 8 -8', { ink: 'green', w: 0.8, cap: 'round' }); }
var FOOT = [[22, 85, 0], [30, 81, 0.02], [40, 77, 0.1], [54, 72, 0.25], [68, 66, 0.6], [78, 58, 0.9], [83, 50, 1], [89, 47, 1], [95, 51, 1], [97, 60, 1], [95, 72, 1], [92, 83, 1], [80, 86, 0.8], [60, 86.5, 0.4], [40, 86.5, 0.15], [26, 86, 0.03]];
D.add('snail', {
  fam: 'nature', tags: ['slow', 'garden', 'shell', 'crawl', 'slime', 'patience', 'mollusc', '🐌'], loop: 3, still: 0.2, tapLen: 1.9, burst: 'zzz', burstAt: [50, 36], burstN: 3, burstSpread: 1.1, margin: [10, 14, 6, 12],
  about: 'the head stretches, the foot draws up, the shell rides; grass slides by and a wet trail shines; the eye stalks sway', tapAbout: 'pulls head and foot into the shell, settles with a zzz, then the stalks come out one at a time',
  draw: function (p, t, s) {
    var half = t * 2, n = Math.floor(half), c = half - n, adv = M.ease(seg(c, 0.35, 0.85)), ext = 12 * (eo(seg(c, 0, 0.4)) - adv), scroll = 10 * n + 10 * adv, k, x, e;
    var hide = s.tap >= 0 ? eo(seg(s.tap, 0, 0.28)) * (1 - ei(seg(s.tap, 0.66, 0.9))) : 0, out = s.tap >= 0 ? [1 - ei(seg(s.tap, 0.66, 0.84)), 1 - ei(seg(s.tap, 0.72, 0.9))] : [1, 1];
    p.path('M0 86.5 L100 86.5', { w: 0.7 });
    p.line(0, 85, 22, 85, { ink: 'sky', w: 1.3, cap: 'round' });
    for (k = 0; k < 6; k++) {
      x = -14 + M.frac((20 * k - scroll + 14) / 120) * 120; e = Math.min(1, (x + 14) / 8, (104 - x) / 8);
      if (e > 0.05) p.at(x, 86, 0, e, tuft);
      var gx = x + 10, ge = Math.min(1, gx / 6, (18 - gx) / 6);
      if (ge > 0.1) p.star(gx, 82.5, 3.6 * ge, 1.1 * ge, 4, { fill: 'white', w: 0.4 });
    }
    var pts = FOOT.map(function (q) { var px = q[0] + ext * q[2], py = q[1]; return [lerp(px, 52, 0.9 * hide), py < 80 ? lerp(py, 80, 0.8 * hide) : py]; });
    p.curve(pts, { close: true, fill: 'sand' });
    [[84, 0, out[0], 0], [91, 0.3, out[1], 1]].forEach(function (st) {
      var bx = st[0] + ext, tx = bx + (st[3] ? 5 : -3) + 3 * W(t, 2, st[1]), ty = 26 + 3 * W(t, 2, st[1] + 0.25), l = st[2] * (1 - hide);
      var ex = lerp(bx, tx, l), ey = lerp(49, ty, l);
      if (l > 0.25) { p.curve([[bx, 50], [lerp(bx, tx, 0.4) + 1, lerp(49, ty, 0.55)], [ex, ey]], { w: 1.5, cap: 'round' }); eye(p, ex, ey, 3.8, 0, 'sand', 0.5, 0.3); }
    });
    p.curve([[93 + ext, 62], [97 + ext, 66], [95 + ext, 69]], { w: 0.7, cap: 'round', detail: true });
    var cy = 54 + 8 * hide, sx = 50;
    p.pivot(50, 86, 0.025 * W(t, 2) * (1 - hide), [1, 1 - 0.06 * hide], function () {
      p.ellipse(sx, cy, 24, 22, { fill: 'wood' });
      var sp2 = [], i; for (i = 0; i <= 26; i++) { var a = i / 26 * TAU * 2.2 + 0.4, r = 2 + 18 * i / 26; sp2.push([sx + 3 + r * Math.cos(a), cy + r * Math.sin(a)]); }
      p.curve(sp2, { w: 0.75 });
      p.path('M32 ' + (cy - 8) + ' C34 ' + (cy - 15) + ' 40 ' + (cy - 20) + ' 46 ' + (cy - 21), { ink: 'white', w: 0.6, detail: true });
      if (hide > 0.5) p.at(68, cy + 12, 0, hide, function () { p.path('M0 -10 C7 -6 7 6 0 10 C-3 6 -3 -6 0 -10 Z', { fill: 'night' }); });
    });
  }
});

/* 🦋 a butterfly seen from above; the wings beat slowly, hind pair a hair behind, and the body bobs against them while the
   whole thing drifts in a lazy figure of eight; the antennae lag. Tap: a flurry, the wings fold up, then spring open. */
function wings(p) {
  p.path('M53 50 C66 50 80 52 84 62 C88 74 74 84 64 78 C56 72 53 60 53 50 Z', { fill: 'yellow' });
  p.circle(71, 68, 5, { fill: 'sky', w: 0.6, detail: true }); p.dot(71, 68, 2.2);
  p.path('M54 52 C64 56 74 62 80 72', { w: 0.35, detail: true });
}
function wingsF(p) {
  p.path('M53 46 C54 30 66 14 82 10 C94 8 98 20 92 32 C86 42 70 50 56 50 Z', { fill: 'orange' });
  p.path('M56 46 C66 36 76 24 86 15 M56 48 C68 42 82 34 92 28', { w: 0.35, detail: true });
  p.circle(88, 17, 1.7, { fill: 'white', w: 0.4, detail: true }); p.circle(92, 25, 1.5, { fill: 'white', w: 0.4, detail: true }); p.circle(82, 12, 1.3, { fill: 'white', w: 0.4, detail: true });
}
D.add('butterfly', {
  fam: 'nature', tags: ['insect', 'garden', 'spring', 'wings', 'flutter', 'metamorphosis', 'moth', '🦋'], loop: 1.6, still: 0.02, tapLen: 1.7, tapRest: 0.85, burst: false, margin: [10, 14, 10, 14],
  about: 'slow wingbeats, the hind pair a hair behind; the body bobs against the wings as it drifts in a figure of eight', tapAbout: 'a quick flurry, the wings fold up together, then spring open with a sparkle',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, ph = TAU * (2 * t + (tap ? 3 * eo(seg(q, 0, 0.22)) : 0)), idle = function (a) { return 0.3 + 0.7 * (0.5 + 0.5 * Math.cos(ph - a)); };
    var k = tap ? (q < 0.5 ? 1 - M.ease(seg(q, 0.2, 0.34)) : sp(seg(q, 0.62, 0.92))) : 1, o1 = 0.24 + (idle(0) - 0.24) * k, o2 = 0.24 + (idle(0.5) - 0.24) * k;
    var b = 3.2 * Math.cos(ph + 0.7) * (0.3 + 0.7 * k), dx = 6 * W(t, 1), dy = 3 * W(t, 2, 0.1);
    p.at(50 + dx, 50 + dy, 0.07 * W(t, 1, 0.2), 1, function () {
      p.move(-50, -50);
      p.pivot(50, 50, 0, [o2, 1], function () { p.move(0, -b); wings(p); });
      p.pivot(50, 50, 0, [-o2 * 0.97, 1], function () { p.move(0, -b * 0.9); wings(p); });
      p.pivot(50, 48, 0, [o1, 1], function () { p.move(0, -b); wingsF(p); });
      p.pivot(50, 48, 0, [-o1 * 0.97, 1], function () { p.move(0, -b * 0.9); wingsF(p); });
      p.move(0, b * 0.8);
      tube(p, function (v) { return [50 + 0.8 * Math.sin(v * 3), 42 + 34 * v]; }, function (v) { return 6.4 - 3.4 * v + 2 * Math.sin(Math.PI * Math.min(1, v * 4)); }, 0, { fill: 'black' }, 1, 10);
      p.circle(50, 36, 5, { fill: 'black' });
      [-1, 1].forEach(function (d, i) {
        var lag = 3 * W(t, 2, 0.2 + i * 0.05);
        p.curve([[50 + d * 2, 32], [50 + d * 7, 22], [50 + d * (12 + lag), 14]], { w: 0.8, cap: 'round' }); p.dot(50 + d * (12.5 + lag), 13.5, 2.1);
      });
    });
    if (tap && q > 0.64 && q < 0.95) [[16, 18, 0], [86, 22, 0.06], [20, 72, 0.12], [84, 76, 0.18]].forEach(function (c) { twinkle(p, c[0], c[1], 7, seg(q, 0.64 + c[2], 0.9), 'yellow'); });
  }
});

/* 🐝 a bee in side view flies a figure of eight, turning its face as it swings, wings a blur, a dotted line behind it.
   Tap: it hovers and does the waggle dance, the abdomen wagging, and draws honeycomb cells that it then takes back. */
function bee(p, t, wag) {
  var a1 = 0.75 + 0.5 * W(t, 14), a2 = a1 - 0.3;
  p.at(8, -7, a2, 1, function () { p.ellipse(-10, 0, 11, 5, { fill: 'sky', alpha: 0.65, w: 0.6 }); });
  p.at(10, -8, a1, 1, function () { p.ellipse(-13, 0, 14, 6.4, { fill: 'sky', alpha: 0.75, w: 0.6 }); });
  p.path('M8 8 L5 15 M12 9 L12 16 M16 8 L19 15', { w: 0.5, detail: true });
  p.pivot(2, 2, wag, 1, function () {
    p.ellipse(-14, 2, 17, 12.5, { fill: 'yellow' });
    p.clip(function () { p.ellipse(-14, 2, 17, 12.5, {}); }, function () { p.rect(-25, -11, 6, 26, { fill: 'black', line: false }); p.rect(-14, -11, 6, 26, { fill: 'black', line: false }); });
    p.ellipse(-14, 2, 17, 12.5, { w: 1 }); p.poly([[-31, 0], [-37, 3], [-31, 5]], { fill: 'black', w: 0.6 });
  });
  p.circle(12, 0, 9.5, { fill: 'yellow' });
  p.circle(25, -1, 7.5, { fill: 'black' }); p.circle(28, -3, 2.7, { fill: 'white', w: 0.5 }); p.dot(28.8, -3, 1.2);
  p.curve([[27, -7], [31, -15], [38, -17]], { w: 0.8, cap: 'round' }); p.dot(38.5, -17.2, 1.7);
}
function hex(cx, cy, r) { var d = '', i; for (i = 0; i <= 6; i++) d += (i ? 'L' : 'M') + (cx + r * Math.cos(Math.PI / 6 + i * Math.PI / 3)).toFixed(2) + ' ' + (cy + r * Math.sin(Math.PI / 6 + i * Math.PI / 3)).toFixed(2); return d; }
D.add('bee', {
  fam: 'nature', tags: ['insect', 'honey', 'buzz', 'flower', 'pollen', 'hive', 'work', 'busy', '🐝'], loop: 2, still: 0.12, tapLen: 2, tapRest: 0.7, burst: false, margin: [12, 14, 12, 14],
  about: 'a figure-eight flight, turning to face its way, wings a blur, a dotted trail behind', tapAbout: 'hovers and waggle-dances, drawing honeycomb cells and taking them back',
  draw: function (p, t, s) {
    var fx = function (u) { return [50 + 27 * Math.sin(TAU * (u + 0.06)), 50 + 14 * Math.sin(2 * TAU * (u + 0.06))]; }, i, pts = [], P = fx(t), vx = Math.cos(TAU * (t + 0.06)), vy = Math.cos(2 * TAU * (t + 0.06)), sg = vx >= 0 ? 1 : -1;
    var tap = s.tap >= 0, q = tap ? s.tap : 0, stay = tap ? M.ease(seg(q, 0, 0.18)) * (1 - M.ease(seg(q, 0.82, 1))) : 0;
    var x = lerp(P[0], 46 + 16 * Math.sin(TAU * 1.5 * seg(q, 0.18, 0.82)), stay), y = lerp(P[1], 58, stay), sx = lerp(face(vx), 1, stay), tilt = lerp(clampA(Math.atan2(sg * vy, Math.abs(vx) + 0.2) * 0.6), 0, stay);
    for (i = 0; i <= 12; i++) pts.push(fx(t - 0.4 + 0.37 * i / 12));
    if (!tap) p.curve(pts, { dash: [1.2, 3.2], w: 0.5, cap: 'round', detail: true });
    if (tap) [[16, 20], [33.3, 20], [24.7, 35]].forEach(function (c, j) {
      var u = seg(q, 0.14 + 0.18 * j, 0.36 + 0.18 * j), back = ei(seg(q, 0.84 + 0.03 * j, 0.97));
      if (back < 1 && u > 0) { if (u >= 1) p.poly(HEX(c[0], c[1], 10 * (1 - back)), { fill: 'gold', w: 0.8 }); else p.draw(hex(c[0], c[1], 10), u, { w: 0.8 }); }
    });
    p.at(x, y + 0.6 * W(t, 14), tilt, [0.82 * sx, 0.82], function () { bee(p, t, stay * 0.32 * W(q, 9)); });
  }
});
function clampA(a) { return M.clamp(a, -0.5, 0.5); }
function HEX(cx, cy, r) { var out = [], i; for (i = 0; i < 6; i++) out.push([cx + r * Math.cos(Math.PI / 6 + i * Math.PI / 3), cy + r * Math.sin(Math.PI / 6 + i * Math.PI / 3)]); return out; }

/* ✨ a firefly in side view wanders a slow tangle, turning to face its way, wings buzzing, the lantern at its tail blinking
   twice a loop in a halo with rays. Tap: it flashes hard, a ring of light spreads, and three small ones answer in turn. */
function glowbug(p, t, g, buzz) {
  var gx = -21, gy = 3.5, j;
  if (g > 0.03) {
    p.circle(gx, gy, 8 + 24 * g, { fill: 'flame', alpha: 0.3, line: false }); p.circle(gx, gy, 5 + 13 * g, { fill: 'yellow', alpha: 0.8, line: false });
    if (g > 0.35) for (j = 0; j < 8; j++) { var a = j * TAU / 8 + 0.2, r0 = 14 + 17 * g, r1 = 19 + 24 * g; p.line(gx + Math.cos(a) * r0, gy + Math.sin(a) * r0, gx + Math.cos(a) * r1, gy + Math.sin(a) * r1, { ink: 'gold', w: 0.5, detail: true }); }
  }
  p.at(5, -6, 0.8 + 0.55 * W(buzz, 1, 0.25), 1, function () { p.ellipse(-12, 0, 12, 4, { fill: 'white', alpha: 0.7, w: 0.6 }); });
  p.at(3, -6, 0.8 + 0.55 * W(buzz, 1), 1, function () { p.ellipse(-13, 0, 14, 4.6, { fill: 'white', alpha: 0.8, w: 0.6 }); });
  p.path('M5 7 L2 14 M10 8 L10 15 M15 7 L18 13', { w: 0.5, detail: true });
  p.ellipse(-6, 1, 17, 7.6, { fill: 'brown' });
  p.path('M-18 1 C-8 -1 0 -1 9 0', { ink: 'sand', w: 0.4, detail: true });
  p.ellipse(gx, gy, 6.6, 5.6, { fill: g > 0.12 ? 'yellow' : 'cream' });
  p.ellipse(11, -1, 7, 6.6, { fill: 'orange' }); p.ellipse(11, -1.6, 3.2, 2.4, { fill: 'black', line: false });
  p.circle(19.5, 0.5, 4.5, { fill: 'black' }); p.circle(21.5, -0.5, 1.4, { fill: 'white', line: false });
  p.curve([[21, -3], [25, -9], [30, -10]], { w: 0.7, cap: 'round' }); p.curve([[22, -2], [28, -6], [33, -5]], { w: 0.7, cap: 'round' });
}
D.add('firefly', {
  fam: 'nature', tags: ['night', 'summer', 'light', 'glow', 'insect', 'lightning bug', 'blink', 'wish', '✨'], loop: 3, still: 0.18, tapLen: 2, burst: false, margin: [12, 14, 12, 14],
  about: 'wanders a slow tangle facing its way, wings buzzing; its lantern blinks twice a loop with a halo and rays', tapAbout: 'flashes hard, a ring of light spreads and three small ones answer in turn',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, g = Math.max(blink(t, 0.08, 0.2), blink(t, 0.5, 0.3)) * (tap ? 0.5 : 1);
    var x = 50 + 17 * Math.sin(TAU * t + 0.4) + 7 * Math.sin(TAU * 3 * t), y = 46 + 12 * Math.sin(TAU * 2 * t + 1);
    var vx = (17 * Math.cos(TAU * t + 0.4) + 21 * Math.cos(TAU * 3 * t)) / 30, vy = 0.8 * Math.cos(TAU * 2 * t + 1), sg = vx >= 0 ? 1 : -1, sx = face(vx * 0.8);
    if (tap) g = Math.max(g, 1.15 * bump(seg(q, 0.02, 0.4)));
    if (tap) {
      var gxw = x - 23 * sx, gyw = y + 4;
      [0.04, 0.2].forEach(function (a) { var u = seg(q, a, a + 0.5); if (u > 0 && u < 1) p.span(ring(gxw, gyw, 8 + 38 * eo(u), 8 + 38 * eo(u)), ei(seg(u, 0.5, 1)), 1, { ink: 'gold', w: 0.7 }); });
      [[18, 24, 0.34], [84, 30, 0.5], [74, 82, 0.66]].forEach(function (c) {
        var u = seg(q, c[2], c[2] + 0.2); p.at(c[0], c[1], 0, [0.4, 0.4], function () { glowbug(p, t, bump(u) * 1.1 * (u > 0 && u < 1 ? 1 : 0), t * 3); });
      });
    }
    p.at(x, y, clampA(Math.atan2(sg * vy, Math.abs(vx) + 0.3) * 0.5), [1.08 * sx, 1.08], function () { glowbug(p, t, g, t * 16); });
  }
});

/* 🪼 a jellyfish pulses — the bell squeezes narrow and tall, then relaxes wide while it glides up — and sinks as the bell
   opens; the arms and tentacles stream behind with a lag. Tap: two quick pumps carry it up, rings of light spread, bubbles. */
D.add('jellyfish', {
  fam: 'nature', tags: ['sea', 'ocean', 'sting', 'glow', 'drift', 'float', 'marine', 'bioluminescent', '🪼'], loop: 2.6, still: 0.3, tapLen: 1.8, tapRest: 0.3, burst: 'bubble', burstAt: [50, 30], burstN: 6, burstSpread: 2, margin: [12, 14, 8, 14],
  about: 'the bell squeezes and relaxes, gliding up then sinking; the arms and tentacles stream behind', tapAbout: 'two quick pumps carry it up, rings of light spread and bubbles rise',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, kk, lift, i;
    if (tap) { kk = Math.max(M.ease(seg(q, 0, 0.1)) * (1 - M.ease(seg(q, 0.1, 0.3))), M.ease(seg(q, 0.3, 0.4)) * (1 - M.ease(seg(q, 0.4, 0.78)))); lift = -22 * eo(seg(q, 0, 0.5)) + 22 * M.ease(seg(q, 0.5, 1)); }
    else { kk = M.ease(seg(t, 0, 0.16)) * (1 - M.ease(seg(t, 0.16, 0.62))); lift = -9 * eo(seg(t, 0, 0.4)) + 9 * M.ease(seg(t, 0.4, 1)); }
    var cx = 50 + 2 * W(t, 1), hw = lerp(30, 21, kk), H = lerp(27, 35, kk), top = 22 + lift, ry = top + H, T = function (a, b) { return a.toFixed(1) + ' ' + b.toFixed(1); };
    if (tap) [0.05, 0.22].forEach(function (a) { var u = seg(q, a, a + 0.5); if (u > 0 && u < 1) p.span(ring(cx, ry - 10, 14 + 36 * eo(u), 10 + 28 * eo(u)), ei(seg(u, 0.5, 1)), 1, { ink: 'sky', w: 0.7 }); });
    for (i = 0; i < 5; i++) {
      var x0 = cx - hw * 0.8 + i * hw * 1.6 / 4, pts = [], v;
      for (v = 0; v <= 8; v++) { var u2 = v / 8; pts.push([x0 + (i - 2) * 2 * u2 + 5.5 * u2 * Math.sin(TAU * (t - 0.9 * u2 + i * 0.17)), ry + 1 + (38 - 9 * kk) * u2]); }
      p.curve(pts, { w: 0.55 });
    }
    for (i = 0; i < 3; i++) {
      var ox = cx + (i - 1) * 7;
      tube(p, function (u2) { return [ox + 5 * u2 * Math.sin(TAU * (t - 0.7 * u2 + i * 0.2)), ry + 2 + (26 - 6 * kk) * u2]; }, 6.5, 1.2, { fill: 'pink' }, 1, 10);
    }
    var d = 'M' + T(cx - hw, ry) + ' C' + T(cx - hw, ry - H * 0.78) + ' ' + T(cx - hw * 0.5, top) + ' ' + T(cx, top) + ' C' + T(cx + hw * 0.5, top) + ' ' + T(cx + hw, ry - H * 0.78) + ' ' + T(cx + hw, ry);
    for (i = 0; i < 5; i++) { var xa = cx + hw - i * hw * 0.4; d += ' Q' + T(xa - hw * 0.2, ry + 7) + ' ' + T(xa - hw * 0.4, ry); }
    p.path(d + ' Z', { fill: 'lilac' });
    p.path('M' + T(cx, top + 4) + ' C' + T(cx - hw * 0.25, top + H * 0.4) + ' ' + T(cx - hw * 0.45, ry - 8) + ' ' + T(cx - hw * 0.5, ry - 1) + ' M' + T(cx, top + 4) + ' C' + T(cx + hw * 0.25, top + H * 0.4) + ' ' + T(cx + hw * 0.45, ry - 8) + ' ' + T(cx + hw * 0.5, ry - 1), { w: 0.4, detail: true });
    p.path('M' + T(cx - hw * 0.78, ry - H * 0.45) + ' C' + T(cx - hw * 0.72, ry - H * 0.75) + ' ' + T(cx - hw * 0.5, top + 4) + ' ' + T(cx - hw * 0.28, top + 3), { ink: 'white', w: 0.7, detail: true });
    [[-5, 0.55], [5, 0.55], [-3, 0.7], [3, 0.7]].forEach(function (c) { p.circle(cx + c[0], top + H * c[1], 2.6, { fill: 'pink', w: 0.5, detail: true }); });
  }
});

/* 🐠 two koi chase each other round a lily pad, each bent along the circle it swims, the tail beating down the body, the fins
   paddling. Tap: they race one more lap, and ripples spread from the pad. */
function koi(p, th, wph, ph, body, patch, tail) {
  var R = 27, span = 1.95, f = function (v) { var a = th - v * span, wig = (1 + 5.5 * v * v) * Math.sin(TAU * (wph - v * 1.1) + ph); return [50 + (R + wig) * Math.cos(a), 50 + (R + wig) * Math.sin(a)]; };
  var wd = function (v) { return 2.5 + 11.5 * Math.sin(Math.PI * Math.pow(v, 0.62)) * (1 - 0.5 * v); };
  var E = f(1), F = f(0.93), dx = E[0] - F[0], dy = E[1] - F[1], dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl, nx = -uy, ny = ux, wag = 5 * Math.sin(TAU * (wph - 1.35) + ph);
  var tp = function (a, b) { return [E[0] + ux * a + nx * b, E[1] + uy * a + ny * b]; };
  p.curve([tp(0, 2), tp(8, 7), tp(19, 12 + wag), tp(13, wag * 0.5), tp(19, -12 + wag), tp(8, -7), tp(0, -2)], { close: true, fill: tail, alpha: 0.95 });
  [-1, 1].forEach(function (sd) {
    var P = f(0.22), A = f(0.2), B = f(0.24), bx = B[0] - A[0], by = B[1] - A[1], bl = Math.hypot(bx, by) || 1, ax = bx / bl, ay = by / bl, mx = -ay * sd, my = ax * sd, fl = 0.8 + 0.3 * Math.sin(TAU * (wph * 0.5 + sd * 0.2));
    var bx0 = P[0] + mx * wd(0.22) / 2, by0 = P[1] + my * wd(0.22) / 2;
    p.poly([[bx0 - ax * 2, by0 - ay * 2], [bx0 + mx * 11 * fl + ax * 9, by0 + my * 11 * fl + ay * 9], [bx0 + ax * 7, by0 + ay * 7]], { fill: tail, w: 0.6 });
  });
  tube(p, f, wd, 0, { fill: body }, 1, 18);
  patch.forEach(function (r) { tube(p, f, function (v) { return wd(v) * 0.78; }, 0, { fill: r[2], line: false }, r[1], 8, r[0]); });
  var H = f(0.1), H2 = f(0.14), hx = H2[0] - H[0], hy = H2[1] - H[1], hl = Math.hypot(hx, hy) || 1;
  [-1, 1].forEach(function (sd) { p.dot(H[0] + (-hy / hl) * sd * 4.6, H[1] + (hx / hl) * sd * 4.6, 1.8); });
}
D.add('koi', {
  fam: 'nature', tags: ['fish', 'pond', 'japan', 'water', 'circle', 'yin yang', 'carp', 'lucky', '🐟', '🎏'], loop: 3.6, still: 0.1, tapLen: 1.8, burst: 'ring', burstAt: [50, 50], burstN: 3, burstSpread: 6, margin: [10, 10, 10, 10],
  about: 'two koi chase round a lily pad, bent along the circle, tails beating down their bodies, fins paddling', tapAbout: 'they race one more lap and ripples spread from the pad',
  draw: function (p, t, s) {
    var extra = s.tap >= 0 ? M.ease(seg(s.tap, 0.05, 0.9)) : 0, th = TAU * (t + extra), wph = 6 * t + 8 * extra;
    p.arc(50, 50, 9.5, 0.4, TAU - 0.4, { pie: true, fill: 'leaf', rot: 0.5 * W(t, 1) });
    p.circle(50, 49, 3.4, { fill: 'pink', w: 0.6 });
    koi(p, th, wph, 0, 'white', [[0.14, 0.4, 'red'], [0.52, 0.7, 'red']], 'white');
    koi(p, th + Math.PI, wph, 1.7, 'flame', [[0.2, 0.42, 'white']], 'flame');
    if (s.tap >= 0) [0.05, 0.2].forEach(function (a) { var u = seg(s.tap, a, a + 0.55); if (u > 0 && u < 1) p.span(ring(50, 50, 12 + 34 * eo(u), 12 + 34 * eo(u)), ei(seg(u, 0.5, 1)), 1, { ink: 'sky', w: 0.6, detail: true }); });
  }
});

/* 🐙 an octopus: eight arms wave one after another across the row, tips curling, the mantle breathes and the heavy-lidded
   eyes blink. Tap: it jets up with its arms gathered, leaving a cloud of ink that is drawn back as it settles. */
D.add('octopus', {
  fam: 'nature', tags: ['sea', 'ocean', 'tentacles', 'ink', 'smart', 'eight', 'marine', 'cephalopod', '🐙'], loop: 3, still: 0.1, tapLen: 1.9, tapRest: 0.3, burst: false, margin: [14, 10, 4, 10],
  about: 'eight arms wave one after another, tips curling; the mantle breathes and the heavy-lidded eyes blink', tapAbout: 'jets up with the arms gathered, leaving an ink cloud that is drawn back as it settles',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, jet = tap ? bump(seg(q, 0.04, 0.6)) : 0, gath = tap ? bump(seg(q, 0, 0.5)) : 0, dy = 2 * W(t, 1) - 22 * jet, out = 1 - 0.8 * gath, amp = 7 * (1 - 0.85 * gath), i, ik = tap ? eo(seg(q, 0.02, 0.3)) * (1 - ei(seg(q, 0.62, 1))) : 0;
    if (ik > 0.03) p.at(50, 72, 0, ik, function () { p.move(-50, -72); p.poly(puff([[38, 70, 13], [56, 64, 14], [50, 80, 12], [30, 80, 9], [68, 78, 9]]), { fill: 'night', w: 0.6 }); });
    p.move(0, dy);
    var order = [0, 7, 1, 6, 2, 5, 3, 4];
    order.forEach(function (a) {
      var o = (a - 3.5) / 3.5, bx = 50 + (a - 3.5) * 5.4, f = function (v) {
        var c = Math.max(0, (v - 0.6) / 0.4);
        return [bx + o * out * (24 * v + 14 * v * v) + amp * v * Math.sin(TAU * (t - 0.8 * v + a * 0.11)) - Math.sign(o || 1) * 9 * c * c * out, 54 + 33 * v + 4 * v * v - 7 * c * c];
      };
      tube(p, f, 8, 1.4, { fill: 'b' }, 1, 12);
      [0.3, 0.5, 0.68].forEach(function (v) { var q2 = f(v); p.circle(q2[0], q2[1] + 0.6, 1.4 - 0.4 * v, { fill: 'pink', line: false, detail: true }); });
    });
    p.pivot(50, 60, 0, [1 + 0.02 * W(t, 2), 1 - 0.025 * W(t, 2) - 0.06 * jet], function () {
      p.path('M22 56 C18 28 32 8 50 8 C68 8 82 28 78 56 C70 62 30 62 22 56 Z', { fill: 'b' });
      [[36, 22, 3.2], [58, 18, 2.4], [66, 32, 2.8], [30, 38, 2]].forEach(function (c) { p.circle(c[0], c[1], c[2], { fill: 'pink', line: false }); });
      var lid = 0.38 + 0.62 * blink(t, 0.3, 0.05), lx = 0.4 * W(t, 1, 0.1);
      eye(p, 38.5, 45, 7, lid, 'b', lx, 0.3); eye(p, 61.5, 45, 7, lid, 'b', lx, 0.3);
      p.path('M45 57 Q50 61 55 57', { w: 0.7 });
      p.ellipse(31, 54, 3.4, 2, { fill: 'rose', line: false, alpha: 0.6 }); p.ellipse(69, 54, 3.4, 2, { fill: 'rose', line: false, alpha: 0.6 });
    });
  }
});

/* 🦉 an owl on a branch; the head turns on its shoulders — the face slides round the skull, narrowing as it goes — to look
   right, then left, blinking between. Tap: the head swivels all the way round and back to the front, the feathers puff, it hoots. */
function proj(u, a, R) { var b = Math.asin(M.clamp(u / R, -1, 1)); return [50 + R * Math.sin(b + a), Math.cos(b + a)]; }
D.add('owl', {
  fam: 'nature', tags: ['bird', 'night', 'wise', 'hoot', 'forest', 'study', 'knowledge', 'watch', '🦉'], loop: 4.5, still: 0.2, tapLen: 2.1, tapRest: 0.9, burst: false, margin: [8, 14, 4, 14],
  about: 'looks right, then left, the face sliding round the skull; blinks in between', tapAbout: 'the head swivels all the way round, the feathers puff, and it hoots',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, a, lid, pf = 0;
    if (tap) { a = TAU * sp(seg(q, 0.05, 0.8)); pf = bump(seg(q, 0.02, 0.9)); lid = 0; }
    else { a = 0.95 * sp(seg(t, 0.15, 0.3)) * (1 - M.ease(seg(t, 0.45, 0.55))) - 0.95 * M.ease(seg(t, 0.62, 0.7)) * (1 - M.ease(seg(t, 0.82, 0.92))); lid = Math.max(blink(t, 0.05, 0.05), blink(t, 0.54, 0.05), blink(t, 0.88, 0.05)); }
    tube(p, function (v) { return [2 + 96 * v, 91 - 2 * v]; }, 7, 6, { fill: 'brown' }, 1, 8);
    p.pivot(50, 90, 0, [1 + 0.05 * pf + 0.012 * W(t, 2), 1 + 0.03 * pf], function () {
      p.path('M26 52 C22 68 28 88 50 88 C72 88 78 68 74 52 C70 44 30 44 26 52 Z', { fill: 'wood' });
      p.ellipse(50, 70, 14.5, 16, { fill: 'sand', w: 0.7 });
      p.path('M42 62 L46 66 L50 62 L54 66 L58 62 M44 72 L48 76 L52 72 L56 76 M46 82 L50 85 L54 82', { w: 0.4, detail: true });
      p.path('M27 52 C20 64 22 80 34 85 C32 72 33 62 35 54 Z', { fill: 'brown' }); p.path('M73 52 C80 64 78 80 66 85 C68 72 67 62 65 54 Z', { fill: 'brown' });
    });
    p.path('M38 87 C37 91 36 93 35 94 M42 88 L42 94 M46 87 C47 91 47 93 48 94 M54 87 C53 91 53 93 52 94 M58 88 L58 94 M62 87 C63 91 64 93 65 94', { ink: 'orange', w: 1.2, cap: 'round' });
    p.pivot(50, 58, -0.1 * Math.sin(a) * (tap ? 0.5 : 1), 1, function () {
      p.path('M22 38 C20 20 34 10 50 10 C66 10 80 20 78 38 C78 50 66 58 50 58 C34 58 22 50 22 38 Z', { fill: 'wood' });
      var face = Math.cos(a) > -0.2;
      [-1, 1].forEach(function (d) {
        var tf = proj(d * 20, a, 24); if (tf[1] > 0.12) p.at(tf[0], 14, 0, [tf[1], 1], function () { p.poly([[-7, 4], [0.5 * d, -9], [7, 4]], { fill: 'brown' }); });
      });
      [-1, 1].forEach(function (d) {
        var f = proj(d * 10.5, a, 24), k = f[1]; if (k < 0.1) return;
        p.at(f[0], 37, 0, [k, 1], function () {
          p.ellipse(0, 0, 13, 14.5, { fill: 'sand', w: 0.8 });
          p.circle(0, -1, 8.4, { fill: 'yellow', w: 0.8 }); p.dot(0.5, -1, 4.4); p.dot(-1.6, -3, 1.4, 'white');
          if (lid > 0.04) lidOf(p, 0, -1, 8.4, Math.min(1, lid), 'wood');
        });
      });
      var bk = proj(0, a, 24); if (bk[1] > 0.1) p.at(bk[0], 41, 0, [bk[1], 1], function () { p.poly([[-3.4, -4], [3.4, -4], [0, 7]], { fill: 'orange', w: 0.8 }); });
      [1.4, 1.95, 2.5, 3.05, -1.4, -1.95, -2.5, -3.05].forEach(function (L, n) {
        var x = 50 + 24 * Math.sin(L + a), k = Math.cos(L + a); if (k < 0.2) return;
        [[26, 0], [40, 0.5], [50, 0.2]].forEach(function (r) { p.at(x, r[0] + r[1] * 3 * (n % 2), 0, [k, 1], function () { p.path('M-4 -2 L0 3 L4 -2', { w: 0.5, detail: true }); }); });
      });
    });
    if (tap) [[0.8, 0], [0.86, 1]].forEach(function (c) { var u = seg(q, c[0], c[0] + 0.14), r = 8 + 7 * c[1]; if (u > 0) { p.draw('M' + (84 + r) + ' ' + (30 - r * 0.5) + ' C' + (90 + r) + ' ' + (36) + ' ' + (90 + r) + ' ' + (44) + ' ' + (84 + r) + ' ' + (50 + r * 0.5), u, { w: 0.7 }); p.draw('M' + (16 - r) + ' ' + (30 - r * 0.5) + ' C' + (10 - r) + ' ' + 36 + ' ' + (10 - r) + ' ' + 44 + ' ' + (16 - r) + ' ' + (50 + r * 0.5), u, { w: 0.7 }); } });
  }
});

/* 🐸 a frog on a lily pad: the throat sac swells and sinks with each croak, sound arcs leave the mouth, the eye blinks.
   Tap: it crouches, springs with the hind leg stretched out behind, folds in the air, lands squashed and the pad rings. */
function chain(p, P, w, o) {
  for (var i = 0; i < 3; i++) (function (a, b, w0, w1) { tube(p, function (v) { return [lerp(a[0], b[0], v), lerp(a[1], b[1], v)]; }, w0, w1, o, 1, 6); })(P[i], P[i + 1], w[i], w[i + 1]);
}
D.add('frog', {
  fam: 'nature', tags: ['pond', 'croak', 'amphibian', 'hop', 'jump', 'green', 'lily pad', 'spring', '🐸'], loop: 2.4, still: 0.14, tapLen: 1.5, tapRest: 0.4, burst: false, margin: [30, 18, 4, 22],
  about: 'the throat sac swells with each croak and sound arcs leave the mouth; the eye blinks, the body breathes', tapAbout: 'crouches, springs with the hind leg stretched out, folds in the air, lands squashed; the pad rings',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, cr = tap ? 0 : Math.max(blink(t, 0.04, 0.2), blink(t, 0.32, 0.2)), lid = Math.max(blink(t, 0.62, 0.06), blink(t, 0.93, 0.05)), u = tap ? seg(q, 0.15, 0.7) : -1;
    var crouch = tap ? bump(seg(q, 0, 0.17)) * 0.9 + bump(seg(q, 0.7, 0.88)) * 1.1 : 0, ex = tap ? eo(seg(q, 0.1, 0.2)) * (1 - M.ease(seg(q, 0.45, 0.66))) : 0, air = u > 0 && u < 1 ? -36 * 4 * u * (1 - u) : 0, tilt = u > 0 && u < 1 ? -0.3 + 0.6 * u : 0;
    var HA = [[24, 70], [46, 63], [24, 84], [60, 87]], HB = [[28, 70], [12, 80], [-2, 88], [-18, 92]], hl = HA.map(function (c, i) { return [lerp(c[0], HB[i][0], ex), lerp(c[1], HB[i][1], ex)]; });
    p.ellipse(50, 90, 46, 6.5, { fill: 'leaf' }); p.path('M50 90 L94 87', { w: 0.5, detail: true });
    if (tap) [0.7, 0.8].forEach(function (a, i) { var r = seg(q, a, a + 0.3); if (r > 0 && r < 1) p.span(ring(50, 90, 30 + 22 * eo(r) + 10 * i, 5 + 4 * eo(r)), ei(seg(r, 0.5, 1)), 1, { ink: 'sky', w: 0.6 }); });
    p.pivot(50, 86, tilt, [1 + 0.07 * crouch, 1 - 0.13 * crouch + 0.012 * W(t, 2)], function () {
      p.move(0, air + 5 * crouch);
      var fa = [[68, 62], [71, 86]], fb = [[70, 62], [90, 70]], fh = [lerp(fa[1][0], fb[1][0], ex), lerp(fa[1][1], fb[1][1], ex)];
      p.path('M12 76 C6 58 22 38 44 36 C56 35 66 38 72 44 C82 44 94 52 94 62 C94 68 88 72 80 72 C76 80 60 82 46 82 L22 82 C14 82 12 80 12 76 Z', { fill: 'leaf' });
      p.path('M30 80 C44 83 62 80 76 73', { ink: 'mint', w: 1.2, detail: true });
      [[40, 50, 3], [54, 46, 2.4], [28, 62, 2.6], [48, 60, 2]].forEach(function (c) { p.circle(c[0], c[1], c[2], { fill: 'green', line: false }); });
      chain(p, hl, [19, 11, 8, 4], { fill: 'leaf' });
      p.path('M' + (hl[3][0] - 8) + ' ' + (hl[3][1] + 1) + ' L' + (hl[3][0] + 2) + ' ' + (hl[3][1] - 1), { w: 0.4, detail: true });
      tube(p, function (v) { return [lerp(68, 69 + 0.5 * ex, v) * (1 - ex) + lerp(70, fh[0], v) * ex, lerp(62, fh[1], v)]; }, 9, 6, { fill: 'leaf' }, 1, 6);
      p.ellipse(fh[0] + 4, fh[1] + 1.5, 6.5, 2.6, { fill: 'leaf', w: 0.8 });
      p.circle(63, 34, 7, { fill: 'leaf' }); p.circle(63, 34.5, 4.6, { fill: 'gold', w: 0.6 }); p.ellipse(63.6, 34.5, 3, 1.4, { fill: 'black', line: false });
      p.circle(75, 41, 9.5, { fill: 'leaf' }); p.circle(76, 40, 6.3, { fill: 'gold', w: 0.7 }); p.ellipse(77, 40, 4.2, 2, { fill: 'black', line: false }); p.dot(74.5, 37.6, 1.3, 'white');
      if (lid > 0.04) lidOf(p, 76, 40, 6.3, Math.min(1, lid), 'leaf');
      p.path('M94 63 C86 67 78 67 70 62', { w: 0.9 }); p.dot(91, 55, 1.1);
      var rs = 2 + 13 * cr; if (cr > 0.02) p.ellipse(83, 72 + rs * 0.35, rs * 1.15, rs * 0.95, { fill: 'pink' });
    });
    if (cr > 0.25) [0, 1].forEach(function (i) { p.draw('M' + (99 + i * 7) + ' ' + (54 - i * 3) + ' C' + (105 + i * 7) + ' ' + (60 - i * 3) + ' ' + (105 + i * 7) + ' ' + (68 + i * 3) + ' ' + (99 + i * 7) + ' ' + (74 + i * 3), M.clamp((cr - 0.25 - i * 0.2) * 2.5, 0, 1), { w: 0.7 }); });
  }
});

/* 🐈 a ginger cat sits and watches: the tail swishes with the wave running down it from the root, the eyes blink with
   slit pupils, an ear flicks, the whiskers twitch. Tap: eyes shut in contentment, the body hums, purr lines spread. */
function catEye(p, x, y, lid, happy) {
  if (happy > 0.5) { p.path('M' + (x - 5.5) + ' ' + (y + 1.5) + ' Q' + x + ' ' + (y - 6) + ' ' + (x + 5.5) + ' ' + (y + 1.5), { w: 0.9, cap: 'round' }); return; }
  p.circle(x, y, 5.6, { fill: 'leaf', w: 0.8 }); p.ellipse(x, y, 1.3, 4.8, { fill: 'black', line: false }); p.dot(x - 2, y - 2, 1.1, 'white');
  if (lid > 0.04) lidOf(p, x, y, 5.6, lid, 'flame');
}
D.add('cat', {
  fam: 'nature', tags: ['pet', 'kitten', 'purr', 'whiskers', 'tail', 'home', 'meow', 'feline', '🐈', '🐱'], loop: 2.4, still: 0.2, tapLen: 1.8, burst: false, margin: [8, 14, 4, 12],
  about: 'sits and watches; the tail swishes with a wave from the root, the eyes blink, an ear flicks, the whiskers twitch', tapAbout: 'eyes shut in contentment, the body hums, purr lines spread out',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, happy = tap ? eo(seg(q, 0.04, 0.16)) * (1 - ei(seg(q, 0.86, 1))) : 0, lid = blink(t, 0.34, 0.06), hum = tap ? 0.7 * Math.sin(TAU * 14 * q) * bump(seg(q, 0.05, 0.95)) : 0, i;
    p.at(hum, 0, 0, 1, function () {
      var raise = tap ? 0.7 * happy : 0, sw = tap ? 0.5 : 1, f = function (v) {
        var b = bz([70, 90], [92, 97], [98 - 8 * raise, 70 - 24 * raise], [86 - 2 * raise, 50 - 10 * raise], v);
        return [b[0] + 9 * v * v * sw * Math.sin(TAU * (t - 0.3 * v)), b[1]];
      };
      tube(p, f, 9, 6, { fill: 'flame' }, 1, 14);
      [0.3, 0.5, 0.7, 0.88].forEach(function (v) { var a = f(v - 0.02), b = f(v + 0.02), dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, c = f(v); p.line(c[0] - dy / d * 4, c[1] + dx / d * 4, c[0] + dy / d * 4, c[1] - dx / d * 4, { w: 0.5, detail: true }); });
      p.path('M28 62 C22 78 26 94 50 94 C74 94 78 78 72 62 C66 54 34 54 28 62 Z', { fill: 'flame' });
      p.ellipse(50, 74, 8, 14, { fill: 'cream', line: false });
      p.path('M29 70 L35 72 M28 78 L34 79 M71 70 L65 72 M72 78 L66 79', { w: 0.45, detail: true });
      [1, -1].forEach(function (d) { p.pivot(50, 0, 0, [d, 1], function () { p.path('M36 70 C35 80 35 88 36 93 C37 97 48 97 49 93 C49 88 48 80 47 70 Z', { fill: 'flame' }); p.ellipse(42.5, 94, 7, 3.2, { fill: 'cream' }); p.path('M40 95 L40 97 M43 95 L43 97', { w: 0.35, detail: true }); }); });
    });
    p.pivot(50, 54, 0.04 * W(t, 1, 0.2) + (tap ? 0.1 * happy * Math.sin(TAU * 2 * q) : 0), 1, function () {
      p.at(hum, 0, 0, 1, function () {
        var flick = 0.3 * bump(seg(t, 0.62, 0.7));
        p.poly([[26, 26], [23, 2], [44, 15]], { fill: 'flame' }); p.poly([[29, 21], [28, 10], [37, 16]], { fill: 'pink', w: 0.5 });
        p.pivot(66, 20, tap ? 0 : flick, 1, function () { p.poly([[74, 26], [77, 2], [56, 15]], { fill: 'flame' }); p.poly([[71, 21], [72, 10], [63, 16]], { fill: 'pink', w: 0.5 }); });
        p.path('M24 34 C22 18 34 12 50 12 C66 12 78 18 76 34 C76 48 64 54 50 54 C36 54 24 48 24 34 Z', { fill: 'flame' });
        p.path('M50 14 L50 22 M44 15 L45 21 M56 15 L55 21', { w: 0.5, detail: true });
        p.ellipse(50, 46, 10, 6.5, { fill: 'cream', line: false });
        catEye(p, 38.5, 33, lid, happy); catEye(p, 61.5, 33, lid, happy);
        p.path('M46.5 40.5 L53.5 40.5 L50 44.5 Z', { fill: 'pink', w: 0.6 });
        p.path('M50 44.5 L50 47 M50 47 C47 50 43 49.5 42 47 M50 47 C53 50 57 49.5 58 47', { w: 0.6 });
        for (i = 0; i < 3; i++) { var tw = 1.2 * W(t, 3, i * 0.2) * (tap ? 0 : 1); [-1, 1].forEach(function (d) { p.line(50 + d * 12, 45 + i * 2.4, 50 + d * (32 - i * 1.5), 41 + i * 5.5 + tw, { w: 0.4, detail: true }); }); }
      });
    });
    if (tap) for (i = 0; i < 4; i++) {
      var ph = M.frac(q * 2 + i * 0.25), side = i % 2 ? 1 : -1, u = seg(ph, 0, 0.8);
      if (q > 0.12 && q < 0.88) p.span('M' + (50 + side * 30) + ' 50 C' + (50 + side * 37) + ' 54 ' + (50 + side * 37) + ' 62 ' + (50 + side * 30) + ' 66', ei(seg(u, 0.4, 1)), eo(seg(u, 0, 0.7)), { w: 0.7 });
    }
  }
});

/* 🐦 a swallow in flight: the near wing flaps on a jointed chain — the tip trails the arm, bending at the wrist — the body
   rides up and down against the wingbeat, the forked tail streams, wind streaks slide past. Tap: it dives, wings swept back,
   snaps a fly at the bottom of the swoop, and climbs away in hard strokes. */
function wing(p, S, ph, amp, sc, fill) {
  var th1 = amp * Math.sin(ph), th2 = amp * 1.25 * Math.sin(ph - 0.9), L1 = 22 * sc, L2 = 30 * sc;
  var E = [S[0] - 0.45 * L1 * Math.cos(th1), S[1] - L1 * Math.sin(th1)], T = [E[0] - 0.55 * L2 * Math.cos(th2), E[1] - L2 * Math.sin(th2)], C = [2 * E[0] - (S[0] + T[0]) / 2, 2 * E[1] - (S[1] + T[1]) / 2];
  tube(p, function (v) { return [(1 - v) * (1 - v) * S[0] + 2 * (1 - v) * v * C[0] + v * v * T[0], (1 - v) * (1 - v) * S[1] + 2 * (1 - v) * v * C[1] + v * v * T[1]]; }, function (v) { return (2.5 + 11 * Math.pow(Math.sin(Math.PI * Math.min(1, v * 0.95 + 0.04)), 0.8)) * sc; }, 0, { fill: fill }, 1, 12);
}
D.add('swallow', {
  fam: 'nature', tags: ['bird', 'fly', 'flight', 'spring', 'sky', 'wings', 'migrate', 'barn swallow', '🐦'], loop: 1.2, still: 0.125, tapLen: 1.6, tapRest: 0.35, burst: false, margin: [14, 14, 14, 14],
  about: 'the wing flaps on a jointed chain, the tip trailing; the body rides against the wingbeat, the tail streams, wind streaks slide past', tapAbout: 'dives with the wings swept back, snaps a fly at the bottom, climbs away in hard strokes',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, ph = TAU * 2 * t, amp = 1, dy = 0, tilt = 0, bite = 0;
    if (tap) { amp = 1 - 0.72 * bump(seg(q, 0.08, 0.5)) + 0.35 * bump(seg(q, 0.55, 0.95)); dy = 24 * bump(seg(q, 0.05, 0.85)); tilt = 0.5 * bump(seg(q, 0.04, 0.4)) - 0.45 * bump(seg(q, 0.45, 0.85)); bite = bump(seg(q, 0.36, 0.5)); }
    var by = 3 * Math.sin(ph) * (tap ? 0.5 : 1), i;
    for (i = 0; i < 3; i++) { var ph2 = M.frac((tap ? 2 : 1) * t + i * 0.33); p.span('M' + (8 + i * 14) + ' ' + (22 + i * 24) + ' L' + (60 - i * 8) + ' ' + (22 + i * 24), ei(seg(ph2, 0.35, 1)), eo(seg(ph2, 0, 0.7)), { w: 0.45, ink: 'sky', detail: true }); }
    if (tap && q < 0.48) { var fb = 1 - ei(seg(q, 0.42, 0.48)); p.at(84, 86, 0, fb, function () { p.ellipse(-2, -3, 3.4, 1.6, { fill: 'white', alpha: 0.8, rot: -0.5, w: 0.4 }); p.ellipse(2, -3, 3.4, 1.6, { fill: 'white', alpha: 0.8, rot: 0.5, w: 0.4 }); p.circle(0, 0, 2.2, { fill: 'black' }); }); }
    p.at(0, dy, 0, 1, function () {
      p.pivot(50, 52, tilt, 1.1, function () {
        p.move(0, by);
        wing(p, [63, 47], ph + 0.12, amp * 0.9, 0.9, 'blue');
        tube(p, function (v) { return [lerp(32, 2, v), lerp(56, 46 + 2 * Math.sin(ph - 1), v)]; }, 4, 0.8, { fill: 'navy' }, 1, 8);
        tube(p, function (v) { return [lerp(32, 5, v), lerp(58, 72 + 2 * Math.sin(ph - 1.4), v)]; }, 4, 0.8, { fill: 'navy' }, 1, 8);
        var body = function (v) { return bz([84, 46], [72, 43], [48, 50], [30, 58], v); }, wb = function (v) { return 5 + 11 * Math.sin(Math.PI * Math.min(1, 0.15 + v * 0.95)) * (1 - 0.55 * v); };
        tube(p, body, wb, 0, { fill: 'navy' }, 1, 14);
        p.clip(function () { tube(p, body, wb, 0, { fill: 'navy' }, 1, 14); }, function () { p.ellipse(60, 60, 26, 8, { fill: 'cream', line: false }); p.ellipse(79, 51, 7, 5, { fill: 'red', line: false }); });
        p.poly([[84, 43.5], [93, 46.5 + 2 * bite], [84, 49.5 + 4 * bite]], { fill: 'black', w: 0.7 }); p.dot(79.5, 43, 1.9, 'white'); p.dot(80, 43, 1, 'black');
        wing(p, [58, 47], ph, amp, 1, 'navy');
      });
    });
  }
});

/* ☁ a cumulus drifts and reshapes, its puffs swelling and shrinking out of step, a calm face on it.
   Tap: it slides aside and a sun that was behind it beams out, rays drawn one by one, then it slides back. */
D.add('cloud', {
  fam: 'nature', tags: ['sky', 'weather', 'cumulus', 'drift', 'calm', 'cloudy', 'sleep', 'storage', '☁'], loop: 4, still: 0.25, tapLen: 2, burst: false, margin: [8, 14, 6, 14],
  about: 'drifts side to side, the puffs swelling and shrinking out of step; a calm face', tapAbout: 'slides aside to show a sun behind it, whose rays are drawn one by one; slides back',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, slide = tap ? 36 * eo(seg(q, 0, 0.32)) * (1 - M.ease(seg(q, 0.7, 0.98))) : 0, sun = tap ? sp(seg(q, 0.1, 0.42)) * (1 - ei(seg(q, 0.8, 0.96))) : 0, i;
    if (sun > 0.03) p.at(34, 52, 0.5 * eo(q), sun, function () {
      p.circle(0, 0, 15, { fill: 'yellow' });
      for (i = 0; i < 10; i++) p.at(0, 0, i * TAU / 10, 1, function () { p.draw('M0 -20 L0 -' + (21 + 9 * (i % 2)), seg(q, 0.2 + i * 0.03, 0.4 + i * 0.03), { w: 0.8, cap: 'round' }); });
      p.dot(-5, -2, 1.5); p.dot(5, -2, 1.5); p.path('M-5 4 Q0 9 5 4', { w: 0.8, cap: 'round' });
    });
    var C = [[27, 63, 14, 1, 0], [43, 51, 18, 2, 0.3], [62, 53, 16, 1, 0.55], [77, 64, 12, 2, 0.1], [52, 65, 15, 1, 0.8]].map(function (c) { return [c[0] + 1.5 * W(t, 1, c[4]), c[1] + 1.4 * W(t, c[3], c[4]), c[2] * (1 + 0.1 * W(t, c[3], c[4] + 0.25))]; });
    p.at(6 * W(t, 1) + slide, -4 * (slide / 36), 0, 1, function () {
      p.poly(puff(C, 79), { fill: 'white' });
      var happy = tap ? sp(seg(q, 0.05, 0.3)) : 0, lidc = blink(t, 0.7, 0.05);
      p.at(0, 0, 0, [1, 1 - 0.9 * lidc], function () { p.dot(43, 66, 2.3); p.dot(61, 66, 2.3); });
      p.path('M48 72 Q52 ' + (75.5 + 2 * happy) + ' 56 72', { w: 0.8, cap: 'round' });
      p.ellipse(36, 71, 4.2, 2.4, { fill: 'pink', line: false, alpha: 0.7 }); p.ellipse(68, 71, 4.2, 2.4, { fill: 'pink', line: false, alpha: 0.7 });
    });
  }
});

/* 🌻 a sunflower follows a small sun across the top of the sky: the head turns toward it — the seed disc slides and the
   ring of petals narrows — a beat behind, and the leaves sway. Tap: it turns to face you, draws a smile on the disc,
   the petals ripple one after another, then it turns back. */
var PET = 'M0 -8 C6 -11 6 -22 0 -27 C-6 -22 -6 -11 0 -8 Z';
D.add('sunflower', {
  fam: 'nature', tags: ['flower', 'summer', 'sun', 'garden', 'yellow', 'seed', 'heliotrope', 'happy', '🌻'], loop: 6, still: 0.1, tapLen: 2, burst: false, margin: [8, 8, 2, 8],
  about: 'follows a small sun across the sky, the head turning toward it a beat behind; the leaves sway', tapAbout: 'turns to face you, draws a smile on the seed disc, ripples its petals, then turns back',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, g = tap ? sp(seg(q, 0.05, 0.35)) * (1 - ei(seg(q, 0.8, 0.96))) : 0, T = 0.85 * Math.sin(TAU * t - 0.5) * (1 - M.clamp(g, 0, 1)), cs = Math.max(0.5, Math.cos(T)), i, j;
    var sx = 50 + 38 * Math.sin(TAU * t), sy = 9 + 6 * Math.sin(TAU * t) * Math.sin(TAU * t);
    p.at(sx, sy, TAU * t * 2, 1, function () { p.circle(0, 0, 4.6, { fill: 'yellow', w: 0.7 }); for (j = 0; j < 8; j++) p.at(0, 0, j * TAU / 8, 1, function () { p.line(0, -7, 0, -10.5, { w: 0.6, cap: 'round', detail: true }); }); });
    var stem = function (v) { return bz([50, 100], [48, 86], [53, 66], [50 + 2 * T, 46], v); };
    tube(p, stem, 5, 4, { fill: 'green' }, 1, 10);
    [[-1, 82, 0.2], [1, 72, 0.5]].forEach(function (l) { p.at(l[0] > 0 ? 51 : 49, l[1], 0, [l[0], 1], function () { p.pivot(0, 0, -0.3 + 0.08 * W(t, 2, l[2]), 1, function () { p.path('M0 0 C-6 -11 -20 -13 -30 -6 C-26 5 -10 9 0 0 Z', { fill: 'leaf' }); p.path('M-2 -1 C-10 -4 -18 -6 -26 -5', { w: 0.4, detail: true }); }); }); });
    p.at(50 + 2 * T, 44, 0.12 * T, 1 + 0.1 * g, function () {
      p.pivot(0, 0, 0, [cs, 1], function () {
        var rot = tap ? TAU / 13 * eo(seg(q, 0.05, 0.6)) : 0;
        for (j = 0; j < 13; j++) { var rp = tap ? 1 + 0.22 * bump(seg(q, 0.15 + j * 0.04, 0.4 + j * 0.04)) : 1; p.at(0, 0, j * TAU / 13 + rot, rp, function () { p.path(PET, { fill: 'gold', w: 0.8 }); }); }
        for (j = 0; j < 13; j++) { var rp2 = tap ? 1 + 0.22 * bump(seg(q, 0.19 + j * 0.04, 0.44 + j * 0.04)) : 1; p.at(0, 0, (j + 0.5) * TAU / 13 + rot, 0.88 * rp2, function () { p.path(PET, { fill: 'yellow', w: 0.8 }); }); }
        p.circle(7 * Math.sin(T), 0, 11, { fill: 'brown' });
        if (!p.small) for (i = 1; i < 40; i++) p.dot(7 * Math.sin(T) + 1.6 * Math.sqrt(i) * Math.cos(i * 2.39996) * 0.95, 1.6 * Math.sqrt(i) * Math.sin(i * 2.39996) * 0.95, 0.85, 'wood');
      });
      if (g > 0.05) {
        var bl = 1 - 0.9 * blink(q, 0.55, 0.08);
        p.at(0, 0, 0, [1, bl], function () { p.dot(-4, -2, 1.5, 'cream'); p.dot(4, -2, 1.5, 'cream'); });
        p.span('M-5.5 2.5 Q0 9 5.5 2.5', ei(seg(q, 0.8, 0.94)), seg(q, 0.2, 0.4), { ink: 'cream', w: 0.8, cap: 'round' });
      }
    });
  }
});

/* 🌵 a potted saguaro in the heat: the arms drift up and down, one after the other, a glint runs up the ribs, a bud swells
   at the crown. Tap: the crown bud opens into a flower with a spring, then the two arm tips open after it. */
D.add('cactus', {
  fam: 'nature', tags: ['desert', 'plant', 'prickly', 'succulent', 'pot', 'bloom', 'houseplant', 'spine', '🌵'], loop: 3, still: 0.1, tapLen: 2, tapRest: 0.6, burst: 'petal', burstAt: [50, 14], burstN: 4, burstSpread: 3, margin: [12, 8, 2, 8],
  about: 'the arms drift up and down in turn, a glint runs up the ribs, a bud swells at the crown', tapAbout: 'the crown bud opens into a flower with a spring, then the arm tips open after it',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, open = [tap ? sp(seg(q, 0.05, 0.4)) * (1 - ei(seg(q, 0.88, 1))) : 0, tap ? sp(seg(q, 0.2, 0.52)) * (1 - ei(seg(q, 0.9, 1))) : 0, tap ? sp(seg(q, 0.3, 0.6)) * (1 - ei(seg(q, 0.92, 1))) : 0], i;
    function bloom(x, y, k, o, c) {
      p.at(x, y, 0, k, function () {
        if (o < 0.04) { p.path('M0 2 C-3 -2 -3 -7 0 -10 C3 -7 3 -2 0 2 Z', { fill: c }); return; }
        for (var j = 0; j < 7; j++) p.at(0, 0, (j - 3) * 0.34 * o, [0.8 + 0.2 * o, 0.7 + 0.3 * o], function () { p.path('M0 1 C-4 -3 -4 -11 0 -15 C4 -11 4 -3 0 1 Z', { fill: j % 2 ? c : 'pink', w: 0.7 }); });
        p.circle(0, -1, 2.6 * o, { fill: 'yellow', w: 0.6 });
      });
    }
    p.pivot(50, 78, 0.012 * W(t, 1), [1 + 0.01 * W(t, 2), 1 - 0.01 * W(t, 2)], function () {
      p.path('M40 76 L40 30 C40 14 60 14 60 30 L60 76 Z', { fill: 'green' });
      p.path('M46 22 L46 74 M54 22 L54 74', { w: 0.4, detail: true, ink: 'leaf' });
      p.path('M43 26 L43 70', { ink: 'white', w: 0.5, detail: true, alpha: 0.8 });
      [[0, 0.22, 56], [1, 0.62, 44]].forEach(function (a) {
        var sw = 0.07 * W(t, 1, a[1]), side = a[0] ? 1 : -1;
        p.pivot(50 + side * 10, a[2] + 4, side * sw, 1, function () {
          if (side < 0) { p.path('M40 56 C28 56 24 52 24 44 L24 36 C24 30 32 30 32 36 L32 44 C32 47 35 48 40 48 Z', { fill: 'green' }); p.rect(38.8, 49, 2.6, 6.2, { fill: 'green', line: false }); p.path('M28 34 L28 46', { w: 0.35, detail: true, ink: 'leaf' }); }
          else { p.path('M60 50 C72 50 76 46 76 38 L76 30 C76 24 68 24 68 30 L68 38 C68 41 65 42 60 42 Z', { fill: 'green' }); p.rect(58.6, 43, 2.6, 6.2, { fill: 'green', line: false }); p.path('M72 28 L72 40', { w: 0.35, detail: true, ink: 'leaf' }); }
        });
      });
      for (i = 0; i < 6; i++) { var gl = seg(M.frac(t * 2 - i * 0.07), 0, 0.3); if (gl > 0 && gl < 1 && !tap) p.line(47 + (i % 2) * 6, 70 - i * 8, 49 + (i % 2) * 6, 66 - i * 8, { ink: 'yellow', w: 0.7, cap: 'round' }); }
      p.path('M42 36 L44 38 M56 46 L58 48 M44 56 L46 58 M55 62 L57 60 M43 66 L45 68', { w: 0.35, detail: true });
    });
    bloom(50, 19, 1 + 0.06 * W(t, 2), open[0], 'rose'); bloom(28, 32, 0.8, open[1], 'rose'); bloom(72, 27, 0.8, open[2], 'rose');
    p.path('M26 71 L74 71 L69 98 L31 98 Z', { fill: 'wood' }); p.rect(23, 66, 54, 8, { fill: 'orange', r: 2, w: 1 });
    p.path('M30 82 L70 82', { w: 0.4, detail: true });
  }
});

/* 🌋 a volcano rumbles: the crater glows, a lava stream is drawn down the slope and drawn back, smoke puffs swell as they
   climb and shrink as they go. Tap: it erupts — a fountain of lava, bombs flung out in arcs, a big plume of smoke, the cone shaking. */
D.add('volcano', {
  fam: 'nature', tags: ['lava', 'eruption', 'mountain', 'smoke', 'hot', 'island', 'fire', 'geology', '🌋'], loop: 3.2, still: 0.4, tapLen: 2, tapRest: 0.35, burst: false, margin: [26, 14, 2, 14],
  about: 'the crater glows, a lava stream is drawn down the slope and back; smoke puffs swell as they rise and shrink as they go', tapAbout: 'erupts: a lava fountain, bombs flung in arcs, a big plume of smoke, the cone shaking',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, shake = tap ? 1.6 * Math.sin(TAU * 12 * q) * bump(seg(q, 0, 0.7)) : 0.5 * Math.sin(TAU * 8 * t), i, n = tap ? 6 : 4;
    p.path('M2 96 L98 96', { w: 0.7 });
    for (i = n - 1; i >= 0; i--) {
      var u = tap ? seg(q, 0.04 + 0.06 * i, 0.9) : M.frac(t + i / 4);
      if (u <= 0 || u >= 1) continue;
      var r = (tap ? 14 : 9) * eo(seg(u, 0, 0.5)) * (1 - ei(seg(u, 0.65, 1))), x = 50 + (tap ? 10 : 6) * Math.sin(TAU * 0.8 * u + i * 1.7) * u + (i % 2 ? 6 : -6) * u * (tap ? 1.5 : 1), y = 42 - (tap ? 58 : 40) * eo(u);
      if (r > 0.8) p.poly(puff([[x - r * 0.5, y + r * 0.1, r * 0.7], [x + r * 0.5, y + r * 0.1, r * 0.7], [x, y - r * 0.4, r * 0.8]]), { fill: 'smoke', w: 0.8 });
    }
    p.at(shake, 0, 0, 1, function () {
      p.path('M2 96 C16 90 30 66 38 48 C42 44 58 44 62 48 C70 66 84 90 98 96 Z', { fill: 'brown' });
      p.path('M16 82 C30 84 44 78 52 81 C62 84 74 80 84 82 M27 66 C38 68 46 65 52 66', { ink: 'sand', w: 0.45, detail: true });
      p.ellipse(50, 47, 12.5, 3.8, { fill: 'flame' });
      var u1 = tap ? eo(seg(q, 0.05, 0.6)) : eo(seg(t, 0.05, 0.55)), v1 = tap ? ei(seg(q, 0.75, 1)) : ei(seg(t, 0.55, 0.95));
      if (u1 - v1 > 0.04) tube(p, function (v) { return bz([55, 49], [60, 62], [55, 76], [63, 95], v); }, 6, 3.5, { fill: 'flame' }, u1, 12, v1);
    });
    if (tap) {
      var fh = 34 * bump(seg(q, 0.03, 0.55));
      if (fh > 3) p.at(shake, 0, 0, 1, function () { tube(p, function (v) { return [50 + 2 * Math.sin(TAU * 6 * q + v * 4), 46 - fh * v]; }, 15, 2, { fill: 'flame' }, 1, 8); tube(p, function (v) { return [50, 46 - fh * 0.8 * v]; }, 7, 1, { fill: 'yellow', line: false }, 1, 8); });
      for (i = 0; i < 9; i++) {
        var a = -Math.PI / 2 + (i - 4) * 0.3, v = 46 + 9 * (i % 3), tau = seg(q, 0.04 + 0.015 * i, 0.78);
        if (tau > 0 && tau < 1) p.circle(50 + Math.cos(a) * v * tau * 1.2, 44 + Math.sin(a) * v * tau * 1.2 + 70 * tau * tau, 3.4 * (1 - ei(seg(tau, 0.8, 1))), { fill: 'flame', w: 0.7 });
      }
    }
  }
});

/* 🐞 a ladybug walks up a leaf on an alternating tripod, the body waddling with each step, the antennae feeling ahead,
   the leaf's veins sliding down past it. Tap: the red wing cases swing open, the thin wings unfold and whirr, it lifts
   a little off the leaf, then folds everything away. */
D.add('ladybug', {
  fam: 'nature', tags: ['insect', 'garden', 'luck', 'spots', 'beetle', 'spring', 'walk', 'aphid', '🐞'], loop: 2, still: 0.1, tapLen: 2, burst: false, margin: [8, 10, 6, 10],
  about: 'walks up a leaf on an alternating tripod, waddling, the leaf veins sliding down; the antennae feel ahead', tapAbout: 'the wing cases swing open, the thin wings unfold and whirr, it lifts a little, then folds away',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, open = tap ? sp(seg(q, 0.05, 0.3)) * (1 - M.ease(seg(q, 0.72, 0.9))) : 0, hov = tap ? bump(seg(q, 0.25, 0.78)) : 0, ph = TAU * 4 * t, i, LEAF = 'M50 3 C86 22 90 72 50 97 C10 72 14 22 50 3 Z';
    p.path(LEAF, { fill: 'mint' });
    p.clip(LEAF, function () {
      for (i = 0; i < 5; i++) { var y = -10 + 110 * M.frac((i * 22 + 22 * t + 10) / 110); p.path('M50 ' + y + ' L22 ' + (y - 16) + ' M50 ' + y + ' L78 ' + (y - 16), { ink: 'leaf', w: 0.45, detail: true }); }
    });
    p.path('M50 6 L50 94', { ink: 'leaf', w: 0.5, detail: true });
    if (hov > 0.05) p.ellipse(50, 86, 22 * (1 - 0.3 * hov), 4 * (1 - 0.3 * hov), { fill: 'night', alpha: 0.18, line: false });
    var wob = 0.045 * Math.sin(ph) * (1 - open * 0.8);
    p.at(0, -6 * hov, 0, 1, function () {
      p.pivot(50, 58, wob, 1 + 0.08 * hov, function () {
        [[-1, 0, 0], [1, 1, 1], [-1, 2, 0], [1, 0, 1], [-1, 1, 1], [1, 2, 0]].forEach(function (L) {
          var sd = L[0], r = L[1], sw = 5 * Math.sin(ph + (L[2] ? Math.PI : 0)) * (1 - 0.8 * open), by = 44 + r * 13, ky = by + (r === 0 ? -4 : r === 2 ? 6 : 0) + 0.5 * sw;
          p.curve([[50 + sd * 20, by], [50 + sd * 31, ky], [50 + sd * 39, by + (r === 0 ? -1 : r === 2 ? 8 : 3) + sw]], { w: 0.9, cap: 'round' });
        });
        if (open > 0.04) [-1, 1].forEach(function (d) { p.pivot(50, 40, d * 0.12 * Math.sin(TAU * 7 * q) * hov, [open, open], function () { p.pivot(50, 0, 0, [d, 1], function () { p.path('M50 42 C64 38 84 48 94 66 C84 70 66 62 50 52 Z', { fill: 'sky', alpha: 0.6, w: 0.6 }); p.path('M54 44 C68 46 80 54 88 64', { w: 0.35, detail: true }); }); }); });
        p.path('M41 27 C41 17 59 17 59 27 Z', { fill: 'black' }); p.dot(45.5, 23, 1.5, 'white'); p.dot(54.5, 23, 1.5, 'white');
        [-1, 1].forEach(function (d, n) { var w = 3 * Math.sin(ph * 0.5 + n * 1.3); p.curve([[50 + d * 4, 19], [50 + d * 9, 12 + w * 0.3], [50 + d * (14 + w), 7]], { w: 0.8, cap: 'round' }); });
        var EL = 'M51 33 C68 31 77 46 77 60 C77 76 65 86 51 86 Z';
        [-1, 1].forEach(function (d) {
          p.pivot(50, 36, d * -open * 0.95 * -1, 1, function () {
            p.pivot(50, 0, 0, [-d, 1], function () {
              p.path(EL, { fill: 'red' });
              p.clip(EL, function () { p.circle(63, 46, 6, { fill: 'black', line: false }); p.circle(68, 66, 6.5, { fill: 'black', line: false }); p.circle(56, 79, 4.6, { fill: 'black', line: false }); });
            });
          });
        });
        p.path('M35 36 C34 26 66 26 65 36 C60 40 40 40 35 36 Z', { fill: 'black' }); p.ellipse(40.5, 33, 3.4, 2.4, { fill: 'white', line: false }); p.ellipse(59.5, 33, 3.4, 2.4, { fill: 'white', line: false });
      });
    });
  }
});

/* 🌍 the globe turns, continents sliding across it from west to east and foreshortening at the edge, the axis tilted, a
   shadow on one side, two wisps of cloud moving faster than the land. Tap: it spins on, the moon swings round it, behind and in front. */
var LAND = [
  [[-17, 15], [-16, 24], [-10, 30], [-6, 36], [10, 37], [20, 32], [32, 31], [35, 22], [43, 12], [51, 12], [46, 2], [40, -2], [40, -15], [35, -25], [27, -34], [18, -34], [12, -18], [9, -1], [8, 4], [-8, 4], [-14, 9]],
  [[-9, 37], [-9, 43], [-2, 47], [5, 52], [8, 55], [10, 58], [5, 62], [15, 69], [30, 71], [60, 70], [100, 77], [140, 72], [170, 66], [160, 58], [140, 52], [135, 43], [122, 37], [122, 28], [110, 20], [105, 10], [100, 3], [95, 16], [80, 10], [72, 20], [58, 24], [50, 28], [40, 36], [30, 36], [27, 40], [20, 40], [12, 44], [3, 43]],
  [[-168, 66], [-140, 70], [-95, 72], [-62, 60], [-56, 48], [-70, 42], [-80, 31], [-97, 26], [-92, 17], [-84, 10], [-78, 8], [-60, 10], [-50, 0], [-35, -6], [-40, -22], [-58, -38], [-66, -52], [-75, -50], [-72, -30], [-70, -18], [-81, -5], [-80, 2], [-90, 15], [-105, 22], [-117, 32], [-124, 40], [-125, 50], [-140, 60]],
  [[113, -22], [122, -18], [130, -12], [142, -11], [146, -19], [153, -27], [150, -37], [140, -38], [135, -35], [115, -34]],
  [[-45, 60], [-20, 70], [-20, 82], [-60, 82], [-70, 76], [-55, 65]]
];
var LANDDENSE = LAND.map(function (poly) {
  var out = [], i, k, a, b, n;
  for (i = 0; i < poly.length; i++) { a = poly[i]; b = poly[(i + 1) % poly.length]; n = Math.max(1, Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) / 6)); for (k = 0; k < n; k++) out.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]); }
  return out;
});
function onSphere(lon, lat, l0, f0) {
  var la = lat * Math.PI / 180, lo = (lon - l0) * Math.PI / 180, x = Math.cos(la) * Math.sin(lo), y = Math.sin(la), z = Math.cos(la) * Math.cos(lo);
  return [x, y * Math.cos(f0) - z * Math.sin(f0), y * Math.sin(f0) + z * Math.cos(f0)];
}
/* the part of a polygon on the sphere that faces us, as points on the unit disc, with arcs along the limb where it was cut */
function facing(P) {
  var out = [], res = [], n = P.length, i, k, a, b, u, m, L, a0, a1, d;
  for (i = 0; i < n; i++) {
    a = P[i]; b = P[(i + 1) % n];
    if (a[2] >= 0) out.push([a[0], a[1], 0]);
    if ((a[2] >= 0) !== (b[2] >= 0)) { u = a[2] / (a[2] - b[2]); m = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; L = Math.hypot(m[0], m[1]) || 1; out.push([m[0] / L, m[1] / L, 1]); }
  }
  for (i = 0; i < out.length; i++) {
    a = out[i]; b = out[(i + 1) % out.length]; res.push(a);
    if (a[2] && b[2]) { a0 = Math.atan2(a[1], a[0]); a1 = Math.atan2(b[1], b[0]); d = a1 - a0; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; for (k = 1; k < 6; k++) res.push([Math.cos(a0 + d * k / 6), Math.sin(a0 + d * k / 6), 0]); }
  }
  return res;
}
D.add('earth', {
  fam: 'nature', tags: ['globe', 'world', 'planet', 'global', 'map', 'space', 'geography', 'travel', '🌍', '🌎', '🌏'], loop: 6, still: 0.12, tapLen: 2, burst: 'star', burstAt: [50, 20], burstN: 4, burstSpread: 4, margin: [10, 10, 10, 10],
  about: 'turns west to east, continents sliding across and foreshortening at the edge; two cloud wisps move faster than the land', tapAbout: 'spins on while the moon swings round it, behind and in front',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, extra = tap ? M.ease(seg(q, 0.05, 0.9)) : 0, l0 = -360 * (t + extra), f0 = 0.35, R = 38, cx = 50, cy = 50, k;
    var sq = tap ? 0.05 * (1 - sp(seg(q, 0, 0.5))) : 0, mb = TAU * seg(q, 0.1, 0.95), msc = tap ? Math.min(seg(q, 0.1, 0.2), 1 - seg(q, 0.88, 0.95)) : 0;
    var moon = function () { var ox = 46 * Math.cos(mb), oy = 14 * Math.sin(mb); p.at(50 + ox * Math.cos(-0.3) - oy * Math.sin(-0.3), 50 + ox * Math.sin(-0.3) + oy * Math.cos(-0.3), 0, msc * (1 + 0.15 * Math.sin(mb)), function () { p.circle(0, 0, 6, { fill: 'stone' }); p.dot(-1.6, -1.4, 1.2); p.dot(1.8, 1.8, 0.9); }); };
    twinkle(p, 12, 16, 6, M.frac(t * 2), 'yellow'); twinkle(p, 88, 84, 5, M.frac(t * 2 + 0.5), 'yellow');
    if (tap && Math.sin(mb) < 0) moon();
    p.pivot(cx, cy, 0, [1 + sq, 1 - sq], function () {
      p.circle(cx, cy, R, { fill: 'sky' });
      p.pivot(cx, cy, 0.41, 1, function () {
        LANDDENSE.forEach(function (poly, n) {
          var P = poly.map(function (c) { return onSphere(c[0], c[1], l0, f0); }), F = facing(P);
          if (F.length > 2) p.poly(F.map(function (c) { return [cx + R * c[0], cy - R * c[1]]; }), { fill: n === 4 ? 'white' : n === 3 ? 'sand' : 'leaf', w: 0.7 });
        });
        [[10, 8], [140, 22]].forEach(function (c) {
          var P = onSphere(c[0], c[1], l0 * 2, f0);
          if (P[2] > 0.15) p.at(cx + R * P[0], cy - R * P[1], 0, [P[2], 1], function () { p.poly(puff([[-6, 1, 4.2], [0, -1, 5.2], [6.5, 1, 4]], 4.6), { fill: 'white', w: 0.7 }); });
        });
      });
      p.clip('M' + (cx - R) + ' ' + cy + ' A' + R + ' ' + R + ' 0 1 1 ' + (cx + R) + ' ' + cy + ' A' + R + ' ' + R + ' 0 1 1 ' + (cx - R) + ' ' + cy + ' Z', function () { p.circle(cx + 16, cy + 8, R, { fill: 'night', alpha: 0.2, line: false }); });
      p.path('M' + (cx - 29) + ' ' + (cy - 14) + ' C' + (cx - 25) + ' ' + (cy - 24) + ' ' + (cx - 16) + ' ' + (cy - 31) + ' ' + (cx - 6) + ' ' + (cy - 34), { ink: 'white', w: 0.8, detail: true });
      p.circle(cx, cy, R, {});
    });
    if (tap && Math.sin(mb) >= 0) moon();
  }
});

/* 🌳 a tree sways from the roots, the canopy a beat behind the trunk, apples among the leaves, a leaf now and then coming
   loose and drifting down. Tap: the tree is shaken, the apples drop and bounce, leaves fly, and new apples swell in place. */
D.add('tree', {
  fam: 'nature', tags: ['forest', 'plant', 'apple', 'fruit', 'green', 'orchard', 'shade', 'nature', '🌳', '🍎'], loop: 3.6, still: 0.25, tapLen: 2.2, tapRest: 0.4, burst: 'leaf', burstAt: [50, 34], burstN: 6, burstSpread: 3.4, margin: [10, 14, 2, 14],
  about: 'sways from the roots with the canopy a beat behind; a leaf comes loose and drifts down', tapAbout: 'is shaken; the apples drop and bounce, leaves fly, new apples swell in place',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, shake = tap ? 0.07 * Math.sin(TAU * 5 * q) * (1 - M.ease(seg(q, 0.05, 0.75))) : 0, A = [[36, 40], [58, 33], [66, 50], [42, 55], [52, 45]], i;
    p.path('M4 96 C30 94 70 94 96 96', { w: 0.7 });
    var sway = 0.03 * W(t, 1);
    p.pivot(50, 96, sway, 1, function () {
      p.path('M42 96 C44 84 46 72 42 60 L58 60 C54 72 56 84 58 96 Z', { fill: 'wood' });
      p.path('M48 92 L48 72 M54 88 L53 74', { w: 0.4, detail: true });
      tube(p, function (v) { return [lerp(46, 33, v), lerp(72, 52, v)]; }, 5, 2.6, { fill: 'wood' }, 1, 5); tube(p, function (v) { return [lerp(54, 67, v), lerp(70, 50, v)]; }, 5, 2.6, { fill: 'wood' }, 1, 5);
      p.pivot(50, 62, 0.035 * W(t, 1, -0.1) + shake, 1, function () {
        p.poly(puff([[30, 40, 17], [50, 27, 21], [70, 40, 17], [39, 53, 15], [62, 53, 15], [50, 44, 18]]), { fill: 'leaf', w: 1 });
        p.blob(40, 29, 7, { fill: 'mint', line: false, alpha: 0.6, seed: 2 }); p.blob(62, 25, 5, { fill: 'mint', line: false, alpha: 0.6, seed: 5 });
        p.path('M24 44 L27 47 L30 44 M56 56 L59 59 L62 56 M44 20 L47 23 L50 20 M70 32 L73 35 L76 32', { w: 0.4, detail: true });
        A.forEach(function (a, n) {
          var d0 = 0.12 + 0.08 * n, grown = tap ? (q < d0 ? 1 : q > 0.86 + 0.02 * n ? sp(seg(q, 0.86 + 0.02 * n, 1)) : 0) : 1;
          if (grown > 0.03) p.at(a[0], a[1], 0, grown, function () { p.line(0, -3, 1.5, -7, { w: 0.6 }); p.circle(0, 0, 4.2, { fill: 'red' }); p.dot(-1.4, -1.4, 0.9, 'white'); });
        });
      });
      var lf = win(t, 0.25, 0.6);
      if (!tap && lf >= 0) p.at(66 + 9 * Math.sin(TAU * 1.5 * lf), 46 + 46 * lf, 0.8 * Math.sin(TAU * 1.5 * lf + 1), 1.2 * (1 - ei(seg(lf, 0.85, 1))), function () { p.path('M0 0 C-4 -3 -4 -8 0 -11 C4 -8 4 -3 0 0 Z', { fill: 'leaf', w: 0.8 }); });
    });
    if (tap) A.forEach(function (a, n) {
      var d0 = 0.12 + 0.08 * n, tau = seg(q, d0, d0 + 0.4), tb = seg(q, d0 + 0.4, d0 + 0.56), x = a[0] + (n - 2) * 5 * tau, y = lerp(a[1] + 4, 91, tau * tau), sc = 1 - ei(seg(q, 0.8, 0.94));
      if (q < d0 || sc < 0.03) return;
      if (tb > 0 && tb < 1) y -= 9 * 4 * tb * (1 - tb);
      p.at(x, y, 0, sc, function () { p.circle(0, 0, 4.2, { fill: 'red' }); p.dot(-1.4, -1.4, 0.9, 'white'); p.line(0, -3, 1.5, -7, { w: 0.6 }); });
    });
  }
});

/* 🌼 a dandelion clock: the seed head sways on its stem, the tufts shimmer, and now and then a seed lets go, floats off on its
   parachute and shrinks into the distance while a new one is drawn out in its place. Tap: a gust from the left, and the seeds
   leave from the left side first, the bare head then drawing its filaments out again. */
function seed(p, x, y, rot, k, g) {
  p.at(x, y, rot, k, function () {
    p.ellipse(0, 7, 1.6, 3, { fill: 'sand', w: 0.5 }); p.line(0, 4, 0, -2, { w: 0.5 });
    for (var j = -3; j <= 3; j++) p.line(0, -2, j * 2.6, -9 - (3 - Math.abs(j)) * 0.6, { w: 0.4, cap: 'round' });
    p.path('M-7.8 -9 Q0 -14 7.8 -9', { w: 0.4, detail: true });
  });
}
D.add('dandelion', {
  fam: 'nature', tags: ['seed', 'wish', 'wind', 'weed', 'meadow', 'spring', 'blow', 'fluff', '🌼'], loop: 3.2, still: 0.1, tapLen: 2.2, burst: false, margin: [14, 22, 2, 14],
  about: 'sways, the tufts shimmering; every so often a seed lets go and floats off while a new one is drawn out in its place', tapAbout: 'a gust from the left blows the seeds away from the left side first; the bare head draws its filaments out again',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, N = 18, C = [52, 38], R = 24, i, sway = 0.03 * W(t, 1) + (tap ? 0.05 * bump(seg(q, 0, 0.5)) : 0);
    p.path('M4 97 C30 95 70 95 96 97', { w: 0.7 });
    p.poly([[46, 99], [37, 95], [29, 97], [31, 91], [21, 91], [26, 85], [16, 83], [28, 81], [39, 87], [45, 93]], { fill: 'leaf', w: 0.8 });
    p.poly([[48, 99], [58, 94], [66, 96], [64, 90], [74, 89], [69, 83], [79, 80], [67, 78], [56, 85], [50, 92]], { fill: 'leaf', w: 0.8 });
    p.pivot(46, 100, sway, 1, function () {
      tube(p, function (v) { return bz([46, 100], [44, 82], [56, 62], [52, 40], v); }, 4.4, 3.4, { fill: 'green' }, 1, 10);
      p.circle(C[0], C[1], 4.6, { fill: 'brown' });
      var small = p.small;
      for (i = 0; i < N; i++) {
        var a = i * TAU / N + 0.15, dx = Math.cos(a), dy = Math.sin(a), tip = [C[0] + R * dx, C[1] + R * dy], u = -1, g = 1, sh = 0.5 + 0.5 * W(t, 2, i * 0.11);
        if (tap) { var d0 = 0.5 * (tip[0] - (C[0] - R)) / (2 * R) + 0.03 * (i % 3); u = q > d0 ? seg(q, d0, d0 + 0.5) : -1; g = seg(q, 0.78 + 0.008 * i, 0.98); if (u >= 0 && u < 1) g = 0; }
        else if (i === 3 || i === 11) { var t0 = i === 3 ? 0.05 : 0.55, w1 = win(t, t0, 0.5), w2 = win(t, t0 + 0.5, 0.15); u = w1; g = w1 >= 0 ? 0 : w2 >= 0 ? w2 : 1; }
        if (u >= 0 && u < 1) {
          var k = 1 - ei(seg(u, 0.7, 1)), ex = (46 + 12 * (i % 3)) * eo(u) + 5 * Math.sin(TAU * 1.5 * u), ey = -26 * eo(u) - 4 * u + 16 * u * u * (tap ? 0.6 : 1);
          if (k > 0.03) seed(p, tip[0] + ex, tip[1] + ey, 0.5 * Math.sin(TAU * 1.5 * u + i), 1.1 * k, 1);
          continue;
        }
        if (g <= 0.02) continue;
        var r0 = 5, e = [C[0] + dx * (r0 + (R - r0) * g), C[1] + dy * (r0 + (R - r0) * g)];
        p.line(C[0] + dx * r0, C[1] + dy * r0, e[0], e[1], { w: 0.5 });
        if (small) p.circle(e[0], e[1], 2.4 * g, { fill: 'white', w: 0.5 });
        else p.at(e[0], e[1], a + 0.15 * sh, g, function () { p.path('M0 0 L5 0 M0 0 L4.6 1.9 M0 0 L4.6 -1.9 M0 0 L3.4 3.4 M0 0 L3.4 -3.4', { w: 0.45 }); p.dot(0, 0, 0.9); });
      }
      if (tap && q > 0.12 && q < 0.9) [0, 1, 2].forEach(function (j) { p.span('M-14 ' + (20 + j * 18) + ' C6 ' + (14 + j * 18) + ' 26 ' + (30 + j * 18) + ' 60 ' + (22 + j * 18), ei(seg(q, 0.45 + j * 0.05, 0.9)), eo(seg(q, 0.1 + j * 0.05, 0.6)), { w: 0.55, ink: 'sky' }); });
    });
  }
});

/* 🕷 a spider lets itself down on its thread, hangs while its eight legs feel about, then climbs back up quicker than it came;
   a corner of web in the top left. Tap: it drops, twirls on the thread — the body narrowing and widening as it turns — and
   climbs back. */
function spider(p, t, y, sx, wig, lid) {
  p.at(50, y, 0, [sx, 1], function () {
    [-1, 1].forEach(function (sd) {
      for (var i = 0; i < 4; i++) {
        var ph = TAU * (3 * t + i * 0.19 + (sd > 0 ? 0.08 : 0)), a = wig * Math.sin(ph), b = wig * Math.sin(ph + 1);
        p.curve([[sd * 5, -4 + i * 2.4], [sd * (14 + (i % 2) * 2), -14 + i * 5 + a], [sd * (24 + (i === 0 || i === 3 ? 2 : 0)), 2 + i * 6 + b]], { w: 0.9, cap: 'round' });
      }
    });
    p.ellipse(0, 9, 11, 13, { fill: 'plum' }); p.path('M-3 4 L3 4 L0 9 L3 14 L-3 14 L0 9 Z', { fill: 'cream', w: 0.4, detail: true });
    p.circle(0, -6, 7.6, { fill: 'plum' });
    [-1, 1].forEach(function (sd) { p.circle(sd * 3.2, -7.6, 2.8, { fill: 'white', w: 0.6 }); p.dot(sd * 3.2 + 0.3, -7.2, 1.3); if (lid > 0.05) lidOf(p, sd * 3.2, -7.6, 2.8, lid, 'plum'); });
  });
}
D.add('spider', {
  fam: 'nature', tags: ['web', 'halloween', 'insect', 'arachnid', 'creepy', 'thread', 'eight', 'itsy', '🕷'], loop: 3.6, still: 0.3, tapLen: 1.9, burst: false, margin: [10, 10, 6, 10],
  about: 'lets itself down on its thread, hangs with its legs feeling about, climbs back faster; a corner of web top left', tapAbout: 'drops, twirls on the thread, the body narrowing and widening as it turns, and climbs back',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, y, sx = 1, lid = blink(t, 0.7, 0.04), x = 50 + 3 * W(t, 1);
    if (tap) { y = 34 + 36 * ei(seg(q, 0, 0.22)) * (1 - M.ease(seg(q, 0.64, 1))) + 3 * sp(seg(q, 0.2, 0.5)) * (1 - seg(q, 0.55, 0.64)); sx = Math.cos(TAU * 2 * seg(q, 0.2, 0.62)); if (Math.abs(sx) < 0.18) sx = 0.18 * (sx < 0 ? -1 : 1); x = 50; }
    else y = 34 + 24 * M.ease(seg(t, 0.05, 0.5)) - 24 * M.ease(seg(t, 0.6, 0.82));
    p.path('M0 0 L40 0 M0 0 L36 24 M0 0 L22 38 M0 0 L0 40 M10 0 C12 8 8 12 0 10 M20 0 C22 12 14 22 0 20 M30 0 C32 16 20 30 0 30', { w: 0.4, detail: true });
    p.at(x - 50, 0, 0, 1, function () { p.line(50, -8, 50, y - 14, { w: 0.55 }); });
    p.at(x - 50, 0, 0, 1, function () { spider(p, t, y, sx, tap ? 4 : 2.6, lid); });
  }
});

/* 🦔 a hedgehog trundles along, the spines lifting in a ripple down its back, the little feet alternating, the long nose
   twitching and the ear flicking; grass slides by. Tap: it rolls up into a ball, rolls a turn and a half along the ground,
   and unrolls with the face coming out last. */
function hedgehog(p, t, c, rot, ph, lid) {
  var n = 44, pts = [], k, th, ca, sa, re, r, off, ln, cx = lerp(46, 50, c), cy = lerp(58, 56, c), a;
  for (k = 0; k < n; k++) {
    th = k / n * TAU; ca = Math.cos(th); sa = Math.sin(th); re = 36 * 22 / Math.sqrt(484 * ca * ca + 1296 * sa * sa); r = lerp(re, 29, c);
    ln = 6.5 * (1 + 0.28 * Math.sin(TAU * (2 * t - k * 2 / n))); off = (k % 2 ? 0 : ln) * (sa < 0 ? 1 : lerp(0.12, 1, c)); a = th + rot * c;
    pts.push([cx + (r + off) * Math.cos(a), cy + (r + off) * Math.sin(a)]);
  }
  [[30, 1], [64, 0]].forEach(function (f) { var sw = 5 * Math.sin(ph + f[1] * Math.PI), lf = -2.5 * Math.max(0, Math.cos(ph + f[1] * Math.PI)); if (c < 0.9) p.ellipse(f[0] + sw * (1 - c), 83 + lf * (1 - c) - 5 * c, 5.5 * (1 - c), 3.2 * (1 - c), { fill: 'sand' }); });
  p.poly(pts, { fill: 'brown', w: 0.9 });
  p.path('M20 62 C28 50 44 46 60 50 M26 70 C38 62 52 60 66 64', { ink: 'sand', w: 0.4, detail: true, alpha: 0.7 });
  if (c < 0.92) p.pivot(60, 64, 0, [1 - c, 1 - c], function () {
    p.path('M68 44 C82 44 92 54 99 63 C96 68 90 70 84 71 C76 77 66 76 60 72 Z', { fill: 'sand' });
    p.circle(72, 47, 4.2, { fill: 'sand' }); p.circle(72, 47, 2, { fill: 'pink', line: false });
    p.dot(99, 63 + 0.8 * Math.sin(TAU * 6 * t), 2.6);
    p.circle(85, 58, 3.4, { fill: 'white', w: 0.6 }); p.dot(86, 58.4, 2); if (lid > 0.05) lidOf(p, 85, 58, 3.4, lid, 'sand');
    p.path('M92 68 Q88 70.5 83 69', { w: 0.6 }); p.ellipse(80, 66, 3, 1.8, { fill: 'rose', line: false, alpha: 0.6 });
  });
}
D.add('hedgehog', {
  fam: 'nature', tags: ['spines', 'garden', 'prickly', 'small', 'curl', 'forest', 'animal', 'night', '🦔'], loop: 3, still: 0.2, tapLen: 2.2, tapRest: 0.45, burst: false, margin: [10, 10, 4, 10],
  about: 'trundles along, the spines lifting in a ripple down its back, the feet alternating, the nose twitching; grass slides by', tapAbout: 'rolls up into a ball, rolls a turn and a half, and unrolls with the face coming out last',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, c = tap ? sp(seg(q, 0.02, 0.3)) * (1 - M.ease(seg(q, 0.78, 0.97))) : 0, rot = tap ? TAU * 1.5 * M.ease(seg(q, 0.3, 0.78)) : 0, ph = TAU * 3 * t, sc = 24 * t + (tap ? 48 * M.ease(seg(q, 0.3, 0.78)) : 0), k, x, e;
    p.path('M0 86.5 L100 86.5', { w: 0.7 });
    for (k = 0; k < 5; k++) { x = -14 + M.frac((24 * k - sc + 14) / 120) * 120; e = Math.min(1, (x + 14) / 8, (104 - x) / 8); if (e > 0.05) p.at(x, 86.5, 0, e, tuft); }
    p.at(0, -1.2 * Math.abs(Math.sin(ph)) * (1 - c), 0, 1, function () { hedgehog(p, t, c, rot, ph, blink(t, 0.5, 0.05)); });
  }
});

/* 🦀 a crab scuttles sideways on four pairs of legs, the stalked eyes bobbing, one claw then the other snapping open and shut.
   Tap: both claws go up and snap in a rapid run, the eyes pop out on their stalks, and bubbles rise. */
function claw(p, open) {
  p.path('M-9 0 C-13 -10 -10 -19 -4 -21 L4 -21 C10 -19 13 -10 9 0 Z', { fill: 'red' });
  p.pivot(-3, -16, -open, 1, function () { p.path('M-10 -14 C-13 -24 -7 -34 0 -38 C1 -30 2 -22 0 -14 Z', { fill: 'red' }); });
  p.pivot(3, -16, open, 1, function () { p.path('M10 -14 C13 -24 7 -34 0 -38 C-1 -30 -2 -22 0 -14 Z', { fill: 'red' }); });
}
D.add('crab', {
  fam: 'nature', tags: ['sea', 'beach', 'claw', 'shell', 'sideways', 'seaside', 'crustacean', 'pinch', '🦀'], loop: 2.4, still: 0.1, tapLen: 1.7, burst: 'bubble', burstAt: [50, 30], burstN: 6, burstSpread: 3, margin: [14, 10, 4, 10],
  about: 'scuttles sideways on four pairs of legs, the eyes bobbing; one claw then the other snaps', tapAbout: 'both claws go up and snap rapidly, the eyes pop out on stalks, bubbles rise',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, x = 50 + (tap ? 0 : 11 * Math.sin(TAU * t)), vx = tap ? 0 : Math.cos(TAU * t), ph = TAU * 6 * t, up = tap ? sp(seg(q, 0, 0.2)) * (1 - ei(seg(q, 0.82, 1))) : 0, i;
    var snapL = tap ? 0.5 * (0.5 + 0.5 * Math.sin(TAU * 4 * q)) * up : 0.5 * blink(t, 0.1, 0.12), snapR = tap ? 0.5 * (0.5 + 0.5 * Math.sin(TAU * 4 * q + 1)) * up : 0.5 * blink(t, 0.5, 0.12), eyeUp = tap ? 6 * sp(seg(q, 0.05, 0.3)) * (1 - ei(seg(q, 0.85, 1))) : 0;
    p.path('M2 92 C30 90 70 91 98 92', { w: 0.6 });
    p.at(x - 50, 1.2 * Math.abs(Math.sin(ph)), 0, 1, function () {
      [-1, 1].forEach(function (sd) {
        for (i = 0; i < 4; i++) { var a = 3 * Math.sin(ph + i * 1.3 + (sd > 0 ? Math.PI : 0)); p.curve([[50 + sd * 20, 68 + i * 2], [50 + sd * (28 + i * 3), 62 + i * 3 + a * 0.4], [50 + sd * (34 + i * 3.5), 87 + a * 0.6]], { w: 1, cap: 'round' }); }
        var lead = sd < 0 ? snapL : snapR, arm = [[50 + sd * 25, 62], [50 + sd * (34 + 6 * up), 50 - 10 * up], [50 + sd * (35 + 8 * up), 34 - 10 * up]];
        tube(p, function (v) { v = v * 2; return v < 1 ? [lerp(arm[0][0], arm[1][0], v), lerp(arm[0][1], arm[1][1], v)] : [lerp(arm[1][0], arm[2][0], v - 1), lerp(arm[1][1], arm[2][1], v - 1)]; }, 8, 6, { fill: 'red' }, 1, 8);
        p.at(arm[2][0], arm[2][1] + 3, sd * (0.25 - 0.1 * up), [sd * 0.78, 0.78], function () { claw(p, lead); });
      });
      [-1, 1].forEach(function (sd) {
        var ey = 38 - eyeUp - 1.5 * Math.sin(ph * 0.5 + sd);
        p.line(50 + sd * 8, 52, 50 + sd * 8.5, ey + 4, { w: 1.2, cap: 'round' }); eye(p, 50 + sd * 8.5, ey, 5, 0.1 * (1 - up), 'red', 0.5 * vx, 0.2);
      });
      p.ellipse(50, 62, 27, 17, { fill: 'red' });
      p.path('M30 58 C34 52 42 49 50 49', { ink: 'white', w: 0.6, detail: true, alpha: 0.8 }); [[38, 66], [50, 70], [62, 66], [44, 58], [58, 58]].forEach(function (c) { p.dot(c[0], c[1], 1.2, 'orange'); });
      p.path('M43 70 Q50 75 57 70', { w: 0.8, cap: 'round' });
    });
  }
});

/* 🐢 a sea turtle seen from above strokes its big front flippers back together in a quick power stroke and recovers slowly,
   the small hind flippers a beat behind, the head reaching out with each stroke, the shell pattern gliding; rings spread behind.
   Tap: it spins once round with the flippers whirling, and the water rings. */
function hexp(cx, cy, r) { var d = '', i; for (i = 0; i <= 6; i++) d += (i ? 'L' : 'M') + (cx + r * Math.cos(i * Math.PI / 3)).toFixed(1) + ' ' + (cy + r * Math.sin(i * Math.PI / 3)).toFixed(1); return d; }
D.add('turtle', {
  fam: 'nature', tags: ['sea', 'ocean', 'swim', 'slow', 'shell', 'reptile', 'reef', 'marine', '🐢'], loop: 2.4, still: 0.14, tapLen: 1.8, burst: false, margin: [10, 14, 10, 14],
  about: 'strokes its front flippers back together, recovers slowly; hind flippers a beat behind, the head reaching out with each stroke', tapAbout: 'spins once round with the flippers whirling, and the water rings',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, sp1 = function (u) { u = M.frac(u); return u < 0.35 ? M.ease(u / 0.35) : 1 - M.ease((u - 0.35) / 0.65); }, f1 = sp1(tap ? t * 4 : t * 2), f2 = sp1((tap ? t * 4 : t * 2) - 0.08);
    var SH = 'M50 24 C74 26 82 48 76 70 C70 86 30 86 24 70 C18 48 26 26 50 24 Z', rot = tap ? TAU * sp(seg(q, 0.05, 0.78)) : 0, bob = -2 * f1;
    if (!tap) [0, 1].forEach(function (i) { var u = seg(M.frac(t * 2 + i * 0.5 + 0.2), 0, 1); p.span(ring(50, 88 + 4 * u, 14 + 22 * u, 3 + 5 * u), ei(seg(u, 0.5, 1)), eo(seg(u, 0, 0.7)), { ink: 'sky', w: 0.5, detail: true }); });
    if (tap) [0.1, 0.28].forEach(function (a) { var u = seg(q, a, a + 0.5); if (u > 0 && u < 1) p.span(ring(50, 56, 20 + 28 * eo(u), 20 + 28 * eo(u)), ei(seg(u, 0.5, 1)), 1, { ink: 'sky', w: 0.6 }); });
    p.at(50, 54 + bob, rot, 1, function () {
      p.move(-50, -54);
      [-1, 1].forEach(function (sd) {
        p.at(50 + sd * 22, 78, sd * (1.25 - 0.5 * f2), [sd, 1], function () { p.path('M0 -3 C8 -5 16 -3 22 1 C16 5 8 6 0 4 Z', { fill: 'leaf' }); });
        p.at(50 + sd * 24, 42, sd * (-0.7 + 1.3 * f1), [sd, 1], function () { p.path('M0 -4 C14 -11 30 -9 42 0 C30 5 14 7 0 6 Z', { fill: 'leaf' }); p.path('M6 1 C16 -2 28 -2 36 0', { w: 0.35, detail: true }); });
      });
      p.path('M50 82 L50 90', { w: 1.2, cap: 'round' });
      tube(p, function (v) { return [50, lerp(30, 14 - 3 * f1, v)]; }, 10, 9, { fill: 'leaf' }, 1, 4); p.circle(50, 13 - 3 * f1, 8.5, { fill: 'leaf' });
      p.dot(46, 11 - 3 * f1, 1.6); p.dot(54, 11 - 3 * f1, 1.6); p.path('M47 17 Q50 19 53 17', { w: 0.6, detail: true });
      p.path(SH, { fill: 'green' });
      p.clip(SH, function () { [hexp(50, 46, 10), hexp(50, 68, 10), hexp(32, 57, 8), hexp(68, 57, 8), 'M50 30 L50 36 M50 78 L50 84', 'M26 46 L32 49 M74 46 L68 49'].forEach(function (d) { p.path(d, { w: 0.5, ink: 'mint', detail: true }); }); p.ellipse(40, 38, 6, 3, { fill: 'leaf', line: false, rot: -0.6, alpha: 0.7 }); });
      p.path(SH, { line: true, w: 1 });
    });
  }
});

/* 🐳 a whale rides the swell, the whole body undulating from the head to the flukes, the flipper paddling, a blink now and
   then, a spout lifted from the blowhole and let fall; the water slides across in front. Tap: it dives — nose down, tail
   sweeping up out of the water, the flukes the last thing to go under — and surfaces with a splash. */
D.add('whale', {
  fam: 'nature', tags: ['sea', 'ocean', 'spout', 'big', 'swim', 'mammal', 'marine', 'blue whale', '🐳', '🐋'], loop: 3.4, still: 0.2, tapLen: 2.2, tapRest: 0.45, burst: false, margin: [24, 10, 2, 14],
  about: 'rides the swell, the body undulating from head to flukes, the flipper paddling, a spout rising from the blowhole; the water slides across in front', tapAbout: 'dives nose down, the flukes sweeping up out of the water, and surfaces with a splash',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, d = tap ? bump(seg(q, 0.05, 0.9)) : 0, i, lid = blink(t, 0.55, 0.05);
    var f = function (v) { var b = bz([88, 60], [68, 66], [44, 62], [22, 46], v); return [b[0], b[1] + (7 + 5 * d) * v * v * Math.sin(TAU * (t - 0.4 * v))]; }, wd = function (v) { return 7 + 40 * Math.pow(Math.sin(Math.PI * (0.14 + 0.86 * v)), 1.0) * (1 - 0.7 * v); };
    var E = f(1), F = f(0.94), dx = E[0] - F[0], dy = E[1] - F[1], dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl, nx = -uy, ny = ux, tp = function (a, b) { return [E[0] + ux * a + nx * b, E[1] + uy * a + ny * b]; };
    var sprout = tap ? -1 : win(t, 0.12, 0.55);
    p.at(0, 9 * d, 0, 1, function () {
      p.pivot(56, 62, 0.8 * d, 1, function () {
        p.curve([tp(-1, 3), tp(5, 8), tp(11, 24), tp(8, 7), tp(9, 0), tp(8, -7), tp(11, -24), tp(5, -8), tp(-1, -3)], { close: true, fill: 'blue' });
        tube(p, f, wd, 0, { fill: 'blue' }, 1, 18);
        p.clip(function () { tube(p, f, wd, 0, { fill: 'blue' }, 1, 18); }, function () { tube(p, function (v) { var q2 = f(v); return [q2[0], q2[1] + 21]; }, 34, 34, { fill: 'white', line: false }, 0.75, 14); p.path('M60 70 L84 72 M54 74 L80 77 M50 66 L72 69', { w: 0.35, detail: true, ink: 'sky' }); });
        var pf = [[62, 74], [52 + 4 * Math.sin(TAU * t * 2), 90 + 2 * Math.sin(TAU * t * 2 + 1)]];
        tube(p, function (v) { return [lerp(pf[0][0], pf[1][0], v), lerp(pf[0][1], pf[1][1], v)]; }, 9, 3, { fill: 'blue' }, 1, 5);
        eye(p, 79, 55, 3.4, lid, 'blue', 0.3, 0.2); p.path('M91 66 Q84 73 72 70', { w: 0.8, cap: 'round' }); p.ellipse(76, 65, 3.4, 2, { fill: 'pink', line: false, alpha: 0.7 });
      });
    });
        if (sprout >= 0 || tap) {
      var su = tap ? 0 : sprout, rise = eo(seg(su, 0, 0.35)), fall = ei(seg(su, 0.5, 1));
      if (!tap && su >= 0) { [-1, 1].forEach(function (sd) { p.span('M70 46 C' + (70 + sd * 2) + ' 28 ' + (70 + sd * 12) + ' 18 ' + (70 + sd * 20) + ' 28', fall, rise, { ink: 'sky', w: 0.9 }); }); p.span('M70 46 C70 36 70 28 70 20', fall, rise, { ink: 'sky', w: 0.9 }); }
    }
    var wv = []; for (i = -2; i <= 27; i++) wv.push([i * 4, 78 + 2.5 * Math.sin(TAU * (i / 12.5 - t))]);
    p.curve(wv.concat([[108, 102], [-8, 102]]), { fill: 'sky', close: true, line: false }); p.curve(wv, { w: 0.9 });
    p.path('M10 88 C20 86 28 90 38 88 M60 94 C70 92 80 96 90 94', { w: 0.4, detail: true, ink: 'white' });
    if (tap) [0.3, 0.55].forEach(function (a) { var u = seg(q, a, a + 0.5); if (u > 0 && u < 1) p.span(ring(70, 80, 6 + 26 * eo(u), 2 + 5 * eo(u)), ei(seg(u, 0.5, 1)), 1, { ink: 'white', w: 0.7 }); });
  }
});

/* 🌿 a fern: three fronds uncurl together from a tight fiddlehead, the leaflets opening from the base outwards as the tip
   unrolls, then they roll back up, each frond a beat behind the one before. Tap: the fronds snap tight and spring open again. */
function frond(p, bx, by, L, th0, dir, U, fill) {
  var N = 36, pts = [[bx, by]], head = [th0], k, T = lerp(6.2, 0.5, U), x = bx, y = by, h, sc, i, a, j, Lp;
  for (k = 1; k <= N; k++) { var sN = k / N; h = th0 + dir * (0.28 * sN + T * sN * sN * sN); head.push(h); x += Math.cos(h) * L / N; y += Math.sin(h) * L / N; pts.push([x, y]); }
  for (i = 0; i < 15; i++) {
    var si = 0.16 + i * 0.054, ki = Math.round(si * N), c0 = pts[ki], hh = head[ki];
    sc = seg(U, si - 0.55, si - 0.1); Lp = 16 * Math.pow(1 - si * 0.85, 0.8) * L / 66;
    [-1, 1].forEach(function (sd) { var ang = hh + sd * (0.2 + 0.95 * sc); p.at(c0[0], c0[1], ang, sc > 0.02 ? Math.max(0.15, sc) : 0.15, function () { p.path('M0 0 C' + (Lp * 0.3) + ' -3.4 ' + (Lp * 0.8) + ' -3.4 ' + Lp + ' 0 C' + (Lp * 0.8) + ' 3.4 ' + (Lp * 0.3) + ' 3.4 0 0 Z', { fill: fill, w: 0.5 }); }); });
  }
  p.curve(pts.filter(function (q, n) { return n % 2 === 0 || n === N; }), { w: 1.2, ink: 'green', cap: 'round' });
}
D.add('fern', {
  fam: 'nature', tags: ['plant', 'forest', 'frond', 'green', 'fiddlehead', 'unfurl', 'growth', 'jungle', '🌿'], loop: 4, still: 0.5, tapLen: 1.7, tapRest: 0.2, burst: false, margin: [6, 10, 2, 10],
  about: 'three fronds uncurl from tight fiddleheads, the leaflets opening from the base out, then roll back up, each a beat behind the last', tapAbout: 'the fronds snap tight and spring open again',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, r = tap ? M.ease(seg(q, 0, 0.2)) * (1 - sp(seg(q, 0.3, 0.9))) : 0;
    [[38, 99, 62, -Math.PI / 2 - 0.5, -1, 0.12, 'mint'], [62, 99, 66, -Math.PI / 2 + 0.45, 1, 0.24, 'mint'], [50, 99, 86, -Math.PI / 2, 1, 0, 'leaf']].forEach(function (f) {
      var tt = M.frac(t - f[5]), U = M.ease(seg(tt, 0.05, 0.5)) * (1 - M.ease(seg(tt, 0.72, 0.95)));
      frond(p, f[0], f[1], f[2], f[3], f[4], tap ? U + (0.1 - U) * r : U, f[6]);
    });
    p.path('M16 98 C34 96 66 96 84 98', { w: 0.6 });
  }
});
/* a white farm duck (the ducks of the paddy in hongdam.net's egg story): orange bill and feet, a curled-up tail.
   It waddles. Tap: it quacks, bill wide, three sound lines. */
D.add('duck', {
  fam: 'nature', tags: ['duck', 'farm', 'quack', 'pekin', 'bird', 'paddy', 'waddle', 'เป็ด', '🦆'], loop: 1, still: 0.25, ratio: 1.1, burst: false, tapLen: 1.2, tapRest: 0.3, margin: [16, 22, 10, 14],
  about: 'a white farm duck waddles, rolling side to side, its curled tail wagging', tapAbout: 'it stretches its neck and quacks twice, bill wide, sound lines coming out',
  draw: function (p, t, s) {
    var G = 93, ph = TAU * t, go = 1, quack = 0, reach = 0, i;
    if (s.tap >= 0) { var q = s.tap; go = 1 - eo(seg(q, 0, 0.1)) * (1 - eo(seg(q, 0.88, 1))); quack = bump(seg(q, 0.15, 0.4)) + bump(seg(q, 0.48, 0.73)); reach = bump(seg(q, 0.08, 0.85)); }
    var roll = 0.1 * Math.sin(ph) * go, by = -1.5 * Math.abs(Math.sin(ph)) * go;
    p.ellipse(50, G + 0.5, 26, 2.6, { fill: 'smoke', line: false, alpha: 0.55 });
    [0, 0.5].forEach(function (o, k) {
      var u = M.frac(t + o), lift = (u > 0.5 ? 5 * bump((u - 0.5) * 2) : 0) * go, fx = (u < 0.5 ? lerp(5, -5, u * 2) : lerp(-5, 5, (u - 0.5) * 2)) * go, hx = 46 + (k ? -5 : 2);
      p.line(hx, 76 + by, hx + fx, G - 2 - lift, { ink: 'gold', w: 1.6, cap: 'round' });
      p.at(hx + fx, G - 2 - lift, lift > 1 ? 0.4 : 0, 1, function () { p.path('M-2 0 L9 -4 Q12 0 9 4 Z', { fill: 'gold', w: 0.6 }); });
    });
    p.pivot(46, 76, roll, 1, function () {
      p.move(0, by);
      p.pivot(22, 56, 0.15 * Math.sin(2 * ph) * go, 1, function () { p.path('M24 56 C16 52 13 45 16 40 C19 46 23 50 28 52 Z', { fill: 'white', w: 0.8 }); p.curve([[16, 40], [13, 38], [15, 35]], { w: 0.7 }); });
      p.path('M22 60 C20 47 33 42 48 43 C60 44 68 48 72 56 C76 66 70 76 58 79 C44 82 28 79 22 72 C19 68 19 63 22 60 Z', { fill: 'white' });
      p.path('M33 54 C43 49 56 51 61 59 C53 65 41 65 32 60 Z', { fill: 'white', w: 0.7 });
      if (!p.small) { p.curve([[38, 60], [46, 62], [55, 60]], { w: 0.4, detail: true }); p.curve([[40, 57], [47, 58], [54, 57]], { w: 0.4, detail: true }); }
      var hx = 74 + 4 * reach, hy = 27 - 3 * reach;
      p.path('M58 53 C60 44 ' + (hx - 9) + ' ' + (hy + 12) + ' ' + (hx - 7) + ' ' + (hy + 2) + ' L' + (hx + 4) + ' ' + (hy + 4) + ' C' + (hx + 1) + ' ' + (hy + 14) + ' 70 44 70 56 Z', { fill: 'white' });
      p.at(hx, hy, -0.1 * reach, 1, function () {
        p.ellipse(0, 0, 9, 8, { fill: 'white' });
        p.pivot(6, -0.5, -0.14 * quack, 1, function () { p.path('M6 -2.5 L18 -1 C19.5 0.6 18.6 2 17 2 L6 1.2 Z', { fill: 'gold', w: 0.7 }); });
        p.pivot(6, 1.5, 0.5 * quack, 1, function () { p.path('M6 1.2 L16.4 2.2 C17.2 3.6 16.2 4.6 14.6 4.4 L6 3.6 Z', { fill: 'gold', w: 0.6 }); });
        p.dot(2.5, -2.5, 1.6, 'black'); p.dot(3, -3, 0.55, 'white');
      });
      if (quack > 0.15) for (i = 0; i < 3; i++) p.draw('M' + (hx + 22 + i * 4) + ' ' + (hy - 6 - i * 2) + ' Q' + (hx + 26 + i * 5) + ' ' + (hy + 1) + ' ' + (hx + 22 + i * 4) + ' ' + (hy + 8 + i * 2), Math.min(1, quack * 1.3 - i * 0.15), { w: 0.8 });
    });
  }
});

/* one black swan feather: the vane in the ink colour (a page can set ink to gold), the quill and barbs knocked out
   in the paper colour, a little fluff at the base. It drifts and turns in the air. Tap: it spins. */
D.add('feather', {
  fam: 'nature', tags: ['feather', 'quill', 'swan', 'black swan', 'bird', 'light', 'float', 'hongdam', '🪶'], loop: 3, still: 0.2, ratio: 0.6, burst: false, tapLen: 1.2, tapRest: 0.5, margin: [16, 20, 16, 20],
  about: 'a single black swan feather drifts back and forth, turning a little, as if falling slowly', tapAbout: 'it spins round once and settles',
  draw: function (p, t, s) {
    var spin = s.tap >= 0 ? TAU * eo(s.tap) : 0, sway = 0.32 * W(t, 1), dx = 6 * W(t, 1, 0.25), dy = 2.5 * W(t, 2);
    p.pivot(30, 50, sway + spin, 1, function () {
      p.move(dx, dy);
      var S = function (v) { return bz([31, 94], [27, 62], [29, 30], [40, 6], v); }, L = [], R = [], v, a, b, d, wl, wr, i;
      for (i = 0; i <= 20; i++) {
        v = 0.12 + 0.88 * i / 20; a = S(Math.max(0, v - 0.02)); b = S(Math.min(1, v + 0.02)); d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        wl = 11 * Math.pow(Math.sin(Math.PI * Math.min(1, (v - 0.1) * 1.05)), 0.7); wr = 7.5 * Math.pow(Math.sin(Math.PI * Math.min(1, (v - 0.1) * 1.05)), 0.8);
        var m = S(v); L.push([m[0] - (b[1] - a[1]) / d * wl, m[1] + (b[0] - a[0]) / d * wl]); R.unshift([m[0] + (b[1] - a[1]) / d * wr, m[1] - (b[0] - a[0]) / d * wr]);
      }
      p.poly(L.concat(R), { fill: 'ink', w: 0.6 });
      var q = []; for (i = 0; i <= 16; i++) q.push(S(0.1 + 0.85 * i / 16));
      p.curve(q, { ink: 'bg', w: 0.8, wob: 0.3 });
      if (!p.small) [0.3, 0.42, 0.55, 0.68].forEach(function (u, k) { var m = S(u); p.line(m[0], m[1], m[0] - 8, m[1] + 3 - k, { ink: 'bg', w: 0.35 }); p.line(m[0], m[1], m[0] + 6, m[1] + 2.5 - k, { ink: 'bg', w: 0.35 }); });
      p.line(31, 94, 30.4, 84, { w: 1.3 });
      if (!p.small) { p.curve([[30.5, 86], [26, 83], [24, 86]], { w: 0.45 }); p.curve([[30.8, 84], [35, 81], [37, 84]], { w: 0.45 }); }
    });
  }
});
})(Dingbats);

/* Lanna: Chiang Mai and the north — lanterns, nagas, sticky rice, the things of the street. */
(function (D) {
'use strict';
var M = D.math, TAU = M.TAU;

/* points along a cubic, for spines of things that bend: nagas, trunks, tails */
function bez(a, b, c, d, n) {
  var o = [], i, u, v;
  for (i = 0; i <= n; i++) { u = i / n; v = 1 - u; o.push([v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0], v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1]]); }
  return o;
}
/* a closed ribbon along a spine, w(s) wide at s in 0..1, the far end rounded */
function tube(p, sp, w, o) {
  var n = sp.length, L = [], R = [], i, a, b, d, h, e, a0, k;
  for (i = 0; i < n; i++) {
    a = sp[Math.max(0, i - 1)]; b = sp[Math.min(n - 1, i + 1)]; d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; h = w(i / (n - 1)) / 2;
    L.push([sp[i][0] - (b[1] - a[1]) / d * h, sp[i][1] + (b[0] - a[0]) / d * h]); R.unshift([sp[i][0] + (b[1] - a[1]) / d * h, sp[i][1] - (b[0] - a[0]) / d * h]);
  }
  e = sp[n - 1]; h = w(1) / 2; a0 = Math.atan2(L[n - 1][1] - e[1], L[n - 1][0] - e[0]);
  for (k = 1; k < 6; k++) L.push([e[0] + Math.cos(a0 - Math.PI * k / 6) * h, e[1] + Math.sin(a0 - Math.PI * k / 6) * h]);
  return p.poly(L.concat(R), o);
}
/* a wavy line of points, the wave sliding along as ph runs 0 → 1 */
function sinew(x0, x1, y, amp, lam, ph) { var a = [], x; for (x = x0; x <= x1 + 0.1; x += 4) a.push([x, y + amp * Math.sin(TAU * ((x - x0) / lam - ph))]); return a; }
/* a flame, wide at its base (x, y), h tall, the tip pushed sideways by lean */
function flame(p, x, y, w, h, lean) {
  p.path('M' + (x - w) + ' ' + y + ' C' + (x - w) + ' ' + (y - h * 0.5) + ' ' + (x + lean * 0.5) + ' ' + (y - h * 0.62) + ' ' + (x + lean) + ' ' + (y - h) + ' C' + (x + w * 0.6 + lean * 0.4) + ' ' + (y - h * 0.62) + ' ' + (x + w) + ' ' + (y - h * 0.45) + ' ' + (x + w) + ' ' + y + ' Z', { fill: 'flame', w: 0.55 });
  p.path('M' + (x - w * 0.5) + ' ' + y + ' C' + (x - w * 0.5) + ' ' + (y - h * 0.3) + ' ' + (x + lean * 0.3) + ' ' + (y - h * 0.4) + ' ' + (x + lean * 0.5) + ' ' + (y - h * 0.55) + ' C' + (x + w * 0.4) + ' ' + (y - h * 0.38) + ' ' + (x + w * 0.5) + ' ' + (y - h * 0.25) + ' ' + (x + w * 0.5) + ' ' + y + ' Z', { fill: 'yellow', line: false });
}

/* khom loi, the Yi Peng sky lantern: rice-paper body on a bamboo hoop, a fuel cake burning in
   wires across the hoop. Bobs and sways on the warm air, the flame flickering inside.
   Tap: it lets go and sails up out of sight; the next one rises into its place. */
function lantern(p, t, x, y, k, glow) {
  var sway = 0.06 * M.wave(t, 1, 0.1), lag = 0.035 * M.wave(t, 1, 0.0);
  p.at(x, y, sway, k, function () {
    p.move(-50, -50);
    p.path('M31 74 C27 58 22 41 24 27 C26 15 38 9 50 9 C62 9 74 15 76 27 C78 41 73 58 69 74 C62 77 38 77 31 74 Z', { fill: 'cream' });
    /* the paper lit from inside: three pools of warmth, brightest at the fuel cake, ebbing up the paper */
    p.blob(50, 56, 19 + glow * 1.6, { fill: 'flame', line: false, alpha: 0.26, lumpy: 0.05, seed: 3, sy: 1.05 });
    p.blob(50, 62, 12 + glow * 1.2, { fill: 'flame', line: false, alpha: 0.45, lumpy: 0.06, seed: 5, sy: 1.15 });
    p.blob(50, 67, 6 + glow * 0.8, { fill: 'yellow', line: false, alpha: 0.9, lumpy: 0.05, seed: 9 });
    p.path('M40 10.5 C35.5 30 36 55 41.5 75', { w: 0.35, detail: true });
    p.path('M60 10.5 C64.5 30 64 55 58.5 75', { w: 0.35, detail: true });
    /* the hoop and the wires that hold the fuel cake; the cake hangs a little behind the sway */
    p.ellipse(50, 74.5, 19.5, 3.6, { w: 0.8 });
    p.pivot(50, 74.5, lag, 1, function () {
      p.line(31.5, 75, 47, 79, { w: 0.45 }); p.line(68.5, 75, 53, 79, { w: 0.45 });
      p.rect(46, 77.5, 8, 4, { fill: 'brown', w: 0.55, r: 1.2 });
      var f = 1 + 0.18 * M.wave(t, 3, 0.2) + 0.1 * M.wave(t, 7), lean = 3 * M.wave(t, 2, 0.4);
      p.path('M46.5 78 C46 72 49 70 ' + (50 + lean) + ' ' + (78 - 13 * f) + ' C51 70 54.5 72 53.5 78 Z', { fill: 'flame', w: 0.55 });
      p.path('M48.6 77.5 C48.6 75 50 74 ' + (50 + lean * 0.6) + ' ' + (77.5 - 6 * f) + ' C50.6 74 51.6 75 51.4 77.5 Z', { fill: 'yellow', line: false });
    });
  });
}
D.add('lantern', {
  fam: 'lanna', tags: ['khom loi', 'yi peng', 'loy krathong', 'festival', 'night', 'wish', 'light', 'release', 'โคมลอย'], loop: 3, still: 0.3, tapLen: 2.4, burst: 'ember', burstAt: [50, 80], burstN: 6, burstSpread: 1.4,
  margin: [40, 18, 22, 18], about: 'bobs on warm air, the flame flickering inside', tapAbout: 'lets go and sails up; the next one rises into its place',
  draw: function (p, t, s) {
    var bob = 3.2 * M.wave(t, 1, 0.35);
    if (s.tap < 0) { lantern(p, t, 50, 50 + bob, 1, M.wave(t, 3)); return; }
    var up = M.easeIn(M.seg(s.tap, 0, 0.75)), nxt = M.easeOut(M.seg(s.tap, 0.35, 1));
    if (up < 1) lantern(p, t, 50 + 8 * up, 50 + bob - 150 * up, 1 - 0.65 * up, 1);
    lantern(p, t, 50, 50 + bob + 130 * (1 - nxt), 1, M.wave(t, 3));
  }
});

/* กระทง krathong: a slice of banana trunk wrapped in folded banana leaf, flowers, a candle, three incense
   sticks. Rocks on the water with the candle guttering and the incense tips glowing. */
function krathong(p, t, dx, dy, rock) {
  p.at(50 + dx, 66 + dy, rock, 1, function () {
    p.move(-50, -66);
    var fl = 1 + 0.16 * M.wave(t, 3, 0.2) + 0.08 * M.wave(t, 5), lean = 2.2 * M.wave(t, 2, 0.4), i, x, y;
    [[44, 50, 29, 11], [54, 50, 51, 7], [60, 50, 74, 14]].forEach(function (q, j) {
      p.line(q[0], q[1], q[2], q[3], { ink: 'brown', w: 0.5 });
      p.dot(q[2], q[3], 1.7 + 0.5 * M.wave(t, 2, j * 0.3), 'flame');
    });
    p.path('M13 62 C15 86 85 86 87 62 Z', { fill: 'cream' });
    p.path('M20 70 C36 79 64 79 80 70', { w: 0.4, detail: true });
    p.path('M27 75 C40 83 60 83 73 75', { w: 0.35, detail: true });
    for (i = 0; i < (p.small ? 0 : 5); i++) {
      x = 25 + i * 12.5; y = 58 - 2.5 * Math.cos((x - 50) / 25);
      p.at(x, y, (x - 50) / 60, 1, function () { p.path('M-6 2 C-5 -6 -1 -14 0 -19 C1 -14 5 -6 6 2 Z', { fill: 'green', w: 0.7 }); });
    }
    p.rect(46.5, 36, 7, 17, { fill: 'cream', r: 1.6, w: 0.75 });
    p.path('M47.5 41 C47 45 47.5 47 47.8 48', { w: 0.35, detail: true });
    p.line(50, 36, 50, 33.5, { w: 0.5 });
    flame(p, 50, 34, 2.8, 11 * fl, lean);
    [[33, 55, 'orange'], [67, 55, 'gold']].forEach(function (q) {
      p.circle(q[0], q[1], 6.6, { fill: q[2], w: 0.8 });
      p.circle(q[0], q[1], 2.4, { fill: 'yellow', w: 0.4, detail: true });
      p.arc(q[0], q[1], 4.5, 0.4, 2.6, { w: 0.35, detail: true });
    });
    p.at(50, 58, 0, 1, function () {
      [-0.9, 0.9, -0.4, 0.4, 0].forEach(function (a) { p.at(0, 0, a, 1, function () { p.path('M0 0 C-5 -3 -5 -10 0 -14 C5 -10 5 -3 0 0 Z', { fill: a === 0 ? 'white' : 'pink', w: 0.7 }); }); });
    });
    for (i = 0; i < 7; i += p.small ? 2 : 1) {
      x = 18 + i * 10.7; y = 62 + 5.5 * (1 - Math.pow((x - 50) / 37, 2));
      p.at(x, y, (x - 50) / 55, 1, function () { p.path('M-6.5 0 C-5 -7 -1 -12 0 -15 C1 -12 5 -7 6.5 0 Z', { fill: 'leaf', w: 0.8 }); p.line(0, -1, 0, -11, { w: 0.35, detail: true }); });
    }
  });
}
D.add('krathong', {
  fam: 'lanna', tags: ['loy krathong', 'festival', 'river', 'float', 'candle', 'banana leaf', 'offering', 'november', 'กระทง'], loop: 3, still: 0.2, tapLen: 2.6, burst: 'petal', burstAt: [50, 62], burstN: 5, burstSpread: 3,
  margin: [22, 18, 14, 18], about: 'rocks on the water, the candle guttering, incense tips glowing', tapAbout: 'drifts off on the current; the next one floats in from the other side',
  draw: function (p, t, s) {
    var bob = 2.2 * M.wave(t, 1, 0.1), rock = 0.05 * M.wave(t, 1, 0.35);
    var out = s.tap < 0 ? 0 : M.easeIn(M.seg(s.tap, 0, 0.6)), inn = s.tap < 0 ? 1 : M.easeOut(M.seg(s.tap, 0.28, 1));
    if (out < 1) krathong(p, t, 125 * out, bob, rock + 0.07 * out);
    if (inn < 1) krathong(p, t, -125 * (1 - inn), bob, rock - 0.06 * (1 - inn));
    var w = sinew(0, 100, 77, 1.4, 25, t);
    p.poly(w.concat([[100, 94], [0, 94]]), { fill: 'sky', line: false, alpha: 0.42 });
    p.curve(w, { w: 0.8, ink: 'blue' });
    p.curve(sinew(8, 92, 86, 1.2, 28, 1 - t), { w: 0.5, ink: 'blue', detail: true });
  }
});

/* บัว lotus: petals in rows on a lily pad; the outer rows open first and the front ones last, the
   seed pod showing between, then it all closes again. Tap: it snaps open wide and a ring spreads. */
D.add('lotus', {
  fam: 'lanna', tags: ['lotus', 'flower', 'pond', 'bloom', 'open', 'temple', 'offering', 'water lily', 'บัว'], loop: 4, still: 0.5, tapLen: 1.8, burst: 'petal', burstAt: [50, 52], burstN: 6, burstSpread: 3,
  margin: [18, 18, 14, 18], about: 'opens and closes, the outer petals first, the seed pod showing', tapAbout: 'snaps open wide with a spring and a ring spreads on the water',
  draw: function (p, t, s) {
    var o = M.ease(M.clamp(0.5 + 0.8 * M.wave(t, 1, -0.25), 0, 1)), pop = 0;
    if (s.tap >= 0) pop = M.ease(M.seg(s.tap, 0, 0.18)) * (1 - M.ease(M.seg(s.tap, 0.7, 1)));
    var op = M.lerp(o, 1.18, pop);
    p.ellipse(50, 80, 44, 8, { fill: 'leaf' });
    p.path('M50 80 L92 77', { w: 0.45, detail: true });
    p.curve(sinew(4, 96, 87, 1.3, 30, t), { w: 0.55, ink: 'blue', detail: true });
    function petal(a, len, wid, fill, vein) {
      p.at(50, 76, a, 1, function () {
        p.path('M0 0 C' + (-wid) + ' ' + (-len * 0.25) + ' ' + (-wid * 0.9) + ' ' + (-len * 0.7) + ' 0 ' + (-len) + ' C' + (wid * 0.9) + ' ' + (-len * 0.7) + ' ' + wid + ' ' + (-len * 0.25) + ' 0 0 Z', { fill: fill, w: 0.85 });
        if (vein) p.path('M0 -4 C-1 ' + (-len * 0.4) + ' 0 ' + (-len * 0.7) + ' 0 ' + (-len * 0.82), { w: 0.35, detail: true });
      });
    }
    [-1, 1].forEach(function (d) { petal(d * (0.15 + 1.25 * op), 33, 9, 'pink', true); });
    [-1, 1].forEach(function (d) { petal(d * (0.08 + 0.78 * op), 40, 9.5, 'white', true); });
    if (op > 0.12) {
      var k = M.clamp(op, 0, 1);
      p.ellipse(50, 66 - 2 * k, 7 * k, 9 * k, { fill: 'yellow', w: 0.7 });
      p.ellipse(50, 61 - 2 * k, 5 * k, 2.6 * k, { fill: 'gold', w: 0.45 });
    }
    [-1, 1].forEach(function (d) { petal(d * (0.1 + 0.42 * op), 38, 8.5, 'pink', false); });
    if (s.tap >= 0) {
      var r = M.easeOut(M.seg(s.tap, 0.05, 0.9)); if (r > 0 && r < 1) p.ellipse(50, 84, 14 + 62 * r, 3 + 8 * r, { w: 0.6, ink: 'blue', over: false, alpha: 1 - r * 0.2 });
    }
  }
});

/* นาค naga: the serpent of the rivers, rearing out of its coils with a flaming crest. The wave runs
   down the body from the head, the crest breathing wider and narrower, the tongue flicking.
   Tap: it rears and flares, and a naga fireball rises off its tongue. */
D.add('naga', {
  fam: 'lanna', tags: ['naga', 'serpent', 'dragon', 'snake', 'mekong', 'fireball', 'temple stairs', 'guardian', 'river', 'นาค'], loop: 3, still: 0.2, tapLen: 2.2, burst: 'ember', burstAt: [92, 34], burstN: 6, burstSpread: 1.6,
  margin: [44, 18, 14, 18], about: 'the body undulates head to tail; the gold crest breathes; the tongue flicks', tapAbout: 'rears up, crest flared, and a fireball rises',
  draw: function (p, t, s) {
    var rise = s.tap >= 0 ? M.spring(M.seg(s.tap, 0, 0.35)) * (1 - M.easeIn(M.seg(s.tap, 0.7, 1))) : 0, i, n = 30, sp = [], u, hx = 70, hy = 42 - 17 * rise, W;
    for (i = 0; i <= n; i++) { u = i / n; sp.push([5 + 52 * u, 70 + 12 * Math.pow(1 - u, 0.7) * Math.sin(TAU * (1.4 * u + t))]); }
    sp = sp.concat(bez(sp[n], [sp[n][0] + 13, sp[n][1]], [hx - 8, hy + 16], [hx, hy], 14).slice(1));
    W = function (q) { return q < 0.6 ? 1.5 + 12 * M.ease(q / 0.6) : 13.5 - 4.5 * M.ease((q - 0.6) / 0.4); };
    for (i = 4; i < sp.length - 8; i += 5) {      /* the gold ridge along the back, behind the body */
      var a = sp[i - 1], b = sp[i + 1], d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = (b[1] - a[1]) / d, ny = -(b[0] - a[0]) / d, h = W(i / (sp.length - 1)) / 2, c = sp[i], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      p.at(c[0] + nx * h, c[1] + ny * h, ang, 1, function () { p.poly([[-2.6, 0], [0, -4.8], [2.6, 0]], { fill: 'gold', w: 0.6 }); });
    }
    tube(p, sp, W, { fill: 'green' });
    for (i = 3; i < sp.length - 10; i += 3) {
      a = sp[i - 1]; b = sp[i + 1]; d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; h = W(i / (sp.length - 1)) / 2 * 0.8; c = sp[i];
      p.line(c[0] - (b[1] - a[1]) / d * h, c[1] + (b[0] - a[0]) / d * h, c[0] + (b[1] - a[1]) / d * h, c[1] - (b[0] - a[0]) / d * h, { w: 0.35, detail: true, ink: 'night' });
    }
    var nod = -0.12 - 0.3 * rise + 0.05 * M.wave(t, 1, 0.3), flare = 0.55 + 0.25 * M.wave(t, 2, 0.1) + 0.7 * rise, open = 0.25 + 0.2 * M.wave(t, 2, 0.35) + 0.6 * rise;
    p.at(hx, hy, nod, 1, function () {
      for (i = 0; i < 5; i++) {            /* the crest: five flames fanned back off the skull, the front ones leading */
        p.at(-1, -7, 0.15 - i * (0.3 + 0.28 * flare) + 0.07 * M.wave(t, 2, 0.5 - i * 0.07), [1, [0.8, 1.0, 1.15, 1.0, 0.8][i]], function () {
          p.path('M0 0 C-4 -5 -3 -14 3 -21 C5 -13 8 -6 2 0 Z', { fill: 'gold', w: 0.75 });
          p.path('M0.5 -4 C0 -9 1 -13 3 -17', { w: 0.35, detail: true, ink: 'red' });
        });
      }
      p.at(3, 3, open * 0.55, 1, function () { p.path('M-1 -1 L21 -2 C27 -1 29 2 27 5 C20 9 8 9 0 6 Z', { fill: 'green', w: 0.85 }); });
      var tg = M.bump(M.seg(M.frac(t * 2 + 0.2), 0.1, 0.55)) + (rise > 0.1 ? rise : 0);
      if (tg > 0.05) p.draw('M22 4 C28 4 31 ' + (4 + 3 * M.wave(t, 4)) + ' ' + (36 * tg + 0) + ' 3', M.clamp(tg, 0, 1), { ink: 'rose', w: 0.7 });
      p.path('M-5 -4 C-5 -12 4 -14 12 -12 C20 -11 26 -9 30 -6 C32 -4 31 -1 28 -1 L14 1 L-1 2 Z', { fill: 'green', w: 0.95 });
      p.poly([[21, 0.6], [22.6, 5 + open * 3], [24.6, 0.4]], { fill: 'white', w: 0.5 });
      p.circle(11, -6.2, 3.2, { fill: 'white', w: 0.6 }); p.dot(11.8, -6, 1.5, 'ink');
      p.path('M7 -9.5 C9 -11 13 -11 15 -9.5', { w: 0.5, ink: 'gold' });
      p.dot(27, -4.4, 0.8, 'ink');
      p.path('M29 -3 C34 -9 39 -5 36 0', { w: 0.45, ink: 'gold' });
      p.path('M6 5 C4 9 5 12 8 14', { w: 0.55, ink: 'gold' }); p.path('M11 6 C10 10 11 13 14 15', { w: 0.55, ink: 'gold' });
    });
    if (s.tap >= 0) {                        /* the fireball: a glowing ball that leaves the mouth and climbs out of sight */
      var f = M.seg(s.tap, 0.2, 1), fx = 98 + 6 * f, fy = 32 - 100 * M.easeOut(f) + 6 * Math.sin(f * 14), fr = 5.5 * (1 - 0.4 * f);
      if (f > 0 && f < 1) { p.circle(fx, fy, fr * 1.7, { fill: 'flame', line: false, alpha: 0.35 }); p.circle(fx, fy, fr, { fill: 'flame', w: 0.7 }); p.circle(fx, fy, fr * 0.45, { fill: 'yellow', line: false }); }
    }
  }
});

/* ระฆัง the bodhi-leaf bell under a temple eave: a bronze bell, its clapper hung inside and a bodhi leaf
   on the clapper to catch the wind. The bell swings from the eave, the clapper after it, the leaf after that,
   and the lip rings where the clapper strikes. Tap: a gust leans on it and it swings wide and rings. */
function ring(p, x, y, dir, ph) {
  var head = M.easeOut(M.seg(ph, 0, 0.5)), tail = M.easeIn(M.seg(ph, 0.4, 1)), d = 'M' + x + ' ' + (y - 7) + ' C' + (x + dir * 6) + ' ' + (y - 4) + ' ' + (x + dir * 6) + ' ' + (y + 4) + ' ' + x + ' ' + (y + 7);
  p.span(d, tail, head, { w: 0.7, ink: 'a' });
  p.span('M' + (x + dir * 6) + ' ' + (y - 11) + ' C' + (x + dir * 13) + ' ' + (y - 6) + ' ' + (x + dir * 13) + ' ' + (y + 6) + ' ' + (x + dir * 6) + ' ' + (y + 11), M.easeIn(M.seg(ph, 0.5, 1)), M.easeOut(M.seg(ph, 0.1, 0.6)), { w: 0.6, ink: 'a' });
}
D.add('wind-chime', {
  fam: 'lanna', tags: ['rakang', 'bell', 'temple', 'eave', 'bodhi leaf', 'wind', 'chime', 'ring', 'ระฆัง'], loop: 2.4, still: 0.2, tapLen: 2, burst: 'note', burstAt: [50, 50], burstN: 4, burstSpread: 2.6,
  margin: [14, 24, 12, 24], about: 'the bell swings from the eave, the clapper after it, the leaf after that; the lip rings at each strike', tapAbout: 'a gust leans on it from the left; it swings wide and rings',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), e = s.tap < 0 ? 0 : M.easeOut(M.seg(tp, 0, 0.1)) * (1 - M.easeIn(M.seg(tp, 0.5, 1))), sw = Math.sin(TAU * 1.7 * tp);
    var a1 = 0.06 * M.wave(t, 1) - 0.3 * e * sw, a2 = 0.2 * M.wave(t, 1, -0.1) - 0.5 * e * Math.sin(TAU * 1.7 * tp - 0.8), a3 = 0.16 * M.wave(t, 2, -0.25) * (1 + 1.6 * e);
    p.rect(28, 1, 44, 6, { fill: 'wood', r: 2.5, w: 0.9 });
    p.pivot(50, 7, a1, 1, function () {
      p.line(50, 7, 50, 17, { w: 0.7 });
      p.pivot(50, 30, a2, 1, function () {
        p.line(50, 30, 50, 60, { w: 0.5 }); p.dot(50, 55, 2.6, 'brown');
        p.pivot(50, 60, a3, 1, function () {
          p.at(50, 60, 0, 0.82, function () {
            p.path('M0 3 C-5 -2 -13 2 -13 11 C-13 19 -6 25 -3 31 C-1.5 35 -1 39 0 46 C1 39 1.5 35 3 31 C6 25 13 19 13 11 C13 2 5 -2 0 3 Z', { fill: 'leaf', w: 1 });
            p.path('M0 3 L0 40', { w: 0.35, detail: true }); p.path('M0 14 C-4 15 -7 18 -9 22', { w: 0.3, detail: true }); p.path('M0 14 C4 15 7 18 9 22', { w: 0.3, detail: true });
          });
        });
      });
      p.path('M50 17 C57 17 60 23 60 31 C60 40 66 46 71 53 L29 53 C34 46 40 40 40 31 C40 23 43 17 50 17 Z', { fill: 'gold' });
      p.path('M33 47 C43 50 57 50 67 47', { w: 0.4, detail: true }); p.path('M41 27 C42 21 46 20 48 20', { w: 0.45, ink: 'white', detail: true });
      p.ellipse(50, 53, 21, 2.6, { fill: 'orange', w: 0.8 });
    });
    ring(p, 21, 44, -1, M.seg(M.frac(t - 0.37), 0, 0.3)); ring(p, 79, 44, 1, M.seg(M.frac(t - 0.87), 0, 0.3));
    if (s.tap >= 0) [34, 47, 60].forEach(function (y, i) {
      var d = 'M-8 ' + y + ' C6 ' + (y - 7) + ' 17 ' + (y + 8) + ' 30 ' + y + ' C34 ' + (y - 3) + ' 35 ' + (y + 3) + ' 31 ' + (y + 3);
      p.span(d, M.easeIn(M.seg(tp, i * 0.05 + 0.18, i * 0.05 + 0.5)), M.easeOut(M.seg(tp, i * 0.05, i * 0.05 + 0.32)), { w: 0.6, ink: 'sky' });
    });
  }
});

/* เจดีย์ a Lanna chedi: stepped base, a bell, a tall ringed spire under a hti of tiers with small bells.
   The bells tinkle one after another, left to right. Tap: a bird swoops in, lands on the hti and sets
   every bell ringing, then flies off. */
function bird(p, x, y, flap, tilt) {
  p.at(x, y, tilt, [-1, 1], function () {
    p.path('M-6 -5 L-15 -2 L-14 -6.5 Z', { fill: 'b', w: 0.6 });
    p.ellipse(0, -5, 6.4, 4.2, { fill: 'b', w: 0.8 });
    p.circle(6, -9.2, 3.2, { fill: 'b', w: 0.8 });
    p.poly([[8.6, -9.8], [12.4, -8.6], [8.8, -7.6]], { fill: 'gold', w: 0.5 });
    p.dot(6.8, -9.8, 0.9, 'ink');
    p.at(-1, -7, flap, 1, function () { p.path('M0 0 C-3 -9 -9 -11 -14 -8 C-9 -5 -4 -2 0 0 Z', { fill: 'orange', w: 0.7 }); });
  });
}
D.add('chedi', {
  fam: 'lanna', tags: ['chedi', 'stupa', 'temple', 'wat', 'doi suthep', 'gold', 'hti', 'bells', 'pagoda', 'เจดีย์'], loop: 2.4, still: 0.3, tapLen: 2.8, burst: 'spark', burstAt: [62, 28], burstN: 5, burstSpread: 2.2,
  margin: [24, 18, 6, 18], about: 'the bells under the hti tinkle one after another, sparks of sound at the tips', tapAbout: 'a bird swoops in, lands on the hti, sets the bells ringing and flies off',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), rat = s.tap < 0 ? 0 : M.bump(M.seg(tp, 0.3, 0.78)), i;
    p.rect(18, 87, 64, 7, { fill: 'gold', w: 0.9 }); p.rect(24, 81, 52, 6, { fill: 'gold' }); p.rect(30, 75, 40, 6, { fill: 'gold' });
    for (i = 0; i < 3; i++) p.line(26 + i * 24, 89.5, 26 + i * 24, 92, { w: 0.4, detail: true });
    p.path('M35 75 C31 64 37 55 44 52 L56 52 C63 55 69 64 65 75 Z', { fill: 'gold' });
    p.path('M37 67 C45 70 55 70 63 67', { w: 0.4, detail: true }); p.path('M42 59 C47 57 53 57 58 59', { w: 0.4, detail: true });
    p.rect(40, 47, 20, 5, { fill: 'gold', w: 0.8 });
    p.poly([[43.5, 47], [56.5, 47], [53, 30], [47, 30]], { fill: 'gold' });
    for (i = 0; i < 3; i++) p.line(44.6 + i * 0.8, 43.5 - i * 5, 55.4 - i * 0.8, 43.5 - i * 5, { w: 0.4, detail: true });
    p.path('M32 33.5 C38 26 62 26 68 33.5 Z', { fill: 'gold', w: 0.85 }); p.path('M38 27.5 C42 21 58 21 62 27.5 Z', { fill: 'gold', w: 0.85 }); p.path('M43.5 22 C46 16 54 16 56.5 22 Z', { fill: 'gold', w: 0.85 });
    p.line(50, 16.5, 50, 7, { w: 0.7 }); p.dot(50, 5.5, 2.2, 'gold');
    [[35, 33.5], [43, 33], [57, 33], [65, 33.5]].forEach(function (q, j) {
      var a = (0.3 + 0.45 * rat) * M.wave(t, 3, -q[0] / 140 + (j % 2) * 0.05);
      p.at(q[0], q[1], a, 1, function () { p.line(0, 0, 0, 2.4, { w: 0.45 }); p.path('M-1.6 2.4 C-2.8 2.4 -3.2 6 -4 7 L4 7 C3.2 6 2.8 2.4 1.6 2.4 Z', { fill: 'yellow', w: 0.6 }); p.dot(0, 8.3, 0.9, 'ink'); });
    });
    [[26, 30, 0.0], [74, 30, 0.5]].forEach(function (q) {
      var u = M.frac(t * 2 + q[2]), k = 3.5 * M.bump(M.seg(u, 0, 0.4));
      if (k > 0.2) { p.line(q[0] - k, q[1], q[0] + k, q[1], { w: 0.55, ink: 'a', cap: 'round' }); p.line(q[0], q[1] - k, q[0], q[1] + k, { w: 0.55, ink: 'a', cap: 'round' }); }
    });
    if (s.tap >= 0) {
      var arr = M.seg(tp, 0.03, 0.34), dep = M.seg(tp, 0.7, 0.98), bx, by, fl;
      if (arr > 0 && arr < 1) { var b = bez([128, -16], [104, -26], [80, 14], [61.5, 29.4], 12), k0 = Math.min(11, Math.floor(arr * 12)), f = arr * 12 - k0; bx = M.lerp(b[k0][0], b[k0 + 1][0], f); by = M.lerp(b[k0][1], b[k0 + 1][1], f); bird(p, bx, by + 9, -0.8 * (0.5 + 0.5 * Math.sin(TAU * 4 * arr)) - 0.1, -0.2 * (1 - arr)); }
      else if (dep <= 0 && arr >= 1) bird(p, 61.5, 29.4 - 1.4 * M.bump(M.seg(tp, 0.46, 0.54)), 0, 0);
      else if (dep > 0 && dep < 1) { var c = bez([61.5, 29.4], [52, 10], [10, -18], [-40, -22], 12), j0 = Math.min(11, Math.floor(dep * 12)), g = dep * 12 - j0; bx = M.lerp(c[j0][0], c[j0 + 1][0], g); by = M.lerp(c[j0][1], c[j0 + 1][1], g); bird(p, bx, by + 9, -0.8 * (0.5 + 0.5 * Math.sin(TAU * 4 * dep)) - 0.1, 0.1); }
    }
  }
});

/* ศาลพระภูมิ san phra phum, the spirit house: a little roofed shrine on its post, a garland of marigolds
   hung at each corner, incense smoking at its foot, a red drink set out. Smoke curls, garlands sway one
   after the other, the doorway flickers. Tap: an offering — the garlands swing, the doorway glows and rays leave it. */
D.add('spirit-house', {
  fam: 'lanna', tags: ['spirit house', 'san phra phum', 'shrine', 'offering', 'incense', 'garland', 'marigold', 'luck', 'ศาลพระภูมิ'], loop: 3, still: 0.25, tapLen: 2, burst: 'spark', burstAt: [50, 48], burstN: 6, burstSpread: 3,
  margin: [14, 18, 8, 18], about: 'incense smoke curls up, the marigold garlands sway, the doorway flickers', tapAbout: 'an offering: the garlands swing, the doorway glows gold and rays leave it',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), e = s.tap < 0 ? 0 : M.easeOut(M.seg(tp, 0, 0.15)) * (1 - M.easeIn(M.seg(tp, 0.55, 1))), i;
    p.rect(43, 64, 14, 26, { fill: 'stone', w: 0.9 }); p.rect(33, 88, 34, 6, { fill: 'stone', r: 1.5 }); p.line(46, 70, 46, 86, { w: 0.35, detail: true });
    p.rect(19, 56, 62, 8, { fill: 'cream', r: 1.5, w: 0.9 });
    p.rect(30, 34, 40, 22, { fill: 'cream', w: 0.9 }); p.line(30, 34, 30, 56, { w: 1.4 }); p.line(70, 34, 70, 56, { w: 1.4 });
    var gl = M.clamp(0.55 + 0.15 * M.wave(t, 3, 0.1) + 0.45 * e, 0, 1);
    p.rect(44, 40, 12, 16, { fill: 'night', w: 0.8 });
    p.rect(46.5, 43, 7, 13, { fill: 'yellow', line: false, alpha: gl });
    p.path('M14 41 C21 41 24 36 30 32 L50 18 L70 32 C76 36 79 41 86 41 C84 45 80 44 76 44 L24 44 C20 44 16 45 14 41 Z', { fill: 'red', w: 0.95 });
    p.path('M33 28 L50 9 L67 28 L62 30 L38 30 Z', { fill: 'red', w: 0.9 });
    p.path('M50 10 C50 5 52 2 57 0', { w: 0.9, ink: 'gold' }); p.path('M16 41 C24 42 32 36 38 32 M84 41 C76 42 68 36 62 32', { w: 0.45, ink: 'gold', detail: true });
    [30, 70].forEach(function (x, k) {
      var a = 0.1 * M.wave(t, 1, k * 0.12 - 0.1) + 0.4 * e * Math.sin(TAU * 2 * tp - k * 0.6);
      p.pivot(x, 44, a, 1, function () {
        p.line(x, 44, x, 64, { w: 0.4, ink: 'brown' });
        for (i = 0; i < 4; i++) p.circle(x, 49 + i * 4.4, 2.3, { fill: i % 2 ? 'orange' : 'gold', w: 0.5 });
        p.path('M' + x + ' 65 L' + (x - 2.4) + ' 72 L' + (x + 2.4) + ' 72 Z', { fill: 'pink', w: 0.5 });
      });
    });
    p.rect(6, 85, 14, 9, { fill: 'brown', r: 1.5, w: 0.8 });
    [9, 13, 17].forEach(function (x, j) { p.line(x, 85, x + (j - 1) * 1.8, 70, { w: 0.4, ink: 'brown' }); p.dot(x + (j - 1) * 1.8, 70, 1.1 + 0.4 * e, 'flame'); });
    for (i = 0; i < 2; i++) {
      var ph = M.frac(t + i * 0.5), x0 = 13 + (i ? 3 : -3);
      p.span('M' + x0 + ' 68 C' + (x0 - 7) + ' 60 ' + (x0 + 7) + ' 54 ' + x0 + ' 46 C' + (x0 - 6) + ' 38 ' + (x0 + 5) + ' 33 ' + (x0 + 1) + ' 25', M.easeIn(M.seg(ph, 0.35, 1)), M.easeOut(M.seg(ph, 0, 0.8)), { w: 0.55, ink: 'smoke' });
    }
    p.path('M79 94 L91 94 L89.5 83 L80.5 83 Z', { fill: 'red', w: 0.8 }); p.line(86, 83, 88, 77, { w: 0.5 });
    for (i = 0; i < 5; i++) {
      var r = M.easeOut(M.seg(tp, 0.1 + i * 0.03, 0.55)) * (1 - M.easeIn(M.seg(tp, 0.55, 0.85))), an = -0.5 * Math.PI + (i - 2) * 0.55;
      if (s.tap >= 0 && r > 0.02) p.line(50 + Math.cos(an) * 14, 48 + Math.sin(an) * 12, 50 + Math.cos(an) * (14 + 16 * r), 48 + Math.sin(an) * (12 + 14 * r), { w: 0.6, ink: 'a' });
    }
  }
});

/* ร่มบ่อสร้าง the Bo Sang umbrella: oiled paper over a bamboo frame, painted with flowers, alternate panels
   in two colours. It spins on its shaft, the panels sliding round the dome and the flowers turning
   with them. Tap: a hard flick spins it up and sends droplets off the rim, then it slows to rest. */
D.add('bo-sang', {
  fam: 'lanna', tags: ['bo sang', 'umbrella', 'parasol', 'paper', 'painted', 'handmade', 'craft', 'sankamphaeng', 'ร่ม', 'บ่อสร้าง'], loop: 3, still: 0.2, tapLen: 2.2, burst: 'drop', burstAt: [50, 58], burstN: 8, burstSpread: 3.1,
  margin: [14, 18, 6, 18], about: 'spins on its shaft, the painted panels sliding round the dome', tapAbout: 'a hard flick spins it up; droplets fly off the rim and it slows to rest',
  draw: function (p, t, s) {
    var N = 8, st = TAU / N, tp = Math.max(0, s.tap), spin = Math.PI * t + (s.tap < 0 ? 0 : TAU * 2 * M.ease(M.seg(tp, 0, 0.9))), tilt = 0.05 * M.wave(t, 1, 0.2) + (s.tap < 0 ? 0 : 0.1 * M.bump(M.seg(tp, 0, 0.7)));
    function pt(th, ph) { return [50 + 42 * Math.sin(th) * Math.cos(ph), 58 - 42 * Math.cos(th) + 9 * Math.sin(th) * Math.sin(ph)]; }
    function rib(ph) { var o = [], k; for (k = 0; k <= 8; k++) o.push(pt(k / 8 * Math.PI / 2, ph)); return o; }
    p.pivot(50, 70, tilt, 1, function () {
      p.line(50, 60, 50, 94, { w: 1.5, ink: 'brown' }); p.dot(50, 95, 2.2, 'brown');
      for (var k = 0; k < N; k++) {
        var a = ((spin + k * st + st) % TAU) - st, a0 = Math.max(a, 0), a1 = Math.min(a + st, Math.PI);
        if (a1 - a0 < 0.02) continue;
        var edge = [], j; for (j = 0; j <= 5; j++) edge.push(pt(Math.PI / 2, a0 + (a1 - a0) * j / 5));
        p.poly(rib(a0).concat(edge, rib(a1).reverse()), { fill: k % 2 ? 'b' : 'a', w: 0.6 });
        var m = (a0 + a1) / 2, q = pt(1.0, m), fx = Math.sin(m) * Math.min(1, (a1 - a0) / st);
        if (fx > 0.3) p.at(q[0], q[1], 0, [fx, 1], function () { for (j = 0; j < 5; j++) p.at(0, 0, j / 5 * TAU, 1, function () { p.circle(0, -3.6, 2.5, { fill: 'white', w: 0.4 }); }); p.dot(0, 0, 1.6, 'orange'); });
      }
      p.arc(50, 58, 42, 0, Math.PI, { ry: 9, w: 1 });
      p.circle(50, 15.5, 2.3, { fill: 'brown', w: 0.6 });
    });
  }
});

/* the street: wheels and road shared by the three rides */
function wheel(p, x, y, r, a) {
  p.circle(x, y, r, { fill: 'night', w: 0.9 }); p.circle(x, y, r * 0.52, { fill: 'smoke', w: 0.6 });
  p.at(x, y, a, 1, function () { for (var k = 0; k < 5; k++) p.at(0, 0, k * TAU / 5, 1, function () { p.line(0, 0, 0, -r * 0.5, { w: 0.4, detail: true }); }); });
  p.dot(x, y, r * 0.14, 'ink');
}
function road(p, y, t, sp, len) {
  for (var k = -1; k < Math.ceil(100 / sp) + 1; k++) { var x = k * sp - t * sp, a = Math.max(2, x), b = Math.min(98, x + len); if (b - a > 2) p.line(a, y, b, y, { w: 0.55 }); }
}
function puffs(p, t, x, y, n, k) {      /* exhaust: small clouds swelling and drifting back, one after another */
  for (var i = 0; i < n; i++) { var ph = M.frac(t + i / n), r = k * 5.5 * Math.pow(Math.sin(Math.PI * ph), 0.7); if (r > 0.6) p.circle(x - 16 * ph, y - 11 * ph, r, { fill: 'smoke', w: 0.6 }); }
}

/* รถตุ๊กตุ๊ก tuk-tuk: three wheels, a canopy, a bench behind the driver. Bounces down the road, the road
   dashes streaming back, exhaust puffing, a garland swinging from the canopy. Tap: beep, beep —
   it hops at each honk and the sound spreads from the front. */
D.add('tuk-tuk', {
  fam: 'lanna', tags: ['tuk tuk', 'taxi', 'ride', 'three wheels', 'street', 'honk', 'beep', 'transport', 'ตุ๊กตุ๊ก'], loop: 1.2, still: 0.3, tapLen: 1.2, burst: false,
  margin: [14, 34, 8, 18], about: 'bounces along, the road streaming back, exhaust puffing, a garland swinging', tapAbout: 'beep, beep: it hops at each honk and the sound spreads from the front',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), h1 = s.tap < 0 ? 0 : M.bump(M.seg(tp, 0.08, 0.34)), h2 = s.tap < 0 ? 0 : M.bump(M.seg(tp, 0.42, 0.68)), bob = 1.3 * M.wave(t, 2, 0.1) - 5 * (h1 + h2);
    road(p, 93, t, 25, 11);
    puffs(p, t, 8, 70, 3, 1);
    p.pivot(28, 90, 0.015 * M.wave(t, 2, 0.35), 1, function () {
      p.move(0, bob);
      p.path('M12 76 L12 60 C12 57 14 55 17 55 L60 55 C63 55 65 53 68 52 L76 50 C84 52 90 60 92 70 C93 74 91 76 88 76 Z', { fill: 'b' });
      p.line(14, 71, 90, 71, { w: 0.4, detail: true, ink: 'white' });
      p.rect(11, 61, 3, 5, { fill: 'red', w: 0.5 });
      p.rect(16, 45, 4, 11, { fill: 'brown', w: 0.6 }); p.rect(17, 55, 24, 6, { fill: 'brown', w: 0.7 }); p.rect(50, 56, 15, 5, { fill: 'brown', w: 0.7 });
      p.line(15, 34, 15, 55, { w: 1.1 }); p.line(42, 34, 42, 54, { w: 1.1 });
      p.poly([[63, 33], [69, 33], [76, 50], [69, 52]], { fill: 'sky', w: 0.9, alpha: 0.75 });
      p.line(72, 51, 79, 43, { w: 1.2 }); p.dot(79, 43, 1.6, 'ink');
      p.circle(90, 64, 3.6, { fill: 'yellow', w: 0.7 });
      p.pivot(48, 34, 0.18 * M.wave(t, 2, 0.0), 1, function () {
        p.line(48, 34, 48, 44, { w: 0.4, ink: 'brown' });
        p.circle(48, 40, 1.7, { fill: 'orange', w: 0.4 }); p.circle(48, 44, 1.7, { fill: 'gold', w: 0.4 }); p.path('M48 46 L45.8 52 L50.2 52 Z', { fill: 'pink', w: 0.45 });
      });
      p.path('M10 36 C10 27 18 23 34 23 L58 23 C68 23 75 28 79 36 Z', { fill: 'a', w: 0.95 });
      p.path('M14 32 C30 29 56 29 72 32', { w: 0.4, detail: true, ink: 'white' });
    });
    wheel(p, 28, 78, 11, TAU / 5 * 2 * t); wheel(p, 83, 79, 10, TAU / 5 * 2 * t);
    if (h1 > 0.02) { ring(p, 94, 54, 1, M.seg(tp, 0.08, 0.4)); ring(p, 101, 54, 1, M.seg(tp, 0.12, 0.44)); } if (h2 > 0.02) { ring(p, 94, 54, 1, M.seg(tp, 0.42, 0.74)); ring(p, 101, 54, 1, M.seg(tp, 0.46, 0.78)); }
  }
});

/* รถแดง songthaew, the red pickup with two benches under a roof, how Chiang Mai gets about. The ride
   bumps along, the passengers' heads bobbing a beat behind the body. Tap: the roof is knocked twice for a
   stop, bells ding, and it brakes — the nose dips, the heads lurch forward, dust rolls off the tyres. */
D.add('songthaew', {
  fam: 'lanna', tags: ['songthaew', 'rot daeng', 'red truck', 'pickup', 'bus', 'shared taxi', 'ride', 'chiang mai', 'รถแดง', 'สองแถว'], loop: 1.6, still: 0.3, tapLen: 1.8, burst: false,
  margin: [18, 18, 8, 18], about: 'bumps along, the heads of the passengers bobbing a beat behind the body', tapAbout: 'a knock for the stop: it dings, brakes, the heads lurch forward and dust rolls off',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), brake = s.tap < 0 ? 0 : M.ease(M.seg(tp, 0.1, 0.35)) * (1 - M.ease(M.seg(tp, 0.55, 0.9))), bob = 1.4 * M.wave(t, 2, 0.1), i;
    road(p, 93, t, 25, 11);
    puffs(p, t, 6, 72, 3, 0.9);
    p.pivot(76, 90, 0.06 * brake, 1, function () {
      p.move(0, bob);
      [[19, 0.1], [32, 0.17], [45, 0.24]].forEach(function (q, j) {
        var dy = 1.7 * M.wave(t, 2, q[1]), dx = 4 * brake;
        p.at(q[0] + dx, 47 + dy - 2 * brake * (j % 2), 0.2 * brake, 1, function () {
          p.circle(0, 0, 4.7, { fill: 'skin', w: 0.8 }); p.path('M-4.7 -0.5 C-5 -5.5 -1 -6.2 1 -6 C4 -6 5 -3 4.7 -0.5 C2 -3 -2 -3 -4.7 -0.5 Z', { fill: 'night', w: 0.5 });
          p.dot(1.4, 0.8, 0.7, 'ink'); p.dot(-2.2, 0.8, 0.7, 'ink');
        });
      });
      p.rect(6, 56, 50, 20, { fill: 'red' });
      p.path('M54 76 L54 54 C54 50 58 47 62 44 L67 38 C69 36 72 35 75 35 L82 35 C86 36 88 40 90 46 L93 56 C95 58 96 62 96 66 L96 76 Z', { fill: 'red' });
      p.path('M62 46 L67 39.5 C69 38 72 38 75 38 L81 38 C84 39 85 42 87 47 Z', { fill: 'sky', w: 0.8 });
      p.line(7, 63, 55, 63, { w: 0.4, detail: true, ink: 'cream' });
      p.circle(95, 62, 3, { fill: 'yellow', w: 0.7 }); p.rect(93, 72, 6, 4, { fill: 'grey', w: 0.6 });
      p.line(8, 36, 8, 56, { w: 1.1 }); p.line(31, 36, 31, 56, { w: 1.1 }); p.line(54, 36, 54, 56, { w: 1.1 });
      p.path('M3 36 L6 28 L56 28 L59 36 Z', { fill: 'cream', w: 0.95 }); p.line(7, 32, 55, 32, { w: 0.4, detail: true, ink: 'red' });
    });
    wheel(p, 24, 79, 10.5, TAU / 5 * 2 * t); wheel(p, 76, 79, 10.5, TAU / 5 * 2 * t);
    if (s.tap >= 0) {
      for (i = 0; i < 3; i++) { var k = 4.5 * M.bump(M.seg(tp, 0.02 + i * 0.07, 0.3 + i * 0.07)); if (k > 0.3) { var x = [18, 31, 44][i], y = 20 - (i % 2) * 4; p.line(x - k, y, x + k, y, { w: 0.6, ink: 'a', cap: 'round' }); p.line(x, y - k, x, y + k, { w: 0.6, ink: 'a', cap: 'round' }); } }
      [24, 76].forEach(function (x, j) { var u = M.seg(tp, 0.2 + j * 0.03, 0.85); if (u > 0 && u < 1) p.circle(x - 6 - 18 * u, 88 - 6 * u, 6 * Math.pow(Math.sin(Math.PI * u), 0.7), { fill: 'smoke', w: 0.6 }); });
    }
  }
});

/* สกูตเตอร์ a Chiang Mai scooter, a bag of rambutans swinging from the hook. It hums along, the wheels
   turning, the road streaming back, the bag swinging a beat behind. Tap: a wheelie — the front wheel
   lifts, speed lines stream off the back, it comes down with a bounce. */
D.add('scooter', {
  fam: 'lanna', tags: ['scooter', 'motorbike', 'moped', 'wheelie', 'street', 'rambutan', 'ride', 'ride', 'มอเตอร์ไซค์'], loop: 1.2, still: 0.3, tapLen: 1.6, burst: false,
  margin: [14, 18, 8, 24], about: 'hums along, wheels turning, the bag of rambutans swinging behind the bike', tapAbout: 'a wheelie: the front lifts, speed lines stream back, it lands with a bounce',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), up = s.tap < 0 ? 0 : M.spring(M.seg(tp, 0, 0.3)) * (1 - M.ease(M.seg(tp, 0.55, 0.8))), land = s.tap < 0 ? 0 : M.bump(M.seg(tp, 0.78, 0.98)), bob = 1.1 * M.wave(t, 2, 0.1) + 2 * land;
    road(p, 93, t, 25, 11);
    puffs(p, t, 6, 70, 3, 0.9);
    if (s.tap >= 0) [52, 62, 72].forEach(function (y, i) { p.span('M-12 ' + y + ' L22 ' + y, M.easeIn(M.seg(tp, 0.12 + i * 0.05, 0.6)), M.easeOut(M.seg(tp, 0.04 + i * 0.05, 0.4)), { w: 0.6, ink: 'sky' }); });
    p.pivot(25, 90, -0.4 * up, 1, function () {
      wheel(p, 25, 79, 10, TAU / 5 * 2 * t); wheel(p, 80, 79 - bob, 10, TAU / 5 * 2 * t);
      p.move(0, bob);
      p.line(77, 40, 80, 78 - bob, { w: 1.4 });
      p.path('M70 78 C70 68 90 68 90 78', { fill: 'c', w: 0.9 });
      p.path('M8 54 C8 47 16 44 26 44 L42 44 C47 44 50 47 52 52 L56 62 C57 66 60 68 64 68 L66 68 C66 56 68 44 72 36 L82 33 C84 44 84 60 81 70 C79 74 72 74 66 72 L52 72 L22 72 C14 72 8 66 8 54 Z', { fill: 'c' });
      p.path('M12 45 C12 38 20 37 28 38 L44 39 C49 40 51 43 50 46 Z', { fill: 'brown', w: 0.9 });
      p.path('M60 70 L72 70', { w: 0.4, detail: true, ink: 'white' }); p.path('M15 60 C20 66 34 67 44 63', { w: 0.4, detail: true, ink: 'white' });
      p.line(73, 35, 71, 24, { w: 1.2 }); p.line(65, 22, 79, 22, { w: 1.5 }); p.circle(66, 17.5, 2.6, { fill: 'grey', w: 0.6 });
      p.path('M72 38 C71 31 76 27 83 28 C88 30 90 35 87 38 Z', { fill: 'c', w: 0.9 }); p.circle(86, 33.5, 3, { fill: 'yellow', w: 0.7 });
      p.rect(6, 54, 3, 7, { fill: 'red', w: 0.5 });
      p.pivot(72, 50, 0.22 * M.wave(t, 2, -0.1) + 0.1 * up, 0.8, function () {
        p.line(72, 48, 72, 53, { w: 0.5 });
        p.path('M72 53 C64 56 63 68 68 73 C72 76 79 74 80 66 C81 59 77 54 72 53 Z', { fill: 'white', w: 0.9 });
        p.circle(68, 64, 3.6, { fill: 'red', w: 0.6 }); p.circle(74, 68, 3.6, { fill: 'red', w: 0.6 }); p.circle(74, 60, 3.2, { fill: 'rose', w: 0.6 });
      });
    });
  }
});

/* ช้าง an elephant in profile: ears flapping, the trunk swinging like a pendulum, the tail after it.
   Tap: the trunk rises and trumpets, the ears flare, and a fountain of water sprays from the tip. */
D.add('elephant', {
  fam: 'lanna', tags: ['elephant', 'chang', 'sanctuary', 'trunk', 'trumpet', 'water', 'animal', 'chiang mai', 'ช้าง'], loop: 2.4, still: 0.2, tapLen: 2.2, burst: 'drop', burstAt: [96, 6], burstN: 6, burstSpread: 2.2,
  margin: [26, 18, 8, 14], about: 'the trunk swings, the ears flap, the tail follows', tapAbout: 'trunk up, ears flared, a trumpet and a fountain of water',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), lift = s.tap < 0 ? 0 : M.spring(M.seg(tp, 0, 0.28)) * (1 - M.ease(M.seg(tp, 0.72, 1))), s1 = M.wave(t, 1), s2 = M.wave(t, 1, -0.1), s3 = M.wave(t, 1, -0.2), i;
    var tr = bez([86, 46], [M.lerp(91 + 4 * s1, 101, lift), M.lerp(58, 40, lift)], [M.lerp(92 + 8 * s2, 106, lift), M.lerp(72, 22, lift)], [M.lerp(91 + 13 * s3, 99, lift), M.lerp(82 - 3 * s1, 5, lift)], 14);
    p.push(); p.move(-4, 0);
    p.at(0, 0, 0, 1, function () { p.path('M26 60 L39 60 L38 84 C38 88 37 89 37 89 L28 89 C27 89 27 86 27 84 Z', { fill: 'stone', w: 0.9 }); p.path('M47 60 L60 60 L59 84 C59 88 58 89 58 89 L49 89 C48 89 48 86 48 84 Z', { fill: 'stone', w: 0.9 }); });
    p.pivot(13, 46, 0.2 * M.wave(t, 2, 0.25) + 0.1 * lift, 1, function () { p.path('M13 46 C6 52 5 62 8 72', { w: 0.9 }); p.path('M8 72 C5 74 5 79 8 80 C11 79 11 75 8 72 Z', { fill: 'smoke', w: 0.6 }); });
    p.path('M12 52 C10 38 22 30 38 30 C48 30 56 29 62 28 L78 30 C80 40 80 56 72 66 C62 74 40 76 28 72 C18 70 13 62 12 52 Z', { fill: 'grey' });
    p.path('M16 56 L30 56 L29 84 C29 88 28 89 28 89 L19 89 C18 89 18 86 18 84 Z', { fill: 'grey', w: 0.95 }); p.path('M56 58 L70 58 L69 84 C69 88 68 89 68 89 L59 89 C58 89 58 86 58 84 Z', { fill: 'grey', w: 0.95 });
    [[19, 87], [59, 87]].forEach(function (q) { for (i = 0; i < 3; i++) p.line(q[0] + 1.5 + i * 3, q[1], q[0] + 1.5 + i * 3, q[1] + 2.4, { w: 0.4, detail: true }); });
    p.path('M20 70 C24 66 28 66 30 70', { w: 0.35, detail: true });
    p.pivot(66, 34, 0.04 + 0.16 * M.wave(t, 2, 0.1) + 0.3 * lift * M.wave(tp, 4), [1 - 0.08 * M.wave(t, 2, 0.1), 1], function () {
      p.path('M66 26 C54 20 40 30 42 46 C43 58 55 64 63 58 C67 50 68 38 66 26 Z', { fill: 'smoke', w: 0.95 }); p.path('M62 32 C52 30 48 40 50 48 C52 54 58 55 60 52', { w: 0.4, detail: true, ink: 'pink' });
    });
    p.pivot(66, 52, -0.1 * lift, 1, function () {
      tube(p, tr, function (q) { return 13 - 8 * q; }, { fill: 'grey', w: 0.95 });
      p.path('M58 34 C58 22 66 16 76 16 C86 16 91 24 91 34 C91 44 88 52 86 56 C80 58 70 58 64 54 C60 48 58 42 58 34 Z', { fill: 'grey', w: 1 });
      p.path('M82 50 C85 58 92 58 96 53 C93 56 87 56 84 49 Z', { fill: 'white', w: 0.6 });
      p.dot(80, 33, 1.7, 'ink'); p.path('M76 29 C78 27.5 82 28 84 30', { w: 0.45 });
    });
    p.pop();
    if (s.tap >= 0) for (i = 0; i < 5; i++) {
      var vx = [-30, -15, 0, 14, 28][i], vy = [58, 72, 80, 72, 58][i], pts = [], k;
      for (k = 0; k <= 10; k++) { var tt = k / 10 * 1.0; pts.push([95 + vx * tt, 4 - vy * tt + 90 * tt * tt]); }
      p.span(pts, M.easeIn(M.seg(tp, 0.4 + i * 0.03, 0.9)), M.easeOut(M.seg(tp, 0.2 + i * 0.03, 0.6)), { w: 0.8, ink: 'sky' });
    }
  }
});

/* a ribbon of steam or smoke at (x, y), h tall, drawn up and taken back; ph runs 0 → 1 */
function wisp(p, x, y, h, ph, o) {
  var d = 'M' + x + ' ' + y + ' C' + (x - 5) + ' ' + (y - h * 0.28) + ' ' + (x + 5) + ' ' + (y - h * 0.4) + ' ' + x + ' ' + (y - h * 0.55) + ' C' + (x - 5) + ' ' + (y - h * 0.7) + ' ' + (x + 4) + ' ' + (y - h * 0.85) + ' ' + (x + 1) + ' ' + (y - h);
  p.span(d, M.easeIn(M.seg(ph, 0.25, 1)), M.easeOut(M.seg(ph, 0, 0.75)), o || { w: 0.75, alpha: 0.9 });
}

/* กระติบข้าว kratip, the woven bamboo basket that keeps sticky rice warm: a lid, a woven body, a loop of cord.
   Steam leaks from under the lid in three ribbons and the lid rattles on it. Tap: the lid pops up and tilts
   off, showing the white rice and a heavy plume of steam, grains jumping, then drops back with a clink. */
D.add('kratip', {
  fam: 'lanna', tags: ['kratip', 'sticky rice', 'khao niao', 'basket', 'bamboo', 'woven', 'steam', 'lunch', 'northern', 'กระติบ', 'ข้าวเหนียว'], loop: 2.4, still: 0.3, tapLen: 1.8, burst: false,
  margin: [34, 18, 8, 18], about: 'steam leaks from under the lid in three ribbons; the lid rattles on it', tapAbout: 'the lid pops up and tilts off, rice and a plume of steam, grains jump, the lid drops back with a clink',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), op = s.tap < 0 ? 0 : M.spring(M.seg(tp, 0, 0.3)) * (1 - M.ease(M.seg(tp, 0.62, 0.84))), clink = s.tap < 0 ? 0 : M.bump(M.seg(tp, 0.82, 0.96)), rat = 0.8 * (0.5 + 0.5 * M.wave(t, 3)), i;
    p.pivot(50, 92, 0, [1 + 0.04 * clink, 1 - 0.06 * clink], function () {
      p.path('M29 46 C27 60 28 78 33 89 C40 93 60 93 67 89 C72 78 73 60 71 46 Z', { fill: 'wood', hatch: 'x' });
      p.path('M28.5 60 C40 64 60 64 71.5 60', { w: 0.8, ink: 'brown' }); p.path('M30 76 C41 80 59 80 70 76', { w: 0.8, ink: 'brown' });
      p.ellipse(50, 46, 21, 3.4, { fill: 'white', w: 0.8 });
      p.path('M31 46 C30 36 40 31 50 31 C60 31 70 36 69 46 C60 49 40 49 31 46 Z', { fill: 'white', w: 0.8 });
      for (i = 0; i < 9; i++) p.path('M' + (36 + (i % 5) * 7 + (i > 4 ? 3 : 0)) + ' ' + (38 + (i > 4 ? 5 : 0)) + ' l2 1.4', { w: 0.35, detail: true });
      p.pivot(70, 46, -1.0 * op, 1, function () {
        p.move(0, -26 * op - rat * (1 - Math.min(1, op)));
        p.path('M26 46 L26 38 C26 30 36 26 50 26 C64 26 74 30 74 38 L74 46 Z', { fill: 'wood', hatch: 'x' });
        p.path('M26 41 C40 44 60 44 74 41', { w: 0.8, ink: 'brown' });
        p.circle(50, 25, 3, { fill: 'brown', w: 0.8 });
        p.pivot(50, 24, 0.12 * M.wave(t, 1, 0.1), 1, function () { p.path('M50 22 C42 6 58 6 50 22', { w: 0.8, ink: 'red' }); });
      });
    });
    [[38, 0.0], [50, 0.42], [62, 0.2]].forEach(function (q) { wisp(p, q[0], 24 + 7 * Math.min(1, op), 30 + 10 * Math.min(1, op), M.frac(t + q[1]), { w: 0.75, alpha: 0.9 }); });
    if (op > 0.05) [[44, 0.15], [56, 0.6]].forEach(function (q) { wisp(p, q[0], 30, 44 * Math.min(1, op), M.frac(t * 2 + q[1]), { w: 0.9, alpha: 0.95 }); });
    if (op > 0.1) for (i = 0; i < 6; i++) {
      var g = M.seg(tp, 0.08 + i * 0.03, 0.62), x = 50 + (i - 2.5) * 9 * g, y = 36 - [44, 58, 50, 62, 48, 56][i] * g + 120 * g * g;
      if (g > 0 && g < 0.95) p.at(x, y, i + g * 4, 1, function () { p.ellipse(0, 0, 3, 1.6, { fill: 'white', w: 0.5 }); });
    }
  }
});

/* ข้าวซอย khao soi, the northern curry noodle bowl: egg noodles in coconut curry, a nest of crisp fried
   noodles on top, a drumstick, a wedge of lime, pickled greens. The steam rises in three ribbons and the
   crisp noodles shiver. Tap: the lime wedge hops over the bowl, squeezes, and three drops fall in. */
D.add('khao-soi', {
  fam: 'lanna', tags: ['khao soi', 'noodles', 'curry', 'bowl', 'lime', 'chiang mai', 'northern', 'lunch', 'ข้าวซอย'], loop: 2.4, still: 0.3, tapLen: 2, burst: false,
  margin: [34, 18, 6, 18], about: 'the steam rises in three ribbons, the crisp noodles shiver', tapAbout: 'the lime wedge hops over the bowl, squeezes, and three drops fall into the curry',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), hop = s.tap < 0 ? 0 : M.bump(M.seg(tp, 0.05, 0.78)), sq = s.tap < 0 ? 0 : M.bump(M.seg(tp, 0.36, 0.5)), i, sh = function (k) { return 1.3 * M.wave(t, 2, k); };
    p.path('M10 50 C12 76 30 90 50 90 C70 90 88 76 90 50 Z', { fill: 'white' });
    p.path('M38 90 L40 95 L60 95 L62 90', { fill: 'white', w: 0.9 });
    p.path('M12.5 62 C30 72 70 72 87.5 62', { w: 0.9, ink: 'blue' });
    for (i = 0; i < 7; i++) p.circle(22 + i * 9.4, 70 + 4.2 * Math.sin((i / 6) * Math.PI) * 0.9 + (i === 0 || i === 6 ? -2.5 : 0), 1.3, { fill: 'blue', line: false });
    p.ellipse(50, 50, 40, 8, { fill: 'cream', w: 0.9 }); p.ellipse(50, 50.5, 36.5, 6.2, { fill: 'orange', w: 0.5 });
    p.path('M28 46 C32 52 40 54 46 52', { w: 0.35, detail: true, ink: 'red' }); p.path('M58 53 C64 54 70 52 74 49', { w: 0.35, detail: true, ink: 'red' });
    p.blob(50, 40, 21, { fill: 'sand', lumpy: 0.1, seed: 4, sy: 0.72 });
    [['M32 42 C37 32 44 47 50 36 S62 46 69 38', 0], ['M34 36 C40 30 46 40 52 31 S63 38 68 32', 0.2], ['M30 46 C38 40 45 50 52 42 S64 48 71 44', 0.45], ['M40 30 C44 26 48 33 54 28 S60 31 63 28', 0.7]].forEach(function (q) {
      var pts = [], k, d = q[0].match(/-?\d+(\.\d+)?/g).map(Number);
      p.path('M' + (d[0] + sh(q[1])) + ' ' + d[1] + ' C' + (d[2] + sh(q[1] + 0.1)) + ' ' + d[3] + ' ' + (d[4] - sh(q[1])) + ' ' + d[5] + ' ' + d[6] + ' ' + d[7] + ' S' + d[8] + ' ' + (d[9] + sh(q[1] + 0.2)) + ' ' + d[10] + ' ' + d[11], { w: 0.65, ink: 'brown' });
    });
    p.path('M20 49 C17 41 24 37 30 41 C34 45 30 51 24 51 Z', { fill: 'brown', w: 0.9 }); p.line(21, 50, 12, 55, { w: 1.2, ink: 'ink' }); p.circle(11, 56, 2.2, { fill: 'white', w: 0.7 });
    [[48, 30, 0.2], [57, 31, -0.5], [42, 33, 0.8]].forEach(function (q) { p.at(q[0], q[1], q[2], 1, function () { p.path('M0 0 C-2 -3 -1 -6 0 -7 C1 -6 2 -3 0 0 Z', { fill: 'leaf', w: 0.5 }); }); });
    p.dot(60, 36, 1.6, 'rose'); p.dot(38, 39, 1.4, 'rose');
    for (i = 0; i < 3; i++) wisp(p, [38, 50, 62][i], 30, 32, M.frac(t + [0, 0.4, 0.2][i]), { w: 0.75, alpha: 0.9 });
    p.at(79 - 29 * hop, 49 - 36 * hop, -0.9 * hop, [1 + 0.1 * sq, 1 - 0.28 * sq], function () {
      p.path('M-12 1 C-12 -9 12 -9 12 1 Z', { fill: 'leaf', w: 0.95 }); p.path('M-9 0 C-9 -6.5 9 -6.5 9 0 Z', { fill: 'mint', line: false });
      p.line(0, 0, -6, -5, { w: 0.3, detail: true }); p.line(0, 0, 0, -6.5, { w: 0.3, detail: true }); p.line(0, 0, 6, -5, { w: 0.3, detail: true });
    });
    if (s.tap >= 0) for (i = 0; i < 3; i++) {
      var d = M.seg(tp, 0.43 + i * 0.05, 0.64 + i * 0.05), x = 47 + i * 5 + 2 * i % 2;
      if (d > 0 && d < 1) p.path('M' + x + ' ' + (22 + 14 * M.easeIn(d)) + ' c1.6 2.6 2.2 4 0 5 c-2.2 -1 -1.6 -2.4 0 -5 Z', { fill: 'yellow', w: 0.55 });
    }
  }
});

/* พริก chili: a red bird's-eye chili swinging on its stem like a pendulum, the tip lagging, a glint
   crossing its skin. Tap: it squints, its mouth opens and it breathes a long fire out over the right. */
D.add('chili', {
  fam: 'lanna', tags: ['chili', 'pepper', 'spicy', 'hot', 'prik', 'fire', 'phet', 'heat', 'พริก'], loop: 2.4, still: 0.2, tapLen: 1.8, burst: 'ember', burstAt: [60, 56], burstN: 6, burstSpread: 1.5,
  margin: [14, 40, 10, 14], about: 'swings from its stem, the tip lagging; a glint crosses its skin', tapAbout: 'it squints and breathes a long flame out to the right',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), fire = s.tap < 0 ? 0 : M.easeOut(M.seg(tp, 0.12, 0.34)) * (1 - M.easeIn(M.seg(tp, 0.72, 1))), fl = 1 + 0.12 * M.wave(t, 4) + 0.08 * M.wave(t, 7, 0.2);
    p.pivot(50, 2, 0.11 * M.wave(t, 1) + 0.03 * M.wave(t, 2, 0.3) - 0.09 * fire, 1, function () {
      p.line(50, 2, 50, 18, { w: 1.2, ink: 'green' });
      p.circle(50, 3, 2, { w: 0.6 });
      p.path('M43 22 C37 42 39 68 62 92 C60 70 61 44 57 22 Z', { fill: 'red' });
      p.path('M45 34 C42 46 43 60 49 72', { w: 0.6, ink: 'white', alpha: 0.7, detail: true });
      var g = M.frac(t) * 1.3 - 0.15; if (g > 0 && g < 1) p.line(46 + g * 6, 30 + g * 40, 47 + g * 6, 33 + g * 40, { w: 0.9, ink: 'white', cap: 'round', detail: true });
      p.path('M41 22 C42 15 58 15 59 22 C56 26 44 26 41 22 Z', { fill: 'green', w: 0.9 });
      if (fire > 0.02) {
        p.path('M44 38 L50 41', { w: 0.9 }); p.path('M56 38 L50 41', { w: 0.9 });
        p.draw('M44 37 L49 40', fire, { w: 0.9 }); p.draw('M56 37 L51 40', fire, { w: 0.9 });
        p.ellipse(50, 52, 4 * fire, 5.5 * fire, { fill: 'night', w: 0.8 });
        p.at(52, 53, 0.1, [fire * fl, fire], function () {
          p.path('M0 -6 C14 -12 34 -10 46 -3 C34 -1 32 3 48 7 C32 12 14 10 0 6 Z', { fill: 'flame', w: 0.85 });
          p.path('M2 -3 C14 -6 26 -5 33 -1.5 C26 0 25 2 34 4 C24 6 12 5 2 3 Z', { fill: 'yellow', line: false });
        });
      }
    });
  }
});

/* ข้าวเหนียวมะม่วง mango sticky rice: a mound of sticky rice with coconut cream, a fanned mango beside it,
   a spoon of mung beans. Steam leaves the rice, the mango slices fan wider and narrower, a drip of cream
   runs down. Tap: a little jug tips over and pours coconut cream across the rice. */
D.add('mango-rice', {
  fam: 'lanna', tags: ['mango sticky rice', 'khao niao mamuang', 'dessert', 'mango', 'coconut', 'sweet', 'thai', 'ข้าวเหนียวมะม่วง'], loop: 2.4, still: 0.3, tapLen: 2.2, burst: false,
  margin: [30, 18, 6, 18], about: 'steam leaves the rice, the mango fan opens and closes, a drip of cream runs down', tapAbout: 'a jug tips over and pours coconut cream across the rice',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), tilt = s.tap < 0 ? 0 : M.ease(M.seg(tp, 0.05, 0.28)) * (1 - M.ease(M.seg(tp, 0.62, 0.85))), pool = s.tap < 0 ? 0 : M.ease(M.seg(tp, 0.28, 0.6)) * (1 - M.ease(M.seg(tp, 0.8, 1))), i;
    p.ellipse(50, 78, 47, 12, { fill: 'white' }); p.ellipse(50, 77, 38, 8.5, { w: 0.4, detail: true, ink: 'blue' }); p.path('M4 76 C10 90 90 90 96 76', { w: 0.5, ink: 'blue', detail: true });
    p.blob(34, 64, 21, { fill: 'white', lumpy: 0.07, seed: 6, sy: 0.72 });
    for (i = 0; i < 9; i++) p.path('M' + (22 + (i * 7) % 24) + ' ' + (58 + (i * 5) % 12) + ' l2.6 1', { w: 0.3, detail: true });
    if (pool > 0.02) p.blob(34, 55 + 3 * pool, 8 + 10 * pool, { fill: 'cream', lumpy: 0.08, seed: 2, sy: 0.5 });
    for (i = 0; i < 5; i++) p.dot(26 + i * 4.2, 56 + (i % 2) * 2, 1.2, 'yellow');
    var fan = 1 + 0.07 * M.wave(t, 1, 0.2);
    for (i = 4; i >= 0; i--) {
      p.at(66 + (i - 2) * 2.4, 80 - i * 5.2, -0.42 - (i - 2) * 0.07 * fan, 1, function () {
        p.path('M-15 -3 C-15 -8 13 -9 15 -3 C17 2 14 6 8 6 L-10 6 C-14 6 -15 2 -15 -3 Z', { fill: i % 2 ? 'yellow' : 'a', w: 0.85 });
        p.path('M-8 -1.5 C-2 -3.5 6 -3.5 11 -1.5', { w: 0.3, detail: true, ink: 'orange' });
      });
    }
    p.curve([[44, 55], [52, 59], [60, 60], [70, 66]], { w: 0.9, ink: 'white', alpha: 0.95 });
    var dr = M.frac(t); p.span('M24 62 C23 68 24 72 26 76', M.easeIn(M.seg(dr, 0.5, 1)), M.easeOut(M.seg(dr, 0, 0.7)), { w: 0.7, ink: 'cream' });
    wisp(p, 30, 56, 28, M.frac(t), { w: 0.7, alpha: 0.85 }); wisp(p, 40, 56, 24, M.frac(t + 0.5), { w: 0.7, alpha: 0.85 });
    if (tilt > 0.01) {
      p.pivot(66, 14, -0.9 * tilt, 1, function () {
        p.path('M54 6 L74 6 L72 27 C72 31 58 31 58 27 Z', { fill: 'sky', w: 0.95 }); p.path('M74 10 C82 10 82 22 73 22', { w: 0.9 }); p.path('M54 6 L50 4', { w: 0.9 });
        p.path('M60 12 C60 17 60 22 61 25', { w: 0.35, detail: true, ink: 'white' });
      });
      var u = M.seg(tp, 0.2, 0.46), v = M.seg(tp, 0.58, 0.8);
      if (u > 0) p.span('M51 19 C44 24 40 38 36 52', M.easeIn(v), M.easeOut(u), { w: 1.3, ink: 'white' });
    }
  }
});

/* ทุเรียน durian: the spiked king of fruit, a stem on top, two flies orbiting it. It sits and breathes,
   a thin green ribbon of smell drifting up. Tap: it shudders and three columns of stink billow up
   and sway, the flies scattering wide. */
D.add('durian', {
  fam: 'lanna', tags: ['durian', 'fruit', 'spiky', 'smell', 'stink', 'king of fruits', 'market', 'thai', 'ทุเรียน'], loop: 2.4, still: 0.3, tapLen: 1.8, burst: false,
  margin: [30, 18, 8, 18], about: 'sits spiked and breathing, two flies orbiting, a thin ribbon of smell drifting up', tapAbout: 'it shudders and three columns of stink billow up, the flies scatter wide',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), pu = s.tap < 0 ? 0 : M.bump(M.seg(tp, 0.04, 0.92)), i, k, br = 0.015 * M.wave(t, 1);
    function col(x, ph, amp, o) {
      var pts = [], q;
      for (q = 0; q <= 14; q++) pts.push([x + amp * Math.sin(TAU * (q / 4.5 - t * 1)) * (0.35 + q / 20), 22 - q * 2.7]);
      p.span(pts, M.easeIn(M.seg(ph, 0.35, 1)), M.easeOut(M.seg(ph, 0, 0.75)), o);
    }
    p.pivot(50, 90, 0.04 * pu * Math.sin(TAU * 9 * tp), [1 + br, 1 - br], function () {
      p.pivot(50, 56, 0.2, 1, function () {
        var pts = [];
        for (k = 0; k < 26; k++) { var a = k / 26 * TAU, r = k % 2 ? 0.85 : 1.03; pts.push([50 + 33 * r * Math.cos(a), 56 + 36 * r * Math.sin(a)]); }
        p.poly(pts, { fill: 'leaf', w: 0.9 });
        for (i = 0; i < 4; i++) for (k = 0; k < 4; k++) {
          var x = 33 + k * 11.5 + (i % 2) * 5.5, y = 38 + i * 11;
          if (Math.pow((x - 50) / 26, 2) + Math.pow((y - 56) / 29, 2) < 1) p.path('M' + (x - 3.4) + ' ' + (y + 2.2) + ' L' + x + ' ' + (y - 3.2) + ' L' + (x + 3.4) + ' ' + (y + 2.2), { w: 0.5, detail: true, ink: 'brown' });
        }
        p.path('M38 36 C42 30 48 28 54 28', { w: 0.7, ink: 'white', alpha: 0.7, detail: true });
      });
      p.path('M47 22 C46 14 51 9 58 6', { w: 1.5, ink: 'brown' }); p.path('M58 6 C62 3 66 5 66 8 C62 9 60 8 58 6 Z', { fill: 'leaf', w: 0.6 });
    });
    col(50, M.frac(t), 3 + 2 * pu, { w: 0.65, ink: 'leaf', alpha: 0.9 });
    if (s.tap >= 0) { [34, 66].forEach(function (x, j) { col(x, M.seg(tp, 0.1 + j * 0.06, 0.9), 5, { w: 0.9, ink: 'leaf' }); }); col(50, M.seg(tp, 0.04, 0.9), 6, { w: 0.9, ink: 'leaf' }); }
    [[0.0, 1], [0.5, -1]].forEach(function (q) {
      var spread = 1 + 0.55 * pu, x = 50 + 44 * spread * Math.cos(TAU * (t * q[1] + q[0])), y = 52 + 30 * Math.sin(TAU * (2 * t * q[1] + q[0])) - 8 * pu, fw = 0.35 + 0.65 * Math.abs(M.wave(t, 12, q[0]));
      p.ellipse(x - 1.4, y - 2.2, 2.4, 1.1 * fw, { fill: 'white', w: 0.4, rot: -0.5 }); p.ellipse(x + 1.4, y - 2.2, 2.4, 1.1 * fw, { fill: 'white', w: 0.4, rot: 0.5 });
      p.dot(x, y, 1.7, 'ink');
    });
  }
});

/* มังคุด mangosteen, the queen of fruit: a purple ball in a green crown. It rocks on its round bottom, a
   glint crossing its skin. Tap: the rind opens like a lid, tilting up, and the white segments pop up
   in a ring; then it closes again with a clink. */
D.add('mangosteen', {
  fam: 'lanna', tags: ['mangosteen', 'fruit', 'queen of fruits', 'purple', 'segments', 'market', 'thai', 'summer', 'มังคุด'], loop: 2.4, still: 0.3, tapLen: 2.2, burst: false,
  margin: [14, 18, 8, 18], about: 'rocks on its round bottom, a glint crossing the skin', tapAbout: 'the rind opens like a lid and white segments pop up in a ring, then it closes with a clink',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), open = s.tap < 0 ? 0 : M.spring(M.seg(tp, 0, 0.3)) * (1 - M.ease(M.seg(tp, 0.66, 0.88))), clink = s.tap < 0 ? 0 : M.bump(M.seg(tp, 0.86, 0.98)), gl = M.seg(M.frac(t), 0, 0.3), i;
    function crown() {
      for (i = 0; i < 5; i++) p.at(50, 29, (i - 2) * 0.62, [1, 0.9], function () { p.path('M0 0 C-5 -3 -5 -9 0 -12 C5 -9 5 -3 0 0 Z', { fill: i % 2 ? 'leaf' : 'green', w: 0.7 }); });
      p.line(50, 29, 50, 21, { w: 1.5, ink: 'brown' });
    }
    function glint(k) { if (gl > 0 && gl < 1) { var r = 4 * M.bump(gl) * k; p.line(36 - r, 42, 36 + r, 42, { w: 0.6, ink: 'white', cap: 'round' }); p.line(36, 42 - r, 36, 42 + r, { w: 0.6, ink: 'white', cap: 'round' }); } }
    p.pivot(50, 88, 0.07 * M.wave(t, 1, 0.2) * (1 - Math.min(1, open * 2)), [1 + 0.04 * clink, 1 - 0.06 * clink], function () {
      if (open < 0.02) {
        p.ellipse(50, 58, 33, 30, { fill: '#6F3A86' });
        p.arc(50, 58, 26, -2.7, -1.75, { w: 0.9, ink: 'white', alpha: 0.6, ry: 23 }); glint(1); crown();
        return;
      }
      p.path('M17 58 C17 80 35 88 50 88 C65 88 83 80 83 58 Z', { fill: '#6F3A86' });
      p.ellipse(50, 58, 33, 7.5, { fill: 'pink', w: 0.9 }); p.ellipse(50, 58, 29, 5.6, { fill: 'white', w: 0.5 });
      [0, 3, 1, 4, 2].forEach(function (k) {
        var a = 0.4 + k * TAU / 5, rise = Math.min(1, open) * 3.5;
        p.ellipse(50 + 15 * Math.cos(a), 57 + 3.2 * Math.sin(a) - rise * 0.4, 8, 3.8 + rise, { fill: 'white', w: 0.65 });
        p.path('M' + (50 + 15 * Math.cos(a) - 3) + ' ' + (57 + 3.2 * Math.sin(a) - rise * 0.6) + ' q3 -1 6 0', { w: 0.3, detail: true });
      });
      p.pivot(50, 45, 0.5 * open, 1, function () {
        p.move(-7 * Math.min(1, open), -32 * Math.min(1, open));
        p.path('M17 58 C17 20 83 20 83 58 Z', { fill: '#6F3A86' });
        p.arc(50, 58, 26, -2.7, -1.75, { w: 0.9, ink: 'white', alpha: 0.6, ry: 23 }); crown();
      });
    });
  }
});

/* มะพร้าว a young coconut shaved to its point, with a pink straw: a sip of coconut water travels up the straw
   and out of sight. The coconut bobs and the straw sways. Tap: a long gulp — three slugs of water race up
   the straw, the coconut sinks as it empties, and an "ahh" spreads from the top. */
D.add('coconut', {
  fam: 'lanna', tags: ['coconut', 'young coconut', 'straw', 'drink', 'sip', 'water', 'tropical', 'refresh', 'มะพร้าว', 'มะพร้าวน้ำหอม'], loop: 2.4, still: 0.3, tapLen: 1.8, burst: false,
  margin: [14, 24, 8, 18], about: 'bobs, the straw swaying, a sip of water travelling up the straw', tapAbout: 'a long gulp: three slugs of water race up the straw, the coconut sinks, an ahh spreads',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), sip = s.tap < 0 ? 0 : M.bump(M.seg(tp, 0, 0.78)), ph = M.frac(t + (s.tap < 0 ? 0 : 3 * M.ease(M.seg(tp, 0, 0.78)))), sw = 3 * M.wave(t, 1, 0.1), i;
    var S = [[50, 26], [50 + 0.5 * sw, 14], [56 + sw, 4], [72 + 1.5 * sw, -1]];
    p.pivot(50, 90, 0, [1 + 0.03 * sip, 1 - 0.07 * sip - 0.02 * M.wave(t, 1)], function () {
      p.path('M22 60 C22 40 34 32 42 24 L58 24 C66 32 78 40 78 60 C78 80 66 90 50 90 C34 90 22 80 22 60 Z', { fill: 'white' });
      p.path('M23 65 C28 84 40 90 50 90 C60 90 72 84 77 65 C68 71 32 71 23 65 Z', { fill: 'leaf', w: 0.8 });
      p.path('M42 24 C40 31 38 37 33 43', { w: 0.4, detail: true }); p.path('M50 25 C50 32 50 38 50 45', { w: 0.4, detail: true }); p.path('M58 24 C60 31 62 37 67 43', { w: 0.4, detail: true });
      p.path('M33 43 C42 48 58 48 67 43', { w: 0.4, detail: true });
      p.ellipse(50, 24, 8.5, 2.8, { fill: 'sand', w: 0.8 }); p.ellipse(50, 24, 3, 1.1, { fill: 'brown', line: false });
    });
    p.curve(S, { w: 2.3, ink: 'rose', cap: 'round' });
    p.curve(S, { w: 0.8, ink: 'white', dash: [3, 3.5], cap: 'round' });
    p.span(S, M.easeIn(M.seg(ph, 0.3, 0.85)), M.easeOut(M.seg(ph, 0, 0.5)), { smooth: true, w: 1.9, ink: 'sky', cap: 'round' });
    for (i = 0; i < 3; i++) p.span('M' + (84 + i * 1) + ' ' + (20 + i * 9) + ' L' + (92 + i * 3) + ' ' + (15 + i * 12), M.easeIn(M.seg(tp, 0.84, 1)), M.easeOut(M.seg(tp, 0.7 + i * 0.03, 0.9)), { w: 0.7, ink: 'a' });
  }
});

/* ครกและสาก som tam: a clay mortar and a wooden pestle, shredded green papaya, tomato, chili, peanuts. The
   pestle pounds twice a loop and each blow jumps a few bits out of the bowl. Tap: a flurry of blows,
   faster and faster, with "tok" marks off the rim, then it settles back into its rhythm. */
D.add('som-tam', {
  fam: 'lanna', tags: ['som tam', 'papaya salad', 'mortar', 'pestle', 'pound', 'isan', 'spicy', 'street food', 'ส้มตำ', 'ครก'], loop: 1.2, still: 0.3, tapLen: 1.4, burst: false,
  margin: [14, 18, 8, 18], about: 'the pestle pounds twice a loop and each blow jumps bits out of the bowl', tapAbout: 'a flurry of faster and faster blows, tok marks off the rim, then it settles back',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), ph = t * 2 + (s.tap < 0 ? 0 : 6 * M.ease(M.seg(tp, 0, 0.9))), u = M.frac(ph), pd = u < 0.28 ? M.easeIn(u / 0.28) : 1 - M.easeOut(M.seg(u, 0.28, 1)), tau = M.frac(ph - 0.28);
    var idx = ((Math.floor(ph - 0.28) % 2) + 2) % 2, hit = M.bump(M.seg(u, 0.18, 0.42)), R = p.rng(idx * 13 + 1), i, B = [50 + 5 * (1 - pd), 56 - 10 * (1 - pd)];
    p.pivot(50, 92, 0, [1 + 0.03 * hit, 1 - 0.04 * hit], function () {
      p.path('M36 90 L38 95 L62 95 L64 90', { fill: 'brown', w: 0.8 });
      p.path('M17 50 C17 78 32 91 50 91 C68 91 83 78 83 50 Z', { fill: 'brown' });
      p.ellipse(50, 50, 33, 7.5, { fill: '#4A2F18', w: 0.9 });
      p.blob(50, 49, 22 + 1.5 * hit, { fill: 'mint', lumpy: 0.1, seed: 3, sy: 0.4 });
      p.path('M36 48 C38 44 42 44 44 47 C42 50 38 50 36 48 Z', { fill: 'red', w: 0.5 }); p.path('M56 49 C58 45 63 45 65 48 C62 51 58 51 56 49 Z', { fill: 'red', w: 0.5 });
      p.line(46, 50, 51, 52, { w: 0.7, ink: 'red' }); p.dot(43, 52, 1.5, 'sand'); p.dot(59, 53, 1.5, 'sand'); p.line(54, 46, 58, 44, { w: 0.6, ink: 'green' });
    });
    for (i = 0; i < 5; i++) {
      var a = R(), vx = (a - 0.5) * 56, vy = 62 + R() * 40, x = 50 + vx * tau, y = 49 - vy * tau + 135 * tau * tau, r = (R() - 0.5) * 12 * tau;
      if (tau < 0.55 && y < 51) p.at(x, y, r, 1, function () {
        if (i % 5 === 0 || i === 3) p.ellipse(0, 0, 2.6, 1.7, { fill: 'sand', w: 0.5 });
        else if (i === 1) p.path('M-3 0 q3 -3 6 0', { w: 0.8, ink: 'mint' });
        else if (i === 2) p.circle(0, 0, 1.8, { fill: 'red', w: 0.5 });
        else p.line(-3, 0, 3, 0, { w: 0.9, ink: 'red' });
      });
    }
    var T = [B[0] + 23, B[1] - 44];
    tube(p, [B, T], function (q) { return 8 - 2.2 * q; }, { fill: 'wood', w: 0.95 });
    p.path('M17 50 C23 58 77 58 83 50 C83 78 68 91 50 91 C32 91 17 78 17 50 Z', { fill: 'brown', w: 0.95 });
    p.path('M24 66 C28 80 38 86 48 87', { w: 0.4, detail: true, ink: 'wood' });
    if (s.tap >= 0 && tau < 0.25) {
      var k = 1 - tau / 0.25;
      [[-1, 0], [1, 0]].forEach(function (d) { for (i = 0; i < 2; i++) p.line(50 + d[0] * (36 + 2 * i), 44 - i * 7, 50 + d[0] * (36 + 8 * k + 2 * i), 44 - i * 7 - 4 * k, { w: 0.7, ink: 'a', cap: 'round' }); });
    }
  }
});

/* ลีลาวดี frangipani, the lilawadee: five petals in a pinwheel, white going to yellow at the throat, a blush of
   pink on the back of each. It turns as it hangs in the air, tipping a little one way then the other. Tap: it
   lets go and spins down out of sight, and the next one drops in from above, spinning slower until it hangs. */
function plumeria(p, x, y, spin, sy, k) {
  p.at(x, y, 0, [k, k * sy], function () {
    p.at(0, 0, spin, 1, function () {
      for (var i = 0; i < 5; i++) p.at(0, 0, i * TAU / 5, 1, function () {
        p.path('M0 0 C-9 -8 -12 -26 -2 -36 C6 -34 13 -22 9 -12 C7 -6 3 -2 0 0 Z', { fill: 'white', w: 0.9 });
        p.path('M0 0 C-4 -5 -5 -12 -2 -17 C2 -12 4 -5 0 0 Z', { fill: 'yellow', line: false });
        p.path('M-2 -24 C-2.6 -28 -2 -31 -1 -33', { w: 0.55, ink: 'pink', detail: true });
      });
      p.circle(0, 0, 2.3, { fill: 'gold', w: 0.5 });
    });
  });
}
D.add('frangipani', {
  fam: 'lanna', tags: ['frangipani', 'plumeria', 'lilawadee', 'leelawadee', 'flower', 'temple', 'fragrant', 'falling', 'spin', 'ลีลาวดี', 'ลั่นทม'], loop: 3, still: 0.3, tapLen: 2.2, burst: 'petal', burstAt: [50, 50], burstN: 5, burstSpread: 3.2,
  margin: [30, 18, 30, 18], about: 'turns in the air, tipping one way and the other', tapAbout: 'lets go and spins down out of sight; the next drops in from above, slowing to a hang',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), sy = 0.8 + 0.17 * M.wave(t, 1, 0.25), bob = 3 * M.wave(t, 1), sx = 5 * M.wave(t, 1, 0.5);
    var out = s.tap < 0 ? 0 : M.easeIn(M.seg(tp, 0, 0.62)), inn = s.tap < 0 ? 1 : M.easeOut(M.seg(tp, 0.3, 1));
    if (out < 1) plumeria(p, 50 + sx + 12 * out, 48 + bob + 140 * out, TAU * t + TAU * 3 * out, sy, 0.9);
    if (inn < 1) plumeria(p, 50 + sx - 14 * (1 - inn) * Math.sin(inn * 9), 48 + bob - 140 * (1 - inn), TAU * t + TAU * 2 * (1 - inn), sy, 0.9);
  }
});

/* ตุ๊กแก tukkae, the tokay gecko: a blue-grey lizard with orange spots on a beam, big gold eye, throat sac, a
   banded tail. It blinks and the tail curls, the throat breathing. Tap: it calls TUK-KAE — the throat swells
   twice and the sound spreads from the mouth each time. */
function bands(p, sp, w, qs) {
  qs.forEach(function (q) {
    var i = Math.round(q * (sp.length - 1)), a = sp[Math.max(0, i - 1)], b = sp[Math.min(sp.length - 1, i + 1)], d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, h = w(q) / 2 * 0.85, nx = -(b[1] - a[1]) / d * h, ny = (b[0] - a[0]) / d * h;
    p.line(sp[i][0] - nx, sp[i][1] - ny, sp[i][0] + nx, sp[i][1] + ny, { w: 0.5, ink: 'blue', detail: true });
  });
}
D.add('gecko', {
  fam: 'lanna', tags: ['gecko', 'tokay', 'tukkae', 'tuk-kae', 'lizard', 'house', 'wall', 'call', 'night', 'luck', 'ตุ๊กแก'], loop: 2.4, still: 0.3, tapLen: 1.8, burst: false,
  margin: [14, 30, 6, 16], about: 'blinks, the tail curling, the throat breathing', tapAbout: 'calls TUK-KAE: the throat swells twice and the sound spreads from the mouth each time',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), c1 = s.tap < 0 ? 0 : M.bump(M.seg(tp, 0.04, 0.34)), c2 = s.tap < 0 ? 0 : M.bump(M.seg(tp, 0.42, 0.74)), puff = 0.15 + 0.1 * M.wave(t, 2) + 0.85 * c1 + c2, i;
    var tail = bez([26, 66], [10, 68], [1, 54], [11 + 8 * M.wave(t, 1, 0.1), 40 + 3 * M.wave(t, 1, 0.3)], 16), tw = function (q) { return 10 * (1 - q) + 1.2; };
    var body = bez([24, 66], [36, 56], [52, 56], [66, 60], 14), bw = function (q) { return 13 + 7 * Math.sin(Math.PI * q); }, blink = M.bump(M.seg(M.frac(t * 1 + 0.1), 0.78, 0.9));
    p.rect(2, 86, 96, 6, { fill: 'wood', r: 2, w: 0.9 }); p.line(10, 89, 40, 89, { w: 0.35, detail: true }); p.line(60, 88.5, 90, 88.5, { w: 0.35, detail: true });
    tube(p, tail, tw, { fill: 'sky' }); bands(p, tail, tw, [0.3, 0.45, 0.6, 0.75]);
    tube(p, bez([58, 68], [56, 74], [57, 80], [61, 85], 6), function () { return 5; }, { fill: '#6FA3C8', w: 0.7 });
    tube(p, bez([38, 70], [38, 76], [40, 80], [45, 85], 6), function () { return 5; }, { fill: '#6FA3C8', w: 0.7 });
    tube(p, body, bw, { fill: 'sky' });
    [[3, 0], [6, 0], [9, 0], [12, 0], [1, 0]].forEach(function (q) { var b = body[q[0]]; p.dot(b[0], b[1] - 4.5 + (q[0] % 2), 2.1, 'orange'); });
    tube(p, bez([60, 68], [68, 72], [72, 80], [74, 85], 8), function (q) { return 6 - 2 * q; }, { fill: 'sky', w: 0.9 });
    tube(p, bez([30, 70], [24, 72], [20, 80], [22, 85], 8), function (q) { return 6 - 2 * q; }, { fill: 'sky', w: 0.9 });
    [[74, 85, 1], [22, 85, -1], [61, 85, 1], [45, 85, 1]].forEach(function (f) { for (i = -1; i <= 2; i++) p.line(f[0], f[1] - 1, f[0] + (i - 0.5) * 3.4, f[1] + 1.2, { w: 0.8, cap: 'round' }); });
    p.pivot(62, 62, 0.03 * M.wave(t, 1, 0.4), 1, function () {
      p.blob(79, 64, 2 + 7.5 * puff, { fill: 'pink', lumpy: 0.05, seed: 2, sx: 1.2, sy: 0.9 });
      p.path('M60 53 C65 44 80 43 91 50 C96 54 97 59 92 62 L68 67 C62 67 59 59 60 53 Z', { fill: 'sky' });
      p.path('M67 63 C76 65 86 64 93 60', { w: 0.55 });
      p.circle(77, 50, 5.2, { fill: 'a', w: 0.85 }); p.ellipse(77, 50, 1, 3.7, { fill: 'ink', line: false });
      if (blink > 0.05) p.ellipse(77, 50, 5.4, 5.4 * blink, { fill: 'sky', w: 0.6 });
      p.dot(91, 53, 1, 'ink'); p.dot(71, 47, 1.8, 'orange'); p.dot(84, 47, 1.5, 'orange');
    });
    if (c1 > 0.02) ring(p, 99, 56, 1, M.seg(tp, 0.06, 0.4)); if (c2 > 0.02) { ring(p, 99, 56, 1, M.seg(tp, 0.44, 0.78)); ring(p, 106, 56, 1, M.seg(tp, 0.5, 0.84)); }
  }
});

/* หมาซอย a soi dog, the street dog of Chiang Mai: tan coat, one ear folded, a curled tail, a lolling tongue.
   The tail wags, the tongue pants, the ear flicks. Tap: it rolls over for a belly rub — flips onto its back,
   paws kicking, hearts rising — and rolls back to its feet. */
D.add('soi-dog', {
  fam: 'lanna', tags: ['soi dog', 'street dog', 'dog', 'puppy', 'tail', 'wag', 'belly rub', 'friendly', 'หมา', 'หมาซอย'], loop: 1.6, still: 0.2, tapLen: 2.2, burst: 'heart', burstAt: [82, 30], burstN: 5, burstSpread: 2.2,
  margin: [20, 18, 6, 18], about: 'the tail wags, the tongue pants, one ear flicks', tapAbout: 'rolls over for a belly rub, paws kicking, then rolls back to its feet',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), e = s.tap < 0 ? 0 : M.ease(M.seg(tp, 0.04, 0.3)), e2 = s.tap < 0 ? 0 : M.ease(M.seg(tp, 0.7, 0.94)), fl = e - e2, sy = (fl > 0.5 ? -1 : 1) * Math.max(0.16, Math.abs(Math.cos(Math.PI * fl))), hop = -7 * M.bump(M.seg(tp, 0.04, 0.3)) - 5 * M.bump(M.seg(tp, 0.7, 0.94));
    var kick = fl > 0.5 ? 0.45 * Math.sin(TAU * 3 * tp) : 0, pant = 0.5 + 0.5 * M.wave(t, 6), wag = 0.1 + 0.38 * M.wave(t, 3) + (fl > 0.5 ? 0.3 * Math.sin(TAU * 4 * tp) : 0);
    p.line(8, 92, 92, 92, { w: 0.5, detail: true });
    p.push(); p.move(0, hop);
    p.pivot(50, 66, 0, [1, sy], function () {
      p.pivot(21, 50, wag, 1, function () { tube(p, bez([21, 50], [10, 50], [6, 38], [14, 26], 12), function (q) { return 6.5 - 4.5 * q; }, { fill: 'wood', w: 0.9 }); });
      p.pivot(37, 56, -kick, 1, function () { p.path('M30 56 L42 56 L41 80 C41 84 43 86 44 89 L32 89 C33 87 34 85 33 82 Z', { fill: 'sand', w: 0.85 }); });
      p.pivot(51, 56, kick, 1, function () { p.path('M45 56 L56 56 L55 80 C55 84 57 86 58 89 L46 89 C47 87 48 85 47 82 Z', { fill: 'sand', w: 0.85 }); });
      p.path('M20 50 C20 42 28 40 38 41 C48 42 58 42 66 44 C70 48 70 60 66 66 C58 70 44 68 34 68 C26 68 20 62 20 50 Z', { fill: 'wood' });
      p.path('M28 42 C36 40 44 41 47 46 C40 51 30 50 28 42 Z', { fill: 'brown', line: false, alpha: 0.75 });
      p.pivot(27, 56, kick, 1, function () { p.path('M18 54 C16 44 27 42 33 47 C38 53 36 62 34 70 L35 81 C35 84 37 86 38 89 L26 89 C27 87 27 85 26 82 L24 72 C20 68 19 62 18 54 Z', { fill: 'wood', w: 0.95 }); p.path('M26.6 83 L36 83 C36 85 37 87 38 89 L26 89 C27 87 27 85 26.6 83 Z', { fill: 'cream', line: false }); });
      p.pivot(61, 56, -kick, 1, function () { p.path('M55 46 C55 42 65 42 67 48 L66 66 L65 81 C65 84 67 86 69 89 L55 89 C57 87 58 85 58 81 L57 64 Z', { fill: 'wood', w: 0.95 }); p.path('M58 83 L65 83 C65 85 67 87 69 89 L55 89 C57 87 58 85 58 83 Z', { fill: 'cream', line: false }); });
      p.path('M58 42 C66 36 72 38 74 46 L66 58 L56 58 Z', { fill: 'wood', line: false });
      p.pivot(68, 46, 1.15 * fl + 0.03 * M.wave(t, 6), 1, function () {
        p.pivot(72, 28, 0.12 * M.wave(t, 2, 0.3), 1, function () { p.path('M69 31 C68 24 71 19 75 18 C78 21 79 26 78 31 Z', { fill: 'brown', w: 0.9 }); p.path('M75 18 C79 18 81 21 79 24', { w: 0.6 }); });
        p.path('M63 38 C63 27 71 24 79 26 C88 27 96 33 98 40 C97 46 90 49 82 48 C72 49 63 47 63 38 Z', { fill: 'wood', w: 0.95 });
        p.path('M85 33 C91 33 98 37 98 41 C96 46 90 48 84 47 C86 43 87 38 85 33 Z', { fill: 'sand', line: false }); p.dot(97, 40, 2.6, 'ink');
        p.path('M84 46 C90 47.5 94 46 96.5 44', { w: 0.5 });
        p.path('M89 47 C88 52 89 ' + (52 + 3 * pant) + ' 92 ' + (51 + 3 * pant) + ' C94 50 94 48 93 46 Z', { fill: 'pink', w: 0.6 });
        p.dot(80, 34, 1.8, 'ink'); p.path('M77 30.5 C79 29 82 29.5 83.5 31', { w: 0.45 });
      });
    });
    p.pop();
  }
});

/* ไก่ตัวผู้ a rooster in full voice: red comb, gold hackles, green tail. He bobs, then throws his head back and
   crows, the sound spreading from his beak. Tap: a longer, louder crow — wings flap, the sun comes up in the
   corner with its rays drawn out — and he settles. */
D.add('rooster', {
  fam: 'lanna', tags: ['rooster', 'cock', 'crow', 'dawn', 'morning', 'chicken', 'farm', 'cock-a-doodle-doo', 'ไก่', 'ไก่ชน'], loop: 2.4, still: 0.4, tapLen: 2.2, burst: false,
  margin: [18, 30, 8, 14], about: 'bobs his head, then throws it back and crows, the sound spreading from the beak', tapAbout: 'a longer, louder crow with a wing flap, and the sun comes up with its rays drawn out',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), c = M.bump(M.seg(t, 0.2, 0.62)), big = s.tap < 0 ? 0 : M.bump(M.seg(tp, 0.08, 0.82)), cw = Math.max(c, big * 1.05), sun = s.tap < 0 ? 0 : M.easeOut(M.seg(tp, 0.1, 0.4)) * (1 - M.easeIn(M.seg(tp, 0.8, 1))), i;
    var bob = 1.2 * M.wave(t, 2) * (1 - cw), flap = s.tap < 0 ? 0 : big * (0.5 + 0.5 * M.wave(tp, 5));
    if (sun > 0.02) {
      p.circle(16, 17, 8.5 * sun, { fill: 'yellow', w: 0.9 });
      for (i = 0; i < 8; i++) { var a = i / 8 * TAU + 0.2; p.draw('M' + (16 + Math.cos(a) * 12) + ' ' + (17 + Math.sin(a) * 12) + ' L' + (16 + Math.cos(a) * 17) + ' ' + (17 + Math.sin(a) * 17), sun, { w: 0.8, ink: 'a', cap: 'round' }); }
    }
    p.line(8, 92, 92, 92, { w: 0.5, detail: true });
    p.pivot(28, 54, 0.05 * M.wave(t, 2, 0.2) + 0.06 * cw, 1, function () {
      [['M28 54 C12 56 6 40 11 22 C16 34 22 44 30 50 Z', 'green'], ['M28 54 C16 58 4 48 4 32 C11 42 19 48 29 52 Z', 'navy'], ['M28 53 C18 50 14 40 18 28 C21 37 25 44 31 49 Z', 'leaf']].forEach(function (f) { p.path(f[0], { fill: f[1], w: 0.85 }); });
    });
    p.pivot(60, 60, 0, [1 + 0.04 * cw, 1 + 0.04 * cw], function () {
      p.path('M26 52 C24 64 34 76 52 77 C68 77 74 66 72 54 C70 44 60 42 50 42 C40 42 28 44 26 52 Z', { fill: 'orange' });
      p.pivot(46, 52, -0.7 * flap, 1, function () { p.path('M34 55 C42 49 58 51 64 60 C56 70 42 68 34 55 Z', { fill: 'brown', w: 0.9 }); p.path('M40 56 C46 54 54 56 58 60', { w: 0.35, detail: true, ink: 'cream' }); });
    });
    [[48, 46], [58, 60]].forEach(function (l) { p.path('M' + l[0] + ' 74 L' + l[1] + ' 91 M' + l[1] + ' 91 L' + (l[1] - 7) + ' 92 M' + l[1] + ' 91 L' + (l[1] + 6) + ' 92', { w: 1.2, ink: 'gold', cap: 'round' }); });
    p.path('M58 50 C60 40 64 32 68 26 L80 28 C80 38 78 48 72 56 Z', { fill: 'gold', w: 0.85 }); p.path('M64 40 L70 44 M66 34 L72 38', { w: 0.35, detail: true });
    p.pivot(68, 36, -0.55 * cw + 0.03 * M.wave(t, 2, 0.3), 1, function () {
      p.move(0, bob);
      p.at(80, 25, 0.5 * cw, 1, function () { p.poly([[0, -1], [8, 1], [0, 3]], { fill: 'gold', w: 0.6 }); });
      p.path('M68 15 C67 7 72 7 73 12 C74 6 79 7 78 13 C80 9 83 11 80 16 Z', { fill: 'red', w: 0.8 });
      p.circle(74, 21, 7.2, { fill: 'orange', w: 0.9 });
      p.poly([[80, 18], [90, 20.5], [80, 23]], { fill: 'gold', w: 0.6 });
      p.ellipse(79, 29, 2, 3.2, { fill: 'red', w: 0.6 });
      p.circle(76.5, 19.5, 1.9, { fill: 'white', w: 0.4 }); p.dot(77, 19.5, 1, 'ink');
    });
    ring(p, 92, 6, 1, M.seg(M.frac(t - 0.3), 0, 0.3)); ring(p, 98, 6, 1, M.seg(M.frac(t - 0.4), 0, 0.3));
    if (s.tap >= 0) { ring(p, 92, 6, 1, M.seg(tp, 0.12, 0.45)); ring(p, 98, 6, 1, M.seg(tp, 0.28, 0.6)); ring(p, 104, 6, 1, M.seg(tp, 0.44, 0.76)); }
  }
});

/* สงกรานต์ Songkran: a silver water bowl, the lotus-petal band chased into its side, jasmine and marigold
   floating. A drop falls into the water, the ripple spreads, a small crown of water rises. Tap: a big splash
   — the crown leaps up, droplets fly out, the bowl rocks. */
D.add('songkran', {
  fam: 'lanna', tags: ['songkran', 'water', 'new year', 'april', 'splash', 'silver bowl', 'wualai', 'jasmine', 'blessing', 'สงกรานต์', 'ขันเงิน'], loop: 2.4, still: 0.3, tapLen: 1.8, burst: 'drop', burstAt: [50, 44], burstN: 9, burstSpread: 2.8,
  margin: [30, 18, 6, 18], about: 'a drop falls in, the ripple spreads, a small crown of water rises, flowers bobbing', tapAbout: 'a big splash: the crown leaps up, droplets fly, the bowl rocks',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), big = s.tap < 0 ? 0 : M.bump(M.seg(tp, 0.05, 0.8)), ph = M.frac(t), u = M.seg(ph, 0, 0.5), sp = 0.55 * M.bump(M.seg(ph, 0.5, 0.82)) + 1.5 * big, rip = M.seg(ph, 0.5, 1), i;
    p.pivot(50, 90, 0.035 * Math.sin(TAU * 3 * tp) * big, 1, function () {
      p.path('M38 84 L36 94 L64 94 L62 84 Z', { fill: 'smoke', w: 0.9 });
      p.path('M12 50 C14 74 30 84 50 84 C70 84 86 74 88 50 Z', { fill: 'smoke' });
      for (i = 0; i < 8; i++) p.path('M' + (19 + i * 8.9) + ' ' + (62 + 3 * Math.sin(i / 7 * Math.PI)) + ' q4.4 8 8.9 0', { w: 0.5, detail: true });
      p.path('M19 56 C21 66 27 73 34 76', { w: 0.9, ink: 'white', alpha: 0.9, detail: true });
      p.ellipse(50, 50, 38, 7, { fill: 'white', w: 0.9 }); p.ellipse(50, 50.5, 34, 5.4, { fill: 'sky', w: 0.5 });
      [[38, 0.0, 0], [55, 0.3, 1], [64, 0.6, 0]].forEach(function (f) {
        var x = f[0] + 1.2 * M.wave(t, 1, f[1]), y = 51 + 0.7 * M.wave(t, 2, f[1]);
        if (f[2]) p.circle(x, y, 2.7, { fill: 'orange', w: 0.6 }); else p.star(x, y, 3.6, 1.8, 5, { fill: 'white', w: 0.5, rot: TAU * t });
      });
      if (rip > 0 && rip < 1) p.ellipse(50, 50.5, 4 + 30 * rip, 0.8 + 4.4 * rip, { w: 0.5, ink: 'blue', over: false });
      if (sp > 0.05) {
        var pts = [[26, 50]], k, hs = [7, 12, 17, 12, 17, 12, 7];
        for (k = 0; k < 7; k++) { var x = 28 + k * 7.4; pts.push([x, 49 - hs[k] * sp], [x + 3.7, 49 - 3 * sp]); }
        pts.push([76, 50]); p.poly(pts, { fill: 'sky', w: 0.8 });
        for (k = 0; k < 7; k++) if (big > 0.1) p.dot(28 + k * 7.4, 49 - hs[k] * sp - 4, 1.6 * big, 'sky');
      }
    });
    if (u > 0 && u < 1) { var y = -8 + 54 * M.easeIn(u); p.path('M50 ' + (y - 5) + ' C53 ' + (y - 0.5) + ' 54 ' + (y + 2) + ' 50 ' + (y + 4) + ' C46 ' + (y + 2) + ' 47 ' + (y - 0.5) + ' 50 ' + (y - 5) + ' Z', { fill: 'sky', w: 0.6 }); }
  }
});

/* งอบ ngob, the northern farmer's hat: a wide woven brim, a low crown, a blue band, two ties, a few ears of
   rice tucked in the band. It rocks like a boat, the ties trailing a beat behind, a glint crossing the weave.
   Tap: it's tossed in the air, spinning, and caught with a squash. */
D.add('ngob', {
  fam: 'lanna', tags: ['ngob', 'ngop', 'hat', 'farmer', 'rice', 'woven', 'straw', 'field', 'sun hat', 'งอบ'], loop: 3, still: 0.3, tapLen: 1.6, burst: 'leaf', burstAt: [50, 50], burstN: 4, burstSpread: 3,
  margin: [40, 18, 8, 18], about: 'rocks like a boat, the ties trailing a beat behind, a glint crossing the weave', tapAbout: 'tossed up spinning, and caught with a squash',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), up = s.tap < 0 ? 0 : M.bump(M.seg(tp, 0.04, 0.8)), spin = s.tap < 0 ? 0 : TAU * M.ease(M.seg(tp, 0.1, 0.76)), sq = s.tap < 0 ? 0 : M.bump(M.seg(tp, 0.78, 0.96)), i;
    var rock = 0.06 * M.wave(t, 1) + 0.04 * M.wave(t, 2, 0.2), g = M.seg(M.frac(t * 1 + 0.2), 0, 0.3);
    p.at(50, 62 - 34 * up, rock + spin, [1 + 0.05 * sq, 1 - 0.1 * sq], function () {
      p.move(-50, -62);
      p.ellipse(50, 62, 46, 15, { fill: 'sand' });
      [0.88, 0.76, 0.64].forEach(function (k) { p.ellipse(50, 62, 46 * k, 15 * k, { w: 0.35, detail: true, ink: 'wood' }); });
      p.pivot(66, 60, 0.1 * M.wave(t, 1, 0.2), 1, function () {
        p.path('M66 60 C70 48 77 41 86 38', { w: 0.8, ink: 'gold' });
        for (i = 0; i < 4; i++) p.ellipse(72 + i * 4, 46 - i * 2.6, 2.6, 1.2, { fill: 'gold', w: 0.4, rot: -0.7 });
      });
      p.path('M28 60 C28 42 40 33 50 33 C60 33 72 42 72 60 C62 67 38 67 28 60 Z', { fill: 'sand' });
      for (i = -3; i <= 3; i++) p.path('M50 34 C' + (50 + i * 3) + ' 44 ' + (50 + i * 6) + ' 54 ' + (50 + i * 7.2) + ' ' + (64 - Math.abs(i) * 0.6), { w: 0.35, detail: true, ink: 'wood' });
      p.path('M28 57 C38 65 62 65 72 57 L72.5 62.5 C62 70 38 70 27.5 62.5 Z', { fill: 'navy', w: 0.7 });
      [[0.0, 62], [0.14, 65]].forEach(function (q) {      /* two ribbons from the band trail off to the left, fluttering one after the other */
        var f = 6 * M.wave(t, 2, q[0]) + 6 * up;
        tube(p, bez([29, q[1]], [19, q[1] + f * 0.5 + 4], [11, q[1] - f * 0.4 + 7], [1, q[1] + f * 0.3 + 6], 10), function (u) { return 3.8 - 2.2 * u; }, { fill: 'blue', w: 0.65 });
      });
      p.circle(50, 33, 2.2, { fill: 'brown', w: 0.6 });
      if (g > 0 && g < 1) { var r = 3.4 * M.bump(g); p.line(42 - r, 42, 42 + r, 42, { w: 0.6, ink: 'white', cap: 'round' }); p.line(42, 42 - r, 42, 42 + r, { w: 0.6, ink: 'white', cap: 'round' }); }
    });
  }
});

/* ควาย kwai, the water buffalo of the rice fields: slate hide, horns swept back, a pale muzzle. It chews,
   its ear flicks and the tail swishes. Tap: an egret flies in from the right and lands on its back, the ear
   and tail flick, and a moment later it lifts off again to the left. */
function egret(p, x, y, flap, tilt) {
  p.at(x, y, tilt, [-1, 1], function () {
    p.ellipse(0, -9, 8.5, 4.4, { fill: 'white', w: 0.85 });
    tube(p, bez([5, -10], [11, -15], [3, -22], [8, -28], 8), function (q) { return 3.8 - 1.2 * q; }, { fill: 'white', w: 0.8 });
    p.circle(8.4, -28.5, 2.5, { fill: 'white', w: 0.8 }); p.poly([[10.4, -29.2], [18, -27.6], [10.4, -27]], { fill: 'gold', w: 0.5 }); p.dot(9, -29, 0.8, 'ink');
    p.path('M-7 -9 L-15 -6 L-14 -10 Z', { fill: 'white', w: 0.6 });
    p.line(-1, -5, -1, 0, { w: 0.7 }); p.line(3, -5.5, 3.5, 0, { w: 0.7 });
    p.at(-1, -10, flap, 1, function () { p.path('M0 0 C-4 -10 -12 -13 -21 -8 C-13 -5 -6 -2 0 0 Z', { fill: 'white', w: 0.8 }); });
  });
}
D.add('buffalo', {
  fam: 'lanna', tags: ['buffalo', 'water buffalo', 'kwai', 'rice field', 'farm', 'egret', 'northern', 'countryside', 'ควาย'], loop: 2.4, still: 0.3, tapLen: 2.6, burst: false,
  margin: [26, 28, 6, 18], about: 'chews, the ear flicks, the tail swishes', tapAbout: 'an egret flies in, lands on its back, and lifts off again; the ear and tail flick',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), arr = M.seg(tp, 0.03, 0.34), dep = M.seg(tp, 0.7, 0.98), land = s.tap < 0 ? 0 : M.bump(M.seg(tp, 0.3, 0.62)), br = 0.012 * M.wave(t, 1), ch = 1.3 * M.wave(t, 3);
    var ear = -0.15 * Math.max(0, M.wave(t, 3, 0.2)) - 0.3 * land, tail = 0.28 * M.wave(t, 2, 0.15) + 0.35 * land * M.wave(tp, 4), i, k, c;
    p.line(6, 90, 94, 90, { w: 0.5, detail: true });
    p.path('M26 60 L36 60 L35 82 L36 89 L25 89 L26 82 Z', { fill: '#58616E', w: 0.85 }); p.path('M54 60 L64 60 L63 82 L64 89 L53 89 L54 82 Z', { fill: '#58616E', w: 0.85 });
    p.path('M16 56 C14 66 20 72 24 74 L24 89 L35 89 L34 74 C38 70 38 62 34 56 Z', { fill: '#6E7783', w: 0.95 }); p.path('M56 58 C56 66 58 70 60 72 L60 89 L71 89 L70 72 C74 68 74 62 70 56 Z', { fill: '#6E7783', w: 0.95 });
    p.path('M24 84 L35 84 L35 89 L24 89 Z', { fill: 'night', line: false }); p.path('M60 84 L71 84 L71 89 L60 89 Z', { fill: 'night', line: false });
    p.pivot(14, 46, tail, 1, function () { tube(p, bez([14, 46], [5, 50], [6, 62], [10, 72], 10), function (q) { return 3.4 - 1.6 * q; }, { fill: '#58616E', w: 0.8 }); p.ellipse(10, 75, 3, 4.4, { fill: '#2D323B', w: 0.6 }); });
    p.pivot(44, 72, 0, [1 + br, 1 - br], function () { p.path('M14 52 C12 40 24 32 42 32 C54 32 62 34 68 40 L72 48 C72 62 66 71 56 72 L26 72 C18 68 15 62 14 52 Z', { fill: '#6E7783' }); });
    p.path('M20 44 C28 38 40 37 50 38', { w: 0.4, detail: true, ink: 'white', alpha: 0.6 });
    p.pivot(66, 44, 0.03 * M.wave(t, 1, 0.3), 1, function () {
      p.path('M79 44 C72 28 54 24 42 36 C54 33 66 38 72 49 Z', { fill: 'stone', w: 0.95 }); p.path('M60 29 C54 29 48 32 45 35', { w: 0.35, detail: true });
      p.path('M66 38 C74 38 82 42 86 48 C92 52 96 60 94 65 C92 69 86 69 82 66 C78 64 72 62 68 58 Z', { fill: '#6E7783', w: 0.95 });
      p.pivot(73, 45, ear, 1, function () { p.path('M72 45 C65 46 62 53 66 56 C71 54 74 49 72 45 Z', { fill: '#58616E', w: 0.8 }); });
      p.ellipse(90 + ch * 0.5, 64 + 0.5 * Math.abs(ch), 6.5, 4.2, { fill: 'smoke', w: 0.8 }); p.dot(93.5 + ch * 0.5, 63, 1, 'ink');
      p.dot(82, 49, 1.8, 'ink'); p.dot(82.6, 48.4, 0.6, 'white');
    });
    [10, 46, 90].forEach(function (x) { for (k = -1; k <= 1; k++) p.line(x, 90, x + k * 3, 83 - (k === 0 ? 1.5 : 0), { w: 0.8, ink: 'leaf' }); });
    if (s.tap >= 0) {
      var f = 0.45 + 0.5 * Math.sin(TAU * 4 * tp);
      if (arr > 0 && arr < 1) { var b = bez([128, -8], [104, -18], [70, 8], [44, 33.4], 12), k0 = Math.min(11, Math.floor(arr * 12)), g = arr * 12 - k0; egret(p, M.lerp(b[k0][0], b[k0 + 1][0], g), M.lerp(b[k0][1], b[k0 + 1][1], g), -0.8 * f, -0.2 * (1 - arr)); }
      else if (dep <= 0 && arr >= 1) egret(p, 44, 33.4 - 1.2 * M.bump(M.seg(tp, 0.5, 0.58)), 0, 0);
      else if (dep > 0 && dep < 1) { var d = bez([44, 33.4], [38, 10], [8, -14], [-34, -20], 12), j0 = Math.min(11, Math.floor(dep * 12)), h = dep * 12 - j0; egret(p, M.lerp(d[j0][0], d[j0 + 1][0], h), M.lerp(d[j0][1], d[j0 + 1][1], h), -0.8 * f, 0.1); }
    }
  }
});

/* ไส้อั่ว sai oua, the Chiang Mai herb sausage, coiled and skewered over charcoal: orange, speckled with
   herb and chili. It sizzles, embers lift off the coals, smoke curls up. Tap: it is flipped on its skewers
   to the other side, which is browned with grill marks; tap again and it flips back. */
D.add('sai-oua', {
  fam: 'lanna', tags: ['sai oua', 'sausage', 'northern sausage', 'grill', 'charcoal', 'chiang mai', 'herb', 'street food', 'market', 'ไส้อั่ว'], loop: 2.4, still: 0.3, tapLen: 1.6, burst: 'ember', burstAt: [50, 50], burstN: 7, burstSpread: 3,
  margin: [30, 18, 8, 18], about: 'sizzles on its skewers, embers lifting, smoke curling', tapAbout: 'flips on its skewers to the other side, browned with grill marks; the next tap flips it back',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), i, e = s.tap < 0 ? 0 : M.ease(M.seg(tp, 0.08, 0.7));
    var sy = Math.max(0.14, Math.abs(Math.cos(Math.PI * e))), sh = s.tap < 0 || e > 0.5 ? s.taps % 2 : (s.taps + 1) % 2;
    var sp = [], n = 46, hop = s.tap < 0 ? 0 : -9 * M.bump(M.seg(tp, 0.05, 0.75));
    for (i = 0; i <= n; i++) { var th = i / n * 3 * TAU, r = (4 + 31 * i / n) * (1 + 0.014 * Math.sin(th * 3 + TAU * 2 * t)); sp.push([50 + r * Math.cos(th), 52 + r * Math.sin(th)]); }
    for (i = 0; i < 3; i++) { var ph = M.frac(t + i / 3), x = [16, 50, 84][i]; p.dot(x + 4 * Math.sin(TAU * (ph * 2 + i)), 94 - 22 * ph, 1.9 * Math.sin(Math.PI * ph), 'flame'); }
    p.push(); p.move(0, hop);
    p.pivot(50, 52, 0, [1, sy], function () {
      tube(p, sp, function (q) { return 7.8; }, sh ? { fill: '#B5541C', hatch: 0.8 } : { fill: 'orange' });
      if (!sh) for (i = 0; i < 16; i++) { var q = sp[3 + i * 2.6 | 0]; p.dot(q[0] + (i % 3 - 1) * 1.2, q[1] + (i % 2 - 0.5) * 2, 0.9, i % 4 ? 'leaf' : 'red'); }
      p.line(5, 41, 95, 41, { w: 1.1, ink: 'wood' }); p.line(5, 63, 95, 63, { w: 1.1, ink: 'wood' });
    });
    p.pop();
    for (i = 0; i < 3; i++) wisp(p, [28, 50, 72][i], 14, 28, M.frac(t + [0, 0.4, 0.7][i]), { w: 0.75, alpha: 0.9 });
  }
});

/* พวงมาลัย phuang malai, a jasmine and marigold garland: a ring of marigolds, a hanging strand of jasmine
   buds, red ribbon tails. It swings from its hook, the strand lagging, a thread of scent rising. Tap: it is
   lifted and shaken, swinging wide, and the buds open down the strand one after another into small stars. */
D.add('phuang-malai', {
  fam: 'lanna', tags: ['phuang malai', 'garland', 'jasmine', 'marigold', 'flowers', 'offering', 'fragrant', 'car', 'respect', 'พวงมาลัย'], loop: 2.4, still: 0.3, tapLen: 2, burst: 'petal', burstAt: [50, 50], burstN: 5, burstSpread: 3,
  margin: [14, 26, 8, 26], about: 'swings from its hook, the strand lagging, a thread of scent rising', tapAbout: 'lifted and shaken, it swings wide and the buds open down the strand into stars',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), e = s.tap < 0 ? 0 : M.easeOut(M.seg(tp, 0, 0.12)) * (1 - M.easeIn(M.seg(tp, 0.5, 1))), sw = Math.sin(TAU * 1.5 * tp), i, j;
    var a1 = 0.07 * M.wave(t, 1) + 0.32 * e * sw, a2 = 0.1 * M.wave(t, 1, -0.1) + 0.2 * e * Math.sin(TAU * 1.5 * tp - 0.7);
    p.path('M40 2 L60 2', { w: 1.1, ink: 'brown' }); p.circle(50, 4, 2, { w: 0.7 });
    p.pivot(50, 4, a1, 1, function () {
      p.line(50, 5, 50, 9, { w: 0.6 });
      p.pivot(50, 9, a2, 1, function () {
        for (j = 0; j < 3; j++) {
          var x = 40 + j * 10, y0 = 32;
          p.line(x, 30, x, 78 + 4 * (1 - Math.abs(j - 1)), { w: 0.4, ink: 'leaf' });
          for (i = 0; i < 6 - (j === 1 ? 0 : 1); i++) {
            var y = y0 + i * 8 + (j === 1 ? 4 : 0), o = s.tap < 0 ? 0 : M.bump(M.seg(tp, 0.1 + i * 0.07 + j * 0.02, 0.5 + i * 0.07 + j * 0.02));
            if (o > 0.2) p.star(x, y, 3.8 * o + 1.2, 1.8, 5, { fill: 'white', w: 0.55, rot: i });
            else p.ellipse(x, y, 2.7, 5.2, { fill: 'white', w: 0.7 });
          }
        }
        for (i = 0; i < 3; i++) { var rx = 40 + i * 10, f = 5 * M.wave(t, 2, i * 0.12) + 5 * e; tube(p, bez([rx, 79], [rx + f * 0.4, 84], [rx - f * 0.3, 90], [rx + f * 0.6, 97], 8), function (q) { return 3.6 - 2.2 * q; }, { fill: 'red', w: 0.6 }); }
        p.circle(50, 22, 14, { fill: 'gold', w: 0.9 });
        for (i = 0; i < 11; i++) p.circle(50 + 11 * Math.cos(i / 11 * TAU), 22 + 11 * Math.sin(i / 11 * TAU), 4.2, { fill: i % 2 ? 'orange' : 'yellow', w: 0.55 });
        p.circle(50, 22, 4, { fill: 'orange', w: 0.5 });
      });
    });
    for (i = 0; i < 2; i++) wisp(p, 76 + i * 5, 36, 26, M.frac(t + i * 0.5), { w: 0.65, ink: 'leaf', alpha: 0.9 });
  }
});

/* ชาเย็น cha yen, Thai iced tea: orange tea in a tall glass, a cloud of milk on top, ice floating, a striped
   straw. Ice bobs, bubbles rise and leave, tendrils of milk drift down. Tap: the straw stirs round — the milk
   swirls fast, the ice clinks round and a splash flies up. */
D.add('cha-yen', {
  fam: 'lanna', tags: ['cha yen', 'thai iced tea', 'tea', 'drink', 'milk', 'ice', 'straw', 'stir', 'orange', 'ชาเย็น'], loop: 2.4, still: 0.3, tapLen: 1.8, burst: 'drop', burstAt: [50, 24], burstN: 5, burstSpread: 2,
  margin: [14, 18, 6, 18], about: 'the ice bobs, bubbles rise and leave, tendrils of milk drift down', tapAbout: 'the straw stirs round, the milk swirls, the ice clinks and a splash flies up',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), st = s.tap < 0 ? 0 : M.ease(M.seg(tp, 0.05, 0.85)), ph = TAU * 3 * st, wl = function (y) { return 28 + 7 * (y - 20) / 70; }, i, q;
    var env = s.tap < 0 ? 0 : M.bump(M.seg(tp, 0.05, 0.9));
    p.poly([[wl(32), 32], [100 - wl(32), 32], [65, 90], [35, 90]], { fill: 'orange', line: false });
    var top = []; for (i = 0; i <= 12; i++) top.push([wl(32) + (100 - 2 * wl(32)) * i / 12, 46 + 3 * Math.sin(TAU * (i / 6 - t)) + 3 * env * Math.sin(ph + i)]);
    p.poly([[wl(32), 32], [100 - wl(32), 32]].concat(top.slice().reverse()), { fill: 'cream', line: false });
    for (i = 0; i < 3; i++) {
      var x0 = 42 + i * 8, pts = []; for (q = 0; q <= 8; q++) pts.push([x0 + (3 + 2 * env) * Math.sin(TAU * (q / 4 - t + i / 3) + ph), 46 + q * 4.6]);
      p.curve(pts, { w: 1.5, ink: 'cream', cap: 'round' });
    }
    for (i = 0; i < 3; i++) { var bp = M.frac(t + i / 3), r = 1.7 * Math.pow(Math.sin(Math.PI * bp), 0.6); if (r > 0.3) p.circle(41 + i * 9 + 2 * Math.sin(TAU * (bp * 2 + i)), 86 - 52 * bp, r, { w: 0.5, ink: 'white' }); }
    [[39, 28, 0.0], [56, 25, 0.3], [47, 36, 0.6]].forEach(function (c, k) {
      var a = TAU * (k / 3) + ph * 0.6, ox = 6 * env * Math.cos(a), oy = 3 * env * Math.sin(a), y = c[1] + 1.6 * M.wave(t, 1, c[2]) + oy;
      p.at(c[0] + ox, y, 0.3 * M.wave(t, 1, c[2] + 0.2) + env * 0.6 * Math.sin(ph + k), 1, function () { p.rect(-6.5, -6, 13, 12, { fill: 'white', r: 2.6, w: 0.75, alpha: 0.85 }); p.path('M-3.5 -2.5 L-1 -4.5', { w: 0.4, ink: 'sky', detail: true }); });
    });
    var sa = 0.25 * Math.sin(ph) * env;
    p.pivot(50, 92, 0.1 + 0.14 * M.wave(t, 1, 0.3) * (1 - env) + sa, 1, function () { p.line(50, 92, 50, 2, { w: 2.5, ink: 'red', cap: 'round' }); p.line(50, 92, 50, 2, { w: 0.9, ink: 'white', dash: [4, 4.5], cap: 'round' }); });
    p.path('M28 20 L35 90 L65 90 L72 20', { w: 0.95 }); p.ellipse(50, 20, 22, 3, { w: 0.9 });
    p.line(33, 28, 36.5, 76, { w: 0.5, ink: 'white', alpha: 0.9, detail: true });
  }
});
/* the hongsa (หงส์), Hongdam's black swan: curled Lanna flame feathers with gold ribs, a red bill with its white band,
   red eyes, black webbed feet. One body in its own frame (facing right, centre 0 0), posed by hongsa (on water),
   hongsa-walk (waddling) and hongsa-stand (on land). */
function feather(p, x, y, ang, len, ph, small) {
  p.at(x, y, ang, 1, function () {
    var sp = bez([0, 0], [-len * 0.18, -len * 0.42], [-len * 0.5, -len * 0.78], [-len * 0.95, -len * 0.82], 14), n = sp.length;
    var h = Math.atan2(sp[n - 1][1] - sp[n - 2][1], sp[n - 1][0] - sp[n - 2][0]), st = Math.hypot(sp[n - 1][0] - sp[n - 2][0], sp[n - 1][1] - sp[n - 2][1]), q = sp[n - 1].slice(), k, curl = 0.42 + 0.05 * Math.sin(TAU * ph);
    for (k = 0; k < 18; k++) { h -= curl; st *= 0.9; q = [q[0] + Math.cos(h) * st, q[1] + Math.sin(h) * st]; sp.push(q); }
    var w0 = Math.min(8, 0.4 * len);
    tube(p, sp, function (s) { return w0 * Math.pow(1 - s, 0.85) + 0.9; }, { fill: 'black' });
    if (!small) p.curve(sp.slice(3, sp.length - 3), { ink: 'a', w: 0.5, wob: 0.4 });
  });
}
/* a raised wing from the shoulder, white flight feathers at its tip; k 0..1 how far it has opened */
function wingShape(p, far) {
  p.path('M0 0 C-4 -20 -22 -36 -46 -38 C-40 -31 -38 -25 -40 -18 C-33 -16 -29 -9 -31 -2 C-20 -3 -9 -1 0 0 Z', { fill: far ? 'night' : 'black', w: 0.7 });
  [[-41, -31, 0.5], [-37, -22, 0.35], [-34, -13, 0.2], [-27, -6, 0.1]].forEach(function (f) { p.ellipse(f[0], f[1], 5.2, 2.2, { fill: 'white', w: 0.4, rot: f[2] }); });
}
function swanWing(p, x, y, ang, k, far) {
  if (k < 0.02) return;
  p.at(x, y, ang, k, function () { wingShape(p, far); });
}
/* a wing beating in flight, seen from the side: it beats across the line of sight, so it shows long when it is up or
   down and short as it passes level. e its elevation, −1 straight down .. 1 straight up; k its length; sw leans it back */
function flyWing(p, x, y, e, k, sw, far) {
  if (k < 0.02) return;
  var ey = e < 0 ? Math.min(-0.16, e) : Math.max(0.16, e);
  p.at(x, y, sw - 0.2, [k, k * ey], function () { p.pivot(0, 0, 0.88, 1, function () { wingShape(p, far); }); });
}
/* one red eye, k its height (a blink) */
function swanEye(p, x, y, k) { p.at(x, y, 0, [1, Math.max(0.1, k)], function () { p.dot(0, 0, 1.9, 'red'); p.dot(0.5, -0.5, 0.65, 'white'); }); }
/* the head at its own origin, facing +x; turn 0 in profile, 1 looking straight at you; open 0..1 the bill open (a honk) */
function swanHead(p, turn, blink, small, open) {
  var side = 1 - turn, k = 1 - blink, op = open || 0;
  p.ellipse(0, 0, 7 - 1.2 * turn, 4.9 + 1.2 * turn, { fill: 'black', rot: -0.16 * side });
  if (side > 0.02) p.pivot(4.6, 0, 0, [Math.max(0.02, side), 1], function () {
    if (op > 0.02) {
      p.pivot(4.6, 1.6, 0.5 * op, 1, function () { p.path('M4.6 1.2 L16.8 3 C16.6 4.8 13.8 5.4 11.6 5.1 L4.6 3.8 Z', { fill: 'red', w: 0.8 }); });
      p.path('M5 0.4 L14 ' + (2.6 + 2.4 * op) + ' L5 ' + (2.8 + 1.4 * op) + ' Z', { fill: 'night', line: false });
    }
    p.pivot(4.6, 0.4, -0.16 * op, 1, function () {
      p.path(op > 0.02 ? 'M4.6 -3.2 L19.4 1.4 C19.6 2.6 18 3.2 15.6 3 L4.6 1.4 Z' : 'M4.6 -3.2 L19.4 1.4 C20 3.6 17.4 5 14.6 4.8 L4.6 3.6 Z', { fill: 'red' });
      p.line(13.6, 0, 13, op > 0.02 ? 2.8 : 4.6, { ink: 'white', w: 1, wob: 0.3 });
    });
  });
  if (turn > 0.02) p.pivot(0, 2, 0, Math.max(0.02, turn), function () {
    p.path('M-3.6 1.4 C-3.6 -0.4 3.6 -0.4 3.6 1.4 L1.3 10.6 C0.7 11.8 -0.7 11.8 -1.3 10.6 Z', { fill: 'red' });
    p.line(-2.4, 6.4, 2.4, 6.4, { ink: 'white', w: 0.9, wob: 0.3 });
    if (!small) { p.dot(-1.1, 2.8, 0.45, 'black'); p.dot(1.1, 2.8, 0.45, 'black'); }
  });
  swanEye(p, M.lerp(1.9, -3.1, turn), -1.7, k);
  if (turn > 0.35) swanEye(p, 3.1, -1.7, k);
}
/* a leg from the hip (hx, hy) to the ankle (ax, ay) and its red webbed foot (her word 2026-10-24: "flappy pink/red
   feet"), seen from the side, at angle fa (0 flat with the toes forward, more turns the toes down); spread 1 the web
   open, 0 folded shut, above 1 slapped down flat and wide */
function swanLeg(p, hx, hy, ax, ay, fa, spread, far, big, alpha) {
  var c = far ? 'red' : 'rose', s = Math.max(0, spread), k = big || 1, al = alpha == null ? 1 : alpha, h = 0.9 + 2.5 * s, L = 10.5 + 1.6 * Math.min(1, s), top = -0.4 - 0.5 * h;
  p.line(hx, hy, ax, ay, { w: 1.7 * k, ink: c, cap: 'round', alpha: al });
  p.at(ax, ay, fa, k, function () {
    p.path('M-1.6 -0.8 L' + L + ' ' + top + ' Q' + (L + 2.4) + ' ' + (0.2 * h) + ' ' + L + ' ' + h + ' L-0.6 1.4 Z', { fill: c, w: 0.6, alpha: al });
    if (s > 0.45 && !p.small) [0.3, 0.7].forEach(function (f) { p.line(0.6, 0.2, L - 0.6, top + (h - top) * f, { ink: 'red', w: 0.35, alpha: al }); });
  });
}
/* the body: a long low boat, the tail end raised and pointed, a full breast, a flat keel. A swan stands low on short
   legs set far back (a long neck on a body raised on long legs reads as an ostrich: Michael, 2026-10-24) */
var SW_BODY = 'M-40 -7 C-31 -15 -9 -18 11 -15 C25 -13 35 -6 34 3 C33 11 20 16 2 16 C-16 16 -31 10 -40 -7 Z';
/* the poses give a standing body's centre at y 66; it is drawn this much lower, so the legs show short */
var SW_DY = 4;
/* where the feet stand, from the body's centre: near, far */
var SW_FN = -1, SW_FF = -11;
/* where a leg meets the body, in the box: set back from the middle, the far one further back */
function swHip(o, far) { var hx = far ? -12 : -6, hy = 11, a = o.tilt || 0, c = Math.cos(a), s = Math.sin(a); return [o.x + hx * c - hy * s, o.y + SW_DY + hx * s + hy * c]; }
/* the whole bird. o: x y (body centre), tilt (+ nose down), neck 0 upright, 1 diving, look, blink, wings 0..1, flap,
   head (extra head angle), legs(p, behind) draws the legs in the body frame, sway (feather wag), t (feather curl),
   open (the bill, a honk); or N, a pose from NK below, for the neck and head instead of neck and look;
   wing(p, far) draws the wings instead (in flight) */
function swan(p, o) {
  var neck = o.neck || 0, look = o.look || 0, wings = o.wings || 0, flap = o.flap || 0, N = o.N;
  if (!N) { N = nk(nk(NK.rest, NK.at, look), NK.dive, neck); N.H = [N.H[0] + (o.reach || 0), N.H[1] - 4 * wings * (1 - neck)]; }
  /* face 1 the head in profile facing forward, 0 at you, -1 in profile facing back over its shoulder */
  var face = N.face, ha = N.a + (o.head || 0);
  p.at(o.x, o.y + SW_DY, o.tilt || 0, o.k || 1, function () {
    if (o.wing) o.wing(p, true); else swanWing(p, 4, -13, 0.55 + flap * 0.55, wings * 1.15, true);
    if (o.legs) o.legs(p, true);
    var sw = o.sway || 0;
    feather(p, -27, -8, -0.42 + sw, 15, o.t || 0, p.small);
    feather(p, -17, -12, -0.2 + sw * 0.8, 18, (o.t || 0) + 0.3, p.small);
    feather(p, -6, -14, 0.02 + sw * 0.6, 13, (o.t || 0) + 0.6, p.small);
    p.path(SW_BODY, { fill: 'black' });
    if (!p.small && wings < 0.3 && !o.wing) p.path('M-25 -4 C-20 -7 -15 -6 -11 -4 C-7 -7 -2 -6 2 -3 C6 -6 10 -5 14 -2', { ink: 'grey', w: 0.5, detail: true });
    if (o.legs) o.legs(p, false);
    var sp = bez([25, -9], N.C1, N.C2, N.H, 18);
    tube(p, sp, function (s) { return 10.6 - 4.6 * Math.pow(s, 0.8); }, { fill: 'black', w: 0.7 });
    p.at(N.H[0], N.H[1], ha, face < 0 ? [-1, 1] : 1, function () { swanHead(p, 1 - Math.abs(face), o.blink || 0, p.small, o.open); });
    if (o.wing) o.wing(p, false); else swanWing(p, 0, -11, 0.75 + flap * 0.65, wings * 1.2, false);
  });
}
D.add('hongsa', {
  fam: 'lanna', tags: ['swan', 'black swan', 'hamsa', 'hongdam', 'bird', 'water', 'paddle', 'dive', 'lanna', '🦢'], loop: 10, still: 0.12, ratio: 1.2, burst: 'note', burstAt: [96, 16], burstN: 4, burstSpread: 2.4, burstDelay: 0.12, tapLen: 2, tapRest: 0.25, margin: [34, 20, 14, 20],
  about: 'the black swan paddles with its feet under the water, turns to look at you and blinks, up-ends with its head underwater and its feet kicking, comes up, rears and flaps the water off its wings, shakes its head',
  tapAbout: 'it turns to look at you, honks, rears up and beats its wings',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, bump = M.bump, W = 72, i;
    var look = ez(seg(t, 0.28, 0.32)) * (1 - ez(seg(t, 0.44, 0.48)));
    var blink = bump(seg(t, 0.385, 0.41)) + bump(seg(t, 0.06, 0.08)) + bump(seg(t, 0.2, 0.22));
    var dive = ez(seg(t, 0.52, 0.575)) * (1 - ez(seg(t, 0.7, 0.76)));
    var rear = ez(seg(t, 0.765, 0.795)) * (1 - ez(seg(t, 0.88, 0.92)));
    var flap = rear * Math.sin(TAU * 3 * seg(t, 0.785, 0.885));
    var shake = Math.sin(TAU * 4 * seg(t, 0.925, 0.975)) * bump(seg(t, 0.925, 0.975));
    if (s.tap >= 0) {
      var q = s.tap, tw = ez(seg(q, 0, 0.12)) * (1 - ez(seg(q, 0.85, 1)));
      look = Math.max(look * (1 - tw), ez(seg(q, 0, 0.12)) * (1 - ez(seg(q, 0.3, 0.42))));
      dive *= 1 - tw;
      rear = Math.max(rear * (1 - tw), ez(seg(q, 0.3, 0.42)) * (1 - ez(seg(q, 0.86, 1))));
      flap = rear * Math.sin(TAU * 3 * seg(q, 0.38, 0.88));
    }
    var pad = TAU * 20 * t, kick = dive > 0.5 ? TAU * 36 * t : pad;
    var x = 54, y = 64 + 1.1 * M.wave(t, 5) - 10 * dive - 13 * rear;
    if (!p.small) for (i = 0; i < 2; i++) { var u = M.frac(t * 5 + i / 2); p.ellipse(x + 30, W + 1, 6 + 16 * u, 1.4 + 2.2 * u, { ink: 'sky', w: 0.6, alpha: 0.85 * (1 - u) * (1 - dive), fill: false }); }
    swan(p, {
      x: x, y: y, tilt: 0.85 * dive - 0.38 * rear, neck: dive, look: look, blink: Math.min(1, blink), wings: rear, flap: flap, head: 0.25 * shake, sway: 0.04 * M.wave(t, 5, 0.1), t: t,
      legs: function (p, far) {
        var ph = far ? kick + Math.PI : kick, a = 0.5 + 0.42 * Math.sin(ph), power = Math.cos(ph) > 0 ? 1 : 0.15, hx = far ? -12 : -6, hy = 11;
        if (rear > 0.3) { a = 0.15 + 0.3 * Math.sin(ph * 1.5); power = 1; }
        var ax = hx - 15 * Math.sin(a), ay = hy + 15 * Math.cos(a);
        swanLeg(p, hx, hy, ax, ay, -0.25 + 0.6 * Math.sin(ph) * (1 - rear), power, far);
      }
    });
    /* the water: what is under it is seen through it */
    var top = sinew(2, 118, W, 1.3, 24, t * 3);
    p.path('M' + top.map(function (q) { return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' L') + ' L118 92 Q60 101 2 92 Z', { fill: 'sky', line: false, alpha: 0.42 });
    p.curve(top, { ink: 'sky', w: 0.9 });
    if (p.small) return;
    var spl = function (u, x0, n, h) { if (u <= 0 || u >= 1) return; for (var j = 0; j < n; j++) { var r = M.rng(97 + j * 13 + n)(), vx = (j - (n - 1) / 2) * 5.5 * (0.6 + r), vy = h * (0.6 + 0.6 * r); p.dot(x0 + vx * u, W - vy * u + 2.4 * vy * u * u, 1.5 * (1 - 0.5 * u), 'sky'); } };
    spl(seg(t, 0.545, 0.62), x + 26, 7, 26);
    spl(seg(t, 0.715, 0.79), x + 20, 6, 22);
    for (i = 0; i < 4; i++) { var bu = seg(t, 0.585 + i * 0.03, 0.66 + i * 0.03); if (bu > 0 && bu < 1) p.circle(x + 22 + 3 * Math.sin(TAU * bu * 2 + i), 90 - 18 * bu, 1 + 0.6 * i % 2, { ink: 'sky', w: 0.5, fill: false }); }
    var wu = seg(t, 0.8, 0.9);
    if (wu > 0 && wu < 1) for (i = 0; i < 6; i++) p.dot(x - 30 - 9 * i * wu, y - 40 + 10 * i * wu + 60 * wu * wu, 1.3 * (1 - wu), 'sky');
  }
});
D.add('hongsa-walk', {
  fam: 'lanna', tags: ['swan', 'black swan', 'hongdam', 'walk', 'waddle', 'feet', 'bird', '🦢'], loop: 0.9, still: 0.25, ratio: 1.2, burst: 'note', burstAt: [96, 16], burstN: 3, burstSpread: 2.2, tapLen: 1.6, tapRest: 0.3, margin: [34, 20, 12, 20],
  about: 'the black swan waddles on black webbed feet: a foot lifts, folds, swings forward and plants flat; the body rolls side to side and the flame feathers wag behind',
  tapAbout: 'it stops, looks at you, honks and flaps',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, ph = TAU * t, G = 93, tw = 0, look = 0, wings = 0, flap = 0;
    if (s.tap >= 0) { var q = s.tap; tw = ez(seg(q, 0, 0.12)) * (1 - ez(seg(q, 0.86, 1))); look = tw; wings = ez(seg(q, 0.25, 0.38)) * (1 - ez(seg(q, 0.78, 0.92))); flap = wings * Math.sin(TAU * 2.5 * seg(q, 0.3, 0.85)); }
    var go = 1 - tw, roll = 0.11 * Math.sin(ph) * go, x = 54, y = 66 - 2.2 * Math.abs(Math.sin(ph)) * go;
    p.ellipse(x + 2, G + 0.5, 22, 2.6, { fill: 'smoke', line: false, alpha: 0.55 });
    var foot = function (far) {
      var u = M.frac(t + (far ? 0.5 : 0)), st = u < 0.5, v = st ? u / 0.5 : (u - 0.5) / 0.5;
      var fx = st ? M.lerp(10, -10, v) : M.lerp(-10, 10, ez(v)), lift = st ? 0 : 6 * M.bump(v);
      fx *= go; lift *= go;
      var h = swHip({ x: x, y: y, tilt: roll - 0.14 }, far);
      return { hx: h[0], hy: h[1], ax: x - 6 + fx + (far ? -2 : 0), ay: G - 2.6 - lift, fa: st || !go ? 0 : 0.55 * M.bump(v), spread: st ? 0.45 : 0.3 + 0.15 * (1 - go) };
    };
    var legs = function (far) { var f = foot(far); swanLeg(p, f.hx, f.hy, f.ax, f.ay, f.fa, f.spread, far, 1.4); };
    legs(true);
    swan(p, { x: x, y: y, tilt: roll - 0.14, look: look, wings: wings, flap: flap, sway: 0.13 * Math.sin(ph + 0.5) * go, reach: 1.5 * Math.sin(2 * ph) * go, t: t });
    legs(false);
  }
});
D.add('hongsa-stand', {
  fam: 'lanna', tags: ['swan', 'black swan', 'hongdam', 'stand', 'look', 'flap', 'bird', '🦢'], loop: 7, still: 0.36, ratio: 1.2, burst: 'note', burstAt: [96, 16], burstN: 3, burstSpread: 2.2, tapLen: 1.6, tapRest: 0.3, margin: [34, 20, 12, 20],
  about: 'the black swan stands on its webbed feet: its flame feathers stir, it turns to look at you and blinks, stretches up and flaps, then shuffles its feet and settles',
  tapAbout: 'it looks at you, honks and flaps',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, bump = M.bump, G = 93;
    var look = ez(seg(t, 0.24, 0.29)) * (1 - ez(seg(t, 0.5, 0.55)));
    var blink = Math.min(1, bump(seg(t, 0.36, 0.385)) + bump(seg(t, 0.42, 0.445)) + bump(seg(t, 0.1, 0.125)));
    var wings = ez(seg(t, 0.58, 0.62)) * (1 - ez(seg(t, 0.76, 0.8))), flap = wings * Math.sin(TAU * 2 * seg(t, 0.6, 0.78));
    var step = bump(seg(t, 0.84, 0.9)), step2 = bump(seg(t, 0.9, 0.96));
    if (s.tap >= 0) { var q = s.tap; look = Math.max(look, ez(seg(q, 0, 0.12)) * (1 - ez(seg(q, 0.86, 1)))); var tw = ez(seg(q, 0.25, 0.38)) * (1 - ez(seg(q, 0.78, 0.92))); wings = Math.max(wings, tw); flap = wings * Math.sin(TAU * 2.5 * seg(q, 0.3, 0.85)); }
    var x = 54, y = 66 + 0.8 * M.wave(t, 7) - 3 * wings;
    p.ellipse(x + 2, G + 0.5, 20, 2.6, { fill: 'smoke', line: false, alpha: 0.55 });
    var legs = function (far) {
      var h = swHip({ x: x, y: y, tilt: -0.14 - 0.22 * wings }, far), ax = x + (far ? SW_FF : SW_FN) + 3 * step * (far ? 0 : 1) - 3 * step2 * (far ? 1 : 0), lift = 5 * (far ? step2 : step);
      swanLeg(p, h[0], h[1], ax, G - 2.6 - lift, lift > 0.5 ? 0.35 : 0, lift > 0.5 ? 0.3 : 0.45, far, 1.4);
    };
    legs(true);
    swan(p, { x: x, y: y, tilt: -0.14 - 0.22 * wings, look: look, blink: blink, wings: wings, flap: flap, sway: 0.05 * M.wave(t, 7, 0.2), t: t });
    legs(false);
  }
});
/* What the swan does on hongdam.net's job lines (her ask 2026-10-24: "more variety in what they do, and interact
   with each other ... and with the icons"). Each move plays once from the standing pose of hongsa-stand back to
   it, so a page can swap one in mid-walk: the picture of the stop sits above the swan's head, and the line's end
   may hold a mate (the two necks make a heart) or Dam, trotting behind.
   Poses of the neck and head for swan(o.N), in the body frame: H the head, C1 C2 the neck's curve up from the
   chest, a the head's angle, face 1 forward, 0 at you, -1 back over its shoulder. */
var NK = {
  rest: { H: [35, -50], C1: [41, -24], C2: [17, -40], a: 0.4, face: 1 },
  at: { H: [34, -48], C1: [41, -24], C2: [18, -40], a: 0.08, face: 0 },
  dive: { H: [43, 6], C1: [34, -8], C2: [41, -4], a: 1.2, face: 1 },
  up: { H: [46, -70], C1: [40, -26], C2: [30, -54], a: -0.95, face: 1 },
  peek: { H: [41, -58], C1: [41, -25], C2: [24, -46], a: -0.35, face: 1 },
  honk: { H: [53, -48], C1: [43, -20], C2: [34, -40], a: -0.4, face: 1 },
  bow: { H: [48, -4], C1: [43, -20], C2: [55, -34], a: 1.45, face: 1 },
  ground: { H: [50, 7], C1: [38, -16], C2: [55, -22], a: 1.5, face: 1 },
  preen: { H: [-6, -21], C1: [31, -32], C2: [13, -46], a: -0.75, face: -1 },
  tuck: { H: [-8, -18], C1: [31, -28], C2: [13, -38], a: -0.2, face: -1 },
  nuzzle: { H: [51, -32], C1: [42, -20], C2: [57, -46], a: 1.2, face: 1 },
  heart: { H: [33, -60], C1: [0, -28], C2: [6, -84], a: 1.35, face: 1 },
  /* hurrying: the neck reaches forward; flying: straight out in front, the head level */
  hurry: { H: [52, -38], C1: [42, -16], C2: [37, -34], a: 0.18, face: 1 },
  fly: { H: [70, -15], C1: [42, -12], C2: [56, -15], a: 0.1, face: 1 }
};
function nk(A, B, u) {
  var L = M.lerp, f = function (a, b) { return [L(a[0], b[0], u), L(a[1], b[1], u)]; };
  return { H: f(A.H, B.H), C1: f(A.C1, B.C1), C2: f(A.C2, B.C2), a: L(A.a, B.a, u), face: L(A.face, B.face, u) };
}
/* a standing swan, body at (o.x, o.y), with its shadow and feet on the ground; ft: step / step2 lift the near / far
   foot, air 0..1 tucks both up under it (a hop), nx / fx put the near / far foot somewhere else (a step forward) */
function standing(p, o, ft) {
  var G = 93, x = o.x, y = o.y, air = ft.air || 0;
  p.ellipse(x + 2, G + 0.5, 20 * (1 - 0.4 * air), 2.6, { fill: 'smoke', line: false, alpha: 0.55 * (1 - 0.4 * air) });
  var leg = function (far) {
    var lift = 5 * (far ? ft.step2 || 0 : ft.step || 0), h = swHip(o, far), hx = h[0], hy = h[1];
    var ax = far ? (ft.fx != null ? ft.fx : x + SW_FF) : (ft.nx != null ? ft.nx : x + SW_FN), ay = G - 2.6 - lift;
    if (air > 0) { ax = M.lerp(ax, hx - 7, air); ay = M.lerp(ay, hy + 10, air); }
    swanLeg(p, hx, hy, ax, ay, air > 0.2 ? 0.8 * air : lift > 0.5 ? 0.35 : 0, air > 0.2 || lift > 0.5 ? 0.3 : 0.45, far, 1.4);
  };
  leg(true); swan(p, o); leg(false);
}
/* a tap on any of these: it turns to look at you, honks and beats its wings */
function swanTap(o, s) {
  if (s.tap < 0) return;
  var q = s.tap, seg = M.seg, ez = M.ease, k = ez(seg(q, 0, 0.12)) * (1 - ez(seg(q, 0.86, 1)));
  o.N = nk(o.N || NK.rest, NK.at, k);
  o.open = Math.max(o.open || 0, M.bump(seg(q, 0.14, 0.32)));
  o.wings = Math.max(o.wings || 0, ez(seg(q, 0.25, 0.38)) * (1 - ez(seg(q, 0.78, 0.92))));
  o.flap = o.wings * Math.sin(TAU * 2.5 * seg(q, 0.3, 0.85));
}
/* a sung note or a heart rising from (x, y) over u 0..1, wavering unless straight (the mates' heart, drawn by both) */
function rise(p, kind, x, y, u, i, colour, straight) {
  if (u <= 0 || u >= 1 || p.small) return;
  var k = 1.05 * M.easeOut(M.seg(u, 0, 0.15)) * (1 - M.easeIn(M.seg(u, 0.6, 1))), wv = straight ? 0 : 1;
  p.at(x + 4 * wv * Math.sin(TAU * u * 1.5 + i), y - 30 * u, 0.3 * wv * Math.sin(TAU * u + i), k, function () { D.bits[kind](p, colour); });
}
var SWAN_MOVE = { fam: 'lanna', ratio: 1.2, still: 0, burst: 'note', burstAt: [96, 16], burstN: 3, burstSpread: 2.2, tapLen: 1.6, tapRest: 0.3, margin: [44, 26, 12, 20], tapAbout: 'it looks at you, honks and flaps' };
function mv(def) { return Object.assign({}, SWAN_MOVE, def); }
D.add('hongsa-peck', mv({
  tags: ['swan', 'black swan', 'hongdam', 'peck', 'reach', 'tap', 'bird', '🦢'], loop: 1.6,
  about: 'the black swan stretches up on its toes and taps what is above it with its bill, twice, then settles and shakes its head',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, bump = M.bump;
    var up = ez(seg(t, 0.04, 0.26)) * (1 - ez(seg(t, 0.68, 0.84))), tap = bump(seg(t, 0.3, 0.42)) + bump(seg(t, 0.46, 0.58));
    var shake = Math.sin(TAU * 3 * seg(t, 0.84, 0.98)) * bump(seg(t, 0.84, 0.98));
    var N = nk(NK.rest, NK.up, up);
    N.H = [N.H[0] + 3 * tap, N.H[1] - 5 * tap]; N.a -= 0.15 * tap;
    var o = { x: 54, y: 66 - 3 * up, tilt: -0.14 - 0.12 * up, N: N, head: 0.3 * shake, blink: bump(seg(t, 0.62, 0.66)), sway: 0.04 * Math.sin(TAU * 2 * t), t: t };
    swanTap(o, s);
    standing(p, o, {});
  }
}));
D.add('hongsa-hop', mv({
  tags: ['swan', 'black swan', 'hongdam', 'hop', 'jump', 'bird', '🦢'], loop: 1.1,
  about: 'the black swan crouches, jumps straight up with its wings half open and its feet tucked, bumps what is above it with its head, and lands with a bounce',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, bump = M.bump;
    var crouch = bump(seg(t, 0, 0.22)) + 0.8 * bump(seg(t, 0.68, 0.88)), air = seg(t, 0.18, 0.7), h = air > 0 && air < 1 ? 4 * air * (1 - air) : 0;
    var wings = ez(seg(t, 0.16, 0.26)) * (1 - ez(seg(t, 0.62, 0.74))), flap = wings * Math.sin(TAU * 2 * seg(t, 0.2, 0.7));
    var o = { x: 54, y: 66 + 4 * crouch - 28 * h, tilt: -0.14 + 0.12 * crouch - 0.1 * h, N: nk(NK.rest, NK.peek, 0.6 * bump(seg(t, 0.12, 0.76))), wings: 0.8 * wings, flap: flap, sway: 0.08 * h, t: t };
    swanTap(o, s);
    standing(p, o, { air: Math.min(1, 3 * h) });
  }
}));
D.add('hongsa-flap', mv({
  tags: ['swan', 'black swan', 'hongdam', 'flap', 'wings', 'bird', '🦢'], loop: 1.6,
  about: 'the black swan rears up and beats its wings three times; a loose white feather drifts down; it shuffles its feet and settles',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, bump = M.bump;
    var rear = ez(seg(t, 0.06, 0.2)) * (1 - ez(seg(t, 0.78, 0.92))), flap = rear * Math.sin(TAU * 3 * seg(t, 0.18, 0.8));
    var o = { x: 54, y: 66 - 4 * rear, tilt: -0.14 - 0.26 * rear, N: nk(NK.rest, NK.peek, 0.5 * rear), wings: rear, flap: flap, sway: 0.1 * rear * Math.sin(TAU * 6 * t), t: t };
    swanTap(o, s);
    standing(p, o, { step: bump(seg(t, 0.84, 0.92)), step2: bump(seg(t, 0.9, 0.98)) });
    var fu = seg(t, 0.35, 1);
    if (!p.small && fu > 0 && fu < 1) p.at(30 - 20 * fu + 5 * Math.sin(TAU * 2 * fu), 12 + 72 * fu, 0.7 * Math.sin(TAU * 1.5 * fu), 1, function () {
      var a = 1 - M.easeIn(seg(fu, 0.7, 1));
      p.ellipse(0, 0, 5, 1.8, { fill: 'white', w: 0.5, alpha: a }); p.line(-5, 0, 4, 0, { w: 0.35, ink: 'grey', alpha: a });
    });
  }
}));
D.add('hongsa-honk', mv({
  tags: ['swan', 'black swan', 'hongdam', 'honk', 'call', 'sing', 'bird', '🦢'], loop: 1.5,
  about: 'the black swan stretches its neck forward, opens its red bill and honks twice; two notes float up',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, bump = M.bump;
    var st = ez(seg(t, 0.04, 0.2)) * (1 - ez(seg(t, 0.78, 0.94))), h1 = bump(seg(t, 0.24, 0.4)), h2 = bump(seg(t, 0.46, 0.62));
    var N = nk(NK.rest, NK.honk, st);
    N.H = [N.H[0] + 3 * (h1 + h2), N.H[1] - 2 * (h1 + h2)];
    var o = { x: 54, y: 66 - 1.5 * st, tilt: -0.19 * st - 0.14 * (1 - st), N: N, open: Math.min(1, h1 + h2), sway: 0.04 * Math.sin(TAU * 2 * t), t: t };
    swanTap(o, s);
    standing(p, o, {});
    rise(p, 'note', 124, 6, seg(t, 0.26, 0.7), 0);
    rise(p, 'note', 130, 8, seg(t, 0.48, 0.92), 1);
  }
}));
D.add('hongsa-bow', mv({
  tags: ['swan', 'black swan', 'hongdam', 'bow', 'wai', 'greet', 'thank', 'bird', '🦢'], loop: 1.9,
  about: 'the black swan bows low with its eyes closed, a wai, holds it, and rises',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, b = ez(seg(t, 0.06, 0.3)) * (1 - ez(seg(t, 0.68, 0.9)));
    var shut = ez(seg(t, 0.26, 0.32)) * (1 - ez(seg(t, 0.6, 0.66)));
    var o = { x: 54, y: 66 + 2 * b, tilt: -0.14 + 0.18 * b, N: nk(NK.rest, NK.bow, b), blink: shut, sway: 0.03 * Math.sin(TAU * t), t: t };
    swanTap(o, s);
    standing(p, o, {});
  }
}));
D.add('hongsa-look', mv({
  tags: ['swan', 'black swan', 'hongdam', 'look', 'curious', 'wonder', 'bird', '🦢'], loop: 1.8,
  about: 'the black swan looks up at what is above it, tips its head one way and the other, blinks twice, and a question mark comes and goes',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, bump = M.bump;
    var lk = ez(seg(t, 0.04, 0.2)) * (1 - ez(seg(t, 0.78, 0.94))), tip = Math.sin(TAU * seg(t, 0.24, 0.72)) * bump(seg(t, 0.24, 0.72));
    var N = nk(NK.rest, NK.peek, lk);
    N.a += 0.35 * tip; N.H = [N.H[0] - 2 * tip, N.H[1]];
    var o = { x: 54, y: 66, tilt: -0.14, N: N, blink: Math.min(1, bump(seg(t, 0.4, 0.45)) + bump(seg(t, 0.5, 0.55))), sway: 0.03 * Math.sin(TAU * t), t: t };
    swanTap(o, s);
    standing(p, o, {});
    var qa = bump(seg(t, 0.28, 0.76));
    if (!p.small && qa > 0.02) p.at(76, 2 - 4 * qa, 0.15 * tip, 0.9 * qa, function () { p.path('M-3.5 -4 C-3.5 -9 4.5 -9 4.5 -4 C4.5 -0.5 0.5 -0.5 0.5 3', { w: 1.1, cap: 'round' }); p.dot(0.5, 7, 1, 'ink'); });
  }
}));
/* The heart: a mate waits at the end of the line, drawn as this same swan mirrored in the box next to it. Both
   step forward until their chests touch at the shared edge, arch their necks and bow their heads until the bills
   meet: two necks, one heart. A heart rises from where the heads touch. */
D.add('hongsa-court', mv({
  tags: ['swan', 'black swan', 'hongdam', 'heart', 'love', 'pair', 'mate', 'bird', '🦢'], loop: 5,
  about: 'the black swan steps forward to its mate (the same swan mirrored beside it), arches its neck and bows its head until the bills touch, so the two necks make a heart; a heart rises; they hold it, then straighten',
  margin: [56, 30, 12, 20],
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, bump = M.bump, x0 = 54, x1 = 84;
    var go = seg(t, 0.02, 0.2), x = M.lerp(x0, x1, ez(go)), back = ez(seg(t, 0.9, 0.99)), bx = M.lerp(x, x0, back);
    var arch = ez(seg(t, 0.2, 0.34)) * (1 - ez(seg(t, 0.8, 0.9))), sway = Math.sin(TAU * 2 * seg(t, 0.34, 0.8)) * arch;
    var N = nk(NK.rest, NK.heart, arch);
    N.H = [N.H[0], N.H[1] + 1.2 * sway];
    var o = { x: bx, y: 66 + 1.5 * arch, tilt: -0.14 + 0.08 * arch, N: N, blink: Math.min(1, ez(seg(t, 0.36, 0.4)) * (1 - ez(seg(t, 0.72, 0.76)))), sway: 0.05 * sway, t: t };
    swanTap(o, s);
    var nf = M.lerp(x0 + SW_FN, x1 + SW_FN, ez(seg(go, 0, 0.5))), ff = M.lerp(x0 + SW_FF, x1 + SW_FF, ez(seg(go, 0.5, 1)));
    standing(p, o, { nx: M.lerp(nf, bx + SW_FN, back), fx: M.lerp(ff, bx + SW_FF, back), step: bump(seg(go, 0, 0.5)) + bump(seg(t, 0.9, 0.945)), step2: bump(seg(go, 0.5, 1)) + bump(seg(t, 0.945, 0.99)) });
    rise(p, 'heart', 120, -2, seg(t, 0.34, 0.74), 0, 'red', true);
  }
}));
/* Dam has run ahead of it; the swan bends its neck down to the little one in front and nuzzles it twice */
D.add('hongsa-nuzzle', mv({
  tags: ['swan', 'black swan', 'hongdam', 'nuzzle', 'chick', 'dam', 'parent', 'bird', '🦢'], loop: 2.4,
  about: 'the black swan bends its neck down to whatever stands in front of it (Dam, on the job lines), nuzzles it twice with its eyes half shut, and a heart rises',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, bump = M.bump, b = ez(seg(t, 0.06, 0.28)) * (1 - ez(seg(t, 0.74, 0.92)));
    var nuz = bump(seg(t, 0.32, 0.44)) + bump(seg(t, 0.48, 0.6));
    var N = nk(NK.rest, NK.nuzzle, b);
    N.H = [N.H[0] + 1.5 * nuz, N.H[1] + 3 * nuz]; N.a += 0.12 * nuz;
    var o = { x: 54, y: 66 + 1.5 * b, tilt: -0.14 + 0.1 * b, N: N, blink: 0.6 * ez(seg(t, 0.3, 0.34)) * (1 - ez(seg(t, 0.62, 0.66))), sway: 0.06 * b * Math.sin(TAU * 3 * t), t: t };
    swanTap(o, s);
    standing(p, o, {});
    rise(p, 'heart', 112, 8, seg(t, 0.38, 0.84), 0, 'red');
  }
}));
/* Standing about after the job: it looks at you, preens, grazes, stretches and flaps, honks, dozes and shakes
   itself awake. A page starts each one at its own place in the loop, so no two swans on it keep time. */
D.add('hongsa-idle', {
  fam: 'lanna', tags: ['swan', 'black swan', 'hongdam', 'idle', 'preen', 'graze', 'doze', 'bird', '🦢'], loop: 22, still: 0.02, ratio: 1.2, burst: 'note', burstAt: [96, 16], burstN: 3, burstSpread: 2.2, tapLen: 1.6, tapRest: 0.3, margin: [44, 26, 12, 20],
  about: 'the black swan stands about: it looks at you and blinks, preens under its feathers, grazes twice, stretches up and flaps, honks, tucks its head back and dozes, then shakes itself awake and shuffles its feet',
  tapAbout: 'it looks at you, honks and flaps',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, bump = M.bump, w = function (a, b, e) { e = e || 0.012; return ez(seg(t, a, a + e)) * (1 - ez(seg(t, b - e, b))); };
    var look = w(0.06, 0.15, 0.01), preen = w(0.19, 0.33), graze = w(0.37, 0.47), stretch = w(0.51, 0.59, 0.01), honk = w(0.63, 0.69, 0.008), doze = w(0.73, 0.88, 0.02), shake = bump(seg(t, 0.885, 0.915));
    var N = NK.rest;
    N = nk(N, NK.at, look);
    N = nk(N, NK.preen, preen); N = nk(N, NK.ground, graze); N = nk(N, NK.peek, 0.6 * stretch); N = nk(N, NK.honk, honk); N = nk(N, NK.tuck, doze);
    var nib = preen * Math.sin(TAU * 9 * seg(t, 0.21, 0.31)), peck = graze * (bump(seg(t, 0.39, 0.42)) + bump(seg(t, 0.43, 0.46)));
    N.H = [N.H[0] + 1.5 * nib, N.H[1] + 1.5 * nib + 4 * peck];
    var open = honk * (bump(seg(t, 0.645, 0.66)) + bump(seg(t, 0.665, 0.68)));
    var blink = Math.min(1, bump(seg(t, 0.03, 0.036)) + bump(seg(t, 0.1, 0.106)) + bump(seg(t, 0.13, 0.136)) + bump(seg(t, 0.95, 0.956)) + doze);
    var flap = stretch * Math.sin(TAU * 2 * seg(t, 0.52, 0.58)), wings = stretch;
    var o = { x: 54, y: 66 + 0.8 * M.wave(t, 22) - 3 * stretch + 2.5 * doze, tilt: -0.14 - 0.2 * stretch + 0.2 * graze + 0.05 * doze, N: N, head: 0.3 * Math.sin(TAU * 4 * seg(t, 0.885, 0.915)) * shake, open: open, blink: blink, wings: wings, flap: flap, sway: 0.05 * M.wave(t, 22, 0.2) + 0.1 * preen * Math.sin(TAU * 7 * t) + 0.12 * shake, t: t * 3 };
    swanTap(o, s);
    standing(p, o, { step: bump(seg(t, 0.92, 0.95)), step2: bump(seg(t, 0.95, 0.98)) });
    if (!p.small && doze > 0.5) [0, 1, 2].forEach(function (i) { var u = M.frac((t - 0.75) * 9 + i / 3); p.at(36 + 6 * u + 4 * i, 18 - 26 * u, 0, 0.5 + 0.4 * u, function () { p.path('M-3 -3 L3 -3 L-3 3 L3 3', { w: 0.9, alpha: (doze - 0.5) * 2 * M.bump(u) }); }); });
    rise(p, 'note', 126, 6, seg(t, 0.645, 0.7), 0);
  }
});
/* The swan on the move (her word 2026-10-24: the job-line swans "need to be more lifelike and follow physics better.
   Walking or swimming or flying."). The page that moves the swan (hongdam.net shop.js) works out where it is, how fast,
   and where each foot is planted, and passes the pose as s.rig every frame; alone it walks on the spot. A rig, every
   length in this box's units (100 high):
     water  the line it is on is water (wy its surface, lw how thick it is drawn); w 0 out of it .. 1 afloat
     alt    how far the body has risen (taking off, flying); bob, tilt, roll  the body's give
     ft     [[dx, lift, foot angle, spread] near foot, [..] far foot] while it steps: dx from the body's centre
     pad    the paddle stroke while it swims, in strokes; tuck 0..1 legs folded back to fly; fwd 0..1 reaching to land
     hurry, fly  0..1: the neck reaching forward, then straight out
     wo we wk wsw  wings open 0..1, their elevation −1 down .. 1 up, their length, how far they lean back
     look blink open  the head; act {k: dip | rear | look | honk | court | nuzzle, u: 0..1} something it does afloat
     v      its speed (a bow wave); rip [[dx, age 0..1]] ripples it left; spl [[dx, age s, size, on land]] splashes or dust */
/* body frame → box, for a swan drawn by swan(o) */
function swBox(o, px, py) { var a = o.tilt || 0, c = Math.cos(a), s = Math.sin(a); return [o.x + px * c - py * s, o.y + SW_DY + px * s + py * c]; }
/* drops thrown up from (x, y), falling back, age in seconds */
function drops(p, x, y, age, size, colour, seed) {
  if (age < 0 || age > 0.6 || p.small) return;
  var R = M.rng(seed || 7), n = 5, j;
  for (j = 0; j < n; j++) {
    var vx = (j - (n - 1) / 2) * 26 * size * (0.7 + 0.6 * R()), vy = (55 + 40 * R()) * size, dy = -vy * age + 190 * age * age;
    if (dy > 2) continue;
    p.dot(x + vx * age, y + dy, 1.5 * (1 - age / 0.7) * Math.max(0.6, size), colour);
  }
}
/* what the water shows: ripples spreading behind, the bow wave, splashes; on land, dust */
function waterMarks(p, r, X, top, G) {
  if (p.small) return;
  if (r.water) (r.rip || []).forEach(function (q) {
    var a = q[1], hw = 3 + 15 * a, cx = X + q[0], y = top + 2.4 * a, h = 2.4 * (1 - 0.7 * a);
    p.curve([[cx - hw, y], [cx - hw * 0.45, y - h], [cx + hw * 0.45, y - h], [cx + hw, y]], { ink: 'c', w: 0.95 - 0.45 * a, wob: 0.4 });
  });
  if (r.water && (r.w || 0) > 0.5 && r.v > 15) { var bw = Math.min(1, (r.v - 15) / 110); p.curve([[X + 28, top + 0.5], [X + 37, top - 1 - 3 * bw], [X + 44 + 7 * bw, top + 0.5]], { ink: 'c', w: 0.9, wob: 0.4 }); }
  (r.spl || []).forEach(function (q, i) { drops(p, X + q[0], q[3] ? G : top, q[1], q[2], q[3] ? 'smoke' : 'c', 31 + i * 7 + Math.round(q[0])); });
}
function goSwan(p, t, s, r) {
  var G = 93, X = 54, W = r.wy == null ? 93 : r.wy - (r.lw || 15) / 2, w = r.w || 0, alt = r.alt || 0, fly = r.fly || 0, A = r.act, seg = M.seg, ez = M.ease, bump = M.bump;
  /* W: the water's surface, the top of the line it swims in; afloat, a quarter of the body is under it */
  var o = { x: X, y: M.lerp(66, W - 12, w) - alt - (r.bob || 0), tilt: M.lerp(M.lerp(-0.14, -0.05, w), 0.04, fly) + (r.tilt || 0) + (r.roll || 0), blink: r.blink || 0, open: r.open || 0, sway: r.sway || 0, t: t };
  var N = NK.rest, pad = r.pad, kick = 1, after = null;
  if (r.hurry) N = nk(N, NK.hurry, r.hurry);
  if (fly) N = nk(N, NK.fly, fly);
  if (r.look) N = nk(N, NK.at, r.look);
  if (r.nod) N.H = [N.H[0] + 1.6 * r.nod, N.H[1] + 1.2 * r.nod];
  if (r.preen) { N = nk(N, NK.preen, r.preen); var nb = r.preen * Math.sin(TAU * 7 * t); N.H = [N.H[0] + 1.5 * nb, N.H[1] + 1.5 * nb]; }
  if (A) {
    var u = A.u;
    if (A.k === 'dip') {   /* up-ends: the head goes down under the water, the tail and feet come up, the feet kick */
      var dv = ez(seg(u, 0.06, 0.28)) * (1 - ez(seg(u, 0.7, 0.92)));
      N = nk(N, NK.dive, dv); o.tilt += 0.85 * dv; o.y -= 10 * dv; pad = u * 10; kick = 1 + 0.6 * dv;
      after = function () { drops(p, X + 30, W, (u - 0.2) * 2.4, 0.8, 'c', 5); drops(p, X + 26, W, (u - 0.74) * 2.4, 0.9, 'c', 9); };
    } else if (A.k === 'rear') {   /* rises up on the water and beats its wings */
      var rr = ez(seg(u, 0.06, 0.2)) * (1 - ez(seg(u, 0.8, 0.95)));
      N = nk(N, NK.peek, 0.6 * rr); o.y -= 13 * rr; o.tilt -= 0.4 * rr; o.wings = rr; o.flap = rr * Math.sin(TAU * 3 * seg(u, 0.18, 0.82)); pad = u * 8; kick = 1.4;
      after = function () { var k; for (k = 0; k < 3; k++) drops(p, X - 14 + 12 * k, W, (u - 0.3 - 0.1 * k) * 1.6, 0.7, 'c', 13 + k); };
    } else if (A.k === 'look') {   /* turns to look at you and blinks */
      var lk = ez(seg(u, 0.05, 0.2)) * (1 - ez(seg(u, 0.75, 0.92)));
      N = nk(N, NK.at, lk); o.blink = Math.min(1, bump(seg(u, 0.38, 0.45)) + bump(seg(u, 0.5, 0.57)));
    } else if (A.k === 'honk') {   /* stretches its neck forward and honks twice */
      var st = ez(seg(u, 0.04, 0.2)) * (1 - ez(seg(u, 0.78, 0.94))), h1 = bump(seg(u, 0.24, 0.4)), h2 = bump(seg(u, 0.46, 0.62));
      N = nk(N, NK.honk, st); N.H = [N.H[0] + 3 * (h1 + h2), N.H[1] - 2 * (h1 + h2)]; o.open = Math.min(1, h1 + h2);
      after = function () { rise(p, 'note', X + 70, o.y - 60, seg(u, 0.26, 0.7), 0); rise(p, 'note', X + 76, o.y - 58, seg(u, 0.48, 0.92), 1); };
    } else if (A.k === 'court') {   /* glides up to its mate, arches its neck and bows until the bills touch: a heart */
      var go = ez(seg(u, 0.02, 0.2)) * (1 - ez(seg(u, 0.9, 0.99))), arch = ez(seg(u, 0.2, 0.34)) * (1 - ez(seg(u, 0.8, 0.9))), sv = Math.sin(TAU * 2 * seg(u, 0.34, 0.8)) * arch;
      o.x += 30 * go; N = nk(N, NK.heart, arch); N.H = [N.H[0], N.H[1] + 1.2 * sv]; o.blink = Math.min(1, ez(seg(u, 0.36, 0.4)) * (1 - ez(seg(u, 0.72, 0.76))));
      pad = u * 6;
      after = function () { rise(p, 'heart', X + 66, o.y - 68, seg(u, 0.34, 0.74), 0, 'red', true); };
    } else if (A.k === 'nuzzle') {   /* bends its neck down to Dam in front of it and nuzzles it twice */
      var b = ez(seg(u, 0.06, 0.28)) * (1 - ez(seg(u, 0.74, 0.92))), nz = bump(seg(u, 0.32, 0.44)) + bump(seg(u, 0.48, 0.6));
      N = nk(N, NK.nuzzle, b); N.H = [N.H[0] + 1.5 * nz, N.H[1] + 3 * nz]; N.a += 0.12 * nz; o.blink = 0.6 * ez(seg(u, 0.3, 0.34)) * (1 - ez(seg(u, 0.62, 0.66)));
      after = function () { rise(p, 'heart', X + 58, o.y - 58, seg(u, 0.38, 0.84), 0, 'red'); };
    }
  }
  o.N = N;
  swanTap(o, s);
  if ((r.wo || 0) > 0.02 && !o.wings) o.wing = function (pp, far) { flyWing(pp, far ? 3 : -1, far ? -15 : -12, r.we || 0, r.wo * (r.wk || 1.1), (r.wsw || 0) + (far ? -0.1 : 0), far); };
  var onWater = w > 0.5, ank = onWater ? W - 1 : G - 2.6;
  if (onWater && pad == null && !r.ft) pad = t * 2;
  function leg(far) {
    var h = swHip(o, far), a, fa = 0, sp = 0.45, tilt = o.tilt;
    if (r.ft) { var f = r.ft[far ? 1 : 0]; a = [X + f[0], ank - f[1]]; fa = f[2] || 0; sp = f[3] == null ? 0.45 : f[3]; }
    else if (pad != null) {   /* paddling: each foot sweeps back open and comes forward folded, one after the other */
      var ph = TAU * pad + (far ? Math.PI : 0), an = 0.5 + 0.5 * Math.sin(ph) * kick, L = 16;
      a = swBox(o, (far ? -12 : -6) - L * Math.sin(an), 11 + L * Math.cos(an)); fa = 1 + 0.6 * Math.sin(ph) + tilt; sp = 0.12 + 0.95 * Math.pow(Math.max(0, Math.cos(ph)), 0.6);
    } else a = [X + (far ? SW_FF : SW_FN), ank];
    if (r.tuck) { var T = swBox(o, far ? -37 : -33, far ? 8 : 11); a = [M.lerp(a[0], T[0], r.tuck), M.lerp(a[1], T[1], r.tuck)]; fa = M.lerp(fa, Math.PI + tilt + 0.15, r.tuck); sp = M.lerp(sp, 0.2, r.tuck); }
    if (r.fwd) { var F = swBox(o, far ? 8 : 14, far ? 23 : 26); a = [M.lerp(a[0], F[0], r.fwd), M.lerp(a[1], F[1], r.fwd)]; fa = M.lerp(fa, -0.45, r.fwd); sp = M.lerp(sp, 1, r.fwd); }
    if (!r.water || !onWater) a[1] = Math.min(a[1], r.water ? W + 2 : ank);
    swanLeg(p, h[0], h[1], a[0], a[1], fa, sp, far, 1.9);
  }
  function bird(under) {
    var j0 = p.marks.length, k; leg(true); var j1 = p.marks.length; swan(p, o); var j2 = p.marks.length; leg(false);
    if (under) for (k = j0; k < p.marks.length; k++) if (p.marks[k].alpha != null) p.marks[k].alpha *= k >= j1 && k < j2 ? 0.35 : 0.75;
  }
  if (!r.water) {
    var hi = Math.min(1, alt / 50);
    p.ellipse(X - 3, G + 0.5, 22 * (1 - 0.5 * hi), 2.6, { fill: 'smoke', line: false, alpha: 0.55 * (1 - 0.75 * hi) });
    bird();
  } else {   /* under the surface it shows faint, as through the water */
    p.clip('M-300 -300 H500 V' + W + ' H-300 Z', function () { bird(false); });
    p.clip('M-300 ' + W + ' H500 V500 H-300 Z', function () { bird(true); });
  }
  waterMarks(p, r, X, W, G);
  if (after) after();
}
/* on the spot, for the gallery: it walks, its feet stepping back under it as if the ground moved */
function goWalk(t) {
  var L = 11;
  return {
    ft: [0, 1].map(function (k) {
      var u = M.frac(t + k / 2), st = u < 0.5, v = st ? u / 0.5 : (u - 0.5) / 0.5;
      var b = M.bump(v);
      return st ? [M.lerp(L, -L, v) - 6, 0, 0, 1 + 0.25 * (1 - M.ease(M.seg(v, 0, 0.3)))] : [M.lerp(-L, L, M.ease(v)) - 6, 7 * b, 1.25 * Math.pow(b, 0.8) * (1 - M.ease(M.seg(v, 0.75, 1))) + 0.25 * Math.sin(TAU * 2 * v) * b, 1 - 0.85 * b];
    }),
    bob: 2.8 * M.bump(M.frac(2 * t)), roll: 0.13 * Math.sin(TAU * t), sway: 0.12 * Math.sin(TAU * t + 0.5), nod: Math.sin(TAU * 2 * t)
  };
}
D.add('hongsa-go', {
  fam: 'lanna', tags: ['swan', 'black swan', 'hongdam', 'walk', 'swim', 'fly', 'take off', 'land', 'bird', '🦢'], loop: 1, still: 0, ratio: 1.2, burst: 'note', burstAt: [96, 16], burstN: 3, burstSpread: 2.2, tapLen: 1.6, tapRest: 0.3, margin: [62, 44, 34, 74],
  about: 'the black swan on the move, posed by the page that moves it: it walks with each foot planted where it lands, hurries with its neck out and wings half open, swims with its feet paddling under the water, runs and beats its wings to take off, flies low with its neck straight out and lands feet first; on its own it walks on the spot',
  tapAbout: 'it looks at you, honks and flaps',
  draw: function (p, t, s) { goSwan(p, t, s, s.rig || goWalk(t)); }
});
/* Afloat on a job line that is water, after its swim: it paddles gently, looks at you, preens, up-ends and comes up, and
   bobs. The line is the water: what is under its surface is drawn faint, so the line shows through. */
D.add('hongsa-float', {
  fam: 'lanna', tags: ['swan', 'black swan', 'hongdam', 'float', 'swim', 'water', 'preen', 'dip', 'bird', '🦢'], loop: 16, still: 0.02, ratio: 1.2, burst: 'note', burstAt: [96, 30], burstN: 3, burstSpread: 2.2, tapLen: 1.6, tapRest: 0.3, margin: [44, 30, 34, 50],
  about: 'the black swan afloat: it paddles gently, turns to look at you and blinks, preens, up-ends with its head under the water and its feet kicking, and comes up',
  tapAbout: 'it looks at you, honks and flaps',
  draw: function (p, t, s) {
    var seg = M.seg, act = null, u;
    if ((u = seg(t, 0.08, 0.22)) > 0 && u < 1) act = { k: 'look', u: u };
    else if ((u = seg(t, 0.5, 0.66)) > 0 && u < 1) act = { k: 'dip', u: u };
    var preen = M.ease(seg(t, 0.28, 0.32)) * (1 - M.ease(seg(t, 0.42, 0.46)));
    goSwan(p, t, s, { water: 1, w: 1, pad: 6 * t, bob: 0.8 * M.wave(t, 8), sway: 0.05 * M.wave(t, 16, 0.2) + 0.08 * preen * Math.sin(TAU * 40 * t), act: act, look: 0, v: 0,
      rip: [0, 1].map(function (i) { var a = M.frac(1.5 * t + i / 2); return [-46 - 8 * a, a]; }).concat([[38 + 5 * M.frac(1.5 * t + 0.25), M.frac(1.5 * t + 0.25)]]), preen: preen });
  }
});
/* Dam (ดำ), the hongsa's chick in hongdam.net's egg story (data/eggs-story.json), at three ages: 0 a ball of grey
   down; 1 scruffy, longer in the neck, black feathers poking through the grey; 2 nearly grown, black, grey down
   left on the head, wings too long for it. Its webbed feet are too big at every age. Facing right, body centre at
   0 0, like swan(). o: x y k tilt, age, look 0..1 (at you), blink, neck 0 up .. 1 down to the ground, beak 0..1
   open, flap 0..1, head (extra head angle), legs(p, behind), t (the down stirs). */
/* Dam's down: pale grey in the ink look, bare paper in riso, so the chick reads light against the inked swan */
var DOWN = '#ECEAE6';
function damHead(p, age, look, blink, beak, small) {
  var side = 1 - look, k = 1 - (blink || 0), r = [8.2, 7, 6.6][age];
  p.blob(0, 0, r, { fill: DOWN, lumpy: age === 2 ? 0.08 : 0.16, seed: 11 + age });
  if (!small) [[-2, -r + 1, -0.5], [0, -r, 0], [2, -r + 1, 0.5]].slice(0, age === 2 ? 1 : 3).forEach(function (w) {
    p.at(w[0], w[1], w[2], 1, function () { p.curve([[0, 0], [-0.8, -2.4], [0.6, -4]], { ink: 'grey', w: 0.6 }); });
  });
  var bill = age === 2 ? 'rose' : 'grey', L = [6.5, 8.5, 10][age];
  if (side > 0.02) p.pivot(r * 0.7, 0, 0, [Math.max(0.02, side), 1], function () {
    p.pivot(r * 0.7, 0.6, -0.12 * beak, 1, function () { p.path('M' + (r * 0.7) + ' -2 L' + (r * 0.7 + L) + ' 0.2 C' + (r * 0.7 + L + 0.6) + ' 1.4 ' + (r * 0.7 + L - 0.6) + ' 1.8 ' + (r * 0.7 + L - 1.8) + ' 1.6 L' + (r * 0.7) + ' 0.8 Z', { fill: bill, w: 0.7 }); });
    p.pivot(r * 0.7, 0.9, 0.42 * beak, 1, function () { p.path('M' + (r * 0.7) + ' 0.9 L' + (r * 0.7 + L - 1.4) + ' 1.8 C' + (r * 0.7 + L - 1) + ' 3 ' + (r * 0.7 + L - 2.2) + ' 3.4 ' + (r * 0.7 + L - 3.2) + ' 3.2 L' + (r * 0.7) + ' 2.8 Z', { fill: bill, w: 0.6 }); });
  });
  if (look > 0.02) p.pivot(0, 2, 0, Math.max(0.02, look), function () {
    p.path('M-2.6 1.4 C-2.6 0 2.6 0 2.6 1.4 L0.9 ' + (L * 0.8) + ' C0.5 ' + (L * 0.8 + 0.8) + ' -0.5 ' + (L * 0.8 + 0.8) + ' -0.9 ' + (L * 0.8) + ' Z', { fill: bill, w: 0.7 });
    if (beak > 0.1) p.ellipse(0, L * 0.8 + 1.6, 1.8 * beak, 1.4 * beak, { fill: 'night', w: 0.4 });
  });
  var eye = function (x) { p.at(x, -1.8, 0, [1, Math.max(0.1, k)], function () { p.dot(0, 0, age === 2 ? 1.7 : 1.9, age === 2 ? 'red' : 'black'); p.dot(0.55, -0.55, 0.6, 'white'); }); };
  eye(M.lerp(2.2, -2.9, look));
  if (look > 0.35) eye(2.9);
}
function cygnet(p, o) {
  var age = o.age || 0, look = o.look || 0, neck = o.neck || 0, flap = o.flap || 0, small = p.small, tt = o.t || 0;
  var H = [[12 + 7 * neck, -16 + 15 * neck], [19 + 10 * neck, -29 + 30 * neck], [27 + 10 * neck, -38 + 36 * neck]][age];
  p.at(o.x, o.y, o.tilt || 0, o.k || 1, function () {
    if (o.legs) o.legs(p, true);
    if (age === 0) {
      p.blob(-16, -4, 5.5, { fill: DOWN, lumpy: 0.3, seed: 2 });
      p.blob(0, 0, 16, { fill: DOWN, lumpy: 0.13, seed: 7, sx: 1.12, sy: 0.92 });
      if (!small) { p.curve([[-9, 7], [-5, 10], [0, 10.5]], { ink: 'grey', w: 0.45, detail: true }); p.curve([[-6, -9], [-1, -12], [4, -11]], { ink: 'grey', w: 0.45, detail: true }); }
    } else if (age === 1) {
      p.poly([[-22, -4], [-29, -9], [-24, 0]], { fill: DOWN, w: 0.7 }); p.poly([[-21, -1], [-27, 1], [-22, 4]], { fill: DOWN, w: 0.7 });
      p.blob(0, 0, 17, { fill: DOWN, lumpy: 0.22, seed: 13, sx: 1.3, sy: 0.84 });
      [[-12, -7, -1.3], [-4, -11, -1.1], [5, -9, -0.9], [-16, 1, -1.5], [9, 4, -1]].forEach(function (f, i) {
        if (small && i > 2) return;
        p.at(f[0], f[1], f[2], 0.9, function () { p.path('M0 0 C-2 -4 -2 -8 0 -10 C2 -8 2 -4 0 0 Z', { fill: 'black', w: 0.5 }); });
      });
    } else {
      p.at(0, 0, 0, 0.82, function () {
        feather(p, -16, -7, 0.04 + 0.04 * Math.sin(TAU * tt), 11, tt, small);
        feather(p, -8, -10, 0.3 + 0.03 * Math.sin(TAU * tt + 1), 13, tt + 0.3, small);
        p.path(SW_BODY, { fill: 'black' });
        if (!small) p.path('M-17 -1 C-13 -4 -9 -3 -6 -1 C-3 -4 1 -3 4 0', { ink: 'grey', w: 0.5, detail: true });
      });
    }
    if (o.legs) o.legs(p, false);
    /* the wing: stubs at first, a folded wing too long for the bird at the end */
    if (age < 2) p.pivot(-2, -3, -0.25 - 1.1 * flap, 1, function () { p.blob(-6, 0, age ? 7.5 : 6, { fill: age ? 'black' : DOWN, lumpy: 0.16, seed: 4, sx: 1.4, sy: 0.65 }); });
    else if (flap < 0.08) {
      p.path('M18 -9 C6 -15 -16 -14 -33 -5 C-29 -2 -25 -1 -21 0 C-9 -2 5 -3 18 -5 Z', { fill: 'night' });
      if (!small) { p.ellipse(-29, -4.5, 4, 1.6, { fill: 'white', w: 0.4, rot: 0.25 }); p.ellipse(-24, -2.5, 3.6, 1.5, { fill: 'white', w: 0.4, rot: 0.15 }); }
    } else swanWing(p, 3, -9, 0.7 + 0.3 * flap, flap * 0.85, false);
    var w0 = [11, 8.5, 9][age], w1 = [9.5, 6.4, 6][age], C1 = [[9, -10], [17, -12], [27, -14]][age], C2 = [[H[0] - 2, H[1] + 6], [H[0] - 3, H[1] + 10], [H[0] - 4, H[1] + 14]][age];
    var sp = bez([[5, -6], [10, -6], [16, -7]][age], C1, C2, H, 10);
    tube(p, sp, function (s) { return w0 - (w0 - w1) * s; }, { fill: age === 2 ? 'black' : DOWN });
    p.at(H[0], H[1], 0.9 * neck + (o.head || 0) + 0.1 * look, 1, function () { damHead(p, age, look, o.blink || 0, o.beak || 0, small); });
  });
}
/* Dam's legs on a walk: the foot cycle of hongsa-walk for a hip at hip (body frame); go 0 stands, 1 walks */
function damLegs(p, o) {
  return function (_, far) {
    var u = M.frac(o.t + (far ? 0.5 : 0)), st = u < 0.5, v = st ? u / 0.5 : (u - 0.5) / 0.5;
    var fx = (st ? M.lerp(o.stride, -o.stride, v) : M.lerp(-o.stride, o.stride, M.ease(v))) * o.go, lift = (st ? 0 : o.lift * M.bump(v)) * o.go;
    var hx = o.hip[0] + (far ? -3.5 : 0), hy = o.hip[1], c = Math.cos(o.roll), sn = Math.sin(o.roll);
    swanLeg(p, o.x + hx * c - hy * sn, o.y + hx * sn + hy * c, o.x + o.hip[0] - 1 + fx + (o.fwd || 0), o.G - 1.5 - lift, st || o.go < 0.5 ? 0 : 0.55 * M.bump(v), st ? 1 : 0.3 + 0.7 * (1 - o.go), far, o.big);
  };
}
D.add('duckling', {
  fam: 'lanna', tags: ['cygnet', 'duckling', 'chick', 'hatchling', 'swan', 'black swan', 'hongdam', 'dam', 'ugly duckling', 'bird', '🐣'], loop: 3, still: 0.1, ratio: 1, burst: 'note', burstAt: [70, 30], burstN: 3, burstSpread: 1.6, burstDelay: 0.2, tapLen: 1.4, tapRest: 0.35, margin: [22, 16, 10, 16],
  about: "Dam, the black swan's chick: a ball of grey down on black webbed feet too big for it; it waddles, wobbles, sits down hard and gets back up",
  tapAbout: 'it looks up at you, peeps and flaps its two stubs of wings',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, bump = M.bump, G = 93, wu = seg(t, 0, 0.52);
    var go = ez(seg(t, 0, 0.05)) * (1 - ez(seg(t, 0.47, 0.52)));
    var wob = 0.2 * Math.sin(TAU * 2 * seg(t, 0.52, 0.68)) * (1 - seg(t, 0.52, 0.68));
    var sit = ez(seg(t, 0.68, 0.73)) * (1 - ez(seg(t, 0.9, 0.97))), squash = bump(seg(t, 0.71, 0.79)) * 0.12;
    var look = 0, beak = 0, flap = 0, hop = 0, blink = bump(seg(t, 0.82, 0.85)), head = 0.15 * sit;
    if (s.tap >= 0) {
      var q = s.tap; look = ez(seg(q, 0, 0.12)) * (1 - ez(seg(q, 0.86, 1)));
      beak = bump(seg(q, 0.16, 0.34)) + bump(seg(q, 0.4, 0.58)); flap = Math.abs(Math.sin(TAU * 3 * seg(q, 0.2, 0.8))) * bump(seg(q, 0.16, 0.84));
      hop = 5 * bump(seg(q, 0.18, 0.42)); go *= 0; sit *= 1 - look; wob = 0; head = -0.25 * look;
    }
    var ph = TAU * 2 * wu, roll = 0.12 * Math.sin(ph) * go + wob, x = 46, y = 64 - 2 * Math.abs(Math.sin(ph)) * go + 10 * sit - hop;
    p.ellipse(x + 2, G + 0.5, 17, 2.4, { fill: 'smoke', line: false, alpha: 0.55 });
    var legs = damLegs(p, { t: M.frac(2 * wu), x: x, y: y, roll: roll, go: go, hip: [1, 12], G: G, stride: 7, lift: 5, big: 1.25, fwd: 5 * sit });
    p.at(x, y + 14, 0, [1 + squash, 1 - squash], function () {
      cygnet(p, { x: 0, y: -14, tilt: roll, age: 0, look: look, blink: blink, beak: beak, flap: flap, head: head, t: t, legs: function (pp, far) { pp.at(-x, -y, 0, 1, function () { legs(pp, far); }); } });
    });
  }
});
D.add('duckling-scruffy', {
  fam: 'lanna', tags: ['cygnet', 'duckling', 'ugly duckling', 'swan', 'hongdam', 'dam', 'moult', 'bird'], loop: 2.4, still: 0.2, ratio: 1.1, burst: 'drop', burstAt: [80, 70], burstN: 5, burstSpread: 2.2, burstDelay: 0.62, tapLen: 2, tapRest: 0.4, margin: [22, 16, 10, 16],
  about: 'Dam a few weeks on: a longer neck, patchy grey down with black feathers poking through; it walks along with its head down',
  tapAbout: 'it finds its reflection in a puddle, looks hard, then shakes it off',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, bump = M.bump, G = 93, ph = TAU * 2 * t, go = 1, neck = 0.55 + 0.08 * Math.sin(ph * 2), head = 0, look = 0, pud = 0, shake = 0;
    if (s.tap >= 0) {
      var q = s.tap; go = 1 - ez(seg(q, 0, 0.1)) * (1 - ez(seg(q, 0.9, 1)));
      pud = ez(seg(q, 0.05, 0.2)) * (1 - ez(seg(q, 0.82, 0.95)));
      neck = M.lerp(neck, 0.95, ez(seg(q, 0.1, 0.25)) * (1 - ez(seg(q, 0.55, 0.65))));
      shake = Math.sin(TAU * 4 * seg(q, 0.58, 0.82)) * bump(seg(q, 0.58, 0.82)); head = 0.35 * shake;
    }
    var roll = 0.1 * Math.sin(ph) * go, x = 50, y = 61 - 1.6 * Math.abs(Math.sin(ph)) * go;
    p.ellipse(x + 2, G + 0.5, 21, 2.5, { fill: 'smoke', line: false, alpha: 0.55 });
    if (pud > 0.01) { p.ellipse(80, G - 0.5, 15 * pud, 3.2 * pud, { fill: 'sky', alpha: 0.7, w: 0.6 }); if (pud > 0.5 && !p.small) p.ellipse(80, G + 1, 4 * pud, 1.2, { fill: 'grey', line: false, alpha: 0.5 * (1 - Math.abs(shake)) }); }
    var legs = damLegs(p, { t: t, x: x, y: y, roll: roll, go: go, hip: [1, 13], G: G, stride: 8, lift: 5, big: 1.25 });
    cygnet(p, { x: x, y: y, tilt: roll, age: 1, neck: neck, head: head, look: look, t: t, legs: function (pp, far) { legs(pp, far); } });
  }
});
D.add('duckling-fledgling', {
  fam: 'lanna', tags: ['cygnet', 'fledgling', 'swan', 'black swan', 'hongdam', 'dam', 'shy', 'bird'], loop: 4, still: 0.6, ratio: 1.2, burst: false, tapLen: 1.8, tapRest: 0.35, margin: [30, 20, 10, 20],
  about: 'Dam nearly grown: black, with grey down left on its head and wings too long for it, folded; it walks, stops, glances at you and blinks',
  tapAbout: 'it half-opens its wings, then folds them again and tucks its head, shy',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, bump = M.bump, G = 93, wu = seg(t, 0, 0.5);
    var go = ez(seg(t, 0, 0.05)) * (1 - ez(seg(t, 0.45, 0.5)));
    var look = ez(seg(t, 0.56, 0.62)) * (1 - ez(seg(t, 0.84, 0.9))), blink = bump(seg(t, 0.7, 0.73)), flap = 0, head = 0, tilt = 0;
    if (s.tap >= 0) {
      var q = s.tap; flap = ez(seg(q, 0.05, 0.3)) * (1 - ez(seg(q, 0.45, 0.65))) * 0.6;
      var shy = ez(seg(q, 0.5, 0.65)) * (1 - ez(seg(q, 0.88, 1))); look = Math.max(look * (1 - shy), 0.5 * ez(seg(q, 0, 0.1)) * (1 - shy)); head = 0.55 * shy; tilt = -0.12 * flap; go = 0;
      if (shy > 0.3 && !p.small) p.dot(54 + 30, 30 + 18 * shy, 1.6 * shy, 'pink');
    }
    var ph = TAU * 2 * wu, roll = 0.1 * Math.sin(ph) * go - 0.1 + tilt, x = 54, y = 65 - 1.8 * Math.abs(Math.sin(ph)) * go;
    p.ellipse(x + 2, G + 0.5, 22, 2.6, { fill: 'smoke', line: false, alpha: 0.55 });
    var legs = damLegs(p, { t: M.frac(2 * wu), x: x, y: y, roll: roll, go: go, hip: [0, 13], G: G, stride: 9, lift: 6, big: 1.35 });
    cygnet(p, { x: x, y: y, tilt: roll, age: 2, look: look, blink: blink, flap: flap, head: head, neck: 0.08 * head, t: t, legs: function (pp, far) { legs(pp, far); } });
  }
});

/* Dam on hongdam.net's job lines: trotting after the swan, and waiting for it */
function damBall(p, t, s, o) {
  var G = 93, go = o.go, look = o.look || 0, beak = o.beak || 0, flap = o.flap || 0, hop = o.hop || 0;
  if (s.tap >= 0) {
    var q = s.tap, ez = M.ease, seg = M.seg, tw = ez(seg(q, 0, 0.12)) * (1 - ez(seg(q, 0.86, 1)));
    go *= 1 - tw; look = Math.max(look, tw); beak = M.bump(seg(q, 0.16, 0.34)) + M.bump(seg(q, 0.4, 0.58));
    flap = Math.abs(Math.sin(TAU * 3 * seg(q, 0.2, 0.8))) * M.bump(seg(q, 0.16, 0.84)); hop = 5 * M.bump(seg(q, 0.18, 0.42));
  }
  var ph = TAU * o.ph, roll = 0.14 * Math.sin(ph) * go, x = 46, y = 64 - 2.4 * Math.abs(Math.sin(ph)) * go - hop + (o.sit || 0) * 10;
  p.ellipse(x + 2, G + 0.5, 17, 2.4, { fill: 'smoke', line: false, alpha: 0.55 });
  var legs = damLegs(p, { t: o.ph, x: x, y: y, roll: roll, go: go, hip: [1, 12], G: G, stride: 7, lift: 5, big: 1.25, fwd: 5 * (o.sit || 0) });
  cygnet(p, { x: x, y: y, tilt: roll, age: 0, look: look, blink: o.blink || 0, beak: beak, flap: flap, head: o.head || 0, t: t, legs: function (pp, far) { pp.at(-x, -y, 0, 1, function () { legs(pp, far); }); } });
}
D.add('duckling-walk', {
  fam: 'lanna', tags: ['cygnet', 'duckling', 'chick', 'swan', 'hongdam', 'dam', 'walk', 'hurry', 'bird', '🐣'], loop: 0.5, still: 0.25, ratio: 1, burst: 'note', burstAt: [70, 30], burstN: 3, burstSpread: 1.6, burstDelay: 0.2, tapLen: 1.4, tapRest: 0.35, margin: [22, 16, 10, 16],
  about: 'Dam hurries after its parent: a ball of grey down waddling fast on webbed feet too big for it',
  tapAbout: 'it stops, looks up at you, peeps and flaps',
  draw: function (p, t, s) { damBall(p, t, s, { go: 1, ph: t, head: -0.08 }); }
});
D.add('duckling-wait', {
  fam: 'lanna', tags: ['cygnet', 'duckling', 'chick', 'swan', 'hongdam', 'dam', 'wait', 'bird', '🐣'], loop: 6, still: 0.05, ratio: 1, burst: 'note', burstAt: [70, 30], burstN: 3, burstSpread: 1.6, burstDelay: 0.2, tapLen: 1.4, tapRest: 0.35, margin: [22, 16, 10, 16],
  about: 'Dam waits by its parent: it bobs, looks up at you and blinks, peeps, sits down hard and gets back up',
  tapAbout: 'it looks up at you, peeps and flaps its two stubs of wings',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, bump = M.bump;
    var look = ez(seg(t, 0.2, 0.25)) * (1 - ez(seg(t, 0.42, 0.47))), beak = bump(seg(t, 0.3, 0.34)), sit = ez(seg(t, 0.6, 0.64)) * (1 - ez(seg(t, 0.84, 0.9)));
    damBall(p, t, s, { go: 0, ph: 0, look: look, beak: beak, sit: sit, blink: Math.min(1, bump(seg(t, 0.1, 0.13)) + bump(seg(t, 0.36, 0.39))), hop: 1.5 * Math.abs(Math.sin(TAU * 3 * t)) * (1 - sit) * (1 - look), head: sit * (0.15 + 0.14 * Math.sin(TAU * 5 * t)) });
  }
});
/* Dam on the move, posed by the page that moves it, as the swan is (hongsa-go): rig w, wy, lw, water, alt, bob, roll,
   ft [[dx, lift, foot angle, spread] near, far], pad, look, beak, flap, rip, spl, v. Alone it trots on the spot. */
function goDam(p, t, s, r) {
  var G = 93, X = 46, W = r.wy == null ? 93 + (r.lw || 15) / 2 : r.wy, w = r.w || 0, look = r.look || 0, beak = r.beak || 0, flap = r.flap || 0, hop = r.alt || 0;
  if (s.tap >= 0) {
    var q = s.tap, ez = M.ease, seg = M.seg, tw = ez(seg(q, 0, 0.12)) * (1 - ez(seg(q, 0.86, 1)));
    look = Math.max(look, tw); beak = M.bump(seg(q, 0.16, 0.34)) + M.bump(seg(q, 0.4, 0.58));
    flap = Math.abs(Math.sin(TAU * 3 * seg(q, 0.2, 0.8))) * M.bump(seg(q, 0.16, 0.84)); if (w < 0.5) hop += 5 * M.bump(seg(q, 0.18, 0.42));
  }
  W -= (r.lw || 15) / 2;
  var roll = (r.roll || 0) + (r.tilt || 0), y = M.lerp(64, W - 5, w) - hop - (r.bob || 0), onWater = w > 0.5, ank = onWater ? W - 1 : G - 1.5, pad = r.pad;
  if (onWater && pad == null && !r.ft) pad = t * 3;
  function leg(far) {
    var hx = 1 + (far ? -3.5 : 0), hy = 12, c = Math.cos(roll), sn = Math.sin(roll), h = [X + hx * c - hy * sn, y + hx * sn + hy * c], a, fa = 0, sp = 1;
    if (r.ft) { var f = r.ft[far ? 1 : 0]; a = [X + f[0], ank - f[1]]; fa = f[2] || 0; sp = f[3] == null ? 1 : f[3]; }
    else if (pad != null) { var ph = TAU * pad + (far ? Math.PI : 0), an = 0.45 + 0.45 * Math.sin(ph); a = [h[0] - 11 * Math.sin(an), h[1] + 11 * Math.cos(an)]; fa = 1 + 0.6 * Math.sin(ph); sp = 0.12 + 0.95 * Math.pow(Math.max(0, Math.cos(ph)), 0.6); }
    else a = [X, ank];
    if (!r.water || !onWater) a[1] = Math.min(a[1], r.water ? W + 2 : ank);
    swanLeg(p, h[0], h[1], a[0], a[1], fa, sp, far, 1.25);
  }
  function chick(under) {
    var j0 = p.marks.length, k; leg(true); var j1 = p.marks.length;
    cygnet(p, { x: X, y: y, tilt: roll, age: 0, look: look, blink: r.blink || 0, beak: beak, flap: flap, head: r.head || 0, t: t });
    var j2 = p.marks.length; leg(false);
    if (under) for (k = j0; k < p.marks.length; k++) if (p.marks[k].alpha != null) p.marks[k].alpha *= k >= j1 && k < j2 ? 0.35 : 0.75;
  }
  if (!r.water) { p.ellipse(X + 2, G + 0.5, 17 * (1 - Math.min(0.4, hop / 30)), 2.4, { fill: 'smoke', line: false, alpha: 0.55 }); chick(); }
  else {
    p.clip('M-300 -300 H500 V' + W + ' H-300 Z', function () { chick(false); });
    p.clip('M-300 ' + W + ' H500 V500 H-300 Z', function () { chick(true); });
  }
  waterMarks(p, r, X - 8, W, G);
}
D.add('duckling-go', {
  fam: 'lanna', tags: ['cygnet', 'duckling', 'chick', 'swan', 'hongdam', 'dam', 'walk', 'swim', 'hurry', 'bird', '🐣'], loop: 0.5, still: 0, ratio: 1, burst: 'note', burstAt: [70, 30], burstN: 3, burstSpread: 1.6, burstDelay: 0.2, tapLen: 1.4, tapRest: 0.35, margin: [22, 20, 30, 60],
  about: "Dam on the move, posed by the page that moves it: it trots after its parent with each foot planted where it lands, or paddles after it on the water; on its own it trots on the spot",
  tapAbout: 'it looks up at you, peeps and flaps its two stubs of wings',
  draw: function (p, t, s) {
    var L = 6;
    goDam(p, t, s, s.rig || { bob: 2.2 * M.bump(M.frac(2 * t)), roll: 0.13 * Math.sin(TAU * t),
      ft: [0, 1].map(function (k) { var u = M.frac(t + k / 2), st = u < 0.5, v = st ? u / 0.5 : (u - 0.5) / 0.5, b = M.bump(v); return st ? [M.lerp(L, -L, v), 0, 0, 1] : [M.lerp(-L, L, M.ease(v)), 5 * b, 1.1 * b + 0.25 * Math.sin(TAU * 2 * v) * b, 1 - 0.8 * b]; }) });
  }
});
/* Dam afloat by its parent on a job line that is water: it bobs, paddles, looks up at you, peeps */
D.add('duckling-float', {
  fam: 'lanna', tags: ['cygnet', 'duckling', 'chick', 'swan', 'hongdam', 'dam', 'float', 'swim', 'water', 'bird', '🐣'], loop: 6, still: 0.05, ratio: 1, burst: 'note', burstAt: [70, 30], burstN: 3, burstSpread: 1.6, burstDelay: 0.2, tapLen: 1.4, tapRest: 0.35, margin: [22, 20, 30, 40],
  about: 'Dam afloat by its parent: it bobs and paddles, looks up at you and blinks, and peeps',
  tapAbout: 'it looks up at you, peeps and flaps its two stubs of wings',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, bump = M.bump, look = ez(seg(t, 0.2, 0.25)) * (1 - ez(seg(t, 0.42, 0.47)));
    goDam(p, t, s, { water: 1, w: 1, pad: 9 * t, bob: 1.2 * M.wave(t, 6), look: look, beak: bump(seg(t, 0.3, 0.34)) + bump(seg(t, 0.62, 0.66)),
      blink: Math.min(1, bump(seg(t, 0.1, 0.13)) + bump(seg(t, 0.36, 0.39))), rip: [0, 1].map(function (i) { var a = M.frac(2 * t + i / 2); return [-20 - 6 * a, a]; }) });
  }
});
/* a dyed easter egg in the colour a (hongdam.net tints it with the colour of the day), a white zigzag band and
   white dots painted on. It rocks, and now and then something knocks from inside. Tap: it cracks along the
   zigzag, the top lifts, and Dam's head pops out, looks at you and peeps, then ducks back and the egg closes. */
var DYE = 'M40 12 C58 12 66 42 66 60 C66 80 55 92 40 92 C25 92 14 80 14 60 C14 42 22 12 40 12 Z';
var DYE_TOP = 'M14 54 C14 40 22 12 40 12 C58 12 66 40 66 54 L60 47 L53 55 L47 47 L40 55 L33 47 L27 55 L20 47 Z';
var DYE_BOT = 'M14 54 L20 47 L27 55 L33 47 L40 55 L47 47 L53 55 L60 47 L66 54 C66 80 55 92 40 92 C25 92 14 80 14 54 Z';
var ZIG = 'M14 54 L20 47 L27 55 L33 47 L40 55 L47 47 L53 55 L60 47 L66 54';
function dyePaint(p, small) {
  p.path('M10 47 L20 40 L27 48 L33 40 L40 48 L47 40 L53 48 L60 40 L70 47 L70 56 L60 49 L53 57 L47 49 L40 57 L33 49 L27 57 L20 49 L10 56 Z', { fill: 'white', line: false });
  if (!small) [[30, 28], [40, 24], [50, 28], [28, 72], [40, 76], [52, 72]].forEach(function (d) { p.circle(d[0], d[1], 2.3, { fill: 'white', w: 0.4 }); });
  p.path('M54 18 C60 26 63 38 63 52', { ink: 'white', w: 1.2, alpha: 0.6, detail: true });
}
D.add('easter-egg', {
  fam: 'lanna', tags: ['egg', 'easter egg', 'dyed', 'painted', 'hatch', 'hongdam', 'dam', 'surprise', 'ไข่', '🥚'], loop: 2.6, still: 0.1, ratio: 0.8, burst: 'note', burstAt: [40, 28], burstN: 3, burstSpread: 1.6, burstDelay: 0.5, tapLen: 2.6, tapRest: 0.55, margin: [30, 14, 8, 14],
  about: 'a dyed egg with a painted zigzag rocks on its round bottom; now and then it jiggles, as if something inside knocked',
  tapAbout: "it cracks along the zigzag, the top lifts, and Dam's head pops out, looks at you and peeps, then ducks back in and the egg closes",
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, bump = M.bump, rock = 0.08 * M.wave(t, 1) + 0.05 * Math.sin(TAU * 6 * seg(t, 0.55, 0.72)) * bump(seg(t, 0.55, 0.72));
    p.ellipse(40, 93, 20, 2.6, { fill: 'stone', line: false, alpha: 0.6 });
    if (s.tap < 0) {
      p.pivot(40, 90, rock, 1, function () { p.path(DYE, { fill: 'a' }); p.clip(DYE, function () { dyePaint(p, p.small); }); p.path(DYE, {}); });
      return;
    }
    var q = s.tap, shake = 0.08 * Math.sin(TAU * 5 * seg(q, 0, 0.14)) * bump(seg(q, 0, 0.14)), crack = ez(seg(q, 0.12, 0.26)) * (1 - ez(seg(q, 0.9, 0.98)));
    var lift = ez(seg(q, 0.26, 0.38)) * (1 - ez(seg(q, 0.8, 0.9))), pop = M.spring(seg(q, 0.32, 0.5)) * (1 - ez(seg(q, 0.74, 0.84)));
    var look = ez(seg(q, 0.42, 0.5)) * (1 - ez(seg(q, 0.7, 0.76))), beak = bump(seg(q, 0.5, 0.6)), blink = bump(seg(q, 0.62, 0.66));
    p.pivot(40, 90, shake, 1, function () {
      if (lift > 0.01) p.ellipse(40, 51, 25, 5, { fill: 'night', line: false, alpha: 0.7 });
      if (pop > 0.01) p.clip('M0 -60 L80 -60 L80 52 L0 52 Z', function () { p.at(40, 64 - 22 * pop, 0, 1.1, function () { damHead(p, 0, look, blink, beak, p.small); }); });
      p.path(DYE_BOT, { fill: 'a' }); p.clip(DYE_BOT, function () { dyePaint(p, p.small); }); p.path(DYE_BOT, {});
      p.pivot(16, 52, -0.55 * lift, 1, function () { p.at(0, -12 * lift, 0, 1, function () { p.path(DYE_TOP, { fill: 'a' }); p.clip(DYE_TOP, function () { dyePaint(p, p.small); }); p.path(DYE_TOP, {}); }); });
      if (crack > 0.01 && lift < 0.02) p.draw(ZIG, crack, { w: 0.9 });
    });
  }
});
})(Dingbats);

/* Kitchen & table: cups, bowls, pans and the things on them. */
(function (D) {
'use strict';
var M = D.math, TAU = M.TAU, seg = M.seg, eo = M.easeOut, ei = M.easeIn, ez = M.ease, bump = M.bump, wave = M.wave;

/* steam: one ribbon rising from (x, y), h tall, drawn out at the head and taken back at the tail */
function wisp(x, y, h) {
  return 'M' + x + ' ' + y + ' C' + (x - 6) + ' ' + (y - h * 0.28) + ' ' + (x + 6) + ' ' + (y - h * 0.42) + ' ' + x + ' ' + (y - h * 0.62) + ' C' + (x - 5) + ' ' + (y - h * 0.8) + ' ' + (x + 3) + ' ' + (y - h * 0.9) + ' ' + (x + 1) + ' ' + (y - h);
}
function steam(p, t, x, y, h, ph, w) {
  var q = M.frac(t + ph);
  p.span(wisp(x, y, h), ei(seg(q, 0.25, 1)), eo(seg(q, 0, 0.75)), { w: w || 0.7, alpha: 0.9 });
}
/* a liquid stream falling from (x0, y0) to (x1, y1): the part between fractions a and b, w wide at the top and thinner as it stretches */
function stream(p, x0, y0, x1, y1, a, b, w, c) {
  if (b - a < 0.03) return;
  var L = [], R = [], i, f, x, y, hw;
  for (i = 0; i <= 8; i++) { f = a + (b - a) * i / 8; x = x0 + (x1 - x0) * f; y = y0 + (y1 - y0) * (0.25 * f + 0.75 * f * f); hw = w * (1 - 0.4 * f) / 2; L.push([x - hw, y]); R.unshift([x + hw, y]); }
  p.poly(L.concat(R), { fill: c, w: 0.4 });
}
/* points to path data */
function pd(pts) { return 'M' + pts.map(function (q) { return q[0] + ' ' + q[1]; }).join(' L') + ' Z'; }
/* a vessel: its fill, then what it holds (shown only inside it), then its outline over both */
function vessel(p, d, fill, inside, o) { p.path(d, { fill: fill, line: false }); p.clip(d, inside); p.path(d, o || {}); }
/* a drop, tip up, at the origin */
function drop(p, x, y, k, c) { p.at(x, y, 0, k, function () { p.path('M0 -4.5 C2.8 -0.8 3.4 1.6 0 3.8 C-3.4 1.6 -2.8 -0.8 0 -4.5 Z', { fill: c, w: 0.6 }); }); }

/* ☕ a cup on its saucer, three ribbons of steam rising and leaving, one ahead of the others.
   Tap: the cup hops and clinks back down, and the steam curls into a heart. */
var WISPS = ['M38 40 C33 32 43 27 38 19 C34 12 41 7 39 0', 'M50 38 C55 30 45 24 50 16 C55 9 47 4 51 -4', 'M62 40 C67 32 57 27 62 19 C66 12 59 7 61 0'];
D.add('coffee', {
  fam: 'kitchen', tags: ['cup', 'tea', 'hot', 'drink', 'cafe', 'break', 'morning', '☕'], loop: 2.4, still: 0.4, tapLen: 1.6, burst: false, margin: [30, 18, 14, 18],
  about: 'steam rises in three ribbons, one leading', tapAbout: 'hops, clinks down, and the steam curls into a heart',
  draw: function (p, t, s) {
    var hop = s.tap >= 0 ? -10 * M.bump(M.seg(s.tap, 0, 0.3)) : 0, clink = s.tap >= 0 ? M.bump(M.seg(s.tap, 0.28, 0.42)) : 0, heart = s.tap >= 0 ? M.seg(s.tap, 0.15, 0.75) : 0;
    /* saucer */
    p.ellipse(50, 84, 38, 7.5, { fill: 'white' });
    p.ellipse(50, 82.5, 20, 3.4, { w: 0.45, detail: true });
    p.pivot(50, 82, 0.05 * clink * M.wave(s.tap < 0 ? 0 : s.tap, 6), [1 + clink * 0.04, 1 - clink * 0.05], function () {
      p.move(0, hop);
      /* handle first, the cup's body over its root */
      p.path('M72 50 C86 47 88 66 70 70', { w: 1.1 });
      p.path('M28 42 L72 42 C72 60 66 78 50 80 C34 78 28 60 28 42 Z', { fill: 'white' });
      p.path('M30.5 52 C40 55 60 55 69.5 52', { ink: 'a', w: 1.1, detail: true });
      p.ellipse(50, 42, 22, 4.6, { fill: 'brown', w: 0.8 });
      p.path('M42 41.5 C46 40 53 40 57 41', { ink: 'sand', w: 0.5, detail: true });
    });
    if (heart > 0 && heart < 1) {
      var h = 'M50 36 C40 28 32 20 36 10 C40 2 48 4 50 12 C52 4 60 2 64 10 C68 20 60 28 50 36';
      p.span(h, M.seg(heart, 0.55, 1), M.easeOut(M.seg(heart, 0, 0.6)), { w: 0.9, ink: 'b' });
      return;
    }
    WISPS.forEach(function (d, i) {
      var ph = M.frac(t + [0.0, 0.42, 0.2][i]), head = M.easeOut(M.seg(ph, 0, 0.75)), tail = M.easeIn(M.seg(ph, 0.25, 1));
      p.span(d, tail, head, { w: 0.75, alpha: 0.9 });
    });
  }
});

/* 🫖 a teapot beside a tulip glass of tea. Steam curls from the spout and the lid chatters on the boil.
   Tap: the pot tips and pours, the stream thins and ends, the glass fills; a fresh glass slides in. */
function tulipW(y) { return y < 82 ? 6.8 + 3.2 * Math.pow((82 - y) / 16, 2) : 6.8 + 1.8 * Math.pow((y - 82) / 12, 2); }
function tulip(p, cx, lvl) {
  var pts = [], y, yl = 91 - 22 * lvl;
  for (y = 66; y <= 94; y += 2) pts.push([cx - tulipW(y), y]);
  for (y = 94; y >= 66; y -= 2) pts.push([cx + tulipW(y), y]);
  p.ellipse(cx, 94.5, 14, 3, { fill: 'white' });
  if (lvl < 0.02) { p.path(pd(pts), { fill: 'white' }); return; }
  vessel(p, pd(pts), 'white', function () { p.rect(cx - 12, yl, 24, 30, { fill: 'wood', line: false }); p.line(cx - 12, yl, cx + 12, yl, { w: 0.45 }); });
}
D.add('teapot', {
  fam: 'kitchen', tags: ['tea', 'pot', 'pour', 'cup', 'hot', 'afternoon', 'brew', 'ชา', '🫖'], loop: 2.8, still: 0.3, tapLen: 3, burst: false, margin: [26, 34, 14, 18],
  about: 'steam curls from the spout and the lid chatters', tapAbout: 'tips and pours, the glass fills, a fresh glass slides in',
  draw: function (p, t, s) {
    var u = s.tap, go = u >= 0, tip = go ? 0.62 * eo(seg(u, 0, 0.18)) * (1 - ez(seg(u, 0.6, 0.8))) : 0, lift = tip * 12;
    var lvl = go ? ez(seg(u, 0.2, 0.62)) : 0, out = go ? ei(seg(u, 0.72, 0.9)) : 0, back = go ? 1 - M.spring(seg(u, 0.8, 1)) : 0;
    var tx = 32 + 40 * Math.cos(tip) + 22.5 * Math.sin(tip), ty = 62 + 40 * Math.sin(tip) - 22.5 * Math.cos(tip) - lift;
    var hop = bump(seg(t, 0.55, 0.64)) + bump(seg(t, 0.68, 0.77)), chat = go ? 0 : hop;
    if (!go) tulip(p, 87, 0);
    else {
      if (out < 1) p.at(70 * out, 0, 0, 1, function () { tulip(p, 87, lvl); });
      if (u > 0.8) p.at(70 * back, 0, 0, 1, function () { tulip(p, 87, 0); });
      stream(p, tx, ty, 85, 91 - 22 * lvl, seg(u, 0.56, 0.66), eo(seg(u, 0.14, 0.22)), 3.4 * (1 - 0.65 * seg(u, 0.5, 0.62)), 'wood');
      if (lvl > 0.3 && out < 0.5) steam(p, t, 87 + 70 * out, 66, 20, 0.3);
    }
    p.at(0, -lift, 0, 1, function () {
      p.pivot(32, 62, tip, 1, function () {
        p.path('M8 50 C-8 46 -8 77 10 76 L11 70 C2 70 2 55 9 56 Z', { fill: 'c' });
        p.path('M50 54 C58 56 62 46 68 38 L73 41 C69 50 66 66 52 71 Z', { fill: 'c' });
        p.path('M9 62 C6 46 18 36 32 36 C46 36 58 46 55 62 C53 74 45 80 32 80 C19 80 11 74 9 62 Z', { fill: 'c' });
        p.path('M13 55 C15 47 21 42 27 40.5', { ink: 'white', w: 0.8, detail: true });
        p.path('M17 62 C22 66 42 66 47 62', { ink: 'white', w: 0.5, detail: true });
        p.at(32, 37 - 1.8 * chat, 0.05 * chat, 1, function () { p.path('M-13 0 C-11 -9 11 -9 13 0 Z', { fill: 'a' }); p.circle(0, -9.5, 2.8, { fill: 'a' }); });
        steam(p, t, 71, 36, 24, 0); steam(p, t, 69, 37, 18, 0.5);
      });
    });
  }
});

/* 🍜 a bowl of ramen. Chopsticks lift a bundle of noodles and let it down again, steam over the broth.
   Tap: they lift it high, then the noodles slurp back down in a whip and the broth splashes. */
D.add('noodles', {
  fam: 'kitchen', tags: ['ramen', 'bowl', 'chopsticks', 'slurp', 'pasta', 'soup', 'khao soi', 'ก๋วยเตี๋ยว', '🍜'], loop: 2.6, still: 0.25, tapLen: 2.2, burst: false, margin: [30, 24, 14, 18],
  about: 'chopsticks lift a bundle of noodles and lower it, steam over the broth', tapAbout: 'lifts high, then slurps the noodles back down with a splash',
  draw: function (p, t, s) {
    var u = s.tap, go = u >= 0, base = 38 + 8 * wave(t, 1, -0.25), ya = base, sway = 2 * wave(t, 1, 0.1), jig = go ? bump(seg(u, 0.58, 0.8)) : 0, i, k;
    if (go) ya = u < 0.5 ? M.lerp(base, 10, eo(seg(u, 0, 0.3))) : u < 0.62 ? M.lerp(10, 58, ei(seg(u, 0.5, 0.62))) : M.lerp(58, base, M.spring(seg(u, 0.62, 1)));
    p.pivot(50, 92, 0, [1 + 0.03 * jig, 1 - 0.05 * jig], function () {
      p.path('M12 57 C14 79 30 92 50 92 C70 92 86 79 88 57 Z', { fill: 'white' });
      p.path('M16 70 C30 78 70 78 84 70', { ink: 'b', w: 0.9 });
      p.path('M40 92 L42 96 L58 96 L60 92', { w: 0.8 });
      p.ellipse(50, 56, 38, 8, { fill: 'white' });
      p.ellipse(50, 57, 34, 6.4, { fill: 'wood', w: 0.6 });
      p.ellipse(65, 57, 7.5, 4.4, { fill: 'white', w: 0.7 });
      p.ellipse(65, 57, 3.6, 2.4, { fill: 'orange', w: 0.5 });
      p.ellipse(31, 58.5, 5.5, 3.2, { fill: 'white', w: 0.6 });
      p.path('M28 58.5 C30 56.5 33 57 33 58.5', { ink: 'pink', w: 0.6, detail: true });
      [[48, 61.5], [53, 60.5], [44, 55]].forEach(function (q) { p.ellipse(q[0], q[1], 2, 1.1, { fill: 'green', w: 0.4 }); });
    });
    for (i = 0; i < 4; i++) {
      var ax = 47 + sway + (i - 1.5) * 1.1, ay = ya + i * 0.5, A = [37 + i * 3.4, 58.5 + (i % 2)], B = [58 + i * 3.2, 59 - (i % 2)], lag = 3 * wave(t, 1, -0.05 - i * 0.03) * seg(ay, 58, 30);
      var pts = [A, [M.lerp(A[0], ax, 0.45) - 3 + lag, M.lerp(A[1], ay, 0.5)], [ax, ay], [M.lerp(B[0], ax, 0.45) + 3 + lag, M.lerp(B[1], ay, 0.5)], B];
      p.curve(pts, { w: 0.8, wob: 0, cap: 'round' }); p.curve(pts, { ink: 'yellow', w: 0.36, wob: 0, cap: 'round' });
    }
    [-1, 1].forEach(function (k) {
      var tx = 47 + sway + k * 0.9, ty = ya + 0.6;
      p.poly([[tx - 0.5, ty], [tx + 0.5, ty], [tx + 24 + k * 4.4 + 1.2, ty - 37], [tx + 24 + k * 4.4 - 1.2, ty - 37]], { fill: k < 0 ? 'wood' : 'sand', w: 0.45 });
    });
    for (k = 0; k < 4; k++) {
      var tau = go ? seg(u, 0.52 + k * 0.02, 0.8 + k * 0.02) : 0;
      if (tau > 0 && tau < 1) drop(p, 38 + k * 8 + (k - 1.5) * 8 * tau, 56 - 64 * tau * (1 - tau) * (0.8 + 0.1 * k), 1 - ei(seg(tau, 0.7, 1)), 'wood');
    }
    steam(p, t, 36, 50, 26, 0.1); steam(p, t, 62, 49, 24, 0.55);
  }
});

/* 🥚 an egg on its round bottom, rocking like a roly-poly.
   Tap: it shuffles aside and cracks, the top lifts, the yolk drops out and splats, then hops back in and the shell closes. */
var EGG = 'M50 12 C70 12 80 44 80 62 C80 82 66 92 50 92 C34 92 20 82 20 62 C20 44 30 12 50 12 Z', ZZ = 'M21 54 L31 47 L38 56 L47 46 L55 57 L63 47 L70 55 L79 48';
/* an eggshell: white, a shaded side (the shell minus itself shifted up and left), then the outline */
function shell(p, d) {
  p.path(d, { fill: 'white', line: false });
  p.clip(d, function () { p.path('M-50 -50 L150 -50 L150 150 L-50 150 Z M42 9 C22 9 12 41 12 59 C12 79 26 89 42 89 C58 89 72 79 72 59 C72 41 62 9 42 9 Z', { fill: 'smoke', line: false }); });
  p.path(d, {});
}
function yolk(p, x, y, sx, sy) {
  p.at(x, y, 0, [sx, sy], function () { p.blob(0, 0, 13, { fill: 'white', lumpy: 0.1, seed: 5, w: 0.8 }); });
  p.at(x + 1, y - 1, 0, [1 + (sx - 1) * 0.3, 1 + (sy - 1) * 0.35], function () { p.circle(0, 0, 7.5, { fill: 'yellow', w: 0.7 }); p.path('M-3 -4 C-1 -5.5 2 -5.5 3.5 -3.6', { ink: 'white', w: 0.5, detail: true }); });
}
D.add('egg', {
  fam: 'kitchen', tags: ['breakfast', 'yolk', 'crack', 'hatch', 'boiled', 'chicken', 'ไข่', '🥚'], loop: 2.4, still: 0.1, tapLen: 3.2, burst: false, margin: [14, 22, 8, 14],
  about: 'rocks on its round bottom like a roly-poly', tapAbout: 'cracks, the yolk drops out and splats, then hops back in and the shell closes',
  draw: function (p, t, s) {
    var u = s.tap, go = u >= 0, rock = 0.1 * wave(t, 2) * (0.6 + 0.4 * wave(t, 1, 0.2)), shake = go ? 0.06 * wave(u * 6.4, 1) * bump(seg(u, 0.04, 0.3)) : 0;
    var open = go ? eo(seg(u, 0.3, 0.4)) * (1 - ez(seg(u, 0.86, 0.94))) : 0, slide = go ? -14 * ez(seg(u, 0.26, 0.4)) * (1 - ez(seg(u, 0.88, 0.98))) : 0;
    var split = go && u > 0.28 && u < 0.94, f = go ? Math.max(0, seg(u, 0.38, 0.58) - seg(u, 0.7, 0.88)) : 0, q = go ? M.spring(seg(u, 0.56, 0.66)) * (1 - ez(seg(u, 0.7, 0.76))) : 0;
    var bx = 50 + slide + (82 - 50 - slide) * f, by = 50 + 36.5 * f - 62 * bump(f), sx = 1 + 0.55 * q - 0.1 * bump(f), sy = 1 - 0.58 * q + 0.25 * bump(f);
    p.ellipse(50 + slide, 93, 24, 3, { fill: 'stone', line: false, alpha: 0.7 });
    if (split && f < 0.04) yolk(p, 50 + slide, 52, 1, 1);
    p.at(slide + rock * 16, 0, 0, 1, function () {
      p.pivot(50, 76, rock + shake, 1, function () {
        if (!split) { shell(p, EGG); p.span(ZZ, seg(u, 0.94, 1), go ? seg(u, 0.12, 0.28) : 0, { w: 0.9 }); }
        else {
          p.pivot(79, 48, 0.8 * open, 1, function () { shell(p, 'M21.5 54 C23 40 31 12 50 12 C69 12 77 38 79 48 L70 55 L63 47 L55 57 L47 46 L38 56 L31 47 Z'); });
          shell(p, 'M21.5 54 L31 47 L38 56 L47 46 L55 57 L63 47 L70 55 L79 48 C80 56 80 62 80 62 C80 82 66 92 50 92 C34 92 20 82 20 62 C20 60 21 57 21.5 54 Z');
        }
        p.circle(33, 40, 1.2, { fill: 'wood', line: false, detail: true }); p.circle(64, 74, 1.3, { fill: 'wood', line: false, detail: true }); p.circle(40, 79, 1, { fill: 'wood', line: false, detail: true });
        if (!split) p.path('M28 34 C30 28 34 22 40 19', { ink: 'white', w: 0.8, detail: true });
      });
    });
    if (split && f >= 0.04) yolk(p, bx, by, sx, sy);
  }
});

/* 🍞 a two-slice toaster, the slices shivering as they toast, a little steam over them.
   Tap: the lever flies up and the toast pops, crumbs fly; the lever goes down and the slices sink back in. */
function slice(p, x, y, a) {
  p.at(x, y, a, 1, function () {
    p.path('M-13 48 L-13 9 C-18 3 -16 -8 -6 -8 C-3 -8 -2 -6 0 -6 C2 -6 3 -8 6 -8 C16 -8 18 3 13 9 L13 48 Z', { fill: 'wood' });
    p.path('M-9.4 48 L-9.4 9.5 C-13 4 -11.5 -4 -5.5 -4.2 C-3 -4.2 -2 -2.5 0 -2.5 C2 -2.5 3 -4.2 5.5 -4.2 C11.5 -4 13 4 9.4 9.5 L9.4 48 Z', { fill: 'sand', w: 0.45 });
    p.ellipse(-3, 5, 1.1, 0.7, { w: 0.3, detail: true }); p.ellipse(4, 12, 1.3, 0.8, { w: 0.3, detail: true }); p.ellipse(-4, 19, 1, 0.7, { w: 0.3, detail: true });
  });
}
D.add('toast', {
  fam: 'kitchen', tags: ['bread', 'toaster', 'breakfast', 'pop', 'crumbs', 'morning', 'ขนมปัง', '🍞'], loop: 2.4, still: 0.2, tapLen: 2, burst: 'ember', burstAt: [50, 36], burstN: 6, burstSpread: 2.2, margin: [30, 18, 14, 18],
  about: 'the slices shiver as they toast, steam rising', tapAbout: 'the lever flies up and the toast pops; it sinks back when the lever goes down',
  draw: function (p, t, s) {
    var u = s.tap, go = u >= 0, hl, hr, lev;
    if (go) {
      var h = function (d) { var v = seg(u, d, d + 0.3), sink = ez(seg(u, 0.62 + d, 0.82 + d)); return (30 * eo(v) - 12 * ez(seg(u, d + 0.3, d + 0.46))) * (1 - sink); };
      hl = h(0); hr = h(0.04); lev = 1 - eo(seg(u, 0, 0.12)) * (1 - ez(seg(u, 0.62, 0.78)));
    } else { hl = 1.3 * wave(t, 2); hr = 1.3 * wave(t, 2, 0.08); lev = 1; }
    slice(p, 35, 33 - hl, go ? -0.05 * bump(seg(u, 0, 0.5)) : 0.02 * wave(t, 3)); slice(p, 65, 33 - hr, go ? 0.05 * bump(seg(u, 0.04, 0.54)) : -0.02 * wave(t, 3, 0.1));
    p.rect(12, 54, 76, 36, { r: 8, fill: 'c' });
    p.rect(10, 49.5, 80, 9, { r: 4.5, fill: 'stone' });
    p.path('M17 64 C16 70 16 78 18 83', { ink: 'white', w: 0.8, detail: true });
    p.rect(78, 62, 4.4, 22, { r: 2.2, fill: 'night', w: 0.5 });
    p.rect(75.2, 63 + 14 * lev, 10, 5.5, { r: 2.2, fill: 'b', w: 0.8 });
    p.circle(24, 74, 5, { fill: 'cream', w: 0.7 }); p.at(24, 74, TAU * t, 1, function () { p.line(0, 0, 0, -4, { w: 0.6 }); });
    p.rect(18, 90, 10, 4, { r: 1.5, fill: 'stone', w: 0.6 }); p.rect(72, 90, 10, 4, { r: 1.5, fill: 'stone', w: 0.6 });
    if (!go) { steam(p, t, 38, 36, 20, 0.1, 0.6); steam(p, t, 62, 34, 20, 0.6, 0.6); }
  }
});

/* 🍦 a strawberry cone with a cherry on top. The cherry bobs, the melt drips off the scoop and falls.
   Tap: the scoop crouches and the cherry launches, spinning, and lands back in its dimple. */
function drip(p, x, len) { var l = x - 3.2, r = x + 3.2, y = 54 + len; p.path('M' + l + ' 53 L' + l + ' ' + y + ' C' + l + ' ' + (y + 4.4) + ' ' + r + ' ' + (y + 4.4) + ' ' + r + ' ' + y + ' L' + r + ' 53 Z', { fill: 'pink' }); }
D.add('ice-cream', {
  fam: 'kitchen', tags: ['cone', 'dessert', 'summer', 'scoop', 'melt', 'cherry', 'ไอศกรีม', '🍦'], loop: 2.8, still: 0.15, tapLen: 2, burst: false, margin: [34, 18, 18, 18],
  about: 'the cherry bobs and the melt drips off the scoop and falls', tapAbout: 'the scoop crouches and the cherry launches, spinning, and lands back',
  draw: function (p, t, s) {
    var u = s.tap, go = u >= 0, k, ph, len, a, b;
    var crouch = go ? bump(seg(u, 0, 0.16)) * 0.9 + bump(seg(u, 0.6, 0.76)) * 0.7 : 0, fl = go ? seg(u, 0.14, 0.6) : 0, cy = 11 + 1.8 * wave(t, 2) - 38 * bump(fl) + 2.5 * crouch, cr = TAU * fl + 0.12 * wave(t, 2, 0.2);
    p.path('M30 52 L70 52 L50 98 Z', { fill: 'sand' });
    p.clip('M30 52 L70 52 L50 98 Z', function () { for (k = 0; k < 9; k++) { p.line(18 + k * 8, 46, 68 + k * 8, 100, { w: 0.4, detail: true }); p.line(88 - k * 8, 46, 38 - k * 8, 100, { w: 0.4, detail: true }); } });
    [[26, 0], [74.5, 0.5]].forEach(function (d) {
      ph = M.frac(t + d[1]); len = 3 + (d[0] < 50 ? 12 : 9) * ei(seg(ph, 0, 0.7)) - 10 * ez(seg(ph, 0.7, 0.78)) * (d[0] < 50 ? 1 : 0.9);
      drip(p, d[0], len);
      var tau = seg(ph, 0.7, 0.95); if (tau > 0 && tau < 1) drop(p, d[0], 54 + (d[0] < 50 ? 14 : 11) + 3 + 42 * tau * tau, 1 - ei(seg(tau, 0.55, 1)), 'pink');
    });
    p.pivot(50, 54, 0, [1 + 0.05 * crouch, 1 - 0.1 * crouch], function () {
      p.path('M23 54 C20 34 32 13 50 13 C68 13 80 34 77 54 C75 59 69 59 66 55 C63 60 56 60 53 56 C50 60 44 60 41 56 C38 59 31 59 28 56 C26 58 23 57 23 54 Z', { fill: 'pink' });
      p.path('M30 38 C31 28 37 21 44 19', { ink: 'white', w: 0.8, detail: true });
      [[40, 36, 'a'], [57, 30, 'c'], [62, 44, 'a'], [46, 46, 'b'], [35, 47, 'c'], [68, 36, 'b']].forEach(function (d, i) { p.line(d[0], d[1], d[0] + 3, d[1] + (i % 2 ? 1.5 : -1.5), { ink: d[2], w: 0.5, cap: 'round', detail: true }); });
    });
    p.at(50, cy + 4, cr, 1, function () {
      p.path('M0 -6 C0 -14 6 -19 12 -19', { w: 0.7 });
      p.circle(0, 0, 6.4, { fill: 'red' });
      p.path('M-3.4 -2.6 C-2.6 -4 -1.4 -4.6 0 -4.6', { ink: 'white', w: 0.6, detail: true });
    });
  }
});

/* 🎂 a two-tier cake with three candles, the flames flickering left to right.
   Tap: a puff blows them out one after another, smoke curls up; then a spark relights each in turn. */
function frost(p, x0, x1, y, n, c) {
  var w = (x1 - x0) / n, d = 'M' + x0 + ' ' + y + ' L' + x1 + ' ' + y + ' L' + x1 + ' ' + (y + 5), i;
  for (i = 0; i < n; i++) d += ' Q' + (x1 - w * (i + 0.5)) + ' ' + (y + 5 + (i % 2 ? 9 : 5)) + ' ' + (x1 - w * (i + 1)) + ' ' + (y + 5);
  p.path(d + ' Z', { fill: c });
}
D.add('cake', {
  fam: 'kitchen', tags: ['birthday', 'candle', 'party', 'celebrate', 'wish', 'dessert', 'เค้ก', '🎂'], loop: 2.4, still: 0.15, tapLen: 3, burst: false, margin: [30, 22, 10, 22],
  about: 'three candle flames flicker, the left one leading', tapAbout: 'a puff blows the candles out one by one, smoke curls, then a spark relights each',
  draw: function (p, t, s) {
    var u = s.tap, go = u >= 0;
    p.ellipse(50, 91, 46, 6, { fill: 'white' });
    [[38, 12, 'a', 0], [50, 15, 'b', 0.17], [62, 12, 'c', 0.33]].forEach(function (c, i) {
      var x = c[0], top = 49 - c[1], ob = 0.12 + 0.05 * i, rl = 0.66 + 0.07 * i, fl = 1 + 0.2 * wave(t, 3, c[3]), lean = 0.26 * wave(t, 2, c[3]), f = 1, sm = 0, spark = 0;
      if (go) {
        if (u < 0.6) lean += 1.0 * ez(seg(u, ob - 0.1, ob - 0.02));
        f = u < 0.6 ? 1 - ez(seg(u, ob - 0.06, ob)) : M.spring(seg(u, rl, rl + 0.14));
        sm = seg(u, ob, ob + 0.5); spark = bump(seg(u, rl - 0.06, rl));
      }
      p.rect(x - 2.3, top, 4.6, c[1] + 2, { fill: 'white', w: 0.8 });
      p.line(x - 2.3, top + 4, x + 2.3, top + 1.5, { ink: c[2], w: 0.8, detail: true }); p.line(x - 2.3, top + 9, x + 2.3, top + 6.5, { ink: c[2], w: 0.8, detail: true });
      p.line(x, top, x, top - 2, { w: 0.5 });
      if (sm > 0 && sm < 1) p.span('M' + x + ' ' + (top - 2) + ' C' + (x - 4) + ' ' + (top - 8) + ' ' + (x + 4) + ' ' + (top - 13) + ' ' + x + ' ' + (top - 19) + ' C' + (x - 3) + ' ' + (top - 24) + ' ' + (x + 3) + ' ' + (top - 28) + ' ' + (x + 1) + ' ' + (top - 33), ei(seg(sm, 0.35, 1)), eo(seg(sm, 0, 0.7)), { w: 0.6, alpha: 0.8 });
      if (spark > 0) p.at(x, top - 3, 0.5, spark * 1.1, function () { D.bits.spark(p, 'a'); });
      if (f > 0.03) p.blob(x, top - 8, 8 * f * (1 + 0.12 * wave(t, 3, c[3] + 0.2)), { fill: 'flame', line: false, alpha: 0.28, lumpy: 0.06, seed: 3 });
      if (f > 0.03) p.at(x, top - 2, lean, [f, f * fl], function () {
        p.path('M0 0 C-3.6 -3.6 -2.8 -9 0 -14 C2.8 -9 3.6 -3.6 0 0 Z', { fill: 'flame', w: 0.7 });
        p.path('M0 -0.5 C-1.4 -2 -1.2 -4.5 0 -7 C1.2 -4.5 1.4 -2 0 -0.5 Z', { fill: 'yellow', line: false });
      });
    });
    p.rect(26, 52, 48, 18, { r: 4, fill: 'cream' }); frost(p, 26, 74, 52, 6, 'pink');
    p.rect(14, 68, 72, 22, { r: 5, fill: 'pink' }); frost(p, 14, 86, 68, 8, 'white');
    p.path('M16 82 C32 85 68 79 84 82', { w: 0.5, detail: true });
    [[22, 80], [36, 86], [52, 84], [66, 80], [78, 85]].forEach(function (d, i) { p.circle(d[0], d[1], 1.3, { fill: ['a', 'c', 'b', 'a', 'c'][i], line: false }); });
    if (go) [[8, 36, 0.12], [6, 42, 0.18]].forEach(function (w) { p.span('M' + w[0] + ' ' + w[1] + ' C' + (w[0] + 8) + ' ' + (w[1] - 2) + ' ' + (w[0] + 14) + ' ' + (w[1] + 2) + ' ' + (w[0] + 22) + ' ' + w[1], seg(u, w[2] + 0.04, w[2] + 0.14), eo(seg(u, w[2] - 0.1, w[2] + 0.06)), { w: 0.6 }); });
  }
});

/* 🍷 a glass of red wine, the wine swirling up one side and down the other as the glass circles.
   Tap: a second glass swings in and clinks; the wine slops, sparks fly; it leaves and the first glass settles. */
function wine(p, cx, col, slosh, tilt) {
  p.pivot(cx, 90, tilt, 1, function () {
    p.ellipse(cx, 90, 17, 3.6, { fill: 'white' });
    p.path('M' + (cx - 3) + ' 87 C' + (cx - 2) + ' 74 ' + (cx - 1.4) + ' 64 ' + (cx - 1.4) + ' 56 L' + (cx + 1.4) + ' 56 C' + (cx + 1.4) + ' 64 ' + (cx + 2) + ' 74 ' + (cx + 3) + ' 87 Z', { fill: 'white', w: 0.8 });
    vessel(p, 'M' + (cx - 17.24) + ' 14 A21 28 0 1 0 ' + (cx + 17.24) + ' 14 Z', 'white', function () { p.at(cx, 36, slosh, 1, function () { p.rect(-30, 0, 60, 40, { fill: col, line: false }); p.ellipse(0, 0, 24, 3.2, { w: 0.5 }); }); });
    p.ellipse(cx, 14, 17.2, 3.2, { w: 0.9 });
    p.path('M' + (cx - 14) + ' 24 C' + (cx - 14) + ' 32 ' + (cx - 10) + ' 40 ' + (cx - 5) + ' 46', { ink: 'white', w: 0.8, detail: true });
  });
}
D.add('wine', {
  fam: 'kitchen', tags: ['glass', 'red', 'drink', 'cheers', 'toast', 'dinner', 'vineyard', 'ไวน์', '🍷'], loop: 2.6, still: 0.2, tapLen: 2.4, burst: false, margin: [10, 44, 8, 18],
  about: 'the wine swirls up one side and down the other as the glass circles', tapAbout: 'a second glass swings in and clinks, the wine slops and sparks fly',
  draw: function (p, t, s) {
    var u = s.tap, go = u >= 0, slosh = 0.28 * wave(t, 1), tilt = 0.05 * wave(t, 1, 0.12), sx = 1.4 * wave(t, 1, 0.25);
    if (!go) { wine(p, 50 + sx, 'plum', slosh, tilt); return; }
    var m = ez(seg(u, 0, 0.25)) * (1 - ez(seg(u, 0.75, 0.95))), hit = bump(seg(u, 0.3, 0.5)), far = 1 - ez(seg(u, 0.02, 0.3)) + ez(seg(u, 0.74, 0.96));
    var sl = u > 0.3 ? 0.4 * Math.exp(-6 * (u - 0.3)) * wave(u - 0.3, 3) : 0;
    wine(p, 50 - 10 * m + sx * (1 - m), 'plum', slosh + sl, tilt + 0.06 * m - 0.09 * hit);
    wine(p, 83.5 + 80 * far, 'yellow', -0.8 * (slosh + sl), -0.07 * (1 - Math.min(1, far)) + 0.09 * hit);
    for (var a = -2.3; a < -0.8; a += 0.73) {
      var r0 = 4 + 7 * ei(seg(u, 0.4, 0.56)), r1 = 4 + 9 * eo(seg(u, 0.3, 0.46));
      if (r1 - r0 > 0.6) p.line(62 + Math.cos(a) * r0, 9 + Math.sin(a) * r0, 62 + Math.cos(a) * r1, 9 + Math.sin(a) * r1, { w: 0.6 });
    }
    if (hit > 0.02) p.at(62, 9, 0.3, 0.4 + hit * 0.8, function () { D.bits.star(p, 'a'); });
  }
});

/* 🍺 a mug of beer, bubbles climbing through it, the foam head swelling and settling.
   Tap: the head rises and spills over the rim and runs down the sides, then draws back and settles. */
D.add('beer', {
  fam: 'kitchen', tags: ['mug', 'pint', 'foam', 'pub', 'cheers', 'lager', 'drink', 'เบียร์', '🍺'], loop: 2.6, still: 0.2, tapLen: 2.6, burst: false, margin: [26, 22, 8, 18],
  about: 'bubbles climb through the beer, the foam head swelling and settling', tapAbout: 'the head rises, spills over the rim and runs down the sides, then settles',
  draw: function (p, t, s) {
    var u = s.tap, go = u >= 0, H = go ? bump(seg(u, 0.08, 0.7)) : 0, spill = go ? eo(seg(u, 0.2, 0.5)) * (1 - ez(seg(u, 0.62, 0.95))) : 0;
    p.path('M72 34 C99 30 99 82 69 82 L69.4 75 C88 75 88 40 72.6 41 Z', { fill: 'white' });
    p.path('M27 24 L73 24 L69 88 C69 92 66 94 62 94 L38 94 C34 94 31 92 31 88 Z', { fill: 'a' });
    p.line(33, 83, 67, 83, { w: 0.4, detail: true });
    p.path('M34 40 C34.6 58 35.4 72 36 80', { ink: 'white', w: 0.8, detail: true });
    [[40, 0.0, 1], [47, 0.31, 1.3], [54, 0.62, 0.9], [60, 0.17, 1.2], [65, 0.78, 0.8], [43, 0.5, 0.8]].forEach(function (b) {
      var ph = M.frac(t + b[1]), y = 86 - 52 * ph, x = b[0] + 1.3 * wave(t, 2, b[1]);
      p.circle(x, y, b[2] * (0.8 + 0.5 * ph), { w: 0.4, detail: true });
    });
    [[30.5, 26 * spill, 0], [69.5, 16 * spill, 0.2]].forEach(function (d) {
      if (d[1] > 0.5) p.path('M' + (d[0] - 2.8) + ' 30 L' + (d[0] - 2.8) + ' ' + (30 + d[1]) + ' C' + (d[0] - 2.8) + ' ' + (34 + d[1]) + ' ' + (d[0] + 2.8) + ' ' + (34 + d[1]) + ' ' + (d[0] + 2.8) + ' ' + (30 + d[1]) + ' L' + (d[0] + 2.8) + ' 30 Z', { fill: 'white' });
    });
    [[30, 29, 6, 0], [40, 22, 8.5, 0.2], [52, 20, 9.5, 0.45], [64, 23, 8.5, 0.7], [71, 29, 5.5, 0.9], [34, 35, 5.5, 0.3], [45, 37, 5.5, 0.6], [57, 37, 6, 0.1], [67, 35, 5, 0.8]].forEach(function (c) {
      var lift = c[1] < 30 ? H * (9 + (c[0] === 52 ? 6 : 0)) : H * 2;
      p.circle(c[0], c[1] - lift + 0.9 * wave(t, 1, c[3]), c[2] * (1 + 0.05 * wave(t, 1, c[3]) + 0.25 * H), { fill: 'white', w: 0.8 });
    });
    p.circle(47, 18 - 12 * H, 1.4, { w: 0.4, detail: true }); p.circle(58, 22 - 10 * H, 1.1, { w: 0.4, detail: true });
  }
});

/* 🍕 a pizza with a slice lifting away: cheese strings stretch between slice and pie, thin out, and snap.
   Tap: a bigger pull, the strings stretch far and snap, the slice drops back with a bounce. */
D.add('pizza', {
  fam: 'kitchen', tags: ['slice', 'cheese', 'pepperoni', 'pull', 'italian', 'dinner', 'พิซซ่า', '🍕'], loop: 3, still: 0.5, tapLen: 2.2, burst: false, margin: [26, 22, 12, 12],
  about: 'a slice lifts away and the cheese strings stretch, thin out and snap', tapAbout: 'a bigger pull, the strings stretch far and snap, the slice drops back with a bounce',
  draw: function (p, t, s) {
    var u = s.tap, go = u >= 0, th = -0.8, hw = 0.4, C = [36, 64], R = 31;
    var pull = ez(seg(t, 0.05, 0.5)) * (1 - ez(seg(t, 0.62, 0.9))), rec = eo(seg(t, 0.56, 0.68));
    if (go) { var w = ez(seg(u, 0, 0.08)) * (1 - ez(seg(u, 0.92, 1))); pull = M.lerp(pull, 1.5 * ez(seg(u, 0.05, 0.44)) * (1 - eo(seg(u, 0.5, 0.68))) + 0.2 * bump(seg(u, 0.68, 0.84)), w); rec = M.lerp(rec, eo(seg(u, 0.46, 0.58)), w); }
    var rot = -0.3 * pull, sc = 1 + 0.15 * pull, V = [16 * pull, -22 * pull], at = th + rot;
    var edge = function (r, ang, j) { return [C[0] + r * Math.cos(ang + j * hw), C[1] + r * Math.sin(ang + j * hw)]; };
    var wedge = function (r) { return 'M0 0 L' + r * Math.cos(hw) + ' ' + r * Math.sin(hw) + ' A' + r + ' ' + r + ' 0 0 0 ' + r * Math.cos(hw) + ' ' + -r * Math.sin(hw) + ' Z'; };
    var P1 = edge(R, th, 1), P2 = edge(R, th, -1), Q1 = edge(R - 4.5, th, 1), Q2 = edge(R - 4.5, th, -1);
    p.path('M' + C + ' L' + P1 + ' A' + R + ' ' + R + ' 0 1 1 ' + P2 + ' Z', { fill: 'wood' });
    p.path('M' + C + ' L' + Q1 + ' A' + (R - 4.5) + ' ' + (R - 4.5) + ' 0 1 1 ' + Q2 + ' Z', { fill: 'gold', line: false });
    [[2.34, 0.5], [1.15, 0.64], [3.55, 0.62], [0.3, 0.72]].forEach(function (d, k) {
      var x = C[0] + R * d[1] * Math.cos(d[0]), y = C[1] + R * d[1] * Math.sin(d[0]);
      p.circle(x, y, 4.4, { fill: 'red', w: 0.6 }); p.circle(x - 1.2, y - 1, 0.7, { fill: 'rose', line: false, detail: true }); p.circle(x + 1.5, y + 1.2, 0.6, { fill: 'rose', line: false, detail: true });
    });
    p.circle(C[0] - 8, C[1] - 14, 2.2, { fill: 'green', w: 0.4, detail: true });
    p.at(C[0] + V[0], C[1] + V[1], at, sc, function () {
      p.path(wedge(R), { fill: 'wood' });
      p.path(wedge(R - 4.5), { fill: 'gold', line: false });
      p.circle(17, 0, 4.2, { fill: 'red', w: 0.6 }); p.circle(25, 0.5, 3.8, { fill: 'red', w: 0.6 }); p.circle(16, -1, 0.6, { fill: 'rose', line: false, detail: true });
    });
    [[1, 0.5], [-1, 0.62], [1, 0.8], [-1, 0.92]].forEach(function (d) {
      var r = R * d[1], A = edge(r, th, d[0]), B = [C[0] + V[0] + sc * r * Math.cos(at + d[0] * hw), C[1] + V[1] + sc * r * Math.sin(at + d[0] * hw)];
      var len = Math.hypot(B[0] - A[0], B[1] - A[1]), sag = Math.max(0, 10 - len * 0.2), d1 = 'M' + A + ' Q' + ((A[0] + B[0]) / 2) + ' ' + ((A[1] + B[1]) / 2 + sag) + ' ' + B;
      if (pull < 0.05 || rec > 0.98) return;
      var wt = Math.max(0.25, 0.8 - 0.4 * pull), seg2 = function (a, b) { p.span(d1, a, b, { w: wt * 0.75, wob: 0, cap: 'round' }); p.span(d1, a, b, { w: wt * 0.3, ink: 'yellow', wob: 0, cap: 'round' }); };
      if (rec < 0.01) seg2(0, 1); else { seg2(0, 0.5 * (1 - rec)); seg2(1 - 0.5 * (1 - rec), 1); }
    });
    if (pull < 0.3) steam(p, t, 28, 56, 20, 0.2, 0.6);
  }
});

/* 🍿 a popcorn bucket, kernels popping out of it one at a time, left to right, each swelling as it flies.
   Tap: the bucket squashes and a fountain of popcorn goes off. */
function puff(p, x, y, r, a) {
  p.at(x, y, a, 1, function () {
    [[0.55, 0.2, 0.62], [-0.55, 0.2, 0.62], [0, -0.45, 0.66], [0, 0.35, 0.6]].forEach(function (c) { p.circle(c[0] * r, c[1] * r, c[2] * r, { fill: 'cream', w: 0.7 }); });
    p.circle(0.1 * r, 0.62 * r, 0.16 * r, { fill: 'gold', line: false, detail: true });
  });
}
function popper(p, x, y, r, a, pop) {
  if (pop < 0.1) { p.dot(x, y, 2.2, 'gold'); return; }
  var k = 0.4 + 0.6 * M.spring(seg(pop, 0.1, 0.4));
  puff(p, x, y, r * k, a);
  if (pop < 0.3) for (var i = 0; i < 4; i++) { var an = 0.8 + i * 1.5, r0 = r * (0.9 + 3 * seg(pop, 0.1, 0.3)), r1 = r0 + 2.5 * bump(seg(pop, 0.1, 0.3)); p.line(x + Math.cos(an) * r0, y + Math.sin(an) * r0, x + Math.cos(an) * (r0 + r1 * 0.5), y + Math.sin(an) * (r0 + r1 * 0.5), { w: 0.4, detail: true }); }
}
D.add('popcorn', {
  fam: 'kitchen', tags: ['movie', 'cinema', 'snack', 'pop', 'corn', 'butter', 'ข้าวโพดคั่ว', '🍿'], loop: 2.4, still: 0.3, tapLen: 2, burst: false, margin: [12, 20, 8, 20],
  about: 'kernels pop out of the bucket one after another, swelling as they fly', tapAbout: 'the bucket squashes and a fountain of popcorn goes off',
  draw: function (p, t, s) {
    var u = s.tap, go = u >= 0, sq = go ? bump(seg(u, 0, 0.2)) : 0, i;
    p.pivot(50, 94, 0, [1 + 0.05 * sq, 1 - 0.07 * sq], function () {
      [[32, 46, 6], [70, 46, 6], [42, 44, 7], [62, 44, 7], [52, 42, 7.5], [38, 40, 5.5], [58, 38, 6], [66, 41, 5], [48, 37, 6]].sort(function (a, b) { return a[1] - b[1]; }).forEach(function (c, k) { puff(p, c[0], c[1] + 0.8 * wave(t, 1, k * 0.13), c[2], 0.2 * (k % 3 - 1)); });
      [[36, 0, 40], [60, 0.27, 46], [48, 0.52, 42], [68, 0.77, 36]].forEach(function (f, k) {
        var tau = M.frac(t + f[1]); popper(p, f[0] + 4 * (tau - 0.5), 56 - 4 * f[2] * tau * (1 - tau), 5.5, TAU * tau * (k % 2 ? 1 : -1) * 0.7, tau);
      });
      if (go) for (i = 0; i < 10; i++) {
        var tau = seg(u, i * 0.045, i * 0.045 + 0.55), x0 = 30 + (i * 17) % 40, H = 38 + (i * 13) % 22, dx = ((i * 29) % 11 - 5) * 2.4;
        if (tau > 0 && tau < 1) popper(p, x0 + dx * (tau - 0.5) * 2, 56 - 4 * H * tau * (1 - tau), 5.5 + (i % 3) * 0.4, TAU * tau * (i % 2 ? 1 : -1) * 0.8, tau);
      }
      p.path('M25 52 L75 52 L69 94 L31 94 Z', { fill: 'white', line: false });
      for (i = 0; i < 6; i += 2) p.poly([[25.4 + 8.33 * i, 52], [25 + 8.33 * (i + 1) - 0.4, 52], [31 + 6.33 * (i + 1) - 0.3, 94], [31.3 + 6.33 * i, 94]], { fill: 'b', line: false });
      p.path('M25 52 L75 52 L69 94 L31 94 Z', {});
      p.rect(23, 49.5, 54, 5, { r: 2.5, fill: 'b' });
    });
  }
});

/* 🧋 bubble tea with a fat straw. Pearls climb the straw one by one, hang, and slide back down.
   Tap: a long slurp: the tea level dips, a train of pearls shoots up the straw and falls back, bubbles pop out at the top. */
D.add('bubble-tea', {
  fam: 'kitchen', tags: ['boba', 'pearls', 'tapioca', 'milk tea', 'straw', 'drink', 'cup', 'ชานมไข่มุก', '🧋'], loop: 2.8, still: 0.3, tapLen: 2.4, burst: false, margin: [34, 24, 6, 20],
  about: 'pearls climb the straw one by one, hang, and slide back down', tapAbout: 'a long slurp: the tea dips, a train of pearls shoots up the straw and falls back, bubbles pop out',
  draw: function (p, t, s) {
    var u = s.tap, go = u >= 0, dip = go ? bump(seg(u, 0.08, 0.75)) : 0, i;
    var B = [47, 86], T = [60, -2], nx = 0.989, ny = 0.146;
    var P = function (f) { return [B[0] + (T[0] - B[0]) * f, B[1] + (T[1] - B[1]) * f]; };
    var tube = function (f0, f1) { var a = P(f0), b = P(f1); p.poly([[a[0] - 3.2 * nx, a[1] - 3.2 * ny], [b[0] - 3.2 * nx, b[1] - 3.2 * ny], [b[0] + 3.2 * nx, b[1] + 3.2 * ny], [a[0] + 3.2 * nx, a[1] + 3.2 * ny]], { fill: 'white', w: 0.8 }); };
    var pearl = function (f) { var q = P(f); p.circle(q[0], q[1], 2.2, { fill: 'black', w: 0.4 }); p.circle(q[0] - 0.7, q[1] - 0.7, 0.5, { fill: 'white', line: false, detail: true }); };
    var ride = [];
    [0, 0.33, 0.66].forEach(function (o) { var ph = M.frac(t + o); ride.push(0.78 * eo(seg(ph, 0, 0.4)) * (1 - ei(seg(ph, 0.62, 1)))); });
    if (go) for (i = 0; i < 5; i++) ride.push(0.95 * eo(seg(u, 0.06 + 0.05 * i, 0.36 + 0.05 * i)) * (1 - ei(seg(u, 0.62 + 0.04 * i, 0.95))));
    vessel(p, 'M27 36 L73 36 L67 92 C67 95 64 96 61 96 L39 96 C36 96 33 95 33 92 Z', 'white', function () {
      p.rect(20, 44 + 6 * dip, 60, 60, { fill: 'wood', line: false });
      p.line(20, 44 + 6 * dip, 80, 44 + 6 * dip, { w: 0.4 });
      [[37, 89], [44, 89.5], [51, 90], [58, 89.5], [65, 89], [40.5, 83], [47.5, 83.5], [54.5, 83.5], [61.5, 83], [44, 77.5], [51, 77.5], [58, 77.5]].forEach(function (c) { p.circle(c[0], c[1], 3.3, { fill: 'black', w: 0.5 }); });
    });
    tube(0, 0.62);
    ride.forEach(function (f) { if (f > 0.03 && f < 0.62) pearl(f); });
    p.rect(24, 34, 52, 5, { r: 2.5, fill: 'stone' });
    p.path('M30 34 C30 22 70 22 70 34 Z', { fill: 'white' });
    p.path('M35 31 C38 27 44 25 49 25', { ink: 'white', w: 0.6, detail: true });
    tube(0.62, 1);
    for (i = 0; i < 3; i++) { var a = P(0.7 + i * 0.1); p.line(a[0] - 3, a[1] + 1.5, a[0] + 3, a[1] - 1.5, { ink: 'b', w: 0.6, detail: true }); }
    ride.forEach(function (f) { if (f >= 0.62) pearl(f); });
    if (go) for (i = 0; i < 4; i++) { var tau = seg(u, 0.36 + 0.07 * i, 0.9 + 0.03 * i); if (tau > 0 && tau < 1) p.at(60 + (i % 2 ? 1 : -1) * (4 + 3 * i) * tau + 1.4 * wave(tau, 2), -4 - 24 * tau, 0, (0.7 + 0.2 * i) * (1 - ei(seg(tau, 0.75, 1))), function () { p.circle(0, 0, 4, { w: 0.6 }); p.arc(0, 0, 2.4, -2.6, -1.6, { w: 0.5 }); }); }
  }
});

/* 🍋 half a lemon hanging over a plate: a bead of juice swells at its lowest point, falls, and ripples the puddle.
   Tap: squeezed flat, it sprays juice in an arc, then springs back round. */
D.add('lemon', {
  fam: 'kitchen', tags: ['citrus', 'squeeze', 'juice', 'sour', 'fruit', 'drip', 'มะนาว', '🍋'], loop: 2.8, still: 0.4, tapLen: 2, burst: false, margin: [22, 26, 6, 22],
  about: 'a bead of juice swells at the lowest point, falls and ripples the plate', tapAbout: 'squeezed flat, it sprays juice in an arc, then springs back round',
  draw: function (p, t, s) {
    var u = s.tap, go = u >= 0, q = go ? (u < 0.3 ? ez(seg(u, 0.05, 0.2)) : 1 - M.spring(seg(u, 0.3, 0.75))) : 0, bob = 1.6 * wave(t, 1), i, ph = M.frac(t);
    p.ellipse(50, 92, 40, 6.5, { fill: 'white' }); p.ellipse(50, 92, 26, 3.6, { w: 0.4, detail: true });
    p.ellipse(52, 91.5, 11, 2, { fill: 'yellow', line: false, alpha: 0.7 });
    var rp = seg(ph, 0.75, 1); if (rp > 0 && rp < 1) p.span('M' + (43 - 9 * eo(rp)) + ' 91.5 A' + 9 * eo(rp) + ' 2 0 1 1 ' + (43 + 9 * eo(rp)) + ' 91.5 A' + 9 * eo(rp) + ' 2 0 1 1 ' + (43 - 9 * eo(rp)) + ' 91.5', ei(seg(rp, 0.3, 1)), 1, { w: 0.4 });
    var bead = seg(ph, 0, 0.62), fall = seg(ph, 0.62, 0.78);
    p.at(50, 44 + bob, -0.35, [1 + 0.22 * q, 1 - 0.25 * q], function () {
      p.path('M38 2 C44 -8 54 -8 58 -6 C54 0 46 4 38 0 Z', { fill: 'leaf', w: 0.7 });
      p.path('M-40 2 C-40 -4 -37 -6 -34 -8 C-30 -20 -16 -27 0 -27 C16 -27 30 -20 34 -8 C37 -6 40 -4 40 2 C40 8 37 10 34 12 C30 24 16 29 0 29 C-16 29 -30 24 -34 12 C-37 10 -40 8 -40 2 Z', { fill: 'yellow' });
      p.ellipse(0, 1, 30, 23, { fill: 'white', w: 0.5 });
      p.ellipse(0, 1, 26.5, 20, { fill: 'cream', line: false });
      p.clip('M-26.5 1 A26.5 20 0 1 0 26.5 1 A26.5 20 0 1 0 -26.5 1 Z', function () { for (i = 0; i < 9; i++) { var an = i * TAU / 9 + 0.2; p.line(2.5 * Math.cos(an), 1 + 2.5 * Math.sin(an), 40 * Math.cos(an), 1 + 40 * Math.sin(an), { w: 0.4, detail: true }); } });
      p.ellipse(0, 1, 26.5, 20, { w: 0.4 });
      p.circle(0, 1, 2, { fill: 'white', w: 0.4, detail: true });
    });
    if (bead < 1 || fall < 1) {
      if (fall <= 0) p.at(45, 68 + bob + 2 * bead, 0, 0.3 + 0.9 * ez(bead), function () { p.path('M0 -4.5 C2.8 -0.8 3.4 1.6 0 3.8 C-3.4 1.6 -2.8 -0.8 0 -4.5 Z', { fill: 'yellow', w: 0.6 }); });
      else if (fall < 1) drop(p, 45, 71 + bob + 17 * fall * fall, 1.2, 'yellow');
    }
    if (go) for (i = 0; i < 6; i++) {
      var tau = seg(u, 0.18 + 0.02 * i, 0.72 + 0.02 * i), vx = [-26, -15, -5, 6, 17, 27][i], vy = [34, 46, 54, 50, 42, 32][i];
      if (tau > 0 && tau < 1) drop(p, 50 + vx * tau, 30 - vy * tau + (56 + vy) * tau * tau, 1 - ei(seg(tau, 0.8, 1)), 'yellow');
    }
  }
});

/* 🧂 a salt shaker, the grains hopping inside the glass, rocking on its foot.
   Tap: it flips over and shakes, a shower of salt falling from the holes; then it rights itself. */
D.add('salt', {
  fam: 'kitchen', tags: ['shaker', 'seasoning', 'sprinkle', 'condiment', 'table', 'pinch', 'เกลือ', '🧂'], loop: 2.4, still: 0.2, tapLen: 2.4, burst: false, margin: [30, 22, 14, 22],
  about: 'grains hop inside the glass while it rocks on its foot', tapAbout: 'flips over and shakes, a shower of salt from the holes, then rights itself',
  draw: function (p, t, s) {
    var u = s.tap, go = u >= 0, fl = go ? ez(seg(u, 0, 0.22)) * (1 - ez(seg(u, 0.78, 0.98))) : 0, hold = go ? bump(seg(u, 0.22, 0.8)) : 0, i;
    var A = 0.04 * wave(t, 1) * (1 - fl) + 2.7 * fl + 0.18 * hold * wave(u * 10, 1), dx = -16 * fl, dy = -30 * fl + 3 * hold * wave(u * 10, 1, 0.25);
    var c = Math.cos(A), sn = Math.sin(A), holes = [[40, 31], [45, 26.5], [50, 25], [55, 26.5], [60, 31]];
    p.at(dx, dy, 0, 1, function () {
      p.pivot(50, 56, A, 1, function () {
        vessel(p, 'M30 38 C28 54 28 72 30 90 C30 93 34 94 38 94 L62 94 C66 94 70 93 70 90 C72 72 72 54 70 38 Z', 'white', function () {
          p.rect(20, 30, 60, 28, { fill: 'sky', line: false });
          for (i = 0; i < 6; i++) p.circle(37 + i * 5.2, 55 - 7 * Math.abs(Math.sin(Math.PI * (2 * t + i * 0.37))) - 2 * hold, 1.2, { fill: 'white', w: 0.4, detail: true });
        });
        p.span('M34 42 C33.4 58 33.4 70 34.4 84', ei(seg(M.frac(t), 0.3, 1)), eo(seg(M.frac(t), 0, 0.7)), { ink: 'white', w: 0.8, detail: true });
        p.path('M28 40 C28 28 40 19 50 19 C60 19 72 28 72 40 Z', { fill: 'smoke' });
        p.rect(27, 37, 46, 6, { r: 3, fill: 'stone' });
        holes.forEach(function (h) { p.dot(h[0], h[1], 1.3, 'ink'); });
      });
    });
    if (fl > 0.6) for (i = 0; i < 24; i++) {
      var k = i % 5, tau = M.frac(u * 3.2 + i * 0.043), hx = 50 + dx + c * (holes[k][0] - 50) - sn * (holes[k][1] - 56), hy = 56 + dy + sn * (holes[k][0] - 50) + c * (holes[k][1] - 56);
      var sc = 1 - ei(seg(tau, 0.7, 1)); if (sc > 0.05) p.circle(hx + (k - 2) * 13 * tau + ((i * 7) % 5 - 2) * 2.5 * tau, hy + 8 * tau + 95 * tau * tau, 1.3 * sc, { fill: 'white', w: 0.4 });
    }
  }
});

/* 🍲 a red stock pot on a gas ring, the lid rattling and steam slipping out round it.
   Tap: it boils over: the lid pops up, foam and steam spill out and down the sides, the lid slams back. */
D.add('pot', {
  fam: 'kitchen', tags: ['cooking', 'boil', 'stew', 'soup', 'stove', 'lid', 'kitchen', 'หม้อ', '🍲'], loop: 2, still: 0.3, tapLen: 2, burst: false, margin: [34, 18, 4, 18],
  about: 'the lid rattles and steam slips out round it, flames flicker below', tapAbout: 'boils over: the lid pops up, foam and steam spill out, the lid slams back down',
  draw: function (p, t, s) {
    var u = s.tap, go = u >= 0, i, hop = Math.max(0, wave(t, 5)), pop = go ? eo(seg(u, 0.12, 0.3)) * (1 - ei(seg(u, 0.55, 0.68))) : 0, fo = go ? eo(seg(u, 0.14, 0.4)) * (1 - ez(seg(u, 0.62, 0.9))) : 0, sq = go ? bump(seg(u, 0.66, 0.8)) : 0;
    var boost = go ? 4 * bump(seg(u, 0.1, 0.8)) : 0;
    for (i = 0; i < 5; i++) {
      var x = 28 + i * 11, h = 10 + 2 * wave(t, 3, i * 0.12) + boost;
      p.path('M' + (x - 4) + ' 99 C' + (x - 4.5) + ' ' + (99 - h * 0.45) + ' ' + (x - 1) + ' ' + (99 - h * 0.7) + ' ' + x + ' ' + (99 - h) + ' C' + (x + 1) + ' ' + (99 - h * 0.7) + ' ' + (x + 4.5) + ' ' + (99 - h * 0.45) + ' ' + (x + 4) + ' 99 Z', { fill: 'flame', w: 0.6 });
    }
    p.pivot(50, 88, 0, [1 + 0.04 * sq, 1 - 0.06 * sq], function () {
      p.rect(8, 51, 15, 7, { r: 3.5, fill: 'brown', w: 0.7 }); p.rect(77, 51, 15, 7, { r: 3.5, fill: 'brown', w: 0.7 });
      p.path('M20 46 L80 46 L78 80 C78 84 74 86 70 86 L30 86 C26 86 22 84 22 80 Z', { fill: 'b' });
      p.path('M27 54 C26.4 62 26.8 70 27.6 78', { ink: 'white', w: 0.8, detail: true });
      if (fo > 0.02) {
        [[24, 30], [76, 18]].forEach(function (d) { p.path('M' + (d[0] - 3) + ' 48 L' + (d[0] - 3) + ' ' + (48 + d[1] * fo) + ' C' + (d[0] - 3) + ' ' + (52 + d[1] * fo) + ' ' + (d[0] + 3) + ' ' + (52 + d[1] * fo) + ' ' + (d[0] + 3) + ' ' + (48 + d[1] * fo) + ' L' + (d[0] + 3) + ' 48 Z', { fill: 'white' }); });
        [[30, 44, 7], [42, 42, 8], [54, 41, 8.5], [66, 43, 7.5], [76, 46, 5], [22, 46, 5]].forEach(function (c, k) { p.circle(c[0], c[1] - 11 * fo * (k < 4 ? 1 : 0.3) + 1.2 * wave(t, 2, k * 0.17), c[2] * (0.4 + 0.6 * fo), { fill: 'white', w: 0.8 }); });
      }
      p.at(0, -20 * pop - 1.8 * hop * (1 - pop), 0, 1, function () {
        p.pivot(80, 46, -0.3 * pop, 1, function () {
          p.pivot(50, 46, 0.035 * wave(t, 5, 0.1) * (1 - pop), 1, function () {
            p.path('M17 46 C19 33 81 33 83 46 Z', { fill: 'smoke' });
            p.rect(44, 28.5, 12, 5, { r: 2.5, fill: 'brown', w: 0.8 });
            p.path('M25 42 C30 37 36 35 42 34.5', { ink: 'white', w: 0.8, detail: true });
          });
        });
      });
    });
    steam(p, t, 24, 44, 24 + 8 * boost, 0, 0.7 + 0.1 * boost); steam(p, t, 76, 44, 22 + 8 * boost, 0.5, 0.7 + 0.1 * boost); steam(p, t, 50, 26 - 20 * pop, 22 + 10 * boost, 0.25, 0.7 + 0.15 * boost);
  }
});

/* 🥣 a mixing bowl and a balloon whisk beating it, the batter swirling round.
   Tap: a flurry of whisking, the whisk flies about and the batter splashes out and back in. */
D.add('whisk', {
  fam: 'kitchen', tags: ['baking', 'mix', 'batter', 'bowl', 'beat', 'cream', 'eggs', 'ตะกร้อ', '🥣'], loop: 1.6, still: 0.2, tapLen: 1.8, burst: false, margin: [34, 22, 12, 22],
  about: 'the whisk beats the bowl and the batter swirls round', tapAbout: 'a flurry of whisking, the batter splashes out and back in',
  draw: function (p, t, s) {
    var u = s.tap, go = u >= 0, env = go ? bump(seg(u, 0.04, 0.9)) : 0, i, a = 0.22 * wave(t, 2) + env * 0.16 * wave(u, 6), lift = go ? 14 * bump(seg(u, 0.55, 0.95)) : 0;
    var ang = TAU * 2 * t + (go ? TAU * 5 * ez(seg(u, 0, 0.9)) : 0);
    p.ellipse(50, 57, 40, 9, { fill: 'white' });
    p.ellipse(50, 58, 36, 6.8, { fill: 'cream', w: 0.6 });
    [[28, 0], [19, 2.1], [10, 4.2]].forEach(function (r) { p.arc(50, 58, r[0], ang + r[1], ang + r[1] + 2.3, { ry: r[0] * 0.19, w: 0.5, ink: 'wood', wob: 0.4 }); });
    p.pivot(50, 60, a, 1, function () {
      p.at(0, -lift, 0, 1, function () {
        p.rect(46, -4, 8, 30, { r: 4, fill: 'wood' });
        p.rect(45, 24, 10, 6, { r: 1.5, fill: 'stone', w: 0.7 });
        [12, 8, 4].forEach(function (h) { p.path('M50 30 C' + (50 + h) + ' 40 ' + (50 + h * 0.9) + ' 54 50 62 C' + (50 - h * 0.9) + ' 54 ' + (50 - h) + ' 40 50 30 Z', { w: 0.6 }); });
        p.line(50, 30, 50, 62, { w: 0.6 });
      });
    });
    for (i = 0; i < 6; i++) {
      var tau = go ? seg(u, 0.12 + 0.04 * i, 0.62 + 0.04 * i) : 0;
      if (tau > 0 && tau < 1) drop(p, 50 + (i - 2.5) * 13 * tau * 1.3 + (i % 2 ? 4 : -4), 56 - 4 * (40 + 6 * (i % 3)) * tau * (1 - tau), 1 - ei(seg(tau, 0.7, 1)), 'cream');
    }
    p.path('M10 57 A40 9 0 0 0 90 57 C88 80 72 92 50 92 C28 92 12 80 10 57 Z', { fill: 'sky' });
    p.path('M16 74 C34 84 66 84 84 74', { ink: 'white', w: 0.8, detail: true });
    p.path('M38 92 L40 96 L60 96 L62 92', { w: 0.8 });
  }
});

/* the donut's outer radius in direction th once a bite of size bs (0..1) is out of its top right: three overlapping circles, so the cut is scalloped */
function bitten(th, bs) {
  var R = 38, i, a, rho, d, sn, x;
  for (i = -1; i <= 1; i++) {
    a = -0.7 + i * 0.42; rho = (i ? 12 : 14.5) * bs; d = Math.atan2(Math.sin(th - a), Math.cos(th - a)); sn = 41 * Math.sin(d);
    if (Math.abs(d) < 1.5 && rho > Math.abs(sn)) R = Math.min(R, 41 * Math.cos(d) - Math.sqrt(rho * rho - sn * sn));
  }
  return R;
}
/* a ring as path data: the outer edge by radius function rf, then a round hole of radius rh wound the other way */
function ring(rf, rh) {
  var d = '', k, th, N = 56;
  for (k = 0; k < N; k++) { th = k * TAU / N; d += (k ? 'L' : 'M') + (50 + rf(th) * Math.cos(th)) + ' ' + (52 + rf(th) * Math.sin(th)); }
  d += 'Z';
  for (k = 0; k < N; k++) { th = -k * TAU / N; d += (k ? 'L' : 'M') + (50 + rh * Math.cos(th)) + ' ' + (52 + rh * Math.sin(th)); }
  return d + 'Z';
}
/* 🍩 a pink glazed donut with sprinkles, rocking a little, a glint running round its glaze.
   Tap: a bite is taken out of the top right, crumbs fly; then the donut heals. */
D.add('donut', {
  fam: 'kitchen', tags: ['doughnut', 'sprinkles', 'glaze', 'sweet', 'bakery', 'dessert', 'โดนัท', '🍩'], loop: 3, still: 0.2, tapLen: 2.6, burst: false, margin: [14, 14, 10, 14],
  about: 'rocks gently while a glint runs round the glaze', tapAbout: 'a bite is taken out of the top right and crumbs fly, then it heals',
  draw: function (p, t, s) {
    var u = s.tap, go = u >= 0, i, R = p.rng(3), bs = go ? M.spring(seg(u, 0.08, 0.28)) * (1 - ez(seg(u, 0.72, 0.95))) : 0;
    var glaze = function (th) { return Math.min(33 * (1 + 0.04 * Math.sin(3 * th + 1) + 0.03 * Math.sin(5 * th + 2)), bitten(th, bs) - 2.6); };
    p.pivot(50, 52, 0.08 * wave(t, 1), [1 + 0.025 * wave(t, 2), 1 - 0.025 * wave(t, 2)], function () {
      p.path(ring(function (th) { return bitten(th, bs); }, 11), { fill: 'wood' });
      p.path(ring(glaze, 13), { fill: 'pink' });
      p.arc(50, 52, 24, TAU * t - 1.2, TAU * t - 0.6, { ink: 'white', w: 0.9 });
      for (i = 0; i < 16; i++) {
        var an = R() * TAU, r = 16.5 + R() * 12, ro = R() * Math.PI, ci = Math.floor(R() * 4), x = 50 + r * Math.cos(an), y = 52 + r * Math.sin(an);
        if (r < glaze(an) - 3) p.line(x - 2.2 * Math.cos(ro), y - 2.2 * Math.sin(ro), x + 2.2 * Math.cos(ro), y + 2.2 * Math.sin(ro), { ink: ['a', 'c', 'white', 'sky'][ci], w: 0.6, cap: 'round' });
      }
    });
    for (i = 0; i < 6; i++) {
      var tau = go ? seg(u, 0.1 + 0.015 * i, 0.55 + 0.015 * i) : 0;
      if (tau > 0 && tau < 1) p.dot(50 + 41 * Math.cos(-0.7) + (i - 2.5) * 6 * tau + 6 * tau, 52 + 41 * Math.sin(-0.7) - 26 * tau + 70 * tau * tau, 1.7 * (1 - ei(seg(tau, 0.6, 1))), 'wood');
    }
  }
});

/* 🥟 a bamboo steamer, its lid tipped open on a hinge by the steam, dumplings jiggling one after another from the left.
   Tap: the lid flips wide open, the dumplings leap in turn, a big cloud of steam; the lid settles back. */
function dumpling(p, x, y, kx, ky) {
  p.at(x, y, 0, [kx, ky], function () {
    p.path('M-10 5 C-10 -6 -5 -10 0 -10 C5 -10 10 -6 10 5 C5 8.5 -5 8.5 -10 5 Z', { fill: 'cream' });
    for (var i = -3; i <= 3; i++) p.line(i * 2.9, -9.8 + 0.42 * i * i, i * 2.4, -4.6, { w: 0.4, detail: true });
  });
}
D.add('dumplings', {
  fam: 'kitchen', tags: ['dim sum', 'steamer', 'bamboo', 'jiaozi', 'momo', 'gyoza', 'ขนมจีบ', '🥟'], loop: 2.6, still: 0.3, tapLen: 2.4, burst: false, margin: [34, 18, 6, 18],
  about: 'steam tips the lid open and the dumplings jiggle one after another', tapAbout: 'the lid flips wide, the dumplings leap in turn, a cloud of steam, then the lid settles',
  draw: function (p, t, s) {
    var u = s.tap, go = u >= 0, i, lid = 0.35 + 0.05 * wave(t, 1) + (go ? 0.7 * eo(seg(u, 0.05, 0.25)) * (1 - ez(seg(u, 0.7, 0.95))) : 0), boil = go ? bump(seg(u, 0.1, 0.8)) : 0;
    p.rect(14, 68, 72, 24, { r: 3, fill: 'wood' });
    p.line(15, 74, 85, 74, { w: 0.5 }); p.line(15, 86, 85, 86, { w: 0.5 });
    for (i = 0; i < 9; i++) p.line(21 + i * 7.2, 75, 21 + i * 7.2, 85, { w: 0.35, detail: true });
    p.ellipse(50, 48, 34, 7, { fill: 'leaf' });
    [34, 50, 66].forEach(function (x, k) {
      var tau = go ? seg(u, 0.2 + 0.07 * k, 0.55 + 0.07 * k) : 0, lan = go ? bump(seg(tau, 0.85, 1)) : 0;
      dumpling(p, x, 46 - 1.8 * Math.max(0, wave(t, 2, -k * 0.09)) - 18 * bump(tau), 1.15 + 0.1 * lan, 1.15 - 0.1 * lan);
    });
    p.path('M16 48 A34 7 0 0 0 84 48 L84 68 L16 68 Z', { fill: 'sand' });
    p.path('M17 54 C40 60 60 60 83 54', { w: 0.5 }); p.path('M17 62 C40 66 60 66 83 62', { w: 0.5 });
    for (i = 0; i < 8; i++) p.line(24 + i * 7.5, 58.5, 24 + i * 7.5, 63, { w: 0.35, detail: true });
    [28, 46, 64].forEach(function (x, k) { steam(p, t, x, 36, 28 + 14 * boil, 0.12 + k * 0.3, 0.7 + 0.3 * boil); });
    p.pivot(88, 48, lid, 1, function () {
      p.path('M10 48 C30 46 42 38 50 34 C58 38 70 46 90 48 C70 53 30 53 10 48 Z', { fill: 'wood' });
      p.path('M50 35 L22 49 M50 35 L38 51 M50 35 L62 51 M50 35 L78 49', { w: 0.4, detail: true });
      p.path('M14 49 C30 52 70 52 86 49', { w: 0.5, detail: true });
      p.circle(50, 33, 3.4, { fill: 'brown', w: 0.8 });
    });
  }
});

/* 🍞 a loaf rising in its tin: the dough breathes up and down, scored across the top, a yeast bubble popping now and then.
   Tap: oven spring: it surges up out of the tin, the slashes gape and steam, then it settles back. */
D.add('bread', {
  fam: 'kitchen', tags: ['loaf', 'dough', 'bake', 'yeast', 'rise', 'bakery', 'tin', 'ขนมปังก้อน', '🍞'], loop: 3.2, still: 0.3, tapLen: 2.2, burst: false, margin: [28, 14, 6, 14],
  about: 'the dough breathes up in its tin, a yeast bubble popping now and then', tapAbout: 'oven spring: it surges up, the slashes gape and steam, then it settles',
  draw: function (p, t, s) {
    var u = s.tap, go = u >= 0, y0 = 62, h = 20 + 3 * wave(t, 1) + (go ? 16 * M.spring(seg(u, 0.05, 0.45)) * (1 - ez(seg(u, 0.55, 0.95))) : 0), op = go ? ez(seg(u, 0.1, 0.4)) * (1 - ez(seg(u, 0.6, 0.9))) : 0;
    var d = 'M16 64 C13 ' + (y0 - h * 0.9) + ' 26 ' + (y0 - h) + ' 50 ' + (y0 - h) + ' C74 ' + (y0 - h) + ' 87 ' + (y0 - h * 0.9) + ' 84 64 Z';
    vessel(p, d, 'wood', function () {
      p.rect(0, y0 - h - 2, 100, h * 0.55, { fill: 'sand', line: false, alpha: 0.7 });
      [[28, 0.55], [40, 0.9], [60, 0.85], [72, 0.5], [50, 0.5]].forEach(function (c) { p.circle(c[0], y0 - h * c[1], 0.9, { fill: 'white', line: false, detail: true }); });
    });
    [[34, 0.62, 0], [50, 0.78, 1], [66, 0.62, 0]].forEach(function (c) { p.ellipse(c[0], y0 - h * c[1], 7 + 5 * op, 0.9 + 2.6 * op, { rot: 0.6 - c[2] * 1.2, fill: 'cream', w: 0.5 }); });
    [[0.0, 30, 0.45], [0.5, 70, 0.4]].forEach(function (b) { var ph = M.frac(t + b[0]); if (ph < 0.7) p.circle(b[1], y0 - h * b[2], 0.8 + 2.6 * ph, { w: 0.4, detail: true }); });
    p.path('M14 62 L86 62 L82 91 C82 93 80 94 78 94 L22 94 C20 94 18 93 18 91 Z', { fill: 'smoke' });
    for (var i = 0; i < 3; i++) p.path('M' + (17.4 + i * 0.2) + ' ' + (71 + i * 8) + ' L' + (82.6 - i * 0.2) + ' ' + (71 + i * 8), { w: 0.35, detail: true });
    p.path('M22 66 L24 88', { ink: 'white', w: 0.8, detail: true });
    p.rect(10, 58, 80, 6, { r: 2.5, fill: 'stone' });
    if (go) [34, 50, 66].forEach(function (x, k) { steam(p, t, x, y0 - h * 0.8, 20 * bump(seg(u, 0.12, 0.85)) + 4, 0.1 + 0.3 * k, 0.7); });
  }
});

/* 🍯 a honey jar under a wooden dipper: a thread of honey runs down into the jar, thick beads sliding down it, a coil piling up.
   Tap: the dipper twirls and flings honey off in all directions, then the thread runs on again. */
D.add('honey', {
  fam: 'kitchen', tags: ['bee', 'sweet', 'jar', 'dipper', 'drizzle', 'syrup', 'spread', 'น้ำผึ้ง', '🍯'], loop: 2.8, still: 0.3, tapLen: 2.2, burst: false, margin: [30, 36, 6, 22],
  about: 'a thread of honey runs into the jar, beads sliding down it, a coil piling up', tapAbout: 'the dipper twirls and flings honey in all directions, then the thread runs on',
  draw: function (p, t, s) {
    var u = s.tap, go = u >= 0, env = go ? bump(seg(u, 0.06, 0.8)) : 0, A = 0.12 + 0.32 * env * wave(u, 4), rise = go ? 5 * bump(seg(u, 0.02, 0.2)) : 0, i, j;
    vessel(p, 'M26 48 C16 56 14 80 26 90 C34 95 66 95 74 90 C86 80 84 56 74 48 Z', 'gold', function () { p.star(50, 72, 11, 11, 6, { fill: 'cream', w: 0.7 }); p.star(50, 72, 6, 6, 6, { w: 0.5, detail: true }); });
    p.path('M22 58 C19 66 20 74 24 82', { ink: 'white', w: 0.9, detail: true });
    p.ellipse(50, 48, 25, 6, { fill: 'white' }); p.ellipse(50.5, 48.4, 21, 4.2, { fill: 'gold', w: 0.6 });
    for (i = 0; i < 3; i++) p.arc(50.5, 48.2, 4 + i * 4.2, TAU * t + i * 2.1, TAU * t + i * 2.1 + 3.6, { ry: (4 + i * 4.2) * 0.22, w: 0.45, ink: 'orange', wob: 0.3 });
    var tx = 53 - 19.5 * Math.sin(A), ty = 8 - rise + 19.5 * Math.cos(A), L = [], R = [], f, w, x, y, bead;
    for (j = 0; j <= 10; j++) {
      f = j / 10; y = M.lerp(ty, 47, f); x = M.lerp(tx, 50.5, f) + 1.1 * f * wave(t, 1, f * 0.3);
      bead = Math.exp(-Math.pow((f - M.frac(t)) / 0.1, 2)) + Math.exp(-Math.pow((f - M.frac(t + 0.5)) / 0.1, 2));
      w = (1.1 + 1.0 * Math.pow(Math.abs(2 * f - 1), 1.4)) * (1 + 0.15 * wave(t, 1)) + 1.3 * bead; L.push([x - w, y]); R.unshift([x + w, y]);
    }
    p.poly(L.concat(R), { fill: 'gold', w: 0.45 });
    p.at(0, -rise, 0, 1, function () {
      p.pivot(53, 8, A, 1, function () {
        p.poly([[51.2, 9], [54.8, 9], [62, -16], [59, -16]], { fill: 'wood', w: 0.7 });
        [4.5, 6, 6.5, 6, 4.2].forEach(function (r, k) { p.ellipse(53, 6 + 4.2 * k, r, 2.3, { fill: 'wood', w: 0.7 }); });
        p.path('M47 14 C45 22 49 26 53 27.8 C57 26 61 22 59 14 Z', { fill: 'gold' });
      });
    });
    for (i = 0; i < 8; i++) {
      var tau = go ? seg(u, 0.1 + 0.03 * i, 0.65 + 0.03 * i) : 0, vx = (i % 2 ? 1 : -1) * (14 + 7 * (i % 3));
      if (tau > 0 && tau < 1) drop(p, 53 + vx * tau, 18 - rise - 12 * tau + 62 * tau * tau, 1 - ei(seg(tau, 0.6, 1)), 'gold');
    }
  }
});

/* 🍳 a frying pan from above, an egg sizzling in it, oil bubbles popping round the edge.
   Tap: the pan jerks and tosses the egg, which flips over in the air and lands on its other side. */
D.add('frying-pan', {
  fam: 'kitchen', tags: ['egg', 'fry', 'sizzle', 'breakfast', 'cook', 'flip', 'skillet', 'กระทะ', '🍳'], loop: 2, still: 0.3, tapLen: 2.4, burst: false, margin: [44, 4, 6, 10],
  about: 'the egg sizzles and oil bubbles pop round the edge', tapAbout: 'the pan jerks and tosses the egg, which flips in the air and lands on its other side',
  draw: function (p, t, s) {
    var u = s.tap, go = u >= 0, fl = go ? seg(u, 0.2, 0.62) : 0, lq = go ? bump(seg(u, 0.62, 0.8)) : 0, side = go && fl < 0.5 ? (s.taps + 1) % 2 : s.taps % 2, i;
    var pa = go ? -0.1 * bump(seg(u, 0.05, 0.2)) + 0.14 * bump(seg(u, 0.18, 0.4)) - 0.05 * lq : 0, air = go ? bump(fl) : 0, th = Math.max(0.08, Math.abs(Math.cos(Math.PI * fl)));
    p.pivot(96, 56, pa, 1, function () {
      p.at(0.6 * wave(t, 6), 0, 0, 1, function () {
        p.rect(60, 51, 38, 10, { r: 5, fill: 'brown' }); p.circle(93, 56, 2, { fill: 'bg', w: 0.5 });
        p.path('M4 56 A32 32 0 1 1 68 56 A32 32 0 1 1 4 56 Z M9 56 A27 27 0 1 0 63 56 A27 27 0 1 0 9 56 Z', { fill: 'grey' });
        p.circle(36, 56, 27, { fill: 'white', hatch: 0.8 });
        p.arc(36, 56, 29.5, -2.7, -1.9, { ink: 'white', w: 0.7 });
        [[0, 0.1, 24], [1.3, 0.35, 23], [2.6, 0.6, 25], [3.9, 0.85, 22], [5.2, 0.45, 24]].forEach(function (b) {
          var ph = M.frac(2 * t + b[1]), x = 36 + b[2] * Math.cos(b[0]), y = 56 + b[2] * Math.sin(b[0]);
          if (ph < 0.6) p.circle(x, y, 0.8 + 2.4 * ph, { ink: 'white', w: 0.5 });
          else if (ph < 0.85) for (var k = 0; k < 3; k++) { var an = k * 2.1 + b[0], r0 = 2 + 5 * seg(ph, 0.6, 0.85), r1 = r0 + 2.2; p.line(x + Math.cos(an) * r0, y + Math.sin(an) * r0, x + Math.cos(an) * r1, y + Math.sin(an) * r1, { ink: 'white', w: 0.5 }); }
        });
        p.at(36, 56 - 36 * air, 0, [1 + 0.3 * air + 0.12 * lq, (1 + 0.3 * air - 0.15 * lq) * th], function () {
          if (side === 0) { p.blob(0, 0, 19, { fill: 'white', lumpy: 0.12, n: 9, seed: 4 }); p.circle(3, -3, 8.5, { fill: 'yellow', w: 0.8 }); p.path('M-1 -7 C1 -9 5 -9 7 -7', { ink: 'white', w: 0.6, detail: true }); }
          else { p.blob(0, 0, 19, { fill: 'wood', lumpy: 0.12, n: 9, seed: 4 }); p.blob(0, 0, 15, { fill: 'cream', lumpy: 0.1, n: 9, seed: 6, w: 0.5 }); p.circle(3, -3, 8, { fill: 'yellow', alpha: 0.6, w: 0.4 }); }
        });
      });
    });
    steam(p, t, 26, 36, 24, 0.1, 0.6); steam(p, t, 46, 34, 22, 0.55, 0.6);
  }
});

/* 🍹 a tropical sunrise in a hurricane glass: a paper umbrella spinning like a pinwheel, ice cubes bobbing, an orange on the rim.
   Tap: the umbrella lifts out spinning like a helicopter, comes back down with a plop, and confetti flies. */
function hurW(y) { return y < 60 ? 6 + 14 * (1 - ez((y - 18) / 42)) : 6 + 10 * ez((y - 60) / 28); }
D.add('cocktail', {
  fam: 'kitchen', tags: ['drink', 'tropical', 'umbrella', 'party', 'summer', 'holiday', 'beach', 'ค็อกเทล', '🍹'], loop: 2.4, still: 0.3, tapLen: 2.4, burst: 'confetti', burstAt: [30, 6], burstN: 9, burstSpread: 2.4, margin: [34, 18, 6, 18],
  about: 'the paper umbrella spins like a pinwheel, ice cubes bob, the sunrise sloshes', tapAbout: 'the umbrella lifts out spinning like a helicopter and plops back down; confetti',
  draw: function (p, t, s) {
    var u = s.tap, go = u >= 0, pts = [], y, i, lift = go ? 30 * bump(seg(u, 0.08, 0.78)) : 0, sq = go ? bump(seg(u, 0.76, 0.9)) : 0, spin = TAU * 2 * t + (go ? TAU * 5 * ez(seg(u, 0.05, 0.8)) : 0);
    for (y = 18; y <= 88; y += 2) pts.push([50 - hurW(y), y]);
    for (y = 88; y >= 18; y -= 2) pts.push([50 + hurW(y), y]);
    p.pivot(50, 90, 0, [1 + 0.03 * sq, 1 - 0.04 * sq], function () {
      vessel(p, pd(pts), 'white', function () {
        p.at(50, 32, 0.05 * wave(t, 1) + (go ? 0.08 * sq * wave(u, 4) : 0), 1, function () {
          p.rect(-30, 0, 60, 14, { fill: 'yellow', line: false }); p.rect(-30, 14, 60, 18, { fill: 'orange', line: false }); p.rect(-30, 32, 60, 50, { fill: 'rose', line: false });
          p.ellipse(0, 0, 22, 2.6, { w: 0.5 });
        });
      });
      [[44, 31, 0.5, 0], [58, 29, -0.3, 0.4]].forEach(function (c) { p.at(c[0], c[1] + 1.4 * wave(t, 1, c[3]), c[2], 1, function () { p.rect(-4.5, -4.5, 9, 9, { r: 1.2, fill: 'white', w: 0.5 }); p.line(-2.5, -2.5, 0, -2.5, { ink: 'sky', w: 0.5, detail: true }); }); });
      p.poly([[53.4, 76], [56.6, 76.4], [64.4, -6], [61.2, -6.4]], { fill: 'white', w: 0.7 });
      for (i = 0; i < 5; i++) { var cy = 66 - i * 16, cx = 55 + 7.8 * (76 - cy) / 82; p.line(cx - 1.6, cy + 2, cx + 1.6, cy - 2, { ink: 'b', w: 0.7, detail: true }); }
      p.at(70, 18, 0.4, 1, function () { p.arc(0, 0, 12, Math.PI, TAU, { pie: true, fill: 'orange', w: 0.8 }); p.arc(0, 0, 8.6, Math.PI + 0.12, TAU - 0.12, { pie: true, fill: 'yellow', w: 0.4 }); p.line(0, 0, 0, -8.6, { w: 0.4, detail: true }); });
    });
    p.line(36, 46 - lift, 28, 5 - lift, { w: 0.5 });
    p.at(28, 4 - lift, -0.2, 1, function () {
      for (i = 0; i < 4; i++) p.arc(0, 0, 15, spin + i * Math.PI / 2, spin + (i + 1) * Math.PI / 2, { ry: 6, pie: true, fill: i % 2 ? 'b' : 'white', w: 0.6 });
      p.circle(0, -0.5, 1.2, { fill: 'ink', line: false });
    });
    if (go) for (i = 0; i < 4; i++) { var tau = seg(u, i < 2 ? 0.1 + 0.03 * i : 0.76 + 0.03 * i, i < 2 ? 0.34 + 0.03 * i : 1); if (tau > 0 && tau < 1) drop(p, 36 + (i % 2 ? 7 : -7) * tau, 30 - 16 * 4 * tau * (1 - tau), 1 - ei(seg(tau, 0.6, 1)), 'orange'); }
  }
});

/* ♨ a mint stovetop kettle coming to the boil: steam pulses from the spout and the lid chatters.
   Tap: it whistles: the whole kettle shivers, the cap on the spout jumps, a plume of steam jets out and notes fly. */
D.add('kettle', {
  fam: 'kitchen', tags: ['boil', 'whistle', 'steam', 'stove', 'tea', 'hot water', 'กาต้มน้ำ', '♨'], loop: 2.4, still: 0.3, tapLen: 2, burst: 'note', burstAt: [99, 40], burstN: 5, burstSpread: 1.7, margin: [28, 24, 6, 18],
  about: 'steam pulses from the spout and the lid chatters', tapAbout: 'it whistles: the kettle shivers, the cap jumps, a plume of steam jets out and notes fly',
  draw: function (p, t, s) {
    var u = s.tap, go = u >= 0, env = go ? bump(seg(u, 0.04, 0.85)) : 0, buzz = wave(u * 14, 1), hop = Math.max(0, wave(t, 4)) * (1 - env) + env * Math.max(0, buzz), i;
    p.pivot(50, 91, 0.012 * wave(t, 3) + 0.04 * env * buzz, 1, function () {
      p.path('M24 56 C14 10 86 10 76 56 L70 53 C78 22 22 22 30 53 Z', { fill: 'brown' });
      p.path('M78 72 C88 70 92 56 96 46 L101 49 C98 64 93 84 79 86 Z', { fill: 'mint' });
      p.path('M20 84 C12 62 22 46 40 44 L60 44 C78 46 88 62 80 84 C80 89 75 91 70 91 L30 91 C25 91 20 89 20 84 Z', { fill: 'mint' });
      p.path('M26 60 C25 68 26 76 28 82', { ink: 'white', w: 0.9, detail: true });
      p.path('M17 75 C40 81 60 81 83 75', { ink: 'b', w: 0.9 });
      p.at(50, 44 - 1.6 * hop, 0.04 * hop, 1, function () { p.path('M-13 0 C-12 -9 12 -9 13 0 Z', { fill: 'stone' }); p.circle(0, -9.4, 2.6, { fill: 'brown', w: 0.8 }); });
      p.at(98.5, 47 - 2.6 * hop, 0.25, 1, function () { p.rect(-4.5, -4, 9, 5, { r: 2, fill: 'stone', w: 0.7 }); });
    });
    steam(p, t, 99, 38, 26, 0, 0.7); steam(p, t, 97, 38, 20, 0.45, 0.7);
    if (go) for (i = 0; i < 3; i++) p.at(99, 43, 0.45 + 0.4 * i, 1, function () { p.span(wisp(0, 0, 34 - 4 * i), ei(seg(u, 0.55 + 0.03 * i, 0.9)), eo(seg(u, 0.06 + 0.04 * i, 0.45)), { w: 0.8, alpha: 0.9 }); });
  }
});

/* 🧀 a block of holey cheese with a mouse in one of the holes: it peeks up, looks round, blinks, and ducks down.
   Tap: the mouse pops right up, shoulders and all, ears flapping and squeaking, then drops back in. */
D.add('cheese', {
  fam: 'kitchen', tags: ['mouse', 'swiss', 'dairy', 'snack', 'peek', 'hole', 'cheddar', 'ชีส', '🧀'], loop: 3, still: 0.2, tapLen: 2, burst: false, margin: [20, 14, 6, 14],
  about: 'a mouse peeks up out of a hole, looks round, blinks and ducks', tapAbout: 'the mouse pops right up, ears flapping, squeaks, then drops back in',
  draw: function (p, t, s) {
    var u = s.tap, go = u >= 0, peek = 0.85 * ez(seg(t, 0.05, 0.25)) * (1 - ez(seg(t, 0.72, 0.92))), look = 1.7 * wave(t, 2) * seg(peek, 0.3, 0.8), blink = bump(seg(t, 0.48, 0.54)) * (peek > 0.5 ? 1 : 0), i;
    if (go) peek += 0.85 * M.spring(seg(u, 0.05, 0.3)) * (1 - ez(seg(u, 0.7, 0.92)));
    var cy = 84 - 24 * peek, ear = 0.2 * wave(t, 3) + (go ? 0.3 * bump(seg(u, 0.25, 0.65)) * wave(u * 10, 1) : 0);
    p.poly([[12, 48], [30, 32], [96, 32], [80, 48]], { fill: 'cream' });
    p.poly([[80, 48], [96, 32], [96, 74], [80, 90]], { fill: 'gold' });
    p.rect(12, 48, 68, 42, { fill: 'yellow' });
    [[26, 62, 6, 5], [66, 60, 5, 4.2], [60, 80, 8, 6], [30, 82, 4.5, 3.6], [74, 74, 3, 2.6]].forEach(function (h) { p.ellipse(h[0], h[1], h[2], h[3], { fill: 'gold', w: 0.6 }); });
    p.ellipse(88, 52, 3, 2, { fill: 'gold', w: 0.5, detail: true }); p.ellipse(60, 38, 4, 1.8, { fill: 'yellow', w: 0.5, detail: true });
    p.ellipse(46, 66, 11, 9.5, { fill: 'gold', w: 0.8 }); p.ellipse(46, 66.6, 9, 7.8, { fill: 'night', line: false });
    p.clip('M35 66 A11 9.5 0 0 0 57 66 L57 -20 L35 -20 Z', function () {
      if (peek > 1.1) { p.ellipse(46, cy + 14, 11, 12, { fill: 'grey' }); p.circle(37, 70, 3.2, { fill: 'grey', w: 0.7 }); p.circle(55, 70, 3.2, { fill: 'grey', w: 0.7 }); }
      p.at(38, cy - 7, -0.3 + ear, 1, function () { p.circle(0, 0, 4.8, { fill: 'grey' }); p.circle(0, 0, 2.7, { fill: 'pink', line: false }); });
      p.at(54, cy - 7, 0.3 - ear, 1, function () { p.circle(0, 0, 4.8, { fill: 'grey' }); p.circle(0, 0, 2.7, { fill: 'pink', line: false }); });
      p.ellipse(46, cy, 9.5, 8.4, { fill: 'grey' });
      [-1, 1].forEach(function (k) { p.ellipse(46 + k * 3.8 + look, cy - 1.6, 1.15, 1.6 * (1 - 0.9 * blink), { fill: 'ink', line: false }); });
      p.dot(46 + look * 0.6, cy + 3, 1.7, 'pink');
      [[-1, -0.3], [-1, 0.5], [1, -0.3], [1, 0.5]].forEach(function (w) { p.line(46 + w[0] * 3, cy + 3.5, 46 + w[0] * 12, cy + 3.5 + w[1] * 5, { w: 0.3, detail: true }); });
    });
    p.arc(46, 66, 11, 0.12, Math.PI - 0.12, { ry: 9.5, w: 0.9 });
    if (go) for (i = 0; i < 3; i++) { var r0 = 4 + 5 * ei(seg(u, 0.4, 0.55)), r1 = 4 + 9 * eo(seg(u, 0.22 + 0.02 * i, 0.38)), an = -0.4 - i * 0.55; if (r1 - r0 > 0.5) p.line(60 + Math.cos(an) * r0, 44 + Math.sin(an) * r0, 60 + Math.cos(an) * r1, 44 + Math.sin(an) * r1, { w: 0.6 }); }
  }
});

/* 🍔 a burger with everything, a wave of lift running up the stack and steam over the bun.
   Tap: the layers spring apart, each rising higher than the last, then drop back in order with a squash. */
D.add('burger', {
  fam: 'kitchen', tags: ['hamburger', 'fast food', 'cheeseburger', 'bun', 'lunch', 'stack', 'เบอร์เกอร์', '🍔'], loop: 2.4, still: 0.3, tapLen: 2, burst: false, margin: [36, 14, 4, 14],
  about: 'a wave of lift runs up the stack, the top bun leading, steam over the bun', tapAbout: 'the layers spring apart, each higher than the last, then drop back in order with a squash',
  draw: function (p, t, s) {
    var u = s.tap, go = u >= 0;
    var layers = [
      function () { p.path('M13 78 L87 78 C87 90 82 93 76 93 L24 93 C18 93 13 90 13 78 Z', { fill: 'wood' }); p.path('M20 82 C30 84 40 84 46 83', { ink: 'sand', w: 0.7, detail: true }); },
      function () { p.rect(11, 65, 78, 13, { r: 6, fill: 'brown' }); [[24, 70], [40, 72], [58, 69], [74, 72]].forEach(function (d) { p.dot(d[0], d[1], 1.1, 'night'); }); },
      function () { p.path('M11 62 L89 62 L83 71 L72 64 L60 75 L48 64 L33 72 L20 64 Z', { fill: 'yellow' }); },
      function () { p.rect(13, 54, 74, 8, { r: 4, fill: 'red' }); [[28, 58], [46, 58.5], [62, 57.5], [76, 58.5]].forEach(function (d) { p.dot(d[0], d[1], 1, 'yellow'); }); },
      function () { p.path('M9 55 C9 48 16 50 18 53 C20 48 28 48 30 53 C32 48 40 48 42 53 C44 48 52 48 54 53 C56 48 64 48 66 53 C68 48 76 48 78 53 C80 48 88 48 91 55 L91 57 L9 57 Z', { fill: 'leaf' }); },
      function () {
        p.path('M11 50 C11 26 28 14 50 14 C72 14 89 26 89 50 C89 53 87 54 84 54 L16 54 C13 54 11 53 11 50 Z', { fill: 'wood' });
        p.path('M20 42 C21 32 28 25 38 21', { ink: 'sand', w: 0.9, detail: true });
        [[34, 30, 0.4], [46, 24, -0.3], [58, 28, 0.5], [68, 37, -0.5], [28, 41, 0.2], [52, 38, 0.1], [42, 45, -0.4], [63, 46, 0.3]].forEach(function (d, i) { p.ellipse(d[0], d[1], 2.1, 1.1, { rot: d[2], fill: 'cream', w: 0.4, detail: i % 2 > 0 }); });
      }
    ];
    layers.forEach(function (fn, i) {
      var sep = go ? eo(seg(u, 0.05 + 0.02 * i, 0.35 + 0.02 * i)) * (1 - M.spring(seg(u, 0.55 + 0.03 * (5 - i), 0.9 + 0.03 * (5 - i)))) : 0;
      p.at(1.6 * (i / 5) * wave(t, 1, -i * 0.05), -3.4 * (i / 5) * bump(seg(M.frac(t - i * 0.06), 0, 0.35)) - sep * 9 * i, 0, 1, fn);
    });
    steam(p, t, 38, 14, 20, 0.0, 0.6); steam(p, t, 62, 12, 18, 0.5, 0.6);
  }
});

/* 🥐 a croissant, a glint of butter running along its layers and a wisp of steam; the segments breathe in a wave from the left.
   Tap: the layers flake up one after another from the left, crumbs fly, and it settles. */
D.add('croissant', {
  fam: 'kitchen', tags: ['pastry', 'bakery', 'butter', 'french', 'breakfast', 'flaky', 'crescent', 'ครัวซองต์', '🥐'], loop: 2.8, still: 0.3, tapLen: 1.8, burst: 'ember', burstAt: [50, 40], burstN: 7, burstSpread: 2.6, margin: [26, 14, 10, 14],
  about: 'a glint of butter runs along the layers and a wisp of steam rises', tapAbout: 'the layers flake up one after another from the left and crumbs fly',
  draw: function (p, t, s) {
    var u = s.tap, go = u >= 0, N = 7, segs = [], i;
    for (i = 0; i < N; i++) {
      var a = Math.PI + 0.42 + i * (Math.PI - 0.84) / (N - 1), f = Math.sin((i + 0.5) / N * Math.PI), d = go ? 6 * bump(seg(u, 0.05 + 0.07 * i, 0.4 + 0.07 * i)) : 0, k = 1 + 0.03 * wave(t, 1, -i * 0.08);
      segs.push({ i: i, a: a, f: f, x: 50 + (40 + d) * Math.cos(a), y: 80 + (40 + d) * Math.sin(a) * 0.95, k: k });
    }
    segs.sort(function (A, B) { return A.f - B.f; }).forEach(function (c) {
      p.ellipse(c.x, c.y, (14 * c.f + 5) * c.k, (8.5 * c.f + 5) * c.k, { rot: c.a, fill: 'wood' });
      var R = 14 * c.f + 5, T = 8.5 * c.f + 5, ph = M.frac(t - c.i * 0.09);
      p.at(c.x, c.y, c.a, 1, function () {
        p.path('M' + (-0.7 * R) + ' ' + (-0.25 * T) + ' C' + (-0.2 * R) + ' ' + (-0.4 * T) + ' ' + (0.3 * R) + ' ' + (-0.4 * T) + ' ' + (0.7 * R) + ' ' + (-0.25 * T), { ink: 'a', w: 0.8, detail: true });
        p.span('M' + (0.55 * R) + ' ' + (-0.65 * T) + ' C' + (0.85 * R) + ' ' + (-0.3 * T) + ' ' + (0.85 * R) + ' ' + (0.3 * T) + ' ' + (0.55 * R) + ' ' + (0.65 * T), ei(seg(ph, 0.3, 0.5)), eo(seg(ph, 0.05, 0.3)), { ink: 'white', w: 0.9 });
      });
    });
    steam(p, t, 50, 30, 20, 0.2, 0.6);
  }
});

/* 🥑 half an avocado, its pit wobbling loose in the hollow, a glint sliding across the flesh.
   Tap: the pit pops out in an arc, spinning, and plops back into its hollow as the avocado squashes. */
D.add('avocado', {
  fam: 'kitchen', tags: ['guacamole', 'toast', 'fruit', 'pit', 'healthy', 'brunch', 'green', 'อะโวคาโด', '🥑'], loop: 2.6, still: 0.3, tapLen: 2, burst: false, margin: [20, 22, 6, 18],
  about: 'the pit wobbles loose in its hollow, a glint slides across the flesh', tapAbout: 'the pit pops out in a spinning arc and plops back as the avocado squashes',
  draw: function (p, t, s) {
    var u = s.tap, go = u >= 0, fl = go ? seg(u, 0.12, 0.62) : 0, sq = go ? bump(seg(u, 0, 0.12)) + 0.8 * bump(seg(u, 0.62, 0.76)) : 0;
    var AV = 'M50 8 C64 8 72 26 78 44 C86 64 80 92 50 92 C20 92 14 64 22 44 C28 26 36 8 50 8 Z', px = 50 + 1.4 * wave(t, 1) + 22 * bump(fl), py = 66 + 1.0 * wave(t, 2, 0.25) - 56 * bump(fl);
    p.pivot(50, 92, 0, [1 + 0.06 * sq, 1 - 0.08 * sq], function () {
      p.path(AV, { fill: 'green' });
      p.pivot(50, 58, 0, 0.84, function () { p.path(AV, { fill: 'mint', w: 0.5 }); });
      p.ellipse(50, 68, 22, 26, { fill: 'yellow', line: false, alpha: 0.5 });
      p.circle(50, 66, 16.5, { fill: 'sand', line: false, alpha: 0.55 }); p.arc(50, 66, 16.5, 2.5, 5.2, { w: 0.6 });
      p.span('M30 30 C27 44 28 56 32 66', ei(seg(t, 0.4, 1)), eo(seg(t, 0, 0.6)), { ink: 'white', w: 0.8, detail: true });
    });
    p.at(px, py, TAU * fl + 0.15 * wave(t, 1, 0.3) * (1 - fl), 1, function () { p.circle(0, 0, 14, { fill: 'brown', w: 0.9 }); p.arc(0, 0, 9.5, -2.5, -1.5, { ink: 'white', w: 0.8 }); p.dot(5, 5, 1.2, 'wood'); });
  }
});
})(Dingbats);

/* Curious: machines, instruments, puzzles and mathematics that move. The mechanism is the picture:
   gears mesh at their tooth counts, pendulum lengths make the wave re-form, a Möbius strip has one side. */
(function (D) {
'use strict';
var M = D.math, TAU = M.TAU, PI = Math.PI, sin = Math.sin, cos = Math.cos;

/* path data through points, for p.draw and p.span */
function dp(pts) { var s = 'M'; for (var i = 0; i < pts.length; i++) s += (i ? 'L' : '') + pts[i][0].toFixed(1) + ' ' + pts[i][1].toFixed(1); return s; }
/* the phase a tap adds: K whole laps, eased in and out, so the loop meets itself again when the tap ends */
function lap(s, K) { return s.tap < 0 ? 0 : K * M.ease(s.tap); }
/* a swell that rises and falls back to nothing over the tap: 0 idle, 1 at the middle */
function swell(s) { return s.tap < 0 ? 0 : M.ease(M.clamp(M.bump(s.tap) * 1.5, 0, 1)); }
/* a toothed outline round (0,0): N teeth, tips at radius rt, roots at rr, tooth k centred at rot + k/N of a turn */
function teeth(N, rt, rr, rot) {
  var a = TAU / N, o = [];
  for (var k = 0; k < N; k++) {
    var c = rot + k * a;
    o.push([cos(c - 0.3 * a) * rr, sin(c - 0.3 * a) * rr], [cos(c - 0.15 * a) * rt, sin(c - 0.15 * a) * rt], [cos(c + 0.15 * a) * rt, sin(c + 0.15 * a) * rt], [cos(c + 0.3 * a) * rr, sin(c + 0.3 * a) * rr]);
  }
  return o;
}
/* a spur gear on pitch radius rp: the tip stands 0.7 of a module out, the root 0.95 in */
function gearPts(N, rp, rot) { var m = 2 * rp / N; return teeth(N, rp + 0.7 * m, rp - 0.95 * m, rot); }
/* unit helpers for the 3D drawings */
function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function dot3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function unit(a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
function rotY(q, a) { var c = cos(a), s = sin(a); return [q[0] * c + q[2] * s, q[1], -q[0] * s + q[2] * c]; }
function rotX(q, a) { var c = cos(a), s = sin(a); return [q[0], q[1] * c - q[2] * s, q[1] * s + q[2] * c]; }
function rotZ(q, a) { var c = cos(a), s = sin(a); return [q[0] * c - q[1] * s, q[0] * s + q[1] * c, q[2]]; }
/* isometric: x runs down to the right, z down to the left, y up */
function iso(q, S, cx, cy) { return [cx + (q[0] - q[2]) * 0.866 * S, cy + ((q[0] + q[2]) * 0.5 - q[1]) * S]; }
var RAINBOW = ['red', 'orange', 'yellow', 'leaf', 'sea', 'blue', 'plum'];

/* an orrery: sun on its pole, three planets on arms at 3, 2 and 1 laps a loop (the inner ones quicker),
   a moon round the blue one, Saturn's ring, a crank on the base. Tap: the crank whirls every planet through extra laps. */
D.add('orrery', {
  fam: 'curious', tags: ['solar system', 'planets', 'astronomy', 'space', 'model', 'sun', 'moon', 'saturn', 'orbit'], loop: 6, still: 0.1, tapLen: 2.2, burst: 'star', burstAt: [50, 40], burstN: 6,
  about: 'three planets circle a sun on arms, Saturn ringed, a moon round the blue one', tapAbout: 'the crank whirls every planet through extra laps and the sun flares',
  draw: function (p, t, s) {
    var w = lap(s, 1), fl = s.tap < 0 ? 0 : M.bump(s.tap), cx = 50, cy = 46, K = 0.4;
    var R = [17, 30, 44], N = [3, 2, 1], PH = [0.1, 0.55, 0.8], C = ['orange', 'blue', 'plum'], RD = [4.4, 5.4, 6];
    var P = R.map(function (r, i) { var a = TAU * (N[i] * (t + w) + PH[i]); return [cx + r * cos(a), cy + r * K * sin(a), sin(a)]; });
    p.ellipse(50, 86, 26, 6, { fill: 'wood' });
    R.forEach(function (r) { p.ellipse(cx, cy, r, r * K, { w: 0.4, detail: true, dash: [2.5, 2.5] }); });
    p.line(50, 84, 50, cy, { w: 0.9 });
    /* the crank on the base */
    var ca = TAU * 3 * (t + w);
    p.circle(82, 84, 6, { fill: 'a', w: 0.8 });
    p.line(82, 84, 82 + 5 * cos(ca), 84 + 5 * sin(ca), { w: 0.9 }); p.dot(82 + 5 * cos(ca), 84 + 5 * sin(ca), 2);
    function planet(i) {
      var q = P[i], r = RD[i];
      p.line(cx, cy, q[0], q[1], { w: 0.45, detail: true });
      if (i === 2) p.ellipse(q[0], q[1], 11, 3.2, { ink: 'a', w: 0.9, rot: -0.3 });
      p.circle(q[0], q[1], r, { fill: C[i], w: 0.8 });
      if (i === 2) p.arc(q[0], q[1], 11, 0.2, 2.9, { ry: 3.2, rot: -0.3, ink: 'a', w: 0.9 });
      if (i === 1) { var b = TAU * 8 * (t + w); p.circle(q[0] + 9 * cos(b), q[1] + 4 * sin(b), 1.7, { fill: 'white', w: 0.5 }); }
    }
    [0, 1, 2].forEach(function (i) { if (P[i][2] < 0) planet(i); });
    var sr = 8.5 * (1 + 0.14 * fl);
    for (var k = 0; k < 8; k++) { var ra = TAU * (k / 8 + t * 0.5 + w * 0.5); p.line(cx + (sr + 1.5) * cos(ra), cy + (sr + 1.5) * sin(ra), cx + (sr + 4.5 + 3 * fl) * cos(ra), cy + (sr + 4.5 + 3 * fl) * sin(ra), { w: 0.7, ink: 'a', detail: true }); }
    p.circle(cx, cy, sr, { fill: 'a', w: 0.9 });
    [0, 1, 2].forEach(function (i) { if (P[i][2] >= 0) planet(i); });
  }
});

/* a pendulum wave: seven bobs, lengths in the ratio 1/n² so that in one loop pendulum k swings 10+k times;
   all seven are level at t = 0 and again at t = 1, and between they drift into a snake, a wave, a tangle.
   Tap: they are pulled into one line, swing as one, and let go into the wave. */
D.add('pendulums', {
  fam: 'curious', tags: ['pendulum wave', 'physics', 'harmonic', 'wave', 'rainbow', 'swing', 'pattern', 'beats'], loop: 10, still: 0.004, tapLen: 2.2, burst: false,
  about: 'seven pendulums drift out of step into a snake, a wave and a tangle, and line up again', tapAbout: 'they snap into one line, swing as one, then let go into the wave',
  draw: function (p, t, s) {
    var sync = swell(s), B = [];
    for (var k = 0; k < 7; k++) {
      var n = 10 + k, L = 6400 / (n * n), px = 17 + k * 11, th = 0.42 * ((1 - sync) * cos(TAU * n * t) + sync * cos(TAU * 10 * t)), ds = L * sin(th);
      B.push({ x: px, ox: px + 0.42 * ds, oy: 12 + L * cos(th) - 0.28 * ds, ds: ds, c: RAINBOW[k] });
    }
    p.curve(B.map(function (b) { return [b.ox, b.oy]; }), { w: 0.4, dash: [2, 2.5], detail: true });
    B.slice().sort(function (a, b) { return b.ds - a.ds; }).forEach(function (b) {
      p.line(b.x, 12, b.ox, b.oy, { w: 0.45 });
      p.circle(b.ox, b.oy, 4.8, { fill: b.c, w: 0.8 });
    });
    p.rect(6, 5, 88, 7, { fill: 'wood', r: 2.5 });
  }
});

/* Newton's cradle: the swinging group hits, the same number leave the other side, and they swing back.
   Tap: two balls are lifted, and the next two swings are two balls (the impulse is kept). */
D.add('cradle', {
  fam: 'curious', tags: ['newton', 'momentum', 'executive toy', 'balls', 'physics', 'click', 'conservation', 'desk'], loop: 1.6, still: 0.12, tapLen: 2.8, burst: false, margin: [24, 18, 14, 18],
  about: 'one ball swings in, one swings out the far side, and back', tapAbout: 'two balls are lifted: two swing out, then two come back',
  draw: function (p, t, s) {
    var L = 40, r = 7, y0 = 22, th0 = 0.38, psi = M.frac(t - 0.25), win = psi < 0.5 ? 0 : 1, d = (psi % 0.5) * 1.6, tau = s.tap < 0 ? -1 : s.tap * 2.8;
    var kOf = function (st) { return tau >= 0 && st >= 0 && st < 1.6 ? 2 : 1; }, k = kOf(tau - d), kp = kOf(tau - d - 0.8), g = Math.abs(cos(TAU * t));
    p.rect(4, 80, 92, 6, { fill: 'wood', r: 2 });
    p.line(5, 80, 5, 20, { w: 0.8 }); p.line(95, 80, 95, 20, { w: 0.8 });
    var xs = [], i;
    for (i = 0; i < 5; i++) {
      var th = 0; if (win === 1 && i < k) th = -th0 * g; else if (win === 0 && i >= 5 - k) th = th0 * g;
      var px = 50 + (i - 2) * 14;
      xs.push([px, th]);
      p.line(px, y0, px + L * sin(th), y0 + L * cos(th), { w: 0.45 });
    }
    xs.forEach(function (q) { var bx = q[0] + L * sin(q[1]), by = y0 + L * cos(q[1]); p.circle(bx, by, r, { fill: 'stone', w: 0.9 }); p.arc(bx - 1, by - 1, r - 2.2, 3.5, 4.7, { w: 0.5, ink: 'white', detail: true }); });
    p.rect(3, 16, 94, 5, { fill: 'wood', r: 2 });
    /* the click: sparks drawn out from the contact point, then taken back */
    var q = d / 0.8;
    if (q < 0.4) {
      var cx = win === 1 ? 57 + (2 - kp) * 14 : 57 + (kp - 3) * 14;
      for (var m = -1; m <= 1; m++) { var ang = -PI / 2 + m * 0.6, u = q / 0.4; p.span('M' + cx.toFixed(1) + ' 62 L' + (cx + 13 * cos(ang)).toFixed(1) + ' ' + (62 + 13 * sin(ang)).toFixed(1), M.easeIn(M.seg(u, 0.4, 1)), M.easeOut(M.seg(u, 0, 0.6)), { w: 0.6, ink: 'a' }); }
    }
  }
});

/* a metronome: the pyramid case, a rod with a sliding weight, ticks at each end of the swing.
   Tap: the tempo doubles for a few beats (the weight slides down) and comes back. */
D.add('metronome', {
  fam: 'curious', tags: ['tempo', 'beat', 'music', 'rhythm', 'tick', 'practice', 'pendulum', 'time'], loop: 1.2, still: 0.1, tapLen: 2.4, burst: 'note', burstAt: [50, 12], burstN: 5, margin: [20, 22, 10, 22],
  about: 'the rod swings tick, tock, with the weight on its rod', tapAbout: 'the tempo doubles for a few beats, the weight sliding down, then it settles back',
  draw: function (p, t, s) {
    var ph = t + 2 * (s.tap < 0 ? 0 : M.ease(s.tap)), th = 0.42 * sin(TAU * ph), dw = 46 - 18 * swell(s);
    p.poly([[28, 92], [72, 92], [60, 24], [40, 24]], { fill: 'wood' });
    p.poly([[36, 86], [64, 86], [56, 32], [44, 32]], { fill: 'sand', w: 0.5, detail: true });
    for (var i = 0; i < 5; i++) p.line(46, 40 + i * 9, 54, 40 + i * 9, { w: 0.35, detail: true });
    p.rect(26, 88, 48, 6, { fill: 'wood', r: 2 });
    p.at(50, 80, th, 1, function () {
      p.line(0, 9, 0, -72, { w: 0.9, cap: 'round' });
      p.rect(-5.5, -dw - 5, 11, 10, { fill: 'a', w: 0.8, r: 1.5 });
      p.circle(0, 9, 2.6, { fill: 'ink', w: 0.4 });
    });
    p.circle(50, 80, 3.4, { fill: 'grey', w: 0.8 });
    /* the tick: three short strokes at the end of the swing, drawn out and taken back */
    var q = M.frac(2 * (ph - 0.25)), sd = M.frac(ph - 0.25) < 0.5 ? 1 : -1, tx = 50 + sd * 72 * sin(0.42), ty = 80 - 72 * cos(0.42);
    if (q < 0.45) for (var m = -1; m <= 1; m++) { var a = (sd > 0 ? 0 : PI) + m * 0.6, u = q / 0.45; p.span('M' + (tx + 6 * cos(a)).toFixed(1) + ' ' + (ty + 6 * sin(a)).toFixed(1) + ' L' + (tx + 15 * cos(a)).toFixed(1) + ' ' + (ty + 15 * sin(a)).toFixed(1), M.easeIn(M.seg(u, 0.35, 1)), M.easeOut(M.seg(u, 0, 0.6)), { w: 0.7, detail: true }); }
  }
});

/* four gears, 12 – 8 – 12 across and an 8 on top: the small ones turn three laps to the big ones' two, the other way.
   The teeth are placed so a tooth always meets a gap. Tap: the train winds back two laps in a whirr and runs on. */
function meshPhase(Ni, Nj, a) { return a + PI - PI / Nj + Ni / Nj * a; }   /* phi_j so that θ_j = phi_j − (Ni/Nj)·θ_i keeps a tooth in the gap along direction a (i → j) */
D.add('gears', {
  fam: 'curious', tags: ['gear', 'cog', 'machine', 'mechanism', 'settings', 'clockwork', 'engineering', 'teeth', 'ratio'], loop: 6, still: 0.1, tapLen: 2, burst: 'spark', burstAt: [50, 52], burstN: 5,
  about: 'a gear train: the small gears turn three laps to the big gears\' two, the other way', tapAbout: 'the train winds back two laps in a whirr, then runs on',
  draw: function (p, t, s) {
    var tt = t - (s.tap < 0 ? 0 : M.ease(s.tap)), thA = TAU * 2 * tt;
    var A = { x: 25, y: 70, N: 12, r: 18 }, B = { x: 50, y: 55, N: 8, r: 12 }, Cc = { x: 75, y: 70, N: 12, r: 18 }, Dd = { x: 50, y: 31, N: 8, r: 12 };
    var aAB = Math.atan2(B.y - A.y, B.x - A.x), aBC = Math.atan2(Cc.y - B.y, Cc.x - B.x), aBD = Math.atan2(Dd.y - B.y, Dd.x - B.x);
    var thB = meshPhase(A.N, B.N, aAB) - A.N / B.N * thA, thC = meshPhase(B.N, Cc.N, aBC) - B.N / Cc.N * thB, thD = meshPhase(B.N, Dd.N, aBD) - B.N / Dd.N * thB;
    [[A, thA, 'a'], [B, thB, 'c'], [Cc, thC, 'b'], [Dd, thD, 'sky']].forEach(function (g) {
      var G = g[0];
      p.at(G.x, G.y, 0, 1, function () {
        p.poly(gearPts(G.N, G.r, g[1]), { fill: g[2], w: 0.9 });
        p.circle(0, 0, G.r * 0.3, { fill: 'bg', w: 0.8 });
        for (var k = 0; k < 4; k++) { var a = g[1] + k * TAU / 4 + PI / 4; p.circle(G.r * 0.62 * cos(a), G.r * 0.62 * sin(a), G.r * 0.1, { fill: 'bg', w: 0.5, detail: true }); }
      });
    });
  }
});

/* a pocket compass: the needle is jolted every second and a half and rings down to north, red half leading.
   Tap: the needle is flicked and spins like a roulette wheel, slowing back onto north. */
D.add('compass', {
  fam: 'curious', tags: ['north', 'navigation', 'direction', 'explore', 'map', 'needle', 'orienteering', 'adventure'], loop: 3, still: 0.2, tapLen: 2.4, burst: false, margin: [18, 18, 10, 18],
  about: 'the needle is jolted and wobbles down to north, over and over', tapAbout: 'the needle spins round like a roulette wheel and slows back onto north',
  draw: function (p, t, s) {
    var u = M.frac(2 * t), kick = t < 0.5 ? 1 : -1, wob = 0.75 * kick * Math.exp(-3.2 * u) * sin(TAU * 2.5 * u), spin = s.tap < 0 ? 0 : TAU * 3 * Math.pow(1 - s.tap, 3);
    p.rect(44, 15, 12, 8, { fill: 'gold', r: 2 }); p.circle(50, 9.5, 5.5, { w: 1 });
    p.circle(50, 57, 36, { fill: 'gold' });
    p.circle(50, 57, 30, { fill: 'cream', w: 0.7 });
    for (var i = 0; i < 12; i++) { var a = i * TAU / 12, c = i % 3 === 0; p.line(50 + (c ? 21 : 25) * sin(a), 57 - (c ? 21 : 25) * cos(a), 50 + 29 * sin(a), 57 - 29 * cos(a), { w: c ? 0.9 : 0.45, detail: !c }); }
    p.path('M45.5 41 L45.5 33 L54.5 41 L54.5 33', { w: 0.7, detail: true });
    p.pivot(50, 57, wob + spin, 1, function () {
      p.poly([[50, 29], [54.5, 57], [45.5, 57]], { fill: 'red', w: 0.9 });
      p.poly([[50, 85], [54.5, 57], [45.5, 57]], { fill: 'white', w: 0.9 });
    });
    p.circle(50, 57, 2.6, { fill: 'gold', w: 0.7 });
  }
});

/* a Lissajous figure: a pen draws x = sin(3τ + δ), y = sin(2τ) while δ turns once a loop, so the figure slowly
   unknots and ties again; the pen's trail is taken back behind it. Tap: the frequency ratio runs up from 3:2 and settles back. */
D.add('lissajous', {
  fam: 'curious', tags: ['curve', 'oscilloscope', 'harmonic', 'pen', 'plot', 'wave', 'figure', 'trace', 'maths'], loop: 6, still: 0.3, tapLen: 2.4, burst: false, margin: [26, 24, 14, 6],
  about: 'a pen traces a 3:2 Lissajous figure that slowly unknots and ties again', tapAbout: 'the frequency ratio runs up and the figure whirls into a tighter knot, then settles back',
  draw: function (p, t, s) {
    var a = 3 + 2 * swell(s), tp = TAU * 2 * t, dl = TAU * t, pts = [], n = p.small ? 40 : 72;
    p.rect(8, 14, 84, 72, { fill: 'cream', w: 0.8 });
    p.line(50, 18, 50, 82, { w: 0.35, dash: [2, 3], detail: true }); p.line(12, 50, 88, 50, { w: 0.35, dash: [2, 3], detail: true });
    for (var i = 0; i <= n; i++) { var tau = tp - 0.9 * TAU * (1 - i / n); pts.push([50 + 36 * sin(a * tau + dl), 50 + 30 * sin(2 * tau)]); }
    p.curve(pts, { ink: 'blue', w: 1 });
    var h = pts[n];
    p.at(h[0], h[1], 0.55, 1, function () {
      p.poly([[0, 0], [2.4, -6], [-2.4, -6]], { fill: 'gold', w: 0.6 });
      p.rect(-2.8, -28, 5.6, 22, { fill: 'navy', w: 0.7, r: 2 });
      p.rect(-3, -22, 6, 3, { fill: 'gold', w: 0.4, detail: true });
    });
  }
});

/* a Hilbert curve drawing itself: a rainbow pen walks the 8×8 cells (4×4 when small) without once crossing its path,
   rests, and is taken back from the start. Tap: the whole drawing runs again at once. */
function hilbert(order) {
  var n = 1 << order, pts = [], i, x, y, rx, ry, t, sx, tmp;
  for (i = 0; i < n * n; i++) {
    x = y = 0; t = i;
    for (sx = 1; sx < n; sx *= 2) { rx = 1 & (t / 2); ry = 1 & (t ^ rx); if (!ry) { if (rx) { x = sx - 1 - x; y = sx - 1 - y; } tmp = x; x = y; y = tmp; } x += sx * rx; y += sx * ry; t = Math.floor(t / 4); }
    pts.push([10 + (x + 0.5) * 80 / n, 10 + (y + 0.5) * 80 / n]);
  }
  return { pts: pts, d: dp(pts) };
}
var HIL = [null, null, hilbert(2), hilbert(3)];
D.add('hilbert', {
  fam: 'curious', tags: ['fractal', 'space-filling', 'curve', 'maths', 'maze', 'recursion', 'rainbow', 'draw'], loop: 5, still: 0.7, tapLen: 1.6, burst: 'star', burstAt: [50, 50], burstN: 6,
  about: 'a rainbow pen draws a Hilbert curve cell by cell, rests, and is taken back from the start', tapAbout: 'the whole drawing runs again in a flash',
  draw: function (p, t, s) {
    var tt = M.frac(t + lap(s, 1)), H = HIL[s.px < 36 ? 2 : 3], b = M.seg(tt, 0.02, 0.62), a = M.seg(tt, 0.8, 1), n = H.pts.length - 1;
    for (var j = 0; j < 7; j++) {
      var lo = Math.max(j / 7, a), hi = Math.min((j + 1) / 7, b);
      if (hi > lo) p.span(H.d, lo, hi, { ink: RAINBOW[j], w: 1.1, cap: 'round' });
    }
    if (a < b) { var f = b * n, i0 = Math.min(n - 1, Math.floor(f)), q = f - i0, A = H.pts[i0], B = H.pts[i0 + 1]; p.dot(A[0] + (B[0] - A[0]) * q, A[1] + (B[1] - A[1]) * q, 3.2 + (tt > 0.62 && tt < 0.8 ? 1.2 * sin(TAU * 4 * tt) : 0), 'ink'); }
  }
});

/* a spirograph: a 24-tooth wheel rolls round inside a 40-tooth ring (5 : 3), so the pen in its hole closes a five-lobed
   rosette after three laps, exactly the length of the loop. The trail behind the pen is taken back as it goes.
   Tap: the wheel races three extra laps and the rosette is redrawn in a flash. */
D.add('spirograph', {
  fam: 'curious', tags: ['spiro', 'rosette', 'hypotrochoid', 'gear', 'draw', 'pattern', 'toy', 'geometry', 'maths'], loop: 6, still: 0.6, tapLen: 2.4, burst: 'star', burstAt: [50, 50], burstN: 6,
  about: 'a wheel rolls round inside a toothed ring while its pen traces a five-lobed rosette', tapAbout: 'the wheel races three extra laps and the rosette redraws itself in a flash',
  draw: function (p, t, s) {
    var R = 40, r = 24, d = 19, th = TAU * 3 * (t + lap(s, 1)), pts = [], n = p.small ? 50 : 90, small = p.small;
    p.circle(50, 50, 46, { fill: 'wood' });
    if (small) p.circle(50, 50, 40, { fill: 'cream', w: 0.8 });
    else p.at(50, 50, 0, 1, function () { p.poly(teeth(40, R - 1.4, R + 1.9, 0), { fill: 'cream', w: 0.8 }); });
    for (var i = 0; i <= n; i++) { var q = th - 5 * PI * (1 - i / n), f = -(R - r) / r * q; pts.push([50 + (R - r) * cos(q) + d * cos(f), 50 + (R - r) * sin(q) + d * sin(f)]); }
    p.curve(pts, { ink: 'b', w: 1 });
    var gx = 50 + (R - r) * cos(th), gy = 50 + (R - r) * sin(th), fg = -(R - r) / r * th, h = pts[n];
    p.at(gx, gy, 0, 1, function () {
      if (small) p.circle(0, 0, r, { fill: 'sky', alpha: 0.3 });
      else { p.poly(gearPts(24, r, fg + PI / 24), { fill: 'sky', alpha: 0.3, line: false }); p.poly(gearPts(24, r, fg + PI / 24), { w: 0.8 }); }
      p.circle(0, 0, 3, { w: 0.6 });
      for (var k = 1; k < 4; k++) p.circle(k * 4.5 * cos(fg), k * 4.5 * sin(fg), 1.1, { w: 0.4, detail: true });
    });
    p.circle(h[0], h[1], 2.2, { fill: 'b', w: 0.8 });
  }
});

/* a Möbius strip with an ant on it: a half-twisted band whose one edge runs round twice, turning slowly in the light.
   The ant walks the middle line: after one lap it is on the other face; after two it is home, and the loop closes.
   Tap: the strip whirls a lap and the ant hops. */
D.add('mobius', {
  fam: 'curious', tags: ['moebius', 'one sided', 'topology', 'band', 'ant', 'infinity', 'maths', 'twist', 'loop', 'surface'], loop: 8, still: 0.05, tapLen: 2.2, burst: 'star', burstAt: [50, 20], burstN: 5, margin: [24, 18, 14, 18],
  about: 'a half-twisted band turns in the light while an ant walks it, one edge all the way round twice', tapAbout: 'the band whirls a lap and the ant hops',
  draw: function (p, t, s) {
    var R = 29, w = 13, N = p.small ? 18 : 32, el = 0.62, cT = cos(el), sT = sin(el), al = TAU * (t + lap(s, 1)), V = [0, cT, sT], Lg = unit([-0.5, 0.7, 0.8]);
    var P = function (u, v) { var rr = R + v * cos(u / 2), a = u + al; return [rr * cos(a), rr * sin(a), v * sin(u / 2)]; };
    var sc = function (q) { return [50 + q[0], 50 + q[1] * sT - q[2] * cT]; }, dep = function (q) { return q[1] * cT + q[2] * sT; };
    var nrm = function (u) { var e = 0.02; return unit(cross(sub(P(u + e, 0), P(u - e, 0)), sub(P(u, 1), P(u, -1)))); };
    var items = [], i, a0, a1, c;
    for (i = 0; i < N; i++) {
      a0 = i * TAU / N; a1 = (i + 1) * TAU / N;
      c = [P(a0, -w), P(a0, w), P(a1, w), P(a1, -w)];
      items.push({ z: (dep(c[0]) + dep(c[1]) + dep(c[2]) + dep(c[3])) / 4, f: (function (c, u) { return function () {
        var l = Math.abs(dot3(nrm(u), Lg));
        p.poly(c.map(sc), { fill: l > 0.8 ? 'white' : l > 0.5 ? 'sky' : 'blue', line: false });
        p.path(dp([sc(c[0]), sc(c[3])]) + dp([sc(c[1]), sc(c[2])]), { w: 0.9, cap: 'round' });
      }; })(c, (a0 + a1) / 2) });
    }
    /* the ant: u runs two laps, the normal turns with the twist, so the face it stands on is the one it is on */
    var ua = TAU * 2 * t + 0.4, nA = nrm(ua), vis = dot3(nA, V), pa = P(ua, 0), ho = s.tap < 0 ? 0 : 13 * M.bump(M.seg(s.tap, 0.1, 0.6)), kf = Math.abs(vis);
    var T = sub(P(ua + 0.02, 0), P(ua - 0.02, 0)), s0 = sc(pa), s1 = sc([pa[0] + T[0], pa[1] + T[1], pa[2] + T[2]]), ang = Math.atan2(s1[1] - s0[1], s1[0] - s0[0]);
    if (vis > 0.02) items.push({ z: dep(pa) + 0.6, f: function () {
      p.at(s0[0] + nA[0] * 3, s0[1] + (nA[1] * sT - nA[2] * cT) * 3 - ho, ang, [1.8, (0.3 + 0.7 * kf) * 1.8], function () {
        for (var k = 0; k < 3; k++) { var sw = 1.6 * sin(TAU * 16 * t + k * 2.1); p.line(-1 + k * 1.6 + sw * 0.5, 0, -2 + k * 2.4 + sw, -4.2, { w: 0.35, detail: true }); p.line(-1 + k * 1.6 - sw * 0.5, 0, -2 + k * 2.4 - sw, 4.2, { w: 0.35, detail: true }); }
        p.ellipse(-4.2, 0, 3.4, 2.4, { fill: 'brown', w: 0.5 }); p.ellipse(0, 0, 2.2, 1.7, { fill: 'brown', w: 0.5 }); p.circle(3.8, 0, 1.9, { fill: 'brown', w: 0.5 });
        p.line(5, -0.6, 8, -2.4, { w: 0.35, detail: true }); p.line(5, 0.6, 8, 2.4, { w: 0.35, detail: true });
      });
    } });
    items.sort(function (a, b) { return a.z - b.z; }).forEach(function (it) { it.f(); });
  }
});

/* the Penrose triangle, drawn as what it is: three real square beams in three dimensions, seen along the one line
   where the end of the last lands exactly on the start of the first. It turns, comes apart into an open zig-zag of
   beams, and snaps shut again at two angles in every lap. Tap: it whirls a lap. */
D.add('penrose', {
  fam: 'curious', tags: ['impossible', 'triangle', 'escher', 'illusion', 'optical illusion', 'maths', 'geometry', 'tribar', 'paradox'], loop: 6, still: 0.004, tapLen: 2.2, burst: 'star', burstAt: [50, 50], burstN: 6,
  about: 'three real beams turn until, at one angle, they close into an impossible triangle, then come apart again', tapAbout: 'the beams whirl a lap and snap shut again',
  draw: function (p, t, s) {
    var c = 0.27, L = 1, al = TAU * (t + lap(s, 1)) - 0.4 * sin(TAU * 2 * t), S = 56;
    var boxes = [[0, L, 0, c, 0, c], [L - c, L, c, L, 0, c], [L - c, L, L - c, L, c, L]], C0 = [0.62, 0.5, 0.3];
    var w0 = unit([1, 1, 1]), r0 = unit([1, -1, 0]), u0 = unit([-1, -1, 2]);
    var wv = [cos(al) * w0[0] + sin(al) * r0[0], cos(al) * w0[1] + sin(al) * r0[1], cos(al) * w0[2] + sin(al) * r0[2]], rv = [cos(al) * r0[0] - sin(al) * w0[0], cos(al) * r0[1] - sin(al) * w0[1], cos(al) * r0[2] - sin(al) * w0[2]];
    var scr = function (q) { var d = sub(q, C0); return [50 + S * dot3(d, rv), 52 - S * dot3(d, u0)]; };
    var col = ['a', 'c', 'b'];
    var order = boxes.map(function (b, i) { return { i: i, z: dot3(sub([(b[0] + b[1]) / 2, (b[2] + b[3]) / 2, (b[4] + b[5]) / 2], C0), wv) }; }).sort(function (a, b) { return a.z - b.z; });
    order.forEach(function (o) {
      var b = boxes[o.i];
      [[0, 1], [1, 1], [2, 1], [0, 0], [1, 0], [2, 0]].forEach(function (f) {
        var ax = f[0], hi = f[1], nrm = [0, 0, 0]; nrm[ax] = hi ? 1 : -1;
        if (dot3(nrm, wv) <= 0.001) return;
        var a1 = (ax + 1) % 3, a2 = (ax + 2) % 3, q = [];
        [[0, 0], [1, 0], [1, 1], [0, 1]].forEach(function (k) { var v = [0, 0, 0]; v[ax] = b[ax * 2 + hi]; v[a1] = b[a1 * 2 + k[0]]; v[a2] = b[a2 * 2 + k[1]]; q.push(scr(v)); });
        p.poly(q, { fill: ax === 2 ? 'a' : ax === 0 ? 'c' : 'b', w: 0.9 });
      });
    });
  }
});

/* a tesseract: the 16 corners and 32 edges of a four-dimensional cube, turned in the plane of x and w (one lap a loop)
   and seen through two perspectives, so the inner cube swells out and the outer cube folds in through itself.
   Teal edges lie in the cell at w = −1, coral in w = +1, the thin ink edges join them. Tap: an extra lap in four dimensions. */
var TV = [], TE = [];
(function () { var i, b; for (i = 0; i < 16; i++) TV.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1]); for (i = 0; i < 16; i++) for (b = 1; b < 16; b *= 2) if (!(i & b)) TE.push([i, i | b]); })();
D.add('tesseract', {
  fam: 'curious', tags: ['hypercube', '4d', 'fourth dimension', 'cube', 'maths', 'geometry', 'projection', 'wireframe', 'rotation'], loop: 8, still: 0.1, tapLen: 2.4, burst: 'star', burstAt: [50, 50], burstN: 6,
  about: 'a hypercube turns in four dimensions: the inner cube swells out and the outer folds in through it', tapAbout: 'an extra lap in the fourth dimension, the cube turning inside out and back',
  draw: function (p, t, s) {
    var a = TAU * (t + lap(s, 1)), b = TAU * t + 0.6, ca = cos(a), sa = sin(a), cb = cos(b), sb = sin(b), S = 15, P = TV.map(function (v) {
      var x = v[0] * ca - v[3] * sa, w = v[0] * sa + v[3] * ca, f = 3.4 / (3.4 - w), y = v[1] * f, z = v[2] * f, X = x * f;
      var X2 = X * cb + z * sb, Z2 = -X * sb + z * cb, Y2 = y * cos(0.5) - Z2 * sin(0.5);
      return [50 + X2 * S, 50 - Y2 * S];
    });
    TE.forEach(function (e) {
      var wa = TV[e[0]][3], wb = TV[e[1]][3], A = P[e[0]], B = P[e[1]];
      p.line(A[0], A[1], B[0], B[1], wa !== wb ? { w: 0.5, ink: 'ink', alpha: 0.8 } : { w: 0.85, ink: wa < 0 ? 'c' : 'b' });
    });
    if (!p.small) P.forEach(function (q, i) { p.dot(q[0], q[1], 1.6, TV[i][3] < 0 ? 'c' : 'b'); });
  }
});

/* a Rubik's cube: the top layer twists a quarter at a time and clicks, four turns and the colours are home again.
   The stickers are real stickers on a real cube, so the corners swing wide and show the black plastic under the layer.
   Tap: a full extra twist, confetti. */
var CUBE = [];
(function () {
  var F = [[[0, 1, 0], [1, 0, 0], [0, 0, 1], 'white'], [[1, 0, 0], [0, 0, 1], [0, 1, 0], 'red'], [[0, 0, 1], [1, 0, 0], [0, 1, 0], 'leaf'], [[-1, 0, 0], [0, 0, 1], [0, 1, 0], 'orange'], [[0, 0, -1], [1, 0, 0], [0, 1, 0], 'blue']];
  F.forEach(function (f) {
    for (var i = -1; i <= 1; i++) for (var j = -1; j <= 1; j++) {
      var c = [f[0][0] * 1.5 + f[1][0] * i + f[2][0] * j, f[0][1] * 1.5 + f[1][1] * i + f[2][1] * j, f[0][2] * 1.5 + f[1][2] * i + f[2][2] * j], top = c[1] > 0.9;
      if (top || (f[0][0] + f[0][2] > 0)) CUBE.push({ c: c, n: f[0], a: f[1], b: f[2], col: f[3], top: top });
    }
  });
})();
D.add('cube', {
  fam: 'curious', tags: ['rubik', 'puzzle', 'twist', 'toy', 'solve', 'colours', 'game', 'brain', 'permutation'], loop: 5, still: 0.05, tapLen: 1.8, burst: 'confetti', burstAt: [50, 30], burstN: 9, margin: [26, 18, 14, 18],
  about: 'the top layer twists a quarter turn and clicks; four turns and every colour is home again', tapAbout: 'a whole extra twist of the top layer and a spray of confetti',
  draw: function (p, t, s) {
    var S = 15, cx = 50, cy = 52, k = Math.floor(4 * t), f = 4 * t - k, Th = PI / 2 * (k + M.ease(M.seg(f, 0, 0.55))) + TAU * lap(s, 1), small = p.small, rot = [], st = [];
    var quad = function (c, a, b, h) { return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(function (q) { return iso([c[0] + h * (q[0] * a[0] + q[1] * b[0]), c[1] + h * (q[0] * a[1] + q[1] * b[1]), c[2] + h * (q[0] * a[2] + q[1] * b[2])], S, cx, cy); }); };
    CUBE.forEach(function (c) {
      var o = c; if (c.top) o = { c: rotY(c.c, Th), n: rotY(c.n, Th), a: rotY(c.a, Th), b: rotY(c.b, Th), col: c.col };
      if (o.n[0] + o.n[1] + o.n[2] < 0.01) return;
      (c.top ? rot : st).push({ z: o.c[0] + o.c[1] + o.c[2], o: o });
    });
    var cell = function (e) { var o = e.o; p.poly(quad(o.c, o.a, o.b, 0.5), { fill: 'black', w: 0.5, ink: 'black' }); p.poly(quad(o.c, o.a, o.b, 0.4), small ? { fill: o.col, line: false } : { fill: o.col, w: 0.5, ink: 'black' }); };
    st.forEach(cell);
    p.poly([[-1.5, 0.5, -1.5], [1.5, 0.5, -1.5], [1.5, 0.5, 1.5], [-1.5, 0.5, 1.5]].map(function (q) { return iso(q, S, cx, cy); }), { fill: 'black', w: 0.5, ink: 'black' });
    rot.sort(function (a, b) { return a.z - b.z; }).forEach(cell);
  }
});

/* a die: three faces show in an isometric view, pips laid out the way a die is, opposite faces adding to seven.
   It sways on the table. Tap: it hops, tumbles a lap and a quarter, lands squashed and rests on a new face. */
var DF = [[[0, 1, 0], [1, 0, 0], [0, 0, 1], 1], [[0, -1, 0], [1, 0, 0], [0, 0, 1], 6], [[1, 0, 0], [0, 0, 1], [0, 1, 0], 2], [[-1, 0, 0], [0, 0, 1], [0, 1, 0], 5], [[0, 0, 1], [1, 0, 0], [0, 1, 0], 3], [[0, 0, -1], [1, 0, 0], [0, 1, 0], 4]];
var PIPS = [null, [[0, 0]], [[-1, -1], [1, 1]], [[-1, -1], [0, 0], [1, 1]], [[-1, -1], [1, -1], [-1, 1], [1, 1]], [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]]];
function roll(q, j, ang) { return j % 2 ? rotX(q, ang) : rotZ(q, -ang); }   /* rolls alternate toward +z and +x: odd about x, even about z */
D.add('dice', {
  fam: 'curious', tags: ['die', 'roll', 'random', 'luck', 'game', 'chance', 'probability', 'board game', 'pips', 'gamble'], loop: 4, still: 0.15, tapLen: 1.6, tapRest: 1, burst: 'star', burstAt: [50, 50], burstN: 5, margin: [34, 18, 12, 18],
  about: 'a die sways a little on the table, three faces showing', tapAbout: 'it hops, tumbles a lap and a quarter, lands squashed and rests on a new face',
  draw: function (p, t, s) {
    var S = 21, cx = 50, cy = 52, n = s.taps || 0, a = s.tap < 0 ? 0 : s.tap, yaw = 0.22 * sin(TAU * t), pre = n - (s.tap < 0 ? 0 : 1), hop = 0, sq = 0, spin = 0;
    if (s.tap >= 0) { var u = M.seg(a, 0.05, 0.82); hop = 1.6 * 4 * u * (1 - u); spin = (PI / 2 + TAU) * M.ease(u); sq = 0.14 * M.bump(M.seg(a, 0.8, 1)); }
    var lim = pre % 6;
    var xf = function (q, d) {
      for (var j = 1; j <= lim; j++) q = roll(q, j, PI / 2);
      if (s.tap >= 0) q = roll(q, lim + 1, spin);
      q = rotY(q, yaw); if (d) { q = [q[0] * (1 + sq * 0.4), -1 + (q[1] + 1) * (1 - sq) + hop, q[2] * (1 + sq * 0.4)]; }
      return q;
    };
    p.ellipse(50, 78, 30 - 6 * hop, 11 - 2 * hop, { fill: 'smoke', line: false });
    var faces = DF.map(function (f) {
      var nn = xf(f[0], false), ctr = xf(f[0], true), ax = unit(sub(xf(f[1], false), [0, 0, 0])), bx = unit(xf(f[2], false));
      return { f: f, n: nn, c: ctr, a: ax, b: bx };
    }).filter(function (o) { return o.n[0] + o.n[1] + o.n[2] > 0.01; });
    var Lg = unit([-0.2, 0.9, 0.5]);
    var P3 = function (o, u, v) { return [o.c[0] + u * o.a[0] + v * o.b[0], o.c[1] + u * o.a[1] + v * o.b[1], o.c[2] + u * o.a[2] + v * o.b[2]]; };
    faces.forEach(function (o) {
      var ch = 0.2, oc = [[-1 + ch, -1], [1 - ch, -1], [1, -1 + ch], [1, 1 - ch], [1 - ch, 1], [-1 + ch, 1], [-1, 1 - ch], [-1, -1 + ch]], l = dot3(o.n, Lg);
      p.poly(oc.map(function (q) { return iso(P3(o, q[0], q[1]), S, cx, cy); }), { fill: l > 0.6 ? 'white' : l > 0.25 ? 'cream' : 'sand', w: 0.9 });
      PIPS[o.f[3]].forEach(function (pp) {
        var pts = []; for (var k = 0; k < 9; k++) { var ph = k * TAU / 9; pts.push(iso(P3(o, pp[0] * 0.5 + 0.17 * cos(ph), pp[1] * 0.5 + 0.17 * sin(ph)), S, cx, cy)); }
        p.poly(pts, { fill: o.f[3] === 1 ? 'red' : 'ink', line: false });
      });
    });
  }
});

/* a coin flipped twice a loop: three and a half turns in the air each time, so it lands heads and then tails,
   a shadow shrinking under it, a squash and a rock when it is caught. The face at each toss is a crown, then a star.
   Tap: a high toss with three extra spins. */
D.add('coin', {
  fam: 'curious', tags: ['flip', 'toss', 'heads', 'tails', 'money', 'decide', 'luck', 'chance', 'gold', 'choose'], loop: 3.2, still: 0.4, tapLen: 1.6, burst: 'star', burstAt: [50, 40], burstN: 5, margin: [34, 18, 12, 18],
  about: 'a coin is tossed twice a loop, heads then tails, with a shadow below', tapAbout: 'a high toss with three extra spins and a catch',
  draw: function (p, t, s) {
    var R = 22, T = 5, j = t < 0.5 ? 0 : 1, u = M.frac(2 * t), a = M.seg(u, 0, 0.8), air = u < 0.8, h = air ? 30 * 4 * a * (1 - a) : 0, ph = j * PI + (air ? 3.5 * TAU * a : 3.5 * TAU);
    var ta = s.tap < 0 ? 0 : s.tap; h += 26 * 4 * ta * (1 - ta); ph += lap(s, 3) * TAU;
    var land = u >= 0.8 ? (u - 0.8) / 0.2 : -1, sq = land >= 0 ? 0.1 * M.bump(M.seg(land, 0, 0.5)) : 0, cy = 62 - h + (land >= 0 ? 0 : 0), rock = land >= 0 ? 0.25 * Math.exp(-5 * land) * sin(TAU * 2 * land) : 0;
    ph += rock;
    p.ellipse(50, 90, 20 - 7 * (h / 56), 5 - 1.5 * (h / 56), { fill: 'smoke', line: false });
    var sn = sin(ph), cs = cos(ph), yh = cy - T / 2 * sn, yt = cy + T / 2 * sn, front = cs >= 0, c = Math.abs(cs) * (1 - sq * 0.5);
    var face = function (yy, heads) {
      p.at(50, yy, 0, [1 + sq * 0.5, Math.max(0.02, c)], function () {
        p.circle(0, 0, R, { fill: heads ? 'a' : 'yellow', w: 1.1 });
        p.circle(0, 0, R - 4, { w: 0.5, detail: true });
        if (heads) p.path('M-9 5 L-9 -5 L-4.5 0 L0 -7 L4.5 0 L9 -5 L9 5 Z', { fill: 'gold', w: 0.8 });
        else { p.star(0, 0, 9, 4, 5, { fill: 'gold', w: 0.8 }); }
      });
    };
    face(front ? yt : yh, !front);
    p.poly([[50 - R, yh], [50 + R, yh], [50 + R, yt], [50 - R, yt]], { fill: 'gold', line: false });
    p.line(50 - R, yh, 50 - R, yt, { w: 1 }); p.line(50 + R, yh, 50 + R, yt, { w: 1 });
    face(front ? yh : yt, front);
  }
});

/* a padlock with a key in it: the key tries the lock, a little turn and back, a glint on the brass.
   Tap: the key turns a quarter, the shackle springs up and swings open with a click, then it snaps shut again. */
D.add('key', {
  fam: 'curious', tags: ['lock', 'padlock', 'unlock', 'security', 'open', 'access', 'password', 'secret', 'safe'], loop: 3, still: 0.2, tapLen: 2.4, burst: 'star', burstAt: [50, 28], burstN: 5, margin: [22, 22, 14, 18],
  about: 'a key in a padlock tries a little turn and back, a glint on the brass', tapAbout: 'the key turns, the shackle springs open with a click, then snaps shut again',
  draw: function (p, t, s) {
    var tp = s.tap < 0 ? 0 : s.tap, kt = 1.5 * M.spring(M.seg(tp, 0, 0.28)) * (1 - M.ease(M.seg(tp, 0.7, 0.9))), op = M.spring(M.seg(tp, 0.3, 0.42)) * (1 - M.ease(M.seg(tp, 0.6, 0.72)));
    var psi = 0.2 + 0.2 * sin(TAU * 2 * t) + 0.06 * sin(TAU * 5 * t) + kt, shk = 'M36 50 L36 32 C36 12 64 12 64 32 L64 50';
    p.push(); p.move(0, -9 * op);
    p.pivot(36, 50, -0.55 * op, 1, function () { p.path(shk, { w: 2.2, cap: 'round' }); p.path(shk, { w: 1.1, ink: 'grey', cap: 'round' }); });
    p.pop();
    p.rect(24, 48, 52, 42, { fill: 'gold', r: 8, w: 1.1 });
    p.rect(28, 52, 44, 4, { fill: 'yellow', line: false, r: 2 });
    p.circle(50, 66, 4.6, { fill: 'ink', w: 0.5 }); p.poly([[47.6, 68], [52.4, 68], [54.5, 80], [45.5, 80]], { fill: 'ink', w: 0.5 });
    p.at(50, 66, psi, 1, function () {
      p.rect(0, -2.5, 24, 5, { fill: 'grey', w: 0.8 });
      p.rect(9, 2.5, 3.4, 4.4, { fill: 'grey', w: 0.6, detail: true }); p.rect(16, 2.5, 3.4, 3.4, { fill: 'grey', w: 0.6, detail: true });
      p.circle(31, 0, 7.6, { fill: 'a', w: 1 }); p.circle(31, 0, 3.2, { fill: 'bg', w: 0.7 });
    });
    var g = M.bump(M.seg(t, 0.55, 0.85)); if (g > 0) p.at(34, 58, 0.4, g, function () { p.path('M0 -5 L1 -1 L5 0 L1 1 L0 5 L-1 1 L-5 0 L-1 -1 Z', { fill: 'white', w: 0.5 }); });
    var ck = M.seg(tp, 0.3, 0.5), ck2 = M.seg(tp, 0.72, 0.9);
    [[ck, 70, 30], [ck2, 70, 40]].forEach(function (c) { if (c[0] > 0 && c[0] < 1) for (var m = -1; m <= 1; m++) { var an = -0.4 + m * 0.55; p.span('M' + (c[1] + 4) + ' ' + c[2] + ' L' + (c[1] + 4 + 11 * cos(an)).toFixed(1) + ' ' + (c[2] + 11 * sin(an)).toFixed(1), M.easeIn(M.seg(c[0], 0.4, 1)), M.easeOut(M.seg(c[0], 0, 0.6)), { w: 0.7, ink: 'a' }); } });
  }
});

/* a garden sundial: the dial in three-quarter view with its hour lines laid out the way a horizontal dial needs them
   (tan of the line = sin of the latitude × tan of the hour angle), a brass fin, and the sun crossing right to left while
   the shadow sweeps left to right, long at dawn and dusk, short at noon, clipped to the dial. Night: the sun sets, the
   shadow is taken back into the fin. Tap: a whole day passes in a flash. */
D.add('sundial', {
  fam: 'curious', tags: ['shadow', 'time', 'sun', 'clock', 'hour', 'garden', 'gnomon', 'day', 'ancient', 'astronomy'], loop: 8, still: 0.4, tapLen: 2, burst: false, margin: [10, 10, 6, 10],
  about: 'the sun crosses the sky and the fin\'s shadow sweeps the dial, long at dawn and dusk, short at noon', tapAbout: 'a whole day passes in a flash',
  draw: function (p, t, s) {
    var tt = M.frac(t + lap(s, 1)), u = M.seg(tt, 0.08, 0.92), vis = M.easeOut(M.seg(tt, 0.02, 0.1)) * (1 - M.easeIn(M.seg(tt, 0.9, 0.98))), rho = 0.5, cr = cos(rho), sr = sin(rho);
    var pl = function (X, Y, Z) { return [50 + 42 * (X * cr + Y * sr), 50 - 19 * (-X * sr + Y * cr) - (Z || 0)]; };
    var hr = -75 + 150 * u, beta = Math.atan(0.5 * Math.tan(hr * PI / 180));
    p.poly([[37, 70], [63, 70], [60, 91], [40, 91]], { fill: 'stone' }); p.ellipse(50, 91, 24, 5, { fill: 'stone' });
    p.path('M8 50 L8 57 A42 19 0 0 0 92 57 L92 50 Z', { fill: 'stone' });
    p.ellipse(50, 50, 42, 19, { fill: 'sand' });
    p.ellipse(50, 50, 36, 16, { w: 0.4, detail: true });
    for (var h = -6; h <= 6; h++) {
      var b = Math.abs(h) === 6 ? h / 6 * PI / 2 : Math.atan(0.5 * Math.tan(h * 15 * PI / 180)), a = pl(0.8 * sin(b), 0.8 * cos(b)), e = pl(0.95 * sin(b), 0.95 * cos(b));
      p.line(a[0], a[1], e[0], e[1], { w: h === 0 ? 0.9 : 0.55 });
    }
    var l = vis * (0.75 + 0.6 * Math.abs(beta) / 1.08), d = [sin(beta), cos(beta)], nn = [cos(beta), -sin(beta)];
    if (l > 0.02) p.clip(function () { p.ellipse(50, 50, 42, 19, {}); }, function () {
      p.poly([pl(-0.07 * nn[0], -0.07 * nn[1]), pl(0.07 * nn[0], 0.07 * nn[1]), pl(d[0] * l + 0.13 * nn[0], d[1] * l + 0.13 * nn[1]), pl(d[0] * l - 0.13 * nn[0], d[1] * l - 0.13 * nn[1])], { fill: 'ink', alpha: 0.5, line: false });
    });
    var g0 = pl(0, -0.3, 0), g1 = pl(0, 0.3, 0), g2 = pl(0, 0.3, 24);
    p.poly([[g0[0] + 3.5, g0[1]], [g1[0] + 3.5, g1[1]], [g2[0] + 3.5, g2[1]]], { fill: 'brown', w: 0.8 });
    p.poly([g0, g1, g2], { fill: 'gold', w: 1 });
    p.line(g0[0], g0[1], g2[0], g2[1], { w: 0.4, detail: true });
    if (vis > 0.03) {
      var sx = 50 + 42 * cos(PI * u), sy = 24 - 15 * sin(PI * u), rr = 5.5 * vis;
      for (var k = 0; k < 8; k++) { var ra = TAU * (k / 8 + t * 0.5); p.line(sx + (rr + 2) * cos(ra), sy + (rr + 2) * sin(ra), sx + (rr + 2 + 3.5 * vis) * cos(ra), sy + (rr + 2 + 3.5 * vis) * sin(ra), { w: 0.8, ink: 'a', detail: true }); }
      p.circle(sx, sy, rr, { fill: 'a', w: 0.9 });
    }
  }
});

/* a lighthouse: striped tower, lantern room, a double beam that turns once a loop, so the wedges swing from long to
   short as they come round and a flare opens when one points at you; waves roll past the rock. Tap: the lamp whirls
   two more laps with a flare. */
D.add('lighthouse', {
  fam: 'curious', tags: ['beam', 'light', 'sea', 'coast', 'ship', 'hazard', 'beacon', 'navigation', 'night', 'tower', 'sweep'], loop: 4, still: 0.1, tapLen: 2.2, burst: 'star', burstAt: [50, 30], burstN: 5,
  about: 'a double beam sweeps round, flaring when it points at you, while waves roll past the rock', tapAbout: 'the lamp whirls two extra laps in a flare',
  draw: function (p, t, s) {
    var ph = TAU * (t + lap(s, 2)), c = cos(ph), sn = Math.abs(sin(ph)), fl = s.tap < 0 ? 0 : M.bump(s.tap);
    p.ellipse(50, 88, 28, 7, { fill: 'stone' });
    p.poly([[40, 86], [60, 86], [56, 41], [44, 41]], { fill: 'white' });
    [[80, 70], [62, 52]].forEach(function (b) { var xl = function (y) { return 40 + (86 - y) * 4 / 46; }; p.poly([[xl(b[0]), b[0]], [100 - xl(b[0]), b[0]], [100 - xl(b[1]), b[1]], [xl(b[1]), b[1]]], { fill: 'red', w: 0.8 }); });
    p.rect(37, 36, 26, 5, { fill: 'grey', w: 0.9 });
    p.rect(43, 24, 14, 12, { fill: 'cream', w: 0.9 }); p.line(50, 24, 50, 36, { w: 0.5, detail: true });
    var len = 46 * c, hw = 6 + 5 * Math.abs(c), g = 4 + 15 * Math.pow(sn, 3) + 6 * fl;
    p.poly([[50, 30], [50 + len, 30 - hw], [50 + len, 30 + hw]], { fill: 'yellow', alpha: 0.6, line: false });
    p.poly([[50, 30], [50 - len, 30 - hw], [50 - len, 30 + hw]], { fill: 'yellow', alpha: 0.6, line: false });
    p.circle(50, 30, g, { fill: 'yellow', alpha: 0.7, line: false }); p.circle(50, 30, 3, { fill: 'white', w: 0.5 });
    p.poly([[41, 24], [50, 14], [59, 24]], { fill: 'red', w: 0.9 }); p.dot(50, 12.5, 1.8);
    var w1 = [], w2 = [];
    for (var x = 0; x <= 100; x += 4) { w1.push([x, 88 + 2.4 * sin(TAU * (x / 50 - t * 2))]); w2.push([x, 93 + 2 * sin(TAU * (x / 40 - t * 2 + 0.3))]); }
    p.poly(w1.concat([[100, 100], [0, 100]]), { fill: 'sea', alpha: 0.75, line: false });
    p.curve(w1, { w: 0.9 });
    p.curve(w2, { w: 0.5, ink: 'white', detail: true });
  }
});

/* a Galton board: balls drop through five rows of pegs, left or right at each, and pile into six bins in the
   ratio 1 : 5 : 10 : 10 : 5 : 1 (what 26 balls would do, shared out here as 1 4 8 8 4 1). Every ball's path is fixed,
   so the heap grows into a bell; the floor is then taken back left to right, the balls drop out and it re-forms.
   Tap: the bell curve draws itself over the pile. */
var GB = (function () {
  var R = M.rng(11), bins = [], i, j, n = [1, 4, 8, 8, 4, 1], out = [], cnt = [0, 0, 0, 0, 0, 0];
  for (i = 0; i < 6; i++) for (j = 0; j < n[i]; j++) bins.push(i);
  for (i = bins.length - 1; i > 0; i--) { j = Math.floor(R() * (i + 1)); var q = bins[i]; bins[i] = bins[j]; bins[j] = q; }
  bins.forEach(function (b, k) {
    var idx = [0, 1, 2, 3, 4], ch = [-1, -1, -1, -1, -1], a;
    for (a = 4; a > 0; a--) { j = Math.floor(R() * (a + 1)); var z = idx[a]; idx[a] = idx[j]; idx[j] = z; }
    for (a = 0; a < b; a++) ch[idx[a]] = 1;
    out.push({ bin: b, ch: ch, slot: cnt[b]++, t0: 0.01 + k * 0.027 });
  });
  return out;
})();
D.add('galton', {
  fam: 'curious', tags: ['bell curve', 'normal distribution', 'statistics', 'probability', 'chance', 'pegs', 'binomial', 'random', 'data', 'histogram'], loop: 8, still: 0.88, tapLen: 2.4, burst: false, margin: [10, 10, 30, 10],
  about: 'balls drop through pegs, left or right at each, and pile into a bell; the floor opens, they fall away and it begins again', tapAbout: 'the bell curve draws itself over the pile and is taken back',
  draw: function (p, t, s) {
    var floor = 'M14 92 L86 92', dr0 = 0.9, dr1 = 0.965, tp = s.tap < 0 ? -1 : s.tap;
    p.poly([[40, 2], [60, 2], [54, 12], [46, 12]], { fill: 'sky', w: 0.9 });
    p.poly([[50, 14], [14, 72], [14, 94], [86, 94], [86, 72]], { fill: 'cream', w: 0.8 });
    for (var j = 0; j <= 6; j++) p.line(14 + 12 * j, 68, 14 + 12 * j, 92, { w: 0.5 });
    for (var r = 0; r < 5; r++) for (var i = 0; i <= r; i++) p.dot(50 + (i - r / 2) * 12, 26 + 9 * r, 1.7, 'ink');
    GB.forEach(function (b) {
      var a = t - b.t0; if (a < 0) return;
      var ry = function (r) { return 26 + 9 * r - 4.9; }, rowT = 0.032, hop = 0.03, binx = 50 + (b.bin - 2.5) * 12, side = b.slot % 2 ? 3 : -3;
      var yl = 92 - 3.2 - Math.floor(b.slot / 2) * 5.6, x, y;
      if (a < hop) { x = 50; y = 12 + (ry(0) - 12) * (a / hop) * (a / hop); }
      else {
        var k = Math.floor((a - hop) / rowT), f = (a - hop - k * rowT) / rowT, xr = 50;
        for (var q = 0; q < Math.min(k, 5); q++) xr += b.ch[q] * 6;
        if (k < 4) { x = xr + b.ch[k] * 6 * M.ease(f); y = ry(k) + 9 * f * f; }
        else if (k === 4) { x = xr + (b.ch[4] * 6 + side) * M.ease(f); y = ry(4) + (yl - ry(4)) * f * f; }
        else { x = binx + side; y = yl; }
      }
      if (t >= dr0) { var dj = Math.max(0, t - (dr0 + b.bin * 0.012)); y += 3000 * dj * dj; }
      p.circle(x, y, 3.2, { fill: 'b', w: 0.6 });
    });
    if (t < dr0) p.draw(floor, 1, { w: 1.2 });
    else if (t < dr1) p.span(floor, M.seg(t, dr0, dr1), 1, { w: 1.2 });
    else p.draw(floor, M.seg(t, dr1, 1), { w: 1.2 });
    if (tp >= 0) {
      var bell = []; for (var x2 = 14; x2 <= 86; x2 += 3) bell.push([x2, 91 - 4 - 25 * Math.exp(-Math.pow((x2 - 50) / 15, 2) / 2)]);
      p.span(dp(bell), M.ease(M.seg(tp, 0.55, 0.95)), M.ease(M.seg(tp, 0, 0.45)), { w: 1, ink: 'blue' });
    }
  }
});

/* DNA: the double helix turns once a loop, strand over strand, with the base pairs shortening to nothing where the
   strands cross and opening out where they are widest; each rung is two bases, one colour for each half.
   Tap: it unzips from the top down, the bases pulling back onto their strands, and zips shut again. */
D.add('dna', {
  fam: 'curious', tags: ['helix', 'genetics', 'gene', 'biology', 'science', 'strand', 'base pair', 'genome', 'molecule', 'life'], loop: 4, still: 0.1, tapLen: 2.4, burst: 'spark', burstAt: [50, 50], burstN: 5,
  about: 'a double helix turns, the base pairs closing at each crossing and opening at each bulge', tapAbout: 'it unzips from the top down, the bases pulling back onto their strands, and zips shut again',
  draw: function (p, t, s) {
    var k = TAU * 1.6 / 88, ph = TAU * t, tp = s.tap < 0 ? -1 : s.tap;
    var g = function (y) { return tp < 0 ? 0 : M.bump(M.seg(tp, (y - 6) / 88 * 0.4, (y - 6) / 88 * 0.4 + 0.55)); };
    var th = function (y) { return k * (y - 6) + ph; }, X = function (y, sg) { return 50 + sg * 22 * (1 + 0.3 * g(y)) * sin(th(y)); };
    var runs = [];
    [1, -1].forEach(function (sg) {
      var cur = null, last = null;
      for (var y = 4; y <= 96; y += 2) {
        var side = sg * cos(th(y)) >= 0, q = [X(y, sg), y];
        if (!cur || cur.f !== side) { cur = { f: side, sg: sg, pts: last ? [last] : [] }; runs.push(cur); }
        cur.pts.push(q); last = q;
      }
    });
    runs.forEach(function (r) { if (!r.f && r.pts.length > 2) p.curve(r.pts, { w: 0.8, ink: r.sg > 0 ? 'b' : 'c', alpha: 0.55, cap: 'round' }); });
    for (var i = 0; i < 10; i++) {
      var y = 10 + i * 9.2, x1 = X(y, 1), x2 = X(y, -1), xm = (x1 + x2) / 2, fr = 1 - 0.8 * g(y), cs = i % 2 ? ['pink', 'mint'] : ['a', 'sky'];
      p.line(x1, y, x1 + (xm - x1) * fr, y, { w: 1.1, ink: cs[0], cap: 'round' }); p.line(x2, y, x2 + (xm - x2) * fr, y, { w: 1.1, ink: cs[1], cap: 'round' });
    }
    runs.forEach(function (r) { if (r.f && r.pts.length > 2) { p.curve(r.pts, { w: 1.5, ink: 'ink', cap: 'round' }); p.curve(r.pts, { w: 0.85, ink: r.sg > 0 ? 'b' : 'c', cap: 'round' }); } });
  }
});

/* an atom: three tilted orbits at 60° to one another, electrons going round at different speeds and directions, each
   with a comet tail drawn behind it and passing behind the nucleus on the far half of its orbit; the nucleus of red and
   blue nucleons shivers. Tap: the shells swell, the electrons run a lap more and the nucleus flares. */
D.add('atom', {
  fam: 'curious', tags: ['electron', 'nucleus', 'physics', 'chemistry', 'science', 'orbit', 'proton', 'quantum', 'particle', 'bohr'], loop: 6, still: 0.1, tapLen: 2, burst: 'star', burstAt: [50, 50], burstN: 6,
  about: 'electrons trail round three tilted orbits and slip behind a shivering nucleus', tapAbout: 'the shells swell, the electrons run an extra lap and the nucleus flares',
  draw: function (p, t, s) {
    var sw = swell(s), sc = 1 + 0.16 * sw, w = lap(s, 1), rx = 44 * sc, ry = 15 * sc, ROT = [0, PI / 3, 2 * PI / 3], E = [[0, 2, 0], [0, 2, 0.5], [1, -1, 0.2], [2, 3, 0.7]];
    ROT.forEach(function (r) { p.ellipse(50, 50, rx, ry, { rot: r, w: 0.55, alpha: 0.8 }); });
    var pos = function (e, a) { var lx = rx * cos(a), ly = ry * sin(a), c = cos(ROT[e[0]]), sn = sin(ROT[e[0]]); return [50 + lx * c - ly * sn, 50 + lx * sn + ly * c]; };
    var els = E.map(function (e) { var a = TAU * (e[1] * (t + w) + e[2]); return { e: e, a: a, q: pos(e, a), back: sin(a) <= 0 }; });
    var draw = function (o) {
      var tr = []; for (var i = 0; i <= 8; i++) tr.push(pos(o.e, o.a - 0.9 * (1 - i / 8) * (o.e[1] < 0 ? -1 : 1)));
      p.curve(tr, { w: 0.9, ink: 'a' });
      p.circle(o.q[0], o.q[1], 3.2, { fill: 'a', w: 0.9 });
    };
    els.filter(function (o) { return o.back; }).forEach(draw);
    var N = [[-3.2, -2.4, 'red'], [3, -3, 'sky'], [0.2, 2.2, 'red'], [-4, 3.2, 'sky'], [4, 2.4, 'red'], [0, -5.4, 'sky']];
    N.forEach(function (n, i) { p.circle(50 + n[0] + 0.9 * sin(TAU * (2 * t + i / 6)), 50 + n[1] + 0.9 * cos(TAU * (3 * t + i / 6)), 4.4 * (1 + 0.25 * sw), { fill: n[2], w: 0.7 }); });
    els.filter(function (o) { return !o.back; }).forEach(draw);
  }
});

/* a music box with its lid up: a pinned barrel turns (the pins ride down the front of it), each pin catches the tip of a
   steel tine under the barrel and the tine rings and settles; the crank on the front turns with it, and notes rise and
   shrink away. Tap: the crank spins up, the pins race, and a flurry of notes goes up. */
D.add('music-box', {
  fam: 'curious', tags: ['music', 'lullaby', 'crank', 'comb', 'cylinder', 'melody', 'tune', 'gift', 'antique', 'box'], loop: 4, still: 0.3, tapLen: 2.4, burst: 'note', burstAt: [50, 30], burstN: 6, margin: [18, 18, 8, 18],
  about: 'the pins on the barrel pluck the comb\'s tines one after another while the crank turns and notes rise', tapAbout: 'the crank spins up, the pins race along the comb and a flurry of notes goes up',
  draw: function (p, t, s) {
    var te = t + (s.tap < 0 ? 0 : M.ease(s.tap)), A = [0, 2.1, 4.2, 1, 3.1, 5.2], i, j;
    p.poly([[22, 5], [78, 5], [88, 34], [12, 34]], { fill: 'wood' });
    p.poly([[27, 9], [73, 9], [81, 30], [19, 30]], { fill: 'sand', w: 0.5, detail: true }); p.star(50, 19.5, 6, 2.8, 5, { fill: 'gold', w: 0.6, detail: true });
    p.rect(10, 34, 80, 34, { fill: 'night', w: 0.9 });
    p.rect(14, 37, 56, 20, { fill: 'gold', r: 3 }); p.ellipse(14, 47, 3.2, 10, { fill: 'a', w: 0.8 });
    for (j = 0; j < 6; j++) {
      var x = 22 + j * 9, u = M.frac(4 * te - 2 * (PI / 2 - A[j]) / TAU), osc = Math.exp(-5 * u) * sin(TAU * 4 * u) * 2.4;
      for (i = 0; i < 2; i++) { var an = A[j] + i * PI + TAU * 2 * te; if (cos(an) > 0) { p.line(x, 47 + 10 * sin(an), x, 47 + 13 * sin(an), { w: 0.5 }); p.dot(x, 47 + 13 * sin(an), 1.6, 'ink'); } }
      p.line(x, 65, x + osc, 59.5, { w: 0.6, ink: 'white' });
    }
    p.rect(16, 64, 56, 4, { fill: 'grey', w: 0.8 });
    p.rect(6, 68, 88, 26, { fill: 'wood', r: 3 }); p.rect(12, 72, 50, 18, { fill: 'sand', w: 0.5, r: 2, detail: true });
    var ca = TAU * 2 * te;
    p.circle(80, 81, 9, { fill: 'a', w: 0.9 }); p.line(80, 81, 80 + 6.5 * cos(ca), 81 + 6.5 * sin(ca), { w: 0.9 }); p.circle(80 + 6.5 * cos(ca), 81 + 6.5 * sin(ca), 2.6, { fill: 'wood', w: 0.8 });
    for (i = 0; i < 3; i++) {
      var ph = M.frac(te * 2 + i / 3), sc = Math.sqrt(M.bump(ph)) * 1.1;
      if (sc > 0.05) p.at(80 + 6 * sin(TAU * (ph * 1.5 + i / 3)), 58 - 50 * ph, 0, sc, function () { p.ellipse(-2, 3, 3.4, 2.5, { fill: 'plum', rot: -0.4, w: 0.7 }); p.line(1, 2, 1, -9, { w: 0.7 }); p.path('M1 -9 Q6 -7 5 -2', { w: 0.7 }); });
    }
  }
});

/* a hot-air balloon: a striped envelope sways, the basket swings a beat behind it on its ropes, the burner roars twice a
   loop and the flame lights the inside of the mouth; small clouds grow, drift by and shrink away.
   Tap: the burner roars and the balloon lifts, then settles back. */
var ENV = 'M50 6 C30 6 18 20 19 36 C20 52 33 62 42 69 L58 69 C67 62 80 52 81 36 C82 20 70 6 50 6 Z';
D.add('balloon', {
  fam: 'curious', tags: ['hot air', 'balloon', 'travel', 'sky', 'float', 'adventure', 'flight', 'burner', 'basket', 'up'], loop: 4, still: 0.2, tapLen: 2.6, burst: 'ember', burstAt: [50, 70], burstN: 7, margin: [24, 18, 10, 18],
  about: 'the balloon sways with its basket swinging a beat behind, the burner roaring twice a loop, clouds drifting by', tapAbout: 'the burner roars and the balloon lifts, then settles back',
  draw: function (p, t, s) {
    var tp = s.tap < 0 ? 0 : s.tap, rise = s.tap < 0 ? 0 : 22 * M.spring(M.seg(tp, 0, 0.4)) * (1 - M.ease(M.seg(tp, 0.55, 1))), f = 1 + 0.9 * M.bump(M.seg(M.frac(2 * t), 0, 0.4)) + 1.1 * M.bump(M.seg(tp, 0, 0.7)) + 0.1 * sin(TAU * 5 * t);
    for (var m = 0; m < 2; m++) { var ph = M.frac(t + m * 0.5), sc = Math.sqrt(M.bump(ph)); if (sc > 0.05) p.blob(100 - 100 * ph, 28 + 34 * m, 7 * sc, { fill: 'white', w: 0.6, lumpy: 0.2, sx: 1.7, seed: 3 + m, detail: true }); }
    p.push(); p.move(0, -rise + 2.4 * sin(TAU * t));
    p.pivot(50, 8, 0.05 * sin(TAU * t), 1, function () {
      p.path(ENV, { fill: 'b' });
      p.clip(ENV, function () {
        p.path('M10 28 C35 34 65 34 90 28 L90 40 C65 46 35 46 10 40 Z', { fill: 'a', line: false });
        p.path('M50 4 C39 20 37 50 45 70 L55 70 C63 50 61 20 50 4 Z', { fill: 'cream', line: false });
      });
      p.path(ENV, { w: 1 }); p.path('M50 6 C34 22 33 48 43 69', { w: 0.4, detail: true }); p.path('M50 6 C66 22 67 48 57 69', { w: 0.4, detail: true });
      p.rect(42, 68, 16, 3, { fill: 'grey', w: 0.7 });
      p.pivot(50, 70, 0.07 * sin(TAU * (t - 0.08)), 1, function () {
        p.line(43, 71, 45, 80, { w: 0.5 }); p.line(57, 71, 55, 80, { w: 0.5 });
        p.at(50, 73, 0, [f * 0.85, f], function () { p.path('M0 0 C-5 -3 -5 -11 0 -17 C5 -11 5 -3 0 0 Z', { fill: 'flame', w: 0.7 }); p.path('M0 0 C-2.4 -2 -2.4 -6 0 -9 C2.4 -6 2.4 -2 0 0 Z', { fill: 'yellow', line: false }); });
        p.rect(41, 80, 18, 11, { fill: 'wood', r: 2, w: 0.9 }); p.line(41, 85, 59, 85, { w: 0.35, detail: true });
      });
    });
    p.pop();
  }
});

/* a rocket on its pad, shivering, steam rolling out along the ground and shrinking away, a pilot flame at the nozzle.
   Tap: it shakes, launches up out of the glyph on a column of smoke, and comes back down on its own flame, legs out,
   to land on the pad. */
D.add('rocket', {
  fam: 'curious', tags: ['launch', 'space', 'spaceship', 'blast off', 'startup', 'rocket', 'fly', 'nasa', 'boost', 'liftoff'], loop: 3, still: 0.3, tapLen: 3.6, burst: 'ember', burstAt: [50, 82], burstN: 8, burstSpread: 3.2, margin: [30, 18, 6, 18], tapMargin: [190, 40, 20, 40],
  about: 'the rocket shivers on its pad while steam rolls out along the ground', tapAbout: 'it launches out of the glyph on a column of smoke, then lands again on its own flame, legs out',
  draw: function (p, t, s) {
    var tp = s.tap < 0 ? -1 : s.tap, yo = 0, ex = 0, lg = 0, i;
    if (tp >= 0) {
      yo = tp < 0.5 ? -150 * M.easeIn(M.seg(tp, 0.1, 0.5)) : tp < 0.56 ? -150 : -150 * (1 - M.easeOut(M.seg(tp, 0.56, 0.92)));
      ex = tp < 0.5 ? 20 * M.ease(M.seg(tp, 0, 0.18)) : tp < 0.56 ? 0 : 14 * (1 - M.ease(M.seg(tp, 0.82, 0.95)));
      lg = M.ease(M.seg(tp, 0.62, 0.8)) * (1 - M.ease(M.seg(tp, 0.94, 1)));
    }
    var jx = 0.6 * sin(TAU * 9 * t) + (tp >= 0 && tp < 0.12 ? 1.2 * sin(TAU * 20 * tp) : 0), fl = 5 + 1.5 * sin(TAU * 6 * t) + ex, bil = tp < 0 ? 1 : 1 + 0.7 * M.bump(M.seg(tp, 0.05, 0.65));
    p.rect(24, 84, 52, 5, { fill: 'stone', r: 2 });
    for (i = 0; i < 4; i++) {
      var u = M.frac(t * 2 + i * 0.25), sd = i % 2 ? 1 : -1, r = (2 + 3.2 * sin(PI * u)) * (1 - M.ease(M.seg(u, 0.7, 1))) * bil;
      if (r > 0.4) p.blob(50 + sd * (15 + 24 * u * bil), 81 - 2 * u, r, { fill: 'white', w: 0.6, lumpy: 0.15, seed: 4 + i });
    }
    if (tp >= 0.05 && tp < 0.65) for (i = 0; i < 7; i++) {
      var yk = 80 - 12 * i, vis = M.clamp((yk - (78 + yo)) / 12, 0, 1) * (1 - M.ease(M.seg(tp, 0.4, 0.62)));
      if (vis > 0.03) p.blob(50 + 3 * sin(i * 1.9), yk, (5 + 0.4 * i) * vis, { fill: 'white', w: 0.6, lumpy: 0.2, seed: 9 + i });
    }
    p.at(50 + jx, 12 + yo, 0, 1, function () {
      p.path('M-8 62 C-8 66 8 66 8 62', { w: 0 });
      p.at(0, 68, 0, 1, function () { p.path('M-6 0 C-7 ' + (fl * 0.5).toFixed(1) + ' -2 ' + (fl * 0.8).toFixed(1) + ' 0 ' + fl.toFixed(1) + ' C2 ' + (fl * 0.8).toFixed(1) + ' 7 ' + (fl * 0.5).toFixed(1) + ' 6 0 Z', { fill: 'flame', w: 0.7 }); p.path('M-2.5 0 C-3 ' + (fl * 0.3).toFixed(1) + ' -1 ' + (fl * 0.5).toFixed(1) + ' 0 ' + (fl * 0.6).toFixed(1) + ' C1 ' + (fl * 0.5).toFixed(1) + ' 3 ' + (fl * 0.3).toFixed(1) + ' 2.5 0 Z', { fill: 'yellow', line: false }); });
      if (lg > 0.02) { p.line(-10, 54, -10 - 9 * lg, 54 + 24 * lg, { w: 1 }); p.line(10, 54, 10 + 9 * lg, 54 + 24 * lg, { w: 1 }); p.dot(-10 - 9 * lg, 54 + 24 * lg, 2, 'ink'); p.dot(10 + 9 * lg, 54 + 24 * lg, 2, 'ink'); }
      p.path('M-12 46 C-18 52 -22 62 -22 70 L-12 62 Z', { fill: 'b' }); p.path('M12 46 C18 52 22 62 22 70 L12 62 Z', { fill: 'b' });
      p.poly([[-6, 62], [6, 62], [8, 68], [-8, 68]], { fill: 'grey', w: 0.8 });
      p.path('M0 0 C8 8 12 20 12 36 L12 62 L-12 62 L-12 36 C-12 20 -8 8 0 0 Z', { fill: 'white' });
      p.path('M0 0 C4 4 8 10 10 18 L-10 18 C-8 10 -4 4 0 0 Z', { fill: 'b', w: 0.9 });
      p.rect(-12, 52, 24, 4, { fill: 'b', w: 0.7, detail: true });
      p.circle(0, 34, 6, { fill: 'sky', w: 1 }); p.arc(0, 34, 3.4, 3.5, 4.8, { w: 0.5, ink: 'white', detail: true });
    });
  }
});

/* a telescope on its tripod, the tube sliding a little in and out as it pans, a star twinkling where it points and a
   shooting star drawn across the sky and taken back. Tap: it swings up onto the star, which flares, and settles back. */
D.add('telescope', {
  fam: 'curious', tags: ['stars', 'astronomy', 'observe', 'night sky', 'zoom', 'look', 'space', 'explore', 'lens', 'sky'], loop: 4, still: 0.3, tapLen: 2.2, burst: 'star', burstAt: [86, 26], burstN: 5, margin: [14, 18, 8, 8],
  about: 'the tube pans and slides, a star twinkles where it points and a shooting star crosses', tapAbout: 'it swings up onto the star, which flares, then settles back',
  draw: function (p, t, s) {
    var tp = s.tap < 0 ? 0 : s.tap, a = -0.62 + 0.05 * sin(TAU * t) - 0.3 * M.spring(M.seg(tp, 0, 0.35)) * (1 - M.ease(M.seg(tp, 0.7, 1))), sl = 2.5 * sin(TAU * t + 1), M0 = [42, 62];
    p.line(42, 62, 20, 94, { w: 1.1 }); p.line(42, 62, 66, 94, { w: 1.1 }); p.line(42, 62, 46, 94, { w: 0.9, alpha: 0.6 });
    p.line(26, 86, 58, 86, { w: 0.4, detail: true });
    var h = M.seg(t, 0.15, 0.4), tl = M.seg(t, 0.25, 0.45);
    if (h > 0 && tl < 1) { p.span('M6 8 L52 30', tl, h, { w: 0.8 }); if (h < 1) p.dot(6 + 46 * h, 8 + 22 * h, 1.8, 'a'); }
    var tw = [[24, 14, 0], [64, 8, 0.4], [90, 52, 0.7]];
    tw.forEach(function (q) { var k = M.bump(M.frac(t * 2 + q[2])); if (k > 0.05) p.at(q[0], q[1], 0, k, function () { p.path('M0 -4 L1 -1 L4 0 L1 1 L0 4 L-1 1 L-4 0 L-1 -1 Z', { fill: 'yellow', w: 0.5 }); }); });
    var st = 1 + 1.3 * M.bump(M.seg(tp, 0.2, 0.8)) + 0.35 * sin(TAU * 2 * t), sx = 42 + 56 * cos(a), sy = 62 + 56 * sin(a);
    p.at(42, 62, a, 1, function () {
      p.rect(-18, -4, 36, 8, { fill: 'navy', w: 0.9 });
      p.rect(14 + sl, -5.5, 28, 11, { fill: 'a', w: 0.9, r: 1.5 });
      p.line(24 + sl, -5.5, 24 + sl, 5.5, { w: 0.5, detail: true });
      p.ellipse(42 + sl, 0, 2.4, 5.5, { fill: 'sky', w: 0.8 });
      p.rect(-23, -2.2, 6, 4.4, { fill: 'grey', w: 0.8 });
      p.rect(2, -11, 18, 3.4, { fill: 'navy', w: 0.7, detail: true }); p.line(6, -8, 6, -5, { w: 0.6, detail: true }); p.line(16, -8, 16, -5, { w: 0.6, detail: true });
    });
    p.circle(42, 62, 4.4, { fill: 'grey', w: 0.9 });
    p.at(sx, sy, 0, st, function () { p.path('M0 -7 L1.6 -1.6 L7 0 L1.6 1.6 L0 7 L-1.6 1.6 L-7 0 L-1.6 -1.6 Z', { fill: 'yellow', w: 0.7 }); });
  }
});

/* a bar magnet turning under a card of iron filings: each filing lies along the field of a dipole at its place, and
   hears of the turn a little later the farther it is, so the field lines swing round in a ripple.
   Tap: the magnet spins two laps and the filings chase it. */
D.add('magnet', {
  fam: 'curious', tags: ['magnetic', 'field', 'iron filings', 'physics', 'attract', 'pole', 'north', 'south', 'dipole', 'force'], loop: 5, still: 0.1, tapLen: 2.4, burst: false,
  about: 'a bar magnet turns under iron filings and the field lines swing round after it in a ripple', tapAbout: 'the magnet spins two laps and the filings chase it round',
  draw: function (p, t, s) {
    var th = TAU * (t + lap(s, 2)), n = p.small ? 4 : 9, m = p.small ? 4 : 8, i, j;
    p.rect(6, 8, 88, 84, { fill: 'cream', w: 0.9, r: 4 });
    for (i = 0; i < n; i++) for (j = 0; j < m; j++) {
      var x = 50 + (i - (n - 1) / 2) * (78 / (n - 1)), y = 50 + (j - (m - 1) / 2) * (66 / (m - 1)), dx = x - 50, dy = y - 50, r = Math.hypot(dx, dy);
      if (r < 15) continue;
      var a = th - 0.9 * TAU * 0.06 * r / 50, mx = cos(a), my = sin(a), dd = (dx * mx + dy * my) / r, bx = 3 * dd * dx / r - mx, by = 3 * dd * dy / r - my, fa = Math.atan2(by, bx), c = cos(fa) * 3, sn = sin(fa) * 3;
      p.line(x - c, y - sn, x + c, y + sn, { w: 0.6, cap: 'round' });
    }
    p.at(50, 50, th, 1, function () {
      p.rect(-22, -7, 22, 14, { fill: 'red', w: 1 }); p.rect(0, -7, 22, 14, { fill: 'sky', w: 1 });
      p.rect(-22, -7, 5, 14, { fill: 'white', w: 0.5, detail: true }); p.rect(17, -7, 5, 14, { fill: 'white', w: 0.5, detail: true });
    });
  }
});

/* a prism: a white beam comes in from the lower left, passes through the glass and leaves as a fan of seven colours,
   red bent least and violet most. The prism rocks a little, so the fan swings and opens and closes as the light
   comes through at a new angle. Tap: the fan spreads wide with a flash, then folds back. */
D.add('prism', {
  fam: 'curious', tags: ['light', 'spectrum', 'rainbow', 'refraction', 'optics', 'colour', 'dispersion', 'glass', 'physics', 'pink floyd'], loop: 4, still: 0.25, tapLen: 2, burst: 'star', burstAt: [78, 56], burstN: 6,
  about: 'a white beam enters a rocking glass prism and leaves as a swinging fan of the seven spectrum colours', tapAbout: 'the fan spreads wide with a flash, then folds back',
  draw: function (p, t, s) {
    var D0 = 0.14 * sin(TAU * t), sw = swell(s), C = [50, 56], rot = function (q) { var c = cos(D0), sn = sin(D0), x = q[0] - C[0], y = q[1] - C[1]; return [C[0] + x * c - y * sn, C[1] + x * sn + y * c]; };
    var A = rot([50, 14]), B = rot([18, 72]), Cc = rot([82, 72]), E = rot([34, 43]), X = rot([66, 43]), S = [2, 62];
    var fc = 0.5 + 1.2 * D0, sp = (0.7 + 0.5 * D0) * (1 + 0.8 * sw), i;
    for (i = 0; i < 7; i++) {
      var a0 = fc - sp / 2 + i * sp / 7, a1 = fc - sp / 2 + (i + 1) * sp / 7, L = 36 + 8 * sw;
      p.poly([X, [X[0] + L * cos(a0), X[1] + L * sin(a0)], [X[0] + L * cos(a1), X[1] + L * sin(a1)]], { fill: RAINBOW[i], ink: RAINBOW[i], w: 0.4 });
    }
    p.poly([A, B, Cc], { fill: 'sky', alpha: 0.3, line: false }); p.poly([A, B, Cc], { w: 1 });
    p.line(E[0], E[1], X[0], X[1], { w: 0.9, ink: 'white' });
    var dx = E[0] - S[0], dy = E[1] - S[1], d = Math.hypot(dx, dy), nx = -dy / d * 2.4, ny = dx / d * 2.4;
    p.poly([[S[0] + nx, S[1] + ny], [E[0] + nx, E[1] + ny], [E[0] - nx, E[1] - ny], [S[0] - nx, S[1] - ny]], { fill: 'white', w: 0.8 });
    for (i = 0; i < 3; i++) { var q = M.frac(t * 2 + i / 3); p.line(S[0] + dx * q, S[1] + dy * q, S[0] + dx * (q + 0.1), S[1] + dy * (q + 0.1), { w: 0.5, detail: true }); }
    p.line(A[0], A[1], B[0], B[1], { w: 0.3, ink: 'white', detail: true, alpha: 0.9 });
    if (sw > 0.05) p.circle(X[0], X[1], 6 * sw, { fill: 'white', alpha: 0.8, line: false });
  }
});

/* a lava lamp: the glass is the clip, so the wax stays inside it. Three blobs rise from the pool on a neck that thins and
   lets go, swell as they climb, squash against the cap and sink; the pool breathes as they leave it.
   Tap: the lamp warms and the blobs whirl a whole cycle in a flash. */
var GLASS = 'M40 14 C40 14 37 40 26 80 L74 80 C63 40 60 14 60 14 Z';
D.add('lava-lamp', {
  fam: 'curious', tags: ['lava', 'retro', 'blob', 'wax', 'groovy', 'relax', 'chill', 'mood', 'lamp', '60s'], loop: 6, still: 0.1, tapLen: 2.2, burst: 'bubble', burstAt: [50, 20], burstN: 6,
  about: 'blobs of wax rise from the pool, stretch away on a thin neck, squash on the cap and sink', tapAbout: 'the lamp warms and the blobs whirl a full cycle in a flash',
  draw: function (p, t, s) {
    var tt = t + lap(s, 1);
    p.poly([[24, 94], [76, 94], [70, 80], [30, 80]], { fill: 'night' }); p.poly([[38, 5], [62, 5], [59, 14], [41, 14]], { fill: 'grey' });
    p.path(GLASS, { fill: 'lilac' });
    p.clip(GLASS, function () {
      var B = [[0, 0.0, 5.5, 1], [1, 0.34, 4.6, 2], [2, 0.67, 5, 3]], pool = 8 + 3 * sin(TAU * tt);
      var items = B.map(function (b) { var u = 0.5 - 0.5 * cos(TAU * (tt + b[1])), y = 74 - 56 * u; return { y: y, x: 50 + 6 * sin(TAU * (tt + b[1]) * 1) * (1 - Math.abs(2 * u - 1) * 0.4), r: b[2] * (1 + 0.5 * Math.sin(PI * u)), sq: y < 26 ? 1 - 0.25 * (26 - y) / 8 : 1, seed: b[3], ph: b[1] }; });
      var shapes = [function (o) { p.ellipse(50, 80, 26, pool, o); }];
      items.forEach(function (b) {
        if (b.y > 56) shapes.push(function (o) { var k = (b.y - 56) / 18; p.ellipse(50, (68 + b.y) / 2, 1.5 + 4 * (1 - k) + 1, (b.y - 66) / 2 + 3, o); });
        shapes.push(function (o) { var sx = 1 + 0.1 * sin(TAU * (2 * tt + b.ph)); o.sx = sx; o.sy = b.sq / sx; o.lumpy = 0.1; o.seed = b.seed; p.blob(b.x, b.y, b.r, o); });
      });
      shapes.forEach(function (f) { f({ fill: 'rose', w: 0.8 }); });
      shapes.forEach(function (f) { var o = { fill: 'rose', line: false }; f(o); });
    });
    p.path(GLASS, { w: 1 });
    p.path('M34 30 C33 46 31 60 29 72', { ink: 'white', w: 0.8, detail: true });
  }
});

/* a snow globe: a house and a fir tree on a hill under a glass dome (the dome is the clip, so the snow stays in), snow
   falling slowly and each flake swaying on its own. Tap: it is shaken, the whole globe rocking, the snow thrown up and
   swirling, then settling back to fall again. */
D.add('snow-globe', {
  fam: 'curious', tags: ['snow', 'winter', 'christmas', 'holiday', 'shake', 'souvenir', 'dome', 'cosy', 'cold', 'glass'], loop: 5, still: 0.2, tapLen: 2.6, burst: false, margin: [10, 10, 4, 10],
  about: 'snow drifts down inside a glass dome over a little house and a fir', tapAbout: 'it is shaken, the globe rocking, the snow thrown up and swirling, then settling',
  draw: function (p, t, s) {
    var tp = s.tap < 0 ? -1 : s.tap, rk = tp < 0 ? 0 : 0.12 * sin(TAU * 4 * tp) * (1 - tp), lift = tp < 0 ? 0 : M.bump(M.seg(tp, 0, 0.55)), sw = tp < 0 ? 0 : M.bump(tp), R = M.rng(5), i;
    p.pivot(50, 94, rk, 1, function () {
      p.circle(50, 44, 36, { fill: 'sky', alpha: 0.28, line: false });
      p.clip(function () { p.circle(50, 44, 36, {}); }, function () {
        p.ellipse(50, 80, 38, 13, { fill: 'white', w: 0.8 });
        p.rect(36, 60, 18, 15, { fill: 'wood', w: 0.9 }); p.poly([[33, 61], [45, 49], [57, 61]], { fill: 'b', w: 0.9 }); p.rect(42, 66, 6, 9, { fill: 'brown', w: 0.6 }); p.rect(49, 63, 3.6, 3.6, { fill: 'yellow', w: 0.5, detail: true });
        p.poly([[62, 72], [68, 54], [74, 72]], { fill: 'green', w: 0.8 }); p.poly([[63, 64], [68, 48], [73, 64]], { fill: 'leaf', w: 0.8 });
        for (i = 0; i < 18; i++) {
          var x0 = 50 + (R() - 0.5) * 56, ph = R(), r = R(), f = M.frac(ph + t), y = 12 + 68 * f - 40 * lift * (0.4 + r), x = x0 + 4 * sin(TAU * (2 * t + ph * 3)) + 16 * sw * sin(TAU * (1.5 * tp + r) + y * 0.07), k = Math.min(1, 5 * f, 5 * (1 - f)) * (1 + 0.5 * r);
          if (tp >= 0) k = Math.max(k, lift);
          p.circle(x, y, 1.9 * Math.min(1.4, k), { fill: 'white', w: 0.5 });
        }
      });
      p.circle(50, 44, 36, { w: 1 });
      p.arc(50, 44, 29, 3.55, 4.4, { w: 0.9, detail: true });
      p.poly([[22, 80], [78, 80], [86, 94], [14, 94]], { fill: 'wood' }); p.rect(20, 77, 60, 5, { fill: 'gold', w: 0.8, r: 2 });
    });
  }
});

/* a paper boat on the waves: the swell passes under it, so it climbs, tips and slides down each one a beat behind the
   water; the front wave runs on the other timing and hides the foot of the hull. Tap: a big wave lifts it, it
   tips over the crest and drops with a splash. */
D.add('paper-boat', {
  fam: 'curious', tags: ['origami', 'sea', 'sail', 'water', 'float', 'journey', 'toy', 'child', 'wave', 'voyage'], loop: 4, still: 0.2, tapLen: 2, burst: 'drop', burstAt: [50, 72], burstN: 7,
  about: 'a folded paper boat rides the swell, climbing and tipping with each wave, a front wave hiding its foot', tapAbout: 'a big wave lifts it, it tips over the crest and drops with a splash',
  draw: function (p, t, s) {
    var tp = s.tap < 0 ? 0 : s.tap, big = M.bump(tp), wv = function (x) { return 62 + 3.2 * sin(TAU * (x / 60 - t)) + 1.5 * sin(TAU * (x / 34 - 2 * t + 0.2)); }, pts = [], fr = [], x;
    for (x = 0; x <= 100; x += 4) { pts.push([x, wv(x) - 3 * big * sin(PI * x / 100)]); fr.push([x, wv(x) + 5 + 3.4 * sin(TAU * (x / 45 - t * 2 + 0.3)) + 2 * big]); }
    p.poly(pts.concat([[100, 100], [0, 100]]), { fill: 'sky', alpha: 0.7, line: false }); p.curve(pts, { w: 0.9 });
    var yb = wv(50) - 12 * big, sl = (wv(53) - wv(47)) / 6, rot = Math.atan(sl) * 0.55 + 0.5 * big * M.ease(M.seg(tp, 0.3, 0.7)) * (1 - M.ease(M.seg(tp, 0.7, 1)));
    p.at(50, yb + 2, rot, 0.88, function () {
      p.poly([[0, -52], [-28, -16], [28, -16]], { fill: 'cream', w: 1 });
      p.poly([[0, -52], [0, -16], [-28, -16]], { fill: 'sand', w: 0.6 });
      p.path('M-42 -18 L42 -18 L27 8 L-27 8 Z', { fill: 'cream', w: 1 });
      p.poly([[-36, -9], [36, -9], [27, 8], [-27, 8]], { fill: 'b', w: 0.7 });
      p.line(0, -52, 0, -16, { w: 0.4, detail: true });
    });
    p.poly(fr.concat([[100, 100], [0, 100]]), { fill: 'sea', alpha: 0.8, line: false }); p.curve(fr, { w: 0.9 });
  }
});

/* a kite: a diamond of four colours tipped and bobbing in the wind, its tail a wave that travels down it, the bows
   turning as it passes, the string sagging to a spool. Tap: a gust crosses from the left, the kite darts up and the
   tail whips. */
D.add('kite', {
  fam: 'curious', tags: ['wind', 'fly', 'string', 'spring', 'breeze', 'play', 'child', 'tail', 'sky', 'air'], loop: 3, still: 0.2, tapLen: 2, burst: false, margin: [10, 14, 8, 10],
  about: 'the kite tips and bobs, a wave running down its tail, the string sagging to the spool', tapAbout: 'a gust crosses from the left, the kite darts up and the tail whips',
  draw: function (p, t, s) {
    var tp = s.tap < 0 ? 0 : s.tap, gs = M.spring(M.seg(tp, 0.1, 0.5)) * (1 - M.ease(M.seg(tp, 0.55, 1))), tilt = 0.12 * sin(TAU * t) + 0.04 * sin(TAU * 3 * t) - 0.18 * gs, ox = 6 * gs, oy = 2.5 * sin(TAU * t + 1) - 7 * gs, amp = 4.5 * (1 + 1.2 * swell(s));
    var bx = 58 + ox - 4 * sin(tilt), by = 34 + oy + 4 * cos(tilt);
    p.curve([[bx, by], [(bx + 8) / 2 + 5, (by + 92) / 2 + 9], [8, 92]], { w: 0.5 });
    p.rect(3, 89, 9, 7, { fill: 'wood', w: 0.8, r: 2 });
    p.push(); p.move(ox, oy);
    p.pivot(58, 34, tilt, 1, function () {
      var tail = [], i;
      for (i = 0; i <= 14; i++) { var q = i / 14; tail.push([58 + 14 * q + amp * q * sin(TAU * (1.7 * q - 2 * t)), 60 + 36 * q]); }
      p.curve(tail, { w: 0.7 });
      [3, 7, 11].forEach(function (k, j) { var a = Math.atan2(tail[k + 1][1] - tail[k][1], tail[k + 1][0] - tail[k][0]) + 0.3 * sin(TAU * (2 * t + k / 10)); p.at(tail[k][0], tail[k][1], a, 1, function () { p.poly([[0, 0], [-4, -3.4], [-4, 3.4]], { fill: j % 2 ? 'a' : 'b', w: 0.6 }); p.poly([[0, 0], [4, -3.4], [4, 3.4]], { fill: j % 2 ? 'b' : 'c', w: 0.6 }); }); });
      p.poly([[58, 6], [80, 30], [58, 60], [36, 30]], { fill: 'a' });
      p.poly([[58, 6], [80, 30], [58, 30]], { fill: 'b', w: 0.6 }); p.poly([[36, 30], [58, 60], [58, 30]], { fill: 'c', w: 0.6 });
      p.poly([[58, 6], [80, 30], [58, 60], [36, 30]], { w: 1 });
      p.line(58, 6, 58, 60, { w: 0.5, detail: true }); p.line(36, 30, 80, 30, { w: 0.5, detail: true });
    });
    p.pop();
    for (var g = 0; g < 3; g++) { var u0 = M.seg(tp, 0.02 + g * 0.06, 0.45 + g * 0.06); if (u0 > 0 && u0 < 1) p.span('M-8 ' + (22 + g * 16) + ' C20 ' + (16 + g * 16) + ' 40 ' + (30 + g * 16) + ' 70 ' + (24 + g * 16), M.easeIn(M.seg(u0, 0.5, 1)), M.easeOut(M.seg(u0, 0, 0.6)), { w: 0.6, detail: true }); }
  }
});

/* an origami crane, red paper, wings that flap twice a loop (the near wing a beat ahead of the far one), the body lifting
   on the down-stroke and the neck and tail swinging after it. Tap: a flurry of flaps, it lifts away and settles back. */
D.add('crane', {
  fam: 'curious', tags: ['origami', 'paper', 'bird', 'peace', 'japan', 'flap', 'fold', 'wings', 'sadako', 'senbazuru'], loop: 2.4, still: 0.1, tapLen: 2.4, burst: 'confetti', burstAt: [50, 60], burstN: 7, margin: [26, 14, 8, 10],
  about: 'a red paper crane flaps its wings twice a loop, the body lifting on each down-stroke', tapAbout: 'a flurry of flaps, it lifts away and settles back',
  draw: function (p, t, s) {
    var tt = t + lap(s, 1), bob = 2.5 * cos(TAU * 2 * tt) - (s.tap < 0 ? 0 : 20 * M.bump(s.tap)), lag = 0.06 * sin(TAU * (2 * tt - 0.12));
    var wing = function (ph, col, col2, sg) {
      var f = 0.5 + 0.7 * sin(TAU * (2 * tt - ph)), tip = sg > 0 ? [56 + 12 * cos(f), 52 - 40 * sin(f) + 22 * cos(f)] : [48 - 8 * cos(f), 52 - 40 * sin(f) - 24 * cos(f)], y0 = sg > 0 ? 53 : 51;
      p.poly([[36, y0], [68, y0], tip], { fill: col, w: 0.9 });
      p.poly([[52, y0], [68, y0], tip], { fill: col2, w: 0.6 });
    };
    p.push(); p.move(0, bob);
    wing(0.1, 'rose', 'pink', -1);
    p.pivot(30, 60, lag, 1, function () { p.poly([[30, 60], [38, 57], [23, 14], [18, 17]], { fill: 'b', w: 0.9 }); p.poly([[18, 17], [23, 14], [9, 22]], { fill: 'red', w: 0.8 }); });
    p.pivot(74, 56, -lag, 1, function () { p.poly([[66, 52], [74, 56], [92, 44], [88, 39]], { fill: 'b', w: 0.9 }); });
    p.poly([[30, 60], [52, 74], [74, 56], [52, 50]], { fill: 'b', w: 1 }); p.line(52, 50, 52, 74, { w: 0.4, detail: true });
    wing(0, 'pink', 'white', 1);
    p.pop();
  }
});

/* an abacus: four rods, a bead above the beam worth five and four below worth one, counting its way up through
   a handful of sums to 3141 and then swept clean with one stroke of the hand. The beads on the left rods follow
   a beat behind, as a carry would. Tap: the beads clack across to the beam, left to right, and fall back. */
var ABN = [0, 6, 17, 42, 85, 214, 586, 1492, 2718, 3141];
D.add('abacus', {
  fam: 'curious', tags: ['count', 'calculate', 'sum', 'maths', 'soroban', 'beads', 'numbers', 'arithmetic', 'tally', 'school'], loop: 7, still: 0.8, tapLen: 1.8, burst: false,
  about: 'beads slide along four rods through a run of sums to 3141, then are swept clean', tapAbout: 'the beads clack across to the beam from left to right, and fall back',
  draw: function (p, t, s) {
    var tp = s.tap < 0 ? -1 : s.tap, st = [0, 0, 0, 0], k, r, b, K = ABN.length - 1;
    p.rect(8, 6, 84, 88, { fill: 'wood', r: 4 }); p.rect(14, 12, 72, 76, { fill: 'cream', w: 0.6 });
    var act = function (n, rod, bead) { var d = [Math.floor(n / 1000) % 10, Math.floor(n / 100) % 10, Math.floor(n / 10) % 10, n % 10][rod]; return bead === 4 ? (d >= 5 ? 1 : 0) : ((d % 5) > bead ? 1 : 0); };
    k = Math.floor((t - 0.04) / 0.085); k = M.clamp(k, -1, K - 1);
    var f = k < 0 ? 0 : (t - 0.04 - k * 0.085) / 0.085, n0 = ABN[Math.max(0, k)], n1 = ABN[Math.min(K, k + 1)];
    if (k < 0) { n0 = n1 = 0; } else if (t >= 0.04 + K * 0.085) { n0 = n1 = ABN[K]; }
    for (r = 0; r < 4; r++) {
      var x = 26 + r * 16, e = M.ease(M.seg(f, r * 0.08, 0.5 + r * 0.08)), cl = 1 - M.ease(M.seg(t, 0.9 + r * 0.02, 0.95 + r * 0.02));
      p.line(x, 12, x, 88, { w: 0.9 });
      for (b = 0; b < 5; b++) {
        var a = (act(n0, r, b) * (1 - e) + act(n1, r, b) * e) * cl, i = r * 5 + b;
        if (tp >= 0) a = Math.max(a, M.bump(M.seg(tp, i * 0.03, i * 0.03 + 0.4)));
        var y = b === 4 ? 15.5 + 18.5 * a : 62 + 7.4 * b - 14.5 * a;
        p.ellipse(x, y, 6.6, 3.7, { fill: b === 4 ? 'a' : 'b', w: 0.8 });
      }
    }
    p.rect(14, 38, 72, 5, { fill: 'wood', w: 0.8 });
    for (r = 0; r < 4; r++) p.dot(26 + r * 16, 40.5, 0.9, 'ink');
  }
});

/* a typewriter: the carriage steps left a letter at a time as a typebar swings up and strikes, the key dipping; at the
   end of the line the bell dings and the carriage runs back while the paper feeds up a line; at the end of the second
   line the sheet is whisked off up and away and a blank one rises in behind the platen. Tap: ding, and the carriage
   zips back to the margin and runs on again. */
var TYPE = [[[0, -2], [0, 2]], [[-1, -2], [0, 2], [1, -2]], [[-1, 2], [-1, -2], [1, -2], [1, 2]], [[-1, 2], [1, -2]], [[-1, -2], [1, -2], [0, 0], [-1, 2], [1, 2]]];
D.add('typewriter', {
  fam: 'curious', tags: ['type', 'write', 'writer', 'author', 'novel', 'keys', 'paper', 'letter', 'old', 'retro', 'ding'], loop: 7, still: 0.34, tapLen: 1.8, burst: 'ring', burstAt: [88, 48], burstN: 3, burstSpread: 1.2, margin: [34, 26, 6, 28],
  about: 'keys strike and the carriage steps left letter by letter; the bell dings, the carriage runs back, a fresh sheet rises in', tapAbout: 'ding, and the carriage zips back to the margin and runs on again',
  draw: function (p, t, s) {
    var tp = s.tap < 0 ? 0 : s.tap, DT = 0.028, L1 = 0.03, L2 = 0.43, pitch = 2.2, i, cxo = 0, oy = 0, act = -1, f = 0;
    var typed = function (t0) { return M.clamp((t - t0) / DT, 0, 11); };
    var seg1 = typed(L1), seg2 = typed(L2);
    if (t < 0.34) { cxo = -pitch * (Math.floor(seg1) + M.ease(M.seg(seg1 - Math.floor(seg1), 0, 0.3))); if (seg1 >= 11) cxo = -pitch * 11; if (t >= L1 && seg1 < 11) { act = Math.floor(seg1); f = seg1 - act; } }
    else if (t < 0.43) { var e1 = M.ease(M.seg(t, 0.34, 0.4)); cxo = -pitch * 11 * (1 - e1); oy = -8 * e1; }
    else if (t < 0.74) { oy = -8; cxo = -pitch * (Math.floor(seg2) + M.ease(M.seg(seg2 - Math.floor(seg2), 0, 0.3))); if (seg2 >= 11) cxo = -pitch * 11; if (seg2 < 11) { act = Math.floor(seg2); f = seg2 - act; } }
    else { oy = -8; cxo = -pitch * 11 * (1 - M.ease(M.seg(t, 0.74, 0.8))); }
    var zip = swell(s); cxo *= (1 - zip);
    var sheet = function (line1, line2, fy) {
      p.rect(24, 5 + fy, 56, 42, { fill: 'white', w: 0.8 });
      var row = function (y, t0, full) { for (var k = 0; k < 11; k++) { var u = full ? 1 : M.seg(t, t0 + k * DT, t0 + k * DT + 0.8 * DT); if (u <= 0) continue; var R = M.rng(7 + k + (y > 30 ? 40 : 0)), g = TYPE[Math.floor(R() * 5)]; p.draw('M' + g.map(function (q) { return (50 + k * pitch + q[0] * 0.8).toFixed(1) + ' ' + (y + fy + q[1] * 1.1).toFixed(1); }).join('L'), u, { w: 0.5, cap: 'round' }); } };
      if (line1) row(27 - 8 * (oy < 0 ? 0 : 0) + (oy < -0.01 || t >= 0.34 ? 0 : 0), L1, t >= 0.34);
      if (line2) row(35, L2, false);
    };
    var out = M.seg(t, 0.82, 0.93), inn = M.seg(t, 0.9, 1);
    p.push(); p.move(cxo, oy);
    if (t < 0.82) sheet(true, true, 0);
    else if (out < 1) { p.pivot(50, 25, 0.5 * M.easeIn(out), 1 - 0.7 * M.easeIn(out), function () { p.move(28 * M.easeIn(out), -50 * M.easeIn(out)); sheet(true, true, 0); }); }
    if (t >= 0.9) { p.move(0, 46 * (1 - M.easeOut(inn))); p.rect(24, 5, 56, 42, { fill: 'white', w: 0.8 }); }
    p.pop();
    p.rect(8, 40, 84, 22, { fill: 'night', w: 0.8 });
    p.push(); p.move(cxo, 0);
    p.rect(12, 31, 76, 9, { fill: 'grey', w: 0.9, r: 3 }); p.circle(8, 35.5, 3.6, { fill: 'stone', w: 0.8 }); p.circle(92, 35.5, 3.6, { fill: 'stone', w: 0.8 }); p.line(8, 35.5, 1, 29, { w: 0.9 });
    p.pop();
    for (i = 0; i < 7; i++) {
      var bx = 50 + (i - 3) * 9, tx = 50 + (i - 3) * 5, ty = 49;
      if (i === act % 7) { var q = M.ease(M.bump(M.seg(f, 0, 0.8))); tx += (50 - tx) * q; ty += (41 - ty) * q; }
      p.line(bx, 61, tx, ty, { w: 0.7, ink: 'stone' }); p.dot(tx, ty, 1.5, 'stone');
    }
    p.path('M8 93 L15 62 L85 62 L92 93 Z', { fill: 'c', w: 1 });
    for (i = 0; i < 11; i++) {
      var row = i < 6 ? 0 : 1, kx = row ? 26 + (i - 6) * 12 : 20 + i * 12, dip = i === (act % 11) ? 2.2 * M.bump(M.seg(f, 0, 0.8)) : 0;
      p.circle(kx, 72 + row * 9 + dip, 4.3, { fill: 'cream', w: 0.8 });
    }
    p.rect(30, 87, 40, 3.4, { fill: 'cream', w: 0.6, r: 1.5 });
    var d1 = M.seg(t, 0.34, 0.4), d2 = M.seg(t, 0.74, 0.8), d3 = s.tap < 0 ? 0 : M.seg(s.tap, 0, 0.5);
    p.path('M82 50 C82 44 94 44 94 50 L96 52 L80 52 Z', { fill: 'a', w: 0.7 });
    [d1, d2, d3].forEach(function (d) { if (d > 0 && d < 1) { p.span('M99 44 C102 47 102 52 99 55', M.easeIn(M.seg(d, 0.4, 1)), M.easeOut(M.seg(d, 0, 0.6)), { w: 0.7 }); p.span('M80 44 C77 47 77 52 80 55', M.easeIn(M.seg(d, 0.4, 1)), M.easeOut(M.seg(d, 0, 0.6)), { w: 0.7 }); } });
  }
});

/* the Tower of Hanoi, three discs: the one rule (a disc goes only on a bigger one) played out move by move, lift,
   slide and drop. A loop is three solutions, 21 moves, taking the tower from the left peg to the right, then to the
   middle, then home. Tap: the moves run through a whole loop in a rush. */
var HAN = (function () {
  var moves = [], st = [[0, 1, 2], [], []], out = [];
  function mv(n, a, b, c) { if (!n) return; mv(n - 1, a, c, b); moves.push([3 - n, a, b]); mv(n - 1, c, b, a); }
  mv(3, 0, 2, 1); mv(3, 2, 1, 0); mv(3, 1, 0, 2);
  moves.forEach(function (m) { out.push({ m: m, st: st.map(function (x) { return x.slice(); }) }); st[m[2]].push(st[m[1]].pop()); });
  return out;
})();
D.add('hanoi', {
  fam: 'curious', tags: ['tower', 'puzzle', 'discs', 'recursion', 'algorithm', 'logic', 'game', 'maths', 'stack', 'pegs'], loop: 14, still: 0.3, tapLen: 2.6, burst: 'star', burstAt: [50, 30], burstN: 6,
  about: 'a tower of three discs is moved peg to peg in the fewest moves, 21 in a loop, ending where it began', tapAbout: 'the moves run through a whole loop in a rush',
  draw: function (p, t, s) {
    var tt = M.frac(t + lap(s, 1)), m = Math.min(20, Math.floor(tt * 21)), f = tt * 21 - m, u = M.seg(f, 0, 0.88), H = HAN[m], PX = [20, 50, 80], W = [30, 22, 14], C = ['b', 'a', 'c'];
    var Y = function (lev) { return 79.8 - 8.4 * lev; };
    p.rect(6, 84, 88, 7, { fill: 'wood', r: 2 });
    PX.forEach(function (x) { p.line(x, 84, x, 30, { w: 1.2 }); });
    var disc = function (x, y, d) { p.rect(x - W[d] / 2, y - 4, W[d], 8, { fill: C[d], r: 3.5, w: 0.9 }); };
    H.st.forEach(function (stack, pi) { stack.forEach(function (d, lev) { if (pi === H.m[1] && lev === stack.length - 1) return; disc(PX[pi], Y(lev), d); }); });
    var fr = H.m[1], to = H.m[2], y0 = Y(H.st[fr].length - 1), y1 = Y(H.st[to].length), x, y;
    if (u < 0.25) { x = PX[fr]; y = y0 + (20 - y0) * M.ease(u / 0.25); }
    else if (u < 0.75) { x = PX[fr] + (PX[to] - PX[fr]) * M.ease((u - 0.25) / 0.5); y = 20; }
    else { x = PX[to]; y = 20 + (y1 - 20) * M.easeIn((u - 0.75) / 0.25); }
    disc(x, y, H.m[0]);
  }
});

/* the golden spiral: squares of side 1, 1, 2, 3, 5, 8, 13 are laid down one after another, each exactly as big as the
   two before it, and a quarter-circle through each (centred on a corner of the square, tangent to the last) draws the
   spiral as the pen goes. It rests, then the tail is taken back square by square. Tap: it draws itself again in a flash. */
var FIBQ = [[0, 0, 1, 1], [0, 1, 1, 2], [-2, 0, 0, 2], [-2, -3, 1, 0], [1, -3, 6, 2], [-2, 2, 6, 10], [-15, -3, -2, 10]];
var FIBA = [[0, 1, 0, 0, 1, 1, 1], [0, 1, 1, 1, 0, 2, 1], [0, 0, 0, 2, -2, 0, 2], [1, 0, -2, 0, 1, -3, 3], [1, 2, 1, -3, 6, 2, 5], [-2, 2, 6, 2, -2, 10, 8], [-2, -3, -2, 10, -15, -3, 13]];
var FIBP = (function () {
  var pts = [], cum = [0], L = 0, S = 7.4, tx = function (q) { return [2.3 + (q[0] + 15) * S, 2 + (q[1] + 3) * S]; };
  FIBA.forEach(function (a) {
    var cx = a[0], cy = a[1], px = a[2], py = a[3], ex = a[4], ey = a[5], r = a[6], a0 = Math.atan2(py - cy, px - cx), a1 = Math.atan2(ey - cy, ex - cx), d = a1 - a0, n = Math.max(8, Math.ceil(r * S * 1.57 / 3));
    while (d > PI) d -= TAU; while (d <= -PI) d += TAU;
    for (var i = (pts.length ? 1 : 0); i <= n; i++) { var an = a0 + d * i / n; pts.push(tx([cx + r * cos(an), cy + r * sin(an)])); }
    L += r * PI / 2; cum.push(L);
  });
  return { d: dp(pts), cum: cum, L: L, tx: tx, pts: pts, S: S };
})();
D.add('fibonacci', {
  fam: 'curious', tags: ['golden ratio', 'spiral', 'nautilus', 'phi', 'sequence', 'maths', 'nature', 'squares', 'pattern', 'divine'], loop: 8, still: 0.6, ratio: 1.6, tapLen: 2.2, burst: 'star', burstAt: [80, 50], burstN: 6,
  about: 'squares 1, 1, 2, 3, 5, 8, 13 are laid down and a quarter-circle through each draws the golden spiral, which is then taken back', tapAbout: 'it draws itself again in a flash',
  draw: function (p, t, s) {
    var tt = M.frac(t + lap(s, 1)), a = 7 * M.seg(tt, 0.04, 0.72), e = 7 * M.seg(tt, 0.8, 0.99), F = FIBP, C = ['yellow', 'orange', 'pink', 'lilac', 'sky', 'mint', 'cream'], i;
    var fr = function (v) { var k = Math.min(6, Math.floor(v)); return (F.cum[k] + (v - k) * (F.cum[k + 1] - F.cum[k])) / F.L; };
    for (i = 0; i < 7; i++) {
      var q = FIBQ[i], sc = M.easeOut(M.seg(a, i - 0.4, i + 0.3)) * (1 - M.ease(M.seg(e, i - 0.1, i + 0.7)));
      if (sc < 0.02) continue;
      var A = F.tx([q[0], q[1]]), B = F.tx([q[2], q[3]]);
      p.pivot((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, 0, sc, function () { p.rect(A[0], A[1], B[0] - A[0], B[1] - A[1], { fill: C[i], w: 0.7 }); });
    }
    if (a > 0.01 && e < 6.98) p.span(F.d, fr(e), fr(a), { w: 1.5, ink: 'b', cap: 'round' });
    if (a > 0.01 && e < 6.9) { var f = fr(a) * (F.pts.length - 1), i0 = Math.min(F.pts.length - 2, Math.floor(f)), qq = f - i0, P0 = F.pts[i0], P1 = F.pts[i0 + 1]; p.dot(P0[0] + (P1[0] - P0[0]) * qq, P0[1] + (P1[1] - P0[1]) * qq, 2.6, 'ink'); }
  }
});

/* epicycles: six turning arms, each carrying a circle, the next arm carried on the rim of the last, and the tip of the
   last draws a heart. The arms run at whole numbers of laps a loop (found by taking the heart apart into circles), so
   the heart closes as the loop does; the trail is taken back behind the pen. Tap: the arms spin a lap more and the
   heart thickens into a pulse. */
var FOU = (function () {
  var N = 128, zs = [], k, n, all = [];
  for (n = 0; n < N; n++) { var th = TAU * n / N; zs.push([16 * Math.pow(sin(th), 3), -(13 * cos(th) - 5 * cos(2 * th) - 2 * cos(3 * th) - cos(4 * th))]); }
  for (k = -6; k <= 6; k++) { var re = 0, im = 0; for (n = 0; n < N; n++) { var a = -TAU * k * n / N, c = cos(a), s = sin(a); re += zs[n][0] * c - zs[n][1] * s; im += zs[n][0] * s + zs[n][1] * c; } all.push({ k: k, re: re / N, im: im / N, r: Math.hypot(re, im) / N }); }
  var c0 = all.filter(function (o) { return o.k === 0; })[0];
  return { c0: c0, arms: all.filter(function (o) { return o.k !== 0; }).sort(function (x, y) { return y.r - x.r; }).slice(0, 6) };
})();
D.add('fourier', {
  fam: 'curious', tags: ['epicycles', 'fourier', 'circles', 'heart', 'drawing', 'harmonic', 'wave', 'maths', 'orbit', 'love'], loop: 8, still: 0.9, tapLen: 2.2, burst: 'heart', burstAt: [50, 40], burstN: 6,
  about: 'six turning arms, each riding on the last one\'s rim, trace a heart with the tip of the last', tapAbout: 'the arms spin a lap more as the heart pulses',
  draw: function (p, t, s) {
    var tt = t + lap(s, 1), K = 2.3, ctr = [50 + K * FOU.c0.re, 53 + K * FOU.c0.im], n = p.small ? 40 : 64, pts = [], i;
    var at = function (tm, upto) { var x = ctr[0], y = ctr[1]; for (var j = 0; j < upto; j++) { var o = FOU.arms[j], a = o.k * TAU * tm, c = cos(a), sn = sin(a); x += K * (o.re * c - o.im * sn); y += K * (o.re * sn + o.im * c); } return [x, y]; };
    for (i = 0; i <= n; i++) pts.push(at(tt - 0.9 * (1 - i / n), 6));
    p.curve(pts, { w: 1.3, ink: 'b' });
    var prev = ctr;
    for (i = 0; i < 6; i++) { var nx = at(tt, i + 1); p.circle(prev[0], prev[1], K * FOU.arms[i].r, { w: 0.4, detail: true, alpha: 0.8 }); p.line(prev[0], prev[1], nx[0], nx[1], { w: 0.7 }); prev = nx; }
    p.dot(prev[0], prev[1], 2.4 + 1.2 * swell(s), 'b');
  }
});

/* the brachistochrone: two balls let go together from the same point to the same point, one down a straight ramp, one
   down a cycloid, the curve of quickest descent. The cycloid ball dives first, then speeds along the bottom, and gets
   there before the straight one (the cycloid's angle runs in step with time; the ramp ball gains distance as time
   squared), and a star marks the winner. Then both are taken back to the start. Tap: the race runs again in a flash. */
D.add('cycloid', {
  fam: 'curious', tags: ['brachistochrone', 'race', 'curve', 'fastest', 'ramp', 'physics', 'gravity', 'maths', 'slide', 'speed'], loop: 6, still: 0.3, tapLen: 2.2, burst: 'star', burstAt: [90, 70], burstN: 5,
  about: 'two balls race from the same point to the same point; the one on the cycloid dives, then wins', tapAbout: 'the race runs again in a flash',
  draw: function (p, t, s) {
    var tt = M.frac(t + lap(s, 1)), r = 34.5, TE = 2.725, tau = tt < 0.8 ? tt - 0.1 : -1, A = [10, 12], B = [90, 78], RB = 5.6, i;
    var cy = function (th) { return [A[0] + r * (th - sin(th)), A[1] + r * (1 - cos(th))]; };
    var pts = []; for (i = 0; i <= 22; i++) pts.push(cy(TE * i / 22));
    p.line(A[0], A[1], B[0], B[1], { w: 1, dash: [4, 3] }); p.curve(pts, { w: 1.3 });
    p.line(B[0] + 3, B[1], B[0] + 3, B[1] - 16, { w: 0.8 }); p.poly([[B[0] + 3, B[1] - 16], [B[0] + 12, B[1] - 12], [B[0] + 3, B[1] - 8]], { fill: 'red', w: 0.6 });
    p.rect(5, 6, 4, 14, { fill: 'grey', w: 0.7 });
    var th = M.clamp(TE * tau / 0.4, 0, TE), cp = cy(th), ct = [r * (1 - cos(th)), r * sin(th)], cl = Math.hypot(ct[0], ct[1]) || 1;
    if (th < 0.02) { ct = [0.01, 1]; cl = 1; }
    var L = Math.hypot(B[0] - A[0], B[1] - A[1]), q = M.clamp(Math.pow(Math.max(0, tau) / 0.4515, 2), 0, 1), lp = [A[0] + (B[0] - A[0]) * q, A[1] + (B[1] - A[1]) * q], ln = [(B[1] - A[1]) / L, -(B[0] - A[0]) / L];
    var sc = tt < 0.72 ? 1 : tt < 0.8 ? 1 - M.ease(M.seg(tt, 0.72, 0.8)) : tt < 0.86 ? 0 : M.easeOut(M.seg(tt, 0.86, 0.94));
    if (sc > 0.02) {
      p.circle(lp[0] + ln[0] * RB, lp[1] + ln[1] * RB, RB * sc, { fill: 'c', w: 0.9 });
      p.circle(cp[0] + ct[1] / cl * RB, cp[1] - ct[0] / cl * RB, RB * sc, { fill: 'b', w: 0.9 });
    }
    var w = M.bump(M.seg(tau, 0.4, 0.55));
    if (w > 0.02) p.at(B[0] - 4, B[1] - 14, 0, w * 1.1, function () { p.path('M0 -7 L1.6 -1.6 L7 0 L1.6 1.6 L0 7 L-1.6 1.6 L-7 0 L-1.6 -1.6 Z', { fill: 'yellow', w: 0.7 }); });
  }
});

/* the Sierpinski triangle, cut out of a solid one: a hole the size of a quarter grows in the middle, then a smaller one in
   each of the three corners left, then in each of those, and so on to the fourth cut, and then they close up again in
   the reverse order. The three-fold symmetry is why a tap can turn it a third of a turn and it looks the same. */
var SIE = (function () {
  var V = [[50, 11], [8, 84], [92, 84]], lv = [[], [], [], []];
  (function rec(a, b, c, L) {
    if (L > 3) return;
    var ab = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], bc = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2], ca = [(c[0] + a[0]) / 2, (c[1] + a[1]) / 2];
    lv[L].push([ab, bc, ca]); rec(a, ab, ca, L + 1); rec(ab, b, bc, L + 1); rec(ca, bc, c, L + 1);
  })(V[0], V[1], V[2], 0);
  return { V: V, lv: lv };
})();
D.add('sierpinski', {
  fam: 'curious', tags: ['fractal', 'triangle', 'maths', 'recursion', 'self-similar', 'triforce', 'pattern', 'holes', 'geometry', 'chaos'], loop: 7, still: 0.65, tapLen: 1.6, burst: 'star', burstAt: [50, 50], burstN: 6,
  about: 'holes grow in a solid triangle, then in each corner left, and each of those, four cuts deep, then close again', tapAbout: 'it turns a third of a turn (it looks the same, as it should) and sparkles',
  draw: function (p, t, s) {
    var V = SIE.V, rot = 0.04 * sin(TAU * t) + (s.tap < 0 ? 0 : TAU / 3 * M.spring(M.seg(s.tap, 0, 0.7))), maxL = p.small ? 2 : 4;
    p.pivot(50, 60, rot, 1, function () {
      p.poly(V, { fill: 'a', w: 1.1 });
      for (var L = 1; L <= maxL; L++) {
        var sc = M.easeOut(M.seg(t, 0.04 + 0.15 * (L - 1), 0.14 + 0.15 * (L - 1))) * (1 - M.ease(M.seg(t, 0.74 + 0.05 * (4 - L), 0.84 + 0.05 * (4 - L))));
        if (sc < 0.02) continue;
        var d = '';
        SIE.lv[L - 1].forEach(function (h) { var cx = (h[0][0] + h[1][0] + h[2][0]) / 3, cy = (h[0][1] + h[1][1] + h[2][1]) / 3; d += 'M' + h.map(function (q) { return (cx + (q[0] - cx) * sc).toFixed(1) + ' ' + (cy + (q[1] - cy) * sc).toFixed(1); }).join('L') + 'Z'; });
        p.path(d, { fill: 'bg', w: L > 2 ? 0.5 : 0.8 });
      }
    });
  }
});

/* a spinning top: striped wedges slide round the cone (only the ones on the near half show, foreshortened at the edges),
   the axis leans and sways round in its slow precession, the disc tipping towards you and away, the tip wandering on the
   floor, and swooshes orbit the rim. Tap: it is spun up, goes upright and steady (a sleeping top), and slowly wakes. */
D.add('top', {
  fam: 'curious', tags: ['spin', 'gyroscope', 'toy', 'precession', 'whirl', 'wobble', 'dreidel', 'balance', 'physics', 'child'], loop: 4, still: 0.1, tapLen: 2.8, burst: 'star', burstAt: [50, 30], burstN: 5, margin: [20, 22, 6, 22],
  about: 'a striped top spins, its axis swaying round in a slow precession while swooshes circle the rim', tapAbout: 'it is spun up, goes upright and steady, then slowly wakes into its wobble again',
  draw: function (p, t, s) {
    var sl = 1 - swell(s), lean = 0.3 * sin(TAU * t) * sl, op = 1 + 0.3 * cos(TAU * t) * sl, tx = 50 + 5 * sin(TAU * t + 1) * sl, ph = TAU * (3 * t + lap(s, 2)), BODY = 'M0 0 L-24 -36 A24 6 0 0 0 24 -36 Z', k;
    p.ellipse(tx, 88, 20, 4, { fill: 'smoke', line: false });
    p.at(tx, 87, lean, 1.2, function () {
      p.path(BODY, { fill: 'b' });
      p.clip(BODY, function () {
        for (k = 0; k < 3; k++) {
          var a1 = M.frac((ph / TAU + k / 3)) * TAU - PI, a2 = a1 + PI / 3, lo = M.clamp(a1, -PI / 2, PI / 2), hi = M.clamp(a2, -PI / 2, PI / 2);
          if (hi - lo < 0.02) continue;
          var q = [[0, 0]]; for (var j = 0; j <= 4; j++) { var a = lo + (hi - lo) * j / 4; q.push([24 * sin(a), -36 + 6 * cos(a)]); }
          p.poly(q, { fill: 'a', line: false });
        }
      });
      p.path(BODY, { w: 1 });
      p.rect(-2.2, -64, 4.4, 26, { fill: 'wood', w: 0.8 }); p.circle(0, -65, 3.2, { fill: 'wood', w: 0.8 });
      p.at(0, -37, 0, [1, 0.25 * op], function () { p.circle(0, 0, 24, { fill: 'gold', w: 1 }); p.circle(0, 0, 11, { fill: 'brown', w: 0.8 }); });
      for (k = 0; k < 2; k++) { var u0 = M.frac(1.5 * t + k * 0.5), e = u0 * 0.9; p.span('M-32 -37 A32 8 0 0 0 32 -37 A32 8 0 0 0 -32 -37', M.easeIn(M.seg(u0, 0.3, 1)) * 0.6, e + 0.1, { w: 0.6, detail: true }); }
    });
  }
});
})(Dingbats);

/* Ornaments & dividers: wide dingbats for the space between sections. */
(function (D) {
'use strict';
var M = D.math, TAU = M.TAU;

/* the two edges of a ribbon of half-width hw laid along a line of points */
function sides(pts, hw) {
  var L = [], R = [];
  pts.forEach(function (q, i) {
    var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    L.push([q[0] - dy / d * hw, q[1] + dx / d * hw]); R.push([q[0] + dy / d * hw, q[1] - dx / d * hw]);
  });
  return [L, R];
}
/* the same ribbon as one closed outline */
function band(pts, hw) { var e = sides(pts, hw); return e[0].concat(e[1].reverse()); }
/* a spiral that starts on the anchor (x, y); its middle lies R away in direction a, and it winds dir (1 or -1) */
function curl(x, y, a, dir, R, turns) {
  var q = [], cx = x + Math.cos(a) * R, cy = y + Math.sin(a) * R;
  for (var i = 0; i <= 36; i++) { var u = i / 36, th = a + Math.PI + dir * u * TAU * (turns || 1.6), r = R * (1 - 0.82 * u); q.push([cx + Math.cos(th) * r, cy + Math.sin(th) * r]); }
  return q;
}
/* the distance from a to b round a ring of length L */
function ring(a, b, L) { return Math.abs(((a - b) % L + 1.5 * L) % L - L / 2); }

/* a vine across the page: the leaves turn in the breeze one after another, left to right, and
   the tendrils curl and let go. Tap: flowers open along it, left to right. */
D.add('vine', {
  fam: 'ornament', tags: ['divider', 'rule', 'section', 'leaf', 'garden', 'border', '❦'], loop: 3.2, ratio: 5, still: 0.15, tapLen: 2.6, burst: 'petal', burstAt: [250, 50], burstN: 9, margin: [24, 10, 24, 10],
  about: 'leaves turn one after another; tendrils curl and let go', tapAbout: 'flowers open along it, left to right',
  draw: function (p, t, s) {
    var y = function (x) { return 50 + 13 * Math.sin(x / 500 * TAU * 2.25 + 0.6); };
    var stem = []; for (var x = 8; x <= 492; x += 12) stem.push([x, y(x)]);
    p.curve(stem, { w: 1.05 });
    for (var i = 0; i < 13; i++) {
      var lx = 26 + i * 37, up = i % 2 ? 1 : -1, ly = y(lx), slope = Math.atan2(y(lx + 1) - ly, 1);
      var flutter = 0.22 * Math.sin(TAU * (t - lx / 500 * 0.8)) * (0.6 + 0.4 * ((i * 7) % 3) / 2);
      p.at(lx, ly, slope + up * (0.85 + flutter), [1, up], function () {
        p.path('M0 0 C4 -8 14 -11 22 -9 C19 -2 10 3 0 0 Z', { fill: i % 3 ? 'leaf' : 'green', w: 0.8 });
        p.path('M1 -0.5 C7 -4 13 -6 18 -7.5', { w: 0.4, detail: true });
      });
    }
    /* tendrils: a curl drawn out, held, taken back */
    [[120, -1, 0.1], [306, 1, 0.55], [430, -1, 0.3]].forEach(function (d) {
      var ph = M.frac(t + d[2]), u = M.easeOut(M.seg(ph, 0, 0.45)) * (1 - M.easeIn(M.seg(ph, 0.7, 1)));
      var tx = d[0], ty = y(tx);
      p.draw('M' + tx + ' ' + ty + ' c' + (6) + ' ' + (d[1] * -10) + ' ' + 16 + ' ' + (d[1] * -12) + ' ' + 16 + ' ' + (d[1] * -4) + ' c0 ' + (d[1] * 5) + ' -7 ' + (d[1] * 6) + ' -7 ' + (d[1] * 1), u, { w: 0.55 });
    });
    if (s.tap >= 0) {
      for (var k = 0; k < 6; k++) {
        var fx = 45 + k * 82, fy = y(fx), open = M.spring(M.seg(s.tap, k * 0.07, k * 0.07 + 0.35)) * (1 - M.easeIn(M.seg(s.tap, 0.82, 1)));
        if (open <= 0.01) continue;
        p.at(fx, fy, k * 0.7, open, function () {
          for (var j = 0; j < 5; j++) p.at(0, 0, j / 5 * TAU, 1, function () { p.path('M0 0 C-5 -5 -4 -13 0 -14 C4 -13 5 -5 0 0 Z', { fill: k % 2 ? 'pink' : 'a', w: 0.6 }); });
          p.circle(0, 0, 3.2, { fill: 'yellow', w: 0.5 });
        });
      }
    }
  }
});

/* a wavy rule with a swell running along it, a thin echo a beat behind. Tap: a drop lands in the
   middle and ripples run out both ways, the right one first. */
D.add('wave-rule', {
  fam: 'ornament', tags: ['divider', 'rule', 'wave', 'water', 'sea', 'line', '〰'], loop: 3.2, ratio: 5, still: 0.3, tapLen: 2, burst: 'drop', burstAt: [250, 38], burstN: 7, burstSpread: 2.2, margin: [34, 10, 22, 10],
  about: 'a swell runs along a wavy rule, a thin echo a beat behind', tapAbout: 'a drop lands in the middle and ripples run out both ways, the right one first',
  draw: function (p, t, s) {
    var tp = s.tap;
    function line(y0, lag, k, w) {
      var pts = [];
      for (var x = 0; x <= 500; x += 5) {
        var A = 4.5 + 12 * Math.exp(-Math.pow(ring(x, 500 * M.frac(t - lag), 500), 2) / 6050), dist = Math.abs(x - 250), dip = 0;
        if (tp >= 0) {
          var fr = 340 * M.easeOut(M.seg(tp - (x < 250 ? 0.04 : 0), 0, 0.85));
          A += 15 * (1 - M.easeIn(M.seg(tp, 0.4, 1))) * Math.exp(-Math.pow((dist - fr) / 42, 2));
          dip = -13 * M.bump(M.seg(tp, 0.04, 0.36)) * Math.exp(-dist * dist / 700);
        }
        pts.push([x, y0 + k * (A * Math.sin(TAU * (x / 50 - t + lag)) + dip)]);
      }
      p.curve(pts, { w: w });
    }
    line(40, 0, 1, 1.15);
    line(66, 0.07, 0.55, 0.6);
    if (tp >= 0 && tp < 0.14) p.at(250, -26 + 62 * M.easeIn(M.seg(tp, 0, 0.14)), 0, 1, function () { p.path('M0 -9 C5 -2 6 3 0 6 C-6 3 -5 -2 0 -9 Z', { fill: 'sky', w: 0.7 }); });
  }
});

/* bare footprints stamped one after another along a dotted path: each hovers, lands with a squash,
   and is flattened a little later, from the start of the walk. Tap: every print pops up in a skipping wave. */
var SOLE = 'M-12 0 C-12 -5.5 -7 -7.5 -3 -6.8 C1 -6 3 -8.5 8 -9 C13.5 -9.5 15 -3.5 15 1 C15 6 11 7.5 7 7 C3 6.5 0 3.5 -3.5 3.8 C-8 4.2 -12 5.5 -12 0 Z';
var TOES = [[18, 2.6, 3.4], [18.6, -1.6, 2.7], [16.8, -5.4, 2.3], [13.8, -8.6, 2.1], [10, -10.2, 1.8]];
D.add('footsteps', {
  fam: 'ornament', tags: ['divider', 'path', 'walk', 'trail', 'steps', 'feet', 'barefoot', '👣'], loop: 4, ratio: 5, still: 0.4, tapLen: 1.7, burst: 'drop', burstAt: [450, 58], burstN: 5, burstSpread: 1.6, margin: [22, 14, 16, 14],
  about: 'footprints hover, land and are flattened in turn along a dotted path', tapAbout: 'every print pops up in a skipping wave, left to right',
  draw: function (p, t, s) {
    var tp = s.tap;
    for (var x = 12.5; x < 500; x += 25) p.circle(x, 50, 2.2, { fill: 'ink', line: false, detail: true });
    for (var k = 0; k < 10; k++) {
      var a = t - (0.08 + 0.055 * k), sx = 0, sy = 0, dy = 0, odd = k % 2;
      if (a >= -0.05 && a < 0) { var h = 1 - M.easeIn(M.seg(a, -0.05, 0)); sx = sy = 1 + 0.3 * h; dy = -12 * h; }
      else if (a >= 0) { var q = M.bump(M.seg(a, 0, 0.06)), f = M.seg(a, 0.3, 0.37); sx = (1 + 0.16 * q) * (1 + 0.2 * f); sy = (1 - 0.14 * q) * (1 - M.easeOut(f)); }
      if (tp >= 0) {
        var m = M.spring(M.seg(tp, 0.04 * k, 0.04 * k + 0.3)) * (1 - M.easeIn(M.seg(tp, 0.7 + 0.02 * k, 0.82 + 0.02 * k)));
        if (m > sy) { sx = sy = m; dy = -12 * M.bump(M.seg(tp, 0.04 * k, 0.04 * k + 0.24)); }
      }
      if (sy < 0.03) continue;
      p.at(50 * k + 26, 50 + (odd ? 10 : -10) + dy, 0, [1.25 * sx, 1.25 * sy * (odd ? -1 : 1)], function () {
        p.path(SOLE, { fill: odd ? 'c' : 'b', w: 0.8 });
        TOES.forEach(function (c) { p.circle(c[0], c[1], c[2], { fill: odd ? 'c' : 'b', w: 0.5, detail: true }); });
      });
    }
  }
});

/* a lace edge: scallops hang from a hem, the depth of the swag runs along as a wave and a pearl at
   the foot of each swings a beat behind it. Tap: the pearls hop up one after another. */
D.add('scallop', {
  fam: 'ornament', tags: ['divider', 'lace', 'edge', 'border', 'trim', 'doily', 'curtain', 'frill'], loop: 3.2, ratio: 5, still: 0.3, tapLen: 1.8, burst: 'spark', burstAt: [250, 66], burstN: 7, margin: [16, 10, 30, 10],
  about: 'the swags of a lace edge rise and fall in a wave, the pearls swinging behind', tapAbout: 'the pearls hop up one after another, left to right',
  draw: function (p, t, s) {
    var tp = s.tap, dep = [], i, j, d = 'M0 20', e = '';
    for (i = 0; i < 10; i++) {
      dep[i] = 31 + 5 * M.wave(t, 1, -i / 10) + (tp >= 0 ? 7 * M.bump(M.seg(tp, i * 0.05, i * 0.05 + 0.4)) : 0);
      var y = 20 + dep[i] * 1.28;
      d += ' C' + (i * 50 + 3) + ' ' + y + ' ' + (i * 50 + 47) + ' ' + y + ' ' + (i * 50 + 50) + ' 20';
      e += (i ? ' M' : 'M') + (i * 50) + ' 20 C' + (i * 50 + 3) + ' ' + y + ' ' + (i * 50 + 47) + ' ' + y + ' ' + (i * 50 + 50) + ' 20';
    }
    p.path(d + ' Z', { fill: 'cream', line: false });
    p.path(e, { w: 1.05 });
    p.line(0, 20, 500, 20, { w: 0.8 });
    for (i = 0; i < 10; i++) {
      var x = i * 50, yi = 27 + dep[i] * 0.62 * 1.28, cy = 20 + dep[i] * 0.52, ay = 20 + dep[i] * 0.96, sw = 2.5 * M.wave(t, 1, -i / 10 - 0.1), hop = tp >= 0 ? 16 * M.bump(M.seg(tp, i * 0.05 + 0.05, i * 0.05 + 0.45)) : 0;
      p.path('M' + (x + 8) + ' 27 C' + (x + 12) + ' ' + yi + ' ' + (x + 38) + ' ' + yi + ' ' + (x + 42) + ' 27', { w: 0.5, detail: true });
      p.circle(x + 25, 24.5, 1.6, { fill: 'bg', w: 0.4, detail: true });
      for (j = 0; j < 6; j++) p.circle(x + 25 + Math.cos(j / 6 * TAU) * 5.6, cy + Math.sin(j / 6 * TAU) * 5.6, 2.3, { fill: 'bg', w: 0.45, detail: true });
      p.circle(x + 25, cy, 2.8, { fill: 'a', w: 0.5 });
      p.circle(x, 24, 2.4, { fill: 'bg', w: 0.5, detail: true });
      p.line(x + 25, ay, x + 25 + sw * 0.6, ay + 4 - hop, { w: 0.45 });
      p.circle(x + 25 + sw, ay + 9 - hop, 5, { fill: 'white', w: 0.8 });
    }
  }
});

/* lai kham, the gold on black of Lanna temple doors: flame leaves ride a vine and spirals turn between
   them, a glint passing from leaf to leaf. Tap: the gold is laid on again, vine first. */
var FLAME = 'M0 0 C-8 -3 -10 -11 -5.5 -17 C-3.5 -20 -4.5 -24 0 -30 C1.5 -25 5.5 -24 6.5 -18.5 C9.5 -11 8 -3 0 0 Z';
D.add('lai-kham', {
  fam: 'ornament', tags: ['lanna', 'gold', 'temple', 'scroll', 'divider', 'border', 'chiang mai', 'ลายคำ'], loop: 4, ratio: 5, still: 0.5, tapLen: 2.2, burst: 'star', burstAt: [250, 50], burstN: 8, margin: [12, 6, 12, 6],
  about: 'flame leaves sway along a gold vine on black, a glint passing from leaf to leaf', tapAbout: 'the gold is laid on again, vine first, leaves and spirals sprouting behind it',
  draw: function (p, t, s) {
    var tp = s.tap, j, stem = [];
    p.rect(2, 5, 496, 90, { fill: 'black', ink: 'black', r: 5, w: 0.8 });
    p.line(12, 9, 488, 9, { ink: 'gold', w: 0.3, detail: true }); p.line(12, 91, 488, 91, { ink: 'gold', w: 0.3, detail: true });
    for (var x = 0; x <= 500; x += 6.25) stem.push([x, 50 - 9 * Math.cos(TAU * (x - 31.25) / 125)]);
    p.draw(stem, tp >= 0 ? M.easeOut(M.seg(tp, 0, 0.6)) : 1, { ink: 'gold', w: 1.1, smooth: true });
    for (j = 0; j < 8; j++) {
      var fx = 31.25 + 62.5 * j, up = j % 2 === 0, born = tp >= 0 ? M.spring(M.seg(tp, fx / 500 * 0.55, fx / 500 * 0.55 + 0.3)) : 1, gl = M.bump(M.seg(M.frac(t - j / 8), 0, 0.14));
      p.at(fx, 50 + (up ? -9 : 9), (up ? 0 : Math.PI) + 0.1 * M.wave(t, 1, -j / 8), 0.98 * born, function () {
        [-0.8, 0.8].forEach(function (a) { p.at(0, 0, a * 1.15, 0.5, function () { p.path(FLAME, { fill: 'gold', ink: 'black', w: 0.7 }); }); });
        p.path(FLAME, { fill: 'gold', ink: 'black', w: 0.6 });
        p.path('M0 -4 C-2 -10 -1.5 -17 0.5 -24', { ink: 'black', w: 0.5, detail: true });
      });
      if (gl > 0.02) p.star(fx + (up ? 1 : -1), 50 + (up ? -39 : 39), 11 * gl, 2.4 * gl, 4, { fill: 'yellow', ink: 'gold', w: 0.4, glow: 1 });
    }
    for (j = 1; j < 8; j++) {
      var nx = 62.5 * j, a1 = j % 2 ? -Math.PI / 3 : -2 * Math.PI / 3, dir = j % 2 ? 1 : -1, u = tp >= 0 ? M.seg(tp, nx / 500 * 0.55, nx / 500 * 0.55 + 0.35) : 1;
      [a1, a1 + Math.PI].forEach(function (a) {
        p.pivot(nx, 50, 0.22 * M.wave(t, 1, -j / 8 - 0.1), 1, function () { p.draw(curl(nx, 50, a, dir, 10), u, { ink: 'gold', w: 0.85 }); });
      });
    }
  }
});

/* two skeins of birds cross the sky in V formation, the wingbeat passing back down each arm from the
   leader, so no two wings agree. Tap: the leader loops the loop, then each pair behind it. */
function bird(p, f, body) {
  var ty = 1 - 11 * f, cy = ty * 0.5 - 5;
  p.path('M0 0 Q-9 ' + cy + ' -20 ' + ty, { w: 1 });
  p.path('M0 0 Q9 ' + cy + ' 20 ' + ty, { w: 1 });
  p.ellipse(0.5, 1.4, 5.2, 2.7, { fill: body, w: 0.6 });
  p.circle(5.3, 0.6, 2, { fill: body, w: 0.5 });
}
D.add('birds', {
  fam: 'ornament', tags: ['divider', 'sky', 'birds', 'flock', 'geese', 'migration', 'fly', 'journey', '🕊'], loop: 8, ratio: 5, still: 0.45, tapLen: 2.6, burst: false, margin: [14, 10, 14, 10],
  about: 'two skeins of birds cross in V formation, the wingbeat passing back from the leader', tapAbout: 'the leader loops the loop, then each pair behind it',
  draw: function (p, t, s) {
    var tp = s.tap;
    [[0.2, 52, 1, 3, 0], [0.7, 24, 0.6, 2, 0.31]].forEach(function (S) {
      var c = -45 + 720 * M.frac(t + S[0]);
      if (c > 640) return;
      for (var m = 0; m <= S[3]; m++) {
        for (var sd = m ? -1 : 0; sd <= (m ? 1 : 0); sd += 2) {
          var f = M.wave(t, 8, -m * 0.16 + S[4] + (sd > 0 ? 0.04 : 0)), x = -m * 25, y = sd * m * 11 + 2.5 * f, rot = 0;
          if (c + S[2] * x < -40 || c + S[2] * x > 540) continue;
          if (tp >= 0) { var th = TAU * M.ease(M.seg(tp, 0.17 * m, 0.17 * m + 0.38)), dr = sd || -1; x += 20 * Math.sin(th); y += dr * 20 * (1 - Math.cos(th)); rot = dr * th; }
          p.at(c, S[1], 0, S[2], function () { p.at(x, y, rot, 1, function () { bird(p, f, m ? 'ink' : 'b'); }); });
        }
      }
    });
  }
});

/* ants carry their finds along a trail, crumbs one way and one with a leaf for a sail, and the empty
   ones hurry back the other, the legs in a tripod gait. Tap: they rear up in a wave and toss their loads. */
var LEAF = 'M0 0 C6 -8 18 -9 28 0 C18 8 6 8 0 0 Z', CRUMB = [[-4, -3], [1, -5], [5, -2], [4, 3], [-1, 4], [-5, 1]];
function ant(p, ph, load, rear, hop, body) {
  var bob = 0.8 * Math.sin(TAU * ph * 2), i, sd;
  for (sd = 0; sd < 2; sd++) for (i = 0; i < 3; i++) {
    var u = TAU * (ph + (i === 1 ? 0.5 : 0) + sd * 0.5), ax = [3, -2, -7][i], fx = ax + [6, 1, -7][i] + 5 * Math.sin(u), fy = -3.4 * Math.max(0, Math.cos(u));
    p.path('M' + ax + ' ' + (-8 + bob) + ' L' + (ax + (i - 1) * -4.5 + (fx - ax) * 0.4) + ' ' + (-5 + fy * 0.5) + ' L' + fx + ' ' + fy, { w: 0.5, ink: sd ? 'grey' : 'ink' });
  }
  p.pivot(-7, 0, -0.5 * rear, 1, function () {
    p.ellipse(-13, -11 + bob, 8.5, 6.5, { fill: body, w: 0.6 });
    p.ellipse(-2, -12 + bob, 5, 4.2, { fill: body, w: 0.6 });
    p.circle(7.5, -11.5 + bob, 4.6, { fill: body, w: 0.6 });
    p.circle(9, -12.6 + bob, 1.1, { fill: 'bg', line: false });
    p.path('M10 -14.5 C13 -20 16 -20 19 -17', { w: 0.5 }); p.path('M10.5 -13 C14 -17 18 -15 20 -12', { w: 0.5 });
    if (load === 1) p.at(16.5, -8 + bob - hop, 0.25 * Math.sin(TAU * ph) + 2 * hop / 16, 1, function () { p.poly(CRUMB, { fill: 'sand', w: 0.7 }); });
    if (load === 2) p.at(10, -13 + bob - hop, -1.9 + 0.08 * Math.sin(TAU * ph * 2), 1, function () { p.path(LEAF, { fill: 'leaf', w: 0.8 }); p.path('M2 0 L25 0', { w: 0.4, detail: true }); });
  });
}
D.add('ants', {
  fam: 'ornament', tags: ['divider', 'trail', 'ants', 'march', 'work', 'carry', 'leaf', 'insect', 'procession', '🐜'], loop: 12, ratio: 5, still: 0.2, tapLen: 1.8, burst: false, margin: [24, 10, 10, 10],
  about: 'ants march along two lanes, loads one way and empty-handed back, legs in a tripod gait', tapAbout: 'they rear up in a wave and toss their loads, then march on',
  draw: function (p, t, s) {
    var tp = s.tap;
    p.line(0, 49, 500, 49, { w: 0.35, dash: [10, 9], detail: true }); p.line(0, 85, 500, 85, { w: 0.35, dash: [10, 9], detail: true });
    for (var k = 0; k < 10; k++) {
      var lane = k < 6 ? 0 : 1, n = lane ? 4 : 6, i = lane ? k - 6 : k, x = -36 + 572 * M.frac(i / n + 0.03 + 0.1 * lane + (lane ? -t : t)), rear = 0, hop = 0;
      if (tp >= 0) { var d = tp - (lane ? 1 - x / 500 : x / 500) * 0.35; rear = M.bump(M.seg(d, 0.05, 0.5)); hop = 16 * M.bump(M.seg(d, 0.1, 0.55)); }
      p.at(x, lane ? 85 : 49, 0, [lane ? -1 : 1, 1], function () { ant(p, 44 * t + k * 0.37, lane ? 0 : [1, 1, 2, 1, 1, 1][i], rear, hop, lane ? 'ink' : 'brown'); });
    }
  }
});

/* a steam train crosses with its smoke hanging behind it, the drivers and their coupling rod turning
   as it rolls. Tap: a blast on the whistle, steam shoots up and the body hops on its springs. */
function wheel(p, x, y, r, a) {
  p.circle(x, y, r, { fill: 'white', w: 0.9 });
  for (var i = 0; i < 3; i++) { var c = Math.cos(a + i * 1.0472) * r * 0.85, d = Math.sin(a + i * 1.0472) * r * 0.85; p.line(x - c, y - d, x + c, y + d, { w: 0.4, detail: true }); }
  p.circle(x, y, r * 0.22, { fill: 'ink', w: 0.4 });
}
D.add('train', {
  fam: 'ornament', tags: ['divider', 'train', 'steam', 'railway', 'travel', 'journey', 'locomotive', 'track', '🚂'], loop: 8, ratio: 6, still: 0.5, tapLen: 2, burst: false, margin: [28, 10, 8, 10],
  about: 'a steam train crosses, smoke hanging behind it, wheels and rod turning', tapAbout: 'a blast on the whistle: steam shoots up and the body hops on its springs',
  draw: function (p, t, s) {
    var G = 86, tp = s.tap, hx = -30 + 916 * M.seg(t, 0, 0.97), j;
    p.line(0, G, 600, G, { w: 0.9 });
    for (j = 0; j < 25; j++) p.line(j * 24 + 6, G + 2, j * 24 + 6, G + 8, { w: 0.5, detail: true });
    for (j = 0; j < 36; j++) {
      var ts = j / 36, a = M.frac(t - ts) / 0.2, sx = -56 + 916 * M.seg(ts, 0, 0.97);
      if (a >= 1 || sx < -10 || sx > 610) continue;
      var e = M.easeOut(a);
      p.blob(sx - 12 * a, 31 - 32 * e, (3 + 9 * e) * (1 - M.easeIn(M.seg(a, 0.6, 1))), { fill: 'smoke', w: 0.8, lumpy: 0.22, seed: j + 3, n: 8 });
    }
    if (hx < -26 || hx > 876) return;
    var vis = function (a, b) { return hx + a < 640 && hx + b > -30; }, hop = tp >= 0 ? -2.5 * M.bump(M.seg(tp, 0, 0.22)) : 0;
    p.at(hx, hop, 0, 1, function () {
      if (vis(-252, -198)) {
        p.rect(-250, 44, 50, 26, { fill: 'a', r: 3, w: 0.9 });
        for (j = 0; j < 3; j++) p.rect(-243 + j * 15, 50, 10, 9, { fill: 'sky', r: 1.5, w: 0.5, detail: true });
      }
      if (vis(-196, -144)) {
        p.rect(-194, 52, 48, 18, { fill: 'b', r: 2, w: 0.9 });
        p.blob(-170, 51, 12, { fill: 'black', sy: 0.5, lumpy: 0.2, seed: 4, w: 0.7 });
      }
      p.rect(-136, 66, 128, 5, { fill: 'grey', w: 0.8 });
      p.rect(-104, 46, 92, 22, { fill: 'c', r: 8, w: 1 });
      p.line(-48, 47, -48, 67, { w: 0.5, detail: true }); p.line(-32, 47, -32, 67, { w: 0.5, detail: true });
      p.rect(-136, 32, 36, 36, { fill: 'b', r: 2, w: 1 });
      p.rect(-140, 27, 44, 6, { fill: 'ink', r: 2, w: 0.8 });
      p.rect(-130, 38, 14, 12, { fill: 'sky', r: 2, w: 0.6, detail: true });
      p.path('M-31 47 L-29.5 36 L-34 29 L-18 29 L-22.5 36 L-21 47 Z', { fill: 'ink', w: 0.8 });
      p.path('M-72 47 C-73 36 -52 36 -52 47 Z', { fill: 'a', w: 0.9 });
      p.rect(-80, 39, 5, 8, { fill: 'a', w: 0.5 });
      p.rect(-17, 38, 7, 9, { fill: 'yellow', r: 2, line: false, glow: 0.7 }); p.rect(-17, 38, 7, 9, { r: 2, w: 0.6 });
      p.poly([[-12, 68], [9, 86], [-12, 86]], { fill: 'grey', w: 0.8 });
      if (tp >= 0) for (j = 0; j < 4; j++) {
        var pe = M.seg(tp, 0.04 + 0.08 * j, 0.5 + 0.08 * j);
        if (pe > 0 && pe < 1) p.blob(-78 + (j % 2 ? 4 : -3) * pe, 38 - 38 * M.easeOut(pe), (4 + 10 * pe) * (1 - M.easeIn(M.seg(pe, 0.6, 1))), { fill: 'white', w: 0.8, lumpy: 0.2, seed: j + 9, n: 8 });
      }
    });
    var ang = hx / 12;
    wheel(p, hx - 92, G - 12, 12, ang); wheel(p, hx - 64, G - 12, 12, ang);
    p.line(hx - 92 + 6 * Math.cos(ang), G - 12 + 6 * Math.sin(ang), hx - 64 + 6 * Math.cos(ang), G - 12 + 6 * Math.sin(ang), { w: 1.1, cap: 'round' });
    wheel(p, hx - 42, G - 7, 7, hx / 7); wheel(p, hx - 24, G - 7, 7, hx / 7);
    if (vis(-196, -144)) { wheel(p, hx - 178, G - 8, 8, hx / 8); wheel(p, hx - 154, G - 8, 8, hx / 8); }
    if (vis(-252, -198)) { wheel(p, hx - 242, G - 8, 8, hx / 8); wheel(p, hx - 208, G - 8, 8, hx / 8); }
  }
});

/* tung, the long paper flags Lanna people hang at temples: a row on a bamboo pole swaying one after
   another, the first leading, the cloth bending more the lower it hangs. Tap: a gust streams them all out. */
D.add('tung', {
  fam: 'ornament', tags: ['lanna', 'flag', 'banner', 'temple', 'festival', 'wind', 'divider', 'chiang mai', 'ตุง'], loop: 3.6, ratio: 5, still: 0.2, tapLen: 2.2, burst: 'confetti', burstAt: [250, 60], burstN: 6, margin: [14, 10, 12, 10],
  about: 'a row of paper flags sways on a pole, the first leading, the cloth bending more toward the foot', tapAbout: 'a gust streams every flag out to the right, then they settle back',
  draw: function (p, t, s) {
    var tp = s.tap;
    p.line(4, 14, 496, 14, { w: 1.1 });
    p.circle(4, 14, 3.2, { fill: 'wood', w: 0.6 }); p.circle(496, 14, 3.2, { fill: 'wood', w: 0.6 });
    for (var i = 0; i < 10; i++) {
      var x = 25 + 50 * i, ph = t - i * 0.05, g = tp >= 0 ? M.spring(M.seg(tp, i * 0.03, i * 0.03 + 0.38)) * (1 - M.easeIn(M.seg(tp, 0.55 + i * 0.02, 1))) : 0, fl = tp >= 0 ? 7 * tp : 0;
      var off = function (y) { var u = (y - 16) / 72; return u * 9 * Math.sin(TAU * ph) + u * u * 4 * Math.sin(TAU * (ph - 0.2)) + g * (u * 36 + 6 * u * Math.sin(TAU * (fl - u))); }, pts = [], y;
      for (y = 16; y <= 86; y += 6) pts.push([x - 8.5 + off(y), y]);
      pts.push([x - 8.5 + off(88), 92], [x + off(84), 82], [x + 8.5 + off(88), 92]);
      for (y = 86; y >= 16; y -= 6) pts.push([x + 8.5 + off(y), y]);
      p.poly(pts, { fill: ['b', 'a', 'c', 'cream'][i % 4], w: 0.9 });
      [26, 31, 68, 73].forEach(function (yy) { p.line(x - 8.5 + off(yy), yy, x + 8.5 + off(yy), yy, { w: 0.45, detail: true }); });
      p.poly([[x + off(52), 44], [x + 5 + off(52), 52], [x + off(52), 60], [x - 5 + off(52), 52]], { fill: 'white', w: 0.5, detail: true });
      p.circle(x, 14, 2.4, { fill: 'bg', w: 0.6 });
    }
  }
});

/* bunting: pennants hang from a sagging string and flutter one after another, the tips a beat behind
   the swing. Tap: each pennant flips over to show its back, in a wave from the left. */
D.add('bunting', {
  fam: 'ornament', tags: ['divider', 'party', 'flags', 'pennants', 'festival', 'celebration', 'banner', 'garland'], loop: 3, ratio: 5, still: 0.2, tapLen: 2, burst: 'confetti', burstAt: [250, 44], burstN: 9, margin: [14, 10, 28, 10],
  about: 'pennants flutter along a sagging string, the tips a beat behind the swing', tapAbout: 'every pennant flips over to show its back, in a wave from the left',
  draw: function (p, t, s) {
    var tp = s.tap, sw = function (x) { var u = M.frac(x / 250); return 20 + 24 * 4 * u * (1 - u); }, str = [], x, i;
    for (x = 0; x <= 500; x += 10) str.push([x, sw(x)]);
    p.curve(str, { w: 0.8 });
    for (x = 0; x <= 500; x += 250) p.circle(x, 20, 3.4, { fill: 'ink', w: 0.4 });
    for (i = 0; i < 12; i++) {
      var px = (i + 0.5) * 500 / 12, sl = Math.atan2(sw(px + 1) - sw(px - 1), 2), swing = 0.13 * M.wave(t, 1, -i / 12), tip = 5 * M.wave(t, 1, -i / 12 - 0.1);
      var fc = tp >= 0 ? Math.cos(TAU * M.ease(M.seg(tp, i * 0.045, i * 0.045 + 0.45))) : 1, back = fc < 0;
      p.at(px, sw(px), sl + swing, [Math.abs(fc) < 0.05 ? 0.05 : fc, 1], function () {
        p.poly([[-12, -1], [12, -1], [tip, 34]], { fill: back ? 'cream' : ['a', 'b', 'c', 'pink'][i % 4], w: 0.9 });
        p.line(-6, 7, 6, 7, { w: 0.4, detail: true }); p.circle(tip * 0.4, 14, 2.4, { fill: 'white', w: 0.4, detail: true });
      });
    }
  }
});

/* string lights swagged across: a bulb lights, then the next, each with a ring of rays, the glow
   running along the string. Tap: every bulb flashes at once, a hair apart from left to right. */
D.add('string-lights', {
  fam: 'ornament', tags: ['divider', 'lights', 'fairy lights', 'party', 'night', 'festival', 'bulbs', 'christmas', 'glow'], loop: 3.6, ratio: 5, still: 0.15, tapLen: 1.6, burst: 'spark star', burstAt: [250, 50], burstN: 8, margin: [10, 10, 24, 10],
  about: 'bulbs light one after another along the swags, each with a ring of rays', tapAbout: 'every bulb flashes at once, a hair apart from the left',
  draw: function (p, t, s) {
    var tp = s.tap, sw = function (x) { var u = M.frac(x / 125); return 22 + 20 * 4 * u * (1 - u); }, str = [], x, i;
    for (x = 0; x <= 500; x += 6.25) str.push([x, sw(x)]);
    p.curve(str, { w: 0.75 });
    for (i = 0; i < 12; i++) {
      var bx = 125 * (Math.floor(i / 3) + [0.2, 0.5, 0.8][i % 3]), sl = Math.atan2(sw(bx + 1) - sw(bx - 1), 2), L = M.bump(M.seg(M.frac(t - i / 12), 0, 0.28));
      if (tp >= 0) L = Math.max(L, M.bump(M.seg(tp, i * 0.012, i * 0.012 + 0.6)));
      var col = ['yellow', 'b', 'c', 'a'][i % 4];
      p.at(bx, sw(bx), sl * 0.4 + 0.07 * M.wave(t, 1, -i / 12), 1, function () {
        p.rect(-2.6, 0, 5.2, 7, { fill: 'grey', w: 0.5 });
        p.at(0, 16, 0, 1 + 0.12 * L, function () {
          if (L > 0.12) p.path('M-2.6 -9 C-9 -4 -10 7 0 9 C10 7 9 -4 2.6 -9 Z', { fill: col, line: false, glow: L });
          p.path('M-2.6 -9 C-9 -4 -10 7 0 9 C10 7 9 -4 2.6 -9 Z', { fill: L > 0.12 ? null : 'white', w: 0.85 });
          p.path('M-5 -3 C-6 0 -5.5 2 -4 3.5', { ink: L > 0.12 ? 'white' : 'ink', w: 0.5, detail: true });
        });
        if (L > 0.15) {
          p.circle(0, 16, 12 + 7 * L, { ink: col, w: 0.45, detail: true });
          for (var r = 0; r < 8; r++) { var c = Math.cos(r * 0.7854 + 0.4), d = Math.sin(r * 0.7854 + 0.4); p.line(c * (15 + 2 * L), 16 + d * (15 + 2 * L), c * (15 + 9 * L), 16 + d * (15 + 9 * L), { ink: col, w: 0.6, cap: 'round', detail: true }); }
        }
      });
    }
  }
});

/* rickrack braid: two zigzag strands cross and recross, the weave swapping which lies on top, and
   the whole braid squeezing and stretching in a wave, the second strand a beat behind the first.
   Tap: the weave flips over crossing by crossing, left to right. */
function tri(th) { return (Math.sin(th) - Math.sin(3 * th) / 9) / 1.1111; }
D.add('ricrac', {
  fam: 'ornament', tags: ['divider', 'braid', 'zigzag', 'trim', 'ribbon', 'sewing', 'rickrack', 'edge'], loop: 3.2, ratio: 5, still: 0.3, tapLen: 1.8, burst: 'confetti', burstAt: [250, 50], burstN: 7, margin: [10, 10, 10, 10],
  about: 'two zigzag strands weave over and under, squeezing and stretching in a wave', tapAbout: 'the weave flips crossing by crossing, left to right',
  draw: function (p, t, s) {
    var P = 50, tp = s.tap, hw = p.small ? 3.4 : 5.2, j;
    function strand(off, lag) {
      var q = [];
      for (var x = 0; x <= 500; x += 5) q.push([x, 50 - (22 + 3 * Math.sin(TAU * (x / 250 - t + lag)) + (tp >= 0 ? 9 * M.bump(M.seg(tp, x / 500 * 0.5, x / 500 * 0.5 + 0.4)) : 0)) * tri(Math.PI * x / P + Math.PI / 2 + off)]);
      return q;
    }
    var A = strand(0, 0), B = strand(Math.PI, 0.06);
    p.poly(band(A, hw), { fill: 'b', w: 0.9 }); p.poly(band(B, hw), { fill: 'c', w: 0.9 });
    for (j = 0; j < 10; j++) {
      var xc = (j + 0.5) * P, top = j % 2;
      if (tp >= 0 && tp > 0.03 * j && tp < 0.03 * j + 0.5) top = 1 - top;
      var src = top ? B : A, sub = src.filter(function (q) { return q[0] >= xc - 11 && q[0] <= xc + 11; }), e = sides(sub, hw);
      p.poly(band(sub, hw), { fill: top ? 'c' : 'b', line: false });
      p.path(e, { w: 0.9 });
    }
  }
});

/* a symmetrical centrepiece with a scroll growing out of it each way: the vine is drawn out, curls
   at its end, holds, and is taken back, the right arm a hair ahead of the left. Tap: the flower turns
   round on its stem and the leaves bob. */
function bez(a, b, c, d, n) { var q = []; for (var i = 0; i <= n; i++) { var u = i / n, v = 1 - u; q.push([v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0], v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1]]); } return q; }
var ARMS = [
  bez([14, 0], [28, 0], [40, 6], [58, 6], 10).concat(curl(58, 6, -Math.PI / 2, -1, 19, 1.7)),
  bez([58, 6], [90, 6], [130, -8], [172, -2], 16).concat(curl(172, -2, Math.PI / 2, 1, 14, 1.7))
];
D.add('fleuron', {
  fam: 'ornament', tags: ['divider', 'ornament', 'flourish', 'fleuron', 'scroll', 'centrepiece', 'section', '❦', '❧'], loop: 4.8, ratio: 4, still: 0.55, tapLen: 1.6, burst: 'petal', burstAt: [200, 40], burstN: 8, margin: [14, 8, 14, 8],
  about: 'a scroll is drawn out each way from a flower, curls at its end and is taken back, the right arm leading', tapAbout: 'the flower turns round on its stem and the leaves bob',
  draw: function (p, t, s) {
    var tp = s.tap;
    [1, -1].forEach(function (sg) {
      var ph = t - (sg > 0 ? 0 : 0.03), head = M.easeOut(M.seg(ph, 0.03, 0.4)), tail = M.easeIn(M.seg(ph, 0.74, 0.97));
      ARMS.forEach(function (arm, k) {
        var d = arm.map(function (q) { return [200 + sg * q[0], 52 + q[1]]; });
        p.span(d, tail, head, { w: 1.1 });
        [0.2, 0.42, 0.66].forEach(function (u, n) {
          if (k && n === 0) return;
          var lo = (k ? 0.12 : 0.1) + u * 0.5, grow = M.spring(M.seg(head, lo, lo + 0.14)) * (1 - M.easeIn(M.seg(tail, lo - 0.1, lo + 0.1)));
          var q = d[Math.round(u * (d.length - 1) * 0.7)], q2 = d[Math.round(u * (d.length - 1) * 0.7) + 1], bob = tp >= 0 ? 0.5 * M.bump(M.seg(tp, 0.1 + n * 0.1, 0.6 + n * 0.1)) : 0;
          if (grow > 0.02) p.at(q[0], q[1], Math.atan2(q2[1] - q[1], q2[0] - q[0]) + (n % 2 ? 1 : -1) * (0.9 + bob), grow, function () { p.path('M0 0 C3 -6 11 -7 16 -4 C12 1 5 3 0 0 Z', { fill: 'leaf', w: 0.7 }); });
        });
      });
    });
    var spin = tp >= 0 ? Math.cos(Math.PI * M.spring(M.seg(tp, 0, 0.7))) : 1, br = 1 + 0.04 * M.wave(t, 1);
    p.at(200, 52, 0, [Math.abs(spin) < 0.06 ? 0.06 : spin, br], function () {
      [-1, 1].forEach(function (sg) {
        p.path('M0 14 C' + (sg * 18) + ' 8 ' + (sg * 29) + ' -4 ' + (sg * 26) + ' -17 C' + (sg * 16) + ' -13 ' + (sg * 6) + ' -2 0 14 Z', { fill: 'c', w: 0.9 });
        p.path('M0 15 C' + (sg * 14) + ' 20 ' + (sg * 26) + ' 17 ' + (sg * 30) + ' 7 C' + (sg * 20) + ' 8 ' + (sg * 8) + ' 8 0 15 Z', { fill: 'a', w: 0.9 });
      });
      p.path('M0 14 C-12 4 -10 -18 0 -31 C10 -18 12 4 0 14 Z', { fill: 'b', w: 1 });
      p.path('M0 10 C-2 0 -2 -12 0 -23', { w: 0.4, detail: true });
      p.poly([[-9, 22], [0, 16], [9, 22], [0, 30]], { fill: 'leaf', w: 0.8 });
    });
  }
});

/* a row of stars that twinkle in order along it: each swells, tilts and throws out a glint. Tap: a comet
   crosses above and lights each star as it passes. */
var STAR_AT = [[34, 52, 16], [105, 46, 24], [177, 55, 14], [250, 50, 29], [323, 54, 15], [395, 46, 22], [466, 52, 17]];
D.add('stars-row', {
  fam: 'ornament', tags: ['divider', 'stars', 'night', 'twinkle', 'sky', 'sparkle', 'row', 'evening', '★'], loop: 3.5, ratio: 5, still: 0.1, tapLen: 1.8, burst: 'star', burstAt: [250, 30], burstN: 6, margin: [26, 14, 14, 14],
  about: 'stars twinkle in order along a row, each swelling and throwing out a glint', tapAbout: 'a comet crosses above and lights each star as it passes',
  draw: function (p, t, s) {
    var tp = s.tap, cx = -30 + 560 * M.ease(M.seg(tp, 0, 0.85));
    if (tp >= 0 && tp < 0.85) {
      p.path('M' + (cx - 130) + ' ' + (10 + 0.04 * (cx - 130)) + ' L' + cx + ' ' + (10 + 0.04 * cx), { w: 1.1 });
      p.star(cx, 10 + 0.04 * cx, 9, 4, 5, { fill: 'yellow', w: 0.8, rot: 0.3 });
    }
    STAR_AT.forEach(function (S, i) {
      var ph = M.frac(t - 0.05 - i / 7), tw = M.bump(M.seg(ph, 0, 0.3));
      if (tp >= 0) tw = Math.max(tw, M.bump(M.seg(tp - (S[0] + 30) / 560 * 0.85 + 0.05, 0, 0.35)));
      var r = S[2] * (1 + 0.4 * tw), rot = (i % 2 ? 1 : -1) * 0.5 * tw;
      var pt = i % 2 ? [r * 1.25, r * 0.3, 4] : [r, r * 0.45, 5], fc = i % 2 ? 'a' : 'yellow';
      if (tw > 0.1) p.star(S[0], S[1], pt[0], pt[1], pt[2], { fill: fc, line: false, glow: tw, rot: -Math.PI / 2 + rot });
      p.star(S[0], S[1], pt[0], pt[1], pt[2], { fill: tw > 0.1 ? null : fc, w: 0.9, rot: -Math.PI / 2 + rot });
      if (tw > 0.2) { var g = r * (0.5 + 1.1 * tw); p.line(S[0] - g, S[1], S[0] + g, S[1], { w: 0.5, detail: true }); p.line(S[0], S[1] - g, S[0], S[1] + g, { w: 0.5, detail: true }); }
    });
  }
});

/* a river with a salmon leaping out of it and back in, rings spreading where it leaves and lands, the
   surface lines sliding along and a reed at each bank. Tap: two fish cross in the air. */
var FISH = 'M-17 0 C-11 -8 7 -8 17 0 C7 8 -11 8 -17 0 Z';
function fish(p, x0, x1, h, u, c) {
  var x = x0 + (x1 - x0) * u, y = 62 - h * 4 * u * (1 - u), dir = x1 > x0 ? 1 : -1;
  p.at(x, y, Math.atan2(-h * 4 * (1 - 2 * u), x1 - x0), [1.3, 1.3 * dir], function () {
    p.path('M-15 0 L-27 -9 C-24 -3 -24 3 -27 9 Z', { fill: c, w: 0.8 });
    p.path('M-3 -7 L1 -14 L8 -6.5 Z', { fill: c, w: 0.8 });
    p.path(FISH, { fill: c, w: 0.9 });
    p.path('M-12 3 C-4 7 7 6 14 1', { w: 0.4, detail: true }); p.path('M6 -4 C8 -1 8 2 6 4', { w: 0.45, detail: true });
    p.circle(10, -1.8, 1.5, { fill: 'ink', line: false });
  });
}
function ripple(p, x, a) {
  if (a <= 0 || a >= 1) return;
  var r = 4 + 26 * M.easeOut(a), ry = r * 0.28;
  p.span('M' + (x - r) + ' 62 A' + r + ' ' + ry + ' 0 1 1 ' + (x + r) + ' 62 A' + r + ' ' + ry + ' 0 1 1 ' + (x - r) + ' 62', M.easeIn(M.seg(a, 0.45, 1)), M.easeOut(M.seg(a, 0, 0.5)), { w: 0.6 });
}
D.add('river', {
  fam: 'ornament', tags: ['divider', 'river', 'water', 'fish', 'stream', 'nature', 'flow', 'salmon'], loop: 5, ratio: 6, still: 0.3, tapLen: 2, burst: 'drop', burstAt: [300, 56], burstN: 7, burstSpread: 2.4, margin: [14, 10, 10, 10],
  about: 'a fish leaps out and back in, rings spreading, the surface lines sliding and the reeds swaying', tapAbout: 'two fish leap and cross in the air',
  draw: function (p, t, s) {
    var tp = s.tap, u = M.seg(t, 0.12, 0.52), i, pts = [], x;
    [[28, 52, 0], [14, 40, 0.3], [586, 52, 0.15], [572, 40, 0.45]].forEach(function (R) {
      p.at(R[0], 94, 0.07 * M.wave(t, 1, R[2]), 1, function () {
        p.line(0, 0, 0, -R[1], { w: 0.8 }); p.ellipse(0, -R[1] + 8, 3.2, 8, { fill: 'brown', w: 0.7 });
        p.path('M0 -4 C9 -14 11 -28 7 -38', { w: 0.6 });
      });
    });
    if (u > 0 && u < 1) fish(p, 170, 410, 50, u, 'b');
    if (tp >= 0) { var a = M.seg(tp, 0.04, 0.6), b = M.seg(tp, 0.12, 0.68); if (a > 0 && a < 1) fish(p, 190, 400, 46, a, 'b'); if (b > 0 && b < 1) fish(p, 420, 180, 36, b, 'a'); }
    for (x = 0; x <= 600; x += 6) pts.push([x, 62 + 2.6 * Math.sin(TAU * (x / 60 - t))]);
    p.poly(pts.concat([[600, 98], [0, 98]]), { fill: 'sky', line: false });
    p.curve(pts, { w: 1 });
    for (i = 1; i < 3; i++) {
      var q = []; for (x = 0; x <= 600; x += 8) q.push([x, 62 + 12 * i + 2.6 * Math.sin(TAU * (x / 60 - t + 0.3 * i))]);
      p.curve(q, { w: 0.65 - 0.2 * i, detail: i > 1 });
    }
    ripple(p, 170, (t - 0.12) / 0.3); ripple(p, 410, (t - 0.52) / 0.3);
    if (tp >= 0) { ripple(p, 190, (tp - 0.04) / 0.4); ripple(p, 400, (tp - 0.6) / 0.4); ripple(p, 420, (tp - 0.12) / 0.4); ripple(p, 180, (tp - 0.68) / 0.4); }
  }
});

/* a fence of boards and a ginger cat walking along the top, tail up and swaying a beat behind her, the
   legs in a diagonal gait. Tap: the boards hop up in a wave and the cat arches her back and puffs her tail. */
function cat(p, ph, tail, arch) {
  var bob = 0.8 * Math.sin(TAU * ph * 2), i, sd;
  for (sd = 0; sd < 2; sd++) for (i = 0; i < 2; i++) {
    var u = TAU * (ph + (sd === i ? 0.5 : 0)), ax = i ? -15 : 14, px = ax + 8 * Math.sin(u), py = -4 * Math.max(0, Math.cos(u));
    p.poly(band([[ax, -13 + bob], [ax + (i ? 4 : -3) + (px - ax) * 0.3, -6 + py * 0.3], [px, py]], 2.5), { fill: sd ? 'orange' : 'brown', w: 0.7 });
  }
  p.poly(band(bez([-20, -21 + bob], [-34 + 6 * tail, -24], [-30 + 8 * tail, -40], [-27 + 10 * tail, -52 + 4 * arch], 8), 2.3 + 3.2 * arch), { fill: 'orange', w: 0.8 });
  p.ellipse(0, -19 + bob - 4 * arch, 21, 9 + 5 * arch, { fill: 'orange', w: 0.9 });
  p.path('M-9 -27 L-6 -19 M-1 -28 L1 -20 M7 -27 L8 -20', { w: 0.5, detail: true });
  p.circle(25, -27 + bob - 2 * arch, 8, { fill: 'orange', w: 0.9 });
  p.poly([[19, -32 + bob], [20 - 3 * arch, -42 + bob + 3 * arch], [26, -34 + bob]], { fill: 'orange', w: 0.7 });
  p.poly([[26, -34 + bob], [30 - 3 * arch, -42 + bob + 3 * arch], [32, -30 + bob]], { fill: 'orange', w: 0.7 });
  p.circle(28, -28 + bob - 2 * arch, 1.3, { fill: 'ink', line: false }); p.circle(32, -26 + bob - 2 * arch, 1.1, { fill: 'pink', line: false });
  p.line(32, -25 + bob, 40, -27 + bob, { w: 0.35, detail: true }); p.line(32, -24 + bob, 40, -22 + bob, { w: 0.35, detail: true });
}
D.add('fence', {
  fam: 'ornament', tags: ['divider', 'fence', 'cat', 'garden', 'wall', 'walk', 'rail', 'pet', '🐈'], loop: 10, ratio: 5, still: 0.35, tapLen: 1.6, burst: false, margin: [16, 10, 8, 10],
  about: 'a ginger cat walks along the top of a fence, tail swaying a beat behind her', tapAbout: 'the boards hop up in a wave and the cat arches her back and puffs her tail',
  draw: function (p, t, s) {
    var tp = s.tap, i, x, cx = -60 + 620 * M.frac(t + 0.15), arch = tp >= 0 ? M.bump(M.seg(tp, 0, 0.8)) : 0;
    for (i = 0; i < 12; i++) {
      x = (i + 0.5) * 500 / 12; var hop = tp >= 0 ? 7 * M.bump(M.seg(tp, i * 0.04, i * 0.04 + 0.3)) : 0;
      p.poly([[x - 17, 92], [x - 17, 56 - hop], [x - 13, 50 - hop], [x + 13, 50 - hop], [x + 17, 56 - hop], [x + 17, 92]], { fill: 'wood', w: 0.9 });
      p.line(x - 6, 60 - hop, x - 6, 84, { w: 0.35, detail: true }); p.line(x + 7, 64 - hop, x + 7, 88, { w: 0.35, detail: true });
    }
    p.rect(0, 68, 500, 7, { fill: 'wood', w: 0.9 });
    for (i = 0; i < 12; i++) p.circle((i + 0.5) * 500 / 12, 71.5, 1.3, { fill: 'ink', line: false, detail: true });
    if (cx > -54 && cx < 552) p.at(cx, 50, 0, 1, function () { cat(p, 30 * t, M.wave(t, 2, 0.1), arch); });
  }
});

/* three dots that hop in turn, the way a chat shows someone typing: each lifts, stretches, lands and
   squashes with its shadow, the next already going. Tap: all three jump high in a wave. */
D.add('ellipsis', {
  fam: 'ornament', tags: ['divider', 'dots', 'typing', 'wait', 'loading', 'more', 'chat', 'ellipsis', '…'], loop: 1.6, ratio: 2.5, still: 0.1, tapLen: 1.3, burst: 'confetti', burstAt: [125, 40], burstN: 7, margin: [26, 10, 8, 10],
  about: 'three dots hop in turn, stretching in the air and squashing as they land', tapAbout: 'all three jump high in a wave, landing with a spring',
  draw: function (p, t, s) {
    var tp = s.tap;
    [50, 125, 200].forEach(function (x, i) {
      var ph = M.frac(t - 0.16 * i), u = M.seg(ph, 0, 0.45), h = 32 * 4 * u * (1 - u), q = M.bump(M.seg(ph, 0.45, 0.62)), st = 0;
      if (tp >= 0) { var a = M.seg(tp, i * 0.1, i * 0.1 + 0.6); h = 56 * 4 * a * (1 - a) + 4 * M.bump(M.seg(tp, i * 0.1 + 0.6, i * 0.1 + 0.9)); q = M.bump(M.seg(tp, i * 0.1 + 0.6, i * 0.1 + 0.8)) * 1.3; }
      st = Math.min(0.2, h / 160);
      p.ellipse(x, 92, 15 - 7 * h / 56, 3.2, { fill: 'smoke', line: false });
      p.at(x, 90 - h, 0, [1 - st * 0.5 + 0.22 * q, 1 + st - 0.3 * q], function () { p.circle(0, -15, 15, { fill: ['a', 'b', 'c'][i], w: 1.1 }); p.arc(-5, -20, 7, 3.6, 4.7, { w: 0.5, ink: 'white', detail: true }); });
    });
  }
});

/* an underline drawn by a pencil, then rubbed out by its eraser from the start: the line is made, held,
   and taken back. Tap: a second, busier line scribbles in from the right under it. */
function along(q, u) {
  var tot = 0, L = 0, i, d;
  for (i = 1; i < q.length; i++) tot += Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]);
  u *= tot;
  for (i = 1; i < q.length; i++) { d = Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]); if (L + d >= u) return [q[i - 1][0] + (q[i][0] - q[i - 1][0]) * (u - L) / (d || 1), q[i - 1][1] + (q[i][1] - q[i - 1][1]) * (u - L) / (d || 1)]; L += d; }
  return q[q.length - 1];
}
function pencil(p) {
  p.poly([[0, 0], [10, -3.4], [10, 3.4]], { fill: 'sand', w: 0.7 });
  p.poly([[0, 0], [3.4, -1.3], [3.4, 1.3]], { fill: 'ink', w: 0.4 });
  p.rect(10, -3.4, 30, 6.8, { fill: 'yellow', w: 0.8 });
  p.line(10, 0, 40, 0, { w: 0.35, detail: true });
  p.rect(40, -3.4, 6, 6.8, { fill: 'grey', w: 0.7 });
  p.rect(46, -3.4, 8, 6.8, { fill: 'pink', r: 2, w: 0.8 });
}
D.add('squiggle', {
  fam: 'ornament', tags: ['divider', 'underline', 'squiggle', 'pencil', 'draw', 'wavy', 'highlight', 'emphasis', 'eraser'], loop: 4, ratio: 5, still: 0.52, tapLen: 1.8, burst: false, margin: [12, 14, 10, 10],
  about: 'a pencil draws a wavy underline, then its eraser rubs it out from the start', tapAbout: 'a second, busier line scribbles in from the right under it',
  draw: function (p, t, s) {
    var tp = s.tap, pts = [], x, k;
    for (x = 0; x <= 500; x += 4) pts.push([x, 52 + 7 * Math.sin(TAU * 13 * x / 500)]);
    var head = M.ease(M.seg(t, 0.04, 0.42)), tail = M.ease(M.seg(t, 0.6, 0.95));
    p.span(pts, tail, head, { w: 1.1 });
    var pf = M.seg(t, 0.02, 0.06) * (1 - M.easeIn(M.seg(t, 0.42, 0.5))), lift = M.ease(M.seg(t, 0.42, 0.5));
    if (pf > 0.03) { var e = along(pts, head); p.at(e[0] + 30 * lift, e[1] - 34 * lift, -0.95 + 0.05 * Math.sin(TAU * 14 * t), pf, function () { pencil(p); }); }
    var er = M.seg(t, 0.56, 0.6) * (1 - M.seg(t, 0.94, 0.98));
    if (er > 0.03) {
      var g = along(pts, tail);
      p.at(g[0] + 1.5 * Math.sin(TAU * 30 * t), g[1], Math.PI - 0.95, er, function () { p.move(-54, 0); pencil(p); });
      for (k = 0; k < 3; k++) { var cp = M.frac(t * 6 + k / 3); p.circle(g[0] - 6 - 14 * cp, g[1] + 4 + 16 * cp * cp, 1.5 * (1 - cp), { fill: 'pink', line: false, detail: true }); }
    }
    if (tp >= 0) {
      var q = []; for (x = 500; x >= 0; x -= 4) q.push([x, 78 + 5 * Math.sin(TAU * 18 * x / 500)]);
      p.span(q, M.ease(M.seg(tp, 0.6, 0.95)), M.ease(M.seg(tp, 0.05, 0.5)), { w: 0.9 });
    }
  }
});

/* a corner flourish for the top left of a box (flip or turn it for the others): a double rule meets
   in a fan of petals, a scroll runs out along each edge, and a glint runs out along the rules. Tap:
   the fan spreads wide and springs back while the scrolls twirl round once. */
var PETAL = 'M0 0 C9 -6 24 -6 36 0 C24 6 9 6 0 0 Z';
var SCROLLS = [
  [bez([58, 27], [68, 18], [78, 35], [90, 27], 10), 90, 27, 1.05, 1, 7],
  [bez([27, 58], [18, 68], [35, 78], [27, 90], 10), 27, 90, 0.52, -1, 7]
];
D.add('corner', {
  fam: 'ornament', tags: ['border', 'corner', 'frame', 'flourish', 'ornament', 'box', 'divider', 'vintage'], loop: 3.6, ratio: 1, still: 0.4, tapLen: 1.6, burst: 'petal', burstAt: [24, 24], burstN: 6, burstSpread: 2, margin: [10, 10, 10, 10],
  about: 'a fan of petals breathes in the corner of a box while a glint runs out along the rules', tapAbout: 'the fan spreads wide and springs back while the scrolls twirl round once',
  draw: function (p, t, s) {
    var tp = s.tap;
    p.path('M100 10 L10 10 L10 100', { w: 1.1, cap: 'round' }); p.path('M100 18 L52 18 M18 100 L18 52', { w: 0.5, cap: 'round' });
    SCROLLS.forEach(function (C, n) {
      var twirl = tp >= 0 ? TAU * M.easeOut(M.seg(tp, n * 0.1, n * 0.1 + 0.7)) : 0, d = C[0];
      p.curve(d, { w: 0.95 });
      p.pivot(C[1], C[2], 0.2 * M.wave(t, 1, -n / 4) + twirl, 1, function () { p.curve(curl(C[1], C[2], C[3], C[4], C[5]), { w: 0.95 }); });
      var q = d[5], q2 = d[6], pop = tp >= 0 ? M.spring(M.seg(tp, 0.1 + 0.1 * n, 0.5 + 0.1 * n)) : 1;
      p.at(q[0], q[1], Math.atan2(q2[1] - q[1], q2[0] - q[0]) + (n ? 0.8 : -0.8) + 0.14 * M.wave(t, 1, -n / 4), pop, function () { p.path('M0 0 C3 -6 11 -7 16 -4 C12 1 5 3 0 0 Z', { fill: 'leaf', w: 0.7 }); });
    });
    var open = tp >= 0 ? 0.22 * M.bump(M.seg(tp, 0, 0.8)) : 0;
    [0, 1, 2, 3, 4].forEach(function (i) {
      var len = [30, 38, 46, 38, 30][i] * (1 + 0.06 * M.wave(t, 1, -i / 10)), ang = 0.15 + i * 0.3 + (i - 2) * open;
      p.at(10, 10, ang, len / 36, function () { p.path(PETAL, { fill: ['c', 'b', 'a', 'b', 'c'][i], w: 1 }); });
    });
    p.circle(10, 10, 6, { fill: 'white', w: 0.9 });
    var h2 = 1.15 * M.seg(t, 0.02, 0.6), hd = Math.min(1, h2), tl = Math.max(0, h2 - 0.15);
    p.span('M10 10 L100 10', tl, hd, { w: 1.3, ink: 'a', cap: 'round' }); p.span('M10 10 L10 100', tl, hd, { w: 1.3, ink: 'a', cap: 'round' });
  }
});

/* a needle sews a running stitch along a hem: the thread shows as a hump where it rides over the cloth
   and vanishes where it goes through, and when the seam is done the needle backs out, unpicking.
   Tap: the thread is drawn tight, the stitches flattening and springing back one after another. */
function needle(p) {
  p.path('M0 0 L34 -2.4 C39 -2.4 44 -1.4 44 0 C44 1.4 39 2.4 34 2.4 Z', { fill: 'grey', w: 0.7 });
  p.ellipse(38, 0, 3, 0.9, { fill: 'bg', w: 0.4, detail: true });
}
D.add('stitches', {
  fam: 'ornament', tags: ['divider', 'sewing', 'stitch', 'thread', 'needle', 'seam', 'hem', 'craft', 'mend'], loop: 5, ratio: 5, still: 0.52, tapLen: 1.6, burst: 'spark', burstAt: [250, 40], burstN: 6, margin: [22, 14, 14, 14],
  about: 'a needle sews a running stitch along a hem, then backs out unpicking it', tapAbout: 'the thread is drawn tight, the stitches flattening and springing back in turn',
  draw: function (p, t, s) {
    var tp = s.tap, x, pts = [];
    var Y = function (x) { return 50 - 12 * (1 - 0.75 * (tp >= 0 ? M.bump(M.seg(tp, x / 500 * 0.5, x / 500 * 0.5 + 0.4)) : 0)) * Math.sin(TAU * x / 50); };
    for (x = 0; x <= 500; x += 4) pts.push([x, Y(x)]);
    var right = t < 0.5, sh = (right ? -0.14 + 1.29 * M.ease(M.seg(t, 0.03, 0.45)) : 1.15 - 1.29 * M.ease(M.seg(t, 0.55, 0.97))) * 500;
    p.draw(pts, Math.max(0, Math.min(1, (sh - 36) / 500)), { w: 1.2, ink: 'b' });
    if (right ? sh > -18 && sh < 556 : sh < 518 && sh > -56) p.at(sh, Y(sh), Math.atan2(Y(sh + 2) - Y(sh - 2), 4) + (right ? Math.PI : 0), 1.3, function () { needle(p); });
    p.rect(0, 50, 500, 20, { fill: 'sky', w: 1 });
    p.line(6, 61, 494, 61, { w: 0.4, dash: [6, 5], detail: true });
    p.circle(0, 50, 3.2, { fill: 'b', w: 0.5 });
  }
});

/* a washing line: shirt, sock, towel, trousers, dress and hanky swing in a breeze that runs along the
   line, each leaning at the foot a beat behind its peg. Tap: a gust streams them all out to the right. */
var CLOTHES = [
  [58, 'M-10 0 L-24 8 L-20 17 L-14 14 L-14 40 L14 40 L14 14 L20 17 L24 8 L10 0 C6 5 -6 5 -10 0 Z', 'b'],
  [118, 'M-6 0 L6 0 L6 24 C6 31 16 31 16 38 C16 45 7 47 1 45 C-6 43 -6 36 -6 28 Z', 'a'],
  [182, 'M-18 0 L18 0 L18 44 L-18 44 Z', 'c'],
  [250, 'M-14 0 L14 0 L15 44 L3 44 L0 16 L-3 44 L-15 44 Z', 'sky'],
  [316, 'M-6 0 L6 0 L7 9 L18 42 L-18 42 L-7 9 Z', 'pink'],
  [376, 'M-9 0 L9 0 L9 20 L-9 20 Z', 'yellow'],
  [434, 'M-6 0 L6 0 L6 24 C6 31 16 31 16 38 C16 45 7 47 1 45 C-6 43 -6 36 -6 28 Z', 'c']
];
D.add('washing-line', {
  fam: 'ornament', tags: ['divider', 'laundry', 'washing', 'line', 'clothes', 'breeze', 'home', 'drying', 'wash day'], loop: 3.6, ratio: 5, still: 0.2, tapLen: 2.2, burst: false, margin: [10, 12, 10, 12],
  about: 'laundry swings on a line in a breeze that runs along it, each piece leaning a beat behind its peg', tapAbout: 'a gust streams every piece out to the right, then they swing back',
  draw: function (p, t, s) {
    var tp = s.tap, ly = function (x) { var u = x / 500; return 20 + 15 * 4 * u * (1 - u); }, str = [], x;
    p.line(8, 96, 8, 14, { w: 1.4 }); p.line(492, 96, 492, 14, { w: 1.4 });
    for (x = 8; x <= 492; x += 12) str.push([x, ly(x)]);
    p.curve(str, { w: 0.8 });
    CLOTHES.forEach(function (C, i) {
      var g = tp >= 0 ? M.spring(M.seg(tp, i * 0.04, i * 0.04 + 0.35)) * (1 - M.easeIn(M.seg(tp, 0.55 + i * 0.03, 1))) : 0, a = 0.11 * M.wave(t, 1, -C[0] / 500) - 0.9 * g, lean = 0.2 * M.wave(t, 1, -C[0] / 500 - 0.1) + 0.5 * g * M.wave(tp < 0 ? 0 : tp, 4);
      p.at(C[0], ly(C[0]), 0, 1, function () {
        p.turn(a); p.skew(lean, 0);
        p.path(C[1], { fill: C[2], w: 0.9 });
        p.line(-10, 30, 10, 30, { w: 0.4, detail: true });
        p.rect(-3, -4, 5, 9, { fill: 'wood', w: 0.6 });
      });
    });
  }
});

/* a zipper: the slider runs the length, closing the teeth behind it, and comes back opening them
   again, its pull-tab trailing behind the pull. Tap: the teeth hop in a wave and the tab flips. */
D.add('zipper', {
  fam: 'ornament', tags: ['divider', 'zip', 'zipper', 'open', 'close', 'fasten', 'clothes', 'bag', 'reveal'], loop: 5, ratio: 5, still: 0.25, tapLen: 1.4, burst: 'spark', burstAt: [250, 50], burstN: 6, margin: [26, 10, 10, 10],
  about: 'a zip slider runs along closing the teeth behind it, then comes back opening them', tapAbout: 'the teeth hop up in a wave and the pull-tab flips over',
  draw: function (p, t, s) {
    var tp = s.tap, pos = function (u) { return u < 0.5 ? M.ease(M.seg(u, 0, 0.5)) : 1 - M.ease(M.seg(u, 0.5, 1)); }, xs = 30 + 440 * pos(t), i, x;
    var g = function (x) { return x > xs ? 22 * M.ease(M.seg(x - xs, 0, 70)) : 0; }, tt = [], bb = [];
    for (x = 0; x <= 500; x += 10) { tt.push([x, 47 - g(x) / 2]); bb.push([x, 53 + g(x) / 2]); }
    p.poly(tt.map(function (q) { return [q[0], q[1] - 14]; }).concat(tt.slice().reverse()), { fill: 'c', w: 0.9 });
    p.poly(bb.concat(bb.slice().reverse().map(function (q) { return [q[0], q[1] + 14]; })), { fill: 'c', w: 0.9 });
    for (i = 0; i < 31; i++) {
      var hop = tp >= 0 ? 4 * M.bump(M.seg(tp, i / 31 * 0.6, i / 31 * 0.6 + 0.3)) : 0, xt = 8 + 16 * i, xb = 16 * i;
      p.rect(xt - 3.5, 47 - g(xt) / 2 - hop, 7, 7, { fill: 'grey', r: 2, w: 0.6, detail: true });
      p.rect(xb - 3.5, 46 + g(xb) / 2 + hop, 7, 7, { fill: 'grey', r: 2, w: 0.6, detail: true });
    }
    var v = (pos(M.frac(t + 0.01)) - pos(M.frac(t - 0.01))) / 0.02, flip = tp >= 0 ? TAU * M.easeOut(M.seg(tp, 0, 0.8)) : 0;
    p.at(xs, 50, 0, 1, function () {
      p.pivot(0, -10, -0.25 - 0.17 * v + flip, 1, function () { p.rect(-4.5, -34, 9, 25, { fill: 'a', r: 4, w: 0.9 }); p.circle(0, -28, 1.8, { fill: 'bg', w: 0.4, detail: true }); });
      p.poly([[-13, -12], [11, -9], [11, 9], [-13, 12]], { fill: 'a', w: 1 });
      p.line(-6, -5, 4, -5, { w: 0.4, detail: true });
    });
  }
});

/* dominoes standing in a row topple one after another, left to right, and are stood up again in the
   same order, each rocking back a little before it settles. Tap: they hop and rock in a wave. */
var PIPS = [[[0, 0]], [[-3, -3], [3, 3]], [[-3, -3], [0, 0], [3, 3]], [[-3, -3], [3, -3], [-3, 3], [3, 3]]];
D.add('dominoes', {
  fam: 'ornament', tags: ['divider', 'dominoes', 'chain', 'fall', 'topple', 'game', 'domino effect', 'row', '🁣'], loop: 6, ratio: 5, still: 0.03, tapLen: 1.6, burst: false, margin: [10, 40, 8, 10],
  about: 'dominoes topple in a wave from the left, then stand up again in the same order', tapAbout: 'the row hops and rocks in a wave, left to right',
  draw: function (p, t, s) {
    var tp = s.tap;
    for (var k = 0; k < 17; k++) {
      var x = 15 + 29.4 * k, f = M.seg(t, 0.05 + 0.028 * k, 0.15 + 0.028 * k), r = M.seg(t, 0.58 + 0.017 * k, 0.68 + 0.017 * k), a = 1.4 * M.easeIn(f) * (1 - M.spring(r)), hop = 0;
      if (tp >= 0) { var q = M.bump(M.seg(tp, k * 0.03, k * 0.03 + 0.3)); a += 0.25 * q; hop = 10 * q; }
      p.pivot(x + 8, 88, a, 1, function () {
        p.rect(x - 8, 36 - hop, 16, 52, { fill: 'cream', r: 3, w: 0.9 });
        p.line(x - 5, 62 - hop, x + 5, 62 - hop, { w: 0.5, detail: true });
        PIPS[k % 4].forEach(function (c) { p.circle(x + c[0], 49 - hop + c[1], 1.7, { fill: 'ink', line: false, detail: true }); });
        PIPS[(k * 3 + 1) % 4].forEach(function (c) { p.circle(x + c[0], 75 - hop + c[1], 1.7, { fill: 'ink', line: false, detail: true }); });
      });
    }
  }
});

/* a caterpillar crosses, a hump running from tail to head along its body as it hitches itself forward.
   Tap: it rears up at the front and the antennae wave. */
D.add('caterpillar', {
  fam: 'ornament', tags: ['divider', 'caterpillar', 'crawl', 'insect', 'garden', 'slow', 'growth', 'worm', '🐛'], loop: 14, ratio: 5, still: 0.28, tapLen: 1.6, burst: 'leaf', burstAt: [250, 50], burstN: 4, margin: [24, 10, 8, 10],
  about: 'a caterpillar crosses, a hump running from tail to head as it hitches forward', tapAbout: 'it rears up at the front and waves its antennae',
  draw: function (p, t, s) {
    var tp = s.tap, xh = -40 + 740 * M.frac(t + 0.1), up = tp >= 0 ? M.bump(M.seg(tp, 0, 0.8)) : 0, i;
    p.line(0, 87, 500, 87, { w: 0.35, dash: [10, 9], detail: true });
    for (i = 9; i >= 0; i--) {
      var x = xh - i * 18.5, lift = 9 * Math.pow(Math.max(0, Math.sin(TAU * (16 * t - i * 0.11))), 2) + 30 * up * M.ease(M.clamp((4 - i) / 4, 0, 1)), r = i ? 10.5 : 12.5, y = 86 - r - lift;
      if (x < -30 || x > 530) continue;
      if (i) { p.line(x - 4, y + r - 1, x - 6, 87, { w: 0.5, detail: true }); p.line(x + 4, y + r - 1, x + 6, 87, { w: 0.5, detail: true }); }
      p.circle(x, y, r, { fill: i ? (i % 2 ? 'leaf' : 'mint') : 'a', w: 1 });
      if (i === 0) {
        p.circle(x + 4.5, y - 2.5, 1.8, { fill: 'ink', line: false }); p.arc(x + 5, y + 1, 5, 0.3, 2, { w: 0.5, detail: true });
        var sw = 0.4 * M.wave(t, 8) + 0.5 * up * M.wave(tp < 0 ? 0 : tp, 5);
        p.at(x + 1, y - 10, sw, 1.3, function () { p.path('M0 0 C-2 -6 -1 -10 3 -13', { w: 0.5 }); p.dot(3, -13, 1.6, 'b'); });
        p.at(x + 6, y - 9, sw * 0.8, 1.3, function () { p.path('M0 0 C1 -6 4 -9 8 -10', { w: 0.5 }); p.dot(8, -10, 1.6, 'b'); });
      }
    }
  }
});

/* a row of candles of different heights, the flames guttering one after another along it. Tap: a breath
   runs along the row, blowing each flame flat and out with a curl of smoke, and they are relit in turn. */
D.add('candles', {
  fam: 'ornament', tags: ['divider', 'candles', 'flame', 'light', 'birthday', 'vigil', 'warm', 'wish', '🕯'], loop: 3, ratio: 5, still: 0.2, tapLen: 2.6, tapRest: 0.3, burst: false, margin: [30, 10, 6, 10],
  about: 'candles of different heights gutter in turn along the row', tapAbout: 'a breath runs along the row blowing the flames out with a curl of smoke, and each is relit in turn',
  draw: function (p, t, s) {
    var tp = s.tap;
    p.line(0, 92, 500, 92, { w: 1.1 });
    for (var i = 0; i < 7; i++) {
      var x = 36 + 71.3 * i, top = 92 - [34, 46, 28, 52, 38, 44, 30][i], lean = 0.12 * M.wave(t, 1, -i / 7), sc = 1, a = tp - i * 0.04, b = tp - 0.45 - i * 0.05;
      if (tp >= 0) {
        if (b > 0) { lean = 0; sc = M.spring(M.seg(b, 0, 0.2)); }
        else if (a > 0) { lean = 1.2 * M.ease(M.seg(a, 0, 0.1)); sc = 1 - M.ease(M.seg(a, 0.1, 0.2)); }
      }
      p.rect(x - 8, top, 16, 92 - top, { fill: ['cream', 'a', 'b', 'c', 'pink', 'cream', 'sky'][i], w: 0.9 });
      p.ellipse(x + 8, top + 7, 2.4, 6, { fill: ['cream', 'a', 'b', 'c', 'pink', 'cream', 'sky'][i], w: 0.6, detail: true });
      p.line(x, top, x, top - 5, { w: 0.7 });
      if (sc > 0.03) p.at(x, top - 4, lean, [1.25 * sc * (1 + 0.1 * M.wave(t, 3, -i / 3.5)), 1.25 * sc * (1 + 0.15 * M.wave(t, 2, -i * 0.14))], function () {
        p.path('M0 0 C-6 -4 -5 -12 0 -21 C5 -12 6 -4 0 0 Z', { fill: 'flame', line: false, glow: 0.9 });
        p.path('M0 0 C-6 -4 -5 -12 0 -21 C5 -12 6 -4 0 0 Z', { w: 0.8 });
        p.path('M0 -1 C-2.5 -3 -2.4 -8 0 -12 C2.4 -8 2.5 -3 0 -1 Z', { fill: 'yellow', w: 0.4, detail: true });
      });
      if (tp >= 0 && a > 0.12 && a < 0.55) p.span('M' + x + ' ' + (top - 6) + ' C' + (x - 7) + ' ' + (top - 14) + ' ' + (x + 7) + ' ' + (top - 22) + ' ' + x + ' ' + (top - 34), M.seg(a, 0.3, 0.55), M.easeOut(M.seg(a, 0.12, 0.4)), { w: 0.6 });
      if (tp >= 0 && b > 0 && b < 0.06) p.star(x, top - 8, 7 * M.bump(b / 0.06), 2, 4, { fill: 'yellow', w: 0.5 });
    }
  }
});

/* a rosette to stand at the heart of a section: three rings of petals, a swell running round each ring
   in its own direction, the rings swaying against one another. Tap: it blooms, every ring turning by one
   petal and settling. */
var ROSE = 'M0 0 C-6 -12 -5 -30 0 -40 C5 -30 6 -12 0 0 Z';
D.add('rosette', {
  fam: 'ornament', tags: ['centrepiece', 'rosette', 'mandala', 'flower', 'ornament', 'medallion', 'badge', 'section', 'seal'], loop: 4, ratio: 1, still: 0.3, tapLen: 1.6, tapRest: 0.6, burst: 'petal', burstAt: [50, 50], burstN: 8, margin: [8, 8, 8, 8],
  about: 'three rings of petals, a swell running round each in its own direction', tapAbout: 'it blooms, every ring turning by one petal and settling',
  draw: function (p, t, s) {
    var tp = s.tap;
    [[12, 1, 'a', 0, 1], [8, 0.74, 'b', 0.5, -1], [8, 0.46, 'cream', 0, 1]].forEach(function (R, ri) {
      var n = R[0], step = TAU / n, sw = 0.12 * R[4] * M.wave(t, 1, ri / 3) + (tp >= 0 ? R[4] * step * M.spring(M.seg(tp, ri * 0.08, ri * 0.08 + 0.7)) : 0), bl = tp >= 0 ? 0.14 * M.bump(M.seg(tp, ri * 0.08, ri * 0.08 + 0.8)) : 0;
      for (var k = 0; k < n; k++) {
        var pos = k + R[3] + sw / step;
        p.at(50, 50, pos * step, R[1] * (1 + 0.1 * M.wave(t, 1, -pos / n * R[4]) + bl), function () { p.path(ROSE, { fill: R[2], w: 0.7 }); p.path('M0 -6 C-1.5 -14 -1 -24 0 -32', { w: 0.35, detail: true }); });
      }
    });
    p.circle(50, 50, 7 + 0.6 * M.wave(t, 1), { fill: 'c', w: 0.9 });
    p.circle(50, 50, 2.4, { fill: 'white', line: false });
  }
});
})(Dingbats);

/* Fete: a charity day on a lawn. First drawn for the Golf Ball Drop page (Rotary Club of Chiang Mai
   International, 2026-10-24): a golf ball that bounces with its dimples turning, and the chalk X it
   is dropped onto. In riso every white here is a fill, so it is the paper showing. */
(function (D) {
'use strict';
var M = D.math, TAU = M.TAU, PI = Math.PI, sin = Math.sin, cos = Math.cos, seg = M.seg, eo = M.easeOut, bump = M.bump, lerp = M.lerp, frac = M.frac;

/* path data for a circle and an ellipse, for the shapes that need a hole */
function circ(x, y, r) { return 'M' + (x - r) + ' ' + y + 'A' + r + ' ' + r + ' 0 1 0 ' + (x + r) + ' ' + y + 'A' + r + ' ' + r + ' 0 1 0 ' + (x - r) + ' ' + y + 'Z'; }
function oval(x, y, rx, ry) { return 'M' + (x - rx) + ' ' + y + 'A' + rx + ' ' + ry + ' 0 1 0 ' + (x + rx) + ' ' + y + 'A' + rx + ' ' + ry + ' 0 1 0 ' + (x - rx) + ' ' + y + 'Z'; }

/* the squash a landing leaves: 1 at the contact, 0 a few frames either side of it */
function land(d, w) { var k = Math.max(0, 1 - Math.abs(d) / w); return k * k; }

/* a golf ball seen from the front, turning by `spin` radians about its upright axis. Its face is paper
   (white fills, so it is the paper in riso); the light is from the upper left, so the shaded side is a
   hard-edged crescent of the sky ink and the lit side a wash of sun; the dimples are small crescents
   whose lit rim is a dot of paper; the seam is a great circle that turns with it; one number, in pink,
   comes round on the face. Drawn about the ball's own centre. o.rows/o.cols: the lattice; o.big: how
   much larger each dimple is drawn (a small ball needs fewer, bigger ones); o.n7: where the number
   starts round the ball; o.small: eight big crescents only. */
function ball(p, R, spin, o) {
  o = o || {};
  var rows = o.rows || 7, cols = o.cols || 12, big = o.big || 1, k = R / 20, i, j;
  p.circle(0, 0, R, { fill: 'white', w: o.w || 1.15 });
  p.clip(function () { p.circle(0, 0, R, { fill: 'white', line: false }); }, function () {
    p.circle(-R * 0.28, -R * 0.3, R * 0.78, { fill: 'yellow', alpha: 0.2, line: false });
    p.path(circ(0, 0, R * 1.03) + circ(-R * 0.25, -R * 0.3, R * 0.98), { fill: 'sky', alpha: 0.85, line: false, holes: true });
    if (o.small) {
      /* under 30 px: five crescents on the shaded half, each with its dark rim to the lower right, none side by side in a row; they drift a little with the spin */
      [[0.50, -0.20], [0.14, 0.04], [0.54, 0.26], [0.12, 0.44], [0.50, 0.64]].forEach(function (d, n) {
        var dr = sin(spin + n * 1.3) * 0.05;
        p.arc((d[0] + dr) * R, (d[1] - dr * 0.6) * R, R * 0.26, PI / 4 - 1.0, PI / 4 + 1.0, { ink: 'blue', w: 0.62, cap: 'round' });
      });
      return;
    }
    for (i = 0; i < rows; i++) for (j = 0; j < cols; j++) {
      var lo = ((j + (i % 2) * 0.5) / cols) * TAU + spin, la = -1.2 + i * (2.4 / (rows - 1)), cl = cos(la), px = sin(lo) * cl * R * 0.94, py = sin(la) * R * 0.94, pz = cos(lo) * cl;
      if (pz < 0.25) continue;
      var rr = (1.6 + 1.0 * pz) * k * big, rot = Math.atan2(py, px), zr = Math.max(0.3, pz), a0 = PI / 4 - rot;
      /* the dimple is a dish: its shaded rim is a crescent to the lower right, its lit rim a dot of paper to the upper left */
      p.arc(px, py, rr * zr, a0 - 0.95, a0 + 0.95, { ry: rr, rot: rot, ink: 'blue', w: 0.3 * Math.sqrt(big), cap: 'round', detail: true });
      var qa = a0 + PI, ex = cos(qa) * rr * zr, ey = sin(qa) * rr, cr = cos(rot), sr = sin(rot);
      p.dot(px + ex * cr - ey * sr, py + ex * sr + ey * cr, 0.55 * k * big, 'white');
    }
    /* the seam: a great circle, tilted, turning with the ball; only its front half shows */
    var run = [], tilt = 0.55;
    for (i = 0; i <= 48; i++) {
      var a = (i / 48) * TAU, x0 = cos(a), y0 = sin(a) * cos(tilt), z0 = sin(a) * sin(tilt), xs = x0 * cos(spin) + z0 * sin(spin), zs = -x0 * sin(spin) + z0 * cos(spin);
      if (zs > 0.02) run.push([xs * R * 0.97, y0 * R * 0.97]);
      else { if (run.length > 2) p.curve(run, { ink: 'ink', w: 0.4, alpha: 0.4, detail: true }); run = []; }
    }
    if (run.length > 2) p.curve(run, { ink: 'ink', w: 0.4, alpha: 0.4, detail: true });
    /* the number, in the warm ink, on the face while it comes round */
    var ln = (o.n7 == null ? -0.95 : o.n7) + spin, zn = cos(ln);
    if (zn > 0.2) p.at(sin(ln) * R * 0.78, -R * 0.1, ln * 0.25, [zn * k, k], function () { p.path('M-2.8 -3.8 L2.8 -3.8 L-0.5 4', { ink: 'pink', w: 0.85, cap: 'round', detail: true }); });
    p.ellipse(-R * 0.4, -R * 0.45, R * 0.2, R * 0.12, { fill: 'white', line: false, rot: -0.6 });
  });
}

/* a blade of grass: a tapered leaf, rooted at (x, g), h tall, its tip leaning by `lean` */
function blade(p, x, g, h, lean, wd, fill) {
  p.path('M' + (x - wd) + ' ' + g + 'Q' + (x - wd * 0.3 + lean * 0.25) + ' ' + (g - h * 0.55) + ' ' + (x + lean) + ' ' + (g - h) + 'Q' + (x + wd * 0.55 + lean * 0.35) + ' ' + (g - h * 0.45) + ' ' + (x + wd) + ' ' + g + 'Z', { fill: fill, ink: fill, w: 0.15 });
}

/* a golf ball bouncing on the grass: two different bounces a loop, a squash where it lands (and a
   stretch as it comes down), its dimples turning as it spins. Tap: a high hop with a full spin, stars
   where it lands. */
D.add('golf-ball', {
  fam: 'fete', tags: ['golf', 'ball', 'bounce', 'drop', 'sport', 'game', 'number', 'charity'], loop: 1.8, still: 0.2, tapLen: 1.3, burst: 'star', burstAt: [50, 84], burstN: 6, burstDelay: 0.75, margin: [40, 18, 10, 18],
  about: 'a golf ball bounces twice a loop, high and then low, squashing where it lands and kicking up grass, its dimples turning', tapAbout: 'a high hop with a full spin, stars where it lands',
  draw: function (p, t, s) {
    var R = 20, ground = 86, ta = s.tap < 0 ? -1 : s.tap, u, h, v, sq, st, spin = (t + (s.taps || 0) * 0.37) * TAU, age = -1, flick = 0, i;
    if (ta < 0) {
      if (t < 0.6) { u = t / 0.6; h = 38 * 4 * u * (1 - u); v = 1 - 2 * u; st = 0.06 * Math.pow(Math.max(0, -v), 2); }
      else { u = (t - 0.6) / 0.4; h = 17 * 4 * u * (1 - u); v = 1 - 2 * u; st = 0.05 * Math.pow(Math.max(0, -v), 2); }
      sq = 0.09 * land(Math.min(t, 1 - t), 0.045) + 0.16 * land(t - 0.6, 0.045);
      age = t < 0.14 ? t : (t >= 0.6 && t < 0.74 ? t - 0.6 : -1);
    } else {
      var a = seg(ta, 0, 0.8); h = 62 * 4 * a * (1 - a) + (ta > 0.8 ? 6 * bump(seg(ta, 0.8, 1)) : 0); spin += eo(seg(ta, 0, 0.8)) * TAU;
      v = ta < 0.8 ? 1 - 2 * a : 0; st = 0.06 * Math.pow(Math.max(0, -v), 2); sq = 0.16 * land(ta - 0.8, 0.04); age = ta >= 0.8 ? (ta - 0.8) * 0.7 : -1;
    }
    st *= 1 - Math.min(1, sq * 6);
    var sy = (1 - sq) * (1 + st), sx = (1 + sq) * (1 - st * 0.5), cy = ground - R * sy - h;
    if (age >= 0 && age < 0.14) flick = bump(age / 0.14);
    /* the turf, the far blades, the contact shadow */
    p.ellipse(50, ground + 3, 33, 4, { fill: 'leaf', alpha: 0.55, line: false });
    [[24, 12, -3.2, 1.1, 'green'], [29, 8, -1.2, 1.0, 'leaf'], [36, 10, -2.2, 1.0, 'leaf'], [71, 11, 3, 1.1, 'leaf'], [77, 7, 1.4, 1.0, 'green']].forEach(function (b) { blade(p, b[0], ground + 1, b[1], b[2], b[3], b[4]); });
    p.ellipse(51, ground + 1.8, R * (0.92 - Math.min(0.5, h / 90)), 3.2 - Math.min(2, h / 22), { fill: 'smoke', line: false, alpha: 0.5 - Math.min(0.3, h / 150) });
    p.at(50, cy, 0, [sx, sy], function () { ball(p, R, spin, { rows: s.px < 56 ? 5 : 7, cols: s.px < 56 ? 9 : 12, big: s.px < 56 ? 1.45 : 1, small: p.small }); });
    /* the near blades, over the ball's foot; two flick away on a landing */
    [[41, 6.5, -0.6, 1.1, 'leaf'], [48, 9, 0.8, 1.2, 'green'], [57, 6, 2, 1.0, 'leaf'], [63, 8.5, 3.6, 1.1, 'green']].forEach(function (b, i2) { blade(p, b[0], ground + 2, b[1], b[2] * (1 - flick * 0.9) + (i2 % 2 ? 1 : -1) * flick * 4, b[3], b[4]); });
    /* three small arcs of dust puff out along the ground */
    if (age >= 0 && age < 0.2) { var d = eo(age / 0.2), sc = 1 - 0.7 * seg(age, 0.08, 0.2); for (i = -1; i <= 1; i++) p.arc(50 + i * (15 + 12 * d), ground - 2 - d * (i ? 3 : 7) - (i ? 0 : 3), 3.4 * sc, PI * 1.1, PI * 1.9, { ink: 'ink', w: 0.4, alpha: 0.7, detail: true }); }
  }
});

/* a chalk X on a patch of mown lawn, the mark the balls are dropped onto: rings ripple out from its
   middle, a stake with tape stands at the corner. Tap: a golf ball falls onto the middle of it, hops
   twice, and a puff of chalk dust and stars go up. */
D.add('x-mark', {
  fam: 'fete', tags: ['x', 'target', 'mark', 'spot', 'goal', 'aim', 'bullseye', 'golf', 'lawn', 'here'], loop: 2.4, still: 0.3, tapLen: 1.3, burst: 'star', burstAt: [50, 58], burstN: 7, burstDelay: 0.3, margin: [56, 12, 12, 12],
  about: 'a chalk X on a lawn of mown stripes, rings rippling out from its middle, tape stirring on its stake', tapAbout: 'a golf ball drops onto the middle of the X, hops twice, chalk dust and stars go up',
  draw: function (p, t, s) {
    var i, k;
    /* the lawn plane: u across (-1..1), v from the back (0) to the front (1) */
    var gp = function (u, v) { return [50 + u * lerp(27, 45, v), lerp(42, 80, v)]; };
    var tile = function () {
      p.curve([[26, 42.5], [50, 41], [74, 42.5], [84, 46.5], [94, 62], [95.5, 77], [88, 82], [50, 83.2], [12, 82], [4.5, 77], [6, 62], [16, 46.5]], { close: true, fill: 'leaf', line: false });
    };
    p.clip(tile, function () {
      p.poly([[0, 38], [100, 38], [100, 90], [0, 90]], { fill: 'leaf', line: false });
      for (i = 1; i < 5; i += 2) {     /* every second stripe is leaf over sun: the mower's other pass */
        var u0 = -1 + i * 0.4, u1 = u0 + 0.4, a = gp(u0, 0), b = gp(u1, 0), c = gp(u1, 1), d = gp(u0, 1);
        p.poly([[a[0], a[1] - 2], [b[0], b[1] - 2], [c[0], c[1] + 3], [d[0], d[1] + 3]], { fill: 'yellow', alpha: 0.8, line: false });
      }
      /* rings of paper knocked out of the green, three of them, a third of a loop apart; each is made, grows outward and thins */
      for (k = 0; k < 3; k++) {
        var f = frac(t + k / 3), rx = lerp(5, 41, f), th = f < 0.1 ? lerp(0, 2.4, f / 0.1) : f < 0.9 ? lerp(2.4, 0.8, (f - 0.1) / 0.8) : lerp(0.8, 0, (f - 0.9) / 0.1);
        if (th <= 0.02) continue;
        p.path(oval(50, 61, rx, rx * 0.42) + oval(50, 61, Math.max(0.5, rx - th), Math.max(0.2, rx * 0.42 - th * 0.62)), { fill: 'white', alpha: 0.95 - 0.25 * f, line: false, holes: true });
      }
    });
    p.curve([[10, 79.5], [30, 82], [50, 82.8], [70, 82], [90, 79.5]], { ink: 'ink', w: 0.5, detail: true });          /* the near edge of the lawn */
    /* the chalk: two arms, each its own ragged polygon, with the sky plate printed a hair off beneath */
    var arm = function (a0, b0, seed) {
      var rg = M.rng(seed), n = 8, L = [], Rr = [], dx = b0[0] - a0[0], dy = b0[1] - a0[1], len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
      for (var j = 0; j < n; j++) {
        var u = j / (n - 1), w = 3.1 * (0.42 + 0.58 * sin(PI * (0.08 + 0.84 * u))), cx = a0[0] + dx * u, cy = a0[1] + dy * u;
        L.push([cx + nx * (w + (rg() - 0.5)), cy + ny * (w * 0.62 + (rg() - 0.5))]); Rr.push([cx - nx * (w + (rg() - 0.5)), cy - ny * (w * 0.62 + (rg() - 0.5))]);
      }
      return L.concat(Rr.reverse());
    };
    var A = arm(gp(-0.62, 0.16), gp(0.62, 0.86), 11), B = arm(gp(0.62, 0.16), gp(-0.62, 0.86), 23);
    [A, B].forEach(function (poly) {
      p.poly(poly.map(function (q) { return [q[0] + 1.2, q[1] + 1.2]; }), { fill: 'blue', alpha: 0.5, line: false });
      p.poly(poly, { fill: 'white', line: false });
    });
    var r2 = M.rng(5); for (i = 0; i < 8; i++) { var arm0 = i % 2 ? A : B, q0 = arm0[Math.floor(r2() * arm0.length)]; p.dot(q0[0] + (r2() - 0.5) * 9, q0[1] + (r2() - 0.5) * 6, 0.4 + r2() * 0.5, 'white'); }
    /* the stake at the back left corner, standing in the grass inside the tile, and its tape: yellow, then black, with a swallow tail, stirring a little */
    var sw = sin(TAU * t) * 0.8;
    p.ellipse(23.4, 47.5, 3.6, 1.05, { fill: 'smoke', line: false, alpha: 0.5 });
    p.poly([[21.2, 47], [22.8, 47], [22.9, 31], [21.1, 31]], { fill: 'wood', ink: 'ink', w: 0.35 });
    blade(p, 19.4, 48.2, 4.4, -1.4, 0.65, 'green'); blade(p, 25.6, 48.2, 3.8, 1.5, 0.6, 'green');
    p.poly([[22.9, 32.2], [31.5, 31.6 + sw * 0.5], [31.5, 34], [22.9, 34.6]], { fill: 'yellow', line: false });
    p.poly([[31.9, 31.6 + sw * 0.5], [40, 30.9 + sw], [37.5, 32.3 + sw], [40, 33.7 + sw], [31.9, 34]], { fill: 'ink', line: false });
    /* tap: a golf ball falls on the middle, hops 24 then 8 units, a puff of chalk dust, the stars from the contact point */
    if (s.tap >= 0) {
      var ta = s.tap, R = 8, gy = 61.5, h, sq, u2;
      if (ta < 0.3) h = lerp(70, 0, Math.pow(seg(ta, 0, 0.3), 2));
      else if (ta < 0.6) { u2 = seg(ta, 0.3, 0.6); h = 24 * 4 * u2 * (1 - u2); }
      else if (ta < 0.8) { u2 = seg(ta, 0.6, 0.8); h = 8 * 4 * u2 * (1 - u2); }
      else h = 0;
      sq = 0.2 * land(ta - 0.3, 0.05) + 0.1 * land(ta - 0.6, 0.04);
      p.ellipse(51, gy + 0.6, R * (0.9 - Math.min(0.4, h / 120)), 2.1, { fill: 'smoke', line: false, alpha: 0.5 });
      p.at(50, gy - R * (1 - sq) - h, 0, [1 + sq, 1 - sq], function () { ball(p, R, 0.6 + ta * 9, { rows: 5, cols: 8, big: 1.5, w: 1, n7: -0.8, small: p.small }); });
      var ag = (ta - 0.3) / 0.35;
      if (ag > 0 && ag < 1) for (i = 0; i < 6; i++) { var an = PI * (0.08 + 0.84 * (i / 5)), dd = 5 + 17 * eo(ag) * (0.7 + 0.15 * ((i * 5) % 3)); p.dot(50 + cos(an) * dd * 1.5, gy + 1 - Math.abs(sin(an)) * dd * 0.2 - (i % 2) * 2.5 * eo(ag), 1.25 * (1 - 0.65 * ag), 'white'); }
    }
  }
});

})(Dingbats);

/* Work: the jobs people hand over — a page, a stamp, a translation, a wrench, a laptop, a server, a parcel, a passport. First drawn for hongdam.net's service lines (2026-10-23). */
(function (D) {
'use strict';
var M = D.math, TAU = M.TAU, PI = Math.PI, sin = Math.sin, cos = Math.cos, seg = M.seg, ez = M.ease, eo = M.easeOut, ei = M.easeIn, bump = M.bump, lerp = M.lerp;

/* handwriting: a looped line from x0 to x1 on baseline y, n letters h high; reads as script, not as any word */
function scrawl(x0, x1, y, h, n, loopy) {
  var d = '', N = n * 10, c = (x1 - x0) / (n * TAU), b = c * (loopy || 1.6), i, s;
  for (i = 0; i <= N; i++) { s = i / N * n * TAU; d += (i ? ' L' : 'M') + (x0 + c * s - b * sin(s)).toFixed(2) + ' ' + (y - h / 2 * (1 - cos(s))).toFixed(2); }
  return d;
}
/* a point on a cubic */
function bz(a, b, c, d, u) { var v = 1 - u; return [v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0], v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1]]; }
/* a speech bubble around (x, y), its tail on the left (-1) or right (1) of the bottom edge */
function bubbleD(x, y, w, h, side) {
  var l = x - w / 2, r = x + w / 2, tp = y - h / 2, b = y + h / 2, k = 7;
  var tail = side < 0 ? ' L' + (l + 20) + ' ' + b + ' L' + (l + 5) + ' ' + (b + 10) + ' L' + (l + 11) + ' ' + b : ' L' + (r - 11) + ' ' + b + ' L' + (r - 5) + ' ' + (b + 10) + ' L' + (r - 20) + ' ' + b;
  return 'M' + (l + k) + ' ' + tp + ' L' + (r - k) + ' ' + tp + ' Q' + r + ' ' + tp + ' ' + r + ' ' + (tp + k) + ' L' + r + ' ' + (b - k) + ' Q' + r + ' ' + b + ' ' + (r - k) + ' ' + b +
    tail + ' L' + (l + k) + ' ' + b + ' Q' + l + ' ' + b + ' ' + l + ' ' + (b - k) + ' L' + l + ' ' + (tp + k) + ' Q' + l + ' ' + tp + ' ' + (l + k) + ' ' + tp + ' Z';
}
var KO = 'M-6.5 9 L-6.5 -1.5 C-6.5 -4.6 -2 -5 -2.2 -2.2 C-2.4 0.4 -6.6 0.2 -6.2 -3.6 C-5.4 -9.6 6.5 -10.4 6.5 -1.5 L6.5 9';   /* ก as a looped Thai hand writes it: the small loop at the top of the left stem, the arch, the right stem */
var AA = 'M-7 9 L0 -9 L7 9 M-4 2.6 L4 2.6';
var SHIELD = 'M50 26 C58 31 66 32 74 30 C75 50 67 66 50 76 C33 66 25 50 26 30 C34 32 42 31 50 26 Z';
var TICK = 'M39 51 C43 54 46 58 48 62 C53 50 59 42 66 36';

D.add('page', {
  fam: 'work', tags: ['document', 'paper', 'form', 'letter', 'contract', 'certificate', 'write', 'file', '📄'], loop: 3.2, still: 0.74, burst: 'spark', burstAt: [74, 20], burstN: 4, burstSpread: 3, tapLen: 1.2, margin: [16, 22, 18, 22],
  about: 'four lines of handwriting write themselves down the page, then the page is wiped clean for the next', tapAbout: 'the page turns over and back like a leaf in the wind',
  draw: function (p, t, s) {
    var flip = s.tap >= 0 ? cos(TAU * ez(seg(s.tap, 0.04, 0.86))) : 1, wipe = ez(seg(t, 0.84, 0.98)), lines = [[31, 70, 36, 7, 4], [31, 66, 50, 7, 4], [31, 70, 64, 7, 4], [31, 55, 78, 7, 3]];
    p.pivot(50, 52, 0.035 * M.wave(t, 1), [Math.max(0.04, Math.abs(flip)), 1], function () {
      p.path('M22 12 L64 12 L80 28 L80 90 L22 90 Z', { fill: flip < 0 ? 'cream' : 'white' });
      p.path('M64 12 L64 28 L80 28 Z', { fill: 'stone', w: 0.7 });
      lines.forEach(function (L, i) {
        var a = 0.05 + 0.16 * i, u = ez(seg(t, a, a + 0.17));
        if (u > wipe) p.span(scrawl(L[0], L[1], L[2], L[3], L[4]), wipe, u, { ink: 'navy', w: 0.6, wob: 0.4 });
      });
    });
  }
});

D.add('translate', {
  fam: 'work', tags: ['translation', 'language', 'interpreter', 'thai', 'english', 'speak', 'words', '🔤'], loop: 2.6, still: 0.3, ratio: 1.15, burst: 'spark', burstAt: [57, 50], burstN: 5, burstSpread: 3, tapLen: 1.4, margin: [18, 20, 26, 20],
  about: 'a Thai bubble and an English one bob in turn while three dots carry the words across', tapAbout: 'the two bubbles circle round each other and land home again',
  draw: function (p, t, s) {
    var th = s.tap >= 0 ? TAU * ez(seg(s.tap, 0.02, 0.9)) : 0, cx = 57, cy = 51;
    function pos(x, y) { var dx = x - cx, dy = y - cy; return [cx + dx * cos(th) - dy * sin(th), cy + dx * sin(th) + dy * cos(th)]; }
    var A = pos(36, 36 + 2.2 * M.wave(t, 1)), B = pos(78, 64 + 2.2 * M.wave(t, 1, 0.06));
    if (!p.small) for (var k = 0; k < 3; k++) {
      var u = M.frac(t + k / 3), q = bz([44, 56], [44, 74], [56, 82], [62, 76], u);
      if (s.tap < 0) p.dot(q[0], q[1], 1.8 * bump(u), 'b');
    }
    p.at(A[0], A[1], 0.06 * M.wave(t, 1), 1, function () { p.path(bubbleD(0, 0, 44, 34, -1), { fill: 'a' }); p.path(KO, { w: 1.3, ink: 'navy', fill: false }); });
    p.at(B[0], B[1], 0.06 * M.wave(t, 1, 0.06), 1, function () { p.path(bubbleD(0, 0, 44, 34, 1), { fill: 'sky' }); p.path(AA, { w: 1.3, ink: 'navy', fill: false }); });
  }
});

D.add('stamp', {
  fam: 'work', tags: ['seal', 'certified', 'official', 'approve', 'notary', 'rubber stamp', 'chop'], loop: 2.4, still: 0.42, burst: 'ring', burstAt: [50, 84], burstN: 6, burstSpread: 2.6, burstColor: 'red', burstDelay: 0.22, tapLen: 1.3, margin: [18, 18, 14, 18],
  about: 'the stamp hovers, comes down hard, lifts; a red seal is left on the paper and slowly fades', tapAbout: 'two hard stamps, the seal bright red',
  draw: function (p, t, s) {
    var press, mark;
    if (s.tap >= 0) { var q = s.tap; press = Math.max(bump(seg(q, 0.08, 0.36)), bump(seg(q, 0.42, 0.7))); mark = 1; }
    else { press = ei(seg(t, 0.18, 0.34)) * (1 - ez(seg(t, 0.38, 0.6))); mark = t > 0.33 ? 1 - ez(seg(t, 0.62, 0.96)) : 0; }
    var dy = lerp(-6, 12, press), sq = bump(seg(press, 0.85, 1)) * 0 + (press > 0.95 ? (press - 0.95) * 20 : 0);
    p.path('M12 74 L88 70 L90 95 L10 96 Z', { fill: 'white', w: 0.9 });
    if (mark > 0.02) p.at(50, 84, -0.08, 1, function () {
      p.ellipse(0, 0, 13, 6.4, { ink: 'red', w: 1.1, alpha: mark, fill: false });
      p.ellipse(0, 0, 8.8, 4.1, { ink: 'red', w: 0.7, alpha: mark, fill: false });
      p.star(0, -0.2, 3.2, 1.4, 5, { fill: 'red', line: false, alpha: mark });
    });
    p.ellipse(50, 86, 15 - 5 * (1 - press), 3, { fill: 'smoke', line: false, alpha: 0.5 * press });
    p.pivot(50, 66 + dy, 0, [1 + 0.06 * sq, 1 - 0.08 * sq], function () {
      p.move(0, dy);
      p.circle(50, 22, 9, { fill: 'wood' });
      p.rect(45, 28, 10, 22, { fill: 'wood', r: 3 });
      p.rect(32, 49, 36, 7, { fill: 'brown', r: 2 });
      p.rect(34, 56, 32, 10, { fill: 'red', r: 2 });
      p.line(47, 33, 47, 45, { ink: 'white', w: 0.5, alpha: 0.6, detail: true });
    });
  }
});

D.add('wrench', {
  fam: 'work', tags: ['spanner', 'fix', 'repair', 'tool', 'plumber', 'mechanic', 'maintenance', 'settings', '🔧'], loop: 1.6, still: 0.25, burst: 'spark', burstAt: [64, 40], burstN: 5, burstSpread: 3, tapLen: 1.1, margin: [20, 20, 20, 20],
  about: 'the spanner works a nut back and forth, a quarter turn at a time', tapAbout: 'one hard pull and the spanner spins the nut all the way round',
  draw: function (p, t, s) {
    var rock = 0.32 * sin(TAU * t) + 0.08 * sin(TAU * 2 * t + 0.5), spin = s.tap >= 0 ? TAU * eo(seg(s.tap, 0.05, 0.8)) : 0, a = 2.36 + rock + spin;
    if (!p.small && s.tap < 0) { var v = cos(TAU * t); for (var i = 0; i < 2; i++) p.arc(64, 40, 34 + 5 * i, a + 0.4 - 0.25 * v, a + 0.75 - 0.25 * v, { w: 0.45, ink: 'b', alpha: Math.abs(v) * 0.9, detail: true }); }
    p.at(64, 40, a, 0.92, function () {
      p.rect(15, -5, 48, 10, { fill: 'grey', r: 5 });
      p.path('M-13 -7 C-15 -21 9 -24 17 -12 C21 -5 21 5 17 12 C9 24 -15 21 -13 7 L7 7 L7 -7 Z', { fill: 'grey' });
      p.line(24, -1.5, 54, -1.5, { ink: 'white', w: 0.5, alpha: 0.7, detail: true });
      p.circle(52, 0, 2.4, { fill: 'bg', w: 0.7 });
      p.at(0, 0, -rock * 0.2, 1, function () {
        var h = []; for (var k = 0; k < 6; k++) h.push([8 * cos(k * PI / 3 + PI / 6), 8 * sin(k * PI / 3 + PI / 6)]);
        p.poly(h, { fill: 'a', w: 0.9 }); p.circle(0, 0, 3, { fill: 'bg', w: 0.7 });
      });
    });
  }
});

D.add('laptop', {
  fam: 'work', tags: ['computer', 'website', 'web', 'site', 'app', 'online', 'build', 'code', '💻'], loop: 3.6, still: 0.72, ratio: 1.25, burst: 'confetti', burstAt: [62, 36], burstN: 9, burstSpread: 3, tapLen: 1.4, margin: [18, 18, 14, 18],
  about: 'a web page builds itself on the screen: the bar, the picture, the words, the button; then it clears for the next', tapAbout: 'the page goes live: a big tick and confetti',
  draw: function (p, t, s) {
    var gone = 1 - ez(seg(t, 0.86, 0.98)), bar = ez(seg(t, 0.04, 0.18)), pic = M.spring(seg(t, 0.18, 0.36)), btn = M.spring(seg(t, 0.6, 0.76)), tick = s.tap >= 0 ? s.tap : -1;
    p.path('M6 86 L119 86 L110 75 L15 75 Z', { fill: 'stone' });
    p.line(52, 81, 73, 81, { w: 0.6, detail: true });
    p.rect(19, 14, 87, 62, { fill: 'night', r: 5 });
    p.rect(24, 19, 77, 51, { fill: 'white', r: 2, w: 0.6 });
    p.clip(function () { p.rect(24, 19, 77, 51, { r: 2 }); }, function () {
      if (bar > 0) p.rect(24, 19, 77 * bar, 9, { fill: 'a', line: false, alpha: gone });
      if (pic > 0.01 && gone > 0.01) p.pivot(43, 45, 0, Math.max(0.01, pic), function () { p.rect(29, 33, 28, 22, { fill: 'sky', w: 0.6, alpha: gone }); p.path('M30 54 L39 44 L46 50 L50 46 L56 54 Z', { fill: 'leaf', line: false, alpha: gone }); p.dot(50, 38, 2.4, 'a'); });
      for (var i = 0; i < 3; i++) { var u = ez(seg(t, 0.36 + 0.07 * i, 0.46 + 0.07 * i)); if (u > 0 && gone > 0.02) p.draw('M62 ' + (36 + 7 * i) + ' L' + (i === 2 ? 84 : 94) + ' ' + (36 + 7 * i), u, { ink: 'stone', w: 0.9, alpha: gone }); }
      if (btn > 0.01 && gone > 0.01) p.pivot(73, 61, 0, Math.max(0.01, btn), function () { p.rect(62, 57, 22, 8, { fill: 'b', r: 4, w: 0.6, alpha: gone }); });
      if (tick >= 0) { p.rect(24, 19, 77, 51, { fill: 'mint', line: false, alpha: 0.85 * bump(seg(tick, 0, 1)) }); p.at(12, -6, 0, 1, function () { p.draw(TICK, ez(seg(tick, 0.1, 0.45)), { ink: 'green', w: 2.4, alpha: 1 - ez(seg(tick, 0.8, 1)) }); }); }
    });
  }
});

D.add('server', {
  fam: 'work', tags: ['hosting', 'server', 'security', 'patch', 'php', 'wordpress', 'database', 'cloud', 'protect'], loop: 2, still: 0.15, burst: 'spark', burstAt: [50, 30], burstN: 5, burstSpread: 3, tapLen: 1.4, margin: [18, 20, 14, 20],
  about: 'three units hum, their lights blinking out of step', tapAbout: 'a shield springs up in front with a tick on it',
  draw: function (p, t, s) {
    var sh = s.tap >= 0 ? M.spring(seg(s.tap, 0.05, 0.5)) * (1 - ez(seg(s.tap, 0.82, 1))) : 0;
    p.rect(30, 90, 8, 4, { fill: 'night', w: 0.6 }); p.rect(62, 90, 8, 4, { fill: 'night', w: 0.6 });
    for (var i = 0; i < 3; i++) {
      var y = 12 + 26 * i, n = [2, 3, 4][i];
      p.rect(24, y, 52, 22, { fill: 'grey', r: 4 });
      p.rect(28, y + 4, 44, 14, { fill: 'night', r: 2, w: 0.6 });
      p.dot(35, y + 11, 2.6, M.wave(t, n, 0.13 * i) > -0.2 ? 'leaf' : 'green');
      p.dot(43, y + 11, 2.6, M.wave(t, n + 1, 0.4 + 0.11 * i) > 0.3 ? 'a' : 'brown');
      if (!p.small) for (var k = 0; k < 4; k++) { var hgt = 3 + 3.5 * (1 + M.wave(t, n + k, 0.21 * k + 0.1 * i)); p.line(52 + 5 * k, y + 15, 52 + 5 * k, y + 15 - hgt, { ink: k % 2 ? 'mint' : 'stone', w: 0.6, detail: true }); }
    }
    if (sh > 0.01) p.pivot(50, 52, 0, sh, function () { p.path(SHIELD, { fill: 'c', w: 1.2 }); p.draw(TICK, 1, { ink: 'white', w: 2 }); });
  }
});

D.add('parcel', {
  fam: 'work', tags: ['box', 'package', 'shipping', 'delivery', 'post', 'send', 'order', 'moving', '📦'], loop: 1.8, still: 0.1, burst: 'confetti', burstAt: [50, 36], burstN: 9, burstSpread: 2.8, burstDelay: 0.35, tapLen: 1.5, margin: [22, 18, 12, 18],
  about: 'the box hops, squashes on landing and settles', tapAbout: 'the flaps pop open and something bright flies out',
  draw: function (p, t, s) {
    var up = bump(seg(t, 0.12, 0.5)), land = bump(seg(t, 0.48, 0.66)), crouch = bump(seg(t, 0, 0.12)) + bump(seg(t, 0.88, 1)), sq = 0.08 * land + 0.05 * crouch - 0.05 * up;
    var open = s.tap >= 0 ? M.spring(seg(s.tap, 0.05, 0.42)) * (1 - ez(seg(s.tap, 0.78, 1))) : 0, dy = -14 * eo(up) * (s.tap >= 0 ? 0.3 : 1);
    p.ellipse(52, 93, 26 - 8 * up, 3, { fill: 'smoke', line: false, alpha: 0.6 });
    p.pivot(52, 92, 0, [1 + sq, 1 - sq], function () {
      p.move(0, dy);
      if (open > 0.01) {
        p.pivot(31, 42, -1.9 * open, 1, function () { p.path('M31 42 L52 50 L46 34 L24 27 Z', { fill: 'sand' }); });
        p.pivot(73, 48, 1.7 * open, 1, function () { p.path('M52 50 L73 48 L80 32 L58 34 Z', { fill: 'sand' }); });
      }
      p.path('M20 44 L52 52 L52 92 L20 84 Z', { fill: 'wood' });
      p.path('M52 52 L84 42 L84 82 L52 92 Z', { fill: 'sand' });
      if (open < 0.02) { p.path('M20 44 L52 34 L84 42 L52 52 Z', { fill: 'sand' }); p.line(36, 39, 68, 47, { ink: 'brown', w: 1.4, alpha: 0.6 }); }
      p.line(36, 48, 36, 88, { ink: 'brown', w: 1.4, alpha: 0.6 });
      p.rect(58, 60, 18, 12, { fill: 'white', w: 0.6, r: 1 });
      p.line(61, 64, 73, 64, { ink: 'navy', w: 0.4, detail: true }); p.line(61, 68, 70, 68, { ink: 'navy', w: 0.4, detail: true });
    });
  }
});

D.add('passport', {
  fam: 'work', tags: ['visa', 'travel', 'id', 'immigration', 'permit', 'border', 'identity', '🛂'], loop: 2.8, still: 0.1, burst: 'ring', burstAt: [42, 60], burstN: 6, burstSpread: 2.6, burstColor: 'red', burstDelay: 0.5, tapLen: 1.8, margin: [18, 52, 18, 52],
  about: 'the cover lifts a little, as if someone peeks inside, and falls shut', tapAbout: 'it opens wide and a red entry stamp comes down on the page',
  draw: function (p, t, s) {
    var peek = 0.22 * bump(seg(t, 0.3, 0.75)), open = s.tap >= 0 ? ez(seg(s.tap, 0.02, 0.28)) * (1 - ez(seg(s.tap, 0.82, 1))) : 0, k = Math.max(peek, open), sx = cos(PI * k);
    var stampU = s.tap >= 0 ? s.tap : -1;
    p.rect(30, 15, 44, 70, { fill: 'cream', r: 3 });
    for (var i = 0; i < 3; i++) p.line(70 + i, 18, 70 + i, 82, { ink: 'stone', w: 0.4, detail: true });
    if (k > 0.3) {
      p.rect(36, 24, 13, 16, { fill: 'sky', w: 0.6 }); p.circle(42.5, 30, 3.2, { fill: 'skin', w: 0.5 });
      p.line(53, 27, 68, 27, { ink: 'navy', w: 0.5 }); p.line(53, 33, 65, 33, { ink: 'navy', w: 0.5 });
      if (stampU > 0.5) { var m = M.spring(seg(stampU, 0.5, 0.62)); p.at(52, 62, -0.2, 0.6 + 0.4 * m, function () { p.rect(-14, -8, 28, 16, { ink: 'red', fill: false, r: 3, w: 1 }); p.line(-9, -2, 9, -2, { ink: 'red', w: 0.8 }); p.line(-9, 3, 5, 3, { ink: 'red', w: 0.8 }); }); }
    }
    p.pivot(30, 50, 0, [sx, 1], function () {
      p.rect(30, 14, 44, 72, { fill: sx < 0 ? 'cream' : 'navy', r: 4 });
      if (sx > 0) { p.circle(52, 42, 9, { ink: 'gold', fill: false, w: 1 }); p.circle(52, 42, 4, { fill: 'gold', line: false }); p.line(42, 62, 62, 62, { ink: 'gold', w: 0.8 }); p.line(45, 68, 59, 68, { ink: 'gold', w: 0.6 }); }
    });
  }
});

})(Dingbats);
