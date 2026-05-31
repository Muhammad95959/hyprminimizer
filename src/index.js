#!/usr/bin/env node
import minimist from 'minimist';
import WindowManager from './window-manager.js';
import Config from './config.js';

async function main() {
  const args = minimist(process.argv.slice(2));
  const command = args._[0];

  if (command === 'generate-config') {
    const config = new Config();
    await config.generateConfigFile();
    process.exit(0);
  }

  try {
    const manager = new WindowManager();
    await manager.init();

    switch (command) {
      case 'minimize':
        if (args._[1]) {
          const addr = typeof args._[1] === 'number' ? '0x' + BigInt(args._[1]).toString(16) : args._[1];
          await manager.minimizeWindowByAddress(addr);
        } else {
          await manager.minimizeActiveWindow();
        }
        break;

      case 'restore-last':
        await manager.restoreLastWindow();
        process.exit(0);

      case 'menu':
        await manager.showRestoreMenu();
        process.exit(0);

      case 'list':
        await manager.listMinimized();
        process.exit(0);

      case 'help':
        showHelp();
        process.exit(0);

      case undefined:
        await manager.minimizeActiveWindow();
        break;

      default:
        console.error(`Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
hyprminimizer - Minimize windows to tray for Hyprland
Version 0.1.0

USAGE:
  hyprminimizer [COMMAND] [OPTIONS]

COMMANDS:
  minimize [address]    Minimize the active window (or by window address)
  restore-last          Restore the last minimized window
  menu                  Show interactive menu to restore a window
  list                  List all minimized windows
  help                  Show this help message
  generate-config       Generate a default configuration file

EXAMPLES:
  # Minimize active window (with tray if enabled)
  hyprminimizer

  # Minimize a specific window by address
  hyprminimizer minimize 0x12345678

  # Restore last minimized window
  hyprminimizer restore-last

  # Show interactive restore menu
  hyprminimizer menu

  # List minimized windows
  hyprminimizer list

CONFIGURATION:
  Config file location: ~/.config/hyprminimizer/config.json
  State file location: ~/.config/hyprminimizer/minimized-windows.json

KEYBINDINGS (hyprland.lua):
  -- Minimize active window
  hl.bind("SUPER + M", hl.dsp.exec_cmd("hyprminimizer minimize"))

  -- Restore last minimized window
  hl.bind("SUPER SHIFT + M", hl.dsp.exec_cmd("hyprminimizer restore-last"))

  -- Interactive restore menu
  hl.bind("SUPER + C", hl.dsp.exec_cmd("hyprminimizer menu"))
  `);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
