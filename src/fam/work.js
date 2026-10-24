/* Work: the jobs people hand over — a page, a stamp, a translation, a wrench, a laptop, a server, a parcel, a passport. First drawn for hongdam.net's service lines (2026-10-23). */
(function (D) {
'use strict';
var M = D.math, TAU = M.TAU, PI = Math.PI, sin = Math.sin, cos = Math.cos, seg = M.seg, ez = M.ease, eo = M.easeOut, ei = M.easeIn, bump = M.bump, lerp = M.lerp;

/* handwriting: a looped line from x0 to x1 on baseline y, n letters h high; reads as script, not as any word */
function scrawl(x0, x1, y, h, n, loopy) {
  var d = '', N = n * 10, c = (x1 - x0) / (n * TAU), b = c * (loopy || 1.6), i, s;
  for (i = 0; i <= N; i++) { s = i / N * n * TAU; d += (i ? ' L' : 'M') + (x0 + c * s - b * sin(s)).toFixed(2) + ' ' + (y - h / 2 * (1 - cos(s))).toFixed(2); }
  return d;
}
/* a point on a cubic */
function bz(a, b, c, d, u) { var v = 1 - u; return [v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0], v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1]]; }
/* a speech bubble around (x, y), its tail on the left (-1) or right (1) of the bottom edge */
function bubbleD(x, y, w, h, side) {
  var l = x - w / 2, r = x + w / 2, tp = y - h / 2, b = y + h / 2, k = 7;
  var tail = side < 0 ? ' L' + (l + 20) + ' ' + b + ' L' + (l + 5) + ' ' + (b + 10) + ' L' + (l + 11) + ' ' + b : ' L' + (r - 11) + ' ' + b + ' L' + (r - 5) + ' ' + (b + 10) + ' L' + (r - 20) + ' ' + b;
  return 'M' + (l + k) + ' ' + tp + ' L' + (r - k) + ' ' + tp + ' Q' + r + ' ' + tp + ' ' + r + ' ' + (tp + k) + ' L' + r + ' ' + (b - k) + ' Q' + r + ' ' + b + ' ' + (r - k) + ' ' + b +
    tail + ' L' + (l + k) + ' ' + b + ' Q' + l + ' ' + b + ' ' + l + ' ' + (b - k) + ' L' + l + ' ' + (tp + k) + ' Q' + l + ' ' + tp + ' ' + (l + k) + ' ' + tp + ' Z';
}
var KO = 'M-6.5 9 L-6.5 -1.5 C-6.5 -4.6 -2 -5 -2.2 -2.2 C-2.4 0.4 -6.6 0.2 -6.2 -3.6 C-5.4 -9.6 6.5 -10.4 6.5 -1.5 L6.5 9';   /* ก as a looped Thai hand writes it: the small loop at the top of the left stem, the arch, the right stem */
var AA = 'M-7 9 L0 -9 L7 9 M-4 2.6 L4 2.6';
var SHIELD = 'M50 26 C58 31 66 32 74 30 C75 50 67 66 50 76 C33 66 25 50 26 30 C34 32 42 31 50 26 Z';
var TICK = 'M39 51 C43 54 46 58 48 62 C53 50 59 42 66 36';

D.add('page', {
  fam: 'work', tags: ['document', 'paper', 'form', 'letter', 'contract', 'certificate', 'write', 'file', '📄'], loop: 3.2, still: 0.74, burst: 'spark', burstAt: [74, 20], burstN: 4, burstSpread: 3, tapLen: 1.2, margin: [16, 22, 18, 22],
  about: 'four lines of handwriting write themselves down the page, then the page is wiped clean for the next', tapAbout: 'the page turns over and back like a leaf in the wind',
  draw: function (p, t, s) {
    var flip = s.tap >= 0 ? cos(TAU * ez(seg(s.tap, 0.04, 0.86))) : 1, wipe = ez(seg(t, 0.84, 0.98)), lines = [[31, 70, 36, 7, 4], [31, 66, 50, 7, 4], [31, 70, 64, 7, 4], [31, 55, 78, 7, 3]];
    p.pivot(50, 52, 0.035 * M.wave(t, 1), [Math.max(0.04, Math.abs(flip)), 1], function () {
      p.path('M22 12 L64 12 L80 28 L80 90 L22 90 Z', { fill: flip < 0 ? 'cream' : 'white' });
      p.path('M64 12 L64 28 L80 28 Z', { fill: 'stone', w: 0.7 });
      lines.forEach(function (L, i) {
        var a = 0.05 + 0.16 * i, u = ez(seg(t, a, a + 0.17));
        if (u > wipe) p.span(scrawl(L[0], L[1], L[2], L[3], L[4]), wipe, u, { ink: 'navy', w: 0.6, wob: 0.4 });
      });
    });
  }
});

