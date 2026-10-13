DOODLE DINGBATS

Hand-drawn glyphs that move, sit in a line of text at the size of the words around them, and do something particular when tapped. Nan's ask, 2026-10-12.

USE ON A PAGE
  <script src="dingbats.min.js"></script>
  <doodle-dingbat name="lantern"></doodle-dingbat>      or      <i data-dingbat="lantern"></i>
  look: ink, paper, riso, neon, mono · play: loop, hover, once, still · size: any CSS length (1em by default) · a, b, c, skin: colours · label: words for a screen reader

FILES
  gallery.html        the specimen: every glyph, its looks, sizes, tap, and code to copy
  dingbats.js         the whole set in one file (dingbats.min.js is the same, smaller)
  src/core.js         the pen, the five looks, the page runtime, SVG output
  src/fam/*.js        one file per family
  src/README.txt      how to draw a new one
  tools/              build, check (the gate), sheet (contact sheets), export (APNG, WebP, GIF, SVG, LINE sizes), shot (screenshots)

COMMANDS
  node tools/build.mjs
  node tools/check.mjs
  node tools/sheet.mjs --fam lanna --out out/sheet-lanna.png
  node tools/export.mjs lantern,heart --tap
  node tools/export.mjs --fam kitchen --line --tap
