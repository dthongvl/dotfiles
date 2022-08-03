local global = vim.g
local map = vim.api.nvim_set_keymap

global.copilot_no_tab_map = true
map("i", "<C-J>", 'copilot#Accept("<CR>")', { silent = true, expr = true })
