/* Thai: the nagas of the stair and the river, the unalom yant, and the Asian elephant, chang, in its poses. */
(function (D) {
'use strict';
var M = D.math, TAU = M.TAU;

/* ---------------------------------------------------------------- helpers */
/* points along a cubic, for spines of things that bend: nagas, trunks, tails */
function bez(a, b, c, d, n) {
  var o = [], i, u, v;
  for (i = 0; i <= n; i++) { u = i / n; v = 1 - u; o.push([v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0], v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1]]); }
  return o;
}
/* a smooth line through hand-placed points, per samples to each span */
function cr(pts, per) {
  var out = [], n = pts.length, i, k, a, b, c, d, u, u2, u3;
  for (i = 0; i < n - 1; i++) {
    a = pts[Math.max(0, i - 1)]; b = pts[i]; c = pts[i + 1]; d = pts[Math.min(n - 1, i + 2)];
    for (k = 0; k < per; k++) {
      u = k / per; u2 = u * u; u3 = u2 * u;
      out.push([0.5 * (2 * b[0] + (c[0] - a[0]) * u + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * u2 + (3 * b[0] - a[0] - 3 * c[0] + d[0]) * u3),
                0.5 * (2 * b[1] + (c[1] - a[1]) * u + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * u2 + (3 * b[1] - a[1] - 3 * c[1] + d[1]) * u3)]);
    }
  }
  out.push([pts[n - 1][0], pts[n - 1][1]]);
  return out;
}
/* points as path data */
function pl(a) { var s = 'M' + a[0][0].toFixed(2) + ' ' + a[0][1].toFixed(2), i; for (i = 1; i < a.length; i++) s += 'L' + a[i][0].toFixed(2) + ' ' + a[i][1].toFixed(2); return s; }
function mix(a, b, u) { return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; }
/* a wavy line of points, the wave sliding along as ph runs 0 → 1 */
function sinew(x0, x1, y, amp, lam, ph) { var a = [], x; for (x = x0; x <= x1 + 0.1; x += 4) a.push([x, y + amp * Math.sin(TAU * ((x - x0) / lam - ph))]); return a; }
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
/* a column along a spine, wf(u) wide at u in 0..1: the fill with no line, then the outline as one open stroke
   that leaves the root open, so a leg or a trunk grows out of what it is drawn over and does not sit on it.
   end 'round' (a trunk, a tail), 'flat' (a foot: a broad sole with softened corners), 'none'; o.fill, o.w.
   Returns the two edges. */
function column(p, sp, wf, o) {
  var n = sp.length, L = [], R = [], i, a, b, d, h, nx, ny, cap = [], k, e, a0, fd, end = o.end || 'round', f = o.fill, edge;
  for (i = 0; i < n; i++) {
    a = sp[Math.max(0, i - 1)]; b = sp[Math.min(n - 1, i + 1)]; d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; h = wf(i / (n - 1)) / 2;
    nx = -(b[1] - a[1]) / d; ny = (b[0] - a[0]) / d;
    L.push([sp[i][0] + nx * h, sp[i][1] + ny * h]); R.push([sp[i][0] - nx * h, sp[i][1] - ny * h]);
  }
  e = sp[n - 1];
  if (end === 'round') {
    h = wf(1) / 2; a0 = Math.atan2(L[n - 1][1] - e[1], L[n - 1][0] - e[0]);
    for (k = 1; k < 6; k++) cap.push([e[0] + Math.cos(a0 - Math.PI * k / 6) * h, e[1] + Math.sin(a0 - Math.PI * k / 6) * h]);
  } else if (end === 'flat') {
    a = sp[n - 2]; d = Math.hypot(e[0] - a[0], e[1] - a[1]) || 1; fd = [(e[0] - a[0]) / d, (e[1] - a[1]) / d];
    [[0.13, 0.55], [0.5, 0.95], [0.87, 0.55]].forEach(function (q) { var m = mix(L[n - 1], R[n - 1], q[0] === 0.5 ? 0.5 : q[0]); cap.push([m[0] + fd[0] * q[1] * (o.sole == null ? 1 : o.sole), m[1] + fd[1] * q[1] * (o.sole == null ? 1 : o.sole)]); });
  }
  edge = L.concat(cap, R.slice().reverse());
  if (f) p.path(pl(edge) + 'Z', { fill: f, line: false });
  if (o.w !== 0) p.path(pl(edge), { w: o.w == null ? 0.95 : o.w, wob: o.wob == null ? 1 : o.wob });
  return { L: L, R: R, sp: sp };
}
/* two-bone leg: the knee between a hip and an ankle for thigh a and shin b; bend +1 puts it forward (right), -1 back */
function knee(h, k, a, b, bend) {
  var dx = k[0] - h[0], dy = k[1] - h[1], d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, x, hh;
  if (d >= a + b - 0.05) return [h[0] + ux * a * (d / (a + b)), h[1] + uy * a * (d / (a + b))];
  x = (a * a - b * b + d * d) / (2 * d); hh = Math.sqrt(Math.max(0, a * a - x * x));
  return [h[0] + ux * x + uy * hh * bend, h[1] + uy * x - ux * hh * bend];
}

/* ---------------------------------------------------------------- chang, the elephant
   One animal for every pose. Everything is drawn in the standing elephant's own coordinates (facing right,
   feet on y = 90, shoulder at y = 34): the body, a head on its neck, the trunk and ear and tail on the head and
   rump, four legs. A pose moves them: the body shifts and tilts (bx by bt), the head nods about the neck (ha, hd),
   each leg is a hip on the body and an ankle in the box, the trunk is a line through points.
   An Asian elephant: a domed head with two bumps, small round ears, a back that arches in the middle, one
   finger at the trunk's tip, five toenails on the front feet and four behind, a tail with a tuft. */
var G = 90, GREY = 'grey', DARK = '#8E949C', NAIL = 'cream', PX = 52, PY = 52, NX = 79, NY = 48;
var BODY = 'M71 37 C62 31 46 29.5 36 33 C27 36.5 21 43 21.5 51 C22 59 28 64 37 63.5 C47 65.5 58 65.5 68 63.5 C77 62 82 55 80.5 46 C79.5 41 76 38.5 71 37 Z';
var HEAD = 'M77.5 41 C76.5 32 82 26 89.5 26 C93 26 95.5 27.5 97 30 C99.5 34 100 41 99 47 C98.5 50 97.5 53 96 56 C92 60.5 84.5 59.5 81 55 C78.5 51.5 77.8 46 77.5 41 Z';
var EAR = 'M80 33.5 C74 29.5 66 33 65 41 C64 48 67.5 54 73 54.5 C77 54 78 50 78.5 46 C79.3 41 80 37.5 80 33.5 Z';

/* body-local standing coordinates to the box, given the body's shift and tilt */
function fromBody(o, x, y) {
  var c = Math.cos(o.bt || 0), s = Math.sin(o.bt || 0), dx = x - PX, dy = y - PY;
  return [PX + dx * c - dy * s + (o.bx || 0), PY + dx * s + dy * c + (o.by || 0)];
}
/* one leg. l: hip (body-local), ank (box), fa the foot's angle (0 straight down, + toes forward), len (the leg's length
   hip to ankle when straight), knee (to override the two-bone knee), sp (the spine in box points, to override all of it:
   a folded leg), far, w0 w1 */
function chLeg(p, o, l) {
  var fa = l.fa || 0, fl = l.fl == null ? 4.6 : l.fl, fd = [Math.sin(fa), Math.cos(fa)], a, h, k, sp, end, w0 = l.w0 || 14, w1 = l.w1 || 10.6;
  if (l.sp) { a = l.sp[l.sp.length - 1]; end = [a[0] + fd[0] * fl, a[1] + fd[1] * fl]; sp = l.sp.concat([end]); }
  else { h = fromBody(o, l.hip[0], l.hip[1]); a = l.ank; k = l.knee || knee(h, a, (l.len || 30) / 2, (l.len || 30) / 2, l.bend == null ? 1 : l.bend); end = [a[0] + fd[0] * fl, a[1] + fd[1] * fl]; sp = cr([h, k, a, end], 7); }
  var ls = sp.length, col = column(p, sp, function (u) { return u > 0.88 ? w1 + 1.7 * (u - 0.88) / 0.12 : w0 + (w1 - w0) * Math.pow(u / 0.88, 0.8); }, { end: 'flat', fill: l.far ? DARK : (o.fill || GREY), w: 0.95 });
  var nn = l.nails == null ? 3 : l.nails;
  if (!p.small && nn) {
    var q = col.R[ls - 1], r = col.L[ls - 1], m, j;
    for (j = 0; j < nn; j++) { m = mix(q, r, 0.1 + j * 0.21); p.at(m[0] + fd[0] * 0.3, m[1] + fd[1] * 0.3, fa, 1, function () { p.path('M-1.5 0.1 C-1.5 -1.6 1.5 -1.6 1.5 0.1 C1.2 1 -1.2 1 -1.5 0.1 Z', { fill: NAIL, w: 0.35 }); }); }
  }
}
/* a point in the head's own coordinates, in the box */
function headPt(o, x, y) {
  var c = Math.cos(o.ha || 0), s = Math.sin(o.ha || 0), k = o.hk || 1, dx = x + (o.hx || 0) - NX, dy = y + (o.hy || 0) - NY;
  return fromBody(o, NX + (dx * c - dy * s) * k, NY + (dx * s + dy * c) * k);
}
/* the same spine of points a second time, resampled to n points evenly along it, for blending one pose of a leg into another */
function even(sp, n) {
  var d = [0], i, L, out = [], k, j = 0, u, f;
  for (i = 1; i < sp.length; i++) d.push(d[i - 1] + Math.hypot(sp[i][0] - sp[i - 1][0], sp[i][1] - sp[i - 1][1]));
  L = d[sp.length - 1] || 1;
  for (k = 0; k < n; k++) { u = L * k / (n - 1); while (j < sp.length - 2 && d[j + 1] < u) j++; f = (u - d[j]) / ((d[j + 1] - d[j]) || 1); out.push([sp[j][0] + (sp[j + 1][0] - sp[j][0]) * f, sp[j][1] + (sp[j + 1][1] - sp[j][1]) * f]); }
  return out;
}
function blend(a, b, u) { return a.map(function (q, i) { return [q[0] + (b[i][0] - q[0]) * u, q[1] + (b[i][1] - q[1]) * u]; }); }
function chHead(p, o) {
  var eye = o.eye || 0, mo = o.mouth || 0, ea = o.earA || 0, sx = o.ear == null ? 1 : o.ear, ek = o.earK || 1, ey = o.earY || 0, tr = o.trunk, fill = o.fill || GREY, k, u, er = o.eyeK || 1;
  /* the far ear shows a sliver behind the near one, darker */
  if (sx > 0) p.pivot(80, 36, -0.1 + ea * 0.5, [Math.max(0.3, sx * 0.85) * ek, ek], function () { p.path(EAR, { fill: DARK, w: 0.8 }); });
  p.path(HEAD, { fill: fill, w: 1 });
  /* the two domes of the forehead, the dip between them */
  p.path('M88 27.4 C89.4 29.6 89.4 31.6 88.2 33.4', { w: 0.45, detail: true });
  if (o.tuft) { p.path('M84.6 26.6 C83.6 24 83 22.4 82 21.6', { w: 0.5, ink: 'brown' }); p.path('M87.4 25.8 C87.4 23 87.2 21 86.6 19.6', { w: 0.5, ink: 'brown' }); p.path('M90.4 25.8 C91 23.4 92 21.8 93.2 21', { w: 0.5, ink: 'brown' }); p.path('M93 27 C94.4 25.4 95.8 24.6 97.2 24.4', { w: 0.5, ink: 'brown' }); p.path('M82 28.6 C80.4 26.6 79 26 77.6 26', { w: 0.45, ink: 'brown' }); }
  /* the trunk grows from the face */
  if (tr) {
    var sp = cr(tr, 5), n = sp.length, rw = o.trunkW || 10.4, tw = o.tipW || 3.4, wf = function (v) { return tw + (rw - tw) * Math.pow(1 - v, 0.85); };
    var cl = column(p, sp, wf, { end: 'round', fill: fill, w: 1 });
    if (!p.small) {
      for (k = 3; k < n - 3; k += 3) { u = k / (n - 1); var a = cl.L[k], b = cl.R[k]; p.line(a[0] * 0.78 + b[0] * 0.22, a[1] * 0.78 + b[1] * 0.22, a[0] * 0.28 + b[0] * 0.72, a[1] * 0.28 + b[1] * 0.72, { w: 0.35, detail: true }); }
      var e = sp[n - 1], f = sp[n - 3]; p.dot(e[0] * 0.8 + f[0] * 0.2, e[1] * 0.8 + f[1] * 0.2, 0.7, 'ink');
    }
  }
  if (o.tusk !== false) p.path('M94.6 54.2 C97.6 60.2 104.2 60.4 106.8 54.2 C103 57.4 99.6 56.8 98.2 52.4 Z', { fill: 'white', w: 0.65 });
  /* the mouth, shut as a small smile under the trunk, or open to trumpet */
  if (mo > 0.05) p.path('M93 57.5 C96.5 56.5 99 58 98.6 61 C97 64.5 91.5 65 88.5 62 C88 60 90 58.4 93 57.5 Z', { fill: 'rose', w: 0.7 }); else p.path('M93.6 57.4 C91.4 58.2 88.6 57.6 86.6 55.4', { w: 0.55, detail: true });
  /* the eye: a small dark one, set low on the face under a heavy brow, with its lashes; shut it is a curve; between, a lid comes down */
  var eyeAt = function () {
    if (eye > 0.92) { p.path('M87.8 40.4 C89.4 42.6 92.4 42.6 94 40.2', { w: 0.8 }); if (!p.small) { p.line(88, 40.9, 86.6, 42.3, { w: 0.4 }); p.line(93.9, 40.7, 95.1, 42.1, { w: 0.4 }); } return; }
    p.dot(91, 40.6, 1.55 * er, 'ink');
    if (!p.small) p.dot(91.5 + 0.2 * er, 40.1 - 0.2 * er, 0.45 * er, 'white');
    if (eye > 0.05) { var yl = 38.4 + 4.4 * eye; p.path('M87.4 ' + yl + ' C89.4 ' + (yl - 1.2) + ' 93 ' + (yl - 1.2) + ' 94.8 ' + yl + ' L94.8 36 L87.4 36 Z', { fill: fill, line: false }); p.path('M87.6 ' + yl + ' C89.6 ' + (yl + 0.9) + ' 92.6 ' + (yl + 0.9) + ' 94.6 ' + yl, { w: 0.6 }); }
    if (!p.small) p.path('M87.6 38.4 C89.4 36.7 93 36.8 94.6 38.8', { w: 0.45 });
  };
  /* the near ear: small and round, hinged along the back of the head, its rim turned over; thrown forward (a negative width) it covers the face */
  var earAt = function () {
    p.pivot(80, 36, ea * 0.6, [sx * ek, ek], function () {
      p.move(0, ey / ek);
      p.path(EAR, { fill: fill, w: 0.95 });
      p.path('M79.4 36 C74.6 33 68.4 36 67.6 42.4', { w: 0.45, detail: true });
      p.path('M74 50 C71.6 48 70.4 45 70.6 43', { w: 0.35, detail: true, ink: DARK });
      if (sx < 0) p.path('M72 43 C74 46 74 50 72 52', { w: 0.4, detail: true, ink: 'rose' });
    });
  };
  if (o.eyeOver) { earAt(); eyeAt(); } else { eyeAt(); earAt(); }
}
/* the whole animal. o: bx by bt (body), hx hy ha hk (head offset, angle, scale about the neck), ear earA, eye mouth, trunk, tail (swing),
   legs (list of chLeg specs), tusk */
