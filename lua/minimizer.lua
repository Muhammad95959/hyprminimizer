-- Hyprland Minimizer Lua Integration Example
-- This demonstrates how to use hyprminimizer with Hyprland's Lua API (0.55+)
-- Place this in your Hyprland config directory or load it via exec in hyprland.conf

-- Configuration
local MINIMIZER_CMD = "hyprminimizer"
local MINIMIZE_KEY = "m"
local RESTORE_KEY = "shift, m"
local MENU_KEY = "super, c"

-- Function to minimize the active window
function minimize_window()
    os.execute(MINIMIZER_CMD .. " minimize")
end

-- Function to restore the last minimized window
function restore_last_window()
    os.execute(MINIMIZER_CMD .. " restore-last")
end

-- Function to show restore menu
function show_restore_menu()
    os.execute(MINIMIZER_CMD .. " menu")
end

-- Function to list minimized windows
function list_minimized()
    os.execute(MINIMIZER_CMD .. " list")
end

-- Listen to Hyprland events via Lua API
-- Example of listening to window focus events
function on_window_opened()
    -- Custom logic when a window opens
end

function on_window_closed()
    -- Custom logic when a window closes
end

-- Return the module for use in other Lua scripts
return {
    minimize_window = minimize_window,
    restore_last_window = restore_last_window,
    show_restore_menu = show_restore_menu,
    list_minimized = list_minimized,
    on_window_opened = on_window_opened,
    on_window_closed = on_window_closed
}
