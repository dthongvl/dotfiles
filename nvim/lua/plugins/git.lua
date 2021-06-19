local map = vim.api.nvim_set_keymap

map('n', '<leader>gt', ':call TimeLapse()<CR>', { noremap = true })
map('n', '<leader>gb', ':Git blame<CR>', { noremap = true })
map('n', '<leader>gd', ':Git diff<CR>', { noremap = true })
