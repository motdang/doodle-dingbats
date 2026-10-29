/* Tigers (เสือ): one tiger, head-on, stalking, pouncing, roaring, napping, as a cub, and the twin tigers of a sak yant. */
(function (D) {
'use strict';
var M = D.math, TAU = M.TAU, PI = Math.PI, W = M.wave, seg = M.seg, eo = M.easeOut, ei = M.easeIn, bump = M.bump, lerp = M.lerp, clamp = M.clamp, frac = M.frac, ease = M.ease, sp = M.spring;
var COAT = 'orange', FAR = '#D5661A', DARK = 'black', MOUTH = '#B8323A';

/* a window of the loop that starts at a and lasts d, wrapping past the seam: 0..1 inside, -1 outside */
function win(t, a, d) { var u = frac(t - a) / d; return u < 1 ? u : -1; }
function pulse(t, a, d) { var u = win(t, a, d); return u < 0 ? 0 : bump(u); }
function bez(a, b, c, d, n) {
  var o = [], i, u, v;
  for (i = 0; i <= n; i++) { u = i / n; v = 1 - u; o.push([v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0], v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1]]); }
  return o;
}
/* the left and right edges of a ribbon along a spine, w(s) wide at s in 0..1, from point i0 to i1 */
function edges(sp, w, i0, i1) {
  var n = sp.length, L = [], R = [], i, a, b, d, h;
  for (i = i0; i <= i1; i++) {
    a = sp[Math.max(0, i - 1)]; b = sp[Math.min(n - 1, i + 1)]; d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; h = w(i / (n - 1)) / 2;
    L.push([sp[i][0] - (b[1] - a[1]) / d * h, sp[i][1] + (b[0] - a[0]) / d * h]); R.push([sp[i][0] + (b[1] - a[1]) / d * h, sp[i][1] - (b[0] - a[0]) / d * h]);
  }
  return [L, R];
}
/* the far end of a ribbon, rounded: points around e from the left edge to the right */
function roundEnd(e, Lend, h, m) {
  var a0 = Math.atan2(Lend[1] - e[1], Lend[0] - e[0]), o = [], k;
  m = m || 6;
  for (k = 1; k < m; k++) o.push([e[0] + Math.cos(a0 - PI * k / m) * h, e[1] + Math.sin(a0 - PI * k / m) * h]);
  return o;
}
/* a smooth closed ribbon along a spine (tails, necks, a trunk of fur) */
function tube(p, sp, w, o) {
  var n = sp.length, LR = edges(sp, w, 0, n - 1), cap = roundEnd(sp[n - 1], LR[0][n - 1], w(1) / 2);
  return p.curve(LR[0].concat(cap, LR[1].reverse()), Object.assign({ close: true }, o));
}
/* a black wedge stripe: wide where it starts, thinning to a point; a, b, c are the points it passes through */
function wedge(p, a, b, c, w, o) {
  var sp = [], i, u, v, LR;
  for (i = 0; i <= 8; i++) { u = i / 8; v = 1 - u; sp.push([v * v * a[0] + 2 * v * u * b[0] + u * u * c[0], v * v * a[1] + 2 * v * u * b[1] + u * u * c[1]]); }
  LR = edges(sp, function (s) { return w * Math.pow(1 - s, 0.8); }, 0, 8);
  p.poly(LR[0].concat(LR[1].reverse()), Object.assign({ fill: DARK, line: false }, o || {}));
}
/* an amber eye with a round pupil, a lid coming down in the coat's colour: lid 0 open, 1 shut; once shut, happy bends it from a sleepy droop into a smile-arch */
function eye(p, x, y, r, lid, lx, ly, happy, pupil) {
  if (lid > 0.92 || happy > 0.3) { p.path('M' + (x - r) + ' ' + (y + 0.5) + ' Q' + x + ' ' + (y + r * lerp(0.8, -1.15, happy || 0)) + ' ' + (x + r) + ' ' + (y + 0.5), { w: 1.15, cap: 'round' }); return; }
  p.circle(x, y, r, { fill: 'gold', w: 0.85 });
  p.circle(x + lx * r * 0.28, y + ly * r * 0.28, r * 0.56 * (pupil || 1), { fill: DARK, line: false });
  p.dot(x + lx * r * 0.28 - r * 0.2, y + ly * r * 0.28 - r * 0.22, r * 0.2, 'white');
  if (lid > 0.04) {
    var yc = y - r + 2 * r * lid, hw = Math.sqrt(Math.max(0, r * r - (yc - y) * (yc - y)));
    p.path('M' + (x - hw - 0.4) + ' ' + yc + ' A' + r + ' ' + r + ' 0 ' + (lid > 0.5 ? 1 : 0) + ' 1 ' + (x + hw + 0.4) + ' ' + yc + ' Z', { fill: COAT, w: 0.9 });
  }
}

/* ---------------------------------------------------------------------------------------------
   the face, head-on
   --------------------------------------------------------------------------------------------- */
/* the head's outline, as path data: dj drops the jaw, f flares the cheek ruffs */
function faceShape(dj, f) {
  var R = [['C', 64, 14, 78, 19, 85, 29], ['C', 89, 35, 90, 41, 90, 46], ['L', 97 + f, 52], ['L', 91, 56], ['L', 98 + f, 65], ['L', 91, 67], ['L', 95 + f, 77 + dj * 0.4], ['L', 86, 76 + dj * 0.5], ['C', 80, 86 + dj, 66, 91 + dj, 50, 91 + dj]];
  var d = 'M50 14', i, c, k;
  for (i = 0; i < R.length; i++) { c = R[i]; d += c[0]; for (k = 1; k < c.length; k += 2) d += (k > 1 ? ' ' : '') + c[k] + ' ' + c[k + 1]; }
  /* the left half, walking back up: the same points mirrored */
  d += 'C34 ' + (91 + dj) + ' 20 ' + (86 + dj) + ' 14 ' + (76 + dj * 0.5) + 'L' + (5 - f) + ' ' + (77 + dj * 0.4) + 'L9 67L' + (2 - f) + ' 65L9 56L' + (3 - f) + ' 52L10 46C10 41 11 35 15 29C22 19 36 14 50 14Z';
  return d;
}
function earF(p, x, y, d, rot) {
  p.pivot(x, y + 10, rot, 1, function () {
    p.path('M' + (x - 11) + ' ' + (y + 9) + ' C' + (x - 13) + ' ' + (y - 3) + ' ' + (x - 7) + ' ' + (y - 12) + ' ' + x + ' ' + (y - 12) + ' C' + (x + 7) + ' ' + (y - 12) + ' ' + (x + 13) + ' ' + (y - 3) + ' ' + (x + 11) + ' ' + (y + 9) + ' Z', { fill: COAT, w: 1.05 });
    p.path('M' + (x - 6.5) + ' ' + (y + 8) + ' C' + (x - 8) + ' ' + y + ' ' + (x - 4.5) + ' ' + (y - 7) + ' ' + x + ' ' + (y - 7.5) + ' C' + (x + 4.5) + ' ' + (y - 7) + ' ' + (x + 8) + ' ' + y + ' ' + (x + 6.5) + ' ' + (y + 8) + ' Z', { fill: 'cream', w: 0.5 });
    p.path('M' + (x - 3.5) + ' ' + (y + 6) + ' C' + (x - 4) + ' ' + (y + 1) + ' ' + (x - 2) + ' ' + (y - 3) + ' ' + x + ' ' + (y - 3.4), { w: 0.4, detail: true, ink: 'brown' });
  });
}
/* the face head-on, drawn in its own 100 x 100: o.op yawn 0..1, o.lid, o.happy (shut as a smile), o.look (the pupils, one number or [left, right]), o.earL, o.earR, o.cub (bigger eyes, for a cub) */
function faceFront(p, t, o) {
  var op = o.op || 0, lid = o.lid || 0, happy = o.happy || 0, cub = o.cub || 0, dj = 11 * op, fl = 5 * op, i, shape = faceShape(dj, fl);
      earF(p, 24, 24, -1, -0.28 - o.earL); earF(p, 76, 24, 1, 0.28 + o.earR);
      p.path(shape, { fill: 'white', line: false });
      p.clip(shape, function () {
        p.path('M-4 -4 L104 -4 L104 46 L90 46 C80 50 70 55 60 58 L60 72 L40 72 L40 58 C30 55 20 50 10 46 L-4 46 Z', { fill: COAT, line: false });
        [-1, 1].forEach(function (d) {
          var X = function (x) { return 50 + d * (x - 50); };
          p.ellipse(X(32.5), 36 - 0.5, 6.4, 2.9, { fill: 'white', line: false, rot: d * 0.32 });
          wedge(p, [X(91), 57], [X(84), 57.5], [X(75), 60], 4, {}); wedge(p, [X(91), 67], [X(85), 66], [X(77), 68], 3.6, {});
          wedge(p, [X(91), 42], [X(80), 41.5], [X(71), 44], 4.4, {}); wedge(p, [X(88), 33], [X(80), 34], [X(72), 37.5], 4.2, {});
          wedge(p, [X(79), 21], [X(75), 25], [X(70), 29.5], 4.2, {}); wedge(p, [X(61), 14], [X(58), 20], [X(55.6), 28], 4.6, {});
          wedge(p, [X(25.5), 47], [X(20), 51], [X(14), 56], 3.4, {});
        });
        p.ellipse(50, 73 + dj * 0.2, 21, 15 + dj * 0.4, { fill: 'white', line: false });
        wedge(p, [50, 13], [50, 21], [50, 31.5], 6, {});
      });
      p.path(shape, { w: 1.15 });
      /* whisker pads, spots, whiskers */
      p.path('M30 66 C30 77 43 78 50 72', { w: 0.45, detail: true }); p.path('M70 66 C70 77 57 78 50 72', { w: 0.45, detail: true });
      [[36, 66], [41, 64], [44.5, 67], [36, 71], [41.5, 70]].forEach(function (c) { p.dot(c[0], c[1] + dj * 0.2, 0.95, DARK); p.dot(100 - c[0], c[1] + dj * 0.2, 0.95, DARK); });
      for (i = 0; i < 3; i++) [-1, 1].forEach(function (d) {
        var wv = 2.4 * W(t, 2, i * 0.12 - d * 0.1) * (1 - 0.7 * Math.min(1, op * 4)) - 8 * op, y0 = 67 + i * 3.2 + dj * 0.2;
        p.curve([[50 + d * 15, y0], [50 + d * 27, y0 + (i - 1) * 3.4 + wv * 0.4], [50 + d * 41 + d * 4 * op, y0 + (i - 1) * 6 + wv]], { w: 0.4, detail: true });
      });
      /* eyes */
      [-1, 1].forEach(function (d) {
        var x = 50 + d * 17, er = 6 + 1.6 * cub; eye(p, x, 45 + 2 * cub, er, lid, typeof o.look === 'number' ? o.look : (d < 0 ? o.look[0] : o.look[1]), o.ly == null ? 0.2 : o.ly, happy, o.pupil);
        if (lid < 0.9) p.path('M' + (x - d * (er + 1.6)) + ' ' + (45 + 2 * cub) + ' C' + (x - d * er) + ' ' + (38.5 + 2 * cub - cub) + ' ' + (x + d * 2) + ' ' + (37.5 + 2 * cub - cub) + ' ' + (x + d * (er + 1)) + ' ' + (41.5 + 2 * cub), { w: 0.95, cap: 'round' });
        p.path('M' + (50 + d * 9) + ' 46 C' + (50 + d * 7.5) + ' 50 ' + (50 + d * 6) + ' 52.5 ' + (50 + d * 5.5) + ' 54', { w: 0.45, detail: true });
      });
      /* nose and mouth */
      p.path('M42 54.5 C42 51 58 51 58 54.5 C58 58.5 53 62.5 50 63.5 C47 62.5 42 58.5 42 54.5 Z', { fill: 'rose', w: 0.85 });
      p.path('M45 54 C46 53 48 52.8 49 53', { w: 0.4, detail: true, ink: 'white' });
      if (op < 0.06) {
        p.path('M50 63.5 L50 68.5 M50 68.5 C48 72.5 43 73.5 39.5 70 M50 68.5 C52 72.5 57 73.5 60.5 70', { w: 0.75 });
      } else {
        var by = 68 + 24 * op + dj * 0.3, tq = 3 + 8 * op, ww = 3.5 * op, md = 'M' + (39 - ww) + ' 70 C' + (41 - ww * 0.6) + ' 66 46 67.5 50 68.5 C54 67.5 ' + (59 + ww * 0.6) + ' 66 ' + (61 + ww) + ' 70 C' + (63 + ww) + ' ' + (by - 12) + ' 58 ' + by + ' 50 ' + by + ' C42 ' + by + ' ' + (37 - ww) + ' ' + (by - 12) + ' ' + (39 - ww) + ' 70 Z';
        p.path(md, { fill: MOUTH, w: 0.9 });
        p.clip(md, function () {
          p.ellipse(50, by - 1.5, 10 + ww, tq, { fill: 'pink', w: 0.6 }); p.line(50, by - tq * 1.1, 50, by - 1.5, { w: 0.4, detail: true });
        });
        p.path('M42.5 68.4 L46.2 68.4 L44.4 ' + (68.4 + 9 * op) + ' Z', { fill: 'white', w: 0.5 }); p.path('M53.8 68.4 L57.5 68.4 L55.6 ' + (68.4 + 9 * op) + ' Z', { fill: 'white', w: 0.5 });
        p.path('M43.6 ' + by + ' L46 ' + by + ' L44.8 ' + (by - 5.5 * op) + ' Z', { fill: 'white', w: 0.5 }); p.path('M54 ' + by + ' L56.4 ' + by + ' L55.2 ' + (by - 5.5 * op) + ' Z', { fill: 'white', w: 0.5 });
      }
}

