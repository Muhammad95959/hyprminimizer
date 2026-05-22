# Hyprland Minimizer - Quick Start Guide

## Installation

### 1. Prerequisites

Make sure you have:
- Hyprland 0.55 or newer
- Node.js 16+
- npm (comes with Node.js)
- `rofi` or `wofi` installed

```bash
# Check Hyprland version
hyprctl version

# Check Node.js version
node --version
npm --version

# Install rofi (if not already installed)
sudo apt install rofi  # Debian/Ubuntu
sudo pacman -S rofi    # Arch
```

### 2. Clone and Install

```bash
# Clone the repository
git clone <repository-url> ~/hyprland-minimizer-lua
cd ~/hyprland-minimizer-lua

# Install dependencies
npm install

# Create a global symlink for easy CLI access (optional)
sudo npm link
```

### 3. Generate Configuration

```bash
hyprland-minimizer-lua generate-config
```

This creates the config directory and default settings at:
```
~/.config/hyprland-minimizer-lua/config.json
```

### 4. Add Keybindings to Hyprland

Edit your `~/.config/hypr/hyprland.conf` and add:

```ini
# === Minimizer Keybindings ===
# Minimize active window (Super+M)
bind = $mainMod, m, exec, hyprland-minimizer-lua

# Restore last minimized window (Super+Shift+M)  
bind = $mainMod SHIFT, m, exec, hyprland-minimizer-lua restore-last

# Show interactive restore menu (Super+C)
bind = $mainMod, c, exec, hyprland-minimizer-lua menu
```

### 5. Test It!

```bash
# Minimize the active window
hyprland-minimizer-lua

# Restore the last one
hyprland-minimizer-lua restore-last

# List all minimized windows
hyprland-minimizer-lua list
```

## Usage

### Commands

```bash
# Default: minimize active window
hyprland-minimizer-lua

# Restore the last minimized window
hyprland-minimizer-lua restore-last

# Show interactive menu to select window
hyprland-minimizer-lua menu

# List all minimized windows
hyprland-minimizer-lua list

# Generate default config
hyprland-minimizer-lua generate-config

# Show help
hyprland-minimizer-lua --help
```

### Advanced: Customizing Configuration

Edit `~/.config/hyprland-minimizer-lua/config.json`:

```json
{
  "specialWorkspace": "minimized",        // Name of hidden workspace
  "trayModule": "systemtray",             // For system tray integration
  "restoreLauncher": "rofi",              // rofi or wofi
  "restoreLauncherArgs": "-dmenu -p \"Select window:\"",
  "maxMinimizedWindows": 50,              // How many to remember
  "excludeWindowClasses": [               // Can't minimize these
    "waybar",
    "dunst",
    "swaylock"
  ],
  "enableNotifications": true             // Show notifications
}
```

### Advanced: Using with Lua

If you want to extend functionality with Lua scripts, check out:
- `lua/minimizer.lua` - Basic integration examples
- `lua/events.lua` - Advanced event handling examples

## Troubleshooting

### Command Not Found

If `hyprland-minimizer-lua` is not in your PATH:

```bash
# Use full path
~/hyprland-minimizer-lua/src/index.js minimize

# Or use npm
npm start -- minimize  # from project directory

# Or install globally
sudo npm link
```

### Socket Connection Error

```
Error: HYPRLAND_INSTANCE_SIGNATURE environment variable not set
```

This means you're not running inside a Hyprland session. Make sure:
```bash
echo $HYPRLAND_INSTANCE_SIGNATURE  # Should show something like: 0
```

### Window Not Minimizing

1. Check if the window class is in your exclusion list
2. Try without any specific window rules
3. Check Hyprland logs:
   ```bash
   hyprctl logs | tail -20
   ```

### Rofi Menu Not Appearing

Make sure rofi is installed and working:
```bash
# Test rofi
echo -e "Option 1\nOption 2\nOption 3" | rofi -dmenu
```

If that works but minimizer menu doesn't, try using `wofi` instead:
```bash
# Edit config to use wofi
nano ~/.config/hyprland-minimizer-lua/config.json
# Change "restoreLauncher" to "wofi"
```

## Tips & Tricks

### Use with Waybar System Tray

To show minimized window indicators in Waybar, add to your `waybar/config.jsonc`:

```json
"modules-right": [
  "tray",
  "clock"
]
```

### Notifications Integration

Minimizer can send notifications when minimizing/restoring windows.
Make sure you have a notification daemon running:

```bash
# For GNOME
sudo apt install gnome-shell-notification-daemon

# For other desktops, use dunst
sudo apt install dunst
```

### Custom Launcher

Want to use a different launcher? Change in config:

```json
"restoreLauncher": "dmenu",
"restoreLauncherArgs": "-l 10"
```

Or use `fzf`:

```json
"restoreLauncher": "fzf",
"restoreLauncherArgs": "--preview 'echo {}'"
```

## Uninstall

```bash
# Remove global link
sudo npm unlink hyprland-minimizer-lua

# Remove config and data
rm -rf ~/.config/hyprland-minimizer-lua

# Remove the cloned directory
rm -rf ~/hyprland-minimizer-lua
```

## Next Steps

- Check the full [README.md](README.md) for advanced topics
- Explore `lua/` directory for Lua API integration examples
- Report issues on GitHub
- Contribute improvements!

## Support

- **Documentation**: See [README.md](README.md)
- **Hyprland Wiki**: https://wiki.hypr.land/Configuring/Advanced-and-Cool/Expanding-functionality/
- **Issues**: Report on GitHub
