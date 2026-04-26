import { BrowserWindow, screen } from 'electron';
import * as path from 'node:path';

let lock: BrowserWindow | null = null;

export function isLockscreenVisible(): boolean {
  return !!lock && !lock.isDestroyed() && lock.isVisible();
}

export function showLockscreen(taskLabel: string, expectedSec: number) {
  if (isLockscreenVisible()) return;
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;

  lock = new BrowserWindow({
    width, height, x: 0, y: 0,
    frame: false, fullscreen: true, resizable: false,
    movable: false, minimizable: false, maximizable: false, closable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    backgroundColor: '#1F2E27',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, sandbox: true,
    },
  });
  lock.setAlwaysOnTop(true, 'screen-saver');
  lock.setKiosk(true);
  lock.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  const html = path.join(__dirname, 'lockscreen', 'index.html');
  const params = new URLSearchParams({ task: taskLabel, expected: String(expectedSec) });
  void lock.loadFile(html, { search: params.toString() });
  lock.once('ready-to-show', () => lock?.show());
}

export function hideLockscreen() {
  if (!lock || lock.isDestroyed()) return;
  lock.setKiosk(false);
  lock.destroy();
  lock = null;
}
