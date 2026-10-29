/* Lai (ลาย): Thai ornament in gold. Flames, four-petal rosettes, pointed petals, lotus mouldings, nagas, a gable and a niche. */
(function (D) {
'use strict';
var M = D.math, TAU = M.TAU, PI = Math.PI;

/* a spiral that starts on the anchor (x, y); its middle lies R away in direction a, and it winds dir (1 or -1) */
function curl(x, y, a, dir, R, turns) {
  var q = [], cx = x + Math.cos(a) * R, cy = y + Math.sin(a) * R;
  for (var i = 0; i <= 36; i++) { var u = i / 36, th = a + PI + dir * u * TAU * (turns || 1.6), r = R * (1 - 0.82 * u); q.push([cx + Math.cos(th) * r, cy + Math.sin(th) * r]); }
  return q;
}
function bez(a, b, c, d, n) { var q = []; for (var i = 0; i <= n; i++) { var u = i / n, v = 1 - u; q.push([v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0], v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1]]); } return q; }
/* a four-point gleam at (x, y), g its size from 0 to 1 */
function glint(p, x, y, g, r) { if (g > 0.03) p.star(x, y, (r || 10) * g, (r || 10) * 0.22 * g, 4, { fill: 'yellow', ink: 'gold', w: 0.4, glow: 1 }); }

/* the spine of a kranok flame, from the origin heading up. It leans (a radians, negative leans back first), then from u0 on
   the tip winds into a hook of T radians that tightens toward the point; sw bends the whole thing more toward the tip. */