D.add('tiger-face', {
  fam: 'tiger', tags: ['tiger', 'big cat', 'face', 'stripes', 'whiskers', 'zoo', 'jungle', 'animal', 'wild', 'year of the tiger', 'เสือ', 'หน้าเสือ'], loop: 3, still: 0.1, tapLen: 2, tapRest: 0.55,
  burst: false, margin: [10, 24, 6, 24], tapMargin: [14, 32, 10, 32],
  about: 'blinks, the ears twitch one after the other, the whiskers flutter and the eyes drift', tapAbout: 'a big friendly yawn-roar: the jaw drops, the eyes squeeze shut, the ruffs flare and sound arcs go out',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, op = tap ? eo(seg(q, 0.04, 0.28)) * (1 - ei(seg(q, 0.74, 0.96))) : 0, hold = tap ? bump(seg(q, 0.04, 0.96)) : 0;
    var lid = tap ? clamp(op * 3, 0, 1) : Math.max(pulse(t, 0.56, 0.07), pulse(t, 0.64, 0.06)), happy = tap ? ease(seg(op, 0.45, 1)) : 0;
    var earL = 0.2 * pulse(t, 0.3, 0.12) + (tap ? -0.25 * hold : 0), earR = 0.2 * pulse(t, 0.37, 0.12) + (tap ? -0.25 * hold : 0);
    var look = 0.7 * W(t, 1, 0.1), sway = tap ? -0.025 * op : 0.03 * W(t, 1, 0.2), dj = 9 * op, fl = 5 * op, i, d;
    var shape = faceShape(dj, fl);
    p.pivot(50, 92, sway, [1 + 0.012 * W(t, 2) + 0.03 * op, 1 + 0.012 * W(t, 2, 0.25) - 0.02 * op], function () {
      p.move(0, -4 * op);
      p.move(0, 0);
      faceFront(p, t, { op: op, lid: lid, happy: happy, look: look, earL: earL, earR: earR });
    });
    /* sound arcs on a yawn, drawn and taken back */
    if (tap) [0, 1, 2].forEach(function (k) {
      var a = seg(q, 0.2 + k * 0.1, 0.5 + k * 0.1), b = ei(seg(q, 0.52 + k * 0.1, 0.9)), r = 6 + k * 6;
      [-1, 1].forEach(function (d) { p.span('M' + (50 + d * (50 + r * 0.6)) + ' ' + (50 - r * 0.9) + ' C' + (50 + d * (56 + r)) + ' ' + (50 - r * 0.4) + ' ' + (50 + d * (56 + r)) + ' ' + (50 + r * 0.4) + ' ' + (50 + d * (50 + r * 0.6)) + ' ' + (50 + r * 0.9), b, eo(a), { w: 0.7 }); });
    });
  }
});

/* ---------------------------------------------------------------------------------------------
   the head in profile, facing right; drawn about the eye at (0, 0), nose tip at x = 38, about 60 long, crown at y = -27.
   o: open (0..1, the jaw swung down about the hinge), ear (radians), lid (0 open .. 1 shut), snarl (0..1, wrinkles on the nose),
   wv (whiskers' wave), flare (the ruff blown out), sleep (the eye a closed arc)
   --------------------------------------------------------------------------------------------- */
