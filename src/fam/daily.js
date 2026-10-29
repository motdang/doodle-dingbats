/* Daily: the ordinary, useful things of a Thai day — money in the hand, a boat, a vest, a helmet, the smoky season, a SIM, a mosquito, a bowl of rice, a headband, a foot rub, a paddy. */
(function (D) {
'use strict';
var M = D.math, TAU = M.TAU, PI = Math.PI, sin = Math.sin, cos = Math.cos;

/* ---------------------------------------------------------------- shared bits */
/* the convex outline of a cloud of points: the band of a coin, which is two faces and what joins them */
function hull(P) {
  var lo = [], up = [], i;
  P = P.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
  function cr(o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }
  for (i = 0; i < P.length; i++) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], P[i]) <= 0) lo.pop(); lo.push(P[i]); }
  for (i = P.length - 1; i >= 0; i--) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], P[i]) <= 0) up.pop(); up.push(P[i]); }
  up.pop(); lo.pop(); return lo.concat(up);
}
/* digits as strokes, each in a cell 6 wide and 10 tall with its corner at the origin */
var DIG = [
  'M3 0 C0 0 0 3 0 5 C0 7 0 10 3 10 C6 10 6 7 6 5 C6 3 6 0 3 0 Z',
  'M1 2.4 L3.6 0 L3.6 10',
  'M0.3 2.6 C0.5 -0.4 5.8 -0.6 5.8 3 C5.8 5.6 1.5 7.4 0 10 L6 10',
  'M0.4 1.4 C3 -0.8 6 0.6 5.6 3 C5.4 4.6 3.4 5 2.4 5 C4 5 6.2 5.8 5.8 7.6 C5.4 10.2 1.6 10.6 0 8.6',
  'M4.4 10 L4.4 0 L0 6.8 L6.4 6.8',
  'M5.6 0 L1 0 L0.6 4.6 C3 3.2 6 4.2 6 7 C6 9.8 2 11 0 8.8',
  'M5.4 1 C2 -0.6 0 2 0 6 C0 10.4 6 10.6 6 7 C6 4 1.5 3.6 0.2 6.4',
  'M0 0.2 L6 0.2 L2.4 10',
  'M3 5 C0 4.6 0.2 0 3 0 C5.8 0 6 4.6 3 5 C0 5.4 -0.2 10 3 10 C6.2 10 6 5.4 3 5',
  'M6 10 C3 10 0 8 0 4 C0 -0.4 6 -0.6 6 3 C6 6 1.5 6.4 0 3.6'
];
/* a number written with its top-left corner at (x, y), h tall, w the weight of the pen */
function num(p, str, x, y, h, w, ink) {
  var k = h / 10, adv = 8.4 * k;
  for (var i = 0; i < str.length; i++) {
    p.at(x + i * adv, y, 0, k, function () { p.path(DIG[+str.charAt(i)], { w: w, cap: 'round', ink: ink || 'ink', wob: 0.3 }); });
  }
}
/* ฿ drawn as strokes: a B with one straight line through it, centred at the origin, about 24 tall at k = 1 */
function baht(p, k, w, ink) {
  p.at(0, 0, 0, k, function () {
    var o = { w: w, cap: 'round', ink: ink || 'ink', wob: 0.3 };
    p.path('M-4.5 -9 L1.5 -9 C6 -9 6 -0.6 1.5 -0.6 L-4.5 -0.6', o);
    p.path('M-4.5 -0.6 L2.5 -0.6 C7.8 -0.6 7.8 9 2.5 9 L-4.5 9 L-4.5 -9', o);
    p.line(-0.8, -12, -0.8, 12, o);
  });
}
/* a ring of expanding sound, drawn arcs: the chime of a thing paid */
function chime(p, x, y, ph, dir) {
  [0, 1].forEach(function (k) {
    var u = M.seg(ph, k * 0.12, 0.7 + k * 0.12), r = 7 + 9 * M.easeOut(u) + k * 6;
    if (u > 0 && u < 1) p.span('M' + (x + dir * r * cos(-0.9)) + ' ' + (y + r * sin(-0.9)) + ' A' + r + ' ' + r + ' 0 0 ' + (dir > 0 ? 1 : 0) + ' ' + (x + dir * r * cos(0.9)) + ' ' + (y + r * sin(0.9)), M.easeIn(M.seg(u, 0.5, 1)), M.easeOut(M.seg(u, 0, 0.5)), { w: 0.9, ink: 'a', cap: 'round' });
  });
}

/* a flat ribbon along a spine, w0 wide at the start and w1 at the end: ribbons, cords, straps */
function strap(p, sp, w0, w1, o) {
  var n = sp.length, L = [], R = [], i, a, b, d, h;
  for (i = 0; i < n; i++) {
    a = sp[Math.max(0, i - 1)]; b = sp[Math.min(n - 1, i + 1)]; d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; h = (w0 + (w1 - w0) * i / (n - 1)) / 2;
    L.push([sp[i][0] - (b[1] - a[1]) / d * h, sp[i][1] + (b[0] - a[0]) / d * h]); R.unshift([sp[i][0] + (b[1] - a[1]) / d * h, sp[i][1] - (b[0] - a[0]) / d * h]);
  }
  return p.curve(L.concat(R), Object.assign({ close: true }, o));
}
/* a wavy line of points across x0..x1, sliding along as ph runs on */
function swell(x0, x1, y, amp, lam, ph, step) { var a = [], x; for (x = x0; x <= x1 + 0.1; x += step || 5) a.push([x, y + amp * sin(TAU * (x / lam + ph))]); return a; }

/* the pen's own parts (move, turn, size) set up any 2 × 2 map x' = a x + c y, y' = b x + d y about (e, f): a turn, a stretch, a turn */
function affine(p, a, b, c, d, e, f) {
  var E = (a + d) / 2, F = (a - d) / 2, G = (c + b) / 2, H = (b - c) / 2, Q = Math.sqrt(E * E + H * H), R = Math.sqrt(F * F + G * G), a1 = Math.atan2(G, F), a2 = Math.atan2(H, E);
  p.move(e, f); p.turn((a2 + a1) / 2); p.size(Q + R, Q - R); p.turn((a2 - a1) / 2);
}

/* ---------------------------------------------------------------- baht */
/* a baht coin as a real disc in space: turned about the vertical (ph) and tipped about the horizontal (th). Its band is the
   outline of the two faces pushed apart along the normal; the face toward us is drawn on top, the ฿ on it, mirrored the way a
   coin is when we see it from behind. The coin rests on its edge on y = 84, wherever it leans. */
function disc(p, cx, ground, R, T, ph, th, lift) {
  var cs = cos(ph), sn = sin(ph), ct = cos(th), st = sin(th), i, a, u, v, P = [], A = [], B = [], h = T / 2, base = 0;
  for (i = 0; i < 20; i++) {
    a = i / 20 * TAU; u = R * cos(a); v = R * sin(a);
    A.push([h * sn + cs * u, h * cs * st - sn * st * u + ct * v]); B.push([-h * sn + cs * u, -h * cs * st - sn * st * u + ct * v]);
  }
  P = A.concat(B); P.forEach(function (q) { base = Math.max(base, q[1]); });
  var cy = ground - base - lift, front = cs * ct >= 0, g = front ? 1 : -1;
  var H = hull(P).map(function (q) { return [cx + q[0], cy + q[1]]; });
  p.ellipse(cx, ground + 2.5, 14 + 7 * Math.abs(sn) - 5 * lift / 30, 3.4 - lift / 30 * 1.4, { fill: 'smoke', line: false });
  p.poly(H, { fill: 'gold', w: 1.1 });
  p.push();
  affine(p, g * cs, g * -sn * st, 0, ct, cx + g * h * sn, cy + g * h * cs * st);
  p.circle(0, 0, R, { fill: 'gold', w: 1.1 });
  p.circle(0, 0, R * 0.7, { fill: front ? 'stone' : 'smoke', w: 0.6 });
  p.circle(0, 0, R * 0.62, { w: 0.35, detail: true, alpha: 0.7 });
  if (front) baht(p, R / 24 * 0.9, 1.15 + (p.small ? 0.25 : 0));
  else {
    p.path('M-1.6 9 L-1.6 -1 C-1.6 -5 -0.6 -8 0 -11 C0.6 -8 1.6 -5 1.6 -1 L1.6 9 Z', { w: 0.8 });
    p.path('M-7 9 L-7 3 C-7 0 -5.4 -3 -5 -5 C-4.6 -3 -3.4 0 -3.4 3 L-3.4 9', { w: 0.7 }); p.path('M7 9 L7 3 C7 0 5.4 -3 5 -5 C4.6 -3 3.4 0 3.4 3 L3.4 9', { w: 0.7 });
    p.line(-10, 9, 10, 9, { w: 0.9 });
  }
  /* the glint: a star of light that opens only when the face looks straight at us */
  var gl = Math.pow(Math.abs(cs * ct), 8);
  if (gl > 0.05) { var gx = -R * 0.46, gy = -R * 0.5, r1 = 6.5 * gl; p.poly([[gx, gy - r1], [gx + r1 * 0.2, gy - r1 * 0.2], [gx + r1, gy], [gx + r1 * 0.2, gy + r1 * 0.2], [gx, gy + r1], [gx - r1 * 0.2, gy + r1 * 0.2], [gx - r1, gy], [gx - r1 * 0.2, gy - r1 * 0.2]], { fill: 'white', line: false }); }
  p.pop();
}
D.add('baht', {
  fam: 'daily', tapRest: 0.6, tags: ['baht', 'thb', 'coin', 'money', 'price', 'cash', 'pay', 'cost', 'currency', 'thai', 'บาท', 'เหรียญ', '฿'], loop: 1.6, still: 0, tapLen: 1.5, burst: 'star', burstAt: [50, 72], burstN: 6, burstSpread: 1.8, burstDelay: 0.66, burstColor: 'gold',
  margin: [18, 18, 10, 18], about: 'a baht coin spinning on its edge, the ฿ turning edge-on and back, a glint when it faces you', tapAbout: 'it leans back, leaps and turns over once in the air, lands on its edge with a ring of stars and goes on spinning',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), tapping = s.tap >= 0, R = 29, ph = TAU * 2 * t, th = 0.1 + 0.07 * M.wave(t, 1, 0.1), lift = 0, a;
    if (tapping) {
      var lean = M.ease(M.seg(tp, 0, 0.12)) * (1 - M.ease(M.seg(tp, 0.12, 0.2)));
      a = M.seg(tp, 0.12, 0.66);
      lift = 34 * 4 * a * (1 - a);
      th += 0.42 * lean + TAU * M.ease(a);
      var land = M.seg(tp, 0.66, 1), settle = Math.exp(-5 * land) * sin(TAU * 2.5 * land);
      th += 0.34 * settle * (land > 0 ? 1 : 0);
    }
    disc(p, 50, 84, R, 4.4, ph, th, lift);
  }
});

