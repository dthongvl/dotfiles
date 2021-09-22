local map = vim.api.nvim_set_keymap
local global = vim.g

global.NERDSpaceDelims = 1

map('', '<C-_>', '<Plug>NERDCommenterToggle', {})
