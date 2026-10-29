/* Khon: the head masks (หัวโขน) of the Ramakien, seen from the front as they sit on a stand or are held up.
   Hanuman white, Tosakanth deep green under a crown of stacked faces, Phra Ram green and Phra Lak gold under the
   chada, Sukreep red under a tall peaked crown, and a violet yak (ยักษ์) of the kind that guards a temple gate. */
(function (D) {
'use strict';
var M = D.math, TAU = M.TAU;

var DEEP = '#1C5E3F', DEEP2 = '#2F8A5C', RAMG = '#4FA867', VIOLET = '#7B4FB0', VIOLET2 = '#B79BE0', MAW = '#7A1626', RUBY = '#D8343B', SUK = '#D9402E', LAK = '#F5C93C';

/* ---------------------------------------------------------------- helpers */
/* draw fn once for the right side and once mirrored for the left: x is the distance from the centre line (x = 50) */
function mir(p, fn) { [1, -1].forEach(function (d) { p.at(50, 0, 0, [d, 1], function () { fn(d); }); }); }
/* a closed outline from its right half, listed from the top of the centre line to the bottom of it; [dx, y] */
function loop(h) {
  var out = [], i;
  for (i = 0; i < h.length; i++) out.push([50 + h[i][0], h[i][1]]);
  for (i = h.length - 2; i >= 1; i--) out.push([50 - h[i][0], h[i][1]]);
  return out;
}
/* y of a polyline [[dx, y] …] at dx */
function yAt(h, dx) {
  var i;
  for (i = 1; i < h.length; i++) if (dx <= h[i][0] || i === h.length - 1) { var a = h[i - 1], b = h[i], u = b[0] === a[0] ? 0 : M.clamp((dx - a[0]) / (b[0] - a[0]), 0, 1); return a[1] + (b[1] - a[1]) * u; }
  return h[h.length - 1][1];
}
/* the jaw drops: points below y0 move down by d, more the lower they are */
function drop(h, y0, y1, d) { return h.map(function (q) { return [q[0], q[1] + d * M.ease((q[1] - y0) / (y1 - y0))]; }); }
/* four-point glint with a white heart, so it shows on gold and on paper */
function glint(p, x, y, k) { if (k > 0.04) p.star(x, y, 1.0 + 4.6 * k, 0.5 + 0.7 * k, 4, { fill: 'white', w: 0.5, wob: 0.3 }); }
/* a cut jewel */
function gem(p, x, y, r, c, g) { p.poly([[x, y - r * 1.25], [x + r, y], [x, y + r * 1.25], [x - r, y]], { fill: c, w: 0.5, wob: 0.3 }); if (g) glint(p, x - r * 0.2, y - r * 0.3, g); }
/* a crescent moon centred at the origin, horns up and to the right */
function moon(p, R, o) {
  var r = R * 0.84, cx = R * 0.36, cy = -R * 0.3, d = Math.hypot(cx, cy), tc = Math.atan2(cy, cx), b = Math.acos((R * R + d * d - r * r) / (2 * R * d)), g = Math.acos((r * r + d * d - R * R) / (2 * r * d)), pc = Math.atan2(-cy, -cx), pts = [], i, a;
  for (i = 0; i <= 18; i++) { a = tc + b + (TAU - 2 * b) * i / 18; pts.push([Math.cos(a) * R, Math.sin(a) * R]); }
  for (i = 0; i <= 12; i++) { a = pc - g + 2 * g * i / 12; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  var q0 = pts[18], q1 = pts[19], q2 = pts[pts.length - 1];
  if (Math.hypot(q1[0] - q0[0], q1[1] - q0[1]) > Math.hypot(q2[0] - q0[0], q2[1] - q0[1])) pts = pts.slice(0, 19).concat(pts.slice(19).reverse());
  p.poly(pts, o);
}
/* a bulging eye: a ring, white, a big pupil that looks about, and a lid (lid 0..1) that comes down over it in the colour of the face; shut, it is a curved line */
function eye(p, x, y, r, o) {
  var lk = o.look || [0, 0], lid = o.lid || 0, px = x + lk[0] * r * 0.32, py = y + lk[1] * r * 0.32, pr = r * (o.pupil || 0.56);
  if (o.glow) p.circle(x, y, r * 1.55, { fill: 'flame', line: false, alpha: 0.5 * o.glow, glow: 0.9 * o.glow });
  p.circle(x, y, r * 1.2, { fill: o.rim || 'gold', w: 0.7 });
  p.circle(x, y, r, { fill: 'white', w: 0.55 });
  p.circle(px, py, pr, { fill: o.iris || 'black', w: 0.4, wob: 0.3 });
  if (lid < 0.7 && !o.cut) p.dot(px - pr * 0.36, py - pr * 0.4, pr * 0.3, 'white');
  if (o.cut) {
    var sg = x < 50 ? 1 : -1, ci = y - r * 0.95 + r * 1.2 * o.cut;
    p.clip(function () { p.circle(x, y, r * 1.02, { fill: 'white' }); }, function () {
      p.path('M' + (x - sg * (r + 3)) + ' ' + (y - r - 4) + ' L' + (x + sg * (r + 3)) + ' ' + (y - r - 4) + ' L' + (x + sg * (r + 3)) + ' ' + ci + ' L' + (x - sg * (r + 3)) + ' ' + (y - r * 0.95) + ' Z', { fill: o.face, w: 1, wob: 0.3 });
    });
  }
  if (lid > 0.02) {
    var ye = y - r + 2 * r * lid, bow = 1 + 1.6 * M.bump(lid) + 1.4 * lid;
    p.clip(function () { p.circle(x, y, r * 1.02, { fill: 'white' }); }, function () {
      p.path('M' + (x - r - 2) + ' ' + (y - r - 3) + ' L' + (x + r + 2) + ' ' + (y - r - 3) + ' L' + (x + r + 2) + ' ' + ye + ' Q' + x + ' ' + (ye + bow) + ' ' + (x - r - 2) + ' ' + ye + ' Z', { fill: o.face, w: 0.9, wob: 0.3 });
    });
    if (lid > 0.8) p.path('M' + (x - r * 0.85) + ' ' + (y + r * 0.05) + ' Q' + x + ' ' + (y + r * 0.78) + ' ' + (x + r * 0.85) + ' ' + (y + r * 0.05), { w: 1.15, wob: 0.3 });
  }
}
/* a small pointed tooth hanging from (x, y) down (dir 1) or standing up (dir -1) */
function tooth(p, x, y, w, h, dir, tip) { p.poly([[x - w / 2, y], [x + w / 2, y], [x + (tip || 0), y + h * dir]], { fill: 'white', w: 0.5, wob: 0.3 }); }
/* a tusk that curves: base at (x, y), hanging (dir 1) or rising (dir -1), bowing toward bow */
function tusk(p, x, y, h, w, dir, bow) {
  p.path('M' + (x - w / 2) + ' ' + y + ' C' + (x - w / 2 + bow * 0.3) + ' ' + (y + h * 0.5 * dir) + ' ' + (x + bow * 0.9) + ' ' + (y + h * 0.8 * dir) + ' ' + (x + bow) + ' ' + (y + h * dir) + ' C' + (x + w / 2 + bow * 0.6) + ' ' + (y + h * 0.6 * dir) + ' ' + (x + w / 2) + ' ' + (y + h * 0.3 * dir) + ' ' + (x + w / 2) + ' ' + y + ' Z', { fill: 'white', w: 0.6, wob: 0.4 });
}
/* a held mask sways a little on the hand that holds it; k fits the crown into the box */
function held(p, t, sway, k, fn) { p.pivot(50, 98, sway * 0.022 * M.wave(t, 1, 0.15), k, function () { p.move(0, 0.7 * M.wave(t, 2, 0.1)); fn(); }); }
/* the lid of a blink: 0 → 1 → 0 inside the window [a, b] of the loop */
function blink(t, a, b) { return M.bump(M.seg(t, a, b)); }
/* a leaf-shaped flame standing at (x, y), leaning out (dir 1 right, -1 left): the small ornament at the corners of a crown */
function flame(p, x, y, dir, h, c) {
  p.path('M' + x + ' ' + y + ' C' + (x + dir * 1.8) + ' ' + (y - h * 0.3) + ' ' + (x + dir * 3.4) + ' ' + (y - h * 0.6) + ' ' + (x + dir * 2.6) + ' ' + (y - h) + ' C' + (x + dir * 0.6) + ' ' + (y - h * 0.65) + ' ' + (x - dir * 1.2) + ' ' + (y - h * 0.45) + ' ' + (x - dir * 3.2) + ' ' + (y - h * 0.3) + ' Z', { fill: c || 'gold', w: 0.6, wob: 0.3 });
}
/* a tongue of fire standing at (x, y), h tall, w wide, the tip pushed sideways by lean; colour only, no ink */
function blaze(p, x, y, lean, h, w) {
  if (h < 0.6) return;
  p.path('M' + (x - w) + ' ' + y + ' C' + (x - w) + ' ' + (y - h * 0.5) + ' ' + (x + lean * 0.5) + ' ' + (y - h * 0.62) + ' ' + (x + lean) + ' ' + (y - h) + ' C' + (x + w * 0.6 + lean * 0.4) + ' ' + (y - h * 0.62) + ' ' + (x + w) + ' ' + (y - h * 0.45) + ' ' + (x + w) + ' ' + y + ' Z', { fill: 'flame', line: false, glow: 0.4 });
  p.path('M' + (x - w * 0.5) + ' ' + y + ' C' + (x - w * 0.5) + ' ' + (y - h * 0.3) + ' ' + (x + lean * 0.3) + ' ' + (y - h * 0.4) + ' ' + (x + lean * 0.55) + ' ' + (y - h * 0.62) + ' C' + (x + w * 0.4) + ' ' + (y - h * 0.38) + ' ' + (x + w * 0.5) + ' ' + (y - h * 0.25) + ' ' + (x + w * 0.5) + ' ' + y + ' Z', { fill: 'yellow', line: false });
}
/* a star drifting out of a mouth: leaves (x0, y0) at the start of its window u, climbs and sways to (x1, y1), then is taken back */
function drift(p, u, x0, y0, x1, y1, r, c, ph) {
  var k = M.easeOut(M.seg(u, 0, 0.22)) * (1 - M.easeIn(M.seg(u, 0.8, 1)));
  if (u <= 0 || u >= 1 || k < 0.03) return;
  var e = M.easeOut(u), x = x0 + (x1 - x0) * e + 3.5 * Math.sin(TAU * (u * 1.5 + ph)), y = y0 + (y1 - y0) * e;
  p.at(x, y, TAU * (0.1 + ph) + 1.6 * u, k * (0.85 + 0.25 * M.wave(u * 3, 1, ph)), function () { p.star(0, 0, r, r * 0.46, 5, { fill: c, w: 0.55, wob: 0.3 }); });
}

/* ---------------------------------------------------------------- the monkey face, for Hanuman and Sukreep
   st: o (mouth open 0..1), dj (jaw drop), lid, look, twR, twL (ears), brow (lift), bare (teeth bared 0..1)
   cfg: face, hatch, halo, blush, browC, nose, rim, earIn, line, crown(p), gem */
var MFACE = [[0, 27], [16, 28], [26, 34], [31, 45], [32.5, 57], [31, 69], [26.5, 82], [17, 92], [0, 97]];
function monkey(p, t, st, cfg) {
  var i, o = st.o, dj = st.dj, bare = st.bare || 0, face = loop(drop(MFACE, 60, 97, dj)), h = 5 + 12 * o, w = 23 + 1.8 * bare;
  var TOP = [[0, 71.5 - 0.6 * bare], [7, 71 - 0.6 * bare], [15, 72 - 0.4 * bare], [w - 2, 75.5], [w, 79]], BOT = [[w, 79], [w - 4, 79 + h * 0.66 + dj * 0.2], [10, 79 + h * 0.95 + dj * 0.5], [0, 79 + h + dj * 0.55]];
  var mp = [], low = [], yb = function (dx) { return 79 + yAt([[0, h + dj * 0.55], [10, h * 0.95 + dj * 0.5], [w - 4, h * 0.66 + dj * 0.2], [w, 0]], dx); }, tk = 1 + 0.45 * bare;
  for (i = 0; i < TOP.length; i++) mp.push([50 + TOP[i][0], TOP[i][1]]);
  for (i = 1; i < BOT.length; i++) mp.push([50 + BOT[i][0], BOT[i][1]]);
  for (i = BOT.length - 2; i >= 1; i--) mp.push([50 - BOT[i][0], BOT[i][1]]);
  for (i = TOP.length - 1; i >= 1; i--) mp.push([50 - TOP[i][0], TOP[i][1]]);
  for (i = 0; i < BOT.length; i++) low.push([50 - BOT[i][0], BOT[i][1]]);
  for (i = BOT.length - 2; i >= 0; i--) low.push([50 + BOT[i][0], BOT[i][1]]);
  mir(p, function (d) {            /* ears: monkey ears, a pale hollow, gold along the rim */
    var tw = d > 0 ? st.twR : st.twL;
    p.pivot(30, 56, tw * 0.2 + (st.earOut || 0), 1, function () {
      p.path('M30 47 C37 46 44 43 48 37.5 C50.5 46 49.5 57 44 62.5 C40 66 35 66 31 64 Z', { fill: cfg.face, w: 1 });
      p.path('M33 52 C38 51 42.5 48 45.4 43.5 C46 49.5 45 55 41.5 59 C38.5 61 35.5 61.5 33.6 60.5 Z', { fill: cfg.earIn, w: 0.5, alpha: 0.9 });
      p.path('M32 48 C39 47 45 44 48 38.5', { w: 0.6, ink: 'gold', detail: true });
    });
    p.circle(34.5, 65.5, 1.7, { fill: 'gold', w: 0.5, detail: true });
  });
  p.curve(face, { close: true, fill: cfg.face, w: 1.15 });
  if (cfg.hatch) p.clip(function () { p.curve(face, { close: true, fill: 'white' }); }, function () {
    mir(p, function () { p.path('M32 56 C34 68 32 82 22 94 L38 100 L38 56 Z', { fill: cfg.face, line: false, hatch: 1.05 }); });
  });
  mir(p, function () {
    p.ellipse(12.8, 51.5, 11, 10, { fill: cfg.halo, line: false, alpha: 0.7, rot: 0.1 });
    if (cfg.blush) p.ellipse(25.5, 64, 4.6, 3.4, { fill: cfg.blush, line: false, alpha: 0.5, detail: true });
    p.path('M5.4 62 C-1 66 -7 70 -8 76', { w: 0.7, ink: cfg.line || 'gold', detail: true });
  });
  mir(p, function (d) {            /* the brows: thick, flicked up at the outer end */
    var b = st.brow * (d > 0 ? 1 : 0.85);
    p.path('M2 ' + (45 - b * 0.3) + ' C6 ' + (40.5 - b) + ' 11 ' + (38.6 - b) + ' 18 ' + (38.2 - b) + ' C23 ' + (38 - b) + ' 28 ' + (38 - b * 0.7) + ' 31.5 ' + (34 - b * 0.5) + ' C30.6 ' + (40.4 - b * 0.4) + ' 27.5 ' + (44 - b * 0.3) + ' 22.5 ' + (44.2 - b * 0.3) + ' C16 ' + (43 - b * 0.6) + ' 9 ' + (43.4 - b * 0.4) + ' 2 ' + (48 - b * 0.2) + ' Z', { fill: cfg.browC, w: 0.85 });
  });
  gem(p, 50, 38.6, 2.1, cfg.gem || RUBY, 0);
  p.path('M45.8 60 C45 63.5 44 65 44.4 67 C46 69 48.5 69.8 50 69.8 C51.5 69.8 54 69 55.6 67 C56 65 55 63.5 54.2 60 C52.5 58.6 47.5 58.6 45.8 60 Z', { fill: cfg.nose, w: 0.8 });
  p.ellipse(50, 67.4, 3.6, 1.9, { fill: 'rose', w: 0.5 });
  mir(p, function () { p.path('M2.4 66.6 C2.6 65.4 4.2 65.4 4.6 66.8 C3.6 67.4 3 67.4 2.4 66.6 Z', { fill: 'night', w: 0.3, detail: true }); });
  p.curve(mp, { close: true, fill: MAW, w: 0.6 });
  p.clip(function () { p.curve(mp, { close: true, fill: MAW }); }, function () {
    p.ellipse(50, 79 + h * 0.97 + dj * 0.5, 11, 3.5 + 5 * o, { fill: 'rose', w: 0.6 });
    p.line(50, 82 + h * 0.45, 50, 78 + h * 0.97, { w: 0.4, detail: true });
  });
  mir(p, function () {
    [[2.8, 4.4, 4.6, 0], [7.4, 4.4, 4.2, 0], [12.4, 5.4, 8.6, -0.6], [17.2, 4.2, 3.4, 0], [20.6, 3.2, 2.6, 0]].forEach(function (q) { if (q[0] < w - 1) tooth(p, q[0], yAt(TOP, q[0]) + 0.1, q[1], q[2] * tk, 1, q[3]); });
    if (o > 0.4) [[3.4, 4.4, 3.2], [8, 4.4, 3.4], [13.6, 4.6, 6.2], [18, 3.6, 3]].forEach(function (q) { tooth(p, q[0], yb(q[0]) - 0.1, q[1], q[2], -1, q[0] > 12 ? 0.5 : 0); });
  });
  p.curve(low, { ink: 'red', w: 1.1, wob: 0.4 });
  p.path('M' + (50 - w) + ' 79 C' + (50 - w + 2) + ' 73.6 ' + (50 - 10) + ' 70.6 50 71.4 C' + (50 + 10) + ' 70.6 ' + (50 + w - 2) + ' 73.6 ' + (50 + w) + ' 79', { ink: 'red', w: 1.5, wob: 0.4 });
  p.circle(50, 76.2, 1.3, { fill: 'gold', w: 0.4, detail: true });
  eye(p, 37.2, 51.5, 7.2, { look: st.look, lid: st.lid, face: cfg.face, rim: cfg.rim, glow: st.glow });
  eye(p, 62.8, 51.5, 7.2, { look: st.look, lid: st.lid, face: cfg.face, rim: cfg.rim, glow: st.glow });
  cfg.crown(p);
}

/* ---------------------------------------------------------------- Hanuman */
/* หนุมาน Hanuman, the white monkey general: bulging eyes ringed in gold, thick green brows, a jewel between them,
   a flat nose, a gaping mouth with a jewel in the roof of it, and a small gold coronet.
   Idle: the mouth chatters, the eyes wander and blink, an ear twitches, a jewel in the coronet glints.
   Tap: a big yawn, eyes shut; stars and a crescent moon float out of his mouth (from the Ramakien) and rise past the crown. */
function hanCrown(p, g) {
  if (p.small) { p.poly(loop([[0, -4], [2.4, 8], [7, 15], [13, 21], [19, 26], [22.4, 31], [0, 32.6]]), { fill: 'gold', w: 1 }); p.dot(50, -5.4, 2.2, 'red'); gem(p, 50, 27.4, 2.8, RUBY, 0); return; }
  p.poly(loop([[0, -4], [1.3, 2], [3.5, 9], [0, 9.6]]), { fill: 'gold', w: 0.85 });
  p.dot(50, -5.4, 1.7, 'red');
  mir(p, function () { flame(p, 10.4, 17.2, 1, 7); });
  p.poly(loop([[0, 8], [5, 9.2], [9.4, 13], [11, 18], [0, 18]]), { fill: 'gold', w: 0.9 });
  mir(p, function () { flame(p, 16.4, 24.4, 1, 8); });
  p.poly(loop([[0, 16], [7, 17.4], [13, 20], [16.6, 25], [0, 25]]), { fill: 'gold', w: 0.9 });
  p.curve(loop([[0, 23.5], [17, 24], [21.6, 27], [22.4, 31.4], [14, 31], [0, 32.6]]), { close: true, fill: 'gold', w: 1 });
  p.path('M30 29 C38 30.4 44 31 50 31.2 C56 31 62 30.4 70 29', { w: 0.4, ink: 'red', detail: true });
  [[38, 28.2, 1.4, 'green'], [62, 28.2, 1.4, 'green']].forEach(function (q) { gem(p, q[0], q[1], q[2], q[3], 0); });
  gem(p, 50, 28, 2.3, RUBY, 0);
  gem(p, 50, 20.8, 2, RUBY, g);
  gem(p, 50, 13.4, 1.5, 'blue', 0);
  p.path('M43 22.6 C46 21.4 54 21.4 57 22.6', { w: 0.4, detail: true });
}
D.add('hanuman', {
  fam: 'khon', tags: ['hanuman', 'khon', 'mask', 'monkey', 'white monkey', 'ramakien', 'ramayana', 'thai dance', 'yawn', 'stars', 'moon', 'หนุมาน', 'หัวโขน', 'โขน'],
  loop: 3, still: 0.3, ratio: 1, tapLen: 2.6, tapRest: 0.4, burst: false,
  margin: [26, 18, 12, 18], tapMargin: [50, 46, 14, 46],
  about: 'the mouth chatters, the eyes wander and blink, an ear twitches, a coronet jewel glints',
  tapAbout: 'a huge yawn, eyes shut, and stars and a crescent moon float out of his mouth and rise past the crown',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), on = s.tap >= 0;
    var yawn = on ? M.ease(M.seg(tp, 0.04, 0.27)) * (1 - M.ease(M.seg(tp, 0.66, 0.85))) : 0;
    var st = {
      o: M.lerp(0.34 + 0.07 * M.wave(t, 3) + 0.04 * M.wave(t, 7, 0.2), 1, yawn), dj: 7 * yawn,
      lid: Math.max(blink(t, 0.38, 0.45), blink(t, 0.88, 0.92) * 0.8, on ? M.ease(M.seg(tp, 0.1, 0.24)) * (1 - M.ease(M.seg(tp, 0.8, 0.92))) : 0),
      look: [0.7 * M.wave(t, 1, 0.1), 0.3 * M.wave(t, 2, 0.3)], earOut: 0.2 * yawn,
      twR: M.bump(M.seg(t, 0.52, 0.64)) * Math.sin(TAU * 3 * M.seg(t, 0.52, 0.64)), twL: M.bump(M.seg(t, 0.56, 0.68)) * Math.sin(TAU * 3 * M.seg(t, 0.56, 0.68)),
      brow: 1.4 * yawn + 0.5 * M.wave(t, 3, 0.4)
    }, g = M.bump(M.seg(t, 0.72, 0.9));
    held(p, t, 1, 0.94, function () {
      monkey(p, t, st, { face: 'white', hatch: true, halo: 'pink', blush: 'pink', browC: 'green', nose: 'white', rim: 'gold', earIn: 'pink', crown: function () { hanCrown(p, g); } });
    });
    if (on) {            /* what the yawn lets out: stars, then the moon */
      var K = [[-52, -44, 8, 'yellow'], [50, -52, 7, 'a'], [-30, -80, 6, 'a'], [32, -94, 7.5, 'yellow'], [-64, -10, 5.5, 'a'], [64, -16, 6, 'yellow']];
      K.forEach(function (q, j) { drift(p, M.seg(tp, 0.2 + 0.05 * j, 0.8 + 0.03 * j), 50 + q[0] * 0.12, 82, 50 + q[0], 82 + q[1], q[2], q[3], j * 0.17); });
      var u = M.seg(tp, 0.2, 0.96), k = M.easeOut(M.seg(u, 0, 0.35)) * (1 - M.easeIn(M.seg(u, 0.84, 1)));
      if (k > 0.03) p.at(50 + 32 * M.easeOut(u) + 4 * Math.sin(u * 7), 84 - 108 * M.easeOut(u), -0.5 + 0.9 * u, 0.5 + 0.95 * k, function () { moon(p, 9, { fill: 'yellow', w: 0.9 }); p.dot(-1, 1.5, 0.8, 'gold'); });
    }
  }
});

/* ---------------------------------------------------------------- Sukreep */
/* สุครีพ Sukreep, the red monkey king: a red face, dark heavy brows, a tall peaked crown of narrowing tiers.
   Idle: the eyes dart left and right, a sneer slowly shows his teeth, the ears flick, a glint climbs the crown.
   Tap: he bares his teeth in a growl, brows down, and the tall crown bounces off his head three times, smaller each time. */
function sukCrown(p, g) {
  if (p.small) { p.poly(loop([[0, -12], [2, 0], [6, 10], [11, 18], [15, 24], [22.6, 31.6], [0, 32.8]]), { fill: 'gold', w: 1 }); p.poly(loop([[0, 26.4], [18, 27], [22.6, 31.6], [0, 32.8]]), { fill: RUBY, w: 0.8 }); p.dot(50, -13.4, 2.2, 'red'); return; }
  var T = [[19, 15.5, 24.5, 8.5, 0.6], [14, 11, 16.2, 8.2, 0.5], [9.6, 7, 8.4, 7.4, 0.4], [5.6, 3.6, 1.6, 6.6, 0.3]], i, q;
  p.poly(loop([[0, -12], [0.9, -8], [2.4, -4.6], [0, -4.4]]), { fill: 'gold', w: 0.8 });
  p.dot(50, -13.4, 1.4, 'red');
  for (i = T.length - 1; i >= 0; i--) {
    q = T[i];
    mir(p, function () { flame(p, q[0] - 0.4, q[2], 1, 4.6 + i * 0.4); });
    p.poly(loop([[0, q[2] - q[3]], [q[1], q[2] - q[3]], [(q[0] + q[1]) / 2 + q[4], q[2] - q[3] / 2], [q[0], q[2]], [0, q[2]]]), { fill: 'gold', w: 0.85 });
    p.path('M' + (50 - q[1] + 1.4) + ' ' + (q[2] - q[3] + 2.1) + ' L' + (50 + q[1] - 1.4) + ' ' + (q[2] - q[3] + 2.1), { w: 0.4, detail: true });
    gem(p, 50, q[2] - q[3] * 0.48, 1.35 + i * 0.2, i % 2 ? 'blue' : RUBY, g * (i === 1 ? 1 : 0));
  }
  p.curve(loop([[0, 24.2], [17, 24.8], [21.6, 27.4], [22.6, 31.6], [14, 31.2], [0, 32.8]]), { close: true, fill: RUBY, w: 1 });
  p.path('M29 28.4 C38 29.6 44 30.2 50 30.4 C56 30.2 62 29.6 71 28.4', { w: 0.5, ink: 'gold', detail: true });
  [[50, 28.1, 2.1], [38, 27.8, 1.4], [62, 27.8, 1.4], [28.5, 28.4, 1], [71.5, 28.4, 1]].forEach(function (q2) { gem(p, q2[0], q2[1], q2[2], 'gold', 0); });
}
D.add('sukreep', {
  fam: 'khon', tags: ['sukreep', 'sugriva', 'khon', 'mask', 'monkey king', 'red monkey', 'ramakien', 'ramayana', 'crown', 'growl', 'สุครีพ', 'หัวโขน', 'โขน'],
  loop: 2.8, still: 0.3, ratio: 1, tapLen: 1.9, tapRest: 0.5, burst: false,
  margin: [14, 18, 12, 18], tapMargin: [24, 24, 14, 24],
  about: 'the eyes dart side to side, a sneer slowly shows his teeth, the ears flick, a glint climbs the tall crown',
  tapAbout: 'he bares his teeth in a growl, brows down, and the tall crown bounces off his head three times, smaller each time',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), on = s.tap >= 0, i;
    var gr = on ? M.ease(M.seg(tp, 0.04, 0.2)) * (1 - M.ease(M.seg(tp, 0.72, 0.92))) : 0, trem = gr * 0.35 * Math.sin(TAU * 9 * tp);
    var sneer = M.bump(M.seg(t, 0.28, 0.52)) * 0.75, bare = Math.max(sneer, gr);
    var u = on ? M.seg(tp, 0.14, 0.92) : 1, hop = on && u < 1 ? Math.abs(Math.sin(TAU * 1.5 * u)) * Math.exp(-3.2 * u) * 11 : 0, lx = on && u < 1 ? 0.06 * Math.sin(TAU * 3 * u) * (1 - u) : 0;
    var st = {
      o: M.lerp(0.3 - 0.1 * sneer + 0.03 * M.wave(t, 3), 0.55, gr), dj: 2 * gr, bare: bare,
      lid: Math.max(blink(t, 0.66, 0.72), 0.25 * gr),
      look: [0.9 * (M.ease(M.seg(t, 0.2, 0.26)) - 2 * M.ease(M.seg(t, 0.5, 0.56)) + M.ease(M.seg(t, 0.8, 0.86))) + trem, 0.15 * M.wave(t, 1, 0.2)],
      twL: M.bump(M.seg(t, 0.1, 0.22)) * Math.sin(TAU * 3 * M.seg(t, 0.1, 0.22)), twR: M.bump(M.seg(t, 0.14, 0.26)) * Math.sin(TAU * 3 * M.seg(t, 0.14, 0.26)),
      brow: 1.6 * M.bump(M.seg(t, 0.6, 0.72)) - 2.6 * gr - 0.8 * sneer, earOut: -0.1 * gr
    }, gl = M.bump(M.seg(M.frac(t * 1 - 0.08), 0.1, 0.5));
    held(p, t, 1, 0.9, function () {
      p.move(trem * 1.2, 0);
      monkey(p, t, st, { face: SUK, halo: 'yellow', blush: 'orange', browC: '#4A1410', nose: '#B3281C', rim: 'gold', earIn: 'orange', line: 'gold', gem: 'blue', crown: function () {
        var sq = hop < 1.2 && on && u < 1 ? 1 - 0.05 * (1.2 - hop) / 1.2 : 1;
        p.pivot(50, 32, lx, [1 / sq, sq], function () { p.move(0, -hop); sukCrown(p, gl); });
        if (hop > 2.5) [-1, 1].forEach(function (d) { for (i = 0; i < 2; i++) p.line(50 + d * (27 + i * 3), 28 - hop * 0.2 + i * 4, 50 + d * (30 + i * 3.4), 25 - hop * 0.2 + i * 4, { w: 0.7, cap: 'round', ink: 'a' }); });
      } });
      if (gr > 0.5) mirSparks(p, gr);
    });
  }
});
/* the gleam on a bared canine */
function mirSparks(p, gr) { [-1, 1].forEach(function (d) { glint(p, 50 + d * 12.6, 83.4, M.bump(M.seg(gr, 0.5, 1)) * 0.8); }); }

