local global = vim.g

global.lightline = {
  colorscheme = 'deepspace',
  active = {
    left = { { 'mode', 'paste' }, { 'readonly', 'modified', 'filename' } },
    right = { { 'lineinfo' }, { 'filetype', 'fileencoding' } },
  },
}
