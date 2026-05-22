# hyprminimizer

Minimize windows to tray for Hyprland using D-Bus StatusNotifierItem.

## Install

```sh
make install   # copies to /opt/hyprminimizer, creates /usr/local/bin/hyprminimizer
make uninstall # removes both
```

## Usage

```
hyprminimizer [minimize|restore-last|menu|list|generate-config]
```

Keybinds (`hyprland.conf`):
```
bind = $mainMod, M, exec, hyprminimizer
bind = $mainMod SHIFT, M, exec, hyprminimizer restore-last
```

## How it works

`hyprminimizer minimize` grabs the active window, moves it to your current workspace's hidden state, and puts a tray icon via D-Bus. Click the icon to restore the window to your current workspace and focus it. A temp file stack tracks minimized windows per-workspace.

## Requirements

- Hyprland 0.55+ (Lua API + socket IPC)
- Node.js 16+
- D-Bus session bus (for tray)