function chang(p, o) {
  var legs = o.legs || [], i, tl = o.tail || 0, fill = o.fill || GREY;
  /* the tail hangs from the rump behind everything */
  if (o.tailBox) {
    var tb = cr(o.tailBox, 5), te = tb[tb.length - 1], tf = tb[tb.length - 3];
    column(p, tb, function (u) { return 3.4 - 1.5 * u; }, { end: 'round', fill: fill, w: 0.8 });
    p.at(te[0], te[1], Math.atan2(te[1] - tf[1], te[0] - tf[0]) - Math.PI / 2, 1, function () { p.path('M-2.4 -1 C-3.6 2.4 -2.8 6 0 8.6 C2.8 6 3.6 2.4 2.4 -1 Z', { fill: 'black', w: 0.5 }); });
  }
  p.push(); p.move(o.bx || 0, o.by || 0);
  p.pivot(PX, PY, o.bt || 0, 1, function () {
    if (!o.tailBox) p.pivot(22, 47, tl, 1, function () {
      var sp = cr([[22, 46], [15, 55], [14.5, 65], [17, 74]], 5);
      column(p, sp, function (u) { return 3.4 - 1.5 * u; }, { end: 'round', fill: fill, w: 0.8 });
      p.path('M15.6 72 C13 75.4 13.8 79.6 16.4 82 C19.2 79.6 20 75.4 18.4 72 Z', { fill: 'black', w: 0.5 });
    });
  });
  p.pop();
  legs.forEach(function (l) { if (l.far) chLeg(p, o, l); });
  p.push(); p.move(o.bx || 0, o.by || 0);
  p.pivot(PX, PY, o.bt || 0, 1, function () {
    p.path(BODY, { fill: fill, w: 1 });
    if (!p.small) {
      p.path('M28 44 C25 52 26 60 32 64', { w: 0.4, detail: true, ink: DARK });
      p.path('M60 46 C64 52 66 58 65 64', { w: 0.4, detail: true, ink: DARK });
      p.path('M43 36.6 C45 37.4 47 37.4 49 36.6', { w: 0.35, detail: true, ink: DARK });
    }
  });
  p.pop();
  legs.forEach(function (l) { if (!l.far) chLeg(p, o, l); });
  p.push(); p.move(o.bx || 0, o.by || 0);
  p.pivot(PX, PY, o.bt || 0, 1, function () {
    p.pivot(NX, NY, o.ha || 0, o.hk || 1, function () { p.move(o.hx || 0, o.hy || 0); chHead(p, o); });
  });
  p.pop();
}

/* ---------------------------------------------------------------- chang-walk */
/* a trunk hanging from the face, swinging; sw is the sway, ph its lag along the length */
function hang(sw, bend) { return [[96, 48], [102 + 2 * sw, 58], [103 + 5 * sw + (bend || 0), 71], [101 + 8 * sw + (bend || 0) * 1.6, 83]]; }

D.add('chang-walk', {
  fam: 'thai', tapRest: 0.45, tags: ['elephant', 'chang', 'walk', 'amble', 'sanctuary', 'trunk', 'animal', 'thailand', 'chiang mai', 'ช้าง', 'เดิน'], loop: 2.8, still: 0.1, ratio: 1.2, tapLen: 2, burst: false, tapMargin: [30, 20, 10, 20],
  margin: [22, 14, 12, 18], about: 'a slow, heavy walk in the elephant\'s own gait: each hind foot then the fore foot on its side; the body bobs, the head nods, the trunk and tail swing after',
  tapAbout: 'it stops, lifts its trunk to look at you and trumpets, then ambles on',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, duty = 0.7, A = 8.4, q = s.tap, stop = 0, lift = 0, i;
    if (q >= 0) { stop = ez(seg(q, 0, 0.18)) * (1 - ez(seg(q, 0.8, 1))); lift = ez(seg(q, 0.12, 0.3)) * (1 - ez(seg(q, 0.74, 0.9))); }
    var go = 1 - stop, bob = 0.8 * M.wave(t, 4, 0.12) * go - 0.4 * stop, sw = M.wave(t, 1, 0.1), sway = (M.wave(t, 1, 0) - 0) * go;
    var spec = [[31, 0, false, 33], [68, 0.25, false, 32], [38, 0.5, true, 33], [60, 0.75, true, 32]];
    var legs = spec.map(function (c, j) {
      var u = M.frac(t - c[1]), st = u < duty, v = st ? 0 : (u - duty) / (1 - duty), x, lf, fa;
      if (st) x = A - 2 * A * (u / duty); else x = -A + 2 * A * ez(v);
      lf = st ? 0 : 7 * M.bump(v); fa = st ? 0 : (-0.5 + 0.9 * v) * Math.pow(M.bump(v), 0.6);
      x *= go; lf *= go; fa *= go;
      return { hip: [c[0], 54], ank: [c[0] + x + (j < 2 ? 0 : 0), G - 4.6 - lf], fa: fa, len: c[3], far: c[2], w0: 14.5 };
    });
    /* the ground slides back at the foot's pace; its marks shrink at the edges */
    if (!p.small) for (i = 0; i < 6; i++) {
      var gx = ((i * 24 - 24 * t * go) % 144 + 144) % 144 - 12, e = Math.min(M.seg(gx, -10, 6), M.seg(132, gx, 112));
      if (e > 0.02) p.line(gx - 4 * e, G + 3.4 + (i % 2) * 2.4, gx + 4 * e, G + 3.4 + (i % 2) * 2.4, { w: 0.5, ink: 'brown', cap: 'round' });
    }
    p.ellipse(56, G + 1, 44, 3, { fill: 'smoke', line: false, alpha: 0.5 });
    var trk = hang(sw * 0.9 * go, 0).map(function (pt, j) { return j === 0 ? pt : [M.lerp(pt[0], [100, 106, 112, 114][j] , lift), M.lerp(pt[1], [48, 36, 22, 12][j], lift)]; });
    var wo = { bx: 0, by: bob, bt: 0.012 * M.wave(t, 2, 0.2) * go - 0.02 * lift, legs: legs, ha: 0.03 * M.wave(t, 2, 0.05) * go - 0.06 * lift, hy: 0, ear: 0.82 + 0.16 * M.wave(t, 2, 0.15) - 0.25 * lift, earA: 0.1 * M.wave(t, 2, 0.15), trunk: trk, tail: 0.18 * M.wave(t, 1, 0.3) + 0.06 * M.wave(t, 3), mouth: lift > 0.5 ? lift : 0, eye: M.bump(seg(t, 0.52, 0.56)) };
    chang(p, wo);
    if (q >= 0 && !p.small) { var wt = headPt(wo, trk[3][0], trk[3][1]), wv = seg(q, 0.24, 0.74); if (wv > 0 && wv < 1) sound(p, wt[0] + 2, wt[1] + 1, wv, true); }
  }
});
/* ---------------------------------------------------------------- chang-calf */
/* the calf is the same animal drawn smaller and rounder: a bigger head and ears, a short trunk, legs set low and thick, a tuft of
   bristles on the forehead, no tusks. It walks in quick small steps, its trunk a noodle it cannot yet steer. */
