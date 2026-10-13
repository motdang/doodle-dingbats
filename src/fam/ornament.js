/* Ornaments & dividers: wide dingbats for the space between sections. */
(function (D) {
'use strict';
var M = D.math, TAU = M.TAU;

/* the two edges of a ribbon of half-width hw laid along a line of points */
function sides(pts, hw) {
  var L = [], R = [];
  pts.forEach(function (q, i) {
    var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    L.push([q[0] - dy / d * hw, q[1] + dx / d * hw]); R.push([q[0] + dy / d * hw, q[1] - dx / d * hw]);
  });
  return [L, R];
}
/* the same ribbon as one closed outline */
function band(pts, hw) { var e = sides(pts, hw); return e[0].concat(e[1].reverse()); }
/* a spiral that starts on the anchor (x, y); its middle lies R away in direction a, and it winds dir (1 or -1) */
function curl(x, y, a, dir, R, turns) {
  var q = [], cx = x + Math.cos(a) * R, cy = y + Math.sin(a) * R;
  for (var i = 0; i <= 36; i++) { var u = i / 36, th = a + Math.PI + dir * u * TAU * (turns || 1.6), r = R * (1 - 0.82 * u); q.push([cx + Math.cos(th) * r, cy + Math.sin(th) * r]); }
  return q;
}
/* the distance from a to b round a ring of length L */
function ring(a, b, L) { return Math.abs(((a - b) % L + 1.5 * L) % L - L / 2); }

/* a vine across the page: the leaves turn in the breeze one after another, left to right, and
   the tendrils curl and let go. Tap: flowers open along it, left to right. */
D.add('vine', {
  fam: 'ornament', tags: ['divider', 'rule', 'section', 'leaf', 'garden', 'border', '❦'], loop: 3.2, ratio: 5, still: 0.15, tapLen: 2.6, burst: 'petal', burstAt: [250, 50], burstN: 9, margin: [24, 10, 24, 10],
  about: 'leaves turn one after another; tendrils curl and let go', tapAbout: 'flowers open along it, left to right',
  draw: function (p, t, s) {
    var y = function (x) { return 50 + 13 * Math.sin(x / 500 * TAU * 2.25 + 0.6); };
    var stem = []; for (var x = 8; x <= 492; x += 12) stem.push([x, y(x)]);
    p.curve(stem, { w: 1.05 });
    for (var i = 0; i < 13; i++) {
      var lx = 26 + i * 37, up = i % 2 ? 1 : -1, ly = y(lx), slope = Math.atan2(y(lx + 1) - ly, 1);
      var flutter = 0.22 * Math.sin(TAU * (t - lx / 500 * 0.8)) * (0.6 + 0.4 * ((i * 7) % 3) / 2);
      p.at(lx, ly, slope + up * (0.85 + flutter), [1, up], function () {
        p.path('M0 0 C4 -8 14 -11 22 -9 C19 -2 10 3 0 0 Z', { fill: i % 3 ? 'leaf' : 'green', w: 0.8 });
        p.path('M1 -0.5 C7 -4 13 -6 18 -7.5', { w: 0.4, detail: true });
      });
    }
    /* tendrils: a curl drawn out, held, taken back */
    [[120, -1, 0.1], [306, 1, 0.55], [430, -1, 0.3]].forEach(function (d) {
      var ph = M.frac(t + d[2]), u = M.easeOut(M.seg(ph, 0, 0.45)) * (1 - M.easeIn(M.seg(ph, 0.7, 1)));
      var tx = d[0], ty = y(tx);
      p.draw('M' + tx + ' ' + ty + ' c' + (6) + ' ' + (d[1] * -10) + ' ' + 16 + ' ' + (d[1] * -12) + ' ' + 16 + ' ' + (d[1] * -4) + ' c0 ' + (d[1] * 5) + ' -7 ' + (d[1] * 6) + ' -7 ' + (d[1] * 1), u, { w: 0.55 });
    });
    if (s.tap >= 0) {
      for (var k = 0; k < 6; k++) {
        var fx = 45 + k * 82, fy = y(fx), open = M.spring(M.seg(s.tap, k * 0.07, k * 0.07 + 0.35)) * (1 - M.easeIn(M.seg(s.tap, 0.82, 1)));
        if (open <= 0.01) continue;
        p.at(fx, fy, k * 0.7, open, function () {
          for (var j = 0; j < 5; j++) p.at(0, 0, j / 5 * TAU, 1, function () { p.path('M0 0 C-5 -5 -4 -13 0 -14 C4 -13 5 -5 0 0 Z', { fill: k % 2 ? 'pink' : 'a', w: 0.6 }); });
          p.circle(0, 0, 3.2, { fill: 'yellow', w: 0.5 });
        });
      }
    }
  }
});

/* a wavy rule with a swell running along it, a thin echo a beat behind. Tap: a drop lands in the
   middle and ripples run out both ways, the right one first. */
D.add('wave-rule', {
  fam: 'ornament', tags: ['divider', 'rule', 'wave', 'water', 'sea', 'line', '〰'], loop: 3.2, ratio: 5, still: 0.3, tapLen: 2, burst: 'drop', burstAt: [250, 38], burstN: 7, burstSpread: 2.2, margin: [34, 10, 22, 10],
  about: 'a swell runs along a wavy rule, a thin echo a beat behind', tapAbout: 'a drop lands in the middle and ripples run out both ways, the right one first',
  draw: function (p, t, s) {
    var tp = s.tap;
    function line(y0, lag, k, w) {
      var pts = [];
      for (var x = 0; x <= 500; x += 5) {
        var A = 4.5 + 12 * Math.exp(-Math.pow(ring(x, 500 * M.frac(t - lag), 500), 2) / 6050), dist = Math.abs(x - 250), dip = 0;
        if (tp >= 0) {
          var fr = 340 * M.easeOut(M.seg(tp - (x < 250 ? 0.04 : 0), 0, 0.85));
          A += 15 * (1 - M.easeIn(M.seg(tp, 0.4, 1))) * Math.exp(-Math.pow((dist - fr) / 42, 2));
          dip = -13 * M.bump(M.seg(tp, 0.04, 0.36)) * Math.exp(-dist * dist / 700);
        }
        pts.push([x, y0 + k * (A * Math.sin(TAU * (x / 50 - t + lag)) + dip)]);
      }
      p.curve(pts, { w: w });
    }
    line(40, 0, 1, 1.15);
    line(66, 0.07, 0.55, 0.6);
    if (tp >= 0 && tp < 0.14) p.at(250, -26 + 62 * M.easeIn(M.seg(tp, 0, 0.14)), 0, 1, function () { p.path('M0 -9 C5 -2 6 3 0 6 C-6 3 -5 -2 0 -9 Z', { fill: 'sky', w: 0.7 }); });
  }
});

/* bare footprints stamped one after another along a dotted path: each hovers, lands with a squash,
   and is flattened a little later, from the start of the walk. Tap: every print pops up in a skipping wave. */
var SOLE = 'M-12 0 C-12 -5.5 -7 -7.5 -3 -6.8 C1 -6 3 -8.5 8 -9 C13.5 -9.5 15 -3.5 15 1 C15 6 11 7.5 7 7 C3 6.5 0 3.5 -3.5 3.8 C-8 4.2 -12 5.5 -12 0 Z';
var TOES = [[18, 2.6, 3.4], [18.6, -1.6, 2.7], [16.8, -5.4, 2.3], [13.8, -8.6, 2.1], [10, -10.2, 1.8]];
D.add('footsteps', {
  fam: 'ornament', tags: ['divider', 'path', 'walk', 'trail', 'steps', 'feet', 'barefoot', '👣'], loop: 4, ratio: 5, still: 0.4, tapLen: 1.7, burst: 'drop', burstAt: [450, 58], burstN: 5, burstSpread: 1.6, margin: [22, 14, 16, 14],
  about: 'footprints hover, land and are flattened in turn along a dotted path', tapAbout: 'every print pops up in a skipping wave, left to right',
  draw: function (p, t, s) {
    var tp = s.tap;
    for (var x = 12.5; x < 500; x += 25) p.circle(x, 50, 2.2, { fill: 'ink', line: false, detail: true });
    for (var k = 0; k < 10; k++) {
      var a = t - (0.08 + 0.055 * k), sx = 0, sy = 0, dy = 0, odd = k % 2;
      if (a >= -0.05 && a < 0) { var h = 1 - M.easeIn(M.seg(a, -0.05, 0)); sx = sy = 1 + 0.3 * h; dy = -12 * h; }
      else if (a >= 0) { var q = M.bump(M.seg(a, 0, 0.06)), f = M.seg(a, 0.3, 0.37); sx = (1 + 0.16 * q) * (1 + 0.2 * f); sy = (1 - 0.14 * q) * (1 - M.easeOut(f)); }
      if (tp >= 0) {
        var m = M.spring(M.seg(tp, 0.04 * k, 0.04 * k + 0.3)) * (1 - M.easeIn(M.seg(tp, 0.7 + 0.02 * k, 0.82 + 0.02 * k)));
        if (m > sy) { sx = sy = m; dy = -12 * M.bump(M.seg(tp, 0.04 * k, 0.04 * k + 0.24)); }
      }
      if (sy < 0.03) continue;
      p.at(50 * k + 26, 50 + (odd ? 10 : -10) + dy, 0, [1.25 * sx, 1.25 * sy * (odd ? -1 : 1)], function () {
        p.path(SOLE, { fill: odd ? 'c' : 'b', w: 0.8 });
        TOES.forEach(function (c) { p.circle(c[0], c[1], c[2], { fill: odd ? 'c' : 'b', w: 0.5, detail: true }); });
      });
    }
  }
});

/* a lace edge: scallops hang from a hem, the depth of the swag runs along as a wave and a pearl at
   the foot of each swings a beat behind it. Tap: the pearls hop up one after another. */
D.add('scallop', {
  fam: 'ornament', tags: ['divider', 'lace', 'edge', 'border', 'trim', 'doily', 'curtain', 'frill'], loop: 3.2, ratio: 5, still: 0.3, tapLen: 1.8, burst: 'spark', burstAt: [250, 66], burstN: 7, margin: [16, 10, 30, 10],
  about: 'the swags of a lace edge rise and fall in a wave, the pearls swinging behind', tapAbout: 'the pearls hop up one after another, left to right',
  draw: function (p, t, s) {
    var tp = s.tap, dep = [], i, j, d = 'M0 20', e = '';
    for (i = 0; i < 10; i++) {
      dep[i] = 31 + 5 * M.wave(t, 1, -i / 10) + (tp >= 0 ? 7 * M.bump(M.seg(tp, i * 0.05, i * 0.05 + 0.4)) : 0);
      var y = 20 + dep[i] * 1.28;
      d += ' C' + (i * 50 + 3) + ' ' + y + ' ' + (i * 50 + 47) + ' ' + y + ' ' + (i * 50 + 50) + ' 20';
      e += (i ? ' M' : 'M') + (i * 50) + ' 20 C' + (i * 50 + 3) + ' ' + y + ' ' + (i * 50 + 47) + ' ' + y + ' ' + (i * 50 + 50) + ' 20';
    }
    p.path(d + ' Z', { fill: 'cream', line: false });
    p.path(e, { w: 1.05 });
    p.line(0, 20, 500, 20, { w: 0.8 });
    for (i = 0; i < 10; i++) {
      var x = i * 50, yi = 27 + dep[i] * 0.62 * 1.28, cy = 20 + dep[i] * 0.52, ay = 20 + dep[i] * 0.96, sw = 2.5 * M.wave(t, 1, -i / 10 - 0.1), hop = tp >= 0 ? 16 * M.bump(M.seg(tp, i * 0.05 + 0.05, i * 0.05 + 0.45)) : 0;
      p.path('M' + (x + 8) + ' 27 C' + (x + 12) + ' ' + yi + ' ' + (x + 38) + ' ' + yi + ' ' + (x + 42) + ' 27', { w: 0.5, detail: true });
      p.circle(x + 25, 24.5, 1.6, { fill: 'bg', w: 0.4, detail: true });
      for (j = 0; j < 6; j++) p.circle(x + 25 + Math.cos(j / 6 * TAU) * 5.6, cy + Math.sin(j / 6 * TAU) * 5.6, 2.3, { fill: 'bg', w: 0.45, detail: true });
      p.circle(x + 25, cy, 2.8, { fill: 'a', w: 0.5 });
      p.circle(x, 24, 2.4, { fill: 'bg', w: 0.5, detail: true });
      p.line(x + 25, ay, x + 25 + sw * 0.6, ay + 4 - hop, { w: 0.45 });
      p.circle(x + 25 + sw, ay + 9 - hop, 5, { fill: 'white', w: 0.8 });
    }
  }
});

/* lai kham, the gold on black of Lanna temple doors: flame leaves ride a vine and spirals turn between
   them, a glint passing from leaf to leaf. Tap: the gold is laid on again, vine first. */
var FLAME = 'M0 0 C-8 -3 -10 -11 -5.5 -17 C-3.5 -20 -4.5 -24 0 -30 C1.5 -25 5.5 -24 6.5 -18.5 C9.5 -11 8 -3 0 0 Z';
D.add('lai-kham', {
  fam: 'ornament', tags: ['lanna', 'gold', 'temple', 'scroll', 'divider', 'border', 'chiang mai', 'ลายคำ'], loop: 4, ratio: 5, still: 0.5, tapLen: 2.2, burst: 'star', burstAt: [250, 50], burstN: 8, margin: [12, 6, 12, 6],
  about: 'flame leaves sway along a gold vine on black, a glint passing from leaf to leaf', tapAbout: 'the gold is laid on again, vine first, leaves and spirals sprouting behind it',
  draw: function (p, t, s) {
    var tp = s.tap, j, stem = [];
    p.rect(2, 5, 496, 90, { fill: 'black', ink: 'black', r: 5, w: 0.8 });
    p.line(12, 9, 488, 9, { ink: 'gold', w: 0.3, detail: true }); p.line(12, 91, 488, 91, { ink: 'gold', w: 0.3, detail: true });
    for (var x = 0; x <= 500; x += 6.25) stem.push([x, 50 - 9 * Math.cos(TAU * (x - 31.25) / 125)]);
    p.draw(stem, tp >= 0 ? M.easeOut(M.seg(tp, 0, 0.6)) : 1, { ink: 'gold', w: 1.1, smooth: true });
    for (j = 0; j < 8; j++) {
      var fx = 31.25 + 62.5 * j, up = j % 2 === 0, born = tp >= 0 ? M.spring(M.seg(tp, fx / 500 * 0.55, fx / 500 * 0.55 + 0.3)) : 1, gl = M.bump(M.seg(M.frac(t - j / 8), 0, 0.14));
      p.at(fx, 50 + (up ? -9 : 9), (up ? 0 : Math.PI) + 0.1 * M.wave(t, 1, -j / 8), 0.98 * born, function () {
        [-0.8, 0.8].forEach(function (a) { p.at(0, 0, a * 1.15, 0.5, function () { p.path(FLAME, { fill: 'gold', ink: 'black', w: 0.7 }); }); });
        p.path(FLAME, { fill: 'gold', ink: 'black', w: 0.6 });
        p.path('M0 -4 C-2 -10 -1.5 -17 0.5 -24', { ink: 'black', w: 0.5, detail: true });
      });
      if (gl > 0.02) p.star(fx + (up ? 1 : -1), 50 + (up ? -39 : 39), 11 * gl, 2.4 * gl, 4, { fill: 'yellow', ink: 'gold', w: 0.4, glow: 1 });
    }
    for (j = 1; j < 8; j++) {
      var nx = 62.5 * j, a1 = j % 2 ? -Math.PI / 3 : -2 * Math.PI / 3, dir = j % 2 ? 1 : -1, u = tp >= 0 ? M.seg(tp, nx / 500 * 0.55, nx / 500 * 0.55 + 0.35) : 1;
      [a1, a1 + Math.PI].forEach(function (a) {
        p.pivot(nx, 50, 0.22 * M.wave(t, 1, -j / 8 - 0.1), 1, function () { p.draw(curl(nx, 50, a, dir, 10), u, { ink: 'gold', w: 0.85 }); });
      });
    }
  }
});

/* two skeins of birds cross the sky in V formation, the wingbeat passing back down each arm from the
   leader, so no two wings agree. Tap: the leader loops the loop, then each pair behind it. */
function bird(p, f, body) {
  var ty = 1 - 11 * f, cy = ty * 0.5 - 5;
  p.path('M0 0 Q-9 ' + cy + ' -20 ' + ty, { w: 1 });
  p.path('M0 0 Q9 ' + cy + ' 20 ' + ty, { w: 1 });
  p.ellipse(0.5, 1.4, 5.2, 2.7, { fill: body, w: 0.6 });
  p.circle(5.3, 0.6, 2, { fill: body, w: 0.5 });
}
D.add('birds', {
  fam: 'ornament', tags: ['divider', 'sky', 'birds', 'flock', 'geese', 'migration', 'fly', 'journey', '🕊'], loop: 8, ratio: 5, still: 0.45, tapLen: 2.6, burst: false, margin: [14, 10, 14, 10],
  about: 'two skeins of birds cross in V formation, the wingbeat passing back from the leader', tapAbout: 'the leader loops the loop, then each pair behind it',
  draw: function (p, t, s) {
    var tp = s.tap;
    [[0.2, 52, 1, 3, 0], [0.7, 24, 0.6, 2, 0.31]].forEach(function (S) {
      var c = -45 + 720 * M.frac(t + S[0]);
      if (c > 640) return;
      for (var m = 0; m <= S[3]; m++) {
        for (var sd = m ? -1 : 0; sd <= (m ? 1 : 0); sd += 2) {
          var f = M.wave(t, 8, -m * 0.16 + S[4] + (sd > 0 ? 0.04 : 0)), x = -m * 25, y = sd * m * 11 + 2.5 * f, rot = 0;
          if (c + S[2] * x < -40 || c + S[2] * x > 540) continue;
          if (tp >= 0) { var th = TAU * M.ease(M.seg(tp, 0.17 * m, 0.17 * m + 0.38)), dr = sd || -1; x += 20 * Math.sin(th); y += dr * 20 * (1 - Math.cos(th)); rot = dr * th; }
          p.at(c, S[1], 0, S[2], function () { p.at(x, y, rot, 1, function () { bird(p, f, m ? 'ink' : 'b'); }); });
        }
      }
    });
  }
});

/* ants carry their finds along a trail, crumbs one way and one with a leaf for a sail, and the empty
   ones hurry back the other, the legs in a tripod gait. Tap: they rear up in a wave and toss their loads. */
var LEAF = 'M0 0 C6 -8 18 -9 28 0 C18 8 6 8 0 0 Z', CRUMB = [[-4, -3], [1, -5], [5, -2], [4, 3], [-1, 4], [-5, 1]];
function ant(p, ph, load, rear, hop, body) {
  var bob = 0.8 * Math.sin(TAU * ph * 2), i, sd;
  for (sd = 0; sd < 2; sd++) for (i = 0; i < 3; i++) {
    var u = TAU * (ph + (i === 1 ? 0.5 : 0) + sd * 0.5), ax = [3, -2, -7][i], fx = ax + [6, 1, -7][i] + 5 * Math.sin(u), fy = -3.4 * Math.max(0, Math.cos(u));
    p.path('M' + ax + ' ' + (-8 + bob) + ' L' + (ax + (i - 1) * -4.5 + (fx - ax) * 0.4) + ' ' + (-5 + fy * 0.5) + ' L' + fx + ' ' + fy, { w: 0.5, ink: sd ? 'grey' : 'ink' });
  }
  p.pivot(-7, 0, -0.5 * rear, 1, function () {
    p.ellipse(-13, -11 + bob, 8.5, 6.5, { fill: body, w: 0.6 });
    p.ellipse(-2, -12 + bob, 5, 4.2, { fill: body, w: 0.6 });
    p.circle(7.5, -11.5 + bob, 4.6, { fill: body, w: 0.6 });
    p.circle(9, -12.6 + bob, 1.1, { fill: 'bg', line: false });
    p.path('M10 -14.5 C13 -20 16 -20 19 -17', { w: 0.5 }); p.path('M10.5 -13 C14 -17 18 -15 20 -12', { w: 0.5 });
    if (load === 1) p.at(16.5, -8 + bob - hop, 0.25 * Math.sin(TAU * ph) + 2 * hop / 16, 1, function () { p.poly(CRUMB, { fill: 'sand', w: 0.7 }); });
    if (load === 2) p.at(10, -13 + bob - hop, -1.9 + 0.08 * Math.sin(TAU * ph * 2), 1, function () { p.path(LEAF, { fill: 'leaf', w: 0.8 }); p.path('M2 0 L25 0', { w: 0.4, detail: true }); });
  });
}
D.add('ants', {
  fam: 'ornament', tags: ['divider', 'trail', 'ants', 'march', 'work', 'carry', 'leaf', 'insect', 'procession', '🐜'], loop: 12, ratio: 5, still: 0.2, tapLen: 1.8, burst: false, margin: [24, 10, 10, 10],
  about: 'ants march along two lanes, loads one way and empty-handed back, legs in a tripod gait', tapAbout: 'they rear up in a wave and toss their loads, then march on',
  draw: function (p, t, s) {
    var tp = s.tap;
    p.line(0, 49, 500, 49, { w: 0.35, dash: [10, 9], detail: true }); p.line(0, 85, 500, 85, { w: 0.35, dash: [10, 9], detail: true });
    for (var k = 0; k < 10; k++) {
      var lane = k < 6 ? 0 : 1, n = lane ? 4 : 6, i = lane ? k - 6 : k, x = -36 + 572 * M.frac(i / n + 0.03 + 0.1 * lane + (lane ? -t : t)), rear = 0, hop = 0;
      if (tp >= 0) { var d = tp - (lane ? 1 - x / 500 : x / 500) * 0.35; rear = M.bump(M.seg(d, 0.05, 0.5)); hop = 16 * M.bump(M.seg(d, 0.1, 0.55)); }
      p.at(x, lane ? 85 : 49, 0, [lane ? -1 : 1, 1], function () { ant(p, 44 * t + k * 0.37, lane ? 0 : [1, 1, 2, 1, 1, 1][i], rear, hop, lane ? 'ink' : 'brown'); });
    }
  }
});

/* a steam train crosses with its smoke hanging behind it, the drivers and their coupling rod turning
   as it rolls. Tap: a blast on the whistle, steam shoots up and the body hops on its springs. */
function wheel(p, x, y, r, a) {
  p.circle(x, y, r, { fill: 'white', w: 0.9 });
  for (var i = 0; i < 3; i++) { var c = Math.cos(a + i * 1.0472) * r * 0.85, d = Math.sin(a + i * 1.0472) * r * 0.85; p.line(x - c, y - d, x + c, y + d, { w: 0.4, detail: true }); }
  p.circle(x, y, r * 0.22, { fill: 'ink', w: 0.4 });
}
D.add('train', {
  fam: 'ornament', tags: ['divider', 'train', 'steam', 'railway', 'travel', 'journey', 'locomotive', 'track', '🚂'], loop: 8, ratio: 6, still: 0.5, tapLen: 2, burst: false, margin: [28, 10, 8, 10],
  about: 'a steam train crosses, smoke hanging behind it, wheels and rod turning', tapAbout: 'a blast on the whistle: steam shoots up and the body hops on its springs',
  draw: function (p, t, s) {
    var G = 86, tp = s.tap, hx = -30 + 916 * M.seg(t, 0, 0.97), j;
    p.line(0, G, 600, G, { w: 0.9 });
    for (j = 0; j < 25; j++) p.line(j * 24 + 6, G + 2, j * 24 + 6, G + 8, { w: 0.5, detail: true });
    for (j = 0; j < 36; j++) {
      var ts = j / 36, a = M.frac(t - ts) / 0.2, sx = -56 + 916 * M.seg(ts, 0, 0.97);
      if (a >= 1 || sx < -10 || sx > 610) continue;
      var e = M.easeOut(a);
      p.blob(sx - 12 * a, 31 - 32 * e, (3 + 9 * e) * (1 - M.easeIn(M.seg(a, 0.6, 1))), { fill: 'smoke', w: 0.8, lumpy: 0.22, seed: j + 3, n: 8 });
    }
    if (hx < -26 || hx > 876) return;
    var vis = function (a, b) { return hx + a < 640 && hx + b > -30; }, hop = tp >= 0 ? -2.5 * M.bump(M.seg(tp, 0, 0.22)) : 0;
    p.at(hx, hop, 0, 1, function () {
      if (vis(-252, -198)) {
        p.rect(-250, 44, 50, 26, { fill: 'a', r: 3, w: 0.9 });
        for (j = 0; j < 3; j++) p.rect(-243 + j * 15, 50, 10, 9, { fill: 'sky', r: 1.5, w: 0.5, detail: true });
      }
      if (vis(-196, -144)) {
        p.rect(-194, 52, 48, 18, { fill: 'b', r: 2, w: 0.9 });
        p.blob(-170, 51, 12, { fill: 'black', sy: 0.5, lumpy: 0.2, seed: 4, w: 0.7 });
      }
      p.rect(-136, 66, 128, 5, { fill: 'grey', w: 0.8 });
      p.rect(-104, 46, 92, 22, { fill: 'c', r: 8, w: 1 });
      p.line(-48, 47, -48, 67, { w: 0.5, detail: true }); p.line(-32, 47, -32, 67, { w: 0.5, detail: true });
      p.rect(-136, 32, 36, 36, { fill: 'b', r: 2, w: 1 });
      p.rect(-140, 27, 44, 6, { fill: 'ink', r: 2, w: 0.8 });
      p.rect(-130, 38, 14, 12, { fill: 'sky', r: 2, w: 0.6, detail: true });
      p.path('M-31 47 L-29.5 36 L-34 29 L-18 29 L-22.5 36 L-21 47 Z', { fill: 'ink', w: 0.8 });
      p.path('M-72 47 C-73 36 -52 36 -52 47 Z', { fill: 'a', w: 0.9 });
      p.rect(-80, 39, 5, 8, { fill: 'a', w: 0.5 });
      p.rect(-17, 38, 7, 9, { fill: 'yellow', r: 2, line: false, glow: 0.7 }); p.rect(-17, 38, 7, 9, { r: 2, w: 0.6 });
      p.poly([[-12, 68], [9, 86], [-12, 86]], { fill: 'grey', w: 0.8 });
      if (tp >= 0) for (j = 0; j < 4; j++) {
        var pe = M.seg(tp, 0.04 + 0.08 * j, 0.5 + 0.08 * j);
        if (pe > 0 && pe < 1) p.blob(-78 + (j % 2 ? 4 : -3) * pe, 38 - 38 * M.easeOut(pe), (4 + 10 * pe) * (1 - M.easeIn(M.seg(pe, 0.6, 1))), { fill: 'white', w: 0.8, lumpy: 0.2, seed: j + 9, n: 8 });
      }
    });
    var ang = hx / 12;
    wheel(p, hx - 92, G - 12, 12, ang); wheel(p, hx - 64, G - 12, 12, ang);
    p.line(hx - 92 + 6 * Math.cos(ang), G - 12 + 6 * Math.sin(ang), hx - 64 + 6 * Math.cos(ang), G - 12 + 6 * Math.sin(ang), { w: 1.1, cap: 'round' });
    wheel(p, hx - 42, G - 7, 7, hx / 7); wheel(p, hx - 24, G - 7, 7, hx / 7);
    if (vis(-196, -144)) { wheel(p, hx - 178, G - 8, 8, hx / 8); wheel(p, hx - 154, G - 8, 8, hx / 8); }
    if (vis(-252, -198)) { wheel(p, hx - 242, G - 8, 8, hx / 8); wheel(p, hx - 208, G - 8, 8, hx / 8); }
  }
});

/* tung, the long paper flags Lanna people hang at temples: a row on a bamboo pole swaying one after
   another, the first leading, the cloth bending more the lower it hangs. Tap: a gust streams them all out. */
D.add('tung', {
  fam: 'ornament', tags: ['lanna', 'flag', 'banner', 'temple', 'festival', 'wind', 'divider', 'chiang mai', 'ตุง'], loop: 3.6, ratio: 5, still: 0.2, tapLen: 2.2, burst: 'confetti', burstAt: [250, 60], burstN: 6, margin: [14, 10, 12, 10],
  about: 'a row of paper flags sways on a pole, the first leading, the cloth bending more toward the foot', tapAbout: 'a gust streams every flag out to the right, then they settle back',
  draw: function (p, t, s) {
    var tp = s.tap;
    p.line(4, 14, 496, 14, { w: 1.1 });
    p.circle(4, 14, 3.2, { fill: 'wood', w: 0.6 }); p.circle(496, 14, 3.2, { fill: 'wood', w: 0.6 });
    for (var i = 0; i < 10; i++) {
      var x = 25 + 50 * i, ph = t - i * 0.05, g = tp >= 0 ? M.spring(M.seg(tp, i * 0.03, i * 0.03 + 0.38)) * (1 - M.easeIn(M.seg(tp, 0.55 + i * 0.02, 1))) : 0, fl = tp >= 0 ? 7 * tp : 0;
      var off = function (y) { var u = (y - 16) / 72; return u * 9 * Math.sin(TAU * ph) + u * u * 4 * Math.sin(TAU * (ph - 0.2)) + g * (u * 36 + 6 * u * Math.sin(TAU * (fl - u))); }, pts = [], y;
      for (y = 16; y <= 86; y += 6) pts.push([x - 8.5 + off(y), y]);
      pts.push([x - 8.5 + off(88), 92], [x + off(84), 82], [x + 8.5 + off(88), 92]);
      for (y = 86; y >= 16; y -= 6) pts.push([x + 8.5 + off(y), y]);
      p.poly(pts, { fill: ['b', 'a', 'c', 'cream'][i % 4], w: 0.9 });
      [26, 31, 68, 73].forEach(function (yy) { p.line(x - 8.5 + off(yy), yy, x + 8.5 + off(yy), yy, { w: 0.45, detail: true }); });
      p.poly([[x + off(52), 44], [x + 5 + off(52), 52], [x + off(52), 60], [x - 5 + off(52), 52]], { fill: 'white', w: 0.5, detail: true });
      p.circle(x, 14, 2.4, { fill: 'bg', w: 0.6 });
    }
  }
});

/* bunting: pennants hang from a sagging string and flutter one after another, the tips a beat behind
   the swing. Tap: each pennant flips over to show its back, in a wave from the left. */
D.add('bunting', {
  fam: 'ornament', tags: ['divider', 'party', 'flags', 'pennants', 'festival', 'celebration', 'banner', 'garland'], loop: 3, ratio: 5, still: 0.2, tapLen: 2, burst: 'confetti', burstAt: [250, 44], burstN: 9, margin: [14, 10, 28, 10],
  about: 'pennants flutter along a sagging string, the tips a beat behind the swing', tapAbout: 'every pennant flips over to show its back, in a wave from the left',
  draw: function (p, t, s) {
    var tp = s.tap, sw = function (x) { var u = M.frac(x / 250); return 20 + 24 * 4 * u * (1 - u); }, str = [], x, i;
    for (x = 0; x <= 500; x += 10) str.push([x, sw(x)]);
    p.curve(str, { w: 0.8 });
    for (x = 0; x <= 500; x += 250) p.circle(x, 20, 3.4, { fill: 'ink', w: 0.4 });
    for (i = 0; i < 12; i++) {
      var px = (i + 0.5) * 500 / 12, sl = Math.atan2(sw(px + 1) - sw(px - 1), 2), swing = 0.13 * M.wave(t, 1, -i / 12), tip = 5 * M.wave(t, 1, -i / 12 - 0.1);
      var fc = tp >= 0 ? Math.cos(TAU * M.ease(M.seg(tp, i * 0.045, i * 0.045 + 0.45))) : 1, back = fc < 0;
      p.at(px, sw(px), sl + swing, [Math.abs(fc) < 0.05 ? 0.05 : fc, 1], function () {
        p.poly([[-12, -1], [12, -1], [tip, 34]], { fill: back ? 'cream' : ['a', 'b', 'c', 'pink'][i % 4], w: 0.9 });
        p.line(-6, 7, 6, 7, { w: 0.4, detail: true }); p.circle(tip * 0.4, 14, 2.4, { fill: 'white', w: 0.4, detail: true });
      });
    }
  }
});

/* string lights swagged across: a bulb lights, then the next, each with a ring of rays, the glow
   running along the string. Tap: every bulb flashes at once, a hair apart from left to right. */
D.add('string-lights', {
  fam: 'ornament', tags: ['divider', 'lights', 'fairy lights', 'party', 'night', 'festival', 'bulbs', 'christmas', 'glow'], loop: 3.6, ratio: 5, still: 0.15, tapLen: 1.6, burst: 'spark star', burstAt: [250, 50], burstN: 8, margin: [10, 10, 24, 10],
  about: 'bulbs light one after another along the swags, each with a ring of rays', tapAbout: 'every bulb flashes at once, a hair apart from the left',
  draw: function (p, t, s) {
    var tp = s.tap, sw = function (x) { var u = M.frac(x / 125); return 22 + 20 * 4 * u * (1 - u); }, str = [], x, i;
    for (x = 0; x <= 500; x += 6.25) str.push([x, sw(x)]);
    p.curve(str, { w: 0.75 });
    for (i = 0; i < 12; i++) {
      var bx = 125 * (Math.floor(i / 3) + [0.2, 0.5, 0.8][i % 3]), sl = Math.atan2(sw(bx + 1) - sw(bx - 1), 2), L = M.bump(M.seg(M.frac(t - i / 12), 0, 0.28));
      if (tp >= 0) L = Math.max(L, M.bump(M.seg(tp, i * 0.012, i * 0.012 + 0.6)));
      var col = ['yellow', 'b', 'c', 'a'][i % 4];
      p.at(bx, sw(bx), sl * 0.4 + 0.07 * M.wave(t, 1, -i / 12), 1, function () {
        p.rect(-2.6, 0, 5.2, 7, { fill: 'grey', w: 0.5 });
        p.at(0, 16, 0, 1 + 0.12 * L, function () {
          if (L > 0.12) p.path('M-2.6 -9 C-9 -4 -10 7 0 9 C10 7 9 -4 2.6 -9 Z', { fill: col, line: false, glow: L });
          p.path('M-2.6 -9 C-9 -4 -10 7 0 9 C10 7 9 -4 2.6 -9 Z', { fill: L > 0.12 ? null : 'white', w: 0.85 });
          p.path('M-5 -3 C-6 0 -5.5 2 -4 3.5', { ink: L > 0.12 ? 'white' : 'ink', w: 0.5, detail: true });
        });
        if (L > 0.15) {
          p.circle(0, 16, 12 + 7 * L, { ink: col, w: 0.45, detail: true });
          for (var r = 0; r < 8; r++) { var c = Math.cos(r * 0.7854 + 0.4), d = Math.sin(r * 0.7854 + 0.4); p.line(c * (15 + 2 * L), 16 + d * (15 + 2 * L), c * (15 + 9 * L), 16 + d * (15 + 9 * L), { ink: col, w: 0.6, cap: 'round', detail: true }); }
        }
      });
    }
  }
});

/* rickrack braid: two zigzag strands cross and recross, the weave swapping which lies on top, and
   the whole braid squeezing and stretching in a wave, the second strand a beat behind the first.
   Tap: the weave flips over crossing by crossing, left to right. */
function tri(th) { return (Math.sin(th) - Math.sin(3 * th) / 9) / 1.1111; }
D.add('ricrac', {
  fam: 'ornament', tags: ['divider', 'braid', 'zigzag', 'trim', 'ribbon', 'sewing', 'rickrack', 'edge'], loop: 3.2, ratio: 5, still: 0.3, tapLen: 1.8, burst: 'confetti', burstAt: [250, 50], burstN: 7, margin: [10, 10, 10, 10],
  about: 'two zigzag strands weave over and under, squeezing and stretching in a wave', tapAbout: 'the weave flips crossing by crossing, left to right',
  draw: function (p, t, s) {
    var P = 50, tp = s.tap, hw = p.small ? 3.4 : 5.2, j;
    function strand(off, lag) {
      var q = [];
      for (var x = 0; x <= 500; x += 5) q.push([x, 50 - (22 + 3 * Math.sin(TAU * (x / 250 - t + lag)) + (tp >= 0 ? 9 * M.bump(M.seg(tp, x / 500 * 0.5, x / 500 * 0.5 + 0.4)) : 0)) * tri(Math.PI * x / P + Math.PI / 2 + off)]);
      return q;
    }
    var A = strand(0, 0), B = strand(Math.PI, 0.06);
    p.poly(band(A, hw), { fill: 'b', w: 0.9 }); p.poly(band(B, hw), { fill: 'c', w: 0.9 });
    for (j = 0; j < 10; j++) {
      var xc = (j + 0.5) * P, top = j % 2;
      if (tp >= 0 && tp > 0.03 * j && tp < 0.03 * j + 0.5) top = 1 - top;
      var src = top ? B : A, sub = src.filter(function (q) { return q[0] >= xc - 11 && q[0] <= xc + 11; }), e = sides(sub, hw);
      p.poly(band(sub, hw), { fill: top ? 'c' : 'b', line: false });
      p.path(e, { w: 0.9 });
    }
  }
});

/* a symmetrical centrepiece with a scroll growing out of it each way: the vine is drawn out, curls
   at its end, holds, and is taken back, the right arm a hair ahead of the left. Tap: the flower turns
   round on its stem and the leaves bob. */
function bez(a, b, c, d, n) { var q = []; for (var i = 0; i <= n; i++) { var u = i / n, v = 1 - u; q.push([v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0], v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1]]); } return q; }
var ARMS = [
  bez([14, 0], [28, 0], [40, 6], [58, 6], 10).concat(curl(58, 6, -Math.PI / 2, -1, 19, 1.7)),
  bez([58, 6], [90, 6], [130, -8], [172, -2], 16).concat(curl(172, -2, Math.PI / 2, 1, 14, 1.7))
];
D.add('fleuron', {
  fam: 'ornament', tags: ['divider', 'ornament', 'flourish', 'fleuron', 'scroll', 'centrepiece', 'section', '❦', '❧'], loop: 4.8, ratio: 4, still: 0.55, tapLen: 1.6, burst: 'petal', burstAt: [200, 40], burstN: 8, margin: [14, 8, 14, 8],
  about: 'a scroll is drawn out each way from a flower, curls at its end and is taken back, the right arm leading', tapAbout: 'the flower turns round on its stem and the leaves bob',
  draw: function (p, t, s) {
    var tp = s.tap;
    [1, -1].forEach(function (sg) {
      var ph = t - (sg > 0 ? 0 : 0.03), head = M.easeOut(M.seg(ph, 0.03, 0.4)), tail = M.easeIn(M.seg(ph, 0.74, 0.97));
      ARMS.forEach(function (arm, k) {
        var d = arm.map(function (q) { return [200 + sg * q[0], 52 + q[1]]; });
        p.span(d, tail, head, { w: 1.1 });
        [0.2, 0.42, 0.66].forEach(function (u, n) {
          if (k && n === 0) return;
          var lo = (k ? 0.12 : 0.1) + u * 0.5, grow = M.spring(M.seg(head, lo, lo + 0.14)) * (1 - M.easeIn(M.seg(tail, lo - 0.1, lo + 0.1)));
          var q = d[Math.round(u * (d.length - 1) * 0.7)], q2 = d[Math.round(u * (d.length - 1) * 0.7) + 1], bob = tp >= 0 ? 0.5 * M.bump(M.seg(tp, 0.1 + n * 0.1, 0.6 + n * 0.1)) : 0;
          if (grow > 0.02) p.at(q[0], q[1], Math.atan2(q2[1] - q[1], q2[0] - q[0]) + (n % 2 ? 1 : -1) * (0.9 + bob), grow, function () { p.path('M0 0 C3 -6 11 -7 16 -4 C12 1 5 3 0 0 Z', { fill: 'leaf', w: 0.7 }); });
        });
      });
    });
    var spin = tp >= 0 ? Math.cos(Math.PI * M.spring(M.seg(tp, 0, 0.7))) : 1, br = 1 + 0.04 * M.wave(t, 1);
    p.at(200, 52, 0, [Math.abs(spin) < 0.06 ? 0.06 : spin, br], function () {
      [-1, 1].forEach(function (sg) {
        p.path('M0 14 C' + (sg * 18) + ' 8 ' + (sg * 29) + ' -4 ' + (sg * 26) + ' -17 C' + (sg * 16) + ' -13 ' + (sg * 6) + ' -2 0 14 Z', { fill: 'c', w: 0.9 });
        p.path('M0 15 C' + (sg * 14) + ' 20 ' + (sg * 26) + ' 17 ' + (sg * 30) + ' 7 C' + (sg * 20) + ' 8 ' + (sg * 8) + ' 8 0 15 Z', { fill: 'a', w: 0.9 });
      });
      p.path('M0 14 C-12 4 -10 -18 0 -31 C10 -18 12 4 0 14 Z', { fill: 'b', w: 1 });
      p.path('M0 10 C-2 0 -2 -12 0 -23', { w: 0.4, detail: true });
      p.poly([[-9, 22], [0, 16], [9, 22], [0, 30]], { fill: 'leaf', w: 0.8 });
    });
  }
});

