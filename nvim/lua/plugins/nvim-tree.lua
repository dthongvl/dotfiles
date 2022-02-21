local map = vim.api.nvim_set_keymap
local global = vim.g

global.nvim_tree_show_icons = {
  git = 0,
  folders = 1,
  files = 1,
  folder_arrows = 0,
}
global.nvim_tree_icons = {
  folder = {
    arrow_open = '♀',
    arrow_closed = '♂',
  },
}
global.nvim_tree_git_hl = 1

require'nvim-tree'.setup {
  auto_close = true,
  git = {
    ignore = true,
  },
}

map('n', '<leader>n', ':NvimTreeToggle<CR>', {})
map('n', '<leader>f', ':NvimTreeFindFile<CR>', {})
