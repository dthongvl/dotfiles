call plug#begin('~/.vim/plugged')

" Fuzzy search, Ack
" remember to install ripgrep
Plug 'junegunn/fzf', { 'dir': '~/.fzf', 'do': './install --all' }
Plug 'junegunn/fzf.vim'

" Git
Plug 'tpope/vim-fugitive'
Plug 'rhysd/git-messenger.vim'
Plug 'airblade/vim-gitgutter'

" Utils
Plug 'AndrewRadev/splitjoin.vim'
Plug 'airblade/vim-rooter'
Plug 'tpope/vim-surround'
Plug 'scrooloose/nerdtree'
Plug 'scrooloose/nerdcommenter'
Plug 'christoomey/vim-tmux-navigator'
Plug 'jiangmiao/auto-pairs'
Plug 'haya14busa/incsearch.vim'

" HTML, CSS, Javascript
Plug 'pangloss/vim-javascript'
Plug 'leafgarland/typescript-vim'
Plug 'MaxMEllon/vim-jsx-pretty'
Plug 'cakebaker/scss-syntax.vim'
Plug 'ap/vim-css-color'
Plug 'posva/vim-vue'
Plug 'othree/html5.vim'
Plug 'alvan/vim-closetag'

" Go
Plug 'fatih/vim-go', { 'do': ':GoUpdateBinaries' }

" Ruby
Plug 'tpope/vim-endwise'

" Rust
Plug 'rust-lang/rust.vim'

" Ansible
Plug 'pearofducks/ansible-vim'

" Color scheme
Plug 'drewtempelmeyer/palenight.vim'
Plug 'arcticicestudio/nord-vim'

" Status line
Plug 'itchyny/lightline.vim'
Plug 'Yggdroot/indentLine'

Plug 'dense-analysis/ale'
Plug 'neoclide/coc.nvim', {'branch': 'release'}
Plug 'nvim-treesitter/nvim-treesitter'

call plug#end()

set background=dark
" colorscheme palenight
colorscheme nord

let g:closetag_filetypes = 'html,vue'

let g:coc_global_extensions = [
  \'coc-html',
  \'coc-css',
  \'coc-solargraph',
  \'coc-tsserver',
  \'coc-vetur',
  \'coc-svg'
  \]

" Use mouse
if has('mouse')
  set mouse=a
endif

set updatetime=100
set termguicolors
set splitright
set splitbelow
set noshowmode
set relativenumber
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

" Fold
set foldmethod=indent
set foldlevel=99

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

" NERDCommenter
let g:NERDSpaceDelims = 1

" let g:git_messenger_include_diff="current"

" For Vue
let g:vue_pre_processors = ['scss']

let g:ft = ''
function! NERDCommenter_before()
  if &ft == 'vue'
    let g:ft = 'vue'
    let stack = synstack(line('.'), col('.'))
    if len(stack) > 0
      let syn = synIDattr((stack)[0], 'name')
      if len(syn) > 0
        exe 'setf ' . substitute(tolower(syn), '^vue_', '', '')
      endif
    endif
  endif
endfunction
function! NERDCommenter_after()
  if g:ft == 'vue'
    setf vue
    let g:ft = ''
  endif
endfunction

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
nmap <leader>q :q<CR>
map <silent> <ESC><ESC> :noh<CR>
map <silent> <leader>s :syntax sync fromstart<CR>
nmap <leader>n :NERDTreeToggle<CR>
nmap <leader>f :NERDTreeFind<CR>
noremap <Leader>aa :Ack! <cword><cr>
nnoremap <leader>a :Ack!<Space>
nmap <leader>r :Rg<CR>
map <leader>m <Plug>NERDCommenterToggle
map /  <Plug>(incsearch-forward)
map ?  <Plug>(incsearch-backward)
map g/ <Plug>(incsearch-stay)

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

" Highlight the symbol and its references when holding the cursor.
autocmd CursorHold * silent call CocActionAsync('highlight')

" Add `:Fold` command to fold current buffer.
command! -nargs=? Fold :call     CocAction('fold', <f-args>)

" Indent with Tab
nnoremap <S-Tab> <<
nnoremap <Tab> >>
vnoremap <Tab> >gv
vnoremap <S-Tab> <gv

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

" Go to tab by number
noremap <leader>1 1gt
noremap <leader>2 2gt
noremap <leader>3 3gt
noremap <leader>4 4gt
noremap <leader>5 5gt
noremap <leader>6 6gt
noremap <leader>7 7gt
noremap <leader>8 8gt
noremap <leader>9 9gt
noremap <leader>0 :tablast<cr>

" Switch to last tab
if !exists('g:lasttab')
  let g:lasttab = 1
endif
nmap <Leader>tl :exe "tabn ".g:lasttab<CR>
au TabLeave * let g:lasttab = tabpagenr()

" Next/Previous between buffers
map <leader>l :bnext<cr>
map <leader>h :bprevious<cr>
nnoremap <leader>bb :buffers<CR>:buffer<Space>

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

" Auto remove trailing spaces
autocmd BufWritePre * %s/\s\+$//e

if executable('ag')
  let g:ackprg = 'ag --vimgrep'
endif

syntax on
filetype plugin indent on

" Treesitter
lua <<EOF
require'nvim-treesitter.configs'.setup {
  ensure_installed = { "markdown", "vue", "go", "python", "rust", "ruby", "javascript", "typescript", "c", "cpp", "css", "html", "json" },     -- one of "all", "language", or a list of languages
  highlight = {
    enable = true,              -- false will disable the whole extension
  },
}
EOF