/* a row of stars that twinkle in order along it: each swells, tilts and throws out a glint. Tap: a comet
   crosses above and lights each star as it passes. */
var STAR_AT = [[34, 52, 16], [105, 46, 24], [177, 55, 14], [250, 50, 29], [323, 54, 15], [395, 46, 22], [466, 52, 17]];
D.add('stars-row', {
  fam: 'ornament', tags: ['divider', 'stars', 'night', 'twinkle', 'sky', 'sparkle', 'row', 'evening', '★'], loop: 3.5, ratio: 5, still: 0.1, tapLen: 1.8, burst: 'star', burstAt: [250, 30], burstN: 6, margin: [26, 14, 14, 14],
  about: 'stars twinkle in order along a row, each swelling and throwing out a glint', tapAbout: 'a comet crosses above and lights each star as it passes',
  draw: function (p, t, s) {
    var tp = s.tap, cx = -30 + 560 * M.ease(M.seg(tp, 0, 0.85));
    if (tp >= 0 && tp < 0.85) {
      p.path('M' + (cx - 130) + ' ' + (10 + 0.04 * (cx - 130)) + ' L' + cx + ' ' + (10 + 0.04 * cx), { w: 1.1 });
      p.star(cx, 10 + 0.04 * cx, 9, 4, 5, { fill: 'yellow', w: 0.8, rot: 0.3 });
    }
    STAR_AT.forEach(function (S, i) {
      var ph = M.frac(t - 0.05 - i / 7), tw = M.bump(M.seg(ph, 0, 0.3));
      if (tp >= 0) tw = Math.max(tw, M.bump(M.seg(tp - (S[0] + 30) / 560 * 0.85 + 0.05, 0, 0.35)));
      var r = S[2] * (1 + 0.4 * tw), rot = (i % 2 ? 1 : -1) * 0.5 * tw;
      var pt = i % 2 ? [r * 1.25, r * 0.3, 4] : [r, r * 0.45, 5], fc = i % 2 ? 'a' : 'yellow';
      if (tw > 0.1) p.star(S[0], S[1], pt[0], pt[1], pt[2], { fill: fc, line: false, glow: tw, rot: -Math.PI / 2 + rot });
      p.star(S[0], S[1], pt[0], pt[1], pt[2], { fill: tw > 0.1 ? null : fc, w: 0.9, rot: -Math.PI / 2 + rot });
      if (tw > 0.2) { var g = r * (0.5 + 1.1 * tw); p.line(S[0] - g, S[1], S[0] + g, S[1], { w: 0.5, detail: true }); p.line(S[0], S[1] - g, S[0], S[1] + g, { w: 0.5, detail: true }); }
    });
  }
});

