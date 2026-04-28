import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, powerMonitor } from 'electron';
import * as path from 'node:path';
import { startWatcher, stopWatcher, getCurrentSnapshot, type WatcherSnapshot } from './watcher';
import { showLockscreen, hideLockscreen, isLockscreenVisible } from './lockscreen';
import { showAppBlock, hideAppBlock, isAppBlockVisible } from './app-block';
import { initClient, pushHeartbeat, subscribeNudges, subscribeBlockCommands, sendBlockCommand } from './client';
import { loadPairing, clearPairing } from './pairing';
import type { BlockCommand } from '@timekeeper/schema';

let tray: Tray | null = null;
let popup: BrowserWindow | null = null;

// Active block command received from caregiver — drives lockscreen + app overlay
let activeBlock: BlockCommand | null = null;
// App name to intercept (set on block_app command)
let blockedAppName: string | null = null;

const TRAY_ICON_GREEN = path.join(__dirname, '..', 'assets', 'tray-green.png');
const TRAY_ICON_GREY  = path.join(__dirname, '..', 'assets', 'tray-grey.png');

app.whenReady().then(async () => {
  // Hide dock on macOS — this is a tray-only utility
  if (process.platform === 'darwin' && app.dock) app.dock.hide();

  initClient();

  await startApp();
}).catch((err) => {
  console.error('[main] failed to start', err);
  app.exit(1);
});

async function startApp() {
  buildTray();
  await startWatcher((snap) => {
    void onSnapshot(snap);
    refreshTray(snap);
    checkAppBlock(snap);
  });

  const pairing = loadPairing();
  if (pairing) {
    subscribeNudges(pairing.kidId, (n) => {
      console.log('[main] nudge received:', n.message);
    });

    // Subscribe to caregiver block commands — pure command receiver
    subscribeBlockCommands(pairing.kidId, (cmd) => {
      console.log('[main] block command:', cmd.action, cmd.payload);
      handleBlockCommand(cmd);
      refreshTray(getCurrentSnapshot());
    });
  }

  // Quit handlers — tray-only app, never auto-quits when no windows
  app.on('window-all-closed', () => { /* keep tray alive */ });
  app.on('before-quit', () => { stopWatcher(); });

  // System events
  powerMonitor.on('lock-screen',   () => onSystemEvent({ kind: 'lock' }));
  powerMonitor.on('unlock-screen', () => onSystemEvent({ kind: 'unlock' }));
  powerMonitor.on('suspend',       () => onSystemEvent({ kind: 'sleep' }));
  powerMonitor.on('resume',        () => onSystemEvent({ kind: 'wake' }));

  // Renderer ↔ main bridge for the popup
  ipcMain.handle('tk:get-snapshot', () => getCurrentSnapshot());
  ipcMain.handle('tk:get-pairing',  () => loadPairing());
  ipcMain.handle('tk:unpair', () => { clearPairing(); app.relaunch(); app.exit(0); });
  ipcMain.handle('tk:show-lock',  (_e, opts: { taskLabel: string; expectedSec: number }) => {
    showLockscreen(opts.taskLabel, opts.expectedSec);
  });
  ipcMain.handle('tk:hide-lock', () => hideLockscreen());
}

function buildTray() {
  const icon = nativeImage.createFromPath(TRAY_ICON_GREY);
  if (icon.isEmpty()) {
    // Fallback: create a tiny solid square so the tray icon appears even
    // before assets are added. Replace with real tray icons in assets/.
    const buf = Buffer.alloc(16 * 16 * 4, 0xC9);
    tray = new Tray(nativeImage.createFromBuffer(buf, { width: 16, height: 16 }));
  } else {
    tray = new Tray(icon);
  }
  tray.setToolTip('TimeKeeper Monitor');
  refreshTray(null);
}