/* ---------------------------------------------------------------- the demon face, for Tosakanth and the yak
   st: o (snarl 0..1), dj (jaw drop), lid, look, glare (0..1), glow, pup (pupil size), nose (flare)
   cfg: face, face2, inner, rim, iris, browC, browInk, line, ears(p, st), deco(p), crown(p), fang 'curved' | 'straight' */
var DF = [[0, 44], [17, 45], [28, 50], [32.5, 59], [33, 69], [29.5, 81], [20.5, 91.5], [0, 97]];
function demon(p, t, st, cfg) {
  var i, o = st.o, dj = st.dj, g = st.glare || 0, face = loop(drop(DF, 66, 97, dj)), hh = 3.5 + 9 * o, curved = cfg.fang !== 'straight', fl = st.flare || 0;
  var TOP = [[0, 81], [6, 79.6], [13, 81.2], [19, 80], [22.5, 76.6]], BOT = [[22.5, 76.6], [20.6, 81 + hh * 0.5 + dj * 0.15], [11, 81.6 + hh * 0.96 + dj * 0.45], [0, 81.8 + hh + dj * 0.5]];
  var mp = [], low = [], yb = function (dx) { return yAt([[0, 81.8 + hh + dj * 0.5], [11, 81.6 + hh * 0.96 + dj * 0.45], [20.6, 81 + hh * 0.5 + dj * 0.15], [22.5, 76.6]], dx); };
  for (i = 0; i < TOP.length; i++) mp.push([50 + TOP[i][0], TOP[i][1]]);
  for (i = 1; i < BOT.length; i++) mp.push([50 + BOT[i][0], BOT[i][1]]);
  for (i = BOT.length - 2; i >= 1; i--) mp.push([50 - BOT[i][0], BOT[i][1]]);
  for (i = TOP.length - 1; i >= 1; i--) mp.push([50 - TOP[i][0], TOP[i][1]]);
  for (i = 0; i < BOT.length; i++) low.push([50 - BOT[i][0], BOT[i][1]]);
  for (i = BOT.length - 2; i >= 0; i--) low.push([50 + BOT[i][0], BOT[i][1]]);
  cfg.ears(p, st);
  p.curve(face, { close: true, fill: cfg.face, w: 1.15 });
  cfg.deco(p, st);
  mir(p, function () {            /* the brows: heavy, joined over the nose, lowered when he glares */
    var b = 1.5 * g;
    p.path('M0.4 ' + (56.8 + b) + ' C6 ' + (54.6 + b) + ' 14 ' + (51.6 + b) + ' 26.6 ' + (49 + b * 0.6) + ' C27.8 ' + (52.4 + b * 0.6) + ' 26 ' + (55.2 + b * 0.5) + ' 22.5 ' + (55.8 + b * 0.5) + ' C16 ' + (55.6 + b) + ' 9 ' + (58.8 + b) + ' 0.4 ' + (63 + b) + ' Z', { fill: cfg.browC, ink: cfg.browInk, w: 1.2 });
  });
  p.curve(loop([[0, 62], [3, 65], [6.8, 70], [8.4, 74.4], [5.8, 77.2], [2, 77.8], [0, 77.6]]), { close: true, fill: cfg.face2, w: 0.85 });
  mir(p, function () { p.ellipse(4.6 + fl, 75.4, 2 + fl * 0.6, 1.3 + fl * 0.5, { fill: 'night', w: 0.3, rot: -0.35, detail: true }); });
  p.curve(mp, { close: true, fill: MAW, w: 0.6 });
  p.clip(function () { p.curve(mp, { close: true, fill: MAW }); }, function () { p.ellipse(50, 80.5 + hh + dj * 0.5, 9, 2 + 3 * o, { fill: 'rose', w: 0.5 }); });
  mir(p, function () {
    [[2.8, 3.4, 3.2], [12.6, 3.4, 3.4], [17.4, 3.2, 3]].forEach(function (q) { tooth(p, q[0], yAt(TOP, q[0]) + 0.1, q[1], q[2], 1, 0); });
    if (o > 0.35) [[4, 3.4, 2.8], [8, 3.4, 3.2]].forEach(function (q) { tooth(p, q[0], yb(q[0]) - 0.1, q[1], q[2], -1, 0); });
  });
  p.curve(low, { ink: 'red', w: 1.35, wob: 0.4 });
  p.path('M' + (50 - 22.5) + ' 76.6 C' + (50 - 20.5) + ' 80.5 ' + (50 - 17) + ' 80.6 ' + (50 - 13) + ' 81.3 C' + (50 - 8) + ' 79 ' + (50 - 4) + ' 79.4 50 81.2 C' + (50 + 4) + ' 79.4 ' + (50 + 8) + ' 79 ' + (50 + 13) + ' 81.3 C' + (50 + 17) + ' 80.6 ' + (50 + 20.5) + ' 80.5 ' + (50 + 22.5) + ' 76.6', { ink: 'red', w: 1.7, wob: 0.4 });
  mir(p, function () {
    var bw = curved ? 1.7 : 0.4;
    tusk(p, 7.4, 80.4, 9.5 + 2 * st.fang, 3.8, 1, bw);
    tusk(p, 15, yb(15) + 0.6, 11.5 + 2 * st.fang, 4, -1, curved ? 2.6 : 0.6);
  });
  eye(p, 37.4, 60.5, 6.4, { look: st.look, lid: st.lid, face: cfg.face, rim: cfg.rim, iris: cfg.iris, glow: st.glow, pupil: st.pup, cut: st.cut });
  eye(p, 62.6, 60.5, 6.4, { look: st.look, lid: st.lid, face: cfg.face, rim: cfg.rim, iris: cfg.iris, glow: st.glow, pupil: st.pup, cut: st.cut });
  cfg.crown(p, st);
  if (cfg.fx) cfg.fx(p, st);
}
function earring(p, x, y, sw, ring) {
  p.pivot(x, y, sw, 1, function () {
    if (ring) { p.circle(x, y + 4.4, 3.6, { ink: 'gold', w: 1.6 }); p.dot(x, y + 8.4, 1.5, RUBY); }
    else { p.line(x, y, x, y + 5.4, { w: 0.7 }); p.circle(x, y + 8, 2.8, { fill: 'gold', w: 0.7 }); p.dot(x, y + 8, 1, RUBY); }
  });
}
/* a face of the crown: green, pointed under the chin, eyes that light up, a red mouth with two fangs */
function mini(p, x, y, rx, ry, lit, c) {
  p.at(x, y, 0, 1 + 0.2 * lit, function () {
    p.path('M' + (-rx) + ' -0.8 C' + (-rx) + ' ' + (-ry * 1.2) + ' ' + rx + ' ' + (-ry * 1.2) + ' ' + rx + ' -0.8 C' + rx + ' ' + (ry * 0.6) + ' ' + (rx * 0.5) + ' ' + ry + ' 0 ' + ry + ' C' + (-rx * 0.5) + ' ' + ry + ' ' + (-rx) + ' ' + (ry * 0.6) + ' ' + (-rx) + ' -0.8 Z', { fill: c, w: 0.6, wob: 0.3 });
    p.line(-rx * 0.9, -ry * 0.6, rx * 0.9, -ry * 0.6, { ink: 'gold', w: 0.6, detail: true, wob: 0.2 });
    [-1, 1].forEach(function (d) {
      if (lit > 0.2) p.circle(d * rx * 0.46, -ry * 0.16, 0.95 + 0.6 * lit, { fill: 'yellow', w: 0.3, glow: 0.8 * lit });
      else p.dot(d * rx * 0.46, -ry * 0.16, 0.75, 'black');
    });
    p.line(-rx * 0.5, ry * 0.42, rx * 0.5, ry * 0.42, { ink: 'red', w: 1, detail: true, wob: 0.2 });
    [-1, 1].forEach(function (d) { p.poly([[d * rx * 0.5 - 0.5, ry * 0.42], [d * rx * 0.5 + 0.5, ry * 0.42], [d * rx * 0.5, ry * 0.42 + 1.8 + lit]], { fill: 'white', w: 0.2, detail: true }); });
  });
}