/* a river with a salmon leaping out of it and back in, rings spreading where it leaves and lands, the
   surface lines sliding along and a reed at each bank. Tap: two fish cross in the air. */
var FISH = 'M-17 0 C-11 -8 7 -8 17 0 C7 8 -11 8 -17 0 Z';
function fish(p, x0, x1, h, u, c) {
  var x = x0 + (x1 - x0) * u, y = 62 - h * 4 * u * (1 - u), dir = x1 > x0 ? 1 : -1;
  p.at(x, y, Math.atan2(-h * 4 * (1 - 2 * u), x1 - x0), [1.3, 1.3 * dir], function () {
    p.path('M-15 0 L-27 -9 C-24 -3 -24 3 -27 9 Z', { fill: c, w: 0.8 });
    p.path('M-3 -7 L1 -14 L8 -6.5 Z', { fill: c, w: 0.8 });
    p.path(FISH, { fill: c, w: 0.9 });
    p.path('M-12 3 C-4 7 7 6 14 1', { w: 0.4, detail: true }); p.path('M6 -4 C8 -1 8 2 6 4', { w: 0.45, detail: true });
    p.circle(10, -1.8, 1.5, { fill: 'ink', line: false });
  });
}
function ripple(p, x, a) {
  if (a <= 0 || a >= 1) return;
  var r = 4 + 26 * M.easeOut(a), ry = r * 0.28;
  p.span('M' + (x - r) + ' 62 A' + r + ' ' + ry + ' 0 1 1 ' + (x + r) + ' 62 A' + r + ' ' + ry + ' 0 1 1 ' + (x - r) + ' 62', M.easeIn(M.seg(a, 0.45, 1)), M.easeOut(M.seg(a, 0, 0.5)), { w: 0.6 });
}
D.add('river', {
  fam: 'ornament', tags: ['divider', 'river', 'water', 'fish', 'stream', 'nature', 'flow', 'salmon'], loop: 5, ratio: 6, still: 0.3, tapLen: 2, burst: 'drop', burstAt: [300, 56], burstN: 7, burstSpread: 2.4, margin: [14, 10, 10, 10],
  about: 'a fish leaps out and back in, rings spreading, the surface lines sliding and the reeds swaying', tapAbout: 'two fish leap and cross in the air',
  draw: function (p, t, s) {
    var tp = s.tap, u = M.seg(t, 0.12, 0.52), i, pts = [], x;
    [[28, 52, 0], [14, 40, 0.3], [586, 52, 0.15], [572, 40, 0.45]].forEach(function (R) {
      p.at(R[0], 94, 0.07 * M.wave(t, 1, R[2]), 1, function () {
        p.line(0, 0, 0, -R[1], { w: 0.8 }); p.ellipse(0, -R[1] + 8, 3.2, 8, { fill: 'brown', w: 0.7 });
        p.path('M0 -4 C9 -14 11 -28 7 -38', { w: 0.6 });
      });
    });
    if (u > 0 && u < 1) fish(p, 170, 410, 50, u, 'b');
    if (tp >= 0) { var a = M.seg(tp, 0.04, 0.6), b = M.seg(tp, 0.12, 0.68); if (a > 0 && a < 1) fish(p, 190, 400, 46, a, 'b'); if (b > 0 && b < 1) fish(p, 420, 180, 36, b, 'a'); }
    for (x = 0; x <= 600; x += 6) pts.push([x, 62 + 2.6 * Math.sin(TAU * (x / 60 - t))]);
    p.poly(pts.concat([[600, 98], [0, 98]]), { fill: 'sky', line: false });
    p.curve(pts, { w: 1 });
    for (i = 1; i < 3; i++) {
      var q = []; for (x = 0; x <= 600; x += 8) q.push([x, 62 + 12 * i + 2.6 * Math.sin(TAU * (x / 60 - t + 0.3 * i))]);
      p.curve(q, { w: 0.65 - 0.2 * i, detail: i > 1 });
    }
    ripple(p, 170, (t - 0.12) / 0.3); ripple(p, 410, (t - 0.52) / 0.3);
    if (tp >= 0) { ripple(p, 190, (tp - 0.04) / 0.4); ripple(p, 400, (tp - 0.6) / 0.4); ripple(p, 420, (tp - 0.12) / 0.4); ripple(p, 180, (tp - 0.68) / 0.4); }
  }
});