function refreshTray(snap: WatcherSnapshot | null) {
  if (!tray) return;
  const paired = !!loadPairing();

  const focusLine = snap?.focus
    ? `${snap.focus.app} · ${snap.focus.category}`
    : 'idle';

  const blockStatusLabel = activeBlock?.action === 'lock_screen'
    ? `🔒 Lock active · ${activeBlock.payload?.taskLabel ?? 'Focus time'}`
    : activeBlock?.action === 'block_app'
      ? `🚫 ${activeBlock.payload?.appName ?? 'App'} blocked`
      : null;

  const menuItems: Electron.MenuItemConstructorOptions[] = [
    { label: paired ? `Paired · ${loadPairing()!.kidName}` : 'Not paired', enabled: false },
    blockStatusLabel
      ? { label: blockStatusLabel, enabled: false }
      : { label: focusLine, enabled: false },
    { label: snap ? `${snap.idleSec}s idle` : 'no data', enabled: false },
    { type: 'separator' },
    { label: 'Show status…', click: () => togglePopup() },
    ...(activeBlock
      ? [{ label: 'Request unlock…', click: () => requestUnlock() }]
      : [{ label: 'Test lockscreen', click: () => showLockscreen('Brush Teeth', 180) }]),
    { type: 'separator' },
    { label: paired ? 'Unpair…' : 'Pair with caregiver…', click: () => paired ? unpair() : pair() },
    { label: 'Quit', click: () => { stopWatcher(); app.exit(0); } },
  ];

  tray.setContextMenu(Menu.buildFromTemplate(menuItems));

  const iconPath = paired ? TRAY_ICON_GREEN : TRAY_ICON_GREY;
  const next = nativeImage.createFromPath(iconPath);
  if (!next.isEmpty()) tray.setImage(next);

  tray.setToolTip(blockStatusLabel ?? `Routine Tracker · ${focusLine}`);
}

function handleBlockCommand(cmd: BlockCommand) {
  switch (cmd.action) {
    case 'lock_screen':
      activeBlock = cmd;
      blockedAppName = null;
      hideAppBlock();
      showLockscreen(cmd.payload?.taskLabel ?? 'Focus time', cmd.payload?.expectedSec ?? 180);
      break;

    case 'unlock_screen':
      activeBlock = null;
      blockedAppName = null;
      hideLockscreen();
      hideAppBlock();
      break;

    case 'block_app':
      activeBlock = cmd;
      blockedAppName = cmd.payload?.appName ?? null;
      // The watcher tick will show the overlay when the blocked app is in focus
      break;

    case 'unblock_app':
      activeBlock = null;
      blockedAppName = null;
      hideAppBlock();
      break;
  }
}

function checkAppBlock(snap: WatcherSnapshot) {
  if (!blockedAppName) return;
  const appName = snap.focus?.app ?? '';
  const matched = appName.toLowerCase().includes(blockedAppName.toLowerCase());
  if (matched && !isAppBlockVisible()) {
    showAppBlock(blockedAppName, activeBlock?.payload?.taskLabel ?? 'your routine');
  } else if (!matched && isAppBlockVisible()) {
    hideAppBlock();
  }
}

async function requestUnlock() {
  const pairing = loadPairing();
  if (!pairing) return;
  // Send an unlock_screen command back — caregiver app sees it via subscribeBlockCommands audit
  await sendBlockCommand({
    kidId: pairing.kidId,
    action: 'unlock_screen',
    payload: { taskLabel: '[Kid requested unlock from laptop]' },
    createdAt: Date.now(),
  }).catch((err) => console.error('[main] request unlock failed', err));
  // Also clear local block state so the overlay drops immediately
  handleBlockCommand({ kidId: pairing.kidId, action: 'unlock_screen', createdAt: Date.now() });
  refreshTray(getCurrentSnapshot());
}

function togglePopup() {
  if (popup && !popup.isDestroyed()) {
    if (popup.isVisible()) popup.hide(); else popup.show();
    return;
  }
  popup = new BrowserWindow({
    width: 360, height: 460, frame: false, alwaysOnTop: true,
    resizable: false, skipTaskbar: true, show: true,
    backgroundColor: '#F4EFE6',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, sandbox: true,
    },
  });
  void popup.loadFile(path.join(__dirname, 'tray-popup', 'index.html'));
  popup.on('blur', () => popup?.hide());
}

function pair() {
  // For demo: open the popup and route to its pair view via query string
  togglePopup();
  if (popup) popup.webContents.send('tk:route', 'pair');
}

function unpair() {
  clearPairing();
  app.relaunch();
  app.exit(0);
}

async function onSnapshot(snap: WatcherSnapshot) {
  const pairing = loadPairing();
  if (!pairing) return;
  await pushHeartbeat({
    deviceId: pairing.deviceId,
    kidId: pairing.kidId,
    ts: Date.now(),
    focus: snap.focus,
    idleSec: snap.idleSec,
    locked: snap.locked,
    audioActive: snap.audioActive,
  }).catch((err) => console.error('[main] heartbeat failed', err));
}

function onSystemEvent(ev: { kind: 'lock' | 'unlock' | 'sleep' | 'wake' }) {
  console.log('[main] system:', ev.kind);
  // The watcher's polled `locked` flag will pick this up on its next tick.
}
