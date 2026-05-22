import minimist from 'minimist';
import WindowManager from './window-manager.js';
import Config from './config.js';

async function main() {
  const args = minimist(process.argv.slice(2));
  const command = args._[0];

  if (args.help || args.h) {
    showHelp();
    process.exit(0);
  }

  if (args['generate-config'] || command === 'generate-config') {
    const config = new Config();
    await config.generateConfigFile();
    process.exit(0);
  }

  try {
    const manager = new WindowManager();
    await manager.init();

    switch (command) {
      case 'minimize':
        await manager.minimizeActiveWindow();
        break;

      case 'restore-last':
        await manager.restoreLastWindow();
        process.exit(0);
        break;

      case 'menu':
        await manager.showRestoreMenu();
        process.exit(0);
        break;

      case 'list':
        await manager.listMinimized();
        process.exit(0);
        break;

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
  minimize              Minimize the active window (default)
  restore-last          Restore the last minimized window
  menu                  Show interactive menu to restore a window
  list                  List all minimized windows
  generate-config       Generate a default configuration file

OPTIONS:
  -h, --help           Show this help message
  --generate-config    Generate default config file

EXAMPLES:
  # Minimize active window (with tray if enabled)
  hyprminimizer

  # Restore last minimized window
  hyprminimizer restore-last

  # Show interactive restore menu
  hyprminimizer menu

  # List minimized windows
  hyprminimizer list

CONFIGURATION:
  Config file location: ~/.config/hyprminimizer/config.json
  State file location: ~/.config/hyprminimizer/minimized-windows.json

KEYBINDINGS (hyprland.conf):
  # Minimize active window
  bind = $mainMod, M, exec, hyprminimizer

  # Restore last minimized window
  bind = $mainMod SHIFT, M, exec, hyprminimizer restore-last

  # Interactive restore menu
  bind = $mainMod, C, exec, hyprminimizer menu
  `);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
