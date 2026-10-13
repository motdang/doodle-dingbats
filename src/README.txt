DOODLE DINGBATS — HOW TO DRAW ONE

A dingbat is one call to Dingbats.add in a family file, src/fam/<family>.js. The file is an IIFE over Dingbats; M = Dingbats.math holds the numbers (TAU, ease, easeOut, easeIn, bump, spring, wave, seg, frac, lerp, clamp, rng, hash).

D.add('name', {
  fam: 'lanna',                 the family; the same as the file's name
  tags: ['words', 'people', 'search'],
  about: 'what it does while idle, one line',
  tapAbout: 'what a tap does, one line',
  loop: 2.4,                    seconds for one cycle of t
  still: 0.3,                   the t shown when motion is off, and before a hover starts
  ratio: 1,                     width ÷ height; dividers are 4–6
  tapLen: 1.2,                  seconds the tap reaction lasts
  tapRest: 0.5,                 the tap progress shown, without motion, to people who turn motion off
  burst: 'heart',               what a tap throws: spark heart star note drop leaf petal confetti bubble ember zzz ring, several with spaces, or false
  burstAt: [50, 40], burstN: 7, burstSpread: 2.6, burstDelay: 0.3 (the part of the tap before the burst), burstColor: 'gold' or ['a', 'b'], burstGravity: 90 (negative rises: bubbles, embers),
  margin: [top, right, bottom, left],  room outside the box in units (18 each side by default) for things that rise, swing or fly
  tapMargin: [top, right, bottom, left],  room during a tap (75 55 40 55 when there is a burst); set it for a tap that flies out without one
  draw: function (p, t, s) { … }
});

draw(p, t, s) is called for every frame. t runs 0 → 1 over the loop and wraps; s.tap is −1 when idle and 0 → 1 during a tap reaction; s.taps counts taps (toggles: s.taps % 2); s.calm is true when the reader has turned motion off; s.px is the drawn height in CSS pixels, and p.small is true below 30 px (leave out what would be noise). Use nothing else: no Date, no Math.random, no state kept between calls. Randomness comes from p.rng(n) or M.rng(seed), seeded, so the same frame always draws the same marks.

THE BOX: 100 high, 100 × ratio wide, y grows downward. The pen (p) records marks; the look (ink, paper, riso, neon, mono) turns them into pixels. Later marks cover earlier ones.

SHAPES (o = options, or a colour string to fill):
  p.path('M10 10 C… Z', o)          SVG path data, all commands; Z closes
  p.curve([[x,y], …], o)            a smooth line through hand-placed points; o.close for a loop
  p.line(x1, y1, x2, y2, o)
  p.poly([[x,y], …], o)             closed
  p.circle(x, y, r, o) · p.ellipse(x, y, rx, ry, o) (o.rot) · p.arc(x, y, r, a0, a1, o) (o.pie)
  p.rect(x, y, w, h, o) (o.r rounds the corners) · p.star(x, y, r1, r2, n, o) · p.dot(x, y, r, colour)
  p.blob(x, y, r, o)                an organic loop: clouds, bushes, puddles (o.lumpy, o.seed, o.sx, o.sy)
  p.draw(d, u, o)                   the first u (0..1) of a path: writing, a vine growing, a fuse
  p.span(d, u0, u1, o)              the part between u0 and u1: steam rising and leaving, a comet tail
  p.clip(shape, fn)                 what fn draws shows only inside shape (a function drawing closed shapes, or path data): a shine on a fill, the liquid in a glass

OPTIONS:
  fill    a colour under the line. With a fill the shape is outlined too, unless line: false
  line    false for colour without ink
  ink     the line's colour ('ink', the text colour, by default)
  w       line weight, 1 by default; 0.4 for interior detail, 1.2 for a bold contour
  alpha   0..1
  hatch   shading lines: an angle in radians, true, or 'x' for cross-hatching
  dash    [on, off] in units · dashOff slides the dashes along (a road moving past)
  glow    0..1, a soft light around the mark (flames, lamps, a lit window)
  detail  true: left out below 30 px, where it would only be noise
  wob     wobble, 1 by default; 0.3 for a steadier mark, 0 for none
  cap     'taper' (open lines thin at both ends, the default) or 'round'
  over    false stops a closed outline running past its start (the hand-drawn overlap)
  holes   true: inner loops of the shape are holes in the fill (a chain link, a donut, a ring)

COLOURS: 'ink' (the text colour) · 'bg' (the page behind, for knocking out lines) · 'a' 'b' 'c' (accents the page can change: gold, coral, teal) · 'skin' (changeable) · and the palette: red orange flame yellow gold leaf green mint sky blue navy sea plum lilac pink rose cream white black brown wood sand grey stone smoke night. Any CSS colour works too, but the looks map palette names best.

TRANSFORMS: p.at(x, y, angle, scale, fn) draws fn with its origin at (x, y). p.pivot(px, py, angle, scale, fn) turns and scales what fn draws in box coordinates about (px, py). scale is a number or [sx, sy]. p.push / p.pop / p.move / p.turn / p.size / p.skew are the parts. Line weight stays the pen's: a smaller thing drawn with p.at keeps the same line, as a hand would.

THE CRAFT (anidoodle's craft bar, cut to glyph size):
  - Draw the thing from its anatomy, not from ellipses: hand-place the control points, look at a reference of the real object first.
  - Something moves every second. A loop closes: t = 1 looks like t = 0 (drive motion with M.wave(t, n) where n is a whole number, or with windows of t that end where they began).
  - One side leads. Two arms, two wisps, two wings: offset them by a few hundredths of t, never half a cycle, never in lockstep.
  - Marks are MADE: a line appears by being drawn (p.draw, p.span), it does not fade in. Things leave by moving, shrinking or being taken back, not by fading.
  - Weight and contact: a thing that lands squashes; a thing that hangs swings after what holds it (lag); a thing that is struck overshoots (M.spring).
  - The tap does something particular to the thing, and cute: an envelope opens, a lantern sails away, a cat's tail puffs. A generic bounce is the floor, not the aim.
  - It reads at 16 px. Mark fine interior lines detail: true. Test the sheet's small sizes.
  - Hands: five fingers where they show, knuckles bend one way. Faces: eyes, lids, mouth line.

TOOLS:
  node tools/check.mjs --fam <family>                 the gate: throws, NaN, loop seam, dead air, margins, speed
  node tools/sheet.mjs --fam <family> --out out/x.png contact sheet: 8 frames, 4 tap frames, then 16/24/40 px
  node tools/sheet.mjs --names a,b --look all         every look
  node tools/build.mjs                                 core + every family → dingbats.js
