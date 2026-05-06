import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, powerMonitor, dialog } from 'electron';
import * as path from 'node:path';
import { startWatcher, stopWatcher, getCurrentSnapshot, type WatcherSnapshot } from './watcher';
import { showLockscreen, hideLockscreen, isLockscreenVisible, getLockscreenWindow } from './lockscreen';
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
// True when the child has requested an unlock but the caregiver hasn't granted it yet
let unlockPending = false;
// Must be set to true before app.quit() so before-quit doesn't cancel it
let allowQuit = false;

// Subscription cleanup functions — stored so unpair() can tear them down cleanly
let unsubNudges: (() => void) | null = null;
let unsubBlocks: (() => void) | null = null;

const TRAY_ICON_GREEN = path.join(__dirname, '..', 'assets', 'tray-green.png');
const TRAY_ICON_GREY  = path.join(__dirname, '..', 'assets', 'tray-grey.png');

// Marker embedded in child-originated unlock requests so the local subscription
// and caregiver app can distinguish them from a caregiver-issued grant.
const KID_UNLOCK_MARKER = '[Kid requested unlock]';

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

  setupSubscriptions();

  // Quit handlers — tray-only app, never auto-quits when no windows
  app.on('window-all-closed', () => { /* keep tray alive */ });

  // Intercept quit attempts (e.g. Cmd+Q, dock quit on macOS) so the child
  // cannot bypass monitoring. The tray "Quit" item sets allowQuit first.
  app.on('before-quit', (event) => {
    if (!allowQuit) event.preventDefault();
  });
  app.on('will-quit', () => { stopWatcher(); });

  // System events
  powerMonitor.on('lock-screen',   () => onSystemEvent({ kind: 'lock' }));
  powerMonitor.on('unlock-screen', () => onSystemEvent({ kind: 'unlock' }));
  powerMonitor.on('suspend',       () => onSystemEvent({ kind: 'sleep' }));
  powerMonitor.on('resume',        () => onSystemEvent({ kind: 'wake' }));

  // Renderer ↔ main bridge for the popup
  ipcMain.handle('tk:get-snapshot', () => getCurrentSnapshot());
  ipcMain.handle('tk:get-pairing',  () => loadPairing());
  ipcMain.handle('tk:unpair', () => unpair());
  ipcMain.handle('tk:show-lock', (_e, opts: { taskLabel: string; expectedSec: number }) => {
    showLockscreen(opts.taskLabel, opts.expectedSec);
  });
  ipcMain.handle('tk:hide-lock', () => hideLockscreen());
}

function setupSubscriptions() {
  const pairing = loadPairing();
  if (!pairing) return;

  unsubNudges = subscribeNudges(pairing.kidId, (n) => {
    console.log('[main] nudge received:', n.message);
  });

  unsubBlocks = subscribeBlockCommands(pairing.kidId, (cmd) => {
    console.log('[main] block command:', cmd.action, cmd.payload);
    handleBlockCommand(cmd);
    refreshTray(getCurrentSnapshot());
  });
}

function teardownSubscriptions() {
  unsubNudges?.();
  unsubNudges = null;
  unsubBlocks?.();
  unsubBlocks = null;
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

  const blockLabel = activeBlock?.action === 'lock_screen'
    ? `🔒 ${activeBlock.payload?.taskLabel ?? 'Focus time'}${unlockPending ? ' · Unlock requested…' : ''}`
    : activeBlock?.action === 'block_app'
      ? `🚫 ${activeBlock.payload?.appName ?? 'App'} blocked`
      : null;

  const menuItems: Electron.MenuItemConstructorOptions[] = [
    { label: paired ? `Paired · ${loadPairing()!.kidName}` : 'Not paired', enabled: false },
    blockLabel
      ? { label: blockLabel, enabled: false }
      : { label: focusLine, enabled: false },
    { label: snap ? `${snap.idleSec}s idle` : 'no data', enabled: false },
    { type: 'separator' },
    { label: 'Show status…', click: () => togglePopup() },
    ...(activeBlock
      ? [{ label: unlockPending ? 'Unlock requested (waiting…)' : 'Request unlock…',
           enabled: !unlockPending,
           click: () => requestUnlock() }]
      : [{ label: 'Test lockscreen', click: () => showLockscreen('Focus time', 180) }]),
    { type: 'separator' },
    { label: paired ? 'Unpair…' : 'Pair with caregiver…', click: () => paired ? unpair() : pair() },
    { label: 'Quit', click: () => confirmQuit() },
  ];

  tray.setContextMenu(Menu.buildFromTemplate(menuItems));

  const iconPath = paired ? TRAY_ICON_GREEN : TRAY_ICON_GREY;
  const next = nativeImage.createFromPath(iconPath);
  if (!next.isEmpty()) tray.setImage(next);

  tray.setToolTip(blockLabel ?? `Routine Tracker · ${focusLine}`);
}