D.add('translate', {
  fam: 'work', tags: ['translation', 'language', 'interpreter', 'thai', 'english', 'speak', 'words', '🔤'], loop: 2.6, still: 0.3, ratio: 1.15, burst: 'spark', burstAt: [57, 50], burstN: 5, burstSpread: 3, tapLen: 1.4, margin: [18, 20, 26, 20],
  about: 'a Thai bubble and an English one bob in turn while three dots carry the words across', tapAbout: 'the two bubbles circle round each other and land home again',
  draw: function (p, t, s) {
    var th = s.tap >= 0 ? TAU * ez(seg(s.tap, 0.02, 0.9)) : 0, cx = 57, cy = 51;
    function pos(x, y) { var dx = x - cx, dy = y - cy; return [cx + dx * cos(th) - dy * sin(th), cy + dx * sin(th) + dy * cos(th)]; }
    var A = pos(36, 36 + 2.2 * M.wave(t, 1)), B = pos(78, 64 + 2.2 * M.wave(t, 1, 0.06));
    if (!p.small) for (var k = 0; k < 3; k++) {
      var u = M.frac(t + k / 3), q = bz([44, 56], [44, 74], [56, 82], [62, 76], u);
      if (s.tap < 0) p.dot(q[0], q[1], 1.8 * bump(u), 'b');
    }
    p.at(A[0], A[1], 0.06 * M.wave(t, 1), 1, function () { p.path(bubbleD(0, 0, 44, 34, -1), { fill: 'a' }); p.path(KO, { w: 1.3, ink: 'navy', fill: false }); });
    p.at(B[0], B[1], 0.06 * M.wave(t, 1, 0.06), 1, function () { p.path(bubbleD(0, 0, 44, 34, 1), { fill: 'sky' }); p.path(AA, { w: 1.3, ink: 'navy', fill: false }); });
  }
});

D.add('stamp', {
  fam: 'work', tags: ['seal', 'certified', 'official', 'approve', 'notary', 'rubber stamp', 'chop'], loop: 2.4, still: 0.42, burst: 'ring', burstAt: [50, 84], burstN: 6, burstSpread: 2.6, burstColor: 'red', burstDelay: 0.22, tapLen: 1.3, margin: [18, 18, 14, 18],
  about: 'the stamp hovers, comes down hard, lifts; a red seal is left on the paper and slowly fades', tapAbout: 'two hard stamps, the seal bright red',
  draw: function (p, t, s) {
    var press, mark;
    if (s.tap >= 0) { var q = s.tap; press = Math.max(bump(seg(q, 0.08, 0.36)), bump(seg(q, 0.42, 0.7))); mark = 1; }
    else { press = ei(seg(t, 0.18, 0.34)) * (1 - ez(seg(t, 0.38, 0.6))); mark = t > 0.33 ? 1 - ez(seg(t, 0.62, 0.96)) : 0; }
    var dy = lerp(-6, 12, press), sq = bump(seg(press, 0.85, 1)) * 0 + (press > 0.95 ? (press - 0.95) * 20 : 0);
    p.path('M12 74 L88 70 L90 95 L10 96 Z', { fill: 'white', w: 0.9 });
    if (mark > 0.02) p.at(50, 84, -0.08, 1, function () {
      p.ellipse(0, 0, 13, 6.4, { ink: 'red', w: 1.1, alpha: mark, fill: false });
      p.ellipse(0, 0, 8.8, 4.1, { ink: 'red', w: 0.7, alpha: mark, fill: false });
      p.star(0, -0.2, 3.2, 1.4, 5, { fill: 'red', line: false, alpha: mark });
    });
    p.ellipse(50, 86, 15 - 5 * (1 - press), 3, { fill: 'smoke', line: false, alpha: 0.5 * press });
    p.pivot(50, 66 + dy, 0, [1 + 0.06 * sq, 1 - 0.08 * sq], function () {
      p.move(0, dy);
      p.circle(50, 22, 9, { fill: 'wood' });
      p.rect(45, 28, 10, 22, { fill: 'wood', r: 3 });
      p.rect(32, 49, 36, 7, { fill: 'brown', r: 2 });
      p.rect(34, 56, 32, 10, { fill: 'red', r: 2 });
      p.line(47, 33, 47, 45, { ink: 'white', w: 0.5, alpha: 0.6, detail: true });
    });
  }
});