/* ---------------------------------------------------------------- qr-pay */
/* a QR code, its corner at (x, y), 26 square: three finders and modules that never change */
function qr(p, x, y, ink) {
  var i, j, c = 2;
  [[0, 0], [16, 0], [0, 16]].forEach(function (f) {
    p.rect(x + f[0], y + f[1], 10, 10, { w: 0.8, ink: ink });
    p.rect(x + f[0] + 3, y + f[1] + 3, 4, 4, { fill: ink, line: false });
  });
  for (i = 0; i < 13; i++) for (j = 0; j < 13; j++) {
    if ((i < 6 && j < 6) || (i > 7 && j < 6) || (i < 6 && j > 7)) continue;
    if ((i * 5 + j * 3 + i * j) % 4 < 2) p.rect(x + i * c, y + j * c, c * 0.92, c * 0.92, { fill: ink, line: false, detail: true });
  }
}
D.add('qr-pay', {
  fam: 'daily', tapRest: 0.5, tags: ['qr', 'qr code', 'scan', 'pay', 'payment', 'phone', 'baht', 'checkout', 'shop', 'stall', 'transfer', 'จ่าย', 'สแกน', 'คิวอาร์'], loop: 2.4, still: 0.3, tapLen: 2.2, burst: 'note', burstAt: [40, 30], burstN: 3, burstSpread: 1.6, burstDelay: 0.16, burstColor: 'gold',
  margin: [22, 14, 8, 8], about: 'a phone leans in and out at a QR stand, a green line sweeping the code', tapAbout: 'the phone snaps in, its screen floods green with a drawn tick and the ฿ amount, a chime rings out and the stand gets its tick',
  draw: function (p, t, s) {
    var u = Math.max(0, s.tap), tapping = s.tap >= 0, lean = 0.17 + 0.035 * M.wave(t, 1, 0.1), dx = 2.4 * M.wave(t, 1), dy = 0.8 * M.wave(t, 2, 0.2);
    var wipe = 0, tick = 0, badge = 0, i;
    if (tapping) {
      dx += 4 * M.spring(M.seg(u, 0, 0.2)) * (1 - M.ease(M.seg(u, 0.74, 0.96)));
      wipe = M.ease(M.seg(u, 0.12, 0.34)) * (1 - M.ease(M.seg(u, 0.8, 0.96)));
      tick = M.easeIn(M.seg(u, 0.84, 0.97)); badge = M.spring(M.seg(u, 0.3, 0.52)) * (1 - M.ease(M.seg(u, 0.8, 0.96)));
    }
    var cx = 27 + dx, cy = 66 + dy, c = cos(lean), sn = sin(lean);
    function wp(x, y) { return [cx + x * c - y * sn, cy + x * sn + y * c]; }
    /* the stand */
    p.rect(60, 86, 30, 6, { fill: 'stone', r: 2, w: 0.9 });
    p.rect(58, 12, 34, 76, { fill: 'white', r: 4, w: 1 });
    p.path('M58 26 L58 16 C58 13.5 60 12 62 12 L88 12 C90 12 92 13.5 92 16 L92 26 Z', { fill: 'navy', w: 0.8 });
    p.line(63, 17, 77, 17, { w: 1, ink: 'white', cap: 'round' }); p.line(63, 22, 71, 22, { w: 0.7, ink: 'white', cap: 'round', detail: true }); p.circle(85, 19, 3.2, { fill: 'gold', w: 0.6 });
    qr(p, 62, 31, 'ink');
    if (badge > 0.02) p.rect(60.5, 29.5, 31, 31, { fill: 'green', line: false, alpha: 0.28 * Math.min(1, badge) });
    p.at(72.5, 68, 0, 1, function () { baht(p, 0.4, 0.72); });
    num(p, '50', 77, 63.5, 9, 0.7);
    p.line(63, 79, 87, 79, { w: 0.6, ink: 'grey', detail: true });
    /* what the camera sees: a beam from the phone's top edge to the code */
    var cam = wp(6, -27);
    p.line(cam[0], cam[1], 62, 33, { w: 0.5, dash: [2, 2.4], dashOff: -t * 4.4, ink: 'leaf', detail: true });
    p.line(cam[0], cam[1], 62, 57, { w: 0.5, dash: [2, 2.4], dashOff: -t * 4.4, ink: 'leaf', detail: true });
    /* the scan line, until the payment lands */
    var ly = 32 + 24 * (0.5 + 0.5 * M.wave(t, 1, -0.25)), keep = tapping ? 1 - M.ease(M.seg(u, 0.1, 0.3)) : 1;
    if (keep > 0.02) { p.rect(62, ly - 3, 26, 6, { fill: 'leaf', line: false, alpha: 0.22 * keep, detail: true }); p.line(61, ly, 89, ly, { w: 1.1, ink: 'leaf', cap: 'round' }); }
    if (badge > 0.02) p.at(88, 15, 0, badge, function () { p.circle(0, 0, 7.5, { fill: 'leaf', w: 1 }); p.path('M-3.6 0.4 L-0.8 3.2 L3.8 -2.6', { w: 1.5, ink: 'white', cap: 'round' }); });
    if (tapping) chime(p, cam[0] + 8, cam[1] + 2, M.seg(u, 0.16, 0.9), 1);
    /* the phone */
    p.at(cx, cy, lean, 1, function () {
      p.rect(-14, -27, 28, 54, { fill: 'night', r: 5, w: 1.05 });
      p.rect(-11.5, -22, 23, 44, { fill: 'cream', r: 2, w: 0.5 });
      p.line(-3, -24.5, 3, -24.5, { w: 0.7, ink: 'grey', cap: 'round', detail: true });
      var k = 1 + 0.045 * M.wave(t, 2, 0.15);
      p.pivot(0, -5, 0, k, function () {
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { p.path('M' + (q[0] * 8) + ' ' + (-5 + q[1] * 4) + ' L' + (q[0] * 8) + ' ' + (-5 + q[1] * 9) + ' L' + (q[0] * 8 - q[0] * 4.5) + ' ' + (-5 + q[1] * 9), { w: 1.1, ink: 'leaf', cap: 'round' }); });
        p.rect(-5, -10, 4, 4, { fill: 'ink', line: false }); p.rect(1, -10, 4, 4, { fill: 'ink', line: false }); p.rect(-5, -4, 4, 4, { fill: 'ink', line: false }); p.rect(1.5, -3.5, 2.5, 2.5, { fill: 'ink', line: false, detail: true });
      });
      p.rect(-7, 12, 14, 4, { fill: 'smoke', r: 2, line: false, detail: true });
      if (wipe > 0.01) p.clip(function () { p.rect(-11.5, -22, 23, 44, { r: 2 }); }, function () {
        p.circle(0, -2, 34 * wipe, { fill: 'leaf', line: false });
        p.span('M-7 -8 L-2.5 -2.5 L7.5 -14', M.easeIn(M.seg(u, 0.8, 0.92)), M.easeOut(M.seg(u, 0.3, 0.46)), { w: 2.2, ink: 'white', cap: 'round' });
      });
      if (wipe > 0.6) { p.at(-3.5, 11, 0, 1, function () { baht(p, 0.34, 0.9, 'white'); }); num(p, '50', 1.6, 7, 7, 0.65, 'white'); }
    });
  }
});

/* ---------------------------------------------------------------- longtail */
/* เรือหางยาว: the hull is long, low and narrow with a prow that sweeps up high, ribbons and a marigold garland tied at its tip;
   a car engine sits on the stern and its shaft runs out behind into the water. */
var HULL = 'M54 58 L98 58 C110 58 124 48 135 37 C138 34 141 32 144 31 C143 37 142 43 139 49 C133 61 121 70 105 73 L62 73 C57 73 54.5 66 54 58 Z';
D.add('longtail', {
  fam: 'daily', tapRest: 0.55, tags: ['longtail', 'long tail', 'boat', 'river', 'island', 'krabi', 'phuket', 'ferry', 'sea', 'tour', 'wake', 'เรือหางยาว', 'เรือ'], loop: 2, still: 0.1, ratio: 1.6, tapLen: 2.2, burst: 'drop', burstAt: [14, 66], burstN: 7, burstSpread: 1.7, burstDelay: 0.3, burstColor: 'sky', burstGravity: 110,
  margin: [26, 6, 8, 10], about: 'a longtail boat rocks on the water, ribbons streaming off the prow, the engine shaking, spray flying off the propeller', tapAbout: 'the engine coughs black smoke twice, then the boat surges: the bow lifts, the ribbons stream straight back and the spray doubles',
  draw: function (p, t, s) {
    var u = Math.max(0, s.tap), tapping = s.tap >= 0, i, k, ph;
    p.move(5, 0);
    var cough = tapping ? M.bump(M.seg(u, 0.02, 0.3)) : 0, surge = tapping ? M.ease(M.seg(u, 0.3, 0.46)) * (1 - M.ease(M.seg(u, 0.62, 0.9))) : 0;
    var shake = (0.45 + 1.6 * cough) * sin(TAU * 8 * t + 6 * u), pitch = 0.028 * M.wave(t, 1) - 0.06 * surge, bob = 1.3 * M.wave(t, 1, 0.12) + 1.3 * surge, lunge = 4 * surge;
    /* water behind everything that sits on it: deep lines, then the hull, then the surface over its foot */
    [[80, 0.31], [90, 0.77]].forEach(function (r, j) { p.curve(swell(-5, 155, r[0], 1.1, 24, 2 * t * (j ? -1 : 1) + r[1], 6), { w: 0.4, ink: 'blue', detail: true, alpha: 0.55 }); });
    p.pivot(78, 72, pitch, 1, function () {
      p.move(lunge, bob);
      p.path(HULL, { fill: 'wood' });
      p.clip(HULL, function () {
        p.rect(50, 67, 100, 12, { fill: 'navy', line: false });
        p.path('M50 61.5 L98 61.5 C112 61.5 125 52 140 36', { w: 3.2, ink: 'c', cap: 'round', wob: 0.3 });
        p.path('M54 65 L104 66.4 C118 64 131 54 141 44', { w: 0.4, detail: true, alpha: 0.8 });
      });
      p.path(HULL, {});
      p.line(58, 58, 98, 58, { w: 0.9 });
      /* the ribbons stream back from the prow's tip; the farther along, the wider the wave and the later it arrives */
      ['red', 'pink', 'yellow', 'sky', 'leaf', 'orange'].forEach(function (c, j) {
        var sp = [], n = 10, q, L = (31 + 6 * ((j * 5) % 6) / 5) * (1 + 0.3 * surge);
        for (q = 0; q <= n; q++) { var a = q / n; sp.push([140.5 - a * L, 36 + j * 1.5 + (1 + 13 * a * a) * (1 - 0.9 * surge) + (1.2 + 5 * a) * (1 - 0.5 * surge) * sin(TAU * (a * 1.3 - 2 * t + j * 0.09))]); }
        strap(p, sp, 4.2, 2, { fill: c, w: 0.55 });
      });
      p.circle(140.5, 37.5, 2.9, { fill: 'gold', w: 0.8 });
      /* the garland over the stem: marigolds on a thread, swinging a beat after the boat */
      var swing = 1.6 * M.wave(t, 2, 0.2) - 2 * surge;
      for (i = 0; i < 6; i++) {
        var gv = (i + 0.5) / 6, gx = 143.5 + 4.2 * sin(PI * gv) + swing * gv, gy = 31.5 + 24 * gv;
        p.circle(gx, gy, 2.7 - 0.3 * gv, { fill: i % 2 ? 'orange' : 'yellow', w: 0.6 });
      }
      p.path('M144 31 C150 40 148 50 142 56', { w: 0.4, detail: true, alpha: 0.6 });
      /* the engine on the stern: a block with a red cover, a flywheel at its back, a pipe up, the shaft out behind */
      p.push(); p.move(0, 0.6 * shake);
      var ex = 38, ey = 50, pr = [10.5, 69.5];
      p.line(ex, ey, pr[0], pr[1], { w: 2.4, ink: 'grey', cap: 'round', wob: 0.3 });
      p.line(ex, ey, pr[0], pr[1], { w: 0.5, ink: 'ink', cap: 'round', wob: 0.3 });
      p.line(45, 59, 51, 59, { w: 2, cap: 'round' });
      p.rect(40, 42, 20, 16, { fill: 'grey', r: 2.5, w: 1 });
      p.rect(42, 37.5, 16, 6, { fill: 'red', r: 2, w: 0.8 });
      p.line(44, 48, 56, 48, { w: 0.4, detail: true }); p.line(44, 52, 56, 52, { w: 0.4, detail: true });
      p.circle(ex + 1, ey, 5.4, { fill: 'smoke', w: 0.9 });
      for (k = 0; k < 3; k++) p.at(ex + 1, ey, TAU * 3 * t + k * TAU / 3, 1, function () { p.line(0, 0, 0, -4.2, { w: 0.4, detail: true }); });
      p.dot(ex + 1, ey, 1.3, 'ink');
      p.path('M56 38 L56 28 C56 25 59 24 61 25', { w: 1.5, ink: 'ink', cap: 'round' });
      p.rect(58, 50, 5, 6, { fill: 'flame', w: 0.6, r: 1 });
      p.pop();
      /* black smoke from the pipe: it coughs */
      for (k = 0; k < 2; k++) {
        var cu = tapping ? M.seg(u, 0.03 + k * 0.1, 0.5 + k * 0.1) : -1;
        if (cu > 0 && cu < 1) { var cr = (3 + 6 * M.easeOut(cu)) * (1 - M.easeIn(M.seg(cu, 0.6, 1))), cxp = 61 - 20 * cu - 4 * k, cyp = 25 - 18 * cu; p.blob(cxp, cyp, cr, { fill: 'grey', lumpy: 0.25, seed: 4 + k, w: 0.8 }); p.blob(cxp - cr * 0.7, cyp + cr * 0.3, cr * 0.7, { fill: 'smoke', lumpy: 0.25, seed: 7 + k, w: 0.7 }); p.blob(cxp + cr * 0.6, cyp - cr * 0.5, cr * 0.6, { fill: 'smoke', lumpy: 0.25, seed: 9 + k, w: 0.7 }); }
      }
      /* the propeller under the water, a blur, with the spray thrown up and back off it */
      p.ellipse(pr[0], pr[1] + 3, 3.6, 7.5, { fill: 'grey', line: false, alpha: 0.3 });
      p.ellipse(pr[0], pr[1] + 3, 1.7, 6.2 + 1.4 * M.wave(t, 6), { fill: 'grey', w: 0.6 });
    });
    /* the surface, over the foot of the hull; the swell slides back as the boat goes */
    var top = swell(-5, 155, 70.5, 1.7, 26, 2 * t, 5), poly = top.concat([[155, 100], [-5, 100]]);
    p.poly(poly, { fill: 'sky', line: false, alpha: 0.62 });
    p.curve(top, { w: 0.9, ink: 'blue' });
    p.curve(swell(-5, 155, 76, 1.3, 20, 3 * t + 0.4, 5), { w: 0.4, ink: 'blue', detail: true, alpha: 0.6 });
    /* the wake: foam dashes running back from the stern, more of them in the surge */
    for (i = 0; i < 4 + (surge > 0.2 ? 2 : 0); i++) {
      ph = M.frac(t * 1 + i / 4); var len = (7 + 8 * surge) * M.bump(ph), x = 46 - 34 * ph - i * 2, y = 72.5 + (i % 3) * 3.2 + 3 * ph;
      if (len > 0.8) p.line(x, y, x - len, y, { w: 0.9, ink: 'white', cap: 'round' });
    }
    /* the spray: drops thrown up and back from the propeller, each rising, turning and falling */
    var nd = 6 + Math.round(4 * surge);
    for (i = 0; i < nd; i++) {
      ph = M.frac(t * 2 + i / nd); var dxp = -16 * ph * (1 + 0.6 * surge), dyp = -(26 + 12 * surge) * 4 * ph * (1 - ph) * (0.6 + 0.4 * ((i * 5) % 3) / 2), rr = (1.5 + 0.7 * ((i * 7) % 3) / 2) * (1 - 0.5 * ph);
      p.circle(12 + dxp + bob * 0 + lunge * 0.3, 67 + dyp + dyp * 0, rr, { fill: i % 2 ? 'white' : 'sky', w: 0.5 });
    }
    /* the bow wave: a curl of white that swells at the stem */
    p.blob(137 + lunge, 70.5, 2.6 + 0.9 * M.wave(t, 2) + 1.4 * surge, { fill: 'white', lumpy: 0.2, seed: 3, w: 0.6 });
    p.blob(142 + lunge, 71.5, 1.8 + 0.6 * M.wave(t, 2, 0.3) + 0.8 * surge, { fill: 'white', lumpy: 0.2, seed: 5, w: 0.5 });
  }
});

