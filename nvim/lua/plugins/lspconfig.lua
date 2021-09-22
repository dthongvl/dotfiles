local nvim_lsp = require('lspconfig')

nvim_lsp.rust_analyzer.setup{}
nvim_lsp.gopls.setup{}
nvim_lsp.solargraph.setup{}
nvim_lsp.sorbet.setup{
  cmd = { 'srb', 'tc', '--lsp', '--disable-watchman' }
}
nvim_lsp.html.setup{}
nvim_lsp.tsserver.setup{}
nvim_lsp.cssls.setup{}
nvim_lsp.dockerls.setup{}
nvim_lsp.jsonls.setup{}
nvim_lsp.vuels.setup{}
nvim_lsp.bashls.setup{}
nvim_lsp.vimls.setup{}
nvim_lsp.yamlls.setup{}
nvim_lsp.clangd.setup{}

local on_attach = function(client, bufnr)
  local map = vim.api.nvim_set_keymap
  local opts = { noremap = true, silent = true }

  map('n', 'gh', '<Cmd>lua vim.lsp.buf.hover()<CR>', opts)
  map('n', 'gd', '<Cmd>lua vim.lsp.buf.definition()<CR>', opts)
  map('n', 'gi', '<Cmd>lua vim.lsp.buf.implementation()<CR>', opts)
  map('n', 'gr', '<Cmd>lua vim.lsp.buf.rename()<CR>', opts)
  map('n', 'gr', '<Cmd>lua vim.lsp.buf.references()<CR>', opts)
  map('n', 'gf', '<Cmd>lua vim.lsp.buf.formatting()<CR>', opts)
  map('n', 'ge', '<cmd>lua vim.lsp.diagnostic.show_line_diagnostics()<CR>', opts)
end

local servers = { "rust_analyzer", "tsserver" , "gopls", "solargraph", "clangd" }
for _, lsp in ipairs(servers) do
  nvim_lsp[lsp].setup { on_attach = on_attach }
end
