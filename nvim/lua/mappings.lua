local map = vim.api.nvim_set_keymap

-- common
map('n', '<CR>', '<ESC>:noh<CR>', { silent = true })
map('n', '<leader>w', ':w!<CR>', {})
map('n', '<leader>q', ':q<CR>', {})
map('n', 'Y', 'y$', {})
map('i', 'jj', '<Esc>', {})

map('n', '<S-Tab>', '<<', { noremap = true })
map('n', '<Tab>', '>>', { noremap = true })
map('v', '<S-Tab>', '<gv', { noremap = true })
map('v', '<Tab>', '>gv', { noremap = true })

-- search
map('', '/', '<Plug>(incsearch-forward)', {})
map('', '?', '<Plug>(incsearch-backward)', {})

-- tabs
map('', '<leader>tn', ':tabnew<CR>', {})
map('', '<leader>tc', ':tabclose<CR>', {})

map('', '<leader>1', '1gt', { noremap = true })
map('', '<leader>2', '2gt', { noremap = true })
map('', '<leader>3', '3gt', { noremap = true })
map('', '<leader>4', '4gt', { noremap = true })
map('', '<leader>5', '5gt', { noremap = true })
map('', '<leader>6', '6gt', { noremap = true })
map('', '<leader>7', '7gt', { noremap = true })
map('', '<leader>8', '8gt', { noremap = true })
map('', '<leader>9', '9gt', { noremap = true })
map('', '<leader>0', ':tablast<CR>', { noremap = true })

-- windows
map('', '<C-j>', '<C-W>j', {})
map('', '<C-k>', '<C-W>k', {})
map('', '<C-l>', '<C-W>l', {})
map('', '<C-h>', '<C-W>h', {})

-- buffers
map('', '<leader>l', ':bnext<CR>', {})
map('', '<leader>h', ':bprevious<CR>', {})