/* ---------------------------------------------------------------- win-moto */
/* the motorbike-taxi rider's vest, hung on a hanger: orange, the rider's number on the back, the stand's name above it as a few dashes.
   Hangs and sways, the hem a little behind the shoulders. */
function vestPath(front, hem) {
  var neck = front ? 'L43 29 L50 50 L57 29' : 'L43 29 C46 34 54 34 57 29';
  return 'M30 30 ' + neck + ' L70 30 C70 38 66 46 64 52 C67 64 71 76 72 ' + (87 + hem) + ' C60 ' + (91 + hem * 1.4) + ' 40 ' + (91 - hem * 1.4) + ' 28 ' + (87 - hem) + ' C29 76 33 64 36 52 C34 46 30 38 30 30 Z';
}
D.add('win-moto', {
  fam: 'daily', tapRest: 0.5, tags: ['win', 'motorbike taxi', 'moto taxi', 'motorcycle taxi', 'vest', 'rider', 'driver', 'orange', 'transport', 'ride', 'วินมอเตอร์ไซค์', 'วิน', 'เสื้อวิน', 'มอเตอร์ไซค์รับจ้าง'], loop: 2.4, still: 0.2, tapLen: 1.8, burst: false,
  margin: [10, 18, 8, 18], about: 'the orange numbered vest swings on its hanger, the hem a beat behind the shoulders', tapAbout: 'the hanger spins the vest right round: the front shows its pocket number and ID card, then it spins back to the number',
  draw: function (p, t, s) {
    var u = Math.max(0, s.tap), tapping = s.tap >= 0, a = 0, sway = 0.07 * M.wave(t, 1) + 0.015 * M.wave(t, 3, 0.2), hem = 2.2 * M.wave(t, 1, -0.12), i;
    if (tapping) a = PI * M.ease(M.seg(u, 0.04, 0.36)) + PI * M.ease(M.seg(u, 0.62, 0.94));
    var sx = cos(a), front = sx < 0;
    p.pivot(53, 9, sway * (1 - 0.8 * (tapping ? M.bump(M.seg(u, 0, 1)) : 0)), 1, function () {
      p.pivot(50, 50, 0, [Math.max(0.03, Math.abs(sx)), 1], function () {
        p.path('M50 15 L26 33 L74 33 Z', { w: 0.9, fill: 'wood' });
        p.path('M50 15 L50 10 C50 3.5 58 4 57 10', { w: 1.3, cap: 'round' });
        p.pivot(50, 26, 0.035 * M.wave(t, 1, -0.1), 1, function () {
          p.path(vestPath(front, hem), { fill: 'orange', w: 1.05 });
          p.clip(vestPath(front, hem), function () {
            p.line(20, 83 + hem, 80, 83 - hem, { w: 2.6, ink: 'cream', alpha: 0.9, cap: 'round' });
            if (!front) p.path('M30 30 L43 29 C46 34 54 34 57 29 L70 30 L70 36 L30 36 Z', { fill: 'a', line: false, alpha: 0.5, detail: true });
            for (i = 0; i < 3; i++) p.path('M' + (26 + i * 2) + ' ' + (36 + i * 4) + ' C' + (31 + i) + ' ' + (60 + i * 5) + ' ' + (28 + i) + ' 72 ' + (27 + i) + ' 82', { w: 0.35, detail: true, alpha: 0.35 });
          });
          p.path(vestPath(front, hem), { w: 1.05 });
          if (!front) {
            p.path('M43 29 C46 34 54 34 57 29', { w: 1.1 });
            p.line(41, 39.5, 47, 39.5, { w: 1.3, ink: 'night', cap: 'round' }); p.line(50, 39.5, 53, 39.5, { w: 1.3, ink: 'night', cap: 'round' }); p.line(56, 39.5, 61, 39.5, { w: 1.3, ink: 'night', cap: 'round' });
            p.rect(34, 44, 32, 37, { fill: 'cream', r: 4, w: 0.9 });
            if (p.small) { p.rect(39, 51, 7, 22, { fill: 'night', line: false }); p.rect(54, 51, 7, 22, { fill: 'night', line: false }); } else num(p, '27', 36.2, 51, 22, 1.9, 'night');
          } else {
            p.path('M43 29 L50 50 L57 29', { w: 1.1 });
            p.line(50, 50, 50 + 0.4 * hem, 88 + hem * 0.6, { w: 0.7 });
            for (i = 0; i < 4; i++) p.dot(50, 57 + i * 8, 1.2, 'night');
            p.rect(32.5, 55, 14, 12, { fill: 'cream', r: 1.5, w: 0.8 });
            num(p, '27', 35, 57.5, 7.5, 0.8, 'night');
            p.path('M45 30 L50 41 L55 30', { w: 0.4, ink: 'night', detail: true });
            p.rect(53.5, 42, 10, 13, { fill: 'white', r: 1.5, w: 0.8 });
            p.circle(58.5, 47, 2.3, { fill: 'skin', w: 0.5, detail: true }); p.line(55.5, 52, 61.5, 52, { w: 0.5, detail: true });
          }
        });
      });
    });
  }
});

/* ---------------------------------------------------------------- helmet */
/* an open-face motorbike helmet in profile, facing right: a dome with a short peak, ear flaps, a clear shield on screws at the temple, a chin strap with its buckle */
var SHELL = 'M12 66 C8 38 28 14 54 14 C78 14 93 30 95 53 L95 57 C85 58 76 60 70 64 C67 70 66 76 62 79 C58 81 53 80 51 76 C48 70 40 68 30 69 L14 70 C13 69 12.5 67.5 12 66 Z';
D.add('helmet', {
  fam: 'daily', tapRest: 0.4, tags: ['helmet', 'motorbike', 'motorcycle', 'scooter', 'safety', 'visor', 'ride', 'rental', 'head', 'หมวกกันน็อค', 'หมวกกันน็อก', 'หมวก'], loop: 2.2, still: 0.1, tapLen: 1.5, burst: 'spark', burstAt: [84, 36], burstN: 4, burstSpread: 1.2, burstDelay: 0.7,
  margin: [24, 12, 22, 10], about: 'the helmet rocks a little on its dome, the strap swinging after it and a glint crossing the shell', tapAbout: 'the shield flips up on its screws with a click, stays a moment, and snaps down again',
  draw: function (p, t, s) {
    var u = Math.max(0, s.tap), tapping = s.tap >= 0, up = tapping ? M.spring(M.seg(u, 0.04, 0.34)) * (1 - M.ease(M.seg(u, 0.56, 0.7))) : 0, rock = 0.05 * M.wave(t, 1), lag = 0.3 * M.wave(t, 1, -0.2) - 0.25 * rock, gl = M.frac(t * 1);
    p.ellipse(52, 91, 34, 4, { fill: 'smoke', line: false });
    p.pivot(50, 84, rock + (tapping ? 0.04 * M.bump(M.seg(u, 0.04, 0.3)) : 0), 1, function () {
      /* the strap, hanging from under the ear flap */
      p.pivot(58, 79, lag, 1, function () {
        p.path('M54.5 79 C54 84 54 88 55 93', { w: 1.9, ink: 'night', cap: 'round' }); p.path('M62 79 C62.5 84 63.5 88 63 93', { w: 1.9, ink: 'night', cap: 'round' });
        p.rect(52.5, 92, 12, 6, { fill: 'stone', r: 1.5, w: 0.9 }); p.line(55, 95, 62, 95, { w: 0.5, detail: true });
      });
      p.path(SHELL, { fill: 'red' });
      p.clip(SHELL, function () {
        p.path('M5 44 C26 32 70 36 100 52', { w: 4.6, ink: 'white', cap: 'round', alpha: 0.95, line: true });
        p.path('M40 8 C62 8 90 22 100 44 L100 8 Z', { fill: 'white', line: false, alpha: 0.12, detail: true });
        var gu = M.seg(gl, 0.1, 0.6), x = M.lerp(-12, 112, M.ease(gu));
        if (gu > 0 && gu < 1) {
          p.poly([[x, 6], [x + 7, 6], [x - 6, 72], [x - 13, 72]], { fill: 'white', line: false, alpha: 0.5 });
          p.poly([[x + 11, 6], [x + 14, 6], [x + 1, 72], [x - 2, 72]], { fill: 'white', line: false, alpha: 0.4 });
        }
      });
      p.path(SHELL, {});
      p.path('M95 57 C85 58 76 60 70 64 C67 70 66 76 62 79 C58 81 53 80 51 76 C48 70 40 68 30 69 L14 70', { w: 2.4, ink: 'night', cap: 'round', wob: 0.4 });
      p.path('M70 62 C60 62 56 66 54 72', { w: 0.45, detail: true });
      /* the screw, and the shield on it */
      p.pivot(78, 40, -2.2 * up, [1 - 0.08 * up, 1 - 0.08 * up], function () {
        p.path('M78 38 C96 36 107 48 106 62 C105 75 97 84 86 85 C80 80 73 72 70 65 L80 59 C84 52 82 44 78 38 Z', { fill: 'sky', alpha: 0.42, w: 0.95 });
        p.path('M96 46 C102 52 103 62 99 72', { w: 0.7, ink: 'white', alpha: 0.95, detail: true });
        p.path('M92 44 C94 45 96 46 97 48', { w: 0.7, ink: 'white', alpha: 0.95, detail: true });
        p.path('M106 62 C105 75 97 84 86 85', { w: 2, ink: 'night', cap: 'round', wob: 0.3 });
      });
      p.circle(78, 40, 2, { fill: 'stone', w: 0.8 });
      if (tapping) { var k = M.bump(M.seg(u, 0.03, 0.2)); if (k > 0.05) { for (var i = 0; i < 3; i++) p.line(80 + 4 * cos(-0.6 + i * 0.7) * 1.1, 40 + 4 * sin(-0.6 + i * 0.7) * 1.1, 80 + (4 + 5 * k) * cos(-0.6 + i * 0.7), 40 + (4 + 5 * k) * sin(-0.6 + i * 0.7), { w: 0.6, ink: 'a', cap: 'round' }); } }
    });
  }
});