/* ---------------------------------------------------------------- Tosakanth */
/* ทศกัณฐ์ Tosakanth, the demon king of Lanka: a deep green face with gold and blue lines, bulging eyes, bright red lips,
   curved tusks, under a crown in tiers: a gold cap, rows of his faces, a celestial face and a spire.
   Idle: the eyes glint and blink, the earrings swing, the faces of the crown light up one after another, bottom to top.
   Tap: the faces wake in turn and glare, then the king himself glares: brows down, eyes blazing, tusks bared, sparks. */
function tosCrown(p, st) {
  var L = st.lit;
  if (p.small) {
    p.poly(loop([[0, -4.6], [0.9, 0], [2.8, 4.8], [0, 5.2]]), { fill: 'gold', w: 0.9 }); p.dot(50, -5.8, 2, 'red');
    p.poly(loop([[0, 5], [5.2, 5.4], [5.8, 14.4], [0, 14.4]]), { fill: DEEP2, w: 0.9 }); p.poly(loop([[0, 15.2], [14.6, 15.6], [15.2, 25.2], [0, 25.2]]), { fill: DEEP, w: 0.9 });
    p.poly(loop([[0, 26], [26.4, 26.4], [27, 38], [0, 38]]), { fill: DEEP, w: 0.9 });
    p.poly(loop([[0, 24.6], [17.4, 24.8], [18, 25.8], [0, 26]]), { fill: 'gold', w: 0.8 }); p.poly(loop([[0, 14], [8, 14.2], [8.6, 15], [0, 15.2]]), { fill: 'gold', w: 0.8 });
  } else {
  p.poly(loop([[0, -4.6], [0.9, 0], [2.8, 4.8], [0, 5.2]]), { fill: 'gold', w: 0.8 });
  p.dot(50, -5.8, 1.4, 'red');
  p.poly(loop([[0, 13.6], [8, 13.8], [9.4, 15.6], [0, 15.8]]), { fill: 'gold', w: 0.7 });
  mini(p, 50, 9.4, 3.9, 4.4, L[8], DEEP2);
  p.poly(loop([[0, 24.2], [17, 24.4], [18.6, 26.2], [0, 26.4]]), { fill: 'gold', w: 0.75 });
  [-1, 1].forEach(function (d, j) { mini(p, 50 + d * 10.8, 19.8, 4.2, 4.7, L[5 + (d > 0 ? 2 : 0)], DEEP); });
  mini(p, 50, 19.8, 4.4, 4.9, L[6], DEEP);
  p.poly(loop([[0, 35.4], [26, 35.6], [27.8, 37.2], [28.2, 38.6], [0, 38.8]]), { fill: 'gold', w: 0.85 });
  [-2, 2, -1, 1, 0].forEach(function (k) { var a = Math.abs(k); mini(p, 50 + k * 10.6, 30.6 + a * 0.4, 4.6 - a * 0.5, 5.1 - a * 0.4, L[k + 2], DEEP); });
  }
  p.curve(loop([[0, 38.4], [19, 39], [27, 42.4], [31.4, 48.4], [17, 47.2], [0, 49]]), { close: true, fill: 'gold', w: 1 });
  p.path('M20 43.2 C30 44.4 40 44.8 50 45 C60 44.8 70 44.4 80 43.2', { w: 0.45, ink: 'red', detail: true });
  gem(p, 50, 43.4, 2.4, RUBY, st.g); gem(p, 38, 43.6, 1.6, 'blue', 0); gem(p, 62, 43.6, 1.6, 'blue', 0); gem(p, 28, 45, 1.2, 'green', 0); gem(p, 72, 45, 1.2, 'green', 0);
}
D.add('tosakanth', {
  fam: 'khon', tags: ['tosakanth', 'thotsakan', 'ravana', 'demon king', 'khon', 'mask', 'ten faces', 'crown', 'yak', 'ramakien', 'ramayana', 'thai dance', 'ทศกัณฐ์', 'หัวโขน', 'โขน'],
  loop: 3.2, still: 0.3, ratio: 1, tapLen: 2.5, tapRest: 0.6, burst: false,
  margin: [12, 18, 8, 18], tapMargin: [16, 20, 12, 20],
  about: 'the faces of the crown light up one after another, bottom to top; the eyes glint and blink; the earrings swing',
  tapAbout: 'the crown faces wake one after another and glare, then Tosakanth glares: brows down, eyes ablaze with flame, tusks bared',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), on = s.tap >= 0, lit = [], i;
    var g = on ? M.ease(M.seg(tp, 0.5, 0.64)) * (1 - M.ease(M.seg(tp, 0.84, 0.98))) : 0, shake = g * Math.sin(TAU * 11 * tp);
    for (i = 0; i < 9; i++) lit.push(on ? M.ease(M.seg(tp, 0.04 + 0.05 * i, 0.16 + 0.05 * i)) * (1 - M.ease(M.seg(tp, 0.8 + 0.012 * i, 0.94))) : M.bump(M.seg(M.frac(t - 0.07 * i), 0, 0.15)));
    var st = {
      o: M.lerp(0.22 + 0.06 * M.wave(t, 2, 0.3), 0.9, g), dj: 3 * g, glare: g, glow: g, pup: 0.56 - 0.12 * g, lid: Math.max(blink(t, 0.58, 0.64), blink(t, 0.9, 0.94) * 0.7),
      look: [0.5 * M.wave(t, 1, 0.1) * (1 - g), 0.2 * M.wave(t, 2, 0.4) * (1 - g)], flare: 0.8 * g, fang: g, lit: lit, g: M.bump(M.seg(t, 0.3, 0.5))
    };
    held(p, t, 1, 0.97, function () {
      p.move(shake * 0.9, 0);
      demon(p, t, st, {
        face: DEEP, face2: DEEP2, rim: 'gold', iris: 'black', browC: '#0F3D29', browInk: 'gold', fang: 'curved',
        ears: function () {
          mir(p, function (d) {
            p.path('M32 58 C38 58 44 53 48.5 43 C51 52.5 49.5 63 44 68 C40.5 71 36 71 33 69 Z', { fill: DEEP2, w: 1 });
            p.path('M35 60 C39.5 60 44 56 47.2 49 C48 55.5 46.5 61.5 42.8 65.2 C40 67 37.5 67 35.6 65.8 Z', { fill: '#14452E', w: 0.5 });
            p.path('M33 58.6 C39.5 58.4 45 54 48.4 45', { w: 0.6, ink: 'gold', detail: true });
            earring(p, 36.5, 69.4, 0.2 * M.wave(t, 1, d > 0 ? 0.1 : 0.17), false);
          });
        },
        deco: function () {
          mir(p, function () {
            p.ellipse(25, 66, 5.5, 8, { fill: DEEP2, line: false, alpha: 0.55, rot: 0.2 });
            p.path('M31.4 61 C32.8 69 31 77 26 84.4', { w: 0.8, ink: 'gold', detail: true });
            p.path('M28 63 C29 70 27 76 22.4 81', { w: 0.8, ink: 'blue', detail: true });
            p.path('M9 49.6 C14 48 19 48.6 24 51', { w: 0.8, ink: 'blue', detail: true });
            p.path('M11 91.6 C7 93.4 3.4 93.8 0 93.8', { w: 0.8, ink: 'blue', detail: true });
          });
          p.path('M50 49.4 C52.4 52 52.4 54.8 50 57.6 C47.6 54.8 47.6 52 50 49.4 Z', { fill: 'gold', w: 0.5, detail: true });
        },
        fx: function (q, c) {
          if (g > 0.15) [-1, 1].forEach(function (d) {
            [[-5, 0.66, 0.2, -3.4], [0, 1, 0, 0.6], [5, 0.74, 0.45, 3.4]].forEach(function (f) {
              var h = g * f[1] * (17 + 3.4 * Math.sin(TAU * 4 * tp + f[2] * TAU));
              blaze(p, 50 + d * (12.6 + f[0] * 0.8), 55, d * f[3] + 0.6 * Math.sin(TAU * 5 * tp + f[2] * TAU), h, 3.3);
            });
          });
        },
        crown: function (q, c) { tosCrown(p, c); }
      });
    });
  }
});