D.add('wrench', {
  fam: 'work', tags: ['spanner', 'fix', 'repair', 'tool', 'plumber', 'mechanic', 'maintenance', 'settings', '🔧'], loop: 1.6, still: 0.25, burst: 'spark', burstAt: [64, 40], burstN: 5, burstSpread: 3, tapLen: 1.1, margin: [20, 20, 20, 20],
  about: 'the spanner works a nut back and forth, a quarter turn at a time', tapAbout: 'one hard pull and the spanner spins the nut all the way round',
  draw: function (p, t, s) {
    var rock = 0.32 * sin(TAU * t) + 0.08 * sin(TAU * 2 * t + 0.5), spin = s.tap >= 0 ? TAU * eo(seg(s.tap, 0.05, 0.8)) : 0, a = 2.36 + rock + spin;
    if (!p.small && s.tap < 0) { var v = cos(TAU * t); for (var i = 0; i < 2; i++) p.arc(64, 40, 34 + 5 * i, a + 0.4 - 0.25 * v, a + 0.75 - 0.25 * v, { w: 0.45, ink: 'b', alpha: Math.abs(v) * 0.9, detail: true }); }
    p.at(64, 40, a, 0.92, function () {
      p.rect(15, -5, 48, 10, { fill: 'grey', r: 5 });
      p.path('M-13 -7 C-15 -21 9 -24 17 -12 C21 -5 21 5 17 12 C9 24 -15 21 -13 7 L7 7 L7 -7 Z', { fill: 'grey' });
      p.line(24, -1.5, 54, -1.5, { ink: 'white', w: 0.5, alpha: 0.7, detail: true });
      p.circle(52, 0, 2.4, { fill: 'bg', w: 0.7 });
      p.at(0, 0, -rock * 0.2, 1, function () {
        var h = []; for (var k = 0; k < 6; k++) h.push([8 * cos(k * PI / 3 + PI / 6), 8 * sin(k * PI / 3 + PI / 6)]);
        p.poly(h, { fill: 'a', w: 0.9 }); p.circle(0, 0, 3, { fill: 'bg', w: 0.7 });
      });
    });
  }
});

D.add('laptop', {
  fam: 'work', tags: ['computer', 'website', 'web', 'site', 'app', 'online', 'build', 'code', '💻'], loop: 3.6, still: 0.72, ratio: 1.25, burst: 'confetti', burstAt: [62, 36], burstN: 9, burstSpread: 3, tapLen: 1.4, margin: [18, 18, 14, 18],
  about: 'a web page builds itself on the screen: the bar, the picture, the words, the button; then it clears for the next', tapAbout: 'the page goes live: a big tick and confetti',
  draw: function (p, t, s) {
    var gone = 1 - ez(seg(t, 0.86, 0.98)), bar = ez(seg(t, 0.04, 0.18)), pic = M.spring(seg(t, 0.18, 0.36)), btn = M.spring(seg(t, 0.6, 0.76)), tick = s.tap >= 0 ? s.tap : -1;
    p.path('M6 86 L119 86 L110 75 L15 75 Z', { fill: 'stone' });
    p.line(52, 81, 73, 81, { w: 0.6, detail: true });
    p.rect(19, 14, 87, 62, { fill: 'night', r: 5 });
    p.rect(24, 19, 77, 51, { fill: 'white', r: 2, w: 0.6 });
    p.clip(function () { p.rect(24, 19, 77, 51, { r: 2 }); }, function () {
      if (bar > 0) p.rect(24, 19, 77 * bar, 9, { fill: 'a', line: false, alpha: gone });
      if (pic > 0.01 && gone > 0.01) p.pivot(43, 45, 0, Math.max(0.01, pic), function () { p.rect(29, 33, 28, 22, { fill: 'sky', w: 0.6, alpha: gone }); p.path('M30 54 L39 44 L46 50 L50 46 L56 54 Z', { fill: 'leaf', line: false, alpha: gone }); p.dot(50, 38, 2.4, 'a'); });
      for (var i = 0; i < 3; i++) { var u = ez(seg(t, 0.36 + 0.07 * i, 0.46 + 0.07 * i)); if (u > 0 && gone > 0.02) p.draw('M62 ' + (36 + 7 * i) + ' L' + (i === 2 ? 84 : 94) + ' ' + (36 + 7 * i), u, { ink: 'stone', w: 0.9, alpha: gone }); }
      if (btn > 0.01 && gone > 0.01) p.pivot(73, 61, 0, Math.max(0.01, btn), function () { p.rect(62, 57, 22, 8, { fill: 'b', r: 4, w: 0.6, alpha: gone }); });
      if (tick >= 0) { p.rect(24, 19, 77, 51, { fill: 'mint', line: false, alpha: 0.85 * bump(seg(tick, 0, 1)) }); p.at(12, -6, 0, 1, function () { p.draw(TICK, ez(seg(tick, 0.1, 0.45)), { ink: 'green', w: 2.4, alpha: 1 - ez(seg(tick, 0.8, 1)) }); }); }
    });
  }
});

