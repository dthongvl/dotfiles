local map = vim.api.nvim_set_keymap

map('n', '<leader>gt', ':call TimeLapse()<CR>', { noremap = true })
map('n', '<leader>gb', ':Git blame<CR>', { noremap = true })
map('n', '<leader>gd', ':Git diff<CR>', { noremap = true })

-- diffview

local diffview = require('diffview')

diffview.setup {
  file_panel = {
    use_icons = false
  }
}
map('n', '<leader>do', '<ESC>:DiffviewOpen<CR>', { noremap = true, silent = true })
map('n', '<leader>dc', '<ESC>:DiffviewClose<CR>', { noremap = true, silent = true })


-- neogit

require('neogit').setup {
  integrations = {
    diffview = true
  }
}

map('n', '<c-g>', ':Neogit<CR>', { noremap = true, silent = true })
