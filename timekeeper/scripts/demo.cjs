// One-command demo launcher: spawns all dev servers and opens the deck.
// Use this on stage during the presentation.
const { spawn } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PROJECT_ROOT = path.resolve(ROOT, '..');

const isWin = process.platform === 'win32';
const pnpm = isWin ? 'pnpm.cmd' : 'pnpm';
const node = process.execPath;

const procs = [
  { name: 'caregiver',     cmd: pnpm, args: ['--filter', '@timekeeper/caregiver', 'dev'], cwd: ROOT, color: '\x1b[36m' },
  { name: 'watch-sim',     cmd: pnpm, args: ['--filter', '@timekeeper/watch-simulator', 'dev'], cwd: ROOT, color: '\x1b[33m' },
  { name: 'presentation',  cmd: node, args: ['presentation/serve.js'], cwd: PROJECT_ROOT, color: '\x1b[35m' },
];

const children = procs.map((p) => {
  const c = spawn(p.cmd, p.args, { cwd: p.cwd, env: process.env, stdio: 'pipe', shell: false });
  const tag = `${p.color}[${p.name}]\x1b[0m`;
  c.stdout.on('data', (d) => process.stdout.write(`${tag} ${d}`));
  c.stderr.on('data', (d) => process.stderr.write(`${tag} ${d}`));
  c.on('exit', (code) => console.log(`${tag} exited (${code})`));
  return c;
});

console.log('\n→ caregiver:    http://localhost:5173');
console.log('→ watch-sim:    http://localhost:5174');
console.log('→ presentation: http://localhost:4000   (auto-opens)');
console.log('→ laptop:       run `pnpm dev:laptop` in another terminal\n');

process.on('SIGINT',  () => children.forEach(c => c.kill()));
process.on('SIGTERM', () => children.forEach(c => c.kill()));
