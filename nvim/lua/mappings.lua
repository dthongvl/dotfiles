local map = vim.api.nvim_set_keymap

-- common
map('n', '<CR>', '<ESC>:noh<CR>', { silent = true })
map('n', '<leader>w', ':w!<CR>', {})
map('n', 'Y', 'y$', {})
map('n', '<leader>q', ':bd<CR>', {})
map('i', 'jj', '<Esc>', {})

-- search
map('', '/', '<Plug>(incsearch-forward)', {})
map('', '?', '<Plug>(incsearch-backward)', {})

-- tabs
map('', '<leader>tn', ':tabnew<CR>', {})
map('', '<leader>tc', ':tabclose<CR>', {})

-- windows
map('', '<C-j>', '<C-W>j', {})
map('', '<C-k>', '<C-W>k', {})
map('', '<C-l>', '<C-W>l', {})
map('', '<C-h>', '<C-W>h', {})
