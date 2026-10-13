/* Signals: the small working glyphs of a screen — loading, sent, saved, found, ringing. */
(function (D) {
'use strict';
var M = D.math, TAU = M.TAU, PI = Math.PI, sin = Math.sin, cos = Math.cos;

/* a clockwise arc as path data, for p.draw and p.span */
function arcD(cx, cy, r, a0, a1) {
  return 'M' + (cx + r * cos(a0)) + ' ' + (cy + r * sin(a0)) + ' A' + r + ' ' + r + ' 0 ' + (a1 - a0 > PI ? 1 : 0) + ' 1 ' + (cx + r * cos(a1)) + ' ' + (cy + r * sin(a1));
}
/* a closed oval as path data, from its left edge over the top */
function oval(cx, cy, rx, ry) {
  return 'M' + (cx - rx) + ' ' + cy + ' A' + rx + ' ' + ry + ' 0 1 1 ' + (cx + rx) + ' ' + cy + ' A' + rx + ' ' + ry + ' 0 1 1 ' + (cx - rx) + ' ' + cy;
}
/* a value gliding through keyframes [[t, v], …], each leg eased */
function track(t, k) {
  for (var i = 1; i < k.length; i++) if (t <= k[i][0]) return M.lerp(k[i - 1][1], k[i][1], M.ease(M.seg(t, k[i - 1][0], k[i][0])));
  return k[k.length - 1][1];
}
/* a struck thing: 0 at u = 0, n swings that die away by u = 1 */
function ring(u, n) { return u <= 0 || u >= 1 ? 0 : sin(TAU * n * u) * (1 - u) * (1 - u); }
/* how much of the tap reaction replaces the idle loop: in over the first a, out over the last 1 - b */
function tapw(s, a, b) { return s.tap < 0 ? 0 : M.ease(M.seg(s.tap, 0, a)) * (1 - M.ease(M.seg(s.tap, b, 1))); }
/* a pair of slanted bright bands crossing x0..x1 as u runs 0 → 1; draw it inside p.clip */
function shine(p, u, x0, x1, y0, y1) {
  if (u <= 0 || u >= 1) return;
  var x = M.lerp(x0 - 14, x1 + 4, u), k = (y1 - y0) * 0.35;
  p.poly([[x, y0 - 2], [x + 7, y0 - 2], [x + 7 - k, y1 + 2], [x - k, y1 + 2]], { fill: 'white', line: false, alpha: 0.55 });
  p.poly([[x + 10, y0 - 2], [x + 13, y0 - 2], [x + 13 - k, y1 + 2], [x + 10 - k, y1 + 2]], { fill: 'white', line: false, alpha: 0.4 });
}

/* three ants carry crumbs round a track, the front one a step ahead of the others.
   Tap: each tosses its crumb up toward you and catches it, one after another. */
function ant(p, t, k, toss) {
  p.at(0, 0, 0, p.small ? 1.5 : 0.85, function () {
    [4, -0.5, -5].forEach(function (x, i) {
      var w = 3 * M.wave(t, 9, i / 3 + k * 0.17);
      p.line(x, 2, x + w, 9, { w: 0.45, detail: true }); p.line(x, -2, x - w, -9, { w: 0.45, detail: true });
    });
    p.ellipse(-9, 0, 6.5, 4.6, { fill: 'brown' });
    p.ellipse(-0.5, 0, 4.2, 3.4, { fill: 'brown' });
    p.circle(6.5, 0, 3.8, { fill: 'brown' });
    p.at(15.5, 0, 1.4 * toss, 1 + 0.9 * toss, function () {
      if (toss > 0) p.ellipse(1, 3, 5, 3, { fill: 'smoke', line: false, alpha: 0.6 });
      p.poly([[-5, -3.5], [3, -5], [6, 1], [1, 5], [-6, 3]], { fill: 'sand', w: 0.7 });
    });
  });
}
D.add('loading', {
  fam: 'signals', tags: ['wait', 'busy', 'progress', 'ants', 'working', 'please wait', 'spinner'], loop: 3, still: 0.1, burst: false, tapLen: 1.3,
  about: 'three ants carry crumbs round a track, the front one a step ahead', tapAbout: 'each ant tosses its crumb toward you and catches it',
  draw: function (p, t, s) {
    p.circle(50, 50, 31, { w: 0.35, dash: [2, 5], detail: true, alpha: 0.7 });
    [0, 0.3, 0.64].forEach(function (off, i) {
      var a = TAU * (t + off) - PI / 2, toss = s.tap >= 0 ? M.bump(M.seg(s.tap, 0.06 + i * 0.16, 0.5 + i * 0.16)) : 0;
      p.at(50 + 31 * cos(a), 50 + 31 * sin(a), a + PI / 2, 1, function () { ant(p, t, i, toss); });
    });
  }
});

/* a ring drawn chasing its own tail: the head runs ahead, the tail catches up and runs on.
   Tap: the head catches the tail, the ring closes with a pulse, then lets go. */
D.add('spinner', {
  fam: 'signals', tags: ['wait', 'busy', 'loading', 'ring', 'progress', 'circle'], loop: 1.6, still: 0.3, burst: false, tapLen: 1.1,
  about: 'a ring drawn chasing its own tail', tapAbout: 'the head catches its tail, the ring closes with a pulse, then lets go',
  draw: function (p, t, s) {
    var k = s.tap >= 0 ? M.bump(M.seg(s.tap, 0.05, 0.9)) : 0, e = 0.5 - 0.5 * cos(TAU * t);
    var head = -PI / 2 + TAU * (2 * t + 0.2 * sin(TAU * t)), L = TAU * (0.1 + 0.62 * e), pulse = 1 + 0.08 * M.bump(M.seg(s.tap, 0.3, 0.8));
    L += (TAU * 0.97 - L) * k;
    p.circle(50, 50, 31, { w: 0.3, dash: [1.5, 4], alpha: 0.5, detail: true });
    p.pivot(50, 50, 0, pulse, function () {
      p.arc(50, 50, 31, head - L, head - L * 0.4, { w: 0.5 });
      p.arc(50, 50, 31, head - L * 0.65, head - L * 0.1, { w: 0.85, cap: 'round' });
      p.arc(50, 50, 31, head - L * 0.25, head, { w: 1.3, cap: 'round' });
    });
  }
});

var BELL = 'M50 17 C36 17 31 31 30 46 C29 60 24 68 15 76 C32 82 68 82 85 76 C76 68 71 60 70 46 C69 31 64 17 50 17 Z';
/* a hand bell swinging from its crown, the clapper a beat behind the shell.
   Tap: it is struck, rings hard through a few wide swings, and sound arcs go out either side. */
D.add('bell', {
  fam: 'signals', tags: ['notification', 'alert', 'ring', 'alarm', 'reminder', 'ding', '🔔'], loop: 2.2, still: 0.2, burst: false, tapLen: 1.6, margin: [18, 24, 14, 24],
  about: 'swings gently, the clapper a beat behind', tapAbout: 'rings hard, swinging wide, with sound arcs either side',
  draw: function (p, t, s) {
    var u = s.tap, A = 0.17;
    var sw = A * M.wave(t, 1) + 0.5 * ring(u, 3.5), cl = 1.9 * A * M.wave(t, 1, -0.1) + 0.9 * ring(u - 0.035, 3.5);
    p.pivot(50, 10, sw, 1, function () {
      p.circle(50, 12, 5, { w: 0.9 });
      p.path(BELL, { fill: 'a' });
      p.clip(BELL, function () { shine(p, M.seg(t, 0.55, 0.85), 15, 85, 14, 82); });
      p.path('M39 30 C36 38 35 46 35 54', { ink: 'white', w: 0.6, detail: true });
      p.path('M24 69 C38 74 62 74 76 69', { w: 0.45, detail: true });
      p.pivot(50, 40, cl - sw, 1, function () { p.line(50, 70, 50, 80, { w: 0.7 }); p.circle(50, 86, 6, { fill: 'brown' }); });
    });
    [0, 1].forEach(function (k) {
      var v = M.seg(u, 0.06 + k * 0.14, 0.6 + k * 0.14);
      if (v <= 0 || v >= 1) return;
      [[PI - 0.6, PI + 0.6], [-0.6, 0.6]].forEach(function (a) { p.span(arcD(50, 50, 44 + 11 * k, a[0], a[1]), M.easeIn(M.seg(v, 0.35, 1)), M.easeOut(M.seg(v, 0, 0.45)), { w: 0.7 }); });
    });
  }
});

/* a map pin hops, lands with a squash, and rings the ground with a ripple.
   Tap: it is thrown up out of sight and drops again, a big squash and three ripples. */
D.add('pin', {
  fam: 'signals', tags: ['location', 'map', 'place', 'here', 'address', 'marker', '📍'], loop: 2.4, still: 0.5, burst: false, tapLen: 1.5, margin: [40, 18, 14, 18],
  about: 'hops, lands with a squash, and rings the ground with a ripple', tapAbout: 'thrown up out of sight, drops again with a big squash and three ripples',
  draw: function (p, t, s) {
    var y = -22 * M.bump(M.seg(t, 0.04, 0.3)) - 7 * M.bump(M.seg(t, 0.4, 0.56)), sq = M.bump(M.seg(t, 0.3, 0.42)) * 0.8 + M.bump(M.seg(t, 0.56, 0.64)) * 0.3;
    var rip = [[0.3, 0.9, 1]], u = s.tap, w = tapw(s, 0.1, 0.85);
    if (u >= 0) {
      var up = M.easeOut(M.seg(u, 0, 0.14)), dn = M.easeIn(M.seg(u, 0.14, 0.42)), yt = -62 * up * (1 - dn);
      y = y * (1 - w) + yt * w; sq = sq * (1 - w) + (M.bump(M.seg(u, 0.42, 0.58)) + 0.35 * M.bump(M.seg(u, 0.58, 0.7))) * w * 1.1;
      rip = [[0.42, 1, 1.25], [0.5, 1.08, 1.05], [0.58, 1.16, 0.85]];
    }
    p.ellipse(50, 87, 17 - Math.min(10, -y * 0.2), 3.2, { fill: 'smoke', line: false });
    rip.forEach(function (r) {
      var v = u >= 0 ? M.seg(u, r[0], r[0] + 0.4) : M.seg(t, r[0], r[0] + 0.55);
      if (v <= 0 || v >= 1) return;
      var rx = (8 + 32 * M.easeOut(v)) * r[2];
      p.span(oval(50, 87, rx, rx * 0.3), M.easeIn(M.seg(v, 0.3, 1)), 1, { w: 0.55 });
    });
    p.move(0, y);
    p.pivot(50, 87, 0, [1 + 0.2 * sq, 1 - 0.24 * sq], function () {
      p.path('M50 87 C44 77 24 58 24 40 C24 25 35 14 50 14 C65 14 76 25 76 40 C76 58 56 77 50 87 Z', { fill: 'b' });
      p.circle(50, 40, 11, { fill: 'cream', w: 0.9 });
      p.path('M31 36 C32 29 36 24 42 21', { ink: 'white', w: 0.6, detail: true });
    });
  }
});

/* a magnifier sweeps side to side over some small print, a glint crossing the glass.
   Tap: it finds the thing, a gold sparkle opens in the lens and rays jump from the rim. */
D.add('search', {
  fam: 'signals', tags: ['find', 'look', 'magnifier', 'query', 'zoom', 'lookup', '🔍'], loop: 2.6, still: 0.1, burst: false, tapLen: 1.5, margin: [18, 24, 24, 24],
  about: 'sweeps side to side over small print, a glint crossing the glass', tapAbout: 'finds it: a gold sparkle opens in the lens and rays jump from the rim',
  draw: function (p, t, s) {
    var u = s.tap, w = tapw(s, 0.15, 0.8), found = u >= 0 ? M.spring(M.seg(u, 0.05, 0.5)) * (1 - M.easeIn(M.seg(u, 0.8, 1))) : 0;
    var dx = 8 * M.wave(t, 1) * (1 - w), dy = 3 * M.wave(t, 2, 0.2) * (1 - w), rot = 0.1 * M.wave(t, 1, -0.1) * (1 - w);
    p.push(); p.move(dx, dy);
    p.pivot(80, 80, rot, 1, function () {
      p.pivot(42, 42, 0, 1 + 0.13 * found, function () {
        p.clip(function () { p.circle(42, 42, 22.5); }, function () {
          p.circle(42, 42, 30, { fill: 'sky', line: false, alpha: 0.35 });
          var o = -2.2 * dx;
          [[31, [9, 4]], [41, [6, 5]], [51, [11, 3]]].forEach(function (r, i) { p.line(8 + o + i * 5, r[0], 90 + o, r[0], { w: 0.75, dash: r[1], cap: 'round', detail: true }); });
          shine(p, M.seg(t, 0.55, 0.85), 20, 64, 20, 64);
        });
        p.path('M27 38 A16 16 0 0 1 38 27', { ink: 'white', w: 0.8, cap: 'round' });
        if (found > 0.02) p.star(42, 42, 13 * found, 4.5 * found, 4, { fill: 'gold', w: 0.8 });
        p.circle(42, 42, 23, { w: 1.15 });
      });
      p.at(60, 60, PI / 4, 1, function () {
        p.rect(0, -5, 32, 10, { fill: 'brown', r: 4.5 });
        p.rect(-2, -6.5, 7, 13, { fill: 'grey', r: 2.5, w: 0.8 });
      });
      if (found > 0) [-0.9, -0.45, 0].forEach(function (a, i) {
        var v = M.seg(u, 0.12 + i * 0.05, 0.55);
        p.span('M' + (42 + 30 * cos(a - 0.5)) + ' ' + (42 + 30 * sin(a - 0.5)) + ' L' + (42 + 40 * cos(a - 0.5)) + ' ' + (42 + 40 * sin(a - 0.5)), M.easeIn(M.seg(v, 0.5, 1)), M.easeOut(M.seg(v, 0, 0.5)), { w: 0.7, ink: 'a' });
      });
    });
    p.pop();
  }
});

/* a paper plane flies a figure of eight, a dotted trail behind it.
   Tap: it speeds off to the upper right, shrinking, and the next one swoops in to take its place. */
function plane(p, x, y, a, k) {
  p.at(x, y, a, k, function () {
    p.poly([[36, 0], [-14, -27], [-3, 0]], { fill: 'white' });
    p.poly([[36, 0], [-3, 0], [-14, 27]], { fill: 'sky' });
    p.poly([[-3, 0], [-14, 27], [-12, 8]], { fill: 'cream', w: 0.6 });
    p.line(36, 0, -3, 0, { w: 0.45, detail: true });
  });
}
D.add('send', {
  fam: 'signals', tags: ['sent', 'message', 'submit', 'mail', 'paper plane', 'post', '✈'], loop: 3, still: 0.1, burst: false, tapLen: 1.5, margin: [28, 28, 22, 28],
  about: 'a paper plane flies a figure of eight, a dotted trail behind it', tapAbout: 'it speeds off to the upper right, shrinking, and the next plane swoops in',
  draw: function (p, t, s) {
    var K = p.small ? 0.8 : 1, P = function (th) { return [50 + 34 * K * sin(th), 50 + 19 * K * sin(2 * th), Math.atan2(38 * cos(2 * th), 34 * cos(th))]; };
    p.at(50, 50, -0.28, 1, function () {
      p.move(-50, -50);
      var th = TAU * (t + 0.04 * sin(TAU * t)) + 0.4, q = P(th), n = p.small ? 3 : 6;
      for (var i = n; i >= 1; i--) { var b = P(th - 0.26 * i); p.dot(b[0], b[1], 3.4 - i * 0.42, 'ink'); }
      if (s.tap < 0) { plane(p, q[0], q[1], q[2], 0.8 / K); return; }
      var u = s.tap, go = M.easeIn(M.seg(u, 0, 0.5)), come = M.easeOut(M.seg(u, 0.35, 0.95));
      if (go < 1) {
        var x = M.lerp(q[0], 130, go), y = M.lerp(q[1], -40, go);
        p.line(q[0], q[1], x, y, { w: 0.5, dash: [4, 5], cap: 'round' });
        plane(p, x, y, M.lerp(q[2], Math.atan2(-40 - q[1], 130 - q[0]), M.easeOut(M.seg(u, 0, 0.2))), 0.75 / K * (1 - 0.8 * go));
      }
      if (come > 0) {
        var sx = M.lerp(-30, q[0], come), sy = M.lerp(110, q[1], come) - 24 * M.bump(come);
        plane(p, sx, sy, M.lerp(-0.7, q[2], come), 0.75 / K * (0.25 + 0.75 * come));
      }
    });
  }
});

/* an arrow drops into a tray, the tray taking the weight with a bump; the arrow lifts out and comes again.
   Tap: three quick pecks, the tray bumping each time. */
function arrowDown(p, ay, sq) {
  p.pivot(50, ay + 74, 0, [1 + 0.1 * sq, 1 - 0.12 * sq], function () {
    p.poly([[43.5, ay + 30], [56.5, ay + 30], [56.5, ay + 56], [68, ay + 56], [50, ay + 75], [32, ay + 56], [43.5, ay + 56]], { fill: 'a' });
  });
}
function tray(p, dip, sq) {
  p.pivot(50, 84, 0, [1 + 0.04 * sq, 1 - 0.06 * sq], function () {
    p.move(0, dip);
    p.poly([[15, 58], [85, 58], [78, 84], [22, 84]], { fill: 'sand', line: false });
    p.path('M15 58 L22 84 L78 84 L85 58', { w: 1.15 });
    p.line(26, 77, 74, 77, { w: 0.4, detail: true });
  });
}
D.add('download', {
  fam: 'signals', tags: ['save', 'get', 'arrow', 'receive', 'fetch', 'import', '⬇'], loop: 2, still: 0.5, burst: false, tapLen: 1.2, margin: [20, 18, 14, 18],
  about: 'an arrow drops into a tray, the tray taking the weight with a bump; the arrow lifts out and comes again', tapAbout: 'three quick pecks, the tray bumping each time',
  draw: function (p, t, s) {
    var ay = t < 0.5 ? -22 * (1 - M.easeIn(M.seg(t, 0.1, 0.36))) : -22 * M.ease(M.seg(t, 0.66, 0.92));
    var hit = M.bump(M.seg(t, 0.36, 0.5)), dip = 4 * hit, sq = hit;
    if (s.tap >= 0) {
      var w = tapw(s, 0.08, 0.9), pk = 0;
      [0, 1, 2].forEach(function (i) { pk = Math.max(pk, M.bump(M.seg(s.tap, 0.05 + i * 0.28, 0.3 + i * 0.28))); });
      ay = ay * (1 - w) + (-14 * (1 - pk)) * w;
      hit = hit * (1 - w) + pk * w; dip = dip * (1 - w) + 5 * pk * w; sq = hit;
    }
    tray(p, dip, sq);
    arrowDown(p, ay + dip, sq);
  }
});

/* an arrow rests in its tray, crouches, and launches up, the tray recoiling and speed lines trailing it.
   Tap: it shoots out of sight and the next arrow rises into its place. */
D.add('upload', {
  fam: 'signals', tags: ['send', 'push', 'arrow', 'publish', 'export', 'share', '⬆'], loop: 2.2, still: 0.1, burst: false, tapLen: 1.3, margin: [40, 18, 14, 18],
  about: 'an arrow crouches in its tray and launches up, the tray recoiling, speed lines trailing', tapAbout: 'it shoots out of sight and the next arrow rises into its place',
  draw: function (p, t, s) {
    var ay = track(t, [[0, 0], [0.12, 0], [0.24, 5], [0.4, -26], [0.7, -22], [0.9, 0], [1, 0]]), dip = 5 * M.bump(M.seg(t, 0.22, 0.46)), u = s.tap, out = 0, inn = 0, fast = M.bump(M.seg(t, 0.24, 0.5));
    if (u >= 0) {
      out = M.easeIn(M.seg(u, 0.1, 0.5)); inn = M.easeOut(M.seg(u, 0.4, 0.95));
      dip = Math.max(dip, 6 * M.bump(M.seg(u, 0.1, 0.4))); fast = Math.max(fast, M.bump(M.seg(u, 0.1, 0.5)));
    }
    tray(p, dip, 0);
    var arrow = function (y, k) {
      p.pivot(50, 50, 0, k, function () { p.poly([[43.5, y + 70], [56.5, y + 70], [56.5, y + 44], [68, y + 44], [50, y + 25], [32, y + 44], [43.5, y + 44]], { fill: 'a' }); });
      if (fast > 0.1 && y < -12) [38, 50, 62].forEach(function (x, i) { p.line(x, y + 76 + i % 2 * 5, x, Math.min(56, y + 76 + i % 2 * 5 + 16 * fast), { w: 0.6 }); });
    };
    if (u < 0) arrow(ay + dip * 0.5, 1);
    else {
      var y0 = ay + dip * 0.5;
      if (out < 1) arrow(y0 - 120 * out, 1 - 0.5 * out);
      if (inn > 0) arrow(M.lerp(40, 0, inn), 0.6 + 0.4 * inn);
    }
  }
});

/* two curved arrows chase each other round a ring, the second a few hundredths of a turn behind.
   Tap: both spin a full extra turn and settle with a pulse. */
function arrowArc(p, cx, cy, r, a0, a1, col) {
  p.arc(cx, cy, r, a0, a1, { w: 1.5, cap: 'round' });
  var px = cx + r * cos(a1), py = cy + r * sin(a1), tx = -sin(a1), ty = cos(a1), nx = cos(a1), ny = sin(a1);
  p.poly([[px + tx * 12, py + ty * 12], [px + nx * 10 - tx, py + ny * 10 - ty], [px - nx * 10 - tx, py - ny * 10 - ty]], { fill: col });
}
D.add('refresh', {
  fam: 'signals', tags: ['reload', 'sync', 'update', 'again', 'retry', 'arrows', '🔄'], loop: 1.8, still: 0.1, burst: false, tapLen: 1.2,
  about: 'two curved arrows chase each other round a ring, the second a little behind', tapAbout: 'both spin a full extra turn and settle with a pulse',
  draw: function (p, t, s) {
    var rot = function (x) { return TAU * (x + 0.12 * sin(TAU * x)); };
    var extra = s.tap >= 0 ? TAU * M.easeOut(M.seg(s.tap, 0, 0.8)) : 0, pulse = 1 + 0.07 * M.bump(M.seg(s.tap, 0.5, 1));
    var a = -PI / 2 + rot(t) + extra, b = a + PI + 0.35 + rot(t - 0.05) - rot(t);
    p.pivot(50, 50, 0, pulse, function () {
      arrowArc(p, 50, 50, 29, a, a + 2.3, 'c');
      arrowArc(p, 50, 50, 29, b, b + 2.3, 'a');
    });
  }
});

/* a chain of three links, the middle one seen edge-on, rattles loose in short bursts.
   Tap: the links are pulled apart and snap back together tight, the joints flicking. */
function stadium(p, x, y, hl, hw) {
  p.rect(x - hl, y - hw, hl * 2, hw * 2, { r: hw });
  p.rect(x - hl + 5.5, y - hw + 5.5, hl * 2 - 11, hw * 2 - 11, { r: hw - 5.5, w: 0.5, detail: true });
}
D.add('link', {
  fam: 'signals', tags: ['chain', 'url', 'connect', 'attach', 'hyperlink', 'join', '🔗'], loop: 1.8, still: 0.5, burst: false, tapLen: 1.2,
  about: 'a three-link chain rattles loose in short bursts', tapAbout: 'pulled apart, then snapped together tight, the joints flicking',
  draw: function (p, t, s) {
    var env = M.bump(M.seg(t, 0.04, 0.5)), sh = env * sin(TAU * 5 * t), apart = 0, u = s.tap;
    if (u >= 0) apart = u < 0.3 ? 11 * M.easeOut(u / 0.3) : 11 * (1 - M.easeIn(M.seg(u, 0.3, 0.44))) - 3.5 * M.bump(M.seg(u, 0.44, 0.64));
    p.at(50, 50, -0.6 + 0.02 * M.wave(t, 1), 1, function () {
      var ga = -30 - apart, gc = 30 + apart, gb = 3.5 * env * sin(TAU * 5 * t + 0.8);
      p.pivot(gb, 0, 0.05 * sh, 1, function () {
        p.rect(gb - 16, -6, 32, 12, { fill: 'a', r: 6 });
        p.line(gb - 12, 0, gb + 12, 0, { w: 0.4, detail: true });
      });
      p.pivot(ga, 0, 0.07 * sh, 1, function () { stadium(p, ga, 0, 18, 13); });
      p.pivot(gc, 0, -0.07 * sh, 1, function () { stadium(p, gc, 0, 18, 13); });
      var f = M.seg(u, 0.44, 0.72);
      if (f > 0 && f < 1) [-14, 14].forEach(function (jx) {
        [-1, 1].forEach(function (d) { p.span('M' + jx + ' ' + (d * 17) + ' L' + (jx + d * 4) + ' ' + (d * 26), M.easeIn(M.seg(f, 0.4, 1)), M.easeOut(M.seg(f, 0, 0.5)), { w: 0.7 }); });
      });
    });
  }
});

/* a padlock; taps toggle it. The shackle springs up and swings open, or drops and clicks shut.
   Idle: locked, it sways on its hook and glints; open, the shackle swings free. */
D.add('lock', {
  fam: 'signals', tags: ['secure', 'private', 'unlock', 'password', 'padlock', 'toggle', '🔒'], loop: 2.4, still: 0.2, burst: 'spark', burstAt: [50, 36], burstN: 4, burstSpread: 3.2, tapLen: 1, tapRest: 1,
  about: 'a padlock, sways and glints; open, the shackle swings free', tapAbout: 'toggles: the shackle springs open or drops and clicks shut',
  draw: function (p, t, s) {
    var cur = s.taps % 2, open = cur, hit = 0;
    if (s.tap >= 0) { open = M.lerp(1 - cur, cur, M.spring(M.seg(s.tap, 0.05, 0.55))); hit = M.bump(M.seg(s.tap, 0.28, 0.5)); }
    var sway = 0.045 * M.wave(t, 1) * (1 - open) + 0.1 * M.wave(t, 1, 0.1) * open;
    p.pivot(50, 14, sway * (1 - open), 1, function () {
      p.pivot(67, 48, -0.5 * open + sway * open, 1, function () {
        p.move(0, -5 * open);
        p.path('M33 50 L33 34 C33 14 67 14 67 34 L67 50', { w: 1.7 });
      });
      p.pivot(50, 86, 0, [1 + 0.06 * hit, 1 - 0.08 * hit], function () {
        p.rect(22, 46, 56, 41, { fill: open > 0.5 ? 'leaf' : 'a', r: 9 });
        p.dot(50, 63, 5.5, 'ink'); p.line(50, 65, 50, 75, { w: 1.5, cap: 'round' });
        p.clip(function () { p.rect(22, 46, 56, 41, { r: 9 }); }, function () { shine(p, M.seg(t, 0.5, 0.8), 22, 78, 46, 87); });
      });
    });
  }
});

/* a big cog turns with a small one meshing, tooth in tooth, the small one twice as fast the other way.
   Tap: both whirr through two extra turns and throw a spark where they meet. */
function cog(p, cx, cy, n, rr, ro, rot) {
  var pt = TAU / n, pts = [];
  for (var k = 0; k < n; k++) {
    var c = rot + k * pt;
    [[rr, -0.3], [ro, -0.17], [ro, 0.17], [rr, 0.3]].forEach(function (q) { pts.push([cx + q[0] * cos(c + q[1] * pt), cy + q[0] * sin(c + q[1] * pt)]); });
  }
  return pts;
}
D.add('gear', {
  fam: 'signals', tags: ['settings', 'cog', 'options', 'preferences', 'work', 'machine', '⚙'], loop: 6, still: 0.1, burst: 'spark', burstAt: [59, 42], burstN: 5, burstSpread: 3.2, tapLen: 1.3,
  about: 'a big cog turns with a small one meshing, tooth in tooth', tapAbout: 'both whirr through extra turns and spark where they meet',
  draw: function (p, t, s) {
    var phi = -0.7, th = TAU * 2 * (t + 0.012 * sin(TAU * 6 * t)) + (s.tap >= 0 ? TAU * 2 * M.easeOut(M.seg(s.tap, 0, 0.85)) : 0);
    var th2 = phi + PI - PI / 5 - (th - phi) * 2, c1 = [38, 60], c2 = [38 + 41.25 * cos(phi), 60 + 41.25 * sin(phi)];
    p.poly(cog(p, c1[0], c1[1], 10, 24, 31, th + phi), { fill: 'a' });
    p.circle(c1[0], c1[1], 8, { fill: 'bg' });
    for (var i = 0; i < 3; i++) p.circle(c1[0] + 16 * cos(th + i * TAU / 3), c1[1] + 16 * sin(th + i * TAU / 3), 3.4, { fill: 'bg', w: 0.5, detail: true });
    p.poly(cog(p, c2[0], c2[1], 5, 10.25, 17.25, th2), { fill: 'c' });
    p.circle(c2[0], c2[1], 4.2, { fill: 'bg' });
  }
});

/* three signal arcs light one after another and are taken back in turn, the dot always there.
   Tap: a ping runs up the arcs, each one swelling gold as it passes. */
D.add('wifi', {
  fam: 'signals', tags: ['wireless', 'signal', 'network', 'online', 'connection', 'internet', '📶'], loop: 2.6, still: 0.6, burst: false, tapLen: 1.2,
  about: 'three arcs light in turn and are taken back in turn, the dot staying', tapAbout: 'a ping runs up the arcs, each swelling gold as it passes',
  draw: function (p, t, s) {
    var cx = 50, cy = 78, u = s.tap;
    [0, 1, 2].forEach(function (k) {
      var d = arcD(cx, cy, 17 + 16 * k, -PI / 2 - 0.8, -PI / 2 + 0.8), on = M.easeOut(M.seg(t, 0.1 + 0.11 * k, 0.24 + 0.11 * k)), off = M.easeIn(M.seg(t, 0.78 + 0.05 * (2 - k), 0.92 + 0.05 * (2 - k)));
      p.path(d, { w: 0.9, alpha: 0.16, cap: 'round' });
      var w = tapw(s, 0.15, 0.85), pop = u >= 0 ? M.bump(M.seg(u, 0.1 + 0.16 * k, 0.45 + 0.16 * k)) : 0;
      p.span(d, off * (1 - w), Math.max(on, w), { w: 1.5, cap: 'round' });
      if (pop > 0.05) p.pivot(cx, cy, 0, 1 + 0.1 * pop, function () { p.path(d, { w: 1.7, ink: 'a', cap: 'round' }); });
    });
    p.dot(cx, cy - 6 * M.bump(M.seg(u, 0, 0.3)), 6, 'ink');
  }
});

/* a battery charges, the fill growing from the left with a shine crossing it, full, then drained to start again.
   Tap: a lightning bolt strikes, the cell jolts and fills at once. */
D.add('battery', {
  fam: 'signals', tags: ['charge', 'power', 'energy', 'charging', 'low', 'phone', '🔋'], loop: 3, still: 0.55, burst: 'spark', burstAt: [48, 50], burstN: 5, burstSpread: 3.4, tapLen: 1.3,
  about: 'charges: the fill grows from the left with a shine crossing it, then drains and begins again', tapAbout: 'a lightning bolt strikes, the cell jolts and fills at once',
  draw: function (p, t, s) {
    var L = track(t, [[0, 0.08], [0.72, 1], [0.86, 1], [0.97, 0.08], [1, 0.08]]), u = s.tap, w = tapw(s, 0.12, 0.85), bolt = 0, tilt = 0;
    if (u >= 0) { L = L * (1 - w) + w; bolt = M.spring(M.seg(u, 0.05, 0.3)) * (1 - M.easeIn(M.seg(u, 0.7, 0.95))); tilt = 0.04 * ring(u, 4); }
    p.pivot(50, 50, tilt, 1, function () {
      var fw = 58 * L, xe = 16 + fw;
      if (fw > 3) p.clip(function () { p.rect(14, 34, 62, 34, { r: 6 }); }, function () {
        p.rect(0, 30, xe, 42, { fill: L > 0.3 || u >= 0 ? 'leaf' : 'orange', line: false });
        p.line(xe, 36, xe, 66, { w: 0.6, detail: true });
        p.clip(function () { p.rect(0, 30, xe, 42); }, function () { shine(p, M.seg(t, 0.1, 0.75), 14, xe, 34, 68); });
      });
      p.rect(10, 30, 70, 42, { r: 9 });
      p.rect(80, 43, 8, 16, { fill: 'grey', r: 3, w: 0.9 });
      p.line(35, 36, 35, 66, { w: 0.35, detail: true, alpha: 0.5 }); p.line(55, 36, 55, 66, { w: 0.35, detail: true, alpha: 0.5 });
    });
    if (bolt > 0.02) p.pivot(48, 50, 0, bolt * 1.05, function () { p.poly([[58, 6], [30, 54], [47, 54], [38, 94], [70, 42], [52, 42], [64, 6]], { fill: 'yellow', w: 1.1 }); });
  }
});

/* a clock whose minute hand ticks round in six steps, each with a little overshoot.
   Tap: it is an alarm clock: two bells pop on top, it shakes and the hammer chatters. */
D.add('clock', {
  fam: 'signals', tags: ['time', 'hour', 'wait', 'schedule', 'alarm', 'timer', '🕐'], loop: 3, still: 0.1, burst: false, tapLen: 1.5, margin: [26, 22, 14, 22],
  about: 'the minute hand ticks round in six steps, each with a little overshoot', tapAbout: 'turns alarm clock: bells pop up, it shakes, the hammer chatters, ring arcs flicker',
  draw: function (p, t, s) {
    var u = s.tap, en = u >= 0 ? Math.min(1, M.seg(u, 0, 0.12)) * (1 - M.easeIn(M.seg(u, 0.8, 1))) : 0;
    var shake = 0.07 * en * sin(TAU * 11 * u), tk = 6 * t, hand = -PI / 2 + TAU * (Math.floor(tk) + M.spring(M.frac(tk))) / 6;
    p.pivot(50, 54, shake, 1, function () {
      if (en > 0) {
        var pop = M.spring(M.seg(u, 0, 0.3)), ham = 4 * sin(TAU * 12 * u) * en;
        [[-1, 30], [1, 70]].forEach(function (b) {
          p.at(b[1], 22, b[0] * 0.5, pop, function () { p.path('M-13 6 A13 13 0 0 1 13 6 Z', { fill: 'a' }); });
          p.line(b[1] - b[0] * 8, 40, b[1] - b[0] * 14, 48, { w: 0.9 });
        });
        p.line(50, 20, 50 + ham, 10, { w: 0.7 }); p.circle(50 + ham, 9, 3, { fill: 'brown', w: 0.7 });
        [[-1, 30], [1, 70]].forEach(function (b) { p.line(b[1] + b[0] * 4, 86, b[1] + b[0] * 8, 95, { w: 1.2, cap: 'round' }); });
      }
      p.circle(50, 56, 34, { fill: 'cream' });
      p.circle(50, 56, 29, { w: 0.4, detail: true });
      for (var i = 0; i < 12; i++) { var a = i * PI / 6; p.line(50 + 24 * cos(a), 56 + 24 * sin(a), 50 + (i % 3 ? 27 : 25) * cos(a), 56 + (i % 3 ? 27 : 25) * sin(a), { w: i % 3 ? 0.5 : 0.8, detail: true }); }
      p.line(50, 56, 50 + 14 * cos(2.2), 56 + 14 * sin(2.2), { w: 1.4, cap: 'round' });
      p.line(50, 56, 50 + 25 * cos(hand), 56 + 25 * sin(hand), { w: 1, cap: 'round' });
      p.dot(50, 56, 3, 'ink'); p.dot(50, 56, 1.2, 'red');
    });
    if (en > 0.1) [-1, 1].forEach(function (d) { for (var j = 0; j < 2; j++) if (sin(TAU * 7 * u + j * 2) > -0.2) p.path(arcD(50, 56, 42 + 7 * j, d > 0 ? -0.5 : PI - 0.5, d > 0 ? 0.5 : PI + 0.5), { w: 0.6 }); });
  }
});

/* a calendar page comes away from its pad and flutters down; the next sheet is already there.
   Tap: a copy of the page is torn off at once and spins away to the right. */
function sheet(p, y) {
  p.push(); p.move(0, y);
  p.rect(18, 20, 64, 68, { fill: 'white', r: 7 });
  p.path('M18 38 L18 27 C18 23 21 20 25 20 L75 20 C79 20 82 23 82 27 L82 38 Z', { fill: 'b', w: 0.9 });
  p.line(34, 13, 34, 27, { w: 1.7, cap: 'round' }); p.line(66, 13, 66, 27, { w: 1.7, cap: 'round' });
  p.path('M39 51 L61 51 L49 79', { w: 1.7 });
  p.pop();
}
D.add('calendar', {
  fam: 'signals', tags: ['date', 'day', 'schedule', 'event', 'plan', 'month', 'page', '📅'], loop: 3.4, still: 0.2, burst: false, tapLen: 1.3, margin: [18, 24, 30, 24],
  about: 'a page tears from the pad and flutters away; the next sheet is already there', tapAbout: 'a copy of the page is torn off at once and spins away to the right',
  draw: function (p, t, s) {
    var v = M.seg(t, 0.46, 0.86), yU = t < 0.88 ? 3 * (1 - M.ease(M.seg(t, 0.6, 0.86))) : 3 * M.ease(M.seg(t, 0.88, 1));
    p.rect(20, 23, 60, 68, { fill: 'cream', r: 7, w: 0.8 });
    sheet(p, yU);
    if (t > 0.46 && t < 0.86) {
      var fl = M.seg(v, 0.15, 0.5), k = Math.max(0.02, 1 - M.easeIn(M.seg(v, 0.35, 1)));
      p.push(); p.move(14 * sin(TAU * 1.1 * v) * fl + 8 * v, 64 * M.easeIn(M.seg(v, 0.1, 1)));
      p.pivot(50, 50, 0.3 * M.ease(M.seg(v, 0, 0.2)) + 0.55 * sin(TAU * 1.2 * v) * fl, [k * (1 - 0.4 * (1 - Math.abs(cos(TAU * 1.6 * v))) * fl), k], function () { sheet(p, 0); });
      p.pop();
    } else p.pivot(50, 14, 0.03 * sin(TAU * 2 * t) * (t > 0.86 ? M.ease(M.seg(t, 0.88, 0.98)) : 1 - M.ease(M.seg(t, 0.3, 0.46))), 1, function () { sheet(p, 0); });
    if (s.tap >= 0) {
      var q = M.seg(s.tap, 0.02, 0.8), e = M.easeIn(q);
      p.push(); p.move(60 * e, -22 * M.bump(q));
      p.pivot(50, 54, 2.4 * q, [Math.max(0.02, (1 - M.easeIn(M.seg(q, 0.3, 1)))) * (1 - 0.35 * M.bump(M.seg(q, 0.2, 0.8))), Math.max(0.02, 1 - M.easeIn(M.seg(q, 0.3, 1)))], function () { sheet(p, 0); });
      p.pop();
    }
  }
});

/* an hourglass: sand runs through the neck and heaps below, and at the end of the run the glass turns over.
   Tap: it somersaults, a handful of grains flying. */
function wall(y) { y = y > 50 ? 100 - y : y; return 2.5 + 19.5 * (1 - M.ease(M.seg(y, 26, 50))); }
function bulb(yFlat, yApex, slope, dip) {
  var L = [], R = [], i, y, w;
  for (i = 0; i <= 9; i++) { y = M.lerp(yFlat, yApex, i / 9); w = Math.min(wall(y) - 1.5, slope * Math.abs(y - yApex) + 1); L.push([50 - w, y]); R.push([50 + w, y]); }
  return L.concat(R.reverse(), [[50, yFlat + dip]]);
}
function flip(q) { return [100 - q[0], 100 - q[1]]; }
D.add('hourglass', {
  fam: 'signals', tags: ['time', 'wait', 'timer', 'sand', 'loading', 'patience', '⌛'], loop: 3.4, still: 0.3, burst: 'ember', burstAt: [50, 50], burstN: 7, burstSpread: 6, tapLen: 1.2,
  about: 'sand runs through the neck and heaps below; at the end the glass turns over', tapAbout: 'it somersaults, a handful of grains flying',
  draw: function (p, t, s) {
    var th = PI * M.spring(M.seg(t, 0.88, 1)), up = th < PI / 2, L = 1 - M.seg(t, 0.04, 0.84), F = 1 - L;
    var ph = (up ? th : th - PI) + (s.tap >= 0 ? TAU * M.spring(M.seg(s.tap, 0.04, 0.7)) : 0), hop = s.tap >= 0 ? -9 * M.bump(M.seg(s.tap, 0.04, 0.6)) : 0;
    p.push(); p.move(0, hop);
    p.pivot(50, 50, ph, 1, function () {
      var g = [], y;
      for (y = 18; y <= 82; y += 4) g.push([50 - wall(y), y]);
      for (y = 82; y >= 18; y -= 4) g.push([50 + wall(y), y]);
      p.curve(g, { close: true, fill: 'sky', line: false, alpha: 0.28 });
      if (up) {
        if (L > 0.02) p.poly(bulb(49.5 - 30 * L, 49.5, 99, 14 * L * (1 - L)), { fill: 'gold', line: false });
        if (F > 0.02) p.poly(bulb(19.5, 19.5 + 30 * F, 1.2, 0).map(flip), { fill: 'gold', line: false });
      } else p.poly(bulb(19.5, 19.5 + 30 * F, 1.2, 0), { fill: 'gold', line: false });
      if (up && L > 0.02 && L < 0.98) for (var k = 0; k < 3; k++) p.dot(50, 50 + M.frac(6 * t + k / 3) * (F > 0.02 ? 30.5 - 30 * F : 30.5), 1.4, 'gold');
      p.clip(g, function () { shine(p, M.seg(t, 0.1, 0.45), 28, 72, 18, 82); });
      p.curve(g, { close: true, w: 1.1 });
      p.rect(20, 9, 60, 9, { fill: 'wood', r: 3.5 });
      p.rect(20, 82, 60, 9, { fill: 'wood', r: 3.5 });
    });
    p.pop();
  }
});

/* an eye looks left, right and up, and blinks with lids that close over the eyeball: the upper lid drops fast and lifts slow.
   Tap: it widens, the pupil pinches, the brow shoots up, then it blinks twice. */
function blink(t, a, b) { return M.easeIn(M.seg(t, a, a + (b - a) * 0.4)) - M.ease(M.seg(t, a + (b - a) * 0.4, b)); }
D.add('eye', {
  fam: 'signals', tags: ['look', 'see', 'watch', 'view', 'visible', 'preview', 'show', '👁'], loop: 4, still: 0.1, burst: false, tapLen: 1.4, margin: [24, 18, 18, 18],
  about: 'looks left, right and up, blinking with lids that close over the eyeball', tapAbout: 'widens, the pupil pinches, the brow shoots up, then two quick blinks',
  draw: function (p, t, s) {
    var gx = track(t, [[0, 0], [0.1, 0], [0.2, -15], [0.36, -15], [0.46, 14], [0.62, 14], [0.72, 0], [1, 0]]), gy = track(t, [[0, 0], [0.74, 0], [0.8, -6], [0.92, -6], [1, 0]]);
    var c = Math.max(blink(t, 0.52, 0.64), blink(t, 0.9, 0.99)), o = 1 - c, wide = 0, u = s.tap, w = tapw(s, 0.1, 0.9);
    if (u >= 0) {
      wide = M.bump(M.seg(u, 0, 0.5)); gx *= 1 - w; gy *= 1 - w;
      o = o * (1 - w) + (1 + 0.28 * wide - Math.max(blink(u, 0.55, 0.68), blink(u, 0.72, 0.85))) * w;
    }
    var cy = 52 + 5 * (1 - Math.min(1, o)), hu = 23 * o, hl = 15 * o;
    var fu = function (x) { return cy - hu * (1 - (x - 50) * (x - 50) / 1600); }, fl = function (x) { return cy + hl * (1 - (x - 50) * (x - 50) / 1600); };
    var ix = 50 + gx, iy = cy + gy;
    p.path('M18 ' + (27 - 8 * wide + gy * 0.5) + ' Q50 ' + (11 - 8 * wide + gy * 0.5) + ' 82 ' + (27 - 8 * wide + gy * 0.5), { w: 1.1, detail: true });
    var up = [], lo = [], x;
    for (x = 10; x <= 90; x += 4) { up.push([x, fu(x)]); lo.push([x, fl(x)]); }
    if (o > 0.05) p.poly(up.concat(lo.slice().reverse()), { fill: 'white', line: false });
    if (o > 0.2) p.clip(function () { p.poly(up.concat(lo.slice().reverse())); }, function () {
      p.circle(ix, iy, 15 - 2.5 * wide, { fill: 'sea', w: 0.8 });
      p.circle(ix, iy, 7 - 3 * wide, { fill: 'ink', line: false });
      p.circle(ix - 5, iy - 5, 2.6, { fill: 'white', line: false });
    });
    p.curve(up, { w: 1.4 });
    if (o > 0.1) p.curve(lo, { w: 0.9 });
    [[28, -3], [40, -1], [60, 1], [72, 3]].forEach(function (l) { p.line(l[0], fu(l[0]) - 0.5, l[0] + l[1], fu(l[0]) - 7, { w: 0.5, detail: true }); });
  }
});

/* a starburst badge reading NEW turns slowly on its centre while the word rocks upright.
   Tap: the burst spins up through a full extra turn and the word pops. */
D.add('new', {
  fam: 'signals', tags: ['fresh', 'badge', 'latest', 'release', 'announce', 'label', 'sticker'], loop: 6, still: 0.1, burst: 'star', burstAt: [50, 50], burstN: 6, burstSpread: 6, tapLen: 1.3,
  about: 'a starburst badge reading NEW turns slowly while the word rocks upright', tapAbout: 'the burst spins up through a full extra turn and the word pops',
  draw: function (p, t, s) {
    var u = s.tap, pop = u >= 0 ? M.spring(M.seg(u, 0, 0.5)) * 0.18 : 0, extra = u >= 0 ? TAU * M.easeOut(M.seg(u, 0, 0.85)) : 0;
    p.pivot(50, 50, 0, 1 + 0.03 * M.wave(t, 3) + pop * 0.5, function () {
      p.star(50, 50, 46, 36, 12, { fill: 'yellow', rot: -PI / 2 + TAU * t + extra, w: 1.1 });
      p.circle(50, 50, 29, { w: 0.5, detail: true });
    });
    p.at(50, 50, 0.07 * M.wave(t, 2), 1 + pop, function () {
      if (p.small) { p.dot(0, 0, 8, 'ink'); return; }
      p.move(-1.5, 0.5);
      p.path('M-21 8 L-21 -8 L-11 8 L-11 -8', { w: 1.35, cap: 'round' });
      p.path('M4 -8 L-5 -8 L-5 8 L4 8 M-5 0 L2 0', { w: 1.35, cap: 'round' });
      p.path('M9 -8 L12.5 8 L16.5 -2 L20.5 8 L24 -8', { w: 1.35, cap: 'round' });
    });
  }
});

/* a flame: the tip leans and the left tongue licks, the inner flame breathing, embers leaving by shrinking.
   Tap: it flares, taller and wider, and throws sparks. */
D.add('hot', {
  fam: 'signals', tags: ['fire', 'flame', 'trending', 'popular', 'burning', 'heat', 'spicy', '🔥'], loop: 1.8, still: 0.3, burst: 'ember', burstAt: [50, 24], burstN: 8, burstSpread: 2.4, tapLen: 1.2, margin: [24, 18, 12, 18],
  about: 'the tip leans and the left tongue licks, the inner flame breathing, embers shrinking away', tapAbout: 'flares taller and wider and throws sparks',
  draw: function (p, t, s) {
    var sw = M.wave(t, 1), a = M.wave(t, 2, 0.1), b = M.wave(t, 3, 0.35), fl = s.tap >= 0 ? M.spring(M.seg(s.tap, 0, 0.35)) * (1 - M.easeIn(M.seg(s.tap, 0.6, 1))) : 0;
    p.push(); p.move(50, 90); p.skew(0.07 * sw, 0); p.size(1 + 0.16 * fl, 1 + 0.3 * fl); p.move(-50, -90);
    var tx = 50 + 5 * sw + 2 * a;
    p.path('M' + tx + ' 8 C' + (54 + 4 * sw) + ' 26 ' + (76 + 2 * a) + ' 36 76 60 C76 76 64 90 50 90 C36 90 24 76 24 60 C24 50 29 42 ' + (35 + 3 * b) + ' ' + (33 + 2 * a) + ' C35 44 39 48 43 48 C41 32 ' + (44 + 3 * sw) + ' 18 ' + tx + ' 8 Z', { fill: 'orange' });
    p.pivot(50, 90, 0, [1, 1 + 0.1 * M.wave(t, 3)], function () {
      p.path('M50 46 C55 56 64 62 64 74 C64 82 58 90 50 90 C42 90 36 82 36 74 C36 64 46 58 50 46 Z', { fill: 'yellow', w: 0.7 });
      p.blob(50, 82, 6, { fill: 'cream', line: false, seed: 4 });
    });
    p.pop();
    [[0, 36, 2.2], [0.38, 62, 1.8], [0.7, 44, 2.4]].forEach(function (e) {
      var ph = M.frac(t + e[0]), r = e[2] * (1 - M.easeIn(M.seg(ph, 0.4, 1)));
      if (r > 0.3) p.dot(e[1] + 6 * sin(TAU * (ph + e[0])), 52 - 52 * ph, r, 'flame');
    });
  }
});

/* a triangle road sign on its post sways a little while the dot of the exclamation hops.
   Tap: the sign is kicked and wobbles hard on its post, rays flaring from its top. */
D.add('warning', {   /* stylecheck: allow — the glyph's name */
  fam: 'signals', tags: ['alert', 'careful', 'attention', 'hazard', 'sign', 'problem', 'heads up', '⚠'], loop: 1.6, still: 0.3, burst: false, tapLen: 1.4,
  about: 'a triangle sign sways on its post while the dot of the exclamation hops', tapAbout: 'kicked: wobbles hard on its post, rays flaring from the top',
  draw: function (p, t, s) {
    var u = s.tap, ang = 0.06 * M.wave(t, 1) + 0.45 * ring(u, 2.5), hop = 4 * M.bump(M.seg(M.frac(t * 2), 0.1, 0.5)), pop = u >= 0 ? M.bump(M.seg(u, 0, 0.4)) : 0;
    p.line(38, 94, 62, 94, { w: 0.9 });
    p.pivot(50, 94, ang, 1, function () {
      p.line(50, 64, 50, 94, { w: 1.5 });
      p.path('M44 14 Q50 8 56 14 L86 61 Q90 68 82 68 L18 68 Q10 68 14 61 Z', { fill: pop > 0.3 ? 'orange' : 'yellow' });
      p.line(50, 31 - 3 * pop, 50, 48, { w: 2.1, cap: 'round' });
      p.dot(50, 57 - hop - 5 * pop, 3.4 + pop, 'ink');
    });
    if (u >= 0) [-0.9, 0, 0.9].forEach(function (a, i) {
      var v = M.seg(u, 0.05 + i * 0.04, 0.5), ca = -PI / 2 + a;
      p.span('M' + (50 + 52 * cos(ca)) + ' ' + (44 + 52 * sin(ca)) + ' L' + (50 + 66 * cos(ca)) + ' ' + (44 + 66 * sin(ca)), M.easeIn(M.seg(v, 0.5, 1)), M.easeOut(M.seg(v, 0, 0.5)), { w: 0.8, ink: 'orange' });
    });
  }
});

/* a round "i" badge: the dot of the i hops twice a loop, landing with a squash.
   Tap: the dot leaps clear out of the badge, comes back with a big squash, and a ripple leaves the rim. */
D.add('info', {
  fam: 'signals', tags: ['information', 'about', 'help', 'details', 'note', 'tip', 'hint', 'ℹ'], loop: 1.8, still: 0.3, burst: false, tapLen: 1.3, margin: [34, 18, 18, 18],
  about: 'the dot of the i hops twice a loop, landing with a squash', tapAbout: 'the dot leaps clear out of the badge and lands with a big squash, a ripple leaving the rim',
  draw: function (p, t, s) {
    var f = M.frac(t * 2), hop = 7 * M.bump(M.seg(f, 0, 0.45)), sq = M.bump(M.seg(f, 0.45, 0.6)) * 0.35, u = s.tap, w = tapw(s, 0.08, 0.9), bsq = 0, rp = 0;
    if (u >= 0) {
      var jump = M.bump(M.seg(u, 0.04, 0.5)); hop = hop * (1 - w) + 38 * jump * w; sq = sq * (1 - w) + (M.bump(M.seg(u, 0.5, 0.64)) * 0.7) * w;
      bsq = M.bump(M.seg(u, 0.5, 0.66)); rp = M.seg(u, 0.5, 1);
    }
    p.pivot(50, 88, 0, [1 + 0.05 * bsq, 1 - 0.07 * bsq], function () {
      p.circle(50, 54, 36, { fill: 'sky' });
      p.rect(45, 48, 10, 26, { fill: 'ink', r: 3 });
      p.pivot(50, 42, 0, [1 + sq * 0.8, 1 - sq], function () { p.dot(50, 36 - hop, 5.8, 'ink'); });
    });
    if (rp > 0 && rp < 1) p.span(oval(50, 54, 36 + 18 * M.easeOut(rp), 36 + 18 * M.easeOut(rp)), M.easeIn(M.seg(rp, 0.3, 1)), 1, { w: 0.6, ink: 'sea' });
  }
});

/* a plug that has come out of its socket tries to go back and sparks across the gap, then jerks away.
   Tap: it rams home, sparks fly, and it is thrown out again. */
D.add('error', {
  fam: 'signals', tags: ['unplugged', 'offline', 'disconnected', 'failed', 'broken', 'no connection', 'oops', '⚡'], loop: 1.8, still: 0.4, burst: 'spark', burstAt: [58, 50], burstN: 6, burstSpread: 3.4, tapLen: 1.2, margin: [18, 18, 18, 24],
  about: 'a plug tries to go back into its socket, sparks across the gap, and jerks away', tapAbout: 'it rams home, sparks fly, and it is thrown out again',
  draw: function (p, t, s) {
    var dx = track(t, [[0, -4], [0.16, -4], [0.3, 6], [0.38, 7], [0.5, -8], [0.62, -4], [1, -4]]), sp = M.bump(M.seg(t, 0.26, 0.44)), u = s.tap, w = tapw(s, 0.06, 0.9);
    if (u >= 0) {
      var td = u < 0.25 ? M.lerp(-4, 13, M.easeIn(u / 0.25)) : u < 0.45 ? M.lerp(13, -17, M.easeOut(M.seg(u, 0.25, 0.45))) : -4 - 13 * (1 - M.ease(M.seg(u, 0.45, 0.95)));
      dx = dx * (1 - w) + td * w; sp = sp * (1 - w) + Math.max(M.bump(M.seg(u, 0.14, 0.34)), M.bump(M.seg(u, 0.24, 0.5))) * w;
    }
    p.rect(62, 28, 30, 44, { fill: 'sand', r: 8 });
    p.rect(63, 38, 7, 6, { fill: 'ink', r: 1.5, w: 0.4 }); p.rect(63, 56, 7, 6, { fill: 'ink', r: 1.5, w: 0.4 });
    p.path('M' + (10 + dx) + ' 50 C' + (-2 + dx * 0.5) + ' 50 ' + (4 - dx * 0.2) + ' 78 4 90', { w: 1.1 });
    p.rect(10 + dx, 32, 28, 36, { fill: 'a', r: 9 });
    p.rect(38 + dx, 38, 14, 6, { fill: 'grey', r: 1.5, w: 0.9 }); p.rect(38 + dx, 56, 14, 6, { fill: 'grey', r: 1.5, w: 0.9 });
    p.line(18 + dx, 42, 18 + dx, 58, { w: 0.5, detail: true });
    if (sp > 0.12) [41, 59].forEach(function (y, j) {
      var x0 = 52 + dx, zz = 'M' + x0 + ' ' + y + ' L' + (x0 + 3) + ' ' + (y - 4 + j * 2) + ' L' + (x0 + 6) + ' ' + (y + 3 - j * 2) + ' L62 ' + y;
      p.draw(zz, M.easeOut(sp), { w: 0.9, ink: 'orange', cap: 'round' });
    });
    if (sp > 0.3) p.star(57 + dx * 0.5, 50, 9 * sp, 3 * sp, 6, { fill: 'yellow', w: 0.6 });
  }
});

/* a checkbox is ticked: the tick is drawn in one stroke, the box pops, and later the tick is taken back.
   Tap: the tick is wiped and drawn again bolder, with a ring leaving the box. */
D.add('done', {
  fam: 'signals', tags: ['check', 'complete', 'finished', 'tick', 'task', 'todo', 'ok', 'checkbox', '✅'], loop: 2.6, still: 0.5, burst: 'spark', burstAt: [84, 20], burstN: 4, burstSpread: 3, tapLen: 1.2,
  about: 'a checkbox is ticked in one stroke, the box popping; later the tick is taken back', tapAbout: 'the tick is wiped and drawn again bolder, a ring leaving the box',
  draw: function (p, t, s) {
    var d = 'M26 52 C32 58 37 64 42 74 C50 54 64 36 86 17', a0 = M.easeIn(M.seg(t, 0.78, 0.94)), a1 = M.easeOut(M.seg(t, 0.1, 0.34)), pop = 0.09 * M.bump(M.seg(t, 0.3, 0.44)), u = s.tap, wd = 1.7, rp = 0;
    if (u >= 0) {
      var w = M.ease(M.seg(u, 0.85, 1)), s0 = u < 0.2 ? Math.max(a0, M.easeIn(M.seg(u, 0, 0.2))) : 0, s1 = u < 0.2 ? a1 : M.easeOut(M.seg(u, 0.2, 0.5));
      a0 = M.lerp(s0, a0, w); a1 = M.lerp(s1, a1, w); pop = pop * w + M.spring(M.seg(u, 0.4, 0.7)) * 0.1 * (1 - w); wd = 1.7 + 0.5 * M.bump(M.seg(u, 0.2, 0.9)); rp = M.seg(u, 0.45, 1);
    }
    p.pivot(44, 54, 0, 1 + pop, function () { p.rect(12, 22, 62, 62, { fill: 'white', r: 12 }); });
    p.span(d, a0, a1, { w: wd, ink: 'green', cap: 'round' });
    if (rp > 0 && rp < 1) p.span(oval(43, 53, 31 + 16 * M.easeOut(rp), 31 + 16 * M.easeOut(rp)), M.easeIn(M.seg(rp, 0.3, 1)), 1, { w: 0.55, ink: 'green' });
  }
});

/* a bin whose lid flaps open and shut on its hinge, twice a loop, the second time smaller.
   Tap: the lid lifts and a crumpled ball of paper arcs in and drops inside; the bin takes the weight. */
D.add('trash', {
  fam: 'signals', tags: ['delete', 'bin', 'rubbish', 'remove', 'garbage', 'discard', 'waste', '🗑'], loop: 2.6, still: 0.2, burst: false, tapLen: 1.4, margin: [26, 24, 14, 18],
  about: 'the lid flaps open and shut on its hinge, twice a loop', tapAbout: 'a crumpled ball of paper arcs in and drops inside; the bin takes the weight',
  draw: function (p, t, s) {
    var op = function (a, b, c, d) { return M.easeOut(M.seg(t, a, b)) * (1 - M.easeIn(M.seg(t, c, d))); };
    var o = Math.max(op(0.05, 0.15, 0.34, 0.42), 0.55 * op(0.52, 0.6, 0.7, 0.78)), u = s.tap, sq = 0, e = 0;
    o += 0.1 * o * sin(TAU * 8 * t);
    if (u >= 0) {
      var w = tapw(s, 0.1, 0.85); o = o * (1 - w) + w * M.easeOut(M.seg(u, 0.02, 0.15)) * (1 - M.easeIn(M.seg(u, 0.62, 0.74)));
      sq = M.bump(M.seg(u, 0.5, 0.66)); e = M.seg(u, 0.1, 0.62);
    }
    if (e > 0 && e < 1) {
      var q = M.seg(e, 0, 0.8), bx = M.lerp(98, 52, M.easeOut(q)), by = M.lerp(-8, 38, q * q) - 26 * M.bump(q) + 30 * M.easeIn(M.seg(e, 0.8, 1));
      p.at(bx, by, 6 * e, 1, function () {
        p.blob(0, 0, 9, { fill: 'white', lumpy: 0.22, seed: 5 });
        p.path('M-5 -3 L1 2 L-2 6', { w: 0.4, detail: true }); p.path('M3 -6 L5 -1', { w: 0.4, detail: true });
      });
    }
    p.pivot(50, 88, 0, [1 + 0.05 * sq, 1 - 0.07 * sq], function () {
      p.poly([[24, 40], [76, 40], [70, 88], [30, 88]], { fill: 'smoke' });
      [40, 50, 60].forEach(function (x) { p.line(x + (x - 50) * 0.1, 48, x + (x - 50) * 0.18, 80, { w: 0.45, detail: true }); });
    });
    p.pivot(24, 37, -0.62 * o, 1, function () {
      p.path('M42 29 L44 22 L56 22 L58 29', { w: 0.9 });
      p.rect(20, 29, 60, 9, { fill: 'grey', r: 3.5 });
    });
    if (e > 0.78 && e < 1) [40, 60].forEach(function (x) { p.line(x, 34, x + (x - 50) * 0.3, 26 - 6 * (e - 0.78) * 4, { w: 0.6 }); });
  }
});

/* a bookmark ribbon hangs from a book and flutters, each edge a little behind the other so it twists.
   Tap: it flaps hard and a gold star pops on the ribbon. */
D.add('bookmark', {
  fam: 'signals', tags: ['save', 'favourite', 'ribbon', 'read later', 'book', 'mark', 'saved', '🔖'], loop: 2.4, still: 0.3, burst: false, tapLen: 1.4, margin: [18, 30, 14, 30],
  about: 'a ribbon hangs from a book and flutters, one edge behind the other so it twists', tapAbout: 'it flaps hard and a gold star pops on the ribbon',
  draw: function (p, t, s) {
    var u = s.tap, k = 1 + (u >= 0 ? 1.5 * M.bump(M.seg(u, 0, 0.6)) : 0), edge = function (x0, y, lag) { return x0 + k * 10 * Math.pow((y - 12) / 76, 1.4) * sin(TAU * (t - y / 120 - lag)); };
    var L = [], R = [], C = [], y;
    for (y = 12; y <= 82; y += 7) { L.push([edge(34, y, 0), y]); R.push([edge(66, y, 0.07), y]); C.push([edge(50, y, 0.035), y]); }
    p.poly(L.concat([[edge(34, 90, 0), 90], [edge(50, 76, 0.035), 76], [edge(66, 90, 0.07), 90]], R.reverse()), { fill: 'b' });
    p.curve(C, { w: 0.4, dash: [2.5, 3], detail: true, ink: 'white' });
    p.rect(20, 4, 60, 12, { fill: 'blue', r: 3 });
    p.line(26, 10, 74, 10, { w: 0.4, ink: 'white', detail: true });
    if (u >= 0) {
      var pop = M.spring(M.seg(u, 0.1, 0.45)) * (1 - M.easeIn(M.seg(u, 0.7, 1)));
      if (pop > 0.03) p.at(50, 44, 0.5 * (1 - pop) + 0.2 * sin(TAU * 2 * u), pop, function () { p.star(0, 0, 14, 6, 5, { fill: 'gold', w: 0.9 }); });
    }
  }
});

/* a megaphone shouting: rays leave the bell one after another, the upper ones leading, and the whole thing kicks back a little.
   Tap: it shouts loud: more rays, a hard kick back, and a big exclamation mark thrown out. */
D.add('megaphone', {
  fam: 'signals', tags: ['announce', 'shout', 'broadcast', 'news', 'speak', 'campaign', 'loudspeaker', '📣'], loop: 1.6, still: 0.2, burst: false, tapLen: 1.3, margin: [18, 24, 18, 18],
  about: 'rays leave the bell one after another, the upper ones leading, the whole thing kicking back a little', tapAbout: 'a louder shout: more rays, a hard kick back, a big exclamation mark thrown out',
  draw: function (p, t, s) {
    var u = s.tap, n = u >= 0 ? 7 : 5, kick = -1.5 * M.bump(M.seg(M.frac(t * 2), 0, 0.4)) - (u >= 0 ? 6 * M.bump(M.seg(u, 0, 0.3)) : 0);
    p.push(); p.move(kick, 0.35 * kick);
    p.pivot(30, 56, -0.14, 1, function () {
      p.rect(30, 60, 11, 23, { fill: 'brown', r: 3 });
      p.rect(6, 43, 14, 18, { fill: 'wood', r: 4.5 });
      p.poly([[17, 45], [58, 24], [58, 76], [17, 59]], { fill: 'a' });
      p.path('M36 38 C34 46 34 56 36 64', { w: 0.45, detail: true });
      p.ellipse(58, 50, 7, 26, { fill: 'cream' });
    });
    p.pop();
    for (var i = 0; i < n; i++) {
      var a = (i - (n - 1) / 2) * (n > 5 ? 0.3 : 0.4) - 0.14, ph = M.frac(t * (u >= 0 ? 2 : 1) - i * 0.06), r0 = 20 + 24 * M.easeIn(M.seg(ph, 0.3, 1)), r1 = 20 + 26 * M.easeOut(M.seg(ph, 0, 0.5));
      p.span('M' + (66 + 8 * cos(a)) + ' ' + (50 + 8 * sin(a)) + ' L' + (66 + 50 * cos(a)) + ' ' + (50 + 50 * sin(a)), (r0 - 8) / 42, (r1 - 8) / 42, { w: 0.9, cap: 'round' });
    }
    if (u >= 0) {
      var q = M.spring(M.seg(u, 0.12, 0.5)) * (1 - M.easeIn(M.seg(u, 0.75, 1)));
      if (q > 0.03) p.at(84, 22, 0.35 * sin(TAU * 3 * u), q, function () { p.line(0, -14, 0, 2, { w: 1.9, cap: 'round' }); p.dot(0, 10, 3.2, 'ink'); });
    }
  }
});

/* a little house with a chimney: puffs of smoke rise, swell, and shrink away, each a step behind the one before.
   Tap: the door swings open on a warm room, the window lights, and hearts float from the chimney. */
D.add('home', {
  fam: 'signals', tags: ['house', 'main', 'start', 'index', 'dwelling', 'landing', 'return', '🏠'], loop: 2.4, still: 0.3, burst: 'heart', burstAt: [69, 18], burstN: 3, burstSpread: 1.4, tapLen: 1.5, margin: [34, 18, 14, 18],
  about: 'smoke puffs rise from the chimney, swell, and shrink away', tapAbout: 'the door swings open on a warm room, the window lights, hearts float from the chimney',
  draw: function (p, t, s) {
    var u = s.tap, open = u >= 0 ? M.spring(M.seg(u, 0.05, 0.4)) * (1 - M.easeIn(M.seg(u, 0.75, 1))) : 0, lit = u >= 0 ? M.ease(M.seg(u, 0.05, 0.25)) * (1 - M.ease(M.seg(u, 0.8, 1))) : 0;
    p.rect(64, 22, 11, 26, { fill: 'brown', r: 1.5 });
    p.rect(24, 50, 52, 38, { fill: 'cream' });
    p.poly([[12, 53], [50, 16], [88, 53]], { fill: 'b', w: 1.1 });
    p.rect(30, 58, 12, 12, { fill: lit > 0.5 ? 'yellow' : 'sky', r: 1.5, w: 0.9 });
    p.line(36, 58, 36, 70, { w: 0.4, detail: true }); p.line(30, 64, 42, 64, { w: 0.4, detail: true });
    p.path('M47 88 L47 68 C47 62 60 62 60 68 L60 88', { fill: lit > 0 ? 'yellow' : 'wood', line: false });
    p.pivot(47, 76, 0, [Math.max(0.12, 1 - 0.85 * Math.min(1, open)), 1], function () { p.path('M47 88 L47 68 C47 62 60 62 60 68 L60 88 Z', { fill: 'wood' }); p.dot(57, 78, 1.2, 'ink'); });
    [[0, 0], [0.34, 1], [0.68, 2]].forEach(function (e) {
      var ph = M.frac(t + e[0]), r = (3 + 6 * ph) * (1 - M.easeIn(M.seg(ph, 0.6, 1)));
      if (r > 0.6) p.blob(69 + 13 * ph + 3 * sin(TAU * (ph + e[0])), 16 - 40 * ph, r, { fill: 'white', lumpy: 0.2, seed: e[1] + 2, w: 0.7 });
    });
  }
});

/* a shopping cart rolls on the spot, wheels turning, the ground ticking past beneath.
   Tap: an apple drops into the basket and the cart bounces on its wheels. */
D.add('cart', {
  fam: 'signals', tags: ['shop', 'basket', 'buy', 'store', 'checkout', 'trolley', 'add to cart', '🛒'], loop: 1.6, still: 0.1, burst: false, tapLen: 1.2, margin: [26, 18, 8, 18],
  about: 'rolls on the spot, wheels turning, the ground ticking past', tapAbout: 'an apple drops into the basket and the cart bounces on its wheels',
  draw: function (p, t, s) {
    var u = s.tap, bob = 1.2 * sin(TAU * 3 * t) + (u >= 0 ? 4 * M.bump(M.seg(u, 0.45, 0.7)) : 0), sq = u >= 0 ? M.bump(M.seg(u, 0.4, 0.58)) : 0;
    for (var k = 0; k < 3; k++) { var ph = M.frac(t + k / 3), len = 14 * M.bump(ph); if (len > 1) p.line(92 - 84 * ph, 93, 92 - 84 * ph + len, 93, { w: 0.45, detail: true }); }
    if (u >= 0 && u < 0.5) p.at(58, M.lerp(-16, 36, M.easeIn(M.seg(u, 0.05, 0.5))), 0.5 * u, 1, function () {
      p.circle(0, 0, 8, { fill: 'red' }); p.path('M0 -7 C0 -11 3 -13 5 -12', { w: 0.7 }); p.path('M1 -9 C4 -13 8 -11 8 -9 C5 -8 2 -8 1 -9 Z', { fill: 'leaf', w: 0.5 });
    });
    p.pivot(50, 70, 0.015 * sin(TAU * 3 * t + 1), 1, function () {
      p.move(0, -bob);
      p.pivot(56, 58, 0, [1 + 0.04 * sq, 1 - 0.07 * sq], function () {
        p.poly([[22, 28], [90, 28], [80, 58], [32, 58]], { fill: 'cream' });
        [38, 52, 66, 80].forEach(function (x, i) { p.line(x, 30, x - 1 + i * 0.3 - 2, 56, { w: 0.4, detail: true }); });
        p.line(26, 43, 86, 43, { w: 0.4, detail: true });
      });
      p.path('M6 14 L20 14 L27 33', { w: 1.2 });
      p.path('M34 58 L38 70 L82 70 L80 58', { w: 0.9 });
      [[42, 80], [78, 80]].forEach(function (c) {
        p.circle(c[0], c[1], 7.5, { fill: 'smoke' });
        for (var j = 0; j < 3; j++) { var a = TAU * 2 * t + j * PI / 3; p.line(c[0] + 6 * cos(a), c[1] + 6 * sin(a), c[0] - 6 * cos(a), c[1] - 6 * sin(a), { w: 0.4, detail: true }); }
        p.dot(c[0], c[1], 1.6, 'ink');
      });
    });
  }
});

/* a gift box shakes in short bursts, the bow a beat behind the box.
   Tap: the lid pops off in a spin, confetti flies, and the lid drops back on with a bounce. */
D.add('gift', {
  fam: 'signals', tags: ['present', 'surprise', 'reward', 'birthday', 'bonus', 'offer', 'box', '🎁'], loop: 2.4, still: 0.5, burst: 'confetti', burstAt: [50, 44], burstN: 14, burstSpread: 2.8, tapLen: 1.5, margin: [40, 24, 10, 24],
  about: 'the box shakes in short bursts, the bow a beat behind', tapAbout: 'the lid pops off in a spin, confetti flies, and the lid drops back on with a bounce',
  draw: function (p, t, s) {
    var env = M.bump(M.seg(t, 0.04, 0.34)) + 0.6 * M.bump(M.seg(t, 0.52, 0.78)), sh = 0.05 * env * sin(TAU * 7 * t), bow = 0.1 * env * sin(TAU * 7 * t - 0.9), u = s.tap, lx = 0, ly = 0, lr = 0, sq = 0;
    if (u >= 0) {
      var up = M.easeOut(M.seg(u, 0.05, 0.3)), dn = M.easeIn(M.seg(u, 0.4, 0.62)), bn = M.bump(M.seg(u, 0.62, 0.78));
      ly = -44 * up * (1 - dn) - 4 * bn; lx = 10 * up * (1 - dn); lr = 0.9 * up * (1 - dn); sq = M.bump(M.seg(u, 0.05, 0.2)) * 0.5 + M.bump(M.seg(u, 0.6, 0.72)) * 0.8; sh *= 1 - tapw(s, 0.1, 0.8);
    }
    p.pivot(50, 88, sh, [1 + 0.04 * sq, 1 - 0.06 * sq], function () {
      p.rect(22, 52, 56, 36, { fill: 'b', r: 3 });
      p.rect(45, 52, 10, 36, { fill: 'a' });
      p.line(26, 58, 74, 58, { w: 0.4, detail: true, ink: 'white' });
      p.push(); p.move(lx, ly);
      p.pivot(50, 46, lr, 1, function () {
        p.pivot(50, 38, bow, 1, function () {
          p.path('M50 38 C38 20 22 24 30 34 C34 40 46 39 50 38 Z', { fill: 'a' });
          p.path('M50 38 C62 20 78 24 70 34 C66 40 54 39 50 38 Z', { fill: 'a' });
          p.circle(50, 38, 4.5, { fill: 'gold' });
        });
        p.rect(17, 38, 66, 14, { fill: 'rose', r: 3 });
        p.rect(45, 38, 10, 14, { fill: 'a' });
        p.circle(50, 38, 4.5, { fill: 'gold' });
      });
      p.pop();
    });
  }
});

/* a speech bubble with three typing dots that hop one after another, the left one leading.
   Tap: the dots shrink away and two lines of words are written in their place, then taken back. */
D.add('chat', {
  fam: 'signals', tags: ['message', 'comment', 'talk', 'reply', 'typing', 'conversation', 'bubble', '💬'], loop: 1.6, still: 0.3, burst: false, tapLen: 1.5,
  about: 'three typing dots hop one after another, the left one leading', tapAbout: 'the dots shrink away and two lines of words are written in their place, then taken back',
  draw: function (p, t, s) {
    var u = s.tap, w = tapw(s, 0.12, 0.85), pulse = u >= 0 ? 1 + 0.05 * M.bump(M.seg(u, 0, 0.3)) : 1;
    p.pivot(30, 84, 0, pulse, function () {
      p.path('M22 16 L78 16 Q90 16 90 28 L90 54 Q90 66 78 66 L46 66 L30 84 L32 66 L22 66 Q10 66 10 54 L10 28 Q10 16 22 16 Z', { fill: 'sky' });
    });
    [0, 1, 2].forEach(function (k) {
      var hop = 8 * M.bump(M.seg(M.frac(t - k * 0.12), 0, 0.4));
      p.dot(32 + 18 * k, 41 - hop, 5.2 * (1 - w), 'ink');
    });
    if (u >= 0) [['M24 33 L76 33', 0.12, 0.4], ['M24 48 L60 48', 0.3, 0.55]].forEach(function (l) {
      p.span(l[0], M.easeIn(M.seg(u, 0.72, 0.9)), M.easeOut(M.seg(u, l[1], l[2])), { w: 1.1, cap: 'round' });
    });
  }
});

/* a speaker sends sound waves out from its cone: each wave leaves as a bright arc that widens and is taken back.
   Tap: it turns up: the speaker jolts, four fat waves go out, and notes fly. */
D.add('sound', {
  fam: 'signals', tags: ['audio', 'volume', 'speaker', 'listen', 'music', 'loud', 'unmute', '🔊'], loop: 1.8, still: 0.2, burst: 'note', burstAt: [58, 34], burstN: 5, burstSpread: 2.4, tapLen: 1.3,
  about: 'waves leave the cone as arcs that widen and are taken back, the speaker pulsing', tapAbout: 'turned up: the speaker jolts, four fat waves go out, and notes fly',
  draw: function (p, t, s) {
    var u = s.tap, big = u >= 0 ? tapw(s, 0.1, 0.8) : 0, jolt = u >= 0 ? M.spring(M.seg(u, 0, 0.3)) * 0.1 : 0, n = big > 0.5 ? 4 : 3;
    p.pivot(30, 50, 0, 1 + 0.025 * M.wave(t, 6) + jolt, function () { p.poly([[10, 40], [26, 40], [46, 22], [46, 78], [26, 60], [10, 60]], { fill: 'a' }); });
    for (var k = 0; k < n; k++) {
      var ph = M.frac(t * (u >= 0 ? 1.5 : 1) + k * 0.31), r = 14 + 32 * ph, half = 0.75 - 0.25 * ph;
      p.span(arcD(46, 50, r, -half, half), M.easeIn(M.seg(ph, 0.55, 1)), M.easeOut(M.seg(ph, 0, 0.3)), { w: 0.9 + 0.7 * big, cap: 'round' });
    }
  }
});

/* a camera: the lens glass catches a turning glint and the aperture breathes, a red light blinking by the shutter.
   Tap: the flash fires, a hard white star in the lens, the body clicking shut. */
D.add('camera', {
  fam: 'signals', tags: ['photo', 'picture', 'snap', 'capture', 'image', 'shoot', 'flash', '📷'], loop: 2.4, still: 0.2, burst: false, tapLen: 1.1, margin: [30, 24, 12, 24],
  about: 'the lens glass catches a turning glint, the aperture breathing, a red light blinking', tapAbout: 'the flash fires, a white star in the lens, the body clicking shut',
  draw: function (p, t, s) {
    var u = s.tap, f = u >= 0 ? M.easeOut(M.seg(u, 0, 0.14)) * (1 - M.easeIn(M.seg(u, 0.14, 0.55))) : 0, click = u >= 0 ? M.bump(M.seg(u, 0.1, 0.3)) : 0;
    p.pivot(50, 58, 0.018 * M.wave(t, 1), [1 - 0.03 * click, 1 - 0.05 * click], function () {
      p.path('M30 34 L36 22 L58 22 L64 34 Z', { fill: 'smoke' });
      p.rect(10, 32, 80, 52, { fill: 'sky', r: 9 });
      p.rect(24, 25, 9, 7, { fill: 'b', r: 2, w: 0.8 });
      p.rect(68, 38, 14, 8, { fill: 'cream', r: 2, w: 0.8 });
      p.circle(50, 60, 20, { fill: 'grey' });
      p.circle(50, 60, 12.5 + 1.2 * M.wave(t, 1), { fill: 'navy', w: 0.9 });
      var a = TAU * t - 1; p.arc(50, 60, 8, a, a + 1, { ink: 'white', w: 0.7, cap: 'round' });
      p.clip(function () { p.circle(50, 60, 12.5); }, function () { shine(p, M.seg(t, 0.6, 0.9), 38, 62, 48, 72); });
      p.dot(46, 56, 2, 'white');
      if (M.wave(t, 1, 0.1) > -0.3) p.dot(80, 74, 2.4, 'red');
    });
    if (f > 0.02) {
      p.star(75, 42, 34 * f, 11 * f, 8, { fill: 'yellow', w: 0.9, rot: 0.2 });
      p.star(50, 60, 22 * f, 3 * f, 4, { fill: 'white', w: 0.5 });
    }
  }
});

/* a light bulb flickers on: off, two stutters, then lit with rays drawn out around it; later the rays are taken back.
   Tap: ping, an idea: the bulb pops, rings go out and a gold star jumps from the top. */
D.add('lightbulb', {
  fam: 'signals', tags: ['idea', 'tip', 'light', 'bright', 'insight', 'lamp', 'suggestion', '💡'], loop: 2.8, still: 0.6, burst: 'spark', burstAt: [50, 20], burstN: 5, burstSpread: 3.4, tapLen: 1.3, margin: [34, 24, 10, 24],
  about: 'flickers on with two stutters, rays drawn out around it, and later taken back', tapAbout: 'ping, an idea: the bulb pops, rings go out and a gold star jumps from the top',
  draw: function (p, t, s) {
    var win = function (a, b) { return t > a && t < b ? 1 : 0; }, main = M.easeOut(M.seg(t, 0.38, 0.5)), fl = Math.max(win(0.18, 0.22), win(0.27, 0.3));
    var lit = Math.max(fl, main > 0.05 && t < 0.88 ? 1 : 0), ra = Math.max(main, fl * 0.3), u = s.tap, pop = 0, w = u >= 0 ? tapw(s, 0.1, 0.85) : 0;
    if (u >= 0) { lit = Math.max(lit, w > 0.2 ? 1 : 0); ra = Math.max(ra * (1 - w), w); pop = M.spring(M.seg(u, 0.02, 0.4)) * 0.14 * (1 - M.easeIn(M.seg(u, 0.7, 1))); }
    for (var i = 0; i < 9; i++) {
      var a = -2.7 + i * 0.28, r1 = 46 + (i % 2 ? 0 : 5);
      p.span('M' + (50 + 36 * cos(a)) + ' ' + (40 + 36 * sin(a)) + ' L' + (50 + r1 * cos(a)) + ' ' + (40 + r1 * sin(a)), M.easeIn(M.seg(t, 0.78 + i * 0.012, 0.9)) * (1 - w), M.easeOut(M.seg(ra, i * 0.03, 0.55 + i * 0.03)), { w: 0.9, cap: 'round', ink: 'a' });
    }
    p.pivot(50, 74, 0, 1 + pop, function () {
      p.path('M50 12 C30 12 22 28 22 42 C22 54 30 60 34 68 L34 74 L66 74 L66 68 C70 60 78 54 78 42 C78 28 70 12 50 12 Z', { fill: lit ? 'yellow' : 'cream' });
      p.path('M42 68 L42 52 C42 46 46 46 46 52 C46 58 54 58 54 52 C54 46 58 46 58 52 L58 68', { w: 0.7, ink: lit ? 'orange' : 'grey', detail: true });
      p.path('M30 28 C28 34 28 38 29 42', { ink: 'white', w: 0.6, detail: true });
      p.rect(35, 76, 30, 6, { fill: 'grey', r: 2 }); p.rect(37, 83, 26, 5, { fill: 'grey', r: 2 }); p.rect(44, 89, 12, 5, { fill: 'ink', r: 2.5 });
    });
    if (u >= 0) {
      [0, 1].forEach(function (k) { var v = M.seg(u, 0.1 + k * 0.12, 0.6 + k * 0.12); if (v > 0 && v < 1) p.span(oval(50, 42, 34 + 22 * M.easeOut(v), 34 + 22 * M.easeOut(v)), M.easeIn(M.seg(v, 0.3, 1)), 1, { w: 0.6, ink: 'a' }); });
      var st = M.spring(M.seg(u, 0.12, 0.5)) * (1 - M.easeIn(M.seg(u, 0.75, 1)));
      if (st > 0.03) p.at(50, -2 - 6 * M.bump(M.seg(u, 0.12, 0.5)), 0.3 * sin(TAU * 2 * u), st, function () { p.star(0, 0, 10, 4.2, 5, { fill: 'gold', w: 0.8 }); });
    }
  }
});

/* a switch: the knob teases toward the other side and rocks back. Taps toggle it: the knob slides across,
   stretching, overshoots, and a ring leaves it. */
D.add('toggle', {
  fam: 'signals', tags: ['switch', 'on', 'off', 'setting', 'enable', 'disable', 'slider'], loop: 2.4, still: 0.2, burst: false, tapLen: 1, tapRest: 1,
  about: 'a switch; the knob teases toward the other side and rocks back', tapAbout: 'toggles: the knob slides across stretching, overshoots, and a ring leaves it',
  draw: function (p, t, s) {
    var cur = s.taps % 2, pos = cur, u = s.tap, w = tapw(s, 0.1, 0.9), sq = 0, rp = 0;
    var tease = (cur ? -1 : 1) * 5 * (M.bump(M.seg(t, 0.1, 0.26)) + 0.6 * M.bump(M.seg(t, 0.34, 0.46))) * (1 - w);
    if (u >= 0) { pos = M.lerp(1 - cur, cur, M.spring(M.seg(u, 0.05, 0.55))); sq = M.bump(M.seg(u, 0.05, 0.5)); rp = M.seg(u, 0.4, 1); }
    var x = 32 + 36 * pos + tease, xe = cur ? 68 : 32;
    p.rect(10, 28, 80, 44, { fill: pos > 0.5 ? 'leaf' : 'smoke', r: 22 });
    if (pos > 0.5) p.line(28, 42, 28, 58, { w: 0.9, ink: 'white', cap: 'round', detail: true }); else p.circle(70, 50, 6, { w: 0.8, ink: 'grey', detail: true });
    p.pivot(x, 50, 0, [1 + 0.28 * sq, 1 - 0.1 * sq], function () { p.circle(x, 50, 16, { fill: 'white' }); });
    if (rp > 0 && rp < 1) p.span(oval(xe, 50, 16 + 16 * M.easeOut(rp), 16 + 16 * M.easeOut(rp)), M.easeIn(M.seg(rp, 0.3, 1)), 1, { w: 0.6, ink: pos > 0.5 ? 'leaf' : 'grey' });
  }
});

/* a power symbol standing by in grey, a spark circling its ring. Taps toggle it: the stem is pressed, the ring
   draws itself round in green and rays flare; turned off, it all drains away. */
D.add('power', {
  fam: 'signals', tags: ['on', 'off', 'start', 'shutdown', 'standby', 'switch', 'button', '⏻'], loop: 2, still: 0.3, burst: false, tapLen: 1.2, tapRest: 1,
  about: 'a power symbol standing by in grey with a spark circling the ring; on, it is green with rays shimmering', tapAbout: 'toggles: the stem is pressed, the ring draws round in green and rays flare, or it all drains away',
  draw: function (p, t, s) {
    var cur = s.taps % 2, pr = cur, u = s.tap, press = 0, g = 0.62, half = (TAU - 2 * g) / 2, base = { w: 1.6, ink: 'grey', cap: 'round' }, on = { w: 1.9, ink: 'leaf', cap: 'round' };
    if (u >= 0) { pr = M.lerp(1 - cur, cur, M.ease(M.seg(u, 0.1, 0.65))); press = 5 * M.bump(M.seg(u, 0, 0.3)); }
    p.arc(50, 54, 26, -PI / 2 + g, -PI / 2 + g + 2 * half, base);
    p.line(50, 18 + press, 50, 52, base);
    if (pr > 0.02) {
      p.arc(50, 54, 26, -PI / 2 + g, -PI / 2 + g + half * pr, on);
      p.arc(50, 54, 26, -PI / 2 - g - half * pr, -PI / 2 - g, on);
      p.draw('M50 ' + (18 + press) + ' L50 52', Math.min(1, pr * 1.6), on);
      for (var i = 0; i < 10; i++) {
        var a = i * TAU / 10 + 0.15, l = 38 + 9 * (0.55 + 0.45 * M.wave(t, 2, i * 0.1)) * pr;
        p.line(50 + 37 * cos(a), 54 + 37 * sin(a), 50 + l * cos(a), 54 + l * sin(a), { w: 0.7, ink: 'leaf', cap: 'round', detail: true });
      }
    }
    var a2 = -PI / 2 + g + TAU * t; p.dot(50 + 26 * cos(a2), 54 + 26 * sin(a2), 2.4 + pr * 0.8, pr > 0.5 ? 'leaf' : 'ink');
  }
});

/* a play button: the triangle leans forward and a ring leaves the button each loop; paused, the two bars bob
   one after the other. Taps toggle: the triangle melts into the bars, or back, with a squash and a ripple. */
D.add('play', {
  fam: 'signals', tags: ['media', 'start', 'pause', 'video', 'audio', 'resume', 'button', '▶'], loop: 1.8, still: 0.3, burst: false, tapLen: 1, tapRest: 1,
  about: 'the triangle leans forward and a ring leaves the button; paused, the bars bob one after the other', tapAbout: 'toggles: the triangle melts into two bars, or back, with a squash and a ripple',
  draw: function (p, t, s) {
    var cur = s.taps % 2, pos = cur, u = s.tap, sq = 0, rp = M.seg(t, 0.1, 0.7);
    if (u >= 0) { pos = M.lerp(1 - cur, cur, M.spring(M.seg(u, 0.05, 0.5))); sq = M.bump(M.seg(u, 0.05, 0.4)); rp = M.seg(u, 0.35, 1); }
    var L0 = [[37, 32], [50, 39.55], [50, 60.45], [37, 68]], L1 = [[35, 32], [46, 32], [46, 68], [35, 68]], R0 = [[50, 39.55], [68, 50], [68, 50], [50, 60.45]], R1 = [[54, 32], [65, 32], [65, 68], [54, 68]];
    var mix = function (a, b, dx, dy) { return a.map(function (q, i) { return [M.lerp(q[0], b[i][0], pos) + dx, M.lerp(q[1], b[i][1], pos) + dy]; }); };
    var lean = 2 * M.wave(t, 2) * (1 - pos), bl = 2 * M.wave(t, 2) * pos, br = 2 * M.wave(t, 2, 0.12) * pos;
    if (rp > 0 && rp < 1) p.span(oval(50, 50, 38 + 14 * M.easeOut(rp), 38 + 14 * M.easeOut(rp)), M.easeIn(M.seg(rp, 0.3, 1)), 1, { w: 0.6, ink: 'b' });
    p.pivot(50, 50, 0, [1 - 0.05 * sq, 1 - 0.05 * sq], function () {
      p.circle(50, 50, 38, { fill: 'b' });
      if (pos < 0.04) p.poly([[37 + lean, 32], [68 + lean, 50], [37 + lean, 68]], { fill: 'white', w: 0.9 });
      else { p.poly(mix(L0, L1, lean, bl), { fill: 'white', w: 0.9 }); p.poly(mix(R0, R1, lean, br), { fill: 'white', w: 0.9 }); }
    });
  }
});

/* three bars of a menu slide in turn, the top one leading. Taps toggle: the top and bottom bars swing to a cross
   as the middle one shrinks away, and swing back. */
D.add('menu', {
  fam: 'signals', tags: ['hamburger', 'navigation', 'list', 'close', 'drawer', 'options', 'burger', '☰'], loop: 2, still: 0.3, burst: false, tapLen: 1, tapRest: 1,
  about: 'three bars slide in turn, the top one leading', tapAbout: 'toggles: top and bottom bars swing to a cross as the middle one shrinks away, or back',
  draw: function (p, t, s) {
    var cur = s.taps % 2, e = cur;
    if (s.tap >= 0) e = M.lerp(1 - cur, cur, M.spring(M.seg(s.tap, 0.05, 0.55)));
    var ec = Math.max(0, Math.min(1, e));
    ['a', 'c', 'b'].forEach(function (col, k) {
      var half = k === 1 ? M.lerp(20, 0, ec) : 28, ang = (k === 0 ? 1 : k === 2 ? -1 : 0) * PI / 4 * e + 0.05 * e * M.wave(t, 1), sl = (1 - ec) * 5 * M.wave(t, 1, k * 0.12);
      if (half > 1.5) p.at(50 + sl, M.lerp(26 + 24 * k, 50, e), ang, 1, function () { p.line(-half, 0, half, 0, { w: 1.5, ink: col, cap: 'round' }); });
    });
  }
});

/* a scanner: a green line sweeps up and down a code between four corner brackets.
   Tap: the brackets close in with a click and a tick is drawn on the code, then taken back. */
D.add('scan', {
  fam: 'signals', tags: ['qr', 'code', 'barcode', 'read', 'detect', 'camera', 'check', 'reader'], loop: 2.2, still: 0.25, burst: false, tapLen: 1.3,
  about: 'a green line sweeps up and down a code between four corner brackets', tapAbout: 'the brackets close in with a click and a tick is drawn on the code, then taken back',
  draw: function (p, t, s) {
    var u = s.tap, w = tapw(s, 0.12, 0.85), pop = u >= 0 ? M.spring(M.seg(u, 0.05, 0.4)) * 0.12 : 0, y = 50 + 28 * M.wave(t, 1), k = 1 - pop;
    p.pivot(50, 50, 0, k, function () {
      p.path('M12 32 L12 12 L32 12', { w: 1.5, cap: 'round' }); p.path('M68 12 L88 12 L88 32', { w: 1.5, cap: 'round' });
      p.path('M12 68 L12 88 L32 88', { w: 1.5, cap: 'round' }); p.path('M68 88 L88 88 L88 68', { w: 1.5, cap: 'round' });
      [[28, 28], [56, 28], [28, 56]].forEach(function (c) { p.rect(c[0], c[1], 16, 16, { w: 0.9 }); p.rect(c[0] + 5, c[1] + 5, 6, 6, { fill: 'ink', line: false }); });
      [[56, 56], [66, 60], [58, 66], [68, 70], [48, 50]].forEach(function (c) { p.rect(c[0], c[1], 6, 6, { fill: 'ink', line: false, detail: true }); });
    });
    if (w < 0.5) { p.rect(16, y - 6, 68, 12, { fill: 'leaf', line: false, alpha: 0.22, detail: true }); p.line(14, y, 86, y, { w: 1.1, ink: 'leaf', cap: 'round' }); }
    if (u >= 0) {
      var d = M.spring(M.seg(u, 0.1, 0.4)) * (1 - M.easeIn(M.seg(u, 0.8, 1)));
      p.pivot(50, 50, 0, Math.max(0.01, d), function () { p.circle(50, 50, 24, { fill: 'white' }); });
      p.span('M37 51 L46 60 L64 38', M.easeIn(M.seg(u, 0.72, 0.9)), M.easeOut(M.seg(u, 0.25, 0.5)), { w: 2.1, ink: 'green', cap: 'round' });
    }
  }
});

/* a microphone with a recording light blinking and three level bars bouncing out of step.
   Tap: the mic rocks, the bars shoot to the top and notes fly. */
D.add('mic', {
  fam: 'signals', tags: ['record', 'voice', 'audio', 'speak', 'listen', 'dictate', 'podcast', '🎤'], loop: 1.6, still: 0.3, burst: 'note', burstAt: [34, 20], burstN: 4, burstSpread: 2.4, tapLen: 1.2,
  about: 'a recording light blinks and three level bars bounce out of step', tapAbout: 'the mic rocks, the bars shoot to the top and notes fly',
  draw: function (p, t, s) {
    var u = s.tap, k = tapw(s, 0.1, 0.8), tilt = 0.12 * ring(u, 3);
    p.pivot(34, 86, tilt, 1, function () {
      p.path('M20 42 C20 66 48 66 48 42', { w: 1.2 });
      p.line(34, 62, 34, 84, { w: 1.2 }); p.line(21, 87, 47, 87, { w: 1.4, cap: 'round' });
      p.rect(24, 10, 20, 44, { fill: 'grey', r: 10 });
      [22, 30, 38].forEach(function (y) { p.line(28, y, 40, y, { w: 0.4, detail: true }); });
    });
    [0, 1, 2].forEach(function (i) {
      var lv = Math.min(1, 0.22 + 0.5 * (0.5 + 0.5 * M.wave(t, 2, i * 0.27 + 0.1)) + 0.6 * k);
      p.line(64 + 12 * i, 80, 64 + 12 * i, 80 - 56 * lv, { w: 1.2, ink: lv > 0.85 ? 'red' : 'leaf', cap: 'round' });
    });
    p.dot(80, 14, (2.6 + 1.4 * (0.5 + 0.5 * M.wave(t, 1))) * (1 + 0.5 * k), 'red');
  }
});

/* three nodes joined by lines, small packets running out from the left one to the other two, one line a step behind.
   Tap: the two far nodes pop one after the other and a ring leaves each. */
D.add('share', {
  fam: 'signals', tags: ['send', 'network', 'connect', 'social', 'post', 'forward', 'distribute', 'nodes'], loop: 1.8, still: 0.3, burst: false, tapLen: 1.2,
  about: 'packets run out from the left node to the other two, one line a step behind', tapAbout: 'the two far nodes pop one after the other and a ring leaves each',
  draw: function (p, t, s) {
    var A = [24, 50], N = [[76, 24, 'c'], [76, 76, 'b']], u = s.tap;
    N.forEach(function (n) { p.line(A[0], A[1], n[0], n[1], { w: 1 }); });
    N.forEach(function (n, i) {
      for (var k = 0; k < 2; k++) {
        var ph = M.frac(t + i * 0.13 + k * 0.5), r = 2.9 * M.easeOut(M.seg(ph, 0, 0.15)) * (1 - M.easeIn(M.seg(ph, 0.85, 1)));
        if (r > 0.3) p.dot(M.lerp(A[0], n[0], ph), M.lerp(A[1], n[1], ph), r, 'ink');
      }
    });
    p.circle(A[0], A[1], 11 * (1 + 0.06 * M.wave(t, 2)), { fill: 'a' });
    N.forEach(function (n, i) {
      var pop = u >= 0 ? M.spring(M.seg(u, 0.05 + 0.15 * i, 0.4 + 0.15 * i)) * 0.25 * (1 - M.easeIn(M.seg(u, 0.8, 1))) : 0, v = u >= 0 ? M.seg(u, 0.25 + 0.15 * i, 0.8) : 0;
      p.circle(n[0], n[1], 11 * (1 + pop), { fill: n[2] });
      if (v > 0 && v < 1) p.span(oval(n[0], n[1], 11 + 14 * M.easeOut(v), 11 + 14 * M.easeOut(v)), M.easeIn(M.seg(v, 0.3, 1)), 1, { w: 0.6 });
    });
  }
});

/* two sheets, and a dashed outline of the front one slides out from it and back, a copy being made.
   Tap: the front sheet stamps down and a copy flies off to the upper right, shrinking away. */
D.add('copy', {
  fam: 'signals', tags: ['duplicate', 'clipboard', 'paste', 'clone', 'document', 'sheets', 'copied'], loop: 2.4, still: 0.3, burst: 'spark', burstAt: [60, 50], burstN: 4, burstSpread: 3, tapLen: 1.2, margin: [24, 24, 12, 24],
  about: 'a dashed outline of the front sheet slides out and back, a copy being made', tapAbout: 'the front sheet stamps down and a copy flies off to the upper right, shrinking away',
  draw: function (p, t, s) {
    var g = M.bump(M.seg(t, 0.15, 0.8)), u = s.tap, sq = u >= 0 ? M.bump(M.seg(u, 0.05, 0.3)) : 0, f = u >= 0 ? M.seg(u, 0.12, 0.75) : 0;
    p.rect(14, 10, 46, 58, { fill: 'cream', r: 5 });
    p.line(22, 22, 50, 22, { w: 0.5, detail: true }); p.line(22, 32, 44, 32, { w: 0.5, detail: true });
    p.pivot(59, 61, 0, [1 + 0.03 * sq, 1 - 0.06 * sq], function () {
      p.rect(34, 32, 50, 58, { fill: 'white', r: 5 });
      p.line(42, 46, 76, 46, { w: 0.5, detail: true }); p.line(42, 56, 70, 56, { w: 0.5, detail: true }); p.line(42, 66, 74, 66, { w: 0.5, detail: true });
    });
    if (g > 0.03) p.rect(34 + 13 * g, 32 + 7 * g, 50, 58, { r: 5, dash: [3, 3], w: 0.6, ink: 'b' });
    if (f > 0 && f < 1) {
      var e = M.easeIn(f), k = Math.max(0.02, 1 - M.easeIn(M.seg(f, 0.4, 1)));
      p.push(); p.move(40 * e, -46 * e);
      p.pivot(59, 61, 0.8 * e, k, function () { p.rect(34, 32, 50, 58, { fill: 'white', r: 5 }); p.line(42, 46, 76, 46, { w: 0.5, detail: true }); });
      p.pop();
    }
  }
});

/* a floppy disk whose shutter slides to and fro while lines are written on its label and wiped.
   Tap: the disk nods down and a green tick is drawn across it, then taken back. */
D.add('save', {
  fam: 'signals', tags: ['floppy', 'disk', 'store', 'keep', 'write', 'saved', 'persist'], loop: 2.4, still: 0.5, burst: false, tapLen: 1.3,
  about: 'the shutter slides to and fro while lines are written on the label and wiped', tapAbout: 'the disk nods down and a green tick is drawn across it, then taken back',
  draw: function (p, t, s) {
    var u = s.tap, nod = u >= 0 ? 5 * M.bump(M.seg(u, 0.05, 0.4)) : 0, sq = u >= 0 ? M.bump(M.seg(u, 0.05, 0.4)) : 0;
    p.push(); p.move(0, nod); p.pivot(50, 86, 0, [1 + 0.03 * sq, 1 - 0.05 * sq], function () {
      p.path('M14 14 L70 14 L86 30 L86 86 L14 86 Z', { fill: 'blue' });
      p.rect(24, 50, 52, 36, { fill: 'white', w: 0.9 });
      [0, 1, 2].forEach(function (k) {
        var d = 'M30 ' + (59 + 9 * k) + ' L' + (66 - 8 * k) + ' ' + (59 + 9 * k);
        p.span(d, M.easeIn(M.seg(t, 0.78 + 0.04 * k, 0.94)), M.easeOut(M.seg(t, 0.1 + 0.14 * k, 0.3 + 0.14 * k)), { w: 0.6, detail: true });
      });
      p.rect(30 + 4 * M.wave(t, 1), 14, 32, 20, { fill: 'grey', r: 2, w: 0.9 });
      p.rect(51 + 4 * M.wave(t, 1), 18, 7, 12, { fill: 'ink', r: 1.5, line: false });
    });
    p.pop();
    if (u >= 0) p.span('M32 66 L46 80 L72 50', M.easeIn(M.seg(u, 0.72, 0.9)), M.easeOut(M.seg(u, 0.2, 0.5)), { w: 2.4, ink: 'green', cap: 'round' });
  }
});

/* a roadside mailbox on its post, the little flag popping up and dropping back, teasing.
   Tap: the flag springs up and a letter slides out of the door and back in. */
D.add('mailbox', {
  fam: 'signals', tags: ['mail', 'post', 'letter', 'inbox', 'message', 'delivery', 'new mail', 'you have mail'], loop: 2.4, still: 0.3, burst: false, tapLen: 1.4, margin: [24, 18, 8, 24],
  about: 'the little flag pops up and drops back, teasing', tapAbout: 'the flag springs up and a letter slides out of the door and back in',
  draw: function (p, t, s) {
    var u = s.tap, f = M.spring(M.seg(t, 0.12, 0.32)) * (1 - M.ease(M.seg(t, 0.55, 0.72))), pk = 0;
    if (u >= 0) { var w = tapw(s, 0.1, 0.85); f = f * (1 - w) + w * M.spring(M.seg(u, 0.05, 0.4)); pk = M.easeOut(M.seg(u, 0.1, 0.4)) * (1 - M.easeIn(M.seg(u, 0.65, 0.85))); }
    var lx = 26 - 26 * pk;
    p.line(26, 93, 70, 93, { w: 0.9 });
    p.rect(42, 62, 12, 31, { fill: 'wood' });
    if (pk > 0.02) { p.rect(lx, 42, 24, 16, { fill: 'white', r: 2 }); p.path('M' + lx + ' 43 L' + (lx + 12) + ' 51 L' + (lx + 24) + ' 43', { w: 0.5, detail: true }); }
    p.path('M18 62 L18 46 C18 30 30 24 44 24 L74 24 L74 62 Z', { fill: 'blue' });
    p.line(27, 33, 27, 57, { w: 0.4, detail: true, ink: 'white' });
    p.pivot(78, 48, 1.75 * (1 - f), 1, function () { p.line(78, 48, 78, 28, { w: 1.1 }); p.rect(78, 26, 14, 9, { fill: 'red', w: 0.8 }); });
  }
});
})(Dingbats);
