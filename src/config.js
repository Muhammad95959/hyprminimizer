import fs from 'fs';
import path from 'path';
import os from 'os';

export class Config {
  constructor() {
    this.configDir = path.join(os.homedir(), '.config', 'hyprminimizer');
    this.configFile = path.join(this.configDir, 'config.json');
    this.stateFile = '/tmp/hyprminimizer-minimized.json';
    this.config = this.#loadConfig();
  }

  #getDefaults() {
    return {
      specialWorkspace: 'minimized',
      restoreLauncher: 'rofi',
      restoreLauncherArgs: '-dmenu -p "Restore window:"',
      maxMinimizedWindows: 50,
      excludeWindowClasses: ['waybar', 'mako', 'hyprlock'],
      useDBusTray: true,
      dbusServiceName: 'org.hyprminimizer',
      restoreToCurrentWorkspace: true,
      iconPack: {}
    };
  }

  #loadConfig() {
    // Ensure config directory exists
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }

    // Load or create default config
    if (fs.existsSync(this.configFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.configFile, 'utf-8'));
      } catch (err) {
        console.warn(`Failed to parse config file: ${err.message}. Using defaults.`);
      }
    }

    // Create default config file
    const defaults = this.#getDefaults();
    this.#saveConfig(defaults);
    return defaults;
  }

  #saveConfig(config) {
    fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2), 'utf-8');
  }

  get(key) {
    return this.config[key];
  }

  set(key, value) {
    this.config[key] = value;
    this.#saveConfig(this.config);
  }

  loadMinimizedState() {
    if (fs.existsSync(this.stateFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.stateFile, 'utf-8'));
      } catch (err) {
        console.warn(`Failed to parse state file: ${err.message}`);
        return [];
      }
    }
    return [];
  }

  saveMinimizedState(windows) {
    fs.writeFileSync(this.stateFile, JSON.stringify(windows, null, 2), 'utf-8');
  }

  async generateConfigFile() {
    const defaults = this.#getDefaults();
    this.#saveConfig(defaults);
    console.log(`Config file generated at: ${this.configFile}`);
    console.log('You can now customize the settings as needed.');
  }
}

export default Config;
