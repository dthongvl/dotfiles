local map = vim.api.nvim_set_keymap

require('neogit').setup {
  integrations = {
    diffview = true
  }
}

map('n', '<c-g>', ':Neogit<CR>', { noremap = true, silent = true })