function stub(pts, k) { var r = pts[0]; return pts.map(function (q, i) { return i ? [r[0] + (q[0] - r[0]) * k, r[1] + (q[1] - r[1]) * k] : q; }); }
D.add('chang-calf', {
  fam: 'thai', tapRest: 0.45, tags: ['elephant', 'calf', 'baby', 'chang', 'chang noi', 'trunk', 'trip', 'cute', 'animal', 'thailand', 'ลูกช้าง', 'ช้าง'], loop: 2.4, still: 0.2, ratio: 1.2, tapLen: 2.2, burst: 'heart', burstAt: [92, 34], burstN: 4, burstSpread: 2.4, burstDelay: 0.62,
  margin: [24, 14, 12, 14], about: 'a baby elephant pitter-patters along, its short trunk wobbling like a noodle; it steps on the tip of it, lurches forward, and catches itself',
  tapAbout: 'it flips both big ears over its face and peeks out over them, then flaps them back with a squeak',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, bump = M.bump, K = 0.8, duty = 0.62, A = 9, q = s.tap, i;
    /* the trip: the trunk drops, a front foot comes down on its tip, the head is pulled down, the body lurches, it springs free */
    var drop = ez(seg(t, 0.46, 0.58)) * (1 - ez(seg(t, 0.74, 0.8))), lurch = ez(seg(t, 0.6, 0.7)) * (1 - ez(seg(t, 0.7, 0.8))), recov = M.spring(seg(t, 0.8, 0.98)) - 1;
    var go = 1 - 0.8 * lurch;
    var hide = 0, peek = 0;
    if (q >= 0) { hide = ez(seg(q, 0, 0.2)) * (1 - ez(seg(q, 0.68, 0.8))); peek = bump(seg(q, 0.3, 0.6)); }
    var bobY = 1.2 * M.wave(t, 4, 0.12) * go;
    var spec = [[31, 0, false, 29], [68, 0.25, false, 28], [38, 0.5, true, 29], [60, 0.75, true, 28]];
    var legs = spec.map(function (c, j) {
      var u = M.frac(t - c[1]), st = u < duty, v = st ? 0 : (u - duty) / (1 - duty), x, lf, fa;
      if (st) x = A - 2 * A * (u / duty); else x = -A + 2 * A * ez(v);
      lf = st ? 0 : 6 * bump(v); fa = st ? 0 : (-0.5 + 0.9 * v) * Math.pow(bump(v), 0.6);
      x *= go; fa *= go;
      if (j === 1 && drop > 0.3) { x = M.lerp(x, 17, lurch); lf *= 1 - lurch; fa *= 1 - lurch; }
      return { hip: [c[0], 54], ank: [c[0] + x, G - 4.6 - lf], fa: fa, len: c[3], far: c[2], w0: 15, w1: 12, bend: 1 };
    });
    var sw = function (ph, a) { return a * M.wave(t, 2, ph); };
    var base = [[96, 49], [102 + sw(0.1, 1.2), 56], [103 + sw(0.2, 2.6), 62], [100 + sw(0.32, 4), 68]];
    var cur = [[96, 49], [104, 58], [101, 69], [88, 74]];
    var trk = base.map(function (pt, j) { return j ? [M.lerp(pt[0], cur[j][0], drop), M.lerp(pt[1], cur[j][1], drop)] : pt; });
    var ha = 0.04 * M.wave(t, 2, 0.1) + 0.3 * lurch + 0.05 * recov * 3, bt = 0.2 * lurch + 0.1 * recov;
    var up = 1 - hide;
    p.ellipse(58, G + 1, 40, 3, { fill: 'smoke', line: false, alpha: 0.5 });
    p.pivot(58, G, 0, K, function () {
      chang(p, { bx: 0, by: 6 + bobY + 2.5 * lurch, bt: bt, legs: legs, ha: ha, hk: 1.22, hy: 0, ear: M.lerp(-0.9, 0.86 + 0.14 * M.wave(t, 2, 0.15), up) + 0.12 * peek * M.wave(q < 0 ? 0 : q, 6), earA: 0.1 * M.wave(t, 2, 0.15), earK: 1.4, earY: 12.5 * hide, eyeOver: hide > 0.3, eyeK: 1.45, eye: M.bump(seg(t, 0.3, 0.34)) + 0.3 * lurch, tuft: true, tusk: false, trunk: trk, trunkW: 9.6, tipW: 3.6, tail: 0.3 * M.wave(t, 2, 0.3), mouth: 0 });
    });
  }
});

/* ---------------------------------------------------------------- chang-salute */
/* the trunk raised in an S, the near front foot lifted and bent: the greeting at the gate of a sanctuary. */
var UP = [[96, 47.5], [104.5, 43.5], [108.5, 33], [106, 22], [103.5, 14], [106.5, 8]];
function sound(p, x, y, u, big) {
  /* arcs leaving the trunk's tip, each drawn and then taken back */
  [0, 1, 2].forEach(function (i) {
    var v = M.seg(u, i * 0.16, 0.5 + i * 0.16), r = (6 + 6 * i) * (big ? 1.25 : 1), a0 = -0.62 - 0.1 * i, a1 = 0.62 + 0.1 * i;
    if (v <= 0 || v >= 1) return;
    var w0 = a0 + (a1 - a0) * M.easeIn(M.seg(v, 0.45, 1)), w1 = a0 + (a1 - a0) * M.easeOut(M.seg(v, 0, 0.6));
    if (w1 - w0 > 0.05) p.arc(x, y, r, w0, w1, { w: 0.8, ink: 'a', cap: 'round' });
  });
}
D.add('chang-salute', {
  fam: 'thai', tapRest: 0.4, tags: ['elephant', 'chang', 'salute', 'trumpet', 'greeting', 'raised trunk', 'luck', 'animal', 'thailand', 'ช้าง', 'ทักทาย'], loop: 2.4, still: 0.3, ratio: 1.2, tapLen: 2, burst: false, tapMargin: [30, 24, 10, 14],
  margin: [26, 14, 12, 14], about: 'the trunk raised in an S with its tip curling, the near front foot lifted and swaying, the ears fanning; a call rings out of the trunk now and again',
  tapAbout: 'it trumpets: head up, mouth open, the trunk straight to the sky, rings of sound, and the lifted foot stamps down once in a puff of dust',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, bump = M.bump, q = s.tap, tr = 0, stomp = 0, i;
    if (q >= 0) { tr = ez(seg(q, 0, 0.16)) * (1 - ez(seg(q, 0.74, 0.96))); stomp = bump(seg(q, 0.22, 0.46)); }
    var call = bump(seg(t, 0.42, 0.7)), lead = function (k) { return M.wave(t, 1, -k); };
    var rock = 0.014 * M.wave(t, 1, 0.1), by = 0.45 * M.wave(t, 2, 0.2);
    var trunk = UP.map(function (pt, j) {
      var k = j / (UP.length - 1), cl = j ? [[0, 0], [106, 41], [109, 30], [108, 19], [107, 11], [107, 4]][j] : pt;
      return [M.lerp(pt[0], cl[0] || pt[0], tr) + 1.7 * k * lead(0.1 + k * 0.22) - 1.2 * k * tr * M.wave(M.clamp(q, 0, 1), 3), M.lerp(pt[1], cl[1] || pt[1], tr) + 1.2 * k * M.wave(t, 2, -k * 0.25) * (1 - tr)];
    });
    var hip = fromBody({ bx: 0, by: by, bt: rock }, 68, 54);
    var fa = 0.32 * M.wave(t, 2, 0.1) - 0.2 * stomp, drop = stomp;
    var ank = [M.lerp(hip[0] + 12 + 2 * M.wave(t, 2, -0.05), 72, drop), M.lerp(hip[1] + 18 + 1.2 * M.wave(t, 2, 0.1), G - 4.6, ez(seg(q, 0.3, 0.42)) * (1 - ez(seg(q, 0.42, 0.52))))];
    if (q < 0) drop = 0;
    var legs = [
      { hip: [31, 54], ank: [31, G - 4.6], len: 33, w0: 14.5 },
      { hip: [68, 54], ank: ank, knee: [hip[0] + 13.5, hip[1] + 4 + 0.8 * M.wave(t, 2, 0.05)], fa: fa, len: 32, w0: 14.5, bend: 1 },
      { hip: [38, 54], ank: [38, G - 4.6], len: 33, far: true, w0: 14.5 },
      { hip: [60, 54], ank: [60, G - 4.6], len: 32, far: true, w0: 14.5 }
    ];
    p.ellipse(56, G + 1, 44, 3, { fill: 'smoke', line: false, alpha: 0.5 });
    var o = { bx: 0, by: by + 0.8 * stomp - 0.6 * tr, bt: rock - 0.035 * tr, legs: legs, ha: -0.03 * tr + 0.03 * M.wave(t, 1, 0.3), ear: 0.76 + 0.2 * M.wave(t, 3, 0.12) - 0.3 * tr, earA: 0.12 * M.wave(t, 3, 0.12), trunk: trunk, tail: 0.2 * M.wave(t, 1, 0.4) + 0.08 * M.wave(t, 3), mouth: Math.max(tr, call * 0.55), eye: M.bump(seg(t, 0.9, 0.94)) };
    chang(p, o);
    var tip = headPt(o, trunk[trunk.length - 1][0], trunk[trunk.length - 1][1]);
    if (!p.small) {
      if (tr > 0.05) sound(p, tip[0] + 2, tip[1] + 1, M.clamp(seg(q, 0.05, 0.7), 0, 1), true);
      else if (call > 0.02) sound(p, tip[0] + 2, tip[1] + 1, seg(t, 0.42, 0.7), false);
      var du = seg(q, 0.3, 0.9);
      if (q >= 0 && du > 0 && du < 1) for (i = 0; i < 3; i++) { var dd = M.easeOut(du), sz = (2.2 + i) * (1 - du * 0.7); p.circle(M.lerp(70, 70 + (i - 1) * 15, dd), G + 1 - 6 * dd * (1 + i % 2) * (1 - du), sz, { ink: 'stone', w: 0.5, alpha: 1 - du * 0.3 }); }
    }
  }
});

/* ---------------------------------------------------------------- chang-kneel */
/* the front legs folded and the elephant lowered onto its knees, the hind legs still standing: how it comes down for a bath or a rest.
   It kneels, stays with its trunk curled on the ground, and gets up again. */
