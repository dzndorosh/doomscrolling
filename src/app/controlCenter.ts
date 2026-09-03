import { BrowserWindow } from 'electron';
import { join } from 'node:path';
import type { Settings, SettingsStore } from './settings.js';

export class ControlCenterWindow {
  private win: BrowserWindow | null = null;
  private ready = false;

  constructor(private readonly settings: SettingsStore) {}

  private create(): BrowserWindow {
    const win = new BrowserWindow({
      width: 500,
      height: 680,
      minWidth: 500,
      minHeight: 680,
      maxWidth: 500,
      maxHeight: 680,
      title: 'FocusReels',
      titleBarStyle: 'hiddenInset',
      backgroundColor: '#4a4a4a',
      show: false,
      resizable: false,
      webPreferences: {
        preload: join(__dirname, 'controlCenterPreload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
    });
    // The video stage uses the screen-saver level when Always on top is
    // enabled. Keep settings reachable while it is visible; this applies only
    // to the Control Center window and does not change the user's video toggle.
    win.setAlwaysOnTop(true, 'screen-saver', 1);
    win.on('closed', () => { this.win = null; this.ready = false; });
    win.webContents.on('did-finish-load', () => {
      this.ready = true;
      this.push(this.settings.get());
    });
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    void win.loadFile(join(__dirname, 'renderer', 'control-center.html'));
    return win;
  }

  private push(settings: Settings): void {
    if (this.win && !this.win.isDestroyed() && this.ready) {
      this.win.webContents.send('control-center:settings', settings);
    }
  }

  show(): void {
    if (!this.win || this.win.isDestroyed()) {
      this.win = this.create();
      this.ready = false;
    }
    this.win.show();
    this.win.focus();
    this.push(this.settings.get());
  }

  update(settings: Settings): void { this.push(settings); }

  destroy(): void {
    if (this.win && !this.win.isDestroyed()) this.win.destroy();
    this.win = null;
    this.ready = false;
  }
}
