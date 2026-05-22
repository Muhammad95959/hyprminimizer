import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Configuration management for hyprminimizer
 * Reads from ~/.config/hyprminimizer/config.json
 */
export class Config {
  constructor() {
    this.configDir = path.join(os.homedir(), '.config', 'hyprminimizer');
    this.configFile = path.join(this.configDir, 'config.json');
    this.stateFile = path.join(this.configDir, 'minimized-windows.json');
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from file
   */
  loadConfig() {
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
        return this.getDefaults();
      }
    }

    // Create default config file
    const defaults = this.getDefaults();
    this.saveConfig(defaults);
    return defaults;
  }

  /**
   * Get default configuration
   */
  getDefaults() {
    return {
      specialWorkspace: 'minimized',
      trayModule: 'systemtray',
      restoreLauncher: 'rofi',
      restoreLauncherArgs: '-dmenu -p "Restore window:"',
      maxMinimizedWindows: 50,
      excludeWindowClasses: ['waybar', 'dunst', 'swaylock'],
      useDBusTray: true,
      dbusServiceName: 'org.hyprminimizer',
      stackBaseDirectory: '/tmp',
      enableNotifications: true
    };
  }

  /**
   * Save configuration to file
   */
  saveConfig(config) {
    fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2), 'utf-8');
  }

  /**
   * Get current config value
   */
  get(key) {
    return this.config[key];
  }

  /**
   * Set config value
   */
  set(key, value) {
    this.config[key] = value;
    this.saveConfig(this.config);
  }

  /**
   * Load minimized windows state
   */
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

  /**
   * Save minimized windows state
   */
  saveMinimizedState(windows) {
    fs.writeFileSync(this.stateFile, JSON.stringify(windows, null, 2), 'utf-8');
  }

  /**
   * Generate default config file interactively
   */
  async generateConfigFile() {
    const defaults = this.getDefaults();
    this.saveConfig(defaults);
    console.log(`Config file generated at: ${this.configFile}`);
    console.log('You can now customize the settings as needed.');
  }
}

export default Config;