D.add('server', {
  fam: 'work', tags: ['hosting', 'server', 'security', 'patch', 'php', 'wordpress', 'database', 'cloud', 'protect'], loop: 2, still: 0.15, burst: 'spark', burstAt: [50, 30], burstN: 5, burstSpread: 3, tapLen: 1.4, margin: [18, 20, 14, 20],
  about: 'three units hum, their lights blinking out of step', tapAbout: 'a shield springs up in front with a tick on it',
  draw: function (p, t, s) {
    var sh = s.tap >= 0 ? M.spring(seg(s.tap, 0.05, 0.5)) * (1 - ez(seg(s.tap, 0.82, 1))) : 0;
    p.rect(30, 90, 8, 4, { fill: 'night', w: 0.6 }); p.rect(62, 90, 8, 4, { fill: 'night', w: 0.6 });
    for (var i = 0; i < 3; i++) {
      var y = 12 + 26 * i, n = [2, 3, 4][i];
      p.rect(24, y, 52, 22, { fill: 'grey', r: 4 });
      p.rect(28, y + 4, 44, 14, { fill: 'night', r: 2, w: 0.6 });
      p.dot(35, y + 11, 2.6, M.wave(t, n, 0.13 * i) > -0.2 ? 'leaf' : 'green');
      p.dot(43, y + 11, 2.6, M.wave(t, n + 1, 0.4 + 0.11 * i) > 0.3 ? 'a' : 'brown');
      if (!p.small) for (var k = 0; k < 4; k++) { var hgt = 3 + 3.5 * (1 + M.wave(t, n + k, 0.21 * k + 0.1 * i)); p.line(52 + 5 * k, y + 15, 52 + 5 * k, y + 15 - hgt, { ink: k % 2 ? 'mint' : 'stone', w: 0.6, detail: true }); }
    }
    if (sh > 0.01) p.pivot(50, 52, 0, sh, function () { p.path(SHIELD, { fill: 'c', w: 1.2 }); p.draw(TICK, 1, { ink: 'white', w: 2 }); });
  }
});

