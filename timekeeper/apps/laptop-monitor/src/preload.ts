import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('tk', {
  getSnapshot: () => ipcRenderer.invoke('tk:get-snapshot'),
  getPairing:  () => ipcRenderer.invoke('tk:get-pairing'),
  unpair:      () => ipcRenderer.invoke('tk:unpair'),
  showLock:    (taskLabel: string, expectedSec: number) =>
    ipcRenderer.invoke('tk:show-lock', { taskLabel, expectedSec }),
  hideLock:    () => ipcRenderer.invoke('tk:hide-lock'),
  onRoute:     (cb: (r: string) => void) => {
    ipcRenderer.on('tk:route', (_e, r: string) => cb(r));
  },
});
