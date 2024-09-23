-- Pull in the wezterm API
local wezterm = require 'wezterm'
local mux = wezterm.mux

-- This will hold the configuration.
local config = wezterm.config_builder()

wezterm.on('gui-startup', function(cmd)
  local tab, pane, window = mux.spawn_window(cmd or {})
  window:gui_window():maximize()
end)

-- This is where you actually apply your config choices
-- For example, changing the color scheme:
-- config.default_prog = { 'zellij' }
config.color_scheme = 'Catppuccin Frappe'
config.font_size = 16
config.font = wezterm.font('FantasqueSansM Nerd Font Propo', { stretch = 'Expanded' })
-- config.window_decorations = 'RESIZE'
config.window_padding = {
  left = 0,
  right = 0,
  top = 0,
  bottom = 0,
}

-- and finally, return the configuration to wezterm
return config
