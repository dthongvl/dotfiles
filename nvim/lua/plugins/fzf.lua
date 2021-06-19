local map = vim.api.nvim_set_keymap
local env = vim.env

map('n', '<leader>p', ':Files<CR>', { noremap = true, silent = true })
map('n', '<leader>r', ':Rg<CR>', { noremap = true, silent = true })
map('n', '<leader>b', ':Buffers<CR>', { noremap = true, silent = true })

env.FZF_DEFAULT_COMMAND = 'rg --files --hidden'
env.FZF_DEFAULT_OPTS = '--layout=reverse'
