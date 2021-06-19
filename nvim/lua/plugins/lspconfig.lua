require'lspconfig'.rust_analyzer.setup{}
require'lspconfig'.solargraph.setup{}
require'lspconfig'.sorbet.setup{
  cmd = { 'srb', 'tc', '--lsp', '--disable-watchman' }
}
require'lspconfig'.html.setup{}
require'lspconfig'.tsserver.setup{}
require'lspconfig'.cssls.setup{}
require'lspconfig'.dockerls.setup{}
require'lspconfig'.jsonls.setup{}
require'lspconfig'.rls.setup{}
require'lspconfig'.vuels.setup{}
require'lspconfig'.bashls.setup{}
require'lspconfig'.vimls.setup{}

local map = vim.api.nvim_set_keymap
local opts = { noremap=true, silent=true }

map('n', 'gh', '<Cmd>lua vim.lsp.buf.hover()<CR>', opts)
map('n', 'gd', '<Cmd>lua vim.lsp.buf.definition()<CR>', opts)
map('n', 'gi', '<Cmd>lua vim.lsp.buf.implementation()<CR>', opts)
map('n', 'gr', '<Cmd>lua vim.lsp.buf.rename()<CR>', opts)
map('n', 'gr', '<Cmd>lua vim.lsp.buf.references()<CR>', opts)
map('n', 'gf', '<Cmd>lua vim.lsp.buf.formatting()<CR>', opts)
map('n', 'ge', '<cmd>lua vim.lsp.diagnostic.show_line_diagnostics()<CR>', opts)

