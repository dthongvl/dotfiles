local map = vim.api.nvim_set_keymap
local diffview = require('diffview')

diffview.setup {
  use_icons = false
}
map('n', '<leader>do', '<ESC>:DiffviewOpen<CR>', { noremap = true, silent = true })
map('n', '<leader>dc', '<ESC>:DiffviewClose<CR>', { noremap = true, silent = true })