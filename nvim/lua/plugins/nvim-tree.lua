local map = vim.api.nvim_set_keymap
local global = vim.g

global.nvim_tree_auto_close = 1
global.nvim_tree_show_icons = {
  git = 0,
  folders = 0,
  files = 0,
  folder_arrows = 1,
}

map('n', '<leader>n', ':NvimTreeToggle<CR>', {})
map('n', '<leader>f', ':NvimTreeFindFile<CR>', {})