/* a fence of boards and a ginger cat walking along the top, tail up and swaying a beat behind her, the
   legs in a diagonal gait. Tap: the boards hop up in a wave and the cat arches her back and puffs her tail. */
function cat(p, ph, tail, arch) {
  var bob = 0.8 * Math.sin(TAU * ph * 2), i, sd;
  for (sd = 0; sd < 2; sd++) for (i = 0; i < 2; i++) {
    var u = TAU * (ph + (sd === i ? 0.5 : 0)), ax = i ? -15 : 14, px = ax + 8 * Math.sin(u), py = -4 * Math.max(0, Math.cos(u));
    p.poly(band([[ax, -13 + bob], [ax + (i ? 4 : -3) + (px - ax) * 0.3, -6 + py * 0.3], [px, py]], 2.5), { fill: sd ? 'orange' : 'brown', w: 0.7 });
  }
  p.poly(band(bez([-20, -21 + bob], [-34 + 6 * tail, -24], [-30 + 8 * tail, -40], [-27 + 10 * tail, -52 + 4 * arch], 8), 2.3 + 3.2 * arch), { fill: 'orange', w: 0.8 });
  p.ellipse(0, -19 + bob - 4 * arch, 21, 9 + 5 * arch, { fill: 'orange', w: 0.9 });
  p.path('M-9 -27 L-6 -19 M-1 -28 L1 -20 M7 -27 L8 -20', { w: 0.5, detail: true });
  p.circle(25, -27 + bob - 2 * arch, 8, { fill: 'orange', w: 0.9 });
  p.poly([[19, -32 + bob], [20 - 3 * arch, -42 + bob + 3 * arch], [26, -34 + bob]], { fill: 'orange', w: 0.7 });
  p.poly([[26, -34 + bob], [30 - 3 * arch, -42 + bob + 3 * arch], [32, -30 + bob]], { fill: 'orange', w: 0.7 });
  p.circle(28, -28 + bob - 2 * arch, 1.3, { fill: 'ink', line: false }); p.circle(32, -26 + bob - 2 * arch, 1.1, { fill: 'pink', line: false });
  p.line(32, -25 + bob, 40, -27 + bob, { w: 0.35, detail: true }); p.line(32, -24 + bob, 40, -22 + bob, { w: 0.35, detail: true });
}
D.add('fence', {
  fam: 'ornament', tags: ['divider', 'fence', 'cat', 'garden', 'wall', 'walk', 'rail', 'pet', '🐈'], loop: 10, ratio: 5, still: 0.35, tapLen: 1.6, burst: false, margin: [16, 10, 8, 10],
  about: 'a ginger cat walks along the top of a fence, tail swaying a beat behind her', tapAbout: 'the boards hop up in a wave and the cat arches her back and puffs her tail',
  draw: function (p, t, s) {
    var tp = s.tap, i, x, cx = -60 + 620 * M.frac(t + 0.15), arch = tp >= 0 ? M.bump(M.seg(tp, 0, 0.8)) : 0;
    for (i = 0; i < 12; i++) {
      x = (i + 0.5) * 500 / 12; var hop = tp >= 0 ? 7 * M.bump(M.seg(tp, i * 0.04, i * 0.04 + 0.3)) : 0;
      p.poly([[x - 17, 92], [x - 17, 56 - hop], [x - 13, 50 - hop], [x + 13, 50 - hop], [x + 17, 56 - hop], [x + 17, 92]], { fill: 'wood', w: 0.9 });
      p.line(x - 6, 60 - hop, x - 6, 84, { w: 0.35, detail: true }); p.line(x + 7, 64 - hop, x + 7, 88, { w: 0.35, detail: true });
    }
    p.rect(0, 68, 500, 7, { fill: 'wood', w: 0.9 });
    for (i = 0; i < 12; i++) p.circle((i + 0.5) * 500 / 12, 71.5, 1.3, { fill: 'ink', line: false, detail: true });
    if (cx > -54 && cx < 552) p.at(cx, 50, 0, 1, function () { cat(p, 30 * t, M.wave(t, 2, 0.1), arch); });
  }
});