function frontSp(o, hipX, ank, k, far) {
  var h = fromBody(o, hipX, 54), kn = knee(h, ank, 16, 16, 1), stand = even(cr([h, kn, ank], 8), 12);
  var K = [h[0] + 11 - (far ? 7 : 0), G - 5], fold = even(cr([h, [h[0] + 6, h[1] + 12], [K[0] + 1, K[1] - 5], [K[0] - 1, K[1] + 1], [K[0] - 9, G - 3.4], [K[0] - 18, G - 4.2]], 6), 12);
  return blend(stand, fold, k);
}
D.add('chang-kneel', {
  fam: 'thai', tapRest: 0.4, tags: ['elephant', 'chang', 'kneel', 'bow', 'rest', 'lower', 'animal', 'thailand', 'ช้าง', 'คุกเข่า'], loop: 6, still: 0.45, ratio: 1.2, tapLen: 2, burst: 'heart', burstAt: [96, 30], burstN: 3, burstSpread: 2.2, burstDelay: 0.4,
  margin: [22, 18, 10, 18], about: 'it lowers itself onto folded front knees, rump up, lays its trunk on the ground with the tip curling, breathes, blinks, and rises again',
  tapAbout: 'a deep bow: it sinks lower, the trunk curls up in a flourish, the eyes close',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, bump = M.bump, q = s.tap, bow = 0;
    var k = ez(seg(t, 0.06, 0.3)) * (1 - ez(seg(t, 0.7, 0.94)));
    if (q >= 0) bow = ez(seg(q, 0, 0.3)) * (1 - ez(seg(q, 0.7, 1)));
    var br = 0.55 * M.wave(t, 5, 0.1) * k, kk = Math.min(1, k + 0.0);
    var o = { bx: 0, by: 7.5 * k + br + 2.2 * bow, bt: 0.17 * k + 0.05 * bow, ha: -0.15 * k - 0.04 * bow, fill: GREY };
    var hindA = function (x) { return [x, G - 4.6]; };
    var near = frontSp(o, 68, [71, G - 4.6], k, false), farS = frontSp(o, 60, [60, G - 4.6], k, true);
    o.legs = [
      { hip: [31, 54], ank: hindA(31), len: 34, w0: 14.5 },
      { sp: near, fa: M.lerp(0, -1.5, k), w0: 14.5, nails: k > 0.5 ? 0 : 3 },
      { hip: [38, 54], ank: hindA(39), len: 34, far: true, w0: 14.5 },
      { sp: farS, fa: M.lerp(0, -1.5, k), far: true, w0: 14.5, nails: k > 0.5 ? 0 : 3 }
    ];
    var stand = [[96, 48], [102 + 1.5 * M.wave(t, 1, 0.1), 58], [103 + 4 * M.wave(t, 1, 0.2), 70], [101 + 6 * M.wave(t, 1, 0.3), 82]];
    var rest = [[96, 49.5], [104, 58], [109.5, 66], [113.5, 72 - 0.4 * M.wave(t, 2)], [118.5, 70 - 5 * (1 + M.wave(t, 1, 0.1)) / 2 - 3 * bow]];
    var tr = rest.map(function (pt, j) { var a = stand[Math.min(j, 3)]; return [M.lerp(a[0], pt[0], k), M.lerp(a[1], pt[1], k)]; });
    o.trunk = tr;
    o.ear = 0.8 + 0.15 * M.wave(t, 2, 0.15); o.earA = 0.08 * M.wave(t, 2, 0.15) * (1 - 0.5 * k);
    o.eye = Math.max(M.bump(seg(t, 0.4, 0.44)), M.bump(seg(t, 0.55, 0.585)), bow); o.tail = 0.16 * M.wave(t, 2, 0.3) + 0.1 * M.wave(t, 3);
    p.ellipse(56, G + 1, 46, 3, { fill: 'smoke', line: false, alpha: 0.5 });
    chang(p, o);
  }
});

/* ---------------------------------------------------------------- chang-sit */
/* sitting back on its haunches: the hind legs stretched forward along the ground, the front legs straight, the chest up. */
D.add('chang-sit', {
  fam: 'thai', tapRest: 0.2, tags: ['elephant', 'chang', 'sit', 'haunches', 'rest', 'animal', 'thailand', 'ช้าง', 'นั่ง'], loop: 3.2, still: 0.25, ratio: 1.2, tapLen: 1.8, burst: false,
  margin: [20, 16, 10, 16], about: 'sitting back on its haunches, the chest rising and falling, the head turning, the trunk swinging; now and again it shifts a front foot',
  tapAbout: 'the trunk slaps down beside it twice, thump thump, in a puff of dust, as if asking you to sit',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, bump = M.bump, q = s.tap, i, sl = 0;
    var o = { bx: 0, by: 17.5 + 0.5 * M.wave(t, 1, 0.1), bt: -0.42 + 0.012 * M.wave(t, 1, 0.1), ha: 0.3 + 0.06 * M.wave(t, 1, 0.35), fill: GREY };
    var H = [fromBody(o, 31, 54), fromBody(o, 38, 54)], pad = G - 4.4;
    var hind = function (h, dx, dy, far) { return { sp: even(cr([h, [h[0] + 12 + dx, h[1] + 4 + dy], [h[0] + 24 + dx, G - 7 + dy], [h[0] + 34 + dx, pad + dy]], 6), 12), fa: 1.45, far: far, w0: 14, w1: 11, nails: 3 }; };
    if (q >= 0) { var d1 = bump(seg(q, 0.1, 0.4)), d2 = bump(seg(q, 0.45, 0.75)); sl = Math.max(d1, d2); }
    o.legs = [
      hind(H[0], 0, 0, false),
      { hip: [68, 54], ank: [72 + 0.5 * M.wave(t, 2, 0.1), G - 4.6 - 1.4 * Math.max(0, M.wave(t, 1, 0.5))], fa: 0.1, len: 24, w0: 14, w1: 11.5 },
      hind(H[1], 6, -3, true),
      { hip: [60, 54], ank: [61, G - 4.6], len: 24, far: true, w0: 14, w1: 11.5 }
    ];
    var hang = [[96, 48], [102 + 2 * M.wave(t, 1, 0.1), 58], [103.5 + 5 * M.wave(t, 1, 0.2), 70], [102 + 8 * M.wave(t, 1, 0.3), 81]];
    var slap = [[96, 48], [104, 60], [107, 74], [105, 87]];
    var sw = ez(seg(q, 0, 0.1)) * (1 - ez(seg(q, 0.8, 1)));
    o.trunk = hang.map(function (pt, j) { var sp = slap[j]; return [M.lerp(pt[0], sp[0] - (j === 3 ? 6 * sl : 0), q >= 0 ? sw : 0), M.lerp(pt[1], sp[1] - (j === 3 ? 6 * sl : 0), q >= 0 ? sw : 0)]; });
    o.ear = 0.8 + 0.17 * M.wave(t, 2, 0.2); o.earA = 0.1 * M.wave(t, 2, 0.2); o.eye = M.bump(seg(t, 0.6, 0.64)); var tw = 1.6 * M.wave(t, 1, 0.3);
    o.tailBox = [[23, 76.4], [15.4, 82.4], [9, 86.4 + 0.3 * tw], [3.4, 86.6 + tw]];
    p.ellipse(56, G + 1, 46, 3, { fill: 'smoke', line: false, alpha: 0.5 });
    chang(p, o);
    if (q >= 0 && !p.small) for (i = 0; i < 2; i++) { var u = seg(q, 0.18 + i * 0.35, 0.62 + i * 0.35); if (u > 0 && u < 1) { p.circle(106 - 5 * u, G - 2 - 3 * u, 3 * M.bump(u) + 0.3, { ink: 'stone', w: 0.5 }); p.circle(112 + 4 * u, G - 1 - 2 * u, 2 * M.bump(u) + 0.2, { ink: 'stone', w: 0.5 }); p.circle(100 - 8 * u, G - 1 - 1.5 * u, 2.4 * M.bump(u), { ink: 'stone', w: 0.5 }); } }
  }
});

/* ---------------------------------------------------------------- chang-sleep */
/* a rising Z: drawn by hand as it climbs, then taken back from its start */
function zed(p, x, y, sz, ph, o) {
  var d = 'M' + (x - sz) + ' ' + (y - sz) + ' L' + (x + sz) + ' ' + (y - sz) + ' L' + (x - sz) + ' ' + (y + sz) + ' L' + (x + sz) + ' ' + (y + sz);
  p.span(d, M.easeIn(M.seg(ph, 0.55, 1)), M.easeOut(M.seg(ph, 0, 0.4)), o || { w: 0.9, ink: 'blue' });
}
/* head-local point for a spot in the box, the head set down with its neck at (nx, ny) and turned ha */
function toHead(nx, ny, ha, X, Y) { var c = Math.cos(-ha), s = Math.sin(-ha), dx = X - nx, dy = Y - ny; return [NX + dx * c - dy * s, NY + dx * s + dy * c]; }
D.add('chang-sleep', {
  fam: 'thai', tapRest: 0.35, tags: ['elephant', 'chang', 'sleep', 'nap', 'dream', 'rest', 'zzz', 'night', 'animal', 'thailand', 'ช้าง', 'นอน', 'หลับ'], loop: 4, still: 0.25, ratio: 1.2, tapLen: 2.4, burst: false, tapMargin: [30, 20, 10, 14],
  margin: [34, 14, 8, 14], about: 'lying on its side asleep: the great flank rises and falls with each breath, the ear stirs, the tail tip twitches, and Zs climb off the head',
  tapAbout: 'one eye opens and looks at you, a sleepy sigh puffs from the trunk, the eye closes again',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, bump = M.bump, q = s.tap, i;
    var br = M.wave(t, 1, 0.1), lift = 0, look = 0, sigh = 0;
    if (q >= 0) { lift = ez(seg(q, 0.04, 0.2)) * (1 - ez(seg(q, 0.68, 0.84))); sigh = seg(q, 0.45, 0.95); look = ez(seg(q, 0.2, 0.34)) * (1 - ez(seg(q, 0.5, 0.58))); }
    var T = 1.7 * br, ox = 0;
    var o = { fill: GREY, ha: 0.5, eyeK: 1 + 0.7 * lift, eye: 1 - 0.97 * lift, ear: 0.9 - 0.12 * br + 0.35 * bump(seg(t, 0.62, 0.74)) + 0.3 * bump(seg(q < 0 ? 0 : q, 0.1, 0.26)), earA: 0.06 * br, tusk: true };
    var hx = 77 + ox, hy = 75 - 0.5 * br;                             /* where the neck sits, the head resting with its chin on the ground */
    var tr = [[96, 48.5], [104, 58], [109, 70], [105, 80]];
    var box = [[hx + 17.5, hy + 12], [hx + 24, hy + 15], [hx + 33, hy + 14.4], [hx + 36.4, hy + 9 - 5 * lift], [hx + 32, hy + 4 - 9 * lift]];
    o.trunk = box.map(function (b) { return toHead(hx, hy, o.ha, b[0], b[1]); });
    p.ellipse(60, G + 1, 52, 3, { fill: 'smoke', line: false, alpha: 0.5 });
    /* the far legs, behind the body */
    chLeg(p, o, { sp: even(cr([[70 + ox, 80], [80 + ox, 83], [92 + ox, 85.8], [100 + ox, 86.8]], 6), 12), fa: 1.45, far: true, w0: 13, w1: 11 });
    /* the tail laid out behind the rump, its tuft twitching */
    var tw = 3 * M.wave(t, 2, 0.2) * bump(seg(M.frac(t * 2), 0.5, 1));
    column(p, cr([[21 + ox, 68], [13 + ox, 70], [8 + ox, 75], [8 + ox, 80 - tw * 0.4]], 5), function (u) { return 3.2 - 1.4 * u; }, { end: 'round', fill: GREY, w: 0.8 });
    p.path('M6.4 ' + (79 - tw * 0.4) + ' C3.6 ' + (81.6 - tw * 0.4) + ' 4 ' + (86 - tw * 0.3) + ' 7.6 ' + (88 - tw * 0.2) + ' C10.8 ' + (86 - tw * 0.3) + ' 10.8 ' + (82 - tw * 0.4) + ' 9.4 ' + (79 - tw * 0.4) + ' Z', { fill: 'black', w: 0.5 });
    /* the body: a great loaf lying on its side; the top breathes */
    var top = 57.5 - T, d = 'M' + (20 + ox) + ' 90 C' + (13 + ox) + ' 78 ' + (17 + ox) + ' ' + (65 - T * 0.4) + ' ' + (32 + ox) + ' ' + (top + 2.5) + ' C' + (46 + ox) + ' ' + (top - 2) + ' ' + (66 + ox) + ' ' + (top - 1) + ' ' + (76 + ox) + ' ' + (top + 7) + ' C' + (86 + ox) + ' ' + (top + 15) + ' ' + (86 + ox) + ' 82 ' + (81 + ox) + ' 90 Z';
    p.path(d, { fill: GREY, w: 1 });
    if (!p.small) {
      for (i = 0; i < 4; i++) p.path('M' + (36 + i * 8 + ox) + ' ' + (top + 4 + i * 0.8 - T * 0.2) + ' C' + (38 + i * 8 + ox) + ' ' + (top + 14) + ' ' + (36 + i * 8 + ox) + ' ' + (top + 22) + ' ' + (33 + i * 8 + ox) + ' ' + (top + 27), { w: 0.4, detail: true, ink: DARK });
      p.path('M' + (26 + ox) + ' 76 C' + (30 + ox) + ' 70 ' + (36 + ox) + ' 70 ' + (40 + ox) + ' 74 C' + (40 + ox) + ' 80 ' + (34 + ox) + ' 84 ' + (28 + ox) + ' 82', { w: 0.4, detail: true, ink: DARK });
    }
    chLeg(p, o, { sp: even(cr([[68 + ox, 78], [79 + ox, 82.5], [92 + ox, 86.4], [100 + ox, 87.6]], 6), 12), fa: 1.45, w0: 13.5, w1: 11, nails: 3 });
    /* the head laid on its foreleg */
    p.push(); p.move(hx - NX, hy - NY);
    p.pivot(NX, NY, o.ha, 1, function () { chHead(p, o); });
    p.pop();
    chLeg(p, o, { sp: even(cr([[36 + ox, 76], [26 + ox, 81], [17 + ox, 84.4], [11 + ox, 86]], 6), 12), fa: -1.35, w0: 13, w1: 10.4, nails: 3 });
    /* the sigh: a few arcs of breath leaving the trunk's tip */
    var tip = box[box.length - 1];
    if (!p.small && sigh > 0 && sigh < 1) for (i = 0; i < 3; i++) { var v = seg(sigh, i * 0.14, 0.6 + i * 0.14); if (v > 0 && v < 1) p.arc(tip[0] + 4 + 6 * v * (i + 1), tip[1] - 3 * v - i * 2, 2.5 + 3 * v, -1.9 - 0.2 * v, 1.9 + 0.2 * v, { w: 0.6, ink: 'sky', rot: 0, ry: 2.5 + 3 * v }); }
    /* the dream */
    if (!p.small || true) for (i = 0; i < 3; i++) { var ph = M.frac(t * 1 + i / 3), sz = 1.4 + 2.2 * M.easeOut(M.seg(ph, 0, 0.7)); zed(p, hx + 8 + 24 * ph + 2 * Math.sin(ph * 9 + i), hy - 22 - 38 * ph, p.small ? sz * 1.3 : sz, ph, { w: p.small ? 1.4 : 0.9, ink: 'blue' }); }
  }
});

