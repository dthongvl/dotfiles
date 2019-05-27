call plug#begin('~/.vim/plugged')

Plug 'junegunn/fzf', { 'dir': '~/.fzf', 'do': './install --all' }
Plug 'junegunn/fzf.vim'
Plug 'terryma/vim-multiple-cursors'
Plug 'tpope/vim-fugitive'
Plug 'airblade/vim-gitgutter'
Plug 'tpope/vim-surround'
Plug 'scrooloose/nerdtree'
Plug 'vim-airline/vim-airline'
Plug 'vim-airline/vim-airline-themes'
" sudo apt install ctags
Plug 'majutsushi/tagbar'
Plug 'ap/vim-css-color'
Plug 'tpope/vim-commentary'
Plug 'mileszs/ack.vim'
Plug 'leafOfTree/vim-vue-plugin'
Plug 'morhetz/gruvbox'
Plug 'Yggdroot/indentLine'
Plug 'ryanoasis/vim-devicons'
Plug 'jiangmiao/auto-pairs'
Plug 'w0rp/ale'
Plug 'christoomey/vim-tmux-navigator'
Plug 'editorconfig/editorconfig-vim'
if has('nvim') && has("python3")
  Plug 'Shougo/deoplete.nvim', { 'do': ':UpdateRemotePlugins' }
  Plug 'fishbullet/deoplete-ruby'
endif

call plug#end()

" Use mouse
if has('mouse')
  set mouse=a
endif
set termguicolors
set splitright
set splitbelow
" Tab indent
set expandtab
set tabstop=2
set softtabstop=2
set shiftwidth=2
" Copy/from to clipboard
set clipboard=unnamedplus
" Show line number
set number
set nowrap
set autoindent
set si

" Auto read/write
set autoread
set autowrite

" When search
set ignorecase
set smartcase

" Files backup
set nobackup
set nowb
set noswapfile
set backupdir=~/tmp,/tmp
set backupcopy=yes
set backupskip=/tmp/*,$TMPDIR/*,$TMP/*,$TEMP/*
set directory=/tmp

let g:gruvbox_contrast_dark = 'hard'

"Remap key to split screen
let NERDTreeMapOpenVSplit ='<C-v>'
let NERDTreeMapOpenSplit ='<C-x>'
let NERDTreeMapOpenInTab ='<C-t>'
let NERDTreeMinimalUI = 1
let NERDTreeDirArrows = 1

if has('nvim')
""""""""""""""""
"" ale
" Error and warning signs.
let g:ale_sign_error = '⤫'
let g:ale_sign_warning = '⚠'
let g:ale_linter_aliases = {'vue': ['vue', 'javascript']}
let g:ale_linters = {'vue': ['eslint', 'vls']}
let g:ale_fixers = {
\   'javascript': ['eslint'],
\   'vue': ['eslint']
\}
" let g:ale_fix_on_save = 1
let g:autoformat_autoindent = 0
let g:autoformat_retab = 0
let g:autoformat_remove_trailing_spaces = 0
endif

let mapleader = ","
let g:mapleader = ","

let g:deoplete#enable_at_startup = 1
let g:deoplete#enable_smart_case = 1

let g:vim_vue_plugin_use_sass = 1

let g:airline_powerline_fonts = 1
let g:airline_theme = "solarized_flood"
let g:airline#extensions#ale#enabled = 1
let g:airline#extensions#branch#enabled = 0

:imap jj <Esc>
nmap <leader>w :w!<CR>
nmap <C-p> :FZF<CR>
map <silent> <leader><CR> :noh<CR>
map <silent> <leader>s :syntax sync fromstart<CR>
nmap <leader>n :NERDTreeToggle<CR>
nmap <leader>F :NERDTreeFind<CR>
nmap <F8> :TagbarToggle<CR>
noremap <Leader>a :Ack!

" Move between windows
map <C-j> <C-W>j
map <C-k> <C-W>k
map <C-l> <C-W>l
map <C-h> <C-W>h

" Mapping for managing tabs
map <leader>tn :tabnew<cr>
map <leader>to :tabonly<cr>
map <leader>tc :tabclose<cr>
map <leader>tm :tabmove<cr>
map <leader>t<leader> :tabnext

" Auto close NERDTree if it is the last and only buffer
autocmd bufenter * if (winnr("$") == 1 && exists("b:NERDTree") && b:NERDTree.isTabTree()) | q | endif

" Prevent FZF open file in NERDTree
autocmd VimEnter * nnoremap <silent> <expr> <C-p> (expand('%') =~ 'NERD_tree' ? "\<c-w>\<c-w>" : '').":FZF\<cr>"

" Support Vue && ES6
autocmd BufReadPost,BufNewFile *.es6 set syntax=javascript
autocmd BufReadPost,BufNewFile *.vue setlocal filetype=vue
autocmd FileType vue syntax sync fromstart
autocmd FileType vue let b:autoformat_autoindent=1

" Return to last edit position when opening files (You want this!)
au BufReadPost * if line("'\"") > 1 && line("'\"") <= line("$") | exe "normal! g'\"" | endif

" sudo apt-get install silversearcher-ag
if executable('ag')
  let g:ackprg = 'ag --vimgrep'
endif

syntax on
colorscheme gruvbox
