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

-- windows
map('', '<C-j>', '<C-W>j', {})
map('', '<C-k>', '<C-W>k', {})
map('', '<C-l>', '<C-W>l', {})
map('', '<C-h>', '<C-W>h', {})

-- move line
map('n', '<A-j>', ':m .+1<CR>==', { noremap = true })
map('n', '<A-k>', ':m .-2<CR>==', { noremap = true })
map('i', '<A-j>', '<Esc>:m .+1<CR>==gi', { noremap = true })
map('i', '<A-k>', '<Esc>:m .-2<CR>==gi', { noremap = true })
map('v', '<A-j>', ":m '>+1<CR>gv=gv", { noremap = true })
map('v', '<A-k>', ":m '<-2<CR>gv=gv", { noremap = true })