/* ---------------------------------------------------------------- chang-bathe */
var BACK = [[96, 47.5], [105, 41], [104, 26], [93, 13.5], [80, 12.5], [71, 19]];
D.add('chang-bathe', {
  fam: 'thai', tapRest: 0.72, tags: ['elephant', 'chang', 'bathe', 'bath', 'spray', 'water', 'river', 'cool', 'songkran', 'animal', 'thailand', 'ช้าง', 'อาบน้ำ'], loop: 2.4, still: 0.2, ratio: 1.2, tapLen: 2.6, burst: false, tapMargin: [60, 30, 10, 20],
  margin: [24, 18, 12, 14], about: 'standing in the river with the trunk curled back over its head, spraying water along its own back; the water runs down its flanks and rings spread round its legs, eyes shut in bliss',
  tapAbout: 'it dips the trunk in the river, lifts it with a gulp, and sends a great fountain up and over, raining down all round',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, bump = M.bump, q = s.tap, i, dip = 0, up = 0, fount = 0, WY = 73;
    if (q >= 0) { dip = ez(seg(q, 0, 0.2)) * (1 - ez(seg(q, 0.2, 0.34))); up = ez(seg(q, 0.3, 0.46)) * (1 - ez(seg(q, 0.84, 0.97))); fount = seg(q, 0.46, 0.95); }
    var away = Math.max(dip, up), by = 1 + 0.5 * M.wave(t, 1, 0.1) - 1.2 * dip;
    var DIP = [[96, 49], [104, 60], [107, 74], [104, 88], [104, 93]], UPF = [[96, 47.5], [106, 41], [112, 30], [113.5, 18], [111, 6], [114, 0]];
    var o = { bx: 0, by: by, bt: 0.01 * M.wave(t, 1, 0.2) + 0.05 * dip, ha: 0.1 * (1 - away) + 0.22 * dip - 0.12 * up + 0.03 * M.wave(t, 2, 0.1), fill: GREY, eye: 1 - 0.9 * up * 0, ear: 0.8 + 0.18 * M.wave(t, 2, 0.12), earA: 0.12 * M.wave(t, 2, 0.12), tail: 0.2 * M.wave(t, 1, 0.3) };
    var lerpPts = function (a, b, u) { var n = Math.max(a.length, b.length), r = [], j; for (j = 0; j < n; j++) { var A = a[Math.min(j, a.length - 1)], B = b[Math.min(j, b.length - 1)]; r.push([M.lerp(A[0], B[0], u), M.lerp(A[1], B[1], u)]); } return r; };
    var trunk = BACK.map(function (pt, j) { return [pt[0] + 1.4 * M.wave(t, 2, -j * 0.04) * (j > 2), pt[1] + 1.2 * M.wave(t, 2, -j * 0.05) * (j > 2)]; });
    trunk = lerpPts(trunk, DIP, dip); trunk = lerpPts(trunk, UPF, up);
    o.trunk = trunk;
    o.legs = [
      { hip: [31, 54], ank: [31, G - 4.6], len: 34, w0: 14.5 }, { hip: [68, 54], ank: [68, G - 4.6], len: 33, w0: 14.5 },
      { hip: [39, 54], ank: [39, G - 4.6], len: 34, far: true, w0: 14.5 }, { hip: [60, 54], ank: [60, G - 4.6], len: 33, far: true, w0: 14.5 }
    ];
    chang(p, o);
    var tipL = trunk[trunk.length - 1], Tp = headPt(o, tipL[0], tipL[1]);
    /* the spray off the tip, falling along the back; drops land and run down the flank */
    var back = function (x) { return 31.6 + 0.0055 * (x - 52) * (x - 52) + by; };
    if (!p.small && up < 0.3 && dip < 0.3) {
      for (i = 0; i < 9; i++) {
        var u = M.frac(t * 2 + i / 9 * 0.9 + 0.13 * (i % 3)), xl = 66 - i * 3.5, yl = back(xl) - 0.5, e = 0.22 * u + 0.78 * u * u, x1 = Tp[0] + (xl - Tp[0]) * u, y1 = Tp[1] + 3 + (yl - Tp[1] - 3) * e - 3 * Math.sin(Math.PI * u), u0 = Math.max(0, u - 0.09), e0 = 0.22 * u0 + 0.78 * u0 * u0;
        p.line(Tp[0] + (xl - Tp[0]) * u0, Tp[1] + 3 + (yl - Tp[1] - 3) * e0 - 3 * Math.sin(Math.PI * u0), x1, y1, { w: 0.9, ink: 'sky', cap: 'round' });
      }
      for (i = 0; i < 6; i++) {
        var ph = M.frac(t * 2 + i * 0.17), x0 = 38 + i * 5.2 + 0.6 * (i % 2);
        p.span('M' + x0 + ' ' + (back(x0) + 2.5) + ' C' + (x0 + 2.4) + ' ' + (back(x0) + 12) + ' ' + (x0 - 2) + ' ' + (back(x0) + 22) + ' ' + (x0 + 1) + ' ' + (WY - 3), M.easeIn(M.seg(ph, 0.35, 1)), M.easeOut(M.seg(ph, 0, 0.7)), { w: 0.8, ink: 'sky' });
      }
    }
    if (fount > 0 && !p.small) {
      /* the great jet: up out of the trunk and over, falling back on its own head; what it throws off comes down as rain */
      var Tu = headPt({ bx: 0, by: 1, bt: 0, ha: -0.12 }, UPF[5][0], UPF[5][1]), x0 = Tu[0] + 1, y0 = Tu[1] + 5, jet = [], k, j1 = ez(seg(fount, 0, 0.42)), j0 = ez(seg(fount, 0.4, 0.88));
      for (k = 0; k <= 26; k++) { var tj = 0.92 * k / 26; jet.push([x0 - 46 * tj, y0 - 74 * tj + 118 * tj * tj]); }
      p.span(jet, j0, j1, { w: 2.6, ink: 'sky', cap: 'round', wob: 0.6 });
      p.span(jet, j0, Math.max(j0, j1 - 0.05), { w: 0.55, ink: 'blue', wob: 0.6 });
      var land = jet[jet.length - 1], sp2 = seg(fount, 0.36, 0.95);
      for (i = 0; i < 9; i++) {
        var rr = M.rng(61 + i)(), an = -Math.PI / 2 + (i - 4) * 0.34 + 0.2 * rr, v = 20 + 14 * rr + 4 * (i % 3), tt = sp2 * 0.75, dx = land[0] + 2 + Math.cos(an) * v * tt, dy = land[1] + Math.sin(an) * v * tt + 80 * tt * tt;
        if (sp2 > 0 && sp2 < 1 && dy < WY) p.dot(dx, dy, 1.7 * (1 - 0.5 * sp2), 'sky');
      }
    }
    /* the river: what is under it is seen through it */
    var top = sinew(1, 119, WY, 1.2, 26, t * 2);
    p.path('M' + top.map(function (v) { return v[0].toFixed(1) + ' ' + v[1].toFixed(1); }).join(' L') + ' L119 97 Q60 101 1 97 Z', { fill: 'sky', line: false, alpha: 0.46 });
    p.curve(top, { ink: 'blue', w: 0.8 });
    if (!p.small) {
      p.curve(sinew(6, 112, WY + 8, 1, 30, -t * 2 + 0.3), { ink: 'blue', w: 0.45, detail: true });
      [31, 68, 39, 60].forEach(function (lx, j) { var v = M.frac(t * 2 + j * 0.27), a1 = TAU * M.easeOut(M.seg(v, 0, 0.6)), a0 = TAU * M.easeIn(M.seg(v, 0.4, 1)); if (a1 - a0 > 0.1) p.arc(lx + 1, WY + 2, 5 + 11 * v, a0 - 0.5, a1 - 0.5, { ry: 1.4 + 2.4 * v, w: 0.65, ink: 'blue' }); });
      if (dip > 0.3) for (i = 0; i < 3; i++) { var bv = M.frac(i / 3 + dip * 0.7); p.circle(Tp[0] + 1 + 2 * Math.sin(bv * 7 + i), WY + 10 - 11 * bv, 0.9 + (i % 2) * 0.6, { ink: 'blue', w: 0.5 }); }
    }
  }
});

/* ---------------------------------------------------------------- nagas
   นาค. The serpent of the waters and the guardian of the temple stair. Green or teal scales with a pale belly, a gold crest of flame
   along the back and above the brow, a red mouth. Drawn upright and dignified. */
/* both edges of a ribbon along a spine: L the belly side, R the back, and the angle of the spine at each point */
function edges(sp, wf) {
  var n = sp.length, L = [], R = [], A = [], i, a, b, d, h, nx, ny;
  for (i = 0; i < n; i++) {
    a = sp[Math.max(0, i - 1)]; b = sp[Math.min(n - 1, i + 1)]; d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; h = wf(i / (n - 1)) / 2; nx = -(b[1] - a[1]) / d; ny = (b[0] - a[0]) / d;
    L.push([sp[i][0] + nx * h, sp[i][1] + ny * h]); R.push([sp[i][0] - nx * h, sp[i][1] - ny * h]); A.push(Math.atan2(b[1] - a[1], b[0] - a[0]));
  }
  return { L: L, R: R, A: A };
}
/* the body of a naga along sp (tail first): gold flames down the back, the scaled tube, the pale belly in plates, scales in chevrons;
   gl runs 0 → 1 as a glint travelling one scale after another from the head end down to the tail */
