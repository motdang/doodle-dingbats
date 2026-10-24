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
