local global = vim.g

global.lightline = {
  colorscheme = 'nightfox',
  active = {
    left = { { 'mode', 'paste' }, { 'readonly', 'modified', 'filename' } },
    right = { { 'lineinfo' }, { 'filetype', 'fileencoding' } },
  },
}