/* ---------------------------------------------------------------- dust-mask */
/* a pleated mask (worn through the burning season, PM2.5) with its ear loops, haze drifting past: what comes straight at it is stopped */
var MASK = 'M23 41 C23 38.5 25 37 28 37 L72 37 C75 37 77 38.5 77 41 L77 62 C77 71 69 77 59 77 L41 77 C31 77 23 71 23 62 Z';
D.add('dust-mask', {
  fam: 'daily', tapRest: 0.45, tags: ['mask', 'dust mask', 'face mask', 'n95', 'pm2.5', 'haze', 'smoke', 'burning season', 'air quality', 'pollution', 'health', 'breathe', 'หน้ากาก', 'หน้ากากอนามัย', 'ฝุ่น', 'pm 2.5', 'หมอกควัน'], loop: 3.6, still: 0.2, tapLen: 2, burst: 'bubble', burstAt: [88, 58], burstN: 5, burstSpread: 1.3, burstDelay: 0.35, burstColor: 'mint', burstGravity: -30,
  margin: [14, 16, 14, 16], about: 'the mask breathes in and out while smoke specks drift across; the ones that come straight at it are stopped on its face', tapAbout: 'a thick wave of haze rushes in and every speck pops against the mask; clean air breathes out of the far side',
  draw: function (p, t, s) {
    var u = Math.max(0, s.tap), tapping = s.tap >= 0, i, ph, k, br = 0.035 * M.wave(t, 1), hit = 0, rock = 0;
    if (tapping) { hit = M.bump(M.seg(u, 0.18, 0.5)); br += 0.05 * M.bump(M.seg(u, 0.3, 0.7)); rock = 0.035 * sin(TAU * 4 * M.seg(u, 0.2, 0.6)) * M.bump(M.seg(u, 0.2, 0.6)); }
    /* a haze that never quite clears: faint bands sliding across */
    for (i = 0; i < 3; i++) p.curve(swell(-6, 106, 12 + i * 40, 2.2, 30, t * (i % 2 ? -1 : 1) + i * 0.3, 8), { w: 0.5, ink: 'stone', alpha: 0.8, detail: true });
    /* specks that sail past above and below the mask, and ones that run into it and stop */
    [[16, 1, 0.1, 3.2], [88, 1, 0.45, 2.6], [10, 2, 0.7, 1.8], [92, 2, 0.2, 2.8], [26, 1, 0.83, 2.2], [84, 1, 0.31, 3.4]].forEach(function (c, j) {
      var x = -8 + 116 * M.frac(t * c[1] + c[2]), y = c[0] + 3 * sin(TAU * (t * 2 + c[2] * 3));
      p.blob(x, y, c[3], { fill: 'smoke', lumpy: 0.3, seed: j + 3, w: 0.55, detail: j > 2 });
    });
    [[40, 0.0], [48, 0.34], [57, 0.62], [66, 0.18], [73, 0.5], [44, 0.78], [61, 0.9]].forEach(function (c, j) {
      ph = M.frac(t * (j % 2 ? 1 : 2) + c[1] + 0.001); var x = -8 + 30 * ph, r = (2 + (j % 3) * 0.6) * (1 - M.easeIn(M.seg(ph, 0.8, 1))), sq = 1 + 0.9 * M.seg(ph, 0.7, 1);
      if (r > 0.3) p.at(x, c[0] + 2 * sin(TAU * (ph * 2 + j * 0.2)), 0, [1 / sq, sq], function () { p.blob(0, 0, r, { fill: 'smoke', lumpy: 0.3, seed: j + 1, w: 0.55 }); });
    });
    if (tapping) for (i = 0; i < 12; i++) {
      var a0 = 0.02 * i, a1 = 0.34 + 0.02 * i, mu = M.seg(u, a0, a1), ly = 40 + (i * 37) % 34, x2 = -10 + 32 * M.easeOut(mu);
      if (mu > 0 && mu < 1) p.blob(x2, ly + 3 * sin(TAU * mu * 2 + i), 2.6 * (1 - M.easeIn(M.seg(mu, 0.8, 1))), { fill: 'smoke', lumpy: 0.3, seed: i + 2, w: 0.55 });
      var pu = M.seg(u, a1, a1 + 0.12);
      if (pu > 0 && pu < 1) for (k = 0; k < 3; k++) { var an = -0.9 + k * 0.9 + i * 0.4, r0 = 2 + 2 * pu, r1 = 3.5 + 6 * M.easeOut(pu); p.line(21 + r0 * cos(an) * 0.6, ly + r0 * sin(an), 21 + r1 * cos(an) * 0.6, ly + r1 * sin(an), { w: 0.6, ink: 'grey', cap: 'round' }); }
    }
    /* the mask, its loops lagging the breath */
    var lag = 0.035 * M.wave(t, 1, -0.1);
    p.pivot(50, 58, rock, [1 + br * 0.6 - 0.012 * hit, 1 + br + 0.01 * hit], function () {
      [-1, 1].forEach(function (sd) {
        var sp = 1 + lag * 6 * sd;
        p.path('M' + (50 + sd * 27) + ' 45 C' + (50 + sd * (40 * sp)) + ' 36 ' + (50 + sd * (49 + 2 * lag * 20)) + ' 50 ' + (50 + sd * 46) + ' 59 C' + (50 + sd * 44) + ' 69 ' + (50 + sd * 34) + ' 69 ' + (50 + sd * 25) + ' 65', { w: 1.2, ink: 'grey', cap: 'round', wob: 0.4 });
      });
      p.path(MASK, { fill: 'c' });
      p.clip(MASK, function () {
        [49, 58.5, 68].forEach(function (y, j) {
          p.path('M20 ' + y + ' C38 ' + (y + 4) + ' 62 ' + (y + 4) + ' 80 ' + y, { w: 0.8, ink: 'night', alpha: 0.55 });
          p.path('M20 ' + (y + 1.8) + ' C38 ' + (y + 5.8) + ' 62 ' + (y + 5.8) + ' 80 ' + (y + 1.8), { w: 0.8, ink: 'white', alpha: 0.65 });
        });
        p.poly([[23, 37], [77, 37], [77, 40], [23, 40]], { fill: 'white', line: false, alpha: 0.35 });
      });
      p.path(MASK, {});
      p.path('M37 38.4 C44 36.4 56 36.4 63 38.4', { w: 1.8, ink: 'grey', cap: 'round', wob: 0.3 });
    });
    /* what comes out the far side is clean: two slow arcs, drawn then let go */
    [0, 1].forEach(function (j) {
      var d = 'M' + (84 + j * 6) + ' 48 C' + (90 + j * 6) + ' 52 ' + (90 + j * 6) + ' 62 ' + (84 + j * 6) + ' 66';
      p.span(d, M.easeIn(M.seg(M.frac(t + j * 0.18), 0.55, 1)), M.easeOut(M.seg(M.frac(t + j * 0.18), 0.05, 0.55)), { w: 0.9, ink: 'leaf', cap: 'round', detail: true });
    });
  }
});

/* ---------------------------------------------------------------- sim-card */
/* a nano SIM with its cut corner and gold chip; signal arcs are sent out of the cut corner one after another */
var SIMB = 'M-18 -30 L8 -30 L22 -16 L22 26 C22 28.5 20.5 30 18 30 L-18 30 C-20.5 30 -22 28.5 -22 26 L-22 -26 C-22 -28.5 -20.5 -30 -18 -30 Z';
D.add('sim-card', {
  fam: 'daily', tapRest: 0.7, tags: ['sim', 'sim card', 'travel sim', 'mobile', 'phone', 'data', 'signal', 'roaming', 'esim', 'network', 'internet', 'ซิม', 'ซิมการ์ด', 'สัญญาณ'], loop: 2.2, still: 0.2, tapLen: 1.8, burst: 'star', burstAt: [40, 58], burstN: 4, burstSpread: 1, burstDelay: 0.22, burstColor: 'gold',
  margin: [14, 10, 12, 10], about: 'the SIM floats and tilts, three signal arcs drawn out of its cut corner one after another, a glint crossing the chip', tapAbout: 'the card clicks down, the chip lights up and four signal bars climb to full one by one',
  draw: function (p, t, s) {
    var u = Math.max(0, s.tap), tapping = s.tap >= 0, i, press = tapping ? M.bump(M.seg(u, 0.04, 0.26)) : 0, lit = tapping ? M.ease(M.seg(u, 0.14, 0.28)) * (1 - M.ease(M.seg(u, 0.8, 0.95))) : 0;
    var bob = 2.2 * M.wave(t, 1), tilt = 0.1 + 0.05 * M.wave(t, 1, 0.2), arcs = tapping ? 1 - M.ease(M.seg(u, 0.05, 0.25)) : 1, gu = M.seg(t, 0.15, 0.6);
    /* the signal: arcs from the cut corner, each drawn out, held, then taken back; four bars in a tap */
    for (i = 0; i < 3; i++) {
      var r = 11 + i * 9.5, d = 'M' + (62 + r * cos(-1.35)) + ' ' + (27 + r * sin(-1.35)) + ' A' + r + ' ' + r + ' 0 0 1 ' + (62 + r * cos(-0.2)) + ' ' + (27 + r * sin(-0.2));
      var hd = M.easeOut(M.seg(t, 0.05 + i * 0.12, 0.36 + i * 0.12)), tl = M.easeIn(M.seg(t, 0.62 + i * 0.07, 0.96));
      if (arcs > 0.02) p.span(d, tl, hd * arcs, { w: 1.5 + (2 - i) * 0.1, ink: 'c', cap: 'round' });
    }
    if (tapping) for (i = 0; i < 4; i++) {
      var g = M.spring(M.seg(u, 0.24 + i * 0.09, 0.42 + i * 0.09)) * (1 - M.ease(M.seg(u, 0.8 + i * 0.03, 0.95 + i * 0.01))), hh = (7 + i * 6.5) * Math.max(0, g);
      if (hh > 0.4) p.rect(68 + i * 7, 82 - hh, 5, hh, { fill: 'leaf', r: 1.2, w: 0.9 });
    }
    p.at(40, 58 + bob + 2.5 * press, tilt - 0.06 * press, [1 + 0.03 * press, 1 - 0.05 * press], function () {
      p.path(SIMB, { fill: 'blue' });
      p.line(-16, -24, 0, -24, { w: 1.2, ink: 'white', cap: 'round', detail: true }); p.line(-16, -19, -6, -19, { w: 0.8, ink: 'white', cap: 'round', detail: true });
      p.circle(13, -17.5, 2.6, { fill: 'gold', w: 0.5, detail: true });
      p.rect(-14, -7, 28, 28, { fill: 'gold', r: 5, w: 1, glow: lit * 0.9 });
      p.clip(function () { p.rect(-14, -7, 28, 28, { r: 5 }); }, function () {
        if (gu > 0 && gu < 1) { var x = M.lerp(-30, 24, M.ease(gu)); p.poly([[x, -9], [x + 6, -9], [x - 6, 24], [x - 12, 24]], { fill: 'white', line: false, alpha: 0.6 }); }
        if (lit > 0.02) p.rect(-14, -7, 28, 28, { fill: 'yellow', line: false, alpha: 0.8 * lit });
      });
      p.rect(-6.5, 0, 13, 16, { r: 3.5, w: 0.7 });
      p.line(-14, 5, -6.5, 5, { w: 0.6 }); p.line(6.5, 5, 14, 5, { w: 0.6 }); p.line(-14, 12, -6.5, 12, { w: 0.6 }); p.line(6.5, 12, 14, 12, { w: 0.6 });
      p.line(0, -7, 0, 0, { w: 0.6 }); p.line(0, 16, 0, 21, { w: 0.6 });
      p.path(SIMB, {});
    });
  }
});

