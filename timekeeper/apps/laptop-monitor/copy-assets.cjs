// Copy renderer HTML/CSS into dist/ so __dirname-relative loadFile works
// after electron-builder packages the app.
const fs = require('node:fs');
const path = require('node:path');

const SRC = path.join(__dirname, 'src');
const DIST = path.join(__dirname, 'dist');

function copy(rel) {
  const from = path.join(SRC, rel);
  const to = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  console.log(`copied ${rel}`);
}

copy(path.join('tray-popup', 'index.html'));
copy(path.join('lockscreen', 'index.html'));