var UPPER = 'M-22 7 C-27 -3 -25 -17 -13 -24 C-5 -28 8 -27 16 -21 C22 -17 26 -13 29 -9.5 C32 -7 36 -6.5 37.5 -2 C38.5 1.5 36.5 5 32.5 6 C30.5 7.6 27.5 8 24.5 7.6 C17 8 9 8.5 3 8 C-4 9.5 -14 11 -22 7 Z';
var JAW = 'M3 8 C11 7.5 19 7.5 26 7.5 C31 8 32.5 13 29.5 17.5 C24 22.5 12 22.5 4 20 C-2 18.5 -6 15 -6 9 Z';
function headSide(p, o) {
  var op = o.open || 0, ang = 0.9 * op, wv = o.wv || 0, fl = o.flare || 0, sn = o.snarl || 0, small = p.small, lid = o.lid || 0;
  /* the ear, behind the skull */
  p.pivot(-10, -20, o.ear || 0, 1, function () {
    p.path('M-20 -17 C-22.5 -29 -16 -37 -9 -36 C-2 -35 2 -27 -1 -18 Z', { fill: COAT, w: 1.05 });
    p.path('M-16.5 -18.5 C-18 -27 -13 -32.5 -9 -32 C-5 -31.6 -3 -26 -4 -18.5 Z', { fill: 'cream', w: 0.45 });
    p.path('M-19.5 -17.5 C-21.5 -28 -16 -35.5 -9 -35 C-2.5 -34.5 1 -27 -1.2 -18.5', { w: 1.15 });
  });
  /* the inside of the mouth, the lower jaw with its tongue and fang, swung open */
  if (op > 0.03) {
    var tipx = 30 * Math.cos(ang) + 0.5 * Math.sin(ang), tipy = 8 + 30 * Math.sin(ang) - 0.5 * Math.cos(ang);
    p.path('M2 8 L31 7.6 L' + tipx + ' ' + tipy + ' Z', { fill: MOUTH, line: false });
    p.path('M22 7.5 L30 7.5 L26.6 ' + (7.5 + 14 * op) + ' Z', { fill: 'white', w: 0.65 });
    if (!small) p.path('M7 10 C13 12.4 20 12.4 26 11', { w: 0.4, detail: true, ink: 'brown' });
    p.pivot(0, 8, ang, 1, function () {
      p.path('M3.5 8.4 C8 3.2 18 2.2 27 5.5 C29 8 23 11.8 13 11.8 C7 11.8 4.4 10.4 3.5 8.4 Z', { fill: 'pink', w: 0.65 });
      p.path('M8 8.2 C14 6.8 21 6.6 25.5 7.2', { w: 0.4, detail: true, ink: 'rose' });
      p.path(JAW, { fill: 'white' });
      p.path('M23.5 7.8 L30 7.8 L27.4 ' + (7.8 - 10 * op) + ' Z', { fill: 'white', w: 0.65 });
      p.path('M28 9 C30 11.4 29.6 13.6 27.6 15', { w: 0.4, detail: true });
    });
  } else {
    p.path(JAW, { fill: 'white' });
  }
  /* the head */
  p.path(UPPER, { fill: COAT, line: false });
  p.clip(UPPER, function () {
    p.path('M44 -3.5 C36 -4 26 -3.5 18 -1 C9 1.6 -2 5 -30 9 L-30 30 L44 30 Z', { fill: 'white', line: false });
    p.ellipse(7, -17.6, 5.2, 2.2, { fill: 'white', line: false, rot: -0.2 });
    wedge(p, [-6, -28], [-5, -22], [-4.2, -15], 4.2, {}); wedge(p, [2.5, -29], [3.4, -23], [3.6, -16.5], 4.2, {}); wedge(p, [11, -26.5], [11, -22], [10, -17.5], 3.6, {});
    wedge(p, [-27, -12], [-19, -11], [-10, -7.2], 4.4, {}); wedge(p, [-27, -1], [-19, -1], [-11, 1.6], 4, {}); wedge(p, [-26, -21], [-19, -19], [-13, -15], 3.6, {});
  });
  p.path(UPPER, { w: 1.1 });
  /* eye */
  if (o.sleep || lid > 0.93) { p.path('M1.5 -7 Q6 -2.5 10.5 -7', { w: 1.15, cap: 'round' }); p.path('M0 -7.5 C-2 -8.5 -3 -9.5 -3.4 -10.5', { w: 0.5, detail: true }); }
  else {
    p.circle(6, -7.5, 4.7, { fill: 'gold', w: 0.8 });
    p.circle(6.9, -7.4, 2.7 * (o.pupil || 1), { fill: DARK, line: false }); p.dot(7.7, -8.8, 0.9, 'white');
    if (lid > 0.04) { var yc = -7.5 - 4.7 + 9.4 * lid, hw = Math.sqrt(Math.max(0, 4.7 * 4.7 - (yc + 7.5) * (yc + 7.5))); p.path('M' + (6 - hw - 0.4) + ' ' + yc + ' A4.7 4.7 0 ' + (lid > 0.5 ? 1 : 0) + ' 1 ' + (6 + hw + 0.4) + ' ' + yc + ' Z', { fill: COAT, w: 0.8 }); }
    p.path('M0 -7 C2 -12.5 8.5 -13.5 12 -10', { w: 1 + 0.5 * sn, cap: 'round' });
  }
  p.path('M11 -5 C13 -2 14 0 14.5 2.6', { w: 0.5, detail: true });
  if (sn > 0.05 && !small) [[22, -11, 1], [25, -9.4, 0.8], [28, -7.4, 0.6]].forEach(function (c) { p.path('M' + c[0] + ' ' + c[1] + ' C' + (c[0] + 1.6) + ' ' + (c[1] + 2) + ' ' + (c[0] + 1.4) + ' ' + (c[1] + 3.6) + ' ' + (c[0] - 0.4) + ' ' + (c[1] + 4.6), { w: 0.45 * c[2] + 0.2, detail: true }); });
  /* nose, spots, whiskers */
  p.path('M32.5 -7.5 C37 -8 40 -3.5 38 0.6 C37 2.8 34.6 3.6 32.6 2.6 C31 0.2 31.4 -5 32.5 -7.5 Z', { fill: 'rose', w: 0.75 });
  p.dot(35.4, 0, 0.8, DARK);
  [[24, 2], [27, 3], [21, 3.6], [24.5, 5.2], [18, 5.2]].forEach(function (c) { p.dot(c[0], c[1], 0.7, DARK); });
  if (op < 0.03) p.path('M33 3.4 C32.6 5.4 31.6 6.4 29.6 6.9 C25 8.2 14 8.4 4 8 C3 7.6 2.2 6.8 1.6 5.8', { w: 0.7 });
  else p.path('M33 3.4 C32.6 5.4 31.6 6.4 29.6 6.9', { w: 0.7 });
  [[-9, 2], [3, 1], [12, 0]].forEach(function (c, i) {
    var w = (2.2 * W(o.t == null ? 0 : o.t, 2, i * 0.12) + wv) * (i + 1) / 3, x0 = 20, y0 = 1.5 + i * 2;
    p.curve([[x0, y0], [x0 + 11, y0 + c[0] * 0.5 + w * 0.3], [x0 + 23, y0 + c[0] + w]], { w: 0.4, detail: true });
  });
  /* the ruff, tufts blown back */
  var rf = fl * 4;
  p.path('M4 4 C-2 4.5 -8 3.5 -16 4.5 L' + (-26 - rf) + ' ' + (6 + rf * 0.2) + ' L' + (-20.5 - rf * 0.3) + ' 11 L' + (-27.5 - rf) + ' ' + (17 + rf * 0.4) + ' L-18.5 17 L' + (-22 - rf * 0.5) + ' ' + (24 + rf * 0.4) + ' L-11 21 L' + (-12 - rf * 0.3) + ' ' + (28 + rf * 0.3) + ' L-2 20 C3 17 6 12 6 8 Z', { fill: 'white', w: 1 });
  wedge(p, [-25 - rf, 8], [-20, 9], [-13, 8.6], 2.8, {}); wedge(p, [-26.5 - rf, 16], [-21, 15.4], [-14, 13.8], 2.8, {}); wedge(p, [-20 - rf * 0.4, 23], [-15, 21.4], [-9, 18.4], 2.6, {});
}

/* an arc of a circle as path data, a0 to a1 clockwise (y down) */
function arcD(cx, cy, r, a0, a1) { return 'M' + (cx + Math.cos(a0) * r) + ' ' + (cy + Math.sin(a0) * r) + ' A' + r + ' ' + r + ' 0 0 1 ' + (cx + Math.cos(a1) * r) + ' ' + (cy + Math.sin(a1) * r); }

/* the roar: head and shoulders. The mouth swings wide, holds and trembles, and closes; the sound goes out in arcs that are
   drawn and taken back. Tap: a bigger roar, the head thrown back, ruff blown out, whiskers swept, the whole bust shaking. */
D.add('tiger-roar', {
  fam: 'tiger', tags: ['tiger', 'roar', 'big cat', 'fangs', 'growl', 'loud', 'brave', 'angry', 'wild', 'jungle', 'เสือ', 'คำราม'], loop: 3, still: 0.38, tapLen: 2, tapRest: 0.4,
  burst: 'leaf', burstAt: [50, 0], burstN: 4, burstSpread: 3.6, burstDelay: 0.2, burstGravity: 30, margin: [14, 30, 2, 10], tapMargin: [30, 44, 2, 12],
  about: 'the mouth swings wide, holds and trembles, and closes; sound arcs go out, drawn and taken back', tapAbout: 'a bigger roar: head thrown back, ruff blown out, whiskers swept back, the bust shaking, leaves knocked loose',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, big = tap ? eo(seg(q, 0.02, 0.18)) * (1 - ei(seg(q, 0.7, 0.96))) : 0;
    var op = Math.max(ease(seg(t, 0.08, 0.22)) * (1 - ease(seg(t, 0.66, 0.82))), big), trem = op * (0.5 + big) * Math.sin(TAU * 11 * t) * (tap ? Math.sin(TAU * 7 * q) : 1);
    var rot = -0.12 * op - 0.2 * big + 0.015 * W(t, 1), k = 1.2, shake = tap ? 0.9 * big * Math.sin(TAU * 9 * q) : 0;
    var O = [46, 50], i, a0, a1;
    p.move(shake, 0);
    /* neck and shoulders */
    var body = 'M-8 104 C-8 80 0 62 12 50 C18 44 24 42 31 42 L45 68 C51 76 56 90 58 104 Z';
    p.pivot(30, 100, 0.012 * W(t, 1, 0.3) + 0.02 * big, [1, 1 + 0.01 * W(t, 2) + 0.015 * big], function () {
      p.path(body, { fill: COAT, line: false });
      p.clip(body, function () {
        p.path('M38 62 C50 68 57 86 62 110 L30 110 Z', { fill: 'white', line: false });
        wedge(p, [-4, 62], [8, 62], [18, 66.5], 6, {}); wedge(p, [-6, 75], [7, 73.5], [20, 78], 6.5, {}); wedge(p, [-6, 90], [8, 87], [21, 91], 6.5, {});
        wedge(p, [13, 49], [18, 53], [20.5, 59], 5, {}); wedge(p, [23, 44], [26, 49], [28, 55], 4.4, {}); wedge(p, [31, 66], [37, 64], [41, 64.5], 2.4, {});
      });
      p.path(body, { w: 1.15 });
      p.path('M17 68 C24 72 30 80 31 92', { w: 0.5, detail: true });
    });
    /* the head, tilted back about the neck */
    p.pivot(35, 55, rot, 1, function () {
      p.at(O[0], O[1], 0, k, function () {
        headSide(p, { open: op + 0.03 * trem, ear: -0.12 - 0.5 * big, lid: 0.35 * op + 0.2 * big, snarl: op, wv: -3 * big + 0.8 * trem, flare: big, t: t });
        /* sound, from the mouth */
        for (i = 0; i < 3; i++) {
          a0 = ei(seg(t, 0.5 + i * 0.06, 0.84)); a1 = eo(seg(t, 0.16 + i * 0.06, 0.5));
          if (tap) { a0 = Math.min(a0, ei(seg(q, 0.55 + i * 0.05, 0.98))); a1 = Math.max(0, eo(seg(q, 0.08 + i * 0.07, 0.5))); }
          if (a1 > a0 + 0.01) p.span(arcD(30, 14, 18 + 10 * i + 4 * big * i, -0.62, 0.62), a0, a1, { w: 0.85, ink: 'ink' });
        }
      });
    });
  }
});

/* ---------------------------------------------------------------------------------------------
   the body in profile, facing right: legs that walk by their joints, a torso that rolls on its shoulders, a ringed tail
   --------------------------------------------------------------------------------------------- */
