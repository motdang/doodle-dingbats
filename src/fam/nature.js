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
})(Dingbats);
