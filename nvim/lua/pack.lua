local cmd = vim.cmd

require('packer').startup(function()
  use 'wbthomason/packer.nvim'

  -- buffer
  use 'haya14busa/incsearch.vim'
  use 'JoosepAlviste/nvim-ts-context-commentstring'
  use {
    'terrortylor/nvim-comment',
    config = [[require'plugins/nvim-comment']]
  }
  use {
    'akinsho/bufferline.nvim',
    requires = 'kyazdani42/nvim-web-devicons',
    config = [[require'plugins/bufferline']],
  }

  -- file
  use {
    'kyazdani42/nvim-tree.lua',
    requires = 'kyazdani42/nvim-web-devicons',
    config = [[require'plugins/nvim-tree']],
  }
  use 'junegunn/fzf.vim'
  use { 'junegunn/fzf', run = 'fzf#install', config = [[require'plugins/fzf']] }
  use {
    'nvim-telescope/telescope.nvim',
    requires = {
      {'nvim-lua/plenary.nvim'}
    },
    config = [[require'plugins/telescope']],
  }

  -- view
  -- use 'ap/vim-css-color'
  use {
    'norcalli/nvim-colorizer.lua',
    config = [[require'plugins/nvim-colorizer']],
  }
  use {
    "lukas-reineke/indent-blankline.nvim",
    config = [[require'plugins/indent-blankline']],
  }
  use {
    "windwp/windline.nvim",
    config = [[require'plugins/windline']],
  }
  -- use {
    -- 'hoob3rt/lualine.nvim',
    -- requires = {'kyazdani42/nvim-web-devicons', opt = true},
    -- config = [[require'plugins/lualine']],
  -- }

  -- theme
  use 'folke/tokyonight.nvim'
  use 'tyrannicaltoucan/vim-deep-space'
  use {
    "ellisonleao/gruvbox.nvim",
    requires = {"rktjmp/lush.nvim"},
  }
  use 'EdenEast/nightfox.nvim'

  -- navigation
  use 'christoomey/vim-tmux-navigator'

  -- git
  use 'tpope/vim-fugitive'
  use {
    'lewis6991/gitsigns.nvim',
    requires = {
      'nvim-lua/plenary.nvim'
    },
    config = [[require'plugins/gitsigns']],
  }
  use {
    'TimUntersberger/neogit',
    requires = 'nvim-lua/plenary.nvim',
    config = [[require'plugins/neogit']],
  }
  use {
    'sindrets/diffview.nvim',
    config = [[require'plugins/diffview']],
  }

  -- edit
  use 'tpope/vim-surround'            -- toggle surround
  use 'AndrewRadev/splitjoin.vim'     -- split and join in vim
  use {
    'windwp/nvim-autopairs',
    after = 'nvim-cmp',
    config = [[require'plugins/autopairs']],
  }

  -- devops
  use 'hashivim/vim-terraform'
  use 'pearofducks/ansible-vim'

  -- lsp
  use {
    'L3MON4D3/LuaSnip',
    config = [[require'plugins/luasnip']],
    opt = true,
  }
  use {
    'nvim-treesitter/nvim-treesitter',
    run = ':TSUpdate',
    config = [[require'plugins/treesitter']],
  }
  use {
    'neovim/nvim-lspconfig',
    config = [[require'plugins/lspconfig']],
  }
  use {
    'nvim-lua/lsp-status.nvim',
    config = [[require'plugins/lsp-status']],
  }
  use {
    'dense-analysis/ale',
    config = [[require'plugins/ale']],
  }
  use {
    'hrsh7th/nvim-cmp',
    config = [[require'plugins/nvim-cmp']],
    wants = { 'LuaSnip' },
    event = "InsertEnter",
  }
  use { 'hrsh7th/cmp-buffer', after = 'nvim-cmp' }
  use { 'hrsh7th/cmp-path', after = 'nvim-cmp' }
  use { 'hrsh7th/cmp-nvim-lua', after = 'nvim-cmp' }
  use { 'hrsh7th/cmp-nvim-lsp', after = 'nvim-cmp' }
  use { 'saadparwaiz1/cmp_luasnip', after = 'nvim-cmp' }

  -- language
  use 'rust-lang/rust.vim'
  use {
    'fatih/vim-go',
    run = ':GoUpdateBinaries',
    config = [[require'plugins/go']],
  }
  use 'pangloss/vim-javascript'
  use 'leafgarland/typescript-vim'
  use 'MaxMEllon/vim-jsx-pretty'
  use {
    'posva/vim-vue',
    config = [[require'plugins/vue']],
  }
  use 'othree/html5.vim'
end)
