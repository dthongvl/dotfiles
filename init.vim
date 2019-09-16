call plug#begin('~/.vim/plugged')

" Fuzzy search, Ack
Plug 'junegunn/fzf', { 'dir': '~/.fzf', 'do': './install --all' }
Plug 'junegunn/fzf.vim'
" sudo apt-get install silversearcher-ag
Plug 'mileszs/ack.vim'

" Vue syntax highlight
Plug 'leafOfTree/vim-vue-plugin'

" Tab to complete
Plug 'ervandew/supertab'

" Git
Plug 'tpope/vim-fugitive'
Plug 'rhysd/git-messenger.vim'
Plug 'airblade/vim-gitgutter'

Plug 'terryma/vim-multiple-cursors'
Plug 'tpope/vim-surround'
Plug 'scrooloose/nerdtree'
" sudo apt install ctags
Plug 'majutsushi/tagbar'
Plug 'ap/vim-css-color'
Plug 'tpope/vim-commentary'
Plug 'pangloss/vim-javascript'

" Ruby
Plug 'tpope/vim-endwise'
Plug 'pearofducks/ansible-vim'

" Color scheme
Plug 'drewtempelmeyer/palenight.vim'
Plug 'itchyny/lightline.vim'
Plug 'Yggdroot/indentLine'
Plug 'w0rp/ale'
Plug 'christoomey/vim-tmux-navigator'
Plug 'jiangmiao/auto-pairs'

Plug 'neoclide/coc.nvim', {'do': { -> coc#util#install()}}
" yarn global add vue-language-server
Plug 'neoclide/coc-vetur'
Plug 'neoclide/coc-json'
Plug 'neoclide/coc-html'
Plug 'neoclide/coc-css'
Plug 'neoclide/coc-tsserver'
" gem install solargraph
Plug 'neoclide/coc-solargraph'
Plug 'rust-lang/rust.vim'

Plug 'AndrewRadev/splitjoin.vim'

call plug#end()

" Use mouse
if has('mouse')
  set mouse=a
endif

set termguicolors
set splitright
set splitbelow
set noshowmode
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
set hlsearch

" Makes search act like search in modern browsers
set incsearch

" Files backup
set nobackup
set nowb
set noswapfile
set backupdir=~/tmp,/tmp
set backupcopy=yes
set backupskip=/tmp/*,$TMPDIR/*,$TMP/*,$TEMP/*
set directory=/tmp

" Turn on WiLd menu
set wildmenu

" Ignore compiled files
set wildignore+=*/.git/*,*/.hg/*,*/.svn/*,*/.DS_Store

let g:vim_vue_plugin_use_sass = 1

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
  let g:ale_sign_error = '✘'
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

let g:lightline = {
  \ 'colorscheme': 'powerline',
  \ 'active': {
  \   'left': [ [ 'mode', 'paste' ], [ 'readonly', 'modified', 'filename' ] ],
  \   'right': [ [ 'lineinfo' ], [ 'filetype', 'fileencoding' ] ],
  \ },
  \ 'component_function': {
  \   'filetype': 'LightlineFiletype',
  \   'fileencoding': 'LightlineFileencoding',
  \ }
  \ }
let g:lightline.colorscheme = 'palenight'

function! LightlineFiletype()
  return winwidth(0) > 70 ? (&filetype !=# '' ? &filetype : 'no ft') : ''
endfunction

function! LightlineFileencoding()
  return winwidth(0) > 70 ? &fileencoding : ''
endfunction

let mapleader = " "
let g:mapleader = " "

:imap jj <Esc>
nmap <leader>w :w!<CR>
nmap <C-p> :FZF<CR>
map <silent> <leader><CR> :noh<CR>
map <silent> <leader>s :syntax sync fromstart<CR>
nmap <leader>n :NERDTreeToggle<CR>
nmap <leader>F :NERDTreeFind<CR>
noremap <Leader>aa :Ack! <cword><cr>
nnoremap <leader>a :Ack!<Space>
nmap <leader>r :Rg<CR>
nmap <F8> :TagbarToggle<CR>

" Indent
nnoremap <S-Tab> <<
nnoremap <Tab> >>

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

" Next/Previous between buffers
map <leader>l :bnext<cr>
map <leader>h :bprevious<cr>

" Git
nmap <leader>j <Plug>(GitGutterNextHunk)
nmap <leader>k <Plug>(GitGutterPrevHunk)
nmap <leader>Gb :Gblame<cr>
nmap <leader>Gd :Gdiff<cr>

" Auto close NERDTree if it is the last and only buffer
autocmd bufenter * if (winnr("$") == 1 && exists("b:NERDTree") && b:NERDTree.isTabTree()) | q | endif

" Prevent FZF open file in NERDTree
autocmd VimEnter * nnoremap <silent> <expr> <C-p> (expand('%') =~ 'NERD_tree' ? "\<c-w>\<c-w>" : '').":FZF\<cr>"

" Support Vue && ES6
autocmd BufReadPost,BufNewFile *.{es6,es6.js} set filetype=javascript
autocmd BufReadPost,BufNewFile *.vue set filetype=vue
autocmd FileType vue syntax sync fromstart
autocmd FileType vue let b:autoformat_autoindent=1

" Return to last edit position when opening files (You want this!)
au BufReadPost * if line("'\"") > 1 && line("'\"") <= line("$") | exe "normal! g'\"" | endif

" Fold
au FileType ruby setlocal foldmethod=indent foldnestmax=4 foldlevelstart=1

" Delete trailing white space on save, useful for Python and CoffeeScript ;)
func! DeleteTrailingWS()
  exe "normal mz"
  %s/\s\+$//ge
  exe "normal `z"
endfunc
autocmd BufWrite *.py :call DeleteTrailingWS()
autocmd BufWrite *.coffee :call DeleteTrailingWS()
autocmd BufWrite *.sql :call DeleteTrailingWS()
autocmd BufWrite *.md :call DeleteTrailingWS()
autocmd BufWrite *.vue :call DeleteTrailingWS()
autocmd BufWrite *.rb :call DeleteTrailingWS()

if executable('ag')
  let g:ackprg = 'ag --vimgrep'
endif

syntax on
filetype plugin indent on
set background=dark
colorscheme palenight

