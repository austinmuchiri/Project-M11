import { BrowserWindow, screen } from 'electron';

let overlay: BrowserWindow | null = null;

export function isAppBlockVisible(): boolean {
  return !!overlay && !overlay.isDestroyed() && overlay.isVisible();
}

export function showAppBlock(appName: string, taskLabel: string) {
  if (isAppBlockVisible()) return;
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  overlay = new BrowserWindow({
    width, height, x: 0, y: 0,
    frame: false, resizable: false,
    movable: false, minimizable: false, maximizable: false, closable: false,
    skipTaskbar: true, alwaysOnTop: true, show: false,
    backgroundColor: '#D7E4DB',
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  overlay.setAlwaysOnTop(true, 'screen-saver');
  overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  const safe = esc;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: rgba(215,228,219,0.97);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    height: 100vh;
    font-family: 'Nunito', 'Nunito Sans', system-ui, -apple-system, sans-serif;
    color: #1F2E27; text-align: center; padding: 32px;
  }
  .badge { font-size: 11px; font-weight: 800; letter-spacing: 1.4px;
    text-transform: uppercase; color: #7FA38E; margin-bottom: 28px; }
  .icon { font-size: 72px; margin-bottom: 20px; }
  .heading { font-size: 28px; font-weight: 900; color: #2E2E33; margin-bottom: 10px; }
  .sub { font-size: 18px; color: #56565E; font-weight: 700; }
  .hint { margin-top: 40px; font-size: 13px; color: #8A8A92; font-weight: 600; }
</style>
</head>
<body>
  <div class="badge">Routine Tracker &middot; Focus block</div>
  <div class="icon">🚫</div>
  <div class="heading">${safe(appName)} is blocked</div>
  <div class="sub">Time to focus on: ${safe(taskLabel)}</div>
  <div class="hint">Tap DONE on your watch to unlock</div>
</body>
</html>`;

  void overlay.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  overlay.once('ready-to-show', () => overlay?.show());
}

export function hideAppBlock() {
  if (!overlay || overlay.isDestroyed()) return;
  overlay.destroy();
  overlay = null;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
