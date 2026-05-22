# Hyprland Minimizer (Lua/Node.js Edition)

A modern Node.js utility to add true "minimize to tray" functionality to Hyprland, inspired by the Rust original but reimplemented using **Hyprland 0.55+ Lua API** and Node.js.

## Features

- **Minimize to Special Workspace**: Hides the active window by moving it to a special hidden workspace (`special:minimized`)
- **Restore Windows**: Click tray icons or use CLI commands to restore minimized windows
- **Restore Last Minimized**: Quickly restore the most recently minimized window
- **Interactive Menu**: Use rofi/wofi to select which window to restore
- **Lua Integration**: Full Lua API support for extending functionality
- **Socket-Based IPC**: Uses Hyprland's modern socket IPC (0.55+) instead of hyprctl
- **Configuration**: JSON-based configuration file

## Why Lua/Node.js?

- **Lua API (0.55+)**: Hyprland deprecated the old hyprlang format in favor of Lua
- **Node.js**: Easy to extend, good for event handling and async operations
- **Socket IPC**: More reliable and efficient than spawning hyprctl processes
- **Modern**: Better suited for Hyprland's current architecture

## Requirements

- Hyprland 0.55 or newer (for Lua API and socket IPC support)
- Node.js 16+
- `rofi` or `wofi` (for interactive restore menu)
- D-Bus support (for tray integration, optional)

## Installation

### From Source

```bash
git clone https://github.com/yourusername/hyprland-minimizer-lua.git
cd hyprland-minimizer-lua

# Install dependencies
npm install

# Create symlink for CLI access
sudo npm link
```

### Global Install

```bash
npm install -g hyprland-minimizer-lua
```

## Quick Start

### Generate Configuration

```bash
hyprland-minimizer-lua generate-config
```

This creates `~/.config/hyprland-minimizer-lua/config.json` with default settings.

### Basic Usage

```bash
# Minimize the active window
hyprland-minimizer-lua

# Restore the last minimized window
hyprland-minimizer-lua restore-last

# Show interactive menu to restore any window
hyprland-minimizer-lua menu

# List all minimized windows
hyprland-minimizer-lua list
```

### Keybindings (hyprland.conf)

Add these to your Hyprland configuration:

```ini
# Minimize active window (Super+M)
bind = $mainMod, m, exec, hyprland-minimizer-lua

# Restore last minimized (Super+Shift+M)
bind = $mainMod SHIFT, m, exec, hyprland-minimizer-lua restore-last

# Interactive restore (Super+C)
bind = $mainMod, c, exec, hyprland-minimizer-lua menu
```

## Configuration

Configuration file: `~/.config/hyprland-minimizer-lua/config.json`

```json
{
  "specialWorkspace": "minimized",
  "trayModule": "systemtray",
  "restoreLauncher": "rofi",
  "restoreLauncherArgs": "-dmenu -p \"Restore window:\"",
  "maxMinimizedWindows": 50,
  "excludeWindowClasses": ["waybar", "dunst", "swaylock"],
  "useDBusTray": true,
  "enableNotifications": true
}
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `specialWorkspace` | `minimized` | Name of the special workspace for minimized windows |
| `trayModule` | `systemtray` | Tray module to use (waybar, etc.) |
| `restoreLauncher` | `rofi` | Launcher for interactive restore menu |
| `restoreLauncherArgs` | `-dmenu -p "Restore window:"` | Arguments for the launcher |
| `maxMinimizedWindows` | `50` | Maximum number of minimized windows to track |
| `excludeWindowClasses` | `["waybar", "dunst", "swaylock"]` | Window classes that cannot be minimized |
| `useDBusTray` | `true` | Use D-Bus for tray integration |
| `enableNotifications` | `true` | Show notifications on minimize/restore |

## Lua Integration

The package includes Lua API integration files for the Hyprland 0.55+ Lua configuration system.

### Example: Using in Lua Config

```lua
-- Load the minimizer module
local minimizer = require('minimizer')

-- Minimize current window
minimizer.minimize_window()

-- Restore last minimized
minimizer.restore_last_window()

-- Show menu
minimizer.show_restore_menu()
```

See `lua/minimizer.lua` and `lua/events.lua` for detailed examples.

## Architecture

### How It Works

1. **Minimize Operation**:
   - Gets the active window ID via socket IPC
   - Moves it to `special:minimized` workspace
   - Stores window metadata in `~/.config/hyprland-minimizer-lua/minimized-windows.json`
   - Window becomes invisible

2. **Restore Operation**:
   - Retrieves window ID from state file
   - Moves window back to current workspace
   - Updates state file

3. **Interactive Restore**:
   - Reads list of minimized windows from state
   - Creates menu with `rofi`/`wofi`
   - User selects window to restore

### Socket IPC vs hyprctl

This project uses **socket-based IPC** (Hyprland 0.55+) instead of spawning `hyprctl`:

```
Node.js ←→ Unix Socket ←→ Hyprland
```

This is:
- **Faster**: No process spawning overhead
- **Reliable**: Direct communication with Hyprland
- **Modern**: Recommended approach for Hyprland 0.55+

## Project Structure

```
hyprland-minimizer-lua/
├── src/
│   ├── index.js              # CLI entry point
│   ├── hyprland-socket.js    # Socket IPC client
│   ├── window-manager.js     # Window operations
│   └── config.js             # Configuration management
├── lua/
│   ├── minimizer.lua         # Basic Lua integration
│   └── events.lua            # Advanced Lua examples
├── config/
│   └── default-config.json   # Default configuration template
└── package.json              # Node.js package info
```

## Development

### Clone and Setup

```bash
git clone <repo-url>
cd hyprland-minimizer-lua
npm install
npm run dev  # Watch mode
```

### Testing

```bash
npm start -- minimize
npm start -- restore-last
npm start -- list
```

## Troubleshooting

### Socket Connection Error

```
Error: Hyprland socket not found at /run/user/1000/hypr/...
```

**Solution**: Make sure you're running the command inside a Hyprland session. Check:
```bash
echo $HYPRLAND_INSTANCE_SIGNATURE
```

### Window Not Minimizing

- Check if window class is in `excludeWindowClasses`
- Verify window is not in `special:minimized` already
- Check Hyprland logs: `hyprctl monitor`

### Rofi/Wofi Not Found

Install one of them:
```bash
# For rofi
sudo apt install rofi

# For wofi
sudo apt install wofi
```

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

BSD 2-Clause License - See LICENSE file

## Original Project

This is a reimplementation of [hyprland-minimizer](https://github.com/denisdubochevalier/hyprland-minimizer) (Rust) using Node.js and the Hyprland Lua API.

## References

- [Hyprland Wiki - Expanding Functionality](https://wiki.hypr.land/Configuring/Advanced-and-Cool/Expanding-functionality/)
- [Hyprland Socket IPC](https://wiki.hypr.land/IPC/)
- [Hyprland Lua API Documentation](https://wiki.hypr.land)