/* ---------------------------------------------------------------- mosquito */
/* points along a cubic, for the spines of things that bend */
function bez(a, b, c, d, n) {
  var o = [], i, u, v;
  for (i = 0; i <= n; i++) { u = i / n; v = 1 - u; o.push([v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0], v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1]]); }
  return o;
}
/* a jointed leg: base (x, y), three bones whose headings a1..a3 are clockwise from straight down */
function leg(p, x, y, a, L, o) {
  var pts = [[x, y]], i, h;
  for (i = 0; i < 3; i++) { h = pts[i]; pts.push([h[0] + L[i] * sin(a[i]), h[1] + L[i] * cos(a[i])]); }
  p.path('M' + pts.map(function (q) { return q[0].toFixed(2) + ' ' + q[1].toFixed(2); }).join(' L'), o);
  p.dot(pts[1][0], pts[1][1], 0.8, 'ink'); p.dot(pts[2][0], pts[2][1], 0.7, 'ink');
}
/* the mosquito itself, facing left, drawn about the middle of its thorax; fl is the wing's phase, dz the leg dangle and tuck */
function mosq(p, t, fl, tuck, daze) {
  var i, wa = -0.85 + 0.5 * sin(TAU * fl), wb = -0.7 + 0.5 * sin(TAU * fl + 0.5), sp = bez([7, 2], [17, 1], [29, 6], [41, 14], 8);
  /* the far wing and legs, behind the body */
  p.arc(3, -7, 26, -1.45, -0.25, { pie: true, fill: 'sky', alpha: 0.2, line: false, ink: 'sky' });
  p.at(3, -7, wb - 0.1, 1, function () { p.path('M0 0 C6 -4 18 -5 25 -1.4 C20 3 8 4 0 0 Z', { fill: 'sky', alpha: 0.3, w: 0.4 }); });
  leg(p, 2, 6, [0.9 + 0.15 * tuck, 0.5 + 0.1 * sin(TAU * (t + 0.2)), 0.2], [10, 11, 7], { w: 0.8, cap: 'round' });
  leg(p, -3, 6, [-0.35 - 0.3 * tuck, 0.05 + 0.12 * sin(TAU * (t + 0.1)), -0.2], [10, 12, 6], { w: 0.8, cap: 'round' });
  /* the abdomen, banded */
  strap(p, sp, 10, 4.2, { fill: 'brown', w: 0.9 });
  [2, 4, 6].forEach(function (k) { var q = sp[k], r = sp[k + 1], h = 3.6 - 0.35 * k, ang = Math.atan2(r[1] - sp[k - 1][1], r[0] - sp[k - 1][0]); p.line(q[0] - sin(ang) * h, q[1] + cos(ang) * h, q[0] + sin(ang) * h, q[1] - cos(ang) * h, { w: 1.5, ink: 'white', cap: 'round', detail: true }); });
  /* thorax and head */
  p.ellipse(0, 0, 10.5, 8.6, { fill: 'brown', w: 1 });
  p.path('M-6 -5 C-2 -8 3 -8 7 -5', { w: 0.5, ink: 'white', detail: true }); p.line(-1, -7, -1, 4, { w: 0.9, ink: 'white', alpha: 0.9, detail: true });
  p.circle(-14.5, 3.5, 5.2, { fill: 'brown', w: 0.95 });
  p.circle(-16.5, 2, 2.1, { fill: 'red', w: 0.5 }); p.dot(-17, 1.6, 0.8, 'ink');
  p.line(-18.4, 6.4, -34, 21, { w: 1.3, ink: 'ink', cap: 'taper' });
  p.path('M-17 -0.8 C-21 -7 -26 -9 -31 -8', { w: 0.6 }); p.path('M-14.5 -1.4 C-17 -9 -22 -12 -27 -12', { w: 0.6, detail: true });
  /* the near legs */
  leg(p, -7, 6.5, [-1.2 - 0.2 * tuck, 0.1 + 0.14 * sin(TAU * t), 0.3], [10, 11, 7], { w: 0.8, cap: 'round' });
  leg(p, -1, 7.5, [-0.45 - 0.2 * tuck, -0.1 + 0.12 * sin(TAU * (t + 0.15)), 0.05], [11, 13, 7], { w: 0.8, cap: 'round' });
  leg(p, 5, 7, [0.55 + 0.2 * tuck, 0.3 + 0.12 * sin(TAU * (t + 0.3)), 0.25], [10, 12, 8], { w: 0.8, cap: 'round' });
  /* the near wing: a fan of its beat, and one crisp wing on top */
  p.arc(3, -7, 29, wa - 0.5, wa + 0.5, { pie: true, fill: 'sky', alpha: 0.3, line: false, ink: 'sky' });
  p.at(3, -7, wa, 1, function () { p.path('M0 0 C7 -5 22 -6.5 30 -1.5 C24 3.5 9 4.5 0 0 Z', { fill: 'sky', alpha: 0.5, w: 0.6 }); p.line(3, -0.4, 26, -1.6, { w: 0.4, detail: true }); });
}
/* a fly swatter, handle up, its head at the origin */
function swatter(p) {
  p.line(0, -17, 0, -62, { w: 4.4, ink: 'wood', cap: 'round' }); p.line(0, -17, 0, -62, { w: 0.5, cap: 'round' });
  p.rect(-14, -17, 28, 34, { fill: 'white', alpha: 0.45, r: 6, line: false });
  for (var i = -2; i <= 2; i++) { p.line(i * 5, -15, i * 5, 15, { w: 0.35, detail: true }); }
  for (i = -3; i <= 3; i++) { p.line(-12, i * 4.6, 12, i * 4.6, { w: 0.35, detail: true }); }
  p.rect(-14, -17, 28, 34, { r: 6, ink: 'red', w: 2 });
  p.rect(-3, -22, 6, 8, { fill: 'red', r: 2, w: 0.8 });
}
D.add('mosquito', {
  fam: 'daily', tapRest: 0.4, tags: ['mosquito', 'dengue', 'bite', 'insect', 'bug', 'rainy season', 'malaria', 'repellent', 'fly', 'ยุง', 'ไข้เลือดออก', 'ยุงลาย'], loop: 1.5, still: 0.3, tapLen: 2.6, burst: false, tapMargin: [50, 60, 24, 70],
  margin: [20, 22, 26, 34], about: 'hovers in a wobbling figure of eight, wings a blur, the legs dangling a beat behind', tapAbout: 'a swatter slams down and flattens it; it peels itself up, dizzy with stars, and staggers off out of sight; a new one drifts back in',
  draw: function (p, t, s) {
    var u = Math.max(0, s.tap), tapping = s.tap >= 0, hx = 3.2 * M.wave(t, 1), hy = 3.2 * M.wave(t, 2, 0.1), rot = 0.06 * M.wave(t, 2, 0.35), fl = 14 * t, ox = 0, oy = 0, sc = 1, sq = 1, daze = 0, sw = -1, i;
    if (tapping) {
      var hold = M.seg(u, 0.16, 0.3) * (1 - M.seg(u, 0.3, 0.4));
      sq = 1 - 0.78 * (u >= 0.15 && u < 0.4 ? M.ease(M.seg(u, 0.15, 0.17)) * (1 - M.ease(M.seg(u, 0.33, 0.45))) : 0);
      daze = M.ease(M.seg(u, 0.4, 0.5)) * (1 - M.ease(M.seg(u, 0.74, 0.8)));
      /* it leaves along a lurching line, shrinking, and a new one comes in from the left */
      var go = M.seg(u, 0.5, 0.8), back = M.seg(u, 0.86, 1);
      if (u >= 0.5 && u < 0.86) { ox = 70 * M.easeIn(go) + 5 * sin(TAU * go * 2.5); oy = -34 * M.easeIn(go) + 7 * sin(TAU * go * 3.5); sc = 1 - 0.8 * M.easeIn(go); rot = 0.35 * sin(TAU * go * 3) + 0.5 * go; }
      if (u >= 0.86) { ox = -70 * (1 - M.easeOut(back)); oy = -8 * (1 - M.easeOut(back)); sc = 0.4 + 0.6 * M.easeOut(back); }
      if (u >= 0.4 && u < 0.5) rot = 0.3 * sin(TAU * 3 * M.seg(u, 0.4, 0.5)) * M.bump(M.seg(u, 0.4, 0.5)) * 2;
      if (u >= 0.15 && u < 0.4) rot = 0;
      sw = u;
    }
    var cx = 52 + hx * (tapping && u > 0.1 && u < 0.5 ? 0.2 : 1) + ox, cy = 46 + hy * (tapping && u > 0.1 && u < 0.5 ? 0.2 : 1) + oy + (sq < 1 ? 10 * (1 - sq) * 0.3 : 0);
    if (sc > 0.05) p.at(cx, cy, rot, [sc, sc * sq], function () { mosq(p, t, fl, sq < 1 ? 1 : 0, daze); });
    if (tapping) {
      /* the swatter comes down fast, stays, and lifts away */
      var down = M.easeIn(M.seg(u, 0.06, 0.15)), lift = M.ease(M.seg(u, 0.3, 0.46));
      var sy = M.lerp(-84, 46 - 4, down) - 96 * lift, sx = 52;
      if (u > 0.05 && u < 0.5) p.at(sx + 4, sy, 0.1 * (1 - down) - 0.04, 1, function () { swatter(p); });
      /* the hit: lines thrown out from where it lands, then taken back */
      var hu = M.seg(u, 0.15, 0.34);
      if (hu > 0 && hu < 1) for (i = 0; i < 7; i++) { var an = -2.9 + i * 0.42, r0 = 18 + 4 * hu, r1 = 22 + 12 * M.easeOut(hu); p.span('M' + (52 + r0 * cos(an) * 1.2) + ' ' + (56 + r0 * sin(an) * 0.7) + ' L' + (52 + r1 * cos(an) * 1.2) + ' ' + (56 + r1 * sin(an) * 0.7), M.easeIn(M.seg(hu, 0.4, 1)), M.easeOut(M.seg(hu, 0, 0.5)), { w: 0.8, cap: 'round' }); }
      /* dizzy: stars orbiting where its head is */
      if (daze > 0.02) for (i = 0; i < 3; i++) { var oa = TAU * (u * 3 + i / 3); p.star(cx - 14 + 11 * cos(oa), cy - 6 + 4 * sin(oa) - 7, 3 * daze * sc, 1.3 * daze * sc, 4, { fill: 'yellow', w: 0.5 }); }
    }
  }
});

