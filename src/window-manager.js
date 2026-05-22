import { execSync } from 'child_process';
import HyprlandSocket from './hyprland-socket.js';
import Config from './config.js';
import Stack from './stack.js';
import { startTraySession } from './dbus/session.js';

export class WindowManager {
  constructor() {
    this.socket = new HyprlandSocket();
    this.config = new Config();
    this.stack = new Stack(this.config);
  }

  async init() {
    await this.socket.connect();
  }

  async minimizeActiveWindow() {
    const active = await this.socket.getActiveWindow();

    if (!active || !active.address) {
      console.error('No active window to minimize');
      return false;
    }

    const excluded = this.config.get('excludeWindowClasses') || [];
    if (excluded.includes(active.class)) {
      console.log(`Skipping excluded window class: ${active.class}`);
      return false;
    }

    if (active.workspace?.name === 'special:minimized') {
      console.log('Window is already minimized');
      return false;
    }

    const result = await this.socket.minimizeActiveWindow();
    if (result.trim() !== 'ok') {
      console.error('Failed to minimize window:', result);
      return false;
    }

    const originalWorkspace = active.workspace?.id || 1;
    this.stack.push(active.address, originalWorkspace);
    this.addToMinimizedList(active);
    console.log(`✓ Minimized [${active.class}] ${active.title}`);

    if (this.config.get('useDBusTray')) {
      await this.minimizeWithTray(active).catch(err => {
        console.error('Tray setup failed:', err.message);
      });
    }

    return true;
  }

  async minimizeWithTray(active) {
    const tray = await startTraySession(this.config, {
      iconName: active.class || 'hypr-minimizer',
      title: active.title || 'Minimized Window',
      tooltip: `[${active.class}] ${active.title}`,
      onRestore: async () => {
        await this._restoreLastFromStack();
      },
    });

    let exiting = false;
    const cleanupAndExit = async () => {
      if (exiting) return;
      exiting = true;
      tray.cleanup();
      setImmediate(() => process.exit(0));
    };

    process.on('SIGINT', () => { cleanupAndExit(); });
    process.on('SIGTERM', () => { cleanupAndExit(); });

    // Poll: if the minimized window is no longer on special:minimized
    // (e.g. manually restored), clean up and exit.
    const pollInterval = setInterval(async () => {
      const entry = this.stack.readStack().pop();
      if (!entry) { cleanupAndExit(); return; }
      let addr;
      try { addr = JSON.parse(entry).address; } catch { addr = entry; }
      const minimized = await this.socket.getMinimizedWindows();
      const stillThere = minimized.some(w => w.address === addr);
      if (!stillThere) {
        this.stack.remove(addr);
        cleanupAndExit();
      }
    }, 2000);

    // Keep process alive
    await new Promise(() => {});
    clearInterval(pollInterval);
  }

  async _restoreLastFromStack() {
    const entry = this.stack.pop();
    if (!entry) return;
    const addr = entry.address || entry;
    const originalWs = entry.workspace;

    const targetWs = this.config.get('restoreToCurrentWorkspace')
      ? await this.socket.getActiveWorkspace()
      : originalWs;
    console.error(`[restore] addr=${addr} workspace=${targetWs}`);
    const result = await this.socket.restoreWindow(addr, targetWs);
    console.error(`[restore] result=${result.trim()}`);

    if (result.trim() === 'ok') {
      const minimized = this.config.loadMinimizedState();
      const idx = minimized.findIndex(w => w.address === addr);
      if (idx >= 0) {
        minimized.splice(idx, 1);
        this.config.saveMinimizedState(minimized);
      }
    }
  }

  async restoreLastWindow() {
    const minimized = this.config.loadMinimizedState();
    if (minimized.length === 0) {
      console.log('No minimized windows to restore');
      return false;
    }

    const window = minimized.pop();
    this.config.saveMinimizedState(minimized);
    this.stack.remove(window.address);

    const targetWs = this.config.get('restoreToCurrentWorkspace')
      ? await this.socket.getActiveWorkspace()
      : window.workspace;
    const result = await this.socket.restoreWindow(window.address, targetWs);
    if (result.trim() !== 'ok') {
      console.error('Failed to restore window:', result);
      return false;
    }

    console.log(`✓ Restored [${window.class}] ${window.title}`);
    return true;
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
        const window = minimized[index];
        const targetWs = this.config.get('restoreToCurrentWorkspace')
          ? await this.socket.getActiveWorkspace()
          : window.workspace;
        const result = await this.socket.restoreWindow(window.address, targetWs);
        if (result.trim() === 'ok') {
          minimized.splice(index, 1);
          this.config.saveMinimizedState(minimized);
          this.stack.remove(window.address);
          console.log(`✓ Restored [${window.class}] ${window.title}`);
          return true;
        }
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
