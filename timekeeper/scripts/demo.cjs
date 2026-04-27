// One-command demo launcher: opens three terminal windows, one per
// dev server, and the deck in the default browser.
//
// On Windows we use `cmd /c start` so each server runs in its own
// console — visible logs, no PATH/quoting headaches when spawning .cmd
// files like pnpm.cmd.
const { spawn } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PROJECT_ROOT = path.resolve(ROOT, '..');
const isWin = process.platform === 'win32';

const procs = [
  { title: 'caregiver',    cwd: ROOT,         cmd: 'pnpm --filter @timekeeper/caregiver dev' },
  { title: 'watch-sim',    cwd: ROOT,         cmd: 'pnpm --filter @timekeeper/watch-simulator dev' },
  { title: 'presentation', cwd: PROJECT_ROOT, cmd: 'node presentation/serve.js' },
];

for (const p of procs) {
  if (isWin) {
    // cmd /c start "<title>" cmd /k "cd /d <cwd> && <cmd>"
    spawn('cmd', ['/c', 'start', `"${p.title}"`, 'cmd', '/k',
                  `cd /d "${p.cwd}" && ${p.cmd}`],
          { detached: true, stdio: 'ignore', shell: false });
  } else {
    // macOS / Linux: just inherit stdio in this terminal
    spawn(p.cmd, { cwd: p.cwd, stdio: 'inherit', shell: true });
  }
  console.log(`→ ${p.title.padEnd(14)} ${p.cmd}`);
}

console.log('');
console.log('  caregiver:    http://localhost:5173');
console.log('  watch-sim:    http://localhost:5174');
console.log('  presentation: http://localhost:4000');
console.log('');
console.log('  Run `pnpm dev:laptop` in a 4th terminal for the Electron tray.');
console.log('');

// Open the deck in the default browser after a short delay so servers boot.
setTimeout(() => {
  const url = 'http://localhost:4000';
  if (isWin) spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' });
  else if (process.platform === 'darwin') spawn('open', [url], { detached: true });
  else spawn('xdg-open', [url], { detached: true });
}, 4000);
