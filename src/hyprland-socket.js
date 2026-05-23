import net from 'net';
import fs from 'fs';
import path from 'path';

export class HyprlandSocket {
  constructor() {
    this.socketPath = null;
  }

  async connect() {
    const signature = process.env.HYPRLAND_INSTANCE_SIGNATURE;
    if (!signature)
      throw new Error('HYPRLAND_INSTANCE_SIGNATURE not set. Are you running inside Hyprland?');

    const runtimeDir = process.env.XDG_RUNTIME_DIR || `/run/user/${process.getuid()}`;
    this.socketPath = path.join(runtimeDir, 'hypr', signature, '.socket.sock');

    if (!fs.existsSync(this.socketPath))
      throw new Error(`Hyprland socket not found at ${this.socketPath}`);
  }

  async command(cmd) {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection(this.socketPath, () => {
        socket.write(cmd);
      });
      let response = '';
      socket.on('data', data => response += data.toString());
      socket.on('end', () => resolve(response));
      socket.on('error', reject);
      setTimeout(() => { socket.destroy(); reject(new Error(`Socket timeout: ${cmd}`)); }, 5000);
    });
  }

  async getActiveWindow() {
    const response = await this.command('j/activewindow');
    return JSON.parse(response);
  }

  async getActiveWorkspace() {
    const monitors = JSON.parse(await this.command('j/monitors'));
    return monitors?.[0]?.activeWorkspace?.id || 1;
  }

  async getAllWindows() {
    const response = await this.command('j/clients');
    return JSON.parse(response);
  }

  async minimizeActiveWindow() {
    return this.command('/dispatch hl.dsp.window.move({workspace = "special:minimized", follow = false})');
  }

  async minimizeWindow(address) {
    return this.command(`/dispatch hl.dsp.window.move({workspace = "special:minimized", window = "address:${address}", follow = false})`);
  }

  async restoreWindow(address, workspace) {
    const move = `/dispatch hl.dsp.window.move({workspace = ${workspace}, window = "address:${address}", follow = false})`;
    const focus = `/dispatch hl.dsp.focus({window = "address:${address}"})`;
    await this.command(move);
    return this.command(focus);
  }

  async toggleSpecialWorkspace() {
    return this.command('/dispatch hl.dsp.workspace.toggle_special()');
  }

  async getMinimizedWindows() {
    const clients = await this.getAllWindows();
    return clients.filter(w => w.workspace?.name === 'special:minimized');
  }
}

export default HyprlandSocket;
