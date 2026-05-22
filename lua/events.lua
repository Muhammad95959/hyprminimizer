-- Hyprland Minimizer - Advanced Lua Configuration Example
-- This file shows how to integrate minimizer with event listeners

local minimizer = require('minimizer')

-- Advanced: Listen to Hyprland events
-- These are examples using Hyprland's Lua event system (0.55+)

-- Event: When a window is created
local function on_window_created(window_info)
    -- Could exclude certain windows from being minimized
    if window_info.class == "waybar" or window_info.class == "dunst" then
        return -- Skip these windows
    end
end

-- Event: When a window is destroyed
local function on_window_destroyed(window_info)
    -- Clean up any references to the destroyed window
end

-- Event: When minimizer minimizes a window
local function on_window_minimized(window_id, window_info)
    -- Send notification (if enabled in config)
    local title = window_info.title or "Window"
    os.execute(string.format("notify-send 'Minimized' '%s'", title))
end

-- Event: When minimizer restores a window
local function on_window_restored(window_id, window_info)
    -- Send notification
    local title = window_info.title or "Window"
    os.execute(string.format("notify-send 'Restored' '%s'", title))
end

-- Custom logic: Only minimize if window meets certain criteria
local function can_minimize_window(window_info)
    -- Example: Don't minimize floating windows
    if window_info.floating then
        return false
    end
    
    -- Example: Don't minimize fullscreen windows
    if window_info.fullscreen then
        return false
    end
    
    return true
end

-- Export event handlers
return {
    on_window_created = on_window_created,
    on_window_destroyed = on_window_destroyed,
    on_window_minimized = on_window_minimized,
    on_window_restored = on_window_restored,
    can_minimize_window = can_minimize_window
}