/* three dots that hop in turn, the way a chat shows someone typing: each lifts, stretches, lands and
   squashes with its shadow, the next already going. Tap: all three jump high in a wave. */
D.add('ellipsis', {
  fam: 'ornament', tags: ['divider', 'dots', 'typing', 'wait', 'loading', 'more', 'chat', 'ellipsis', '…'], loop: 1.6, ratio: 2.5, still: 0.1, tapLen: 1.3, burst: 'confetti', burstAt: [125, 40], burstN: 7, margin: [26, 10, 8, 10],
  about: 'three dots hop in turn, stretching in the air and squashing as they land', tapAbout: 'all three jump high in a wave, landing with a spring',
  draw: function (p, t, s) {
    var tp = s.tap;
    [50, 125, 200].forEach(function (x, i) {
      var ph = M.frac(t - 0.16 * i), u = M.seg(ph, 0, 0.45), h = 32 * 4 * u * (1 - u), q = M.bump(M.seg(ph, 0.45, 0.62)), st = 0;
      if (tp >= 0) { var a = M.seg(tp, i * 0.1, i * 0.1 + 0.6); h = 56 * 4 * a * (1 - a) + 4 * M.bump(M.seg(tp, i * 0.1 + 0.6, i * 0.1 + 0.9)); q = M.bump(M.seg(tp, i * 0.1 + 0.6, i * 0.1 + 0.8)) * 1.3; }
      st = Math.min(0.2, h / 160);
      p.ellipse(x, 92, 15 - 7 * h / 56, 3.2, { fill: 'smoke', line: false });
      p.at(x, 90 - h, 0, [1 - st * 0.5 + 0.22 * q, 1 + st - 0.3 * q], function () { p.circle(0, -15, 15, { fill: ['a', 'b', 'c'][i], w: 1.1 }); p.arc(-5, -20, 7, 3.6, 4.7, { w: 0.5, ink: 'white', detail: true }); });
    });
  }
});