/* the middle joint of a two-bone limb from a to the target t; bend +1 swings it to the left of the way a → t */
function ik2(a, t, l1, l2, bend) {
  var dx = t[0] - a[0], dy = t[1] - a[1], d = Math.max(Math.hypot(dx, dy), 0.001), dd = Math.min(d, l1 + l2 - 0.05), c = (l1 * l1 - l2 * l2 + dd * dd) / (2 * dd), h = Math.sqrt(Math.max(0, l1 * l1 - c * c)), ux = dx / d, uy = dy / d;
  return [a[0] + ux * c - uy * h * bend, a[1] + uy * c + ux * h * bend];
}
function rot(c, q, a) { var cs = Math.cos(a), sn = Math.sin(a), dx = q[0] - c[0], dy = q[1] - c[1]; return [c[0] + dx * cs - dy * sn, c[1] + dx * sn + dy * cs]; }
/* Catmull-Rom through joints with a width at each, per samples a joint */
function cr(pts, ws, per) {
  var P = [], Wd = [], n = pts.length, i, k, u, p0, p1, p2, p3;
  for (i = 0; i < n - 1; i++) {
    p0 = pts[Math.max(0, i - 1)]; p1 = pts[i]; p2 = pts[i + 1]; p3 = pts[Math.min(n - 1, i + 2)];
    for (k = 0; k < per; k++) {
      u = k / per;
      P.push([0.5 * (2 * p1[0] + (p2[0] - p0[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u * u + (3 * p1[0] - p0[0] - 3 * p2[0] + p3[0]) * u * u * u),
              0.5 * (2 * p1[1] + (p2[1] - p0[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u * u + (3 * p1[1] - p0[1] - 3 * p2[1] + p3[1]) * u * u * u)]);
      Wd.push(lerp(ws[i], ws[i + 1], u * u * (3 - 2 * u)));
    }
  }
  P.push([pts[n - 1][0], pts[n - 1][1]]); Wd.push(ws[n - 1]);
  return [P, Wd];
}
/* a limb: filled, outlined down both sides and round the paw; the top end stays open so it grows out of the body */
function limb(p, pts, ws, fill, w, decor) {
  var S = cr(pts, ws, 3), P = S[0], Wd = S[1], n = P.length, L = [], R = [], i, a, b, d, h, ring;
  for (i = 0; i < n; i++) {
    a = P[Math.max(0, i - 1)]; b = P[Math.min(n - 1, i + 1)]; d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; h = Wd[i] / 2;
    L.push([P[i][0] - (b[1] - a[1]) / d * h, P[i][1] + (b[0] - a[0]) / d * h]); R.push([P[i][0] + (b[1] - a[1]) / d * h, P[i][1] - (b[0] - a[0]) / d * h]);
  }
  ring = L.concat(roundEnd(P[n - 1], L[n - 1], Wd[n - 1] / 2, 10), R.slice().reverse());
  p.curve(ring, { fill: fill, line: false, close: true });
  if (decor) p.clip(function () { p.curve(ring, { fill: fill, close: true }); }, decor);
  p.curve(ring, { w: w || 1 });
  return { P: P, L: L, R: R, n: n };
}
/* a stripe across a limb at s (0..1 along it), from its back edge across a fraction of its width */
function bar(p, l, s, fr, w) {
  var i = Math.round(s * (l.n - 1)), a = l.L[i], b = l.R[i], x = lerp(a[0], b[0], fr), y = lerp(a[1], b[1], fr), mx = lerp(a[0], b[0], fr * 0.5), my = lerp(a[1], b[1], fr * 0.5) + 1.2;
  wedge(p, [a[0] + (a[0] - b[0]) * 0.08, a[1] + (a[1] - b[1]) * 0.08], [mx, my], [x, y + 2.2], w, {});
}
/* where a foot is in its step: ph 0 is the footfall; the foot slides back through the stance, then swings forward lifting; returns [dx, lift 0..1, sliding] */
function step(ph, st) {
  var u = frac(ph);
  if (u < st) return [0.5 - u / st, 0];
  var v = (u - st) / (1 - st);
  return [-0.5 + ease(v), Math.pow(Math.sin(PI * v), 1.2)];
}
/* the foreleg: shoulder S to the paw at P. dang folds the paw under (a lifted foot hangs from the wrist) */
function foreLeg(p, S, P, dang, fill, w, stripes) {
  var Wr = [P[0] - 1.5, P[1] - 8], E = ik2(S, Wr, 19, 15, 1), Hl = rot(Wr, [Wr[0] - 0.5, Wr[1] + 6], dang), T = rot(Wr, [Wr[0] + 4.6, Wr[1] + 6.6], dang);
  var l = limb(p, [S, E, Wr, Hl, T], [21, 12.5, 8, 9, 7.8], fill, w, stripes ? function () {
    wedge(p, [S[0] - 11, S[1] - 7], [S[0] - 4, S[1] - 6], [S[0] + 3, S[1] - 1], 3.8, {}); wedge(p, [S[0] - 11, S[1] + 3], [S[0] - 5, S[1] + 3.5], [S[0] + 1, S[1] + 7], 3.4, {});
  } : null);
  if (stripes) { bar(p, l, 0.5, 0.62, 2.8); bar(p, l, 0.64, 0.6, 2.3); }
  return l;
}
/* the hind leg: hip to the paw at P, the knee forward, the hock back */
function hindLeg(p, Hp, P, dang, fill, w, stripes) {
  var Hk = [P[0] - 5.5, P[1] - 13], Q = rot(Hk, [P[0] - 2, P[1] - 1.5], dang), T = rot(Hk, [P[0] + 4.2, P[1] - 0.9], dang), K = ik2(Hp, Hk, 20, 20, -1);
  var l = limb(p, [Hp, K, Hk, Q, T], [25, 13.5, 8.6, 8.8, 7.8], fill, w, stripes ? function () {
    wedge(p, [Hp[0] - 15, Hp[1] - 10], [Hp[0] - 7, Hp[1] - 10], [Hp[0] + 3, Hp[1] - 5], 4.2, {}); wedge(p, [Hp[0] - 16, Hp[1] - 1], [Hp[0] - 7, Hp[1] - 1.5], [Hp[0] + 3, Hp[1] + 3], 4, {});
    wedge(p, [Hp[0] - 14, Hp[1] + 8], [Hp[0] - 6, Hp[1] + 6.5], [Hp[0] + 2, Hp[1] + 9], 3.4, {});
  } : null);
  if (stripes) { bar(p, l, 0.66, 0.62, 2.6); bar(p, l, 0.8, 0.6, 2.2); }
  return l;
}
/* the torso in its own frame: the hip joint at (0, 0), the shoulder joint at (L, 0), the back at y = -19; bk sags the back,
   h1 and h2 are the shoulder blades rising, nt and nb the top and bottom of the neck where the head meets it */
function torso(p, o) {
  var L = o.L, h1 = o.h1 || 0, h2 = o.h2 || 0, bk = o.bk || 0, nt = o.nt, nb = o.nb, d;
  d = 'M-17 -1 C-18 -12 -10 -19 0 -19.5 C10 ' + (-19 + bk) + ' 19 ' + (-18 + bk) + ' ' + (L - 18) + ' ' + (-19.5 - h1) + ' C' + (L - 10) + ' ' + (-21 - h1) + ' ' + (L - 4) + ' ' + (-23.5 - h2) + ' ' + (L + 3) + ' ' + (-22 - h2) +
    ' C' + (L + 12) + ' ' + (-20.5 - h2) + ' ' + (nt[0] - 10) + ' ' + (nt[1] - 2) + ' ' + nt[0] + ' ' + nt[1] + ' L' + nb[0] + ' ' + nb[1] +
    ' C' + (nb[0] - 5) + ' ' + (nb[1] + 5) + ' ' + (L + 20) + ' 13 ' + (L + 9) + ' 17 C' + (L + 2) + ' 20 ' + (L - 8) + ' 17 ' + (L - 16) + ' 14 C' + (L - 26) + ' 12 16 11 6 13 C-2 14 -13 11 -17 -1 Z';
  p.path(d, { fill: COAT, line: false });
  p.clip(d, function () {
    var xs = [-13, -5, 3, 11, 19, 27, 35, 43, 51], i, a, ln, ls = [11, 15, 20, 17, 21, 18, 20, 17, 13];
    for (i = 0; i < xs.length; i++) { ln = ls[i] + (i % 2 ? 2 : 0); a = [xs[i], -26]; wedge(p, a, [xs[i] + (i < 3 ? -1.5 : 1.2), -26 + ln * 0.62], [xs[i] + (i < 3 ? -2 : 3) , -26 + ln * 1.45], 4.6 - 0.12 * i + (i === 3 ? 0.6 : 0), {}); }
    wedge(p, [-4, -4], [-10, 1], [-17, 4], 3, {}); wedge(p, [-17, 6], [-12, 8], [-8, 6], 2.4, {});
    p.path('M' + (nb[0] + 4) + ' ' + (nb[1] - 4) + ' C' + (L + 22) + ' 0 ' + (L + 6) + ' 6 ' + (L - 12) + ' 7.5 C' + (L - 24) + ' 8 8 6 -18 1 L-30 1 L-30 40 L' + (L + 40) + ' 40 L' + (L + 40) + ' ' + (nb[1] - 4) + ' Z', { fill: 'white', line: false });
  });
  p.path(d, { w: 1.12 });
}
/* a ringed tail along four points; the black tip comes last. returns nothing */
function tail(p, a, b, c, dd, wb, wt) {
  var sp = bez(a, b, c, dd, 20), wf = function (s) { return lerp(wb, wt, s); }, i, LR;
  tube(p, sp, wf, { fill: COAT, w: 1.05 });
  [[0.14, 0.21], [0.28, 0.35], [0.42, 0.49], [0.56, 0.63], [0.7, 0.77], [0.88, 1]].forEach(function (q) {
    var i0 = Math.round(q[0] * 20), i1 = Math.round(q[1] * 20);
    LR = edges(sp, wf, i0, i1);
    var poly = LR[0].concat(q[1] >= 1 ? roundEnd(sp[20], LR[0][LR[0].length - 1], wf(1) / 2) : [], LR[1].reverse());
    p.curve(poly, { fill: DARK, line: false, close: true });
  });
}


function toLoc(O, a, w) { var cs = Math.cos(-a), sn = Math.sin(-a), dx = w[0] - O[0], dy = w[1] - O[1]; return [dx * cs - dy * sn, dx * sn + dy * cs]; }
/* tufts of grass sliding under the feet, k a number of them, g how far the ground has gone in strides */
function grass(p, g, y, x0, x1, gap) {
  var k, x, sc;
  for (k = -1; k < Math.ceil((x1 - x0) / gap) + 2; k++) {
    x = x0 + gap * (k - frac(g)); sc = clamp(Math.min(x - x0, x1 - x) / 8, 0, 1); if (sc < 0.05) continue;
    [-1, 0, 1].forEach(function (d) { p.path('M' + (x + d * 1.5) + ' ' + y + ' q' + (d * 1.2) + ' ' + (-3 * sc) + ' ' + (d * 3.6) + ' ' + (-6.5 * sc), { w: 0.7, ink: 'leaf', cap: 'round' }); });
  }
}
/* the whole tiger in profile from a pose: o.S, o.H shoulder and hip joints; o.nf, ff, nh, fh the paws (near, far; fore, hind) and
   o.dnf, dff, dnh, dfh how far each paw hangs from its wrist; o.eye, hr, hk the head's eye, tilt and scale; o.head its own options; o.tail four points + widths */
function tigerSide(p, o) {
  var S0 = o.S, H0 = o.H, tilt = Math.atan2(S0[1] - H0[1], S0[0] - H0[0]), L = Math.hypot(S0[0] - H0[0], S0[1] - H0[1]), eye = o.eye, hr = o.hr, hk = o.hk;
  var NT = toLoc(H0, tilt, [eye[0] + hk * (-18 * Math.cos(hr) + 17 * Math.sin(hr)), eye[1] + hk * (-18 * Math.sin(hr) - 17 * Math.cos(hr))]);
  var NB = toLoc(H0, tilt, [eye[0] + hk * (-5 * Math.cos(hr) - 19 * Math.sin(hr)), eye[1] + hk * (-5 * Math.sin(hr) + 19 * Math.cos(hr))]);
  hindLeg(p, [H0[0] + 3, H0[1] + 1], o.fh, o.dfh, FAR, 0.95, false); foreLeg(p, [S0[0] + 2, S0[1] + 1], o.ff, o.dff, FAR, 0.95, false);
  var T = o.tail; tail(p, T[0], T[1], T[2], T[3], T[4], T[5]);
  p.at(H0[0], H0[1], tilt, 1, function () { torso(p, { L: L, h1: o.h1, h2: o.h2, bk: o.bk, nt: NT, nb: NB }); });
  hindLeg(p, H0, o.nh, o.dnh, COAT, 1.05, true);
  if (!o.nfLast) foreLeg(p, S0, o.nf, o.dnf, COAT, 1.05, true);
  p.at(eye[0], eye[1], hr, hk, function () { headSide(p, o.head); });
  if (o.nfLast) foreLeg(p, S0, o.nf, o.dnf, COAT, 1.05, true);
}
/* a value along a list of key poses (flat arrays) at q: smooth through every key, no stop at each */
function track(times, keys, q) {
  var n = times.length, i = 0, out = [], j, u, t0, t1, m0, m1, h, k;
  while (i < n - 2 && q > times[i + 1]) i++;
  t0 = times[i]; t1 = times[i + 1]; h = t1 - t0; u = clamp((q - t0) / h, 0, 1);
  for (j = 0; j < keys[0].length; j++) {
    m0 = i === 0 ? 0 : (keys[i + 1][j] - keys[i - 1][j]) / (times[i + 1] - times[i - 1]) * h;
    m1 = i + 2 >= n ? 0 : (keys[i + 2][j] - keys[i][j]) / (times[i + 2] - times[i]) * h;
    k = u * u; out.push((2 * k * u - 3 * k + 1) * keys[i][j] + (k * u - 2 * k + u) * m0 + (-2 * k * u + 3 * k) * keys[i + 1][j] + (k * u - k) * m1);
  }
  return out;
}
/* the slow walk of a tiger that has seen something: low, the shoulder blades rolling one after the other, the head down,
   the tail swinging with its black tip arriving last. Tap: it freezes with a forepaw held up, pupils wide, ears forward, only the tail tip twitching. */
D.add('tiger-stalk', {
  fam: 'tiger', ratio: 1.4, tags: ['tiger', 'stalk', 'prowl', 'walk', 'hunt', 'big cat', 'creep', 'stealth', 'jungle', 'predator', 'เสือ', 'ย่อง'], loop: 1.8, still: 0.1, tapLen: 2.1176, tapRest: 0.5,
  burst: false, margin: [10, 10, 4, 8],
  about: 'walks low, the shoulder blades rolling one after the other, the tail swaying with its black tip arriving last', tapAbout: 'freezes with a forepaw held up, the pupils wide, the ears forward; only the tail tip twitches',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, f = tap ? ease(seg(q, 0, 0.15)) * (1 - ease(seg(q, 0.85, 1))) : 0, i, F = 0;
    for (i = 0; i < 40; i++) if (tap && i / 40 < q) F += (ease(seg(i / 40, 0, 0.15)) * (1 - ease(seg(i / 40, 0.85, 1)))) / 40;
    var g = t - F * 2.1176 / 1.8, G0 = 22 / 0.7, st = 0.7, SL = 22, GY = 89.1;
    var bob = 1.1 * W(t, 2, 0.08) * (1 - f) + 2.2 * f, S0 = [86, 50 + bob + 1.5 * f], H0 = [40, 56 + bob + 1.5 * f];
    var fp = { nh: step(t - 0.0, st), nf: step(t - 0.25, st), fh: step(t - 0.5, st), ff: step(t - 0.75, st) }, lift = 9.5;
    var hp = function (a, c, hold) { return [lerp(c + SL * a[0], hold[0], f), lerp(GY - lift * a[1], hold[1], f)]; };
    var s1 = W(t, 1, -0.1), s2 = W(t, 1, -0.22), s3 = W(t, 1, -0.36), tw = tap ? Math.sin(TAU * 3 * q) * bump(seg(q, 0.15, 0.85)) : 0, ty = 5 * f;
    p.line(2, 92.6, 138, 92.6, { w: 0.5, detail: true });
    grass(p, g, 92.4, 4, 136, G0);
    tigerSide(p, {
      S: S0, H: H0, nh: hp(fp.nh, H0[0] + 7, [H0[0] + 3, GY]), nf: hp(fp.nf, S0[0] + 4, [S0[0] + 24, GY - 12]), nfLast: f > 0.35, fh: hp(fp.fh, H0[0] + 7, [H0[0] + 12, GY]), ff: hp(fp.ff, S0[0] + 4, [S0[0] - 3, GY]),
      dnh: 0.85 * fp.nh[1] * (1 - f), dnf: lerp(0.85 * fp.nf[1], 0.5, f), dfh: 0.85 * fp.fh[1] * (1 - f), dff: 0.85 * fp.ff[1] * (1 - f),
      h1: 2.6 * (0.5 - fp.nf[0]) * (1 - f) + 0.8 * f, h2: 2.6 * (0.5 - fp.ff[0]) * (1 - f), bk: 1.6 * (fp.nh[0] + fp.fh[0]),
      eye: [S0[0] + 28, S0[1] + 6 + 1.2 * W(t, 2, 0.2) * (1 - f) + 2 * f], hr: 0.1 + 0.07 * f - 0.03 * W(t, 2, 0.2) * (1 - f), hk: 0.64,
      head: { open: 0.02, ear: -0.1 - 0.35 * f, lid: pulse(t, 0.7, 0.08) * (1 - f), pupil: 1 + 0.5 * f, t: t },
      tail: [[H0[0] - 13, H0[1] - 6], [14 + 2 * s1, 56 + ty + 2.5 * s1], [3 + 2 * s2, 68 + ty + 3 * s2], [7 + 3 * s3 + 2 * tw, 58 + ty + 5 * s3 - 3 * f - 3 * tw], 8.2, 4.8]
    });
  }
});

/* the crouch before the pounce, and the pounce: key poses as flat lists
   S hip... see POUNCE_NAMES; x, y of S, H, then the four paws, four paw hangs, eye x y tilt, mouth, ears, three tail points (x y each) */
var GY = 89.1;
var POUNCE_T = [0, 0.17, 0.37, 0.53, 0.63, 1];
var POUNCE_K = [
  /*      Sx  Sy  Hx  Hy   nfx nfy   ffx ffy   nhx nhy   fhx fhy   dnf dff dnh dfh   ex  ey   er   op   ear   bx by   cx cy   dx dy */
  [72, 64, 30, 54, 98, GY, 92, GY, 30, GY, 38, GY, 0.2, 0.2, 0.1, 0.1, 94, 72, 0.1, 0, -0.05, 15, 58, 5, 68, 8, 58],
  [67, 71, 26, 63, 95, GY, 89, GY, 27, GY, 35, GY, 0.2, 0.2, 0.1, 0.1, 89, 78, 0.2, 0, -0.1, 12, 64, 3, 73, 3, 66],
  [97, 36, 51, 44, 121, 66, 112, 69, 22, 58, 31, 63, 0.5, 0.5, 0.9, 0.9, 124, 39, -0.12, 0.35, -0.5, 36, 46, 22, 47, 8, 42],
  [101, 60, 53, 46, 124, GY, 118, GY, 33, 65, 41, 68, 0.1, 0.1, 0.8, 0.8, 128, 67, 0.42, 0.15, -0.35, 28, 44, 12, 42, 3, 34],
  [98, 67, 46, 59, 123, GY, 117, GY, 39, GY, 47, GY, 0, 0, 0.1, 0.1, 124, 75, 0.35, 0, -0.1, 20, 56, 6, 60, 6, 48],
  [72, 64, 30, 54, 98, GY, 92, GY, 30, GY, 38, GY, 0.2, 0.2, 0.1, 0.1, 94, 72, 0.1, 0, -0.05, 15, 58, 5, 68, 8, 58]
];
/* a tuft of tall grass, the prey's cover: blades lean by bend (negative leans left under a paw), sway on their own */
function tuft(p, x, y, t, bend, hide) {
  var i, hs = [17, 21, 24, 20, 15, 22, 18], xs = [-6, -4, -2, 0.5, 3, 5.5, 8], sw;
  for (i = 0; i < 7; i++) {
    sw = 1.8 * W(t, 2, i * 0.09) * (1 - Math.abs(bend)) + bend * 17;
    p.path('M' + (x + xs[i]) + ' ' + y + ' C' + (x + xs[i] + sw * 0.1) + ' ' + (y - hs[i] * 0.4) + ' ' + (x + xs[i] + sw * 0.5 + xs[i] * 0.2) + ' ' + (y - hs[i] * 0.75 * (1 - 0.5 * Math.abs(bend))) + ' ' + (x + xs[i] + sw + xs[i] * 0.3) + ' ' + (y - hs[i] * (1 - 0.7 * Math.abs(bend))), { w: 0.85, ink: i % 2 ? 'green' : 'leaf', cap: 'round' });
  }
}
/* the pounce: a crouch with the rump wiggling, the eyes fixed on a tuft of grass, the tail tip lashing.
   Tap: it coils, leaps with the hind legs trailing, lands on the grass with the forepaws, the body squashing and the dust and leaves flying, and backs out. */
D.add('tiger-pounce', {
  fam: 'tiger', ratio: 1.4, tags: ['tiger', 'pounce', 'leap', 'jump', 'crouch', 'wiggle', 'hunt', 'big cat', 'play', 'jungle', 'เสือ', 'กระโจน'], loop: 2.4, still: 0.05, tapLen: 2.2, tapRest: 0.0,
  burst: 'leaf', burstAt: [130, 80], burstN: 5, burstSpread: 1.3, burstDelay: 0.5, burstGravity: 60, margin: [12, 14, 4, 8], tapMargin: [30, 30, 4, 10],
  about: 'crouched low, the rump wiggling, the tail tip lashing, the eyes locked on a tuft of grass', tapAbout: 'coils, leaps with the hind legs trailing, lands forepaws first on the grass with a squash, dust and leaves flying, then backs out',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, v = track(POUNCE_T, POUNCE_K, tap ? q : 0), i;
    var env = bump(seg(t, 0.1, 0.9)), wg = W(t, 6, 0.0) * env, wg2 = W(t, 6, 0.25) * env, quiet = tap ? 0 : 1, rest = tap ? 0 : 1;
    var wig = tap ? 1.4 * W(q, 8) * (1 - seg(q, 0.12, 0.2)) * seg(q, 0.0, 0.05) : 0;
    var S0 = [v[0], v[1]], H0 = [v[2] + 1.0 * wg2 * rest + wig, v[3] - 1.6 * wg * rest + 1.2 * wig], air = clamp((62 - (v[1] + v[3]) / 2) / 24, 0, 1), sq = tap ? bump(seg(q, 0.5, 0.74)) : 0;
    var tread = function (ph) { return 2.6 * Math.max(0, W(t, 6, ph)) * env * rest; };
    var feet = function (x, y, extra) { return [x, Math.min(GY, y - extra)]; };
    var tw = W(t, 3, -0.15), tw2 = W(t, 3, -0.3), tw3 = W(t, 3, -0.45), tl = tap ? 0 : 1;
    p.line(2, 92.6, 138, 92.6, { w: 0.5, detail: true });
    p.ellipse((S0[0] + H0[0]) / 2 - 4, 92.4, 36 * (1 - 0.45 * air), 2.2, { fill: 'smoke', line: false, alpha: 0.7 * (1 - 0.5 * air) });
    var crush = tap ? ease(seg(q, 0.52, 0.58)) * (1 - ease(seg(q, 0.78, 0.97))) : 0, pop = tap ? sp(seg(q, 0.82, 1)) * seg(q, 0.78, 0.8) : 0;
    tuft(p, 131, 92.2, t, -crush + 0.0 * pop, 0);
    var gaze = tap ? 0 : 0.5 * W(t, 1, 0.1);
    tigerSide(p, {
      S: S0, H: H0, nf: [v[4], v[5]], ff: [v[6], v[7]], nh: feet(v[8], v[9], tread(0)), fh: feet(v[10], v[11], tread(0.5)),
      dnf: v[12], dff: v[13], dnh: v[14] + (tread(0) > 0 ? 0.5 : 0), dfh: v[15] + (tread(0.5) > 0 ? 0.5 : 0),
      h1: 1.2 + 1.5 * sq, h2: 0.4 + 1.5 * sq, bk: -1.2 + 2.5 * air - 1.8 * sq,
      eye: [v[16], v[17] + 0.5 * W(t, 6, 0.1) * env * rest], hr: v[18], hk: 0.64,
      head: { open: v[19], ear: v[20] + 0.1 * pulse(t, 0.3, 0.1) * rest, lid: pulse(t, 0.62, 0.08) * rest, pupil: 1.35 - 0.3 * air, t: t, snarl: v[19] > 0.2 ? 0.5 : 0, wv: 0 },
      tail: [[H0[0] - 13, H0[1] - 6], [v[21] + 1.5 * tw * rest, v[22] - 4 * tw * tl * env], [v[23] + 2 * tw2 * rest, v[24] - 7 * tw2 * tl * env], [v[25] + 3 * tw3 * rest, v[26] - 11 * tw3 * tl * env - 6 * tl], 8.2, 4.8]
    });
    /* dust off the forepaws where they land */
    if (tap) for (i = 0; i < 3; i++) {
      var u = seg(q, 0.53 + i * 0.03, 0.8);
      if (u > 0 && u < 1) p.circle(112 - 14 * u * (i + 1) * 0.6 - i * 4, 88 - 7 * u - i * 1.5, 5.5 * Math.sin(Math.PI * Math.pow(u, 0.7)) + 0.4, { fill: 'smoke', w: 0.6, alpha: 0.9 });
    }
  }
});

/* a leaf drifting down, turning as it goes: u runs 0 → 1 */
function leaf(p, x, y, a, k) { p.at(x, y, a, k, function () { p.path('M0 -6 C4 -4 4 3 0 7 C-4 3 -4 -4 0 -6 Z', { fill: 'leaf', w: 0.7 }); p.line(0, -5, 0, 5, { w: 0.4, detail: true }); }); }
/* a Z that is drawn, sits a moment, and is taken back; ph 0 → 1 */
function zed(p, x, y, r, ph) {
  var d = 'M' + (x - r) + ' ' + (y - r) + ' L' + (x + r) + ' ' + (y - r) + ' L' + (x - r) + ' ' + (y + r) + ' L' + (x + r) + ' ' + (y + r);
  p.span(d, ei(seg(ph, 0.55, 1)), eo(seg(ph, 0, 0.4)), { w: 0.8, cap: 'round' });
}
/* asleep, curled up on the ground: the back rising and falling with each breath, the tail tip flicking, an ear twitching, zzz.
   Tap: one eye opens a slit, the pupil finds you, an ear swivels round, and it shuts again with a long breath out. */
D.add('tiger-nap', {
  fam: 'tiger', ratio: 1.2, tags: ['tiger', 'nap', 'sleep', 'asleep', 'curled', 'rest', 'zzz', 'cozy', 'lazy', 'big cat', 'night', 'เสือ', 'นอน', 'หลับ'], loop: 3.2, still: 0.15, tapLen: 2.2, tapRest: 0.35,
  burst: false, margin: [26, 12, 4, 6],
  about: 'the back rises and falls with each breath, the tail tip flicks, an ear twitches, the zzz drift up', tapAbout: 'one eye opens a slit and finds you, an ear swivels round, then it shuts again with a long breath out',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, br = W(t, 2, 0.1), i;
    var wake = tap ? ease(seg(q, 0.08, 0.3)) * (1 - ease(seg(q, 0.62, 0.84))) : 0, sigh = tap ? bump(seg(q, 0.78, 1)) : 0;
    var flick = Math.max(pulse(t, 0.2, 0.14), pulse(t, 0.34, 0.12) * 0.8) * (1 - 0.7 * wake) + (tap ? 0.9 * bump(seg(q, 0.3, 0.7)) * Math.sin(TAU * 3 * q) * 0.5 : 0);
    var chest = 1 + 0.028 * br + 0.04 * sigh * 0 - 0.03 * sigh;
    var GYn = 89, eye = [90, 66 + 0.8 * br], ear = 0.28 * pulse(t, 0.62, 0.1) - 0.5 * wake, i2;
    p.line(2, 90.4, 118, 90.4, { w: 0.5, detail: true });
    /* the tail lies along the ground in front of the belly, its tip flicking up */
    var tipUp = 11 * flick;
    /* the body */
    p.pivot(52, 90, 0, [1, chest], function () {
      var body = 'M15 85 C4 76 7 54 21 42 C33 31 58 27 76 33 C89 37 97 48 98 60 C100 70 97 80 93 87 C74 91 38 91 15 85 Z';
      p.path(body, { fill: COAT, line: false });
      p.clip(body, function () {
        [[18, 30, 11, -1.4], [27, 28, 15, -1], [36, 26, 22, -0.5], [46, 25, 24, 0], [56, 25, 24, 0.5], [66, 26, 24, 1], [76, 29, 20, 1.5], [86, 36, 16, 2]].forEach(function (c, k) {
          var lean = c[3] * 3.4; wedge(p, [c[0], c[1]], [c[0] + lean * 0.4, c[1] + c[2] * 0.55], [c[0] + lean, c[1] + c[2] * 1.7], 4.8 - 0.1 * k, {});
        });
        p.path('M5 80 C30 70 70 74 110 70 L110 100 L0 100 Z', { fill: 'white', line: false });
      });
      p.path(body, { w: 1.12 });
      /* the haunch, with the hind paw tucked under */
      p.path('M22 70 C20 54 36 46 48 52 C58 57 60 72 54 82 C50 88 36 90 28 86 C24 82 22 76 22 70 Z', { fill: COAT, w: 1.05 });
      p.clip('M22 70 C20 54 36 46 48 52 C58 57 60 72 54 82 C50 88 36 90 28 86 C24 82 22 76 22 70 Z', function () {
        wedge(p, [18, 52], [26, 53], [36, 58], 4.6, {}); wedge(p, [17, 63], [26, 63], [36, 66], 4.4, {}); wedge(p, [19, 74], [27, 73], [35, 75], 4, {});
      });
      p.path('M38 58 C47 58 53 66 51 77', { w: 0.45, detail: true });
      p.path('M43 83 C52 80 62 83 63 87 C58 90 46 90 43 87 Z', { fill: 'cream', w: 0.9 });
    });
    tail(p, [13, 70], [1, 86], [30, 97], [76 + 2 * flick, 89 - tipUp], 8.2, 5);
    /* forelegs lying forward under the head */
    limb(p, [[86, 66], [92, 80], [102, 85], [108, 86], [114, 86.4]], [16, 11, 9, 9.4, 8.4], FAR, 0.95, null);
    var fl = limb(p, [[80, 62], [86, 78], [95, 85], [103, 86], [110, 86.6]], [20, 12.5, 9.5, 10, 8.6], COAT, 1.05, function () { wedge(p, [70, 62], [76, 62], [84, 66], 4, {}); });
    bar(p, fl, 0.45, 0.6, 2.8); bar(p, fl, 0.6, 0.6, 2.4);
    /* the head, resting on its paws */
    p.at(eye[0], eye[1], 0.1 - 0.05 * wake - 0.04 * sigh, 0.7, function () {
      headSide(p, { open: 0, ear: ear, lid: 1 - wake, sleep: false, pupil: 1.2, t: t, wv: 0, flare: 0 });
    });
    /* zzz */
    for (i = 0; i < 3; i++) { var ph = frac(t - 0.3 * i + 0.9); zed(p, 108 + 3 * i, 40 - 9 * i, 2.2 + 1.1 * i, wake > 0.3 ? 1 : ph); }
  }
});

/* a butterfly: two pairs of wings flapping about the body, k its size */
function butterfly(p, x, y, rot, flap, k) {
  p.at(x, y, rot, k, function () {
    [-1, 1].forEach(function (d) {
      p.pivot(0, 0, 0, [d * flap, 1], function () {
        p.path('M0 -1 C-2 -9 -12 -12 -12.5 -4 C-12.5 1 -5 2.4 0 0 Z', { fill: 'lilac', w: 0.8 });
        p.path('M0 1 C-3 2 -10 3 -9 8 C-8 12 -2 9 0 3 Z', { fill: 'sky', w: 0.8 });
        p.dot(-8.2, -4.4, 1.7, 'plum');
      });
    });
    p.ellipse(0, 1, 1.2, 5, { fill: DARK, w: 0.5 });
    p.path('M0 -4 C-1 -8 -3 -9 -4 -10 M0 -4 C1 -8 3 -9 4 -10', { w: 0.45, detail: true });
  });
}
/* a cub's paw: cream, with its toes */
function cubPaw(p, x, y, kick) {
  p.pivot(x, y - 4, kick, 1, function () {
    p.ellipse(x, y, 6.8, 4.8, { fill: 'cream', w: 0.95 });
    p.path('M' + (x - 2.2) + ' ' + (y - 0.4) + ' L' + (x - 2.2) + ' ' + (y + 3.6) + ' M' + (x + 2.2) + ' ' + (y - 0.4) + ' L' + (x + 2.2) + ' ' + (y + 3.6), { w: 0.4, detail: true });
  });
}
/* the cub, from its centre (0, 0): head tilt, the batting arm's angle, the hind paws' kick, tail sway; look and lid for the eyes */
function cub(p, t, o) {
  var i;
  tail(p, [13, 21], [26, 25], [33, 14], [27 + 3 * o.tw, 4 - 1 * o.tw], 6.8, 5.4);
  [-1, 1].forEach(function (d) { cubPaw(p, d * 19, 24, d * -0.1 + (d > 0 ? o.kick : -o.kick)); });
  var body = 'M-15 -9 C-22 2 -25 17 -19 25 C-10 29 10 29 19 25 C25 17 22 2 15 -9 Z';
  p.path(body, { fill: COAT, line: false });
  p.clip(body, function () {
    p.ellipse(0, 14, 9.4, 14, { fill: 'white', line: false });
    [[0, 0], [10, 0], [19, 0]].forEach(function (c) { [-1, 1].forEach(function (d) { wedge(p, [d * 26, c[0]], [d * 19, c[0] - 0.5], [d * 13, c[0] + 2.5], 4.2, {}); }); });
  });
  p.path(body, { w: 1.1 });
  limb(p, [[-9, -6], [-10, 8], [-9, 19]], [12, 9.6, 9.4], COAT, 1, null); cubPaw(p, -9, 21, 0);
  p.pivot(11, -6, o.arm, 1, function () { limb(p, [[11, -6], [12, 8], [11, 18]], [12, 9.6, 9.4], COAT, 1, null); wedge(p, [6, 4], [9, 4.5], [12, 6.5], 2.6, {}); cubPaw(p, 11, 20, 0); });
  p.at(0, -30, o.tilt, 0.58, function () {
    p.move(-50, -52);
    faceFront(p, t, { op: o.op, lid: o.lid, happy: o.happy, look: o.look, ly: o.ly, earL: o.earL, earR: o.earR, cub: 1, pupil: o.pupil });
  });
}
/* a cub sits and bats at a butterfly, the head following it, the swats always a hair behind it, the tail curling.
   Tap: it reaches too far and topples over onto its back, paws kicking; the butterfly lands on its nose and it goes cross-eyed, then rolls back up. */
D.add('tiger-cub', {
  fam: 'tiger', ratio: 1.1, tags: ['tiger', 'cub', 'baby', 'kitten', 'butterfly', 'play', 'cute', 'tumble', 'young', 'big cat', 'เสือน้อย', 'ลูกเสือ'], loop: 2.6, still: 0.5, tapLen: 3, tapRest: 0.5,
  burst: false, margin: [10, 12, 4, 10], tapMargin: [14, 14, 4, 12],
  about: 'sits batting at a butterfly, the head following it, the tail curling', tapAbout: 'reaches too far and topples over, paws kicking; the butterfly lands on its nose, it goes cross-eyed, then rolls back up',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, C = [55, 66], i;
    var bx = 84 + 12 * W(t, 1), by = 36 + 9 * W(t, 2, 0.2), flap = 0.3 + 0.7 * Math.abs(W(t, 8)), rot = 0.3 * W(t, 1, 0.25);
    var swat = Math.max(pulse(t, 0.44, 0.17), pulse(t, 0.94, 0.17)), reach = tap ? bump(seg(q, 0, 0.24)) : 0;
    var lying = tap ? ei(seg(q, 0.16, 0.36)) * (1 - ease(seg(q, 0.78, 0.95))) : 0, bounce = tap ? 0.12 * bump(seg(q, 0.36, 0.5)) : 0, wob = tap ? 0.09 * Math.sin(TAU * 2.5 * seg(q, 0, 0.2)) * (1 - seg(q, 0.12, 0.2)) : 0;
    var th = -1.5 * lying + bounce + wob, dy = 12 * lying - 2.5 * reach, att = tap ? ease(seg(q, 0.4, 0.52)) * (1 - ease(seg(q, 0.74, 0.86))) : 0;
    var arm = lerp(-0.5, -2.1, swat) - 0.4 * reach + (tap ? -0.3 * Math.sin(TAU * 3 * q) * lying : 0);
    var look = lerp((bx - 84) / 14 * 0.9, 0.9, att), lookR = lerp((bx - 84) / 14 * 0.9, -0.9, att), ly = lerp(-0.6 + (by - 36) / 9 * 0.5, 0.8, att);
    var tilt = lerp(0.016 * (bx - 84) - 0.05 * swat, 0, att), op = tap ? 0.25 * bump(seg(q, 0.12, 0.34)) : 0, kick = lying * 0.5 * Math.sin(TAU * 3 * t);
    var nose = [C[0] + 27 * Math.sin(th), C[1] + dy - 27 * Math.cos(th)];
    p.line(2, 92.4, 108, 92.4, { w: 0.5, detail: true });
    var onTop = att < 0.5;
    var bpos = [lerp(bx, nose[0], att), lerp(by, nose[1], att)];
    if (onTop) butterfly(p, bpos[0], bpos[1], lerp(rot, 0, att), lerp(flap, 0.3 + 0.7 * Math.abs(W(t, 4)), att), 1);
    p.at(C[0], C[1] + dy, th, [1 + 0.02 * W(t, 3) * (1 - lying), 1 - 0.02 * W(t, 3) * (1 - lying)], function () {
      cub(p, t, { tilt: tilt, arm: arm, kick: kick, tw: W(t, 1, -0.2), look: [look, lookR], ly: ly, op: op, lid: tap ? 0 : pulse(t, 0.7, 0.06), earL: 0.15 * pulse(t, 0.2, 0.1), earR: 0.1 * pulse(t, 0.26, 0.1) + 0.2 * att, happy: 0, pupil: 1 + 0.4 * att + 0.3 * reach });
    });
    if (!onTop) butterfly(p, bpos[0], bpos[1], rot * (1 - att), 0.3 + 0.7 * Math.abs(W(t, 4)) * 0.8, 1);
    if (tap && lying > 0.8) for (i = 0; i < 3; i++) { var u = seg(q, 0.36 + i * 0.03, 0.62); if (u > 0 && u < 1) p.circle(30 + i * 28 + (i - 1) * 8 * u, 90 - 4 * u, 4.4 * Math.sin(Math.PI * Math.pow(u, 0.7)) + 0.3, { fill: 'smoke', w: 0.6 }); }
  }
});