function nagaBody(p, sp, wf, o) {
  var E = edges(sp, wf), n = sp.length, i, hh, fill = o.fill || 'green', step = o.step || 3, gl = o.gl, small = p.small, rid = o.ridge !== false;
  if (rid) for (i = 3; i < n - (o.noRidge || 9); i += 4) {
    hh = wf(i / (n - 1)) / 2;
    p.at(E.R[i][0], E.R[i][1], E.A[i], 1, function () { p.path('M-2.6 0.6 C-2.4 -2.4 -0.8 -4.4 0.6 -6.2 C1.2 -4 3.2 -2.6 2.8 0.6 Z', { fill: 'gold', w: 0.6 }); });
  }
  tube(p, sp, wf, { fill: fill, w: 1 });
  var band = E.L.slice(), inner = [];
  for (i = 0; i < n; i++) { band[i] = mix(sp[i], E.L[i], 0.86); inner.push(mix(sp[i], E.L[i], 0.3)); }
  p.poly(band.concat(inner.slice().reverse()), { fill: o.belly || 'cream', line: false });
  if (!small) for (i = step; i < n - 1; i += step) {
    hh = wf(i / (n - 1)) / 2;
    var glow = gl != null && Math.abs(M.frac(gl) * (n / step) - i / step) < 0.7, k = i;
    p.at(sp[i][0], sp[i][1], E.A[i], 1, function () {
      p.path('M1.3 ' + (-hh * 0.9) + ' Q-1.8 ' + (-hh * 0.2) + ' 1.3 ' + (hh * 0.3), glow ? { w: 0.9, ink: 'gold' } : { w: 0.35, ink: 'night', detail: true });
      p.line(0.4, hh * 0.38, 0.4, hh * 0.84, { w: 0.3, ink: 'brown', detail: true });
    });
  }
  return E;
}
var CREST = 'M-2.6 0 C-5.4 -4.6 -4.6 -12 -0.4 -19 C0.2 -15.4 2.6 -13 3.8 -9.6 C5 -5.6 3.6 -2 2.6 0 Z';
/* the head in profile, facing right, the origin where the neck ends. o: open (0..1, the jaw), blink, tongue (0..1), flare (the crest), t (its sway),
   crest (how many flames), body (the colour) */
function nagaHead(p, o) {
  var op = o.open || 0, bl = o.blink || 0, fl = o.flare == null ? 0.5 : o.flare, t = o.t || 0, i, small = p.small, body = o.body || 'green', nc = o.crest || 5, a = op * 0.62, hx = -0.5, hy = 3.4;
  /* the crest: flames fanned back off the skull, the front ones leading */
  for (i = 0; i < nc; i++) {
    p.at(3.5, -13, 0.3 - i * (0.3 + 0.1 * fl) + 0.06 * M.wave(t, 2, 0.5 - i * 0.08), [1, [0.78, 1.0, 1.14, 1.04, 0.86][i % 5]], function () {
      p.path(CREST, { fill: 'gold', w: 0.8 });
      if (!small) p.path('M0.2 -3 C-0.6 -8 0.2 -12 1.6 -15', { w: 0.35, detail: true, ink: 'red' });
    });
  }
  /* a fin flaring behind the jaw, and the whiskers */
  p.path('M-3 4 C-7 3.4 -10 5.6 -11.4 9 C-8 8.4 -6.6 9.6 -5 12 C-3.6 9.6 -3 7.4 -2 5.6 Z', { fill: 'gold', w: 0.7 });
  if (!small) { p.path('M31.5 -5 C37 -3.6 40 0.4 38.4 5.4', { w: 0.6, ink: 'gold' }); p.path('M30 3 C34 6 34.6 10 32 13', { w: 0.55, ink: 'gold' }); }
  /* the open mouth: a red wedge, the jaw swung down about its hinge, the tongue */
  var lj = function (x, y) { var dx = x - hx, dy = y - hy; return [hx + dx * Math.cos(a) - dy * Math.sin(a), hy + dx * Math.sin(a) + dy * Math.cos(a)]; };
  if (op > 0.04) {
    var t1 = lj(30.5, 2.4), t0 = lj(6, 6);
    p.poly([[-1, 1.5], [31, -1.4], t1, t0], { fill: 'red', w: 0.6 });
    if (o.tongue > 0.02) { var tg = o.tongue, tx = 24 + 12 * tg, ty = 4 + 5 * op; p.draw('M14 ' + (4 + 3 * op) + ' C20 ' + (5 + 3 * op) + ' ' + (tx - 4) + ' ' + ty + ' ' + tx + ' ' + (ty + 0.5), M.clamp(tg * 1.4, 0, 1), { w: 0.9, ink: 'rose' }); if (tg > 0.6) { p.line(tx, ty + 0.5, tx + 3.4, ty - 1.4, { w: 0.6, ink: 'rose' }); p.line(tx, ty + 0.5, tx + 3.4, ty + 2.6, { w: 0.6, ink: 'rose' }); } }
  }
  p.pivot(hx, hy, a, 1, function () {
    p.path('M-1 2 C6 2 16 1 28 0.4 C31 0.3 32.8 1.8 31.2 3.4 C26 7.6 14 9.6 6 9 C1 8.4 -2 5.6 -1 2 Z', { fill: body, w: 0.95 });
    if (op > 0.3) { p.poly([[23, 1.2], [24.4, -2.4], [25.6, 1]], { fill: 'white', w: 0.4 }); }
    if (!small) { p.path('M8 6.5 C14 8 21 7.2 27 4.8', { w: 0.35, detail: true, ink: 'cream' }); p.path('M3 3.4 C5 7.4 5 9 4 10.6', { w: 0.5, ink: 'gold' }); }
  });
  /* the skull and upper jaw */
  p.path('M-5.4 -6 C-5 -13.4 2.4 -17.6 10 -16 C15 -15 19 -12.6 23 -10.6 C27 -8.8 31.2 -9.4 33.4 -7.2 C35 -5.4 34 -2.6 31.4 -1.6 C26 -0.2 18 0.6 10 1.6 C5 2.2 1 3 -1 2 C-4.4 0.2 -5.6 -3 -5.4 -6 Z', { fill: body, w: 1 });
  if (!small) p.path('M16 -11 C19 -10.6 21 -9.6 22.4 -8', { w: 0.35, detail: true, ink: 'night' });
  p.dot(30.6, -6.4, 0.8, 'night');
  p.poly([[26.4, -0.4], [27.6, 4.2 + 1.2 * op], [28.8, -0.8]], { fill: 'white', w: 0.45 });
  /* scales on the cheek, and the brow */
  if (!small) { p.path('M1 -3 Q4 -1 7 -4', { w: 0.3, detail: true, ink: 'night' }); p.path('M1.6 -8 Q4.6 -5.6 7.6 -8.4', { w: 0.3, detail: true, ink: 'night' }); }
  p.path('M5 -12 C9 -15.4 15 -14.6 19 -11.2', { w: 0.9, ink: 'gold' });
  /* the eye */
  if (bl > 0.6) p.path('M8.6 -9.2 C10.6 -7.6 13.4 -7.8 15 -9.4', { w: 0.8 });
  else { p.ellipse(11.8, -9.6, 3.5, 2.8, { fill: 'white', w: 0.6 }); p.dot(12.6, -9.6, 1.7, 'ink'); p.dot(13.2, -10.2, 0.5, 'white'); }
}
/* little gold flames for the glow of an ember or a fireball */
function ember(p, x, y, k, lean, ph) {
  p.at(x, y, lean, k, function () {
    p.path('M-3 0 C-4 -4 -2.6 -8 0 -12 C1 -8 4 -6 3.4 -2 C3 -0.6 1.6 0.4 0 0.4 C-1.4 0.4 -2.6 0.4 -3 0 Z', { fill: 'flame', w: 0.7 });
    p.path('M-1.4 -0.2 C-1.6 -3 -0.6 -5 0.4 -7 C1.4 -4.6 2 -3 1.4 -0.6 Z', { fill: 'yellow', line: false });
  });
}

/* ---------------------------------------------------------------- naga-stair */
/* the temple stair balustrade ends in a naga: the body runs down beside the steps, then the neck rears up into a head with a gold crest */
D.add('naga-stair', {
  fam: 'thai', tapRest: 0.4, tags: ['naga', 'nak', 'serpent', 'temple stair', 'balustrade', 'doi suthep', 'guardian', 'wat', 'lanna', 'scales', 'นาค', 'บันไดนาค'], loop: 3.2, still: 0.3, ratio: 1, tapLen: 2.2, burst: 'ember', burstAt: [100, 22], burstN: 5, burstSpread: 1.6, burstDelay: 0.22, burstGravity: -30,
  margin: [24, 22, 10, 14], about: 'the balustrade naga: its scales catch the light one after another down the stair, the neck sways, the crest flames flicker, the jaw works and the tongue flicks',
  tapAbout: 'it rears and flares its crest and breathes out a small ember that floats up',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, bump = M.bump, q = s.tap, i, rise = 0, brea = 0;
    if (q >= 0) { rise = M.spring(seg(q, 0, 0.3)) * (1 - ez(seg(q, 0.68, 0.96))); brea = bump(seg(q, 0.2, 0.78)); }
    /* the steps, rising to the left beside the balustrade */
    var st = 'M3 91 L3 37', xx = 3, yy = 37;
    for (i = 0; i < 6; i++) { xx += 9.4; st += ' L' + xx + ' ' + yy; yy += 7.7; if (i < 5) st += ' L' + xx + ' ' + yy; }
    st += ' L' + xx + ' 91 Z';
    p.path(st, { fill: 'sand', w: 0.9 });
    for (i = 0; i < 6; i++) p.path('M' + (3 + i * 9.4 + 1.5) + ' ' + (37 + i * 7.7 + 3.4) + ' L' + (3 + i * 9.4 + 7.6) + ' ' + (37 + i * 7.7 + 3.4), { w: 0.35, detail: true, ink: 'brown' });
    p.line(1, 91, 66, 91, { w: 0.9 });
    var sway = M.wave(t, 1, 0.05), sw2 = M.wave(t, 1, -0.07), lift = 7 * rise;
    var hx = 66 + 2 * sw2 + 3 * rise, hy = 33 - lift + 1.6 * sway;
    var pts = [[2, 18], [12, 26], [24, 37], [36, 48], [47, 57.5], [56, 62], [63, 56 + 0.6 * sway], [64.4, 44 - 0.5 * lift + 1.4 * sw2], [hx - 1, hy + 2]];
    var sp = cr(pts, 7), W = function (u) { return u < 0.55 ? 4 + 8 * Math.pow(u / 0.55, 0.9) : 12 - 0.4 * (u - 0.55) / 0.45 * 3; };
    var gl = 1 - M.frac(t * 1);
    nagaBody(p, sp, W, { gl: gl, step: 3 });
    var open = 0.22 + 0.16 * M.wave(t, 1, 0.2) + 0.6 * brea + 0.2 * rise, tg = bump(seg(M.frac(t * 1 + 0.15), 0.1, 0.5)) * (1 - rise), ang = -0.06 + 0.07 * sway - 0.22 * rise;
    p.at(hx, hy, ang, p.small ? 1.12 : 0.9, function () { nagaHead(p, { open: Math.min(1, open), blink: bump(seg(t, 0.84, 0.88)), tongue: tg, flare: 0.5 + 0.25 * M.wave(t, 2, 0.1) + 0.7 * rise, t: t, body: 'green', crest: 5 }); });
    if (brea > 0.02) {
      var mx = hx + 0.9 * (33 * Math.cos(ang) + 0.5 * Math.sin(ang)) + 3, my = hy + 0.9 * (33 * Math.sin(ang) + 0.5 * Math.cos(ang)) + 1;
      ember(p, mx + 2 * brea, my - 5 * brea, 0.5 + 1.1 * brea, 1.15 + 0.12 * M.wave(q, 5), 0);
    }
  }
});