/* ---------------------------------------------------------------- the yak */
/* ยักษ์ yak, the demon guardian of a temple gate, here in violet: a violet face with pale lilac round the eyes, nose and mouth,
   bulging eyes ringed in red, straight white fangs, human-style ear flaps with gold hoops, and a gold crown topped with a gourd (น้ำเต้า).
   Idle: the eyes glare about and the brows twitch, the nostrils flare, the hoops swing, the gourd jewel glints.
   Tap: the eyes roll round in their sockets and the fangs clack three times, each with a spark where they meet. */
function yakCrown(p, st) {
  if (p.small) { p.curve(loop([[0, 2.8], [3, 3.4], [5.2, 6.6], [5.4, 10.8], [4, 13.8], [3.8, 14.8], [7.8, 16.8], [9.2, 21.6], [8, 26.6], [0, 28.8]]), { close: true, fill: 'gold', w: 1 }); p.poly(loop([[0, 27], [9, 27.6], [13, 31.4], [16.8, 36.4], [27.4, 47.4], [0, 48.4]]), { fill: 'gold', w: 1 }); p.dot(50, 1.2, 2, 'red'); gem(p, 50, 42, 2.8, 'blue', 0); return; }
  p.curve(loop([[0, 2.8], [3, 3.4], [5.2, 6.6], [5.4, 10.8], [4, 13.8], [3.8, 14.8], [7.8, 16.8], [9.2, 21.6], [8, 26.6], [0, 28.8]]), { close: true, fill: 'gold', w: 0.95 });
  p.dot(50, 1.2, 1.5, 'red'); p.line(50, 1.4, 50, 3.2, { w: 0.6 });
  p.path('M47.8 7 C47 10 47.4 12 48.6 13.4', { w: 0.4, detail: true }); p.path('M52.2 7 C53 10 52.6 12 51.4 13.4', { w: 0.4, detail: true });
  gem(p, 50, 21, 2.3, RUBY, st.g);
  p.path('M43 18.6 C46 17.4 54 17.4 57 18.6', { w: 0.4, detail: true });
  mir(p, function () { flame(p, 8.6, 27.6, 1, 6.4); flame(p, 15.6, 36, 1, 7); });
  p.poly(loop([[0, 27], [9, 27.6], [13, 31.4], [16.8, 36.4], [0, 36.4]]), { fill: 'gold', w: 0.9 });
  p.curve(loop([[0, 36.8], [18, 37.4], [25, 41], [27.4, 47.4], [15, 46.6], [0, 48.4]]), { close: true, fill: 'gold', w: 1 });
  p.path('M24 43.8 C33 45 42 45.4 50 45.6 C58 45.4 67 45 76 43.8', { w: 0.45, ink: 'red', detail: true });
  gem(p, 50, 42, 2.4, 'blue', 0); gem(p, 37, 43, 1.6, RUBY, 0); gem(p, 63, 43, 1.6, RUBY, 0); gem(p, 27, 44.6, 1.2, 'green', 0); gem(p, 73, 44.6, 1.2, 'green', 0);
  p.path('M36 32 C44 30.4 56 30.4 64 32', { w: 0.4, detail: true });
}
D.add('yak', {
  fam: 'khon', tags: ['yak', 'yaksha', 'giant', 'demon', 'guardian', 'temple gate', 'khon', 'mask', 'violet', 'fangs', 'ramakien', 'ยักษ์', 'หัวโขน', 'โขน'],
  loop: 2.8, still: 0.3, ratio: 1, tapLen: 2.1, tapRest: 0.5, burst: false,
  margin: [12, 18, 10, 18], tapMargin: [14, 22, 12, 22],
  about: 'the eyes glare about, the brows twitch, the nostrils flare, the gold hoops swing, the gourd jewel glints',
  tapAbout: 'the eyes roll round and round and the fangs clack three times, a spark at each clack',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), on = s.tap >= 0, u = on ? M.seg(tp, 0.12, 0.76) : 0, c = on && u > 0 && u < 1 ? Math.abs(Math.sin(TAU * 1.5 * u)) : 0, roll = on ? M.ease(M.seg(tp, 0.04, 0.74)) : 0, i;
    var st = {
      o: on ? 0.08 + 0.9 * c : 0.22 + 0.1 * M.wave(t, 1, 0.1) + 0.05 * M.wave(t, 3), dj: on ? 4 * c : 0, glare: on ? 0.4 : 0.35 + 0.25 * M.wave(t, 1, 0.5), pup: on ? 0.42 : 0.5,
      lid: Math.max(blink(t, 0.7, 0.76) * 0.9, 0), glow: on ? 0.55 * M.bump(M.seg(tp, 0, 0.8)) : 0, cut: on ? 0.1 : 0.42 + 0.12 * M.wave(t, 1, 0.5),
      look: on ? [1.1 * Math.cos(TAU * 2.5 * roll), 1.1 * Math.sin(TAU * 2.5 * roll)] : [0.8 * M.wave(t, 1, 0.05) + 0.2 * M.wave(t, 3), 0.25 * M.wave(t, 2, 0.3)],
      flare: 0.6 + 0.6 * M.wave(t, 2, 0.2) + (on ? 0.5 : 0), fang: on ? c : 0.2 * M.wave(t, 2, 0.4), g: M.bump(M.seg(t, 0.55, 0.78))
    }, rat = on && u > 0 && u < 1 ? 0.5 * Math.sin(TAU * 1.5 * u * 2) * (1 - 0.5 * u) : 0;
    held(p, t, 1, 0.97, function () {
      p.move(rat * 0.5, 0);
      demon(p, t, st, {
        face: VIOLET, face2: VIOLET2, rim: 'red', iris: 'black', browC: '#3F2468', browInk: 'gold', fang: 'straight',
        ears: function () {
          mir(p, function (d) {
            p.path('M32 56 C37.5 53 42.4 55 42.8 61 C43.2 67 40 72 35 72.6 C33 72.7 32 71.6 32 70 Z', { fill: VIOLET, w: 1 });
            p.path('M35.4 58 C38.6 57.4 40.4 59.6 40.4 62.6 C40.4 65.6 38.6 68 36.6 68.4', { w: 0.5, detail: true });
            p.path('M31.4 54 C35.4 52 40.4 46 44 35 C47.4 44.4 46.2 53.6 42 59.6 C39.4 56.6 35.4 55.6 31.4 56.4 Z', { fill: 'gold', w: 0.85 });
            p.path('M35 52.8 C38.6 50 41.4 45.6 43.4 40.6', { w: 0.4, ink: 'red', detail: true });
            earring(p, 37, 71, 0.22 * M.wave(t, 1, d > 0 ? 0.1 : 0.17) + rat * 0.3, true);
          });
        },
        deco: function () {
          mir(p, function () { p.ellipse(12.8, 60.6, 11.6, 10.6, { fill: VIOLET2, line: false, alpha: 0.75, rot: 0.1 }); });
          p.ellipse(50, 83, 22, 9.4, { fill: VIOLET2, line: false, alpha: 0.65 });
          mir(p, function () {
            p.path('M31.4 62 C32.8 70 31 78 26 85', { w: 0.8, ink: 'gold', detail: true });
            p.path('M9 49.6 C14 48 19 48.6 24 51', { w: 0.8, ink: 'gold', detail: true });
          });
          p.path('M50 49.4 C52.4 52 52.4 54.8 50 57.6 C47.6 54.8 47.6 52 50 49.4 Z', { fill: RUBY, w: 0.5, detail: true });
        },
        crown: function (q, c) { yakCrown(p, c); }
      });
      if (on) [0.333, 0.667, 1].forEach(function (v) {
        var kk = M.bump(M.seg(tp, 0.12 + 0.64 * v - 0.04, 0.12 + 0.64 * v + 0.1));
        if (kk > 0.05) [-1, 1].forEach(function (d) { p.star(50 + d * 11.6, 85.5, 2 + 6 * kk, 1 + 1.4 * kk, 4, { fill: 'yellow', w: 0.6, wob: 0.3 }); });
      });
    });
  }
});