/* ---------------------------------------------------------------------------------------------
   เสือคู่ suea koo, the twin tigers of the sak yant: two tigers rearing to face each other, drawn in ink as a yant is
   --------------------------------------------------------------------------------------------- */
/* how long a stroke is, roughly: through its numbers taken as points */
function lenOf(d) {
  var a = typeof d === 'string' ? (d.match(/-?\d+\.?\d*/g) || []).map(Number) : [].concat.apply([], d), n = 0, i;
  for (i = 2; i + 1 < a.length; i += 2) n += Math.hypot(a[i] - a[i - 2], a[i + 1] - a[i - 1]);
  return n;
}
/* the strokes of the left tiger, in the order the hand makes them: f 0 in the box, f 1 on the head (the face of tiger-face,
   100 x 100, set at the top of the body); det strokes are left out when small */
var YANT = (function () {
  var L = [], tot = 0, c = 0, sp, LR, n, cap, wd;
  function add(d, w, f, o) { L.push(Object.assign({ d: d, w: w, f: f || 0 }, o || {})); }
  function mir(a) { return a.map(function (q) { return [100 - q[0], q[1]]; }); }
  function pair(a, w, o) { add(a, w, 1, Object.assign({ smooth: true }, o || {})); add(mir(a), w, 1, Object.assign({ smooth: true }, o || {})); }
  /* the heavy back, the haunch and hind leg, the chest */
  add([[12, 43], [6, 49], [3.8, 59], [5.5, 68], [8, 76]], 1.3, 0, { smooth: true });
  add([[8, 76], [5, 83], [8, 89], [6.5, 94], [16, 95.2], [28, 94], [26, 90], [25, 85], [28, 80.5], [33, 78]], 1.2, 0, { smooth: true });
  add([[32, 84], [40, 84], [44, 88], [42, 93], [50, 93]], 1, 0, { smooth: true, det: 1 });
  add([[46, 48.5], [55, 51.5], [60, 60], [58.5, 69], [52, 76], [43, 80], [35, 80.5]], 1.3, 0, { smooth: true });
  /* the tail, curling up behind in an S: two edges and rings between them */
  sp = cr([[8, 76], [2.5, 73], [-0.5, 66], [2.5, 60], [6.5, 55], [5, 49], [1, 44], [0.5, 38], [4, 33]], [7, 6.5, 6, 5.5, 5, 4.6, 4.2, 3.6, 3], 5);
  n = sp[0].length; wd = function (s) { return sp[1][Math.min(n - 1, Math.round(s * (n - 1)))]; };
  LR = edges(sp[0], wd, 0, n - 1); cap = roundEnd(sp[0][n - 1], LR[0][n - 1], wd(1) / 2, 8);
  add(LR[0].concat(cap, LR[1].slice().reverse()), 1.05, 0, { smooth: true });
  [8, 13, 18, 23, 28, 33].forEach(function (i) { add([LR[0][i], LR[1][i]], 1.1, 0, { det: 1 }); });
  /* the forelegs raised toward the other tiger, with claws */
  add([[37, 50], [45, 52], [52, 49], [56, 43]], 1.15, 0, { smooth: true });
  add([[40, 62], [48, 62.5], [54, 58], [58, 51]], 1.15, 0, { smooth: true });
  add([[56, 43], [60, 44.5], [58, 51]], 1.05, 0, { smooth: true });
  add([[60, 44.5], [63.4, 42.6]], 0.95, 0, { det: 1 }); add([[60.6, 47], [64, 47]], 0.95, 0, { det: 1 }); add([[58.8, 50.4], [62.2, 52]], 0.95, 0, { det: 1 });
  add([[42, 58], [48, 66], [54, 67.5], [58, 63], [60, 58]], 0.9, 0, { smooth: true, det: 1 });
  add([[46, 52.5], [47, 58.5]], 1.1, 0, { det: 1 }); add([[51, 50], [52, 56.5]], 1.1, 0, { det: 1 });
  /* the face, as tiger-face has it, in line: ears, ruffs, brow stripes, eyes, nose, mouth */
  add(faceShape(0, 0), 1.15, 1, {});
  pair([[12.5, 31], [11.5, 21], [17, 13], [24, 12], [29, 13], [33.5, 17]], 1.1, {});
  pair([[17, 29], [17, 23], [20, 18], [24, 17], [27, 18]], 0.6, { det: 1 });
  add([[50, 14.5], [50, 22], [50, 31]], 2.1, 1, { smooth: true }); pair([[39, 14.5], [41.5, 20], [44.4, 28]], 1.8, {}); pair([[21, 21], [25, 25], [30, 29.5]], 1.7, {});
  pair([[12, 33], [19, 33.5], [26, 36]], 1.7, {}); pair([[9, 41], [17, 40.5], [24, 42]], 1.6, {});
  add('M27 45 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0', 0.85, 1, {}); add('M61 45 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0', 0.85, 1, {});
  add([[33.2, 45.2], [33.8, 45.2]], 2.3, 1, { cap: 'round' }); add([[66.2, 45.2], [66.8, 45.2]], 2.3, 1, { cap: 'round' });
  add('M40.6 45 C39 38.5 31 37.5 26 41.5', 1, 1, {}); add('M59.4 45 C61 38.5 69 37.5 74 41.5', 1, 1, {});
  add('M42 54.5 C42 51 58 51 58 54.5 C58 58.5 53 62.5 50 63.5 C47 62.5 42 58.5 42 54.5 Z', 1.1, 1, {}); add([[46, 55], [54, 55]], 2.2, 1, { cap: 'round' });
  add([[50, 63.5], [50, 68.5]], 1, 1, {}); add('M50 68.5 C48 72.5 43 73.5 39.5 70', 1, 1, {}); add('M50 68.5 C52 72.5 57 73.5 60.5 70', 1, 1, {});
  pair([[9, 57], [16, 57.5], [24, 59.5]], 1.6, {}); pair([[9, 67], [15, 66], [22, 67.5]], 1.5, {});
  pair([[36, 68], [22, 65.5], [8, 66.5]], 0.5, { det: 1 }); pair([[36, 71], [22, 72], [9, 75]], 0.5, { det: 1 });
  /* the stripes of the shoulders, chest and haunch, bold, from the edges inward */
  add([[3.6, 49.5], [10, 52.5], [18, 52.5]], 2.3, 0, { smooth: true }); add([[3.2, 58.5], [9.5, 61], [18, 61]], 2.3, 0, { smooth: true });
  add([[4.6, 67.5], [11, 69.5], [19, 68.5]], 2.2, 0, { smooth: true }); add([[7, 75], [13, 76.5], [20, 76]], 2, 0, { smooth: true });
  add([[6.4, 83], [12, 82], [18, 84]], 1.8, 0, { smooth: true }); add([[7, 89], [12.5, 88.5], [17, 90]], 1.6, 0, { smooth: true });
  add([[59, 58], [53.5, 58.5], [49, 57]], 1.9, 0, { smooth: true }); add([[58, 67], [52.5, 66.5], [48.5, 65.5]], 1.8, 0, { smooth: true }); add([[51.5, 74.5], [47, 73], [43.5, 71.5]], 1.6, 0, { smooth: true });
  add([[5, 96], [30, 97.4], [64, 96]], 0.8, 0, { smooth: true });
  L.forEach(function (o) { o.len = lenOf(o.d) * (o.f ? 0.5 : 1); tot += o.len; });
  L.forEach(function (o) { o.c0 = c / tot; c += o.len; o.c1 = c / tot; });
  return L;
})();
/* the unalome: a spiral that unwinds into a rising line */
var UNALOME = (function () {
  var a = [], i, th, r;
  for (i = 0; i <= 28; i++) { th = i / 28 * PI * 3.5; r = 1.1 + 4.4 * i / 28; a.push([70 + r * Math.cos(th), 62 + r * Math.sin(th)]); }
  return a.concat([[70, 55.6], [71.6, 49], [68.4, 43], [71.6, 35], [68.4, 29], [71.4, 23], [69.4, 17], [70, 11]]);
})();
function yantTiger(p, T, E, lit) {
  var i, st, u, e, a, b;
  for (i = 0; i < YANT.length; i++) {
    st = YANT[i]; if (st.det && p.small) continue;
    u = seg(T, st.c0, st.c1); e = seg(E, 1 - st.c1, 1 - st.c0);
    if (u <= e + 0.003) continue;
    (function (st, u, e) {
      var draw = function () {
        if (lit >= 0) { a = clamp((lit - 0.22 - st.c0) / (st.c1 - st.c0), 0, 1); b = Math.min(clamp((lit - st.c0) / (st.c1 - st.c0), 0, 1), u); if (b > a + 0.01 && b > e) p.span(st.d, Math.max(a, e), b, { w: st.w + 1.3, ink: 'gold', glow: 0.8, smooth: st.smooth, alpha: 0.85, cap: st.cap }); }
        p.span(st.d, e, u, { w: st.w, smooth: st.smooth, ink: 'ink', cap: st.cap });
      };
      if (st.f) p.at(34, 28, 0.14, 0.5, function () { p.move(-50, -52); draw(); }); else draw();
    })(st, u, e);
  }
}
/* two tigers rear up facing each other, drawn stroke by stroke in ink, the left hand a little ahead of the right, then a soft
   gold glow breathes and the lines are taken back. Tap: both are drawn whole, a light runs along the ink and a ring of light spreads from the unalome. */