/* an underline drawn by a pencil, then rubbed out by its eraser from the start: the line is made, held,
   and taken back. Tap: a second, busier line scribbles in from the right under it. */
function along(q, u) {
  var tot = 0, L = 0, i, d;
  for (i = 1; i < q.length; i++) tot += Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]);
  u *= tot;
  for (i = 1; i < q.length; i++) { d = Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]); if (L + d >= u) return [q[i - 1][0] + (q[i][0] - q[i - 1][0]) * (u - L) / (d || 1), q[i - 1][1] + (q[i][1] - q[i - 1][1]) * (u - L) / (d || 1)]; L += d; }
  return q[q.length - 1];
}
function pencil(p) {
  p.poly([[0, 0], [10, -3.4], [10, 3.4]], { fill: 'sand', w: 0.7 });
  p.poly([[0, 0], [3.4, -1.3], [3.4, 1.3]], { fill: 'ink', w: 0.4 });
  p.rect(10, -3.4, 30, 6.8, { fill: 'yellow', w: 0.8 });
  p.line(10, 0, 40, 0, { w: 0.35, detail: true });
  p.rect(40, -3.4, 6, 6.8, { fill: 'grey', w: 0.7 });
  p.rect(46, -3.4, 8, 6.8, { fill: 'pink', r: 2, w: 0.8 });
}
D.add('squiggle', {
  fam: 'ornament', tags: ['divider', 'underline', 'squiggle', 'pencil', 'draw', 'wavy', 'highlight', 'emphasis', 'eraser'], loop: 4, ratio: 5, still: 0.52, tapLen: 1.8, burst: false, margin: [12, 14, 10, 10],
  about: 'a pencil draws a wavy underline, then its eraser rubs it out from the start', tapAbout: 'a second, busier line scribbles in from the right under it',
  draw: function (p, t, s) {
    var tp = s.tap, pts = [], x, k;
    for (x = 0; x <= 500; x += 4) pts.push([x, 52 + 7 * Math.sin(TAU * 13 * x / 500)]);
    var head = M.ease(M.seg(t, 0.04, 0.42)), tail = M.ease(M.seg(t, 0.6, 0.95));
    p.span(pts, tail, head, { w: 1.1 });
    var pf = M.seg(t, 0.02, 0.06) * (1 - M.easeIn(M.seg(t, 0.42, 0.5))), lift = M.ease(M.seg(t, 0.42, 0.5));
    if (pf > 0.03) { var e = along(pts, head); p.at(e[0] + 30 * lift, e[1] - 34 * lift, -0.95 + 0.05 * Math.sin(TAU * 14 * t), pf, function () { pencil(p); }); }
    var er = M.seg(t, 0.56, 0.6) * (1 - M.seg(t, 0.94, 0.98));
    if (er > 0.03) {
      var g = along(pts, tail);
      p.at(g[0] + 1.5 * Math.sin(TAU * 30 * t), g[1], Math.PI - 0.95, er, function () { p.move(-54, 0); pencil(p); });
      for (k = 0; k < 3; k++) { var cp = M.frac(t * 6 + k / 3); p.circle(g[0] - 6 - 14 * cp, g[1] + 4 + 16 * cp * cp, 1.5 * (1 - cp), { fill: 'pink', line: false, detail: true }); }
    }
    if (tp >= 0) {
      var q = []; for (x = 500; x >= 0; x -= 4) q.push([x, 78 + 5 * Math.sin(TAU * 18 * x / 500)]);
      p.span(q, M.ease(M.seg(tp, 0.6, 0.95)), M.ease(M.seg(tp, 0.05, 0.5)), { w: 0.9 });
    }
  }
});

/* a corner flourish for the top left of a box (flip or turn it for the others): a double rule meets
   in a fan of petals, a scroll runs out along each edge, and a glint runs out along the rules. Tap:
   the fan spreads wide and springs back while the scrolls twirl round once. */
