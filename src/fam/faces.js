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
