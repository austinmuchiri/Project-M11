import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('tk', {
  getSnapshot:    () => ipcRenderer.invoke('tk:get-snapshot'),
  getPairing:     () => ipcRenderer.invoke('tk:get-pairing'),
  getConnection:  () => ipcRenderer.invoke('tk:get-connection'),
  unpair:         () => ipcRenderer.invoke('tk:unpair'),
  showLock:    (taskLabel: string, expectedSec: number) =>
    ipcRenderer.invoke('tk:show-lock', { taskLabel, expectedSec }),
  hideLock:    () => ipcRenderer.invoke('tk:hide-lock'),
  onRoute:     (cb: (r: string) => void) => {
    ipcRenderer.on('tk:route', (_e, r: string) => cb(r));
  },
  // Receives 'locked' | 'pending' from main process to update lockscreen UI
  // without a round-trip IPC invoke.
  onLockState: (cb: (state: string) => void) => {
    ipcRenderer.on('tk:lock-state', (_e, state: string) => cb(state));
  },
});