var PETAL = 'M0 0 C9 -6 24 -6 36 0 C24 6 9 6 0 0 Z';
var SCROLLS = [
  [bez([58, 27], [68, 18], [78, 35], [90, 27], 10), 90, 27, 1.05, 1, 7],
  [bez([27, 58], [18, 68], [35, 78], [27, 90], 10), 27, 90, 0.52, -1, 7]
];
D.add('corner', {
  fam: 'ornament', tags: ['border', 'corner', 'frame', 'flourish', 'ornament', 'box', 'divider', 'vintage'], loop: 3.6, ratio: 1, still: 0.4, tapLen: 1.6, burst: 'petal', burstAt: [24, 24], burstN: 6, burstSpread: 2, margin: [10, 10, 10, 10],
  about: 'a fan of petals breathes in the corner of a box while a glint runs out along the rules', tapAbout: 'the fan spreads wide and springs back while the scrolls twirl round once',
  draw: function (p, t, s) {
    var tp = s.tap;
    p.path('M100 10 L10 10 L10 100', { w: 1.1, cap: 'round' }); p.path('M100 18 L52 18 M18 100 L18 52', { w: 0.5, cap: 'round' });
    SCROLLS.forEach(function (C, n) {
      var twirl = tp >= 0 ? TAU * M.easeOut(M.seg(tp, n * 0.1, n * 0.1 + 0.7)) : 0, d = C[0];
      p.curve(d, { w: 0.95 });
      p.pivot(C[1], C[2], 0.2 * M.wave(t, 1, -n / 4) + twirl, 1, function () { p.curve(curl(C[1], C[2], C[3], C[4], C[5]), { w: 0.95 }); });
      var q = d[5], q2 = d[6], pop = tp >= 0 ? M.spring(M.seg(tp, 0.1 + 0.1 * n, 0.5 + 0.1 * n)) : 1;
      p.at(q[0], q[1], Math.atan2(q2[1] - q[1], q2[0] - q[0]) + (n ? 0.8 : -0.8) + 0.14 * M.wave(t, 1, -n / 4), pop, function () { p.path('M0 0 C3 -6 11 -7 16 -4 C12 1 5 3 0 0 Z', { fill: 'leaf', w: 0.7 }); });
    });
    var open = tp >= 0 ? 0.22 * M.bump(M.seg(tp, 0, 0.8)) : 0;
    [0, 1, 2, 3, 4].forEach(function (i) {
      var len = [30, 38, 46, 38, 30][i] * (1 + 0.06 * M.wave(t, 1, -i / 10)), ang = 0.15 + i * 0.3 + (i - 2) * open;
      p.at(10, 10, ang, len / 36, function () { p.path(PETAL, { fill: ['c', 'b', 'a', 'b', 'c'][i], w: 1 }); });
    });
    p.circle(10, 10, 6, { fill: 'white', w: 0.9 });
    var h2 = 1.15 * M.seg(t, 0.02, 0.6), hd = Math.min(1, h2), tl = Math.max(0, h2 - 0.15);
    p.span('M10 10 L100 10', tl, hd, { w: 1.3, ink: 'a', cap: 'round' }); p.span('M10 10 L10 100', tl, hd, { w: 1.3, ink: 'a', cap: 'round' });
  }
});

/* a needle sews a running stitch along a hem: the thread shows as a hump where it rides over the cloth
   and vanishes where it goes through, and when the seam is done the needle backs out, unpicking.
   Tap: the thread is drawn tight, the stitches flattening and springing back one after another. */
function needle(p) {
  p.path('M0 0 L34 -2.4 C39 -2.4 44 -1.4 44 0 C44 1.4 39 2.4 34 2.4 Z', { fill: 'grey', w: 0.7 });
  p.ellipse(38, 0, 3, 0.9, { fill: 'bg', w: 0.4, detail: true });
}
D.add('stitches', {
  fam: 'ornament', tags: ['divider', 'sewing', 'stitch', 'thread', 'needle', 'seam', 'hem', 'craft', 'mend'], loop: 5, ratio: 5, still: 0.52, tapLen: 1.6, burst: 'spark', burstAt: [250, 40], burstN: 6, margin: [22, 14, 14, 14],
  about: 'a needle sews a running stitch along a hem, then backs out unpicking it', tapAbout: 'the thread is drawn tight, the stitches flattening and springing back in turn',
  draw: function (p, t, s) {
    var tp = s.tap, x, pts = [];
    var Y = function (x) { return 50 - 12 * (1 - 0.75 * (tp >= 0 ? M.bump(M.seg(tp, x / 500 * 0.5, x / 500 * 0.5 + 0.4)) : 0)) * Math.sin(TAU * x / 50); };
    for (x = 0; x <= 500; x += 4) pts.push([x, Y(x)]);
    var right = t < 0.5, sh = (right ? -0.14 + 1.29 * M.ease(M.seg(t, 0.03, 0.45)) : 1.15 - 1.29 * M.ease(M.seg(t, 0.55, 0.97))) * 500;
    p.draw(pts, Math.max(0, Math.min(1, (sh - 36) / 500)), { w: 1.2, ink: 'b' });
    if (right ? sh > -18 && sh < 556 : sh < 518 && sh > -56) p.at(sh, Y(sh), Math.atan2(Y(sh + 2) - Y(sh - 2), 4) + (right ? Math.PI : 0), 1.3, function () { needle(p); });
    p.rect(0, 50, 500, 20, { fill: 'sky', w: 1 });
    p.line(6, 61, 494, 61, { w: 0.4, dash: [6, 5], detail: true });
    p.circle(0, 50, 3.2, { fill: 'b', w: 0.5 });
  }
});

/* a washing line: shirt, sock, towel, trousers, dress and hanky swing in a breeze that runs along the
   line, each leaning at the foot a beat behind its peg. Tap: a gust streams them all out to the right. */
var CLOTHES = [
  [58, 'M-10 0 L-24 8 L-20 17 L-14 14 L-14 40 L14 40 L14 14 L20 17 L24 8 L10 0 C6 5 -6 5 -10 0 Z', 'b'],
  [118, 'M-6 0 L6 0 L6 24 C6 31 16 31 16 38 C16 45 7 47 1 45 C-6 43 -6 36 -6 28 Z', 'a'],
  [182, 'M-18 0 L18 0 L18 44 L-18 44 Z', 'c'],
  [250, 'M-14 0 L14 0 L15 44 L3 44 L0 16 L-3 44 L-15 44 Z', 'sky'],
  [316, 'M-6 0 L6 0 L7 9 L18 42 L-18 42 L-7 9 Z', 'pink'],
  [376, 'M-9 0 L9 0 L9 20 L-9 20 Z', 'yellow'],
  [434, 'M-6 0 L6 0 L6 24 C6 31 16 31 16 38 C16 45 7 47 1 45 C-6 43 -6 36 -6 28 Z', 'c']
];
D.add('washing-line', {
  fam: 'ornament', tags: ['divider', 'laundry', 'washing', 'line', 'clothes', 'breeze', 'home', 'drying', 'wash day'], loop: 3.6, ratio: 5, still: 0.2, tapLen: 2.2, burst: false, margin: [10, 12, 10, 12],
  about: 'laundry swings on a line in a breeze that runs along it, each piece leaning a beat behind its peg', tapAbout: 'a gust streams every piece out to the right, then they swing back',
  draw: function (p, t, s) {
    var tp = s.tap, ly = function (x) { var u = x / 500; return 20 + 15 * 4 * u * (1 - u); }, str = [], x;
    p.line(8, 96, 8, 14, { w: 1.4 }); p.line(492, 96, 492, 14, { w: 1.4 });
    for (x = 8; x <= 492; x += 12) str.push([x, ly(x)]);
    p.curve(str, { w: 0.8 });
    CLOTHES.forEach(function (C, i) {
      var g = tp >= 0 ? M.spring(M.seg(tp, i * 0.04, i * 0.04 + 0.35)) * (1 - M.easeIn(M.seg(tp, 0.55 + i * 0.03, 1))) : 0, a = 0.11 * M.wave(t, 1, -C[0] / 500) - 0.9 * g, lean = 0.2 * M.wave(t, 1, -C[0] / 500 - 0.1) + 0.5 * g * M.wave(tp < 0 ? 0 : tp, 4);
      p.at(C[0], ly(C[0]), 0, 1, function () {
        p.turn(a); p.skew(lean, 0);
        p.path(C[1], { fill: C[2], w: 0.9 });
        p.line(-10, 30, 10, 30, { w: 0.4, detail: true });
        p.rect(-3, -4, 5, 9, { fill: 'wood', w: 0.6 });
      });
    });
  }
});

/* a zipper: the slider runs the length, closing the teeth behind it, and comes back opening them
   again, its pull-tab trailing behind the pull. Tap: the teeth hop in a wave and the tab flips. */
D.add('zipper', {
  fam: 'ornament', tags: ['divider', 'zip', 'zipper', 'open', 'close', 'fasten', 'clothes', 'bag', 'reveal'], loop: 5, ratio: 5, still: 0.25, tapLen: 1.4, burst: 'spark', burstAt: [250, 50], burstN: 6, margin: [26, 10, 10, 10],
  about: 'a zip slider runs along closing the teeth behind it, then comes back opening them', tapAbout: 'the teeth hop up in a wave and the pull-tab flips over',
  draw: function (p, t, s) {
    var tp = s.tap, pos = function (u) { return u < 0.5 ? M.ease(M.seg(u, 0, 0.5)) : 1 - M.ease(M.seg(u, 0.5, 1)); }, xs = 30 + 440 * pos(t), i, x;
    var g = function (x) { return x > xs ? 22 * M.ease(M.seg(x - xs, 0, 70)) : 0; }, tt = [], bb = [];
    for (x = 0; x <= 500; x += 10) { tt.push([x, 47 - g(x) / 2]); bb.push([x, 53 + g(x) / 2]); }
    p.poly(tt.map(function (q) { return [q[0], q[1] - 14]; }).concat(tt.slice().reverse()), { fill: 'c', w: 0.9 });
    p.poly(bb.concat(bb.slice().reverse().map(function (q) { return [q[0], q[1] + 14]; })), { fill: 'c', w: 0.9 });
    for (i = 0; i < 31; i++) {
      var hop = tp >= 0 ? 4 * M.bump(M.seg(tp, i / 31 * 0.6, i / 31 * 0.6 + 0.3)) : 0, xt = 8 + 16 * i, xb = 16 * i;
      p.rect(xt - 3.5, 47 - g(xt) / 2 - hop, 7, 7, { fill: 'grey', r: 2, w: 0.6, detail: true });
      p.rect(xb - 3.5, 46 + g(xb) / 2 + hop, 7, 7, { fill: 'grey', r: 2, w: 0.6, detail: true });
    }
    var v = (pos(M.frac(t + 0.01)) - pos(M.frac(t - 0.01))) / 0.02, flip = tp >= 0 ? TAU * M.easeOut(M.seg(tp, 0, 0.8)) : 0;
    p.at(xs, 50, 0, 1, function () {
      p.pivot(0, -10, -0.25 - 0.17 * v + flip, 1, function () { p.rect(-4.5, -34, 9, 25, { fill: 'a', r: 4, w: 0.9 }); p.circle(0, -28, 1.8, { fill: 'bg', w: 0.4, detail: true }); });
      p.poly([[-13, -12], [11, -9], [11, 9], [-13, 12]], { fill: 'a', w: 1 });
      p.line(-6, -5, 4, -5, { w: 0.4, detail: true });
    });
  }
});

