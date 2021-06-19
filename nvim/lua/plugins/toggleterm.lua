local map = vim.api.nvim_set_keymap

require'toggleterm'.setup{}

map('n', '<leader>t', ':ToggleTerm<CR>', {})