/* ---------------------------------------------------------------- the princes: Phra Ram and Phra Lak
   A human face, serene: a closed mouth, an almond eye under a heavy lid, a fine arched brow, a jewel between the brows,
   and the chada, a tall gold crown rising in tiers to a spire, with a gold leaf (กรรเจียก) standing at each side.
   st: lid, look, sm (smile), kw (the leaves' swing), lit[4] (tiers lit), sheen (x of the sheen, or -1)
   cfg: face, cheek, lip, gems [tier gem colours], band */
var PF = [[0, 40], [13, 41], [20.5, 46], [23, 56], [22.5, 67], [18.5, 79], [11.5, 89.5], [0, 95]];
function pEye(p, x, y, d, st, face) {
  var lk = st.look, k = M.clamp(0.3 + 0.7 * st.lid, 0, 1), top = y - 3.9, ye = top + 7.8 * k;
  var al = 'M' + (x - 7.2) + ' ' + (y + 0.7) + ' C' + (x - 4.2) + ' ' + (y - 3.9) + ' ' + (x + 3.8) + ' ' + (y - 4.3) + ' ' + (x + 7.4) + ' ' + (y - 1.4) + ' C' + (x + 4) + ' ' + (y + 4.1) + ' ' + (x - 3.6) + ' ' + (y + 4.1) + ' ' + (x - 7.2) + ' ' + (y + 0.7) + ' Z';
  p.path(al, { fill: 'white', w: 0.6, wob: 0.3 });
  p.clip(al, function () {
    p.circle(x + lk[0] * 2.4 * d, y + 0.5 + lk[1] * 1.2, 3.5, { fill: 'black', w: 0.3, wob: 0.2 });
    p.dot(x + lk[0] * 2.4 * d - 1, y - 0.6 + lk[1] * 1.2, 0.9, 'white');
    p.rect(x - 9, top - 3, 18, ye - top + 3, { fill: face, line: false });
    p.path('M' + (x - 8) + ' ' + (ye + 0.4) + ' Q' + x + ' ' + (ye + 1.8) + ' ' + (x + 8.4) + ' ' + (ye - 0.4), { w: 0.6, wob: 0.2 });
  });
  p.path('M' + (x - 7.6) + ' ' + (y + 0.8) + ' C' + (x - 4.2) + ' ' + (y - 4) + ' ' + (x + 3.8) + ' ' + (y - 4.5) + ' ' + (x + 7.6) + ' ' + (y - 1.5) + ' L' + (x + 10) + ' ' + (y - 3), { w: 1.3, wob: 0.3 });
  p.path('M' + (x - 5.6) + ' ' + (y + 2) + ' C' + (x - 2) + ' ' + (y + 4.2) + ' ' + (x + 3) + ' ' + (y + 4.2) + ' ' + (x + 6) + ' ' + (y + 0.6), { w: 0.4, detail: true, alpha: 0.6 });
}
function chada(p, st, cfg) {
  var L = st.lit, G = cfg.gems;
  if (p.small) { p.poly(loop([[0, -5], [1.6, 4], [5, 14], [9.4, 24], [14, 32], [21, 40], [21.8, 43.4], [0, 44.8]]), { fill: 'gold', w: 1 }); p.dot(50, -6.2, 2, 'red'); gem(p, 50, 39.6, 2.8, G[0], 0); return; }
  p.poly(loop([[0, -5], [0.8, 0], [2.2, 6.4], [0, 6.8]]), { fill: 'gold', w: 0.8 });
  p.dot(50, -6.2, 1.5, 'red');
  mir(p, function () { flame(p, 6.2, 14.8, 1, 4.2); });
  p.poly(loop([[0, 5.8], [3.4, 6.4], [5.2, 10], [6.6, 15], [0, 15]]), { fill: 'gold', w: 0.85 });
  gem(p, 50, 10.4, 1.3, G[3], L[3]);
  mir(p, function () { flame(p, 10.4, 25, 1, 5.2); });
  p.poly(loop([[0, 14.6], [5, 15.4], [8.8, 20], [10.8, 25.4], [0, 25.4]]), { fill: 'gold', w: 0.85 });
  gem(p, 50, 20.2, 1.6, G[2], L[2]);
  mir(p, function () { flame(p, 15.6, 35.6, 1, 6); });
  p.poly(loop([[0, 24.8], [7, 26], [12.4, 31], [15.8, 36.2], [0, 36.2]]), { fill: 'gold', w: 0.9 });
  gem(p, 50, 30.4, 1.9, G[1], L[1]);
  [14.4, 24.2].forEach(function (yy, j) { p.path('M' + (50 - 9 + j * 2.6) + ' ' + yy + ' Q50 ' + (yy + 2.2) + ' ' + (50 + 9 - j * 2.6) + ' ' + yy, { w: 0.4, detail: true }); });
  p.curve(loop([[0, 35.4], [15, 36], [20.6, 39.2], [21.8, 43.4], [14, 43.2], [0, 44.8]]), { close: true, fill: 'gold', w: 1 });
  p.path('M29.4 40.4 C37 41.6 43.6 42.2 50 42.4 C56.4 42.2 63 41.6 70.6 40.4', { w: 0.5, ink: 'red', detail: true });
  gem(p, 50, 40, 2.3, G[0], L[0]); gem(p, 40, 39.6, 1.4, G[2], 0); gem(p, 60, 39.6, 1.4, G[2], 0); gem(p, 31, 40.4, 1, 'white', 0); gem(p, 69, 40.4, 1, 'white', 0);
}
/* points along a cubic, for the spine of the ornament */
function cub(a, b, c, d, n) {
  var o = [], i, u, v;
  for (i = 0; i <= n; i++) { u = i / n; v = 1 - u; o.push([v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0], v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1]]); }
  return o;
}
/* the กรรเจียก: a gold flame-leaf rooted at the side of the crown band, behind the ear, sweeping out and up with its tip curling outward;
   the outer edge is serrated like a kranok, a lighter inlay runs up the middle with a thin gold line round it, a ruby sits at the root.
   It pivots at its root, a little late after the head. */
