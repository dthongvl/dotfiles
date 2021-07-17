local map = vim.api.nvim_set_keymap

-- map('n', '<leader>p', [[<Cmd>lua require('telescope.builtin').find_files()<CR>]], { noremap = true, silent = true })
-- map('n', '<leader>r', [[<Cmd>lua require('telescope.builtin').live_grep()<CR>]], { noremap = true, silent = true })
map('n', '<leader>b', [[<Cmd>lua require('telescope.builtin').buffers()<CR>]], { noremap = true, silent = true })
