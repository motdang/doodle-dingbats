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