/* ---------------------------------------------------------------- alms-bowl */
/* บาตร: a monk's alms bowl on its stand, heaped with sticky rice and a lotus laid on top, steam rising; its lid sits beside it */
var BOWL = 'M8 54 C8 66 22 76 38 76 C54 76 68 66 68 54 C68 62 8 62 8 54 Z';
function lid(p, k) { /* the lid about the middle of its rim, dome up, a knob on top */
  p.at(0, 0, 0, k, function () {
    p.path('M-15 0 C-15 -11 -8 -16 0 -16 C8 -16 15 -11 15 0 C15 4.5 -15 4.5 -15 0 Z', { fill: 'night' });
    p.path('M-10 -9 C-8 -12 -5 -13.5 -2 -14', { w: 0.7, ink: 'white', detail: true, alpha: 0.8 });
    p.path('M-15 0 C-15 4.5 15 4.5 15 0', { w: 1.6, ink: 'gold', cap: 'round' });
    p.line(0, -16, 0, -19, { w: 1.6, ink: 'gold', cap: 'round' }); p.ellipse(0, -20.5, 3.4, 2.4, { fill: 'gold', w: 0.8 });
  });
}
D.add('alms-bowl', {
  fam: 'daily', tapRest: 0.6, tags: ['alms bowl', 'bowl', 'sticky rice', 'rice', 'offering', 'merit', 'tak bat', 'temple', 'lotus', 'morning', 'food', 'บาตร', 'ใส่บาตร', 'ข้าวเหนียว', 'ทำบุญ', 'ดอกบัว'], loop: 2.6, still: 0.2, tapLen: 2.4, burst: 'petal', burstAt: [38, 36], burstN: 3, burstSpread: 1.3, burstDelay: 0.76, burstColor: 'pink',
  margin: [22, 14, 10, 14], about: 'steam curls up from a heap of sticky rice in a black alms bowl, the lotus on top breathing open and closed, the lid waiting beside', tapAbout: 'the lid squats, hops up onto the bowl with a clink and a puff of steam, then hops back off beside it',
  draw: function (p, t, s) {
    var u = Math.max(0, s.tap), tapping = s.tap >= 0, i, R = p.rng(1), spread = 1 + 0.1 * M.wave(t, 1), lx = 84, ly = 90, lk = 1, lsy = 1, lrot = 0, on = 0, hop = 0;
    if (tapping) {
      var a1 = M.seg(u, 0.14, 0.44), a2 = M.seg(u, 0.74, 0.98);
      var crouch1 = M.bump(M.seg(u, 0.05, 0.16)), crouch2 = M.bump(M.seg(u, 0.66, 0.76)), land = M.bump(M.seg(u, 0.44, 0.54));
      var pos = M.ease(a1) * (1 - M.ease(a2)); on = u > 0.44 && u < 0.74 ? 1 : 0;
      lx = M.lerp(84, 38, pos); ly = M.lerp(90, 54, pos); lk = M.lerp(1, 2, pos);
      hop = (a1 > 0 && a1 < 1 ? 4 * a1 * (1 - a1) : 0) + (a2 > 0 && a2 < 1 ? 4 * a2 * (1 - a2) : 0);
      ly -= 30 * hop; lsy = 1 - 0.18 * (crouch1 + crouch2 + land);
      lrot = 0.22 * sin(TAU * a1) * (a1 > 0 && a1 < 1 ? 1 : 0) - 0.22 * sin(TAU * a2) * (a2 > 0 && a2 < 1 ? 1 : 0);
    }
    /* the stand: a brass ring on three legs */
    p.path('M25 75 L22 89 C30 92 46 92 54 89 L51 75 Z', { fill: 'gold', w: 1 });
    p.ellipse(38, 75, 13, 3, { fill: 'gold', w: 0.8 });
    [[27.5, 33.5], [42.5, 48.5]].forEach(function (c) { p.path('M' + c[0] + ' 89.4 C' + c[0] + ' 83 ' + c[1] + ' 83 ' + c[1] + ' 90.2', { fill: 'brown', w: 0.7 }); });
    p.line(26, 80, 50, 80, { w: 0.4, detail: true, ink: 'brown' });
    /* the bowl: lacquer black, a gold lip */
    p.ellipse(38, 54, 30, 7, { fill: 'night' });
    p.path(BOWL, { fill: 'night' });
    p.path('M13 63 C17 69 23 73 30 75', { w: 0.9, ink: 'white', alpha: 0.7, detail: true });
    /* the heap of rice, which the rim's front lip then crosses */
    p.path('M10 53 C11 36 25 27 38 27 C51 27 65 36 66 53 C58 60 18 60 10 53 Z', { fill: 'cream' });
    p.clip('M10 53 C11 36 25 27 38 27 C51 27 65 36 66 53 C58 60 18 60 10 53 Z', function () {
      for (i = 0; i < 26; i++) { var gx = 14 + R() * 48, gy = 31 + R() * 26, gr = (R() - 0.5) * 3; p.ellipse(gx, gy, 1.7, 0.85, { rot: gr, fill: 'white', w: 0.32, detail: true }); }
    });
    p.path('M10 53 C11 36 25 27 38 27 C51 27 65 36 66 53', { w: 1 });
    p.arc(38, 54, 29.6, 0, PI, { ry: 6.8, w: 1.1, ink: 'gold', cap: 'round' });
    /* steam from the rice, one wisp after another, each drawn up and let go */
    [[28, 0], [38, 0.34], [48, 0.67]].forEach(function (c) {
      var ph = M.frac(t + c[1]), d = 'M' + c[0] + ' 25 C' + (c[0] + 7) + ' 18 ' + (c[0] - 7) + ' 11 ' + c[0] + ' 2';
      p.span(d, M.easeIn(M.seg(ph, 0.4, 1)), M.easeOut(M.seg(ph, 0, 0.6)), { w: 0.9, ink: 'grey', cap: 'round', alpha: 0.9 });
    });
    /* the lotus laid on the heap: two rings of petals that breathe open a little and close */
    p.at(40, 33, -0.12, 1, function () {
      [[-0.95, 'lilac', 12], [0.95, 'lilac', 12], [-0.5, 'pink', 14], [0.5, 'pink', 14], [0, 'rose', 16]].forEach(function (q, j) {
        p.at(0, 0, q[0] * spread, 1, function () { p.path('M0 1.5 C-5.5 -2 -5.5 -' + (q[2] - 4) + ' 0 -' + q[2] + ' C5.5 -' + (q[2] - 4) + ' 5.5 -2 0 1.5 Z', { fill: q[1], w: 0.75 }); p.line(0, -1, 0, -q[2] + 4, { w: 0.35, detail: true, alpha: 0.6 }); });
      });
      p.circle(0, 1.5, 2.1, { fill: 'gold', w: 0.6 });
    });
    p.path('M30 37 C23 39 17 41 11 47', { w: 1.1, ink: 'green', cap: 'round', wob: 0.3 });
    /* the lid: beside the bowl, or hopping on and off it */
    p.ellipse(lx, 91.5, 13 * lk * (1 - hop * 0.3), 2.2, { fill: 'smoke', line: false, alpha: tapping ? 0.8 : 1, detail: true });
    p.at(lx, ly, lrot, [1, lsy], function () { lid(p, lk); });
    if (tapping && u > 0.44 && u < 0.76) {
      var cu = M.seg(u, 0.44, 0.76);
      [-1, 1].forEach(function (sd) {
        for (i = 0; i < 3; i++) { var an = -0.35 - 0.35 * i, r0 = 31 + 1.5 * cu, r1 = 34 + 5 * M.bump(M.seg(cu, 0, 0.5)); if (M.bump(M.seg(cu, 0, 0.5)) > 0.05) p.line(38 + sd * r0 * cos(an), 55 + r0 * sin(an) * 0.8, 38 + sd * r1 * cos(an), 55 + r1 * sin(an) * 0.8, { w: 0.8, ink: 'a', cap: 'round' }); }
        var pu = M.seg(cu, 0.15, 0.9); if (pu > 0 && pu < 1) p.blob(38 + sd * (31 + 6 * pu), 53 - 6 * pu, 3.4 * M.bump(pu) + 0.4, { fill: 'white', lumpy: 0.2, seed: 5 + sd, w: 0.6 });
      });
    }
  }
});

/* ---------------------------------------------------------------- mongkol */
function oval(cx, cy, rx, ry) { return 'M' + (cx - rx) + ' ' + cy + ' A' + rx + ' ' + ry + ' 0 1 1 ' + (cx + rx) + ' ' + cy + ' A' + rx + ' ' + ry + ' 0 1 1 ' + (cx - rx) + ' ' + cy + ' Z'; }
/* a ring of twisted cord lying flat, seen from above and in front: the point at angle a on its centre line */
function ringAt(cx, cy, rx, ry, a) { return [cx + rx * cos(a), cy + ry * sin(a)]; }
/* the ring itself, its twist ticks sliding round; hw and hy the half-width of the cord across and down */
function cordRing(p, cx, cy, rx, ry, hw, hy, tw, n) {
  p.path(oval(cx, cy, rx + hw, ry + hy) + ' ' + oval(cx, cy, rx - hw, ry - hy), { fill: 'cream', holes: true, w: 1.05 });
  var i, a, sk = 0.9 * 22 / n;
  p.clip(oval(cx, cy, rx + hw, ry + hy) + ' ' + oval(cx, cy, rx - hw, ry - hy), function () {
    for (i = 0; i < n; i++) {
      a = TAU * (i + tw) / n;
      p.line(cx + (rx - hw - 1) * cos(a), cy + (ry - hy - 1) * sin(a), cx + (rx + hw + 1) * cos(a + 0.5 * sk * TAU / n * 3), cy + (ry + hy + 1) * sin(a + 0.5 * sk * TAU / n * 3), { w: 0.8, ink: 'brown', alpha: 0.75, wob: 0.3, detail: true });
    }
  });
}
/* a cloth wrap tied round the cord at angle a */
function wrapAt(p, cx, cy, rx, ry, hw, hy, a, c) {
  var d = 4.6 / rx, i0 = [rx - hw - 1.4, ry - hy - 1.1], o0 = [rx + hw + 1.4, ry + hy + 1.1];
  p.poly([[cx + i0[0] * cos(a - d), cy + i0[1] * sin(a - d)], [cx + o0[0] * cos(a - d * 1.15), cy + o0[1] * sin(a - d * 1.15)], [cx + o0[0] * cos(a + d * 1.15), cy + o0[1] * sin(a + d * 1.15)], [cx + i0[0] * cos(a + d), cy + i0[1] * sin(a + d)]], { fill: c, w: 0.8 });
  p.line(cx + (rx - hw * 0.4) * cos(a - d * 0.3), cy + (ry - hy * 0.4) * sin(a - d * 0.3), cx + (rx + hw * 0.4) * cos(a - d * 0.4), cy + (ry + hy * 0.4) * sin(a - d * 0.4), { w: 0.5, ink: 'white', alpha: 0.7, detail: true });
}
/* a tail of cord ending in a tassel, hanging from (x, y) and swinging by sw */
function tail(p, x, y, L, sw, c) {
  var sp = [], i, q;
  for (i = 0; i <= 7; i++) { q = i / 7; sp.push([x + sw * L * q * q * 0.6, y + L * q]); }
  strap(p, sp, 4.6, 3.4, { fill: 'cream', w: 0.8 });
  var e = sp[7];
  p.poly([[e[0] - 3, e[1]], [e[0] + 3, e[1]], [e[0] + 5, e[1] + 10], [e[0] - 5, e[1] + 10]], { fill: c, w: 0.8 });
  p.line(e[0] - 1.5, e[1] + 1.5, e[0] - 2.4, e[1] + 9, { w: 0.4, detail: true }); p.line(e[0] + 1.5, e[1] + 1.5, e[0] + 2.4, e[1] + 9, { w: 0.4, detail: true });
  p.rect(e[0] - 3.4, e[1] - 1, 6.8, 3, { fill: 'gold', w: 0.6, r: 1 });
}
D.add('mongkol', {
  fam: 'daily', tapRest: 0.3, tags: ['mongkol', 'muay thai', 'headband', 'boxing', 'prajied', 'armband', 'fight', 'ring', 'luck', 'ritual', 'blessing', 'มงคล', 'มวยไทย', 'ปะเจียด', 'มงกุฎมวย'], loop: 2.4, still: 0.1, tapLen: 2, burst: 'star', burstAt: [48, 40], burstN: 6, burstSpread: 1.7, burstDelay: 0.7, burstColor: 'gold',
  margin: [14, 10, 10, 10], about: 'the twisted cord ring wobbles as it floats, its twist sliding round, the tassels swinging after it; a prajied armband swings below', tapAbout: 'it is spun like a hoop, its coloured wraps and tassels flying round and out, and it settles with a wobble',
  draw: function (p, t, s) {
    var u = Math.max(0, s.tap), tapping = s.tap >= 0, i, spin = 0, fling = 0, wob = 0;
    if (tapping) { spin = TAU * M.ease(M.seg(u, 0.05, 0.62)); fling = M.bump(M.seg(u, 0.05, 0.62)); var st = M.seg(u, 0.62, 1); wob = Math.exp(-4 * st) * sin(TAU * 2.5 * st) * (st > 0 ? 1 : 0); }
    var cx = 46, cy = 34 + 2.2 * M.wave(t, 2, 0.1), rx = 31, ry = 14 + 2.6 * M.wave(t, 1, 0.2) + 3 * M.bump(M.seg(u, 0.05, 0.4)) * (tapping ? 1 : 0), hw = 5, hy = 4, ka = PI / 2 + spin;
    /* the knot's tails first, so the ring's band lies over their tops */
    var sw1 = 0.5 * M.wave(t, 1, -0.05) + 1.1 * fling + 0.6 * wob, sw2 = 0.5 * M.wave(t, 1, -0.15) + 1.1 * fling + 0.6 * wob, k = ringAt(cx, cy, rx, ry, ka);
    p.pivot(k[0], k[1], 0, 1, function () { tail(p, k[0] - 2.5, k[1] - 1, 26, sw1, 'red'); tail(p, k[0] + 3, k[1] - 1, 20, sw2, 'a'); });
    cordRing(p, cx, cy, rx, ry, hw, hy, 2 * t, 30);
    [[0.1, 'red'], [PI * 0.5, 'a'], [PI, 'blue'], [PI * 1.5, 'leaf']].forEach(function (c) { wrapAt(p, cx, cy, rx, ry, hw, hy, ka + c[0], c[1]); });
    p.circle(k[0], k[1], 4, { fill: 'gold', w: 0.9 }); p.dot(k[0] - 1, k[1] - 1, 1, 'white');
    /* the prajied: a smaller loop of cord, lower right, with a tail and a tassel */
    var px = 74, py = 76 + 1.4 * M.wave(t, 2, 0.4), prx = 13.5, pry = 6;
    p.pivot(px, py, 0.04 * M.wave(t, 1, 0.3), 1, function () {
      tail(p, px - 12, py + 5, 13, -0.5 * M.wave(t, 1, 0.1) - 0.3 * fling, 'blue');
      cordRing(p, px, py, prx, pry, 3.2, 2.6, 2 * t, 16);
      wrapAt(p, px, py, prx, pry, 3.2, 2.6, PI * 0.5, 'a'); wrapAt(p, px, py, prx, pry, 3.2, 2.6, PI * 1.4, 'red');
      p.circle(px - 13, py + 4.4, 2.6, { fill: 'red', w: 0.7 });
    });
  }
});

