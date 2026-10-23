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
/* the hongsa (หงส์), Hongdam's black swan: a curled Lanna feather, a red bill with its white band */
function feather(p, x, y, ang, len, ph, small) {
  p.at(x, y, ang, 1, function () {
    var sp = bez([0, 0], [-len * 0.18, -len * 0.42], [-len * 0.5, -len * 0.78], [-len * 0.95, -len * 0.82], 14), n = sp.length;
    var h = Math.atan2(sp[n - 1][1] - sp[n - 2][1], sp[n - 1][0] - sp[n - 2][0]), st = Math.hypot(sp[n - 1][0] - sp[n - 2][0], sp[n - 1][1] - sp[n - 2][1]), q = sp[n - 1].slice(), k, curl = 0.42 + 0.05 * Math.sin(TAU * ph);
    for (k = 0; k < 18; k++) { h -= curl; st *= 0.9; q = [q[0] + Math.cos(h) * st, q[1] + Math.sin(h) * st]; sp.push(q); }
    tube(p, sp, function (s) { return 8 * Math.pow(1 - s, 0.85) + 0.9; }, { fill: 'black' });
    if (!small) p.curve(sp.slice(3, sp.length - 3), { ink: 'a', w: 0.5, wob: 0.4 });
  });
}
function swanWing(p, x, y, ang, k, far) {
  if (k < 0.02) return;
  p.at(x, y, ang, k, function () {
    p.path('M0 0 C-4 -20 -22 -36 -46 -38 C-40 -31 -38 -25 -40 -18 C-33 -16 -29 -9 -31 -2 C-20 -3 -9 -1 0 0 Z', { fill: far ? 'night' : 'black' });
    [[-41, -31, 0.5], [-37, -22, 0.35], [-34, -13, 0.2], [-27, -6, 0.1]].forEach(function (f) { p.ellipse(f[0], f[1], 5.2, 2.2, { fill: 'white', w: 0.5, rot: f[2] }); });
  });
}
D.add('hongsa', {
  fam: 'lanna', tags: ['swan', 'black swan', 'hamsa', 'hongdam', 'bird', 'water', 'float', 'lanna', '🦢'], loop: 3, still: 0.2, ratio: 1.2, burst: 'spark', burstAt: [62, 30], burstN: 6, burstSpread: 3, burstColor: 'gold', tapLen: 1.6, tapRest: 0.45, margin: [26, 16, 14, 16],
  about: 'the black swan rides the water: it bobs, its neck sways a beat behind, its curled feathers lift in the breeze, rings spread from its breast', tapAbout: 'it rears up and opens its wings, the white flight feathers flashing, then settles back on the water',
  draw: function (p, t, s) {
    var q = s.tap >= 0 ? s.tap : 0, lift = s.tap >= 0 ? M.ease(M.seg(q, 0.04, 0.3)) * (1 - M.ease(M.seg(q, 0.72, 1))) : 0, flap = lift * 0.28 * Math.sin(TAU * 2 * q), bob = 1.3 * M.wave(t, 1) - 3 * lift, k;
    if (!p.small) {
      for (k = 0; k < 2; k++) { var u = M.frac(t + k / 2); p.ellipse(80, 83, 6 + 18 * u, 1.6 + 2.4 * u, { ink: 'sky', w: 0.6, alpha: 0.9 * (1 - u), fill: false }); }
      p.curve(sinew(4, 116, 90, 1.1, 26, t + 0.3), { ink: 'sky', w: 0.5, alpha: 0.6 });
    }
    p.curve(sinew(8, 112, 84, 1.4, 22, t), { ink: 'sky', w: 0.8 });
    p.move(0, bob);
    swanWing(p, 58, 58, -0.25 + flap, lift, true);
    feather(p, 36, 60, 0.12 + 0.05 * M.wave(t, 1, 0.1), 30, t, p.small);
    feather(p, 46, 57, 0.36 + 0.05 * M.wave(t, 1, 0.16), 36, t + 0.3, p.small);
    feather(p, 56, 58, 0.62 + 0.04 * M.wave(t, 1, 0.22), 26, t + 0.6, p.small);
    p.path('M20 63 C28 51 52 51 68 56 C80 60 87 66 83 74 C77 82 44 84 30 79 C21 75 17 69 20 63 Z', { fill: 'black' });
    if (!p.small) p.path('M34 63 C38 60 42 61 45 63 C48 60 52 61 55 64 C58 61 62 62 65 65', { ink: 'grey', w: 0.5, detail: true });
    p.pivot(76, 64, 0.05 * M.wave(t, 1, 0.06) - 0.14 * lift, 1, function () {
      tube(p, bez([74, 64], [87, 51], [76, 37], [89, 24], 16), function (s) { return 9.5 - 3.8 * s; }, { fill: 'black' });
      p.ellipse(91, 23, 7.4, 5.4, { fill: 'black', rot: -0.15 });
      p.path('M96 20 L111 25 C111.6 27.2 109.2 28.6 106.4 28.4 L96 27.6 Z', { fill: 'red' });
      p.line(105, 23.6, 104.5, 28.2, { ink: 'white', w: 1, wob: 0.3 });
      p.dot(92, 21.2, 1.8, 'red'); p.dot(92.5, 20.7, 0.6, 'white');
    });
    swanWing(p, 56, 60, -0.05 + flap * 1.2, lift, false);
  }
});
})(Dingbats);