var KSP = cub([22.6, 47], [27.2, 54], [31.4, 46.6], [31.8, 35], 12).concat(cub([31.8, 35], [32, 28.4], [33.4, 23.4], [38.6, 20], 9).slice(1));
function kranok(p, ang, c) {
  var sp = KSP, n = sp.length, O = [], I = [], M2 = [], i, s, a, b, d, nx, ny, w;
  for (i = 0; i < n; i++) {
    s = i / (n - 1); a = sp[Math.max(0, i - 1)]; b = sp[Math.min(n - 1, i + 1)]; d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; nx = -(b[1] - a[1]) / d; ny = (b[0] - a[0]) / d;
    w = 2.2 * (1 - s) + 7.8 * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.8)), 0.85);
    var saw = (i % 3 === 1 && s > 0.12 && s < 0.94) ? 1.7 * Math.sin(Math.PI * s) : 0;
    O.push([sp[i][0] + nx * (w / 2 + saw), sp[i][1] + ny * (w / 2 + saw)]); I.push([sp[i][0] - nx * w / 2, sp[i][1] - ny * w / 2]);
    if (s > 0.12 && s < 0.9) M2.push([sp[i][0] + nx * w * 0.2, sp[i][1] + ny * w * 0.2], [sp[i][0] - nx * w * 0.2, sp[i][1] - ny * w * 0.2]);
  }
  p.pivot(22.6, 47, ang, 1, function () {
    p.poly(O.concat(I.reverse()), { fill: c, w: 0.95 });
    var inl = [], back = [];
    for (i = 0; i < M2.length; i += 2) { inl.push(M2[i]); back.unshift(M2[i + 1]); }
    p.poly(inl.concat(back), { fill: 'yellow', ink: 'gold', w: 0.45, detail: true });
    gem(p, sp[2][0] + 0.8, sp[2][1] + 0.2, 1.25, RUBY, 0);
  });
}
function prince(p, t, st, cfg) {
  var face = loop(PF), sm = st.sm, c0 = 77.2 - 1.6 * sm, kg = st.kw, mw = 7.6;
  mir(p, function (d) {
    kranok(p, (d > 0 ? 1 : 0.86) * (0.06 * M.wave(t, 1, -0.05) + kg), cfg.leaf || 'gold');
    var sw = 0.5 * M.wave(t, 2, d > 0 ? 0.1 : 0.2);
    p.path('M22 54.8 C26.6 52.4 31 55.4 30.2 60.6 C29.6 65 27 68 24.2 69.2', { fill: cfg.face, close: true, w: 0.9 });
    p.path('M25.2 58.4 C28 58.8 28.4 62 26.6 64.8', { w: 0.45, detail: true });
    p.circle(24.6, 71.6 + sw, 2.5, { fill: 'gold', w: 0.7 }); p.dot(24.6, 71.6 + sw, 0.95, RUBY);
  });
  p.curve(face, { close: true, fill: cfg.face, w: 1.15 });
  mir(p, function (d) {
    p.ellipse(14.4, 70, 5.2, 3.8, { fill: cfg.cheek, line: false, alpha: cfg.cheekA });
    p.path('M2.4 51 C6 47.4 13 46.6 19.8 49', { w: 1.3 });
    p.path('M3.2 49.6 C6.4 46.4 13 45.6 19 47.4', { w: 0.4, ink: 'gold', detail: true });
    pEye(p, 10.6, 58.6, d, st, cfg.face);
  });
  p.path('M50 53 C49.6 59 49.2 63.6 48.2 67.4', { w: 0.5, detail: true, alpha: 0.7 });
  p.path('M46.2 69.6 C46.4 72 48.6 72.8 50 72.6 C51.4 72.8 53.6 72 53.8 69.6', { w: 0.8 });
  mir(p, function () { p.dot(2.4, 71.2, 0.7, 'night'); });
  gem(p, 50, 50.6, 1.5, RUBY, 0);
  /* a closed mouth, the corners lifted by the smile */
  p.path('M' + (50 - mw) + ' ' + c0 + ' C' + (50 - mw * 0.62) + ' ' + (75.8 - sm) + ' ' + (50 - 1.4) + ' ' + (75.6 - sm * 0.4) + ' 50 ' + (76.5 - sm * 0.4) + ' C' + (50 + 1.4) + ' ' + (75.6 - sm * 0.4) + ' ' + (50 + mw * 0.62) + ' ' + (75.8 - sm) + ' ' + (50 + mw) + ' ' + c0 + ' C' + (50 + 2.6) + ' ' + (c0 + 1.6 + sm * 0.8) + ' ' + (50 - 2.6) + ' ' + (c0 + 1.6 + sm * 0.8) + ' ' + (50 - mw) + ' ' + c0 + ' Z', { fill: cfg.lip, w: 0.6 });
  p.path('M' + (50 - 5.6) + ' ' + (c0 + 0.7) + ' C' + (50 - 2.8) + ' ' + (c0 + 5 + sm * 1.2) + ' ' + (50 + 2.8) + ' ' + (c0 + 5 + sm * 1.2) + ' ' + (50 + 5.6) + ' ' + (c0 + 0.7), { fill: cfg.lip, w: 0.55 });
  p.path('M' + (50 - mw) + ' ' + c0 + ' C' + (50 - 2.6) + ' ' + (c0 + 1.6 + sm * 0.8) + ' ' + (50 + 2.6) + ' ' + (c0 + 1.6 + sm * 0.8) + ' ' + (50 + mw) + ' ' + c0, { w: 0.55 });
  chada(p, st, cfg);
}
/* ---------------------------------------------------------------- Phra Ram */
/* พระราม Phra Ram, the green prince: a serene face under a tall gold chada, a faint smile, a jewel between the brows.
   Idle: the gaze drifts and he blinks slowly, a glint climbs the crown tier by tier, the gold leaves sway after the head.
   Tap: the crown shines: each tier lights in turn, rays leave the spire, sparks fly, and his smile deepens. */
