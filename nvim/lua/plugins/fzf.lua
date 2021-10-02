local map = vim.api.nvim_set_keymap
local env = vim.env

-- map('n', '<C-p>', ':Files<CR>', { noremap = true, silent = true })
-- map('n', '<leader>r', ':Rg<CR>', { noremap = true, silent = true })
-- map('n', '<C-b>', ':Buffers<CR>', { noremap = true, silent = true })

env.FZF_DEFAULT_COMMAND = 'rg --files --hidden --smart-case'
env.FZF_DEFAULT_OPTS = '--layout=reverse'