/* ---------------------------------------------------------------- massage */
/* hands, as faces.js builds them: a limb is a chain of bones that bend one way, and the hand one outline round the palm and every limb */
function limb(x, y, th, lens, bends, w0, w1) {
  var c = [[x, y]], n = lens.length, a = th, i, L = [], R = [];
  for (i = 0; i < n; i++) { a += bends[i] || 0; c.push([c[i][0] + sin(a) * lens[i], c[i][1] - cos(a) * lens[i]]); }
  for (i = 0; i <= n; i++) {
    var p0 = c[Math.max(0, i - 1)], p1 = c[Math.min(n, i + 1)], dx = p1[0] - p0[0], dy = p1[1] - p0[1], d = Math.hypot(dx, dy) || 1, w = (w0 + (w1 - w0) * i / n) / 2;
    L.push([c[i][0] + dy / d * w, c[i][1] - dx / d * w]); R.push([c[i][0] - dy / d * w, c[i][1] + dx / d * w]);
    if (i === n) { var tip = [], k; for (k = 1; k < 4; k++) { var q = k * PI / 4; tip.push([c[i][0] + (dy / d * cos(q) + dx / d * sin(q)) * w, c[i][1] + (-dx / d * cos(q) + dy / d * sin(q)) * w]); } }
  }
  return { l: L, r: R, tip: tip, c: c, d0: [(c[1][0] - c[0][0]) / (lens[0] || 1), (c[1][1] - c[0][1]) / (lens[0] || 1)] };
}
function outline(items) {
  var out = [];
  items.forEach(function (it, k) {
    if (!it.l) { out.push(it); return; }
    var pv = items[k - 1], i;
    if (pv && pv.l) out.push([(pv.r[0][0] + it.l[0][0]) / 2 - (pv.d0[0] + it.d0[0]) / 2 * (it.dep == null ? 2.2 : it.dep), (pv.r[0][1] + it.l[0][1]) / 2 - (pv.d0[1] + it.d0[1]) / 2 * (it.dep == null ? 2.2 : it.dep)]);
    for (i = 1; i < it.l.length; i++) out.push(it.l[i]);
    it.tip.forEach(function (q) { out.push(q); });
    for (i = it.r.length - 1; i >= 1; i--) out.push(it.r[i]);
  });
  return out;
}
var FB = [[-13.2, -33, 24, 9.2], [-4.4, -35.5, 27.5, 9.2], [4.4, -34.5, 24.5, 8.8], [12.6, -31, 19, 7.8]];
/* a hand seen from the back, wrist at the origin, fingers up, the thumb out to the left; its nails show */
function backHand(p, o) {
  var sp = o.spread == null ? 0.3 : o.spread, it = [[-10.5, 4], [-15.5, -2.5], [-16.5, -8]], fs = [], i;
  var th = limb(-14, -11, o.thumb == null ? -0.9 : o.thumb, [11.5, 10.5], o.tb || [0, 0.2], 11, 9); th.dep = 0; it.push(th); it.push([-16.8, -22.5]);
  FB.forEach(function (f, j) { var g = limb(f[0], f[1], (j - 1.5) * 0.22 * sp, [f[2] * 0.46, f[2] * 0.3, f[2] * 0.24], (o.bends && o.bends[j]) || [0, 0, 0], f[3], f[3] * 0.84); fs.push(g); it.push(g); });
  it.push([17.4, -23], [16, -8], [11, 4]);
  p.curve(outline(it), { close: true, fill: 'skin', w: 1.05 });
  fs.concat([th]).forEach(function (g) {
    var n = g.c.length - 1, a = g.c[n - 1], b = g.c[n], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    p.ellipse(b[0] - dx / d * 2.6, b[1] - dy / d * 2.6, 1.9, 2.6, { rot: Math.atan2(dy, dx) + PI / 2, fill: 'pink', w: 0.4, detail: true, wob: 0.3 });
  });
  p.path('M-6 -13 C-3 -17 0 -19 4 -21', { w: 0.45, alpha: 0.4, detail: true });
  return th;
}
/* where a point in a hand's own frame lands in the box, for the hand set down at (wx, wy) turned by rot, scaled sc, mirrored when sgn is -1 */
function toBox(wx, wy, rot, sc, sgn, lx, ly) { var x = sgn * lx * sc, y = ly * sc; return [wx + x * cos(rot) - y * sin(rot), wy + x * sin(rot) + y * cos(rot)]; }

/* a rolled herbal compress, ลูกประคบ: a ball of cloth gathered and tied at the neck, steam off it */
function compress(p, t, sq) {
  p.pivot(0, 14, 0, [1 + 0.1 * sq, 1 - 0.14 * sq], function () {
    p.path('M-5.5 -11 C-4 -17 -3.2 -20 -3.2 -24 L3.2 -24 C3.2 -20 4 -17 5.5 -11 Z', { fill: 'cream', w: 0.9 });
    p.path('M-3.5 -24 L-8 -31 L-2.6 -27.5 L0 -33 L2.6 -27.5 L8 -31 L3.5 -24 Z', { fill: 'cream', w: 0.8 });
    p.circle(0, 2, 14.5, { fill: 'cream', w: 1.1 });
    p.clip(function () { p.circle(0, 2, 14.5); }, function () {
      p.blob(-6, 5, 6, { fill: 'leaf', alpha: 0.35, line: false, lumpy: 0.3, seed: 4 }); p.blob(6, -1, 4.6, { fill: 'wood', alpha: 0.35, line: false, lumpy: 0.3, seed: 6 }); p.blob(2, 10, 4, { fill: 'leaf', alpha: 0.3, line: false, lumpy: 0.3, seed: 9 });
      [[-5, 4], [0, 7], [5, 4]].forEach(function (c) { p.path('M' + c[0] * 0.3 + ' -10 C' + c[0] * 2.2 + ' -4 ' + c[0] * 2.6 + ' 3 ' + c[0] * 2.2 + ' 14', { w: 0.45, detail: true, alpha: 0.65 }); });
    });
    p.line(-4.5, -16.5, 4.5, -16.5, { w: 1.4, ink: 'brown', cap: 'round' }); p.line(-4.2, -14, 4.2, -14, { w: 1.1, ink: 'brown', cap: 'round' });
    p.path('M0 -16 C-4 -13 -6 -9 -5 -7', { w: 0.9, ink: 'brown', cap: 'round', wob: 0.3 }); p.path('M0 -16 C4 -13 6 -9 5 -7', { w: 0.9, ink: 'brown', cap: 'round', wob: 0.3 });
  });
}
function leafPair(p, x, y, k, r) { p.at(x, y, r, k, function () { p.path('M0 0 C-5 -3 -9 0 -8 4 C-7 7 -2 7 0 4 C2 7 7 7 8 4 C9 0 5 -3 0 0 Z', { fill: 'leaf', w: 0.8 }); p.line(0, 0, 0, 4.5, { w: 0.4, detail: true }); }); }

var FOOT = 'M43 28 C37 33 36 43 38 53 C39 63 40 75 44 83 C48 90 54 93 60 93 C68 93 74 88 75 78 C76 70 70 64 69 57 C68 49 74 44 76 36 C77 30 75 26 69 24 C63 22 55 22 50 24 C46 25 44 27 43 28 Z';
D.add('massage', {
  fam: 'daily', tapRest: 0.45, tags: ['massage', 'thai massage', 'foot massage', 'foot', 'sole', 'reflexology', 'herbal compress', 'luk pra kob', 'spa', 'relax', 'wellness', 'นวด', 'นวดเท้า', 'นวดไทย', 'ลูกประคบ', 'สปา'], loop: 1.6, still: 0.15, ratio: 1.6, tapLen: 2.4, burst: 'zzz', burstAt: [62, 12], burstN: 3, burstSpread: 1.3, burstDelay: 0.55,
  margin: [16, 8, 14, 10], about: 'two hands press the sole in turn, a squeeze and a release, the toes curling, while a herbal compress steams on its saucer', tapAbout: 'the hands ease off and the compress hops over to the foot, dabs it twice with a puff of steam, and hops home; the toes wiggle and the sole warms',
  draw: function (p, t, s) {
    var u = Math.max(0, s.tap), tapping = s.tap >= 0, i, sc = 0.6;
    p.move(8, 0);
    var pl = 0.5 + 0.5 * M.wave(t, 2, -0.25), pr = 0.5 + 0.5 * M.wave(t, 2, -0.31), ease = 0, hop = 0, d1 = 0, d2 = 0, warm = 0, away = 0;
    if (tapping) {
      away = M.ease(M.seg(u, 0.04, 0.2)) * (1 - M.ease(M.seg(u, 0.78, 0.94)));
      var a1 = M.seg(u, 0.12, 0.38), a2 = M.seg(u, 0.64, 0.9);
      ease = M.ease(a1) * (1 - M.ease(a2)); hop = (a1 > 0 && a1 < 1 ? 4 * a1 * (1 - a1) : 0) + (a2 > 0 && a2 < 1 ? 4 * a2 * (1 - a2) : 0);
      d1 = M.bump(M.seg(u, 0.38, 0.48)); d2 = M.bump(M.seg(u, 0.5, 0.6)); warm = M.ease(M.seg(u, 0.4, 0.62)) * (1 - M.ease(M.seg(u, 0.84, 1)));
      pl *= 1 - away; pr *= 1 - away;
    }
    var wig = tapping ? M.bump(M.seg(u, 0.38, 0.8)) : 0;
    /* the compress, on its saucer, and the herbs by it */
    p.ellipse(132, 86, 18, 4.4, { fill: 'wood', w: 0.9 });
    p.ellipse(132, 85, 14, 2.8, { fill: 'sand', w: 0.5, detail: true });
    leafPair(p, 108, 90, 0.8, -0.35); leafPair(p, 154, 91, 0.7, 0.3);
    p.circle(147, 92, 3.5, { fill: 'orange', w: 0.7 }); p.circle(147, 92, 1.7, { w: 0.4, detail: true });
    p.path('M112 93 C120 92 128 93 134 94', { w: 1.1, ink: 'leaf', cap: 'round', detail: true });
    /* the foot, its toes curling a little with each press */
    var press = (pl + pr) / 2, curl = 0.9 * press + 1.2 * wig * sin(TAU * 4 * u);
    p.pivot(60, 80, 0.012 * (pl - pr) + 0.02 * wig * sin(TAU * 3 * u), [1 - 0.022 * press, 1], function () {
      [[72, 15.5, 6.6, 9.4, 0.18], [62, 12, 4.4, 6.4, 0.06], [53.5, 13.5, 4, 5.8, -0.06], [46, 17, 3.7, 5.2, -0.2], [40, 22, 3.4, 4.6, -0.36]].forEach(function (q, j) {
        p.ellipse(q[0], q[1] + curl * (1 - j * 0.12), q[2], q[3], { rot: q[4], fill: 'skin', w: 1 });
      });
      p.path(FOOT, { fill: 'skin' });
      p.path('M42 38 C50 32.5 66 32 75 39', { w: 0.5, detail: true, alpha: 0.6 }); p.path('M70 59 C62 52 52 52 46 57', { w: 0.45, detail: true, alpha: 0.55 });
      p.blob(60, 80, 12, { fill: 'rose', line: false, alpha: 0.14 + 0.3 * warm, lumpy: 0.1, sy: 1.1 });
      p.blob(58, 42, 11, { fill: 'rose', line: false, alpha: 0.1 + 0.3 * warm, lumpy: 0.1, sy: 0.8 });
    });
    /* the hands, sleeves first: each pushes in with its thumb and lets go, the left leading */
    [[1, pl, 30, 94, 0.1], [-1, pr, 90, 94, -0.1]].forEach(function (h, j) {
      var sgn = h[0], pw = h[1], wx = h[2] + sgn * (2.6 * pw + 4 * away) , wy = h[3] - 1.5 * pw + 3 * away, rot = h[4] + sgn * 0.045 * pw;
      p.at(wx, wy, rot, [-sgn * sc, sc], function () { p.rect(-12, 1, 24, 26, { fill: 'c', r: 3, w: 1.4 }); p.line(-8, 6, 8, 6, { w: 0.45, detail: true, ink: 'white' }); });
      p.at(wx, wy, rot, [-sgn * sc, sc], function () { backHand(p, { spread: 0.3 }); });
    });
    /* pressure: a ring from each thumb's tip, drawn out and let go */
    [[1, pl, 30, 94, 0.1, 0], [-1, pr, 90, 94, -0.1, 0.06]].forEach(function (h) {
      var sgn = h[0], pw = h[1], wx = h[2] + sgn * (2.6 * pw + 4 * away), wy = h[3] - 1.5 * pw + 3 * away, rot = h[4] + sgn * 0.045 * pw, tip = toBox(wx, wy, rot, sc, -sgn, -31, -24), ph = M.frac(2 * t - 0.25 - h[5]), g = 1 - away;
      var rr = 3 + 6 * M.easeOut(ph);
      if (g > 0.3) p.span('M' + (tip[0] - rr) + ' ' + tip[1] + ' A' + rr + ' ' + rr * 0.75 + ' 0 1 1 ' + (tip[0] + rr) + ' ' + tip[1] + ' A' + rr + ' ' + rr * 0.75 + ' 0 1 1 ' + (tip[0] - rr) + ' ' + tip[1], M.easeIn(M.seg(ph, 0.4, 1)), M.easeOut(M.seg(ph, 0, 0.5)), { w: 0.8, ink: 'rose', cap: 'round' });
    });
    /* the compress at home, steaming; or out on a hop to the sole */
    var hx = M.lerp(132, 70, ease), hy2 = M.lerp(66, 40, ease) - 24 * hop + 3 * (d1 + d2), sq = d1 + d2;
    [[-5, 0], [0, 0.34], [5, 0.67]].forEach(function (c) {
      var ph = M.frac(t + c[1]), d = 'M' + (hx + c[0]) + ' ' + (hy2 - 32) + ' C' + (hx + c[0] + 6) + ' ' + (hy2 - 39) + ' ' + (hx + c[0] - 6) + ' ' + (hy2 - 46) + ' ' + (hx + c[0]) + ' ' + (hy2 - 55);
      p.span(d, M.easeIn(M.seg(ph, 0.4, 1)), M.easeOut(M.seg(ph, 0, 0.6)), { w: 0.9, ink: 'grey', cap: 'round' });
    });
    p.at(hx, hy2, 0.12 * sin(TAU * 2 * M.seg(u, 0.12, 0.38)) * (tapping ? 1 : 0), 1, function () { compress(p, t, sq); });
    if (d1 + d2 > 0.05) for (i = 0; i < 5; i++) { var an = -2.6 + i * 0.5; p.line(hx + 17 * cos(an), hy2 + 2 + 17 * sin(an), hx + (18 + 6 * (d1 + d2)) * cos(an), hy2 + 2 + (18 + 6 * (d1 + d2)) * sin(an), { w: 0.7, ink: 'a', cap: 'round' }); }
  }
});