/* ---------------------------------------------------------------- naga-seven */
/* a naga face seen from the front: a rounded shield of a head, gold flames fanned over the brow, flame ears, a pale snout with two fangs */
var FLAME = 'M-2.4 0 C-4.8 -4.4 -3.8 -11 0.4 -18 C0.8 -13 3.8 -9.6 4 -5.6 C4.2 -2.6 3 -0.8 2.4 0 Z';
function nagaFace(p, o) {
  var fl = o.flare == null ? 0.5 : o.flare, t = o.t || 0, small = p.small, body = o.body || 'green', i, bl = o.blink || 0, op = o.open || 0, ph = o.ph || 0;
  for (i = 0; i < 5; i++) {
    p.at((i - 2) * 1.8, -8.5, (i - 2) * (0.32 + 0.12 * fl) + 0.05 * M.wave(t, 2, ph + i * 0.07), [0.8, [0.5, 0.72, 0.92, 0.72, 0.5][i]], function () { p.path(FLAME, { fill: 'gold', w: 0.75 }); });
  }
  [-1, 1].forEach(function (d) { p.path('M' + (d * 7.4) + ' -0.4 C' + (d * 12.4) + ' -1 ' + (d * 14.4) + ' -6 ' + (d * 13) + ' -10.4 C' + (d * 9.4) + ' -8.4 ' + (d * 7.6) + ' -5.4 ' + (d * 6.8) + ' -2.6 Z', { fill: 'gold', w: 0.7 }); });
  p.path('M0 -10.4 C6.6 -10.4 9.2 -5.4 8.8 0.6 C8.4 6.2 5.8 10.8 0 12.2 C-5.8 10.8 -8.4 6.2 -8.8 0.6 C-9.2 -5.4 -6.6 -10.4 0 -10.4 Z', { fill: body, w: 1 });
  p.path('M-5.6 -6.2 C-3 -8.4 3 -8.4 5.6 -6.2', { w: 0.8, ink: 'gold' });
  p.poly([[0, -9], [1.5, -7], [0, -5], [-1.5, -7]], { fill: 'red', w: 0.4 });
  [-1, 1].forEach(function (d) {
    if (bl > 0.6) p.path('M' + (d * 3.6 - 2.2) + ' -2.6 Q' + (d * 3.6) + ' -0.6 ' + (d * 3.6 + 2.2) + ' -2.6', { w: 0.6 });
    else { p.ellipse(d * 3.7, -2.8, 2.5, 2, { fill: 'white', w: 0.5 }); p.dot(d * 3.7 + d * 0.3, -2.8, 1.2, 'ink'); }
  });
  p.ellipse(0, 6, 4.8, 3.6, { fill: 'mint', w: 0.7 });
  if (!small) { p.dot(-1.7, 5.2, 0.65, 'night'); p.dot(1.7, 5.2, 0.65, 'night'); }
  if (op > 0.05) p.path('M-3.4 8.6 C-1.6 ' + (9.4 + 2.4 * op) + ' 1.6 ' + (9.4 + 2.4 * op) + ' 3.4 8.6 C2 ' + (10.4 + 3 * op) + ' -2 ' + (10.4 + 3 * op) + ' -3.4 8.6 Z', { fill: 'red', w: 0.5 });
  else p.path('M-3.2 8.8 Q0 10.2 3.2 8.8', { w: 0.55 });
  p.poly([[-3, 8.7], [-2.3, 11.2], [-1.6, 9]], { fill: 'white', w: 0.4 }); p.poly([[3, 8.7], [2.3, 11.2], [1.6, 9]], { fill: 'white', w: 0.4 });
}
D.add('naga-seven', {
  fam: 'thai', tapRest: 0.45, tags: ['naga', 'nak', 'seven heads', 'seven-headed', 'hood', 'canopy', 'mucalinda', 'serpent', 'shelter', 'protection', 'นาค', 'นาคเจ็ดเศียร', 'พญานาค'], loop: 3.6, still: 0.2, ratio: 1, tapLen: 2.2, burst: 'spark', burstAt: [50, 20], burstN: 6, burstSpread: 3, burstColor: 'gold', burstDelay: 0.3, burstGravity: 30,
  margin: [30, 18, 6, 18], about: 'the seven-headed naga fanned up like a canopy over its coils: the heads sway one after another from left to right, the crests flicker, the eyes blink in turn',
  tapAbout: 'the seven heads rise in a wave from one end to the other, springing up on their necks, crests flared, and gold sparks fly',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, bump = M.bump, q = s.tap, i, B = [50, 75], order = [0, 6, 1, 5, 2, 4, 3], o2;
    for (o2 = 0; o2 < 7; o2++) {
      i = order[o2];
      var d = i - 3, th0 = d * 0.4, ph = i * 0.1, sw = M.wave(t, 1, -ph), R0 = 46 - 3.2 * Math.abs(d), up = 0, fl = 0.4 + 0.3 * M.wave(t, 2, -ph);
      if (q >= 0) { up = M.spring(seg(q, i * 0.065, i * 0.065 + 0.42)) * (1 - ez(seg(q, 0.64 + i * 0.04, 0.96))); fl += 0.7 * up; }
      var th = th0 + 0.05 * sw + 0.03 * d * up, R = R0 + 1.6 * sw + 9 * up;
      var H = [B[0] + R * Math.sin(th), B[1] - R * Math.cos(th)], m1 = [B[0] + R * 0.36 * Math.sin(th * 0.45), B[1] - R * 0.36 * Math.cos(th * 0.45)], m2 = [B[0] + R * 0.7 * Math.sin(th * 0.85), B[1] - R * 0.7 * Math.cos(th * 0.85)];
      var sp = cr([B, m1, m2, H], 6);
      tube(p, sp, function (u) { return 8 - 2.6 * u; }, { fill: 'sea', w: 0.95 });
      if (!p.small) for (var k = 4; k < sp.length - 4; k += 4) p.at(sp[k][0], sp[k][1], Math.atan2(sp[k + 1][1] - sp[k - 1][1], sp[k + 1][0] - sp[k - 1][0]), 1, function () { p.path('M1 -2.4 Q-1.4 0 1 2.4', { w: 0.3, ink: 'night', detail: true }); });
      p.at(H[0], H[1] - 2, th * 0.8, 1.0 - 0.06 * Math.abs(d), function () { nagaFace(p, { flare: fl, t: t, ph: -ph, body: 'sea', blink: bump(seg(M.frac(t - ph * 0.5), 0.9, 0.96)), open: 0.4 * up }); });
    }
    /* the coils the heads rise from, the tail curling out of the lowest */
    column(p, cr([[80, 88], [91, 88.4], [97, 82], [94, 74], [88, 71]], 5), function (u) { return 9 - 7.6 * u; }, { end: 'round', fill: 'sea', w: 0.9 });
    p.path('M86 69.4 C88.6 66.4 91 66.4 91.6 68.6 C90.4 70 89 71 87.2 71.4 Z', { fill: 'gold', w: 0.6 });
    [[50, 86.5, 40, 9.4], [50, 78, 31, 8.4], [50, 70.6, 21, 7]].forEach(function (c, j) {
      p.ellipse(c[0], c[1], c[2], c[3], { fill: 'sea', w: 1 });
      p.path('M' + (c[0] - c[2] * 0.86) + ' ' + (c[1] + c[3] * 0.5) + ' C' + (c[0] - c[2] * 0.5) + ' ' + (c[1] + c[3] * 1.04) + ' ' + (c[0] + c[2] * 0.5) + ' ' + (c[1] + c[3] * 1.04) + ' ' + (c[0] + c[2] * 0.86) + ' ' + (c[1] + c[3] * 0.5) + ' C' + (c[0] + c[2] * 0.5) + ' ' + (c[1] + c[3] * 0.62) + ' ' + (c[0] - c[2] * 0.5) + ' ' + (c[1] + c[3] * 0.62) + ' ' + (c[0] - c[2] * 0.86) + ' ' + (c[1] + c[3] * 0.5) + ' Z', { fill: 'cream', line: false });
      if (!p.small) for (var k2 = -3; k2 <= 3; k2++) { var cx = c[0] + k2 * c[2] * 0.25, cyy = c[1] + c[3] * (0.8 - 0.3 * k2 * k2 / 9); p.path('M' + (cx - 1.4) + ' ' + (cyy - c[3] * 0.42) + ' Q' + (cx + 1.2) + ' ' + cyy + ' ' + (cx - 1.4) + ' ' + (cyy + c[3] * 0.3), { w: 0.3, ink: 'night', detail: true }); }
    });
  }
});

/* ---------------------------------------------------------------- naga-river */
/* the naga of the Mekong swims through the water, its body rising in arches and diving again, the whole serpent drawn right through the river so that the dives are still seen under the surface */
D.add('naga-river', {
  fam: 'thai', tapRest: 0.5, tags: ['naga', 'nak', 'river', 'mekong', 'swimming', 'water', 'waves', 'fireball', 'serpent', 'nong khai', 'นาค', 'แม่น้ำโขง', 'บั้งไฟพญานาค'], loop: 3.6, still: 0.15, ratio: 1.2, tapLen: 2.6, burst: false, tapMargin: [60, 20, 8, 14],
  margin: [26, 20, 8, 14], about: 'the naga swims up the river, its body rising in arches and dipping out of sight, the arches travelling down it from the head to the tail, the head riding above the water and looking ahead',
  tapAbout: 'it rears up with the crest flared and three pink fireballs rise one after another out of the river behind it and climb out of sight',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, bump = M.bump, q = s.tap, i, WY = 68, N = 34, sp = [], u, rear = 0;
    if (q >= 0) rear = M.spring(seg(q, 0, 0.28)) * (1 - ez(seg(q, 0.7, 0.96)));
    for (i = 0; i <= N; i++) {
      u = i / N;
      var env = Math.min(1, 0.25 + u * 1.4) * (1 - 0.9 * ez(seg(u, 0.72, 0.96))), neck = ez(seg(u, 0.74, 1)) * (30 + 13 * rear);
      sp.push([6 + 69 * u - 7 * bump(seg(u, 0.7, 1)) + 3 * ez(seg(u, 0.85, 1)), WY - 3 - neck + 13 * env * Math.sin(TAU * (1.5 * u - t))]);
    }
    var W = function (v) { return v < 0.78 ? 2.6 + 8.6 * Math.pow(v / 0.78, 0.8) : 11.2 - 1.6 * (v - 0.78) / 0.22; };
    var hd = sp[N], ang = -0.12 - 0.2 * rear + 0.05 * M.wave(t, 1, 0.2);
    nagaBody(p, sp, W, { gl: M.frac(1 - t), step: 3, fill: 'green', noRidge: 10 });
    p.at(hd[0] + 1, hd[1] + 1, ang, p.small ? 1.0 : 0.82, function () { nagaHead(p, { open: 0.16 + 0.1 * M.wave(t, 1, 0.3) + 0.5 * rear, blink: bump(seg(t, 0.72, 0.76)), tongue: bump(seg(M.frac(t + 0.3), 0.1, 0.4)) * (1 - rear), flare: 0.4 + 0.25 * M.wave(t, 2, 0.1) + 0.8 * rear, t: t, crest: 5 }); });
    /* the fireballs rise out of the river behind it, one after another */
    if (q >= 0) for (i = 0; i < 3; i++) {
      var f = seg(q, 0.18 + i * 0.16, 0.86 + i * 0.05), fx = 22 + i * 17 + 2 * Math.sin(f * 9 + i), fy = WY + 4 - 105 * M.easeIn(f) * 0.9 - 20 * ez(f), fr = 4.4 * (1 - 0.3 * f);
      if (f > 0 && f < 1) { p.circle(fx, fy, fr * 2, { fill: 'rose', line: false, alpha: 0.28 }); p.circle(fx, fy, fr, { fill: 'rose', w: 0.7 }); p.circle(fx, fy, fr * 0.45, { fill: 'yellow', line: false }); }
    }
    /* the river over it: what is under the surface is seen through it */
    var top = sinew(1, 119, WY, 1.2, 28, t * 2);
    p.path('M' + top.map(function (v) { return v[0].toFixed(1) + ' ' + v[1].toFixed(1); }).join(' L') + ' L119 97 Q60 101 1 97 Z', { fill: 'sky', line: false, alpha: 0.46 });
    p.curve(top, { ink: 'blue', w: 0.8 });
    if (!p.small) {
      p.curve(sinew(8, 112, WY + 11, 1, 32, -t * 2 + 0.3), { ink: 'blue', w: 0.45, detail: true });
      for (i = 0; i < N; i++) { var a = sp[i], b = sp[i + 1]; if ((a[1] - WY) * (b[1] - WY) < 0 && b[0] < hd[0] - 6) { var cx = a[0] + (b[0] - a[0]) * (WY - a[1]) / (b[1] - a[1]); p.arc(cx, WY + 0.5, 5.5, Math.PI + 0.4, TAU - 0.4, { ry: 2, w: 0.6, ink: 'blue' }); } }
      if (q >= 0) for (i = 0; i < 3; i++) { var g = seg(q, 0.18 + i * 0.16, 0.5 + i * 0.16); if (g > 0 && g < 1) p.arc(22 + i * 17, WY + 3, 3 + 11 * g, 0.2 + TAU * ez(seg(g, 0.5, 1)), 0.2 + TAU * ez(seg(g, 0, 0.7)), { ry: 1.2 + 2.4 * g, w: 0.6, ink: 'blue' }); }
    }
  }
});

