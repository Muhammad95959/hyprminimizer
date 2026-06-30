# hyprminimizer

Minimize windows to tray for Hyprland using D-Bus StatusNotifierItem.

## Demo

https://github.com/user-attachments/assets/0cf51501-41b0-4f16-8236-04b931969584

## Install

**AUR**:
```sh
yay -S hyprminimizer-git
# or
paru -S hyprminimizer-git
```

**Manual**:
```sh
git clone https://github.com/Muhammad95959/hyprminimizer
cd hyprminimizer
sudo make install
```

## Usage

```
hyprminimizer [COMMAND]

Commands:
  minimize [address]    Minimize the active window (or by window address)
  restore-last          Restore the last minimized window
  menu                  Show interactive restore menu (via rofi)
  list                  List all minimized windows
  cleanup               Kill stale tray icons (orphaned after restore)
  help                  Show this help message
  generate-config       Generate default config at ~/.config/hyprminimizer/config.json
```

Minimize a window by address (get it from `hyprctl clients`):

```sh
hyprminimizer minimize 0x12345678
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
| `restoreToCurrentWorkspace` | `true` | Restore to focused workspace instead of original |
| `iconPack` | `{}` | Map window classes to icon names. Falls back to the class name if unset |

## How it works

`hyprminimizer minimize` grabs the active window, moves it to the `special:minimized` workspace, and puts a tray icon via D-Bus. Click the icon to restore the window to your current workspace and focus it. Minimized windows are tracked in `/tmp/hyprminimizer-minimized.json` (auto-cleared on reboot).

## Requirements

- Hyprland 0.55+ (Lua API + socket IPC)
- Node.js 16+
- D-Bus session bus (for tray)

## Acknowledgements

This project is inspired by [hyprland-minimizer](https://github.com/denisdubochevalier/hyprland-minimizer) by denisdubochevalier.