/* dominoes standing in a row topple one after another, left to right, and are stood up again in the
   same order, each rocking back a little before it settles. Tap: they hop and rock in a wave. */
var PIPS = [[[0, 0]], [[-3, -3], [3, 3]], [[-3, -3], [0, 0], [3, 3]], [[-3, -3], [3, -3], [-3, 3], [3, 3]]];
D.add('dominoes', {
  fam: 'ornament', tags: ['divider', 'dominoes', 'chain', 'fall', 'topple', 'game', 'domino effect', 'row', '🁣'], loop: 6, ratio: 5, still: 0.03, tapLen: 1.6, burst: false, margin: [10, 40, 8, 10],
  about: 'dominoes topple in a wave from the left, then stand up again in the same order', tapAbout: 'the row hops and rocks in a wave, left to right',
  draw: function (p, t, s) {
    var tp = s.tap;
    for (var k = 0; k < 17; k++) {
      var x = 15 + 29.4 * k, f = M.seg(t, 0.05 + 0.028 * k, 0.15 + 0.028 * k), r = M.seg(t, 0.58 + 0.017 * k, 0.68 + 0.017 * k), a = 1.4 * M.easeIn(f) * (1 - M.spring(r)), hop = 0;
      if (tp >= 0) { var q = M.bump(M.seg(tp, k * 0.03, k * 0.03 + 0.3)); a += 0.25 * q; hop = 10 * q; }
      p.pivot(x + 8, 88, a, 1, function () {
        p.rect(x - 8, 36 - hop, 16, 52, { fill: 'cream', r: 3, w: 0.9 });
        p.line(x - 5, 62 - hop, x + 5, 62 - hop, { w: 0.5, detail: true });
        PIPS[k % 4].forEach(function (c) { p.circle(x + c[0], 49 - hop + c[1], 1.7, { fill: 'ink', line: false, detail: true }); });
        PIPS[(k * 3 + 1) % 4].forEach(function (c) { p.circle(x + c[0], 75 - hop + c[1], 1.7, { fill: 'ink', line: false, detail: true }); });
      });
    }
  }
});

/* a caterpillar crosses, a hump running from tail to head along its body as it hitches itself forward.
   Tap: it rears up at the front and the antennae wave. */
D.add('caterpillar', {
  fam: 'ornament', tags: ['divider', 'caterpillar', 'crawl', 'insect', 'garden', 'slow', 'growth', 'worm', '🐛'], loop: 14, ratio: 5, still: 0.28, tapLen: 1.6, burst: 'leaf', burstAt: [250, 50], burstN: 4, margin: [24, 10, 8, 10],
  about: 'a caterpillar crosses, a hump running from tail to head as it hitches forward', tapAbout: 'it rears up at the front and waves its antennae',
  draw: function (p, t, s) {
    var tp = s.tap, xh = -40 + 740 * M.frac(t + 0.1), up = tp >= 0 ? M.bump(M.seg(tp, 0, 0.8)) : 0, i;
    p.line(0, 87, 500, 87, { w: 0.35, dash: [10, 9], detail: true });
    for (i = 9; i >= 0; i--) {
      var x = xh - i * 18.5, lift = 9 * Math.pow(Math.max(0, Math.sin(TAU * (16 * t - i * 0.11))), 2) + 30 * up * M.ease(M.clamp((4 - i) / 4, 0, 1)), r = i ? 10.5 : 12.5, y = 86 - r - lift;
      if (x < -30 || x > 530) continue;
      if (i) { p.line(x - 4, y + r - 1, x - 6, 87, { w: 0.5, detail: true }); p.line(x + 4, y + r - 1, x + 6, 87, { w: 0.5, detail: true }); }
      p.circle(x, y, r, { fill: i ? (i % 2 ? 'leaf' : 'mint') : 'a', w: 1 });
      if (i === 0) {
        p.circle(x + 4.5, y - 2.5, 1.8, { fill: 'ink', line: false }); p.arc(x + 5, y + 1, 5, 0.3, 2, { w: 0.5, detail: true });
        var sw = 0.4 * M.wave(t, 8) + 0.5 * up * M.wave(tp < 0 ? 0 : tp, 5);
        p.at(x + 1, y - 10, sw, 1.3, function () { p.path('M0 0 C-2 -6 -1 -10 3 -13', { w: 0.5 }); p.dot(3, -13, 1.6, 'b'); });
        p.at(x + 6, y - 9, sw * 0.8, 1.3, function () { p.path('M0 0 C1 -6 4 -9 8 -10', { w: 0.5 }); p.dot(8, -10, 1.6, 'b'); });
      }
    }
  }
});

/* a row of candles of different heights, the flames guttering one after another along it. Tap: a breath
   runs along the row, blowing each flame flat and out with a curl of smoke, and they are relit in turn. */
D.add('candles', {
  fam: 'ornament', tags: ['divider', 'candles', 'flame', 'light', 'birthday', 'vigil', 'warm', 'wish', '🕯'], loop: 3, ratio: 5, still: 0.2, tapLen: 2.6, tapRest: 0.3, burst: false, margin: [30, 10, 6, 10],
  about: 'candles of different heights gutter in turn along the row', tapAbout: 'a breath runs along the row blowing the flames out with a curl of smoke, and each is relit in turn',
  draw: function (p, t, s) {
    var tp = s.tap;
    p.line(0, 92, 500, 92, { w: 1.1 });
    for (var i = 0; i < 7; i++) {
      var x = 36 + 71.3 * i, top = 92 - [34, 46, 28, 52, 38, 44, 30][i], lean = 0.12 * M.wave(t, 1, -i / 7), sc = 1, a = tp - i * 0.04, b = tp - 0.45 - i * 0.05;
      if (tp >= 0) {
        if (b > 0) { lean = 0; sc = M.spring(M.seg(b, 0, 0.2)); }
        else if (a > 0) { lean = 1.2 * M.ease(M.seg(a, 0, 0.1)); sc = 1 - M.ease(M.seg(a, 0.1, 0.2)); }
      }
      p.rect(x - 8, top, 16, 92 - top, { fill: ['cream', 'a', 'b', 'c', 'pink', 'cream', 'sky'][i], w: 0.9 });
      p.ellipse(x + 8, top + 7, 2.4, 6, { fill: ['cream', 'a', 'b', 'c', 'pink', 'cream', 'sky'][i], w: 0.6, detail: true });
      p.line(x, top, x, top - 5, { w: 0.7 });
      if (sc > 0.03) p.at(x, top - 4, lean, [1.25 * sc * (1 + 0.1 * M.wave(t, 3, -i / 3.5)), 1.25 * sc * (1 + 0.15 * M.wave(t, 2, -i * 0.14))], function () {
        p.path('M0 0 C-6 -4 -5 -12 0 -21 C5 -12 6 -4 0 0 Z', { fill: 'flame', line: false, glow: 0.9 });
        p.path('M0 0 C-6 -4 -5 -12 0 -21 C5 -12 6 -4 0 0 Z', { w: 0.8 });
        p.path('M0 -1 C-2.5 -3 -2.4 -8 0 -12 C2.4 -8 2.5 -3 0 -1 Z', { fill: 'yellow', w: 0.4, detail: true });
      });
      if (tp >= 0 && a > 0.12 && a < 0.55) p.span('M' + x + ' ' + (top - 6) + ' C' + (x - 7) + ' ' + (top - 14) + ' ' + (x + 7) + ' ' + (top - 22) + ' ' + x + ' ' + (top - 34), M.seg(a, 0.3, 0.55), M.easeOut(M.seg(a, 0.12, 0.4)), { w: 0.6 });
      if (tp >= 0 && b > 0 && b < 0.06) p.star(x, top - 8, 7 * M.bump(b / 0.06), 2, 4, { fill: 'yellow', w: 0.5 });
    }
  }
});

/* a rosette to stand at the heart of a section: three rings of petals, a swell running round each ring
   in its own direction, the rings swaying against one another. Tap: it blooms, every ring turning by one
   petal and settling. */
var ROSE = 'M0 0 C-6 -12 -5 -30 0 -40 C5 -30 6 -12 0 0 Z';
D.add('rosette', {
  fam: 'ornament', tags: ['centrepiece', 'rosette', 'mandala', 'flower', 'ornament', 'medallion', 'badge', 'section', 'seal'], loop: 4, ratio: 1, still: 0.3, tapLen: 1.6, tapRest: 0.6, burst: 'petal', burstAt: [50, 50], burstN: 8, margin: [8, 8, 8, 8],
  about: 'three rings of petals, a swell running round each in its own direction', tapAbout: 'it blooms, every ring turning by one petal and settling',
  draw: function (p, t, s) {
    var tp = s.tap;
    [[12, 1, 'a', 0, 1], [8, 0.74, 'b', 0.5, -1], [8, 0.46, 'cream', 0, 1]].forEach(function (R, ri) {
      var n = R[0], step = TAU / n, sw = 0.12 * R[4] * M.wave(t, 1, ri / 3) + (tp >= 0 ? R[4] * step * M.spring(M.seg(tp, ri * 0.08, ri * 0.08 + 0.7)) : 0), bl = tp >= 0 ? 0.14 * M.bump(M.seg(tp, ri * 0.08, ri * 0.08 + 0.8)) : 0;
      for (var k = 0; k < n; k++) {
        var pos = k + R[3] + sw / step;
        p.at(50, 50, pos * step, R[1] * (1 + 0.1 * M.wave(t, 1, -pos / n * R[4]) + bl), function () { p.path(ROSE, { fill: R[2], w: 0.7 }); p.path('M0 -6 C-1.5 -14 -1 -24 0 -32', { w: 0.35, detail: true }); });
      }
    });
    p.circle(50, 50, 7 + 0.6 * M.wave(t, 1), { fill: 'c', w: 0.9 });
    p.circle(50, 50, 2.4, { fill: 'white', line: false });
  }
});
})(Dingbats);