D.add('phra-ram', {
  fam: 'khon', tags: ['phra ram', 'rama', 'ram', 'prince', 'hero', 'khon', 'mask', 'green', 'chada', 'crown', 'ramakien', 'ramayana', 'thai dance', 'พระราม', 'หัวโขน', 'โขน'],
  loop: 3.4, still: 0.3, ratio: 1, tapLen: 2.2, tapRest: 0.5, burst: false,
  margin: [16, 20, 8, 20], tapMargin: [56, 46, 10, 46],
  about: 'the gaze drifts and he blinks slowly, a glint climbs the crown tier by tier, the gold leaves sway after the head',
  tapAbout: 'the crown shines: each tier lights in turn, rays leave the spire, sparks fly, and his smile deepens',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), on = s.tap >= 0, i, lit = [];
    var sh = on ? M.ease(M.seg(tp, 0.04, 0.2)) * (1 - M.ease(M.seg(tp, 0.7, 0.92))) : 0;
    for (i = 0; i < 4; i++) lit.push(on ? M.bump(M.seg(tp, 0.1 + 0.11 * (3 - i), 0.46 + 0.11 * (3 - i))) * 1 : M.bump(M.seg(M.frac(t - 0.06 * (3 - i)), 0.05, 0.22)));
    var st = {
      lid: Math.max(blink(t, 0.46, 0.56) * 1, on ? 0.9 * M.bump(M.seg(tp, 0.2, 0.8)) : 0), look: [0.7 * M.wave(t, 1, 0.1), 0.45 + 0.1 * M.wave(t, 2)],
      sm: 0.45 + 0.12 * M.wave(t, 1, 0.3) + 0.6 * sh, kw: 0.05 * sh * M.wave(tp, 3), lit: lit
    }, r = on ? M.seg(tp, 0.26, 0.9) : 0;
    held(p, t, 1, 0.98, function () {
      p.pivot(50, 98, -0.025 * sh, 1, function () { prince(p, t, st, { face: RAMG, cheek: 'mint', cheekA: 0.6, lip: '#D6444E', gems: [RUBY, 'blue', RUBY, 'green'], leaf: 'gold' }); });
      if (r > 0 && r < 1) for (i = 0; i < 7; i++) {
        var a = -Math.PI / 2 + (i - 3) * 0.42, r0 = 8 + 18 * M.easeIn(M.seg(r, 0.3 + (i % 2) * 0.05, 1)), r1 = 8 + 18 * M.easeOut(M.seg(r, (i % 2) * 0.05, 0.7)), c = Math.cos(a), sn = Math.sin(a);
        if (r1 - r0 > 0.4) p.line(50 + c * r0, 0 + sn * r0, 50 + c * r1, 0 + sn * r1, { ink: 'a', w: 1.1, cap: 'round' });
      }
      if (on) [[-32, -26, 7, 'yellow'], [34, -32, 6.2, 'a'], [-14, -50, 5.4, 'a'], [16, -56, 6.6, 'yellow'], [-46, -2, 5, 'a'], [48, -8, 5.4, 'yellow']].forEach(function (q, j) { drift(p, M.seg(tp, 0.3 + 0.04 * j, 0.86 + 0.02 * j), 50 + q[0] * 0.15, 6, 50 + q[0], 6 + q[1], q[2], q[3], j * 0.19); });
    });
  }
});