/* ---------------------------------------------------------------- rice-paddy */
/* a small green frog in profile facing left, about the middle of its body; air 0 sits, 1 is stretched out in a leap */
function frog(p, air, blink, thr) {
  p.path('M2 2 C8 2 12 4 14 6.5', { w: 1.2 * (0.6 + 0.4 * air), ink: 'green', cap: 'round', alpha: air });
  p.path('M5 1 C7 -3 12 -3 14 1 C12 5 7 5 5 1 Z', { fill: 'leaf', w: 0.8 });
  p.path('M-8 1 C-8 -4 -3 -6 2 -5 C8 -4 10 0 8 3 C6 6 -4 6 -8 1 Z', { fill: 'leaf', w: 0.95 });
  p.path('M-7 2.2 C-4 5 3 5.4 7 3.2 C3 6.4 -4 6.4 -7 2.2 Z', { fill: 'mint', line: false });
  p.circle(-6, -5.5, 2.6, { fill: 'white', w: 0.8 }); p.dot(-6.7, -5.5, blink > 0.5 ? 1.1 : 0.4, 'ink');
  p.line(-9, 1.6, -4.5, 2.1, { w: 0.5, detail: true });
  if (thr > 0.01) p.ellipse(-5, 2.6, 2.2 * (1 + 0.5 * thr), 1.4 * (1 + 0.5 * thr), { fill: 'mint', w: 0.4, detail: true });
  p.path('M-2 3 C-1 6 0 8 -1 10', { w: 1.1, ink: 'green', cap: 'round', alpha: 1 - 0.4 * air });
}
D.add('rice-paddy', {
  fam: 'daily', tapRest: 0.6, tags: ['rice', 'paddy', 'rice field', 'farm', 'field', 'harvest', 'seedlings', 'countryside', 'agriculture', 'green', 'rural', 'ทุ่งนา', 'นาข้าว', 'ข้าว', 'ต้นข้าว'], loop: 3.2, still: 0.2, tapLen: 2.6, burst: 'drop', burstAt: [64, 74], burstN: 6, burstSpread: 1.5, burstDelay: 0.42, burstColor: 'sky', burstGravity: 100,
  margin: [14, 10, 6, 10], about: 'rice seedlings in rows lean in a gust that crosses the field, the water glinting between them, a cloud drifting across the hills', tapAbout: 'a frog on the bank crouches and leaps into the paddy; rings spread across the water, shaking the seedlings, and it paddles home',
  draw: function (p, t, s) {
    var u = Math.max(0, s.tap), tapping = s.tap >= 0, i, j, LX = 62, LY = 77;
    var a1 = tapping ? M.seg(u, 0.1, 0.42) : 0, a2 = tapping ? M.seg(u, 0.78, 0.97) : 0, sink = tapping ? M.ease(M.seg(u, 0.42, 0.5)) * (1 - M.ease(M.seg(u, 0.7, 0.8))) : 0;
    /* the far side: sun, hills, a cloud that crosses once a loop */
    p.circle(80, 14, 7.5, { fill: 'yellow', w: 0.9, glow: 0.4 });
    for (i = 0; i < 8; i++) p.at(80, 14, TAU * i / 8 + TAU * t / 8, 1, function () { p.line(0, -10, 0, -13 - 1.4 * M.wave(t, 2, i * 0.125), { w: 0.7, ink: 'a', cap: 'round' }); });
    p.path('M0 38 C8 28 14 22 24 25 C30 27 36 18 46 19 C56 20 62 28 72 26 C82 24 90 30 100 32 L100 40 L0 40 Z', { fill: 'mint' });
    p.path('M0 38 C8 28 14 22 24 25 C30 27 36 18 46 19 C56 20 62 28 72 26 C82 24 90 30 100 32', { w: 1 });
    p.path('M20 31 C28 28 36 28 42 30', { w: 0.4, detail: true, alpha: 0.6 });
    var cf = M.frac(t);
    if (cf > 0.01 && cf < 0.99) p.at(-40 + 180 * cf, 13, 0, 1, function () { p.path('M-14 4 C-17 -3 -8 -6 -4 -3 C-2 -10 9 -10 10 -3 C16 -5 21 1 17 4 Z', { fill: 'white', w: 0.8 }); });
    /* the banks and the water between them, in perspective */
    p.rect(-4, 38, 108, 66, { fill: 'leaf', line: false, alpha: 0.35 });
    p.poly([[20, 38], [80, 38], [106, 93], [-6, 93]], { fill: 'sky', w: 1, alpha: 0.6 });
    p.path('M20 38 L-6 93', { w: 1.2, ink: 'brown' }); p.path('M80 38 L106 93', { w: 1.2, ink: 'brown' });
    p.rect(-4, 93, 108, 8, { fill: 'sand', w: 1 });
    [[6, 50], [94, 50], [4, 72], [97, 74], [12, 90], [90, 91]].forEach(function (g) { p.path('M' + g[0] + ' ' + g[1] + ' L' + (g[0] - 1) + ' ' + (g[1] - 4) + ' M' + g[0] + ' ' + g[1] + ' L' + (g[0] + 1) + ' ' + (g[1] - 5), { w: 0.7, ink: 'green', cap: 'round', detail: true }); });
    /* the sky in the water: long bright streaks that drift a little */
    [[50, 56, 14, 0], [64, 30, 20, 0.3], [87, 60, 26, 0.6]].forEach(function (c) { var dx = 3 * M.wave(t, 1, c[3]); p.line(c[1] + dx, c[0], c[1] + c[2] + dx, c[0], { w: 0.9, ink: 'white', cap: 'round' }); });
    /* rings from the frog's landing, flat on the water */
    if (tapping) for (i = 0; i < 3; i++) {
      var ru = M.seg(u, 0.42 + i * 0.08, 0.92), rr = 4 + 38 * M.easeOut(ru);
      if (ru > 0 && ru < 1) p.span(oval(LX, LY, rr, rr * 0.3), M.easeIn(M.seg(ru, 0.55, 1)), M.easeOut(M.seg(ru, 0, 0.4)), { w: 0.9, ink: 'blue', cap: 'round' });
    }
    /* the seedlings, farthest row first, each clump a handful of blades leaning in the gust */
    [44, 51, 60, 70, 82].forEach(function (y, r) {
      var f = (y - 38) / 55, sp = 13 + 11 * f, hw = 30 + 26 * f, h = 3.8 + 12 * f, x0 = 50 - Math.floor((hw - 4) / sp) * sp + (r % 2 ? sp / 2 : 0), x;
      for (x = x0; x <= 50 + hw + 0.1; x += sp) {
        if (Math.abs(x - 50) > hw - 4) continue;
        var gust = 0.55 + 0.45 * M.wave(t, 1, -(x - 50) / 140 - r * 0.03), sway = (4.8 * f + 1.2) * (M.wave(t, 1, -(x - 50) / 160 - r * 0.04) * (0.7 + 0.3 * gust)), shock = 0;
        if (tapping) { var d = Math.hypot((x - LX) * 0.8, (y - LY) * 2.4), front = 42 * M.easeOut(M.seg(u, 0.42, 0.95)); shock = 4.2 * f * sin(TAU * 3 * M.seg(u, 0.42, 0.95)) * Math.exp(-Math.pow((d - front) / 12, 2)) * (1 - M.seg(u, 0.8, 1)); }
        for (j = 0; j < 4; j++) {
          var bx = x + (j - 1.5) * 1.3 * (0.5 + f), tip = (j - 1.5) * 3.6 * (0.5 + f) + (sway + shock) * (0.7 + 0.3 * (j % 2)), bh = h * (j % 3 === 1 ? 1.1 : 0.9);
          p.path('M' + bx + ' ' + y + ' Q' + (bx + tip * 0.2) + ' ' + (y - bh * 0.6) + ' ' + (bx + tip) + ' ' + (y - bh), { w: 0.55 + 0.7 * f, ink: j % 2 ? 'green' : 'leaf', cap: 'taper', detail: r < 2 });
        }
        if (r > 1) p.line(x - 2.2 * (0.5 + f), y + 1.2, x + 2.2 * (0.5 + f), y + 1.2, { w: 0.4, ink: 'white', detail: true, alpha: 0.9 });
      }
    });
    /* the water glints, a star of light opening and closing at a few places */
    [[30, 76, 0.0], [72, 88, 0.3], [58, 66, 0.55], [38, 56, 0.8], [18, 88, 0.42], [80, 70, 0.15]].forEach(function (c) {
      var g = M.bump(M.seg(M.frac(t + c[2]), 0, 0.28)), r1 = 3.4 * g;
      if (r1 > 0.4) p.poly([[c[0], c[1] - r1], [c[0] + r1 * 0.22, c[1] - r1 * 0.22], [c[0] + r1, c[1]], [c[0] + r1 * 0.22, c[1] + r1 * 0.22], [c[0], c[1] + r1], [c[0] - r1 * 0.22, c[1] + r1 * 0.22], [c[0] - r1, c[1]], [c[0] - r1 * 0.22, c[1] - r1 * 0.22]], { fill: 'white', w: 0.5 });
    });
    /* the frog: sits on the bank right of the field, leaps in, shows only its eyes, paddles back and climbs out */
    var fx = 86, fy = 90, air = 0, vis = 1, blink = M.frac(t * 1 + 0.2) < 0.07 ? 0 : 1, thr = 0.5 + 0.5 * M.wave(t, 2);
    if (tapping) {
      var crouch = M.bump(M.seg(u, 0.02, 0.12));
      if (u < 0.42) { fx = M.lerp(86, LX, M.ease(a1)); fy = M.lerp(90, LY - 1, M.easeIn(a1) * 0.2 + 0.8 * M.ease(a1)) - 30 * 4 * a1 * (1 - a1) + 3 * crouch; air = a1 > 0 && a1 < 1 ? 1 : 0; }
      else if (u < 0.78) { fx = LX; fy = LY; }
      else { fx = M.lerp(LX, 86, M.ease(a2)); fy = M.lerp(LY, 90, M.ease(a2)) - 4 * 4 * a2 * (1 - a2); }
    }
    if (tapping && u >= 0.42 && u < 0.97) {
      var dive = sink, swim = M.seg(u, 0.78, 0.97);
      p.clip(function () { p.rect(-20, -20, 140, fy + 0.5 - 3, {}); }, function () { p.at(fx, fy + 6 * dive * (1 - swim), 0, 1, function () { p.at(0, 0, 0.0, [swim > 0.7 ? 1 : 1, 1], function () { frog(p, 0, blink, thr); }); }); });
      p.span(oval(fx - 5, fy + 1.5, 6, 2), 0, 1, { w: 0.6, ink: 'white', cap: 'round' });
    } else p.at(fx, fy, air ? -0.5 + 1.0 * a1 : 0, [1, 1 - 0.18 * (tapping ? M.bump(M.seg(u, 0.02, 0.12)) : 0)], function () { frog(p, air, blink, thr); });
  }
});

})(Dingbats);
