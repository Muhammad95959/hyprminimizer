import { execSync } from 'child_process';
import fs from 'fs';
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
    const pidFile = `/tmp/hyprminimizer-${window.address}.pid`;

    // If a tray for this address is already alive, don't spawn another
    try {
      const existingPid = parseInt(fs.readFileSync(pidFile, 'utf-8').trim(), 10);
      process.kill(existingPid, 0); // signal 0 = check alive
      return; // still alive, skip
    } catch {}

    let exiting = false;
    const cleanup = async () => {
      if (exiting) return;
      exiting = true;
      try { fs.unlinkSync(pidFile); } catch {}
      clearInterval(pollInterval);
      setImmediate(() => process.exit(0));
    };

    try { fs.writeFileSync(pidFile, String(process.pid)); } catch {}

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

    const existing = minimized.findIndex(w => w.address === active.address);
    const entry = {
      address: active.address,
      class: active.class,
      title: active.title,
      workspace: active.workspace?.id || 1,
      timestamp: Date.now()
    };

    if (existing >= 0) {
      minimized[existing] = entry;
    } else {
      if (minimized.length >= maxWindows) minimized.shift();
      minimized.push(entry);
    }

    this.config.saveMinimizedState(minimized);
  }

  async cleanupTray() {
    const actualWindows = await this.socket.getMinimizedWindows();
    const actualAddresses = new Set(actualWindows.map(w => w.address));

    const state = this.config.loadMinimizedState();

    // Deduplicate by address (keep newest)
    const seen = new Map();
    for (const w of state) {
      const existing = seen.get(w.address);
      if (!existing || (w.timestamp || 0) > (existing.timestamp || 0))
        seen.set(w.address, w);
    }
    const cleaned = [...seen.values()].filter(w => actualAddresses.has(w.address));

    if (cleaned.length !== state.length) {
      this.config.saveMinimizedState(cleaned);
      console.log(`✓ Cleaned ${state.length - cleaned.length} stale entries from state`);
    }

    // Build address → [PIDs] from PID files and /proc
    const addrPids = {};

    for (const file of fs.readdirSync('/tmp').filter(f => f.startsWith('hyprminimizer-') && f.endsWith('.pid'))) {
      try {
        const pid = parseInt(fs.readFileSync(`/tmp/${file}`, 'utf-8').trim(), 10);
        (addrPids[file.slice(14, -4)] ??= []).push(pid);
      } catch {}
    }

    for (const entry of fs.readdirSync('/proc')) {
      if (!/^\d+$/.test(entry)) continue;
      const pid = parseInt(entry);
      if (pid === process.pid) continue;

      try {
        const cmdline = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf-8');
        if (!cmdline.includes('hyprminimizer')) continue;
        const args = cmdline.split('\0').filter(Boolean);
        if (args[2] === 'minimize' && args[3]?.startsWith('0x'))
          (addrPids[args[3]] ??= []).push(pid);
      } catch {}
    }

    // Kill: not in actualAddresses, or duplicates (keep highest PID)
    for (const [addr, pids] of Object.entries(addrPids)) {
      if (!actualAddresses.has(addr)) {
        for (const pid of pids) try { process.kill(pid, 'SIGTERM'); } catch {}
      } else if (pids.length > 1) {
        pids.sort((a, b) => b - a);
        for (const pid of pids.slice(1)) try { process.kill(pid, 'SIGTERM'); } catch {}
      }
    }

    // Clean up orphaned PID files
    for (const file of fs.readdirSync('/tmp').filter(f => f.startsWith('hyprminimizer-') && f.endsWith('.pid'))) {
      if (!actualAddresses.has(file.slice(14, -4)))
        try { fs.unlinkSync(`/tmp/${file}`); } catch {}
    }
  }
}

export default WindowManager;