/* ---------------------------------------------------------------- Phra Lak */
/* พระลักษมณ์ Phra Lak, the gold prince, Rama's brother: the same serene face in gold, under the same chada, with green and ruby jewels.
   Idle: the gaze rests low and wanders, he blinks, a glint runs down the crown from the spire, the leaves sway.
   Tap: his gold gleams: a bright sheen sweeps across the face and crown, the leaves swing out and back, and gold stars rise. */
D.add('phra-lak', {
  fam: 'khon', tags: ['phra lak', 'lakshmana', 'lak', 'prince', 'brother', 'khon', 'mask', 'gold', 'chada', 'crown', 'ramakien', 'ramayana', 'thai dance', 'พระลักษมณ์', 'หัวโขน', 'โขน'],
  loop: 3, still: 0.3, ratio: 1, tapLen: 2, tapRest: 0.58, burst: false,
  margin: [16, 24, 8, 24], tapMargin: [50, 46, 10, 46],
  about: 'the gaze rests low and wanders, he blinks, a glint runs down the crown from the spire, the leaves sway',
  tapAbout: 'his gold gleams: a bright sheen sweeps across face and crown, the leaves swing out and back, and gold stars rise',
  draw: function (p, t, s) {
    var tp = Math.max(0, s.tap), on = s.tap >= 0, i, lit = [];
    var sh = on ? M.ease(M.seg(tp, 0.04, 0.2)) * (1 - M.ease(M.seg(tp, 0.74, 0.94))) : 0, u = on ? M.seg(tp, 0.12, 0.72) : -1, sx = -30 + 160 * M.ease(u);
    for (i = 0; i < 4; i++) { var gy = [40, 30.4, 20.2, 10.4][i], xc = 62 - (108 - gy) * 0.367; lit.push(on ? M.bump(M.seg(sx, xc - 8, xc + 18)) : M.bump(M.seg(M.frac(t - 0.06 * i), 0.05, 0.22))); }
    var st = {
      lid: Math.max(blink(t, 0.7, 0.8), on ? 0.7 * M.bump(M.seg(tp, 0.25, 0.7)) : 0), look: [0.8 * M.wave(t, 1, 0.6), 0.55 + 0.1 * M.wave(t, 2, 0.2)],
      sm: 0.4 + 0.12 * M.wave(t, 1, 0.1) + 0.55 * sh, kw: on ? 0.28 * M.spring(M.seg(tp, 0.05, 0.4)) * (1 - M.ease(M.seg(tp, 0.55, 0.9))) * Math.cos(TAU * 1.5 * M.seg(tp, 0.05, 0.9)) : 0, lit: lit
    };
    held(p, t, 1, 0.98, function () {
      prince(p, t, st, { face: LAK, cheek: 'orange', cheekA: 0.32, lip: '#D6444E', gems: ['green', RUBY, 'blue', RUBY], leaf: 'gold' });
      if (u > 0 && u < 1) {
        var face = loop(PF);
        p.clip(function () { p.poly(loop([[0, -6], [3, 6], [7, 15], [11, 25], [16, 36], [21.8, 44], [0, 45]]), { fill: 'gold' }); p.curve(face, { close: true, fill: 'gold' }); }, function () {
          p.poly([[sx - 8, 108], [sx - 2, 108], [sx + 33.6, -12], [sx + 27.6, -12]], { fill: 'white', line: false, alpha: 0.92 });
          p.poly([[sx + 8, 108], [sx + 10.4, 108], [sx + 43.4, 0], [sx + 41, 0]], { fill: 'white', line: false, alpha: 0.92 });
        });
      }
      if (on) [[-42, -28, 6.8, 'yellow'], [40, -32, 7.2, 'a'], [-20, -48, 5.4, 'a'], [22, -54, 6.2, 'yellow'], [-56, 0, 5, 'a'], [56, -4, 5.4, 'yellow']].forEach(function (q, j) { drift(p, M.seg(tp, 0.34 + 0.04 * j, 0.88 + 0.02 * j), 50 + q[0] * 0.15, 20, 50 + q[0], 20 + q[1], q[2], q[3], j * 0.19); });
    });
  }
});
})(Dingbats);
