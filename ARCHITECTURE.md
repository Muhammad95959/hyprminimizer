# Architecture Documentation

## Overview

Hyprland Minimizer (Lua/Node.js) is a modern reimplementation of the minimize-to-tray functionality for Hyprland, using:
- **Node.js** for the main application
- **Hyprland Socket IPC** (0.55+) for window management
- **Lua API** for extensibility

## System Design

```
┌─────────────────────────────────┐
│     Hyprland Minimizer CLI      │ (Node.js Entry Point)
│  (src/index.js - minimist args) │
└────────────┬────────────────────┘
             │
        ┌────┴─────────────┬─────────────────┐
        │                  │                  │
   ┌────▼───┐      ┌──────▼─────┐    ┌──────▼──────┐
   │ minimize│     │restore-last │   │interactive  │
   │ active  │     │ minimized   │   │ menu        │
   │window   │     │ window      │   │ selector    │
   └────┬───┘      └──────┬─────┘    └──────┬──────┘
        │                 │                  │
        └─────────────────┬──────────────────┘
                          │
               ┌──────────▼──────────┐
               │ WindowManager       │
               │ (window-manager.js) │
               └──────────┬──────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   ┌────▼─────────┐ ┌────▼────────┐ ┌──────▼───────┐
   │ HyprlandSocket│ │ Config      │ │ State Files  │
   │ (socket IPC)  │ │ Management  │ │ (JSON)       │
   └────┬─────────┘ └────┬────────┘ └──────┬───────┘
        │                │                 │
   ┌────▼─────────────────┼─────────────────▼──┐
   │   Unix Socket         │  JSON Config Files │
   │   /run/user/X/hypr/Y  │  ~/.config/...     │
   │   .socket.sock        │                    │
   └────────────┬──────────┴────────────────────┘
                │
         ┌──────▼───────┐
         │   Hyprland   │
         │  Compositor  │
         │              │
         └──────────────┘
```

## Component Details

### 1. CLI Entry Point (`src/index.js`)

**Responsibilities:**
- Parse command-line arguments using `minimist`
- Route commands to appropriate handlers
- Display help and error messages
- Handle process exit codes

**Interface:**
```javascript
main()
  ├── Generate config
  ├── Show help
  └── Route to WindowManager
```

### 2. HyprlandSocket (`src/hyprland-socket.js`)

**Responsibilities:**
- Establish connection to Hyprland IPC socket
- Send and receive commands via Unix socket
- Handle socket errors and timeouts
- Parse Hyprland responses

**Key Methods:**
```javascript
connect()               // Connect to socket
command(cmd)            // Send command, get response
getActiveWindow()       // Get active window info
getAllWindows()         // Get all windows
moveToSpecialWorkspace()// Move window to special workspace
restoreFromSpecial()    // Move window back
```

**Socket Protocol:**
- **Type**: Unix domain socket
- **Path**: `$XDG_RUNTIME_DIR/hypr/$HYPRLAND_INSTANCE_SIGNATURE/.socket.sock`
- **Format**: Text-based commands
- **Timeout**: 5 seconds per command

### 3. WindowManager (`src/window-manager.js`)

**Responsibilities:**
- High-level window operations
- Manage minimized windows state
- Coordinate between socket and config
- Handle minimize/restore logic

**Key Methods:**
```javascript
minimizeActiveWindow()   // Minimize active window
restoreLastWindow()      // Restore last minimized
showRestoreMenu()        // Show interactive menu
listMinimized()          // List all minimized
```

**Flow: Minimize Operation**
```
minimizeActiveWindow()
  ├── Get active window ID
  ├── Check exclusions
  ├── Move to special:minimized workspace
  ├── Add to minimized list
  └── Save state
```

**Flow: Restore Operation**
```
restoreLastWindow()
  ├── Load minimized windows list
  ├── Pop last window
  ├── Restore to current workspace
  ├── Update state
  └── Send notification (optional)
```

### 4. Config Management (`src/config.js`)

**Responsibilities:**
- Load/save configuration
- Manage minimized windows state
- Handle default values
- Create config directories

**Files:**
```
~/.config/hyprland-minimizer-lua/
├── config.json              # User configuration
└── minimized-windows.json   # Current state
```

**Default Configuration:**
```json
{
  "specialWorkspace": "minimized",
  "trayModule": "systemtray",
  "restoreLauncher": "rofi",
  "maxMinimizedWindows": 50,
  "excludeWindowClasses": ["waybar", "dunst"],
  "enableNotifications": true
}
```