/* ---------------------------------------------------------------- unalom
   อุณาโลม. The sacred yant mark, drawn as the master draws it: one unbroken line, begun at the middle of a coil, winding out, climbing in
   diminishing S-curves and going straight to a point, with three dots set above. The line is gold under thin ink, the way a rod leaves a mark
   with a halo of gold behind it. */
function yantPoly(cx, by, R, h) {
  var P = [], i, A = TAU * 2.25, n = 60, a, r, ang;
  for (i = 0; i <= n; i++) { a = A * i / n; r = 1.3 + (R - 1.3) * Math.pow(a / A, 0.9); ang = TAU * 0.25 - a; P.push([cx + r * Math.cos(ang), by + r * Math.sin(ang)]); }
  var w = h / 70;
  return P.concat(cr([[cx + R, by], [cx + R + 0.6, by - 9 * w], [cx - 12 * w, by - 23 * w], [cx + 10 * w, by - 35 * w], [cx - 6.6 * w, by - 45 * w], [cx + 3 * w, by - 52.5 * w], [cx, by - 58 * w], [cx, by - 64 * w], [cx, by - 70 * w]], 8).slice(1));
}
function polyLen(P) { var c = [0], i; for (i = 1; i < P.length; i++) c.push(c[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); return c; }
function polyAt(P, c, u) { var want = c[c.length - 1] * M.clamp(u, 0, 1), i = 1; while (i < c.length - 1 && c[i] < want) i++; var f = (want - c[i - 1]) / ((c[i] - c[i - 1]) || 1); return [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * f, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * f]; }
var Y1 = yantPoly(35, 82, 11, 70), Y1L = polyLen(Y1);
/* the part of the line between a and b: gold, with the thin ink over it */
function yantLine(p, P, a, b, ink) {
  if (b - a < 0.004) return;
  p.span(P, a, b, { ink: 'gold', w: 2.3, cap: 'round', wob: 0.7 });
  p.span(P, a, b, { ink: ink || 'ink', w: 0.72, wob: 0.8 });
}
function yantDots(p, x, y, k, kk) {
  [[-6.6, 3.6], [0, -1.2], [6.6, 3.6]].forEach(function (d, i) {
    var v = M.spring(M.seg(k, i * 0.2, i * 0.2 + 0.5)) * kk;
    if (v > 0.02) { p.circle(x + d[0], y + d[1], 2.9 * v, { fill: 'gold', line: false }); p.dot(x + d[0] + 0.3, y + d[1] + 0.3, 1.5 * v, 'ink'); }
  });
}
D.add('unalom', {
  fam: 'thai', tags: ['unalom', 'yant', 'sak yant', 'sacred', 'protection', 'line', 'blessing', 'gold', 'tattoo', 'อุณาโลม', 'ยันต์', 'สักยันต์'], loop: 4, still: 0.55, ratio: 0.7, tapLen: 3, tapRest: 0.95, burst: false, tapMargin: [14, 20, 10, 20],
  margin: [18, 16, 8, 16], about: 'the yant line is drawn up from the middle of its coil to a point, glints of gold run up it while it holds, then it is taken back from the coil, and drawn again',
  tapAbout: 'the line is drawn once more, slowly, by an unseen hand, and three gold dots settle above its point one after another',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, bump = M.bump, q = s.tap, P = Y1, c = Y1L, i;
    /* the idle line: drawn 0 → 0.4, held, taken back from the coil 0.78 → 0.96 */
    var iu = ez(seg(t, 0.02, 0.4)), ib = ez(seg(t, 0.78, 0.96)), a = ib, b = iu * (1 - 0 * ib), dots = ez(seg(t, 0.42, 0.52)) * (1 - ez(seg(t, 0.74, 0.82)));
    if (q >= 0) {
      var r = ez(seg(q, 0, 0.12)), d = ez(seg(q, 0.14, 0.76));
      if (q < 0.14) { a = Math.max(a, r * b); } else { a = 0; b = d; }
      dots = Math.max(0, seg(q, 0.76, 1)) > 0 ? 1 : dots * (1 - r);
      yantLine(p, P, a, b);
      var kk = seg(q, 0.76, 1);
      if (kk > 0) yantDots(p, 35, 6, kk, 1);
      var nib = polyAt(P, c, b);
      if (q >= 0.14 && q < 0.78) { p.dot(nib[0], nib[1], 1.7, 'gold'); p.circle(nib[0], nib[1], 3.6 + 0.8 * M.wave(q, 6), { ink: 'gold', w: 0.5 }); }
      return;
    }
    yantLine(p, P, a, b);
    var held = seg(t, 0.4, 0.78), g = seg(t, 0.4, 0.8) * 1.12;
    if (held > 0 && held < 1 && b > 0.99) { p.span(P, Math.max(0, g - 0.09), Math.min(1, g), { ink: 'yellow', w: 1.4, glow: 0.7, cap: 'round' }); }
    if (b < 0.995 && b > 0.01) { var nb = polyAt(P, c, b); p.dot(nb[0], nb[1], 1.6, 'gold'); }
    if (dots > 0.01) yantDots(p, 35, 6, M.clamp(seg(t, 0.42, 0.62), 0, 1), M.clamp(dots * 1.2, 0, 1));
  }
});

/* ---------------------------------------------------------------- unalom-lotus */
var Y2 = yantPoly(35, 62, 7, 52), Y2L = polyLen(Y2);
function lotusPetal(p, x, y, a, len, wid, fill) {
  p.at(x, y, a, 1, function () {
    p.path('M0 0 C' + (-wid) + ' ' + (-len * 0.25) + ' ' + (-wid * 0.9) + ' ' + (-len * 0.72) + ' 0 ' + (-len) + ' C' + (wid * 0.9) + ' ' + (-len * 0.72) + ' ' + wid + ' ' + (-len * 0.25) + ' 0 0 Z', { fill: fill, w: 0.85 });
    p.path('M0 ' + (-len * 0.1) + ' C-0.8 ' + (-len * 0.4) + ' 0 ' + (-len * 0.66) + ' 0 ' + (-len * 0.84), { w: 0.3, detail: true });
  });
}
D.add('unalom-lotus', {
  fam: 'thai', tags: ['unalom', 'yant', 'lotus', 'bua', 'sacred', 'blessing', 'bloom', 'gold', 'purity', 'อุณาโลม', 'บัว', 'ยันต์'], loop: 4, still: 0.55, ratio: 0.7, tapLen: 3, tapRest: 0.95, burst: 'petal', burstAt: [35, 78], burstN: 5, burstSpread: 3, burstDelay: 0.05, tapMargin: [14, 25, 10, 25],
  margin: [18, 16, 8, 16], about: 'a small lotus opens as the yant is drawn up out of its heart, the lotus holds open while gold glints run up the line, then the line is taken back and the petals close',
  tapAbout: 'the lotus flares wide with a spring while the line is drawn again, slowly, and three gold dots settle at its point',
  draw: function (p, t, s) {
    var seg = M.seg, ez = M.ease, bump = M.bump, q = s.tap, P = Y2, c = Y2L, i;
    var iu = ez(seg(t, 0.02, 0.4)), ib = ez(seg(t, 0.78, 0.96)), a = ib, b = iu, dots = ez(seg(t, 0.42, 0.52)) * (1 - ez(seg(t, 0.74, 0.82)));
    var op = ez(seg(t, 0, 0.36)) * (1 - ez(seg(t, 0.8, 0.98))) + 0.05 * M.wave(t, 1, 0.2) * ez(seg(t, 0.36, 0.5));
    var nib = null, dk = 0;
    if (q >= 0) {
      var r = ez(seg(q, 0, 0.12)), d = ez(seg(q, 0.14, 0.76));
      op = M.lerp(op, 1.12 * M.spring(seg(q, 0.02, 0.45)) * (1 - ez(seg(q, 0.9, 1)) * 0.1), ez(seg(q, 0, 0.1)));
      if (q < 0.14) { a = Math.max(a, r * b); } else { a = 0; b = d; }
      dk = seg(q, 0.76, 1);
      if (q >= 0.14 && q < 0.78) nib = polyAt(P, c, b);
    }
    p.ellipse(35, 92, 27, 4.6, { fill: 'leaf', w: 0.9 });
    p.path('M35 92 L58 91', { w: 0.4, detail: true });
    /* the back petals, then the line rising from the heart, then the front petals over its foot */
    [-1, 1].forEach(function (d) { lotusPetal(p, 35, 88, d * (0.12 + 1.15 * op), 26, 7.6, 'pink'); });
    [-1, 1].forEach(function (d) { lotusPetal(p, 35, 88, d * (0.06 + 0.74 * op), 31, 8.2, 'white'); });
    lotusPetal(p, 35, 88, 0, 33 + 1.5 * op, 7.6, 'pink');
    p.ellipse(35, 74, 5.2, 3.2, { fill: 'yellow', w: 0.7 });
    if (q >= 0) {
      yantLine(p, P, a, b);
      if (dk > 0) yantDots(p, 35, 4, dk, 1);
      if (nib) { p.dot(nib[0], nib[1], 1.7, 'gold'); p.circle(nib[0], nib[1], 3.6 + 0.8 * M.wave(q, 6), { ink: 'gold', w: 0.5 }); }
    } else {
      yantLine(p, P, a, b);
      var held = seg(t, 0.4, 0.78), g = seg(t, 0.4, 0.8) * 1.12;
      if (held > 0 && held < 1 && b > 0.99) p.span(P, Math.max(0, g - 0.09), Math.min(1, g), { ink: 'yellow', w: 1.4, glow: 0.7, cap: 'round' });
      if (b < 0.995 && b > 0.01) { var nb = polyAt(P, c, b); p.dot(nb[0], nb[1], 1.6, 'gold'); }
      if (dots > 0.01) yantDots(p, 35, 4, M.clamp(seg(t, 0.42, 0.62), 0, 1), M.clamp(dots * 1.2, 0, 1));
    }
    [-1, 1].forEach(function (d) { lotusPetal(p, 35, 88, d * (0.06 + 0.5 * op), 26, 8.4, 'pink'); });
  }
});

})(Dingbats);
