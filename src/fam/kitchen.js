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
