local cmd = vim.cmd

require('packer').startup(function()
  use 'wbthomason/packer.nvim'

  -- buffer
  use {
    'akinsho/bufferline.nvim',
    requires = 'nvim-tree/nvim-web-devicons',
    config = [[require'plugins/bufferline']],
  }
  use {
    'nvim-lualine/lualine.nvim',
    requires = { 'kyazdani42/nvim-web-devicons', opt = true },
    config = [[require'plugins/lualine']],
  }
  use {
    'NvChad/nvim-colorizer.lua',
    config = [[require'plugins/nvim-colorizer']],
  }
  use {
    "lukas-reineke/indent-blankline.nvim",
    config = [[require'plugins/indent-blankline']],
  }
  use {
    "folke/todo-comments.nvim",
    requires = "nvim-lua/plenary.nvim",
    config = [[require'plugins/todo-comments']],
  }
  use {
    'p00f/nvim-ts-rainbow'
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
  use {
    "ellisonleao/gruvbox.nvim",
    requires = {"rktjmp/lush.nvim"},
  }
  use 'cocopon/iceberg.vim'

  -- navigation
  use 'christoomey/vim-tmux-navigator'

  -- git
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
    'numToStr/Comment.nvim',
    config = [[require'plugins/comment']],
  }
  use({
    "kylechui/nvim-surround",
    tag = "*", -- Use for stability; omit to use `main` branch for the latest features
    config = [[require'plugins/nvim-surround']],
  })
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
    "jose-elias-alvarez/null-ls.nvim",
    requires = "nvim-lua/plenary.nvim",
    config = [[require'plugins/null-ls']],
  }
  use {
    'nvim-treesitter/nvim-treesitter',
    run = ':TSUpdate',
    config = [[require'plugins/treesitter']],
  }
  use {
    'williamboman/mason.nvim',
    'williamboman/mason-lspconfig.nvim',
    'neovim/nvim-lspconfig',
    config = [[require'plugins/lspconfig']],
  }
  use {
    'nvim-treesitter/nvim-treesitter-context',
    requires = 'nvim-treesitter/nvim-treesitter',
    config = [[require'plugins/treesitter-context']],
  }
  use {
    'nvim-lua/lsp-status.nvim',
    config = [[require'plugins/lsp-status']],
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
  use {
    'posva/vim-vue',
    config = [[require'plugins/vue']],
  }
  use 'wuelnerdotexe/vim-astro'

  -- devops
  use 'hashivim/vim-terraform'
  use 'pearofducks/ansible-vim'
end)