D.add('suea-koo', {
  fam: 'tiger', ratio: 1.4, tags: ['suea koo', 'twin tigers', 'sak yant', 'yant', 'tattoo', 'tiger', 'protection', 'strength', 'ink', 'unalome', 'blessing', 'เสือคู่', 'สักยันต์', 'ยันต์'], loop: 6, still: 0.7, tapLen: 2.2, tapRest: 0.5,
  burst: false, margin: [8, 8, 6, 8], tapMargin: [12, 14, 10, 14],
  about: 'two tigers rearing face to face are drawn in ink line by line, a gold glow breathes round them, and the lines are taken back', tapAbout: 'both tigers are drawn whole, a light runs along their ink and a ring of light spreads from the unalome between them',
  draw: function (p, t, s) {
    var tap = s.tap >= 0, q = tap ? s.tap : 0, br = 0.5 + 0.5 * W(t, 2, 0.1), i;
    var k = tap ? ease(seg(q, 0, 0.12)) * (1 - ease(seg(q, 0.86, 1))) : 0;
    var T0 = lerp(seg(t, 0.02, 0.46), 1, k), T1 = lerp(seg(t, 0.05, 0.49), 1, k), E0 = lerp(seg(t, 0.86, 0.98), 0, k), E1 = lerp(seg(t, 0.88, 1), 0, k), U = lerp(seg(t, 0.3, 0.48), 1, k), UE = lerp(seg(t, 0.9, 1), 0, k);
    var glow = bump(seg(t, 0.3, 0.95)) * (0.7 + 0.3 * br), flare = tap ? bump(seg(q, 0, 0.7)) : 0;
    var lit = tap ? seg(q, 0.12, 0.84) * 1.22 : -1;
    p.circle(70, 52, 50 + 4 * br, { fill: 'gold', line: false, alpha: 0.12 * Math.max(glow, k) + 0.1 * flare, glow: 1 });
    p.circle(70, 50, 30 + 3 * br, { fill: 'gold', line: false, alpha: 0.12 * Math.max(glow, k) + 0.12 * flare, glow: 1 });
    yantTiger(p, T0, E0, lit);
    p.pivot(70, 0, 0, [-1, 1], function () { yantTiger(p, T1, E1, tap ? Math.max(0, lit - 0.05) : -1); });
    var ua = lit >= 0 ? clamp((lit - 0.35) / 0.8, 0, 1) : -1;
    if (ua >= 0 && ua < 1.0) p.span(UNALOME, Math.max(0, ua - 0.3), Math.min(ua, U), { w: 3.4, ink: 'gold', glow: 0.9, smooth: true, alpha: 0.9 });
    p.span(UNALOME, UE, U, { w: 1.2, smooth: true, ink: 'ink' });
    if (U > 0.98 && UE < 0.2) p.dot(70, 9.5, 1.5 + 0.5 * br + flare, 'ink');
    if (tap) for (i = 0; i < 2; i++) p.span('M70 55 m-' + (14 + 22 * i) + ' 0 a' + (14 + 22 * i) + ' ' + (14 + 22 * i) + ' 0 1 0 ' + (28 + 44 * i) + ' 0 a' + (14 + 22 * i) + ' ' + (14 + 22 * i) + ' 0 1 0 -' + (28 + 44 * i) + ' 0', ei(seg(q, 0.45 + i * 0.1, 0.95)), eo(seg(q, 0.18 + i * 0.1, 0.7)), { w: 0.8, ink: 'gold', glow: 0.8 });
  }
});

/*@@NEXT*/
})(Dingbats);