function handleBlockCommand(cmd: BlockCommand) {
  switch (cmd.action) {
    case 'lock_screen':
      activeBlock = cmd;
      blockedAppName = null;
      unlockPending = false;
      hideAppBlock();
      showLockscreen(
        cmd.payload?.taskLabel ?? 'Focus time',
        cmd.payload?.expectedSec ?? 180,
      );
      break;

    case 'unlock_screen':
      // Skip kid-originated requests bouncing back from realtime — only a
      // caregiver-issued grant (no KID_UNLOCK_MARKER) should drop the overlay.
      if (cmd.payload?.taskLabel === KID_UNLOCK_MARKER) break;
      activeBlock = null;
      blockedAppName = null;
      unlockPending = false;
      hideLockscreen();
      hideAppBlock();
      break;

    case 'block_app':
      activeBlock = cmd;
      blockedAppName = cmd.payload?.appName ?? null;
      unlockPending = false;
      break;

    case 'unblock_app':
      activeBlock = null;
      blockedAppName = null;
      unlockPending = false;
      hideAppBlock();
      break;
  }
}

function checkAppBlock(snap: WatcherSnapshot) {
  if (!blockedAppName) return;
  const focusApp = snap.focus?.app ?? '';
  // Use start-anchored matching so "Roblox" correctly matches "RobloxPlayer"
  // but doesn't false-positive on unrelated apps (unlike a bare includes()).
  const needle = blockedAppName.toLowerCase();
  const hay = focusApp.toLowerCase();
  const matched = hay === needle || hay.startsWith(needle + ' ') || hay.startsWith(needle + '.');
  if (matched && !isAppBlockVisible()) {
    showAppBlock(blockedAppName, activeBlock?.payload?.taskLabel ?? 'your routine');
  } else if (!matched && isAppBlockVisible()) {
    hideAppBlock();
  }
}

async function requestUnlock() {
  const pairing = loadPairing();
  if (!pairing || unlockPending) return;

  unlockPending = true;
  refreshTray(getCurrentSnapshot());
  notifyLockscreen('pending');

  // Send a request tagged with KID_UNLOCK_MARKER so the local subscription
  // (and the caregiver app) can distinguish it from a real caregiver grant.
  // The overlay stays visible until the caregiver explicitly sends unlock_screen.
  await sendBlockCommand({
    kidId: pairing.kidId,
    action: 'unlock_screen',
    payload: { taskLabel: KID_UNLOCK_MARKER },
    createdAt: Date.now(),
  }).catch((err) => {
    console.error('[main] request unlock failed', err);
    unlockPending = false;
    refreshTray(getCurrentSnapshot());
    notifyLockscreen('locked');
  });
}

function notifyLockscreen(state: 'locked' | 'pending') {
  const lockWin = getLockscreenWindow();
  if (lockWin && !lockWin.isDestroyed()) {
    lockWin.webContents.send('tk:lock-state', state);
  }
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
  // Tear down subscriptions before clearing pairing so the old kidId
  // channels don't receive stale commands after re-pairing.
  teardownSubscriptions();
  clearPairing();
  activeBlock = null;
  blockedAppName = null;
  unlockPending = false;
  hideLockscreen();
  hideAppBlock();
  if (popup && !popup.isDestroyed()) { popup.close(); popup = null; }
  refreshTray(null);
}

function confirmQuit() {
  const choice = dialog.showMessageBoxSync({
    type: 'question',
    buttons: ['Cancel', 'Stop monitoring'],
    defaultId: 0,
    cancelId: 0,
    message: 'Stop TimeKeeper monitoring?',
    detail: 'Your caregiver will no longer receive focus updates.',
  });
  if (choice === 1) {
    allowQuit = true;
    stopWatcher();
    app.quit();
  }
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
  const pairing = loadPairing();
  if (!pairing) return;
  // Push an immediate heartbeat so the caregiver app reflects the true device
  // state without waiting for the next watcher poll interval.
  const snap = getCurrentSnapshot();
  const locked = ev.kind === 'lock' || ev.kind === 'sleep';
  void pushHeartbeat({
    deviceId: pairing.deviceId,
    kidId: pairing.kidId,
    ts: Date.now(),
    focus: snap?.focus ?? null,
    idleSec: snap?.idleSec ?? 0,
    locked,
    audioActive: false,
  }).catch((err) => console.error('[main] system event heartbeat failed', err));
}
