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

## hyprland.lua example

```lua
local function restore_minimized()
  local minimized = {}
  for _, win in ipairs(hl.get_windows()) do
    if win.workspace ~= nil and win.workspace.name == "special:minimized" then
      table.insert(minimized, win)
    end
  end
  if #minimized > 1 then
    hl.dispatch(hl.dsp.exec_cmd("hyprminimizer menu"))
  else
    hl.dispatch(hl.dsp.exec_cmd("hyprminimizer restore-last"))
  end
end

hl.bind("SUPER + M",           hl.dsp.exec_cmd("hyprminimizer"))
hl.bind("SUPER + SHIFT + M",   restore_minimized)
```

Minimize a window by address (get it from `hyprctl clients`):

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
