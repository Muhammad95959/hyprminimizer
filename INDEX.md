# Hyprland Minimizer (Lua/Node.js) - Documentation Index

Welcome! This is a complete Node.js reimplementation of the Hyprland minimizer utility, designed for Hyprland 0.55+ with Lua API support.

## 📚 Documentation Structure

### Getting Started
1. **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Start here!
   - What was created
   - Complete overview
   - Quick overview of features

2. **[QUICKSTART.md](QUICKSTART.md)** - Installation & First Use
   - Step-by-step setup
   - First commands to run
   - Troubleshooting tips

3. **[README.md](README.md)** - Full Documentation
   - Detailed feature list
   - Configuration options
   - Architecture explanation
   - Lua integration examples

4. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical Deep Dive
   - System design
   - Component details
   - Data flow diagrams
   - Socket protocol details

## 📁 Code Structure

```
src/                    Main application
├── index.js           CLI entry point
├── hyprland-socket.js Unix socket IPC client
├── window-manager.js  Window operations
└── config.js          Configuration management

lua/                   Lua API integration
├── minimizer.lua      Basic examples
└── events.lua         Advanced examples

config/                Configuration templates
└── default-config.json
```

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Show help
node src/index.js --help

# Generate config
node src/index.js generate-config

# Test minimize
node src/index.js

# Test restore
node src/index.js restore-last

# Test menu
node src/index.js menu
```

## 🎯 Common Tasks

### I want to...

**...understand what this project does**
→ Read [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

**...set up the project**
→ Follow [QUICKSTART.md](QUICKSTART.md)

**...understand how it works**
→ Read [ARCHITECTURE.md](ARCHITECTURE.md)

**...configure options**
→ Check [README.md](README.md) Configuration section

**...extend with Lua scripts**
→ See `lua/` directory and [README.md](README.md) Lua Integration

**...understand the code**
→ Read [ARCHITECTURE.md](ARCHITECTURE.md) and source files

## 📋 File Guide

| File | Purpose | Read If... |
|------|---------|-----------|
| PROJECT_SUMMARY.md | Overview & quick reference | You just got the project |
| QUICKSTART.md | Setup & first use | You want to get started now |
| README.md | Full documentation | You want complete details |
| ARCHITECTURE.md | Technical details | You want to understand internals |
| package.json | Dependencies & scripts | You need to understand setup |
| src/index.js | CLI handler | You want to understand entry point |
| src/hyprland-socket.js | IPC communication | You want to see socket code |
| src/window-manager.js | Core logic | You want to see business logic |
| src/config.js | Configuration | You want to understand config system |
| lua/minimizer.lua | Lua integration | You want Lua examples |
| lua/events.lua | Lua events | You want advanced Lua |

## 🔍 Finding Answers

### Setup Questions
→ **[QUICKSTART.md](QUICKSTART.md)** > Installation section

### Feature Questions
→ **[README.md](README.md)** > Features section

### Configuration Questions
→ **[README.md](README.md)** > Configuration section

### How It Works
→ **[ARCHITECTURE.md](ARCHITECTURE.md)** > System Design

### Code Structure
→ **[ARCHITECTURE.md](ARCHITECTURE.md)** > Component Details

### Lua Integration
→ **[README.md](README.md)** > Lua Integration + `lua/` directory

### Troubleshooting
→ **[QUICKSTART.md](QUICKSTART.md)** > Troubleshooting section

## 🛠️ Development

### Main Entry Points

**CLI Command Handler:** `src/index.js:main()`
- Routes commands to appropriate handler
- Handles help and error messages

**Window Operations:** `src/window-manager.js:WindowManager`
- `minimizeActiveWindow()` - Main minimize logic
- `restoreLastWindow()` - Main restore logic
- `showRestoreMenu()` - Interactive menu

**IPC Communication:** `src/hyprland-socket.js:HyprlandSocket`
- `connect()` - Connect to Hyprland
- `command()` - Send commands
- `moveToSpecialWorkspace()` - Minimize
- `restoreFromSpecial()` - Restore

### Key Concepts

**Socket IPC**: Direct Unix socket communication with Hyprland
→ See ARCHITECTURE.md > Socket IPC Commands

**Special Workspace**: Hidden workspace for minimized windows
→ See README.md > How It Works

**State Management**: JSON files storing minimized windows
→ See ARCHITECTURE.md > State Management

**Lua Integration**: Extending via Lua scripts
→ See lua/ directory and README.md > Lua Integration

## 📞 Need Help?

1. **Setup Issues?** → Read QUICKSTART.md > Troubleshooting
2. **Feature Questions?** → Check README.md
3. **Understanding Code?** → See ARCHITECTURE.md
4. **Extending Project?** → Look at lua/ examples
5. **Still stuck?** → Review PROJECT_SUMMARY.md

## 📝 Notes

- This is a **modern implementation** using Hyprland 0.55+ features
- Uses **Socket IPC** instead of spawning hyprctl (faster)
- Built with **Node.js** for ease of understanding and extension
- Includes **Lua API** support for advanced customization
- Fully **documented** with 4 comprehensive guides

## 🎓 Learning Path

```
START HERE
    ↓
PROJECT_SUMMARY.md (overview)
    ↓
QUICKSTART.md (setup)
    ↓
README.md (full features)
    ↓
ARCHITECTURE.md (technical)
    ↓
src/ code (implementation)
    ↓
lua/ examples (extension)
```

---

**Ready to dive in?** Start with [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)!
