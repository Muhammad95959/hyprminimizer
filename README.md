# hyprminimizer

Minimize windows to tray for Hyprland using D-Bus StatusNotifierItem.

## Install

```sh
make install   # copies to /opt/hyprminimizer, creates /usr/local/bin/hyprminimizer
make uninstall # removes both
```

## Usage

```
hyprminimizer [COMMAND]

Commands:
  minimize [address]     Minimize the active window (or by window address)
  restore-last          Restore the last minimized window
  menu                  Show interactive restore menu (via rofi)
  list                  List all minimized windows
  help                  Show this help message
  generate-config       Generate default config at ~/.config/hyprminimizer/config.json

Options:
  -h, --help            Show help
  --generate-config     Generate default config
```

Keybinds (`hyprland.lua`):
```lua
hl.bind("$mainMod + M",             hl.dsp.exec_cmd("hyprminimizer minimize"))
hl.bind("$mainMod SHIFT + M",       hl.dsp.exec_cmd("hyprminimizer restore-last"))
hl.bind("$mainMod + C",             hl.dsp.exec_cmd("hyprminimizer menu"))
```

Get a window address from `hyprctl clients` or `hyprminimizer list` and minimize it directly:

```sh
hyprminimizer minimize 0x12345678
```

## Configuration

`~/.config/hyprminimizer/config.json`:

```json
{
  "specialWorkspace": "minimized",
  "restoreLauncher": "rofi",
  "restoreLauncherArgs": "-dmenu -p \"Restore window:\"",
  "maxMinimizedWindows": 50,
  "excludeWindowClasses": ["waybar", "mako", "hyprlock"],
  "useDBusTray": true,
  "dbusServiceName": "org.hyprminimizer",
  "stackBaseDirectory": "/tmp",
  "restoreToCurrentWorkspace": true,
  "iconPack": {
    "firefox": "firefox",
    "Alacritty": "alacritty",
    "Code": "code",
    "google-chrome": "google-chrome"
  }
}
```

| Key | Default | Description |
|---|---|---|
| `specialWorkspace` | `"minimized"` | Special workspace name for hidden windows |
| `restoreLauncher` | `"rofi"` | Launcher binary for the restore menu |
| `restoreLauncherArgs` | `"-dmenu -p \"Restore window:\""` | Args passed to the launcher |
| `maxMinimizedWindows` | `50` | Trim limit before rotating out old entries |
| `excludeWindowClasses` | `["waybar","mako","hyprlock"]` | Window classes to never minimize |
| `useDBusTray` | `true` | Enable D-Bus tray icons on minimize |
| `dbusServiceName` | `"org.hyprminimizer"` | D-Bus bus name prefix |
| `stackBaseDirectory` | `"/tmp"` | Directory for the stack file |
| `restoreToCurrentWorkspace` | `true` | Restore to focused workspace instead of original |
| `iconPack` | `{}` | Map window classes to icon names. Falls back to the class name if unset |

## How it works

`hyprminimizer minimize` grabs the active window, moves it to your current workspace's hidden state, and puts a tray icon via D-Bus. Click the icon to restore the window to your current workspace and focus it. A temp file stack tracks minimized windows per-workspace.

## Requirements

- Hyprland 0.55+ (Lua API + socket IPC)
- Node.js 16+
- D-Bus session bus (for tray)
