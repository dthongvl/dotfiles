local map = vim.api.nvim_set_keymap

require('gitsigns').setup{}

vim.cmd [[command! GitBlame lua require"gitsigns".blame_line()]]

map('n', '<leader>gb', ':GitBlame<CR>', { noremap = true, silent = true })
