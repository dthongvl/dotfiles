call plug#begin('~/.vim/plugged')

" Fuzzy search, Ack
" remember to install ripgrep
Plug 'junegunn/fzf', { 'dir': '~/.fzf', 'do': './install --all' }
Plug 'junegunn/fzf.vim'

" Vue syntax highlight
"Plug 'leafOfTree/vim-vue-plugin'
Plug 'posva/vim-vue'

" Git
Plug 'tpope/vim-fugitive'
Plug 'rhysd/git-messenger.vim'
Plug 'airblade/vim-gitgutter'

Plug 'AndrewRadev/splitjoin.vim'
Plug 'tpope/vim-surround'
Plug 'scrooloose/nerdtree'
" must install universal-ctags
" not work with exuberant-ctags
Plug 'liuchengxu/vista.vim'
Plug 'ap/vim-css-color'
Plug 'scrooloose/nerdcommenter'

" Javascript
Plug 'pangloss/vim-javascript'
Plug 'leafgarland/typescript-vim'
Plug 'MaxMEllon/vim-jsx-pretty'

" Go
Plug 'fatih/vim-go', { 'do': ':GoUpdateBinaries' }

" Ruby
Plug 'tpope/vim-endwise'

" Ansible
Plug 'pearofducks/ansible-vim'

" Color scheme
Plug 'drewtempelmeyer/palenight.vim'

" Status line
Plug 'itchyny/lightline.vim'
Plug 'Yggdroot/indentLine'

" Lint
Plug 'dense-analysis/ale'
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

" Rust
Plug 'rust-lang/rust.vim'

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

let $FZF_DEFAULT_COMMAND='rg --files --hidden --follow --glob "!.git/*"'
"let g:vim_vue_plugin_use_sass = 1
let g:vue_pre_processors = ['scss']

let g:NERDSpaceDelims = 1

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
  \   'vue': ['eslint'],
  \   'ruby': ['rubocop'],
  \}
  " let g:ale_fix_on_save = 1
  let g:autoformat_autoindent = 0
  let g:autoformat_retab = 0
  let g:autoformat_remove_trailing_spaces = 0
endif

let g:lightline = {
  \ 'colorscheme': 'palenight',
  \ 'active': {
  \   'left': [ [ 'mode', 'paste' ], [ 'readonly', 'modified', 'filename' ] ],
  \   'right': [ [ 'lineinfo' ], [ 'filetype', 'fileencoding' ] ],
  \ },
  \ 'component_function': {
  \   'filetype': 'LightlineFiletype',
  \   'fileencoding': 'LightlineFileencoding',
  \ }
  \ }

function! LightlineFiletype()
  return winwidth(0) > 70 ? (&filetype !=# '' ? &filetype : 'no ft') : ''
endfunction

function! LightlineFileencoding()
  return winwidth(0) > 70 ? &fileencoding : ''
endfunction

let mapleader = " "
let g:mapleader = " "

:imap jj <Esc>
nmap Y y$
nmap <leader>w :w!<CR>
nmap <leader>p :FZF<CR>
map <silent> <ESC><ESC> :noh<CR>
map <silent> <leader>s :syntax sync fromstart<CR>
nmap <leader>n :NERDTreeToggle<CR>
nmap <leader>f :NERDTreeFind<CR>
noremap <Leader>aa :Ack! <cword><cr>
nnoremap <leader>a :Ack!<Space>
nmap <leader>r :Rg<CR>
nmap <F8> :Vista!!<CR>
map <leader>m <Plug>NERDCommenterToggle

" don't give |ins-completion-menu| messages.
set shortmess+=c

" always show signcolumns
set signcolumn=yes

" Use tab for trigger completion with characters ahead and navigate.
" Use command ':verbose imap <tab>' to make sure tab is not mapped by other plugin.
inoremap <silent><expr> <TAB>
      \ pumvisible() ? "\<C-n>" :
      \ <SID>check_back_space() ? "\<TAB>" :
      \ coc#refresh()
inoremap <expr><S-TAB> pumvisible() ? "\<C-p>" : "\<C-h>"

function! s:check_back_space() abort
  let col = col('.') - 1
  return !col || getline('.')[col - 1]  =~# '\s'
endfunction

" Use `[g` and `]g` to navigate diagnostics
nmap <silent> [g <Plug>(coc-diagnostic-prev)
nmap <silent> ]g <Plug>(coc-diagnostic-next)

" Remap keys for gotos
nmap <silent> gd <Plug>(coc-definition)
nmap <silent> gy <Plug>(coc-type-definition)
nmap <silent> gi <Plug>(coc-implementation)
nmap <silent> gr <Plug>(coc-references)

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
map <leader>bb :ls<cr>

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

" Auto remove trailing spaces
autocmd BufWritePre * %s/\s\+$//e

if executable('ag')
  let g:ackprg = 'ag --vimgrep'
endif

syntax on
filetype plugin indent on
set background=dark
colorscheme palenight
