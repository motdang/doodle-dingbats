/* Classic: the printer's dingbats (Zapf's ❤ ✂ ✉ ☞ ✎ ★ ❦ …), drawn by hand and set moving. */
(function (D) {
'use strict';
var M = D.math, TAU = M.TAU;

/* ❤ a heart beating lub-dub; tap: one big beat and a spray of small hearts */
D.add('heart', {
  fam: 'classic', tags: ['love', 'like', 'favourite', 'save', 'valentine', '❤'], loop: 1.2, still: 0.6, burst: 'heart', burstAt: [50, 30], tapLen: 1.1,
  about: 'beats lub-dub, the left lobe a beat ahead', tapAbout: 'one big beat and a spray of hearts',
  draw: function (p, t, s) {
    var lub = M.bump(M.seg(t, 0.0, 0.14)), dub = M.bump(M.seg(t, 0.2, 0.34)), big = s.tap >= 0 ? M.bump(M.seg(s.tap, 0, 0.5)) * 0.28 : 0;
    var sx = 1 + lub * 0.09 + dub * 0.05 + big, sy = 1 + lub * 0.06 + dub * 0.04 + big * 0.85, tilt = -0.05 * lub + 0.035 * dub;
    p.pivot(50, 52, tilt, [sx, sy], function () {
      p.path('M50 86 C35 73 14 59 14 38 C14 24 24 15 36 15 C44 15 49 21 50 28 C51 21 57 15 65 15 C76 15 86 24 86 38 C86 59 65 73 50 86 Z', { fill: 'b' });
      p.path('M23 37 C23 29 28 23 35 22', { ink: 'white', w: 0.7, detail: true });
    });
    /* throb lines: drawn out from the heart on the lub, gone by the dub */
    var u = M.seg(t, 0.02, 0.2);
    if (u > 0 && u < 1) {
      var a = M.easeOut(u), b = M.seg(u, 0.45, 1);
      p.span('M8 30 C4 38 4 46 8 54', b, a, { w: 0.7 });
      p.span('M92 30 C96 38 96 46 92 54', b, a, { w: 0.7 });
    }
  }
});

/* small things several of these share: a four-point sparkle, and a twinkle drawn from two crossed strokes */
var SPARK = 'M0 -10 C1.2 -3.5 3.5 -1.2 10 0 C3.5 1.2 1.2 3.5 0 10 C-1.2 3.5 -3.5 1.2 -10 0 C-3.5 -1.2 -1.2 -3.5 0 -10 Z';
function spark(p, x, y, r, rot, o) { p.at(x, y, rot || 0, r / 10, function () { p.path(SPARK, o); }); }
function glint(p, x, y, r, rot, o) { if (r < 0.8) return; o = o || { w: 0.8, cap: 'round' }; p.at(x, y, rot || 0, 1, function () { p.line(-r, 0, r, 0, o); p.line(0, -r, 0, r, o); }); }

/* ★ a star rocking and breathing, a glint twinkling at each shoulder in turn;
   tap: it streaks off as a shooting star and a new one pops into its place */
D.add('star', {
  fam: 'classic', tags: ['favourite', 'rating', 'win', 'night', 'wish', 'magic', '★'], loop: 2.4, still: 0.15, tapLen: 1.7, tapRest: 0.9, burst: false, margin: [34, 50, 14, 14],
  about: 'rocks and breathes while a glint twinkles at each shoulder', tapAbout: 'streaks off as a shooting star; a new one pops into its place',
  draw: function (p, t, s) {
    var tp = s.tap, rock = 0.07 * M.wave(t, 1), breathe = 1 + 0.05 * M.wave(t, 2);
    function star(x, y, k, rot) {
      p.at(x, y, rot, k, function () {
        p.star(0, 0, 45, 20, 5, { fill: 'yellow' });
        p.path('M-17 -9 C-13 -15 -9 -18 -5 -20', { ink: 'white', w: 0.8, detail: true });
      });
    }
    if (tp < 0) {
      star(50, 54, breathe, rock);
      glint(p, 87, 15, 8 * M.bump(M.seg(M.frac(t), 0, 0.4)), 0);
      glint(p, 13, 24, 7 * M.bump(M.seg(M.frac(t + 0.5), 0, 0.4)), 0);
      return;
    }
    var u = M.seg(tp, 0, 0.5), e = M.easeIn(u), x = 50 + 100 * e, y = 54 - 74 * e;
    if (u < 1) {
      star(x, y, (1 - 0.6 * e) * breathe, rock + TAU * 1.5 * e);
      /* three streaks behind it along the line of flight, the tail catching up as it goes */
      var L = 62 * M.easeOut(M.seg(u, 0, 0.3)) * (1 - M.seg(tp, 0.4, 0.5)), dx = 0.804, dy = -0.595;
      [[-8, 0.6], [0, 1], [8, 0.45]].forEach(function (q) {
        var hx = x - dx * 14 * (1 - e) + dy * q[0], hy = y - dy * 14 * (1 - e) - dx * q[0];
        p.line(hx - dx * L * q[1], hy - dy * L * q[1], hx, hy, { w: 0.8 });
      });
    }
    var k = M.spring(M.seg(tp, 0.42, 0.9));
    if (k > 0.03) star(50, 54, k * breathe, rock - 0.9 * (1 - Math.min(k, 1)));
  }
});

/* ✦ three four-point sparkles twinkling out of phase, the big one leading;
   tap: each flares and turns a quarter in turn, and ticks fly out of the big one */
D.add('sparkle', {
  fam: 'classic', tags: ['magic', 'new', 'shine', 'clean', 'glitter', 'ai', '✦', '✨'], loop: 2.1, still: 0.3, tapLen: 1.2, tapRest: 0.9, burst: false,
  about: 'three sparkles twinkle out of phase, the big one leading', tapAbout: 'each flares and turns a quarter in turn; ticks fly out',
  draw: function (p, t, s) {
    var tp = s.tap;
    [[40, 58, 34, 0, 'yellow'], [75, 25, 19, 0.34, 'white'], [78, 77, 13, 0.67, 'yellow']].forEach(function (c, i) {
      var w = 0.5 + 0.5 * M.wave(t, 1, c[3]), k = 0.55 + 0.45 * w * w, d = i * 0.12;
      var pop = tp >= 0 ? M.bump(M.seg(tp, d, d + 0.55)) : 0, turn = tp >= 0 ? M.easeOut(M.seg(tp, d, d + 0.6)) * TAU / 4 : 0;
      spark(p, c[0], c[1], c[2] * (k + 0.5 * pop), 0.2 * M.wave(t, 1, c[3] + 0.25) + turn, { fill: c[4] });
    });
    if (tp >= 0) {
      var u = M.seg(tp, 0.08, 0.8);
      for (var j = 0; j < 8; j++) {
        var a = j * TAU / 8 + 0.4, head = 41 + 15 * M.easeOut(u), tail = 41 + 15 * M.easeIn(u);
        if (head - tail > 0.8) p.line(40 + Math.cos(a) * tail, 58 + Math.sin(a) * tail, 40 + Math.cos(a) * head, 58 + Math.sin(a) * head, { w: 0.8, cap: 'round' });
      }
    }
  }
});

/* ✓ a tick drawn in one stroke, held, taken back from its tail;
   tap: wiped, then redrawn bold with a looped start and a flare at the tip */
var TICK = 'M16 56 C25 63 33 73 39 87 C50 58 68 30 89 12', FLOURISH = 'M24 40 C12 44 12 60 25 59 C33 58 37 72 41 88 C53 56 70 26 93 8';
D.add('check', {
  fam: 'classic', tags: ['done', 'yes', 'ok', 'correct', 'tick', 'complete', '✓', '✔'], loop: 2.4, still: 0.42, tapLen: 1.3, tapRest: 0.85, burst: false, margin: [24, 24, 14, 14],
  about: 'draws itself in one stroke, holds, then is taken back from its tail', tapAbout: 'wiped, then redrawn bold with a looped start and a flare at the tip',
  draw: function (p, t, s) {
    var tp = s.tap;
    if (tp < 0) {
      p.span(TICK, M.easeIn(M.seg(t, 0.64, 0.9)), M.easeOut(M.seg(t, 0, 0.26)), { ink: 'green', w: 2.3 });
      var g = M.seg(t, 0.26, 0.5); if (g > 0 && g < 1) glint(p, 90, 11, 7 * M.bump(g), 0.5, { ink: 'green', w: 0.8, cap: 'round' });
      return;
    }
    p.span(TICK, M.easeIn(M.seg(tp, 0, 0.12)), 1, { ink: 'green', w: 2.3 });
    p.draw(FLOURISH, M.easeOut(M.seg(tp, 0.12, 0.62)), { ink: 'green', w: 3.4 });
    var f = M.seg(tp, 0.6, 1);
    for (var j = 0; j < 5; j++) {
      var a = -2.35 + j * 0.55, r0 = 9 + 14 * M.easeIn(f), r1 = 9 + 14 * M.easeOut(f) * 1.0;
      if (f > 0 && f < 1) p.line(93 + Math.cos(a) * Math.min(r0, r1), 8 + Math.sin(a) * Math.min(r0, r1), 93 + Math.cos(a) * r1, 8 + Math.sin(a) * r1, { ink: 'green', w: 0.9, cap: 'round' });
    }
  }
});

/* ✗ a ballot cross made in two strokes, the second crossing the first, shimmying, then wiped in order;
   tap: it is lifted and slammed down like a stamp */
D.add('cross', {
  fam: 'classic', tags: ['no', 'close', 'wrong', 'cancel', 'delete', 'x', '✗', '✘'], loop: 2.2, still: 0.45, tapLen: 1.2, tapRest: 0.6, burst: false, margin: [18, 24, 24, 24],
  about: 'two crossing strokes, a shimmy, then wiped in the order they were drawn', tapAbout: 'lifted, slammed down like a stamp, with dust at the corners',
  draw: function (p, t, s) {
    var tp = s.tap, a = 'M22 22 C36 40 56 62 78 84', b = 'M80 18 C62 38 42 62 24 82';
    var u1 = M.easeOut(M.seg(t, 0, 0.16)), u2 = M.easeOut(M.seg(t, 0.14, 0.3)), g1 = M.easeIn(M.seg(t, 0.72, 0.82)), g2 = M.easeIn(M.seg(t, 0.8, 0.92));
    var shim = 0.05 * M.wave(t, 3) * M.bump(M.seg(t, 0.3, 0.72)), lift = 0, sq = 0;
    if (tp >= 0) { u1 = u2 = 1; g1 = g2 = 0; shim = 0; lift = M.easeOut(M.seg(tp, 0, 0.22)) * (1 - M.easeIn(M.seg(tp, 0.22, 0.36))); sq = M.bump(M.seg(tp, 0.34, 0.62)); }
    p.pivot(50, 50, shim, [1 + 0.5 * lift + 0.12 * sq, 1 + 0.5 * lift - 0.14 * sq], function () {
      p.span(a, g1, u1, { ink: 'red', w: 2.6 }); p.span(b, g2, u2, { ink: 'red', w: 2.6 });
    });
    if (tp >= 0.34 && tp < 0.7) {
      var d = M.seg(tp, 0.34, 0.7);
      [[10, 12, -1, -1], [90, 12, 1, -1], [10, 90, -1, 1], [90, 90, 1, 1]].forEach(function (c) { p.line(c[0] + c[2] * 4 * d, c[1] + c[3] * 4 * d, c[0] + c[2] * (4 + 9 * M.easeOut(d)), c[1] + c[3] * (4 + 9 * M.easeOut(d)), { w: 0.8, cap: 'round' }); });
    }
  }
});

/* a six-armed asterisk of club-shaped arms about (x, y), scale k, turned by rot; arms take their colours in turn */
var ARM = 'M-2 -4 C-4 -16 -7 -30 -5.5 -40 C-4.5 -47 7.5 -46 7 -39 C6.5 -30 4.5 -16 2.5 -4 Z';
function asterisk(p, x, y, k, rot, cols, len) {
  for (var j = 0; j < 6; j++) p.at(x, y, rot + j * TAU / 6, [k, k * (len ? len(j) : 1)], function () {
    p.path(ARM, { fill: cols[j % cols.length] });
    if (k > 0.8) p.path('M0.5 -12 C0 -22 0 -32 1 -40', { w: 0.4, detail: true });
  });
  p.circle(x, y, 6 * k, { fill: 'white', w: 0.9 });
}
/* ✱ six club-armed spokes, alternate colours, turning like a pinwheel in pulses with a ripple of length going round;
   tap: it spins up a full turn and flares */
D.add('asterisk', {
  fam: 'classic', tags: ['star', 'note', 'footnote', 'required', 'wildcard', 'pinwheel', '✱', '*'], loop: 3.2, still: 0.1, tapLen: 1.5, burst: 'spark', burstAt: [50, 50], burstN: 6, burstSpread: 6,
  about: 'turns like a pinwheel in pulses, a ripple of length going round the arms', tapAbout: 'spins up one full turn and flares',
  draw: function (p, t, s) {
    var tp = s.tap, extra = tp >= 0 ? TAU * M.easeOut(tp) : 0, flare = tp >= 0 ? 0.3 * M.bump(M.seg(tp, 0, 0.6)) : 0;
    asterisk(p, 50, 50, 1, TAU * t + 0.14 * M.wave(t, 6) + extra, ['b', 'a'], function (j) { return 1 + 0.09 * M.wave(t, 3, -j / 6) + flare; });
  }
});

/* ✿ a five-petal blossom, each petal swaying a beat after the one before, the bloom nodding;
   tap: it squeezes, blooms wide, turns a fifth, and petals drift off */
D.add('flower', {
  fam: 'classic', tags: ['bloom', 'spring', 'garden', 'blossom', 'cherry', 'nature', '✿', '❀'], loop: 3, still: 0.3, tapLen: 1.6, burst: 'petal', burstAt: [50, 50], burstN: 6, burstSpread: 6.28,
  about: 'petals sway one after another as the bloom nods', tapAbout: 'squeezes, blooms wide, turns a fifth; petals drift away',
  draw: function (p, t, s) {
    var tp = s.tap, k = 1 + 0.04 * M.wave(t, 2), turn = 0;
    if (tp >= 0) { k *= 1 - 0.16 * M.bump(M.seg(tp, 0, 0.2)) + 0.22 * M.bump(M.seg(tp, 0.2, 0.7)); turn = M.spring(M.seg(tp, 0.1, 0.8)) * TAU / 5; }
    p.at(50, 50, 0.06 * M.wave(t, 1) + turn, k, function () {
      p.move(-50, -50);
      for (var i = 0; i < 5; i++) {
        p.at(50, 50, i * TAU / 5 + 0.09 * M.wave(t, 1, -i / 5), [1, 1 + 0.05 * M.wave(t, 2, -i / 5)], function () {
          p.path('M0 -5 C-16 -10 -18 -36 -4 -42 C-2 -40 2 -40 4 -42 C18 -36 16 -10 0 -5 Z', { fill: 'pink' });
          p.path('M0 -12 C-1 -20 -1 -28 0 -34', { ink: 'rose', w: 0.5, detail: true });
        });
      }
      p.circle(50, 50, 8, { fill: 'yellow' });
      [[47, 49], [53, 47], [51, 54]].forEach(function (c) { p.dot(c[0], c[1], 1.1, 'brown'); });
    });
  }
});

/* ☀ a sun, twelve rays turning slowly with a pulse going round them;
   tap: the rays flare and the sun slides on a pair of sunglasses, then takes them off */
D.add('sun', {
  fam: 'classic', tags: ['weather', 'day', 'summer', 'bright', 'light', 'sunny', '☀', '☼'], loop: 6, still: 0.1, tapLen: 2, burst: false, margin: [22, 22, 20, 22],
  about: 'twelve rays turn slowly, a pulse of length going round them', tapAbout: 'rays flare; a pair of sunglasses drops on, then lifts away',
  draw: function (p, t, s) {
    var tp = s.tap, flare = tp >= 0 ? M.bump(M.seg(tp, 0, 0.45)) : 0, rot = TAU * t;
    for (var k = 0; k < 12; k++) {
      var br = 1 + 0.09 * M.wave(t, 3, -k / 12) + 0.28 * flare;
      p.at(50, 50, rot + k * TAU / 12, 1, function () {
        if (k % 2 === 0) p.path('M-6.5 -23 L0 ' + (-(24 + 19 * br)).toFixed(1) + ' L6.5 -23 Z', { fill: 'yellow', w: 0.9 });
        else p.line(0, -27, 0, -(27 + 8 * br), { w: 1.3, cap: 'round' });
      });
    }
    p.circle(50, 50, 20, { fill: 'a' });
    p.arc(50, 50, 13, -2.7, -1.7, { w: 0.6, ink: 'white', detail: true });
    if (tp >= 0) {
      var drop = -62 * (1 - M.spring(M.seg(tp, 0.05, 0.3))) - 70 * M.easeIn(M.seg(tp, 0.78, 1));
      p.at(50, 50 + drop, 0, 1, function () {
        p.move(-50, -50);
        p.path('M31 47 L69 47', { w: 1.1 });
        p.path('M33 46 C32 56 39 60 44 59 C49 58 50 52 49 47 Z', { fill: 'black', w: 0.8 });
        p.path('M67 46 C68 56 61 60 56 59 C51 58 50 52 51 47 Z', { fill: 'black', w: 0.8 });
        p.line(36, 50, 40, 47.5, { ink: 'white', w: 0.6, cap: 'round' }); p.line(59, 50, 63, 47.5, { ink: 'white', w: 0.6, cap: 'round' });
        p.path('M43 66 C47 69 54 69 58 65', { w: 0.8, detail: true });
      });
    }
  }
});

/* ♪ an eighth note hopping on a shadow, the flag trailing it, squashing as it lands;
   tap: a high spinning leap and a spray of notes */
D.add('note', {
  fam: 'classic', tags: ['music', 'song', 'sound', 'audio', 'play', 'tune', '♪', '♩'], loop: 1, still: 0.3, tapLen: 1.3, burst: 'note', burstAt: [48, 40], burstN: 8, burstSpread: 3.4, margin: [40, 18, 14, 18],
  about: 'hops on its shadow, the flag trailing, squashing on landing', tapAbout: 'a high spinning leap and a spray of notes',
  draw: function (p, t, s) {
    var tp = s.tap, ua = M.seg(t, 0, 0.62), h = 18 * 4 * ua * (1 - ua), v = ua > 0 && ua < 1 ? 4 * (1 - 2 * ua) : 0;
    var sq = 0.9 * M.bump(M.seg(t, 0.62, 0.86)) + 0.5 * M.bump(M.seg(t, 0.88, 1)), st = h / 18, spin = 0;
    if (tp >= 0) { var ut = M.seg(tp, 0, 0.7); h += 34 * 4 * ut * (1 - ut); sq += 1.1 * M.bump(M.seg(tp, 0.7, 0.95)); st += 0.6 * M.bump(ut); spin = TAU * M.ease(ut); v += ut > 0 && ut < 1 ? 4 * (1 - 2 * ut) : 0; }
    p.ellipse(46, 95, 16 * (1 - 0.3 * Math.min(1, h / 40)), 3.2, { fill: 'smoke', line: false, alpha: 0.8 });
    p.push(); p.move(0, -h);
    p.pivot(50, 90, 0, [1 + 0.16 * sq - 0.04 * st, 1 - 0.2 * sq + 0.08 * st], function () {
      p.pivot(46, 55, spin, 1, function () {
        p.ellipse(36, 76, 13, 9.5, { fill: 'ink', rot: -0.4 });
        p.line(47, 73, 47, 16, { w: 1.5 });
        p.pivot(47, 16, 0.1 * v, 1, function () { p.path('M47 16 C50 36 74 38 70 62 C66 50 56 48 47 44 Z', { fill: 'ink' }); });
      });
    });
    p.pop();
  }
});

/* ☞ the printer's pointing hand: a laced cuff, the back of the hand, three curled fingers, a thumb, and the one finger out.
   It nudges right twice a loop, the finger leading and the hand a beat behind; tap: it draws back and jabs */
D.add('manicule', {
  fam: 'classic', tags: ['point', 'this', 'look', 'next', 'see', 'hand', 'index', '☞', '👉'], loop: 1.6, ratio: 1.3, still: 0.1, tapLen: 1.1, tapRest: 0.42, burst: false, margin: [18, 26, 18, 14],
  about: 'nudges right twice a loop, the finger leading and the hand a beat behind', tapAbout: 'draws back, then jabs forward with a flurry of poke lines',
  draw: function (p, t, s) {
    function kick(q) { q = M.frac(q); return M.easeOut(M.seg(q, 0, 0.22)) * (1 - M.ease(M.seg(q, 0.22, 0.7))); }
    var ph = M.frac(t * 2), tp = s.tap, dx = 6 * kick(ph - 0.07), ext = 4 * kick(ph), j = 0, r = 0;
    if (tp >= 0) {
      var a = M.easeOut(M.seg(tp, 0, 0.2)); j = M.easeIn(M.seg(tp, 0.2, 0.33)); r = M.ease(M.seg(tp, 0.33, 0.8));
      dx += -9 * a * (1 - j) + 12 * j * (1 - r); ext += 5 * j * (1 - r);
    }
    p.push(); p.move(dx, 0);
    p.pivot(46, 36, -0.28, 1, function () { p.rect(44, 26, 27, 11.5, { fill: 'skin', r: 5.7 }); });
    p.path('M24 33 C34 30 45 31 56 35 L58 78 C46 83 34 82 24 78 Z', { fill: 'skin' });
    p.rect(52, 69, 19, 10.5, { fill: 'skin', r: 5.2 }); p.rect(52, 58.5, 23, 11, { fill: 'skin', r: 5.5 }); p.rect(52, 47.5, 27, 11.5, { fill: 'skin', r: 5.7 });
    p.rect(54, 35, 68 + ext, 12, { fill: 'skin', r: 6 });
    p.path('M' + (112 + ext) + ' 38 C' + (117 + ext) + ' 37.5 ' + (119 + ext) + ' 39.5 ' + (119 + ext) + ' 41.5', { w: 0.5, detail: true });
    p.path('M78 36 L78 38 M96 36 L96 38', { w: 0.45, detail: true });
    p.path('M5 30 L26 27 L26 83 L5 80 Z', { fill: 'white' });
    p.path('M20 27.8 L26 27 L26 83 L20 82.2 Z', { fill: 'b', w: 0.6 });
    p.path('M10.5 29.4 L10.5 80.6 M15.5 28.7 L15.5 81.3', { w: 0.45, detail: true });
    p.pop();
    if (tp >= 0.33 && tp < 0.75) {
      var d = M.seg(tp, 0.33, 0.75), tx = 126 + dx + ext;
      [-0.8, 0, 0.8].forEach(function (an) { p.line(tx + Math.cos(an) * (3 + 6 * d), 41 + Math.sin(an) * (3 + 6 * d), tx + Math.cos(an) * (3 + 6 * d + 9 * (1 - d)), 41 + Math.sin(an) * (3 + 6 * d + 9 * (1 - d)), { w: 0.9, cap: 'round' }); });
    }
  }
});

/* ✂ scissors snipping along a dashed cut line, the dashes marching into the blades;
   tap: one hard snip and the cut piece of line drops away, then the line grows back */
D.add('scissors', {
  fam: 'classic', tags: ['cut', 'snip', 'coupon', 'trim', 'edit', 'clip', 'crop', '✂'], loop: 1.4, ratio: 1.4, still: 0.08, tapLen: 1.5, tapRest: 0.9, burst: false, margin: [18, 18, 46, 18],
  about: 'snips twice a loop while the dashed line marches into the blades', tapAbout: 'one hard snip; the cut piece of line falls away and the line grows back',
  draw: function (p, t, s) {
    var ph = M.frac(t * 2), tp = s.tap, th = 0.04 + 0.4 * M.ease(M.seg(ph, 0, 0.5)) * (1 - M.easeIn(M.seg(ph, 0.55, 0.8)));
    function dashes(x0, x1) { for (var i = -1; i < 4; i++) { var xs = 98 + i * 14 - 14 * ph, a = Math.max(xs, x0), b = Math.min(xs + 8, x1); if (b - a > 0.8) p.line(a, 50, b, 50, { w: 1, cap: 'round' }); } }
    function half(sg) {
      p.pivot(34, 50, sg * th, [1, sg], function () {
        p.path('M26 44 C46 45.5 76 48.4 95 50 C76 51.8 46 54.5 26 56 Z', { fill: 'stone' });
        p.path('M31 47.6 C48 48.6 70 49.6 86 50', { ink: 'white', w: 0.5, detail: true });
        p.rect(21, 46, 11, 6, { fill: 'b' });
        p.ellipse(12, 46, 11, 7, { fill: 'b' }); p.ellipse(12, 46, 5.4, 3.4, { fill: 'bg', w: 0.8 });
      });
    }
    var cut = tp >= 0.24, fall = M.easeIn(M.seg(tp, 0.24, 0.72)), clipR = tp < 0 || tp < 0.24 ? 136 : 96 + 40 * M.easeOut(M.seg(tp, 0.55, 0.92));
    if (tp >= 0) { var o = M.ease(M.seg(tp, 0, 0.16)) * (1 - M.easeIn(M.seg(tp, 0.16, 0.26))); th = M.lerp(0.04 + 0.55 * o, th, M.ease(M.seg(tp, 0.7, 1))); }
    dashes(96, clipR);
    if (cut && fall < 1) { p.push(); p.move(0, 80 * fall); p.pivot(116, 50, 1.1 * fall, 1, function () { dashes(96, 136); }); p.pop(); }
    var c = M.seg(ph, 0.62, 1);
    if (tp < 0 && c > 0 && c < 1) p.at(98 + 5 * c, 50 + 24 * M.easeIn(c), 4 * c, 1 - c, function () { p.line(-3, 0, 3, 0, { w: 1, cap: 'round' }); });
    half(1); half(-1);
    p.circle(34, 50, 3.2, { fill: 'grey', w: 0.8 });
  }
});

/* ✎ a pencil writes a looping squiggle, flips over, and rubs it out with the eraser, then flips back;
   tap: it is sharpened: it shudders and curls of wood fall from the point */
function squig(u) { var f = TAU * 3 * u + Math.PI; return [6 + 40 * u - 6 * Math.sin(f), 76 - 8 * Math.cos(f)]; }
var SQUIG = []; for (var i = 0; i <= 90; i++) SQUIG.push(squig(i / 90));
D.add('pencil', {
  fam: 'classic', tags: ['write', 'edit', 'draw', 'note', 'pen', 'compose', '✎', '✏'], loop: 4, still: 0.43, tapLen: 1.3, tapRest: 0.55, burst: false, margin: [20, 24, 24, 12],
  about: 'writes a looping squiggle, flips, rubs it out with the eraser, flips back', tapAbout: 'sharpened: it shudders and curls of wood fall from the point',
  draw: function (p, t, s) {
    var tp = s.tap, w = M.ease(M.seg(t, 0, 0.5)), e = M.ease(M.seg(t, 0.62, 0.9)), m = M.ease(M.seg(t, 0.5, 0.6)) + M.ease(M.seg(t, 0.9, 1)), lift = 12 * M.bump(M.seg(t, 0.5, 0.6)) + 12 * M.bump(M.seg(t, 0.9, 1));
    var u = w * (1 - e), writing = (t < 0.5 || (t > 0.62 && t < 0.9)) ? 1 : 0, P = squig(u), rub = t > 0.62 && t < 0.9 ? 2.2 * M.wave(t, 14) : 0;
    P = [P[0] + rub, P[1]];
    p.span(SQUIG, 0, u, { w: 1.3 });
    var b = Math.pow(Math.sin(Math.PI * m / 2), 2), th = -0.785 + Math.PI * m + 0.03 * M.wave(t, 12) * writing, cx = P[0] + 26.9 - 2.2 * b, cy = P[1] - 26.9 + 2.2 * b - lift;
    if (tp >= 0) th += 0.06 * M.wave(tp, 9) * M.bump(M.seg(tp, 0, 0.7));
    p.at(cx, cy, th, 1, function () {
      p.rect(24, -6.5, 11, 13, { fill: 'pink', r: 3.5 });
      p.rect(18, -6.5, 7, 13, { fill: 'grey', w: 0.9 }); p.path('M20.2 -6.5 L20.2 6.5 M22.8 -6.5 L22.8 6.5', { w: 0.35, detail: true });
      p.rect(-18, -6.5, 36, 13, { fill: 'yellow' });
      p.path('M-17 -2 L17 -2 M-17 3 L17 3', { w: 0.4, detail: true });
      p.path('M-18 -6.5 L-33 -1.6 L-33 1.6 L-18 6.5 Z', { fill: 'sand' });
      p.path('M-33 -1.6 L-39 0 L-33 1.6 Z', { fill: 'black', w: 0.7 });
    });
    if (tp >= 0) {
      var tx = cx - 39 * Math.cos(th), ty = cy - 39 * Math.sin(th);
      for (var k = 0; k < 3; k++) {
        var q = M.seg(tp, 0.04 + k * 0.14, 0.64 + k * 0.14), fall = M.easeIn(M.seg(q, 0.3, 1));
        if (q > 0 && q < 1) p.at(tx + 3 + k * 5, ty + 2 + 38 * fall, 0.5 * k + 2.4 * fall, 1.5 - 1.0 * M.seg(q, 0.7, 1), function () { p.draw('M0 0 C5 -6 13 -3 10 3 C8 8 2 6 5 2', M.easeOut(M.seg(q, 0, 0.35)), { w: 0.8, ink: 'brown' }); });
      }
    }
  }
});

/* ✒ a fountain pen writes a swash, rests, then reels the ink back in as it retraces the line;
   tap: the pen lifts, a drop swells on the nib, falls, and splats into a blot that dries */
function swash(u) { var f = TAU * 2 * u + Math.PI; return [9 + 40 * u - 7 * Math.sin(f), 86 - 6 * Math.cos(f)]; }
var SWASH = []; for (var j = 0; j <= 70; j++) SWASH.push(swash(j / 70));
D.add('nib', {
  fam: 'classic', tags: ['write', 'sign', 'ink', 'author', 'blog', 'pen', 'calligraphy', '✒'], loop: 3.6, still: 0.45, tapLen: 1.9, tapRest: 0.6, burst: false, margin: [18, 20, 14, 14],
  about: 'writes a swash, rests, then reels the ink back as the pen retraces the line', tapAbout: 'the pen lifts, a drop swells and falls, and a blot splats and dries',
  draw: function (p, t, s) {
    var tp = s.tap, u = M.ease(M.seg(t, 0, 0.55)) * (1 - M.ease(M.seg(t, 0.66, 0.92))), lift = 6 * M.bump(M.seg(t, 0.55, 0.66)), writing = t < 0.55 || (t > 0.66 && t < 0.92) ? 1 : 0, T = swash(u);
    if (tp >= 0) lift += 14 * M.ease(M.seg(tp, 0, 0.15)) * (1 - M.ease(M.seg(tp, 0.72, 0.95)));
    p.span(SWASH, 0, u, { w: 1.5 });
    p.at(T[0], T[1] - lift, -1 + 0.03 * M.wave(t, 12) * writing, 1, function () {
      p.rect(48, -7.5, 36, 15, { fill: 'c', r: 5 });
      p.line(54, -3.5, 78, -3.5, { ink: 'white', w: 0.5, detail: true });
      p.rect(44, -7.8, 4.5, 15.6, { fill: 'a', w: 0.8 });
      p.path('M26 -7 L44 -6 L44 6 L26 7 Z', { fill: 'navy' });
      p.path('M0 0 C5 -2 14 -6 26 -7.5 L26 7.5 C14 6 5 2 0 0 Z', { fill: 'a' });
      p.path('M1 0 L13 0', { w: 0.45, detail: true }); p.dot(14, 0, 1.7, 'ink');
    });
    if (tp >= 0) {
      var by = 93, y0 = T[1] - lift, swell = M.easeOut(M.seg(tp, 0.05, 0.2)), fall = M.easeIn(M.seg(tp, 0.2, 0.44)), splat = M.spring(M.seg(tp, 0.44, 0.62)) * (1 - M.easeIn(M.seg(tp, 0.82, 1)));
      if (tp < 0.44) p.at(T[0], y0 + 2 + (by - y0 - 4) * fall, 0, 0.5 + 0.5 * swell, function () { p.path('M0 -5 C4 -1 4.4 3.2 0 4.6 C-4.4 3.2 -4 -1 0 -5 Z', { fill: 'ink' }); });
      if (splat > 0.02) {
        p.blob(T[0], by - 1, 9 * splat, { fill: 'ink', sy: 0.5, lumpy: 0.2, seed: 5 });
        [[-1, -0.7], [1, -0.9], [-0.4, -1.2], [0.5, -1.1]].forEach(function (q, i) { var d = M.seg(tp, 0.44, 0.7); p.dot(T[0] + q[0] * 13 * M.easeOut(d), by + q[1] * 12 * M.bump(d) - 1, 1.5 * splat, 'ink'); });
      }
    }
  }
});

/* ✉ an envelope hopping, the flap lifting a hair each time it lands;
   tap: the flap opens and a letter with a heart slides up, then it slides back and the flap closes */
D.add('envelope', {
  fam: 'classic', tags: ['mail', 'email', 'letter', 'message', 'post', 'contact', 'inbox', '✉', '📧'], loop: 1.6, still: 0.2, tapLen: 2.2, tapRest: 0.45, burst: false, margin: [30, 14, 14, 14],
  about: 'hops twice, the flap lifting a hair when it lands', tapAbout: 'the flap opens and a letter with a heart slides up, then tucks back in',
  draw: function (p, t, s) {
    var tp = s.tap, idle = tp < 0 ? 1 : Math.max(1 - M.ease(M.seg(tp, 0, 0.12)), M.ease(M.seg(tp, 0.88, 1)));
    var ua = M.seg(t, 0, 0.45), ub = M.seg(t, 0.6, 0.88), hop = idle * (11 * 4 * ua * (1 - ua) + 4 * 4 * ub * (1 - ub)), sq = idle * (M.bump(M.seg(t, 0.45, 0.62)) + 0.5 * M.bump(M.seg(t, 0.88, 1)));
    var open = idle * 0.12 * M.bump(M.seg(t, 0.45, 0.7)), lift = 0, tilt = idle * 0.06 * M.wave(t, 1);
    if (tp >= 0) { open += M.ease(M.seg(tp, 0.04, 0.22)) * (1 - M.ease(M.seg(tp, 0.78, 0.95))); lift = M.easeOut(M.seg(tp, 0.16, 0.5)) * (1 - M.easeIn(M.seg(tp, 0.62, 0.8))); }
    var ap = 34 + 32 * Math.cos(Math.PI * Math.min(1, open));
    p.push(); p.move(0, -hop);
    p.pivot(50, 88, tilt, [1 + 0.1 * sq, 1 - 0.12 * sq], function () {
      p.rect(8, 32, 84, 56, { fill: 'cream' });
      if (open > 0.5) p.poly([[8, 32], [92, 32], [50, ap]], { fill: 'sand' });
      if (lift > 0.005) {
        var top = 46 - 54 * lift;
        p.pivot(50, top + 25, 0.07 * lift * M.wave(tp, 2), 1, function () {
          p.rect(20, top, 60, 50, { fill: 'white', w: 0.9 });
          p.path('M50 ' + (top + 26) + ' C38 ' + (top + 17) + ' 40 ' + (top + 7) + ' 50 ' + (top + 12) + ' C60 ' + (top + 7) + ' 62 ' + (top + 17) + ' 50 ' + (top + 26) + ' Z', { fill: 'b', w: 0.8 });
          p.path('M28 ' + (top + 34) + ' L72 ' + (top + 34) + ' M28 ' + (top + 40) + ' L62 ' + (top + 40), { w: 0.4, detail: true });
        });
      }
      p.poly([[8, 34], [50, 66], [92, 34], [92, 88], [8, 88]], { fill: 'cream' });
      p.path('M8 88 L38 57 M92 88 L62 57', { w: 0.5, detail: true });
      if (open <= 0.5) {
        p.poly([[8, 32], [92, 32], [50, ap]], { fill: 'cream' });
        p.at(50, ap - 8, 0, 1, function () { p.path('M0 5 C-8 -1 -6 -8 0 -4 C6 -8 8 -1 0 5 Z', { fill: 'b', w: 0.7, detail: true }); });
      }
    });
    p.pop();
  }
});

/* ☎ a rotary telephone ringing in two bursts, shaking on its base, the handset rattling a beat behind, sound arcs drawn out and taken back;
   tap: the handset lifts off and talk-lines come out of it, then it is hung back up with a bounce */
D.add('telephone', {
  fam: 'classic', tags: ['call', 'phone', 'contact', 'ring', 'support', 'dial', 'voice', '☎', '☏'], loop: 1.6, still: 0.1, tapLen: 1.8, tapRest: 0.45, burst: false, margin: [26, 24, 14, 24],
  about: 'rings in two bursts: the base shakes, the handset rattles, sound arcs come and go', tapAbout: 'answers: the handset lifts off with talk-lines, then is hung back up with a bounce',
  draw: function (p, t, s) {
    var tp = s.tap, w = M.frac(t * 2), env = tp < 0 ? M.bump(M.seg(w, 0, 0.75)) : 0, shake = env * M.wave(t, 12), rat = -2.4 * Math.max(0, M.wave(t, 12, 0.18)) * env, h = 0;
    if (tp >= 0) { h = M.easeOut(M.seg(tp, 0, 0.2)) * (1 - M.easeIn(M.seg(tp, 0.78, 0.92))); rat -= 2.5 * M.bump(M.seg(tp, 0.92, 1)); }
    p.pivot(50, 90, 0.035 * shake, 1, function () {
      p.move(0.8 * shake, 0);
      var ca = 0.3 * h, bx = 50 + 38 * Math.cos(ca) - 8 * Math.sin(ca), by = 40 + 38 * Math.sin(ca) + 8 * Math.cos(ca) + rat - 26 * h, cord = [];
      for (var ci = 0; ci <= 26; ci++) { var cu = ci / 26; cord.push([M.lerp(86, bx, cu) + 12 * Math.sin(Math.PI * cu) * (1 - h) + 2.2 * Math.sin(TAU * 9 * cu), M.lerp(72, by, cu) + 6 * Math.sin(Math.PI * cu) * (1 - h)]); }
      p.curve(cord, { w: 0.7 });
      p.path('M12 90 C12 80 14 64 22 56 C34 62 66 62 78 56 C86 64 88 80 88 90 Z', { fill: 'red' });
      p.circle(50, 76, 13.5, { fill: 'cream' }); p.circle(50, 76, 3.2, { w: 0.5, detail: true });
      for (var k = 0; k < 9; k++) { var a = 0.7 + k * 0.62; p.dot(50 + 8.4 * Math.cos(a), 76 + 8.4 * Math.sin(a), 1.25, 'ink'); }
      p.rect(24, 44, 6, 14, { fill: 'black', w: 0.8 }); p.rect(70, 44, 6, 14, { fill: 'black', w: 0.8 });
      p.pivot(50, 40, 0.3 * h, 1, function () {
        p.move(0, rat - 26 * h);
        p.path('M10 48 C6 36 18 28 32 33 L68 33 C82 28 94 36 90 48 C88 52 80 52 78 47 C76 43 70 43 66 42 L34 42 C30 43 24 43 22 47 C20 52 12 52 10 48 Z', { fill: 'red' });
        p.path('M20 33 C24 31 28 31 32 33', { ink: 'white', w: 0.6, detail: true });
      });
    });
    if (tp < 0) {
      [[0, 0], [0.06, 1]].forEach(function (sd) {
        ['M12 26 C4 32 4 46 12 52', 'M6 20 C-4 28 -4 50 6 58'].forEach(function (d, k) {
          var v = M.seg(w - sd[0], 0, 0.75), u1 = M.easeOut(M.seg(v, k * 0.14, 0.45 + k * 0.14)), u0 = M.easeIn(M.seg(v, 0.5 + k * 0.14, 1));
          if (sd[1]) d = d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, function (m, x, y) { return (100 - x) + ' ' + y; });
          p.span(d, u0, u1, { w: 0.8 });
        });
      });
    } else if (h > 0.05) {
      for (var q = 0; q < 3; q++) {
        var v = M.frac(tp * 2.4 + q / 3), r = 10 + 14 * v, lead = 2.5 + 1.3 * M.easeIn(v) * 0.5; p.arc(14, 33 - 26 * h, r, lead + 0.4 * M.easeIn(v), 3.8 + 0.2 * v, { w: 0.8 });
      }
    }
  }
});

/* ✈ a plane flies a lazy figure eight, banking through the turns, a contrail looping behind it;
   tap: a fast victory lap of the same path with two barrel rolls */
D.add('airplane', {
  fam: 'classic', tags: ['travel', 'flight', 'fly', 'trip', 'send', 'airport', 'holiday', '✈'], loop: 2.8, still: 0, tapLen: 1.4, tapRest: 0.9, burst: false,
  about: 'flies a lazy figure eight, banking through the turns, a contrail looping behind', tapAbout: 'a fast victory lap of the path with two barrel rolls',
  draw: function (p, t, s) {
    var tp = s.tap;
    function lap(q) { return q <= 0 ? 0 : M.ease(Math.min(q, 1)); }
    function pos(tt) { var a = TAU * tt; return [50 + 24 * Math.sin(a), 52 - 17 * Math.sin(2 * a)]; }
    var tt = t + lap(tp), e = 0.012, a = pos(tt - e), b = pos(tt), c = pos(tt + e);
    var h1 = Math.atan2(b[1] - a[1], b[0] - a[0]), h2 = Math.atan2(c[1] - b[1], c[0] - b[0]), bank = M.clamp(Math.atan2(Math.sin(h2 - h1), Math.cos(h2 - h1)) * 5, -1, 1);
    var ws = Math.cos(0.9 * Math.abs(bank)) * (tp >= 0 ? Math.cos(TAU * 2 * M.seg(tp, 0.05, 0.9)) : 1);
    ws = (ws < 0 ? -1 : 1) * Math.max(0.24, Math.abs(ws));
    var trail = []; for (var k = 3; k < 32; k++) trail.push(pos(t - k * 0.011 + lap(tp - k * 0.022)));
    p.curve(trail, { w: 0.7, wob: 0.4 });
    p.at(b[0], b[1], h1 + (h2 - h1) / 2, 1.15, function () {
      p.at(0, 0, 0, [1, ws], function () {
        p.path('M8 -3 L-6 -28 L-13 -28 L-7 -3 Z', { fill: 'sky' }); p.path('M8 3 L-6 28 L-13 28 L-7 3 Z', { fill: 'sky' });
        p.path('M-17 -2 L-24 -11 L-28 -11 L-24 -2 Z', { fill: 'sky', w: 0.8 }); p.path('M-17 2 L-24 11 L-28 11 L-24 2 Z', { fill: 'sky', w: 0.8 });
      });
      p.path('M24 0 C18 -3.8 -8 -4.2 -22 -1.8 L-26 0 L-22 1.8 C-8 4.2 18 3.8 24 0 Z', { fill: 'white' });
      p.path('M13 -1.3 C16 -1.3 19 -0.6 20.5 0 C19 0.6 16 1.3 13 1.3 Z', { fill: 'navy', w: 0.5, detail: true });
    });
  }
});

/* ❄ a six-armed snowflake turning once per loop, the spine growing out, then branches, then the tips, then taken back in reverse, each arm a beat behind the last;
   tap: it grows full, spins up a third of a turn more, and ice glints fly off */
D.add('snowflake', {
  fam: 'classic', tags: ['winter', 'cold', 'snow', 'frost', 'ice', 'christmas', 'freeze', '❄', '❅'], loop: 6, still: 0.45, tapLen: 1.6, tapRest: 0.6, burst: false, margin: [14, 14, 14, 14],
  about: 'turns once a loop while the spines, branches and tips grow out and are taken back in', tapAbout: 'grows full, spins up another third of a turn; ice glints fly off',
  draw: function (p, t, s) {
    var tp = s.tap, rot = TAU * t + (tp >= 0 ? TAU / 3 * M.easeOut(tp) : 0), mx = tp >= 0 ? M.ease(M.seg(tp, 0, 0.25)) * (1 - M.ease(M.seg(tp, 0.75, 1))) : 0, pulse = tp >= 0 ? 0.1 * M.bump(M.seg(tp, 0.1, 0.6)) : 0;
    for (var k = 0; k < 6; k++) {
      var q = M.frac(t - k * 0.012);
      var grow = function (a, b, c, d) { return M.lerp(M.ease(M.seg(q, a, b)) * (1 - M.ease(M.seg(q, c, d))), 1, mx) + pulse; };
      var g0 = M.lerp(0.35 + 0.65 * M.ease(M.seg(q, 0, 0.2)) * (1 - M.ease(M.seg(q, 0.85, 1))), 1, mx) + pulse, g1 = grow(0.12, 0.35, 0.8, 0.92), g2 = grow(0.28, 0.5, 0.74, 0.86), g3 = grow(0.42, 0.6, 0.68, 0.8);
      p.at(50, 50, rot + k * TAU / 6, 1, function () {
        var T = -4 - 38 * g0, y1 = -4 - 38 * g0 * 0.42, y2 = -4 - 38 * g0 * 0.72, l1 = 13 * g1 * 0.72, l2 = 10 * g2 * 0.72, l3 = 5 * g3;
        p.line(0, -4, 0, T, { ink: 'blue', w: 1.3 });
        p.path('M' + (-l1) + ' ' + (y1 - l1) + ' L0 ' + y1 + ' L' + l1 + ' ' + (y1 - l1), { ink: 'blue' });
        p.path('M' + (-l2) + ' ' + (y2 - l2) + ' L0 ' + y2 + ' L' + l2 + ' ' + (y2 - l2), { ink: 'blue' });
        p.path('M' + (-l3) + ' ' + (T + 8 - l3) + ' L0 ' + (T + 8) + ' L' + l3 + ' ' + (T + 8 - l3), { ink: 'blue', w: 0.9 });
      });
    }
    p.poly([[50, 42], [57, 46], [57, 54], [50, 58], [43, 54], [43, 46]], { fill: 'sky', ink: 'blue', w: 0.9 });
    if (tp >= 0) for (var j = 0; j < 6; j++) { var u = M.seg(tp, 0.1, 0.9), a = j * TAU / 6 + 0.52, r = 40 + 12 * M.easeOut(u); glint(p, 50 + Math.cos(a) * r, 50 + Math.sin(a) * r, 5 * M.bump(u), 0.4, { ink: 'blue', w: 0.8, cap: 'round' }); }
  }
});

/* ☂ an umbrella with rain drumming on the canopy, each drop splashing where it lands, the canopy bobbing;
   tap: it snaps shut, then pops open, shaking drops off */
D.add('umbrella', {
  fam: 'classic', tags: ['rain', 'weather', 'wet', 'cover', 'insurance', 'protect', 'shelter', '☂', '☔'], loop: 1.2, still: 0.3, tapLen: 1.6, tapRest: 0.95, burst: 'drop', burstAt: [50, 30], burstN: 8, burstSpread: 3.6,
  about: 'rain drums on the canopy and splashes off it; the canopy bobs', tapAbout: 'snaps shut, then pops open and shakes the water off',
  draw: function (p, t, s) {
    var tp = s.tap, w = tp < 0 ? 1 : tp < 0.45 ? 1 - 0.78 * M.easeIn(M.seg(tp, 0, 0.2)) : 0.22 + 0.78 * M.spring(M.seg(tp, 0.45, 0.85)), tall = 1 + 0.1 * (1 - w);
    p.line(50, 22, 50, 88, { w: 1.4 }); p.path('M50 86 C50 98 36 98 36 88', { w: 1.6 });
    p.pivot(50, 58, 0.03 * M.wave(t, 2), [w, tall], function () {
      for (var j = 0; j < 4; j++) {
        var x0 = 8 + j * 21, x1 = x0 + 21, xm = (x0 + x1) / 2;
        p.path('M50 22 C' + (50 + (x0 - 50) * 0.55) + ' 22 ' + x0 + ' 36 ' + x0 + ' 58 Q' + xm + ' 50 ' + x1 + ' 58 C' + x1 + ' 36 ' + (50 + (x1 - 50) * 0.55) + ' 22 50 22 Z', { fill: j % 2 ? 'cream' : 'b' });
      }
      p.line(50, 22, 50, 15, { w: 1.4, cap: 'round' });
    });
    [[6, 0], [19, 0.37], [31, 0.12], [44, 0.62], [57, 0.25], [69, 0.75], [82, 0.5], [95, 0.87]].forEach(function (d) {
      var ph = M.frac(2 * t + d[1]), dx = (d[0] - 50) / (42 * w), land = Math.abs(dx) < 1 ? 58 - 36 * tall * Math.sqrt(1 - dx * dx) : 108, f = M.seg(ph, 0, 0.8), y = -16 + (land + 16) * f * f;
      if (f < 1) p.line(d[0] - 1.5, y - 8, d[0], y, { ink: 'blue', w: 0.8 });
      else if (land < 100) { var sp = M.seg(ph, 0.8, 1); [-2.3, -0.8].forEach(function (a) { p.line(d[0] + Math.cos(a) * (2 + 5 * sp), land + Math.sin(a) * (2 + 5 * sp), d[0] + Math.cos(a) * (2 + 5 * sp + 4 * (1 - sp)), land + Math.sin(a) * (2 + 5 * sp + 4 * (1 - sp)), { ink: 'blue', w: 0.7, cap: 'round' }); }); }
    });
  }
});

/* ➜ a swoosh of an arrow: a ribbon with a wave running down it into the head, which wags with the wave;
   tap: it shoots off to the right, shrinking into the distance, and comes back from the left */
D.add('arrow', {
  fam: 'classic', tags: ['next', 'go', 'forward', 'right', 'continue', 'direction', 'more', '➜', '→'], loop: 1.4, ratio: 1.4, still: 0.2, tapLen: 1.2, tapRest: 0.95, burst: false, margin: [18, 18, 18, 18],
  about: 'a wave runs down the ribbon into the head, which wags with it', tapAbout: 'shoots off to the right, shrinking, and comes back in from the left',
  draw: function (p, t, s) {
    var tp = s.tap, off = 0, k = 1;
    if (tp >= 0) { if (tp < 0.4) { var e = M.easeIn(M.seg(tp, 0, 0.4)); off = 190 * e; k = 1 - 0.75 * e; } else { var r = M.easeOut(M.seg(tp, 0.4, 0.95)); off = -190 * (1 - r); k = 0.25 + 0.75 * r; } }
    function cy(x) { return 50 + 8 * (1 - (x - 6) / 108) * Math.sin(TAU * (x / 50 - t)); }
    var up = [], dn = [], xe = 104, i, x, y, d, n;
    for (i = 0; i <= 28; i++) {
      x = 6 + (xe - 6) * i / 28; y = cy(x); d = Math.atan2(cy(x + 0.5) - cy(x - 0.5), 1); n = [-Math.sin(d), Math.cos(d)];
      var hw = 1.6 + 5 * i / 28; up.push([x + n[0] * hw, y + n[1] * hw]); dn.push([x - n[0] * hw, y - n[1] * hw]);
    }
    var E = [xe, cy(xe)], psi = Math.atan2(cy(xe + 0.5) - cy(xe - 0.5), 1), dv = [Math.cos(psi), Math.sin(psi)], nv = [-dv[1], dv[0]];
    var head = [[E[0] - nv[0] * 6.6 + dv[0] * 2, E[1] - nv[1] * 6.6 + dv[1] * 2], [E[0] - nv[0] * 16, E[1] - nv[1] * 16], [E[0] + dv[0] * 27, E[1] + dv[1] * 27], [E[0] + nv[0] * 16, E[1] + nv[1] * 16], [E[0] + nv[0] * 6.6 + dv[0] * 2, E[1] + nv[1] * 6.6 + dv[1] * 2]];
    p.pivot(125, 50, 0, k, function () {
      p.move(off, 0);
      p.poly(up.concat(head, dn.slice().reverse()), { fill: 'b' });
      if (tp >= 0 && tp < 0.4) for (var q = 0; q < 3; q++) p.line(-34 - q * 8, 36 + q * 14, -4 - q * 4, 36 + q * 14, { w: 0.8 });
    });
  }
});

/* ❧ the ivy-leaf fleuron: a heart-shaped leaf on a tendril that coils and uncoils (the curl is a curvature, so it unwinds the way a fern does),
   the leaf swaying a beat ahead of the curl; tap: the tendril whips straight and snaps back tighter, a bud leaf pops, leaves fly */
function ivy(p, fill) {
  p.path('M0 0 C-8 -14 -4 -32 12 -30 C28 -28 40 -14 52 0 C40 14 28 28 12 30 C-4 32 -8 14 0 0 Z', { fill: fill || 'leaf' });
  p.path('M0 0 L46 0 M14 0 L26 -12 M14 0 L26 12 M30 0 L38 -7 M30 0 L38 7', { w: 0.45, detail: true });
}
D.add('hedera', {
  fam: 'classic', tags: ['leaf', 'ivy', 'divider', 'ornament', 'garden', 'end', 'nature', '❧', '☙'], loop: 4, ratio: 1.2, still: 0.3, tapLen: 1.5, burst: 'leaf', burstAt: [92, 44], burstN: 5, burstSpread: 3, margin: [14, 22, 14, 14],
  about: 'the tendril coils and uncoils like a fern while the leaf sways a beat ahead', tapAbout: 'the tendril whips straight and snaps back tighter; a bud leaf pops; leaves fly',
  draw: function (p, t, s) {
    var tp = s.tap, c = 0.75 + 0.25 * M.wave(t, 1, 0.25), sway = 0.05 * M.wave(t, 1, 0), bud = 0.3;
    if (tp >= 0) { c = c * (1 - M.bump(M.seg(tp, 0, 0.45))) + 0.3 * M.bump(M.seg(tp, 0.45, 1)); sway += 0.1 * M.wave(tp, 4) * M.bump(tp); bud *= 1 + 0.6 * M.bump(M.seg(tp, 0.1, 0.7)); }
    var x = 64, y = 52, a = Math.PI, n = 40, pts = [[x, y]], ang = [a];
    for (var i = 1; i <= n; i++) { var u = i / n; a += c * 0.22 * u * u * 2.3; x += Math.cos(a) * 2.3; y += Math.sin(a) * 2.3; pts.push([x, y]); ang.push(a); }
    p.pivot(64, 52, sway, 1, function () {
      p.curve(pts, { w: 1.5 });
      p.at(pts[14][0], pts[14][1], ang[14] - 1.0, bud, function () { ivy(p); });
      p.at(64, 52, 0, 0.62, function () { ivy(p); });
    });
  }
});

/* ⁂ three asterisks in a triangle, orbiting the middle and each turning on its own, one colour apiece;
   tap: they fly out wide, spin a full turn about the middle and fall back in */
D.add('asterism', {
  fam: 'classic', tags: ['section', 'break', 'divider', 'stars', 'three', 'footnote', 'group', '⁂'], loop: 4, still: 0, tapLen: 1.4, tapRest: 0.95, burst: false,
  about: 'three asterisks orbit the middle, each turning on its own', tapAbout: 'they fly out wide, swing a full turn round the middle and fall back in',
  draw: function (p, t, s) {
    var tp = s.tap, R = 25 + (tp >= 0 ? 14 * M.bump(M.seg(tp, 0, 0.75)) : 0), orb = TAU * t + (tp >= 0 ? TAU * M.easeOut(tp) : 0);
    ['a', 'b', 'c'].forEach(function (c, k) {
      var an = -Math.PI / 2 + orb + k * TAU / 3;
      asterisk(p, 50 + R * Math.cos(an), 55 + R * Math.sin(an), 0.42 * (1 + 0.1 * M.wave(t, 3, k / 3)), -2 * TAU * t + k * 0.5 + (tp >= 0 ? TAU * M.easeOut(tp) : 0), [c]);
    });
  }
});

/* ¶ the pilcrow inked: the bowl and two stems drawn, the bowl scribbled in, held, then taken back stroke by stroke;
   tap: the bowl floods solid from the stem outward and two drips run off the bottom */
var PIL_BOWL = 'M64 14 L38 14 C22 14 12 24 12 36 C12 48 22 58 38 58 L46 58', ZIG = [];
for (var zi = 0; zi < 17; zi++) { var zy = 17 + zi * 2.3, zl = 38 - 26 * Math.sqrt(Math.max(0, 1 - Math.pow((zy - 36) / 22, 2))) + 2; ZIG.push([zi % 2 ? 44 : zl, zy]); }
D.add('pilcrow', {
  fam: 'classic', tags: ['paragraph', 'text', 'write', 'edit', 'section', 'type', 'format', '¶'], loop: 3.2, still: 0.7, tapLen: 1.4, tapRest: 0.5, burst: false, margin: [14, 18, 22, 18],
  about: 'the bowl and stems are drawn, the bowl scribbled in, then taken back stroke by stroke', tapAbout: 'the bowl floods solid from the stem outward; two drips run off the bottom',
  draw: function (p, t, s) {
    function st(a, b) { return M.ease(M.seg(t, a, b)); }
    p.span(PIL_BOWL, st(0.9, 0.98), st(0, 0.12), { w: 1.8 });
    p.span('M46 14 L46 88', st(0.86, 0.94), st(0.1, 0.2), { w: 1.8 });
    p.span('M64 14 L64 88', st(0.82, 0.9), st(0.18, 0.28), { w: 1.8 });
    p.span(ZIG, st(0.76, 0.86), st(0.26, 0.6), { w: 1 });
    var tp = s.tap;
    if (tp >= 0) {
      var f = M.spring(M.seg(tp, 0, 0.3)) * (1 - M.ease(M.seg(tp, 0.72, 1)));
      if (f > 0.02) p.pivot(46, 36, 0, [f, 1], function () { p.path('M46 14 L38 14 C22 14 12 24 12 36 C12 48 22 58 38 58 L46 58 Z', { fill: 'ink', w: 1.6 }); });
      [[30, 0], [20, 0.12]].forEach(function (d) {
        var q = M.seg(tp, 0.2 + d[1], 0.75 + d[1]);
        if (q > 0 && q < 1) p.at(d[0], 60 + 32 * M.easeIn(q), 0, (0.5 + 0.5 * M.easeOut(M.seg(q, 0, 0.25))) * (1 - 0.8 * M.seg(q, 0.85, 1)), function () { p.path('M0 -5 C4 -1 4.4 3.2 0 4.6 C-4.4 3.2 -4 -1 0 -5 Z', { fill: 'ink' }); });
      });
    }
  }
});

/* ‽ the interrobang, a ? hook and a ! bar drawn together; the hook is taken back to leave !, redrawn, then the bar is taken back to leave ?,
   the dot hopping at each change; tap: a double-take shake with shock lines and a high dot hop */
var HOOK = 'M25 30 C23 6 77 4 75 28 C74 42 56 44 50 52 L50 64', BAR = 'M50 6 L50 64';
D.add('interrobang', {
  fam: 'classic', tags: ['what', 'surprise', 'question', 'really', 'huh', 'wow', 'punctuation', '‽', '?!'], loop: 3.2, still: 0.62, tapLen: 1.3, tapRest: 0.6, burst: false, margin: [20, 22, 14, 22],
  about: 'the hook is taken back to leave !, redrawn, then the bar is taken back to leave ?; the dot hops at each change', tapAbout: 'a double-take shake with shock lines and a high hop of the dot',
  draw: function (p, t, s) {
    function st(a, b) { return M.ease(M.seg(t, a, b)); }
    var tp = s.tap, pop = M.bump(M.seg(t, 0.28, 0.42)) + M.bump(M.seg(t, 0.55, 0.68)) + M.bump(M.seg(t, 0.8, 0.94)) + M.bump(M.seg(t, 0.94, 1.0)) * 0.5, rot = 0.04 * M.wave(t, 2), k = 1;
    if (tp >= 0) { rot += 0.2 * Math.exp(-4 * tp) * Math.sin(TAU * 3 * tp); k += 0.12 * M.bump(M.seg(tp, 0, 0.3)); pop += 2.2 * M.bump(M.seg(tp, 0.1, 0.5)); }
    p.pivot(50, 60, rot, k, function () {
      if (t < 0.45) p.span(HOOK, st(0.18, 0.3), 1, { w: 2.2 }); else p.span(HOOK, 0, st(0.45, 0.57), { w: 2.2 });
      if (t < 0.9) p.span(BAR, st(0.7, 0.82), 1, { w: 2.2 }); else p.span(BAR, 0, st(0.92, 1), { w: 2.2 });
      p.dot(50, 84 - 6 * pop, 4.8, 'ink');
    });
    if (tp >= 0) {
      var u = M.seg(tp, 0.05, 0.7);
      [-2.9, -2.4, -1.9, -1.24, -0.74, -0.24].forEach(function (a) {
        var r0 = 38 + 12 * M.easeIn(u), r1 = 38 + 12 * M.easeOut(u);
        if (r1 - r0 > 0.8) p.line(50 + Math.cos(a) * r0, 40 + Math.sin(a) * r0, 50 + Math.cos(a) * r1, 40 + Math.sin(a) * r1, { w: 0.9, cap: 'round' });
      });
    }
  }
});

/* ⚓ an anchor on its rope swinging from above, the rope bending behind the swing and the anchor a hair late;
   tap: it is let go, plunges, splashes into rings and is hauled back up */
D.add('anchor', {
  fam: 'classic', tags: ['sea', 'ship', 'boat', 'hold', 'stay', 'harbour', 'sailor', 'port', '⚓'], loop: 2.8, still: 0.1, tapLen: 2, tapRest: 0.95, burst: false, margin: [42, 22, 34, 22],
  about: 'swings on its rope, the rope bending behind and the anchor a hair late', tapAbout: 'dropped: it plunges, rings spread out where it hits, and it is hauled back up',
  draw: function (p, t, s) {
    var tp = s.tap, d = 0;
    if (tp >= 0) d = 30 * M.easeIn(M.seg(tp, 0, 0.28)) * (1 - M.ease(M.seg(tp, 0.6, 0.98))) - 5 * M.bump(M.seg(tp, 0.28, 0.46));
    p.pivot(50, -18, 0.2 * M.wave(t, 1), 1, function () {
      p.path('M50 -18 Q' + (50 - 7 * M.wave(t, 1, 0.25)) + ' ' + (-4 + d / 2) + ' 50 ' + (7 + d), { w: 1.2 });
      p.pivot(50, 12 + d, 0.07 * M.wave(t, 1, 0.3), 1, function () {
        p.move(0, d);
        p.circle(50, 13, 5.5, { w: 1.3 });
        p.line(35, 26, 65, 26, { w: 2, cap: 'round' }); p.dot(35, 26, 2.6, 'ink'); p.dot(65, 26, 2.6, 'ink');
        p.line(50, 19, 50, 86, { w: 2 });
        p.path('M17 60 C19 80 34 90 50 90 C66 90 81 80 83 60', { w: 2 });
        p.path('M9 66 L17 51 L25 67 Z', { fill: 'ink', w: 0.8 }); p.path('M91 66 L83 51 L75 67 Z', { fill: 'ink', w: 0.8 });
      });
    });
    if (tp >= 0.2 && tp < 0.8) {
      var u = M.seg(tp, 0.2, 0.8);
      [0, 0.25].forEach(function (o) {
        var v = M.seg(u, o, 0.75 + o), rx = 6 + 30 * M.easeOut(v), ry = rx * 0.3;
        p.span('M' + (50 - rx) + ' 104 A' + rx + ' ' + ry + ' 0 1 1 ' + (50 + rx) + ' 104 A' + rx + ' ' + ry + ' 0 1 1 ' + (50 - rx) + ' 104', M.easeIn(M.seg(v, 0.45, 1)), M.easeOut(M.seg(v, 0, 0.5)), { w: 0.8 });
      });
    }
  }
});

/* ♛ a crown with pearl-tipped points and three jewels, a glint going from point to point;
   tap: it tips jaunty to one side with a hop, three sparkles pop, and it settles back */
D.add('crown', {
  fam: 'classic', tags: ['king', 'queen', 'royal', 'best', 'premium', 'winner', 'vip', 'leader', '♛', '♔'], loop: 2.4, still: 0.3, tapLen: 1.5, tapRest: 0.5, burst: false, margin: [20, 20, 14, 20],
  about: 'a glint travels from point to point and the jewels catch it', tapAbout: 'tips jaunty with a hop, three sparkles pop, then it settles back',
  draw: function (p, t, s) {
    var tp = s.tap, tilt = 0, hop = 0;
    if (tp >= 0) { tilt = 0.26 * M.spring(M.seg(tp, 0, 0.35)) * (1 - M.ease(M.seg(tp, 0.72, 1))); hop = 7 * M.bump(M.seg(tp, 0, 0.25)); }
    p.pivot(20, 88, tilt, 1, function () {
      p.move(0, -hop);
      p.path('M16 86 L10 36 C16 42 26 52 32 58 C38 46 44 34 50 24 C56 34 62 46 68 58 C74 52 84 42 90 36 L84 86 Z', { fill: 'a' });
      p.path('M14 71 L86 71', { w: 0.9 });
      [[10, 32, 4.5, 'white'], [50, 20, 5.5, 'white'], [90, 32, 4.5, 'white'], [28, 79, 4.4, 'b'], [50, 79, 4.8, 'c'], [72, 79, 4.4, 'b']].forEach(function (j, i) {
        p.circle(j[0], j[1], j[2], { fill: j[3], w: 0.9 });
        if (i > 2) p.line(j[0] - 1.8, j[1] - 1.4, j[0] - 0.6, j[1] - 2.4, { ink: 'white', w: 0.4, detail: true, cap: 'round' });
      });
    });
    [[50, 6, 0], [3, 22, 0.33], [97, 22, 0.66]].forEach(function (g) { glint(p, g[0], g[1], 8 * M.bump(M.seg(M.frac(t - g[2]), 0, 0.3)), 0); });
    if (tp >= 0) [[18, 14], [82, 10], [50, 2]].forEach(function (g, i) { var u = M.seg(tp, 0.15 + i * 0.1, 0.7 + i * 0.1); spark(p, g[0], g[1], 8 * M.bump(u), TAU * 0.25 * u, { fill: 'yellow', w: 0.8 }); });
  }
});

/* ♠ a spade swaying on its foot with a shine drawn down its left lobe and taken back;
   tap: it flips like a card, the back showing mid-flip */
var SPADE = 'M50 8 C58 26 86 38 86 60 C86 74 74 80 64 76 C58 74 54 70 52 66 C53 77 56 85 64 91 L36 91 C44 85 47 77 48 66 C46 70 42 74 36 76 C26 80 14 74 14 60 C14 38 42 26 50 8 Z';
D.add('spade', {
  fam: 'classic', tags: ['cards', 'suit', 'game', 'poker', 'luck', 'play', 'casino', '♠', '♤'], loop: 2.2, still: 0.4, tapLen: 1.3, tapRest: 0.9, burst: false, margin: [20, 14, 14, 14],
  about: 'sways on its foot while a shine is drawn down the left lobe and taken back', tapAbout: 'flips like a card; the back shows mid-flip',
  draw: function (p, t, s) {
    var tp = s.tap, fl = tp >= 0 ? M.ease(M.seg(tp, 0, 0.7)) : 0, c = Math.cos(TAU * fl), hop = tp >= 0 ? 7 * M.bump(M.seg(tp, 0, 0.7)) : 0;
    c = c < 0 ? Math.min(c, -0.12) : Math.max(c, 0.12);
    p.push(); p.move(0, -hop);
    p.pivot(50, 91, 0.07 * M.wave(t, 1), [c, 1 + 0.03 * M.wave(t, 2)], function () {
      if (tp >= 0 && fl > 0.25 && fl < 0.75) {
        p.rect(17, 7, 66, 84, { fill: 'b', r: 7 }); p.rect(24, 14, 52, 70, { ink: 'white', w: 0.7, r: 3 });
        p.path('M24 34 L76 66 M24 52 L50 68 M24 70 L36 77 M76 34 L24 66 M76 52 L50 68 M76 70 L64 77 M50 14 L50 84', { ink: 'white', w: 0.4, detail: true });
      } else {
        p.path(SPADE, { fill: 'ink' });
        p.span('M22 56 C20 48 24 42 30 38', M.easeIn(M.seg(t, 0.55, 0.8)), M.easeOut(M.seg(t, 0.1, 0.45)), { ink: 'white', w: 0.8, detail: true });
      }
    });
    p.pop();
  }
});

/* ♣ a club whose three lobes pulse one after another round the ring;
   tap: the lobes spring apart like a trefoil opening, and close again */
D.add('club', {
  fam: 'classic', tags: ['cards', 'suit', 'game', 'poker', 'luck', 'clover', 'play', '♣', '♧'], loop: 1.8, still: 0.3, tapLen: 1.3, tapRest: 0.4, burst: false,
  about: 'the three lobes pulse one after another, round the ring', tapAbout: 'the lobes spring apart like a trefoil opening, then close',
  draw: function (p, t, s) {
    var tp = s.tap;
    p.path('M50 54 C50 72 46 84 38 91 L62 91 C54 84 50 72 50 54 Z', { fill: 'ink' });
    [[50, 30, 0], [27, 58, 0.33], [73, 58, 0.66]].forEach(function (c, i) {
      var pop = M.bump(M.seg(M.frac(t - c[2]), 0, 0.3)), out = tp >= 0 ? 10 * M.spring(M.seg(tp, i * 0.06, i * 0.06 + 0.4)) * (1 - M.ease(M.seg(tp, 0.55, 0.95))) : 0, dx = c[0] - 50, dy = c[1] - 52, d = Math.hypot(dx, dy), r = 19 * (1 + 0.12 * pop);
      var x = c[0] + dx / d * out, y = c[1] + dy / d * out;
      p.circle(x, y, r, { fill: 'ink' });
      p.arc(x, y, r - 5, -2.7, -1.9, { ink: 'white', w: 0.6, detail: true });
    });
    p.circle(50, 52, 11, { fill: 'ink', w: 0.8 });
  }
});

/* ♦ a cut diamond turning on its vertical axis, facets sliding across it, a glint at each corner in turn;
   tap: it spins up two quick turns and throws sparkles */
D.add('diamond', {
  fam: 'classic', tags: ['cards', 'suit', 'gem', 'jewel', 'gift', 'precious', 'rare', '♦', '♢'], loop: 3.2, still: 0.05, tapLen: 1.4, tapRest: 0.9, burst: false, margin: [18, 18, 14, 18],
  about: 'turns on its vertical axis, facets sliding across it, a glint at each corner in turn', tapAbout: 'spins up two quick turns and throws sparkles',
  draw: function (p, t, s) {
    var tp = s.tap, turn = TAU * t + (tp >= 0 ? TAU * 2 * M.easeOut(tp) : 0), c = Math.cos(turn);
    c = c < 0 ? Math.min(c, -0.2) : Math.max(c, 0.2);
    p.pivot(50, 50, 0, [c, 1], function () {
      p.poly([[50, 6], [84, 40], [50, 94], [16, 40]], { fill: 'b' });
      p.path('M16 40 L84 40 M34 40 L50 6 L66 40 M34 40 L50 94 L66 40', { w: 0.5, detail: true });
      p.path('M30 34 L40 24', { ink: 'white', w: 0.7, detail: true, cap: 'round' });
    });
    [[50, 2], [90, 40], [10, 40], [50, 98]].forEach(function (g, i) { glint(p, g[0], g[1], 7 * M.bump(M.seg(M.frac(t - i * 0.25), 0, 0.22)), 0); });
    if (tp >= 0) for (var j = 0; j < 6; j++) { var u = M.seg(tp, 0.1 + j * 0.05, 0.7 + j * 0.05); spark(p, 50 + Math.cos(j * 1.05) * (30 + 22 * M.easeOut(u)), 50 + Math.sin(j * 1.05) * (30 + 22 * M.easeOut(u)), 7 * M.bump(u), TAU * u / 4, { fill: 'yellow', w: 0.7 }); }
  }
});

/* ⚑ a flag on its pole, a wave running along the cloth from the pole to the swallowtail;
   tap: it drops down the pole and is run back up with a bounce at the top */
D.add('flag', {
  fam: 'classic', tags: ['mark', 'report', 'goal', 'country', 'finish', 'milestone', 'banner', '⚑', '⚐'], loop: 1.6, still: 0.2, tapLen: 1.6, tapRest: 0.95, burst: false, margin: [18, 18, 14, 14],
  about: 'a wave runs along the cloth from the pole to the swallowtail', tapAbout: 'drops down the pole, then is run back up with a bounce at the top',
  draw: function (p, t, s) {
    var tp = s.tap, h = tp < 0 ? 1 : tp < 0.2 ? 1 - M.easeIn(M.seg(tp, 0, 0.2)) : M.spring(M.seg(tp, 0.28, 0.85)), dy = (1 - h) * 40, top = [], bot = [], i, x, o;
    p.line(22, 6, 22, 94, { w: 1.8 }); p.circle(22, 6, 3.4, { fill: 'a', w: 0.9 }); p.ellipse(22, 94, 9, 2.6, { fill: 'smoke', line: false });
    for (i = 0; i <= 16; i++) { x = 22 + 62 * i / 16; o = 7 * (i / 16) * Math.sin(TAU * (i / 16 * 1.2 - t)); top.push([x, 14 + dy + o]); bot.push([x, 50 + dy + o]); }
    p.poly(top.concat([[72, 32 + dy + o]], bot.reverse()), { fill: 'b' });
    p.path('M30 26 C45 22 60 30 74 24', { ink: 'white', w: 0.5, detail: true });
  }
});

/* † a dagger hovering, a streak of light running up the blade to a glint at the tip;
   tap: it twirls once about its middle like a juggler's, and lands with a bounce */
D.add('dagger', {
  fam: 'classic', tags: ['obelus', 'footnote', 'blade', 'knife', 'sword', 'cut', 'death', '†', '🗡'], loop: 2.4, still: 0.3, tapLen: 1.3, tapRest: 0.9, burst: false, margin: [18, 24, 18, 24],
  about: 'hovers while a streak of light runs up the blade to a glint at the tip', tapAbout: 'twirls once about its middle and lands with a bounce',
  draw: function (p, t, s) {
    var tp = s.tap, spin = 0, hop = 0, sq = 0;
    if (tp >= 0) { var u = M.seg(tp, 0, 0.75); spin = TAU * M.ease(u); hop = 12 * M.bump(u); sq = M.bump(M.seg(tp, 0.75, 1)); }
    p.push(); p.move(0, 3 * M.wave(t, 1) - hop);
    p.pivot(50, 50, 0.05 * M.wave(t, 1, 0.25) + spin, [1 + 0.06 * sq, 1 - 0.06 * sq], function () {
      p.path('M50 4 C54 14 57 26 57 40 L57 62 L43 62 L43 40 C43 26 46 14 50 4 Z', { fill: 'stone' });
      p.path('M50 14 L50 58', { w: 0.4, detail: true });
      p.rect(24, 62, 52, 8, { fill: 'a', r: 3 }); p.rect(45, 70, 10, 16, { fill: 'brown', r: 2 });
      p.path('M45 75 L55 77 M45 80 L55 82', { w: 0.4, detail: true }); p.circle(50, 90, 5.5, { fill: 'a', w: 0.9 });
      var g = M.seg(t, 0.1, 0.55); if (g > 0 && g < 1) { var y = 58 - 50 * g; p.line(46.5, y + 4, 53.5, y - 3, { ink: 'white', w: 0.8, cap: 'round' }); }
    });
    p.pop();
    glint(p, 50, 4 + 3 * M.wave(t, 1), 8 * M.bump(M.seg(t, 0.5, 0.7)), 0);
  }
});

/* & an ampersand written in one looping stroke, held, and taken back from its tail;
   tap: it is set bold and italic, leaning into the slant with a spring, and straightens again */
var AMP = 'M76 84 C62 70 44 52 36 38 C28 24 36 8 50 8 C64 8 66 24 54 36 C44 46 24 54 24 70 C24 84 36 92 50 92 C66 92 78 78 80 62';
D.add('ampersand', {
  fam: 'classic', tags: ['and', 'type', 'letter', 'together', 'with', 'join', 'text', '&'], loop: 3, still: 0.55, tapLen: 1.3, tapRest: 0.45, burst: false, margin: [14, 22, 14, 22],
  about: 'written in one looping stroke, held, then taken back from its tail', tapAbout: 'set bold and italic: it leans into the slant with a spring and straightens',
  draw: function (p, t, s) {
    var tp = s.tap;
    if (tp < 0) { p.span(AMP, M.easeIn(M.seg(t, 0.74, 0.96)), M.easeOut(M.seg(t, 0, 0.5)), { w: 2 }); return; }
    var lean = M.spring(M.seg(tp, 0, 0.35)) * (1 - M.ease(M.seg(tp, 0.7, 1))), bold = M.bump(M.seg(tp, 0.05, 0.9));
    p.push(); p.move(50, 50); p.skew(-0.32 * lean, 0); p.move(-50, -50);
    p.draw(AMP, 1, { w: 2 + 1.2 * bold });
    p.pop();
  }
});
})(Dingbats);