## Data Flow

### Minimize Workflow

```
User presses Super+M
    │
    ▼
hyprland-minimizer-lua (index.js)
    │
    ▼
WindowManager.minimizeActiveWindow()
    │
    ├─► HyprlandSocket.getActiveWindow()
    │       └─► Read from socket
    │           └─► Get window ID
    │
    ├─► HyprlandSocket.moveToSpecialWorkspace()
    │       └─► Send dispatch command
    │           └─► Window moves to special:minimized
    │
    └─► Config.saveMinimizedState()
            └─► Update minimized-windows.json
```

### Restore Workflow

```
User presses Super+Shift+M or selects from menu
    │
    ▼
hyprland-minimizer-lua (index.js)
    │
    ▼
WindowManager.restoreLastWindow()
    │
    ├─► Config.loadMinimizedState()
    │       └─► Read minimized-windows.json
    │
    ├─► HyprlandSocket.restoreFromSpecial()
    │       └─► Send dispatch command
    │           └─► Window moves back to workspace
    │
    └─► Config.saveMinimizedState()
            └─► Update state file
```

## Socket IPC Commands

### Minimize a Window
```
dispatch movetoworkspace special:minimized,address:0xABCD1234
```

### Restore from Special
```
dispatch movetoworkspacesilent 1,address:0xABCD1234
```

### Get Active Window
```
activewindow
```

### Get All Windows
```
clients
```

## State Management

### Minimized Windows List

File: `~/.config/hyprland-minimizer-lua/minimized-windows.json`

```json
[
  {
    "id": "0xabc1234",
    "class": "firefox",
    "title": "GitHub - hyprland-minimizer",
    "timestamp": 1234567890
  },
  {
    "id": "0xdef5678",
    "class": "code",
    "title": "workspace.ts",
    "timestamp": 1234567900
  }
]
```

**Operations:**
- **Push**: Add minimized window (on minimize)
- **Pop**: Remove last window (on restore-last)
- **Filter**: Remove specific window (on menu restore)
- **Size**: Limited by `maxMinimizedWindows`

## Error Handling

### Connection Errors
```
HYPRLAND_INSTANCE_SIGNATURE not set
  └─► Error: Not running in Hyprland session
```

### Socket Errors
```
Socket timeout
  └─► Error: Command execution failed
```

### State Errors
```
Corrupted minimized-windows.json
  └─► Fallback to empty list
```

## Performance Considerations

### Socket IPC Efficiency
- **Minimal overhead**: No process spawning
- **Direct communication**: One-way socket connection
- **Timeout protection**: 5-second timeout per command

### State File Caching
- **In-memory tracking**: Minimized list loaded once per operation
- **Persistent storage**: JSON file for state recovery
- **Size limit**: Max 50 minimized windows (configurable)

## Extensibility

### Lua Integration
```lua
-- lua/minimizer.lua
local minimizer = require('minimizer')
minimizer.minimize_window()  -- Call from Lua
```

### Custom Launchers
```json
// config.json
"restoreLauncher": "fzf",
"restoreLauncherArgs": "--multi"
```

### Custom Notifications
```json
"notificationCommand": "notify-send -u low",
"enableNotifications": true
```

## Testing Strategy

### Unit Tests
- Socket command parsing
- State file I/O
- Config loading
- Window ID extraction

### Integration Tests
- Full minimize/restore cycle
- Interactive menu flow
- Error conditions
- Config generation

### Manual Testing
```bash
npm run test:minimize
npm run test:restore
npm run test:menu
```

## Security Considerations

### Socket Access
- Unix socket permissions (user-only by default)
- No authentication required (same user)
- Command validation before execution

### File Permissions
- Config directory: 700 (user only)
- State file: 600 (user only)

### No Privilege Escalation
- Cannot run commands as root
- No D-Bus access needed (optional)
- Pure IPC approach

## Future Enhancements

1. **D-Bus Tray Integration**
   - StatusNotifierItem protocol
   - Visual tray icons
   - Context menus

2. **Advanced Features**
   - Window groups
   - Workspace-aware restoration
   - Animation effects

3. **Lua Event System**
   - Window lifecycle hooks
   - Custom minimize conditions
   - Integration with Hyprland events

4. **GUI Dashboard**
   - Visual minimized windows list
   - Drag-and-drop restore
   - Quick settings panel
