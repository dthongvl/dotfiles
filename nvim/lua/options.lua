local cmd = vim.cmd
local global = vim.g
local opt = vim.opt


global.mapleader = ' '

cmd('syntax on')
cmd('filetype plugin indent on')

opt.background = 'dark'
opt.hidden = true

-- compe
opt.completeopt = 'menuone,noselect'

-- view
opt.wildmenu = true
opt.updatetime = 300
opt.signcolumn = 'yes'
opt.number = true
opt.relativenumber = true
opt.cmdheight = 2
opt.termguicolors = true
opt.autoindent = true
opt.si = true
opt.wrap = false

-- auto read/write
opt.autoread = true
opt.autowrite =true

-- search
opt.ignorecase = true
opt.smartcase = true
opt.hlsearch = true
opt.incsearch = true

-- fold
opt.foldmethod = 'indent'
opt.foldlevel = 99

-- use mouse
opt.mouse = 'a'

-- window
opt.splitbelow = true
opt.splitright = true

-- tab
opt.expandtab = true
opt.tabstop = 2
opt.softtabstop = 2
opt.shiftwidth = 2

-- backup
opt.backup = false
opt.swapfile = false

-- clipboard
opt.clipboard = 'unnamedplus'

cmd('colorscheme deep-space')