D.add('parcel', {
  fam: 'work', tags: ['box', 'package', 'shipping', 'delivery', 'post', 'send', 'order', 'moving', '📦'], loop: 1.8, still: 0.1, burst: 'confetti', burstAt: [50, 36], burstN: 9, burstSpread: 2.8, burstDelay: 0.35, tapLen: 1.5, margin: [22, 18, 12, 18],
  about: 'the box hops, squashes on landing and settles', tapAbout: 'the flaps pop open and something bright flies out',
  draw: function (p, t, s) {
    var up = bump(seg(t, 0.12, 0.5)), land = bump(seg(t, 0.48, 0.66)), crouch = bump(seg(t, 0, 0.12)) + bump(seg(t, 0.88, 1)), sq = 0.08 * land + 0.05 * crouch - 0.05 * up;
    var open = s.tap >= 0 ? M.spring(seg(s.tap, 0.05, 0.42)) * (1 - ez(seg(s.tap, 0.78, 1))) : 0, dy = -14 * eo(up) * (s.tap >= 0 ? 0.3 : 1);
    p.ellipse(52, 93, 26 - 8 * up, 3, { fill: 'smoke', line: false, alpha: 0.6 });
    p.pivot(52, 92, 0, [1 + sq, 1 - sq], function () {
      p.move(0, dy);
      if (open > 0.01) {
        p.pivot(31, 42, -1.9 * open, 1, function () { p.path('M31 42 L52 50 L46 34 L24 27 Z', { fill: 'sand' }); });
        p.pivot(73, 48, 1.7 * open, 1, function () { p.path('M52 50 L73 48 L80 32 L58 34 Z', { fill: 'sand' }); });
      }
      p.path('M20 44 L52 52 L52 92 L20 84 Z', { fill: 'wood' });
      p.path('M52 52 L84 42 L84 82 L52 92 Z', { fill: 'sand' });
      if (open < 0.02) { p.path('M20 44 L52 34 L84 42 L52 52 Z', { fill: 'sand' }); p.line(36, 39, 68, 47, { ink: 'brown', w: 1.4, alpha: 0.6 }); }
      p.line(36, 48, 36, 88, { ink: 'brown', w: 1.4, alpha: 0.6 });
      p.rect(58, 60, 18, 12, { fill: 'white', w: 0.6, r: 1 });
      p.line(61, 64, 73, 64, { ink: 'navy', w: 0.4, detail: true }); p.line(61, 68, 70, 68, { ink: 'navy', w: 0.4, detail: true });
    });
  }
});

D.add('passport', {
  fam: 'work', tags: ['visa', 'travel', 'id', 'immigration', 'permit', 'border', 'identity', '🛂'], loop: 2.8, still: 0.1, burst: 'ring', burstAt: [42, 60], burstN: 6, burstSpread: 2.6, burstColor: 'red', burstDelay: 0.5, tapLen: 1.8, margin: [18, 52, 18, 52],
  about: 'the cover lifts a little, as if someone peeks inside, and falls shut', tapAbout: 'it opens wide and a red entry stamp comes down on the page',
  draw: function (p, t, s) {
    var peek = 0.22 * bump(seg(t, 0.3, 0.75)), open = s.tap >= 0 ? ez(seg(s.tap, 0.02, 0.28)) * (1 - ez(seg(s.tap, 0.82, 1))) : 0, k = Math.max(peek, open), sx = cos(PI * k);
    var stampU = s.tap >= 0 ? s.tap : -1;
    p.rect(30, 15, 44, 70, { fill: 'cream', r: 3 });
    for (var i = 0; i < 3; i++) p.line(70 + i, 18, 70 + i, 82, { ink: 'stone', w: 0.4, detail: true });
    if (k > 0.3) {
      p.rect(36, 24, 13, 16, { fill: 'sky', w: 0.6 }); p.circle(42.5, 30, 3.2, { fill: 'skin', w: 0.5 });
      p.line(53, 27, 68, 27, { ink: 'navy', w: 0.5 }); p.line(53, 33, 65, 33, { ink: 'navy', w: 0.5 });
      if (stampU > 0.5) { var m = M.spring(seg(stampU, 0.5, 0.62)); p.at(52, 62, -0.2, 0.6 + 0.4 * m, function () { p.rect(-14, -8, 28, 16, { ink: 'red', fill: false, r: 3, w: 1 }); p.line(-9, -2, 9, -2, { ink: 'red', w: 0.8 }); p.line(-9, 3, 5, 3, { ink: 'red', w: 0.8 }); }); }
    }
    p.pivot(30, 50, 0, [sx, 1], function () {
      p.rect(30, 14, 44, 72, { fill: sx < 0 ? 'cream' : 'navy', r: 4 });
      if (sx > 0) { p.circle(52, 42, 9, { ink: 'gold', fill: false, w: 1 }); p.circle(52, 42, 4, { fill: 'gold', line: false }); p.line(42, 62, 62, 62, { ink: 'gold', w: 0.8 }); p.line(45, 68, 59, 68, { ink: 'gold', w: 0.6 }); }
    });
  }
});

})(Dingbats);
