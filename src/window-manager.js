import { execSync } from 'child_process';
import HyprlandSocket from './hyprland-socket.js';
import Config from './config.js';
import { startTraySession } from './dbus/session.js';

export class WindowManager {
  constructor() {
    this.socket = new HyprlandSocket();
    this.config = new Config();
  }

  async init() {
    await this.socket.connect();
  }

  async #minimizeWindow(window, socketCmd) {
    const excluded = this.config.get('excludeWindowClasses') || [];
    if (excluded.includes(window.class)) {
      console.log(`Skipping excluded window class: ${window.class}`);
      return false;
    }

    if (window.workspace?.name === 'special:minimized') {
      console.log('Window is already minimized');
      return false;
    }

    const result = await socketCmd();
    if (result.trim() !== 'ok') {
      console.error('Failed to minimize window:', result);
      return false;
    }

    this.addToMinimizedList(window);
    console.log(`✓ Minimized [${window.class}] ${window.title}`);

    if (this.config.get('useDBusTray')) {
      await this.minimizeWithTray(window).catch(err => {
        console.error('Tray setup failed:', err.message);
      });
    }

    return true;
  }

  async minimizeWindowByAddress(address) {
    const all = await this.socket.getAllWindows();
    const window = all.find(w => w.address === address);
    if (!window) {
      console.error(`No window found with address: ${address}`);
      return false;
    }
    return this.#minimizeWindow(window, () => this.socket.minimizeWindow(address));
  }

  async minimizeActiveWindow() {
    const active = await this.socket.getActiveWindow();
    if (!active || !active.address) {
      console.error('No active window to minimize');
      return false;
    }
    return this.#minimizeWindow(active, () => this.socket.minimizeActiveWindow());
  }

  async minimizeWithTray(window) {
    const iconPack = this.config.get('iconPack') || {};
    const iconName = iconPack[window.class] || window.class || 'hypr-minimizer';
    
    let exiting = false;
    const cleanup = async () => {
      if (exiting) return;
      exiting = true;
      setImmediate(() => process.exit(0));
    };

    await startTraySession(this.config, {
      iconName,
      title: window.title || 'Minimized Window',
      tooltip: `[${window.class}] ${window.title}`,
      onRestore: async () => {
        await this._restoreLastFromStack();
        await cleanup();
      },
    });

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // Poll: if minimized window is manually restored, cleanup and exit
    const pollInterval = setInterval(async () => {
      const minimized = this.config.loadMinimizedState();
      if (!minimized.some(w => w.address === window.address)) {
        clearInterval(pollInterval);
        await cleanup();
      }
    }, 2000);

    // Keep process alive
    await new Promise(() => {});
  }

  async #restoreWindow(window) {
    const targetWs = this.config.get('restoreToCurrentWorkspace')
      ? await this.socket.getActiveWorkspace()
      : window.workspace;
    
    const result = await this.socket.restoreWindow(window.address, targetWs);
    if (result.trim() !== 'ok') {
      console.error('Failed to restore window:', result);
      return false;
    }

    const minimized = this.config.loadMinimizedState();
    const idx = minimized.findIndex(w => w.address === window.address);
    if (idx >= 0) {
      minimized.splice(idx, 1);
      this.config.saveMinimizedState(minimized);
    }
    console.log(`✓ Restored [${window.class}] ${window.title}`);
    return true;
  }

   async _restoreLastFromStack() {
     const minimized = this.config.loadMinimizedState();
     if (minimized.length === 0) return;
     await this.#restoreWindow(minimized[minimized.length - 1]);
   }

   async restoreLastWindow() {
     await this._restoreLastFromStack();
   }

  async showRestoreMenu() {
    const minimized = this.config.loadMinimizedState();
    if (minimized.length === 0) {
      console.log('No minimized windows');
      return false;
    }

    const launcher = this.config.get('restoreLauncher') || 'rofi';
    const launcherArgs = this.config.get('restoreLauncherArgs') || '-dmenu -p "Restore window:"';
    const menuOptions = minimized.map((w, i) => `${i + 1}. [${w.class}] ${w.title}`).join('\n');

    try {
      const selected = execSync(
        `printf '${menuOptions.replace(/'/g, "'\\''")}' | ${launcher} ${launcherArgs}`,
        { encoding: 'utf-8' }
      ).trim();

      const index = parseInt(selected.split('.')[0]) - 1;
      if (index >= 0 && index < minimized.length) {
        return this.#restoreWindow(minimized[index]);
      }
    } catch {
      return false;
    }
    return false;
  }

  async listMinimized() {
    const minimized = this.config.loadMinimizedState();
    if (minimized.length === 0) {
      console.log('No minimized windows');
      return;
    }
    console.log(`Minimized windows (${minimized.length}):`);
    minimized.forEach((w, i) => console.log(`  ${i + 1}. [${w.class}] ${w.title}  (ws: ${w.workspace})`));
  }

  addToMinimizedList(active) {
    const minimized = this.config.loadMinimizedState();
    const maxWindows = this.config.get('maxMinimizedWindows') || 50;
    if (minimized.length >= maxWindows) minimized.shift();

    minimized.push({
      address: active.address,
      class: active.class,
      title: active.title,
      workspace: active.workspace?.id || 1,
      timestamp: Date.now()
    });

    this.config.saveMinimizedState(minimized);
  }
}

export default WindowManager;
