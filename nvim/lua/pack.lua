local cmd = vim.cmd

require('packer').startup(function()
  use 'wbthomason/packer.nvim'

  -- dependencies
  use 'nvim-lua/popup.nvim'
  use 'nvim-lua/plenary.nvim'

  -- buffer
  use 'haya14busa/incsearch.vim'
  use 'preservim/nerdcommenter'

  -- file
  use 'preservim/nerdtree'
  use 'junegunn/fzf.vim'
  use {'junegunn/fzf', run = 'fzf#install'}
  use {
    'nvim-telescope/telescope.nvim',
    requires = {{'nvim-lua/popup.nvim'}, {'nvim-lua/plenary.nvim'}}
  }

  -- view
  -- use 'ap/vim-css-color'
  use 'norcalli/nvim-colorizer.lua'
  -- use 'itchyny/lightline.vim'
  -- use 'Yggdroot/indentLine'
  use "lukas-reineke/indent-blankline.nvim"
  use {
    'hoob3rt/lualine.nvim',
    requires = {'kyazdani42/nvim-web-devicons', opt = true}
  }
  use {
      'kyazdani42/nvim-tree.lua',
      requires = 'kyazdani42/nvim-web-devicons'
  }

  -- theme
  use 'folke/tokyonight.nvim'
  use 'tyrannicaltoucan/vim-deep-space'
  use 'EdenEast/nightfox.nvim'

  -- navigation
  use 'christoomey/vim-tmux-navigator'
  use 'airblade/vim-rooter'

  -- git
  use 'tpope/vim-fugitive'
  use 'vim-scripts/git-time-lapse'
  -- use 'airblade/vim-gitgutter'
  use 'lewis6991/gitsigns.nvim'
  use 'tpope/vim-rhubarb'
  use { 'TimUntersberger/neogit', requires = 'nvim-lua/plenary.nvim' }
  use 'sindrets/diffview.nvim'

  -- edit
  use 'tpope/vim-surround'            -- toggle surround
  use 'AndrewRadev/splitjoin.vim'     -- split and join in vim
  use 'windwp/nvim-autopairs'
  use 'windwp/nvim-ts-autotag'

  -- devops
  use 'hashivim/vim-terraform'
  use 'pearofducks/ansible-vim'

  -- lsp
  use {'nvim-treesitter/nvim-treesitter',
       run = ':TSUpdate'}
  use 'neovim/nvim-lspconfig'
  use 'nvim-lua/lsp-status.nvim'
  use 'hrsh7th/nvim-compe'
  use 'dense-analysis/ale'

  -- language
  use 'rust-lang/rust.vim'
  use { 'fatih/vim-go', run = ':GoUpdateBinaries' }
  use 'pangloss/vim-javascript'
  use 'leafgarland/typescript-vim'
  use 'MaxMEllon/vim-jsx-pretty'
  use 'posva/vim-vue'
  use 'othree/html5.vim'
end)
