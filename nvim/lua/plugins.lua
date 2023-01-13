local cmd = vim.cmd

require('packer').startup(function()
  use 'wbthomason/packer.nvim'

  -- buffer
  use 'haya14busa/incsearch.vim'
  use {
    'akinsho/bufferline.nvim',
    requires = 'nvim-tree/nvim-web-devicons',
    config = [[require'plugins/bufferline']],
  }
  use {
    "windwp/windline.nvim",
    config = [[require'plugins/windline']],
  }
  use {
    'norcalli/nvim-colorizer.lua',
    config = [[require'plugins/nvim-colorizer']],
  }
  use {
    "lukas-reineke/indent-blankline.nvim",
    config = [[require'plugins/indent-blankline']],
  }

  -- file
  use {
    'nvim-pack/nvim-spectre',
    config = [[require'plugins/nvim-spectre']],
  }
  use {
    'nvim-tree/nvim-tree.lua',
    requires = 'nvim-tree/nvim-web-devicons',
    config = [[require'plugins/nvim-tree']],
  }
  use {
    'nvim-telescope/telescope.nvim',
    requires = {
      {'nvim-lua/plenary.nvim'}
    },
    config = [[require'plugins/telescope']],
  }

  -- theme
  use 'folke/tokyonight.nvim'
  use 'tyrannicaltoucan/vim-deep-space'
  use {
    "ellisonleao/gruvbox.nvim",
    requires = {"rktjmp/lush.nvim"},
  }
  use 'EdenEast/nightfox.nvim'
  use({
      'rose-pine/neovim',
      as = 'rose-pine',
      tag = 'v1.*',
  })
  use 'shaunsingh/nord.nvim'
  use 'NLKNguyen/papercolor-theme'
  use 'cocopon/iceberg.vim'

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
  use 'JoosepAlviste/nvim-ts-context-commentstring'
  use {
    'terrortylor/nvim-comment',
    config = [[require'plugins/nvim-comment']]
  }
  use 'tpope/vim-surround'            -- toggle surround
  use 'AndrewRadev/splitjoin.vim'     -- split and join in vim
  use {
    'windwp/nvim-autopairs',
    after = 'nvim-cmp',
    config = [[require'plugins/autopairs']],
  }
  use {
    'windwp/nvim-ts-autotag',
    config = [[require'plugins/nvim-ts-autotag']],
  }
  use {
    'p00f/nvim-ts-rainbow'
  }

  -- devops
  use 'hashivim/vim-terraform'
  use 'pearofducks/ansible-vim'

  -- lsp
  -- use {
  --   'github/copilot.vim',
  --   config = [[require'plugins/copilot']],
  -- }
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
  use 'wuelnerdotexe/vim-astro'
end)