function spine(L, a, T, u0, sw, n) {
  var P = [[0, 0]], H = [-PI / 2], x = 0, y = 0, i, u, h;
  for (i = 1; i <= n; i++) {
    u = (i - 0.5) / n;
    h = -PI / 2 + a * Math.sin(PI * 1.5 * u) + sw * Math.pow(u, 1.4) + (u > u0 ? T * Math.pow((u - u0) / (1 - u0), 1.7) : 0);
    x += Math.cos(h) * L / n; y += Math.sin(h) * L / n; P.push([x, y]); H.push(h);
  }
  return { P: P, H: H };
}
/* the leaf laid along a spine: a full belly low down, thinning to a point over the last two thirds */
function leafw(u) { return u < 0.2 ? 0.55 + 0.45 * Math.sin(u / 0.2 * PI / 2) : Math.pow(1 - (u - 0.2) / 0.8, 1.8); }
function outline(P, W, wf) {
  var n = P.length - 1, A = [], B = [];
  P.forEach(function (q, i) {
    var a = P[Math.max(0, i - 1)], b = P[Math.min(n, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, w = W * wf(i / n);
    A.push([q[0] - dy / d * w * 1.25, q[1] + dx / d * w * 1.25]); B.push([q[0] + dy / d * w * 0.75, q[1] - dx / d * w * 0.75]);
  });
  return A.concat(B.reverse());
}
/* one flame f = {x, y, r (turn), m (mirror), L, a, T, u0, sw, W, fill, w}; returns its spine for whatever grows from it */
function flame(p, f) {
  var S = spine(f.L, f.a, f.T, f.u0, f.sw || 0, 30), mid = [];
  p.at(f.x, f.y, f.r || 0, f.m ? [-1, 1] : 1, function () {
    p.poly(outline(S.P, f.W, leafw), { fill: f.fill || 'a', w: f.w || 0.8 });
    var o = outline(S.P, f.W * 0.55, leafw).slice(0, 31);
    for (var i = 3; i < 22; i++) mid.push([(S.P[i][0] + o[i][0]) / 2, (S.P[i][1] + o[i][1]) / 2]);
    p.curve(mid, { w: 0.45, detail: true });
  });
  return S;
}
/* a tap on something that opens: it winds shut over the first third, then springs open past where it began */
function coilSpring(a) { return a < 0.3 ? 1 - M.ease(a / 0.3) : M.spring((a - 0.3) / 0.7); }
/* the kranok flame-leaf, placed by hand. Foot at the origin, up is -y, 94 high: it leans back low down and sweeps forward to a crest whose
   tip curls over and back like a wave. The cubic pieces (four points each) run from the foot up the smooth edge, over the crest and round
   the curl to its point, then back down the edge that is broken into three teeth, each flicking up and forward as the tip does. */
var KR = [
  [[-9, -4], [-21, -20], [-19, -50], [-6, -68]], [[-6, -68], [2, -80], [13, -94], [28, -94]], [[28, -94], [39, -95], [47, -90], [46, -82]], [[46, -82], [45, -75], [41, -70], [34, -71]],
  [[34, -71], [38, -72], [39, -77], [38, -82]], [[38, -82], [37, -86], [33, -88], [28, -88]], [[28, -88], [21, -88], [16, -81], [15, -73]],
  [[15, -73], [15, -70], [14, -66], [13, -62]], [[13, -62], [16, -62], [20, -64], [24, -68]], [[24, -68], [23, -60], [16, -55], [11, -50]],
  [[11, -50], [15, -51], [21, -53], [26, -57]], [[26, -57], [25, -48], [16, -42], [10, -36]],
  [[10, -36], [15, -37], [22, -40], [28, -45]], [[28, -45], [27, -34], [18, -27], [11, -20]], [[11, -20], [11, -15], [10, -9], [9, -4]]
];
/* the thin line that runs inside the smooth edge and the crest, the second line of gold on gold */
var KI = [[[-6, -12], [-14, -26], [-13, -49], [-3, -64]], [[-3, -64], [4, -75], [14, -90], [28, -91]], [[28, -91], [37, -92], [43, -88], [43, -81]], [[43, -81], [43, -77], [40, -74], [36, -74]]];
function sample(segs, n) { var q = []; segs.forEach(function (c) { q = q.concat(bez(c[0], c[1], c[2], c[3], n).slice(0, -1)); }); q.push(segs[segs.length - 1][3]); return q; }
var KRP = sample(KR, 8), KIP = sample(KI, 8);
/* the points leaning by sw (radians, more toward the tip) and the curl tightening by cu */
function lean(P, sw, cu) {
  return P.map(function (q) {
    var h = Math.max(0, -q[1] / 94), x = q[0], y = q[1], a = sw * Math.pow(h, 1.6), c, s;
    if (h > 0.72) { var k = cu * (h - 0.72) / 0.28, dx = x - 38, dy = y + 80; c = Math.cos(k); s = Math.sin(k); x = 38 + dx * c - dy * s; y = -80 + dx * s + dy * c; }
    c = Math.cos(a); s = Math.sin(a);
    return [x * c - y * s, x * s + y * c];
  });
}
/* the kranok sam tua: a tall flame with a smaller one behind and one in front, fanned a few degrees, all leaning and curling the same way,
   standing in a cup. o = {x, y, sc, rot, t, ph (sway phase), open: [back, middle, front] (0 sunk in the cup, 1 risen), cup}; returns the tip of the tall flame */
function samTua(p, o) {
  var t = o.t, ph = o.ph || 0, op = o.open || [1, 1, 1], tip = [0, 0];
  p.at(o.x, o.y, o.rot || 0, o.sc || 1, function () {
    [[-0.17, 0.8, -2, 'a', 0, 0], [0, 1, 0, 'a', 0.06, 1], [0.13, 0.62, 4, 'yellow', 0.12, 2]].forEach(function (F) {
      var g = op[F[5]], sw = 0.2 * M.wave(t, 1, -ph - F[4]) - 0.9 * (1 - Math.min(1, g)), cu = 0.3 * M.wave(t, 1, -ph - F[4] - 0.2);
      if (g < 0.03) return;
      p.at(F[2], 0, F[0], [F[1] * 0.8 * (0.6 + 0.4 * Math.min(1.1, g)), F[1] * Math.max(0.04, g)], function () {
        p.poly(lean(KRP, sw, cu), { fill: F[3], w: 0.85 });
        p.curve(lean(KIP, sw, cu), { w: 0.4, detail: true });
      });
      if (F[5] === 1) { tip = lean([[34, -71]], sw, cu)[0]; tip = [tip[0] * 0.8, tip[1]]; }
    });
    if (o.cup !== false) {
      p.path('M-12 -8 C-12 0 -7 6 0 6 C7 6 12 0 12 -8 Z', { fill: 'b', w: 0.9 });
      p.rect(-14, -12, 28, 5, { fill: 'a', r: 2.2, w: 0.85 });
      p.circle(0, 0.5, 2.2, { fill: 'c', w: 0.6 });
    }
  });
  return tip;
}

D.add('kranok', {
  fam: 'lai', tags: ['kranok', 'flame', 'thai', 'ornament', 'motif', 'gold', 'temple', 'sam tua', 'lai thai', 'กระหนก', 'กระหนกสามตัว', 'ลายไทย'], loop: 3.6, ratio: 1, still: 0.3, tapLen: 1.8, tapRest: 0.96, burst: 'star', burstAt: [50, 18], burstN: 6, margin: [10, 12, 10, 12],
  about: 'three nested flame-leaves in a cup sway together, the tips flicking over one after another, a glint running up the tall one', tapAbout: 'the three flames sink into their cup and spring up again one after another',
  draw: function (p, t, s) {
    var tp = s.tap, op = [0, 1, 2].map(function (i) { return tp >= 0 ? coilSpring(M.seg(tp, 0.08 * i, 0.08 * i + 0.8)) : 1; });
    var tip = samTua(p, { x: 39, y: 90, sc: 0.88, t: t, open: op });
    if (tp < 0) glint(p, 39 + tip[0] * 0.88, 90 + tip[1] * 0.88, M.bump(M.seg(M.frac(t - 0.1), 0, 0.2)), 12);
  }
});

/* a running kranok border: nine sam tua along a wave of vine, each flame's tip curling toward the body of the next, the sway passing left
   to right; a glint runs from tip to tip. Tap: each sinks into its cup and springs up again in turn, and gold is laid over the vine. */
D.add('lai-kranok', {
  fam: 'lai', tags: ['kranok', 'border', 'divider', 'flame', 'running', 'scroll', 'thai', 'gold', 'sam tua', 'กระหนก', 'ลายไทย'], loop: 4, ratio: 5, still: 0.3, tapLen: 2.4, tapRest: 0.97, burst: 'star', burstAt: [250, 40], burstN: 8, margin: [10, 8, 10, 8],
  about: 'a row of nested flame-leaves runs along a wave of vine, each tip curling toward the next flame, the sway passing from one to the next', tapAbout: 'the flames sink into their cups and spring up again in turn, left to right, gold laid over the vine',
  draw: function (p, t, s) {
    var tp = s.tap, i, N = 9, X = function (i) { return 24 + 52 * i; }, vy = function (x) { return 90 - 2.8 * Math.cos(TAU * (x - 24) / 52); }, v = [];
    for (var x = 6; x <= 494; x += 8) v.push([x, vy(x)]);
    p.curve(v, { w: 1 });
    if (tp >= 0) p.span(v, M.easeIn(M.seg(tp, 0.5, 0.95)), M.easeOut(M.seg(tp, 0, 0.5)), { w: 1.7, ink: 'a' });
    p.circle(6, vy(6), 3.2, { fill: 'b', w: 0.6 }); p.circle(494, vy(494), 3.2, { fill: 'b', w: 0.6 });
    for (i = 0; i < N; i++) {
      var op = [0, 1, 2].map(function (k) { return tp >= 0 ? coilSpring(M.seg(tp, i * 0.06 + k * 0.03, i * 0.06 + k * 0.03 + 0.44)) : 1; });
      var tip = samTua(p, { x: X(i), y: vy(X(i)) - 7, sc: 0.82, ph: i / N, t: t, open: op });
      if (tp < 0) glint(p, X(i) + tip[0] * 0.82, vy(X(i)) - 7 + tip[1] * 0.82, M.bump(M.seg(M.frac(t - i / N), 0, 0.14)), 9);
    }
  }
});

/* a pointed petal standing on the origin, tip up: full-bellied low down, the sides drawn in to a thin point (the ogee of krajang).
   L tall, W the half-width at the belly, bw the half-width of the foot as a share of W */
function petalD(L, W, bw) {
  var b = (bw || 0) * W, f = function (a, c) { return a.toFixed(2) + ' ' + c.toFixed(2); };
  return 'M' + f(-b, 0) + ' C' + f(-W * 0.9, -L * 0.02) + ' ' + f(-W * 1.05, -L * 0.25) + ' ' + f(-W, -L * 0.42) +
    ' C' + f(-W * 0.98, -L * 0.6) + ' ' + f(-W * 0.2, -L * 0.66) + ' ' + f(-W * 0.08, -L * 0.84) +
    ' Q' + f(-W * 0.04, -L * 0.94) + ' ' + f(0, -L) + ' Q' + f(W * 0.04, -L * 0.94) + ' ' + f(W * 0.08, -L * 0.84) +
    ' C' + f(W * 0.2, -L * 0.66) + ' ' + f(W * 0.98, -L * 0.6) + ' ' + f(W, -L * 0.42) +
    ' C' + f(W * 1.05, -L * 0.25) + ' ' + f(W * 0.9, -L * 0.02) + ' ' + f(b, 0) + ' Z';
}

/* prachamyam: four pointed petals round a gem, a leaflet between each pair. o.open[i] is how far petal i is open (0 bud, 1 open,
   a little over as it springs), o.t the loop, o.spin turns the beads of the gem */
function rose4(p, R, o) {
  var t = o.t, i, k;
  for (i = 0; i < 4; i++) {
    var od = o.open[(i + 1) % 4];
    if (od > 0.03) p.at(0, 0, i * PI / 2 + PI / 4, [od * 0.9, od * (1 + 0.05 * M.wave(t, 1, -(i + 0.5) / 4))], function () { p.path(petalD(R * 0.8, R * 0.14), { fill: 'c', w: 0.7 }); });
  }
  for (i = 0; i < 4; i++) {
    var op = o.open[i], br = 1 + 0.06 * M.wave(t, 1, -i / 4);
    if (op > 0.03) p.at(0, 0, i * PI / 2, [Math.min(1.2, 0.35 + 0.65 * op), op * br], function () {
      p.path(petalD(R, R * 0.31), { fill: 'a', w: 0.9 });
      p.path(petalD(R * 0.64, R * 0.17), { fill: 'b', w: 0.45 });
      p.line(0, -R * 0.1, 0, -R * 0.5, { w: 0.4, detail: true });
    });
  }
  p.circle(0, 0, R * 0.22, { fill: 'c', w: 0.8 });
  for (k = 0; k < 6; k++) { var a = o.spin + k * TAU / 6; p.dot(Math.cos(a) * R * 0.135, Math.sin(a) * R * 0.135, R * 0.034, 'white'); }
}
/* where petal i's tip is, for a glint */
function tipOf(R, i) { return [Math.cos(i * PI / 2 - PI / 2) * R, Math.sin(i * PI / 2 - PI / 2) * R]; }

D.add('prachamyam', {
  fam: 'lai', tags: ['prachamyam', 'rosette', 'four petals', 'flower', 'thai', 'gold', 'ornament', 'lattice', 'motif', 'ประจำยาม', 'ลายไทย'], loop: 3.6, ratio: 1, still: 0.2, tapLen: 1.8, tapRest: 0.7, burst: 'petal', burstAt: [50, 50], burstN: 8, margin: [10, 10, 10, 10],
  about: 'four petals breathe one after another round a gem, the beads of the gem turning, a glint going round the tips', tapAbout: 'the four petals close to a bud and spring open in turn, the gem spinning once',
  draw: function (p, t, s) {
    var tp = s.tap, op = [0, 1, 2, 3].map(function (i) { return tp >= 0 ? coilSpring(M.seg(tp, 0.08 * i, 0.08 * i + 0.7)) : 1; }), R = 45;
    p.at(50, 50, 0, 1, function () {
      rose4(p, R, { open: op, t: t, spin: TAU * t + (tp >= 0 ? TAU * M.easeOut(M.seg(tp, 0, 0.8)) : 0) });
      for (var i = 0; i < 4; i++) { var q = tipOf(R, i); glint(p, q[0], q[1], M.bump(M.seg(M.frac(t - i / 4), 0, 0.18)), 11); }
    });
  }
});

/* a chain of prachamyam: five rosettes linked end to end by a lozenge, the breath going along it left to right */
D.add('lai-prachamyam', {
  fam: 'lai', tags: ['prachamyam', 'border', 'divider', 'rosette', 'chain', 'thai', 'gold', 'lattice', 'ประจำยาม', 'ลายไทย'], loop: 4, ratio: 5, still: 0.2, tapLen: 2.4, tapRest: 0.7, burst: 'petal', burstAt: [250, 50], burstN: 8, margin: [10, 10, 10, 10],
  about: 'five four-petal rosettes linked by lozenges breathe in turn along the row, a glint passing from gem to gem', tapAbout: 'the rosettes close to buds and spring open one after another, left to right',
  draw: function (p, t, s) {
    var tp = s.tap, i, R = 38, lk = tp >= 0 ? M.easeOut(M.seg(tp, 0, 0.5)) : 0;
    p.path('M7 50 L493 50', { w: 0.55 });
    p.span('M7 50 L493 50', tp >= 0 ? M.easeIn(M.seg(tp, 0.5, 0.95)) : 0, lk, { w: 1.3, ink: 'a' });
    for (i = 0; i < 4; i++) {
      var lx = 100 + 100 * i, pulse = 1 + 0.2 * M.bump(M.seg(M.frac(t - (i + 0.5) / 5), 0, 0.2)), u = tp >= 0 ? M.bump(M.seg(tp, 0.1 * i + 0.1, 0.1 * i + 0.4)) : 0;
      p.at(lx, 50, 0, pulse * (1 + 0.3 * u), function () { p.poly([[-10, 0], [0, -9], [10, 0], [0, 9]], { fill: 'a', w: 0.8 }); p.circle(0, 0, 2.8, { fill: 'b', w: 0.5 }); });
    }
    for (i = 0; i < 5; i++) {
      var op = [0, 1, 2, 3].map(function (k) { return tp >= 0 ? coilSpring(M.seg(tp, 0.08 * i + 0.03 * k, 0.08 * i + 0.03 * k + 0.5)) : 1; });
      p.at(50 + 100 * i, 50, 0, 1, function () {
        rose4(p, R, { open: op, t: t - i / 5, spin: TAU * t * (i % 2 ? -1 : 1) });
      });
      glint(p, 50 + 100 * i, 50 - R, M.bump(M.seg(M.frac(t - i / 5), 0, 0.16)), 10);
    }
    p.dot(7, 50, 3.4, 'a'); p.dot(493, 50, 3.4, 'a'); p.circle(7, 50, 3.4, { w: 0.6 }); p.circle(493, 50, 3.4, { w: 0.6 });
  }
});

/* lai-krajang: two ranks of krajang, the tall ones behind and the short ones tucked between, on a beaded foot. The tips lean after one
   another along the row (shear, the foot fixed), a glint running tip to tip */
D.add('lai-krajang', {
  fam: 'lai', tags: ['krajang', 'border', 'divider', 'petals', 'teeth', 'gable', 'lotus base', 'thai', 'gold', 'กระจัง', 'ลายไทย'], loop: 3.6, ratio: 5, still: 0.25, tapLen: 2.2, burst: 'star', burstAt: [250, 40], burstN: 8, margin: [12, 6, 6, 6],
  about: 'two ranks of pointed krajang petals lean after one another along a beaded foot, a glint running tip to tip', tapAbout: 'the petals spring up in turn from the left, each flashing fresh gold as it rises',
  draw: function (p, t, s) {
    var tp = s.tap, i, N = 12, P = 500 / N;
    function rank(n, x0, L, W, inner, off, ph) {
      for (var k = 0; k < n; k++) {
        var x = x0 + P * k, pa = tp >= 0 ? M.seg(tp, k / n * 0.5 + off, k / n * 0.5 + off + 0.4) : 0, pop = 1 + 0.4 * M.bump(pa) * (1 - 0.3 * pa), fl = M.bump(M.seg(pa, 0, 0.7));
        var lean = 0.2 * M.wave(t, 1, -(x / 500) * 1.0 - ph), up = 1 + 0.5 * (pop - 1) + 0.03 * M.wave(t, 1, -x / 500 * 2);
        p.at(x, 90, 0, 1, function () {
          p.skew(lean, 0);
          p.at(0, 0, 0, [1, Math.max(0.05, up)], function () {
            p.path(petalD(L, W, 0.95), { fill: fl > 0.3 ? 'yellow' : 'a', w: 0.9 });
            p.path(petalD(L * 0.62, W * 0.55, 0.5), { fill: inner, w: 0.45 });
          });
        });
        if (ph === 0) glint(p, x - lean * L, 90 - L * Math.max(0.05, up), M.bump(M.seg(M.frac(t - x / 500), 0, 0.12)), 9);
      }
    }
    rank(N, P / 2, 80, 15.5, 'b', 0, 0);
    p.rect(0, 89, 500, 6, { fill: 'cream', w: 0.9 });
    rank(N - 1, P, 48, 11.5, 'c', 0.12, 0.1);
    p.rect(0, 89, 500, 6, { fill: 'cream', w: 0.9 });
    for (i = 0; i < N * 2; i++) p.dot(P / 4 + i * P / 2, 92, 1.7, 'a');
    p.line(0, 97, 500, 97, { w: 0.5, detail: true });
  }
});

/* lai-bua: the lotus moulding at the foot of a chedi. Inverted petals hang from the top rule, upright ones stand on the bottom, and a band of
   pearls runs between them; the pearls light in turn along it */
D.add('lai-bua', {
  fam: 'lai', tags: ['bua', 'lotus', 'border', 'divider', 'moulding', 'chedi', 'base', 'petals', 'pearls', 'thai', 'บัวคว่ำ', 'บัวหงาย', 'ลายไทย'], loop: 3.6, ratio: 5, still: 0.3, tapLen: 2.2, burst: 'petal', burstAt: [250, 50], burstN: 8, margin: [8, 6, 8, 6],
  about: 'lotus petals hang from the top rule and stand on the bottom one, a band of pearls between them lighting in turn', tapAbout: 'the petals close and open again, the rows in turn from the left, the pearls flashing',
  draw: function (p, t, s) {
    var tp = s.tap, N = 8, P = 500 / N, k, i;
    function row(dir, y0, fill, inner) {
      for (k = 0; k < N; k++) {
        var x = P / 2 + P * k, br = 1 + 0.045 * M.wave(t, 1, -k / N - (dir > 0 ? 0 : 0.12)), pop = 1, shut = 0;
        if (tp >= 0) { var o = coilSpring(M.seg(tp, k / N * 0.45 + (dir > 0 ? 0 : 0.08), k / N * 0.45 + (dir > 0 ? 0 : 0.08) + 0.5)); pop = 0.3 + 0.7 * o; shut = 0.5 * (1 - o); }
        p.at(x, y0, 0, [1 - shut, dir * Math.max(0.05, br * pop)], function () {
          p.path(petalD(45, 28, 0.82), { fill: fill, w: 0.9 });
          p.path(petalD(31, 17, 0.5), { fill: inner, w: 0.45 });
          p.line(0, -4, 0, -26, { w: 0.4, detail: true });
        });
      }
    }
    row(-1, 6, 'a', 'c');      /* hanging petals: base on the top rule, tip down */
    row(1, 94, 'a', 'b');      /* upright petals: base on the bottom rule */
    p.rect(0, 43.5, 500, 13, { fill: 'cream', w: 0.9 });
    for (i = 0; i < 24; i++) {
      var bx = 10.4 + i * 20.83, lit = M.bump(M.seg(M.frac(t - i / 24), 0, 0.12)) + (tp >= 0 ? M.bump(M.seg(tp, 0.03 * i * 0.6, 0.03 * i * 0.6 + 0.3)) : 0), sc = 1 + 0.3 * Math.min(1, lit);
      p.at(bx, 50, 0, sc, function () { p.circle(0, 0, 4.2, { fill: lit > 0.3 ? 'yellow' : 'white', w: 0.6, glow: Math.min(1, lit) }); p.arc(-1, -1, 2, 3.6, 4.8, { w: 0.4, detail: true }); });
    }
    p.line(0, 6, 500, 6, { w: 1 }); p.line(0, 94, 500, 94, { w: 1 });
    p.dot(4, 50, 3.4, 'a'); p.dot(496, 50, 3.4, 'a');
  }
});

/* lai-naga: two nagas ripple in from either end and meet at the middle, heads close, a gem hanging between them. The ripple runs
   toward the heads, the right one a hair behind the left. Tap: both bow, tongues flick and the gem flashes */
function nagaPoints(t, ph) {
  var top = [], bot = [], mid = [], N = 40, i;
  for (i = 0; i <= N; i++) {
    var u = i / N, x = 6 + 198 * u, A = 17 * (1 - 0.6 * Math.pow(u, 1.4)), y = 54 + A * Math.sin(TAU * (x / 99 - t - ph)), hw = 1.6 + 8.6 * Math.pow(u, 0.9);
    mid.push([x, y, hw]);
  }
  mid.forEach(function (q, i) {
    var a = mid[Math.max(0, i - 1)], b = mid[Math.min(N, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    top.push([q[0] + dy / d * q[2], q[1] - dx / d * q[2]]); bot.push([q[0] - dy / d * q[2], q[1] + dx / d * q[2]]);
  });
  return { mid: mid, top: top, bot: bot };
}
function naga(p, t, ph, tap, k) {
  var B = nagaPoints(t, ph), N = B.mid.length - 1, i;
  p.poly(B.top.concat(B.bot.slice().reverse()), { fill: 'c', w: 0.95 });
  for (i = 3; i < N - 1; i += 2) {   /* the gold crest: a flame on the back every other step */
    var q = B.top[i], q2 = B.top[i + 1], len = 5 + 8 * i / N, hw = B.mid[i][2], lag = 0.5 * M.wave(t, 1, -i / N - ph);
    p.poly([[q[0] - 2.5, q[1] + 1], [q[0] - 3 - len * 0.45 + lag * 1.5, q[1] - len], [q2[0] + 1, q2[1]]], { fill: 'a', w: 0.6 });
  }
  for (i = 4; i < N - 1; i += 2) {   /* scales: chevrons across the body pointing at the head */
    var m = B.mid[i], tt = B.top[i], bb = B.bot[i], hw2 = m[2];
    if (hw2 > 3) p.curve([[tt[0] - 1, tt[1]], [m[0] + hw2 * 0.55, m[1]], [bb[0] - 1, bb[1]]], { ink: 'a', w: 0.5, detail: true });
  }
  var h = B.mid[N], h0 = B.mid[N - 2], ang = Math.atan2(h[1] - h0[1], h[0] - h0[0]) + k.bow;
  p.at(h[0] - 2, h[1], ang, 1.25, function () {
    flame(p, { x: 4, y: -7, r: -0.35, m: true, L: 30, a: 0, T: 3.2, u0: 0.5, sw: -0.2 * M.wave(t, 1, -ph - 0.25), W: 5, fill: 'a' });
    flame(p, { x: -6, y: -7, r: -0.55, m: true, L: 22, a: 0, T: 3, u0: 0.5, sw: -0.2 * M.wave(t, 1, -ph - 0.3), W: 4, fill: 'a' });
    p.path('M-4 -9 C6 -13 19 -11 29 -5 C34 -3 34 3 29 5 C20 9 8 10 -4 9 Z', { fill: 'c', line: false });
    p.path('M-3 -9 C6 -13 19 -11 29 -5 C34 -3 34 3 29 5 C20 9 8 10 -3 9', { w: 0.95, cap: 'round' });
    p.path('M8 4 C16 6 25 5 31 2', { w: 0.5, detail: true });
    p.path('M20 -6.5 C24 -7.5 28 -6 30 -4', { ink: 'a', w: 0.5, detail: true });
    p.circle(30.5, -1.3, 1, { fill: 'ink', line: false, detail: true });
    p.circle(14, -3.6, 3, { fill: 'white', w: 0.6 }); p.dot(14.8, -3.5, 1.3, 'ink');
    p.poly([[-4, 9], [4, 17 + 3 * M.wave(t, 2, -ph)], [10, 9]], { fill: 'a', w: 0.6 });
    var fl = k.tongue; if (fl > 0.05) { p.path('M32 2 L' + (32 + 8 * fl) + ' 2 M' + (32 + 6 * fl) + ' 2 L' + (32 + 10 * fl) + ' -0.5 M' + (32 + 6 * fl) + ' 2 L' + (32 + 10 * fl) + ' 4.5', { ink: 'b', w: 0.6, cap: 'round' }); }
  });
  return [h[0] + 38, h[1]];
}
D.add('lai-naga', {
  fam: 'lai', tags: ['naga', 'border', 'divider', 'serpent', 'dragon', 'temple', 'stair', 'scales', 'gold crest', 'thai', 'นาค', 'ลายไทย'], loop: 3.6, ratio: 5, still: 0.3, tapLen: 2, burst: 'star', burstAt: [250, 44], burstN: 8, margin: [14, 6, 10, 6],
  about: 'two scaled nagas ripple in from either end, gold crests along their backs, and meet head to head over a gem', tapAbout: 'both nagas bow, tongues flick and the gem flashes',
  draw: function (p, t, s) {
    var tp = s.tap, bow = tp >= 0 ? 0.32 * M.bump(M.seg(tp, 0, 0.7)) * (1 + 0.2 * M.wave(tp, 3)) : 0, tg = Math.max(0.55 + 0.45 * M.wave(t, 3), tp >= 0 ? M.bump(M.seg(tp, 0.15, 0.55)) : 0);
    naga(p, t, 0, tp, { bow: bow, tongue: tg > 0.5 ? tg : 0 });
    p.at(500, 0, 0, [-1, 1], function () { naga(p, t, 0.07, tp, { bow: bow, tongue: tg > 0.5 ? tg : 0 }); });
    var gy = 50 + 3 * M.wave(t, 1) - (tp >= 0 ? 9 * M.bump(M.seg(tp, 0.1, 0.6)) : 0), fl = tp >= 0 ? M.bump(M.seg(tp, 0.1, 0.6)) : 0;
    p.at(250, gy, 0, 1 + 0.25 * fl, function () {
      p.path('M0 -9 C5 -4 7 0 0 7 C-7 0 -5 -4 0 -9 Z', { fill: 'b', w: 0.8, glow: 0.5 + 0.5 * fl });
      p.line(-2.2, -1, -0.6, -5, { ink: 'white', w: 0.5, detail: true });
    });
    glint(p, 250, gy - 12, M.bump(M.seg(M.frac(t), 0.35, 0.55)) + fl, 9);
  }
});

/* chofa: the finial at the peak of a temple gable, a slender neck and hooked head, and the bai raka, the row of flame-leaves
   stepping down each slope; a bell hangs at the eave. The leaves flutter down the slope from the peak, the finial leaning with the breeze.
   Tap: the wind takes the chofa and every leaf, and the bell swings and strikes. */
D.add('chofa', {
  fam: 'lai', tags: ['chofa', 'finial', 'gable', 'roof', 'temple', 'bai raka', 'bell', 'wind', 'thai', 'gold', 'ช่อฟ้า', 'ใบระกา', 'วัด'], loop: 3.2, ratio: 1, still: 0.2, tapLen: 2, burst: 'note', burstAt: [11, 88], burstN: 5, burstSpread: 3, burstColor: 'a', margin: [8, 10, 8, 10],
  about: 'the leaves of the bai raka flutter down both slopes from the peak, the chofa leaning with the breeze, a bell swaying at the eave', tapAbout: 'a gust takes the chofa and every leaf, and the bell swings out and strikes',
  draw: function (p, t, s) {
    var tp = s.tap, g = tp >= 0 ? M.spring(M.seg(tp, 0, 0.4)) * (1 - M.easeIn(M.seg(tp, 0.5, 1))) : 0, i, side;
    var AX = 50, AY = 47, EX = 9, EY = 79;
    p.poly([[AX, AY + 7], [EX - 2, EY + 7], [100 - EX + 2, EY + 7]], { fill: 'cream', w: 0.8 });
    p.path('M50 62 L30 78 L70 78 Z', { w: 0.45, detail: true });
    for (side = 0; side < 2; side++) p.at(side ? 100 : 0, 0, 0, [side ? -1 : 1, 1], function () {
      p.poly([[AX, AY], [EX, EY], [EX - 2, EY + 7], [AX, AY + 7]], { fill: 'b', w: 0.95 });
      p.line(AX, AY + 3.5, EX - 1, EY + 3.5, { ink: 'a', w: 0.5, detail: true });
      for (i = 0; i < 6; i++) {
        var u = 0.1 + i * 0.165, x = AX + (EX - AX) * u, y = AY + (EY - AY) * u + 0.5, w = M.wave(t, 1, -i / 6 - (side ? 0.05 : 0)) * 0.16 + g * 0.5;
        flame(p, { x: x, y: y, r: 0.2 + w, L: 15 + 2 * i / 5, a: 0, T: 2.4, u0: 0.5, sw: w * 0.8, W: 3.4, fill: 'a', w: 0.75 });
      }
      p.curve(curl(EX - 1, EY + 6, 2.6, -1, 4.5, 1.3), { w: 0.8 });
    });
    var sw = 0.14 * M.wave(t, 1, 0.1) + 0.8 * g, S = spine(52, 0.45, 3.3, 0.52, sw, 30);
    p.at(AX, AY + 3, 0, 1, function () {
      p.poly(outline(S.P, 6.2, leafw), { fill: 'a', w: 0.95 });
      var m = []; for (i = 3; i < 22; i++) m.push(S.P[i]);
      p.curve(m, { w: 0.45, detail: true });
      var e = S.P[20]; p.circle(e[0] + 0.5, e[1] + 1, 2.6, { fill: 'white', w: 0.6, detail: true }); p.dot(e[0] + 1.2, e[1] + 1.2, 1.1, 'ink');
      p.poly([[-9, 0], [-4, -6], [0, 0]], { fill: 'c', w: 0.7 }); p.poly([[0, 0], [4, -6], [9, 0]], { fill: 'c', w: 0.7 });
    });
    p.circle(AX, AY + 2, 4.2, { fill: 'b', w: 0.8 });
    var sg = 0.2 * M.wave(t, 1, 0.3) + 0.9 * g * M.wave(tp < 0 ? 0 : tp, 2) , bx = EX, by = EY + 8;
    p.line(bx, by - 1, bx, by + 3, { w: 0.6 });
    p.pivot(bx, by, sg, 1, function () {
      p.path('M' + (bx - 6) + ' ' + (by + 12) + ' C' + (bx - 6) + ' ' + (by + 6) + ' ' + (bx - 4) + ' ' + (by + 3) + ' ' + bx + ' ' + (by + 3) + ' C' + (bx + 4) + ' ' + (by + 3) + ' ' + (bx + 6) + ' ' + (by + 6) + ' ' + (bx + 6) + ' ' + (by + 12) + ' Z', { fill: 'a', w: 0.85 });
      p.line(bx - 6, by + 8, bx + 6, by + 8, { w: 0.4, detail: true });
      p.circle(bx + 1.6 * Math.sin(TAU * 2 * t), by + 14, 1.9, { fill: 'c', w: 0.6 });
    });
    var gl = M.seg(M.frac(t), 0.2, 0.7);
    if (gl > 0 && gl < 1) glint(p, AX - (AX - EX) * gl, AY + (EY - AY) * gl - 8, M.bump(gl), 9);
  }
});

/* sum: a pointed niche frame (ซุ้ม): a red band follows an ogee arch with a krajang petal at every step round the outside, the middle empty
   for a word or a picture. The ripple runs up one side and down the other; a glint goes round. Tap: the petals fold flat and open again
   from the foot up, the finial flashing. */
var ARCH = (function () {
  var P = [], i, q;
  for (i = 0; i <= 6; i++) P.push([24, 90 - 38 * i / 6]);
  q = bez([24, 52], [24, 30], [46, 32], [50, 11], 22); for (i = 1; i < q.length; i++) P.push(q[i]);
  q = bez([50, 11], [54, 32], [76, 30], [76, 52], 22); for (i = 1; i < q.length; i++) P.push(q[i]);
  for (i = 1; i <= 6; i++) P.push([76, 52 + 38 * i / 6]);
  var L = [0]; for (i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  return { P: P, L: L, T: L[L.length - 1] };
})();
function archAt(u) {
  var A = ARCH, d = u * A.T, i = 1;
  while (i < A.P.length - 1 && A.L[i] < d) i++;
  var a = A.P[i - 1], b = A.P[i], f = (d - A.L[i - 1]) / ((A.L[i] - A.L[i - 1]) || 1), dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1;
  return [a[0] + dx * f, a[1] + dy * f, dy / n, -dx / n];
}
D.add('sum', {
  fam: 'lai', tags: ['sum', 'niche', 'frame', 'arch', 'window', 'gate', 'krajang', 'temple', 'thai', 'gold', 'ซุ้ม', 'ลายไทย'], loop: 4, ratio: 1, still: 0.3, tapLen: 2, burst: 'star', burstAt: [50, 12], burstN: 7, margin: [10, 10, 6, 10],
  about: 'a ripple runs up one side and down the other round the petals of a gold arch, a glint going round it, the middle left empty', tapAbout: 'the petals fold flat and open again from the foot up, the finial flashing',
  draw: function (p, t, s) {
    var tp = s.tap, N = 19, i, out = [], inn = [];
    ARCH.P.forEach(function (q, k) {
      var a = ARCH.P[Math.max(0, k - 1)], b = ARCH.P[Math.min(ARCH.P.length - 1, k + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
      out.push([q[0] + dy / d * 4.2, q[1] - dx / d * 4.2]); inn.push([q[0] - dy / d * 4.2, q[1] + dx / d * 4.2]);
    });
    for (i = 0; i < N; i++) {
      var u = (i + 0.5) / N, q = archAt(u), side = u < 0.5 ? u : 1 - u, wv = 1 + 0.2 * M.wave(t, 1, -side * 2), open = 1;
      if (tp >= 0) open = coilSpring(M.seg(tp, side * 2 * 0.4, side * 2 * 0.4 + 0.55));
      var sz = 1 + 0.25 * Math.sin(PI * u);
      p.at(q[0] + q[2] * 4, q[1] + q[3] * 4, Math.atan2(q[3], q[2]) + PI / 2 + (1 - Math.min(1, open)) * (u < 0.5 ? 1.2 : -1.2), [Math.max(0.1, open) * sz, Math.max(0.12, open) * sz * wv], function () {
        p.path(petalD(15, 5.6, 0.9), { fill: 'a', w: 0.8 });
        p.path(petalD(8.5, 2.6, 0.5), { fill: i % 2 ? 'b' : 'c', w: 0.4, detail: true });
      });
    }
    p.poly(out.concat(inn.slice().reverse()), { fill: 'b', w: 0.9 });
    p.curve(inn.map(function (q) { return [q[0] + (50 - q[0]) * 0.06, q[1] + (60 - q[1]) * 0.02]; }), { ink: 'a', w: 0.45, detail: true });
    for (i = 0; i < 9; i++) { var q2 = archAt((i + 0.5) / 9); p.dot(q2[0], q2[1], 1.5, 'a'); }
    p.rect(14, 90, 72, 7, { fill: 'a', r: 2, w: 0.9 }); p.rect(10, 96, 80, 3, { fill: 'cream', w: 0.6, detail: true });
    p.line(24, 90, 24, 94, { w: 0.9 }); p.line(76, 90, 76, 94, { w: 0.9 });
    var fl = tp >= 0 ? M.bump(M.seg(tp, 0.5, 0.95)) : 0;
    p.at(50, 14, 0.1 * M.wave(t, 1, 0.2), 1 + 0.25 * fl, function () { flame(p, { x: 0, y: 0, L: 17, a: 0, T: 0, u0: 0.9, sw: 0.25 * M.wave(t, 1, 0.3), W: 4.2, fill: 'a', w: 0.8 }); });
    var g = M.frac(t), q3 = archAt(g);
    glint(p, q3[0] + q3[2] * 11, q3[1] + q3[3] * 11, M.bump(M.seg(g, 0, 1)) * 0.9 + fl, 10);
  }
});

/* kranok-corner: a corner for the top left of a box (turn or flip it for the others). Two sam tua rise from the jewel at the corner and
   sweep along the rules, tips curling in toward the box; a glint runs out along the rules. Tap: the flames sink into their cups
   and spring up again, the top one first. */
D.add('kranok-corner', {
  fam: 'lai', tags: ['kranok', 'corner', 'frame', 'border', 'box', 'flame', 'scroll', 'thai', 'gold', 'กระหนก', 'ลายไทย'], loop: 3.6, ratio: 1, still: 0.3, tapLen: 2, tapRest: 0.95, burst: 'star', burstAt: [26, 26], burstN: 6, burstSpread: 2.2, margin: [8, 8, 8, 8],
  about: 'two nested flames sweep out from a jewel along the rules of a box, their tips curling in, a glint running out along the rules', tapAbout: 'the flames sink into their cups and spring up again, the top one first',
  draw: function (p, t, s) {
    var tp = s.tap, arm, lead;
    p.path('M96 8 L8 8 L8 96', { w: 1.1, cap: 'round' });
    p.dot(96, 8, 2.6, 'a'); p.dot(8, 96, 2.6, 'a');
    for (arm = 0; arm < 2; arm++) {
      p.at(0, 0, arm ? PI / 2 : 0, arm ? [1, -1] : 1, function () {
        lead = arm ? 0.06 : 0;
        var op = [0, 1, 2].map(function (k) { return tp >= 0 ? coilSpring(M.seg(tp, arm * 0.1 + k * 0.05, arm * 0.1 + k * 0.05 + 0.65)) : 1; });
        samTua(p, { x: 28, y: 28, rot: PI / 2, sc: 0.74, ph: lead, t: t, open: op });
        var hg = 1.2 * M.seg(t - lead, 0.02, 0.6), hd = Math.min(1, hg), tl = Math.max(0, hg - 0.2);
        p.span('M8 8 L96 8', tl, hd, { w: 1.5, ink: 'a', cap: 'round' });
      });
    }
    p.circle(15, 15, 8.4, { fill: 'b', w: 0.9 }); p.circle(15, 15, 4.4, { fill: 'a', w: 0.6 }); p.circle(15, 15, 1.7, { fill: 'white', line: false });
  }
});
})(Dingbats);
