local map = vim.api.nvim_set_keymap
local global = vim.g

global.NERDTreeMapOpenVSplit = 'v'
global.NERDTreeMapOpenSplit = 'x'
global.NERDTreeMapOpenInTab = 't'
global.NERDTreeMinimalUI = 1
global.NERDTreeDirArrows = 1

map('n', '<leader>n', ':NERDTreeToggle<CR>', {})
map('n', '<leader>f', ':NERDTreeFind<CR>', {})
