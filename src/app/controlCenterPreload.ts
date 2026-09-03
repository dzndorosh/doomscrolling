import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('controlCenter', {
  getSettings: (): Promise<unknown> => ipcRenderer.invoke('control-center:get-settings'),
  update: (patch: unknown): void => ipcRenderer.send('control-center:update', patch),
  onSettings: (fn: (settings: unknown) => void): void => {
    ipcRenderer.on('control-center:settings', (_event, settings) => fn(settings));
  },
});
