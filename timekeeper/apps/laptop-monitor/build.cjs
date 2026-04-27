// Bundle the Electron main + preload processes with esbuild.
// Why esbuild instead of tsc: workspace dependencies (@timekeeper/schema,
// @timekeeper/supabase-client) point at .ts source. tsc emits .js but
// preserves the import paths — at runtime Node tries to load the .ts
// source and crashes. esbuild inlines the imports into a single CJS
// bundle, so Electron only sees plain JS.

const esbuild = require('esbuild');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

fs.mkdirSync(DIST, { recursive: true });

const common = {
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  sourcemap: true,
  logLevel: 'info',
  // Keep Electron + all native deps external — they're loaded at runtime
  // from node_modules, not bundled.
  external: ['electron', 'active-win'],
};

async function build() {
  await esbuild.build({
    ...common,
    entryPoints: [path.join(SRC, 'main.ts')],
    outfile: path.join(DIST, 'main.js'),
  });
  await esbuild.build({
    ...common,
    entryPoints: [path.join(SRC, 'preload.ts')],
    outfile: path.join(DIST, 'preload.js'),
  });

  // Copy renderer HTML files so __dirname-relative loadFile works.
  copy(path.join('tray-popup', 'index.html'));
  copy(path.join('lockscreen', 'index.html'));
  console.log('build.cjs: ok');
}

function copy(rel) {
  const from = path.join(SRC, rel);
  const to = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

build().catch((err) => { console.error(err); process.exit(1); });
