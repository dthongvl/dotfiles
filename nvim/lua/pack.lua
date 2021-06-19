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

  -- view
  use 'ap/vim-css-color'
  use 'itchyny/lightline.vim'
  use 'Yggdroot/indentLine'

  -- theme
  use 'folke/tokyonight.nvim'
  use 'tyrannicaltoucan/vim-deep-space'

  -- navigation
  use 'christoomey/vim-tmux-navigator'
  use 'airblade/vim-rooter'
  use 'akinsho/nvim-toggleterm.lua'

  -- git
  use 'tpope/vim-fugitive'
  use 'vim-scripts/git-time-lapse'
  use 'rhysd/git-messenger.vim'
  use 'airblade/vim-gitgutter'

  -- edit
  use 'tpope/vim-surround'            -- toggle surround
  use 'AndrewRadev/splitjoin.vim'     -- split and join in vim
  use 'windwp/nvim-autopairs'

  -- devops
  use 'hashivim/vim-terraform'
  use 'pearofducks/ansible-vim'

  -- lsp
  use {'nvim-treesitter/nvim-treesitter',
       run = ':TSUpdate'}
  use 'neovim/nvim-lspconfig'
  use 'hrsh7th/nvim-compe'

  -- language
  use 'rust-lang/rust.vim'
  use 'pangloss/vim-javascript'
  use 'leafgarland/typescript-vim'
  use 'MaxMEllon/vim-jsx-pretty'
  use 'posva/vim-vue'
  use 'othree/html5.vim'
end)
